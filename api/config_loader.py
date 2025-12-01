import json
import os
from typing import List, Dict, Any


class ConfigLoader:
    """配置加载工具类"""

    @staticmethod
    def load_models(config_path: str = None) -> List[Dict[str, Any]]:
        """
        从 JSON 配置文件加载模型列表

        Args:
            config_path: 配置文件路径,默认为 api/config/models.json

        Returns:
            模型列表
        """
        if config_path is None:
            # 默认配置文件路径
            config_path = os.path.join(
                os.path.dirname(__file__),
                'config',
                'models.json'
            )

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                models = config.get('available_models', [])

                # 验证配置格式
                if not isinstance(models, list):
                    raise ValueError("available_models 必须是列表格式")

                for model in models:
                    required_fields = ['id', 'name', 'provider']
                    missing = [f for f in required_fields if f not in model]
                    if missing:
                        raise ValueError(f"模型配置缺少必需字段: {', '.join(missing)}")

                print(f"✓ 成功加载 {len(models)} 个模型配置")
                return models

        except FileNotFoundError:
            print(f"⚠️  配置文件未找到: {config_path}")
            print(f"使用默认模型列表")
            return ConfigLoader._get_default_models()
        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析错误: {e}")
            print(f"使用默认模型列表")
            return ConfigLoader._get_default_models()
        except Exception as e:
            print(f"❌ 加载配置文件时出错: {e}")
            print(f"使用默认模型列表")
            return ConfigLoader._get_default_models()

    @staticmethod
    def _get_default_models() -> List[Dict[str, Any]]:
        """默认模型列表（后备方案）"""
        return [
            {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "Google"},
            {"id": "gpt-4o", "name": "GPT-4 Optimized", "provider": "OpenAI"},
            {"id": "claude-sonnet-4.5", "name": "Claude Sonnet 4.5", "provider": "Anthropic"},
        ]
