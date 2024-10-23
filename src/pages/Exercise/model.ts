import Stream from "mithril-stream";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import {
  CameraPreview,
  CameraPreviewOptions,
} from "@capacitor-community/camera-preview";
import { Capacitor } from "@capacitor/core";

// State management using Mithril Streams
export const appState = Stream("Pre"); // Pre or Streaming state
let poseLandmarker: any;

// Function to start pose detection
export const startDetection = async (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
) => {
  if (appState() === "Pre") {
    await initPoseLandmarker(
      videoElement,
      canvasElement,
      onResults(canvasElement)
    ); // Initialize pose detection before starting the video
    await startCamera(videoElement, canvasElement); // Start video feed after pose detection is initialized
  } else {
    // If in Retake state, reset and restart everything
    stopPoseLandmarker(videoElement);
    appState("Pre");
    await startDetection(videoElement, canvasElement); // Restart the detection
  }
};

// Function to stop pose detection
export const stopDetection = (videoElement: HTMLVideoElement) => {
  stopPoseLandmarker(videoElement);
};

// Function to handle the results of pose detection
const onResults = (canvasElement: HTMLCanvasElement) => (results: any) => {
  console.log("Pose detection results:", results);

  // Process results and draw landmarks on the canvas
  if (results.poseLandmarks) {
    const canvasCtx = canvasElement.getContext("2d");
    if (canvasCtx) {
      DrawingUtils.drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "red",
        lineWidth: 10,
      });
      DrawingUtils.drawConnectors(
        canvasCtx,
        results.poseLandmarks,
        window.POSE_CONNECTIONS,
        { color: "white", lineWidth: 10 }
      );
    }
  }
};

// Initialize video feed
const startWebVideoFeed = async (videoElement: HTMLVideoElement) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1920,
        height: 1080,
        frameRate: { ideal: 30, max: 30 }, // Enforce consistent frame rate
      },
    });
    videoElement.srcObject = stream;
    appState("Streaming");
    return videoElement.play();
  } catch (error) {
    console.error("Error accessing the camera:", error);
  }
};

// Function to initialize camera for web or mobile
export const startCamera = async (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
) => {
  const platform = Capacitor.getPlatform();

  if (platform === "web") {
    // Use web API to access camera on the web
    await startWebVideoFeed(videoElement);
  } else {
    // Use Capacitor Camera Preview for mobile platforms
    await startMobileCamera(canvasElement);
  }
};

// Function to start camera on mobile using Capacitor plugin
const startMobileCamera = async (canvasElement: HTMLCanvasElement) => {
  const cameraPreviewOptions: CameraPreviewOptions = {
    position: "rear",
    width: canvasElement.width,
    height: canvasElement.height,
    parent: "video-feed", // This should match an existing element ID in the DOM
    toBack: true, // Ensures your HTML goes over the camera preview
    disableAudio: true, // Disable microphone access if not needed
  };

  try {
    console.log(CameraPreview);
    await CameraPreview.start(cameraPreviewOptions);
    appState("Streaming");
  } catch (error) {
    console.error("Error starting mobile camera:", error);
  }
};

// Stop the camera preview when required
const stopCamera = async (videoElement: HTMLVideoElement) => {
  const platform = Capacitor.getPlatform();

  if (platform === "web") {
    // Stop video feed on the web
    stopWebVideoFeed(videoElement);
  } else {
    // Stop Capacitor camera preview on mobile
    await CameraPreview.stop();
  }
};

// Stop video feed for web platform
const stopWebVideoFeed = (videoElement: HTMLVideoElement) => {
  if (videoElement && videoElement.srcObject) {
    const stream = videoElement.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
};

// Initialize the Pose Landmarker for video-based pose detection
const initPoseLandmarker = async (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  onResultsCallback: (results: any) => void
) => {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 2,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const drawingUtils = new DrawingUtils(canvasElement.getContext("2d"));

    const renderLoop = () => {
      let videoTime = performance.now(); // videoElement.currentTime * 1000; // Convert to milliseconds
      let lastTimestamp = 0;
      const canvasCtx = canvasElement.getContext("2d");

      if (canvasCtx) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(
          videoElement,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );
      }

      if (videoTime > 0) {
        if (videoTime <= lastTimestamp) {
          videoTime = lastTimestamp + 1; // Force monotonic increase
        }
        console.log("time", lastTimestamp, videoTime);
        lastTimestamp = videoTime;
        const results = poseLandmarker.detectForVideo(videoElement, videoTime);
        if (results && results.landmarks && results.landmarks.length > 0) {
          for (const landmarks of results.landmarks) {
            drawingUtils.drawLandmarks(landmarks, {
              radius: (data: any) =>
                DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
            });
            drawingUtils.drawConnectors(
              landmarks,
              PoseLandmarker.POSE_CONNECTIONS
            );
          }
        }
        onResultsCallback(results);
      }

      requestAnimationFrame(renderLoop); // Continue processing frames
    };

    videoElement.onloadeddata = () => {
      renderLoop(); // Start the render loop when video data is loaded
    };
  } catch (error) {
    console.error("Error initializing Pose Landmarker:", error);
  }
};

// Stop pose detection and video feed
const stopPoseLandmarker = (videoElement: HTMLVideoElement) => {
  if (videoElement?.srcObject) {
    const tracks = (videoElement.srcObject as MediaStream).getTracks();
    tracks.forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
  appState("Pre");
};
