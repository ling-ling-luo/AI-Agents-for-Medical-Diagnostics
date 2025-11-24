import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Clock, Trash2 } from 'lucide-react';

interface DropdownOption {
  label: string;
  icon: 'edit' | 'clock' | 'trash';
  color: 'gray' | 'red';
  onClick: () => void;
  needsConfirmation?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
}

const iconMap = {
  edit: Edit,
  clock: Clock,
  trash: Trash2,
};

export const Dropdown = ({ options }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setConfirmingIndex(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    setConfirmingIndex(null);
  };

  const handleOptionClick = (e: React.MouseEvent, option: DropdownOption, index: number) => {
    e.stopPropagation();

    if (option.needsConfirmation && confirmingIndex !== index) {
      // 需要确认的操作，显示确认状态
      setConfirmingIndex(index);
    } else {
      // 执行操作
      option.onClick();
      setIsOpen(false);
      setConfirmingIndex(null);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingIndex(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 更多操作按钮 */}
      <button
        onClick={handleToggle}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="更多操作"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option, index) => {
            const Icon = iconMap[option.icon];
            const isConfirming = confirmingIndex === index;

            return (
              <div key={index}>
                {isConfirming ? (
                  // 确认状态
                  <div className="px-4 py-3 bg-red-50">
                    <p className="text-sm text-red-800 font-medium mb-2">确认删除？</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleOptionClick(e, option, index)}
                        className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        确认
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  // 正常状态
                  <button
                    onClick={(e) => handleOptionClick(e, option, index)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                      option.color === 'red' ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
