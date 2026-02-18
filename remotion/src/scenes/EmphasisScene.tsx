import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { Subtitle } from "../components/Subtitle";
import { Xiaomo, XiaomoPose } from "../components/Xiaomo";
import { fadeAnimation } from "../animations/fade";

export interface EmphasisSceneProps {
  text: string;
  xiaomo?: XiaomoPose;
}

export const EmphasisScene: React.FC<EmphasisSceneProps> = ({
  text,
  xiaomo = "think",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const animation = fadeAnimation(frame, durationInFrames, 15, 15);

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
          opacity: animation.opacity,
          transform: animation.transform,
        }}
      >
        <Subtitle
          text={text}
          fontSize={70}
          color="#FFFFFF"
          lineHeight={1.2}
          textAlign="center"
        />
      </div>
      <Xiaomo pose={xiaomo} size={400} color="#FFFFFF" />
    </div>
  );
};
