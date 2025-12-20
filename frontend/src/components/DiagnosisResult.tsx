import { useMemo, useState } from 'react';
import { CheckCircle, FileText, Heart, Brain, Wind, Download, Eye, ChevronDown, Calendar, Package, Zap } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { SmartDropdown, DropdownItem } from './SmartDropdown';
import { SpecialistReportModal } from './SpecialistReportModal';
import { AllReportsModal } from './AllReportsModal';
import { caseApi } from '../services/api';
import { downloadBlob } from '../utils/download';
import { formatDateTime, formatExecutionTime } from '../utils/diagnosisHelpers';

interface DiagnosisResultProps {
  result: string;
  caseId?: number;
  timestamp?: string;
  model?: string;
  executionTimeMs?: number;
}

export const DiagnosisResult = ({ result, caseId, timestamp, model, executionTimeMs }: DiagnosisResultProps) => {
  const [selectedReport, setSelectedReport] = useState<{ title: string; content: string; icon: typeof Heart } | null>(null);
  const [showAllReports, setShowAllReports] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 导出报告
  const handleExport = async (format: 'pdf' | 'docx' | 'markdown' | 'json') => {
    if (!caseId) {
      alert('无法导出：病例ID缺失');
      return;
    }

    try {
      setExporting(true);
      setShowExportMenu(false);

      const blob = await caseApi.exportDiagnosis(caseId, format);

      downloadBlob(blob, `diagnosis-${caseId}.${format === 'markdown' ? 'md' : format}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  // 提取诊断摘要
  const extractSummary = (markdown: string) => {
    const summaryMatch = markdown.match(/## Final Diagnosis \(Summary\)[\s\S]*?(?=##|$)/);
    if (summaryMatch) {
      return summaryMatch[0];
    }
    return '';
  };

  // 提取专科报告
  const extractSpecialistReports = (markdown: string) => {
    const reports: { title: string; content: string; icon: typeof Heart; bgColor: string; borderColor: string }[] = [];

    // 心脏科
    const cardioMatch = markdown.match(/### Cardiologist[\s\S]*?(?=###|$)/);
    if (cardioMatch) {
      reports.push({
        title: '心脏科',
        content: cardioMatch[0],
        icon: Heart,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      });
    }

    // 心理学
    const psychMatch = markdown.match(/### Psychologist[\s\S]*?(?=###|$)/);
    if (psychMatch) {
      reports.push({
        title: '心理学',
        content: psychMatch[0],
        icon: Brain,
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      });
    }

    // 呼吸科
    const pulmoMatch = markdown.match(/### Pulmonologist[\s\S]*$/);
    if (pulmoMatch) {
      reports.push({
        title: '呼吸科',
        content: pulmoMatch[0],
        icon: Wind,
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200'
      });
    }

    return reports;
  };

  const summary = useMemo(() => extractSummary(result), [result]);
  const specialistReports = useMemo(() => extractSpecialistReports(result), [result]);

  return (
    <>
      {/* 专科报告弹窗 */}
      {selectedReport && (
        <SpecialistReportModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.title}
          content={selectedReport.content}
          icon={selectedReport.icon}
        />
      )}

      {/* 全览报告弹窗 */}
      <AllReportsModal
        isOpen={showAllReports}
        onClose={() => setShowAllReports(false)}
        reports={specialistReports}
      />

      <div className="space-y-6 fade-in">
        {/* 诊断完成提示 - 矩形设计，添加诊断时间和模型信息 */}
        <div className="bg-white border border-gray-200 rounded-none p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-800">诊断完成</h2>
              <p className="text-sm text-gray-600 mt-1 mb-4">AI 智能体分析报告已生成</p>

              {/* 诊断元数据 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                {timestamp && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">诊断时间</p>
                      <p className="text-sm font-medium text-gray-700">{formatDateTime(timestamp)}</p>
                    </div>
                  </div>
                )}

                {model && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">AI 模型</p>
                      <p className="text-sm font-medium text-gray-700">{model}</p>
                    </div>
                  </div>
                )}

                {executionTimeMs !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">执行时间</p>
                      <p className="text-sm font-medium text-gray-700">{formatExecutionTime(executionTimeMs)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* 综合诊断摘要 - 矩形设计 */}
      {summary && (
        <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-700" />
              <h3 className="text-base font-semibold text-gray-800">综合诊断摘要</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="prose prose-base max-w-none text-gray-700">
              <Markdown>{summary}</Markdown>
            </div>
          </div>
        </div>
      )}

      {/* 专科报告 - 卡片式点击弹窗 */}
      <div className="bg-white rounded-none border border-gray-200 shadow-lg relative z-10">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-gray-700" />
              <div>
                <h3 className="text-base font-semibold text-gray-800">专科智能体详细报告</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {specialistReports.length} 个专科分析
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-20">
              <button
                onClick={() => setShowAllReports(true)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-none transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                全览报告
              </button>
              <div className="relative z-30">
                <SmartDropdown
                trigger={
                  <button
                    disabled={exporting || !caseId}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-none transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span>{exporting ? '导出中...' : '导出报告'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>
                }
                isOpen={showExportMenu}
                onToggle={() => setShowExportMenu(!showExportMenu)}
                onClose={() => setShowExportMenu(false)}
                preferredPosition={{ vertical: 'bottom', horizontal: 'right' }}
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
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {specialistReports.map((report, index) => {
              const Icon = report.icon;
              // 根据不同专科设置不同的配色
              const iconColors = {
                '心脏科': { bg: 'bg-red-100', text: 'text-red-600' },
                '心理学': { bg: 'bg-purple-100', text: 'text-purple-600' },
                '呼吸科': { bg: 'bg-cyan-100', text: 'text-cyan-600' }
              };
              const colors = iconColors[report.title as keyof typeof iconColors] || { bg: 'bg-gray-100', text: 'text-gray-600' };

              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-none p-5 transition-all shadow-sm hover:shadow-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedReport(report)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedReport(report)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                      <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                    </div>
                    <h4 className="text-base font-semibold text-gray-800">
                      {report.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    点击查看详细诊断分析
                  </p>
                </div>
              );
            })}
          </div>

          {specialistReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-base">暂无专科报告数据</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};
