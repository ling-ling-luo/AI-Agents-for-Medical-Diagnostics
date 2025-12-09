"""用户管理API路由（管理员功能）"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from api.db.database import get_db
from api.models.user import User, Role
from api.auth.security import get_password_hash
from api.auth.dependencies import get_current_superuser
from api.auth.permissions import require_user_read, require_user_create, require_user_update, require_user_delete, get_user_permissions

router = APIRouter(prefix="/api/users", tags=["用户管理"])


# ---- Pydantic 模型 ----

class UserListItem(BaseModel):
    """用户列表项"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    created_at: datetime
    last_login: Optional[datetime]
    roles: List[str]

    class Config:
        from_attributes = True


class UserDetail(BaseModel):
    """用户详情"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    roles: List[dict]
    permissions: List[str]

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """创建用户请求（管理员）"""
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    role_ids: List[int] = []


class UserUpdate(BaseModel):
    """更新用户请求（管理员）"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    role_ids: Optional[List[int]] = None
    password: Optional[str] = None


# ---- 路由定义 ----

@router.get("", response_model=List[UserListItem])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_read)
) -> List[UserListItem]:
    """
    获取用户列表（需要 user:read 权限）

    支持分页查询
    """
    users = db.query(User).offset(skip).limit(limit).all()

    result = []
    for user in users:
        result.append(UserListItem(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            last_login=user.last_login,
            roles=[role.name for role in user.roles]
        ))

    return result


@router.get("/{user_id}", response_model=UserDetail)
async def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_read)
) -> UserDetail:
    """
    获取指定用户的详细信息（需要 user:read 权限）
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"用户 ID {user_id} 不存在"
        )

    permissions = list(get_user_permissions(user, db))

    return UserDetail(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login,
        roles=[{"id": role.id, "name": role.name, "display_name": role.display_name} for role in user.roles],
        permissions=permissions
    )


@router.post("", response_model=UserListItem, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_create)
) -> UserListItem:
    """
    创建新用户（需要 user:create 权限）

    只有管理员可以创建用户并分配角色
    """
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )

    # 检查邮箱是否已存在
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )

    # 创建新用户
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_active=user_data.is_active,
        is_superuser=user_data.is_superuser
    )

    # 分配角色
    if user_data.role_ids:
        roles = db.query(Role).filter(Role.id.in_(user_data.role_ids)).all()
        new_user.roles = roles

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserListItem(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        is_active=new_user.is_active,
        is_superuser=new_user.is_superuser,
        created_at=new_user.created_at,
        last_login=new_user.last_login,
        roles=[role.name for role in new_user.roles]
    )


@router.put("/{user_id}", response_model=UserListItem)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_update)
) -> UserListItem:
    """
    更新用户信息（需要 user:update 权限）

    管理员可以更新用户的所有信息，包括角色分配
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"用户 ID {user_id} 不存在"
        )

    # 更新字段
    if user_data.email is not None:
        # 检查邮箱是否已被其他用户使用
        existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被其他用户使用"
            )
        user.email = user_data.email

    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    if user_data.is_superuser is not None:
        user.is_superuser = user_data.is_superuser

    if user_data.password is not None:
        user.hashed_password = get_password_hash(user_data.password)

    # 更新角色
    if user_data.role_ids is not None:
        roles = db.query(Role).filter(Role.id.in_(user_data.role_ids)).all()
        user.roles = roles

    db.commit()
    db.refresh(user)

    return UserListItem(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        last_login=user.last_login,
        roles=[role.name for role in user.roles]
    )


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_delete)
):
    """
    删除用户（需要 user:delete 权限）

    注意：不能删除自己，不建议删除超级管理员
    """
    # 不能删除自己
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除当前登录的用户"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"用户 ID {user_id} 不存在"
        )

    # 警告：删除超级管理员
    if user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除超级管理员用户"
        )

    db.delete(user)
    db.commit()

    return {"message": f"用户 {user.username} 已成功删除", "deleted_user_id": user_id}
