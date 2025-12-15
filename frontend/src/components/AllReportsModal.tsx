import type React from 'react';
import Markdown from 'markdown-to-jsx';
import { BaseModal } from './BaseModal';

interface Report {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AllReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: Report[];
}

export const AllReportsModal = ({ isOpen, onClose, reports }: AllReportsModalProps) => {
  // 根据不同专科设置不同的配色
  const getIconColors = (title: string) => {
    const iconColors: Record<string, { bg: string; text: string }> = {
      '心脏科': { bg: 'bg-red-100', text: 'text-red-600' },
      '心理学': { bg: 'bg-purple-100', text: 'text-purple-600' },
      '呼吸科': { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    };
    return iconColors[title] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="专科智能体全览报告"
      subtitle={`${reports.length} 个专科详细分析`}
      maxWidthClass="max-w-6xl"
      footer={
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-none transition-colors text-sm font-medium"
        >
          关闭
        </button>
      }
    >
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
              {index < reports.length - 1 && <div className="mt-8 border-b border-gray-200"></div>}
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
};
