import React from 'react';
import Icon from '../icons/IconMapping';

interface MeetingInfo {
  meet_url: string;
  meeting_id: string;
  meeting_password?: string;
}

interface Appointment {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  } | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress';
  customer_notes?: string;
  consultant_notes?: string;
  created_date: string;
  meeting_info?: MeetingInfo | null;
}

interface AppointmentDetailModalProps {
  appointment: Appointment;
  consultantNotes: string;
  setConsultantNotes: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  // Action handlers
  onConfirm: (id: string) => void;
  onStart: (id: string) => void;
  onComplete: () => void;
  onCancel: (id: string) => void;
  // Utils
  canCompleteAppointment: (appointment: Appointment) => boolean;
  canTransitionTo: (currentStatus: string, targetStatus: string, role?: string) => boolean;
  getCompletionBlockedReason: (appointment: Appointment) => string;
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
  actionLoading: string;
}

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang tư vấn',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  consultantNotes,
  setConsultantNotes,
  onClose,
  onConfirm,
  onStart,
  onComplete,
  onCancel,
  canCompleteAppointment,
  canTransitionTo,
  getCompletionBlockedReason,
  formatDate,
  formatDateTime,
  actionLoading
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Chi tiết Lịch hẹn</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin Khách hàng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Họ tên:</label>
                  <p className="font-medium">
                    {appointment.customer_id?.full_name || 'Không có thông tin'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email:</label>
                  <p className="font-medium">
                    {appointment.customer_id?.email || 'Không có email'}
                  </p>
                </div>
                {appointment.customer_id?.phone && (
                  <div>
                    <label className="text-sm text-gray-600">Điện thoại:</label>
                    <p className="font-medium">{appointment.customer_id.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin Lịch hẹn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Ngày hẹn:</label>
                  <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Thời gian:</label>
                  <p className="font-medium">
                    {appointment.start_time} - {appointment.end_time}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Trạng thái:</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[appointment.status]}`}
                  >
                    {statusLabels[appointment.status]}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Ngày tạo:</label>
                  <p className="font-medium">{formatDateTime(appointment.created_date)}</p>
                </div>
              </div>
            </div>

            {/* Google Meet Link - show only when in_progress */}
            {appointment.status === 'in_progress' && appointment.meeting_info?.meet_url && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <Icon name="🔗" className="text-green-600 mr-2" />
                <a
                  href={appointment.meeting_info.meet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Tham gia buổi tư vấn (Google Meet)
                </a>
              </div>
            )}

            {/* Customer Notes */}
            {appointment.customer_notes && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ghi chú từ Khách hàng</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-700">{appointment.customer_notes}</p>
                </div>
              </div>
            )}

            {/* Completion Status & Warning */}
            {appointment.status === 'in_progress' && !canCompleteAppointment(appointment) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Icon name="⏰" className="text-yellow-600 mr-2" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Chưa thể hoàn thành</h4>
                    <p className="text-sm text-yellow-700">
                      <strong>{getCompletionBlockedReason(appointment)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {appointment.status === 'in_progress' && canCompleteAppointment(appointment) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Icon name="✅" className="text-green-600 mr-2" />
                  <div>
                    <h4 className="font-semibold text-green-800">Sẵn sàng hoàn thành</h4>
                    <p className="text-sm text-green-700">Buổi tư vấn có thể được hoàn thành ngay bây giờ.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Consultant Notes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Ghi chú của Chuyên gia</h3>
              <textarea
                value={consultantNotes}
                onChange={(e) => setConsultantNotes(e.target.value)}
                placeholder="Nhập ghi chú về buổi tư vấn, kết quả, khuyến nghị..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
              />
              <p className="text-sm text-gray-500 mt-1">{consultantNotes.length}/500 ký tự</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>

              {appointment.status === 'pending' && (
                <button
                  onClick={() => onConfirm(appointment._id)}
                  disabled={actionLoading === appointment._id}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === appointment._id ? 'Đang xử lý...' : '✅ Xác nhận'}
                </button>
              )}

              {appointment.status === 'confirmed' && (
                <button
                  onClick={() => onStart(appointment._id)}
                  disabled={actionLoading === appointment._id}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === appointment._id ? 'Đang xử lý...' : '▶️ Bắt đầu tư vấn'}
                </button>
              )}

              {appointment.status === 'in_progress' && (
                <button
                  onClick={onComplete}
                  disabled={
                    actionLoading === appointment._id || !canCompleteAppointment(appointment)
                  }
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    canCompleteAppointment(appointment)
                      ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={
                    canCompleteAppointment(appointment)
                      ? 'Hoàn thành buổi tư vấn'
                      : getCompletionBlockedReason(appointment)
                  }
                >
                  {actionLoading === appointment._id ? 'Đang xử lý...' : '🎉 Hoàn thành'}
                </button>
              )}

              {canTransitionTo(appointment.status, 'cancelled', 'consultant') && (
                <button
                  onClick={() => onCancel(appointment._id)}
                  disabled={actionLoading === appointment._id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  title="Chuyên gia chỉ có thể hủy lịch hẹn ở trạng thái 'Chờ xác nhận'"
                >
                  {actionLoading === appointment._id ? 'Đang xử lý...' : '❌ Hủy'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal; 