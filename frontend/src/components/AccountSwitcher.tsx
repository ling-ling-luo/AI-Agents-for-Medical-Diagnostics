/**
 * 账号切换组件
 * 显示历史登录账号，支持快速切换
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import type { SavedAccount } from '../context/types';
import { User, X, LogOut, ChevronDown, Loader } from 'lucide-react';

export const AccountSwitcher = () => {
  const { t } = useTranslation();
  const { user, savedAccounts, switchAccount, removeAccount, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 当前账号不在历史列表中显示
  const otherAccounts = savedAccounts.filter(acc => acc.username !== user?.username);

  const handleSwitchClick = (account: SavedAccount) => {
    setShowPasswordFor(account.username);
    setPassword('');
    setError(null);
  };

  const handleSwitch = async (username: string) => {
    if (!password) {
      setError(t('account.pleaseEnterPassword'));
      return;
    }

    try {
      setSwitchingTo(username);
      setError(null);
      await switchAccount(username, password);
      setIsOpen(false);
      setShowPasswordFor(null);
      setPassword('');
    } catch (err) {
      console.error('Switch account error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(t('account.switchFailed') + (message || t('account.invalidCredentials')));
    } finally {
      setSwitchingTo(null);
    }
  };

  const handleRemove = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeAccount(username);
    if (showPasswordFor === username) {
      setShowPasswordFor(null);
      setPassword('');
      setError(null);
    }
  };

  const formatLastLogin = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('account.justNow');
    if (diffMins < 60) return `${diffMins} ${t('account.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('account.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays} ${t('account.daysAgo')}`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* 当前用户按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors"
      >
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-gray-800">
            {user?.full_name || user?.username}
          </p>
          <p className="text-xs text-gray-500">
            {user?.roles.map(r => r === 'admin' ? t('account.admin') : r === 'doctor' ? t('account.doctor') : t('account.user')).join(', ')}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setShowPasswordFor(null);
              setPassword('');
              setError(null);
            }}
          />

          {/* 菜单内容 */}
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg z-20">
            {/* 当前账号 */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.full_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* 历史账号列表 */}
            {otherAccounts.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500">
                  {t('account.switchAccount')}
                </div>
                {otherAccounts.map(account => (
                  <div key={account.username}>
                    {showPasswordFor === account.username ? (
                      // 密码输入界面
                      <div className="px-4 py-3 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-800">
                            {account.fullName || account.username}
                          </span>
                        </div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSwitch(account.username);
                            }
                          }}
                          placeholder={t('account.enterPassword')}
                          autoFocus
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                        {error && (
                          <p className="text-xs text-red-600 mt-1">{error}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSwitch(account.username)}
                            disabled={switchingTo === account.username}
                            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-blue-400 flex items-center justify-center gap-1"
                          >
                            {switchingTo === account.username ? (
                              <>
                                <Loader className="w-3 h-3 animate-spin" />
                                <span>{t('common.switchingAccount')}</span>
                              </>
                            ) : (
                              <span>{t('common.confirm')}</span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordFor(null);
                              setPassword('');
                              setError(null);
                            }}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 账号选项
                      <button
                        onClick={() => handleSwitchClick(account)}
                        className="w-full px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm text-gray-800">
                            {account.fullName || account.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatLastLogin(account.lastLogin)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleRemove(account.username, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                          title={t('account.removeAccount')}
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 登出按钮 */}
            <div className="border-t border-gray-200">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">{t('common.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
