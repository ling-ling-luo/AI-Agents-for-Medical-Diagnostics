# 用户权限管理系统 - 安全配置指南

## 一、系统架构

### 认证与授权架构
- **认证方式**: JWT (JSON Web Token)
- **密码加密**: Bcrypt 算法
- **权限模型**: RBAC (Role-Based Access Control)

### 系统组件
```
api/
├── auth/               # 认证授权模块
│   ├── security.py     # 密码加密、JWT生成/验证
│   ├── dependencies.py # FastAPI依赖注入（获取当前用户）
│   └── permissions.py  # RBAC权限检查器
├── routes/             # API路由模块
│   ├── auth.py         # 认证路由（登录、注册、个人信息）
│   ├── users.py        # 用户管理路由（管理员）
│   └── roles.py        # 角色管理路由（管理员）
└── models/
    └── user.py         # 用户、角色、权限数据模型
```

## 二、初始化步骤

### 1. 安装依赖

```bash
# 激活虚拟环境
source venv/bin/activate

# 安装新增的认证相关依赖
pip install python-jose[cryptography] passlib[bcrypt] email-validator
```

### 2. 配置环境变量

在 `apikey.env` 文件中添加以下配置：

```bash
# JWT 配置
JWT_SECRET_KEY="your-very-secret-key-change-this-in-production-please"
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 令牌有效期（分钟），默认24小时
```

**重要提示：**
- `JWT_SECRET_KEY` 必须是随机生成的强密码
- 生产环境中务必修改默认密钥
- 可使用以下命令生成安全密钥：
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

### 3. 初始化数据库

```bash
# 运行初始化脚本，创建用户权限相关表和初始数据
python3 api/init_auth_db.py
```

初始化脚本会自动创建：
- 数据库表（users, roles, permissions, user_roles）
- 预定义角色（admin, doctor, viewer）
- 默认管理员账户：`admin / admin123`
- 测试账户：`doctor / doctor123`, `viewer / viewer123`

## 三、预定义角色与权限

### 角色说明

| 角色名 | 显示名称 | 权限范围 |
|--------|----------|----------|
| admin  | 系统管理员 | 所有权限（用户管理、角色管理、病例管理、诊断管理） |
| doctor | 医生 | 创建/查看/修改病例，运行/查看诊断 |
| viewer | 普通用户 | 只读权限（查看病例和诊断结果） |

### 权限详情

#### 1. 系统管理员 (admin)
```
资源: case
  - create: 创建病例
  - read: 查看病例
  - update: 修改病例
  - delete: 删除病例

资源: diagnosis
  - create: 创建诊断
  - read: 查看诊断
  - update: 修改诊断
  - delete: 删除诊断
  - execute: 运行AI诊断

资源: user
  - create: 创建用户
  - read: 查看用户
  - update: 修改用户
  - delete: 删除用户

资源: role
  - create: 创建角色
  - read: 查看角色
  - update: 修改角色
  - delete: 删除角色
```

#### 2. 医生 (doctor)
```
资源: case
  - create: 创建病例
  - read: 查看病例
  - update: 修改病例

资源: diagnosis
  - create: 创建诊断
  - read: 查看诊断
  - execute: 运行AI诊断
```

#### 3. 普通用户 (viewer)
```
资源: case
  - read: 查看病例

资源: diagnosis
  - read: 查看诊断
```

## 四、API使用指南

### 1. 用户注册

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "full_name": "张三"
  }'
```

响应：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "roles": ["viewer"],
    "permissions": ["case:read", "diagnosis:read"]
  }
}
```

### 2. 用户登录

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. 获取当前用户信息

```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 带认证的病例操作

```bash
# 获取病例列表（需要 case:read 权限）
curl -X GET "http://localhost:8000/api/cases" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 创建病例（需要 case:create 权限）
curl -X POST "http://localhost:8000/api/cases" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 运行诊断（需要 diagnosis:execute 权限）
curl -X POST "http://localhost:8000/api/cases/1/run-diagnosis" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model": "gemini-2.5-flash"}'
```

### 5. 用户管理（管理员）

```bash
# 获取用户列表（需要 user:read 权限）
curl -X GET "http://localhost:8000/api/users" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 创建用户（需要 user:create 权限）
curl -X POST "http://localhost:8000/api/users" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newdoctor",
    "email": "doctor@example.com",
    "password": "password123",
    "role_ids": [2]
  }'
```

## 五、安全最佳实践

### 1. 密码策略
- 最小长度：6个字符（建议提高到8-12字符）
- 复杂度要求：字母+数字+特殊字符（可在 `auth.py` 中配置）
- 密码加密：使用 Bcrypt 算法（成本因子12）
- **立即修改所有默认密码！**

### 2. JWT 令牌管理
- 令牌有效期：默认24小时（可调整）
- 存储方式：客户端存储在 `localStorage` 或 `sessionStorage`
- 刷新机制：令牌过期后需重新登录
- 建议：实施令牌刷新机制（Refresh Token）

### 3. 访问控制
- 所有敏感API端点都需要认证
- 权限检查在路由层面实施
- 超级管理员账户谨慎使用
- 定期审计用户权限

### 4. 数据安全
- 数据库连接使用环境变量
- 不要在代码中硬编码敏感信息
- 启用 HTTPS（生产环境）
- 定期备份数据库

### 5. 审计日志（待实现）
建议后续实现：
- 记录登录/登出事件
- 记录敏感操作（删除用户、修改权限）
- 记录失败的认证尝试
- 定期审查日志

## 六、故障排查

### 问题1：无法登录 - "用户名或密码错误"
**原因**：可能是密码错误或数据库未正确初始化
**解决**：
```bash
# 重新初始化数据库
python3 api/init_auth_db.py

# 使用默认账户登录
用户名: admin
密码: admin123
```

### 问题2：API返回401 Unauthorized
**原因**：JWT令牌无效或过期
**解决**：
- 检查令牌是否正确传递（Header: `Authorization: Bearer TOKEN`）
- 检查令牌是否过期（默认24小时）
- 重新登录获取新令牌

### 问题3：API返回403 Forbidden
**原因**：当前用户权限不足
**解决**：
- 检查用户角色和权限
- 使用具有足够权限的账户
- 联系管理员分配所需权限

### 问题4：导入错误 - "No module named 'jose'"
**原因**：缺少依赖包
**解决**：
```bash
pip install python-jose[cryptography] passlib[bcrypt] email-validator
```

## 七、生产环境部署清单

- [ ] 修改 `JWT_SECRET_KEY` 为强随机密钥
- [ ] 修改默认管理员密码
- [ ] 删除测试用户账户（doctor, viewer）
- [ ] 调整令牌有效期（根据业务需求）
- [ ] 启用 HTTPS
- [ ] 配置CORS允许的源（仅允许前端域名）
- [ ] 设置数据库备份策略
- [ ] 实施日志审计
- [ ] 配置防火墙规则
- [ ] 压力测试认证系统

## 八、后续优化建议

1. **令牌刷新机制**：实现 Refresh Token，避免频繁重新登录
2. **双因素认证（2FA）**：增强账户安全
3. **密码重置功能**：通过邮件重置密码
4. **会话管理**：实现会话撤销/踢出功能
5. **IP白名单**：限制特定IP访问管理功能
6. **审计日志**：完整记录所有敏感操作
7. **密码策略强化**：密码复杂度、有效期、历史记录
8. **API限流**：防止暴力破解攻击

## 九、联系支持

如有问题，请参考：
- 项目文档：`CLAUDE.md`
- 产品需求文档：`PRODUCT_REQUIREMENTS.md`
- GitHub Issues: https://github.com/your-repo/issues
