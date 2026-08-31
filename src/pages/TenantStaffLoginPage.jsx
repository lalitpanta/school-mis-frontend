import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  Building2,
  Users,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { unifiedLogin } from "../api/authApi";
import { MODULE_ROUTE_MAP } from "../utils/constants";
import toast from "react-hot-toast";

const TenantStaffLoginPage = () => {
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
    defaultValues: { tenantSlug: "", email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      const response = await unifiedLogin(data.email, data.password, data.tenantSlug);

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
        toast.success(`${userType.charAt(0).toUpperCase() + userType.slice(1)} login successful!`);

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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#070b14" }}
    >
      <div className="text-center mb-7">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Building2 size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Tenant & Staff Portal
          </h1>
        </div>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Tenant and staff login with tenant name, email, and password
        </p>
      </div>

      <div
        className="w-full max-w-md rounded-2xl p-7"
        style={{
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <Users size={20} className="text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Tenant / Staff Login</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: "#64748b" }}>
          Enter your tenant name, email, and password to continue.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3">
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
              Tenant Name / Slug
            </label>
            <input
              {...register("tenantSlug", {
                required: "Tenant name/slug is required",
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
                border: errors.tenantSlug ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.tenantSlug ? "#f87171" : "rgba(255,255,255,0.08)")
              }
            />
            {errors.tenantSlug && <p className="text-xs mt-1 text-red-400">{errors.tenantSlug.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
              Email
            </label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
              })}
              type="email"
              placeholder="tenant@school.local"
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all duration-200"
              style={{
                background: "#1e293b",
                border: errors.email ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.email ? "#f87171" : "rgba(255,255,255,0.08)")
              }
            />
            {errors.email && <p className="text-xs mt-1 text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
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
                  border: errors.password ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.password ? "#f87171" : "rgba(255,255,255,0.08)")
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
            {errors.password && <p className="text-xs mt-1 text-red-400">{errors.password.message}</p>}
          </div>

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

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => navigate("/system/login")}
            className="text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            System admin login
          </button>
        </div>
      </div>

      <p className="mt-8 text-xs" style={{ color: "#334155" }}>
        Copyright © {new Date().getFullYear()} School Management System. All rights reserved.
      </p>
    </div>
  );
};

export default TenantStaffLoginPage;
