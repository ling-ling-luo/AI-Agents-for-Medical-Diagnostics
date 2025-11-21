"""
病例格式化工具
支持将用户输入的结构化信息转换为标准病例报告格式（中英文双语）
"""

from typing import Optional
from datetime import datetime


class CaseFormatter:
    """病例格式化器，支持中英文双语标准格式"""

    @staticmethod
    def format_case_report(
        patient_id: str,
        patient_name: str,
        age: int,
        gender: str,  # male/female/other
        chief_complaint: str,
        medical_history: Optional[str] = None,
        family_history: Optional[str] = None,
        lifestyle_factors: Optional[str] = None,
        medications: Optional[str] = None,
        lab_results: Optional[str] = None,
        physical_exam: Optional[str] = None,
        vital_signs: Optional[str] = None,
        language: str = "en"  # en: English, zh: Chinese, both: 双语
    ) -> str:
        """
        格式化病例报告

        Args:
            patient_id: 患者病历号
            patient_name: 患者姓名
            age: 年龄
            gender: 性别 (male/female/other)
            chief_complaint: 主诉（必填）
            medical_history: 个人病史
            family_history: 家族史
            lifestyle_factors: 生活方式
            medications: 用药情况
            lab_results: 实验室检查结果
            physical_exam: 体格检查
            vital_signs: 生命体征
            language: 语言 (en/zh/both)

        Returns:
            格式化的病例报告文本
        """

        # 性别映射
        gender_map_en = {"male": "Male", "female": "Female", "other": "Other"}
        gender_map_zh = {"male": "男", "female": "女", "other": "其他"}

        current_date = datetime.now().strftime("%Y-%m-%d")

        if language == "en":
            return CaseFormatter._format_english(
                patient_id, patient_name, age, gender_map_en.get(gender, "Other"),
                chief_complaint, medical_history, family_history, lifestyle_factors,
                medications, lab_results, physical_exam, vital_signs, current_date
            )
        elif language == "zh":
            return CaseFormatter._format_chinese(
                patient_id, patient_name, age, gender_map_zh.get(gender, "其他"),
                chief_complaint, medical_history, family_history, lifestyle_factors,
                medications, lab_results, physical_exam, vital_signs, current_date
            )
        else:  # both
            return CaseFormatter._format_bilingual(
                patient_id, patient_name, age, gender, gender_map_en, gender_map_zh,
                chief_complaint, medical_history, family_history, lifestyle_factors,
                medications, lab_results, physical_exam, vital_signs, current_date
            )

    @staticmethod
    def _format_english(
        patient_id, patient_name, age, gender_en,
        chief_complaint, medical_history, family_history, lifestyle_factors,
        medications, lab_results, physical_exam, vital_signs, current_date
    ) -> str:
        """英文格式"""
        report = f"""Medical Case Report
Patient ID: {patient_id}
Name: {patient_name}
Age: {age}
Gender: {gender_en}
Date of Report: {current_date}

Chief Complaint:
{chief_complaint}
"""

        if medical_history or family_history or lifestyle_factors or medications:
            report += "\nMedical History:\n"
            if family_history:
                report += f"Family History: {family_history}\n"
            if medical_history:
                report += f"Personal Medical History: {medical_history}\n"
            if lifestyle_factors:
                report += f"Lifestyle Factors: {lifestyle_factors}\n"
            if medications:
                report += f"Medications: {medications}\n"

        if lab_results:
            report += f"\nRecent Lab and Diagnostic Results:\n{lab_results}\n"

        if physical_exam or vital_signs:
            report += "\nPhysical Examination Findings:\n"
            if vital_signs:
                report += f"Vital Signs: {vital_signs}\n"
            if physical_exam:
                report += f"{physical_exam}\n"

        return report.strip()

    @staticmethod
    def _format_chinese(
        patient_id, patient_name, age, gender_zh,
        chief_complaint, medical_history, family_history, lifestyle_factors,
        medications, lab_results, physical_exam, vital_signs, current_date
    ) -> str:
        """中文格式"""
        report = f"""医疗病例报告
患者病历号：{patient_id}
姓名：{patient_name}
年龄：{age}
性别：{gender_zh}
报告日期：{current_date}

主诉：
{chief_complaint}
"""

        if medical_history or family_history or lifestyle_factors or medications:
            report += "\n病史：\n"
            if family_history:
                report += f"家族史：{family_history}\n"
            if medical_history:
                report += f"个人病史：{medical_history}\n"
            if lifestyle_factors:
                report += f"生活方式：{lifestyle_factors}\n"
            if medications:
                report += f"用药情况：{medications}\n"

        if lab_results:
            report += f"\n实验室及诊断检查结果：\n{lab_results}\n"

        if physical_exam or vital_signs:
            report += "\n体格检查：\n"
            if vital_signs:
                report += f"生命体征：{vital_signs}\n"
            if physical_exam:
                report += f"{physical_exam}\n"

        return report.strip()

    @staticmethod
    def _format_bilingual(
        patient_id, patient_name, age, gender, gender_map_en, gender_map_zh,
        chief_complaint, medical_history, family_history, lifestyle_factors,
        medications, lab_results, physical_exam, vital_signs, current_date
    ) -> str:
        """双语格式（中英文对照）"""
        gender_en = gender_map_en.get(gender, "Other")
        gender_zh = gender_map_zh.get(gender, "其他")

        report = f"""Medical Case Report / 医疗病例报告
Patient ID / 患者病历号: {patient_id}
Name / 姓名: {patient_name}
Age / 年龄: {age}
Gender / 性别: {gender_en} / {gender_zh}
Date of Report / 报告日期: {current_date}

Chief Complaint / 主诉:
{chief_complaint}
"""

        if medical_history or family_history or lifestyle_factors or medications:
            report += "\nMedical History / 病史:\n"
            if family_history:
                report += f"Family History / 家族史: {family_history}\n"
            if medical_history:
                report += f"Personal Medical History / 个人病史: {medical_history}\n"
            if lifestyle_factors:
                report += f"Lifestyle Factors / 生活方式: {lifestyle_factors}\n"
            if medications:
                report += f"Medications / 用药情况: {medications}\n"

        if lab_results:
            report += f"\nRecent Lab and Diagnostic Results / 实验室及诊断检查结果:\n{lab_results}\n"

        if physical_exam or vital_signs:
            report += "\nPhysical Examination Findings / 体格检查:\n"
            if vital_signs:
                report += f"Vital Signs / 生命体征: {vital_signs}\n"
            if physical_exam:
                report += f"{physical_exam}\n"

        return report.strip()
