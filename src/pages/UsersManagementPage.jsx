import React, { useState, useEffect } from "react";
import { useRolesPermissions } from "../context/RolesPermissionsContext";
import { usersApi } from "../api/usersApi";
import { teachersApi } from "../api/teachersApi";
import { getStudents } from "../api/studentsApi";
import { employeesApi } from "../api/employeesApi";
import { sectionsApi } from "../api/sectionsApi";
import { RoleSelector } from "../components/common/RoleSelector";

export const UsersManagementPage = () => {
  const { fetchRoles } = useRolesPermissions();

  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sections, setSections] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create or edit
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    user_type: "custom",
    name: "",
    email: "",
    phone: "",
    password: "",
    department_store: "",
    section_id: "",
    authority_mode: "role_access",
    module_access: [],
    role_ids: [],
    teacher_id: "",
    student_id: "",
    employee_id: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Load users, roles, and related entities on mount
  useEffect(() => {
    fetchAllUsers();
    fetchRoles();
    loadTeachers();
    loadStudents();
    loadEmployees();
    loadSections();
    loadDepartments();
  }, []);

  const loadTeachers = async () => {
    try {
      const response = await teachersApi.getTeacherOptions();
      setTeachers(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load teachers:", err);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await getStudents();
      setStudents(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeesApi.getEmployeeOptions();
      setEmployees(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  const loadSections = async () => {
    try {
      const response = await sectionsApi.getSections();
      setSections(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load sections:", err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = (await usersApi.getDepartments?.()) || {
        data: { data: [] },
      };
      setDepartmentsList(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAllUsers();
      setUsers(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.user_type === "teacher") {
      if (!formData.teacher_id) {
        newErrors.teacher_id = "Please select a teacher";
      }
    } else if (formData.user_type === "student") {
      if (!formData.student_id) {
        newErrors.student_id = "Please select a student";
      }
    } else if (formData.user_type === "employee") {
      if (!formData.employee_id) {
        newErrors.employee_id = "Please select an employee";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (modalMode === "create") {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      await usersApi.createUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        department_store: formData.department_store,
        section_id:
          formData.user_type === "student" ? formData.section_id : undefined,
        authority_mode: formData.authority_mode,
        module_access: formData.module_access,
        role_ids: formData.role_ids,
        teacher_id:
          formData.user_type === "teacher" ? formData.teacher_id : undefined,
        student_id:
          formData.user_type === "student" ? formData.student_id : undefined,
        employee_id:
          formData.user_type === "employee" ? formData.employee_id : undefined,
      });

      await fetchAllUsers();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const updatePayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department_store: formData.department_store,
        section_id:
          formData.user_type === "student" ? formData.section_id : null,
        authority_mode: formData.authority_mode,
        module_access: formData.module_access,
        teacher_id:
          formData.user_type === "teacher" ? formData.teacher_id : null,
        student_id:
          formData.user_type === "student" ? formData.student_id : null,
        employee_id:
          formData.user_type === "employee" ? formData.employee_id : null,
      };

      await usersApi.updateUser(selectedUser.id, updatePayload);

      await usersApi.assignRolesToUser(selectedUser.id, formData.role_ids);

      await fetchAllUsers();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      await usersApi.deleteUser(userId);
      await fetchAllUsers();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    setFormData({
      user_type: "custom",
      name: "",
      email: "",
      phone: "",
      password: "",
      department_store: "",
      section_id: "",
      authority_mode: "role_access",
      module_access: [],
      role_ids: [],
      teacher_id: "",
      student_id: "",
      employee_id: "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (user) => {
    let userType = "custom";
    if (user.teacher_id) userType = "teacher";
    else if (user.student_id) userType = "student";
    else if (user.employee_id) userType = "employee";

    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      user_type: userType,
      name: user.name || "",
      email: user.email,
      phone: user.phone || "",
      password: "",
      department_store: user.department_store || "",
      section_id: user.section_id || "",
      authority_mode: user.authority_mode || "role_access",
      module_access: user.module_access || [],
      role_ids: user.roles?.map((r) => r.id) || [],
      teacher_id: user.teacher_id || "",
      student_id: user.student_id || "",
      employee_id: user.employee_id || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      user_type: "custom",
      name: "",
      email: "",
      phone: "",
      password: "",
      department_store: "",
      section_id: "",
      authority_mode: "role_access",
      module_access: [],
      role_ids: [],
      teacher_id: "",
      student_id: "",
      employee_id: "",
    });
    setFormErrors({});
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(term) ||
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.phone && user.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Create User
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {loading
                ? "Loading users..."
                : "No users found. Create one to get started!"}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || "—"}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.phone || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-2">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role.id}
                              className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold"
                            >
                              {role.role_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            No roles assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalMode === "create" ? "Create New User" : "Edit User"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <form
                onSubmit={
                  modalMode === "create" ? handleCreateUser : handleEditUser
                }
                className="space-y-4"
              >
                {/* User Type - Radio Buttons at Top */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    User Type
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "custom", label: "Custom User" },
                      { value: "teacher", label: "Teacher" },
                      { value: "student", label: "Student" },
                      { value: "employee", label: "Employee" },
                    ].map((type) => (
                      <label
                        key={type.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="user_type"
                          value={type.value}
                          checked={formData.user_type === type.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              user_type: e.target.value,
                              teacher_id: "",
                              student_id: "",
                              employee_id: "",
                              section_id: "",
                            })
                          }
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">
                          {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.user_type === "teacher" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Teacher
                    </label>
                    <select
                      value={formData.teacher_id}
                      onChange={(e) => {
                        const teacherId = e.target.value;
                        const teacher = teachers.find(
                          (t) => t.id === teacherId,
                        );
                        const nextState = {
                          ...formData,
                          teacher_id: teacherId,
                        };
                        if (teacher) {
                          nextState.name = teacher.full_name || nextState.name;
                          nextState.email =
                            teacher.work_email ||
                            teacher.personal_email ||
                            nextState.email;
                          nextState.phone =
                            teacher.personal_phone ||
                            teacher.work_phone ||
                            nextState.phone;
                          if (
                            !nextState.department_store &&
                            teacher.department_id
                          ) {
                            nextState.department_store = teacher.department_id;
                          }
                        }
                        setFormData(nextState);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name} (
                          {teacher.employee_id || teacher.id})
                        </option>
                      ))}
                    </select>
                    {formErrors.teacher_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.teacher_id}
                      </p>
                    )}
                  </div>
                )}

                {formData.user_type === "student" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Section
                      </label>
                      <select
                        value={formData.section_id}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            section_id: e.target.value,
                            student_id: "",
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Section First --</option>
                        {sections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.section_name} - {section.class_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.section_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Student
                        </label>
                        <select
                          value={formData.student_id}
                          onChange={(e) => {
                            const studentId = e.target.value;
                            const student = students.find(
                              (s) => s.id === studentId,
                            );
                            const nextState = {
                              ...formData,
                              student_id: studentId,
                            };
                            if (student) {
                              nextState.name =
                                student.full_name || nextState.name;
                              nextState.email =
                                student.email || nextState.email;
                              nextState.phone =
                                student.phone || nextState.phone;
                            }
                            setFormData(nextState);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select student</option>
                          {students
                            .filter((s) => s.section_id === formData.section_id)
                            .map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.full_name} ({student.id})
                              </option>
                            ))}
                        </select>
                        {formErrors.student_id && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.student_id}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {formData.user_type === "employee" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Employee
                    </label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => {
                        const employeeId = e.target.value;
                        const employee = employees.find(
                          (e) => e.id === employeeId,
                        );
                        const nextState = {
                          ...formData,
                          employee_id: employeeId,
                        };
                        if (employee) {
                          nextState.name = employee.full_name || nextState.name;
                          nextState.email =
                            employee.email_address || nextState.email;
                          nextState.phone =
                            employee.mobile_number || nextState.phone;
                          if (
                            !nextState.department_store &&
                            employee.department_id
                          ) {
                            nextState.department_store = employee.department_id;
                          }
                        }
                        setFormData(nextState);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name} ({employee.employee_id})
                        </option>
                      ))}
                    </select>
                    {formErrors.employee_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.employee_id}
                      </p>
                    )}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setFormErrors({ ...formErrors, name: "" });
                    }}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={["teacher", "student", "employee"].includes(
                      formData.user_type,
                    )}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setFormErrors({ ...formErrors, email: "" });
                    }}
                    placeholder="user@example.com"
                    disabled={["teacher", "student", "employee"].includes(
                      formData.user_type,
                    )}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      formErrors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    } ${["teacher", "student", "employee"].includes(formData.user_type) ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      setFormErrors({ ...formErrors, phone: "" });
                    }}
                    placeholder="+977 9841234567"
                    disabled={["teacher", "student", "employee"].includes(
                      formData.user_type,
                    )}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${["teacher", "student", "employee"].includes(formData.user_type) ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  />
                </div>

                {/* Department/Store - For custom, teacher, and employee */}
                {["custom", "teacher", "employee"].includes(
                  formData.user_type,
                ) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department / Store
                    </label>
                    {formData.user_type === "custom" ? (
                      <>
                        <select
                          value={formData.department_store}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              department_store: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- None --</option>
                          {departmentsList.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                          Optional — assign to a department or store.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded">
                        Department is auto-selected from the chosen{" "}
                        {formData.user_type}.
                      </p>
                    )}
                  </div>
                )}

                {/* Password - Only for create */}
                {modalMode === "create" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setFormErrors({ ...formErrors, password: "" });
                      }}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        formErrors.password
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                    {formErrors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                )}

                {/* Authority Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Authority Mode
                  </label>
                  <select
                    value={formData.authority_mode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        authority_mode: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="role_access">Use Role Access</option>
                    <option value="direct_access">Direct Access</option>
                  </select>
                </div>

                {/* Module Access */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Access
                  </label>
                  <div className="space-y-2">
                    {[
                      "dashboard",
                      "calendar",
                      "attendance",
                      "classroom",
                      "teacher",
                      "student",
                      "employee",
                      "results",
                      "settings",
                    ].map((module) => (
                      <label key={module} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.module_access.includes(module)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                module_access: [
                                  ...formData.module_access,
                                  module,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                module_access: formData.module_access.filter(
                                  (m) => m !== module,
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {module}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Roles Selection */}
                <RoleSelector
                  selectedRoles={formData.role_ids}
                  onChange={(role_ids) =>
                    setFormData({ ...formData, role_ids })
                  }
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loading
                    ? "Saving..."
                    : modalMode === "create"
                      ? "Create User"
                      : "Update User"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Delete User?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
