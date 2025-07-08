import React, { useState, useEffect } from 'react';
import { 
  FaFlask, 
  FaHistory, 
  FaEye, 
  FaCalendarAlt, 
  FaChartBar,
  FaExclamationTriangle,
  FaShieldAlt,
  FaPlus
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import STIAssessmentService, { STIAssessment } from '../../services/stiAssessmentService';
import { Loading } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const STIAssessmentHistory: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<STIAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<STIAssessment | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'risk'>('date');

  useEffect(() => {
    fetchAssessmentHistory();
  }, []);

  const fetchAssessmentHistory = async () => {
    try {
      setLoading(true);
      const response = await STIAssessmentService.getAssessmentHistory();
      
      if (response.success && response.data) {
        setAssessments(response.data);
      } else {
        toast.error(response.message || 'Không thể tải lịch sử đánh giá');
      }
    } catch (error) {
      console.error('Error fetching STI assessment history:', error);
      toast.error('Có lỗi xảy ra khi tải lịch sử đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Ngày không hợp lệ';
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Thời gian không hợp lệ';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Cao':
        return <FaExclamationTriangle className="text-red-600" />;
      case 'Trung bình':
        return <FaShieldAlt className="text-yellow-600" />;
      case 'Thấp':
        return <FaShieldAlt className="text-green-600" />;
      default:
        return <FaShieldAlt className="text-gray-600" />;
    }
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    const config = STIAssessmentService.formatRiskLevel(riskLevel);
    return config.color;
  };

  const getPackageName = (packageCode: string): string => {
    return STIAssessmentService.formatPackageCode(packageCode);
  };

  // Filter and sort assessments
  const filteredAndSortedAssessments = assessments
    .filter(assessment => {
      if (filterRisk === 'all') return true;
      return assessment.recommendation.risk_level === filterRisk;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        // Sort by risk level: Cao > Trung bình > Thấp
        const riskOrder = { 'Cao': 3, 'Trung bình': 2, 'Thấp': 1 };
        return (riskOrder[b.recommendation.risk_level as keyof typeof riskOrder] || 0) - 
               (riskOrder[a.recommendation.risk_level as keyof typeof riskOrder] || 0);
      }
    });

  // Stats calculation
  const stats = {
    total: assessments.length,
    high_risk: assessments.filter(a => a.recommendation.risk_level === 'Cao').length,
    medium_risk: assessments.filter(a => a.recommendation.risk_level === 'Trung bình').length,
    low_risk: assessments.filter(a => a.recommendation.risk_level === 'Thấp').length,
    recent: assessments.filter(a => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(a.created_at) > monthAgo;
    }).length
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <FaHistory className="text-2xl text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử Đánh giá STI</h1>
            </div>
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FaHistory className="text-2xl text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử Đánh giá STI</h1>
            </div>
            
            <Link
              to="/sti-assessment"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              <span>Đánh giá mới</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <FaChartBar className="text-2xl text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Tổng đánh giá</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <FaExclamationTriangle className="text-2xl text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-900">{stats.high_risk}</div>
              <div className="text-sm text-red-600">Nguy cơ cao</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <FaShieldAlt className="text-2xl text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">{stats.medium_risk}</div>
              <div className="text-sm text-yellow-600">Nguy cơ trung bình</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <FaShieldAlt className="text-2xl text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{stats.low_risk}</div>
              <div className="text-sm text-green-600">Nguy cơ thấp</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <FaCalendarAlt className="text-2xl text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{stats.recent}</div>
              <div className="text-sm text-blue-600">Tháng gần đây</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Lọc theo mức độ nguy cơ:</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="Cao">Nguy cơ cao</option>
                <option value="Trung bình">Nguy cơ trung bình</option>
                <option value="Thấp">Nguy cơ thấp</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sắp xếp theo:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'risk')}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Ngày tạo</option>
                <option value="risk">Mức độ nguy cơ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assessment List */}
        {filteredAndSortedAssessments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FaFlask className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {assessments.length === 0 ? 'Chưa có đánh giá nào' : 'Không tìm thấy kết quả'}
            </h3>
            <p className="text-gray-500 mb-6">
              {assessments.length === 0 
                ? 'Bạn chưa thực hiện đánh giá STI nào. Hãy bắt đầu đánh giá đầu tiên!'
                : 'Thử thay đổi bộ lọc để xem kết quả khác.'
              }
            </p>
            {assessments.length === 0 && (
              <Link
                to="/sti-assessment"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                <span>Bắt đầu đánh giá</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedAssessments.map((assessment) => (
              <div 
                key={assessment._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAssessment(assessment)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <FaFlask className="text-purple-600" />
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">
                            Đánh giá STI #{assessment._id.slice(-6)}
                          </span>
                          {getRiskLevelIcon(assessment.recommendation.risk_level)}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(assessment.recommendation.risk_level)}`}>
                          {assessment.recommendation.risk_level}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FaCalendarAlt className="text-gray-400" />
                          <span>{formatDateTime(assessment.created_at)}</span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-600">Gói đề xuất: </span>
                          <span className="font-medium text-gray-900">
                            {getPackageName(assessment.recommendation.recommended_package)}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-600">Tuổi tại thời điểm đánh giá: </span>
                          <span className="font-medium text-gray-900">
                            {assessment.assessment_data.age} tuổi
                          </span>
                        </div>
                      </div>
                      
                      {assessment.recommendation.reasoning.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Lý do đề xuất: </span>
                          {assessment.recommendation.reasoning[0]}
                          {assessment.recommendation.reasoning.length > 1 && (
                            <span className="text-blue-600 ml-1">
                              (+{assessment.recommendation.reasoning.length - 1} lý do khác)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button className="text-blue-600 hover:text-blue-800 ml-4">
                      <FaEye className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedAssessment && (
          <AssessmentDetailModal
            assessment={selectedAssessment}
            onClose={() => setSelectedAssessment(null)}
          />
        )}
      </div>
    </div>
  );
};

// Modal để xem chi tiết assessment
interface AssessmentDetailModalProps {
  assessment: STIAssessment;
  onClose: () => void;
}

const AssessmentDetailModal: React.FC<AssessmentDetailModalProps> = ({ assessment, onClose }) => {
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Thời gian không hợp lệ';
    }
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    const config = STIAssessmentService.formatRiskLevel(riskLevel);
    return config.color;
  };

  const getPackageName = (packageCode: string): string => {
    return STIAssessmentService.formatPackageCode(packageCode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Chi tiết Đánh giá STI</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin Đánh giá</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Ngày đánh giá:</label>
                  <p className="font-medium">{formatDate(assessment.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mã đánh giá:</label>
                  <p className="font-medium">#{assessment._id.slice(-8)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tuổi:</label>
                  <p className="font-medium">{assessment.assessment_data.age} tuổi</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Giới tính:</label>
                  <p className="font-medium">{assessment.assessment_data.gender}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Hoạt động tình dục:</label>
                  <p className="font-medium">{assessment.assessment_data.sexually_active}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Sử dụng bao cao su:</label>
                  <p className="font-medium">{assessment.assessment_data.condom_use}</p>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Kết quả Đánh giá</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Mức độ nguy cơ:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(assessment.recommendation.risk_level)}`}>
                    {assessment.recommendation.risk_level}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Gói đề xuất:</span>
                  <p className="font-medium text-purple-900">
                    {getPackageName(assessment.recommendation.recommended_package)}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-600 block mb-2">Lý do đề xuất:</span>
                  <ul className="space-y-1">
                    {assessment.recommendation.reasoning.map((reason, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Package Info if available */}
            {assessment.recommendation.package_info && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Thông tin Gói Xét nghiệm</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Tên gói:</span>
                    <p className="font-medium">{assessment.recommendation.package_info.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Giá:</span>
                    <p className="font-medium text-blue-900">
                      {assessment.recommendation.package_info.price.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Các xét nghiệm bao gồm:</span>
                    <div className="flex flex-wrap gap-1">
                      {assessment.recommendation.package_info.tests.map((test, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {test}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Mô tả:</span>
                    <p className="text-sm text-gray-700">{assessment.recommendation.package_info.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            {(assessment.assessment_data.previous_sti_history?.length || 
              assessment.assessment_data.symptoms?.length ||
              assessment.assessment_data.risk_factors?.length) && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Thông tin Bổ sung</h3>
                <div className="space-y-3">
                  {assessment.assessment_data.previous_sti_history?.length && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Tiền sử STI:</span>
                      <div className="flex flex-wrap gap-1">
                        {assessment.assessment_data.previous_sti_history.map((history, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            {history}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {assessment.assessment_data.symptoms?.length && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Triệu chứng hiện tại:</span>
                      <div className="flex flex-wrap gap-1">
                        {assessment.assessment_data.symptoms.map((symptom, index) => (
                          <span key={index} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {assessment.assessment_data.risk_factors?.length && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Yếu tố nguy cơ:</span>
                      <div className="flex flex-wrap gap-1">
                        {assessment.assessment_data.risk_factors.map((risk, index) => (
                          <span key={index} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                            {risk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
            
            <Link
              to="/sti-assessment"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đánh giá mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default STIAssessmentHistory; 