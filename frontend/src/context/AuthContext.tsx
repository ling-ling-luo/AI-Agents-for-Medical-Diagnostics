/**
 * 认证上下文
 * 提供全局的用户认证状态管理
 */
import React, { useState, useEffect, type ReactNode } from 'react';
import { authApi, type User } from '../services/authApi';
import { AuthContext, type SavedAccount } from './AuthContextObject';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const savedAccountsString = localStorage.getItem('saved_accounts');
  const savedAccounts: SavedAccount[] = (() => {
    if (!savedAccountsString) return [];
    try {
      return JSON.parse(savedAccountsString) as SavedAccount[];
    } catch (e) {
      console.error('Failed to parse saved accounts:', e);
      return [];
    }
  })();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [savedAccountsState, setSavedAccountsState] = useState<SavedAccount[]>(savedAccounts);

  // 保存账号到历史列表
  const saveAccount = (userData: User) => {
    const newAccount: SavedAccount = {
      username: userData.username,
      fullName: userData.full_name,
      lastLogin: new Date().toISOString()
    };

    setSavedAccountsState(prev => {
      // 移除重复的账号
      const filtered = prev.filter(acc => acc.username !== userData.username);
      // 添加到最前面
      const updated = [newAccount, ...filtered].slice(0, 5); // 最多保存5个账号
      localStorage.setItem('saved_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  // 移除历史账号
  const removeAccount = (username: string) => {
    setSavedAccountsState(prev => {
      const updated = prev.filter(acc => acc.username !== username);
      localStorage.setItem('saved_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  // 初始化：如果有令牌，尝试获取用户信息
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authApi.getCurrentUser(token);
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          // 令牌无效，清除
          setToken(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  /**
   * 登录
   */
  const login = async (username: string, password: string) => {
    const response = await authApi.login({ username, password });
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    // 保存到历史账号
    saveAccount(response.user);
  };

  /**
   * 切换账号
   */
  const switchAccount = async (username: string, password: string) => {
    // 切换账号就是重新登录
    await login(username, password);
  };

  /**
   * 注册
   */
  const register = async (username: string, email: string, password: string, fullName?: string) => {
    const response = await authApi.register({ username, email, password, full_name: fullName });
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  /**
   * 登出
   */
  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
  };

  /**
   * 检查用户是否有指定权限
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // 超级管理员拥有所有权限
    if (user.is_superuser) return true;
    return user.permissions.includes(permission);
  };

  /**
   * 检查用户是否有指定角色
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  /**
   * 刷新用户信息
   */
  const refreshUser = async () => {
    if (token) {
      const userData = await authApi.getCurrentUser(token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasPermission,
        hasRole,
        refreshUser,
        savedAccounts: savedAccountsState,
        switchAccount,
        removeAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用认证上下文的Hook
 */
