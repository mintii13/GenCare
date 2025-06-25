import React, { useState } from 'react';
import { X, Send, Star } from 'lucide-react';
import StarRating from './StarRating';
import { FeedbackFormData, RatingValue } from '../../types/feedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackFormData) => Promise<void>;
  appointmentInfo: {
    consultant_name: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
  };
  loading?: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  appointmentInfo,
  loading = false
}) => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating < 1 || formData.rating > 5) {
      alert('Vui lòng chọn rating từ 1 đến 5 sao');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({ rating: 5, comment: '' });
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (rating: RatingValue) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, comment: e.target.value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Đánh giá cuộc tư vấn
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Appointment Info */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{appointmentInfo.consultant_name}</p>
            <p className="text-sm text-gray-600">
              {appointmentInfo.appointment_date} • {appointmentInfo.start_time} - {appointmentInfo.end_time}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá chất lượng tư vấn *
              </label>
              <div className="flex flex-col items-center space-y-2">
                <StarRating
                  rating={formData.rating}
                  onRatingChange={handleRatingChange}
                  size="lg"
                />
                <p className="text-sm text-gray-600 text-center">
                  {formData.rating === 1 && 'Rất không hài lòng'}
                  {formData.rating === 2 && 'Không hài lòng'}
                  {formData.rating === 3 && 'Bình thường'}
                  {formData.rating === 4 && 'Hài lòng'}
                  {formData.rating === 5 && 'Rất hài lòng'}
                </p>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét (tùy chọn)
              </label>
              <textarea
                value={formData.comment}
                onChange={handleCommentChange}
                placeholder="Chia sẻ trải nghiệm của bạn về cuộc tư vấn..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={500}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.comment.length}/500 ký tự
              </p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || formData.rating < 1}
                className="flex-1 flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi đánh giá
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help text */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            Đánh giá của bạn giúp cải thiện chất lượng dịch vụ
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal; 