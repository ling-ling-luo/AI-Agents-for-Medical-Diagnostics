import React, { useState, useEffect } from 'react';
import type { DiagnosisFilters } from '../types';
import { caseApi } from '../services/api';

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

  useEffect(() => {
    caseApi.getAvailableModels().then(data => {
      setAvailableModels(data.models);
    });
  }, []);

  const handleInputChange = (field: keyof DiagnosisFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            病例号
          </label>
          <input
            type="text"
            value={localFilters.patient_id || ''}
            onChange={(e) => handleInputChange('patient_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="输入病例号"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            患者姓名
          </label>
          <input
            type="text"
            value={localFilters.patient_name || ''}
            onChange={(e) => handleInputChange('patient_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="输入患者姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI 模型
          </label>
          <select
            value={localFilters.model || ''}
            onChange={(e) => handleInputChange('model', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            诊断时间（从）
          </label>
          <input
            type="date"
            value={localFilters.created_from || ''}
            onChange={(e) => handleInputChange('created_from', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            诊断时间（到）
          </label>
          <input
            type="date"
            value={localFilters.created_to || ''}
            onChange={(e) => handleInputChange('created_to', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            创建者
          </label>
          <input
            type="text"
            value={localFilters.creator_username || ''}
            onChange={(e) => handleInputChange('creator_username', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="输入用户名"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          应用筛选
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          重置
        </button>
      </div>
    </div>
  );
};
