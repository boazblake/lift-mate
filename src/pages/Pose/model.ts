import { Capacitor } from "@capacitor/core";
import m from "mithril";
import { state, saveRecording, resetState } from "./model.utils";
import { initPoseLandmarker } from "./model.pose";

// Set camera position and flip if on mobile
export const setCameraHandler = async (position: string) => {
  state.cameraPosition = position;
  if (Capacitor.getPlatform() !== "web") {
    const { flipCameraForMobile } = await import("./model.native");
    await flipCameraForMobile();
  }
};

// Start pose detection with platform-specific camera setup
export const startDetection = async () => {
  state.isLoading(true);
  console.log("Starting detection, current app state:", state.appState());

  if (state.appState() === "Pre") {
    // Start platform-specific camera and render loop
    if (Capacitor.getPlatform() === "web") {
      const webModule = await import("./model.web");
      await webModule.startCameraForWeb();
      await initPoseLandmarker();
      state.appState("Streaming");
      state.isLoading(false);
      webModule.renderLoopForWeb();
    } else {
      const nativeModule = await import("./model.native");
      await nativeModule.startCameraForMobile();
      console.log("Camera preview started on mobile");

      // Initialize PoseLandmarker and confirm availability of canvas context
      await initPoseLandmarker();
      const ctx = state.canvasElement?.getContext("2d");
      if (!ctx) {
        console.error("Canvas context not available on mobile.");
        return;
      }

      console.log("Starting mobile render loop");
      state.appState("Streaming");
      state.isLoading(false);
      nativeModule.renderLoopForMobile(ctx);
    }
  }
};

// Stop pose detection and save recordings
export const stopDetection = async () => {
  state.isRendering(false);

  // Platform-specific camera stop
  if (Capacitor.getPlatform() === "web") {
    const webModule = await import("./model.web");
    await webModule.stopCameraForWeb();
  } else {
    const nativeModule = await import("./model.native");
    await nativeModule.stopCameraForMobile();
  }

  // Save the recording
  await saveRecording();
  resetState();
};
