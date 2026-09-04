import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ROUTES } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION DATA
// ─────────────────────────────────────────────────────────────────────────────
const MAIN_NAV = [
  {
    label: "Dashboard",
    to: ROUTES.DASHBOARD,
    module: "dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    to: ROUTES.CALENDAR,
    module: "calendar",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 9h18" />
      </svg>
    ),
  },
  {
    label: "Attendance",
    to: ROUTES.ATTENDANCE,
    module: "attendance",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h3" />
      </svg>
    ),
  },
  {
    label: "Teachers",
    to: ROUTES.TEACHER,
    module: "teacher",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
        <circle cx="17.5" cy="8.5" r="2.4" />
        <path d="M17 13.7c2.7.4 4.5 2.7 4.5 5.6" />
      </svg>
    ),
  },
  {
    label: "Students",
    to: ROUTES.STUDENT,
    module: "student",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10L12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      </svg>
    ),
  },
  {
    label: "Employees",
    to: ROUTES.EMPLOYEE,
    module: "employee",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
        <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M3 12.5h18" />
      </svg>
    ),
  },
  {
    label: "Results",
    to: ROUTES.RESULTS,
    module: "results",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20V10M12 20V4M20 20v-7" />
      </svg>
    ),
  },
  {
    label: "Result Portal",
    to: ROUTES.RESULT_PORTAL,
    module: "result_portal",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    label: "Daily Reports",
    to: ROUTES.DAILY_REPORTS,
    module: "daily_reports",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 3v5h5M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    label: "Fees",
    to: ROUTES.FEES,
    module: "fee_management",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
        <path d="M2.5 10h19" />
      </svg>
    ),
  },
  {
    label: "Leave",
    to: ROUTES.LEAVE_MANAGEMENT,
    module: "leave_management",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.3 3.3" />
      </svg>
    ),
  },
  {
    label: "Accounts",
    to: "/settings?tab=accounts",
    module: "settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
        <path d="M2.5 10h19M7 15h2M12 15h2" />
      </svg>
    ),
  },
];

const SETTINGS_TABS = [
  { key: "school", label: "School Profile" },
  { key: "calendarSettings", label: "Calendar Settings" },
  { key: "users", label: "Users & Staff" },
  { key: "roles", label: "Roles & Permissions" },
  { key: "fees", label: "Fees" },
  { key: "notices", label: "Notices & SMS" },
  { key: "integrations", label: "Integrations" },
  { key: "devices", label: "Device Integration" },
  { key: "security", label: "Security" },
  { key: "theme", label: "Theme" },
  { key: "departments", label: "Departments" },
  { key: "classrooms", label: "Classrooms" },
  { key: "courses", label: "Courses" },
  { key: "rooms", label: "Rooms" },
  { key: "students", label: "Students" },
];

const EXAM_TABS = [
  { key: "resultFormat", label: "Exam Setup" },
  { key: "resultSubject", label: "Course & Marks" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const IconSettings = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    stroke="currentColor"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.92 2.92l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2.06 2.06 0 1 1-4.12 0v-.09A1.7 1.7 0 0 0 8.7 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.92-2.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H2.6a2.06 2.06 0 1 1 0-4.12h.09A1.7 1.7 0 0 0 4.24 8.7a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.92-2.92l.06.06a1.7 1.7 0 0 0 1.87.34H8.7a1.7 1.7 0 0 0 1-1.55V2.6a2.06 2.06 0 1 1 4.12 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.92 2.92l-.06.06a1.7 1.7 0 0 0-.34 1.87V8.7a1.7 1.7 0 0 0 1.55 1h.09a2.06 2.06 0 1 1 0 4.12h-.09a1.7 1.7 0 0 0-1.55 1Z" />
  </svg>
);

const IconExam = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    stroke="currentColor"
    style={{ flexShrink: 0 }}
  >
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, marginLeft: "auto" }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconChevronLeft = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const IconSignOut = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const IconSearch = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    stroke="currentColor"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconGradCap = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    stroke="currentColor"
  >
    <path d="M22 10L12 5 2 10l10 5 10-5Z" />
    <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// CSS (injected via <style> tag — same technique as HTML reference)
// ─────────────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

.mis-sidebar {
  --sb-bg:         var(--bg-sidebar);
  --sb-panel:      var(--bg-sidebar);
  --sb-panel-2:    var(--bg-surface);
  --sb-hover:      var(--bg-hover);
  --sb-active:     var(--accent-dim);
  --sb-border:     var(--border-card);
  --sb-border-s:   var(--border-dim);
  --sb-v500:       var(--accent);
  --sb-v400:       var(--accent);
  --sb-vglow:      var(--accent-dim);
  --sb-hi:         var(--text-1);
  --sb-mid:        var(--text-2);
  --sb-low:        var(--text-3);
  --sb-section:    var(--text-3);
  --sb-danger:     var(--danger);
  --sb-w:          296px;
  --sb-wc:         76px;

  width: var(--sb-w);
  min-width: var(--sb-w);
  height: 100vh;
  position: sticky;
  top: 0;
  background: var(--sb-bg);
  border-right: 1px solid var(--sb-border-s);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width .28s cubic-bezier(.4,0,.2,1), min-width .28s cubic-bezier(.4,0,.2,1);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  z-index: 20;
  overflow: hidden;
}

.mis-sidebar.sb-collapsed {
  width: var(--sb-wc);
  min-width: var(--sb-wc);
}

/* ── Brand ─────────────────────────────────── */
.sb-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 20px;
  border-bottom: 1px solid var(--sb-border-s);
  position: relative;
  flex-shrink: 0;
}

.sb-brand-mark {
  width: 38px; height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--sb-v500), #4d3ff0);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px var(--sb-vglow);
  flex-shrink: 0;
}
.sb-brand-mark svg { width: 20px; height: 20px; stroke: var(--accent-text); }

.sb-brand-text {
  overflow: hidden;
  white-space: nowrap;
  transition: opacity .18s, width .18s;
  min-width: 0;
}
.mis-sidebar.sb-collapsed .sb-brand-text { opacity: 0; width: 0; }

.sb-brand-title {
  font-family: 'Sora', sans-serif;
  font-size: 16px; font-weight: 700;
  color: var(--sb-hi); letter-spacing: .1px;
}
.sb-brand-sub {
  font-size: 10.5px; font-weight: 600;
  color: var(--sb-v400);
  letter-spacing: 1.3px; text-transform: uppercase; margin-top: 2px;
}

.sb-collapse-btn {
  position: absolute; right: -13px; top: 26px;
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--sb-panel-2); border: 1px solid var(--sb-border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--sb-mid);
  transition: background .15s, color .15s;
  z-index: 5;
  flex-shrink: 0;
}
.sb-collapse-btn:hover { background: var(--sb-hover); color: var(--sb-hi); }
.sb-collapse-btn svg {
  width: 13px; height: 13px;
  transition: transform .28s cubic-bezier(.4,0,.2,1);
}
.mis-sidebar.sb-collapsed .sb-collapse-btn svg { transform: rotate(180deg); }

/* ── Search ─────────────────────────────────── */
.sb-search-wrap {
  padding: 14px 16px 6px;
  flex-shrink: 0;
  transition: opacity .15s;
}
.mis-sidebar.sb-collapsed .sb-search-wrap { display: none; }

.sb-search-box {
  display: flex; align-items: center; gap: 9px;
  background: var(--sb-panel-2);
  border: 1px solid var(--sb-border);
  border-radius: 9px;
  padding: 9px 12px;
  color: var(--sb-low);
  transition: border-color .15s;
}
.sb-search-box:focus-within { border-color: var(--sb-v500); }
.sb-search-box svg { width: 15px; height: 15px; flex-shrink: 0; stroke: var(--sb-low); }
.sb-search-input {
  background: none; border: none; outline: none;
  width: 100%; font-size: 13px; color: var(--sb-hi);
  font-family: 'Inter', sans-serif;
}
.sb-search-input::placeholder { color: var(--sb-low); }
.sb-kbd {
  font-size: 10px; color: var(--sb-low);
  background: var(--sb-panel); border: 1px solid var(--sb-border);
  border-radius: 4px; padding: 1px 5px; flex-shrink: 0;
}

/* ── Nav scroll ─────────────────────────────── */
.sb-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px 12px;
}
.sb-nav::-webkit-scrollbar { width: 4px; }
.sb-nav::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 6px; }
.sb-nav::-webkit-scrollbar-track { background: transparent; }

/* ── Section label ──────────────────────────── */
.sb-section-label {
  font-size: 11.5px; font-weight: 700;
  letter-spacing: 1.2px; color: var(--sb-section);
  text-transform: uppercase;
  padding: 16px 12px 7px;
  white-space: nowrap; overflow: hidden;
  transition: opacity .15s;
}
.mis-sidebar.sb-collapsed .sb-section-label {
  opacity: 0; height: 8px; padding: 8px 0 0;
}

/* ── Nav item ───────────────────────────────── */
.sb-item {
  display: flex; align-items: center; gap: 14px;
  padding: 11.5px 12px;
  border-radius: 9px;
  color: var(--sb-mid);
  text-decoration: none;
  font-size: 16px; font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: background .15s, color .15s;
  white-space: nowrap;
  margin-bottom: 2px;
  border: none; background: transparent;
  width: 100%; text-align: left;
  font-family: 'Inter', sans-serif;
}
.sb-item:hover { background: var(--sb-hover); color: var(--sb-hi); }

.sb-item svg:first-child { width: 20px; height: 20px; flex-shrink: 0; stroke: currentColor; }

.sb-item-label { overflow: hidden; text-overflow: ellipsis; flex: 1; }
.mis-sidebar.sb-collapsed .sb-item-label { display: none; }
.mis-sidebar.sb-collapsed .sb-item-chev { display: none; }
.mis-sidebar.sb-collapsed .sb-item { justify-content: center; padding: 11px 0; }

/* Active state */
.sb-item.sb-active {
  background: linear-gradient(90deg, var(--sb-active), rgba(124,108,246,0.08));
  color: var(--accent-text);
}
.sb-item.sb-active::before {
  content: '';
  position: absolute; left: -12px; top: 6px; bottom: 6px; width: 3px;
  background: linear-gradient(180deg, var(--sb-v400), var(--sb-v500));
  border-radius: 0 3px 3px 0;
}

/* Chevron — targets the last SVG in the accordion trigger */
.sb-item-chev {
  width: 14px; height: 14px;
  flex-shrink: 0;
  transition: transform .22s;
  color: var(--sb-low);
  stroke: currentColor;
}
.sb-group .sb-item > svg:last-of-type {
  transition: transform .22s;
}
.sb-group.sb-open .sb-item > svg:last-of-type { transform: rotate(180deg); }

/* Hide chevron SVG in collapsed mode */
.mis-sidebar.sb-collapsed .sb-item > svg:last-of-type { display: none; }

/* Dot (submenu items) */
.sb-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--sb-v400); flex-shrink: 0;
  box-shadow: 0 0 6px var(--sb-vglow);
}

/* ── Submenu ─────────────────────────────────── */
.sb-submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height .28s cubic-bezier(.4,0,.2,1);
  display: flex; flex-direction: column;
  padding-left: 15px;
  position: relative;
}
.sb-group.sb-open .sb-submenu { max-height: 900px; }

.sb-submenu::before {
  content: '';
  position: absolute; left: 26px; top: 2px; bottom: 10px; width: 1px;
  background: var(--sb-border);
}
.mis-sidebar.sb-collapsed .sb-submenu { display: none; }

.sb-submenu .sb-item {
  padding: 9px 12px 9px 22px;
  font-size: 14.5px;
  font-weight: 500;
}
.sb-submenu .sb-item svg:first-child { width: 15px; height: 15px; }
.sb-submenu .sb-item.sb-active::before { left: -3px; }

/* ── Tooltip (collapsed mode) ───────────────── */
.sb-tooltip {
  display: none;
  position: absolute;
  left: calc(100% + 12px); top: 50%;
  transform: translateY(-50%);
  background: var(--sb-panel-2); border: 1px solid var(--sb-border);
  padding: 7px 12px; border-radius: 7px;
  font-size: 13.5px; font-weight: 500;
  color: var(--sb-hi); white-space: nowrap;
  opacity: 0; pointer-events: none;
  transition: opacity .12s, transform .12s;
  box-shadow: 0 8px 20px rgba(0,0,0,.4);
  z-index: 100;
}
.mis-sidebar.sb-collapsed .sb-item .sb-tooltip { display: block; }
.mis-sidebar.sb-collapsed .sb-item:hover .sb-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(2px);
}

/* ── Footer ─────────────────────────────────── */
.sb-footer {
  border-top: 1px solid var(--sb-border-s);
  padding: 12px;
  flex-shrink: 0;
}
.sb-user-card {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 8px; border-radius: 10px;
  cursor: pointer;
  transition: background .15s;
  background: transparent; border: none;
  width: 100%; text-align: left;
  font-family: 'Inter', sans-serif;
}
.sb-user-card:hover { background: var(--sb-hover); }

.sb-avatar {
  width: 34px; height: 34px; border-radius: 9px;
  background: linear-gradient(135deg, #8b7ffa, #5b4bd6);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Sora', sans-serif; font-weight: 700;
  font-size: 13px; color: #fff;
  flex-shrink: 0;
}
.sb-user-meta { overflow: hidden; white-space: nowrap; flex: 1; }
.mis-sidebar.sb-collapsed .sb-user-meta { display: none; }
.mis-sidebar.sb-collapsed .sb-signout { display: none; }

.sb-user-name { font-size: 13.5px; font-weight: 600; color: var(--sb-hi); }
.sb-user-role { font-size: 12px; color: var(--sb-low); }

.sb-signout { color: var(--sb-low); flex-shrink: 0; }
.sb-signout svg { width: 16px; height: 16px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
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
    "School MIS";
  const brandTagline =
    settings?.platform_tagline || schoolProfile.motto || "Management System";
  const brandLogo = settings?.platform_logo || schoolProfile.logo || null;

  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  // ⌘K / Ctrl+K focuses the search box
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!collapsed) searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [collapsed]);

  const onSettings = location.pathname === ROUTES.SETTINGS;
  const activeTab = new URLSearchParams(location.search).get("tab") || "school";
  const isExamTab = EXAM_TABS.some((t) => t.key === activeTab);
  // Auto-open correct accordion when on /settings
  useEffect(() => {
    if (onSettings) {
      if (isExamTab) {
        setExamOpen(true);
        setSettingsOpen(false);
      } else {
        setSettingsOpen(true);
        setExamOpen(false);
      }
    }
  }, [onSettings, isExamTab]);

  const isNavActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname === to;

  // Determine visible nav items
  const visibleNav = (() => {
    if (user?.type === "super_admin")
      return MAIN_NAV.filter((i) => i.module === "dashboard");
    if (isTenant()) return MAIN_NAV.filter((i) => hasModule(i.module));
    return MAIN_NAV;
  })();

  const showSettings =
    user?.type !== "super_admin" && (!isTenant() || hasModule("settings"));

  // Initials from user name
  const name = user?.name || user?.firstName || user?.email || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const roleLabel =
    user?.type === "super_admin"
      ? "Super Admin"
      : isTenant()
        ? "Administrator"
        : "Admin";

  // Search filtering
  const q = search.trim().toLowerCase();
  const filteredNav = q
    ? visibleNav.filter((i) => i.label.toLowerCase().includes(q))
    : visibleNav;
  const filteredSettings = q
    ? SETTINGS_TABS.filter((t) => t.label.toLowerCase().includes(q))
    : SETTINGS_TABS;
  const filteredExam = q
    ? EXAM_TABS.filter((t) => t.label.toLowerCase().includes(q))
    : EXAM_TABS;
  // Auto-expand accordions when search has results inside them
  const settingsHasMatch = q ? filteredSettings.length > 0 : settingsOpen;
  const examHasMatch = q ? filteredExam.length > 0 : examOpen;

  const toggleSettings = () => {
    if (collapsed) {
      setCollapsed(false);
      setTimeout(() => {
        setSettingsOpen(true);
        setExamOpen(false);
      }, 50);
      if (!onSettings) navigate(`${ROUTES.SETTINGS}?tab=school`);
      return;
    }
    const next = !settingsOpen;
    setSettingsOpen(next);
    if (next && !onSettings) navigate(`${ROUTES.SETTINGS}?tab=school`);
  };

  const toggleExam = () => {
    if (collapsed) {
      setCollapsed(false);
      setTimeout(() => {
        setExamOpen(true);
        setSettingsOpen(false);
      }, 50);
      if (!onSettings) navigate(`${ROUTES.SETTINGS}?tab=resultFormat`);
      return;
    }
    const next = !examOpen;
    setExamOpen(next);
    if (next && !onSettings) navigate(`${ROUTES.SETTINGS}?tab=resultFormat`);
  };

  return (
    <>
      <style>{css}</style>
      <aside className={`mis-sidebar${collapsed ? " sb-collapsed" : ""}`}>
        {/* ── Brand ── */}
        <div className="sb-brand">
          <div className="sb-brand-mark">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt="logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 11,
                }}
              />
            ) : (
              <IconGradCap />
            )}
          </div>
          <div className="sb-brand-text">
            <div className="sb-brand-title">{brandName}</div>
            <div className="sb-brand-sub">{brandTagline}</div>
          </div>
          <button
            className="sb-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <IconChevronLeft />
          </button>
        </div>

        {/* ── Search ── */}
        <div className="sb-search-wrap">
          <div className="sb-search-box">
            <IconSearch />
            <input
              ref={searchRef}
              className="sb-search-input"
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="sb-kbd">⌘K</span>
          </div>
        </div>

        {/* ── Scrollable nav ── */}
        <nav className="sb-nav">
          <div className="sb-section-label">Main</div>

          {filteredNav.map(({ label, to, icon }) => {
            // Special active check for items whose `to` includes a query string (e.g. Accounts)
            const active = to.includes("?")
              ? location.pathname === to.split("?")[0] &&
                new URLSearchParams(to.split("?")[1]).get("tab") === activeTab
              : isNavActive(to);
            return (
              <button
                key={to}
                className={`sb-item${active ? " sb-active" : ""}`}
                onClick={() => navigate(to)}
                title={collapsed ? label : undefined}
              >
                {icon}
                <span className="sb-item-label">{label}</span>
                <span className="sb-tooltip">{label}</span>
              </button>
            );
          })}

          {/* Tenants (non-tenant users only) */}
          {!isTenant() && (
            <button
              className="sb-item"
              onClick={() =>
                navigate(
                  user?.type === "super_admin"
                    ? "/superadmin/tenants"
                    : "/admin/tenants",
                )
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
                <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M3 12.5h18" />
              </svg>
              <span className="sb-item-label">Tenants</span>
              <span className="sb-tooltip">Tenants</span>
            </button>
          )}

          {/* Empty search state */}
          {q &&
            filteredNav.length === 0 &&
            filteredSettings.length === 0 &&
            filteredExam.length === 0 && (
              <div
                style={{
                  padding: "20px 12px",
                  textAlign: "center",
                  color: "var(--sb-low)",
                  fontSize: 13,
                }}
              >
                No results for &ldquo;{search}&rdquo;
              </div>
            )}

          {/* ── Configuration section ── */}
          {showSettings && (
            <>
              <div className="sb-section-label">Configuration</div>

              {/* Settings accordion */}
              <div
                className={`sb-group${settingsOpen || settingsHasMatch ? " sb-open" : ""}`}
              >
                <button
                  className={`sb-item${onSettings && !isExamTab ? " sb-active" : ""}`}
                  onClick={toggleSettings}
                >
                  <IconSettings />
                  <span className="sb-item-label">Settings</span>
                  <IconChevronDown />
                  <span className="sb-tooltip">Settings</span>
                </button>
                <div className="sb-submenu">
                  {filteredSettings.map(({ key, label }) => {
                    const active = onSettings && activeTab === key;
                    return (
                      <button
                        key={key}
                        className={`sb-item${active ? " sb-active" : ""}`}
                        onClick={() =>
                          navigate(`${ROUTES.SETTINGS}?tab=${key}`)
                        }
                      >
                        <span className="sb-dot" />
                        <span className="sb-item-label">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exam & Result accordion */}
              <div
                className={`sb-group${examOpen || examHasMatch ? " sb-open" : ""}`}
              >
                <button
                  className={`sb-item${onSettings && isExamTab ? " sb-active" : ""}`}
                  onClick={toggleExam}
                >
                  <IconExam />
                  <span className="sb-item-label">Exam &amp; Result</span>
                  <IconChevronDown />
                  <span className="sb-tooltip">Exam &amp; Result</span>
                </button>
                <div className="sb-submenu">
                  {filteredExam.map(({ key, label }) => {
                    const active = onSettings && activeTab === key;
                    return (
                      <button
                        key={key}
                        className={`sb-item${active ? " sb-active" : ""}`}
                        onClick={() =>
                          navigate(`${ROUTES.SETTINGS}?tab=${key}`)
                        }
                      >
                        <span className="sb-dot" />
                        <span className="sb-item-label">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </nav>

        {/* ── Footer / Account ── */}
        <div className="sb-footer">
          <button
            className="sb-user-card"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            title="Sign out"
          >
            <div className="sb-avatar">{initials}</div>
            <div className="sb-user-meta">
              <div className="sb-user-name">
                {name.split(" ").slice(0, 2).join(" ")}
              </div>
              <div className="sb-user-role">{roleLabel}</div>
            </div>
            <div className="sb-signout">
              <IconSignOut />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
