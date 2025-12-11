"""
数据库迁移脚本：为 medical_cases 表添加 created_by 字段

运行方式：
    python api/migrations/add_created_by_to_cases.py
"""
import sqlite3
from pathlib import Path

def migrate():
    """执行迁移"""
    # 数据库文件路径
    db_path = Path(__file__).parent.parent.parent / "medical_diagnostics.db"

    if not db_path.exists():
        print(f"❌ 数据库文件不存在: {db_path}")
        return False

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(medical_cases)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'created_by' in columns:
            print("✅ created_by 字段已存在，无需迁移")
            return True

        # 添加 created_by 字段
        print("⏳ 正在添加 created_by 字段...")
        cursor.execute("""
            ALTER TABLE medical_cases
            ADD COLUMN created_by INTEGER REFERENCES users(id)
        """)

        # 创建索引
        print("⏳ 正在创建索引...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS ix_medical_cases_created_by
            ON medical_cases (created_by)
        """)

        conn.commit()
        print("✅ 迁移成功完成！")
        print(f"   - 已添加字段: created_by (INTEGER, 外键指向 users.id)")
        print(f"   - 已创建索引: ix_medical_cases_created_by")
        return True

    except Exception as e:
        conn.rollback()
        print(f"❌ 迁移失败: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("数据库迁移：添加 created_by 字段")
    print("=" * 60)
    migrate()
