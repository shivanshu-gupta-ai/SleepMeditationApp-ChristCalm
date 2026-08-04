import React, { useCallback, useRef } from "react";
import { Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";
import { layout } from "@/src/theme/layout";
import {
  Screen,
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  FadeIn,
  ListSkeleton,
} from "@/src/components/ui";
import { useJourneyStats } from "@/src/features/stats";
import { RangeSelector } from "@/src/features/stats/components/RangeSelector";
import { JourneyHero } from "@/src/features/stats/components/JourneyHero";
import { WeekActivityChart } from "@/src/features/stats/components/WeekActivityChart";
import { ReflectionInsight } from "@/src/features/stats/components/ReflectionInsight";
import { PracticeBreakdown } from "@/src/features/stats/components/PracticeBreakdown";
import { MomentsCelebrate } from "@/src/features/stats/components/MomentsCelebrate";
import { RecentSessions } from "@/src/features/stats/components/RecentSessions";

/**
 * Your Journey — 30s ritual of honest recognition (practice + rest).
 * Budget: header → range → hero → chart → optional secondary only if true.
 */
export default function StatsScreen() {
  const router = useRouter();
  const { colors, fonts, spacing } = useTheme();
  const { bottomClearance, isCompact } = useResponsive();
  const { loading, refreshing, error, range, snapshot, load, setRange, refresh } =
    useJourneyStats();
  const rangeRef = useRef(range);
  rangeRef.current = range;
  const hasSnapshot = useRef(false);
  if (snapshot) hasSnapshot.current = true;

  useFocusEffect(
    useCallback(() => {
      void load(rangeRef.current, hasSnapshot.current);
    }, [load])
  );

  if (loading && !snapshot) {
    return (
      <Screen contentStyle={{ paddingTop: isCompact ? 12 : layout.pageTop }}>
        <PageHeader overline="Presence" title="Your Journey" />
        <LoadingState
          fullScreen={false}
          emblem="grace"
          message="Gathering your journey…"
          slowMessage="Still gathering — connection may be slow…"
        />
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (error && !snapshot) {
    return (
      <ErrorState
        title="Journey is resting"
        message={error}
        onRetry={() => void load(range)}
      />
    );
  }

  if (snapshot && !snapshot.hasAnyPractice) {
    return (
      <Screen
        scroll
        contentStyle={{
          paddingTop: isCompact ? 12 : layout.pageTop,
          paddingBottom: bottomClearance,
        }}
      >
        <FadeIn>
          <PageHeader
            overline="Presence"
            title="Your Journey"
            subtitle="A quiet place to notice rest and return."
            testID="stats-header"
          />
        </FadeIn>
        <EmptyState
          icon="leaf-outline"
          title="Your first stillness awaits"
          message="Complete a short meditation and this space will fill with quiet light — never pressure."
          actionLabel="Find a session"
          onAction={() => router.push("/(tabs)/meditate")}
          testID="stats-empty"
        />
      </Screen>
    );
  }

  const quietRange = snapshot
    ? snapshot.activeDays <= 1 && snapshot.minutes === 0
    : false;

  return (
    <Screen
      scroll
      refreshing={refreshing}
      onRefresh={() => void refresh()}
      contentStyle={{
        paddingTop: isCompact ? 12 : layout.pageTop,
        paddingBottom: bottomClearance,
        backgroundColor: colors.background,
      }}
      testID="stats-screen"
    >
      <FadeIn>
        <PageHeader
          overline="Presence"
          title="Your Journey"
          subtitle="See how rest is taking root — without competition."
          testID="stats-header"
        />
      </FadeIn>

      <FadeIn delay={20}>
        <RangeSelector value={range} onChange={setRange} />
      </FadeIn>

      {error ? (
        <ErrorState
          title="Could not refresh"
          message={error}
          onRetry={() => void load(range)}
        />
      ) : null}

      {snapshot ? (
        <>
          {/* Must: recognition + rhythm (complete if never scroll past chart) */}
          <FadeIn delay={40}>
            <JourneyHero snapshot={snapshot} />
          </FadeIn>

          <FadeIn delay={60}>
            <WeekActivityChart days={snapshot.dayBars} range={range} />
          </FadeIn>

          {quietRange ? (
            <FadeIn delay={70}>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.textSecondary,
                  marginBottom: spacing.lg,
                  textAlign: "center",
                  paddingHorizontal: spacing.md,
                }}
                testID="stats-quiet-range"
              >
                A quiet season in this view — rest is holy. Return when you are ready.
              </Text>
            </FadeIn>
          ) : null}

          {/* Optional: only when true and within budget */}
          {snapshot.reflection ? (
            <FadeIn delay={80}>
              <ReflectionInsight text={snapshot.reflection} />
            </FadeIn>
          ) : null}

          {snapshot.practice.length >= 2 ? (
            <FadeIn delay={100}>
              <PracticeBreakdown slices={snapshot.practice} />
            </FadeIn>
          ) : null}

          {snapshot.milestones.length > 0 ? (
            <FadeIn delay={120}>
              <MomentsCelebrate milestones={snapshot.milestones} />
            </FadeIn>
          ) : null}

          {snapshot.recent.length > 0 ? (
            <FadeIn delay={140}>
              <RecentSessions sessions={snapshot.recent} />
            </FadeIn>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
