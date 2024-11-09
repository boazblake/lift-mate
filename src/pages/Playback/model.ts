// model.ts
import m from "mithril";
import Stream from "mithril-stream";
import { DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

// Type Definitions
export type Pose = Array<{
  x: number;
  y: number;
  z: number;
}>;

// Interface for PoseFrame
export interface PoseFrame {
  timestamp: number; // Unix timestamp in seconds
  poses: Array<Pose>; // Each pose should be an array of landmarks with x, y, z coordinates
}

// Playback State Streams
export const playbackPoses = Stream<Array<PoseFrame>>([]); // Loaded poses for playback
export const isPlaying = Stream<boolean>(false); // Playback active flag
export const currentFrame = Stream<number>(0); // Current frame index
export const playbackSpeed = Stream<number>(1); // Playback speed (1x default)
export const loopPlayback = Stream<boolean>(false); // Loop playback flag
export const elapsedTime = Stream<number>(0); // Elapsed playback time in seconds

const convertedPoseConnections = (window as any).POSE_CONNECTIONS.map(
  (conn: [][]) => ({ start: conn[0], end: conn[1] })
);

// Canvas Reference
let canvasElement: HTMLCanvasElement | null = null;

/**
 * Loads the recording data into playbackPoses.
 * @param data - Array of PoseFrame objects.
 */
export const loadRecordingData = (data: PoseFrame[]) => {
  if (!Array.isArray(data)) {
    console.error(
      "Invalid data format: Expected an array of PoseFrame objects."
    );
    alert("Failed to load recording. Invalid data format.");
    return;
  }

  // Optional: Validate each PoseFrame structure
  for (const frame of data) {
    if (
      typeof frame.timestamp !== "number" ||
      !Array.isArray(frame.poses) ||
      frame.poses.length === 0
    ) {
      console.error("Invalid PoseFrame structure:", frame);
      alert(
        "Failed to load recording. One or more frames have an invalid structure."
      );
      return;
    }

    // Optional: Further validate each pose
    for (const pose of frame.poses) {
      if (!Array.isArray(pose)) {
        console.error("Invalid pose structure:", pose, frame.timestamp);
        alert(
          "Failed to load recording. One or more poses have an invalid structure."
        );
        return;
      }

      for (const landmark of pose) {
        if (
          typeof landmark.x !== "number" ||
          typeof landmark.y !== "number" ||
          typeof landmark.z !== "number"
        ) {
          console.error("Invalid landmark structure:", landmark);
          alert(
            "Failed to load recording. One or more landmarks have an invalid structure."
          );
          return;
        }
      }
    }
  }

  playbackPoses(data);
  currentFrame(0);
  elapsedTime(0);
  console.log("Recording data loaded successfully:", data);
  m.redraw();
};

/**
 * Clears all playback data and resets playback state.
 */
export const clearPlaybackData = () => {
  playbackPoses([]);
  currentFrame(0);
  isPlaying(false);
  elapsedTime(0);
  clearCanvas();
  console.log("Playback data and state have been cleared.");
  m.redraw();
};

/**
 * Sets the canvas element where poses will be rendered during playback.
 * @param canvas - The HTMLCanvasElement for playback.
 */
export const setCanvasElement = (canvas: HTMLCanvasElement) => {
  canvasElement = canvas;
  console.log("Canvas element set for playback:", canvas);
};

/**
 * Clears the canvas to remove any previously drawn poses.
 */
export const clearCanvas = () => {
  if (!canvasElement) {
    console.warn("Canvas element is not set.");
    return;
  }

  const ctx = canvasElement.getContext("2d");
  if (!ctx) {
    console.warn("2D context not available on canvas.");
    return;
  }

  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  console.log("Canvas has been cleared.");
};

/**
 * Draws a single pose on the canvas using MediaPipe's DrawingUtils.
 * @param pose - An array of landmark objects with x, y, z coordinates.
 */
export const drawPose = (pose: Pose) => {
  if (!canvasElement) {
    console.warn("Canvas element is not set.");
    return;
  }

  const ctx = canvasElement.getContext("2d");
  if (!ctx) {
    console.warn("2D context not available on canvas.");
    return;
  }

  clearCanvas();

  // Verify that convertedPoseConnections is defined
  if (!convertedPoseConnections) {
    console.error(
      "convertedPoseConnections is not defined. Please ensure model.ts is loaded correctly."
    );
    return;
  }

  const drawingUtils = new DrawingUtils(ctx);

  // Draw landmarks
  drawingUtils.drawLandmarks(pose, {
    color: "blue",
    lineWidth: 5,
  });

  // Draw connectors
  drawingUtils.drawConnectors(pose, convertedPoseConnections, {
    color: "green",
    lineWidth: 3,
  });
  m.redraw();
};

/**
 * Starts the playback by initiating the frame rendering loop.
 */
export const startPlayback = () => {
  if (playbackPoses().length === 0) {
    alert("No recording loaded. Please load a frameset first.");
    console.warn("startPlayback called with empty playbackPoses.");
    return;
  }

  if (isPlaying()) {
    console.warn("Playback is already running.");
    return; // Already playing
  }

  isPlaying(true);
  console.log("Playback started.");
  playNextFrame();
};

/**
 * Plays the next frame in the playback sequence.
 */
const playNextFrame = () => {
  if (currentFrame() >= playbackPoses().length) {
    console.log("Reached the end of the playback poses.");
    if (loopPlayback()) {
      console.log("Looping playback.");
      currentFrame(0);
      elapsedTime(0);
      playNextFrame();
    } else {
      console.log("Stopping playback.");
      stopPlayback();
    }
    return;
  }

  const frame = playbackPoses()[currentFrame()];
  frame.poses.forEach((pose: any) => drawPose(pose)); // Assuming single pose per frame

  elapsedTime(frame.timestamp);
  currentFrame(currentFrame() + 1);

  const nextFrame = playbackPoses()[currentFrame()];
  if (nextFrame) {
    const delay = Math.max(
      ((nextFrame.timestamp - frame.timestamp) * 1000) / playbackSpeed(),
      16 // Minimum delay of ~16ms for ~60FPS
    );
    setTimeout(() => {
      if (isPlaying()) {
        playNextFrame();
      } else {
        console.log("Playback paused.");
      }
    }, delay);
  } else {
    if (loopPlayback()) {
      console.log("Looping playback.");
      currentFrame(0);
      elapsedTime(0);
      playNextFrame();
    } else {
      console.log("Stopping playback.");
      stopPlayback();
    }
  }
};

/**
 * Pauses the ongoing playback.
 */
export const pausePlayback = () => {
  if (!isPlaying()) {
    console.warn("pausePlayback called but playback is not active.");
    return;
  }

  isPlaying(false);
  console.log("Playback paused.");
};

/**
 * Stops the playback and resets the state.
 */
export const stopPlayback = () => {
  if (!isPlaying()) {
    console.warn("stopPlayback called but playback is not active.");
    return;
  }

  isPlaying(false);
  currentFrame(0);
  elapsedTime(0);
  clearCanvas();
  console.log("Playback stopped and state has been reset.");
};

/**
 * Sets the playback speed.
 * @param speed - Desired playback speed multiplier (e.g., 0.5, 1, 2).
 */
export const setPlaybackSpeed = (speed: number) => {
  if (speed <= 0) {
    console.warn("Invalid playback speed:", speed);
    alert("Playback speed must be greater than 0.");
    return;
  }

  playbackSpeed(speed);
  console.log(`Playback speed set to ${speed}x.`);
};
