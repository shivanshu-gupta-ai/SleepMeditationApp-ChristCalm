/**
 * Brand typeface map for ChristCalm.
 * Loaded via expo-font aliases in use-app-fonts.ts.
 *
 * Outfit  — headings (modern, calm, premium)
 * Figtree — body UI (friendly, highly legible)
 * Cormorant Garamond — scripture (reverent serif)
 */

export const fontFamilies = {
  heading: "Outfit",
  headingMedium: "Outfit-Medium",
  headingSemiBold: "Outfit-SemiBold",
  headingBold: "Outfit-Bold",
  body: "Figtree",
  bodyMedium: "Figtree-Medium",
  bodySemiBold: "Figtree-SemiBold",
  bodyBold: "Figtree-Bold",
  scripture: "CormorantGaramond",
  scriptureItalic: "CormorantGaramond-Italic",
  scriptureMediumItalic: "CormorantGaramond-MediumItalic",
} as const;

export type FontKey = keyof typeof fontFamilies;
