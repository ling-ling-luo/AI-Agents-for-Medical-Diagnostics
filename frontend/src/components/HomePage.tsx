import { useState, useEffect } from 'react';
import { Stethoscope, FileText, Upload, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CaseList } from './CaseList';
import { ImportWizard } from './ImportWizard';
import { CreateCaseForm } from './CreateCaseForm';
import { AccountSwitcher } from './AccountSwitcher';
import { OnboardingTour } from './OnboardingTour';

type TabType = 'list' | 'import' | 'create';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
  requiredPermission?: string;
}

const tabs: TabConfig[] = [
  { id: 'list', label: '病例列表', icon: FileText, requiredPermission: 'case:read' },
  { id: 'import', label: '导入病例', icon: Upload, requiredPermission: 'case:create' },
  { id: 'create', label: '新增病例', icon: Plus, requiredPermission: 'case:create' },
];

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const { hasPermission, user } = useAuth();
  const [runTour, setRunTour] = useState(false);

  // 检查是否需要显示首页引导
  useEffect(() => {
    if (user) {
      const hasSeenHomeTour = localStorage.getItem('onboarding_home_completed');
      if (!hasSeenHomeTour) {
        // 延迟 500ms 显示引导，确保页面元素已渲染
        const timer = setTimeout(() => {
          setRunTour(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  // 引导完成回调
  const handleTourComplete = () => {
    setRunTour(false);
    localStorage.setItem('onboarding_home_completed', 'true');
    // 标记需要在详情页显示引导
    localStorage.setItem('should_show_detail_tour', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            {/* Logo和标题 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">AI 医疗诊断系统</h1>
                <p className="text-xs text-gray-500 mt-0.5">智能化医疗病例分析平台</p>
              </div>
            </div>

            {/*账号切换器 */}
            <div className="account-switcher">
              <AccountSwitcher />
            </div>
          </div>
        </div>

        {/* 标签页导航区域 */}
        <div className="border-t border-gray-200">
          <div className="container-custom">
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => {
                // 检查权限
                const hasRequiredPermission = tab.requiredPermission ? hasPermission(tab.requiredPermission) : true;
                if (!hasRequiredPermission) return null;

                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`create-case-tab relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="container-custom case-list">
        {activeTab === 'list' && <CaseList embedded />}
        {activeTab === 'import' && (
          <ImportWizard
            embedded
            onComplete={() => setActiveTab('list')}
          />
        )}
        {activeTab === 'create' && <CreateCaseForm embedded />}
      </main>

      {/* 引导组件 */}
      <OnboardingTour run={runTour} onComplete={handleTourComplete} />
    </div>
  );
};
