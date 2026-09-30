import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, LockKeyhole, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { studentLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const StudentLoginPage = () => {
  const [searchParams] = useSearchParams();
  const [tenantSlug, setTenantSlug] = useState(
    searchParams.get("tenantSlug") || "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser, userType } = useAuth();

  useEffect(() => {
    if (userType === "student") navigate("/student-portal", { replace: true });
  }, [userType, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await studentLogin(tenantSlug.trim(), email.trim(), password);
      loginUser(response.data.user, response.data.token, "student");
      toast.success("Welcome to your student portal.");
      navigate("/student-portal", { replace: true });
    } catch (loginError) {
      const message = loginError.message || "Check your school, email, and password.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[min(760px,calc(100vh-5rem))] max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 md:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between bg-emerald-950 p-10 md:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-400 text-emerald-950">
              <GraduationCap size={25} />
            </span>
            <span className="text-sm font-semibold tracking-wide">SCHOOLMIS</span>
          </div>
          <div className="max-w-md">
            <p className="text-sm font-medium uppercase tracking-widest text-emerald-300">
              Student access
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Your school life, in one place.
            </h1>
            <p className="mt-4 leading-7 text-emerald-100/75">
              Sign in to view your profile and personal academic information.
            </p>
          </div>
          <p className="text-xs text-emerald-200/60">Private access for students</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400 text-emerald-950">
                <GraduationCap size={23} />
              </span>
              <span className="text-sm font-semibold tracking-wide">SCHOOLMIS STUDENT</span>
            </div>
            <p className="text-sm font-medium text-emerald-300">STUDENT PORTAL</p>
            <h2 className="mt-2 text-3xl font-semibold">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Use the school slug and the email address where your credentials were sent.
            </p>

            {error && (
              <div role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block text-sm text-slate-300">
                School slug
                <input
                  required
                  autoComplete="organization"
                  value={tenantSlug}
                  onChange={(event) => setTenantSlug(event.target.value)}
                  placeholder="your-school"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-emerald-400"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Student email
                <span className="relative mt-2 block">
                  <Mail className="absolute left-3 top-3.5 text-slate-500" size={17} />
                  <input
                    required
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-white outline-none focus:border-emerald-400"
                  />
                </span>
              </label>
              <label className="block text-sm text-slate-300">
                Password
                <span className="relative mt-2 block">
                  <LockKeyhole className="absolute left-3 top-3.5 text-slate-500" size={17} />
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-white outline-none focus:border-emerald-400"
                  />
                </span>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in to student portal"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-4 text-sm">
              <Link
                to={`/student/reset-password${tenantSlug ? `?tenant=${encodeURIComponent(tenantSlug)}` : ""}`}
                className="text-emerald-300 hover:text-emerald-200"
              >
                Forgot password?
              </Link>
              <Link to="/login" className="text-slate-400 hover:text-white">
                Staff login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default StudentLoginPage;