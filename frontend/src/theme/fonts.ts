/**
 * Brand typefaces — Nest / Fit Flockers style.
 *
 * Nest uses ONE clean geometric neo-grotesque (SF Pro–like):
 * - Large, calm titles (Semibold / Bold)
 * - Quiet secondary UI (Regular / Medium)
 * - No display quirks, no dual-family “product” pairing
 *
 * Inter is the open closest match to that system-premium look.
 * (Sora + Plus Jakarta felt more “characterful” than Nest’s restraint.)
 */

export const fontFamilies = {
  heading: "Inter",
  headingMedium: "Inter-Medium",
  headingSemiBold: "Inter-SemiBold",
  headingBold: "Inter-Bold",
  body: "Inter",
  bodyMedium: "Inter-Medium",
  bodySemiBold: "Inter-SemiBold",
  bodyBold: "Inter-Bold",
  /** Verse / quote — same family, medium weight (Nest keeps one face) */
  scripture: "Inter-Medium",
  scriptureItalic: "Inter",
  scriptureMediumItalic: "Inter-Medium",
} as const;

export type FontKey = keyof typeof fontFamilies;
