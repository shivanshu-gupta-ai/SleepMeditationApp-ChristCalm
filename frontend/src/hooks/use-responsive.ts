import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  scale,
  phoneSizeClass,
  isCompactWidth,
  tabBarClearance,
  titleMetrics,
} from "@/src/utils/layout";
import { useViewport } from "@/src/context/ViewportContext";

/**
 * Layout metrics for the active phone viewport (shell-aware on web).
 * Tuned for iPhone SE → Pro Max.
 */
export function useResponsive() {
  const viewport = useViewport();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const { width, height, pagePadding, contentMaxWidth, isWebShell } = viewport;
    const sizeClass = phoneSizeClass(width);
    const compact = isCompactWidth(width);
    const bottomClearance = tabBarClearance(insets.bottom, width);
    const titles = titleMetrics(width);

    return {
      width,
      height,
      isTablet: false,
      isLandscape: width > height,
      isCompact: compact,
      sizeClass,
      contentMaxWidth,
      pagePadding,
      isWebShell,
      safeTop: insets.top,
      safeBottom: insets.bottom,
      /** Use as ScrollView paddingBottom so content clears floating nav */
      bottomClearance,
      titleSize: titles.size,
      titleLineHeight: titles.lineHeight,
      scale: (n: number) => scale(n, width),
    };
  }, [viewport, insets.top, insets.bottom]);
}
