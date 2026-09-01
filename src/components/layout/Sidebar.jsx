import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  GraduationCap,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  BarChart3,
  Briefcase,
  FileText,
  CreditCard,
  Clock,
  ChevronRight,
  ChevronLeft,
  Building,
  BookOpen,
  ShieldCheck,
  Bell,
  Plug,
  Smartphone,
  Lock,
  Palette,
  Building2,
  DoorOpen,
  UserCog,
  ClipboardCheck,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { ROUTES } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

// ── Navigation items ──────────────────────────────────────────────────────────
const MAIN_NAV = [
  { label: "Dashboard",      icon: LayoutDashboard, to: ROUTES.DASHBOARD,      module: "dashboard"       },
  { label: "Calendar",       icon: Calendar,        to: ROUTES.CALENDAR,        module: "calendar"        },
  { label: "Attendance",     icon: ClipboardList,   to: ROUTES.ATTENDANCE,      module: "attendance"      },
  { label: "Teachers",       icon: Users,           to: ROUTES.TEACHER,         module: "teacher"         },
  { label: "Students",       icon: GraduationCap,   to: ROUTES.STUDENT,         module: "student"         },
  { label: "Employees",      icon: Briefcase,       to: ROUTES.EMPLOYEE,        module: "employee"        },
  { label: "Results",        icon: BarChart3,       to: ROUTES.RESULTS,         module: "results"         },
  { label: "Result Portal",  icon: FileText,        to: ROUTES.RESULT_PORTAL,   module: "result_portal"   },
  { label: "Daily Reports",  icon: FileText,        to: ROUTES.DAILY_REPORTS,   module: "daily_reports"   },
  { label: "Fees",           icon: CreditCard,      to: ROUTES.FEES,            module: "fee_management"  },
  { label: "Leave",          icon: Clock,           to: ROUTES.LEAVE_MANAGEMENT,module: "leave_management"},
];

// Settings sub-tabs with Lucide icons for a cleaner look
const SETTINGS_TABS = [
  { key: "school",            label: "School Profile",     icon: Building2     },
  { key: "academic",          label: "Academic Calendar",  icon: Calendar      },
  { key: "calendarSettings",  label: "Calendar Settings",  icon: ClipboardCheck},
  { key: "users",             label: "Users & Staff",      icon: Users         },
  { key: "roles",             label: "Roles & Permissions",icon: ShieldCheck   },
  { key: "fees",              label: "Fees",               icon: CreditCard    },
  { key: "notices",           label: "Notices & SMS",      icon: Bell          },
  { key: "integrations",      label: "Integrations",       icon: Plug          },
  { key: "devices",           label: "Device Integration", icon: Smartphone    },
  { key: "security",          label: "Security",           icon: Lock          },
  { key: "theme",             label: "Theme",              icon: Palette       },
  { key: "departments",       label: "Departments",        icon: Building      },
  { key: "classrooms",        label: "Classrooms",         icon: BookOpen      },
  { key: "courses",           label: "Courses",            icon: BookOpen      },
  { key: "rooms",             label: "Rooms",              icon: DoorOpen      },
  { key: "students",          label: "Students",           icon: GraduationCap },
];

const EXAM_TABS = [
  { key: "resultFormat",  label: "Exam Setup",     icon: ClipboardCheck },
  { key: "resultSubject", label: "Course & Marks", icon: BookOpen       },
];

// ── Sidebar component ─────────────────────────────────────────────────────────
const Sidebar = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { hasModule, isTenant, logout, user } = useAuth();
  const { settings } = useSettings();

  const schoolProfile = settings?.school_profile || {};
  const brandName = settings?.platform_name || settings?.system_name || schoolProfile.name || "School MIS";
  const brandTagline = settings?.platform_tagline || schoolProfile.motto || "Management System";
  const brandLogo = settings?.platform_logo || schoolProfile.logo || null;

  const [collapsed,     setCollapsed]     = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [examOpen,      setExamOpen]      = useState(false);

  const onSettings  = location.pathname === ROUTES.SETTINGS;
  const activeTab   = new URLSearchParams(location.search).get("tab") || "school";
  const isExamTab   = EXAM_TABS.some((t) => t.key === activeTab);

  // Auto-open correct accordion when landing on /settings
  useEffect(() => {
    if (onSettings) {
      if (isExamTab) { setExamOpen(true); setSettingsOpen(false); }
      else            { setSettingsOpen(true); setExamOpen(false); }
    }
  }, [onSettings, isExamTab]);

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

  const toggleExam = () => {
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

  // Determine which nav items to show
  const visibleNav = (() => {
    if (user?.type === "super_admin")
      return MAIN_NAV.filter((i) => i.module === "dashboard");
    if (isTenant())
      return MAIN_NAV.filter((i) => hasModule(i.module));
    return MAIN_NAV;
  })();

  const showSettings = user?.type !== "super_admin" && (!isTenant() || hasModule("settings"));

  // ── Shared styles ──────────────────────────────────────────────────────────
  const navItemBase = clsx(
    "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 w-full",
  );
  const navItemActive = "text-white";
  const navItemInactive = "text-slate-400 hover:text-white hover:bg-white/5";

  const activeStyle = {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.25)",
    color: "white",
  };
  const inactiveStyle = { border: "1px solid transparent" };

  return (
    <aside
      style={{
        background: "#08091a",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        width: collapsed ? 60 : 220,
        minWidth: collapsed ? 60 : 220,
      }}
      className="relative flex flex-col h-screen shrink-0 transition-all duration-300 ease-in-out select-none z-20"
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-3.5 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
          style={{ background: "var(--accent)", minWidth: 32 }}
        >
          {brandLogo
            ? <img src={brandLogo} alt="logo" className="w-full h-full object-cover" />
            : <GraduationCap size={16} className="text-white" />
          }
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="text-white font-bold text-[13px] truncate">{brandName}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">{brandTagline}</p>
          </div>
        )}
      </div>

      {/* ── Scrollable nav ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 flex flex-col gap-0.5">

        {/* Section label */}
        {!collapsed && (
          <p className="px-2 pb-1.5 pt-0.5 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
            Main
          </p>
        )}

        {/* Main nav items */}
        {visibleNav.map(({ label, icon: Icon, to }) => {
          const active = isNavActive(to);
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={clsx(navItemBase, active ? navItemActive : navItemInactive)}
              style={active ? activeStyle : inactiveStyle}
            >
              <Icon size={15} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}

        {/* Tenants link for non-tenant users */}
        {!isTenant() && (
          <NavLink
            to={user?.type === "super_admin" ? "/superadmin/tenants" : "/admin/tenants"}
            title={collapsed ? "Tenants" : undefined}
            className={clsx(
              navItemBase,
              isNavActive(user?.type === "super_admin" ? "/superadmin/tenants" : "/admin/tenants")
                ? navItemActive : navItemInactive,
            )}
            style={
              isNavActive(user?.type === "super_admin" ? "/superadmin/tenants" : "/admin/tenants")
                ? activeStyle : inactiveStyle
            }
          >
            <Building size={15} className="shrink-0" />
            {!collapsed && <span className="truncate">Tenants</span>}
          </NavLink>
        )}

        {/* ── Settings section ────────────────────────────────────────────── */}
        {showSettings && (
          <>
            {!collapsed && (
              <p className="px-2 pb-1.5 pt-3 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
                Configuration
              </p>
            )}

            {/* Settings accordion trigger */}
            <AccordionTrigger
              icon={Settings}
              label="Settings"
              collapsed={collapsed}
              isOpen={settingsOpen}
              isHighlighted={onSettings && !isExamTab}
              onClick={toggleSettings}
            />

            {/* Settings sub-items */}
            {!collapsed && settingsOpen && (
              <div className="mt-0.5 mb-1 ml-2 pl-2 border-l border-slate-800 flex flex-col gap-0.5 settings-sub">
                {SETTINGS_TABS.map(({ key, label, icon: Icon }) => {
                  const active = onSettings && activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => navigate(`${ROUTES.SETTINGS}?tab=${key}`)}
                      className={clsx(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-left w-full transition-all duration-100",
                        active
                          ? "text-white"
                          : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]",
                      )}
                      style={active ? { background: "rgba(99,102,241,0.12)", color: "white" } : {}}
                    >
                      <Icon
                        size={13}
                        className="shrink-0"
                        style={{ color: active ? "var(--accent)" : undefined }}
                      />
                      <span className="truncate">{label}</span>
                      {active && (
                        <span
                          className="ml-auto w-1 h-1 rounded-full shrink-0"
                          style={{ background: "var(--accent)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Exam & Result accordion trigger */}
            <AccordionTrigger
              icon={BarChart3}
              label="Exam & Result"
              collapsed={collapsed}
              isOpen={examOpen}
              isHighlighted={onSettings && isExamTab}
              onClick={toggleExam}
            />

            {/* Exam sub-items */}
            {!collapsed && examOpen && (
              <div className="mt-0.5 mb-1 ml-2 pl-2 border-l border-slate-800 flex flex-col gap-0.5 settings-sub">
                {EXAM_TABS.map(({ key, label, icon: Icon }) => {
                  const active = onSettings && activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => navigate(`${ROUTES.SETTINGS}?tab=${key}`)}
                      className={clsx(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-left w-full transition-all duration-100",
                        active
                          ? "text-white"
                          : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]",
                      )}
                      style={active ? { background: "rgba(99,102,241,0.12)", color: "white" } : {}}
                    >
                      <Icon
                        size={13}
                        className="shrink-0"
                        style={{ color: active ? "var(--accent)" : undefined }}
                      />
                      <span className="truncate">{label}</span>
                      {active && (
                        <span
                          className="ml-auto w-1 h-1 rounded-full shrink-0"
                          style={{ background: "var(--accent)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Account section ─────────────────────────────────────────────── */}
        <div className="mt-auto pt-3">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
              Account
            </p>
          )}
          <button
            title={collapsed ? "Profile" : undefined}
            onClick={() => navigate("/settings?tab=profile")}
            className={clsx(navItemBase, navItemInactive)}
            style={inactiveStyle}
          >
            <User size={15} className="shrink-0" />
            {!collapsed && <span className="truncate">Profile</span>}
          </button>
          <button
            title={collapsed ? "Sign Out" : undefined}
            onClick={() => { logout(); navigate("/login"); }}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 w-full",
              "text-rose-500 hover:text-rose-400 hover:bg-rose-500/8",
            )}
            style={inactiveStyle}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </nav>

      {/* ── Collapse toggle ───────────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all z-30 hover:scale-110"
        style={{
          background: "#1e2a3a",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#94a3b8",
        }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
};

// ── AccordionTrigger sub-component ────────────────────────────────────────────
const AccordionTrigger = ({ icon: Icon, label, collapsed, isOpen, isHighlighted, onClick }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={clsx(
      "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 w-full",
      isHighlighted || isOpen
        ? "text-white"
        : "text-slate-400 hover:text-white hover:bg-white/5",
    )}
    style={
      isHighlighted || isOpen
        ? {
            background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
          }
        : { border: "1px solid transparent" }
    }
  >
    <Icon size={15} className="shrink-0" />
    {!collapsed && (
      <>
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown
          size={12}
          style={{
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform .2s ease",
            flexShrink: 0,
          }}
        />
      </>
    )}
  </button>
);

export default Sidebar;
