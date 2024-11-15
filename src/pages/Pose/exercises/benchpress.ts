import { Exercise } from "../types";
import { DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import { calculateAngle, updateRawProp } from "./utils";

export const BenchPressExercise: Exercise = {
  raw: {
    repCount: [{ value: 0, timestamp: performance.now() / 1000 }],
    lastPressStatus: [
      { value: "Lowered", timestamp: performance.now() / 1000 },
    ],
    pressStatus: [{ value: "Lowered", timestamp: performance.now() / 1000 }],
    isBadPose: [{ value: false, timestamp: performance.now() / 1000 }],
  },
  name: "Bench Press",
  processLandmarks: (landmarks, canvasCtx) => {
    if (!landmarks || landmarks.length === 0) {
      return;
    }

    // Extract relevant landmarks for bench press analysis
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
      BenchPressExercise.raw.lastPressStatus.at(-1)?.value === "Extended" &&
      currentPressStatus === "Lowered"
    ) {
      updateRawProp(
        BenchPressExercise.raw,
        "repCount",
        (BenchPressExercise.raw.repCount.at(-1)?.value as number) + 1
      );
    }
    updateRawProp(BenchPressExercise.raw, ",pressStatus", currentPressStatus);
    updateRawProp(
      BenchPressExercise.raw,
      "lastPressStatus",
      currentPressStatus
    );

    // Determine color based on press status
    let connectorColor = "white";
    if (currentPressStatus === "Extended" || currentPressStatus === "Lowered") {
      connectorColor = "blue";
    } else if (currentPressStatus === "Mid Press") {
      connectorColor = "white";
    }

    // Bad pose detection (misalignment or insufficient extension)
    const isBadPose = averageElbowAngle < 140;
    updateRawProp(BenchPressExercise.raw, "isBadPose", isBadPose);

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

    // Display press status and rep count
    canvasCtx.font = "30px mono";
    canvasCtx.fillStyle = "yellow";
    canvasCtx.fillText(
      `Status: ${BenchPressExercise.raw.pressStatus.at(-1)?.value}`,
      10,
      30
    );
    canvasCtx.fillText(
      `Reps: ${BenchPressExercise.raw.repCount.at(-1)?.value}`,
      10,
      70
    );

    if (BenchPressExercise.raw.isBadPose.at(-1)?.value) {
      canvasCtx.fillStyle = "red";
      canvasCtx.fillText(`Bad Pose Detected!`, 10, 110);
    }

    canvasCtx.restore();
  },
};
