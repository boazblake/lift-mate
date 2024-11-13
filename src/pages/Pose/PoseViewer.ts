import m from "mithril";
import { startDetection, stopDetection, setCameraHandler } from "./model";
import { setExerciseHandler, state } from "./model.utils";
import { Exercise } from "./types";
import { SquatExercise } from "./exercises/squat";

const exercises: Exercise[] = [SquatExercise];

const PoseViewer = () => {
  return {
    view: () => {
      return m("section.pose-viewer", [
        m("video", {
          oncreate: ({ dom }: { dom: HTMLVideoElement }) => {
            state.videoElement = dom;
          },
          playsinline: true,
          autoplay: true,
          muted: true,
          style: { display: "none" }, // Hidden for mobile; used in web render loop
        }),
        m("canvas", {
          oncreate: ({ dom }: { dom: HTMLCanvasElement }) => {
            state.canvasElement = dom;
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
          state.appState() === "Pre" && [
            m("label", { for: "camera-select" }, "Select Camera: "),
            m(
              "select#camera-select",
              {
                onchange: (e: Event) => {
                  const cameraPosition = (e.target as HTMLSelectElement).value;
                  setCameraHandler(cameraPosition); // Adjust camera position for mobile
                },
              },
              ["front", "rear"].map((position) =>
                m("option", { value: position }, position)
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
                  setExerciseHandler(selectedExercise); // Set chosen exercise
                },
              },
              [
                m("option", { value: "" }, "None"),
                ...exercises.map((ex) =>
                  m("option", { value: ex.name }, ex.name)
                ),
              ]
            ),
          ],
        ]),
        m("aside.action-buttons", [
          m(
            "ion-button",
            {
              onclick: async () => {
                if (state.videoElement && state.canvasElement) {
                  await startDetection(); // Initiates detection for web or mobile based on platform
                }
              },
            },
            state.appState() === "Pre" ? "Start Pose Detection" : "Retake"
          ),
          state.appState() === "Streaming"
            ? m(
                "ion-button",
                {
                  onclick: async () => {
                    if (state.videoElement) await stopDetection(); // Stops detection and camera
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
