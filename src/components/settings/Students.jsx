import { useEffect, useState, useRef } from "react";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  exportStudentsCsv,
} from "../../api/studentsApi";
import config from "../../config/config";
import Button from "../common/Button";
import {
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  ChevronDown,
  Eye,
} from "lucide-react";
import SettingsModal from "../common/SettingsModal";

const NATIONALITIES = ["Nepalese"];

const emptyStudent = {
  student_type: "school",
  full_name: "",
  profile_picture: "",
  nationality: "Nepalese",
  gender: "",
  date_of_birth: "",
  legal_entity: "",
  batch: "",
  semester: "",
  roll_no: "",
  university_reg_no: "",
  admission_no: "",
  admission_date: "",
  category_stream: "",
  student_mail: "",
  school_email: "",
  phone_no: "",
  address: "",
  current_address: "",
  home_district: "",
  home_municipality: "",
  home_ward: "",
  home_full_address: "",
  father_name: "",
  father_qualification: "",
  father_profession: "",
  father_organization: "",
  mother_name: "",
  mother_qualification: "",
  mother_profession: "",
  mother_organization: "",
  guardian_name: "",
  guardian_email: "",
  guardian_phone: "",
  guardian_qualification: "",
  guardian_profession: "",
  guardian_organization: "",
  document_titles: "",
  transportation_required: false,
  bus_service: false,
  hostel_required: false,
  meal_type: "",
  meal_eligibility_date: "",
  eca_interests: "",
  learning_styles: "",
  previous_school: "",
  blood_group: "",
  allergies: "",
  height: "",
  weight: "",
  measurement_date: "",
  special_needs: "",
  medical_notes: "",
  classroom_id: null,
  class_id: null,
  section_id: null,
  section_id: null,
  is_active: true,
  additional_info: "",
};

const Section = ({ title, open, onToggle, children }) => (
  <div className="mb-4 border border-slate-700/40 rounded">
    <div
      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/30"
      onClick={onToggle}
    >
      <div className="font-medium text-slate-200">{title}</div>
      <ChevronDown
        size={18}
        className={`transform transition ${open ? "rotate-180" : ""} text-slate-400`}
      />
    </div>
    {open && (
      <div className="p-4 border-t border-slate-700/20 bg-slate-900/50">
        {children}
      </div>
    )}
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) => (
  <div>
    <label className="block text-sm text-slate-300 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      required={required}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false }) => (
  <div>
    <label className="block text-sm text-slate-300 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <select
      required={required}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
    >
      <option value="">-- Select --</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const TextAreaField = ({ label, value, onChange, rows = 3 }) => (
  <div>
    <label className="block text-sm text-slate-300 mb-1">{label}</label>
    <textarea
      value={value || ""}
      onChange={onChange}
      rows={rows}
      className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
    />
  </div>
);

const CheckboxField = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      id={`chk_${label}`}
      type="checkbox"
      checked={checked || false}
      onChange={onChange}
      className="w-4 h-4 rounded cursor-pointer"
    />
    <label
      htmlFor={`chk_${label}`}
      className="text-sm text-slate-300 cursor-pointer"
    >
      {label}
    </label>
  </div>
);

const RadioField = ({ label, name, value, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      id={`radio_${value}`}
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded cursor-pointer"
    />
    <label
      htmlFor={`radio_${value}`}
      className="text-sm text-slate-300 cursor-pointer"
    >
      {label}
    </label>
  </div>
);

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyStudent);
  const [profileFile, setProfileFile] = useState(null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [profilePreview, setProfilePreview] = useState("");
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newDocumentsPreview, setNewDocumentsPreview] = useState([]);
  const createEmptyRows = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      file: null,
      title: "",
      saved: false,
    }));
  const [documentRows, setDocumentRows] = useState(() => createEmptyRows(1));
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classroomFilter, setClassroomFilter] = useState("all");
  const [viewStudent, setViewStudent] = useState(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const fileRef = useRef();
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    contact: true,
    family: false,
    transportation: false,
    dietary: false,
    learning: false,
    education: false,
    medical: false,
    classroom: true,
    status: false,
    additional: false,
    documents: false,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const expandAll = () =>
    setExpandedSections(
      Object.keys(expandedSections).reduce((a, k) => ({ ...a, [k]: true }), {}),
    );
  const collapseAll = () =>
    setExpandedSections(
      Object.keys(expandedSections).reduce(
        (a, k) => ({ ...a, [k]: false }),
        {},
      ),
    );

  const isUniversity = form.student_type === "university";
  const isSchool = form.student_type === "school";
  const getImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http") || value.startsWith("blob:")) return value;
    if (value.startsWith("/")) return `${config.API_BASE_URL}${value}`;
    return value;
  };

  const renderDetail = (label, value) => (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="text-sm text-slate-200">{value || "—"}</div>
    </div>
  );

  const handleViewResults = () => {
    if (!viewStudent?.id) return;
    window.location.href = `/results?studentId=${encodeURIComponent(viewStudent.id)}`;
  };

  const handlePrintStudent = () => {
    if (!viewStudent) return;
    const imgUrl = getImageUrl(viewStudent.profile_picture || "");

    // Helper to extract initials
    const getInitials = (name) => {
      if (!name) return "??";
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(viewStudent.full_name);
    const typeLabel =
      viewStudent.student_type === "university" ? "University" : "School";
    const isUniv = viewStudent.student_type === "university";
    const className =
      viewStudent.class_name || viewStudent.classroom_name || "N/A";
    const sectionName =
      viewStudent.section_name || "N/A";

    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Profile - ${viewStudent.full_name}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f3f4f6; padding: 40px; margin: 0; color: #1f2937; }
            * { box-sizing: border-box; }
            .container { max-width: 850px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); position: relative; padding: 32px; color: white; }
            .header-bg-shape { position: absolute; top: 0; right: 0; bottom: 0; width: 50%; background: radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 70%); border-top-right-radius: 16px; pointer-events: none; }
            .header-top { display: flex; gap: 24px; align-items: center; position: relative; z-index: 1; }
            .avatar { width: 80px; height: 80px; border-radius: 50%; background: #3b82f6; border: 3px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: white; object-fit: cover; flex-shrink: 0; }
            .header-info h1 { margin: 0 0 8px 0; font-size: 28px; font-family: 'Merriweather', 'Georgia', serif; font-weight: 700; }
            .header-subtitle { font-size: 13px; color: #bfdbfe; margin-bottom: 12px; }
            .badges { display: flex; gap: 8px; flex-wrap: wrap; }
            .badge { padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
            .badge-active { background: #064e3b; color: #34d399; }
            .badge-inactive { background: #7f1d1d; color: #fca5a5; }
            .badge-school { background: rgba(0, 0, 0, 0.2); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); }
            .badge-date { background: rgba(0, 0, 0, 0.2); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); }
            .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
            .header-stats { display: grid; grid-template-columns: repeat(5, 1fr); background: #172554; padding: 16px 32px; position: relative; z-index: 1; }
            .stat-item { text-align: center; border-right: 1px solid rgba(255, 255, 255, 0.1); padding: 0 8px; }
            .stat-item:last-child { border-right: none; }
            .stat-label { font-size: 9px; text-transform: uppercase; color: #93c5fd; margin-bottom: 6px; font-weight: 700; letter-spacing: 0.05em; }
            .stat-value { font-size: 13px; font-weight: 600; color: white; word-break: break-word; }
            
            .content { padding: 32px; }
            .section { margin-bottom: 32px; }
            .section-title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 700; font-family: 'Merriweather', 'Georgia', serif; color: #1f2937; margin-bottom: 16px; }
            .section-icon { width: 28px; height: 28px; background: #f3f4f6; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
            
            .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }
            .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; }
            .grid-1 { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }
            .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
            
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; background: #ffffff; }
            .card-label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; margin-bottom: 6px; letter-spacing: 0.05em; }
            .card-value { font-size: 13px; color: #374151; font-weight: 500; word-break: break-word; }
            .card-value.blue { color: #2563eb; }
            
            .health-card { text-align: center; padding: 16px; }
            .health-icon { font-size: 20px; margin-bottom: 8px; }
            
            .footer { padding: 24px 32px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; color: #6b7280; font-size: 12px; background: #f9fafb; }
            
            @media print {
              body { background: white; padding: 0; }
              .container { box-shadow: none; border-radius: 0; max-width: 100%; border: none; }
              .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; border-radius: 0; }
              .header-stats { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .section-icon { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .avatar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-bg-shape"></div>
              <div class="header-top">
                ${
                  imgUrl
                    ? '<img class="avatar" src="' +
                      imgUrl +
                      '" alt="Profile" />'
                    : '<div class="avatar">' + initials + "</div>"
                }
                <div class="header-info">
                  <h1>${viewStudent.full_name || "Student Profile"}</h1>
                  <div class="header-subtitle">
                    Student Profile &bull; Roll No. ${viewStudent.roll_no || "N/A"} &bull; ${isUniv ? "Batch " + (viewStudent.batch || "N/A") : "Class " + className + " / Section " + sectionName}
                  </div>
                  <div class="badges">
                    <span class="badge ${viewStudent.is_active ? "badge-active" : "badge-inactive"}">
                      <span class="dot"></span> ${viewStudent.is_active ? "Active" : "Inactive"}
                    </span>
                    <span class="badge badge-school">
                      🏫 ${typeLabel}
                    </span>
                    ${viewStudent.admission_date ? '<span class="badge badge-date">📅 Admitted ' + viewStudent.admission_date + "</span>" : ""}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="header-stats">
              <div class="stat-item">
                <div class="stat-label">BATCH / CLASS</div>
                <div class="stat-value">${isUniv ? viewStudent.batch || "—" : className}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">SEMESTER / SECTION</div>
                <div class="stat-value">${isUniv ? viewStudent.semester || "—" : sectionName}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">CATEGORY / STREAM</div>
                <div class="stat-value">${viewStudent.category_stream || "—"}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">UNIVERSITY REG.</div>
                <div class="stat-value">${viewStudent.university_reg_no || "—"}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">SCHOOL / COLLEGE</div>
                <div class="stat-value">${viewStudent.legal_entity || "—"}</div>
              </div>
            </div>

            <div class="content">
              <!-- Personal Information -->
              <div class="section">
                <div class="section-title">
                  <div class="section-icon">👤</div> Personal Information
                </div>
                <div class="grid-3">
                  <div class="card">
                    <div class="card-label">Full Name</div>
                    <div class="card-value">${viewStudent.full_name || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Nationality</div>
                    <div class="card-value">${viewStudent.nationality || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Gender</div>
                    <div class="card-value" style="text-transform: capitalize;">${viewStudent.gender || "—"}</div>
                  </div>
                </div>
                <div class="grid-2">
                  <div class="card">
                    <div class="card-label">Date of Birth</div>
                    <div class="card-value">${viewStudent.date_of_birth || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Admission No.</div>
                    <div class="card-value">${viewStudent.admission_no || "—"}</div>
                  </div>
                </div>
              </div>

              <!-- Contact Details -->
              <div class="section">
                <div class="section-title">
                  <div class="section-icon">✉️</div> Contact Details
                </div>
                <div class="grid-2">
                  <div class="card">
                    <div class="card-label">Email</div>
                    <div class="card-value blue">${viewStudent.student_mail || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Phone</div>
                    <div class="card-value">${viewStudent.phone_no || "—"}</div>
                  </div>
                </div>
                <div class="grid-2">
                  <div class="card">
                    <div class="card-label">School Email</div>
                    <div class="card-value blue">${viewStudent.school_email || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Address</div>
                    <div class="card-value">${viewStudent.address || "—"}</div>
                  </div>
                </div>
                <div class="grid-1">
                  <div class="card">
                    <div class="card-label">Current Address</div>
                    <div class="card-value">${viewStudent.current_address || "—"}</div>
                  </div>
                </div>
              </div>

              <!-- Family & Guardian Information -->
              <div class="section">
                <div class="section-title">
                  <div class="section-icon">🏡</div> Family & Guardian Information
                </div>
                <div class="grid-3">
                  <div class="card">
                    <div class="card-label">Home District</div>
                    <div class="card-value">${viewStudent.home_district || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Municipality</div>
                    <div class="card-value">${viewStudent.home_municipality || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Ward</div>
                    <div class="card-value">${viewStudent.home_ward || "—"}</div>
                  </div>
                </div>
                <div class="grid-1">
                  <div class="card">
                    <div class="card-label">Full Home Address</div>
                    <div class="card-value">${viewStudent.home_full_address || "—"}</div>
                  </div>
                </div>
                <div class="grid-3">
                  <div class="card">
                    <div class="card-label">Father Name</div>
                    <div class="card-value">${viewStudent.father_name || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Mother Name</div>
                    <div class="card-value">${viewStudent.mother_name || "—"}</div>
                  </div>
                  <div class="card">
                    <div class="card-label">Guardian Name</div>
                    <div class="card-value">${viewStudent.guardian_name || "—"}</div>
                  </div>
                </div>
                <div class="grid-3">
                  <div class="card">
                    <div class="card-label">Guardian Phone</div>
                    <div class="card-value">${viewStudent.guardian_phone || "—"}</div>
                  </div>
                </div>
              </div>

              <!-- Health Profile -->
              <div class="section">
                <div class="section-title">
                  <div class="section-icon">❤️</div> Health Profile
                </div>
                <div class="grid-4">
                  <div class="card health-card">
                    <div class="health-icon">🩸</div>
                    <div class="card-label">Blood Group</div>
                    <div class="card-value">${viewStudent.blood_group || "—"}</div>
                  </div>
                  <div class="card health-card">
                    <div class="health-icon">⚠️</div>
                    <div class="card-label">Allergies</div>
                    <div class="card-value">${viewStudent.allergies || "—"}</div>
                  </div>
                  <div class="card health-card">
                    <div class="health-icon">♿</div>
                    <div class="card-label">Special Needs</div>
                    <div class="card-value">${viewStudent.special_needs || "—"}</div>
                  </div>
                  <div class="card health-card">
                    <div class="health-icon">📋</div>
                    <div class="card-label">Notes</div>
                    <div class="card-value">${viewStudent.additional_info || "—"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div>Student Profile &bull; ${viewStudent.full_name} &bull; Generated ${new Date().getFullYear()}</div>
              <div class="badge ${viewStudent.is_active ? "badge-active" : "badge-inactive"}">
                <span class="dot"></span> ${viewStudent.is_active ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();

    // Give images time to load before printing
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getStudents();
      setStudents(res.data?.data || []);
    } catch (e) {
      const errMsg =
        e.response?.data?.message || e.message || "Unable to load students";
      setError(errMsg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cls = await (
          await import("../../api/classroomsApi")
        ).getClassrooms();
        setClassesList(cls.data?.data || []);
        if (cls.data?.data?.[0]) {
          try {
            const secs = await (
              await import("../../api/classroomsApi")
            ).getClassroomSections(cls.data.data[0].id);
            setSectionsList(secs.data?.data || []);
          } catch (e) {}
        }
      } catch (err) {}
    })();
  }, []);

  useEffect(() => {
    if (!form.classroom_id) return;
    (async () => {
      try {
        const secs = await (
          await import("../../api/classroomsApi")
        ).getClassroomSections(form.classroom_id);
        setSectionsList(secs.data?.data || []);
      } catch (e) {
        setSectionsList([]);
      }
    })();
  }, [form.classroom_id]);

  useEffect(() => {
    if (!viewStudent) {
      setShowDocumentViewer(false);
    }
  }, [viewStudent]);

  const openCreate = () => {
    setError("");
    setMode("create");
    setSelected(null);
    setForm(emptyStudent);
    setProfileFile(null);
    setProfilePreview("");
    setExistingDocuments([]);
    setNewDocumentsPreview([]);
    setDocumentFiles([]);
    setDocumentRows(createEmptyRows(1));
    setShowModal(true);
  };

  const openEdit = (s) => {
    setError("");
    setMode("edit");
    setSelected(s);
    const formatDateForInput = (dStr) => {
      if (!dStr) return "";
      try {
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toISOString().split("T")[0];
      } catch (e) {
        return dStr;
      }
    };
    setForm({
      ...s,
      date_of_birth: formatDateForInput(s.date_of_birth),
      admission_date: formatDateForInput(s.admission_date),
      meal_eligibility_date: formatDateForInput(s.meal_eligibility_date),
      measurement_date: formatDateForInput(s.measurement_date),
    });
    setProfileFile(null);
    setProfilePreview(getImageUrl(s?.profile_picture || ""));
    // populate existing documents for preview (these are objects from backend)
    setExistingDocuments(s.documents || []);
    setNewDocumentsPreview([]);
    setDocumentFiles([]);
    // ensure at least 1 row available for adding new docs (plus existing count)
    const base = Math.max(1, (s.documents || []).length + 1);
    setDocumentRows(createEmptyRows(base));
    setShowModal(true);
    (async () => {
      try {
        // ensure classrooms list loaded
        const clsResp = await (
          await import("../../api/classroomsApi")
        ).getClassrooms();
        const clsList = clsResp.data?.data || [];
        setClassesList(clsList);

        // attempt to map classroom by id or name
        let mappedClassroomId = s.classroom_id || null;
        if (!mappedClassroomId) {
          const nameToMatch = s.classroom_name || s.class_name || "";
          if (nameToMatch) {
            const found = clsList.find((c) => c.name === nameToMatch);
            if (found) mappedClassroomId = found.id;
          }
        }

        if (mappedClassroomId) {
          const secs = await (
            await import("../../api/classroomsApi")
          ).getClassroomSections(mappedClassroomId);
          const secsList = secs.data?.data || [];
          setSectionsList(secsList);
          // attempt to map section by id or name
          let mappedSectionId = s.section_id || null;
          if (!mappedSectionId) {
            const sName = s.section_name || "";
            if (sName) {
              const foundS = secsList.find(
                (x) => (x.section_name || x.name) === sName,
              );
              if (foundS) mappedSectionId = foundS.id;
            }
          }
          // update form with mapped ids (keep legacy class_id if present)
          setForm((prev) => ({
            ...prev,
            class_id: s.class_id || null,
            classroom_id: mappedClassroomId,
            section_id: mappedSectionId,
            section_id: mappedSectionId,
          }));
        }
      } catch (e) {
        setSectionsList([]);
      }
    })();
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      const payload = {
        ...form,
        address: form.address || form.current_address || "",
      };
      if (profileFile || documentFiles.length) {
        const fd = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val === undefined || val === null) return;
          fd.append(key, val);
        });
        if (profileFile) fd.append("profile_picture_file", profileFile);
        documentFiles.forEach((f) => fd.append("documents", f));
        if (newDocumentsPreview.length) {
          const titlesJson = JSON.stringify(
            newDocumentsPreview.map((d) => d.title),
          );
          fd.append("document_titles", titlesJson);
        } else if (form.document_titles) {
          fd.append("document_titles", form.document_titles);
        }
        if (mode === "create") await createStudent(fd);
        else await updateStudent(selected.id, fd);
      } else {
        if (mode === "create") await createStudent(payload);
        else await updateStudent(selected.id, payload);
      }
      await load();
      setShowModal(false);
      setForm(emptyStudent);
      setProfileFile(null);
      setProfilePreview("");
      setExistingDocuments([]);
      setNewDocumentsPreview([]);
      setDocumentFiles([]);
      setDocumentRows(createEmptyRows(1));
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Error saving student";
      setError(errMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete student?")) return;
    try {
      setError("");
      setLoading(true);
      await deleteStudent(id);
      await load();
    } catch (e) {
      const errMsg =
        e.response?.data?.message || e.message || "Error deleting student";
      setError(errMsg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text) => {
    const rows = [];
    let cur = "";
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        row.push(cur);
        cur = "";
      } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else {
        cur += ch;
      }
    }
    if (cur !== "" || row.length) {
      row.push(cur);
      rows.push(row);
    }
    return rows;
  };

  const normalizeHeader = (h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const mapRowToStudent = (headers, cols) => {
    const obj = {};
    headers.forEach((hh, idx) => {
      const key = normalizeHeader(hh);
      const val = (cols[idx] || "").trim();
      switch (key) {
        case "first_name":
        case "last_name":
          obj.full_name = (obj.full_name ? obj.full_name + " " : "") + val;
          break;
        case "name":
        case "fullname":
          obj.full_name = val;
          break;
        case "email":
          obj.student_mail = val;
          break;
        case "phone":
          obj.phone_no = val;
          break;
        case "guardian":
          obj.guardian_name = val;
          break;
        case "dob":
          obj.date_of_birth = val;
          break;
        case "roll_no":
          obj.roll_no = val ? Number(val) : null;
          break;
        case "bus_service":
        case "transportation_required":
        case "hostel_required":
          obj[key] = ["1", "true", "yes"].includes(val.toLowerCase());
          break;
        default:
          obj[key] = val;
      }
    });
    return obj;
  };

  const handleImport = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) {
      setError("Select CSV file");
      return;
    }
    const text = await f.text();
    const parsed = parseCSV(text);
    if (!parsed || parsed.length < 2) {
      setError("CSV appears empty or invalid");
      return;
    }
    const rawHeaders = parsed[0].map((h) => h.replace(/^\"|\"$/g, "").trim());
    const rows = parsed.slice(1).map((cols) =>
      mapRowToStudent(
        rawHeaders,
        cols.map((c) => c.replace(/^\"|\"$/g, "")),
      ),
    );
    try {
      setError("");
      setLoading(true);
      await importStudents(rows);
      await load();
      fileRef.current.value = "";
      setError("✅ Imported successfully");
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Import failed";
      setError(errMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await exportStudentsCsv();
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "students.csv";
      a.click();
      URL.revokeObjectURL(url);
      setError("✅ Export successful");
      setTimeout(() => setError(""), 2000);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Export failed";
      setError(errMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onProfileFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setProfileFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePreview(url);
    } else {
      setProfilePreview(getImageUrl(form.profile_picture || ""));
    }
  };

  const onDocumentFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    // append selected files to the first empty row(s)
    setDocumentRows((prev) => {
      const next = [...prev];
      let fi = 0;
      for (let i = 0; i < next.length && fi < files.length; i++) {
        if (!next[i].file && !next[i].saved) {
          next[i] = { ...next[i], file: files[fi] };
          fi++;
        }
      }
      // if more files remain, add extra rows
      while (fi < files.length) {
        next.push({
          id: next.length + 1,
          file: files[fi],
          title: "",
          saved: false,
        });
        fi++;
      }
      return next;
    });
  };

  useEffect(
    () => () => {
      if (profilePreview && profilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
      }
    },
    [profilePreview],
  );

  const handleRowFileChange = (idx, e) => {
    const file = e.target.files?.[0] || null;
    setDocumentRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], file };
      return copy;
    });
  };

  const handleRowTitleChange = (idx, val) => {
    setDocumentRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], title: val };
      return copy;
    });
  };

  const saveRow = (idx) => {
    const row = documentRows[idx];
    if (!row || !row.file) return;
    // add file to upload queue and record title in preview
    setDocumentFiles((prev) => [...prev, row.file]);
    setNewDocumentsPreview((prev) => [
      ...prev,
      { filename: row.file.name, title: row.title || row.file.name },
    ]);
    setDocumentRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], saved: true };
      // ensure an empty row exists at the end
      if (copy.filter((r) => !r.saved).length === 0)
        copy.push({ id: copy.length + 1, file: null, title: "", saved: false });
      return copy;
    });
  };

  const removeNewDocument = (index) => {
    // remove preview and corresponding file by index
    setNewDocumentsPreview((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    setDocumentFiles((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const removeExistingDocument = async (docId) => {
    if (!selected?.id) return;
    if (!confirm("Remove this document?")) return;
    try {
      setLoading(true);
      await (
        await import("../../api/studentsApi")
      ).removeStudentDocument(selected.id, docId);
      // refresh list and update modal data
      await load();
      const refreshed =
        (await (await import("../../api/studentsApi")).getStudents()).data
          ?.data || [];
      const newer = refreshed.find((s) => s.id === selected.id) || null;
      setSelected(newer);
      setForm(newer || emptyStudent);
      setExistingDocuments(newer?.documents || []);
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to remove document";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredStudents = students.filter((s) => {
    if (typeFilter !== "all" && s.student_type !== typeFilter) return false;
    if (statusFilter !== "all") {
      const active = s.is_active ? "active" : "inactive";
      if (active !== statusFilter) return false;
    }
    if (classroomFilter !== "all") {
      const clsId = s.classroom_id ? String(s.classroom_id) : "";
      if (clsId !== classroomFilter) return false;
    }
    if (!normalizedSearch) return true;
    const haystack = [
      s.full_name,
      s.student_mail,
      s.phone_no,
      s.guardian_name,
      s.roll_no,
      s.university_reg_no,
      s.admission_no,
      s.class_name || s.classroom_name,
      s.section_name,
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())
      .join(" ");
    return haystack.includes(normalizedSearch);
  });

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--text-1)" }}
        >
          Students Management
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            id="studentsFile"
          />
          <label
            htmlFor="studentsFile"
            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-700/60 text-white rounded cursor-pointer hover:bg-slate-700 text-xs"
          >
            <Upload size={14} /> Choose CSV
          </label>
          <button
            onClick={handleImport}
            className="px-3 py-1 bg-indigo-600 text-white rounded inline-flex items-center gap-2 hover:bg-indigo-700 text-xs"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1 bg-slate-700/60 text-white rounded inline-flex items-center gap-2 hover:bg-slate-700 text-xs"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium"
          >
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-300 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search name, email, phone, roll, guardian..."
          className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="school">School</option>
          <option value="university">University</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={classroomFilter}
          onChange={(e) => setClassroomFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Classes</option>
          {classesList.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700/60">
        {filteredStudents.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            {loading ? "Loading..." : "No students found."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 border-b sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Guardian
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Classroom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Roll No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${s.student_type === "university" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"}`}
                    >
                      {s.student_type === "university"
                        ? "University"
                        : "School"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{s.full_name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {s.student_mail || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {s.phone_no || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {s.guardian_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {s.class_name || s.classroom_name
                      ? (s.class_name || s.classroom_name) +
                        (s.section_name
                          ? " / " + s.section_name
                          : "")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {s.roll_no || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${s.is_active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setViewStudent(s)}
                      className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded inline-flex items-center gap-1 text-xs"
                    >
                      <Eye size={12} /> View
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="px-3 py-1 bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 rounded inline-flex items-center gap-1 text-xs"
                    >
                      <Edit size={12} /> Edit
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded inline-flex items-center gap-1 text-xs"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SettingsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={mode === "create" ? "Create New Student" : "Edit Student"}
        width="max-w-6xl"
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-lg font-bold">
            {mode === "create" ? "Create New Student" : "Edit Student"}
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-300 text-sm flex justify-between items-center">
              <span>⚠️ {error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}
          <form onSubmit={submit}>
            {/* STUDENT TYPE SELECTOR */}
            <div className="mb-6 p-4 bg-slate-800/50 rounded border border-slate-700">
              <h3 className="font-semibold text-slate-200 mb-3">
                Student Type <span className="text-red-400">*</span>
              </h3>
              <div className="flex gap-6">
                <RadioField
                  label="🎓 University"
                  name="student_type"
                  value="university"
                  checked={isUniversity}
                  onChange={(e) =>
                    setForm({ ...form, student_type: e.target.value })
                  }
                />
                <RadioField
                  label="🏫 School"
                  name="student_type"
                  value="school"
                  checked={isSchool}
                  onChange={(e) =>
                    setForm({ ...form, student_type: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mb-4">
              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-1 bg-indigo-600/60 text-white rounded text-xs hover:bg-indigo-600"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-1 bg-slate-700/60 text-white rounded text-xs hover:bg-slate-700"
              >
                Collapse All
              </button>
            </div>

            {/* COMMON SECTIONS */}
            <Section
              title="1. Personal / Basic Information"
              open={expandedSections.personal}
              onToggle={() => toggleSection("personal")}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InputField
                  label="Full Name *"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  required
                />
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onProfileFileChange}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                  {profilePreview && (
                    <div className="mt-2">
                      <img
                        src={profilePreview}
                        alt="Profile preview"
                        className="h-16 w-16 rounded object-cover border border-slate-700"
                      />
                    </div>
                  )}
                </div>
                <SelectField
                  label="Nationality *"
                  value={form.nationality}
                  onChange={(e) =>
                    setForm({ ...form, nationality: e.target.value })
                  }
                  options={NATIONALITIES.map((nat) => ({
                    value: nat,
                    label: nat,
                  }))}
                />
                <SelectField
                  label="Gender *"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <InputField
                  label="Date of Birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) =>
                    setForm({ ...form, date_of_birth: e.target.value })
                  }
                />

                {isUniversity && (
                  <>
                    <InputField
                      label="College/University Name *"
                      value={form.legal_entity}
                      onChange={(e) =>
                        setForm({ ...form, legal_entity: e.target.value })
                      }
                      required
                    />
                    <InputField
                      label="Batch (e.g., BE-2021) *"
                      value={form.batch}
                      onChange={(e) =>
                        setForm({ ...form, batch: e.target.value })
                      }
                      required
                    />
                    <InputField
                      label="Semester *"
                      value={form.semester}
                      onChange={(e) =>
                        setForm({ ...form, semester: e.target.value })
                      }
                      required
                    />
                    <InputField
                      label="University Registration No. *"
                      value={form.university_reg_no}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          university_reg_no: e.target.value,
                        })
                      }
                      required
                    />
                    <InputField
                      label="Category / Stream"
                      value={form.category_stream}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category_stream: e.target.value,
                        })
                      }
                    />
                  </>
                )}

                {isSchool && (
                  <>
                    <InputField
                      label="School Name *"
                      value={form.legal_entity}
                      onChange={(e) =>
                        setForm({ ...form, legal_entity: e.target.value })
                      }
                      required
                    />
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        Class / Grade *
                      </label>
                      <select
                        required
                        value={form.classroom_id || ""}
                        onChange={async (e) => {
                          const val = e.target.value
                            ? Number(e.target.value)
                            : null;
                          setForm({
                            ...form,
                            classroom_id: val,
                            class_id: null,
                            section_id: null,
                            section_id: null,
                          });
                          if (val) {
                            try {
                              const secs = await (
                                await import("../../api/classroomsApi")
                              ).getClassroomSections(val);
                              setSectionsList(secs.data?.data || []);
                              console.log(
                                "Loaded sections for classroom",
                                val,
                                secs.data?.data || [],
                              );
                            } catch (err) {
                              setSectionsList([]);
                              console.warn(
                                "Failed to load classroom sections",
                                val,
                                err,
                              );
                            }
                          } else {
                            setSectionsList([]);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Select Class --</option>
                        {classesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        Section *
                      </label>
                      <select
                        required
                        value={form.section_id || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            section_id: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        disabled={!form.classroom_id}
                        className={`w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none ${!form.classroom_id ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <option value="">
                          {!form.classroom_id
                            ? "-- Select a class first --"
                            : sectionsList.length === 0
                              ? "-- No sections for this classroom --"
                              : "-- Select Section --"}
                        </option>
                        {sectionsList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.section_name || s.name}
                          </option>
                        ))}
                      </select>
                      {form.classroom_id && sectionsList.length === 0 && (
                        <p className="text-xs text-amber-400 mt-1">
                          No sections found. Create sections for this class in
                          the Classrooms module.
                        </p>
                      )}
                    </div>
                    <InputField
                      label="Roll Number *"
                      value={form.roll_no}
                      onChange={(e) =>
                        setForm({ ...form, roll_no: e.target.value })
                      }
                      required
                    />
                    <InputField
                      label="Category / House"
                      value={form.category_stream}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category_stream: e.target.value,
                        })
                      }
                    />
                  </>
                )}

                <InputField
                  label="Admission No."
                  value={form.admission_no}
                  onChange={(e) =>
                    setForm({ ...form, admission_no: e.target.value })
                  }
                />
                <InputField
                  label="Admission Date"
                  type="date"
                  value={form.admission_date}
                  onChange={(e) =>
                    setForm({ ...form, admission_date: e.target.value })
                  }
                />
              </div>
            </Section>

            <Section
              title="2. Contact Information"
              open={expandedSections.contact}
              onToggle={() => toggleSection("contact")}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InputField
                  label="Personal Email"
                  type="email"
                  value={form.student_mail}
                  onChange={(e) =>
                    setForm({ ...form, student_mail: e.target.value })
                  }
                  required
                />
                <InputField
                  label="Phone Number"
                  value={form.phone_no}
                  onChange={(e) =>
                    setForm({ ...form, phone_no: e.target.value })
                  }
                  required
                />
                <InputField
                  label="School Email"
                  type="email"
                  value={form.school_email}
                  onChange={(e) =>
                    setForm({ ...form, school_email: e.target.value })
                  }
                />
                <TextAreaField
                  label="Permanent Address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  rows={2}
                />
                <TextAreaField
                  label="Current Address"
                  value={form.current_address}
                  onChange={(e) =>
                    setForm({ ...form, current_address: e.target.value })
                  }
                  rows={2}
                />
                <InputField
                  label="Home District"
                  value={form.home_district}
                  onChange={(e) =>
                    setForm({ ...form, home_district: e.target.value })
                  }
                />
                <InputField
                  label="Municipality"
                  value={form.home_municipality}
                  onChange={(e) =>
                    setForm({ ...form, home_municipality: e.target.value })
                  }
                />
                <InputField
                  label="Ward"
                  value={form.home_ward}
                  onChange={(e) =>
                    setForm({ ...form, home_ward: e.target.value })
                  }
                />
                <TextAreaField
                  label="Full Home Address"
                  value={form.home_full_address}
                  onChange={(e) =>
                    setForm({ ...form, home_full_address: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </Section>

            <Section
              title="3. Family Information"
              open={expandedSections.family}
              onToggle={() => toggleSection("family")}
            >
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-slate-200 mb-2">Father</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InputField
                      label="Father's Name"
                      value={form.father_name}
                      onChange={(e) =>
                        setForm({ ...form, father_name: e.target.value })
                      }
                    />
                    <InputField
                      label="Qualification"
                      value={form.father_qualification}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          father_qualification: e.target.value,
                        })
                      }
                    />
                    <InputField
                      label="Profession"
                      value={form.father_profession}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          father_profession: e.target.value,
                        })
                      }
                    />
                    <InputField
                      label="Organization"
                      value={form.father_organization}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          father_organization: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-slate-200 mb-2">Mother</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InputField
                      label="Mother's Name"
                      value={form.mother_name}
                      onChange={(e) =>
                        setForm({ ...form, mother_name: e.target.value })
                      }
                    />
                    <InputField
                      label="Qualification"
                      value={form.mother_qualification}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          mother_qualification: e.target.value,
                        })
                      }
                    />
                    <InputField
                      label="Profession"
                      value={form.mother_profession}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          mother_profession: e.target.value,
                        })
                      }
                    />
                    <InputField
                      label="Organization"
                      value={form.mother_organization}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          mother_organization: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-slate-200 mb-2">
                    Guardian
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InputField
                      label="Guardian's Name"
                      value={form.guardian_name}
                      onChange={(e) =>
                        setForm({ ...form, guardian_name: e.target.value })
                      }
                    />
                    <InputField
                      label="Guardian's Email"
                      type="email"
                      value={form.guardian_email}
                      onChange={(e) =>
                        setForm({ ...form, guardian_email: e.target.value })
                      }
                    />
                    <InputField
                      label="Guardian's Phone"
                      value={form.guardian_phone}
                      onChange={(e) =>
                        setForm({ ...form, guardian_phone: e.target.value })
                      }
                    />
                    <InputField
                      label="Qualification"
                      value={form.guardian_qualification}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          guardian_qualification: e.target.value,
                        })
                      }
                    />
                    <InputField
                      label="Profession"
                      value={form.guardian_profession}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          guardian_profession: e.target.value,
                        })
                      }
                    />
                    <InputField
                      label="Organization"
                      value={form.guardian_organization}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          guardian_organization: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section
              title="8. Documents"
              open={expandedSections.documents}
              onToggle={() => toggleSection("documents")}
            >
              <div className="space-y-3">
                <p className="text-sm text-slate-400">
                  Upload any supporting documents for the student. Choose a file
                  first, then provide a title and Save. You can add more files
                  unlimitedly. Eight upload rows are shown initially.
                </p>

                {existingDocuments && existingDocuments.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-slate-300 mb-2">
                      Existing Documents
                    </div>
                    <ul className="space-y-2">
                      {existingDocuments.map((d, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between bg-slate-800/30 p-2 rounded border border-slate-700"
                        >
                          <div>
                            <div className="text-sm text-slate-200">
                              {d.title || d.filename || d.url}
                            </div>
                            <div className="text-xs text-slate-400">
                              {d.url || d.filename}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={
                                d.url
                                  ? d.url.startsWith("http")
                                    ? d.url
                                    : `${config.API_BASE_URL}${d.url}`
                                  : "#"
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-slate-700 text-white rounded text-xs"
                            >
                              Open
                            </a>
                            <button
                              type="button"
                              onClick={() => removeExistingDocument(d.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="text-sm text-slate-300 mb-2">
                    Add Documents
                  </div>
                  <div className="space-y-2">
                    {documentRows.map((row, idx) => (
                      <div key={row.id} className="flex items-center gap-3">
                        {!row.saved ? (
                          <>
                            <input
                              type="file"
                              onChange={(e) => handleRowFileChange(idx, e)}
                              className="flex-1"
                            />
                            {row.file && (
                              <>
                                <input
                                  type="text"
                                  value={row.title || ""}
                                  onChange={(e) =>
                                    handleRowTitleChange(idx, e.target.value)
                                  }
                                  placeholder="Document title (optional)"
                                  className="px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => saveRow(idx)}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded"
                                >
                                  Save
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-between w-full bg-slate-800/30 p-2 rounded border border-slate-700">
                            <div>
                              <div className="text-sm text-slate-200">
                                {row.title || row.file?.name}
                              </div>
                              <div className="text-xs text-slate-400">
                                {row.file?.name}
                              </div>
                            </div>
                            <div className="text-sm text-slate-400">Saved</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDocumentRows((prev) => [
                          ...prev,
                          {
                            id: prev.length + 1,
                            file: null,
                            title: "",
                            saved: false,
                          },
                        ])
                      }
                      className="px-3 py-1 bg-slate-700/60 text-white rounded text-sm"
                    >
                      Add Document
                    </button>
                  </div>
                </div>

                {newDocumentsPreview.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-slate-300 mb-2">
                      New Documents
                    </div>
                    <ul className="space-y-2">
                      {newDocumentsPreview.map((d, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between bg-slate-800/30 p-2 rounded border border-slate-700"
                        >
                          <div>
                            <div className="text-sm text-slate-200">
                              {d.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              {d.filename}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeNewDocument(i)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>

            {/* SCHOOL-SPECIFIC SECTIONS */}
            {isSchool && (
              <>
                <Section
                  title="4. Transportation Information"
                  open={expandedSections.transportation}
                  onToggle={() => toggleSection("transportation")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CheckboxField
                      label="Requires Transportation"
                      checked={form.transportation_required}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          transportation_required: e.target.checked,
                        })
                      }
                    />
                    <CheckboxField
                      label="Uses Bus Service"
                      checked={form.bus_service}
                      onChange={(e) =>
                        setForm({ ...form, bus_service: e.target.checked })
                      }
                    />
                    <CheckboxField
                      label="Requires Hostel Facility"
                      checked={form.hostel_required}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          hostel_required: e.target.checked,
                        })
                      }
                    />
                  </div>
                </Section>

                <Section
                  title="5. Previous Education"
                  open={expandedSections.education}
                  onToggle={() => toggleSection("education")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField
                      label="Previous School"
                      value={form.previous_school}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          previous_school: e.target.value,
                        })
                      }
                    />
                  </div>
                </Section>
              </>
            )}

            {/* UNIVERSITY-SPECIFIC SECTIONS */}
            {isUniversity && (
              <>
                <Section
                  title="4. Learning & ECA"
                  open={expandedSections.learning}
                  onToggle={() => toggleSection("learning")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <TextAreaField
                      label="ECA Interests"
                      value={form.eca_interests}
                      onChange={(e) =>
                        setForm({ ...form, eca_interests: e.target.value })
                      }
                      rows={2}
                    />
                    <TextAreaField
                      label="Learning Styles"
                      value={form.learning_styles}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          learning_styles: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                </Section>
              </>
            )}

            {/* COMMON SECTIONS */}
            <Section
              title={
                isSchool ? "6. Dietary Information" : "5. Dietary Information"
              }
              open={expandedSections.dietary}
              onToggle={() => toggleSection("dietary")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField
                  label="Meal Type"
                  value={form.meal_type}
                  onChange={(e) =>
                    setForm({ ...form, meal_type: e.target.value })
                  }
                />
                <InputField
                  label="Meal Eligibility Start Date"
                  type="date"
                  value={form.meal_eligibility_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      meal_eligibility_date: e.target.value,
                    })
                  }
                />
              </div>
            </Section>

            <Section
              title={
                isSchool ? "7. Medical Information" : "6. Medical Information"
              }
              open={expandedSections.medical}
              onToggle={() => toggleSection("medical")}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">
                    Basic Medical Data
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InputField
                      label="Blood Group"
                      value={form.blood_group}
                      onChange={(e) =>
                        setForm({ ...form, blood_group: e.target.value })
                      }
                    />
                    <InputField
                      label="Height (cm)"
                      type="number"
                      value={form.height}
                      onChange={(e) =>
                        setForm({ ...form, height: e.target.value })
                      }
                    />
                    <InputField
                      label="Weight (kg)"
                      type="number"
                      value={form.weight}
                      onChange={(e) =>
                        setForm({ ...form, weight: e.target.value })
                      }
                    />
                    <InputField
                      label="Last Measurement Date"
                      type="date"
                      value={form.measurement_date}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          measurement_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">
                    Allergies & Special Needs
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <TextAreaField
                      label="Allergies"
                      value={form.allergies}
                      onChange={(e) =>
                        setForm({ ...form, allergies: e.target.value })
                      }
                      rows={2}
                    />
                    <TextAreaField
                      label="Special Needs / Disabilities"
                      value={form.special_needs}
                      onChange={(e) =>
                        setForm({ ...form, special_needs: e.target.value })
                      }
                      rows={2}
                    />
                    <TextAreaField
                      label="Medical Notes"
                      value={form.medical_notes}
                      onChange={(e) =>
                        setForm({ ...form, medical_notes: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Classroom Assignment section removed — class/section selection is handled above */}

            <Section
              title={
                isSchool
                  ? "9. Additional Information"
                  : "8. Additional Information"
              }
              open={expandedSections.additional}
              onToggle={() => toggleSection("additional")}
            >
              <div className="grid grid-cols-1 gap-3">
                <TextAreaField
                  label="Notes / Additional Information"
                  value={form.additional_info}
                  onChange={(e) =>
                    setForm({ ...form, additional_info: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </Section>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-700/60 text-white rounded hover:bg-slate-700"
              >
                Cancel
              </button>
              <Button type="submit" loading={loading}>
                {mode === "create" ? "Create Student" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </SettingsModal>

      <SettingsModal
        open={!!viewStudent}
        onClose={() => setViewStudent(null)}
        title="Student Details"
        subtitle="Profile overview"
        width="max-w-5xl"
      >
        {viewStudent && (
          <>
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-linear-to-r from-slate-900 via-slate-900 to-slate-800">
              <div>
                <h3 className="text-lg font-bold">Student Details</h3>
                <div className="text-xs text-slate-400">Profile overview</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintStudent}
                  className="px-3 py-1 bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 rounded text-xs"
                >
                  Print
                </button>
                <button
                  onClick={() => setViewStudent(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4 rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                <div className="h-24 w-24 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                  {viewStudent.profile_picture ? (
                    <img
                      src={getImageUrl(viewStudent.profile_picture)}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No Photo</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-semibold">
                    {viewStudent.full_name}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-indigo-500/20 text-indigo-200">
                      {viewStudent.student_type === "university"
                        ? "University"
                        : "School"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${viewStudent.is_active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
                    >
                      {viewStudent.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-slate-700/60 text-slate-200">
                      Roll: {viewStudent.roll_no || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-700 rounded p-4 bg-slate-800/40">
                  <h4 className="font-semibold text-slate-200 mb-3">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderDetail("Nationality", viewStudent.nationality)}
                    {renderDetail("Gender", viewStudent.gender)}
                    {renderDetail("Date of Birth", viewStudent.date_of_birth)}
                    {renderDetail("Admission No", viewStudent.admission_no)}
                    {renderDetail("Admission Date", viewStudent.admission_date)}
                    {renderDetail(
                      "Category/Stream",
                      viewStudent.category_stream,
                    )}
                  </div>
                </div>
                <div className="border border-slate-700 rounded p-4 bg-slate-800/40">
                  <h4 className="font-semibold text-slate-200 mb-3">Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderDetail("Email", viewStudent.student_mail)}
                    {renderDetail("Phone", viewStudent.phone_no)}
                    {renderDetail("School Email", viewStudent.school_email)}
                    {renderDetail("Address", viewStudent.address)}
                    {renderDetail(
                      "Current Address",
                      viewStudent.current_address,
                    )}
                    {renderDetail("Home District", viewStudent.home_district)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-700 rounded p-4 bg-slate-800/40">
                  <h4 className="font-semibold text-slate-200 mb-3">
                    Academic
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderDetail("School/College", viewStudent.legal_entity)}
                    {renderDetail("Batch/Class", viewStudent.batch)}
                    {renderDetail("Semester/Section", viewStudent.semester)}
                    {renderDetail(
                      "University Reg No",
                      viewStudent.university_reg_no,
                    )}
                    {renderDetail("Admission No", viewStudent.admission_no)}
                    {renderDetail("Roll No", viewStudent.roll_no)}
                  </div>
                </div>
                <div className="border border-slate-700 rounded p-4 bg-slate-800/40">
                  <h4 className="font-semibold text-slate-200 mb-3">
                    Classroom
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderDetail("Classroom", viewStudent.classroom_name || viewStudent.class_name)}
                    {renderDetail(
                      "Section",
                      viewStudent.section_name,
                    )}
                    {renderDetail(
                      "Status",
                      viewStudent.is_active ? "Active" : "Inactive",
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-slate-700 rounded p-4 bg-slate-800/40">
                <h4 className="font-semibold text-slate-200 mb-3">Family</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderDetail("Father Name", viewStudent.father_name)}
                  {renderDetail("Mother Name", viewStudent.mother_name)}
                  {renderDetail("Guardian Name", viewStudent.guardian_name)}
                  {renderDetail("Guardian Email", viewStudent.guardian_email)}
                  {renderDetail("Guardian Phone", viewStudent.guardian_phone)}
                </div>
              </div>

              <div className="border border-slate-700 rounded p-4 bg-slate-800/40">
                <h4 className="font-semibold text-slate-200 mb-3">
                  Medical & Notes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderDetail("Blood Group", viewStudent.blood_group)}
                  {renderDetail("Allergies", viewStudent.allergies)}
                  {renderDetail("Special Needs", viewStudent.special_needs)}
                  {renderDetail("Notes", viewStudent.additional_info)}
                </div>
              </div>

              {showDocumentViewer && (
                <div className="border border-slate-700 rounded p-4 bg-slate-800/40">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-200">
                      Attached Documents
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowDocumentViewer(false)}
                      className="px-3 py-1 bg-slate-700 text-white rounded text-xs"
                    >
                      Close
                    </button>
                  </div>
                  {Array.isArray(viewStudent.documents) &&
                  viewStudent.documents.length > 0 ? (
                    <ul className="space-y-3">
                      {viewStudent.documents.map((doc, idx) => (
                        <li
                          key={doc.id || idx}
                          className="bg-slate-900/70 p-3 rounded border border-slate-700 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-sm text-slate-200">
                              {doc.title ||
                                doc.filename ||
                                `Document ${idx + 1}`}
                            </div>
                            <div className="text-xs text-slate-400">
                              {doc.url || "No URL available"}
                            </div>
                          </div>
                          {doc.url ? (
                            <a
                              href={
                                doc.url.startsWith("http")
                                  ? doc.url
                                  : `${config.API_BASE_URL}${doc.url}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">
                              No file
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-400">
                      No attached documents available.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setShowDocumentViewer((prev) => !prev)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                >
                  {showDocumentViewer ? "Hide Documents" : "View All Documents"}
                </button>
                <button
                  onClick={handleViewResults}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                >
                  View Result Status
                </button>
              </div>
            </div>
          </>
        )}
      </SettingsModal>
    </div>
  );
};

export default Students;
