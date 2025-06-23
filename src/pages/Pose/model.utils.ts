import m from "mithril";
import { createStore } from "zustand";
import * as R from "ramda";
import { Exercise, HolisticData, StateTransitions } from "@types";
import {
  HandLandmarker,
  FaceLandmarker,
  PoseLandmarker,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { CameraPreview } from "@capacitor-community/camera-preview";
import { createLogger, transports, format } from "winston";
import sanitizeFilename from "sanitize-filename";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const debounce = R.curry((wait: number, fn: (...args: any[]) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, wait);
  };
});

export const debouncedRedraw = debounce(16, m.redraw);

interface AppState {
  recordedFrames: Array<{ timestamp: number; poses: string }>;
  appState: "Pre" | "Streaming";
  videoElement: HTMLVideoElement | null; // Used for WebRTC; may be populated on mobile with fallback
  canvasElement: HTMLCanvasElement | null;
  holistic: any | null;
  faceLandmarker: FaceLandmarker | null;
  poseLandmarker: PoseLandmarker | null;
  handLandmarker: HandLandmarker | null;
  exercise: Exercise | null;
  isRendering: boolean;
  isLoading: boolean;
  cameraPosition: "front" | "rear";
  numberOfCameras: number;
  isRecording: boolean;
  activeModels: Record<
    "faceLandmark" | "handLandmark" | "poseLandmark",
    boolean
  >;
  holisticData:
    | HolisticData
    | {
        poseLandmarks: [];
        faceLandmarks: [];
        leftHandLandmarks: [];
        rightHandLandmarks: [];
      };
  fsm: {
    state: keyof StateTransitions;
    transitions: StateTransitions;
    transition: <T extends keyof StateTransitions>(
      event: keyof StateTransitions[T]
    ) => boolean;
  };
}

export const useStore = createStore<AppState>((set) => ({
  recordedFrames: [],
  appState: "Pre",
  videoElement: null,
  canvasElement: null,
  holistic: null,
  faceLandmarker: null,
  poseLandmarker: null,
  handLandmarker: null,
  exercise: null,
  isRendering: false,
  isLoading: false,
  cameraPosition: "front",
  numberOfCameras: 0,
  isRecording: false,
  activeModels: { faceLandmark: true, handLandmark: true, poseLandmark: true },
  holisticData: {
    poseLandmarks: [],
    faceLandmarks: [],
    leftHandLandmarks: [],
    rightHandLandmarks: [],
  },
  fsm: {
    state: "Idle",
    transitions: {
      Idle: { start: "Loading" },
      Loading: { ready: "Ready", error: "Idle" },
      Ready: { beginStreaming: "Streaming", switchCamera: "SwitchingCamera" },
      Streaming: { switchCamera: "SwitchingCamera", stop: "Stopped" },
      SwitchingCamera: { completeSwitch: "Streaming" },
      Stopped: { restart: "Idle" },
    } as StateTransitions,
    transition: function <T extends keyof StateTransitions>(
      event: keyof StateTransitions[T]
    ) {
      const currentState = this.state as T;
      const nextState = this.transitions[currentState]?.[event];
      if (nextState) {
        logger.info(`Transition: ${this.state} -> ${nextState}`);
        this.state = nextState as keyof StateTransitions;
        return true;
      }
      logger.error(
        `Invalid transition from ${this.state} with event ${String(event)}`
      );
      return false;
    },
  },
  set: (partial) =>
    set((state) => {
      const newState = { ...state, ...partial };
      debouncedRedraw();
      return newState;
    }),
}));

export const toggleModel = (
  activeModels: Record<
    "faceLandmark" | "handLandmark" | "poseLandmark",
    boolean
  >,
  modelName: "faceLandmark" | "handLandmark" | "poseLandmark"
) => {
  activeModels[modelName] = !activeModels[modelName];
  logger.info(
    `${modelName} is now ${activeModels[modelName] ? "enabled" : "disabled"}`
  );
  debouncedRedraw();
};

export const resetState = () => {
  logger.info("Resetting state");
  useStore.set({
    recordedFrames: [],
    appState: "Pre",
    videoElement: null,
    canvasElement: null,
    holistic: null,
    exercise: null,
    cameraPosition: "front",
    numberOfCameras: 0,
    isRendering: false,
    isLoading: false,
    isRecording: false,
  });

  CameraPreview.stop().catch((error) => {
    logger.warn("Error stopping camera during reset:", error);
  });
};

export const drawLandmarks = (
  activeModels: Record<string, boolean>,
  ctx: CanvasRenderingContext2D,
  results: any,
  options = {
    pose: { color: "red", radius: 5, lineWidth: 2 },
    hands: { color: "green", radius: 5, lineWidth: 2 },
    face: { color: "white", radius: 1, lineWidth: 1 },
  }
) => {
  const drawingUtils = new DrawingUtils(ctx);

  if (results.poseLandmarks && activeModels.poseLandmark) {
    drawingUtils.drawLandmarks(results.poseLandmarks, {
      color: options.pose.color,
      radius: options.pose.radius,
    });
    drawingUtils.drawConnectors(
      results.poseLandmarks,
      convertConnections(window.POSE_CONNECTIONS),
      {
        color: "white",
        lineWidth: options.pose.lineWidth,
      }
    );
  }

  if (activeModels.handLandmark) {
    if (results.leftHandLandmarks) {
      drawingUtils.drawLandmarks(results.leftHandLandmarks, {
        color: options.hands.color,
        radius: options.hands.radius,
      });
      drawingUtils.drawConnectors(
        results.leftHandLandmarks,
        convertConnections(window.HAND_CONNECTIONS),
        {
          color: "blue",
          lineWidth: options.hands.lineWidth,
        }
      );
    }
    if (results.rightHandLandmarks) {
      drawingUtils.drawLandmarks(results.rightHandLandmarks, {
        color: options.hands.color,
        radius: options.hands.radius,
      });
      drawingUtils.drawConnectors(
        results.rightHandLandmarks,
        convertConnections(window.HAND_CONNECTIONS),
        {
          color: "blue",
          lineWidth: options.hands.lineWidth,
        }
      );
    }
  }

  if (results.faceLandmarks && activeModels.faceLandmark) {
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_TESSELATION),
      {
        color: options.face.color,
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_CONTOURS),
      {
        color: "green",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_LIPS),
      {
        color: "pink",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_LEFT_EYE),
      {
        color: "cyan",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_LEFT_EYEBROW),
      {
        color: "cyan",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_LEFT_IRIS),
      {
        color: "cyan",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_RIGHT_EYEBROW),
      {
        color: "cyan",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_RIGHT_IRIS),
      {
        color: "cyan",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_RIGHT_EYE),
      {
        color: "cyan",
        lineWidth: options.face.lineWidth,
      }
    );
    drawingUtils.drawConnectors(
      results.faceLandmarks,
      convertConnections(window.FACEMESH_FACE_OVAL),
      {
        color: "white",
        lineWidth: options.face.lineWidth,
      }
    );
  }
};

export const convertConnections = (connections: [number, number][]) =>
  connections.map(([start, end]) => ({ start, end }));

export const saveRecording = async () => {
  logger.info("Saving recording...");
  try {
    const data = JSON.stringify(useStore.getState().recordedFrames, null, 2);
    const fileName = sanitizeFilename(
      `pose_recording_${new Date().toISOString()}.json`
    );

    const fileUri = await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    if (Capacitor.getPlatform() === "web") {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      logger.info("File saved for web as downloadable link.");
    } else {
      await Share.share({
        title: "Pose Recording",
        url: fileUri.uri,
        dialogTitle: "Share Pose Recording",
      });
      logger.info("Recording saved and shared successfully:", fileUri.uri);
    }
  } catch (error) {
    logger.error("Error saving or sharing recording:", error);
  }
};
