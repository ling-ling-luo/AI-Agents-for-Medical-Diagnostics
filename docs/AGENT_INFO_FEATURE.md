# 智能体信息展示功能

## 📋 功能概述

新增了点击专科智能体图标查看详细信息的功能，用户可以了解每个智能体的作用和提示词。

---

## ✨ 功能特点

### 1. **智能体信息模态框**
- 展示智能体的详细信息
- 包含智能体简介、工作任务、分析重点和提示词模板
- 美观的模态框设计，带有渐变背景

### 2. **可交互的图标**
- 每个专科报告卡片右上角添加信息图标（ℹ️）
- 鼠标悬停时图标变色提示
- 点击图标弹出详细信息模态框

### 3. **三个专科智能体**
- **心脏科智能体 (Cardiologist)**: 专注于心血管系统评估
- **心理学智能体 (Psychologist)**: 专注于心理健康评估
- **呼吸科智能体 (Pulmonologist)**: 专注于呼吸系统评估

---

## 🎯 智能体详细信息

### 心脏科智能体 (Cardiologist)

**角色定位**:
- 心血管系统的评估和诊断专家
- 分析心电图、血液检测、Holter监测和超声心动图

**工作任务**:
- 审查患者的心脏检查结果
- 识别可能解释患者症状的心脏问题迹象

**分析重点**:
- 确定是否存在可能在常规检测中被遗漏的心脏问题
- 排除心律失常或结构异常等潜在心脏疾病

**提示词模板**:
```
Act like a cardiologist. You will receive a medical report of a patient.
Task: Review the patient's cardiac workup, including ECG, blood tests, Holter monitor results, and echocardiogram.
Focus: Determine if there are any subtle signs of cardiac issues that could explain the patient's symptoms. Rule out any underlying heart conditions, such as arrhythmias or structural abnormalities, that might be missed on routine testing.
Recommendation: Provide guidance on any further cardiac testing or monitoring needed to ensure there are no hidden heart-related concerns. Suggest potential management strategies if a cardiac issue is identified.
Please only return the possible causes of the patient's symptoms and the recommended next steps.
Medical Report: {medical_report}
```

---

### 心理学智能体 (Psychologist)

**角色定位**:
- 心理健康评估专家
- 识别焦虑、抑郁、创伤等心理问题

**工作任务**:
- 审查患者报告并提供心理评估
- 识别可能影响患者福祉的潜在心理健康问题

**分析重点**:
- 识别焦虑、抑郁或创伤等心理健康问题
- 提供应对这些心理健康问题的指导

**提示词模板**:
```
Act like a psychologist. You will receive a patient's report.
Task: Review the patient's report and provide a psychological assessment.
Focus: Identify any potential mental health issues, such as anxiety, depression, or trauma, that may be affecting the patient's well-being.
Recommendation: Offer guidance on how to address these mental health concerns, including therapy, counseling, or other interventions.
Please only return the possible mental health issues and the recommended next steps.
Patient's Report: {medical_report}
```

---

### 呼吸科智能体 (Pulmonologist)

**角色定位**:
- 呼吸系统疾病诊断和评估专家
- 识别哮喘、COPD、肺部感染等呼吸问题

**工作任务**:
- 审查患者报告并提供肺部评估
- 识别可能影响患者呼吸的潜在呼吸问题

**分析重点**:
- 识别哮喘、COPD或肺部感染等呼吸问题
- 提供应对这些呼吸问题的指导

**提示词模板**:
```
Act like a pulmonologist. You will receive a patient's report.
Task: Review the patient's report and provide a pulmonary assessment.
Focus: Identify any potential respiratory issues, such as asthma, COPD, or lung infections, that may be affecting the patient's breathing.
Recommendation: Offer guidance on how to address these respiratory concerns, including pulmonary function tests, imaging studies, or other interventions.
Please only return the possible respiratory issues and the recommended next steps.
Patient's Report: {medical_report}
```

---

## 🔧 技术实现

### 新增文件

#### 1. `AgentInfoModal.tsx`
模态框组件，用于展示智能体详细信息。

**主要功能**:
- 显示智能体名称和角色
- 展示智能体简介、工作任务、分析重点
- 展示提示词模板（黑色代码块样式）
- 提供关闭按钮

**Props**:
```typescript
interface AgentInfoModalProps {
  agent: AgentInfo;      // 智能体信息
  isOpen: boolean;       // 是否打开
  onClose: () => void;   // 关闭回调
}
```

### 修改文件

#### 1. `DiagnosisResult.tsx`
更新了诊断结果展示组件。

**新增功能**:
- 添加智能体信息配置 (`agentsInfo`)
- 添加模态框状态管理
- 在专科报告卡片添加信息按钮
- 集成 `AgentInfoModal` 组件

**关键代码**:
```typescript
// 智能体信息配置
const agentsInfo: Record<string, AgentInfo> = {
  cardiologist: { ... },
  psychologist: { ... },
  pulmonologist: { ... }
};

// 点击处理
const handleAgentClick = (agentKey: string) => {
  setSelectedAgent(agentsInfo[agentKey]);
  setIsModalOpen(true);
};
```

---

## 🎨 UI/UX 设计

### 模态框设计
- **背景**: 半透明黑色遮罩
- **容器**: 白色圆角卡片，带阴影
- **头部**: 渐变背景，显示智能体图标和名称
- **内容**: 分区展示，每个区块有彩色标识条
- **提示词**: 黑色代码块样式，等宽字体
- **底部**: 浅灰色背景，蓝色渐变关闭按钮

### 交互设计
- **信息按钮**:
  - 默认灰色，悬停时变蓝色
  - 圆形背景，悬停时显示淡蓝色背景
  - 添加 tooltip 提示"查看智能体详情"
- **模态框动画**:
  - 淡入淡出效果
  - 点击背景或关闭按钮关闭

---

## 📱 使用方式

### 用户操作流程

1. **访问诊断详情页面**
   - 对某个病例运行 AI 诊断
   - 等待诊断完成

2. **查看专科报告**
   - 在"专科智能体详细报告"区域
   - 找到各个专科的报告卡片

3. **点击信息图标**
   - 每个专科报告卡片右上角有 ℹ️ 图标
   - 点击图标弹出智能体详细信息

4. **查看智能体信息**
   - 阅读智能体简介、任务和重点
   - 查看完整的提示词模板
   - 了解智能体的工作原理

5. **关闭模态框**
   - 点击右上角 X 按钮
   - 或点击底部"关闭"按钮
   - 或点击模态框外的背景区域

---

## 🎯 应用场景

### 1. **教育和培训**
- 医学生了解 AI 诊断系统的工作原理
- 培训材料中展示智能体的专业分工

### 2. **透明度和可解释性**
- 让用户了解 AI 是如何分析病例的
- 展示每个智能体的专业领域和分析方法

### 3. **系统优化**
- 开发者可以快速查看提示词
- 便于调试和优化智能体配置

### 4. **用户信任**
- 通过展示详细的工作流程增加用户信任
- 让 AI 诊断过程更加透明

---

## 🔍 技术细节

### 组件架构
```
DiagnosisResult (父组件)
├── AgentInfoModal (模态框组件)
│   ├── 头部区域
│   ├── 内容区域
│   │   ├── 智能体简介
│   │   ├── 工作任务
│   │   ├── 分析重点
│   │   └── 提示词模板
│   └── 底部按钮
└── 专科报告列表
    └── 报告卡片 (带信息按钮)
```

### 状态管理
```typescript
const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
```

### 事件处理
```typescript
// 打开模态框
const handleAgentClick = (agentKey: string) => {
  setSelectedAgent(agentsInfo[agentKey]);
  setIsModalOpen(true);
};

// 关闭模态框
const handleCloseModal = () => {
  setIsModalOpen(false);
  setTimeout(() => setSelectedAgent(null), 300);
};
```

---

## 📊 数据结构

### AgentInfo 接口
```typescript
interface AgentInfo {
  name: string;        // 智能体名称（中文）
  role: string;        // 角色名称（英文）
  description: string; // 简介描述
  focus: string;       // 分析重点
  task: string;        // 工作任务
  prompt: string;      // 提示词模板
  icon: any;          // 图标组件
  color: string;      // 主题颜色
}
```

---

## 🚀 未来改进方向

### 功能增强
1. **多语言支持**: 提示词的中英文切换
2. **编辑功能**: 允许管理员在线编辑提示词
3. **版本历史**: 记录提示词的修改历史
4. **性能指标**: 展示每个智能体的准确率等指标

### UI 优化
1. **响应式设计**: 移动端适配优化
2. **动画效果**: 添加更流畅的过渡动画
3. **主题切换**: 支持深色模式
4. **导出功能**: 导出智能体配置为 JSON/PDF

### 交互改进
1. **快捷键**: 支持 ESC 键关闭模态框
2. **搜索功能**: 在提示词中搜索关键词
3. **复制功能**: 一键复制提示词模板
4. **对比功能**: 对比多个智能体的配置

---

## ✅ 功能验收

### 验收标准
- ✅ 点击信息图标能正常打开模态框
- ✅ 模态框正确显示智能体信息
- ✅ 提示词格式化显示正确（代码块样式）
- ✅ 关闭按钮功能正常
- ✅ 点击背景能关闭模态框
- ✅ 支持三个专科智能体信息展示
- ✅ 响应式设计，在不同屏幕尺寸下正常显示
- ✅ 无控制台错误或警告

### 测试场景
1. **基本功能测试**
   - 点击心脏科信息图标
   - 验证显示正确的心脏科智能体信息
   - 关闭模态框

2. **多智能体切换测试**
   - 依次点击三个智能体的信息图标
   - 验证每次都显示正确的信息

3. **边界测试**
   - 快速连续点击信息图标
   - 在模态框打开时点击其他智能体图标
   - 验证状态管理正确

---

## 📝 维护说明

### 修改智能体信息
在 `DiagnosisResult.tsx` 中修改 `agentsInfo` 配置对象：

```typescript
const agentsInfo: Record<string, AgentInfo> = {
  cardiologist: {
    name: '新的名称',
    description: '新的描述',
    // ... 其他字段
  }
};
```

### 添加新的智能体
1. 在 `agentsInfo` 中添加新的智能体配置
2. 在 `extractSpecialistReports` 函数中添加匹配逻辑
3. 确保 `agentKey` 与配置中的键名一致

---

## 🔗 相关文档

- **智能体配置**: `Utils/Agents.py`
- **诊断结果组件**: `frontend/src/components/DiagnosisResult.tsx`
- **模态框组件**: `frontend/src/components/AgentInfoModal.tsx`

---

**功能状态**: ✅ 已完成并上线
**版本**: v1.0.0
**最后更新**: 2025-01-25
