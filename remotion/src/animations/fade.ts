import { interpolate } from "remotion";

export interface FadeAnimation {
  opacity: number;
  transform: string;
}

export const fadeAnimation = (
  frame: number,
  durationInFrames: number,
  fadeInFrames: number = 15,
  fadeOutFrames: number = 15
): FadeAnimation => {
  let opacity = 1;

  // Fade in
  if (frame < fadeInFrames) {
    opacity = interpolate(frame, [0, fadeInFrames], [0, 1]);
  }
  // Fade out
  else if (frame > durationInFrames - fadeOutFrames) {
    opacity = interpolate(
      frame,
      [durationInFrames - fadeOutFrames, durationInFrames],
      [1, 0]
    );
  }

  return {
    opacity,
    transform: "scale(1)",
  };
};
