import React, { useState, useEffect } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import WeeklySlotPicker from './WeeklySlotPicker';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { consultantService } from '../../services/consultantService';
// import { useToast } from '../../components/ui/Toast';
import { AppointmentValidation, formatValidationErrors } from '../../utils/appointmentValidation';
import toast from 'react-hot-toast';
import LoginModal from '../../components/auth/LoginModal';
import { log } from '../../utils/logger';
import { CardSkeleton, LoadingSpinner } from '../../components/common/LoadingSkeleton';

interface Consultant {
  consultant_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar?: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
}

interface SelectedSlot {
  date: string;
  startTime: string;
  endTime: string;
}



interface ValidationErrors {
  consultant?: string;
  slot?: string;
  notes?: string;
}

const BookAppointment: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  // Notification methods using toast
  const showSuccess = (title: string, message?: string) => {
    toast.success(`${title}${message ? ': ' + message : ''}`);
  };
  const showError = (title: string, message?: string) => {
    toast.error(`${title}${message ? ': ' + message : ''}`);
  };
  const showWarning = (title: string, message?: string) => {
    toast.error(`${title}${message ? ': ' + message : ''}`);
  };
  const ToastContainer = () => null;
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [consultantsLoading, setConsultantsLoading] = useState<boolean>(true);
  const [step, setStep] = useState<number>(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(!isAuthenticated);
  
  // Define fetchConsultants before useEffect
  const fetchConsultants = async () => {
    try {
      setConsultantsLoading(true);
      setErrors({}); // Clear previous errors
      
      log.api('GET', '/consultants/public', { page: 1, limit: 10 });
      const response = await consultantService.getAllConsultants();
      log.apiResponse('GET', '/consultants/public', 200, response);
      
      if (response.success && response.data) {
        log.component('BookAppointment', 'Consultants loaded successfully', { count: response.data.consultants?.length });
        setConsultants(response.data.consultants || []);
      } else {
        log.error('BookAppointment', 'Failed to fetch consultants', response.message);
        setErrors({ consultant: 'Không thể tải danh sách chuyên gia. Vui lòng thử lại.' });
      }
    } catch (error) {
      log.error('BookAppointment', 'Error fetching consultants', error);
      setErrors({ consultant: 'Có lỗi xảy ra khi tải danh sách chuyên gia.' });
    } finally {
      setConsultantsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConsultants();
      setShowLoginModal(false);
    } else {
      setShowLoginModal(true);
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // fetchConsultants will be called automatically via useEffect when isAuthenticated changes
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (stepNumber) {
      case 1:
        if (!selectedConsultant) {
          newErrors.consultant = 'Vui lòng chọn một chuyên gia';
        }
        break;
      
      case 2:
        if (!selectedSlot) {
          newErrors.slot = 'Vui lòng chọn thời gian hẹn';
        }
        break;
      
      case 3:
        // Validation for confirmation step
        if (notes.length > 500) {
          newErrors.notes = 'Ghi chú không được vượt quá 500 ký tự';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConsultantSelect = (consultantId: string) => {
    log.userAction('Select consultant', { consultantId });
    setSelectedConsultant(consultantId);
    setErrors({});
    if (validateStep(1)) {
      setStep(2);
    }
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    log.userAction('Select time slot', { date, startTime, endTime });
    
    // Validate lead time (2 hours)
    const appointmentDateTime = new Date(`${date} ${startTime}`);
    const now = new Date();
    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 2) {
      log.warn('BookAppointment', 'Lead time validation failed', { diffHours });
      setErrors({ slot: 'Lịch hẹn phải được đặt trước ít nhất 2 giờ' });
      return;
    }

    setSelectedSlot({ date, startTime, endTime });
    setErrors({});
    setStep(3); // Go directly to confirmation step
  };



  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(3)) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!selectedConsultant || !selectedSlot) return;

    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const appointmentData = {
        consultant_id: selectedConsultant,
        appointment_date: selectedSlot.date,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        customer_notes: notes.trim() || undefined,
      };

      // User is guaranteed to be authenticated at this point
      const response = await appointmentService.bookAppointment(appointmentData);

      if (response.success) {
        // Success feedback
        showSuccess(
          'Đặt lịch thành công!',
          'Chúng tôi sẽ xác nhận thông tin và liên hệ với bạn sớm nhất có thể.'
        );
        
        // Reset form
        setSelectedConsultant('');
        setSelectedSlot(null);
        setNotes('');
        setErrors({});
        setStep(1);
      } else {
        showError('Không thể đặt lịch', response.message || 'Có lỗi xảy ra khi đặt lịch hẹn');
        setErrors({ consultant: response.message || 'Có lỗi xảy ra khi đặt lịch hẹn' });
      }
    } catch (error: any) {
      log.error('BookAppointment', 'Error booking appointment', error);
      
      // Handle specific error cases
      let errorTitle = 'Lỗi hệ thống';
      let errorMessage = 'Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại.';
      
      if (error.response?.status === 400) {
        const responseMessage = error.response?.data?.message || error.message;
        
        if (responseMessage.includes('pending appointment')) {
          errorTitle = 'Không thể đặt lịch';
          errorMessage = 'Bạn đã có lịch hẹn đang chờ xác nhận. Vui lòng chờ chuyên gia xác nhận hoặc hủy lịch hẹn hiện tại trước khi đặt lịch mới.';
        } else if (responseMessage.includes('already booked')) {
          errorTitle = 'Khung giờ đã được đặt';
          errorMessage = 'Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.';
        } else if (responseMessage.includes('invalid time')) {
          errorTitle = 'Thời gian không hợp lệ';
          errorMessage = 'Thời gian đã chọn không còn khả dụng. Vui lòng chọn thời gian khác.';
        } else {
          errorMessage = responseMessage;
        }
      } else if (error.response?.status === 401) {
        errorTitle = 'Phiên đăng nhập hết hạn';
        errorMessage = 'Vui lòng đăng nhập lại để tiếp tục đặt lịch.';
      } else if (error.response?.status === 403) {
        errorTitle = 'Không có quyền truy cập';
        errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
      } else if (error.response?.status >= 500) {
        errorTitle = 'Lỗi máy chủ';
        errorMessage = 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Use toast for better UX
      if (errorMessage.includes('chờ xác nhận')) {
        // Special toast for pending appointment error
        toast.custom(
          (t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {errorTitle}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {errorMessage}
                    </p>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          window.location.href = '/dashboard/customer/appointments';
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors duration-200"
                      >
                        📅 Xem lịch hẹn
                      </button>
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium py-2 px-3 rounded-md border border-gray-300 transition-colors duration-200"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ),
          {
            duration: 10000,
            position: 'top-center',
          }
        );
      } else if (errorMessage.includes('đăng nhập')) {
        toast.custom(
          (t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">Phiên đăng nhập hết hạn</p>
                    <p className="mt-1 text-sm text-gray-500">{errorMessage}</p>
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          window.location.reload();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors duration-200"
                      >
                        🔄 Tải lại trang
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ),
          {
            duration: 6000,
            position: 'top-center',
          }
        );
      } else if (errorMessage.includes('đã được đặt')) {
        toast.custom(
          (t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">Khung giờ đã được đặt</p>
                    <p className="mt-1 text-sm text-gray-500">{errorMessage}</p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ),
          {
            duration: 5000,
            position: 'top-center',
          }
        );
      } else {
        toast.custom(
          (t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{errorTitle}</p>
                    <p className="mt-1 text-sm text-gray-500">{errorMessage}</p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ),
          {
            duration: 5000,
            position: 'top-center',
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getSelectedConsultantInfo = () => {
    return consultants.find(c => c.consultant_id === selectedConsultant);
  };

  const getTotalSteps = () => {
    return 3; // Always 3 steps since user must be authenticated
  };

  const getStepTitle = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return 'Chọn chuyên gia';
      case 2: return 'Chọn thời gian';
      case 3: return 'Xác nhận';
      default: return '';
    }
  };

  const handleRetryFetchConsultants = () => {
    setErrors({});
    fetchConsultants();
  };

  const columns: TableColumn<Consultant>[] = [
    {
      name: 'Tên chuyên gia',
      selector: row => row.full_name,
      sortable: true,
      width: '250px',
    },
    {
      name: 'Chuyên khoa',
      selector: row => row.specialization,
      sortable: true,
      width: '200px',
    },
    {
      name: 'Trình độ',
      selector: row => row.qualifications,
      sortable: true,
      width: '200px',
    },
    {
      name: 'Hành động',
      cell: (row) => (
        <button
          onClick={() => handleConsultantSelect(row.consultant_id)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={consultantsLoading}
        >
          Chọn
        </button>
      ),
      ignoreRowClick: true,
      width: '100px',
    },
  ];

  // Confirmation Dialog Component
  const ConfirmationDialog = () => {
    if (!showConfirmDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Xác nhận đặt lịch</h3>
          
          <div className="space-y-3 mb-6">
            <div>
              <span className="text-gray-600">Chuyên gia:</span>
              <p className="font-medium">{getSelectedConsultantInfo()?.full_name}</p>
            </div>
            <div>
              <span className="text-gray-600">Thời gian:</span>
              <p className="font-medium">
                {selectedSlot && new Date(selectedSlot.date).toLocaleDateString('vi-VN')} 
                {selectedSlot && `, ${selectedSlot.startTime} - ${selectedSlot.endTime}`}
              </p>
            </div>

          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Debug info
  console.log('BookAppointment Debug:', {
    isAuthenticated,
    step,
    selectedConsultant,
    selectedSlot,
    consultants: consultants.length,
    consultantsLoading,
    errors
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt Lịch Tư Vấn</h1>
              <p className="text-gray-600">
                Chọn chuyên gia và thời gian phù hợp cho buổi tư vấn
              </p>
            </div>
            <a
              href="/dashboard/customer/appointments"
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              📅 Xem lịch hẹn của tôi
            </a>
          </div>
          
          {/* Steps indicator */}
          <div className="flex items-center mt-4 overflow-x-auto">
            {Array.from({ length: getTotalSteps() }, (_, index) => {
              const stepNum = index + 1;
              const isActive = step >= stepNum;
              const isCompleted = step > stepNum;
              return (
                <React.Fragment key={stepNum}>
                  <div className={`flex items-center ${
                    isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                  } flex-shrink-0`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-600 text-white' : 
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}>
                      {isCompleted ? '✓' : stepNum}
                    </div>
                    <span className="ml-2 text-sm font-medium">{getStepTitle(stepNum)}</span>
                  </div>
                  {stepNum < getTotalSteps() && <div className="w-8 h-px bg-gray-300 mx-4 flex-shrink-0"></div>}
                </React.Fragment>
              );
            })}
          </div>

          {/* Error Display for loading consultants only */}
          {errors.consultant && errors.consultant.includes('tải') && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-red-700 text-sm font-medium">{errors.consultant}</p>
                  <button
                    onClick={handleRetryFetchConsultants}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Login Required Message */}
        {!isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để có thể đặt lịch tư vấn với chuyên gia
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* Step 1: Choose Consultant */}
        {step === 1 && isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Bước 1: Chọn Chuyên Gia</h2>
            
            {consultantsLoading ? (
              <CardSkeleton count={3} />
            ) : consultants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Không có chuyên gia nào khả dụng</p>
                <button
                  onClick={handleRetryFetchConsultants}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tải lại
                </button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={consultants}
                pagination
                highlightOnHover
                striped
                noDataComponent={
                  <div className="text-center py-8">
                    <p className="text-gray-600">Không tìm thấy chuyên gia nào</p>
                  </div>
                }
                customStyles={{
                  header: {
                    style: {
                      fontSize: '16px',
                      fontWeight: 'bold',
                    },
                  },
                  headRow: {
                    style: {
                      backgroundColor: '#f8f9fa',
                    },
                  },
                }}
              />
            )}
          </div>
        )}

        {/* Step 2: Choose Time */}
        {step === 2 && selectedConsultant && isAuthenticated && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Bước 2: Chọn Thời Gian</h2>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedSlot(null);
                    setErrors({});
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← Thay đổi chuyên gia
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Chuyên gia đã chọn:</strong> {getSelectedConsultantInfo()?.full_name} 
                  - {getSelectedConsultantInfo()?.specialization}
                </p>
              </div>

              {errors.slot && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{errors.slot}</p>
                </div>
              )}
            </div>

            <WeeklySlotPicker
              consultantId={selectedConsultant}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
            />
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Bước 3: Xác Nhận Thông Tin</h2>
              <button
                onClick={() => setStep(2)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Thay đổi thời gian
              </button>
            </div>

            <form onSubmit={handlePreSubmit}>
              {/* Booking Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Thông tin đặt lịch:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Chuyên gia:</span>
                    <p className="font-medium">{getSelectedConsultantInfo()?.full_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Chuyên khoa:</span>
                    <p className="font-medium">{getSelectedConsultantInfo()?.specialization}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngày hẹn:</span>
                    <p className="font-medium">{selectedSlot && new Date(selectedSlot.date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Thời gian:</span>
                    <p className="font-medium">{selectedSlot && `${selectedSlot.startTime} - ${selectedSlot.endTime}`}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú cho chuyên gia (tùy chọn)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Mô tả về vấn đề bạn muốn tư vấn, triệu chứng, hoặc thông tin khác..."
                  maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <div>
                        {errors.notes && (
                          <p className="text-sm text-red-600">{errors.notes}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{notes.length}/500</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedConsultant('');
                        setSelectedSlot(null);
                        setNotes('');
                        setErrors({});
                        setStep(1);
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Bắt đầu lại
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading && <LoadingSpinner size="sm" />}
                      <span>{loading ? 'Đang đặt lịch...' : 'Đặt lịch'}</span>
                    </button>
                  </div>
                </form>
              </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog />

        {/* Toast Container */}
        <ToastContainer />

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </div>
    </div>
  );
};

export default BookAppointment; 