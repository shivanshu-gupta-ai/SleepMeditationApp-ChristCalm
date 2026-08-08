/** Bundled Grace animations and responsive display widths. */
import type { ImageSourcePropType } from "react-native";
import type { GraceExpression } from "../types";

export type GraceMoodKey = GraceExpression | "splash";

/** Every Grace animation shares this native 300 × 169 canvas. */
export const GRACE_ASPECT_RATIO = 300 / 169;

/**
 * Widths in logical points. GraceActor derives height from GRACE_ASPECT_RATIO,
 * so the animation never reserves the empty square used by the old PNG loader.
 */
export const GRACE_DISPLAY = {
  default: 220,
  questionCompact: 112,
  question: 132,
  questionTablet: 152,
  focusCompact: 220,
  focus: 260,
  focusTablet: 300,
  roomy: 260,
  hero: 320,
  stageCompact: 190,
  stage: 220,
  stageTablet: 240,
} as const;

/**
 * Static require calls are intentional: Metro must know every bundled asset at
 * build time. Local GIFs remove the network placeholder flash and work offline.
 */
export const GRACE_GIF_ASSETS: Record<GraceMoodKey, ImageSourcePropType> = {
  welcome: require("@/assets/images/onboarding/grace/welcome.gif"),
  listening: require("@/assets/images/onboarding/grace/listening.gif"),
  thoughtful: require("@/assets/images/onboarding/grace/thoughtful.gif"),
  heavy: require("@/assets/images/onboarding/grace/heavy.gif"),
  hopeful: require("@/assets/images/onboarding/grace/hopeful.gif"),
  committed: require("@/assets/images/onboarding/grace/committed.gif"),
  peaceful: require("@/assets/images/onboarding/grace/peaceful.gif"),
  splash: require("@/assets/images/onboarding/grace/splash.gif"),
  notification: require("@/assets/images/onboarding/grace/notification.gif"),
  smile: require("@/assets/images/onboarding/grace/smile.gif"),
  anxiety: require("@/assets/images/onboarding/grace/anxiety.gif"),
  fact: require("@/assets/images/onboarding/grace/fact.gif"),
  thinking: require("@/assets/images/onboarding/grace/thinking.gif"),
  scripture: require("@/assets/images/onboarding/grace/scripture.gif"),
  thinkname: require("@/assets/images/onboarding/grace/thinkname.gif"),
  didYouKnow: require("@/assets/images/onboarding/grace/didYouKnow.gif"),
  preparing: require("@/assets/images/onboarding/grace/preparing.gif"),
  seeker: require("@/assets/images/onboarding/grace/seeker.gif"),
  tracktospend: require("@/assets/images/onboarding/grace/tracktospend.gif"),
  happy1: require("@/assets/images/onboarding/grace/happy1.gif"),
  review: require("@/assets/images/onboarding/grace/review.gif"),
};
