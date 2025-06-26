import React, { useState, useEffect, useCallback } from 'react';
import { weeklyScheduleService } from '@/services/weeklyScheduleService';
import { IWeeklySchedule, IWorkingDay } from '@/types/weeklySchedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId?: string | null;
  consultantId: string;
  onSave: () => void;
}

const dayNames: (keyof IWeeklySchedule['working_days'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels: { [key: string]: string } = {
  monday: 'Thứ 2',
  tuesday: 'Thứ 3',
  wednesday: 'Thứ 4',
  thursday: 'Thứ 5',
  friday: 'Thứ 6',
  saturday: 'Thứ 7',
  sunday: 'Chủ Nhật',
};

const defaultWorkingDay: IWorkingDay = {
    start_time: "08:00",
    end_time: "17:00",
    break_start: "12:00",
    break_end: "13:00",
    is_available: false,
};

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({ isOpen, onClose, scheduleId, consultantId, onSave }) => {
    const [schedule, setSchedule] = useState<Partial<IWeeklySchedule>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initializeNewSchedule = () => {
        const working_days: any = {};
        dayNames.forEach(day => {
            working_days[day] = { ...defaultWorkingDay };
        });
        setSchedule({
            consultant_id: consultantId,
            week_start_date: '',
            notes: '',
            working_days,
            default_slot_duration: 30
        });
    };
    
    const fetchScheduleDetails = useCallback(async () => {
        if (!scheduleId) {
            initializeNewSchedule();
            return;
        }
        setLoading(true);
        try {
            const response = await weeklyScheduleService.getScheduleById(scheduleId);
            if (response.success && response.data.schedule) {
                const fetchedSchedule = response.data.schedule;
                // Ensure week_start_date is in 'yyyy-MM-dd' format for the input
                fetchedSchedule.week_start_date = format(parseISO(fetchedSchedule.week_start_date), 'yyyy-MM-dd');
                setSchedule(fetchedSchedule);
            } else {
                toast.error("Không thể tải chi tiết lịch.");
                setError("Lỗi tải dữ liệu.");
            }
        } catch (error: any) {
            console.error('Error fetching schedule:', error.response?.data || error);
            toast.error('Không thể tải lịch làm việc');
            setError("Lỗi hệ thống.");
        } finally {
            setLoading(false);
        }
    }, [scheduleId, consultantId]);

    useEffect(() => {
        if (isOpen) {
            fetchScheduleDetails();
        } else {
            // Reset state when modal is closed
            setSchedule({});
            setError(null);
        }
    }, [isOpen, fetchScheduleDetails]);

    const handleDayChange = (day: keyof IWeeklySchedule['working_days'], field: keyof IWorkingDay, value: string | boolean) => {
        setSchedule((prev) => {
            const newWorkingDays = { ...prev.working_days };
            newWorkingDays[day] = {
                ...(newWorkingDays[day] as IWorkingDay),
                [field]: value
            };
            return { ...prev, working_days: newWorkingDays };
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSchedule((prev: Partial<IWeeklySchedule>) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // ---------------- Client-side validation ----------------
        if (!schedule.week_start_date) {
            toast.error("Vui lòng chọn ngày bắt đầu tuần.");
            return;
        }

        // Week start date must be Monday (getDay() === 1)
        if (new Date(schedule.week_start_date).getDay() !== 1) {
            toast.error("Ngày bắt đầu tuần phải là Thứ 2.");
            return;
        }

        // Validate default slot duration
        const slotDur = Number(schedule.default_slot_duration) || 30;
        if (slotDur < 15 || slotDur > 120) {
            toast.error("Thời lượng mỗi slot phải từ 15 đến 120 phút.");
            return;
        }

        // Validate working days timing
        const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
        for (const day of days) {
            const wd = (schedule.working_days as any)?.[day] as IWorkingDay | undefined;
            if (!wd || !wd.is_available) continue;

            const [sh, sm] = wd.start_time.split(':').map(Number);
            const [eh, em] = wd.end_time.split(':').map(Number);
            if (sh*60+sm >= eh*60+em) {
                toast.error(`Ngày ${dayLabels[day]}: giờ bắt đầu phải trước giờ kết thúc.`);
                return;
            }

            if ((wd.break_start && !wd.break_end) || (!wd.break_start && wd.break_end)) {
                toast.error(`Ngày ${dayLabels[day]}: phải điền đủ thời gian nghỉ bắt đầu và kết thúc.`);
                return;
            }

            if (wd.break_start && wd.break_end) {
                const [bh, bm] = wd.break_start.split(':').map(Number);
                const [beH, beM] = wd.break_end.split(':').map(Number);
                const bStart = bh*60+bm, bEnd = beH*60+beM;
                const wStart = sh*60+sm, wEnd = eh*60+em;
                if (bStart >= bEnd || bStart < wStart || bEnd > wEnd) {
                    toast.error(`Ngày ${dayLabels[day]}: thời gian nghỉ phải nằm trong giờ làm và bắt đầu trước khi kết thúc.`);
                    return;
                }
            }
        }
        //--------------------------------------------------------------------

        setLoading(true);
        setError(null);
        try {
            let response;
            
            if (scheduleId) {
                // Create a clean payload with only the fields allowed by the backend update schema.
                // This is crucial to prevent validation errors for fields like `_id` in sub-documents.
                const cleanWorkingDays: { [key: string]: any } = {};
                if (schedule.working_days) {
                    Object.entries(schedule.working_days).forEach(([day, dayData]) => {
                        const { _id, ...rest } = dayData as IWorkingDay & { _id?: string };
                        cleanWorkingDays[day] = rest;
                    });
                }

                const payloadUpdate = {
                    week_start_date: schedule.week_start_date,
                    notes: schedule.notes,
                    default_slot_duration: schedule.default_slot_duration,
                    working_days: cleanWorkingDays,
                };
                
                response = await weeklyScheduleService.updateSchedule(scheduleId, payloadUpdate);
            } else {
                // Create: needs consultant_id
                const payloadCreate = {
                    ...schedule,
                    consultant_id: consultantId,
                    week_start_date: schedule.week_start_date,
                    default_slot_duration: Number(schedule.default_slot_duration) || 30,
                } as IWeeklySchedule;
                response = await weeklyScheduleService.createSchedule(payloadCreate);
            }

            if (response.success) {
                onSave();
            } else {
                toast.error(response.message || 'Lưu lịch thất bại.');
                setError(response.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.details || err.response?.data?.message || 'Lỗi hệ thống khi lưu lịch.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
            <h2 className="text-xl font-bold">
                {scheduleId ? 'Chỉnh sửa Lịch làm việc' : 'Tạo Lịch làm việc mới'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        {loading ? (
            <div className="p-6 text-center">Đang tải...</div>
        ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
        ) : (
            <form className="flex-grow overflow-y-auto p-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <Label htmlFor="week_start_date">Ngày bắt đầu tuần (Thứ 2)</Label>
                        <Input 
                            type="date"
                            id="week_start_date"
                            name="week_start_date"
                            value={schedule.week_start_date || ''}
                            onChange={handleInputChange}
                            required
                            disabled={!!scheduleId}
                        />
                        {scheduleId && <p className="text-xs text-gray-500 mt-1">Không thể thay đổi tuần khi đang chỉnh sửa. Dùng chức năng Sao chép để tạo lịch cho tuần mới.</p>}
                    </div>
                    <div>
                        <Label htmlFor="default_slot_duration">Thời lượng mỗi slot (phút)</Label>
                        <Input 
                            type="number"
                            id="default_slot_duration"
                            name="default_slot_duration"
                            value={schedule.default_slot_duration || 30}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {dayNames.map(day => (
                        <div key={day} className="p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center mb-2">
                                <input 
                                    type="checkbox"
                                    className="form-checkbox h-5 w-5 text-primary-600 rounded"
                                    id={`${day}_is_available`}
                                    checked={schedule.working_days?.[day]?.is_available || false}
                                    onChange={(e) => handleDayChange(day, 'is_available', e.target.checked)}
                                />
                                <Label htmlFor={`${day}_is_available`} className="ml-2 font-bold text-lg">{dayLabels[day]}</Label>
                            </div>
                            {schedule.working_days?.[day]?.is_available && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 pl-6">
                                    <div>
                                        <Label htmlFor={`${day}_start_time`}>Bắt đầu</Label>
                                        <Input type="time" id={`${day}_start_time`} value={schedule.working_days?.[day]?.start_time} onChange={e => handleDayChange(day, 'start_time', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`${day}_end_time`}>Kết thúc</Label>
                                        <Input type="time" id={`${day}_end_time`} value={schedule.working_days?.[day]?.end_time} onChange={e => handleDayChange(day, 'end_time', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`${day}_break_start`}>Nghỉ (từ)</Label>
                                        <Input type="time" id={`${day}_break_start`} value={schedule.working_days?.[day]?.break_start || ''} onChange={e => handleDayChange(day, 'break_start', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor={`${day}_break_end`}>Nghỉ (đến)</Label>
                                        <Input type="time" id={`${day}_break_end`} value={schedule.working_days?.[day]?.break_end || ''} onChange={e => handleDayChange(day, 'break_end', e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="mt-4">
                    <Label htmlFor="notes">Ghi chú</Label>
                    <textarea 
                        id="notes" 
                        name="notes"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={schedule.notes || ''}
                        onChange={handleInputChange}
                        placeholder="Thêm ghi chú cho tuần làm việc này..."
                        rows={3}
                    />
                </div>
            </form>
        )}

        <div className="flex justify-end space-x-4 p-4 border-t bg-gray-50">
            <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
            <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditModal;