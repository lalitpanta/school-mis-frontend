import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpenCheck, Eye, Save, Send } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

const responseData = (response) => response?.data?.data ?? [];
const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const TeacherResults = () => {
  const [exams, setExams] = useState([]);
  const [detail, setDetail] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [marksByStudent, setMarksByStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadExams = useCallback(async () => {
    setError("");
    try {
      const response = await axiosInstance.get("/v1/teacher-portal/exams");
      setExams(responseData(response));
    } catch (loadError) {
      setError(errorMessage(loadError, "Unable to load shared exam formats."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const selectedSubject = useMemo(
    () =>
      detail?.subjects.find(
        (subject) => String(subject.id) === String(selectedSubjectId),
      ) || null,
    [detail, selectedSubjectId],
  );
  const subjectStudents = useMemo(() => {
    const students = detail?.students || [];
    const sectionIds =
      selectedSubject?.section_ids?.length > 0
        ? selectedSubject.section_ids.map(String)
        : selectedSubject?.section_id
          ? [String(selectedSubject.section_id)]
          : detail?.exam?.section_id
            ? [String(detail.exam.section_id)]
            : [];
    return sectionIds.length
      ? students.filter(
          (student) => sectionIds.includes(String(student.section_id)),
        )
      : students;
  }, [detail, selectedSubject]);

  useEffect(() => {
    if (!detail || !selectedSubject) {
      setMarksByStudent({});
      return;
    }
    const existingByStudent = new Map(
      detail.marks
        .filter(
          (mark) =>
            String(mark.exam_subject_id) === String(selectedSubject.id),
        )
        .map((mark) => [String(mark.student_id), mark]),
    );
    setMarksByStudent(
      Object.fromEntries(
        detail.students.map((student) => {
          const existing = existingByStudent.get(String(student.id));
          return [
            student.id,
            {
              theory_marks: existing?.theory_marks ?? "",
              practical_marks: existing?.practical_marks ?? "",
              remarks: existing?.remarks ?? "",
            },
          ];
        }),
      ),
    );
  }, [detail, selectedSubject]);

  const openExam = async (exam) => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/v1/teacher-portal/exams/${exam.id}`,
      );
      const nextDetail = responseData(response);
      setDetail(nextDetail);
      setSelectedSubjectId(String(nextDetail.subjects?.[0]?.id || ""));
    } catch (loadError) {
      setError(errorMessage(loadError, "Unable to open this exam format."));
    } finally {
      setLoading(false);
    }
  };

  const updateMark = (studentId, field, value) => {
    setMarksByStudent((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [field]: value,
      },
    }));
  };

  const saveCurrentSubjectMarks = async () => {
    if (!detail || !selectedSubject) return;
    await axiosInstance.post(
      `/v1/teacher-portal/exams/${detail.exam.id}/marks`,
      {
        marks: subjectStudents.map((student) => ({
          student_id: student.id,
          exam_subject_id: selectedSubject.id,
          ...marksByStudent[student.id],
        })),
      },
    );
  };

  const saveMarks = async () => {
    if (!detail || !selectedSubject) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      await saveCurrentSubjectMarks();
      const response = await axiosInstance.get(
        `/v1/teacher-portal/exams/${detail.exam.id}`,
      );
      setDetail(responseData(response));
      setNotice("Marks saved successfully.");
      await loadExams();
    } catch (saveError) {
      setError(errorMessage(saveError, "Unable to save marks."));
    } finally {
      setSaving(false);
    }
  };

  const submitMarks = async () => {
    if (!detail) return;
    const confirmed = window.confirm(
      "Submit these marks? Submitted marks are locked and can no longer be edited.",
    );
    if (!confirmed) return;

    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await saveCurrentSubjectMarks();
      await axiosInstance.post(
        `/v1/teacher-portal/exams/${detail.exam.id}/submit`,
      );
      const refreshed = await axiosInstance.get(
        `/v1/teacher-portal/exams/${detail.exam.id}`,
      );
      setDetail(responseData(refreshed));
      setNotice("Marks submitted. This exam is now locked for your account.");
      await loadExams();
    } catch (submitError) {
      setError(errorMessage(submitError, "Unable to submit marks."));
    } finally {
      setSubmitting(false);
    }
  };

  const muted = "text-slate-400";
  const submitted = detail?.exam.status === "submitted";

  if (loading && !detail) {
    return <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">Loading shared exam formats...</section>;
  }

  return (
    <section className="space-y-5">
      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-lg p-3 text-sm ${error ? "bg-rose-400/10 text-rose-200" : "bg-teal-400/10 text-teal-100"}`}
        >
          {error || notice}
        </p>
      )}

      {!detail ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div>
            <h2 className="text-xl font-semibold">Shared exam formats</h2>
            <p className={`mt-1 text-sm ${muted}`}>
              Only exams with a course currently assigned to your teacher account are listed.
            </p>
          </div>
          {exams.length ? (
            <div className="mt-4 divide-y divide-slate-800">
              {exams.map((exam) => (
                <article
                  key={exam.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div>
                    <h3 className="font-semibold">
                      {exam.exam_type}
                      {exam.term ? ` · ${exam.term}` : ""}
                    </h3>
                    <p className={`mt-1 text-sm ${muted}`}>
                      {exam.class_name || "Class"}
                      {exam.section_name ? ` · ${exam.section_name}` : ""}
                      {exam.exam_date
                        ? ` · ${new Date(exam.exam_date).toLocaleDateString()}`
                        : ""}
                    </p>
                    <p className={`mt-1 text-xs ${muted}`}>
                      {exam.course_count} assigned course(s) · {exam.marks_entered} mark entries saved
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${exam.status === "submitted" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}
                    >
                      {exam.status === "submitted" ? "Submitted" : "In progress"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openExam(exam)}
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-3 py-2 text-sm font-semibold text-slate-950"
                    >
                      <Eye size={16} /> View format
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={`mt-5 text-sm ${muted}`}>
              No exam formats have been shared with your assigned courses yet.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    setNotice("");
                    setError("");
                  }}
                  className="mb-3 inline-flex items-center gap-2 text-sm text-teal-300 hover:text-teal-200"
                >
                  <ArrowLeft size={16} /> All shared exams
                </button>
                <h2 className="text-xl font-semibold">
                  {detail.exam.exam_type}
                  {detail.exam.term ? ` · ${detail.exam.term}` : ""}
                </h2>
                <p className={`mt-1 text-sm ${muted}`}>
                  {detail.exam.class_name || "Class"}
                  {detail.exam.section_name ? ` · ${detail.exam.section_name}` : ""}
                  {detail.exam.exam_date
                    ? ` · ${new Date(detail.exam.exam_date).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${submitted ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}
              >
                {submitted ? "Submitted" : "In progress"}
              </span>
            </div>

            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <BookOpenCheck size={17} className="text-teal-300" />
                Courses and assigned marks
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {detail.subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(String(subject.id))}
                    className={`rounded-lg border p-3 text-left ${String(subject.id) === String(selectedSubjectId) ? "border-teal-400/60 bg-teal-400/10" : "border-slate-800 bg-slate-950/60"}`}
                  >
                    <span className="block font-medium">{subject.course_name || subject.subject_name}</span>
                    <span className={`mt-1 block text-xs ${muted}`}>
                      {subject.course_code || subject.subject_name}
                      {subject.section_name ? ` · ${subject.section_name}` : ""}
                      {` · Theory ${subject.theory_max_marks} · Practical ${subject.practical_max_marks} · Total ${subject.total_max_marks}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedSubject && (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
                <div>
                  <h3 className="font-semibold">
                    Enter marks · {selectedSubject.course_name || selectedSubject.subject_name}
                  </h3>
                  <p className={`mt-1 text-xs ${muted}`}>
                    {subjectStudents.length} students in {selectedSubject.section_name || detail.exam.section_name || detail.exam.class_name || "this class"}
                  </p>
                </div>
                {!submitted && (
                  <button
                    type="button"
                    onClick={saveMarks}
                    disabled={saving || submitting || !subjectStudents.length}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-teal-400/60 disabled:opacity-50"
                  >
                    <Save size={16} /> {saving ? "Saving..." : "Save marks"}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="px-3 py-3">Roll</th>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Theory / {selectedSubject.theory_max_marks}</th>
                      <th className="px-3 py-3">Practical / {selectedSubject.practical_max_marks}</th>
                      <th className="px-3 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectStudents.map((student) => (
                      <tr key={student.id} className="border-t border-slate-800">
                        <td className="px-3 py-3">{student.roll_no ?? "-"}</td>
                        <td className="px-3 py-3">{student.full_name}</td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            max={selectedSubject.theory_max_marks}
                            step="0.01"
                            disabled={submitted}
                            value={marksByStudent[student.id]?.theory_marks ?? ""}
                            onChange={(event) => updateMark(student.id, "theory_marks", event.target.value)}
                            aria-label={`Theory marks for ${student.full_name}`}
                            className="w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            max={selectedSubject.practical_max_marks}
                            step="0.01"
                            disabled={submitted}
                            value={marksByStudent[student.id]?.practical_marks ?? ""}
                            onChange={(event) => updateMark(student.id, "practical_marks", event.target.value)}
                            aria-label={`Practical marks for ${student.full_name}`}
                            className="w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            maxLength={500}
                            disabled={submitted}
                            value={marksByStudent[student.id]?.remarks ?? ""}
                            onChange={(event) => updateMark(student.id, "remarks", event.target.value)}
                            aria-label={`Remarks for ${student.full_name}`}
                            className="w-40 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    ))}
                    {!subjectStudents.length && (
                      <tr>
                        <td colSpan={5} className={`px-3 py-8 text-center ${muted}`}>
                          No active students are enrolled in this exam section.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!submitted && (
                <div className="flex justify-end border-t border-slate-800 p-4">
                  <button
                    type="button"
                    onClick={submitMarks}
                    disabled={saving || submitting || !subjectStudents.length}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    <Send size={16} /> {submitting ? "Submitting..." : "Submit marks"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TeacherResults;
