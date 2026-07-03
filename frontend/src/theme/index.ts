import { Platform } from "react-native";

// Theme tokens for ChristCalm — matches design_guidelines.json
// Uses system fonts (no custom font loading required)
export const colors = {
  background: "#F9F7F1",
  surface: "#FFFFFF",
  surfaceAlt: "#F4EFE6",
  primary: "#5B9BA5",
  primaryDark: "#4A828C",
  secondary: "#8FA99A",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  accentSOS: "#D27D78",
  accentSOSDark: "#BC6964",
  border: "#E5E7EB",
  borderSoft: "#EFEAE0",
  premium: "#D4AF37",
  premiumDark: "#B8961F",
  white: "#FFFFFF",
  overlay: "rgba(31,41,55,0.6)",
};

// Use system fonts for reliability — bold weight handled via fontWeight
const sansSerif = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});

export const fonts = {
  heading: sansSerif,
  headingBold: sansSerif,
  body: sansSerif,
  bodyBold: sansSerif,
  scripture: serif,
  scriptureItalic: serif,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const shadows = {
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};
