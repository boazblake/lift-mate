import { holistic, camera, elements } from "./store";
import { Capacitor } from "@capacitor/core";

export const holisticService = {
  initialize: async () => {
    try {
      const Holistic = (window as any).Holistic;
      if (!Holistic) throw new Error("MediaPipe Holistic not loaded");

      const instance = new Holistic({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      instance.setOptions({
        modelComplexity: Capacitor.isNativePlatform() ? 0 : 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: false,
      });

      instance.onResults((results: any) => {
        holistic.data({
          poseLandmarks: results.poseLandmarks || [],
          faceLandmarks: results.faceLandmarks || [],
          leftHandLandmarks: results.leftHandLandmarks || [],
          rightHandLandmarks: results.rightHandLandmarks || [],
        });
      });

      holistic.instance(instance);
      holistic.ready(true);
    } catch (error) {
      console.error("MediaPipe initialization failed:", error);
      holistic.ready(false);
    }
  },

  sendFrames: async () => {
    const video = elements.video();
    if (!video || video.paused || video.ended || !holistic.instance()) {
      requestAnimationFrame(holisticService.sendFrames);
      return;
    }
    await holistic.instance().send({ image: video });
    requestAnimationFrame(holisticService.sendFrames);
  },

  close: async () => {
    if (holistic.instance()) {
      await holistic.instance().close();
      holistic.instance(null);
    }
    holistic.ready(false);
    holistic.data({
      poseLandmarks: [],
      faceLandmarks: [],
      leftHandLandmarks: [],
      rightHandLandmarks: [],
    });
  },
};
