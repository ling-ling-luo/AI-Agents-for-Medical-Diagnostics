import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, X } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export const CaseSubNav = () => {
  const { t } = useTranslation();
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { openCases, removeOpenCase } = useNavigation();

  const handleRemoveCase = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    // 如果关闭的是当前正在查看的病例，导航回病例列表
    if (caseId && Number(caseId) === id) {
      navigate('/cases');
    }

    removeOpenCase(id);
  };

  if (openCases.length === 0) {
    return (
      <div className="pl-12 py-2 text-white/60 text-sm">
        {t('nav.noCases')}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {openCases.map((case_) => (
        <NavLink
          key={case_.id}
          to={`/cases/${case_.id}`}
          style={{ textDecoration: 'none' }}
          className={({ isActive }) =>
            `flex items-center gap-3 w-full pl-16 pr-2 py-3 text-base font-medium transition-colors rounded-xl group ${
              isActive || caseId === String(case_.id)
                ? 'bg-white/20 text-white !opacity-100'
                : 'text-white !opacity-90 hover:bg-white/10 hover:text-white hover:!opacity-100'
            }`
          }
        >
          <User className="w-4 h-4 flex-shrink-0 text-white !opacity-100" />
          <span className="text-base truncate flex-1 text-white !opacity-100">
            {case_.patient_name || `Case #${case_.patient_id}`}
          </span>
          <button
            onClick={(e) => handleRemoveCase(e, case_.id)}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
            title={t('nav.closeCase')}
          >
            <X className="w-3.5 h-3.5 text-white !opacity-100" />
          </button>
        </NavLink>
      ))}
    </div>
  );
};
