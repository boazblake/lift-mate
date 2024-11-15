import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Represents a single landmark with XYZ coordinates
export type Landmark = {
  x: number;
  y: number;
  z: number;
};

// Represents a collection of landmarks for a single frame
export type Pose = Array<NormalizedLandmark>;
export type Poses = Array<Pose>;
// Represents a single frame with timestamp and one or more poses
export interface PoseFrame {
  timestamp: number; // Unix timestamp in seconds
  poses: Poses; // Array of poses (e.g., multiple people or poses per frame)
}

export type RawExerciseData = Array<{
  value: string | number | boolean;
  timestamp: number;
}>;

export type RawExercise = Record<string, RawExerciseData>;
export interface Exercise {
  raw: RawExercise;
  name: string;
  processLandmarks: (
    landmarks: NormalizedLandmark[],
    canvasCtx: CanvasRenderingContext2D
  ) => void;
}

// Type for each connection between two landmarks by their indices
type PoseConnection = [number, number];

// Define the POSE_CONNECTIONS as an array of PoseConnection pairs
declare global {
  interface Window {
    POSE_CONNECTIONS: PoseConnection[];
  }
}
