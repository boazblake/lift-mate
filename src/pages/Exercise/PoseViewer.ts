import m from "mithril";
import { appState, startDetection, stopCamera } from "./model";

const PoseViewer = () => {
  let videoElement: HTMLVideoElement | null = null;
  let canvasElement: HTMLCanvasElement | null = null;
  stopCamera(videoElement);
  return {
    onremove: () => videoElement && stopCamera(videoElement), // Stop detection when component is removed
    view: () => {
      return m(
        "section",
        m("#video-feed", { style: { display: "hidden" } }),
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
          width: "1920px",
          height: "1080px",
          style: {
            width: "100%" /* This makes the canvas width flexible */,
            height: "90vh" /* This maintains the aspect ratio */,
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
                    videoElement && stopCamera(videoElement);
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
