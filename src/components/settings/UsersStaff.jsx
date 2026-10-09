import { useState, useEffect, useRef } from "react";
import { usersApi } from "../../api/usersApi";
import { teachersApi } from "../../api/teachersApi";
import { getStudents } from "../../api/studentsApi";
import { employeesApi } from "../../api/employeesApi";
import { sectionsApi } from "../../api/sectionsApi";
import { useRolesPermissions } from "../../context/RolesPermissionsContext";
import { RoleSelector } from "../common/RoleSelector";
import { Plus, Trash2, Edit, X } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import useSettingsInlinePanelLayout from "../../hooks/useSettingsInlinePanelLayout";

const DEFAULT_MODULE_ACCESS = [
  "dashboard",
  "calendar",
  "attendance",
  "teacher",
  "student",
  "employee",
  "results",
  "result_portal",
  "daily_reports",
  "leave_management",
  "accounts",
  "settings",
];

const UsersStaff = () => {
  const layoutRef = useRef(null);
  const { fetchRoles, roles: availableRoles } = useRolesPermissions();

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
  const [notice, setNotice] = useState(null);
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

  const getStudentPortalModules = () => [
    "dashboard",
    "attendance",
    "results",
    "profile",
    "notices",
  ];

  const getStudentRoleIds = (roleList = availableRoles) => {
    const studentRole = (roleList || []).find(
      (role) => (role.role_name || "").toLowerCase() === "student",
    );

    return studentRole ? [studentRole.id] : [];
  };

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
      setAvailableModules(DEFAULT_MODULE_ACCESS);
    } catch (err) {
      console.error("Failed to load available modules:", err);
      // Fallback to default modules
      setAvailableModules(DEFAULT_MODULE_ACCESS);
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

    if (formData.user_type === "student") {
      const selectedStudent = students.find(
        (student) => student.id === formData.student_id,
      );
      const linkedEmail = (
        selectedStudent?.student_mail ||
        selectedStudent?.school_email ||
        selectedStudent?.email ||
        ""
      )
        .trim()
        .toLowerCase();

      if (linkedEmail && formData.email.trim().toLowerCase() !== linkedEmail) {
        newErrors.email =
          "Student login email must match the selected student's registered email.";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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

      const response = await usersApi.createUser(payload);
      setNotice(
        response.invitation?.email_sent
          ? {
              success: true,
              message: `Portal setup email sent to ${formData.email}.`,
            }
          : {
              success: false,
              message:
                "The user was created, but the setup email could not be sent. Check Settings > Integrations and the server email logs.",
            },
      );

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
    setShowModal(true);
  };

  const selectedStudent =
    formData.user_type === "student" && formData.student_id
      ? students.find((student) => student.id === formData.student_id)
      : null;

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
  const isEditingUser = showModal && modalMode === "edit";
  const editPanelStyle = useSettingsInlinePanelLayout(isEditingUser, layoutRef);

  return (
    <div
      ref={layoutRef}
      data-settings-screen="users"
      className={`entity-admin-page relative min-w-0 rounded-2xl border border-default bg-subtle p-4 ${isEditingUser ? "is-editing flex h-[calc(100dvh-5rem)] min-h-128 w-full flex-col overflow-visible max-md:h-auto max-md:min-h-0" : "flex h-full min-h-0 w-full flex-col"}`}
    >
      <div
        className={`w-full min-w-0 ${isEditingUser ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" : "flex min-h-0 flex-1 flex-col"}`}
      >
      {/* Header */}
      <div>
        <h2 className="text-[28px] font-bold text-primary">Users & Staff</h2>
        <p className="mt-1 text-sm text-muted">
          Create users, assign roles, and send secure portal setup links
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-danger-soft border border-danger rounded-lg flex justify-between items-center">
          <span className="text-sm text-danger">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-danger hover:text-danger"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${notice.success ? "border-success bg-success text-success" : "border-warning bg-warning-soft text-warning"}`}
        >
          {notice.message}
        </div>
      )}

      {/* Search and Create */}
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-default pb-3">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search users and staff"
          className="min-w-48 flex-1 rounded-lg border border-default bg-subtle px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-focus"
        />
        <button
          onClick={openCreateModal}
          className="settings-admin-create-button bg-accent text-primary transition hover:bg-accent"
        >
          <Plus size={16} />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="min-h-0 flex-1 overflow-hidden">
      <div className={`entity-admin-list h-full min-w-0 rounded-lg border border-default ${isEditingUser ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "overflow-auto"}`}>
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-muted bg-subtle">
            {loading
              ? "Loading users..."
              : "No users found. Create one to get started!"}
          </div>
        ) : (
          <table className="w-full min-w-0 table-fixed text-sm">
            <thead className="bg-subtle border-b border-default">
              <tr>
                <th className="px-4 py-3 text-left text-muted font-medium">
                  User
                </th>
                <th className="px-4 py-3 text-left text-muted font-medium">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-muted font-medium">
                  Roles
                </th>
                <th className="px-4 py-3 text-center text-muted font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-subtle transition">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-primary">
                        {user.name || "—"}
                      </span>
                      <div className="text-xs text-muted">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {user.phone || <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role.id}
                            className="inline-block bg-accent-soft text-accent px-2.5 py-1 rounded-full text-xs font-medium"
                          >
                            {role.role_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted italic text-xs">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-success text-success"
                          : "bg-danger-soft text-danger"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="rounded p-2 text-accent transition hover:bg-accent-soft hover:text-accent"
                      title={`Edit ${user.name || user.email}`}
                      aria-label={`Edit ${user.name || user.email}`}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="rounded p-2 text-danger transition hover:bg-danger-soft hover:text-danger"
                      title={`Delete ${user.name || user.email}`}
                      aria-label={`Delete ${user.name || user.email}`}
                    >
                      <Trash2 size={16} />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
      </div>

      {/* User Form Modal */}
      <SettingsModal
        open={showModal}
        onClose={closeModal}
        title={modalMode === "create" ? "Create New User" : "Edit User"}
        width="max-w-md"
        inlinePanel={isEditingUser}
        inlinePanelClassName="entity-edit-panel settings-inline-edit-panel"
        inlinePanelStyle={editPanelStyle}
        inlinePanelSurfaceClassName="rounded-xl border border-default shadow-lg"
        inlinePanelSurfaceStyle={{ background: "var(--bg-card)" }}
        inlinePanelHeaderClassName="entity-edit-header min-h-11 items-center px-5 py-2"
        inlinePanelBodyClassName="entity-edit-body px-5 py-4"
      >
        <div className="min-h-full">
          <form
            onSubmit={
              modalMode === "create" ? handleCreateUser : handleEditUser
            }
            className="space-y-4"
          >
            {/* User Type - AT THE TOP */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
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
                          module_access: [],
                          role_ids: [],
                        };
                        if (e.target.value === "student") {
                          newFormData.module_access = getStudentPortalModules();
                          newFormData.role_ids = getStudentRoleIds();
                        }
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
                    <span className="text-sm text-primary">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
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
                disabled={
                  formData.user_type === "teacher" ||
                  formData.user_type === "student"
                }
                className={`w-full px-3 py-2 bg-subtle border border-default rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus ${formData.user_type === "teacher" || formData.user_type === "student" ? "bg-subtle text-muted cursor-not-allowed" : ""}`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
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
                disabled={
                  formData.user_type === "teacher" ||
                  formData.user_type === "student"
                }
                className={`w-full px-3 py-2 bg-subtle border rounded-lg text-primary text-sm focus:outline-none focus:ring-2 ${
                  formErrors.email
                    ? "border-danger focus:ring-focus"
                    : "border-default focus:ring-focus"
                } ${formData.user_type === "teacher" || formData.user_type === "student" ? "bg-subtle text-muted cursor-not-allowed" : ""}`}
              />
              {formErrors.email && (
                <p className="text-danger text-sm mt-1">{formErrors.email}</p>
              )}
              {selectedStudent && (
                <p className="text-xs text-success mt-1">
                  Student portal login will use the linked email:{" "}
                  {selectedStudent.student_mail ||
                    selectedStudent.school_email ||
                    "not provided"}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
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
                disabled={
                  formData.user_type === "teacher" ||
                  formData.user_type === "student"
                }
                className={`w-full px-3 py-2 bg-subtle border border-default rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus ${formData.user_type === "teacher" || formData.user_type === "student" ? "bg-subtle text-muted cursor-not-allowed" : ""}`}
              />
            </div>

            {formData.user_type === "teacher" && (
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
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
                  className="w-full px-3 py-2 bg-subtle border border-default rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus"
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
                  <p className="text-danger text-sm mt-1">
                    {formErrors.teacher_id}
                  </p>
                )}
              </div>
            )}

            {/* Student Selection - Only for student type */}
            {formData.user_type === "student" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
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
                    className="w-full px-3 py-2 bg-subtle border border-default rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus"
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
                  <label className="block text-sm font-medium text-primary mb-2">
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
                        nextState.email =
                          student.student_mail ||
                          student.school_email ||
                          student.email ||
                          nextState.email;
                        nextState.phone = student.phone_no || nextState.phone;
                        nextState.module_access = getStudentPortalModules();
                        nextState.role_ids = getStudentRoleIds();
                      }
                      setFormData(nextState);
                    }}
                    className="w-full px-3 py-2 bg-subtle border border-default rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus"
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
                    <p className="text-danger text-sm mt-1">
                      {formErrors.student_id}
                    </p>
                  )}
                  {selectedStudent && (
                    <p className="text-xs text-success mt-2">
                      Student access will be created using the student portal
                      login email and the default student permissions.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Employee Selection - Only for employee type */}
            {formData.user_type === "employee" && (
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
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
                  className="w-full px-3 py-2 bg-subtle border border-default rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus"
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
                  <p className="text-danger text-sm mt-1">
                    {formErrors.employee_id}
                  </p>
                )}
              </div>
            )}

            {/* New users set their password through the secure email link. */}
            {modalMode === "create" && (
              <p className="rounded-lg border border-accent bg-accent-soft px-3 py-2 text-xs leading-5 text-muted">
                The user will receive a secure link to set their password and
                sign in to this school portal.
              </p>
            )}

            {/* Department/Store - Hidden for students */}
            {formData.user_type !== "student" && (
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
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
                  className={`w-full px-3 py-2 bg-subtle border border-default rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus ${
                    formData.user_type === "teacher" ||
                    formData.user_type === "employee"
                      ? "bg-subtle text-muted cursor-not-allowed"
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
                <p className="text-xs text-muted mt-1">
                  {formData.user_type === "teacher" ||
                  formData.user_type === "employee"
                    ? "Auto-selected from the chosen teacher/employee."
                    : "Optional — assign to a department or store."}
                </p>
              </div>
            )}

            {/* Authority Mode */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
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
                className="w-full px-3 py-2 bg-subtle border border-default rounded-lg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="role_access">Use Role Access</option>
                <option value="direct_access">Direct Access</option>
              </select>
            </div>

            {/* Module Access */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Module Access
              </label>
              {availableModules.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableModules.map((module) => (
                    <label
                      key={module}
                      className="flex items-center gap-2 px-3 py-2 bg-subtle border border-default rounded-lg cursor-pointer hover:bg-subtle transition"
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
                        className="w-4 h-4 rounded border-default text-accent focus:ring-focus bg-selected"
                      />
                      <span className="text-sm text-muted capitalize">
                        {module}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
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
              className="w-full bg-accent hover:bg-accent text-primary py-2 px-4 rounded-lg font-medium disabled:bg-selected disabled:cursor-not-allowed transition"
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
          <h3 className="text-lg font-bold text-primary mb-4">Delete User?</h3>
          <p className="text-muted mb-6 text-sm">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm bg-subtle hover:bg-selected text-primary rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteUser(deleteConfirm)}
              disabled={loading}
              className="px-4 py-2 text-sm bg-danger hover:bg-danger text-primary rounded-lg disabled:bg-selected transition"
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
