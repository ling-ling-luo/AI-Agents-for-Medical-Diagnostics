#!/bin/bash

# 用户权限管理系统 - API 测试脚本
# 用法: bash test_auth_api.sh

API_BASE="http://localhost:8000"
echo "======================================================================"
echo "用户权限管理系统 - API 测试"
echo "======================================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试1: 检查服务器是否运行
echo -e "${YELLOW}[测试 1]${NC} 检查服务器状态..."
if curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/api/models" | grep -q "200"; then
    echo -e "${GREEN}✓${NC} 服务器运行正常"
else
    echo -e "${RED}✗${NC} 服务器未响应，请先启动后端服务器："
    echo "   python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
    exit 1
fi
echo ""

# 测试2: 管理员登录
echo -e "${YELLOW}[测试 2]${NC} 管理员登录 (admin/admin123)..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓${NC} 登录成功"
    ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "   令牌: ${ADMIN_TOKEN:0:50}..."
else
    echo -e "${RED}✗${NC} 登录失败"
    echo "   响应: $LOGIN_RESPONSE"
    echo "   请先运行: python3 api/init_auth_db.py"
    exit 1
fi
echo ""

# 测试3: 获取当前用户信息
echo -e "${YELLOW}[测试 3]${NC} 获取当前用户信息..."
USER_INFO=$(curl -s -X GET "${API_BASE}/api/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$USER_INFO" | grep -q "admin"; then
    echo -e "${GREEN}✓${NC} 获取用户信息成功"
    echo "   用户名: $(echo "$USER_INFO" | grep -o '"username":"[^"]*' | cut -d'"' -f4)"
    echo "   角色: $(echo "$USER_INFO" | grep -o '"roles":\[[^]]*' | cut -d'[' -f2 | tr -d '"')"
else
    echo -e "${RED}✗${NC} 获取用户信息失败"
    echo "   响应: $USER_INFO"
fi
echo ""

# 测试4: 测试病例列表权限
echo -e "${YELLOW}[测试 4]${NC} 测试权限保护的API（病例列表）..."

# 4.1 不带令牌访问（应该失败）
echo "   4.1 不带令牌访问..."
NO_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/cases")
STATUS_CODE=$(echo "$NO_AUTH_RESPONSE" | tail -n1)
if [ "$STATUS_CODE" == "401" ] || [ "$STATUS_CODE" == "403" ]; then
    echo -e "   ${GREEN}✓${NC} 正确拒绝未认证请求 (HTTP $STATUS_CODE)"
else
    echo -e "   ${RED}✗${NC} 应该返回401/403，实际返回 $STATUS_CODE"
fi

# 4.2 带令牌访问（应该成功）
echo "   4.2 带令牌访问..."
WITH_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/cases" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
STATUS_CODE=$(echo "$WITH_AUTH_RESPONSE" | tail -n1)
if [ "$STATUS_CODE" == "200" ]; then
    echo -e "   ${GREEN}✓${NC} 认证请求成功 (HTTP $STATUS_CODE)"
else
    echo -e "   ${RED}✗${NC} 应该返回200，实际返回 $STATUS_CODE"
fi
echo ""

# 测试5: 测试角色权限（viewer用户）
echo -e "${YELLOW}[测试 5]${NC} 测试角色权限（viewer用户只读）..."

# 5.1 viewer登录
VIEWER_LOGIN=$(curl -s -X POST "${API_BASE}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"viewer","password":"viewer123"}')

if echo "$VIEWER_LOGIN" | grep -q "access_token"; then
    VIEWER_TOKEN=$(echo "$VIEWER_LOGIN" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "   5.1 viewer 登录成功"

    # 5.2 viewer尝试创建病例（应该失败）
    echo "   5.2 viewer 尝试创建病例（应该被拒绝）..."
    CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/cases" \
      -H "Authorization: Bearer $VIEWER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "patient_id":"TEST001",
        "patient_name":"测试",
        "age":30,
        "gender":"male",
        "chief_complaint":"测试",
        "language":"zh"
      }')
    STATUS_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
    if [ "$STATUS_CODE" == "403" ]; then
        echo -e "   ${GREEN}✓${NC} 正确拒绝无权限操作 (HTTP $STATUS_CODE)"
    else
        echo -e "   ${RED}✗${NC} 应该返回403，实际返回 $STATUS_CODE"
    fi

    # 5.3 viewer查看病例（应该成功）
    echo "   5.3 viewer 查看病例（应该成功）..."
    READ_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/cases" \
      -H "Authorization: Bearer $VIEWER_TOKEN")
    STATUS_CODE=$(echo "$READ_RESPONSE" | tail -n1)
    if [ "$STATUS_CODE" == "200" ]; then
        echo -e "   ${GREEN}✓${NC} viewer 可以查看病例 (HTTP $STATUS_CODE)"
    else
        echo -e "   ${RED}✗${NC} 应该返回200，实际返回 $STATUS_CODE"
    fi
else
    echo -e "${RED}✗${NC} viewer 登录失败"
fi
echo ""

# 测试6: 用户管理（管理员功能）
echo -e "${YELLOW}[测试 6]${NC} 测试用户管理功能（仅管理员）..."

# 6.1 获取用户列表
USERS_LIST=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
STATUS_CODE=$(echo "$USERS_LIST" | tail -n1)
if [ "$STATUS_CODE" == "200" ]; then
    USER_COUNT=$(echo "$USERS_LIST" | head -n-1 | grep -o '"username"' | wc -l)
    echo -e "   ${GREEN}✓${NC} 获取用户列表成功，共 $USER_COUNT 个用户"
else
    echo -e "   ${RED}✗${NC} 获取用户列表失败 (HTTP $STATUS_CODE)"
fi
echo ""

# 测试7: 角色管理
echo -e "${YELLOW}[测试 7]${NC} 测试角色管理功能..."
ROLES_LIST=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/api/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
STATUS_CODE=$(echo "$ROLES_LIST" | tail -n1)
if [ "$STATUS_CODE" == "200" ]; then
    ROLE_COUNT=$(echo "$ROLES_LIST" | head -n-1 | grep -o '"name"' | wc -l)
    echo -e "   ${GREEN}✓${NC} 获取角色列表成功，共 $ROLE_COUNT 个角色"
    echo "   角色: $(echo "$ROLES_LIST" | head -n-1 | grep -o '"name":"[^"]*' | cut -d'"' -f4 | tr '\n' ', ' | sed 's/,$//')"
else
    echo -e "   ${RED}✗${NC} 获取角色列表失败 (HTTP $STATUS_CODE)"
fi
echo ""

# 汇总
echo "======================================================================"
echo "测试完成！"
echo "======================================================================"
echo ""
echo "默认账户信息："
echo "  - 管理员: admin / admin123"
echo "  - 医生:   doctor / doctor123"
echo "  - 普通用户: viewer / viewer123"
echo ""
echo "⚠ 重要提示："
echo "  1. 请立即修改默认管理员密码"
echo "  2. 查看完整文档: SECURITY_SETUP.md"
echo "  3. 查看实施总结: AUTH_IMPLEMENTATION_SUMMARY.md"
echo "======================================================================"
