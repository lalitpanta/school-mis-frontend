import { useLayoutEffect, useState } from "react";

const INLINE_LAYOUT_MIN_WIDTH = 768;
const INLINE_PANEL_GAP = 16;

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

      const lists = Array.from(layout.querySelectorAll(".entity-admin-list"));
      const activeList = lists.find(
        (element) => element.getClientRects().length > 0,
      );
      if (!activeList) {
        setPanelStyle(null);
        return;
      }

      const layoutBounds = layout.getBoundingClientRect();
      const listBounds = activeList.getBoundingClientRect();
      const panelTop = listBounds.top - layoutBounds.top;
      const panelLeft = listBounds.right - layoutBounds.left + INLINE_PANEL_GAP;
      const panelWidth = Math.max(
        0,
        layoutBounds.right - (listBounds.right + INLINE_PANEL_GAP),
      );
      const nextStyle = {
        position: "absolute",
        top: `${panelTop}px`,
        left: `${panelLeft}px`,
        right: "auto",
        width: `${panelWidth}px`,
        height: `${listBounds.height}px`,
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
