# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 快速启动（开发环境）

### 1) 配置（首次）

- 复制配置模板并按需修改：
  - `apikey.example.env` → `apikey.env`
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
  ```

- 需要后端服务运行的脚本（集成/冒烟测试）：
  ```bash
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

- 复用入口：`Main.py:12` 的 `run_multi_agent_diagnosis(medical_report, model_name=None)`
  - 并发运行 3 个专科智能体（心脏科/心理学/呼吸科）
  - 由多学科团队智能体汇总输出结构化 Markdown
- 智能体定义：`Utils/Agents.py`
  - 这里的英文 prompt 直接影响输出质量；仓库约束为**不要修改 prompt**（如需讨论请先对齐需求）。

> 任何需要“跑诊断”的新功能（API、导出、对比等），应优先复用 `run_multi_agent_diagnosis()`，不要在别处重复拼 prompt 或重复 LLM 调用流程。

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

---

## 项目约定（和容易踩坑的点）

- **提示词约束**：`Utils/Agents.py` 内的英文提示词不要改动（会影响诊断质量与稳定性）。
- **迁移/脚本**：仓库存在 `api/migrations/` 下的脚本式迁移文件；依赖里包含 Alembic，但当前未见典型 `alembic.ini`/版本目录结构，做 DB 结构变更前先确认项目采用的迁移方式。
- **前端 UI 风格**：整体保持“Google 简约风格 / 矩形设计 / 灰色分隔线 / 少装饰”的一致性（Tailwind）。
