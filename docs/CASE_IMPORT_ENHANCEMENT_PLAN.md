# 病例新增与导入功能优化方案

## 📊 项目概述

**目标**: 打造高可用、用户友好的病例新增与导入功能
**优先级**: 高可用性 > 用户体验 > 智能化
**实施周期**: Phase 1 预计 2-3 个开发周期
**版本**: v2.0.0

---

## 📋 一、现状分析

### 1.1 已实现功能

#### 后端 (FastAPI)
- ✅ `POST /api/cases` - 手动创建单个病例
- ✅ `POST /api/cases/import` - 批量导入病例
  - 支持 JSON 格式（结构化数据）
  - 支持 TXT 格式（纯文本病历报告）
- ✅ 病例格式化器 (`api/utils/case_formatter.py`)

#### 前端 (React + TypeScript)
- ✅ `CreateCaseForm.tsx` - 手动新增病例表单
- ✅ `CaseList.tsx` - 包含导入按钮和结果展示
- ✅ API 客户端 (`services/api.ts`)

### 1.2 存在的问题

#### 问题 1: TXT 文件解析能力不足 🔴 高优先级
**现状**:
```python
# 当前实现（api/main.py 394-440行）
# 只有非常简单的文本提取，无法处理标准病例模板
for line in lines[:10]:
    if 'age' in line.lower() or '年龄' in line:
        age_match = re.search(r'(\d+)', line)
        ...
```

**问题**:
- 仅检查前 10 行，容易漏掉信息
- 字段识别过于简单，无法处理标准格式
- 不支持病例模板（如 Robert Miller - COPD.txt）
- 解析失败率高

**影响**: 用户无法直接导入标准格式的病例文件

---

#### 问题 2: 导入体验不够友好 🟡 中优先级
**现状**:
- 导入按钮隐藏在 CaseList 头部，不够突出
- 没有文件格式说明和示例下载
- 导入结果展示信息不足
- 没有导入预览功能

**影响**: 用户不知道如何准备导入文件，导入失败后不知道如何修正

---

#### 问题 3: 错误处理不够完善 🟡 中优先级
**现状**:
```typescript
// 前端错误处理过于简单
catch (err: any) {
  setError(err.response?.data?.detail || '导入失败，请检查文件格式');
}
```

**问题**:
- 错误信息不够具体
- 没有修复建议
- 批量导入时，失败的病例信息展示不够清晰

**影响**: 用户无法快速定位和修复问题

---

#### 问题 4: 缺少数据验证 🟢 低优先级
**现状**:
- 前端验证不够完善
- 缺少字段格式提示
- 没有实时验证反馈

**影响**: 用户可能提交无效数据，增加后端负担

---

## 🎯 二、优化目标

### 2.1 核心目标

1. **高可用性** 🎯
   - TXT 解析成功率从 < 30% 提升到 > 95%
   - 支持标准病例模板格式
   - 完善的错误处理和降级策略

2. **用户友好** 🎯
   - 清晰的导入向导流程
   - 详细的格式说明和示例
   - 友好的错误提示和修复建议

3. **稳定可靠** 🎯
   - 完善的边界条件处理
   - 单个病例失败不影响整体导入
   - 完整的日志和审计

### 2.2 非目标（本期不做）

❌ AI 智能识别（留待 v3.0）
❌ 图像识别导入（留待 v3.0）
❌ 实时协作编辑（留待 v3.0）
❌ 版本控制（留待 v2.1）

---

## 🔧 三、技术方案

### 3.1 架构设计

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐    ┌──────────────┐         │
│  │ ImportWizard │    │CreateCaseForm│         │
│  │  Component   │    │  Component   │         │
│  └──────┬───────┘    └──────┬───────┘         │
│         │                   │                  │
│         └───────────┬───────┘                  │
│                     │                          │
│              ┌──────▼──────┐                   │
│              │   API Client│                   │
│              └──────┬──────┘                   │
└─────────────────────┼─────────────────────────┘
                      │ HTTP
┌─────────────────────▼─────────────────────────┐
│              Backend (FastAPI)                 │
├────────────────────────────────────────────────┤
│                                                │
│  ┌────────────┐      ┌──────────────────┐    │
│  │   Routes   │─────▶│  Import Service  │    │
│  └────────────┘      └─────────┬────────┘    │
│                                 │             │
│                      ┌──────────▼─────────┐   │
│                      │  TXT Parser Engine │   │
│                      │  ┌──────────────┐  │   │
│                      │  │Standard Format│  │   │
│                      │  ├──────────────┤  │   │
│                      │  │Chinese Format│  │   │
│                      │  ├──────────────┤  │   │
│                      │  │ Fallback     │  │   │
│                      │  └──────────────┘  │   │
│                      └────────────────────┘   │
│                                                │
│  ┌────────────────────────────────────┐       │
│  │      Validation & Formatting       │       │
│  └────────────────────────────────────┘       │
│                                                │
│  ┌────────────────────────────────────┐       │
│  │      Database (SQLite/MySQL)       │       │
│  └────────────────────────────────────┘       │
└────────────────────────────────────────────────┘
```

---

### 3.2 后端实现方案

#### 3.2.1 智能 TXT 解析器

**文件**: `api/utils/txt_parser.py`

```python
"""
智能文本病例解析器
支持多种病例报告格式的自动识别和解析
"""

from typing import Dict, Optional, List, Tuple
import re
from datetime import datetime
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

class IntelligentTxtParser:
    """智能文本病例解析器"""

    # 标准英文格式的字段模式
    PATTERNS_EN = {
        'patient_id': [
            r'Patient\s+ID[:\s]+(\S+)',
            r'Medical\s+Record\s+Number[:\s]+(\S+)',
            r'MRN[:\s]+(\S+)',
        ],
        'patient_name': [
            r'(?:Patient\s+)?Name[:\s]+([A-Za-z\s]+?)(?:\n|Age:)',
            r'Patient[:\s]+([A-Za-z\s]+?)(?:\n)',
        ],
        'age': [
            r'Age[:\s]+(\d+)',
            r'(\d+)\s*(?:years?\s+old|y\.?o\.?)',
        ],
        'gender': [
            r'(?:Gender|Sex)[:\s]+(Male|Female|male|female|M|F)',
        ],
        'chief_complaint': [
            r'Chief\s+Complaint[:\s]+(.+?)(?=\n\n|\nMedical\s+History:|\nHistory:)',
        ],
        'medical_history': [
            r'(?:Medical\s+History|Personal\s+Medical\s+History)[:\s]+(.+?)(?=\n\n|\nRecent\s+Lab|\nPhysical)',
        ],
        'family_history': [
            r'Family\s+History[:\s]+(.+?)(?=\n\n|\nPersonal)',
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
            r'Vital\s+Signs[:\s]+(.+?)(?=\n|$)',
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
            r'家族史[：:]\s*(.+?)(?=\n\n|\n个人)',
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

        # 尝试从前 20 行提取基本信息
        for i, line in enumerate(lines[:20]):
            line = line.strip()
            if not line:
                continue

            # 患者ID
            if 'patient' in line.lower() and 'id' in line.lower():
                match = re.search(r'[\d\w]+$', line)
                if match:
                    self.result.data['patient_id'] = match.group(0)

            # 姓名
            if 'name' in line.lower() and 'patient_name' not in self.result.data:
                match = re.search(r'name[:\s]+([A-Za-z\s]+?)(?:\n|$)', line, re.I)
                if match:
                    self.result.data['patient_name'] = match.group(1).strip()

            # 年龄
            if 'age' in line.lower():
                match = re.search(r'(\d+)', line)
                if match:
                    self.result.data['age'] = int(match.group(1))

            # 性别
            if any(word in line.lower() for word in ['gender', 'sex', '性别']):
                if 'male' in line.lower() or '男' in line:
                    self.result.data['gender'] = 'male'
                elif 'female' in line.lower() or '女' in line:
                    self.result.data['gender'] = 'female'

        # 主诉：使用整个文档作为主诉（截取前 200 字符）
        if 'chief_complaint' not in self.result.data:
            self.result.data['chief_complaint'] = content[:200].strip()
            self.result.warnings.append("未识别出明确的主诉字段，使用文档开头作为主诉")

        self.result.warnings.append("使用了降级解析策略，部分字段可能不准确")

    def _extract_field(self, content: str, patterns: List[str]) -> Optional[str]:
        """使用多个模式提取字段"""
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                value = match.group(1).strip()
                # 清理多余的空白
                value = re.sub(r'\s+', ' ', value)
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

        # 格式化姓名（首字母大写）
        if 'patient_name' in data:
            data['patient_name'] = data['patient_name'].title()

        # 格式化性别
        if 'gender' in data:
            gender = data['gender'].lower()
            if gender in ['m', 'male', '男']:
                data['gender'] = 'male'
            elif gender in ['f', 'female', '女']:
                data['gender'] = 'female'
            else:
                data['gender'] = 'other'

        # 格式化年龄
        if 'age' in data:
            if isinstance(data['age'], str):
                try:
                    data['age'] = int(re.search(r'\d+', data['age']).group(0))
                except:
                    self.result.warnings.append(f"年龄格式异常: {data['age']}")
                    del data['age']

    def _calculate_confidence(self):
        """计算解析置信度"""
        if not self.result.success:
            self.result.confidence = 0.0
            return

        total_fields = len(self.PATTERNS_EN)  # 总字段数
        extracted_fields = len(self.result.data)  # 提取的字段数

        # 基础置信度
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

        confidence = base_confidence + format_bonus.get(self.result.format, 0) - warning_penalty
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
```

---

#### 3.2.2 更新导入 API

**文件**: `api/main.py`

修改 `import_cases` 路由（295-457 行），集成新的解析器：

```python
from api.utils.txt_parser import parse_txt_file, TxtParserResult

@app.post("/api/cases/import", response_model=ImportCasesResponse)
async def import_cases(file: UploadFile = File(...), db: Session = Depends(get_db)) -> ImportCasesResponse:
    """
    批量导入病例（增强版）

    支持的文件格式：
    - JSON 文件：包含病例数组，每个病例需包含必要字段
    - TXT 文件：纯文本病历报告（支持标准模板格式）
    """
    # ... JSON 处理保持不变 ...

    # 处理 TXT 文件（使用新的智能解析器）
    elif filename.endswith('.txt'):
        try:
            content = content.decode('utf-8')

            # 使用智能解析器
            parse_result = parse_txt_file(content)

            if not parse_result.success:
                # 解析失败，返回详细错误
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "文件解析失败",
                        "errors": parse_result.errors,
                        "warnings": parse_result.warnings,
                        "suggestions": [
                            "请确保文件使用标准病例模板格式",
                            "必填字段：Patient ID, Name, Age, Gender, Chief Complaint",
                            "建议下载示例文件作为参考"
                        ]
                    }
                )

            # 检查重复
            patient_id = parse_result.data.get('patient_id')
            existing = db.query(MedicalCase).filter(
                MedicalCase.patient_id == patient_id
            ).first()
            if existing:
                failed_cases.append({
                    "patient_id": patient_id,
                    "error": "病历号已存在",
                    "suggestion": "请修改病历号或删除已有病例"
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

                # 添加警告信息（如果有）
                if parse_result.warnings:
                    # 可以记录到日志或返回给前端
                    pass

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"导入失败: {str(e)}")

    # ... 返回结果保持不变 ...
```

---

### 3.3 前端实现方案

#### 3.3.1 导入向导组件

**文件**: `frontend/src/components/ImportWizard.tsx`

```typescript
/**
 * 导入向导组件
 * 提供分步骤的导入体验
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Download, ArrowLeft, ArrowRight, Info
} from 'lucide-react';
import { caseApi, type ImportCasesResponse } from '../services/api';
import { Loading } from './Loading';

enum ImportStep {
  SELECT_FILE,    // 选择文件
  VALIDATE,       // 验证文件
  UPLOAD,         // 上传处理
  RESULT,         // 结果展示
}

interface ImportWizardProps {
  onComplete?: () => void;
}

export const ImportWizard = ({ onComplete }: ImportWizardProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<ImportStep>(ImportStep.SELECT_FILE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportCasesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 文件格式说明
  const formatGuide = {
    json: {
      name: 'JSON 格式',
      description: '适合批量导入多个结构化病例',
      example: `[
  {
    "patient_id": "100231",
    "patient_name": "Robert Miller",
    "age": 63,
    "gender": "male",
    "chief_complaint": "persistent cough...",
    "medical_history": "COPD diagnosed...",
    ...
  }
]`,
    },
    txt: {
      name: 'TXT 格式',
      description: '适合导入标准病例模板',
      example: `Medical Case Report
Patient ID: 100231
Name: Robert Miller
Age: 63
Gender: Male

Chief Complaint:
The patient complains of...`,
    },
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setCurrentStep(ImportStep.VALIDATE);

    // 自动验证
    validateFile(file);
  };

  // 验证文件
  const validateFile = (file: File) => {
    const allowedTypes = ['.json', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      setError('不支持的文件格式，请上传 JSON 或 TXT 文件');
      setCurrentStep(ImportStep.SELECT_FILE);
      return false;
    }

    // 文件大小限制（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小超过 10MB 限制');
      setCurrentStep(ImportStep.SELECT_FILE);
      return false;
    }

    return true;
  };

  // 执行导入
  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      setCurrentStep(ImportStep.UPLOAD);

      const importResult = await caseApi.importCases(selectedFile);
      setResult(importResult);
      setCurrentStep(ImportStep.RESULT);

    } catch (err: any) {
      setError(err.response?.data?.detail || '导入失败，请重试');
      setCurrentStep(ImportStep.VALIDATE);
    } finally {
      setUploading(false);
    }
  };

  // 下载示例文件
  const downloadExample = (type: 'json' | 'txt') => {
    let content = '';
    let filename = '';

    if (type === 'json') {
      content = JSON.stringify([
        {
          patient_id: "100231",
          patient_name: "Robert Miller",
          age: 63,
          gender: "male",
          chief_complaint: "persistent cough with sputum production",
          medical_history: "COPD diagnosed at 60",
          family_history: "Father died of lung cancer at age 70",
          lifestyle_factors: "Smoker (40 pack-years)",
          medications: "Salbutamol inhaler, Tiotropium",
          lab_results: "FEV1 reduced to 55% predicted",
          physical_exam: "Prolonged expiration, wheezing on auscultation",
          vital_signs: "BP 130/85 mmHg, HR 90 bpm",
        }
      ], null, 2);
      filename = 'example_case.json';
    } else {
      content = `Medical Case Report
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
Respiratory Exam: Prolonged expiration, wheezing on auscultation.`;
      filename = 'example_case.txt';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { step: ImportStep.SELECT_FILE, label: '选择文件' },
        { step: ImportStep.VALIDATE, label: '验证' },
        { step: ImportStep.UPLOAD, label: '导入' },
        { step: ImportStep.RESULT, label: '完成' },
      ].map((item, index) => (
        <div key={item.step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep >= item.step
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index + 1}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              currentStep >= item.step ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {item.label}
          </span>
          {index < 3 && (
            <div
              className={`w-16 h-1 mx-4 ${
                currentStep > item.step ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case ImportStep.SELECT_FILE:
        return (
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 拖拽上传区域 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                点击上传或拖拽文件到此处
              </p>
              <p className="text-sm text-gray-500">
                支持 JSON 和 TXT 格式，文件大小不超过 10MB
              </p>
            </div>

            {/* 格式说明 */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(formatGuide).map(([key, guide]) => (
                <div key={key} className="bg-gray-50 rounded-xl p-6 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-800">
                      {guide.name}
                    </h4>
                    <button
                      onClick={() => downloadExample(key as 'json' | 'txt')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      下载示例
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
                  <pre className="bg-white p-3 rounded-lg text-xs text-gray-700 overflow-x-auto">
                    {guide.example}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        );

      case ImportStep.VALIDATE:
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              文件验证通过
            </h3>
            <p className="text-gray-600 mb-6">
              文件名：{selectedFile?.name}<br />
              文件大小：{((selectedFile?.size || 0) / 1024).toFixed(2)} KB
            </p>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">验证失败</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setCurrentStep(ImportStep.SELECT_FILE);
                }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
              >
                重新选择
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                开始导入
              </button>
            </div>
          </div>
        );

      case ImportStep.UPLOAD:
        return (
          <div className="text-center">
            <Loading size="lg" text="正在导入病例，请稍候..." />
          </div>
        );

      case ImportStep.RESULT:
        return (
          <div className="text-center">
            {result && (
              <>
                {result.failed_count === 0 ? (
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                ) : result.success_count === 0 ? (
                  <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                ) : (
                  <Info className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                )}

                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {result.message}
                </h3>
                <p className="text-gray-600 mb-6">
                  共处理 {result.total_count} 个病例：
                  成功 {result.success_count} 个，失败 {result.failed_count} 个
                </p>

                {result.failed_cases.length > 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 text-left max-h-64 overflow-y-auto">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">失败详情：</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {result.failed_cases.map((failed, idx) => (
                        <li key={idx}>
                          • 病历号 {failed.patient_id}: {failed.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setResult(null);
                      setCurrentStep(ImportStep.SELECT_FILE);
                    }}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                  >
                    继续导入
                  </button>
                  <button
                    onClick={() => {
                      onComplete?.();
                      navigate('/');
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold"
                  >
                    完成
                  </button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">导入病例</h1>
                <p className="text-xs text-gray-500 mt-0.5">批量导入病例数据</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {renderStepIndicator()}
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
};
```

---

#### 3.3.2 更新路由

**文件**: `frontend/src/App.tsx`

```typescript
import { ImportWizard } from './components/ImportWizard';

// 添加路由
<Route path="/import" element={<ImportWizard />} />
```

---

#### 3.3.3 更新 CaseList 导入按钮

**文件**: `frontend/src/components/CaseList.tsx`

将导入按钮改为跳转到导入向导：

```typescript
// 修改导入按钮的 onClick
<button
  onClick={() => navigate('/import')}
  className="px-5 py-2.5 bg-white border-2 border-blue-500 text-blue-500 hover:bg-blue-50 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow whitespace-nowrap"
>
  <Upload className="w-4 h-4" />
  <span>导入病例</span>
</button>
```

---

## 🧪 四、测试计划

### 4.1 单元测试

#### 后端测试
**文件**: `tests/test_txt_parser.py`

```python
import pytest
from api.utils.txt_parser import IntelligentTxtParser, TemplateFormat

class TestIntelligentTxtParser:
    """TXT 解析器单元测试"""

    def test_standard_en_format(self):
        """测试标准英文格式解析"""
        content = """
Medical Case Report
Patient ID: 100231
Name: Robert Miller
Age: 63
Gender: Male

Chief Complaint:
Persistent cough with sputum production.

Medical History:
COPD diagnosed at 60.
"""
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        assert result.success == True
        assert result.format == TemplateFormat.STANDARD_EN
        assert result.data['patient_id'] == '100231'
        assert result.data['patient_name'] == 'Robert Miller'
        assert result.data['age'] == 63
        assert result.data['gender'] == 'male'
        assert 'cough' in result.data['chief_complaint'].lower()
        assert result.confidence > 0.7

    def test_missing_required_fields(self):
        """测试缺少必填字段"""
        content = "Just some random text without structure"
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        assert result.success == False
        assert len(result.errors) > 0
        assert 'missing' in result.errors[0].lower() or '缺少' in result.errors[0]

    def test_chinese_format(self):
        """测试中文格式解析"""
        content = """
病历号: 100231
姓名: 张三
年龄: 45
性别: 男

主诉:
胸痛三天。
"""
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        assert result.success == True
        assert result.format == TemplateFormat.STANDARD_ZH
        assert result.data['patient_id'] == '100231'
        assert result.data['age'] == 45
        assert result.data['gender'] == 'male'

    def test_fallback_parsing(self):
        """测试降级解析"""
        content = """
Patient info:
ID: P12345
John Doe, 50 years old, Male
He has chest pain.
"""
        parser = IntelligentTxtParser()
        result = parser.parse(content)

        # 降级解析可能成功也可能失败，但不应该崩溃
        assert result is not None
        assert result.format == TemplateFormat.UNKNOWN
        assert len(result.warnings) > 0
```

---

#### 前端测试
**文件**: `frontend/src/components/__tests__/ImportWizard.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ImportWizard } from '../ImportWizard';
import { caseApi } from '../../services/api';

jest.mock('../../services/api');

describe('ImportWizard', () => {
  it('renders file selection step initially', () => {
    render(
      <BrowserRouter>
        <ImportWizard />
      </BrowserRouter>
    );

    expect(screen.getByText(/点击上传或拖拽文件/i)).toBeInTheDocument();
  });

  it('validates file type', async () => {
    render(
      <BrowserRouter>
        <ImportWizard />
      </BrowserRouter>
    );

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/file/i) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/不支持的文件格式/i)).toBeInTheDocument();
    });
  });

  it('proceeds to validation step after file selection', async () => {
    render(
      <BrowserRouter>
        <ImportWizard />
      </BrowserRouter>
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/file/i) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/文件验证通过/i)).toBeInTheDocument();
    });
  });
});
```

---

### 4.2 集成测试

#### 端到端测试场景
**文件**: `tests/test_import_flow.py`

```python
import pytest
from fastapi.testclient import TestClient
from api.main import app
from io import BytesIO

client = TestClient(app)

def test_txt_import_success():
    """测试 TXT 文件导入成功"""
    content = """
Medical Case Report
Patient ID: TEST001
Name: Test Patient
Age: 50
Gender: Male

Chief Complaint:
Test complaint.
"""

    files = {'file': ('test.txt', BytesIO(content.encode('utf-8')), 'text/plain')}
    response = client.post('/api/cases/import', files=files)

    assert response.status_code == 200
    data = response.json()
    assert data['success_count'] == 1
    assert data['failed_count'] == 0

def test_json_import_batch():
    """测试 JSON 批量导入"""
    cases = [
        {
            "patient_id": "JSON001",
            "patient_name": "Patient One",
            "age": 30,
            "gender": "male",
            "chief_complaint": "Test 1"
        },
        {
            "patient_id": "JSON002",
            "patient_name": "Patient Two",
            "age": 40,
            "gender": "female",
            "chief_complaint": "Test 2"
        }
    ]

    import json
    files = {'file': ('test.json', BytesIO(json.dumps(cases).encode('utf-8')), 'application/json')}
    response = client.post('/api/cases/import', files=files)

    assert response.status_code == 200
    data = response.json()
    assert data['success_count'] == 2

def test_import_duplicate_patient_id():
    """测试导入重复病历号"""
    # 第一次导入
    content1 = """
Patient ID: DUP001
Name: First Import
Age: 30
Gender: Male
Chief Complaint: Test
"""
    files1 = {'file': ('test1.txt', BytesIO(content1.encode('utf-8')), 'text/plain')}
    response1 = client.post('/api/cases/import', files=files1)
    assert response1.status_code == 200

    # 第二次导入相同病历号
    content2 = """
Patient ID: DUP001
Name: Second Import
Age: 35
Gender: Male
Chief Complaint: Test
"""
    files2 = {'file': ('test2.txt', BytesIO(content2.encode('utf-8')), 'text/plain')}
    response2 = client.post('/api/cases/import', files=files2)

    data = response2.json()
    assert data['failed_count'] == 1
    assert '已存在' in data['failed_cases'][0]['error']
```

---

### 4.3 边界测试

- 空文件
- 超大文件（> 10MB）
- 格式错误的 JSON
- 编码问题（UTF-8, GBK 等）
- 缺少必填字段
- 特殊字符处理
- 并发导入

---

## 📈 五、性能优化

### 5.1 后端优化

1. **批量数据库插入**
   ```python
   # 使用 bulk_insert 而不是逐条 commit
   db.bulk_insert_mappings(MedicalCase, case_list)
   db.commit()
   ```

2. **异步处理大文件**
   - 对于 > 100 条病例的导入，使用后台任务
   - 提供任务进度查询接口

3. **解析缓存**
   - 缓存常见的解析模式
   - 使用 LRU 缓存提升性能

### 5.2 前端优化

1. **文件分片上传**（大文件场景）
2. **虚拟滚动**（结果列表）
3. **懒加载组件**
4. **防抖和节流**

---

## 🔒 六、安全考虑

### 6.1 文件上传安全

1. **文件类型验证**
   - 白名单机制（只允许 .json, .txt）
   - MIME 类型检查
   - 文件内容检查

2. **文件大小限制**
   - 单文件不超过 10MB
   - 限制并发上传数量

3. **病毒扫描**（生产环境）
   - 集成 ClamAV 或类似工具

### 6.2 数据验证

1. **输入验证**
   - 所有字段严格验证
   - SQL 注入防护
   - XSS 防护

2. **权限控制**（未来）
   - 用户级别的数据隔离
   - 导入操作审计日志

---

## 📊 七、监控和日志

### 7.1 关键指标

- 导入成功率
- 平均导入时间
- 文件解析成功率
- 错误类型分布

### 7.2 日志记录

```python
import logging

logger = logging.getLogger(__name__)

# 导入开始
logger.info(f"Import started: file={filename}, size={file_size}")

# 解析结果
logger.info(f"Parse result: format={format}, confidence={confidence}")

# 导入结果
logger.info(f"Import completed: success={success_count}, failed={failed_count}")

# 错误详情
logger.error(f"Import error: {error_detail}", exc_info=True)
```

---

## 🚀 八、实施时间表

### Phase 1（核心功能）- 预计 3-5 天

| 任务 | 估时 | 负责人 | 状态 |
|------|------|--------|------|
| 设计 TXT 解析器 | 4h | Backend | ⏳ |
| 实现 TXT 解析器 | 8h | Backend | ⏳ |
| 编写解析器单元测试 | 4h | Backend | ⏳ |
| 更新导入 API | 4h | Backend | ⏳ |
| 实现 ImportWizard 组件 | 8h | Frontend | ⏳ |
| 集成测试 | 4h | Full Stack | ⏳ |
| 文档更新 | 2h | Full Stack | ⏳ |

**总计**: 约 34 小时

---

## ✅ 九、验收标准

### 9.1 功能完整性

- ✅ 支持标准英文病例模板（如 Robert Miller 格式）
- ✅ 支持标准中文病例模板
- ✅ 支持 JSON 批量导入
- ✅ 提供导入向导界面
- ✅ 提供示例文件下载
- ✅ 详细的错误提示和修复建议

### 9.2 性能指标

- ✅ TXT 解析成功率 > 95%（标准格式）
- ✅ 单文件导入时间 < 3 秒
- ✅ 100 条病例批量导入 < 10 秒

### 9.3 用户体验

- ✅ 导入流程步骤清晰（不超过 4 步）
- ✅ 错误信息友好，用户能理解
- ✅ 有明确的进度反馈
- ✅ 支持示例文件下载

### 9.4 代码质量

- ✅ 单元测试覆盖率 > 80%
- ✅ 集成测试通过
- ✅ 代码 Review 通过
- ✅ 文档完整

---

## 📚 十、附录

### A. 支持的病例模板格式

#### A.1 标准英文格式
```
Medical Case Report
Patient ID: <ID>
Name: <Name>
Age: <Age>
Gender: <Gender>

Chief Complaint:
<Complaint text>

Medical History:
<History text>

Physical Examination Findings:
<Exam text>
```

#### A.2 标准中文格式
```
病例报告
病历号: <编号>
姓名: <姓名>
年龄: <年龄>
性别: <性别>

主诉:
<主诉内容>

既往史:
<病史内容>

体格检查:
<检查内容>
```

---

### B. JSON 导入格式规范

```json
[
  {
    "patient_id": "string (required)",
    "patient_name": "string (required)",
    "age": "integer (required, 0-150)",
    "gender": "string (required, male|female|other)",
    "chief_complaint": "string (required)",
    "medical_history": "string (optional)",
    "family_history": "string (optional)",
    "lifestyle_factors": "string (optional)",
    "medications": "string (optional)",
    "lab_results": "string (optional)",
    "physical_exam": "string (optional)",
    "vital_signs": "string (optional)",
    "language": "string (optional, en|zh|both, default: en)"
  }
]
```

---

### C. 错误代码表

| 错误代码 | 描述 | 用户提示 | 解决方案 |
|----------|------|----------|----------|
| E001 | 文件格式不支持 | 不支持的文件格式 | 请上传 JSON 或 TXT 文件 |
| E002 | 文件过大 | 文件大小超过限制 | 请上传小于 10MB 的文件 |
| E003 | 缺少必填字段 | 缺少必填字段: XXX | 请补充缺失的字段 |
| E004 | 病历号重复 | 病历号已存在 | 请修改病历号或删除已有病例 |
| E005 | 解析失败 | 文件解析失败 | 请检查文件格式是否正确 |
| E006 | 数据验证失败 | 字段格式错误: XXX | 请修正错误的字段格式 |

---

### D. 参考资源

- [FastAPI 文件上传文档](https://fastapi.tiangolo.com/tutorial/request-files/)
- [React Dropzone](https://react-dropzone.js.org/)
- [正则表达式测试工具](https://regex101.com/)
- [医疗病历标准格式参考](https://www.example.com)

---

## 🔄 十一、变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2025-01-24 | 初始版本 | Claude Code |

---

## ✍️ 十二、审批签字

| 角色 | 姓名 | 签字 | 日期 |
|------|------|------|------|
| 方案设计 | Claude Code | ✅ | 2025-01-24 |
| 技术评审 | _待定_ | ⏳ | - |
| 产品评审 | _待定_ | ⏳ | - |
| 最终批准 | _待定_ | ⏳ | - |

---

**文档状态**: 📝 待审批
**下一步**: 等待技术评审和批准后开始实施
