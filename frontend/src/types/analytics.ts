/**
 * 数据分析模块的TypeScript类型定义
 */

// ============ API响应类型 ============

/**
 * 概览数据
 */
export interface OverviewData {
  total_cases: number;
  total_diagnoses: number;
  avg_execution_time_ms: number;
  completion_rate: number;
  active_users: number;
  date_range: {
    start: string | null;
    end: string | null;
  };
}

/**
 * 年龄分布数据项
 */
export interface AgeDistributionItem {
  age_group: string;
  count: number;
}

/**
 * 性别分布数据项
 */
export interface GenderDistributionItem {
  gender: string;
  count: number;
}

/**
 * 年龄-性别矩阵数据项 [age_group, gender, count]
 */
export type AgeGenderMatrixItem = [string, string, number];

/**
 * 人口统计数据
 */
export interface DemographicsData {
  age_distribution: AgeDistributionItem[];
  gender_distribution: GenderDistributionItem[];
  age_gender_matrix: AgeGenderMatrixItem[];
}

/**
 * 时间序列数据项
 */
export interface TimeSeriesItem {
  date: string;
  count: number;
}

/**
 * 趋势数据
 */
export interface TrendsData {
  series: TimeSeriesItem[];
  granularity: 'day' | 'week' | 'month';
}

/**
 * 执行时间统计
 */
export interface ExecutionTimeStats {
  min: number;
  max: number;
  avg: number;
  median: number;
}

/**
 * 诊断性能数据
 */
export interface PerformanceData {
  execution_time_stats: ExecutionTimeStats;
  total_diagnoses: number;
}

/**
 * 模型统计数据项
 */
export interface ModelStatsItem {
  model_name: string;
  usage_count: number;
  avg_execution_time_ms: number;
}

/**
 * 模型对比数据
 */
export interface ModelComparisonData {
  models: ModelStatsItem[];
}

/**
 * 用户活动数据项
 */
export interface UserActivityItem {
  user_id: number;
  username: string;
  full_name: string;
  case_count: number;
  diagnosis_count: number;
}

/**
 * 用户活动数据
 */
export interface UserActivityData {
  top_creators: UserActivityItem[];
}

// ============ API响应包装类型 ============

export interface AnalyticsApiResponse<T> {
  success: boolean;
  data: T;
}

// ============ 筛选条件类型 ============

/**
 * 分析筛选条件
 */
export interface AnalyticsFilters {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  creator_id?: number;
  model_name?: string;
  granularity?: 'day' | 'week' | 'month';
}

/**
 * 日期范围预设
 */
export type DateRangePreset = 'today' | 'last7days' | 'last30days' | 'last3months' | 'custom';

/**
 * 导出格式
 */
export type ExportFormat = 'pdf' | 'excel';

/**
 * 报告类型
 */
export type ReportType = 'overview' | 'demographics' | 'trends' | 'performance';
