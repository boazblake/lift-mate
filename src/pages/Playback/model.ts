import m from "mithril";
import Stream from "mithril-stream";
import { PoseFrame } from "@/types";
import { drawLandmarks } from "@/pages/Pose/model.utils";

// Playback State Streams
export const playbackPoses = Stream<Array<PoseFrame>>([]); // Loaded poses for playback
export const isPlaying = Stream<boolean>(false); // Playback active flag
export const currentFrame = Stream<number>(0); // Current frame index
export const playbackSpeed = Stream<number>(1); // Playback speed (1x default)
export const loopPlayback = Stream<boolean>(false); // Loop playback flag
export const elapsedTime = Stream<number>(0); // Elapsed playback time in seconds

let playbackAnimationFrame: number | null = null;
let playbackStartTime: number | null = null;
let canvasElement: HTMLCanvasElement | null = null;

/**
 * Loads the recording data into playback state.
 * @param data - Array of PoseFrame objects with HolisticData.
 */
export const loadRecordingData = (data: Array<PoseFrame>) => {
  playbackPoses(data);
  currentFrame(0);
  elapsedTime(0);
  console.log("Recording data loaded successfully.", data);
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
  console.log("Playback data cleared.");
  m.redraw();
};

/**
 * Sets the canvas element where playback will be rendered.
 * @param canvas - HTMLCanvasElement for playback.
 */
export const setCanvasElement = (canvas: HTMLCanvasElement) => {
  canvasElement = canvas;
  console.log("Canvas set for playback:", canvas);
};

/**
 * Clears the canvas.
 */
export const clearCanvas = () => {
  if (!canvasElement) return;
  const ctx = canvasElement.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
};

/**
 * Starts playback.
 */
export const startPlayback = () => {
  if (!playbackPoses().length) {
    alert("No recording loaded. Please load a frameset first.");
    return;
  }
  if (isPlaying()) {
    console.warn("Playback is already running.");
    return;
  }
  isPlaying(true);
  playbackStartTime = null;
  playbackAnimationFrame = requestAnimationFrame(playNextFrame);
};

/**
 * Plays the next frame using requestAnimationFrame.
 * @param timestamp - Current time provided by requestAnimationFrame.
 */
const playNextFrame = (timestamp: number = 0) => {
  if (!playbackStartTime) playbackStartTime = timestamp;

  const elapsedPlaybackTime =
    (timestamp - playbackStartTime) / (1000 * playbackSpeed());

  const epsilon = 0.01; // Tolerance for timestamp comparison

  // Find the target frame
  let targetFrameIndex = playbackPoses().findIndex(
    (frame) => frame.timestamp > elapsedPlaybackTime
  );

  console.log("playNextFrame", {
    elapsedPlaybackTime,
    targetFrameIndex,
    currentFrame: currentFrame(),
  });

  // Handle case where elapsed time exceeds last frame timestamp
  if (targetFrameIndex === -1) {
    if (loopPlayback()) {
      playbackStartTime = null; // Restart playback
      currentFrame(0);
      elapsedTime(0);
    } else {
      stopPlayback();
    }
    return;
  }

  // Fallback for rendering the first frame
  if (currentFrame() === 0 && targetFrameIndex === 0) {
    console.log("Rendering the first frame...");
    targetFrameIndex = 1; // Ensure rendering starts with the first frame
  }

  // Render the frame and update state
  if (
    targetFrameIndex !== currentFrame() ||
    Math.abs(playbackPoses()[currentFrame()].timestamp - elapsedPlaybackTime) <
    epsilon
  ) {
    console.log("Updating currentFrame...");
    currentFrame(currentFrame() + 1); // Update currentFrame
    const frame = playbackPoses()[targetFrameIndex];
    if (frame) {
      const ctx = canvasElement?.getContext("2d");
      if (ctx) {
        clearCanvas();
        // Pass the correct state and data to drawLandmarks
        drawLandmarks(
          {
            poseLandmark: true,
            handLandmark: true,
            faceLandmark: true,
          }, // State
          ctx, // Canvas context
          frame.poses // Landmark data
        );
        elapsedTime(frame.timestamp); // Update elapsed time
        m.redraw();
      }
    }
  }

  // Request next frame
  if (isPlaying()) {
    playbackAnimationFrame = requestAnimationFrame(playNextFrame);
  }
};

/**
 * Pauses playback.
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
 * Stops playback and resets the state.
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
    const adjustedElapsedTime = elapsedTime() / speed;
    playbackStartTime = currentTime - adjustedElapsedTime * 1000;
  }
};
