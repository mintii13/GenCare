import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../../../contexts/AuthContext';
import { appointmentService } from '../../../../services/appointmentService';
import { consultantService } from '../../../../services/consultantService';
import toast from 'react-hot-toast';
import { FaEye, FaCheck, FaTimes, FaEdit, FaBell, FaCheckCircle } from 'react-icons/fa';
import { Appointment, AppointmentQuery, AppointmentsPaginatedResponse } from '../../../../types/appointment';
import ResourceList from '../../../../components/common/ResourceList';
import usePaginatedResource from '../../../../hooks/usePaginatedResource';
import { Select, Col, Button, DatePicker, Modal, Tag, Space, Popconfirm, Tooltip } from 'antd';

import { Consultant } from '@/types/user';

const { Option } = Select;

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

  const apiService = useCallback(async (params: URLSearchParams) => {
    const query: AppointmentQuery = {};
    for (const [key, value] of params.entries()) {
      query[key as keyof AppointmentQuery] = value as any;
    }
    
    const response = await appointmentService.getAllAppointmentsPaginated(query);

    // Transform the response to match the structure expected by usePaginatedResource
    if (response.success && response.data?.data) {
      const originalData = response.data as unknown as AppointmentsPaginatedResponse;
      return {
        ...response,
        data: {
          success: true,
          data: {
            items: originalData.data.appointments,
            pagination: originalData.data.pagination,
          }
        },
      };
    }
    
    // Return a compatible error structure
    return {
        ...response,
        data: {
          success: false,
          data: {
            items: [],
            pagination: {
                current_page: 1,
                total_pages: 1,
                total_items: 0,
                items_per_page: 10,
            },
          }
        },
    };
  }, []);

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
  } = usePaginatedResource<Appointment>({
    apiService,
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
      render: (_: any, r: Appointment) => (
          <div className="font-medium text-gray-900">
          {r.customer_id?.full_name || 'N/A'}
        </div>
      )
    },
    { 
      title: 'Chuyên gia', 
      key: 'consultant', 
      render: (_: any, r: Appointment) => (
          <div className="font-medium text-gray-900">
          {r.consultant_id?.user_id?.full_name || 'N/A'}
        </div>
      )
    },
    { 
      title: 'Ngày & Giờ', 
      key: 'datetime', 
      render: (_: any, r: Appointment) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatDateDisplay(r.appointment_date)}
          </div>
          <div className="text-gray-500">
            {formatTimeDisplay(r.start_time, r.end_time)}
          </div>
        </div>
      )
    },
    { 
      title: 'Trạng thái', 
      key: 'status', 
      render: (_: any, r: Appointment) => (
        <Tag 
          color={getStatusColor(r.status)} 
          className="font-medium"
        >
          {getStatusLabel(r.status)}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Appointment) => {
        const appointmentId = record._id;
        const status = record.status;
        const isLoading = actionLoading === appointmentId;

        return (
          <Space size="small">
            {/* View Details */}
            <Tooltip title="Xem chi tiết">
              <Button 
                size="small" 
                icon={<FaEye />} 
                onClick={() => setSelectedAppointment(record)}
              />
            </Tooltip>

            {/* Confirm */}
            {status === 'pending' && (
              <Popconfirm
                title="Xác nhận lịch hẹn này?"
                onConfirm={() => handleConfirmAppointment(appointmentId)}
                okText="Xác nhận"
                cancelText="Hủy"
                disabled={isLoading}
              >
                <Tooltip title="Xác nhận">
                  <Button 
                    size="small" 
                    icon={<FaCheck />} 
                    loading={isLoading}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {/* Cancel */}
            {(status === 'pending' || status === 'confirmed') && (
              <Popconfirm
                title="Hủy lịch hẹn này?"
                onConfirm={() => handleCancelAppointment(appointmentId)}
                okText="Đồng ý"
                cancelText="Không"
                disabled={isLoading}
              >
                <Tooltip title="Hủy bỏ">
                  <Button 
                    size="small" 
                    danger 
                    icon={<FaTimes />} 
                    loading={isLoading}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {/* Complete */}
            {status === 'in_progress' && (
              <Popconfirm
                title="Hoàn thành lịch hẹn này?"
                onConfirm={() => handleCompleteAppointment(appointmentId)}
                okText="Đồng ý"
                cancelText="Không"
                disabled={isLoading}
              >
                <Tooltip title="Hoàn thành">
                  <Button 
                    size="small" 
                    icon={<FaCheckCircle />} 
                    loading={isLoading}
                    style={{ color: 'green', borderColor: 'green' }}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            
            {/* Send Reminder */}
            {status === 'confirmed' && (
              <Tooltip title="Gửi nhắc nhở">
                <Button 
                  size="small" 
                  icon={<FaBell />} 
                  onClick={() => handleSendReminder(appointmentId)}
                  loading={isLoading}
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
            .filter(c => c && c._id && c.full_name)
            .map(c => (
              <Option key={c._id} value={c._id}>
                {c.full_name}
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
      
      {/* Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                   <div 
           className="bg-white rounded-xl shadow-2xl relative max-h-[90vh] overflow-hidden"
           style={{ 
             width: '60vw', 
             maxWidth: '800px'
           }}
         >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Chi tiết lịch hẹn</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

                       {/* Content */}
           <div className="flex" style={{ height: '500px' }}>
             {/* Left Half - Appointment Info */}
             <div className="w-1/2 p-6 border-r border-gray-200">
               <div className="h-full flex flex-col">
                  {/* Status */}
                  <div className="mb-6">
                    <Tag color={getStatusColor(selectedAppointment.status)}>
                      {getStatusLabel(selectedAppointment.status)}
                    </Tag>
                  </div>

                  {/* Appointment Info */}
                  <div className="space-y-4 flex-1">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Khách hàng:</span>
                      <p className="font-medium text-gray-800">
                        {typeof selectedAppointment.customer_id === 'object' && selectedAppointment.customer_id?.full_name 
                          ? selectedAppointment.customer_id.full_name 
                          : (typeof selectedAppointment.customer_id === 'string' ? selectedAppointment.customer_id : 'N/A')}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Chuyên gia:</span>
                      <p className="font-medium text-gray-800">
                        {typeof selectedAppointment.consultant_id === 'object' && selectedAppointment.consultant_id?.user_id?.full_name
                          ? selectedAppointment.consultant_id.user_id.full_name
                          : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Ngày hẹn:</span>
                      <p className="font-medium text-gray-800">{formatDateDisplay(selectedAppointment.appointment_date)}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Thời gian:</span>
                      <p className="font-medium text-gray-800">{formatTimeDisplay(selectedAppointment.start_time, selectedAppointment.end_time)}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Mã lịch hẹn:</span>
                      <p className="font-medium text-gray-800 text-xs">{selectedAppointment._id}</p>
                    </div>

                    {selectedAppointment.meeting_info && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <span className="text-gray-600 text-sm font-medium block mb-1">Link cuộc họp:</span>
                        <a 
                          href={selectedAppointment.meeting_info.meet_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline font-medium break-all"
                        >
                          {selectedAppointment.meeting_info.meet_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Half - Notes & Details */}
              <div className="w-1/2 p-6">
                <div className="h-full flex flex-col">
                  <h5 className="text-lg font-bold text-gray-800 mb-4">Ghi chú & Chi tiết</h5>
                  <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <h6 className="font-semibold text-gray-800 mb-2">Thông tin buổi hẹn:</h6>
                        <div className="text-gray-700 space-y-2">
                          <p>• Trạng thái: {getStatusLabel(selectedAppointment.status)}</p>
                          <p>• Ngày hẹn: {formatDateDisplay(selectedAppointment.appointment_date)}</p>
                          <p>• Thời gian: {formatTimeDisplay(selectedAppointment.start_time, selectedAppointment.end_time)}</p>
                          <p>• Khách hàng: {typeof selectedAppointment.customer_id === 'object' && selectedAppointment.customer_id?.full_name 
                            ? selectedAppointment.customer_id.full_name : 'N/A'}</p>
                          <p>• Chuyên gia: {typeof selectedAppointment.consultant_id === 'object' && selectedAppointment.consultant_id?.user_id?.full_name
                            ? selectedAppointment.consultant_id.user_id.full_name : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <h6 className="font-semibold text-gray-800 mb-2">Quản lý lịch hẹn:</h6>
                        <div className="text-gray-700 space-y-1">
                          <p>• Mã lịch hẹn: {selectedAppointment._id}</p>
                          <p>• Có thể theo dõi trạng thái và quản lý cuộc hẹn</p>
                          {selectedAppointment.meeting_info?.meet_url && (
                            <p>• Đã tạo link Google Meet cho cuộc hẹn</p>
                          )}
                          <p>• Thời gian tư vấn: 30-60 phút/buổi</p>
                          <p>• Liên hệ hỗ trợ nếu cần thiết</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h6 className="font-semibold text-gray-800 mb-2">Hướng dẫn quản lý:</h6>
                        <div className="text-gray-700 space-y-1">
                          {selectedAppointment.status === 'pending' && (
                            <p>• Cuộc hẹn đang chờ xác nhận từ chuyên gia</p>
                          )}
                          {selectedAppointment.status === 'confirmed' && (
                            <p>• Cuộc hẹn đã được xác nhận và sẵn sàng</p>
                          )}
                          {selectedAppointment.status === 'in_progress' && (
                            <p>• Cuộc hẹn đang diễn ra</p>
                          )}
                          {selectedAppointment.status === 'completed' && (
                            <p>• Cuộc hẹn đã hoàn thành thành công</p>
                          )}
                          {selectedAppointment.status === 'cancelled' && (
                            <p>• Cuộc hẹn đã bị hủy</p>
                          )}
                          <p>• Có thể xuất báo cáo hoặc thống kê</p>
                          <p>• Theo dõi hiệu quả tư vấn</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffAppointmentManagement;