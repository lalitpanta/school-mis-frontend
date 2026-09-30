import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Moon,
  Pencil,
  Printer,
  Settings,
  Sun,
  UserRound,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import config from "../config/config";
import {
  getCurrentStudent,
  getStudentCalendarDays,
  getStudentCalendarMonths,
  updateCurrentStudent,
} from "../api/studentsApi";
import { bsToAd, getTodayBs } from "../utils/bsCalendar";

const sections = [
  ["Dashboard", "dashboard", Home],
  ["Calendar", "calendar", CalendarDays],
  ["Attendance", "attendance", CheckCircle2],
  ["Leave", "leave", ClipboardList],
  ["Daily reports", "reports", FileText],
  ["Homework", "homework", BookOpen],
  ["Results", "results", GraduationCap],
  ["Course & marks", "courses", BookOpen],
  ["Exams", "exams", CalendarDays],
  ["Fees", "fees", Wallet],
  ["Notices", "notices", Bell],
  ["Profile", "profile", UserRound],
  ["Settings", "settings", Settings],
];

const readStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const dateLabel = (value) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? String(value)
    : date.toLocaleDateString();
};

const unwrapList = (response) => {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const StudentPortalExperience = () => {
  const [student, setStudent] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [profileEditing, setProfileEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [active, setActive] = useState("dashboard");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("student-portal-theme") || "system",
  );
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true,
  );
  const [toast, setToast] = useState("");
  const [results, setResults] = useState([]);
  const [resultError, setResultError] = useState("");
  const [term, setTerm] = useState("first_term_marks");
  const [calendarMonths, setCalendarMonths] = useState([]);
  const [monthIndex, setMonthIndex] = useState(0);
  const [calendarDays, setCalendarDays] = useState([]);
  const [calendarError, setCalendarError] = useState("");
  const [calendarFilter, setCalendarFilter] = useState("all");
  const [fees, setFees] = useState([]);
  const [feeError, setFeeError] = useState("");
  const [dailyReports, setDailyReports] = useState([]);
  const [reportsError, setReportsError] = useState("");
  const [courses, setCourses] = useState([]);
  const [courseError, setCourseError] = useState("");
  const [exams, setExams] = useState([]);
  const [examError, setExamError] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [homework, setHomework] = useState([]);
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    homework: true,
  });
  const [leaveForm, setLeaveForm] = useState({
    from: "",
    to: "",
    type: "Sick leave",
    reason: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [paymentFee, setPaymentFee] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("eSewa");
  const [attachedFiles, setAttachedFiles] = useState({});
  const { logout } = useAuth();
  const navigate = useNavigate();

  const studentId = student?.id ?? student?.student_id;
  const storagePrefix = `student-portal:${studentId || "guest"}`;
  const isDark = theme === "dark" || (theme === "system" && systemDark);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    const update = (event) => setSystemDark(event.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    localStorage.setItem("student-portal-theme", theme);
  }, [theme]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getCurrentStudent();
        const profile = response?.data?.data || null;
        setStudent(profile);
        if (profile) {
          setProfileForm({
            phone_no: profile.phone_no || "",
            current_address: profile.current_address || "",
            address: profile.address || "",
            guardian_name: profile.guardian_name || "",
            guardian_email: profile.guardian_email || "",
            guardian_phone: profile.guardian_phone || "",
          });
        }
      } catch (error) {
        setLoadError(
          error?.response?.data?.message ||
            "Unable to load your student profile.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!studentId) return;
    setPreferences(
      readStored(`${storagePrefix}:preferences`, {
        email: true,
        sms: false,
        homework: true,
      }),
    );
  }, [studentId]);

  useEffect(() => {
    if (active !== "leave") return;
    let cancelled = false;
    setLeaveLoading(true);
    axiosInstance
      .get("/v1/students/me/leave")
      .then((response) => {
        if (!cancelled) {
          setLeaveRequests(unwrapList(response));
          setLeaveError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLeaveRequests([]);
          setLeaveError(
            error?.response?.data?.message || "Unable to load leave requests.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLeaveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!student) return;
    if (
      active === "results" ||
      active === "courses" ||
      active === "dashboard"
    ) {
      const classId = student.classroom_id || student.class_id;
      if (!studentId || !classId) {
        setResults([]);
        setResultError(
          "Published results are not available for this student yet.",
        );
        return;
      }
      axiosInstance
        .get(`/v1/results/student/${studentId}/classroom/${classId}`)
        .then((response) => {
          setResults(unwrapList(response));
          setResultError("");
        })
        .catch((error) => {
          setResults([]);
          setResultError(
            error?.response?.data?.message ||
              "No published results are available yet.",
          );
        });
    }
  }, [student, studentId, active]);

  useEffect(() => {
    if (active !== "calendar") return;
    let cancelled = false;
    const loadCalendar = async () => {
      try {
        setCalendarError("");
        const monthResponse = await getStudentCalendarMonths();
        const months = unwrapList(monthResponse);
        if (cancelled) return;
        setCalendarMonths(months);
        const todayBs = getTodayBs();
        const index = Math.max(
          0,
          months.findIndex(
            (month) => Number(month.bs_month_index) === todayBs?.month,
          ),
        );
        setMonthIndex(index);
      } catch (error) {
        if (!cancelled)
          setCalendarError(
            error?.response?.data?.message ||
              "The school calendar is not available.",
          );
      }
    };
    loadCalendar();
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    const month = calendarMonths[monthIndex];
    if (active !== "calendar" || !month?.id) return;
    let cancelled = false;
    setCalendarDays([]);
    setCalendarError("");
    getStudentCalendarDays(month.id)
      .then((response) => {
        if (!cancelled) setCalendarDays(unwrapList(response));
      })
      .catch((error) => {
        if (!cancelled)
          setCalendarError(
            error?.response?.data?.message ||
              "Unable to load this month's school calendar.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [active, calendarMonths, monthIndex]);

  useEffect(() => {
    if (!studentId || (active !== "fees" && active !== "dashboard")) return;
    axiosInstance
      .get("/v1/fees/student-fees", { params: { student_id: studentId } })
      .then((response) => {
        setFees(unwrapList(response));
        setFeeError("");
      })
      .catch((error) => {
        setFees([]);
        setFeeError(
          error?.response?.data?.message || "Fee balances are not available.",
        );
      });
  }, [studentId, active]);

  useEffect(() => {
    if (!studentId || active !== "reports") return;
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    axiosInstance
      .get("/v1/daily-reports", { params: { studentId, date } })
      .then((response) => {
        setDailyReports(unwrapList(response));
        setReportsError("");
      })
      .catch((error) => {
        setDailyReports([]);
        setReportsError(
          error?.response?.data?.message || "Daily reports are unavailable.",
        );
      });
  }, [studentId, active]);

  useEffect(() => {
    if (active !== "courses" && active !== "dashboard") return;
    axiosInstance
      .get("/v1/students/me/courses")
      .then((response) => {
        setCourses(unwrapList(response));
        setCourseError("");
      })
      .catch((error) => {
        setCourses([]);
        setCourseError(
          error?.response?.data?.message ||
            "Unable to load your class courses.",
        );
      });
  }, [active]);

  useEffect(() => {
    if (active !== "exams") return;
    axiosInstance
      .get("/v1/students/me/exams")
      .then((response) => {
        setExams(unwrapList(response));
        setExamError("");
      })
      .catch((error) => {
        setExams([]);
        setExamError(
          error?.response?.data?.message || "Unable to load published exams.",
        );
      });
  }, [active]);

  const unreadCount = 0;
  const todoCount = homework.filter((item) => item.status !== "Done").length;
  const dueFees = fees.reduce(
    (total, fee) => total + Number(fee.balance ?? fee.amount ?? 0),
    0,
  );
  const paidFees = fees.reduce(
    (total, fee) => total + Number(fee.paid_amount ?? 0),
    0,
  );
  const scoreField = term;
  const scores = results
    .map((item) => Number(item[scoreField] ?? 0))
    .filter(Number.isFinite);
  const average = scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : null;
  const passed = average === null ? null : average >= 40;

  const persist = (key, value) =>
    localStorage.setItem(`${storagePrefix}:${key}`, JSON.stringify(value));

  const openSection = (id) => {
    setActive(id);
    setProfileEditing(false);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await updateCurrentStudent(profileForm);
      setStudent(response?.data?.data || { ...student, ...profileForm });
      setProfileEditing(false);
      notify("Profile updated");
    } catch (error) {
      notify(error?.response?.data?.message || "Unable to update profile");
    }
  };

  const uploadProfilePhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify("Profile photos must be 5 MB or smaller");
      return;
    }
    const payload = new FormData();
    payload.append("profile_picture_file", file);
    setUploadingPhoto(true);
    try {
      const response = await updateCurrentStudent(payload);
      setStudent(response?.data?.data || student);
      notify("Profile photo updated");
    } catch (error) {
      notify(
        error?.response?.data?.message || "Unable to upload profile photo",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitLeave = async (event) => {
    event.preventDefault();
    if (!leaveForm.from || !leaveForm.to || !leaveForm.reason.trim()) return;
    try {
      const response = await axiosInstance.post("/v1/students/me/leave", {
        start_date: leaveForm.from,
        end_date: leaveForm.to,
        leave_type: leaveForm.type,
        reason: leaveForm.reason.trim(),
      });
      const request = response?.data?.data;
      setLeaveRequests((current) => [request, ...current]);
      setLeaveForm({ from: "", to: "", type: "Sick leave", reason: "" });
      notify("Leave request sent");
    } catch (error) {
      notify(
        error?.response?.data?.message || "Unable to submit leave request",
      );
    }
  };

  const toggleHomework = (id) => {
    const next = homework.map((item) =>
      item.id === id
        ? { ...item, status: item.status === "Done" ? "To do" : "Done" }
        : item,
    );
    setHomework(next);
    persist("homework", next);
    notify("Homework checklist updated");
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      notify("New passwords do not match");
      return;
    }
    try {
      await axiosInstance.post("/v1/users/me/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ oldPassword: "", newPassword: "", confirm: "" });
      notify("Password changed");
    } catch (error) {
      notify(error?.response?.data?.message || "Unable to change password");
    }
  };

  const printPage = () => window.print();
  const fieldClass = `w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-400 ${isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-300 bg-white text-slate-900"}`;
  const panelClass = `rounded-2xl border p-5 ${isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"}`;
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";
  const headingClass = isDark ? "text-slate-100" : "text-slate-900";

  const resultSubjects = useMemo(
    () =>
      results.map((item) => ({
        name: item.subject || item.subject_name || "Subject",
        score: Number(
          item[scoreField] ?? item.total_marks ?? item.final_marks ?? 0,
        ),
        grade: item.grade || "-",
      })),
    [results, scoreField],
  );

  const renderDashboard = () => (
    <div className="space-y-5">
      <section
        className={`${panelClass} flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-teal-400`}
      >
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClass}`}
          >
            Student dashboard
          </p>
          <h2 className={`mt-2 text-2xl font-semibold ${headingClass}`}>
            Good day, {student.full_name?.split(" ")[0] || "Student"}
          </h2>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            {student.class_name || "Class not assigned"} · Roll{" "}
            {student.roll_no || "-"}
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {results.length
            ? `${results.length} result subject${results.length === 1 ? "" : "s"} available`
            : "Exam countdown unavailable"}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Attendance",
            student.attendance_percentage || "Not available",
            CheckCircle2,
          ],
          [
            "Average marks",
            average === null ? "Not available" : `${average.toFixed(1)}%`,
            GraduationCap,
          ],
          ["Homework to do", String(todoCount), BookOpen],
          [
            "Fees due",
            feeError ? "Not available" : `Rs. ${dueFees.toLocaleString()}`,
            Wallet,
          ],
        ].map(([label, value, Icon]) => (
          <div key={label} className={panelClass}>
            <Icon className="mb-4 h-5 w-5 text-teal-400" />
            <div className={`text-sm ${mutedClass}`}>{label}</div>
            <div className={`mt-1 text-xl font-semibold ${headingClass}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={panelClass}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${headingClass}`}>Today's classes</h3>
            <span className={`text-xs ${mutedClass}`}>Routine</span>
          </div>
          <p className={`mt-4 text-sm ${mutedClass}`}>
            No class routine has been published for your account.
          </p>
        </section>
        <section className={panelClass}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${headingClass}`}>
              Homework checklist
            </h3>
            <button
              className="text-sm text-teal-400"
              onClick={() => openSection("homework")}
            >
              Open homework
            </button>
          </div>
          {!homework.length ? (
            <p className={`mt-4 text-sm ${mutedClass}`}>
              No homework assignments are available.
            </p>
          ) : (
            homework.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => toggleHomework(item.id)}
                className="mt-3 flex w-full items-center gap-3 text-left"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full border border-teal-400">
                  {item.status === "Done" && <Check size={13} />}
                </span>
                <span
                  className={
                    item.status === "Done" ? "line-through opacity-60" : ""
                  }
                >
                  {item.title}
                </span>
              </button>
            ))
          )}
        </section>
      </div>
      <section className={panelClass}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${headingClass}`}>Latest notices</h3>
          <button
            onClick={() => openSection("notices")}
            className="text-sm text-teal-400"
          >
            Open notices
          </button>
        </div>
        <p className={`mt-4 text-sm ${mutedClass}`}>
          No student notices are available.
        </p>
      </section>
    </div>
  );

  const renderCalendar = () => {
    const month = calendarMonths[monthIndex];
    const todayBs = getTodayBs();
    const sorted = [...calendarDays].sort(
      (left, right) =>
        Number(left.day_number || left.day) -
        Number(right.day_number || right.day),
    );
    const dayCount = sorted.length;
    const monthNumber = Number(
      month?.bs_month_index ?? todayBs?.month ?? 1,
    );
    const yearLabel =
      month?.year_label_BS || month?.year_label || todayBs?.year || "";
    const yearNumber =
      Number(String(yearLabel).match(/\d{4}/)?.[0]) || todayBs?.year || 2083;
    const firstDay =
      bsToAd(yearNumber, monthNumber, 1) ||
      (month?.month_start_date_AD
        ? new Date(month.month_start_date_AD)
        : null);
    const offset = firstDay?.getDay() ?? 0;
    const classification = (day) =>
      `${day.day_type || ""} ${day.category_name || ""}`.trim();
    const isExamDay = (day) => /exam/i.test(classification(day));
    const matchesCalendarFilter = (day) =>
      calendarFilter === "all" ||
      (calendarFilter === "exam" && isExamDay(day)) ||
      (calendarFilter === "other" &&
        Boolean(classification(day)) &&
        !isExamDay(day));
    const examCount = sorted.filter(isExamDay).length;
    const otherCount = sorted.filter(
      (day) => Boolean(classification(day)) && !isExamDay(day),
    ).length;
    const filteredEvents = sorted.filter(
      (day) =>
        matchesCalendarFilter(day) &&
        (day.day_type || day.category_name || day.event_name || day.event),
    );
    return (
      <section className={panelClass}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className={`text-xl font-semibold ${headingClass}`}>
              School calendar
            </h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              Academic events and school days
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous month"
              disabled={!calendarMonths.length || monthIndex === 0}
              onClick={() => setMonthIndex((value) => Math.max(0, value - 1))}
              className="rounded-lg border border-slate-600 p-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span
              className={`min-w-28 text-center text-sm font-medium ${headingClass}`}
            >
              {month?.month_name || month?.name || "Calendar"} {yearNumber}
            </span>
            <button
              aria-label="Next month"
              disabled={monthIndex >= calendarMonths.length - 1}
              onClick={() =>
                setMonthIndex((value) =>
                  Math.min(calendarMonths.length - 1, value + 1),
                )
              }
              className="rounded-lg border border-slate-600 p-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div
          className={`mb-4 flex flex-wrap items-center gap-2 border-b pb-4 ${isDark ? "border-slate-800" : "border-slate-200"}`}
          aria-label="Filter calendar days"
        >
          {[
            ["all", "All days", dayCount],
            ["exam", "Exam days", examCount],
            ["other", "Other days", otherCount],
          ].map(([filter, label, count]) => (
            <button
              key={filter}
              type="button"
              aria-pressed={calendarFilter === filter}
              onClick={() => setCalendarFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${calendarFilter === filter ? "border-teal-400 bg-teal-400/15 text-teal-300" : isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}
            >
              {label} <span className="ml-1 tabular-nums opacity-70">{count}</span>
            </button>
          ))}
        </div>
        {calendarError ? (
          <p className="rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
            {calendarError}
          </p>
        ) : !dayCount ? (
          <p className={`py-8 text-sm ${mutedClass}`}>
            No calendar days are configured for this month.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase">
              <div className={mutedClass}>Sun</div>
              <div className={mutedClass}>Mon</div>
              <div className={mutedClass}>Tue</div>
              <div className={mutedClass}>Wed</div>
              <div className={mutedClass}>Thu</div>
              <div className={mutedClass}>Fri</div>
              <div className="text-rose-400">Sat</div>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {Array.from({ length: offset }, (_, index) => (
                <div key={`blank-${index}`} />
              ))}
              {sorted.map((day) => {
                const number = Number(day.day_number || day.day);
                const label =
                  day.day_type ||
                  day.category_name ||
                  day.event_name ||
                  day.event ||
                  "";
                const weekdayNames = [
                  "sunday",
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ];
                const configuredWeekday = String(day.day_of_week || "")
                  .toLowerCase()
                  .trim();
                const weekdayIndex = weekdayNames.indexOf(configuredWeekday);
                const isSaturday =
                  (weekdayIndex >= 0
                    ? weekdayIndex
                    : (offset + number - 1) % 7) === 6;
                const isToday =
                  yearNumber === todayBs?.year &&
                  monthNumber === todayBs?.month &&
                  number === todayBs?.day;
                return (
                  <div
                    key={day.id || number}
                    className={`min-h-16 rounded-lg border p-2 ${isToday ? "border-teal-400 ring-1 ring-teal-400" : isDark ? "border-slate-800" : "border-slate-200"} ${isSaturday ? "opacity-45" : ""}`}
                  >
                    <span
                      className={`text-sm font-semibold ${isToday ? "text-teal-400" : headingClass}`}
                    >
                      {number}
                    </span>
                    {label && matchesCalendarFilter(day) && (
                      <span
                        className="mt-1 block truncate rounded bg-amber-400/10 px-1 py-0.5 text-[10px] text-amber-300"
                        title={label}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <h3 className={`mt-6 font-semibold ${headingClass}`}>Coming up</h3>
            {filteredEvents.length ? (
              filteredEvents.slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  className={`mt-2 flex justify-between gap-3 border-b py-2 text-sm ${isDark ? "border-slate-800" : "border-slate-200"}`}
                >
                  <span>
                    {event.day_type ||
                      event.category_name ||
                      event.event_name ||
                      event.event}
                  </span>
                  <span className={mutedClass}>
                    {event.day_number || event.day}
                  </span>
                </div>
              ))
            ) : (
              <p className={`mt-2 text-sm ${mutedClass}`}>
                No upcoming events posted.
              </p>
            )}
          </>
        )}
      </section>
    );
  };

  const renderResults = () => (
    <section className={`${panelClass} print-area`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-semibold ${headingClass}`}>
            Term results
          </h2>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Published marks for your account
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          {["first_term_marks", "second_term_marks", "final_marks"].map(
            (value, index) => (
              <button
                key={value}
                onClick={() => setTerm(value)}
                className={`rounded-lg border px-3 py-2 text-sm ${term === value ? "border-teal-400 bg-teal-500/15 text-teal-300" : "border-slate-600"}`}
              >
                Term {index + 1}
              </button>
            ),
          )}
          <button
            onClick={printPage}
            aria-label="Print report card"
            title="Print report card"
            className="rounded-lg border border-slate-600 p-2"
          >
            <Printer size={17} />
          </button>
        </div>
      </div>
      {resultError ? (
        <p className={`text-sm ${mutedClass}`}>{resultError}</p>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Metric
              title="Average"
              value={average === null ? "-" : `${average.toFixed(1)}%`}
            />
            <Metric title="GPA" value="Not provided" />
            <Metric
              title="Result"
              value={passed === null ? "-" : passed ? "Pass" : "Needs review"}
            />
          </div>
          {resultSubjects.length ? (
            <div className="space-y-3">
              {resultSubjects.map((subject, index) => (
                <div
                  key={`${subject.name}-${index}`}
                  className="grid grid-cols-[minmax(90px,1fr)_2fr_auto] items-center gap-3"
                >
                  <span className="truncate text-sm">{subject.name}</span>
                  <div
                    className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <div
                      className="h-full rounded-full bg-teal-400"
                      style={{
                        width: `${Math.max(0, Math.min(100, subject.score))}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm tabular-nums">
                    {subject.score} · {subject.grade}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${mutedClass}`}>
              No published marks for this term.
            </p>
          )}
        </>
      )}
    </section>
  );

  const renderFees = () => (
    <section className={panelClass}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className={`text-xl font-semibold ${headingClass}`}>Fees</h2>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Current student fee ledger
          </p>
        </div>
        <button
          onClick={printPage}
          className="rounded-lg border border-slate-600 p-2 print:hidden"
          aria-label="Print fees"
        >
          <Printer size={16} />
        </button>
      </div>
      {feeError && <p className="mb-4 text-sm text-amber-300">{feeError}</p>}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Metric title="Total due" value={`Rs. ${dueFees.toLocaleString()}`} />
        <Metric title="Total paid" value={`Rs. ${paidFees.toLocaleString()}`} />
      </div>
      {fees.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-137.5 text-left text-sm">
            <thead className={mutedClass}>
              <tr>
                <th className="py-3">Fee</th>
                <th>Due date</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} className="border-t border-slate-700/50">
                  <td className="py-3">
                    {fee.fee_category_name || fee.name || "School fee"}
                  </td>
                  <td>{dateLabel(fee.due_date)}</td>
                  <td>
                    Rs.{" "}
                    {Number(fee.amount ?? fee.balance ?? 0).toLocaleString()}
                  </td>
                  <td>
                    {fee.status || (Number(fee.balance) <= 0 ? "Paid" : "Due")}
                  </td>
                  <td className="print:hidden">
                    {String(fee.status).toLowerCase() === "paid" ? (
                      <button onClick={printPage} className="text-teal-400">
                        Receipt
                      </button>
                    ) : (
                      <button
                        onClick={() => setPaymentFee(fee)}
                        className="text-teal-400"
                      >
                        Pay now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !feeError && (
          <p className={`text-sm ${mutedClass}`}>No fee records found.</p>
        )
      )}
      {paymentFee && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Payment options"
        >
          <div className={`${panelClass} w-full max-w-md`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${headingClass}`}>Pay fee</h3>
              <button
                onClick={() => setPaymentFee(null)}
                aria-label="Close payment"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              {paymentFee.fee_category_name || "Fee"} · Rs.{" "}
              {Number(
                paymentFee.balance ?? paymentFee.amount ?? 0,
              ).toLocaleString()}
            </p>
            <label className={`mt-4 block text-sm ${mutedClass}`}>
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className={`${fieldClass} mt-2`}
              >
                {["eSewa", "Khalti", "ConnectIPS", "Card"].map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Online payment is not enabled for this school. No payment has been
              taken or recorded.
            </div>
            <button
              onClick={() => {
                setPaymentFee(null);
                notify("Contact the school office to complete payment");
              }}
              className="mt-4 w-full rounded-xl bg-teal-400 px-4 py-3 font-semibold text-slate-950"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );

  const renderContentLegacy = () => {
    if (active === "dashboard") return renderDashboard();
    if (active === "calendar") return renderCalendar();
    if (active === "results") return renderResults();
    if (active === "fees") return renderFees();
    if (active === "courses")
      return (
        <section className={panelClass}>
          <h2 className={`text-xl font-semibold ${headingClass}`}>
            Course & marks
          </h2>
          <div className="mt-5 space-y-4">
            {resultSubjects.length ? (
              resultSubjects.map((subject, index) => (
                <div
                  key={`${subject.name}-${index}`}
                  className="rounded-xl border border-slate-700/50 p-4"
                >
                  <div className="flex justify-between gap-4">
                    <strong>{subject.name}</strong>
                    <span>
                      {subject.score}/100 · {subject.grade}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-teal-400"
                      style={{ width: `${Math.min(100, subject.score)}%` }}
                    />
                  </div>
                  <p className={`mt-2 text-xs ${mutedClass}`}>
                    Theory/practical split and pass marks are not available in
                    the published result data.
                  </p>
                </div>
              ))
            ) : (
              <p className={`text-sm ${mutedClass}`}>
                {resultError || "No course marks are available."}
              </p>
            )}
          </div>
        </section>
      );
    if (active === "attendance")
      return (
        <section className={panelClass}>
          <h2 className={`text-xl font-semibold ${headingClass}`}>
            Attendance
          </h2>
          <p className={`mt-2 text-sm ${mutedClass}`}>
            Student-scoped attendance history is not currently exposed by the
            school API. No attendance figures are shown until the school enables
            that feed.
          </p>
        </section>
      );
    if (active === "leave")
      return (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className={panelClass}>
            <h2 className={`text-xl font-semibold ${headingClass}`}>
              Request leave
            </h2>
            <form onSubmit={submitLeave} className="mt-4 space-y-3">
              <label className={`block text-sm ${mutedClass}`}>
                From
                <input
                  required
                  type="date"
                  value={leaveForm.from}
                  onChange={(event) =>
                    setLeaveForm({ ...leaveForm, from: event.target.value })
                  }
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className={`block text-sm ${mutedClass}`}>
                To
                <input
                  required
                  type="date"
                  min={leaveForm.from}
                  value={leaveForm.to}
                  onChange={(event) =>
                    setLeaveForm({ ...leaveForm, to: event.target.value })
                  }
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className={`block text-sm ${mutedClass}`}>
                Type
                <select
                  value={leaveForm.type}
                  onChange={(event) =>
                    setLeaveForm({ ...leaveForm, type: event.target.value })
                  }
                  className={`${fieldClass} mt-1`}
                >
                  <option>Sick leave</option>
                  <option>Personal leave</option>
                  <option>Family emergency</option>
                </select>
              </label>
              <label className={`block text-sm ${mutedClass}`}>
                Reason
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(event) =>
                    setLeaveForm({ ...leaveForm, reason: event.target.value })
                  }
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <p className="text-xs text-amber-300">
                Requests are saved on this device only; school submission is not
                connected.
              </p>
              <button className="rounded-xl bg-teal-400 px-4 py-2.5 font-semibold text-slate-950">
                Save request
              </button>
            </form>
          </section>
          <section className={panelClass}>
            <h3 className={`font-semibold ${headingClass}`}>Request history</h3>
            {leaveRequests.length ? (
              leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="mt-3 rounded-xl border border-slate-700/50 p-3"
                >
                  <div className="flex justify-between">
                    <strong>{request.type}</strong>
                    <span className="text-amber-300">{request.status}</span>
                  </div>
                  <p className={`mt-1 text-sm ${mutedClass}`}>
                    {dateLabel(request.from)} – {dateLabel(request.to)}
                  </p>
                  <p className="mt-2 text-sm">{request.reason}</p>
                </div>
              ))
            ) : (
              <p className={`mt-3 text-sm ${mutedClass}`}>
                No leave requests saved.
              </p>
            )}
          </section>
        </div>
      );
    if (active === "homework")
      return (
        <section className={panelClass}>
          <h2 className={`text-xl font-semibold ${headingClass}`}>Homework</h2>
          <p className={`mt-2 text-sm ${mutedClass}`}>
            No assignment feed is configured. Checklist items saved here are
            private to this device.
          </p>
          {homework.map((item) => (
            <div
              key={item.id}
              className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 py-3"
            >
              <button
                onClick={() => toggleHomework(item.id)}
                className="flex items-center gap-3 text-left"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full border border-teal-400">
                  {item.status === "Done" && <Check size={13} />}
                </span>
                {item.title}{" "}
                <span className={`text-xs ${mutedClass}`}>
                  {item.subject} · due {dateLabel(item.due)}
                </span>
              </button>
              <label className="cursor-pointer text-sm text-teal-400">
                Attach
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setAttachedFiles({
                        ...attachedFiles,
                        [item.id]: file.name,
                      });
                      notify(`${file.name} attached locally`);
                    }
                  }}
                />
              </label>
              {attachedFiles[item.id] && (
                <span className="text-xs text-amber-300">
                  Ready to upload: {attachedFiles[item.id]}
                </span>
              )}
            </div>
          ))}
        </section>
      );
    if (active === "reports")
      return (
        <section className={panelClass}>
          <h2 className={`text-xl font-semibold ${headingClass}`}>
            Daily reports
          </h2>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Teacher updates for today
          </p>
          {reportsError ? (
            <p className="mt-4 text-sm text-amber-300">{reportsError}</p>
          ) : dailyReports.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {dailyReports.map((report, index) => (
                <article
                  key={report.id || index}
                  className={`rounded-xl border p-4 ${["border-teal-500/40 bg-teal-500/5", "border-amber-500/40 bg-amber-500/5", "border-sky-500/40 bg-sky-500/5", "border-rose-500/40 bg-rose-500/5"][index % 4]}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={17} className="text-teal-400" />
                    <h3 className="font-semibold">
                      {report.subject ||
                        report.subject_name ||
                        report.template_name ||
                        "Daily report"}
                    </h3>
                  </div>
                  <p
                    className={`mt-3 whitespace-pre-wrap text-sm ${mutedClass}`}
                  >
                    {report.report ||
                      report.description ||
                      report.content ||
                      report.details ||
                      "Report recorded."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className={`mt-4 text-sm ${mutedClass}`}>
              No reports have been posted for today.
            </p>
          )}
        </section>
      );
    if (active === "exams")
      return (
        <section className={panelClass}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${headingClass}`}>
              Exams & admit card
            </h2>
            <button
              onClick={printPage}
              className="rounded-lg border border-slate-600 p-2 print:hidden"
              aria-label="Print admit card"
            >
              <Printer size={16} />
            </button>
          </div>
          <div className="mt-5 rounded-xl border border-dashed border-slate-600 p-5">
            <h3 className="font-semibold">Admit card</h3>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              {student.full_name} · {student.class_name || "Class not assigned"}{" "}
              · Roll {student.roll_no || "-"}
            </p>
            <p className="mt-3 text-sm text-amber-300">
              Exam timetable is not available. Fee clearance cannot be verified
              here.
            </p>
          </div>
        </section>
      );
    if (active === "notices")
      return (
        <section className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={`text-xl font-semibold ${headingClass}`}>Notices</h2>
            <select
              className={fieldClass}
              defaultValue="All"
              aria-label="Filter notices"
            >
              <option>All</option>
              <option>Exam</option>
              <option>Event</option>
              <option>Holiday</option>
              <option>Fees</option>
            </select>
          </div>
          <p className={`mt-4 text-sm ${mutedClass}`}>
            Student notices are not currently exposed by the school API.
          </p>
        </section>
      );
    if (active === "profile")
      return (
        <section className={panelClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${headingClass}`}>
              Student profile
            </h2>
            <button
              onClick={() => setProfileEditing(!profileEditing)}
              className="rounded-lg border border-slate-600 p-2 print:hidden"
              title="Edit profile"
            >
              <Pencil size={16} />
            </button>
          </div>
          {profileEditing ? (
            <form onSubmit={saveProfile} className="grid gap-3 md:grid-cols-2">
              {[
                ["phone_no", "Phone"],
                ["current_address", "Address"],
                ["guardian_name", "Guardian"],
                ["guardian_phone", "Guardian phone"],
                ["guardian_email", "Guardian email"],
              ].map(([name, label]) => (
                <label key={name} className={`text-sm ${mutedClass}`}>
                  {label}
                  <input
                    className={`${fieldClass} mt-1`}
                    value={profileForm[name] || ""}
                    onChange={(event) =>
                      setProfileForm({
                        ...profileForm,
                        [name]: event.target.value,
                      })
                    }
                  />
                </label>
              ))}
              <button className="rounded-xl bg-teal-400 px-4 py-2 font-semibold text-slate-950">
                Save profile
              </button>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Student ID", student.admission_no || student.id],
                ["Class", student.class_name],
                ["Roll number", student.roll_no],
                ["Date of birth", dateLabel(student.date_of_birth)],
                ["Guardian", student.guardian_name],
                ["Phone", student.phone_no],
                ["Email", student.student_mail || student.school_email],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-700/50 py-2">
                  <div className={`text-xs ${mutedClass}`}>{label}</div>
                  <div className="mt-1">{value || "Not provided"}</div>
                </div>
              ))}
            </div>
          )}
          <p className={`mt-6 text-sm ${mutedClass}`}>
            Weekly class routine is not available for this account.
          </p>
        </section>
      );
    if (active === "settings")
      return (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className={panelClass}>
            <h2 className={`text-xl font-semibold ${headingClass}`}>
              Reminder settings
            </h2>
            {[
              ["email", "Email alerts"],
              ["sms", "SMS alerts"],
              ["homework", "Homework reminders"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="mt-4 flex items-center justify-between"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(preferences[key])}
                  onChange={(event) => {
                    const next = {
                      ...preferences,
                      [key]: event.target.checked,
                    };
                    setPreferences(next);
                    persist("preferences", next);
                    notify("Reminder settings saved on this device");
                  }}
                />
              </label>
            ))}
            <p className={`mt-4 text-xs ${mutedClass}`}>
              Preferences are stored on this device; notification delivery is
              not connected.
            </p>
          </section>
          <section className={panelClass}>
            <h2 className={`text-xl font-semibold ${headingClass}`}>
              Change password
            </h2>
            <form onSubmit={submitPassword} className="mt-4 space-y-3">
              {[
                ["oldPassword", "Current password"],
                ["newPassword", "New password"],
                ["confirm", "Confirm new password"],
              ].map(([key, label]) => (
                <label key={key} className={`block text-sm ${mutedClass}`}>
                  {label}
                  <input
                    required
                    minLength={key === "oldPassword" ? undefined : 8}
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm[key]}
                    onChange={(event) =>
                      setPasswordForm({
                        ...passwordForm,
                        [key]: event.target.value,
                      })
                    }
                    className={`${fieldClass} mt-1`}
                  />
                </label>
              ))}
              <button className="rounded-xl bg-teal-400 px-4 py-2.5 font-semibold text-slate-950">
                Update password
              </button>
            </form>
          </section>
        </div>
      );
    return null;
  };

  const renderLeave = () => (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className={panelClass}>
        <h2 className={`text-xl font-semibold ${headingClass}`}>
          Request leave
        </h2>
        <form onSubmit={submitLeave} className="mt-4 space-y-3">
          <label className={`block text-sm ${mutedClass}`}>
            From
            <input
              required
              type="date"
              value={leaveForm.from}
              onChange={(event) =>
                setLeaveForm({ ...leaveForm, from: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className={`block text-sm ${mutedClass}`}>
            To
            <input
              required
              type="date"
              min={leaveForm.from}
              value={leaveForm.to}
              onChange={(event) =>
                setLeaveForm({ ...leaveForm, to: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className={`block text-sm ${mutedClass}`}>
            Type
            <select
              value={leaveForm.type}
              onChange={(event) =>
                setLeaveForm({ ...leaveForm, type: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            >
              <option>Sick leave</option>
              <option>Personal leave</option>
              <option>Family emergency</option>
            </select>
          </label>
          <label className={`block text-sm ${mutedClass}`}>
            Reason
            <textarea
              required
              rows={3}
              value={leaveForm.reason}
              onChange={(event) =>
                setLeaveForm({ ...leaveForm, reason: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <button className="rounded-xl bg-teal-400 px-4 py-2.5 font-semibold text-slate-950">
            Submit request
          </button>
        </form>
      </section>
      <section className={panelClass}>
        <h3 className={`font-semibold ${headingClass}`}>Request history</h3>
        {leaveLoading ? (
          <p className={`mt-3 text-sm ${mutedClass}`}>Loading requests…</p>
        ) : leaveError ? (
          <p className="mt-3 text-sm text-rose-300">{leaveError}</p>
        ) : leaveRequests.length ? (
          leaveRequests.map((request) => (
            <article
              key={request.id}
              className="mt-3 rounded-xl border border-slate-700/50 p-3"
            >
              <div className="flex justify-between gap-3">
                <strong>{request.leave_type || "Leave request"}</strong>
                <span
                  className={
                    request.status === "approved"
                      ? "text-emerald-400"
                      : request.status === "rejected"
                        ? "text-rose-400"
                        : "text-amber-300"
                  }
                >
                  {request.status}
                </span>
              </div>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                {dateLabel(request.start_date)} – {dateLabel(request.end_date)}
              </p>
              <p className="mt-2 text-sm">{request.reason}</p>
              {request.admin_reply && (
                <p className={`mt-2 text-sm ${mutedClass}`}>
                  School reply: {request.admin_reply}
                </p>
              )}
            </article>
          ))
        ) : (
          <p className={`mt-3 text-sm ${mutedClass}`}>
            No leave requests have been submitted.
          </p>
        )}
      </section>
    </div>
  );

  const renderProfilePhoto = () => (
    <section className={`${panelClass} mt-5`}>
      <h3 className={`font-semibold ${headingClass}`}>Profile photo</h3>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {profilePhotoUrl ? (
          <img
            src={profilePhotoUrl}
            alt="Student profile"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-teal-400 font-bold text-slate-950">
            {initials}
          </span>
        )}
        <label
          className={`cursor-pointer rounded-lg border px-4 py-2 text-sm ${isDark ? "border-slate-600" : "border-slate-300"}`}
        >
          {uploadingPhoto ? "Uploading…" : "Choose photo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadingPhoto}
            onChange={(event) => {
              uploadProfilePhoto(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <span className={`text-xs ${mutedClass}`}>
          JPG, PNG, or another image format. Maximum 5 MB.
        </span>
      </div>
    </section>
  );

  const renderCourses = () => (
    <section className={panelClass}>
      <h2 className={`text-xl font-semibold ${headingClass}`}>
        Course & marks
      </h2>
      {courseError ? (
        <p className="mt-4 text-sm text-amber-300">{courseError}</p>
      ) : courses.length ? (
        <div className="mt-5 space-y-4">
          {courses.map((course) => {
            const title =
              course.course_name ||
              course.subject_name ||
              course.course_code ||
              "Course";
            const result = results.find(
              (item) =>
                String(
                  item.subject || item.subject_name || "",
                ).toLowerCase() === title.toLowerCase(),
            );
            const mark =
              result?.final_marks ??
              result?.second_term_marks ??
              result?.first_term_marks;
            const score =
              mark === null || mark === undefined ? null : Number(mark);
            return (
              <article
                key={course.id || course.course_code || title}
                className="rounded-xl border border-slate-700/50 p-4"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className={`mt-1 text-xs ${mutedClass}`}>
                      {course.course_code || ""}
                    </p>
                  </div>
                  <span className="text-sm">
                    {score === null
                      ? "Marks not published"
                      : `${score}/100 · ${result.grade || "Grade pending"}`}
                  </span>
                </div>
                {score !== null && (
                  <div
                    className={`mt-3 h-2 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <div
                      className="h-2 rounded-full bg-teal-400"
                      style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className={`mt-4 text-sm ${mutedClass}`}>
          No active courses are assigned to your class.
        </p>
      )}
    </section>
  );

  const renderExams = () => (
    <section className={panelClass}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${headingClass}`}>
            Exams & admit card
          </h2>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Published exams for your class
          </p>
        </div>
        <button
          onClick={printPage}
          className="rounded-lg border border-slate-600 p-2 print:hidden"
          aria-label="Print admit card"
        >
          <Printer size={16} />
        </button>
      </div>
      <div className="mt-5 rounded-xl border border-slate-700/50 p-4">
        <h3 className="font-semibold">Admit card</h3>
        <p className={`mt-2 text-sm ${mutedClass}`}>
          {student.full_name} · {student.class_name || "Class not assigned"} ·
          Roll {student.roll_no || "-"}
        </p>
        <p className={`mt-1 text-sm ${mutedClass}`}>
          Admission: {student.admission_no || "-"} · Date of birth:{" "}
          {dateLabel(student.date_of_birth)}
        </p>
      </div>
      {examError ? (
        <p className="mt-4 text-sm text-amber-300">{examError}</p>
      ) : exams.length ? (
        <div className="mt-4 divide-y divide-slate-700/50">
          {exams.map((exam) => (
            <article
              key={exam.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <h3 className="font-semibold">
                  {exam.exam_type || exam.name || "Exam"}
                  {exam.term ? ` · ${exam.term}` : ""}
                </h3>
                <p className={`mt-1 text-sm ${mutedClass}`}>
                  {exam.class_name || student.class_name}{" "}
                  {exam.section_name ? `· ${exam.section_name}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">{dateLabel(exam.exam_date)}</p>
                {exam.pass_mark_percentage != null && (
                  <p className={`mt-1 text-xs ${mutedClass}`}>
                    Pass mark {exam.pass_mark_percentage}%
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={`mt-4 text-sm ${mutedClass}`}>
          No published exams are available for your class.
        </p>
      )}
    </section>
  );

  const renderContent = () => {
    if (active === "leave") return renderLeave();
    if (active === "courses") return renderCourses();
    if (active === "exams") return renderExams();
    const content = renderContentLegacy();
    return active === "profile" ? (
      <>
        {content}
        {renderProfilePhoto()}
      </>
    ) : (
      content
    );
  };

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center">
        Loading student portal…
      </div>
    );
  if (loadError || !student)
    return (
      <div className="m-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-200">
        {loadError || "No student profile found."}
      </div>
    );

  const initials = (student.full_name || "Student")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const profilePhotoUrl = student.profile_picture
    ? student.profile_picture.startsWith("http")
      ? student.profile_picture
      : `${config.API_BASE_URL}${student.profile_picture}`
    : "";

  return (
    <main
      className={`student-portal min-h-screen ${isDark ? "bg-[#071522] text-slate-100" : "bg-[#eef4f4] text-slate-900"}`}
    >
      <style>{`@media print { .print\\:hidden, .portal-menu, .portal-header-actions { display: none !important; } .student-portal { background: white !important; color: #111827 !important; } .print-area { break-inside: avoid; } }`}</style>
      <div className="mx-auto max-w-360 px-3 py-4 sm:px-6">
        <header
          className={`portal-header-actions mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white"}`}
        >
          <button
            onClick={() => openSection("dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-400 font-black text-slate-950">
              MS
            </span>
            <span>
              <strong className="block text-lg">Mero Company</strong>
              <span className={`text-xs ${mutedClass}`}>
                Padh babu padh · My School
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openSection("notices")}
              className="relative rounded-xl border border-slate-600 p-2.5"
              aria-label={`Notices, ${unreadCount} unread`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() =>
                setTheme(
                  theme === "system"
                    ? systemDark
                      ? "light"
                      : "dark"
                    : theme === "dark"
                      ? "light"
                      : "system",
                )
              }
              className="rounded-xl border border-slate-600 p-2.5"
              aria-label="Change theme"
              title={`Theme: ${theme}`}
              data-theme={theme}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => openSection("profile")}
              className="flex items-center gap-2 rounded-xl border border-slate-600 px-2.5 py-1.5 text-left"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-400 text-xs font-bold text-slate-950">
                {initials}
              </span>
              <span className="hidden text-sm sm:block">
                {student.full_name}
              </span>
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/student/login", { replace: true });
              }}
              className="rounded-xl border border-slate-600 p-2.5"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
          <aside
            className={`portal-menu rounded-xl border p-1.5 lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:flex-col lg:overflow-hidden ${isDark ? "border-slate-800 bg-slate-950/95" : "border-slate-200 bg-white/95"}`}
          >
            <div
              className={`hidden border-b p-4 lg:block ${isDark ? "border-slate-800" : "border-slate-200"}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-400 text-xs font-bold text-slate-950">
                  {initials}
                </span>
                <span className="min-w-0">
                  <strong className={`block truncate text-sm ${headingClass}`}>
                    {student.full_name}
                  </strong>
                  <span className={`block truncate text-xs ${mutedClass}`}>
                    {student.admission_no || "Student"} ·{" "}
                    {student.class_name || "Class not assigned"}
                  </span>
                </span>
              </div>
            </div>
            <nav
              className="flex gap-1 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:p-2"
              aria-label="Student portal sections"
            >
              {sections.map(([label, id, Icon]) => (
                <button
                  key={id}
                  onClick={() => openSection(id)}
                  className={`relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition lg:w-full ${active === id ? "bg-teal-400/15 text-teal-300" : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {id === "homework" && todoCount > 0 && (
                    <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-slate-950">
                      {todoCount}
                    </span>
                  )}
                  {id === "notices" && unreadCount > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>
          <section className="min-w-0">{renderContent()}</section>
        </div>
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </main>
  );
};

const Metric = ({ title, value }) => (
  <div className="rounded-xl border border-slate-700/50 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
    <p className="mt-2 text-xl font-semibold">{value}</p>
  </div>
);

export default StudentPortalExperience;
