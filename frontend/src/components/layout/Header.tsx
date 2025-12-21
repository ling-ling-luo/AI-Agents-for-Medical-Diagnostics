import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AccountSwitcher } from '../AccountSwitcher';
import { LanguageSwitcher } from '../LanguageSwitcher';

export const Header = () => {
  const location = useLocation();
  const { t } = useTranslation();

  // Map routes to breadcrumb labels
  const breadcrumbMap: Record<string, string> = {
    '/': t('breadcrumb.home'),
    '/dashboard': t('breadcrumb.dashboard'),
    '/cases': t('breadcrumb.cases'),
    '/cases/new': t('breadcrumb.casesNew'),
    '/import': t('breadcrumb.import'),
    '/history': t('breadcrumb.history'),
    '/analysis': t('breadcrumb.analysis'),
    '/settings': t('breadcrumb.settings'),
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const currentPath = location.pathname;
    const breadcrumbs = [];

    // Always start with home
    breadcrumbs.push({ path: '/', label: t('breadcrumb.home') });

    // If current path has a mapping, use it directly (avoid intermediate paths)
    if (currentPath !== '/' && breadcrumbMap[currentPath]) {
      breadcrumbs.push({ path: currentPath, label: breadcrumbMap[currentPath] });
    } else {
      // For unmapped paths (like /case/123), build breadcrumbs normally
      const pathnames = currentPath.split('/').filter(x => x);
      let accumulatedPath = '';
      for (let i = 0; i < pathnames.length; i++) {
        accumulatedPath += `/${pathnames[i]}`;
        const label = breadcrumbMap[accumulatedPath] || pathnames[i];
        breadcrumbs.push({ path: accumulatedPath, label });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
      <div className="flex-1 flex items-center">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-300">/</span>
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              ) : (
                <a
                  href={crumb.path}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {crumb.label}
                </a>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Account Switcher */}
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <AccountSwitcher />
      </div>
    </header>
  );
};