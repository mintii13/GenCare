import React, { useState, useEffect } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import WeeklySlotPicker from './WeeklySlotPicker';

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

const BookAppointment: React.FC = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // 1: Choose consultant, 2: Choose time, 3: Confirm

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
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultant || !selectedSlot) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const appointmentData = {
        consultant_id: selectedConsultant,
        appointment_date: new Date(selectedSlot.date).toISOString(),
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        customer_notes: notes
      };

      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Đặt lịch hẹn thành công!');
        // Reset form
        setSelectedConsultant('');
        setSelectedSlot(null);
        setNotes('');
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
          <p className="text-gray-600">Chọn chuyên gia và thời gian phù hợp cho buổi tư vấn</p>
          
          {/* Steps indicator */}
          <div className="flex items-center mt-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2">Chọn chuyên gia</span>
            </div>
            <div className="w-12 h-px bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2">Chọn thời gian</span>
            </div>
            <div className="w-12 h-px bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2">Xác nhận</span>
            </div>
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
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                  },
                },
                headRow: {
                  style: {
                    backgroundColor: '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0',
                  },
                },
              }}
            />
          </div>
        )}

        {/* Step 2: Choose Time Slot */}
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

        {/* Step 3: Confirm and Submit */}
        {step === 3 && selectedConsultant && selectedSlot && (
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