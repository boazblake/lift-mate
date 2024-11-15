import { Exercise } from "../types";
import { calculateAngle, updateRawProp } from "./utils";
import { DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

// Initial properties setup
export const OverheadPressExercise: Exercise = {
  raw: {
    repCount: [{ value: 0, timestamp: performance.now() / 1000 }],
    lastPressStatus: [
      { value: "Lowered", timestamp: performance.now() / 1000 },
    ],
    pressStatus: [{ value: "Lowered", timestamp: performance.now() / 1000 }],
    isBadPose: [{ value: false, timestamp: performance.now() / 1000 }],
  },
  name: "Overhead Press",
  processLandmarks: (landmarks, canvasCtx) => {
    if (!landmarks || landmarks.length === 0) {
      return;
    }

    // Extract relevant landmarks for overhead press analysis
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];

    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    // Average the elbow angles
    const averageElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // Classify press status based on elbow angle
    let currentPressStatus = "Lowered";
    if (averageElbowAngle > 160) {
      currentPressStatus = "Extended";
    } else if (averageElbowAngle > 90) {
      currentPressStatus = "Mid Press";
    }

    // Update rep count and press status
    if (
      OverheadPressExercise.raw.lastPressStatus.at(-1)?.value === "Extended" &&
      currentPressStatus === "Lowered"
    ) {
      updateRawProp(
        OverheadPressExercise.raw,
        "repCount",
        (OverheadPressExercise.raw.repCount.at(-1)?.value as number) + 1
      );
    }
    updateRawProp(OverheadPressExercise.raw, "pressStatus", currentPressStatus);
    updateRawProp(
      OverheadPressExercise.raw,
      "lastPressStatus",
      currentPressStatus
    );

    // Determine color based on press status
    let connectorColor = "white"; // Default color

    if (currentPressStatus === "Extended" || currentPressStatus === "Lowered") {
      connectorColor = "blue"; // Top or bottom of the movement
    } else if (currentPressStatus === "Mid Press") {
      connectorColor = "white"; // In-between position
    }

    // Bad pose detection (e.g., excessive forward lean)
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Average hip and shoulder positions
    const averageHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    const averageShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    // Calculate torso angle for leaning detection
    const torsoAngle = calculateAngle(
      { x: averageHip.x, y: averageHip.y + 0.1 },
      averageHip,
      averageShoulder
    );

    // Check for excessive forward lean
    const isBadPose = torsoAngle < 70;
    updateRawProp(OverheadPressExercise.raw, "isBadPose", isBadPose);

    if (isBadPose) {
      connectorColor = "red";
    }

    // Draw landmarks and connectors
    const drawingUtils = new DrawingUtils(canvasCtx);
    drawingUtils.drawLandmarks(landmarks, {
      color: "white", // Landmarks stay white
      lineWidth: 2,
    });
    drawingUtils.drawConnectors(landmarks, window.POSE_CONNECTIONS, {
      color: connectorColor,
      lineWidth: 2,
    });

    // Display press status and rep count on the canvas
    canvasCtx.font = "30px Montserrat";
    canvasCtx.fillStyle = "yellow";
    canvasCtx.fillText(
      `Status: ${OverheadPressExercise.raw.pressStatus.at(-1)?.value}`,
      10,
      30
    );
    canvasCtx.fillText(
      `Reps: ${OverheadPressExercise.raw.repCount.at(-1)?.value}`,
      10,
      70
    );

    if (OverheadPressExercise.raw.isBadPose.at(-1)?.value) {
      canvasCtx.fillStyle = "red";
      canvasCtx.fillText(`Bad Pose Detected!`, 10, 110);
    }

    canvasCtx.restore();
  },
};
