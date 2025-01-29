import { state, resetState } from "./model.utils";

export const startCameraForWeb = async () => {
  try {
    console.log(
      `Starting camera for web. Current position: ${state.cameraPosition}`
    );

    const facingMode =
      state.cameraPosition === "front" ? "user" : "environment";
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: 1280,
        height: 720,
        frameRate: { ideal: 30, max: 30 },
      },
    });

    if (state.videoElement) {
      // Stop any existing video stream
      if (state.videoElement.srcObject) {
        const oldStream = state.videoElement.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
      }

      // Assign the new stream and wait for metadata to load
      state.videoElement.srcObject = stream;
      await new Promise((resolve) =>
        state.videoElement?.addEventListener("loadedmetadata", resolve, {
          once: true,
        })
      );
      await state.videoElement.play();

      // Validate video dimensions
      if (
        state.videoElement.videoWidth === 0 ||
        state.videoElement.videoHeight === 0
      ) {
        throw new Error(
          "Invalid video dimensions. Camera initialization failed."
        );
      }
    }

    console.log("Camera started successfully for web.");
  } catch (error) {
    console.error("Error accessing the camera on web:", error);
    resetState();
  }
};

// Render loop for web
export const renderLoopForWeb = async () => {
  if (
    // !state.isRendering() ||
    !state.holistic ||
    !state.videoElement ||
    !state.canvasElement
  ) {
    console.warn(
      "Rendering loop skipped. Missing elements or rendering disabled."
    );
    return;
  }

  const ctx = state.canvasElement.getContext("2d");
  if (!ctx) {
    console.error("Failed to get canvas context.");
    return;
  }

  const processFrame = async () => {
    console.log("processing frame");

    if (
      state.canvasElement &&
      state.videoElement &&
      state.videoElement.videoWidth > 0 &&
      state.videoElement.videoHeight > 0
    ) {
      // Clear and validate canvas
      ctx.clearRect(
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );
      if (state.canvasElement.width === 0 || state.canvasElement.height === 0) {
        console.error("Invalid canvas dimensions.");
        return;
      }

      // Draw video feed
      if (
        state.videoElement &&
        state.videoElement.videoWidth > 0 &&
        state.videoElement.videoHeight > 0
      ) {
        ctx.save();
        if (state.cameraPosition === "front") {
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

        if (
          state.isRendering() &&
          state.videoElement &&
          state.videoElement.videoWidth > 0 &&
          state.videoElement.videoHeight > 0
        ) {
          // Process Holistic detection
          try {
            await state.holistic.send({ image: state.videoElement });
            console.log("Holistic processed frame successfully.");
          } catch (error) {
            console.error("Error during holistic processing:", error);
          }
        }
      } else {
        console.error(
          "Invalid video element dimensions.",
          state.videoElement,
          state.videoElement.width,
          state.videoElement.height
        );
      }
    }
    requestAnimationFrame(processFrame);
  };

  processFrame();
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
