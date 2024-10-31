export interface Exercise {
  name: string;
  processLandmarks: (
    landmarks: any[],
    canvasCtx: CanvasRenderingContext2D
  ) => void;
}
