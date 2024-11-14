import { Capacitor } from "@capacitor/core";
import m from "mithril";
import { state, saveRecording, resetState } from "./model.utils";
import { initPoseLandmarker } from "./model.pose";
import { startCameraForWeb, stopCameraForWeb } from "./model.web";

// Set camera position and flip if on mobile
export const setCameraHandler = async (position: string) => {
  state.cameraPosition = position;
  if (Capacitor.getPlatform() !== "web") {
    const { flipCameraForMobile } = await import("./model.native");
    await flipCameraForMobile();
  } else {
    await stopCameraForWeb();

    await startCameraForWeb();
  }
};

// Start pose detection with platform-specific camera setup

export const startDetection = async () => {
  state.isLoading(true);
  m.redraw(); // Force view update after setting isLoading

  if (state.appState() === "Pre") {
    await calculateNumberOfCameras();
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

export const hasMultipleCameras = () =>
  Capacitor.getPlatform() === "web" ? state.numberOfCameras > 1 : true;

const calculateNumberOfCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    console.log(devices, videoInputDevices);
    // Set the number of video input devices (cameras) in state
    state.numberOfCameras = videoInputDevices.length;
  } catch (error) {
    console.error("Error enumerating devices:", error);
    state.numberOfCameras = 0; // Set to 0 if there was an error
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
    await stopCameraForWeb();
  } else {
    const nativeModule = await import("./model.native");
    await nativeModule.stopCameraForMobile();
  }

  resetState(); // Reset to initial state
  m.redraw(); // Ensure the view updates after stopping detection
};
