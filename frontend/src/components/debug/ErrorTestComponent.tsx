import React from 'react';
import { apiClient } from '@/services/apiClient';
import { 
  showErrorToast, 
  showValidationErrorToast, 
  handleApiError, 
  handleFormError 
} from '@/utils/errorUtils';

const ErrorTestComponent: React.FC = () => {
  const testValidationError = async () => {
    try {

      await apiClient.post('/api/appointments/book', {
        consultant_id: 'invalid-id',
        appointment_date: 'invalid-date',
        start_time: '25:00', // Invalid time
        end_time: '24:00'    // Invalid time
      });
    } catch (error) {
      handleApiError(error, 'Test Validation Error');
    }
  };

  const testAuthError = async () => {
    try {
      // Gửi request không có token
      const originalToken = localStorage.getItem('gencare_auth_token');
      localStorage.removeItem('gencare_auth_token');
      
      await apiClient.get('/api/appointments/my-appointments');
      
      // Restore token
      if (originalToken) {
        localStorage.setItem('gencare_auth_token', originalToken);
      }
    } catch (error) {
      handleApiError(error, 'Test Auth Error');
    }
  };

  const testNotFoundError = async () => {
    try {
      await apiClient.get('/api/appointments/non-existent-id');
    } catch (error) {
      handleApiError(error, 'Test Not Found Error');
    }
  };

  const testServerError = async () => {
    try {
      // Simulate server error
      await apiClient.post('/api/test-server-error');
    } catch (error) {
      handleApiError(error, 'Test Server Error');
    }
  };

  const testCustomValidationErrors = () => {
    const errors = [
      'Email không hợp lệ',
      'Mật khẩu phải có ít nhất 6 ký tự',
      'Số điện thoại không đúng định dạng'
    ];
    
    showValidationErrorToast(errors, 'Lỗi validation tùy chỉnh');
  };

  const testFormError = () => {
    const mockError = {
      response: {
        data: {
          success: false,
          message: 'Dữ liệu không hợp lệ',
          type: 'VALIDATION_ERROR',
          details: 'Vui lòng kiểm tra lại thông tin',
          errors: [
            { field: 'email', message: 'Email không hợp lệ' },
            { field: 'password', message: 'Mật khẩu quá ngắn' }
          ]
        }
      }
    };
    
    handleFormError(mockError, 'email');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Test Error Handling System</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">API Errors</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testValidationError}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test Validation Error
            </button>
            
            <button
              onClick={testAuthError}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Test Auth Error
            </button>
            
            <button
              onClick={testNotFoundError}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Not Found Error
            </button>
            
            <button
              onClick={testServerError}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test Server Error
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Custom Errors</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testCustomValidationErrors}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Test Validation Toast
            </button>
            
            <button
              onClick={testFormError}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Form Error
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Hướng dẫn sử dụng</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Validation Error:</strong> Hiển thị lỗi validation chi tiết với danh sách lỗi</li>
          <li>• <strong>Auth Error:</strong> Hiển thị lỗi xác thực với hướng dẫn đăng nhập lại</li>
          <li>• <strong>Not Found Error:</strong> Hiển thị lỗi không tìm thấy tài nguyên</li>
          <li>• <strong>Server Error:</strong> Hiển thị lỗi server với thông báo thân thiện</li>
          <li>• <strong>Custom Errors:</strong> Test các utility function tùy chỉnh</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorTestComponent; 