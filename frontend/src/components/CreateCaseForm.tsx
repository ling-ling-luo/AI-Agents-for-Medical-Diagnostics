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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center">
        <div className="bg-white border border-green-200 rounded-2xl p-9 text-center max-w-md shadow-lg">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-5" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">病例创建成功！</h2>
          <p className="text-base text-gray-600">正在跳转到病例详情页...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      {/* 顶部导航栏 - 增强质感 */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-custom py-5">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-5 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回病例列表
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">新增病例</h1>
              <p className="text-xs text-gray-500 mt-0.5">填写患者信息</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* 基本信息 - 增强质感 */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-7 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <h3 className="text-base font-semibold text-gray-800">基本信息（必填）</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    病历号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                    placeholder="例如: 123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    患者姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                    placeholder="例如: 张三 / John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
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
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                    placeholder="例如: 45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    性别 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                  >
                    <option value="male">男 / Male</option>
                    <option value="female">女 / Female</option>
                    <option value="other">其他 / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  主诉 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm"
                  placeholder="描述患者的主要症状和就诊原因..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  报告语言 <span className="text-red-500">*</span>
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                >
                  <option value="en">英文 (English)</option>
                  <option value="zh">中文 (Chinese)</option>
                  <option value="both">双语 (Bilingual)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 详细信息（可选） - 增强质感 */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-7 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <h3 className="text-base font-semibold text-gray-800">详细信息（选填）</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">个人病史</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm"
                  placeholder="既往疾病史、手术史等..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">家族史</label>
                <textarea
                  name="family_history"
                  value={formData.family_history}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm"
                  placeholder="家族疾病史..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">生活方式</label>
                <textarea
                  name="lifestyle_factors"
                  value={formData.lifestyle_factors}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm"
                  placeholder="吸烟、饮酒、运动等生活习惯..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">用药情况</label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm"
                  placeholder="当前使用的药物及剂量..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">实验室检查</label>
                <textarea
                  name="lab_results"
                  value={formData.lab_results}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm"
                  placeholder="血液检查、影像学检查等结果..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">体格检查</label>
                <textarea
                  name="physical_exam"
                  value={formData.physical_exam}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none shadow-sm"
                  placeholder="体格检查发现..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">生命体征</label>
                <input
                  type="text"
                  name="vital_signs"
                  value={formData.vital_signs}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                  placeholder="例如: BP 120/80 mmHg, HR 75 bpm, BMI 23.5"
                />
              </div>
            </div>
          </div>

          {/* 错误提示 - 增强质感 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-7 shadow-sm">
              <p className="text-base text-red-700">{error}</p>
            </div>
          )}

          {/* 提交按钮 - 增强质感，防止文字溢出 */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold rounded-xl transition-colors shadow-sm hover:shadow whitespace-nowrap min-w-[100px]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-base font-semibold rounded-xl transition-all flex items-center gap-2 shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[130px]"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span className="truncate">创建中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">创建病例</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
