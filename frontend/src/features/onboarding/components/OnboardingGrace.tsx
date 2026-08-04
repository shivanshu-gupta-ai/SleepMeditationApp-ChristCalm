import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { GraceMoodImage } from "./GraceMoodImage";
import { useOnboarding } from "../OnboardingContext";
import { graceConfigForRoute } from "../mascot/expressionMap";
import type { ReactKind } from "../mascot/motionProfiles";

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Extra one-shot react (e.g. typing nod) */
  reactToken?: number;
  reactKind?: ReactKind;
  showGlow?: boolean;
};

/**
 * Grace bound to the current onboarding route expression + motion profile.
 */
export function OnboardingGrace({
  size = 120,
  style,
  testID = "onboarding-grace",
  reactToken,
  reactKind,
  showGlow = true,
}: Props) {
  const { screen } = useOnboarding();
  const cfg = graceConfigForRoute(screen.id);

  return (
    <GraceMoodImage
      mood={cfg.expression}
      profile={cfg.profile}
      glowTone={cfg.glow}
      enterReact={cfg.enterReact ?? "none"}
      size={size}
      style={style}
      testID={testID}
      showGlow={showGlow}
      reactToken={reactToken}
      reactKind={reactKind}
    />
  );
}

export default OnboardingGrace;
