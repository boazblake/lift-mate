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
  m.redraw(); // Force view update after setting isLoading

  if (state.appState() === "Pre") {
    if (Capacitor.getPlatform() === "web") {
      const webModule = await import("./model.web");
      await webModule.startCameraForWeb();
      await initPoseLandmarker();
      state.isLoading(false);
      state.isRendering(true);
      state.appState("Streaming");
      m.redraw(); // Ensure view is updated after state changes
      webModule.renderLoopForWeb();
    } else {
      const nativeModule = await import("./model.native");
      await nativeModule.startCameraForMobile();
      await initPoseLandmarker();
      state.isLoading(false);
      state.isRendering(true);
      state.appState("Streaming");
      m.redraw(); // Ensure view is updated after state changes
      const ctx = state.canvasElement?.getContext("2d");
      if (ctx) nativeModule.renderLoopForMobile(ctx);
    }
  }
};

// Stop pose detection and save recordings
export const stopDetection = async () => {
  state.isRendering(false);
  m.redraw(); // Update the view to stop rendering

  // Prompt the user to confirm saving
  const shouldSave = window.confirm("Do you want to save the recording?");

  if (shouldSave) {
    await saveRecording();
  }

  // Platform-specific camera stop
  if (Capacitor.getPlatform() === "web") {
    const webModule = await import("./model.web");
    await webModule.stopCameraForWeb();
  } else {
    const nativeModule = await import("./model.native");
    await nativeModule.stopCameraForMobile();
  }

  resetState(); // Reset to initial state
  m.redraw(); // Ensure the view updates after stopping detection
};
