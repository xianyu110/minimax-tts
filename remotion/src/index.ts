import React from "react";
import { Composition } from "remotion";
import { WireframeVideo } from "./WireframeVideo";
import { scenes, SceneData } from "./scenes-data";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WireframeVideo"
        component={WireframeVideo}
        durationInFrames={Math.floor((scenes[scenes.length - 1]?.end || 10) * 30)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ scenes }}
      />
    </>
  );
};

export { WireframeVideo } from "./WireframeVideo";
export type { WireframeVideoProps } from "./WireframeVideo";

export { scenes } from "./scenes-data";
export type { SceneData, SceneType, XiaomoPose, HighlightColor } from "./scenes-data";
