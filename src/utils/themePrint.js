const PRINT_THEME_TOKENS = [
  "--bg-page",
  "--bg-surface",
  "--bg-subtle",
  "--border-default",
  "--text-primary",
  "--text-muted",
  "--accent",
  "--accent-soft",
  "--on-accent",
  "--success-bg",
  "--success-text",
  "--danger-bg",
  "--danger",
  "--warning-bg",
  "--shadow-card",
  "--shadow-overlay",
];

export const getPrintThemeStyles = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  const variables = PRINT_THEME_TOKENS.map(
    (token) => `${token}:${rootStyles.getPropertyValue(token).trim()}`,
  ).join(";");

  return `<style>:root{${variables}}</style>`;
};
