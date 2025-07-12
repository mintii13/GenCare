import { appointmentService } from './appointmentService';

export class AutoConfirmService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static readonly CHECK_INTERVAL = 15 * 60 * 1000; // 5 phút kiểm tra 1 lần
  private static readonly AUTO_CONFIRM_THRESHOLD = 30 * 60 * 1000; // 30 phút trước giờ hẹn

  /**
   * Bắt đầu service tự động xác nhận
   */
  public static start(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.checkAndAutoConfirm();
    }, this.CHECK_INTERVAL);

    // Chạy ngay lần đầu
    this.checkAndAutoConfirm();
  }

  /**
   * Dừng service tự động xác nhận
   */
  public static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Kiểm tra và tự động xác nhận các appointment
   */
  private static async checkAndAutoConfirm(): Promise<void> {
    try {
      // Lấy danh sách appointments pending
      const response = await appointmentService.getMyAppointments('pending');
      
      if (!response.success || !response.data?.appointments) {
        return;
      }

      const pendingAppointments = response.data.appointments;
      const now = new Date();

      for (const appointment of pendingAppointments) {
        const shouldAutoConfirm = this.shouldAutoConfirm(appointment, now);
        
        if (shouldAutoConfirm) {
          await this.autoConfirmAppointment(appointment);
        }
      }
    } catch (error) {
      // Xử lý lỗi trong im lặng
    }
  }

  /**
   * Kiểm tra appointment có cần tự động xác nhận không
   */
  private static shouldAutoConfirm(appointment: any, now: Date): boolean {
    try {
      // Chỉ xử lý appointment có status pending
      if (appointment.status !== 'pending') {
        return false;
      }

      // Tạo datetime của appointment
      const appointmentDate = new Date(appointment.appointment_date);
      const [hours, minutes] = appointment.start_time.split(':').map(Number);
      
      const appointmentDateTime = new Date(appointmentDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      // Tính thời gian còn lại đến appointment
      const timeUntilAppointment = appointmentDateTime.getTime() - now.getTime();

      // Nếu còn <= 30 phút thì tự động xác nhận
      const shouldConfirm = timeUntilAppointment <= this.AUTO_CONFIRM_THRESHOLD && timeUntilAppointment > 0;

      return shouldConfirm;
    } catch (error) {
      return false;
    }
  }

  /**
   * Tự động xác nhận appointment
   */
  private static async autoConfirmAppointment(appointment: any): Promise<void> {
    try {
      const response = await appointmentService.confirmAppointment(appointment._id);
      
      if (response.success) {
        // Hiển thị thông báo cho user
        this.showAutoConfirmNotification(appointment);
      }
    } catch (error) {
      // Xử lý lỗi trong im lặng
    }
  }

  /**
   * Hiển thị thông báo tự động xác nhận
   */
  private static showAutoConfirmNotification(appointment: any): void {
    // Tạo notification
    const notification = {
      title: 'Lịch hẹn được tự động xác nhận',
      message: `Lịch hẹn lúc ${appointment.start_time} ngày ${new Date(appointment.appointment_date).toLocaleDateString('vi-VN')} đã được tự động xác nhận do gần tới giờ hẹn.`,
      type: 'info' as const,
      duration: 10000 // 10 giây
    };

    // Dispatch custom event để các component khác có thể lắng nghe
    window.dispatchEvent(new CustomEvent('autoConfirmNotification', {
      detail: { appointment, notification }
    }));

    // Hiển thị browser notification nếu được phép
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  }

  /**
   * Yêu cầu quyền notification
   */
  public static async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  /**
   * Kiểm tra trạng thái service
   */
  public static isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export default AutoConfirmService;