import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SchoolProfile from "../components/settings/SchoolProfile";
import CalendarSettings from "../components/settings/CalendarSettings";
import UsersStaff from "../components/settings/UsersStaff";
import RolesPermissions from "../components/settings/RolesPermissions";
import Security from "../components/settings/Security";
import UserProfile from "../components/settings/UserProfile";
import Departments from "../components/settings/Departments";
import Students from "../components/settings/Students";
import Classrooms from "../components/settings/Classrooms";
import Courses from "../components/settings/Courses";
import Rooms from "../components/settings/Rooms";
import Integrations from "../components/settings/Integrations";
import NoticesSms from "../components/settings/NoticesSms";
import DeviceIntegration from "./settings/DeviceIntegration";
import ResultManagementModule from "../components/settings/ResultManagementModule";
import Theme from "../components/settings/Theme";
import Accounts from "../components/settings/Accounts";
import Backup from "../components/settings/Backup";
import ActivityLog from "../components/settings/ActivityLog";
import ActiveSessions from "../components/settings/ActiveSessions";

// Map tab keys to rendered panels
const PANEL_MAP = {
  school: <SchoolProfile />,
  calendarSettings: <CalendarSettings />,
  users: <UsersStaff />,
  roles: <RolesPermissions />,
  notices: <NoticesSms />,
  integrations: <Integrations />,
  devices: <DeviceIntegration />,
  security: <Security />,
  backup: <Backup />,
  activityLog: <ActivityLog />,
  activeSessions: <ActiveSessions />,
  departments: <Departments />,
  classrooms: <Classrooms />,
  courses: <Courses />,
  rooms: <Rooms />,
  students: <Students />,
  resultFormat: <ResultManagementModule moduleType="format" />,
  resultSubject: <ResultManagementModule moduleType="subject" />,
  theme: <Theme />,
  profile: <UserProfile />,
  accounts: <Accounts />,
};

const SETTINGS_NAV = [
  {
    title: "Core Settings",
    items: [
      { key: "school", label: "School Profile" },
      { key: "calendarSettings", label: "Calendar Settings" },
      { key: "theme", label: "Theme" },
      { key: "profile", label: "My Profile" },
    ],
  },
  {
    title: "Access & Security",
    items: [
      { key: "users", label: "Users & Staff" },
      { key: "roles", label: "Roles & Permissions" },
      { key: "security", label: "Security" },
    ],
  },
  {
    title: "Communication",
    items: [
      { key: "notices", label: "SMS" },
      { key: "integrations", label: "Email Settings" },
    ],
  },
  {
    title: "Facilities & Classrooms",
    items: [
      { key: "departments", label: "Departments" },
      { key: "classrooms", label: "Classrooms" },
      { key: "courses", label: "Courses" },
      { key: "rooms", label: "Rooms" },
      { key: "students", label: "Students" },
    ],
  },
  {
    title: "System",
    items: [
      { key: "devices", label: "Device Integration" },
      { key: "backup", label: "Backup" },
      { key: "activityLog", label: "Activity Log" },
      { key: "activeSessions", label: "Active Sessions" },
    ],
  },
];

const TAB_LABELS = {
  school: "School Profile",
  calendarSettings: "Calendar Settings",
  users: "Users & Staff",
  roles: "Roles & Permissions",
  notices: "SMS",
  integrations: "Email Settings",
  devices: "Device Integration",
  security: "Security",
  backup: "Backup",
  activityLog: "Activity Log",
  activeSessions: "Active Sessions",
  departments: "Departments",
  classrooms: "Classrooms",
  courses: "Courses",
  rooms: "Rooms",
  students: "Students",
  resultFormat: "Exam Setup",
  resultSubject: "Course & Marks",
  theme: "Theme",
  profile: "My Profile",
  accounts: "Accounts",
};

const SETTINGS_TAB_PERMISSIONS = {
  school: ["settings.school.view", "school.view"],
  profile: ["settings.profile.view", "profile.view"],
  calendarSettings: [
    "settings.calendarsettings.view",
    "settings.academic.view",
    "calendarSettings.view",
    "academic.view",
  ],
  theme: ["settings.theme.view", "theme.view"],
  users: ["settings.users.view", "users.view"],
  roles: ["settings.roles.view", "roles.view"],
  security: ["settings.security.view", "security.view"],
  notices: ["settings.notices.view", "notices.view"],
  integrations: ["settings.integrations.view", "integrations.view"],
  devices: ["settings.devices.view", "devices.view"],
  backup: ["settings.backup.view", "backup.view"],
  activityLog: ["settings.activitylog.view", "activityLog.view"],
  activeSessions: ["settings.activesessions.view", "activeSessions.view"],
  departments: ["settings.departments.view", "departments.view"],
  classrooms: ["settings.classrooms.view", "classrooms.view"],
  courses: ["settings.courses.view", "courses.view"],
  rooms: ["settings.rooms.view", "rooms.view"],
  students: ["settings.students.view", "students.view"],
};

const SETTINGS_TAB_PERMISSION_PREFIXES = {
  school: ["settings.school", "school"],
  profile: ["settings.profile", "profile"],
  calendarSettings: ["settings.calendarsettings", "settings.academic", "academic"],
  theme: ["settings.theme", "theme"],
  users: ["users", "settings.users"],
  roles: ["roles", "settings.roles"],
  security: ["settings.security", "security"],
  notices: ["settings.notices", "notices"],
  integrations: ["settings.integrations", "integrations"],
  devices: ["settings.devices", "devices"],
  backup: ["settings.backup", "backup"],
  activityLog: ["settings.activitylog", "activitylog"],
  activeSessions: ["settings.activesessions", "activesessions"],
  departments: ["settings.departments", "departments"],
  classrooms: ["settings.classrooms", "classrooms"],
  courses: ["settings.courses", "courses"],
  rooms: ["settings.rooms", "rooms"],
  students: ["settings.students", "students"],
};

const SettingsPage = () => {
  const [params, setParams] = useSearchParams();
  const { user, isTenant } = useAuth();
  const requestedTab = params.get("tab") || "school";
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((permission) => String(permission).toLowerCase())
    : [];
  const canViewAllSettings = isTenant() || permissions.includes("settings.view");
  const visibleSettingsNav = SETTINGS_NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        canViewAllSettings ||
        (SETTINGS_TAB_PERMISSIONS[item.key] || []).some((permission) =>
          permissions.includes(permission),
        ),
    ),
  })).filter((group) => group.items.length > 0);
  const visibleTabKeys = visibleSettingsNav.flatMap((group) =>
    group.items.map((item) => item.key),
  );
  const tab = visibleTabKeys.includes(requestedTab)
    ? requestedTab
    : visibleTabKeys[0] || "school";
  const label = TAB_LABELS[tab] ?? "Settings";
  const permissionPrefixes = SETTINGS_TAB_PERMISSION_PREFIXES[tab] || [];
  const canEditTab =
    canViewAllSettings ||
    permissions.includes("settings.edit") ||
    permissionPrefixes.some((prefix) =>
      ["create", "edit", "delete"].some((action) =>
        permissions.includes(`${prefix}.${action}`),
      ),
    );

  useEffect(() => {
    if (tab !== requestedTab && visibleTabKeys.length > 0) {
      setParams({ tab }, { replace: true });
    }
  }, [requestedTab, setParams, tab, visibleTabKeys.length]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="shrink-0">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          Settings
        </p>
        <h1
          className="text-lg font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </h1>
      </div>

      <div
        className="flex-1 min-h-0 overflow-hidden rounded-2xl"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
          display: "grid",
          gridTemplateColumns: "190px minmax(0, 1fr)",
        }}
      >
        <aside
          style={{
            background: "var(--bg-sidebar)",
            borderRight: "1px solid var(--border-dim)",
            color: "var(--text-primary)",
            width: "190px",
            minWidth: "190px",
          }}
          className="h-full overflow-y-auto p-3"
        >
          {visibleSettingsNav.map((group) => (
            <div key={group.title} className="mb-4">
              <div
                className="px-3 pb-2 pt-2 text-[9px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--accent)" }}
              >
                {group.title}
              </div>

              {group.items.map((item) => {
                const active = item.key === tab;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setParams({ tab: item.key })}
                    className="w-full flex items-center gap-2.5 rounded-xl border text-left text-sm font-medium transition-all duration-150"
                    style={{
                      background: active
                        ? "var(--accent-dim)"
                        : "transparent",
                      borderColor: active
                        ? "var(--accent)"
                        : "transparent",
                      color: active
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                      padding: "8px 10px",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      className="inline-block rounded-full"
                      style={{
                        width: "6px",
                        height: "6px",
                        background: active
                          ? "var(--accent)"
                          : "var(--border-card)",
                        boxShadow: active
                          ? "0 0 0 4px var(--accent-dim)"
                          : "none",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "12.5px", lineHeight: 1.35 }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="h-full overflow-y-auto p-4 md:p-5">
          <fieldset
            disabled={!canEditTab}
            className="m-0 min-w-0 border-0 p-0 disabled:opacity-100"
          >
            {PANEL_MAP[tab] ?? PANEL_MAP.school}
          </fieldset>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
