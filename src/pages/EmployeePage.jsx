import { useState, useEffect } from "react";
import { employeesApi } from "../api/employeesApi";
import { getDepartments } from "../api/departmentsApi";
import { Plus, Edit, Trash2, X, Download, Eye } from "lucide-react";
import config from "../config/config";

const emptyEmployee = {
  employee_id: "",
  full_name: "",
  full_name_nepali: "",
  gender: "",
  date_of_birth: "",
  marital_status: "",
  nationality: "",
  blood_group: "",
  mobile_number: "",
  email_address: "",
  permanent_address: "",
  temporary_address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  photograph_url: "",
  citizenship_number: "",
  citizenship_issued_district: "",
  passport_number: "",
  driving_license_number: "",
  pan_number: "",
  date_of_joining: "",
  employee_status: "Permanent",
  department_id: "",
  designation: "",
  branch_office: "",
  reporting_supervisor: "",
  grade_level: "",
  employment_type: "Full-time",
  confirmation_date: "",
  basic_salary: "",
  dearness_allowance: "",
  other_allowances: {},
  gross_salary: "",
  bank_account_number: "",
  bank_name: "",
  bank_branch: "",
  ssf_number: "",
  cit_number: "",
  tax_deduction: "",
  ssf_contribution: "",
  net_salary: "",
  academic_qualification: "",
  university_board: "",
  passed_year: "",
  major_subject: "",
  percentage_cgpa: "",
};

const normalizeDateForInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.includes("T") ? value.slice(0, 10) : value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getDocumentUrl = (docUrl) => {
  if (!docUrl) return null;
  if (docUrl.startsWith("http")) return docUrl;
  return `${config.API_BASE_URL}${docUrl}`;
};

const getDepartmentName = (id, departments) =>
  departments.find((d) => d.id === id)?.name || "—";

const formatArrayValue = (value) =>
  Array.isArray(value) ? value.join(", ") : value || "—";

const handleDownloadDocument = async (employeeId, docUrl, docTitle) => {
  try {
    if (!docUrl) {
      console.error("No document URL available");
      return;
    }

    const filename = docUrl.split("/").pop();
    const downloadUrl = `${config.API_BASE_URL}/v1/employees/${employeeId}/download/${filename}`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = docTitle || "document";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Download failed:", err);
  }
};

export default function EmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [formData, setFormData] = useState(emptyEmployee);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewEmployee, setViewEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAllDocumentsModal, setShowAllDocumentsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      console.log("[EmployeePage] Loading employees...");
      const response = await employeesApi.getEmployees();
      console.log("[EmployeePage] API Response:", response.data);
      const data = response.data?.data || [];
      console.log("[EmployeePage] Employees loaded:", data.length, "employees");
      setEmployees(data);
    } catch (error) {
      console.error("[EmployeePage] Error loading employees:", error);
      console.error("[EmployeePage] Error response:", error.response?.data);
      showToast(
        error.response?.data?.message || "Failed to load employees",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data?.data || []);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateClick = () => {
    setFormData(emptyEmployee);
    setProfilePhoto(null);
    setProfilePhotoPreview("");
    setDocuments([]);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEditClick = (emp) => {
    setViewEmployee(emp);
    setFormData({
      ...emp,
      date_of_birth: normalizeDateForInput(emp.date_of_birth),
      date_of_joining: normalizeDateForInput(emp.date_of_joining),
      confirmation_date: normalizeDateForInput(emp.confirmation_date),
      citizenship_issued_date: normalizeDateForInput(
        emp.citizenship_issued_date,
      ),
      passport_expiry_date: normalizeDateForInput(emp.passport_expiry_date),
    });
    setProfilePhoto(null);
    setProfilePhotoPreview(emp.photograph_url || "");
    setDocuments([]);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      try {
        const url = URL.createObjectURL(file);
        setProfilePhotoPreview(url);
      } catch (e) {
        setProfilePhotoPreview("");
      }
    }
  };

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    setDocuments([...documents, ...files]);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.employee_id || !formData.full_name) {
        showToast("Employee ID and Full Name are required", "error");
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();

      // Append all text/non-object fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value === undefined || value === null || value === "") return;

        if (typeof value === "object" && !Array.isArray(value)) {
          // Only stringify if it's actually an object with properties
          if (Object.keys(value).length > 0) {
            formDataToSend.append(key, JSON.stringify(value));
          }
        } else if (typeof value !== "object") {
          // Append primitives directly
          formDataToSend.append(key, value);
        }
      });

      // Append file: photograph
      if (profilePhoto) {
        formDataToSend.append("photograph", profilePhoto);
      }

      // Append files: documents
      if (documents && documents.length > 0) {
        documents.forEach((doc) => {
          formDataToSend.append("documents", doc);
        });
      }

      if (modalMode === "create") {
        await employeesApi.createEmployee(formDataToSend);
        showToast("Employee created successfully!");
      } else {
        await employeesApi.updateEmployee(formData.id, formDataToSend);
        showToast("Employee updated successfully!");
      }

      setShowModal(false);
      setFormData(emptyEmployee);
      setProfilePhoto(null);
      setProfilePhotoPreview("");
      setDocuments([]);
      loadEmployees();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to save employee";
      showToast(msg, "error");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await employeesApi.deleteEmployee(deleteConfirm);
      showToast("Employee deleted successfully!");
      setDeleteConfirm(null);
      loadEmployees();
    } catch (error) {
      showToast("Failed to delete employee", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (emp) => {
    setViewEmployee(emp);
    setShowViewModal(true);
  };

  const printEmployeeInfo = () => {
    if (!viewEmployee) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Employee Profile</title>
  <style>
    body { font-family: Inter, Arial, Helvetica, sans-serif; color: #141414; margin: 20px; }
    .page { max-width: 900px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; }
    .badge { padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.35px; }
    .badge-active { background: #d1fae5; color: #065f46; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }
    .title-block { flex: 1; }
    .title-block h1 { margin: 0; font-size: 32px; letter-spacing: -0.03em; }
    .title-block p { margin: 8px 0 0; color: #475569; font-size: 14px; }
    .profile-photo { width: 110px; height: 110px; border-radius: 18px; object-fit: cover; border: 1px solid #e2e8f0; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
    .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; background: #ffffff; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04); }
    .section-title { margin: 0 0 14px; font-size: 18px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 20px; }
    .detail-row { display: flex; gap: 8px; align-items: baseline; }
    .detail-label { width: 170px; font-size: 13px; color: #475569; font-weight: 700; }
    .detail-value { font-size: 14px; color: #0f172a; }
    .full-width { grid-column: span 2; }
    .documents { margin: 0; padding-left: 18px; }
    .documents li { margin-bottom: 8px; }
    .print-footer { margin-top: 28px; padding-top: 18px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
    @media print {
      body { margin: 0; }
      .page { box-shadow: none; margin: 0; }
      .card { box-shadow: none; border: 1px solid #d1d5db; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header" style="align-items: center; gap: 18px;">
      ${viewEmployee.photograph_url ? `<img class="profile-photo" src="${getDocumentUrl(viewEmployee.photograph_url)}" alt="Profile photo" />` : ""}
      <div class="title-block">
        <h1>Employee Profile</h1>
        <p>${viewEmployee.full_name || "—"}</p>
      </div>
      <div class="badge ${viewEmployee.is_active ? "badge-active" : "badge-inactive"}">
        ${viewEmployee.is_active ? "Active" : "Inactive"}
      </div>
    </div>

    <div class="card">
      <div class="section-title">Personal Details</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Date of Birth</span><span class="detail-value">${viewEmployee.date_of_birth || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value">${viewEmployee.gender || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Blood Group</span><span class="detail-value">${viewEmployee.blood_group || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Nationality</span><span class="detail-value">${viewEmployee.nationality || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Marital Status</span><span class="detail-value">${viewEmployee.marital_status || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${viewEmployee.email_address || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Mobile</span><span class="detail-value">${viewEmployee.mobile_number || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Permanent Address</span><span class="detail-value">${viewEmployee.permanent_address || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Temporary Address</span><span class="detail-value">${viewEmployee.temporary_address || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Professional Information</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Designation</span><span class="detail-value">${viewEmployee.designation || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Department</span><span class="detail-value">${getDepartmentName(viewEmployee.department_id, departments)}</span></div>
        <div class="detail-row"><span class="detail-label">Employment Type</span><span class="detail-value">${viewEmployee.employment_type || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Date of Joining</span><span class="detail-value">${viewEmployee.date_of_joining || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Reporting Supervisor</span><span class="detail-value">${viewEmployee.reporting_supervisor || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Branch / Office</span><span class="detail-value">${viewEmployee.branch_office || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Qualification & Education</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Academic Qualification</span><span class="detail-value">${viewEmployee.academic_qualification || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">University/Board</span><span class="detail-value">${viewEmployee.university_board || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Passed Year</span><span class="detail-value">${viewEmployee.passed_year || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Major Subject</span><span class="detail-value">${viewEmployee.major_subject || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Legal / IDs</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Citizenship No.</span><span class="detail-value">${viewEmployee.citizenship_number || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Issued District</span><span class="detail-value">${viewEmployee.citizenship_issued_district || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Passport No.</span><span class="detail-value">${viewEmployee.passport_number || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Passport Expiry</span><span class="detail-value">${viewEmployee.passport_expiry_date || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">PAN</span><span class="detail-value">${viewEmployee.pan_number || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Banking & Salary</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Bank Name</span><span class="detail-value">${viewEmployee.bank_name || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Branch</span><span class="detail-value">${viewEmployee.bank_branch || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Account No.</span><span class="detail-value">${viewEmployee.bank_account_number || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Account Holder</span><span class="detail-value">${viewEmployee.bank_name || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Basic Salary</span><span class="detail-value">${viewEmployee.basic_salary || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Allowances</span><span class="detail-value">${viewEmployee.other_allowances ? JSON.stringify(viewEmployee.other_allowances) : "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Emergency Contact</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${viewEmployee.emergency_contact_name || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Relationship</span><span class="detail-value">${viewEmployee.emergency_contact_relationship || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${viewEmployee.emergency_contact_phone || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Address</span><span class="detail-value">${viewEmployee.permanent_address || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Documents</div>
      ${viewEmployee.documents && viewEmployee.documents.length ? `<ul class="documents">${viewEmployee.documents.map((doc) => `<li><strong>${doc.title || doc.filename || "Document"}:</strong> ${doc.url ? `<a href='${getDocumentUrl(doc.url)}' target='_blank'>${getDocumentUrl(doc.url)}</a>` : "No URL"}</li>`).join("")} </ul>` : "<div>No documents attached.</div>"}
    </div>

    <div class="print-footer">Generated on ${new Date().toLocaleDateString()} · Employee ID: ${viewEmployee.employee_id || "N/A"}</div>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg-main)" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--text-1)" }}
            >
              Employee Management
            </h1>
            <p className="mt-1" style={{ color: "var(--text-2)" }}>
              Manage employee records and information
            </p>
          </div>
          <button
            onClick={handleCreateClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Plus size={20} />
            Add Employee
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`p-4 rounded-lg ${
              toast.type === "error"
                ? "bg-red-500/20 text-red-300 border border-red-500/50"
                : "bg-green-500/20 text-green-300 border border-green-500/50"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search employees by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              color: "var(--text-1)",
            }}
          />
        </div>

        {/* Employees Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
          }}
        >
          <table className="w-full">
            <thead
              className="border-b"
              style={{
                borderBottom: "1px solid var(--border-card)",
                background: "var(--bg-card)",
              }}
            >
              <tr>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  Employee ID
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  Name
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  Designation
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  Department
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  Email
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    {loading ? "Loading..." : "No employees found"}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {emp.employee_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {emp.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {emp.designation || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {emp.department_name ||
                        departments.find((d) => d.id === emp.department_id)
                          ?.name ||
                        "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {emp.email_address || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          emp.is_active
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {emp.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => openViewModal(emp)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 hover:bg-slate-600 text-slate-300 rounded text-xs transition"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 hover:bg-slate-600 text-slate-300 rounded text-xs transition"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(emp.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900 z-10">
              <h2 className="text-2xl font-bold text-white">
                {modalMode === "create" ? "Add New Employee" : "Edit Employee"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto flex-1 p-6 space-y-6"
            >
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === "edit"}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white disabled:bg-slate-700/20 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Full Name (English) *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Full Name (Nepali)
                    </label>
                    <input
                      type="text"
                      name="full_name_nepali"
                      value={formData.full_name_nepali}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Marital Status
                    </label>
                    <select
                      name="marital_status"
                      value={formData.marital_status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Blood Group
                    </label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    >
                      <option value="">Select</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email_address"
                      value={formData.email_address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Permanent Address
                    </label>
                    <textarea
                      name="permanent_address"
                      value={formData.permanent_address}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Temporary Address
                    </label>
                    <textarea
                      name="temporary_address"
                      value={formData.temporary_address}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Photograph
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                    {profilePhoto && (
                      <p className="text-sm text-green-400 mt-1">
                        {profilePhoto.name}
                      </p>
                    )}
                    {(profilePhotoPreview || formData.photograph_url) && (
                      <img
                        src={
                          profilePhotoPreview ||
                          getDocumentUrl(formData.photograph_url)
                        }
                        alt="Employee"
                        className="mt-2 w-20 h-20 rounded object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Identification Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Identification Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Citizenship Number
                    </label>
                    <input
                      type="text"
                      name="citizenship_number"
                      value={formData.citizenship_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Citizenship Issued District
                    </label>
                    <input
                      type="text"
                      name="citizenship_issued_district"
                      value={formData.citizenship_issued_district}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      name="passport_number"
                      value={formData.passport_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Driving License Number
                    </label>
                    <input
                      type="text"
                      name="driving_license_number"
                      value={formData.driving_license_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Employment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Date of Joining
                    </label>
                    <input
                      type="date"
                      name="date_of_joining"
                      value={formData.date_of_joining}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Employee Status
                    </label>
                    <select
                      name="employee_status"
                      value={formData.employee_status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Probation">Probation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Branch/Office
                    </label>
                    <input
                      type="text"
                      name="branch_office"
                      value={formData.branch_office}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Reporting Supervisor
                    </label>
                    <input
                      type="text"
                      name="reporting_supervisor"
                      value={formData.reporting_supervisor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Grade/Level
                    </label>
                    <input
                      type="text"
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Employment Type
                    </label>
                    <select
                      name="employment_type"
                      value={formData.employment_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Confirmation Date
                    </label>
                    <input
                      type="date"
                      name="confirmation_date"
                      value={formData.confirmation_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Salary & Payroll Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Salary & Payroll Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Basic Salary
                    </label>
                    <input
                      type="number"
                      name="basic_salary"
                      value={formData.basic_salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Dearness Allowance
                    </label>
                    <input
                      type="number"
                      name="dearness_allowance"
                      value={formData.dearness_allowance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Gross Salary
                    </label>
                    <input
                      type="number"
                      name="gross_salary"
                      value={formData.gross_salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      name="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Bank Branch
                    </label>
                    <input
                      type="text"
                      name="bank_branch"
                      value={formData.bank_branch}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      SSF Number
                    </label>
                    <input
                      type="text"
                      name="ssf_number"
                      value={formData.ssf_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      CIT Number
                    </label>
                    <input
                      type="text"
                      name="cit_number"
                      value={formData.cit_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Tax Deduction
                    </label>
                    <input
                      type="number"
                      name="tax_deduction"
                      value={formData.tax_deduction}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      SSF Contribution
                    </label>
                    <input
                      type="number"
                      name="ssf_contribution"
                      value={formData.ssf_contribution}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Net Salary
                    </label>
                    <input
                      type="number"
                      name="net_salary"
                      value={formData.net_salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Education Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Education Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Academic Qualification
                    </label>
                    <input
                      type="text"
                      name="academic_qualification"
                      value={formData.academic_qualification}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      University/Board
                    </label>
                    <input
                      type="text"
                      name="university_board"
                      value={formData.university_board}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Passed Year
                    </label>
                    <input
                      type="text"
                      name="passed_year"
                      value={formData.passed_year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Major Subject
                    </label>
                    <input
                      type="text"
                      name="major_subject"
                      value={formData.major_subject}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Percentage/CGPA
                    </label>
                    <input
                      type="text"
                      name="percentage_cgpa"
                      value={formData.percentage_cgpa}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Documents
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Upload Documents
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleDocumentsChange}
                    className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600 rounded text-white"
                  />
                  {documents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-slate-700/30 p-2 rounded"
                        >
                          <span className="text-sm text-slate-300">
                            {doc.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDocument(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-700 pt-4 bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setProfilePhotoPreview("");
                  }}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-slate-600 transition"
                >
                  {loading
                    ? "Saving..."
                    : modalMode === "create"
                      ? "Create"
                      : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {viewEmployee.full_name || "Employee Details"}
                </h2>
                <p className="text-sm text-slate-400">
                  Employee profile and documents
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${viewEmployee.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {viewEmployee.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={printEmployeeInfo}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="col-span-1 flex flex-col items-center gap-4">
                  <div className="h-40 w-40 overflow-hidden rounded-full bg-slate-800">
                    {viewEmployee.photograph_url ? (
                      <img
                        src={getDocumentUrl(viewEmployee.photograph_url)}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">
                      {viewEmployee.full_name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {viewEmployee.designation || "—"}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                      <div className="text-xs text-slate-400">Email</div>
                      <div className="text-sm text-white">
                        {viewEmployee.email_address ||
                          viewEmployee.personal_email ||
                          "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                      <div className="text-xs text-slate-400">Phone</div>
                      <div className="text-sm text-white">
                        {viewEmployee.mobile_number ||
                          viewEmployee.personal_phone ||
                          "—"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                      <div className="text-xs text-slate-400">Department</div>
                      <div className="text-sm text-white">
                        {viewEmployee.department_name ||
                          departments.find(
                            (d) => d.id === viewEmployee.department_id,
                          )?.name ||
                          "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                      <div className="text-xs text-slate-400">Joined</div>
                      <div className="text-sm text-white">
                        {viewEmployee.date_of_joining || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Status</div>
                    <div className="text-sm text-white">
                      {viewEmployee.employee_status || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Documents
                </h3>
                <div className="mt-2 grid gap-2">
                  {(viewEmployee.documents || []).length === 0 ? (
                    <div className="text-sm text-slate-500">No documents</div>
                  ) : (
                    (viewEmployee.documents || []).map((d, i) => (
                      <div
                        key={d.id || i}
                        className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm text-white">
                            {d.title || d.filename || "Document"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {d.uploadedAt
                              ? new Date(d.uploadedAt).toLocaleString()
                              : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.url && (
                            <>
                              <a
                                href={getDocumentUrl(d.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-indigo-400 hover:underline"
                              >
                                View
                              </a>
                              <button
                                onClick={() =>
                                  handleDownloadDocument(
                                    viewEmployee.id,
                                    d.url,
                                    d.title || d.filename,
                                  )
                                }
                                className="text-sm text-slate-200"
                              >
                                Download
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6 grid gap-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Designation</div>
                    <div className="text-sm text-white">
                      {viewEmployee.designation || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">
                      Employment Type
                    </div>
                    <div className="text-sm text-white">
                      {viewEmployee.employment_type || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">
                      Reporting Supervisor
                    </div>
                    <div className="text-sm text-white">
                      {viewEmployee.reporting_supervisor || "—"}
                    </div>
                  </div>
                  <div className="md:col-span-3 rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">
                      Branch / Office
                    </div>
                    <div className="text-sm text-white">
                      {viewEmployee.branch_office || "—"}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Citizenship No</div>
                    <div className="text-sm text-white">
                      {viewEmployee.citizenship_number || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Passport No</div>
                    <div className="text-sm text-white">
                      {viewEmployee.passport_number || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">PAN</div>
                    <div className="text-sm text-white">
                      {viewEmployee.pan_number || "—"}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Bank</div>
                    <div className="text-sm text-white">
                      {viewEmployee.bank_name || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Branch</div>
                    <div className="text-sm text-white">
                      {viewEmployee.bank_branch || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Account No</div>
                    <div className="text-sm text-white">
                      {viewEmployee.bank_account_number || "—"}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Basic Salary</div>
                    <div className="text-sm text-white">
                      {viewEmployee.basic_salary || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Allowances</div>
                    <div className="text-sm text-white">
                      {viewEmployee.other_allowances
                        ? JSON.stringify(viewEmployee.other_allowances)
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">
                      Emergency Contact
                    </div>
                    <div className="text-sm text-white">
                      {viewEmployee.emergency_contact_name || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">
                      Emergency Phone / Relationship
                    </div>
                    <div className="text-sm text-white">
                      {(viewEmployee.emergency_contact_phone || "—") +
                        (viewEmployee.emergency_contact_relationship
                          ? " / " + viewEmployee.emergency_contact_relationship
                          : "")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 p-4 border-t border-slate-800/70">
                <button
                  onClick={() => setShowAllDocumentsModal(true)}
                  className="rounded-xl border border-slate-700/80 bg-slate-800 px-4 py-2 text-sm font-semibold text-indigo-400 hover:bg-slate-700 hover:text-indigo-300"
                >
                  View All Documents
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewEmployee(null);
                    }}
                    className="rounded-xl border border-slate-700/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditClick(viewEmployee);
                    }}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {showAllDocumentsModal && viewEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-950 shadow-2xl">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 px-6 py-4 sticky top-0 bg-slate-950">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          All Documents
                        </h2>
                        <p className="text-sm text-slate-400">
                          {viewEmployee.full_name} —{" "}
                          {(viewEmployee.documents || []).length} files
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAllDocumentsModal(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-6">
                      {(viewEmployee.documents || []).length === 0 ? (
                        <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-8 text-center">
                          <div className="text-slate-400">
                            No documents attached
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {(viewEmployee.documents || []).map((doc, idx) => (
                            <div
                              key={doc.id || idx}
                              className="rounded-xl border border-slate-700/80 bg-slate-900 p-4 hover:border-indigo-500/50 hover:bg-slate-900/80 transition"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-white truncate">
                                    {doc.title || doc.filename || "Document"}
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {doc.uploadedAt
                                      ? new Date(
                                          doc.uploadedAt,
                                        ).toLocaleString()
                                      : "No date"}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-2 break-all">
                                    {doc.url || "No URL"}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {doc.url && (
                                    <>
                                      <a
                                        href={getDocumentUrl(doc.url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 whitespace-nowrap"
                                      >
                                        View
                                      </a>
                                      <button
                                        onClick={() =>
                                          handleDownloadDocument(
                                            viewEmployee.id,
                                            doc.url,
                                            doc.title || "document",
                                          )
                                        }
                                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-800 whitespace-nowrap"
                                      >
                                        Download
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t border-slate-800/70 sticky bottom-0 bg-slate-950">
                      <button
                        onClick={() => setShowAllDocumentsModal(false)}
                        className="rounded-xl border border-slate-700/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Delete Employee?
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                Are you sure you want to delete this employee? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-slate-600 transition"
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
}
