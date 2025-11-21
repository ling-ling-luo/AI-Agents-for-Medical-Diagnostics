from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import time
import os

from Main import run_multi_agent_diagnosis
from api.db.database import get_db
from api.models.case import MedicalCase, DiagnosisHistory

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

