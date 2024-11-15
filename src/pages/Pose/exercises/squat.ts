import { Exercise } from "../types";
import { DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import { calculateAngle, updateRawProp } from "./utils";

// Initial properties setup
export const SquatExercise: Exercise = {
  raw: {
    repCount: [{ value: 0, timestamp: performance.now() / 1000 }],
    lastSquatStatus: [
      { value: "Standing", timestamp: performance.now() / 1000 },
    ],
    squatStatus: [{ value: "Standing", timestamp: performance.now() / 1000 }],
    isBadPose: [{ value: false, timestamp: performance.now() / 1000 }],
  },
  name: "Squat",
  processLandmarks: (landmarks, canvasCtx) => {
    if (!landmarks || landmarks.length === 0) {
      return;
    }

    // Extract relevant landmarks for squat analysis
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];

    const rightHip = landmarks[24];
    const rightKnee = landmarks[26];
    const rightAnkle = landmarks[28];

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Average the knee angles
    const averageKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Classify squat status based on knee angle
    let currentSquatStatus = "Standing";
    if (averageKneeAngle < 90) {
      currentSquatStatus = "Squatting";
    } else if (averageKneeAngle < 160) {
      currentSquatStatus = "Half Squat";
    }

    // Update rep count and squat status
    if (
      SquatExercise.raw.lastSquatStatus.at(-1)?.value === "Squatting" &&
      currentSquatStatus === "Standing"
    ) {
      updateRawProp(
        SquatExercise.raw,
        "repCount",
        (SquatExercise.raw.repCount.at(-1)?.value as number) + 1
      );
    }
    updateRawProp(SquatExercise.raw, "squatStatus", currentSquatStatus);
    updateRawProp(SquatExercise.raw, "lastSquatStatus", currentSquatStatus);

    // Determine color based on squat status
    let connectorColor = "white";
    if (
      currentSquatStatus === "Standing" ||
      currentSquatStatus === "Squatting"
    ) {
      connectorColor = "blue";
    } else if (currentSquatStatus === "Half Squat") {
      connectorColor = "white";
    }

    // Bad pose detection (e.g., excessive forward lean)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const averageHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };
    const averageShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const torsoAngle = calculateAngle(
      { x: averageHip.x, y: averageHip.y + 0.1 },
      averageHip,
      averageShoulder
    );
    const isBadPose = torsoAngle < 70;
    updateRawProp(SquatExercise.raw, "isBadPose", isBadPose);

    if (isBadPose) {
      connectorColor = "red";
    }

    // Draw landmarks and connectors
    const drawingUtils = new DrawingUtils(canvasCtx);
    drawingUtils.drawLandmarks(landmarks, { color: "white", lineWidth: 2 });
    drawingUtils.drawConnectors(landmarks, window.POSE_CONNECTIONS, {
      color: connectorColor,
      lineWidth: 2,
    });

    // Display squat status and rep count
    canvasCtx.font = "30px Arial";
    canvasCtx.fillStyle = "yellow";
    canvasCtx.fillText(
      `Status: ${SquatExercise.raw.squatStatus.at(-1)?.value}`,
      10,
      30
    );
    canvasCtx.fillText(
      `Reps: ${SquatExercise.raw.repCount.at(-1)?.value}`,
      10,
      70
    );

    if (SquatExercise.raw.isBadPose.at(-1)?.value) {
      canvasCtx.fillStyle = "red";
      canvasCtx.fillText(`Bad Pose Detected!`, 10, 110);
    }

    canvasCtx.restore();
  },
};
