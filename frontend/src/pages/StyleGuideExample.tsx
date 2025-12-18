import React from 'react';
import { FileText, Calendar, User, Package, Search, Filter } from 'lucide-react';

/**
 * 风格指南示例页面
 *
 * 设计原则：
 * 1. 统一的卡片层级系统
 * 2. Google 简约风格：矩形、灰色分隔线、少装饰
 * 3. 所有区域使用一致的样式类
 */

const StyleGuideExample: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50">
      {/* 页面头部 - 紧贴顶部 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">页面标题</h1>
          <p className="text-sm text-gray-600 mt-1">页面描述文字</p>
        </div>
      </header>

      {/* 主内容区 - 增加留白 */}
      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* 卡片区域 1：搜索/筛选区 - 标准卡片样式 */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">筛选条件</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索字段
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="输入搜索内容"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  下拉选择
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>选项 1</option>
                  <option>选项 2</option>
                  <option>选项 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日期选择
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                应用筛选
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                重置
              </button>
            </div>
          </div>
        </section>

        {/* 卡片区域 2：统计信息区 - 标准卡片样式 */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">统计信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">总数量</p>
                    <p className="text-xl font-semibold text-gray-900">1,234</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">本月新增</p>
                    <p className="text-xl font-semibold text-gray-900">56</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">活跃用户</p>
                    <p className="text-xl font-semibold text-gray-900">89</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">待处理</p>
                    <p className="text-xl font-semibold text-gray-900">12</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 卡片区域 3：列表/表格区 - 标准卡片样式 */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* 列表头部 */}
          <div className="px-8 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">数据列表</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">共 234 条记录</span>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* 列表内容 */}
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="p-8 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        列表项标题 {item}
                      </h3>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        标签
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      这里是列表项的描述信息，可以显示多行文字内容，使用灰色字体以保持视觉层次。
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        2025-01-15
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        张三
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          <div className="px-8 py-5 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">显示第 1-5 条，共 234 条</span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  上一页
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  2
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  3
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  下一页
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 卡片区域 4：详情区 - 标准卡片样式 */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">详细信息</h2>
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字段名称
                </label>
                <p className="text-base text-gray-900">字段值内容</p>
              </div>
              <div className="pb-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  长文本字段
                </label>
                <p className="text-base text-gray-900 leading-relaxed">
                  这里是较长的文本内容，可以显示多行。使用灰色分隔线来区分不同的字段区域，
                  保持整体的简洁和清晰。所有卡片使用统一的样式，确保视觉一致性。
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最后字段
                </label>
                <p className="text-base text-gray-900">最后一个字段不需要底部边框</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 设计规范说明 */}
      <aside className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h3 className="text-base font-semibold text-blue-900 mb-4">设计规范总结</h3>
          <ul className="space-y-3 text-sm text-blue-800">
            <li><strong>卡片样式：</strong>bg-white + border border-gray-200 + rounded-lg + shadow-sm</li>
            <li><strong>间距系统：</strong>外部 space-y-8 (2rem)，内部 p-8 (2rem)</li>
            <li><strong>分隔线：</strong>border-gray-200 用于区分区域</li>
            <li><strong>留白原则：</strong>增加区域间距和内边距，让页面呼吸感更好</li>
            <li><strong>页面结构：</strong>flex-1 确保页面紧贴顶部，无多余空白</li>
            <li><strong>文字层级：</strong>
              <ul className="ml-4 mt-2 space-y-1">
                <li>• 主标题：text-2xl font-semibold text-gray-900</li>
                <li>• 副标题：text-lg font-semibold text-gray-900</li>
                <li>• 正文：text-base text-gray-900</li>
                <li>• 辅助文字：text-sm text-gray-600</li>
                <li>• 次要信息：text-sm text-gray-500</li>
              </ul>
            </li>
            <li><strong>按钮样式：</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• 主按钮：bg-blue-600 text-white hover:bg-blue-700</li>
                <li>• 次按钮：border border-gray-300 text-gray-700 hover:bg-gray-50</li>
              </ul>
            </li>
            <li><strong>圆角：</strong>统一使用 rounded-lg (0.5rem)</li>
            <li><strong>阴影：</strong>统一使用 shadow-sm (轻微阴影)</li>
            <li><strong>背景色：</strong>页面 bg-gray-50，卡片 bg-white</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default StyleGuideExample;
