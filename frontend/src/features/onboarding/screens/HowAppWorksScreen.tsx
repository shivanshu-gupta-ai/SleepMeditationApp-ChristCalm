import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { HOW_APP_WORKS_COPY } from "../copy";
import { GRACE_DISPLAY } from "../mascot/graceAssets";

/**
 * Screen 26 — How the App Works
 * Short feature cards, staggered enter; CTA is "Start my journey" → sign-in.
 */
export function HowAppWorksScreen() {
  const { colors, fonts, spacing, radius, shadows } = useTheme();
  const cards = HOW_APP_WORKS_COPY.cards;

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(16)).current;
  const cardAnims = useRef(cards.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerY, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.stagger(
      70,
      cardAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [headerOpacity, headerY, cardAnims]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
        },
        header: {
          alignItems: "center",
          marginBottom: spacing.lg,
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: -0.5,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.md,
        },
        sub: {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xs,
          maxWidth: 300,
        },
        list: {
          gap: spacing.sm,
        },
        card: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.soft,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        },
        cardText: { flex: 1, minWidth: 0 },
        cardTitle: {
          fontFamily: fonts.bodyBold,
          fontSize: 15,
          color: colors.textPrimary,
          letterSpacing: -0.2,
          marginBottom: 2,
        },
        cardSub: {
          fontFamily: fonts.body,
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
        },
      }),
    [colors, fonts, spacing, radius, shadows]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-howAppWorks">
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerY }] },
        ]}
      >
        <GraceMoodImage
          mood="peaceful"
          glowTone="primary"
          enterReact="celebrate"
          size={GRACE_DISPLAY.question}
          testID="grace-how-app-works"
        />
        <Text style={styles.title}>{HOW_APP_WORKS_COPY.title}</Text>
        <Text style={styles.sub}>{HOW_APP_WORKS_COPY.sub}</Text>
      </Animated.View>

      <View style={styles.list}>
        {cards.map((card, i) => {
          const anim = cardAnims[i];
          return (
            <Animated.View
              key={card.id}
              style={{
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.card}>
                <View style={styles.iconWrap}>
                  <Ionicons name={card.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSub}>{card.sub}</Text>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export default HowAppWorksScreen;
