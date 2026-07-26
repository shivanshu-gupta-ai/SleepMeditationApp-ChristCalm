import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  scale,
  sizeClass,
  isCompactWidth,
  isTabletWidth,
  tabBarClearance,
  tabBarMaxWidth,
  titleMetrics,
  gridColumns,
  type SizeClass,
} from "@/src/utils/layout";
import { useViewport } from "@/src/context/ViewportContext";

/** Adaptive layout metrics (content width, padding, grids, tab clearance). */
export function useResponsive() {
  const viewport = useViewport();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const {
      width,
      height,
      windowWidth,
      pagePadding,
      contentMaxWidth,
      isWebShell,
      isTablet: vpTablet,
    } = viewport;

    const ww = windowWidth || width;
    const cls: SizeClass = sizeClass(ww);
    const compact = isCompactWidth(ww);
    const tablet = vpTablet || isTabletWidth(ww);
    const bottomClearance = tabBarClearance(insets.bottom, ww);
    const titles = titleMetrics(ww);

    return {
      width,
      windowWidth: ww,
      height,
      isTablet: tablet,
      isCompact: compact,
      sizeClass: cls,
      contentMaxWidth,
      pagePadding,
      isWebShell,
      safeTop: insets.top,
      safeBottom: insets.bottom,
      bottomClearance,
      tabBarMaxWidth: tabBarMaxWidth(ww),
      titleSize: titles.size,
      titleLineHeight: titles.lineHeight,
      columns: (opts?: { phone?: number; tablet?: number; tabletWide?: number }) =>
        gridColumns(ww, opts),
      scale: (n: number) => scale(n, ww),
    };
  }, [viewport, insets.top, insets.bottom]);
}
