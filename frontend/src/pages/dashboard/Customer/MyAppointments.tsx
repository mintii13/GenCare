import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentService, Appointment, AppointmentResponse } from '../../../services/appointmentService';
import { consultantService } from '../../../services/consultantService';
import WeeklySlotPicker from '../../consultation/WeeklySlotPicker';
import Icon from '../../../components/icons/IconMapping';

// Remove duplicate interface since we're importing from service

const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    appointment_date: '',
    start_time: '',
    end_time: ''
  });
  const [selectedNewSlot, setSelectedNewSlot] = useState<{date: string, startTime: string, endTime: string} | null>(null);
  const [consultantDetails, setConsultantDetails] = useState<{[key: string]: any}>({});

  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang tư vấn',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  // Re-render khi consultant details được cập nhật
  useEffect(() => {
    if (Object.keys(consultantDetails).length > 0) {
      // Force re-render để cập nhật tên chuyên gia
      setAppointments(prev => [...prev]);
    }
  }, [consultantDetails]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await appointmentService.getMyAppointments(filter);
      
      if (data.success) {
        console.log('Appointments data:', data.data.appointments);
        // Debug first appointment
        if (data.data.appointments.length > 0) {
          console.log('First appointment consultant_id:', data.data.appointments[0].consultant_id);
        }
        setAppointments(data.data.appointments);
        
        // Fetch chi tiết chuyên gia cho tất cả appointments
        data.data.appointments.forEach((appointment: Appointment) => {
          const consultantId = appointment.consultant_id?._id;
          if (consultantId && !consultantDetails[consultantId]) {
            fetchConsultantDetails(consultantId);
          }
        });
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      console.log('Starting cancel appointment for ID:', appointmentId);
      const data = await appointmentService.cancelAppointment(appointmentId);
      
      console.log('Cancel appointment response:', data);
      
      if (data.success) {
        alert('Hủy lịch hẹn thành công');
        fetchAppointments();
      } else {
        console.error('Cancel failed with message:', data.message);
        alert(data.message);
      }
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      
      // Detailed error handling
      if (err.response?.status === 400) {
        const errorMsg = err.response?.data?.message || err.response?.data?.details || 'Yêu cầu không hợp lệ';
        alert(`Lỗi: ${errorMsg}`);
      } else if (err.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 403) {
        alert('Bạn không có quyền hủy lịch hẹn này.');
      } else if (err.response?.status === 404) {
        alert('Không tìm thấy lịch hẹn này.');
      } else {
        alert(err.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
      }
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditForm({
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time
    });
    setSelectedNewSlot(null);
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    setSelectedNewSlot({ date, startTime, endTime });
    setEditForm({
      appointment_date: date,
      start_time: startTime,
      end_time: endTime
    });
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !selectedNewSlot) return;

    console.log('=== DEBUG RESCHEDULE ===');
    console.log('editingAppointment._id:', editingAppointment._id);
    console.log('selectedNewSlot:', selectedNewSlot);
    console.log('localStorage token:', localStorage.getItem('gencare_auth_token'));
    
    try {
      const data = await appointmentService.rescheduleAppointment(
        editingAppointment._id,
        {
          appointment_date: selectedNewSlot.date,
          start_time: selectedNewSlot.startTime,
          end_time: selectedNewSlot.endTime
        }
      );
      
      if (data.success) {
        alert('Đổi lịch hẹn thành công! Chuyên gia sẽ xác nhận lại trong thời gian sớm nhất.');
        setEditingAppointment(null);
        setSelectedNewSlot(null);
        fetchAppointments();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      alert(err.message || 'Có lỗi xảy ra khi đổi lịch hẹn');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };



  const getConsultantSpecialization = (appointment: Appointment) => {
    const consultantId = appointment.consultant_id?._id;
    
    // Lấy từ cached data nếu có
    if (consultantId && consultantDetails[consultantId]) {
      return consultantDetails[consultantId].specialization || appointment.consultant_id?.specialization;
    }
    
    return appointment.consultant_id?.specialization || 'Không có thông tin';
  };

  const fetchConsultantDetails = async (consultantId: string) => {
    if (consultantDetails[consultantId]) {
      return consultantDetails[consultantId];
    }

    console.log('Fetching consultant details for ID:', consultantId);
    try {
      const response = await consultantService.getConsultantById(consultantId);
      console.log('Consultant API response:', response);
      
      if (response.success) {
        const consultantData = response.data;
        console.log('Consultant data:', consultantData);
        
        setConsultantDetails(prev => ({
          ...prev,
          [consultantId]: consultantData
        }));
        return consultantData;
      }
    } catch (error) {
      console.error('Error fetching consultant details:', error);
    }
    return null;
  };

  const getConsultantNameWithFetch = (appointment: Appointment) => {
    const consultantId = appointment.consultant_id?._id;
    
    // Kiểm tra nếu user_id là object có full_name
    if (typeof appointment.consultant_id?.user_id === 'object' && appointment.consultant_id.user_id?.full_name) {
      return appointment.consultant_id.user_id.full_name;
    }
    
    // Nếu có cached data từ API getConsultantById
    if (consultantId && consultantDetails[consultantId]) {
      const consultantData = consultantDetails[consultantId];
      return consultantData.full_name || consultantData.user_id?.full_name || 'Chuyên gia';
    }
    
    // Fetch thông tin chuyên gia nếu chưa có
    if (consultantId && !consultantDetails[consultantId]) {
      fetchConsultantDetails(consultantId);
      return '⏳ Đang tải...'; // Hiển thị loading thay vì ID
    }
    
    // Fallback cuối cùng
    if (consultantId) {
      return `Chuyên gia (${consultantId.slice(-6)})`;
    }
    
    return 'Không có thông tin';
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
              <div className="text-gray-400 text-6xl mb-4">
                <Icon name="📅" size={64} className="mx-auto" />
              </div>
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
                        {getConsultantNameWithFetch(appointment)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                        {statusLabels[appointment.status]}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Chuyên khoa:</span>
                                                  <p>{getConsultantSpecialization(appointment)}</p>
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
                    
                    {appointment.status === 'pending' && (
                      <button
                        onClick={() => handleEditAppointment(appointment)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Icon name="📅" className="mr-2" /> Đổi lịch
                      </button>
                    )}
                    
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

        {/* Enhanced Reschedule Modal */}
        {editingAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Đổi Lịch Hẹn</h2>
                    <p className="text-gray-600 mt-1">Chọn thời gian mới phù hợp với bạn</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAppointment(null);
                      setSelectedNewSlot(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <Icon name="✕" />
                  </button>
                </div>

                {/* Current appointment info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">
                    <Icon name="📅" className="mr-2" />
                    Lịch hẹn hiện tại
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Chuyên gia:</span>
                      <p className="text-blue-700">{getConsultantNameWithFetch(editingAppointment)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Ngày:</span>
                      <p className="text-blue-700">{formatDate(editingAppointment.appointment_date)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Giờ:</span>
                      <p className="text-blue-700">{formatTime(editingAppointment.start_time)} - {formatTime(editingAppointment.end_time)}</p>
                    </div>
                  </div>
                </div>

                {/* New slot selection */}
                {selectedNewSlot && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-green-900 mb-2">
                      <Icon name="✅" className="mr-2" />
                      Lịch hẹn mới
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-green-800">Chuyên gia:</span>
                        <p className="text-green-700">{getConsultantNameWithFetch(editingAppointment)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Ngày:</span>
                        <p className="text-green-700">{formatDate(selectedNewSlot.date)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Giờ:</span>
                        <p className="text-green-700">{formatTime(selectedNewSlot.startTime)} - {formatTime(selectedNewSlot.endTime)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">Hướng dẫn</h3>
                      <div className="mt-1 text-sm text-amber-700">
                        <p>• Chọn một khung giờ có sẵn (màu xanh) từ lịch bên dưới</p>
                        <p>• Lịch hẹn phải được đặt tối thiểu là ngày mai</p>
                        <p>• Thay đổi lịch có thể cần chuyên gia xác nhận lại</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly slot picker */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Chọn thời gian mới</h3>
                  <WeeklySlotPicker 
                    consultantId={editingAppointment.consultant_id._id}
                    onSlotSelect={handleSlotSelect}
                    selectedSlot={selectedNewSlot}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setEditingAppointment(null);
                      setSelectedNewSlot(null);
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleUpdateAppointment}
                    disabled={!selectedNewSlot}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      selectedNewSlot 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedNewSlot ? (
                      <>
                        <Icon name="✅" className="mr-2" />
                        Xác nhận đổi lịch
                      </>
                    ) : (
                      'Vui lòng chọn thời gian mới'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <Icon name="✕" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="font-medium">Chuyên gia:</span>
                    <p>{getConsultantNameWithFetch(selectedAppointment)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Chuyên khoa:</span>
                    <p>{getConsultantSpecialization(selectedAppointment)}</p>
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
                  {selectedAppointment.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleEditAppointment(selectedAppointment);
                        setSelectedAppointment(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                  )}
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