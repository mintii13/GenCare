import React, { useState, useEffect } from 'react';
import { FaFlask, FaEye, FaExclamationTriangle, FaShieldAlt, FaCalendarAlt } from 'react-icons/fa';
import STIAssessmentService, { STIAssessment } from '../../services/stiAssessmentService';
import { Loading } from '../ui';
import { useAuth } from '../../contexts/AuthContext';

interface STIHistorySectionProps {
  customerId: string;
  className?: string;
}

const STIHistorySection: React.FC<STIHistorySectionProps> = ({ customerId, className = '' }) => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<STIAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<STIAssessment | null>(null);

  // Kiểm tra quyền access
  const canViewSTIHistory = user?.role === 'consultant';

  useEffect(() => {
    if (!canViewSTIHistory || !customerId) {
      setLoading(false);
      return;
    }

    fetchSTIHistory();
  }, [customerId, canViewSTIHistory]);

  const fetchSTIHistory = async () => {
    try {
      setLoading(true);
      // Gọi service để lấy history của customer hiện tại 
      // Note: Cần backend hỗ trợ consultant lấy history của customer cụ thể
      const response = await STIAssessmentService.getAssessmentHistory();
      
      if (response.success && response.data) {
        // Filter assessments theo customer_id (frontend filtering)
        const customerAssessments = response.data.filter(
          assessment => assessment.customer_id === customerId
        );
        setAssessments(customerAssessments);
      }
    } catch (error) {
      console.error('Error fetching STI history for customer:', error);
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

  // Không hiển thị nếu user không có quyền
  if (!canViewSTIHistory) {
    return null;
  }

  if (loading) {
    return (
      <div className={`bg-purple-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <FaFlask className="text-purple-600" />
          <h3 className="font-semibold text-gray-900">Lịch sử Đánh giá STI</h3>
        </div>
        <Loading />
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className={`bg-purple-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <FaFlask className="text-purple-600" />
          <h3 className="font-semibold text-gray-900">Lịch sử Đánh giá STI</h3>
        </div>
        <div className="text-center text-gray-500 py-4">
          <FaFlask className="mx-auto text-3xl mb-2 opacity-50" />
          <p>Khách hàng chưa thực hiện đánh giá STI nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-purple-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FaFlask className="text-purple-600" />
          <h3 className="font-semibold text-gray-900">Lịch sử Đánh giá STI</h3>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            {assessments.length} đánh giá
          </span>
        </div>
        
        {assessments.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            {expanded ? 'Thu gọn' : 'Xem tất cả'}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {(expanded ? assessments : assessments.slice(0, 3)).map((assessment, index) => (
          <div 
            key={assessment._id}
            className="bg-white rounded-lg p-3 border border-purple-200 hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => setSelectedAssessment(assessment)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <FaCalendarAlt className="text-gray-500 text-sm" />
                  <span className="text-sm text-gray-600">
                    {formatDateTime(assessment.created_at)}
                  </span>
                  {getRiskLevelIcon(assessment.recommendation.risk_level)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-xs text-gray-500">Mức độ nguy cơ:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(assessment.recommendation.risk_level)}`}>
                      {assessment.recommendation.risk_level}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Gói đề xuất:</span>
                    <span className="ml-2 text-xs font-medium text-gray-900">
                      {getPackageName(assessment.recommendation.recommended_package)}
                    </span>
                  </div>
                </div>
                
                {assessment.recommendation.reasoning.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Lý do: </span>
                    {assessment.recommendation.reasoning[0]}
                    {assessment.recommendation.reasoning.length > 1 && '...'}
                  </div>
                )}
              </div>
              
              <button className="text-purple-600 hover:text-purple-800 ml-2">
                <FaEye />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAssessment && (
        <AssessmentDetailModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Chi tiết Đánh giá STI</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin Đánh giá</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Ngày đánh giá:</label>
                  <p className="font-medium">{formatDate(assessment.created_at)}</p>
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
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default STIHistorySection; 