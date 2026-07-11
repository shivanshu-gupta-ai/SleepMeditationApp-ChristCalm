import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { layout } from "@/src/theme/layout";
import { emotionIcon } from "@/src/constants/emotion-icons";
import { iconSize, touchTarget } from "@/src/theme/primitives";

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

/**
 * Emotion filter strip — Soft UI Evolution.
 * Vector icons only (no emoji). Edge fades instead of scrollbars.
 * Touch targets ≥44pt; labels never collapse (flexShrink: 0).
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

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const [viewportW, setViewportW] = useState(0);
  const [contentW, setContentW] = useState(0);

  const updateFades = useCallback(
    (offsetX: number, layoutW: number, sizeW: number) => {
      const maxScroll = Math.max(0, sizeW - layoutW);
      const canScroll = maxScroll > 8;
      setShowLeftFade(canScroll && offsetX > 6);
      setShowRightFade(canScroll && offsetX < maxScroll - 6);
    },
    []
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    updateFades(contentOffset.x, layoutMeasurement.width, contentSize.width);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setViewportW(w);
    updateFades(0, w, contentW || w);
  };

  const onContentSizeChange = (w: number) => {
    setContentW(w);
    updateFades(0, viewportW || w, w);
  };

  const fadeColor = colors.background;
  const fadeTransparent = isDark ? "rgba(11,14,19,0)" : "rgba(245,242,235,0)";

  const Pill = ({
    label,
    icon,
    color,
    active,
    onPress,
    testID,
    accessibilityLabel,
  }: {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    color?: string;
    active: boolean;
    onPress: () => void;
    testID: string;
    accessibilityLabel: string;
  }) => {
    const accent = color || colors.primary;
    return (
      <View style={{ flexShrink: 0, flexGrow: 0 }}>
        <PressableScale
          scaleTo={0.97}
          onPress={onPress}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          style={{
            minHeight: Math.max(layout.filterHeight, touchTarget),
            paddingVertical: 11,
            paddingHorizontal: 16,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: active
              ? isDark
                ? accent + "30"
                : accent + "24"
              : colors.surface,
            borderWidth: 1.5,
            borderColor: active ? accent + (isDark ? "AA" : "CC") : colors.borderSoft,
          }}
        >
          {icon ? (
            <Ionicons
              name={icon}
              size={iconSize.sm}
              color={active ? accent : colors.textSecondary}
            />
          ) : null}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: active ? fonts.bodyBold : fonts.body,
              fontSize: 14,
              lineHeight: 18,
              color: active ? colors.textPrimary : colors.textSecondary,
            }}
          >
            {label}
          </Text>
        </PressableScale>
      </View>
    );
  };

  return (
    <View
      style={{
        minHeight: layout.filterHeight + 24,
        marginBottom: spacing.md,
        justifyContent: "center",
      }}
      onLayout={onLayout}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{
          paddingLeft: pad,
          paddingRight: endPad,
          gap: 10,
          paddingVertical: 8,
          alignItems: "center",
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={onContentSizeChange}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {showAll ? (
          <Pill
            label="All"
            icon="apps-outline"
            active={selected == null}
            onPress={() => onSelect(null)}
            testID="meditate-chip-all"
            accessibilityLabel="Show all emotions"
          />
        ) : null}
        {emotions.map((em) => (
          <Pill
            key={em.id}
            label={em.label}
            icon={emotionIcon(em.id)}
            color={em.color}
            active={selected === em.id}
            onPress={() => onSelect(em.id)}
            testID={`meditate-chip-${em.id}`}
            accessibilityLabel={`Filter by ${em.label}`}
          />
        ))}
      </ScrollView>

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
    </View>
  );
}
