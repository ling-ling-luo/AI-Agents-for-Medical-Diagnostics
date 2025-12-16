import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Zap, User, AlertCircle, Download, ChevronDown, Package } from 'lucide-react';
import { caseApi } from '../services/api';
import type { DiagnosisDetail } from '../types';
import { Loading } from '../components/Loading';
import ReactMarkdown from 'react-markdown';
import { formatDateTime, formatExecutionTime } from '../utils/diagnosisHelpers';
import { SmartDropdown, DropdownItem } from '../components/SmartDropdown';
import { downloadBlob } from '../utils/download';

const DiagnosisDetailPage: React.FC = () => {
  const { caseId, diagnosisId } = useParams<{ caseId: string; diagnosisId: string }>();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadDiagnosis();
  }, [caseId, diagnosisId]);

  const loadDiagnosis = async () => {
    if (!caseId || !diagnosisId) {
      setError('无效的诊断ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await caseApi.getDiagnosisDetail(parseInt(caseId), parseInt(diagnosisId));
      setDiagnosis(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载诊断详情失败');
      console.error('加载诊断详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'markdown' | 'json' | 'docx') => {
    if (!caseId || !diagnosisId) return;

    try {
      setExporting(true);

      const blob = await caseApi.exportDiagnosisById(parseInt(caseId), parseInt(diagnosisId), format);

      downloadBlob(
        blob,
        `diagnosis-${diagnosisId}.${format === 'markdown' ? 'md' : format}`
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const handleGoBack = () => {
    // 使用浏览器后退，如果没有历史记录则返回全局诊断历史页面
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/diagnoses');
    }
  };

  const handleGoToCase = () => {
    navigate(`/case/${caseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center">
        <Loading size="lg" text="正在加载诊断详情..." />
      </div>
    );
  }

  if (error || !diagnosis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 text-center border-2 border-red-200">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">加载失败</h3>
          <p className="text-base text-gray-600 mb-8">{error || '未找到诊断记录'}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-base font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          {/* 面包屑导航 */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => navigate('/diagnoses')}
              className="hover:text-blue-600 transition-colors"
            >
              诊断历史
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">诊断详情 #{diagnosisId}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">诊断报告详情</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  诊断记录 #{diagnosisId}
                </p>
              </div>
            </div>

            {/* 操作按钮组 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoToCase}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                查看病例
              </button>

              {/* 导出按钮 */}
              <SmartDropdown
                trigger={
                  <button
                    disabled={exporting}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow hover:shadow-md disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>
                }
                isOpen={showExportMenu}
                onToggle={() => setShowExportMenu(!showExportMenu)}
                onClose={() => setShowExportMenu(false)}
                preferredPosition={{ vertical: 'bottom', horizontal: 'right' }}
                minWidth="10rem"
              >
                <DropdownItem
                  icon={<FileText className="w-4 h-4 text-red-500" />}
                  label="PDF 格式"
                  onClick={() => handleExport('pdf')}
                />
                <DropdownItem
                  icon={<FileText className="w-4 h-4 text-blue-500" />}
                  label="Word 格式"
                  onClick={() => handleExport('docx')}
                />
                <DropdownItem
                  icon={<FileText className="w-4 h-4 text-gray-500" />}
                  label="Markdown 格式"
                  onClick={() => handleExport('markdown')}
                />
                <DropdownItem
                  icon={<FileText className="w-4 h-4 text-green-500" />}
                  label="JSON 格式"
                  onClick={() => handleExport('json')}
                />
              </SmartDropdown>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-10">
        {/* 诊断元数据卡片 */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center shadow">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">诊断时间</p>
                <p className="text-base font-semibold text-gray-800">{formatDateTime(diagnosis.timestamp)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">AI 模型</p>
                <p className="text-base font-semibold text-gray-800">{diagnosis.model}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center shadow">
                <Zap className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">执行时间</p>
                <p className="text-base font-semibold text-gray-800">{formatExecutionTime(diagnosis.execution_time_ms)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 诊断内容 */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 p-8 shadow-lg">
          <div className="prose prose-base max-w-none text-gray-700">
            <ReactMarkdown>{diagnosis.diagnosis_markdown}</ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DiagnosisDetailPage;
