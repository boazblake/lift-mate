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
      selfieMode: state.cameraPosition === "front",
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

      state.isRendering(true);

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
