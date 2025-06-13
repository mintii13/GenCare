import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, addHours, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../../contexts/AuthContext';

interface WorkingDay {
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_available: boolean;
}

interface Schedule {
  _id: string;
  consultant_id: string;
  week_start_date: string;
  week_end_date: string;
  working_days: {
    monday?: WorkingDay;
    tuesday?: WorkingDay;
    wednesday?: WorkingDay;
    thursday?: WorkingDay;
    friday?: WorkingDay;
    saturday?: WorkingDay;
    sunday?: WorkingDay;
  };
  default_slot_duration: number;
  notes?: string;
  created_by: {
    user_id: string;
    role: string;
    name: string;
  };
  created_date: string;
  updated_date: string;
}

interface Appointment {
  _id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  consultant_id: {
    _id: string;
    specialization: string;
    user_id: {
      full_name: string;
    };
  };
  customer_notes?: string;
  consultant_notes?: string;
  created_date: string;
}

const WeeklyCalendarView: React.FC = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Mock data for testing - remove in production
  const [useMockData, setUseMockData] = useState(false); // Disabled to use real API
  const [loading, setLoading] = useState(false);

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Time slots (9 AM to 6 PM, 60-minute slots)
  const timeSlots = Array.from({ length: 9 }, (_, i) => {
    const hour = 9 + i;
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour}:00`,
      hour: hour
    };
  });

  useEffect(() => {
    console.log('🔍 WeeklyCalendarView mounted');
    console.log('👤 Current user:', user);
    console.log('📅 Current week:', format(currentWeek, 'yyyy-MM-dd'));
    
    if (!user) {
      console.warn('⚠️ No user found, may need to login');
      return;
    }
    
    if (user.role !== 'consultant') {
      console.warn('⚠️ User is not a consultant:', user.role);
      return;
    }
    
    fetchWeekData();
  }, [currentWeek, user]);

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      if (useMockData) {
        // Load mock data for testing
        loadMockData();
      } else {
        await Promise.all([
          fetchScheduleForWeek(),
          fetchAppointmentsForWeek()
        ]);
      }
    } catch (error) {
      console.error('Error fetching week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    console.log('📊 Loading mock data for testing');
    
    // Mock schedule
    const mockSchedule: Schedule = {
      _id: 'mock-schedule',
      consultant_id: 'mock-consultant',
      week_start_date: format(currentWeek, 'yyyy-MM-dd'),
      week_end_date: format(addDays(currentWeek, 6), 'yyyy-MM-dd'),
      working_days: {
        monday: { start_time: '09:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', is_available: true },
        tuesday: { start_time: '09:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', is_available: true },
        wednesday: { start_time: '09:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', is_available: true },
        thursday: { start_time: '09:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', is_available: true },
        friday: { start_time: '09:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', is_available: true },
        saturday: { start_time: '09:00', end_time: '15:00', is_available: true },
        sunday: { start_time: '00:00', end_time: '00:00', is_available: false }
      },
      default_slot_duration: 60,
      notes: 'Mock schedule for testing',
      created_by: { user_id: 'mock-user', role: 'staff', name: 'Mock Staff' },
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    // Mock appointments
    const mockAppointments: Appointment[] = [
      {
        _id: 'mock-appointment-1',
        appointment_date: format(addDays(currentWeek, 1), 'yyyy-MM-dd'), // Tuesday
        start_time: '10:00',
        end_time: '11:00',
        status: 'confirmed',
        customer_id: {
          _id: 'mock-customer-1',
          full_name: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          phone: '0123456789'
        },
        consultant_id: {
          _id: 'mock-consultant',
          specialization: 'Tư vấn sức khỏe',
          user_id: {
            full_name: 'BS. Nguyễn Thị Lan'
          }
        },
        customer_notes: 'Tư vấn về chế độ ăn uống',
        created_date: new Date().toISOString()
      },
      {
        _id: 'mock-appointment-2',
        appointment_date: format(addDays(currentWeek, 2), 'yyyy-MM-dd'), // Wednesday
        start_time: '14:00',
        end_time: '15:00',
        status: 'pending',
        customer_id: {
          _id: 'mock-customer-2',
          full_name: 'Trần Thị B',
          email: 'tranthib@example.com',
          phone: '0987654321'
        },
        consultant_id: {
          _id: 'mock-consultant',
          specialization: 'Tư vấn sức khỏe',
          user_id: {
            full_name: 'BS. Nguyễn Thị Lan'
          }
        },
        customer_notes: 'Kiểm tra sức khỏe định kỳ',
        created_date: new Date().toISOString()
      },
      {
        _id: 'mock-appointment-3',
        appointment_date: format(addDays(currentWeek, 4), 'yyyy-MM-dd'), // Friday
        start_time: '15:00',
        end_time: '16:00',
        status: 'confirmed',
        customer_id: {
          _id: 'mock-customer-3',
          full_name: 'Lê Văn C',
          email: 'levanc@example.com',
          phone: '0369852147'
        },
        consultant_id: {
          _id: 'mock-consultant',
          specialization: 'Tư vấn sức khỏe',
          user_id: {
            full_name: 'BS. Nguyễn Thị Lan'
          }
        },
        customer_notes: 'Tư vấn về tập thể dục',
        created_date: new Date().toISOString()
      }
    ];

    setSchedule(mockSchedule);
    setAppointments(mockAppointments);
    console.log('✅ Mock data loaded successfully');
  };

  const fetchScheduleForWeek = async () => {
    try {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'accessToken');
      const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
      
      console.log('📅 Fetching schedule for week:', weekStartDate);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      console.log('🌐 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
      
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/weekly-schedule/my-schedules?start_date=${weekStartDate}&end_date=${weekStartDate}`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Schedule Response status:', response.status);
      console.log('📊 Schedule Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Schedule API Error:', response.status, errorText);
        setSchedule(null);
        return;
      }

      const data = await response.json();
      console.log('📊 Schedule Response data:', data);
      
      if (data.success && data.data && data.data.schedules && data.data.schedules.length > 0) {
        const targetWeekStart = format(currentWeek, 'yyyy-MM-dd');
        const matchingSchedule = data.data.schedules.find((schedule: Schedule) => {
          const scheduleWeekStart = format(new Date(schedule.week_start_date), 'yyyy-MM-dd');
          return scheduleWeekStart === targetWeekStart;
        });

        console.log('✅ Found matching schedule:', matchingSchedule);
        setSchedule(matchingSchedule || null);
      } else {
        console.log('ℹ️ No schedules found for this week');
        setSchedule(null);
      }
    } catch (error) {
      console.error('❌ Error fetching schedule:', error);
      setSchedule(null);
    }
  };

  const fetchAppointmentsForWeek = async () => {
    try {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'accessToken');
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
      
      console.log('📅 Fetching appointments for week:', weekStart, 'to', weekEnd);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const url = `${baseUrl}/appointments/consultant-appointments?start_date=${weekStart}&end_date=${weekEnd}`;
      console.log('🌐 Base URL from env:', import.meta.env.VITE_API_URL);
      console.log('🌐 Final base URL:', baseUrl);
      console.log('📡 Fetching appointments from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Appointments Response status:', response.status);
      console.log('📊 Appointments Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Appointments API Error:', response.status, errorText);
        setAppointments([]);
        return;
      }

      const data = await response.json();
      console.log('📊 Appointments Response data:', data);
      
      if (data.success && data.data) {
        console.log('✅ Found appointments:', data.data.appointments?.length || 0);
        setAppointments(data.data.appointments || []);
      } else {
        console.log('ℹ️ No appointments found for this week');
        setAppointments([]);
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      setAppointments([]);
    }
  };

  const getDayWorkingHours = (dayName: string) => {
    if (!schedule || !schedule.working_days[dayName as keyof typeof schedule.working_days]) {
      return null;
    }
    
    const dayData = schedule.working_days[dayName as keyof typeof schedule.working_days];
    if (!dayData?.is_available) {
      return null;
    }

    return {
      start: parseInt(dayData.start_time.split(':')[0]),
      end: parseInt(dayData.end_time.split(':')[0]),
      breakStart: dayData.break_start ? parseInt(dayData.break_start.split(':')[0]) : null,
      breakEnd: dayData.break_end ? parseInt(dayData.break_end.split(':')[0]) : null,
    };
  };

  const getAppointmentsForTimeSlot = (dayDate: Date, hour: number) => {
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.appointment_date);
      const appointmentHour = parseInt(appointment.start_time.split(':')[0]);
      
      return isSameDay(appointmentDate, dayDate) && appointmentHour === hour;
    });
  };

  const getSlotStatus = (dayName: string, dayDate: Date, hour: number) => {
    const workingHours = getDayWorkingHours(dayName);
    const slotAppointments = getAppointmentsForTimeSlot(dayDate, hour);
    
    if (!workingHours) {
      return { type: 'not-available', label: 'Không làm việc' };
    }

    if (hour < workingHours.start || hour >= workingHours.end) {
      return { type: 'outside-hours', label: 'Ngoài giờ làm việc' };
    }

    if (workingHours.breakStart && workingHours.breakEnd && 
        hour >= workingHours.breakStart && hour < workingHours.breakEnd) {
      return { type: 'break-time', label: 'Giờ nghỉ' };
    }

    if (slotAppointments.length > 0) {
      return { 
        type: 'appointment', 
        label: 'Có cuộc hẹn',
        appointments: slotAppointments
      };
    }

    return { type: 'available', label: 'Có thể đặt lịch' };
  };

  const getSlotColor = (status: any) => {
    switch (status.type) {
      case 'not-available':
        return 'bg-gray-100 text-gray-400';
      case 'outside-hours':
        return 'bg-gray-50 text-gray-300';
      case 'break-time':
        return 'bg-yellow-50 text-yellow-600 border border-yellow-200';
      case 'appointment':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'available':
        return 'bg-green-50 text-green-700 border border-green-200';
      default:
        return 'bg-gray-100';
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải lịch làm việc...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            📅 Lịch Làm Việc Hàng Tuần
          </h1>
          <p className="text-gray-600">
            Xem lịch làm việc và cuộc hẹn tư vấn trong tuần
          </p>
                      {/* Debug Info */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Debug Info:</strong> 
                  Schedule: {schedule ? '✅ Loaded' : '❌ No data'} | 
                  Appointments: {appointments.length} found | 
                  User: {user?.role || 'Unknown role'}
                </div>
                <button
                  onClick={() => setUseMockData(!useMockData)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    useMockData 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {useMockData ? '🎭 Mock Data ON' : '🎭 Mock Data OFF'}
                </button>
              </div>
            </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePreviousWeek}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                Hôm nay
              </button>
              
              <button
                onClick={handleNextWeek}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {format(currentWeek, 'dd/MM')} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy')}
              </h3>
              <p className="text-sm text-gray-600">
                {schedule ? 'Có lịch làm việc' : 'Chưa có lịch làm việc'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button className="px-3 py-1 bg-white rounded text-sm font-medium shadow-sm">
                  Tuần
                </button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                  Tháng
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Calendar Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header with days */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-20 p-4 text-left text-sm font-medium text-gray-500 border-r">
                    Thời gian
                  </th>
                  {dayNames.map((dayName, index) => {
                    const dayDate = addDays(currentWeek, index);
                    const isToday = isSameDay(dayDate, new Date());
                    
                    return (
                      <th 
                        key={dayName} 
                        className={`p-4 text-center text-sm font-medium border-r last:border-r-0 ${
                          isToday ? 'bg-blue-50 text-blue-800' : 'text-gray-500'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-semibold">{dayLabels[index]}</div>
                          <div className={`text-lg ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                            {format(dayDate, 'dd')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(dayDate, 'MMM', { locale: vi })}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Time slots */}
              <tbody>
                {timeSlots.map((timeSlot) => (
                  <tr key={timeSlot.time} className="border-t">
                    {/* Time column */}
                    <td className="w-20 p-4 text-right text-sm font-medium text-gray-500 border-r bg-gray-50">
                      {timeSlot.label}
                    </td>
                    
                    {/* Day columns */}
                    {dayNames.map((dayName, dayIndex) => {
                      const dayDate = addDays(currentWeek, dayIndex);
                      const slotStatus = getSlotStatus(dayName, dayDate, timeSlot.hour);
                      const slotColor = getSlotColor(slotStatus);
                      
                      return (
                        <td 
                          key={`${dayName}-${timeSlot.time}`}
                          className={`p-2 h-16 border-r last:border-r-0 relative ${slotColor}`}
                        >
                          {slotStatus.type === 'appointment' && slotStatus.appointments ? (
                            <div className="space-y-1">
                              {slotStatus.appointments.map((appointment: Appointment) => (
                                <div 
                                  key={appointment._id}
                                  className="bg-blue-500 text-white text-xs rounded px-2 py-1 truncate cursor-pointer hover:bg-blue-600"
                                                                     title={`${appointment.customer_id.full_name}\n${appointment.start_time} - ${appointment.end_time}\nTrạng thái: ${appointment.status}`}
                                 >
                                   <div className="font-medium truncate">
                                     {appointment.customer_id.full_name}
                                  </div>
                                  <div className="text-xs opacity-90">
                                    {appointment.start_time} - {appointment.end_time}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : slotStatus.type === 'break-time' ? (
                            <div className="text-center text-xs">
                              ☕ Nghỉ trưa
                            </div>
                          ) : slotStatus.type === 'available' ? (
                            <div className="text-center text-xs opacity-60">
                              Trống
                            </div>
                          ) : slotStatus.type === 'outside-hours' ? (
                            <div className="text-center text-xs opacity-40">
                              -
                            </div>
                          ) : (
                            <div className="text-center text-xs opacity-40">
                              Không làm việc
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Chú thích:</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span>Có thể đặt lịch</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Có cuộc hẹn</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span>Giờ nghỉ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>Không làm việc</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendarView; 