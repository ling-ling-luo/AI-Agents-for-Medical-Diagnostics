import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Download, ArrowLeft, ArrowRight, Info, Sparkles, FileCheck
} from 'lucide-react';
import { caseApi, type ImportCasesResponse } from '../services/api';
import { Loading } from './Loading';

const ImportStep = {
  SELECT_FILE: 0,
  VALIDATE: 1,
  UPLOAD: 2,
  RESULT: 3,
} as const;

type ImportStepType = typeof ImportStep[keyof typeof ImportStep];

interface ImportWizardProps {
  onComplete?: () => void;
}

export const ImportWizard = ({ onComplete }: ImportWizardProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<ImportStepType>(ImportStep.SELECT_FILE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [_uploading, setUploading] = useState(false);
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
    "patient_id": "100231",
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
Patient ID: 100231
Name: Robert Miller
Age: 63
Gender: Male

Chief Complaint:
The patient complains of...`,
    },
  };

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

    } catch (err: any) {
      setError(err.response?.data?.detail || '导入失败，请重试');
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
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
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white scale-110 shadow-blue-200'
                    : isCompleted
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-green-200'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                <StepIcon className="w-6 h-6" />
              </div>
              <span
                className={`mt-3 text-sm font-medium transition-colors ${
                  isActive ? 'text-blue-600 font-semibold' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < 3 && (
              <div className="relative flex items-center mx-4">
                <div
                  className={`w-24 h-1 rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-200'
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
          <div className="text-center space-y-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-3 border-dashed border-gray-300 rounded-3xl p-16 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-cyan-400/0 group-hover:from-blue-400/5 group-hover:to-cyan-400/5 transition-all duration-300" />
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-3">
                  点击上传或拖拽文件到此处
                </p>
                <p className="text-sm text-gray-500">
                  支持 JSON 和 TXT 格式 · 最大 10MB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(formatGuide).map(([key, guide]) => {
                const GuideIcon = guide.icon;
                return (
                  <div
                    key={key}
                    className={`${guide.bgColor} border border-gray-200 rounded-2xl p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${guide.color} rounded-xl flex items-center justify-center shadow-md`}>
                          <GuideIcon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">
                          {guide.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => downloadExample(key as 'json' | 'txt')}
                        className="px-3 py-1.5 bg-white hover:bg-gray-50 text-blue-600 text-sm font-semibold rounded-lg flex items-center gap-2 shadow-sm hover:shadow transition-all"
                      >
                        <Download className="w-4 h-4" />
                        下载示例
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{guide.description}</p>
                    <pre className="bg-white/70 backdrop-blur-sm p-4 rounded-xl text-xs text-gray-700 overflow-x-auto border border-gray-200">
                      {guide.example}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case ImportStep.VALIDATE:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                文件验证通过 ✓
              </h3>
              <div className="inline-block bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl px-6 py-3">
                <p className="text-sm text-gray-600 mb-1">文件名</p>
                <p className="text-base font-semibold text-gray-800">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500 mt-2">
                  大小: {((selectedFile?.size || 0) / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 text-left shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-red-800 mb-1">验证失败</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setCurrentStep(ImportStep.SELECT_FILE);
                }}
                className="px-8 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
              >
                重新选择
              </button>
              <button
                onClick={handleImport}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                开始导入
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case ImportStep.UPLOAD:
        return (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              正在导入病例数据...
            </h3>
            <p className="text-gray-500 mb-8">智能解析中，请稍候</p>
            <Loading size="lg" text="" />
          </div>
        );

      case ImportStep.RESULT:
        return (
          <div className="text-center space-y-6">
            {result && (
              <>
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${
                  result.failed_count === 0
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                    : result.success_count === 0
                    ? 'bg-gradient-to-br from-red-100 to-pink-100'
                    : 'bg-gradient-to-br from-yellow-100 to-orange-100'
                }`}>
                  {result.failed_count === 0 ? (
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  ) : result.success_count === 0 ? (
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  ) : (
                    <Info className="w-12 h-12 text-yellow-600" />
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    {result.message}
                  </h3>
                  <div className="inline-flex items-center gap-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl px-8 py-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">总计</p>
                      <p className="text-2xl font-bold text-gray-800">{result.total_count}</p>
                    </div>
                    <div className="w-px h-12 bg-gray-300" />
                    <div>
                      <p className="text-xs text-green-600 mb-1">成功</p>
                      <p className="text-2xl font-bold text-green-600">{result.success_count}</p>
                    </div>
                    <div className="w-px h-12 bg-gray-300" />
                    <div>
                      <p className="text-xs text-red-600 mb-1">失败</p>
                      <p className="text-2xl font-bold text-red-600">{result.failed_count}</p>
                    </div>
                  </div>
                </div>

                {result.failed_cases.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 text-left max-h-64 overflow-y-auto shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p className="text-base font-bold text-yellow-800">失败详情</p>
                    </div>
                    <ul className="text-sm text-yellow-800 space-y-2">
                      {result.failed_cases.map((failed, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span>病历号 <span className="font-semibold">{failed.patient_id}</span>: {failed.error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setResult(null);
                      setCurrentStep(ImportStep.SELECT_FILE);
                    }}
                    className="px-8 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
                  >
                    继续导入
                  </button>
                  <button
                    onClick={() => {
                      onComplete?.();
                      navigate('/');
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  >
                    返回首页
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">导入病例向导</h1>
                <p className="text-sm text-gray-500 mt-0.5">批量导入病例数据</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center gap-2 shadow-sm hover:shadow transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-10">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200 p-10">
          {renderStepIndicator()}
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
};
