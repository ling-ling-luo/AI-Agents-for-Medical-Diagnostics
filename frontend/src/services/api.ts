import axios from 'axios';
import type { Case, CaseDetail, DiagnosisResponse, CreateCaseRequest, CreateCaseResponse, UpdateCaseRequest, DiagnosisHistoryResponse, DiagnosisDetail, AllDiagnosisResponse, DiagnosisFilters } from '../types';

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