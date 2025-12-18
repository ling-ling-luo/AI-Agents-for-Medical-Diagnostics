import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  /** 是否使用内边距，默认 true */
  withPadding?: boolean;
  /** 自定义内边距类，默认 'px-8 py-8' */
  paddingClass?: string;
}

/**
 * 页面容器组件
 * 提供统一的背景色和可选的内边距
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  withPadding = true,
  paddingClass = 'px-8 py-8'
}) => {
  return (
    <div className={`flex-1 bg-gray-50 ${withPadding ? paddingClass : ''}`}>
      {children}
    </div>
  );
};
