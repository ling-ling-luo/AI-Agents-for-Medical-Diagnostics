/**
 * 图表容器组件
 * 提供统一的加载、错误和空状态处理
 */
import React from 'react';
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  loading = false,
  error = null,
  isEmpty = false,
  children,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      {/* 标题和描述 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* 内容区域 */}
      <div className="relative" style={{ minHeight: '300px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-base text-gray-700 font-medium">加载失败</p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
          </div>
        )}

        {isEmpty && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-base text-gray-500">暂无数据</p>
          </div>
        )}

        {!loading && !error && !isEmpty && children}
      </div>
    </div>
  );
};
