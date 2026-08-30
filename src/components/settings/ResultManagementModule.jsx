import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  Upload,
  Download,
  Search,
  Check,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import SettingsModal from "../common/SettingsModal";

const CSV_HEADERS = [
  "subject_name",
  "roll_number",
  "student_name",
  "theory_marks",
  "practical_marks",
  "remarks",
];

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const parseCsvText = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  const pushValue = () => {
    row.push(value);
    value = "";
  };

  const pushRow = () => {
    if (row.some((cell) => String(cell).trim() !== "")) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      pushValue();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      pushValue();
      pushRow();
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    pushValue();
    pushRow();
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headers, ...dataRows] = rows;
  return { headers, rows: dataRows };
};

const buildCsvContent = (rows) => {
  const csvRows = [CSV_HEADERS.join(",")];
  rows.forEach((row) => {
    csvRows.push(
      CSV_HEADERS.map((header) => escapeCsvValue(row[header])).join(","),
    );
  });
  return csvRows.join("\n");
};

const formatDateInputValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return "";
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return text.slice(0, 10);
  }
  return "";
};

const formatDisplayDate = (value) => {
  if (!value) return "-";
  const text = String(value).trim();
  if (!text) return "-";
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return text.slice(0, 10);
};

const ResultManagementModule = ({ moduleType = "format" }) => {
  const [examFormats, setExamFormats] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [formatForm, setFormatForm] = useState({
    exam_type: "",
    class_id: "",
    section_id: "",
    academic_year_id: "",
    term: "",
    exam_date: "",
    pass_mark_percentage: 40,
  });

  const [selectedExamForSubjects, setSelectedExamForSubjects] = useState(null);
  const [examSubjects, setExamSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    exam_format_id: "",
    course_id: "",
    subject_name: "",
    theory_max_marks: 0,
    practical_max_marks: 0,
    total_max_marks: 0,
  });

  const [selectedExamForMarks, setSelectedExamForMarks] = useState(null);
  const [selectedSubjectForMarks, setSelectedSubjectForMarks] = useState(null);
  const [marksClassId, setMarksClassId] = useState("");
  const [marksSectionId, setMarksSectionId] = useState("");
  const [marksSections, setMarksSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentMarks, setStudentMarks] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All students");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const fileInputRef = useRef(null);

  const titleMap = {
    format: {
      title: "Exam Setup",
      description:
        "Create and manage exam formats for your classes and academic sessions.",
    },
    subject: {
      title: "Course & Marks",
      description:
        "Define subjects and mark distributions for each exam format.",
    },
    marks: {
      title: "Student Marks Entry",
      description:
        "Enter and save student marks for selected subjects and exams.",
    },
  };

  const currentTitle = titleMap[moduleType] || titleMap.format;

  useEffect(() => {
    if (
      students.length > 0 &&
      selectedSubjectForMarks &&
      selectedExamForMarks
    ) {
      const initialData = {};
      students.forEach((student) => {
        const existingMark = studentMarks.find(
          (m) =>
            m.student_id === student.id &&
            m.exam_subject_id === selectedSubjectForMarks.id,
        );
        initialData[student.id] = {
          id: existingMark?.id || null,
          exam_format_id: selectedExamForMarks.id,
          exam_subject_id: selectedSubjectForMarks.id,
          student_id: student.id,
          theory_marks: existingMark?.theory_marks ?? "",
          practical_marks: existingMark?.practical_marks ?? "",
          total_marks: existingMark?.total_marks ?? "",
          is_pass: existingMark?.is_pass ?? false,
          remarks: existingMark?.remarks ?? "",
        };
      });
      setMarksData(initialData);
    } else {
      setMarksData({});
    }
  }, [students, studentMarks, selectedSubjectForMarks, selectedExamForMarks]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [classRes, yearRes] = await Promise.all([
        axiosInstance.get("/v1/settings/classrooms"),
        axiosInstance.get("/v1/year/getyear"),
      ]);
      setClasses(classRes.data?.data || []);
      setYears(yearRes.data?.data || []);
      const formatsRes = await axiosInstance.get("/v1/results/exam-formats");
      setExamFormats(formatsRes.data?.data || []);
    } catch (err) {
      setError("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksData((prev) => {
      const updated = { ...prev };
      updated[studentId] = {
        ...updated[studentId],
        [field]: value,
      };

      if (field === "theory_marks" || field === "practical_marks") {
        const t = parseFloat(updated[studentId].theory_marks) || 0;
        const p = parseFloat(updated[studentId].practical_marks) || 0;
        updated[studentId].total_marks = t + p;

        const maxMarks =
          parseFloat(selectedSubjectForMarks.total_max_marks) || 100;
        const passPercent =
          parseFloat(selectedExamForMarks.pass_mark_percentage) || 40;
        const required = (maxMarks * passPercent) / 100;
        updated[studentId].is_pass = updated[studentId].total_marks >= required;
      }
      return updated;
    });
  };

  const handleSaveAllMarks = async () => {
    try {
      setLoading(true);
      const promises = Object.values(marksData)
        .filter((m) => m.theory_marks !== "" || m.practical_marks !== "")
        .map((mark) => axiosInstance.post("/v1/results/student-marks", mark));

      await Promise.all(promises);
      setSuccess("All marks saved successfully");

      const res = await axiosInstance.get(
        `/v1/results/student-marks/exam/${selectedExamForMarks.id}`,
      );
      setStudentMarks(res.data?.data || []);
    } catch (err) {
      setError("Failed to save marks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFormat = () => {
    setSelectedFormat(null);
    setFormatForm({
      exam_type: "",
      class_id: "",
      section_id: "",
      academic_year_id: "",
      term: "",
      exam_date: "",
      pass_mark_percentage: 40,
    });
    setSections([]);
    setShowFormatModal(true);
  };

  const handleEditFormat = (format) => {
    setSelectedFormat(format);
    setFormatForm(format);
    if (format?.class_id) {
      handleClassChange(format.class_id, format.section_id);
    } else {
      setSections([]);
    }
    setShowFormatModal(true);
  };

  const handleSaveFormat = async () => {
    try {
      if (!formatForm.exam_type || !formatForm.academic_year_id) {
        setError("Please fill required fields");
        return;
      }

      if (selectedFormat?.id) {
        await axiosInstance.patch(
          `/v1/results/exam-formats/${selectedFormat.id}`,
          formatForm,
        );
        setSuccess("Exam format updated successfully");
      } else {
        const res = await axiosInstance.post(
          "/v1/results/exam-formats",
          formatForm,
        );
        setExamFormats([...examFormats, res.data.data]);
        setSuccess("Exam format created successfully");
      }
      setShowFormatModal(false);
      await loadInitialData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save exam format");
    }
  };

  const handleDeleteFormat = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axiosInstance.delete(`/v1/results/exam-formats/${id}`);
        setExamFormats(examFormats.filter((f) => f.id !== id));
        setSuccess("Exam format deleted");
      } catch (err) {
        setError("Failed to delete exam format");
      }
    }
  };

  const handleClassChange = async (classId, selectedSectionId = "") => {
    setFormatForm((prev) => ({
      ...prev,
      class_id: classId,
      section_id: selectedSectionId || "",
    }));
    if (!classId) {
      setSections([]);
      return;
    }
    try {
      const res = await axiosInstance.get(
        `/v1/settings/classrooms/${classId}/sections`,
      );
      const sectionList = res.data?.data || [];
      setSections(sectionList);
      if (
        selectedSectionId &&
        !sectionList.some(
          (section) => String(section.id) === String(selectedSectionId),
        )
      ) {
        setFormatForm((prev) => ({ ...prev, section_id: "" }));
      }
    } catch (err) {
      setSections([]);
    }
  };

  const handleSelectExamForSubjects = async (exam) => {
    setSelectedExamForSubjects(exam);
    setSelectedSubjectForMarks(null);
    try {
      const [subRes, courRes] = await Promise.all([
        axiosInstance.get(`/v1/results/exam-subjects/${exam.id}`),
        exam.class_id
          ? axiosInstance.get(`/v1/results/class-courses/${exam.class_id}`)
          : Promise.resolve({ data: { data: [] } }),
      ]);
      setExamSubjects(subRes.data?.data || []);
      setCourses(courRes.data?.data || []);
    } catch (err) {
      setError("Failed to load subjects and courses");
    }
  };

  const handleAddSubject = () => {
    if (!selectedExamForSubjects) {
      setError("Please select an exam format first");
      return;
    }
    setSelectedSubject(null);
    setSubjectForm({
      exam_format_id: selectedExamForSubjects.id,
      course_id: "",
      subject_name: "",
      theory_max_marks: 0,
      practical_max_marks: 0,
      total_max_marks: 0,
    });
    setShowSubjectModal(true);
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setSubjectForm(subject);
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async () => {
    try {
      if (!subjectForm.subject_name || !subjectForm.total_max_marks) {
        setError("Please fill required fields");
        return;
      }

      if (selectedSubject?.id) {
        await axiosInstance.patch(
          `/v1/results/exam-subjects/${selectedSubject.id}`,
          subjectForm,
        );
        setSuccess("Subject updated successfully");
      } else {
        const res = await axiosInstance.post(
          "/v1/results/exam-subjects",
          subjectForm,
        );
        setExamSubjects([...examSubjects, res.data.data]);
        setSuccess("Subject created successfully");
      }
      setShowSubjectModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save subject");
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axiosInstance.delete(`/v1/results/exam-subjects/${id}`);
        setExamSubjects(examSubjects.filter((s) => s.id !== id));
        setSuccess("Subject deleted");
      } catch (err) {
        setError("Failed to delete subject");
      }
    }
  };

  const fetchStudentsForMarks = async (classId, sectionId) => {
    if (!classId) {
      setStudents([]);
      return;
    }
    try {
      const params = new URLSearchParams();
      params.append("class_id", classId);
      if (sectionId) params.append("section_id", sectionId);

      const res = await axiosInstance.get(
        `/v1/results/class-students?${params.toString()}`,
      );
      setStudents(res.data?.data || []);
    } catch (err) {
      setError("Failed to load students");
    }
  };

  const handleMarksClassChange = async (classId) => {
    setMarksClassId(classId);
    setMarksSectionId("");
    if (!classId) {
      setMarksSections([]);
      setStudents([]);
      return;
    }
    try {
      const res = await axiosInstance.get(
        `/v1/settings/classrooms/${classId}/sections`,
      );
      setMarksSections(res.data?.data || []);
      fetchStudentsForMarks(classId, "");
    } catch (err) {
      setError("Failed to load sections");
    }
  };

  const handleMarksSectionChange = (sectionId) => {
    setMarksSectionId(sectionId);
    fetchStudentsForMarks(marksClassId, sectionId);
  };

  const handlePublishExam = async (exam, nextState) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/v1/results/exam-formats/${exam.id}/publish`, {
        is_published: nextState,
      });
      setSuccess(
        nextState
          ? "Result portal published successfully"
          : "Result portal unpublished",
      );
      const formatsRes = await axiosInstance.get("/v1/results/exam-formats");
      setExamFormats(formatsRes.data?.data || []);
    } catch (err) {
      setError("Failed to update exam publication status");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExamForMarks = async (exam) => {
    setSelectedExamForMarks(exam);
    if (!exam) {
      setExamSubjects([]);
      setSelectedSubjectForMarks(null);
      return;
    }
    try {
      const res = await axiosInstance.get(
        `/v1/results/exam-subjects/${exam.id}`,
      );
      setExamSubjects(res.data?.data || []);
      setSelectedSubjectForMarks(null);
    } catch (err) {
      setError("Failed to load subjects");
    }
  };

  const handleSelectSubjectForMarks = async (subject) => {
    setSelectedSubjectForMarks(subject);
    try {
      const res = await axiosInstance.get(
        `/v1/results/student-marks/exam/${selectedExamForMarks.id}`,
      );
      setStudentMarks(res.data?.data || []);
    } catch (err) {
      setError("Failed to load marks");
    }
  };

  const canUseMarksCsvActions = Boolean(
    marksClassId &&
    marksSectionId &&
    selectedExamForMarks &&
    selectedSubjectForMarks,
  );

  const getCurrentMarksExportRows = () => {
    return students.map((student) => {
      const mark = marksData?.[student.id] || {};
      return {
        subject_name: selectedSubjectForMarks?.subject_name || "",
        roll_number: student.roll_no || "",
        student_name: student.full_name || "",
        theory_marks: mark.theory_marks ?? "",
        practical_marks: mark.practical_marks ?? "",
        remarks: mark.remarks ?? "",
      };
    });
  };

  const triggerCsvDownload = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canUseMarksCsvActions) {
      setError(
        "Please select class, section, exam and subject before importing CSV.",
      );
      event.target.value = "";
      return;
    }

    try {
      setIsImportingCsv(true);
      const text = await file.text();
      const { headers, rows } = parseCsvText(text);

      if (!headers.length || headers.length !== CSV_HEADERS.length) {
        throw new Error(
          "CSV headers do not match the expected student marks format.",
        );
      }

      const normalizeHeader = (header) =>
        header.trim().toLowerCase().replace(/\s+/g, "_");
      const normalizedHeaders = headers.map((header) =>
        normalizeHeader(header),
      );
      const expectedHeaders = CSV_HEADERS.map((header) =>
        normalizeHeader(header),
      );
      const mismatch = expectedHeaders.some(
        (header) => !normalizedHeaders.includes(header),
      );
      if (mismatch) {
        throw new Error(
          "CSV headers do not match the expected student marks format.",
        );
      }

      const payloads = rows
        .map((row) => {
          const record = {};
          normalizedHeaders.forEach((header, index) => {
            record[header] = row[index] ?? "";
          });
          return record;
        })
        .filter((record) =>
          Object.values(record).some((value) => String(value).trim() !== ""),
        )
        .map((record) => {
          const subjectName = String(record.subject_name || "")
            .trim()
            .toLowerCase();
          const selectedSubjectName = String(
            selectedSubjectForMarks?.subject_name || "",
          )
            .trim()
            .toLowerCase();
          if (subjectName && subjectName !== selectedSubjectName) {
            throw new Error(
              `Subject name ${record.subject_name} does not match the selected subject ${selectedSubjectForMarks?.subject_name}.`,
            );
          }

          const expectedRoll = String(record.roll_number || "").trim();
          const expectedName = String(record.student_name || "")
            .trim()
            .toLowerCase();
          const matchedStudent = students.find((student) => {
            const studentRoll = String(student.roll_no || "").trim();
            const studentName = String(student.full_name || "")
              .trim()
              .toLowerCase();
            return (
              expectedRoll &&
              studentRoll &&
              expectedRoll === studentRoll &&
              expectedName &&
              studentName &&
              expectedName === studentName
            );
          });

          if (!matchedStudent) {
            throw new Error(
              `Student with roll number ${expectedRoll || "(missing)"} and name ${record.student_name || "(missing)"} was not found in the selected class and section.`,
            );
          }

          const theoryMarksRaw = String(record.theory_marks ?? "").trim();
          const practicalMarksRaw = String(record.practical_marks ?? "").trim();
          const theoryMarks =
            theoryMarksRaw === "" ? null : Number(theoryMarksRaw);
          const practicalMarks =
            practicalMarksRaw === "" ? null : Number(practicalMarksRaw);

          if (
            (theoryMarksRaw !== "" && Number.isNaN(theoryMarks)) ||
            (practicalMarksRaw !== "" && Number.isNaN(practicalMarks))
          ) {
            throw new Error(
              `Marks for ${record.student_name || expectedRoll} must be numeric.`,
            );
          }

          const totalMarks = (theoryMarks ?? 0) + (practicalMarks ?? 0);
          const maxMarks =
            parseFloat(selectedSubjectForMarks.total_max_marks) || 100;
          const passPercent =
            parseFloat(selectedExamForMarks.pass_mark_percentage) || 40;
          const required = (maxMarks * passPercent) / 100;

          return {
            exam_format_id: selectedExamForMarks.id,
            exam_subject_id: selectedSubjectForMarks.id,
            student_id: matchedStudent.id,
            theory_marks: theoryMarks,
            practical_marks: practicalMarks,
            total_marks: totalMarks,
            is_pass: totalMarks >= required,
            remarks: record.remarks || null,
          };
        });

      await Promise.all(
        payloads.map((payload) =>
          axiosInstance.post("/v1/results/student-marks", payload),
        ),
      );
      const res = await axiosInstance.get(
        `/v1/results/student-marks/exam/${selectedExamForMarks.id}`,
      );
      setStudentMarks(res.data?.data || []);
      setSuccess(
        `Imported ${payloads.length} student marks record(s) successfully.`,
      );
    } catch (err) {
      setError(err.message || "Failed to import CSV file");
    } finally {
      setIsImportingCsv(false);
      event.target.value = "";
    }
  };

  const handleExportCsv = () => {
    if (!canUseMarksCsvActions) {
      setError(
        "Please select class, section, exam and subject before exporting CSV.",
      );
      return;
    }

    try {
      setIsExportingCsv(true);
      const rows = getCurrentMarksExportRows();
      const csvContent = buildCsvContent(rows);
      const filename = `${(selectedExamForMarks?.exam_type || "marks").replace(/\s+/g, "_")}_${(selectedSubjectForMarks?.subject_name || "subject").replace(/\s+/g, "_")}.csv`;
      triggerCsvDownload(csvContent, filename);
      setSuccess("CSV export completed successfully.");
    } catch (err) {
      setError("Failed to export CSV file");
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportTemplate = () => {
    if (!canUseMarksCsvActions) {
      setError(
        "Please select class, section, exam and subject before exporting the template.",
      );
      return;
    }

    try {
      const rows = students.map((student) => ({
        subject_name: selectedSubjectForMarks?.subject_name || "",
        roll_number: student.roll_no || "",
        student_name: student.full_name || "",
        theory_marks: "",
        practical_marks: "",
        remarks: "",
      }));
      const csvContent = buildCsvContent(rows);
      const filename = `${(selectedExamForMarks?.exam_type || "marks").replace(/\s+/g, "_")}_${(selectedSubjectForMarks?.subject_name || "subject").replace(/\s+/g, "_")}_template.csv`;
      triggerCsvDownload(csvContent, filename);
      setSuccess("CSV template download completed successfully.");
    } catch (err) {
      setError("Failed to export CSV template");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0f141e] rounded-2xl border border-slate-800/50">
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-white">
              {currentTitle.title}
            </h2>
            <p className="text-slate-500 mt-1 font-medium text-[11px]">
              {currentTitle.description}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900/40 border border-slate-800/50 rounded-xl">
            <FileText size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Results Module
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 text-red-300 rounded-lg border border-red-500/20">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs px-3 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-500/10 text-emerald-300 rounded-lg border border-emerald-500/20">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="text-xs px-3 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/10"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {moduleType === "format" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400 font-black uppercase tracking-widest">
                Exam Format Setup
              </div>
              <button
                onClick={handleAddFormat}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
              >
                <Plus size={14} /> New Exam Format
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800/60">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60 border-b border-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-300">
                      Exam Type
                    </th>
                    <th className="px-4 py-3 text-left text-slate-300">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-slate-300">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left text-slate-300">Year</th>
                    <th className="px-4 py-3 text-left text-slate-300">Term</th>
                    <th className="px-4 py-3 text-left text-slate-300">
                      Exam Date
                    </th>
                    <th className="px-4 py-3 text-left text-slate-300">
                      Pass Mark %
                    </th>
                    <th className="px-4 py-3 text-center text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {examFormats.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No exam formats available yet. Create one to get
                        started.
                      </td>
                    </tr>
                  ) : (
                    examFormats.map((format) => (
                      <tr
                        key={format.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {format.exam_type || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {format.class_name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {format.section_name ||
                            format.section?.section_name ||
                            "-"}
                        </td>
                        <td className="px-4 py-3">
                          {format.academic_year || "-"}
                        </td>
                        <td className="px-4 py-3">{format.term || "-"}</td>
                        <td className="px-4 py-3">
                          {formatDisplayDate(format.exam_date)}
                        </td>
                        <td className="px-4 py-3">
                          {format.pass_mark_percentage ?? 0}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEditFormat(format)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteFormat(format.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {moduleType === "subject" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Exam Format
              </label>
              <select
                value={selectedExamForSubjects?.id || ""}
                onChange={(e) => {
                  const exam = examFormats.find(
                    (f) => f.id === parseInt(e.target.value),
                  );
                  if (exam) handleSelectExamForSubjects(exam);
                }}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Choose Exam Format --</option>
                {examFormats.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.exam_type} ({format.class_name})
                  </option>
                ))}
              </select>
            </div>

            {selectedExamForSubjects && (
              <>
                <button
                  onClick={handleAddSubject}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                >
                  <Plus size={20} /> Add Subject
                </button>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Subject Name</th>
                        <th className="px-4 py-3 text-left">Theory Max</th>
                        <th className="px-4 py-3 text-left">Practical Max</th>
                        <th className="px-4 py-3 text-left">Total Max</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examSubjects.map((subject) => (
                        <tr
                          key={subject.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">{subject.subject_name}</td>
                          <td className="px-4 py-3">
                            {subject.theory_max_marks}
                          </td>
                          <td className="px-4 py-3">
                            {subject.practical_max_marks}
                          </td>
                          <td className="px-4 py-3">
                            {subject.total_max_marks}
                          </td>
                          <td className="px-4 py-3 flex justify-center gap-2">
                            <button
                              onClick={() => handleEditSubject(subject)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
        {moduleType === "marks" && (
          <div className="space-y-6 text-sm">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold mr-auto">
                Academic Year 2025-26
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCsv}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || isImportingCsv}
                className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 font-medium text-xs transition disabled:opacity-50"
              >
                <Upload size={14} />{" "}
                {isImportingCsv ? "Importing..." : "Import CSV"}
              </button>
              <button
                onClick={handleExportCsv}
                disabled={loading || isExportingCsv || !canUseMarksCsvActions}
                className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 font-medium text-xs transition disabled:opacity-50"
              >
                <Download size={14} />{" "}
                {isExportingCsv ? "Exporting..." : "Export CSV"}
              </button>
              <button
                onClick={handleExportTemplate}
                disabled={!canUseMarksCsvActions}
                className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 font-medium text-xs transition disabled:opacity-50"
              >
                <FileText size={14} /> Export Template
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Select class, section, exam and subject first, then import or
              export the CSV file for this marks sheet.
            </div>

            {/* Filters Area */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                  CLASS
                </label>
                <select
                  value={marksClassId}
                  onChange={(e) => handleMarksClassChange(e.target.value)}
                  className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                  SECTION
                </label>
                <select
                  value={marksSectionId}
                  onChange={(e) => handleMarksSectionChange(e.target.value)}
                  disabled={!marksClassId}
                  className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">
                    {marksClassId ? "-- Select Section --" : "Choose Class"}
                  </option>
                  {marksSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name || sec.section_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                  EXAM
                </label>
                <select
                  value={selectedExamForMarks?.id || ""}
                  onChange={(e) => {
                    const exam = examFormats.find(
                      (f) => f.id === parseInt(e.target.value),
                    );
                    if (exam) handleSelectExamForMarks(exam);
                    else handleSelectExamForMarks(null);
                  }}
                  className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Exam --</option>
                  {examFormats.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.exam_type} ({format.class_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                  SUBJECT
                </label>
                <select
                  value={selectedSubjectForMarks?.id || ""}
                  onChange={(e) => {
                    const subject = examSubjects.find(
                      (s) => s.id === parseInt(e.target.value),
                    );
                    if (subject) handleSelectSubjectForMarks(subject);
                    else handleSelectSubjectForMarks(null);
                  }}
                  disabled={!selectedExamForMarks}
                  className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">
                    {selectedExamForMarks
                      ? "-- Choose Subject --"
                      : "Choose Exam"}
                  </option>
                  {examSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
                  STATUS FILTER
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#1e2430] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="All students">All students</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            {selectedSubjectForMarks && marksClassId && (
              <>
                {selectedExamForMarks && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                        Public Result Portal
                      </div>
                      <div className="mt-1 text-sm text-slate-300">
                        {selectedExamForMarks.is_published
                          ? "This exam is currently published for public access."
                          : "Publish this exam to make it visible to students and parents."}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href="/result-portal"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                      >
                        Open Portal
                      </a>
                      <button
                        onClick={() =>
                          handlePublishExam(
                            selectedExamForMarks,
                            !selectedExamForMarks.is_published,
                          )
                        }
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${selectedExamForMarks.is_published ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/20" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20"}`}
                      >
                        {selectedExamForMarks.is_published
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                {(() => {
                  let passed = 0;
                  let failed = 0;
                  let totalPercent = 0;
                  const validStudents = students.filter(
                    (s) =>
                      marksData[s.id] &&
                      (marksData[s.id].theory_marks !== "" ||
                        marksData[s.id].practical_marks !== ""),
                  );

                  validStudents.forEach((s) => {
                    if (marksData[s.id].is_pass) passed++;
                    else failed++;
                    const maxMarks =
                      parseFloat(selectedSubjectForMarks?.total_max_marks) ||
                      100;
                    const totalMarks =
                      parseFloat(marksData[s.id].total_marks) || 0;
                    const percent =
                      maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
                    totalPercent += percent;
                  });

                  const passRate = validStudents.length
                    ? Math.round((passed / validStudents.length) * 100)
                    : 0;
                  const classAvg = validStudents.length
                    ? Math.round(totalPercent / validStudents.length)
                    : 0;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                        <div className="text-2xl font-black text-white">
                          {students.length}
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-1">
                          Total students
                        </div>
                      </div>
                      <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                        <div className="text-2xl font-black text-green-500">
                          {passed}
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-1">
                          Passed
                        </div>
                      </div>
                      <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                        <div className="text-2xl font-black text-red-500">
                          {failed}
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-1">
                          Failed
                        </div>
                      </div>
                      <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                        <div className="text-2xl font-black text-white">
                          {passRate}%
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-1">
                          Pass rate
                        </div>
                      </div>
                      <div className="p-4 border border-slate-700/60 rounded-xl bg-slate-900/40">
                        <div className="text-2xl font-black text-white">
                          {classAvg}%
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-1">
                          Class average
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Toolbar: Search and Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search by name or roll number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#1e2430] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveAllMarks}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-600 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
                    >
                      <Check size={16} />{" "}
                      {loading ? "Saving..." : "Save all marks"}
                    </button>
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto border border-slate-700/60 rounded-xl mt-4 bg-[#141a23]">
                  <div className="flex items-center justify-between p-4 bg-slate-800/40 border-b border-slate-700/60 text-slate-300">
                    <div className="font-bold">{students.length} students</div>
                    <div className="text-xs">
                      Pass mark:{" "}
                      {selectedExamForMarks?.pass_mark_percentage || 40} | Full
                      marks: Theory{" "}
                      {selectedSubjectForMarks.theory_max_marks || 0} +
                      Practical{" "}
                      {selectedSubjectForMarks.practical_max_marks || 0} ={" "}
                      {selectedSubjectForMarks.total_max_marks || 0}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-[#141a23] border-b border-slate-700/60">
                      <tr>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-24">
                          ROLL NO
                        </th>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400">
                          STUDENT NAME
                        </th>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-28">
                          THEORY /
                          {selectedSubjectForMarks.theory_max_marks || 0}
                        </th>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-28">
                          PRACTICAL /
                          {selectedSubjectForMarks.practical_max_marks || 0}
                        </th>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-20">
                          TOTAL
                        </th>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-16">
                          %
                        </th>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-16">
                          GRADE
                        </th>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-32">
                          REMARKS
                        </th>
                        <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-400 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {students
                        .filter((s) => {
                          const searchLower = searchQuery.toLowerCase();
                          const matchesSearch =
                            s.full_name.toLowerCase().includes(searchLower) ||
                            (s.roll_no &&
                              s.roll_no
                                .toString()
                                .toLowerCase()
                                .includes(searchLower));

                          if (statusFilter === "All students")
                            return matchesSearch;
                          const mark = marksData[s.id];
                          if (
                            !mark ||
                            (mark.theory_marks === "" &&
                              mark.practical_marks === "")
                          )
                            return false;

                          if (statusFilter === "Passed")
                            return matchesSearch && mark.is_pass;
                          if (statusFilter === "Failed")
                            return matchesSearch && !mark.is_pass;
                          return matchesSearch;
                        })
                        .map((student) => {
                          const mark = marksData[student.id];
                          if (!mark) return null;

                          const hasMarks =
                            mark.theory_marks !== "" ||
                            mark.practical_marks !== "";
                          const maxMarks =
                            parseFloat(
                              selectedSubjectForMarks?.total_max_marks,
                            ) || 100;
                          const totalMarks = parseFloat(mark.total_marks) || 0;
                          const percent =
                            maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

                          const getGradeInfo = (pct, isPass, hasData) => {
                            if (!hasData)
                              return {
                                grade: "-",
                                color: "text-slate-500",
                                bg: "bg-slate-800",
                              };
                            if (!isPass)
                              return {
                                grade: "F",
                                color: "text-blue-400",
                                bg: "bg-blue-400/20",
                              };
                            if (pct >= 90)
                              return {
                                grade: "A+",
                                color: "text-blue-400",
                                bg: "bg-blue-400/20",
                              };
                            if (pct >= 80)
                              return {
                                grade: "A",
                                color: "text-blue-400",
                                bg: "bg-blue-400/20",
                              };
                            if (pct >= 70)
                              return {
                                grade: "B+",
                                color: "text-blue-400",
                                bg: "bg-blue-400/20",
                              };
                            if (pct >= 60)
                              return {
                                grade: "B",
                                color: "text-blue-400",
                                bg: "bg-blue-400/20",
                              };
                            if (pct >= 50)
                              return {
                                grade: "C+",
                                color: "text-blue-400",
                                bg: "bg-blue-400/20",
                              };
                            if (pct >= 40)
                              return {
                                grade: "C",
                                color: "text-blue-400",
                                bg: "bg-blue-400/20",
                              };
                            return {
                              grade: "D",
                              color: "text-blue-400",
                              bg: "bg-blue-400/20",
                            };
                          };

                          const gradeInfo = getGradeInfo(
                            percent,
                            mark.is_pass,
                            hasMarks,
                          );

                          return (
                            <tr
                              key={student.id}
                              className="hover:bg-slate-800/30 transition text-white font-medium"
                            >
                              <td className="px-4 py-4">{student.roll_no}</td>
                              <td className="px-4 py-4">{student.full_name}</td>
                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  className="w-16 bg-[#1e2430] border border-slate-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 text-center"
                                  value={mark.theory_marks}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      student.id,
                                      "theory_marks",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  className="w-16 bg-[#1e2430] border border-slate-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 text-center"
                                  value={mark.practical_marks}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      student.id,
                                      "practical_marks",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>
                              <td className="px-4 py-4">
                                {hasMarks ? mark.total_marks : "-"}
                              </td>
                              <td className="px-4 py-4">
                                {hasMarks ? `${Math.round(percent)}%` : "-"}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${gradeInfo.bg} ${gradeInfo.color}`}
                                >
                                  {gradeInfo.grade}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="text"
                                  className="w-full bg-[#1e2430] border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                                  value={mark.remarks}
                                  placeholder="Add re"
                                  onChange={(e) =>
                                    handleMarkChange(
                                      student.id,
                                      "remarks",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>
                              <td className="px-4 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {hasMarks && (
                                    <span
                                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                        mark.is_pass
                                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                                          : "bg-red-500/10 text-red-500 border-red-500/20"
                                      }`}
                                    >
                                      {mark.is_pass ? "Pass" : "Fail"}
                                    </span>
                                  )}
                                  <button className="w-8 h-8 flex items-center justify-center border border-red-900/30 bg-red-900/20 hover:bg-red-900/40 rounded transition">
                                    <Edit2 size={12} className="text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}{" "}
      </div>

      <SettingsModal
        open={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title={selectedFormat ? "Edit Exam Format" : "New Exam Format"}
        subtitle="Fill in the exam details and assign the right section."
        width="max-w-2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowFormatModal(false)}
              className="flex-1 px-4 py-2 border border-slate-600/50 rounded-lg hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFormat}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Exam Type *
            </label>
            <input
              type="text"
              value={formatForm.exam_type}
              onChange={(e) =>
                setFormatForm({ ...formatForm, exam_type: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g., Midterm, Final"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              value={formatForm.class_id}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">-- Select --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <select
              value={formatForm.section_id || ""}
              onChange={(e) =>
                setFormatForm({ ...formatForm, section_id: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              disabled={!formatForm.class_id}
            >
              <option value="">
                {formatForm.class_id
                  ? "-- Select Section --"
                  : "Choose a class first"}
              </option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.section_name ||
                    sec.name ||
                    sec.section ||
                    `Section ${sec.id}`}
                </option>
              ))}
            </select>
            {!formatForm.class_id && (
              <p className="text-xs text-slate-500 mt-1">
                Select a class to load sections from the school database.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Academic Year *
            </label>
            <select
              value={formatForm.academic_year_id}
              onChange={(e) =>
                setFormatForm({
                  ...formatForm,
                  academic_year_id: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">-- Select --</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Term</label>
            <input
              type="text"
              value={formatForm.term}
              onChange={(e) =>
                setFormatForm({ ...formatForm, term: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g., First Term"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Exam Date</label>
            <input
              type="date"
              value={formatDateInputValue(formatForm.exam_date)}
              onChange={(e) =>
                setFormatForm({ ...formatForm, exam_date: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Pass Mark %
            </label>
            <input
              type="number"
              value={formatForm.pass_mark_percentage}
              onChange={(e) =>
                setFormatForm({
                  ...formatForm,
                  pass_mark_percentage: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </SettingsModal>

      <SettingsModal
        open={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title={selectedSubject ? "Edit Subject" : "New Subject"}
        width="max-w-md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowSubjectModal(false)}
              className="flex-1 px-4 py-2 border border-slate-600/50 rounded-lg hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSubject}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Subject Name *
            </label>
            <select
              value={subjectForm.course_id || ""}
              onChange={(e) => {
                const selectedCourse = courses.find(
                  (c) => c.id === parseInt(e.target.value),
                );
                setSubjectForm({
                  ...subjectForm,
                  course_id: e.target.value,
                  subject_name: selectedCourse
                    ? selectedCourse.course_name
                    : "",
                });
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">-- Select Course / Subject --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Theory Max Marks
            </label>
            <input
              type="number"
              value={subjectForm.theory_max_marks}
              onChange={(e) =>
                setSubjectForm({
                  ...subjectForm,
                  theory_max_marks: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Practical Max Marks
            </label>
            <input
              type="number"
              value={subjectForm.practical_max_marks}
              onChange={(e) =>
                setSubjectForm({
                  ...subjectForm,
                  practical_max_marks: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Max Marks *
            </label>
            <input
              type="number"
              value={subjectForm.total_max_marks}
              onChange={(e) =>
                setSubjectForm({
                  ...subjectForm,
                  total_max_marks: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </SettingsModal>
    </div>
  );
};

export default ResultManagementModule;
