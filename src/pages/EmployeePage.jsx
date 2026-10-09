import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { employeesApi } from "../api/employeesApi";
import { getDepartments } from "../api/departmentsApi";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Download,
  Eye,
  ArrowUpDown,
  GripVertical,
  Power,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import config from "../config/config";
import RecordTableToolbar from "../components/common/RecordTableToolbar";

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

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  if (value || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
};

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
  const splitLayoutRef = useRef(null);
  const employeeTableViewportRef = useRef(null);
  const employeeImportRef = useRef(null);
  const [editPanelBounds, setEditPanelBounds] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activeEmployeeSection, setActiveEmployeeSection] = useState("personal");
  const [formData, setFormData] = useState(emptyEmployee);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [visibleEmployeeColumns, setVisibleEmployeeColumns] = useState([
    "full_name",
    "status",
  ]);
  const [employeeSort, setEmployeeSort] = useState({
    key: "employee_id",
    direction: "asc",
  });
  const [employeePageSize, setEmployeePageSize] = useState(10);
  const [employeeCurrentPage, setEmployeeCurrentPage] = useState(1);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
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
      const response = await employeesApi.getEmployees({ is_active: "all" });
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

  const handleEmployeeImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    let importedCount = 0;

    try {
      setLoading(true);
      const rows = parseCsv(await file.text());
      if (rows.length < 2) {
        throw new Error("The CSV must include a header and at least one employee.");
      }

      const headers = rows[0].map((header, index) =>
        header.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_") ||
        `column_${index}`,
      );
      const employeesToCreate = rows.slice(1).map((row) => {
        const employee = {};
        headers.forEach((header, index) => {
          const key =
            header === "id"
              ? "employee_id"
              : header === "name"
                ? "full_name"
                : header === "email"
                  ? "email_address"
                  : header === "active"
                    ? "is_active"
                    : header;
          const value = (row[index] || "").trim();
          if (Object.hasOwn(emptyEmployee, key) && value) employee[key] = value;
          if (key === "is_active" && value) {
            employee.is_active = ["true", "1", "yes", "active"].includes(
              value.toLowerCase(),
            );
          }
        });
        return employee;
      });
      const invalidRow = employeesToCreate.findIndex(
        (employee) => !employee.employee_id || !employee.full_name,
      );
      if (invalidRow >= 0) {
        throw new Error(
          `CSV row ${invalidRow + 2} must include employee_id and full_name.`,
        );
      }

      for (let index = 0; index < employeesToCreate.length; index += 1) {
        try {
          await employeesApi.createEmployee(employeesToCreate[index]);
          importedCount += 1;
        } catch (error) {
          throw new Error(
            `Import stopped at CSV row ${index + 2}: ${
              error.response?.data?.message || error.message
            }`,
          );
        }
      }
      const response = await employeesApi.getEmployees({ is_active: "all" });
      setEmployees(response.data?.data || []);
      showToast(`${employeesToCreate.length} employees imported successfully.`);
    } catch (error) {
      console.error("Employee CSV import failed:", error);
      let message = error.message || "Unable to import employees.";
      if (importedCount > 0) {
        try {
          const response = await employeesApi.getEmployees({ is_active: "all" });
          setEmployees(response.data?.data || []);
          message += ` ${importedCount} earlier rows were imported.`;
        } catch (refreshError) {
          console.error("Could not refresh employees after partial import:", refreshError);
          message += ` ${importedCount} rows were imported, but the employee list could not be refreshed.`;
        }
      }
      showToast(message, "error");
    } finally {
      event.target.value = "";
      setLoading(false);
    }
  };

  const exportEmployeesCsv = () => {
    const fields = [
      ["employee_id", "Employee ID"],
      ["full_name", "Full Name"],
      ["email_address", "Email"],
      ["designation", "Designation"],
      ["department_id", "Department ID"],
      ["is_active", "Active"],
    ];
    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const content = [
      fields.map(([, label]) => escapeCsv(label)).join(","),
      ...filteredEmployees.map((employee) =>
        fields.map(([field]) => escapeCsv(employee[field])).join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();
    URL.revokeObjectURL(url);
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
    setActiveEmployeeSection("personal");
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

  const toggleEmployeeStatus = async (employee) => {
    try {
      await employeesApi.updateEmployee(employee.id, {
        is_active: !employee.is_active,
      });
      showToast(
        `Employee ${employee.is_active ? "deactivated" : "activated"}.`,
      );
      await loadEmployees();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update employee status",
        "error",
      );
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

  const renderEmployeeIdentity = (employee) => (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-500/15 text-xs font-semibold text-teal-200">
        {employee.photograph_url ? (
          <img src={getDocumentUrl(employee.photograph_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          (employee.full_name || "E")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join("")
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-100">{employee.full_name}</div>
        <div className="truncate text-xs text-slate-400">{employee.email_address || "—"}</div>
      </div>
    </div>
  );

  const employeeColumns = [
    {
      key: "employee_id",
      label: "ID",
      value: (employee) => employee.employee_id,
    },
    {
      key: "full_name",
      label: "Name",
      value: (employee) => employee.full_name,
      render: renderEmployeeIdentity,
    },
    {
      key: "designation",
      label: "Designation",
      value: (employee) => employee.designation,
    },
    {
      key: "department",
      label: "Department",
      value: (employee) =>
        employee.department_name ||
        getDepartmentName(employee.department_id, departments),
    },
    {
      key: "email_address",
      label: "Email",
      value: (employee) => employee.email_address,
    },
    {
      key: "status",
      label: "Status",
      value: (employee) => employee.is_active,
      render: (employee) => (
        <span
          className={`entity-status-pill inline-block rounded-full px-3 py-1 text-xs font-medium ${employee.is_active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
        >
          {employee.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];
  const filteredEmployees = employees.filter((employee) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [employee.full_name, employee.employee_id, employee.email_address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    const matchesStatus =
      employeeStatusFilter === "all" ||
      (employee.is_active ? "active" : "inactive") === employeeStatusFilter;
    const matchesDepartment =
      departmentFilter === "all" ||
      String(employee.department_id || "") === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });
  const isEditingEmployee = showModal && modalMode === "edit";
  useLayoutEffect(() => {
    if (!isEditingEmployee) {
      setEditPanelBounds(null);
      return undefined;
    }

    const updateEditPanelBounds = () => {
      const layout = splitLayoutRef.current;
      const tableViewport = employeeTableViewportRef.current;
      if (!layout || !tableViewport) return;

      if (window.innerWidth < 768) {
        setEditPanelBounds(null);
        return;
      }

      const layoutBounds = layout.getBoundingClientRect();
      const tableBounds = tableViewport.getBoundingClientRect();
      setEditPanelBounds({
        top: tableBounds.top - layoutBounds.top,
        height: Math.max(
          tableBounds.height,
          window.innerHeight - tableBounds.top - 16,
        ),
      });
    };

    updateEditPanelBounds();
    const resizeObserver = new ResizeObserver(updateEditPanelBounds);
    if (splitLayoutRef.current) resizeObserver.observe(splitLayoutRef.current);
    if (employeeTableViewportRef.current) {
      resizeObserver.observe(employeeTableViewportRef.current);
    }
    window.addEventListener("resize", updateEditPanelBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateEditPanelBounds);
    };
  }, [isEditingEmployee]);
  const displayedEmployeeColumns = isEditingEmployee
    ? [
        {
          key: "employee",
          label: "Employee",
          value: (employee) => employee.full_name,
          render: (employee) => (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-500/15 text-[10px] font-semibold text-teal-200">
                {employee.photograph_url ? (
                  <img
                    src={getDocumentUrl(employee.photograph_url)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (employee.full_name || "E")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0].toUpperCase())
                    .join("")
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-100">
                  {employee.full_name}
                </div>
                <div className="truncate text-xs text-slate-400">
                  {employee.email_address || "—"}
                </div>
              </div>
            </div>
          ),
        },
        employeeColumns.find((column) => column.key === "status"),
      ]
    : employeeColumns.filter((column) =>
        visibleEmployeeColumns.includes(column.key),
      );
  const sortedEmployees = [...filteredEmployees].sort((first, second) => {
    const column = employeeColumns.find(
      (item) => item.key === employeeSort.key,
    );
    if (!column) return 0;
    const firstValue = column.value(first) ?? "";
    const secondValue = column.value(second) ?? "";
    const comparison =
      typeof firstValue === "number" && typeof secondValue === "number"
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue), undefined, {
            numeric: true,
            sensitivity: "base",
          });
    return employeeSort.direction === "asc" ? comparison : -comparison;
  });
  const employeePageCount = Math.max(
    1,
    Math.ceil(sortedEmployees.length / employeePageSize),
  );
  const visibleEmployeePage = Math.min(employeeCurrentPage, employeePageCount);
  const pageEmployees = sortedEmployees.slice(
    (visibleEmployeePage - 1) * employeePageSize,
    visibleEmployeePage * employeePageSize,
  );
  const firstEmployeeRecord = sortedEmployees.length
    ? (visibleEmployeePage - 1) * employeePageSize + 1
    : 0;
  const lastEmployeeRecord = Math.min(
    visibleEmployeePage * employeePageSize,
    sortedEmployees.length,
  );
  return (
    <div
      ref={splitLayoutRef}
      className={`entity-admin-page ${isEditingEmployee ? "is-editing relative flex h-[calc(100dvh-5rem)] min-h-128 w-full flex-col overflow-visible p-4 max-md:h-auto max-md:min-h-0" : "min-h-screen p-4"}`}
    >
      <div
        className={`${isEditingEmployee ? "flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden" : "w-full min-w-0 space-y-6"}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1
              className="text-[28px] font-bold"
              style={{ color: "var(--text-1)" }}
            >
              Manage Employees
            </h1>
            <p className="mt-1" style={{ color: "var(--text-2)" }}>
              Manage employee records and information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={employeeImportRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleEmployeeImport}
              className="hidden"
              aria-label="Choose employee CSV file"
            />
            <button
              type="button"
              onClick={() => employeeImportRef.current?.click()}
              className="entity-admin-button inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              <Upload size={16} /> Import
            </button>
            <button
              onClick={handleCreateClick}
              className="entity-admin-button flex items-center gap-2 rounded-lg bg-teal-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
            >
              <Plus size={17} /> Add
            </button>
          </div>
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

        {/* Employees Table */}
        <div
          className="entity-admin-card flex min-h-0 flex-1 flex-col overflow-visible rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
          }}
        >
          <RecordTableToolbar
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setEmployeeCurrentPage(1);
            }}
            searchPlaceholder="Search employees..."
            columns={employeeColumns}
            visibleColumns={visibleEmployeeColumns}
            onToggleColumn={(key) =>
              setVisibleEmployeeColumns((current) =>
                current.includes(key)
                  ? current.filter((columnKey) => columnKey !== key)
                  : [...current, key],
              )
            }
            filterContent={
              <>
                <label className="record-table-filter-field">
                  Status
                  <select
                    value={employeeStatusFilter}
                    onChange={(event) => {
                      setEmployeeStatusFilter(event.target.value);
                      setEmployeeCurrentPage(1);
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label className="record-table-filter-field">
                  Department
                  <select
                    value={departmentFilter}
                    onChange={(event) => {
                      setDepartmentFilter(event.target.value);
                      setEmployeeCurrentPage(1);
                    }}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="all">All departments</option>
                    {departments.map((department) => (
                      <option key={department.id} value={String(department.id)}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmployeeStatusFilter("all");
                    setDepartmentFilter("all");
                    setEmployeeCurrentPage(1);
                  }}
                  className="justify-self-start text-xs text-indigo-300 hover:text-indigo-200"
                >
                  Clear filters
                </button>
              </>
            }
            views={[
              {
                label: "All employees",
                onSelect: () => {
                  setEmployeeStatusFilter("all");
                  setEmployeeCurrentPage(1);
                },
              },
              {
                label: "Active employees",
                onSelect: () => {
                  setEmployeeStatusFilter("active");
                  setEmployeeCurrentPage(1);
                },
              },
              {
                label: "Inactive employees",
                onSelect: () => {
                  setEmployeeStatusFilter("inactive");
                  setEmployeeCurrentPage(1);
                },
              },
            ]}
            recordCount={filteredEmployees.length}
            rightContent={
              <button
                type="button"
                onClick={exportEmployeesCsv}
                className="entity-admin-button inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 hover:bg-slate-800"
              >
                <Download size={16} /> Export CSV
              </button>
            }
          />
          <div
            ref={employeeTableViewportRef}
            className={`entity-admin-list min-h-0 flex-1 ${isEditingEmployee ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "overflow-auto"}`}
          >
            <table
              className="w-full min-w-0 table-fixed"
            >
              <thead
                className="sticky top-0 z-10 border-b"
                style={{
                  borderBottom: "1px solid var(--border-card)",
                  background: "var(--bg-card)",
                }}
              >
                <tr>
                  {!isEditingEmployee && (
                    <th className="w-16 px-3 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-2">
                        <GripVertical
                          size={14}
                          className="shrink-0 text-slate-500"
                          aria-hidden="true"
                        />
                        <input
                          type="checkbox"
                          aria-label="Select all visible employees"
                          checked={
                            pageEmployees.length > 0 &&
                            pageEmployees.every((employee) =>
                              selectedEmployeeIds.includes(employee.id),
                            )
                          }
                          onChange={(event) =>
                            setSelectedEmployeeIds((current) =>
                              event.target.checked
                                ? Array.from(
                                    new Set([
                                      ...current,
                                      ...pageEmployees.map(
                                        (employee) => employee.id,
                                      ),
                                    ]),
                                  )
                                : current.filter(
                                    (id) =>
                                      !pageEmployees.some(
                                        (employee) => employee.id === id,
                                      ),
                                  ),
                            )
                          }
                          className="record-selection-checkbox"
                        />
                      </div>
                    </th>
                  )}
                  {displayedEmployeeColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-4 text-left text-xs font-semibold uppercase tracking-wide ${isEditingEmployee ? (column.key === "status" ? "w-24" : "") : "px-4"}`}
                      style={{ color: "var(--text-2)" }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setEmployeeSort((current) => ({
                            key: column.key,
                            direction:
                              current.key === column.key &&
                              current.direction === "asc"
                                ? "desc"
                                : "asc",
                          }))
                        }
                        className="inline-flex items-center gap-1 hover:text-white"
                      >
                        {column.label}
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                  ))}
                  <th
                    className={`px-2 py-4 text-center text-xs font-semibold ${isEditingEmployee ? "w-28" : "px-6 text-sm"}`}
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
                      colSpan={
                        displayedEmployeeColumns.length +
                        (isEditingEmployee ? 1 : 2)
                      }
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      {loading ? "Loading..." : "No employees found"}
                    </td>
                  </tr>
                ) : (
                  pageEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className={`entity-admin-table-row transition hover:bg-slate-800/30 ${isEditingEmployee && formData.id === emp.id ? "entity-admin-selected-row border-l-2 border-l-teal-400 bg-teal-500/10" : ""}`}
                    >
                      {!isEditingEmployee && (
                        <td className="w-16 px-3 py-4 text-center">
                          <div className="inline-flex items-center gap-2 text-slate-500">
                            <GripVertical size={14} aria-hidden="true" />
                            <input
                              type="checkbox"
                              aria-label={`Select ${emp.full_name}`}
                              checked={selectedEmployeeIds.includes(emp.id)}
                              onChange={(event) =>
                                setSelectedEmployeeIds((current) =>
                                  event.target.checked
                                    ? [...current, emp.id]
                                    : current.filter((id) => id !== emp.id),
                                )
                              }
                              className="record-selection-checkbox"
                            />
                          </div>
                        </td>
                      )}
                      {displayedEmployeeColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-2 py-4 text-sm text-slate-300 ${isEditingEmployee ? "truncate" : "px-4"}`}
                        >
                          {column.render
                            ? column.render(emp)
                            : column.value(emp) || "—"}
                        </td>
                      ))}
                      <td
                        className={`py-3 text-center ${
                          isEditingEmployee ? "px-1" : "px-6"
                        }`}
                      >
                        <div className="inline-flex flex-nowrap items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openViewModal(emp)}
                            title="View employee"
                            aria-label={`View ${emp.full_name}`}
                            className={`entity-admin-icon-button inline-flex shrink-0 items-center justify-center rounded text-slate-300 transition hover:bg-slate-600 ${
                              isEditingEmployee ? "p-1.5" : "p-2"
                            }`}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditClick(emp)}
                            title="Edit employee"
                            aria-label={`Edit ${emp.full_name}`}
                            className={`entity-admin-icon-button inline-flex shrink-0 items-center justify-center rounded text-slate-300 transition hover:bg-slate-600 ${
                              isEditingEmployee ? "p-1.5" : "p-2"
                            }`}
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleEmployeeStatus(emp)}
                            title={
                              emp.is_active
                                ? "Deactivate employee"
                                : "Activate employee"
                            }
                            aria-label={
                              emp.is_active
                                ? "Deactivate employee"
                                : "Activate employee"
                            }
                            className={`entity-admin-icon-button inline-flex shrink-0 items-center justify-center rounded transition ${emp.is_active ? "text-red-300 hover:bg-red-500/10" : "text-green-300 hover:bg-green-500/10"}`}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(emp.id)}
                            title="Delete employee"
                            aria-label={`Delete ${emp.full_name}`}
                            className={`entity-admin-icon-button inline-flex shrink-0 items-center justify-center rounded text-red-300 transition hover:bg-red-500/30 ${
                              isEditingEmployee ? "p-1.5" : "p-2"
                            }`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div
            className={`entity-admin-list-footer flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-3 py-3 text-xs text-slate-400 ${isEditingEmployee ? "w-full border-slate-700/60 bg-[var(--bg-card)] md:w-1/2" : "w-full"}`}
            style={
              isEditingEmployee
                ? undefined
                : {
                    borderColor: "var(--border-card)",
                    background: "var(--bg-card)",
                  }
            }
          >
            <label className="flex items-center gap-2">
              Rows per page
              <select
                value={employeePageSize}
                onChange={(event) => {
                  setEmployeePageSize(Number(event.target.value));
                  setEmployeeCurrentPage(1);
                }}
                className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-3">
              <span>
                {sortedEmployees.length} records
              </span>
              <span>
                Page {visibleEmployeePage} of {employeePageCount}
              </span>
              <div className="flex items-center gap-1">
                {[
                  { label: "First page", Icon: ChevronsLeft, page: 1 },
                  {
                    label: "Previous page",
                    Icon: ChevronLeft,
                    page: visibleEmployeePage - 1,
                  },
                  {
                    label: "Next page",
                    Icon: ChevronRight,
                    page: visibleEmployeePage + 1,
                  },
                  {
                    label: "Last page",
                    Icon: ChevronsRight,
                    page: employeePageCount,
                  },
                ].map(({ label, Icon, page }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    title={label}
                    disabled={
                      label.includes("First") || label.includes("Previous")
                        ? visibleEmployeePage === 1
                        : visibleEmployeePage === employeePageCount
                    }
                    onClick={() => setEmployeeCurrentPage(page)}
                    className="rounded border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={
            modalMode === "edit" && editPanelBounds
              ? {
                  position: "absolute",
                  right: 0,
                  width: "min(560px, calc(100% - 300px))",
                  top: `${editPanelBounds.top}px`,
                  height: `${editPanelBounds.height}px`,
                  zIndex: 20,
                }
              : undefined
          }
          className={`${modalMode === "edit" ? "entity-edit-panel min-h-0 min-w-0" : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"}`}
        >
          <div
            className={`${modalMode === "edit" ? "flex h-full min-h-0 w-full min-w-0 max-w-none flex-col rounded-xl border border-slate-700/70 bg-slate-900/70 shadow-lg" : "flex max-h-[95vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-700/70 bg-slate-950 shadow-2xl"} overflow-hidden`}
          >
            <div className={`${modalMode === "edit" ? "entity-edit-header flex h-11 shrink-0 items-center px-5" : "flex shrink-0 items-start px-6 py-5 sm:px-8"} justify-between gap-4 border-b border-slate-800/70`}>
              <div className="min-w-0 flex-1">
                <h2 className={`${modalMode === "edit" ? "text-sm uppercase tracking-wide" : "text-2xl"} font-semibold text-white`}>
                  {modalMode === "create" ? "Create New Employee" : `EDIT EMPLOYEE · ${formData.full_name}`}
                </h2>
                {modalMode === "create" && (
                  <p className="mt-1 text-sm text-slate-400">
                    Fill in the employee's personal, contact, employment, and document details.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close employee editor"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {modalMode === "edit" && (
              <nav
                aria-label="Employee form sections"
                className="entity-edit-tabs flex shrink-0 gap-5 overflow-x-auto border-b border-slate-800/70 px-5"
              >
                {[
                  { label: "Personal", id: "personal", target: "employee-personal" },
                  { label: "Contact", id: "contact", target: "employee-contact" },
                  {
                    label: "Employment",
                    id: "employment",
                    target: "employee-employment",
                  },
                  {
                    label: "Documents",
                    id: "documents",
                    target: "employee-documents",
                  },
                ].map(({ label, id, target }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveEmployeeSection(id);
                      document.getElementById(target)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    aria-current={
                      activeEmployeeSection === id ? "location" : undefined
                    }
                    className={`shrink-0 border-b-2 px-0.5 py-3 text-sm transition ${
                      activeEmployeeSection === id
                        ? "border-teal-400 text-teal-300"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            )}

            <form
              id="employee-edit-form"
              onSubmit={handleSubmit}
              className={`min-h-0 flex-1 ${modalMode === "edit" ? "entity-edit-form employee-edit-form space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5" : "entity-create-form mx-auto w-full max-w-5xl space-y-5 overflow-y-auto px-4 py-5 sm:px-6"}`}
            >
              {/* Personal Information */}
              <div className={modalMode === "edit" ? "employee-edit-card" : "employee-create-section"}>
                <h3 id="employee-personal" className="scroll-mt-4 text-base font-semibold text-white mb-3">
                  Personal Information
                </h3>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-700 bg-teal-500/15 text-sm font-semibold text-teal-200">
                    {profilePhotoPreview || formData.photograph_url ? (
                      <img
                        src={
                          profilePhotoPreview ||
                          getDocumentUrl(formData.photograph_url)
                        }
                        alt="Employee profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (formData.full_name || "E")
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0].toUpperCase())
                        .join("")
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <label className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-700">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                    {(profilePhotoPreview || formData.photograph_url) && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePhoto(null);
                          setProfilePhotoPreview("");
                          setFormData((current) => ({
                            ...current,
                            photograph_url: "",
                          }));
                        }}
                        className="text-xs text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    )}
                    {profilePhoto && (
                      <p className="max-w-xs truncate text-xs text-slate-400">
                        {profilePhoto.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  <div id="employee-contact">
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
                </div>
              </div>

              {/* Identification Information */}
              <div className={modalMode === "edit" ? "employee-edit-card" : "employee-create-section"}>
                <h3 className="text-base font-semibold text-white mb-4">
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
              <div className={modalMode === "edit" ? "employee-edit-card" : "employee-create-section"}>
                <h3 id="employee-employment" className="scroll-mt-4 text-base font-semibold text-white mb-4">
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
              <div className={modalMode === "edit" ? "employee-edit-card" : "employee-create-section"}>
                <h3 className="text-base font-semibold text-white mb-4">
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
              <div className={modalMode === "edit" ? "employee-edit-card" : "employee-create-section"}>
                <h3 className="text-base font-semibold text-white mb-4">
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
              <div className={modalMode === "edit" ? "employee-edit-card" : "employee-create-section"}>
                <h3 id="employee-documents" className="scroll-mt-4 text-base font-semibold text-white mb-4">
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
              <div
                className={`z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end ${
                  modalMode === "edit"
                    ? "sticky bottom-[-1.25rem] z-10 -mx-4 -mb-4 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5"
                    : "sticky bottom-0 border-t border-slate-700 bg-slate-900 pt-4"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setProfilePhotoPreview("");
                  }}
                  className="rounded-xl border border-slate-700/80 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    modalMode === "edit"
                      ? "bg-teal-400 text-slate-950 hover:bg-teal-300"
                      : "bg-indigo-600 hover:bg-indigo-500"
                  }`}
                >
                  {loading
                    ? "Saving..."
                    : modalMode === "create"
                      ? "Create Employee"
                      : "Save Changes"}
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
