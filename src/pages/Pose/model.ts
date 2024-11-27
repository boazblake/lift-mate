import { Capacitor } from "@capacitor/core";
import m from "mithril";
import { state, saveRecording, resetState } from "./model.utils";
import { initMediaPose } from "./model.pose";
import { StateTransitions } from "@/types";

// Set camera position and flip if on mobile
export const handleStateTransition = async <
  T extends keyof StateTransitions // Current state
>(
  action: () => Promise<void>, // Action to execute
  {
    onStart,
    onSuccess,
    onError,
  }: {
    onStart?: keyof StateTransitions[T]; // FSM transition before action
    onSuccess?: () => void; // Callback after success
    onError?: () => void; // Callback after error
  }
) => {
  // Perform initial FSM transition
  if (onStart) {
    const valid = state.fsm.transition(onStart);
    if (!valid) return; // Abort if the transition is invalid
  }

  try {
    // Execute the main action
    await action();

    // Invoke the success callback if provided
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error("Error during state transition:", error);

    // Invoke the error callback if provided
    if (onError) {
      onError();
    }
  }
};

const kickStart = async () => {
  try {
    if (Capacitor.getPlatform() === "web") {
      await calculateNumberOfCameras();
      const { startCameraForWeb } = await import("./model.web");
      await startCameraForWeb();
    } else {
      const { startCameraForMobile } = await import("./model.native");
      await startCameraForMobile();
    }

    await initMediaPose(); // Initialize MediaPipe Holistic

    if (Capacitor.getPlatform() === "web") {
      console.log("Starting web render loop.");
      const { renderLoopForWeb } = await import("./model.web");
      await renderLoopForWeb();
    } else {
      const { renderLoopForMobile } = await import("./model.native");
      const ctx = state.canvasElement?.getContext("2d");
      if (ctx) await renderLoopForMobile(ctx);
    }

    state.appState("Streaming");
    state.isRendering(true);
  } catch (error) {
    console.error("Error during startDetection:", error);
    resetState();
  } finally {
    state.isLoading(false);
    m.redraw();
  }
};

export const setCameraHandler = async (position: "front" | "rear") => {
  if (state.cameraPosition === position) return;
  await handleStateTransition<"Streaming">(
    async () => {
      state.isRendering(false);
      state.cameraPosition = position;
      if (Capacitor.getPlatform() === "web") {
        const { startCameraForWeb } = await import("./model.web");
        await startCameraForWeb();
      } else {
        const { startCameraForMobile } = await import("./model.native");
        await startCameraForMobile();
      }
      await initMediaPose();
      state.isRendering(true); // Start rendering
      // if (Capacitor.getPlatform() === "web") {
      //   const { renderLoopForWeb } = await import("./model.web");
      //   renderLoopForWeb();
      // } else {
      //   const ctx = state.canvasElement?.getContext("2d");
      //   const { renderLoopForMobile } = await import("./model.native");
      //   if (ctx) renderLoopForMobile(ctx);
      // }
    },
    {
      onStart: "switchCamera", // FSM transition
      onSuccess: () => {
        state.fsm.transition("completeSwitch"); // Transition to "Ready"
      },
      onError: () => {
        state.fsm.transition("stop"); // Transition to "Idle" on failure
      },
    }
  );
};

// Start pose detection with platform-specific camera setup
export const startDetection = async () => {
  if (state.fsm.state !== "Idle") return; // Guard invalid state

  await handleStateTransition<"Idle">(
    async () => {
      state.isLoading(true);
      if (Capacitor.getPlatform() === "web") {
        await calculateNumberOfCameras();
        const { startCameraForWeb } = await import("./model.web");
        await startCameraForWeb();
      } else {
        const { startCameraForMobile } = await import("./model.native");
        await startCameraForMobile();
      }
      await initMediaPose();

      state.isRendering(true); // Start rendering
      if (Capacitor.getPlatform() === "web") {
        const { renderLoopForWeb } = await import("./model.web");
        renderLoopForWeb();
      } else {
        const ctx = state.canvasElement?.getContext("2d");
        const { renderLoopForMobile } = await import("./model.native");
        if (ctx) renderLoopForMobile(ctx);
      }
    },
    {
      onStart: "start", // FSM transition
      onSuccess: () => {
        state.fsm.transition("ready"); // Transition to "Ready"
      },
      onError: () => {
        state.fsm.transition("error"); // Transition to "Idle" on failure
      },
    }
  );

  state.isLoading(false); // Clear loading
  m.redraw();
};

export const hasMultipleCameras = () =>
  Capacitor.getPlatform() === "web" ? state.numberOfCameras > 1 : true;

const calculateNumberOfCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    console.log(devices, videoInputDevices);
    // Set the number of video input devices (cameras) in state
    state.numberOfCameras = videoInputDevices.length;
  } catch (error) {
    console.error("Error enumerating devices:", error);
    state.numberOfCameras = 0; // Set to 0 if there was an error
  }
};

export const stopRecording = async () => {
  // Prompt the user to confirm saving
  const shouldSave = window.confirm("Do you want to save the recording?");

  if (shouldSave) {
    await saveRecording();
  }
};

// Stop pose detection and save recordings
export const stopDetection = async () => {
  if (state.appState() === "Pre") return; // Already stopped

  state.isRendering(false); // Stop rendering
  m.redraw();

  try {
    if (Capacitor.getPlatform() === "web") {
      const { stopCameraForWeb } = await import("./model.web");
      await stopCameraForWeb();
    } else {
      const { stopCameraForMobile } = await import("./model.native");
      await stopCameraForMobile();
    }

    resetState(); // Clear all states
  } catch (error) {
    console.error("Error during stopDetection:", error);
  } finally {
    state.appState("Pre"); // Set to initial state
    m.redraw();
  }
};
