import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  position?: ToastPosition;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
          borderColor: 'border-green-400',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          bgColor: 'bg-gradient-to-r from-red-500 to-rose-500',
          borderColor: 'border-red-400',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
          borderColor: 'border-amber-400',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          borderColor: 'border-blue-400',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          borderColor: 'border-blue-400',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
    }
  };

  const config = getToastConfig();

  return (
    <div
      className={`
        relative flex items-center gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm
        transition-all duration-300 ease-out min-w-[320px] max-w-[480px]
        ${config.bgColor} ${config.borderColor}
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        hover:shadow-xl hover:scale-105
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${config.iconColor}`}>
        {config.icon}
      </div>

      {/* Message */}
      <p className={`flex-1 font-medium ${config.textColor}`}>
        {message}
      </p>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className={`
          flex-shrink-0 p-1 rounded-full transition-all duration-200
          ${config.textColor} hover:bg-white/20
        `}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar (if duration > 0) */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-b-xl transition-all ease-linear"
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* Custom CSS for progress bar animation */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast; 