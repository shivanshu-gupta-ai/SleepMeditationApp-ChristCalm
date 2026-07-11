/** Theme public API */

export { lightColors, darkColors, type ColorTokens } from "@/src/theme/tokens";
export {
  fonts,
  spacing,
  radius,
  createShadows,
  shadows,
  motion,
  type ShadowTokens,
} from "@/src/theme/primitives";
export { fontFamilies } from "@/src/theme/fonts";

/** @deprecated Prefer useTheme().colors — static light tokens for rare legacy cases */
import { lightColors } from "@/src/theme/tokens";

export const colors = {
  background: lightColors.background,
  surface: lightColors.surface,
  surfaceAlt: lightColors.surfaceAlt,
  primary: lightColors.primary,
  primaryDark: lightColors.primaryDark,
  secondary: lightColors.secondary,
  textPrimary: lightColors.textPrimary,
  textSecondary: lightColors.textSecondary,
  textMuted: lightColors.textMuted,
  accentSOS: lightColors.accentSOS,
  accentSOSDark: lightColors.accentSOSDark,
  border: lightColors.border,
  borderSoft: lightColors.borderSoft,
  premium: lightColors.premium,
  premiumDark: lightColors.premiumDark,
  white: lightColors.white,
  overlay: lightColors.overlay,
};
