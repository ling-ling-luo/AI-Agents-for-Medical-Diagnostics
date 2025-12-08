import { useState } from 'react';
import { Stethoscope, FileText, Upload, Plus } from 'lucide-react';
import { CaseList } from './CaseList';
import { ImportWizard } from './ImportWizard';
import { CreateCaseForm } from './CreateCaseForm';

type TabType = 'list' | 'import' | 'create';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { id: 'list', label: '病例列表', icon: FileText },
  { id: 'import', label: '导入病例', icon: Upload },
  { id: 'create', label: '新增病例', icon: Plus },
];

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">AI 医疗诊断系统</h1>
              <p className="text-xs text-gray-500 mt-0.5">智能化医疗病例分析平台</p>
            </div>
          </div>
        </div>

        {/* 标签页导航区域 */}
        <div className="border-t border-gray-200">
          <div className="container-custom">
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
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
      <main className="container-custom">
        {activeTab === 'list' && <CaseList embedded />}
        {activeTab === 'import' && (
          <ImportWizard
            embedded
            onComplete={() => setActiveTab('list')}
          />
        )}
        {activeTab === 'create' && <CreateCaseForm embedded />}
      </main>
    </div>
  );
};
