import React from "react";
import { ScreenSkeleton } from "../components/ScreenSkeleton";

/** Skeleton: How the App Works (design screen #26). Full UI ships in a later pass. */
export function HowAppWorksScreen() {
  return (
    <ScreenSkeleton
      screenIndex={26}
      title="How the App Works"
      expression="peaceful"
      testID="onboarding-screen-howAppWorks"
    />
  );
}

export default HowAppWorksScreen;
