import m from "mithril";
import { startDetection, stopDetection, setCameraHandler } from "./model";
import { setExerciseHandler, state } from "./model.utils";
import { Exercise } from "./types";
import { SquatExercise } from "./exercises/squat";
import { Capacitor } from "@capacitor/core";

const exercises: Exercise[] = [SquatExercise];

const PoseViewer = () => {
  return {
    view: () => {
      return m(
        "section.pose-viewer",
        {
          style: {
            marginTop: "90px",
          },
        },
        [
          m(
            "ion-select",
            {
              class: "exercise-select",
              value: state.exercise, // Bind selected value to state if needed
              placeholder: "Select Exercise", // Placeholder text
              interface: "popover", // Optional: defines the selection interface
              onchange: (e: Event) => {
                const selectedName = (e.target as HTMLIonSelectElement).value;
                const selectedExercise =
                  exercises.find((ex) => ex.name === selectedName) || null;
                setExerciseHandler(selectedExercise); // Set chosen exercise
              },
            },
            [
              m("ion-select-option", { value: "" }, "Select Exercise"),
              ...exercises.map((ex) =>
                m("ion-select-option", { value: ex.name }, ex.name)
              ),
            ]
          ),
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

          Capacitor.getPlatform() !== "web" &&
            m(
              "ion-fab",
              { vertical: "top", horizontal: "start", slot: "stacked" },
              [
                m(
                  "ion-fab-button",
                  {
                    onclick: () => {
                      const currentCamera =
                        state.cameraPosition === "front" ? "rear" : "front";
                      setCameraHandler(currentCamera); // Toggles camera position
                      state.cameraPosition = currentCamera;
                    },
                  },
                  [
                    m("ion-icon", {
                      name:
                        state.cameraPosition === "front"
                          ? "camera-reverse"
                          : "camera",
                    }),
                  ]
                ),
              ]
            ),
          state.appState() !== "Streaming" && [
            !state.isLoading()
              ? m(
                  "ion-fab",
                  {
                    vertical: "center",
                    horizontal: "center",
                    slot: "fixed",
                  },
                  [
                    m(
                      "ion-fab-button",
                      {
                        style: {
                          width: "200px",
                          height: "200px",
                        },
                        onclick: async () => {
                          if (state.videoElement && state.canvasElement) {
                            await startDetection(); // Initiates detection
                          }
                        },
                      },
                      "start"
                    ),
                  ]
                )
              : m("ion-spinner"),
          ],
          state.appState() === "Streaming" &&
            m(
              "ion-fab",
              { vertical: "bottom", horizontal: "end", slot: "fixed" },
              [
                m(
                  "ion-fab-button",
                  {
                    onclick: async () => {
                      if (state.videoElement) await stopDetection(); // Stops detection
                    },
                  },
                  "Stop"
                ),
              ]
            ),
        ]
      );
    },
  };
};

export default PoseViewer;
