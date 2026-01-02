/**
 * 数据分析页面
 * 包含概览、人口统计、趋势分析等功能
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Users,
  Activity,
  Clock,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { analyticsApi } from '../services/api';
import { AnalyticsCard, ChartContainer, DateRangePicker } from '../components/analytics';
import type {
  OverviewData,
  DemographicsData,
  TrendsData,
  AnalyticsFilters
} from '../types/analytics';

// 图表颜色方案
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export const DataAnalysis = () => {
  const { t } = useTranslation();

  // 状态管理
  const [filters, setFilters] = useState<AnalyticsFilters>({
    granularity: 'day',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'demographics' | 'trends'>('overview');

  // 数据状态
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [demographicsData, setDemographicsData] = useState<DemographicsData | null>(null);
  const [caseTrendsData, setCaseTrendsData] = useState<TrendsData | null>(null);
  const [diagnosisTrendsData, setDiagnosisTrendsData] = useState<TrendsData | null>(null);

  // 加载状态
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingDemographics, setLoadingDemographics] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // 错误状态
  const [errorOverview, setErrorOverview] = useState<string | null>(null);
  const [errorDemographics, setErrorDemographics] = useState<string | null>(null);
  const [errorTrends, setErrorTrends] = useState<string | null>(null);

  // 加载概览数据
  const loadOverview = async () => {
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
  };

  // 加载人口统计数据
  const loadDemographics = async () => {
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
  };

  // 加载趋势数据
  const loadTrends = async () => {
    setLoadingTrends(true);
    setErrorTrends(null);
    try {
      const [caseTrends, diagnosisTrends] = await Promise.all([
        analyticsApi.getCaseTrends(filters),
        analyticsApi.getDiagnosisTrends(filters),
      ]);
      setCaseTrendsData(caseTrends);
      setDiagnosisTrendsData(diagnosisTrends);
    } catch (error: any) {
      setErrorTrends(error.response?.data?.detail || t('analytics.loadError'));
    } finally {
      setLoadingTrends(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadOverview();
    loadDemographics();
    loadTrends();
  }, [filters]);

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

  return (
    <div className="flex-1 bg-gray-50 p-8">
      {/* 页面标题和筛选器 */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {t('analytics.title')}
        </h1>

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
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('analytics.overview')}
          </button>
          <button
            onClick={() => setActiveTab('demographics')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'demographics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('analytics.demographics')}
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('analytics.trends')}
          </button>
        </nav>
      </div>

      {/* 概览标签页 */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 关键指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnalyticsCard
              title={t('analytics.totalCases')}
              value={loadingOverview ? '--' : overviewData?.total_cases || 0}
              icon={BarChart3}
              subtitle={errorOverview || undefined}
            />
            <AnalyticsCard
              title={t('analytics.totalDiagnoses')}
              value={loadingOverview ? '--' : overviewData?.total_diagnoses || 0}
              icon={Activity}
              subtitle={errorOverview || undefined}
            />
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
            <AnalyticsCard
              title={t('analytics.activeUsers')}
              value={loadingOverview ? '--' : overviewData?.active_users || 0}
              icon={UserCheck}
              subtitle={errorOverview || undefined}
            />
          </div>
        </div>
      )}

      {/* 人口统计标签页 */}
      {activeTab === 'demographics' && (
        <div className="space-y-8">
          {/* 年龄分布 */}
          <ChartContainer
            title={t('analytics.ageDistribution')}
            loading={loadingDemographics}
            error={errorDemographics}
            isEmpty={!demographicsData?.age_distribution.length}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographicsData?.age_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="age_group" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
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
                  data={demographicsData?.gender_distribution || []}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.gender}: ${entry.count}`}
                >
                  {demographicsData?.gender_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* 趋势标签页 */}
      {activeTab === 'trends' && (
        <div className="space-y-8">
          {/* 时间粒度选择器 */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {t('analytics.granularity')}:
            </span>
            <div className="flex space-x-2">
              {(['day', 'week', 'month'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGranularityChange(g)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filters.granularity === g
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t(`analytics.${g}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 病例趋势 */}
          <ChartContainer
            title={t('analytics.caseTrends')}
            loading={loadingTrends}
            error={errorTrends}
            isEmpty={!caseTrendsData?.series.length}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={caseTrendsData?.series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={t('analytics.caseCount')}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* 诊断趋势 */}
          <ChartContainer
            title={t('analytics.diagnosisTrends')}
            loading={loadingTrends}
            error={errorTrends}
            isEmpty={!diagnosisTrendsData?.series.length}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={diagnosisTrendsData?.series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name={t('analytics.diagnosisCount')}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </div>
  );
};
