import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, FileText, ArrowLeft, Eye, Zap, AlertCircle, X, Sparkles, Calendar } from 'lucide-react';
import { caseApi } from '../services/api';
import type { DiagnosisHistoryResponse, DiagnosisDetail } from '../types';
import { Loading } from './Loading';
import ReactMarkdown from 'react-markdown';

export const DiagnosisHistory = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<DiagnosisHistoryResponse | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [caseId]);

  const loadHistory = async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await caseApi.getDiagnosisHistory(parseInt(caseId), false);
      setHistoryData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载诊断历史失败');
      console.error('Error loading diagnosis history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (diagnosisId: number) => {
    if (!caseId) return;

    try {
      setLoadingDetail(true);
      const detail = await caseApi.getDiagnosisDetail(parseInt(caseId), diagnosisId);
      setSelectedDiagnosis(detail);
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载诊断详情失败');
      console.error('Error loading diagnosis detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center">
        <Loading size="lg" text="正在加载诊断历史..." />
      </div>
    );
  }

  if (error && !historyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 text-center border-2 border-red-200">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">加载失败</h3>
          <p className="text-base text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-base font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4 transition-colors text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            返回病例列表
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">诊断历史</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {historyData?.patient_name} ({historyData?.patient_id}) · 共 {historyData?.total_diagnoses} 次诊断记录
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-10">
        {error && (
          <div className="mb-8 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg fade-in">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-base font-bold text-red-800 mb-1">加载失败</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 诊断详情模态框 - 增强质感 */}
        {selectedDiagnosis && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in"
            onClick={() => setSelectedDiagnosis(null)}
          >
            <div
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col slide-in border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 模态框头部 */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-gray-800">诊断详情</h2>
                        <Sparkles className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(selectedDiagnosis.timestamp)}
                        </span>
                        <span>·</span>
                        <span className="font-semibold">{selectedDiagnosis.model}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          {formatExecutionTime(selectedDiagnosis.execution_time_ms)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDiagnosis(null)}
                    className="p-2.5 hover:bg-white/70 rounded-xl transition-all group"
                  >
                    <X className="w-6 h-6 text-gray-600 group-hover:text-gray-800 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* 模态框内容 */}
              <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-white to-blue-50/30">
                <div className="prose prose-base max-w-none text-gray-700">
                  <ReactMarkdown>{selectedDiagnosis.diagnosis_markdown}</ReactMarkdown>
                </div>
              </div>

              {/* 模态框底部 */}
              <div className="px-8 py-5 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50/50 flex justify-end rounded-b-3xl">
                <button
                  onClick={() => setSelectedDiagnosis(null)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                >
                  <span>关闭</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 诊断历史列表 */}
        {historyData && historyData.history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-3">暂无诊断历史</h3>
            <p className="text-base text-gray-500">该病例还没有进行过 AI 诊断</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {historyData?.history.map((item, index) => (
              <div
                key={item.id}
                className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* 诊断记录头部 */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center shadow-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          诊断记录 #{item.id}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(item.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <div className="px-4 py-2 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-bold shadow-sm">
                        {item.model}
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 text-cyan-700 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        {formatExecutionTime(item.execution_time_ms)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetail(item.id)}
                    disabled={loadingDetail}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-base font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loadingDetail ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>加载中...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5" />
                        <span>查看完整诊断</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 诊断预览 */}
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-100 shadow-inner">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-bold text-gray-700">诊断摘要</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                    {item.diagnosis_preview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
