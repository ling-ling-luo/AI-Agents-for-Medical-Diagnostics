import type React from 'react';
import { BaseModal } from './BaseModal';

interface AgentInfo {
  name: string;
  role: string;
  description: string;
  focus: string;
  task: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AgentInfoModalProps {
  agent: AgentInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentInfoModal = ({ agent, isOpen, onClose }: AgentInfoModalProps) => {
  const Icon = agent.icon;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={agent.name}
      subtitle={agent.role}
      headerIcon={<Icon className="w-6 h-6 text-gray-700" />}
      maxWidthClass="max-w-3xl"
      footer={
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-none transition-colors text-sm font-medium"
        >
          关闭
        </button>
      }
    >
      {/* 智能体简介 */}
      <div className="pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">智能体简介</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{agent.description}</p>
      </div>

      {/* 工作任务 */}
      <div className="py-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">工作任务</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{agent.task}</p>
      </div>

      {/* 分析重点 */}
      <div className="py-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">分析重点</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{agent.focus}</p>
      </div>

      {/* 提示词模板 */}
      <div className="pt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">提示词模板</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-none p-5 overflow-x-auto">
          <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">{agent.prompt}</pre>
        </div>
      </div>
    </BaseModal>
  );
};
