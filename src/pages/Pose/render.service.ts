import { elements, holistic, features, recording } from "./store";
import { DrawOptions } from "./types";

const defaultDrawOptions: DrawOptions = {
  pose: { color: "red", radius: 5, lineWidth: 2 },
  hands: { color: "green", radius: 5, lineWidth: 2 },
  face: { color: "white", radius: 1, lineWidth: 1 },
};

export const renderService = {
  startLoop: () => {
    const canvas = elements.canvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    elements.context(ctx);
    const video = elements.video();

    if (!canvas || !ctx || !video) return;

    const draw = () => {
      requestAnimationFrame(draw);

      const canvas = elements.canvas();
      const ctx = elements.context();
      const video = elements.video();

      if (!canvas || !ctx || !video || !video.videoWidth) return;

      // Set canvas dimensions to match its display size (CSS pixels)
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      // Calculate effective video dimensions and position due to object-fit: cover
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const canvasAspectRatio = canvas.width / canvas.height;

      let renderedVideoWidth: number;
      let renderedVideoHeight: number;
      let offsetX: number = 0;
      let offsetY: number = 0;

      if (videoAspectRatio > canvasAspectRatio) {
        // Video is wider than canvas, so video height will match canvas height, and width will be cropped
        renderedVideoHeight = canvas.height;
        renderedVideoWidth = renderedVideoHeight * videoAspectRatio;
        offsetX = (canvas.width - renderedVideoWidth) / 2; // Center horizontally
      } else {
        // Video is taller than canvas, so video width will match canvas width, and height will be cropped
        renderedVideoWidth = canvas.width;
        renderedVideoHeight = renderedVideoWidth / videoAspectRatio;
        offsetY = (canvas.height - renderedVideoHeight) / 2; // Center vertically
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, offsetX, offsetY, renderedVideoWidth, renderedVideoHeight);

      if (holistic.ready()) {
        const data = holistic.data();
        // Function to transform normalized landmark coordinates to canvas pixel coordinates
        const transformLandmark = (landmark: any) => ({
          x: offsetX + landmark.x * renderedVideoWidth,
          y: offsetY + landmark.y * renderedVideoHeight,
          z: landmark.z, // Keep z-coordinate if present
          visibility: landmark.visibility, // Keep visibility if present
        });

        if (features().pose && data.poseLandmarks?.length) {
          drawLandmarks(
            ctx,
            data.poseLandmarks.map(transformLandmark),
            defaultDrawOptions.pose
          );
        }
        if (features().hands) {
          if (data.leftHandLandmarks?.length) {
            drawLandmarks(
              ctx,
              data.leftHandLandmarks.map(transformLandmark),
              defaultDrawOptions.hands
            );
          }
          if (data.rightHandLandmarks?.length) {
            drawLandmarks(
              ctx,
              data.rightHandLandmarks.map(transformLandmark),
              defaultDrawOptions.hands
            );
          }
        }
        if (features().face && data.faceLandmarks?.length) {
          drawLandmarks(
            ctx,
            data.faceLandmarks.map(transformLandmark),
            defaultDrawOptions.face
          );
        }
        console.log("Holistic Data:", data);
        console.log("Features:", features());
      }

      if (recording.active()) {
        recording.frames().push({
          timestamp: Date.now(),
          data: holistic.data(),
        });
      }
    };

    requestAnimationFrame(draw);
  },
};

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  options: DrawOptions["pose" | "hands" | "face"]
) {
  console.log("Drawing landmarks:", landmarks, "with options:", options);
  console.log("Canvas context:", ctx);
  ctx.fillStyle = options.color;
  ctx.strokeStyle = options.color;
  ctx.lineWidth = options.lineWidth;

  const { width, height } = ctx.canvas;
  landmarks.forEach((point) => {
    console.log("Drawing point:", point.x, point.y);
    ctx.beginPath();
    ctx.arc(point.x, point.y, options.radius, 0, 2 * Math.PI);
    ctx.fill();
  });
}
