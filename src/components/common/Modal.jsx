import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const Modal = ({ isOpen, onClose, title, children, size = "md", footer }) => {
  const ref = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    const fn = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (isOpen) document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      onClick={(e) => {
        if (e.target === ref.current) onClose?.();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{
        background: "rgba(2, 6, 23, 0.74)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className={`app-modal-surface relative w-full ${sizeMap[size]} flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-[#0f172a] shadow-[0_28px_90px_rgba(0,0,0,0.6)]`}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-700/70 px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-100">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-200"
              aria-label="Close modal"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div
          ref={bodyRef}
          className="app-modal-body flex-1 overflow-y-auto px-6 py-5 text-slate-100"
        >
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-700/70 bg-slate-950/40 px-6 py-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
