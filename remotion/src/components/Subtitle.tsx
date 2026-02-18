import React from "react";

export interface SubtitleProps {
  text: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
}

export const Subtitle: React.FC<SubtitleProps> = ({
  text,
  fontSize = 70,
  color = "#FFFFFF",
  lineHeight = 1.2,
  textAlign = "center",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        padding: "40px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: textAlign === "center" ? "center" : textAlign === "left" ? "flex-start" : "flex-end",
      }}
    >
      {text.split("\n").map((line, index) => (
        <div
          key={index}
          style={{
            fontSize: `${fontSize}px`,
            color,
            lineHeight: `${lineHeight}`,
            fontWeight: 600,
            whiteSpace: "pre-wrap",
            marginBottom: index < text.split("\n").length - 1 ? `${fontSize * (lineHeight - 1)}px` : 0,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};
