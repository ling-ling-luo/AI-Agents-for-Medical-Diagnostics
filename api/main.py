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
from api.models.user import User
from api.utils.case_formatter import CaseFormatter
from api.utils.txt_parser import parse_txt_file
from api.utils.export import DiagnosisExporter
from api.utils.case_id_generator import generate_case_id
from api.config_loader import ConfigLoader
from api.auth.permissions import (
    require_case_create, require_case_read, require_case_update, require_case_delete,
    require_diagnosis_create, require_diagnosis_read, require_diagnosis_execute
)
from api.routes import auth, users, roles

app = FastAPI(title="AI Medical Diagnostics API")

# 注册认证相关路由
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)

# 从配置文件加载支持的AI模型列表
AVAILABLE_MODELS = ConfigLoader.load_models()

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

@app.get("/api/models")
async def get_available_models():
    """获取所有支持的AI模型列表"""
    return {"models": AVAILABLE_MODELS}


@app.get("/api/cases", response_model=List[Case])
async def list_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_case_read)
) -> List[Case]:
    """
    获取病例列表（需要 case:read 权限）
    - 管理员(admin)和医生(doctor)：可以看到所有病例
    - 普通用户(viewer)：只能看到自己创建的病例
    """
    # 检查用户角色
    is_admin_or_doctor = False
    if current_user.is_superuser:
        is_admin_or_doctor = True
    else:
        # 获取用户角色
        user_role_names = [role.name for role in current_user.roles]
        is_admin_or_doctor = 'admin' in user_role_names or 'doctor' in user_role_names

    # 根据角色过滤病例
    if is_admin_or_doctor:
        # 管理员和医生可以看到所有病例
        cases = db.query(MedicalCase).order_by(MedicalCase.created_at.desc()).all()
    else:
        # 普通用户只能看到自己创建的病例
        cases = db.query(MedicalCase).filter(
            MedicalCase.created_by == current_user.id
        ).order_by(MedicalCase.created_at.desc()).all()

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
async def get_case_detail(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_case_read)
) -> CaseDetail:
    """
    获取单个病例的详细信息（需要 case:read 权限）
    - 管理员和医生：可以查看所有病例
    - 普通用户：只能查看自己创建的病例
    """
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 检查访问权限
    is_admin_or_doctor = False
    if current_user.is_superuser:
        is_admin_or_doctor = True
    else:
        user_role_names = [role.name for role in current_user.roles]
        is_admin_or_doctor = 'admin' in user_role_names or 'doctor' in user_role_names

    # 如果不是管理员或医生，检查是否是创建者
    if not is_admin_or_doctor and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此病例")

    return case


class CreateCaseRequest(BaseModel):
    """新增病例请求（病例编号将自动生成）"""
    patient_name: str
    age: int
    gender: str  # male/female/男/女
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
async def create_case(
    request: CreateCaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_case_create)
) -> CreateCaseResponse:
    """
    新增病例（需要 case:create 权限）

    病例编号将自动生成：年月日时分(12位) + 性别(男1女0) + 年龄(2位)
    支持中文、英文和双语格式
    """
    # 生成病例编号（基于当前时间、性别和年龄）
    current_time = datetime.now()
    patient_id = generate_case_id(request.gender, request.age, current_time)

    # 检查生成的 patient_id 是否已存在（理论上不会冲突，除非同一秒创建相同性别年龄的病例）
    existing_case = db.query(MedicalCase).filter(MedicalCase.patient_id == patient_id).first()
    if existing_case:
        # 如果冲突，等待1秒后重新生成
        import time
        time.sleep(1)
        current_time = datetime.now()
        patient_id = generate_case_id(request.gender, request.age, current_time)

    # 使用格式化器生成标准病例报告
    raw_report = CaseFormatter.format_case_report(
        patient_id=patient_id,
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
        patient_id=patient_id,
        patient_name=request.patient_name,
        age=request.age,
        gender=request.gender,
        chief_complaint=request.chief_complaint,
        raw_report=raw_report,
        created_by=current_user.id  # 记录创建者ID
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


class RunDiagnosisRequest(BaseModel):
    """运行诊断请求参数"""
    model: Optional[str] = None  # 使用的模型，如果为None则使用默认模型


@app.post("/api/cases/{case_id}/run-diagnosis", response_model=DiagnosisResponse)
async def run_diagnosis(
    case_id: int,
    request: RunDiagnosisRequest = RunDiagnosisRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_diagnosis_execute)
) -> DiagnosisResponse:
    """
    对指定病例运行多智能体 AI 诊断（需要 diagnosis:execute 权限）
    - 管理员和医生：可以对所有病例运行诊断
    - 普通用户：只能对自己创建的病例运行诊断

    流程：
    1. 从数据库读取病例的 raw_report
    2. 使用指定模型调用 run_multi_agent_diagnosis 生成诊断结果
    3. 将诊断结果保存到 diagnosis_history 表
    4. 返回诊断结果给前端
    """
    # 1. 查询病例
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 检查访问权限
    is_admin_or_doctor = False
    if current_user.is_superuser:
        is_admin_or_doctor = True
    else:
        user_role_names = [role.name for role in current_user.roles]
        is_admin_or_doctor = 'admin' in user_role_names or 'doctor' in user_role_names

    # 如果不是管理员或医生，检查是否是创建者
    if not is_admin_or_doctor and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权对此病例进行诊断")

    # 2. 确定使用的模型
    model_name = request.model if request.model else os.getenv("LLM_MODEL", "gemini-2.5-flash")

    # 验证模型是否在支持列表中
    valid_model_ids = [m["id"] for m in AVAILABLE_MODELS]
    if model_name not in valid_model_ids:
        raise HTTPException(status_code=400, detail=f"不支持的模型: {model_name}。支持的模型: {', '.join(valid_model_ids)}")

    # 3. 运行诊断（记录执行时间）
    start_time = time.time()
    diagnosis_md = run_multi_agent_diagnosis(case.raw_report, model_name=model_name)
    execution_time_ms = int((time.time() - start_time) * 1000)

    # 4. 保存诊断历史
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

    # 5. 返回结果
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_diagnosis_read)
) -> DiagnosisHistoryResponse:
    """
    获取指定病例的诊断历史记录（需要 diagnosis:read 权限）
    - 管理员和医生：可以查看所有病例的诊断历史
    - 普通用户：只能查看自己创建的病例的诊断历史

    参数:
    - case_id: 病例ID
    - include_full: 是否包含完整的诊断内容（默认只返回预览）
    """
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 检查访问权限
    is_admin_or_doctor = False
    if current_user.is_superuser:
        is_admin_or_doctor = True
    else:
        user_role_names = [role.name for role in current_user.roles]
        is_admin_or_doctor = 'admin' in user_role_names or 'doctor' in user_role_names

    # 如果不是管理员或医生，检查是否是创建者
    if not is_admin_or_doctor and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看此病例的诊断历史")

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
async def get_diagnosis_detail(
    case_id: int,
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_diagnosis_read)
):
    """获取单个诊断的完整详情（需要 diagnosis:read 权限）"""
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
async def import_cases(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_case_create)
) -> ImportCasesResponse:
    """
    批量导入病例（需要 case:create 权限）

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
                        # 验证必填字段（patient_id 不再必填，将自动生成）
                        required_fields = ['patient_name', 'age', 'gender', 'chief_complaint']
                        missing_fields = [f for f in required_fields if f not in case_data]
                        if missing_fields:
                            failed_cases.append({
                                "index": idx,
                                "patient_name": case_data.get('patient_name', 'unknown'),
                                "error": f"缺少必填字段: {', '.join(missing_fields)}"
                            })
                            failed_count += 1
                            continue

                        # 生成病例编号（如果未提供）
                        if 'patient_id' not in case_data or not case_data['patient_id']:
                            patient_id = generate_case_id(
                                case_data['gender'],
                                case_data['age'],
                                datetime.now()
                            )
                        else:
                            patient_id = case_data['patient_id']

                        # 检查是否已存在
                        existing = db.query(MedicalCase).filter(
                            MedicalCase.patient_id == patient_id
                        ).first()
                        if existing:
                            # 如果冲突，重新生成
                            patient_id = generate_case_id(
                                case_data['gender'],
                                case_data['age'],
                                datetime.now()
                            )

                        # 使用格式化器生成报告（如果提供了 raw_report 则直接使用）
                        if 'raw_report' in case_data and case_data['raw_report']:
                            raw_report = case_data['raw_report']
                        else:
                            raw_report = CaseFormatter.format_case_report(
                                patient_id=patient_id,
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
                            patient_id=patient_id,
                            patient_name=case_data['patient_name'],
                            age=case_data['age'],
                            gender=case_data['gender'],
                            chief_complaint=case_data['chief_complaint'],
                            raw_report=raw_report,
                            created_by=current_user.id  # 记录创建者ID
                        )
                        db.add(new_case)
                        db.commit()
                        success_count += 1

                    except Exception as e:
                        db.rollback()
                        failed_cases.append({
                            "index": idx,
                            "patient_name": case_data.get('patient_name', 'unknown'),
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
                    # 生成病例编号（忽略TXT中可能存在的patient_id）
                    patient_id = generate_case_id(
                        parse_result.data['gender'],
                        parse_result.data['age'],
                        datetime.now()
                    )

                    # 检查是否冲突
                    existing = db.query(MedicalCase).filter(
                        MedicalCase.patient_id == patient_id
                    ).first()

                    if existing:
                        # 冲突时重新生成
                        patient_id = generate_case_id(
                            parse_result.data['gender'],
                            parse_result.data['age'],
                            datetime.now()
                        )

                    # 生成格式化报告
                    raw_report = CaseFormatter.format_case_report(
                        patient_id=patient_id,
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
                        patient_id=patient_id,
                        patient_name=parse_result.data['patient_name'],
                        age=parse_result.data['age'],
                        gender=parse_result.data['gender'],
                        chief_complaint=parse_result.data['chief_complaint'],
                        raw_report=raw_report,
                        created_by=current_user.id  # 记录创建者ID
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
async def update_case(
    case_id: int,
    request: UpdateCaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_case_update)
) -> CaseDetail:
    """
    更新病例信息（需要 case:update 权限）
    - 管理员和医生：可以更新所有病例
    - 普通用户：只能更新自己创建的病例

    可以更新病例的任何字段，未提供的字段保持不变
    如果更新了基本信息，会重新生成格式化的病历报告
    """
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 检查访问权限
    is_admin_or_doctor = False
    if current_user.is_superuser:
        is_admin_or_doctor = True
    else:
        user_role_names = [role.name for role in current_user.roles]
        is_admin_or_doctor = 'admin' in user_role_names or 'doctor' in user_role_names

    # 如果不是管理员或医生，检查是否是创建者
    if not is_admin_or_doctor and case.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此病例")

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
async def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_case_delete)
):
    """
    删除指定病例及其所有诊断历史（需要 case:delete 权限）
    - 只有管理员可以删除病例
    """
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    # 只有管理员可以删除
    is_admin = current_user.is_superuser or any(role.name == 'admin' for role in current_user.roles)
    if not is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以删除病例")

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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_diagnosis_read)
):
    """
    导出病例的最新诊断报告（需要 diagnosis:read 权限）

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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_diagnosis_read)
):
    """
    导出指定的诊断记录（需要 diagnosis:read 权限）

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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_diagnosis_read)
):
    """
    批量导出诊断记录为ZIP压缩包（需要 diagnosis:read 权限）

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

