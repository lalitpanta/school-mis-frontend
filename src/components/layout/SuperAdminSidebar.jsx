import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap,
  Briefcase,
  FileText,
  Database,
  Package,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

const SuperAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { settings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);

  const schoolProfile = settings?.school_profile || {};
  const brandName =
    settings?.platform_name ||
    settings?.system_name ||
    schoolProfile.name ||
    "EduSphere";
  const brandTagline =
    settings?.platform_tagline || schoolProfile.motto || "Super Admin";
  const brandLogo = schoolProfile.logo || settings?.platform_logo || null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isNavActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname === to;

  // SuperAdmin navigation - dashboard, tenants, billing, audit logs, and settings
  const SUPERADMIN_NAV = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: "/superadmin/dashboard",
    },
    {
      label: "Tenants",
      icon: Users,
      to: "/superadmin/tenants",
    },
    {
      label: "Billing",
      icon: Briefcase,
      to: "/superadmin/billing",
    },
    {
      label: "Audit Logs",
      icon: FileText,
      to: "/superadmin/audit-logs",
    },
    {
      label: "Settings",
      icon: Settings,
      to: "/superadmin/settings",
    },
    {
      label: "Storage",
      icon: Database,
      to: "/superadmin/storage",
    },
    {
      label: "Packages",
      icon: Package,
      to: "/superadmin/packages",
    },
  ];

  return (
    <aside
      style={{
        background: "#07090f",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
      className={clsx(
        "relative flex flex-col h-screen shrink-0 transition-all duration-300 ease-in-out select-none z-20",
        collapsed ? "w-15" : "w-55",
      )}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="w-9 h-9 shrink-0 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg overflow-hidden">
          {brandLogo ? (
            <img
              src={brandLogo}
              alt="Platform logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <GraduationCap size={18} className="text-white" />
          )}
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <p className="text-white font-bold text-sm">{brandName}</p>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">
              {brandTagline}
            </p>
          </div>
        )}
      </div>

      {/* ── Scrollable nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {/* MAIN section */}
        {!collapsed && (
          <p className="text-[10px] font-semibold tracking-widest text-slate-600 px-3 pt-1 pb-2">
            MAIN
          </p>
        )}
        <div className="space-y-0.5">
          {SUPERADMIN_NAV.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                isNavActive(to)
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-[#ffffff]/5",
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Account section ── */}
      <div className="mt-4 border-t border-[#1e293b] pt-3 px-2 pb-3">
        {!collapsed && (
          <p className="text-[10px] font-semibold tracking-widest text-slate-600 px-3 pb-2">
            ACCOUNT
          </p>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 transition-all z-30 shadow-lg"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
};

export default SuperAdminSidebar;
