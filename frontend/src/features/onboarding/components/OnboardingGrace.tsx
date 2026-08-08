import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { GraceMoodImage } from "./GraceMoodImage";
import { useOnboarding } from "../OnboardingContext";
import { graceConfigForRoute } from "../mascot/expressionMap";
import { GRACE_DISPLAY } from "../mascot/graceAssets";
import type { ReactKind } from "../mascot/motionProfiles";

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Extra one-shot react (e.g. typing nod) */
  reactToken?: number;
  reactKind?: ReactKind;
  showGlow?: boolean;
  decorative?: boolean;
};

/**
 * Grace bound to the current onboarding route expression + motion profile.
 */
export function OnboardingGrace({
  size = GRACE_DISPLAY.question,
  style,
  testID = "onboarding-grace",
  reactToken,
  reactKind,
  showGlow = true,
  decorative = false,
}: Props) {
  const { screen } = useOnboarding();
  const cfg = graceConfigForRoute(screen.id);

  return (
    <GraceMoodImage
      mood={cfg.expression}
      glowTone={cfg.glow}
      enterReact={cfg.enterReact ?? "none"}
      size={size}
      style={style}
      testID={testID}
      showGlow={showGlow}
      reactToken={reactToken}
      reactKind={reactKind}
      decorative={decorative}
    />
  );
}

export default OnboardingGrace;
