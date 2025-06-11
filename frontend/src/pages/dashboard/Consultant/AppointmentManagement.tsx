import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import DataTable, { TableColumn } from 'react-data-table-component';

interface Appointment {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
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

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [consultantNotes, setConsultantNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string>(''); // Track which action is loading

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

      const response = await fetch(`/api/appointments/consultant-appointments?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setAppointments(data.data.appointments);
      } else {
        console.error('Error fetching appointments:', data.message);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      setActionLoading(appointmentId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Xác nhận lịch hẹn thành công');
        fetchAppointments();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi xác nhận lịch hẹn');
    } finally {
      setActionLoading('');
    }
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(selectedAppointment._id);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/appointments/${selectedAppointment._id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consultant_notes: consultantNotes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Hoàn thành buổi tư vấn thành công');
        setSelectedAppointment(null);
        setConsultantNotes('');
        fetchAppointments();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi hoàn thành buổi tư vấn');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      setActionLoading(appointmentId);
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
    } finally {
      setActionLoading('');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const columns: TableColumn<Appointment>[] = [
    {
      name: 'Khách hàng',
      selector: row => row.customer_id.full_name,
      sortable: true,
      minWidth: '150px',
    },
    {
      name: 'Ngày hẹn',
      selector: row => row.appointment_date,
      sortable: true,
      format: row => formatDate(row.appointment_date),
      minWidth: '100px',
    },
    {
      name: 'Thời gian',
      selector: row => row.start_time,
      format: row => `${row.start_time} - ${row.end_time}`,
      minWidth: '120px',
    },
    {
      name: 'Trạng thái',
      selector: row => row.status,
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status]}`}>
          {statusLabels[row.status]}
        </span>
      ),
      minWidth: '120px',
    },
    {
      name: 'Ngày đặt',
      selector: row => row.created_date,
      format: row => formatDateTime(row.created_date),
      minWidth: '140px',
    },
    {
      name: 'Hành động',
      cell: (row) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <button
              onClick={() => handleConfirmAppointment(row._id)}
              disabled={actionLoading === row._id}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading === row._id ? '...' : 'Xác nhận'}
            </button>
          )}
          {row.status === 'confirmed' && (
            <button
              onClick={() => {
                setSelectedAppointment(row);
                setConsultantNotes(row.consultant_notes || '');
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              Hoàn thành
            </button>
          )}
          {(row.status === 'pending' || row.status === 'confirmed') && (
            <button
              onClick={() => handleCancelAppointment(row._id)}
              disabled={actionLoading === row._id}
              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading === row._id ? '...' : 'Hủy'}
            </button>
          )}
          <button
            onClick={() => setSelectedAppointment(row)}
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
          >
            Chi tiết
          </button>
        </div>
      ),
      ignoreRowClick: true,
      minWidth: '200px',
    },
  ];

  const customStyles = {
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
    rows: {
      style: {
        fontSize: '14px',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản Lý Lịch Hẹn</h1>
          <p className="text-gray-600">Xem và quản lý các lịch hẹn từ khách hàng</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ xác nhận</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {appointments.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã xác nhận</p>
                <p className="text-2xl font-bold text-blue-600">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-blue-600 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-xl">🎉</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã hủy</p>
                <p className="text-2xl font-bold text-red-600">
                  {appointments.filter(a => a.status === 'cancelled').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <span className="text-red-600 text-xl">❌</span>
              </div>
            </div>
          </div>
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

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            title="Danh Sách Lịch Hẹn"
            columns={columns}
            data={appointments}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 30]}
            highlightOnHover
            striped
            customStyles={customStyles}
            progressPending={loading}
            progressComponent={
              <div className="p-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Đang tải...</span>
                </div>
              </div>
            }
            noDataComponent={
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch hẹn nào</h3>
                <p className="text-gray-600">Chưa có lịch hẹn nào phù hợp với bộ lọc hiện tại.</p>
              </div>
            }
          />
        </div>

        {/* Detail/Complete Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedAppointment.status === 'confirmed' ? 'Hoàn Thành Buổi Tư Vấn' : 'Chi Tiết Lịch Hẹn'}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedAppointment(null);
                      setConsultantNotes('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Khách hàng:</span>
                      <p>{selectedAppointment.customer_id.full_name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <p>{selectedAppointment.customer_id.email}</p>
                    </div>
                    <div>
                      <span className="font-medium">Ngày hẹn:</span>
                      <p>{formatDate(selectedAppointment.appointment_date)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Thời gian:</span>
                      <p>{selectedAppointment.start_time} - {selectedAppointment.end_time}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Trạng thái:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedAppointment.status]}`}>
                      {statusLabels[selectedAppointment.status]}
                    </span>
                  </div>

                  {selectedAppointment.customer_notes && (
                    <div>
                      <span className="font-medium">Ghi chú từ khách hàng:</span>
                      <p className="mt-1 p-3 bg-gray-50 rounded">{selectedAppointment.customer_notes}</p>
                    </div>
                  )}

                  {selectedAppointment.consultant_notes && (
                    <div>
                      <span className="font-medium">Ghi chú từ bạn:</span>
                      <p className="mt-1 p-3 bg-blue-50 rounded">{selectedAppointment.consultant_notes}</p>
                    </div>
                  )}
                </div>

                {selectedAppointment.status === 'confirmed' && (
                  <div className="mb-6">
                    <label className="block font-medium mb-2">
                      Ghi chú kết quả tư vấn: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={consultantNotes}
                      onChange={(e) => setConsultantNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập kết quả tư vấn, khuyến nghị, ghi chú cho khách hàng..."
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedAppointment(null);
                      setConsultantNotes('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {selectedAppointment.status === 'confirmed' ? 'Hủy' : 'Đóng'}
                  </button>
                  
                  {selectedAppointment.status === 'confirmed' && (
                    <button
                      onClick={handleCompleteAppointment}
                      disabled={!consultantNotes.trim() || actionLoading === selectedAppointment._id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === selectedAppointment._id ? 'Đang xử lý...' : 'Hoàn thành tư vấn'}
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

export default AppointmentManagement; 