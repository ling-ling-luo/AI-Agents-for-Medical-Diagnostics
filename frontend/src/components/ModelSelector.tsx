import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Check } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  models: Model[];
}

export const ModelSelector = ({ selectedModel, onModelChange, models }: ModelSelectorProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-white border-2 border-gray-300 hover:border-blue-400 text-sm font-medium text-gray-700 transition-all flex items-center gap-2 shadow-sm hover:shadow min-w-[200px]"
      >
        <Cpu className="w-4 h-4 text-blue-600" />
        <div className="flex-1 text-left">
          <div className="text-xs text-gray-500">{t('modelSelector.aiModel')}</div>
          <div className="text-sm font-semibold text-gray-800 truncate">
            {selectedModelData ? selectedModelData.name : t('modelSelector.selectModel')}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 菜单内容 */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white shadow-xl border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('modelSelector.selectAiModel')}
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between ${
                    selectedModel === model.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{model.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{model.provider}</div>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
