import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const navItems = [
  ["Overview", "overview", LayoutDashboard],
  ["My classes", "classes", Users],
  ["Courses", "courses", BookOpen],
  ["Results", "results", GraduationCap],
  ["Calendar", "calendar", CalendarDays],
  ["Attendance", "attendance", Clock3],
  ["Leave", "leave", Send],
  ["My profile", "profile", UserRound],
];

const emptyOverview = {
  profile: null,
  classes: [],
  courses: [],
  exams: [],
  attendance: [],
  leaveRequests: [],
  calendarMonths: [],
  calendarDays: [],
};

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;
const prettyDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleDateString();
};

const TeacherPortalExperience = () => {
  const [overview, setOverview] = useState(emptyOverview);
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedMonthId, setSelectedMonthId] = useState("");
  const [leaveForm, setLeaveForm] = useState({
    leave_type: "Personal",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadOverview = async () => {
    setError("");
    try {
      const response = await axiosInstance.get("/v1/teacher-portal/overview");
      const data = unwrap(response) || emptyOverview;
      setOverview({ ...emptyOverview, ...data });
      setSelectedMonthId((current) => current || data.calendarMonths?.[0]?.id || "");
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Unable to load teacher workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const openSection = (section) => {
    setActive(section);
    setMobileNavOpen(false);
    setNotice("");
    setSelectedClass(null);
  };

  const openClass = async (classroom) => {
    if (selectedClass?.id === classroom.id) {
      setSelectedClass(null);
      return;
    }
    setSelectedClass(classroom);
    setStudentsLoading(true);
    setClassStudents([]);
    try {
      const response = await axiosInstance.get(
        `/v1/teacher-portal/classes/${classroom.id}/students${classroom.section_id ? `?sectionId=${classroom.section_id}` : ""}`,
      );
      setClassStudents(unwrap(response) || []);
    } catch (loadError) {
      setNotice(loadError?.response?.data?.message || "Unable to load this class roster.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const submitLeave = async (event) => {
    event.preventDefault();
    setLeaveSubmitting(true);
    setNotice("");
    try {
      await axiosInstance.post("/v1/teacher-portal/leave", leaveForm);
      setLeaveForm({ leave_type: "Personal", start_date: "", end_date: "", reason: "" });
      setNotice("Leave request submitted.");
      await loadOverview();
    } catch (requestError) {
      setNotice(requestError?.response?.data?.message || "Unable to submit leave request.");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const signOut = () => {
    logout();
    navigate("/teacher/login", { replace: true });
  };

  const profile = overview.profile;
  const panel = "rounded-xl border border-slate-800 bg-slate-900 p-5";
  const subdued = "text-slate-400";
  const currentMonth = overview.calendarMonths.find((month) => month.id === selectedMonthId) || overview.calendarMonths[0];
  const monthDays = overview.calendarDays.filter((day) => day.month_id === currentMonth?.id);
  const weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const calendarOffset = weekdayOrder.indexOf(monthDays[0]?.day_of_week);

  const renderOverview = () => (
    <div className="space-y-5">
      <section className={`${panel} flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-teal-400`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Teacher workspace</p>
          <h2 className="mt-2 text-2xl font-semibold">Good day, {(profile?.full_name || user?.name || "Teacher").split(" ")[0]}</h2>
          <p className={`mt-1 text-sm ${subdued}`}>{profile?.designation || "Teaching staff"}{profile?.employee_id ? ` · ${profile.employee_id}` : ""}</p>
        </div>
        <button type="button" onClick={() => openSection("classes")} className="rounded-lg bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Open my classes</button>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Assigned classes", overview.classes.length, Users],
          ["Courses", overview.courses.length, BookOpen],
          ["Exams", overview.exams.length, GraduationCap],
          ["Leave requests", overview.leaveRequests.length, CalendarDays],
        ].map(([label, value, Icon]) => (
          <section key={label} className={panel}>
            <div className="flex items-center justify-between text-sm text-slate-400"><span>{label}</span><Icon size={17} /></div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
          </section>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className={panel}>
          <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Teaching assignments</h3><button type="button" onClick={() => openSection("classes")} className="text-sm text-teal-300">View classes</button></div>
          {overview.classes.length ? <div className="mt-3 divide-y divide-slate-800">{overview.classes.slice(0, 5).map((item) => <div key={`${item.id}-${item.section_id || "all"}`} className="flex justify-between gap-3 py-3 text-sm"><span>{item.name}{item.section_name ? ` · ${item.section_name}` : ""}</span><span className={subdued}>{item.student_count} students</span></div>)}</div> : <p className={`mt-4 text-sm ${subdued}`}>No classes are assigned to this teacher account.</p>}
        </section>
        <section className={panel}>
          <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Upcoming exams</h3><button type="button" onClick={() => openSection("results")} className="text-sm text-teal-300">View results</button></div>
          {overview.exams.length ? <div className="mt-3 divide-y divide-slate-800">{overview.exams.slice(0, 5).map((exam) => <div key={exam.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{exam.exam_type}{exam.term ? ` · ${exam.term}` : ""}</span><span className={subdued}>{prettyDate(exam.exam_date)}</span></div>)}</div> : <p className={`mt-4 text-sm ${subdued}`}>No exams are configured for assigned classes.</p>}
        </section>
      </div>
    </div>
  );

  const renderClasses = () => (
    <section className={panel}>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">My classes</h2><p className={`mt-1 text-sm ${subdued}`}>Only classes assigned to this teacher account are shown.</p></div><span className="text-sm text-teal-300">{overview.classes.length} assignments</span></div>
      {notice && <p role="status" className="mt-4 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-100">{notice}</p>}
      {overview.classes.length ? <div className="mt-4 divide-y divide-slate-800">{overview.classes.map((item) => <article key={`${item.id}-${item.section_id || "all"}`} className="py-4">
        <button type="button" onClick={() => openClass(item)} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
          <span><span className="block font-semibold">{item.name}{item.section_name ? ` · ${item.section_name}` : ""}</span><span className={`mt-1 block text-sm ${subdued}`}>{item.student_count} active students</span></span>
          <span className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-teal-200">{selectedClass?.id === item.id ? "Hide roster" : "View roster"}</span>
        </button>
        {selectedClass?.id === item.id && <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
          {studentsLoading ? <p className={`p-4 text-sm ${subdued}`}>Loading roster...</p> : classStudents.length ? <table className="w-full min-w-135 text-left text-sm"><thead className="bg-slate-950 text-slate-400"><tr><th className="px-3 py-2">Roll</th><th className="px-3 py-2">Student</th><th className="px-3 py-2">Section</th><th className="px-3 py-2">Email</th></tr></thead><tbody>{classStudents.map((student) => <tr key={student.id} className="border-t border-slate-800"><td className="px-3 py-2">{student.roll_no ?? "-"}</td><td className="px-3 py-2">{student.full_name}</td><td className="px-3 py-2">{student.section_name || "-"}</td><td className="px-3 py-2">{student.student_mail || "-"}</td></tr>)}</tbody></table> : <p className={`p-4 text-sm ${subdued}`}>No active students are assigned to this class.</p>}
        </div>}
      </article>)}</div> : <p className={`mt-6 text-sm ${subdued}`}>No teaching assignments found. Ask an administrator to assign classes or courses to your teacher profile.</p>}
    </section>
  );

  const renderCourses = () => (
    <section className={panel}>
      <h2 className="text-xl font-semibold">My courses</h2>
      <p className={`mt-1 text-sm ${subdued}`}>Courses assigned to you or to your assigned classes.</p>
      {overview.courses.length ? <div className="mt-5 overflow-x-auto rounded-lg border border-slate-800"><table className="w-full min-w-155 text-left text-sm"><thead className="bg-slate-950 text-slate-400"><tr><th className="px-3 py-3">Course</th><th className="px-3 py-3">Class</th><th className="px-3 py-3">Section</th><th className="px-3 py-3">Periods / week</th><th className="px-3 py-3">Marks</th></tr></thead><tbody>{overview.courses.map((course) => <tr key={course.id} className="border-t border-slate-800"><td className="px-3 py-3"><span className="font-medium">{course.course_name}</span><span className={`block text-xs ${subdued}`}>{course.course_code}</span></td><td className="px-3 py-3">{course.class_name || "-"}</td><td className="px-3 py-3">{course.section_name || "All"}</td><td className="px-3 py-3">{course.periods_per_week ?? 0}</td><td className="px-3 py-3">{course.full_marks_theory ?? "-"}</td></tr>)}</tbody></table></div> : <p className={`mt-5 text-sm ${subdued}`}>No course assignments are linked to this account yet.</p>}
    </section>
  );

  const renderResults = () => (
    <section className={panel}>
      <h2 className="text-xl font-semibold">Exams and results</h2>
      <p className={`mt-1 text-sm ${subdued}`}>Publication status and marks-entry progress for your assigned classes.</p>
      {overview.exams.length ? <div className="mt-4 divide-y divide-slate-800">{overview.exams.map((exam) => <article key={exam.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><h3 className="font-semibold">{exam.exam_type}{exam.term ? ` · ${exam.term}` : ""}</h3><p className={`mt-1 text-sm ${subdued}`}>{exam.class_name || "Class"}{exam.section_name ? ` · ${exam.section_name}` : ""} · {prettyDate(exam.exam_date)}</p><p className={`mt-1 text-xs ${subdued}`}>{exam.subject_count} subjects · {exam.students_with_marks} students have marks</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${exam.is_published ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}>{exam.is_published ? "Published" : "In progress"}</span></article>)}</div> : <p className={`mt-5 text-sm ${subdued}`}>No exam formats are configured for your assigned classes.</p>}
    </section>
  );

  const renderCalendar = () => (
    <section className={panel}>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">School calendar</h2><p className={`mt-1 text-sm ${subdued}`}>{currentMonth?.year_label || "Current academic year"}{currentMonth?.year_label_BS ? ` · ${currentMonth.year_label_BS}` : ""}</p></div><select aria-label="Calendar month" value={currentMonth?.id || ""} onChange={(event) => setSelectedMonthId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">Select month</option>{overview.calendarMonths.map((month) => <option key={month.id} value={month.id}>{month.month_name}</option>)}</select></div>
      {monthDays.length ? <><div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-500">{weekdayOrder.map((day) => <span key={day}>{day.slice(0, 3)}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1">{Array.from({ length: Math.max(0, calendarOffset) }, (_, index) => <div key={`blank-${index}`} />)}{monthDays.map((day) => { const label = day.day_type || day.category_name; const marked = Boolean(label && !/working/i.test(label)); return <div key={day.id} title={[day.day_of_week, label].filter(Boolean).join(" · ")} className={`min-h-16 rounded-lg border p-2 ${marked ? "border-amber-400/30 bg-amber-400/10" : "border-slate-800 bg-slate-950/50"}`}><span className="text-sm font-semibold">{day.day_number}</span>{marked && <span className="mt-1 block truncate text-[10px] text-amber-200">{label}</span>}</div>; })}</div></> : <p className={`mt-5 text-sm ${subdued}`}>The current academic calendar has no configured days.</p>}
    </section>
  );

  const renderAttendance = () => (
    <section className={panel}>
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">My attendance</h2><p className={`mt-1 text-sm ${subdued}`}>Recent check-in records from the school attendance device.</p></div><Clock3 size={18} className="text-slate-500" /></div>
      {overview.attendance.length ? <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800"><table className="w-full min-w-105 text-left text-sm"><thead className="bg-slate-950 text-slate-400"><tr><th className="px-3 py-3">Date and time</th><th className="px-3 py-3">Direction</th><th className="px-3 py-3">Device</th></tr></thead><tbody>{overview.attendance.map((record) => <tr key={record.id} className="border-t border-slate-800"><td className="px-3 py-3">{prettyDate(record.check_time)}</td><td className="px-3 py-3 capitalize">{record.check_type}</td><td className="px-3 py-3">{record.device_id || "-"}</td></tr>)}</tbody></table></div> : <p className={`mt-5 text-sm ${subdued}`}>No attendance-device records are available for your account.</p>}
    </section>
  );

  const renderLeave = () => (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className={panel}><h2 className="text-xl font-semibold">Request leave</h2><p className={`mt-1 text-sm ${subdued}`}>Requests are sent to school administrators for review.</p>{notice && <p role="status" className="mt-4 rounded-lg bg-teal-400/10 p-3 text-sm text-teal-100">{notice}</p>}<form onSubmit={submitLeave} className="mt-5 space-y-4"><label className={`block text-sm ${subdued}`}>Leave type<select value={leaveForm.leave_type} onChange={(event) => setLeaveForm({ ...leaveForm, leave_type: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"><option>Personal</option><option>Sick</option><option>Annual</option><option>Emergency</option><option>Other</option></select></label><div className="grid gap-3 sm:grid-cols-2"><label className={`block text-sm ${subdued}`}>From<input required type="date" value={leaveForm.start_date} onChange={(event) => setLeaveForm({ ...leaveForm, start_date: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className={`block text-sm ${subdued}`}>To<input required type="date" min={leaveForm.start_date || undefined} value={leaveForm.end_date} onChange={(event) => setLeaveForm({ ...leaveForm, end_date: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label></div><label className={`block text-sm ${subdued}`}>Reason<textarea required minLength={5} value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} rows={4} className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><button type="submit" disabled={leaveSubmitting} className="rounded-lg bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">{leaveSubmitting ? "Submitting..." : "Submit request"}</button></form></section>
      <section className={panel}><h2 className="text-xl font-semibold">My requests</h2>{overview.leaveRequests.length ? <div className="mt-3 divide-y divide-slate-800">{overview.leaveRequests.map((request) => <article key={request.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-medium">{request.leave_type || "Leave"}</h3><p className={`mt-1 text-sm ${subdued}`}>{prettyDate(request.start_date)} to {prettyDate(request.end_date)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs capitalize ${request.status === "approved" ? "bg-emerald-400/10 text-emerald-300" : request.status === "rejected" ? "bg-rose-400/10 text-rose-300" : "bg-amber-400/10 text-amber-200"}`}>{request.status}</span></div><p className="mt-3 text-sm">{request.reason}</p>{request.admin_reply && <p className={`mt-2 text-sm ${subdued}`}>Reply: {request.admin_reply}</p>}</article>)}</div> : <p className={`mt-5 text-sm ${subdued}`}>You have no leave requests yet.</p>}</section>
    </div>
  );

  const renderProfile = () => (
    <section className={panel}><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-teal-400/15 text-teal-200">{profile?.profile_photo_url ? <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" /> : <UserRound size={25} />}</div><div><h2 className="text-xl font-semibold">{profile?.full_name || user?.name || "Teacher profile"}</h2><p className={`mt-1 text-sm ${subdued}`}>{profile?.designation || "Teacher"}{profile?.employee_id ? ` · ${profile.employee_id}` : ""}</p></div></div><div className="mt-6 grid gap-x-8 sm:grid-cols-2">{[["Work email", profile?.work_email || user?.email], ["Personal email", profile?.personal_email], ["Work phone", profile?.work_phone], ["Personal phone", profile?.personal_phone], ["Department", profile?.department_id], ["Office", profile?.office_room], ["Joined", prettyDate(profile?.join_date)], ["Qualification", profile?.highest_qualification]].map(([label, value]) => <div key={label} className="border-b border-slate-800 py-3"><p className={`text-xs ${subdued}`}>{label}</p><p className="mt-1 text-sm">{value || "Not provided"}</p></div>)}</div><p className={`mt-5 text-sm ${subdued}`}>Contact the school administrator to update official employment details.</p></section>
  );

  const content = {
    overview: renderOverview,
    classes: renderClasses,
    courses: renderCourses,
    results: renderResults,
    calendar: renderCalendar,
    attendance: renderAttendance,
    leave: renderLeave,
    profile: renderProfile,
  }[active]?.();

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">Loading teacher workspace...</div>;
  if (error) return <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-slate-200"><div><p role="alert" className="text-rose-200">{error}</p><button onClick={loadOverview} className="mt-4 rounded-lg bg-teal-400 px-4 py-2 font-semibold text-slate-950">Try again</button></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 max-w-360 items-center justify-between gap-3">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileNavOpen(!mobileNavOpen)} className="rounded-lg border border-slate-700 p-2 lg:hidden" aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}>{mobileNavOpen ? <X size={18} /> : <Menu size={18} />}</button><span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-400 text-slate-950"><GraduationCap size={20} /></span><div><p className="text-sm font-semibold">SchoolMIS</p><p className="text-xs text-slate-500">Teacher portal</p></div></div>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:block">{profile?.full_name || user?.name || "Teacher"}</span><button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-rose-400/50 hover:text-rose-200"><LogOut size={16} /><span className="hidden sm:inline">Sign out</span></button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-360 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className={`${mobileNavOpen ? "block" : "hidden"} border-b border-slate-800 p-3 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r`}>
          <nav className="grid grid-cols-2 gap-1 lg:grid-cols-1">{navItems.map(([label, key, Icon]) => <button key={key} type="button" onClick={() => openSection(key)} aria-current={active === key ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active === key ? "bg-teal-400/10 font-semibold text-teal-200" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"}`}><Icon size={17} />{label}</button>)}</nav><div className="mt-5 hidden border-t border-slate-800 px-3 pt-4 text-xs leading-5 text-slate-500 lg:block">Your workspace shows assignments linked to your teacher profile.</div>
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Teacher portal</p><h1 className="mt-1 text-2xl font-semibold">{navItems.find((item) => item[1] === active)?.[0]}</h1></div>{active !== "overview" && <button type="button" onClick={loadOverview} title="Refresh workspace" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white"><CheckCircle2 size={17} /></button>}</div>{notice && active !== "classes" && active !== "leave" && <p role="status" className="mb-4 rounded-lg bg-teal-400/10 p-3 text-sm text-teal-100">{notice}</p>}{content}</div>
        </main>
      </div>
    </div>
  );
};

export default TeacherPortalExperience;
