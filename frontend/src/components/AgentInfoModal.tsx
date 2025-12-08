import { X } from 'lucide-react';

interface AgentInfo {
  name: string;
  role: string;
  description: string;
  focus: string;
  task: string;
  prompt: string;
  icon: any;
  color: string;
}

interface AgentInfoModalProps {
  agent: AgentInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentInfoModal = ({ agent, isOpen, onClose }: AgentInfoModalProps) => {
  if (!isOpen) return null;

  const Icon = agent.icon;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col slide-in border border-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 模态框头部 - 简洁设计 */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none flex items-center justify-center border border-gray-200">
                <Icon className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{agent.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{agent.role}</p>
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

        {/* 模态框内容 - 简洁布局 */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* 智能体简介 */}
          <div className="pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">智能体简介</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {agent.description}
            </p>
          </div>

          {/* 工作任务 */}
          <div className="py-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">工作任务</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {agent.task}
            </p>
          </div>

          {/* 分析重点 */}
          <div className="py-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">分析重点</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {agent.focus}
            </p>
          </div>

          {/* 提示词模板 */}
          <div className="pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">提示词模板</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-none p-5 overflow-x-auto">
              <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">
                {agent.prompt}
              </pre>
            </div>
          </div>
        </div>

        {/* 模态框底部 - 简洁设计 */}
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
