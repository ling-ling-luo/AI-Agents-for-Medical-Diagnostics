import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Stethoscope, Activity, Search, RefreshCw, Plus } from 'lucide-react';
import type { Case } from '../types';
import { caseApi } from '../services/api';
import { Loading } from './Loading';

export const CaseList = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, []);

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

  const handleRunDiagnosis = (caseId: number) => {
    navigate(`/case/${caseId}`);
  };

  const filteredCases = cases.filter(case_ => {
    const searchLower = searchTerm.toLowerCase();
    return (
      case_.patient_name?.toLowerCase().includes(searchLower) ||
      case_.patient_id?.toLowerCase().includes(searchLower) ||
      case_.chief_complaint?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="正在加载病例数据..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-white">
      {/* 顶部导航栏 - 轻量极简 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400/80 to-cyan-400/80 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-800">AI 医疗诊断系统</h1>
                <p className="text-xs text-gray-500 mt-0.5">共 {cases.length} 个病例</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              新增病例
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        {/* 搜索栏 - 轻量极简 */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索患者姓名、病历号或主诉"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all shadow-sm"
            />
          </div>
          {searchTerm && (
            <p className="text-xs text-gray-500 mt-2.5">找到 {filteredCases.length} 个匹配结果</p>
          )}
        </div>

        {/* 病例列表 - 轻量极简卡片 */}
        {filteredCases.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-700 mb-1.5">
              {searchTerm ? '未找到匹配的病例' : '暂无病例数据'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? '请尝试其他搜索关键词' : '请先导入医疗病历文件'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCases.map((case_) => (
              <div
                key={case_.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/60 hover:border-blue-300/60 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 overflow-hidden group"
              >
                {/* 病例头部 - 极简信息 */}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-800 truncate">
                        {case_.patient_name || `病例 #${case_.id}`}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mt-1">{case_.patient_id}</p>
                    </div>
                  </div>

                  {/* 患者信息标签 - 低饱和色 */}
                  <div className="flex items-center gap-2 mb-4">
                    {case_.age && (
                      <span className="px-2.5 py-1 bg-blue-50/80 text-blue-700 rounded-lg text-xs font-medium">
                        {case_.age} 岁
                      </span>
                    )}
                    {case_.gender && (
                      <span className="px-2.5 py-1 bg-cyan-50/80 text-cyan-700 rounded-lg text-xs font-medium">
                        {case_.gender === 'male' ? '男' : case_.gender === 'female' ? '女' : '其他'}
                      </span>
                    )}
                  </div>

                  {/* 主诉信息 - 浅色背景 */}
                  {case_.chief_complaint && (
                    <div className="mb-4 p-3.5 bg-gradient-to-br from-blue-50/40 to-cyan-50/30 rounded-xl border border-blue-100/40">
                      <p className="text-xs font-medium text-gray-600 mb-1.5">主诉</p>
                      <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                        {case_.chief_complaint}
                      </p>
                    </div>
                  )}

                  {/* 诊断按钮 - 浅色调 */}
                  <button
                    onClick={() => handleRunDiagnosis(case_.id)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <Stethoscope className="w-4 h-4" />
                    开始诊断
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
