// Import external types
import { NormalizedLandmark } from "@mediapipe/tasks-vision";
declare global {
  interface Window {
    POSE_CONNECTIONS: PoseConnection[]; // Array of landmark connections
  }
}

// --- CORE TYPES ---
export type PoseConnection = [number, number];
export type Pose = Array<NormalizedLandmark>;

export enum Mode {
  RealTime,
  Record,
  Replay,
}

export interface BaseFrameMeta {
  id: string;
  isBadPose?: boolean;
}

// Unified metadata for exercises
export interface BaseExerciseMeta extends BaseFrameMeta {
  [key: string]: any; // Extendable for exercise-specific metadata
}

export interface MetadataEntry {
  label: string;
  value: string | number | boolean;
  color?: string;
}

export interface FeedbackConfig<T extends BaseExerciseMeta = BaseExerciseMeta> {
  id: string;
  canvasCtx?: CanvasRenderingContext2D;
  landmarks: Pose;
  poseConnections?: PoseConnection[];
  metadata?: MetadataEntry[];
  frameMeta?: T;
  visualProps?: Partial<{
    landmarkColor: string;
    connectorColor: string;
    lineWidth: number;
    font: string;
    fontSize: string;
  }>;
}

export interface PoseFrame {
  timestamp: number;
  poses: Pose[];
  meta?: BaseExerciseMeta;
}

// --- EXERCISE TYPES ---
export interface RawExerciseProp<T = any> {
  value: T;
  timestamp: number;
  meta?: BaseExerciseMeta;
}

export interface RawExercise {
  [key: string]: RawExerciseProp[];
}

export interface ExerciseMeta {
  id: string;
  name: string;
  raw: RawExercise;
}

export interface ExerciseBase {
  id: string; // Unique identifier
  name: string; // Display name
  meta: ExerciseMeta; // Metadata for the exercise
  injectMetadata?: (
    landmarks: Pose,
    frameMeta: BaseFrameMeta
  ) => Partial<FeedbackConfig>; // Optional metadata injection function
}

export interface RealTimeExercise extends ExerciseBase {
  processLandmarks: (
    landmarks: Pose,
    canvasCtx: CanvasRenderingContext2D
  ) => void; // Process landmarks live
}

export interface ReplayExercise extends ExerciseBase {
  replayLandmarks: (
    canvasCtx: CanvasRenderingContext2D,
    playbackSpeed?: number
  ) => void; // Replay landmarks
}

// Unified Exercise Type
export type Exercise = RealTimeExercise | ReplayExercise;

// --- PIPELINE TYPES ---
export interface PipelineContext<
  T extends BaseExerciseMeta = BaseExerciseMeta
> {
  mode: Mode;
  landmarks: Pose;
  frameMeta?: T;
  canvasCtx?: CanvasRenderingContext2D;
  stage?: string;
}

export type InjectedMetadata = Partial<FeedbackConfig> & {
  landmarkColor?: string;
  connectorColor?: string;
  lineWidth?: number;
  font?: string;
  fontSize?: string;
};

export interface HolisticData {
  poseLandmarks: NormalizedLandmark[];
  faceLandmarks: NormalizedLandmark[];
  leftHandLandmarks: NormalizedLandmark[];
  rightHandLandmarks: NormalizedLandmark[];
}

// // --- CORE TYPES ---
//
// // Connections between landmarks
// export type PoseConnection = [number, number];
//
// // Pose data structure (an array of landmarks)
// export type Pose = Array<NormalizedLandmark>;
//
// // Modes for pipeline operations
// export enum Mode {
//   RealTime,
//   Record,
//   Replay,
// }
//
// // Base metadata for frames
// export interface BaseFrameMeta {
//   id: string; // Identifier for the frame or exercise
//   isBadPose?: boolean; // Indicates whether the pose is considered bad
// }
//
// // General metadata for posture analysis
// export interface GeneralMeta extends BaseFrameMeta {
//   poseStability?: number; // Confidence or stability score
// }
//
// // Metadata for specific exercises
// export interface OverheadPressMeta extends GeneralMeta {
//   averageElbowAngle?: number; // Calculated elbow angle
// }
//
// // Feedback configuration for rendering poses and metadata
// export interface FeedbackConfig<T extends BaseFrameMeta = BaseFrameMeta> {
//   id: string; // Exercise ID
//   canvasCtx?: CanvasRenderingContext2D; // Canvas context
//   landmarks: Pose; // Landmarks
//   poseConnections?: PoseConnection[]; // Optional connections
//   metadata?: MetadataEntry[]; // Metadata for rendering
//   frameMeta?: T; // Optional frame metadata
//   visualProps?: Partial<{
//     landmarkColor: string;
//     connectorColor: string;
//     lineWidth: number;
//     font: string;
//     fontSize: string;
//   }>; // Visual configuration
// }
//
// // Individual metadata entry for rendering or feedback
// export interface MetadataEntry {
//   label: string; // Metadata label
//   value: string | number | boolean; // Metadata value
//   color?: string; // Optional color
// }
//
// export interface PoseFrame {
//   timestamp: number; // Time of the frame in seconds
//   poses: Pose[]; // Array of poses in the frame
//   meta?: BaseFrameMeta; // Optional metadata for the frame
//   exercise?: Exercise; // Associated exercise
// }
//
// // Recorded frame structure
// export interface RecordedFrame<T extends BaseFrameMeta = BaseFrameMeta> {
//   timestamp: number; // Frame timestamp in seconds
//   pose: Pose; // Pose data
//   meta: T; // Frame-specific metadata
// }
//
// // --- EXERCISE TYPES ---
//
// // Raw tracked property of an exercise
// export interface RawExerciseProp<T = any> {
//   value: T; // Tracked value
//   timestamp: number; // Time of update
//   meta?: BaseFrameMeta; // Optional metadata
// }
//
// // Collection of raw exercise properties
// export interface RawExercise {
//   [key: string]: RawExerciseProp[]; // Tracks properties like "repCount", "pressStatus"
// }
//
// // Metadata for an exercise
// export interface ExerciseMeta {
//   id: string; // Unique identifier for the exercise
//   name: string; // Display name of the exercise
//   raw: RawExercise; // Collection of raw exercise properties
// }
//
// // Base exercise interface
// export interface ExerciseBase {
//   id: string;
//   name: string;
//   meta: ExerciseMeta;
// }
//
// export interface RealTimeExercise extends ExerciseBase {
//   processLandmarks: (
//     landmarks: Pose,
//     canvasCtx: CanvasRenderingContext2D
//   ) => void;
// }
//
// export interface ReplayExercise extends ExerciseBase {
//   replayLandmarks: (
//     canvasCtx: CanvasRenderingContext2D,
//     playbackSpeed?: number
//   ) => void;
// }
//
// export const isRealTimeExercise = (
//   exercise: Exercise
// ): exercise is RealTimeExercise => {
//   return (exercise as RealTimeExercise).processLandmarks !== undefined;
// };
//
// export const isReplayExercise = (
//   exercise: Exercise
// ): exercise is ReplayExercise => {
//   return (exercise as ReplayExercise).replayLandmarks !== undefined;
// };
//
// // Unified type for exercises
// export type Exercise = RealTimeExercise | ReplayExercise;
//
// // --- PIPELINE TYPES ---
//
// // Pipeline context for processing
// export interface PipelineContext<T extends BaseFrameMeta = BaseFrameMeta> {
//   mode: Mode;
//   landmarks: Pose;
//   frameMeta?: T; // Optional generic for context-specific metadata
//   canvasCtx?: CanvasRenderingContext2D;
//   stage?: string; // Current stage in the pipeline
// }
//
// export interface BaseExerciseMeta extends BaseFrameMeta {
//   [key: string]: any; // Allow extensibility for exercise-specific metadata
// }
