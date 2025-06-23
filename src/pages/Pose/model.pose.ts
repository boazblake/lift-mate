import { HolisticData } from "@/types";
import { useStore, drawLandmarks } from "./model.utils";
import m from "mithril";
import { Capacitor } from "@capacitor/core";
import { createLogger, transports, format } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

export const initMediaPose = async () => {
  const { set, cameraPosition } = useStore.getState();
  logger.info("Initializing MediaPipe Holistic...");

  try {
    const Holistic = (window as any).Holistic;
    if (!Holistic) {
      throw new Error("MediaPipe Holistic is not loaded.");
    }

    const isAligned =
      cameraPosition === "front" && Capacitor.getPlatform() === "web";
    const holistic = new Holistic({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      flipHorizontal: isAligned,
      selfieMode: isAligned,
      modelComplexity: Capacitor.isNativePlatform() ? 0 : 1, // Lower complexity on mobile
      smoothLandmarks: true,
      enableSegmentation: false, // Disable for performance
      refineFaceLandmarks: false, // Disable for performance
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults((results: HolisticData) => {
      logger.debug("Holistic results received.");
      const { canvasElement, activeModels, isRecording, set } =
        useStore.getState();

      if (!canvasElement) {
        logger.warn("Missing canvasElement.");
        return;
      }

      set({ isLoading: false, appState: "Streaming" });
      const ctx = canvasElement.getContext("2d");
      if (ctx) {
        drawLandmarks(activeModels, ctx, results);
      }

      if (isRecording) {
        logger.info("Recording pose data.");
        set({
          recordedFrames: [
            ...useStore.getState().recordedFrames,
            {
              timestamp: performance.now() / 1000,
              poses: JSON.stringify(results),
            },
          ],
        });
      }
    });

    set({ holistic, isRendering: true });
    logger.info("Holistic initialized successfully.");
  } catch (error) {
    logger.error("Error initializing MediaPipe Holistic:", error);
    set({ isRendering: false, appState: "Pre", isLoading: false });
  }
};
