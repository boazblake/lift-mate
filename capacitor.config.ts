import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.liftmate",
  appName: "Lift Mate",
  webDir: "public",
  server: {
    url: "http://localhost:8101/lift-mate/",
    cleartext: true,
  },
  ios: {
    webContentsDebuggingEnabled: true,
    backgroundColor: "#ff000000", // this is needed mainly on iOS
  },
};

export default config;
