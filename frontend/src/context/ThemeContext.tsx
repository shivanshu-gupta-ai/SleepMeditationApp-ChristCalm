import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { darkColors, lightColors, type ColorTokens } from "@/src/theme/tokens";
import { createShadows, fonts, radius, spacing, type ShadowTokens } from "@/src/theme/primitives";
import { storage } from "@/src/utils/storage";

/** Explicit appearance only — system no longer drives dark automatically. */
export type ThemePreference = "light" | "dark" | "system";

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

/** v2 key: product default flipped from dark → light (ignore old dark auto-default). */
const PREF_KEY = "cc_theme_preference_v2";
const DEFAULT_PREFERENCE: ThemePreference = "light";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function normalizePreference(raw: string | null | undefined): ThemePreference {
  // Only explicit dark is dark; "system" and anything else → light.
  if (raw === "dark") return "dark";
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storage.getItem<string>(PREF_KEY, DEFAULT_PREFERENCE).then((stored) => {
      const next = normalizePreference(stored);
      setPreferenceState(next);
      if (stored !== next) {
        storage.setItem(PREF_KEY, next).catch(() => {});
      }
      setHydrated(true);
    });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    // Coerce system → light so OS dark never sneaks in
    const next = p === "system" ? "light" : p === "dark" ? "dark" : "light";
    setPreferenceState(next);
    storage.setItem(PREF_KEY, next).catch(() => {});
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState((prev) => {
      // Explicit only: light ↔ dark
      const next: ThemePreference = prev === "dark" ? "light" : "dark";
      storage.setItem(PREF_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  // Dark only when user explicitly chose dark — never from OS.
  const isDark = preference === "dark";

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
