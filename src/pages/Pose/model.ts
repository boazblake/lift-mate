import m from "mithril";
import { Share } from "@capacitor/share";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import { Exercise } from "./exercises/types";
import { Capacitor } from "@capacitor/core";
import {
  CameraPreview,
  CameraPreviewOptions,
  CameraPreviewPlugin,
} from "@capacitor-community/camera-preview";
import Stream from "mithril-stream";

export const state = {
  recordedFrames: Stream([]) as Stream<Array<any>>,
  appState: Stream("Pre") as Stream<"Pre" | "Streaming">,
  videoElement: null as HTMLVideoElement | null,
  canvasElement: null as HTMLCanvasElement | null,
  poseLandmarker: null as PoseLandmarker | null,
  exerciseHandler: null as Exercise | null,
  isRendering: false,
  cameraPosition: "front",
  mobileCamera: null as CameraPreviewPlugin | null,
  mobileCameraOptions: {} as CameraPreviewOptions,
};
export const addPose = (pose: any) => {
  const currentTime = performance.now() / 1000; // Current time in seconds
  state.recordedFrames([
    ...state.recordedFrames(),
    { timestamp: currentTime, poses: [pose] },
  ]);
  console.log("Pose added. Total frames:", state.recordedFrames()[0]);
};
// Namespace for mobile-specific functions
const MobileCamera = {
  startCameraForMobile: async () => {
    const cameraPreviewOptions: CameraPreviewOptions = {
      position: state.cameraPosition,
      width: state.canvasElement?.width || 1280,
      height: state.canvasElement?.height || 720,
      parent: "video-feed",
      toBack: true,
      disableAudio: true,
    };
    console.log(cameraPreviewOptions);
    try {
      await CameraPreview.start(cameraPreviewOptions);
      state.appState("Streaming");
      console.log("Mobile camera preview started successfully.");
    } catch (error) {
      console.error("Error starting mobile camera preview:", error);
    }
  },

  renderLoopForMobile: async (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) {
      console.error("Canvas context not available for mobile");
      return;
    }

    const processFrame = async () => {
      if (!state.isRendering || !state.poseLandmarker) {
        console.log("Exiting mobile render loop: state not ready");
        return;
      }

      try {
        // Capture a frame from CameraPreview as a base64 string
        const frame = await CameraPreview.captureSample({ quality: 85 });
        const image = await base64ToImage(frame.value); // Convert to an HTMLImageElement

        // Clear canvas and draw the captured frame
        ctx.clearRect(
          0,
          0,
          state.canvasElement.width,
          state.canvasElement.height
        );
        ctx.drawImage(
          image,
          0,
          0,
          state.canvasElement.width,
          state.canvasElement.height
        );
        // console.log("Captured frame drawn on mobile canvas");

        // Run pose detection on the captured frame
        const results = await state.poseLandmarker.detect(image);
        if (results?.landmarks?.length) {
          results.landmarks.forEach((pose) => addPose(pose)); // Record detected pose
          // console.log("Drawing landmarks and connections on mobile...");
          drawLandmarks(ctx, results.landmarks); // Draw landmarks and connections
        }
      } catch (error) {
        console.error("Error during mobile render loop:", error);
      }
      requestAnimationFrame(processFrame);
    };

    // Start the mobile render loop
    requestAnimationFrame(processFrame);
  },
};

// Helper function to convert base64 to HTMLImageElement
const base64ToImage = (base64: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = "data:image/jpeg;base64," + base64;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};
const drawLandmarks = (ctx: CanvasRenderingContext2D, poses: Array<any>) => {
  // console.log("Drawing landmarks and connections...");

  poses.forEach((pose, index) => {
    // console.log(`Drawing pose ${index + 1} with ${pose.length} landmarks`);

    // Draw each landmark as a red dot
    pose.forEach((landmark: { x: number; y: number }) => {
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

    // Draw connections between specified landmarks
    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = pose[startIdx];
      const end = pose[endIdx];
      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(
          start.x * state.canvasElement.width,
          start.y * state.canvasElement.height
        );
        ctx.lineTo(
          end.x * state.canvasElement.width,
          end.y * state.canvasElement.height
        );
        ctx.strokeStyle = "white"; // Set line color for connections
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  });
};
// Initialize camera based on platform
const startCamera = async () => {
  if (Capacitor.getPlatform() === "web") {
    // Web-based camera start logic
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            frameRate: { ideal: 30, max: 30 },
          },
        });
        if (state.videoElement) {
          state.videoElement.srcObject = stream;
          await state.videoElement.play();
        }
        console.log("Web video feed started successfully.");
      } catch (error) {
        console.error("Error accessing the camera on web:", error);
      }
    } else {
      console.error("Camera access not supported on this browser.");
    }
  } else {
    // Mobile-specific camera start logic
    await MobileCamera.startCameraForMobile();
  }
};

export const setExerciseHandler = (exercise: Exercise | null) => {
  state.exerciseHandler = exercise;
};
export const setCameraHandler = (cameraPosition: string) => {
  if (state.mobileCamera) state.mobileCamera.flip();
  state.cameraPosition = cameraPosition;
  console.log(state);
};
export const startDetection = async () => {
  if (state.appState() === "Pre") {
    state.appState("Streaming");
    console.log(state);
    state.recordedFrames([]); // Clear previous recordings
    await startCamera(); // Initialize video stream
    await initPoseLandmarker(); // Initialize pose detection
    m.redraw();
  } else {
    await stopDetection();
    state.appState("Pre");
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
  state.appState("Pre");
  console.log("end", state);
};

const stopCamera = async () => {
  if (Capacitor.getPlatform() === "web") {
    // Web-specific stop logic
    if (state.videoElement && state.videoElement.srcObject) {
      (state.videoElement.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      state.videoElement.srcObject = null;
    }
    console.log("Web camera stopped successfully.");
  } else {
    // Mobile-specific stop logic
    try {
      await CameraPreview.stop();
      // await CameraPreview.stopRecordVideo();
      console.log("Mobile camera preview stopped successfully.");
    } catch (error) {
      console.error("Error stopping mobile camera preview:", error);
    }
  }

  // Clear the canvas
  if (state.canvasElement) {
    const ctx = state.canvasElement.getContext("2d");
    if (ctx) {
      ctx.clearRect(
        0,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );
      console.log("Canvas cleared.");
    }
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
      runningMode: Capacitor.getPlatform() === "web" ? "VIDEO" : "IMAGE",
      numPoses: 2,
    });

    state.isRendering = true;

    // Choose the appropriate render loop based on the platform
    if (Capacitor.getPlatform() === "web") {
      renderLoop(); // Web-specific rendering loop
    } else {
      const ctx = state.canvasElement?.getContext("2d");
      if (ctx) {
        await MobileCamera.renderLoopForMobile(ctx); // Mobile-specific rendering loop
      } else {
        console.error("Canvas context not available for mobile render loop.");
      }
    }
  } catch (error) {
    console.error("Error initializing Pose Landmarker:", error);
  }
};

const saveRecording = async () => {
  console.log(state.recordedFrames());
  try {
    const data = JSON.stringify(state.recordedFrames(), null, 2);
    const fileName = `pose_recording_${new Date().toISOString()}.json`;

    // Save the file using Capacitor Filesystem
    const fileUri = await Filesystem.writeFile({
      path: fileName,
      data: data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    console.log("Recording saved successfully to filesystem:", fileUri.uri);

    // Share the saved file
    await Share.share({
      title: "Pose Recording",
      // tex: "Here is the pose recording file.",
      url: fileUri.uri,
      dialogTitle: "Share Pose Recording",
    });
    console.log("File shared successfully.");
  } catch (error) {
    console.error("Error saving or sharing recording:", error);
  }
};

const renderLoop = async () => {
  if (
    !state.isRendering ||
    !state.poseLandmarker ||
    !state.canvasElement ||
    !state.videoElement
  ) {
    console.log("Skipping render loop: required state not ready");
    return;
  }

  const ctx = state.canvasElement.getContext("2d");
  if (!ctx) {
    console.error("Canvas context not available");
    return;
  }

  // Ensure video dimensions are set
  if (
    state.videoElement.videoWidth === 0 ||
    state.videoElement.videoHeight === 0
  ) {
    console.log("Skipping frame: video dimensions not set", state.videoElement);
    requestAnimationFrame(renderLoop);
    return;
  }

  // Clear canvas and draw video frame
  ctx.clearRect(0, 0, state.canvasElement.width, state.canvasElement.height);
  ctx.drawImage(
    state.videoElement,
    0,
    0,
    state.canvasElement.width,
    state.canvasElement.height
  );
  console.log("Drawing video frame on canvas");

  // Run pose detection on the video frame
  const videoTime = performance.now() / 1000;
  try {
    const results = await state.poseLandmarker.detectForVideo(
      state.videoElement,
      videoTime
    );
    if (results?.landmarks?.length) {
      results.landmarks.forEach((pose) => addPose(pose)); // Record detected pose
      console.log("Detected landmarks, now drawing on canvas...");
      drawLandmarks(ctx, results.landmarks); // Draw on canvas
    }
  } catch (error) {
    console.error("Error during pose detection:", error);
  }

  requestAnimationFrame(renderLoop);
};
