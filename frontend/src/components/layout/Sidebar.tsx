import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: Home, end: true },
    { path: '/cases', label: t('nav.cases'), icon: FileText, end: true },
    { path: '/import', label: t('nav.import'), icon: Upload, end: true },
    { path: '/cases/new', label: t('nav.createCase'), icon: Plus, end: true },
    { path: '/diagnoses', label: t('nav.diagnoses'), icon: History, end: true },
    { path: '/analysis', label: t('nav.analysis'), icon: BarChart3, end: true },
    { path: '/settings', label: t('nav.settings'), icon: Settings, end: true },
  ];

  return (
    <div className="w-80 bg-gradient-to-b from-blue-800 to-blue-900 flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-8">
        <Link to="/dashboard" style={{ textDecoration: 'none' }} className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">{t('app.name')}</h1>
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
                  end={item.end}
                  style={{ textDecoration: 'none' }}
                  className={({ isActive }) =>
                    `flex items-center gap-4 w-full px-4 py-5 text-lg font-medium transition-colors rounded-xl ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white hover:bg-white/10'
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
        <p>{t('app.fullName')}</p>
        <p className="mt-2">{t('app.version')}</p>
      </div>
    </div>
  );
};