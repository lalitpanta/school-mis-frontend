import { useLayoutEffect, useState } from "react";

const DESKTOP_LAYOUT_MIN_WIDTH = 1024;

export default function useSettingsInlinePanelLayout(enabled, layoutRef) {
  const [panelStyle, setPanelStyle] = useState(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setPanelStyle(null);
      return undefined;
    }

    const layout = layoutRef.current;
    if (!layout) return undefined;

    const updatePanelPosition = () => {
      if (window.innerWidth < DESKTOP_LAYOUT_MIN_WIDTH) {
        setPanelStyle(null);
        return;
      }

      const header = layout.querySelector("thead");
      if (!header) {
        setPanelStyle(null);
        return;
      }

      const layoutBounds = layout.getBoundingClientRect();
      const headerBounds = header.getBoundingClientRect();
      const panelTop = headerBounds.top - layoutBounds.top;
      const panelBottom = Math.min(layoutBounds.bottom, window.innerHeight - 16);
      const nextStyle = {
        position: "absolute",
        top: `${panelTop}px`,
        right: "16px",
        width: "min(560px, calc(100% - 300px))",
        height: `${Math.max(320, panelBottom - headerBounds.top)}px`,
        zIndex: 20,
      };

      setPanelStyle((current) =>
        Object.keys(nextStyle).every((key) => current?.[key] === nextStyle[key])
          ? current
          : nextStyle,
      );
    };

    updatePanelPosition();
    const resizeObserver = new ResizeObserver(updatePanelPosition);
    resizeObserver.observe(layout);
    layout.querySelectorAll("thead").forEach((header) => {
      resizeObserver.observe(header);
    });
    const mutationObserver = new MutationObserver(updatePanelPosition);
    mutationObserver.observe(layout, { childList: true, subtree: true });
    window.addEventListener("resize", updatePanelPosition);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", updatePanelPosition);
    };
  }, [enabled, layoutRef]);

  return panelStyle;
}
