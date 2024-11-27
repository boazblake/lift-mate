import m from "mithril";
import {
  playbackPoses,
  isPlaying,
  loadRecordingData,
  clearPlaybackData,
  setCanvasElement,
  startPlayback,
  pausePlayback,
  stopPlayback,
  toggleModal,
  isModalVisible,
} from "./model";
import Settings from "./settings";

const PosePlayback = () => {
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

        // playback settings modal
        isModalVisible() && m(Settings),
      ]),
  };
};

export default PosePlayback;
