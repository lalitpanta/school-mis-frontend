import { useEffect, useRef, useState } from "react";
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
import {
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  Power,
} from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import useSettingsInlinePanelLayout from "../../hooks/useSettingsInlinePanelLayout";
import RecordTableToolbar from "../common/RecordTableToolbar";
import CsvImportControls from "../common/CsvImportControls";
import CsvExportButton from "../common/CsvExportButton";
import { downloadRecordCsv, parseRecordCsv } from "../../utils/recordCsv";
import toast from "react-hot-toast";
import RecordSelectCheckbox from "../common/RecordSelectCheckbox";
import BulkDeleteBar from "../common/BulkDeleteBar";

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
  section_ids: [],
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
  <div className="mb-4 border border-default rounded">
    <div
      className="flex items-center justify-between p-3 cursor-pointer hover:bg-subtle"
      onClick={onToggle}
    >
      <div className="font-medium text-primary">{title}</div>
      <ChevronDown
        size={18}
        className={`transform transition ${open ? "rotate-180" : ""} text-muted`}
      />
    </div>
    {open && (
      <div className="p-4 border-t border-default bg-surface">
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
    <label className="block text-sm text-muted mb-1">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <input
      type={type}
      required={required}
      disabled={disabled}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 bg-subtle text-primary rounded border border-default focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
    <label className="block text-sm text-muted mb-1">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <select
      required={required}
      disabled={disabled}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 bg-subtle text-primary rounded border border-default focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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

const MultiSelectField = ({ label, value = [], options, onChange, disabled }) => {
  const selectedIds = new Set(value.map(String));
  const selectedLabels = options
    .filter((option) => selectedIds.has(String(option.value)))
    .map((option) => option.label);

  return (
    <div>
      <label className="block text-sm text-muted mb-1">{label}</label>
      <details className="group relative">
        <summary
          className={`list-none w-full px-3 py-2 bg-subtle text-primary rounded border border-default cursor-pointer focus:border-accent focus:outline-none ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <span className="block truncate">
            {selectedLabels.length ? selectedLabels.join(", ") : "-- Select sections --"}
          </span>
        </summary>
        {!disabled && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-default bg-surface p-2 shadow-xl">
            {options.length ? (
              options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-primary hover:bg-subtle"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(String(option.value))}
                    onChange={(event) => {
                      const nextIds = event.target.checked
                        ? [...value, option.value]
                        : value.filter(
                            (id) => String(id) !== String(option.value),
                          );
                      onChange(nextIds);
                    }}
                    className="h-4 w-4 rounded"
                  />
                  {option.label}
                </label>
              ))
            ) : (
              <p className="px-2 py-1.5 text-sm text-muted">
                No sections available for this class.
              </p>
            )}
          </div>
        )}
      </details>
    </div>
  );
};

const TextAreaField = ({
  label,
  value,
  onChange,
  rows = 3,
  disabled = false,
}) => (
  <div>
    <label className="block text-sm text-muted mb-1">{label}</label>
    <textarea
      value={value || ""}
      disabled={disabled}
      onChange={onChange}
      rows={rows}
      className="w-full px-3 py-2 bg-subtle text-primary rounded border border-default focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
      className="text-sm text-muted cursor-pointer"
    >
      {label}
    </label>
  </div>
);

const Courses = () => {
  const layoutRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomSections, setClassroomSections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [form, setForm] = useState(emptyCourse);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState([
    "code",
    "name",
    "class_section",
    "status",
  ]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classroomFilter, setClassroomFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
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
        setForm((prev) => ({ ...prev, section_id: null, section_ids: [] }));
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
    setForm({
      ...course,
      section_ids:
        course.section_ids?.map(Number) ||
        (course.section_id ? [Number(course.section_id)] : []),
    });
    setShowModal(true);
  };

  const openView = (course) => {
    setError("");
    setMode("view");
    setSelected(course);
    setForm({
      ...course,
      section_ids:
        course.section_ids?.map(Number) ||
        (course.section_id ? [Number(course.section_id)] : []),
    });
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
      setSelectedCourseIds((current) => current.filter((selectedId) => selectedId !== id));
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
  const getSectionNames = (course) =>
    String(course.section_names || course.section_name || "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  const classroomOptions = classrooms
    .map((classroom) => ({
      id: String(classroom.id),
      name:
        classroom.class_name ||
        classroom.classroom_name ||
        classroom.name ||
        `Class ${classroom.id}`,
    }))
    .filter((classroom) => classroom.id !== "undefined");
  const sectionOptions = Array.from(
    new Set(courses.flatMap((course) => getSectionNames(course))),
  ).sort((first, second) =>
    first.localeCompare(second, undefined, { sensitivity: "base" }),
  );
  const filteredCourses = courses.filter((c) => {
    if (typeFilter !== "all" && c.subject_type !== typeFilter) return false;
    if (statusFilter !== "all") {
      const active = c.is_active ? "active" : "inactive";
      if (active !== statusFilter) return false;
    }
    if (
      classroomFilter !== "all" &&
      String(c.classroom_id ?? "") !== classroomFilter
    ) {
      return false;
    }
    if (
      sectionFilter !== "all" &&
      !getSectionNames(c).includes(sectionFilter)
    ) {
      return false;
    }
    if (!normalizedSearch) return true;
    const haystack = [
      c.course_name,
      c.course_code,
      c.department,
      c.teacher_name,
      c.class_name,
      c.classroom_name,
      ...getSectionNames(c),
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())
      .join(" ");
    return haystack.includes(normalizedSearch);
  });
  const visibleCourseIds = filteredCourses.map((course) => course.id);
  const allVisibleCoursesSelected =
    visibleCourseIds.length > 0 &&
    visibleCourseIds.every((id) => selectedCourseIds.includes(id));

  const handleBulkDeleteCourses = async () => {
    const ids = selectedCourseIds;
    if (
      ids.length === 0 ||
      !window.confirm(
        `Delete ${ids.length} selected course${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => deleteCourse(id)),
      );
      const failedIds = ids.filter(
        (_, index) => results[index].status === "rejected",
      );
      const deletedCount = ids.length - failedIds.length;
      setSelectedCourseIds(failedIds);
      await load();
      if (failedIds.length > 0) {
        const reason = results.find(
          (result) => result.status === "rejected",
        )?.reason;
        setError(
          `${deletedCount} course${deletedCount === 1 ? "" : "s"} deleted; ${failedIds.length} could not be deleted.${reason?.response?.data?.message ? ` ${reason.response.data.message}` : ""}`,
        );
      } else {
        toast.success(`${deletedCount} course${deletedCount === 1 ? "" : "s"} deleted.`);
      }
    } catch (err) {
      console.error("Failed to complete bulk course deletion:", err);
      setError("Could not refresh courses after bulk deletion.");
    } finally {
      setLoading(false);
    }
  };
  const courseColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "class_section", label: "Class / section" },
    { key: "status", label: "Status" },
  ];
  const toggleCourseColumn = (key) =>
    setVisibleColumns((current) =>
      current.includes(key)
        ? current.filter((column) => column !== key)
        : [...current, key],
    );
  const importCoursesCsv = async (file) => {
    const numericFields = new Set([
      "periods_per_week", "period_duration_minutes", "credit_hours_theory",
      "credit_hours_lab", "total_contact_hours_per_week", "full_marks_theory",
      "pass_marks_theory", "full_marks_practical", "pass_marks_practical",
      "grade_point", "minimum_cgpa_to_enroll", "max_enrollment",
    ]);
    const relationFields = new Set(["primary_teacher_id", "classroom_id", "section_id"]);
    const arrayFields = new Set([
      "category_tags", "scheduled_days", "assessment_components",
      "prerequisite_courses", "corequisite_courses", "learning_outcomes", "textbooks",
    ]);
    const booleanFields = new Set([
      "is_active", "show_in_student_portal", "allow_online_submission",
      "attendance_required", "include_in_progress_report", "is_elective",
    ]);
    const parseBoolean = (value) =>
      !["false", "0", "no", "inactive"].includes(value.toLowerCase());
    try {
      const rows = parseRecordCsv(await file.text());
      let imported = 0;
      const failures = [];
      const knownCourseCodes = new Set(
        courses.map((course) => course.course_code?.toLowerCase()),
      );
      for (const row of rows) {
        const values = row.values;
        const courseName = values.course_name?.trim();
        const courseCode = values.course_code?.trim();
        if (!courseName || !courseCode) {
          failures.push(`Row ${row.rowNumber}: course_name and course_code are required.`);
          continue;
        }
        if (knownCourseCodes.has(courseCode.toLowerCase())) {
          failures.push(`Row ${row.rowNumber}: course code "${courseCode}" already exists.`);
          continue;
        }
        const payload = { ...emptyCourse, course_name: courseName, course_code: courseCode };
        let invalidValue = null;
        Object.keys(emptyCourse).forEach((key) => {
          if (!(key in values) || key === "course_name" || key === "course_code") return;
          const value = values[key];
          if (value === "") return;
          if (arrayFields.has(key)) {
            payload[key] = value ? value.split(/[;|]/).map((item) => item.trim()).filter(Boolean) : [];
          } else if (booleanFields.has(key)) {
            payload[key] = parseBoolean(value);
          } else if (numericFields.has(key)) {
            if (value === "") return;
            const number = Number(value);
            if (!Number.isFinite(number)) invalidValue = key;
            else payload[key] = number;
          } else if (relationFields.has(key)) {
            if (!value) payload[key] = null;
            else if (!/^\d+$/.test(value)) invalidValue = key;
            else payload[key] = Number(value);
          } else {
            payload[key] = value;
          }
        });
        if (invalidValue) {
          failures.push(`Row ${row.rowNumber}: ${invalidValue} must contain a valid value.`);
          continue;
        }
        if (payload.classroom_id && !classrooms.some((item) => String(item.id) === String(payload.classroom_id))) {
          failures.push(`Row ${row.rowNumber}: classroom_id does not exist.`);
          continue;
        }
        if (payload.primary_teacher_id && !teachers.some((item) => String(item.id) === String(payload.primary_teacher_id))) {
          failures.push(`Row ${row.rowNumber}: primary_teacher_id does not exist.`);
          continue;
        }
        try {
          await createCourse(payload);
          knownCourseCodes.add(courseCode.toLowerCase());
          imported += 1;
        } catch (err) {
          failures.push(`Row ${row.rowNumber}: ${err.response?.data?.message || err.message || "creation failed"}`);
        }
      }
      if (imported) await load();
      if (failures.length) toast.error(`${imported} courses imported; ${failures.length} row(s) failed. ${failures[0]}`);
      else toast.success(`${imported} courses imported.`);
    } catch (err) {
      toast.error(err.message || "Could not read this CSV file.");
    }
  };
  const exportCoursesCsv = () =>
    downloadRecordCsv(
      "courses.csv",
      [
        { label: "course_name", value: (course) => course.course_name },
        { label: "course_code", value: (course) => course.course_code },
        { label: "subject_type", value: (course) => course.subject_type },
        { label: "department", value: (course) => course.department },
        { label: "classroom_id", value: (course) => course.classroom_id },
        { label: "section_id", value: (course) => course.section_id },
        { label: "primary_teacher_id", value: (course) => course.primary_teacher_id },
        { label: "is_active", value: (course) => course.is_active },
      ],
      filteredCourses,
    );
  const isEditingCourse = showModal && mode === "edit";
  const editPanelStyle = useSettingsInlinePanelLayout(
    isEditingCourse,
    layoutRef,
  );

  const applyCourseView = (view) => {
    setTypeFilter(view.type || "all");
    setStatusFilter(view.status || "all");
    setClassroomFilter("all");
    setSectionFilter("all");
  };

  return (
    <div
      ref={layoutRef}
      data-settings-screen="courses"
      className={`entity-admin-page relative min-w-0 rounded-2xl p-4 ${isEditingCourse ? "is-editing flex h-[calc(100dvh-5rem)] min-h-128 w-full flex-col overflow-visible max-md:h-auto max-md:min-h-0" : "flex h-full min-h-0 w-full flex-col"}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className={`w-full min-w-0 ${isEditingCourse ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" : "flex min-h-0 flex-1 flex-col"}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            className="text-[28px] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Courses Management
          </h2>
          <div className="flex items-center gap-2">
            <CsvImportControls onImport={importCoursesCsv} entityLabel="courses" disabled={loading} />
            <Button onClick={openCreate} icon={Plus} className="settings-admin-create-button">
              Add Course
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex justify-between rounded border border-danger bg-danger-soft p-3 text-sm text-danger">
            {error}
            <button
              onClick={() => setError("")}
              className="text-danger hover:text-danger"
            >
              ✕
            </button>
          </div>
        )}

        <RecordTableToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search courses..."
          columns={courseColumns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleCourseColumn}
          filterContent={
            <>
              <label className="grid gap-1 text-sm text-slate-300">Subject type
                <select className="entity-admin-input rounded border border-slate-700 px-2 py-2" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="all">All types</option>{SUBJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm text-slate-300">Status
                <select className="entity-admin-input rounded border border-slate-700 px-2 py-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm text-slate-300">Class
                <select className="entity-admin-input rounded border border-slate-700 px-2 py-2" value={classroomFilter} onChange={(event) => setClassroomFilter(event.target.value)}>
                  <option value="all">All classes</option>{classroomOptions.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm text-slate-300">Section
                <select className="entity-admin-input rounded border border-slate-700 px-2 py-2" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
                  <option value="all">All sections</option>{sectionOptions.map((section) => <option key={section} value={section}>{section}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setClassroomFilter("all"); setSectionFilter("all"); }} className="text-left text-sm text-accent">Clear filters</button>
            </>
          }
          views={[
            { label: "All courses", onSelect: () => applyCourseView({}) },
            { label: "Active courses", onSelect: () => applyCourseView({ status: "active" }) },
            { label: "Inactive courses", onSelect: () => applyCourseView({ status: "inactive" }) },
            { label: "Core courses", onSelect: () => applyCourseView({ type: "Core" }) },
            { label: "Elective courses", onSelect: () => applyCourseView({ type: "Elective" }) },
          ]}
          recordCount={filteredCourses.length}
          rightContent={<CsvExportButton onExport={exportCoursesCsv} entityLabel="courses" disabled={!courses.length} />}
        />
        <BulkDeleteBar
          count={selectedCourseIds.length}
          itemLabel="courses"
          disabled={loading}
          onDelete={handleBulkDeleteCourses}
          onClear={() => setSelectedCourseIds([])}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
        <div className={`entity-admin-list h-full min-w-0 rounded-lg border border-default ${isEditingCourse ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "overflow-auto"}`}>
        {filteredCourses.length === 0 ? (
          <div className="p-6 text-center text-muted">
            {loading ? "Loading..." : "No courses found."}
          </div>
        ) : (
          <table className="w-full min-w-0 table-fixed text-sm">
            <thead className="bg-subtle border-b sticky top-0">
              <tr>
                <th className="w-10 px-2 text-center">
                  <RecordSelectCheckbox
                    checked={allVisibleCoursesSelected}
                    onChange={(event) =>
                      setSelectedCourseIds((current) =>
                        event.target.checked
                          ? Array.from(
                              new Set([...current, ...visibleCourseIds]),
                            )
                          : current.filter(
                              (id) => !visibleCourseIds.includes(id),
                            ),
                      )
                    }
                    label="Select all visible courses"
                  />
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${!visibleColumns.includes("code") ? "hidden" : ""}`}>
                  Code
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${!visibleColumns.includes("name") ? "hidden" : ""}`}>
                  Name
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${!visibleColumns.includes("class_section") ? "hidden" : ""}`}>
                  Class / Section
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${!visibleColumns.includes("status") ? "hidden" : ""}`}>
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
                  className="border-b border-default hover:bg-subtle"
                >
                  <td className="w-10 px-2 text-center">
                    <RecordSelectCheckbox
                      checked={selectedCourseIds.includes(course.id)}
                      onChange={(event) =>
                        setSelectedCourseIds((current) =>
                          event.target.checked
                            ? [...new Set([...current, course.id])]
                            : current.filter((id) => id !== course.id),
                        )
                      }
                      label={`Select course ${course.course_name}`}
                    />
                  </td>
                  <td className={`px-4 py-3 text-primary ${!visibleColumns.includes("code") ? "hidden" : ""}`}>
                    {course.course_code}
                  </td>
                  <td className={`px-4 py-3 text-primary ${!visibleColumns.includes("name") ? "hidden" : ""}`}>
                    <button
                      type="button"
                      onClick={() => openView(course)}
                      className="text-left text-primary hover:text-accent"
                      title="View course details"
                    >
                      {course.course_name}
                    </button>
                  </td>
                  <td className={`px-4 py-3 text-muted ${!visibleColumns.includes("class_section") ? "hidden" : ""}`}>
                    <span>
                      {course.class_name || course.classroom_name || "—"}
                    </span>
                    <span className="text-muted"> / </span>
                    <span>
                      {getSectionNames(course).join(", ") || "All sections"}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${!visibleColumns.includes("status") ? "hidden" : ""}`}>
                    {course.is_active ? (
                      <span className="px-2 py-1 bg-success text-success rounded text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-danger text-danger rounded text-xs">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleCourseActive(course)}
                        className={`rounded p-1 ${course.is_active ? "text-warning hover:bg-warning-soft" : "text-success hover:bg-success"}`}
                        title={
                          course.is_active
                            ? "Deactivate course"
                            : "Activate course"
                        }
                        aria-label={
                          course.is_active
                            ? `Deactivate ${course.course_name}`
                            : `Activate ${course.course_name}`
                        }
                      >
                        <Power size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(course)}
                        className="rounded p-1 text-accent hover:bg-accent-soft"
                        title="Edit course"
                        aria-label={`Edit ${course.course_name}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => remove(course.id)}
                        className="rounded p-1 text-danger hover:bg-danger-soft"
                        title="Delete course"
                        aria-label={`Delete ${course.course_name}`}
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
              : `EDIT COURSE · ${form.course_name || selected?.course_name || ""}`
        }
        width="max-w-4xl"
        inlinePanel={isEditingCourse}
        inlinePanelClassName="entity-edit-panel settings-inline-edit-panel"
        inlinePanelStyle={editPanelStyle}
        inlinePanelSurfaceClassName="rounded-xl border border-slate-700/70 shadow-lg"
        inlinePanelSurfaceStyle={{ background: "var(--bg-card)" }}
        inlinePanelHeaderClassName="entity-edit-header student-entity-edit-header items-center px-5"
        inlinePanelBodyClassName="entity-edit-body px-5 py-4"
      >
        {mode === "view" && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">
              <div className="rounded-2xl border border-default bg-surface p-5 shadow-lg shadow-slate-950/20">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-muted uppercase tracking-[0.2em] text-xs mb-2">
                      Course details
                    </p>
                    <h2 className="text-2xl font-semibold text-primary">
                      {form.course_name || "Untitled Course"}
                    </h2>
                    <p className="text-muted text-sm mt-2">
                      {form.description || "No description provided."}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${form.is_active ? "bg-success text-success" : "bg-danger-soft text-danger"}`}
                    >
                      {form.is_active ? "Active" : "Inactive"}
                    </div>
                    <p className="text-muted text-xs mt-2">
                      {form.course_code || "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Department
                    </p>
                    <p className="text-primary font-medium">
                      {form.department || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Subject Type
                    </p>
                    <p className="text-primary font-medium">
                      {form.subject_type || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Class
                    </p>
                    <p className="text-primary font-medium">
                      {form.class_name || form.classroom_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Section
                    </p>
                    <p className="text-primary font-medium">
                      {form.section_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Teacher
                    </p>
                    <p className="text-primary font-medium">
                      {form.teacher_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Delivery Mode
                    </p>
                    <p className="text-primary font-medium">
                      {form.delivery_mode || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-default bg-surface p-5 shadow-lg shadow-slate-950/20">
                <p className="text-muted uppercase tracking-[0.2em] text-xs mb-4">
                  Assessment & details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Credit Hours (Theory)
                    </p>
                    <p className="text-primary font-medium">
                      {form.credit_hours_theory || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Credit Hours (Lab)
                    </p>
                    <p className="text-primary font-medium">
                      {form.credit_hours_lab || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Full Marks
                    </p>
                    <p className="text-primary font-medium">
                      {form.full_marks_theory || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Pass Marks
                    </p>
                    <p className="text-primary font-medium">
                      {form.pass_marks_theory || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface p-4 border border-default">
                    <p className="text-muted text-xs uppercase tracking-[0.18em] mb-2">
                      Enrolled Students
                    </p>
                    <p className="text-primary font-medium">
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
                className="w-full xl:w-auto px-4 py-2 bg-subtle text-primary rounded hover:bg-selected"
              >
                Close
              </button>
              <button
                type="button"
                onClick={toggleCourseActive}
                className={`w-full xl:w-auto px-4 py-2 rounded text-primary ${form.is_active ? "bg-danger hover:bg-danger" : "bg-success hover:bg-success"}`}
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
                    section_ids: [],
                  })
                }
                options={classrooms.map((c) => ({
                  label: c.name || "Unknown",
                  value: c.id,
                }))}
              />
              <MultiSelectField
                label="Classroom Sections"
                value={form.section_ids || []}
                onChange={(sectionIds) =>
                  setForm({
                    ...form,
                    section_ids: sectionIds,
                    section_id: sectionIds[0] || null,
                  })
                }
                disabled={mode === "view"}
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
              className="flex-1 px-4 py-2 bg-accent text-primary rounded hover:bg-accent disabled:opacity-50"
            >
              {loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setForm(emptyCourse);
              }}
              className="flex-1 px-4 py-2 bg-subtle text-primary rounded hover:bg-selected"
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
