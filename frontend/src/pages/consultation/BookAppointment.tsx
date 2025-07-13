import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { FaCalendarAlt, FaSpinner, FaArrowLeft, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import { AppointmentResponse } from '../../types/appointment';

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
      
      if (response.data && response.data.consultants) {
        log.component('BookAppointment', 'Consultants loaded successfully', { count: response.data.consultants?.length });
        setConsultants(response.data.consultants as unknown as Consultant[]);  
      } else {
        log.error('BookAppointment', 'Failed to fetch consultants', 'No consultants data');
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
      
      // Check if consultant ID is provided in URL params
      const consultantId = searchParams.get('consultant');
      if (consultantId) {
        setSelectedConsultant(consultantId);
        setStep(1); // Start at step 1 (time selection for pre-selected consultant)
        log.component('BookAppointment', 'Pre-selected consultant from URL', { consultantId });
      } else {
        // Nếu không có consultant param, redirect sang /consultants
        window.location.replace('/consultants');
      }
    } else {
      setShowLoginModal(true);
    }
  }, [isAuthenticated, searchParams]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // fetchConsultants will be called automatically via useEffect when isAuthenticated changes
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: ValidationErrors = {};
    const consultantId = searchParams.get('consultant');

    if (consultantId) {
      // Pre-selected consultant flow: 1=Time, 2=Confirm
      switch (stepNumber) {
        case 1:
          if (!selectedSlot) {
            newErrors.slot = 'Vui lòng chọn thời gian hẹn';
          }
          break;
        case 2:
          // Validation for confirmation step
          if (notes.length > 500) {
            newErrors.notes = 'Ghi chú không được vượt quá 500 ký tự';
          }
          break;
      }
    } else {
      // Normal flow: 1=Consultant, 2=Time, 3=Confirm
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
    
    // If consultant is pre-selected, step 2 is confirmation. Otherwise step 3 is confirmation
    const consultantId = searchParams.get('consultant');
    setStep(consultantId ? 2 : 3);
  };



  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const consultantId = searchParams.get('consultant');
    const confirmationStep = consultantId ? 2 : 3;
    
    if (validateStep(confirmationStep)) {
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
      const response = await appointmentService.bookAppointment(appointmentData) as AppointmentResponse;

      if (response.success) {
        // Success feedback
        showSuccess(
          'Đặt lịch thành công!',
          'Chúng tôi sẽ xác nhận thông tin và liên hệ với bạn sớm nhất có thể. Đang chuyển đến trang lịch sử tư vấn...'
        );
        
        // Reset form
        setSelectedConsultant('');
        setSelectedSlot(null);
        setNotes('');
        setErrors({});
        setStep(1);
        
        // Chuyển đến trang lịch sử tư vấn sau 2 giây
        setTimeout(() => {
          navigate('/my-appointments');
        }, 2000);
      } else {
        // Kiểm tra nếu là lỗi pending appointment
        if (response.errorType === 'PENDING_APPOINTMENT_EXISTS') {
          // Hiển thị thông báo lỗi với thông tin chi tiết
          const existingAppointment = response.details?.existingAppointment;
          const detailMessage = existingAppointment 
            ? `Lịch hẹn đang chờ: ${existingAppointment.appointment_date} (${existingAppointment.time_slot})`
            : '';
          
          // Hiển thị toast error với action buttons
          toast.error(
            (t) => (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <FaExclamationTriangle className="text-red-500" />
                  <div className="font-medium">Không thể đặt lịch mới</div>
                </div>
                <div className="text-sm text-gray-600">{response.message}</div>
                {detailMessage && (
                  <div className="text-sm text-blue-600 font-medium">{detailMessage}</div>
                )}
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate('/my-appointments');
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <FaEye className="text-xs" />
                    <span>Xem lịch hẹn</span>
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ),
            { 
              duration: 10000,
              position: 'top-center',
              style: {
                minWidth: '400px',
                padding: '16px'
              }
            }
          );
          
          // Cũng set error để hiển thị trong form
          setErrors({ 
            consultant: 'Bạn đã có lịch hẹn đang chờ xác nhận. Vui lòng kiểm tra lịch hẹn của bạn.' 
          });
        } else {
          // Lỗi khác
          showError('Không thể đặt lịch', response.message || 'Có lỗi xảy ra khi đặt lịch hẹn');
          setErrors({ consultant: response.message || 'Có lỗi xảy ra khi đặt lịch hẹn' });
        }
      }
    } catch (error: any) {
      log.error('BookAppointment', 'Error booking appointment', error);
      
      // Sử dụng error utils để xử lý lỗi chi tiết
      const { handleApiError } = await import('@/utils/errorUtils');
      handleApiError(error, 'Đặt lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedConsultantInfo = () => {
    return consultants.find(c => c.consultant_id === selectedConsultant);
  };

  const getTotalSteps = () => {
    // If consultant is pre-selected from URL, we skip step 1
    const consultantId = searchParams.get('consultant');
    return consultantId ? 2 : 3;
  };

  const getStepTitle = (stepNumber: number) => {
    const consultantId = searchParams.get('consultant');
    
    if (consultantId) {
      // If consultant is pre-selected, steps are: 1=Time, 2=Confirm
      switch (stepNumber) {
        case 1: return 'Chọn thời gian';
        case 2: return 'Xác nhận';
        default: return '';
      }
    } else {
      // Normal flow: 1=Consultant, 2=Time, 3=Confirm
      switch (stepNumber) {
        case 1: return 'Chọn chuyên gia';
        case 2: return 'Chọn thời gian';
        case 3: return 'Xác nhận';
        default: return '';
      }
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
      name: 'Kinh nghiệm',
      selector: row => `${row.experience_years} năm`,
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

    const consultantInfo = getSelectedConsultantInfo();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-0 transform animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <FaCalendarAlt className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Xác nhận đặt lịch tư vấn</h3>
                <p className="text-blue-100 text-sm">Vui lòng kiểm tra thông tin trước khi xác nhận</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4 mb-6">
              {/* Consultant Info */}
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-600 font-medium">Chuyên gia tư vấn</p>
                    <p className="font-semibold text-gray-800">{consultantInfo?.full_name}</p>
                    <p className="text-sm text-gray-600">{consultantInfo?.specialization}</p>
                    {consultantInfo?.experience_years && (
                      <p className="text-xs text-gray-500 mt-1">
                        Kinh nghiệm: {consultantInfo.experience_years} năm
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Date & Time Info */}
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-green-600 font-medium">Thời gian hẹn</p>
                    <p className="font-semibold text-gray-800">
                      {selectedSlot && new Date(selectedSlot.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedSlot && `${selectedSlot.startTime} - ${selectedSlot.endTime}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {notes.trim() && (
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-100 rounded-full p-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-600 font-medium">Ghi chú của bạn</p>
                      <p className="text-sm text-gray-700 mt-1 italic">"{notes.trim()}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Important Notice */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Lưu ý quan trọng:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Chuyên gia sẽ xác nhận lịch hẹn trong vòng 24 giờ</li>
                      <li>• Bạn có thể hủy lịch trước 2 giờ mà không mất phí</li>
                      <li>• Vui lòng chuẩn bị sẵn các câu hỏi muốn tư vấn</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                disabled={loading}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <FaCalendarAlt className="text-sm" />
                    <span>Xác nhận đặt lịch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Debug info


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
              <FaCalendarAlt className="inline mr-2" />
            Xem lịch hẹn của tôi
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

        {/* Step 2: Choose Time OR Step 1 if consultant pre-selected */}
        {step === 1 && selectedConsultant && isAuthenticated && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Chọn Thời Gian</h2>
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

        {/* Step 3: Confirmation OR Step 2 if consultant pre-selected */}
        {step === 2 && isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Xác Nhận Thông Tin</h2>
              <button
                onClick={() => setStep(1)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                <FaArrowLeft className="inline mr-2" />
                Thay đổi thời gian
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
                    window.location.replace('/consultants');
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