"""初始化用户权限管理数据库

此脚本会创建用户权限相关的数据库表，并初始化：
1. 预定义角色（admin, doctor, viewer）
2. 各角色的权限
3. 默认管理员账户（admin/admin123）
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from api.db.database import Base, DATABASE_URL
from api.models.user import User, Role, Permission, ROLE_PERMISSIONS
from api.models.case import MedicalCase, DiagnosisHistory
from api.auth.security import get_password_hash
import os


def init_auth_database():
    """初始化用户权限管理数据库"""
    print("=" * 60)
    print("初始化用户权限管理系统数据库...")
    print("=" * 60)

    # 创建数据库引擎
    engine = create_engine(DATABASE_URL)

    # 创建所有表（包括用户权限相关表和病例表）
    print("\n[1/4] 创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("✓ 数据库表创建成功")

    # 创建会话
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # 检查是否已有角色数据
        existing_roles = db.query(Role).count()
        if existing_roles > 0:
            print("\n⚠ 警告：数据库中已存在角色数据，跳过初始化")
            print(f"   现有角色数量：{existing_roles}")
            return

        # 创建预定义角色和权限
        print("\n[2/4] 创建预定义角色和权限...")
        roles_created = {}

        for role_name, role_config in ROLE_PERMISSIONS.items():
            # 创建角色
            role = Role(
                name=role_name,
                display_name=role_config["display_name"],
                description=role_config["description"],
                is_active=True
            )
            db.add(role)
            db.flush()  # 获取 role.id

            # 创建权限
            for resource, action in role_config["permissions"]:
                permission = Permission(
                    role_id=role.id,
                    resource=resource,
                    action=action
                )
                db.add(permission)

            roles_created[role_name] = role
            print(f"  ✓ 创建角色: {role.display_name} ({role_name})")
            print(f"     权限数量: {len(role_config['permissions'])}")

        db.commit()
        print(f"✓ 成功创建 {len(roles_created)} 个角色")

        # 创建默认管理员账户
        print("\n[3/4] 创建默认管理员账户...")
        admin_username = "admin"
        admin_password = "admin123"

        # 检查管理员是否已存在
        existing_admin = db.query(User).filter(User.username == admin_username).first()
        if existing_admin:
            print(f"  ⚠ 管理员账户 '{admin_username}' 已存在，跳过创建")
        else:
            admin_user = User(
                username=admin_username,
                email="admin@medical-diagnosis.com",
                hashed_password=get_password_hash(admin_password),
                full_name="系统管理员",
                is_active=True,
                is_superuser=True
            )

            # 分配 admin 角色
            admin_role = roles_created.get("admin")
            if admin_role:
                admin_user.roles.append(admin_role)

            db.add(admin_user)
            db.commit()
            print(f"  ✓ 管理员账户创建成功")
            print(f"     用户名: {admin_username}")
            print(f"     密码: {admin_password}")
            print(f"     邮箱: admin@medical-diagnosis.com")
            print(f"  ⚠ 警告：请在生产环境中立即修改默认密码！")

        # 创建测试用户（可选）
        print("\n[4/4] 创建测试用户...")

        # 创建医生账户
        doctor_user = User(
            username="doctor",
            email="doctor@medical-diagnosis.com",
            hashed_password=get_password_hash("doctor123"),
            full_name="测试医生",
            is_active=True,
            is_superuser=False
        )
        doctor_role = roles_created.get("doctor")
        if doctor_role:
            doctor_user.roles.append(doctor_role)
        db.add(doctor_user)
        print("  ✓ 创建测试医生账户: doctor / doctor123")

        # 创建普通用户账户
        viewer_user = User(
            username="viewer",
            email="viewer@medical-diagnosis.com",
            hashed_password=get_password_hash("viewer123"),
            full_name="测试普通用户",
            is_active=True,
            is_superuser=False
        )
        viewer_role = roles_created.get("viewer")
        if viewer_role:
            viewer_user.roles.append(viewer_role)
        db.add(viewer_user)
        print("  ✓ 创建测试普通用户: viewer / viewer123")

        db.commit()

        # 汇总信息
        print("\n" + "=" * 60)
        print("数据库初始化完成！")
        print("=" * 60)
        print("\n账户信息：")
        print("  1. 管理员账户: admin / admin123")
        print("  2. 医生账户:   doctor / doctor123")
        print("  3. 普通用户:   viewer / viewer123")
        print("\n角色权限：")
        print("  - 管理员（admin）:  全部权限")
        print("  - 医生（doctor）:   创建/查看/修改病例，运行诊断")
        print("  - 普通用户（viewer）: 只读权限")
        print("\n⚠ 重要提示：")
        print("  1. 请立即修改默认管理员密码")
        print("  2. 测试用户仅用于开发/测试环境")
        print("  3. 生产环境请删除测试用户")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n❌ 错误：初始化失败")
        print(f"   {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_auth_database()
