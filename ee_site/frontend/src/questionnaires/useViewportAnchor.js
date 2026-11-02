import { useLayoutEffect, useRef } from "react";

// Only the interaction that changes local geometry owns this correction. Never
// restore a saved document offset when a product/editor mounts or a sheet opens.
export function useViewportAnchor() {
  const pending = useRef(null);
  useLayoutEffect(() => {
    const anchor = pending.current;
    pending.current = null;
    if (!anchor?.element.isConnected) return;
    const delta = anchor.element.getBoundingClientRect().top - anchor.top;
    if (Math.abs(delta) > 1) {
      window.scrollTo({ top: window.scrollY + delta, behavior: "instant" });
    }
  });
  return (element) => {
    if (element && window.matchMedia("(max-width: 960px)").matches) {
      pending.current = { element, top: element.getBoundingClientRect().top };
    }
  };
}
