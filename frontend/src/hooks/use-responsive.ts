import { useMemo } from "react";
import { scale } from "@/src/utils/layout";
import { useViewport } from "@/src/context/ViewportContext";

/**
 * Layout metrics for the active phone viewport (shell-aware on web).
 */
export function useResponsive() {
  const viewport = useViewport();

  return useMemo(() => {
    const { width, height, pagePadding, contentMaxWidth, isWebShell } = viewport;
    return {
      width,
      height,
      isTablet: false, // app is always phone layout
      isLandscape: width > height,
      contentMaxWidth,
      pagePadding,
      isWebShell,
      scale: (n: number) => scale(n, width),
    };
  }, [viewport]);
}
