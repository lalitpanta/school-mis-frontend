import axiosInstance from "./axiosInstance";

export const getCourses = () => axiosInstance.get("/v1/settings/courses");
export const getCourse = (id) =>
  axiosInstance.get(`/v1/settings/courses/${id}`);
export const createCourse = (data) =>
  axiosInstance.post("/v1/settings/courses", data);
export const updateCourse = (id, data) =>
  axiosInstance.put(`/v1/settings/courses/${id}`, data);
export const deleteCourse = (id) =>
  axiosInstance.delete(`/v1/settings/courses/${id}`);
