import { type ViewStyle } from "react-native";
import { fontFamilies } from "@/src/theme/fonts";

/**
 * Typography roles — single Nest-like family (Inter).
 * Weight hierarchy only: Semibold/Bold titles, Regular/Medium body.
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
 * Nest/Cooper spacing — roomy 8pt grid.
 * Prefer lg/xl gaps between sections (emptiness = premium).
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
 * Nest uses large soft radii (~20–28) on cards.
 */
export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  full: 999,
} as const;

export type ShadowTokens = {
  soft: ViewStyle;
  medium: ViewStyle;
  glow: ViewStyle;
};

/**
 * Elevation:
 * Dark Nest → almost no shadow noise; cards float via fill contrast.
 * Light Cooper → soft cool lavender shadow.
 */
export function createShadows(isDark: boolean): ShadowTokens {
  if (isDark) {
    return {
      soft: {
        // Subtle depth only — Nest cards are mostly fill, not drop-shadows
        shadowColor: "#000000",
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      },
      medium: {
        shadowColor: "#000000",
        shadowOpacity: 0.45,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      },
      glow: {
        // Rare purple ambient (empty states / premium moments)
        shadowColor: "#8B6FE0",
        shadowOpacity: 0.28,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
      },
    };
  }

  return {
    soft: {
      shadowColor: "#3D2E6B",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    medium: {
      shadowColor: "#3D2E6B",
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    glow: {
      shadowColor: "#7C6FE0",
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
  };
}

/** @deprecated Prefer theme.shadows from useTheme() */
export const shadows = createShadows(false);

export const motion = {
  pressScale: 0.97,
  pressSpring: { damping: 20, stiffness: 340, mass: 0.55 },
  enterDuration: 280,
  enterSlide: 10,
  microMs: 200,
} as const;

export const iconSize = {
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
} as const;

export const touchTarget = 44;
