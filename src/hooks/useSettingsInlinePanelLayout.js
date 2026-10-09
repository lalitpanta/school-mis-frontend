import { useLayoutEffect, useState } from "react";

const INLINE_LAYOUT_MIN_WIDTH = 768;

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
      if (window.innerWidth < INLINE_LAYOUT_MIN_WIDTH) {
        setPanelStyle(null);
        return;
      }

      const header = Array.from(layout.querySelectorAll("thead")).find(
        (element) => element.getClientRects().length > 0,
      );
      if (!header) {
        setPanelStyle(null);
        return;
      }

      const layoutBounds = layout.getBoundingClientRect();
      const headerBounds = header.getBoundingClientRect();
      const panelTop = headerBounds.top - layoutBounds.top;
      const listBounds = header.closest(".entity-admin-list")
        ?.getBoundingClientRect();
      const panelBottom = Math.max(
        listBounds?.bottom ?? layoutBounds.bottom,
        window.innerHeight - 16,
      );
      const nextStyle = {
        position: "absolute",
        top: `${panelTop}px`,
        right: "0px",
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
    layout.querySelectorAll(".entity-admin-list").forEach((list) => {
      resizeObserver.observe(list);
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
