"""添加系统设置权限

为现有角色添加 settings:read 和 settings:write 权限
"""
import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from api.db.database import DATABASE_URL
from api.models.user import Role, Permission


def add_settings_permissions():
    """为现有角色添加系统设置权限"""
    print("=" * 50)
    print("添加系统设置权限")
    print("=" * 50)

    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # 获取现有角色
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        doctor_role = db.query(Role).filter(Role.name == "doctor").first()

        if not admin_role:
            print("⚠ 未找到 admin 角色，请先运行 init_auth_db.py")
            return

        # 检查 admin 是否已有 settings 权限
        existing_admin_perms = db.query(Permission).filter(
            Permission.role_id == admin_role.id,
            Permission.resource == "settings"
        ).all()

        if existing_admin_perms:
            print("✓ admin 角色已有 settings 权限，跳过")
        else:
            # 为 admin 添加 settings:read 和 settings:write
            admin_read = Permission(role_id=admin_role.id, resource="settings", action="read")
            admin_write = Permission(role_id=admin_role.id, resource="settings", action="write")
            db.add(admin_read)
            db.add(admin_write)
            print("✓ 为 admin 添加 settings:read 和 settings:write 权限")

        # 检查 doctor 是否已有 settings:read 权限
        if doctor_role:
            existing_doctor_perms = db.query(Permission).filter(
                Permission.role_id == doctor_role.id,
                Permission.resource == "settings"
            ).all()

            if existing_doctor_perms:
                print("✓ doctor 角色已有 settings 权限，跳过")
            else:
                # 为 doctor 添加 settings:read
                doctor_read = Permission(role_id=doctor_role.id, resource="settings", action="read")
                db.add(doctor_read)
                print("✓ 为 doctor 添加 settings:read 权限")

        db.commit()
        print("=" * 50)
        print("权限添加完成")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"✗ 添加权限失败: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    add_settings_permissions()
