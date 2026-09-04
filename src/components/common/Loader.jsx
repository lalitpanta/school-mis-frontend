import clsx from "clsx";

const sizes = {
  sm: "w-6 h-6 border-2",
  md: "w-10 h-10 border-2",
  lg: "w-16 h-16 border-4",
};

/**
 * Spinner loader — inline or full-page
 */
const Loader = ({ size = "md", fullPage = false, text = "" }) => {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={clsx(
          "rounded-full border-indigo-500 border-t-transparent animate-spin",
          sizes[size],
        )}
      />
      {text && <p className="text-sm text-slate-400 animate-pulse">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "var(--overlay)" }}
      >
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
};

export default Loader;
