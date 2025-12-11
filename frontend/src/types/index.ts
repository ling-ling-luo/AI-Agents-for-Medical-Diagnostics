export interface Case {
  id: number;
  patient_name: string | null;
  patient_id: string | null;
  age: number | null;
  gender: string | null;
  chief_complaint: string | null;
}

export interface CaseDetail {
  id: number;
  patient_name: string | null;
  patient_id: string | null;
  age: number | null;
  gender: string | null;
  chief_complaint: string | null;
  raw_report: string;
  created_at: string;
}

export interface DiagnosisResponse {
  case_id: number;
  diagnosis_markdown: string;
}

export interface CreateCaseRequest {
  patient_id?: string; // 可选：由后端自动生成
  patient_name: string;
  age: number;
  gender: string;
  chief_complaint: string;
  medical_history?: string;
  family_history?: string;
  lifestyle_factors?: string;
  medications?: string;
  lab_results?: string;
  physical_exam?: string;
  vital_signs?: string;
  language: string;
}

export interface CreateCaseResponse {
  id: number;
  patient_id: string;
  patient_name: string;
  message: string;
}

export interface UpdateCaseRequest {
  patient_id?: string;
  patient_name?: string;
  age?: number;
  gender?: string;
  chief_complaint?: string;
  medical_history?: string;
  family_history?: string;
  lifestyle_factors?: string;
  medications?: string;
  lab_results?: string;
  physical_exam?: string;
  vital_signs?: string;
  language?: string;
}

export interface DiagnosisHistoryItem {
  id: number;
  timestamp: string;
  model: string;
  execution_time_ms: number;
  diagnosis_preview: string;
  diagnosis_full: string | null;
}

export interface DiagnosisHistoryResponse {
  case_id: number;
  patient_name: string | null;
  patient_id: string | null;
  total_diagnoses: number;
  history: DiagnosisHistoryItem[];
}

export interface DiagnosisDetail {
  id: number;
  case_id: number;
  timestamp: string;
  model: string;
  execution_time_ms: number;
  diagnosis_markdown: string;
}