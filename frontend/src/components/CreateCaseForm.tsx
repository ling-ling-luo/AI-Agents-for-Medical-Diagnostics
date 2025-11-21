import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader, CheckCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-white flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm border border-green-200/60 rounded-2xl p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-800 mb-2">病例创建成功！</h2>
          <p className="text-sm text-gray-600">正在跳转到病例详情页...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-white">
      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container-custom py-5">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-5 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回病例列表
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400/80 to-cyan-400/80 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-800">新增病例</h1>
              <p className="text-xs text-gray-500 mt-0.5">填写患者信息</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* 基本信息 */}
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-3.5 border-b border-gray-200/60 bg-gradient-to-br from-blue-50/30 to-cyan-50/20">
              <h3 className="text-sm font-medium text-gray-800">基本信息（必填）</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    病历号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all"
                    placeholder="例如: 123456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    患者姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all"
                    placeholder="例如: 张三 / John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all"
                    placeholder="例如: 45"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    性别 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all"
                  >
                    <option value="male">男 / Male</option>
                    <option value="female">女 / Female</option>
                    <option value="other">其他 / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  主诉 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all resize-none"
                  placeholder="描述患者的主要症状和就诊原因..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  报告语言 <span className="text-red-500">*</span>
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all"
                >
                  <option value="en">英文 (English)</option>
                  <option value="zh">中文 (Chinese)</option>
                  <option value="both">双语 (Bilingual)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 详细信息（可选） */}
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-3.5 border-b border-gray-200/60 bg-gradient-to-br from-blue-50/30 to-cyan-50/20">
              <h3 className="text-sm font-medium text-gray-800">详细信息（选填）</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">个人病史</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all resize-none"
                  placeholder="既往疾病史、手术史等..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">家族史</label>
                <textarea
                  name="family_history"
                  value={formData.family_history}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all resize-none"
                  placeholder="家族疾病史..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">生活方式</label>
                <textarea
                  name="lifestyle_factors"
                  value={formData.lifestyle_factors}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all resize-none"
                  placeholder="吸烟、饮酒、运动等生活习惯..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">用药情况</label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all resize-none"
                  placeholder="当前使用的药物及剂量..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">实验室检查</label>
                <textarea
                  name="lab_results"
                  value={formData.lab_results}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all resize-none"
                  placeholder="血液检查、影像学检查等结果..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">体格检查</label>
                <textarea
                  name="physical_exam"
                  value={formData.physical_exam}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all resize-none"
                  placeholder="体格检查发现..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">生命体征</label>
                <input
                  type="text"
                  name="vital_signs"
                  value={formData.vital_signs}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/70 border border-gray-300/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-300/60 transition-all"
                  placeholder="例如: BP 120/80 mmHg, HR 75 bpm, BMI 23.5"
                />
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  创建病例
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
