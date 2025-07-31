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
import BookingLayout from '../../components/layout/BookingLayout';

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
    toast(`${title}${message ? ': ' + message : ''}`, { 
      icon: '⚠️',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #f59e0b'
      }
    });
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
      }
      // Không redirect nếu không có consultantId (có thể đến từ STI assessment)

      const screeningNotes = localStorage.getItem('sti_screening_consultation_notes');
      if (screeningNotes) {
        setNotes(screeningNotes);
        toast.success('Đã tự động thêm kết quả sàng lọc STI vào ghi chú');
        localStorage.removeItem('sti_screening_consultation_notes');
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
        navigate('/my-appointments');
      } else {
        // Kiểm tra nếu có pending appointment
        if (response.errorType === 'PENDING_APPOINTMENT_EXISTS') {
          showWarning('Không thể đặt lịch', response.message || 'Bạn đã có lịch hẹn đang chờ xác nhận');
      } else {
        showError('Đặt lịch thất bại', response.message || 'Có lỗi xảy ra khi đặt lịch');
        }
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
    <BookingLayout
      title="Đặt Lịch Tư Vấn"
      subtitle="Chọn chuyên gia và thời gian phù hợp"
      currentStep={step}
      totalSteps={getTotalSteps()}
      stepTitles={['Chọn thời gian', 'Xác nhận']}
      onBackToAppointments={() => window.location.href = '/my-appointments'}
    >
      {/* Main Content Container - Gộp tất cả vào một khối */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Login Required */}
        {!isAuthenticated && (
          <div className="p-8 text-center border-b border-gray-100">
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

        {/* Step 1: Choose Consultant */}
        {step === 1 && !selectedConsultant && isAuthenticated && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Chọn Chuyên Gia</h2>
            </div>
            
            {consultantsLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner />
                <p className="text-sm text-gray-600 mt-2">Đang tải danh sách chuyên gia...</p>
              </div>
            ) : consultants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {consultants.map((consultant) => (
                  <div
                    key={consultant.consultant_id}
                    onClick={() => handleConsultantSelect(consultant.consultant_id)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {consultant.avatar ? (
                          <img src={consultant.avatar} alt={consultant.full_name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-blue-600 font-semibold text-lg">
                            {consultant.full_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm">{consultant.full_name}</h3>
                        <p className="text-xs text-blue-600 font-medium">{consultant.specialization}</p>
                        <p className="text-xs text-gray-600 mt-1">{consultant.qualifications}</p>
                        <p className="text-xs text-gray-500 mt-1">{consultant.experience_years} năm kinh nghiệm</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaExclamationTriangle className="mx-auto text-gray-400 text-2xl mb-2" />
                <p className="text-sm text-gray-600">Không có chuyên gia nào khả dụng</p>
                <button
                  onClick={handleRetryFetchConsultants}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Choose Time (when consultant pre-selected) */}
        {step === 1 && selectedConsultant && isAuthenticated && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Chọn Thời Gian</h2>
              <button
                onClick={() => setSelectedConsultant('')}
                className="text-blue-600 hover:text-blue-700 text-xs"
              >
                <FaArrowLeft className="inline mr-1" />
                Chọn chuyên gia khác
              </button>
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
            
            {/* WeeklySlotPicker */}
            <WeeklySlotPicker
              consultantId={selectedConsultant}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
            />
          </div>
        )}
      </div>

      {/* Step 2: Confirmation - Tách riêng vì là step khác */}
      {step === 2 && isAuthenticated && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
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
                  <span className="text-gray-600">Ngày:</span>
                  <p className="font-medium">
                    {selectedSlot && new Date(selectedSlot.date).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Giờ:</span>
                  <p className="font-medium">
                    {selectedSlot && `${selectedSlot.startTime} - ${selectedSlot.endTime}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú nếu cần..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Tiếp tục'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modals */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      <ConfirmationDialog />
    </BookingLayout>
  );
};

export default BookAppointment;