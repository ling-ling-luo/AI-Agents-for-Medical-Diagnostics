import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const DiagnosisDetailPage: React.FC = () => {
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
      setError(t('caseDetail.invalidDiagnosisId'));
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
      setError(err.response?.data?.detail || t('caseDetail.loadDiagnosisError'));
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
        <Loading size="lg" text={t('caseDetail.loadingDiagnosisDetail')} />
      </div>
    );
  }

  if (error || !diagnosis || !caseDetail) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-red-200/60 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">{t('caseDetail.loadError')}</h3>
          <p className="text-sm text-gray-600 mb-6">{error || t('caseDetail.diagnosisNotFound')}</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('caseDetail.backButton')}
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
            {t('caseDetail.backButton')}
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
                  {caseDetail.patient_name || t('caseDetail.caseNumberPrefix', { id: caseId })}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">{t('caseDetail.diagnosisRecordDetail')}</p>
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
            <h3 className="text-base font-semibold text-gray-800">{t('caseDetail.caseDetails')}</h3>
          </div>
          <div className="p-6 pb-4">
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

            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{t('caseDetail.createdTime', { time: new Date(caseDetail.created_at).toLocaleString() })}</span>
            </div>
          </div>
        </div>

        {/* 专家智能体列表 - 复用 CaseDetail 样式 */}
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
