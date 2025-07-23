import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class TimeUtils{
    private static readonly DEFAULT_TIMEZONE: string = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';
    
    public static getCurrentTimeInZone(): Date{
        return dayjs().tz(this.DEFAULT_TIMEZONE).toDate();
    }

    public static formatDateToTimezone(date: Date): string {
        return dayjs(date).tz(this.DEFAULT_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    }
}