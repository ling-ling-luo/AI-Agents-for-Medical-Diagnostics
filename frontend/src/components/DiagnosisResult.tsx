import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, FileText, Heart, Brain, Wind, Sparkles, Download, Star } from 'lucide-react';
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
    const reports: { title: string; content: string; icon: any; gradient: string; emoji: string }[] = [];

    // 心脏科
    const cardioMatch = markdown.match(/### Cardiologist[\s\S]*?(?=###|\Z)/);
    if (cardioMatch) {
      reports.push({
        title: '心脏科',
        content: cardioMatch[0],
        icon: Heart,
        gradient: 'from-red-500 via-pink-500 to-rose-500',
        emoji: '❤️'
      });
    }

    // 心理学
    const psychMatch = markdown.match(/### Psychologist[\s\S]*?(?=###|\Z)/);
    if (psychMatch) {
      reports.push({
        title: '心理学',
        content: psychMatch[0],
        icon: Brain,
        gradient: 'from-purple-500 via-indigo-500 to-blue-500',
        emoji: '🧠'
      });
    }

    // 呼吸科
    const pulmoMatch = markdown.match(/### Pulmonologist[\s\S]*?(?=###|\Z)/);
    if (pulmoMatch) {
      reports.push({
        title: '呼吸科',
        content: pulmoMatch[0],
        icon: Wind,
        gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
        emoji: '💨'
      });
    }

    return reports;
  };

  const summary = extractSummary(result);
  const specialistReports = extractSpecialistReports(result);

  return (
    <div className="space-y-8">
      {/* 超级彩色诊断完成提示 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
        <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl shadow-2xl p-8 border-4 border-white">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mr-6 shadow-2xl transform rotate-12 group-hover:rotate-0 transition-transform">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
                ✅ AI 诊断已完成！
              </h2>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-white/30 backdrop-blur-lg rounded-full text-white font-bold text-sm border-2 border-white/50">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  多智能体协同分析
                </span>
                <span className="px-4 py-2 bg-white/30 backdrop-blur-lg rounded-full text-white font-bold text-sm border-2 border-white/50">
                  <Star className="w-4 h-4 inline mr-1" />
                  报告已生成
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 超彩色诊断摘要 */}
      {summary && (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-8">
              <div className="flex items-center text-white">
                <div className="w-16 h-16 bg-white/30 backdrop-blur-lg rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black drop-shadow-lg">⭐ 综合诊断摘要</h3>
                  <p className="text-white/90 font-semibold mt-1">AI 智能体协同分析结果</p>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="prose prose-lg max-w-none text-gray-800">
                <Markdown>{summary}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 专科报告 - 超级彩色可折叠 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
          <div
            className="cursor-pointer bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-8 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center text-white">
                <div className="w-16 h-16 bg-white/30 backdrop-blur-lg rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black drop-shadow-lg">🤖 专科智能体详细报告</h3>
                  <p className="text-white/90 font-semibold mt-1">
                    {specialistReports.length} 个专科智能体分析 · 点击{isExpanded ? '收起' : '展开'}
                  </p>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/30 backdrop-blur-lg rounded-full flex items-center justify-center shadow-xl">
                {isExpanded ? (
                  <ChevronUp className="w-8 h-8 text-white" />
                ) : (
                  <ChevronDown className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="p-8 space-y-6 bg-gradient-to-br from-gray-50 to-white">
              {specialistReports.map((report, index) => {
                const Icon = report.icon;
                return (
                  <div key={index} className="group relative transform hover:scale-105 transition-all">
                    <div className={`absolute inset-0 bg-gradient-to-r ${report.gradient} rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                    <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                      <div className={`bg-gradient-to-r ${report.gradient} p-6`}>
                        <div className="flex items-center text-white">
                          <div className="w-14 h-14 bg-white/30 backdrop-blur-lg rounded-2xl flex items-center justify-center mr-4 shadow-xl transform -rotate-6 group-hover:rotate-0 transition-transform">
                            <Icon className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-black drop-shadow-lg">
                              {report.emoji} {report.title}智能体报告
                            </h4>
                            <p className="text-white/90 font-semibold text-sm mt-1">专科分析报告</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                        <div className="prose prose-base max-w-none text-gray-700">
                          <Markdown>{report.content}</Markdown>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {specialistReports.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-lg font-semibold">暂无专科报告数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 超彩色下载按钮 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
          <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-800">📄 完整诊断报告</h4>
                  <p className="text-gray-600 font-semibold mt-1">包含所有智能体的详细分析结果</p>
                </div>
              </div>
              <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl font-black text-lg transform hover:scale-105 flex items-center">
                <Download className="w-6 h-6 mr-2" />
                导出 PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
