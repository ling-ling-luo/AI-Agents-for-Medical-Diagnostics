# 前端设计系统规范

> 本文档定义了医疗诊断系统前端的统一视觉风格和设计规范，确保所有页面保持一致的用户体验。

## 核心设计原则

### 1. Google 简约风格
- **矩形设计**：使用清晰的矩形布局，避免过度装饰
- **灰色分隔线**：使用细线区分不同区域
- **少装饰**：去除不必要的视觉元素，保持简洁
- **功能优先**：设计服务于功能，不为装饰而装饰

### 2. 层级一致性
- 所有卡片区域使用统一的样式类
- 保持相同的阴影、圆角、边框规范
- 确保视觉上的"可拖动"一致性（即所有区域看起来都是同一层级）

### 3. 清晰可区分
- 使用灰色分隔线明确区分不同区域
- 合理的间距系统确保内容不拥挤
- 通过字体大小和颜色建立清晰的视觉层次

---

## 标准样式类

### 页面布局

```tsx
{/* 页面容器 - 使用 flex-1 确保紧贴顶部 */}
<div className="flex-1 bg-gray-50">

  {/* 页面头部 - 不使用 sticky */}
  <header className="bg-white border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-8 py-6">
      <h1 className="text-2xl font-semibold text-gray-900">页面标题</h1>
      <p className="text-sm text-gray-600 mt-1">页面描述</p>
    </div>
  </header>

  {/* 主内容区 - 更大的间距 */}
  <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
    {/* 卡片区域 */}
  </main>
</div>
```

### 标准卡片区域

**所有卡片必须使用以下统一样式：**

```tsx
<section className="bg-white border border-gray-200 rounded-lg shadow-sm">
  <div className="p-8">
    {/* 卡片内容 */}
  </div>
</section>
```

**关键类说明：**
- `bg-white`：白色背景
- `border border-gray-200`：细灰色边框
- `rounded-lg`：统一圆角（0.5rem）
- `shadow-sm`：轻微阴影
- `p-8`：内边距（2rem = 32px）更宽松的留白

### 带头部的卡片

```tsx
<section className="bg-white border border-gray-200 rounded-lg shadow-sm">
  {/* 头部 - 带底部边框 */}
  <div className="px-8 py-6 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-900">卡片标题</h2>
  </div>

  {/* 内容区 */}
  <div className="p-8">
    {/* 内容 */}
  </div>
</section>
```

### 列表项容器

```tsx
{/* 使用 divide 实现统一分隔线 */}
<div className="divide-y divide-gray-200">
  <div className="p-8 hover:bg-gray-50 transition-colors">
    {/* 列表项内容 */}
  </div>
  <div className="p-8 hover:bg-gray-50 transition-colors">
    {/* 列表项内容 */}
  </div>
</div>
```

---

## 文字层级系统

### 标题层级

```tsx
{/* H1 - 页面主标题 */}
<h1 className="text-2xl font-semibold text-gray-900">页面标题</h1>

{/* H2 - 区域标题 */}
<h2 className="text-lg font-semibold text-gray-900">区域标题</h2>

{/* H3 - 小标题 */}
<h3 className="text-base font-semibold text-gray-900">小标题</h3>
```

### 正文层级

```tsx
{/* 主要正文 */}
<p className="text-base text-gray-900">主要内容</p>

{/* 辅助说明文字 */}
<p className="text-sm text-gray-600">辅助说明</p>

{/* 次要信息（如时间戳） */}
<span className="text-sm text-gray-500">次要信息</span>

{/* 表单标签 */}
<label className="text-sm font-medium text-gray-700">字段名称</label>
```

---

## 按钮样式

### 主按钮（Primary）

```tsx
<button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
  主要操作
</button>
```

### 次按钮（Secondary）

```tsx
<button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
  次要操作
</button>
```

### 危险按钮（Danger）

```tsx
<button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
  删除操作
</button>
```

### 图标按钮

```tsx
<button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
  <Icon className="w-4 h-4 text-gray-600" />
</button>
```

---

## 表单元素

### 输入框

```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="输入内容"
/>
```

### 带图标的搜索框

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <input
    type="text"
    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="搜索"
  />
</div>
```

### 下拉选择

```tsx
<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
  <option>选项 1</option>
  <option>选项 2</option>
</select>
```

---

## 间距系统

### 外部间距（卡片之间）

```tsx
{/* 垂直间距 - 卡片之间 - 增加到 2rem */}
<main className="space-y-8">
  {/* 卡片 1 */}
  {/* 卡片 2 */}
</main>
```

### 内部间距（卡片内）

- 标准内边距：`p-8`（2rem = 32px）提供更宽松的留白
- 头部内边距：`px-8 py-6`（水平 32px，垂直 24px）
- 标题下间距：`mb-6`（1.5rem = 24px）
- 区域分隔：`pt-6 mt-6`（1.5rem = 24px）

### 网格间距

```tsx
{/* 表单网格 - 增加 gap */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* 列内容 */}
</div>
```

---

## 分隔线

### 水平分隔线

```tsx
{/* 区域之间的分隔 */}
<div className="border-t border-gray-200 pt-4 mt-4">
  {/* 内容 */}
</div>

{/* 字段之间的分隔 */}
<div className="pb-4 border-b border-gray-200">
  {/* 字段内容 */}
</div>
```

### 自动分隔线（列表）

```tsx
<div className="divide-y divide-gray-200">
  <div className="p-6">项目 1</div>
  <div className="p-6">项目 2</div>
</div>
```

---

## 标签/徽章

```tsx
{/* 蓝色标签 */}
<span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
  标签文字
</span>

{/* 绿色标签 */}
<span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
  成功
</span>

{/* 红色标签 */}
<span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded">
  错误
</span>
```

---

## 图标规范

### 图标大小

- 小图标（列表/标签）：`w-4 h-4`（16px）
- 中图标（按钮/标题）：`w-5 h-5`（20px）
- 大图标（统计卡片）：`w-6 h-6`（24px）

### 图标容器

```tsx
{/* 彩色图标容器 - 用于统计卡片 */}
<div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
  <Icon className="w-5 h-5 text-blue-600" />
</div>
```

---

## 颜色系统

### 背景色

- 页面背景：`bg-gray-50`
- 卡片背景：`bg-white`
- 悬停背景：`hover:bg-gray-50`

### 边框色

- 标准边框：`border-gray-200`
- 分隔线：`border-gray-200`

### 文字颜色

- 主标题/重要内容：`text-gray-900`
- 正文：`text-gray-900`
- 辅助说明：`text-gray-600`
- 次要信息：`text-gray-500`

### 品牌色

- 主色调（蓝色）：`bg-blue-600` / `text-blue-600`
- 成功（绿色）：`bg-green-600` / `text-green-600`
- 警告（橙色）：`bg-orange-600` / `text-orange-600`
- 错误（红色）：`bg-red-600` / `text-red-600`

---

## 完整示例

参考文件：`frontend/src/pages/StyleGuideExample.tsx`

访问路径：`/style-guide`（需登录）

---

## 迁移现有页面的检查清单

将现有页面调整为新设计系统时，请检查：

- [ ] 页面容器使用 `flex-1 bg-gray-50`（确保紧贴顶部）
- [ ] 所有卡片区域使用标准样式：`bg-white border border-gray-200 rounded-lg shadow-sm`
- [ ] 卡片内边距统一为 `p-8`（2rem = 32px，更宽松的留白）
- [ ] 卡片之间使用 `space-y-8` 间距（2rem）
- [ ] 页面头部使用 `px-8 py-6`
- [ ] 主内容区使用 `px-8 py-8`
- [ ] 标题使用正确的文字层级（H1: text-2xl, H2: text-lg）
- [ ] 标题下间距统一为 `mb-6`
- [ ] 正文使用 `text-base text-gray-900`
- [ ] 辅助文字使用 `text-sm text-gray-600`
- [ ] 分隔线统一使用 `border-gray-200`
- [ ] 按钮使用标准样式（主/次按钮）
- [ ] 表单元素包含 focus 状态
- [ ] 网格间距使用 `gap-6`
- [ ] 所有交互元素包含 `transition-colors`
- [ ] 去除过度装饰（复杂渐变背景、过大阴影等）
- [ ] 移除不必要的 sticky 定位

---

**设计目标**：确保整个应用的所有页面在视觉上保持高度一致，用户能够直观地感受到统一的设计语言。
