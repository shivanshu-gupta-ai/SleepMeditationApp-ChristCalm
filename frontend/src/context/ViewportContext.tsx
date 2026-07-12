import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Dimensions, Platform, View, StyleSheet } from "react-native";
import {
  DESKTOP_SHELL_BREAKPOINT,
  PHONE_MAX_WIDTH,
  contentMaxWidth as calcContentMax,
  pagePadding as calcPadding,
  windowWidth as clampWindowW,
  isTabletWidth,
} from "@/src/utils/layout";
import { useTheme } from "@/src/context/ThemeContext";

export type ViewportValue = {
  /** Full window width (device / browser). */
  windowWidth: number;
  /** Height of the layout surface. */
  height: number;
  /**
   * Width for UI math inside the content column
   * (phones = full width; tablets = capped column).
   */
  width: number;
  pagePadding: number;
  contentMaxWidth: number;
  isTablet: boolean;
  isWebShell: boolean;
};

const ViewportContext = createContext<ViewportValue | null>(null);

function fromWindow(): ViewportValue {
  const win = Dimensions.get("window");
  const ww = clampWindowW(win.width);
  const contentMax = calcContentMax(ww);
  return {
    windowWidth: ww,
    height: win.height,
    width: contentMax,
    pagePadding: calcPadding(ww),
    contentMaxWidth: contentMax,
    isTablet: isTabletWidth(ww),
    isWebShell: Platform.OS === "web" && ww > DESKTOP_SHELL_BREAKPOINT,
  };
}

/**
 * Provides adaptive layout metrics for iPhone SE → Pro Max and all iPads.
 * On very wide desktop web only, wraps UI in a phone chrome shell.
 */
export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [viewport, setViewport] = useState<ViewportValue>(fromWindow);

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", () => {
      setViewport(fromWindow());
    });
    return () => sub.remove();
  }, []);

  const setMeasured = useCallback((width: number, height: number) => {
    const ww = clampWindowW(width);
    const contentMax = calcContentMax(ww);
    setViewport({
      windowWidth: ww,
      height,
      width: contentMax,
      pagePadding: calcPadding(ww),
      contentMaxWidth: contentMax,
      isTablet: isTabletWidth(ww),
      isWebShell: Platform.OS === "web" && ww > DESKTOP_SHELL_BREAKPOINT,
    });
  }, []);

  const value = useMemo(() => viewport, [viewport]);

  // Native iPhone / iPad: full adaptive, no chrome shell
  if (Platform.OS !== "web") {
    return (
      <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>
    );
  }

  return (
    <ViewportContext.Provider value={value}>
      <WebAdaptiveShell onMeasure={setMeasured}>{children}</WebAdaptiveShell>
    </ViewportContext.Provider>
  );
}

export function useViewport(): ViewportValue {
  const ctx = useContext(ViewportContext);
  if (!ctx) return fromWindow();
  return ctx;
}

/**
 * Web only:
 * - Tablet-sized viewports → full adaptive (no phone chrome)
 * - Very wide desktop → optional centered phone chrome for demo
 */
function WebAdaptiveShell({
  children,
  onMeasure,
}: {
  children: React.ReactNode;
  onMeasure: (w: number, h: number) => void;
}) {
  const { colors, isDark } = useTheme();
  const win = Dimensions.get("window");
  const needsPhoneShell = win.width > DESKTOP_SHELL_BREAKPOINT;

  if (!needsPhoneShell) {
    return (
      <View
        style={styles.fill}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          onMeasure(width, height);
        }}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: isDark ? colors.background : colors.backgroundElevated,
        },
      ]}
    >
      <View
        style={[
          styles.phone,
          {
            backgroundColor: colors.background,
            maxWidth: PHONE_MAX_WIDTH,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.5 : 0.12,
            shadowRadius: 40,
            shadowOffset: { width: 0, height: 12 },
          },
        ]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          onMeasure(width, height);
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: "100%", height: "100%" },
  outer: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  phone: {
    width: "100%",
    height: "100%",
    maxHeight: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
});
