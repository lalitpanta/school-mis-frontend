import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  resetPasswordWithOtp,
  requestPasswordReset,
  unifiedLogin,
  verifyPasswordResetOtp,
} from "../api/authApi";

const roleName = (role) =>
  String(typeof role === "string" ? role : role?.role_name || "")
    .trim()
    .toLowerCase();

const TeacherLoginPage = () => {
  const [searchParams] = useSearchParams();
  const [tenantSlug, setTenantSlug] = useState(searchParams.get("tenantSlug") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("request");
  const [forgotEmail, setForgotEmail] = useState(searchParams.get("email") || "");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser, user, userType } = useAuth();

  useEffect(() => {
    if (
      userType === "staff" &&
      user?.teacherId &&
      user?.roles?.some((role) => roleName(role) === "teacher")
    ) {
      navigate("/teacher-portal", { replace: true });
    }
  }, [navigate, user, userType]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await unifiedLogin(email.trim(), password, tenantSlug.trim());
      const teacher = response.data?.user;
      if (
        response.userType !== "staff" ||
        !teacher?.teacherId ||
        !teacher.roles?.some((role) => roleName(role) === "teacher")
      ) {
        throw new Error("This sign-in is for linked Teacher accounts only.");
      }
      loginUser(teacher, response.data.token, "staff");
      toast.success("Welcome to your teacher portal.");
      navigate("/teacher-portal", { replace: true });
    } catch (loginError) {
      const message = loginError.message || "Check your school, email, and password.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (event) => {
    event.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");
    try {
      if (forgotStep === "request") {
        const result = await requestPasswordReset(forgotEmail.trim(), tenantSlug.trim());
        setForgotStep("verify");
        setForgotMessage(
          result.otp
            ? `${result.message || "Email delivery is unavailable."} Development OTP: ${result.otp}`
            : result.message || "If the teacher account exists, a reset code was sent.",
        );
      } else if (forgotStep === "verify") {
        const result = await verifyPasswordResetOtp(
          forgotEmail.trim(),
          forgotOtp.trim(),
          tenantSlug.trim(),
        );
        setForgotStep("reset");
        setForgotMessage(result.message || "Code verified. Choose a new password.");
      } else {
        if (forgotPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        if (forgotPassword !== forgotConfirm) {
          throw new Error("Passwords do not match.");
        }
        const result = await resetPasswordWithOtp(
          forgotEmail.trim(),
          forgotOtp.trim(),
          forgotPassword,
          tenantSlug.trim(),
        );
        setForgotMessage(result.message || "Password reset successfully.");
        setForgotStep("complete");
      }
    } catch (requestError) {
      setForgotMessage(requestError.message || "Unable to complete password reset.");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotStep("request");
    setForgotOtp("");
    setForgotPassword("");
    setForgotConfirm("");
    setForgotMessage("");
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-8 text-primary sm:px-6">
      <div className="mx-auto grid min-h-[min(760px,calc(100vh-4rem))] max-w-5xl overflow-hidden rounded-2xl border border-default bg-surface md:grid-cols-[1fr_0.9fr]">
        <section className="hidden flex-col justify-between bg-success p-10 md:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-success text-success">
              <GraduationCap size={25} />
            </span>
            <span className="text-sm font-semibold tracking-wide">SCHOOLMIS</span>
          </div>
          <div className="max-w-md">
            <p className="text-sm font-medium uppercase tracking-widest text-success">
              Teacher access
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Your classroom, clearly in view.
            </h1>
            <p className="mt-4 leading-7 text-success">
              Open your classes, courses, academic calendar, results, attendance, and leave requests.
            </p>
            <div className="mt-8 flex gap-3 text-sm text-success">
              <span className="inline-flex items-center gap-2"><BookOpen size={16} /> Teaching</span>
              <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> Academic year</span>
            </div>
          </div>
          <p className="text-xs text-success">Private access for linked teacher accounts</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <GraduationCap className="text-success" size={26} />
              <span className="text-sm font-semibold tracking-wide">SCHOOLMIS TEACHER</span>
            </div>
            {!forgotOpen ? (
              <>
                <p className="text-sm font-medium text-success">TEACHER PORTAL</p>
                <h2 className="mt-2 text-3xl font-semibold">Sign in</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Use the school slug and the email address linked to your teacher account.
                </p>
                {error && <div role="alert" className="mt-5 rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}
                <form onSubmit={submitLogin} className="mt-7 space-y-5">
                  <label className="block text-sm text-muted">
                    School slug
                    <input required autoComplete="organization" value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} placeholder="your-school" className="mt-2 w-full rounded-lg border border-default bg-surface px-3 py-3 text-primary outline-none focus:border-success" />
                  </label>
                  <label className="block text-sm text-muted">
                    Teacher email
                    <span className="relative mt-2 block">
                      <Mail className="absolute left-3 top-3.5 text-muted" size={17} />
                      <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teacher@example.com" className="w-full rounded-lg border border-default bg-surface py-3 pl-10 pr-3 text-primary outline-none focus:border-success" />
                    </span>
                  </label>
                  <label className="block text-sm text-muted">
                    Password
                    <span className="relative mt-2 block">
                      <LockKeyhole className="absolute left-3 top-3.5 text-muted" size={17} />
                      <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="w-full rounded-lg border border-default bg-surface py-3 pl-10 pr-3 text-primary outline-none focus:border-success" />
                    </span>
                  </label>
                  <button type="submit" disabled={loading} className="w-full rounded-lg bg-success px-4 py-3 font-semibold text-success transition hover:bg-success disabled:cursor-wait disabled:opacity-60">
                    {loading ? "Signing in..." : "Sign in to teacher portal"}
                  </button>
                </form>
                <div className="mt-6 flex items-center justify-between gap-4 text-sm">
                  <button type="button" onClick={() => { setForgotEmail(email); setForgotOpen(true); }} className="text-success hover:text-success">Forgot password?</button>
                  <Link to={`/login${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ""}`} className="text-muted hover:text-primary">Staff login</Link>
                </div>
                <Link to={`/student/login${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ""}`} className="mt-4 inline-flex items-center gap-2 text-sm text-muted hover:text-muted"><ArrowLeft size={15} /> Student sign in</Link>
              </>
            ) : (
              <>
                <button type="button" onClick={closeForgot} className="mb-6 inline-flex items-center gap-2 text-sm text-success hover:text-primary"><ArrowLeft size={16} /> Back to teacher sign in</button>
                <p className="text-sm font-medium text-success">ACCOUNT SECURITY</p>
                <h2 className="mt-2 text-3xl font-semibold">Reset password</h2>
                <p className="mt-2 text-sm leading-6 text-muted">We’ll send a verification code to the email linked to your account.</p>
                {forgotMessage && <div role="status" className="mt-5 rounded-lg border border-success bg-success px-4 py-3 text-sm text-success">{forgotMessage}</div>}
                <form onSubmit={submitForgot} className="mt-7 space-y-5">
                  {forgotStep === "request" && <label className="block text-sm text-muted">Teacher email<input required type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-default bg-surface px-3 py-3 text-primary outline-none focus:border-success" /></label>}
                  {forgotStep === "verify" && <label className="block text-sm text-muted">Email code<input required inputMode="numeric" autoComplete="one-time-code" value={forgotOtp} onChange={(event) => setForgotOtp(event.target.value)} className="mt-2 w-full rounded-lg border border-default bg-surface px-3 py-3 text-primary outline-none focus:border-success" /></label>}
                  {forgotStep === "reset" && <>
                    <label className="block text-sm text-muted">New password<span className="relative mt-2 block"><KeyRound className="absolute left-3 top-3.5 text-muted" size={17} /><input required minLength={8} type="password" autoComplete="new-password" value={forgotPassword} onChange={(event) => setForgotPassword(event.target.value)} className="w-full rounded-lg border border-default bg-surface py-3 pl-10 pr-3 text-primary outline-none focus:border-success" /></span></label>
                    <label className="block text-sm text-muted">Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={forgotConfirm} onChange={(event) => setForgotConfirm(event.target.value)} className="mt-2 w-full rounded-lg border border-default bg-surface px-3 py-3 text-primary outline-none focus:border-success" /></label>
                  </>}
                  {forgotStep !== "complete" && <button type="submit" disabled={forgotLoading} className="w-full rounded-lg bg-success px-4 py-3 font-semibold text-success disabled:opacity-60">{forgotLoading ? "Please wait..." : forgotStep === "request" ? "Email verification code" : forgotStep === "verify" ? "Verify code" : "Update password"}</button>}
                  {forgotStep === "complete" && <button type="button" onClick={closeForgot} className="w-full rounded-lg bg-success px-4 py-3 font-semibold text-success">Return to sign in</button>}
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default TeacherLoginPage;
