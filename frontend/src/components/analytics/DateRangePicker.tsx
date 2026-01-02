/**
 * 日期范围选择器组件
 * 支持预设日期范围和自定义日期选择
 */
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { DateRangePreset } from '../../types/analytics';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate?: string, endDate?: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [preset, setPreset] = useState<DateRangePreset>('last30days');

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);

    if (newPreset === 'custom') {
      // 自定义模式，不自动设置日期
      return;
    }

    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start: string;

    switch (newPreset) {
      case 'today':
        start = end;
        break;
      case 'last7days':
        start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'last30days':
        start = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        break;
      case 'last3months':
        start = new Date(today.setMonth(today.getMonth() - 3)).toISOString().split('T')[0];
        break;
      default:
        start = '';
    }

    onChange(start, end);
  };

  return (
    <div className="flex items-center space-x-4">
      {/* 预设日期范围 */}
      <div className="flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-gray-400" />
        <select
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="today">今天</option>
          <option value="last7days">最近7天</option>
          <option value="last30days">最近30天</option>
          <option value="last3months">最近3个月</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      {/* 自定义日期输入 */}
      {preset === 'custom' && (
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onChange(e.target.value, endDate)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">至</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onChange(startDate, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
};
