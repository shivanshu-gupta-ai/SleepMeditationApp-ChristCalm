import React, { useCallback, useMemo, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import OnboardingStepLayout, {
  useObStyles,
} from "./components/OnboardingStepLayout";
import { OnboardingProvider, useOnboarding } from "./OnboardingContext";
import { previousStepIndex } from "./sequence";
import type { OnboardingRouteId } from "./types";
import {
  SplashScreen,
  WelcomeScreen,
  Benefit1Screen,
  Benefit2Screen,
  Benefit3Screen,
  NameScreen,
  HeartScreen,
  FaithScreen,
  ConcernsScreen,
  TimingScreen,
  SupportScreen,
  DidYouKnowScreen,
  AgeScreen,
  IntensityScreen,
  CalculatingScreen,
  ProfileRevealScreen,
  LifetimeLossScreen,
  VisualRemainingScreen,
  VisualLostScreen,
  YearsReclaimScreen,
  SocialProofScreen,
  CommitmentScreen,
  StatsPreviewScreen,
  PaywallFullScreen,
  Paywall50Screen,
  Paywall80Screen,
  HowAppWorksScreen,
} from "./screens";

type ScreenComponent = React.ComponentType;

const SCREEN_MAP: Record<OnboardingRouteId, ScreenComponent> = {
  splash: SplashScreen,
  welcome: WelcomeScreen,
  benefit1: Benefit1Screen,
  benefit2: Benefit2Screen,
  benefit3: Benefit3Screen,
  name: NameScreen,
  heart: HeartScreen,
  faith: FaithScreen,
  concerns: ConcernsScreen,
  timing: TimingScreen,
  support: SupportScreen,
  didYouKnow: DidYouKnowScreen,
  age: AgeScreen,
  intensity: IntensityScreen,
  calculating: CalculatingScreen,
  profileReveal: ProfileRevealScreen,
  lifetimeLoss: LifetimeLossScreen,
  visualRemaining: VisualRemainingScreen,
  visualLost: VisualLostScreen,
  yearsReclaim: YearsReclaimScreen,
  socialProof: SocialProofScreen,
  commitment: CommitmentScreen,
  statsPreview: StatsPreviewScreen,
  paywallFull: PaywallFullScreen,
  paywall50: Paywall50Screen,
  paywall80: Paywall80Screen,
  howAppWorks: HowAppWorksScreen,
};

/** First four value screens: welcome + 3 benefits — swipeable intro carousel. */
const INTRO_IDS = new Set<OnboardingRouteId>([
  "welcome",
  "benefit1",
  "benefit2",
  "benefit3",
]);

const SWIPE_THRESHOLD = 56;
const SWIPE_VELOCITY = 0.35;

function OnboardingFlow() {
  const router = useRouter();
  const { markOnboardingComplete } = useAuth();
  const { colors, radius, shadows } = useTheme();
  const obStyles = useObStyles();
  const {
    step,
    screen,
    goNext,
    goBack,
    finish,
    canProceed,
    fade,
    slide,
    exitOpacity,
  } = useOnboarding();

  const isIntro = INTRO_IDS.has(screen.id);
  const goNextRef = useRef(goNext);
  const goBackRef = useRef(goBack);
  goNextRef.current = goNext;
  goBackRef.current = goBack;

  const handlePrimary = useCallback(() => {
    if (screen.id === "howAppWorks") {
      finish();
      return;
    }
    goNext();
  }, [screen.id, finish, goNext]);

  const handleSecondary = useCallback(() => {
    if (screen.id === "welcome") {
      markOnboardingComplete().then(() =>
        router.replace("/(auth)/sign-in?mode=signin")
      );
      return;
    }
    goNext();
  }, [screen.id, markOnboardingComplete, router, goNext]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (
          _e: GestureResponderEvent,
          g: PanResponderGestureState
        ) => {
          if (!isIntro) return false;
          return Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15;
        },
        onPanResponderRelease: (
          _e: GestureResponderEvent,
          g: PanResponderGestureState
        ) => {
          if (!isIntro) return;
          const goForward =
            g.dx < -SWIPE_THRESHOLD || g.vx < -SWIPE_VELOCITY;
          const goBackward =
            g.dx > SWIPE_THRESHOLD || g.vx > SWIPE_VELOCITY;
          if (goForward) goNextRef.current();
          else if (goBackward) goBackRef.current();
        },
      }),
    [isIntro]
  );

  const footer = useMemo(() => {
    if (!screen.ctaLabel) return null;
    const isFinale = screen.id === "howAppWorks";
    const introCta = isIntro;
    return (
      <>
        <TouchableOpacity
          style={[
            obStyles.cta,
            !canProceed && obStyles.ctaDisabled,
            isFinale && { minHeight: 52 },
            introCta && {
              minHeight: 56,
              borderRadius: radius.full,
              paddingVertical: 16,
              marginHorizontal: 4,
              ...shadows.glow,
            },
          ]}
          onPress={handlePrimary}
          disabled={!canProceed}
          testID="onboarding-next-btn"
          accessibilityRole="button"
          accessibilityLabel={screen.ctaLabel}
          accessibilityState={{ disabled: !canProceed }}
        >
          <Text style={[obStyles.ctaText, introCta && { fontSize: 17 }]}>
            {screen.ctaLabel}
          </Text>
          <Ionicons
            name={
              isFinale
                ? "arrow-forward-circle"
                : screen.id === "benefit3"
                  ? "sparkles"
                  : "arrow-forward"
            }
            size={isFinale || introCta ? 22 : 20}
            color={colors.white}
          />
        </TouchableOpacity>
        {screen.secondaryCtaLabel ? (
          <TouchableOpacity onPress={handleSecondary} testID="onboarding-secondary-btn">
            <Text style={obStyles.link}>{screen.secondaryCtaLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </>
    );
  }, [
    screen,
    obStyles,
    handlePrimary,
    handleSecondary,
    colors.white,
    canProceed,
    isIntro,
    radius.full,
    shadows.glow,
  ]);

  const ScreenComponent = SCREEN_MAP[screen.id];

  return (
    <Animated.View style={{ flex: 1, opacity: exitOpacity }}>
      <OnboardingStepLayout
        step={step}
        onBack={goBack}
        showProgress={screen.showProgress && screen.id !== "howAppWorks"}
        showBack={
          screen.showBack &&
          previousStepIndex(step) != null &&
          screen.id !== "howAppWorks"
        }
        footer={footer}
        scrollable={
          screen.id !== "calculating" &&
          screen.id !== "splash" &&
          !isIntro
        }
      >
        <Animated.View
          style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
          {...(isIntro ? panResponder.panHandlers : {})}
        >
          <ScreenComponent />
        </Animated.View>
      </OnboardingStepLayout>
    </Animated.View>
  );
}

/**
 * Entry: OnboardingProvider owns draft + navigation.
 * Final screen fades out into sign-in.
 */
export function OnboardingNavigator() {
  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}

export default OnboardingNavigator;
