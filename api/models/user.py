"""用户权限管理数据库模型"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from api.db.database import Base


# 用户-角色关联表（多对多）
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True)
)


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True, comment="用户名")
    email = Column(String(100), unique=True, nullable=False, index=True, comment="邮箱")
    hashed_password = Column(String(255), nullable=False, comment="加密后的密码")
    full_name = Column(String(100), comment="姓名")
    is_active = Column(Boolean, default=True, comment="账户是否激活")
    is_superuser = Column(Boolean, default=False, comment="是否为超级管理员")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    last_login = Column(DateTime, nullable=True, comment="最后登录时间")

    # 关联角色（多对多）
    roles = relationship("Role", secondary=user_roles, back_populates="users")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class Role(Base):
    """角色表"""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True, comment="角色名称")
    display_name = Column(String(100), comment="角色显示名称")
    description = Column(String(255), comment="角色描述")
    is_active = Column(Boolean, default=True, comment="角色是否激活")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")

    # 关联用户（多对多）
    users = relationship("User", secondary=user_roles, back_populates="roles")
    # 关联权限（一对多）
    permissions = relationship("Permission", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}', display_name='{self.display_name}')>"


class Permission(Base):
    """权限表"""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True, comment="关联角色ID")
    resource = Column(String(50), nullable=False, comment="资源名称（如 case, diagnosis, user）")
    action = Column(String(20), nullable=False, comment="操作类型（create, read, update, delete, execute）")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")

    # 关联角色（多对一）
    role = relationship("Role", back_populates="permissions")

    def __repr__(self):
        return f"<Permission(id={self.id}, resource='{self.resource}', action='{self.action}')>"


# 预定义角色权限映射
ROLE_PERMISSIONS = {
    "admin": {
        "display_name": "系统管理员",
        "description": "拥有系统全部权限",
        "permissions": [
            ("case", "create"), ("case", "read"), ("case", "update"), ("case", "delete"),
            ("diagnosis", "create"), ("diagnosis", "read"), ("diagnosis", "update"), ("diagnosis", "delete"),
            ("diagnosis", "execute"),  # 运行AI诊断
            ("user", "create"), ("user", "read"), ("user", "update"), ("user", "delete"),
            ("role", "create"), ("role", "read"), ("role", "update"), ("role", "delete"),
            ("analytics", "read"), ("analytics", "export"),  # 数据分析权限
        ]
    },
    "doctor": {
        "display_name": "医生",
        "description": "可以创建、查看、修改病例和运行诊断",
        "permissions": [
            ("case", "create"), ("case", "read"), ("case", "update"),
            ("diagnosis", "create"), ("diagnosis", "read"), ("diagnosis", "execute"),
            ("analytics", "read"),  # 医生可以查看数据分析
        ]
    },
    "viewer": {
        "display_name": "普通用户",
        "description": "可以创建病例，查看自己的病例和诊断结果",
        "permissions": [
            ("case", "create"),  # 可以创建病例
            ("case", "read"),
            ("diagnosis", "create"),
            ("diagnosis", "read"),
            ("diagnosis", "execute"),  # 可以运行诊断
        ]
    }
}
