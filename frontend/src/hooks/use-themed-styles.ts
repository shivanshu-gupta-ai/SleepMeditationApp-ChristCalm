import { useMemo } from "react";
import { useTheme, type ThemeContextValue } from "@/src/context/ThemeContext";

/** Build StyleSheet-compatible styles from the live theme (recomputes on light/dark). */
export function useThemedStyles<T>(factory: (theme: ThemeContextValue) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}

/** Stable helper when factory is defined inline — pass deps manually */
export function useThemedStylesWithDeps<T>(
  factory: (theme: ThemeContextValue) => T,
  deps: readonly unknown[] = []
): T {
  const theme = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(theme), [theme.isDark, theme.preference, ...deps]);
}
