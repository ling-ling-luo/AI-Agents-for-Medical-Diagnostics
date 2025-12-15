import type React from 'react';
import Markdown from 'markdown-to-jsx';
import { BaseModal } from './BaseModal';

interface SpecialistReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SpecialistReportModal = ({
  isOpen,
  onClose,
  title,
  content,
  icon: Icon,
}: SpecialistReportModalProps) => {
  // 根据不同专科设置不同的配色
  const iconColors: Record<string, { bg: string; text: string }> = {
    '心脏科': { bg: 'bg-red-100', text: 'text-red-600' },
    '心理学': { bg: 'bg-purple-100', text: 'text-purple-600' },
    '呼吸科': { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  };
  const colors = iconColors[title] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${title}专科智能体报告`}
      subtitle="详细诊断分析"
      headerIcon={
        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      }
      maxWidthClass="max-w-4xl"
      footer={
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-none transition-colors text-sm font-medium"
        >
          关闭
        </button>
      }
    >
      <div className="prose prose-base max-w-none text-gray-700">
        <Markdown>{content}</Markdown>
      </div>
    </BaseModal>
  );
};
