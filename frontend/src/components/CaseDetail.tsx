import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Brain, Heart, Wind, Loader, User, Calendar, Edit2, Save, X } from 'lucide-react';
import { caseApi } from '../services/api';
import type { CaseDetail as CaseDetailType, DiagnosisResponse } from '../types';
import { Loading } from './Loading';
import { DiagnosisResult } from './DiagnosisResult';
import { ModelSelector } from './ModelSelector';
import { AgentInfoModal } from './AgentInfoModal';

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
  icon: any;
  color: string;
}

// 智能体信息配置
const agentsInfo: Record<string, AgentInfo> = {
  cardiologist: {
    name: '心脏科智能体',
    role: 'Cardiologist',
    description: '心脏科智能体专注于心血管系统的评估和诊断，能够分析心电图、血液检测、Holter监测结果和超声心动图等数据。',
    task: '审查患者的心脏检查结果，包括ECG、血液检测、Holter监测结果和超声心动图，识别可能解释患者症状的心脏问题迹象。',
    focus: '确定是否存在可能在常规检测中被遗漏的心脏问题的微妙迹象，排除任何潜在的心脏疾病，如心律失常或结构异常。',
    prompt: `Act like a cardiologist. You will receive a medical report of a patient.
Task: Review the patient's cardiac workup, including ECG, blood tests, Holter monitor results, and echocardiogram.
Focus: Determine if there are any subtle signs of cardiac issues that could explain the patient's symptoms. Rule out any underlying heart conditions, such as arrhythmias or structural abnormalities, that might be missed on routine testing.
Recommendation: Provide guidance on any further cardiac testing or monitoring needed to ensure there are no hidden heart-related concerns. Suggest potential management strategies if a cardiac issue is identified.
Please only return the possible causes of the patient's symptoms and the recommended next steps.
Medical Report: {medical_report}`,
    icon: Heart,
    color: 'bg-gradient-to-br from-red-50 to-pink-50'
  },
  psychologist: {
    name: '心理学智能体',
    role: 'Psychologist',
    description: '心理学智能体专注于心理健康评估，能够识别焦虑、抑郁、创伤等心理问题，并提供相应的干预建议。',
    task: '审查患者报告并提供心理评估，识别可能影响患者福祉的潜在心理健康问题。',
    focus: '识别任何可能影响患者福祉的潜在心理健康问题，如焦虑、抑郁或创伤，提供应对这些心理健康问题的指导。',
    prompt: `Act like a psychologist. You will receive a patient's report.
Task: Review the patient's report and provide a psychological assessment.
Focus: Identify any potential mental health issues, such as anxiety, depression, or trauma, that may be affecting the patient's well-being.
Recommendation: Offer guidance on how to address these mental health concerns, including therapy, counseling, or other interventions.
Please only return the possible mental health issues and the recommended next steps.
Patient's Report: {medical_report}`,
    icon: Brain,
    color: 'bg-gradient-to-br from-purple-50 to-indigo-50'
  },
  pulmonologist: {
    name: '呼吸科智能体',
    role: 'Pulmonologist',
    description: '呼吸科智能体专注于呼吸系统疾病的诊断和评估，能够识别哮喘、COPD、肺部感染等呼吸问题。',
    task: '审查患者报告并提供肺部评估，识别可能影响患者呼吸的潜在呼吸问题。',
    focus: '识别任何可能影响患者呼吸的潜在呼吸问题，如哮喘、COPD或肺部感染，提供应对这些呼吸问题的指导。',
    prompt: `Act like a pulmonologist. You will receive a patient's report.
Task: Review the patient's report and provide a pulmonary assessment.
Focus: Identify any potential respiratory issues, such as asthma, COPD, or lung infections, that may be affecting the patient's breathing.
Recommendation: Offer guidance on how to address these respiratory concerns, including pulmonary function tests, imaging studies, or other interventions.
Please only return the possible respiratory issues and the recommended next steps.
Patient's Report: {medical_report}`,
    icon: Wind,
    color: 'bg-gradient-to-br from-cyan-50 to-blue-50'
  }
};

export const CaseDetail = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseDetail, setCaseDetail] = useState<CaseDetailType | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
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
      setError('保存失败，请检查输入并重试');
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
        const data = await caseApi.getCaseDetail(parseInt(caseId));
        setCaseDetail(data);

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
            }
          }
        } catch (diagErr) {
          // 如果没有诊断历史，不显示错误，只是不加载诊断结果
          console.log('No diagnosis history available');
        }
      } catch (err) {
        setError('无法加载病例详情，请检查后端服务');
        console.error('Error loading case detail:', err);
      } finally {
        setLoadingCase(false);
      }
    };

    loadCaseDetail();
  }, [caseId]);

  // 处理模型选择变化
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selectedModel', modelId);
  };

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
  }, [caseId, selectedModel, loading, diagnosis]);

  const runDiagnosis = async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await caseApi.runDiagnosis(parseInt(caseId), selectedModel);
      setDiagnosis(result);
    } catch (err) {
      setError('诊断失败，请检查后端服务并稍后重试');
      console.error('Error running diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载中状态
  if (loadingCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-white flex items-center justify-center">
        <Loading size="lg" text="正在加载病例详情..." />
      </div>
    );
  }

  // 错误状态
  if (error && !caseDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-red-200/60 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">加载失败</h3>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
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
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-5 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回病例列表
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
                  {caseDetail?.patient_name || `病例 #${caseId}`}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">AI 智能诊断</p>
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
                  <span className="truncate">分析中...</span>
                ) : (
                  <span className="truncate">开始诊断</span>
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
                <h3 className="text-base font-semibold text-gray-800">病例详情</h3>
              </div>
              {!isEditing ? (
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 transition-colors rounded-none"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-colors rounded-none disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    取消
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all rounded-none disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 pb-4">
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">患者姓名</p>
                      <p className="text-sm font-semibold text-gray-800">{caseDetail.patient_name || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">病历号</p>
                      <p className="text-sm font-semibold text-gray-800">{caseDetail.patient_id || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">年龄</p>
                      <p className="text-sm font-semibold text-gray-800">{caseDetail.age ? `${caseDetail.age} 岁` : '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1.5">性别</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {caseDetail.gender === 'male' ? '男' : caseDetail.gender === 'female' ? '女' : '-'}
                      </p>
                    </div>
                  </div>

                  {caseDetail.chief_complaint && (
                    <div className="mb-6 p-5 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2.5">主诉</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{caseDetail.chief_complaint}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">完整病历</p>
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
                      <label className="block text-xs font-semibold text-gray-600 mb-2">患者姓名</label>
                      <input
                        type="text"
                        value={editForm.patient_name}
                        onChange={(e) => setEditForm({ ...editForm, patient_name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500"
                        placeholder="输入患者姓名"
                      />
                    </div>
                    <div className="p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">病历号</label>
                      <input
                        type="text"
                        value={editForm.patient_id}
                        onChange={(e) => setEditForm({ ...editForm, patient_id: e.target.value })}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500 bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="自动生成"
                      />
                      <p className="text-xs text-gray-500 mt-1">病历号由系统自动生成，不可修改</p>
                    </div>
                    <div className="p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">年龄</label>
                      <input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500"
                        placeholder="输入年龄"
                        min="0"
                        max="150"
                      />
                    </div>
                    <div className="p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">性别</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500"
                      >
                        <option value="">请选择</option>
                        <option value="male">男</option>
                        <option value="female">女</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6 p-5 border-t border-gray-200">
                    <label className="block text-xs font-semibold text-gray-600 mb-2.5">主诉</label>
                    <textarea
                      value={editForm.chief_complaint}
                      onChange={(e) => setEditForm({ ...editForm, chief_complaint: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500 min-h-[80px]"
                      placeholder="输入主诉"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">完整病历</label>
                    <textarea
                      value={editForm.raw_report}
                      onChange={(e) => setEditForm({ ...editForm, raw_report: e.target.value })}
                      className="w-full p-5 text-sm border border-gray-300 rounded-none focus:outline-none focus:border-blue-500 font-sans min-h-[320px]"
                      placeholder="输入完整病历"
                    />
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>创建时间: {new Date(caseDetail.created_at).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>
        )}
        {/* 专家智能体列表 - 增强质感，可点击查看详情 */}
        <div className="mb-7 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">专科智能体</h2>
            <p className="text-xs text-gray-500">点击卡片查看智能体详情</p>
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
                  <h3 className="font-semibold text-gray-800">心脏科</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">分析心血管系统相关症状</p>
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
                  <h3 className="font-semibold text-gray-800">心理学</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">评估心理和精神健康状况</p>
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
                  <h3 className="font-semibold text-gray-800">呼吸科</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">检查呼吸系统和肺部状况</p>
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
              <p className="text-gray-800 font-semibold text-base">AI 智能体正在分析病例</p>
              <p className="text-sm text-gray-500 mt-2">请稍候...</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5">
                  <Heart className="w-5 h-5 text-red-600 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-800">心脏科智能体</span>
                </div>
                <span className="text-xs font-semibold text-orange-600 animate-pulse">分析中</span>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5">
                  <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-800">心理学智能体</span>
                </div>
                <span className="text-xs font-semibold text-orange-600 animate-pulse">分析中</span>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5">
                  <Wind className="w-5 h-5 text-cyan-600 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-800">呼吸科智能体</span>
                </div>
                <span className="text-xs font-semibold text-orange-600 animate-pulse">分析中</span>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 - 矩形设计 */}
        {error && (
          <div className="bg-white rounded-none border border-gray-200 p-8 fade-in shadow-lg text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-3">诊断失败</h3>
            <p className="text-base text-gray-600 mb-6">{error}</p>
            <button
              onClick={runDiagnosis}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-none transition-all inline-flex items-center gap-2 shadow hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        )}

        {/* 诊断结果 */}
        {diagnosis && !loading && (
          <DiagnosisResult
            result={diagnosis.diagnosis_markdown}
            caseId={caseId ? parseInt(caseId) : undefined}
          />
        )}
      </main>
    </div>
  );
};
