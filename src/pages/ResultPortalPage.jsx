import { useMemo, useState } from "react";
import axios from "axios";
import { Download, Search, UserCircle2 } from "lucide-react";
import config from "../config/config";

const ResultPortalPage = () => {
  const [rollNumber, setRollNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setResultData(null);

    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/v1/results/public`,
        {
          params: {
            rollNumber,
            dateOfBirth,
          },
        },
      );

      if (response.data?.data?.student) {
        setResultData(response.data.data);
      } else {
        setError("No published result found for the provided details.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load results right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!resultData?.student) return;

    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) {
      setError("Please allow pop-ups to download the result as PDF.");
      return;
    }

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>Result - ${resultData.student.full_name}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background: #f8fafc; }
            .muted { color: #64748b; }
          </style>
        </head>
        <body>
          <h2>Student Result</h2>
          <p><strong>Name:</strong> ${resultData.student.full_name}</p>
          <p><strong>Roll No:</strong> ${resultData.student.roll_no}</p>
          <p className="muted">Accessed through the public result portal.</p>
          ${resultData.exams
            .map(
              (exam) => `
            <h3>${exam.exam_type || "Exam"} ${exam.term || ""}</h3>
            <table>
              <thead>
                <tr><th>Subject</th><th>Theory</th><th>Practical</th><th>Total</th><th>Status</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                ${exam.subjects
                  .map(
                    (subject) => `
                  <tr>
                    <td>${subject.subject_name || "-"}</td>
                    <td>${subject.theory_marks ?? "-"}</td>
                    <td>${subject.practical_marks ?? "-"}</td>
                    <td>${subject.total_marks ?? "-"}</td>
                    <td>${subject.is_pass ? "Pass" : "Fail"}</td>
                    <td>${subject.remarks || "-"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          `,
            )
            .join("")}
          <script>window.print(); window.close();</script>
        </body>
      </html>`);
    printWindow.document.close();
  };

  const summary = useMemo(() => {
    if (!resultData?.exams?.length) return [];
    return resultData.exams.flatMap((exam) => exam.subjects);
  }, [resultData]);

  return (
    <div
      className="min-h-screen px-4 py-10 text-[var(--text-1)]"
      style={{ background: "var(--bg-main)" }}
    >
      <div className="mis-card mx-auto max-w-6xl p-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-indigo-400">
              Result Portal
            </p>
            <h1 className="mis-page-title">Public Result Distribution</h1>
            <p className="mt-2 max-w-2xl text-[var(--text-2)]">
              Admins publish results once. Students and parents can open the
              same public link, enter the roll number and date of birth, and
              view or download the result without logging in.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            No login required
          </div>
        </div>

        <form
          onSubmit={handleLookup}
          className="grid gap-4 rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-surface)] p-5 md:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-1)]">
              Roll number
            </label>
            <input
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="101"
              className="mis-input"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-1)]">
              Date of birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mis-input"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            <Search size={16} /> {loading ? "Checking..." : "View Result"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {resultData?.student && (
          <div className="mt-6 rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-300">
                  <UserCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {resultData.student.full_name}
                  </h2>
                  <p className="text-sm text-[var(--text-2)]">
                    Roll No: {resultData.student.roll_no}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--text-1)] transition hover:border-[var(--accent)]"
              >
                <Download size={16} /> Download PDF
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                  Total Subjects
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--text-1)]">
                  {summary.length}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                  Passed
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-400">
                  {summary.filter((s) => s.is_pass).length}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-2)]">
                  Failed
                </p>
                <p className="mt-2 text-2xl font-black text-rose-400">
                  {summary.filter((s) => !s.is_pass).length}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {resultData.exams.map((exam) => (
                <div
                  key={exam.exam_format_id}
                  className="overflow-hidden rounded-2xl border border-slate-800"
                >
                  <div className="bg-[var(--bg-hover)] px-4 py-3">
                    <h3 className="text-lg font-semibold">
                      {exam.exam_type || "Exam"}
                    </h3>
                    <p className="text-sm text-[var(--text-2)]">
                      {exam.term || ""} • {exam.class_name || "-"} •{" "}
                      {exam.section_name || "-"}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-sm">
                      <thead className="bg-[var(--bg-hover)] text-left text-[var(--text-2)]">
                        <tr>
                          <th className="px-4 py-3">Subject</th>
                          <th className="px-4 py-3">Theory</th>
                          <th className="px-4 py-3">Practical</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--text-1)]">
                        {exam.subjects.map((subject) => (
                          <tr
                            key={
                              subject.exam_subject_id || subject.subject_name
                            }
                          >
                            <td className="px-4 py-3">
                              {subject.subject_name || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {subject.theory_marks ?? "-"}
                            </td>
                            <td className="px-4 py-3">
                              {subject.practical_marks ?? "-"}
                            </td>
                            <td className="px-4 py-3">
                              {subject.total_marks ?? "-"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${subject.is_pass ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
                              >
                                {subject.is_pass ? "Pass" : "Fail"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {subject.remarks || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPortalPage;
