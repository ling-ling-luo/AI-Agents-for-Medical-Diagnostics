/**
 * 系统设置相关类型定义
 */

// 供应商
export interface Provider {
  id: number;
  name: string;
  base_url: string;
  api_key_masked: string;
  is_enabled: boolean;
  is_default: boolean;
  model_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderCreate {
  name: string;
  base_url: string;
  api_key: string;
  is_enabled?: boolean;
  is_default?: boolean;
}

export interface ProviderUpdate {
  name?: string;
  base_url?: string;
  api_key?: string;
  is_enabled?: boolean;
  is_default?: boolean;
}

export interface ProviderTemplate {
  name: string;
  base_url: string;
}

export interface TestConnectionResult {
  status: 'connected' | 'auth_failed' | 'timeout' | 'error';
  latency_ms: number | null;
  message: string;
  available_models: string[] | null;
}

// 模型
export interface Model {
  id: number;
  provider_id: number;
  provider_name: string;
  model_id: string;
  display_name: string;
  is_enabled: boolean;
  is_default: boolean;
  max_tokens: number | null;
  context_window: number | null;
  supports_vision: boolean;
  supports_function_call: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelCreate {
  provider_id: number;
  model_id: string;
  display_name: string;
  is_enabled?: boolean;
  is_default?: boolean;
  max_tokens?: number;
  context_window?: number;
  supports_vision?: boolean;
  supports_function_call?: boolean;
}

export interface ModelUpdate {
  display_name?: string;
  is_enabled?: boolean;
  is_default?: boolean;
  max_tokens?: number;
  context_window?: number;
  supports_vision?: boolean;
  supports_function_call?: boolean;
}

export interface PresetModel {
  model_id: string;
  display_name: string;
  max_tokens?: number;
  context_window?: number;
  supports_vision?: boolean;
  supports_function_call?: boolean;
}

// 系统配置
export interface SystemConfig {
  default_language: {
    value: string;
    value_type: string;
    description: string;
  };
  request_timeout: {
    value: number;
    value_type: string;
    description: string;
  };
  max_retries: {
    value: number;
    value_type: string;
    description: string;
  };
  enable_streaming: {
    value: boolean;
    value_type: string;
    description: string;
  };
  log_level: {
    value: string;
    value_type: string;
    description: string;
  };
  default_model?: {
    value: {
      id: number;
      model_id: string;
      display_name: string;
      provider_name: string;
    };
    value_type: string;
    description: string;
  };
}

export interface SystemConfigUpdate {
  default_language?: string;
  request_timeout?: number;
  max_retries?: number;
  enable_streaming?: boolean;
  log_level?: string;
}

// 可用模型（供诊断使用）
export interface AvailableModel {
  id: number;
  model_id: string;
  display_name: string;
  is_default: boolean;
  supports_vision: boolean;
}

export interface AvailableProvider {
  provider_id: number;
  provider_name: string;
  is_default: boolean;
  models: AvailableModel[];
}

// 远程获取的模型
export interface FetchedModel {
  model_id: string;
  display_name: string;
  context_window: number | null;
  supports_vision: boolean;
  supports_function_call: boolean;
}

export interface FetchModelsResponse {
  provider_id: number;
  provider_name: string;
  models: FetchedModel[];
  total_count: number;
  source: 'api' | 'preset';
}

export interface ImportModelsResponse {
  imported_count: number;
  skipped_count: number;
  models: Model[];
}

// API 响应
export interface SettingsApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
