import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import mkcert from "vite-plugin-mkcert";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const isMobile = mode === "mobile";
  const isSSL = mode === "ssl";
  console.log("mode?", mode);
  return {
    base: isMobile ? "/" : "/lift-mate/",
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: "Lift Mate",
          short_name: "LiftMate",
          description: "Your personal fitness tracking app",
          theme_color: "#ffffff",
          icons: [
            {
              src: "icon.png",
              sizes: "192x192",
              type: "image/png",
            },
          ],
        },
      }),
      legacy({
        targets: ["ie >= 11"],
        additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
      }),
      !isMobile && mkcert(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@utils": path.resolve(__dirname, "./src/utils"),
      },
    },
    build: {
      outDir: "public/",
      assetsDir: "assets/",
      minify: "terser",
    },
    server:
      !isMobile || isSSL
        ? {
            port: 8101, // Specify the port here
            strictPort: true, // Ensures that Vite fails if the port is unavailable
            https: {
              key: fs.readFileSync("./.cert/key.pem"),
              cert: fs.readFileSync("./.cert/cert.pem"),
            },
          }
        : {
            port: 8101, // Specify the port here
            strictPort: true, // Ensures that Vite fails if the port is unavailable
          },
    optimizeDeps: {
      exclude: [
        "@ionic/core", // You can also add other Ionic components here if needed
        "ion-menu",
        "ion-tab-bar",
        "ion-tab",
        "ion-item",
        "ion-button",
        "ion-app",
      ],
    },
  };
});
