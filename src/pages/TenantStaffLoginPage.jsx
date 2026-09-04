import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  Building2,
  Users,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  BarChart3,
  GraduationCap,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  unifiedLogin,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
} from "../api/authApi";
import { MODULE_ROUTE_MAP } from "../utils/constants";
import toast from "react-hot-toast";

const TenantStaffLoginPage = () => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState("request");
  const [forgotTenantSlug, setForgotTenantSlug] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { tenantSlug: "", email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      const response = await unifiedLogin(
        data.email,
        data.password,
        data.tenantSlug,
      );

      if (response.success) {
        const userType = response.userType;
        const token = response.data.token;

        let userData = null;
        if (userType === "tenant") {
          userData = response.data.tenant;
        } else if (userType === "staff") {
          userData = response.data.user;
        }

        loginUser(userData, token, userType);
        toast.success(
          `${userType.charAt(0).toUpperCase() + userType.slice(1)} login successful!`,
        );

        const modules = userData?.modules || [];
        const moduleOrder = [
          "dashboard",
          "calendar",
          "attendance",
          "teacher",
          "student",
          "employee",
          "settings",
          "results",
          "result_portal",
          "daily_reports",
        ];
        const firstAllowed = moduleOrder.find((key) => modules.includes(key));
        const target = MODULE_ROUTE_MAP[firstAllowed] || "/";
        navigate(target);
      }
    } catch (err) {
      const errorMsg = err?.message || "Login failed. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      reset({ tenantSlug: data.tenantSlug, email: data.email, password: "" });
    }
  };

  const resetForgotPasswordState = () => {
    setForgotStep("request");
    setForgotTenantSlug("");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotMessage("");
  };

  const handleForgotPasswordRequest = async () => {
    if (!forgotTenantSlug || !forgotEmail) {
      setForgotMessage("Please enter your tenant slug and email.");
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      const response = await requestPasswordReset(
        forgotEmail,
        forgotTenantSlug,
      );
      setForgotMessage(response.message || "OTP sent successfully.");
      setForgotStep("verify");
      toast.success(response.message || "OTP sent successfully.");
    } catch (err) {
      const message = err?.message || "Unable to send OTP.";
      setForgotMessage(message);
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotPasswordVerify = async () => {
    if (!forgotOtp) {
      setForgotMessage("Please enter the OTP sent to your email.");
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      const response = await verifyPasswordResetOtp(
        forgotEmail,
        forgotOtp,
        forgotTenantSlug,
      );
      setForgotMessage(response.message || "OTP verified successfully.");
      setForgotStep("reset");
      toast.success(response.message || "OTP verified successfully.");
    } catch (err) {
      const message = err?.message || "OTP verification failed.";
      setForgotMessage(message);
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotPasswordReset = async () => {
    if (!forgotOtp || !forgotNewPassword || !forgotConfirmPassword) {
      setForgotMessage("Please complete all password fields.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMessage("New passwords do not match.");
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotMessage("Password must be at least 6 characters long.");
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      const response = await resetPasswordWithOtp(
        forgotEmail,
        forgotOtp,
        forgotNewPassword,
        forgotTenantSlug,
      );

      toast.success(response.message || "Password reset successful.");
      setForgotMessage(response.message || "Password reset successful.");
      setTimeout(() => {
        setShowForgotModal(false);
        resetForgotPasswordState();
      }, 900);
    } catch (err) {
      const message = err?.message || "Password reset failed.";
      setForgotMessage(message);
      toast.error(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const featureCards = [
    {
      icon: GraduationCap,
      title: "Student Lifecycle",
      text: "Track admissions, academic records, attendance, and performance in one place.",
    },
    {
      icon: CalendarDays,
      title: "Academic Calendar",
      text: "Manage terms, school holidays, and day classifications with clarity.",
    },
    {
      icon: BarChart3,
      title: "Smart Reporting",
      text: "Monitor results, trends, and operational performance with live dashboards.",
    },
  ];

  return (
    <div className="mis-login-page min-h-screen text-[var(--text-1)]" style={{ background: "var(--bg-main)" }}>
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/80 shadow-[0_30px_90px_rgba(15,23,42,0.75)] backdrop-blur-md lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(2,6,23,1))] p-8 lg:flex lg:flex-col lg:justify-between xl:p-10">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute -left-10 top-12 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            <div className="relative">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
                  <Building2 size={26} className="text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-indigo-200/80">
                    SchoolMIS
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Tenant Portal
                  </h1>
                </div>
              </div>

              <div className="max-w-md">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
                  <ShieldCheck size={14} />
                  Professional school operations
                </p>
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
                  Everything your school needs to run smoothly.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-300">
                  Centralize student data, calendars, attendance, employee
                  records, and academic performance into one secure digital
                  platform.
                </p>
              </div>

              <div className="mt-8 grid gap-4">
                {featureCards.map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="mis-login-feature flex items-start gap-3 rounded-2xl p-4"
                  >
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-300">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8 flex items-center justify-between rounded-2xl border border-emerald-400/25 bg-emerald-500/8 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">
                  Platform status
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  All systems online
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200">
                <CheckCircle2 size={14} />
                Secure access
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center bg-[#0b1220] p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-slate-900/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                  <Users size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Access portal
                  </p>
                  <h2 className="text-2xl font-bold text-white">
                    Tenant / Staff Login
                  </h2>
                </div>
              </div>

              <p className="mb-6 text-sm leading-6 text-slate-300">
                Enter your tenant name, email, and password to continue to your
                dashboard.
              </p>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Tenant name / slug
                  </label>
                  <input
                    {...register("tenantSlug", {
                      required: "Tenant name/slug is required",
                      pattern: {
                        value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                        message:
                          "Use lowercase letters, numbers, and hyphens only",
                      },
                    })}
                    type="text"
                    placeholder="tenant-name"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    style={{
                      borderColor: errors.tenantSlug
                        ? "#f87171"
                        : "rgba(255,255,255,0.08)",
                    }}
                  />
                  {errors.tenantSlug && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.tenantSlug.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Email
                  </label>
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: "Invalid email",
                      },
                    })}
                    type="email"
                    placeholder="tenant@school.local"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    style={{
                      borderColor: errors.email
                        ? "#f87171"
                        : "rgba(255,255,255,0.08)",
                    }}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register("password", {
                        required: "Password is required",
                        minLength: { value: 4, message: "Min 4 characters" },
                      })}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      className="w-full rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 pr-12 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                      style={{
                        borderColor: errors.password
                          ? "#f87171"
                          : "rgba(255,255,255,0.08)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-200"
                    >
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotTenantSlug("");
                      setShowForgotModal(true);
                    }}
                    className="text-sm font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                  Reset access
                </p>
                <h3 className="mt-1 text-2xl font-bold text-white">
                  Forgot Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  resetForgotPasswordState();
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {forgotMessage && (
              <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-200">
                {forgotMessage}
              </div>
            )}

            {forgotStep === "request" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Tenant slug
                  </label>
                  <input
                    type="text"
                    value={forgotTenantSlug}
                    onChange={(e) => setForgotTenantSlug(e.target.value)}
                    placeholder="tenant-name"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@tenant.school"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
                  />
                </div>
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotPasswordRequest}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {forgotLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            )}

            {forgotStep === "verify" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
                  />
                </div>
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotPasswordVerify}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {forgotLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}

            {forgotStep === "reset" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    New password
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
                  />
                </div>
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotPasswordReset}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantStaffLoginPage;
