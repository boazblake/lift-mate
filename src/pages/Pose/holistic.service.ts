import { holistic, elements } from "./store";
import { Capacitor } from "@capacitor/core";
import {
  PoseLandmarker,
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let CapacitorMediaPipe;
let poseLandmarker;
let faceLandmarker;
let handLandmarker;
let runningMode = "VIDEO";

const createHolisticLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU",
    },
    runningMode,
    numPoses: 1,
  });

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
    },
    runningMode,
    numFaces: 1,
  });

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU",
    },
    runningMode,
    numHands: 2,
  });

  holistic.ready(true);
};

const initializeWeb = async () => {
  try {
    await createHolisticLandmarker();
  } catch (error) {
    console.error("MediaPipe initialization failed:", error);
    holistic.ready(false);
  }
};

const initializeNative = async () => {
  try {
    const nativeModule = await import("capacitor-media-pipe");
    CapacitorMediaPipe = nativeModule.CapacitorMediaPipe;
    await CapacitorMediaPipe.initialize();
    CapacitorMediaPipe.addListener("holisticResults", (results) => {
      holistic.data({
        poseLandmarks: results.poseLandmarks || [],
        faceLandmarks: results.faceLandmarks || [],
        leftHandLandmarks: results.leftHandLandmarks || [],
        rightHandLandmarks: results.rightHandLandmarks || [],
      });
    });
    holistic.ready(true);
  } catch (error) {
    console.error("MediaPipe initialization failed:", error);
    holistic.ready(false);
  }
};

const sendFramesWeb = async () => {
  const video = elements.video();
  if (!video || video.paused || video.ended) {
    requestAnimationFrame(sendFramesWeb);
    return;
  }

  try {
    const nowInMs = performance.now();
    const poseResult = poseLandmarker.detectForVideo(video, nowInMs);
    const faceResult = faceLandmarker.detectForVideo(video, nowInMs);
    const handResult = handLandmarker.detectForVideo(video, nowInMs);

    console.log("Hand result:", handResult);

    const currentHolisticData = {
      poseLandmarks: poseResult.landmarks[0] || [],
      faceLandmarks: faceResult.faceLandmarks[0] || [],
      leftHandLandmarks: [],
      rightHandLandmarks: [],
    };

    if (handResult.landmarks && handResult.handednesses) {
      handResult.handednesses.forEach((handedness, index) => {
        if (handedness[0].categoryName === 'Left') {
          currentHolisticData.leftHandLandmarks.push(...handResult.landmarks[index]);
        } else if (handedness[0].categoryName === 'Right') {
          currentHolisticData.rightHandLandmarks.push(...handResult.landmarks[index]);
        }
      });
    }
    holistic.data(currentHolisticData);
  } catch (error) {
    console.error("Error in sendFramesWeb:", error);
  }

  requestAnimationFrame(sendFramesWeb);
};

const sendFramesNative = async () => {
  const video = elements.video();
  if (!video || video.paused || video.ended) {
    requestAnimationFrame(sendFramesNative);
    return;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg").split(",")[1];
      await CapacitorMediaPipe.send({ image: imageData });
    }
  } catch (error) {
    console.error("Error sending frame to MediaPipe plugin:", error);
  }
  requestAnimationFrame(sendFramesNative);
};

export const holisticService = {
  initialize: async () => {
    const platform = Capacitor.getPlatform();
    if (platform === "web") {
      await initializeWeb();
    } else {
      await initializeNative();
    }
  },

  sendFrames: async () => {
    const platform = Capacitor.getPlatform();
    if (platform === "web") {
      await sendFramesWeb();
    } else {
      await sendFramesNative();
    }
  },

  close: async () => {
    const platform = Capacitor.getPlatform();
    if (platform === "web") {
      await poseLandmarker.close();
      await faceLandmarker.close();
      await handLandmarker.close();
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