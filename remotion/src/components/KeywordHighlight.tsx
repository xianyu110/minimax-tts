import React from "react";

export type HighlightColor = "cyan" | "gold" | "red" | "white";

export interface KeywordHighlightProps {
  text: string;
  keywords?: Array<{ text: string; color: HighlightColor }>;
  fontSize?: number;
  defaultColor?: string;
  lineHeight?: number;
}

const colorMap: Record<HighlightColor, string> = {
  cyan: "#00FFFF",
  gold: "#FFD700",
  red: "#FF4444",
  white: "#FFFFFF",
};

export const KeywordHighlight: React.FC<KeywordHighlightProps> = ({
  text,
  keywords = [],
  fontSize = 70,
  defaultColor = "#FFFFFF",
  lineHeight = 1.2,
}) => {
  const { parts } = React.useMemo(() => {
    let remainingText = text;
    const parts: Array<{ text: string; color: string }> = [];

    for (const keyword of keywords) {
      const index = remainingText.indexOf(keyword.text);
      if (index !== -1) {
        if (index > 0) {
          parts.push({
            text: remainingText.slice(0, index),
            color: defaultColor,
          });
        }
        parts.push({
          text: keyword.text,
          color: colorMap[keyword.color] || defaultColor,
        });
        remainingText = remainingText.slice(index + keyword.text.length);
      }
    }

    if (remainingText) {
      parts.push({ text: remainingText, color: defaultColor });
    }

    return { parts };
  }, [text, keywords, defaultColor]);

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
        alignItems: "center",
      }}
    >
      {parts.map((part, index) => (
        <span
          key={index}
          style={{
            fontSize: `${fontSize}px`,
            color: part.color,
            lineHeight: `${lineHeight}`,
            fontWeight: 600,
          }}
        >
          {part.text}
        </span>
      ))}
    </div>
  );
};
