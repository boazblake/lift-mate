import m from "mithril";
import {
  appState,
  startDetection,
  stopDetection,
  setExerciseHandler,
  recordedPoses,
} from "./model";
import { SquatExercise } from "./exercises/squat";
import { Exercise } from "./exercises/types";

const exercises: Exercise[] = [
  SquatExercise,
  // Add other exercises here
];

const PoseViewer = () => {
  let videoElement: HTMLVideoElement | null = null;
  let canvasElement: HTMLCanvasElement | null = null;

  return {
    view: () => {
      return m("section", [
        // Video element
        m("video", {
          oncreate: ({ dom }) => {
            videoElement = dom as HTMLVideoElement;
          },
          playsinline: true,
          autoplay: true,
          muted: true,
          style: { display: "none" },
        }),
        // Canvas element
        m("canvas", {
          oncreate: ({ dom }) => {
            canvasElement = dom as HTMLCanvasElement;
          },
          width: "1280px",
          height: "720px",
          style: {
            width: "100%",
            height: "80vh",
            display: "block",
          },
        }),
        // Div for mobile camera preview
        m("div#video-feed", {
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1, // Ensure it stays behind other elements
          },
        }),
        // Exercise selection UI
        m(".exercise-selection", [
          m("label", { for: "exercise-select" }, "Select Exercise: "),
          m(
            "select#exercise-select",
            {
              onchange: (e: Event) => {
                const selectedName = (e.target as HTMLSelectElement).value;
                const selectedExercise =
                  exercises.find((ex) => ex.name === selectedName) || null;
                setExerciseHandler(selectedExercise);
              },
            },
            [
              m("option", { value: "" }, "None"),
              ...exercises.map((ex) =>
                m("option", { value: ex.name }, ex.name)
              ),
            ]
          ),
        ]),
        // Recording status (optional)
        m(".recording-status", [
          m("pre", JSON.stringify(recordedPoses(), null, 2)),
        ]),
        // Action buttons
        m("aside.action-buttons", [
          m(
            "ion-button",
            {
              onclick: () => {
                if (videoElement && canvasElement) {
                  startDetection(videoElement, canvasElement);
                }
              },
            },
            appState() === "Pre" ? "Start Pose Detection" : "Retake"
          ),
          appState() === "Streaming"
            ? m(
                "ion-button",
                {
                  onclick: () => {
                    console.log("Stopping detection");
                    if (videoElement) stopDetection(videoElement);
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
