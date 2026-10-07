import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Shield, AlertCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  adminLogin,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
} from "../api/authApi";
import toast from "react-hot-toast";

const SystemLoginPage = () => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState("request");
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
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      const response = await adminLogin(data.email, data.password);

      if (response.success) {
        const userType = response.userType || "admin";
        const token = response.data?.token;
        const userData =
          response.data?.admin || response.data?.user || response.data?.tenant;

        loginUser(userData, token, userType);
        toast.success("System login successful!");

        if (userData?.type === "super_admin") {
          navigate("/superadmin/dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      }
    } catch (err) {
      const errorMsg = err?.message || "System login failed. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      reset({ email: data.email, password: "" });
    }
  };

  const resetForgotPasswordState = () => {
    setForgotStep("request");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotMessage("");
  };

  const handleForgotPasswordRequest = async () => {
    if (!forgotEmail) {
      setForgotMessage("Please enter your system admin email.");
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      const response = await requestPasswordReset(forgotEmail, "");
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
      const response = await verifyPasswordResetOtp(forgotEmail, forgotOtp, "");
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
        "",
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

  return (
    <div
      className="mis-login-page min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "var(--accent-soft)" }}
    >
      <div className="text-center mb-7">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Shield size={30} className="text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            System Administration
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--accent)" }}>
          Super admin and system admin login portal
        </p>
      </div>

      <div
        className="w-full max-w-md rounded-2xl p-7"
        style={{
          background: "var(--accent-soft)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <Shield size={20} className="text-accent" />
          <h2 className="text-xl font-bold text-primary">System Admin Login</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--accent)" }}>
          Sign in with your system email and password.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger-soft border border-danger flex gap-3">
            <AlertCircle
              size={18}
              className="text-danger mt-0.5 flex-shrink-0"
            />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="mb-4 p-3 rounded-lg bg-accent-soft border border-accent text-xs text-accent">
          <p className="font-semibold mb-1">Demo System Admin:</p>
          <p>Email: admin@system.local</p>
          <p>Password: admin123</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--accent)" }}
            >
              Email
            </label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
              })}
              type="email"
              placeholder="admin@system.local"
              className="w-full px-4 py-3 rounded-xl text-sm text-primary outline-none transition-all duration-200"
              style={{
                background: "var(--accent-soft)",
                border: errors.email
                  ? "1px solid var(--danger)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.email
                  ? "var(--danger)"
                  : "rgba(255,255,255,0.08)")
              }
            />
            {errors.email && (
              <p className="text-xs mt-1 text-danger">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--accent)" }}
            >
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
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-primary outline-none transition-all duration-200"
                style={{
                  background: "var(--accent-soft)",
                  border: errors.password
                    ? "1px solid var(--danger)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.password
                    ? "var(--danger)"
                    : "rgba(255,255,255,0.08)")
                }
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-muted transition-colors"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs mt-1 text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-primary mt-2 transition-all duration-200 disabled:opacity-60"
            style={{
              background: loading
                ? "var(--accent)"
                : "linear-gradient(135deg, var(--accent) 0%, var(--accent) 100%)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-input/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="font-medium text-accent hover:text-accent transition-colors"
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-accent hover:text-accent transition-colors"
          >
            Tenant / Staff login
          </button>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-input/10 bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  Reset access
                </p>
                <h3 className="mt-1 text-2xl font-bold text-primary">
                  Forgot Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  resetForgotPasswordState();
                }}
                className="rounded-full p-2 text-muted transition hover:bg-subtle hover:text-primary"
              >
                <X size={18} />
              </button>
            </div>

            {forgotMessage && (
              <div className="mb-4 rounded-xl border border-accent bg-accent-soft p-3 text-sm text-accent">
                {forgotMessage}
              </div>
            )}

            {forgotStep === "request" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted">
                    System admin email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@system.local"
                    className="w-full rounded-xl border border-input/10 bg-subtle px-4 py-3 text-sm text-primary outline-none placeholder:text-muted focus:border-accent"
                  />
                </div>
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotPasswordRequest}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-primary disabled:opacity-60"
                >
                  {forgotLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            )}

            {forgotStep === "verify" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-xl border border-input/10 bg-subtle px-4 py-3 text-sm text-primary outline-none placeholder:text-muted focus:border-accent"
                  />
                </div>
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotPasswordVerify}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-primary disabled:opacity-60"
                >
                  {forgotLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}

            {forgotStep === "reset" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted">
                    New password
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-input/10 bg-subtle px-4 py-3 text-sm text-primary outline-none placeholder:text-muted focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-input/10 bg-subtle px-4 py-3 text-sm text-primary outline-none placeholder:text-muted focus:border-accent"
                  />
                </div>
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotPasswordReset}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-primary disabled:opacity-60"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-8 text-xs" style={{ color: "var(--accent)" }}>
        Copyright © {new Date().getFullYear()} School Management System. All
        rights reserved.
      </p>
    </div>
  );
};

export default SystemLoginPage;
