export interface Case {
  id: number;
  patient_name: string | null;
  patient_id: string | null;
  age: number | null;
  gender: string | null;
  chief_complaint: string | null;
}

export interface DiagnosisResponse {
  case_id: number;
  diagnosis_markdown: string;
}