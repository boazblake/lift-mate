import {
  CameraPreview,
  CameraPreviewOptions,
} from "@capacitor-community/camera-preview";
import { state, resetState } from "./model.utils";

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
    await CameraPreview.start(cameraPreviewOptions).catch((error) => {
      console.error("Error starting CameraPreview:", error);
      throw new Error("Failed to start camera.");
    });
    console.log("Camera started successfully.");
  } catch (error) {
    console.error("Camera initialization failed:", error);
    resetState();
  }
};

// Flip the mobile camera
export const flipCameraForMobile = async () => {
  try {
    console.log("Flipping the camera...", state);

    // Stop the render loop and Holistic processing
    state.isRendering(false);
    if (state.poseLandmarker) {
      console.log;
      await state.poseLandmarker.close(); // Close Holistic instance to release resources
      console.log("Holistic processing paused.");
    }

    // Stop the current camera preview
    await CameraPreview.stop();
    console.log("Camera preview stopped.");

    // Flip the camera
    await CameraPreview.flip();
    console.log("Camera flipped successfully.");

    // Restart the camera preview
    await startCameraForMobile();
    console.log("Camera preview restarted.");

    // Resume Holistic processing
    state.isRendering(true);
    await renderLoopForMobile(state.canvasElement?.getContext("2d") || null);
    console.log("Render loop resumed.");
  } catch (error) {
    console.error("Error flipping the camera:", error);
  }
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
        // if (state.cameraPosition == "front") {
        ctx.scale(-1, 1); // Flip horizontally
        ctx.translate(-state.canvasElement.width, 0);
        // }
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
