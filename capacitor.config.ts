import { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV === "development";

const config: CapacitorConfig = {
  appId: "io.boazblake.liftmate",
  appName: "Lift Mate",
  webDir: "docs", // Ensure this matches the directory where your built web assets are stored
  server: isDev
    ? {
        url: "http://localhost:8101", // Only use this during development
        cleartext: true, // Allow HTTP in development mode
      }
    : {}, // Remove server URL in production
  ios: {
    webContentsDebuggingEnabled: true, // Enable web debugging for iOS
  },
};

export default config;
