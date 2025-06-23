import { useStore } from "@pages/Pose/model.utils";
import { createLogger, transports, format } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

export const startCameraForWeb = async () => {
  const { cameraPosition, videoElement, set } = useStore.getState();
  try {
    logger.info(`Starting camera for web. Current position: ${cameraPosition}`);
    set({ isLoading: true });

    const facingMode = cameraPosition === "front" ? "user" : "environment";
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: 1280,
        height: 720,
        frameRate: { ideal: 30, max: 30 },
      },
    });

    if (videoElement) {
      if (videoElement.srcObject) {
        (videoElement.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
      videoElement.srcObject = stream;
      await new Promise((resolve) =>
        videoElement.addEventListener("loadedmetadata", resolve, { once: true })
      );
      await videoElement.play();

      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        throw new Error("Invalid video dimensions.");
      }
    }

    logger.info("Camera started successfully for web.");
  } catch (error) {
    logger.error("Error accessing the camera on web:", error);
    set({ appState: "Pre", isLoading: false });
  } finally {
    set({ isLoading: false });
  }
};

export const renderLoopForWeb = async () => {
  const { videoElement, canvasElement, holistic, isRendering, cameraPosition } =
    useStore.getState();
  if (!videoElement || !canvasElement || !holistic || !isRendering) {
    logger.warn(
      "Rendering loop skipped. Missing elements or rendering disabled."
    );
    return;
  }

  const ctx = canvasElement.getContext("2d");
  if (!ctx) {
    logger.error("Failed to get canvas context.");
    return;
  }

  const targetFPS = 30;
  const frameInterval = 1000 / targetFPS;
  let lastFrameTime = performance.now();

  const processFrame = async (currentTime: number) => {
    if (currentTime - lastFrameTime < frameInterval || !isRendering) {
      requestAnimationFrame(processFrame);
      return;
    }

    lastFrameTime = currentTime;

    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      ctx.save();
      if (cameraPosition === "front") {
        ctx.scale(-1, 1);
        ctx.translate(-canvasElement.width, 0);
      }
      ctx.drawImage(
        videoElement,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      ctx.restore();

      try {
        await holistic.send({ image: videoElement });
        logger.debug("Holistic processed frame successfully.");
      } catch (error) {
        logger.error("Error during holistic processing:", error);
      }
    } else {
      logger.error("Invalid video element dimensions.");
    }

    requestAnimationFrame(processFrame);
  };

  requestAnimationFrame(processFrame);
};

export const stopCameraForWeb = async () => {
  const { videoElement } = useStore.getState();
  if (videoElement?.srcObject) {
    (videoElement.srcObject as MediaStream)
      .getTracks()
      .forEach((track) => track.stop());
    videoElement.srcObject = null;
    logger.info("Web camera stopped.");
  }
};
