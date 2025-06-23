import {
  CameraPreview,
  CameraPreviewOptions,
} from "@capacitor-community/camera-preview";
import { useStore } from "@pages/Pose/model.utils";
import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import adapter from "webrtc-adapter"; // Ensure WebRTC compatibility

const logger = {
  info: (msg: string) =>
    console.log(
      JSON.stringify({
        level: "info",
        message: msg,
        timestamp: new Date().toISOString(),
      })
    ),
  warn: (msg: string) =>
    console.warn(
      JSON.stringify({
        level: "warn",
        message: msg,
        timestamp: new Date().toISOString(),
      })
    ),
  error: (msg: string) =>
    console.error(
      JSON.stringify({
        level: "error",
        message: msg,
        timestamp: new Date().toISOString(),
      })
    ),
  debug: (msg: string) =>
    console.debug(
      JSON.stringify({
        level: "debug",
        message: msg,
        timestamp: new Date().toISOString(),
      })
    ),
};

export const startCameraForMobile = async () => {
  const { canvasElement, cameraPosition, videoElement, set } =
    useStore.getState();
  const cameraPreviewOptions: CameraPreviewOptions = {
    position: cameraPosition,
    width: canvasElement?.width || 1280,
    height: canvasElement?.height || 720,
    parent: "video-feed",
    toBack: true,
    disableAudio: true,
    enableHighResolution: true,
    rotateWhenOrientationChanged: true,
  };

  try {
    logger.info("Starting camera for mobile...");
    set({ isLoading: true });

    const permissionStatus = await Camera.checkPermissions();
    logger.info(
      "Camera permission status: " + JSON.stringify(permissionStatus)
    );
    if (permissionStatus.camera !== "granted") {
      const result = await Camera.requestPermissions({
        permissions: ["camera"],
      });
      if (result.camera !== "granted") {
        throw new Error("Camera permission denied.");
      }
    }

    if (videoElement) {
      try {
        await startWebRTCFallback();
        logger.info("WebRTC started successfully, using videoElement.");
        return;
      } catch (error) {
        logger.warn(
          "WebRTC fallback failed, trying CameraPreview: " +
            (error as Error).message
        );
      }
    }

    await CameraPreview.stop().catch((error) => {
      logger.warn("No active camera to stop: " + (error as Error).message);
    });
    await CameraPreview.start(cameraPreviewOptions);
    logger.info("CameraPreview started successfully.");
    set({ appState: "Streaming" });
  } catch (error) {
    logger.error("Camera initialization failed: " + (error as Error).message);
    set({ appState: "Pre", isLoading: false });
    throw new Error("Failed to start camera.");
  } finally {
    set({ isLoading: false });
  }
};

const startWebRTCFallback = async () => {
  const { cameraPosition, videoElement, set } = useStore.getState();
  if (!videoElement) {
    throw new Error("No video element available for WebRTC fallback.");
  }

  logger.info(
    "WebRTC environment: " +
      JSON.stringify({
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        navigator: !!navigator,
        mediaDevices: !!navigator?.mediaDevices,
        getUserMedia: !!navigator?.mediaDevices?.getUserMedia,
        adapter: adapter?.browserDetails || "No adapter",
      })
  );

  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    throw new Error("HTTPS or localhost required for WebRTC.");
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("WebRTC not supported in this environment.");
  }

  const facingMode = cameraPosition === "front" ? "user" : "environment";
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: 1280,
      height: 720,
      frameRate: { ideal: 30, max: 30 },
    },
  });

  if (videoElement.srcObject) {
    (videoElement.srcObject as MediaStream)
      .getTracks()
      .forEach((track) => track.stop());
  }
  videoElement.srcObject = stream;
  await videoElement.play();
  logger.info("WebRTC fallback successful.");
  set({ appState: "Streaming" });
};

export const flipCameraForMobile = async () => {
  const { set, holistic, canvasElement } = useStore.getState();
  try {
    logger.info("Flipping the camera...");
    set({ isRendering: false });

    if (holistic) {
      await holistic.close();
      logger.info("Holistic processing paused.");
    }

    await CameraPreview.stop();
    logger.info("Camera preview stopped.");
    await CameraPreview.flip();
    logger.info("Camera flipped successfully.");

    await startCameraForMobile();
    logger.info("Camera preview restarted.");

    set({ isRendering: true });
    await renderLoopForMobile(canvasElement?.getContext("2d") || null);
    logger.info("Render loop resumed.");
  } catch (error) {
    logger.error("Error flipping the camera: " + (error as Error).message);
    set({ isRendering: false });
  }
};

export const renderLoopForMobile = async (
  ctx: CanvasRenderingContext2D | null
) => {
  if (!ctx) {
    logger.error("Canvas context not available in render loop.");
    return;
  }

  const { holistic, canvasElement, isRendering, cameraPosition, videoElement } =
    useStore.getState();
  if (!canvasElement || !isRendering) {
    logger.warn(
      "Rendering loop skipped. Missing elements or rendering disabled."
    );
    return;
  }

  if (!videoElement || !videoElement.srcObject || !holistic) {
    logger.warn(
      "No videoElement or holistic available. Displaying CameraPreview feed only."
    );
    // return;
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

    try {
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

      await holistic.send({ image: videoElement });
      logger.debug("Holistic processed frame successfully.");
    } catch (error) {
      logger.error("Error rendering frame: " + (error as Error).message);
    }

    requestAnimationFrame(processFrame);
  };

  requestAnimationFrame(processFrame);
};

export const stopCameraForMobile = async () => {
  try {
    await CameraPreview.stop();
    logger.info("Mobile camera stopped.");
    const { videoElement } = useStore.getState();
    if (videoElement?.srcObject) {
      (videoElement.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoElement.srcObject = null;
    }
  } catch (error) {
    logger.error("Error stopping mobile camera: " + (error as Error).message);
  }
};
