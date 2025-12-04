import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, FileText, Heart, Brain, Wind, Download, Info } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { AgentInfoModal } from './AgentInfoModal';
import { SmartDropdown, DropdownItem } from './SmartDropdown';
import { caseApi } from '../services/api';

interface DiagnosisResultProps {
  result: string;
  caseId?: number;
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

export const DiagnosisResult = ({ result, caseId }: DiagnosisResultProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleAgentClick = (agentKey: string) => {
    setSelectedAgent(agentsInfo[agentKey]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  // 导出报告
  const handleExport = async (format: 'pdf' | 'docx' | 'markdown' | 'json') => {
    if (!caseId) {
      alert('无法导出：病例ID缺失');
      return;
    }

    try {
      setExporting(true);
      setShowExportMenu(false);

      const blob = await caseApi.exportDiagnosis(caseId, format);

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagnosis-${caseId}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  // 提取诊断摘要
  const extractSummary = (markdown: string) => {
    const summaryMatch = markdown.match(/## Final Diagnosis \(Summary\)[\s\S]*?(?=##|\Z)/);
    if (summaryMatch) {
      return summaryMatch[0];
    }
    return '';
  };

  // 提取专科报告
  const extractSpecialistReports = (markdown: string) => {
    const reports: { title: string; content: string; icon: any; bgColor: string; borderColor: string; agentKey: string }[] = [];

    // 心脏科
    const cardioMatch = markdown.match(/### Cardiologist[\s\S]*?(?=###|\Z)/);
    if (cardioMatch) {
      reports.push({
        title: '心脏科',
        content: cardioMatch[0],
        icon: Heart,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        agentKey: 'cardiologist'
      });
    }

    // 心理学
    const psychMatch = markdown.match(/### Psychologist[\s\S]*?(?=###|\Z)/);
    if (psychMatch) {
      reports.push({
        title: '心理学',
        content: psychMatch[0],
        icon: Brain,
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        agentKey: 'psychologist'
      });
    }

    // 呼吸科
    const pulmoMatch = markdown.match(/### Pulmonologist[\s\S]*$/);
    if (pulmoMatch) {
      reports.push({
        title: '呼吸科',
        content: pulmoMatch[0],
        icon: Wind,
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
        agentKey: 'pulmonologist'
      });
    }

    return reports;
  };

  const summary = extractSummary(result);
  const specialistReports = extractSpecialistReports(result);

  return (
    <>
      {/* 智能体信息模态框 */}
      {selectedAgent && (
        <AgentInfoModal
          agent={selectedAgent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      <div className="space-y-6 fade-in">
        {/* 诊断完成提示 - 矩形设计 */}
        <div className="bg-white border border-gray-200 rounded-none p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-gray-800">诊断完成</h2>
              <p className="text-sm text-gray-600 mt-1">AI 智能体分析报告已生成</p>
            </div>
          </div>
        </div>

      {/* 综合诊断摘要 - 矩形设计 */}
      {summary && (
        <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-700" />
              <h3 className="text-base font-semibold text-gray-800">综合诊断摘要</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="prose prose-base max-w-none text-gray-700">
              <Markdown>{summary}</Markdown>
            </div>
          </div>
        </div>
      )}

      {/* 专科报告 - 矩形设计 */}
      <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-lg">
        <div
          className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-gray-700" />
              <div>
                <h3 className="text-base font-semibold text-gray-800">专科智能体详细报告</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {specialistReports.length} 个专科分析
                </p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="p-6 space-y-5">
            {specialistReports.map((report, index) => {
              const Icon = report.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-none overflow-hidden slide-in shadow-sm hover:shadow-md transition-shadow duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white border border-gray-200 rounded-none flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-700" />
                        </div>
                        <h4 className="text-base font-semibold text-gray-800">
                          {report.title}
                        </h4>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgentClick(report.agentKey);
                        }}
                        className="p-2 hover:bg-blue-50 rounded transition-colors group"
                        title="查看智能体详情"
                      >
                        <Info className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="prose prose-base max-w-none text-gray-700">
                      <Markdown>{report.content}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {specialistReports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-base">暂无专科报告数据</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 导出报告 - 矩形设计 */}
      <div className="bg-white rounded-none border border-gray-200 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white border border-gray-200 rounded-none flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-800">完整诊断报告</h4>
              <p className="text-sm text-gray-600 mt-1">包含所有智能体的详细分析结果</p>
            </div>
          </div>
          <SmartDropdown
            trigger={
              <button
                disabled={exporting || !caseId}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-none transition-all flex items-center gap-2 shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                <span>{exporting ? '导出中...' : '导出报告'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
            }
            isOpen={showExportMenu}
            onToggle={() => setShowExportMenu(!showExportMenu)}
            onClose={() => setShowExportMenu(false)}
            preferredPosition={{ vertical: 'top', horizontal: 'right' }}
          >
            <DropdownItem
              icon={<FileText className="w-4 h-4 text-red-500" />}
              label="PDF 格式"
              onClick={() => handleExport('pdf')}
            />
            <DropdownItem
              icon={<FileText className="w-4 h-4 text-blue-500" />}
              label="Word 格式"
              onClick={() => handleExport('docx')}
            />
            <DropdownItem
              icon={<FileText className="w-4 h-4 text-gray-500" />}
              label="Markdown 格式"
              onClick={() => handleExport('markdown')}
            />
            <DropdownItem
              icon={<FileText className="w-4 h-4 text-green-500" />}
              label="JSON 格式"
              onClick={() => handleExport('json')}
            />
          </SmartDropdown>
        </div>
      </div>
      </div>
    </>
  );
};
