# Project Context: Lift-Mate

This document provides context for the `lift-mate` application, focusing on the real-time pose estimation feature. It is designed to be easily digestible by an AI agent for seamless continuation of development.

## Application Overview

`lift-mate` is a mobile-first fitness tracking application built with Ionic and Mithril. Its primary goal is to assist users with their workouts, potentially offering features like exercise tracking, form analysis, and progress monitoring.

## Feature Focus: Real-time Pose Estimation

The current development focus is on implementing a real-time pose estimation feature, located under `src/pages/Pose/`. This feature utilizes Google's MediaPipe Holistic model to detect and render human pose, hand, and face landmarks on a live video feed.

### Key Technologies Used:
- **Mithril.js:** A minimalist JavaScript framework for building single-page applications.
- **MediaPipe Holistic:** Google's machine learning solution for real-time on-device holistic pose, face, and hand tracking.
- **Capacitor:** An open-source native runtime that allows web apps to run natively on iOS, Android, Electron, and the web.

### Current State and Recent Development:

The real-time pose estimation feature is functional. Users can start a video feed, and the application will display detected pose, hand, and face landmarks.

**Recent Changes and Resolved Issues:**

1.  **`render.service.ts` - `elements.context is not a function`:**
    - **Problem:** Initial implementation incorrectly assumed `elements.context` was a function, leading to a `TypeError`.
    - **Resolution:** Modified `src/pages/Pose/store.ts` to include a `context` stream within the `elements` object. Updated `src/pages/Pose/render.service.ts` to correctly retrieve the 2D rendering context from the canvas element and store it in the `elements.context` stream.

2.  **No Landmarks Displayed:**
    - **Problem:** Although the `holistic.service` was initialized, video frames were not being continuously sent to the MediaPipe model for processing, resulting in no landmark data.
    - **Resolution:**
        - Added a `sendFrames` asynchronous function to `src/pages/Pose/holistic.service.ts`. This function continuously sends video frames to the MediaPipe Holistic instance for processing using `requestAnimationFrame`.
        - Integrated the `holisticService.sendFrames()` call into `src/pages/Pose/PoseViewer.ts` when streaming begins.

3.  **Tiny Landmarks / Aspect Ratio Issues:**
    - **Problem:** Landmarks were appearing very small or distorted due to incorrect scaling. The canvas's internal resolution did not match its display size, and the landmark coordinates were not correctly transformed to account for the `object-fit: cover` styling of the video feed.
    - **Resolution:**
        - Modified the `draw` loop in `src/pages/Pose/render.service.ts` to dynamically set the canvas's `width` and `height` to match its `clientWidth` and `clientHeight` (CSS pixels).
        - Implemented logic to calculate the effective `renderedVideoWidth`, `renderedVideoHeight`, `offsetX`, and `offsetY` based on the `object-fit: cover` behavior of the video.
        - Updated the `transformLandmark` function to scale and offset the normalized landmark coordinates (`point.x`, `point.y`) to these calculated video dimensions before drawing.
        - Corrected a bug where `drawLandmarks` was redundantly re-scaling already scaled coordinates.

4.  **"Selfie Mode" Mirroring:**
    - **Problem:** The front camera feed was mirrored, which is the default behavior of MediaPipe's `selfieMode` when the front camera is active.
    - **Resolution:** Set `selfieMode: false` in the `instance.setOptions` within `src/pages/Pose/holistic.service.ts` to disable mirroring.

5.  **Missing Connection Lines:**
    - **Problem:** Only individual landmarks were drawn, without lines connecting them to form a skeletal representation.
    - **Resolution:**
        - Added a `drawConnectors` function to `src/pages/Pose/render.service.ts` to draw lines between specified landmark pairs.
        - Defined `POSE_CONNECTIONS` and `HAND_CONNECTIONS` arrays containing the indices of connected landmarks for pose and hands, respectively.
        - Integrated calls to `drawConnectors` for both pose and hand landmarks within the `draw` loop in `render.service.ts`, using their respective connection definitions and drawing options.

### Next Steps / Future Work:

The core real-time pose estimation and rendering are now in place. Potential next steps could include:
- Implementing exercise-specific logic based on landmark data (e.g., rep counting, form correction).
- Improving UI/UX for the pose viewer.
- Optimizing performance for different devices.
- Adding recording playback functionality.

## Instructions for AI Agent:

You are an AI assistant tasked with continuing development on the `lift-mate` project. Your current focus is on the real-time pose estimation feature.

- **Familiarize yourself with the project structure and the `src/pages/Pose/` directory.**
- **Understand the roles of `render.service.ts`, `holistic.service.ts`, `store.ts`, and `PoseViewer.ts`.**
- **Refer to the "Current State and Recent Development" section for a summary of recent changes and resolved issues.**
- **When making changes, adhere to the existing coding style, conventions, and architectural patterns.**
- **Prioritize user experience and performance.**
- **If you encounter new issues or need further clarification, ask targeted questions.**
- **Your goal is to build upon the existing functionality, potentially addressing items listed under "Next Steps / Future Work".**
