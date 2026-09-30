import axiosInstance from "./axiosInstance";

export const getStudents = () => axiosInstance.get("/v1/settings/students");
export const getCurrentStudent = () => axiosInstance.get("/v1/students/me");
export const getStudentDashboard = () =>
  axiosInstance.get("/v1/students/me/dashboard");
export const markStudentNoticeRead = (noticeId) =>
  axiosInstance.post(`/v1/students/me/notices/${encodeURIComponent(noticeId)}/read`);
export const getStudentLeaveRequests = () =>
  axiosInstance.get("/v1/students/me/leave-requests");
export const createStudentLeaveRequest = (data) =>
  axiosInstance.post("/v1/students/me/leave-requests", data);
export const updateCurrentStudent = (data) =>
  axiosInstance.patch("/v1/students/me", data);
const withMultipart = (data) =>
  data instanceof FormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : undefined;

export const createStudent = (data) =>
  axiosInstance.post("/v1/settings/students", data, withMultipart(data));
export const updateStudent = (id, data) =>
  axiosInstance.patch(`/v1/settings/students/${id}`, data, withMultipart(data));
export const deleteStudent = (id) =>
  axiosInstance.delete(`/v1/settings/students/${id}`);
export const removeStudentDocument = (id, docId) =>
  axiosInstance.delete(`/v1/settings/students/${id}/documents/${docId}`);
export const importStudents = (students) =>
  axiosInstance.post("/v1/settings/students/import", { students });
export const exportStudentsCsv = () =>
  axiosInstance.get("/v1/settings/students/export", { responseType: "blob" });
