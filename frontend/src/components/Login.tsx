/**
 * 登录页面 - Google简约风格
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { AlertCircle, Loader } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // 清除错误提示
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || !formData.password) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      setIsLoading(true);
      await login(formData.username, formData.password);
      navigate('/dashboard'); // 登录成功后跳转到仪表板
    } catch (err) {
      console.error('Login error:', err);
      const status = err instanceof Error ? undefined : (err as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        setError('用户名或密码错误');
      } else if (status === 403) {
        setError('账户已被禁用，请联系管理员');
      } else {
        setError('登录失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-normal text-gray-800 mb-2">
            AI 医疗诊断系统
          </h1>
          <p className="text-sm text-gray-600">登录到您的账户</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white border border-gray-300 rounded-lg p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名输入 */}
            <div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="用户名"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-500"
                autoFocus
              />
            </div>

            {/* 密码输入 */}
            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="密码"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 登录按钮 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <span>登录</span>
                )}
              </button>
            </div>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">还没有账户？</span>
            {' '}
            <Link
              to="/register"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              创建账户
            </Link>
          </div>
        </div>

        {/* 测试账户提示 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            测试账户：admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
};
