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
  ChevronDown,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import SettingsModal from "../common/SettingsModal";
import "./ResultsModuleDesign.css";

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
    <div className="results-module">
      <div className="results-header">
        <div>
          <h1>{currentTitle.title}</h1>
          <p>{currentTitle.description}</p>
        </div>
        <div className="header-right">
          <div className="year-pill">
            <span className="dot"></span>
            {new Date().getFullYear()}–{new Date().getFullYear() + 1}
          </div>
          <button className="btn-ghost" type="button">
            <FileText size={14} />
            Results Module
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: '0 24px 16px 24px', padding: '12px 16px', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-s)', color: 'var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '13px' }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-s)',
                border: '1px solid var(--danger)',
                background: 'transparent',
                color: 'var(--danger)',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {success && (
        <div style={{ margin: '0 24px 16px 24px', padding: '12px 16px', background: 'var(--success-dim)', border: '1px solid var(--success)', borderRadius: 'var(--radius-s)', color: 'var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '13px' }}>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-s)',
                border: '1px solid var(--success)',
                background: 'transparent',
                color: 'var(--success)',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="results-content">
        {moduleType === "format" && (
          <div className="space-y-6">
            <div className="section-header">
              <span>Exam Format Setup</span>
              <button
                onClick={handleAddFormat}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={14} /> New Format
              </button>
            </div>

            <div className="format-table">
              <table>
                <thead>
                  <tr>
                    <th>Exam Type</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Year</th>
                    <th>Term</th>
                    <th>Exam Date</th>
                    <th>Pass Mark %</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {examFormats.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-faint)' }}>
                        No exam formats available yet. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    examFormats.map((format) => (
                      <tr key={format.id}>
                        <td>{format.exam_type || "-"}</td>
                        <td>{format.class_name || "-"}</td>
                        <td>{format.section_name || format.section?.section_name || "-"}</td>
                        <td>{format.academic_year || "-"}</td>
                        <td>{format.term || "-"}</td>
                        <td>{formatDisplayDate(format.exam_date)}</td>
                        <td>{format.pass_mark_percentage ?? 0}%</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleEditFormat(format)}
                              className="icon-btn"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteFormat(format.id)}
                              className="icon-btn"
                              title="Delete"
                            >
                              <Trash2 size={16} />
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
                Select Exam Format
              </label>
              <select
                value={selectedExamForSubjects?.id || ""}
                onChange={(e) => {
                  const exam = examFormats.find((f) => f.id === parseInt(e.target.value));
                  if (exam) handleSelectExamForSubjects(exam);
                }}
                className="filter-select"
                style={{ width: '100%' }}
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
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> Add Subject
                </button>

                <div className="format-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Theory Max</th>
                        <th>Practical Max</th>
                        <th>Total Max</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examSubjects.map((subject) => (
                        <tr key={subject.id}>
                          <td>{subject.subject_name}</td>
                          <td>{subject.theory_max_marks}</td>
                          <td>{subject.practical_max_marks}</td>
                          <td>{subject.total_max_marks}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleEditSubject(subject)}
                                className="icon-btn"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject.id)}
                                className="icon-btn"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Workflow Rail */}
            {marksClassId && marksSectionId && selectedExamForMarks && selectedSubjectForMarks && (
              <div className="workflow-rail">
                <div className="rail-top">
                  <span className="rail-title">Mark Entry Workflow</span>
                  <span className="rail-progress-label" id="stepLabel">
                    Class, Section, Exam & Subject Selected
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="toolbar active">
              <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="year-pill">
                  <span className="dot"></span>
                  {new Date().getFullYear()}–{new Date().getFullYear() + 1}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCsv}
              />
              <div className="toolbar-actions">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || isImportingCsv || !canUseMarksCsvActions}
                  className="btn-ghost"
                >
                  <Upload size={14} />
                  {isImportingCsv ? "Importing..." : "Import CSV"}
                </button>
                <button
                  onClick={handleExportCsv}
                  disabled={loading || isExportingCsv || !canUseMarksCsvActions}
                  className="btn-ghost"
                >
                  <Download size={14} />
                  {isExportingCsv ? "Exporting..." : "Export CSV"}
                </button>
                <button
                  onClick={handleExportTemplate}
                  disabled={!canUseMarksCsvActions}
                  className="btn-ghost"
                >
                  <FileText size={14} /> Template
                </button>
              </div>
            </div>

            {/* Filter Selection Area */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '16px',
              background: 'var(--surface)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-m)'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  CLASS
                </label>
                <select
                  value={marksClassId}
                  onChange={(e) => handleMarksClassChange(e.target.value)}
                  className="filter-select"
                  style={{ width: '100%' }}
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
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  SECTION
                </label>
                <select
                  value={marksSectionId}
                  onChange={(e) => handleMarksSectionChange(e.target.value)}
                  disabled={!marksClassId}
                  className="filter-select"
                  style={{ width: '100%', opacity: !marksClassId ? 0.5 : 1 }}
                >
                  <option value="">{marksClassId ? "-- Select Section --" : "Choose Class"}</option>
                  {marksSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name || sec.section_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  EXAM
                </label>
                <select
                  value={selectedExamForMarks?.id || ""}
                  onChange={(e) => {
                    const exam = examFormats.find((f) => f.id === parseInt(e.target.value));
                    handleSelectExamForMarks(exam || null);
                  }}
                  className="filter-select"
                  style={{ width: '100%' }}
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
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  SUBJECT
                </label>
                <select
                  value={selectedSubjectForMarks?.id || ""}
                  onChange={(e) => {
                    const subject = examSubjects.find((s) => s.id === parseInt(e.target.value));
                    handleSelectSubjectForMarks(subject || null);
                  }}
                  disabled={!selectedExamForMarks}
                  className="filter-select"
                  style={{ width: '100%', opacity: !selectedExamForMarks ? 0.5 : 1 }}
                >
                  <option value="">{selectedExamForMarks ? "-- Choose Subject --" : "Choose Exam"}</option>
                  {examSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                  FILTER
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                  style={{ width: '100%' }}
                >
                  <option value="All students">All students</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Publish Section */}
            {selectedExamForMarks && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-m)',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    Result Portal
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-dim)' }}>
                    {selectedExamForMarks.is_published
                      ? "This exam is published for public access"
                      : "Publish to make visible to students and parents"}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <a
                    href="/result-portal"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    Open Portal
                  </a>
                  <button
                    onClick={() =>
                      handlePublishExam(selectedExamForMarks, !selectedExamForMarks.is_published)
                    }
                    className="btn-primary"
                  >
                    {selectedExamForMarks.is_published ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            {selectedSubjectForMarks && (
              <div className="stats active">
                {(() => {
                  let passed = 0, failed = 0, totalPercent = 0;
                  const validStudents = students.filter((s) =>
                    marksData[s.id] &&
                    (marksData[s.id].theory_marks !== "" || marksData[s.id].practical_marks !== "")
                  );
                  validStudents.forEach((s) => {
                    if (marksData[s.id].is_pass) passed++;
                    else failed++;
                    const maxMarks = parseFloat(selectedSubjectForMarks?.total_max_marks) || 100;
                    const totalMarks = parseFloat(marksData[s.id].total_marks) || 0;
                    const percent = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
                    totalPercent += percent;
                  });
                  const passRate = validStudents.length ? Math.round((passed / validStudents.length) * 100) : 0;
                  const classAvg = validStudents.length ? Math.round(totalPercent / validStudents.length) : 0;

                  return (
                    <>
                      <div className="stat-card">
                        <div className="label">Total Students</div>
                        <div className="value">{students.length}</div>
                      </div>
                      <div className="stat-card success">
                        <div className="label">Passed</div>
                        <div className="value">{passed}</div>
                      </div>
                      <div className="stat-card warn">
                        <div className="label">Failed</div>
                        <div className="value">{failed}</div>
                      </div>
                      <div className="stat-card">
                        <div className="label">Pass Rate</div>
                        <div className="value">{passRate}<span>%</span></div>
                      </div>
                      <div className="stat-card success">
                        <div className="label">Class Avg</div>
                        <div className="value">{classAvg}<span>%</span></div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Search Bar */}
            {selectedSubjectForMarks && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="search-box" style={{ flex: 1 }}>
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleSaveAllMarks}
                  disabled={loading}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={14} /> {loading ? "Saving..." : "Save"}
                </button>
              </div>
            )}

            {/* Data Table */}
            {selectedSubjectForMarks && (
              <div className="table-wrap active">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  background: 'var(--surface)',
                  borderBottom: '1px solid var(--border-soft)',
                  fontSize: '12px',
                  color: 'var(--text-faint)'
                }}>
                  <span>{students.length} students registered</span>
                  <span style={{ fontSize: '11px' }}>
                    Pass: {selectedExamForMarks?.pass_mark_percentage || 40}% | Max: {selectedSubjectForMarks.total_max_marks || 0}
                  </span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Roll</th>
                      <th>Student Name</th>
                      <th className="num" style={{ width: '80px' }}>Theory</th>
                      <th className="num" style={{ width: '80px' }}>Practical</th>
                      <th className="num" style={{ width: '60px' }}>Total</th>
                      <th className="num" style={{ width: '50px' }}>%</th>
                      <th className="num" style={{ width: '60px' }}>Grade</th>
                      <th style={{ width: '100px' }}>Remarks</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter((s) => {
                        const searchLower = searchQuery.toLowerCase();
                        const matchesSearch =
                          s.full_name.toLowerCase().includes(searchLower) ||
                          (s.roll_no && s.roll_no.toString().toLowerCase().includes(searchLower));
                        if (statusFilter === "All students") return matchesSearch;
                        const mark = marksData[s.id];
                        if (!mark || (mark.theory_marks === "" && mark.practical_marks === "")) return false;
                        if (statusFilter === "Passed") return matchesSearch && mark.is_pass;
                        if (statusFilter === "Failed") return matchesSearch && !mark.is_pass;
                        return matchesSearch;
                      })
                      .map((student) => {
                        const mark = marksData[student.id];
                        if (!mark) return null;
                        const hasMarks = mark.theory_marks !== "" || mark.practical_marks !== "";
                        const maxMarks = parseFloat(selectedSubjectForMarks?.total_max_marks) || 100;
                        const totalMarks = parseFloat(mark.total_marks) || 0;
                        const percent = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

                        const getGradeInfo = (pct, isPass, hasData) => {
                          if (!hasData) return { grade: "—", cls: "grade-none" };
                          if (!isPass) return { grade: "F", cls: "grade-F" };
                          if (pct >= 80) return { grade: "A", cls: "grade-A" };
                          if (pct >= 60) return { grade: "B", cls: "grade-B" };
                          return { grade: "C", cls: "grade-C" };
                        };
                        const gradeInfo = getGradeInfo(percent, mark.is_pass, hasMarks);

                        return (
                          <tr key={student.id}>
                            <td>{student.roll_no}</td>
                            <td>
                              <div className="student-cell">
                                <div className="avatar">{student.full_name?.split(" ").map(w => w[0]).join("").toUpperCase()}</div>
                                <div>
                                  <div className="student-name">{student.full_name}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="marks-cell">
                                <input
                                  type="number"
                                  className={`marks-input ${hasMarks ? (percent < (selectedExamForMarks?.pass_mark_percentage || 40) ? 'fail' : 'pass-ok') : ''}`}
                                  min="0"
                                  value={mark.theory_marks}
                                  onChange={(e) =>
                                    handleMarkChange(student.id, "theory_marks", e.target.value)
                                  }
                                />
                                <span className="marks-max">/ {selectedSubjectForMarks.theory_max_marks || 0}</span>
                              </div>
                            </td>
                            <td>
                              <div className="marks-cell">
                                <input
                                  type="number"
                                  className={`marks-input ${hasMarks ? (percent < (selectedExamForMarks?.pass_mark_percentage || 40) ? 'fail' : 'pass-ok') : ''}`}
                                  min="0"
                                  value={mark.practical_marks}
                                  onChange={(e) =>
                                    handleMarkChange(student.id, "practical_marks", e.target.value)
                                  }
                                />
                                <span className="marks-max">/ {selectedSubjectForMarks.practical_max_marks || 0}</span>
                              </div>
                            </td>
                            <td className="pct-cell">{hasMarks ? mark.total_marks : "—"}</td>
                            <td className="pct-cell">{hasMarks ? `${Math.round(percent)}%` : "—"}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`grade-badge ${gradeInfo.cls}`}>{gradeInfo.grade}</span>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="marks-input"
                                value={mark.remarks}
                                placeholder="Remarks"
                                onChange={(e) =>
                                  handleMarkChange(student.id, "remarks", e.target.value)
                                }
                                style={{ width: '100%' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {hasMarks && (
                                <span className={`status-badge status-${mark.is_pass ? 'entered' : 'pending'}`}>
                                  {mark.is_pass ? "✓ Pass" : "✗ Fail"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {!selectedSubjectForMarks && (
              <div className="empty-state">
                <FileText width={52} height={52} />
                <h3>No data loaded yet</h3>
                <p>Select class, section, exam and subject above to view and enter student marks.</p>
              </div>
            )}
          </div>
        )}
      </div>



      <SettingsModal
        open={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title={selectedFormat ? "Edit Exam Format" : "New Exam Format"}
        subtitle="Fill in the exam details and assign the right section."
        width="max-w-2xl"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowFormatModal(false)}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFormat}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              Save
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
              Exam Type *
            </label>
            <input
              type="text"
              value={formatForm.exam_type}
              onChange={(e) =>
                setFormatForm({ ...formatForm, exam_type: e.target.value })
              }
              className="filter-select"
              style={{ width: '100%', appearance: 'none', display: 'block' }}
              placeholder="e.g., Midterm, Final"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
              Class
            </label>
            <select
              value={formatForm.class_id}
              onChange={(e) => handleClassChange(e.target.value)}
              className="filter-select"
              style={{ width: '100%' }}
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
              Section
            </label>
            <select
              value={formatForm.section_id || ""}
              onChange={(e) =>
                setFormatForm({ ...formatForm, section_id: e.target.value })
              }
              className="filter-select"
              style={{ width: '100%', opacity: !formatForm.class_id ? 0.5 : 1 }}
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
              <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                Select a class to load sections from the school database.
              </p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
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
              className="filter-select"
              style={{ width: '100%' }}
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
              Term
            </label>
            <input
              type="text"
              value={formatForm.term}
              onChange={(e) =>
                setFormatForm({ ...formatForm, term: e.target.value })
              }
              className="filter-select"
              style={{ width: '100%', appearance: 'none', display: 'block' }}
              placeholder="e.g., First Term"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
              Exam Date
            </label>
            <input
              type="date"
              value={formatDateInputValue(formatForm.exam_date)}
              onChange={(e) =>
                setFormatForm({ ...formatForm, exam_date: e.target.value })
              }
              className="filter-select"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
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
              className="filter-select"
              style={{ width: '100%' }}
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
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowSubjectModal(false)}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSubject}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              Save
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
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
              className="filter-select"
              style={{ width: '100%' }}
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
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
              className="filter-select"
              style={{ width: '100%', appearance: 'none', display: 'block' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
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
              className="filter-select"
              style={{ width: '100%', appearance: 'none', display: 'block' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>
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
              className="filter-select"
              style={{ width: '100%', appearance: 'none', display: 'block' }}
            />
          </div>
        </div>
      </SettingsModal>
    </div>
  );
};

export default ResultManagementModule;
