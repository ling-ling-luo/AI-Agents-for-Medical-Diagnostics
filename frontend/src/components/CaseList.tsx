import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Stethoscope, Activity, Filter, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Case } from '../types';
import { caseApi } from '../services/api';
import { useAuth } from '../context/useAuth';
import { Loading } from './Loading';
import { Dropdown } from './Dropdown';
import { DateRangeFilter } from './DateRangeFilter';
import '../styles/hide-scrollbar.css'; // 引入样式文件以隐藏数字输入框的箭头

const ITEMS_PER_PAGE = 9; // 每页显示9个病例

interface CaseListProps {
  embedded?: boolean; // 是否为嵌入模式（在标签页中使用）
}

export const CaseList = ({ embedded = false }: CaseListProps) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    patient_name: '',
    patient_id: '',
    chief_complaint: '',
    gender: '', // male/female
    diagnosed: '', // yes/no
    created_from: '', // YYYY-MM-DD
    created_to: '', // YYYY-MM-DD
    creator_username: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpToPage, setJumpToPage] = useState('');

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
      chief_complaint: '',
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
      setError('无法连接到服务器，请检查后端服务是否正常运行');
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
      setError(message || '删除失败，请重试');
      console.error('Error deleting case:', err);
    }
  };

  const handleImportClick = () => {
    navigate('/import');
  };

  const filteredCases = useMemo(() => {
    return cases.filter(case_ => {
      const patientNameOk = !filters.patient_name.trim()
        || (case_.patient_name || '').toLowerCase().includes(filters.patient_name.trim().toLowerCase());
      const patientIdOk = !filters.patient_id.trim()
        || (case_.patient_id || '').toLowerCase().includes(filters.patient_id.trim().toLowerCase());
      const chiefComplaintOk = !filters.chief_complaint.trim()
        || (case_.chief_complaint || '').toLowerCase().includes(filters.chief_complaint.trim().toLowerCase());

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
      return patientNameOk && patientIdOk && chiefComplaintOk && genderOk && diagnosedOk && createdFromOk && createdToOk && creatorOk;
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
  const creatorFilterLabel = hasRole('admin') ? '创建者：全部' : '创建者（只读）';

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
      chief_complaint: '',
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
      <div className={`${embedded ? 'py-8' : 'min-h-screen'} bg-${embedded ? 'transparent' : 'gray-50'} flex items-center justify-center`}>
        <Loading size="lg" text="正在加载病例数据..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${embedded ? 'py-8' : 'min-h-screen bg-gray-50'} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">连接失败</h3>
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
    <div className={embedded ? '' : 'min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white'}>
      {/* 顶部导航栏 - 非嵌入模式才显示 */}
      {!embedded && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          {/* 第一行：标题和操作按钮 */}
          <div className="container-custom py-4">
            <div className="flex items-center justify-between">
              {/* 左侧：标题 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">AI 医疗诊断系统</h1>
                  <p className="text-xs text-gray-500 mt-0.5">共 {cases.length} 个病例</p>
                </div>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImportClick}
                  className="px-5 py-2.5 bg-transparent hover:bg-gray-50 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-all whitespace-nowrap"
                >
                  导入病例
                </button>
                <button
                  onClick={() => navigate('/cases/new')}
                  className="px-5 py-2.5 bg-transparent hover:bg-gray-50 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-all whitespace-nowrap"
                >
                  新增病例
                </button>
              </div>
            </div>
          </div>

          {/* 第二行：筛选区域 - 全宽 */}
          <div className="w-full bg-gray-50 border-t border-gray-200">
            <div className="container-custom py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-700">筛选条件</span>
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
                    <span>清空</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <input
                  type="text"
                  placeholder="患者姓名"
                  value={filters.patient_name}
                  onChange={(e) => updateFilter('patient_name', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                />
                <input
                  type="text"
                  placeholder="病历号"
                  value={filters.patient_id}
                  onChange={(e) => updateFilter('patient_id', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                />
                <input
                  type="text"
                  placeholder="主诉"
                  value={filters.chief_complaint}
                  onChange={(e) => updateFilter('chief_complaint', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                />

                <select
                  value={filters.gender}
                  onChange={(e) => updateFilter('gender', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">性别：全部</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>

                <select
                  value={filters.diagnosed}
                  onChange={(e) => updateFilter('diagnosed', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">诊断状态：全部</option>
                  <option value="yes">已诊断</option>
                  <option value="no">未诊断</option>
                </select>

                {showCreatorFilter && (
                  <select
                    value={filters.creator_username}
                    onChange={(e) => updateFilter('creator_username', e.target.value)}
                    disabled={!hasRole('admin')}
                    className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <option value="">{creatorFilterLabel}</option>
                    {uniqueCreatorUsernames.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                )}

                {/* 日期范围筛选器 - 占两列 */}
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
        </header>
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
                    <span className="text-xs font-medium text-gray-700">筛选条件</span>
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
                      <span>清空</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  <input
                    type="text"
                    placeholder="患者姓名"
                    value={filters.patient_name}
                    onChange={(e) => updateFilter('patient_name', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="病历号"
                    value={filters.patient_id}
                    onChange={(e) => updateFilter('patient_id', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="主诉"
                    value={filters.chief_complaint}
                    onChange={(e) => updateFilter('chief_complaint', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  />

                  <select
                    value={filters.gender}
                    onChange={(e) => updateFilter('gender', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="">性别：全部</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>

                  <select
                    value={filters.diagnosed}
                    onChange={(e) => updateFilter('diagnosed', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="">诊断状态：全部</option>
                    <option value="yes">已诊断</option>
                    <option value="no">未诊断</option>
                  </select>

                  {showCreatorFilter && (
                    <select
                      value={filters.creator_username}
                      onChange={(e) => updateFilter('creator_username', e.target.value)}
                      disabled={!hasRole('admin')}
                      className="w-full px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <option value="">{creatorFilterLabel}</option>
                      {uniqueCreatorUsernames.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  )}

                  {/* 日期范围筛选器 - 占两列 */}
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
      )}

      <main className={`${embedded ? 'py-2' : 'container-custom py-8'} min-h-[calc(100vh-120px)] flex flex-col`}>
        {/* 病例列表 - 增强卡片质感 */}
        <div className="relative z-0 flex-1 flex flex-col">
          {filteredCases.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-700 mb-1.5">
                  {hasActiveFilters ? '未找到匹配的病例' : '暂无病例数据'}
                </h3>
                <p className="text-sm text-gray-500">
                  {hasActiveFilters ? '请调整筛选条件' : '请先导入医疗病历文件'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 病例网格容器 - 内容居中 */}
              <div className="flex-1 flex items-center justify-center py-4">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentCases.map((case_) => (
                <div
                  key={case_.id}
                  className="bg-white rounded-2xl border border-gray-200 transition-all duration-300 overflow-hidden group shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
                  onClick={(e) => {
                    // 检查点击事件是否来自下拉菜单或其子元素
                    if (!(e.target as HTMLElement).closest('.dropdown-container')) {
                      navigate(`/case/${case_.id}`);
                    }
                  }}
                >
                  {/* 病例头部 - 增强质感 */}
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
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
                        <h3 className="text-base font-semibold text-gray-800 truncate">
                          {case_.patient_name || `病例 #${case_.id}`}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-1.5">{case_.patient_id}</p>
                      </div>
                      {/* 更多操作菜单 */}
                      <div className="dropdown-container">
                        <Dropdown
                          options={[
                            {
                              label: '编辑资料',
                              icon: 'edit',
                              color: 'gray',
                              onClick: () => handleEditCase(case_.id),
                            },
                            {
                              label: '查看历史',
                              icon: 'clock',
                              color: 'gray',
                              onClick: () => handleViewHistory(case_.patient_id || ''),
                            },
                            {
                              label: '删除病历',
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
                  <div className="flex items-center gap-3 mb-5 text-sm text-gray-600 font-medium">
                    {case_.age && (
                      <span>
                        {case_.age} 岁
                      </span>
                    )}
                    {case_.age && case_.gender && (
                      <span className="text-gray-300">|</span>
                    )}
                    {case_.gender && (
                      <span>
                        {case_.gender === 'male' ? '男' : case_.gender === 'female' ? '女' : '其他'}
                      </span>
                    )}
                  </div>

                  {/* 主诉信息 - 严格矩形，严丝合缝 */}
                  {case_.chief_complaint && (
                    <div className="mb-0 p-4 bg-blue-50 rounded-none border-t border-b border-blue-100">
                      <p className="text-xs font-semibold text-gray-600 mb-2">主诉</p>
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
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-none rounded-b-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px]"
                  >
                    <Stethoscope className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">开始诊断</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
              </div>

          {/* 分页控件 - 移到底部 */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  共 {cases.length} 个病例 {hasActiveFilters && `· ${filteredCases.length} 个匹配`}
                </div>
                <div className="text-sm text-gray-500">
                  第 {currentPage} / {totalPages} 页
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {/* 上一页按钮 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">上一页</span>
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
                  <span className="text-sm font-medium">下一页</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* 页码跳转 */}
                <div className="flex items-center gap-1 ml-4 text-sm text-gray-600">
                  <span>跳至</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={jumpToPage || ''}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    onKeyPress={handleJumpInputKeyPress}
                    onFocus={() => setJumpToPage('')}
                    onBlur={() => {
                      if (jumpToPage) {
                        handleJumpToPage();
                      }
                    }}
                    placeholder={String(currentPage)}
                    className="w-12 text-center border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none bg-white transition-colors hide-spin-buttons text-gray-600"
                  />
                  <span>页</span>
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
