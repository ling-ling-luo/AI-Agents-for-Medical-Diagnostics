# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 技术栈与环境

- **后端**: Python 3.10.12
  - LangChain (langchain, langchain-openai, langchain-community, langchain-experimental)
  - FastAPI + Uvicorn (Web API)
  - SQLAlchemy + Alembic (ORM + 数据库迁移)
  - ReportLab, python-docx, markdown (文档导出)
  - python-dotenv (环境变量)

- **前端**:
  - React 19.2.0 + TypeScript + Vite (`frontend/`)
  - Next.js 16.0.3 + TypeScript (`frontend-next/`)
  - Tailwind CSS 4.1.17
  - Axios (API 客户端)

- **数据库**: SQLite (`medical_diagnostics.db`)

## 现有核心架构概览

### 多智能体诊断逻辑

- `Utils/Agents.py`
  - 定义通用基类：`Agent`。
  - 定义 3 个专科智能体：
    - `Cardiologist`（心脏科）
    - `Psychologist`（心理学）
    - `Pulmonologist`（呼吸科）
  - 定义汇总智能体：`MultidisciplinaryTeam`，负责整合各专科的诊断结果。
  - 使用 `langchain_openai.ChatOpenAI`，模型名通过环境变量 `LLM_MODEL` 控制，base_url 通过 `OPENAI_BASE_URL` 控制。
  - 提示词（prompt）目前为英文，直接影响模型行为，修改前需谨慎；本仓库维护者已要求"提示词不要改动"。

- `Main.py`
  - 通过 `dotenv` 从 `apikey.env` 加载：
    - `OPENAI_API_KEY`
    - `OPENAI_BASE_URL`
    - `LLM_MODEL`
  - 读取 `Medical Reports/Medical Rerort - Michael Johnson - Panic Attack Disorder.txt` 作为示例病历。
  - 并发运行 3 个专科智能体，收集它们的诊断结果。
  - 调用 `MultidisciplinaryTeam` 生成最终诊断摘要。
  - 将结果写入 `results/final_diagnosis.txt`。
  - 提供可复用函数：
    - `run_multi_agent_diagnosis(medical_report: str, model_name: str = None) -> str`
      - 输入：任意病历文本 + 可选的模型名称
      - 输出：结构化 markdown，包含：
        - `# Multidisciplinary Diagnosis`
        - `## Final Diagnosis (Summary)`
        - `## Specialist Reports`（按专科分区）
      - **关键**：所有新功能都应通过此函数复用诊断逻辑，而不要重复实现 LLM 调用流程。

### 配置系统

项目使用两级配置系统：

**1. 环境变量配置** (`apikey.env`)
- `OPENAI_API_KEY`: API 密钥
- `OPENAI_BASE_URL`: LLM 网关地址
- `LLM_MODEL`: 默认模型名称（后备值）
- 注意：不要将真实密钥提交到仓库

**2. 模型配置** (`api/config/models.json`)
- 定义前端可选择的所有 AI 模型列表
- 由 `api/config_loader.py` 中的 `ConfigLoader` 类加载
- 支持自动回退到默认模型列表（如果文件不存在或格式错误）
- 配置格式：
  ```json
  {
    "available_models": [
      {"id": "model-id", "name": "显示名称", "provider": "提供商"}
    ]
  }
  ```
- 模板文件：`api/config/models.example.json`
- `.gitignore` 已配置忽略实际配置文件，仅提交模板
- 详见 `CONFIG_GUIDE.md` 获取完整配置指南

**国际化风格**：
- 代码注释和用户可见文本使用中文
- 函数名、类名、变量名使用英文

## Web API 架构

### 后端结构 (`api/` 目录)

**核心文件**：
- `api/main.py`: FastAPI 应用入口，定义所有路由
- `api/models/case.py`: SQLAlchemy ORM 模型 (`MedicalCase`, `DiagnosisHistory`)
- `api/models/user.py`: 用户权限 ORM 模型 (`User`, `Role`, `Permission`)
- `api/db/database.py`: 数据库会话管理
- `api/config_loader.py`: 配置加载工具类
- `api/utils/export.py`: 诊断报告导出工具（支持 PDF、Word、Markdown、JSON）
- `api/utils/case_formatter.py`: 病例格式化工具
- `api/utils/txt_parser.py`: TXT 文件解析器

**认证与权限**：
- `api/auth/security.py`: JWT token 生成/验证，密码哈希
- `api/auth/dependencies.py`: FastAPI 依赖注入（获取当前用户、验证权限）
- `api/auth/permissions.py`: 权限检查装饰器和权限计算逻辑
- `api/routes/auth.py`: 认证相关的 API 路由（注册、登录等）
- `api/init_auth_db.py`: 初始化用户权限数据库，创建默认角色和测试账号

**关键 API 路由**：
- **认证相关** (`/api/auth`):
  - `POST /api/auth/register`: 用户注册（邮箱可选，未提供时自动生成）
  - `POST /api/auth/login`: 用户登录，返回 JWT token
  - `GET /api/auth/me`: 获取当前用户信息
  - `POST /api/auth/change-password`: 修改密码
  - `POST /api/auth/logout`: 登出（客户端操作）

- **病例管理** (`/api/cases`):
  - `GET /api/cases`: 获取病例列表（支持搜索）
  - `POST /api/cases`: 创建新病例
  - `GET /api/cases/{id}`: 获取病例详情
  - `PUT /api/cases/{id}`: 更新病例
  - `DELETE /api/cases/{id}`: 删除病例
  - `POST /api/cases/import`: 批量导入病例（TXT 文件）
  - `POST /api/cases/{id}/run-diagnosis`: 运行 AI 诊断（接受可选 `model` 参数）
  - `GET /api/cases/{id}/diagnoses`: 获取诊断历史
  - `GET /api/cases/{id}/diagnoses/{diagnosis_id}/export`: 导出诊断报告（支持多格式）
  - `POST /api/cases/{id}/diagnoses/export-multiple`: 批量导出诊断（ZIP 文件）

- **系统配置**:
  - `GET /api/models`: 获取可用的 AI 模型列表

**数据库**：
- SQLite 文件：`medical_diagnostics.db`
- 病例相关表：`medical_cases`、`diagnosis_history`
- 用户权限表：`users`、`roles`、`permissions`、`user_roles`（关联表）
- 初始化病例数据库：`python3 api/init_db.py`
- 初始化用户权限：`python3 api/init_auth_db.py`（创建角色和默认账号）

**权限系统架构**：
- **RBAC 模型**：基于角色的访问控制（Role-Based Access Control）
- **三个预定义角色**：
  - `admin`（管理员）：拥有全部权限
  - `doctor`（医生）：可创建/读取/更新病例，运行诊断，导出报告
  - `viewer`（普通用户）：只读权限
- **权限格式**：`resource:action`（如 `case:create`、`diagnosis:read`）
- **权限检查**：在路由层通过 `@require_permission("case:read")` 装饰器验证
- **超级管理员**：`is_superuser=True` 的用户自动拥有所有权限

## 前端架构

项目提供两个前端实现，功能相同但技术栈不同：

### React + Vite 前端 (`frontend/`)
- **技术**: React 19.2.0 + TypeScript + Vite + Tailwind CSS 4.1.17
- **端口**: 5173
- **设计风格**: Google 简约风格，简洁矩形设计，使用浅灰横线分隔模块，避免过度装饰

**认证相关组件**:
  - `Login.tsx`: Google 风格登录页（简约白色背景，蓝色按钮）
  - `Register.tsx`: 用户注册页（无需邮箱，带密码强度提示）
  - `AuthContext.tsx`: 全局认证状态管理（React Context）
  - `ProtectedRoute.tsx`: 路由守卫，支持权限/角色检查
  - `AccountSwitcher.tsx`: 账号切换器（记忆历史登录账号，快速切换）
  - `authApi.ts`: 认证 API 服务层

**业务功能组件**:
  - `HomePage.tsx`: 主页（病例列表/导入/创建，集成账号切换）
  - `CaseList.tsx`: 病例列表页（带分页、搜索、导入功能）
  - `CaseDetail.tsx`: 病例详情页（AI 诊断、模型选择、智能体信息展示）
  - `DiagnosisResult.tsx`: 诊断结果展示（综合诊断默认展开，专科报告点击弹窗）
  - `DiagnosisHistory.tsx`: 诊断历史记录（带导出功能）
  - `AgentInfoModal.tsx`: 智能体详情弹窗（显示提示词和任务说明）
  - `SpecialistReportModal.tsx`: 单个专科报告弹窗
  - `AllReportsModal.tsx`: 全览所有专科报告弹窗
  - `ModelSelector.tsx`: AI 模型选择器
  - `ImportWizard.tsx`: 病例导入向导
  - `SmartDropdown.tsx`: 智能下拉菜单（视口检测）
  - `OnboardingTour.tsx`: 首页引导组件（首次登录引导）
  - `CaseDetailTour.tsx`: 病例详情页引导组件（分有诊断和无诊断两种流程）

**API 服务层**:
  - `src/services/api.ts`: 病例管理 API（Axios 客户端，自动注入 JWT token）
  - `src/services/authApi.ts`: 认证 API（登录、注册、获取用户信息）

**认证流程**:
  - JWT token 存储在 `localStorage`（key: `access_token`）
  - Axios 请求拦截器自动添加 `Authorization: Bearer {token}` 头
  - 401 响应自动清除 token 并重定向到登录页
  - 历史账号存储在 `localStorage`（key: `saved_accounts`，最多 5 个）

**UI 交互模式**:
  - 智能体信息：在 CaseDetail 页面点击智能体卡片查看详情和提示词
  - 专科报告：点击卡片弹窗查看单个报告，或使用"全览报告"按钮查看所有报告
  - 综合诊断：始终完整展开显示
  - 账号切换：点击右上角用户头像→选择历史账号→输入密码→确认切换

**首次登录引导系统**:
  - **分阶段引导**：系统采用两阶段引导设计，确保用户在对应页面才能看到相关功能介绍
  - **首页引导** (`OnboardingTour.tsx`)：
    - 触发条件：用户首次登录时自动触发
    - 引导内容：介绍病例列表、创建病例、导入病例、账号管理等首页功能
    - 完成标记：`localStorage` 中的 `onboarding_home_completed` 键
    - 完成后行为：设置 `should_show_detail_tour` 标记，提示用户进入详情页继续引导
  - **详情页引导** (`CaseDetailTour.tsx`)：
    - 触发条件：用户从首页完成引导后，首次进入任意病例详情页时触发
    - 两种流程：
      - **无诊断流程**：介绍病例信息、模型选择、运行诊断功能（4 步）
      - **有诊断流程**：介绍综合诊断、专科报告、导出功能（4 步）
    - 完成标记：`localStorage` 中的 `onboarding_detail_completed` 键
  - **重新观看引导**：
    - 位置：账号切换器下拉菜单中的"重新观看引导"按钮
    - 行为：清除所有引导完成标记，刷新页面重新触发首页引导
  - **LocalStorage 键说明**：
    - `onboarding_home_completed`: 标记用户是否完成首页引导
    - `onboarding_detail_completed`: 标记用户是否完成详情页引导
    - `should_show_detail_tour`: 临时标记，指示下次进入详情页时应显示引导
  - **技术实现**：使用 `react-joyride` 库实现交互式引导，支持进度显示、跳过、前后翻页等功能



**前后端通信**：
- 前端通过 REST API 调用后端，不直接访问 LLM 或数据库
- API 基础 URL: `http://localhost:8000`
- 所有 API 调用集中在 `services/api.ts` 中管理

## 常用命令与开发流程

### Python 环境 & 依赖

- 创建虚拟环境并安装依赖（Linux/macOS）：
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  ```

- 运行现有诊断脚本：
  ```bash
  source venv/bin/activate
  python Main.py
  ```
  - 输出文件路径：`results/final_diagnosis.txt`

### 后端 API 开发

- 初始化数据库：
  ```bash
  # 初始化病例数据库
  python3 api/init_db.py

  # 初始化用户权限数据库（创建角色和默认测试账号）
  python3 api/init_auth_db.py
  ```

- 启动开发服务器：
  ```bash
  source venv/bin/activate
  python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
  ```

- 访问 API 文档：
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

- 默认测试账号（由 `init_auth_db.py` 创建）：
  - 管理员：`admin` / `admin123`（全部权限）
  - 医生：`doctor` / `doctor123`（可读写病例、运行诊断）
  - 普通用户：`viewer` / `viewer123`（只读权限）

### 前端开发 (React)

- 安装依赖：
  ```bash
  cd frontend
  npm install
  ```

- 启动开发服务器：
  ```bash
  npm run dev
  ```
  - 访问地址：`http://localhost:5173`

- 构建生产版本：
  ```bash
  npm run build
  ```
  - 输出目录：`dist/`

- 代码检查：
  ```bash
  npm run lint
  ```

- 预览生产构建：
  ```bash
  npm run preview
  ```

### 前端开发 (Next.js)

- 安装依赖：
  ```bash
  cd frontend-next
  npm install
  ```

- 启动开发服务器：
  ```bash
  npm run dev
  ```
  - 访问地址：`http://localhost:3000`

## 核心功能流程

### 认证与授权流程
1. 用户访问前端 → 自动跳转到登录页（如未登录）
2. 用户输入用户名和密码 → 前端调用 `POST /api/auth/login`
3. 后端验证用户身份 → 返回 JWT token 和用户信息（含角色和权限列表）
4. 前端保存 token 到 localStorage → 保存用户信息到历史账号列表
5. 后续所有 API 请求自动携带 `Authorization: Bearer {token}` 头
6. 后端通过 `get_current_user` 依赖注入验证 token 并获取用户
7. 路由层通过 `@require_permission` 装饰器检查用户权限
8. 如 token 失效（401），前端自动清除本地数据并跳转登录页

### AI 诊断流程
1. 用户在前端选择病例并点击"开始诊断"
2. 前端可选择 AI 模型（从 `api/config/models.json` 加载）
3. 前端调用 `POST /api/cases/{id}/run-diagnosis` (附带可选的 `model` 参数)
4. 后端调用 `run_multi_agent_diagnosis(raw_report, model_name)`
5. 三个专科智能体并发分析病例
6. `MultidisciplinaryTeam` 汇总生成最终诊断
7. 诊断结果保存到 `diagnosis_history` 表
8. 返回结构化 Markdown 给前端展示

### 导出功能流程
1. 用户选择单个或多个诊断记录
2. 前端调用导出 API（单个或批量）
3. 后端使用 `DiagnosisExporter` 类生成文件
4. 支持格式：PDF、Word、Markdown、JSON
5. 批量导出时打包为 ZIP 文件

### 病例导入流程
1. 用户上传 TXT 文件（单个或多个）
2. 前端调用 `POST /api/cases/import`
3. 后端使用 `txt_parser.py` 解析文件
4. 批量创建病例记录
5. 返回导入结果统计

## 开发注意事项

### 1. LLM 集成
- **必须**通过 `run_multi_agent_diagnosis()` 复用诊断逻辑
- **禁止**在新代码中重复编写 prompt 或直接调用 LLM
- 所有 Agent 类都支持 `model_name` 参数来动态切换模型

### 2. 提示词管理
- `Utils/Agents.py` 中的英文提示词**不要修改**
- 这些提示词经过精心设计，直接影响诊断质量
- 如需调整，必须在注释中说明意图并保持英文语义准确

### 3. 配置管理
- 切换账号时只需修改 `apikey.env` 和 `api/config/models.json`
- 不要将实际配置文件提交到 Git（已在 `.gitignore` 中配置）
- 参考 `CONFIG_GUIDE.md` 了解配置详情

### 4. 数据库操作
- 使用 SQLAlchemy ORM 模型（`api/models/case.py`）
- 字段名注意：`run_timestamp`（非 `timestamp`），`model_name`（非 `model`）
- 修改模型后需要通过 Alembic 生成迁移

### 5. 前端开发
- React 前端是主要开发目标（`frontend/`）
- 所有状态管理使用 React Hooks
- UI 使用 Tailwind CSS，保持一致的设计语言
- 病例列表每页显示 9 个病例（分页功能）
- 用户偏好（如选择的模型）使用 `localStorage` 持久化

**UI 设计原则**：
- **简洁矩形设计**：使用 `rounded-none`，避免过度圆角
- **浅灰分隔线**：使用 `border-gray-200` 分隔模块和内容区域
- **减少层叠**：避免卡片套卡片、多层阴影等视觉堆砌
- **弹窗交互**：详细内容使用弹窗展示，而非页内展开
- **一致的按钮样式**：文本按钮为主，渐变色用于主要操作
- **无多余装饰**：移除了 Sparkles 图标、彩色渐变条等装饰元素

### 6. 导出功能
- 使用 `DiagnosisExporter` 类处理所有导出逻辑
- PDF 导出使用 ReportLab，注意中文字体支持
- Markdown 格式转换注意粗体标记的正则匹配（使用 `re.sub`）
- 批量导出使用 ZIP 打包

### 7. 认证系统开发
- 使用 JWT (JSON Web Tokens) 进行无状态认证
- 密码使用 bcrypt 哈希（通过 passlib 库）
- **重要**：需要 `bcrypt==4.1.3`（不要使用 5.x 版本，存在与 passlib 的兼容性问题）
- 认证依赖包：`python-jose[cryptography]`、`passlib[bcrypt]`、`email-validator`
- 前端注册时邮箱为可选，未提供时自动生成 `{username}@local.user`
- 账号切换功能通过 localStorage 存储历史登录记录，支持快速切换（需输入密码验证）

### 8. 模态框组件架构
前端使用多个模态框组件展示详细信息：

**AgentInfoModal** (智能体详情弹窗):
- 展示智能体的简介、工作任务、分析重点、提示词模板
- 在 CaseDetail 页面点击智能体卡片时触发
- 提示词显示为浅灰背景的代码块

**SpecialistReportModal** (单个专科报告弹窗):
- 展示单个专科的完整诊断报告（Markdown 格式）
- 在 DiagnosisResult 页面点击专科卡片时触发
- 支持滚动查看长内容

**AllReportsModal** (全览报告弹窗):
- 垂直排列展示所有三个专科的报告
- 使用浅灰横线分隔各专科内容
- 在 DiagnosisResult 页面点击"全览报告"按钮时触发
- 更大的弹窗尺寸 (`max-w-6xl`)

**设计统一性**:
- 所有模态框使用相同的结构：头部（标题+关闭按钮）、内容区、底部（操作按钮）
- 统一使用 `rounded-none` 矩形设计
- 统一使用 `border-gray-200` 作为分隔线颜色
- 关闭按钮样式一致：`hover:bg-gray-100`