"""
智能文本病例解析器
支持多种病例报告格式的自动识别和解析
"""

from typing import Dict, Optional, List
import re
from enum import Enum


class TemplateFormat(Enum):
    """病例模板格式"""
    STANDARD_EN = "standard_en"  # 标准英文格式
    STANDARD_ZH = "standard_zh"  # 标准中文格式
    MIXED = "mixed"              # 混合格式
    UNKNOWN = "unknown"          # 未知格式


class TxtParserResult:
    """解析结果"""
    def __init__(self):
        self.success: bool = False
        self.format: TemplateFormat = TemplateFormat.UNKNOWN
        self.data: Dict = {}
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.confidence: float = 0.0  # 0-1 置信度

    def to_dict(self) -> Dict:
        """转换为字典"""
        return {
            'success': self.success,
            'format': self.format.value,
            'data': self.data,
            'errors': self.errors,
            'warnings': self.warnings,
            'confidence': self.confidence
        }


class IntelligentTxtParser:
    """智能文本病例解析器"""

    # 标准英文格式的字段模式
    PATTERNS_EN = {
        'patient_id': [
            r'Patient\s+ID[:\s]+(\S+)',
            r'Medical\s+Record\s+Number[:\s]+(\S+)',
            r'MRN[:\s]+(\S+)',
            r'ID[:\s]+(\d+)',
        ],
        'patient_name': [
            r'(?:Patient\s+)?Name[:\s]+([A-Za-z\s]+?)(?:\n|Age:)',
            r'Patient[:\s]+([A-Za-z\s]+?)(?:\n)',
            r'Name[:\s]+([A-Za-z\s]+)',
        ],
        'age': [
            r'Age[:\s]+(\d+)',
            r'(\d+)\s*(?:years?\s+old|y\.?o\.?)',
        ],
        'gender': [
            r'(?:Gender|Sex)[:\s]+(Male|Female|male|female|M|F)',
        ],
        'chief_complaint': [
            r'Chief\s+Complaint[:\s]+(.+?)(?=\n\n|\nMedical\s+History:|\nHistory:|\nRecent\s+Lab)',
        ],
        'medical_history': [
            r'(?:Medical\s+History|Personal\s+Medical\s+History)[:\s]+(.+?)(?=\n\n|\nRecent\s+Lab|\nPhysical|\nFamily\s+History:)',
        ],
        'family_history': [
            r'Family\s+History[:\s]+(.+?)(?=\n\n|\nPersonal|\nLifestyle)',
        ],
        'lifestyle_factors': [
            r'Lifestyle\s+Factors[:\s]+(.+?)(?=\n\n|\nMedications)',
        ],
        'medications': [
            r'Medications[:\s]+(.+?)(?=\n\n|\nRecent\s+Lab)',
        ],
        'lab_results': [
            r'(?:Recent\s+Lab\s+and\s+Diagnostic\s+Results|Laboratory\s+Results|Lab\s+Results)[:\s]+(.+?)(?=\n\n|\nPhysical)',
        ],
        'physical_exam': [
            r'Physical\s+Examination\s+Findings[:\s]+(.+?)(?=\n\n|$)',
        ],
        'vital_signs': [
            r'Vital\s+Signs[:\s]+(.+?)(?=\n|Respiratory)',
        ],
    }

    # 标准中文格式的字段模式
    PATTERNS_ZH = {
        'patient_id': [
            r'病历号[：:]\s*(\S+)',
            r'患者编号[：:]\s*(\S+)',
        ],
        'patient_name': [
            r'(?:患者)?姓名[：:]\s*([^\n]+?)(?=\n|年龄)',
            r'姓名[：:]\s*([^\n]+)',
        ],
        'age': [
            r'年龄[：:]\s*(\d+)',
        ],
        'gender': [
            r'性别[：:]\s*(男|女|Male|Female)',
        ],
        'chief_complaint': [
            r'主诉[：:]\s*(.+?)(?=\n\n|\n现病史|\n既往史)',
        ],
        'medical_history': [
            r'(?:既往史|个人病史)[：:]\s*(.+?)(?=\n\n|\n家族史)',
        ],
        'family_history': [
            r'家族史[：:]\s*(.+?)(?=\n\n|\n个人|\n生活)',
        ],
        'lifestyle_factors': [
            r'生活方式[：:]\s*(.+?)(?=\n\n|\n用药)',
        ],
        'medications': [
            r'用药情况[：:]\s*(.+?)(?=\n\n|\n检查)',
        ],
        'lab_results': [
            r'(?:检查结果|实验室检查)[：:]\s*(.+?)(?=\n\n|\n体格检查)',
        ],
        'physical_exam': [
            r'体格检查[：:]\s*(.+?)(?=\n\n|$)',
        ],
        'vital_signs': [
            r'生命体征[：:]\s*(.+?)(?=\n|$)',
        ],
    }

    def __init__(self):
        self.result = TxtParserResult()

    def parse(self, content: str) -> TxtParserResult:
        """
        解析文本病例

        Args:
            content: 病例文本内容

        Returns:
            TxtParserResult: 解析结果
        """
        self.result = TxtParserResult()

        if not content or not content.strip():
            self.result.errors.append("文件内容为空")
            return self.result

        # 1. 检测格式类型
        format_type = self._detect_format(content)
        self.result.format = format_type

        # 2. 根据格式选择解析策略
        if format_type == TemplateFormat.STANDARD_EN:
            self._parse_standard_en(content)
        elif format_type == TemplateFormat.STANDARD_ZH:
            self._parse_standard_zh(content)
        elif format_type == TemplateFormat.MIXED:
            self._parse_mixed(content)
        else:
            # 降级到通用解析
            self._parse_fallback(content)

        # 3. 验证必填字段
        self._validate_required_fields()

        # 4. 数据清洗和格式化
        self._clean_and_format()

        # 5. 计算置信度
        self._calculate_confidence()

        return self.result

    def _detect_format(self, content: str) -> TemplateFormat:
        """检测病例格式类型"""
        en_indicators = [
            'Patient ID', 'Chief Complaint', 'Medical History',
            'Physical Examination', 'Vital Signs'
        ]
        zh_indicators = [
            '病历号', '主诉', '既往史', '体格检查', '生命体征'
        ]

        en_count = sum(1 for ind in en_indicators if ind in content)
        zh_count = sum(1 for ind in zh_indicators if ind in content)

        if en_count >= 3 and zh_count == 0:
            return TemplateFormat.STANDARD_EN
        elif zh_count >= 3 and en_count == 0:
            return TemplateFormat.STANDARD_ZH
        elif en_count >= 2 and zh_count >= 2:
            return TemplateFormat.MIXED
        else:
            return TemplateFormat.UNKNOWN

    def _parse_standard_en(self, content: str):
        """解析标准英文格式"""
        for field, patterns in self.PATTERNS_EN.items():
            value = self._extract_field(content, patterns)
            if value:
                self.result.data[field] = value

    def _parse_standard_zh(self, content: str):
        """解析标准中文格式"""
        for field, patterns in self.PATTERNS_ZH.items():
            value = self._extract_field(content, patterns)
            if value:
                self.result.data[field] = value

    def _parse_mixed(self, content: str):
        """解析混合格式"""
        # 尝试英文模式
        self._parse_standard_en(content)
        # 补充中文模式（如果字段缺失）
        for field, patterns in self.PATTERNS_ZH.items():
            if field not in self.result.data:
                value = self._extract_field(content, patterns)
                if value:
                    self.result.data[field] = value

    def _parse_fallback(self, content: str):
        """降级解析策略（通用）"""
        lines = content.split('\n')

        # 尝试从前 30 行提取基本信息
        for i, line in enumerate(lines[:30]):
            line = line.strip()
            if not line:
                continue

            # 患者ID
            if not self.result.data.get('patient_id'):
                if any(keyword in line.lower() for keyword in ['patient id', 'id:', '病历号']):
                    match = re.search(r'[:\s]+(\S+)', line)
                    if match:
                        self.result.data['patient_id'] = match.group(1).strip()

            # 姓名
            if not self.result.data.get('patient_name'):
                if any(keyword in line.lower() for keyword in ['name:', 'patient:', '姓名']):
                    match = re.search(r'[:\s]+([A-Za-z\u4e00-\u9fa5\s]+?)(?:\n|$)', line, re.I)
                    if match:
                        name = match.group(1).strip()
                        # 过滤掉常见的非姓名词
                        if name and name.lower() not in ['patient', 'name', '姓名']:
                            self.result.data['patient_name'] = name

            # 年龄
            if not self.result.data.get('age'):
                if any(keyword in line.lower() for keyword in ['age', '年龄']):
                    match = re.search(r'(\d+)', line)
                    if match:
                        age = int(match.group(1))
                        if 0 < age < 150:
                            self.result.data['age'] = age

            # 性别
            if not self.result.data.get('gender'):
                if any(word in line.lower() for word in ['gender', 'sex', '性别']):
                    line_lower = line.lower()
                    if 'female' in line_lower or '女' in line or re.search(r'\bf\b', line_lower):
                        self.result.data['gender'] = 'female'
                    elif 'male' in line_lower or '男' in line or re.search(r'\bm\b', line_lower):
                        self.result.data['gender'] = 'male'

        # 主诉：查找包含"complaint"或"主诉"的段落
        chief_complaint_match = re.search(
            r'(?:Chief\s+Complaint|主诉)[:\s]+(.+?)(?=\n\n|\nMedical|\n既往)',
            content,
            re.IGNORECASE | re.DOTALL
        )
        if chief_complaint_match:
            self.result.data['chief_complaint'] = chief_complaint_match.group(1).strip()
        elif 'chief_complaint' not in self.result.data:
            # 使用整个文档的前 200 字符作为主诉
            self.result.data['chief_complaint'] = content[:200].strip()
            self.result.warnings.append("未识别出明确的主诉字段，使用文档开头作为主诉")

        # 病史
        medical_history_match = re.search(
            r'(?:Medical\s+History|Personal\s+Medical\s+History|既往史)[:\s]+(.+?)(?=\n\n|\nRecent|\n检查)',
            content,
            re.IGNORECASE | re.DOTALL
        )
        if medical_history_match:
            self.result.data['medical_history'] = medical_history_match.group(1).strip()

        # 生命体征
        vital_signs_match = re.search(
            r'(?:Vital\s+Signs|生命体征)[:\s]+(.+?)(?=\n|$)',
            content,
            re.IGNORECASE
        )
        if vital_signs_match:
            self.result.data['vital_signs'] = vital_signs_match.group(1).strip()

        self.result.warnings.append("使用了降级解析策略，部分字段可能不准确")

    def _extract_field(self, content: str, patterns: List[str]) -> Optional[str]:
        """使用多个模式提取字段"""
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                value = match.group(1).strip()
                # 清理多余的空白
                value = re.sub(r'\s+', ' ', value)
                # 移除可能的尾部标点
                value = value.rstrip('.,;:')
                return value
        return None

    def _validate_required_fields(self):
        """验证必填字段"""
        required = ['patient_id', 'patient_name', 'age', 'gender', 'chief_complaint']
        missing = [field for field in required if field not in self.result.data]

        if missing:
            self.result.errors.append(f"缺少必填字段: {', '.join(missing)}")
            self.result.success = False
        else:
            self.result.success = True

    def _clean_and_format(self):
        """数据清洗和格式化"""
        data = self.result.data

        # 格式化姓名（首字母大写，适用于英文名）
        if 'patient_name' in data:
            name = data['patient_name'].strip()
            # 如果是英文名，首字母大写
            if re.match(r'^[A-Za-z\s]+$', name):
                data['patient_name'] = name.title()
            else:
                data['patient_name'] = name

        # 格式化性别
        if 'gender' in data:
            gender = str(data['gender']).lower().strip()
            if gender in ['m', 'male', '男']:
                data['gender'] = 'male'
            elif gender in ['f', 'female', '女']:
                data['gender'] = 'female'
            else:
                # 如果不匹配，保留原值并记录警告
                self.result.warnings.append(f"性别值未标准化: {data['gender']}")
                data['gender'] = 'other'

        # 格式化年龄
        if 'age' in data:
            if isinstance(data['age'], str):
                try:
                    age_match = re.search(r'\d+', data['age'])
                    if age_match:
                        age = int(age_match.group(0))
                        if 0 < age < 150:
                            data['age'] = age
                        else:
                            self.result.warnings.append(f"年龄超出合理范围: {age}")
                            del data['age']
                    else:
                        self.result.warnings.append(f"年龄格式异常: {data['age']}")
                        del data['age']
                except:
                    self.result.warnings.append(f"年龄解析失败: {data['age']}")
                    del data['age']

        # 清理所有文本字段的多余空白
        for key in data:
            if isinstance(data[key], str):
                data[key] = re.sub(r'\s+', ' ', data[key]).strip()

    def _calculate_confidence(self):
        """计算解析置信度"""
        if not self.result.success:
            self.result.confidence = 0.0
            return

        # 可能的所有字段
        all_possible_fields = set(self.PATTERNS_EN.keys())
        extracted_fields = len(self.result.data)
        total_fields = len(all_possible_fields)

        # 基础置信度：提取字段比例
        base_confidence = extracted_fields / total_fields

        # 格式检测加成
        format_bonus = {
            TemplateFormat.STANDARD_EN: 0.2,
            TemplateFormat.STANDARD_ZH: 0.2,
            TemplateFormat.MIXED: 0.1,
            TemplateFormat.UNKNOWN: -0.1,
        }

        # 警告惩罚
        warning_penalty = len(self.result.warnings) * 0.05

        # 必填字段全部存在加成
        required_bonus = 0.1 if all(
            field in self.result.data
            for field in ['patient_id', 'patient_name', 'age', 'gender', 'chief_complaint']
        ) else 0

        confidence = (
            base_confidence +
            format_bonus.get(self.result.format, 0) +
            required_bonus -
            warning_penalty
        )
        self.result.confidence = max(0.0, min(1.0, confidence))


# 辅助函数
def parse_txt_file(content: str) -> TxtParserResult:
    """
    便捷函数：解析 TXT 文件

    Args:
        content: 文件内容

    Returns:
        TxtParserResult: 解析结果
    """
    parser = IntelligentTxtParser()
    return parser.parse(content)
