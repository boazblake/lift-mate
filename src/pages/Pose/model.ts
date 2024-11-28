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

export const fsmTransition = <T extends keyof StateTransitions>(
  currentState: T,
  event: keyof StateTransitions[T],
  transitions: StateTransitions
): keyof StateTransitions | null => {
  // Ensure transitions for the current state exist
  const currentTransitions = transitions[currentState];
  if (!currentTransitions) {
    console.error(`No transitions defined for state: ${String(currentState)}`);
    return null;
  }

  // Ensure the event exists in the current state's transitions
  const nextState = currentTransitions[event];
  if (nextState) {
    console.log(`Transition: ${String(currentState)} -> ${String(nextState)}`);
    return nextState as keyof StateTransitions; // Explicitly cast to the correct type
  } else {
    console.error(
      `Invalid transition from state: ${String(
        currentState
      )} with event: ${String(event)}`
    );
    return null;
  }
};

export const setCameraHandler = async (position: "front" | "rear") => {
  if (state.cameraPosition === position) return; // No need to switch

  await handleStateTransition<"Streaming">(
    async () => {
      // Pause rendering
      state.isRendering(false);
      state.cameraPosition = position;

      // Close the current Holistic instance
      if (state.holistic) {
        await state.holistic.close();
        state.holistic = null;
      }

      // Stop the current camera and start the new one
      if (Capacitor.getPlatform() === "web") {
        const { startCameraForWeb } = await import("./model.web");
        await startCameraForWeb();
      } else {
        const { startCameraForMobile } = await import("./model.native");
        await startCameraForMobile();
      }

      // Reinitialize Holistic
      await initMediaPose();

      // Resume rendering
      state.isRendering(true);
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
      state.isLoading(true); // Show loading spinner

      // Unified camera initialization using ternary operator
      await (Capacitor.getPlatform() === "web"
        ? (await import("./model.web")).startCameraForWeb()
        : (await import("./model.native")).startCameraForMobile());

      // Holistic Initialization
      await initMediaPose();

      // Unified rendering loop using ternary operator
      const renderLoop =
        Capacitor.getPlatform() === "web"
          ? (await import("./model.web")).renderLoopForWeb
          : (await import("./model.native")).renderLoopForMobile;

      const ctx = state.canvasElement?.getContext("2d");
      if (ctx) renderLoop(ctx);
    },
    {
      onStart: "start", // FSM transition
      onSuccess: () => {
        state.fsm.transition("ready"); // Transition to "Ready"
      },
      onError: () => {
        state.fsm.transition("error"); // Transition to "Idle" on failure
        resetState(); // Reset app state
      },
    }
  );

  state.isLoading(false); // Clear loading spinner
  m.redraw(); // Trigger UI update
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
