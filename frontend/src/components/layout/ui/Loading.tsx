import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text = 'Đang tải...', 
  fullScreen = false,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <div className="text-center">
          <div className={`animate-spin rounded-full border-3 border-gray-300 border-t-blue-600 ${getSizeClasses()} mx-auto mb-4`}></div>
          <p className={`text-gray-600 ${getTextSize()}`}>{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`animate-spin rounded-full border-3 border-gray-300 border-t-blue-600 ${getSizeClasses()} mb-4`}></div>
      <p className={`text-gray-600 ${getTextSize()}`}>{text}</p>
    </div>
  );
};

// Spinner component cho inline loading
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4 border-2';
      case 'lg':
        return 'w-8 h-8 border-3';
      default:
        return 'w-6 h-6 border-2';
    }
  };

  return (
    <div 
      className={`animate-spin rounded-full border-gray-300 border-t-blue-600 ${getSizeClasses()} ${className}`}
    ></div>
  );
};

export default Loading; 