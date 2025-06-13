import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Có lỗi xảy ra',
  message = 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
  onRetry,
  showRetry = true,
  className = '',
  icon
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4 text-red-500">
        {icon || <AlertCircle size={48} />}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message}
      </p>
      
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <RefreshCw size={16} className="mr-2" />
          Thử lại
        </button>
      )}
    </div>
  );
};

// Empty state component
export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({
  title = 'Không có dữ liệu',
  message = 'Chưa có thông tin để hiển thị.',
  action,
  icon,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4 text-gray-400">
        {icon || (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 mb-4">
        {message}
      </p>
      
      {action && action}
    </div>
  );
};

export default ErrorState; 