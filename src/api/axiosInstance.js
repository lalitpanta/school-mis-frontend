import axios from "axios";
import config from "../config/config";

const axiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.TIMEOUT,
});

// Helper to decode JWT token
function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Request interceptor — attach auth token and tenant ID
axiosInstance.interceptors.request.use(
  (reqConfig) => {
    reqConfig.headers = reqConfig.headers || {};
    const token = localStorage.getItem(config.TOKEN_KEY);

    if (token) {
      reqConfig.headers["Authorization"] = `Bearer ${token}`;
    }

    if (reqConfig.skipTenantHeader) {
      delete reqConfig.skipTenantHeader;
      return reqConfig;
    }

    if (token) {
      // Determine tenant ID to act on. Priority:
      // 1. admin/console-selected tenant stored in localStorage ('selectedTenantId')
      // 2. tenantId present in token (for staff)
      const decoded = decodeToken(token);
      const selectedTenant = localStorage.getItem("selectedTenantId");
      let tenantIdToSend = null;
      if (selectedTenant) {
        tenantIdToSend = selectedTenant;
      } else if (decoded && decoded.tenantId) {
        tenantIdToSend = decoded.tenantId;
      }
      if (tenantIdToSend) {
        reqConfig.headers["X-Tenant-ID"] = tenantIdToSend;
      }
    }
    return reqConfig;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Don't automatically clear token or redirect
      // Let components handle 401 errors appropriately
      // Only redirect if user is NOT already being redirected
      const currentPath = window.location.pathname;
      const isLoginPath = ["/login", "/system/login", "/"].includes(
        currentPath,
      );
      if (!isLoginPath) {
        // Only redirect for actual auth failures, not for API endpoint failures
        // Check if error is from login endpoint specifically
        if (error.config?.url?.includes("auth")) {
          const redirectPath = currentPath.startsWith("/system")
            ? "/system/login"
            : "/login";
          window.location.href = redirectPath;
        }
      }
    }

    if (status === 403) {
      console.error("Access denied.");
    }

    if (status >= 500) {
      console.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
