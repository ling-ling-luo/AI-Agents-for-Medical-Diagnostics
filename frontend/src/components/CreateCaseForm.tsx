import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Loader, CheckCircle, User, FileText,
  Heart, Activity, Stethoscope, Pill, FlaskConical, ClipboardList
} from 'lucide-react';
import { caseApi } from '../services/api';
import type { CreateCaseRequest } from '../types';

export const CreateCaseForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.patient_name || !formData.chief_complaint) {
      setError('请填写必填项：病历号、姓名和主诉');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await caseApi.createCase(formData);
      setSuccess(true);

      // 2秒后跳转到病例详情页
      setTimeout(() => {
        navigate(`/case/${result.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建病例失败，请检查输入');
      console.error('Error creating case:', err);
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md border-2 border-green-200 rounded-3xl p-12 text-center max-w-md shadow-2xl fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">病例创建成功！</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      {/* 顶部导航栏 - 增强质感 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container-custom py-5">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4 transition-colors text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            返回病例列表
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">新增病例</h1>
              <p className="text-sm text-gray-500 mt-0.5">填写患者的详细医疗信息</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-10">
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
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    placeholder="例如: P123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-cyan-500 rounded"></div>
                    患者姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    placeholder="例如: 张三 / John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-green-500 rounded"></div>
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
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    placeholder="例如: 45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                    <div className="w-1 h-5 bg-purple-500 rounded"></div>
                    性别 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                  >
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
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm hover:shadow-md"
                  placeholder="描述患者的主要症状和就诊原因..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <div className="w-1 h-5 bg-indigo-500 rounded"></div>
                  报告语言 <span className="text-red-500">*</span>
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                >
                  <option value="en">🇬🇧 英文 (English)</option>
                  <option value="zh">🇨🇳 中文 (Chinese)</option>
                  <option value="both">🌐 双语 (Bilingual)</option>
                </select>
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
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all resize-none shadow-sm hover:shadow-md"
                  placeholder="既往疾病史、手术史、过敏史等..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <div className="w-1 h-5 bg-indigo-500 rounded"></div>
                  家族史
                </label>
                <textarea
                  name="family_history"
                  value={formData.family_history}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all resize-none shadow-sm hover:shadow-md"
                  placeholder="家族疾病史、遗传病史等..."
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
                  name="lifestyle_factors"
                  value={formData.lifestyle_factors}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all resize-none shadow-sm hover:shadow-md"
                  placeholder="吸烟、饮酒、运动习惯、饮食习惯、作息时间等..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-500 rounded"></div>
                  <Pill className="w-4 h-4" />
                  用药情况
                </label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all resize-none shadow-sm hover:shadow-md"
                  placeholder="当前使用的药物、剂量、频率、用药时长等..."
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
                  name="lab_results"
                  value={formData.lab_results}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none shadow-sm hover:shadow-md"
                  placeholder="血液检查、尿液检查、影像学检查（X光、CT、MRI等）、病理检查等结果..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <div className="w-1 h-5 bg-amber-500 rounded"></div>
                  <Stethoscope className="w-4 h-4" />
                  体格检查
                </label>
                <textarea
                  name="physical_exam"
                  value={formData.physical_exam}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all resize-none shadow-sm hover:shadow-md"
                  placeholder="体格检查发现、触诊、听诊、视诊等..."
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
                  name="vital_signs"
                  value={formData.vital_signs}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all shadow-sm hover:shadow-md"
                  placeholder="例如: BP 120/80 mmHg, HR 75 bpm, RR 16/min, T 36.8°C, BMI 23.5"
                />
              </div>
            </div>
          </div>

          {/* 错误提示 - 增强质感 */}
          {error && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 mb-8 shadow-lg fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-red-800 mb-1">提交失败</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 提交按钮 - 增强质感 */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-3.5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 text-base font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-base font-bold rounded-xl transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin flex-shrink-0" />
                  <span>创建中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 flex-shrink-0" />
                  <span>创建病例</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
