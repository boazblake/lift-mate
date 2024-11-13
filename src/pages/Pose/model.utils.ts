import Stream from "mithril-stream";
import { Pose, Exercise } from "./types";
import {
  PoseLandmarker,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export const resetState = () => {
  state.recordedFrames([]);
  state.appState("Pre");
  state.videoElement = null;
  state.canvasElement = null;
  state.poseLandmarker = null;
  state.exercise = null;
  state.cameraPosition = "front";
  state.isRendering(false);
  state.isLoading(false);
};
// Shared state
export const state = {
  recordedFrames: Stream([]) as Stream<Array<any>>,
  appState: Stream("Pre" as "Pre" | "Streaming"),
  videoElement: null as HTMLVideoElement | null,
  canvasElement: null as HTMLCanvasElement | null,
  poseLandmarker: null as PoseLandmarker | null,
  exercise: null as Exercise | null,
  isRendering: Stream(false) as Stream<boolean>,
  isLoading: Stream(false) as Stream<boolean>,
  cameraPosition: "front",
};

// Add a pose to recorded frames
export const addPose = (pose: Pose) => {
  const currentTime = performance.now() / 1000;
  state.recordedFrames([
    ...state.recordedFrames(),
    { timestamp: currentTime, poses: [pose] },
  ]);
};

// Draw landmarks on the canvas
export const drawLandmarks = (ctx: CanvasRenderingContext2D, poses: Pose[]) => {
  const drawingUtils = new DrawingUtils(ctx);
  poses.forEach((pose) => {
    drawingUtils.drawLandmarks(pose, { color: "red", radius: 5 });
    drawingUtils.drawConnectors(
      pose,
      convertConnections(window.POSE_CONNECTIONS),
      {
        color: "white",
        lineWidth: 2,
      }
    );
  });
};
export const setExerciseHandler = (exercise: Exercise | null) => {
  state.exercise = exercise;
};
// Helper function for converting connections
export const convertConnections = (connections: [number, number][]) =>
  connections.map(([start, end]) => ({ start, end }));

export const saveRecording = async () => {
  try {
    const data = JSON.stringify(state.recordedFrames(), null, 2);
    const fileName = `pose_recording_${new Date().toISOString()}.json`;

    // Write to filesystem
    const fileUri = await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    // Share the saved file
    await Share.share({
      title: "Pose Recording",
      url: fileUri.uri,
      dialogTitle: "Share Pose Recording",
    });
    console.log("Recording saved and shared successfully:", fileUri.uri);
  } catch (error) {
    console.error("Error saving or sharing recording:", error);
  }
};
