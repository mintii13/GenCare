import { isSlotDisabled } from './dateUtils';

/**
 * Get slot status color classes
 */
export const getSlotStatusColor = (
  date: string, 
  startTime: string, 
  endTime: string, 
  isAvailable: boolean,
  isSelected: boolean = false,
  isBooked: boolean = false,
  isRestricted: boolean = false
): string => {
  if (isSelected) {
    return 'bg-blue-600 text-white border-blue-600';
  }
  
  if (isBooked) {
    return 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed';
  }
  
  if (isRestricted) {
    return 'bg-yellow-100 text-yellow-600 border-yellow-300 cursor-not-allowed';
  }
  
  if (!isAvailable) {
    return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
  }
  
  if (isSlotDisabled(date, startTime)) {
    return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
  }
  
  return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer';
};

/**
 * Check if slot is selected
 */
export const isSlotSelected = (
  date: string, 
  startTime: string, 
  endTime: string,
  selectedSlot?: { date: string; startTime: string; endTime: string } | null
): boolean => {
  return selectedSlot?.date === date && 
         selectedSlot?.startTime === startTime && 
         selectedSlot?.endTime === endTime;
};

/**
 * Get appointment status color
 */
export const getAppointmentStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'confirmed': 'bg-blue-100 text-blue-800 border-blue-200', 
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200'
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get appointment status label
 */
export const getAppointmentStatusLabel = (status: string): string => {
  const statusLabels: { [key: string]: string } = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận', 
    'completed': 'Đã hoàn thành',
    'cancelled': 'Đã hủy'
  };
  
  return statusLabels[status] || status;
};

/**
 * Check if slot can be clicked/selected
 * Now allows all available slots to be clickable, validation happens on click
 */
export const canSelectSlot = (date: string, startTime: string, isAvailable: boolean): boolean => {
  return isAvailable; // Allow all available slots to be clickable
};