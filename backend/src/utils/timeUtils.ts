import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { DateTime } from 'luxon';
dayjs.extend(utc);
dayjs.extend(timezone);

export class TimeUtils{
    private static readonly DEFAULT_TIMEZONE: string = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';
    
    public static getCurrentTimeInZone(): Date{
        return dayjs().tz(this.DEFAULT_TIMEZONE).toDate();
    }

    public static getCurrentTimeInOtherZone(tz: string): Date{
        return dayjs().tz(tz).toDate();
    }

    public static formatDateToTimezone(date: Date): string {
        return dayjs(date).tz(this.DEFAULT_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    }

    public static getCurrentDateTimeInZone(): DateTime {
        return DateTime.now().setZone(this.DEFAULT_TIMEZONE);
    }

    public static getCurrentDateTimeInOtherZone(tz: string): DateTime {
        return DateTime.now().setZone(tz);
    }

    public static parseDateOnZone(date: string): DateTime{
        return DateTime.fromISO(date, { zone: this.DEFAULT_TIMEZONE});
    }

    public static normalizeDateOnZone(date: Date){
        return DateTime.fromJSDate(date).setZone(this.DEFAULT_TIMEZONE).startOf('day');
    }


}