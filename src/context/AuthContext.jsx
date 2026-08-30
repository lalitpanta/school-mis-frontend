import { createContext, useContext, useState, useEffect } from "react";
import config from "../config/config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin' or 'tenant'

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(config.TOKEN_KEY);
    const storedUser = localStorage.getItem("mis_user");
    const storedUserType = localStorage.getItem("mis_user_type");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setUserType(storedUserType);
    }
    setLoading(false);
  }, []);

  const persistAuth = (userData, authToken, type) => {
    setUser(userData);
    setToken(authToken);
    setUserType(type);
    localStorage.setItem(config.TOKEN_KEY, authToken);
    localStorage.setItem("mis_user", JSON.stringify(userData));
    localStorage.setItem("mis_user_type", type);

    if (type === "admin") {
      if (userData?.id) {
        localStorage.setItem("mis_admin_id", userData.id);
      }
      localStorage.removeItem("mis_tenant_id");
      localStorage.removeItem("mis_database_name");
      localStorage.removeItem("mis_staff_id");
      return;
    }

    if (userData?.id) {
      localStorage.setItem("mis_tenant_id", userData.id);
    }
    if (userData?.databaseName) {
      localStorage.setItem("mis_database_name", userData.databaseName);
    }
    if (userData?.staff_id || userData?.id) {
      localStorage.setItem("mis_staff_id", userData.staff_id || userData.id);
    }
  };

  const loginAdmin = (userData, authToken) => {
    persistAuth(userData, authToken, "admin");
  };

  const loginTenant = (userData, authToken) => {
    persistAuth(userData, authToken, "tenant");
  };

  const loginUser = (userData, authToken, userTypeValue = "tenant") => {
    persistAuth(userData, authToken, userTypeValue);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserType(null);
    localStorage.removeItem(config.TOKEN_KEY);
    localStorage.removeItem("mis_user");
    localStorage.removeItem("mis_user_type");
    localStorage.removeItem("mis_tenant_id");
    localStorage.removeItem("mis_database_name");
    localStorage.removeItem("mis_admin_id");
  };

  const isAdmin = () =>
    userType === "admin" ||
    userType === "super_admin" ||
    user?.type === "admin" ||
    user?.type === "super_admin";
  const isTenant = () => userType === "tenant" || user?.type === "tenant";
  const isStaff = () => userType === "staff" || user?.type === "staff";
  const isAuthenticated = !!user && !!token;
  const hasModule = (moduleKey) => {
    const modules = user?.modules || [];
    if (Array.isArray(modules) && modules.includes(moduleKey)) {
      return true;
    }

    const permissions = user?.permissions || [];
    return permissions.some(
      (permission) => String(permission).split(".")[0] === moduleKey,
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userType,
        loading,
        loginAdmin,
        loginTenant,
        loginUser,
        logout,
        isAdmin,
        isTenant,
        isStaff,
        isAuthenticated,
        hasModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export default AuthContext;
