// playback/index.ts
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
  drawPose,
} from "./model";

// Interface for PoseFrame
interface PoseFrame {
  timestamp: number;
  poses: Array<any>;
}

const PosePlayback = () => {
  let canvasElement: HTMLCanvasElement | null = null;

  /**
   * Handles file upload for web browsers.
   * @param event - The file input change event.
   */
  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const data: PoseFrame[] = JSON.parse(content);
          loadRecordingData(data);
          console.log("Recording loaded:", data); // Added log
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
   * Initializes the component by setting the canvas element.
   */
  const oncreate = ({ dom }: m.VnodeDOM) => {
    setCanvasElement(dom);
    console.log("Playback Canvas Initialized:", canvasElement); // Added log
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

  return {
    view: () => {
      return m("section.pose-playback", [
        m("h2", "Pose Playback"),
        // File Upload for Web Browsers
        m("div.file-upload", [
          m("ion-item", [
            m("ion-label", { for: "upload-recording" }, "Load Recording: "),
            m(
              "ion-input[type=file][id=upload-recording][accept=application/json]",
              {
                onchange: handleFileUpload,
              }
            ),
          ]),
        ]),
        // Playback Controls as FAB Buttons
        m("div.playback-controls", [
          m(
            "ion-fab",
            {
              vertical: "bottom",
              horizontal: "end",
              slot: "fixed",
              style: { "--ion-fab-background": "#3880ff" }, // Optional: Customize FAB background
            },
            [
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
                  },
                  disabled: playbackPoses().length === 0,
                  color: "medium",
                },
                m("ion-icon", { name: "trash" })
              ),
            ]
          ),
        ]),
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
                const isChecked = (e.target as HTMLInputElement).checked;
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
                  playbackPoses().length > 0 ? playbackPoses().length - 1 : 0,
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
        // Canvas for Playback
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
          oncreate,
        }),
      ]);
    },
  };
};

export default PosePlayback;
