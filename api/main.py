from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import time
import os
import json
import zipfile
import io

from Main import run_multi_agent_diagnosis
from api.db.database import get_db
from api.models.case import MedicalCase, DiagnosisHistory
from api.utils.case_formatter import CaseFormatter
from api.utils.txt_parser import parse_txt_file
from api.utils.export import DiagnosisExporter

app = FastAPI(title="AI Medical Diagnostics API")

# 配置 CORS - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3002", "http://127.0.0.1:3002"],  # 前端开发服务器地址（包括 React Vite 和 Next.js）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Pydantic 响应模型 ----

class Case(BaseModel):
    id: int
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    chief_complaint: Optional[str] = None

    class Config:
        from_attributes = True  # 允许从 ORM 模型转换


# ---- 路由定义 ----

@app.get("/api/cases", response_model=List[Case])
async def list_cases(db: Session = Depends(get_db)) -> List[Case]:
    """获取病例列表（从数据库查询）"""
    cases = db.query(MedicalCase).order_by(MedicalCase.created_at.desc()).all()
    return cases


class CaseDetail(BaseModel):
    id: int
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    chief_complaint: Optional[str] = None
    raw_report: str
    created_at: datetime

    class Config:
        from_attributes = True


@app.get("/api/cases/{case_id}", response_model=CaseDetail)
async def get_case_detail(case_id: int, db: Session = Depends(get_db)) -> CaseDetail:
    """获取单个病例的详细信息"""
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")
    return case


class CreateCaseRequest(BaseModel):
    """新增病例请求"""
    patient_id: str
    patient_name: str
    age: int
    gender: str  # male/female/other
    chief_complaint: str
    medical_history: Optional[str] = None
    family_history: Optional[str] = None
    lifestyle_factors: Optional[str] = None
    medications: Optional[str] = None
    lab_results: Optional[str] = None
    physical_exam: Optional[str] = None
    vital_signs: Optional[str] = None
    language: str = "en"  # en/zh/both


class CreateCaseResponse(BaseModel):
    """新增病例响应"""
    id: int
    patient_id: str
    patient_name: str
    message: str


@app.post("/api/cases", response_model=CreateCaseResponse)
async def create_case(request: CreateCaseRequest, db: Session = Depends(get_db)) -> CreateCaseResponse:
    """
    新增病例

    将用户输入的结构化信息转换为标准病例报告格式并保存到数据库
    支持中文、英文和双语格式
    """
    # 检查 patient_id 是否已存在
    existing_case = db.query(MedicalCase).filter(MedicalCase.patient_id == request.patient_id).first()
    if existing_case:
        raise HTTPException(status_code=400, detail=f"病历号 {request.patient_id} 已存在")

    # 使用格式化器生成标准病例报告
    raw_report = CaseFormatter.format_case_report(
        patient_id=request.patient_id,
        patient_name=request.patient_name,
        age=request.age,
        gender=request.gender,
        chief_complaint=request.chief_complaint,
        medical_history=request.medical_history,
        family_history=request.family_history,
        lifestyle_factors=request.lifestyle_factors,
        medications=request.medications,
        lab_results=request.lab_results,
        physical_exam=request.physical_exam,
        vital_signs=request.vital_signs,
        language=request.language
    )

    # 创建病例记录
    new_case = MedicalCase(
        patient_id=request.patient_id,
        patient_name=request.patient_name,
        age=request.age,
        gender=request.gender,
        chief_complaint=request.chief_complaint,
        raw_report=raw_report
    )

    try:
        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        return CreateCaseResponse(
            id=new_case.id,
            patient_id=new_case.patient_id,
            patient_name=new_case.patient_name,
            message="病例创建成功"
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="病例创建失败，请检查数据")



class DiagnosisResponse(BaseModel):
    case_id: int
    diagnosis_markdown: str


@app.post("/api/cases/{case_id}/run-diagnosis", response_model=DiagnosisResponse)
async def run_diagnosis(case_id: int, db: Session = Depends(get_db)) -> DiagnosisResponse:
    """对指定病例运行多智能体 AI 诊断，并保存到数据库

    流程：
    1. 从数据库读取病例的 raw_report
    2. 调用 run_multi_agent_diagnosis 生成诊断结果
    3. 将诊断结果保存到 diagnosis_history 表
    4. 返回诊断结果给前端
    """
    # 1. 查询病例
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 2. 运行诊断（记录执行时间）
    start_time = time.time()
    diagnosis_md = run_multi_agent_diagnosis(case.raw_report)
    execution_time_ms = int((time.time() - start_time) * 1000)

    # 3. 保存诊断历史
    # 从环境变量获取当前使用的模型名称
    model_name = os.getenv("LLM_MODEL", "gemini-2.5-flash")
    diagnosis_record = DiagnosisHistory(
        case_id=case_id,
        diagnosis_markdown=diagnosis_md,
        model_name=model_name,
        run_timestamp=datetime.utcnow(),
        execution_time_ms=execution_time_ms
    )
    db.add(diagnosis_record)
    db.commit()
    db.refresh(diagnosis_record)

    # 4. 返回结果
    return DiagnosisResponse(case_id=case_id, diagnosis_markdown=diagnosis_md)


class DiagnosisHistoryItem(BaseModel):
    """诊断历史项"""
    id: int
    timestamp: datetime
    model: str
    execution_time_ms: int
    diagnosis_preview: str
    diagnosis_full: Optional[str] = None

    class Config:
        from_attributes = True


class DiagnosisHistoryResponse(BaseModel):
    """诊断历史响应"""
    case_id: int
    patient_name: Optional[str]
    patient_id: Optional[str]
    total_diagnoses: int
    history: List[DiagnosisHistoryItem]


@app.get("/api/cases/{case_id}/diagnoses", response_model=DiagnosisHistoryResponse)
async def get_diagnosis_history(
    case_id: int,
    include_full: bool = False,
    db: Session = Depends(get_db)
) -> DiagnosisHistoryResponse:
    """
    获取指定病例的诊断历史记录

    参数:
    - case_id: 病例ID
    - include_full: 是否包含完整的诊断内容（默认只返回预览）
    """
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    diagnoses = db.query(DiagnosisHistory).filter(
        DiagnosisHistory.case_id == case_id
    ).order_by(DiagnosisHistory.run_timestamp.desc()).all()

    history_items = []
    for d in diagnoses:
        diagnosis_preview = d.diagnosis_markdown[:200] + "..." if len(d.diagnosis_markdown) > 200 else d.diagnosis_markdown
        item = DiagnosisHistoryItem(
            id=d.id,
            timestamp=d.run_timestamp,
            model=d.model_name,
            execution_time_ms=d.execution_time_ms,
            diagnosis_preview=diagnosis_preview,
            diagnosis_full=d.diagnosis_markdown if include_full else None
        )
        history_items.append(item)

    return DiagnosisHistoryResponse(
        case_id=case_id,
        patient_name=case.patient_name,
        patient_id=case.patient_id,
        total_diagnoses=len(diagnoses),
        history=history_items
    )


@app.get("/api/cases/{case_id}/diagnoses/{diagnosis_id}")
async def get_diagnosis_detail(case_id: int, diagnosis_id: int, db: Session = Depends(get_db)):
    """获取单个诊断的完整详情"""
    diagnosis = db.query(DiagnosisHistory).filter(
        DiagnosisHistory.id == diagnosis_id,
        DiagnosisHistory.case_id == case_id
    ).first()

    if not diagnosis:
        raise HTTPException(status_code=404, detail=f"诊断记录不存在")

    return {
        "id": diagnosis.id,
        "case_id": diagnosis.case_id,
        "timestamp": diagnosis.run_timestamp.isoformat(),
        "model": diagnosis.model_name,
        "execution_time_ms": diagnosis.execution_time_ms,
        "diagnosis_markdown": diagnosis.diagnosis_markdown
    }


class ImportCasesResponse(BaseModel):
    """批量导入病例响应"""
    success_count: int
    failed_count: int
    total_count: int
    failed_cases: List[dict]
    message: str


@app.post("/api/cases/import", response_model=ImportCasesResponse)
async def import_cases(file: UploadFile = File(...), db: Session = Depends(get_db)) -> ImportCasesResponse:
    """
    批量导入病例

    支持的文件格式：
    - JSON 文件：包含病例数组，每个病例需包含必要字段
    - TXT 文件：纯文本病历报告（每个文件作为一个病例）
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="未选择文件")

    filename = file.filename.lower()
    success_count = 0
    failed_count = 0
    failed_cases = []

    try:
        content = await file.read()

        # 处理 JSON 文件
        if filename.endswith('.json'):
            try:
                data = json.loads(content.decode('utf-8'))
                cases_data = data if isinstance(data, list) else [data]

                for idx, case_data in enumerate(cases_data):
                    try:
                        # 验证必填字段
                        required_fields = ['patient_id', 'patient_name', 'age', 'gender', 'chief_complaint']
                        missing_fields = [f for f in required_fields if f not in case_data]
                        if missing_fields:
                            failed_cases.append({
                                "index": idx,
                                "patient_id": case_data.get('patient_id', 'unknown'),
                                "error": f"缺少必填字段: {', '.join(missing_fields)}"
                            })
                            failed_count += 1
                            continue

                        # 检查是否已存在
                        existing = db.query(MedicalCase).filter(
                            MedicalCase.patient_id == case_data['patient_id']
                        ).first()
                        if existing:
                            failed_cases.append({
                                "index": idx,
                                "patient_id": case_data['patient_id'],
                                "error": "病历号已存在"
                            })
                            failed_count += 1
                            continue

                        # 使用格式化器生成报告（如果提供了 raw_report 则直接使用）
                        if 'raw_report' in case_data and case_data['raw_report']:
                            raw_report = case_data['raw_report']
                        else:
                            raw_report = CaseFormatter.format_case_report(
                                patient_id=case_data['patient_id'],
                                patient_name=case_data['patient_name'],
                                age=case_data['age'],
                                gender=case_data['gender'],
                                chief_complaint=case_data['chief_complaint'],
                                medical_history=case_data.get('medical_history'),
                                family_history=case_data.get('family_history'),
                                lifestyle_factors=case_data.get('lifestyle_factors'),
                                medications=case_data.get('medications'),
                                lab_results=case_data.get('lab_results'),
                                physical_exam=case_data.get('physical_exam'),
                                vital_signs=case_data.get('vital_signs'),
                                language=case_data.get('language', 'en')
                            )

                        # 创建病例
                        new_case = MedicalCase(
                            patient_id=case_data['patient_id'],
                            patient_name=case_data['patient_name'],
                            age=case_data['age'],
                            gender=case_data['gender'],
                            chief_complaint=case_data['chief_complaint'],
                            raw_report=raw_report
                        )
                        db.add(new_case)
                        db.commit()
                        success_count += 1

                    except Exception as e:
                        db.rollback()
                        failed_cases.append({
                            "index": idx,
                            "patient_id": case_data.get('patient_id', 'unknown'),
                            "error": str(e)
                        })
                        failed_count += 1

            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="无效的 JSON 文件格式")

        # 处理 TXT 文件（使用智能解析器）
        elif filename.endswith('.txt'):
            try:
                content_str = content.decode('utf-8')

                # 使用智能解析器
                parse_result = parse_txt_file(content_str)

                if not parse_result.success:
                    # 解析失败，返回详细错误
                    failed_cases.append({
                        "index": 0,
                        "patient_id": parse_result.data.get('patient_id', 'unknown'),
                        "error": "解析失败: " + ", ".join(parse_result.errors)
                    })
                    failed_count = 1
                else:
                    # 检查重复
                    patient_id = parse_result.data.get('patient_id')
                    existing = db.query(MedicalCase).filter(
                        MedicalCase.patient_id == patient_id
                    ).first()

                    if existing:
                        failed_cases.append({
                            "index": 0,
                            "patient_id": patient_id,
                            "error": "病历号已存在"
                        })
                        failed_count = 1
                    else:
                        # 生成格式化报告
                        raw_report = CaseFormatter.format_case_report(
                            patient_id=parse_result.data['patient_id'],
                            patient_name=parse_result.data['patient_name'],
                            age=parse_result.data['age'],
                            gender=parse_result.data['gender'],
                            chief_complaint=parse_result.data['chief_complaint'],
                            medical_history=parse_result.data.get('medical_history'),
                            family_history=parse_result.data.get('family_history'),
                            lifestyle_factors=parse_result.data.get('lifestyle_factors'),
                            medications=parse_result.data.get('medications'),
                            lab_results=parse_result.data.get('lab_results'),
                            physical_exam=parse_result.data.get('physical_exam'),
                            vital_signs=parse_result.data.get('vital_signs'),
                            language='en'  # 根据检测的格式决定
                        )

                        # 创建病例
                        new_case = MedicalCase(
                            patient_id=parse_result.data['patient_id'],
                            patient_name=parse_result.data['patient_name'],
                            age=parse_result.data['age'],
                            gender=parse_result.data['gender'],
                            chief_complaint=parse_result.data['chief_complaint'],
                            raw_report=raw_report
                        )
                        db.add(new_case)
                        db.commit()
                        success_count = 1

            except UnicodeDecodeError:
                # 尝试其他编码
                try:
                    content_str = content.decode('gbk')
                    parse_result = parse_txt_file(content_str)
                    # 处理逻辑与上面相同（这里简化处理）
                    if parse_result.success:
                        failed_cases.append({
                            "index": 0,
                            "patient_id": "unknown",
                            "error": "文件编码为 GBK，请转换为 UTF-8"
                        })
                        failed_count = 1
                except:
                    raise HTTPException(status_code=400, detail="文件编码错误，请确保使用 UTF-8 编码")
            except Exception as e:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"导入失败: {str(e)}")

        else:
            raise HTTPException(status_code=400, detail="不支持的文件格式，请上传 JSON 或 TXT 文件")

        total_count = success_count + failed_count
        return ImportCasesResponse(
            success_count=success_count,
            failed_count=failed_count,
            total_count=total_count,
            failed_cases=failed_cases,
            message=f"导入完成：成功 {success_count} 个，失败 {failed_count} 个"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件处理失败: {str(e)}")


class UpdateCaseRequest(BaseModel):
    """更新病例请求"""
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    chief_complaint: Optional[str] = None
    medical_history: Optional[str] = None
    family_history: Optional[str] = None
    lifestyle_factors: Optional[str] = None
    medications: Optional[str] = None
    lab_results: Optional[str] = None
    physical_exam: Optional[str] = None
    vital_signs: Optional[str] = None
    language: Optional[str] = None


@app.put("/api/cases/{case_id}", response_model=CaseDetail)
async def update_case(case_id: int, request: UpdateCaseRequest, db: Session = Depends(get_db)) -> CaseDetail:
    """
    更新病例信息

    可以更新病例的任何字段，未提供的字段保持不变
    如果更新了基本信息，会重新生成格式化的病历报告
    """
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 检查 patient_id 是否与其他病例冲突
    if request.patient_id and request.patient_id != case.patient_id:
        existing = db.query(MedicalCase).filter(
            MedicalCase.patient_id == request.patient_id,
            MedicalCase.id != case_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"病历号 {request.patient_id} 已被其他病例使用")

    # 记录是否需要重新生成报告
    need_regenerate = False
    update_data = {}

    # 更新基本信息字段
    if request.patient_id is not None:
        update_data['patient_id'] = request.patient_id
        need_regenerate = True
    if request.patient_name is not None:
        update_data['patient_name'] = request.patient_name
        need_regenerate = True
    if request.age is not None:
        update_data['age'] = request.age
        need_regenerate = True
    if request.gender is not None:
        update_data['gender'] = request.gender
        need_regenerate = True
    if request.chief_complaint is not None:
        update_data['chief_complaint'] = request.chief_complaint
        need_regenerate = True

    # 如果有任何字段更新，重新生成报告
    if need_regenerate or any([
        request.medical_history, request.family_history, request.lifestyle_factors,
        request.medications, request.lab_results, request.physical_exam, request.vital_signs
    ]):
        raw_report = CaseFormatter.format_case_report(
            patient_id=request.patient_id or case.patient_id,
            patient_name=request.patient_name or case.patient_name,
            age=request.age if request.age is not None else case.age,
            gender=request.gender or case.gender,
            chief_complaint=request.chief_complaint or case.chief_complaint,
            medical_history=request.medical_history or "",
            family_history=request.family_history or "",
            lifestyle_factors=request.lifestyle_factors or "",
            medications=request.medications or "",
            lab_results=request.lab_results or "",
            physical_exam=request.physical_exam or "",
            vital_signs=request.vital_signs or "",
            language=request.language or "en"
        )
        update_data['raw_report'] = raw_report

    # 应用更新
    for key, value in update_data.items():
        setattr(case, key, value)

    try:
        db.commit()
        db.refresh(case)
        return case
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="更新失败，请检查数据")


@app.delete("/api/cases/{case_id}")
async def delete_case(case_id: int, db: Session = Depends(get_db)):
    """删除指定病例及其所有诊断历史"""
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 删除相关的诊断历史
    db.query(DiagnosisHistory).filter(DiagnosisHistory.case_id == case_id).delete()

    # 删除病例
    db.delete(case)
    db.commit()

    return {"message": f"病例 {case_id} 已成功删除", "deleted_case_id": case_id}


# ---- 导出功能 API ----

@app.get("/api/cases/{case_id}/export")
async def export_latest_diagnosis(
    case_id: int,
    format: str = "pdf",
    db: Session = Depends(get_db)
):
    """
    导出病例的最新诊断报告

    支持格式：pdf, docx, markdown, json
    """
    # 查询病例
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 查询最新的诊断记录
    latest_diagnosis = db.query(DiagnosisHistory).filter(
        DiagnosisHistory.case_id == case_id
    ).order_by(DiagnosisHistory.run_timestamp.desc()).first()

    if not latest_diagnosis:
        raise HTTPException(status_code=404, detail=f"病例 {case_id} 还没有诊断记录")

    # 根据格式导出
    try:
        if format.lower() == "pdf":
            file_bytes = DiagnosisExporter.export_to_pdf(
                diagnosis_markdown=latest_diagnosis.diagnosis_markdown,
                patient_name=case.patient_name or "Unknown",
                patient_id=case.patient_id or "Unknown",
                case_id=case_id,
                diagnosis_id=latest_diagnosis.id,
                timestamp=latest_diagnosis.run_timestamp.isoformat() if latest_diagnosis.run_timestamp else None
            )
            media_type = "application/pdf"
            filename = f"diagnosis-{case_id}.pdf"

        elif format.lower() == "docx":
            file_bytes = DiagnosisExporter.export_to_docx(
                diagnosis_markdown=latest_diagnosis.diagnosis_markdown,
                patient_name=case.patient_name or "Unknown",
                patient_id=case.patient_id or "Unknown",
                case_id=case_id,
                diagnosis_id=latest_diagnosis.id,
                timestamp=latest_diagnosis.run_timestamp.isoformat() if latest_diagnosis.run_timestamp else None
            )
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            filename = f"diagnosis-{case_id}.docx"

        elif format.lower() == "markdown" or format.lower() == "md":
            file_bytes = DiagnosisExporter.export_to_markdown(
                diagnosis_markdown=latest_diagnosis.diagnosis_markdown,
                patient_name=case.patient_name or "Unknown",
                patient_id=case.patient_id or "Unknown",
                case_id=case_id,
                diagnosis_id=latest_diagnosis.id,
                timestamp=latest_diagnosis.run_timestamp.isoformat() if latest_diagnosis.run_timestamp else None
            )
            media_type = "text/markdown"
            filename = f"diagnosis-{case_id}.md"

        elif format.lower() == "json":
            file_bytes = DiagnosisExporter.export_to_json(
                diagnosis_markdown=latest_diagnosis.diagnosis_markdown,
                patient_name=case.patient_name or "Unknown",
                patient_id=case.patient_id or "Unknown",
                case_id=case_id,
                diagnosis_id=latest_diagnosis.id,
                timestamp=latest_diagnosis.run_timestamp.isoformat() if latest_diagnosis.run_timestamp else None,
                model=latest_diagnosis.model_name,
                execution_time_ms=latest_diagnosis.execution_time_ms
            )
            media_type = "application/json"
            filename = f"diagnosis-{case_id}.json"
        else:
            raise HTTPException(status_code=400, detail=f"不支持的导出格式: {format}")

        return Response(
            content=file_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")


@app.get("/api/cases/{case_id}/diagnoses/{diagnosis_id}/export")
async def export_specific_diagnosis(
    case_id: int,
    diagnosis_id: int,
    format: str = "pdf",
    db: Session = Depends(get_db)
):
    """
    导出指定的诊断记录

    支持格式：pdf, docx, markdown, json
    """
    # 查询病例
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 查询指定的诊断记录
    diagnosis = db.query(DiagnosisHistory).filter(
        DiagnosisHistory.id == diagnosis_id,
        DiagnosisHistory.case_id == case_id
    ).first()

    if not diagnosis:
        raise HTTPException(status_code=404, detail=f"诊断记录 ID {diagnosis_id} 不存在")

    # 根据格式导出
    try:
        if format.lower() == "pdf":
            file_bytes = DiagnosisExporter.export_to_pdf(
                diagnosis_markdown=diagnosis.diagnosis_markdown,
                patient_name=case.patient_name or "Unknown",
                patient_id=case.patient_id or "Unknown",
                case_id=case_id,
                diagnosis_id=diagnosis_id,
                timestamp=diagnosis.run_timestamp.isoformat() if diagnosis.run_timestamp else None
            )
            media_type = "application/pdf"
            filename = f"diagnosis-{diagnosis_id}.pdf"

        elif format.lower() == "docx":
            file_bytes = DiagnosisExporter.export_to_docx(
                diagnosis_markdown=diagnosis.diagnosis_markdown,
                patient_name=case.patient_name or "Unknown",
                patient_id=case.patient_id or "Unknown",
                case_id=case_id,
                diagnosis_id=diagnosis_id,
                timestamp=diagnosis.run_timestamp.isoformat() if diagnosis.run_timestamp else None
            )
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            filename = f"diagnosis-{diagnosis_id}.docx"

        elif format.lower() == "markdown" or format.lower() == "md":
            file_bytes = DiagnosisExporter.export_to_markdown(
                diagnosis_markdown=diagnosis.diagnosis_markdown,
                patient_name=case.patient_name or "Unknown",
                patient_id=case.patient_id or "Unknown",
                case_id=case_id,
                diagnosis_id=diagnosis_id,
                timestamp=diagnosis.run_timestamp.isoformat() if diagnosis.run_timestamp else None
            )
            media_type = "text/markdown"
            filename = f"diagnosis-{diagnosis_id}.md"

        elif format.lower() == "json":
            file_bytes = DiagnosisExporter.export_to_json(
                diagnosis_markdown=diagnosis.diagnosis_markdown,
                patient_name=case.patient_name or "Unknown",
                patient_id=case.patient_id or "Unknown",
                case_id=case_id,
                diagnosis_id=diagnosis_id,
                timestamp=diagnosis.run_timestamp.isoformat() if diagnosis.run_timestamp else None,
                model=diagnosis.model_name,
                execution_time_ms=diagnosis.execution_time_ms
            )
            media_type = "application/json"
            filename = f"diagnosis-{diagnosis_id}.json"
        else:
            raise HTTPException(status_code=400, detail=f"不支持的导出格式: {format}")

        return Response(
            content=file_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")


class BatchExportRequest(BaseModel):
    """批量导出请求"""
    diagnosis_ids: List[int]
    format: str = "pdf"


@app.post("/api/cases/{case_id}/export-batch")
async def export_diagnoses_batch(
    case_id: int,
    request: BatchExportRequest,
    db: Session = Depends(get_db)
):
    """
    批量导出诊断记录为ZIP压缩包

    支持格式：pdf, docx, markdown, json
    """
    # 查询病例
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    if not request.diagnosis_ids:
        raise HTTPException(status_code=400, detail="diagnosis_ids 不能为空")

    # 创建ZIP文件
    zip_buffer = io.BytesIO()

    try:
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 遍历每个诊断ID
            for diagnosis_id in request.diagnosis_ids:
                # 查询诊断记录
                diagnosis = db.query(DiagnosisHistory).filter(
                    DiagnosisHistory.id == diagnosis_id,
                    DiagnosisHistory.case_id == case_id
                ).first()

                if not diagnosis:
                    continue  # 跳过不存在的诊断记录

                # 根据格式导出
                if request.format.lower() == "pdf":
                    file_bytes = DiagnosisExporter.export_to_pdf(
                        diagnosis_markdown=diagnosis.diagnosis_markdown,
                        patient_name=case.patient_name or "Unknown",
                        patient_id=case.patient_id or "Unknown",
                        case_id=case_id,
                        diagnosis_id=diagnosis_id,
                        timestamp=diagnosis.run_timestamp.isoformat() if diagnosis.run_timestamp else None
                    )
                    filename = f"diagnosis-{diagnosis_id}.pdf"

                elif request.format.lower() == "docx":
                    file_bytes = DiagnosisExporter.export_to_docx(
                        diagnosis_markdown=diagnosis.diagnosis_markdown,
                        patient_name=case.patient_name or "Unknown",
                        patient_id=case.patient_id or "Unknown",
                        case_id=case_id,
                        diagnosis_id=diagnosis_id,
                        timestamp=diagnosis.run_timestamp.isoformat() if diagnosis.run_timestamp else None
                    )
                    filename = f"diagnosis-{diagnosis_id}.docx"

                elif request.format.lower() == "markdown" or request.format.lower() == "md":
                    file_bytes = DiagnosisExporter.export_to_markdown(
                        diagnosis_markdown=diagnosis.diagnosis_markdown,
                        patient_name=case.patient_name or "Unknown",
                        patient_id=case.patient_id or "Unknown",
                        case_id=case_id,
                        diagnosis_id=diagnosis_id,
                        timestamp=diagnosis.run_timestamp.isoformat() if diagnosis.run_timestamp else None
                    )
                    filename = f"diagnosis-{diagnosis_id}.md"

                elif request.format.lower() == "json":
                    file_bytes = DiagnosisExporter.export_to_json(
                        diagnosis_markdown=diagnosis.diagnosis_markdown,
                        patient_name=case.patient_name or "Unknown",
                        patient_id=case.patient_id or "Unknown",
                        case_id=case_id,
                        diagnosis_id=diagnosis_id,
                        timestamp=diagnosis.run_timestamp.isoformat() if diagnosis.run_timestamp else None,
                        model=diagnosis.model_name,
                        execution_time_ms=diagnosis.execution_time_ms
                    )
                    filename = f"diagnosis-{diagnosis_id}.json"
                else:
                    raise HTTPException(status_code=400, detail=f"不支持的导出格式: {request.format}")

                # 添加文件到ZIP
                zip_file.writestr(filename, file_bytes)

        # 获取ZIP数据
        zip_buffer.seek(0)
        zip_bytes = zip_buffer.getvalue()

        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="diagnosis-batch-{case_id}.zip"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量导出失败: {str(e)}")

