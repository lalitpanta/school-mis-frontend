import axiosInstance from "./axiosInstance";

// ── General Settings ──────────────────────────────────────────
export const getAllSettings = () => axiosInstance.get("/v1/settings");
export const updateSettings = (data) =>
  axiosInstance.patch("/v1/settings", data);

// ── School Profile ──────────────────────────────────────────
export const getSchoolProfile = () => axiosInstance.get("/v1/settings/school");
export const updateSchoolProfile = (data) =>
  axiosInstance.put("/v1/settings/school", data);

// ── Academic Calendar ───────────────────────────────────────
export const getAcademicCalendar = () =>
  axiosInstance.get("/v1/settings/academic-calendar");
export const updateAcademicCalendar = (data) =>
  axiosInstance.put("/v1/settings/academic-calendar", data);

// ── Users & Staff ───────────────────────────────────────────
export const getUsers = (params = {}) =>
  axiosInstance.get("/v1/settings/users", { params });
export const createUser = (data) =>
  axiosInstance.post("/v1/settings/users", data);
export const updateUser = (id, data) =>
  axiosInstance.put(`/v1/settings/users/${id}`, data);
export const deleteUser = (id) =>
  axiosInstance.delete(`/v1/settings/users/${id}`);
export const resetUserPassword = (id) =>
  axiosInstance.post(`/v1/settings/users/${id}/reset-password`);

// ── Roles & Permissions ─────────────────────────────────────
export const getRoles = () => axiosInstance.get("/v1/settings/roles");
export const createRole = (data) =>
  axiosInstance.post("/v1/settings/roles", data);
export const updateRole = (id, data) =>
  axiosInstance.put(`/v1/settings/roles/${id}`, data);
export const deleteRole = (id) =>
  axiosInstance.delete(`/v1/settings/roles/${id}`);
export const getPermissions = () =>
  axiosInstance.get("/v1/settings/permissions");

// ── Fees & Notifications ────────────────────────────────────
export const getFeeSettings = () => axiosInstance.get("/v1/settings/fees");
export const updateFeeSettings = (data) =>
  axiosInstance.put("/v1/settings/fees", data);
export const getNotificationSettings = () =>
  axiosInstance.get("/v1/settings/notifications");
export const updateNotificationSettings = (data) =>
  axiosInstance.put("/v1/settings/notifications", data);

// ── Notices & SMS ──────────────────────────────────────────
export const getNotices = () => axiosInstance.get("/v1/settings/notices");
export const createNotice = (data) =>
  axiosInstance.post("/v1/settings/notices", data);
export const updateNotice = (id, data) =>
  axiosInstance.put(`/v1/settings/notices/${id}`, data);
export const deleteNotice = (id) =>
  axiosInstance.delete(`/v1/settings/notices/${id}`);
export const markNoticeRead = (id) =>
  axiosInstance.post(`/v1/settings/notices/${id}/read`);
export const togglePinNotice = (id, data) =>
  axiosInstance.post(`/v1/settings/notices/${id}/pin`, data);
export const archiveNotice = (id) =>
  axiosInstance.post(`/v1/settings/notices/${id}/archive`);
export const sendNoticeEmail = (id) =>
  axiosInstance.post(`/v1/settings/notices/${id}/send-email`);
export const getSmsConfig = () => axiosInstance.get("/v1/settings/sms/config");
export const updateSmsConfig = (data) =>
  axiosInstance.put("/v1/settings/sms/config", data);
export const getSmsTemplates = () =>
  axiosInstance.get("/v1/settings/sms/templates");
export const createSmsTemplate = (data) =>
  axiosInstance.post("/v1/settings/sms/templates", data);
export const updateSmsTemplate = (id, data) =>
  axiosInstance.put(`/v1/settings/sms/templates/${id}`, data);
export const deleteSmsTemplate = (id) =>
  axiosInstance.delete(`/v1/settings/sms/templates/${id}`);
export const sendSms = (data) =>
  axiosInstance.post("/v1/settings/sms/send", data);
export const getSmsLogs = () => axiosInstance.get("/v1/settings/sms/logs");

// ── Security ────────────────────────────────────────────────
export const getSecuritySettings = () =>
  axiosInstance.get("/v1/settings/security");
export const updateSecuritySettings = (data) =>
  axiosInstance.put("/v1/settings/security", data);
export const getAuditLogs = (params = {}) =>
  axiosInstance.get("/v1/settings/audit-logs", { params });
export const getAuditStats = () =>
  axiosInstance.get("/v1/settings/audit-stats");

// ── Theme ───────────────────────────────────────────────────
export const getThemeSettings = () => axiosInstance.get("/v1/settings/theme");
export const updateThemeSettings = (data) =>
  axiosInstance.put("/v1/settings/theme", data);
