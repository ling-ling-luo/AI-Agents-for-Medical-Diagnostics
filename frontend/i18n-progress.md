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

---

### ⏳ 待翻译模块

#### 3. 登录/注册页面（待计划）
**文件**: `src/components/Login.tsx`, `src/components/Register.tsx`

**计划翻译内容**:
- [ ] 登录表单（用户名、密码、登录按钮）
- [ ] 注册表单
- [ ] 表单验证错误提示
- [ ] "忘记密码"、"注册账号"等链接文案

**预计翻译键**:
```
auth.login, auth.register, auth.username, auth.password,
auth.forgotPassword, auth.noAccount, auth.hasAccount,
validation.required, validation.minLength, validation.invalidEmail
```

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

## 下一步计划

1. ✅ 完成基础框架和布局组件（2025-12-22）
2. ⏳ 翻译登录/注册页面
3. ⏳ 翻译仪表盘页面
4. ⏳ 翻译病例相关页面
5. ⏳ 翻译其他功能页面
6. ⏳ 完善通用组件翻译

---

## 维护记录

| 日期 | 负责人 | 变更内容 |
|------|-------|---------|
| 2025-12-22 | Claude | 初始化 i18n 框架，完成侧边栏/导航栏翻译 |

