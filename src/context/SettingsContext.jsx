import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axiosInstance from "../api/axiosInstance";
import config from "../config/config";
import toast from "react-hot-toast";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    calendar_type: "BS", // Default
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    // Only fetch if user is authenticated
    const token = localStorage.getItem(config.TOKEN_KEY);
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.get("/v1/settings");
      if (res.data?.data) {
        setSettings(res.data.data);
        setSettingsLoaded(true);
      } else {
        setSettings({});
        setSettingsLoaded(true);
      }
    } catch (err) {
      // Silently ignore auth errors and permission errors
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        console.error("Failed to fetch settings:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch settings when token becomes available (e.g., after login)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem(config.TOKEN_KEY);
      if (token) {
        // Add a small delay to ensure auth context is updated
        setTimeout(() => fetchSettings(), 100);
      }
    };

    // Check immediately
    const token = localStorage.getItem(config.TOKEN_KEY);
    if (token) {
      fetchSettings();
    }

    // Listen for storage changes (another tab/window login)
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchSettings]);

  const updateSetting = async (key, value) => {
    try {
      const res = await axiosInstance.patch("/v1/settings", { [key]: value });
      if (res.data?.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
        toast.success("Setting updated successfully");
        return true;
      }
    } catch (err) {
      console.error("Failed to update setting:", err);
      toast.error("Failed to update setting");
      return false;
    }
  };

  const updateMultipleSettings = async (settingsObj) => {
    try {
      const res = await axiosInstance.patch("/v1/settings", settingsObj);
      if (res.data?.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
        toast.success("Settings updated successfully");
        return true;
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
      toast.error("Failed to update settings");
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        settingsLoaded,
        loading,
        updateSetting,
        updateMultipleSettings,
        fetchSettings,
        calendarType: settings.calendar_type,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
};

export default SettingsContext;
