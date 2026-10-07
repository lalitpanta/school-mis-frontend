import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, GraduationCap, KeyRound, Mail } from "lucide-react";
import toast from "react-hot-toast";
import {
  requestStudentPasswordReset,
  resetStudentPassword,
  resetTenantUserPassword,
} from "../api/authApi";

const StudentPasswordResetPage = () => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const isTenantUserFlow = pathname === "/reset-password";
  const token = searchParams.get("token") || "";
  const [tenantSlug, setTenantSlug] = useState(
    searchParams.get("tenant") || searchParams.get("tenantSlug") || "",
  );
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      if (token) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const result = isTenantUserFlow
          ? await resetTenantUserPassword(tenantSlug, token, password)
          : await resetStudentPassword(tenantSlug, token, password);
        toast.success(result.message || "Password updated.");
        const loginParams = new URLSearchParams({ tenantSlug });
        if (isTenantUserFlow && email) loginParams.set("email", email);
        navigate(
          `${isTenantUserFlow ? "/login" : "/student/login"}?${loginParams.toString()}`,
          { replace: true },
        );
      } else {
        const result = await requestStudentPasswordReset(tenantSlug, email);
        setSent(true);
        setMessage(
          result.message || "If the student account exists, a reset link will be emailed.",
        );
      }
    } catch (requestError) {
      const detail = requestError.message || "Unable to process this request.";
      setError(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-10 text-primary">
      <div className="mx-auto flex min-h-[70vh] max-w-4xl overflow-hidden rounded-2xl border border-default bg-surface md:grid md:grid-cols-[0.8fr_1.2fr]">
        <section className="hidden flex-col justify-between bg-success p-8 md:flex">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success text-success">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-success">
              Account security
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">
              {token ? "Choose a new password." : "Get back into your portal."}
            </h1>
          </div>
          <Link to={isTenantUserFlow ? "/login" : "/student/login"} className="inline-flex items-center gap-2 text-sm text-success hover:text-primary">
            <ArrowLeft size={16} /> {isTenantUserFlow ? "School portal sign in" : "Student sign in"}
          </Link>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <GraduationCap className="text-success" size={26} />
              <span className="text-sm font-semibold">
                {isTenantUserFlow ? "SCHOOL PORTAL" : "STUDENT PORTAL"}
              </span>
            </div>
            <p className="text-sm font-medium text-success">
              {isTenantUserFlow ? "ACCOUNT SETUP" : "PASSWORD RESET"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {token
                ? isTenantUserFlow
                  ? "Set your portal password"
                  : "Set a new password"
                : "Request a reset link"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {token
                ? `Choose a new password for your ${isTenantUserFlow ? "school portal" : "student portal"} account. This link can only be used once.`
                : "Enter your school slug and student email. If the account exists, we’ll email a secure reset link."}
            </p>

            {message && (
              <div role="status" className="mt-5 rounded-lg border border-success bg-success px-4 py-3 text-sm text-success">
                {message}
              </div>
            )}
            {error && (
              <div role="alert" className="mt-5 rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {isTenantUserFlow && !token && (
              <div className="mt-6 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
                This setup link is missing its token. Request a new invitation from your school administrator.
              </div>
            )}

            {!sent && (!isTenantUserFlow || token) && (
              <form onSubmit={submit} className="mt-7 space-y-5">
                {!token && (
                  <>
                    <label className="block text-sm text-muted">
                      School slug
                      <input
                        required
                        value={tenantSlug}
                        onChange={(event) => setTenantSlug(event.target.value)}
                        placeholder="your-school"
                        className="mt-2 w-full rounded-lg border border-default bg-surface px-3 py-3 text-primary outline-none focus:border-success"
                      />
                    </label>
                    <label className="block text-sm text-muted">
                      Student email
                      <span className="relative mt-2 block">
                        <Mail className="absolute left-3 top-3.5 text-muted" size={17} />
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="student@example.com"
                          className="w-full rounded-lg border border-default bg-surface py-3 pl-10 pr-3 text-primary outline-none focus:border-success"
                        />
                      </span>
                    </label>
                  </>
                )}
                {token && (
                  <>
                    <label className="block text-sm text-muted">
                      New password
                      <span className="relative mt-2 block">
                        <KeyRound className="absolute left-3 top-3.5 text-muted" size={17} />
                        <input
                          required
                          minLength={8}
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="w-full rounded-lg border border-default bg-surface py-3 pl-10 pr-3 text-primary outline-none focus:border-success"
                        />
                      </span>
                    </label>
                    <label className="block text-sm text-muted">
                      Confirm new password
                      <input
                        required
                        minLength={8}
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-default bg-surface px-3 py-3 text-primary outline-none focus:border-success"
                      />
                    </label>
                  </>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-success px-4 py-3 font-semibold text-success hover:bg-success disabled:cursor-wait disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : token
                      ? "Update password"
                      : "Email reset link"}
                </button>
              </form>
            )}

            <Link
              to={`${isTenantUserFlow ? "/login" : "/student/login"}${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ""}`}
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-primary"
            >
              <ArrowLeft size={16} /> Back to {isTenantUserFlow ? "school" : "student"} sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default StudentPasswordResetPage;