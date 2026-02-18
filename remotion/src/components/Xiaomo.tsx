import React from "react";

export type XiaomoPose = "peek" | "sit" | "point" | "circle" | "think" | "celebrate";

export interface XiaomoProps {
  pose?: XiaomoPose;
  size?: number;
  color?: string;
}

const XiaomoSVG: React.FC<{ pose: XiaomoPose; size: number; color: string }> = ({
  pose,
  size,
  color,
}) => {
  const stroke = "currentColor";

  const renderBody = () => (
    <>
      {/* Main body outline - cat shape */}
      <path
        d="M200,400 L250,350 L300,400 L320,300 L340,200 L360,150 L380,120 L400,110 L420,120 L440,150 L460,200 L480,300 L500,400 L550,350 L600,400 L580,500 L550,600 L500,650 L450,680 L400,700 L350,680 L300,650 L250,600 L220,500 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="8"
      />
      {/* Eyes */}
      <circle cx="380" cy="280" r="15" fill={color} />
      <circle cx="460" cy="280" r="15" fill={color} />
      {/* Mouth */}
      <path d="M400,500 Q420,530 440,500" fill="none" stroke={stroke} strokeWidth="6" />
    </>
  );

  const renderPoseElements = () => {
    switch (pose) {
      case "peek":
        return (
          <>
            <path
              d="M550,300 Q600,280 650,300"
              fill="none"
              stroke={stroke}
              strokeWidth="6"
            />
            <circle cx="660" cy="290" r="10" fill={color} />
          </>
        );

      case "sit":
        return (
          <>
            <path
              d="M220,500 L200,580 L250,600 L300,580 L350,500"
              fill="none"
              stroke={stroke}
              strokeWidth="6"
            />
            <path
              d="M550,500 L580,580 L550,600 L500,580 L470,500"
              fill="none"
              stroke={stroke}
              strokeWidth="6"
            />
          </>
        );

      case "point":
        return (
          <>
            <path
              d="M600,400 L700,350 L720,370 L750,340 L770,360 L790,330"
              fill="none"
              stroke={stroke}
              strokeWidth="6"
            />
            <circle cx="800" cy="320" r="12" fill={color} />
          </>
        );

      case "circle":
        return (
          <path
            d="M600,400 Q700,300 800,350 Q900,400 850,500"
            fill="none"
            stroke={stroke}
            strokeWidth="6"
          />
        );

      case "think":
        return (
          <>
            <circle
              cx="700"
              cy="200"
              r="30"
              fill="none"
              stroke={stroke}
              strokeWidth="4"
            />
            <circle cx="680" cy="180" r="5" fill={color} />
            <circle cx="715" cy="185" r="5" fill={color} />
            <circle cx="700" cy="205" r="5" fill={color} />
          </>
        );

      case "celebrate":
        return (
          <>
            <path d="M150,350 L100,300" fill="none" stroke={stroke} strokeWidth="4" />
            <path d="M100,300 L110,280 L100,260" fill="none" stroke={stroke} strokeWidth="4" />
            <path d="M650,350 L700,300" fill="none" stroke={stroke} strokeWidth="4" />
            <path d="M700,300 L690,280 L700,260" fill="none" stroke={stroke} strokeWidth="4" />
            <path d="M400,150 L400,100" fill="none" stroke={stroke} strokeWidth="4" />
            <path d="M400,100 L380,90" fill="none" stroke={stroke} strokeWidth="4" />
            <path d="M400,100 L420,90" fill="none" stroke={stroke} strokeWidth="4" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 900 800" style={{ color }}>
      {renderBody()}
      {renderPoseElements()}
    </svg>
  );
};

export const Xiaomo: React.FC<XiaomoProps> = ({
  pose = "sit",
  size = 400,
  color = "#FFFFFF",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        right: "80px",
        bottom: "200px",
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <XiaomoSVG pose={pose} size={size} color={color} />
    </div>
  );
};
