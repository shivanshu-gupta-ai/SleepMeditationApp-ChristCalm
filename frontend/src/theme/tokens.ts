/**
 * ChristCalm design system — Nest dark + Cooper light (visual only).
 *
 * DARK  → Nest / Fit Flockers (Appdesign/4.png):
 *   true black canvas, soft charcoal cards WITHOUT hard borders,
 *   sparse typography, violet accents sparingly, warm gold FAB only.
 *   Premium = emptiness + hierarchy, not extra chrome.
 *
 * LIGHT → Cooper (Appdesign/8..png):
 *   cream-lavender canvas, white cards, lavender + soft gold tiles.
 */

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
  tileA: string;
  tileB: string;
  tileC: string;
  tileD: string;
  fab: string;
  fabText: string;
};

/**
 * LIGHT — Cooper: cream-lavender canvas, white cards, soft purple + gold.
 */
export const lightColors: ColorTokens = {
  background: "#F6F3FA",
  backgroundElevated: "#FCFAFE",
  surface: "#FFFFFF",
  surfaceAlt: "#F0ECF6",
  surfaceMuted: "#EDE8F7",
  primary: "#7C6FE0",
  primaryDark: "#6358C4",
  primarySoft: "rgba(124, 111, 224, 0.12)",
  secondary: "#C4A35A",
  textPrimary: "#1A1525",
  textSecondary: "#5C5568",
  textMuted: "#8E8799",
  textOnPrimary: "#FFFFFF",
  accentSOS: "#D47872",
  accentSOSDark: "#B85E59",
  accentSOSSoft: "rgba(212, 120, 114, 0.12)",
  border: "#E6E1EF",
  borderSoft: "#F0ECF5",
  premium: "#C9A227",
  premiumDark: "#A8861A",
  premiumSoft: "rgba(201, 162, 39, 0.14)",
  success: "#5BA88F",
  successSoft: "rgba(91, 168, 143, 0.12)",
  danger: "#C45C57",
  dangerSoft: "rgba(196, 92, 87, 0.12)",
  white: "#FFFFFF",
  overlay: "rgba(26, 21, 37, 0.4)",
  scrim: "rgba(26, 21, 37, 0.5)",
  gradient: ["#F6F3FA", "#EFEAF8", "#F8F4EC"],
  cardGlass: "rgba(255, 255, 255, 0.96)",
  tabBar: "rgba(255, 255, 255, 0.94)",
  inputFill: "#FFFFFF",
  focusRing: "rgba(124, 111, 224, 0.35)",
  tileA: "#EDE8FB",
  tileB: "#FBF3D9",
  tileC: "#1A1525",
  tileD: "#F5E6E4",
  fab: "#7C6FE0",
  fabText: "#FFFFFF",
};

/**
 * DARK — Nest: pure black + soft elevated cards.
 * Borders are near-invisible (premium apps separate layers by fill, not lines).
 * Purple/gold are accents only — never wall-to-wall chrome.
 */
export const darkColors: ColorTokens = {
  background: "#000000",
  backgroundElevated: "#0A0A0B",
  // Nest charcoal cards — sit above pure black without harsh outlines
  surface: "#161618",
  surfaceAlt: "#1C1C1F",
  surfaceMuted: "rgba(255, 255, 255, 0.06)",
  // Soft violet accent (Nest purple gem) — used sparingly
  primary: "#B8A4F5",
  primaryDark: "#9B86E8",
  primarySoft: "rgba(184, 164, 245, 0.14)",
  secondary: "#F0C14A",
  textPrimary: "#F5F5F7",
  textSecondary: "#A0A0A8",
  textMuted: "#6E6E76",
  // Nest primary CTAs are often light-on-dark ink, not violet fills
  textOnPrimary: "#0A0A0A",
  accentSOS: "#F0A8A3",
  accentSOSDark: "#E08A85",
  accentSOSSoft: "rgba(240, 168, 163, 0.12)",
  // Near-invisible separators (Nest almost never draws hard borders)
  border: "rgba(255, 255, 255, 0.08)",
  borderSoft: "rgba(255, 255, 255, 0.04)",
  premium: "#F0C14A",
  premiumDark: "#D4A82E",
  premiumSoft: "rgba(240, 193, 74, 0.14)",
  success: "#6BC4A8",
  successSoft: "rgba(107, 196, 168, 0.12)",
  danger: "#E08A85",
  dangerSoft: "rgba(224, 138, 133, 0.12)",
  white: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.55)",
  scrim: "rgba(0, 0, 0, 0.72)",
  gradient: ["#000000", "#050506", "#0C0C0E"],
  cardGlass: "rgba(22, 22, 24, 0.94)",
  tabBar: "rgba(18, 18, 20, 0.92)",
  inputFill: "#1C1C1F",
  focusRing: "rgba(184, 164, 245, 0.4)",
  // Dark tiles = soft elevated wells (not loud pastels — Nest calm)
  tileA: "#1A1A1D",
  tileB: "#1A1A1D",
  tileC: "#1A1A1D",
  tileD: "#1A1A1D",
  fab: "#F0C14A",
  fabText: "#0A0A0A",
};
