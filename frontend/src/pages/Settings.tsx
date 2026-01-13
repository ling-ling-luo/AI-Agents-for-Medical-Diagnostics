import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  Sliders,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Loader2,
  ChevronDown,
  Star,
  AlertCircle,
  Zap,
  Clock,
  RefreshCw,
  MessageSquare,
  FileText,
  Download,
  CloudDownload,
} from 'lucide-react';
import { settingsApi } from '../services/api';
import type {
  Provider,
  ProviderCreate,
  ProviderUpdate,
  ProviderTemplate,
  Model,
  ModelCreate,
  SystemConfig,
  SystemConfigUpdate,
  TestConnectionResult,
  FetchModelsResponse,
} from '../types/settings';

type TabType = 'providers' | 'models' | 'config';

export const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('providers');

  const tabs = [
    { id: 'providers' as TabType, label: t('settings.providers'), icon: Server },
    { id: 'models' as TabType, label: t('settings.models'), icon: Cpu },
    { id: 'config' as TabType, label: t('settings.systemConfig'), icon: Sliders },
  ];

  return (
    <div className="flex-1 bg-gray-50">
      {/* 页面头部 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t('settings.title')}</h1>
              <p className="text-sm text-gray-500 mt-0.5">管理 AI 供应商、模型和系统配置</p>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* 左侧导航 */}
          <div className="w-56 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent'
                  } ${index > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {activeTab === 'providers' && <ProvidersTab />}
              {activeTab === 'models' && <ModelsTab />}
              {activeTab === 'config' && <ConfigTab />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============ 供应商管理 Tab ============
const ProvidersTab = () => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [templates, setTemplates] = useState<ProviderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, TestConnectionResult>>({});
  const [fetchingModelsId, setFetchingModelsId] = useState<number | null>(null);
  const [showFetchModelsModal, setShowFetchModelsModal] = useState(false);
  const [fetchedModelsData, setFetchedModelsData] = useState<FetchModelsResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [providersData, templatesData] = await Promise.all([
        settingsApi.getProviders(),
        settingsApi.getProviderTemplates(),
      ]);
      setProviders(providersData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (provider: Provider) => {
    setTestingId(provider.id);
    try {
      const result = await settingsApi.testProviderConnection(provider.id);
      setTestResults((prev) => ({ ...prev, [provider.id]: result }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [provider.id]: {
          status: 'error',
          latency_ms: null,
          message: t('settings.testFailed'),
          available_models: null,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (provider: Provider) => {
    if (!confirm(t('settings.confirmDeleteProvider', { name: provider.name }))) return;
    try {
      await settingsApi.deleteProvider(provider.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  const handleToggleEnabled = async (provider: Provider) => {
    try {
      await settingsApi.updateProvider(provider.id, { is_enabled: !provider.is_enabled });
      loadData();
    } catch (error) {
      console.error('Failed to toggle provider:', error);
    }
  };

  const handleSetDefault = async (provider: Provider) => {
    try {
      await settingsApi.updateProvider(provider.id, { is_default: true });
      loadData();
    } catch (error) {
      console.error('Failed to set default provider:', error);
    }
  };

  const handleFetchModels = async (provider: Provider) => {
    setFetchingModelsId(provider.id);
    try {
      const result = await settingsApi.fetchRemoteModels(provider.id);
      setFetchedModelsData(result);
      setShowFetchModelsModal(true);
    } catch (error: any) {
      console.error('Failed to fetch models:', error);
      alert(error.response?.data?.detail || t('settings.fetchModelsFailed'));
    } finally {
      setFetchingModelsId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 头部 */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('settings.providerList')}</h2>
            <p className="text-sm text-gray-500 mt-1">配置 AI 服务供应商和 API 密钥</p>
          </div>
          <button
            onClick={() => {
              setEditingProvider(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('settings.addProvider')}
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-8">
        {providers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">{t('settings.noProviders')}</h3>
            <p className="text-sm text-gray-500 mb-6">添加您的第一个 AI 供应商以开始使用</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('settings.addFirstProvider')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                testResult={testResults[provider.id]}
                isTesting={testingId === provider.id}
                isFetchingModels={fetchingModelsId === provider.id}
                onEdit={() => {
                  setEditingProvider(provider);
                  setShowModal(true);
                }}
                onDelete={() => handleDelete(provider)}
                onTest={() => handleTestConnection(provider)}
                onToggleEnabled={() => handleToggleEnabled(provider)}
                onSetDefault={() => handleSetDefault(provider)}
                onFetchModels={() => handleFetchModels(provider)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ProviderModal
          provider={editingProvider}
          templates={templates}
          onClose={() => {
            setShowModal(false);
            setEditingProvider(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingProvider(null);
            loadData();
          }}
        />
      )}

      {showFetchModelsModal && fetchedModelsData && (
        <FetchModelsModal
          data={fetchedModelsData}
          onClose={() => {
            setShowFetchModelsModal(false);
            setFetchedModelsData(null);
          }}
          onImport={() => {
            setShowFetchModelsModal(false);
            setFetchedModelsData(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// 供应商卡片组件
interface ProviderCardProps {
  provider: Provider;
  testResult?: TestConnectionResult;
  isTesting: boolean;
  isFetchingModels: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onToggleEnabled: () => void;
  onSetDefault: () => void;
  onFetchModels: () => void;
}

const ProviderCard = ({
  provider,
  testResult,
  isTesting,
  isFetchingModels,
  onEdit,
  onDelete,
  onTest,
  onToggleEnabled,
  onSetDefault,
  onFetchModels,
}: ProviderCardProps) => {
  const { t } = useTranslation();

  const getStatusBadge = () => {
    if (!testResult) return null;

    if (testResult.status === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          已连接 {testResult.latency_ms && `· ${testResult.latency_ms}ms`}
        </span>
      );
    }

    if (testResult.status === 'auth_failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
          <AlertCircle className="w-3 h-3" />
          认证失败
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
        <WifiOff className="w-3 h-3" />
        连接失败
      </span>
    );
  };

  return (
    <div
      className={`group border rounded-lg transition-all duration-200 ${
        provider.is_enabled
          ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          : 'border-gray-100 bg-gray-50 opacity-75'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          {/* 左侧信息 */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                provider.is_enabled ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              <Server className={`w-6 h-6 ${provider.is_enabled ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base font-semibold ${provider.is_enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                  {provider.name}
                </h3>
                {provider.is_default && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    <Star className="w-3 h-3 fill-current" />
                    {t('settings.default')}
                  </span>
                )}
                {!provider.is_enabled && (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                    {t('settings.disabled')}
                  </span>
                )}
                {getStatusBadge()}
              </div>
              <p className="text-sm text-gray-500 mt-1 truncate max-w-md">{provider.base_url}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Eye className="w-3.5 h-3.5" />
                  {provider.api_key_masked}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Cpu className="w-3.5 h-3.5" />
                  {t('settings.modelCount', { count: provider.model_count })}
                </span>
              </div>
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onFetchModels}
              disabled={isFetchingModels || !provider.is_enabled}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('settings.fetchModels')}
            >
              {isFetchingModels ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
            </button>
            <button
              onClick={onTest}
              disabled={isTesting || !provider.is_enabled}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('settings.testConnection')}
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            </button>
            {!provider.is_default && provider.is_enabled && (
              <button
                onClick={onSetDefault}
                className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                title={t('settings.setAsDefault')}
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onToggleEnabled}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                provider.is_enabled
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={provider.is_enabled ? t('settings.disable') : t('settings.enable')}
            >
              {provider.is_enabled ? <Zap className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title={t('common.edit')}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title={t('common.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 供应商编辑弹窗
interface ProviderModalProps {
  provider: Provider | null;
  templates: ProviderTemplate[];
  onClose: () => void;
  onSave: () => void;
}

const ProviderModal = ({ provider, templates, onClose, onSave }: ProviderModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProviderCreate>({
    name: provider?.name || '',
    base_url: provider?.base_url || '',
    api_key: '',
    is_enabled: provider?.is_enabled ?? true,
    is_default: provider?.is_default ?? false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(provider?.name || null);

  const handleTemplateSelect = (template: ProviderTemplate) => {
    setSelectedTemplate(template.name);
    setFormData((prev) => ({
      ...prev,
      name: template.name,
      base_url: template.base_url,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.base_url) {
      setError(t('settings.fillRequired'));
      return;
    }
    if (!provider && !formData.api_key) {
      setError(t('settings.apiKeyRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (provider) {
        const updateData: ProviderUpdate = {
          name: formData.name,
          base_url: formData.base_url,
          is_enabled: formData.is_enabled,
          is_default: formData.is_default,
        };
        if (formData.api_key) {
          updateData.api_key = formData.api_key;
        }
        await settingsApi.updateProvider(provider.id, updateData);
      } else {
        await settingsApi.createProvider(formData);
      }
      onSave();
    } catch (error: any) {
      setError(error.response?.data?.detail || t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {provider ? t('settings.editProvider') : t('settings.addProvider')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 模板选择 */}
          {!provider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('settings.selectTemplate')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`px-3 py-2.5 text-sm rounded-lg border-2 transition-all cursor-pointer ${
                      selectedTemplate === template.name
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 供应商名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('settings.providerName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              placeholder="OpenAI"
            />
          </div>

          {/* API Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              API Base URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.base_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, base_url: e.target.value }))}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="https://api.openai.com/v1"
              />
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              API Key {!provider && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.api_key}
                onChange={(e) => setFormData((prev) => ({ ...prev, api_key: e.target.value }))}
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow font-mono text-sm"
                placeholder={provider ? t('settings.leaveEmptyToKeep') : 'sk-...'}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 选项 */}
          <div className="flex items-center gap-6 py-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.is_enabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('settings.enableProvider')}</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_default: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('settings.setAsDefault')}</span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 获取远程模型弹窗
interface FetchModelsModalProps {
  data: FetchModelsResponse;
  onClose: () => void;
  onImport: () => void;
}

const FetchModelsModal = ({ data, onClose, onImport }: FetchModelsModalProps) => {
  const { t } = useTranslation();
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedModels.size === data.models.length) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(data.models.map((m) => m.model_id)));
    }
  };

  const handleImport = async () => {
    if (selectedModels.size === 0) return;

    setImporting(true);
    setError('');

    try {
      const result = await settingsApi.importModels(data.provider_id, Array.from(selectedModels));
      if (result.imported_count > 0 || result.skipped_count > 0) {
        alert(t('settings.modelsImported', { imported: result.imported_count, skipped: result.skipped_count }));
      }
      onImport();
    } catch (err: any) {
      setError(err.response?.data?.detail || t('settings.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CloudDownload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('settings.fetchModelsTitle')}
              </h3>
              <p className="text-sm text-gray-500">
                {data.provider_name} · {data.total_count} {t('settings.modelsAvailable')}
                {data.source === 'preset' && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    {t('settings.presetList')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 模型列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {data.models.length === 0 ? (
            <div className="text-center py-12">
              <Cpu className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('settings.noModelsFound')}</p>
            </div>
          ) : (
            <>
              {/* 全选 */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedModels.size === data.models.length}
                    onChange={toggleAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t('settings.selectAll')} ({selectedModels.size}/{data.models.length})
                  </span>
                </label>
              </div>

              {/* 模型列表 */}
              <div className="space-y-2">
                {data.models.map((model) => (
                  <label
                    key={model.model_id}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedModels.has(model.model_id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.has(model.model_id)}
                      onChange={() => toggleModel(model.model_id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{model.display_name}</span>
                        {model.supports_vision && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Vision
                          </span>
                        )}
                        {model.supports_function_call && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Functions
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                          {model.model_id}
                        </code>
                        {model.context_window && (
                          <span className="text-xs text-gray-500">
                            {(model.context_window / 1000).toFixed(0)}K {t('settings.contextUnit')}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 底部 */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <p className="text-sm text-gray-500">
            {t('settings.selectedModelsCount', { count: selectedModels.size })}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedModels.size === 0}
              className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              <Download className="w-4 h-4" />
              {t('settings.importModels')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ 模型管理 Tab ============
const ModelsTab = () => {
  const { t } = useTranslation();
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProviders, setExpandedProviders] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [addingPreset, setAddingPreset] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modelsData, providersData] = await Promise.all([
        settingsApi.getModels(),
        settingsApi.getProviders(),
      ]);
      setModels(modelsData);
      setProviders(providersData);
      // 默认展开所有供应商
      setExpandedProviders(new Set(providersData.map((p) => p.id)));
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = (providerId: number) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  const handleToggleEnabled = async (model: Model) => {
    // 乐观更新：先更新本地状态
    const newEnabled = !model.is_enabled;
    setModels((prev) =>
      prev.map((m) => (m.id === model.id ? { ...m, is_enabled: newEnabled } : m))
    );

    try {
      await settingsApi.updateModel(model.id, { is_enabled: newEnabled });
    } catch (error) {
      console.error('Failed to toggle model:', error);
      // 失败时回滚
      setModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, is_enabled: !newEnabled } : m))
      );
    }
  };

  const handleSetDefault = async (model: Model) => {
    // 乐观更新：先更新本地状态
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        is_default: m.id === model.id ? true : false,
      }))
    );

    try {
      await settingsApi.updateModel(model.id, { is_default: true });
    } catch (error) {
      console.error('Failed to set default model:', error);
      // 失败时重新加载
      loadData();
    }
  };

  const handleDelete = async (model: Model) => {
    if (!confirm(t('settings.confirmDeleteModel', { name: model.display_name }))) return;
    try {
      await settingsApi.deleteModel(model.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const handleAddPresetModels = async (providerId: number) => {
    setAddingPreset(providerId);
    try {
      const presetModels = await settingsApi.getPresetModels(providerId);
      if (presetModels.length === 0) {
        alert(t('settings.noPresetModels'));
        return;
      }
      const modelsToCreate: ModelCreate[] = presetModels.map((m) => ({
        provider_id: providerId,
        model_id: m.model_id,
        display_name: m.display_name,
        is_enabled: true,
        max_tokens: m.max_tokens,
        context_window: m.context_window,
        supports_vision: m.supports_vision,
        supports_function_call: m.supports_function_call,
      }));
      const result = await settingsApi.createModelsBatch(providerId, modelsToCreate);
      alert(t('settings.presetModelsAdded', { created: result.created_count, skipped: result.skipped_count }));
      loadData();
    } catch (error) {
      console.error('Failed to add preset models:', error);
    } finally {
      setAddingPreset(null);
    }
  };

  // 按供应商分组
  const modelsByProvider = providers.map((provider) => ({
    provider,
    models: models.filter((m) => m.provider_id === provider.id),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 头部 */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('settings.modelList')}</h2>
            <p className="text-sm text-gray-500 mt-1">管理可用于诊断的 AI 模型</p>
          </div>
          <button
            onClick={() => {
              setEditingModel(null);
              setSelectedProviderId(providers[0]?.id || null);
              setShowModal(true);
            }}
            disabled={providers.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {t('settings.addModel')}
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-8">
        {providers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cpu className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">{t('settings.addProviderFirst')}</h3>
            <p className="text-sm text-gray-500">请先添加供应商才能管理模型</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modelsByProvider.map(({ provider, models: providerModels }) => (
              <div
                key={provider.id}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white"
              >
                {/* 供应商头部 */}
                <button
                  onClick={() => toggleProvider(provider.id)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`transition-transform duration-200 ${expandedProviders.has(provider.id) ? 'rotate-0' : '-rotate-90'}`}>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="font-semibold text-gray-900">{provider.name}</span>
                    <span className="px-2.5 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                      {providerModels.length} {t('settings.modelsUnit')}
                    </span>
                    {provider.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                        默认
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddPresetModels(provider.id);
                    }}
                    disabled={addingPreset === provider.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {addingPreset === provider.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {t('settings.addPresetModels')}
                  </button>
                </button>

                {/* 模型列表 */}
                {expandedProviders.has(provider.id) && (
                  <div className="divide-y divide-gray-100">
                    {providerModels.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <Cpu className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{t('settings.noModelsForProvider')}</p>
                      </div>
                    ) : (
                      providerModels.map((model) => (
                        <ModelRow
                          key={model.id}
                          model={model}
                          onEdit={() => {
                            setEditingModel(model);
                            setSelectedProviderId(model.provider_id);
                            setShowModal(true);
                          }}
                          onDelete={() => handleDelete(model)}
                          onToggleEnabled={() => handleToggleEnabled(model)}
                          onSetDefault={() => handleSetDefault(model)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedProviderId && (
        <ModelModal
          model={editingModel}
          providerId={selectedProviderId}
          providers={providers}
          onClose={() => {
            setShowModal(false);
            setEditingModel(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingModel(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// 模型行组件
interface ModelRowProps {
  model: Model;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: () => void;
  onSetDefault: () => void;
}

const ModelRow = ({ model, onEdit, onDelete, onToggleEnabled, onSetDefault }: ModelRowProps) => {
  const { t } = useTranslation();

  return (
    <div className={`group flex items-center justify-between px-5 py-4 transition-colors ${model.is_enabled ? 'hover:bg-gray-50' : 'bg-gray-50/50'}`}>
      <div className="flex items-center gap-4">
        {/* 启用开关 */}
        <button
          onClick={onToggleEnabled}
          className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
            model.is_enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              model.is_enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${model.is_enabled ? 'text-gray-900' : 'text-gray-500'}`}>
              {model.display_name}
            </span>
            {model.is_default && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                <Star className="w-3 h-3 fill-current" />
                {t('settings.default')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
              {model.model_id}
            </code>
            {model.context_window && (
              <span className="text-xs text-gray-500">
                {(model.context_window / 1000).toFixed(0)}K 上下文
              </span>
            )}
            {model.supports_vision && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Vision
              </span>
            )}
            {model.supports_function_call && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Functions
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!model.is_default && model.is_enabled && (
          <button
            onClick={onSetDefault}
            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            title={t('settings.setAsDefault')}
          >
            <Star className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onEdit}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          title={t('common.edit')}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          title={t('common.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// 模型编辑弹窗
interface ModelModalProps {
  model: Model | null;
  providerId: number;
  providers: Provider[];
  onClose: () => void;
  onSave: () => void;
}

const ModelModal = ({ model, providerId, providers, onClose, onSave }: ModelModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ModelCreate>({
    provider_id: model?.provider_id || providerId,
    model_id: model?.model_id || '',
    display_name: model?.display_name || '',
    is_enabled: model?.is_enabled ?? true,
    is_default: model?.is_default ?? false,
    max_tokens: model?.max_tokens || undefined,
    context_window: model?.context_window || undefined,
    supports_vision: model?.supports_vision ?? false,
    supports_function_call: model?.supports_function_call ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model_id || !formData.display_name) {
      setError(t('settings.fillRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (model) {
        await settingsApi.updateModel(model.id, {
          display_name: formData.display_name,
          is_enabled: formData.is_enabled,
          is_default: formData.is_default,
          max_tokens: formData.max_tokens,
          context_window: formData.context_window,
          supports_vision: formData.supports_vision,
          supports_function_call: formData.supports_function_call,
        });
      } else {
        await settingsApi.createModel(formData);
      }
      onSave();
    } catch (error: any) {
      setError(error.response?.data?.detail || t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {model ? t('settings.editModel') : t('settings.addModel')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 供应商选择 */}
          {!model && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('settings.provider')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.provider_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, provider_id: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow cursor-pointer"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 模型 ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('settings.modelId')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.model_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, model_id: e.target.value }))}
              disabled={!!model}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
              placeholder="gpt-4o"
            />
          </div>

          {/* 显示名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('settings.displayName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              placeholder="GPT-4o"
            />
          </div>

          {/* Token 配置 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('settings.maxTokens')}
              </label>
              <input
                type="number"
                value={formData.max_tokens || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, max_tokens: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="128000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('settings.contextWindow')}
              </label>
              <input
                type="number"
                value={formData.context_window || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, context_window: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="128000"
              />
            </div>
          </div>

          {/* 功能选项 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700 mb-2">模型能力</p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.supports_vision}
                onChange={(e) => setFormData((prev) => ({ ...prev, supports_vision: e.target.checked }))}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('settings.supportsVision')}</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Vision</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.supports_function_call}
                onChange={(e) => setFormData((prev) => ({ ...prev, supports_function_call: e.target.checked }))}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('settings.supportsFunctions')}</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Functions</span>
            </label>
          </div>

          {/* 启用和默认选项 */}
          <div className="flex items-center gap-6 py-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.is_enabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('settings.enableModel')}</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_default: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t('settings.setAsDefault')}</span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============ 系统配置 Tab ============
const ConfigTab = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SystemConfigUpdate>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getConfig();
      setConfig(data);
      setFormData({
        default_language: data.default_language?.value,
        request_timeout: data.request_timeout?.value,
        max_retries: data.max_retries?.value,
        enable_streaming: data.enable_streaming?.value,
        log_level: data.log_level?.value,
      });
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await settingsApi.updateConfig(formData);
      await loadConfig();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 头部 */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('settings.systemConfig')}</h2>
            <p className="text-sm text-gray-500 mt-1">配置系统默认行为和参数</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer shadow-sm ${
              saveSuccess
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : null}
            {saveSuccess ? '已保存' : t('common.save')}
          </button>
        </div>
      </div>

      {/* 配置项 */}
      <div className="p-8 space-y-8">
        {/* 请求超时 */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              {t('settings.requestTimeout')}
            </label>
            <p className="text-sm text-gray-500 mb-3">{config?.request_timeout?.description}</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formData.request_timeout}
                onChange={(e) => setFormData((prev) => ({ ...prev, request_timeout: Number(e.target.value) }))}
                min={10}
                max={600}
                className="w-28 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
              <span className="text-sm text-gray-500">{t('settings.seconds')}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* 重试次数 */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              {t('settings.maxRetries')}
            </label>
            <p className="text-sm text-gray-500 mb-3">{config?.max_retries?.description}</p>
            <input
              type="number"
              value={formData.max_retries}
              onChange={(e) => setFormData((prev) => ({ ...prev, max_retries: Number(e.target.value) }))}
              min={0}
              max={10}
              className="w-28 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* 流式输出 */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  {t('settings.enableStreaming')}
                </label>
                <p className="text-sm text-gray-500">{config?.enable_streaming?.description}</p>
              </div>
              <button
                onClick={() => setFormData((prev) => ({ ...prev, enable_streaming: !prev.enable_streaming }))}
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative ${
                  formData.enable_streaming ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.enable_streaming ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* 日志级别 */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              {t('settings.logLevel')}
            </label>
            <p className="text-sm text-gray-500 mb-3">{config?.log_level?.description}</p>
            <select
              value={formData.log_level}
              onChange={(e) => setFormData((prev) => ({ ...prev, log_level: e.target.value }))}
              className="w-full max-w-xs px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow cursor-pointer"
            >
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>

        {/* 默认模型信息 */}
        {config?.default_model && (
          <>
            <div className="border-t border-gray-200" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  {t('settings.currentDefaultModel')}
                </label>
                <p className="text-sm text-gray-500 mb-3">当前系统默认使用的 AI 模型</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{config.default_model.value.display_name}</p>
                      <p className="text-sm text-gray-500">
                        {config.default_model.value.provider_name} · <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{config.default_model.value.model_id}</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
