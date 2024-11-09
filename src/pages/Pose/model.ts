import m from "mithril";
import {
  PoseLandmarker,
  FilesetResolver,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import { Exercise } from "./exercises/types";

export const state = {
  appState: "Pre" as "Pre" | "Streaming",
  recordedFrames: [] as Array<{ timestamp: number; poses: Array<any> }>,
  videoElement: null as HTMLVideoElement | null,
  canvasElement: null as HTMLCanvasElement | null,
  poseLandmarker: null as PoseLandmarker | null,
  exerciseHandler: null as Exercise | null,
  isRendering: false,
  isFrontFacing: true,
};

export const setExerciseHandler = (exercise: Exercise | null) => {
  state.exerciseHandler = exercise;
};
export const setCameraHandler = (isFrontFacing: boolean) => {
  state.isFrontFacing = isFrontFacing;
};
export const startDetection = async () => {
  if (state.appState === "Pre") {
    state.recordedFrames = []; // Clear previous recordings
    await startCamera(); // Initialize video stream
    await initPoseLandmarker(); // Initialize pose detection
    state.appState = "Streaming";
    m.redraw();
  } else {
    await stopDetection();
    state.appState = "Pre";
    await startDetection();
  }
};

export const stopDetection = async () => {
  state.isRendering = false;
  await stopCamera();
  if (state.poseLandmarker) {
    state.poseLandmarker.close();
    state.poseLandmarker = null;
  }

  saveRecording(); // Save the recorded landmarks
  state.appState = "Pre";
};

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720,
        facingMode: state.isFrontFacing ? "front" : "rear",
      },
    });
    if (state.videoElement) {
      state.videoElement.srcObject = stream;
      await new Promise<void>((resolve) => {
        state.videoElement!.onloadedmetadata = () => {
          state.videoElement!.play();
          resolve();
        };
      });
    }
  } catch (error) {
    console.error("Error accessing the camera:", error);
  }
};

const stopCamera = async () => {
  if (state.videoElement && state.videoElement.srcObject) {
    (state.videoElement.srcObject as MediaStream)
      .getTracks()
      .forEach((track) => track.stop());
    state.videoElement.srcObject = null;
  }
};

const initPoseLandmarker = async () => {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    state.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 2,
    });

    state.isRendering = true;
    renderLoop();
  } catch (error) {
    console.error("Error initializing Pose Landmarker:", error);
  }
};
const saveRecording = () => {
  try {
    const data = JSON.stringify(state.recordedFrames, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `pose_recording_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Recording saved successfully.");
  } catch (error) {
    console.error("Error saving recording:", error);
  }
};

const renderLoop = async () => {
  if (
    !state.isRendering ||
    !state.poseLandmarker ||
    !state.videoElement ||
    !state.canvasElement
  )
    return;

  const ctx = state.canvasElement.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, state.canvasElement.width, state.canvasElement.height);
    ctx.drawImage(
      state.videoElement,
      0,
      0,
      state.canvasElement.width,
      state.canvasElement.height
    );

    const videoTime = performance.now() / 1000; // Timestamp in seconds
    const results = await state.poseLandmarker.detectForVideo(
      state.videoElement,
      videoTime
    );

    if (results?.landmarks?.length) {
      // Structure each frame consistently
      const frame = {
        timestamp: videoTime,
        poses: results.landmarks.map((pose) =>
          pose.map((landmark) => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
          }))
        ),
      };

      // Add structured frame to recorded frames
      state.recordedFrames.push(frame);

      // Draw each pose in the frame
      results.landmarks.forEach((pose) => {
        // Draw each landmark in the pose
        pose.forEach((landmark) => {
          ctx.beginPath();
          ctx.arc(
            landmark.x * state.canvasElement.width,
            landmark.y * state.canvasElement.height,
            5,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = "red";
          ctx.fill();
        });

        // Draw connections between landmarks
        POSE_CONNECTIONS.forEach(([start, end]) => {
          const startLandmark = pose[start];
          const endLandmark = pose[end];
          ctx.beginPath();
          ctx.moveTo(
            startLandmark.x * state.canvasElement.width,
            startLandmark.y * state.canvasElement.height
          );
          ctx.lineTo(
            endLandmark.x * state.canvasElement.width,
            endLandmark.y * state.canvasElement.height
          );
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      });
    }
  }

  requestAnimationFrame(renderLoop);
};
