import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Calendar, Search, Filter, AlertCircle } from 'lucide-react';
import FeedbackCard from '../../components/feedback/FeedbackCard';
import FeedbackModal from '../../components/feedback/FeedbackModal';
import StarRating from '../../components/feedback/StarRating';
import FeedbackService from '../../services/feedbackService';
import { FeedbackFormData } from '../../types/feedback';

interface CustomerFeedback {
  appointment_id: string;
  consultant_name: string;
  appointment_date: string;
  feedback: {
    rating: number;
    comment?: string;
    feedback_date: string;
  };
}

const CustomerFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  // Modals
  const [editingFeedback, setEditingFeedback] = useState<{
    appointmentId: string;
    current: FeedbackFormData;
    info: any;
  } | null>(null);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchTerm, ratingFilter, dateFilter]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await FeedbackService.getCustomerFeedbackHistory();
      if (response.success) {
        setFeedbacks(response.data);
      } else {
        setError('Không thể tải danh sách đánh giá');
      }
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      setError('Lỗi khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedbacks];

    // Search by consultant name
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.consultant_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by rating
    if (ratingFilter !== null) {
      filtered = filtered.filter(item => item.feedback.rating === ratingFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(item => 
        new Date(item.feedback.feedback_date) >= filterDate
      );
    }

    setFilteredFeedbacks(filtered);
  };

  const handleUpdateFeedback = async (data: FeedbackFormData) => {
    if (!editingFeedback) return;

    try {
      const response = await FeedbackService.updateFeedback(
        editingFeedback.appointmentId,
        {
          rating: data.rating,
          comment: data.comment
        }
      );

      if (response.success) {
        await loadFeedbacks(); // Reload to get updated data
        setEditingFeedback(null);
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Không thể cập nhật đánh giá. Vui lòng thử lại.');
    }
  };

  const handleDeleteFeedback = async (appointmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      return;
    }

    try {
      const response = await FeedbackService.deleteFeedback(appointmentId);
      if (response.success) {
        await loadFeedbacks(); // Reload to reflect changes
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Không thể xóa đánh giá. Vui lòng thử lại.');
    }
  };

  const getAverageRating = () => {
    if (filteredFeedbacks.length === 0) return 0;
    const total = filteredFeedbacks.reduce((sum, item) => sum + item.feedback.rating, 0);
    return (total / filteredFeedbacks.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredFeedbacks.forEach(item => {
      distribution[item.feedback.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const ratingDistribution = getRatingDistribution();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Đánh giá của tôi
        </h1>
        <p className="text-gray-600">
          Quản lý và xem lại các đánh giá bạn đã gửi
        </p>
      </div>

      {/* Stats Summary */}
      {filteredFeedbacks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredFeedbacks.length}
                </p>
                <p className="text-gray-600">Tổng đánh giá</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {getAverageRating()}
                </p>
                <p className="text-gray-600">Điểm trung bình</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="space-y-2">
              {Object.entries(ratingDistribution).reverse().map(([rating, count]) => (
                <div key={rating} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="w-3">{rating}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-1" />
                  </div>
                  <span className="text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={ratingFilter || ''}
            onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả đánh giá</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="year">1 năm qua</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Feedback List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {feedbacks.length === 0 ? 'Chưa có đánh giá nào' : 'Không tìm thấy đánh giá'}
          </h3>
          <p className="text-gray-600">
            {feedbacks.length === 0 
              ? 'Hãy đặt lịch tư vấn và đánh giá sau khi hoàn thành'
              : 'Thử thay đổi bộ lọc để xem kết quả khác'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFeedbacks.map((item) => (
            <FeedbackCard
              key={item.appointment_id}
              appointmentId={item.appointment_id}
              feedback={item.feedback}
              appointmentInfo={{
                consultant_name: item.consultant_name,
                appointment_date: item.appointment_date,
                start_time: '09:00', // TODO: Get from appointment data
                end_time: '10:00'    // TODO: Get from appointment data
              }}
              canEdit={true}
              canDelete={true}
              onEdit={() => setEditingFeedback({
                appointmentId: item.appointment_id,
                current: {
                  rating: item.feedback.rating as any,
                  comment: item.feedback.comment || ''
                },
                info: {
                  consultant_name: item.consultant_name,
                  appointment_date: item.appointment_date,
                  start_time: '09:00',
                  end_time: '10:00'
                }
              })}
              onDelete={() => handleDeleteFeedback(item.appointment_id)}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingFeedback && (
        <FeedbackModal
          isOpen={true}
          onClose={() => setEditingFeedback(null)}
          onSubmit={handleUpdateFeedback}
          appointmentInfo={editingFeedback.info}
        />
      )}
    </div>
  );
};

export default CustomerFeedbackPage; 