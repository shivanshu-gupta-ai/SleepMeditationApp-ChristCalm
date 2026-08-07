import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/features/auth";
import { useSafeBack } from "@/src/hooks/use-safe-back";
import { LoadingState } from "@/src/components/ui";
import {
  loadOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingDraft,
} from "@/src/utils/onboarding-draft";
import {
  TOTAL_ONBOARDING_STEPS,
  getScreenDef,
  previousStepIndex,
} from "./sequence";
import type { OnboardingRouteId, OnboardingScreenDef } from "./types";

type MultiKey = "emotionalState" | "concerns" | "desiredSupport";

export type OnboardingContextValue = {
  hydrated: boolean;
  step: number;
  screen: OnboardingScreenDef;
  draft: OnboardingDraft;
  /** Merge partial answers into the shared draft (persisted). */
  patch: (partial: Partial<OnboardingDraft>) => void;
  /** Toggle a multi-select option id. */
  toggleMulti: (key: MultiKey, id: string) => void;
  /** Set a single-select field. */
  setSingle: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  goNext: () => void;
  goBack: () => void;
  /** Jump to a step index (bypasses canProceed). Used after purchase / paywall skips. */
  goToStep: (index: number) => void;
  /** Complete onboarding with a smooth exit → sign-in. */
  finish: () => void;
  canProceed: boolean;
  fade: Animated.Value;
  slide: Animated.Value;
  /** Full-screen exit opacity for leave-onboarding transition */
  exitOpacity: Animated.Value;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}

function canProceedForStep(step: number, draft: OnboardingDraft): boolean {
  const id = getScreenDef(step).id as OnboardingRouteId;
  switch (id) {
    case "heart":
      return draft.emotionalState.length > 0;
    case "faith":
      return !!draft.faithStage;
    case "concerns":
      return draft.concerns.length > 0;
    case "timing":
      return !!draft.preferredTime;
    case "support":
      return draft.desiredSupport.length > 0;
    case "age":
      return !!draft.ageRange;
    case "commitment":
      return draft.commitmentAccepted === true;
    default:
      return true;
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { markOnboardingComplete } = useAuth();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const finishingRef = useRef(false);

  const screen = getScreenDef(step);

  useEffect(() => {
    loadOnboardingDraft().then((d) => {
      setDraft(d);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !draft) return;
    saveOnboardingDraft(draft);
  }, [draft, hydrated]);

  const animateTo = useCallback(
    (next: number, direction: "forward" | "back" = "forward") => {
      const outY = direction === "forward" ? -14 : 14;
      const inY = direction === "forward" ? 16 : -16;
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: outY,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(next);
        slide.setValue(inY);
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slide, {
            toValue: 0,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fade, slide]
  );

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    // Smooth exit: fade + slight rise, then land on sign-in
    Animated.parallel([
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: -28,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        finishingRef.current = false;
        return;
      }
      markOnboardingComplete()
        // After onboarding, open unified auth on Create account
        .then(() => router.replace("/(auth)/sign-in?mode=signup"))
        .catch(() => {
          finishingRef.current = false;
          exitOpacity.setValue(1);
          fade.setValue(1);
          slide.setValue(0);
        });
    });
  }, [markOnboardingComplete, router, exitOpacity, slide, fade]);

  const goNext = useCallback(() => {
    if (!draft || !canProceedForStep(step, draft)) return;
    if (step >= TOTAL_ONBOARDING_STEPS - 1) {
      finish();
      return;
    }
    // Track paywall ladder progression
    const next = step + 1;
    if (next >= 23 && next <= 25) {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              highestPaywallSeen: Math.max(prev.highestPaywallSeen ?? 0, next),
            }
          : prev
      );
    }
    animateTo(next, "forward");
  }, [step, draft, animateTo, finish]);

  const goToStep = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(TOTAL_ONBOARDING_STEPS - 1, index));
      if (clamped >= 23 && clamped <= 25) {
        setDraft((prev) =>
          prev
            ? {
                ...prev,
                highestPaywallSeen: Math.max(prev.highestPaywallSeen ?? 0, clamped),
              }
            : prev
        );
      }
      animateTo(clamped, clamped >= step ? "forward" : "back");
    },
    [animateTo, step]
  );

  const goBackStep = useCallback(() => {
    const prev = previousStepIndex(step);
    if (prev == null) return false;
    animateTo(prev, "back");
    return true;
  }, [step, animateTo]);

  const goBack = useSafeBack("/(auth)/sign-in", goBackStep);

  const patch = useCallback((partial: Partial<OnboardingDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const toggleMulti = useCallback((key: MultiKey, id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const list = prev[key];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...prev, [key]: next };
    });
  }, []);

  const setSingle = useCallback(
    <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  // Splash auto-advance
  useEffect(() => {
    if (!hydrated || step !== 0) return;
    const t = setTimeout(() => animateTo(1), 1600);
    return () => clearTimeout(t);
  }, [step, hydrated, animateTo]);

  // Calculating insights auto-advance (matches 3 sequential bars ~0.9s each + holds)
  useEffect(() => {
    if (!hydrated || step !== 14) return;
    const t = setTimeout(() => animateTo(15), 4200);
    return () => clearTimeout(t);
  }, [step, hydrated, animateTo]);

const value = useMemo<OnboardingContextValue | null>(() => {
    if (!draft) return null;
    return {
      hydrated,
      step,
      screen,
      draft,
      patch,
      toggleMulti,
      setSingle,
      goNext,
      goBack,
      goToStep,
      finish,
      canProceed: canProceedForStep(step, draft),
      fade,
      slide,
      exitOpacity,
    };
  }, [
    hydrated,
    step,
    screen,
    draft,
    patch,
    toggleMulti,
    setSingle,
    goNext,
    goBack,
    goToStep,
    finish,
    fade,
    slide,
    exitOpacity,
  ]);

  if (!value) {
    return <LoadingState emblem="grace" message="Preparing Grace…" />;
  }

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export default OnboardingContext;
