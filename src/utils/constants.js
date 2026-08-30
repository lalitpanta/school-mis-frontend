export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  ACCOUNTANT: "accountant",
};

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  EXCUSED: "excused",
  HOLIDAY: "holiday",
};

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const ACADEMIC_TERMS = {
  FIRST: "First Term",
  SECOND: "Second Term",
  THIRD: "Third Term",
};

export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

export const ROUTES = {
  DASHBOARD: "/",
  CALENDAR: "/calendar",
  ATTENDANCE: "/attendance",
  TEACHER: "/teacher",
  STUDENT: "/student",
  EMPLOYEE: "/employee",
  SETTINGS: "/settings",
  RESULTS: "/results",
  RESULT_PORTAL: "/result-portal-module",
  DAILY_REPORTS: "/daily-reports",
  FEES: "/fees",
  LEAVE_MANAGEMENT: "/leave-management",
  LOGIN: "/login",
};

export const AVAILABLE_MODULES = [
  { key: "dashboard", label: "Dashboard", description: "Overview and stats" },
  { key: "calendar", label: "Calendar", description: "Calendar and events" },
  {
    key: "attendance",
    label: "Attendance",
    description: "Attendance tracking",
  },
  { key: "teacher", label: "Teacher", description: "Teacher management" },
  { key: "student", label: "Student", description: "Student management" },
  { key: "employee", label: "Employee", description: "Employee management" },
  { key: "settings", label: "Settings", description: "Tenant settings" },
  {
    key: "results",
    label: "Results",
    description: "Manage student results by class",
  },
  {
    key: "result_portal",
    label: "Result Portal",
    description: "Publish and share results publicly",
  },
  {
    key: "daily_reports",
    label: "Daily Student Report",
    description: "Daily student reports and templates",
  },
  {
    key: "fee_management",
    label: "Fee Management",
    description: "Manage student fees, structures, and payments",
  },
  {
    key: "leave_management",
    label: "Leave Management",
    description: "Manage teacher and staff leaves",
  },
];

export const MODULE_ROUTE_MAP = {
  dashboard: ROUTES.DASHBOARD,
  calendar: ROUTES.CALENDAR,
  attendance: ROUTES.ATTENDANCE,
  teacher: ROUTES.TEACHER,
  student: ROUTES.STUDENT,
  employee: ROUTES.EMPLOYEE,
  settings: ROUTES.SETTINGS,
  results: ROUTES.RESULTS,
  result_portal: ROUTES.RESULT_PORTAL,
  daily_reports: ROUTES.DAILY_REPORTS,
  fee_management: ROUTES.FEES,
  leave_management: ROUTES.LEAVE_MANAGEMENT,
};
