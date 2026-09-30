import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Home,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  UserCircle2,
  X,
} from "lucide-react";
import { getCurrentStudent, updateCurrentStudent } from "../api/studentsApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const StudentPortalPage = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [profileForm, setProfileForm] = useState({});
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadStudent = async () => {
      try {
        setLoading(true);
        const response = await getCurrentStudent();
        const profile = response?.data?.data || null;
        setStudent(profile);
        if (profile) {
          setProfileForm({
            phone_no: profile.phone_no || "",
            address: profile.address || "",
            current_address: profile.current_address || "",
            home_district: profile.home_district || "",
            home_municipality: profile.home_municipality || "",
            home_ward: profile.home_ward || "",
            home_full_address: profile.home_full_address || "",
            guardian_name: profile.guardian_name || "",
            guardian_email: profile.guardian_email || "",
            guardian_phone: profile.guardian_phone || "",
          });
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || "Unable to load student profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-red-200">
        {error}
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-slate-300">
        No student profile found.
      </div>
    );
  }

  const updateField = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const cancelEditing = () => {
    setProfileForm({
      phone_no: student.phone_no || "",
      address: student.address || "",
      current_address: student.current_address || "",
      home_district: student.home_district || "",
      home_municipality: student.home_municipality || "",
      home_ward: student.home_ward || "",
      home_full_address: student.home_full_address || "",
      guardian_name: student.guardian_name || "",
      guardian_email: student.guardian_email || "",
      guardian_phone: student.guardian_phone || "",
    });
    setEditing(false);
    setSaveMessage("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaveMessage("");
    try {
      const response = await updateCurrentStudent(profileForm);
      const updated = response?.data?.data || { ...student, ...profileForm };
      setStudent(updated);
      setEditing(false);
      setSaveMessage("Your profile has been updated.");
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message || "Unable to save your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = (student.full_name || "Student")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navItems = [
    { label: "Overview", icon: Home, active: true },
    { label: "Results", icon: BookOpen },
    { label: "Attendance", icon: CheckCircle2 },
    { label: "Calendar", icon: CalendarDays },
    { label: "Profile", icon: UserCircle2 },
  ];

  const cards = [
    {
      label: "Attendance",
      value: student.attendance_percentage || "96%",
      detail: "This month",
      tone: "bg-[#19c7b8]",
    },
    {
      label: "Class rank",
      value: student.class_rank || "#5",
      detail: "Out of 30",
      tone: "bg-[#5b7cff]",
    },
    {
      label: "Upcoming exam",
      value: student.next_exam || "Math",
      detail: "14th Nov",
      tone: "bg-[#ffb454]",
    },
    {
      label: "Guardian",
      value: student.guardian_name || "N/A",
      detail: "Contacted",
      tone: "bg-[#5cd0a8]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#061521] px-3 py-5 text-[#eaf3ff] sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[28px] border border-[#233b53] bg-[#0a1d2f] shadow-[0_30px_80px_rgba(3,8,20,0.45)]">
        <div className="flex min-h-[calc(100vh-40px)] flex-col lg:flex-row">
          <aside className="w-full border-b border-[#213a4e] bg-[#0c1f34] px-5 py-6 lg:w-[290px] lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 pb-8 pt-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1ad9c8] text-lg font-black text-[#082334]">
                MS
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8ea9c2]">
                  Mero Company
                </div>
                <div className="text-xl font-semibold text-[#f2f7ff]">My School</div>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                    active
                      ? "bg-[#13324a] text-[#edf7ff] shadow-[inset_0_0_0_1px_rgba(105,214,196,0.28)]"
                      : "text-[#a7bbcf] hover:bg-[#122b40] hover:text-white",
                  ].join(" ")}
                >
                  <Icon className={active ? "h-4 w-4 text-[#74f0db]" : "h-4 w-4 text-[#8ea9c2]"} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8 rounded-2xl border border-[#25415d] bg-[#0e243c] p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1ad9c8] text-sm font-bold text-[#092a37]">
                  {initials}
                </div>
                <div>
                  <div className="text-base font-semibold text-[#f3f8ff]">
                    {student.full_name || "Student"}
                  </div>
                  <div className="text-xs text-[#8ea9c2]">
                    {student.admission_no || "Admission not available"}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-[#cfdef1]">
                <div className="flex items-center justify-between rounded-xl bg-[#112b43] px-3 py-2">
                  <span className="text-[#8aa7c0]">Class</span>
                  <span className="font-medium text-white">{student.class_name || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#112b43] px-3 py-2">
                  <span className="text-[#8aa7c0]">Section</span>
                  <span className="font-medium text-white">{student.section_name || "N/A"}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 bg-[#0d1b2d]">
            <header className="flex flex-col gap-4 border-b border-[#223c53] px-5 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#90a9bf]">
                  Student dashboard
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#edf5ff]">
                  Welcome back, {student.full_name?.split(" ")[0] || "Student"}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#29405d] bg-[#12263f] text-[#eaf3ff] transition hover:bg-[#183253]"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </button>

                {!editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#40d9c7] bg-[#1ed8c3] px-4 py-3 text-sm font-medium text-[#082531] transition hover:bg-[#69ead7]"
                  >
                    <Pencil size={16} />
                    <span>Edit profile</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/student/login", { replace: true });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#314d69] bg-transparent px-4 py-3 text-sm font-medium text-[#edf5ff] transition hover:bg-[#162f44]"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            </header>

            <div className="px-5 pb-8 pt-6">
              {saveMessage && (
                <div
                  role="status"
                  className="mb-6 rounded-2xl border border-[#2dc9b9]/50 bg-[#0f2d37] px-4 py-3 text-sm text-[#bafaf0]"
                >
                  {saveMessage}
                </div>
              )}

              <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, detail, tone }) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-[#2a3f57] bg-[#0e2237] p-4 shadow-[0_18px_30px_rgba(7,18,28,0.22)]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#90a9bf]">
                        {label}
                      </span>
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                        <ShieldCheck className="h-4 w-4 text-[#092033]" />
                      </span>
                    </div>
                    <div className="text-2xl font-semibold text-white">{value}</div>
                    <div className="mt-2 text-sm text-[#97aec2]">{detail}</div>
                  </div>
                ))}
              </div>

              {editing ? (
                <form onSubmit={saveProfile} className="space-y-6">
                  <section className="rounded-[28px] border border-[#2b4058] bg-[#0b1c2f] p-5 lg:p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#13324a] text-[#73f0dc]">
                        <UserCircle2 className="h-5 w-5" />
                      </span>
                      <h2 className="text-xl font-semibold text-[#edf5ff]">Edit your profile</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {[
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
                      ].map(([name, label, type]) => (
                        <label key={name} className="block text-sm text-[#dceafc]">
                          {label}
                          <input
                            name={name}
                            type={type}
                            value={profileForm[name] || ""}
                            onChange={updateField}
                            className="mt-2 w-full rounded-2xl border border-[#2d445f] bg-[#0d1d2b] px-3 py-3 text-base text-[#edf5ff] outline-none transition focus:border-[#70f0dd]"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-[#2d445f] bg-[#0d2238] p-4 text-sm text-[#dceafc]">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#84a2c0]">
                        Login email
                      </div>
                      <div className="flex items-center gap-2 text-base text-[#ebf5ff]">
                        <Mail className="h-4 w-4 text-[#71edd8]" />
                        <span>{student.student_mail || student.school_email || "Not provided"}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1ad9c8] px-5 py-3 text-sm font-semibold text-[#07252d] transition hover:bg-[#63e8d8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save size={16} />
                        {saving ? "Saving..." : "Save profile"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#2d445f] bg-transparent px-5 py-3 text-sm font-medium text-[#ebf3ff] transition hover:bg-[#152d43] disabled:opacity-60"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </section>
                </form>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.8fr]">
                  <section className="rounded-[28px] border border-[#2b4058] bg-[#0b1c2f] p-5 lg:p-6">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#13324a] text-[#73f0dc]">
                        <GraduationCap className="h-5 w-5" />
                      </span>
                      <h2 className="text-xl font-semibold text-[#edf5ff]">Student details</h2>
                    </div>

                    <div className="space-y-4 text-sm text-[#dceafc]">
                      <div className="flex items-center justify-between border-b border-[#223b53] pb-3">
                        <span className="text-[#8fa9c0]">Admission No.</span>
                        <span className="font-medium text-[#f3f8ff]">
                          {student.admission_no || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#223b53] pb-3">
                        <span className="text-[#8fa9c0]">Roll No.</span>
                        <span className="font-medium text-[#f3f8ff]">
                          {student.roll_no || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#223b53] pb-3">
                        <span className="text-[#8fa9c0]">Class</span>
                        <span className="font-medium text-[#f3f8ff]">
                          {student.class_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#223b53] pb-3">
                        <span className="text-[#8fa9c0]">Section</span>
                        <span className="font-medium text-[#f3f8ff]">
                          {student.section_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[#8fa9c0]">Parent/Guardian</span>
                        <span className="font-medium text-[#f3f8ff]">
                          {student.guardian_name || "N/A"}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-[#2b4058] bg-[#0b1c2f] p-5 lg:p-6">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#13324a] text-[#73f0dc]">
                        <Clock3 className="h-5 w-5" />
                      </span>
                      <h2 className="text-xl font-semibold text-[#edf5ff]">Contact & address</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#29415d] bg-[#0d2339] p-4">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8ea9c2]">
                          Email
                        </div>
                        <div className="flex items-start gap-2 text-[17px] leading-7 text-[#edf5ff]">
                          <Mail className="mt-1 h-4 w-4 shrink-0 text-[#73f0dc]" />
                          <span>{student.student_mail || student.school_email || "Not provided"}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#29415d] bg-[#0d2339] p-4">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8ea9c2]">
                          Phone
                        </div>
                        <div className="text-[17px] leading-7 text-[#edf5ff]">
                          {student.phone_no || "Not provided"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#29415d] bg-[#0d2339] p-4 md:col-span-2">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8ea9c2]">
                          Address
                        </div>
                        <div className="flex items-start gap-2 text-[17px] leading-7 text-[#edf5ff]">
                          <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#73f0dc]" />
                          <span>
                            {student.current_address || student.address || student.home_full_address || "Not provided"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#29415d] bg-[#0d2339] p-4 md:col-span-2">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8ea9c2]">
                          Guardian contact
                        </div>
                        <div className="text-[17px] leading-7 text-[#edf5ff]">
                          {student.guardian_name || "Not provided"}
                          {student.guardian_phone ? ` • ${student.guardian_phone}` : ""}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StudentPortalPage;
