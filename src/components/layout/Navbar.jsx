// icons removed from navbar; keep file minimal
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const pageMeta = {
  "/": { title: "Dashboard", sub: "Academic Year 2025–26" },
  "/calendar": { title: "Calendar", sub: "Academic Year 2025–26" },
  "/attendance": { title: "Attendance", sub: "Daily Tracker" },
  "/settings": { title: "Settings", sub: "System Configuration" },
};

const Navbar = () => {
  const { pathname } = useLocation();
  const { user, isTenant, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const meta = pageMeta[pathname] || pageMeta["/"];
  const { settings } = useSettings();
  const schoolProfile = settings?.school_profile || {};
  const brandName =
    schoolProfile.name ||
    settings?.system_name ||
    settings?.platform_name ||
    "Pathsala Tracker";
  const brandTagline =
    schoolProfile.address ||
    settings?.platform_name ||
    settings?.platform_tagline ||
    schoolProfile.tagline ||
    meta.sub;
  const [showSchoolList, setShowSchoolList] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleDark } = useTheme();

  // Get tenant/admin name and initials
  const name = user?.name || user?.firstName || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate("/login");
  };

  return (
    <header
      className="flex items-center gap-4 h-15 px-6 shrink-0 transition-colors duration-300"
      style={{
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border-card)",
      }}
    >
      {/* Brand: static Pathsala Tracker; if school_profile exists show a foldable list */}
      <div className="flex items-center gap-2.5 mr-auto relative">
        <div className="flex items-center gap-2.5">
          {schoolProfile.logo ? (
            <img
              src={schoolProfile.logo}
              alt="School Logo"
              className="w-8 h-8 rounded-md object-contain"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <h1
              className="text-[17px] font-bold tracking-tight"
              style={{ color: "var(--text-1)" }}
            >
              {brandName}
            </h1>
            <span
              className="text-xs hidden sm:block"
              style={{ color: "var(--text-2)" }}
            >
              {brandTagline}
            </span>
          </div>
        </div>
        {schoolProfile && Object.keys(schoolProfile).length > 0 && (
          <button
            onClick={() => setShowSchoolList((s) => !s)}
            className="ml-3 p-1 rounded hover:bg-slate-200/40"
            style={{ color: "var(--text-2)" }}
            title="Show school"
          >
            {/* simple down/up indicator */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={showSchoolList ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
            </svg>
          </button>
        )}

        {/* Dropdown list */}
        {showSchoolList && (
          <div
            className="absolute left-0 top-full mt-2 w-64 rounded-xl z-50"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="p-3">
              <p className="text-xs mb-2" style={{ color: "var(--text-2)" }}>
                School
              </p>
              <ul
                className="text-sm space-y-1"
                style={{ color: "var(--text-1)" }}
              >
                <li className="truncate">
                  <strong>Name:</strong> {schoolProfile.name || "-"}
                </li>
                <li className="truncate">
                  <strong>Email:</strong> {schoolProfile.email || "-"}
                </li>
                <li className="truncate">
                  <strong>Phone:</strong> {schoolProfile.phone || "-"}
                </li>
              </ul>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setShowSchoolList(false);
                    navigate("/settings?tab=school");
                  }}
                  className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side: theme toggle + profile menu */}
      <button
        onClick={toggleDark}
        className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-200/40 hover:text-(--text-1)"
        style={{ color: "var(--text-2)" }}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative ml-2">
        <button
          onClick={() => setShowProfileMenu((s) => !s)}
          className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200/40 transition-colors"
          style={{
            borderLeft: "1px solid var(--border-card)",
            color: "var(--text-2)",
          }}
        >
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="hidden md:block leading-tight">
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              {user?.name || user?.email || "User"}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-2)" }}>
              {isTenant() ? "Tenant" : "Admin"}
            </p>
          </div>
        </button>

        {showProfileMenu && (
          <div
            className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-50 border border-slate-700 overflow-hidden"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="p-3 border-b border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Account
              </p>
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/settings?tab=profile");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-colors"
              >
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
