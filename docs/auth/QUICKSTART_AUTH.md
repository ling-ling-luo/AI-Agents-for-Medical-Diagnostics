# 用户权限管理系统 - 快速启动指南

## 5分钟快速开始

### 步骤1: 安装依赖（1分钟）

```bash
# 激活虚拟环境
cd /home/cloud_dev/github.code/AI-Agents-for-Medical-Diagnostics
source venv/bin/activate

# 安装新增的认证依赖
pip install python-jose[cryptography] passlib[bcrypt] email-validator
```

### 步骤2: 配置环境变量（30秒）

在 `apikey.env` 文件末尾添加以下内容：

```bash
# JWT 配置
JWT_SECRET_KEY="Please-Change-This-Secret-Key-In-Production-12345678"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**重要**: 生产环境请使用强随机密钥！生成方法：
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 步骤3: 初始化数据库（30秒）

```bash
python3 api/init_auth_db.py
```

预期输出：
```
============================================================
初始化用户权限管理系统数据库...
============================================================

[1/4] 创建数据库表...
✓ 数据库表创建成功

[2/4] 创建预定义角色和权限...
  ✓ 创建角色: 系统管理员 (admin)
     权限数量: 16
  ✓ 创建角色: 医生 (doctor)
     权限数量: 6
  ✓ 创建角色: 普通用户（只读） (viewer)
     权限数量: 2
✓ 成功创建 3 个角色

[3/4] 创建默认管理员账户...
  ✓ 管理员账户创建成功
     用户名: admin
     密码: admin123
  ⚠ 警告：请在生产环境中立即修改默认密码！

[4/4] 创建测试用户...
  ✓ 创建测试医生账户: doctor / doctor123
  ✓ 创建测试普通用户: viewer / viewer123

============================================================
数据库初始化完成！
============================================================
```

### 步骤4: 启动后端服务器（10秒）

```bash
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

等待看到：
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 步骤5: 运行测试脚本（1分钟）

**打开新终端窗口**，运行：

```bash
cd /home/cloud_dev/github.code/AI-Agents-for-Medical-Diagnostics
bash test_auth_api.sh
```

预期输出：
```
======================================================================
用户权限管理系统 - API 测试
======================================================================

[测试 1] 检查服务器状态...
✓ 服务器运行正常

[测试 2] 管理员登录 (admin/admin123)...
✓ 登录成功
   令牌: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

[测试 3] 获取当前用户信息...
✓ 获取用户信息成功
   用户名: admin
   角色: admin

[测试 4] 测试权限保护的API（病例列表）...
   4.1 不带令牌访问...
   ✓ 正确拒绝未认证请求 (HTTP 401)
   4.2 带令牌访问...
   ✓ 认证请求成功 (HTTP 200)

[测试 5] 测试角色权限（viewer用户只读）...
   5.1 viewer 登录成功
   5.2 viewer 尝试创建病例（应该被拒绝）...
   ✓ 正确拒绝无权限操作 (HTTP 403)
   5.3 viewer 查看病例（应该成功）...
   ✓ viewer 可以查看病例 (HTTP 200)

[测试 6] 测试用户管理功能（仅管理员）...
   ✓ 获取用户列表成功，共 3 个用户

[测试 7] 测试角色管理功能...
   ✓ 获取角色列表成功，共 3 个角色
   角色: admin, doctor, viewer

======================================================================
测试完成！
======================================================================
```

### 步骤6: 使用Swagger UI测试（可选）

浏览器打开：http://localhost:8000/docs

你会看到新增的API端点：
- **认证** (`/api/auth/`)
  - POST `/api/auth/register` - 用户注册
  - POST `/api/auth/login` - 用户登录
  - GET `/api/auth/me` - 获取当前用户信息
  - POST `/api/auth/change-password` - 修改密码

- **用户管理** (`/api/users/`)
  - GET `/api/users` - 获取用户列表
  - POST `/api/users` - 创建用户
  - GET `/api/users/{user_id}` - 获取用户详情
  - PUT `/api/users/{user_id}` - 更新用户
  - DELETE `/api/users/{user_id}` - 删除用户

- **角色管理** (`/api/roles/`)
  - GET `/api/roles` - 获取角色列表
  - POST `/api/roles` - 创建角色
  - GET `/api/roles/{role_id}` - 获取角色详情
  - PUT `/api/roles/{role_id}` - 更新角色
  - DELETE `/api/roles/{role_id}` - 删除角色

#### Swagger UI 使用步骤：

1. **登录获取令牌**：
   - 点击 `POST /api/auth/login`
   - 点击"Try it out"
   - 输入：
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - 点击"Execute"
   - 复制响应中的 `access_token`

2. **授权**：
   - 点击页面顶部的 "Authorize" 按钮（锁图标）
   - 在弹窗中输入：`Bearer YOUR_TOKEN_HERE`
   - 点击"Authorize"
   - 点击"Close"

3. **测试其他端点**：
   - 现在你可以测试任何需要认证的端点了
   - 例如：`GET /api/users` 获取用户列表

## 默认账户

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 所有权限 |
| doctor | doctor123 | 医生 | 创建/查看/修改病例，运行诊断 |
| viewer | viewer123 | 普通用户 | 只读权限 |

**⚠ 警告**: 请立即修改这些默认密码，尤其是admin账户！

## 常用API示例

### 1. 用户登录
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

保存响应中的 `access_token`

### 2. 获取病例列表（需要认证）
```bash
curl -X GET "http://localhost:8000/api/cases" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. 创建新用户（仅管理员）
```bash
curl -X POST "http://localhost:8000/api/users" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newdoctor",
    "email": "newdoctor@hospital.com",
    "password": "secure123",
    "full_name": "李医生",
    "role_ids": [2]
  }'
```

### 4. 修改密码
```bash
curl -X POST "http://localhost:8000/api/auth/change-password" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "admin123",
    "new_password": "newSecurePassword123"
  }'
```

## 权限说明

### 角色权限矩阵

| 功能 | Admin | Doctor | Viewer |
|------|:-----:|:------:|:------:|
| 查看病例 | ✅ | ✅ | ✅ |
| 创建病例 | ✅ | ✅ | ❌ |
| 修改病例 | ✅ | ✅ | ❌ |
| 删除病例 | ✅ | ❌ | ❌ |
| 导入病例 | ✅ | ✅ | ❌ |
| 运行AI诊断 | ✅ | ✅ | ❌ |
| 查看诊断结果 | ✅ | ✅ | ✅ |
| 导出诊断报告 | ✅ | ✅ | ✅ |
| 用户管理 | ✅ | ❌ | ❌ |
| 角色管理 | ✅ | ❌ | ❌ |

## 故障排查

### 问题1: `ModuleNotFoundError: No module named 'jose'`
**解决方案**:
```bash
pip install python-jose[cryptography]
```

### 问题2: `ModuleNotFoundError: No module named 'passlib'`
**解决方案**:
```bash
pip install passlib[bcrypt]
```

### 问题3: 登录返回 404 Not Found
**原因**: 可能是路由未正确注册
**解决方案**:
1. 检查 `api/main.py` 是否包含路由注册：
   ```python
   from api.routes import auth, users, roles
   app.include_router(auth.router)
   app.include_router(users.router)
   app.include_router(roles.router)
   ```
2. 重启后端服务器

### 问题4: 测试脚本权限被拒绝
**解决方案**:
```bash
chmod +x test_auth_api.sh
```

### 问题5: 所有API返回401 Unauthorized
**可能原因**:
1. JWT_SECRET_KEY未配置
2. 令牌过期
3. 令牌格式错误

**解决方案**:
1. 检查 `apikey.env` 是否包含 `JWT_SECRET_KEY`
2. 重新登录获取新令牌
3. 确保Header格式为: `Authorization: Bearer TOKEN`

## 下一步

1. **修改默认密码** ⚠️ 最重要！
   ```bash
   # 使用 admin 登录后调用
   curl -X POST "http://localhost:8000/api/auth/change-password" \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "old_password": "admin123",
       "new_password": "YourNewStrongPassword123!"
     }'
   ```

2. **阅读完整文档**
   - `SECURITY_SETUP.md` - 安全配置详细指南
   - `AUTH_IMPLEMENTATION_SUMMARY.md` - 实施总结和待完成工作

3. **开发前端功能**
   - 实现登录/注册页面
   - 添加路由守卫
   - 实现用户管理界面
   - 实现个人中心页面

4. **生产环境准备**
   - 修改JWT密钥为强随机密钥
   - 删除测试账户
   - 配置HTTPS
   - 实施日志审计

## 需要帮助？

- 查看 `SECURITY_SETUP.md` 获取详细配置指南
- 查看 `AUTH_IMPLEMENTATION_SUMMARY.md` 获取实施总结
- 查看 `CLAUDE.md` 获取项目整体架构说明
- 使用 Swagger UI (http://localhost:8000/docs) 测试API

---

**祝贺！** 🎉 你的用户权限管理系统后端已经就绪！
