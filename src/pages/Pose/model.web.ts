import { state, addPose, drawLandmarks } from "./model.utils";
import { Pose } from "./types";

// Start the web camera
export const startCameraForWeb = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: { ideal: 30, max: 30 } },
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
    !state.isRendering ||
    !state.poseLandmarker ||
    !state.canvasElement ||
    !state.videoElement
  )
    return;

  const ctx = state.canvasElement.getContext("2d");
  const processFrame = async () => {
    if (ctx && state.canvasElement && state.videoElement) {
      ctx.clearRect(
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );
      ctx.drawImage(
        state.videoElement,
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );
    }

    const videoTime = performance.now() / 1000;
    const results = await state.poseLandmarker.detectForVideo(
      state.videoElement,
      videoTime
    );
    if (results?.landmarks?.length && ctx) {
      state.isLoading(false);
      results.landmarks.forEach((pose: Pose) => addPose(pose));
      drawLandmarks(ctx, results.landmarks);
    }
    requestAnimationFrame(processFrame);
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
