import {
  PoseLandmarker,
  FilesetResolver,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import { Capacitor } from "@capacitor/core";
import { state } from "./model.utils";

export const initPoseLandmarker = async () => {
  console.log("Initializing PoseLandmarker...");
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    state.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
        delegate: Capacitor.getPlatform() === "web" ? "GPU" : "CPU",
      },
      runningMode: Capacitor.getPlatform() === "web" ? "VIDEO" : "IMAGE",
      numPoses: 2,
    });
    state.isRendering(true);
    console.log("PoseLandmarker initialized successfully.");
  } catch (error) {
    console.error("Error initializing Pose Landmarker:", error);
    state.isRendering(false); // Stop rendering
    state.appState("Pre"); // Revert to Pre state on error
  }
};
