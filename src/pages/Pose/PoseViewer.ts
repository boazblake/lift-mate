import m, { VnodeDOM } from "mithril";
import {
  startDetection,
  setCameraHandler,
  stopRecording,
  stopDetection,
} from "./model";
import { useStore, toggleModel } from "./model.utils";
import { Exercise } from "@types";
import * as exrxs from "@exercises/index";
import { toastController } from "@ionic/core";
import { Capacitor } from "@capacitor/core";

const exercises = Object.values(exrxs);

const { videoElement } = useStore.getState();
const PoseViewer = () => {
  return {
    onbeforeremove: async () => {
      if (videoElement) await stopDetection();
    },
    view: () => {
      const {
        appState,
        isLoading,
        cameraPosition,
        activeModels,
        exercise,
        set,
      } = useStore.getState();
      return m(
        "section.pose-viewer",
        {
          style: { marginTop: "90px" },
        },
        [
          m(
            "ion-select",
            {
              class: "exercise-select",
              value: exercise?.meta?.name,
              placeholder: "Select Exercise",
              interface: "popover",
              "aria-label": "Select exercise",
              onionChange: (e: Event) => {
                const selectedName = (e.target as HTMLIonSelectElement).value;
                const selectedExercise =
                  exercises.find(
                    (ex: Exercise) => ex?.meta?.name === selectedName
                  ) || null;
                set({ exercise: selectedExercise });
              },
            },
            [
              m("ion-select-option", { value: "" }, "Select Exercise"),
              ...exercises.map((ex: Exercise) =>
                m("ion-select-option", { value: ex.meta?.name }, ex.meta?.name)
              ),
            ]
          ),

          m("video", {
            oncreate: ({ dom }: VnodeDOM) => {
              set({ videoElement: dom as HTMLVideoElement });
            },
            playsinline: true,
            autoplay: true,
            muted: true,
            style: {
              display:
                Capacitor.getPlatform() !== "web" && !videoElement?.srcObject
                  ? "none"
                  : "block",
              width: "100%",
              height: "80vh",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 2,
            },
          }),

          m("div#video-feed", {
            style: {
              display:
                Capacitor.getPlatform() !== "web" && !videoElement?.srcObject
                  ? "block"
                  : "none",
              width: "100%",
              height: "80vh",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
            },
          }),

          m("canvas", {
            oncreate: ({ dom }: VnodeDOM) => {
              const canvas = dom as HTMLCanvasElement;
              set({ canvasElement: canvas });
              const resizeCanvas = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight * 0.8;
              };
              resizeCanvas();
              window.addEventListener("resize", resizeCanvas);
            },
            style: {
              width: "100%",
              height: "80vh",
              display: "block",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 3,
              border: "1px solid #ccc",
            },
          }),

          appState === "Streaming" &&
            m(
              "ion-fab",
              {
                vertical: "top",
                horizontal: "start",
                style: {
                  marginTop: "calc(var(--ion-safe-area-top) + 100px)",
                  zIndex: 4,
                },
              },
              [
                m(
                  "ion-fab-button",
                  {
                    onclick: () => toggleModel(activeModels, "poseLandmark"),
                    "aria-label": activeModels.poseLandmark
                      ? "Disable pose landmarks"
                      : "Enable pose landmarks",
                    tabindex: 0,
                    onkeydown: (e: KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ")
                        toggleModel(activeModels, "poseLandmark");
                    },
                  },
                  [m("ion-icon", { name: "accessibility-outline" })]
                ),
                m(
                  "ion-fab-button",
                  {
                    onclick: () => toggleModel(activeModels, "handLandmark"),
                    "aria-label": activeModels.handLandmark
                      ? "Disable hand landmarks"
                      : "Enable hand landmarks",
                    tabindex: 0,
                    onkeydown: (e: KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ")
                        toggleModel(activeModels, "handLandmark");
                    },
                  },
                  [m("ion-icon", { name: "hand-left-outline" })]
                ),
                m(
                  "ion-fab-button",
                  {
                    onclick: () => toggleModel(activeModels, "faceLandmark"),
                    "aria-label": activeModels.faceLandmark
                      ? "Disable face landmarks"
                      : "Enable face landmarks",
                    tabindex: 0,
                    onkeydown: (e: KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ")
                        toggleModel(activeModels, "faceLandmark");
                    },
                  },
                  [m("ion-icon", { name: "finger-print-outline" })]
                ),
                !Ionic.platforms.includes("desktop") &&
                  m(
                    "ion-fab-button",
                    {
                      onclick: async () => {
                        const toast = await toastController.create({
                          message: "Switching camera...",
                          duration: 2000,
                        });
                        await toast.present();
                        const newCamera =
                          cameraPosition === "front" ? "rear" : "front";
                        setCameraHandler(newCamera);
                      },
                      "aria-label": `Switch to ${
                        cameraPosition === "front" ? "rear" : "front"
                      } camera`,
                      tabindex: 0,
                      onkeydown: (e: KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          const newCamera =
                            cameraPosition === "front" ? "rear" : "front";
                          setCameraHandler(newCamera);
                        }
                      },
                    },
                    [
                      m("ion-icon", {
                        name:
                          cameraPosition === "front"
                            ? "camera-reverse"
                            : "camera",
                      }),
                    ]
                  ),
              ]
            ),

          appState === "Pre" &&
            m(
              "ion-fab",
              {
                vertical: "center",
                horizontal: "center",
                slot: "fixed",
                style: { zIndex: 4 },
              },
              [
                m(
                  "ion-fab-button",
                  {
                    style: { width: "200px", height: "200px" },
                    onclick: async () => {
                      const { videoElement, canvasElement } =
                        useStore.getState();
                      if (videoElement && canvasElement) {
                        set({ isLoading: true });
                        await startDetection();
                      }
                    },
                    "aria-label": "Start detection",
                  },
                  isLoading ? m("ion-spinner") : "start"
                ),
              ]
            ),

          appState === "Streaming" &&
            m(
              "ion-fab",
              {
                vertical: "bottom",
                horizontal: "end",
                slot: "fixed",
                style: { zIndex: 4 },
              },
              [
                m(
                  "ion-fab-button",
                  {
                    color: useStore.getState().isRecording
                      ? "danger"
                      : "primary",
                    style: {
                      marginBottom: "calc(var(--ion-safe-area-bottom) + 100px)",
                    },
                    onclick: async () => {
                      set({ isRecording: !useStore.getState().isRecording });
                      if (!useStore.getState().isRecording) {
                        await stopRecording();
                      }
                    },
                    "aria-label": useStore.getState().isRecording
                      ? "Stop recording"
                      : "Start recording",
                  },
                  m("ion-icon", {
                    name: useStore.getState().isRecording
                      ? "stop-circle-outline"
                      : "play-circle-outline",
                  })
                ),
              ]
            ),
        ]
      );
    },
  };
};

export default PoseViewer;
