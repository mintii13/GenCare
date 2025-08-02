import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentService } from '../../../services/appointmentService';
import { consultantService } from '../../../services/consultantService';
import WeeklySlotPicker from '../../consultation/WeeklySlotPicker';
import FeedbackModal from '../../../components/feedback/FeedbackModal';
import FeedbackService from '../../../services/feedbackService';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import {
  Appointment,
  AppointmentQuery,
  OrderQuery,
  PaginationInfo,
} from '../../../types/appointment';
import {
  FaCalendarAlt,
  FaSpinner,
  FaTimes,
  FaFilter,
  FaSearch,
  FaArrowLeft,
  FaArrowRight,
  FaUserMd,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { stiService } from '@/services/stiService';
import { FaVial } from 'react-icons/fa';
import { StiOrderQuery, StiOrder } from '@/types/sti';
import { API } from '@/config/apiEndpoints';
import { apiClient } from '@/services';

interface FeedbackFormData {
  rating: number;
  comment: string;
}

const TestBookingHistory: React.FC = () => {
  const [orders, setOrders] = useState<StiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_prev: false,
  });
  const [query, setQuery] = useState<StiOrderQuery>({ page: 1, limit: 10 });

  // const fetchOrders = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const response = await stiService.getMyOrdersPaginated(query);
  //     if (response.success) {
  //       setOrders(response.data.items || []);
  //       setPagination(response.data.pagination);
  //     } else {
  //       setError(response.message);
  //     }
  //   } catch (err) {
  //     setError((err as Error).message || 'Có lỗi xảy ra khi tải dữ liệu');
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [query]);

  const fetchOrders = useCallback(async () => {
    try {
      try {
        const response = await stiService.getMyOrdersPaginated(query);
        if (response && response.success && response.data) {
          setOrders(response.data.items || []);
          setPagination(response.data.pagination);
        } else {
          setError(response?.message || 'Không thể tải dữ liệu đơn hàng');
        }
      } catch (err) {
        setError((err as Error).message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePageChange = (newPage: number) => {
    setQuery(prev => ({ ...prev, page: newPage }));
  };

  const statusLabels: { [key: string]: string } = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
  };

  const renderOrderCard = (order: StiOrder) => {
    return (
      <Card key={order._id} className="mb-4 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="md:col-span-2">
            <p className="font-semibold text-gray-800">{order.sti_package_item ? 'Gói xét nghiệm' : 'Xét nghiệm đơn lẻ'}</p>
            <p className="text-sm text-gray-500">Mã đơn: {order.order_code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ngày đặt</p>
            <p className="font-medium">{order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Trạng thái</p>
            <Badge>{statusLabels[order.order_status] || order.order_status}</Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tổng tiền</p>
            <p className="font-semibold text-lg">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Lịch sử xét nghiệm</CardTitle>
      </CardHeader>
      {/* <div className="mt-4 flex flex-col md:flex-row gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="Booked">Đã đặt lịch</SelectItem>
                    <SelectItem value="Accepted">Đã chấp nhận</SelectItem>
                    <SelectItem value="Processing">Đang xử lý</SelectItem>
                    <SelectItem value="SpecimenCollected">Đã lấy mẫu</SelectItem>
                    <SelectItem value="Testing">Đang xét nghiệm</SelectItem>
                    <SelectItem value="Completed">Đã hoàn thành</SelectItem>
                    <SelectItem value="Canceled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
      <CardContent>
        {error && <div className="text-red-600 bg-red-50 p-4 rounded-md text-center">{error}</div>}
        {!loading && !error && orders.length > 0 ? (
          orders.map(renderOrderCard)
        ) : (
          !loading && (
            <div className="text-center py-12">
              <FaVial className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800">Chưa có lịch sử xét nghiệm</h3>
              <p className="text-gray-500 mt-1">Bạn chưa đặt lịch xét nghiệm nào.</p>
            </div>
          )
        )}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Hiển thị {orders.length} trên {pagination.total_items} kết quả
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={!pagination.has_prev}
              >
                <FaArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Trang {pagination.current_page}/{pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={!pagination.has_next}
              >
                <FaArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MyAppointments: React.FC = () => {
  const { modalState, showConfirm, hideConfirm } = useConfirmModal();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [selectedNewSlot, setSelectedNewSlot] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [consultantDetails, setConsultantDetails] = useState<{
    [key: string]: { full_name: string; specialization: string; avatar?: string };
  }>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 5,
    has_next: false,
    has_prev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState<AppointmentQuery>({
    page: 1,
    limit: 5,
    sort_by: 'appointment_date',
    sort_order: 'desc',
    status: undefined,
  });

  const [orderQuery, setOrderQuery] = useState<OrderQuery>({
    page: 1,
    limit: 5,
    sort_by: 'order_status',
    sort_order: 'desc',
    status: undefined,
  });
  
  const statusLabels: { [key: string]: string } = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang tư vấn',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
  };

  const statusColors: { [key: string]: 'default' | 'destructive' | 'outline' | 'secondary' } = {
    pending: 'secondary', // 'warning' is not a valid variant
    confirmed: 'default', // 'info' is not a valid variant
    in_progress: 'secondary',
    completed: 'outline', // 'success' is not a valid variant
    cancelled: 'destructive',
  };

  const navigate = useNavigate();

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await appointmentService.getMyAppointmentsPaginated(query);
      if (response.success) {
        setAppointments(response.data.appointments);
        setPagination(response.data.pagination);

        const consultantIds = response.data.appointments
          .map((apt: Appointment) => apt.consultant_id?._id)
          .filter((id: string | undefined): id is string => !!id);

        fetchConsultantDetails(consultantIds);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError((err as Error).message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const fetchConsultantDetails = useCallback(async (consultantIds: string[]) => {
    const uniqueIds = [...new Set(consultantIds)].filter(id => !consultantDetails[id]);
    if (uniqueIds.length === 0) return;

    try {
      const promises = uniqueIds.map(id => consultantService.getConsultantById(id));
      const results = await Promise.all(promises);

      const newDetails = results.reduce((acc, consultant, index) => {
        if (consultant) {
          acc[uniqueIds[index]] = consultant;
        }
        return acc;
      }, {} as { [key: string]: any });
      
      setConsultantDetails(prev => ({ ...prev, ...newDetails }));
    } catch (error) {
      console.error('Error fetching consultant details:', error);
    }
  }, [consultantDetails]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(prev => ({ ...prev, page: 1, search: searchTerm.trim() || undefined }));
    }, 500);
    const orderTimer = setTimeout(() => {
      setOrderQuery(prev => ({ ...prev, page: 1, search: searchTerm.trim() || undefined }));
    }, 500);
    return () => {
      clearTimeout(timer);
      clearTimeout(orderTimer);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handlePageChange = (newPage: number) => {
    setQuery(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusFilter = (status: string) => {
    setQuery(prev => ({ ...prev, page: 1, status: status === 'all' ? undefined : status }));
  };

  const handleSortChange = (value: string) => {
    // Split từ cuối để xử lý đúng với "appointment_date_asc"
    const lastUnderscoreIndex = value.lastIndexOf('_');
    const sort_by = value.substring(0, lastUnderscoreIndex);
    const sort_order = value.substring(lastUnderscoreIndex + 1);
    setQuery(prev => ({ 
      ...prev, 
      page: 1, 
      sort_by: sort_by as AppointmentQuery['sort_by'], 
      sort_order: sort_order as AppointmentQuery['sort_order'] 
    }));
  };
  
  const handleCancelAppointment = (appointmentId: string) => {
    showConfirm(
      {
        title: "Xác nhận hủy lịch hẹn",
        description: "Bạn có chắc chắn muốn hủy lịch hẹn này?",
        confirmText: "Hủy lịch hẹn",
        cancelText: "Không",
        confirmVariant: "destructive"
      },
      async () => {
        try {
          const data = await appointmentService.cancelAppointment(appointmentId);
          if (data.success) {
            toast.success('Hủy lịch hẹn thành công!');
            fetchAppointments();
          } else {
            toast.error(data.message || 'Lỗi khi hủy lịch hẹn');
          }
        } catch (error) {
          toast.error('Có lỗi xảy ra khi hủy lịch hẹn');
        }
      }
    );
  };
  
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedNewSlot(null);
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    setSelectedNewSlot({ date, startTime, endTime });
  };
  
  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !selectedNewSlot) return;
    
    // Validation: Kiểm tra xem slot mới có khác slot cũ không
    const isSameSlot = 
      editingAppointment.appointment_date === selectedNewSlot.date &&
      editingAppointment.start_time === selectedNewSlot.startTime &&
      editingAppointment.end_time === selectedNewSlot.endTime;
    
    if (isSameSlot) {
      toast.error('Vui lòng chọn thời gian khác với lịch hiện tại');
      return;
    }
    
    try {
      const data = await appointmentService.rescheduleAppointment(
        editingAppointment._id,
        {
          appointment_date: selectedNewSlot.date,
          start_time: selectedNewSlot.startTime,
          end_time: selectedNewSlot.endTime,
        }
      );
      if (data.success) {
        toast.success('Đổi lịch thành công!');
        setEditingAppointment(null);
        setSelectedNewSlot(null);
        fetchAppointments();
      } else {
        toast.error(data.message || 'Lỗi khi đổi lịch');
      }
    } catch (error: any) {
      // Xử lý lỗi chi tiết hơn
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Có lỗi xảy ra khi đổi lịch');
      }
    }
  };

  const handleFeedbackSubmit = async (formData: FeedbackFormData) => {
    if (!selectedAppointment) return;
    try {
      const response = await FeedbackService.submitFeedback(selectedAppointment._id, formData);
      if (response.success) {
        toast.success(
          selectedAppointment.feedback ? 'Cập nhật đánh giá thành công!' : 'Gửi đánh giá thành công!'
        );
        setShowFeedbackModal(false);
        setSelectedAppointment(null);
        fetchAppointments();
      } else {
        toast.error(response.message || 'Lỗi khi gửi đánh giá');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi đánh giá');
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const consultantId = appointment.consultant_id?._id;
    const consultant = consultantId ? consultantDetails[consultantId] : null;
    const consultantName = consultant?.full_name || appointment.consultant_id?.user_id?.full_name || 'Chuyên gia';
    const avatar = consultant?.avatar;

    return (
      <Card key={appointment._id} className="mb-4 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-3 flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={avatar} alt={consultantName} />
              <AvatarFallback><FaUserMd /></AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-800">{consultantName}</p>
              <p className="text-sm text-gray-500">{consultant?.specialization || 'Tư vấn'}</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Ngày</p>
            <p className="font-medium">{format(new Date(appointment.appointment_date), 'dd/MM/yyyy')}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Thời gian</p>
            <p className="font-medium">{`${appointment.start_time} - ${appointment.end_time}`}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Trạng thái</p>
            <Badge variant={statusColors[appointment.status] as any}>{statusLabels[appointment.status]}</Badge>
          </div>
          <div className="md:col-span-3 flex justify-end items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(appointment)}>
              Chi tiết
            </Button>
            {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleEditAppointment(appointment)}
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                <FaCalendarAlt className="w-3 h-3 mr-1" />
                Đổi lịch
              </Button>
            )}
            {appointment.status === 'completed' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSelectedAppointment(appointment); setShowFeedbackModal(true); }}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {appointment.feedback ? 'Sửa đánh giá' : 'Đánh giá'}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                    <DropdownMenuItem onClick={() => handleCancelAppointment(appointment._id)} className="text-red-600">
                      Hủy hẹn
                    </DropdownMenuItem>
                )}
                {appointment.status === 'completed' && (
                  <DropdownMenuItem onClick={() => { setSelectedAppointment(appointment); setShowFeedbackModal(true); }}>
                    {appointment.feedback ? 'Sửa đánh giá' : 'Đánh giá'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2 px-4 md:px-6">
      <Tabs defaultValue="consultations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consultations">
            <FaCalendarAlt className="mr-2 h-4 w-4" />
            Lịch hẹn tư vấn
          </TabsTrigger>
          <TabsTrigger value="testing">
            <FaVial className="mr-2 h-4 w-4" />
            Lịch sử xét nghiệm
          </TabsTrigger>
        </TabsList>
        <TabsContent value="consultations" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-2xl font-bold">Lịch hẹn của tôi</CardTitle>
                <Button onClick={() => navigate('/consultation/book')}>
                  <FaCalendarAlt className="mr-2 h-4 w-4" /> Đặt lịch mới
                </Button>
              </div>
              <div className="mt-4 flex flex-col md:flex-row gap-2">
                <Select onValueChange={handleStatusFilter} defaultValue="all">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending">Chờ xác nhận</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="in_progress">Đang tư vấn</SelectItem>
                    <SelectItem value="completed">Đã hoàn thành</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={handleSortChange} defaultValue="appointment_date_desc">
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment_date_desc">Ngày hẹn mới nhất</SelectItem>
                    <SelectItem value="appointment_date_asc">Ngày hẹn cũ nhất</SelectItem>
                    <SelectItem value="createdAt_desc">Tạo mới nhất</SelectItem>
                    <SelectItem value="createdAt_asc">Tạo cũ nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader> 
            <CardContent>
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                  <FaSpinner className="animate-spin text-2xl text-blue-600" />
                </div>
              )}
              {error && <div className="text-red-600 bg-red-50 p-4 rounded-md text-center">{error}</div>}
              {!loading && !error && appointments.length > 0 ? (
                appointments.map(renderAppointmentCard)
              ) : (
                !loading && (
                  <div className="text-center py-12">
                    <FaCalendarAlt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800">Chưa có lịch hẹn</h3>
                    <p className="text-gray-500 mt-1">
                      {query.search || query.status ? 'Không tìm thấy lịch hẹn phù hợp.' : 'Bạn chưa có lịch hẹn nào.'}
                    </p>
                  </div>
                )
              )}

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Hiển thị {appointments.length} trên {pagination.total_items} kết quả
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={!pagination.has_prev}
                    >
                      <FaArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Trang {pagination.current_page}/{pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={!pagination.has_next}
                    >
                      <FaArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="testing" className="mt-4">
          <TestBookingHistory />
        </TabsContent>
      </Tabs>

             {selectedAppointment && !showFeedbackModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
           <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-semibold text-gray-800">Chi tiết lịch hẹn</h3>
                 <button 
                   onClick={() => setSelectedAppointment(null)}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <FaTimes className="w-5 h-5" />
                 </button>
               </div>
               
               {/* Thông tin chính */}
               <div className="bg-gray-50 rounded-lg p-4 mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm text-gray-600 font-medium">Chuyên gia</p>
                     <p className="font-semibold text-gray-800 mt-1">
                       {consultantDetails[selectedAppointment.consultant_id._id]?.full_name || 'Chưa có thông tin'}
                     </p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600 font-medium">Chuyên khoa</p>
                     <p className="font-semibold text-gray-800 mt-1">
                       {consultantDetails[selectedAppointment.consultant_id._id]?.specialization || 'Chưa có thông tin'}
                     </p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600 font-medium">Ngày hẹn</p>
                     <p className="font-semibold text-gray-800 mt-1">
                       {format(new Date(selectedAppointment.appointment_date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                     </p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600 font-medium">Thời gian</p>
                     <p className="font-semibold text-gray-800 mt-1">
                       {selectedAppointment.start_time} - {selectedAppointment.end_time}
                     </p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600 font-medium">Trạng thái</p>
                     <div className="mt-1">
                       <Badge variant={statusColors[selectedAppointment.status] as any} className="text-sm">
                         {statusLabels[selectedAppointment.status]}
                       </Badge>
                     </div>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600 font-medium">Đặt lúc</p>
                     <p className="font-semibold text-gray-800 mt-1">
                       {format(new Date(selectedAppointment.created_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Ghi chú khách hàng */}
               {selectedAppointment.customer_notes && (
                 <div className="mb-6">
                   <h4 className="text-sm text-gray-600 font-medium mb-2">Ghi chú của bạn</h4>
                   <div 
                     className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-48 overflow-y-auto"
                     style={{
                       whiteSpace: 'pre-wrap',
                       wordWrap: 'break-word',
                       lineHeight: 1.5,
                       fontSize: 14
                     }}
                   >
                     {selectedAppointment.customer_notes}
                   </div>
                 </div>
               )}

               {/* Ghi chú của chuyên gia */}
               {selectedAppointment.consultant_notes && (
                 <div className="mb-6">
                   <h4 className="text-sm text-gray-600 font-medium mb-2">Ghi chú của chuyên gia</h4>
                   <div 
                     className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-48 overflow-y-auto"
                     style={{
                       whiteSpace: 'pre-wrap',
                       wordWrap: 'break-word',
                       lineHeight: 1.5,
                       fontSize: 14
                     }}
                   >
                     {selectedAppointment.consultant_notes}
                   </div>
                 </div>
               )}

               {/* Link cuộc họp */}
               {selectedAppointment.meeting_info?.meet_url && (
                 <div className="mb-6">
                   <h4 className="text-sm text-gray-600 font-medium mb-2">Link cuộc họp</h4>
                   <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                     <a 
                       href={selectedAppointment.meeting_info.meet_url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-purple-600 hover:text-purple-800 underline font-medium flex items-center gap-2"
                     >
                       <FaCalendarAlt className="w-4 h-4" />
                       Tham gia cuộc họp
                     </a>
                     <p className="text-xs text-gray-500 mt-1">
                       Meeting ID: {selectedAppointment.meeting_info.meeting_id}
                     </p>
                   </div>
                 </div>
               )}

               {/* Thông tin bổ sung */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-sm text-gray-600 font-medium mb-3">Thông tin bổ sung</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-gray-600">Mã lịch hẹn:</span>
                     <span className="ml-2 font-medium text-gray-800">{selectedAppointment._id}</span>
                   </div>
                   <div>
                     <span className="text-gray-600">Loại tư vấn:</span>
                     <span className="ml-2 font-medium text-gray-800">
                       {selectedAppointment.video_call_status === 'in_progress' ? 'Video call' : 'Tư vấn trực tiếp'}
                     </span>
                   </div>
                   {selectedAppointment.updated_date && (
                     <div>
                       <span className="text-gray-600">Cập nhật lúc:</span>
                       <span className="ml-2 font-medium text-gray-800">
                         {format(new Date(selectedAppointment.updated_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                       </span>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

      {editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Đổi lịch hẹn</h3>
                <button 
                  onClick={() => setEditingAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              {/* Thông tin lịch hiện tại */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Lịch hiện tại:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Ngày:</span>
                    <span className="ml-2 font-medium">{format(new Date(editingAppointment.appointment_date), 'dd/MM/yyyy')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="ml-2 font-medium">{editingAppointment.start_time} - {editingAppointment.end_time}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Chuyên gia:</span>
                    <span className="ml-2 font-medium">
                      {consultantDetails[editingAppointment.consultant_id._id]?.full_name || 'Chuyên gia'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Chọn slot mới */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-4">Chọn thời gian mới:</h4>
                <WeeklySlotPicker
                  consultantId={editingAppointment.consultant_id._id}
                  onSlotSelect={handleSlotSelect}
                  selectedSlot={selectedNewSlot}
                />
              </div>
              
              {/* Hiển thị slot đã chọn */}
              {selectedNewSlot && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Thời gian mới đã chọn:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Ngày:</span>
                      <span className="ml-2 font-medium text-blue-800">{format(new Date(selectedNewSlot.date), 'dd/MM/yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Thời gian:</span>
                      <span className="ml-2 font-medium text-blue-800">{selectedNewSlot.startTime} - {selectedNewSlot.endTime}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Chuyên gia:</span>
                      <span className="ml-2 font-medium text-blue-800">
                        {consultantDetails[editingAppointment.consultant_id._id]?.full_name || 'Chuyên gia'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setEditingAppointment(null)}>Hủy</Button>
                <Button 
                  onClick={handleUpdateAppointment} 
                  disabled={!selectedNewSlot}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  Xác nhận đổi lịch
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && selectedAppointment && (
         <FeedbackModal
           isOpen={showFeedbackModal}
           onClose={() => {
             setShowFeedbackModal(false);
             setSelectedAppointment(null);
           }}
           appointmentInfo={{
             consultant_name: consultantDetails[selectedAppointment.consultant_id._id]?.full_name || 'Chuyên gia',
             appointment_date: format(new Date(selectedAppointment.appointment_date), 'dd/MM/yyyy'),
             start_time: selectedAppointment.start_time,
             end_time: selectedAppointment.end_time,
           }}
           existingFeedback={selectedAppointment.feedback}
           onSubmit={handleFeedbackSubmit}
         />
       )}

       <ConfirmModal
         isOpen={modalState.isOpen}
         onClose={hideConfirm}
         onConfirm={modalState.onConfirm}
         title={modalState.title}
         description={modalState.description}
         confirmText={modalState.confirmText}
         cancelText={modalState.cancelText}
         confirmVariant={modalState.confirmVariant}
         isLoading={modalState.isLoading}
       />
    </div>
  );
};

export default MyAppointments;