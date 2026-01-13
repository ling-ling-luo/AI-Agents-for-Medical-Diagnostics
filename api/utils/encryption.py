"""API Key 加密工具"""
import os
import base64
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class APIKeyEncryption:
    """API Key 加密/解密工具类"""

    def __init__(self):
        """初始化加密器"""
        self._fernet = self._get_fernet()

    def _get_encryption_key(self) -> bytes:
        """获取或生成加密密钥"""
        # 从环境变量获取密钥种子
        key_seed = os.getenv("ENCRYPTION_KEY", "default-medical-diagnostics-key-2024")

        # 使用 PBKDF2 从种子派生固定长度的密钥
        salt = b"medical_diagnostics_salt_v1"
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_seed.encode()))
        return key

    def _get_fernet(self) -> Fernet:
        """获取 Fernet 加密器实例"""
        key = self._get_encryption_key()
        return Fernet(key)

    def encrypt(self, api_key: str) -> str:
        """
        加密 API Key

        Args:
            api_key: 原始 API Key

        Returns:
            加密后的字符串（base64 编码）
        """
        if not api_key:
            return ""
        encrypted = self._fernet.encrypt(api_key.encode())
        return encrypted.decode()

    def decrypt(self, encrypted_key: str) -> str:
        """
        解密 API Key

        Args:
            encrypted_key: 加密后的 API Key

        Returns:
            原始 API Key
        """
        if not encrypted_key:
            return ""
        try:
            decrypted = self._fernet.decrypt(encrypted_key.encode())
            return decrypted.decode()
        except Exception:
            # 解密失败返回空字符串
            return ""

    @staticmethod
    def mask_api_key(api_key: str) -> str:
        """
        对 API Key 进行脱敏显示

        Args:
            api_key: 原始或已解密的 API Key

        Returns:
            脱敏后的字符串，如 "sk-****...****"
        """
        if not api_key:
            return ""

        if len(api_key) <= 8:
            return "*" * len(api_key)

        # 显示前4位和后4位
        return f"{api_key[:4]}****...****{api_key[-4:]}"


# 创建全局实例
_encryption = None


def get_encryption() -> APIKeyEncryption:
    """获取加密工具实例（单例）"""
    global _encryption
    if _encryption is None:
        _encryption = APIKeyEncryption()
    return _encryption


def encrypt_api_key(api_key: str) -> str:
    """加密 API Key"""
    return get_encryption().encrypt(api_key)


def decrypt_api_key(encrypted_key: str) -> str:
    """解密 API Key"""
    return get_encryption().decrypt(encrypted_key)


def mask_api_key(api_key: str) -> str:
    """脱敏显示 API Key"""
    return APIKeyEncryption.mask_api_key(api_key)
