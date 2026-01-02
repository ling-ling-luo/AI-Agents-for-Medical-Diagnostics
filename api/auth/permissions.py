"""RBAC权限控制系统"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Set

from api.db.database import get_db
from api.models.user import User, Permission
from api.auth.dependencies import get_current_user


class PermissionChecker:
    """权限检查器类"""

    def __init__(self, required_resource: str, required_action: str):
        """
        初始化权限检查器

        Args:
            required_resource: 需要的资源名称（如 'case', 'diagnosis', 'user'）
            required_action: 需要的操作类型（如 'create', 'read', 'update', 'delete', 'execute'）
        """
        self.required_resource = required_resource
        self.required_action = required_action

    def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        """
        检查当前用户是否有所需权限

        Args:
            current_user: 当前登录用户
            db: 数据库会话

        Returns:
            User: 当前用户（如果有权限）

        Raises:
            HTTPException: 如果用户没有所需权限
        """
        # 超级管理员拥有所有权限
        if current_user.is_superuser:
            return current_user

        # 获取用户的所有权限
        user_permissions = get_user_permissions(current_user, db)

        # 检查是否有所需权限
        required_permission = f"{self.required_resource}:{self.required_action}"
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {self.required_resource} 资源的 {self.required_action} 权限"
            )

        return current_user


def get_user_permissions(user: User, db: Session) -> Set[str]:
    """
    获取用户的所有权限

    Args:
        user: 用户对象
        db: 数据库会话

    Returns:
        Set[str]: 权限集合，格式为 "resource:action"
    """
    permissions = set()

    # 遍历用户的所有角色
    for role in user.roles:
        if not role.is_active:
            continue

        # 遍历角色的所有权限
        for permission in role.permissions:
            permissions.add(f"{permission.resource}:{permission.action}")

    return permissions


def check_permission(user: User, resource: str, action: str, db: Session) -> bool:
    """
    检查用户是否有指定权限

    Args:
        user: 用户对象
        resource: 资源名称
        action: 操作类型
        db: 数据库会话

    Returns:
        bool: 是否有权限
    """
    # 超级管理员拥有所有权限
    if user.is_superuser:
        return True

    user_permissions = get_user_permissions(user, db)
    required_permission = f"{resource}:{action}"
    return required_permission in user_permissions


# 预定义的权限检查器实例
require_case_create = PermissionChecker("case", "create")
require_case_read = PermissionChecker("case", "read")
require_case_update = PermissionChecker("case", "update")
require_case_delete = PermissionChecker("case", "delete")

require_diagnosis_create = PermissionChecker("diagnosis", "create")
require_diagnosis_read = PermissionChecker("diagnosis", "read")
require_diagnosis_update = PermissionChecker("diagnosis", "update")
require_diagnosis_delete = PermissionChecker("diagnosis", "delete")
require_diagnosis_execute = PermissionChecker("diagnosis", "execute")

require_user_create = PermissionChecker("user", "create")
require_user_read = PermissionChecker("user", "read")
require_user_update = PermissionChecker("user", "update")
require_user_delete = PermissionChecker("user", "delete")

require_role_create = PermissionChecker("role", "create")
require_role_read = PermissionChecker("role", "read")
require_role_update = PermissionChecker("role", "update")
require_role_delete = PermissionChecker("role", "delete")

require_analytics_read = PermissionChecker("analytics", "read")
require_analytics_export = PermissionChecker("analytics", "export")
