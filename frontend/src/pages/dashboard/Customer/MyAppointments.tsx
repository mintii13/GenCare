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
import { StiOrder, StiOrderQuery } from '@/types/sti';

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await stiService.getMyOrdersPaginated(query);
      if (response.success) {
        setOrders(response.data.items || []);
        setPagination(response.data.pagination);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError((err as Error).message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
            <p className="font-semibold text-gray-800">{order.package_id?.name || 'Gói xét nghiệm'}</p>
            <p className="text-sm text-gray-500">Mã đơn: {order.order_code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ngày đặt</p>
            <p className="font-medium">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</p>
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
    return () => clearTimeout(timer);
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
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đổi lịch');
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
            {appointment.status === 'confirmed' && (
              <Button variant="outline" size="sm" onClick={() => handleEditAppointment(appointment)}>
                Đổi lịch
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {appointment.status === 'confirmed' && (
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
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm chuyên gia..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Chi tiết lịch hẹn</h3>
                <button 
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Chuyên gia</p>
                    <p className="font-medium">{consultantDetails[selectedAppointment.consultant_id._id]?.full_name || 'Chưa có thông tin'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chuyên khoa</p>
                    <p className="font-medium">{consultantDetails[selectedAppointment.consultant_id._id]?.specialization || 'Chưa có thông tin'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày hẹn</p>
                    <p className="font-medium">{format(new Date(selectedAppointment.appointment_date), 'EEEE, dd/MM/yyyy', { locale: vi })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Thời gian</p>
                    <p className="font-medium">{selectedAppointment.start_time} - {selectedAppointment.end_time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    <Badge variant={statusColors[selectedAppointment.status] as any}>
                      {statusLabels[selectedAppointment.status]}
                    </Badge>
                  </div>
                  {(selectedAppointment as any).notes && (
                    <div>
                      <p className="text-sm text-gray-600">Ghi chú</p>
                      <p className="font-medium whitespace-pre-wrap">{(selectedAppointment as any).notes}</p>
                    </div>
                  )}
                  {(selectedAppointment as any).meet_link && (
                    <div>
                      <p className="text-sm text-gray-600">Link cuộc họp</p>
                      <a 
                        href={(selectedAppointment as any).meet_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Tham gia cuộc họp
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Đặt lúc</p>
                    <p className="font-medium">{format(new Date(selectedAppointment.created_date), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
              <WeeklySlotPicker
                consultantId={editingAppointment.consultant_id._id}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedNewSlot}
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setEditingAppointment(null)}>Hủy</Button>
                <Button onClick={handleUpdateAppointment} disabled={!selectedNewSlot}>Xác nhận đổi lịch</Button>
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