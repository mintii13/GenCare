import React from 'react';
import { Star, User, Calendar, Clock, Award } from 'lucide-react';
import StarRating from './StarRating';
import { ConsultantWithRating } from '../../types/feedback';

interface ConsultantCardProps {
  consultant: ConsultantWithRating;
  onSelect?: () => void;
  selected?: boolean;
  showFullInfo?: boolean;
}

const ConsultantCard: React.FC<ConsultantCardProps> = ({
  consultant,
  onSelect,
  selected = false,
  showFullInfo = true
}) => {
  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Có thể đặt lịch';
      case 'busy':
        return 'Đang bận';
      case 'offline':
        return 'Offline';
      default:
        return 'Không xác định';
    }
  };

  const getExperienceLevel = (years: number): { text: string; color: string } => {
    if (years >= 10) {
      return { text: 'Chuyên gia', color: 'text-purple-600' };
    } else if (years >= 5) {
      return { text: 'Kinh nghiệm cao', color: 'text-blue-600' };
    } else if (years >= 2) {
      return { text: 'Có kinh nghiệm', color: 'text-green-600' };
    } else {
      return { text: 'Mới vào nghề', color: 'text-gray-600' };
    }
  };

  const experienceLevel = getExperienceLevel(consultant.experience_years);

  return (
    <div
      className={`
        bg-white rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            {consultant.user_id.avatar ? (
              <img
                src={consultant.user_id.avatar}
                alt={consultant.user_id.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
            )}
            {/* Availability indicator */}
            <div
              className={`
                absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                ${consultant.availability_status === 'available' ? 'bg-green-500' : 
                  consultant.availability_status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'}
              `}
            />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {consultant.user_id.full_name}
            </h3>
            <p className="text-sm text-gray-600">
              {consultant.specialization}
            </p>
          </div>
        </div>

        {/* Availability Status */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(consultant.availability_status)}`}>
          {getAvailabilityText(consultant.availability_status)}
        </div>
      </div>

      {/* Rating and Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <StarRating 
              rating={consultant.consultation_rating} 
              readonly 
              size="sm"
            />
            <span className="text-sm font-medium text-gray-900">
              {consultant.consultation_rating > 0 ? consultant.consultation_rating.toFixed(1) : 'Chưa có đánh giá'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {consultant.total_consultations} tư vấn
            </div>
            <div className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              <span className={experienceLevel.color}>
                {consultant.experience_years} năm
              </span>
            </div>
          </div>
        </div>

        {consultant.total_consultations > 0 && (
          <p className="text-xs text-gray-500">
            Dựa trên {consultant.total_consultations} đánh giá từ bệnh nhân
          </p>
        )}
      </div>

      {/* Bio */}
      {showFullInfo && consultant.bio && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-2">
            {consultant.bio}
          </p>
        </div>
      )}

      {/* Qualifications */}
      {showFullInfo && consultant.qualifications && consultant.qualifications.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Chuyên môn:</p>
          <div className="flex flex-wrap gap-1">
            {consultant.qualifications.slice(0, 3).map((qualification, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
              >
                {qualification}
              </span>
            ))}
            {consultant.qualifications.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                +{consultant.qualifications.length - 3} khác
              </span>
            )}
          </div>
        </div>
      )}

      {/* Experience Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${experienceLevel.color}`}>
            {experienceLevel.text}
          </span>
        </div>
        
        {selected && (
          <div className="flex items-center text-blue-600">
            <span className="text-sm font-medium">Đã chọn</span>
            <div className="w-2 h-2 bg-blue-600 rounded-full ml-2" />
          </div>
        )}
      </div>

      {/* Action hint for unavailable consultants */}
      {consultant.availability_status !== 'available' && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          {consultant.availability_status === 'busy' 
            ? 'Bác sĩ hiện đang bận, vui lòng chọn thời gian khác hoặc bác sĩ khác'
            : 'Bác sĩ hiện không trực tuyến'
          }
        </div>
      )}
    </div>
  );
};

export default ConsultantCard; 