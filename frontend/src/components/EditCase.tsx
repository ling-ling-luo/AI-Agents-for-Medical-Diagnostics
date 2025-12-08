import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText, User, Save, AlertCircle, ArrowLeft, Edit,
  Heart, Activity, Pill, FlaskConical, Stethoscope
} from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center">
        <Loading size="lg" text="正在加载病例数据..." />
      </div>
    );
  }

  if (error && !originalCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 text-center border-2 border-red-200">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">加载失败</h3>
          <p className="text-base text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-base font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4 transition-colors text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            返回病例列表
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Edit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">编辑病例资料</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  病历号：{originalCase?.patient_id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-10">
          {error && (
            <div className="mb-8 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-red-800 mb-1">更新失败</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 基本信息 - 增强质感 */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 overflow-hidden mb-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">基本信息</h3>
                    <p className="text-xs text-gray-600 mt-0.5">患者的基础档案资料</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6 bg-gradient-to-br from-white to-blue-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                      <div className="w-1 h-5 bg-blue-500 rounded"></div>
                      病历号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.patient_id}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                      required
                      className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                      <div className="w-1 h-5 bg-cyan-500 rounded"></div>
                      患者姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      required
                      className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                      <div className="w-1 h-5 bg-green-500 rounded"></div>
                      年龄 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                      required
                      min="0"
                      max="150"
                      className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                      <div className="w-1 h-5 bg-purple-500 rounded"></div>
                      性别 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      required
                      className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    >
                      <option value="">请选择</option>
                      <option value="male">👨 男 / Male</option>
                      <option value="female">👩 女 / Female</option>
                      <option value="other">⚧ 其他 / Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-orange-500 rounded"></div>
                    主诉 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.chief_complaint}
                    onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                    required
                    rows={4}
                    placeholder="患者的主要症状描述"
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* 医疗历史 - 增强质感 */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 overflow-hidden mb-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">医疗历史</h3>
                    <p className="text-xs text-gray-600 mt-0.5">患者的既往病史和家族史（选填）</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6 bg-gradient-to-br from-white to-purple-50/30">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-purple-500 rounded"></div>
                    个人病史
                  </label>
                  <textarea
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    rows={3}
                    placeholder="既往疾病史、手术史、过敏史等..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all resize-none shadow-sm hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-indigo-500 rounded"></div>
                    家族史
                  </label>
                  <textarea
                    value={formData.family_history}
                    onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                    rows={3}
                    placeholder="家族疾病史、遗传病史等..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all resize-none shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* 生活方式与用药 - 增强质感 */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 overflow-hidden mb-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">生活方式与用药</h3>
                    <p className="text-xs text-gray-600 mt-0.5">患者的生活习惯和药物使用（选填）</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6 bg-gradient-to-br from-white to-green-50/30">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-green-500 rounded"></div>
                    生活方式
                  </label>
                  <textarea
                    value={formData.lifestyle_factors}
                    onChange={(e) => setFormData({ ...formData, lifestyle_factors: e.target.value })}
                    rows={3}
                    placeholder="吸烟、饮酒、运动习惯、饮食习惯、作息时间等..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all resize-none shadow-sm hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-emerald-500 rounded"></div>
                    <Pill className="w-4 h-4" />
                    用药情况
                  </label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    rows={3}
                    placeholder="当前使用的药物、剂量、频率、用药时长等..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all resize-none shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* 检查结果 - 增强质感 */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200 overflow-hidden mb-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-br from-orange-50 to-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                    <FlaskConical className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">检查结果</h3>
                    <p className="text-xs text-gray-600 mt-0.5">实验室检查和体格检查（选填）</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6 bg-gradient-to-br from-white to-orange-50/30">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-orange-500 rounded"></div>
                    <FlaskConical className="w-4 h-4" />
                    实验室检查
                  </label>
                  <textarea
                    value={formData.lab_results}
                    onChange={(e) => setFormData({ ...formData, lab_results: e.target.value })}
                    rows={4}
                    placeholder="血液检查、尿液检查、影像学检查（X光、CT、MRI等）、病理检查等结果..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none shadow-sm hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-amber-500 rounded"></div>
                    <Stethoscope className="w-4 h-4" />
                    体格检查
                  </label>
                  <textarea
                    value={formData.physical_exam}
                    onChange={(e) => setFormData({ ...formData, physical_exam: e.target.value })}
                    rows={3}
                    placeholder="体格检查发现、触诊、听诊、视诊等..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none shadow-sm hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-red-500 rounded"></div>
                    <Activity className="w-4 h-4" />
                    生命体征
                  </label>
                  <input
                    type="text"
                    value={formData.vital_signs}
                    onChange={(e) => setFormData({ ...formData, vital_signs: e.target.value })}
                    placeholder="例如: BP 120/80 mmHg, HR 75 bpm, RR 16/min, T 36.8°C, BMI 23.5"
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* 按钮组 - 增强质感 */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={submitting}
                className="px-8 py-3.5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 text-base font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-base font-bold rounded-xl transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 flex-shrink-0" />
                    <span>保存更改</span>
                  </>
                )}
              </button>
            </div>
          </form>
      </main>
    </div>
  );
};
