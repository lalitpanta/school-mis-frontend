import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LogOut,
  Megaphone,
  Pencil,
  Save,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getStudentDashboard, markStudentNoticeRead } from "../api/studentsApi";
import {
  createStudentLeaveRequest,
  updateCurrentStudent,
} from "../api/studentsApi";
import { useAuth } from "../context/AuthContext";
import config from "../config/config";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "academics", label: "Course & marks", icon: BookOpen },
  { id: "exams", label: "Exams", icon: CalendarDays },
  { id: "timetable", label: "Course schedule", icon: CalendarDays },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "assignments", label: "Assignments", icon: FileText },
  { id: "leave", label: "Leave requests", icon: CalendarDays },
  { id: "fees", label: "Fees", icon: CircleDollarSign },
  { id: "notices", label: "Notices", icon: Megaphone },
  { id: "reports", label: "Daily reports", icon: FileText },
  { id: "profile", label: "My profile", icon: UserRound },
];

const PROFILE_FIELDS = [
  ["phone_no", "Phone number", "tel"],
  ["current_address", "Current address", "text"],
  ["address", "Permanent address", "text"],
  ["home_district", "Home district", "text"],
  ["home_municipality", "Municipality", "text"],
  ["home_ward", "Ward", "text"],
  ["home_full_address", "Home address details", "text"],
  ["guardian_name", "Guardian name", "text"],
  ["guardian_email", "Guardian email", "email"],
  ["guardian_phone", "Guardian phone", "tel"],
];

function displayDate(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function SectionHeading({ eyebrow, title, trailing }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
      </div>
      {trailing}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="border-l-2 border-slate-700 py-4 pl-4 text-sm text-slate-400">
      {children}
    </div>
  );
}

const StudentPortalDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [leaveForm, setLeaveForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await getStudentDashboard();
      const data = response?.data?.data || null;
      setDashboard(data);
      if (data?.student) {
        setProfileForm(Object.fromEntries(
          PROFILE_FIELDS.map(([key]) => [key, data.student[key] || ""]),
        ));
      }
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          "Unable to load your student portal. Please sign in again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    try {
      await updateCurrentStudent(profileForm);
      await loadDashboard(true);
      setEditingProfile(false);
      setProfileMessage("Profile changes saved.");
    } catch (saveError) {
      toast.error(
        saveError?.response?.data?.message || "Unable to save your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const markRead = async (noticeId) => {
    try {
      await markStudentNoticeRead(noticeId);
      await loadDashboard(true);
    } catch (noticeError) {
      toast.error(
        noticeError?.response?.data?.message || "Unable to update this notice.",
      );
    }
  };

  const submitLeaveRequest = async (event) => {
    event.preventDefault();
    setSubmittingLeave(true);
    try {
      const response = await createStudentLeaveRequest(leaveForm);
      toast.success(response?.data?.message || "Leave request submitted.");
      setLeaveForm({ start_date: "", end_date: "", reason: "" });
      await loadDashboard(true);
    } catch (leaveError) {
      toast.error(
        leaveError?.response?.data?.message || "Unable to submit leave request.",
      );
    } finally {
      setSubmittingLeave(false);
    }
  };

  const signOut = () => {
    logout();
    navigate("/student/login", { replace: true });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
          Loading student portal
        </div>
      </main>
    );
  }

  if (error || !dashboard?.student) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-lg border-l-2 border-red-400 py-2 pl-4">
          <h1 className="text-lg font-semibold">Portal unavailable</h1>
          <p className="mt-2 text-sm text-slate-300">
            {error || "No student profile is linked to this account."}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => loadDashboard()}
              className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-950"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  const student = dashboard.student;
  const notices = dashboard.notices || [];
  const upcomingExam = (dashboard.exams || [])
    .filter((exam) => exam.exam_date && new Date(exam.exam_date) >= new Date())
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))[0];
  const unreadNotices = dashboard.summary?.unreadNoticeCount || 0;
  const currentTitle =
    NAV_ITEMS.find((item) => item.id === activeView)?.label || "Overview";

  const renderOverview = () => (
    <>
      <div className="mb-6 flex flex-col gap-4 border-l-2 border-emerald-400 bg-slate-900 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-300">
            {student.class_name || student.classroom_name || "Student account"}
            {student.section_name ? ` · ${student.section_name}` : ""}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Welcome, {(student.full_name || "Student").split(" ")[0]}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Admission {student.admission_no || "not recorded"}
            {student.roll_no ? ` · Roll ${student.roll_no}` : ""}
          </p>
        </div>
        <div className="min-w-52 border border-slate-700 bg-slate-950 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Next published exam
          </p>
          {upcomingExam ? (
            <>
              <p className="mt-1 font-semibold text-white">{upcomingExam.exam_type}</p>
              <p className="text-sm text-slate-400">{displayDate(upcomingExam.exam_date)}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-300">No upcoming exam published</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Latest published average",
            value: dashboard.summary?.resultAverage == null
              ? "—"
              : `${dashboard.summary.resultAverage}%`,
            detail: `${dashboard.summary?.publishedSubjectCount || 0} published subjects`,
          },
          {
            label: "Course resources",
            value: dashboard.courses?.length || 0,
            detail: "Visible to students",
          },
          {
            label: "Outstanding fees",
            value: formatMoney(dashboard.summary?.outstandingFees),
            detail: `${dashboard.summary?.unpaidFeeCount || 0} fee items`,
          },
          {
            label: "Unread notices",
            value: unreadNotices,
            detail: "School announcements",
          },
        ].map((stat) => (
          <div key={stat.label} className="border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2 truncate text-2xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHeading
            eyebrow="Academics"
            title="Latest results"
            trailing={<button onClick={() => setActiveView("academics")} className="text-sm text-emerald-300">View all</button>}
          />
          {(dashboard.results || []).length ? (
            <div className="divide-y divide-slate-800">
              {dashboard.results.slice(0, 5).map((result) => (
                <div key={result.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-white">{result.subject}</p>
                    <p className="text-xs text-slate-500">Updated {displayDate(result.updated_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{result.final_marks ?? "—"}</p>
                    <p className="text-xs text-emerald-300">{result.grade || "Published"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No results have been published to your profile yet.</EmptyState>
          )}
        </section>
        <section>
          <SectionHeading
            eyebrow="School updates"
            title="Latest notices"
            trailing={<button onClick={() => setActiveView("notices")} className="text-sm text-emerald-300">View all</button>}
          />
          {notices.length ? (
            <div className="divide-y divide-slate-800">
              {notices.slice(0, 4).map((notice) => (
                <article key={notice.id} className="py-3">
                  <p className="font-medium text-white">{notice.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">{notice.content}</p>
                  <p className="mt-2 text-xs text-slate-500">{notice.category || "Notice"} · {displayDate(notice.createdAt)}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState>No published notices right now.</EmptyState>
          )}
        </section>
      </div>

      <section className="mt-8">
        <SectionHeading eyebrow="Your learning" title="Courses available in the portal" />
        {dashboard.courses?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.courses.slice(0, 6).map((course) => (
              <article key={course.id} className="border border-slate-800 p-4">
                <p className="text-xs text-emerald-300">{course.course_code}</p>
                <h3 className="mt-1 font-semibold text-white">{course.course_name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{course.description || course.subject_type || "Course resource"}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>No courses are currently published to your portal.</EmptyState>
        )}
      </section>
    </>
  );

  const renderAcademics = () => (
    <>
      <SectionHeading eyebrow="Learning" title="Courses and published marks" />
      <section className="mb-8">
        <h3 className="mb-3 font-semibold text-white">Published results</h3>
        {(dashboard.results || []).length ? (
          <div className="overflow-x-auto border border-slate-800">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Term 1</th><th className="px-4 py-3">Term 2</th><th className="px-4 py-3">Final</th><th className="px-4 py-3">Grade</th></tr></thead>
              <tbody className="divide-y divide-slate-800">{dashboard.results.map((result) => <tr key={result.id}><td className="px-4 py-3 font-medium text-white">{result.subject}</td><td className="px-4 py-3 text-slate-300">{result.first_term_marks ?? "—"}</td><td className="px-4 py-3 text-slate-300">{result.second_term_marks ?? "—"}</td><td className="px-4 py-3 text-white">{result.final_marks ?? "—"}</td><td className="px-4 py-3 text-emerald-300">{result.grade || "—"}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState>Published marks will appear here when released by your school.</EmptyState>}
      </section>
      <h3 className="mb-3 font-semibold text-white">Student portal courses</h3>
      {dashboard.courses?.length ? <div className="grid gap-3 md:grid-cols-2">{dashboard.courses.map((course) => <article key={course.id} className="border border-slate-800 bg-slate-900 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-emerald-300">{course.course_code} · {course.subject_type}</p><h4 className="mt-1 font-semibold text-white">{course.course_name}</h4></div><span className="text-xs text-slate-500">{course.periods_per_week || 0} periods/week</span></div>{course.description && <p className="mt-3 text-sm text-slate-400">{course.description}</p>}{course.lms_digital_resource_link && <a className="mt-3 inline-block text-sm text-emerald-300 underline" href={course.lms_digital_resource_link} target="_blank" rel="noreferrer">Open learning resource</a>}</article>)}</div> : <EmptyState>No courses are currently visible in the student portal.</EmptyState>}
    </>
  );

  const renderExams = () => (
    <>
      <SectionHeading eyebrow="Assessment" title="Exam schedule and marks" />
      {(dashboard.exams || []).length ? <div className="space-y-6">{Object.values((dashboard.exams || []).reduce((groups, exam) => { const key = exam.id; if (!groups[key]) groups[key] = { ...exam, subjects: [] }; groups[key].subjects.push(exam); return groups; }, {})).map((exam) => <section key={exam.id} className="border-t-2 border-emerald-400 pt-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold text-white">{exam.exam_type}{exam.term ? ` · ${exam.term}` : ""}</h3><p className="text-sm text-slate-400">{displayDate(exam.exam_date)}</p></div><div className="mt-3 divide-y divide-slate-800">{exam.subjects.map((subject, index) => <div key={`${exam.id}-${subject.subject_name}-${index}`} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-slate-300">{subject.subject_name}</span><span className="text-white">{subject.total_marks ?? "Not marked"}{subject.total_max_marks ? ` / ${subject.total_max_marks}` : ""}</span></div>)}</div></section>)}</div> : <EmptyState>No published exam schedule is available yet.</EmptyState>}
    </>
  );

  const renderFees = () => (
    <>
      <SectionHeading eyebrow="Accounts" title="My fee records" />
      <div className="mb-5 flex flex-wrap gap-8 border-y border-slate-800 py-4">
        <div><p className="text-xs uppercase text-slate-500">Outstanding</p><p className="mt-1 text-xl font-semibold text-white">{formatMoney(dashboard.summary?.outstandingFees)}</p></div>
        <div><p className="text-xs uppercase text-slate-500">Items with balance</p><p className="mt-1 text-xl font-semibold text-white">{dashboard.summary?.unpaidFeeCount || 0}</p></div>
      </div>
      {(dashboard.fees || []).length ? <div className="overflow-x-auto border border-slate-800"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-900 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Due date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-800">{dashboard.fees.map((fee) => <tr key={`fee-${fee.id}`}><td className="px-4 py-3 text-white">{fee.name || "Fee"}</td><td className="px-4 py-3 text-slate-400">{displayDate(fee.due_date)}</td><td className="px-4 py-3 text-slate-300">{formatMoney(fee.amount)}</td><td className="px-4 py-3 text-slate-300">{formatMoney(fee.paid_amount)}</td><td className="px-4 py-3 text-white">{formatMoney(fee.balance)}</td><td className="px-4 py-3"><span className={Number(fee.balance) > 0 ? "text-amber-300" : "text-emerald-300"}>{fee.status}</span></td></tr>)}</tbody></table></div> : <EmptyState>No fee ledger records are linked to your account.</EmptyState>}
      {(dashboard.invoices || []).length > 0 && <section className="mt-8"><h3 className="mb-3 font-semibold text-white">Invoices and receipts</h3><div className="divide-y divide-slate-800">{dashboard.invoices.map((invoice) => <div key={`invoice-${invoice.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-white">{invoice.invoice_number}</p><p className="text-xs text-slate-500">Issued {displayDate(invoice.issue_date)} · Due {displayDate(invoice.due_date)}</p></div><div className="text-right"><p className="font-semibold text-white">{formatMoney(invoice.total)}</p><p className="text-xs text-slate-400">{invoice.status}</p></div></div>)}</div></section>}
      <p className="mt-5 text-xs text-slate-500">Online payment is not enabled in the current school payment configuration. Contact the school office to pay.</p>
    </>
  );

  const renderNotices = () => (
    <>
      <SectionHeading eyebrow="School" title="Notices and announcements" />
      {notices.length ? <div className="divide-y divide-slate-800">{notices.map((notice) => { const read = Array.isArray(notice.read_by) && notice.read_by.includes(String(user?.id)); return <article key={notice.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-emerald-300">{notice.category || "Notice"} · {displayDate(notice.createdAt)}</p><h3 className="mt-1 text-lg font-semibold text-white">{notice.title}</h3></div>{!read && <button type="button" onClick={() => markRead(notice.id)} className="text-sm text-emerald-300 hover:text-emerald-200">Mark read</button>}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{notice.content}</p></article>; })}</div> : <EmptyState>No published notices for students.</EmptyState>}
    </>
  );

  const renderReports = () => (
    <>
      <SectionHeading eyebrow="School updates" title="Daily reports" />
      {(dashboard.reports || []).length ? <div className="divide-y divide-slate-800">{dashboard.reports.map((report) => <article key={report.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-medium text-white">Daily report · {displayDate(report.created_at)}</p><p className="mt-1 text-sm text-slate-400">{report.report?.summary || report.report?.title || "Report from your school"}</p></div>{report.pdf_url && <a href={report.pdf_url.startsWith("http") ? report.pdf_url : `${config.API_BASE_URL}${report.pdf_url}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-300 underline">Open report</a>}</article>)}</div> : <EmptyState>No daily reports have been shared with your account.</EmptyState>}
    </>
  );

  const renderLeave = () => (
    <>
      <SectionHeading eyebrow="Student services" title="Leave requests" />
      <form onSubmit={submitLeaveRequest} className="max-w-3xl border-b border-slate-800 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Start date<input required type="date" value={leaveForm.start_date} onChange={(event) => setLeaveForm((form) => ({ ...form, start_date: event.target.value }))} className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">End date<input required type="date" min={leaveForm.start_date || undefined} value={leaveForm.end_date} onChange={(event) => setLeaveForm((form) => ({ ...form, end_date: event.target.value }))} className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
        </div>
        <label className="mt-4 block text-sm text-slate-300">Reason<textarea required maxLength={1000} rows={3} value={leaveForm.reason} onChange={(event) => setLeaveForm((form) => ({ ...form, reason: event.target.value }))} className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
        <button disabled={submittingLeave} className="mt-4 rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60">{submittingLeave ? "Submitting..." : "Submit leave request"}</button>
      </form>
      <h3 className="mb-2 mt-6 font-semibold text-white">Request history</h3>
      {(dashboard.leaveRequests || []).length ? <div className="divide-y divide-slate-800">{dashboard.leaveRequests.map((request) => <article key={request.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div><p className="font-medium text-white">{displayDate(request.start_date)} – {displayDate(request.end_date)}</p><p className="mt-1 text-sm text-slate-400">{request.reason}</p>{request.admin_reply && <p className="mt-2 text-sm text-slate-300">School response: {request.admin_reply}</p>}</div><span className={`text-sm capitalize ${request.status === "approved" ? "text-emerald-300" : request.status === "rejected" ? "text-red-300" : "text-amber-300"}`}>{request.status}</span></article>)}</div> : <EmptyState>You have not submitted any leave requests.</EmptyState>}
    </>
  );

  const renderTimetable = () => {
    const scheduleCourses = dashboard.timetable?.records || [];
    return (
      <>
        <SectionHeading eyebrow="Learning" title="Course schedule" />
        {scheduleCourses.length ? <div className="divide-y divide-slate-800">{scheduleCourses.map((course) => {
          const days = Array.isArray(course.scheduled_days)
            ? course.scheduled_days.map((day) => typeof day === "string" ? day : day.day || day.day_name || JSON.stringify(day)).join(", ")
            : String(course.scheduled_days || "");
          return <article key={course.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4"><div><p className="font-semibold text-white">{course.course_name}</p><p className="text-sm text-slate-400">{course.course_code} · {course.periods_per_week || 0} periods/week</p></div><p className="text-sm text-emerald-300">{days || "Days not specified"}</p></article>;
        })}</div> : <EmptyState>Your school has not published course-day schedules yet. A period-by-period timetable is not currently stored in the MIS.</EmptyState>}
      </>
    );
  };

  const renderAvailability = (title, message) => (
    <>
      <SectionHeading eyebrow="Student tools" title={title} />
      <EmptyState>{message}</EmptyState>
    </>
  );

  const renderProfile = () => (
    <>
      <SectionHeading
        eyebrow="Student record"
        title="My profile"
        trailing={!editingProfile ? <button type="button" onClick={() => setEditingProfile(true)} className="text-sm text-emerald-300">Edit contact details</button> : null}
      />
      {profileMessage && <p role="status" className="mb-4 text-sm text-emerald-300">{profileMessage}</p>}
      {editingProfile ? (
        <form onSubmit={saveProfile} className="max-w-3xl">
          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {PROFILE_FIELDS.map(([key, label, type]) => (
              <label key={key} className="text-sm text-slate-300">{label}<input type={type} value={profileForm[key] || ""} onChange={(event) => setProfileForm((form) => ({ ...form, [key]: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400" /></label>
            ))}
          </div>
          <div className="mt-5 flex gap-3"><button disabled={savingProfile} className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60">{savingProfile ? "Saving..." : "Save profile"}</button><button type="button" onClick={() => setEditingProfile(false)} className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300"><X size={15} /> Cancel</button></div>
        </form>
      ) : (
        <div className="grid gap-x-8 md:grid-cols-2">
          {[
            ["Student", student.full_name],
            ["Admission no.", student.admission_no],
            ["Roll no.", student.roll_no],
            ["Class", student.class_name || student.classroom_name],
            ["Section", student.section_name],
            ["Login email", student.student_mail || student.school_email],
            ...PROFILE_FIELDS.map(([key, label]) => [label, student[key]]),
          ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-800 py-3 text-sm"><span className="text-slate-500">{label}</span><span className="text-right text-slate-200">{value || "Not provided"}</span></div>)}
        </div>
      )}
    </>
  );

  const viewContent = {
    overview: renderOverview,
    academics: renderAcademics,
    exams: renderExams,
    attendance: () => renderAvailability(
      "Attendance",
      "Student attendance is not currently stored in the school attendance database. Your school can enable student attendance records to show history here.",
    ),
    assignments: () => renderAvailability(
      "Assignments",
      "There is no student assignment/submission data source configured for this school yet.",
    ),
    timetable: renderTimetable,
    leave: renderLeave,
    fees: renderFees,
    notices: renderNotices,
    reports: renderReports,
    profile: renderProfile,
  };

  const activeContent = viewContent[activeView] || renderOverview;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900 px-3 py-5 lg:flex">
          <div className="flex items-center gap-3 border-b border-slate-800 px-2 pb-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400 text-emerald-950"><GraduationCap size={23} /></span>
            <div><p className="text-sm font-semibold text-white">SchoolMIS</p><p className="text-xs text-slate-500">Student portal</p></div>
          </div>
          <nav className="mt-5 flex-1 space-y-1" aria-label="Student portal">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveView(id)} aria-current={activeView === id ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium ${activeView === id ? "border-l-2 border-emerald-400 bg-emerald-400/10 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <Icon size={17} /> {label}
                {id === "notices" && unreadNotices > 0 && <span className="ml-auto rounded bg-emerald-400 px-1.5 text-xs font-bold text-emerald-950">{unreadNotices}</span>}
              </button>
            ))}
          </nav>
          <button type="button" onClick={signOut} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"><LogOut size={17} /> Sign out</button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs uppercase tracking-widest text-emerald-300">Student portal</p><h1 className="mt-0.5 text-lg font-semibold">{currentTitle}</h1></div>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-slate-400 sm:inline">{student.full_name}</span>
                <button type="button" onClick={() => loadDashboard(true)} disabled={refreshing} aria-label="Refresh dashboard" className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">{refreshing ? "Refreshing" : "Refresh"}</button>
                <button type="button" onClick={signOut} aria-label="Sign out" className="rounded-md border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 lg:hidden"><LogOut size={16} /></button>
              </div>
            </div>
            <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 lg:hidden" aria-label="Student portal sections">
              {NAV_ITEMS.map(({ id, label }) => <button key={id} type="button" onClick={() => setActiveView(id)} className={`shrink-0 rounded-md px-3 py-2 text-xs font-medium ${activeView === id ? "bg-emerald-400 text-emerald-950" : "bg-slate-900 text-slate-400"}`}>{label}</button>)}
            </nav>
          </header>

          <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {error && <div role="alert" className="mb-5 border-l-2 border-red-400 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            {profileMessage && activeView !== "profile" && <p role="status" className="mb-4 text-sm text-emerald-300">{profileMessage}</p>}
            {activeContent()}
          </section>
        </div>
      </div>
    </main>
  );
};

export default StudentPortalDashboardPage;
