import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width,
  height,
  rounded = false 
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
    />
  );
};

// Card Skeleton for appointment cards, consultant cards, etc.
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <Skeleton rounded width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton height={16} width="60%" />
              <Skeleton height={12} width="40%" />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <Skeleton height={12} width="90%" />
            <Skeleton height={12} width="75%" />
            <Skeleton height={12} width="50%" />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <Skeleton height={32} width={80} rounded />
            <Skeleton height={32} width={80} rounded />
          </div>
        </div>
      ))}
    </div>
  );
};

// Table Skeleton for appointment lists, consultant lists, etc.
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Table Header */}
      <div className="border-b bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, index) => (
            <Skeleton key={index} height={16} width="70%" />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <Skeleton key={colIndex} height={14} width={`${Math.random() * 40 + 60}%`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Form Skeleton for booking forms, profile forms, etc.
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Form Title */}
      <Skeleton height={24} width="40%" />
      
      {/* Form Fields */}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton height={14} width="25%" />
            <Skeleton height={40} width="100%" rounded />
          </div>
        ))}
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Skeleton height={40} width={100} rounded />
        <Skeleton height={40} width={100} rounded />
      </div>
    </div>
  );
};

// Blog Post Skeleton
export const BlogPostSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border p-6 space-y-4">
          {/* Blog Header */}
          <div className="space-y-3">
            <Skeleton height={20} width="80%" />
            <div className="flex items-center space-x-4">
              <Skeleton rounded width={32} height={32} />
              <div className="flex-1 space-y-1">
                <Skeleton height={12} width="30%" />
                <Skeleton height={10} width="20%" />
              </div>
            </div>
          </div>
          
          {/* Blog Content */}
          <div className="space-y-2">
            <Skeleton height={12} width="100%" />
            <Skeleton height={12} width="95%" />
            <Skeleton height={12} width="85%" />
            <Skeleton height={12} width="70%" />
          </div>
          
          {/* Blog Actions */}
          <div className="flex justify-between items-center pt-3 border-t">
            <div className="flex space-x-4">
              <Skeleton height={10} width={60} />
              <Skeleton height={10} width={80} />
            </div>
            <Skeleton height={32} width={80} rounded />
          </div>
        </div>
      ))}
    </div>
  );
};

// Dashboard Stats Skeleton
export const StatsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton rounded width={40} height={40} />
            <Skeleton height={12} width={20} />
          </div>
          <Skeleton height={24} width="60%" />
          <Skeleton height={12} width="80%" />
        </div>
      ))}
    </div>
  );
};

// Schedule Calendar Skeleton
export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex justify-between items-center">
          <Skeleton height={20} width={150} />
          <div className="flex space-x-2">
            <Skeleton height={32} width={32} rounded />
            <Skeleton height={32} width={32} rounded />
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} height={14} width="100%" />
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className="aspect-square border rounded p-2">
              <Skeleton height={12} width="50%" />
              <div className="mt-2 space-y-1">
                <Skeleton height={8} width="100%" />
                <Skeleton height={8} width="80%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading Spinner
export const LoadingSpinner: React.FC<{ 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string 
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 w-full h-full" />
    </div>
  );
};

export { Skeleton }; 