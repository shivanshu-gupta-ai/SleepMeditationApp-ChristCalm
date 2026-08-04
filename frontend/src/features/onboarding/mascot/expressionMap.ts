/**
 * Screen / context → expression + motion profile for Grace.
 */
import type { GraceExpression, OnboardingRouteId } from "../types";
import type { MotionProfileId, ReactKind } from "./motionProfiles";

export type GraceStageConfig = {
  expression: GraceExpression | "splash";
  profile: MotionProfileId;
  /** Soft glow tint: primary | gold | muted */
  glow: "primary" | "gold" | "muted" | "warm";
  enterReact?: ReactKind;
};

const LISTEN: GraceStageConfig = {
  expression: "listening",
  profile: "idleListen",
  glow: "primary",
};

const HEAVY: GraceStageConfig = {
  expression: "heavy",
  profile: "idleHeavy",
  glow: "muted",
};

/** Full onboarding route → mascot stage (expression matches question feeling) */
export const ONBOARDING_GRACE: Record<OnboardingRouteId, GraceStageConfig> = {
  splash: { expression: "splash", profile: "idleCalm", glow: "gold", enterReact: "none" },
  welcome: { expression: "welcome", profile: "idleWave", glow: "gold", enterReact: "celebrate" },
  benefit1: { expression: "peaceful", profile: "idleCalm", glow: "primary", enterReact: "exhale" },
  benefit2: { expression: "thoughtful", profile: "idleThink", glow: "gold" },
  benefit3: { expression: "hopeful", profile: "idleHopeful", glow: "primary" },
  name: { expression: "welcome", profile: "idleListen", glow: "gold", enterReact: "lean" },
  heart: { expression: "listening", profile: "idleListen", glow: "primary", enterReact: "lean" },
  faith: { expression: "thoughtful", profile: "idleThink", glow: "gold" },
  concerns: { expression: "heavy", profile: "idleHeavy", glow: "muted", enterReact: "exhale" },
  timing: { expression: "peaceful", profile: "idleCalm", glow: "primary" },
  support: { expression: "hopeful", profile: "idleHopeful", glow: "primary", enterReact: "lean" },
  didYouKnow: { expression: "listening", profile: "idleListen", glow: "muted" },
  age: { expression: "listening", profile: "idleListen", glow: "primary" },
  intensity: { expression: "listening", profile: "idleListen", glow: "primary" },
  calculating: { expression: "thoughtful", profile: "idleThink", glow: "primary" },
  profileReveal: { expression: "thoughtful", profile: "idleThink", glow: "primary" },
  lifetimeLoss: HEAVY,
  visualRemaining: { expression: "heavy", profile: "idleFrozen", glow: "muted" },
  visualLost: { expression: "heavy", profile: "idleFrozen", glow: "muted" },
  yearsReclaim: { expression: "hopeful", profile: "idleHopeful", glow: "gold", enterReact: "celebrate" },
  socialProof: { expression: "hopeful", profile: "idleHopeful", glow: "gold" },
  commitment: { expression: "committed", profile: "idleCalm", glow: "gold" },
  statsPreview: { expression: "peaceful", profile: "idleCalm", glow: "primary" },
  paywallFull: { expression: "hopeful", profile: "idleCalm", glow: "gold" },
  paywall50: { expression: "hopeful", profile: "idleCalm", glow: "gold" },
  paywall80: { expression: "hopeful", profile: "idleCalm", glow: "gold" },
  howAppWorks: {
    expression: "peaceful",
    profile: "idleWave",
    glow: "primary",
    enterReact: "celebrate",
  },
};

export function graceConfigForRoute(id: OnboardingRouteId): GraceStageConfig {
  return ONBOARDING_GRACE[id] ?? LISTEN;
}

export function profileForExpression(
  expression: GraceExpression | "splash"
): MotionProfileId {
  switch (expression) {
    case "listening":
      return "idleListen";
    case "thoughtful":
      return "idleThink";
    case "heavy":
      return "idleHeavy";
    case "hopeful":
      return "idleHopeful";
    case "committed":
      return "idleCelebrate";
    case "peaceful":
      return "idleCalm";
    case "welcome":
    case "splash":
    default:
      return "idleCalm";
  }
}
