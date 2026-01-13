import axios from 'axios';
import type { Case, CaseDetail, DiagnosisResponse, CreateCaseRequest, CreateCaseResponse, UpdateCaseRequest, DiagnosisHistoryResponse, DiagnosisDetail, AllDiagnosisResponse, DiagnosisFilters } from '../types';
import type {
  OverviewData,
  DemographicsData,
  TrendsData,
  PerformanceData,
  ModelComparisonData,
  UserActivityData,
  AnalyticsApiResponse,
  AnalyticsFilters
} from '../types/analytics';

// 配置 API 基础 URL - 开发环境指向 FastAPI 后端
const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加JWT令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理401错误（令牌过期或无效）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 令牌过期或无效，清除令牌并跳转到登录页
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // 只在非登录页面时跳转
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface ImportCasesResponse {
  success_count: number;
  failed_count: number;
  total_count: number;
  failed_cases: Array<{
    index: number;
    patient_id: string;
    error: string;
  }>;
  message: string;
}

export const caseApi = {
  // 获取病例列表
  getCases: async (): Promise<Case[]> => {
    const response = await api.get<Case[]>('/api/cases');
    return response.data;
  },

  // 获取病例详情
  getCaseDetail: async (caseId: number): Promise<CaseDetail> => {
    const response = await api.get<CaseDetail>(`/api/cases/${caseId}`);
    return response.data;
  },

  // 获取可用的AI模型列表
  getAvailableModels: async (): Promise<{ models: Array<{ id: string; name: string; provider: string }> }> => {
    const response = await api.get('/api/models');
    return response.data;
  },

  // 运行诊断
  runDiagnosis: async (caseId: number, model?: string, language?: string): Promise<DiagnosisResponse> => {
    const response = await api.post<DiagnosisResponse>(
      `/api/cases/${caseId}/run-diagnosis`,
      { model, language }
    );
    return response.data;
  },

  // 新增病例
  createCase: async (data: CreateCaseRequest): Promise<CreateCaseResponse> => {
    const response = await api.post<CreateCaseResponse>('/api/cases', data);
    return response.data;
  },

  // 批量导入病例
  importCases: async (file: File): Promise<ImportCasesResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const response = await axios.post<ImportCasesResponse>(
      `${API_BASE_URL}/api/cases/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return response.data;
  },

  // 删除病例
  deleteCase: async (caseId: number): Promise<{ message: string; deleted_case_id: number }> => {
    const response = await api.delete(`/api/cases/${caseId}`);
    return response.data;
  },

  // 更新病例
  updateCase: async (caseId: number, data: UpdateCaseRequest): Promise<CaseDetail> => {
    const response = await api.put<CaseDetail>(`/api/cases/${caseId}`, data);
    return response.data;
  },

  // 获取诊断历史
  getDiagnosisHistory: async (caseId: number, includeFull: boolean = false): Promise<DiagnosisHistoryResponse> => {
    const response = await api.get<DiagnosisHistoryResponse>(
      `/api/cases/${caseId}/diagnoses`,
      { params: { include_full: includeFull } }
    );
    return response.data;
  },

  // 获取单个诊断详情
  getDiagnosisDetail: async (caseId: number, diagnosisId: number): Promise<DiagnosisDetail> => {
    const response = await api.get<DiagnosisDetail>(`/api/cases/${caseId}/diagnoses/${diagnosisId}`);
    return response.data;
  },

  // 导出最新诊断报告
  exportDiagnosis: async (caseId: number, format: string): Promise<Blob> => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_BASE_URL}/api/cases/${caseId}/export`,
      {
        params: { format },
        responseType: 'blob',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return response.data;
  },

  // 导出指定诊断报告
  exportDiagnosisById: async (caseId: number, diagnosisId: number, format: string): Promise<Blob> => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_BASE_URL}/api/cases/${caseId}/diagnoses/${diagnosisId}/export`,
      {
        params: { format },
        responseType: 'blob',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return response.data;
  },

  // 批量导出诊断报告
  exportDiagnosisBatch: async (caseId: number, diagnosisIds: number[], format: string): Promise<Blob> => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_BASE_URL}/api/cases/${caseId}/export-batch`,
      { diagnosis_ids: diagnosisIds, format },
      {
        responseType: 'blob',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return response.data;
  },

  // 获取全局诊断历史（跨病例）
  getAllDiagnoses: async (page: number = 1, pageSize: number = 20, filters?: DiagnosisFilters): Promise<AllDiagnosisResponse> => {
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
      ...filters
    };

    const response = await api.get<AllDiagnosisResponse>('/api/diagnoses/all', { params });
    return response.data;
  },
};

// ============ 数据分析 API ============
export const analyticsApi = {
  /**
   * 获取概览数据
   */
  getOverview: async (filters?: AnalyticsFilters): Promise<OverviewData> => {
    const params = {
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    };
    const response = await api.get<AnalyticsApiResponse<OverviewData>>('/api/analytics/overview', { params });
    return response.data.data;
  },

  /**
   * 获取人口统计数据
   */
  getDemographics: async (filters?: AnalyticsFilters): Promise<DemographicsData> => {
    const params = {
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      creator_id: filters?.creator_id,
    };
    const response = await api.get<AnalyticsApiResponse<DemographicsData>>('/api/analytics/cases/demographics', { params });
    return response.data.data;
  },

  /**
   * 获取病例趋势数据
   */
  getCaseTrends: async (filters?: AnalyticsFilters): Promise<TrendsData> => {
    const params = {
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      granularity: filters?.granularity || 'day',
    };
    const response = await api.get<AnalyticsApiResponse<TrendsData>>('/api/analytics/cases/trends', { params });
    return response.data.data;
  },

  /**
   * 获取诊断趋势数据
   */
  getDiagnosisTrends: async (filters?: AnalyticsFilters): Promise<TrendsData> => {
    const params = {
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      granularity: filters?.granularity || 'day',
    };
    const response = await api.get<AnalyticsApiResponse<TrendsData>>('/api/analytics/diagnoses/trends', { params });
    return response.data.data;
  },

  /**
   * 获取诊断性能数据
   */
  getPerformance: async (filters?: AnalyticsFilters): Promise<PerformanceData> => {
    const params = {
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      model_name: filters?.model_name,
    };
    const response = await api.get<AnalyticsApiResponse<PerformanceData>>('/api/analytics/diagnoses/performance', { params });
    return response.data.data;
  },

  /**
   * 获取模型对比数据
   */
  getModelComparison: async (filters?: AnalyticsFilters): Promise<ModelComparisonData> => {
    const params = {
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    };
    const response = await api.get<AnalyticsApiResponse<ModelComparisonData>>('/api/analytics/models/comparison', { params });
    return response.data.data;
  },

  /**
   * 获取用户活动数据
   */
  getUserActivity: async (filters?: AnalyticsFilters): Promise<UserActivityData> => {
    const params = {
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    };
    const response = await api.get<AnalyticsApiResponse<UserActivityData>>('/api/analytics/users/activity', { params });
    return response.data.data;
  },

  /**
   * 导出分析报告
   */
  exportReport: async (reportTypes: string[], format: 'pdf' | 'excel', filters?: AnalyticsFilters): Promise<Blob> => {
    const params = {
      report_types: reportTypes.join(','),
      format,
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    };
    const response = await api.post('/api/analytics/export', null, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============ 系统设置 API ============
import type {
  Provider,
  ProviderCreate,
  ProviderUpdate,
  ProviderTemplate,
  TestConnectionResult,
  Model,
  ModelCreate,
  ModelUpdate,
  PresetModel,
  SystemConfig,
  SystemConfigUpdate,
  AvailableProvider,
  SettingsApiResponse,
  FetchModelsResponse,
  ImportModelsResponse,
} from '../types/settings';

export const settingsApi = {
  // ============ 供应商 API ============

  /**
   * 获取供应商列表
   */
  getProviders: async (): Promise<Provider[]> => {
    const response = await api.get<SettingsApiResponse<Provider[]>>('/api/settings/providers');
    return response.data.data;
  },

  /**
   * 创建供应商
   */
  createProvider: async (data: ProviderCreate): Promise<Provider> => {
    const response = await api.post<SettingsApiResponse<Provider>>('/api/settings/providers', data);
    return response.data.data;
  },

  /**
   * 更新供应商
   */
  updateProvider: async (id: number, data: ProviderUpdate): Promise<Provider> => {
    const response = await api.put<SettingsApiResponse<Provider>>(`/api/settings/providers/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除供应商
   */
  deleteProvider: async (id: number): Promise<void> => {
    await api.delete(`/api/settings/providers/${id}`);
  },

  /**
   * 测试供应商连接
   */
  testProviderConnection: async (id: number): Promise<TestConnectionResult> => {
    const response = await api.post<SettingsApiResponse<TestConnectionResult>>(`/api/settings/providers/${id}/test`);
    return response.data.data;
  },

  /**
   * 获取预置供应商模板
   */
  getProviderTemplates: async (): Promise<ProviderTemplate[]> => {
    const response = await api.get<SettingsApiResponse<ProviderTemplate[]>>('/api/settings/providers/templates');
    return response.data.data;
  },

  /**
   * 获取供应商的预置模型列表
   */
  getPresetModels: async (providerId: number): Promise<PresetModel[]> => {
    const response = await api.get<SettingsApiResponse<PresetModel[]>>(`/api/settings/providers/${providerId}/preset-models`);
    return response.data.data;
  },

  /**
   * 从供应商 API 获取远程可用模型列表
   */
  fetchRemoteModels: async (providerId: number): Promise<FetchModelsResponse> => {
    const response = await api.post<SettingsApiResponse<FetchModelsResponse>>(`/api/settings/providers/${providerId}/fetch-models`);
    return response.data.data;
  },

  /**
   * 导入选中的远程模型到数据库
   */
  importModels: async (providerId: number, modelIds: string[]): Promise<ImportModelsResponse> => {
    const response = await api.post<SettingsApiResponse<ImportModelsResponse>>(
      `/api/settings/providers/${providerId}/import-models`,
      { model_ids: modelIds }
    );
    return response.data.data;
  },

  // ============ 模型 API ============

  /**
   * 获取模型列表
   */
  getModels: async (providerId?: number, isEnabled?: boolean): Promise<Model[]> => {
    const params: Record<string, any> = {};
    if (providerId !== undefined) params.provider_id = providerId;
    if (isEnabled !== undefined) params.is_enabled = isEnabled;
    const response = await api.get<SettingsApiResponse<Model[]>>('/api/settings/models', { params });
    return response.data.data;
  },

  /**
   * 创建模型
   */
  createModel: async (data: ModelCreate): Promise<Model> => {
    const response = await api.post<SettingsApiResponse<Model>>('/api/settings/models', data);
    return response.data.data;
  },

  /**
   * 批量创建模型
   */
  createModelsBatch: async (providerId: number, models: ModelCreate[]): Promise<{ created_count: number; skipped_count: number }> => {
    const response = await api.post<SettingsApiResponse<{ created_count: number; skipped_count: number }>>(
      `/api/settings/models/batch?provider_id=${providerId}`,
      models
    );
    return response.data.data;
  },

  /**
   * 更新模型
   */
  updateModel: async (id: number, data: ModelUpdate): Promise<Model> => {
    const response = await api.put<SettingsApiResponse<Model>>(`/api/settings/models/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除模型
   */
  deleteModel: async (id: number): Promise<void> => {
    await api.delete(`/api/settings/models/${id}`);
  },

  // ============ 系统配置 API ============

  /**
   * 获取系统配置
   */
  getConfig: async (): Promise<SystemConfig> => {
    const response = await api.get<SettingsApiResponse<SystemConfig>>('/api/settings/config');
    return response.data.data;
  },

  /**
   * 更新系统配置
   */
  updateConfig: async (data: SystemConfigUpdate): Promise<void> => {
    await api.put('/api/settings/config', data);
  },

  // ============ 可用模型 API ============

  /**
   * 获取可用于诊断的模型列表
   */
  getAvailableModels: async (): Promise<AvailableProvider[]> => {
    const response = await api.get<SettingsApiResponse<AvailableProvider[]>>('/api/settings/available-models');
    return response.data.data;
  },
};