// model.ts
import m from "mithril";
import Stream from "mithril-stream";
import { DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import {
  Exercise,
  FeedbackConfig,
  Pose,
  PoseFrame,
  ExerciseMeta,
} from "@/types";
import * as exrxs from "@/exercises";
import { mergePoseWithMeta } from "@/exercises/utils";

// Playback State Streams
export const playbackPoses = Stream<Array<PoseFrame>>([]); // Loaded poses for playback
export const isPlaying = Stream<boolean>(false); // Playback active flag
export const currentFrame = Stream<number>(0); // Current frame index
export const playbackSpeed = Stream<number>(1); // Playback speed (1x default)
export const loopPlayback = Stream<boolean>(false); // Loop playback flag
export const elapsedTime = Stream<number>(0); // Elapsed playback time in seconds
export const isExercise = Stream<ExerciseMeta | null>(null); // Elapsed playback time in seconds
export const currentExercise = Stream<Exercise | undefined>(undefined); // Elapsed playback time in seconds
const exercises = Object.values(exrxs);
const convertedPoseConnections = (window as any).POSE_CONNECTIONS.map(
  (conn: [][]) => ({ start: conn[0], end: conn[1] })
);
let playbackAnimationFrame: number | null = null;
let playbackStartTime: number | null = null;
// Canvas Reference
let canvasElement: HTMLCanvasElement | null = null;

/**
 * Loads the recording data into playback state and enriches it with metadata.
 * @param data - Array of PoseFrame objects.
 * @param exrxData - Exercise metadata (ExerciseMeta).
 */
export const loadRecordingData = (
  data: PoseFrame[],
  exrxData: ExerciseMeta
) => {
  if (!Array.isArray(data)) {
    alert("Invalid data format: Expected an array of PoseFrame objects.");
    return;
  }

  // Normalize timestamps to start at 0
  const firstTimestamp = data[0]?.timestamp || 0;
  console.log("First timestamp:", firstTimestamp);

  // Normalize pose data
  const normalizedData = data.map((frame) => ({
    ...frame,
    timestamp: frame.timestamp - firstTimestamp,
  }));

  // Normalize exercise metadata (exrxData.raw)
  const normalizedExrxData: ExerciseMeta = {
    ...exrxData,
    raw: Object.fromEntries(
      Object.entries(exrxData.raw).map(([key, rawProps]) => [
        key,
        rawProps.map((prop) => ({
          ...prop,
          timestamp: prop.timestamp - firstTimestamp, // Adjust relative to first frame
        })),
      ])
    ),
  };

  // Handle exercise metadata association
  if (exrxData.id) {
    isExercise(normalizedExrxData);
    const exrx = exercises.find((x) => x.id === normalizedExrxData.id);
    currentExercise(exrx);
  } else {
    isExercise(null);
    currentExercise(undefined);
  }

  // Enrich PoseFrames with metadata
  const enrichedFrames = mergePoseWithMeta(
    normalizedExrxData,
    normalizedData,
    (landmarks, frameMeta) => {
      const safeFrameMeta = frameMeta || { id: "default", isBadPose: false }; // Provide default values
      const exercise = currentExercise();
      return exercise?.injectMetadata?.(landmarks, safeFrameMeta) || {};
    }
  );

  playbackPoses(enrichedFrames);
  currentFrame(0);
  elapsedTime(0);
  console.log(
    "Recording data and metadata normalized and loaded successfully."
  );
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
  // console.log("Canvas has been cleared.");
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
  console.log(playbackPoses());
  if (playbackPoses().length === 0) {
    alert("No recording loaded. Please load a frameset first.");
    return;
  }

  if (isPlaying()) {
    console.warn("Playback is already running.");
    return;
  }

  isPlaying(true);
  playbackStartTime = null; // Reset playback start time.
  playbackAnimationFrame = requestAnimationFrame(playNextFrame);
  return playNextFrame;
};

/**
 * Plays the next frame in the playback sequence using requestAnimationFrame.
 * @param timestamp - Current time provided by requestAnimationFrame.
 */
const playNextFrame = (timestamp: number = 0) => {
  if (!playbackStartTime) playbackStartTime = timestamp;

  // Calculate elapsed time in playback (adjusted for speed).
  const elapsedPlaybackTime =
    (timestamp - playbackStartTime) / (1000 * playbackSpeed());

  // Determine the target frame index based on elapsed playback time.
  let targetFrameIndex = playbackPoses().findIndex(
    (frame) => frame.timestamp > elapsedPlaybackTime
  );
  console.log("elapsedPlaybackTime", elapsedPlaybackTime, playbackPoses());

  // Handle end of playback.
  if (targetFrameIndex === -1) {
    if (loopPlayback()) {
      playbackStartTime = null;
      currentFrame(0);
      elapsedTime(0);
      playNextFrame();
    } else {
      stopPlayback();
    }
    return;
  }
  // Update the current frame and render it.
  if (targetFrameIndex !== currentFrame()) {
    currentFrame(targetFrameIndex);
    const frame = playbackPoses()[currentFrame()];
    console.log(frame);
    if (frame) {
      clearCanvas();
      frame.poses.forEach((pose) => drawPose(pose));

      // Overlay metadata (e.g., rep count, status).
      if (frame.meta?.metadata) drawMetadata(frame.meta.metadata);

      elapsedTime(frame.timestamp); // Update elapsed time.
    }
  }

  // Request the next frame.
  if (isPlaying()) {
    playbackAnimationFrame = requestAnimationFrame(playNextFrame);
  }
};

/**
 * Pauses the ongoing playback.
 */
export const pausePlayback = () => {
  if (!isPlaying()) return;

  isPlaying(false);
  if (playbackAnimationFrame) {
    cancelAnimationFrame(playbackAnimationFrame);
    playbackAnimationFrame = null;
  }
  console.log("Playback paused.");
};

/**
 * Stops the playback and resets the state.
 */
export const stopPlayback = () => {
  if (!isPlaying()) return;

  isPlaying(false);
  playbackStartTime = null;
  if (playbackAnimationFrame) {
    cancelAnimationFrame(playbackAnimationFrame);
    playbackAnimationFrame = null;
  }
  currentFrame(0);
  elapsedTime(0);
  clearCanvas();
  console.log("Playback stopped.");
};

/**
 * Sets the playback speed.
 * @param speed - Desired playback speed multiplier (e.g., 0.5, 1, 2).
 */
export const setPlaybackSpeed = (speed: number) => {
  if (speed <= 0) {
    alert("Playback speed must be greater than 0.");
    return;
  }

  playbackSpeed(speed);
  console.log(`Playback speed set to ${speed}x.`);

  // Adjust playback start time to account for speed change
  if (isPlaying()) {
    const currentTime = performance.now();
    const adjustedElapsedTime = elapsedTime() / speed; // Adjust elapsed time
    playbackStartTime = currentTime - adjustedElapsedTime * 1000; // Reset start time
  }
};

const drawMetadata = (metadata: FeedbackConfig["metadata"]) => {
  if (!canvasElement) return;

  const ctx = canvasElement.getContext("2d");
  if (!ctx) return;

  ctx.font = "16px Arial";
  ctx.fillStyle = "yellow";

  metadata?.forEach((entry, index) => {
    ctx.fillText(
      `${entry.label}: ${entry.value}`,
      10, // x-coordinate
      20 + index * 20 // y-coordinate with spacing
    );
  });
};
