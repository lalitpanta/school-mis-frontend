import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Check,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bell,
  Building2,
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
  const { theme, setTheme } = useTheme();

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

  const roleLabel =
    user?.type === "super_admin"
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
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      {/* ── Page Title ── */}
      <div className="mr-auto">
        <h2
          className="text-[15px] font-bold tracking-tight leading-none"
          style={{ color: "var(--text-primary)" }}
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
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
            }}
          >
            <Building2 size={13} />
            <span
              className="text-xs font-semibold max-w-[140px] truncate"
              style={{ color: "var(--text-primary)" }}
            >
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
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
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
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-on-accent"
                      style={{ background: "var(--accent)" }}
                    >
                      {brandName[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {brandName}
                    </p>
                    {brandAddress && (
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {brandAddress}
                      </p>
                    )}
                  </div>
                </div>
                {schoolProfile.email && (
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {schoolProfile.email}
                  </p>
                )}
                {schoolProfile.phone && (
                  <p
                    className="text-xs mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {schoolProfile.phone}
                  </p>
                )}
                <button
                  onClick={() => {
                    setSchoolOpen(false);
                    navigate("/settings?tab=school");
                  }}
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-on-accent transition-colors"
                  style={{ background: "var(--accent)" }}
                >
                  Edit School Profile
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Profile Menu ── */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((s) => !s)}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors"
          style={{
            background: profileOpen ? "var(--bg-subtle)" : "transparent",
            border: "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-subtle)";
            e.currentTarget.style.borderColor = "var(--border-default)";
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
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-on-accent shrink-0"
            style={{ background: "var(--accent)" }}
          >
            {initials}
          </div>
          <div className="hidden md:block leading-tight text-left">
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {name.split(" ")[0]}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {roleLabel}
            </p>
          </div>
          <ChevronDown
            size={11}
            style={{
              color: "var(--text-muted)",
              transform: profileOpen ? "rotate(180deg)" : "none",
              transition: "transform .2s ease",
            }}
          />
        </button>

        {profileOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl shadow-xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            {/* User header */}
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-on-accent shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-xs font-bold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {name}
                  </p>
                  <p
                    className="text-[10px] truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {user?.email || roleLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings?tab=profile");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-subtle)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <User size={13} />
                My Profile
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings?tab=school");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-subtle)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Settings size={13} />
                Settings
              </button>

              <div className="my-1 border-t border-default" />
              <div className="px-3 py-2">
                <p
                  id="theme-choice-label"
                  className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Appearance
                </p>
                <div
                  aria-labelledby="theme-choice-label"
                  role="group"
                  className="flex gap-1 rounded-lg bg-subtle p-1"
                >
                  {["system", "light", "dark"].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={theme === choice}
                      onClick={() => setTheme(choice)}
                      className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[11px] font-medium capitalize transition-colors ${
                        theme === choice
                          ? "bg-surface text-primary shadow-sm"
                          : "text-muted hover:text-primary"
                      }`}
                    >
                      {theme === choice && <Check size={12} aria-hidden="true" />}
                      {choice}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  height: 1,
                  background: "var(--border-default)",
                  margin: "4px 0",
                }}
              />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                  navigate("/login");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                style={{ color: "var(--danger)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "color-mix(in srgb, var(--danger) 8%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
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
