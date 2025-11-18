"""数据库初始化脚本

创建数据库表并导入现有病历数据
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.db.database import engine, Base, SessionLocal
from api.models.case import MedicalCase, DiagnosisHistory
from datetime import datetime


def create_tables():
    """创建所有数据库表"""
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("✓ 数据库表创建成功！")


def import_medical_reports():
    """导入 Medical Reports 文件夹中的病历文件"""
    print("\n正在导入病历文件...")

    # Medical Reports 目录路径
    reports_dir = Path(__file__).parent.parent / "Medical Reports"

    if not reports_dir.exists():
        print(f"⚠ 警告：找不到 {reports_dir} 目录")
        return

    db = SessionLocal()
    try:
        # 清空现有数据（可选）
        db.query(MedicalCase).delete()
        db.commit()

        imported_count = 0

        # 遍历所有 .txt 文件
        for txt_file in reports_dir.glob("*.txt"):
            print(f"  导入: {txt_file.name}")

            # 读取文件内容
            with open(txt_file, "r", encoding="utf-8") as f:
                content = f.read()

            # 从文件名中提取信息
            # 格式示例: "Medical Report - Michael Johnson - Panic Attack Disorder.txt"
            filename = txt_file.stem
            parts = filename.split(" - ")

            patient_name = parts[1] if len(parts) > 1 else "Unknown Patient"
            chief_complaint = parts[2] if len(parts) > 2 else "请查看完整病历"

            # 从内容中尝试提取年龄和性别（简单解析）
            age = None
            gender = None

            # 简单提取逻辑：查找常见模式
            for line in content.split('\n')[:10]:  # 只看前10行
                line_lower = line.lower()

                # 提取年龄
                if 'age' in line_lower or '年龄' in line_lower:
                    import re
                    age_match = re.search(r'\d+', line)
                    if age_match:
                        age = int(age_match.group())

                # 提取性别
                if 'male' in line_lower and 'female' not in line_lower:
                    gender = 'male'
                elif 'female' in line_lower:
                    gender = 'female'
                elif '男' in line:
                    gender = 'male'
                elif '女' in line:
                    gender = 'female'

            # 创建病例记录
            case = MedicalCase(
                patient_id=f"P{datetime.now().strftime('%Y%m%d')}{imported_count + 1:03d}",
                patient_name=patient_name,
                age=age,
                gender=gender,
                chief_complaint=chief_complaint,
                raw_report=content,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            db.add(case)
            imported_count += 1

        # 提交事务
        db.commit()
        print(f"\n✓ 成功导入 {imported_count} 个病例！")

        # 显示导入的病例
        print("\n已导入的病例列表：")
        cases = db.query(MedicalCase).all()
        for case in cases:
            print(f"  - ID: {case.id}, 患者: {case.patient_name}, 病历号: {case.patient_id}")

    except Exception as e:
        print(f"✗ 导入失败: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """主函数"""
    print("=" * 60)
    print("医疗诊断系统 - 数据库初始化")
    print("=" * 60)

    # 创建表结构
    create_tables()

    # 导入病历数据
    import_medical_reports()

    print("\n" + "=" * 60)
    print("✓ 数据库初始化完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
