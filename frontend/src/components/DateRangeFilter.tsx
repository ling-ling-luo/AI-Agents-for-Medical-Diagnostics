/**
 * 日期范围筛选组件 - 仿参考图样式
 * 特点：
 * 1. 两个独立的日期选择输入框（开始/结束）
 * 2. 点击输入框展开日历面板
 * 3. 快捷选项：今天、昨天、最近7天、最近14天
 * 4. 月份导航
 */
import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangeFilterProps {
  value: { from: string; to: string };
  onChange: (range: { from: string; to: string }) => void;
}

type CalendarType = 'from' | 'to' | null;

export const DateRangeFilter = ({ value, onChange }: DateRangeFilterProps) => {
  const [activeCalendar, setActiveCalendar] = useState<CalendarType>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [tempFrom, setTempFrom] = useState(value.from);
  const [tempTo, setTempTo] = useState(value.to);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveCalendar(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 同步外部值
  useEffect(() => {
    setTempFrom(value.from);
    setTempTo(value.to);
  }, [value]);

  // 格式化日期显示
  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return 'Please select';
    return dateStr;
  };

  // 生成日历数据
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // 填充前置空白
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 填充实际日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // 月份导航
  const navigateMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  // 选择日期
  const selectDate = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = selectedDate.toISOString().split('T')[0];

    if (activeCalendar === 'from') {
      setTempFrom(dateStr);
      // 如果结束日期早于开始日期，自动调整
      if (tempTo && dateStr > tempTo) {
        setTempTo(dateStr);
      }
    } else if (activeCalendar === 'to') {
      setTempTo(dateStr);
      // 如果开始日期晚于结束日期，自动调整
      if (tempFrom && dateStr < tempFrom) {
        setTempFrom(dateStr);
      }
    }
  };

  // 快捷选项
  const applyQuickOption = (option: 'today' | 'yesterday' | 'last7days' | 'last14days') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (option) {
      case 'today': {
        const dateStr = today.toISOString().split('T')[0];
        setTempFrom(dateStr);
        setTempTo(dateStr);
        break;
      }
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        setTempFrom(dateStr);
        setTempTo(dateStr);
        break;
      }
      case 'last7days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 6);
        setTempFrom(from.toISOString().split('T')[0]);
        setTempTo(today.toISOString().split('T')[0]);
        break;
      }
      case 'last14days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 13);
        setTempFrom(from.toISOString().split('T')[0]);
        setTempTo(today.toISOString().split('T')[0]);
        break;
      }
    }
  };

  // 确认选择
  const handleOK = () => {
    onChange({ from: tempFrom, to: tempTo });
    setActiveCalendar(null);
  };

  // 取消
  const handleCancel = () => {
    setTempFrom(value.from);
    setTempTo(value.to);
    setActiveCalendar(null);
  };

  const days = getDaysInMonth(viewDate);
  const monthYear = viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // 判断日期是否被选中
  const isSelected = (day: number) => {
    const dateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0];
    return dateStr === tempFrom || dateStr === tempTo;
  };

  // 判断日期是否在范围内
  const isInRange = (day: number) => {
    if (!tempFrom || !tempTo) return false;
    const dateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0];
    return dateStr >= tempFrom && dateStr <= tempTo;
  };

  return (
    <div className="relative col-span-2" ref={dropdownRef}>
      {/* 输入框 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveCalendar('from');
            setViewDate(tempFrom ? new Date(tempFrom) : new Date());
          }}
          className="w-full px-3 py-1.5 border border-gray-200 text-sm text-left focus:outline-none focus:border-blue-400 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-gray-500"
        >
          <span>{formatDisplay(tempFrom)}</span>
          <Calendar className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveCalendar('to');
            setViewDate(tempTo ? new Date(tempTo) : new Date());
          }}
          className="w-full px-3 py-1.5 border border-gray-200 text-sm text-left focus:outline-none focus:border-blue-400 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-gray-500"
        >
          <span>{formatDisplay(tempTo)}</span>
          <Calendar className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
        </button>
      </div>

      {/* 日历面板 */}
      {activeCalendar && (
        <div className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 shadow-lg p-4 w-80">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigateMonth(-12)}
                className="p-1 hover:bg-gray-100 text-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
                <ChevronLeft className="w-4 h-4 -ml-3" />
              </button>
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="p-1 hover:bg-gray-100 text-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <span className="text-sm font-medium text-gray-800">{monthYear}</span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-gray-100 text-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigateMonth(12)}
                className="p-1 hover:bg-gray-100 text-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
                <ChevronRight className="w-4 h-4 -ml-3" />
              </button>
            </div>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((day, index) => (
              <div key={index} className="text-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDate(day)}
                    className={`w-8 h-8 text-sm transition-colors ${
                      isSelected(day)
                        ? 'bg-blue-500 text-white font-medium'
                        : isInRange(day)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-8 h-8"></div>
                )}
              </div>
            ))}
          </div>

          {/* 快捷选项 */}
          <div className="grid grid-cols-4 gap-2 mb-4 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => applyQuickOption('last14days')}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Last 14 Days
            </button>
            <button
              type="button"
              onClick={() => applyQuickOption('last7days')}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => applyQuickOption('yesterday')}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => applyQuickOption('today')}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Today
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-xs text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOK}
              className="px-4 py-1.5 bg-blue-500 text-white text-xs hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
