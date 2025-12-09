/**
 * 认证API服务
 * 处理用户登录、注册、个人信息等认证相关的API调用
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// ---- 类型定义 ----

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_superuser: boolean;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// ---- 认证API类 ----

class AuthAPI {
  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, data);
    return response.data;
  }

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, data);
    return response.data;
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(token: string): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  /**
   * 修改密码
   */
  async changePassword(token: string, data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/change-password`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  /**
   * 登出（客户端操作，清除令牌）
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
}

export const authApi = new AuthAPI();
