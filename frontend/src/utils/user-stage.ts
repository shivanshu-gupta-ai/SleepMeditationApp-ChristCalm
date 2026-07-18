/**
 * User journey stage — personalize Home / Meditate by behavior, not one generic screen.
 * new → returning → engaged (mirrors fitness “first / regular / super user” pattern).
 */
import { getCompletedCount, getStreak } from "@/src/utils/session-progress";

export type UserStage = "new" | "returning" | "engaged";

export type StageSnapshot = {
  stage: UserStage;
  completed: number;
  streak: number;
};

export async function getUserStage(): Promise<StageSnapshot> {
  const [completed, streak] = await Promise.all([getCompletedCount(), getStreak()]);
  let stage: UserStage = "new";
  if (completed >= 5 || streak >= 3) stage = "engaged";
  else if (completed >= 1 || streak >= 1) stage = "returning";
  return { stage, completed, streak };
}

/** Stage-aware home greeting overline (sensory / journey language). */
export function stageHomeOverline(
  stage: UserStage,
  hour: number
): string {
  if (stage === "new") {
    if (hour < 12) return "Welcome · first steps";
    if (hour < 18) return "Glad you’re here";
    return "A quiet place to begin";
  }
  if (stage === "returning") {
    if (hour < 12) return "Good morning · your path";
    if (hour < 18) return "Welcome back · midday rest";
    return "Evening peace · continue";
  }
  // engaged
  if (hour < 12) return "Your rhythm · morning";
  if (hour < 18) return "Your rhythm · midday";
  return "Your rhythm · evening";
}

export function stageEmotionPrompt(stage: UserStage): { title: string; sub: string } {
  if (stage === "new") {
    return {
      title: "How is your heart?",
      sub: "Pick one feeling — we’ll meet you with Scripture-guided calm. No wrong answer.",
    };
  }
  if (stage === "returning") {
    return {
      title: "How are you feeling today?",
      sub: "Choose a feeling for today’s guided session",
    };
  }
  return {
    title: "What do you need right now?",
    sub: "Jump into the session that matches this moment",
  };
}
