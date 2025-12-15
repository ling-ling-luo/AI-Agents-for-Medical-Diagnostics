import { Link, NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Upload,
  Plus,
  History,
  BarChart3,
  Settings,
  Stethoscope
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', label: '首页', icon: Home },
    { path: '/cases', label: '病例列表', icon: FileText },
    { path: '/import', label: '导入病例', icon: Upload },
    { path: '/cases/new', label: '新增病例', icon: Plus },
    { path: '/history', label: '诊断历史', icon: History },
    { path: '/analysis', label: '数据分析', icon: BarChart3 },
    { path: '/settings', label: '系统设置', icon: Settings },
  ];

  return (
    <div className="w-80 bg-gradient-to-b from-blue-800 to-blue-900 flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-8">
        <Link to="/dashboard" className="flex items-center gap-4 no-underline !text-white !opacity-100">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white !opacity-100">AI 诊断</h1>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-4 w-full px-4 py-5 text-lg font-medium transition-colors no-underline !text-white !opacity-100 rounded-xl mx-2 ${
                      isActive
                        ? 'bg-white/20'
                        : 'hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-6 h-6 text-white flex-shrink-0" />
                  <span className="text-lg text-white !opacity-100">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-6 text-sm text-white !opacity-100">
        <p>AI 医疗诊断系统</p>
        <p className="mt-2">v1.0.0</p>
      </div>
    </div>
  );
};