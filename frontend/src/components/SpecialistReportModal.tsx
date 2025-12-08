import { X } from 'lucide-react';
import Markdown from 'markdown-to-jsx';

interface SpecialistReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  icon: any;
}

export const SpecialistReportModal = ({
  isOpen,
  onClose,
  title,
  content,
  icon: Icon
}: SpecialistReportModalProps) => {
  if (!isOpen) return null;

  // 根据不同专科设置不同的配色
  const iconColors: Record<string, { bg: string; text: string }> = {
    '心脏科': { bg: 'bg-red-100', text: 'text-red-600' },
    '心理学': { bg: 'bg-purple-100', text: 'text-purple-600' },
    '呼吸科': { bg: 'bg-cyan-100', text: 'text-cyan-600' }
  };
  const colors = iconColors[title] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col slide-in border border-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 模态框头部 */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{title}专科智能体报告</h2>
                <p className="text-sm text-gray-500 mt-1">详细诊断分析</p>
              </div>
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
          <div className="prose prose-base max-w-none text-gray-700">
            <Markdown>{content}</Markdown>
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
