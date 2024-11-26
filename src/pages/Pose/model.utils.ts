import m from "mithril";
import Stream from "mithril-stream";
import { Pose, Exercise, HolisticData } from "@/types";
import {
  HandLandmarker,
  FaceLandmarker,
  PoseLandmarker,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { CameraPreview } from "@capacitor-community/camera-preview";
import { Capacitor } from "@capacitor/core";

export const toggleModel = (
  modelName: "faceLandmark" | "handLandmark" | "poseLandmark"
) => {
  state.activeModels[modelName] = !state.activeModels[modelName];
  console.log(
    `${modelName} is now ${state.activeModels[modelName].enabled ? "enabled" : "disabled"
    }`
  );
};

export const resetState = () => {
  // Clear recorded frames and reset state variables
  state.recordedFrames([]);
  state.appState("Pre");
  state.exercise = null;
  state.cameraPosition = "front";
  state.numberOfCameras = 0;
  state.isRendering(false);
  state.isLoading(false);

  // // Reset video element
  if (state.videoElement) {
    // console.log(state);
    CameraPreview.stop(); // Stop if already running
    // Stop any active media tracks if not already stopped
    if (state.videoElement.srcObject) {
      (state.videoElement.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      state.videoElement.srcObject = null; // Clear the video source
    }
    state.videoElement = null; // Nullify the reference
  }

  // Reset canvas element
  if (state.canvasElement) {
    const ctx = state.canvasElement.getContext("2d");
    if (ctx) {
      // Clear the canvas content
      ctx.clearRect(
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );
    }
    state.canvasElement = null; // Nullify the reference
  }

  // Reset poseLandmarker
  state.poseLandmarker = null;
  m.redraw();
};
// Shared state
export const state = {
  recordedFrames: Stream([]) as Stream<Array<any> | []>,
  appState: Stream("Pre" as "Pre" | "Streaming"),
  videoElement: null as HTMLVideoElement | null,
  canvasElement: null as HTMLCanvasElement | null,
  faceLandmarker: null as FaceLandmarker | null,
  poseLandmarker: null as PoseLandmarker | null,
  handLandmarker: null as HandLandmarker | null,
  exercise: null as Exercise | null,
  isRendering: Stream(false) as Stream<boolean>,
  isLoading: Stream(false) as Stream<boolean>,
  cameraPosition: "front",
  numberOfCameras: 0,
  activeModels: {
    faceLandmark: false,
    handLandmark: false,
    poseLandmark: false,
  },
  holisticData: {} as
    | HolisticData
    | {
      poseLandmarks: [];
      faceLandmarks: [];
      leftHandLandmarks: [];
      rightHandLandmarks: [];
    },
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
export const drawLandmarks = (
  ctx: CanvasRenderingContext2D,
  results: any,
  options = {
    pose: { color: "red", radius: 5, lineWidth: 2 },
    hands: { color: "green", radius: 5, lineWidth: 2 },
    face: { color: "white", radius: 1, lineWidth: 1 },
  }
) => {
  const drawingUtils = new DrawingUtils(ctx);
  // Draw Pose Landmarks

  if (results.poseLandmarks && state.activeModels.poseLandmark) {
    drawingUtils.drawLandmarks(results.poseLandmarks, {
      color: options.pose.color,
      radius: options.pose.radius,
    });
    drawingUtils.drawConnectors(
      results.poseLandmarks,
      convertConnections(window.POSE_CONNECTIONS),
      {
        color: "white",
        lineWidth: options.pose.lineWidth,
      }
    );
  }

  if (state.activeModels.handLandmark) {
    // Draw Left Hand Landmarks
    if (results.leftHandLandmarks) {
      drawingUtils.drawLandmarks(results.leftHandLandmarks, {
        color: options.hands.color,
        radius: options.hands.radius,
      });
      drawingUtils.drawConnectors(
        results.leftHandLandmarks,
        convertConnections(window.HAND_CONNECTIONS),
        {
          color: "blue",
          lineWidth: options.hands.lineWidth,
        }
      );
    }

    // Draw Right Hand Landmarks
    if (results.rightHandLandmarks) {
      drawingUtils.drawLandmarks(results.rightHandLandmarks, {
        color: options.hands.color,
        radius: options.hands.radius,
      });
      drawingUtils.drawConnectors(
        results.rightHandLandmarks,
        convertConnections(window.HAND_CONNECTIONS),
        {
          color: "blue",
          lineWidth: options.hands.lineWidth,
        }
      );
    }
  }
  // Draw Face Landmarks
  if (results.faceLandmarks && state.activeModels.faceLandmark) {
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_TESSELATION),
      {
        color: options.face.color,
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_CONTOURS),
      {
        color: "green",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_LIPS),
      { color: "pink", lineWidth: options.face.lineWidth }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_LEFT_EYE),
      { color: "cyan", lineWidth: options.face.lineWidth }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_LEFT_EYEBROW),
      { color: "cyan", lineWidth: options.face.lineWidth }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_LEFT_IRIS),
      { color: "cyan", lineWidth: options.face.lineWidth }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_RIGHT_EYEBROW),
      { color: "cyan", lineWidth: options.face.lineWidth }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_RIGHT_IRIS),
      { color: "cyan", lineWidth: options.face.lineWidth }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_RIGHT_EYE),
      { color: "cyan", lineWidth: options.face.lineWidth }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_FACE_OVAL),
      { color: "white", lineWidth: options.face.lineWidth }
    );
  }

  // Call exercise-specific processing if available
  // if (state.exercise) {
  //   if (results.poseLandmarks) {
  //     state.exercise.processLandmarks(results.poseLandmarks, ctx);
  //   }
  //   if (results.leftHandLandmarks) {
  //     state.exercise.processLandmarks(results.leftHandLandmarks, ctx);
  //   }
  //   if (results.rightHandLandmarks) {
  //     state.exercise.processLandmarks(results.rightHandLandmarks, ctx);
  //   }
  //   if (results.faceLandmarks) {
  //     state.exercise.processLandmarks(results.faceLandmarks, ctx);
  //   }
  // }
};
// export const drawLandmarks = (ctx: CanvasRenderingContext2D, poses: Pose[]) => {
//   const drawingUtils = new DrawingUtils(ctx);
//   poses.forEach((pose) => {
//     drawingUtils.drawLandmarks(pose, { color: "red", radius: 5 });
//     drawingUtils.drawConnectors(
//       pose,
//       convertConnections(window.POSE_CONNECTIONS),
//       {
//         color: "white",
//         lineWidth: 2,
//       }
//     );
//
//     if (state.exercise) {
//       state.exercise.processLandmarks(pose, ctx);
//     }
//   });
// };
export const setExerciseHandler = (exercise: Exercise | null) => {
  state.exercise = exercise;
};
// Helper function for converting connections
export const convertConnections = (connections: [number, number][]) =>
  connections.map(([start, end]) => ({ start, end }));

export const saveRecording = async () => {
  try {
    const data = JSON.stringify(
      [state.recordedFrames(), state.exercise?.meta || {}],
      null,
      2
    );
    const fileName = `pose_recording_${new Date().toISOString()}.json`;

    // Write to filesystem
    const fileUri = await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    if (Capacitor.getPlatform() === "web") {
      // If platform is web, create a downloadable link
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url); // Cleanup
      console.log("File saved for web as downloadable link");
    } else {
      // For native platforms, use the Share API
      await Share.share({
        title: "Pose Recording",
        url: fileUri.uri,
        dialogTitle: "Share Pose Recording",
      });
      console.log("Recording saved and shared successfully:", fileUri.uri);
    }
  } catch (error) {
    console.error("Error saving or sharing recording:", error);
  }
};
