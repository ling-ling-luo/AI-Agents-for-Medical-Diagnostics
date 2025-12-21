/**
 * 日期范围筛选组件 - 仿参考图样式
 * 特点：
 * 1. 两个独立的日期选择输入框（开始/结束）
 * 2. 点击输入框展开日历面板
 * 3. 快捷选项：今天、昨天、最近7天、最近14天
 * 4. 月份导航
 */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangeFilterProps {
  value: { from: string; to: string };
  onChange: (range: { from: string; to: string }) => void;
}

type CalendarType = 'from' | 'to' | null;

export const DateRangeFilter = ({ value, onChange }: DateRangeFilterProps) => {
  const { t } = useTranslation();
  const [activeCalendar, setActiveCalendar] = useState<CalendarType>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const [tempFromDate, setTempFromDate] = useState(value.from);
  const [tempToDate, setTempToDate] = useState(value.to);

  // 拖拽选择状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false); // 记录鼠标是否移动过
  const [clickCount, setClickCount] = useState(0); // 记录点击次数

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 辅助函数：将Date对象转换为本地YYYY-MM-DD格式字符串
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // 全局监听鼠标松开（处理拖拽结束）
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging || dragStartDate) {
        setIsDragging(false);
        setDragStartDate(null);
        setHasMoved(false);
      }
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragStartDate]);

  // 同步外部值
  useEffect(() => {
    setTempFromDate(value.from);
    setTempToDate(value.to);
    // 根据当前日期范围初始化点击计数
    if (value.from && value.to && value.from === value.to) {
      // 单日选择状态，下次点击会设置范围
      setClickCount(1);
    } else {
      // 空状态或已有范围，下次点击会设置单日
      setClickCount(0);
    }
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
    const dateStr = formatDateToLocal(selectedDate);

    console.log('selectDate called:', { day, dateStr, clickCount, tempFromDate, tempToDate });

    if (clickCount === 0) {
      // 第一次点击：起始日期和结束日期都设置为同一天
      console.log('First click: setting both dates to', dateStr);
      setTempFromDate(dateStr);
      setTempToDate(dateStr);
      setClickCount(1);
    } else {
      // 第二次点击：根据时间先后顺序设置范围
      console.log('Second click: adjusting range');
      if (dateStr < tempFromDate) {
        // 点击的日期早于起始日期，将其设为起始日期
        console.log('Date is before from, updating from:', dateStr);
        setTempFromDate(dateStr);
      } else if (dateStr > tempToDate) {
        // 点击的日期晚于结束日期，将其设为结束日期
        console.log('Date is after to, updating to:', dateStr);
        setTempToDate(dateStr);
      } else {
        // 点击的日期在范围内，重置为该日期
        console.log('Date is in range, resetting to single date:', dateStr);
        setTempFromDate(dateStr);
        setTempToDate(dateStr);
      }
      setClickCount(0); // 重置点击计数，准备下一轮选择
    }
  };

  // 处理鼠标按下
  const handleDateMouseDown = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatDateToLocal(selectedDate);

    console.log('Mouse down on:', dateStr);
    setDragStartDate(dateStr);
    setHasMoved(false);
  };

  // 处理鼠标移入（拖拽）
  const handleDateMouseEnter = (day: number) => {
    if (!dragStartDate) return;

    // 鼠标移动了，标记为拖拽模式
    if (!hasMoved) {
      console.log('Drag started from:', dragStartDate);
      setHasMoved(true);
      setIsDragging(true);
      setTempFromDate(dragStartDate);
      setTempToDate(dragStartDate);
    }

    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatDateToLocal(selectedDate);

    console.log('Dragging to:', dateStr);

    // 根据拖拽方向设置起始和结束日期
    if (dateStr >= dragStartDate) {
      setTempFromDate(dragStartDate);
      setTempToDate(dateStr);
    } else {
      setTempFromDate(dateStr);
      setTempToDate(dragStartDate);
    }
  };

  // 处理鼠标松开
  const handleDateMouseUp = (day?: number) => {
    console.log('Mouse up on:', day, 'hasMoved:', hasMoved);

    if (hasMoved) {
      // 发生了拖拽，重置点击计数
      console.log('Drag completed, resetting click count');
      setClickCount(0);
    } else if (day !== undefined) {
      // 没有移动，这是纯点击
      console.log('Pure click detected, calling selectDate');
      selectDate(day);
    }

    // 清理拖拽状态
    setIsDragging(false);
    setDragStartDate(null);
    setHasMoved(false);
  };

  // 快捷选项
  const applyQuickOption = (option: 'today' | 'yesterday' | 'last7days' | 'last14days') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (option) {
      case 'today': {
        const dateStr = formatDateToLocal(today);
        setTempFromDate(dateStr);
        setTempToDate(dateStr);
        setClickCount(1); // 单日选择，下次点击会设置范围
        break;
      }
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = formatDateToLocal(yesterday);
        setTempFromDate(dateStr);
        setTempToDate(dateStr);
        setClickCount(1); // 单日选择，下次点击会设置范围
        break;
      }
      case 'last7days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 6);
        setTempFromDate(formatDateToLocal(from));
        setTempToDate(formatDateToLocal(today));
        setClickCount(0); // 范围选择，下次点击会设置单日
        break;
      }
      case 'last14days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 13);
        setTempFromDate(formatDateToLocal(from));
        setTempToDate(formatDateToLocal(today));
        setClickCount(0); // 范围选择，下次点击会设置单日
        break;
      }
    }
  };

  // 确认选择
  const handleOK = () => {
    onChange({ from: tempFromDate, to: tempToDate });
    setActiveCalendar(null);
  };

  // 取消
  const handleCancel = () => {
    setTempFromDate(value.from);
    setTempToDate(value.to);
    setActiveCalendar(null);
  };

  const days = getDaysInMonth(viewDate);
  const monthYear = viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // 判断日期是否被选中
  const isSelected = (day: number) => {
    const dateStr = formatDateToLocal(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    return dateStr === tempFromDate || dateStr === tempToDate;
  };

  // 判断日期是否在范围内
  const isInRange = (day: number) => {
    if (!tempFromDate || !tempToDate) return false;
    const dateStr = formatDateToLocal(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    return dateStr >= tempFromDate && dateStr <= tempToDate;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* 单一输入框，内含两个日期区域 */}
      <div className="relative w-full border border-gray-300 rounded hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white flex items-center">
        {/* 开始日期 */}
        <button
          type="button"
          onClick={() => {
            setActiveCalendar('from');
            setViewDate(tempFromDate ? new Date(tempFromDate) : new Date());
          }}
          className="flex-1 px-3 py-2.5 text-base text-left focus:outline-none text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className={tempFromDate ? '' : 'text-gray-400'}>
            {tempFromDate || t('caseList.dateFrom')}
          </span>
        </button>

        {/* 分隔符 */}
        <span className="text-gray-400 text-base px-1">~</span>

        {/* 结束日期 */}
        <button
          type="button"
          onClick={() => {
            setActiveCalendar('to');
            setViewDate(tempToDate ? new Date(tempToDate) : new Date());
          }}
          className="flex-1 px-3 py-2.5 text-base text-left focus:outline-none text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className={tempToDate ? '' : 'text-gray-400'}>
            {tempToDate || t('caseList.dateTo')}
          </span>
        </button>

        {/* 日历图标 */}
        <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
      </div>

      {/* 日历面板 */}
      {activeCalendar && (
        <div className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 shadow-lg p-4 w-80">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {/* 上一年（双左箭头）*/}
              <button
                type="button"
                onClick={() => navigateMonth(-12)}
                className="p-1 hover:bg-gray-100 text-gray-600 flex items-center"
              >
                <ChevronLeft className="w-3.5 h-3.5 -mr-2" />
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {/* 上一月（单左箭头）*/}
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
              {/* 下一月（单右箭头）*/}
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-gray-100 text-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* 下一年（双右箭头）*/}
              <button
                type="button"
                onClick={() => navigateMonth(12)}
                className="p-1 hover:bg-gray-100 text-gray-600 flex items-center"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <ChevronRight className="w-3.5 h-3.5 -ml-2" />
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
          <div
            className="grid grid-cols-7 gap-1 mb-4"
            onMouseUp={() => handleDateMouseUp()}
            onMouseLeave={() => handleDateMouseUp()}
          >
            {days.map((day, index) => (
              <div key={index} className="text-center">
                {day ? (
                  <button
                    type="button"
                    onMouseDown={() => handleDateMouseDown(day)}
                    onMouseEnter={() => handleDateMouseEnter(day)}
                    onMouseUp={() => handleDateMouseUp(day)}
                    className={`w-8 h-8 text-sm transition-colors select-none ${
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

          {/* 快捷选项和按钮 */}
          <div className="pt-4 border-t border-gray-300">
            {/* 快捷选项 */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <button
                type="button"
                onClick={() => applyQuickOption('last14days')}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {t('caseList.last14Days')}
              </button>
              <button
                type="button"
                onClick={() => applyQuickOption('last7days')}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {t('caseList.last7Days')}
              </button>
              <button
                type="button"
                onClick={() => applyQuickOption('yesterday')}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {t('caseList.yesterday')}
              </button>
              <button
                type="button"
                onClick={() => applyQuickOption('today')}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {t('caseList.today')}
              </button>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-1.5 text-xs text-gray-600 hover:text-gray-900"
              >
                {t('caseList.cancel')}
              </button>
              <button
                type="button"
                onClick={handleOK}
                className="px-4 py-1.5 bg-blue-500 text-white text-xs hover:bg-blue-600 transition-colors"
              >
                {t('caseList.ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
