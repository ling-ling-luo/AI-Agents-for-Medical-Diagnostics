# 🚀 快速启动指南

欢迎使用 AI 医疗诊断系统！本指南将帮助您快速启动前端和后端服务。

## 📋 前置条件

- **Python 3.10+**
- **Node.js 16+**
- **npm 7+**
- **API 密钥**（已配置在 `apikey.env` 中）

## 🎯 启动步骤

### 第一步：安装 Python 依赖

```bash
# 确保虚拟环境已激活
source venv/bin/activate  # Linux/macOS
# 或
# venv\Scripts\activate  # Windows

# 安装后端依赖（如果还没有安装）
pip install -r requirements.txt
```

### 第二步：启动后端 FastAPI 服务

**打开新的终端窗口（保持 Python 虚拟环境激活）：**

```bash
# 确保在项目根目录
cd /path/to/AI-Agents-for-Medical-Diagnostics

# 激活虚拟环境
source venv/bin/activate  # Linux/macOS
# 或
# venv\Scripts\activate  # Windows

# 启动 FastAPI 服务
python3 -m uvicorn api.main:app --reload --port 8000
```

✅ **成功标志：**
- 看到输出：`Uvicorn running on http://127.0.0.1:8000`
- 访问 http://localhost:8000/docs 可看到 API 文档

### 第三步：启动前端 React 应用

**再打开一个新的终端窗口：**

```bash
# 进入前端目录
cd /path/to/AI-Agents-for-Medical-Diagnostics/frontend

# 安装依赖（仅首次需要）
npm install

# 启动开发服务器
npm run dev
```

✅ **成功标志：**
- 看到输出：
  ```
  Local:   http://localhost:5173/
  Network:  http://192.168.x.x:5173/
  ```
- 浏览器自动打开 http://localhost:5173
- 可以看到医疗诊断系统界面

## 🔧 开发工作流

### 🔄 重启前后端服务（重要！）

当你修改了配置文件（如 `apikey.env`）或遇到问题时，需要重启服务：

#### 方法一：快速重启（推荐）

```bash
# 1. 查找并终止所有运行中的服务
ps aux | grep -E "(uvicorn|npm|node)" | grep -v grep
kill <后端PID> <前端PID>  # 替换为实际的进程 ID

# 或者使用以下命令一键终止
pkill -f "uvicorn api.main:app"
pkill -f "vite"

# 2. 重新启动后端（在项目根目录）
source venv/bin/activate  # 激活虚拟环境（如果需要）
nohup python3 -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# 3. 重新启动前端（在 frontend 目录）
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
cd ..

# 4. 验证服务启动成功
ps aux | grep -E "(uvicorn|vite)" | grep -v grep
# 或者检查端口
ss -tlnp | grep -E ":(8000|5173)"
```

#### 方法二：使用终端窗口重启

**终端 1 - 后端：**
```bash
# 按 Ctrl+C 停止当前服务
# 然后重新运行
python3 -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**终端 2 - 前端：**
```bash
# 按 Ctrl+C 停止当前服务
# 然后重新运行
cd frontend
npm run dev
```

#### 查看服务日志

如果使用后台方式启动（nohup），可以查看日志：

```bash
# 查看后端日志
tail -f backend.log

# 查看前端日志
tail -f frontend.log
```

### 修改代码

1. **后端 API** (`api/main.py`)
   - 修改后会自动重启（`--reload` 已启用）
   - 访问 http://localhost:8000/docs 查看 API

2. **前端页面**
   - 修改后会自动热更新
   - 浏览器会自动刷新

3. **样式文件**
   - 位于 `frontend/src/index.css`
   - 使用 Tailwind CSS 类名

### ⚙️ 修改 AI 模型配置

如果需要切换使用的 AI 模型（如从 Claude 切换到 MiniMax 或其他模型）：

```bash
# 1. 编辑配置文件
nano apikey.env  # 或使用其他编辑器

# 2. 修改 LLM_MODEL 的值
LLM_MODEL="gemini-2.5-flash"  # 或 "claude-sonnet-4.5"、"minimax-m2" 等

# 3. 保存后重启后端服务（前端无需重启）
pkill -f "uvicorn api.main:app"
nohup python3 -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

**注意：** 前端代码已设计为模型无关，切换模型无需修改前端代码。

### 构建生产版本

#### 前端构建

```bash
cd frontend

# 构建生产版本
npm run build

# 预览生产构建（可选）
npm run preview
```

构建产物将生成在 `frontend/dist/` 目录中。

#### 后端构建

```bash
# Python 代码无需编译
# 只需要确保所有依赖已安装
pip install -r requirements.txt
```

## 📱 功能说明

### 前端界面

**病例列表页** (`/`)
- 查看所有可用病例
- 点击"运行诊断"按钮进入详情页
- 显示患者姓名和主诉

**病例详情页** (`/case/:id`)
- 显示三个 AI 智能体的分析过程
- 实时显示诊断状态
- 可展开/折叠的详细诊断报告
- 支持"重新诊断"

### 后端 API

**测试 API 连接**

在浏览器中访问：
- http://localhost:8000/api/cases
- 应该返回 JSON 格式的病例列表

**API 文档**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## ❗ 故障排除

### 前端无法加载

**问题：** 页面显示"无法连接到后端"

**解决方案：**
1. 检查 FastAPI 服务是否在 8000 端口运行
   ```bash
   curl http://localhost:8000/api/cases
   ```
   应该返回 JSON 数据

2. 如果服务未启动，请参考上面的"第二步"

### 后端 API 错误

**问题：** 访问 http://localhost:8000/api/cases 返回 500 错误

**可能原因：**
- 虚拟环境未激活
- Python 依赖缺失
- API 密钥配置问题

**解决方案：**
```bash
# 1. 激活虚拟环境
source venv/bin/activate  # Linux/macOS

# 2. 重新安装依赖
pip install -r requirements.txt

# 3. 检查 API 密钥
cat apikey.env
```

### 端口被占用

**FastAPI 端口 8000 被占用：**

```bash
# 查找占用进程
lsof -i :8000  # Linux/macOS

# 终止进程
kill -9 <PID>
```

**前端端口 5173 被占用：**

修改 `frontend/vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000  // 使用其他端口
  },
  plugins: [react()],
})
```

### CORS 错误

前端控制台显示：
```
Access to fetch at 'http://localhost:8000' from origin
'http://localhost:5173' has been blocked by CORS policy
```

**解决方案：**
- 确保 `api/main.py` 中已配置 CORS（已默认配置）
- 如果仍有问题，在后端控制台中查看错误详情

### 端口被占用

```bash
# 查看端口占用
lsof -i :8000
lsof -i :5173

# 终止进程
kill -9 <PID>
```

### 模块找不到

**前端错误：**

```
Module not found: Error: Can't resolve '../services/api'
```

**解决方案：**
```bash
cd frontend
rm -rf node_modules
npm install
```

**后端错误：**

```
ModuleNotFoundError: No module named 'api'
```

**解决方案：**
```bash
# 确保在项目根目录运行
python -m uvicorn api.main:app --reload
```

## 📁 项目结构

```
AI-Agents-for-Medical-Diagnostics/
├── api/
│   └── main.py              # FastAPI 应用入口
├── frontend/
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── services/         # API 服务
│   │   ├── types/               # TypeScript 类型
│   │   ├── App.tsx              # 主应用
│   │   ├── main.tsx           # 前端入口
│   │   └── index.css          # 样式文件
│   ├── package.json         # 前端依赖
│   ├── vite.config.ts       # Vite 配置
│   └── tailwind.config.js   # Tailwind 配置
├── Main.py                    # AI 智能体逻辑
├── apikey.env                 # API 密钥
├── requirements.txt       # Python 依赖
└── QUICKSTART.md             # 本文件
```

## 🎨 自定义开发

### 添加新的 API 端点

编辑 `api/main.py`：

```python
@app.get("/api/new-endpoint")
async def new_endpoint():
    return {"message": "Hello World"}
```

### 添加新的前端页面

1. 在 `frontend/src/components/` 创建新组件
2. 在 `frontend/src/App.tsx` 中添加路由

### 修改样式

- 使用 Tailwind CSS 类名
- 直接在组件的 `className` 属性中使用
- 或修改 `frontend/src/index.css` 添加自定义样式

## 📞 帮助

如果遇到问题：

1. 检查 FastAPI 服务的控制台输出
2. 检查前端浏览器的开发者工具控制台
3. 确认所有依赖都已正确安装
4. 确认 API 密钥配置正确

## 🎉 完成！

现在你应该在三个终端窗口中看到：

1. **终端 1**：Python 虚拟环境（可选）
2. **终端 2**：FastAPI 后端服务 (http://localhost:8000)
3. **终端 3**：React 前端服务 (http://localhost:5173)

打开浏览器访问 http://localhost:5173 开始使用！