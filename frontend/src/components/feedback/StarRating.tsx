import React from 'react';
import { Star } from 'lucide-react';
import { RatingValue } from '../../types/feedback';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: RatingValue) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showLabel = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const getRatingLabel = (rating: number): string => {
    if (rating <= 1) return 'Rất không hài lòng';
    if (rating <= 2) return 'Không hài lòng';
    if (rating <= 3) return 'Bình thường';
    if (rating <= 4) return 'Hài lòng';
    return 'Rất hài lòng';
  };

  const handleStarClick = (starValue: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue as RatingValue);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={readonly}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-all duration-200
              ${!readonly ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded' : ''}
            `}
          >
            <Star
              className={`
                ${sizeClasses[size]}
                transition-colors duration-200
                ${star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
                }
              `}
            />
          </button>
        ))}
      </div>
      
      {showLabel && (
        <span className="text-sm text-gray-600 ml-2">
          {rating > 0 ? getRatingLabel(rating) : 'Chưa đánh giá'}
        </span>
      )}
      
      {rating > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          ({rating}/5)
        </span>
      )}
    </div>
  );
};

export default StarRating; 