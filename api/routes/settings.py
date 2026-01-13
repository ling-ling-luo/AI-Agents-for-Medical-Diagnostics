"""系统设置相关API路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import httpx

from api.db.database import get_db
from api.auth.permissions import PermissionChecker
from api.auth.dependencies import get_current_user
from api.models.user import User, ROLE_PERMISSIONS
from api.models.settings import (
    Provider, Model, SystemConfig,
    PROVIDER_TEMPLATES, PRESET_MODELS, DEFAULT_SYSTEM_CONFIG
)
from api.utils.encryption import encrypt_api_key, decrypt_api_key, mask_api_key

router = APIRouter(prefix="/api/settings", tags=["settings"])

# 权限检查器
require_settings_read = PermissionChecker("settings", "read")
require_settings_write = PermissionChecker("settings", "write")


# ============ Pydantic 模型 ============

class ProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="供应商名称")
    base_url: str = Field(..., min_length=1, max_length=500, description="API 基础 URL")
    api_key: str = Field(..., min_length=1, description="API Key")
    is_enabled: bool = Field(default=True, description="是否启用")
    is_default: bool = Field(default=False, description="是否为默认")


class ProviderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="供应商名称")
    base_url: Optional[str] = Field(None, min_length=1, max_length=500, description="API 基础 URL")
    api_key: Optional[str] = Field(None, description="API Key（不传则不更新）")
    is_enabled: Optional[bool] = Field(None, description="是否启用")
    is_default: Optional[bool] = Field(None, description="是否为默认")


class ProviderResponse(BaseModel):
    id: int
    name: str
    base_url: str
    api_key_masked: str
    is_enabled: bool
    is_default: bool
    model_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ModelCreate(BaseModel):
    provider_id: int = Field(..., description="供应商ID")
    model_id: str = Field(..., min_length=1, max_length=100, description="模型标识")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名称")
    is_enabled: bool = Field(default=True, description="是否启用")
    is_default: bool = Field(default=False, description="是否为默认")
    max_tokens: Optional[int] = Field(None, description="最大 Token 数")
    context_window: Optional[int] = Field(None, description="上下文窗口大小")
    supports_vision: bool = Field(default=False, description="是否支持图像")
    supports_function_call: bool = Field(default=False, description="是否支持函数调用")


class ModelUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=200, description="显示名称")
    is_enabled: Optional[bool] = Field(None, description="是否启用")
    is_default: Optional[bool] = Field(None, description="是否为默认")
    max_tokens: Optional[int] = Field(None, description="最大 Token 数")
    context_window: Optional[int] = Field(None, description="上下文窗口大小")
    supports_vision: Optional[bool] = Field(None, description="是否支持图像")
    supports_function_call: Optional[bool] = Field(None, description="是否支持函数调用")


class ModelResponse(BaseModel):
    id: int
    provider_id: int
    provider_name: str
    model_id: str
    display_name: str
    is_enabled: bool
    is_default: bool
    max_tokens: Optional[int]
    context_window: Optional[int]
    supports_vision: bool
    supports_function_call: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemConfigUpdate(BaseModel):
    default_language: Optional[str] = Field(None, description="默认语言")
    request_timeout: Optional[int] = Field(None, ge=10, le=600, description="请求超时时间")
    max_retries: Optional[int] = Field(None, ge=0, le=10, description="重试次数")
    enable_streaming: Optional[bool] = Field(None, description="是否启用流式输出")
    log_level: Optional[str] = Field(None, description="日志级别")


class TestConnectionResponse(BaseModel):
    status: str
    latency_ms: Optional[int]
    message: str
    available_models: Optional[List[str]]


class ImportModelsRequest(BaseModel):
    model_ids: List[str] = Field(..., min_length=1, description="要导入的模型 ID 列表")


# ============ 供应商 API ============

@router.get("/providers")
async def list_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_read)
):
    """获取供应商列表"""
    providers = db.query(Provider).order_by(Provider.is_default.desc(), Provider.id).all()

    result = []
    for p in providers:
        model_count = db.query(Model).filter(Model.provider_id == p.id, Model.is_enabled == True).count()
        result.append({
            "id": p.id,
            "name": p.name,
            "base_url": p.base_url,
            "api_key_masked": mask_api_key(decrypt_api_key(p.api_key_encrypted)),
            "is_enabled": p.is_enabled,
            "is_default": p.is_default,
            "model_count": model_count,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        })

    return {"success": True, "data": result}


@router.post("/providers")
async def create_provider(
    provider: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """创建供应商"""
    # 如果设为默认，先取消其他默认
    if provider.is_default:
        db.query(Provider).filter(Provider.is_default == True).update({"is_default": False})

    new_provider = Provider(
        name=provider.name,
        base_url=provider.base_url.rstrip("/"),
        api_key_encrypted=encrypt_api_key(provider.api_key),
        is_enabled=provider.is_enabled,
        is_default=provider.is_default
    )
    db.add(new_provider)
    db.commit()
    db.refresh(new_provider)

    return {
        "success": True,
        "data": {
            "id": new_provider.id,
            "name": new_provider.name,
            "base_url": new_provider.base_url,
            "is_enabled": new_provider.is_enabled,
            "is_default": new_provider.is_default
        }
    }


@router.put("/providers/{provider_id}")
async def update_provider(
    provider_id: int,
    provider: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """更新供应商"""
    db_provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="供应商不存在")

    # 如果设为默认，先取消其他默认
    if provider.is_default:
        db.query(Provider).filter(
            and_(Provider.is_default == True, Provider.id != provider_id)
        ).update({"is_default": False})

    # 更新字段
    if provider.name is not None:
        db_provider.name = provider.name
    if provider.base_url is not None:
        db_provider.base_url = provider.base_url.rstrip("/")
    if provider.api_key is not None:
        db_provider.api_key_encrypted = encrypt_api_key(provider.api_key)
    if provider.is_enabled is not None:
        db_provider.is_enabled = provider.is_enabled
    if provider.is_default is not None:
        db_provider.is_default = provider.is_default

    db.commit()
    db.refresh(db_provider)

    return {
        "success": True,
        "data": {
            "id": db_provider.id,
            "name": db_provider.name,
            "base_url": db_provider.base_url,
            "is_enabled": db_provider.is_enabled,
            "is_default": db_provider.is_default
        }
    }


@router.delete("/providers/{provider_id}")
async def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """删除供应商（会级联删除关联的模型）"""
    db_provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="供应商不存在")

    provider_name = db_provider.name
    db.delete(db_provider)
    db.commit()

    return {"success": True, "message": f"供应商 '{provider_name}' 已删除"}


@router.post("/providers/{provider_id}/test")
async def test_provider_connection(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_read)
):
    """测试供应商连接"""
    db_provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="供应商不存在")

    api_key = decrypt_api_key(db_provider.api_key_encrypted)
    base_url = db_provider.base_url

    try:
        import time
        start_time = time.time()

        async with httpx.AsyncClient(timeout=30.0) as client:
            # 尝试获取模型列表来测试连接
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            # 根据供应商类型调整测试端点
            if "anthropic" in base_url.lower():
                # Anthropic 使用不同的认证头
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
                test_url = f"{base_url}/v1/messages"
                # Anthropic 没有 models 端点，发送一个简单请求测试
                response = await client.post(
                    test_url,
                    headers=headers,
                    json={"model": "claude-3-haiku-20240307", "max_tokens": 1, "messages": [{"role": "user", "content": "hi"}]}
                )
            else:
                # OpenAI 兼容的 API
                test_url = f"{base_url}/models"
                response = await client.get(test_url, headers=headers)

            latency_ms = int((time.time() - start_time) * 1000)

            if response.status_code == 200:
                # 尝试解析模型列表
                available_models = []
                try:
                    data = response.json()
                    if "data" in data:
                        available_models = [m.get("id", "") for m in data["data"][:20]]
                except Exception:
                    pass

                return {
                    "success": True,
                    "data": {
                        "status": "connected",
                        "latency_ms": latency_ms,
                        "message": "连接成功",
                        "available_models": available_models
                    }
                }
            elif response.status_code == 401:
                return {
                    "success": True,
                    "data": {
                        "status": "auth_failed",
                        "latency_ms": latency_ms,
                        "message": "API Key 无效或已过期",
                        "available_models": None
                    }
                }
            else:
                return {
                    "success": True,
                    "data": {
                        "status": "error",
                        "latency_ms": latency_ms,
                        "message": f"连接失败: HTTP {response.status_code}",
                        "available_models": None
                    }
                }

    except httpx.TimeoutException:
        return {
            "success": True,
            "data": {
                "status": "timeout",
                "latency_ms": None,
                "message": "连接超时，请检查网络或 URL 是否正确",
                "available_models": None
            }
        }
    except Exception as e:
        return {
            "success": True,
            "data": {
                "status": "error",
                "latency_ms": None,
                "message": f"连接失败: {str(e)}",
                "available_models": None
            }
        }


@router.get("/providers/templates")
async def get_provider_templates(
    current_user: User = Depends(require_settings_read)
):
    """获取预置供应商模板"""
    return {"success": True, "data": PROVIDER_TEMPLATES}


@router.post("/providers/{provider_id}/fetch-models")
async def fetch_remote_models(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """
    从供应商 API 自动获取可用模型列表

    支持的供应商:
    - OpenAI 及兼容 API (DeepSeek, 月之暗面, xAI 等)
    - Anthropic
    - Google AI (Gemini)
    - 智谱 AI
    """
    db_provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="供应商不存在")

    api_key = decrypt_api_key(db_provider.api_key_encrypted)
    base_url = db_provider.base_url
    provider_name = db_provider.name.lower()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            models = []
            source = "api"  # 默认来源

            # 根据供应商类型调用不同的 API
            if "anthropic" in provider_name or "anthropic" in base_url.lower():
                # Anthropic 没有 models 列表 API，返回预置模型
                models = _get_anthropic_models()
                source = "preset"

            elif "google" in provider_name or "gemini" in provider_name or "generativelanguage" in base_url.lower():
                # Google AI (Gemini) 使用不同的认证方式
                models = await _fetch_google_models(client, base_url, api_key)
                source = "api"

            elif "bigmodel" in base_url.lower() or "智谱" in provider_name:
                # 智谱 AI 没有公开的 models API，返回预置模型
                models = _get_zhipu_models()
                source = "preset"

            else:
                # OpenAI 兼容的 API (OpenAI, DeepSeek, 月之暗面, xAI 等)
                models = await _fetch_openai_compatible_models(client, base_url, api_key)
                source = "api"

            return {
                "success": True,
                "data": {
                    "provider_id": provider_id,
                    "provider_name": db_provider.name,
                    "models": models,
                    "total_count": len(models),
                    "source": source
                }
            }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="连接超时，请检查网络或 URL")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")


@router.post("/providers/{provider_id}/import-models")
async def import_fetched_models(
    provider_id: int,
    request: ImportModelsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """
    导入选中的远程模型到数据库

    参数:
    - model_ids: 要导入的模型 ID 列表
    """
    model_ids = request.model_ids

    db_provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="供应商不存在")

    api_key = decrypt_api_key(db_provider.api_key_encrypted)
    base_url = db_provider.base_url
    provider_name = db_provider.name.lower()

    # 获取完整的模型信息
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            all_models = []

            if "anthropic" in provider_name or "anthropic" in base_url.lower():
                all_models = _get_anthropic_models()
            elif "google" in provider_name or "gemini" in provider_name or "generativelanguage" in base_url.lower():
                all_models = await _fetch_google_models(client, base_url, api_key)
            elif "bigmodel" in base_url.lower() or "智谱" in provider_name:
                all_models = _get_zhipu_models()
            else:
                all_models = await _fetch_openai_compatible_models(client, base_url, api_key)

            # 创建模型 ID 到模型信息的映射
            model_map = {m["model_id"]: m for m in all_models}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模型信息失败: {str(e)}")

    created_count = 0
    skipped_count = 0

    for model_id in model_ids:
        # 检查是否已存在
        existing = db.query(Model).filter(
            and_(Model.provider_id == provider_id, Model.model_id == model_id)
        ).first()
        if existing:
            skipped_count += 1
            continue

        # 获取模型详细信息
        model_info = model_map.get(model_id, {
            "model_id": model_id,
            "display_name": model_id,
            "max_tokens": None,
            "context_window": None,
            "supports_vision": False,
            "supports_function_call": False
        })

        new_model = Model(
            provider_id=provider_id,
            model_id=model_id,
            display_name=model_info.get("display_name", model_id),
            is_enabled=True,
            is_default=False,
            max_tokens=model_info.get("max_tokens"),
            context_window=model_info.get("context_window"),
            supports_vision=model_info.get("supports_vision", False),
            supports_function_call=model_info.get("supports_function_call", False)
        )
        db.add(new_model)
        created_count += 1

    db.commit()

    return {
        "success": True,
        "data": {
            "created_count": created_count,
            "skipped_count": skipped_count
        }
    }


async def _fetch_openai_compatible_models(client: httpx.AsyncClient, base_url: str, api_key: str) -> List[dict]:
    """获取 OpenAI 兼容 API 的模型列表"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    response = await client.get(f"{base_url}/models", headers=headers)

    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="API Key 无效")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"API 返回错误: {response.status_code}")

    data = response.json()
    models = []

    if "data" in data:
        for m in data["data"]:
            model_id = m.get("id", "")
            # 过滤掉一些不需要的模型（如 embedding 模型）
            if not model_id or any(skip in model_id.lower() for skip in ["embedding", "whisper", "tts", "dall-e", "moderation"]):
                continue

            # 尝试从模型 ID 推断属性
            display_name = _format_model_display_name(model_id)
            supports_vision = any(v in model_id.lower() for v in ["vision", "4o", "gpt-4-turbo", "grok-2-vision"])
            supports_function = not any(nf in model_id.lower() for nf in ["o1", "reasoner"])

            # 尝试获取上下文窗口大小
            context_window = m.get("context_window") or _estimate_context_window(model_id)

            models.append({
                "model_id": model_id,
                "display_name": display_name,
                "max_tokens": context_window,
                "context_window": context_window,
                "supports_vision": supports_vision,
                "supports_function_call": supports_function,
                "owned_by": m.get("owned_by", "")
            })

    # 按模型 ID 排序
    models.sort(key=lambda x: x["model_id"])
    return models


async def _fetch_google_models(client: httpx.AsyncClient, base_url: str, api_key: str) -> List[dict]:
    """获取 Google AI (Gemini) 的模型列表"""
    # Google AI 使用 API key 作为查询参数
    response = await client.get(
        f"{base_url}/models",
        params={"key": api_key}
    )

    if response.status_code == 401 or response.status_code == 403:
        raise HTTPException(status_code=401, detail="API Key 无效")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"API 返回错误: {response.status_code}")

    data = response.json()
    models = []

    if "models" in data:
        for m in data["models"]:
            # Google 返回的模型名称格式是 "models/gemini-pro"
            full_name = m.get("name", "")
            model_id = full_name.replace("models/", "") if full_name.startswith("models/") else full_name

            # 过滤掉 embedding 和 aqa 模型
            if any(skip in model_id.lower() for skip in ["embedding", "aqa", "text-"]):
                continue

            display_name = m.get("displayName", model_id)

            # 从 supportedGenerationMethods 判断支持的功能
            gen_methods = m.get("supportedGenerationMethods", [])
            supports_vision = "generateContent" in gen_methods  # Gemini 模型通常都支持多模态

            # 获取输入/输出 token 限制
            input_limit = m.get("inputTokenLimit", 32000)
            output_limit = m.get("outputTokenLimit", 8192)

            models.append({
                "model_id": model_id,
                "display_name": display_name,
                "max_tokens": output_limit,
                "context_window": input_limit,
                "supports_vision": supports_vision,
                "supports_function_call": "generateContent" in gen_methods
            })

    return models


def _get_anthropic_models() -> List[dict]:
    """返回 Anthropic 的预置模型列表（Anthropic 没有公开的 models API）"""
    return [
        {"model_id": "claude-sonnet-4-20250514", "display_name": "Claude Sonnet 4", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "claude-3-5-sonnet-20241022", "display_name": "Claude 3.5 Sonnet", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "claude-3-5-haiku-20241022", "display_name": "Claude 3.5 Haiku", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "claude-3-opus-20240229", "display_name": "Claude 3 Opus", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
        {"model_id": "claude-3-haiku-20240307", "display_name": "Claude 3 Haiku", "max_tokens": 200000, "context_window": 200000, "supports_vision": True, "supports_function_call": True},
    ]


def _get_zhipu_models() -> List[dict]:
    """返回智谱 AI 的预置模型列表"""
    return [
        {"model_id": "glm-4-plus", "display_name": "GLM-4 Plus", "max_tokens": 128000, "context_window": 128000, "supports_vision": False, "supports_function_call": True},
        {"model_id": "glm-4v-plus", "display_name": "GLM-4V Plus", "max_tokens": 8192, "context_window": 8192, "supports_vision": True, "supports_function_call": True},
        {"model_id": "glm-4-flash", "display_name": "GLM-4 Flash", "max_tokens": 128000, "context_window": 128000, "supports_vision": False, "supports_function_call": True},
        {"model_id": "glm-4-long", "display_name": "GLM-4 Long", "max_tokens": 1000000, "context_window": 1000000, "supports_vision": False, "supports_function_call": True},
        {"model_id": "glm-4-flashx", "display_name": "GLM-4 FlashX", "max_tokens": 128000, "context_window": 128000, "supports_vision": False, "supports_function_call": True},
    ]


def _format_model_display_name(model_id: str) -> str:
    """格式化模型 ID 为更友好的显示名称"""
    # 常见模型的映射
    name_map = {
        "gpt-4o": "GPT-4o",
        "gpt-4o-mini": "GPT-4o Mini",
        "gpt-4-turbo": "GPT-4 Turbo",
        "gpt-4": "GPT-4",
        "gpt-3.5-turbo": "GPT-3.5 Turbo",
        "o1": "o1",
        "o1-mini": "o1 Mini",
        "o1-preview": "o1 Preview",
        "deepseek-chat": "DeepSeek Chat",
        "deepseek-reasoner": "DeepSeek Reasoner",
        "deepseek-coder": "DeepSeek Coder",
        "moonshot-v1-8k": "Moonshot V1 8K",
        "moonshot-v1-32k": "Moonshot V1 32K",
        "moonshot-v1-128k": "Moonshot V1 128K",
        "grok-2": "Grok 2",
        "grok-2-vision": "Grok 2 Vision",
    }

    if model_id in name_map:
        return name_map[model_id]

    # 简单格式化：首字母大写，连字符替换为空格
    return model_id.replace("-", " ").title()


def _estimate_context_window(model_id: str) -> Optional[int]:
    """根据模型 ID 估计上下文窗口大小"""
    model_lower = model_id.lower()

    if "128k" in model_lower:
        return 128000
    elif "32k" in model_lower:
        return 32000
    elif "16k" in model_lower:
        return 16000
    elif "8k" in model_lower:
        return 8000
    elif "4o" in model_lower or "gpt-4-turbo" in model_lower:
        return 128000
    elif "gpt-4" in model_lower:
        return 8192
    elif "gpt-3.5" in model_lower:
        return 16000
    elif "o1" in model_lower:
        return 200000
    elif "deepseek" in model_lower:
        return 64000

    return None


@router.get("/providers/{provider_id}/preset-models")
async def get_preset_models_for_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_read)
):
    """获取供应商的预置模型列表"""
    db_provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not db_provider:
        raise HTTPException(status_code=404, detail="供应商不存在")

    preset_models = PRESET_MODELS.get(db_provider.name, [])
    return {"success": True, "data": preset_models}


# ============ 模型 API ============

@router.get("/models")
async def list_models(
    provider_id: Optional[int] = Query(None, description="供应商ID筛选"),
    is_enabled: Optional[bool] = Query(None, description="启用状态筛选"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_read)
):
    """获取模型列表"""
    query = db.query(Model).join(Provider)

    if provider_id is not None:
        query = query.filter(Model.provider_id == provider_id)
    if is_enabled is not None:
        query = query.filter(Model.is_enabled == is_enabled)

    models = query.order_by(Model.is_default.desc(), Model.provider_id, Model.id).all()

    result = []
    for m in models:
        result.append({
            "id": m.id,
            "provider_id": m.provider_id,
            "provider_name": m.provider.name,
            "model_id": m.model_id,
            "display_name": m.display_name,
            "is_enabled": m.is_enabled,
            "is_default": m.is_default,
            "max_tokens": m.max_tokens,
            "context_window": m.context_window,
            "supports_vision": m.supports_vision,
            "supports_function_call": m.supports_function_call,
            "created_at": m.created_at,
            "updated_at": m.updated_at
        })

    return {"success": True, "data": result}


@router.post("/models")
async def create_model(
    model: ModelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """创建模型"""
    # 验证供应商存在
    provider = db.query(Provider).filter(Provider.id == model.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="供应商不存在")

    # 检查模型是否已存在
    existing = db.query(Model).filter(
        and_(Model.provider_id == model.provider_id, Model.model_id == model.model_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该模型已存在")

    # 如果设为默认，先取消其他默认
    if model.is_default:
        db.query(Model).filter(Model.is_default == True).update({"is_default": False})

    new_model = Model(
        provider_id=model.provider_id,
        model_id=model.model_id,
        display_name=model.display_name,
        is_enabled=model.is_enabled,
        is_default=model.is_default,
        max_tokens=model.max_tokens,
        context_window=model.context_window,
        supports_vision=model.supports_vision,
        supports_function_call=model.supports_function_call
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)

    return {
        "success": True,
        "data": {
            "id": new_model.id,
            "provider_id": new_model.provider_id,
            "model_id": new_model.model_id,
            "display_name": new_model.display_name
        }
    }


@router.post("/models/batch")
async def create_models_batch(
    provider_id: int,
    models: List[ModelCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """批量创建模型"""
    # 验证供应商存在
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="供应商不存在")

    created_count = 0
    skipped_count = 0

    for model in models:
        # 检查模型是否已存在
        existing = db.query(Model).filter(
            and_(Model.provider_id == provider_id, Model.model_id == model.model_id)
        ).first()
        if existing:
            skipped_count += 1
            continue

        new_model = Model(
            provider_id=provider_id,
            model_id=model.model_id,
            display_name=model.display_name,
            is_enabled=model.is_enabled,
            is_default=False,  # 批量创建不设置默认
            max_tokens=model.max_tokens,
            context_window=model.context_window,
            supports_vision=model.supports_vision,
            supports_function_call=model.supports_function_call
        )
        db.add(new_model)
        created_count += 1

    db.commit()

    return {
        "success": True,
        "data": {
            "created_count": created_count,
            "skipped_count": skipped_count
        }
    }


@router.put("/models/{model_id}")
async def update_model(
    model_id: int,
    model: ModelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """更新模型"""
    db_model = db.query(Model).filter(Model.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="模型不存在")

    # 如果设为默认，先取消其他默认
    if model.is_default:
        db.query(Model).filter(
            and_(Model.is_default == True, Model.id != model_id)
        ).update({"is_default": False})

    # 更新字段
    if model.display_name is not None:
        db_model.display_name = model.display_name
    if model.is_enabled is not None:
        db_model.is_enabled = model.is_enabled
    if model.is_default is not None:
        db_model.is_default = model.is_default
    if model.max_tokens is not None:
        db_model.max_tokens = model.max_tokens
    if model.context_window is not None:
        db_model.context_window = model.context_window
    if model.supports_vision is not None:
        db_model.supports_vision = model.supports_vision
    if model.supports_function_call is not None:
        db_model.supports_function_call = model.supports_function_call

    db.commit()
    db.refresh(db_model)

    return {
        "success": True,
        "data": {
            "id": db_model.id,
            "model_id": db_model.model_id,
            "display_name": db_model.display_name,
            "is_enabled": db_model.is_enabled,
            "is_default": db_model.is_default
        }
    }


@router.delete("/models/{model_id}")
async def delete_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """删除模型"""
    db_model = db.query(Model).filter(Model.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="模型不存在")

    model_name = db_model.display_name
    db.delete(db_model)
    db.commit()

    return {"success": True, "message": f"模型 '{model_name}' 已删除"}


# ============ 系统配置 API ============

@router.get("/config")
async def get_system_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_read)
):
    """获取系统配置"""
    configs = db.query(SystemConfig).all()

    result = {}
    for config in configs:
        result[config.key] = {
            "value": config.get_typed_value(),
            "value_type": config.value_type,
            "description": config.description
        }

    # 获取默认模型信息
    default_model = db.query(Model).filter(Model.is_default == True).first()
    if default_model:
        result["default_model"] = {
            "value": {
                "id": default_model.id,
                "model_id": default_model.model_id,
                "display_name": default_model.display_name,
                "provider_name": default_model.provider.name
            },
            "value_type": "object",
            "description": "默认诊断模型"
        }

    return {"success": True, "data": result}


@router.put("/config")
async def update_system_config(
    config: SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_settings_write)
):
    """更新系统配置"""
    updated = []

    if config.default_language is not None:
        _update_config(db, "default_language", config.default_language, "string")
        updated.append("default_language")

    if config.request_timeout is not None:
        _update_config(db, "request_timeout", str(config.request_timeout), "number")
        updated.append("request_timeout")

    if config.max_retries is not None:
        _update_config(db, "max_retries", str(config.max_retries), "number")
        updated.append("max_retries")

    if config.enable_streaming is not None:
        _update_config(db, "enable_streaming", str(config.enable_streaming).lower(), "boolean")
        updated.append("enable_streaming")

    if config.log_level is not None:
        _update_config(db, "log_level", config.log_level, "string")
        updated.append("log_level")

    db.commit()

    return {"success": True, "message": f"已更新配置: {', '.join(updated)}"}


def _update_config(db: Session, key: str, value: str, value_type: str):
    """更新单个配置项"""
    config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if config:
        config.value = value
        config.value_type = value_type
    else:
        config = SystemConfig(key=key, value=value, value_type=value_type)
        db.add(config)


# ============ 可用模型 API（供诊断模块使用）============

@router.get("/available-models")
async def get_available_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取可用于诊断的模型列表（供病例详情页使用）

    返回已启用供应商下的已启用模型，按供应商分组
    """
    # 查询已启用的供应商和模型
    providers = db.query(Provider).filter(Provider.is_enabled == True).all()

    result = []
    for provider in providers:
        enabled_models = [m for m in provider.models if m.is_enabled]
        if enabled_models:
            provider_data = {
                "provider_id": provider.id,
                "provider_name": provider.name,
                "is_default": provider.is_default,
                "models": []
            }
            for model in enabled_models:
                provider_data["models"].append({
                    "id": model.id,
                    "model_id": model.model_id,
                    "display_name": model.display_name,
                    "is_default": model.is_default,
                    "supports_vision": model.supports_vision
                })
            result.append(provider_data)

    return {"success": True, "data": result}
