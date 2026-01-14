import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import type { DiagnosisFilters } from '../types';
import { caseApi, settingsApi } from '../services/api';
import { DateRangeFilter } from './DateRangeFilter';

interface DiagnosisFiltersProps {
  filters: DiagnosisFilters;
  onFiltersChange: (filters: DiagnosisFilters) => void;
  onReset: () => void;
}

export const DiagnosisFiltersComponent: React.FC<DiagnosisFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const [localFilters, setLocalFilters] = useState<DiagnosisFilters>(filters);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; provider: string }>>([]);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // 从系统设置获取模型列表
    settingsApi.getAvailableModels().then(providers => {
      const flatModels: Array<{ id: string; name: string; provider: string }> = [];
      for (const provider of providers) {
        for (const model of provider.models) {
          flatModels.push({
            id: model.model_id,
            name: model.display_name,
            provider: provider.provider_name
          });
        }
      }
      setAvailableModels(flatModels);
    }).catch(() => {
      // 回退到旧 API
      caseApi.getAvailableModels().then(data => {
        setAvailableModels(data.models);
      });
    });
  }, []);

  // 自动触发筛选
  useEffect(() => {
    onFiltersChange(localFilters);
  }, [localFilters]);

  const handleInputChange = (field: keyof DiagnosisFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            病例号
          </label>
          <input
            type="text"
            value={localFilters.patient_id || ''}
            onChange={(e) => handleInputChange('patient_id', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
            placeholder="输入病例号"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            患者姓名
          </label>
          <input
            type="text"
            value={localFilters.patient_name || ''}
            onChange={(e) => handleInputChange('patient_name', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
            placeholder="输入患者姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            AI 模型
          </label>
          <select
            value={localFilters.model || ''}
            onChange={(e) => handleInputChange('model', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white cursor-pointer"
          >
            <option value="">全部模型</option>
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            诊断时间
            <div className="relative">
              <HelpCircle
                className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              {showTooltip && (
                <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                  <div className="space-y-2">
                    <p className="font-semibold">日期筛选使用说明：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>单击某日期：选择该单日</li>
                      <li>单击两个不同日期：选择时间段</li>
                      <li>长按拖动：快速选择连续时间段</li>
                      <li>快捷按钮：选择常用时间段</li>
                    </ul>
                  </div>
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                </div>
              )}
            </div>
          </label>
          <DateRangeFilter
            value={{
              from: localFilters.created_from || '',
              to: localFilters.created_to || ''
            }}
            onChange={(range) => {
              setLocalFilters(prev => ({
                ...prev,
                created_from: range.from || undefined,
                created_to: range.to || undefined
              }));
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            创建者
          </label>
          <input
            type="text"
            value={localFilters.creator_username || ''}
            onChange={(e) => handleInputChange('creator_username', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
            placeholder="输入用户名"
          />
        </div>

        {/* 重置按钮 */}
        <div className="flex items-end justify-end">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-400 font-medium transition-all cursor-pointer"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
};
