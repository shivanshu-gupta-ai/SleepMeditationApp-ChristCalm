import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { layout } from "@/src/theme/layout";
import { emotionIcon } from "@/src/constants/emotion-icons";
import { iconSize, touchTarget } from "@/src/theme/primitives";
import { playHaptic } from "@/src/utils/haptics";

export type EmotionItem = {
  id: string;
  label: string;
  color: string;
  /** @deprecated Prefer vector icons via emotionIcon(id) */
  emoji?: string;
};

type Props = {
  emotions: EmotionItem[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  showAll?: boolean;
  contentPadding?: number;
};

type PillItem =
  | { key: "all"; kind: "all"; label: string; icon: keyof typeof Ionicons.glyphMap; color?: string }
  | {
      key: string;
      kind: "emotion";
      id: string;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      color: string;
    };

function usePillData(emotions: EmotionItem[], showAll: boolean): PillItem[] {
  return useMemo(() => {
    const items: PillItem[] = [];
    if (showAll) {
      items.push({ key: "all", kind: "all", label: "All", icon: "apps-outline" });
    }
    for (const em of emotions) {
      items.push({
        key: em.id,
        kind: "emotion",
        id: em.id,
        label: em.label,
        icon: emotionIcon(em.id),
        color: em.color,
      });
    }
    return items;
  }, [emotions, showAll]);
}

/**
 * Emotion filter strip.
 * Web uses a plain overflow-x <div> (RN ScrollView + Pressable is broken for horizontal pan).
 * Native uses ScrollView + Pressable (no PressableScale / Reanimated inside the scroller).
 */
export function EmotionFilter({
  emotions,
  selected,
  onSelect,
  showAll = true,
  contentPadding = 0,
}: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const pad = contentPadding;
  const endPad = Math.max(pad, 16) + 24;
  const data = usePillData(emotions, showAll);

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const [viewportW, setViewportW] = useState(0);

  const updateFades = useCallback((offsetX: number, layoutW: number, sizeW: number) => {
    const maxScroll = Math.max(0, sizeW - layoutW);
    const canScroll = maxScroll > 8;
    setShowLeftFade(canScroll && offsetX > 6);
    setShowRightFade(canScroll && offsetX < maxScroll - 6);
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    updateFades(contentOffset.x, layoutMeasurement.width, contentSize.width);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setViewportW(e.nativeEvent.layout.width);
  };

  const onContentSizeChange = (w: number) => {
    updateFades(0, viewportW || w, w);
  };

  const fadeColor = colors.background;
  const fadeTransparent = isDark ? "rgba(11,14,19,0)" : "rgba(245,242,235,0)";

  const handleSelect = (item: PillItem) => {
    void playHaptic("light");
    if (item.kind === "all") onSelect(null);
    else onSelect(item.id);
  };

  const fades = (
    <>
      {showLeftFade ? (
        <LinearGradient
          pointerEvents="none"
          colors={[fadeColor, fadeTransparent]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 28,
            zIndex: 2,
          }}
        />
      ) : null}
      {showRightFade ? (
        <LinearGradient
          pointerEvents="none"
          colors={[fadeTransparent, fadeColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 36,
            zIndex: 2,
          }}
        />
      ) : null}
    </>
  );

  // ─── Web: plain DOM overflow-x (most reliable) ───────────────────────────
  if (Platform.OS === "web") {
    return (
      <View
        style={{
          minHeight: layout.filterHeight + 24,
          marginBottom: spacing.md,
          width: "100%",
          maxWidth: "100%",
          position: "relative",
        }}
        onLayout={onLayout}
        testID="emotion-filter"
      >
        <div
          id="emotion-filter-scroll"
          data-hscroll="1"
          data-testid="emotion-filter-scroll"
          onScroll={(e) => {
            const el = e.currentTarget;
            updateFades(el.scrollLeft, el.clientWidth, el.scrollWidth);
          }}
          onWheel={(e) => {
            const el = e.currentTarget;
            // Trackpad/mouse wheel → horizontal when strip overflows
            if (el.scrollWidth <= el.clientWidth) return;
            if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
              el.scrollLeft += e.deltaY;
              e.preventDefault();
            }
          }}
          style={{
            display: "block",
            overflowX: "scroll",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
            width: "100%",
            maxWidth: "100%",
            paddingTop: 8,
            paddingBottom: 8,
            boxSizing: "border-box",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            cursor: "grab",
          }}
        >
          {/* Inner row must be wider than the viewport for overflow to exist */}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              alignItems: "center",
              gap: 10,
              paddingLeft: pad,
              paddingRight: endPad,
              width: "max-content",
              maxWidth: "none",
              boxSizing: "content-box",
            }}
          >
            {data.map((item) => {
              const active = item.kind === "all" ? selected == null : selected === item.id;
              const accent = item.color || colors.primary;
              const bg = active
                ? isDark
                  ? accent + "30"
                  : accent + "24"
                : colors.surface;
              const border = active ? accent + (isDark ? "AA" : "CC") : colors.borderSoft;
              const fg = active ? colors.textPrimary : colors.textSecondary;
              const iconColor = active ? accent : colors.textSecondary;

              return (
                <button
                  key={item.key}
                  type="button"
                  data-testid={
                    item.kind === "all" ? "meditate-chip-all" : `meditate-chip-${item.id}`
                  }
                  aria-label={
                    item.kind === "all" ? "Show all emotions" : `Filter by ${item.label}`
                  }
                  aria-pressed={active}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: "0 0 auto",
                    minHeight: Math.max(layout.filterHeight, touchTarget),
                    padding: "11px 16px",
                    borderRadius: 999,
                    border: `1.5px solid ${border}`,
                    background: bg,
                    cursor: "pointer",
                    fontFamily: active ? fonts.bodyBold : fonts.body,
                    fontSize: 14,
                    lineHeight: "18px",
                    color: fg,
                    whiteSpace: "nowrap",
                    transform: active ? "scale(1.02)" : "scale(1)",
                    touchAction: "pan-x",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    appearance: "none",
                    WebkitAppearance: "none",
                    margin: 0,
                  }}
                >
                  <Ionicons name={item.icon} size={iconSize.sm} color={iconColor} />
                  <span style={{ fontFamily: "inherit", fontSize: "inherit", color: "inherit" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {fades}
      </View>
    );
  }

  // ─── Native ──────────────────────────────────────────────────────────────
  const scrollStyle: StyleProp<ViewStyle> = { flexGrow: 0, width: "100%" };

  return (
    <View
      style={{
        minHeight: layout.filterHeight + 24,
        marginBottom: spacing.md,
        width: "100%",
        maxWidth: "100%",
        position: "relative",
      }}
      onLayout={onLayout}
      testID="emotion-filter"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={scrollStyle}
        contentContainerStyle={{
          paddingLeft: pad,
          paddingRight: endPad,
          paddingVertical: 8,
          alignItems: "center",
          flexDirection: "row",
          flexGrow: 0,
          gap: 10,
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        directionalLockEnabled
        bounces
      >
        {data.map((item) => {
          const active = item.kind === "all" ? selected == null : selected === item.id;
          const accent = item.color || colors.primary;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleSelect(item)}
              testID={item.kind === "all" ? "meditate-chip-all" : `meditate-chip-${item.id}`}
              accessibilityLabel={
                item.kind === "all" ? "Show all emotions" : `Filter by ${item.label}`
              }
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                minHeight: Math.max(layout.filterHeight, touchTarget),
                paddingVertical: 11,
                paddingHorizontal: 16,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                backgroundColor: active
                  ? isDark
                    ? accent + "30"
                    : accent + "24"
                  : colors.surface,
                borderWidth: 1.5,
                borderColor: active ? accent + (isDark ? "AA" : "CC") : colors.borderSoft,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: active ? 1.02 : pressed ? 0.97 : 1 }],
              })}
            >
              <Ionicons
                name={item.icon}
                size={iconSize.sm}
                color={active ? accent : colors.textSecondary}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: active ? fonts.bodyBold : fonts.body,
                  fontSize: 14,
                  lineHeight: 18,
                  color: active ? colors.textPrimary : colors.textSecondary,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {fades}
    </View>
  );
}
