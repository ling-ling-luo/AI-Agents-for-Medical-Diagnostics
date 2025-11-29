import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface DropdownPosition {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'right';
}

interface SmartDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  preferredPosition?: DropdownPosition;
  minWidth?: string;
}

/**
 * 智能下拉框组件
 *
 * 特性：
 * - 自动检测可用空间
 * - 智能选择弹出方向（上/下/左/右）
 * - 防止菜单超出视口
 * - 响应窗口滚动和调整大小
 */
export const SmartDropdown = ({
  trigger,
  children,
  isOpen,
  onToggle,
  onClose,
  preferredPosition = { vertical: 'bottom', horizontal: 'right' },
  minWidth = '12rem',
}: SmartDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition>(preferredPosition);
  const [maxHeight, setMaxHeight] = useState<number>(400);

  // 计算最佳位置
  const calculatePosition = () => {
    if (!dropdownRef.current || !menuRef.current || !isOpen) return;

    const triggerRect = dropdownRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const menuHeight = menuRect.height || 300; // 默认高度
    const menuWidth = menuRect.width || 200; // 默认宽度

    // 计算各个方向的可用空间
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const spaceRight = viewportWidth - triggerRect.right;
    const spaceLeft = triggerRect.left;

    let vertical: 'top' | 'bottom' = preferredPosition.vertical;
    let horizontal: 'left' | 'right' = preferredPosition.horizontal;

    // 垂直方向：智能选择
    if (preferredPosition.vertical === 'bottom') {
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        vertical = 'top';
      }
    } else {
      if (spaceAbove < menuHeight && spaceBelow > spaceAbove) {
        vertical = 'bottom';
      }
    }

    // 水平方向：智能选择
    if (preferredPosition.horizontal === 'right') {
      if (spaceRight < menuWidth && spaceLeft > spaceRight) {
        horizontal = 'left';
      }
    } else {
      if (spaceLeft < menuWidth && spaceRight > spaceLeft) {
        horizontal = 'right';
      }
    }

    setPosition({ vertical, horizontal });

    // 计算最大高度（留20px边距）
    const availableHeight = vertical === 'bottom' ? spaceBelow - 20 : spaceAbove - 20;
    setMaxHeight(Math.min(availableHeight, 400));
  };

  // 监听位置变化
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen]);

  // 监听窗口大小变化和滚动
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 生成菜单位置样式
  const getMenuStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      position: 'absolute',
      zIndex: 50,
      minWidth,
      maxHeight: `${maxHeight}px`,
      overflowY: 'auto',
    };

    if (position.vertical === 'bottom') {
      style.top = '100%';
      style.marginTop = '0.5rem';
    } else {
      style.bottom = '100%';
      style.marginBottom = '0.5rem';
    }

    if (position.horizontal === 'right') {
      style.right = 0;
    } else {
      style.left = 0;
    }

    return style;
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* 触发器 */}
      <div onClick={onToggle}>
        {trigger}
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          ref={menuRef}
          style={getMenuStyle()}
          className="bg-white rounded-xl shadow-lg border border-gray-200 py-2"
        >
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * 下拉菜单项组件
 */
interface DropdownItemProps {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export const DropdownItem = ({ icon, label, onClick, danger = false }: DropdownItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
        danger
          ? 'text-red-700 hover:bg-red-50'
          : 'text-gray-700 hover:bg-blue-50'
      }`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
};

/**
 * 下拉菜单分隔线
 */
export const DropdownDivider = () => {
  return <div className="my-1 border-t border-gray-200" />;
};
