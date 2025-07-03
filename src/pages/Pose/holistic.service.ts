import { holistic, elements } from "./store";
import { Capacitor } from "@capacitor/core";
import CapacitorMediaPipe from "./media-pipe";

// This service abstracts the MediaPipe functionality for both web and native platforms.
// On the web, it uses the JS-based @mediapipe/tasks-vision library.
// On native, it uses the custom CapacitorMediaPipe plugin.
// A Vite alias swaps the native plugin for a web shim during web builds.

const platform = Capacitor.getPlatform();
let poseLandmarker;
let faceLandmarker;
let handLandmarker;

// Web-specific initialization
const createHolisticLandmarker = async () => {
  const {
    PoseLandmarker,
    FaceLandmarker,
    HandLandmarker,
    FilesetResolver,
  } = await import("@mediapipe/tasks-vision");

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
};

// This function runs on a continuous loop to process video frames.
const sendFrames = async () => {
  const video = elements.video();
  if (!video || video.paused || video.ended) {
    requestAnimationFrame(sendFrames);
    return;
  }

  try {
    if (platform === "web") {
      // On the web, we process the frame with the JS library and manually combine the results.
      const nowInMs = performance.now();
      const poseResult = poseLandmarker.detectForVideo(video, nowInMs);
      const faceResult = faceLandmarker.detectForVideo(video, nowInMs);
      const handResult = handLandmarker.detectForVideo(video, nowInMs);

      const currentHolisticData = {
        poseLandmarks: poseResult.landmarks[0] || [],
        faceLandmarks: faceResult.faceLandmarks[0] || [],
        leftHandLandmarks: [],
        rightHandLandmarks: [],
      };

      if (handResult.landmarks && handResult.handednesses) {
        handResult.handednesses.forEach((handedness, index) => {
          if (handedness[0].categoryName === "Left") {
            currentHolisticData.leftHandLandmarks.push(
              ...handResult.landmarks[index]
            );
          } else if (handedness[0].categoryName === "Right") {
            currentHolisticData.rightHandLandmarks.push(
              ...handResult.landmarks[index]
            );
          }
        });
      }
      holistic.data(currentHolisticData);
    } else {
      // On native, we send the frame to the native plugin for processing.
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg").split(",")[1];
        await CapacitorMediaPipe.send({ image: imageData });
      }
    }
  } catch (error) {
    console.error("Error in sendFrames:", error);
  }

  requestAnimationFrame(sendFrames);
};

export const holisticService = {
  initialize: async (options = {}) => {
    try {
      if (platform === "web") {
        await createHolisticLandmarker();
      } else {
        await CapacitorMediaPipe.initialize(options);
        CapacitorMediaPipe.addListener("holisticResults", (results) => {
          holistic.data({
            poseLandmarks: results.poseLandmarks || [],
            faceLandmarks: results.faceLandmarks || [],
            leftHandLandmarks: results.leftHandLandmarks || [],
            rightHandLandmarks: results.rightHandLandmarks || [],
          });
        });
      }
      holistic.ready(true);
    } catch (error) {
      console.error("MediaPipe initialization failed:", error);
      holistic.ready(false);
    }
  },

  sendFrames,

  close: async () => {
    if (platform === "web") {
      if (poseLandmarker) await poseLandmarker.close();
      if (faceLandmarker) await faceLandmarker.close();
      if (handLandmarker) await handLandmarker.close();
    } else {
      await CapacitorMediaPipe.close();
    }
    holistic.ready(false);
    holistic.data({
      poseLandmarks: [],
      faceLandmarks: [],
      leftHandLandmarks: [],
      rightHandLandmarks: [],
    });
  },
};

