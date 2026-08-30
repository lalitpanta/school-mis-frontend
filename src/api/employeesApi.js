import axiosInstance from "./axiosInstance";

export const employeesApi = {
  getEmployees: (params = {}) => axiosInstance.get("/v1/employees", { params }),
  getEmployee: (id) => axiosInstance.get(`/v1/employees/${id}`),
  getEmployeeOptions: () => axiosInstance.get("/v1/employees/options"),
  createEmployee: (data) => axiosInstance.post("/v1/employees", data),
  updateEmployee: (id, data) =>
    axiosInstance.patch(`/v1/employees/${id}`, data),
  deleteEmployee: (id) => axiosInstance.delete(`/v1/employees/${id}`),
};
