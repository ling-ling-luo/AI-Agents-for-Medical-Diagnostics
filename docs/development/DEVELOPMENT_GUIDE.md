# AI 医疗诊断系统 - 开发手册

> **版本**: v1.0
> **更新日期**: 2025-11-18
> **项目**: AI-Agents-for-Medical-Diagnostics

## 📋 目录

1. [系统架构概览](#系统架构概览)
2. [前后端功能对应关系](#前后端功能对应关系)
3. [当前实现状态](#当前实现状态)
4. [功能增强计划](#功能增强计划)
5. [开发规范](#开发规范)
6. [快速开始](#快速开始)

---

## 系统架构概览

### 技术栈总览

```
┌─────────────────────────────────────────────────────────┐
│                      用户浏览器                          │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────┐
│              前端 (React 19 + TypeScript)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  CaseList    │  │  CaseDetail  │  │ DiagnosisResult│ │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│         │                  │                  │          │
│  ┌──────▼──────────────────▼──────────────────▼──────┐  │
│  │         services/api.ts (Axios)                   │  │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │ CORS: http://localhost:5173
┌─────────────────────▼───────────────────────────────────┐
│              后端 (FastAPI + Python 3.10)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │             api/main.py (REST API)              │   │
│  │    - GET  /api/cases                            │   │
│  │    - POST /api/cases/{id}/run-diagnosis         │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                   │
│  ┌──────────────────▼──────────────────────────────┐   │
│  │  Main.py: run_multi_agent_diagnosis()           │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                   │
│  ┌──────────────────▼──────────────────────────────┐   │
│  │        Utils/Agents.py (多智能体系统)            │   │
│  │  - Cardiologist (心脏科)                         │   │
│  │  - Psychologist (心理学)                         │   │
│  │  - Pulmonologist (呼吸科)                        │   │
│  │  - MultidisciplinaryTeam (综合诊断)             │   │
│  └──────────────────┬──────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│         LLM Gateway (Claude Sonnet 4.5)                 │
│     Base URL: https://llm-gateway.momenta.works         │
└─────────────────────────────────────────────────────────┘
```

### 关键组件

| 层级 | 组件 | 技术栈 | 职责 |
|-----|------|--------|------|
| **前端** | React App | React 19 + TypeScript + Vite | UI展示、用户交互 |
| **前端** | API Service | Axios | HTTP 请求封装 |
| **后端** | FastAPI | Python FastAPI | REST API 服务 |
| **后端** | 诊断引擎 | LangChain + OpenAI | 多智能体诊断逻辑 |
| **AI模型** | Claude 4.5 | Anthropic | 大语言模型推理 |

---

## 前后端功能对应关系

### 功能映射表

| 功能模块 | 前端组件 | 前端调用 | 后端路由 | 后端实现 | 状态 |
|---------|---------|---------|---------|---------|------|
| **病例列表** | `CaseList.tsx` | `caseApi.getCases()` | `GET /api/cases` | `list_cases()` | ✅ 完成 |
| **运行诊断** | `CaseDetail.tsx` | `caseApi.runDiagnosis(id)` | `POST /api/cases/{id}/run-diagnosis` | `run_diagnosis()` | ✅ 完成 |
| **诊断结果展示** | `DiagnosisResult.tsx` | - | - | - | ✅ 完成 |

### 数据流详解

#### 1️⃣ 获取病例列表流程

```
用户访问首页 (/)
    │
    ├─→ [前端] CaseList.tsx 组件挂载
    │       └─→ useEffect 触发
    │
    ├─→ [前端] caseApi.getCases()
    │       └─→ axios.get('http://localhost:8000/api/cases')
    │
    ├─→ [后端] FastAPI: @app.get("/api/cases")
    │       └─→ list_cases() 函数
    │           └─→ 返回 MOCK_CASES
    │
    └─→ [前端] 渲染病例卡片
            └─→ 显示 patient_name, chief_complaint
```

**请求示例**:
```http
GET /api/cases HTTP/1.1
Host: localhost:8000
```

**响应示例**:
```json
[
  {
    "id": 1,
    "patient_name": "Demo Patient",
    "chief_complaint": "Chest pain and anxiety"
  }
]
```

---

#### 2️⃣ 运行诊断流程

```
用户点击"运行诊断"
    │
    ├─→ [前端] navigate(`/case/${caseId}`)
    │       └─→ CaseDetail.tsx 组件挂载
    │
    ├─→ [前端] caseApi.runDiagnosis(caseId)
    │       └─→ axios.post(`/api/cases/${caseId}/run-diagnosis`)
    │
    ├─→ [后端] FastAPI: @app.post("/api/cases/{case_id}/run-diagnosis")
    │       └─→ run_diagnosis(case_id) 函数
    │
    ├─→ [后端] 调用 run_multi_agent_diagnosis(sample_report)
    │       │
    │       ├─→ 并发运行 3 个专科智能体:
    │       │   ├─ Cardiologist (心脏科)
    │       │   ├─ Psychologist (心理学)
    │       │   └─ Pulmonologist (呼吸科)
    │       │
    │       ├─→ 收集专科诊断结果
    │       │
    │       ├─→ 运行 MultidisciplinaryTeam (综合团队)
    │       │   └─→ 生成最终诊断摘要
    │       │
    │       └─→ 返回结构化 Markdown:
    │           # Multidisciplinary Diagnosis
    │           ## Final Diagnosis (Summary)
    │           ## Specialist Reports
    │
    └─→ [前端] DiagnosisResult.tsx 渲染
            └─→ markdown-to-jsx 渲染 HTML
```

**请求示例**:
```http
POST /api/cases/1/run-diagnosis HTTP/1.1
Host: localhost:8000
Content-Type: application/json
```

**响应示例**:
```json
{
  "case_id": 1,
  "diagnosis_markdown": "# Multidisciplinary Diagnosis\n\n## Final Diagnosis (Summary)\n..."
}
```

---

## 当前实现状态

### ✅ 已完成功能

#### 前端功能

- [x] **病例列表页** (`CaseList.tsx`)
  - 从后端 API 获取病例数据
  - 响应式卡片布局展示
  - 加载状态和错误处理
  - 导航到诊断详情页

- [x] **病例详情页** (`CaseDetail.tsx`)
  - 自动触发诊断流程
  - 实时加载状态提示
  - 支持手动重新运行诊断
  - 返回列表页导航

- [x] **诊断结果展示** (`DiagnosisResult.tsx`)
  - Markdown 格式渲染
  - 诊断摘要自动提取
  - 可折叠详细报告
  - 专科报告分区展示

- [x] **UI/UX 优化**
  - Tailwind CSS 响应式设计
  - Lucide React 图标集成
  - 加载动画和过渡效果
  - 错误提示和重试机制

#### 后端功能

- [x] **REST API 服务**
  - FastAPI 框架
  - CORS 跨域支持
  - Pydantic 数据验证

- [x] **病例管理**
  - 内存 Mock 数据
  - 病例列表查询

- [x] **诊断引擎**
  - 多智能体并发运行
  - 3 个专科智能体 + 综合团队
  - 结构化 Markdown 输出
  - 错误处理和降级

- [x] **LLM 集成**
  - LangChain + OpenAI API
  - Claude Sonnet 4.5 模型
  - 可配置 API 网关

---

### ⚠️ 功能限制

| 限制 | 描述 | 影响 |
|-----|------|------|
| **数据持久化** | 仅内存 Mock 数据，无数据库 | 重启后数据丢失 |
| **病例管理** | 只有 1 个硬编码 Mock 病例 | 无法添加/编辑病例 |
| **诊断数据** | 每次诊断使用相同示例病历 | 实际病例内容未使用 |
| **用户认证** | 无用户系统 | 所有用户共享数据 |
| **历史记录** | 不保存诊断历史 | 无法回溯过往诊断 |
| **并发控制** | 无请求去重/缓存 | 重复请求浪费资源 |

---

## 功能增强计划

### 阶段 1: 数据持久化 (优先级: 高)

#### 目标
将内存 Mock 数据迁移到 MySQL 数据库，实现真实的数据存储。

#### 任务清单

- [ ] **1.1 数据库设计与部署**
  - [ ] 设计 `medical_cases` 表结构
  - [ ] 设计 `diagnosis_history` 表结构
  - [ ] 创建数据库迁移脚本
  - [ ] 部署 MySQL 实例

- [ ] **1.2 后端集成**
  - [ ] 添加 SQLAlchemy ORM 依赖
  - [ ] 创建数据库模型 (`models/case.py`)
  - [ ] 实现数据库会话管理 (`db/session.py`)
  - [ ] 重构 API 路由使用数据库查询

- [ ] **1.3 数据迁移**
  - [ ] 导入现有 `Medical Reports/` 文件夹中的病例
  - [ ] 创建初始化数据脚本

#### 数据库表结构设计

##### `medical_cases` 表

```sql
CREATE TABLE medical_cases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    patient_name VARCHAR(100),
    age INT,
    gender ENUM('male', 'female', 'other'),
    chief_complaint TEXT,
    raw_report LONGTEXT NOT NULL COMMENT '原始病历全文',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient_id (patient_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### `diagnosis_history` 表

```sql
CREATE TABLE diagnosis_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    case_id BIGINT NOT NULL,
    diagnosis_markdown LONGTEXT NOT NULL COMMENT 'AI 诊断结果',
    model_name VARCHAR(50) DEFAULT 'claude-sonnet-4.5',
    run_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INT COMMENT '诊断执行耗时（毫秒）',
    FOREIGN KEY (case_id) REFERENCES medical_cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id),
    INDEX idx_run_timestamp (run_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 后端代码变更示例

**新建文件: `api/models/case.py`**

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class MedicalCase(Base):
    __tablename__ = "medical_cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), unique=True, nullable=False)
    patient_name = Column(String(100))
    age = Column(Integer)
    gender = Column(Enum('male', 'female', 'other'))
    chief_complaint = Column(Text)
    raw_report = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**修改文件: `api/main.py`**

```python
# 修改前 (Mock 数据)
MOCK_CASES: List[Case] = [...]

@app.get("/api/cases")
async def list_cases() -> List[Case]:
    return MOCK_CASES

# 修改后 (数据库查询)
@app.get("/api/cases")
async def list_cases(db: Session = Depends(get_db)) -> List[Case]:
    cases = db.query(MedicalCase).order_by(MedicalCase.created_at.desc()).all()
    return [Case(
        id=c.id,
        patient_name=c.patient_name,
        chief_complaint=c.chief_complaint
    ) for c in cases]
```

---

### 阶段 2: 病例管理功能 (优先级: 高)

#### 目标
实现完整的病例 CRUD（创建、查询、更新、删除）功能。

#### 任务清单

- [ ] **2.1 后端 API 扩展**
  - [ ] `POST /api/cases` - 创建新病例
  - [ ] `GET /api/cases/{id}` - 获取病例详情
  - [ ] `PUT /api/cases/{id}` - 更新病例信息
  - [ ] `DELETE /api/cases/{id}` - 删除病例
  - [ ] 添加分页支持 (`?page=1&limit=20`)
  - [ ] 添加搜索功能 (`?search=关键词`)

- [ ] **2.2 前端功能实现**
  - [ ] 创建 `CaseForm.tsx` 组件（新增/编辑病例）
  - [ ] 创建 `CaseUpload.tsx` 组件（上传病历文件）
  - [ ] 在 `CaseList.tsx` 添加搜索栏
  - [ ] 在 `CaseDetail.tsx` 添加编辑/删除按钮
  - [ ] 实现分页组件
  - [ ] 添加表单验证

#### API 接口定义

##### 创建病例
```http
POST /api/cases HTTP/1.1
Content-Type: application/json

{
  "patient_id": "P20251118001",
  "patient_name": "张三",
  "age": 45,
  "gender": "male",
  "chief_complaint": "胸痛伴气短 3 天",
  "raw_report": "患者男性，45岁...(完整病历)"
}
```

##### 更新病例
```http
PUT /api/cases/1 HTTP/1.1
Content-Type: application/json

{
  "chief_complaint": "更新后的主诉",
  "raw_report": "更新后的病历内容"
}
```

---

### 阶段 3: 诊断历史功能 (优先级: 中)

#### 目标
保存每次诊断的历史记录，支持查看和对比历史诊断结果。

#### 任务清单

- [ ] **3.1 后端实现**
  - [ ] 在 `run_diagnosis` 中保存诊断记录到 `diagnosis_history` 表
  - [ ] `GET /api/cases/{id}/diagnoses` - 获取诊断历史列表
  - [ ] `GET /api/diagnoses/{id}` - 获取单次诊断详情
  - [ ] 记录诊断执行耗时

- [ ] **3.2 前端实现**
  - [ ] 创建 `DiagnosisHistory.tsx` 组件
  - [ ] 在 `CaseDetail.tsx` 添加"历史诊断"标签页
  - [ ] 实现时间轴展示历史记录
  - [ ] 支持对比多次诊断结果

---

### 阶段 4: 用户认证与权限 (优先级: 中)

#### 目标
实现用户注册、登录、权限控制，确保数据安全。

#### 任务清单

- [ ] **4.1 后端实现**
  - [ ] 添加 `users` 表
  - [ ] 实现 JWT 认证机制
  - [ ] `POST /api/auth/register` - 用户注册
  - [ ] `POST /api/auth/login` - 用户登录
  - [ ] `GET /api/auth/me` - 获取当前用户信息
  - [ ] 添加权限中间件（医生/管理员/患者）

- [ ] **4.2 前端实现**
  - [ ] 创建 `Login.tsx` 和 `Register.tsx` 组件
  - [ ] 实现 Token 存储（localStorage）
  - [ ] 添加路由守卫（需登录才能访问）
  - [ ] 在请求头中自动添加 Token

---

### 阶段 5: 性能优化与高级功能 (优先级: 低)

#### 任务清单

- [ ] **5.1 性能优化**
  - [ ] 实现诊断结果缓存（Redis）
  - [ ] 添加请求去重机制
  - [ ] 前端实现虚拟滚动（长列表优化）
  - [ ] 后端添加数据库连接池优化

- [ ] **5.2 高级功能**
  - [ ] 支持多种 LLM 模型切换（Claude、GPT-4、本地模型）
  - [ ] 导出诊断报告为 PDF
  - [ ] 暗色主题支持
  - [ ] 实时诊断进度推送（WebSocket）
  - [ ] 诊断结果可视化图表

---

## 开发规范

### 代码风格

#### Python (后端)

```python
# 遵循 PEP 8 规范
# 使用 Black 格式化工具
# 使用类型注解

from typing import List, Optional

async def get_cases(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[MedicalCase]:
    """获取病例列表。

    Args:
        db: 数据库会话
        skip: 跳过的记录数（分页）
        limit: 返回的最大记录数

    Returns:
        病例列表
    """
    return db.query(MedicalCase).offset(skip).limit(limit).all()
```

#### TypeScript (前端)

```typescript
// 使用严格模式
// 遵循 ESLint 规则
// 使用函数式组件和 Hooks

interface CaseListProps {
  showArchived?: boolean;
}

export const CaseList: React.FC<CaseListProps> = ({ showArchived = false }) => {
  const [cases, setCases] = useState<Case[]>([]);

  // 清晰的函数命名
  const fetchCases = async (): Promise<void> => {
    try {
      const data = await caseApi.getCases();
      setCases(data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    }
  };

  return (
    <div className="case-list">
      {/* JSX 代码 */}
    </div>
  );
};
```

### Git 提交规范

使用 Conventional Commits 规范:

```bash
feat: 添加病例搜索功能
fix: 修复诊断结果无法展开的问题
docs: 更新开发手册
style: 格式化代码（不影响功能）
refactor: 重构诊断引擎
test: 添加 API 单元测试
chore: 更新依赖版本
```

### 分支策略

```
main (生产环境)
  └─ develop (开发环境)
      ├─ feature/database-integration (功能分支)
      ├─ feature/case-crud (功能分支)
      └─ fix/diagnosis-error-handling (修复分支)
```

---

## 快速开始

### 环境要求

- **Python**: 3.10.12
- **Node.js**: 18+ (推荐 LTS)
- **MySQL**: 8.0+ (未来需要)
- **操作系统**: Linux / macOS / Windows

### 安装步骤

#### 1. 克隆仓库

```bash
git clone <repository-url>
cd AI-Agents-for-Medical-Diagnostics
```

#### 2. 后端设置

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（复制示例文件）
cp apikey.env.example apikey.env
# 编辑 apikey.env，填入真实的 API 密钥

# 启动后端服务
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 4. 访问应用

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

### 常用命令

| 命令 | 描述 |
|-----|------|
| `python Main.py` | 运行独立诊断脚本 |
| `uvicorn api.main:app --reload` | 启动后端 API（开发模式） |
| `npm run dev` | 启动前端开发服务器 |
| `npm run build` | 构建前端生产版本 |
| `npm run lint` | 检查前端代码规范 |

---

## 附录

### 项目文件结构

```
AI-Agents-for-Medical-Diagnostics/
├── api/                          # 后端 API 目录
│   └── main.py                   # FastAPI 应用入口
├── frontend/                     # 前端项目目录
│   ├── src/
│   │   ├── components/           # React 组件
│   │   ├── services/             # API 调用服务
│   │   ├── types/                # TypeScript 类型定义
│   │   └── main.tsx              # 前端入口
│   └── package.json
├── Utils/
│   └── Agents.py                 # 多智能体定义
├── Medical Reports/              # 示例病历文件
├── results/                      # 诊断结果输出目录
├── Main.py                       # 独立诊断脚本
├── apikey.env                    # 环境变量配置
├── requirements.txt              # Python 依赖
├── CLAUDE.md                     # Claude Code 指导文档
├── DEVELOPMENT_GUIDE.md          # 本开发手册
└── README.md                     # 项目说明文档
```

### 环境变量说明

**apikey.env**:

```bash
# OpenAI API 密钥（实际使用 Anthropic Claude）
OPENAI_API_KEY="your-api-key-here"

# LLM 网关地址
OPENAI_BASE_URL="https://llm-gateway.momenta.works"

# 使用的模型名称
LLM_MODEL="gemini-2.5-flash"
```

### 常见问题

#### Q1: 后端启动失败，提示端口被占用

```bash
# 查找占用 8000 端口的进程
lsof -i :8000

# 停止进程
kill -9 <PID>
```

#### Q2: 前端无法连接后端，出现 CORS 错误

检查后端 `api/main.py` 中的 CORS 配置：

```python
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
```

确保包含前端的实际访问地址。

#### Q3: LLM 调用失败，提示认证错误

检查 `apikey.env` 中的 API 密钥是否正确，并确保 `OPENAI_BASE_URL` 可访问。

---

## 联系与贡献

- **Issue 跟踪**: GitHub Issues
- **代码贡献**: 参考 `CONTRIBUTING.md`
- **维护者**: 项目团队

---

**最后更新**: 2025-11-18
**文档版本**: v1.0
