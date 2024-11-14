import m from "mithril";
import {
  startDetection,
  stopDetection,
  setCameraHandler,
  hasMultipleCameras,
} from "./model";
import { setExerciseHandler, state } from "./model.utils";
import { Exercise } from "./types";
import { SquatExercise } from "./exercises/squat";

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
              value: state.exercise,
              placeholder: "Select Exercise",
              interface: "popover",
              onchange: (e: Event) => {
                const selectedName = (e.target as HTMLIonSelectElement).value;
                const selectedExercise =
                  exercises.find((ex) => ex.name === selectedName) || null;
                setExerciseHandler(selectedExercise);
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
            style: { display: "none" },
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
          state.numberOfCameras,
          // Camera FAB for toggling front/rear, only in Streaming state
          state.appState() === "Streaming" &&
            hasMultipleCameras() &&
            m(
              "ion-fab",
              {
                vertical: "top",
                horizontal: "start",
                style: { marginTop: "calc(var(--ion-safe-area-top) + 100px)" },
              },
              [
                m(
                  "ion-fab-button",
                  {
                    onclick: () => {
                      const currentCamera =
                        state.cameraPosition === "front" ? "rear" : "front";
                      setCameraHandler(currentCamera);
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

          // Centered FAB: displays "start", spinner, or nothing based on state
          state.appState() === "Pre" &&
            m(
              "ion-fab",
              { vertical: "center", horizontal: "center", slot: "fixed" },
              [
                m(
                  "ion-fab-button",
                  {
                    style: { width: "200px", height: "200px" },
                    onclick: async () => {
                      if (state.videoElement && state.canvasElement) {
                        state.isLoading(true);
                        await startDetection(); // Initiates detection
                      }
                    },
                  },
                  state.isLoading() ? m("ion-spinner") : "start"
                ),
              ]
            ),

          // Stop Button, visible only in Streaming state
          state.appState() === "Streaming" &&
            m(
              "ion-fab",
              { vertical: "bottom", horizontal: "end", slot: "fixed" },
              [
                m(
                  "ion-fab-button",
                  {
                    download: true,
                    style: {
                      marginBottom: "calc(var(--ion-safe-area-bottom) + 100px)",
                    },
                    onclick: async () => {
                      if (state.videoElement) await stopDetection();
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
