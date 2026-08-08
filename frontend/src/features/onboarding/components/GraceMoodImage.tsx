import React, { useEffect, useState } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import type { GraceExpression } from "../types";
import { GraceActor } from "../mascot/GraceActor";
import { GRACE_DISPLAY } from "../mascot/graceAssets";
import type { ReactKind } from "../mascot/motionProfiles";

export type GraceMoodImageProps = {
  mood?: GraceExpression | "splash";
  size?: number;
  /** Soft continuous bob animation */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  showGlow?: boolean;
  glowTone?: "primary" | "gold" | "muted" | "warm";
  /** One-shot react when token changes */
  reactToken?: number;
  reactKind?: ReactKind;
  /** Fire enter react once on mount */
  enterReact?: ReactKind;
  decorative?: boolean;
};

/**
 * Grace mascot — thin wrapper over GraceActor for backward-compatible API.
 */
export function GraceMoodImage({
  mood = "welcome",
  size = GRACE_DISPLAY.default,
  animate = true,
  style,
  testID = "grace-mood",
  showGlow = true,
  glowTone = "primary",
  reactToken = 0,
  reactKind = "none",
  enterReact = "none",
  decorative = false,
}: GraceMoodImageProps) {
  const [enterToken, setEnterToken] = useState(0);
  const [enterKind, setEnterKind] = useState<ReactKind>("none");

  useEffect(() => {
    if (enterReact !== "none") {
      setEnterKind(enterReact);
      setEnterToken((t) => t + 1);
    }
  }, [enterReact, mood]);

  const effectiveToken = reactToken > 0 ? reactToken : enterToken;
  const effectiveKind = reactToken > 0 ? reactKind : enterKind;

  return (
    <GraceActor
      expression={mood}
      size={size}
      animate={animate}
      showGlow={showGlow}
      glowTone={glowTone}
      reactToken={effectiveToken}
      reactKind={effectiveKind}
      decorative={decorative}
      style={style}
      testID={testID}
    />
  );
}

export default GraceMoodImage;
