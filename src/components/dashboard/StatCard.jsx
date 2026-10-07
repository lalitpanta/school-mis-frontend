import clsx from "clsx";

const colorMap = {
  indigo: "bg-accent-soft text-accent border-accent",
  green: "bg-success text-success border-success",
  amber: "bg-warning-soft  text-warning  border-warning",
  red: "bg-danger-soft    text-danger    border-danger",
  sky: "bg-accent-soft    text-accent    border-accent",
};

/**
 * @param {object} props
 * @param {string}  props.title
 * @param {string|number} props.value
 * @param {React.ComponentType} props.icon
 * @param {'indigo'|'green'|'amber'|'red'|'sky'} props.color
 * @param {string}  [props.change]    - e.g. "+5% from last month"
 * @param {boolean} [props.positive]  - green text for change
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "indigo",
  change,
  positive,
}) => {
  return (
    <div className="mis-card p-5 flex items-start gap-4 hover:border-[var(--accent)] transition-colors">
      <div
        className={clsx("p-3 rounded-xl border flex-shrink-0", colorMap[color])}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
          {value ?? "—"}
        </p>
        {change && (
          <p
            className={clsx(
              "mt-1 text-sm font-medium",
              positive ? "text-success" : "text-[var(--text-muted)]",
            )}
          >
            {change}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
