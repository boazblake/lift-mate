import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import mkcert from "vite-plugin-mkcert";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const isSSL = mode === "ssl";
  console.log("isdev?", mode, isDev);
  return {
    base: isDev ? "/" : "/lift-mate/",
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
      isDev && mkcert(),
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
      isDev || isSSL
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
  };
});
