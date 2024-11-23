import m from "mithril";
import Modal from "@/components/Modal";
import {
  playbackPoses,
  isPlaying,
  currentFrame,
  playbackSpeed,
  loopPlayback,
  elapsedTime,
  loadRecordingData,
  clearPlaybackData,
  setCanvasElement,
  startPlayback,
  pausePlayback,
  stopPlayback,
  setPlaybackSpeed,
  drawPose,
} from "./model.index";

const PosePlayback = () => {
  let hasFile = false;
  let isModalVisible = false;
  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const data = JSON.parse(content);
          console.log(data);
          loadRecordingData(data[0], data[1]);
          console.log("Recording loaded:", data); // Added log
          hasFile = true;
          alert("Recording loaded successfully!");
        } catch (error) {
          console.error("Invalid JSON format:", error);
          alert("Failed to load recording. Please ensure the file is valid.");
        }
      };
      reader.readAsText(file);
    }
  };

  /**
   * Handles range slider changes to update the current frame.
   * @param event - The IonRange change event.
   */
  const handleRangeChange = (event: Event) => {
    console.log(event);
    const target = event.target as HTMLInputElement;
    const newFrame = parseInt(target.value, 10);
    if (!isNaN(newFrame)) {
      currentFrame(newFrame);
      elapsedTime(playbackPoses()[newFrame]?.timestamp || 0);
      drawCurrentFrame();
      if (isPlaying()) {
        pausePlayback();
      }
    }
  };

  /**
   * Draws the current frame based on the `currentFrame` index.
   */
  const drawCurrentFrame = () => {
    const frame = playbackPoses()[currentFrame()];
    if (frame) {
      frame.poses.forEach((pose: any) => drawPose(pose));
    }
  };
  const toggleModal = () => {
    isModalVisible = !isModalVisible;
    m.redraw();
  };

  return {
    view: () => {
      return m("section.pose-playback", [
        m("h2", "Pose Playback"),

        // Playback Controls as FAB Buttons
        m(
          "div.playback-controls",

          {
            style: {
              marginBottom: "calc(var(--ion-safe-area-bottom) + 100px)",
            },
          },
          m(
            "ion-fab",
            {
              horizontal: "start",
              slot: "fixed",
              style: { "--ion-fab-background": "#3880ff" }, // Optional: Customize FAB background
            },
            [
              hasFile && [
                // Play FAB
                m(
                  "ion-fab-button",
                  {
                    onclick: startPlayback,
                    disabled: isPlaying() || playbackPoses().length === 0,
                    color: "primary",
                  },
                  m("ion-icon", { name: "play" })
                ),
                // Pause FAB
                m(
                  "ion-fab-button",
                  {
                    onclick: pausePlayback,
                    disabled: !isPlaying(),
                    color: "warning",
                  },
                  m("ion-icon", { name: "pause" })
                ),
                // Stop FAB
                m(
                  "ion-fab-button",
                  {
                    onclick: stopPlayback,
                    disabled: !isPlaying(),
                    color: "danger",
                  },
                  m("ion-icon", { name: "stop" })
                ),
                // Clear FAB
                m(
                  "ion-fab-button",
                  {
                    onclick: () => {
                      clearPlaybackData();
                      console.log("Playback data cleared.");
                      hasFile = false;
                    },
                    disabled: playbackPoses().length === 0,
                    color: "medium",
                  },
                  m("ion-icon", { name: "trash" })
                ),
              ],
              // Settings button to open the modal
              m(
                "ion-fab-button",
                {
                  vertical: "top",
                  onclick: toggleModal,
                },
                m("ion-icon", { name: "settings" })
              ),
            ]
          )
        ),

        m("canvas", {
          width: "1280px",
          height: "720px",
          style: {
            width: "100%",
            height: "80vh",
            display: "block",
            border: "1px solid #ccc",
            marginTop: "20px",
          },
          oncreate: ({ dom }: { dom: HTMLCanvasElement }) =>
            setCanvasElement(dom),
        }),
        // Modal usage with custom content, title, and buttons
        isModalVisible &&
        m(
          Modal,
          {
            title: "Playback Settings",
            onDismiss: () => {
              isModalVisible = false;
              m.redraw();
            },
          },

          [
            [
              // Playback Speed Control
              m("div.playback-speed", [
                m("ion-item", [
                  m("ion-label", { for: "speed-select" }, "Playback Speed: "),
                  m(
                    "ion-select#speed-select",
                    {
                      onchange: (e: Event) => {
                        const speed = parseFloat(
                          (e.target as HTMLSelectElement).value
                        );
                        setPlaybackSpeed(speed);
                        console.log(`Playback speed set to ${speed}x.`);
                      },
                      value: playbackSpeed().toString(),
                      interface: "popover", // Optional: Add interface style
                    },
                    [
                      m("ion-select-option", { value: "0.5" }, "0.5x"),
                      m("ion-select-option", { value: "1" }, "1x"),
                      m("ion-select-option", { value: "2" }, "2x"),
                    ]
                  ),
                ]),
              ]),
              // Loop Playback Control
              m("div.loop-playback", [
                m("ion-item", [
                  m("ion-label", { for: "loop-playback" }, "Loop Playback: "),
                  m("ion-checkbox", {
                    id: "loop-playback",
                    checked: loopPlayback(),
                    onchange: (e: Event) => {
                      const isChecked = (e.target as HTMLInputElement)
                        .checked;
                      loopPlayback(isChecked);
                      console.log(`Loop Playback set to: ${isChecked}`);
                    },
                  }),
                ]),
              ]),
              // Playback Information with Ion Range
              m("div.playback-info", [
                m("ion-item", [
                  m(
                    "ion-label",
                    { slot: "start" },
                    `Frame: ${currentFrame() + 1} / ${playbackPoses().length}`
                  ),
                  m(
                    "ion-range",
                    {
                      min: 0,
                      max:
                        playbackPoses().length > 0
                          ? playbackPoses().length - 1
                          : 0,
                      step: 1,
                      snaps: true,
                      value: currentFrame(),
                      disabled: playbackPoses().length === 0,
                      onIonChange: handleRangeChange, // Corrected event handler
                    },
                    []
                  ),
                ]),
                m("ion-item", `Elapsed Time: ${elapsedTime().toFixed(2)}s`),
                m("ion-item", `Playback Speed: ${playbackSpeed()}x`),
              ]),
            ],

            [
              m("div.file-upload", [
                m("ion-item", [
                  m(
                    "ion-label",
                    { for: "upload-recording" },
                    "Load Recording: "
                  ),
                  m(
                    "ion-input[type=file][id=upload-recording][accept=application/json]",
                    {
                      onchange: handleFileUpload,
                    }
                  ),
                ]),
              ]),
            ],
          ]
        ),
      ]);
    },
  };
};

export default PosePlayback;
