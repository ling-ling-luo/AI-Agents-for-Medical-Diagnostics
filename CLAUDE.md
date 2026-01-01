# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 快速启动（开发环境）

### 1) 配置（首次）

- 复制配置模板并按需修改：
  - 创建 `apikey.env`（参考项目需求配置 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`LLM_MODEL`、`JWT_SECRET_KEY` 等）
  - `api/config/models.example.json` → `api/config/models.json`

### 2) 后端（FastAPI）

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 初始化数据库（病例表 + 认证/权限表 + 默认账号）
python3 api/init_db.py
python3 api/init_auth_db.py

# 启动 API（默认 8000）
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3) 前端（React + Vite）

```bash
cd frontend
npm install
npm run dev
```

前端默认 `http://localhost:5173`，后端 Swagger 在 `http://localhost:8000/docs`。

**默认测试账号**（由 `init_auth_db.py` 创建）：
- 管理员：`admin` / `admin123`
- 医生：`doctor` / `doctor123`
- 普通用户：`viewer` / `viewer123`

---

## 常用命令

### 后端

- 运行命令行示例诊断（会读示例病例并输出到 `results/`）：
  ```bash
  source venv/bin/activate
  python Main.py
  ```

- 仅初始化数据库：
  ```bash
  source venv/bin/activate
  python3 api/init_db.py
  ```

- 仅初始化用户/权限（会创建默认测试账号）：
  ```bash
  source venv/bin/activate
  python3 api/init_auth_db.py
  ```

### 测试

- pytest（当前主要覆盖 TXT 解析器）：
  ```bash
  source venv/bin/activate
  pytest tests/test_txt_parser.py

  # 运行所有 pytest 测试
  pytest
  ```

- 需要后端服务运行的脚本（集成/冒烟测试）：
  ```bash
  # 确保后端服务已在 8000 端口运行

  # 权限/RBAC 行为（requests 调用本地 API）
  python test_permissions.py

  # 病例编号自动生成（requests 调用本地 API）
  python test_auto_case_id.py

  # auth API 冒烟测试（curl）
  bash test_auth_api.sh
  ```

### 前端

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

---

## 代码架构（大图）

### 1) 诊断核心：多智能体 + 汇总

- 复用入口：`Main.py:13` 的 `run_multi_agent_diagnosis(medical_report, model_name=None, language="en")`
  - 并发运行 3 个专科智能体（心脏科/心理学/呼吸科）
  - 由多学科团队智能体汇总输出结构化 Markdown
  - 支持中英文输出：`language="zh"` 输出中文诊断报告，`language="en"` 输出英文诊断报告
- 智能体定义：`Utils/Agents.py`
  - 包含中英文两套完整的 prompt，内容严格对应翻译，不做风格和内容改动
  - 中文 prompt 和英文 prompt 均不应随意修改，以保持诊断质量和稳定性（如需讨论请先对齐需求）

> 任何需要"跑诊断"的新功能（API、导出、对比等），应优先复用 `run_multi_agent_diagnosis()`，不要在别处重复拼 prompt 或重复 LLM 调用流程。

### 2) Web API：FastAPI + SQLAlchemy + RBAC

- 应用入口：`api/main.py`
  - 注册路由：`api/routes/auth.py`、`api/routes/users.py`、`api/routes/roles.py`
  - 病例/诊断相关路由也集中在 `api/main.py`
- 数据库：`api/db/database.py`
  - SQLite 文件：`medical_diagnostics.db`
- ORM：
  - 病例与诊断历史：`api/models/case.py`
  - 用户/角色/权限：`api/models/user.py`
- 权限体系：`api/auth/permissions.py` + `api/auth/dependencies.py`
  - 路由通过依赖注入校验权限（例如 `require_case_read` 等）

### 3) 配置：环境变量 + 模型列表

- `apikey.env`：LLM 相关参数（如 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`LLM_MODEL`）以及 JWT 配置。
- `api/config/models.json`：前端可选模型列表
  - 加载逻辑：`api/config_loader.py`

### 4) 导入/导出

- TXT 导入解析：`api/utils/txt_parser.py`
  - 对应单测：`tests/test_txt_parser.py`
- 导出：`api/utils/export.py`（PDF/Word/Markdown/JSON）

### 5) 前端：React Router + Auth Context + API Service

- 入口：`frontend/src/main.tsx`
- 路由：`frontend/src/App.tsx`
  - 受保护路由：`ProtectedRoute` + `Layout`
- 认证状态：`frontend/src/context/AuthContext.tsx`
- API 封装（Axios）：`frontend/src/services/api.ts`
  - token 存储在 `localStorage` 并通过请求拦截器注入 `Authorization`
- 技术栈：
  - React 19 + TypeScript
  - Vite（构建工具）
  - Tailwind CSS 4（样式框架）
  - React Router（路由）
  - Axios（HTTP 客户端）

---

## 项目约定（和容易踩坑的点）

- **提示词约束**：`Utils/Agents.py` 内的提示词（中文和英文）不要随意改动（会影响诊断质量与稳定性）。项目现支持中英文两套 prompt：
  - 英文 prompt：原有英文提示词保持不变
  - 中文 prompt：严格对应翻译的中文版本
  - 前端根据用户界面语言自动选择对应的 prompt，确保诊断报告输出语言与界面一致
- **迁移/脚本**：仓库存在 `api/migrations/` 下的脚本式迁移文件；依赖里包含 Alembic，但当前未见典型 `alembic.ini`/版本目录结构，做 DB 结构变更前先确认项目采用的迁移方式。
- **前端 UI 风格**：整体保持"Google 简约风格 / 矩形设计 / 灰色分隔线 / 少装饰"的一致性（Tailwind）。详见 `DESIGN_SYSTEM.md`。
  - 所有卡片使用统一样式：`bg-white border border-gray-200 rounded-lg shadow-sm`
  - 标准内边距：`p-8`（2rem），卡片间距：`space-y-8`
  - 文字层级：H1 用 `text-2xl`，H2 用 `text-lg`，正文用 `text-base`
  - 避免过度装饰和 sticky 定位
- **环境要求**：Python 3.10+、Node.js 18+、SQLite 3
