/**
 * Single Nest-like face (Inter). heading* and body* alias the same weights.
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
  scripture: "Inter-Medium",
  scriptureItalic: "Inter",
  scriptureMediumItalic: "Inter-Medium",
} as const;

export type FontKey = keyof typeof fontFamilies;
