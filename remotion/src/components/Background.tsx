import React from "react";

export interface BackgroundProps {
  color?: string;
}

export const Background: React.FC<BackgroundProps> = ({
  color = "#0A0A0F"
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: color,
        width: "100%",
        height: "100%",
      }}
    />
  );
};
