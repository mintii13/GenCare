import React, { useState, useEffect } from 'react';
import { FaLink, FaClock, FaCheckCircle, FaPlay, FaTrophy, FaTimes, FaHistory } from 'react-icons/fa';
import appointmentHistoryService, { IAppointmentHistory } from '../../services/appointmentHistoryService';
import { Loading } from '../ui';
import STIHistorySection from './STIHistorySection';
import { Tabs } from 'antd';

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

const AppointmentHistoryTimeline: React.FC<{ history: IAppointmentHistory[] }> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <FaHistory className="mx-auto text-3xl mb-2" />
        <p>Không có lịch sử cho lịch hẹn này.</p>
      </div>
    );
  }

  const formatHistoryTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Thời gian không hợp lệ';
    }
  };

  const getActionText = (action: string) => {
    const actions: { [key: string]: string } = {
      created: 'đã tạo lịch hẹn',
      confirmed: 'đã xác nhận lịch hẹn',
      cancelled: 'đã hủy lịch hẹn',
      completed: 'đã hoàn thành buổi tư vấn',
      in_progress: 'đã bắt đầu buổi tư vấn',
      rescheduled: 'đã đổi lịch hẹn',
      updated: 'đã cập nhật thông tin',
      started: 'đã bắt đầu buổi tư vấn'
    };
    return actions[action] || `đã thực hiện hành động: ${action}`;
  };

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={index} className="flex items-start">
          <div className="flex-shrink-0">
            <div className="bg-gray-200 rounded-full h-8 w-8 flex items-center justify-center">
              <FaHistory className="text-gray-600" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm">
              <span className="font-semibold">{item.performed_by_user_id?.full_name || 'Hệ thống'}</span>
              <span className="text-gray-600"> ({item.performed_by_role}) </span>
              {getActionText(item.action)}
            </p>
            <p className="text-xs text-gray-500">{formatHistoryTimestamp(item.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
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
  const [history, setHistory] = useState<IAppointmentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!appointment) return;
      try {
        setHistoryLoading(true);
        const response = await appointmentHistoryService.getHistoryForAppointment(appointment._id);
        if (response.success && response.data) {
          setHistory(response.data.history);
        }
      } catch (error) {
        console.error("Failed to fetch appointment history:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [appointment]);

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

          <Tabs defaultActiveKey="1" className="mb-6">
            <Tabs.TabPane tab="Đồng ý/Từ chối & Ghi chú" key="1">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center mb-4">
                  <FaLink className="text-green-600 mr-2" />
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
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Ghi chú từ Khách hàng</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-700">{appointment.customer_notes}</p>
                  </div>
                </div>
              )}

              {/* Consultant Notes */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Ghi chú của Chuyên gia</h3>
                <textarea
                  value={consultantNotes}
                  onChange={(e) => setConsultantNotes(e.target.value)}
                  placeholder="Nhập ghi chú về buổi tư vấn, kết quả, khuyến nghị..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  maxLength={2000}
                  disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                />
                <p className="text-sm text-gray-500 mt-1">{consultantNotes.length}/2000 ký tự</p>
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
                    {actionLoading === appointment._id ? 'Đang xử lý...' : (<><FaCheckCircle className="inline mr-2" />Xác nhận</>)}
                  </button>
                )}
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => onStart(appointment._id)}
                    disabled={actionLoading === appointment._id}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === appointment._id ? 'Đang xử lý...' : (<><FaPlay className="inline mr-2" />Bắt đầu tư vấn</>)}
                  </button>
                )}
                {appointment.status === 'in_progress' && (
                  <button
                    onClick={onComplete}
                    disabled={actionLoading === appointment._id || !canCompleteAppointment(appointment)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${canCompleteAppointment(appointment) ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    title={canCompleteAppointment(appointment) ? 'Hoàn thành buổi tư vấn' : getCompletionBlockedReason(appointment)}
                  >
                    {actionLoading === appointment._id ? 'Đang xử lý...' : (<><FaTrophy className="inline mr-2" />Hoàn thành</>)}
                  </button>
                )}
                {canTransitionTo(appointment.status, 'cancelled', 'consultant') && (
                  <button
                    onClick={() => onCancel(appointment._id)}
                    disabled={actionLoading === appointment._id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    title="Chuyên gia chỉ có thể hủy lịch hẹn ở trạng thái 'Chờ xác nhận'"
                  >
                    {actionLoading === appointment._id ? 'Đang xử lý...' : (<><FaTimes className="inline mr-2" />Hủy</>)}
                  </button>
                )}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Ghi chú xét nghiệm" key="2">
              {/* Parse and show STI screening info if available in customer_notes */}
              {appointment.customer_notes && appointment.customer_notes.includes('Kết quả sàng lọc STI') ? (
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Thông tin xét nghiệm STI từ khách hàng</h3>
                  {appointment.customer_notes.split('\n').map((line, idx) => {
                    // Hiển thị dạng bảng nếu là chi tiết câu trả lời
                    if (line.startsWith('- ')) {
                      const [field, ...rest] = line.replace('- ', '').split(':');
                      return (
                        <div key={idx} className="flex border-b py-1 text-sm">
                          <div className="w-1/3 font-medium text-gray-700">{field.trim()}</div>
                          <div className="flex-1 text-gray-800">{rest.join(':').trim()}</div>
                        </div>
                      );
                    }
                    if (line.startsWith('Chi tiết câu trả lời:')) {
                      return <div key={idx} className="font-semibold text-blue-600 mt-2">{line}</div>;
                    }
                    return <div key={idx} className="text-gray-700" style={{whiteSpace:'pre-line'}}>{line}</div>;
                  })}
                </div>
              ) : (
                <div className="text-gray-500 italic">Không có thông tin xét nghiệm STI trong ghi chú khách hàng.</div>
              )}
            </Tabs.TabPane>
          </Tabs>

          {/* Appointment History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Lịch sử Lịch hẹn</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {historyLoading ? (
                <Loading />
              ) : (
                <AppointmentHistoryTimeline history={history} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;