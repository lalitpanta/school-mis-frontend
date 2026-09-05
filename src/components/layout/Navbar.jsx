import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Moon, Sun, ChevronDown, LogOut, User, Settings,
  Bell, Building2,
} from "lucide-react";

// Map pathnames to page titles
const PAGE_TITLES = {
  "/": "Dashboard",
  "/calendar": "Calendar",
  "/attendance": "Attendance",
  "/teacher": "Teachers",
  "/student": "Students",
  "/employee": "Employees",
  "/settings": "Settings",
  "/fee-payroll": "Fee & Payroll",
  "/accounts": "Accounts",
  "/results": "Results",
  "/result-portal-module": "Result Portal",
  "/daily-reports": "Daily Reports",
  "/leave-management": "Leave Management",
};

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isTenant, logout } = useAuth();
  const { settings } = useSettings();
  const { isDark, toggleDark } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const profileRef = useRef(null);
  const schoolRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (schoolRef.current && !schoolRef.current.contains(e.target))
        setSchoolOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const schoolProfile = settings?.school_profile || {};
  const brandName =
    schoolProfile.name ||
    settings?.system_name ||
    settings?.platform_name ||
    "School MIS";
  const brandAddress = schoolProfile.address || schoolProfile.tagline || "";

  const pageTitle = PAGE_TITLES[pathname] || "Dashboard";

  const name = user?.name || user?.firstName || user?.email || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = user?.type === "super_admin"
    ? "Super Admin"
    : isTenant()
      ? "Tenant Admin"
      : "Admin";

  return (
    <header
      className="flex items-center gap-3 shrink-0 transition-colors duration-200"
      style={{
        height: 56,
        padding: "0 20px",
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border-dim)",
      }}
    >
      {/* ── Page Title ── */}
      <div className="mr-auto">
        <h2
          className="text-[15px] font-bold tracking-tight leading-none"
          style={{ color: "var(--text-1)" }}
        >
          {pageTitle}
        </h2>
      </div>

      {/* ── School Info Pill ── */}
      {Object.keys(schoolProfile).length > 0 && (
        <div className="relative hidden md:block" ref={schoolRef}>
          <button
            onClick={() => setSchoolOpen((s) => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border-dim)",
              color: "var(--text-2)",
            }}
          >
            <Building2 size={13} />
            <span className="text-xs font-semibold max-w-[140px] truncate" style={{ color: "var(--text-1)" }}>
              {brandName}
            </span>
            <ChevronDown
              size={11}
              style={{
                transform: schoolOpen ? "rotate(180deg)" : "none",
                transition: "transform .2s ease",
              }}
            />
          </button>

          {schoolOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-xl z-50 shadow-xl"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
              }}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {schoolProfile.logo ? (
                    <img
                      src={schoolProfile.logo}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {brandName[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
                      {brandName}
                    </p>
                    {brandAddress && (
                      <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                        {brandAddress}
                      </p>
                    )}
                  </div>
                </div>
                {schoolProfile.email && (
                  <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>
                    {schoolProfile.email}
                  </p>
                )}
                {schoolProfile.phone && (
                  <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
                    {schoolProfile.phone}
                  </p>
                )}
                <button
                  onClick={() => { setSchoolOpen(false); navigate("/settings?tab=school"); }}
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-white transition-colors"
                  style={{ background: "var(--accent)" }}
                >
                  Edit School Profile
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Theme Toggle ── */}
      <button
        onClick={toggleDark}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
        style={{
          background: "var(--bg-hover)",
          border: "1px solid var(--border-dim)",
          color: "var(--text-2)",
        }}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* ── Profile Menu ── */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((s) => !s)}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors"
          style={{
            background: profileOpen ? "var(--bg-hover)" : "transparent",
            border: "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border-dim)";
          }}
          onMouseLeave={(e) => {
            if (!profileOpen) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background: "var(--accent)" }}
          >
            {initials}
          </div>
          <div className="hidden md:block leading-tight text-left">
            <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
              {name.split(" ")[0]}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
              {roleLabel}
            </p>
          </div>
          <ChevronDown
            size={11}
            style={{
              color: "var(--text-3)",
              transform: profileOpen ? "rotate(180deg)" : "none",
              transition: "transform .2s ease",
            }}
          />
        </button>

        {profileOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-52 rounded-xl z-50 shadow-xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            {/* User header */}
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-dim)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--text-1)" }}>
                    {name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>
                    {user?.email || roleLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              <button
                onClick={() => { setProfileOpen(false); navigate("/settings?tab=profile"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                style={{ color: "var(--text-2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; }}
              >
                <User size={13} />
                My Profile
              </button>
              <button
                onClick={() => { setProfileOpen(false); navigate("/settings?tab=school"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                style={{ color: "var(--text-2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; }}
              >
                <Settings size={13} />
                Settings
              </button>

              <div style={{ height: 1, background: "var(--border-dim)", margin: "4px 0" }} />

              <button
                onClick={() => { setProfileOpen(false); logout(); navigate("/login"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                style={{ color: "#f43f5e" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
