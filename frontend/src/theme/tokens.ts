/** Semantic color tokens — premium wellness aesthetic (light + dark). */

export type ColorTokens = {
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  accentSOS: string;
  accentSOSDark: string;
  accentSOSSoft: string;
  border: string;
  borderSoft: string;
  premium: string;
  premiumDark: string;
  premiumSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  white: string;
  overlay: string;
  scrim: string;
  gradient: [string, string, string];
  cardGlass: string;
  tabBar: string;
  inputFill: string;
  focusRing: string;
};

/**
 * Soft UI Evolution palette — serene teal + sage wellness.
 * Retains ChristCalm brand (not generic purple). Contrast tuned for WCAG AA+.
 */
export const lightColors: ColorTokens = {
  background: "#F5F2EB",
  backgroundElevated: "#FBF9F4",
  surface: "#FFFFFF",
  surfaceAlt: "#F0EBE2",
  surfaceMuted: "#E8F3F4",
  primary: "#4F8F99",
  primaryDark: "#3D757E",
  primarySoft: "rgba(79, 143, 153, 0.14)",
  secondary: "#7A9B88",
  textPrimary: "#15202B",
  textSecondary: "#4F5966",
  textMuted: "#7A8491",
  textOnPrimary: "#FFFFFF",
  accentSOS: "#C96B66",
  accentSOSDark: "#B05550",
  accentSOSSoft: "rgba(201, 107, 102, 0.12)",
  border: "#DDD8CF",
  borderSoft: "#EBE6DD",
  premium: "#B8941F",
  premiumDark: "#967812",
  premiumSoft: "rgba(184, 148, 31, 0.14)",
  success: "#3D8F80",
  successSoft: "rgba(61, 143, 128, 0.12)",
  danger: "#B84D48",
  dangerSoft: "rgba(184, 77, 72, 0.12)",
  white: "#FFFFFF",
  overlay: "rgba(21, 32, 43, 0.48)",
  scrim: "rgba(21, 32, 43, 0.58)",
  gradient: ["#F5F2EB", "#EAF2F3", "#F0EBE2"],
  cardGlass: "rgba(255, 255, 255, 0.94)",
  tabBar: "rgba(255, 255, 255, 0.96)",
  inputFill: "#FFFFFF",
  focusRing: "rgba(79, 143, 153, 0.4)",
};

/** Deep charcoal + soft teal — calm, luxurious night mode (Soft UI Evolution dark) */
export const darkColors: ColorTokens = {
  background: "#0B0E13",
  backgroundElevated: "#12161E",
  surface: "#171C26",
  surfaceAlt: "#1E2430",
  surfaceMuted: "rgba(126, 196, 206, 0.14)",
  primary: "#8AD0DA",
  primaryDark: "#5FAAB5",
  primarySoft: "rgba(138, 208, 218, 0.2)",
  secondary: "#96BCAA",
  textPrimary: "#F5F7FA",
  textSecondary: "#B0B8C4",
  textMuted: "#7A8494",
  textOnPrimary: "#0B0E13",
  accentSOS: "#ECA8A3",
  accentSOSDark: "#D9908B",
  accentSOSSoft: "rgba(236, 168, 163, 0.16)",
  border: "#2E3644",
  borderSoft: "#252B36",
  premium: "#EBC878",
  premiumDark: "#D6B14F",
  premiumSoft: "rgba(235, 200, 120, 0.16)",
  success: "#75CDBA",
  successSoft: "rgba(117, 205, 186, 0.16)",
  danger: "#E59590",
  dangerSoft: "rgba(229, 149, 144, 0.16)",
  white: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.58)",
  scrim: "rgba(0, 0, 0, 0.72)",
  gradient: ["#0B0E13", "#0F131A", "#141A22"],
  cardGlass: "rgba(23, 28, 38, 0.96)",
  tabBar: "rgba(18, 22, 30, 0.98)",
  inputFill: "#1E2430",
  focusRing: "rgba(138, 208, 218, 0.45)",
};
