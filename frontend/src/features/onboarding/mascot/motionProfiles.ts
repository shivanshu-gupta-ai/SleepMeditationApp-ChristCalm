/**
 * Named motion profiles for GraceActor.
 * Heavy emotions = slower/smaller motion; calm = soft breathe.
 */

export type MotionProfileId =
  | "idleCalm"
  | "idleListen"
  | "idleThink"
  | "idleHeavy"
  | "idleHopeful"
  | "idleCelebrate"
  | "idleWave"
  | "idleFrozen";

export type MotionProfile = {
  id: MotionProfileId;
  /** Max upward bob in px */
  bobAmp: number;
  /** Half-cycle duration ms */
  bobMs: number;
  scaleLo: number;
  scaleHi: number;
  /** Optional soft horizontal sway (px) */
  swayAmp: number;
  glowLo: number;
  glowHi: number;
};

export const MOTION_PROFILES: Record<MotionProfileId, MotionProfile> = {
  idleCalm: {
    id: "idleCalm",
    bobAmp: 7,
    bobMs: 1500,
    scaleLo: 1,
    scaleHi: 1.02,
    swayAmp: 0,
    glowLo: 0.28,
    glowHi: 0.5,
  },
  idleListen: {
    id: "idleListen",
    bobAmp: 5,
    bobMs: 1600,
    scaleLo: 0.99,
    scaleHi: 1.015,
    swayAmp: 3,
    glowLo: 0.25,
    glowHi: 0.45,
  },
  idleThink: {
    id: "idleThink",
    bobAmp: 4,
    bobMs: 1800,
    scaleLo: 0.995,
    scaleHi: 1.01,
    swayAmp: 4,
    glowLo: 0.2,
    glowHi: 0.38,
  },
  idleHeavy: {
    id: "idleHeavy",
    bobAmp: 2.5,
    bobMs: 2200,
    scaleLo: 0.97,
    scaleHi: 1.0,
    swayAmp: 0,
    glowLo: 0.12,
    glowHi: 0.28,
  },
  idleHopeful: {
    id: "idleHopeful",
    bobAmp: 9,
    bobMs: 1200,
    scaleLo: 1,
    scaleHi: 1.035,
    swayAmp: 0,
    glowLo: 0.35,
    glowHi: 0.65,
  },
  idleCelebrate: {
    id: "idleCelebrate",
    bobAmp: 12,
    bobMs: 900,
    scaleLo: 1,
    scaleHi: 1.06,
    swayAmp: 2,
    glowLo: 0.4,
    glowHi: 0.75,
  },
  idleWave: {
    id: "idleWave",
    bobAmp: 8,
    bobMs: 1100,
    scaleLo: 1,
    scaleHi: 1.03,
    swayAmp: 6,
    glowLo: 0.3,
    glowHi: 0.55,
  },
  idleFrozen: {
    id: "idleFrozen",
    bobAmp: 1,
    bobMs: 2800,
    scaleLo: 0.99,
    scaleHi: 1.0,
    swayAmp: 0,
    glowLo: 0.1,
    glowHi: 0.18,
  },
};

export type ReactKind = "nod" | "lean" | "celebrate" | "exhale" | "none";

export type ReactSpec = {
  kind: ReactKind;
  /** Scale punch */
  scaleTo: number;
  /** Vertical delta during react */
  bobDelta: number;
  durationMs: number;
};
