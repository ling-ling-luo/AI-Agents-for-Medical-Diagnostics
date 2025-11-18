# AI 医疗诊断前端

基于 React + TypeScript + Vite 构建的现代化医疗诊断前端界面。

## ✨ 特性

- 🎨 **现代化 UI**：使用 Tailwind CSS 构建的响应式界面
- 🔄 **多智能体诊断**：实时展示三个专科 AI 智能体的分析过程
- 📱 **响应式设计**：支持桌面和移动设备
- 🔍 **Markdown 渲染**：优雅展示诊断结果
- 🚀 **快速加载**：Vite 提供极速的开发体验

## 📋 技术栈

- **框架**：React 19.2.0
- **语言**：TypeScript
- **构建工具**：Vite 7.2.2
- **路由**：React Router DOM 7.1.5
- **样式**：Tailwind CSS
- **HTTP 客户端**：Axios
- **图标**：Lucide React
- **Markdown**：markdown-to-jsx

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm >= 7

### 安装依赖

```bash
npm install
```

### 开发模式

启动开发服务器：

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建生产版本

```bash
npm run build
```

构建完成后，生产文件将在 `dist/` 目录中。

### 预览生产版本

```bash
npm run preview
```

## 🏗️ 项目结构

```
src/
├── components/          # React 组件
│   ├── CaseList.tsx    # 病例列表页
│   ├── CaseDetail.tsx  # 病例详情页
│   ├── Loading.tsx     # 加载组件
│   └── DiagnosisResult.tsx  # 诊断结果组件
├── services/
│   └── api.ts          # API 调用服务
├── types/
│   └── index.ts        # TypeScript 类型定义
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 🔌 与后端 API 集成

前端通过 `http://localhost:8000` 与 FastAPI 后端通信。

### API 端点

- **GET** `/api/cases` - 获取病例列表
- **POST** `/api/cases/{case_id}/run-diagnosis` - 运行诊断

### 配置 API 地址

如果后端运行在不同的地址，请修改 `src/services/api.ts` 文件中的 `API_BASE_URL`：

```typescript
const API_BASE_URL = 'http://your-backend-url:port';
```

## 📱 主要功能

### 病例列表页

- 显示所有可用病例
- 点击"运行诊断"进入详情页
- 显示患者姓名和主诉

### 病例详情页

- 显示三个 AI 智能体的分析过程
- 实时显示诊断状态
- 可折叠/展开的详细诊断报告
- 支持重新运行诊断

### 诊断结果展示

- Markdown 格式渲染
- 智能提取诊断摘要
- 分专科展示分析结果
- 响应式布局优化

## 🎨 自定义样式

项目使用 Tailwind CSS，所有样式类都可以在组件中直接使用。

主要自定义样式在 `src/index.css` 中定义：

- `.btn-primary` - 主要按钮样式
- `.card` - 卡片容器样式
- `.prose` - 诊断结果文本样式

## 🛠️ 开发指南

### 添加新组件

1. 在 `src/components/` 目录创建新的 `.tsx` 文件
2. 导出组件
3. 在需要的页面中导入使用

### 修改 API

1. 在 `src/services/api.ts` 中添加新的 API 方法
2. 在 `src/types/index.ts` 中定义相应的 TypeScript 类型

### 样式调整

- 使用 Tailwind CSS 类进行快速样式调整
- 在 `src/index.css` 中添加自定义 CSS
- 修改 `tailwind.config.js` 配置 Tailwind

## 🔧 故障排除

### 前端无法连接后端

1. 确保后端 FastAPI 服务在 `http://localhost:8000` 运行
2. 检查防火墙设置
3. 在浏览器控制台查看网络请求错误

### 构建失败

1. 清理 node_modules：`rm -rf node_modules && npm install`
2. 检查 Node.js 版本（需要 >= 16）
3. 查看错误日志并修复

### CORS 错误

如果遇到 CORS 错误，确保后端配置了正确的 CORS 策略：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📝 开发计划

- [ ] 添加用户认证系统
- [ ] 支持自定义病历上传
- [ ] 添加诊断历史记录
- [ ] 实现暗色主题
- [ ] 添加数据导出功能

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License