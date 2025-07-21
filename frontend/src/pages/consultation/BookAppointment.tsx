import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';
import WeeklySlotPicker from './WeeklySlotPicker';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { consultantService } from '../../services/consultantService';
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
  
  const fetchConsultants = async () => {
    try {
      setConsultantsLoading(true);
      setErrors({});
      
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
      
      const consultantId = searchParams.get('consultant');
      if (consultantId) {
        setSelectedConsultant(consultantId);
        setStep(1);
        log.component('BookAppointment', 'Pre-selected consultant from URL', { consultantId });
      } else {
        window.location.replace('/consultants');
      }

      const screeningResults = localStorage.getItem('sti_screening_results');
      if (screeningResults) {
        try {
          const data = JSON.parse(screeningResults);
          let answersText = '';
          if (data.answers && typeof data.answers === 'object') {
            answersText = Object.entries(data.answers)
              .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
          }
          const screeningNote = `Kết quả sàng lọc STI:\n- Mức độ nguy cơ: ${data.result?.risk_level}\n- Gói đề xuất: ${data.result?.recommended_package}\n- Lý do: ${(data.result?.reasoning || []).join(', ')}\n- Thời gian sàng lọc: ${data.timestamp ? new Date(data.timestamp).toLocaleString('vi-VN') : ''}\n${answersText ? '\nChi tiết câu trả lời:\n' + answersText : ''}`;
          setNotes(screeningNote);
          toast.success('Đã tự động thêm kết quả sàng lọc STI vào ghi chú');
          localStorage.removeItem('sti_screening_results');
        } catch (error) {
          console.error('Error parsing STI screening results:', error);
          localStorage.removeItem('sti_screening_results');
        }
      }
    } else {
      setShowLoginModal(true);
    }
  }, [isAuthenticated, searchParams]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: ValidationErrors = {};
    const consultantId = searchParams.get('consultant');

    if (consultantId) {
      switch (stepNumber) {
        case 1:
          if (!selectedSlot) {
            newErrors.slot = 'Vui lòng chọn thời gian hẹn';
          }
          break;
        case 2:
          if (notes.length > 2000) {
            newErrors.notes = 'Ghi chú không được vượt quá 2000 ký tự';
          }
          break;
      }
    } else {
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
          if (notes.length > 2000) {
            newErrors.notes = 'Ghi chú không được vượt quá 2000 ký tự';
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

      const response = await appointmentService.bookAppointment(appointmentData) as AppointmentResponse;

      if (response.success) {
        showSuccess('Đặt lịch thành công', 'Chuyên gia sẽ xác nhận lịch hẹn trong vòng 24 giờ');
        navigate('/dashboard/customer/appointments');
      } else {
        showError('Đặt lịch thất bại', response.message || 'Có lỗi xảy ra khi đặt lịch');
      }
    } catch (error) {
      log.error('BookAppointment', 'Error booking appointment', error);
      showError('Đặt lịch thất bại', 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedConsultantInfo = () => {
    return consultants.find(c => c.consultant_id === selectedConsultant);
  };

  const getTotalSteps = () => {
    return searchParams.get('consultant') ? 2 : 3;
  };

  const getStepTitle = (stepNumber: number) => {
    const consultantId = searchParams.get('consultant');
    if (consultantId) {
      return stepNumber === 1 ? 'Chọn thời gian' : 'Xác nhận';
    } else {
      switch (stepNumber) {
        case 1: return 'Chọn chuyên gia';
        case 2: return 'Chọn thời gian';
        case 3: return 'Xác nhận';
        default: return '';
      }
    }
  };

  const handleRetryFetchConsultants = () => {
    fetchConsultants();
  };

  const consultantColumns: TableColumn<Consultant>[] = [
    {
      name: 'Chuyên gia',
      selector: (row) => row.full_name,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center space-x-3 py-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {row.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.full_name}</p>
            <p className="text-sm text-gray-600">{row.specialization}</p>
          </div>
        </div>
      ),
    },
    {
      name: 'Chuyên khoa',
      selector: (row) => row.specialization,
      sortable: true,
      cell: (row) => (
        <div className="py-2">
          <p className="font-medium text-gray-900">{row.specialization}</p>
          <p className="text-sm text-gray-600">{row.qualifications}</p>
        </div>
      ),
    },
    {
      name: 'Kinh nghiệm',
      selector: (row) => row.experience_years,
      sortable: true,
      cell: (row) => (
        <div className="py-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {row.experience_years} năm
          </span>
        </div>
      ),
    },
    {
      name: 'Thao tác',
      cell: (row) => (
        <button
          onClick={() => handleConsultantSelect(row.consultant_id)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          disabled={consultantsLoading}
        >
          Chọn
        </button>
      ),
      ignoreRowClick: true,
      width: '100px',
    },
  ];

  const ConfirmationDialog = () => {
    if (!showConfirmDialog) return null;

    const consultantInfo = getSelectedConsultantInfo();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <FaCalendarAlt className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Xác nhận đặt lịch</h3>
                <p className="text-blue-100 text-xs">Kiểm tra thông tin trước khi xác nhận</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                <p className="text-xs text-blue-600 font-medium">Chuyên gia</p>
                <p className="font-semibold text-gray-800 text-sm">{consultantInfo?.full_name}</p>
                <p className="text-xs text-gray-600">{consultantInfo?.specialization}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                <p className="text-xs text-green-600 font-medium">Thời gian</p>
                <p className="font-semibold text-gray-800 text-sm">
                      {selectedSlot && new Date(selectedSlot.date).toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                <p className="text-xs text-gray-600">
                      {selectedSlot && `${selectedSlot.startTime} - ${selectedSlot.endTime}`}
                    </p>
              </div>

              {notes.trim() && (
                <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-500">
                  <p className="text-xs text-yellow-600 font-medium">Ghi chú</p>
                  <p className="text-xs text-gray-700 italic">&quot;{notes.trim().substring(0, 100)}...&quot;</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <FaCalendarAlt className="text-xs" />
                    <span>Xác nhận</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
        {/* Compact Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Đặt Lịch Tư Vấn</h1>
              <p className="text-sm text-gray-600">Chọn chuyên gia và thời gian phù hợp</p>
            </div>
            <a
              href="/dashboard/customer/appointments"
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              <FaCalendarAlt className="inline mr-1" />
              Lịch hẹn của tôi
            </a>
          </div>
          
          {/* Compact Steps */}
          <div className="flex items-center mt-3 overflow-x-auto">
            {Array.from({ length: getTotalSteps() }, (_, index) => {
              const stepNum = index + 1;
              const isActive = step >= stepNum;
              const isCompleted = step > stepNum;
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
                    <span className="ml-1 text-xs font-medium">{getStepTitle(stepNum)}</span>
                  </div>
                  {stepNum < getTotalSteps() && <div className="w-4 h-px bg-gray-300 mx-2 flex-shrink-0"></div>}
                </React.Fragment>
              );
            })}
          </div>

          {typeof errors.consultant === 'string' && errors.consultant.includes('tải') && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 flex-1">
                  <p className="text-red-700 text-xs font-medium">{errors.consultant}</p>
                  <button
                    onClick={handleRetryFetchConsultants}
                    className="mt-1 text-xs text-red-600 hover:text-red-700 underline"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Login Required */}
        {!isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
            <p className="text-sm text-gray-600 mb-4">Vui lòng đăng nhập để đặt lịch tư vấn</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* Step 1: Choose Time (when consultant pre-selected) */}
        {step === 1 && selectedConsultant && isAuthenticated && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Chọn Thời Gian</h2>
              </div>
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Chuyên gia:</strong> {getSelectedConsultantInfo()?.full_name} 
                  - {getSelectedConsultantInfo()?.specialization}
                </p>
              </div>
              {errors.slot && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-xs">{errors.slot}</p>
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

        {/* Step 2: Confirmation */}
        {step === 2 && isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Xác Nhận Thông Tin</h2>
              <button
                onClick={() => setStep(1)}
                className="text-blue-600 hover:text-blue-700 text-xs"
              >
                <FaArrowLeft className="inline mr-1" />
                Thay đổi thời gian
              </button>
            </div>
            <form onSubmit={handlePreSubmit}>
              {/* Compact Booking Summary */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2 text-sm">Thông tin đặt lịch:</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
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
              
              {/* Compact Notes */}
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Mô tả vấn đề muốn tư vấn..."
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-1">
                  <div>
                    {errors.notes && (
                      <p className="text-xs text-red-600">{errors.notes}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{notes.length}/2000</p>
                </div>
              </div>
              
              {/* Compact Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConsultant('');
                    setSelectedSlot(null);
                    setNotes('');
                    setErrors({});
                    window.location.replace('/consultants');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Bắt đầu lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  <span>{loading ? 'Đang đặt lịch...' : 'Đặt lịch'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <ConfirmationDialog />
        <ToastContainer />
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