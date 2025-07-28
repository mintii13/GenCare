// Utility functions for Vietnam timezone (UTC+7) date handling

/**
 * Convert date to Vietnam timezone (UTC+7)
 * @param date - Date or date string to convert
 * @returns Date object in Vietnam timezone
 */
export function toVietnamDate(date: Date | string): Date {
    const d = new Date(date);
    // Convert to Vietnam timezone (UTC+7)
    const vietnamOffset = 7 * 60; // 7 hours in minutes
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const vietnamTime = new Date(utc + (vietnamOffset * 60000));
    
    // Set to start of day in Vietnam timezone
    vietnamTime.setHours(0, 0, 0, 0);
    return vietnamTime;
}

/**
 * Get Vietnam date range for a specific date (start and end of day)
 * @param date - Date or date string
 * @returns Object with start and end dates for the day
 */
export function getVietnamDateRange(date: Date | string): { start: Date, end: Date } {
    const vietnamDate = toVietnamDate(date);
    const start = new Date(vietnamDate);
    const end = new Date(vietnamDate.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
}

/**
 * Convert date to Vietnam timezone and set to end of day (23:59:59.999)
 * @param date - Date or date string
 * @returns Date object at end of day in Vietnam timezone
 */
export function toVietnamEndOfDay(date: Date | string): Date {
    const vietnamDate = toVietnamDate(date);
    vietnamDate.setHours(23, 59, 59, 999);
    return vietnamDate;
}

/**
 * Get current date in Vietnam timezone
 * @returns Current date in Vietnam timezone
 */
export function getCurrentVietnamDate(): Date {
    return toVietnamDate(new Date());
}

/**
 * Format date to YYYY-MM-DD string in Vietnam timezone
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatVietnamDate(date: Date): string {
    const vietnamDate = toVietnamDate(date);
    return vietnamDate.toISOString().split('T')[0];
} 