import { interpolate, spring } from "remotion";

export interface GlitchAnimation {
  opacity: number;
  transform: string;
  filter?: string;
}

export const glitchAnimation = (
  frame: number,
  durationInFrames: number
): GlitchAnimation => {
  // Initial glitch effect
  if (frame < 10) {
    const intensity = spring({
      frame,
      config: { damping: 20, stiffness: 200 },
    });
    const offset = interpolate(intensity, [0, 1], [20, 0]);
    return {
      opacity: 1,
      transform: `translateX(${Math.random() > 0.5 ? offset : -offset}px)`,
      filter: `hue-rotate(${interpolate(intensity, [0, 1], [180, 0])}deg)`,
    };
  }

  return {
    opacity: 1,
    transform: "translateX(0)",
  };
};
