import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import mkcert from "vite-plugin-mkcert";
import legacy from "@vitejs/plugin-legacy";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const isMobile = mode === "mobile";
  const isSSL = mode === "ssl";
  console.log("Vite mode:", mode, "isSSL:", isSSL, "isMobile:", isMobile);

  const alias = {
    "@": path.resolve(__dirname, "./src"),
    "@components": path.resolve(__dirname, "./src/components"),
    "@exercises": path.resolve(__dirname, "./src/exercises"),
    "@pages": path.resolve(__dirname, "./src/pages"),
    "@utils": path.resolve(__dirname, "./src/utils"),
    "@types": path.resolve(__dirname, "./src/types"),
  };

  // When not building for mobile, we replace the native plugin definition
  // with our web-based shim.
  if (!isMobile) {
    alias["@/pages/Pose/media-pipe"] = path.resolve(
      __dirname,
      "./src/shims/capacitor-media-pipe.ts"
    );
  }

  return {
    base: isMobile ? "/" : "/lift-mate/",
    plugins: [
      nodePolyfills({
        include: ["process"], // Polyfill process.env
        globals: {
          process: true,
        },
      }),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
        mode: "generateSW",
        strategies: "generateSW",
        workbox: {
          globDirectory: "docs", // Match build.outDir
          globPatterns: ["**/*.{js,wasm,css,html,png,jpg,jpeg,svg,ico}"],
          globIgnores: ["**/node_modules/**/*", "sw.js", "workbox-*.js"],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === "document",
              handler: "NetworkFirst",
            },
            {
              urlPattern: ({ request }) =>
                request.destination === "script" ||
                request.destination === "style",
              handler: "StaleWhileRevalidate",
            },
          ],
        },
        manifest: {
          name: "Lift Mate",
          short_name: "LiftMate",
          description: "Your personal fitness tracking app",
          theme_color: "#ffffff",
          icons: [
            {
              src: "icon.svg",
              sizes: "192x192",
              type: "image/svg+xml",
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
      alias,
    },
    build: {
      outDir: "docs",
      assetsDir: "assets",
      minify: "terser",
      rollupOptions: {
        external: ["react", "react-dom"], // Exclude React
      },
    },
    server:
      !isMobile || isSSL
        ? {
            port: 8101,
            strictPort: true,
            https: {
              key: fs.readFileSync("./.cert/key.pem"),
              cert: fs.readFileSync("./.cert/cert.pem"),
            },
          }
        : {
            host: "localhost",
            port: 8101,
            strictPort: true,
          },
    optimizeDeps: {
      exclude: [
        "@ionic/core",
        "ion-menu",
        "ion-tab-bar",
        "ion-tab",
        "ion-item",
        "ion-button",
        "ion-app",
        "react",
        "react-dom",
      ],
    },
  };
});
