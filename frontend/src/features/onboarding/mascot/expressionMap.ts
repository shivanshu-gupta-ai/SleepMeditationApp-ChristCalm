/** Screen / context → expression, glow, and optional entrance reaction. */
import type { GraceExpression, OnboardingRouteId } from "../types";
import type { ReactKind } from "./motionProfiles";

export type GraceStageConfig = {
  expression: GraceExpression | "splash";
  /** Soft glow tint: primary | gold | muted */
  glow: "primary" | "gold" | "muted" | "warm";
  enterReact?: ReactKind;
};

const LISTEN: GraceStageConfig = {
  expression: "listening",
  glow: "primary",
};

/** Full onboarding route → mascot stage (GIF moods + paywall ladder) */
export const ONBOARDING_GRACE: Record<OnboardingRouteId, GraceStageConfig> = {
  splash: { expression: "splash", glow: "gold", enterReact: "none" },
  welcome: { expression: "welcome", glow: "gold", enterReact: "celebrate" },
  benefit1: { expression: "peaceful", glow: "primary", enterReact: "exhale" },
  benefit2: { expression: "scripture", glow: "gold" },
  benefit3: { expression: "hopeful", glow: "primary" },
  name: { expression: "thinkname", glow: "gold", enterReact: "lean" },
  heart: { expression: "listening", glow: "primary", enterReact: "lean" },
  faith: { expression: "thoughtful", glow: "gold" },
  concerns: { expression: "heavy", glow: "muted", enterReact: "exhale" },
  timing: { expression: "peaceful", glow: "primary" },
  support: { expression: "hopeful", glow: "primary", enterReact: "lean" },
  didYouKnow: { expression: "didYouKnow", glow: "muted" },
  age: LISTEN,
  intensity: LISTEN,
  calculating: { expression: "preparing", glow: "primary" },
  profileReveal: { expression: "seeker", glow: "primary" },
  lifetimeLoss: { expression: "tracktospend", glow: "muted" },
  visualRemaining: { expression: "heavy", glow: "muted" },
  visualLost: { expression: "heavy", glow: "muted" },
  yearsReclaim: { expression: "happy1", glow: "gold", enterReact: "celebrate" },
  socialProof: { expression: "review", glow: "gold" },
  commitment: { expression: "committed", glow: "gold" },
  statsPreview: { expression: "peaceful", glow: "primary" },
  paywallFull: { expression: "hopeful", glow: "gold" },
  paywall50: { expression: "hopeful", glow: "gold" },
  paywall80: { expression: "hopeful", glow: "gold" },
  howAppWorks: {
    expression: "peaceful",
    glow: "primary",
    enterReact: "celebrate",
  },
};

export function graceConfigForRoute(id: OnboardingRouteId): GraceStageConfig {
  return ONBOARDING_GRACE[id] ?? LISTEN;
}
