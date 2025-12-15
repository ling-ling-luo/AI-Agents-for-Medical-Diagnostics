import { useEffect, useState } from 'react';
import { caseApi } from '../services/api';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalDiagnoses: 0,
    todayCases: 0,
  });
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

        // Calculate today's cases (assuming created_at is in ISO format)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCases = cases.filter(caseItem => {
          if (!caseItem.created_at) return false;
          const caseDate = new Date(caseItem.created_at);
          caseDate.setHours(0, 0, 0, 0);
          return caseDate.getTime() === today.getTime();
        }).length;

        setStats({
          totalCases,
          totalDiagnoses,
          todayCases,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('无法加载统计数据');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">❌</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">欢迎使用 AI 医疗诊断系统</h1>
        <p className="text-gray-600 mt-1">在这里查看系统的整体运行情况</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cases Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总病例数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCases}</p>
            </div>
          </div>
        </div>

        {/* Total Diagnoses Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总诊断数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDiagnoses}</p>
            </div>
          </div>
        </div>

        {/* Today's Cases Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日新增</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.todayCases}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">系统概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">使用指南</h3>
            <p className="text-sm text-gray-600 mt-1">
              从左侧导航栏选择相应功能开始使用系统。您可以查看病例列表、导入新病例或创建新的诊断案例。
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">系统状态</h3>
            <p className="text-sm text-gray-600 mt-1">
              系统运行正常。所有功能均可正常使用，请随时开始您的诊断工作。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};