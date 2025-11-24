import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, User, Save, X, AlertCircle } from 'lucide-react';
import { caseApi } from '../services/api';
import type { CaseDetail, UpdateCaseRequest } from '../types';
import { Loading } from './Loading';

export const EditCase = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalCase, setOriginalCase] = useState<CaseDetail | null>(null);

  const [formData, setFormData] = useState<UpdateCaseRequest>({
    patient_id: '',
    patient_name: '',
    age: undefined,
    gender: '',
    chief_complaint: '',
    medical_history: '',
    family_history: '',
    lifestyle_factors: '',
    medications: '',
    lab_results: '',
    physical_exam: '',
    vital_signs: '',
    language: 'zh',
  });

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await caseApi.getCaseDetail(parseInt(caseId));
      setOriginalCase(data);

      // 初始化表单数据
      setFormData({
        patient_id: data.patient_id || '',
        patient_name: data.patient_name || '',
        age: data.age || undefined,
        gender: data.gender || '',
        chief_complaint: data.chief_complaint || '',
        medical_history: '',
        family_history: '',
        lifestyle_factors: '',
        medications: '',
        lab_results: '',
        physical_exam: '',
        vital_signs: '',
        language: 'zh',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载病例失败');
      console.error('Error loading case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;

    try {
      setSubmitting(true);
      setError(null);

      // 只发送修改过的字段
      const updates: UpdateCaseRequest = {};
      if (formData.patient_id !== originalCase?.patient_id) updates.patient_id = formData.patient_id;
      if (formData.patient_name !== originalCase?.patient_name) updates.patient_name = formData.patient_name;
      if (formData.age !== originalCase?.age) updates.age = formData.age;
      if (formData.gender !== originalCase?.gender) updates.gender = formData.gender;
      if (formData.chief_complaint !== originalCase?.chief_complaint) updates.chief_complaint = formData.chief_complaint;

      // 额外字段（如果填写了）
      if (formData.medical_history) updates.medical_history = formData.medical_history;
      if (formData.family_history) updates.family_history = formData.family_history;
      if (formData.lifestyle_factors) updates.lifestyle_factors = formData.lifestyle_factors;
      if (formData.medications) updates.medications = formData.medications;
      if (formData.lab_results) updates.lab_results = formData.lab_results;
      if (formData.physical_exam) updates.physical_exam = formData.physical_exam;
      if (formData.vital_signs) updates.vital_signs = formData.vital_signs;
      if (formData.language) updates.language = formData.language;

      await caseApi.updateCase(parseInt(caseId), updates);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || '更新失败，请重试');
      console.error('Error updating case:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="正在加载病例数据..." />
      </div>
    );
  }

  if (error && !originalCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-secondary">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">编辑病例资料</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  病历号：{originalCase?.patient_id}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm font-medium"
            >
              <X className="w-4 h-4" />
              取消
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">更新失败</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  基本信息
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      病历号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.patient_id}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      患者姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      年龄 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      max="150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      性别 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">请选择</option>
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 主诉 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主诉 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.chief_complaint}
                  onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                  placeholder="患者的主要症状描述"
                />
              </div>

              {/* 补充信息 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">补充信息（可选）</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">病史</label>
                    <textarea
                      value={formData.medical_history}
                      onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="既往病史、慢性病等"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">家族史</label>
                    <textarea
                      value={formData.family_history}
                      onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="家族疾病史"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">生活方式</label>
                    <textarea
                      value={formData.lifestyle_factors}
                      onChange={(e) => setFormData({ ...formData, lifestyle_factors: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="吸烟、饮酒、运动习惯等"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">用药情况</label>
                    <textarea
                      value={formData.medications}
                      onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="当前正在服用的药物"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">检查结果</label>
                    <textarea
                      value={formData.lab_results}
                      onChange={(e) => setFormData({ ...formData, lab_results: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="实验室检查、影像学检查结果"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">体格检查</label>
                    <textarea
                      value={formData.physical_exam}
                      onChange={(e) => setFormData({ ...formData, physical_exam: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="体格检查发现"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">生命体征</label>
                    <textarea
                      value={formData.vital_signs}
                      onChange={(e) => setFormData({ ...formData, vital_signs: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="血压、心率、体温等"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 按钮组 */}
            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-md"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>保存更改</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
