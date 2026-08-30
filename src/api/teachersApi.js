import axiosInstance from "./axiosInstance";

export const teachersApi = {
  getTeachers: (params = {}) => axiosInstance.get("/v1/teachers", { params }),
  getTeacher: (id) => axiosInstance.get(`/v1/teachers/${id}`),
  getTeacherOptions: () => axiosInstance.get("/v1/teachers"),
  createTeacher: (data) => axiosInstance.post("/v1/teachers", data),
  updateTeacher: (id, data) => axiosInstance.patch(`/v1/teachers/${id}`, data),
  exportTeachers: (params) =>
    axiosInstance.get("/v1/teachers/export", { params, responseType: "blob" }),
  importTeachers: (formData) =>
    axiosInstance.post("/v1/teachers/import", formData),
  deleteTeacher: (id) => axiosInstance.delete(`/v1/teachers/${id}`),
};
