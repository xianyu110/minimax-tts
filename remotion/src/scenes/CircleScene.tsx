import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { Subtitle } from "../components/Subtitle";
import { Xiaomo, XiaomoPose } from "../components/Xiaomo";
import { drawAnimation } from "../animations/draw";

export interface CircleSceneProps {
  text: string;
  circleTarget: string;
  xiaomo?: XiaomoPose;
}

export const CircleScene: React.FC<CircleSceneProps> = ({
  text,
  circleTarget,
  xiaomo = "circle",
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const animation = drawAnimation(frame, 600);

  // Calculate circle position based on circleTarget
  // This is simplified - in production, calculate position based on target
  const circleX = 540;
  const circleY = 600;
  const circleRadius = 150;

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden" }}>
      <Background />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Subtitle
          text={text}
          fontSize={60}
          color="#FFFFFF"
          lineHeight={1.2}
          textAlign="center"
        />
      </div>

      {/* Circle highlight animation */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <circle
          cx={circleX}
          cy={circleY}
          r={circleRadius}
          fill="none"
          stroke="#00FFFF"
          strokeWidth={8}
          strokeDasharray={animation.strokeDasharray}
          opacity={animation.opacity}
        />
      </svg>

      <Xiaomo pose={xiaomo} size={400} color="#FFFFFF" />
    </div>
  );
};
