import React, { useState } from 'react';
import { Calendar, Clock, Edit2, Trash2, MessageSquare } from 'lucide-react';
import StarRating from './StarRating';
import { FeedbackData, AppointmentInfo } from '../../types/feedback';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface FeedbackCardProps {
  appointmentId: string;
  feedback: FeedbackData;
  appointmentInfo: AppointmentInfo;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isLoading?: boolean;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({
  appointmentId,
  feedback,
  appointmentInfo,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  isLoading = false
}) => {
  const [showFullComment, setShowFullComment] = useState(false);

  const feedbackDate = new Date(feedback.feedback_date);
  const appointmentDate = new Date(appointmentInfo.appointment_date);

  // Check if feedback can be edited (within 24 hours)
  const canEditFeedback = canEdit && feedbackDate && 
    (Date.now() - feedbackDate.getTime()) < 24 * 60 * 60 * 1000;

  const canDeleteFeedback = canDelete && feedbackDate && 
    (Date.now() - feedbackDate.getTime()) < 24 * 60 * 60 * 1000;

  const truncateComment = (comment: string, maxLength: number = 150) => {
    if (comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {appointmentInfo.consultant_name}
          </h3>
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {format(appointmentDate, 'dd/MM/yyyy', { locale: vi })}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {appointmentInfo.start_time} - {appointmentInfo.end_time}
            </div>
          </div>
        </div>

        {/* Actions */}
        {(canEditFeedback || canDeleteFeedback) && (
          <div className="flex items-center space-x-2">
            {canEditFeedback && onEdit && (
              <button
                onClick={onEdit}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="Chỉnh sửa đánh giá"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {canDeleteFeedback && onDelete && (
              <button
                onClick={onDelete}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Xóa đánh giá"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Đánh giá</span>
          <span className="text-xs text-gray-500">
            {format(feedbackDate, 'dd/MM/yyyy HH:mm', { locale: vi })}
          </span>
        </div>
        <StarRating 
          rating={feedback.rating} 
          readonly 
          size="md"
          showLabel
        />
      </div>

      {/* Comment */}
      {feedback.comment && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-start space-x-2">
            <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed">
                {showFullComment 
                  ? feedback.comment 
                  : truncateComment(feedback.comment)
                }
              </p>
              {feedback.comment.length > 150 && (
                <button
                  onClick={() => setShowFullComment(!showFullComment)}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1 font-medium"
                >
                  {showFullComment ? 'Thu gọn' : 'Xem thêm'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Delete time limit warning */}
      {(canEditFeedback || canDeleteFeedback) && (
        <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          Bạn có thể chỉnh sửa hoặc xóa đánh giá trong vòng 24 giờ sau khi gửi.
        </div>
      )}
    </div>
  );
};

export default FeedbackCard; 