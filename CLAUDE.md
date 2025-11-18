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
  - 提示词（prompt）目前为英文，直接影响模型行为，修改前需谨慎；本仓库维护者已要求“提示词不要改动”。

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

## 建议的 Web / 数据库扩展架构

本仓库当前主要是“脚本 + LLM 智能体”，未来需求是：
- 提供一个 Web API（FastAPI），前端可以通过 HTTP 调用。
- 使用 MySQL 存储病例数据和 AI 诊断结果。

建议结构（未来在此基础上扩展）：

- 后端 API（建议新建 `api/` 目录）：
  - `api/main.py`：FastAPI 应用入口。
    - 路由示例：
      - `GET /api/cases`：获取病例列表（初期可返回 mock 数据或空列表）。
      - `POST /api/cases/{case_id}/run-diagnosis`：对指定病例运行 AI 诊断。
    - 通过 `from Main import run_multi_agent_diagnosis` 复用现有诊断逻辑。
  - 未来可以新增：
    - `models/case.py`：SQLAlchemy ORM 模型（映射到 MySQL 的 `medical_cases` 表）。
    - `db/session.py`：数据库会话管理（Engine / SessionLocal）。

- 数据库（MySQL）建模建议：
  - 表：`medical_cases`
    - `id` (BIGINT, PK, AUTO_INCREMENT)
    - `patient_name` (VARCHAR) — 患者姓名（可选）
    - `patient_id` (VARCHAR) — 内部病历号
    - `age` (INT)
    - `gender` (ENUM / VARCHAR)
    - `chief_complaint` (TEXT) — 主诉摘要
    - `raw_report` (LONGTEXT) — 原始病历全文
    - `ai_diagnosis_markdown` (LONGTEXT) — `run_multi_agent_diagnosis` 的输出
    - `created_at` / `updated_at` (DATETIME)

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

### FastAPI 开发（在加入依赖后）

假设已在 `requirements.txt` 中加入 `fastapi` 和 `uvicorn[standard]`，并创建了 `api/main.py`：

- 启动开发服务器：
  ```bash
  source venv/bin/activate
  uvicorn api.main:app --reload
  ```

- 访问自动生成的文档（如果启用）：
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

### 接口约定（建议）

- `GET /api/cases`
  - 用于前端病例列表页。
  - 初期可以返回：`[]` 或若干 mock 对象：`{"id": 1, "patient_name": "Demo"}`。

- `POST /api/cases/{case_id}/run-diagnosis`
  - 用于对单个病例运行 AI 诊断。
  - 后端应：
    1. 从数据库中加载该 `case_id` 对应的 `raw_report`；初期可以用内置示例文本代替。
    2. 调用 `run_multi_agent_diagnosis(raw_report)` 获取 markdown。
    3. 将结果写回数据库（`ai_diagnosis_markdown`），并返回 JSON：
       ```json
       {
         "case_id": 123,
         "diagnosis_markdown": "# Multidisciplinary Diagnosis..."
       }
       ```

## 对未来 Claude Code 的注意事项

1. 复用现有 LLM 逻辑
   - 优先通过 `run_multi_agent_diagnosis` 来获取诊断结果，不要在新代码中重复写 prompt 或直接调用底层 LLM。

2. 尊重提示词
   - `Utils/Agents.py` 中的英文提示词对业务行为影响极大，仓库维护者明确要求“提示词不要修改”。如需调整，请在注释中说明意图并保持英文语义准确。

3. 国际化风格
   - 源码注释和用户 facing 文本当前以中文为主，技术名词保留英文（如类名 / 函数名 / API 名称）。新增文案时建议延续这种风格。

4. 数据库接入
   - 在真正接入 MySQL 之前，可以先用内存中的 mock 数据结构实现 `/api/cases` 和 `/run-diagnosis`，再逐步引入 SQLAlchemy 模型与会话管理。

5. 前端集成
   - 未来如增加前端项目（React + TypeScript 等），建议通过 REST API 调用本后端，而不是直接在前端访问 LLM 或数据库。
