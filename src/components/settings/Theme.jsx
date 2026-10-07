import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const THEME_LABELS = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const THEME_ICONS = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const Theme = () => {
  const { theme, isDark } = useTheme();
  const Icon = THEME_ICONS[theme];

  return (
    <section className="rounded-2xl border border-default bg-surface p-6">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-accent" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-primary">
            Theme &amp; Appearance
          </h2>
          <p className="mt-1 text-sm text-muted">
            Theme selection is available from the user menu in the top bar.
          </p>
        </div>
      </div>
      <p className="mt-5 text-sm text-primary">
        Current preference: <strong>{THEME_LABELS[theme]}</strong>
        {theme === "system" &&
          ` (${isDark ? "Dark" : "Light"} appearance from your device)`}
      </p>
    </section>
  );
};

export default Theme;
