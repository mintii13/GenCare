import React from 'react';
import { FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';

interface BookingLayoutProps {
  title: string;
  subtitle: string;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onBackToAppointments?: () => void;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonText?: string;
}

const BookingLayout: React.FC<BookingLayoutProps> = ({
  title,
  subtitle,
  currentStep,
  totalSteps,
  stepTitles,
  onBackToAppointments,
  children,
  showBackButton = false,
  onBackClick,
  backButtonText = "Quay lại"
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
            {onBackToAppointments && (
              <a
                href="/my-appointments"
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
              >
                <FaCalendarAlt className="inline mr-1" />
                Lịch hẹn của tôi
              </a>
            )}
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-3 overflow-x-auto">
            {Array.from({ length: totalSteps }, (_, index) => {
              const stepNum = index + 1;
              const isActive = currentStep >= stepNum;
              const isCompleted = currentStep > stepNum;
              return (
                <React.Fragment key={stepNum}>
                  <div className={`flex items-center ${
                    isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                  } flex-shrink-0`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isCompleted ? 'bg-green-600 text-white' : 
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}>
                      {isCompleted ? '✓' : stepNum}
                    </div>
                    <span className="ml-1 text-xs font-medium">{stepTitles[index]}</span>
                  </div>
                  {stepNum < totalSteps && <div className="w-4 h-px bg-gray-300 mx-2 flex-shrink-0"></div>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Back Button (if needed) */}
        {showBackButton && onBackClick && (
          <div className="mb-4">
            <button
              onClick={onBackClick}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              <FaArrowLeft className="inline mr-1" />
              {backButtonText}
            </button>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default BookingLayout; 