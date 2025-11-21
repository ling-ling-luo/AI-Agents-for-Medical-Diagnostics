import axios from 'axios';
import type { Case, CaseDetail, DiagnosisResponse, CreateCaseRequest, CreateCaseResponse } from '../types';

// 配置 API 基础 URL - 开发环境指向 FastAPI 后端
const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

  // 运行诊断
  runDiagnosis: async (caseId: number): Promise<DiagnosisResponse> => {
    const response = await api.post<DiagnosisResponse>(
      `/api/cases/${caseId}/run-diagnosis`
    );
    return response.data;
  },

  // 新增病例
  createCase: async (data: CreateCaseRequest): Promise<CreateCaseResponse> => {
    const response = await api.post<CreateCaseResponse>('/api/cases', data);
    return response.data;
  },
};