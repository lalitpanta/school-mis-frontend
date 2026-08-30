import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  GraduationCap,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  LogOut,
  BarChart3,
  Users,
  Briefcase,
  FileText,
  IndianRupee,
  Activity,
  Menu,
  X,
  CreditCard,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { ROUTES } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
const SETTINGS_TABS = [
  { key: "school", label: "School Profile", emoji: "🏛️" },
  { key: "academic", label: "Academic & Calendar", emoji: "📅" },
  { key: "calendarSettings", label: "Calendar Settings", emoji: "📆" },
  { key: "users", label: "Users & Staff", emoji: "👥" },
  { key: "roles", label: "Roles & Permissions", emoji: "🛡️" },
  { key: "fees", label: "Fees", emoji: "💳" },
  { key: "notices", label: "Notices & SMS", emoji: "📢" },
  { key: "integrations", label: "Integrations", emoji: "🔌" },
  { key: "devices", label: "Device Integration", emoji: "📱" },
  { key: "security", label: "Security", emoji: "🔒" },
  { key: "theme", label: "Theme", emoji: "🌙" },
  { key: "departments", label: "Departments", emoji: "🏦" },
  { key: "classrooms", label: "Classrooms", emoji: "🏫" },
  { key: "courses", label: "Courses", emoji: "📚" },
  { key: "rooms", label: "Rooms", emoji: "🚪" },
  { key: "students", label: "Students", emoji: "🎓" },
];

const EXAM_TABS = [
  { key: "resultFormat", label: "Exam Setup", emoji: "📋" },
  { key: "resultSubject", label: "Course & Marks", emoji: "📚" },
];
const MAIN_NAV = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: ROUTES.DASHBOARD,
    module: "dashboard",
  },
  {
    label: "Calendar",
    icon: Calendar,
    to: ROUTES.CALENDAR,
    module: "calendar",
  },
  {
    label: "Attendance",
    icon: ClipboardList,
    to: ROUTES.ATTENDANCE,
    module: "attendance",
  },
  { label: "Teachers", icon: Users, to: ROUTES.TEACHER, module: "teacher" },
  {
    label: "Students",
    icon: GraduationCap,
    to: ROUTES.STUDENT,
    module: "student",
  },
  {
    label: "Employees",
    icon: Briefcase,
    to: ROUTES.EMPLOYEE,
    module: "employee",
  },
  { label: "Results", icon: BarChart3, to: ROUTES.RESULTS, module: "results" },
  {
    label: "Result Portal",
    icon: FileText,
    to: ROUTES.RESULT_PORTAL,
    module: "result_portal",
  },
  {
    label: "Daily Reports",
    icon: FileText,
    to: ROUTES.DAILY_REPORTS,
    module: "daily_reports",
  },
  {
    label: "Fee Management",
    icon: CreditCard,
    to: ROUTES.FEES,
    module: "fee_management",
  },
  {
    label: "Leave Management",
    icon: Clock,
    to: ROUTES.LEAVE_MANAGEMENT,
    module: "leave_management",
  },
];
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasModule, isTenant, logout, user } = useAuth();
  const { settings } = useSettings();

  const schoolProfile = settings?.school_profile || {};
  const brandName =
    settings?.platform_name ||
    settings?.system_name ||
    schoolProfile.name ||
    "EduSphere";
  const brandTagline =
    settings?.platform_tagline || schoolProfile.motto || "School ERP";
  const brandLogo = settings?.platform_logo || schoolProfile.logo || null;

  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const onSettings = location.pathname === ROUTES.SETTINGS;
  const activeTab = new URLSearchParams(location.search).get("tab") || "school";

  /* Auto-open accordion when entering /settings */
  useEffect(() => {
    if (onSettings) {
      if (EXAM_TABS.some((t) => t.key === activeTab)) {
        setExamOpen(true);
      } else {
        setSettingsOpen(true);
      }
    }
  }, [onSettings, activeTab]);

  const toggleSettings = () => {
    if (collapsed) {
      setCollapsed(false);
      setSettingsOpen(true);
      setExamOpen(false);
      navigate(`${ROUTES.SETTINGS}?tab=school`);
      return;
    }
    const next = !settingsOpen;
    setSettingsOpen(next);
    if (next && !onSettings) navigate(`${ROUTES.SETTINGS}?tab=school`);
  };

  const toggleExamSetup = () => {
    if (collapsed) {
      setCollapsed(false);
      setExamOpen(true);
      setSettingsOpen(false);
      navigate(`${ROUTES.SETTINGS}?tab=resultFormat`);
      return;
    }
    const next = !examOpen;
    setExamOpen(next);
    if (next && !onSettings) navigate(`${ROUTES.SETTINGS}?tab=resultFormat`);
  };

  const isNavActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname === to;

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
          {/* Filter navigation items based on user type */}
          {(() => {
            // Super Admin: Show only Dashboard and Tenants
            if (user?.type === "super_admin") {
              return MAIN_NAV.filter((item) => item.module === "dashboard").map(
                ({ label, icon: Icon, to }) => (
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
                ),
              );
            }

            // Tenant: Show modules they have access to
            if (isTenant()) {
              return MAIN_NAV.filter((item) => hasModule(item.module)).map(
                ({ label, icon: Icon, to }) => (
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
                ),
              );
            }

            // Regular Admin: Show all main nav items
            return MAIN_NAV.map(({ label, icon: Icon, to }) => (
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
            ));
          })()}

          {/* Tenants section - Only show for non-tenant users */}
          {!isTenant() && (
            <>
              <NavLink
                to={
                  user?.type === "super_admin"
                    ? "/superadmin/tenants"
                    : "/admin/tenants"
                }
                title={collapsed ? "Tenants" : undefined}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                  isNavActive(
                    user?.type === "super_admin"
                      ? "/superadmin/tenants"
                      : "/admin/tenants",
                  )
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/25"
                    : "text-slate-400 hover:text-white hover:bg-[#ffffff]/5",
                )}
              >
                <Users size={16} className="shrink-0" />
                {!collapsed && "Tenants"}
              </NavLink>
            </>
          )}
        </div>

        {/* SETTINGS section - Only show for non-super_admin users */}
        {user?.type !== "super_admin" &&
          (!isTenant() || hasModule("settings")) && (
            <div className="mt-4">
              {!collapsed && (
                <p className="text-[10px] font-semibold tracking-widest text-slate-600 px-3 pb-2">
                  SETTINGS
                </p>
              )}

              {/* Settings trigger button */}
              <button
                onClick={toggleSettings}
                title={collapsed ? "Settings" : undefined}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                  onSettings || settingsOpen
                    ? "text-amber-300"
                    : "text-slate-400 hover:text-white hover:bg-[#ffffff]/5",
                )}
                style={
                  onSettings || settingsOpen
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(180,83,9,0.10) 100%)",
                        border: "1px solid rgba(245,158,11,0.22)",
                      }
                    : {}
                }
              >
                <Settings size={16} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Settings</span>
                    {settingsOpen ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </>
                )}
              </button>

              {/* Dropdown sub-items */}
              {!collapsed && settingsOpen && (
                <div className="settings-sub mt-1 ml-1 border-l-2 border-[#1e293b] pl-2 space-y-0.5">
                  {SETTINGS_TABS.map(({ key, label, emoji }) => {
                    const active = onSettings && activeTab === key;
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          navigate(`${ROUTES.SETTINGS}?tab=${key}`)
                        }
                        className={clsx(
                          "w-full flex items-center gap-2.5 px-3 py-1.75 rounded-xl text-[12.5px] font-medium text-left transition-all",
                          active
                            ? "bg-[#1a2235] text-white"
                            : "text-slate-400 hover:text-white hover:bg-[#ffffff]/5",
                        )}
                      >
                        <span className="text-sm leading-none w-4 text-center shrink-0">
                          {emoji}
                        </span>
                        <span className={active ? "font-semibold" : ""}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Exam Setup trigger button */}
              <button
                onClick={toggleExamSetup}
                title={collapsed ? "Exam and Result" : undefined}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all mt-1",
                  (onSettings && EXAM_TABS.some((t) => t.key === activeTab)) ||
                    examOpen
                    ? "text-amber-300"
                    : "text-slate-400 hover:text-white hover:bg-[#ffffff]/5",
                )}
                style={
                  (onSettings && EXAM_TABS.some((t) => t.key === activeTab)) ||
                  examOpen
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(180,83,9,0.10) 100%)",
                        border: "1px solid rgba(245,158,11,0.22)",
                      }
                    : {}
                }
              >
                <ClipboardList size={16} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Exam and Result</span>
                    {examOpen ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </>
                )}
              </button>

              {/* Exam Dropdown sub-items */}
              {!collapsed && examOpen && (
                <div className="settings-sub mt-1 ml-1 border-l-2 border-[#1e293b] pl-2 space-y-0.5">
                  {EXAM_TABS.map(({ key, label, emoji }) => {
                    const active = onSettings && activeTab === key;
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          navigate(`${ROUTES.SETTINGS}?tab=${key}`)
                        }
                        className={clsx(
                          "w-full flex items-center gap-2.5 px-3 py-1.75 rounded-xl text-[12.5px] font-medium text-left transition-all",
                          active
                            ? "bg-[#1a2235] text-white"
                            : "text-slate-400 hover:text-white hover:bg-[#ffffff]/5",
                        )}
                      >
                        <span className="text-sm leading-none w-4 text-center shrink-0">
                          {emoji}
                        </span>
                        <span className={active ? "font-semibold" : ""}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        {/* ACCOUNT section */}
        <div className="mt-4">
          {!collapsed && (
            <p className="text-[10px] font-semibold tracking-widest text-slate-600 px-3 pb-2">
              ACCOUNT
            </p>
          )}
          <button
            title={collapsed ? "Profile" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-white hover:bg-[#ffffff]/5 transition-all"
          >
            <User size={16} className="shrink-0" />
            {!collapsed && "Profile"}
          </button>
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-1"
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </nav>

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

export default Sidebar;
