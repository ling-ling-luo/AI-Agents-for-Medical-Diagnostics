/**
 * 注册页面 - Google简约风格
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    if (password.length < 6) return { text: t('auth.passwordTooShort'), color: 'text-red-600' };
    if (password.length < 8) return { text: t('auth.passwordWeak'), color: 'text-orange-600' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { text: t('auth.passwordMedium'), color: 'text-yellow-600' };
    }
    return { text: t('auth.passwordStrong'), color: 'text-green-600' };
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
      setError(t('auth.fillAllRequired'));
      return;
    }

    if (formData.username.length < 3) {
      setError(t('auth.usernameMinLength'));
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError(t('auth.usernameInvalidChars'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
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
      navigate('/dashboard'); // 注册成功后跳转到仪表板
    } catch (err) {
      console.error('Register error:', err);
      const detail = err instanceof Error ? undefined : (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      if (detail) {
        setError(detail);
      } else {
        setError(t('auth.registerFailed'));
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
            {t('auth.createYourAccount')}
          </h1>
          <p className="text-sm text-gray-600">{t('auth.joinSystem')}</p>
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
                placeholder={t('auth.usernameRequired')}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-100"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">
                {t('auth.usernameHint')}
              </p>
            </div>

            {/* 姓名（可选） */}
            <div>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={t('auth.fullNameOptional')}
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
                placeholder={t('auth.passwordRequired')}
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
                placeholder={t('auth.confirmPasswordRequired')}
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
                      <span>{t('auth.passwordMatch')}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      <span>{t('auth.passwordMismatch')}</span>
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
                    <span>{t('auth.registering')}</span>
                  </>
                ) : (
                  <span>{t('auth.registerButton')}</span>
                )}
              </button>
            </div>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">{t('auth.hasAccount')}</span>
            {' '}
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('auth.signInNow')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
