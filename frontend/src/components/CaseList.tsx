import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Stethoscope, Activity, Search, RefreshCw } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI 医疗诊断系统</h1>
                <p className="text-sm text-gray-600">多智能体协同诊断平台</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="badge badge-blue">
                <Activity className="w-4 h-4 mr-1" />
                {cases.length} 个病例
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        {/* 搜索和统计栏 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-3">
                🔍 搜索病例
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400 pointer-events-none" />
                <input
                  id="search"
                  type="text"
                  placeholder="输入患者姓名、病历号或主诉进行搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:from-white focus:to-white transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 md:ml-6">
              <div className="text-center px-5 py-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-white">{filteredCases.length}</div>
                <div className="text-xs text-emerald-50 font-semibold">匹配结果</div>
              </div>
              <div className="text-center px-5 py-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="text-2xl font-black text-white">{cases.length}</div>
                <div className="text-xs text-blue-50 font-semibold">总病例数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 病例列表 */}
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? '🔍 未找到匹配的病例' : '📂 暂无病例数据'}
            </h3>
            <p className="text-gray-600 text-lg">
              {searchTerm ? '请尝试其他搜索关键词' : '请先导入医疗病历文件'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-40 p-20 bg-gray-50 rounded-2xl" style={{marginBottom: '200px'}}>
            {filteredCases.map((case_, index) => (
              <div
                key={case_.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden fade-in border-2 border-gray-200 hover:border-blue-300"
              >
                {/* 病例头部 */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {case_.patient_name || `病例 #${case_.id}`}
                      </h3>
                      <p className="text-sm text-blue-100 truncate font-medium">{case_.patient_id}</p>
                    </div>
                  </div>
                </div>

                {/* 病例内容 */}
                <div className="p-7 space-y-6">
                  {/* 患者信息标签 */}
                  <div className="flex items-center space-x-3 flex-wrap gap-3">
                    {case_.age && (
                      <span className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-sm font-bold shadow-sm">
                        🎂 {case_.age} 岁
                      </span>
                    )}
                    {case_.gender && (
                      <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                        case_.gender === 'male'
                          ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white'
                          : case_.gender === 'female'
                          ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white'
                          : 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white'
                      }`}>
                        {case_.gender === 'male' ? '👨 男' : case_.gender === 'female' ? '👩 女' : '⭐ 其他'}
                      </span>
                    )}
                  </div>

                  {/* 主诉信息 */}
                  {case_.chief_complaint && (
                    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-5 border-2 border-purple-200 shadow-sm">
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-purple-700 mb-1.5 uppercase tracking-wide">📋 主诉</p>
                          <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-relaxed">
                            {case_.chief_complaint}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 诊断按钮 */}
                  <button
                    onClick={() => handleRunDiagnosis(case_.id)}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    <Stethoscope className="w-4 h-4 mr-2" />
                    开始 AI 诊断
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
