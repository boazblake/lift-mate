import {
  CameraPreview,
  CameraPreviewOptions,
} from "@capacitor-community/camera-preview";
import { state, addPose, drawLandmarks, resetState } from "./model.utils";
import { Pose } from "@/types";

// Start the mobile camera
export const startCameraForMobile = async () => {
  const cameraPreviewOptions: CameraPreviewOptions = {
    position: state.cameraPosition,
    width: state.canvasElement?.width || 1280,
    height: state.canvasElement?.height || 720,
    parent: "video-feed",
    toBack: true,
    disableAudio: true,
    enableHighResolution: true,
    rotateWhenOrientationChanged: true,
  };
  try {
    await CameraPreview.stop(); // Stop if already running
  } catch (error) {
    console.warn("CameraPreview was not running or failed to stop:", error);
  }
  await CameraPreview.start(cameraPreviewOptions);
};

// Flip the mobile camera
export const flipCameraForMobile = async () => {
  await CameraPreview.flip();
};

// Render loop for mobile
export const renderLoopForMobile = async (
  ctx: CanvasRenderingContext2D | null
) => {
  if (!ctx) {
    console.error("Canvas context not available in render loop.");
    resetState();
    return;
  }

  const processFrame = async () => {
    if (!state.isRendering() || !state.poseLandmarker) {
      console.log(
        "Stopping mobile render loop - rendering stopped or poseLandmarker not available."
      );
      resetState();
      return;
    }

    try {
      // Capture frame from CameraPreview
      let frame;
      try {
        frame = await CameraPreview.captureSample({ quality: 85 });
      } catch (captureError) {
        console.error(
          "Error capturing frame from CameraPreview:",
          captureError
        );
        resetState();
        return;
      }

      // Convert base64 to HTMLImageElement
      let image;
      try {
        image = await base64ToImage(frame.value);
      } catch (imageError) {
        console.error("Error converting base64 to image:", imageError);
        resetState();
        return;
      }

      // Flip and draw the captured image onto the canvas
      if (ctx && state.canvasElement && image) {
        ctx.clearRect(
          0,
          0,
          state.canvasElement.width,
          state.canvasElement.height
        );

        ctx.save();
        if (state.cameraPosition == "front") {
          ctx.scale(-1, 1); // Flip horizontally
          ctx.translate(-state.canvasElement.width, 0);
        }
        ctx.drawImage(
          image,
          0,
          0,
          state.canvasElement.width,
          state.canvasElement.height
        );
        ctx.restore();
      }

      // Run Holistic detection on the captured image
      try {
        await state.poseLandmarker.send({ image });
      } catch (detectionError) {
        console.error("Error during holistic detection:", detectionError);
        resetState();
        return;
      }

      requestAnimationFrame(processFrame); // Continue loop if no errors
    } catch (generalError) {
      console.error("Unexpected error in mobile render loop:", generalError);
      resetState();
    }
  };

  requestAnimationFrame(processFrame);
};

// Convert base64 to HTMLImageElement
const base64ToImage = (base64: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = "data:image/jpeg;base64," + base64;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });

// Stop the mobile camera
export const stopCameraForMobile = async () => {
  await CameraPreview.stop();
};
