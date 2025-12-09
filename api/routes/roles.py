"""角色管理API路由（管理员功能）"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from api.db.database import get_db
from api.models.user import Role, Permission, User
from api.auth.dependencies import get_current_user
from api.auth.permissions import require_role_read, require_role_create, require_role_update, require_role_delete

router = APIRouter(prefix="/api/roles", tags=["角色管理"])


# ---- Pydantic 模型 ----

class PermissionItem(BaseModel):
    """权限项"""
    id: int
    resource: str
    action: str

    class Config:
        from_attributes = True


class RoleListItem(BaseModel):
    """角色列表项"""
    id: int
    name: str
    display_name: Optional[str]
    description: Optional[str]
    is_active: bool
    user_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class RoleDetail(BaseModel):
    """角色详情"""
    id: int
    name: str
    display_name: Optional[str]
    description: Optional[str]
    is_active: bool
    permissions: List[PermissionItem]
    user_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    """创建角色请求"""
    name: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    permissions: List[dict]  # [{"resource": "case", "action": "read"}, ...]


class RoleUpdate(BaseModel):
    """更新角色请求"""
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[List[dict]] = None


# ---- 路由定义 ----

@router.get("", response_model=List[RoleListItem])
async def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_read)
) -> List[RoleListItem]:
    """
    获取角色列表（需要 role:read 权限）
    """
    roles = db.query(Role).all()

    result = []
    for role in roles:
        user_count = len(role.users)
        result.append(RoleListItem(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            is_active=role.is_active,
            user_count=user_count,
            created_at=role.created_at
        ))

    return result


@router.get("/{role_id}", response_model=RoleDetail)
async def get_role_detail(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_read)
) -> RoleDetail:
    """
    获取指定角色的详细信息（需要 role:read 权限）
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"角色 ID {role_id} 不存在"
        )

    permissions = [
        PermissionItem(id=p.id, resource=p.resource, action=p.action)
        for p in role.permissions
    ]

    return RoleDetail(
        id=role.id,
        name=role.name,
        display_name=role.display_name,
        description=role.description,
        is_active=role.is_active,
        permissions=permissions,
        user_count=len(role.users),
        created_at=role.created_at
    )


@router.post("", response_model=RoleListItem, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_create)
) -> RoleListItem:
    """
    创建新角色（需要 role:create 权限）
    """
    # 检查角色名是否已存在
    if db.query(Role).filter(Role.name == role_data.name).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"角色名 {role_data.name} 已存在"
        )

    # 创建角色
    new_role = Role(
        name=role_data.name,
        display_name=role_data.display_name,
        description=role_data.description,
        is_active=role_data.is_active
    )

    db.add(new_role)
    db.flush()  # 获取 role.id

    # 添加权限
    for perm_data in role_data.permissions:
        permission = Permission(
            role_id=new_role.id,
            resource=perm_data["resource"],
            action=perm_data["action"]
        )
        db.add(permission)

    db.commit()
    db.refresh(new_role)

    return RoleListItem(
        id=new_role.id,
        name=new_role.name,
        display_name=new_role.display_name,
        description=new_role.description,
        is_active=new_role.is_active,
        user_count=0,
        created_at=new_role.created_at
    )


@router.put("/{role_id}", response_model=RoleListItem)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_update)
) -> RoleListItem:
    """
    更新角色信息（需要 role:update 权限）

    注意：不能修改预定义角色的名称（admin, doctor, viewer）
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"角色 ID {role_id} 不存在"
        )

    # 更新字段
    if role_data.display_name is not None:
        role.display_name = role_data.display_name

    if role_data.description is not None:
        role.description = role_data.description

    if role_data.is_active is not None:
        role.is_active = role_data.is_active

    # 更新权限
    if role_data.permissions is not None:
        # 删除旧权限
        db.query(Permission).filter(Permission.role_id == role_id).delete()

        # 添加新权限
        for perm_data in role_data.permissions:
            permission = Permission(
                role_id=role_id,
                resource=perm_data["resource"],
                action=perm_data["action"]
            )
            db.add(permission)

    db.commit()
    db.refresh(role)

    return RoleListItem(
        id=role.id,
        name=role.name,
        display_name=role.display_name,
        description=role.description,
        is_active=role.is_active,
        user_count=len(role.users),
        created_at=role.created_at
    )


@router.delete("/{role_id}")
async def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_delete)
):
    """
    删除角色（需要 role:delete 权限）

    注意：不能删除预定义角色（admin, doctor, viewer）
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"角色 ID {role_id} 不存在"
        )

    # 不能删除预定义角色
    if role.name in ["admin", "doctor", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不能删除预定义角色: {role.name}"
        )

    # 检查是否有用户使用该角色
    if len(role.users) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"角色 {role.name} 仍有 {len(role.users)} 个用户使用，无法删除"
        )

    db.delete(role)
    db.commit()

    return {"message": f"角色 {role.name} 已成功删除", "deleted_role_id": role_id}
