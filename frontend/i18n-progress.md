# 国际化（i18n）翻译进度

## 项目概述

本项目采用 **react-i18next** 实现国际化功能，支持中文（zh-CN）和英文（en-US）双语切换。

## 实施策略

- **渐进式翻译**：优先翻译高频使用的界面模块
- **模块化管理**：每个页面/组件的翻译独立为一个命名空间
- **Fallback 机制**：未翻译内容默认显示中文

---

## 翻译进度

### ✅ 已完成模块

#### 1. 基础框架（2025-12-22）
- [x] i18n 配置文件 (`src/i18n/index.ts`)
- [x] 语言切换组件 (`src/components/LanguageSwitcher.tsx`)
- [x] 翻译文件结构 (`src/i18n/locales/`)

#### 2. 布局组件（2025-12-22）
**文件**: `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`

**翻译内容**:
- [x] 侧边栏导航菜单（首页、病例列表、导入病例等）
- [x] 应用名称和版本信息
- [x] 面包屑导航
- [x] 语言切换按钮

**翻译文件**:
- `src/i18n/locales/zh-CN.json` - `app.*`, `nav.*`, `breadcrumb.*`
- `src/i18n/locales/en-US.json` - 对应英文翻译

#### 3. 账号切换组件（2025-12-22）
**文件**: `src/components/AccountSwitcher.tsx`

**翻译内容**:
- [x] 角色显示（管理员、医生、普通用户）
- [x] 切换账号菜单标签
- [x] 时间显示（刚刚、X分钟前、X小时前、X天前）
- [x] 密码输入提示
- [x] 确认、取消、切换中等按钮文字
- [x] 错误提示信息
- [x] 退出登录按钮

**翻译文件**:
- `src/i18n/locales/zh-CN.json` - `common.*`, `account.*`
- `src/i18n/locales/en-US.json` - 对应英文翻译

#### 4. 登录/注册页面（2025-12-22）
**文件**: `src/components/Login.tsx`, `src/components/Register.tsx`

**翻译内容**:
- [x] 登录表单（用户名、密码、登录按钮、登录中状态）
- [x] 注册表单（用户名、姓名、密码、确认密码）
- [x] 表单验证错误提示（必填项、长度限制、格式验证）
- [x] 密码强度提示（太短、弱、中、强）
- [x] 密码匹配提示
- [x] 页面标题和副标题
- [x] 注册/登录链接文案
- [x] 测试账户提示
- [x] 占位符文本
- [x] 用户名格式提示

**翻译文件**:
- `src/i18n/locales/zh-CN.json` - `auth.*` (28个翻译键)
- `src/i18n/locales/en-US.json` - 对应英文翻译

#### 5. 仪表盘页面（2025-12-22）
**文件**: `src/pages/Dashboard.tsx`

**翻译内容**:
- [x] 欢迎标题和副标题
- [x] 统计卡片（总病例数、总诊断数、今日新增）
- [x] 加载状态提示
- [x] 错误提示和重新加载按钮
- [x] 系统概览区域
- [x] 使用指南和系统状态文本

**翻译文件**:
- `src/i18n/locales/zh-CN.json` - `dashboard.*` (11个翻译键)
- `src/i18n/locales/en-US.json` - 对应英文翻译

---

### ⏳ 待翻译模块

---

#### 4. 仪表盘页面（待计划）
**文件**: `src/pages/Dashboard.tsx`

**计划翻译内容**:
- [ ] 统计卡片标题（总病例数、今日诊断等）
- [ ] 图表标题和图例
- [ ] 快捷操作按钮

---

#### 5. 病例列表页面（待计划）
**文件**: `src/components/CaseList.tsx`

**计划翻译内容**:
- [ ] 表格列标题（病例编号、患者姓名、诊断状态等）
- [ ] 筛选器标签
- [ ] 操作按钮（查看、编辑、删除）
- [ ] 分页控件

---

#### 6. 病例详情页面（待计划）
**文件**: `src/components/CaseDetail.tsx`

**计划翻译内容**:
- [ ] 字段标签（患者信息、病史、诊断结果等）
- [ ] 操作按钮（导出、打印、开始诊断）
- [ ] 状态标签

---

#### 7. 创建/编辑病例表单（待计划）
**文件**: `src/components/CreateCaseForm.tsx`, `src/components/EditCaseWrapper.tsx`

**计划翻译内容**:
- [ ] 表单字段标签
- [ ] 占位符文本
- [ ] 提交/取消按钮
- [ ] 表单验证提示

---

#### 8. 导入向导（待计划）
**文件**: `src/components/ImportWizard.tsx`

**计划翻译内容**:
- [ ] 步骤标题
- [ ] 上传区域提示
- [ ] 预览表格
- [ ] 确认/跳过按钮

---

#### 9. 诊断历史页面（待计划）
**文件**: `src/pages/AllDiagnosisHistory.tsx`

**计划翻译内容**:
- [ ] 列表标题
- [ ] 筛选器选项
- [ ] 诊断记录状态标签

---

#### 10. 诊断详情页面（待计划）
**文件**: `src/pages/DiagnosisDetailPage.tsx`

**计划翻译内容**:
- [ ] Markdown 报告中的固定标题（如果需要）
- [ ] 导出选项
- [ ] 返回按钮

---

#### 11. 数据分析页面（待计划）
**文件**: `src/pages/DataAnalysis.tsx`

**计划翻译内容**:
- [ ] 图表标题
- [ ] 统计维度名称
- [ ] 日期范围选择器

---

#### 12. 设置页面（待计划）
**文件**: `src/pages/Settings.tsx`

**计划翻译内容**:
- [ ] 设置项标题和描述
- [ ] 保存/重置按钮

---

#### 13. 通用组件（待计划）
**文件**: `src/components/AccountSwitcher.tsx`, `src/components/Pagination.tsx` 等

**计划翻译内容**:
- [ ] 账号切换菜单（个人资料、退出登录）
- [ ] 分页控件文案（共 X 条、第 X 页）
- [ ] 通用提示（加载中、暂无数据、操作成功/失败）

---

## 使用指南

### 如何添加新翻译

1. **在翻译文件中添加键值对**：
   ```json
   // src/i18n/locales/zh-CN.json
   {
     "newModule": {
       "title": "新模块标题"
     }
   }

   // src/i18n/locales/en-US.json
   {
     "newModule": {
       "title": "New Module Title"
     }
   }
   ```

2. **在组件中使用**：
   ```tsx
   import { useTranslation } from 'react-i18next';

   function MyComponent() {
     const { t } = useTranslation();
     return <h1>{t('newModule.title')}</h1>;
   }
   ```

### 命名规范

- **命名空间**：按功能模块分组（如 `auth`, `case`, `diagnosis`）
- **键名**：使用驼峰命名法（camelCase）
- **层级**：最多 3 层嵌套，保持简洁

### 测试checklist

- [ ] 切换语言后所有文案正确显示
- [ ] 未翻译内容显示中文 fallback
- [ ] 语言选择保存到 localStorage
- [ ] 刷新页面后语言设置保持

---

## 技术细节

- **i18n 库**: react-i18next v14+
- **支持语言**: zh-CN（中文）, en-US（英文）
- **Fallback 语言**: zh-CN
- **存储方式**: localStorage (`i18nextLng` 键)
- **自动检测**: 浏览器语言 + 本地存储

---

## 下一步翻译计划（P1 优先级）

根据当前进度，接下来将翻译 P1 优先级的核心业务页面：

### 第一阶段：仪表盘页面（Dashboard）
**预计翻译键数量**: ~15个
**文件**: `src/pages/Dashboard.tsx`
**复杂度**: ⭐️⭐️ (中等)

**待翻译内容**:
- 页面标题和欢迎语
- 统计卡片（总病例数、总诊断数、今日新增）
- 加载状态提示
- 错误提示
- 重新加载按钮
- 系统概览区域（使用指南、系统状态）

**预计翻译键**:
```
dashboard.welcome
dashboard.subtitle
dashboard.totalCases
dashboard.totalDiagnoses
dashboard.todayNew
dashboard.loading
dashboard.loadError
dashboard.reload
dashboard.systemOverview
dashboard.userGuide
dashboard.systemStatus
```

---

### 第二阶段：病例列表页面（CaseList）
**预计翻译键数量**: ~50个
**文件**: `src/components/CaseList.tsx` (755行，内容最多)
**复杂度**: ⭐️⭐️⭐️⭐️⭐️ (非常复杂)

**待翻译内容**:
- 筛选器标签（患者姓名、病历号、主诉、性别、诊断状态、创建者、创建日期）
- 筛选器占位符
- 下拉选项（性别：男/女/全部，诊断状态：已诊断/未诊断/全部）
- 日期筛选使用说明（4条提示）
- 快捷时间段按钮（今天、近7天、近30天、全部）
- 重置筛选按钮
- 病例卡片字段（患者姓名、病历号、性别、年龄、主诉、诊断状态等）
- 操作按钮（查看详情、编辑、删除、查看诊断历史、开始诊断）
- 分页控件（首页、上一页、下一页、末页、跳转到第X页）
- 空状态提示（无病例、筛选无结果）
- 加载状态
- 错误提示
- 删除确认对话框

**预计翻译键分类**:
```
// 筛选器 (15个)
caseList.filter.patientName
caseList.filter.patientId
caseList.filter.chiefComplaint
caseList.filter.gender
caseList.filter.diagnosedStatus
caseList.filter.creator
caseList.filter.createdDate
caseList.filter.all
caseList.filter.male
caseList.filter.female
caseList.filter.diagnosed
caseList.filter.notDiagnosed
caseList.filter.reset
caseList.filter.dateHelp
caseList.filter.quickDates.*

// 卡片和操作 (15个)
caseList.card.patientName
caseList.card.patientId
caseList.card.gender
caseList.card.age
caseList.card.chiefComplaint
caseList.action.view
caseList.action.edit
caseList.action.delete
caseList.action.viewHistory
caseList.action.startDiagnosis

// 分页 (10个)
caseList.pagination.first
caseList.pagination.prev
caseList.pagination.next
caseList.pagination.last
caseList.pagination.jumpTo
caseList.pagination.total
caseList.pagination.page

// 状态提示 (10个)
caseList.loading
caseList.loadError
caseList.empty
caseList.noResults
caseList.deleteSuccess
caseList.deleteFailed
caseList.reload
```

---

### 翻译策略

**按阶段逐步翻译，每完成一个阶段暂停检查：**

1. ✅ **已完成**: P0 页面（登录、注册、账号切换）
2. ⏳ **当前阶段**: Dashboard（预计20分钟）
3. ⏳ **下一阶段**: CaseList（预计40分钟，内容最多）
4. ⏳ **后续阶段**: 其他 P1/P2 页面

**每个阶段完成后**:
- 让用户测试翻译效果
- 确认没问题后提交 Git
- 更新进度文档
- 继续下一个页面

---

## 下一步计划（按优先级排序）

### 优先级说明
- **P0（最高）**：必须先翻译，影响用户登录和基本导航
- **P1（高）**：核心业务功能，使用频率高
- **P2（中）**：辅助功能，提升体验
- **P3（低）**：低频功能，可最后处理

### 翻译计划

1. ✅ **P0** - 完成基础框架和布局组件（2025-12-22）
   - 侧边栏、导航栏、面包屑

2. ✅ **P0** - 账号切换组件（AccountSwitcher）- 已完成（2025-12-22）
   - 用户下拉菜单、账号切换、退出登录
   - **位置**：Header 右上角，所有页面可见
   - **文件**：`src/components/AccountSwitcher.tsx`

3. ✅ **P0** - 登录/注册页面 - 已完成（2025-12-22）
   - 登录表单、注册表单、验证提示
   - **原因**：所有用户首次进入系统必经路径
   - **文件**：`src/components/Login.tsx`, `src/components/Register.tsx`

4. ✅ **P1** - 仪表盘页面（Dashboard）- 已完成（2025-12-22）
   - 统计卡片、图表标题、快捷操作
   - **原因**：登录后首页，高频访问
   - **文件**：`src/pages/Dashboard.tsx`

5. ⏳ **P1** - 病例列表页面（CaseList）
   - 表格列标题、筛选器、操作按钮、分页
   - **原因**：核心业务功能，医生主要工作界面
   - **文件**：`src/components/CaseList.tsx`

6. ⏳ **P1** - 创建/编辑病例表单
   - 表单字段、验证提示、提交按钮
   - **原因**：创建病例的关键流程
   - **文件**：`src/components/CreateCaseForm.tsx`, `src/components/EditCaseWrapper.tsx`

7. ⏳ **P1** - 病例详情页面（CaseDetail）
   - 患者信息、病史、诊断结果、操作按钮
   - **原因**：查看病例详情的核心页面
   - **文件**：`src/components/CaseDetail.tsx`

8. ⏳ **P2** - 诊断历史页面
   - 列表标题、筛选器、状态标签
   - **原因**：查看历史记录，辅助决策
   - **文件**：`src/pages/AllDiagnosisHistory.tsx`

9. ⏳ **P2** - 诊断详情页面
   - 报告标题、导出选项、返回按钮
   - **原因**：查看诊断详情
   - **文件**：`src/pages/DiagnosisDetailPage.tsx`

10. ⏳ **P2** - 导入向导（ImportWizard）
    - 步骤标题、上传提示、预览表格
    - **原因**：批量导入功能
    - **文件**：`src/components/ImportWizard.tsx`

11. ⏳ **P3** - 数据分析页面
    - 图表标题、统计维度、日期选择器
    - **原因**：数据可视化，管理员使用
    - **文件**：`src/pages/DataAnalysis.tsx`

12. ⏳ **P3** - 设置页面
    - 设置项标题、保存/重置按钮
    - **原因**：低频使用的配置页面
    - **文件**：`src/pages/Settings.tsx`

13. ⏳ **P2** - 通用组件（Pagination等）
    - 分页控件、通用提示、加载状态
    - **原因**：贯穿多个页面的通用元素
    - **文件**：多个组件

---

## 维护记录

| 日期 | 负责人 | 变更内容 |
|------|-------|---------|
| 2025-12-22 | Claude | 初始化 i18n 框架，完成侧边栏/导航栏翻译 |
| 2025-12-22 | Claude | 完成账号切换组件（AccountSwitcher）翻译 |
| 2025-12-22 | Claude | 完成登录/注册页面（Login & Register）翻译，包含28个auth翻译键 |
| 2025-12-22 | Claude | 完成仪表盘页面（Dashboard）翻译，包含11个dashboard翻译键 |

