import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, FileText, Heart, Brain, Wind, Download } from 'lucide-react';
import Markdown from 'markdown-to-jsx';

interface DiagnosisResultProps {
  result: string;
}

export const DiagnosisResult = ({ result }: DiagnosisResultProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // 提取诊断摘要
  const extractSummary = (markdown: string) => {
    const summaryMatch = markdown.match(/## Final Diagnosis \(Summary\)[\s\S]*?(?=##|\Z)/);
    if (summaryMatch) {
      return summaryMatch[0];
    }
    return '';
  };

  // 提取专科报告
  const extractSpecialistReports = (markdown: string) => {
    const reports: { title: string; content: string; icon: any; bgColor: string; borderColor: string }[] = [];

    // 心脏科
    const cardioMatch = markdown.match(/### Cardiologist[\s\S]*?(?=###|\Z)/);
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
    const psychMatch = markdown.match(/### Psychologist[\s\S]*?(?=###|\Z)/);
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

  const summary = extractSummary(result);
  const specialistReports = extractSpecialistReports(result);

  return (
    <div className="space-y-5 fade-in">
      {/* 诊断完成提示 - 轻量极简 */}
      <div className="bg-gradient-to-br from-green-50/60 to-emerald-50/40 border border-green-200/50 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0" />
          <div>
            <h2 className="text-sm font-medium text-gray-800">诊断完成</h2>
            <p className="text-xs text-gray-600 mt-0.5">AI 智能体分析报告已生成</p>
          </div>
        </div>
      </div>

      {/* 综合诊断摘要 - 轻量极简 */}
      {summary && (
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200/60 bg-gradient-to-br from-blue-50/30 to-cyan-50/20">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-gray-700" />
              <h3 className="text-sm font-medium text-gray-800">综合诊断摘要</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="prose prose-sm max-w-none text-gray-700">
              <Markdown>{summary}</Markdown>
            </div>
          </div>
        </div>
      )}

      {/* 专科报告 - 轻量极简 */}
      <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl overflow-hidden">
        <div
          className="px-5 py-3.5 border-b border-gray-200/60 bg-gradient-to-br from-blue-50/30 to-cyan-50/20 cursor-pointer hover:from-blue-50/40 hover:to-cyan-50/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-gray-700" />
              <div>
                <h3 className="text-sm font-medium text-gray-800">专科智能体详细报告</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {specialistReports.length} 个专科分析
                </p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="p-5 space-y-4 bg-gradient-to-br from-gray-50/30 to-blue-50/10">
            {specialistReports.map((report, index) => {
              const Icon = report.icon;
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl overflow-hidden slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="px-4 py-3 border-b border-gray-100/60 bg-gradient-to-br from-gray-50/40 to-white/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-white border border-gray-200/60 rounded-lg flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-gray-700" />
                      </div>
                      <h4 className="text-xs font-medium text-gray-800">
                        {report.title}
                      </h4>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <Markdown>{report.content}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {specialistReports.length === 0 && (
              <div className="text-center py-10">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2.5" />
                <p className="text-gray-500 text-xs">暂无专科报告数据</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 导出报告 - 轻量极简 */}
      <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-800">完整诊断报告</h4>
              <p className="text-xs text-gray-600 mt-0.5">包含所有智能体的详细分析结果</p>
            </div>
          </div>
          <button className="px-3.5 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-3.5 h-3.5" />
            导出 PDF
          </button>
        </div>
      </div>
    </div>
  );
};
