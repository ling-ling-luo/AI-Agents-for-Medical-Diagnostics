"""
TXT 解析器单元测试
"""

import pytest
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.utils.txt_parser import IntelligentTxtParser, TemplateFormat, parse_txt_file


class TestIntelligentTxtParser:
    """TXT 解析器单元测试"""

    def test_standard_en_format(self):
        """测试标准英文格式解析（Robert Miller 模板）"""
        content = """Medical Case Report
Patient ID: 100231
Name: Robert Miller
Age: 63
Gender: Male
Date of Report: 2025-01-15

Chief Complaint:
The patient complains of persistent cough with sputum production, shortness of breath, and wheezing, especially in the mornings, for the past two years.

Medical History:
Family History: Father died of lung cancer at age 70.
Personal Medical History: Chronic obstructive pulmonary disease (COPD) diagnosed at 60.
Lifestyle Factors: Smoker (40 pack-years), occasional alcohol, sedentary.
Medications: Salbutamol inhaler (as needed), Tiotropium (daily).

Recent Lab and Diagnostic Results:
Pulmonary Function Test: FEV1 reduced to 55% predicted.
Chest X-ray: Hyperinflated lungs, flattened diaphragms.
CBC: Normal.

Physical Examination Findings:
Vital Signs: BP 130/85 mmHg, HR 90 bpm, BMI 26.8.
Respiratory Exam: Prolonged expiration, wheezing on auscultation.
"""
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        assert result.success == True, f"解析应该成功，错误: {result.errors}"
        assert result.format == TemplateFormat.STANDARD_EN
        assert result.data['patient_id'] == '100231'
        assert result.data['patient_name'] == 'Robert Miller'
        assert result.data['age'] == 63
        assert result.data['gender'] == 'male'
        assert 'cough' in result.data['chief_complaint'].lower()
        assert 'COPD' in result.data['medical_history']
        assert 'BP 130/85' in result.data['vital_signs']
        assert result.confidence > 0.6

    def test_missing_required_fields(self):
        """测试缺少必填字段"""
        content = "Just some random text without any structure or medical information"
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        assert result.success == False
        assert len(result.errors) > 0
        assert '缺少必填字段' in result.errors[0]
        assert result.confidence == 0.0

    def test_chinese_format(self):
        """测试中文格式解析"""
        content = """病例报告
病历号: 100231
姓名: 张三
年龄: 45
性别: 男

主诉:
胸痛三天，伴气促。

既往史:
高血压病史5年。

家族史:
父亲有心脏病史。

生活方式:
吸烟20年。

用药情况:
降压药每日一次。

检查结果:
血压160/100 mmHg。

体格检查:
心音正常，律齐。

生命体征:
BP 160/100 mmHg, HR 85 bpm
"""
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        assert result.success == True
        assert result.format == TemplateFormat.STANDARD_ZH
        assert result.data['patient_id'] == '100231'
        assert result.data['patient_name'] == '张三'
        assert result.data['age'] == 45
        assert result.data['gender'] == 'male'
        assert '胸痛' in result.data['chief_complaint']

    def test_fallback_parsing(self):
        """测试降级解析"""
        content = """
Patient Information:
ID: P12345
John Doe
Age: 50 years old
Gender: Male

Complaint: He has been experiencing chest pain for 3 days.

Medical history includes hypertension.

BP: 140/90 mmHg
"""
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        # 降级解析可能成功也可能失败，但不应该崩溃
        assert result is not None
        assert result.format == TemplateFormat.UNKNOWN
        assert len(result.warnings) > 0
        # 检查是否有降级相关的警告
        assert any('降级' in w or '未识别' in w for w in result.warnings)

        # 应该至少提取到一些基本信息
        if result.success:
            assert result.data.get('patient_id') is not None
            assert result.data.get('age') == 50

    def test_empty_content(self):
        """测试空内容"""
        parser = IntelligentTxtParser()
        result = parser.parse("")

        assert result.success == False
        assert '内容为空' in result.errors[0]

    def test_parse_txt_file_function(self):
        """测试便捷函数"""
        content = """
Patient ID: TEST001
Name: Test Patient
Age: 30
Gender: Male

Chief Complaint:
Test complaint for unit testing.
"""
        result = parse_txt_file(content)

        assert result is not None
        assert isinstance(result.data, dict)

    def test_gender_normalization(self):
        """测试性别标准化"""
        test_cases = [
            ("Gender: Male", "male"),
            ("Gender: Female", "female"),
            ("性别: 男", "male"),
            ("性别: 女", "female"),
            ("Gender: M", "male"),
            ("Gender: F", "female"),
        ]

        for content_snippet, expected_gender in test_cases:
            content = f"""
Patient ID: TEST001
Name: Test Patient
Age: 30
{content_snippet}

Chief Complaint:
Test complaint.
"""
            result = parse_txt_file(content)
            if result.success and 'gender' in result.data:
                assert result.data['gender'] == expected_gender

    def test_age_validation(self):
        """测试年龄验证"""
        parser = IntelligentTxtParser()

        # 正常年龄
        content1 = """
Patient ID: TEST001
Name: Test Patient
Age: 45
Gender: Male
Chief Complaint: Test
"""
        result1 = parser.parse(content1)
        assert result1.data.get('age') == 45

    def test_mixed_format(self):
        """测试混合格式（中英文混合）"""
        content = """Medical Case Report
Patient ID: 100231
姓名: 李明
Age: 35
性别: Male

Chief Complaint:
胸痛 (chest pain) for 2 days.

Medical History:
既往史: 无特殊病史
Family History: Father has hypertension

生命体征: BP 120/80 mmHg
"""
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        assert result.format == TemplateFormat.MIXED
        # 应该能提取到混合格式的信息
        if result.success:
            assert result.data.get('patient_id') is not None
            assert result.data.get('age') == 35

    def test_confidence_calculation(self):
        """测试置信度计算"""
        # 完整信息的病例应该有高置信度
        complete_content = """
Patient ID: 100231
Name: John Doe
Age: 50
Gender: Male

Chief Complaint:
Test complaint.

Medical History:
Test history.

Family History:
Test family history.

Medications:
Test medications.

Lab Results:
Test lab results.

Physical Examination Findings:
Test physical exam.

Vital Signs: BP 120/80 mmHg
"""
        result1 = parse_txt_file(complete_content)
        if result1.success:
            assert result1.confidence > 0.7

        # 信息不完整的病例应该有较低置信度
        incomplete_content = """
Patient ID: 100231
Name: John Doe
Age: 50
Gender: Male
Chief Complaint: Test
"""
        result2 = parse_txt_file(incomplete_content)
        if result2.success:
            assert result2.confidence < result1.confidence

    def test_special_characters(self):
        """测试特殊字符处理"""
        content = """
Patient ID: 100231
Name: O'Brien
Age: 45
Gender: Male

Chief Complaint:
Patient has "severe" pain (10/10 scale).
"""
        result = parse_txt_file(content)

        if result.success:
            assert "O'Brien" in result.data.get('patient_name', '')
            assert 'severe' in result.data.get('chief_complaint', '')


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
