import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Download, ArrowLeft, ArrowRight, Info
} from 'lucide-react';
import { caseApi, type ImportCasesResponse } from '../services/api';
import { Loading } from './Loading';

enum ImportStep {
  SELECT_FILE,    // 选择文件
  VALIDATE,       // 验证文件
  UPLOAD,         // 上传处理
  RESULT,         // 结果展示
}

interface ImportWizardProps {
  onComplete?: () => void;
}

export const ImportWizard = ({ onComplete }: ImportWizardProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<ImportStep>(ImportStep.SELECT_FILE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportCasesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 文件格式说明
  const formatGuide = {
    json: {
      name: 'JSON 格式',
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

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setCurrentStep(ImportStep.VALIDATE);

    // 自动验证
    validateFile(file);
  };

  // 验证文件
  const validateFile = (file: File) => {
    const allowedTypes = ['.json', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      setError('不支持的文件格式，请上传 JSON 或 TXT 文件');
      setCurrentStep(ImportStep.SELECT_FILE);
      return false;
    }

    // 文件大小限制（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小超过 10MB 限制');
      setCurrentStep(ImportStep.SELECT_FILE);
      return false;
    }

    return true;
  };

  // 执行导入
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

  // 下载示例文件
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

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { step: ImportStep.SELECT_FILE, label: '选择文件' },
        { step: ImportStep.VALIDATE, label: '验证' },
        { step: ImportStep.UPLOAD, label: '导入' },
        { step: ImportStep.RESULT, label: '完成' },
      ].map((item, index) => (
        <div key={item.step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep >= item.step
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index + 1}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              currentStep >= item.step ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {item.label}
          </span>
          {index < 3 && (
            <div
              className={`w-16 h-1 mx-4 ${
                currentStep > item.step ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case ImportStep.SELECT_FILE:
        return (
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 拖拽上传区域 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                点击上传文件
              </p>
              <p className="text-sm text-gray-500">
                支持 JSON 和 TXT 格式，文件大小不超过 10MB
              </p>
            </div>

            {/* 格式说明 */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(formatGuide).map(([key, guide]) => (
                <div key={key} className="bg-gray-50 rounded-xl p-6 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-800">
                      {guide.name}
                    </h4>
                    <button
                      onClick={() => downloadExample(key as 'json' | 'txt')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      下载示例
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
                  <pre className="bg-white p-3 rounded-lg text-xs text-gray-700 overflow-x-auto">
                    {guide.example}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        );

      case ImportStep.VALIDATE:
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              文件验证通过
            </h3>
            <p className="text-gray-600 mb-6">
              文件名：{selectedFile?.name}<br />
              文件大小：{((selectedFile?.size || 0) / 1024).toFixed(2)} KB
            </p>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">验证失败</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setCurrentStep(ImportStep.SELECT_FILE);
                }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
              >
                重新选择
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                开始导入
              </button>
            </div>
          </div>
        );

      case ImportStep.UPLOAD:
        return (
          <div className="text-center">
            <Loading size="lg" text="正在导入病例，请稍候..." />
          </div>
        );

      case ImportStep.RESULT:
        return (
          <div className="text-center">
            {result && (
              <>
                {result.failed_count === 0 ? (
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                ) : result.success_count === 0 ? (
                  <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                ) : (
                  <Info className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                )}

                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {result.message}
                </h3>
                <p className="text-gray-600 mb-6">
                  共处理 {result.total_count} 个病例：
                  成功 {result.success_count} 个，失败 {result.failed_count} 个
                </p>

                {result.failed_cases.length > 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 text-left max-h-64 overflow-y-auto">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">失败详情：</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {result.failed_cases.map((failed, idx) => (
                        <li key={idx}>
                          • 病历号 {failed.patient_id}: {failed.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setResult(null);
                      setCurrentStep(ImportStep.SELECT_FILE);
                    }}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                  >
                    继续导入
                  </button>
                  <button
                    onClick={() => {
                      onComplete?.();
                      navigate('/');
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold"
                  >
                    完成
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">导入病例</h1>
                <p className="text-xs text-gray-500 mt-0.5">批量导入病例数据</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {renderStepIndicator()}
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
};
