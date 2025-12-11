"""
更新 viewer 角色权限：允许创建病例和运行诊断

运行方式：
    python api/migrations/update_viewer_permissions.py
"""
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from api.db.database import SessionLocal
from api.models.user import Role, Permission

def update_viewer_permissions():
    """更新 viewer 角色权限"""
    db = SessionLocal()

    try:
        # 查找 viewer 角色
        viewer_role = db.query(Role).filter(Role.name == "viewer").first()

        if not viewer_role:
            print("❌ 未找到 viewer 角色")
            return False

        print(f"✅ 找到 viewer 角色: {viewer_role.display_name}")

        # 需要添加的权限
        new_permissions = [
            ("case", "create"),
            ("diagnosis", "create"),
            ("diagnosis", "execute"),
        ]

        # 检查并添加权限
        added_count = 0
        for resource, action in new_permissions:
            # 检查权限是否已存在
            existing = db.query(Permission).filter(
                Permission.role_id == viewer_role.id,
                Permission.resource == resource,
                Permission.action == action
            ).first()

            if existing:
                print(f"  ⏭️  权限已存在: {resource}:{action}")
            else:
                # 添加新权限
                new_perm = Permission(
                    role_id=viewer_role.id,
                    resource=resource,
                    action=action
                )
                db.add(new_perm)
                print(f"  ✅ 添加权限: {resource}:{action}")
                added_count += 1

        # 提交更改
        db.commit()

        # 更新角色描述
        viewer_role.display_name = "普通用户"
        viewer_role.description = "可以创建病例，查看自己的病例和诊断结果"
        db.commit()

        print(f"\n✅ 权限更新成功！")
        print(f"   - 新增权限数量: {added_count}")
        print(f"   - 角色描述已更新")

        # 显示当前所有权限
        all_perms = db.query(Permission).filter(Permission.role_id == viewer_role.id).all()
        print(f"\nviewer 角色当前拥有的权限：")
        for perm in all_perms:
            print(f"   - {perm.resource}:{perm.action}")

        return True

    except Exception as e:
        db.rollback()
        print(f"❌ 更新失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("更新 viewer 角色权限")
    print("=" * 60)
    update_viewer_permissions()
