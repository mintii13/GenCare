import React, { useState, useEffect } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import WeeklySlotPicker from './WeeklySlotPicker';
import { useAuth } from '../../contexts/AuthContext';

interface Consultant {
  _id: string;
  specialization: string;
  qualifications: string;
  user_id: {
    _id: string;
    full_name: string;
    email: string;
  };
}

interface SelectedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface GuestInfo {
  full_name: string;
  email: string;
  phone: string;
}

const BookAppointment: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // 1: Choose consultant, 2: Choose time, 3: Guest info (if not authenticated), 4: Confirm
  
  // Guest information state
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    full_name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    try {
      // TODO: Replace with actual API call to get consultants
      // For now using mock data
      const mockConsultants: Consultant[] = [
        {
          _id: '1',
          specialization: 'Sức khỏe sinh sản',
          qualifications: 'Bác sĩ đa khoa',
          user_id: {
            _id: 'u1',
            full_name: 'BS. Nguyễn Văn A',
            email: 'consultant1@example.com'
          }
        },
        {
          _id: '2',
          specialization: 'Dinh dưỡng',
          qualifications: 'Chuyên gia dinh dưỡng',
          user_id: {
            _id: 'u2',
            full_name: 'ThS. Trần Thị B',
            email: 'consultant2@example.com'
          }
        }
      ];
      setConsultants(mockConsultants);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const handleConsultantSelect = (consultantId: string) => {
    setSelectedConsultant(consultantId);
    setStep(2);
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    setSelectedSlot({ date, startTime, endTime });
    if (isAuthenticated) {
      setStep(4); // Skip guest info step for authenticated users
    } else {
      setStep(3); // Go to guest info step for non-authenticated users
    }
  };

  const handleGuestInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestInfo.full_name && guestInfo.email && guestInfo.phone) {
      setStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultant || !selectedSlot) return;

    setLoading(true);

    try {
      const appointmentData = {
        consultant_id: selectedConsultant,
        appointment_date: new Date(selectedSlot.date).toISOString(),
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        customer_notes: notes,
        // Include guest info if user is not authenticated
        ...(isAuthenticated ? {} : {
          guest_info: guestInfo
        })
      };

      let response;
      if (isAuthenticated) {
        // Authenticated user booking
        const token = localStorage.getItem('token');
        response = await fetch('/api/appointments/book', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appointmentData)
        });
      } else {
        // Guest booking
        response = await fetch('/api/appointments/book-guest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appointmentData)
        });
      }

      const data = await response.json();

      if (data.success) {
        alert('Đặt lịch hẹn thành công! Chúng tôi sẽ liên hệ với bạn để xác nhận thông tin.');
        // Reset form
        setSelectedConsultant('');
        setSelectedSlot(null);
        setNotes('');
        setGuestInfo({ full_name: '', email: '', phone: '' });
        setStep(1);
      } else {
        alert(data.message || 'Có lỗi xảy ra khi đặt lịch hẹn');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedConsultantInfo = () => {
    return consultants.find(c => c._id === selectedConsultant);
  };

  const getTotalSteps = () => {
    return isAuthenticated ? 3 : 4; // 3 steps for authenticated, 4 for guests
  };

  const getStepTitle = (stepNumber: number) => {
    if (isAuthenticated) {
      switch (stepNumber) {
        case 1: return 'Chọn chuyên gia';
        case 2: return 'Chọn thời gian';
        case 3: return 'Xác nhận';
        default: return '';
      }
    } else {
      switch (stepNumber) {
        case 1: return 'Chọn chuyên gia';
        case 2: return 'Chọn thời gian';
        case 3: return 'Thông tin liên hệ';
        case 4: return 'Xác nhận';
        default: return '';
      }
    }
  };

  const columns: TableColumn<Consultant>[] = [
    {
      name: 'Tên chuyên gia',
      selector: row => row.user_id.full_name,
      sortable: true,
    },
    {
      name: 'Chuyên khoa',
      selector: row => row.specialization,
      sortable: true,
    },
    {
      name: 'Trình độ',
      selector: row => row.qualifications,
      sortable: true,
    },
    {
      name: 'Hành động',
      cell: (row) => (
        <button
          onClick={() => handleConsultantSelect(row._id)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          Chọn
        </button>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt Lịch Tư Vấn</h1>
          <p className="text-gray-600">
            {isAuthenticated 
              ? 'Chọn chuyên gia và thời gian phù hợp cho buổi tư vấn' 
              : 'Đặt lịch tư vấn nhanh chóng - không cần đăng ký tài khoản'
            }
          </p>
          
          {/* Steps indicator */}
          <div className="flex items-center mt-4 overflow-x-auto">
            {Array.from({ length: getTotalSteps() }, (_, index) => {
              const stepNum = index + 1;
              const isActive = step >= stepNum;
              return (
                <React.Fragment key={stepNum}>
                  <div className={`flex items-center ${isActive ? 'text-blue-600' : 'text-gray-400'} flex-shrink-0`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      {stepNum}
                    </div>
                    <span className="ml-2 text-sm font-medium">{getStepTitle(stepNum)}</span>
                  </div>
                  {stepNum < getTotalSteps() && <div className="w-8 h-px bg-gray-300 mx-4 flex-shrink-0"></div>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step 1: Choose Consultant */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Bước 1: Chọn Chuyên Gia</h2>
            <DataTable
              columns={columns}
              data={consultants}
              pagination
              highlightOnHover
              striped
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
          </div>
        )}

        {/* Step 2: Choose Time */}
        {step === 2 && selectedConsultant && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Bước 2: Chọn Thời Gian</h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← Thay đổi chuyên gia
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Chuyên gia đã chọn:</strong> {getSelectedConsultantInfo()?.user_id.full_name} 
                  - {getSelectedConsultantInfo()?.specialization}
                </p>
              </div>
            </div>

            <WeeklySlotPicker
              consultantId={selectedConsultant}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
            />
          </div>
        )}

        {/* Step 3: Guest Information (only for non-authenticated users) */}
        {step === 3 && !isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Bước 3: Thông Tin Liên Hệ</h2>
              <button
                onClick={() => setStep(2)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Thay đổi thời gian
              </button>
            </div>

            <form onSubmit={handleGuestInfoSubmit} className="space-y-4">
              <div>
                <label htmlFor="guest_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="guest_name"
                  value={guestInfo.full_name}
                  onChange={(e) => setGuestInfo({ ...guestInfo, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ và tên của bạn"
                  required
                />
              </div>

              <div>
                <label htmlFor="guest_email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="guest_email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ email của bạn"
                  required
                />
              </div>

              <div>
                <label htmlFor="guest_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="guest_phone"
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số điện thoại của bạn"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tiếp tục
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Confirm and Submit (or Step 3 for authenticated users) */}
        {((step === 4 && !isAuthenticated) || (step === 3 && isAuthenticated)) && selectedSlot && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {isAuthenticated ? 'Bước 3: Xác Nhận Thông Tin' : 'Bước 4: Xác Nhận Thông Tin'}
              </h2>
              <button
                onClick={() => setStep(isAuthenticated ? 2 : 3)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                ← {isAuthenticated ? 'Thay đổi thời gian' : 'Thay đổi thông tin'}
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Booking Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Thông tin đặt lịch:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Chuyên gia:</span>
                    <p className="font-medium">{getSelectedConsultantInfo()?.user_id.full_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Chuyên khoa:</span>
                    <p className="font-medium">{getSelectedConsultantInfo()?.specialization}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngày hẹn:</span>
                    <p className="font-medium">{new Date(selectedSlot.date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Thời gian:</span>
                    <p className="font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                  </div>
                  {!isAuthenticated && (
                    <>
                      <div>
                        <span className="text-gray-600">Họ tên:</span>
                        <p className="font-medium">{guestInfo.full_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{guestInfo.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Điện thoại:</span>
                        <p className="font-medium">{guestInfo.phone}</p>
                      </div>
                    </>
                  )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả về vấn đề bạn muốn tư vấn, triệu chứng, hoặc thông tin khác..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConsultant('');
                    setSelectedSlot(null);
                    setNotes('');
                    setGuestInfo({ full_name: '', email: '', phone: '' });
                    setStep(1);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment; 