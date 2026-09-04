import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import SuperAdminLayout from "../components/layout/SuperAdminLayout";
import LoginPage from "../pages/LoginPage";
import SystemLoginPage from "../pages/SystemLoginPage";
import TenantStaffLoginPage from "../pages/TenantStaffLoginPage";
import AdminDashboard from "../pages/AdminDashboard";
import SuperAdminDashboardPage from "../pages/superadmin/Dashboard";
import SuperAdminTenantsPage from "../pages/superadmin/Tenants";
import SuperAdminSettingsPage from "../pages/superadmin/Settings";
import SuperAdminStoragePage from "../pages/superadmin/Storage";
import SuperAdminBillingPage from "../pages/superadmin/Billing";
import SuperAdminAuditLogsPage from "../pages/superadmin/AuditLogs";
import SuperAdminPackagesPage from "../pages/superadmin/Packages";
import DashboardPage from "../pages/DashboardPage";
import CalendarPage from "../pages/CalendarPage";
import AttendancePage from "../pages/AttendancePage";
import SettingsPage from "../pages/SettingsPage";
import TeacherPage from "../pages/TeacherPage";
import StudentPage from "../pages/StudentPage";
import EmployeePage from "../pages/EmployeePage";
import ResultManagement from "../pages/ResultManagement";
import DailyReportPage from "../pages/DailyReportPage";
import ResultPortalPage from "../pages/ResultPortalPage";
import ResultPortalModulePage from "../pages/ResultPortalModulePage";
import FeeManagementPage from "../pages/FeeManagementPage";
import LeaveManagementPage from "../pages/LeaveManagementPage";
import { ROUTES, MODULE_ROUTE_MAP } from "../utils/constants";

/**
 * Protected Route Component - requires admin access
 */
const AdminRoute = ({ element }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg-main)",
          minHeight: "100vh",
          color: "var(--text-1)",
        }}
        className="flex items-center justify-center"
      >
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated && isAdmin() ? (
    element
  ) : (
    <Navigate to="/system/login" replace />
  );
};

/**
 * Protected Route Component - requires super admin access only
 */
const SuperAdminRoute = ({ element }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg-main)",
          minHeight: "100vh",
          color: "var(--text-1)",
        }}
        className="flex items-center justify-center"
      >
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated && user?.type === "super_admin" ? (
    element
  ) : (
    <Navigate to="/system/login" replace />
  );
};

/**
 * Protected Route Component - requires tenant access
 */
const TenantRoute = ({ element }) => {
  const { isAuthenticated, isTenant, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg-main)",
          minHeight: "100vh",
          color: "var(--text-1)",
        }}
        className="flex items-center justify-center"
      >
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated && isTenant() ? (
    element
  ) : (
    <Navigate to="/login" replace />
  );
};

/**
 * Protected Route Component - requires authentication
 */
const ProtectedRoute = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg-main)",
          minHeight: "100vh",
          color: "var(--text-1)",
        }}
        className="flex items-center justify-center"
      >
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

/**
 * Module Route Component - requires tenant or staff access with module permission
 */
const ModuleRoute = ({ element, moduleKey }) => {
  const { isAuthenticated, isTenant, isStaff, hasModule, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{ background: "#070b14", minHeight: "100vh" }}
        className="flex items-center justify-center text-white"
      >
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Allow both tenant and staff users
  if (!isAuthenticated || (!isTenant() && !isStaff())) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has access to this module
  if (!hasModule(moduleKey)) {
    // Redirect to first available module
    return <Navigate to="/" replace />;
  }

  return element;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, isTenant, isStaff, hasModule, loading } =
    useAuth();

  const getFirstModuleRoute = () => {
    const moduleOrder = ["dashboard", "calendar", "attendance", "settings"];
    const firstAllowed = moduleOrder.find((key) => hasModule(key));
    return MODULE_ROUTE_MAP[firstAllowed] || "/login";
  };

  return (
    <Routes>
      {/* Login pages */}
      <Route path="/system/login" element={<SystemLoginPage />} />
      <Route path="/login" element={<TenantStaffLoginPage />} />
      <Route path="/result-portal" element={<ResultPortalPage />} />
      <Route
        path={ROUTES.RESULT_PORTAL}
        element={
          <ModuleRoute
            moduleKey="result_portal"
            element={
              <MainLayout>
                <ResultPortalModulePage />
              </MainLayout>
            }
          />
        }
      />

      {/* SuperAdmin Routes */}
      <Route
        path="/superadmin/dashboard"
        element={
          <SuperAdminRoute
            element={
              <SuperAdminLayout>
                <SuperAdminDashboardPage />
              </SuperAdminLayout>
            }
          />
        }
      />
      <Route
        path="/superadmin/tenants"
        element={
          <SuperAdminRoute
            element={
              <SuperAdminLayout>
                <SuperAdminTenantsPage />
              </SuperAdminLayout>
            }
          />
        }
      />
      <Route
        path="/superadmin/settings"
        element={
          <SuperAdminRoute
            element={
              <SuperAdminLayout>
                <SuperAdminSettingsPage />
              </SuperAdminLayout>
            }
          />
        }
      />
      <Route
        path="/superadmin/storage"
        element={
          <SuperAdminRoute
            element={
              <SuperAdminLayout>
                <SuperAdminStoragePage />
              </SuperAdminLayout>
            }
          />
        }
      />
      <Route
        path="/superadmin/billing"
        element={
          <SuperAdminRoute
            element={
              <SuperAdminLayout>
                <SuperAdminBillingPage />
              </SuperAdminLayout>
            }
          />
        }
      />
      <Route
        path="/superadmin/audit-logs"
        element={
          <SuperAdminRoute
            element={
              <SuperAdminLayout>
                <SuperAdminAuditLogsPage />
              </SuperAdminLayout>
            }
          />
        }
      />
      <Route
        path="/superadmin/packages"
        element={
          <SuperAdminRoute
            element={
              <SuperAdminLayout>
                <SuperAdminPackagesPage />
              </SuperAdminLayout>
            }
          />
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute
            element={
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path="/admin/tenants"
        element={
          <AdminRoute
            element={
              <MainLayout>
                <SuperAdminTenantsPage />
              </MainLayout>
            }
          />
        }
      />

      {/* Tenant Routes */}
      <Route
        path="/tenant/dashboard"
        element={<Navigate to={getFirstModuleRoute()} replace />}
      />

      {/* Main App Routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ModuleRoute
            moduleKey="dashboard"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.CALENDAR}
        element={
          <ModuleRoute
            moduleKey="calendar"
            element={
              <MainLayout>
                <CalendarPage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.ATTENDANCE}
        element={
          <ModuleRoute
            moduleKey="attendance"
            element={
              <MainLayout>
                <AttendancePage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.TEACHER}
        element={
          <ModuleRoute
            moduleKey="teacher"
            element={
              <MainLayout>
                <TeacherPage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.STUDENT}
        element={
          <ModuleRoute
            moduleKey="student"
            element={
              <MainLayout>
                <StudentPage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.EMPLOYEE}
        element={
          <ModuleRoute
            moduleKey="employee"
            element={
              <MainLayout>
                <EmployeePage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.RESULTS}
        element={
          <ModuleRoute
            moduleKey="results"
            element={
              <MainLayout>
                <ResultManagement />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.DAILY_REPORTS}
        element={
          <ModuleRoute
            moduleKey="daily_reports"
            element={
              <MainLayout>
                <DailyReportPage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.SETTINGS}
        element={
          <ModuleRoute
            moduleKey="settings"
            element={
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.FEES}
        element={
          <ModuleRoute
            moduleKey="fee_management"
            element={
              <MainLayout>
                <FeeManagementPage />
              </MainLayout>
            }
          />
        }
      />
      <Route
        path={ROUTES.LEAVE_MANAGEMENT}
        element={
          <ModuleRoute
            moduleKey="leave_management"
            element={
              <MainLayout>
                <LeaveManagementPage />
              </MainLayout>
            }
          />
        }
      />

      {/* Catch-all: Route based on user type */}
      <Route
        path="/"
        element={
          loading ? (
            <div
              style={{ background: "#070b14", minHeight: "100vh" }}
              className="flex items-center justify-center text-white"
            >
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : isAuthenticated ? (
            isAdmin() ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to={getFirstModuleRoute()} replace />
            )
          ) : (
            <Navigate to="/system/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/system/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
