export interface Exercise {
  name: string;
  processLandmarks: (
    landmarks: any[],
    canvasCtx: CanvasRenderingContext2D
  ) => void;
}

export interface PoseFrame {
  timestamp: number;
  poses: Array<any>; // Replace `any` with a specific type if available
}
