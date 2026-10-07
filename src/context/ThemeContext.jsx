import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = "theme";
const LEGACY_THEME_STORAGE_KEY = "mis_theme";
const THEMES = ["system", "light", "dark"];

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (THEMES.includes(savedTheme)) return savedTheme;

    const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (legacyTheme === "light" || legacyTheme === "dark") {
      localStorage.setItem(THEME_STORAGE_KEY, legacyTheme);
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
      return legacyTheme;
    }
  } catch (error) {
    console.warn("Unable to read the saved theme preference.", error);
  }
  return "system";
};

const getSystemIsDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [systemIsDark, setSystemIsDark] = useState(getSystemIsDark);
  const isDark = theme === "dark" || (theme === "system" && systemIsDark);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = isDark ? "dark" : "light";
    root.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event) => setSystemIsDark(event.matches);
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      setThemeState(THEMES.includes(event.newValue) ? event.newValue : "system");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    if (!THEMES.includes(nextTheme)) {
      throw new Error(`Unsupported theme: ${nextTheme}`);
    }
    try {
      if (nextTheme === "system") {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }
    } catch (error) {
      console.warn("Unable to save the theme preference.", error);
    }
    setThemeState(nextTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};

export default ThemeContext;
