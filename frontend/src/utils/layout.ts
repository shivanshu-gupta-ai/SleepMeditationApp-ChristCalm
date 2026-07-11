import { Dimensions, PixelRatio, Platform, type ScaledSize } from "react-native";

/** Design baseline — iPhone 14 / 15 logical width */
export const PHONE_BASE_WIDTH = 390;

/** Cap for mobile shell on web / large screens (iPhone 14 Pro Max class) */
export const PHONE_MAX_WIDTH = 430;

/** Comfortable min for SE-class devices */
export const PHONE_MIN_WIDTH = 320;

const BASE_WIDTH = PHONE_BASE_WIDTH;

export function getWindow(): ScaledSize {
  return Dimensions.get("window");
}

/** Effective layout width — never wider than a large phone when building UI */
export function layoutWidth(windowWidth?: number): number {
  const w = windowWidth ?? getWindow().width;
  // Always design for phone: clamp between SE and Pro Max logical widths
  return Math.min(Math.max(w, PHONE_MIN_WIDTH), PHONE_MAX_WIDTH);
}

/** Scale size relative to iPhone 14 width; clamped for SE ↔ Pro Max */
export function scale(size: number, width?: number): number {
  const w = layoutWidth(width);
  const ratio = Math.min(Math.max(w / BASE_WIDTH, 0.88), 1.12);
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
}

export function isTablet(width?: number): boolean {
  // We force phone layout everywhere for ChristCalm web preview;
  // only treat as tablet if native width is huge AND not web shell.
  const w = width ?? getWindow().width;
  return Platform.OS !== "web" && w >= 768;
}

/** Content max width — phone frame only (all platforms for consistency) */
export function contentMaxWidth(width?: number): number {
  return layoutWidth(width);
}

/** Horizontal page padding tuned for iPhone SE → Pro Max */
export function pagePadding(width?: number): number {
  const w = layoutWidth(width);
  if (w <= 360) return 16; // SE
  if (w <= 400) return 20; // standard
  return 22; // Pro Max class
}

export function isWeb(): boolean {
  return Platform.OS === "web";
}
