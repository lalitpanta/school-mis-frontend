import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminLogin } from "../api/authApi";
import toast from "react-hot-toast";

const SystemLoginPage = () => {
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
        const userData = response.data?.admin || response.data?.user || response.data?.tenant;

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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#070b14" }}
    >
      <div className="text-center mb-7">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Shield size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            System Administration
          </h1>
        </div>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Super admin and system admin login portal
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
          <Shield size={20} className="text-indigo-400" />
          <h2 className="text-xl font-bold text-white">System Admin Login</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: "#64748b" }}>
          Sign in with your system email and password.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3">
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
          <p className="font-semibold mb-1">Demo System Admin:</p>
          <p>Email: admin@system.local</p>
          <p>Password: admin123</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="admin@system.local"
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
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            Tenant / Staff login
          </button>
        </div>
      </div>

      <p className="mt-8 text-xs" style={{ color: "#334155" }}>
        Copyright © {new Date().getFullYear()} School Management System. All rights reserved.
      </p>
    </div>
  );
};

export default SystemLoginPage;
