import { type ViewStyle } from "react-native";
import { fontFamilies } from "@/src/theme/fonts";

/**
 * Semantic font roles used across the app.
 * Always reference these (never hardcode family strings in screens).
 * Pairing: Outfit (heading) + Figtree (body) + Cormorant Garamond (scripture)
 * — calm wellness stack aligned with Soft UI Evolution.
 */
export const fonts = {
  heading: fontFamilies.headingSemiBold,
  headingBold: fontFamilies.headingBold,
  body: fontFamilies.body,
  bodyBold: fontFamilies.bodySemiBold,
  bodyMedium: fontFamilies.bodyMedium,
  scripture: fontFamilies.scripture,
  scriptureItalic: fontFamilies.scriptureMediumItalic,
};

/**
 * Spacious 8pt rhythm (density dial 2/10 — Soft UI Evolution for wellness).
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/**
 * Soft UI Evolution radii — 10–24pt organic curves, never sharp corners.
 */
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export type ShadowTokens = {
  soft: ViewStyle;
  medium: ViewStyle;
  glow: ViewStyle;
};

/**
 * Soft UI Evolution shadows: multi-layer soft depth, clearer hierarchy than
 * pure neumorphism, WCAG-friendly. No harsh black blobs.
 */
export function createShadows(isDark: boolean): ShadowTokens {
  if (isDark) {
    return {
      soft: {
        shadowColor: "#000000",
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      },
      medium: {
        shadowColor: "#000000",
        shadowOpacity: 0.38,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      },
      glow: {
        shadowColor: "#7EC4CE",
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      },
    };
  }

  return {
    soft: {
      shadowColor: "#1A2332",
      shadowOpacity: 0.07,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    medium: {
      shadowColor: "#1A2332",
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    glow: {
      shadowColor: "#5B9BA5",
      shadowOpacity: 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  };
}

/** @deprecated Prefer theme.shadows from useTheme() */
export const shadows = createShadows(false);

/**
 * Motion tokens — subtle tier (dial 3/10).
 * Micro-interactions 150–300ms; spring press; respect reduced-motion in components.
 */
export const motion = {
  pressScale: 0.97,
  pressSpring: { damping: 20, stiffness: 340, mass: 0.55 },
  enterDuration: 280,
  enterSlide: 10,
  microMs: 200,
} as const;

/** Icon size scale (stroke-consistent Ionicons) */
export const iconSize = {
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
} as const;

/** Minimum touch target (Apple HIG 44pt) */
export const touchTarget = 44;
