import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAllTenants,
  createNewTenant,
  updateTenantStatus,
  deleteTenant,
  permanentlyDeleteTenant,
} from "../api/authApi";
import { updateTenant } from "../api/authApi";
import {
  LogOut,
  Plus,
  Building2,
  Mail,
  Database,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { AVAILABLE_MODULES } from "../utils/constants";

const AdminDashboard = () => {
  const { user, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    databaseName: "",
    slug: "",
    modules: ["dashboard", "calendar", "attendance", "settings"],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdInfo, setCreatedInfo] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  // Permanent deletion states
  const [permanentDeleteTenant, setPermanentDeleteTenant] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [showFinalConfirmModal, setShowFinalConfirmModal] = useState(false);
  const [deletingPermanently, setDeletingPermanently] = useState(false);
  const [showPasswordDashboard, setShowPasswordDashboard] = useState(false);
  const [showCreatedPasswordDashboard, setShowCreatedPasswordDashboard] =
    useState(false);

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/");
      return;
    }
    fetchTenants();
  }, [isAdmin, navigate]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await getAllTenants(token);
      if (response.success) {
        setTenants(response.data);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch tenants");
      toast.error("Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setEditingTenant(null);

    try {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.databaseName
      ) {
        setError("All fields are required");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (!formData.modules || formData.modules.length === 0) {
        setError("Select at least one module");
        return;
      }

      const response = await createNewTenant(
        formData.name,
        formData.email,
        formData.password,
        formData.databaseName,
        formData.slug,
        formData.modules,
        null,
        token,
      );

      if (response.success) {
        toast.success("Tenant created successfully!");
        setCreatedInfo(response.data);
        setFormData({
          name: "",
          email: "",
          password: "",
          databaseName: "",
          slug: "",
          modules: ["dashboard", "calendar", "attendance", "settings"],
        });
        setShowCreateForm(false);
        fetchTenants();
      }
    } catch (err) {
      const errorMsg = err.message || "Failed to create tenant";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleToggleStatus = async (tenant) => {
    try {
      const response = await updateTenantStatus(
        tenant.id,
        !tenant.is_active,
        token,
      );
      if (response.success) {
        toast.success("Tenant status updated");
        fetchTenants();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDeleteTenant = async (tenant) => {
    const confirmed = window.confirm(`Delete tenant ${tenant.name}?`);
    if (!confirmed) return;

    try {
      const response = await deleteTenant(tenant.id, token);
      if (response.success) {
        toast.success("Tenant deleted");
        fetchTenants();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete tenant");
    }
  };

  const handlePermanentDeleteInitiate = (tenant) => {
    setPermanentDeleteTenant(tenant);
    setShowDeleteConfirmModal(true);
    setDeleteConfirmationText("");
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmationText !== "delete") {
      toast.error('Please type "delete" to confirm');
      return;
    }
    setShowDeleteConfirmModal(false);
    setShowFinalConfirmModal(true);
  };

  const handleCancelPermanentDelete = () => {
    setShowDeleteConfirmModal(false);
    setShowFinalConfirmModal(false);
    setPermanentDeleteTenant(null);
    setDeleteConfirmationText("");
  };

  const handleExecutePermanentDelete = async () => {
    if (!permanentDeleteTenant) return;

    setDeletingPermanently(true);
    try {
      const response = await permanentlyDeleteTenant(
        permanentDeleteTenant.id,
        token,
      );
      if (response.success) {
        toast.success("Tenant permanently deleted - Database dropped");
        setShowFinalConfirmModal(false);
        setPermanentDeleteTenant(null);
        setDeleteConfirmationText("");
        fetchTenants();
      }
    } catch (err) {
      toast.error(err.message || "Failed to permanently delete tenant");
    } finally {
      setDeletingPermanently(false);
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    setSubmitting(true);
    setError("");

    try {
      if (!formData.name || !formData.email) {
        setError("Name and email are required");
        return;
      }

      const updates = {
        name: formData.name,
        email: formData.email,
        slug: formData.slug,
        modules: formData.modules,
      };

      const response = await updateTenant(editingTenant.id, updates, token);
      if (response.success) {
        toast.success("Tenant updated successfully");
        setEditingTenant(null);
        setFormData({
          name: "",
          email: "",
          password: "",
          databaseName: "",
          slug: "",
          modules: ["dashboard", "calendar", "attendance", "settings"],
        });
        setShowCreateForm(false);
        fetchTenants();
      }
    } catch (err) {
      const errorMsg = err.message || "Failed to update tenant";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name || "",
      email: tenant.email || "",
      password: "",
      databaseName: tenant.database_name || "",
      slug: tenant.slug || "",
      modules: Array.isArray(tenant.modules)
        ? tenant.modules
        : JSON.parse(tenant.modules || "[]"),
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingTenant(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      databaseName: "",
      slug: "",
      modules: ["dashboard", "calendar", "attendance", "settings"],
    });
    setShowCreateForm(false);
    setError("");
  };

  const handleFormSubmit = async (e) => {
    if (editingTenant) {
      return handleUpdateTenant(e);
    }
    return handleCreateTenant(e);
  };

  return (
    <div
      style={{
        background: "var(--bg-main)",
        minHeight: "100vh",
        color: "var(--text-1)",
      }}
      className="p-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Admin Dashboard</h1>
          <p style={{ color: "#94a3b8" }}>Welcome, {user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/20 transition"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <div className="space-y-6">
        {/* Top stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="text-sm text-slate-400">Total tenants</div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-2xl font-bold">{tenants.length}</div>
                <div className="text-xs text-slate-400">
                  {tenants.filter((t) => t.is_active).length} active ·{" "}
                  {tenants.filter((t) => !t.is_active).length} inactive
                </div>
              </div>
              <div className="text-green-400 text-sm">+6.4%</div>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="text-sm text-slate-400">Avg. platform uptime</div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-2xl font-bold">99.94%</div>
                <div className="text-xs text-slate-400">
                  Last 30 days · 3 minor incidents
                </div>
              </div>
              <div className="text-green-400 text-sm">+2.1%</div>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="text-sm text-slate-400">
              Monthly recurring revenue
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-2xl font-bold">₹8.6L</div>
                <div className="text-xs text-slate-400">
                  ₹82K pending across 14 invoices
                </div>
              </div>
              <div className="text-green-400 text-sm">+9.8%</div>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="text-sm text-slate-400">Total storage used</div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-2xl font-bold">2.4/5 TB</div>
                <div className="text-xs text-slate-400">
                  6 tenants above 80% quota
                </div>
              </div>
              <div className="text-red-400 text-sm">-4.2%</div>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="text-sm text-slate-400">Open support tickets</div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-2xl font-bold">7</div>
                <div className="text-xs text-slate-400">
                  2 flagged high priority
                </div>
              </div>
              <div className="text-red-300 text-sm">-3 today</div>
            </div>
          </div>
        </div>

        {/* Main content: Tenants list and Platform pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Recent tenants</h2>
                <div className="text-sm text-slate-400">View all</div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : tenants.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p style={{ color: "var(--text-2)" }}>
                      No tenants created yet
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-sm text-slate-400">
                          <th className="py-3 px-4">Tenant</th>
                          <th className="py-3 px-4">Plan</th>
                          <th className="py-3 px-4">Storage</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.slice(0, 6).map((t) => (
                          <tr
                            key={t.id}
                            className="border-t border-transparent hover:bg-[rgba(255,255,255,0.02)]"
                          >
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                                  {t.name
                                    ?.split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("") ||
                                    t.slug?.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold">{t.name}</div>
                                  <div className="text-xs text-slate-400">
                                    {t.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="text-sm bg-slate-800 px-3 py-1 rounded-full inline-block">
                                {t.plan || (t.is_trial ? "Trial" : "Pro")}
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="w-48">
                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    style={{
                                      width: `${t.storage_used_percent || Math.floor(Math.random() * 80)}%`,
                                      background:
                                        t.storage_used_percent > 80
                                          ? "#ef4444"
                                          : "#10b981",
                                      height: "100%",
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {t.storage_used_percent ||
                                    Math.floor(Math.random() * 80)}
                                  %
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold`}
                                style={{
                                  background: t.is_active
                                    ? "rgba(16,185,129,0.12)"
                                    : "rgba(239,68,68,0.12)",
                                  color: t.is_active ? "#10b981" : "#ef4444",
                                }}
                              >
                                {t.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="py-4 px-4 align-top text-sm text-slate-400">
                              {new Date(t.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div
              className="rounded-xl p-6 mb-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
              }}
            >
              <h3 className="text-lg font-bold mb-3">Platform pulse</h3>
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 relative flex items-center justify-center">
                  {/* Simple SVG donut */}
                  <svg viewBox="0 0 36 36" className="w-36 h-36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="6"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="6"
                      strokeDasharray="89,100"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-2xl font-bold">89</div>
                    <div className="text-xs text-slate-400">Health score</div>
                  </div>
                </div>
                <div className="flex-1">
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>
                      Uptime & performance{" "}
                      <span className="float-right text-slate-200">96</span>
                    </li>
                    <li>
                      Billing health{" "}
                      <span className="float-right text-slate-200">91</span>
                    </li>
                    <li>
                      Storage headroom{" "}
                      <span className="float-right text-slate-200">78</span>
                    </li>
                    <li>
                      Support responsiveness{" "}
                      <span className="float-right text-slate-200">88</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Create / Edit panel */}
            {(showCreateForm || editingTenant) && (
              <div
                className="rounded-xl p-6"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{ color: "var(--text-1)" }}
                    >
                      {editingTenant ? "Edit Tenant" : "Create New Tenant"}
                    </h2>
                    {editingTenant && (
                      <p className="text-sm text-slate-400">
                        Database: {editingTenant.database_name}
                      </p>
                    )}
                  </div>
                  {editingTenant && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 rounded-lg bg-slate-700 text-sm text-slate-200 hover:bg-slate-600 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: formData.slug
                          ? formData.slug
                          : slugify(e.target.value),
                      })
                    }
                    placeholder="School name"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{
                      background: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="admin@school.local"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{
                      background: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: slugify(e.target.value),
                        })
                      }
                      placeholder="slug"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{
                        background: "#1e293b",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                    <input
                      type="text"
                      value={formData.databaseName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          databaseName: e.target.value
                            .replace(/\s+/g, "_")
                            .toLowerCase(),
                        })
                      }
                      placeholder="database_name"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{
                        background: "#1e293b",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordDashboard ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none pr-10"
                        style={{
                          background: "#1e293b",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswordDashboard(!showPasswordDashboard)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                      >
                        {showPasswordDashboard ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {editingTenant && (
                      <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                        Leave password blank to keep current tenant password.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 rounded-lg text-sm font-bold bg-linear-to-r from-indigo-500 to-blue-600"
                    >
                      {submitting
                        ? editingTenant
                          ? "Updating..."
                          : "Submitting..."
                        : editingTenant
                          ? "Update Tenant"
                          : "Create Tenant"}
                    </button>
                    {editingTenant && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-lg bg-slate-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {createdInfo && (
              <div
                className="rounded-xl p-4 mt-4"
                style={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="text-sm text-slate-300">Tenant Created</div>
                <div className="text-xs text-slate-400 mt-2">
                  Slug: {createdInfo.slug}
                </div>
                <div className="text-xs text-slate-400">
                  Email: {createdInfo.email}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Password:{" "}
                  <span className="ml-2">
                    {showCreatedPasswordDashboard
                      ? createdInfo.plainPassword
                      : createdInfo.plainPassword
                        ? createdInfo.plainPassword.replace(/./g, "*")
                        : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setShowCreatedPasswordDashboard(
                        !showCreatedPasswordDashboard,
                      )
                    }
                    className="ml-3"
                  >
                    {showCreatedPasswordDashboard ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    const text = `Slug: ${createdInfo.slug}\nEmail: ${createdInfo.email}\nPassword: ${createdInfo.plainPassword}`;
                    navigator.clipboard.writeText(text);
                    toast.success("Credentials copied");
                  }}
                  className="mt-3 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  Copy Credentials
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* First Confirmation Modal - Type "delete" */}
      {showDeleteConfirmModal && permanentDeleteTenant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 max-w-md w-full mx-4"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle
                size={24}
                className="text-orange-500 shrink-0 mt-1"
              />
              <div>
                <h3 className="text-lg font-bold text-white">
                  Confirm Permanent Deletion
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  This will permanently delete the tenant{" "}
                  <span className="font-semibold text-red-300">
                    {permanentDeleteTenant.name}
                  </span>{" "}
                  and its database.
                </p>
              </div>
            </div>

            <div
              className="mb-4 p-3 rounded-lg"
              style={{
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <label className="block text-sm text-slate-400 mb-2">
                Type <span className="font-bold text-white">"delete"</span> to
                confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleConfirmDelete()}
                placeholder='Type "delete"'
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelPermanentDelete}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#cbd5e1",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirmationText !== "delete"}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{
                  background:
                    deleteConfirmationText === "delete"
                      ? "rgba(220,38,38,0.8)"
                      : "rgba(220,38,38,0.3)",
                  border: "1px solid rgba(220,38,38,0.5)",
                  opacity: deleteConfirmationText === "delete" ? 1 : 0.5,
                  cursor:
                    deleteConfirmationText === "delete"
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Modal - Final Warning */}
      {showFinalConfirmModal && permanentDeleteTenant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 max-w-md w-full mx-4"
            style={{
              background: "#0f172a",
              border: "2px solid rgba(220,38,38,0.5)",
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={28} className="text-red-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-400">
                  Final Warning
                </h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  You are about to{" "}
                  <span className="font-bold">permanently delete</span> the
                  tenant{" "}
                  <span className="font-semibold text-red-300">
                    {permanentDeleteTenant.name}
                  </span>
                  .
                </p>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  This action will:
                </p>
                <ul className="text-sm text-slate-300 mt-2 ml-4 space-y-1">
                  <li>
                    • <span className="text-red-300">Drop the database</span>{" "}
                    {permanentDeleteTenant.database_name}
                  </li>
                  <li>
                    •{" "}
                    <span className="text-red-300">Delete all tenant data</span>{" "}
                    permanently
                  </li>
                  <li>
                    •{" "}
                    <span className="text-red-300">
                      Remove the tenant record
                    </span>{" "}
                    from the system
                  </li>
                  <li>
                    • <span className="text-red-300">Cannot be undone</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelPermanentDelete}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#cbd5e1",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePermanentDelete}
                disabled={deletingPermanently}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{
                  background: "rgba(220,38,38,0.9)",
                  border: "1px solid rgba(220,38,38,0.7)",
                  opacity: deletingPermanently ? 0.7 : 1,
                  cursor: deletingPermanently ? "not-allowed" : "pointer",
                }}
              >
                {deletingPermanently ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
