interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface AppointmentData {
  consultant_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  customer_notes?: string;
}

interface GuestInfo {
  full_name: string;
  email: string;
  phone: string;
}

export class AppointmentValidation {
  /**
   * Validate basic appointment data
   */
  static validateAppointmentData(data: AppointmentData): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    if (!data.consultant_id?.trim()) {
      errors.push('Vui lòng chọn chuyên gia');
    }

    if (!data.appointment_date?.trim()) {
      errors.push('Vui lòng chọn ngày hẹn');
    }

    if (!data.start_time?.trim()) {
      errors.push('Vui lòng chọn thời gian bắt đầu');
    }

    if (!data.end_time?.trim()) {
      errors.push('Vui lòng chọn thời gian kết thúc');
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (data.start_time && !timeRegex.test(data.start_time)) {
      errors.push('Định dạng thời gian bắt đầu không hợp lệ');
    }

    if (data.end_time && !timeRegex.test(data.end_time)) {
      errors.push('Định dạng thời gian kết thúc không hợp lệ');
    }

    // Validate start time < end time
    if (data.start_time && data.end_time) {
      const [startHour, startMin] = data.start_time.split(':').map(Number);
      const [endHour, endMin] = data.end_time.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        errors.push('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      // Check minimum duration (15 minutes)
      if (endMinutes - startMinutes < 15) {
        errors.push('Thời gian tư vấn tối thiểu 15 phút');
      }

      // Check maximum duration (4 hours)
      if (endMinutes - startMinutes > 240) {
        errors.push('Thời gian tư vấn tối đa 4 tiếng');
      }
    }

    // Validate customer notes length
    if (data.customer_notes && data.customer_notes.length > 500) {
      errors.push('Ghi chú không được vượt quá 500 ký tự');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate guest information
   */
  static validateGuestInfo(guestInfo: GuestInfo): ValidationResult {
    const errors: string[] = [];

    // Full name validation
    if (!guestInfo.full_name?.trim()) {
      errors.push('Vui lòng nhập họ và tên');
    } else if (guestInfo.full_name.trim().length < 2) {
      errors.push('Họ và tên phải có ít nhất 2 ký tự');
    } else if (guestInfo.full_name.trim().length > 100) {
      errors.push('Họ và tên không được vượt quá 100 ký tự');
    }

    // Email validation
    if (!guestInfo.email?.trim()) {
      errors.push('Vui lòng nhập địa chỉ email');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestInfo.email.trim())) {
        errors.push('Địa chỉ email không hợp lệ');
      }
    }

    // Phone validation
    if (!guestInfo.phone?.trim()) {
      errors.push('Vui lòng nhập số điện thoại');
    } else {
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
      const cleanPhone = guestInfo.phone.replace(/[\s\-()]/g, '');
      
      if (!phoneRegex.test(guestInfo.phone) || cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.push('Số điện thoại không hợp lệ (10-11 số)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate lead time (must be at least 2 hours in advance)
   */
  static validateLeadTime(appointmentDate: string, startTime: string): ValidationResult {
    const errors: string[] = [];

    try {
      const appointmentDateTime = new Date(`${appointmentDate}T${startTime}:00`);
      const now = new Date();
      
      // Check if appointment is in the past
      if (appointmentDateTime <= now) {
        errors.push('Không thể đặt lịch trong quá khứ');
        return { isValid: false, errors };
      }

      // Check 2-hour lead time
      const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < 2) {
        errors.push(`Lịch hẹn phải được đặt trước ít nhất 2 giờ. Hiện tại: ${diffHours.toFixed(1)} giờ`);
      }

      // Check if appointment is too far in future (e.g., 3 months)
      const maxDays = 90;
      const diffDays = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > maxDays) {
        errors.push(`Không thể đặt lịch quá xa (tối đa ${maxDays} ngày)`);
      }

    } catch (error) {
      errors.push('Ngày hoặc giờ không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate if selected date is a working day and time is within working hours
   */
  static validateWorkingHours(
    appointmentDate: string, 
    startTime: string, 
    endTime: string,
    workingHours?: {
      start_time: string;
      end_time: string;
      break_start?: string;
      break_end?: string;
    }
  ): ValidationResult {
    const errors: string[] = [];

    if (!workingHours) {
      errors.push('Chuyên gia không làm việc vào ngày này');
      return { isValid: false, errors };
    }

    const parseTime = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const appointmentStart = parseTime(startTime);
    const appointmentEnd = parseTime(endTime);
    const workStart = parseTime(workingHours.start_time);
    const workEnd = parseTime(workingHours.end_time);

    // Check if appointment is within working hours
    if (appointmentStart < workStart || appointmentEnd > workEnd) {
      errors.push(`Thời gian phải trong khung giờ làm việc: ${workingHours.start_time} - ${workingHours.end_time}`);
    }

    // Check if appointment conflicts with break time
    if (workingHours.break_start && workingHours.break_end) {
      const breakStart = parseTime(workingHours.break_start);
      const breakEnd = parseTime(workingHours.break_end);

      // Check if appointment overlaps with break
      if (appointmentStart < breakEnd && appointmentEnd > breakStart) {
        errors.push(`Không thể đặt lịch trong giờ nghỉ: ${workingHours.break_start} - ${workingHours.break_end}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Complete validation for appointment booking
   */
  static validateCompleteBooking(
    appointmentData: AppointmentData,
    guestInfo?: GuestInfo,
    workingHours?: {
      start_time: string;
      end_time: string;
      break_start?: string;
      break_end?: string;
    }
  ): ValidationResult {
    const allErrors: string[] = [];

    // Validate basic appointment data
    const appointmentValidation = this.validateAppointmentData(appointmentData);
    allErrors.push(...appointmentValidation.errors);

    // Validate guest info if provided
    if (guestInfo) {
      const guestValidation = this.validateGuestInfo(guestInfo);
      allErrors.push(...guestValidation.errors);
    }

    // Validate lead time
    if (appointmentData.appointment_date && appointmentData.start_time) {
      const leadTimeValidation = this.validateLeadTime(appointmentData.appointment_date, appointmentData.start_time);
      allErrors.push(...leadTimeValidation.errors);
    }

    // Validate working hours
    if (appointmentData.appointment_date && appointmentData.start_time && appointmentData.end_time) {
      const workingHoursValidation = this.validateWorkingHours(
        appointmentData.appointment_date,
        appointmentData.start_time,
        appointmentData.end_time,
        workingHours
      );
      allErrors.push(...workingHoursValidation.errors);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }
}

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
};

/**
 * Check if time slot conflicts with existing appointments
 */
export const checkTimeSlotConflict = (
  startTime: string,
  endTime: string,
  existingAppointments: Array<{ start_time: string; end_time: string; status: string }>
): boolean => {
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const newStart = parseTime(startTime);
  const newEnd = parseTime(endTime);

  return existingAppointments
    .filter(apt => apt.status !== 'cancelled') // Ignore cancelled appointments
    .some(apt => {
      const existingStart = parseTime(apt.start_time);
      const existingEnd = parseTime(apt.end_time);
      
      // Check if time slots overlap
      return newStart < existingEnd && newEnd > existingStart;
    });
}; 