import { format, formatDistanceToNow, parseISO, isValid, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Format a date to a readable string
 * @param {Date|string} date
 * @param {string} formatStr
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return format(parsed, formatStr);
};

/**
 * Format a date to a short readable string
 */
export const formatShortDate = (date) => formatDate(date, 'dd/MM/yyyy');

/**
 * Format a date to include time
 */
export const formatDateTime = (date) => formatDate(date, 'MMM dd, yyyy hh:mm a');

/**
 * Format a date to time only
 */
export const formatTime = (date) => formatDate(date, 'hh:mm a');

/**
 * Returns relative time from now (e.g., "2 hours ago")
 */
export const timeAgo = (date) => {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

/**
 * Get start and end of the current week
 */
export const getCurrentWeekRange = () => ({
  start: startOfWeek(new Date(), { weekStartsOn: 1 }),
  end: endOfWeek(new Date(), { weekStartsOn: 1 }),
});

/**
 * Get start and end of the current month
 */
export const getCurrentMonthRange = () => ({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date()),
});

/**
 * Format a date for API requests (ISO format)
 */
export const formatForApi = (date) => {
  if (!date) return null;
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return null;
  return format(parsed, 'yyyy-MM-dd');
};
