import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, AlertCircle, Stethoscope, Brain, Heart, Wind, Loader, User, Calendar, FileText } from 'lucide-react';
import { caseApi } from '../services/api';
import type { CaseDetail as CaseDetailType, DiagnosisResponse } from '../types';
import { Loading } from './Loading';
import { DiagnosisResult } from './DiagnosisResult';

export const CaseDetail = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseDetail, setCaseDetail] = useState<CaseDetailType | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCase, setLoadingCase] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载病例详情
  useEffect(() => {
    const loadCaseDetail = async () => {
      if (!caseId) return;

      try {
        setLoadingCase(true);
        const data = await caseApi.getCaseDetail(parseInt(caseId));
        setCaseDetail(data);
      } catch (err) {
        setError('无法加载病例详情，请检查后端服务');
        console.error('Error loading case detail:', err);
      } finally {
        setLoadingCase(false);
      }
    };

    loadCaseDetail();
  }, [caseId]);

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

  // 加载中状态
  if (loadingCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-white flex items-center justify-center">
        <Loading size="lg" text="正在加载病例详情..." />
      </div>
    );
  }

  // 错误状态
  if (error && !caseDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-red-200/60 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">加载失败</h3>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-white">
      {/* 顶部导航栏 - 轻量极简 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container-custom py-5">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-5 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回病例列表
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400/80 to-cyan-400/80 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-800">
                  {caseDetail?.patient_name || `病例 #${caseId}`}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">AI 智能诊断</p>
              </div>
            </div>
            <button
              onClick={runDiagnosis}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  分析中
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  开始诊断
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        {/* 病例详情卡片 */}
        {caseDetail && (
          <div className="mb-6 bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200/60 bg-gradient-to-br from-blue-50/30 to-cyan-50/20">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-gray-700" />
                <h3 className="text-sm font-medium text-gray-800">病例详情</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">患者姓名</p>
                  <p className="text-sm font-medium text-gray-800">{caseDetail.patient_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">病历号</p>
                  <p className="text-sm font-medium text-gray-800">{caseDetail.patient_id || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">年龄</p>
                  <p className="text-sm font-medium text-gray-800">{caseDetail.age ? `${caseDetail.age} 岁` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">性别</p>
                  <p className="text-sm font-medium text-gray-800">
                    {caseDetail.gender === 'male' ? '男' : caseDetail.gender === 'female' ? '女' : '-'}
                  </p>
                </div>
              </div>

              {caseDetail.chief_complaint && (
                <div className="mb-4 p-3.5 bg-gradient-to-br from-blue-50/40 to-cyan-50/30 rounded-xl border border-blue-100/40">
                  <p className="text-xs font-medium text-gray-600 mb-1.5">主诉</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{caseDetail.chief_complaint}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">完整病历</p>
                <div className="p-3.5 bg-gray-50/60 rounded-xl border border-gray-200/40 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                    {caseDetail.raw_report}
                  </pre>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>创建时间: {new Date(caseDetail.created_at).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>
        )}
        {/* 专家智能体列表 - 轻量极简 */}
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-500 mb-3.5">专科智能体</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 hover:border-red-300/60 hover:shadow-md hover:shadow-red-100/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-medium text-gray-800 text-sm">心脏科</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">分析心血管系统相关症状</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 hover:border-purple-300/60 hover:shadow-md hover:shadow-purple-100/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-800 text-sm">心理学</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">评估心理和精神健康状况</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 hover:border-cyan-300/60 hover:shadow-md hover:shadow-cyan-100/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-xl flex items-center justify-center">
                  <Wind className="w-4 h-4 text-cyan-600" />
                </div>
                <h3 className="font-medium text-gray-800 text-sm">呼吸科</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">检查呼吸系统和肺部状况</p>
            </div>
          </div>
        </div>

        {/* 诊断进行中状态 - 轻量极简 */}
        {loading && (
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-7 fade-in">
            <div className="text-center mb-7">
              <Loader className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-700 font-medium text-sm">AI 智能体正在分析病例</p>
              <p className="text-xs text-gray-500 mt-1">请稍候...</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-br from-red-50/40 to-rose-50/30 rounded-xl border border-red-100/40">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-red-600 animate-pulse" />
                  <span className="text-xs font-medium text-gray-800">心脏科智能体</span>
                </div>
                <span className="px-2 py-0.5 bg-orange-100/80 text-orange-700 rounded-lg text-xs font-medium animate-pulse">分析中</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gradient-to-br from-purple-50/40 to-violet-50/30 rounded-xl border border-purple-100/40">
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-purple-600 animate-pulse" />
                  <span className="text-xs font-medium text-gray-800">心理学智能体</span>
                </div>
                <span className="px-2 py-0.5 bg-orange-100/80 text-orange-700 rounded-lg text-xs font-medium animate-pulse">分析中</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gradient-to-br from-cyan-50/40 to-sky-50/30 rounded-xl border border-cyan-100/40">
                <div className="flex items-center gap-3">
                  <Wind className="w-4 h-4 text-cyan-600 animate-pulse" />
                  <span className="text-xs font-medium text-gray-800">呼吸科智能体</span>
                </div>
                <span className="px-2 py-0.5 bg-orange-100/80 text-orange-700 rounded-lg text-xs font-medium animate-pulse">分析中</span>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 - 轻量极简 */}
        {error && (
          <div className="bg-white/70 backdrop-blur-sm border border-red-200/60 rounded-2xl p-8 fade-in text-center">
            <AlertCircle className="w-11 h-11 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-800 mb-2">诊断失败</h3>
            <p className="text-sm text-gray-600 mb-5">{error}</p>
            <button
              onClick={runDiagnosis}
              className="px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all inline-flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        )}

        {/* 诊断结果 */}
        {diagnosis && !loading && (
          <DiagnosisResult result={diagnosis.diagnosis_markdown} />
        )}
      </main>
    </div>
  );
};
