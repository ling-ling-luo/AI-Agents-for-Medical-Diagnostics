# 配置指南

## 更换为个人账号

### 1. 修改 API 密钥配置
编辑 `apikey.env`：
```env
OPENAI_API_KEY="你的API密钥"
OPENAI_BASE_URL="你的网关地址"
LLM_MODEL="默认模型名称"
```

### 2. 修改模型列表配置
编辑 `api/config/models.json`：
```json
{
  "available_models": [
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "OpenAI"},
    {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "provider": "OpenAI"}
  ]
}
```

### 3. 重启服务
```bash
python3 -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

## 配置文件说明

### apikey.env（环境变量）
- `OPENAI_API_KEY`: 你的 API 密钥
- `OPENAI_BASE_URL`: API 网关地址
- `LLM_MODEL`: 默认使用的模型（后备值）

### api/config/models.json（模型列表）
定义前端可选择的所有 AI 模型。

每个模型需要三个字段：
- `id`: 模型标识符（传给 API）
- `name`: 显示名称
- `provider`: 提供商名称

示例：
```json
{
  "available_models": [
    {"id": "gemini-3-pro", "name": "Gemini 3 Pro", "provider": "Google"},
    {"id": "claude-sonnet-4.5", "name": "Claude Sonnet 4.5", "provider": "Anthropic"},
    {"id": "gpt-5.1", "name": "GPT-5.1", "provider": "OpenAI"}
  ]
}
```

## 常见问题

### Q: 配置文件不存在会怎样？
A: 系统会自动使用默认模型列表（gemini-2.5-flash、gpt-4o、claude-sonnet-4.5）

### Q: JSON 格式错误会怎样？
A: 系统会打印错误信息并使用默认模型列表

### Q: 模型配置缺少必需字段会怎样？
A: 系统会提示验证错误并使用默认模型列表

### Q: 如何查看当前可用的模型列表？
A: 访问 `http://localhost:8000/api/models` 查看当前加载的模型列表

### Q: 修改配置后需要重启服务吗？
A: 是的，配置在服务启动时加载，修改后需要重启后端服务才能生效

## 故障排除

### 启动时没有看到 "✓ 成功加载 X 个模型配置" 消息
- 检查 `api/config/models.json` 文件是否存在
- 检查 JSON 格式是否正确
- 如果文件不存在，可以从 `api/config/models.example.json` 复制一份

### 前端显示的模型列表不正确
- 确认后端服务已重启
- 访问 `http://localhost:8000/api/models` 确认后端返回的模型列表
- 清除浏览器缓存并刷新前端页面

### 选择某个模型后诊断失败
- 确认该模型的 `id` 在 `models.json` 中正确配置
- 确认你的 API 密钥支持该模型
- 检查 `OPENAI_BASE_URL` 是否正确配置
