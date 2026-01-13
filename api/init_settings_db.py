"""初始化系统设置数据库表"""
import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.db.database import engine, Base, SessionLocal
from api.models.settings import Provider, Model, SystemConfig, DEFAULT_SYSTEM_CONFIG
from api.utils.encryption import encrypt_api_key


def init_settings_tables():
    """创建系统设置相关表"""
    # 导入模型以确保它们被注册到 Base.metadata
    from api.models.settings import Provider, Model, SystemConfig

    print("正在创建系统设置表...")
    Base.metadata.create_all(bind=engine)
    print("✓ 系统设置表创建完成")


def init_default_config():
    """初始化默认系统配置"""
    db = SessionLocal()
    try:
        # 检查是否已有配置
        existing_config = db.query(SystemConfig).first()
        if existing_config:
            print("✓ 系统配置已存在，跳过初始化")
            return

        # 创建默认配置
        for config in DEFAULT_SYSTEM_CONFIG:
            new_config = SystemConfig(
                key=config["key"],
                value=config["value"],
                value_type=config["value_type"],
                description=config["description"]
            )
            db.add(new_config)

        db.commit()
        print(f"✓ 已创建 {len(DEFAULT_SYSTEM_CONFIG)} 条默认系统配置")

    except Exception as e:
        db.rollback()
        print(f"✗ 初始化系统配置失败: {e}")
    finally:
        db.close()


def init_default_provider():
    """初始化默认供应商（从环境变量读取）"""
    db = SessionLocal()
    try:
        # 检查是否已有供应商
        existing_provider = db.query(Provider).first()
        if existing_provider:
            print("✓ 供应商已存在，跳过初始化")
            return

        # 从环境变量读取配置
        from dotenv import load_dotenv
        load_dotenv("apikey.env")

        api_key = os.getenv("OPENAI_API_KEY", "")
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        default_model = os.getenv("LLM_MODEL", "gpt-4o")

        if not api_key:
            print("⚠ 未找到 OPENAI_API_KEY 环境变量，跳过默认供应商创建")
            print("  请在设置页面手动添加供应商")
            return

        # 创建默认供应商
        provider = Provider(
            name="默认供应商",
            base_url=base_url.rstrip("/"),
            api_key_encrypted=encrypt_api_key(api_key),
            is_enabled=True,
            is_default=True
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)
        print(f"✓ 已创建默认供应商: {provider.name} ({base_url})")

        # 创建默认模型
        model = Model(
            provider_id=provider.id,
            model_id=default_model,
            display_name=default_model,
            is_enabled=True,
            is_default=True,
            supports_vision=False,
            supports_function_call=True
        )
        db.add(model)
        db.commit()
        print(f"✓ 已创建默认模型: {model.display_name}")

    except Exception as e:
        db.rollback()
        print(f"✗ 初始化默认供应商失败: {e}")
    finally:
        db.close()


def main():
    """主函数"""
    print("=" * 50)
    print("初始化系统设置数据库")
    print("=" * 50)

    # 1. 创建表
    init_settings_tables()

    # 2. 初始化默认配置
    init_default_config()

    # 3. 初始化默认供应商
    init_default_provider()

    print("=" * 50)
    print("系统设置初始化完成")
    print("=" * 50)


if __name__ == "__main__":
    main()
