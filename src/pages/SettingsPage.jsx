import { useSearchParams } from "react-router-dom";
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
    title: "Company",
    items: [
      { key: "school", label: "School Profile" },
      { key: "calendarSettings", label: "Calendar Settings" },
    ],
  },
  {
    title: "System",
    items: [
      { key: "security", label: "Security" },
      { key: "backup", label: "Backup" },
      { key: "theme", label: "Theme" },
    ],
  },
];

const TAB_LABELS = {
  school: "School Profile",
  calendarSettings: "Calendar Settings",
  users: "Users & Staff",
  roles: "Roles & Permissions",
  notices: "Notices & SMS",
  integrations: "Integrations",
  devices: "Device Integration",
  security: "Security",
  backup: "Backup",
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

const SettingsPage = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "school";
  const label = TAB_LABELS[tab] ?? "Settings";

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="shrink-0">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--text-3)" }}
        >
          Settings
        </p>
        <h1
          className="text-lg font-bold tracking-tight"
          style={{ color: "var(--text-1)" }}
        >
          {label}
        </h1>
      </div>

      <div
        className="flex-1 min-h-0 overflow-hidden rounded-2xl"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr)",
        }}
      >
        <aside
          style={{
            background: "rgba(17, 24, 39, 0.92)",
            borderRight: "1px solid rgba(148, 163, 184, 0.14)",
            color: "#e5e7eb",
          }}
          className="h-full overflow-y-auto p-3"
        >
          {SETTINGS_NAV.map((group) => (
            <div key={group.title} className="mb-4">
              <div
                className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "#94a3b8" }}
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
                    className="w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-150"
                    style={{
                      background: active ? "rgba(249, 115, 22, 0.12)" : "transparent",
                      borderColor: active ? "rgba(249, 115, 22, 0.35)" : "transparent",
                      color: active ? "#f8fafc" : "#cbd5e1",
                    }}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        background: active ? "#f59e0b" : "transparent",
                        boxShadow: active ? "0 0 0 4px rgba(245, 158, 11, 0.18)" : "none",
                      }}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="h-full overflow-y-auto p-4 md:p-5">
          {PANEL_MAP[tab] ?? PANEL_MAP.school}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
