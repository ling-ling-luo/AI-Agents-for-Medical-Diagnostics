import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, AlertCircle, Stethoscope, Brain, Heart, Wind, Sparkles, Zap } from 'lucide-react';
import { caseApi } from '../services/api';
import type { DiagnosisResponse } from '../types';
import { Loading } from './Loading';
import { DiagnosisResult } from './DiagnosisResult';

export const CaseDetail = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnosis = async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await caseApi.runDiagnosis(parseInt(caseId));
      setDiagnosis(result);
    } catch (err) {
      setError('诊断失败，请稍后重试');
      console.error('Error running diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnosis();
  }, [caseId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      {/* 超级彩色顶部导航 */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-8 relative z-10">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center text-white mb-6 hover:scale-110 transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mr-3 group-hover:bg-white/30 transition-colors border-2 border-white/40 shadow-xl">
              <ArrowLeft className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg drop-shadow">返回病例列表</span>
          </button>
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mr-6 shadow-2xl transform rotate-12">
              <Stethoscope className="w-10 h-10 text-pink-600" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white drop-shadow-lg">
                病例 #{caseId} - AI 诊断 ✨
              </h1>
              <p className="text-white text-xl font-semibold drop-shadow mt-1">
                多智能体协同分析系统
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* 智能体介绍卡片 - 超级彩色版 */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-12 border-4 border-white">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8">
            <div className="flex items-center text-white mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black drop-shadow-lg">🤖 AI 智能体分析流程</h2>
                <p className="text-white/90 font-semibold mt-1">三位专家智能体协同工作</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* 心脏科智能体 */}
              <div className="group relative transform hover:scale-105 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-400 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white rounded-3xl p-6 shadow-xl border-4 border-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">❤️ 心脏科</h3>
                  <p className="text-gray-600 font-semibold">分析心血管系统相关症状</p>
                </div>
              </div>

              {/* 心理学智能体 */}
              <div className="group relative transform hover:scale-105 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white rounded-3xl p-6 shadow-xl border-4 border-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">🧠 心理学</h3>
                  <p className="text-gray-600 font-semibold">评估心理和精神健康状况</p>
                </div>
              </div>

              {/* 呼吸科智能体 */}
              <div className="group relative transform hover:scale-105 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white rounded-3xl p-6 shadow-xl border-4 border-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                    <Wind className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">💨 呼吸科</h3>
                  <p className="text-gray-600 font-semibold">检查呼吸系统和肺部状况</p>
                </div>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl border-2 border-purple-200">
              <div className="flex items-center">
                <Zap className="w-6 h-6 text-purple-600 mr-3" />
                <p className="text-gray-700 font-bold text-lg">
                  三个专科智能体协同分析，综合团队生成最终诊断
                </p>
              </div>
              <button
                onClick={runDiagnosis}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-2xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-black text-lg transform hover:scale-105 shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 mr-2" />
                    ⚡ 重新诊断
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 诊断状态 - 彩色动画 */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-2xl p-12 border-4 border-white mb-12">
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-2xl">
                <Sparkles className="w-16 h-16 text-white animate-pulse" />
              </div>
              <Loading size="lg" text="AI 智能体正在分析病例，请稍候..." />
            </div>

            <div className="space-y-4">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl blur opacity-50"></div>
                <div className="relative flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border-2 border-red-200">
                  <div className="flex items-center">
                    <Heart className="w-8 h-8 text-red-600 mr-4 animate-pulse" />
                    <span className="font-black text-gray-800 text-lg">❤️ 心脏科智能体</span>
                  </div>
                  <span className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold shadow-lg animate-pulse">分析中...</span>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-2xl blur opacity-50"></div>
                <div className="relative flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center">
                    <Brain className="w-8 h-8 text-purple-600 mr-4 animate-pulse" />
                    <span className="font-black text-gray-800 text-lg">🧠 心理学智能体</span>
                  </div>
                  <span className="px-4 py-2 bg-purple-500 text-white rounded-full text-sm font-bold shadow-lg animate-pulse">分析中...</span>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl blur opacity-50"></div>
                <div className="relative flex items-center justify-between p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-200">
                  <div className="flex items-center">
                    <Wind className="w-8 h-8 text-cyan-600 mr-4 animate-pulse" />
                    <span className="font-black text-gray-800 text-lg">💨 呼吸科智能体</span>
                  </div>
                  <span className="px-4 py-2 bg-cyan-500 text-white rounded-full text-sm font-bold shadow-lg animate-pulse">分析中...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-3xl blur-lg opacity-50"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-red-400">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white text-center">诊断失败 ❌</h3>
              </div>
              <div className="p-8 text-center">
                <p className="text-gray-700 text-lg mb-6 font-semibold">{error}</p>
                <button
                  onClick={runDiagnosis}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all shadow-xl hover:shadow-2xl font-black text-lg transform hover:scale-105"
                >
                  🔄 重试
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 诊断结果 */}
        {diagnosis && !loading && (
          <DiagnosisResult result={diagnosis.diagnosis_markdown} />
        )}

        {/* 等待状态 */}
        {!loading && !diagnosis && !error && (
          <div className="bg-white rounded-3xl shadow-2xl p-16 text-center border-4 border-dashed border-purple-300">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <Stethoscope className="w-16 h-16 text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-4">准备开始诊断 🚀</h3>
            <p className="text-gray-600 text-xl font-semibold">点击上方"重新诊断"按钮启动 AI 多智能体分析</p>
          </div>
        )}
      </div>
    </div>
  );
};
