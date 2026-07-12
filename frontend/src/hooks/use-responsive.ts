import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  scale,
  sizeClass,
  isCompactWidth,
  isTabletWidth,
  isLandscape as calcLandscape,
  tabBarClearance,
  tabBarMaxWidth,
  titleMetrics,
  gridColumns,
  type SizeClass,
} from "@/src/utils/layout";
import { useViewport } from "@/src/context/ViewportContext";

/**
 * Adaptive layout metrics for iPhone SE → Pro Max and all iPad sizes.
 * `width` is the content-column width (use for grids/cards).
 * `windowWidth` is the full device width.
 */
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
      /** Content column width (grids, card math) */
      width,
      /** Full device / shell width */
      windowWidth: ww,
      height,
      isTablet: tablet,
      isLandscape: calcLandscape(ww, height),
      isCompact: compact,
      sizeClass: cls,
      contentMaxWidth,
      pagePadding,
      isWebShell,
      safeTop: insets.top,
      safeBottom: insets.bottom,
      /** ScrollView / composer paddingBottom under floating nav */
      bottomClearance,
      /** Centered tab bar max width on tablet */
      tabBarMaxWidth: tabBarMaxWidth(ww),
      titleSize: titles.size,
      titleLineHeight: titles.lineHeight,
      /** Emotion / card grid columns */
      columns: (opts?: { phone?: number; tablet?: number; tabletWide?: number }) =>
        gridColumns(ww, opts),
      scale: (n: number) => scale(n, ww),
    };
  }, [viewport, insets.top, insets.bottom]);
}
