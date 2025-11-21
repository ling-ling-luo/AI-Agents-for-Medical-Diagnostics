from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import time
import os

from Main import run_multi_agent_diagnosis
from api.db.database import get_db
from api.models.case import MedicalCase, DiagnosisHistory
from api.utils.case_formatter import CaseFormatter

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


@app.get("/api/cases/{case_id}/diagnoses")
async def get_diagnosis_history(case_id: int, db: Session = Depends(get_db)):
    """获取指定病例的诊断历史记录"""
    case = db.query(MedicalCase).filter(MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"病例 ID {case_id} 不存在")

    diagnoses = db.query(DiagnosisHistory).filter(
        DiagnosisHistory.case_id == case_id
    ).order_by(DiagnosisHistory.run_timestamp.desc()).all()

    return {
        "case_id": case_id,
        "patient_name": case.patient_name,
        "total_diagnoses": len(diagnoses),
        "history": [
            {
                "id": d.id,
                "timestamp": d.run_timestamp.isoformat(),
                "model": d.model_name,
                "execution_time_ms": d.execution_time_ms,
                "diagnosis_preview": d.diagnosis_markdown[:200] + "..." if len(d.diagnosis_markdown) > 200 else d.diagnosis_markdown
            }
            for d in diagnoses
        ]
    }

