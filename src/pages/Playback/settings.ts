import Modal from "@/components/Modal"; // Import the Modal component
import m from "mithril";
import {
  playbackPoses,
  isPlaying,
  pausePlayback,
  playbackSpeed,
  currentFrame,
  elapsedTime,
  toggleModal,
  setPlaybackSpeed,
  loopPlayback,
} from "./model";

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
const PosePlaybackSettings = () => {
  return {
    view: () =>
      m(
        Modal,
        {
          title: "Playback Settings",
          onDismiss: toggleModal,
        },
        [
          m("div.playback-settings", [
            m("h3", "playback settings"),
            // playback speed control
            m("ion-item", [
              m("ion-label", { for: "speed-select" }, "playback speed: "),
              m(
                "ion-select#speed-select",
                {
                  value: playbackSpeed(),
                  onchange: (e: event) => {
                    const speed = parsefloat(
                      (e.target as htmlselectelement).value
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

            // loop playback control
            m("ion-item", [
              m("ion-label", { for: "loop-playback" }, "loop playback: "),
              m("ion-checkbox", {
                id: "loop-playback",
                checked: loopPlayback(),
                onchange: (e: event) => {
                  const ischecked = (e.target as htmlinputelement).checked;
                  loopPlayback(ischecked);
                },
              }),
            ]),

            // playback frame information and slider
            m("ion-item", [
              m(
                "ion-label",
                { slot: "start" },
                `frame: ${currentFrame() + 1} / ${playbackPoses().length}`
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
                  onionchange: handleRangeChange,
                },
                []
              ),
            ]),
            m("ion-item", `elapsed time: ${elapsedTime().toFixed(2)}s`),
            m("ion-item", `playback speed: ${playbackSpeed()}x`),
          ]),
        ]
      ),
  };
};

export default PosePlaybackSettings;
