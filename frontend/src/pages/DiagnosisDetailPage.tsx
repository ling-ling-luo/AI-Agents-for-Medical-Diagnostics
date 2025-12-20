import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, AlertCircle, Calendar, Brain, Heart, Wind } from 'lucide-react';
import { caseApi } from '../services/api';
import type { DiagnosisDetail, CaseDetail } from '../types';
import { Loading } from '../components/Loading';
import { DiagnosisResult } from '../components/DiagnosisResult';
import { AgentInfoModal } from '../components/AgentInfoModal';

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

// 智能体信息配置（复用自 CaseDetail）
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

const DiagnosisDetailPage: React.FC = () => {
  const { caseId, diagnosisId } = useParams<{ caseId: string; diagnosisId: string }>();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadDiagnosisAndCase();
  }, [caseId, diagnosisId]);

  const loadDiagnosisAndCase = async () => {
    if (!caseId || !diagnosisId) {
      setError('无效的诊断ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 并行加载诊断详情和病例详情
      const [diagnosisData, caseData] = await Promise.all([
        caseApi.getDiagnosisDetail(parseInt(caseId), parseInt(diagnosisId)),
        caseApi.getCaseDetail(parseInt(caseId))
      ]);

      setDiagnosis(diagnosisData);
      setCaseDetail(caseData);
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载诊断详情失败');
      console.error('加载诊断详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 处理智能体卡片点击
  const handleAgentClick = (agentKey: string) => {
    setSelectedAgent(agentsInfo[agentKey]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  const handleGoBack = () => {
    // 使用浏览器后退，如果没有历史记录则返回全局诊断历史页面
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/diagnoses');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="正在加载诊断详情..." />
      </div>
    );
  }

  if (error || !diagnosis || !caseDetail) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-red-200/60 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">加载失败</h3>
          <p className="text-sm text-gray-600 mb-6">{error || '未找到诊断记录'}</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
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

      {/* 顶部导航栏 - 复用 CaseDetail 样式 */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-custom py-5">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-5 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {caseDetail.gender === 'male' ? (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              ) : caseDetail.gender === 'female' ? (
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
                  {caseDetail.patient_name || `病例 #${caseId}`}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">诊断记录详情</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        {/* 病例详情卡片 - 复用 CaseDetail 样式 */}
        <div className="mb-7 bg-white rounded-none border border-gray-200 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center gap-3">
            <User className="w-5 h-5 text-gray-700" />
            <h3 className="text-base font-semibold text-gray-800">病例详情</h3>
          </div>
          <div className="p-6 pb-4">
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

            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>创建时间: {new Date(caseDetail.created_at).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        </div>

        {/* 专家智能体列表 - 复用 CaseDetail 样式 */}
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

        {/* 诊断结果 - 复用 DiagnosisResult 组件 */}
        <DiagnosisResult
          result={diagnosis.diagnosis_markdown}
          caseId={caseId ? parseInt(caseId) : undefined}
          timestamp={diagnosis.timestamp}
          model={diagnosis.model}
          executionTimeMs={diagnosis.execution_time_ms}
        />
      </main>
    </div>
  );
};

export default DiagnosisDetailPage;
