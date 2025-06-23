import { Capacitor } from "@capacitor/core";
import { toastController } from "@ionic/core";
import { useStore, saveRecording } from "./model.utils";
import { initMediaPose } from "./model.pose";
import { StateTransitions } from "@types";
import { createLogger, transports, format } from "winston";

const BrowserConsoleTransport = new transports.Console({
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.printf(({ timestamp, level, message }) => {
      console[level === "error" ? "error" : level](
        `[${timestamp}] ${level}: ${message}`
      );
      return message;
    })
  ),
});

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    Capacitor.getPlatform() === "web"
      ? BrowserConsoleTransport
      : new transports.Console(),
  ],
});

const platformModules = {
  web: () => import("./model.web"),
  native: () => import("./model.native"),
};

export const handleStateTransition = async <T extends keyof StateTransitions>(
  action: () => Promise<void>,
  {
    onStart,
    onSuccess,
    onError,
  }: {
    onStart?: keyof StateTransitions[T];
    onSuccess?: () => void;
    onError?: () => void;
  }
) => {
  const { fsm } = useStore.getState();
  if (onStart && !fsm.transition(onStart)) return;

  try {
    await action();
    onSuccess?.();
  } catch (error) {
    logger.error("Error during state transition:", error);
    onError?.();
  }
};

export const setCameraHandler = async (position: "front" | "rear") => {
  const { cameraPosition, holistic, set } = useStore.getState();
  if (cameraPosition === position) return;

  await handleStateTransition<"Streaming">(
    async () => {
      const toast = await toastController.create({
        message: "Switching camera...",
        duration: 2000,
      });
      await toast.present();
      set({ isRendering: false, cameraPosition: position });

      if (holistic) {
        await holistic.close();
        set({ holistic: null });
      }

      const platform = Capacitor.getPlatform();
      const { startCameraForWeb, startCameraForMobile } = await platformModules[
        platform === "web" ? "web" : "native"
      ]();
      await (platform === "web" ? startCameraForWeb : startCameraForMobile)();

      await initMediaPose();
      set({ isRendering: true });
    },
    {
      onStart: "switchCamera",
      onSuccess: () => {
        useStore.getState().fsm.transition("completeSwitch");
      },
      onError: () => {
        useStore.getState().fsm.transition("stop");
      },
    }
  );
};

export const startDetection = async () => {
  const { fsm, videoElement, canvasElement, set } = useStore.getState();
  if (fsm.state !== "Idle") return;

  await handleStateTransition<"Idle">(
    async () => {
      set({ isLoading: true });
      const platform = Capacitor.getPlatform();
      const {
        startCameraForWeb,
        startCameraForMobile,
        renderLoopForWeb,
        renderLoopForMobile,
      } = await platformModules[platform === "web" ? "web" : "native"]();
      await (platform === "web" ? startCameraForWeb : startCameraForMobile)();
      await initMediaPose();

      const ctx = canvasElement?.getContext("2d");
      if (ctx) {
        platform === "web" ? renderLoopForWeb() : renderLoopForMobile(ctx);
      }
    },
    {
      onStart: "start",
      onSuccess: () => {
        fsm.transition("ready");
      },
      onError: () => {
        fsm.transition("error");
        set({ appState: "Pre", isLoading: false });
      },
    }
  );
};

export const hasMultipleCameras = () => {
  const { numberOfCameras } = useStore.getState();
  return Capacitor.getPlatform() === "web" ? numberOfCameras > 1 : true;
};

export const calculateNumberOfCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    useStore.getState().set({ numberOfCameras: videoInputDevices.length });
    logger.info("Number of cameras detected:", videoInputDevices.length);
  } catch (error) {
    logger.error("Error enumerating devices:", error);
    useStore.getState().set({ numberOfCameras: 0 });
  }
};

export const stopRecording = async () => {
  const shouldSave = window.confirm("Do you want to save the recording?");
  if (shouldSave) {
    await saveRecording();
  }
};

export const stopDetection = async () => {
  const { appState, set } = useStore.getState();
  if (appState === "Pre") return;

  set({ isRendering: false });
  try {
    const platform = Capacitor.getPlatform();
    const { stopCameraForWeb, stopCameraForMobile } = await platformModules[
      platform === "web" ? "web" : "native"
    ]();
    await (platform === "web" ? stopCameraForWeb : stopCameraForMobile)();
    set({ appState: "Pre" });
  } catch (error) {
    logger.error("Error during stopDetection:", error);
  }
};
