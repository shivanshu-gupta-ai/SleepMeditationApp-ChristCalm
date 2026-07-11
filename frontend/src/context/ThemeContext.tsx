import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ColorTokens } from "@/src/theme/tokens";
import { createShadows, fonts, radius, spacing, type ShadowTokens } from "@/src/theme/primitives";
import { storage } from "@/src/utils/storage";

export type ThemePreference = "system" | "light" | "dark";

export type ThemeContextValue = {
  colors: ColorTokens;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  cyclePreference: () => void;
  fonts: typeof fonts;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: ShadowTokens;
};

const PREF_KEY = "cc_theme_preference";
/** App launches in dark by default (premium night aesthetic). */
const DEFAULT_PREFERENCE: ThemePreference = "dark";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storage.getItem<ThemePreference>(PREF_KEY, DEFAULT_PREFERENCE).then((stored) => {
      // Persist dark as the product default. Keep explicit light/system if user set them.
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreferenceState(stored);
      } else {
        setPreferenceState(DEFAULT_PREFERENCE);
        storage.setItem(PREF_KEY, DEFAULT_PREFERENCE).catch(() => {});
      }
      setHydrated(true);
    });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    storage.setItem(PREF_KEY, p).catch(() => {});
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState((prev) => {
      // Cycle: dark → light → system → dark
      const next: ThemePreference =
        prev === "dark" ? "light" : prev === "light" ? "system" : "dark";
      storage.setItem(PREF_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const isDark =
    preference === "dark" || (preference === "system" && systemScheme === "dark");

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      preference: hydrated ? preference : DEFAULT_PREFERENCE,
      setPreference,
      cyclePreference,
      fonts,
      spacing,
      radius,
      shadows: createShadows(isDark),
    }),
    [isDark, preference, hydrated, setPreference, cyclePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
