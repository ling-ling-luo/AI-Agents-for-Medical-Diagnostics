/**
 * 账号切换组件
 * 显示历史登录账号，支持快速切换
 */
import { useState } from 'react';
import { useAuth, type SavedAccount } from '../context/AuthContext';
import { User, X, LogOut, ChevronDown, Loader, HelpCircle } from 'lucide-react';

export const AccountSwitcher = () => {
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
      setError('请输入密码');
      return;
    }

    try {
      setSwitchingTo(username);
      setError(null);
      await switchAccount(username, password);
      setIsOpen(false);
      setShowPasswordFor(null);
      setPassword('');
    } catch (err: any) {
      console.error('Switch account error:', err);
      setError('切换失败：' + (err.response?.data?.detail || '用户名或密码错误'));
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

  // 重新观看引导
  const handleRestartTour = () => {
    // 清除所有引导完成标记
    localStorage.removeItem('onboarding_home_completed');
    localStorage.removeItem('onboarding_detail_completed');
    localStorage.setItem('should_show_detail_tour', 'true');
    setIsOpen(false);
    // 刷新页面重新触发引导
    window.location.reload();
  };

  const formatLastLogin = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
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
            {user?.roles.map(r => r === 'admin' ? '管理员' : r === 'doctor' ? '医生' : '普通用户').join(', ')}
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
                  切换账号
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
                          placeholder="输入密码"
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
                                <span>切换中...</span>
                              </>
                            ) : (
                              <span>确认</span>
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
                            取消
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
                          title="移除此账号"
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
                onClick={handleRestartTour}
                className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">重新观看引导</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出登录</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
