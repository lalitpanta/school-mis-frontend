import { useEffect, useState } from "react";
import {
  GraduationCap,
  Mail,
  MapPin,
  UserCircle2,
  Pencil,
  Save,
  X,
  LogOut,
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

  return (
    <main className="min-h-screen bg-[#0b1725] px-4 py-8 text-[#edf4ff] sm:px-6">
      <div className="mx-auto max-w-[1500px] overflow-hidden border border-[#2e4156] bg-[#0d1b2d] shadow-[0_0_0_1px_rgba(148,163,184,0.15)]">
        <header className="flex flex-col gap-5 border-b border-[#334a63] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#1ab7b3] text-3xl font-bold text-[#0d1b2d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9bb0c5]">
                Student portal
              </div>
              <div className="mt-1 text-4xl font-light tracking-tight text-[#ebf5ff]">
                {initials}
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#44d7c9] bg-[#45dcc8] px-5 py-3 text-sm font-medium text-[#0b1725] transition hover:bg-[#6be8d6]"
              >
                <Pencil size={16} />
                <span>Edit my profile</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/student/login", { replace: true });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#4b607b] bg-transparent px-5 py-3 text-sm font-medium text-[#ebf5ff] transition hover:bg-[#162e43]"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <div className="border-t-[3px] border-[#1fe4d7]" />

        <div className="px-6 pb-8 pt-8">
          {saveMessage && (
            <div
              role="status"
              className="mb-5 border-l-2 border-[#5ef0d7] bg-[#0f2d37] px-4 py-3 text-sm text-[#b8f7ec]"
            >
              {saveMessage}
            </div>
          )}

          {editing ? (
            <form onSubmit={saveProfile} className="space-y-6 py-2">
              <section className="space-y-5 pb-6">
                <h2 className="text-xl font-semibold text-[#edf4ff]">Contact and address</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {[ ["phone_no", "Phone number", "tel"], ["current_address", "Current address", "text"], ["address", "Permanent address", "text"], ["home_district", "Home district", "text"], ["home_municipality", "Municipality", "text"], ["home_ward", "Ward", "text"], ["home_full_address", "Home address details", "text"], ].map(([name, label, type]) => (
                    <label key={name} className="block text-sm text-[#cfe0ef]">
                      {label}
                      <input
                        name={name}
                        type={type}
                        value={profileForm[name] || ""}
                        onChange={updateField}
                        className="mt-2 w-full rounded-xl border border-[#334a63] bg-[#0b1725] px-3 py-3 text-base text-[#edf4ff] outline-none transition focus:border-[#5fe4d8]"
                      />
                    </label>
                  ))}
                  <div className="text-sm text-[#d9e6f5]">
                    <div className="mb-2 text-xs uppercase tracking-[0.22em] text-[#8ea5bb]">
                      Student login email
                    </div>
                    <div className="rounded-xl border border-[#334a63] bg-[#0b1725] px-3 py-3 text-[#dfeeff]">
                      {student.student_mail || student.school_email || "Not provided"}
                    </div>
                    <div className="mt-2 text-xs text-[#8ea5bb]">
                      Contact your school to change your login email.
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-5 pb-4">
                <h2 className="text-xl font-semibold text-[#edf4ff]">Guardian contact</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {[ ["guardian_name", "Guardian name", "text"], ["guardian_email", "Guardian email", "email"], ["guardian_phone", "Guardian phone", "tel"], ].map(([name, label, type]) => (
                    <label key={name} className="block text-sm text-[#dfeaf7]">
                      {label}
                      <input
                        name={name}
                        type={type}
                        value={profileForm[name] || ""}
                        onChange={updateField}
                        className="mt-2 w-full rounded-xl border border-[#334a63] bg-[#0b1725] px-3 py-3 text-base text-[#edf4ff] outline-none transition focus:border-[#5fe4d8]"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#45dcc8] px-5 py-3 text-sm font-medium text-[#0b1725] transition hover:bg-[#6fe7d7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save profile"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#334a63] bg-transparent px-5 py-3 text-sm font-medium text-[#dfeaf7] transition hover:bg-[#142b3f] disabled:opacity-60"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.8fr] pt-6">
              <div className="pr-0 lg:pr-10">
                <div className="mb-8 flex items-center gap-3 text-[19px] font-semibold text-[#edf4ff]">
                  <span className="inline-flex h-5 w-5 items-center justify-center text-[#8af2d7]">
                    <UserCircle2 className="h-5 w-5" />
                  </span>
                  <span>Profile overview</span>
                </div>

                <div className="space-y-5 text-[16px] text-[#dfeaf7]">
                  <div className="flex items-center gap-6">
                    <div className="w-32 text-[#a9bad1]">Admission No.</div>
                    <div className="text-[#edf4ff]">{student.admission_no || "N/A"}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-32 text-[#a9bad1]">Roll No.</div>
                    <div className="text-[#edf4ff]">{student.roll_no || "N/A"}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-32 text-[#a9bad1]">Class</div>
                    <div className="text-[#edf4ff]">{student.class_name || "N/A"}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-8 flex items-center gap-3 text-[19px] font-semibold text-[#edf4ff]">
                  <span className="inline-flex h-5 w-5 items-center justify-center text-[#8af2d7]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <span>Contact details</span>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 border-b border-[#2d3f56] pb-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8ea5bb]">
                      Student email
                    </div>
                    <div className="text-[19px] leading-7 text-[#edf4ff]">
                      {student.student_mail || student.school_email || "Not provided"}
                    </div>
                  </div>

                  <div className="space-y-2 border-b border-[#2d3f56] pb-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8ea5bb]">
                      Phone
                    </div>
                    <div className="text-[19px] leading-7 text-[#edf4ff]">
                      {student.phone_no || "Not provided"}
                    </div>
                  </div>

                  <div className="space-y-2 border-b border-[#2d3f56] pb-3 md:col-span-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8ea5bb]">
                      Address
                    </div>
                    <div className="flex items-start gap-2 text-[19px] leading-7 text-[#edf4ff]">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#8af2d7]" />
                      <span>
                        {student.current_address ||
                          student.address ||
                          student.home_full_address ||
                          "Not provided"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-b border-[#2d3f56] pb-3 md:col-span-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8ea5bb]">
                      Guardian
                    </div>
                    <div className="text-[19px] leading-7 text-[#edf4ff]">
                      {student.guardian_name || "Not provided"}
                      {student.guardian_phone ? ` • ${student.guardian_phone}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default StudentPortalPage;
