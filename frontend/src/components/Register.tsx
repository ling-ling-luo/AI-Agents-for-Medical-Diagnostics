/**
 * 注册页面 - Google简约风格
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 密码强度提示
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return null;
    if (password.length < 6) return { text: '密码太短', color: 'text-red-600' };
    if (password.length < 8) return { text: '密码强度：弱', color: 'text-orange-600' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { text: '密码强度：中', color: 'text-yellow-600' };
    }
    return { text: '密码强度：强', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证
    if (!formData.username || !formData.password) {
      setError('请填写所有必填项');
      return;
    }

    if (formData.username.length < 3) {
      setError('用户名至少3个字符');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('用户名只能包含字母、数字和下划线');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少6个字符');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      setIsLoading(true);
      // 使用用户名作为邮箱（后端要求）
      const email = `${formData.username}@local.user`;
      await register(
        formData.username,
        email,
        formData.password,
        formData.fullName || undefined
      );
      navigate('/'); // 注册成功后跳转到首页
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('注册失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12">
      <div className="w-full max-w-md px-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-normal text-gray-800 mb-2">
            创建您的账户
          </h1>
          <p className="text-sm text-gray-600">加入 AI 医疗诊断系统</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-white border border-gray-300 rounded-lg p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名 */}
            <div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="用户名（必填）"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-100"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">
                3-50个字符，仅字母、数字和下划线
              </p>
            </div>

            {/* 姓名（可选） */}
            <div>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="姓名（可选）"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-100"
              />
            </div>

            {/* 密码 */}
            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="密码（必填）"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-100"
              />
              {passwordStrength && (
                <p className={`text-xs mt-1 ml-1 ${passwordStrength.color}`}>
                  {passwordStrength.text}
                </p>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="确认密码（必填）"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-100"
              />
              {formData.confirmPassword && (
                <p className={`text-xs mt-1 ml-1 flex items-center gap-1 ${
                  formData.password === formData.confirmPassword
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>密码匹配</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      <span>密码不匹配</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 注册按钮 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>注册中...</span>
                  </>
                ) : (
                  <span>注册</span>
                )}
              </button>
            </div>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">已有账户？</span>
            {' '}
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
