import m from "mithril";
import {
  state,
  transition,
  camera,
  elements,
  features,
  recording,
  exercise,
  isLoading,
  holistic,
} from "./store";
import { cameraService } from "./camera.service";
import { holisticService } from "./holistic.service";
import { renderService } from "./render.service";
import { exercises } from "./exercises";
import { saveRecording } from "./model.utils";

const PoseViewer: m.Component = {
  oncreate: ({ dom }) => {
    elements.video(dom.querySelector("video"));
    elements.canvas(dom.querySelector("canvas"));
  },

  onremove: async () => {
    await cameraService.stop();
    await holisticService.close();
    transition("stop");
  },

  view: () => {
    const currentState = state();

    return m("section.pose-viewer", [
      m("div#video-feed", {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        },
      }),
      // Exercise selector
      m(
        "ion-select",
        {
          class: "exercise-select",
          value: exercise()?.meta?.name,
          onchange: (e: any) => {
            const selected = exercises.find(
              (ex) => ex.meta.name === e.target.value
            );
            exercise(selected || null);
          },
        },
        [
          m("ion-select-option", { value: "" }, "Select Exercise"),
          ...exercises.map((ex) =>
            m("ion-select-option", { value: ex.meta.name }, ex.meta.name)
          ),
        ]
      ),

      // Video and canvas elements
      m("video", {
        playsinline: true,
        autoplay: true,
        muted: true,
        style: {
          width: "100%",
          height: "90vh",
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: "cover",
          zIndex: 1,
        },
      }),

      m("canvas", {
        style: {
          width: "100%",
          height: "90vh",
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: "cover",
          zIndex: 10,
        },
      }),

      // Controls
      currentState === "Streaming" &&
        m("ion-fab.controls", [
          // Feature toggles
          m(
            "ion-fab-button",
            {
              onclick: () =>
                features({ ...features(), pose: !features().pose }),
            },
            m("ion-icon", { name: "body-outline" })
          ),

          m(
            "ion-fab-button",
            {
              onclick: () =>
                features({ ...features(), hands: !features().hands }),
            },
            m("ion-icon", { name: "hand-left-outline" })
          ),

          m(
            "ion-fab-button",
            {
              onclick: () =>
                features({ ...features(), face: !features().face }),
            },
            m("ion-icon", { name: "face-outline" })
          ),

          // Camera switch
          m(
            "ion-fab-button",
            {
              onclick: async () => {
                transition("switchCamera");
                await cameraService.switch();
                transition("completeSwitch");
              },
            },
            m("ion-icon", { name: "camera-reverse-outline" })
          ),

          // Recording
          m(
            "ion-fab-button",
            {
              onclick: async () => {
                const wasActive = recording.active();
                recording.active(!wasActive);
                if (wasActive) {
                  if (
                    recording.frames().length > 0 &&
                    window.confirm("Do you want to save the recording?")
                  ) {
                    await saveRecording();
                  }
                  recording.frames([]); // Clear frames
                }
              },
              color: recording.active() ? "danger" : "primary",
            },
            m("ion-icon", {
              name: recording.active()
                ? "stop-circle"
                : "radio-button-on-outline",
            })
          ),
        ]),

      // Start button
      (currentState === "Idle" || currentState === "Stopped") &&
        m(
          "ion-fab",
          { vertical: "center", horizontal: "center", slot: "fixed" },
          [
            m(
              "ion-fab-button",
              {
                onclick: async () => {
                  transition("start");
                  await cameraService.initialize();
                  await holisticService.initialize();
                  if (camera.ready() && holistic.ready()) {
                    transition("ready");
                    renderService.startLoop();
                    holisticService.sendFrames();
                    transition("beginStreaming");
                  } else {
                    transition("error");
                    alert("Failed to initialize camera or pose detection.");
                  }
                },
                disabled: isLoading(),
              },
              isLoading() ? m("ion-spinner") : m("ion-icon", { name: "play" })
            ),
          ]
        ),
    ]);
  },
};

export default PoseViewer;
