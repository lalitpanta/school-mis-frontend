import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const SettingsModal = ({
  open,
  onClose,
  title,
  subtitle,
  width = "max-w-lg",
  sidePanel = false,
  inlinePanel = false,
  inlinePanelStyle,
  inlinePanelClassName = "",
  inlinePanelSurfaceClassName,
  inlinePanelSurfaceStyle,
  inlinePanelHeaderClassName = "",
  inlinePanelBodyClassName = "",
  closeOnOverlayClick = true,
  children,
  footer,
}) => {
  const overlayRef = useRef(null);
  const bodyRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open && !inlinePanel && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    if (open && !inlinePanel) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (!inlinePanel) document.body.style.overflow = "";
    };
  }, [open, inlinePanel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(event) => {
        if (closeOnOverlayClick && event.target === overlayRef.current) {
          onClose?.();
        }
      }}
      className={
        inlinePanel
          ? `h-full min-h-0 min-w-0 ${inlinePanelClassName}`
          : `fixed inset-0 z-50 flex overflow-y-auto ${sidePanel ? "justify-end p-0 max-lg:justify-center max-lg:p-0" : "items-center justify-center p-4"}`
      }
      style={{
        background: sidePanel || inlinePanel ? "transparent" : "var(--overlay)",
        backdropFilter: sidePanel || inlinePanel ? "none" : "blur(10px)",
        ...(inlinePanel ? inlinePanelStyle : {}),
      }}
    >
      <div
        className={`app-modal-surface relative ${inlinePanel ? `flex h-full min-h-0 w-full min-w-0 flex-col ${inlinePanelSurfaceClassName || "rounded-xl border border-default bg-surface shadow-xl"}` : sidePanel ? "flex h-dvh max-h-dvh w-[48vw] max-w-none flex-col rounded-none rounded-l-2xl border-y-0 border-r-0 max-lg:w-full max-lg:rounded-none overflow-hidden border border-default bg-surface shadow-xl" : `w-full ${width} max-h-[calc(100vh-2rem)] rounded-2xl overflow-hidden border border-default bg-surface shadow-xl`}`}
        style={inlinePanel ? inlinePanelSurfaceStyle : undefined}
      >
        <div className={`flex items-start justify-between gap-4 border-b border-default bg-subtle px-6 py-4 ${inlinePanel ? inlinePanelHeaderClassName : ""}`}>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-primary">{title}</h2>
            {subtitle && (
              <p className="mt-1 break-words text-sm leading-relaxed text-muted">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-surface text-muted transition hover:border-accent hover:bg-subtle hover:text-primary"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div
          ref={bodyRef}
          className={`app-modal-body overflow-y-auto px-6 py-5 ${sidePanel || inlinePanel ? "min-h-0 flex-1 max-h-none" : "max-h-[calc(100vh-10rem)]"} ${inlinePanel ? inlinePanelBodyClassName : ""}`}
        >
          {children}
        </div>

        {footer ? (
          <div className="border-t border-default bg-subtle px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SettingsModal;
