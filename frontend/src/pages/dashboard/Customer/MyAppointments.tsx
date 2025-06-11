import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Appointment {
  _id: string;
  consultant_id: {
    _id: string;
    specialization: string;
    user_id: {
      full_name: string;
    };
  };
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customer_notes?: string;
  consultant_notes?: string;
  created_date: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    appointments: Appointment[];
    total: number;
  };
}

const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      if (filter !== 'all') {
        queryParams.append('status', filter);
      }

      const response = await fetch(`/api/appointments/my-appointments?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setAppointments(data.data.appointments);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Hủy lịch hẹn thành công');
        fetchAppointments();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi hủy lịch hẹn');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lịch Hẹn Của Tôi</h1>
          <p className="text-gray-600">Quản lý và theo dõi các lịch hẹn tư vấn</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chờ xác nhận
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã xác nhận
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã hoàn thành
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch hẹn nào</h3>
              <p className="text-gray-600">Bạn chưa có lịch hẹn nào. Hãy đặt lịch tư vấn mới!</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {appointment.consultant_id.user_id.full_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                        {statusLabels[appointment.status]}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Chuyên khoa:</span>
                        <p>{appointment.consultant_id.specialization}</p>
                      </div>
                      <div>
                        <span className="font-medium">Ngày hẹn:</span>
                        <p>{formatDate(appointment.appointment_date)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Thời gian:</span>
                        <p>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p>
                      </div>
                    </div>

                    {appointment.customer_notes && (
                      <div className="mt-3">
                        <span className="font-medium text-sm text-gray-600">Ghi chú của bạn:</span>
                        <p className="text-sm text-gray-700 mt-1">{appointment.customer_notes}</p>
                      </div>
                    )}

                    {appointment.consultant_notes && (
                      <div className="mt-3">
                        <span className="font-medium text-sm text-gray-600">Ghi chú từ chuyên gia:</span>
                        <p className="text-sm text-gray-700 mt-1">{appointment.consultant_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setSelectedAppointment(appointment)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Chi tiết
                    </button>
                    
                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelAppointment(appointment._id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Hủy lịch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Chi Tiết Lịch Hẹn</h2>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="font-medium">Chuyên gia:</span>
                    <p>{selectedAppointment.consultant_id.user_id.full_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Chuyên khoa:</span>
                    <p>{selectedAppointment.consultant_id.specialization}</p>
                  </div>
                  <div>
                    <span className="font-medium">Ngày hẹn:</span>
                    <p>{formatDate(selectedAppointment.appointment_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Thời gian:</span>
                    <p>{formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Trạng thái:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedAppointment.status]}`}>
                      {statusLabels[selectedAppointment.status]}
                    </span>
                  </div>
                  {selectedAppointment.customer_notes && (
                    <div>
                      <span className="font-medium">Ghi chú của bạn:</span>
                      <p className="mt-1">{selectedAppointment.customer_notes}</p>
                    </div>
                  )}
                  {selectedAppointment.consultant_notes && (
                    <div>
                      <span className="font-medium">Ghi chú từ chuyên gia:</span>
                      <p className="mt-1">{selectedAppointment.consultant_notes}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Ngày đặt:</span>
                    <p>{formatDate(selectedAppointment.created_date)}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Đóng
                  </button>
                  {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                    <button
                      onClick={() => {
                        handleCancelAppointment(selectedAppointment._id);
                        setSelectedAppointment(null);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Hủy lịch hẹn
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments; 