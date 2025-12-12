# AI 医疗诊断系统 - API 文档

## 病例管理 API

### 1. 获取病例列表
```
GET /api/cases
```
返回所有病例的列表，按创建时间倒序排列。

**响应示例：**
```json
[
  {
    "id": 1,
    "patient_name": "张三",
    "patient_id": "P001",
    "age": 45,
    "gender": "male",
    "chief_complaint": "胸痛三天"
  }
]
```

---

### 2. 获取病例详情
```
GET /api/cases/{case_id}
```
获取指定病例的完整信息。

**响应示例：**
```json
{
  "id": 1,
  "patient_name": "张三",
  "patient_id": "P001",
  "age": 45,
  "gender": "male",
  "chief_complaint": "胸痛三天",
  "raw_report": "完整病历报告...",
  "created_at": "2025-01-15T10:30:00"
}
```

---

### 3. 新增病例
```
POST /api/cases
```
创建新的病例记录。

**请求体：**
```json
{
  "patient_id": "P001",
  "patient_name": "张三",
  "age": 45,
  "gender": "male",
  "chief_complaint": "胸痛三天",
  "medical_history": "高血压病史5年",
  "family_history": "父亲有心脏病史",
  "lifestyle_factors": "吸烟20年",
  "medications": "降压药",
  "lab_results": "血压160/100",
  "physical_exam": "心音正常",
  "vital_signs": "BP 160/100 mmHg",
  "language": "zh"
}
```

**必填字段：**
- `patient_id`: 病历号
- `patient_name`: 患者姓名
- `age`: 年龄
- `gender`: 性别 (male/female/other)
- `chief_complaint`: 主诉

**响应示例：**
```json
{
  "id": 1,
  "patient_id": "P001",
  "patient_name": "张三",
  "message": "病例创建成功"
}
```

---

### 4. 更新病例 ✨ NEW
```
PUT /api/cases/{case_id}
```
更新指定病例的信息。未提供的字段保持不变。

**请求体：**（所有字段都是可选的）
```json
{
  "patient_name": "张三丰",
  "age": 46,
  "chief_complaint": "胸痛加重",
  "medical_history": "更新的病史信息",
  "language": "zh"
}
```

**响应示例：**
返回更新后的完整病例信息（与获取病例详情的响应格式相同）

**注意事项：**
- 如果更新 `patient_id`，系统会检查是否与其他病例冲突
- 更新任何字段后会自动重新生成格式化的病历报告

---

### 5. 删除病例
```
DELETE /api/cases/{case_id}
```
删除指定病例及其所有诊断历史。

**响应示例：**
```json
{
  "message": "病例 1 已成功删除",
  "deleted_case_id": 1
}
```

---

### 6. 批量导入病例
```
POST /api/cases/import
```
通过文件批量导入病例。

**支持的文件格式：**
- **JSON 文件**：包含病例数组
- **TXT 文件**：纯文本病历报告

**JSON 格式示例：**
```json
[
  {
    "patient_id": "P001",
    "patient_name": "张三",
    "age": 45,
    "gender": "male",
    "chief_complaint": "胸痛三天",
    "raw_report": "可选：直接提供完整报告"
  }
]
```

**响应示例：**
```json
{
  "success_count": 8,
  "failed_count": 2,
  "total_count": 10,
  "failed_cases": [
    {
      "index": 3,
      "patient_id": "P004",
      "error": "病历号已存在"
    }
  ],
  "message": "导入完成：成功 8 个，失败 2 个"
}
```

---

## 诊断功能 API

### 7. 运行 AI 诊断
```
POST /api/cases/{case_id}/run-diagnosis
```
对指定病例运行多智能体 AI 诊断。

**响应示例：**
```json
{
  "case_id": 1,
  "diagnosis_markdown": "# Multidisciplinary Diagnosis\n\n## Final Diagnosis..."
}
```

**注意：** 诊断结果会自动保存到诊断历史记录中。

---

### 8. 获取诊断历史 ✨ ENHANCED
```
GET /api/cases/{case_id}/diagnoses?include_full=false
```
获取指定病例的所有诊断历史记录。

**查询参数：**
- `include_full` (可选): 是否包含完整诊断内容，默认为 `false`（只返回预览）

**响应示例：**
```json
{
  "case_id": 1,
  "patient_name": "张三",
  "patient_id": "P001",
  "total_diagnoses": 3,
  "history": [
    {
      "id": 5,
      "timestamp": "2025-01-15T14:30:00",
      "model": "gemini-2.5-flash",
      "execution_time_ms": 3500,
      "diagnosis_preview": "# Multidisciplinary Diagnosis\n\n## Final Diagnosis...",
      "diagnosis_full": null
    },
    {
      "id": 3,
      "timestamp": "2025-01-14T10:20:00",
      "model": "claude-sonnet-4.5",
      "execution_time_ms": 4200,
      "diagnosis_preview": "# Multidisciplinary Diagnosis...",
      "diagnosis_full": null
    }
  ]
}
```

---

### 9. 获取单个诊断详情 ✨ NEW
```
GET /api/cases/{case_id}/diagnoses/{diagnosis_id}
```
获取指定诊断记录的完整详情。

**响应示例：**
```json
{
  "id": 5,
  "case_id": 1,
  "timestamp": "2025-01-15T14:30:00",
  "model": "gemini-2.5-flash",
  "execution_time_ms": 3500,
  "diagnosis_markdown": "完整的诊断报告内容..."
}
```

---

## API 基础信息

**基础 URL：** `http://localhost:8000`

**认证：** 当前版本无需认证（开发环境）

**CORS：** 已配置，支持以下源：
- `http://localhost:5173` (Vite React)
- 其他开发端口

**API 文档：**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 错误处理

所有 API 在出错时会返回标准的 HTTP 错误码和 JSON 格式的错误信息：

```json
{
  "detail": "错误描述信息"
}
```

**常见错误码：**
- `400 Bad Request`: 请求参数错误或业务逻辑错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

---

## 使用示例

### 完整工作流示例（使用 curl）

```bash
# 1. 创建新病例
curl -X POST http://localhost:8000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P001",
    "patient_name": "张三",
    "age": 45,
    "gender": "male",
    "chief_complaint": "胸痛三天",
    "language": "zh"
  }'

# 2. 运行诊断
curl -X POST http://localhost:8000/api/cases/1/run-diagnosis

# 3. 查看诊断历史
curl http://localhost:8000/api/cases/1/diagnoses

# 4. 更新病例信息
curl -X PUT http://localhost:8000/api/cases/1 \
  -H "Content-Type: application/json" \
  -d '{
    "age": 46,
    "chief_complaint": "胸痛加重，伴气促"
  }'

# 5. 删除病例
curl -X DELETE http://localhost:8000/api/cases/1
```

---

## 更新日志

### v1.2.0 (最新)
- ✨ 新增：更新病例 API (`PUT /api/cases/{case_id}`)
- ✨ 新增：获取单个诊断详情 API
- 🔧 优化：增强诊断历史 API，支持查询参数控制返回内容
- 📝 改进：完善 API 文档和类型定义

### v1.1.0
- ✨ 新增：批量导入病例功能
- ✨ 新增：删除病例功能
- 🔧 优化：病例创建流程

### v1.0.0
- 🎉 初始版本发布
- ✅ 基础病例管理功能
- ✅ AI 多智能体诊断功能
