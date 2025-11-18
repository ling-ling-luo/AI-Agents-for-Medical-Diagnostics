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
    const pulmoMatch = markdown.match(/### Pulmonologist[\s\S]*?(?=###|\Z)/);
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
      {/* 诊断完成提示 */}
      <div className="card bg-green-50 border-green-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
          <div className="flex items-center space-x-3 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">AI 诊断已完成</h2>
              <p className="text-sm text-green-100">多智能体协同分析报告已生成</p>
            </div>
          </div>
        </div>
      </div>

      {/* 综合诊断摘要 */}
      {summary && (
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5">
            <div className="flex items-center space-x-3 text-white">
              <FileText className="w-6 h-6" />
              <h3 className="text-lg font-semibold">综合诊断摘要</h3>
            </div>
          </div>
          <div className="p-6 bg-blue-50">
            <div className="prose prose-lg max-w-none">
              <Markdown>{summary}</Markdown>
            </div>
          </div>
        </div>
      )}

      {/* 专科报告 */}
      <div className="card overflow-hidden">
        <div
          className="cursor-pointer bg-gradient-to-r from-gray-700 to-gray-800 p-5 hover:from-gray-800 hover:to-gray-900 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-semibold">专科智能体详细报告</h3>
                <p className="text-sm text-gray-300">
                  {specialistReports.length} 个专科智能体分析
                </p>
              </div>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              {isExpanded ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-6 space-y-5 bg-gray-50">
            {specialistReports.map((report, index) => {
              const Icon = report.icon;
              return (
                <div
                  key={index}
                  className={`card ${report.bgColor} ${report.borderColor} overflow-hidden slide-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-5">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center border ${report.borderColor}`}>
                        <Icon className="w-5 h-5 text-gray-700" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {report.title}智能体报告
                      </h4>
                    </div>
                    <div className="prose max-w-none">
                      <Markdown>{report.content}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {specialistReports.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">暂无专科报告数据</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 导出报告 */}
      <div className="card overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">完整诊断报告</h4>
                <p className="text-sm text-gray-600">包含所有智能体的详细分析结果</p>
              </div>
            </div>
            <button className="btn-primary inline-flex items-center">
              <Download className="w-4 h-4 mr-2" />
              导出 PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
