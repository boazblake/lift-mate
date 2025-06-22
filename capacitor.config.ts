import { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV === "development";

const config: CapacitorConfig = {
  appId: "io.boazblake.liftmate",
  appName: "Lift Mate",
  webDir: "docs",
  server: isDev
    ? {
        url: "http://localhost:8101",
        cleartext: true,
      }
    : {},
  ios: {
    minVersion: 18,
    webContentsDebuggingEnabled: true,
    NSCameraUsageDescription:
      "This app uses the camera for real-time pose estimation to track your workouts.",
    NSMicrophoneUsageDescription:
      "This app may use the microphone for video recording during workouts.",
    WKWebViewOnly: true,
  },
};

export default config;
