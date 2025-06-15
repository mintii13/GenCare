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
 * Validate slot time (must be at least 2 hours from now)
 */
export const validateSlotTime = (date: string, startTime: string): { isValid: boolean; error?: string } => {
  const slotDateTime = new Date(`${date}T${startTime}:00`);
  const now = new Date();
  
  if (isBefore(slotDateTime, now)) {
    return { isValid: false, error: 'Không thể chọn thời gian đã qua' };
  }

  const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 2) {
    return { isValid: false, error: 'Lịch hẹn phải được đặt trước ít nhất 2 giờ' };
  }

  return { isValid: true };
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