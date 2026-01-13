"""系统设置数据库模型"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from api.db.database import Base


class Provider(Base):
    """AI 供应商表"""
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="供应商名称")
    base_url = Column(String(500), nullable=False, comment="API 基础 URL")
    api_key_encrypted = Column(Text, nullable=False, comment="加密的 API Key")
    is_enabled = Column(Boolean, default=True, index=True, comment="是否启用")
    is_default = Column(Boolean, default=False, index=True, comment="是否为默认供应商")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    # 关联模型
    models = relationship("Model", back_populates="provider", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Provider(id={self.id}, name='{self.name}', base_url='{self.base_url}')>"


class Model(Base):
    """AI 模型表"""
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False, index=True, comment="关联供应商ID")
    model_id = Column(String(100), nullable=False, comment="模型标识，如 gpt-4o")
    display_name = Column(String(200), nullable=False, comment="显示名称")
    is_enabled = Column(Boolean, default=True, index=True, comment="是否启用")
    is_default = Column(Boolean, default=False, index=True, comment="是否为默认模型")
    max_tokens = Column(Integer, nullable=True, comment="最大 Token 数")
    context_window = Column(Integer, nullable=True, comment="上下文窗口大小")
    supports_vision = Column(Boolean, default=False, comment="是否支持图像输入")
    supports_function_call = Column(Boolean, default=False, comment="是否支持函数调用")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    # 关联供应商
    provider = relationship("Provider", back_populates="models")

    def __repr__(self):
        return f"<Model(id={self.id}, model_id='{self.model_id}', display_name='{self.display_name}')>"


class SystemConfig(Base):
    """系统配置表"""
    __tablename__ = "system_config"

    key = Column(String(100), primary_key=True, comment="配置键")
    value = Column(Text, nullable=False, comment="配置值")
    value_type = Column(String(20), default="string", comment="值类型: string/number/boolean/json")
    description = Column(String(500), nullable=True, comment="配置描述")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    def __repr__(self):
        return f"<SystemConfig(key='{self.key}', value='{self.value}')>"

    def get_typed_value(self):
        """获取类型转换后的值"""
        if self.value_type == "number":
            return int(self.value) if '.' not in self.value else float(self.value)
        elif self.value_type == "boolean":
            return self.value.lower() in ("true", "1", "yes")
        elif self.value_type == "json":
            import json
            return json.loads(self.value)
        return self.value


# 预置供应商模板
PROVIDER_TEMPLATES = [
    {"name": "OpenAI", "base_url": "https://api.openai.com/v1"},
    {"name": "Anthropic", "base_url": "https://api.anthropic.com"},
    {"name": "Google AI", "base_url": "https://generativelanguage.googleapis.com/v1beta"},
    {"name": "Azure OpenAI", "base_url": "https://{resource}.openai.azure.com/openai"},
    {"name": "DeepSeek", "base_url": "https://api.deepseek.com"},
    {"name": "智谱 AI", "base_url": "https://open.bigmodel.cn/api/paas/v4"},
    {"name": "MiniMax", "base_url": "https://api.minimax.chat/v1"},
    {"name": "月之暗面", "base_url": "https://api.moonshot.cn/v1"},
    {"name": "阿里云百炼", "base_url": "https://dashscope.aliyuncs.com/api/v1"},
    {"name": "xAI", "base_url": "https://api.x.ai/v1"},
    {"name": "自定义", "base_url": ""},
]

# 预置模型列表
PRESET_MODELS = {
    "OpenAI": [
        {"model_id": "gpt-4o", "display_name": "GPT-4o", "max_tokens": 128000, "context_window": 128000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "gpt-4o-mini", "display_name": "GPT-4o Mini", "max_tokens": 128000, "context_window": 128000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "gpt-4-turbo", "display_name": "GPT-4 Turbo", "max_tokens": 128000, "context_window": 128000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "o1", "display_name": "o1", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": False},
        {"model_id": "o1-mini", "display_name": "o1 Mini", "max_tokens": 128000, "context_window": 128000, "supports_vision": False, "supports_function_call": False},
    ],
    "Anthropic": [
        {"model_id": "claude-sonnet-4-20250514", "display_name": "Claude Sonnet 4", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "claude-3-5-sonnet-20241022", "display_name": "Claude 3.5 Sonnet", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "claude-3-5-haiku-20241022", "display_name": "Claude 3.5 Haiku", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "claude-3-opus-20240229", "display_name": "Claude 3 Opus", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
    ],
    "Google AI": [
        {"model_id": "gemini-2.5-pro", "display_name": "Gemini 2.5 Pro", "max_tokens": 1000000, "context_window": 1000000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "gemini-2.5-flash", "display_name": "Gemini 2.5 Flash", "max_tokens": 1000000, "context_window": 1000000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "gemini-2.0-flash", "display_name": "Gemini 2.0 Flash", "max_tokens": 1000000, "context_window": 1000000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "gemini-1.5-pro", "display_name": "Gemini 1.5 Pro", "max_tokens": 2000000, "context_window": 2000000, "supports_vision": True, "supports_function_call": True},
    ],
    "DeepSeek": [
        {"model_id": "deepseek-chat", "display_name": "DeepSeek Chat", "max_tokens": 64000, "context_window": 64000, "supports_vision": False, "supports_function_call": True},
        {"model_id": "deepseek-reasoner", "display_name": "DeepSeek Reasoner", "max_tokens": 64000, "context_window": 64000, "supports_vision": False, "supports_function_call": False},
    ],
    "智谱 AI": [
        {"model_id": "glm-4-plus", "display_name": "GLM-4 Plus", "max_tokens": 128000, "context_window": 128000, "supports_vision": False, "supports_function_call": True},
        {"model_id": "glm-4v-plus", "display_name": "GLM-4V Plus", "max_tokens": 8192, "context_window": 8192, "supports_vision": True, "supports_function_call": True},
        {"model_id": "glm-4-flash", "display_name": "GLM-4 Flash", "max_tokens": 128000, "context_window": 128000, "supports_vision": False, "supports_function_call": True},
    ],
    "月之暗面": [
        {"model_id": "moonshot-v1-8k", "display_name": "Moonshot V1 8K", "max_tokens": 8000, "context_window": 8000, "supports_vision": False, "supports_function_call": True},
        {"model_id": "moonshot-v1-32k", "display_name": "Moonshot V1 32K", "max_tokens": 32000, "context_window": 32000, "supports_vision": False, "supports_function_call": True},
        {"model_id": "moonshot-v1-128k", "display_name": "Moonshot V1 128K", "max_tokens": 128000, "context_window": 128000, "supports_vision": False, "supports_function_call": True},
    ],
    "xAI": [
        {"model_id": "grok-2", "display_name": "Grok 2", "max_tokens": 131072, "context_window": 131072, "supports_vision": False, "supports_function_call": True},
        {"model_id": "grok-2-vision", "display_name": "Grok 2 Vision", "max_tokens": 32768, "context_window": 32768, "supports_vision": True, "supports_function_call": True},
    ],
}

# 默认系统配置
DEFAULT_SYSTEM_CONFIG = [
    {"key": "default_language", "value": "zh", "value_type": "string", "description": "默认诊断报告语言 (zh/en)"},
    {"key": "request_timeout", "value": "120", "value_type": "number", "description": "API 请求超时时间（秒）"},
    {"key": "max_retries", "value": "3", "value_type": "number", "description": "失败重试次数"},
    {"key": "enable_streaming", "value": "false", "value_type": "boolean", "description": "是否启用流式输出"},
    {"key": "log_level", "value": "INFO", "value_type": "string", "description": "日志级别"},
]
