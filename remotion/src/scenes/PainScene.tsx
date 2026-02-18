import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { KeywordHighlight, HighlightColor } from "../components/KeywordHighlight";
import { Xiaomo, XiaomoPose } from "../components/Xiaomo";
import { slamAnimation } from "../animations/slam";

export interface PainSceneProps {
  title: string;
  subtitle: string;
  number?: string;
  highlight?: string;
  highlightColor?: HighlightColor;
  xiaomo?: XiaomoPose;
}

export const PainScene: React.FC<PainSceneProps> = ({
  title,
  subtitle,
  number,
  highlight,
  highlightColor = "red",
  xiaomo = "point",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const animation = slamAnimation(frame);

  const keywords = highlight
    ? [{ text: highlight, color: highlightColor }]
    : [];

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden" }}>
      <Background />

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: "70px",
            color: "#FFFFFF",
            fontWeight: 600,
            marginBottom: "30px",
            opacity: animation.opacity,
          }}
        >
          {title}
        </div>

        {/* Number highlight with slam animation */}
        {number && (
          <div
            style={{
              fontSize: "100px",
              color: "#FF4444",
              fontWeight: 700,
              marginBottom: "30px",
              transform: animation.transform,
              opacity: animation.opacity,
            }}
          >
            {number}
          </div>
        )}

        {/* Subtitle with keyword highlight */}
        <div
          style={{
            width: "100%",
            transform: `scale(${animation.scale})`,
            opacity: animation.opacity,
          }}
        >
          <KeywordHighlight
            text={subtitle}
            keywords={keywords}
            fontSize={55}
            defaultColor="#FFFFFF"
            lineHeight={1.3}
          />
        </div>
      </div>

      <Xiaomo pose={xiaomo} size={400} color="#FFFFFF" />
    </div>
  );
};
