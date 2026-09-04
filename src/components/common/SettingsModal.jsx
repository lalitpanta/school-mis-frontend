import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const SettingsModal = ({
  open,
  onClose,
  title,
  subtitle,
  width = "max-w-lg",
  children,
  footer,
}) => {
  const overlayRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(event) => {
        if (event.target === overlayRef.current) {
          onClose?.();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{
        background: "var(--overlay)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className={`app-modal-surface relative w-full ${width} max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-slate-700/70 shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-700/70 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-200"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div
          ref={bodyRef}
          className="app-modal-body max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-5"
        >
          {children}
        </div>

        {footer ? (
          <div className="border-t border-slate-700/70 bg-slate-950/40 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SettingsModal;
