import React, { useState, useEffect } from 'react';
import AutoConfirmService from '../../services/autoConfirmService';
import { FaBan, FaRocket, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const AutoConfirmStatus: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    // Kiểm tra trạng thái ban đầu
    setIsRunning(AutoConfirmService.isRunning());

    // Cập nhật trạng thái mỗi 30 giây
    const interval = setInterval(() => {
      setIsRunning(AutoConfirmService.isRunning());
      setLastCheck(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (isRunning) {
      AutoConfirmService.stop();
      setIsRunning(false);
    } else {
      AutoConfirmService.start();
      setIsRunning(true);
    }
    setLastCheck(new Date());
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Tự động xác nhận lịch hẹn
            </h3>
            <p className="text-xs text-gray-500">
              {isRunning ? 'Đang hoạt động' : 'Tạm dừng'} 
              {lastCheck && ` • Cập nhật lúc ${lastCheck.toLocaleTimeString('vi-VN')}`}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          className={`
            px-3 py-1 text-xs font-medium rounded-md transition-colors
            ${isRunning 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
            }
          `}
        >
          {isRunning ? (
            <>
              <FaBan className="mr-1" size={12} />
              Dừng
            </>
          ) : (
            <>
              <FaRocket className="mr-1" size={12} />
              Khởi động
            </>
          )}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FaClock className="mr-1" size={12} />
            <span>Kiểm tra mỗi 5 phút</span>
          </div>
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-1" size={12} />
            <span>Tự động xác nhận trước 30 phút</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoConfirmStatus;