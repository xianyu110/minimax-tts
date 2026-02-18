import { Config } from "@remotion/cli/config";

new Config({
  codec: "h264",
  CRF: 23,
  pixelFormat: "yuv420p",
  imageFormat: "jpeg",
  quality: 90,
  audioCodec: "aac",
  audioBitrate: "192k",
  frameRate: 30,
  height: 1920,
  width: 1080,
  overwrite: true,
  enforceAudioTrack: true,
  props: {},
  env: {},
  logLevel: "info",
  port: 3000,
});
