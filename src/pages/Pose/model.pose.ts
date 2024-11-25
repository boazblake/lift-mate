// const poseLandmarker =
//   "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task";
//
// import {
//   PoseLandmarker,
//   FilesetResolver,
// } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
// import { Capacitor } from "@capacitor/core";
// import { state } from "./model.utils";
//
// export const initPoseLandmarker = async () => {
//   console.log("Initializing PoseLandmarker...");
//   try {
//     const vision = await FilesetResolver.forVisionTasks(
//       "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
//     );
//     //
//     state.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
//       baseOptions: {
//         modelAssetPath: poseLandmarker,
//         delegate: Capacitor.getPlatform() === "web" ? "GPU" : "CPU",
//       },
//       runningMode: Capacitor.getPlatform() === "web" ? "VIDEO" : "IMAGE",
//       numPoses: 2,
//     });
//     state.isRendering(true);
//     console.log("PoseLandmarker initialized successfully.");
//   } catch (error) {
//     console.error("Error initializing Pose Landmarker:", error);
//     state.isRendering(false); // Stop rendering
//     state.appState("Pre"); // Revert to Pre state on error
//   }
// };
import { HolisticData } from "@/types";
import { state, drawLandmarks } from "./model.utils";

export const initPoseLandmarker = async () => {
  console.log("Initializing MediaPipe Holistic...");

  try {
    const Holistic = (window as any).Holistic;
    if (!Holistic) {
      throw new Error(
        "MediaPipe Holistic is not loaded. Check your script tags."
      );
    }

    const holistic = new Holistic({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      selfieMode: true,
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults((results: HolisticData) => {
      if (!state.canvasElement) return;
      const ctx = state.canvasElement.getContext("2d");
      if (ctx) {
        drawLandmarks(ctx, results); // Updated to handle Holistic results
      }
    });

    state.poseLandmarker = holistic;
    console.log("Holistic Landmarker initialized successfully.");
  } catch (error) {
    console.error("Error initializing MediaPipe Holistic:", error);
    state.isRendering(false); // Stop rendering
    state.appState("Pre"); // Revert to Pre state on error
  }
};
