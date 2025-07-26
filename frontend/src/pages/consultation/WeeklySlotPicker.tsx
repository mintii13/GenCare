import React, { useState, useMemo } from 'react';
import { Calendar, Badge, Card, Row, Col, Button, Space, Alert, Spin, Empty, Tag, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';
import { validateSlotTime } from '../../utils/dateUtils';
import { log } from '../../utils/logger';
import toast from 'react-hot-toast';

interface Props {
  consultantId: string;
  onSlotSelect: (date: string, startTime: string, endTime: string) => void;
  selectedSlot?: { date: string; startTime: string; endTime: string } | null;
}

const WeeklySlotPicker: React.FC<Props> = ({ consultantId, onSlotSelect, selectedSlot }) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  
  const {
    currentWeek,
    weeklySlotData,
    loading,
    error,
    goToPreviousWeek,
    goToNextWeek,
    handleRetry
  } = useWeeklySchedule({
    consultantId,
    mode: 'slot-booking'
  });

  // Tạo time slots cho booking (7:00 - 18:00, mỗi 1 giờ)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour <= 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push({ 
        startTime, 
        endTime, 
        displayTime: `${hour}h-${hour + 1}h`,
        hour 
      });
    }
    return slots;
  }, []);

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    const validation = validateSlotTime(date, startTime);
    
    if (!validation.isValid) {
      toast.error(validation.error!);
      log.warn('WeeklySlotPicker', 'Slot validation failed', { date, startTime, error: validation.error });
      return;
    }

    log.info('WeeklySlotPicker', 'Slot selected', { date, startTime, endTime });
    onSlotSelect(date, startTime, endTime);
  };

  // Lấy thông tin slot cho một ngày cụ thể
  const getDaySlots = (date: Dayjs) => {
    const dateString = date.format('YYYY-MM-DD');
    const dayName = date.format('dddd').toLowerCase();
    const dayData = weeklySlotData?.days?.[dayName];
    
    if (!dayData || dayData.total_slots === 0) {
      return { isWorkingDay: false, slots: [] };
    }

    const slots = timeSlots.map(timeSlot => {
      const slotDateTime = dayjs(`${dateString}T${timeSlot.startTime}:00`);
      const now = dayjs();
      const diffHours = slotDateTime.diff(now, 'hour', true);
      const isPast = slotDateTime.isBefore(now);

      // Kiểm tra slot có available không
      const availableSlot = dayData.available_slots?.find((slot: any) =>
        slot.start_time === timeSlot.startTime && slot.is_available
      );

      // Kiểm tra slot có bị đặt không
      const isBooked = dayData.booked_appointments?.some((appt: any) =>
        appt.status !== 'cancelled' &&
        timeSlot.startTime >= appt.start_time &&
        timeSlot.startTime < appt.end_time
      );

      const isSelected = selectedSlot &&
        selectedSlot.date === dateString &&
        selectedSlot.startTime === timeSlot.startTime;

      let status: 'available' | 'booked' | 'past' | 'restricted' | 'selected' | 'unavailable' = 'unavailable';
      let disabled = true;

      if (isBooked) {
        status = 'booked';
      } else if (isPast) {
        status = 'past';
      } else if (!availableSlot) {
        status = 'unavailable';
      } else if (diffHours < 2) {
        status = 'restricted';
      } else if (isSelected) {
        status = 'selected';
        disabled = false;
      } else {
        status = 'available';
        disabled = false;
      }

      return {
        ...timeSlot,
        status,
        disabled,
        diffHours,
        onClick: () => !disabled && handleSlotSelect(dateString, timeSlot.startTime, timeSlot.endTime)
      };
    });

    return { isWorkingDay: true, slots };
  };



  // Tính toán số slot có thể đặt được
  const getBookableSlots = () => {
    if (!weeklySlotData?.days) return 0;
    
    let bookableCount = 0;
    const now = dayjs();
    
    Object.values(weeklySlotData.days).forEach((dayData: any) => {
      if (!dayData || dayData.total_slots === 0) return;
      
      timeSlots.forEach(timeSlot => {
        const slotDateTime = dayjs().hour(timeSlot.hour).minute(0).second(0);
        const diffHours = slotDateTime.diff(now, 'hour', true);
        
        if (diffHours >= 2) {
          const availableSlot = dayData.available_slots?.find((slot: any) =>
            slot.start_time === timeSlot.startTime && slot.is_available
          );
          
          const isBooked = dayData.booked_appointments?.some((appt: any) =>
            appt.status !== 'cancelled' &&
            timeSlot.startTime >= appt.start_time &&
            timeSlot.startTime < appt.end_time
          );
          
          if (availableSlot && !isBooked) {
            bookableCount++;
          }
        }
      });
    });
    
    return bookableCount;
  };

  const bookableSlots = getBookableSlots();

  if (loading) {
    return (
      <Card className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Đang tải lịch làm việc...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={error}
          />
          <Button type="primary" onClick={handleRetry} className="mt-4">
            Thử lại
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
              {/* Header với thông tin tổng quan */}
        <Card className="shadow-sm">
          <Row gutter={16} align="middle">
            <Col span={12}>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Lịch đặt lịch tư vấn
              </h3>
              <p className="text-sm text-gray-600">
                Chọn ngày và thời gian phù hợp để đặt lịch tư vấn
              </p>
            </Col>
            <Col span={12} className="text-right">
              <Space>
                <Tag color="blue">Ngày làm việc: {weeklySlotData?.summary?.total_working_days || 0}</Tag>
                <Tag color="green">Có thể đặt: {bookableSlots}</Tag>
                <Tag color="red">Đã đặt: {weeklySlotData?.summary?.total_booked_slots || 0}</Tag>
              </Space>
            </Col>
          </Row>
        </Card>

      {/* Quy tắc đặt lịch */}
 

              <Card className="shadow-sm">
          {/* Custom Weekly View */}
          <div className="space-y-4">
          {/* Week Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => {
                const newDate = selectedDate.subtract(1, 'week');
                setSelectedDate(newDate);
              }}
              className="text-white hover:text-blue-200"
            />
            
                         <div className="text-center">
               <h3 className="text-lg font-semibold">
                 Tuần {selectedDate.startOf('week').format('DD/MM/YYYY')} - {selectedDate.startOf('week').add(6, 'day').format('DD/MM/YYYY')}
               </h3>
               <p className="text-sm text-blue-100">
                 {selectedDate.format('MMMM YYYY')}
               </p>
             </div>
            
            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={() => {
                const newDate = selectedDate.add(1, 'week');
                setSelectedDate(newDate);
              }}
              className="text-white hover:text-blue-200"
            />
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((dayName, index) => (
              <div key={dayName} className="text-center py-2 bg-gray-50 rounded font-semibold text-gray-700">
                {dayName}
              </div>
            ))}
            
            {/* Day Cells */}
            {Array.from({ length: 7 }, (_, index) => {
              const dayDate = selectedDate.startOf('week').add(index, 'day');
              const daySlots = getDaySlots(dayDate);
              const isToday = dayDate.isSame(dayjs(), 'day');
              const isSelected = selectedDate.isSame(dayDate, 'day');
              
              return (
                                 <div
                   key={index}
                   className={`min-h-[200px] p-2 border rounded transition-all ${
                     isToday 
                       ? 'border-blue-500 bg-blue-50' 
                       : isSelected 
                         ? 'border-blue-300 bg-blue-100' 
                         : 'border-gray-200'
                   }`}
                 >
                   {/* Date Number */}
                   <div className={`text-center mb-2 ${
                     isToday ? 'text-blue-600 font-bold' : 'text-gray-700'
                   }`}>
                     {dayDate.format('DD')}
                     {isToday && <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">Hôm nay</span>}
                   </div>
                   
                   {/* Time Slots */}
                   <div className="space-y-1">
                     {!daySlots.isWorkingDay ? (
                       <div className="text-center py-2">
                         <Badge status="default" text="Nghỉ" />
                       </div>
                     ) : (
                       daySlots.slots.map((slot) => (
                         <Tooltip
                           key={slot.startTime}
                           title={
                             slot.status === 'available' ? `Đặt lịch ${slot.displayTime}` :
                             slot.status === 'booked' ? 'Đã được đặt' :
                             slot.status === 'past' ? 'Đã qua thời gian' :
                             slot.status === 'restricted' ? `Quá gấp (${slot.diffHours?.toFixed(1)}h)` :
                             slot.status === 'selected' ? 'Đã chọn' :
                             'Không khả dụng'
                           }
                         >
                           <Button
                             type={slot.status === 'selected' ? 'primary' : 'default'}
                             size="small"
                             block
                             disabled={slot.disabled}
                             onClick={(e) => {
                               e.stopPropagation();
                               if (!slot.disabled) {
                                 handleSlotSelect(
                                   dayDate.format('YYYY-MM-DD'),
                                   slot.startTime,
                                   slot.endTime
                                 );
                               }
                             }}
                             className={`text-xs h-6 ${
                               slot.status === 'available' ? 'border-green-500 text-green-600 hover:border-green-600 hover:bg-green-50' :
                               slot.status === 'booked' ? 'border-red-500 text-red-600 bg-red-50' :
                               slot.status === 'past' ? 'border-gray-400 text-gray-500 bg-gray-50' :
                               slot.status === 'restricted' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                               slot.status === 'selected' ? '' :
                               'border-gray-300 text-gray-400 bg-gray-50'
                             }`}
                             icon={
                               slot.status === 'selected' ? <CheckCircleOutlined /> :
                               slot.status === 'booked' ? <CloseCircleOutlined /> :
                               slot.status === 'past' ? <ClockCircleOutlined /> :
                               slot.status === 'restricted' ? <ExclamationCircleOutlined /> :
                               undefined
                             }
                           >
                             {slot.displayTime}
                           </Button>
                         </Tooltip>
                       ))
                     )}
                   </div>
                 </div>
              );
            })}
          </div>
        </div>
      </Card>

              {/* Legend */}
        <Card size="small" className="shadow-sm">
          <div className="text-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Chú thích trạng thái slot</h4>
          </div>
          <Row gutter={16} justify="center">
            <Col>
              <Space>
                <Badge status="success" text="Có thể đặt" />
                <Badge status="processing" text="Đã chọn" />
                <Badge status="error" text="Đã đặt" />
                <Badge status="warning" text="Quá gấp" />
                <Badge status="default" text="Không khả dụng" />
              </Space>
            </Col>
          </Row>
        </Card>
           <Alert
        message="Quy tắc đặt lịch hẹn"
        description={
          <div className="flex items-center justify-between text-sm">
            <span><ClockCircleOutlined className="mr-1" />Không thể đặt lịch trong quá khứ</span>
            <span><ExclamationCircleOutlined className="mr-1" />Đặt trước tối thiểu 2 giờ</span>
            <span><CheckCircleOutlined className="mr-1" />Click vào slot xanh để đặt lịch</span>
          </div>
        }
        type="info"
        showIcon
      />
    </div>
  );
};

export default WeeklySlotPicker;