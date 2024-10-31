import { Exercise } from "../types";
import { DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

// Helper function to calculate the angle between three points
const calculateAngle = (
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
  pointC: { x: number; y: number }
): number => {
  const radians =
    Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
    Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
};

// Variables for rep counting and tracking
let lastSquatStatus = "Standing";
let repCount = 0;

export const SquatExercise: Exercise = {
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
    let squatStatus = "Standing";
    if (averageKneeAngle < 90) {
      squatStatus = "Squatting";
    } else if (averageKneeAngle < 160) {
      squatStatus = "Half Squat";
    }

    // Rep counting logic
    if (lastSquatStatus === "Squatting" && squatStatus === "Standing") {
      repCount += 1;
    }
    lastSquatStatus = squatStatus;

    // Provide visual feedback on the canvas
    canvasCtx.save();

    // Determine color based on squat status
    let connectorColor = "white"; // Default color

    if (squatStatus === "Standing" || squatStatus === "Squatting") {
      // At the top or bottom of the movement
      connectorColor = "blue";
    } else if (squatStatus === "Half Squat") {
      // In between top and bottom
      connectorColor = "white";
    }

    // Bad pose detection (e.g., excessive forward lean)
    let isBadPose = false;

    // Calculate torso angle (hip-shoulder angle)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    // Average hip and shoulder positions
    const averageHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    const averageShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    // Calculate torso angle
    const torsoAngle = calculateAngle(
      { x: averageHip.x, y: averageHip.y + 0.1 }, // Slightly offset to create a vertical reference
      averageHip,
      averageShoulder
    );

    // Check for excessive forward lean (e.g., torso angle less than 70 degrees)
    if (torsoAngle < 70) {
      isBadPose = true;
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

    // Display squat status and rep count
    canvasCtx.font = "30px Arial";
    canvasCtx.fillStyle = "yellow";
    canvasCtx.fillText(`Status: ${squatStatus}`, 10, 30);
    canvasCtx.fillText(`Reps: ${repCount}`, 10, 70);

    if (isBadPose) {
      canvasCtx.fillStyle = "red";
      canvasCtx.fillText(`Bad Pose Detected!`, 10, 110);
    }

    canvasCtx.restore();
  },
};
