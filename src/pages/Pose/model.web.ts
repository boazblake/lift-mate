import { state, addPose, drawLandmarks, resetState } from "./model.utils";
import { HolisticData, Pose } from "@/types";
import {
  HandLandmarker,
  FaceLandmarker,
  PoseLandmarker,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
// Start the web camera
export const startCameraForWeb = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: state.cameraPosition !== "rear" ? "environment" : "user",
        width: 1280,
        height: 720,
        frameRate: { ideal: 30, max: 30 },
      },
    });
    if (state.videoElement) {
      state.videoElement.srcObject = stream;
      await state.videoElement.play();
    }
  } catch (error) {
    console.error("Error accessing the camera on web:", error);
  }
};

// Render loop for web
export const renderLoopForWeb = async () => {
  console.log("renderLoopForWeb", state);

  if (
    !state.isRendering() ||
    !state.poseLandmarker ||
    !state.canvasElement ||
    !state.videoElement
  ) {
    resetState();
    return;
  }

  const ctx = state.canvasElement.getContext("2d");

  const processFrame = async () => {
    if (ctx && state.canvasElement && state.videoElement) {
      ctx.clearRect(
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );

      // Flip and draw the video feed on the canvas
      ctx.save();
      if (state.cameraPosition == "front") {
        ctx.scale(-1, 1);
        ctx.translate(-state.canvasElement.width, 0);
      }
      ctx.drawImage(
        state.videoElement,
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );
      ctx.restore();
    }

    // Process Holistic detection
    try {
      await state.poseLandmarker.send({ image: state.videoElement });
    } catch (error) {
      console.error("Error during holistic detection:", error);
      resetState();
      return;
    }

    requestAnimationFrame(processFrame); // Continue loop
  };

  requestAnimationFrame(processFrame);
};

// Stop the web camera
export const stopCameraForWeb = async () => {
  if (state.videoElement?.srcObject) {
    (state.videoElement.srcObject as MediaStream)
      .getTracks()
      .forEach((track) => track.stop());
    state.videoElement.srcObject = null;
  }
};
