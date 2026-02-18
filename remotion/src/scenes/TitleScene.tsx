import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { Subtitle } from "../components/Subtitle";
import { Xiaomo, XiaomoPose } from "../components/Xiaomo";
import { glitchAnimation } from "../animations/glitch";

export interface TitleSceneProps {
  title: string;
  xiaomo?: XiaomoPose;
}

export const TitleScene: React.FC<TitleSceneProps> = ({ title, xiaomo = "peek" }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const animation = glitchAnimation(frame, 60);

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
          text={title}
          fontSize={80}
          color="#FFFFFF"
          lineHeight={1.2}
          textAlign="center"
        />
      </div>
      <Xiaomo pose={xiaomo} size={400} color="#FFFFFF" />
    </div>
  );
};
