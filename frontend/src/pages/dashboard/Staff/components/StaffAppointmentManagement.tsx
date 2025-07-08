import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../../../contexts/AuthContext';
import { appointmentService } from '../../../../services/appointmentService';
import appointmentHistoryService from '../../../../services/appointmentHistoryService';
import { consultantService } from '../../../../services/consultantService';
import toast from 'react-hot-toast';
import { FaEye, FaCheck, FaTimes, FaEdit, FaBell, FaCheckCircle } from 'react-icons/fa';
import { Appointment } from '../../../../types/appointment';
import ResourceList from '../../../../components/common/ResourceList';
import usePaginatedResource from '../../../../hooks/usePaginatedResource';
import { Select, Col, Button, DatePicker, Modal, Tag, Space, Popconfirm, Tooltip } from 'antd';

const { Option } = Select;

interface Consultant {
  _id: string;
  user_id: {
    _id: string;
    full_name: string;
  };
  specialization: string;
}

// Enhanced status colors with more appealing design
const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    'pending': 'orange',
    'confirmed': 'blue', 
    'in_progress': 'cyan',
    'completed': 'green',
    'cancelled': 'red'
  };
  return colors[status] || 'default';
};

const getStatusLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'in_progress': 'Đang diễn ra', 
    'completed': 'Đã hoàn thành',
    'cancelled': 'Đã hủy'
  };
  return labels[status] || status;
};

const StaffAppointmentManagement: React.FC = () => {
  const { user } = useAuth();
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState<string>('');
  const [consultants, setConsultants] = useState<Consultant[]>([]);

  const {
    data,
    loading,
    pagination,
    filters,
    searchTerm,
    setSearchTerm,
    handlePageChange,
    handleFilterChange,
    refresh,
  } = usePaginatedResource<any>({
    apiService: appointmentHistoryService.getAppointmentHistoryList,
    initialFilters: {
      page: 1,
      limit: 10,
      status: 'all',
      consultant_id: 'all',
      start_date: '',
      end_date: '',
    },
  });

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const response = await consultantService.getAllConsultants();
        if (response.data.consultants) {
          setConsultants(response.data.consultants as unknown as Consultant[]);
        }
      } catch (error) {
        toast.error('Không thể tải danh sách chuyên gia.');
      }
    };
    fetchConsultants();
  }, []);

  const handleAction = async (action: () => Promise<any>, successMessage: string, appointmentId: string) => {
    setActionLoading(appointmentId);
    try {
      const response = await action();
      if (response.success) {
        toast.success(successMessage);
        setSelectedAppointment(null);
        refresh();
      } else {
        toast.error(response.message || 'Thao tác thất bại');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi không mong đợi.');
    } finally {
      setActionLoading('');
    }
  };

  const handleConfirmAppointment = (id: string) => {
    handleAction(
      () => appointmentService.confirmAppointment(id), 
      'Đã xác nhận lịch hẹn thành công!',
      id
    );
  };

  const handleCancelAppointment = (id: string) => {
    handleAction(
      () => appointmentService.cancelAppointment(id), 
      'Đã hủy lịch hẹn thành công!',
      id
    );
  };

  const handleCompleteAppointment = async (id: string) => {
    setActionLoading(id);
    try {
      // Complete appointment using PUT /appointments/:appointmentId/complete
      const response = await fetch(`/api/appointments/${id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Đã hoàn thành lịch hẹn thành công!');
        refresh();
      } else {
        toast.error(result.message || 'Không thể hoàn thành lịch hẹn');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi không mong đợi.');
    } finally {
      setActionLoading('');
    }
  };

  const handleSendReminder = async (id: string) => {
    setActionLoading(id);
    try {
      // Send reminder using POST /appointments/:appointmentId/send-reminder
      const response = await fetch(`/api/appointments/${id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Đã gửi nhắc nhở thành công!');
      } else {
        toast.error(result.message || 'Không thể gửi nhắc nhở');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi không mong đợi.');
    } finally {
      setActionLoading('');
    }
  };

  const formatDateDisplay = (dateString: string) => 
    dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: vi }) : 'N/A';
  
  const formatTimeDisplay = (startTime: string, endTime: string) => 
    `${startTime} - ${endTime}`;

  const columns = [
    { 
      title: 'Khách hàng', 
      key: 'customer', 
      render: (_: any, r: any) => (
        <div className="font-medium text-gray-900">
          {r.appointment_id?.customer_id?.full_name || 'N/A'}
        </div>
      )
    },
    { 
      title: 'Chuyên gia', 
      key: 'consultant', 
      render: (_: any, r: any) => (
        <div className="font-medium text-gray-900">
          {r.appointment_id?.consultant_id?.user_id?.full_name || 'N/A'}
        </div>
      )
    },
    { 
      title: 'Ngày & Giờ', 
      key: 'datetime', 
      render: (_: any, r: any) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatDateDisplay(r.appointment_id?.appointment_date)}
          </div>
          <div className="text-gray-500">
            {formatTimeDisplay(r.appointment_id?.start_time, r.appointment_id?.end_time)}
          </div>
        </div>
      )
    },
    { 
      title: 'Trạng thái', 
      key: 'status', 
      render: (_: any, r: any) => (
        <Tag 
          color={getStatusColor(r.appointment_id?.status)} 
          className="font-medium"
        >
          {getStatusLabel(r.appointment_id?.status)}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => {
        const appointment = record.appointment_id;
        const appointmentId = appointment?._id;
        const status = appointment?.status;
        const isLoading = actionLoading === appointmentId;

        return (
          <Space size="small">
            {/* View Details */}
            <Tooltip title="Xem chi tiết">
              <Button 
                size="small" 
                icon={<FaEye />} 
                onClick={() => setSelectedAppointment(appointment)}
              />
            </Tooltip>

            {/* Status-specific actions */}
            {status === 'pending' && (
              <>
                <Tooltip title="Xác nhận">
                  <Popconfirm
                    title="Xác nhận lịch hẹn này?"
                    onConfirm={() => handleConfirmAppointment(appointmentId)}
                    okText="Xác nhận"
                    cancelText="Hủy"
                  >
                    <Button 
                      size="small" 
                      type="primary" 
                      icon={<FaCheck />} 
                      loading={isLoading}
                    />
                  </Popconfirm>
                </Tooltip>
                
                <Tooltip title="Hủy lịch hẹn">
                  <Popconfirm
                    title="Hủy lịch hẹn này?"
                    onConfirm={() => handleCancelAppointment(appointmentId)}
                    okText="Hủy lịch"
                    cancelText="Không"
                  >
                    <Button 
                      size="small" 
                      danger 
                      icon={<FaTimes />} 
                      loading={isLoading}
                    />
                  </Popconfirm>
                </Tooltip>
              </>
            )}

            {(status === 'confirmed' || status === 'in_progress') && (
              <>
                <Tooltip title="Hoàn thành">
                  <Popconfirm
                    title="Đánh dấu lịch hẹn này đã hoàn thành?"
                    onConfirm={() => handleCompleteAppointment(appointmentId)}
                    okText="Hoàn thành"
                    cancelText="Hủy"
                  >
                    <Button 
                      size="small" 
                      type="primary"
                      icon={<FaCheckCircle />} 
                      loading={isLoading}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    />
                  </Popconfirm>
                </Tooltip>
                
                <Tooltip title="Gửi nhắc nhở">
                  <Button 
                    size="small" 
                    icon={<FaBell />} 
                    loading={isLoading}
                    onClick={() => handleSendReminder(appointmentId)}
                    style={{ borderColor: '#faad14', color: '#faad14' }}
                  />
                </Tooltip>
                
                <Tooltip title="Hủy lịch hẹn">
                  <Popconfirm
                    title="Hủy lịch hẹn này?"
                    onConfirm={() => handleCancelAppointment(appointmentId)}
                    okText="Hủy lịch"
                    cancelText="Không"
                  >
                    <Button 
                      size="small" 
                      danger 
                      icon={<FaTimes />} 
                      loading={isLoading}
                    />
                  </Popconfirm>
                </Tooltip>
              </>
            )}

            {/* Send reminder for all non-cancelled appointments */}
            {status !== 'cancelled' && status !== 'completed' && status !== 'pending' && (
              <Tooltip title="Gửi nhắc nhở">
                <Button 
                  size="small" 
                  icon={<FaBell />} 
                  loading={isLoading}
                  onClick={() => handleSendReminder(appointmentId)}
                  style={{ borderColor: '#faad14', color: '#faad14' }}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const filterControls = (
    <>
      <Col>
        <Select 
          value={filters.status} 
          onChange={(value) => handleFilterChange('status', value)} 
          style={{ width: 150 }}
          placeholder="Trạng thái"
        >
          <Option value="all">Tất cả</Option>
          <Option value="pending">Chờ xác nhận</Option>
          <Option value="confirmed">Đã xác nhận</Option>
          <Option value="in_progress">Đang diễn ra</Option>
          <Option value="completed">Đã hoàn thành</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      </Col>
      <Col>
        <Select 
          value={filters.consultant_id} 
          onChange={(value) => handleFilterChange('consultant_id', value)} 
          style={{ width: 200 }}
          placeholder="Chuyên gia"
        >
          <Option value="all">Tất cả chuyên gia</Option>
          {consultants
            .filter(c => c && c._id && c.user_id)
            .map(c => (
              <Option key={c._id} value={c._id}>
                {c.user_id.full_name}
              </Option>
            ))
          }
        </Select>
      </Col>
      <Col>
        <DatePicker.RangePicker 
          placeholder={['Từ ngày', 'Đến ngày']}
          onChange={(dates) => {
            handleFilterChange('start_date', dates?.[0]?.toISOString() || '');
            handleFilterChange('end_date', dates?.[1]?.toISOString() || '');
          }} 
        />
      </Col>
    </>
  );

  return (
    <>
      <ResourceList
        resourceTitle="Quản lý Lịch hẹn"
        tableColumns={columns}
        rowKey="_id"
        data={data}
        loading={loading}
        pagination={pagination}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handlePageChange={handlePageChange}
        filterControls={filterControls}
      />
      
      <Modal 
        title="Chi tiết lịch hẹn"
        open={!!selectedAppointment} 
        onCancel={() => setSelectedAppointment(null)} 
        footer={null}
        width={600}
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                             <div>
                 <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                 <p className="mt-1 text-sm text-gray-900">
                   {typeof selectedAppointment.customer_id === 'object' && selectedAppointment.customer_id?.full_name 
                     ? selectedAppointment.customer_id.full_name 
                     : (typeof selectedAppointment.customer_id === 'string' ? selectedAppointment.customer_id : 'N/A')}
                 </p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Chuyên gia</label>
                 <p className="mt-1 text-sm text-gray-900">
                   {typeof selectedAppointment.consultant_id === 'object' && selectedAppointment.consultant_id?.user_id?.full_name
                     ? selectedAppointment.consultant_id.user_id.full_name
                     : (typeof selectedAppointment.consultant_id === 'string' ? selectedAppointment.consultant_id : 'N/A')}
                 </p>
               </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày hẹn</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateDisplay(selectedAppointment.appointment_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Thời gian</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatTimeDisplay(selectedAppointment.start_time, selectedAppointment.end_time)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <div className="mt-1">
                  <Tag color={getStatusColor(selectedAppointment.status)}>
                    {getStatusLabel(selectedAppointment.status)}
                  </Tag>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã lịch hẹn</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAppointment._id}</p>
              </div>
            </div>
            
            {selectedAppointment.meeting_info && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Thông tin cuộc họp</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                                     <p className="text-sm">
                     <strong>Link:</strong> 
                     <a 
                       href={selectedAppointment.meeting_info.meet_url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-blue-600 hover:text-blue-800 ml-2"
                     >
                       {selectedAppointment.meeting_info.meet_url}
                     </a>
                   </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default StaffAppointmentManagement;