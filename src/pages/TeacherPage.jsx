import { useState, useEffect } from "react";
import { teachersApi } from "../api/teachersApi";
import { getDepartments } from "../api/departmentsApi";
import { Plus, Edit, Trash2, X } from "lucide-react";
import config from "../config/config";

const emptyTeacher = {
  full_name: "",
  date_of_birth: "",
  gender: "",
  blood_group: "",
  nationality: "",
  religion: "",
  ethnicity: "",
  marital_status: "",
  profile_photo_url: "",
  personal_email: "",
  personal_phone: "",
  alternate_phone: "",
  current_address: "",
  permanent_address: "",
  designation: "",
  department_id: "",
  employment_type: "",
  join_date: "",
  subjects_taught: "",
  classes_assigned: "",
  reporting_manager: "",
  work_email: "",
  work_phone: "",
  office_room: "",
  highest_qualification: "",
  institution_name: "",
  passed_year: "",
  major_subject: "",
  additional_certifications: "",
  teaching_license_number: "",
  license_expiry_date: "",
  previous_organization: "",
  previous_position: "",
  previous_from_date: "",
  previous_to_date: "",
  previous_leave_reason: "",
  total_years_experience: "",
  citizenship_number: "",
  citizenship_issued_date: "",
  citizenship_issued_district: "",
  passport_number: "",
  passport_expiry_date: "",
  pan_number: "",
  national_id_number: "",
  bank_name: "",
  bank_branch: "",
  account_number: "",
  account_holder_name: "",
  salary_grade: "",
  basic_salary: "",
  allowances_travel: "",
  allowances_house: "",
  allowances_medical: "",
  provident_fund_number: "",
  insurance_number: "",
  emergency_contact_name: "",
  emergency_contact_relationship: "",
  emergency_contact_phone: "",
  emergency_contact_address: "",
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

const handleDownloadDocument = async (teacherId, docUrl, docTitle) => {
  try {
    if (!docUrl) {
      console.error("No document URL available");
      return;
    }

    // Extract filename from docUrl (e.g., '/uploads/teachers/filename.jpg' -> 'filename.jpg')
    const filename = docUrl.split("/").pop();
    const downloadUrl = `${config.API_BASE_URL}/v1/teachers/${teacherId}/download/${filename}`;

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

const TeacherPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDesignation, setFilterDesignation] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState(emptyTeacher);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [openSections, setOpenSections] = useState({
    personal: true,
    professional: false,
    qualification: false,
    experience: false,
    legal: false,
    emergency: false,
    documents: false,
    banking: false,
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [showAllDocumentsModal, setShowAllDocumentsModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const deps = await getDepartments();
        setDepartments(deps.data?.data || deps.data || []);
      } catch (e) {
        console.error(e);
      }
      await loadData();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const resp = await teachersApi.getTeachers({
        search: searchTerm,
        designation: filterDesignation,
      });
      setTeachers(resp.data?.data || []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedTeacher(null);
    setFormData(emptyTeacher);
    setProfilePhoto(null);
    setProfilePhotoPreview("");
    setAttachments([]);
    setOpenSections({
      personal: true,
      professional: false,
      qualification: false,
      experience: false,
      legal: false,
      emergency: false,
      documents: false,
      banking: false,
    });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (teacher) => {
    setModalMode("edit");
    setSelectedTeacher(teacher);
    setFormData({
      ...teacher,
      date_of_birth: normalizeDateForInput(teacher.date_of_birth),
      join_date: normalizeDateForInput(teacher.join_date),
      license_expiry_date: normalizeDateForInput(teacher.license_expiry_date),
      previous_from_date: normalizeDateForInput(teacher.previous_from_date),
      previous_to_date: normalizeDateForInput(teacher.previous_to_date),
      citizenship_issued_date: normalizeDateForInput(
        teacher.citizenship_issued_date,
      ),
      passport_expiry_date: normalizeDateForInput(teacher.passport_expiry_date),
      subjects_taught: Array.isArray(teacher.subjects_taught)
        ? teacher.subjects_taught.join(", ")
        : teacher.subjects_taught || "",
      classes_assigned: Array.isArray(teacher.classes_assigned)
        ? teacher.classes_assigned.join(", ")
        : teacher.classes_assigned || "",
      additional_certifications: Array.isArray(
        teacher.additional_certifications,
      )
        ? teacher.additional_certifications.join(", ")
        : teacher.additional_certifications || "",
      allowances_travel: teacher.allowances?.travel || "",
      allowances_house: teacher.allowances?.house || "",
      allowances_medical: teacher.allowances?.medical || "",
    });
    setProfilePhoto(null);
    setProfilePhotoPreview(teacher.profile_photo_url || "");
    setAttachments([]);
    setOpenSections({
      personal: true,
      professional: false,
      qualification: false,
      experience: false,
      legal: false,
      emergency: false,
      documents: false,
      banking: false,
    });
    setError(null);
    setShowModal(true);
  };

  const getDepartmentName = (id) =>
    departments.find((d) => d.id === id)?.name || "—";

  const formatArrayValue = (value) =>
    Array.isArray(value) ? value.join(", ") : value || "—";

  const printTeacherInfo = () => {
    if (!viewTeacher) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Teacher Profile</title>
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
      ${viewTeacher.profile_photo_url ? `<img class="profile-photo" src="${viewTeacher.profile_photo_url}" alt="Profile photo" />` : ""}
      <div class="title-block">
        <h1>Teacher Profile</h1>
        <p>${viewTeacher.full_name || "—"}</p>
      </div>
      <div class="badge ${viewTeacher.is_active ? "badge-active" : "badge-inactive"}">
        ${viewTeacher.is_active ? "Active" : "Inactive"}
      </div>
    </div>

    <div class="card">
      <div class="section-title">Personal Details</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Date of Birth</span><span class="detail-value">${viewTeacher.date_of_birth || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value">${viewTeacher.gender || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Blood Group</span><span class="detail-value">${viewTeacher.blood_group || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Nationality</span><span class="detail-value">${viewTeacher.nationality || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Religion</span><span class="detail-value">${viewTeacher.religion || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Ethnicity</span><span class="detail-value">${viewTeacher.ethnicity || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Marital Status</span><span class="detail-value">${viewTeacher.marital_status || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Personal Email</span><span class="detail-value">${viewTeacher.personal_email || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Personal Phone</span><span class="detail-value">${viewTeacher.personal_phone || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Current Address</span><span class="detail-value">${viewTeacher.current_address || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Permanent Address</span><span class="detail-value">${viewTeacher.permanent_address || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Professional Information</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Designation</span><span class="detail-value">${viewTeacher.designation || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Department</span><span class="detail-value">${getDepartmentName(viewTeacher.department_id)}</span></div>
        <div class="detail-row"><span class="detail-label">Employment Type</span><span class="detail-value">${viewTeacher.employment_type || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Join Date</span><span class="detail-value">${viewTeacher.join_date || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Work Email</span><span class="detail-value">${viewTeacher.work_email || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Work Phone</span><span class="detail-value">${viewTeacher.work_phone || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Reporting Manager</span><span class="detail-value">${viewTeacher.reporting_manager || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Subjects Taught</span><span class="detail-value">${formatArrayValue(viewTeacher.subjects_taught)}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Classes Assigned</span><span class="detail-value">${formatArrayValue(viewTeacher.classes_assigned)}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Qualification & Education</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Highest Qualification</span><span class="detail-value">${viewTeacher.highest_qualification || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Institution</span><span class="detail-value">${viewTeacher.institution_name || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Passed Year</span><span class="detail-value">${viewTeacher.passed_year || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Major Subject</span><span class="detail-value">${viewTeacher.major_subject || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Certifications</span><span class="detail-value">${formatArrayValue(viewTeacher.additional_certifications)}</span></div>
        <div class="detail-row"><span class="detail-label">License Number</span><span class="detail-value">${viewTeacher.teaching_license_number || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">License Expiry</span><span class="detail-value">${viewTeacher.license_expiry_date || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Experience</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Previous Organization</span><span class="detail-value">${viewTeacher.previous_organization || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Previous Position</span><span class="detail-value">${viewTeacher.previous_position || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">From - To</span><span class="detail-value">${(viewTeacher.previous_from_date || "—") + (viewTeacher.previous_to_date ? " - " + viewTeacher.previous_to_date : "")}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Reason for Leaving</span><span class="detail-value">${viewTeacher.previous_leave_reason || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Experience (Years)</span><span class="detail-value">${viewTeacher.total_years_experience || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Legal / IDs</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Citizenship No.</span><span class="detail-value">${viewTeacher.citizenship_number || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Issued Date</span><span class="detail-value">${viewTeacher.citizenship_issued_date || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">District</span><span class="detail-value">${viewTeacher.citizenship_issued_district || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Passport No.</span><span class="detail-value">${viewTeacher.passport_number || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Passport Expiry</span><span class="detail-value">${viewTeacher.passport_expiry_date || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">PAN</span><span class="detail-value">${viewTeacher.pan_number || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">National ID</span><span class="detail-value">${viewTeacher.national_id_number || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Banking & Salary</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Bank Name</span><span class="detail-value">${viewTeacher.bank_name || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Branch</span><span class="detail-value">${viewTeacher.bank_branch || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Account No.</span><span class="detail-value">${viewTeacher.account_number || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Account Holder</span><span class="detail-value">${viewTeacher.account_holder_name || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Salary Grade</span><span class="detail-value">${viewTeacher.salary_grade || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Basic Salary</span><span class="detail-value">${viewTeacher.basic_salary || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Allowances</span><span class="detail-value">${viewTeacher.allowances ? JSON.stringify(viewTeacher.allowances) : viewTeacher.allowances_travel || viewTeacher.allowances_house || viewTeacher.allowances_medical ? `travel:${viewTeacher.allowances_travel || "-"}, house:${viewTeacher.allowances_house || "-"}, medical:${viewTeacher.allowances_medical || "-"}` : "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Emergency Contact</div>
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${viewTeacher.emergency_contact_name || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Relationship</span><span class="detail-value">${viewTeacher.emergency_contact_relationship || "—"}</span></div>
        <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${viewTeacher.emergency_contact_phone || "—"}</span></div>
        <div class="detail-row full-width"><span class="detail-label">Address</span><span class="detail-value">${viewTeacher.emergency_contact_address || "—"}</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Documents</div>
      ${viewTeacher.documents && viewTeacher.documents.length ? `<ul class="documents">${viewTeacher.documents.map((doc) => `<li><strong>${doc.title || doc.name || "Document"}:</strong> ${doc.url ? `<a href='${doc.url}' target='_blank'>${doc.url}</a>` : "No URL"}</li>`).join("")}</ul>` : "<div>No documents attached.</div>"}
    </div>

    <div class="print-footer">Generated on ${new Date().toLocaleDateString()} · Teacher ID: ${viewTeacher.employee_id || "N/A"}</div>
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

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
    setFormData(emptyTeacher);
    setProfilePhoto(null);
    setProfilePhotoPreview("");
    setAttachments([]);
    setOpenSections({
      personal: true,
      professional: false,
      qualification: false,
      experience: false,
      legal: false,
      emergency: false,
      documents: false,
    });
    setError(null);
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handleAttachmentsChange = (event) => {
    const files = Array.from(event.target.files || []).map((f) => ({
      file: f,
      title: "",
    }));
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      subjects_taught: formData.subjects_taught
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      classes_assigned: formData.classes_assigned
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      additional_certifications: formData.additional_certifications
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      allowances: {
        travel: formData.allowances_travel || null,
        house: formData.allowances_house || null,
        medical: formData.allowances_medical || null,
      },
      // attachments metadata will be uploaded as files when present
      profile_photo_url: profilePhotoPreview || formData.profile_photo_url,
    };

    // Normalize date fields and numeric fields before sending
    const nullIfEmpty = (v) => (v === "" ? null : v);
    payload.date_of_birth = nullIfEmpty(payload.date_of_birth);
    payload.join_date = nullIfEmpty(payload.join_date);
    payload.license_expiry_date = nullIfEmpty(payload.license_expiry_date);
    payload.previous_from_date = nullIfEmpty(payload.previous_from_date);
    payload.previous_to_date = nullIfEmpty(payload.previous_to_date);
    payload.passport_expiry_date = nullIfEmpty(payload.passport_expiry_date);
    payload.citizenship_issued_date = nullIfEmpty(
      payload.citizenship_issued_date,
    );

    payload.basic_salary =
      payload.basic_salary !== "" && payload.basic_salary !== undefined
        ? Number(payload.basic_salary)
        : null;
    payload.total_years_experience =
      payload.total_years_experience !== "" &&
      payload.total_years_experience !== undefined
        ? Number(payload.total_years_experience)
        : null;

    try {
      const hasFiles = profilePhoto || attachments.length > 0;
      if (hasFiles) {
        const fd = new FormData();
        // append payload fields
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          if (Array.isArray(v) || typeof v === "object") {
            fd.append(k, JSON.stringify(v));
          } else {
            fd.append(k, v);
          }
        });
        if (profilePhoto) fd.append("profile_picture_file", profilePhoto);
        attachments.forEach((a) => fd.append("documents", a.file));
        const titles = attachments.map((a) => a.title || a.file.name);
        fd.append("document_titles", JSON.stringify(titles));

        if (modalMode === "create") {
          await teachersApi.createTeacher(fd);
        } else if (selectedTeacher) {
          await teachersApi.updateTeacher(selectedTeacher.id, fd);
        }
      } else {
        if (modalMode === "create") {
          await teachersApi.createTeacher(payload);
        } else if (selectedTeacher) {
          await teachersApi.updateTeacher(selectedTeacher.id, payload);
        }
      }
      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this teacher record?")) return;
    setLoading(true);
    try {
      await teachersApi.deleteTeacher(id);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Teachers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage teacher and staff records with full personal, professional,
            qualification, and emergency details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <input
            type="text"
            placeholder="Designation filter"
            value={filterDesignation}
            onChange={(e) => setFilterDesignation(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button
            onClick={() => loadData()}
            className="rounded-xl bg-slate-700 px-3 py-2 text-sm text-white"
          >
            Filter
          </button>
          <button
            onClick={async () => {
              try {
                const resp = await teachersApi.exportTeachers({
                  search: searchTerm,
                  designation: filterDesignation,
                });
                const url = window.URL.createObjectURL(new Blob([resp.data]));
                const a = document.createElement("a");
                a.href = url;
                a.setAttribute("download", "teachers_export.csv");
                document.body.appendChild(a);
                a.click();
                a.remove();
              } catch (e) {
                console.error(e);
              }
            }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 transition"
          >
            Export
          </button>
          <label className="cursor-pointer rounded-xl bg-slate-700 px-3 py-2 text-sm text-white">
            Import
            <input
              type="file"
              accept=".csv"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fd = new FormData();
                fd.append("file", f);
                try {
                  await teachersApi.importTeachers(fd);
                  await loadData();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="hidden"
            />
          </label>
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Plus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <table className="min-w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Work Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {loading ? "Loading teachers..." : "No teacher records yet."}
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="border-t border-slate-800/70 hover:bg-slate-900/80"
                >
                  <td className="px-4 py-4 text-white font-medium">
                    {teacher.full_name}
                  </td>
                  <td className="px-4 py-4">{teacher.designation || "—"}</td>
                  <td className="px-4 py-4">
                    {departments.find((d) => d.id === teacher.department_id)
                      ?.name || "—"}
                  </td>
                  <td className="px-4 py-4">
                    {teacher.work_email || teacher.personal_email || "—"}
                  </td>
                  <td className="px-4 py-4">{teacher.personal_phone || "—"}</td>
                  <td className="px-4 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setViewTeacher(teacher);
                        setShowViewModal(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-700/80 px-3 py-1 text-xs text-slate-200 hover:bg-slate-600/80"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(teacher)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-700/80 px-3 py-1 text-xs text-slate-200 hover:bg-slate-600/80"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await teachersApi.updateTeacher(teacher.id, {
                            is_active: !teacher.is_active,
                          });
                          await loadData();
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs ${teacher.is_active ? "bg-red-600/10 text-red-200 hover:bg-red-600/20" : "bg-green-600/10 text-green-200 hover:bg-green-600/20"}`}
                    >
                      {teacher.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-200 hover:bg-red-500/20"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-700/70 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {modalMode === "create" ? "Add Teacher" : "Edit Teacher"}
                </h2>
                <p className="text-sm text-slate-400">
                  Fill personal, professional, qualification, experience, legal,
                  and emergency details.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection("personal")}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-700/80 bg-slate-950 px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Personal Details
                    </h3>
                    <p className="text-sm text-slate-400">
                      Profile photo, contact information, and basic personal
                      identity fields.
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${openSections.personal ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 text-slate-400"}`}
                  >
                    {openSections.personal ? "-" : "+"}
                  </span>
                </button>
                {openSections.personal && (
                  <div className="grid gap-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4 md:grid-cols-[220px_1fr]">
                    <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-700/80 bg-slate-950 p-4 text-center">
                      <div className="h-32 w-32 overflow-hidden rounded-full bg-slate-800">
                        {profilePhotoPreview ? (
                          <img
                            src={profilePhotoPreview}
                            alt="Profile photo"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                            No photo
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer rounded-2xl border border-slate-600/80 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      {profilePhotoPreview && (
                        <p className="text-xs text-slate-400">
                          Selected photo will show in the teacher profile.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm text-slate-300">
                          Full Name
                        </label>
                        <input
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              date_of_birth: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">Gender</label>
                        <input
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                          placeholder="Male / Female / Other"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Blood Group
                        </label>
                        <input
                          value={formData.blood_group}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              blood_group: e.target.value,
                            })
                          }
                          placeholder="A+ / B- / O+"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Personal Email
                        </label>
                        <input
                          type="email"
                          value={formData.personal_email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              personal_email: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Personal Phone
                        </label>
                        <input
                          value={formData.personal_phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              personal_phone: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Alternate Phone
                        </label>
                        <input
                          value={formData.alternate_phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              alternate_phone: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Current Address
                        </label>
                        <input
                          value={formData.current_address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              current_address: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Permanent Address
                        </label>
                        <input
                          value={formData.permanent_address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              permanent_address: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Marital Status
                        </label>
                        <input
                          value={formData.marital_status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              marital_status: e.target.value,
                            })
                          }
                          placeholder="Single / Married"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Nationality
                        </label>
                        <input
                          value={formData.nationality}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nationality: e.target.value,
                            })
                          }
                          placeholder="Nepali"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Religion
                        </label>
                        <input
                          value={formData.religion}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              religion: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">
                          Ethnicity
                        </label>
                        <input
                          value={formData.ethnicity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ethnicity: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("professional")}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-700/80 bg-slate-950 px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Professional Information
                    </h3>
                    <p className="text-sm text-slate-400">
                      Employment, department, reporting and assignment details.
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${openSections.professional ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 text-slate-400"}`}
                  >
                    {openSections.professional ? "-" : "+"}
                  </span>
                </button>
                {openSections.professional && (
                  <div className="grid gap-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-slate-300">
                        Designation
                      </label>
                      <input
                        value={formData.designation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            designation: e.target.value,
                          })
                        }
                        placeholder="Head Teacher, Subject Teacher"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Department
                      </label>
                      <select
                        value={formData.department_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department_id: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Employment Type
                      </label>
                      <input
                        value={formData.employment_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employment_type: e.target.value,
                          })
                        }
                        placeholder="Permanent / Contract"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Join Date
                      </label>
                      <input
                        type="date"
                        value={formData.join_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            join_date: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Work Email
                      </label>
                      <input
                        type="email"
                        value={formData.work_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            work_email: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Work Phone / Extension
                      </label>
                      <input
                        value={formData.work_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            work_phone: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Reporting Manager
                      </label>
                      <input
                        value={formData.reporting_manager}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reporting_manager: e.target.value,
                          })
                        }
                        placeholder="Supervisor name"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Subjects Taught
                      </label>
                      <input
                        value={formData.subjects_taught}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subjects_taught: e.target.value,
                          })
                        }
                        placeholder="Comma separated"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Classes Assigned
                      </label>
                      <input
                        value={formData.classes_assigned}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            classes_assigned: e.target.value,
                          })
                        }
                        placeholder="Comma separated"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Office Room / Location
                      </label>
                      <input
                        value={formData.office_room}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            office_room: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("qualification")}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-700/80 bg-slate-950 px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Qualification & Education
                    </h3>
                    <p className="text-sm text-slate-400">
                      Academic background, certifications, and teaching license
                      information.
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${openSections.qualification ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 text-slate-400"}`}
                  >
                    {openSections.qualification ? "-" : "+"}
                  </span>
                </button>
                {openSections.qualification && (
                  <div className="grid gap-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-slate-300">
                        Highest Qualification
                      </label>
                      <input
                        value={formData.highest_qualification}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            highest_qualification: e.target.value,
                          })
                        }
                        placeholder="SLC / Bachelor / Master / PhD"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        University / Institution
                      </label>
                      <input
                        value={formData.institution_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            institution_name: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Passed Year
                      </label>
                      <input
                        value={formData.passed_year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passed_year: e.target.value,
                          })
                        }
                        placeholder="2024"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Major Subject
                      </label>
                      <input
                        value={formData.major_subject}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            major_subject: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-slate-300">
                        Additional Certifications
                      </label>
                      <input
                        value={formData.additional_certifications}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            additional_certifications: e.target.value,
                          })
                        }
                        placeholder="Comma separated"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Teaching License Number
                      </label>
                      <input
                        value={formData.teaching_license_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            teaching_license_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        License Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.license_expiry_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            license_expiry_date: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("banking")}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-700/80 bg-slate-950 px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Banking & Insurance
                    </h3>
                    <p className="text-sm text-slate-400">
                      Bank account, salary, provident fund and insurance
                      details.
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${openSections.banking ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 text-slate-400"}`}
                  >
                    {openSections.banking ? "-" : "+"}
                  </span>
                </button>
                {openSections.banking && (
                  <div className="grid gap-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-slate-300">
                        Bank Name
                      </label>
                      <input
                        value={formData.bank_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_name: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Bank Branch
                      </label>
                      <input
                        value={formData.bank_branch}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_branch: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Account Number
                      </label>
                      <input
                        value={formData.account_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            account_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Account Holder Name
                      </label>
                      <input
                        value={formData.account_holder_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            account_holder_name: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Salary Grade
                      </label>
                      <input
                        value={formData.salary_grade}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salary_grade: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Basic Salary
                      </label>
                      <input
                        type="number"
                        value={formData.basic_salary}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            basic_salary: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Provident Fund Number
                      </label>
                      <input
                        value={formData.provident_fund_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            provident_fund_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Insurance Number
                      </label>
                      <input
                        value={formData.insurance_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            insurance_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-sm text-slate-300">
                        Allowances (Travel, House, Medical)
                      </label>
                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          type="number"
                          placeholder="Travel"
                          value={formData.allowances_travel}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              allowances_travel: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="number"
                          placeholder="House"
                          value={formData.allowances_house}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              allowances_house: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="number"
                          placeholder="Medical"
                          value={formData.allowances_medical}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              allowances_medical: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("experience")}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-700/80 bg-slate-950 px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Experience
                    </h3>
                    <p className="text-sm text-slate-400">
                      Previous roles, organisation history, and reason for
                      leaving.
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${openSections.experience ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 text-slate-400"}`}
                  >
                    {openSections.experience ? "-" : "+"}
                  </span>
                </button>
                {openSections.experience && (
                  <div className="grid gap-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-slate-300">
                        Previous Organization
                      </label>
                      <input
                        value={formData.previous_organization}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previous_organization: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Position Held
                      </label>
                      <input
                        value={formData.previous_position}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previous_position: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={formData.previous_from_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previous_from_date: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">To Date</label>
                      <input
                        type="date"
                        value={formData.previous_to_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previous_to_date: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-slate-300">
                        Reason for Leaving
                      </label>
                      <input
                        value={formData.previous_leave_reason}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previous_leave_reason: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Total Years Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.total_years_experience}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_years_experience: e.target.value,
                          })
                        }
                        placeholder="e.g. 3.5"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("legal")}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-700/80 bg-slate-950 px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Identity & Legal
                    </h3>
                    <p className="text-sm text-slate-400">
                      National IDs, passport, tax ID and other legal identity
                      documents.
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${openSections.legal ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 text-slate-400"}`}
                  >
                    {openSections.legal ? "-" : "+"}
                  </span>
                </button>
                {openSections.legal && (
                  <div className="grid gap-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-slate-300">
                        Citizenship Number
                      </label>
                      <input
                        value={formData.citizenship_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            citizenship_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Issued Date
                      </label>
                      <input
                        type="date"
                        value={formData.citizenship_issued_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            citizenship_issued_date: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Issued District
                      </label>
                      <input
                        value={formData.citizenship_issued_district}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            citizenship_issued_district: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Passport Number
                      </label>
                      <input
                        value={formData.passport_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passport_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Passport Expiry
                      </label>
                      <input
                        type="date"
                        value={formData.passport_expiry_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passport_expiry_date: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        PAN / Tax ID
                      </label>
                      <input
                        value={formData.pan_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pan_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        National ID Number
                      </label>
                      <input
                        value={formData.national_id_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            national_id_number: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("emergency")}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-700/80 bg-slate-950 px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Emergency Contact
                    </h3>
                    <p className="text-sm text-slate-400">
                      Emergency contact name, relationship, phone and address.
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${openSections.emergency ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 text-slate-400"}`}
                  >
                    {openSections.emergency ? "-" : "+"}
                  </span>
                </button>
                {openSections.emergency && (
                  <div className="grid gap-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-slate-300">
                        Contact Name
                      </label>
                      <input
                        value={formData.emergency_contact_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_name: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Relationship
                      </label>
                      <input
                        value={formData.emergency_contact_relationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_relationship: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">
                        Phone Number
                      </label>
                      <input
                        value={formData.emergency_contact_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_phone: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-sm text-slate-300">Address</label>
                      <input
                        value={formData.emergency_contact_address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_address: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleSection("documents")}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-700/80 bg-slate-950 px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Required Documents
                    </h3>
                    <p className="text-sm text-slate-400">
                      Attach certifications, IDs and other teacher documents.
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${openSections.documents ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 text-slate-400"}`}
                  >
                    {openSections.documents ? "-" : "+"}
                  </span>
                </button>
                {openSections.documents && (
                  <div className="space-y-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4">
                    <div className="rounded-3xl border border-slate-700/80 bg-slate-950 p-4">
                      <label className="text-sm text-slate-300">
                        Upload Documents
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={handleAttachmentsChange}
                        className="mt-2 w-full text-sm text-slate-200 file:rounded-xl file:border file:border-slate-700 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-slate-100"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Upload PDFs, images, or scanned documents for this
                        teacher.
                      </p>
                    </div>
                    {attachments.length > 0 && (
                      <div className="grid gap-2">
                        {attachments.map((att, index) => (
                          <div
                            key={`${att.file.name}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-white">
                                {att.file.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {(att.file.size / 1024).toFixed(1)} KB
                              </p>
                              <input
                                type="text"
                                placeholder="Document title"
                                value={att.title}
                                onChange={(e) => {
                                  const newAttachments = [...attachments];
                                  newAttachments[index] = {
                                    ...att,
                                    title: e.target.value,
                                  };
                                  setAttachments(newAttachments);
                                }}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-700/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {modalMode === "create" ? "Create Teacher" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {viewTeacher.full_name}
                </h2>
                <p className="text-sm text-slate-400">
                  Teacher profile and documents
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${viewTeacher.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {viewTeacher.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={printTeacherInfo}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-3">
              <div className="col-span-1 flex flex-col items-center gap-4">
                <div className="h-40 w-40 overflow-hidden rounded-full bg-slate-800">
                  {viewTeacher.profile_photo_url ? (
                    <img
                      src={viewTeacher.profile_photo_url}
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
                    {viewTeacher.full_name}
                  </div>
                  <div className="text-sm text-slate-400">
                    {viewTeacher.designation || "—"}
                  </div>
                </div>
              </div>
              <div className="col-span-2 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Work Email</div>
                    <div className="text-sm text-white">
                      {viewTeacher.work_email ||
                        viewTeacher.personal_email ||
                        "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Phone</div>
                    <div className="text-sm text-white">
                      {viewTeacher.personal_phone ||
                        viewTeacher.work_phone ||
                        "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Department</div>
                    <div className="text-sm text-white">
                      {departments.find(
                        (d) => d.id === viewTeacher.department_id,
                      )?.name || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                    <div className="text-xs text-slate-400">Joined</div>
                    <div className="text-sm text-white">
                      {viewTeacher.join_date || "—"}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Address</div>
                  <div className="text-sm text-white">
                    {viewTeacher.current_address ||
                      viewTeacher.permanent_address ||
                      "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">Documents</div>
                    <div className="text-xs text-slate-400">
                      {(viewTeacher.documents || []).length} files
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {(viewTeacher.documents || []).length === 0 ? (
                      <div className="text-sm text-slate-500">No documents</div>
                    ) : (
                      (viewTeacher.documents || []).map((d, i) => (
                        <div
                          key={d.id || i}
                          className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2"
                        >
                          <div>
                            <div className="text-sm text-white">
                              {d.title || d.name || "Document"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {d.uploaded_at
                                ? new Date(d.uploaded_at).toLocaleString()
                                : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-indigo-400 hover:underline"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 grid gap-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Designation</div>
                  <div className="text-sm text-white">
                    {viewTeacher.designation || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Employment Type</div>
                  <div className="text-sm text-white">
                    {viewTeacher.employment_type || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Reporting Manager
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.reporting_manager || "—"}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Subjects Taught</div>
                  <div className="text-sm text-white">
                    {Array.isArray(viewTeacher.subjects_taught)
                      ? viewTeacher.subjects_taught.join(", ")
                      : viewTeacher.subjects_taught || "—"}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Classes Assigned</div>
                  <div className="text-sm text-white">
                    {Array.isArray(viewTeacher.classes_assigned)
                      ? viewTeacher.classes_assigned.join(", ")
                      : viewTeacher.classes_assigned || "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Highest Qualification
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.highest_qualification || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Institution</div>
                  <div className="text-sm text-white">
                    {viewTeacher.institution_name || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Major Subject</div>
                  <div className="text-sm text-white">
                    {viewTeacher.major_subject || "—"}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Additional Certifications
                  </div>
                  <div className="text-sm text-white">
                    {Array.isArray(viewTeacher.additional_certifications)
                      ? viewTeacher.additional_certifications.join(", ")
                      : viewTeacher.additional_certifications || "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Previous Organization
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.previous_organization || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Previous Position
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.previous_position || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Previous From - To
                  </div>
                  <div className="text-sm text-white">
                    {(viewTeacher.previous_from_date || "—") +
                      (viewTeacher.previous_to_date
                        ? " - " + viewTeacher.previous_to_date
                        : "")}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Previous Leave Reason
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.previous_leave_reason || "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Citizenship No</div>
                  <div className="text-sm text-white">
                    {viewTeacher.citizenship_number || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Citizenship Issued
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.citizenship_issued_date || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Citizenship District
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.citizenship_issued_district || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Passport No</div>
                  <div className="text-sm text-white">
                    {viewTeacher.passport_number || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Passport Expiry</div>
                  <div className="text-sm text-white">
                    {viewTeacher.passport_expiry_date || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    PAN / National ID
                  </div>
                  <div className="text-sm text-white">
                    {(viewTeacher.pan_number || "") +
                      (viewTeacher.national_id_number
                        ? " / " + viewTeacher.national_id_number
                        : "") || "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Bank</div>
                  <div className="text-sm text-white">
                    {viewTeacher.bank_name || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Branch</div>
                  <div className="text-sm text-white">
                    {viewTeacher.bank_branch || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Account No</div>
                  <div className="text-sm text-white">
                    {viewTeacher.account_number || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Account Holder</div>
                  <div className="text-sm text-white">
                    {viewTeacher.account_holder_name || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Salary Grade</div>
                  <div className="text-sm text-white">
                    {viewTeacher.salary_grade || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Basic Salary</div>
                  <div className="text-sm text-white">
                    {viewTeacher.basic_salary || "—"}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">Allowances</div>
                  <div className="text-sm text-white">
                    {viewTeacher.allowances
                      ? JSON.stringify(viewTeacher.allowances)
                      : viewTeacher.allowances_travel ||
                          viewTeacher.allowances_house ||
                          viewTeacher.allowances_medical
                        ? `travel:${viewTeacher.allowances_travel || "-"}, house:${viewTeacher.allowances_house || "-"}, medical:${viewTeacher.allowances_medical || "-"}`
                        : "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Emergency Contact Name
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.emergency_contact_name || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Emergency Relationship
                  </div>
                  <div className="text-sm text-white">
                    {viewTeacher.emergency_contact_relationship || "—"}
                  </div>
                </div>
                <div className="md:col-span-2 rounded-xl border border-slate-700/80 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">
                    Emergency Phone / Address
                  </div>
                  <div className="text-sm text-white">
                    {(viewTeacher.emergency_contact_phone || "—") +
                      (viewTeacher.emergency_contact_address
                        ? " / " + viewTeacher.emergency_contact_address
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
                    setViewTeacher(null);
                  }}
                  className="rounded-xl border border-slate-700/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(viewTeacher);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllDocumentsModal && viewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 px-6 py-4 sticky top-0 bg-slate-950">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  All Documents
                </h2>
                <p className="text-sm text-slate-400">
                  {viewTeacher.full_name} —{" "}
                  {(viewTeacher.documents || []).length} files
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
              {(viewTeacher.documents || []).length === 0 ? (
                <div className="rounded-xl border border-slate-700/80 bg-slate-900 p-8 text-center">
                  <div className="text-slate-400">No documents attached</div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {(viewTeacher.documents || []).map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="rounded-xl border border-slate-700/80 bg-slate-900 p-4 hover:border-indigo-500/50 hover:bg-slate-900/80 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {doc.title || doc.name || "Document"}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {doc.uploaded_at
                              ? new Date(doc.uploaded_at).toLocaleString()
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
                                    viewTeacher.id,
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
  );
};

export default TeacherPage;
