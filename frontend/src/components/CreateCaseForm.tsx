import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Loader, CheckCircle, User, FileText,
  Heart, Activity, Stethoscope, Pill, FlaskConical, ClipboardList
} from 'lucide-react';
import { caseApi } from '../services/api';
import type { CreateCaseRequest } from '../types';

interface CreateCaseFormProps {
  embedded?: boolean; // 是否为嵌入模式（在标签页中使用）
  editMode?: boolean; // 是否为编辑模式
  caseId?: number; // 编辑时的病例 ID
}

export const CreateCaseForm = ({ embedded = false, editMode = false, caseId }: CreateCaseFormProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(editMode); // 编辑模式需要加载数据
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCaseRequest>({
    patient_id: '',
    patient_name: '',
    age: 0,
    gender: 'male',
    chief_complaint: '',
    medical_history: '',
    family_history: '',
    lifestyle_factors: '',
    medications: '',
    lab_results: '',
    physical_exam: '',
    vital_signs: '',
    language: 'en',
  });

  // 编辑模式：加载病例数据
  const loadCaseData = useCallback(async () => {
    if (!caseId) return;

    try {
      setLoadingData(true);
      const data = await caseApi.getCaseDetail(caseId);

      // 填充表单数据
      setFormData({
        patient_id: data.patient_id || '',
        patient_name: data.patient_name || '',
        age: data.age || 0,
        gender: data.gender || 'male',
        chief_complaint: data.chief_complaint || '',
        medical_history: '',
        family_history: '',
        lifestyle_factors: '',
        medications: '',
        lab_results: '',
        physical_exam: '',
        vital_signs: '',
        language: 'en',
      });
    } catch (err) {
      setError('加载病例数据失败');
      console.error('Error loading case:', err);
    } finally {
      setLoadingData(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (editMode && caseId) {
      loadCaseData();
    }
  }, [editMode, caseId, loadCaseData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_name || !formData.chief_complaint) {
      setError('请填写必填项：姓名和主诉');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editMode && caseId) {
        // 编辑模式：更新病例（patient_id由后端自动更新，不发送）
        const { patient_id: _patientId, ...updateData } = formData;
        void _patientId;
        await caseApi.updateCase(caseId, updateData);
        setSuccess(true);

        // 2秒后跳转到病例详情页
        setTimeout(() => {
          navigate(`/case/${caseId}`);
        }, 2000);
      } else {
        // 新增模式：创建病例（patient_id由后端自动生成，不发送）
        const { patient_id: _patientId, ...createData } = formData;
        void _patientId;
        const result = await caseApi.createCase(createData);
        setSuccess(true);

        // 2秒后跳转到病例详情页
        setTimeout(() => {
          navigate(`/case/${result.id}`);
        }, 2000);
      }
    } catch (err) {
      const detail = err instanceof Error ? undefined : (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || `${editMode ? '更新' : '创建'}病例失败，请检查输入`);
      console.error(`Error ${editMode ? 'updating' : 'creating'} case:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value,
    }));
  };

  // 加载数据中
  if (loadingData) {
    return (
      <div className={`${embedded ? 'py-8' : 'min-h-screen'} ${embedded ? '' : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-white'} flex items-center justify-center p-4`}>
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在加载病例数据...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`${embedded ? 'py-8' : 'min-h-screen'} ${embedded ? '' : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-white'} flex items-center justify-center p-4`}>
        <div className="bg-white/80 backdrop-blur-md border-2 border-green-200 rounded-3xl p-12 text-center max-w-md shadow-2xl fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {editMode ? '病例更新成功！' : '病例创建成功！'}
          </h2>
          <p className="text-base text-gray-600">正在跳转到病例详情页...</p>
          <div className="mt-6">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white'}>
      <main className={embedded ? 'py-6' : 'container-custom py-10'}>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
          {/* 基本信息 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <User className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-gray-800">基本信息</h3>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    病历号 {editMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleChange}
                    disabled={!editMode}
                    required={editMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-100 text-gray-500 cursor-not-allowed"
                    placeholder={editMode ? "例如: P123456" : "自动生成"}
                  />
                  {!editMode && (
                    <p className="text-xs text-gray-500 mt-1">
                      病历号将根据创建时间、性别和年龄自动生成（格式：年月日时分+性别+年龄）
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    患者姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="例如: 张三 / John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年龄 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleChange}
                    required
                    min="0"
                    max="150"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="例如: 45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性别 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="male">👨 男 / Male</option>
                    <option value="female">👩 女 / Female</option>
                    <option value="other">⚧ 其他 / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主诉 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="描述患者的主要症状和就诊原因..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  报告语言 <span className="text-red-500">*</span>
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="en">🇬🇧 英文 (English)</option>
                  <option value="zh">🇨🇳 中文 (Chinese)</option>
                  <option value="both">🌐 双语 (Bilingual)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 医疗历史 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <FileText className="w-5 h-5 text-purple-500" />
              <h3 className="text-base font-semibold text-gray-800">医疗历史</h3>
              <span className="text-xs text-gray-500">（选填）</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人病史
                </label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  placeholder="既往疾病史、手术史、过敏史等..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  家族史
                </label>
                <textarea
                  name="family_history"
                  value={formData.family_history}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  placeholder="家族疾病史、遗传病史等..."
                />
              </div>
            </div>
          </div>

          {/* 生活方式与用药 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <Heart className="w-5 h-5 text-green-500" />
              <h3 className="text-base font-semibold text-gray-800">生活方式与用药</h3>
              <span className="text-xs text-gray-500">（选填）</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生活方式
                </label>
                <textarea
                  name="lifestyle_factors"
                  value={formData.lifestyle_factors}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500 transition-colors resize-none"
                  placeholder="吸烟、饮酒、运动习惯、饮食习惯、作息时间等..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Pill className="w-4 h-4" />
                  用药情况
                </label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500 transition-colors resize-none"
                  placeholder="当前使用的药物、剂量、频率、用药时长等..."
                />
              </div>
            </div>
          </div>

          {/* 检查结果 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <FlaskConical className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-semibold text-gray-800">检查结果</h3>
              <span className="text-xs text-gray-500">（选填）</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <FlaskConical className="w-4 h-4" />
                  实验室检查
                </label>
                <textarea
                  name="lab_results"
                  value={formData.lab_results}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  placeholder="血液检查、尿液检查、影像学检查（X光、CT、MRI等）、病理检查等结果..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Stethoscope className="w-4 h-4" />
                  体格检查
                </label>
                <textarea
                  name="physical_exam"
                  value={formData.physical_exam}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  placeholder="体格检查发现、触诊、听诊、视诊等..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  生命体征
                </label>
                <input
                  type="text"
                  name="vital_signs"
                  value={formData.vital_signs}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="例如: BP 120/80 mmHg, HR 75 bpm, RR 16/min, T 36.8°C, BMI 23.5"
                />
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded mb-6">
              <div className="flex items-start gap-3">
                <ClipboardList className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">提交失败</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-all hover:drop-shadow-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>{editMode ? '保存中...' : '创建中...'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span>{editMode ? '保存更改' : '创建病例'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
