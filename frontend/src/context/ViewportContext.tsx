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
  PHONE_MAX_WIDTH,
  layoutWidth,
  pagePadding as calcPadding,
} from "@/src/utils/layout";
import { useTheme } from "@/src/context/ThemeContext";

export type ViewportValue = {
  /** Layout width for UI (phone-clamped) */
  width: number;
  height: number;
  pagePadding: number;
  contentMaxWidth: number;
  isWebShell: boolean;
};

const ViewportContext = createContext<ViewportValue | null>(null);

function fromWindow(): ViewportValue {
  const win = Dimensions.get("window");
  const width = layoutWidth(win.width);
  return {
    width,
    height: win.height,
    pagePadding: calcPadding(width),
    contentMaxWidth: width,
    isWebShell: Platform.OS === "web" && win.width > PHONE_MAX_WIDTH,
  };
}

/**
 * Provides phone-sized layout metrics. On wide web viewports, MobileShell
 * measures the actual shell and overrides these values.
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
    const w = layoutWidth(width);
    setViewport({
      width: w,
      height,
      pagePadding: calcPadding(w),
      contentMaxWidth: w,
      isWebShell: Platform.OS === "web",
    });
  }, []);

  const value = useMemo(() => viewport, [viewport]);

  // Native: no shell, just context
  if (Platform.OS !== "web") {
    return (
      <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>
    );
  }

  return (
    <ViewportContext.Provider value={value}>
      <WebPhoneShell onMeasure={setMeasured}>{children}</WebPhoneShell>
    </ViewportContext.Provider>
  );
}

export function useViewport(): ViewportValue {
  const ctx = useContext(ViewportContext);
  if (!ctx) {
    // Fallback if used outside provider
    return fromWindow();
  }
  return ctx;
}

function WebPhoneShell({
  children,
  onMeasure,
}: {
  children: React.ReactNode;
  onMeasure: (w: number, h: number) => void;
}) {
  const { colors, isDark } = useTheme();
  const win = Dimensions.get("window");
  const needsShell = win.width > PHONE_MAX_WIDTH + 8;

  if (!needsShell) {
    // Already phone-sized browser / responsive mode
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
          backgroundColor: isDark ? "#050608" : "#E8E4DB",
        },
      ]}
    >
      <View
        style={[
          styles.phone,
          {
            backgroundColor: colors.background,
            maxWidth: PHONE_MAX_WIDTH,
            // Soft phone chrome
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
    maxHeight: 932, // iPhone 14 Pro Max logical height class
    // Mild curve — large radius + overflow:hidden was clipping edge text
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
});
