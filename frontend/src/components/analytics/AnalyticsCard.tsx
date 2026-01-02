/**
 * 分析指标卡片组件
 * 用于显示关键指标（如总病例数、平均执行时间等）
 */
import React from 'react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      {/* 标题和图标 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-gray-700">{title}</h3>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>

      {/* 数值 */}
      <div className="mb-2">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>

      {/* 趋势或副标题 */}
      {trend && (
        <div className="flex items-center">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500 ml-2">vs. 上期</span>
        </div>
      )}
      {subtitle && !trend && (
        <p className="text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
};
