import { interpolate, spring, useCurrentFrame } from "remotion";

export interface SlamAnimation {
  transform: string;
  opacity: number;
  scale: number;
}

export const slamAnimation = (
  frame: number
): SlamAnimation => {
  const progress = spring({
    frame,
    config: { damping: 15, stiffness: 100, mass: 1 },
  });

  const scale = interpolate(progress, [0, 0.8, 1], [3, 1.2, 1]);
  const y = interpolate(progress, [0, 1], [-500, 0]);

  return {
    transform: `translateY(${y}px) scale(${scale})`,
    opacity: 1,
    scale,
  };
};
