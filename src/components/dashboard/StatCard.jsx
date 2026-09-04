import clsx from "clsx";

const colorMap = {
  indigo: "bg-indigo-600/15 text-indigo-400 border-indigo-600/25",
  green: "bg-emerald-600/15 text-emerald-400 border-emerald-600/25",
  amber: "bg-amber-500/15  text-amber-400  border-amber-500/25",
  red: "bg-red-600/15    text-red-400    border-red-600/25",
  sky: "bg-sky-600/15    text-sky-400    border-sky-600/25",
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
        <p className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wider truncate">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--text-1)]">
          {value ?? "—"}
        </p>
        {change && (
          <p
            className={clsx(
              "mt-1 text-sm font-medium",
              positive ? "text-emerald-500" : "text-[var(--text-3)]",
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
