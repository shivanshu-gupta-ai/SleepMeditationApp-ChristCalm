import React from "react";
import { IntroHeroSlide } from "../components/IntroHeroSlide";
import { INTRO_SLIDES } from "../copy";

/** Screen 4 — Personal support. */
export function Benefit3Screen() {
  const slide = INTRO_SLIDES[3];
  return (
    <IntroHeroSlide
      content={{
        overline: slide.overline,
        headline: slide.headline,
        supporting: slide.supporting,
        variant: slide.variant,
      }}
      pageIndex={3}
      testID="onboarding-screen-benefit3"
    />
  );
}

export default Benefit3Screen;
