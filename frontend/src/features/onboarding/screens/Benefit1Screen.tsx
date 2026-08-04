import React from "react";
import { IntroHeroSlide } from "../components/IntroHeroSlide";
import { INTRO_SLIDES } from "../copy";

/** Screen 2 — Quiet the noise. */
export function Benefit1Screen() {
  const slide = INTRO_SLIDES[1];
  return (
    <IntroHeroSlide
      content={{
        overline: slide.overline,
        headline: slide.headline,
        supporting: slide.supporting,
        variant: slide.variant,
      }}
      pageIndex={1}
      testID="onboarding-screen-benefit1"
    />
  );
}

export default Benefit1Screen;
