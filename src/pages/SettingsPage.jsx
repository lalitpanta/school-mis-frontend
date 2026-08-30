import { useSearchParams } from "react-router-dom";
import SchoolProfile from "../components/settings/SchoolProfile";
import AcademicCalendar from "../components/settings/AcademicCalendar";
import CalendarSettings from "../components/settings/CalendarSettings";
import UsersStaff from "../components/settings/UsersStaff";
import RolesPermissions from "../components/settings/RolesPermissions";
import FeesNotifications from "../components/settings/FeesNotifications";
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

const panelMap = {
  school: <SchoolProfile />,
  academic: <AcademicCalendar />,
  calendarSettings: <CalendarSettings />,
  users: <UsersStaff />,
  roles: <RolesPermissions />,
  fees: <FeesNotifications />,
  notices: <NoticesSms />,
  integrations: <Integrations />,
  devices: <DeviceIntegration />,
  security: <Security />,
  departments: <Departments />,
  classrooms: <Classrooms />,
  courses: <Courses />,
  rooms: <Rooms />,
  students: <Students />,
  resultFormat: <ResultManagementModule moduleType="format" />,
  resultSubject: <ResultManagementModule moduleType="subject" />,
  theme: <Theme />,
  profile: <UserProfile />,
};

const SettingsPage = () => {
  const [params] = useSearchParams();
  const tab = params.get("tab") || "school";

  return (
    <div className="w-full px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-700/70 bg-[#0f172a] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-4 md:p-6">
          {panelMap[tab] ?? panelMap.school}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
