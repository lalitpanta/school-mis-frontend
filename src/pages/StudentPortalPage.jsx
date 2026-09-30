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

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400 text-emerald-950">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-300">
                Student portal
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                {student.full_name || "Student"}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
              >
                <Pencil size={16} /> Edit my profile
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/student/login", { replace: true });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        {saveMessage && (
          <div
            role="status"
            className="border-l-2 border-emerald-400 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
          >
            {saveMessage}
          </div>
        )}

        {editing ? (
          <form onSubmit={saveProfile} className="space-y-6">
            <section className="border-b border-slate-800 pb-6">
              <h2 className="text-lg font-semibold">Contact and address</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["phone_no", "Phone number", "tel"],
                  ["current_address", "Current address", "text"],
                  ["address", "Permanent address", "text"],
                  ["home_district", "Home district", "text"],
                  ["home_municipality", "Municipality", "text"],
                  ["home_ward", "Ward", "text"],
                  ["home_full_address", "Home address details", "text"],
                ].map(([name, label, type]) => (
                  <label key={name} className="block text-sm text-slate-300">
                    {label}
                    <input
                      name={name}
                      type={type}
                      value={profileForm[name] || ""}
                      onChange={updateField}
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
                    />
                  </label>
                ))}
                <div className="text-sm text-slate-300">
                  Student login email
                  <p className="mt-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-400">
                    {student.student_mail ||
                      student.school_email ||
                      "Not provided"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Contact your school to change your login email.
                  </p>
                </div>
              </div>
            </section>
            <section className="border-b border-slate-800 pb-6">
              <h2 className="text-lg font-semibold">Guardian contact</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["guardian_name", "Guardian name", "text"],
                  ["guardian_email", "Guardian email", "email"],
                  ["guardian_phone", "Guardian phone", "tel"],
                ].map(([name, label, type]) => (
                  <label key={name} className="block text-sm text-slate-300">
                    {label}
                    <input
                      name={name}
                      type={type}
                      value={profileForm[name] || ""}
                      onChange={updateField}
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
                    />
                  </label>
                ))}
              </div>
            </section>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-300 disabled:opacity-60"
              >
                <Save size={16} /> {saving ? "Saving..." : "Save profile"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="border-t-2 border-emerald-400 py-5">
              <div className="mb-4 flex items-center gap-3 text-lg font-medium text-white">
                <UserCircle2 className="h-5 w-5 text-indigo-300" />
                Profile overview
              </div>
              <dl className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <dt>Admission No.</dt>
                  <dd className="font-medium text-white">
                    {student.admission_no || "N/A"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Roll No.</dt>
                  <dd className="font-medium text-white">
                    {student.roll_no || "N/A"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Class</dt>
                  <dd className="font-medium text-white">
                    {student.class_name || "N/A"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="border-t-2 border-slate-700 py-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-3 text-lg font-medium text-white">
                <Mail className="h-5 w-5 text-indigo-300" />
                Contact details
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border-b border-slate-800 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Student email
                  </p>
                  <p className="mt-2 text-white">
                    {student.student_mail ||
                      student.school_email ||
                      "Not provided"}
                  </p>
                </div>
                <div className="border-b border-slate-800 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Phone
                  </p>
                  <p className="mt-2 text-white">
                    {student.phone_no || "Not provided"}
                  </p>
                </div>
                <div className="border-b border-slate-800 py-3 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Address
                  </p>
                  <p className="mt-2 flex items-start gap-2 text-white">
                    <MapPin className="mt-0.5 h-4 w-4 text-indigo-300" />
                    {student.current_address ||
                      student.address ||
                      student.home_full_address ||
                      "Not provided"}
                  </p>
                </div>
                <div className="border-b border-slate-800 py-3 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Guardian
                  </p>
                  <p className="mt-2 text-white">
                    {student.guardian_name || "Not provided"}{" "}
                    {student.guardian_phone
                      ? `• ${student.guardian_phone}`
                      : ""}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default StudentPortalPage;
