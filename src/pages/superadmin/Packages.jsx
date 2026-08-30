import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Activity,
  CalendarDays,
  Users,
  Settings,
  GraduationCap,
  Briefcase,
  FileText,
  CreditCard,
  CheckSquare,
  Square,
  Save,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import clsx from "clsx";

const AVAILABLE_MODULES = [
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "attendance", label: "Attendance", icon: Users },
  { id: "teacher", label: "Teachers", icon: Briefcase },
  { id: "student", label: "Students", icon: GraduationCap },
  { id: "employee", label: "Employees", icon: Users },
  { id: "results", label: "Results & Exams", icon: FileText },
  { id: "result_portal", label: "Result Portal", icon: FileText },
  { id: "daily_reports", label: "Daily Reports", icon: FileText },
  { id: "fee_management", label: "Fee Management", icon: CreditCard },
  { id: "settings_school", label: "School Profile", icon: Settings },
  { id: "settings_academic", label: "Academic Calendar", icon: CalendarDays },
  { id: "settings_users", label: "Users & Staff", icon: Users },
  { id: "settings_roles", label: "Roles & Permissions", icon: Settings },
  { id: "settings_notices", label: "Notices & SMS", icon: FileText },
  { id: "settings_integrations", label: "Integrations", icon: Settings },
  { id: "settings_devices", label: "Device Integration", icon: Settings },
  { id: "settings_departments", label: "Departments", icon: Briefcase },
  { id: "settings_classrooms", label: "Classrooms", icon: GraduationCap },
  { id: "settings_courses", label: "Courses", icon: FileText },
  { id: "settings_rooms", label: "Rooms", icon: Settings },
  { id: "settings_security", label: "Security", icon: Settings },
];

const SuperAdminPackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    package_name: "",
    description: "",
    price: "",
    time_period: "1 month",
    is_active: true,
    accessed_modules: [],
  });

  const { token } = useAuth();
  const apiBase = "http://localhost:5000/v1/super-admin";

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBase}/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setPackages(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        package_name: pkg.package_name,
        description: pkg.description || "",
        price: pkg.price,
        time_period: pkg.time_period || "1 month",
        is_active: pkg.is_active,
        accessed_modules: typeof pkg.accessed_modules === 'string' 
                            ? JSON.parse(pkg.accessed_modules) 
                            : (pkg.accessed_modules || []),
      });
    } else {
      setEditingPackage(null);
      setFormData({
        package_name: "",
        description: "",
        price: "",
        time_period: "1 month",
        is_active: true,
        accessed_modules: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const handleToggleModule = (moduleId) => {
    setFormData((prev) => {
      const currentModules = [...prev.accessed_modules];
      if (currentModules.includes(moduleId)) {
        return { ...prev, accessed_modules: currentModules.filter((m) => m !== moduleId) };
      } else {
        return { ...prev, accessed_modules: [...currentModules, moduleId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        const res = await axios.put(`${apiBase}/packages/${editingPackage.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setPackages(packages.map(p => p.id === editingPackage.id ? res.data.data : p));
        }
      } else {
        const res = await axios.post(`${apiBase}/packages`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setPackages([res.data.data, ...packages]);
        }
      }
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save package:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this package?")) {
      try {
        const res = await axios.delete(`${apiBase}/packages/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setPackages(packages.filter(p => p.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete package:", err);
      }
    }
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0d16] p-6 rounded-2xl border border-[#1e293b] shadow-2xl relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Package size={28} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Subscription Packages</h1>
            <p className="text-slate-400 mt-1 text-sm font-medium">Manage multi-tenant school pricing plans and module access.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1423] border border-[#1e293b] text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm font-medium"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>New Package</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            let modules = [];
            try {
              modules = typeof pkg.accessed_modules === 'string' ? JSON.parse(pkg.accessed_modules) : (pkg.accessed_modules || []);
            } catch(e) {}
            
            return (
              <div 
                key={pkg.id} 
                className={clsx(
                  "group bg-[#0a0d16] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative flex flex-col",
                  pkg.is_active ? "border-[#1e293b] hover:border-indigo-500/50" : "border-[#1e293b]/50 opacity-80"
                )}
              >
                {/* Status indicator */}
                <div className={clsx(
                  "absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md",
                  pkg.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                )}>
                  <div className={clsx("w-1.5 h-1.5 rounded-full", pkg.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-400")} />
                  {pkg.is_active ? "Active" : "Inactive"}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 pr-20">{pkg.package_name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black text-indigo-400">₹{parseFloat(pkg.price).toLocaleString()}</span>
                    <span className="text-slate-500 text-sm font-medium">/ {pkg.time_period}</span>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">{pkg.description || "No description provided."}</p>
                  
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 tracking-wider mb-3 uppercase">Included Modules ({modules.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {modules.slice(0, 5).map(modId => {
                        const modInfo = AVAILABLE_MODULES.find(m => m.id === modId);
                        return modInfo ? (
                          <span key={modId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1e293b]/50 border border-[#334155] text-xs text-slate-300 font-medium">
                            <modInfo.icon size={12} className="text-indigo-400" />
                            {modInfo.label}
                          </span>
                        ) : null;
                      })}
                      {modules.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#1e293b]/30 border border-[#334155]/50 text-xs text-slate-400 font-medium">
                          +{modules.length - 5} more
                        </span>
                      )}
                      {modules.length === 0 && (
                        <span className="text-sm text-slate-500 italic">No modules selected</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1e293b] p-4 flex justify-end gap-3 bg-[#0f1423]/50">
                  <button 
                    onClick={() => handleOpenModal(pkg)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-colors"
                    title="Edit Package"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(pkg.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete Package"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredPackages.length === 0 && (
            <div className="col-span-full py-16 text-center bg-[#0a0d16] rounded-2xl border border-[#1e293b] border-dashed flex flex-col items-center justify-center">
              <Package size={48} className="text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No packages found</h3>
              <p className="text-slate-400 max-w-sm mx-auto">You haven't created any subscription packages yet. Create your first package to get started.</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-6 flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-white px-5 py-2.5 rounded-xl font-medium transition-all"
              >
                <Plus size={18} />
                <span>Create Package</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={handleCloseModal} />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-3xl bg-[#0a0d16] rounded-2xl shadow-2xl border border-[#1e293b] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1e293b]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  {editingPackage ? <Edit2 size={20} className="text-indigo-400" /> : <Plus size={20} className="text-indigo-400" />}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {editingPackage ? "Edit Package" : "Create New Package"}
                </h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-6 space-y-8">
                
                {/* Basic Info Section */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Package Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Package Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.package_name}
                        onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                        className="w-full bg-[#0f1423] border border-[#1e293b] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white transition-colors text-sm"
                        placeholder="e.g. Premium Plan"
                      />
                    </div>
                    <div className="space-y-2 flex items-center justify-end md:pt-8">
                      <label 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormData({ ...formData, is_active: !formData.is_active });
                        }}
                      >
                        <div className={clsx(
                          "w-12 h-6 rounded-full transition-colors relative",
                          formData.is_active ? "bg-indigo-500" : "bg-[#1e293b]"
                        )}>
                          <div className={clsx(
                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform transform",
                            formData.is_active ? "translate-x-6" : "translate-x-0"
                          )} />
                        </div>
                        <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                          Package is Active
                        </span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Price *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full bg-[#0f1423] border border-[#1e293b] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-8 pr-4 py-2.5 text-white transition-colors text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Time Period *</label>
                      <select
                        required
                        value={formData.time_period}
                        onChange={(e) => setFormData({ ...formData, time_period: e.target.value })}
                        className="w-full bg-[#0f1423] border border-[#1e293b] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white transition-colors text-sm appearance-none"
                      >
                        <option value="1 month">1 Month</option>
                        <option value="3 months">3 Months</option>
                        <option value="6 months">6 Months</option>
                        <option value="1 year">1 Year</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>

                    <div className="col-span-full space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-[#0f1423] border border-[#1e293b] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white transition-colors text-sm min-h-[100px] resize-y"
                        placeholder="Describe the benefits of this package..."
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-[#1e293b]" />

                {/* Modules Section */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Module Access ({formData.accessed_modules.length})
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({
                        ...prev, 
                        accessed_modules: prev.accessed_modules.length === AVAILABLE_MODULES.length ? [] : AVAILABLE_MODULES.map(m => m.id)
                      }))}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      {formData.accessed_modules.length === AVAILABLE_MODULES.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {AVAILABLE_MODULES.map((module) => {
                      const isSelected = formData.accessed_modules.includes(module.id);
                      return (
                        <div
                          key={module.id}
                          onClick={() => handleToggleModule(module.id)}
                          className={clsx(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group",
                            isSelected 
                              ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                              : "bg-[#0f1423] border-[#1e293b] hover:border-[#334155] hover:bg-[#1e293b]/50"
                          )}
                        >
                          <div className={clsx(
                            "flex-shrink-0 transition-colors",
                            isSelected ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"
                          )}>
                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <module.icon size={16} className={clsx(
                              "shrink-0",
                              isSelected ? "text-indigo-400" : "text-slate-500"
                            )} />
                            <span className={clsx(
                              "text-sm font-medium truncate",
                              isSelected ? "text-indigo-100" : "text-slate-400 group-hover:text-slate-300"
                            )}>
                              {module.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#1e293b] bg-[#07090f]/50 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-[#1e293b] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg"
                >
                  <Save size={18} />
                  <span>{editingPackage ? "Save Changes" : "Create Package"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPackagesPage;
