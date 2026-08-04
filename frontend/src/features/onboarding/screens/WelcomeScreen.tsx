import React from "react";
import { IntroHeroSlide } from "../components/IntroHeroSlide";
import { INTRO_SLIDES } from "../copy";

/** Screen 1 — Welcome to ChristCalm + soft scripture under. */
export function WelcomeScreen() {
  const slide = INTRO_SLIDES[0];
  return (
    <IntroHeroSlide
      content={{
        overline: slide.overline,
        headline: slide.headline,
        scripture: slide.scripture,
        reference: slide.reference,
        supporting: slide.supporting,
        variant: slide.variant,
      }}
      pageIndex={0}
      testID="onboarding-screen-welcome"
    />
  );
}

export default WelcomeScreen;
