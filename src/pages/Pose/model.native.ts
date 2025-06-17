import { CameraPreview, CameraPreviewOptions } from "@capacitor-community/camera-preview";
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
    console.log("Starting camera for mobile...");

    // Stop any existing camera preview
    await CameraPreview.stop().catch((error) => {
      console.warn("No active camera to stop or error stopping camera:", error);
    });

    // Start the new camera preview
    await CameraPreview.start(cameraPreviewOptions).catch((error) => {
      console.error("Error starting CameraPreview:", error);
      throw new Error("Failed to start camera.");
    });

    console.log("Camera started successfully.");
  } catch (error) {
    console.error("Camera initialization failed:", error);
    resetState(); // Reset the state on error
  }
};

// Flip the mobile camera
export const flipCameraForMobile = async () => {
  try {
    console.log("Flipping the camera...");

    // Stop the render loop and Holistic processing
    state.isRendering(false);
    if (state.holistic) {
      await state.holistic.close(); // Close Holistic instance to release resources
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

export const renderLoopForMobile = async (
  ctx: CanvasRenderingContext2D | null
) => {
  if (!ctx) {
    console.error("Canvas context not available in render loop.");
    return;
  }

  const processFrame = async () => {
    if (!state.isRendering()) {
      console.log("Rendering paused. Skipping frame.");
      requestAnimationFrame(processFrame); // Continue loop to wait for resume
      return;
    }

    if (!state.holistic || !state.canvasElement) {
      console.warn("Holistic instance not ready. Skipping frame.");
      requestAnimationFrame(processFrame); // Continue loop
      return;
    }

    try {
      // Capture frame from CameraPreview
      const frame = await CameraPreview.captureSample({ quality: 100 });
      const image = await base64ToImage(frame.value);

      // Clear and draw video feed onto the canvas
      ctx.clearRect(
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );

      ctx.save();
      // if (state.cameraPosition === "front") {
      //   ctx.scale(-1, 1);
      //   ctx.translate(-state.canvasElement.width, 0);
      // }
      ctx.drawImage(
        image,
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );
      ctx.restore();

      // Send the captured frame to Holistic for processing
      try {
        await state.holistic.send({ image });
      } catch (processingError) {
        console.error("Error during Holistic processing:", processingError);
      }
    } catch (error) {
      console.error("Error rendering frame:", error);
    }

    requestAnimationFrame(processFrame); // Continue the rendering loop
  };

  requestAnimationFrame(processFrame); // Start the rendering loop
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
