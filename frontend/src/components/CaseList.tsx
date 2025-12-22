import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, User, Stethoscope, Activity, Filter, RefreshCw, ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react';
import type { Case } from '../types';
import { caseApi } from '../services/api';
import { useAuth } from '../context/useAuth';
import { Loading } from './Loading';
import { Dropdown } from './Dropdown';
import { DateRangeFilter } from './DateRangeFilter';
import '../styles/hide-scrollbar.css'; // 引入样式文件以隐藏数字输入框的箭头

const ITEMS_PER_PAGE = 6; // 每页显示6个病例（2行×3列）

interface CaseListProps {
  embedded?: boolean; // 是否为嵌入模式（在标签页中使用）
}

export const CaseList = ({ embedded = false }: CaseListProps) => {
  const { t } = useTranslation();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    patient_name: '',
    patient_id: '',
    gender: '', // male/female
    diagnosed: '', // yes/no
    created_from: '', // YYYY-MM-DD
    created_to: '', // YYYY-MM-DD
    creator_username: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpToPage, setJumpToPage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const hasActiveFilters = Object.values(filters).some(v => v.trim() !== '');
  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const navigate = useNavigate();
  const { token, hasRole } = useAuth();

  // 账号切换后 token 变化时，自动重新拉取病例列表
  useEffect(() => {
    loadCases();
    setFilters({
      patient_name: '',
      patient_id: '',
      gender: '',
      diagnosed: '',
      created_from: '',
      created_to: '',
      creator_username: '',
    });
  }, [token]);

  // 首次进入页面时会执行一次 loadCases()（token effect 已覆盖初次加载）

  const loadCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await caseApi.getCases();
      setCases(data);
    } catch (err) {
      setError(t('caseList.loadError'));
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCase = (caseId: number) => {
    navigate(`/edit/${caseId}`);
  };

  const handleViewHistory = (patientId: string) => {
    // 跳转到全局诊断历史页面，并自动筛选该病例
    navigate(`/diagnoses?patient_id=${encodeURIComponent(patientId)}`);
  };

  const handleDeleteCase = async (caseId: number) => {
    try {
      setError(null);
      await caseApi.deleteCase(caseId);

      // 删除成功后从列表中移除该病例
      setCases(prevCases => prevCases.filter(c => c.id !== caseId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || t('caseList.deleteFailed'));
      console.error('Error deleting case:', err);
    }
  };


  const filteredCases = useMemo(() => {
    return cases.filter(case_ => {
      const patientNameOk = !filters.patient_name.trim()
        || (case_.patient_name || '').toLowerCase().includes(filters.patient_name.trim().toLowerCase());
      const patientIdOk = !filters.patient_id.trim()
        || (case_.patient_id || '').toLowerCase().includes(filters.patient_id.trim().toLowerCase());

      const genderOk = !filters.gender.trim() || (case_.gender || '') === filters.gender;

      const diagnosedFlag = (case_.has_diagnosis ?? ((case_.diagnosis_count ?? 0) > 0));
      const diagnosedOk = !filters.diagnosed.trim()
        || (filters.diagnosed === 'yes' ? diagnosedFlag : !diagnosedFlag);

      const createdAtMs = case_.created_at ? Date.parse(case_.created_at) : NaN;
      const fromMs = filters.created_from ? Date.parse(`${filters.created_from}T00:00:00`) : NaN;
      const toMs = filters.created_to ? Date.parse(`${filters.created_to}T23:59:59.999`) : NaN;
      const createdFromOk = !filters.created_from.trim() || (!Number.isNaN(createdAtMs) && createdAtMs >= fromMs);
      const createdToOk = !filters.created_to.trim() || (!Number.isNaN(createdAtMs) && createdAtMs <= toMs);

      const creatorOk = !filters.creator_username.trim()
        || (case_.creator?.username || '').toLowerCase().includes(filters.creator_username.trim().toLowerCase());

      // AND 联合筛选：所有非空筛选项都需要同时满足
      return patientNameOk && patientIdOk && genderOk && diagnosedOk && createdFromOk && createdToOk && creatorOk;
    });
  }, [cases, filters]);

  // 计算分页
  const totalPages = useMemo(
    () => Math.ceil(filteredCases.length / ITEMS_PER_PAGE),
    [filteredCases.length]
  );
  const startIndex = useMemo(() => (currentPage - 1) * ITEMS_PER_PAGE, [currentPage]);
  const currentCases = useMemo(
    () => filteredCases.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [filteredCases, startIndex]
  );

  // 当筛选条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const showCreatorFilter = hasRole('admin') || hasRole('doctor');
  const creatorFilterLabel = hasRole('admin') ? t('caseList.creatorAll') : t('caseList.creatorReadonly');

  const uniqueCreatorUsernames = useMemo(() => {
    return Array.from(
      new Set(
        cases
          .map(c => c.creator?.username)
          .filter((v): v is string => !!v)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [cases]);

  const clearFilters = () => {
    setFilters({
      patient_name: '',
      patient_id: '',
      gender: '',
      diagnosed: '',
      created_from: '',
      created_to: '',
      creator_username: '',
    });
  };

  // 翻页函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 跳转到指定页码
  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setJumpToPage('');
    }
  };

  // 处理输入框回车
  const handleJumpInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  if (loading) {
    return (
      <div className={`${embedded ? 'py-8' : 'flex-1 bg-gray-50'} flex items-center justify-center`}>
        <Loading size="lg" text={t('caseList.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${embedded ? 'py-8' : 'flex-1 bg-gray-50'} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('caseList.connectionFailed')}</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadCases}
            className="btn-primary inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'flex-1 bg-gray-50'}>
      <main className={`${embedded ? 'py-2' : 'container-custom py-3'} min-h-[calc(100vh-120px)] flex flex-col`}>
        {/* 筛选区域 - 非嵌入模式 */}
        {!embedded && (
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4 shadow-sm">
            {/* 第一行：患者姓名、病历号、创建日期 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 mb-4">
              {/* 患者姓名 */}
              <div className="flex items-center gap-2">
                <label className="text-base text-gray-700 font-medium w-32 text-right flex-shrink-0 whitespace-nowrap">
                  {t('caseList.patientName')}：
                </label>
                <input
                  type="text"
                  placeholder={t('caseList.inputName')}
                  value={filters.patient_name}
                  onChange={(e) => updateFilter('patient_name', e.target.value)}
                  className="w-40 px-3 py-2 text-sm border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {/* 病历号 */}
              <div className="flex items-center gap-2 -ml-10">
                <label className="text-base text-gray-700 font-medium w-32 text-right flex-shrink-0 whitespace-nowrap">
                  {t('caseList.patientId')}：
                </label>
                <input
                  type="text"
                  placeholder={t('caseList.inputPatientId')}
                  value={filters.patient_id}
                  onChange={(e) => updateFilter('patient_id', e.target.value)}
                  className="w-40 px-3 py-2 text-sm border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {/* 创建日期 */}
              <div className="flex items-center gap-2 -ml-16">
                <label className="text-base text-gray-700 font-medium w-32 text-right flex-shrink-0 flex items-center justify-end gap-1.5 whitespace-nowrap">
                  <div className="relative">
                    <HelpCircle
                      className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    />
                    {showTooltip && (
                      <div className="absolute right-0 top-6 z-50 w-80 p-3 bg-gray-800 text-white text-xs rounded shadow-lg">
                        <div className="space-y-2 text-left">
                          <p className="font-semibold">{t('caseList.dateFilterHelp')}</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>{t('caseList.dateFilterTip1')}</li>
                            <li>{t('caseList.dateFilterTip2')}</li>
                            <li>{t('caseList.dateFilterTip3')}</li>
                            <li>{t('caseList.dateFilterTip4')}</li>
                          </ul>
                        </div>
                        {/* 小三角箭头 */}
                        <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                      </div>
                    )}
                  </div>
                  {t('caseList.createdDate')}：
                </label>
                <div className="w-72">
                  <DateRangeFilter
                    value={{ from: filters.created_from, to: filters.created_to }}
                    onChange={(range) => {
                      setFilters(prev => ({
                        ...prev,
                        created_from: range.from,
                        created_to: range.to,
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 第二行：性别、诊断状态、创建者、重置按钮 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              {/* 性别 */}
              <div className="flex items-center gap-2">
                <label className="text-base text-gray-700 font-medium w-32 text-right flex-shrink-0 whitespace-nowrap">
                  {t('caseList.gender')}：
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => updateFilter('gender', e.target.value)}
                  className="w-40 px-3 py-2 text-sm border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                >
                  <option value="">{t('caseList.all')}</option>
                  <option value="male">{t('caseList.male')}</option>
                  <option value="female">{t('caseList.female')}</option>
                </select>
              </div>

              {/* 诊断状态 */}
              <div className="flex items-center gap-2 -ml-10">
                <label className="text-base text-gray-700 font-medium w-32 text-right flex-shrink-0 whitespace-nowrap">
                  {t('caseList.diagnosedStatus')}：
                </label>
                <select
                  value={filters.diagnosed}
                  onChange={(e) => updateFilter('diagnosed', e.target.value)}
                  className="w-40 px-3 py-2 text-sm border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                >
                  <option value="">{t('caseList.all')}</option>
                  <option value="yes">{t('caseList.diagnosed')}</option>
                  <option value="no">{t('caseList.notDiagnosed')}</option>
                </select>
              </div>

              {/* 创建者 + 重置按钮 */}
              <div className="flex items-center gap-2 -ml-16">
                {showCreatorFilter ? (
                  <>
                    <label className="text-base text-gray-700 font-medium w-32 text-right flex-shrink-0 whitespace-nowrap">
                      {t('caseList.creator')}：
                    </label>
                    <select
                      value={filters.creator_username}
                      onChange={(e) => updateFilter('creator_username', e.target.value)}
                      disabled={!hasRole('admin')}
                      className="w-40 px-3 py-2 text-sm border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                    >
                      <option value="">{creatorFilterLabel}</option>
                      {uniqueCreatorUsernames.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <div className="flex-1"></div>
                    {/* 重置按钮 - 右对齐 */}
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-5 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 font-medium transition-all whitespace-nowrap flex-shrink-0"
                    >
                      {t('caseList.reset')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-32 flex-shrink-0"></div>
                    <div className="flex-1"></div>
                    {/* 重置按钮 - 右对齐 */}
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-5 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500 font-medium transition-all whitespace-nowrap flex-shrink-0"
                    >
                      {t('caseList.reset')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}


      {/* 嵌入模式的筛选栏 - 简洁扁平设计 */}
      {embedded && (
        <div className="pt-8 pb-6">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-6xl">
              <div className="bg-gray-50 border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-700">{t('caseList.filterTitle')}</span>
                    {hasActiveFilters && (
                      <span className="text-xs text-blue-600">({filteredCases.length} 条匹配)</span>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                      <span>{t('caseList.clearFilters')}</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                  {/* 患者姓名 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-700 whitespace-nowrap font-medium">
                      {t('caseList.patientName')}：
                    </label>
                    <input
                      type="text"
                      placeholder={t('caseList.inputName')}
                      value={filters.patient_name}
                      onChange={(e) => updateFilter('patient_name', e.target.value)}
                      className="w-28 px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    />
                  </div>

                  {/* 病历号 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-700 whitespace-nowrap font-medium">
                      {t('caseList.patientId')}：
                    </label>
                    <input
                      type="text"
                      placeholder={t('caseList.inputPatientId')}
                      value={filters.patient_id}
                      onChange={(e) => updateFilter('patient_id', e.target.value)}
                      className="w-28 px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    />
                  </div>

                  {/* 性别 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-700 whitespace-nowrap font-medium">
                      {t('caseList.gender')}：
                    </label>
                    <select
                      value={filters.gender}
                      onChange={(e) => updateFilter('gender', e.target.value)}
                      className="w-28 px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    >
                      <option value="">{t('caseList.all')}</option>
                      <option value="male">{t('caseList.male')}</option>
                      <option value="female">{t('caseList.female')}</option>
                    </select>
                  </div>

                  {/* 诊断状态 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-700 whitespace-nowrap font-medium">
                      {t('caseList.diagnosedStatus')}：
                    </label>
                    <select
                      value={filters.diagnosed}
                      onChange={(e) => updateFilter('diagnosed', e.target.value)}
                      className="w-28 px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    >
                      <option value="">{t('caseList.all')}</option>
                      <option value="yes">{t('caseList.diagnosed')}</option>
                      <option value="no">{t('caseList.notDiagnosed')}</option>
                    </select>
                  </div>

                  {/* 创建者 */}
                  {showCreatorFilter && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-700 whitespace-nowrap font-medium">
                        {t('caseList.creator')}：
                      </label>
                      <select
                        value={filters.creator_username}
                        onChange={(e) => updateFilter('creator_username', e.target.value)}
                        disabled={!hasRole('admin')}
                        className="w-28 px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                      >
                        <option value="">{creatorFilterLabel}</option>
                        {uniqueCreatorUsernames.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 日期范围筛选器 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-700 whitespace-nowrap font-medium">
                      {t('caseList.createdDate')}：
                    </label>
                    <div className="w-44">
                      <DateRangeFilter
                        value={{ from: filters.created_from, to: filters.created_to }}
                        onChange={(range) => {
                          setFilters(prev => ({
                            ...prev,
                            created_from: range.from,
                            created_to: range.to,
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* 病例列表 - 增强卡片质感 */}
        <div className="relative z-0 flex-1 flex flex-col">
          {filteredCases.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-700 mb-1.5">
                  {hasActiveFilters ? t('caseList.noMatches') : t('caseList.noCases')}
                </h3>
                <p className="text-sm text-gray-500">
                  {hasActiveFilters ? t('caseList.adjustFilters') : t('caseList.pleaseImport')}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 病例网格容器 - 内容居中 */}
              <div className="flex-1 flex items-center justify-center py-1">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentCases.map((case_) => (
                <div
                  key={case_.id}
                  className="bg-white rounded-md border border-gray-200 transition-all duration-200 overflow-hidden group shadow hover:shadow-md hover:-translate-y-0.5 transform"
                  onClick={(e) => {
                    // 检查点击事件是否来自下拉菜单或其子元素
                    if (!(e.target as HTMLElement).closest('.dropdown-container')) {
                      navigate(`/case/${case_.id}`);
                    }
                  }}
                >
                  {/* 病例头部 - 增强质感 */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        {case_.gender === 'male' ? (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        ) : case_.gender === 'female' ? (
                          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-pink-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 truncate">
                          {case_.patient_name || `病例 #${case_.id}`}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-1">{case_.patient_id}</p>
                      </div>
                      {/* 更多操作菜单 */}
                      <div className="dropdown-container">
                        <Dropdown
                          options={[
                            {
                              label: t('caseList.editProfile'),
                              icon: 'edit',
                              color: 'gray',
                              onClick: () => handleEditCase(case_.id),
                            },
                            {
                              label: t('caseList.viewHistory'),
                              icon: 'clock',
                              color: 'gray',
                              onClick: () => handleViewHistory(case_.patient_id || ''),
                            },
                            {
                              label: t('caseList.deleteCase'),
                              icon: 'trash',
                              color: 'red',
                              onClick: () => handleDeleteCase(case_.id),
                              needsConfirmation: true,
                            },
                          ]}
                        />
                      </div>
                    </div>

                  {/* 患者信息标签 - 纯文字 */}
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 font-medium">
                    {case_.age && (
                      <span>
                        {case_.age} {t('caseList.age')}
                      </span>
                    )}
                    {case_.age && case_.gender && (
                      <span className="text-gray-300">|</span>
                    )}
                    {case_.gender && (
                      <span>
                        {case_.gender === 'male' ? t('caseList.male') : case_.gender === 'female' ? t('caseList.female') : t('caseList.other')}
                      </span>
                    )}
                  </div>

                  {/* 主诉信息 - 严格矩形，严丝合缝 */}
                  {case_.chief_complaint && (
                    <div className="mb-0 p-3 bg-blue-50 rounded-none border-t border-b border-blue-100">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{t('caseList.chiefComplaint')}</p>
                      <p className="text-xs text-gray-700 leading-relaxed truncate">
                        {case_.chief_complaint}
                      </p>
                    </div>
                  )}

                  {/* 诊断按钮 - 严格矩形，严丝合缝 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止事件冒泡到卡片容器
                      navigate(`/case/${case_.id}?autoDiagnose=true`);
                    }}
                    className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-none rounded-b-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Stethoscope className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t('caseList.startDiagnosis')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
              </div>

          {/* 分页控件 - 移到底部 */}
          {totalPages > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between gap-4">
                {/* 左侧：病例总数 */}
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {t('caseList.totalCases', { count: cases.length })} {hasActiveFilters && `· ${t('caseList.matchedCases', { count: filteredCases.length })}`}
                </div>

                {/* 中间：分页控件 */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* 上一页按钮 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('caseList.prevPage')}</span>
                  </button>

                  {/* 页码按钮 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // 显示逻辑：始终显示第1页、最后1页、当前页及其前后各1页
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      // 显示省略号
                      const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                      const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[32px] h-8 text-sm font-medium transition-all ${
                            currentPage === page
                              ? 'text-blue-700 font-bold'
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* 下一页按钮 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  >
                    <span className="text-sm font-medium">{t('caseList.nextPage')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* 页码跳转 */}
                  <div className="flex items-center gap-1 ml-4 text-sm text-gray-600">
                    <span>{t('caseList.jumpTo')}</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={jumpToPage || ''}
                      onChange={(e) => setJumpToPage(e.target.value)}
                      onKeyDown={handleJumpInputKeyPress}
                      onFocus={() => setJumpToPage('')}
                      onBlur={() => {
                        if (jumpToPage) {
                          handleJumpToPage();
                        }
                      }}
                      placeholder={String(currentPage)}
                      className="w-12 text-center border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none bg-white transition-colors hide-spin-buttons text-gray-600"
                    />
                    <span>{t('caseList.page')}</span>
                  </div>
                </div>

                {/* 右侧：页码信息 */}
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {t('caseList.pageInfo', { current: currentPage, total: totalPages })}
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>

    </main>
    </div>
  );
};
