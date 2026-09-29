import { useEffect, useState } from "react";
import { GraduationCap, Mail, Phone, MapPin, UserCircle2 } from "lucide-react";
import { getCurrentStudent } from "../api/studentsApi";

const StudentPortalPage = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudent = async () => {
      try {
        setLoading(true);
        const response = await getCurrentStudent();
        setStudent(response?.data?.data || null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Student portal
            </p>
            <h1 className="text-2xl font-semibold text-white">
              {student.full_name || "Student"}
            </h1>
          </div>
        </div>
        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
          Active student account
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
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
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-3 text-lg font-medium text-white">
            <Mail className="h-5 w-5 text-indigo-300" />
            Contact details
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Student email
              </p>
              <p className="mt-2 text-white">
                {student.student_mail || student.school_email || "Not provided"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Phone
              </p>
              <p className="mt-2 text-white">
                {student.phone_no || "Not provided"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4 md:col-span-2">
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
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Guardian
              </p>
              <p className="mt-2 text-white">
                {student.guardian_name || "Not provided"}{" "}
                {student.guardian_phone ? `• ${student.guardian_phone}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortalPage;
