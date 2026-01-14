/**
 * 数据分析页面 - 重构版
 * 包含概览、人口统计、趋势分析、模型对比、用户活动等功能
 *
 * 设计理念：
 * - 医疗行业配色：信任蓝 (#3B82F6) + 健康绿 (#10B981)
 * - Swiss Minimalism风格：清晰、专业、高可读性
 * - WCAG AAA无障碍标准
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  UserCheck,
  RefreshCw,
  Download,
  Cpu,
  Users,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Area,
  Line,
} from 'recharts';

import { analyticsApi } from '../services/api';
import { AnalyticsCard, ChartContainer, DateRangePicker } from '../components/analytics';
import type {
  OverviewData,
  DemographicsData,
  TrendsData,
  ModelComparisonData,
  UserActivityData,
  AnalyticsFilters,
  PerformanceData,
} from '../types/analytics';

// 医疗行业配色方案
const COLORS = {
  primary: '#3B82F6',      // 信任蓝
  secondary: '#8B5CF6',    // 紫色
  success: '#10B981',      // 健康绿
  warning: '#F59E0B',      // 警告黄
  danger: '#EF4444',       // 危险红
  info: '#06B6D4',         // 信息青
  muted: '#6B7280',        // 中性灰
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.secondary,
  COLORS.warning,
  COLORS.info,
  COLORS.danger,
];

// 标签页类型
type TabType = 'overview' | 'demographics' | 'trends' | 'models' | 'users';

// 性别翻译映射
const GENDER_MAP: Record<string, string> = {
  male: 'analytics.male',
  female: 'analytics.female',
};

// 翻译性别
const translateGender = (gender: string, t: (key: string) => string): string => {
  const key = GENDER_MAP[gender.toLowerCase()];
  return key ? t(key) : gender;
};

export const DataAnalysis = () => {
  const { t } = useTranslation();

  // 状态管理
  const [filters, setFilters] = useState<AnalyticsFilters>({
    granularity: 'day',
  });
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [selectedExportTabs, setSelectedExportTabs] = useState<TabType[]>(['overview']);
  const [isExporting, setIsExporting] = useState(false);

  // 数据状态
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [demographicsData, setDemographicsData] = useState<DemographicsData | null>(null);
  const [caseTrendsData, setCaseTrendsData] = useState<TrendsData | null>(null);
  const [diagnosisTrendsData, setDiagnosisTrendsData] = useState<TrendsData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [modelComparisonData, setModelComparisonData] = useState<ModelComparisonData | null>(null);
  const [userActivityData, setUserActivityData] = useState<UserActivityData | null>(null);

  // 加载状态
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingDemographics, setLoadingDemographics] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 错误状态
  const [errorOverview, setErrorOverview] = useState<string | null>(null);
  const [errorDemographics, setErrorDemographics] = useState<string | null>(null);
  const [errorTrends, setErrorTrends] = useState<string | null>(null);
  const [errorModels, setErrorModels] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  // 加载概览数据
  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setErrorOverview(null);
    try {
      const data = await analyticsApi.getOverview(filters);
      setOverviewData(data);
    } catch (error: any) {
      setErrorOverview(error.response?.data?.detail || t('analytics.loadError'));
    } finally {
      setLoadingOverview(false);
    }
  }, [filters, t]);

  // 加载人口统计数据
  const loadDemographics = useCallback(async () => {
    setLoadingDemographics(true);
    setErrorDemographics(null);
    try {
      const data = await analyticsApi.getDemographics(filters);
      setDemographicsData(data);
    } catch (error: any) {
      setErrorDemographics(error.response?.data?.detail || t('analytics.loadError'));
    } finally {
      setLoadingDemographics(false);
    }
  }, [filters, t]);

  // 加载趋势数据
  const loadTrends = useCallback(async () => {
    setLoadingTrends(true);
    setErrorTrends(null);
    try {
      const [caseTrends, diagnosisTrends, performance] = await Promise.all([
        analyticsApi.getCaseTrends(filters),
        analyticsApi.getDiagnosisTrends(filters),
        analyticsApi.getPerformance(filters),
      ]);
      setCaseTrendsData(caseTrends);
      setDiagnosisTrendsData(diagnosisTrends);
      setPerformanceData(performance);
    } catch (error: any) {
      setErrorTrends(error.response?.data?.detail || t('analytics.loadError'));
    } finally {
      setLoadingTrends(false);
    }
  }, [filters, t]);

  // 加载模型对比数据
  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    setErrorModels(null);
    try {
      const data = await analyticsApi.getModelComparison(filters);
      setModelComparisonData(data);
    } catch (error: any) {
      setErrorModels(error.response?.data?.detail || t('analytics.loadError'));
    } finally {
      setLoadingModels(false);
    }
  }, [filters, t]);

  // 加载用户活动数据
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const data = await analyticsApi.getUserActivity(filters);
      setUserActivityData(data);
    } catch (error: any) {
      setErrorUsers(error.response?.data?.detail || t('analytics.loadError'));
    } finally {
      setLoadingUsers(false);
    }
  }, [filters, t]);

  // 根据当前标签页加载数据
  const loadDataForTab = useCallback(async (tab: TabType) => {
    switch (tab) {
      case 'overview':
        await loadOverview();
        break;
      case 'demographics':
        await loadDemographics();
        break;
      case 'trends':
        await loadTrends();
        break;
      case 'models':
        await loadModels();
        break;
      case 'users':
        await loadUsers();
        break;
    }
  }, [loadOverview, loadDemographics, loadTrends, loadModels, loadUsers]);

  // 刷新当前数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDataForTab(activeTab);
    setIsRefreshing(false);
  };

  // 初始加载
  useEffect(() => {
    loadDataForTab(activeTab);
  }, [activeTab, filters, loadDataForTab]);

  // 日期范围变更处理
  const handleDateRangeChange = (startDate?: string, endDate?: string) => {
    setFilters(prev => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
    }));
  };

  // 时间粒度变更处理
  const handleGranularityChange = (granularity: 'day' | 'week' | 'month') => {
    setFilters(prev => ({ ...prev, granularity }));
  };

  // 打开导出弹窗
  const openExportModal = (format: 'pdf' | 'excel') => {
    setExportFormat(format);
    setSelectedExportTabs([activeTab]); // 默认选中当前标签页
    setShowExportModal(true);
  };

  // 切换导出页面选择
  const toggleExportTab = (tab: TabType) => {
    setSelectedExportTabs(prev => {
      if (prev.includes(tab)) {
        return prev.filter(t => t !== tab);
      } else {
        return [...prev, tab];
      }
    });
  };

  // 全选/取消全选
  const toggleAllExportTabs = () => {
    const allTabs: TabType[] = ['overview', 'demographics', 'trends', 'models', 'users'];
    if (selectedExportTabs.length === allTabs.length) {
      setSelectedExportTabs([]);
    } else {
      setSelectedExportTabs(allTabs);
    }
  };

  // 导出报告
  const handleExport = async () => {
    if (selectedExportTabs.length === 0) return;

    setIsExporting(true);
    try {
      const blob = await analyticsApi.exportReport(selectedExportTabs, exportFormat, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // 标签页配置
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: t('analytics.overview'), icon: BarChart3 },
    { id: 'demographics', label: t('analytics.demographics'), icon: Users },
    { id: 'trends', label: t('analytics.trends'), icon: Activity },
    { id: 'models', label: t('analytics.models'), icon: Cpu },
    { id: 'users', label: t('analytics.users'), icon: UserCheck },
  ];

  // 计算趋势百分比（示例：与默认对比）
  const calculateTrend = (current: number, baseline: number): { value: number; isPositive: boolean } | undefined => {
    if (baseline === 0) return undefined;
    const change = ((current - baseline) / baseline) * 100;
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
  };

  return (
    <div className="flex-1 bg-gray-50 p-8">
      {/* 页面标题和操作区 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('analytics.title')}
          </h1>

          {/* 操作按钮组 */}
          <div className="flex items-center space-x-3">
            {/* 刷新按钮 */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('analytics.refresh')}
            </button>

            {/* 导出下拉菜单 */}
            <div className="relative group">
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('analytics.export')}
              </button>
              <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="py-1">
                  <button
                    onClick={() => openExportModal('pdf')}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left cursor-pointer"
                  >
                    {t('analytics.exportPDF')}
                  </button>
                  <button
                    onClick={() => openExportModal('excel')}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left cursor-pointer"
                  >
                    {t('analytics.exportExcel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 日期范围选择器 */}
        <DateRangePicker
          startDate={filters.start_date}
          endDate={filters.end_date}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* 标签页导航 */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ==================== 概览标签页 ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 关键指标卡片 - 上排3个 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnalyticsCard
              title={t('analytics.totalCases')}
              value={loadingOverview ? '--' : overviewData?.total_cases || 0}
              icon={BarChart3}
              trend={overviewData ? calculateTrend(overviewData.total_cases, 100) : undefined}
              subtitle={errorOverview || undefined}
            />
            <AnalyticsCard
              title={t('analytics.totalDiagnoses')}
              value={loadingOverview ? '--' : overviewData?.total_diagnoses || 0}
              icon={Activity}
              trend={overviewData ? calculateTrend(overviewData.total_diagnoses, 80) : undefined}
              subtitle={errorOverview || undefined}
            />
            <AnalyticsCard
              title={t('analytics.activeUsers')}
              value={loadingOverview ? '--' : overviewData?.active_users || 0}
              icon={UserCheck}
              subtitle={errorOverview || undefined}
            />
          </div>

          {/* 关键指标卡片 - 下排2个 + 系统健康 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnalyticsCard
              title={t('analytics.avgExecutionTime')}
              value={
                loadingOverview
                  ? '--'
                  : overviewData
                  ? `${(overviewData.avg_execution_time_ms / 1000).toFixed(1)}s`
                  : '--'
              }
              icon={Clock}
              subtitle={errorOverview || undefined}
            />
            <AnalyticsCard
              title={t('analytics.completionRate')}
              value={
                loadingOverview
                  ? '--'
                  : overviewData
                  ? `${overviewData.completion_rate}%`
                  : '--'
              }
              icon={CheckCircle}
              subtitle={errorOverview || undefined}
            />
            {/* 系统健康状况 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
              <h3 className="text-base font-medium text-gray-700 mb-4">{t('analytics.systemHealth')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center bg-green-50 rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mb-1" />
                  <span className="text-xl font-bold text-green-700">
                    {overviewData?.completion_rate || 0}%
                  </span>
                  <span className="text-xs text-green-600">{t('analytics.completionRate')}</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-4">
                  <Clock className="w-6 h-6 text-blue-500 mb-1" />
                  <span className="text-xl font-bold text-blue-700">
                    {overviewData ? (overviewData.avg_execution_time_ms / 1000).toFixed(1) : 0}s
                  </span>
                  <span className="text-xs text-blue-600">{t('analytics.avgTime')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 人口统计标签页 ==================== */}
      {activeTab === 'demographics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 年龄分布 */}
            <ChartContainer
              title={t('analytics.ageDistribution')}
              loading={loadingDemographics}
              error={errorDemographics}
              isEmpty={!demographicsData?.age_distribution.length}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demographicsData?.age_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="age_group"
                    stroke="#6B7280"
                    tick={{ fill: '#374151', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    tick={{ fill: '#374151', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={false}
                    animationDuration={100}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="count"
                    fill={COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    name={t('analytics.caseCount')}
                    activeBar={{ fill: '#1D4ED8' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* 性别分布 */}
            <ChartContainer
              title={t('analytics.genderDistribution')}
              loading={loadingDemographics}
              error={errorDemographics}
              isEmpty={!demographicsData?.gender_distribution.length}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={demographicsData?.gender_distribution.map(d => ({
                      ...d,
                      name: translateGender(d.gender, t),
                      value: d.count
                    })) || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: '#9CA3AF' }}
                  >
                    {demographicsData?.gender_distribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    animationDuration={100}
                    animationEasing="ease-out"
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* 年龄-性别交叉分析 */}
          <ChartContainer
            title={t('analytics.ageGenderMatrix')}
            description={t('analytics.crossAnalysis')}
            loading={loadingDemographics}
            error={errorDemographics}
            isEmpty={!demographicsData?.age_gender_matrix?.length}
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={processAgeGenderData(demographicsData?.age_gender_matrix || [])}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis
                  type="category"
                  dataKey="age_group"
                  stroke="#6B7280"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  cursor={false}
                  animationDuration={100}
                  animationEasing="ease-out"
                />
                <Legend />
                <Bar dataKey="male" fill={COLORS.primary} name={t('analytics.male')} stackId="stack" activeBar={{ fill: '#1D4ED8' }} />
                <Bar dataKey="female" fill={COLORS.secondary} name={t('analytics.female')} stackId="stack" activeBar={{ fill: '#7C3AED' }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* ==================== 趋势分析标签页 ==================== */}
      {activeTab === 'trends' && (
        <div className="space-y-8">
          {/* 时间粒度选择器 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {t('analytics.granularity')}:
              </span>
              <div className="flex space-x-2">
                {(['day', 'week', 'month'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGranularityChange(g)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      filters.granularity === g
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t(`analytics.${g}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 病例与诊断趋势对比 */}
          <ChartContainer
            title={t('analytics.caseAndDiagnosisTrends')}
            description={t('analytics.trendsDescription')}
            loading={loadingTrends}
            error={errorTrends}
            isEmpty={!caseTrendsData?.series.length && !diagnosisTrendsData?.series.length}
          >
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={mergeTrendsData(caseTrendsData?.series || [], diagnosisTrendsData?.series || [])}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  tick={{ fill: '#374151', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#6B7280"
                  tick={{ fill: '#374151', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6B7280"
                  tick={{ fill: '#374151', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  animationDuration={100}
                  animationEasing="ease-out"
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="cases"
                  fill={`${COLORS.primary}20`}
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name={t('analytics.caseCount')}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="diagnoses"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={{ fill: COLORS.success, r: 4 }}
                  name={t('analytics.diagnosisCount')}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* 性能指标 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 执行时间统计 */}
            <ChartContainer
              title={t('analytics.executionTimeStats')}
              loading={loadingTrends}
              error={errorTrends}
              isEmpty={!performanceData}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('analytics.minTime')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceData ? (performanceData.execution_time_stats.min / 1000).toFixed(2) : '--'}s
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('analytics.maxTime')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceData ? (performanceData.execution_time_stats.max / 1000).toFixed(2) : '--'}s
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">{t('analytics.avgTime')}</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {performanceData ? (performanceData.execution_time_stats.avg / 1000).toFixed(2) : '--'}s
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-green-600 uppercase tracking-wide mb-1">{t('analytics.medianTime')}</p>
                  <p className="text-2xl font-bold text-green-700">
                    {performanceData ? (performanceData.execution_time_stats.median / 1000).toFixed(2) : '--'}s
                  </p>
                </div>
              </div>
            </ChartContainer>

            {/* 诊断统计 */}
            <ChartContainer
              title={t('analytics.diagnosisStats')}
              loading={loadingTrends}
              error={errorTrends}
              isEmpty={!performanceData}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {performanceData?.total_diagnoses || 0}
                  </p>
                  <p className="text-sm text-gray-500">{t('analytics.totalDiagnoses')}</p>
                </div>
              </div>
            </ChartContainer>
          </div>
        </div>
      )}

      {/* ==================== 模型对比标签页 ==================== */}
      {activeTab === 'models' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 模型使用频率饼图 */}
            <ChartContainer
              title={t('analytics.modelUsageFrequency')}
              loading={loadingModels}
              error={errorModels}
              isEmpty={!modelComparisonData?.models.length}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={modelComparisonData?.models.map(d => ({ ...d, name: d.model_name, value: d.usage_count })) || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: '#9CA3AF' }}
                  >
                    {modelComparisonData?.models.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    animationDuration={100}
                    animationEasing="ease-out"
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* 模型性能对比柱状图 */}
            <ChartContainer
              title={t('analytics.modelPerformanceComparison')}
              loading={loadingModels}
              error={errorModels}
              isEmpty={!modelComparisonData?.models.length}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelComparisonData?.models || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="model_name"
                    stroke="#6B7280"
                    tick={{ fill: '#374151', fontSize: 11 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#6B7280"
                    tick={{ fill: '#374151', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}s`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    cursor={false}
                    animationDuration={100}
                    animationEasing="ease-out"
                    formatter={(value: number | undefined) => value !== undefined ? [`${(value / 1000).toFixed(2)}s`, t('analytics.avgExecutionTime')] : ['--', t('analytics.avgExecutionTime')]}
                  />
                  <Bar
                    dataKey="avg_execution_time_ms"
                    fill={COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    name={t('analytics.avgExecutionTime')}
                    activeBar={{ fill: '#1D4ED8' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* 模型详细对比表格 */}
          <ChartContainer
            title={t('analytics.modelDetailComparison')}
            loading={loadingModels}
            error={errorModels}
            isEmpty={!modelComparisonData?.models.length}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.modelName')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.usageCount')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.avgExecutionTime')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.usagePercentage')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modelComparisonData?.models.map((model, index) => {
                    const totalUsage = modelComparisonData.models.reduce((sum, m) => sum + m.usage_count, 0);
                    const percentage = totalUsage > 0 ? ((model.usage_count / totalUsage) * 100).toFixed(1) : '0';
                    return (
                      <tr key={model.model_name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-gray-900">{model.model_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {model.usage_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {(model.avg_execution_time_ms / 1000).toFixed(2)}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartContainer>
        </div>
      )}

      {/* ==================== 用户活动标签页 ==================== */}
      {activeTab === 'users' && (
        <div className="space-y-8">
          {/* 用户活动排行榜 */}
          <ChartContainer
            title={t('analytics.topActiveUsers')}
            description={t('analytics.userActivityDescription')}
            loading={loadingUsers}
            error={errorUsers}
            isEmpty={!userActivityData?.top_creators?.length}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.rank')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.user')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.caseCount')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.diagnosisCount')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('analytics.activityScore')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userActivityData?.top_creators?.map((user, index) => {
                    const activityScore = user.case_count + user.diagnosis_count * 2;
                    return (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.full_name || user.username}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {user.case_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {user.diagnosis_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {activityScore}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartContainer>

          {/* 用户活动图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 病例数分布 */}
            <ChartContainer
              title={t('analytics.caseCountByUser')}
              loading={loadingUsers}
              error={errorUsers}
              isEmpty={!userActivityData?.top_creators?.length}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={userActivityData?.top_creators?.slice(0, 10) || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" />
                  <YAxis
                    type="category"
                    dataKey="username"
                    stroke="#6B7280"
                    width={100}
                    tick={{ fill: '#374151', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    cursor={false}
                    animationDuration={100}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="case_count"
                    fill={COLORS.primary}
                    radius={[0, 4, 4, 0]}
                    name={t('analytics.caseCount')}
                    activeBar={{ fill: '#1D4ED8' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* 诊断数分布 */}
            <ChartContainer
              title={t('analytics.diagnosisCountByUser')}
              loading={loadingUsers}
              error={errorUsers}
              isEmpty={!userActivityData?.top_creators?.length}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={userActivityData?.top_creators?.slice(0, 10) || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" />
                  <YAxis
                    type="category"
                    dataKey="username"
                    stroke="#6B7280"
                    width={100}
                    tick={{ fill: '#374151', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    cursor={false}
                    animationDuration={100}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="diagnosis_count"
                    fill={COLORS.success}
                    radius={[0, 4, 4, 0]}
                    name={t('analytics.diagnosisCount')}
                    activeBar={{ fill: '#059669' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      )}

      {/* 导出弹窗 */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('analytics.exportReport')} ({exportFormat.toUpperCase()})
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                {t('analytics.selectExportPages')}
              </p>

              {/* 全选 */}
              <label className="flex items-center mb-3 pb-3 border-b border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedExportTabs.length === 5}
                  onChange={toggleAllExportTabs}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {t('analytics.selectAll')}
                </span>
              </label>

              {/* 页面选择列表 */}
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <label
                      key={tab.id}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExportTabs.includes(tab.id)}
                        onChange={() => toggleExportTab(tab.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Icon className="w-4 h-4 ml-3 text-gray-500" />
                      <span className="ml-2 text-sm text-gray-700">{tab.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleExport}
                disabled={selectedExportTabs.length === 0 || isExporting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isExporting ? t('analytics.exporting') : t('analytics.exportSelected')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 辅助函数：处理年龄-性别交叉数据
function processAgeGenderData(matrix: [string, string, number][]): { age_group: string; male: number; female: number }[] {
  const grouped: Record<string, { male: number; female: number }> = {};

  matrix.forEach(([ageGroup, gender, count]) => {
    if (!grouped[ageGroup]) {
      grouped[ageGroup] = { male: 0, female: 0 };
    }
    const key = gender.toLowerCase() as 'male' | 'female';
    if (key in grouped[ageGroup]) {
      grouped[ageGroup][key] = count;
    }
  });

  return Object.entries(grouped).map(([age_group, data]) => ({
    age_group,
    ...data,
  }));
}

// 辅助函数：合并病例和诊断趋势数据
function mergeTrendsData(
  caseTrends: { date: string; count: number }[],
  diagnosisTrends: { date: string; count: number }[]
): { date: string; cases: number; diagnoses: number }[] {
  const merged: Record<string, { cases: number; diagnoses: number }> = {};

  caseTrends.forEach(({ date, count }) => {
    if (!merged[date]) {
      merged[date] = { cases: 0, diagnoses: 0 };
    }
    merged[date].cases = count;
  });

  diagnosisTrends.forEach(({ date, count }) => {
    if (!merged[date]) {
      merged[date] = { cases: 0, diagnoses: 0 };
    }
    merged[date].diagnoses = count;
  });

  return Object.entries(merged)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
