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
    <div className="space-y-6 fade-in">
      {/* 诊断完成提示 - 增强质感 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-gray-800">诊断完成</h2>
            <p className="text-sm text-gray-600 mt-1">AI 智能体分析报告已生成</p>
          </div>
        </div>
      </div>

      {/* 综合诊断摘要 - 增强质感 */}
      {summary && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50">
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

      {/* 专科报告 - 增强质感和层级感 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div
          className="px-6 py-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 cursor-pointer hover:from-blue-100 hover:to-cyan-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
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
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="p-6 space-y-5 bg-gradient-to-br from-gray-50 to-blue-50/30">
            {specialistReports.map((report, index) => {
              const Icon = report.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden slide-in shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-inner">
                        <Icon className="w-4 h-4 text-gray-700" />
                      </div>
                      <h4 className="text-base font-semibold text-gray-800">
                        {report.title}
                      </h4>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="prose prose-base max-w-none text-gray-700">
                      <Markdown>{report.content}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {specialistReports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-base">暂无专科报告数据</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 导出报告 - 增强质感 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-inner">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-800">完整诊断报告</h4>
              <p className="text-sm text-gray-600 mt-1">包含所有智能体的详细分析结果</p>
            </div>
          </div>
          <button className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow hover:shadow-md">
            <Download className="w-4 h-4" />
            导出 PDF
          </button>
        </div>
      </div>
    </div>
  );
};
