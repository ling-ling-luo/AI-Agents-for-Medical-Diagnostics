import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { caseApi } from '../services/api';
import type { AllDiagnosisItem, DiagnosisFilters } from '../types';
import { DiagnosisFiltersComponent } from '../components/DiagnosisFilters';
import { Pagination } from '../components/Pagination';
import { formatDateTime, formatExecutionTime, formatGender } from '../utils/diagnosisHelpers';

const AllDiagnosisHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [diagnoses, setDiagnoses] = useState<AllDiagnosisItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // 从 URL 参数初始化筛选器
  const getInitialFilters = (): DiagnosisFilters => {
    const patientId = searchParams.get('patient_id');
    return {
      sort: 'run_timestamp',
      order: 'desc',
      ...(patientId && { patient_id: patientId })
    };
  };

  // 筛选状态
  const [filters, setFilters] = useState<DiagnosisFilters>(getInitialFilters());

  // 排序状态
  const [sortField, setSortField] = useState<string>('run_timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadDiagnoses();
  }, [currentPage, sortField, sortOrder]);

  const loadDiagnoses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await caseApi.getAllDiagnoses(currentPage, pageSize, {
        ...filters,
        sort: sortField,
        order: sortOrder
      });
      setDiagnoses(response.items);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / pageSize));
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载诊断历史失败');
      console.error('加载诊断历史失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: DiagnosisFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadDiagnosesWithFilters(newFilters);
  };

  const loadDiagnosesWithFilters = async (newFilters: DiagnosisFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await caseApi.getAllDiagnoses(1, pageSize, {
        ...newFilters,
        sort: sortField,
        order: sortOrder
      });
      setDiagnoses(response.items);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / pageSize));
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载诊断历史失败');
      console.error('加载诊断历史失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    const defaultFilters: DiagnosisFilters = {
      sort: 'run_timestamp',
      order: 'desc'
    };
    setFilters(defaultFilters);
    setSortField('run_timestamp');
    setSortOrder('desc');
    setCurrentPage(1);
    loadDiagnosesWithFilters(defaultFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  const handleViewDiagnosis = (diagnosis: AllDiagnosisItem) => {
    // 直接跳转到独立的诊断详情页面
    navigate(`/diagnoses/${diagnosis.case_id}/${diagnosis.id}`);
  };

  const handleViewCase = (caseId: number) => {
    navigate(`/case/${caseId}`);
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">诊断历史记录</h1>
          <p className="text-gray-600 mt-1">查看所有病例的诊断历史记录</p>
        </div>

      <DiagnosisFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* 排序和统计栏 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-4 mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>共找到 {total} 条记录</span>
              <div className="flex items-center gap-2">
                <span>排序:</span>
                <button
                  onClick={() => handleSort('run_timestamp')}
                  className={`px-2 py-1 rounded ${
                    sortField === 'run_timestamp'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  诊断时间 {sortField === 'run_timestamp' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  onClick={() => handleSort('patient_id')}
                  className={`px-2 py-1 rounded ${
                    sortField === 'patient_id'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  病例号 {sortField === 'patient_id' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
              </div>
            </div>
          </div>

          {/* 诊断记录列表 */}
          {diagnoses.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm text-center py-12 text-gray-500">
              没有找到符合条件的诊断记录
            </div>
          ) : (
            <div className="space-y-6">
              {diagnoses.map((diagnosis) => (
                <div
                  key={`${diagnosis.case_id}-${diagnosis.id}`}
                  className="bg-white border border-gray-300 rounded hover:shadow-md transition-shadow"
                >
                    {/* 病例基本信息 - 第一部分 */}
                    <div className="flex items-start justify-between p-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleViewCase(diagnosis.case_id)}
                          className="text-lg text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          {diagnosis.patient_id}
                        </button>
                        <span className="text-base text-gray-700 font-medium">
                          {diagnosis.patient_name || '未知'}
                        </span>
                        {diagnosis.age && (
                          <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                            {diagnosis.age}岁
                          </span>
                        )}
                        {diagnosis.gender && (
                          <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                            {formatGender(diagnosis.gender)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleViewDiagnosis(diagnosis)}
                        className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 whitespace-nowrap shadow-sm hover:shadow transition-all"
                      >
                        查看详情
                      </button>
                    </div>

                    {/* 细线分隔 */}
                    <div className="border-t border-gray-200"></div>

                    {/* 诊断元信息 - 第二部分 */}
                    <div className="flex items-center gap-6 text-sm p-6">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">诊断时间:</span>
                        <span className="text-gray-600">{formatDateTime(diagnosis.run_timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">模型:</span>
                        <span className="text-gray-600">{diagnosis.model_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">耗时:</span>
                        <span className="text-gray-600">{formatExecutionTime(diagnosis.execution_time_ms)}</span>
                      </div>
                      {diagnosis.creator_username && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">创建者:</span>
                          <span className="text-gray-600">{diagnosis.creator_full_name || diagnosis.creator_username}</span>
                        </div>
                      )}
                    </div>

                    {/* 细线分隔 */}
                    <div className="border-t border-gray-200"></div>

                    {/* 诊断预览内容 - 第三部分 */}
                    <div className="text-sm text-gray-700 p-6 leading-relaxed">
                      {diagnosis.diagnosis_preview}
                    </div>
                  </div>
                ))}
              </div>
            )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
      </div>
    </div>
  );
};

export default AllDiagnosisHistory;
