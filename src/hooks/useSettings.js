import { useState, useEffect, useCallback } from "react";
import {
  getSchoolProfile,
  updateSchoolProfile,
  getThemeSettings,
  updateThemeSettings,
  getNotificationSettings,
  updateNotificationSettings,
} from "../api/settingsApi";

const useSettings = () => {
  const [school, setSchool] = useState(null);
  const [theme, setTheme] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schoolRes, themeRes, notifRes] = await Promise.allSettled([
        getSchoolProfile(),
        getThemeSettings(),
        getNotificationSettings(),
      ]);
      if (schoolRes.status === "fulfilled")
        setSchool(schoolRes.value.data?.data ?? schoolRes.value.data);
      if (themeRes.status === "fulfilled")
        setTheme(themeRes.value.data?.data ?? themeRes.value.data);
      if (notifRes.status === "fulfilled")
        setNotifications(notifRes.value.data?.data ?? notifRes.value.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const normalizeResponse = (response) =>
    response?.data?.data ?? response?.data ?? response;

  const saveSchool = async (data) => {
    const res = await updateSchoolProfile(data);
    const payload = normalizeResponse(res);
    setSchool(payload);
    return payload;
  };

  const saveTheme = async (data) => {
    const res = await updateThemeSettings(data);
    const payload = normalizeResponse(res);
    setTheme(payload);
    return payload;
  };

  const saveNotifications = async (data) => {
    const res = await updateNotificationSettings(data);
    const payload = normalizeResponse(res);
    setNotifications(payload);
    return payload;
  };

  return {
    school,
    theme,
    notifications,
    loading,
    error,
    refetch: fetchAll,
    saveSchool,
    saveTheme,
    saveNotifications,
  };
};

export default useSettings;
