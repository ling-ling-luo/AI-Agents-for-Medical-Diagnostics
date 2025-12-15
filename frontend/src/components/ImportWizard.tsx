import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Download, ArrowRight, Info, Sparkles, FileCheck
} from 'lucide-react';
import { caseApi, type ImportCasesResponse } from '../services/api';
import { Loading } from './Loading';
import { downloadBlob } from '../utils/download';

const ImportStep = {
  SELECT_FILE: 0,
  VALIDATE: 1,
  UPLOAD: 2,
  RESULT: 3,
} as const;

type ImportStepType = typeof ImportStep[keyof typeof ImportStep];

interface ImportWizardProps {
  onComplete?: () => void;
  embedded?: boolean; // 是否为嵌入模式（在标签页中使用）
}

export const ImportWizard = ({ onComplete, embedded = false }: ImportWizardProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<ImportStepType>(ImportStep.SELECT_FILE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportCasesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatGuide = {
    json: {
      name: 'JSON 格式',
      icon: FileText,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      description: '适合批量导入多个结构化病例',
      example: `[
  {
    "patient_name": "Robert Miller",
    "age": 63,
    "gender": "male",
    "chief_complaint": "persistent cough..."
  }
]`,
    },
    txt: {
      name: 'TXT 格式',
      icon: FileCheck,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      description: '适合导入标准病例模板',
      example: `Medical Case Report
Name: Robert Miller
Age: 63
Gender: Male

Chief Complaint:
The patient complains of...`,
    },
  };

  // 用于展示导入格式示例（避免未使用变量）
  void formatGuide;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setCurrentStep(ImportStep.VALIDATE);
    validateFile(file);
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['.json', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      setError('不支持的文件格式，请上传 JSON 或 TXT 文件');
      setCurrentStep(ImportStep.SELECT_FILE);
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小超过 10MB 限制');
      setCurrentStep(ImportStep.SELECT_FILE);
      return false;
    }

    return true;
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      setCurrentStep(ImportStep.UPLOAD);

      const importResult = await caseApi.importCases(selectedFile);
      setResult(importResult);
      setCurrentStep(ImportStep.RESULT);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '导入失败，请重试');
      setCurrentStep(ImportStep.VALIDATE);
    } finally {
      setUploading(false);
    }
  };

  const downloadExample = (type: 'json' | 'txt') => {
    let content = '';
    let filename = '';

    if (type === 'json') {
      content = JSON.stringify([
        {
          patient_id: "100231",
          patient_name: "Robert Miller",
          age: 63,
          gender: "male",
          chief_complaint: "persistent cough with sputum production",
          medical_history: "COPD diagnosed at 60",
          family_history: "Father died of lung cancer at age 70",
          lifestyle_factors: "Smoker (40 pack-years)",
          medications: "Salbutamol inhaler, Tiotropium",
          lab_results: "FEV1 reduced to 55% predicted",
          physical_exam: "Prolonged expiration, wheezing on auscultation",
          vital_signs: "BP 130/85 mmHg, HR 90 bpm",
        }
      ], null, 2);
      filename = 'example_case.json';
    } else {
      content = `Medical Case Report
Patient ID: 100231
Name: Robert Miller
Age: 63
Gender: Male
Date of Report: 2025-01-15

Chief Complaint:
The patient complains of persistent cough with sputum production, shortness of breath, and wheezing, especially in the mornings, for the past two years.

Medical History:
Family History: Father died of lung cancer at age 70.
Personal Medical History: Chronic obstructive pulmonary disease (COPD) diagnosed at 60.
Lifestyle Factors: Smoker (40 pack-years), occasional alcohol, sedentary.
Medications: Salbutamol inhaler (as needed), Tiotropium (daily).

Recent Lab and Diagnostic Results:
Pulmonary Function Test: FEV1 reduced to 55% predicted.
Chest X-ray: Hyperinflated lungs, flattened diaphragms.
CBC: Normal.

Physical Examination Findings:
Vital Signs: BP 130/85 mmHg, HR 90 bpm, BMI 26.8.
Respiratory Exam: Prolonged expiration, wheezing on auscultation.`;
      filename = 'example_case.txt';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    downloadBlob(blob, filename);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 pb-8 border-b border-gray-200">
      {[
        { step: ImportStep.SELECT_FILE, label: '选择文件', icon: Upload },
        { step: ImportStep.VALIDATE, label: '文件验证', icon: FileCheck },
        { step: ImportStep.UPLOAD, label: '数据导入', icon: Sparkles },
        { step: ImportStep.RESULT, label: '导入完成', icon: CheckCircle },
      ].map((item, index) => {
        const StepIcon = item.icon;
        const isActive = currentStep === item.step;
        const isCompleted = currentStep > item.step;

        return (
          <div key={item.step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-500 border-blue-500 text-white scale-110'
                    : isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600 font-semibold' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < 3 && (
              <div className="flex items-center mx-6">
                <div
                  className={`w-16 h-px transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case ImportStep.SELECT_FILE:
        return (
          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 上传区域 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  点击上传或拖拽文件到此处
                </p>
                <p className="text-sm text-gray-500">
                  支持 JSON 和 TXT 格式 · 最大 10MB
                </p>
              </div>
            </div>

            {/* 格式说明 - 简化为文字 */}
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">JSON 格式</p>
                    <p className="text-xs text-gray-500 mt-0.5">适合批量导入多个结构化病例</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadExample('json');
                    }}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载示例
                  </button>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">TXT 格式</p>
                    <p className="text-xs text-gray-500 mt-0.5">适合导入标准病例模板</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadExample('txt');
                    }}
                    className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载示例
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case ImportStep.VALIDATE:
        return (
          <div className="space-y-6">
            {/* 验证成功提示 */}
            <div className="flex items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                文件验证通过 ✓
              </h3>
            </div>

            {/* 文件信息 - 使用细线分隔 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">文件名</span>
                  <span className="text-sm font-medium text-gray-800">{selectedFile?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">文件大小</span>
                  <span className="text-sm font-medium text-gray-800">
                    {((selectedFile?.size || 0) / 1024).toFixed(2)} KB
                  </span>
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">验证失败</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setCurrentStep(ImportStep.SELECT_FILE);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-all hover:drop-shadow-sm"
              >
                重新选择
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-blue-500 hover:text-blue-700 font-medium flex items-center gap-2 transition-all hover:drop-shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                开始导入
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case ImportStep.UPLOAD:
        void uploading;
        return (
          <div className="py-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                正在导入病例数据...
              </h3>
              <p className="text-sm text-gray-500 mb-8">智能解析中，请稍候</p>
              <Loading size="lg" text="" />
            </div>
          </div>
        );

      case ImportStep.RESULT:
        return (
          <div className="space-y-6">
            {result && (
              <>
                {/* 结果图标 */}
                <div className="flex items-center justify-center py-8">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    result.failed_count === 0
                      ? 'bg-green-500'
                      : result.success_count === 0
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}>
                    {result.failed_count === 0 ? (
                      <CheckCircle className="w-10 h-10 text-white" />
                    ) : result.success_count === 0 ? (
                      <AlertCircle className="w-10 h-10 text-white" />
                    ) : (
                      <Info className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>

                {/* 结果消息 */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {result.message}
                  </h3>
                </div>

                {/* 统计信息 - 使用细线分隔 */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center py-3 border-r border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">总计</p>
                      <p className="text-2xl font-bold text-gray-800">{result.total_count}</p>
                    </div>
                    <div className="text-center py-3 border-r border-gray-200">
                      <p className="text-xs text-green-600 mb-1">成功</p>
                      <p className="text-2xl font-bold text-green-600">{result.success_count}</p>
                    </div>
                    <div className="text-center py-3">
                      <p className="text-xs text-red-600 mb-1">失败</p>
                      <p className="text-2xl font-bold text-red-600">{result.failed_count}</p>
                    </div>
                  </div>
                </div>

                {/* 失败详情 */}
                {result.failed_cases.length > 0 && (
                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded max-h-64 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm font-semibold text-yellow-800">失败详情</p>
                    </div>
                    <ul className="space-y-2">
                      {result.failed_cases.map((failed, idx) => (
                        <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2 py-2 border-b border-yellow-100 last:border-0">
                          <span className="text-yellow-600">•</span>
                          <span>
                            病历号 <span className="font-semibold">{failed.patient_id}</span>: {failed.error}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setResult(null);
                      setCurrentStep(ImportStep.SELECT_FILE);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-all hover:drop-shadow-sm"
                  >
                    继续导入
                  </button>
                  <button
                    onClick={() => {
                      if (embedded) {
                        // 嵌入模式：通过回调切换标签页
                        onComplete?.();
                      } else {
                        // 独立模式：导航到病例列表
                        navigate('/cases');
                      }
                    }}
                    className="px-4 py-2 text-blue-500 hover:text-blue-700 font-medium transition-all hover:drop-shadow-sm"
                  >
                    返回病例列表
                  </button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white'}>
      <main className={embedded ? 'py-6' : 'container-custom py-10'}>
        <div className={`${embedded ? 'bg-white border' : 'bg-white'} border-gray-200 rounded-lg p-8`}>
          {renderStepIndicator()}
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
};
