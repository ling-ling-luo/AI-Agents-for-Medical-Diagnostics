import { BarChart3 } from 'lucide-react';

export const DataAnalysis = () => {
  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">数据分析功能正在开发中</h2>
        <p className="text-gray-600 mb-6">
          我们正在努力为您打造强大的数据分析功能，敬请期待！
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          返回上一页
        </button>
      </div>
    </div>
  );
};