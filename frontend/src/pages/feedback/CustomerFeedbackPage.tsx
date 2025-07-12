import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Calendar, Search, Filter, AlertCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { FeedbackService } from '../../services/feedbackService';
import { toast } from 'react-hot-toast';

interface CustomerFeedback {
  appointment_id: string;
  consultant_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  feedback: {
    rating: number;
    comment?: string;
    feedback_date: string;
  };
}

interface FeedbackFormData {
  rating: number;
  comment?: string;
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
      setError(null);
      const response = await FeedbackService.getCustomerFeedbackHistory();
      if (response.success && response.data) {
        setFeedbacks(response.data as CustomerFeedback[]);
      } else {
        setError('Không thể tải danh sách đánh giá');
      }
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      setError('Lỗi khi tải danh sách đánh giá');
      toast.error('Không thể tải danh sách đánh giá');
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
        toast.success('Đánh giá đã được cập nhật thành công!');
      } else {
        toast.error('Không thể cập nhật đánh giá. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Không thể cập nhật đánh giá. Vui lòng thử lại.');
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
        toast.success('Đánh giá đã được xóa thành công!');
      } else {
        toast.error('Không thể xóa đánh giá. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Không thể xóa đánh giá. Vui lòng thử lại.');
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
            <div key={item.appointment_id} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {item.consultant_name}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(item.appointment_date).toLocaleDateString()}
                    {item.start_time && item.end_time && ` (${item.start_time} - ${item.end_time})`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 text-sm">
                    {new Date(item.feedback.feedback_date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center text-yellow-500">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-4 h-4 ${item.feedback.rating > i ? 'fill-yellow-500' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-800 mb-4">{item.feedback.comment || 'Không có nhận xét'}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingFeedback({
                    appointmentId: item.appointment_id,
                    current: {
                      rating: item.feedback.rating as any,
                      comment: item.feedback.comment || ''
                    },
                    info: {
                      consultant_name: item.consultant_name,
                      appointment_date: item.appointment_date,
                      start_time: item.start_time,
                      end_time: item.end_time
                    }
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-1" /> Chỉnh sửa
                </button>
                <button
                  onClick={() => handleDeleteFeedback(item.appointment_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 border w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex justify-between items-start p-4 rounded-t dark:rounded-t-lg dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Chỉnh sửa đánh giá
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingFeedback(null)}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  data-modal-hide="defaultModal"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                      Đánh giá
                    </label>
                                         <select
                       id="rating"
                       value={editingFeedback.current.rating}
                       onChange={(e) => setEditingFeedback(prev => prev ? { 
                         ...prev, 
                         current: { ...prev.current, rating: Number(e.target.value) } 
                       } : prev)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     >
                      <option value="1">1 sao</option>
                      <option value="2">2 sao</option>
                      <option value="3">3 sao</option>
                      <option value="4">4 sao</option>
                      <option value="5">5 sao</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                      Nhận xét (tùy chọn)
                    </label>
                                         <textarea
                       id="comment"
                       rows={4}
                       value={editingFeedback.current.comment || ''}
                       onChange={(e) => setEditingFeedback(prev => prev ? { 
                         ...prev, 
                         current: { ...prev.current, comment: e.target.value } 
                       } : prev)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                       placeholder="Viết một nhận xét để chia sẻ kinh nghiệm của bạn..."
                     ></textarea>
                  </div>
                </div>
              </div>
              <div className="flex items-center p-6 space-x-2 rounded-b dark:border-gray-600">
                <button
                  onClick={() => setEditingFeedback(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleUpdateFeedback(editingFeedback.current)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerFeedbackPage;  