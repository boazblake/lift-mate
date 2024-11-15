import { RawExercise } from "../types";
// Helper function to calculate the angle between three points
export const calculateAngle = (
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

// Helper to update value and timestamp with `performance.now()`
export const updateRawProp = (
  raw: RawExercise,
  prop: string,
  newValue: any
) => {
  const currentTime = performance.now() / 1000; // Current time in seconds
  const obj = {
    value: newValue,
    timestamp: currentTime,
  };
  raw[prop].push(obj);
};
