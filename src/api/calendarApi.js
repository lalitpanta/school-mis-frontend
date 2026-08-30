import axiosInstance from './axiosInstance';

// ── Base paths ──────────────────────────────────────────────────────────────
const CD  = '/v1/calendar-days';
const CAL = '/v1/calendar';
const MON = '/v1/month';
const DAY = '/v1/day';

// ── Day Classification (day types) ──────────────────────────────────────────
/** GET /v1/day/getday  — full list of day types */
export const getDayTypes = () => axiosInstance.get(`${DAY}/getday`);

/** POST /v1/day/uploadday — create a new day type */
export const createDayType = (data) => axiosInstance.post(`${DAY}/uploadday`, data);

/** DELETE /v1/day/deleteday/:id — delete a day type */
export const deleteDayType = (id) => axiosInstance.delete(`${DAY}/deleteday/${id}`);

/** PATCH /v1/day/updateday/:id — update a day type */
export const updateDayType = (id, data) => axiosInstance.patch(`${DAY}/updateday/${id}`, data);

/** GET /v1/calendar-days/day-types/available  — slim list for dropdowns */
export const getAvailableDayTypes = () => axiosInstance.get(`${CD}/day-types/available`);

// ── Year ────────────────────────────────────────────────────────────
export const getYears = () => axiosInstance.get('/v1/year/getyear');
export const createYear = (data) => axiosInstance.post('/v1/year/uploadyear', data);
export const deleteYear = (id) => axiosInstance.delete(`/v1/year/deleteyear/${id}`);
export const updateYear = (id, data) => axiosInstance.patch(`/v1/year/updateyear/${id}`, data);

// ── Day Category ───────────────────────────────────────────────────
export const getDayCategories = (year_id) => axiosInstance.get('/v1/day-category', { params: { year_id } });
export const createDayCategory = (data) => axiosInstance.post('/v1/day-category', data);
export const deleteDayCategory = (id) => axiosInstance.delete(`/v1/day-category/${id}`);
export const updateDayCategory = (id, data) => axiosInstance.patch(`/v1/day-category/${id}`, data);

// ── Month class data ────────────────────────────────────────────────────────
/** GET /v1/month/getmonth  — list of all months */
export const getMonths = () => axiosInstance.get(`${MON}/getmonth`);

/** POST /v1/month/uploadmonth — create a new month */
export const createMonth = (data) => axiosInstance.post(`${MON}/uploadmonth`, data);

/** DELETE /v1/month/deletemonth/:id — delete a month */
export const deleteMonth = (id) => axiosInstance.delete(`${MON}/deletemonth/${id}`);

/** PATCH /v1/month/updatemonth/:id — update a month */
export const updateMonth = (id, data) => axiosInstance.patch(`${MON}/updatemonth/${id}`, data);

// ── Calendar Days ───────────────────────────────────────────────────────────
/**
 * POST /v1/calendar-days/generate?month_id=xxx
 * Generates calendar_day rows for every day of the month.
 */
export const generateCalendarDays = (month_id) =>
  axiosInstance.post(`${CD}/generate`, {}, { params: { month_id } });

/**
 * GET /v1/calendar-days/month?month_id=xxx&date_format=BS
 * Returns flat array of days with their day_type set.
 */
export const getCalendarDays = (month_id, date_format = 'BS') =>
  axiosInstance.get(`${CD}/month`, { params: { month_id, date_format } });

/**
 * GET /v1/calendar-days/year/:year_id
 * Returns flat array of days for a whole year.
 */
export const getCalendarDaysByYear = (year_id) =>
  axiosInstance.get(`${CD}/year/${year_id}`);

/**
 * GET /v1/calendar-days/:id
 * Returns a single calendar day detail.
 */
export const getCalendarDay = (id) => axiosInstance.get(`${CD}/${id}`);

/**
 * PATCH /v1/calendar-days/:id/assign-type
 * Assigns a day_type to a single calendar day by its UUID.
 * Body: { day_type_id }
 */
export const assignDayType = (id, day_type_id) =>
  axiosInstance.patch(`${CD}/${id}/assign-type`, { day_type_id });

/**
 * POST /v1/calendar-days/bulk-assign
 * Assigns types to multiple days by their UUIDs.
 * Body: { assignments: [{ calendarDayId, dayTypeId }] }
 */
export const bulkAssignDayTypes = (assignments) =>
  axiosInstance.post(`${CD}/bulk-assign`, { assignments });

/**
 * POST /v1/calendar-days/assign-by-weekday
 * Assigns a day type to every occurrence of a weekday in a month or year.
 * 
 * @param {string|null} month_id - Month UUID (null for year-wide assignment)
 * @param {string} day_of_week - Day name (Sunday, Monday, etc.)
 * @param {string} day_type_id - Day type/classification UUID
 * @param {string|null} year_id - Year UUID (null for month-specific assignment)
 * 
 * NOTE: Either month_id or year_id must be provided (month takes priority)
 */
export const assignByWeekday = (month_id, day_of_week, day_type_id, year_id) => {
  // Build payload with explicit values to ensure proper null handling
  const payload = {
    day_of_week,
    day_type_id,
  };
  
  // Add the appropriate scope identifier
  if (month_id) {
    payload.month_id = month_id;
  } else if (year_id) {
    payload.year_id = year_id;
  }
  
  return axiosInstance.post(`${CD}/assign-by-weekday`, payload);
};

/**
 * POST /v1/calendar-days/manual-assign
 * Assigns types by day_number (1-based).
 * Body: { month_id, assignments: [{ day_number, day_type_id }] }
 */
export const manualAssignDayTypes = (month_id, assignments) =>
  axiosInstance.post(`${CD}/manual-assign`, { month_id, assignments });

/**
 * DELETE /v1/calendar-days/:id
 */
export const deleteCalendarDay = (id) => axiosInstance.delete(`${CD}/${id}`);

// ── Calendar (view) ─────────────────────────────────────────────────────────
/**
 * GET /v1/calendar/bs/weeks?month_id=xxx
 * Returns calendar grouped by weeks — ideal for the calendar grid display.
 */
export const getCalendarByWeeksBS = (month_id) =>
  axiosInstance.get(`${CAL}/bs/weeks`, { params: { month_id } });

/**
 * GET /v1/calendar/month?month_id=xxx&date_format=BS
 */
export const getCalendarMonth = (month_id, date_format = 'BS') =>
  axiosInstance.get(`${CAL}/month`, { params: { month_id, date_format } });

/**
 * POST /v1/calendar-days/refresh-stats/:year_id
 */
export const refreshYearlyStats = (year_id) =>
  axiosInstance.post(`${CD}/refresh-stats/${year_id}`);
