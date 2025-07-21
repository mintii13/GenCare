import {
  formatDateDisplay,
  formatFullDate,
  getMonday,
  getWeekStart,
  getCurrentWeekLabel,
  canNavigateToPreviousWeek,
  isSlotDisabled,
  validateSlotTime,
  getSlotStatus,
  formatWeekRange,
  getWeekRange
} from './dateUtils';

describe('dateUtils', () => {
  test('formatDateDisplay formats date correctly', () => {
    expect(formatDateDisplay('2024-06-01')).toBe('01/06');
  });

  test('formatFullDate formats date correctly', () => {
    expect(formatFullDate('2024-06-01')).toBe('01/06/2024');
  });

  test('getMonday returns correct Monday', () => {
    expect(getMonday('2024-06-05')).toBe('2024-06-03'); // Wednesday -> Monday
    expect(getMonday('2024-06-02')).toBe('2024-05-27'); // Sunday -> previous Monday
  });

  test('getWeekStart returns Monday for a given date', () => {
    const date = new Date('2024-06-05');
    const weekStart = getWeekStart(date);
    expect(weekStart.getDay()).toBe(1); // Monday
  });

  test('getCurrentWeekLabel returns correct label', () => {
    const date = new Date('2024-06-03');
    expect(getCurrentWeekLabel(date)).toMatch(/Tuần 03\/06 - 09\/06\/2024/);
  });

  test('canNavigateToPreviousWeek returns true/false correctly', () => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    expect(canNavigateToPreviousWeek(now)).toBe(true);
    expect(canNavigateToPreviousWeek(lastWeek)).toBe(false);
  });

  test('isSlotDisabled returns true for past and <2h slots', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 60 * 60 * 1000); // 1h ago
    const soon = new Date(now.getTime() + 60 * 60 * 1000); // 1h ahead
    const far = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3h ahead
    const date = past.toISOString().split('T')[0];
    const time = past.toTimeString().slice(0, 5);
    expect(isSlotDisabled(date, time)).toBe(true);
    const dateSoon = soon.toISOString().split('T')[0];
    const timeSoon = soon.toTimeString().slice(0, 5);
    expect(isSlotDisabled(dateSoon, timeSoon)).toBe(true);
    const dateFar = far.toISOString().split('T')[0];
    const timeFar = far.toTimeString().slice(0, 5);
    expect(isSlotDisabled(dateFar, timeFar)).toBe(false);
  });

  test('validateSlotTime returns correct validation', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 60 * 60 * 1000);
    const soon = new Date(now.getTime() + 20 * 60 * 1000); // 20m ahead
    const restricted = new Date(now.getTime() + 60 * 60 * 1000); // 1h ahead
    const ok = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3h ahead
    const datePast = past.toISOString().split('T')[0];
    const timePast = past.toTimeString().slice(0, 5);
    expect(validateSlotTime(datePast, timePast)).toMatchObject({ isValid: false, severity: 'error' });
    const dateSoon = soon.toISOString().split('T')[0];
    const timeSoon = soon.toTimeString().slice(0, 5);
    expect(validateSlotTime(dateSoon, timeSoon)).toMatchObject({ isValid: false, severity: 'error' });
    const dateRestricted = restricted.toISOString().split('T')[0];
    const timeRestricted = restricted.toTimeString().slice(0, 5);
    expect(validateSlotTime(dateRestricted, timeRestricted)).toMatchObject({ isValid: false, severity: 'warning' });
    const dateOk = ok.toISOString().split('T')[0];
    const timeOk = ok.toTimeString().slice(0, 5);
    expect(validateSlotTime(dateOk, timeOk)).toMatchObject({ isValid: true });
  });

  test('getSlotStatus returns correct status', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 60 * 60 * 1000);
    const soon = new Date(now.getTime() + 20 * 60 * 1000);
    const restricted = new Date(now.getTime() + 60 * 60 * 1000);
    const ok = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const datePast = past.toISOString().split('T')[0];
    const timePast = past.toTimeString().slice(0, 5);
    expect(getSlotStatus(datePast, timePast, '23:59').status).toBe('past');
    const dateSoon = soon.toISOString().split('T')[0];
    const timeSoon = soon.toTimeString().slice(0, 5);
    expect(getSlotStatus(dateSoon, timeSoon, '23:59').status).toBe('severely-restricted');
    const dateRestricted = restricted.toISOString().split('T')[0];
    const timeRestricted = restricted.toTimeString().slice(0, 5);
    expect(getSlotStatus(dateRestricted, timeRestricted, '23:59').status).toBe('restricted');
    const dateOk = ok.toISOString().split('T')[0];
    const timeOk = ok.toTimeString().slice(0, 5);
    expect(getSlotStatus(dateOk, timeOk, '23:59').status).toBe('available');
  });

  test('formatWeekRange returns correct string', () => {
    expect(formatWeekRange('2024-06-03', '2024-06-09')).toBe('03/06/2024 - 09/06/2024');
  });

  test('getWeekRange returns correct week start and end', () => {
    const date = new Date('2024-06-03');
    const { weekStart, weekEnd } = getWeekRange(date);
    expect(weekStart).toBe('2024-06-03');
    expect(weekEnd).toBe('2024-06-09');
  });
}); 