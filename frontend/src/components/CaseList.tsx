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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      {/* 顶部导航栏 - 增强质感 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">AI 医疗诊断系统</h1>
                <p className="text-xs text-gray-500 mt-0.5">共 {cases.length} 个病例</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow hover:shadow-md whitespace-nowrap min-w-[130px]"
            >
              <Plus className="w-4 h-4" />
              <span className="min-w-max">新增病例</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8 flex flex-col gap-12">
        {/* 搜索栏 - 类似谷歌搜索框设计 */}
        <div className="relative z-20">
          <div className="relative max-w-3xl mx-auto">
            <div className="flex items-center bg-white border border-gray-200 rounded-full px-6 py-4 shadow-md hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400">
              <Search className="w-6 h-6 text-gray-400 mr-4 flex-shrink-0" />
              <input
                type="text"
                placeholder="搜索患者姓名、病历号或主诉"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-lg text-gray-700 placeholder-gray-400 focus:outline-none h-full w-full"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                找到 {filteredCases.length} 个匹配结果
              </p>
            )}
          </div>
        </div>

        {/* 病例列表 - 增强卡片质感 */}
        <div className="relative z-0 pt-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((case_) => (
                <div
                  key={case_.id}
                  className="bg-white rounded-2xl border border-gray-200 transition-all duration-300 overflow-hidden group shadow-sm hover:shadow-lg hover:-translate-y-1 transform"
                >
                  {/* 病例头部 - 增强质感 */}
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-800 truncate">
                          {case_.patient_name || `病例 #${case_.id}`}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-1.5">{case_.patient_id}</p>
                      </div>
                    </div>

                  {/* 患者信息标签 - 增强质感 */}
                  <div className="flex items-center gap-2.5 mb-5">
                    {case_.age && (
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold shadow-sm">
                        {case_.age} 岁
                      </span>
                    )}
                    {case_.gender && (
                      <span className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold shadow-sm">
                        {case_.gender === 'male' ? '男' : case_.gender === 'female' ? '女' : '其他'}
                      </span>
                    )}
                  </div>

                  {/* 主诉信息 - 增强质感 */}
                  {case_.chief_complaint && (
                    <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 shadow-inner">
                      <p className="text-xs font-semibold text-gray-600 mb-2">主诉</p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {case_.chief_complaint}
                      </p>
                    </div>
                  )}

                  {/* 诊断按钮 - 增强质感，防止文字溢出 */}
                  <button
                    onClick={() => handleRunDiagnosis(case_.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow hover:shadow-md whitespace-nowrap min-w-[120px]"
                  >
                    <Stethoscope className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">开始诊断</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    </div>
  );
};
