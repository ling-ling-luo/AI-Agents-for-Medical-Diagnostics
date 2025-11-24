import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, FileText, ArrowLeft, Eye, Zap, AlertCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="正在加载诊断历史..." />
      </div>
    );
  }

  if (error && !historyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-secondary">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">诊断历史</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {historyData?.patient_name} ({historyData?.patient_id}) - 共 {historyData?.total_diagnoses} 次诊断
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">加载失败</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 诊断详情模态框 */}
        {selectedDiagnosis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              {/* 模态框头部 */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">诊断详情</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(selectedDiagnosis.timestamp)} · {selectedDiagnosis.model} · {formatExecutionTime(selectedDiagnosis.execution_time_ms)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDiagnosis(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* 模态框内容 */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{selectedDiagnosis.diagnosis_markdown}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 诊断历史列表 */}
        {historyData && historyData.history.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-700 mb-1.5">暂无诊断历史</h3>
            <p className="text-sm text-gray-500">该病例还没有进行过 AI 诊断</p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyData?.history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300"
              >
                {/* 诊断记录头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-inner">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">
                          诊断记录 #{item.id}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(item.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold shadow-sm">
                        {item.model}
                      </span>
                      <span className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {formatExecutionTime(item.execution_time_ms)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetail(item.id)}
                    disabled={loadingDetail}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingDetail ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>加载中...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>查看完整诊断</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 诊断预览 */}
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">诊断摘要</p>
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
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
