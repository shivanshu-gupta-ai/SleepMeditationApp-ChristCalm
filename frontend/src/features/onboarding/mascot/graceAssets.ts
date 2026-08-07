/**
 * Grace expression assets:
 * - Animated GIFs load from the public media S3 bucket (not app bundle)
 * - Local PNGs remain as instant / offline / reduce-motion fallbacks
 */
import type { ImageSourcePropType } from "react-native";
import type { GraceExpression } from "../types";

const DEFAULT_MEDIA_BASE =
  "https://christcalm-preview-media-500696805306.s3.us-east-1.amazonaws.com";

export const MEDIA_BASE_URL = (
  process.env.EXPO_PUBLIC_MEDIA_BASE_URL || DEFAULT_MEDIA_BASE
).replace(/\/$/, "");

export type GraceMoodKey = GraceExpression | "splash";

/** Bundled static poses — always available without network */
export const GRACE_PNG_FALLBACKS: Record<GraceMoodKey, ImageSourcePropType> = {
  welcome: require("@/assets/images/onboarding/grace-welcome.png"),
  listening: require("@/assets/images/onboarding/grace-listening.png"),
  thoughtful: require("@/assets/images/onboarding/grace-thoughtful.png"),
  heavy: require("@/assets/images/onboarding/grace-heavy.png"),
  hopeful: require("@/assets/images/onboarding/grace-hopeful.png"),
  committed: require("@/assets/images/onboarding/grace-committed.png"),
  peaceful: require("@/assets/images/onboarding/grace-peaceful.png"),
  splash: require("@/assets/images/onboarding/grace-splash.png"),
  // Extended moods reuse closest static pose until a dedicated PNG ships
  notification: require("@/assets/images/onboarding/grace-welcome.png"),
  smile: require("@/assets/images/onboarding/grace-hopeful.png"),
  anxiety: require("@/assets/images/onboarding/grace-heavy.png"),
  fact: require("@/assets/images/onboarding/grace-thoughtful.png"),
  thinking: require("@/assets/images/onboarding/grace-listening.png"),
  scripture: require("@/assets/images/onboarding/grace-thoughtful.png"),
  thinkname: require("@/assets/images/onboarding/grace-listening.png"),
  didYouKnow: require("@/assets/images/onboarding/grace-listening.png"),
  preparing: require("@/assets/images/onboarding/grace-thoughtful.png"),
  seeker: require("@/assets/images/onboarding/grace-thoughtful.png"),
  tracktospend: require("@/assets/images/onboarding/grace-heavy.png"),
  happy1: require("@/assets/images/onboarding/grace-hopeful.png"),
  review: require("@/assets/images/onboarding/grace-hopeful.png"),
};

/** S3 object key under onboarding/grace/ (filename matches expression) */
export function graceGifUrl(mood: GraceMoodKey): string {
  return `${MEDIA_BASE_URL}/onboarding/grace/${mood}.gif`;
}

export function graceGifSource(mood: GraceMoodKey): { uri: string } {
  return { uri: graceGifUrl(mood) };
}

/** Prefetch critical moods (welcome path). Call once when onboarding mounts. */
export const PREFETCH_MOODS: GraceMoodKey[] = ["splash", "welcome", "listening", "hopeful"];
