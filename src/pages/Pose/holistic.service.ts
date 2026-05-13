import { holistic, elements, exercise, coaching } from "./store";
import m from "mithril";
import { Capacitor } from "@capacitor/core";
import { CameraPreview } from "@capacitor-community/camera-preview";
import CapacitorMediaPipe from "./media-pipe";
import { synthesizeFeedbackCues } from "@/domain/exrx";

// This service abstracts the MediaPipe functionality for both web and native platforms.
// On the web, it uses the JS-based @mediapipe/tasks-vision library.
// On native, it uses the custom CapacitorMediaPipe plugin.
// A Vite alias swaps the native plugin for a web shim during web builds.

const platform = Capacitor.getPlatform();
const isNative = platform !== "web";
let isSendingNativeFrame = false;
let poseLandmarker: any;
let faceLandmarker: any;
let handLandmarker: any;
const TASKS_VISION_VERSION = "0.10.22-rc.20250304";
let lastUiRedrawAt = 0;
let lastExerciseName = "";
let squatWasDown = false;
let pressWasLowered = false;
let pressDownFrames = 0;
let pressUpFrames = 0;
let lastRepAtMs = 0;
let isFrameLoopRunning = false;

const redrawPoseUi = () => {
  const now = performance.now();
  if (now - lastUiRedrawAt < 120) return;
  lastUiRedrawAt = now;
  m.redraw();
};

type HolisticInitOptions = {
  modelComplexity?: 'full' | 'lite';
  smoothLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
};

const computeAngle = (a: any, b: any, c: any): number => {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
};

const elbowsFlexed = (elbowAngle: number) => elbowAngle <= 100;

const analyzePose = (poseLandmarks: any[]) => {
  if (!poseLandmarks || poseLandmarks.length < 29) {
    return { repCount: coaching().repCount, status: "No pose", cue: "Step into frame" };
  }

  const visible = poseLandmarks.filter(
    (lm) => typeof lm.visibility === "number" && lm.visibility > 0.45
  ).length;
  if (visible < 8) {
    return { repCount: coaching().repCount, status: "Low confidence", cue: "Improve lighting or step back" };
  }

  const selected = exercise()?.meta?.name || "";
  const prev = coaching();
  const selectedCues = selected ? synthesizeFeedbackCues(selected) : [];
  const cueAt = (index: number, fallback: string) => selectedCues[index] || fallback;

  if (selected !== lastExerciseName) {
    lastExerciseName = selected;
    squatWasDown = false;
    pressWasLowered = false;
    pressDownFrames = 0;
    pressUpFrames = 0;
    lastRepAtMs = 0;
  }

  if (selected === "Squat") {
    const left = computeAngle(poseLandmarks[23], poseLandmarks[25], poseLandmarks[27]);
    const right = computeAngle(poseLandmarks[24], poseLandmarks[26], poseLandmarks[28]);
    const knee = (left + right) / 2;
    const status = knee < 90 ? "Down" : knee < 160 ? "Mid" : "Up";
    if (status === "Down") squatWasDown = true;
    const completed = squatWasDown && status === "Up";
    if (completed) squatWasDown = false;
    const repCount = completed ? prev.repCount + 1 : prev.repCount;
    return {
      repCount,
      status,
      cue: status === "Mid" ? cueAt(0, "Go lower") : status === "Down" ? cueAt(1, "Drive up") : cueAt(2, "Control descent"),
    };
  }

  if (selected === "Bench Press" || selected === "Overhead Press") {
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];
    const leftElbow = poseLandmarks[13];
    const rightElbow = poseLandmarks[14];
    const leftWrist = poseLandmarks[15];
    const rightWrist = poseLandmarks[16];
    const nose = poseLandmarks[0];

    const left = computeAngle(leftShoulder, leftElbow, leftWrist);
    const right = computeAngle(rightShoulder, rightElbow, rightWrist);
    const elbow = (left + right) / 2;

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;
    const avgNoseY = nose?.y ?? 0.45;

    const wristsAboveShoulders = avgWristY < avgShoulderY - 0.03;
    const wristsNearShoulderLine = avgWristY > avgShoulderY - 0.01;
    const wristsNearHeadLevel = avgWristY < avgNoseY + 0.04;

    const isOverheadPress = selected === "Overhead Press";

    const isLowered = isOverheadPress
      ? elbowsFlexed(elbow) && wristsNearShoulderLine
      : elbow <= 95;

    const isExtended = isOverheadPress
      ? elbow >= 155 && wristsAboveShoulders && wristsNearHeadLevel
      : elbow >= 155;

    pressDownFrames = isLowered ? pressDownFrames + 1 : 0;
    pressUpFrames = isExtended ? pressUpFrames + 1 : 0;

    if (pressDownFrames >= 2) pressWasLowered = true;

    const now = performance.now();
    const canCountRep = now - lastRepAtMs > 450;
    const completed = pressWasLowered && pressUpFrames >= 2 && canCountRep;

    if (completed) {
      pressWasLowered = false;
      pressDownFrames = 0;
      pressUpFrames = 0;
      lastRepAtMs = now;
    }

    const repCount = completed ? prev.repCount + 1 : prev.repCount;
    const status = isExtended ? "Extended" : isLowered ? "Lowered" : "Mid";
    return {
      repCount,
      status,
      cue:
        status === "Mid"
          ? cueAt(0, "Press through")
          : status === "Lowered"
            ? cueAt(1, "Drive up")
            : cueAt(2, "Lower with control"),
    };
  }

  return {
    repCount: prev.repCount,
    status: "Ready",
    cue: cueAt(0, "Select an exercise"),
  };
};

// Web-specific initialization
const createHolisticLandmarker = async () => {
  const { PoseLandmarker, FaceLandmarker, HandLandmarker, FilesetResolver } =
    await import("@mediapipe/tasks-vision");

  const vision = await FilesetResolver.forVisionTasks(
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`
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
  if (!isFrameLoopRunning) return;
  const video = elements.video();
  if (!isNative && (!video || video.paused || video.ended)) {
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

      const currentHolisticData: {
        poseLandmarks: any[];
        faceLandmarks: any[];
        leftHandLandmarks: any[];
        rightHandLandmarks: any[];
      } = {
        poseLandmarks: poseResult.landmarks[0] || [],
        faceLandmarks: faceResult.faceLandmarks[0] || [],
        leftHandLandmarks: [],
        rightHandLandmarks: [],
      };

      if (handResult.landmarks && handResult.handednesses) {
        handResult.handednesses.forEach((handedness: any, index: number) => {
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
      coaching(analyzePose(currentHolisticData.poseLandmarks));
      redrawPoseUi();
    } else if (!isSendingNativeFrame) {
      isSendingNativeFrame = true;
      const frame = await CameraPreview.captureSample({ quality: 50 });
      if (frame?.value) {
        await CapacitorMediaPipe.send({ image: frame.value });
      }
      isSendingNativeFrame = false;
    }
  } catch (error) {
    isSendingNativeFrame = false;
    console.error("Error in sendFrames:", error);
  }

  if (isFrameLoopRunning) requestAnimationFrame(sendFrames);
};

export const holisticService = {
  initialize: async (options: HolisticInitOptions = {}) => {
    try {
      if (platform === "web") {
        await createHolisticLandmarker();
      } else {
        await CapacitorMediaPipe.initialize({
          modelComplexity: options.modelComplexity || 'full',
          smoothLandmarks: options.smoothLandmarks ?? true,
          minDetectionConfidence: options.minDetectionConfidence || 0.5,
          minTrackingConfidence: options.minTrackingConfidence || 0.5,
        });
        CapacitorMediaPipe.addListener("holisticResults", (results) => {
          const next = {
            poseLandmarks: results.poseLandmarks || [],
            faceLandmarks: results.faceLandmarks || [],
            leftHandLandmarks: results.leftHandLandmarks || [],
            rightHandLandmarks: results.rightHandLandmarks || [],
          };
          holistic.data(next);
          coaching(analyzePose(next.poseLandmarks));
          redrawPoseUi();
        });
      }
      holistic.ready(true);
      isFrameLoopRunning = false;
    } catch (error) {
      console.error("MediaPipe initialization failed:", error);
      holistic.ready(false);
      throw error;
    }
  },

  sendFrames,

  startFrameLoop: () => {
    if (isFrameLoopRunning) return;
    isFrameLoopRunning = true;
    requestAnimationFrame(sendFrames);
  },

  close: async () => {
    isFrameLoopRunning = false;
    if (platform === "web") {
      if (poseLandmarker) await poseLandmarker.close();
      if (faceLandmarker) await faceLandmarker.close();
      if (handLandmarker) await handLandmarker.close();
      poseLandmarker = null;
      faceLandmarker = null;
      handLandmarker = null;
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
    coaching({ repCount: 0, status: "Ready", cue: "Select exercise and start" });
  },
};
