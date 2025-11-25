import { X, Sparkles } from 'lucide-react';

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
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col slide-in border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 模态框头部 - 增强质感 */}
        <div className={`px-8 py-6 border-b border-gray-200 ${agent.color} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Icon className="w-8 h-8 text-gray-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-800">{agent.name}</h2>
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-semibold text-gray-600">{agent.role}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/70 rounded-xl transition-all group"
            >
              <X className="w-6 h-6 text-gray-600 group-hover:text-gray-800 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* 模态框内容 - 增强质感 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-br from-white to-blue-50/30">
          {/* 智能体描述 */}
          <div className="slide-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full shadow"></div>
              智能体简介
            </h3>
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 leading-relaxed">
                {agent.description}
              </p>
            </div>
          </div>

          {/* 工作任务 */}
          <div className="slide-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full shadow"></div>
              工作任务
            </h3>
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 leading-relaxed">
                {agent.task}
              </p>
            </div>
          </div>

          {/* 分析重点 */}
          <div className="slide-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full shadow"></div>
              分析重点
            </h3>
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 leading-relaxed">
                {agent.focus}
              </p>
            </div>
          </div>

          {/* 提示词模板 */}
          <div className="slide-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full shadow"></div>
              提示词模板
            </h3>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 overflow-x-auto shadow-lg border border-gray-700">
              <pre className="text-xs text-gray-100 leading-relaxed whitespace-pre-wrap font-mono">
                {agent.prompt}
              </pre>
            </div>
          </div>
        </div>

        {/* 模态框底部 - 增强质感 */}
        <div className="px-8 py-5 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50/50 flex justify-end rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
          >
            <span>关闭</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
