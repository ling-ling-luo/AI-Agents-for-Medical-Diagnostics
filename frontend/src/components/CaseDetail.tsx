import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, AlertCircle, Stethoscope, Brain, Heart, Wind, Loader } from 'lucide-react';
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
      setError('诊断失败，请检查后端服务并稍后重试');
      console.error('Error running diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnosis();
  }, [caseId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container-custom py-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回病例列表
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">病例 #{caseId} - AI 诊断</h1>
              <p className="text-sm text-gray-600">多智能体协同分析系统</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8 space-y-6">
        {/* 智能体介绍卡片 */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center space-x-3 text-white">
              <Brain className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-semibold">AI 智能体分析流程</h2>
                <p className="text-sm text-blue-100">三位专家智能体协同工作</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* 专家智能体列表 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">心脏科</h3>
                </div>
                <p className="text-sm text-gray-600">分析心血管系统相关症状</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">心理学</h3>
                </div>
                <p className="text-sm text-gray-600">评估心理和精神健康状况</p>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <Wind className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">呼吸科</h3>
                </div>
                <p className="text-sm text-gray-600">检查呼吸系统和肺部状况</p>
              </div>
            </div>

            {/* 诊断控制 */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 font-medium">
                三个专科智能体协同分析，综合团队生成最终诊断
              </p>
              <button
                onClick={runDiagnosis}
                disabled={loading}
                className="btn-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新诊断
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 诊断进行中状态 */}
        {loading && (
          <div className="card p-8 fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <Loading size="lg" text="AI 智能体正在分析病例，请稍候..." />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <Heart className="w-6 h-6 text-red-600 animate-pulse" />
                  <span className="font-medium text-gray-900">心脏科智能体</span>
                </div>
                <span className="badge badge-orange animate-pulse">分析中</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
                  <span className="font-medium text-gray-900">心理学智能体</span>
                </div>
                <span className="badge badge-orange animate-pulse">分析中</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="flex items-center space-x-3">
                  <Wind className="w-6 h-6 text-cyan-600 animate-pulse" />
                  <span className="font-medium text-gray-900">呼吸科智能体</span>
                </div>
                <span className="badge badge-orange animate-pulse">分析中</span>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="card border-red-200 fade-in">
            <div className="bg-red-50 p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">诊断失败</h3>
              <p className="text-gray-600 text-center mb-6">{error}</p>
              <div className="text-center">
                <button
                  onClick={runDiagnosis}
                  className="btn-primary inline-flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试
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
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">准备开始诊断</h3>
            <p className="text-gray-600">点击上方"重新诊断"按钮启动 AI 多智能体分析</p>
          </div>
        )}
      </main>
    </div>
  );
};
