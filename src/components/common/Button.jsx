import clsx from "clsx";

const variants = {
  primary: {
    background: "var(--accent)",
    color: "var(--accent-text)",
    border: "none",
  },
  danger: {
    background: "var(--danger)",
    color: "var(--accent-text)",
    border: "none",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-2)",
    border: "1px solid var(--border-dim)",
  },
  outline: {
    background: "transparent",
    color: "var(--accent)",
    border: "1px solid var(--accent)",
  },
  secondary: {
    background: "var(--bg-surface)",
    color: "var(--text-1)",
    border: "1px solid var(--border-dim)",
  },
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  icon: Icon,
  disabled,
  style: extraStyle,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={clsx(
      "inline-flex items-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90",
      sizes[size],
      className,
    )}
    style={{ ...variants[variant], ...extraStyle }}
    {...props}
  >
    {loading ? (
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    ) : Icon ? (
      <Icon size={16} />
    ) : null}
    {children}
  </button>
);

export default Button;
