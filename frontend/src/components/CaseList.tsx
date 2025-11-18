import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Stethoscope, Activity, Sparkles, Heart } from 'lucide-react';
import type { Case } from '../types';
import { caseApi } from '../services/api';
import { Loading } from './Loading';

export const CaseList = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await caseApi.getCases();
      setCases(data);
    } catch (err) {
      setError('加载病例失败，请检查后端服务是否启动');
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnosis = (caseId: number) => {
    navigate(`/case/${caseId}`);
  };

  const getGenderBadge = (gender: string | null) => {
    if (!gender) return null;
    const styles = {
      male: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
      female: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white',
      other: 'bg-gradient-to-r from-purple-400 to-purple-500 text-white'
    };
    const labels = {
      male: '👨 男',
      female: '👩 女',
      other: '⭐ 其他'
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${styles[gender as keyof typeof styles]}`}>
        {labels[gender as keyof typeof labels]}
      </span>
    );
  };

  const getCardGradient = (index: number) => {
    const gradients = [
      'from-purple-400 via-pink-400 to-red-400',
      'from-blue-400 via-cyan-400 to-teal-400',
      'from-green-400 via-emerald-400 to-cyan-400',
      'from-orange-400 via-red-400 to-pink-400',
      'from-indigo-400 via-purple-400 to-pink-400',
      'from-yellow-400 via-orange-400 to-red-400',
      'from-teal-400 via-cyan-400 to-blue-400',
      'from-pink-400 via-rose-400 to-red-400',
      'from-cyan-400 via-blue-400 to-indigo-400',
      'from-lime-400 via-green-400 to-emerald-400'
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce shadow-2xl">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
          <Loading text="正在加载病例..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-red-400">
            <div className="bg-gradient-to-r from-red-400 to-pink-500 p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <Activity className="w-10 h-10 text-red-500" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white text-center">连接失败</h3>
            </div>
            <div className="p-8">
              <p className="text-gray-700 text-center mb-6 text-lg">{error}</p>
              <button
                onClick={loadCases}
                className="w-full px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all shadow-xl hover:shadow-2xl font-bold text-lg transform hover:scale-105"
              >
                🔄 重新加载
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      {/* 超级彩色顶部 */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-12 relative z-10">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mr-6 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform">
              <Stethoscope className="w-10 h-10 text-pink-600" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
                ✨ AI 医疗诊断系统
              </h1>
              <p className="text-white text-xl font-semibold drop-shadow">
                多智能体协同诊断平台 · AI 驱动
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-2xl border-2 border-white/40 shadow-xl">
              <div className="flex items-center">
                <Heart className="w-6 h-6 text-white mr-3 animate-pulse" />
                <span className="text-white font-bold text-lg">共 {cases.length} 个病例</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-2xl border-2 border-white/40 shadow-xl">
              <div className="flex items-center">
                <Sparkles className="w-6 h-6 text-yellow-300 mr-3" />
                <span className="text-white font-bold text-lg">AI 智能分析</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 病例卡片网格 */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {cases.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-16 text-center border-4 border-dashed border-gray-300">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <FileText className="w-16 h-16 text-purple-600" />
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-4">暂无病例数据</h3>
            <p className="text-gray-500 text-xl">请先导入医疗病历文件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cases.map((case_, index) => (
              <div
                key={case_.id}
                className="group relative transform hover:scale-105 transition-all duration-300"
              >
                {/* 彩色光晕背景 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getCardGradient(index)} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity`}></div>

                {/* 卡片主体 */}
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
                  {/* 顶部彩色渐变条 */}
                  <div className={`h-8 bg-gradient-to-r ${getCardGradient(index)}`}></div>

                  <div className="p-6">
                    {/* 患者头像和信息 */}
                    <div className="flex items-start mb-5">
                      <div className={`w-16 h-16 bg-gradient-to-br ${getCardGradient(index)} rounded-2xl flex items-center justify-center mr-4 shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform`}>
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-800 mb-1 leading-tight">
                          {case_.patient_name || `病例 #${case_.id}`}
                        </h3>
                        <p className="text-sm font-semibold text-gray-500">{case_.patient_id}</p>
                      </div>
                    </div>

                    {/* 标签组 */}
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      {case_.age && (
                        <span className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg">
                          🎂 {case_.age} 岁
                        </span>
                      )}
                      {getGenderBadge(case_.gender)}
                    </div>

                    {/* 主诉信息框 */}
                    {case_.chief_complaint && (
                      <div className={`mb-5 p-5 bg-gradient-to-br ${getCardGradient(index)} bg-opacity-10 rounded-2xl border-2 border-current`}
                        style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                        <div className="flex items-start">
                          <FileText className="w-5 h-5 text-gray-700 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">📋 主诉</p>
                            <p className="text-sm text-gray-800 leading-relaxed font-semibold">
                              {case_.chief_complaint}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 诊断按钮 */}
                    <button
                      onClick={() => handleRunDiagnosis(case_.id)}
                      className={`w-full px-6 py-4 bg-gradient-to-r ${getCardGradient(index)} text-white rounded-2xl hover:shadow-2xl transition-all flex items-center justify-center font-black text-lg transform hover:scale-105 shadow-xl`}
                    >
                      <Sparkles className="w-6 h-6 mr-2 animate-pulse" />
                      启动 AI 诊断
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
