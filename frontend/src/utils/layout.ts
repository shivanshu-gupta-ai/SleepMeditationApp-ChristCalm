import { Dimensions, PixelRatio, Platform, type ScaledSize } from "react-native";

/** Design baseline — iPhone 14 / 15 logical width */
export const PHONE_BASE_WIDTH = 390;

/**
 * Reference phone upper bound (Pro Max class).
 * Used for web "phone chrome" shell on very wide desktops only.
 */
export const PHONE_MAX_WIDTH = 430;

/** Tablet / large-layout breakpoints (logical points). */
export const TABLET_BREAKPOINT = 600;
export const TABLET_WIDE_BREAKPOINT = 900;

/** Readable content column caps — avoid ultra-wide text lines on iPad */
export const CONTENT_MAX_TABLET = 720;
export const CONTENT_MAX_TABLET_WIDE = 900;

/** Desktop web: wrap in phone chrome above this width */
export const DESKTOP_SHELL_BREAKPOINT = 1100;

const BASE_WIDTH = PHONE_BASE_WIDTH;

export type SizeClass = "compact" | "regular" | "large" | "tablet" | "tabletWide";

export function getWindow(): ScaledSize {
  return Dimensions.get("window");
}

/** Raw window width (never invented larger than the device). */
export function windowWidth(windowW?: number): number {
  const w = windowW ?? getWindow().width;
  if (!Number.isFinite(w) || w <= 0) return PHONE_BASE_WIDTH;
  return w;
}

export function isTabletWidth(width?: number): boolean {
  return windowWidth(width) >= TABLET_BREAKPOINT;
}

/** Device size class: SE → Pro Max → iPad. */
export function sizeClass(width?: number): SizeClass {
  const w = windowWidth(width);
  if (w >= TABLET_WIDE_BREAKPOINT) return "tabletWide";
  if (w >= TABLET_BREAKPOINT) return "tablet";
  if (w <= 375) return "compact";
  if (w <= 402) return "regular";
  return "large";
}

/**
 * Max width of the main content column.
 * Phones: full window. Tablets: capped + centered by Screen.
 */
export function contentMaxWidth(width?: number): number {
  const w = windowWidth(width);
  const cls = sizeClass(w);
  if (cls === "tabletWide") return Math.min(w, CONTENT_MAX_TABLET_WIDE);
  if (cls === "tablet") return Math.min(w, CONTENT_MAX_TABLET);
  return w;
}

/**
 * Width used for UI math (grids, card sizes) inside the content column.
 */
export function layoutWidth(windowW?: number): number {
  return contentMaxWidth(windowW);
}

/** SE / mini / short phone width (not tablets). */
export function isCompactWidth(width?: number): boolean {
  const w = windowWidth(width);
  return w < TABLET_BREAKPOINT && w <= 375;
}

/** Scale type/spacing relative to iPhone 14; gentle on tablets. */
export function scale(size: number, width?: number): number {
  const w = Math.min(layoutWidth(width), PHONE_BASE_WIDTH * 1.15);
  const ratio = Math.min(Math.max(w / BASE_WIDTH, 0.82), 1.15);
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
}

/**
 * Horizontal page padding — SE-safe, Nest-spacious on large phones, airy on iPad.
 */
export function pagePadding(width?: number): number {
  const cls = sizeClass(width);
  const w = windowWidth(width);
  if (cls === "compact") return w <= 340 ? 16 : 18;
  if (cls === "regular") return 22;
  if (cls === "large") return 24;
  if (cls === "tablet") return 28;
  return 32; // tabletWide
}

/**
 * Grid column count for emotion tiles, cards, etc.
 */
export function gridColumns(
  width?: number,
  opts?: { phone?: number; tablet?: number; tabletWide?: number }
): number {
  const cls = sizeClass(width);
  if (cls === "tabletWide") return opts?.tabletWide ?? 4;
  if (cls === "tablet") return opts?.tablet ?? 3;
  return opts?.phone ?? 2;
}

/**
 * Scroll/content clearance above floating tab bar + FAB + home indicator.
 */
export function tabBarClearance(bottomInset = 0, width?: number): number {
  const compact = isCompactWidth(width);
  const tablet = isTabletWidth(width);
  const bar = compact ? 62 : tablet ? 72 : 68;
  const fabLift = compact ? 4 : 6;
  const gap = compact ? 14 : tablet ? 18 : 16;
  const inset = Math.max(bottomInset, Platform.OS === "web" ? 10 : 0);
  return bar + inset + fabLift + gap + (compact ? 8 : 10);
}

/** Max width for floating tab bar pill row (centered on tablet). */
export function tabBarMaxWidth(width?: number): number {
  const w = windowWidth(width);
  if (isTabletWidth(w)) return Math.min(contentMaxWidth(w) + 48, w - 24);
  return w;
}

/** Title / type scale by device class */
export function titleMetrics(width?: number): { size: number; lineHeight: number } {
  const cls = sizeClass(width);
  if (cls === "compact") return { size: 28, lineHeight: 34 };
  if (cls === "regular") return { size: 32, lineHeight: 38 };
  if (cls === "large") return { size: 34, lineHeight: 40 };
  if (cls === "tablet") return { size: 36, lineHeight: 42 };
  return { size: 40, lineHeight: 46 }; // tabletWide
}
