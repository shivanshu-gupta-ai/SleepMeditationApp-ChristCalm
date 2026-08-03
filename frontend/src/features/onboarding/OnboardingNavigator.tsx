import React, { useCallback, useMemo } from "react";
import { Text, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import OnboardingStepLayout from "./components/OnboardingStepLayout";
import { useObStyles } from "./components/OnboardingStepLayout";
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

function OnboardingFlow() {
  const router = useRouter();
  const { markOnboardingComplete } = useAuth();
  const { colors } = useTheme();
  const obStyles = useObStyles();
  const { step, screen, goNext, goBack, canProceed, fade, slide } = useOnboarding();

  const handleSecondary = useCallback(() => {
    if (screen.id === "welcome") {
      markOnboardingComplete().then(() => router.replace("/(auth)/sign-in"));
      return;
    }
    // Paywalls / free paths: advance without selection gates
    goNext();
  }, [screen.id, markOnboardingComplete, router, goNext]);

  const footer = useMemo(() => {
    if (!screen.ctaLabel) return null;
    return (
      <>
        <TouchableOpacity
          style={[obStyles.cta, !canProceed && obStyles.ctaDisabled]}
          onPress={goNext}
          disabled={!canProceed}
          testID="onboarding-next-btn"
          accessibilityRole="button"
          accessibilityLabel={screen.ctaLabel}
          accessibilityState={{ disabled: !canProceed }}
        >
          <Text style={obStyles.ctaText}>{screen.ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
        {screen.secondaryCtaLabel ? (
          <TouchableOpacity onPress={handleSecondary} testID="onboarding-secondary-btn">
            <Text style={obStyles.link}>{screen.secondaryCtaLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </>
    );
  }, [screen, obStyles, goNext, handleSecondary, colors.white, canProceed]);

  const ScreenComponent = SCREEN_MAP[screen.id];

  return (
    <OnboardingStepLayout
      step={step}
      onBack={goBack}
      showProgress={screen.showProgress}
      showBack={screen.showBack && previousStepIndex(step) != null}
      footer={footer}
      scrollable={screen.id !== "calculating" && screen.id !== "splash"}
    >
      <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
        <ScreenComponent />
      </Animated.View>
    </OnboardingStepLayout>
  );
}

/**
 * Entry: OnboardingProvider owns draft + navigation.
 * Screens 6–10 (and others) read/write via useOnboarding().
 */
export function OnboardingNavigator() {
  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}

export default OnboardingNavigator;
