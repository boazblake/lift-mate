import m from "mithril";
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
} from "./model";

const PosePlayback = () => {
  let isModalVisible = false;

  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          loadRecordingData(data);
          alert("Recording loaded successfully!");
        } catch (error) {
          console.error("Error loading file:", error);
          alert("Invalid file format. Please upload a valid JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleModal = () => {
    isModalVisible = !isModalVisible;
    m.redraw();
  };

  const handleRangeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newFrame = parseInt(target.value, 10);
    if (!isNaN(newFrame)) {
      currentFrame(newFrame);
      elapsedTime(playbackPoses()[newFrame]?.timestamp || 0);
      if (isPlaying()) {
        pausePlayback();
      }
    }
  };

  return {
    view: () =>
      m("section.pose-playback", [
        m("h2", "Pose Playback"),

        // File Upload
        m("div.file-upload", [
          m("ion-item", [
            m("ion-label", { for: "upload-recording" }, "Load Recording: "),
            m("ion-input", {
              type: "file",
              id: "upload-recording",
              accept: "application/json",
              onchange: handleFileUpload,
            }),
          ]),
        ]),

        // Canvas
        m("canvas", {
          width: 1280,
          height: 720,
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

        // Playback Controls as FAB Buttons
        m(
          "ion-fab",
          {
            vertical: "bottom",
            horizontal: "start",
            slot: "fixed",
            style: { "--ion-fab-background": "#3880ff" },
          },
          [
            m(
              "ion-fab-button",
              {
                onclick: startPlayback,
                disabled: isPlaying() || playbackPoses().length === 0,
              },
              m("ion-icon", { name: "play" })
            ),
            m(
              "ion-fab-button",
              {
                onclick: pausePlayback,
                disabled: !isPlaying(),
              },
              m("ion-icon", { name: "pause" })
            ),
            m(
              "ion-fab-button",
              {
                onclick: stopPlayback,
                disabled: !isPlaying(),
              },
              m("ion-icon", { name: "stop" })
            ),
            m(
              "ion-fab-button",
              {
                onclick: clearPlaybackData,
              },
              m("ion-icon", { name: "trash" })
            ),
            // Modal Toggle Button
            m(
              "ion-fab-button",
              {
                onclick: toggleModal,
              },
              m("ion-icon", { name: "settings" })
            ),
          ]
        ),

        // Playback Settings Modal
        isModalVisible &&
        m(
          "ion-modal",
          {
            isOpen: isModalVisible,
            onDidDismiss: toggleModal,
          },
          m("div.playback-settings", [
            m("h3", "Playback Settings"),

            // Playback Speed Control
            m("ion-item", [
              m("ion-label", { for: "speed-select" }, "Playback Speed: "),
              m(
                "ion-select#speed-select",
                {
                  value: playbackSpeed().toString(),
                  onchange: (e: Event) => {
                    const speed = parseFloat(
                      (e.target as HTMLSelectElement).value
                    );
                    setPlaybackSpeed(speed);
                  },
                },
                [
                  m("ion-select-option", { value: "0.5" }, "0.5x"),
                  m("ion-select-option", { value: "1" }, "1x"),
                  m("ion-select-option", { value: "2" }, "2x"),
                ]
              ),
            ]),

            // Loop Playback Control
            m("ion-item", [
              m("ion-label", { for: "loop-playback" }, "Loop Playback: "),
              m("ion-checkbox", {
                id: "loop-playback",
                checked: loopPlayback(),
                onchange: (e: Event) => {
                  const isChecked = (e.target as HTMLInputElement).checked;
                  loopPlayback(isChecked);
                },
              }),
            ]),

            // Playback Frame Information and Slider
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
                  onIonChange: handleRangeChange,
                },
                []
              ),
            ]),
            m("ion-item", `Elapsed Time: ${elapsedTime().toFixed(2)}s`),
            m("ion-item", `Playback Speed: ${playbackSpeed()}x`),
          ])
        ),
      ]),
  };
};

export default PosePlayback;
