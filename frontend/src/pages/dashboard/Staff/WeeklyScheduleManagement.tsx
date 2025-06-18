import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { consultantService } from '@/services/consultantService';
import { weeklyScheduleService } from '@/services/weeklyScheduleService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { PlusCircle, Search } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { format } from 'date-fns';
import ScheduleEditModal from './components/ScheduleEditModal';
import CopyScheduleModal from './components/CopyScheduleModal';

// Interfaces (sẽ được mở rộng sau)
interface Consultant {
    consultant_id: string;
    full_name: string;
}

interface Schedule {
    _id: string;
    week_start_date: string;
    week_end_date: string;
    notes?: string;
}

const WeeklyScheduleManagement: React.FC = () => {
    const { user } = useAuth();
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
    
    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

    // State for copy modal
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [copyingScheduleId, setCopyingScheduleId] = useState<string | null>(null);

    // Fetch tất cả consultant để staff lựa chọn
    useEffect(() => {
        const fetchConsultants = async () => {
            setLoading(true);
            console.log('🔍 [DEBUG] Starting to fetch consultants...');
            try {
                // Lấy tất cả, bỏ qua phân trang bằng cách set limit cao
                console.log('📡 [DEBUG] Calling consultantService.getAllConsultants(1, 1000)');
                const response = await consultantService.getAllConsultants(1, 1000); 
                console.log('📨 [DEBUG] Response from consultantService:', response);
                
                if (response.success) {
                    console.log('✅ [DEBUG] Success! Consultants data:', response.data.consultants);
                    console.log('📊 [DEBUG] Number of consultants:', response.data.consultants.length);
                    setConsultants(response.data.consultants);
                } else {
                    console.error('❌ [DEBUG] Response not successful:', response.message);
                    toast.error("Không thể tải danh sách chuyên gia.");
                }
            } catch (error: any) {
                console.error('💥 [DEBUG] Error occurred:', error);
                console.error('💥 [DEBUG] Error response:', error.response?.data);
                console.error('💥 [DEBUG] Error status:', error.response?.status);
                toast.error("Lỗi khi tải danh sách chuyên gia: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
                console.log('🏁 [DEBUG] Finished fetching consultants');
            }
        };

        fetchConsultants();
    }, []);

    // Fetch lịch của consultant được chọn
    const fetchSchedules = async () => {
        if (!selectedConsultantId) {
            setSchedules([]);
            return;
        }
        setIsLoadingSchedules(true);
        try {
            const response = await weeklyScheduleService.getConsultantSchedules(selectedConsultantId);
            if (response.success) {
                setSchedules(response.data.schedules);
            } else {
                toast.error(response.message || "Không thể tải lịch của chuyên gia.");
                setSchedules([]);
            }
        } catch (error) {
            toast.error("Lỗi khi tải lịch của chuyên gia.");
            console.error(error);
            setSchedules([]);
        } finally {
            setIsLoadingSchedules(false);
        }
    };

    // Fetch schedules when consultant changes
    useEffect(() => {
        fetchSchedules();
    }, [selectedConsultantId]);

    const handleOpenCreateModal = () => {
        setEditingScheduleId(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (scheduleId: string) => {
        setEditingScheduleId(scheduleId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingScheduleId(null);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        // Tải lại danh sách lịch sau khi lưu thành công
        toast.success("Lưu lịch làm việc thành công!");
        fetchSchedules(); 
    };

    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa lịch này không?")) {
            return;
        }
        
        try {
            const response = await weeklyScheduleService.deleteSchedule(scheduleId);
            if (response.success) {
                toast.success("Xóa lịch thành công!");
                fetchSchedules(); // Reload danh sách
            } else {
                toast.error(response.message || "Không thể xóa lịch");
            }
        } catch (error) {
            toast.error("Lỗi khi xóa lịch");
            console.error(error);
        }
    };

    const handleOpenCopyModal = (scheduleId: string) => {
        setCopyingScheduleId(scheduleId);
        setIsCopyModalOpen(true);
    };

    const handleCloseCopyModal = () => {
        setIsCopyModalOpen(false);
        setCopyingScheduleId(null);
    };

    const handleCopySuccess = () => {
        handleCloseCopyModal();
        fetchSchedules();
    };
    
    const columns = useMemo(() => [
        {
            name: 'Tuần',
            selector: (row: Schedule) => `${format(new Date(row.week_start_date), 'dd/MM/yyyy')} - ${format(new Date(row.week_end_date), 'dd/MM/yyyy')}`,
            sortable: true,
        },
        {
            name: 'Ghi chú',
            selector: (row: Schedule) => row.notes || 'Không có',
            sortable: true,
        },
        {
            name: 'Hành động',
            cell: (row: Schedule) => (
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(row._id)}>Sửa</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSchedule(row._id)}>Xóa</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleOpenCopyModal(row._id)}>Sao chép</Button>
                </div>
            ),
        },
    ], []);

    return (
        <div className="container mx-auto p-4 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Quản lý Lịch làm việc của Chuyên gia</h1>

            <div className="flex items-center space-x-4 mb-4">
                 <div className="w-full md:w-1/3">
                    <Select
                        onValueChange={setSelectedConsultantId}
                        value={selectedConsultantId}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn một chuyên gia để quản lý..." />
                        </SelectTrigger>
                        <SelectContent>
                            {consultants.map(c => (
                                <SelectItem key={c.consultant_id} value={c.consultant_id}>
                                    {c.full_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleOpenCreateModal} disabled={!selectedConsultantId}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tạo lịch mới
                </Button>
            </div>

            {selectedConsultantId && (
                 <DataTable
                    columns={columns}
                    data={schedules}
                    progressPending={isLoadingSchedules}
                    pagination
                    highlightOnHover
                    striped
                    noDataComponent="Chuyên gia này chưa có lịch làm việc nào."
                />
            )}

            {isModalOpen && selectedConsultantId && (
                <ScheduleEditModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveSuccess}
                    consultantId={selectedConsultantId}
                    scheduleId={editingScheduleId}
                />
            )}

            {isCopyModalOpen && (
                <CopyScheduleModal
                    isOpen={isCopyModalOpen}
                    onClose={handleCloseCopyModal}
                    onSuccess={handleCopySuccess}
                    sourceScheduleId={copyingScheduleId}
                />
            )}
        </div>
    );
};

export default WeeklyScheduleManagement; 