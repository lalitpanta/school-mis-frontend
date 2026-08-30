import { useState, useEffect } from "react";
import { usersApi } from "../../api/usersApi";
import { teachersApi } from "../../api/teachersApi";
import { getStudents } from "../../api/studentsApi";
import { employeesApi } from "../../api/employeesApi";
import { sectionsApi } from "../../api/sectionsApi";
import { useRolesPermissions } from "../../context/RolesPermissionsContext";
import { RoleSelector } from "../common/RoleSelector";
import { Plus, Trash2, Edit, X } from "lucide-react";
import SettingsModal from "../common/SettingsModal";

const UsersStaff = () => {
  const { fetchRoles } = useRolesPermissions();

  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sections, setSections] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    user_type: "custom",
    teacher_id: "",
    student_id: "",
    employee_id: "",
    section_id: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    department_store: "",
    authority_mode: "role_access",
    module_access: [],
    role_ids: [],
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
    loadAvailableModules();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        usersRes,
        rolesRes,
        teachersRes,
        studentsRes,
        employeesRes,
        sectionsRes,
      ] = await Promise.all([
        usersApi.getAllUsers(),
        fetchRoles(),
        teachersApi.getTeacherOptions(),
        getStudents(),
        employeesApi.getEmployeeOptions(),
        sectionsApi.getSections(),
      ]);
      setUsers(usersRes.data || []);
      setTeachers(teachersRes.data?.data || []);
      setStudents(studentsRes.data?.data || []);
      setEmployees(employeesRes.data?.data || []);
      setSections(sectionsRes.data?.data || []);
      // fetch departments for selection
      try {
        const deps = await (
          await import("../../api/departmentsApi")
        ).getDepartments();
        setDepartmentsList(deps.data?.data || []);
      } catch (err) {
        // ignore
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableModules = async () => {
    try {
      // Try to get current user from localStorage first
      const misUser = localStorage.getItem("mis_user");
      const misStaffId = localStorage.getItem("mis_staff_id");

      if (misStaffId) {
        // Fetch current user's data to get their module_access
        const response = await usersApi.getUserById(misStaffId);
        const currentUser = response.data;

        if (
          currentUser &&
          currentUser.module_access &&
          Array.isArray(currentUser.module_access)
        ) {
          setAvailableModules(currentUser.module_access);
          return;
        }
      }

      // Fallback: try to get from localStorage
      if (misUser) {
        const currentUser = JSON.parse(misUser);
        if (
          currentUser.module_access &&
          Array.isArray(currentUser.module_access)
        ) {
          setAvailableModules(currentUser.module_access);
          return;
        }
      }

      // Ultimate fallback: use all common modules
      setAvailableModules([
        "dashboard",
        "calendar",
        "attendance",
        "settings",
        "results",
        "notices",
        "students",
        "teachers",
        "employees",
      ]);
    } catch (err) {
      console.error("Failed to load available modules:", err);
      // Fallback to default modules
      setAvailableModules([
        "dashboard",
        "calendar",
        "attendance",
        "settings",
        "results",
        "notices",
        "students",
        "teachers",
        "employees",
      ]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.user_type === "teacher" && !formData.teacher_id) {
      newErrors.teacher_id = "Please select a teacher";
    } else if (formData.user_type === "student" && !formData.student_id) {
      newErrors.student_id = "Please select a student";
    } else if (formData.user_type === "employee" && !formData.employee_id) {
      newErrors.employee_id = "Please select an employee";
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
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        department_store: formData.department_store,
        authority_mode: formData.authority_mode,
        module_access: formData.module_access,
        role_ids: formData.role_ids,
      };

      if (formData.user_type === "teacher") {
        payload.teacher_id = formData.teacher_id;
      } else if (formData.user_type === "student") {
        payload.student_id = formData.student_id;
        payload.section_id = formData.section_id;
      } else if (formData.user_type === "employee") {
        payload.employee_id = formData.employee_id;
      }

      await usersApi.createUser(payload);

      await loadData();
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
        authority_mode: formData.authority_mode,
        module_access: formData.module_access,
        teacher_id:
          formData.user_type === "teacher" ? formData.teacher_id : null,
        student_id:
          formData.user_type === "student" ? formData.student_id : null,
        employee_id:
          formData.user_type === "employee" ? formData.employee_id : null,
        section_id:
          formData.user_type === "student" ? formData.section_id : null,
      };

      await usersApi.updateUser(selectedUser.id, updatePayload);

      await usersApi.assignRolesToUser(selectedUser.id, formData.role_ids);

      await loadData();
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
      await loadData();
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
      teacher_id: "",
      student_id: "",
      employee_id: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      department_store: "",
      authority_mode: "role_access",
      module_access: [],
      role_ids: [],
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
      teacher_id: user.teacher_id || "",
      student_id: user.student_id || "",
      employee_id: user.employee_id || "",
      section_id: user.section_id || "",
      name: user.name || "",
      email: user.email,
      phone: user.phone || "",
      password: "",
      department_store: user.department_store || "",
      authority_mode: user.authority_mode || "role_access",
      module_access: user.module_access || [],
      role_ids: user.roles?.map((r) => r.id) || [],
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      user_type: "custom",
      teacher_id: "",
      student_id: "",
      employee_id: "",
      section_id: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      department_store: "",
      authority_mode: "role_access",
      module_access: [],
      role_ids: [],
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
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Users & Staff</h2>
        <p className="text-sm text-slate-400">
          Create and manage users with password and role assignments
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex justify-between items-center">
          <span className="text-sm text-red-300">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Create */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-700/40 border border-slate-600/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus size={16} />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg border border-slate-700/60">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-800/30">
            {loading
              ? "Loading users..."
              : "No users found. Create one to get started!"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 border-b border-slate-700/60">
              <tr>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">
                  User
                </th>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">
                  Roles
                </th>
                <th className="px-4 py-3 text-center text-slate-300 font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-slate-300 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-white">
                        {user.name || "—"}
                      </span>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {user.phone || <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role.id}
                            className="inline-block bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full text-xs font-medium"
                          >
                            {role.role_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic text-xs">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-700/60 hover:bg-slate-600 text-slate-300 rounded transition"
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Form Modal */}
      <SettingsModal
        open={showModal}
        onClose={closeModal}
        title={modalMode === "create" ? "Create New User" : "Edit User"}
        width="max-w-md"
      >
        <div className="p-6">
          <form
            onSubmit={
              modalMode === "create" ? handleCreateUser : handleEditUser
            }
            className="space-y-4"
          >
            {/* User Type - AT THE TOP */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">
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
                      onChange={(e) => {
                        const newFormData = {
                          ...formData,
                          user_type: e.target.value,
                          teacher_id: "",
                          student_id: "",
                          employee_id: "",
                          section_id: "",
                        };
                        // Auto-select first section if Student is chosen
                        if (
                          e.target.value === "student" &&
                          sections.length > 0
                        ) {
                          newFormData.section_id = sections[0].id;
                        }
                        setFormData(newFormData);
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-slate-200">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
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
                disabled={formData.user_type === "teacher"}
                className={`w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formData.user_type === "teacher" ? "bg-slate-800 text-slate-500 cursor-not-allowed" : ""}`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
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
                disabled={formData.user_type === "teacher"}
                className={`w-full px-3 py-2 bg-slate-700/40 border rounded-lg text-white text-sm focus:outline-none focus:ring-2 ${
                  formErrors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-600/50 focus:ring-indigo-500"
                } ${formData.user_type === "teacher" ? "bg-slate-800 text-slate-500 cursor-not-allowed" : ""}`}
              />
              {formErrors.email && (
                <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
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
                disabled={formData.user_type === "teacher"}
                className={`w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formData.user_type === "teacher" ? "bg-slate-800 text-slate-500 cursor-not-allowed" : ""}`}
              />
            </div>

            {formData.user_type === "teacher" && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Select Teacher
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => {
                    const teacherId = e.target.value;
                    const teacher = teachers.find((t) => t.id === teacherId);
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
                  className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}{" "}
                      {teacher.employee_id ? `(${teacher.employee_id})` : ""}
                    </option>
                  ))}
                </select>
                {formErrors.teacher_id && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.teacher_id}
                  </p>
                )}
              </div>
            )}

            {/* Student Selection - Only for student type */}
            {formData.user_type === "student" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Select Section
                  </label>
                  <select
                    value={formData.section_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        section_id: e.target.value,
                        student_id: "",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select section</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Select Student
                  </label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => {
                      const studentId = e.target.value;
                      const student = students.find((s) => s.id === studentId);
                      const nextState = {
                        ...formData,
                        student_id: studentId,
                      };
                      if (student) {
                        nextState.name = student.full_name || nextState.name;
                        nextState.email = student.email || nextState.email;
                        nextState.phone = student.phone || nextState.phone;
                      }
                      setFormData(nextState);
                    }}
                    className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select student</option>
                    {students
                      .filter((s) =>
                        formData.section_id
                          ? s.section_id === formData.section_id
                          : true,
                      )
                      .map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.full_name} ({student.roll_number || "N/A"})
                        </option>
                      ))}
                  </select>
                  {formErrors.student_id && (
                    <p className="text-red-400 text-sm mt-1">
                      {formErrors.student_id}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Employee Selection - Only for employee type */}
            {formData.user_type === "employee" && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Select Employee
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => {
                    const employeeId = e.target.value;
                    const employee = employees.find(
                      (emp) => emp.id === employeeId,
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
                  className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name}{" "}
                      {employee.employee_id ? `(${employee.employee_id})` : ""}
                    </option>
                  ))}
                </select>
                {formErrors.employee_id && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.employee_id}
                  </p>
                )}
              </div>
            )}

            {/* Password - Only for create */}
            {modalMode === "create" && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
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
                  className={`w-full px-3 py-2 bg-slate-700/40 border rounded-lg text-white text-sm focus:outline-none focus:ring-2 ${
                    formErrors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-600/50 focus:ring-indigo-500"
                  }`}
                />
                {formErrors.password && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>
            )}

            {/* Department/Store - Hidden for students */}
            {formData.user_type !== "student" && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Department / Store
                </label>
                <select
                  value={formData.department_store}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department_store: e.target.value,
                    })
                  }
                  disabled={
                    formData.user_type === "teacher" ||
                    formData.user_type === "employee"
                  }
                  className={`w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formData.user_type === "teacher" ||
                    formData.user_type === "employee"
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <option value="">-- None --</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.user_type === "teacher" ||
                  formData.user_type === "employee"
                    ? "Auto-selected from the chosen teacher/employee."
                    : "Optional — assign to a department or store."}
                </p>
              </div>
            )}

            {/* Authority Mode */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
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
                className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="role_access">Use Role Access</option>
                <option value="direct_access">Direct Access</option>
              </select>
            </div>

            {/* Module Access */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Module Access
              </label>
              {availableModules.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableModules.map((module) => (
                    <label
                      key={module}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-700/30 border border-slate-600/40 rounded-lg cursor-pointer hover:bg-slate-700/50 transition"
                    >
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
                        className="w-4 h-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-slate-600"
                      />
                      <span className="text-sm text-slate-300 capitalize">
                        {module}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No modules available. Please contact your administrator.
                </p>
              )}
            </div>

            {/* Roles Selection */}
            <RoleSelector
              selectedRoles={formData.role_ids}
              onChange={(role_ids) => setFormData({ ...formData, role_ids })}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium disabled:bg-slate-600 disabled:cursor-not-allowed transition"
            >
              {loading
                ? "Saving..."
                : modalMode === "create"
                  ? "Create User"
                  : "Update User"}
            </button>
          </form>
        </div>
      </SettingsModal>

      {/* Delete Confirmation Modal */}
      <SettingsModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User?"
        width="max-w-sm"
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Delete User?</h3>
          <p className="text-slate-400 mb-6 text-sm">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteUser(deleteConfirm)}
              disabled={loading}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-slate-600 transition"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </SettingsModal>
    </div>
  );
};

export default UsersStaff;
