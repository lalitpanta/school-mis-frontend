import axiosInstance from "./axiosInstance";

export const getClassrooms = () => axiosInstance.get("/v1/settings/classrooms");
export const createClassroom = (data) =>
  axiosInstance.post("/v1/settings/classrooms", data);
export const createClassroomSections = (classroomId, sections) =>
  axiosInstance.post(`/v1/settings/classrooms/${classroomId}/sections`, {
    sections,
  });
export const getClassroomSections = (classroomId) =>
  axiosInstance.get(`/v1/settings/classrooms/${classroomId}/sections`);
export const updateClassroomSection = (sectionId, name) =>
  axiosInstance.put(`/v1/settings/classrooms/sections/${sectionId}`, { name });
export const deleteClassroomSection = (sectionId) =>
  axiosInstance.delete(`/v1/settings/classrooms/sections/${sectionId}`);
export const updateClassroom = (id, data) =>
  axiosInstance.put(`/v1/settings/classrooms/${id}`, data);
export const deleteClassroom = (id) =>
  axiosInstance.delete(`/v1/settings/classrooms/${id}`);
export const getTeachers = () => axiosInstance.get("/v1/teachers/options");
