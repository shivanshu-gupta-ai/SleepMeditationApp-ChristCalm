import React from "react";
import { IntroHeroSlide } from "../components/IntroHeroSlide";
import { INTRO_SLIDES } from "../copy";

/** Screen 3 — Scripture-rooted rest. */
export function Benefit2Screen() {
  const slide = INTRO_SLIDES[2];
  return (
    <IntroHeroSlide
      content={{
        overline: slide.overline,
        headline: slide.headline,
        supporting: slide.supporting,
        variant: slide.variant,
      }}
      pageIndex={2}
      testID="onboarding-screen-benefit2"
    />
  );
}

export default Benefit2Screen;
