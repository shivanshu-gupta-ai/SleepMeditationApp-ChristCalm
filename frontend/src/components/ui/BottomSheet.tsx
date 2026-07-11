import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  Dimensions,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { playHaptic } from "@/src/utils/haptics";
import { PHONE_MAX_WIDTH } from "@/src/utils/layout";
import { useViewport } from "@/src/context/ViewportContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Max height fraction of screen (0–1). Default 0.72 */
  maxHeightRatio?: number;
  testID?: string;
};

/**
 * Premium soft bottom sheet — scrim + slide-up surface.
 * On web, constrained to phone shell width (not full laptop width).
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeightRatio = 0.72,
  testID = "bottom-sheet",
}: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: shellWidth, height: shellHeight } = useViewport();
  const backdrop = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  // Phone-width column — always ≤ real window (SE safe) and ≤ Pro Max on desktop web
  const win = Dimensions.get("window");
  const columnWidth = Math.min(
    win.width,
    shellWidth > 0 ? shellWidth : win.width,
    PHONE_MAX_WIDTH
  );
  const maxSheetHeight =
    Math.min(win.height, shellHeight > 0 ? shellHeight : win.height) * maxHeightRatio;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          damping: 20,
          stiffness: 280,
          mass: 0.7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdrop.setValue(0);
      slide.setValue(40);
    }
  }, [visible, backdrop, slide]);

  const close = () => {
    void playHaptic("light");
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 48,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const sheetStyle: ViewStyle = {
    width: "100%",
    backgroundColor: colors.surface,
    // Nest/Cooper large sheet corners
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    borderBottomWidth: 0,
    paddingBottom: Math.max(insets.bottom, 16) + 8,
    maxHeight: maxSheetHeight,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: isDark ? 0.45 : 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -8 },
      },
      android: { elevation: 16 },
      default: {},
    }),
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      {/* Full-window dim so outside phone frame is also muted on desktop web */}
      <View style={styles.modalRoot} testID={testID}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel="Dismiss"
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.scrim,
                opacity: backdrop,
              },
            ]}
          />
        </Pressable>

        {/* Centered phone-width column — sheet only as wide as the app shell */}
        <View
          pointerEvents="box-none"
          style={[
            styles.phoneColumn,
            {
              width: columnWidth,
              maxWidth: PHONE_MAX_WIDTH,
            },
          ]}
        >
          <Animated.View
            style={[
              sheetStyle,
              {
                transform: [{ translateY: slide }],
                opacity: backdrop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ]}
          >
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            {(title || subtitle) && (
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
                {title ? (
                  <Text
                    style={{
                      fontFamily: fonts.headingBold,
                      fontSize: 22,
                      color: colors.textPrimary,
                      letterSpacing: -0.4,
                    }}
                  >
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginTop: 6,
                      lineHeight: 20,
                    }}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            )}

            <View style={{ paddingHorizontal: spacing.lg }}>{children}</View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  phoneColumn: {
    width: "100%",
    maxWidth: PHONE_MAX_WIDTH,
    justifyContent: "flex-end",
    // Keep above tab bar area on web; sheet sits at bottom of column
    alignSelf: "center",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});
