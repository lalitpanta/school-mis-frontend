import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { teachersApi } from "../api/teachersApi";
import { getDepartments } from "../api/departmentsApi";
import { getCourses } from "../api/coursesApi";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  Download,
  Upload,
  ArrowUpDown,
  GripVertical,
  Power,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import config from "../config/config";
import RecordTableToolbar from "../components/common/RecordTableToolbar";
import toast from "react-hot-toast";

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
  provide_login_credentials: true,
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
  const [availableCourses, setAvailableCourses] = useState([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDesignation, setFilterDesignation] = useState("");
  const [teacherStatusFilter, setTeacherStatusFilter] = useState("all");
  const [visibleTeacherColumns, setVisibleTeacherColumns] = useState([
    "full_name",
    "status",
  ]);
  const [teacherSort, setTeacherSort] = useState({
    key: "full_name",
    direction: "asc",
  });
  const [teacherPageSize, setTeacherPageSize] = useState(10);
  const [teacherCurrentPage, setTeacherCurrentPage] = useState(1);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activeTeacherSection, setActiveTeacherSection] = useState("personal");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState(emptyTeacher);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [attachments, setAttachments] = useState([]);
  const splitLayoutRef = useRef(null);
  const teacherTableViewportRef = useRef(null);
  const teacherImportRef = useRef(null);
  const [editPanelBounds, setEditPanelBounds] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [showAllDocumentsModal, setShowAllDocumentsModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [departmentsResult, coursesResult] = await Promise.allSettled([
        getDepartments(),
        getCourses(),
      ]);
      if (departmentsResult.status === "fulfilled") {
        const deps = departmentsResult.value;
        setDepartments(deps.data?.data || deps.data || []);
      } else {
        console.error(departmentsResult.reason);
      }
      if (coursesResult.status === "fulfilled") {
        const courseResponse = coursesResult.value;
        setAvailableCourses(
          (courseResponse.data?.data || []).filter((course) => course.is_active),
        );
        setCoursesLoaded(true);
      } else {
        console.error(coursesResult.reason);
        toast.error("Failed to load active courses for teacher assignments.");
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
    setSelectedCourseIds([]);
    setProfilePhoto(null);
    setProfilePhotoPreview("");
    setAttachments([]);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = async (teacher) => {
    let assignedCourses;
    try {
      const response = await teachersApi.getTeacherCourses(teacher.id);
      assignedCourses = response.data?.data || [];
    } catch (e) {
      console.error(e);
      toast.error("Failed to load this teacher's assigned courses.");
      return;
    }
    setModalMode("edit");
    setActiveTeacherSection("personal");
    setSelectedTeacher(teacher);
    setSelectedCourseIds(assignedCourses.map((course) => String(course.id)));
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
    setError(null);
    setShowModal(true);
  };

  const getDepartmentName = (id) =>
    departments.find((d) => d.id === id)?.name || "—";

  const formatArrayValue = (value) =>
    Array.isArray(value) ? value.join(", ") : value || "—";

  const normalizeDocuments = (documents) => {
    if (Array.isArray(documents)) {
      return documents.filter(
        (document) => document && typeof document === "object",
      );
    }
    if (typeof documents === "string") {
      try {
        const parsed = JSON.parse(documents);
        return Array.isArray(parsed)
          ? parsed.filter(
              (document) => document && typeof document === "object",
            )
          : [];
      } catch (error) {
        console.error("Failed to parse teacher documents for profile view", error);
        return [];
      }
    }
    return [];
  };

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
    setSelectedCourseIds([]);
    setProfilePhoto(null);
    setProfilePhotoPreview("");
    setAttachments([]);
    setError(null);
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

  const selectedCourses = selectedCourseIds
    .map((id) =>
      availableCourses.find((course) => String(course.id) === id),
    )
    .filter(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      ...(coursesLoaded
        ? {
            course_ids: selectedCourseIds.map(Number),
            subjects_taught: selectedCourseIds
              .map((id) =>
                availableCourses.find((course) => String(course.id) === id)
                  ?.course_name,
              )
              .filter(Boolean),
          }
        : {
            subjects_taught: Array.isArray(formData.subjects_taught)
              ? formData.subjects_taught
              : formData.subjects_taught
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
          }),
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
      let saveResponse = null;
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
          saveResponse = await teachersApi.createTeacher(fd);
        } else if (selectedTeacher) {
          saveResponse = await teachersApi.updateTeacher(selectedTeacher.id, fd);
        }
      } else {
        if (modalMode === "create") {
          saveResponse = await teachersApi.createTeacher(payload);
        } else if (selectedTeacher) {
          saveResponse = await teachersApi.updateTeacher(selectedTeacher.id, payload);
        }
      }
      const portalLogin = saveResponse?.data?.data?.portal_login;
      if (portalLogin?.requested) {
        if (portalLogin.email_sent) {
          toast.success(`Teacher portal credentials sent to ${portalLogin.email}.`);
        } else if (portalLogin.status === "existing_account") {
          toast.error(`A teacher account already exists for ${portalLogin.email}. Credentials were not re-sent.`);
        } else {
          toast.error(
            portalLogin.error ||
              (portalLogin.status === "missing_email"
                ? "The teacher profile was saved, but no work or personal email was provided."
                : `The teacher profile was saved, but portal credentials could not be sent to ${portalLogin.email || "the teacher"}. Check Settings > Integrations and existing account conflicts.`),
          );
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

  const handleTeacherImport = async () => {
    const file = teacherImportRef.current?.files?.[0];
    if (!file) {
      setError("Select a CSV file to import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError(null);
    try {
      await teachersApi.importTeachers(formData);
      await loadData();
      toast.success("Teachers imported successfully.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to import teachers.");
    } finally {
      if (teacherImportRef.current) teacherImportRef.current.value = "";
      setLoading(false);
    }
  };

  const handleBulkDeleteTeachers = async () => {
    const ids = selectedTeacherIds;
    if (
      ids.length === 0 ||
      !window.confirm(`Delete ${ids.length} selected teacher${ids.length === 1 ? "" : "s"}? This cannot be undone.`)
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => teachersApi.deleteTeacher(id)),
      );
      const failedIds = ids.filter(
        (_, index) => results[index].status === "rejected",
      );
      const deletedCount = ids.length - failedIds.length;

      setSelectedTeacherIds(failedIds);
      await loadData();

      if (failedIds.length > 0) {
        const firstFailure = results.find(
          (result) => result.status === "rejected",
        )?.reason;
        setError(
          `${deletedCount} teacher${deletedCount === 1 ? "" : "s"} deleted; ${failedIds.length} could not be deleted. ${
            firstFailure?.response?.data?.message || firstFailure?.message || ""
          }`.trim(),
        );
      } else {
        toast.success(`${deletedCount} teacher${deletedCount === 1 ? "" : "s"} deleted successfully.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const teacherColumns = [
    {
      key: "id",
      label: "ID",
      value: (teacher) => teacher.id,
    },
    {
      key: "full_name",
      label: "Name",
      value: (teacher) => teacher.full_name,
      render: (teacher) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {teacher.profile_photo_url ? (
              <img src={teacher.profile_photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (teacher.full_name || "T")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0].toUpperCase())
                .join("")
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-primary">{teacher.full_name}</div>
            <div className="truncate text-xs text-muted">
              {teacher.work_email || teacher.personal_email || "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      value: (teacher) => teacher.designation,
    },
    {
      key: "subjects_taught",
      label: "Subjects Taught",
      value: (teacher) =>
        Array.isArray(teacher.subjects_taught)
          ? teacher.subjects_taught.join(", ")
          : teacher.subjects_taught || "—",
    },
    {
      key: "department",
      label: "Department",
      value: (teacher) => getDepartmentName(teacher.department_id),
    },
    {
      key: "work_email",
      label: "Work Email",
      value: (teacher) => teacher.work_email || teacher.personal_email,
    },
    {
      key: "personal_phone",
      label: "Phone",
      value: (teacher) => teacher.personal_phone,
    },
    {
      key: "status",
      label: "Status",
      value: (teacher) => teacher.is_active,
      render: (teacher) => (
        <span
          className={`entity-status-pill inline-flex rounded-full px-2 py-1 text-xs ${teacher.is_active ? "bg-success text-success" : "bg-danger-soft text-danger"}`}
        >
          {teacher.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];
  const isEditingTeacher = showModal && modalMode === "edit";
  useLayoutEffect(() => {
    if (!isEditingTeacher) {
      setEditPanelBounds(null);
      return undefined;
    }

    const updateEditPanelBounds = () => {
      const layout = splitLayoutRef.current;
      const tableViewport = teacherTableViewportRef.current;
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
    if (teacherTableViewportRef.current) {
      resizeObserver.observe(teacherTableViewportRef.current);
    }
    window.addEventListener("resize", updateEditPanelBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateEditPanelBounds);
    };
  }, [isEditingTeacher, error]);
  const filteredTeachers = teachers.filter((teacher) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [
        teacher.full_name,
        teacher.designation,
        teacher.work_email,
        teacher.personal_email,
        teacher.personal_phone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    const matchesDesignation =
      !filterDesignation.trim() ||
      teacher.designation
        ?.toLowerCase()
        .includes(filterDesignation.trim().toLowerCase());
    const matchesStatus =
      teacherStatusFilter === "all" ||
      (teacher.is_active ? "active" : "inactive") === teacherStatusFilter;
    return matchesSearch && matchesDesignation && matchesStatus;
  });
  const displayedTeacherColumns = teacherColumns.filter((column) =>
    isEditingTeacher
      ? ["full_name", "status"].includes(column.key)
      : visibleTeacherColumns.includes(column.key),
  );
  const sortedTeachers = [...filteredTeachers].sort((first, second) => {
    const column = teacherColumns.find((item) => item.key === teacherSort.key);
    if (!column) return 0;
    const comparison = String(column.value(first) ?? "").localeCompare(
      String(column.value(second) ?? ""),
      undefined,
      { numeric: true, sensitivity: "base" },
    );
    return teacherSort.direction === "asc" ? comparison : -comparison;
  });
  const teacherPageCount = Math.max(
    1,
    Math.ceil(sortedTeachers.length / teacherPageSize),
  );
  const visibleTeacherPage = Math.min(teacherCurrentPage, teacherPageCount);
  const pageTeachers = sortedTeachers.slice(
    (visibleTeacherPage - 1) * teacherPageSize,
    visibleTeacherPage * teacherPageSize,
  );
  const firstTeacherRecord = sortedTeachers.length
    ? (visibleTeacherPage - 1) * teacherPageSize + 1
    : 0;
  const lastTeacherRecord = Math.min(
    visibleTeacherPage * teacherPageSize,
    sortedTeachers.length,
  );

  return (
    <div
      ref={splitLayoutRef}
      className={`entity-admin-page ${isEditingTeacher ? "is-editing relative flex w-full h-[calc(100dvh-5rem)] min-h-128 flex-col overflow-visible max-md:h-auto max-md:max-h-none" : "space-y-6"}`}
    >
      <div
        className={`w-full min-w-0 ${isEditingTeacher ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" : ""}`}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold text-primary">Manage Teachers</h1>
            <p className="mt-1 text-sm text-muted">
              Manage teacher profiles, status, and access.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={teacherImportRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              aria-label="Choose teacher CSV file"
            />
            <button
              type="button"
              onClick={() => teacherImportRef.current?.click()}
              title="Choose CSV to import"
              aria-label="Choose teacher CSV file"
              className="entity-admin-button inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 px-4 text-sm text-slate-300 hover:bg-slate-800"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={handleTeacherImport}
              title="Import teachers"
              aria-label="Import teachers"
              className="entity-admin-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 text-sm text-slate-300 hover:bg-slate-800"
            >
              <Download size={16} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="entity-admin-button inline-flex h-10 items-center gap-2 rounded-lg bg-teal-300 px-4 text-sm font-semibold text-slate-950 hover:bg-teal-200"
            >
              <Plus size={16} /> Add Teacher
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-danger-soft border border-danger text-sm text-danger">
            {error}
          </div>
        )}

        <div className="entity-admin-card flex w-full min-h-0 flex-1 flex-col overflow-visible rounded-2xl border border-default bg-surface">
          <RecordTableToolbar
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setTeacherCurrentPage(1);
            }}
            searchPlaceholder="Search teachers..."
            columns={teacherColumns}
            visibleColumns={visibleTeacherColumns}
            onToggleColumn={(key) =>
              setVisibleTeacherColumns((current) =>
                current.includes(key)
                  ? current.filter((columnKey) => columnKey !== key)
                  : [...current, key],
              )
            }
            filterContent={
              <>
                <label className="record-table-filter-field">
                  Designation
                  <input
                    value={filterDesignation}
                    onChange={(event) => {
                      setFilterDesignation(event.target.value);
                      setTeacherCurrentPage(1);
                    }}
                    className="w-full rounded border border-default bg-subtle px-3 py-2 text-sm text-primary"
                  />
                </label>
                <label className="record-table-filter-field">
                  Status
                  <select
                    value={teacherStatusFilter}
                    onChange={(event) => {
                      setTeacherStatusFilter(event.target.value);
                      setTeacherCurrentPage(1);
                    }}
                    className="w-full rounded border border-default bg-subtle px-3 py-2 text-sm text-primary"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTeacherCurrentPage(1);
                    loadData();
                  }}
                  className="justify-self-start text-xs text-accent hover:text-accent"
                >
                  Apply filters
                </button>
              </>
            }
            views={[
              {
                label: "All teachers",
                onSelect: () => {
                  setTeacherStatusFilter("all");
                  setTeacherCurrentPage(1);
                },
              },
              {
                label: "Active teachers",
                onSelect: () => {
                  setTeacherStatusFilter("active");
                  setTeacherCurrentPage(1);
                },
              },
              {
                label: "Inactive teachers",
                onSelect: () => {
                  setTeacherStatusFilter("inactive");
                  setTeacherCurrentPage(1);
                },
              },
            ]}
            recordCount={filteredTeachers.length}
            rightContent={
              <button
                onClick={async () => {
                  try {
                    const resp = await teachersApi.exportTeachers({
                      search: searchTerm,
                      designation: filterDesignation,
                    });
                    const url = window.URL.createObjectURL(
                      new Blob([resp.data]),
                    );
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
                className="inline-flex items-center gap-2 rounded border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800"
              >
                <Download size={16} /> Export CSV
              </button>
            }
          />
          {!isEditingTeacher && selectedTeacherIds.length > 0 && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-800/30 px-4 py-2 text-sm">
              <span className="text-slate-300">
                {selectedTeacherIds.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkDeleteTeachers}
                  disabled={loading}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete selected
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTeacherIds([])}
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}
          <div
            ref={teacherTableViewportRef}
            className={`entity-admin-list min-h-0 flex-1 ${isEditingTeacher ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "w-full overflow-auto"}`}
          >
            <table
              className="w-full min-w-0 table-fixed text-left text-sm text-muted"
            >
              <thead className="sticky top-0 z-10 border-b border-default bg-subtle text-muted">
                <tr>
                  {!isEditingTeacher && (
                    <th className="w-16 px-3 py-3 text-center">
                      <div className="inline-flex items-center justify-center gap-2">
                        <GripVertical
                          size={14}
                          className="shrink-0 text-muted"
                          aria-hidden="true"
                        />
                        <input
                          type="checkbox"
                          aria-label="Select all visible teachers"
                          checked={
                            pageTeachers.length > 0 &&
                            pageTeachers.every((teacher) =>
                              selectedTeacherIds.includes(teacher.id),
                            )
                          }
                          onChange={(event) =>
                            setSelectedTeacherIds((current) =>
                              event.target.checked
                                ? Array.from(
                                    new Set([
                                      ...current,
                                      ...pageTeachers.map(
                                        (teacher) => teacher.id,
                                      ),
                                    ]),
                                  )
                                : current.filter(
                                    (id) =>
                                      !pageTeachers.some(
                                        (teacher) => teacher.id === id,
                                      ),
                                  ),
                            )
                          }
                          className="record-selection-checkbox"
                        />
                      </div>
                    </th>
                  )}
                  {displayedTeacherColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-3 text-xs font-medium uppercase tracking-wide ${isEditingTeacher ? (column.key === "id" ? "w-16" : column.key === "status" ? "w-24" : "") : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setTeacherSort((current) => ({
                            key: column.key,
                            direction:
                              current.key === column.key &&
                              current.direction === "asc"
                                ? "desc"
                                : "asc",
                          }))
                        }
                        className="inline-flex items-center gap-1 hover:text-primary"
                      >
                        {column.label}
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                  ))}
                  <th className="w-40 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTeachers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        displayedTeacherColumns.length +
                        (isEditingTeacher ? 1 : 2)
                      }
                      className="px-4 py-8 text-center text-muted"
                    >
                      {loading
                        ? "Loading teachers..."
                        : "No teacher records yet."}
                    </td>
                  </tr>
                ) : (
                  pageTeachers.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className={`entity-admin-table-row border-t border-default hover:bg-surface ${isEditingTeacher && selectedTeacher?.id === teacher.id ? "entity-admin-selected-row border-l-2 border-l-accent bg-accent-soft" : ""}`}
                    >
                      {!isEditingTeacher && (
                        <td className="w-16 px-3 py-4 text-center">
                          <div className="inline-flex items-center gap-2 text-muted">
                            <GripVertical size={14} aria-hidden="true" />
                            <input
                              type="checkbox"
                              aria-label={`Select ${teacher.full_name}`}
                              checked={selectedTeacherIds.includes(teacher.id)}
                              onChange={(event) =>
                                setSelectedTeacherIds((current) =>
                                  event.target.checked
                                    ? [...current, teacher.id]
                                    : current.filter((id) => id !== teacher.id),
                                )
                              }
                              className="record-selection-checkbox"
                            />
                          </div>
                        </td>
                      )}
                      {displayedTeacherColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-2 py-4 ${isEditingTeacher ? "truncate" : ""}`}
                        >
                          {column.render
                            ? column.render(teacher)
                            : column.value(teacher) || "—"}
                        </td>
                      ))}
                      <td className="w-40 px-2 py-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setViewTeacher({
                                ...teacher,
                                documents: normalizeDocuments(teacher.documents),
                              });
                              setShowViewModal(true);
                            }}
                            title="View teacher"
                            aria-label={`View ${teacher.full_name}`}
                            className="entity-admin-icon-button rounded p-2 text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => openEditModal(teacher)}
                            title="Edit teacher"
                            aria-label={`Edit ${teacher.full_name}`}
                            className="entity-admin-icon-button rounded p-2 text-slate-300 hover:bg-slate-700/60"
                          >
                            <Edit size={15} />
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
                            title={
                              teacher.is_active
                                ? "Deactivate teacher"
                                : "Activate teacher"
                            }
                            aria-label={
                              teacher.is_active
                                ? "Deactivate teacher"
                                : "Activate teacher"
                            }
                            className={`entity-admin-icon-button rounded p-2 ${teacher.is_active ? "text-red-300 hover:bg-red-500/10" : "text-green-300 hover:bg-green-500/10"}`}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(teacher.id)}
                            title="Delete teacher"
                            aria-label={`Delete ${teacher.full_name}`}
                            className="entity-admin-icon-button rounded p-2 text-red-300 hover:bg-red-500/10"
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
            className={`entity-admin-list-footer flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-default bg-surface px-3 py-3 text-xs text-muted ${isEditingTeacher ? "w-full md:w-1/2" : "w-full"}`}
          >
            <label className="flex items-center gap-2">
              Rows per page
              <select
                value={teacherPageSize}
                onChange={(event) => {
                  setTeacherPageSize(Number(event.target.value));
                  setTeacherCurrentPage(1);
                }}
                className="rounded border border-default bg-subtle px-2 py-1.5 text-sm text-primary"
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
                {sortedTeachers.length} records
              </span>
              <span>
                Page {visibleTeacherPage} of {teacherPageCount}
              </span>
              <div className="flex items-center gap-1">
                {[
                  { label: "First page", Icon: ChevronsLeft, page: 1 },
                  {
                    label: "Previous page",
                    Icon: ChevronLeft,
                    page: visibleTeacherPage - 1,
                  },
                  {
                    label: "Next page",
                    Icon: ChevronRight,
                    page: visibleTeacherPage + 1,
                  },
                  {
                    label: "Last page",
                    Icon: ChevronsRight,
                    page: teacherPageCount,
                  },
                ].map(({ label, Icon, page }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    title={label}
                    disabled={
                      label.includes("First") || label.includes("Previous")
                        ? visibleTeacherPage === 1
                        : visibleTeacherPage === teacherPageCount
                    }
                    onClick={() => setTeacherCurrentPage(page)}
                    className="rounded border border-default p-1.5 text-muted hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          style={
            modalMode === "edit" && editPanelBounds
              ? {
                  position: "absolute",
                  right: 0,
                  width: "min(560px, calc(100% - 300px))",
                  top: `${editPanelBounds.top}px`,
                  alignSelf: "start",
                  height: `${editPanelBounds.height}px`,
                  zIndex: 20,
                }
              : undefined
          }
          className={`${modalMode === "edit" ? `entity-edit-panel z-20 min-h-0 min-w-0 ${editPanelBounds ? "" : "w-full md:absolute md:right-0 md:w-[min(560px,calc(100%-300px))]"}` : "fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"}`}
        >
          <div
            className={`${modalMode === "edit" ? "flex h-full min-h-0 w-full min-w-0 max-w-none flex-col rounded-xl border border-default bg-surface shadow-lg" : "max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-default bg-surface shadow-2xl"} overflow-hidden`}
          >
            <div className="entity-edit-header flex h-11 items-center justify-between gap-4 border-b border-default px-5">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {modalMode === "create"
                    ? "Add Teacher"
                    : `EDIT TEACHER · ${selectedTeacher?.full_name || ""}`}
                </h2>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close teacher editor"
                className="rounded-lg p-2 text-muted transition hover:bg-subtle hover:text-primary"
              >
                <X size={20} />
              </button>
            </div>
            {modalMode === "edit" && (
              <nav
                aria-label="Teacher form sections"
                className="entity-edit-tabs flex shrink-0 gap-5 overflow-x-auto border-b border-default px-5"
              >
                {[
                  { label: "Personal", id: "personal", target: "teacher-personal" },
                  { label: "Contact", id: "contact", target: "teacher-contact" },
                  {
                    label: "Employment",
                    id: "employment",
                    target: "teacher-employment",
                  },
                  {
                    label: "Documents",
                    id: "documents",
                    target: "teacher-documents",
                  },
                ].map(({ label, id, target }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveTeacherSection(id);
                      document.getElementById(target)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    aria-current={activeTeacherSection === id ? "location" : undefined}
                    className={`shrink-0 border-b-2 px-0.5 py-3 text-sm transition ${
                      activeTeacherSection === id
                        ? "border-accent text-accent"
                        : "border-transparent text-muted hover:text-primary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            )}
            <form
              id="teacher-edit-form"
              onSubmit={handleSubmit}
              className={`px-5 py-5 ${modalMode === "edit" ? "entity-edit-form min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden" : "space-y-6"}`}
            >
              <div className="space-y-5">
                <h3 id="teacher-personal" className="scroll-mt-4 text-lg font-semibold text-primary">
                  Personal Details
                </h3>
                {(
                  <div className="rounded-2xl border border-default bg-surface p-3">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-default bg-accent-soft text-sm font-semibold text-accent">
                        {profilePhotoPreview ? (
                          <img
                            src={profilePhotoPreview}
                            alt="Profile photo"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (formData.full_name || "T")
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0].toUpperCase())
                            .join("")
                        )}
                      </div>
                      <label className="cursor-pointer rounded-xl border border-default bg-subtle px-3 py-2 text-xs font-medium text-primary hover:bg-subtle">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      {(profilePhotoPreview || formData.profile_photo_url) && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePhoto(null);
                            setProfilePhotoPreview("");
                            setFormData((current) => ({
                              ...current,
                              profile_photo_url: "",
                            }));
                          }}
                          className="text-xs text-danger hover:text-danger"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">Gender</label>
                        <input
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                          placeholder="Male / Female / Other"
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
                          Personal Email
                        </label>
                        <input
                          type="email"
                          required={
                            modalMode === "create" &&
                            formData.provide_login_credentials &&
                            !formData.work_email
                          }
                          value={formData.personal_email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              personal_email: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <h3 id="teacher-employment" className="scroll-mt-4 text-lg font-semibold text-primary">
                  Professional Information
                </h3>
                {(
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-default bg-surface p-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
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
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required={
                          modalMode === "create" &&
                          formData.provide_login_credentials &&
                          !formData.personal_email
                        }
                        value={formData.work_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            work_email: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
                        Subjects Taught
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          const courseId = e.target.value;
                          if (
                            courseId &&
                            !selectedCourseIds.includes(courseId)
                          ) {
                            setSelectedCourseIds((current) => [
                              ...current,
                              courseId,
                            ]);
                          }
                        }}
                        disabled={!availableCourses.length}
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary disabled:opacity-60"
                      >
                        <option value="">
                          {availableCourses.length
                            ? "Select a course to assign"
                            : "No active courses available"}
                        </option>
                        {availableCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.course_name}
                            {course.class_name || course.classroom_name
                              ? ` — ${course.class_name || course.classroom_name}`
                              : ""}
                            {course.classroom_section_name
                              ? ` (${course.classroom_section_name})`
                              : ""}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 rounded-lg border border-default bg-surface px-3 py-2 text-sm text-primary">
                        {selectedCourses.length
                          ? selectedCourses
                              .map((course) => course.course_name)
                              .join(", ")
                          : "No courses assigned"}
                      </div>
                      {selectedCourses.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedCourses.map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() =>
                                setSelectedCourseIds((current) =>
                                  current.filter(
                                    (id) => id !== String(course.id),
                                  ),
                                )
                              }
                              aria-label={`Remove ${course.course_name}`}
                              className="rounded-full border border-default px-2 py-1 text-xs text-muted hover:border-danger hover:text-danger"
                            >
                              Remove {course.course_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-primary">
                  Qualification & Education
                </h3>
                {(
                  <div className="grid gap-4 rounded-3xl border border-default bg-surface p-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-primary">
                  Banking & Insurance
                </h3>
                {(
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-default bg-surface p-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-muted">
                        Allowances (Travel, House, Medical)
                      </label>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
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
                          className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-primary">
                  Experience
                </h3>
                {(
                  <div className="grid gap-4 rounded-3xl border border-default bg-surface p-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">To Date</label>
                      <input
                        type="date"
                        value={formData.previous_to_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previous_to_date: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-primary">
                  Identity & Legal
                </h3>
                {(
                  <div className="grid gap-4 rounded-3xl border border-default bg-surface p-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                  </div>
                )}

                <h3 id="teacher-contact" className="scroll-mt-4 text-lg font-semibold text-primary">
                  Emergency Contact
                </h3>
                {(
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-default bg-surface p-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted">
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
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-muted">Address</label>
                      <input
                        value={formData.emergency_contact_address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_address: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                      />
                    </div>
                  </div>
                )}

                <h3 id="teacher-documents" className="scroll-mt-4 text-lg font-semibold text-primary">
                  Required Documents
                </h3>
                {(
                  <div className="space-y-4 rounded-3xl border border-default bg-surface p-4">
                    <div className="rounded-3xl border border-default bg-surface p-4">
                      <label className="text-sm text-muted">
                        Upload Documents
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={handleAttachmentsChange}
                        className="mt-2 w-full text-sm text-primary file:rounded-xl file:border file:border-default file:bg-subtle file:px-3 file:py-2 file:text-sm file:text-primary"
                      />
                      <p className="mt-2 text-xs text-muted">
                        Upload PDFs, images, or scanned documents for this
                        teacher.
                      </p>
                    </div>
                    {attachments.length > 0 && (
                      <div className="grid gap-2">
                        {attachments.map((att, index) => (
                          <div
                            key={`${att.file.name}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-default bg-surface px-3 py-2 text-sm text-primary"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-primary">
                                {att.file.name}
                              </p>
                              <p className="text-xs text-muted">
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
                                className="mt-2 w-full rounded-xl border border-default bg-surface px-2 py-1 text-sm text-primary"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="rounded-full border border-default px-2 py-1 text-xs text-muted hover:bg-subtle"
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
              {modalMode === "create" && (
                <section className="rounded-lg border border-accent bg-accent-soft px-4 py-3">
                  <label
                    htmlFor="teacher-portal-credentials"
                    className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[auto_minmax(220px,0.9fr)_minmax(0,1.4fr)] sm:gap-x-4"
                  >
                    <input
                      id="teacher-portal-credentials"
                      type="checkbox"
                      checked={formData.provide_login_credentials === true}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          provide_login_credentials: event.target.checked,
                        })
                      }
                      className="row-span-2 h-4 w-4 shrink-0 accent-[var(--accent)] sm:row-span-1"
                    />
                    <span className="min-w-0 text-sm font-semibold leading-5 text-primary">
                      Create teacher portal login and email credentials
                    </span>
                    <span className="col-start-2 min-w-0 text-xs leading-5 text-muted sm:col-start-auto sm:text-sm">
                      A temporary password and dedicated teacher portal links will be sent to the work or personal email above.
                    </span>
                  </label>
                </section>
              )}

              <div className="sticky bottom-[-1.25rem] z-10 -mx-5 -mb-5 flex flex-col gap-3 border-t border-default bg-surface px-5 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-default px-4 py-2 text-sm text-primary hover:bg-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {modalMode === "create" ? "Create Teacher" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div
            className="app-modal-surface max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-default shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-default px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  {viewTeacher.full_name}
                </h2>
                <p className="text-sm text-muted">
                  Teacher profile and documents
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${viewTeacher.is_active ? "bg-success text-success" : "bg-danger text-danger"}`}
                >
                  {viewTeacher.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={printTeacherInfo}
                  className="inline-flex items-center gap-2 rounded-xl border border-default bg-subtle px-3 py-2 text-xs font-semibold text-primary hover:bg-subtle"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-muted hover:text-primary"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-3">
              <div className="col-span-1 flex flex-col items-center gap-4">
                <div className="h-40 w-40 overflow-hidden rounded-full bg-subtle">
                  {viewTeacher.profile_photo_url ? (
                    <img
                      src={viewTeacher.profile_photo_url}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted">
                      No photo
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-primary font-semibold">
                    {viewTeacher.full_name}
                  </div>
                  <div className="text-sm text-muted">
                    {viewTeacher.designation || "—"}
                  </div>
                </div>
              </div>
              <div className="col-span-2 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-default bg-surface p-3">
                    <div className="text-xs text-muted">Work Email</div>
                    <div className="text-sm text-primary">
                      {viewTeacher.work_email ||
                        viewTeacher.personal_email ||
                        "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-default bg-surface p-3">
                    <div className="text-xs text-muted">Phone</div>
                    <div className="text-sm text-primary">
                      {viewTeacher.personal_phone ||
                        viewTeacher.work_phone ||
                        "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-default bg-surface p-3">
                    <div className="text-xs text-muted">Department</div>
                    <div className="text-sm text-primary">
                      {departments.find(
                        (d) => d.id === viewTeacher.department_id,
                      )?.name || "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-default bg-surface p-3">
                    <div className="text-xs text-muted">Joined</div>
                    <div className="text-sm text-primary">
                      {viewTeacher.join_date || "—"}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Address</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.current_address ||
                      viewTeacher.permanent_address ||
                      "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted">Documents</div>
                    <div className="text-xs text-muted">
                      {(viewTeacher.documents || []).length} files
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {(viewTeacher.documents || []).length === 0 ? (
                      <div className="text-sm text-muted">No documents</div>
                    ) : (
                      (viewTeacher.documents || []).map((d, i) => (
                        <div
                          key={d.id || i}
                          className="flex items-center justify-between rounded-lg border border-default bg-surface px-3 py-2"
                        >
                          <div>
                            <div className="text-sm text-primary">
                              {d.title || d.name || "Document"}
                            </div>
                            <div className="text-xs text-muted">
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
                              className="text-sm text-accent hover:underline"
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
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Designation</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.designation || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Employment Type</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.employment_type || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Reporting Manager
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.reporting_manager || "—"}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Subjects Taught</div>
                  <div className="text-sm text-primary">
                    {Array.isArray(viewTeacher.subjects_taught)
                      ? viewTeacher.subjects_taught.join(", ")
                      : viewTeacher.subjects_taught || "—"}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Classes Assigned</div>
                  <div className="text-sm text-primary">
                    {Array.isArray(viewTeacher.classes_assigned)
                      ? viewTeacher.classes_assigned.join(", ")
                      : viewTeacher.classes_assigned || "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Highest Qualification
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.highest_qualification || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Institution</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.institution_name || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Major Subject</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.major_subject || "—"}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Additional Certifications
                  </div>
                  <div className="text-sm text-primary">
                    {Array.isArray(viewTeacher.additional_certifications)
                      ? viewTeacher.additional_certifications.join(", ")
                      : viewTeacher.additional_certifications || "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Previous Organization
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.previous_organization || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Previous Position
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.previous_position || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Previous From - To
                  </div>
                  <div className="text-sm text-primary">
                    {(viewTeacher.previous_from_date || "—") +
                      (viewTeacher.previous_to_date
                        ? " - " + viewTeacher.previous_to_date
                        : "")}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Previous Leave Reason
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.previous_leave_reason || "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Citizenship No</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.citizenship_number || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Citizenship Issued
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.citizenship_issued_date || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Citizenship District
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.citizenship_issued_district || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Passport No</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.passport_number || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Passport Expiry</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.passport_expiry_date || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    PAN / National ID
                  </div>
                  <div className="text-sm text-primary">
                    {(viewTeacher.pan_number || "") +
                      (viewTeacher.national_id_number
                        ? " / " + viewTeacher.national_id_number
                        : "") || "—"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Bank</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.bank_name || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Branch</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.bank_branch || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Account No</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.account_number || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Account Holder</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.account_holder_name || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Salary Grade</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.salary_grade || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Basic Salary</div>
                  <div className="text-sm text-primary">
                    {viewTeacher.basic_salary || "—"}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">Allowances</div>
                  <div className="text-sm text-primary">
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
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Emergency Contact Name
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.emergency_contact_name || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Emergency Relationship
                  </div>
                  <div className="text-sm text-primary">
                    {viewTeacher.emergency_contact_relationship || "—"}
                  </div>
                </div>
                <div className="md:col-span-2 rounded-xl border border-default bg-surface p-3">
                  <div className="text-xs text-muted">
                    Emergency Phone / Address
                  </div>
                  <div className="text-sm text-primary">
                    {(viewTeacher.emergency_contact_phone || "—") +
                      (viewTeacher.emergency_contact_address
                        ? " / " + viewTeacher.emergency_contact_address
                        : "")}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-2 p-4 border-t border-default">
              <button
                onClick={() => setShowAllDocumentsModal(true)}
                className="rounded-xl border border-default bg-subtle px-4 py-2 text-sm font-semibold text-accent hover:bg-subtle hover:text-accent"
              >
                View All Documents
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewTeacher(null);
                  }}
                  className="rounded-xl border border-default px-4 py-2 text-sm text-primary hover:bg-subtle"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(viewTeacher);
                  }}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-primary hover:bg-accent"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllDocumentsModal && viewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-default bg-surface shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-default px-6 py-4 sticky top-0 bg-surface">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  All Documents
                </h2>
                <p className="text-sm text-muted">
                  {viewTeacher.full_name} —{" "}
                  {(viewTeacher.documents || []).length} files
                </p>
              </div>
              <button
                onClick={() => setShowAllDocumentsModal(false)}
                className="text-muted hover:text-primary"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {(viewTeacher.documents || []).length === 0 ? (
                <div className="rounded-xl border border-default bg-surface p-8 text-center">
                  <div className="text-muted">No documents attached</div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {(viewTeacher.documents || []).map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="rounded-xl border border-default bg-surface p-4 hover:border-accent hover:bg-surface transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-primary truncate">
                            {doc.title || doc.name || "Document"}
                          </h3>
                          <p className="text-xs text-muted mt-1">
                            {doc.uploaded_at
                              ? new Date(doc.uploaded_at).toLocaleString()
                              : "No date"}
                          </p>
                          <p className="text-xs text-muted mt-2 break-all">
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
                                className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-accent text-primary text-xs font-semibold hover:bg-accent whitespace-nowrap"
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
                                className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-default text-primary text-xs font-semibold hover:bg-subtle whitespace-nowrap"
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
            <div className="flex justify-end gap-2 p-4 border-t border-default sticky bottom-0 bg-surface">
              <button
                onClick={() => setShowAllDocumentsModal(false)}
                className="rounded-xl border border-default px-4 py-2 text-sm text-primary hover:bg-subtle"
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
