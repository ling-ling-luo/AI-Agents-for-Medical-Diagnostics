import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface OpenCase {
  id: number;
  patient_name: string;
  patient_id: string;
}

interface NavigationContextType {
  expandedItems: Record<string, boolean>;
  toggleItem: (path: string) => void;
  expandItem: (path: string) => void;
  collapseItem: (path: string) => void;
  expandToCase: (caseId: number) => void;
  openCases: OpenCase[];
  addOpenCase: (case_: OpenCase) => void;
  removeOpenCase: (caseId: number) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const STORAGE_KEY = 'nav-expanded-items';
const OPEN_CASES_KEY = 'nav-open-cases';

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    // 从 localStorage 读取初始状态
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [openCases, setOpenCases] = useState<OpenCase[]>(() => {
    // 从 localStorage 读取已打开的病例
    try {
      const stored = localStorage.getItem(OPEN_CASES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 持久化 expandedItems 到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedItems));
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }, [expandedItems]);

  // 持久化 openCases 到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(OPEN_CASES_KEY, JSON.stringify(openCases));
    } catch (error) {
      console.error('Failed to save open cases:', error);
    }
  }, [openCases]);

  const toggleItem = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const expandItem = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: true
    }));
  };

  const collapseItem = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: false
    }));
  };

  const expandToCase = (_caseId: number) => {
    // 展开病例列表菜单项
    setExpandedItems(prev => ({
      ...prev,
      '/cases': true
    }));
  };

  const addOpenCase = (case_: OpenCase) => {
    setOpenCases(prev => {
      // 检查是否已经存在
      const exists = prev.find(c => c.id === case_.id);
      if (exists) {
        return prev;
      }
      // 添加到列表
      return [...prev, case_];
    });
    // 自动展开病例列表
    expandItem('/cases');
  };

  const removeOpenCase = (caseId: number) => {
    setOpenCases(prev => prev.filter(c => c.id !== caseId));
  };

  const value: NavigationContextType = {
    expandedItems,
    toggleItem,
    expandItem,
    collapseItem,
    expandToCase,
    openCases,
    addOpenCase,
    removeOpenCase
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
