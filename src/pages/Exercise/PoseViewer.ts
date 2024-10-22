import m from "mithril";
import { appState, startDetection, stopDetection } from "./model";

const PoseViewer = () => {
  let videoElement: HTMLVideoElement | null = null;
  let canvasElement: HTMLCanvasElement | null = null;

  return {
    onremove: () => videoElement && stopDetection(videoElement), // Stop detection when component is removed
    view: () => {
      return m("section", [
        // Hidden video feed for pose detection
        m("video", {
          oncreate: ({ dom }) => (videoElement = dom), // Store video DOM element in its own oncreate
          playsinline: true,
          autoplay: true,
          muted: true,
          style: { display: "none" },
        }),

        // Canvas for pose overlay
        m("canvas", {
          oncreate: ({ dom }) => (canvasElement = dom), // Store canvas DOM element in its own oncreate
          width: 1920,
          height: 1080,
        }),

        // Action buttons
        m("div.action-buttons", [
          // Start or Retake Pose Detection button
          m(
            "ion-button",
            {
              onclick: () => {
                videoElement &&
                  canvasElement &&
                  startDetection(videoElement, canvasElement);
              },
            },
            appState() === "Pre" ? "Start Pose Detection" : "Retake"
          ),

          // Stop Pose Detection button (visible only when streaming)
          appState() === "Streaming"
            ? m(
              "ion-button",
              {
                onclick: () => {
                  videoElement && stopDetection(videoElement);
                },
              },
              "Stop"
            )
            : null,
        ]),
      ]);
    },
  };
};

export default PoseViewer;
