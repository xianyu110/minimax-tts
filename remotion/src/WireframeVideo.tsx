import React from "react";
import { useCurrentFrame, useVideoConfig, Audio } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { PainScene } from "./scenes/PainScene";
import { EmphasisScene } from "./scenes/EmphasisScene";
import { CircleScene } from "./scenes/CircleScene";
import { Background } from "./components/Background";
import type { SceneData } from "./scenes-data";

export interface WireframeVideoProps {
  scenes: SceneData[];
  audioUrl?: string;
}

export const WireframeVideo: React.FC<WireframeVideoProps> = ({ scenes, audioUrl }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Calculate current time in seconds
  const currentTime = frame / fps;

  // Find active scene
  const activeScene = React.useMemo(() => {
    return scenes.find(scene => currentTime >= scene.start && currentTime < scene.end);
  }, [currentTime, scenes]);

  // Calculate local frame for scene
  const localFrame = React.useMemo(() => {
    if (!activeScene) return 0;
    return frame - Math.floor(activeScene.start * fps);
  }, [frame, activeScene, fps]);

  // Render the active scene
  const renderScene = () => {
    if (!activeScene) return <Background />;

    switch (activeScene.type) {
      case "title":
        return (
          <TitleScene
            title={activeScene.title}
            xiaomo={activeScene.xiaomo}
          />
        );

      case "pain":
        return (
          <PainScene
            title={activeScene.title}
            subtitle={activeScene.subtitle}
            number={activeScene.number}
            highlight={activeScene.highlight}
            highlightColor={activeScene.highlightColor}
            xiaomo={activeScene.xiaomo}
          />
        );

      case "emphasis":
        return (
          <EmphasisScene
            text={activeScene.text}
            xiaomo={activeScene.xiaomo}
          />
        );

      case "circle":
        return (
          <CircleScene
            text={activeScene.text}
            circleTarget={activeScene.circleTarget}
            xiaomo={activeScene.xiaomo}
          />
        );

      default:
        return <Background />;
    }
  };

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", backgroundColor: "#0A0A0F" }}>
      {renderScene()}

      {/* Audio playback - this would be the TTS generated audio */}
      {audioUrl && (
        <Audio src={audioUrl} />
      )}
    </div>
  );
};
