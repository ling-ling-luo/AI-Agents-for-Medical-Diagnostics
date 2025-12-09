# AI 医疗诊断系统

<img width="900" alt="image" src="https://github.com/user-attachments/assets/b7c87bf6-dfff-42fe-b8d1-9be9e6c7ce86">

基于多智能体架构的医疗病例分析系统，使用大语言模型（LLM）模拟多学科专家会诊，提供全面的诊断建议和治疗方案。

⚠️ **免责声明**：本项目仅用于研究与教学目的，严禁用于任何实际临床诊断或治疗决策场景。

---

## 🌟 核心特性

- **多智能体协作**：三个专科 AI 智能体（心脏科、心理学、呼吸科）并行分析病例
- **Web 管理界面**：现代化的前端界面，支持病例管理、诊断历史、报告导出
- **用户权限系统**：基于角色的访问控制（管理员、医生、普通用户）
- **多模型支持**：可配置不同的 LLM 模型进行诊断
- **报告导出**：支持 PDF、Word、Markdown、JSON 多种格式
- **账号快速切换**：记忆历史登录账号，一键切换

---

## 🚀 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- SQLite 3

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/ahmadvh/AI-Agents-for-Medical-Diagnostics.git
   cd AI-Agents-for-Medical-Diagnostics
   ```

2. **配置 API 密钥**
   ```bash
   # 复制配置模板
   cp apikey.example.env apikey.env
   cp api/config/models.example.json api/config/models.json

   # 编辑 apikey.env，填入你的 API 密钥
   # 编辑 models.json，配置可用的 AI 模型
   ```

3. **初始化后端**
   ```bash
   # 创建虚拟环境并安装依赖
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt

   # 初始化数据库
   python3 api/init_db.py
   python3 api/init_auth_db.py

   # 启动后端服务（默认端口 8000）
   python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **启动前端**
   ```bash
   cd frontend
   npm install
   npm run dev  # 默认端口 5173
   ```

5. **访问系统**
   - 前端：http://localhost:5173
   - 后端 API 文档：http://localhost:8000/docs

### 默认测试账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 全部权限 |
| 医生 | doctor | doctor123 | 病例读写、诊断 |
| 普通用户 | viewer | viewer123 | 只读权限 |

---

## 📖 文档导航

- **[快速上手指南](QUICKSTART.md)** - 详细的安装和使用教程
- **[Claude Code 指南](CLAUDE.md)** - 开发者技术文档（面向 AI 助手）
- **[配置指南](docs/development/CONFIG_GUIDE.md)** - 模型和环境配置
- **[API 文档](docs/api/API_DOCUMENTATION.md)** - REST API 接口说明
- **[认证系统](docs/auth/)** - 用户权限管理文档

---

## 🏗️ 技术架构

### 后端
- **框架**：FastAPI + Uvicorn
- **数据库**：SQLite + SQLAlchemy ORM
- **AI 框架**：LangChain + OpenAI API
- **认证**：JWT + bcrypt
- **文档导出**：ReportLab（PDF）、python-docx（Word）

### 前端
- **框架**：React 19 + TypeScript + Vite
- **样式**：Tailwind CSS 4
- **路由**：React Router
- **HTTP 客户端**：Axios
- **状态管理**：React Context API

### AI 智能体
- **心脏科智能体**（Cardiologist）：识别心律失常、结构性心脏病
- **心理学智能体**（Psychologist）：识别焦虑、惊恐障碍等心理问题
- **呼吸科智能体**（Pulmonologist）：评估哮喘、呼吸功能异常
- **多学科团队**（MultidisciplinaryTeam）：综合各专科意见

---

## 🎯 核心功能

### 病例管理
- 创建、编辑、删除病例
- 批量导入病例（TXT 文件）
- 病例搜索和分页浏览

### AI 诊断
- 选择不同 AI 模型进行诊断
- 查看各专科智能体的分析报告
- 综合诊断摘要

### 诊断历史
- 记录每次诊断的完整结果
- 对比不同模型的诊断差异
- 导出诊断报告（单个/批量）

### 用户权限
- 基于角色的权限控制（RBAC）
- 支持自定义角色和权限
- 账号快速切换功能

---

## 🛠️ 开发指南

### 项目结构

```
AI-Agents-for-Medical-Diagnostics/
├── api/                    # 后端 API
│   ├── auth/              # 认证模块
│   ├── config/            # 配置文件
│   ├── db/                # 数据库
│   ├── models/            # ORM 模型
│   ├── routes/            # API 路由
│   └── utils/             # 工具函数
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── context/      # Context API
│   │   └── services/     # API 服务
├── Utils/                 # AI 智能体核心逻辑
│   └── Agents.py         # 智能体定义
├── Main.py               # 命令行诊断入口
├── docs/                 # 详细文档
└── Medical Reports/      # 示例病历文件
```

### 常用命令

```bash
# 后端开发
source venv/bin/activate
python3 -m uvicorn api.main:app --reload

# 前端开发
cd frontend && npm run dev

# 运行测试
pytest

# 代码格式化
black api/ Utils/
prettier --write frontend/src/

# 数据库迁移
alembic revision --autogenerate -m "描述"
alembic upgrade head
```

### 添加新的智能体

1. 在 `Utils/Agents.py` 中创建新的智能体类
2. 继承 `Agent` 基类并实现 `run()` 方法
3. 在 `Main.py` 的 `run_multi_agent_diagnosis()` 中注册
4. 更新前端的 `AgentInfoModal` 展示智能体信息

---

## 🔮 未来计划

- [ ] 扩展更多专科智能体（神经科、内分泌科等）
- [ ] 支持本地 LLM（Ollama、llama.cpp）
- [ ] 视觉诊断能力（分析医学影像）
- [ ] 实时检索和医学数据集查询
- [ ] 移动端适配
- [ ] 多语言支持

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！请参阅 [CONTRIBUTING.md](docs/development/CONTRIBUTING.md)。

---

## 📄 许可证

本项目基于 MIT License 开源。详见 [LICENSE](LICENSE) 文件。

---

## 📧 联系方式

- GitHub Issues: [提交问题](https://github.com/ahmadvh/AI-Agents-for-Medical-Diagnostics/issues)
- 原作者：Ahmad Vahidi

---

**注意**：本系统生成的所有诊断建议仅供参考，不能替代专业医生的诊断和治疗意见。
