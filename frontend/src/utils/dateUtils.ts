import { format, startOfWeek, addDays, addWeeks, subWeeks, isBefore, isAfter, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format date for display
 */
export const formatDateDisplay = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM', { locale: vi });
};

/**
 * Format date for full display
 */
export const formatFullDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
};

/**
 * Get Monday of the week containing the given date
 */
export const getMonday = (dateStr: string): string => {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

/**
 * Get week start date (Monday)
 */
export const getWeekStart = (date: Date = new Date()): Date => {
  return startOfWeek(date, { weekStartsOn: 1 });
};

/**
 * Get current week label for display
 */
export const getCurrentWeekLabel = (currentWeek: Date): string => {
  const weekStart = format(currentWeek, 'dd/MM');
  const weekEnd = format(addDays(currentWeek, 6), 'dd/MM/yyyy');
  return `Tuần ${weekStart} - ${weekEnd}`;
};

/**
 * Check if can navigate to previous week
 */
export const canNavigateToPreviousWeek = (currentWeek: Date): boolean => {
  const oneWeekAgo = subWeeks(new Date(), 1);
  return isAfter(currentWeek, oneWeekAgo);
};

/**
 * Check if slot is disabled based on time
 */
export const isSlotDisabled = (date: string, startTime: string): boolean => {
  const slotDateTime = new Date(`${date}T${startTime}:00`);
  const now = new Date();
  
  // Disable past slots
  if (isBefore(slotDateTime, now)) {
    return true;
  }

  // Disable slots less than 2 hours from now
  const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours < 2;
};

/**
 * Validate slot time (comprehensive validation with detailed error messages)
 */
export const validateSlotTime = (date: string, startTime: string): { isValid: boolean; error?: string; severity?: 'error' | 'warning' } => {
  const slotDateTime = new Date(`${date}T${startTime}:00`);
  const now = new Date();
  
  // Check if slot is in the past
  if (isBefore(slotDateTime, now)) {
    return { 
      isValid: false, 
      error: 'Không thể chọn thời gian đã qua',
      severity: 'error'
    };
  }

  const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const diffMinutes = (slotDateTime.getTime() - now.getTime()) / (1000 * 60);
  
  // Check if slot is too close (less than 30 minutes)
  if (diffMinutes < 30) {
    return { 
      isValid: false, 
      error: `Slot quá gần (chỉ còn ${diffMinutes.toFixed(0)} phút). Cần ít nhất 30 phút để chuẩn bị.`,
      severity: 'error'
    };
  }
  
  // Check if slot is within restricted time (less than 2 hours)
  if (diffHours < 2) {
    return { 
      isValid: false, 
      error: `Lịch hẹn phải được đặt trước ít nhất 2 giờ (hiện tại: ${diffHours.toFixed(1)} giờ)`,
      severity: 'warning'
    };
  }

  return { isValid: true };
};

/**
 * Get slot status for UI display
 */
export const getSlotStatus = (date: string, startTime: string, endTime: string): {
  status: 'available' | 'restricted' | 'severely-restricted' | 'past' | 'unavailable';
  isClickable: boolean;
  displayText: string;
  tooltipText: string;
  cssClass: string;
} => {
  const slotDateTime = new Date(`${date}T${startTime}:00`);
  const now = new Date();
  const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const diffMinutes = (slotDateTime.getTime() - now.getTime()) / (1000 * 60);
  
  if (slotDateTime <= now) {
    return {
      status: 'past',
      isClickable: false,
      displayText: 'Đã qua',
      tooltipText: `Slot ${startTime} - ${endTime} đã qua thời gian`,
      cssClass: 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
    };
  }
  
  if (diffMinutes < 30) {
    return {
      status: 'severely-restricted',
      isClickable: false,
      displayText: 'Quá gấp',
      tooltipText: `Slot ${startTime} - ${endTime} quá gần (còn ${diffMinutes.toFixed(0)} phút)`,
      cssClass: 'bg-red-50 text-red-500 border-red-300 cursor-not-allowed opacity-70 border-dashed'
    };
  }
  
  if (diffHours < 2) {
    return {
      status: 'restricted',
      isClickable: true,
      displayText: 'Hạn chế',
      tooltipText: `Slot ${startTime} - ${endTime} chỉ còn ${diffHours.toFixed(1)} giờ nữa (tối thiểu 2 giờ)`,
      cssClass: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 cursor-pointer transform hover:scale-102 border-dashed'
    };
  }
  
  return {
    status: 'available',
    isClickable: true,
    displayText: 'Có thể đặt',
    tooltipText: `Slot ${startTime} - ${endTime} sẵn sàng để đặt`,
    cssClass: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 cursor-pointer transform hover:scale-105 hover:shadow-md hover:border-green-300'
  };
};

/**
 * Format week range for display
 */
export const formatWeekRange = (weekStartDate: string, weekEndDate: string): string => {
  return `${format(new Date(weekStartDate), 'dd/MM/yyyy')} - ${format(new Date(weekEndDate), 'dd/MM/yyyy')}`;
};

/**
 * Get week start and end dates
 */
export const getWeekRange = (currentWeek: Date): { weekStart: string; weekEnd: string } => {
  const weekStart = format(currentWeek, 'yyyy-MM-dd');
  const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
  return { weekStart, weekEnd };
};