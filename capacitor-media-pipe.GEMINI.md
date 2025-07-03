# Project Context: Capacitor MediaPipe Plugin

This document provides context for the custom `CapacitorMediaPipe` plugin, which is a local Capacitor plugin used by the `lift-mate` application.

## Plugin Overview

`CapacitorMediaPipe` is a custom native plugin that wraps the native Google MediaPipe SDKs for iOS (Swift) and Android (Java/Kotlin). Its primary purpose is to provide high-performance, real-time pose estimation by leveraging native device capabilities, which is significantly more efficient than a pure JavaScript solution on mobile devices.

The plugin is responsible for:
1.  Initializing the native MediaPipe Holistic pipeline.
2.  Receiving video frame data from the web view.
3.  Processing the frames using the native MediaPipe SDK.
4.  Emitting the resulting landmark data back to the web view as an event.

## Inferred API

Based on its usage in `src/pages/Pose/holistic.service.ts`, the plugin exposes the following methods and events:

### Methods

*   **`initialize()`**:
    *   **Description:** Sets up and initializes the native MediaPipe Holistic pipeline on the device. This must be called before any other method.
    *   **Usage:** `await CapacitorMediaPipe.initialize();`

*   **`send(options: { image: string })`**:
    *   **Description:** Sends a single video frame to the native plugin for processing. The frame must be a Base64 encoded string of a JPEG image.
    *   **Usage:** `await CapacitorMediaPipe.send({ image: imageData });`

*   **`close()`**:
    *   **Description:** Shuts down the native MediaPipe pipeline and releases all associated resources.
    *   **Usage:** `await CapacitorMediaPipe.close();`

### Events

*   **`holisticResults`**:
    *   **Description:** An event emitted by the plugin whenever it has successfully processed a frame and has new landmark data.
    *   **Data Structure:** The event returns an object containing the detected landmarks, with arrays for `poseLandmarks`, `faceLandmarks`, `leftHandLandmarks`, and `rightHandLandmarks`.
    *   **Usage:** `CapacitorMediaPipe.addListener('holisticResults', (results: any) => { ... });`

## Architectural Role & Build Configuration

This plugin is a critical component of the application's architecture when running on a native mobile device. It serves as the "native implementation" for the `holistic.service.ts` abstraction. The service uses platform detection to decide whether to call this plugin (on mobile) or to use the web-based `@mediapipe/tasks-vision` library (on the web).

**Important:** To prevent this native-only plugin from being bundled into web builds (which would cause a build failure), two specific configurations are required:

1.  **Dynamic Import:** The plugin must be imported dynamically within the native-specific code path in `holistic.service.ts` using `await import('capacitor-media-pipe');`. A static import at the top of the file will cause the build to fail.
2.  **Vite Configuration:** The plugin must be explicitly externalized in the `vite.config.ts` file under `build.rollupOptions.external`. This tells the bundler to ignore the module.

This hybrid approach ensures the application achieves the highest possible performance on mobile while still providing a fully functional experience on the web.
