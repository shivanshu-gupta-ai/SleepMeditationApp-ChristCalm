import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { useSafeBack } from "@/src/hooks/use-safe-back";
import { OnboardingStepLayout, useObStyles } from "@/src/features/onboarding";
import { OnboardingQuestion } from "@/src/features/onboarding";
import { OnboardingOption } from "@/src/features/onboarding";
import { GraceCompanion } from "@/src/features/onboarding";
import {
  CONCERNS,
  DESIRED_SUPPORT,
  EMOTIONAL_STATES,
  FAITH_STAGES,
  HOW_THE_APP_WORKS,
  PREFERRED_TIMES,
  QUESTIONS,
  TOTAL_ONBOARDING_STEPS,
  getInsightCopy,
} from "@/src/features/onboarding";
import {
  loadOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingDraft,
} from "@/src/utils/onboarding-draft";
import { LoadingState } from "@/src/components/ui";

export default function Onboarding() {
  const router = useRouter();
  const { markOnboardingComplete } = useAuth();
  const { colors, fonts, spacing, radius } = useTheme();
  const obStyles = useObStyles();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const buildProgress = useRef(new Animated.Value(0)).current;

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

  const patch = useCallback((partial: Partial<OnboardingDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const animateStep = useCallback(
    (next: number) => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(slide, { toValue: -10, duration: 140, useNativeDriver: true }),
      ]).start(() => {
        setStep(next);
        slide.setValue(12);
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slide, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fade, slide]
  );

  const goNext = useCallback(() => {
    if (step >= TOTAL_ONBOARDING_STEPS - 1) {
      markOnboardingComplete().then(() => router.replace("/(auth)/sign-up"));
      return;
    }
    animateStep(step + 1);
  }, [step, animateStep, markOnboardingComplete, router]);

  const handleStepBack = useCallback(() => {
    if (step > 0) {
      animateStep(step - 1);
      return true;
    }
    return false;
  }, [step, animateStep]);

  const goBack = useSafeBack("/(auth)/sign-in", handleStepBack);

  useEffect(() => {
    if (step !== 10 || !hydrated) return;
    buildProgress.setValue(0);
    const anim = Animated.timing(buildProgress, {
      toValue: 1,
      duration: 3500,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) animateStep(11);
    });
    return () => anim.stop();
  }, [step, hydrated, buildProgress, animateStep]);

  const toggleList = (
    key: "concerns" | "desiredSupport" | "emotionalState",
    id: string
  ) => {
    if (!draft) return;
    const list = draft[key];
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    patch({ [key]: next });
  };

  const canProceed = () => {
    if (!draft) return false;
    switch (step) {
      case 0:
      case 1:
      case 6:
      case 8:
      case 9:
      case 10:
      case 11:
        return true;
      case 2:
        return draft.emotionalState.length > 0;
      case 3:
        return !!draft.faithStage;
      case 4:
        return draft.concerns.length > 0;
      case 5:
        return !!draft.preferredTime;
      case 7:
        return draft.desiredSupport.length > 0;
      default:
        return true;
    }
  };

  const ctaLabel = () => {
    if (step === 0) return "Begin My Journey";
    if (step === 8) return "I'm ready to begin";
    if (step === 9) return "I commit to this journey with Jesus";
    if (step === 11) return "Enter ChristCalm";
    return "Continue";
  };

  const finishOnboarding = () => {
    markOnboardingComplete().then(() => router.replace("/(auth)/sign-up"));
  };

  const covenantStyles = useMemo(
    () =>
      StyleSheet.create({
        text: {
          fontFamily: fonts.scriptureItalic,
          fontStyle: "italic",
          fontSize: 18,
          lineHeight: 28,
          color: colors.textPrimary,
          textAlign: "center",
        },
      }),
    [colors, fonts]
  );

  const buildStyles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          width: "80%",
          height: 8,
          backgroundColor: colors.borderSoft,
          borderRadius: radius.full,
          overflow: "hidden",
          marginTop: spacing.xl,
        },
        fill: {
          height: "100%",
          backgroundColor: colors.primary,
          borderRadius: radius.full,
        },
      }),
    [colors, spacing, radius]
  );

  if (!draft || !hydrated) {
    return <LoadingState message="Preparing Grace…" />;
  }

  const insight = getInsightCopy(draft);

  const footer =
    step !== 10 ? (
      <>
        <TouchableOpacity
          style={[obStyles.cta, !canProceed() && obStyles.ctaDisabled]}
          onPress={() => {
            if (step === 9) {
              patch({
                commitmentAccepted: true,
                commitmentDate: new Date().toISOString(),
              });
              goNext();
              return;
            }
            if (step === 11) {
              finishOnboarding();
              return;
            }
            goNext();
          }}
          disabled={!canProceed()}
          testID="onboarding-next-btn"
        >
          <Text style={obStyles.ctaText}>{ctaLabel()}</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
        {step === 0 && (
          <TouchableOpacity
            onPress={() => markOnboardingComplete().then(() => router.replace("/(auth)/sign-in"))}
            testID="onboarding-skip-signin"
          >
            <Text style={obStyles.link}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        )}
        {step === 1 && (
          <TouchableOpacity onPress={() => patch({ name: "Friend" })} testID="onboarding-call-friend">
            <Text style={obStyles.link}>Call me Friend</Text>
          </TouchableOpacity>
        )}
        {step === 9 && (
          <TouchableOpacity
            onPress={() => {
              patch({ commitmentAccepted: false });
              goNext();
            }}
            testID="onboarding-covenant-skip"
          >
            <Text style={obStyles.link}>I'll think about it</Text>
          </TouchableOpacity>
        )}
      </>
    ) : null;

  const animated = (node: React.ReactNode) => (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      {node}
    </Animated.View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={obStyles.center}>
            <GraceCompanion mood="wave" size={148} testID="grace-onboarding-welcome" />
            <Text style={obStyles.overline}>A sacred space for your heart</Text>
            <Text style={[obStyles.title, { fontSize: 24, lineHeight: 30 }]}>
              Peace I leave with you;{"\n"}my peace I give you.
            </Text>
            <Text style={obStyles.scriptureRef}>John 14:27</Text>
            <Text style={[obStyles.sub, { marginTop: spacing.md }]}>
              Grace is here to walk with you — one gentle step at a time.
            </Text>
          </View>
        );

      case 1:
        return (
          <View style={obStyles.content}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: spacing.sm,
              }}
            >
              <GraceCompanion
                mood="wave"
                size={64}
                testID="grace-onboarding-name"
              />
              <View style={{ flex: 1 }}>
                <OnboardingQuestion {...QUESTIONS.name} density="compact" />
              </View>
            </View>
            <TextInput
              style={obStyles.input}
              placeholder="Your name or nickname"
              placeholderTextColor={colors.textMuted}
              value={draft.name}
              onChangeText={(name) => patch({ name })}
              autoCapitalize="words"
              testID="onboarding-name-input"
            />
          </View>
        );

      case 2:
        return (
          <View style={obStyles.content}>
            <OnboardingQuestion {...QUESTIONS.heart} />
            {EMOTIONAL_STATES.map((e) => (
              <OnboardingOption
                key={e.id}
                icon={e.icon}
                label={e.label}
                sub={e.sub}
                multi
                selected={draft.emotionalState.includes(e.id)}
                onPress={() => toggleList("emotionalState", e.id)}
                testID={`emotion-${e.id}`}
              />
            ))}
          </View>
        );

      case 3:
        return (
          <View style={obStyles.content}>
            <OnboardingQuestion {...QUESTIONS.faith} />
            {FAITH_STAGES.map((s) => (
              <OnboardingOption
                key={s.id}
                icon={s.icon}
                label={s.label}
                sub={s.sub}
                selected={draft.faithStage === s.id}
                onPress={() => patch({ faithStage: s.id })}
                testID={`faith-option-${s.id}`}
              />
            ))}
          </View>
        );

      case 4:
        return (
          <View style={obStyles.content}>
            <OnboardingQuestion {...QUESTIONS.concerns} />
            {CONCERNS.map((c) => (
              <OnboardingOption
                key={c.id}
                icon={c.icon}
                label={c.label}
                sub={c.sub}
                multi
                selected={draft.concerns.includes(c.id)}
                onPress={() => toggleList("concerns", c.id)}
                testID={`concern-${c.id}`}
              />
            ))}
          </View>
        );

      case 5:
        return (
          <View style={obStyles.content}>
            <OnboardingQuestion {...QUESTIONS.timing} />
            {PREFERRED_TIMES.map((t) => (
              <OnboardingOption
                key={t.id}
                icon={t.icon}
                label={t.label}
                sub={t.sub}
                selected={draft.preferredTime === t.id}
                onPress={() => patch({ preferredTime: t.id })}
                testID={`time-${t.id}`}
              />
            ))}
          </View>
        );

      case 6:
        return (
          <View style={obStyles.center}>
            <GraceCompanion mood="idle" size={112} testID="grace-onboarding-insight" />
            <Text style={obStyles.overline}>A gentle insight</Text>
            <Text style={obStyles.title}>{insight.headline}</Text>
            <Text style={[obStyles.sub, { marginTop: spacing.md }]}>{insight.sub}</Text>
          </View>
        );

      case 7:
        return (
          <View style={obStyles.content}>
            <OnboardingQuestion {...QUESTIONS.support} />
            {DESIRED_SUPPORT.map((s) => (
              <OnboardingOption
                key={s.id}
                icon={s.icon}
                label={s.label}
                sub={s.sub}
                multi
                selected={draft.desiredSupport.includes(s.id)}
                onPress={() => toggleList("desiredSupport", s.id)}
                testID={`support-${s.id}`}
              />
            ))}
          </View>
        );

      case 8:
        return (
          <View style={obStyles.center}>
            <GraceCompanion mood="idle" size={120} testID="grace-onboarding-scripture" />
            <Text style={obStyles.overline}>Scripture</Text>
            <Text style={obStyles.title}>A moment with God&apos;s Word</Text>
            <View style={[obStyles.card, { marginTop: spacing.lg, width: "100%" }]}>
              <Text style={obStyles.scripture}>
                &ldquo;Come to me, all you who are weary and burdened, and I will give you rest.&rdquo;
              </Text>
              <Text style={obStyles.scriptureRef}>Matthew 11:28</Text>
            </View>
            <Text style={[obStyles.sub, { marginTop: spacing.lg }]}>
              Inside the app you&apos;ll find emotion-based meditations, SOS breathing, prayer, and
              a daily Scripture reflection — always rooted in His Word.
            </Text>
          </View>
        );

      case 9:
        return (
          <View style={obStyles.content}>
            <OnboardingQuestion {...QUESTIONS.covenant} />
            <View style={[obStyles.card, { marginBottom: spacing.lg }]}>
              <Text style={covenantStyles.text}>
                With Jesus beside me,{"\n"}
                I choose to walk toward peace —{"\n"}
                one gentle step, one honest breath, one day at a time.{"\n"}
                I am not alone. I am deeply loved.
              </Text>
            </View>
          </View>
        );

      case 10:
        return (
          <View style={obStyles.center}>
            <GraceCompanion
              mood="idle"
              size={120}
              style={{ marginBottom: spacing.md }}
              testID="grace-onboarding-build"
            />
            <Text style={obStyles.overline}>Almost there</Text>
            <Text style={obStyles.title}>Setting up your calm space.</Text>
            <Text style={obStyles.sub}>
              Scripture-based meditations, SOS breathing, prayer, and journal — ready when you are.
            </Text>
            <View style={buildStyles.track}>
              <Animated.View
                style={[
                  buildStyles.fill,
                  {
                    width: buildProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        );

      case 11:
        return (
          <View style={obStyles.content}>
            <OnboardingQuestion {...QUESTIONS.practices} />

            <View style={obStyles.previewCard}>
              <Text style={obStyles.previewTitle}>What you can do in the app</Text>
              {HOW_THE_APP_WORKS.map((item) => (
                <View
                  key={item.id}
                  style={[obStyles.previewRow, { alignItems: "flex-start", marginBottom: spacing.md }]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      backgroundColor: colors.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        fontSize: 15,
                        color: colors.textPrimary,
                        marginBottom: 2,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 13,
                        color: colors.textSecondary,
                        lineHeight: 19,
                      }}
                    >
                      {item.sub}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Tiny corner Grace only on long multi-select lists (doesn't fight the header)
  const showCornerGrace = step === 4 || step === 7 || step === 11;

  return (
    <OnboardingStepLayout
      step={step}
      onBack={goBack}
      showProgress={step > 0}
      footer={footer}
      scrollable={step !== 10}
    >
      {showCornerGrace ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: 10,
            top: 4,
            zIndex: 4,
            opacity: 0.92,
          }}
        >
          <GraceCompanion
            mood="idle"
            size={44}
            showRing
            testID="grace-onboarding-corner"
          />
        </View>
      ) : null}
      {animated(renderStep())}
    </OnboardingStepLayout>
  );
}
