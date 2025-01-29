import { HolisticData } from "@/types";
import { state, drawLandmarks, addPose } from "./model.utils";
import m from "mithril";
import { Capacitor } from "@capacitor/core";
export const initMediaPose = async () => {
  console.log("Initializing MediaPipe Holistic...");

  try {
    const Holistic = (window as any).Holistic;
    if (!Holistic) {
      throw new Error(
        "MediaPipe Holistic is not loaded. Check your script tags."
      );
    }
    const isAligned =
      state.cameraPosition === "front" && Capacitor.getPlatform() === "web";
    const holistic = new Holistic({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });
    // console.log("Holistic...", state.cameraPosition, Capacitor.getPlatform());
    holistic.setOptions({
      flipHorizontal: isAligned,
      selfieMode: isAligned,
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    state.isRendering(true);
    holistic.onResults((results: HolisticData) => {
      console.log("holistic results");

      if (!state.canvasElement) {
        console.warn("missing canvasElement");
        return;
      }

      state.isLoading(false);
      state.appState("Streaming");

      m.redraw();
      const ctx = state.canvasElement.getContext("2d");
      if (ctx) {
        drawLandmarks(state.activeModels, ctx, results); // Updated to handle Holistic results
      }
      if (state.isRecording()) {
        console.log("isrecording");
        addPose(results);
      }
      m.redraw();
    });

    state.holistic = holistic;
    console.log("Holistic Landmarker initialized successfully.");
  } catch (error) {
    console.error("Error initializing MediaPipe Holistic:", error);
    state.isRendering(false); // Stop rendering
    state.appState("Pre"); // Revert to Pre state on error
  }
};
