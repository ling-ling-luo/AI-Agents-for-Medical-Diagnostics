# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 技术栈与环境

- 语言：Python 3.10.12
- 现有依赖（requirements.txt）：
  - langchain / langchain-community / langchain-openai / langchain-experimental
  - python-dotenv / dotenv
  - langchain_ollama
  - reportlab
- 建议新增依赖（用于 Web API + MySQL）——请维护者确认后再写入 requirements.txt：
  - fastapi
  - uvicorn[standard]
  - sqlalchemy
  - pymysql  （或其它 MySQL 驱动，例如 mysqlclient / aiomysql）

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
    - `run_multi_agent_diagnosis(medical_report: str) -> str`
      - 输入：任意病历文本。
      - 输出：结构化 markdown，包含：
        - `# Multidisciplinary Diagnosis`
        - `## Final Diagnosis (Summary)`
        - `## Specialist Reports`（按专科分区）
      - 建议所有新功能都通过此函数复用诊断逻辑，而不要重复实现 LLM 调用流程。

### 配置与凭证

- `apikey.env`
  - 由 `.env` 机制加载，当前示例内容类似：
    - `OPENAI_API_KEY="..."`
    - `OPENAI_BASE_URL="https://llm-gateway.momenta.works"`
    - `LLM_MODEL="gemini-2.5-flash"`（可切换为 "claude-sonnet-4.5"、"minimax-m2" 等）
  - 注意：不要将真实密钥提交到仓库。示例值仅供演示。

- 代码中已将大部分注释和用户可见的 print 文案改为中文，便于中文环境开发；函数名、类名、变量名仍为英文。

## Web API 架构

本仓库已实现完整的 Web API 后端：

- 后端 API（`api/` 目录）：
  - `api/main.py`：FastAPI 应用入口。
    - 路由：
      - `GET /api/cases`：获取病例列表。
      - `POST /api/cases/{case_id}/run-diagnosis`：对指定病例运行 AI 诊断。
      - `GET /api/cases/{case_id}/diagnoses`：获取指定病例的诊断历史。
    - 通过 `from Main import run_multi_agent_diagnosis` 复用现有诊断逻辑。
  - `api/models/case.py`：SQLAlchemy ORM 模型。
  - `api/db/database.py`：数据库会话管理。

- 数据库（SQLite）：
  - 文件：`medical_diagnostics.db`
  - 表：`medical_cases` 和 `diagnosis_history`

## 前端架构

本仓库已实现现代化的 React 前端（位于 `frontend/` 目录）和新的 Next.js 前端（位于 `frontend-next/` 目录）：

### 现有 React 前端 (`frontend/`)
- React 19.2.0 + TypeScript
- Vite 构建工具
- Tailwind CSS 4.1.17 样式框架
- Axios API 客户端

### 新的 Next.js 前端 (`frontend-next/`)
- Next.js 16.0.3 + TypeScript
- Tailwind CSS 样式框架
- Google-like 设计语言
- React Server Components 架构
- Axios API 客户端

#### 目录结构
- `src/app/` - Next.js App Router 结构
  - `page.tsx` - 首页（病例搜索）
  - `layout.tsx` - 根布局
  - `case/[id]/page.tsx` - 病例详情页
- `src/services/` - API 服务层
- `src/components/` - 可复用组件

#### 主要功能页面
1. 首页 (`/`) - 病例搜索和列表展示
2. 病例详情页 (`/case/{id}`) - 病例详细信息和 AI 诊断功能

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
  python3 api/init_db.py
  ```

- 启动开发服务器：
  ```bash
  source venv/bin/activate
  python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
  ```

- 访问 API 文档：
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

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

### 接口约定

- `GET /api/cases`
  - 用于前端病例列表页。
  - 返回病例列表。

- `POST /api/cases/{case_id}/run-diagnosis`
  - 用于对单个病例运行 AI 诊断。
  - 后端调用 `run_multi_agent_diagnosis(raw_report)` 获取 markdown 并返回。

- `GET /api/cases/{case_id}/diagnoses`
  - 获取指定病例的诊断历史记录。

## 对未来 Claude Code 的注意事项

1. 复用现有 LLM 逻辑
   - 优先通过 `run_multi_agent_diagnosis` 来获取诊断结果，不要在新代码中重复写 prompt 或直接调用底层 LLM。

2. 尊重提示词
   - `Utils/Agents.py` 中的英文提示词对业务行为影响极大，仓库维护者明确要求"提示词不要修改"。如需调整，请在注释中说明意图并保持英文语义准确。

3. 国际化风格
   - 源码注释和用户 facing 文本当前以中文为主，技术名词保留英文（如类名 / 函数名 / API 名称）。新增文案时建议延续这种风格。

4. 数据库接入
   - 已使用 SQLAlchemy ORM 实现数据库访问，通过 `api/models/case.py` 定义模型。

5. 前端集成
   - 前端通过 REST API 调用后端服务，不要直接在前端访问 LLM 或数据库。

6. 新功能开发建议
   - 后端功能应通过 FastAPI 路由实现
   - 前端功能应通过 Next.js App Router 实现
   - 保持 API 接口的一致性和向后兼容性