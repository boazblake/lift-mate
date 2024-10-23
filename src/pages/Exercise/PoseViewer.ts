import m from "mithril";
import { appState, startDetection, stopDetection } from "./model";

const PoseViewer = () => {
  let videoElement: HTMLVideoElement | null = null;
  let canvasElement: HTMLCanvasElement | null = null;

  return {
    onremove: () => videoElement && stopDetection(videoElement), // Stop detection when component is removed
    view: () => {
      return m(
        "section",

        // Hidden video feed for pose detection
        m("video#video-feed", {
          oncreate: ({ dom }) => (videoElement = dom), // Store video DOM element in its own oncreate
          playsinline: true,
          autoplay: true,
          muted: true,
          style: { display: "none" },
        }),
        // Canvas for pose overlay
        m("canvas", {
          oncreate: ({ dom }) => (canvasElement = dom), // Store canvas DOM element in its own oncreate
          width: "1920px",
          height: "1080px",
          style: {
            width: "100%" /* This makes the canvas width flexible */,
            height: "auto" /* This maintains the aspect ratio */,
            maxWidth:
              "100%" /* Prevent the canvas from stretching beyond its container */,
            display: "block" /* Avoid extra spacing below the canvas */,
          },
        }),

        // Action buttons
        m("aside.action-buttons", [
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
        ])
      );
    },
  };
};

export default PoseViewer;
