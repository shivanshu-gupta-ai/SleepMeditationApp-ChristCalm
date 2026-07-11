import { Dimensions, PixelRatio, Platform, type ScaledSize } from "react-native";

/** Design baseline — iPhone 14 / 15 logical width */
export const PHONE_BASE_WIDTH = 390;

/**
 * Cap for mobile shell on web / large screens.
 * Covers iPhone 14/15/16 Pro Max (~430) and slightly wider previews.
 */
export const PHONE_MAX_WIDTH = 430;

/** Smallest modern iPhone class we design for (SE 3rd gen = 375; older SE = 320) */
export const PHONE_MIN_WIDTH = 320;

const BASE_WIDTH = PHONE_BASE_WIDTH;

export type PhoneSizeClass = "compact" | "regular" | "large";

export function getWindow(): ScaledSize {
  return Dimensions.get("window");
}

/**
 * Effective layout width for UI math.
 * - Never wider than Pro Max class (web shell / tablets)
 * - Never invent a width larger than the real window (prevents SE overflow)
 */
export function layoutWidth(windowWidth?: number): number {
  const w = windowWidth ?? getWindow().width;
  if (!Number.isFinite(w) || w <= 0) return PHONE_BASE_WIDTH;
  return Math.min(w, PHONE_MAX_WIDTH);
}

/** SE / mini / short width */
export function isCompactWidth(width?: number): boolean {
  return layoutWidth(width) <= 375;
}

export function phoneSizeClass(width?: number): PhoneSizeClass {
  const w = layoutWidth(width);
  if (w <= 375) return "compact"; // SE, 13 mini, etc.
  if (w <= 402) return "regular"; // 14/15/16 standard
  return "large"; // Plus / Pro Max
}

/** Scale size relative to iPhone 14 width; wider range for SE ↔ Pro Max */
export function scale(size: number, width?: number): number {
  const w = layoutWidth(width);
  const ratio = Math.min(Math.max(w / BASE_WIDTH, 0.82), 1.12);
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
}

export function isTablet(width?: number): boolean {
  const w = width ?? getWindow().width;
  return Platform.OS !== "web" && w >= 768;
}

export function contentMaxWidth(width?: number): number {
  return layoutWidth(width);
}

/** Horizontal page padding — Nest-spacious, still SE-safe */
export function pagePadding(width?: number): number {
  const w = layoutWidth(width);
  if (w <= 340) return 16;
  if (w <= 375) return 18; // SE class
  if (w <= 402) return 22; // standard
  return 24; // Pro Max class — Nest-like side air
}

/**
 * Scroll/content clearance above floating tab bar + FAB + home indicator.
 * Used for ScrollView paddingBottom AND sticky composers (e.g. Wisdom input).
 * Pass safe-area bottom inset for accuracy.
 *
 * Must stay ≥ pill height (~62) + bottom pad + gap so inputs never sit under the nav.
 */
export function tabBarClearance(bottomInset = 0, width?: number): number {
  const compact = isCompactWidth(width);
  // Matches FloatingTabBar pillMinH + paddingVertical + FAB row
  const bar = compact ? 62 : 68;
  const fabLift = compact ? 4 : 6;
  // Visual air between content/composer and top of floating pill
  const gap = compact ? 14 : 16;
  const inset = Math.max(bottomInset, Platform.OS === "web" ? 10 : 0);
  return bar + inset + fabLift + gap + (compact ? 8 : 10);
}

export function isWeb(): boolean {
  return Platform.OS === "web";
}

/** Title / type scale by device class — larger display for Sora personality */
export function titleMetrics(width?: number): { size: number; lineHeight: number } {
  const cls = phoneSizeClass(width);
  if (cls === "compact") return { size: 28, lineHeight: 34 };
  if (cls === "large") return { size: 34, lineHeight: 40 };
  return { size: 32, lineHeight: 38 };
}
