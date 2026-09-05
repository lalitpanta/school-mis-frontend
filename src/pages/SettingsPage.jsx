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

// Map tab keys to rendered panels
const PANEL_MAP = {
  school:           <SchoolProfile />,
  calendarSettings: <CalendarSettings />,
  users:            <UsersStaff />,
  roles:            <RolesPermissions />,
  notices:          <NoticesSms />,
  integrations:     <Integrations />,
  devices:          <DeviceIntegration />,
  security:         <Security />,
  departments:      <Departments />,
  classrooms:       <Classrooms />,
  courses:          <Courses />,
  rooms:            <Rooms />,
  students:         <Students />,
  resultFormat:     <ResultManagementModule moduleType="format" />,
  resultSubject:    <ResultManagementModule moduleType="subject" />,
  theme:            <Theme />,
  profile:          <UserProfile />,
};

// Human-readable labels for the active tab header
const TAB_LABELS = {
  school:           "School Profile",
  calendarSettings: "Calendar Settings",
  users:            "Users & Staff",
  roles:            "Roles & Permissions",
  notices:          "Notices & SMS",
  integrations:     "Integrations",
  devices:          "Device Integration",
  security:         "Security",
  departments:      "Departments",
  classrooms:       "Classrooms",
  courses:          "Courses",
  rooms:            "Rooms",
  students:         "Students",
  resultFormat:     "Exam Setup",
  resultSubject:    "Course & Marks",
  theme:            "Theme",
  profile:          "My Profile",
};

const SettingsPage = () => {
  const [params] = useSearchParams();
  const tab = params.get("tab") || "school";
  const label = TAB_LABELS[tab] ?? "Settings";

  return (
    <div className="h-full flex flex-col">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
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
      </div>

      {/* ── Content card ── */}
      <div
        className="flex-1 min-h-0 rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          className="h-full overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 9.5rem)" }}
        >
          {PANEL_MAP[tab] ?? PANEL_MAP.school}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
