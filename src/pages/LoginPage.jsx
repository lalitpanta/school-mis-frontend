import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Building2,
  Shield,
  AlertCircle,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { unifiedLogin } from "../api/authApi";
import { MODULE_ROUTE_MAP } from "../utils/constants";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [tab, setTab] = useState("tenant"); // 'tenant' | 'admin' | 'staff'
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { tenantSlug: "", email: "", password: "", remember: false },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      // Use unified login - pass tenantSlug only for tenant and staff logins
      const tenantSlugForLogin =
        tab === "tenant" || tab === "staff" ? data.tenantSlug : null;

      const response = await unifiedLogin(
        data.email,
        data.password,
        tenantSlugForLogin,
      );

      if (response.success) {
        // Handle login based on userType returned from backend
        const userType = response.userType;
        const token = response.data.token;

        let userData = null;
        if (userType === "admin") {
          userData = response.data.admin;
        } else if (userType === "tenant") {
          userData = response.data.tenant;
        } else if (userType === "staff") {
          userData = response.data.user;
        }

        loginUser(userData, token, userType);
        toast.success(
          `${userType.charAt(0).toUpperCase() + userType.slice(1)} login successful!`,
        );

        // Route based on user type
        if (userType === "admin") {
          // Check if it's a super_admin
          if (userData?.type === "super_admin") {
            navigate("/superadmin/dashboard");
          } else {
            navigate("/admin/dashboard");
          }
        } else {
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
      }
    } catch (err) {
      const errorMsg = err.message || "Login failed. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#070b14" }}
    >
      {/* ── App Brand ── */}
      <div className="text-center mb-7">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <GraduationCap size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            School Management System
          </h1>
        </div>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Multi-Tenant School Management Platform
        </p>
      </div>

      {/* ── Login Card ── */}
      <div
        className="w-full max-w-md rounded-2xl p-7"
        style={{
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Card header */}
        <div className="flex items-center gap-2.5 mb-1">
          {tab === "admin" ? (
            <Shield size={20} className="text-indigo-400" />
          ) : tab === "staff" ? (
            <Users size={20} className="text-indigo-400" />
          ) : (
            <Building2 size={20} className="text-indigo-400" />
          )}
          <h2 className="text-xl font-bold text-white">
            {tab === "admin"
              ? "System Admin Login"
              : tab === "staff"
                ? "Staff Login"
                : "Tenant Login"}
          </h2>
        </div>
        <p className="text-sm mb-5" style={{ color: "#64748b" }}>
          {tab === "admin"
            ? "Login as system administrator to manage tenants."
            : tab === "staff"
              ? "Login as staff member to access your workspace."
              : "Login to your tenant account to manage your data."}
        </p>

        {/* Tabs */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "#1e293b" }}
        >
          {[
            { key: "tenant", label: "Tenant", Icon: Building2 },
            { key: "staff", label: "Staff", Icon: Users },
            { key: "admin", label: "Admin", Icon: Shield },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setError("");
                reset();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={
                tab === key
                  ? { background: "#334155", color: "#f1f5f9" }
                  : { background: "transparent", color: "#64748b" }
              }
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3">
            <AlertCircle
              size={18}
              className="text-red-400 mt-0.5 flex-shrink-0"
            />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Demo Credentials Info */}
        {tab === "admin" && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
            <p className="font-semibold mb-1">Demo Admin Credentials:</p>
            <p>Email: admin@system.local</p>
            <p>Password: admin123</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tenant Name/Slug */}
          {(tab === "tenant" || tab === "staff") && (
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#94a3b8" }}
              >
                Tenant Name / Slug
              </label>
              <input
                {...register("tenantSlug", {
                  required: "Tenant name or slug is required",
                  pattern: {
                    value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: "Use lowercase letters, numbers, and hyphens only",
                  },
                })}
                type="text"
                placeholder="tenant-name"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all duration-200"
                style={{
                  background: "#1e293b",
                  border: errors.tenantSlug
                    ? "1px solid #f87171"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.tenantSlug
                    ? "#f87171"
                    : "rgba(255,255,255,0.08)")
                }
              />
              {errors.tenantSlug && (
                <p className="text-xs mt-1 text-red-400">
                  {errors.tenantSlug.message}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "#94a3b8" }}
            >
              Email
            </label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
              })}
              type="email"
              placeholder={
                tab === "admin" ? "admin@system.local" : "tenant@school.local"
              }
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all duration-200"
              style={{
                background: "#1e293b",
                border: errors.email
                  ? "1px solid #f87171"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.email
                  ? "#f87171"
                  : "rgba(255,255,255,0.08)")
              }
            />
            {errors.email && (
              <p className="text-xs mt-1 text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "#94a3b8" }}
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
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white outline-none transition-all duration-200"
                style={{
                  background: "#1e293b",
                  border: errors.password
                    ? "1px solid #f87171"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.password
                    ? "#f87171"
                    : "rgba(255,255,255,0.08)")
                }
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs mt-1 text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white mt-2 transition-all duration-200 disabled:opacity-60"
            style={{
              background: loading
                ? "#4338ca"
                : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      {/* ── Footer ── */}
      <p className="mt-8 text-xs" style={{ color: "#334155" }}>
        Copyright © {new Date().getFullYear()} School Management System. All
        rights reserved.
      </p>
    </div>
  );
};

export default LoginPage;
