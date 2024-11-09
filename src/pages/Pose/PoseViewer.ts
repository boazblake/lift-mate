import m from "mithril";
import {
  state,
  startDetection,
  stopDetection,
  setExerciseHandler,
  setCameraHandler,
} from "./model";
import { Exercise } from "./exercises/types";
import { SquatExercise } from "./exercises/squat";

const exercises: Exercise[] = [SquatExercise];

const PoseViewer = () => {
  return {
    view: () => {
      return m("section.pose-viewer", [
        m("video", {
          oncreate: ({ dom }) => {
            state.videoElement = dom as HTMLVideoElement;
          },
          playsinline: true,
          autoplay: true,
          muted: true,
          style: { display: "none" },
        }),
        m("canvas", {
          oncreate: ({ dom }) => {
            state.canvasElement = dom as HTMLCanvasElement;
          },
          width: "1280px",
          height: "720px",
          style: {
            width: "100%",
            height: "80vh",
            display: "block",
            border: "1px solid #ccc",
          },
        }),
        m("div.exercise-selection", [
          m("label", { for: "camera-select" }, "Select Camera: "),
          m(
            "select#camera-select",
            {
              onchange: (e: Event) => {
                const cameraPosition = (e.target as HTMLSelectElement).value;
                setCameraHandler(cameraPosition);
              },
            },
            [
              { key: "front", value: true },
              { key: "rear", value: false },
            ].map((position) =>
              m("option", { value: position.value }, position.key)
            )
          ),
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
        m("aside.action-buttons", [
          m(
            "ion-button",
            {
              onclick: async () => {
                if (state.videoElement && state.canvasElement) {
                  await startDetection();
                }
              },
            },
            state.appState === "Pre" ? "Start Pose Detection" : "Retake"
          ),
          state.appState === "Streaming"
            ? m(
              "ion-button",
              {
                onclick: async () => {
                  if (state.videoElement) await stopDetection();
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
