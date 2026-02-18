import { interpolate, spring } from "remotion";

export interface DrawAnimation {
  strokeDasharray: string;
  opacity: number;
}

export const drawAnimation = (
  frame: number,
  circumference: number = 1000
): DrawAnimation => {
  const progress = spring({
    frame,
    config: { damping: 20, stiffness: 80 },
  });

  const strokeLength = interpolate(progress, [0, 1], [0, circumference]);

  return {
    strokeDasharray: `${strokeLength},${circumference}`,
    opacity: 1,
  };
};
