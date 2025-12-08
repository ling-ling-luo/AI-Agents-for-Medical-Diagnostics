import { X } from 'lucide-react';
import Markdown from 'markdown-to-jsx';

interface Report {
  title: string;
  content: string;
  icon: any;
}

interface AllReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: Report[];
}

export const AllReportsModal = ({ isOpen, onClose, reports }: AllReportsModalProps) => {
  if (!isOpen) return null;

  // 根据不同专科设置不同的配色
  const getIconColors = (title: string) => {
    const iconColors: Record<string, { bg: string; text: string }> = {
      '心脏科': { bg: 'bg-red-100', text: 'text-red-600' },
      '心理学': { bg: 'bg-purple-100', text: 'text-purple-600' },
      '呼吸科': { bg: 'bg-cyan-100', text: 'text-cyan-600' }
    };
    return iconColors[title] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col slide-in border border-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 模态框头部 */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">专科智能体全览报告</h2>
              <p className="text-sm text-gray-500 mt-1">{reports.length} 个专科详细分析</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-none transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 模态框内容 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {reports.map((report, index) => {
              const Icon = report.icon;
              const colors = getIconColors(report.title);

              return (
                <div key={index}>
                  {/* 专科标题 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                      <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{report.title}专科智能体</h3>
                  </div>

                  {/* 报告内容 */}
                  <div className="prose prose-base max-w-none text-gray-700 pl-13">
                    <Markdown>{report.content}</Markdown>
                  </div>

                  {/* 分隔线（最后一个不显示） */}
                  {index < reports.length - 1 && (
                    <div className="mt-8 border-b border-gray-200"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 模态框底部 */}
        <div className="px-8 py-5 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-none transition-colors text-sm font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
