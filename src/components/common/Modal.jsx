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
        background: "var(--overlay)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className={`app-modal-surface relative w-full ${sizeMap[size]} flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-default shadow-xl`}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-default px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-primary">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-default bg-surface text-muted transition hover:border-warning hover:bg-warning-soft hover:text-warning"
              aria-label="Close modal"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div
          ref={bodyRef}
          className="app-modal-body flex-1 overflow-y-auto px-6 py-5"
        >
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-default bg-surface px-6 py-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
