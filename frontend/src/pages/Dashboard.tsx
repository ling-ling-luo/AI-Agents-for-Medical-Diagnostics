import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FileText,
  Activity,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Brain,
  Stethoscope,
} from 'lucide-react';
import { caseApi } from '../services/api';
import type { Case } from '../types';

export const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalCases: 0,
    totalDiagnoses: 0,
    todayCases: 0,
    thisWeekCases: 0,
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const cases = await caseApi.getCases();

        // Calculate statistics
        const totalCases = cases.length;
        const totalDiagnoses = cases.reduce((sum, caseItem) => sum + (caseItem.diagnosis_count || 0), 0);

        // Calculate today's cases
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCases = cases.filter((caseItem) => {
          if (!caseItem.created_at) return false;
          const caseDate = new Date(caseItem.created_at);
          caseDate.setHours(0, 0, 0, 0);
          return caseDate.getTime() === today.getTime();
        }).length;

        // Calculate this week's cases
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        const thisWeekCases = cases.filter((caseItem) => {
          if (!caseItem.created_at) return false;
          const caseDate = new Date(caseItem.created_at);
          return caseDate >= weekAgo;
        }).length;

        setStats({
          totalCases,
          totalDiagnoses,
          todayCases,
          thisWeekCases,
        });

        // Get recent 5 cases
        const sorted = [...cases].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setRecentCases(sorted.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(t('dashboard.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t]);

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {t('dashboard.reload')}
          </button>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* 页面头部 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t('dashboard.welcome')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 总病例数 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalCases')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCases}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.allRecords')}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* 诊断总数 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalDiagnoses')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDiagnoses}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.aiAnalysis')}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* 今日新增 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.todayNew')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayCases}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.todayCount')}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* 本周趋势 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.weekTrend')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.thisWeekCases}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.last7Days')}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 双栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 最近病例 */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentCases')}</h2>
              </div>
              <Link
                to="/cases"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer no-underline"
              >
                {t('dashboard.viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentCases.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('dashboard.noCases')}</p>
                <Link
                  to="/cases/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer no-underline"
                >
                  {t('dashboard.createFirst')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentCases.map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/cases/${caseItem.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer no-underline"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        caseItem.has_diagnosis ? 'bg-green-50' : 'bg-gray-100'
                      }`}>
                        {caseItem.has_diagnosis ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {caseItem.patient_name || t('dashboard.unnamed')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {caseItem.patient_id || '-'} · {formatDate(caseItem.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {caseItem.diagnosis_count && caseItem.diagnosis_count > 0 ? (
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                          {caseItem.diagnosis_count} {t('dashboard.diagnosisCount')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                          {t('dashboard.pending')}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 快捷操作 & 系统信息 */}
          <div className="space-y-6">
            {/* 快捷操作 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions')}</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link
                  to="/cases/new"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group no-underline"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('dashboard.newCase')}</p>
                    <p className="text-sm text-gray-500">{t('dashboard.newCaseDesc')}</p>
                  </div>
                </Link>

                <Link
                  to="/cases"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors cursor-pointer group no-underline"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('dashboard.viewCases')}</p>
                    <p className="text-sm text-gray-500">{t('dashboard.viewCasesDesc')}</p>
                  </div>
                </Link>

                <Link
                  to="/analytics"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer group no-underline"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('dashboard.analytics')}</p>
                    <p className="text-sm text-gray-500">{t('dashboard.analyticsDesc')}</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* 系统信息 */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('dashboard.aiPowered')}</h3>
                  <p className="text-sm text-blue-100">{t('dashboard.multiAgent')}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-100">{t('dashboard.feature1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-100">{t('dashboard.feature2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-100">{t('dashboard.feature3')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
