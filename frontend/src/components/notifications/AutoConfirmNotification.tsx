import React, { useEffect, useState } from 'react';
import { FaInfoCircle, FaTimes } from 'react-icons/fa';

interface AutoConfirmNotificationProps {
  onClose?: () => void;
}

interface NotificationData {
  appointment: any;
  notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration: number;
  };
}

const AutoConfirmNotification: React.FC<AutoConfirmNotificationProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const handleAutoConfirmNotification = (event: CustomEvent<NotificationData>) => {
      const notificationData = event.detail;
      setNotifications(prev => [...prev, notificationData]);

      // Tự động ẩn sau duration
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notificationData));
      }, notificationData.notification.duration);
    };

    // Lắng nghe event từ AutoConfirmService
    window.addEventListener('autoConfirmNotification', handleAutoConfirmNotification as EventListener);

    return () => {
      window.removeEventListener('autoConfirmNotification', handleAutoConfirmNotification as EventListener);
    };
  }, []);

  const removeNotification = (notification: NotificationData) => {
    setNotifications(prev => prev.filter(n => n !== notification));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notificationData, index) => (
        <div
          key={index}
          className={`
            max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4
            transform transition-all duration-300 ease-in-out
            ${index === notifications.length - 1 ? 'animate-slide-in-right' : ''}
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FaInfoCircle color="#3b82f6" size={16} />
              </div>
            </div>
            
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notificationData.notification.title}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {notificationData.notification.message}
              </p>
              
              {/* Thông tin appointment */}
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Appointment ID:</span>
                  <span className="font-mono text-gray-700">
                    {notificationData.appointment._id.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => removeNotification(notificationData)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={16} />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{
                animation: `shrink ${notificationData.notification.duration}ms linear forwards`
              }}
            />
          </div>
        </div>
      ))}
      
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AutoConfirmNotification;