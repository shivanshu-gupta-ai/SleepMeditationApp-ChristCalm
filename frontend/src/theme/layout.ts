/**
 * Shared layout rhythm for a premium wellness UI.
 * Inspired by Calm/Headspace-style calm apps: generous space, soft surfaces,
 * low visual noise, consistent hierarchy across tabs.
 */
/**
 * Shared layout rhythm — Soft UI Evolution, spacious wellness density.
 * Generous whitespace, soft surfaces, consistent hierarchy across tabs.
 */
export const layout = {
  /** Top padding inside Screen content */
  pageTop: 20,
  /** Bottom padding for scroll content above tab bar */
  pageBottom: 56,
  /** Vertical gap between major sections */
  sectionGap: 36,
  /** Gap between cards in a list */
  listGap: 16,
  /** Standard card padding */
  cardPad: 22,
  /** Page title */
  titleSize: 30,
  titleLineHeight: 36,
  /** Body helper under titles */
  subtitleSize: 15,
  subtitleLineHeight: 23,
  /** Uppercase labels */
  overlineSize: 12,
  overlineTracking: 1.6,
  /** Emotion / filter tiles — min 44pt touch */
  filterHeight: 44,
  /** Soft radius — keep moderate so body text isn't clipped at corners */
  surfaceRadius: 18,
  /** Min touch target */
  touchMin: 44,
} as const;
