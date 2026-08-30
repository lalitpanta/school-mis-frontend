import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  getAllTenants,
  createNewTenant,
  updateTenantStatus,
  updateTenant,
  deleteTenant,
  permanentlyDeleteTenant,
} from "../../api/authApi";
import {
  Plus,
  Building2,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Edit2,
} from "lucide-react";
import toast from "react-hot-toast";
import { AVAILABLE_MODULES } from "../../utils/constants";

const SuperAdminTenants = () => {
  const { token } = useAuth();
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
    packageId: "",
  });
  const [packages, setPackages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdInfo, setCreatedInfo] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [permanentDeleteTenant, setPermanentDeleteTenant] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [showFinalConfirmModal, setShowFinalConfirmModal] = useState(false);
  const [deletingPermanently, setDeletingPermanently] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  useEffect(() => {
    fetchTenants();
    fetchPackages();
  }, [token]);

  const fetchPackages = async () => {
    try {
      const res = await axios.get("http://localhost:5000/v1/super-admin/packages", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPackages(res.data.data.filter(p => p.is_active));
      }
    } catch (err) {
      console.error("Failed to fetch packages", err);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await getAllTenants(token);
      if (response.success) {
        setTenants(response.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch tenants");
      toast.error("Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingTenant(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      databaseName: "",
      slug: "",
      modules: ["dashboard", "calendar", "attendance", "settings"],
      packageId: "",
    });
    setError("");
    setShowPassword(false);
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

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
        formData.slug || slugify(formData.name),
        formData.modules,
        formData.packageId || null,
        token,
      );

      if (response.success) {
        toast.success("Tenant created successfully!");
        setCreatedInfo({
          name: response.data?.tenant?.name || formData.name,
          email: response.data?.tenant?.email || formData.email,
          slug:
            response.data?.tenant?.slug ||
            formData.slug ||
            slugify(formData.name),
          databaseName:
            response.data?.tenant?.database_name || formData.databaseName,
          plainPassword: formData.password,
        });
        resetForm();
        setShowCreateForm(false);
        setShowCreatedPassword(true);
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

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name || "",
      email: tenant.email || "",
      password: "",
      databaseName: tenant.database_name || "",
      slug: tenant.slug || "",
      packageId: tenant.package_id || "",
      modules: Array.isArray(tenant.modules)
        ? tenant.modules
        : JSON.parse(tenant.modules || "[]"),
    });
    setShowCreateForm(true);
    setError("");
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowCreateForm(false);
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
        databaseName: formData.databaseName,
        modules: formData.modules,
        packageId: formData.packageId || null,
        ...(formData.password ? { password: formData.password } : {}),
      };

      const response = await updateTenant(editingTenant.id, updates, token);
      if (response.success) {
        toast.success("Tenant updated successfully");
        resetForm();
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

  const handleToggleTenantStatus = async (tenant) => {
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
      toast.error(err.message || "Failed to update tenant status");
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
    setError("");
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
    setError("");
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
        toast.success("Tenant permanently deleted");
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

  const handleFormSubmit = (e) => {
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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tenant Management</h1>
          <p style={{ color: "#94a3b8" }}>
            Create, edit, and manage tenant accounts from this dedicated module.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm((prev) => !prev);
            if (showCreateForm) {
              resetForm();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          <Plus size={18} />
          {showCreateForm ? "Hide form" : "New Tenant"}
        </button>
      </div>

      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">All tenants</h2>
              <div className="text-sm text-slate-400">
                {tenants.length} tenants
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-12">
                <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                <p style={{ color: "var(--text-2)" }}>No tenants found</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Database</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr
                        key={tenant.id}
                        className="border-t border-transparent hover:bg-[rgba(255,255,255,0.02)] transition"
                      >
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                              {tenant.name
                                ?.split(" ")
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join("") ||
                                tenant.slug?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold">{tenant.name}</div>
                              <div className="text-xs text-slate-400">
                                {tenant.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">{tenant.email}</td>
                        <td className="py-4 px-4 align-top text-slate-400">
                          {tenant.database_name}
                        </td>
                        <td className="py-4 px-4 align-top">
                          <button
                            onClick={() => handleToggleTenantStatus(tenant)}
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              tenant.is_active
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-red-500/10 text-red-300"
                            }`}
                          >
                            {tenant.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleEditTenant(tenant)}
                              className="p-2 rounded-lg bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 transition"
                              title="Edit tenant"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTenant(tenant)}
                              className="p-2 rounded-lg bg-slate-700/70 text-slate-200 hover:bg-slate-700 transition"
                              title="Delete tenant"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handlePermanentDeleteInitiate(tenant)
                              }
                              className="p-2 rounded-lg bg-red-600/10 text-red-300 hover:bg-red-600/20 transition"
                              title="Permanently delete tenant"
                            >
                              <AlertTriangle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          {(showCreateForm || editingTenant) && (
            <div
              className="rounded-xl p-6 mb-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">
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

              <form onSubmit={handleFormSubmit} className="space-y-4">
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
                  placeholder="Tenant name"
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
                  placeholder="tenant@example.com"
                  className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                  style={{
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <label className="block text-xs text-slate-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
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
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {editingTenant && (
                    <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                      Leave password blank to keep the current tenant password.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subscription Package
                  </label>
                  <select
                    value={formData.packageId}
                    onChange={(e) => {
                      const pkgId = e.target.value;
                      const selectedPkg = packages.find(p => p.id === pkgId);
                      setFormData({
                        ...formData,
                        packageId: pkgId,
                        modules: selectedPkg ? (typeof selectedPkg.accessed_modules === 'string' ? JSON.parse(selectedPkg.accessed_modules) : selectedPkg.accessed_modules) : ["dashboard", "calendar", "attendance", "settings"]
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none mb-4"
                    style={{
                      background: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <option value="">-- Custom Modules (No Package) --</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.package_name}</option>
                    ))}
                  </select>
                </div>
                
                {!formData.packageId ? (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom Modules
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_MODULES.map((module) => (
                        <label
                          key={module.key}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.modules.includes(module.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  modules: [...formData.modules, module.key],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  modules: formData.modules.filter(
                                    (m) => m !== module.key,
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: "#6366f1" }}
                          />
                          <span className="text-xs text-slate-300 capitalize">
                            {module.key}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-sm text-indigo-300">
                      Modules are automatically managed by the selected package.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 rounded-lg text-sm font-bold bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
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
                      className="px-4 py-2 rounded-lg bg-slate-700 text-white"
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
              className="rounded-xl p-4"
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
                  {showCreatedPassword
                    ? createdInfo.plainPassword
                    : createdInfo.plainPassword?.replace(/./g, "*")}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreatedPassword((prev) => !prev)}
                  className="ml-3"
                >
                  {showCreatedPassword ? (
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

      {showDeleteConfirmModal && permanentDeleteTenant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 max-w-md w-full mx-4"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
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
                onKeyDown={(e) => e.key === "Enter" && handleConfirmDelete()}
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
                    <span className="text-red-300">
                      Delete all tenant data permanently
                    </span>
                  </li>
                  <li>
                    •{" "}
                    <span className="text-red-300">
                      Remove the tenant record from the system
                    </span>
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
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deletingPermanently ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminTenants;
