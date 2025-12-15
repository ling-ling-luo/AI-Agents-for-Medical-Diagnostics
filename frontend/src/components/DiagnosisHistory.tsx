import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, FileText, ArrowLeft, Eye, Zap, AlertCircle, Calendar, Download, ChevronDown, CheckSquare, Square, Package, Sparkles } from 'lucide-react';
import { caseApi } from '../services/api';
import type { DiagnosisHistoryResponse, DiagnosisDetail } from '../types';
import { Loading } from './Loading';
import ReactMarkdown from 'react-markdown';
import { SmartDropdown, DropdownItem } from './SmartDropdown';
import { downloadBlob } from '../utils/download';
import { BaseModal } from './BaseModal';

export const DiagnosisHistory = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<DiagnosisHistoryResponse | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await caseApi.getDiagnosisHistory(parseInt(caseId), false);
      setHistoryData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '加载诊断历史失败');
      console.error('Error loading diagnosis history:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadHistory();
  }, [caseId, loadHistory]);

  const handleViewDetail = async (diagnosisId: number) => {
    if (!caseId) return;

    try {
      setLoadingDetail(true);
      const detail = await caseApi.getDiagnosisDetail(parseInt(caseId), diagnosisId);
      setSelectedDiagnosis(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '加载诊断详情失败');
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

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (!historyData) return;

    if (selectedIds.size === historyData.history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(historyData.history.map(item => item.id)));
    }
  };

  // 切换单个选择
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 单个导出
  const handleExportSingle = async (diagnosisId: number, format: 'pdf' | 'markdown' | 'json' | 'docx') => {
    if (!caseId) return;

    try {
      setExporting(true);

      const blob = await caseApi.exportDiagnosisById(parseInt(caseId), diagnosisId, format);

      downloadBlob(
        blob,
        `diagnosis-${diagnosisId}.${format === 'markdown' ? 'md' : format}`
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  // 批量导出
  const handleBatchExport = async (format: 'pdf' | 'markdown' | 'json' | 'docx') => {
    if (!caseId || selectedIds.size === 0) {
      alert('请先选择要导出的诊断记录');
      return;
    }

    try {
      setExporting(true);

      const blob = await caseApi.exportDiagnosisBatch(
        parseInt(caseId),
        Array.from(selectedIds),
        format
      );

      downloadBlob(blob, `diagnosis-batch-${caseId}.zip`);
    } catch (error) {
      console.error('Batch export failed:', error);
      alert('批量导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
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
            onClick={() => navigate('/cases')}
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
            onClick={() => navigate('/cases')}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4 transition-colors text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            返回病例列表
          </button>
          <div className="flex items-center justify-between">
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

            {/* 批量操作按钮组 */}
            {historyData && historyData.history.length > 0 && (
              <div className="flex items-center gap-3">
                {/* 全选按钮 */}
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  {selectedIds.size === historyData.history.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>{selectedIds.size === historyData.history.length ? '取消全选' : '全选'}</span>
                </button>

                {/* 批量导出按钮 */}
                {selectedIds.size > 0 && (
                  <SmartDropdown
                    trigger={
                      <button
                        disabled={exporting}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow hover:shadow-md disabled:opacity-50"
                      >
                        <Package className="w-4 h-4" />
                        <span>批量导出 ({selectedIds.size})</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu === -1 ? 'rotate-180' : ''}`} />
                      </button>
                    }
                    isOpen={showExportMenu === -1}
                    onToggle={() => setShowExportMenu(showExportMenu === -1 ? null : -1)}
                    onClose={() => setShowExportMenu(null)}
                    preferredPosition={{ vertical: 'top', horizontal: 'right' }}
                    minWidth="12rem"
                  >
                    <DropdownItem
                      icon={<FileText className="w-4 h-4 text-red-500" />}
                      label="PDF 压缩包"
                      onClick={() => handleBatchExport('pdf')}
                    />
                    <DropdownItem
                      icon={<FileText className="w-4 h-4 text-blue-500" />}
                      label="Word 压缩包"
                      onClick={() => handleBatchExport('docx')}
                    />
                    <DropdownItem
                      icon={<FileText className="w-4 h-4 text-gray-500" />}
                      label="Markdown 压缩包"
                      onClick={() => handleBatchExport('markdown')}
                    />
                    <DropdownItem
                      icon={<FileText className="w-4 h-4 text-green-500" />}
                      label="JSON 压缩包"
                      onClick={() => handleBatchExport('json')}
                    />
                  </SmartDropdown>
                )}
              </div>
            )}
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

        {/* 诊断详情模态框 */}
        <BaseModal
          isOpen={!!selectedDiagnosis}
          onClose={() => setSelectedDiagnosis(null)}
          title="诊断详情"
          subtitle={
            selectedDiagnosis
              ? `${formatDate(selectedDiagnosis.timestamp)} · ${selectedDiagnosis.model} · ${formatExecutionTime(selectedDiagnosis.execution_time_ms)}`
              : undefined
          }
          headerIcon={<FileText className="w-4 h-4 text-blue-600" />}
          maxWidthClass="max-w-5xl"
          footer={
            <button
              onClick={() => setSelectedDiagnosis(null)}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded transition-colors"
            >
              关闭
            </button>
          }
        >
          {selectedDiagnosis && (
            <div className="prose prose-base max-w-none text-gray-700">
              <ReactMarkdown>{selectedDiagnosis.diagnosis_markdown}</ReactMarkdown>
            </div>
          )}
        </BaseModal>

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
                  <div className="flex items-start gap-4 flex-1">
                    {/* 复选框 */}
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="mt-1 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {selectedIds.has(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

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
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 单个导出按钮 */}
                    <SmartDropdown
                      trigger={
                        <button
                          disabled={exporting}
                          className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          <span>导出</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu === item.id ? 'rotate-180' : ''}`} />
                        </button>
                      }
                      isOpen={showExportMenu === item.id}
                      onToggle={() => setShowExportMenu(showExportMenu === item.id ? null : item.id)}
                      onClose={() => setShowExportMenu(null)}
                      preferredPosition={{ vertical: 'bottom', horizontal: 'right' }}
                      minWidth="10rem"
                    >
                      <DropdownItem
                        icon={<FileText className="w-4 h-4 text-red-500" />}
                        label="PDF 格式"
                        onClick={() => handleExportSingle(item.id, 'pdf')}
                      />
                      <DropdownItem
                        icon={<FileText className="w-4 h-4 text-blue-500" />}
                        label="Word 格式"
                        onClick={() => handleExportSingle(item.id, 'docx')}
                      />
                      <DropdownItem
                        icon={<FileText className="w-4 h-4 text-gray-500" />}
                        label="Markdown 格式"
                        onClick={() => handleExportSingle(item.id, 'markdown')}
                      />
                      <DropdownItem
                        icon={<FileText className="w-4 h-4 text-green-500" />}
                        label="JSON 格式"
                        onClick={() => handleExportSingle(item.id, 'json')}
                      />
                    </SmartDropdown>

                    {/* 查看完整诊断按钮 */}
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
