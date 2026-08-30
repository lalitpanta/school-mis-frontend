import { useEffect, useState } from "react";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../api/coursesApi";
import { getClassrooms, getClassroomSections } from "../../api/classroomsApi";
import { teachersApi } from "../../api/teachersApi";
import Button from "../common/Button";
import { Plus, Trash2, Edit, ChevronDown, Eye } from "lucide-react";
import SettingsModal from "../common/SettingsModal";

const SUBJECT_TYPES = [
  "Core",
  "Elective",
  "Lab",
  "Project",
  "Internship",
  "Seminar",
  "Workshop",
];

const DELIVERY_MODES = ["In-person", "Online", "Hybrid"];

const GRADING_SCHEMES = ["Percentage", "Letter", "GPA"];

const SYLLABUS_STANDARDS = [
  "Nepal CDC",
  "Cambridge",
  "IB",
  "TU",
  "PU",
  "KU",
  "Custom",
];

const ASSESSMENT_COMPONENT_OPTIONS = [
  "Exam",
  "Mid-term",
  "Quiz",
  "Assignment",
  "Project",
  "Lab Report",
  "Viva",
  "Presentation",
  "Thesis",
];

const CATEGORY_TAGS = [
  "STEM",
  "Language",
  "Arts",
  "Vocational",
  "Social Science",
  "Mathematics",
  "Science",
];

const emptyCourse = {
  course_name: "",
  course_code: "",
  short_name: "",
  department: "",
  description: "",
  subject_type: "Core",
  grade_level: "",
  academic_year: "",
  term_semester: "",
  category_tags: [],
  periods_per_week: 0,
  period_duration_minutes: 45,
  credit_hours_theory: 0,
  credit_hours_lab: 0,
  total_contact_hours_per_week: 0,
  primary_teacher_id: null,
  classroom_id: null,
  section_id: null,
  teaching_language: "",
  delivery_mode: "In-person",
  scheduled_days: [],
  full_marks_theory: 100,
  pass_marks_theory: 40,
  full_marks_practical: 0,
  pass_marks_practical: 0,
  grading_scheme: "Percentage",
  grade_point: 0,
  assessment_components: [],
  prerequisite_courses: [],
  corequisite_courses: [],
  minimum_cgpa_to_enroll: null,
  max_enrollment: null,
  learning_outcomes: [],
  syllabus_standard: "",
  textbooks: [],
  lms_digital_resource_link: "",
  is_active: true,
  show_in_student_portal: true,
  allow_online_submission: false,
  attendance_required: true,
  include_in_progress_report: true,
  is_elective: false,
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
  disabled = false,
}) => (
  <div>
    <label className="block text-sm text-slate-300 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      required={required}
      disabled={disabled}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    />
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}) => (
  <div>
    <label className="block text-sm text-slate-300 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <select
      required={required}
      disabled={disabled}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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

const TextAreaField = ({
  label,
  value,
  onChange,
  rows = 3,
  disabled = false,
}) => (
  <div>
    <label className="block text-sm text-slate-300 mb-1">{label}</label>
    <textarea
      value={value || ""}
      disabled={disabled}
      onChange={onChange}
      rows={rows}
      className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    />
  </div>
);

const CheckboxField = ({ label, checked, onChange, disabled = false }) => (
  <div className="flex items-center gap-2">
    <input
      id={`chk_${label}`}
      type="checkbox"
      checked={checked || false}
      disabled={disabled}
      onChange={onChange}
      className="w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
    />
    <label
      htmlFor={`chk_${label}`}
      className="text-sm text-slate-300 cursor-pointer"
    >
      {label}
    </label>
  </div>
);

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomSections, setClassroomSections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyCourse);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    classification: true,
    credit: false,
    teaching: false,
    assessment: false,
    prerequisites: false,
    outcomes: false,
    resources: false,
    settings: false,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const load = async () => {
    try {
      setLoading(true);
      const res = await getCourses();
      setCourses(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    (async () => {
      try {
        const c = await getClassrooms();
        setClassrooms(c.data?.data || []);
        const t = await teachersApi.getTeacherOptions();
        setTeachers(t.data?.data || []);
      } catch (err) {
        console.warn("Failed to load dropdowns:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      if (!form.classroom_id) {
        setClassroomSections([]);
        setForm((prev) => ({ ...prev, section_id: null }));
        return;
      }
      try {
        const res = await getClassroomSections(form.classroom_id);
        setClassroomSections(res.data?.data || []);
      } catch (err) {
        console.warn("Failed to load classroom sections:", err);
        setClassroomSections([]);
      }
    };

    fetchSections();
  }, [form.classroom_id]);

  const openCreate = () => {
    setError("");
    setMode("create");
    setSelected(null);
    setForm(emptyCourse);
    setShowModal(true);
  };

  const openEdit = (course) => {
    setError("");
    setMode("edit");
    setSelected(course);
    setForm(course);
    setShowModal(true);
  };

  const openView = (course) => {
    setError("");
    setMode("view");
    setSelected(course);
    setForm(course);
    setShowModal(true);
  };

  const toggleCourseActive = async (course = selected) => {
    if (!course) return;
    try {
      setLoading(true);
      const updated = { ...course, is_active: !course.is_active };
      await updateCourse(course.id, { is_active: updated.is_active });
      if (selected?.id === course.id) {
        setForm((prev) => ({ ...prev, is_active: updated.is_active }));
        setSelected((prev) => ({
          ...(prev || {}),
          is_active: updated.is_active,
        }));
      }
      await load();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || "Failed to update status",
      );
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (mode === "view") {
      setShowModal(false);
      return;
    }
    try {
      setError("");
      setLoading(true);
      if (mode === "create") await createCourse(form);
      else if (mode === "edit") await updateCourse(selected.id, form);
      await load();
      setShowModal(false);
      setForm(emptyCourse);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Error saving course";
      setError(errMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this course?")) return;
    try {
      setError("");
      setLoading(true);
      await deleteCourse(id);
      await load();
    } catch (e) {
      const errMsg =
        e.response?.data?.message || e.message || "Error deleting course";
      setError(errMsg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCourses = courses.filter((c) => {
    if (typeFilter !== "all" && c.subject_type !== typeFilter) return false;
    if (statusFilter !== "all") {
      const active = c.is_active ? "active" : "inactive";
      if (active !== statusFilter) return false;
    }
    if (!normalizedSearch) return true;
    const haystack = [
      c.course_name,
      c.course_code,
      c.department,
      c.teacher_name,
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
          Courses Management
        </h2>
        <Button onClick={openCreate} icon={Plus}>
          Add Course
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm flex justify-between">
          {error}
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
          placeholder="Search name, code, department..."
          className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Types</option>
          {SUBJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
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
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700/60">
        {filteredCourses.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            {loading ? "Loading..." : "No courses found."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 border-b sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Course Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Enrolled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Teacher
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-slate-700/40 hover:bg-slate-800/20"
                >
                  <td className="px-4 py-3 text-slate-200">
                    {course.course_code}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {course.course_name}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="px-2 py-1 bg-indigo-900/50 text-indigo-200 rounded text-xs">
                      {course.subject_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {course.department || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {course.class_name || course.classroom_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {course.enrolled_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {course.teacher_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {course.is_active ? (
                      <span className="px-2 py-1 bg-green-900/50 text-green-200 rounded text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-900/50 text-red-200 rounded text-xs">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openView(course)}
                        className="p-1 text-sky-400 hover:bg-sky-900/30 rounded"
                        title="View course"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => toggleCourseActive(course)}
                        className={`px-3 py-1 rounded text-xs font-medium ${course.is_active ? "text-red-400 hover:bg-red-900/30" : "text-emerald-400 hover:bg-emerald-900/30"}`}
                        title={
                          course.is_active
                            ? "Deactivate course"
                            : "Activate course"
                        }
                      >
                        {course.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => openEdit(course)}
                        className="p-1 text-indigo-400 hover:bg-indigo-900/30 rounded"
                        title="Edit course"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => remove(course.id)}
                        className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                        title="Delete course"
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

      <SettingsModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(emptyCourse);
        }}
        title={
          mode === "create"
            ? "Add New Course"
            : mode === "view"
              ? "Course Details"
              : "Edit Course"
        }
        width="max-w-4xl"
      >
        {mode === "view" && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-5 shadow-lg shadow-slate-950/20">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-slate-400 uppercase tracking-[0.2em] text-xs mb-2">
                      Course details
                    </p>
                    <h2 className="text-2xl font-semibold text-white">
                      {form.course_name || "Untitled Course"}
                    </h2>
                    <p className="text-slate-500 text-sm mt-2">
                      {form.description || "No description provided."}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${form.is_active ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"}`}
                    >
                      {form.is_active ? "Active" : "Inactive"}
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      {form.course_code || "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Department
                    </p>
                    <p className="text-white font-medium">
                      {form.department || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Subject Type
                    </p>
                    <p className="text-white font-medium">
                      {form.subject_type || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Class
                    </p>
                    <p className="text-white font-medium">
                      {form.class_name || form.classroom_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Section
                    </p>
                    <p className="text-white font-medium">
                      {form.section_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Teacher
                    </p>
                    <p className="text-white font-medium">
                      {form.teacher_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Delivery Mode
                    </p>
                    <p className="text-white font-medium">
                      {form.delivery_mode || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-5 shadow-lg shadow-slate-950/20">
                <p className="text-slate-400 uppercase tracking-[0.2em] text-xs mb-4">
                  Assessment & details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Credit Hours (Theory)
                    </p>
                    <p className="text-white font-medium">
                      {form.credit_hours_theory || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Credit Hours (Lab)
                    </p>
                    <p className="text-white font-medium">
                      {form.credit_hours_lab || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Full Marks
                    </p>
                    <p className="text-white font-medium">
                      {form.full_marks_theory || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Pass Marks
                    </p>
                    <p className="text-white font-medium">
                      {form.pass_marks_theory || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2">
                      Enrolled Students
                    </p>
                    <p className="text-white font-medium">
                      {form.enrolled_count ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full xl:w-auto px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
              >
                Close
              </button>
              <button
                type="button"
                onClick={toggleCourseActive}
                className={`w-full xl:w-auto px-4 py-2 rounded text-white ${form.is_active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {form.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={submit}
          hidden={mode === "view"}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Basic Information */}
          <Section
            title="📖 Basic Information"
            open={expandedSections.basic}
            onToggle={() => toggleSection("basic")}
          >
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Course Name *"
                value={form.course_name}
                onChange={(e) =>
                  setForm({ ...form, course_name: e.target.value })
                }
                required
              />
              <InputField
                label="Course Code *"
                value={form.course_code}
                onChange={(e) =>
                  setForm({ ...form, course_code: e.target.value })
                }
                required
              />
              <InputField
                label="Short Name / Abbreviation"
                value={form.short_name}
                onChange={(e) =>
                  setForm({ ...form, short_name: e.target.value })
                }
              />
              <InputField
                label="Department"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </div>
            <div className="mt-4">
              <TextAreaField
                label="Description / Syllabus Overview"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </Section>

          {/* Classification */}
          <Section
            title="🏷️ Classification"
            open={expandedSections.classification}
            onToggle={() => toggleSection("classification")}
          >
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Subject Type"
                value={form.subject_type}
                onChange={(e) =>
                  setForm({ ...form, subject_type: e.target.value })
                }
                options={SUBJECT_TYPES.map((type) => ({
                  label: type,
                  value: type,
                }))}
              />
              <InputField
                label="Grade / Year Level"
                value={form.grade_level}
                onChange={(e) =>
                  setForm({ ...form, grade_level: e.target.value })
                }
              />
              <InputField
                label="Academic Year"
                value={form.academic_year}
                onChange={(e) =>
                  setForm({ ...form, academic_year: e.target.value })
                }
              />
              <InputField
                label="Term / Semester"
                value={form.term_semester}
                onChange={(e) =>
                  setForm({ ...form, term_semester: e.target.value })
                }
              />
            </div>
          </Section>

          {/* Credit & Workload */}
          <Section
            title="📊 Credit & Workload"
            open={expandedSections.credit}
            onToggle={() => toggleSection("credit")}
          >
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Periods per Week"
                type="number"
                value={form.periods_per_week}
                onChange={(e) =>
                  setForm({
                    ...form,
                    periods_per_week: parseInt(e.target.value) || 0,
                  })
                }
              />
              <InputField
                label="Period Duration (minutes)"
                type="number"
                value={form.period_duration_minutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    period_duration_minutes: parseInt(e.target.value) || 45,
                  })
                }
              />
              <InputField
                label="Credit Hours - Theory"
                type="number"
                step="0.5"
                value={form.credit_hours_theory}
                onChange={(e) =>
                  setForm({
                    ...form,
                    credit_hours_theory: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <InputField
                label="Credit Hours - Lab"
                type="number"
                step="0.5"
                value={form.credit_hours_lab}
                onChange={(e) =>
                  setForm({
                    ...form,
                    credit_hours_lab: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <InputField
                label="Total Contact Hours per Week"
                type="number"
                step="0.5"
                value={form.total_contact_hours_per_week}
                onChange={(e) =>
                  setForm({
                    ...form,
                    total_contact_hours_per_week:
                      parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </Section>

          {/* Teaching & Assignment */}
          <Section
            title="👨‍🏫 Teaching & Assignment"
            open={expandedSections.teaching}
            onToggle={() => toggleSection("teaching")}
          >
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Primary Teacher"
                value={form.primary_teacher_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    primary_teacher_id: e.target.value || null,
                  })
                }
                options={teachers.map((t) => ({
                  label: t.full_name || t.name || "Unknown",
                  value: t.id,
                }))}
              />
              <SelectField
                label="Classroom"
                value={form.classroom_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    classroom_id: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                    section_id: null,
                  })
                }
                options={classrooms.map((c) => ({
                  label: c.name || "Unknown",
                  value: c.id,
                }))}
              />
              <SelectField
                label="Classroom Section"
                value={form.section_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    section_id: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                options={classroomSections.map((section) => ({
                  label: section.section_name || section.name || "Unknown",
                  value: section.id,
                }))}
              />
              <InputField
                label="Teaching Language / Medium"
                value={form.teaching_language}
                onChange={(e) =>
                  setForm({ ...form, teaching_language: e.target.value })
                }
              />
              <SelectField
                label="Delivery Mode"
                value={form.delivery_mode}
                onChange={(e) =>
                  setForm({ ...form, delivery_mode: e.target.value })
                }
                options={DELIVERY_MODES.map((mode) => ({
                  label: mode,
                  value: mode,
                }))}
              />
            </div>
          </Section>

          {/* Assessment & Grading */}
          <Section
            title="📈 Assessment & Grading"
            open={expandedSections.assessment}
            onToggle={() => toggleSection("assessment")}
          >
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Full Marks - Theory"
                type="number"
                step="0.5"
                value={form.full_marks_theory}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_marks_theory: parseFloat(e.target.value) || 100,
                  })
                }
              />
              <InputField
                label="Pass Marks - Theory"
                type="number"
                step="0.5"
                value={form.pass_marks_theory}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pass_marks_theory: parseFloat(e.target.value) || 40,
                  })
                }
              />
              <InputField
                label="Full Marks - Practical"
                type="number"
                step="0.5"
                value={form.full_marks_practical}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_marks_practical: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <InputField
                label="Pass Marks - Practical"
                type="number"
                step="0.5"
                value={form.pass_marks_practical}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pass_marks_practical: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <SelectField
                label="Grading Scheme"
                value={form.grading_scheme}
                onChange={(e) =>
                  setForm({ ...form, grading_scheme: e.target.value })
                }
                options={GRADING_SCHEMES.map((scheme) => ({
                  label: scheme,
                  value: scheme,
                }))}
              />
              <InputField
                label="Grade Point / GPA Weight"
                type="number"
                step="0.1"
                value={form.grade_point}
                onChange={(e) =>
                  setForm({
                    ...form,
                    grade_point: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </Section>

          {/* Settings */}
          <Section
            title="⚙️ Settings & Flags"
            open={expandedSections.settings}
            onToggle={() => toggleSection("settings")}
          >
            <div className="space-y-3">
              <CheckboxField
                label="Active / Published"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              <CheckboxField
                label="Show in Student Portal"
                checked={form.show_in_student_portal}
                onChange={(e) =>
                  setForm({
                    ...form,
                    show_in_student_portal: e.target.checked,
                  })
                }
              />
              <CheckboxField
                label="Allow Online Submission"
                checked={form.allow_online_submission}
                onChange={(e) =>
                  setForm({
                    ...form,
                    allow_online_submission: e.target.checked,
                  })
                }
              />
              <CheckboxField
                label="Attendance Required"
                checked={form.attendance_required}
                onChange={(e) =>
                  setForm({
                    ...form,
                    attendance_required: e.target.checked,
                  })
                }
              />
              <CheckboxField
                label="Include in Progress Report"
                checked={form.include_in_progress_report}
                onChange={(e) =>
                  setForm({
                    ...form,
                    include_in_progress_report: e.target.checked,
                  })
                }
              />
              <CheckboxField
                label="Is Elective (Student can opt in/out)"
                checked={form.is_elective}
                onChange={(e) =>
                  setForm({ ...form, is_elective: e.target.checked })
                }
              />
            </div>
          </Section>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setForm(emptyCourse);
              }}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </SettingsModal>
    </div>
  );
};

export default Courses;
