"""数据库模型定义"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from api.db.database import Base


class MedicalCase(Base):
    """医疗病例表"""
    __tablename__ = "medical_cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(50), unique=True, nullable=False, index=True, comment="患者病历号")
    patient_name = Column(String(100), comment="患者姓名")
    age = Column(Integer, comment="年龄")
    gender = Column(String(10), comment="性别: male/female/other")
    chief_complaint = Column(Text, comment="主诉")
    raw_report = Column(Text, nullable=False, comment="原始病历全文")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True, comment="创建者用户ID")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    # 关联诊断历史（一对多）
    diagnoses = relationship("DiagnosisHistory", back_populates="case", cascade="all, delete-orphan")

    # 关联创建者（多对一）
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<MedicalCase(id={self.id}, patient_name='{self.patient_name}', patient_id='{self.patient_id}')>"


class DiagnosisHistory(Base):
    """诊断历史记录表"""
    __tablename__ = "diagnosis_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("medical_cases.id", ondelete="CASCADE"), nullable=False, index=True, comment="关联病例ID")
    diagnosis_markdown = Column(Text, nullable=False, comment="AI 诊断结果（Markdown格式）")
    model_name = Column(String(50), default="gemini-2.5-flash", comment="使用的模型名称")
    run_timestamp = Column(DateTime, default=datetime.utcnow, index=True, comment="诊断运行时间")
    execution_time_ms = Column(Integer, comment="执行耗时（毫秒）")

    # 关联病例（多对一）
    case = relationship("MedicalCase", back_populates="diagnoses")

    def __repr__(self):
        return f"<DiagnosisHistory(id={self.id}, case_id={self.case_id}, model='{self.model_name}')>"
