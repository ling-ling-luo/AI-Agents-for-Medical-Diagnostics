"""认证相关的API路由"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
from datetime import datetime

from api.db.database import get_db
from api.models.user import User, Role, ROLE_PERMISSIONS
from api.auth.security import verify_password, get_password_hash, create_access_token
from api.auth.dependencies import get_current_user, get_current_superuser
from api.auth.permissions import get_user_permissions

router = APIRouter(prefix="/api/auth", tags=["认证"])


# ---- Pydantic 模型 ----

class UserRegister(BaseModel):
    """用户注册请求"""
    username: str
    email: Optional[EmailStr] = None  # 邮箱改为可选
    password: str
    full_name: Optional[str] = None

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum() and '_' not in v:
            raise ValueError('用户名只能包含字母、数字和下划线')
        if len(v) < 3 or len(v) > 50:
            raise ValueError('用户名长度必须在3-50个字符之间')
        return v

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('密码长度至少6个字符')
        return v


class UserLogin(BaseModel):
    """用户登录请求"""
    username: str
    password: str


class Token(BaseModel):
    """JWT令牌响应"""
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    created_at: datetime
    last_login: Optional[datetime]
    roles: List[str]
    permissions: List[str]

    class Config:
        from_attributes = True


class ChangePassword(BaseModel):
    """修改密码请求"""
    old_password: str
    new_password: str

    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('新密码长度至少6个字符')
        return v


# ---- 路由定义 ----

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)) -> Token:
    """
    用户注册

    默认注册为普通用户（viewer角色）
    """
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )

    # 检查邮箱是否已存在（如果提供了邮箱）
    if user_data.email and db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )

    # 如果未提供邮箱，生成默认邮箱
    email = user_data.email or f"{user_data.username}@local.user"

    # 创建新用户
    new_user = User(
        username=user_data.username,
        email=email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_active=True,
        is_superuser=False
    )

    # 分配默认角色（viewer）
    viewer_role = db.query(Role).filter(Role.name == "viewer").first()
    if viewer_role:
        new_user.roles.append(viewer_role)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 生成访问令牌
    access_token = create_access_token(data={"sub": new_user.username})

    # 更新最后登录时间
    new_user.last_login = datetime.utcnow()
    db.commit()

    # 获取用户权限
    permissions = list(get_user_permissions(new_user, db))

    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "is_superuser": new_user.is_superuser,
            "roles": [role.name for role in new_user.roles],
            "permissions": permissions
        }
    )


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)) -> Token:
    """
    用户登录

    验证用户名和密码，返回JWT访问令牌
    """
    # 查询用户
    user = db.query(User).filter(User.username == user_credentials.username).first()

    # 验证用户是否存在
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

    # 验证密码
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

    # 检查账户是否激活
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户已被禁用，请联系管理员"
        )

    # 生成访问令牌
    access_token = create_access_token(data={"sub": user.username})

    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    db.commit()

    # 获取用户权限
    permissions = list(get_user_permissions(user, db))

    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_superuser": user.is_superuser,
            "roles": [role.name for role in user.roles],
            "permissions": permissions
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    获取当前登录用户的信息
    """
    permissions = list(get_user_permissions(current_user, db))

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        roles=[role.name for role in current_user.roles],
        permissions=permissions
    )


@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    修改当前用户的密码
    """
    # 验证旧密码
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码错误"
        )

    # 更新密码
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "密码修改成功"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    用户登出

    注意：JWT是无状态的，实际的登出逻辑需要在客户端删除令牌
    此接口主要用于记录登出日志（可选实现）
    """
    return {"message": "登出成功"}
