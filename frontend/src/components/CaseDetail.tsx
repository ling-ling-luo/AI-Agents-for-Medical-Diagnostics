import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { ArrowLeft, RefreshCw, AlertCircle, Brain, Heart, Wind, Loader, User, Calendar, Edit2, Save, X } from 'lucide-react';
import { caseApi } from '../services/api';
import { useNavigation } from '../context/NavigationContext';
import type { CaseDetail as CaseDetailType, DiagnosisResponse } from '../types';
import { Loading } from './Loading';
import { DiagnosisResult } from './DiagnosisResult';
import { ModelSelector } from './ModelSelector';
import { AgentInfoModal } from './AgentInfoModal';
import i18n from '../i18n';

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface AgentInfo {
  name: string;
  role: string;
  description: string;
  focus: string;
  task: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const CaseDetail = () => {
  const { t } = useTranslation();

  // 智能体信息配置（使用翻译）
  const agentsInfo: Record<string, AgentInfo> = {
    cardiologist: {
      name: t('agentModal.cardiologist.name'),
      role: t('agentModal.cardiologist.role'),
      description: t('agentModal.cardiologist.description'),
      task: t('agentModal.cardiologist.task'),
      focus: t('agentModal.cardiologist.focus'),
      prompt: t('agentModal.cardiologist.prompt'),
      icon: Heart,
      color: 'bg-gradient-to-br from-red-50 to-pink-50'
    },
    psychologist: {
      name: t('agentModal.psychologist.name'),
      role: t('agentModal.psychologist.role'),
      description: t('agentModal.psychologist.description'),
      task: t('agentModal.psychologist.task'),
      focus: t('agentModal.psychologist.focus'),
      prompt: t('agentModal.psychologist.prompt'),
      icon: Brain,
      color: 'bg-gradient-to-br from-purple-50 to-indigo-50'
    },
    pulmonologist: {
      name: t('agentModal.pulmonologist.name'),
      role: t('agentModal.pulmonologist.role'),
      description: t('agentModal.pulmonologist.description'),
      task: t('agentModal.pulmonologist.task'),
      focus: t('agentModal.pulmonologist.focus'),
      prompt: t('agentModal.pulmonologist.prompt'),
      icon: Wind,
      color: 'bg-gradient-to-br from-cyan-50 to-blue-50'
    }
  };
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addOpenCase } = useNavigation();
  const [caseDetail, setCaseDetail] = useState<CaseDetailType | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [diagnosisMetadata, setDiagnosisMetadata] = useState<{
    timestamp?: string;
    model?: string;
    executionTimeMs?: number;
  }>({});
  const [loading, setLoading] = useState(false);
  const [loadingCase, setLoadingCase] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 编辑模式相关状态
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    patient_name: '',
    patient_id: '',
    age: '',
    gender: '',
    chief_complaint: '',
    raw_report: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // 处理智能体卡片点击
  const handleAgentClick = (agentKey: string) => {
    setSelectedAgent(agentsInfo[agentKey]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  // 进入编辑模式
  const enterEditMode = () => {
    if (caseDetail) {
      setEditForm({
        patient_name: caseDetail.patient_name || '',
        patient_id: caseDetail.patient_id || '',
        age: caseDetail.age?.toString() || '',
        gender: caseDetail.gender || '',
        chief_complaint: caseDetail.chief_complaint || '',
        raw_report: caseDetail.raw_report || ''
      });
      setIsEditing(true);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      patient_name: '',
      patient_id: '',
      age: '',
      gender: '',
      chief_complaint: '',
      raw_report: ''
    });
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!caseId) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        patient_name: editForm.patient_name,
        age: editForm.age ? parseInt(editForm.age) : undefined,
        gender: editForm.gender,
        chief_complaint: editForm.chief_complaint,
        raw_report: editForm.raw_report
      };

      const updatedCase = await caseApi.updateCase(parseInt(caseId), updateData);
      setCaseDetail(updatedCase);
      setIsEditing(false);
    } catch (err) {
      setError(t('caseDetail.saveFailed'));
      console.error('Error updating case:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        const data = await caseApi.getAvailableModels();
        setAvailableModels(data.models);

        // 从 localStorage 读取用户上次选择的模型
        const savedModel = localStorage.getItem('selectedModel');
        if (savedModel && data.models.some(m => m.id === savedModel)) {
          setSelectedModel(savedModel);
        } else if (data.models.length > 0) {
          // 默认选择第一个模型
          setSelectedModel(data.models[0].id);
        }
      } catch (err) {
        console.error('Error loading models:', err);
        // 设置默认模型
        setSelectedModel('gemini-2.5-flash');
      }
    };

    loadModels();
  }, []);

  // 加载病例详情和最新诊断
  useEffect(() => {
    const loadCaseDetail = async () => {
      if (!caseId) return;

      try {
        setLoadingCase(true);
        setError(null);
        const data = await caseApi.getCaseDetail(parseInt(caseId));
        setCaseDetail(data);

        // 添加到已打开病例列表
        addOpenCase({
          id: data.id,
          patient_name: data.patient_name,
          patient_id: data.patient_id
        });

        // 加载最新的诊断历史
        try {
          const historyData = await caseApi.getDiagnosisHistory(parseInt(caseId), true);
          if (historyData.history && historyData.history.length > 0) {
            // 获取最新的诊断（数组第一个）
            const latestDiagnosis = historyData.history[0];
            if (latestDiagnosis.diagnosis_full) {
              setDiagnosis({
                case_id: parseInt(caseId),
                diagnosis_markdown: latestDiagnosis.diagnosis_full
              });
              // 保存诊断元数据
              setDiagnosisMetadata({
                timestamp: latestDiagnosis.timestamp,
                model: latestDiagnosis.model,
                executionTimeMs: latestDiagnosis.execution_time_ms
              });
            }
          } else {
            setDiagnosis(null);
            setDiagnosisMetadata({});
          }
        } catch {
          // 如果没有诊断历史，不显示错误，只是不加载诊断结果
          setDiagnosis(null);
          setDiagnosisMetadata({});
        }
      } catch (err) {
        setError(t('caseDetail.loadFailed'));
        console.error('Error loading case detail:', err);
      } finally {
        setLoadingCase(false);
      }
    };

    // token 变化通常意味着切换账号：重新拉取病例详情/诊断
    loadCaseDetail();
  }, [caseId, token]);

  // 处理模型选择变化
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selectedModel', modelId);
  };

  const runDiagnosis = useCallback(async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError(null);
      const startTime = Date.now();

      // 获取当前语言并映射为后端支持的格式
      const currentLang = i18n.language; // 'zh-CN' 或 'en-US'
      const language = currentLang.startsWith('zh') ? 'zh' : 'en';

      const result = await caseApi.runDiagnosis(parseInt(caseId), selectedModel, language);
      const executionTime = Date.now() - startTime;

      setDiagnosis(result);

      // 保存新诊断的元数据
      setDiagnosisMetadata({
        timestamp: new Date().toISOString(),
        model: selectedModel,
        executionTimeMs: executionTime
      });
    } catch (err) {
      setError(t('caseDetail.loadFailed'));
      console.error('Error running diagnosis:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, selectedModel, t]);

  // 检查是否需要自动触发诊断
  useEffect(() => {
    // 通过URL参数传递autoDiagnose=true来触发自动诊断
    const urlParams = new URLSearchParams(window.location.search);
    const autoDiagnose = urlParams.get('autoDiagnose') === 'true';

    if (autoDiagnose && caseId && selectedModel && !loading && !diagnosis) {
      // 延迟一小段时间确保页面渲染完成再触发诊断
      const timer = setTimeout(() => {
        runDiagnosis();
      }, 500);

      // 清除URL中的autoDiagnose参数，避免刷新时重复触发
      window.history.replaceState({}, document.title, window.location.pathname);

      return () => clearTimeout(timer);
    }
  }, [caseId, selectedModel, loading, diagnosis, runDiagnosis]);

  // 加载中状态
  if (loadingCase) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text={t('caseDetail.loadingCaseDetail')} />
      </div>
    );
  }

  // 错误状态
  if (error && !caseDetail) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-red-200/60 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">{t('caseDetail.loadError')}</h3>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/cases')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('caseDetail.backToList')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* 智能体信息模态框 */}
      {selectedAgent && (
        <AgentInfoModal
          agent={selectedAgent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* 顶部导航栏 - 增强质感 */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-custom py-5">
          <button
            onClick={() => navigate('/cases')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-5 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('caseDetail.backToCaseList')}
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {caseDetail?.gender === 'male' ? (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              ) : caseDetail?.gender === 'female' ? (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  {caseDetail?.patient_name || t('caseDetail.caseNumberPrefix', { id: caseId })}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">{t('caseDetail.aiDiagnosis')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 模型选择器 */}
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                models={availableModels}
              />

              {/* 开始诊断按钮 */}
              <button
                onClick={runDiagnosis}
                disabled={loading || !selectedModel}
                className="px-6 py-2.5 bg-transparent hover:bg-gray-50 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
              >
                {loading ? (
                  <span className="truncate">{t('caseDetail.analyzing')}</span>
                ) : (
                  <span className="truncate">{t('caseDetail.startDiagnosis')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        {/* 病例详情卡片 - 增强质感 */}
        {caseDetail && (
          <div className="mb-7 bg-white rounded-none border border-gray-200 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-700" />
                <h3 className="text-base font-semibold text-gray-800">{t('caseDetail.caseDetails')}</h3>
              </div>
              {!isEditing ? (
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 transition-colors rounded-none"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('caseDetail.edit')}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-colors rounded-none disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    {t('caseDetail.cancel')}
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all rounded-none disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? t('caseDetail.saving') : t('caseDetail.save')}
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 pb-4">
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">{t('caseDetail.patientName')}</p>
                      <p className="text-sm font-semibold text-gray-800">{caseDetail.patient_name || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">{t('caseDetail.patientId')}</p>
                      <p className="text-sm font-semibold text-gray-800">{caseDetail.patient_id || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">{t('caseDetail.age')}</p>
                      <p className="text-sm font-semibold text-gray-800">{caseDetail.age ? t('caseDetail.ageYears', { age: caseDetail.age }) : '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">{t('caseDetail.gender')}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {caseDetail.gender === 'male' ? t('caseDetail.male') : caseDetail.gender === 'female' ? t('caseDetail.female') : '-'}
                      </p>
                    </div>
                  </div>

                  {caseDetail.chief_complaint && (
                    <div className="mb-6 p-5 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2.5">{t('caseDetail.chiefComplaint')}</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{caseDetail.chief_complaint}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">{t('caseDetail.fullMedicalRecord')}</p>
                    <div className="p-5 bg-gray-50 rounded-none border border-gray-200 max-h-80 overflow-y-auto">
                      <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                        {caseDetail.raw_report}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                    <div className="p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">{t('caseDetail.patientName')}</label>
                      <input
                        type="text"
                        value={editForm.patient_name}
                        onChange={(e) => setEditForm({ ...editForm, patient_name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500"
                        placeholder={t('caseDetail.inputPatientName')}
                      />
                    </div>
                    <div className="p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">{t('caseDetail.patientId')}</label>
                      <input
                        type="text"
                        value={editForm.patient_id}
                        onChange={(e) => setEditForm({ ...editForm, patient_id: e.target.value })}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500 bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder={t('caseDetail.autoGenerated')}
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('caseDetail.patientIdNote')}</p>
                    </div>
                    <div className="p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">{t('caseDetail.age')}</label>
                      <input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500"
                        placeholder={t('caseDetail.inputAge')}
                        min="0"
                        max="150"
                      />
                    </div>
                    <div className="p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">{t('caseDetail.gender')}</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500"
                      >
                        <option value="">{t('caseDetail.pleaseSelect')}</option>
                        <option value="male">{t('caseDetail.male')}</option>
                        <option value="female">{t('caseDetail.female')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6 p-5 border-t border-gray-200">
                    <label className="block text-xs font-semibold text-gray-600 mb-2.5">{t('caseDetail.chiefComplaint')}</label>
                    <textarea
                      value={editForm.chief_complaint}
                      onChange={(e) => setEditForm({ ...editForm, chief_complaint: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500 min-h-[80px]"
                      placeholder={t('caseDetail.inputChiefComplaint')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">{t('caseDetail.fullMedicalRecord')}</label>
                    <textarea
                      value={editForm.raw_report}
                      onChange={(e) => setEditForm({ ...editForm, raw_report: e.target.value })}
                      className="w-full p-5 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500 font-sans min-h-[320px]"
                      placeholder={t('caseDetail.inputFullRecord')}
                    />
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{t('caseDetail.createdTime', { time: new Date(caseDetail.created_at).toLocaleString() })}</span>
              </div>
            </div>
          </div>
        )}
        {/* 专家智能体列表 - 增强质感，可点击查看详情 */}
        <div className="mb-7 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">{t('caseDetail.specialistAgents')}</h2>
            <p className="text-xs text-gray-500">{t('caseDetail.clickToViewDetails')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              className="bg-white rounded-none border border-gray-200 transition-all shadow-lg hover:shadow-xl cursor-pointer hover:bg-gray-50 flex flex-col"
              onClick={() => handleAgentClick('cardiologist')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleAgentClick('cardiologist')}
            >
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">{t('caseDetail.cardiology')}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{t('caseDetail.cardiologyDesc')}</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
            </div>

            <div
              className="bg-white rounded-none border border-gray-200 transition-all shadow-lg hover:shadow-xl cursor-pointer hover:bg-gray-50 flex flex-col"
              onClick={() => handleAgentClick('psychologist')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleAgentClick('psychologist')}
            >
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">{t('caseDetail.psychology')}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{t('caseDetail.psychologyDesc')}</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            </div>

            <div
              className="bg-white rounded-none border border-gray-200 transition-all shadow-lg hover:shadow-xl cursor-pointer hover:bg-gray-50 flex flex-col"
              onClick={() => handleAgentClick('pulmonologist')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleAgentClick('pulmonologist')}
            >
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                      <Wind className="w-5 h-5 text-cyan-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">{t('caseDetail.pulmonology')}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{t('caseDetail.pulmonologyDesc')}</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            </div>
          </div>
        </div>

        {/* 诊断进行中状态 - 增强质感 */}
        {loading && (
          <div className="bg-white rounded-none border border-gray-200 p-8 fade-in shadow-lg">
            <div className="text-center mb-8">
              <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-800 font-semibold text-base">{t('caseDetail.aiAnalyzing')}</p>
              <p className="text-sm text-gray-500 mt-2">{t('caseDetail.pleaseWait')}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5">
                  <Heart className="w-5 h-5 text-red-600 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-800">{t('caseDetail.cardiologyAgent')}</span>
                </div>
                <span className="text-xs font-semibold text-orange-600 animate-pulse">{t('caseDetail.analyzing')}</span>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5">
                  <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-800">{t('caseDetail.psychologyAgent')}</span>
                </div>
                <span className="text-xs font-semibold text-orange-600 animate-pulse">{t('caseDetail.analyzing')}</span>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5">
                  <Wind className="w-5 h-5 text-cyan-600 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-800">{t('caseDetail.pulmonologyAgent')}</span>
                </div>
                <span className="text-xs font-semibold text-orange-600 animate-pulse">{t('caseDetail.analyzing')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 - 矩形设计 */}
        {error && (
          <div className="bg-white rounded-none border border-gray-200 p-8 fade-in shadow-lg text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('caseDetail.diagnosisFailed')}</h3>
            <p className="text-base text-gray-600 mb-6">{error}</p>
            <button
              onClick={runDiagnosis}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-none transition-all inline-flex items-center gap-2 shadow hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              {t('caseDetail.retry')}
            </button>
          </div>
        )}

        {/* 诊断结果 */}
        {diagnosis && !loading && (
          <DiagnosisResult
            result={diagnosis.diagnosis_markdown}
            caseId={caseId ? parseInt(caseId) : undefined}
            timestamp={diagnosisMetadata.timestamp}
            model={diagnosisMetadata.model}
            executionTimeMs={diagnosisMetadata.executionTimeMs}
          />
        )}
      </main>
    </div>
  );
};
