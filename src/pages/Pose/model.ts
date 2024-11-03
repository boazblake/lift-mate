import m from "mithril";
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
import { Exercise } from "./exercises/types"; // Import the Exercise interface

// State management using Mithril Streams
export const appState = Stream("Pre"); // "Pre" or "Streaming"
let poseLandmarker: PoseLandmarker | null = null;
let exerciseHandler: Exercise | null = null;
export const setExerciseHandler = (exercise: Exercise | null) => {
  exerciseHandler = exercise;
};

export interface PoseFrame {
  timestamp: number;
  poses: Array<any>; // Replace `any` with a specific type if available
}

export const recordedFrames = Stream<Array<PoseFrame>>([]);

export const addPose = (pose: any) => {
  const currentTime = performance.now() / 1000; // Current time in seconds
  recordedFrames([
    ...recordedFrames(),
    { timestamp: currentTime, poses: [pose] },
  ]);
  console.log("Pose added. Total frames:", recordedFrames()[0]);
};

// Control flag for render loops
let isRendering = false;

// Reset recorded poses
export const resetRecordedPoses = () => {
  recordedFrames([]);
};

// Function to start pose detection
export const startDetection = async (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
) => {
  if (appState() === "Pre") {
    resetRecordedPoses(); // Clear any previous recordings
    await initPoseLandmarker(
      videoElement,
      canvasElement,
      onResults(canvasElement)
    ); // Initialize pose detection before starting the video
    await startCamera(videoElement, canvasElement); // Start video feed after pose detection is initialized
    m.redraw();
  } else {
    // If in Retake state, reset and restart everything
    await stopDetection(videoElement);
    appState("Pre");
    await startDetection(videoElement, canvasElement); // Restart the detection
  }
};

// Function to stop pose detection
export const stopDetection = async (videoElement: HTMLVideoElement) => {
  isRendering = false; // Stop the render loop

  // Stop Pose Landmarker
  stopPoseLandmarker(videoElement);

  // Stop Camera
  await stopCamera(videoElement);

  // Update application state
  appState("Pre");

  // Provide user feedback
  alert("Pose detection and camera have been stopped successfully.");

  // Prompt the user to save the recording
  const shouldSave = confirm("Do you want to save the last recording?");
  if (shouldSave) {
    saveRecording(); // Ensure this function is correctly implemented
  }
  // Reset recorded poses for the next session
  resetRecordedPoses();
  m.redraw();
};

// Function to handle the results of pose detection
const onResults = (canvasElement: HTMLCanvasElement) => (results: any) => {
  // Check if landmarks are present
  if (results.landmarks && results.landmarks.length > 0) {
    console.log("Pose detection results:", results);

    // Iterate over each detected pose (up to numPoses)
    results.landmarks.forEach((pose: any, index: number) => {
      // Add the pose to recordedFrames
      addPose(pose);

      // Draw landmarks and connectors on the canvas
      const canvasCtx = canvasElement.getContext("2d");
      const drawingUtils = new DrawingUtils(canvasCtx);
      if (canvasCtx) {
        drawingUtils.drawLandmarks([pose], {
          color: "red",
          lineWidth: 10,
        });
        drawingUtils.drawConnectors(
          canvasCtx,
          [pose],
          window.POSE_CONNECTIONS,
          {
            color: "white",
            lineWidth: 10,
          }
        );

        // Process landmarks with the exercise handler, if available
        if (exerciseHandler) {
          console.log(
            `Exercise handler processing landmarks for pose ${index + 1}.`
          );
          exerciseHandler.processLandmarks(pose, canvasCtx);
        }
      }
    });
  }
};

// Function to save the recorded poses
export const saveRecording = () => {
  try {
    const data = JSON.stringify(recordedFrames(), null, 2);
    console.log("Serialized Pose Data:", data); // Debugging line

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    console.log("Blob URL:", url); // Debugging line

    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = `pose_recording_${new Date().toISOString()}.json`;
    document.body.appendChild(a); // Append to the DOM to ensure compatibility
    a.click();
    document.body.removeChild(a); // Clean up

    // Clean up
    URL.revokeObjectURL(url);
    console.log("Recording saved successfully.");
  } catch (error) {
    console.error("Error saving recording:", error);
    alert("An error occurred while saving the recording.");
  }
};

// Initialize video feed for web
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
    await videoElement.play();
    console.log("Web video feed started successfully.");
  } catch (error) {
    console.error("Error accessing the camera:", error);
    alert(
      "Failed to access the camera. Please check permissions and try again."
    );
  }
};

// Function to initialize camera for web or mobile
export const startCamera = async (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
) => {
  if (appState() == "Streaming") {
    await stopCamera(videoElement);
  }
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
    position: "front",
    width: canvasElement.width,
    height: canvasElement.height,
    parent: "video-feed", // Ensure this ID exists in your HTML
    toBack: true, // Ensures your HTML goes over the camera preview
    disableAudio: true, // Disable microphone access if not needed
  };

  try {
    await CameraPreview.start(cameraPreviewOptions);
    appState("Streaming");
    renderMobileLoop(canvasElement); // Start rendering the captured frames
    console.log("Mobile camera preview started successfully.");
  } catch (error) {
    console.error("Error starting mobile camera:", error);
    alert("Failed to start the mobile camera. Please try again.");
  }
};

// Function to capture a frame from the camera preview
const captureFrame = async () => {
  try {
    const frame = await CameraPreview.captureSample({
      quality: 80, // Adjust quality as needed
    });
    return frame.value; // This is a base64 image
  } catch (error) {
    console.error("Error capturing frame from CameraPreview", error);
    return null;
  }
};

// Convert base64 to HTMLImageElement
const base64ToImage = (base64: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = "data:image/jpeg;base64," + base64;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

// Render loop for mobile
const renderMobileLoop = async (canvasElement: HTMLCanvasElement) => {
  const canvasCtx = canvasElement.getContext("2d");
  const drawingUtils = new DrawingUtils(canvasCtx);

  const processFrame = async () => {
    if (!isRendering || !poseLandmarker) return; // Exit if not rendering or landmarker is null

    const base64Image = await captureFrame(); // Capture frame from CameraPreview
    if (!base64Image) {
      requestAnimationFrame(processFrame);
      return;
    }

    const image = (await base64ToImage(base64Image)) as CanvasImageSource; // Convert base64 to image

    if (canvasCtx && image) {
      // Clear the canvas
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // Draw the captured frame onto the canvas (optional, for debugging)
      canvasCtx.drawImage(
        image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      // Process the frame using MediaPipe
      const results = await poseLandmarker.detect(image);

      // Draw landmarks and connectors if results are available
      if (results && results.landmarks && results.landmarks.length > 0) {
        results.landmarks.forEach((landmarks) => {
          drawingUtils.drawLandmarks(landmarks);
          drawingUtils.drawConnectors(
            landmarks,
            PoseLandmarker.POSE_CONNECTIONS
          );
          // Store the detected pose
          addPose(landmarks);
        });
      }
    }

    // Continue the loop for the next frame
    requestAnimationFrame(processFrame);
  };

  // Start the processing loop
  isRendering = true;
  requestAnimationFrame(processFrame);
  console.log("Mobile render loop started.");
};

// Stop the camera preview when required
export const stopCamera = async (videoElement: HTMLVideoElement) => {
  const platform = Capacitor.getPlatform();

  try {
    if (platform === "web") {
      // Stop video feed on the web
      stopWebVideoFeed(videoElement);
      console.log("Web camera stopped successfully.");
    } else {
      // Stop Capacitor camera preview on mobile
      await CameraPreview.stop();
      console.log("Mobile camera preview stopped successfully.");
    }
  } catch (error) {
    console.error("Error stopping the camera:", error);
    alert("An error occurred while stopping the camera. Please try again.");
  }
};

// Stop video feed for web platform
const stopWebVideoFeed = (videoElement: HTMLVideoElement) => {
  if (videoElement && videoElement.srcObject) {
    const stream = videoElement.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
    console.log("Web video feed stopped successfully.");
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
      runningMode: Capacitor.getPlatform() != "web" ? "IMAGE" : "VIDEO", // Switch mode based on platform
      numPoses: 2,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const drawingUtils = new DrawingUtils(canvasElement.getContext("2d"));

    const renderLoop = async () => {
      if (!isRendering || !poseLandmarker) return; // Exit if not rendering or landmarker is null

      let videoTime = performance.now();
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

      // Use `setTimeout` to prevent stack overflow in case of synchronous calls
      setTimeout(() => {
        if (isRendering) {
          requestAnimationFrame(renderLoop);
        }
      }, 0);
    };

    videoElement.onloadeddata = () => {
      isRendering = true;
      renderLoop(); // Start the render loop when video data is loaded
      console.log("Render loop started successfully.");
    };
  } catch (error) {
    console.error("Error initializing Pose Landmarker:", error);
    alert("Failed to initialize pose detection. Please try again.");
  }
};

// Stop pose detection and video feed
const stopPoseLandmarker = (videoElement: HTMLVideoElement) => {
  if (poseLandmarker) {
    poseLandmarker.close(); // Close the PoseLandmarker to release resources
    poseLandmarker = null;
    console.log("PoseLandmarker stopped and resources released.");
  }

  // Additionally, stop any media tracks if still active
  if (videoElement?.srcObject) {
    const tracks = (videoElement.srcObject as MediaStream).getTracks();
    tracks.forEach((track) => track.stop());
    videoElement.srcObject = null;
    console.log("Video element media tracks stopped.");
  }

  appState("Pre");
};
