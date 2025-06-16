import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType, ToastPosition } from './Toast';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  position?: ToastPosition;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number, position?: ToastPosition) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  defaultPosition?: ToastPosition;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  defaultPosition = 'top-center' 
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showToast = (
    type: ToastType, 
    message: string, 
    duration = 3000, 
    position = defaultPosition
  ) => {
    const id = generateId();
    const newToast: ToastItem = { id, type, message, duration, position };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message: string, duration = 3000) => {
    showToast('success', message, duration);
  };

  const error = (message: string, duration = 4000) => {
    showToast('error', message, duration);
  };

  const warning = (message: string, duration = 3500) => {
    showToast('warning', message, duration);
  };

  const info = (message: string, duration = 3000) => {
    showToast('info', message, duration);
  };

  const getPositionClasses = (position: ToastPosition) => {
    switch (position) {
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2 flex-col';
      case 'top-right':
        return 'top-4 right-4 flex-col';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2 flex-col-reverse';
      case 'bottom-right':
        return 'bottom-4 right-4 flex-col-reverse';
      default:
        return 'top-4 left-1/2 transform -translate-x-1/2 flex-col';
    }
  };

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position || defaultPosition;
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {} as Record<ToastPosition, ToastItem[]>);

  const contextValue: ToastContextType = {
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Render toast containers for each position */}
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed z-50 flex gap-2 ${getPositionClasses(position as ToastPosition)}`}
        >
          {positionToasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              message={toast.message}
              duration={toast.duration}
              position={toast.position}
              onClose={removeToast}
            />
          ))}
        </div>
      ))}
    </ToastContext.Provider>
  );
}; 