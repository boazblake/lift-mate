# Exercise Screen — Component Spec

**App:** Lift-Mate
**Screen:** `/pose` (Exercise / Pose Detection)
**Status:** Design mockup ready → needs UI polish on existing implementation

---

## 1. Purpose & User Goals

The Exercise screen is the core camera + pose detection interface. Its goals:

- **Select** an exercise from the library (Squat, Bench Press, etc.)
- **Start** the camera and begin real-time pose landmark tracking
- **Count** reps automatically with a prominent counter
- **Provide form feedback** — per-criterion pass/fail indicators with color coding
- **Record** sessions for later playback review
- **Toggle** which landmark sets are visible (pose, hands, face)
- **Switch** between front and rear cameras
- **Handle errors** gracefully (permission denied, camera init failure)

---

## 2. Component Tree

```
IonPage
├── IonContent
│   ├── CameraHero (position: relative, 65% height)
│   │   ├── ExerciseSelector (ion-select, dropdown at top center)
│   │   ├── VideoFeed (full-absolute, object-fit cover, z-index 1)
│   │   ├── CanvasOverlay (full-absolute, z-index 2, landmark dots + connectors)
│   │   ├── RecordingIndicator (top-left, red dot + mm:ss timer)
│   │   ├── FormFeedback (top-right, pill badge: good/bad/neutral)
│   │   ├── RepCounter (bottom-left, large number + "REPS" label)
│   │   ├── StartOverlay (centered play button, visible on Idle/Stopped)
│   │   ├── LoadingOverlay (centered spinner + text)
│   │   └── ErrorOverlay (camera icon, title, description, settings button)
│   └── ControlsArea
│       ├── FormIndicatorBar (4 items: Depth, Back, Knees, Hips — pass/fail/neutral)
│       ├── ExerciseInfo (exercise name, set X of Y, target reps)
│       └── FabRow (5 buttons)
│           ├── PoseToggle (body-outline, toggles pose landmarks)
│           ├── HandsToggle (hand-left-outline, toggles hand landmarks)
│           ├── FaceToggle (happy-outline, toggles face landmarks)
│           ├── CameraSwitch (camera-reverse-outline, front/rear)
│           └── RecordButton (radio-button-on-outline / stop-circle)
```

---

## 3. State Table

| State | Trigger | Visual | Behavior |
|-------|---------|--------|----------|
| **Idle** | App lands on /pose | Dark camera feed (50% opacity), start button overlay centered (large play icon). Selector enabled. No landmarks. | Tap start → transitions to Loading. Select exercise. |
| **Loading** | User taps start | Full-screen spinner overlay ("Initializing camera...") over dimmed feed. Selector hidden. | Async: camera init, holistic model load. Auto-transitions to Streaming or Error. |
| **Streaming** | Camera + model ready | Full camera feed + canvas overlay (landmarks). Rep counter active. Form feedback pill visible. Recording indicator visible. Controls active. | Real-time landmark rendering. Rep counting active. Form analysis running. Recording optional. |
| **Bad Form** | Form analysis detects error | Form feedback pill turns red with close icon + message. Per-criterion indicators show which aspect failed. | Haptic warning (Capacitor Haptics). No interruption to tracking. |
| **Good Form** | All criteria pass | Form feedback pill turns green with checkmark. Per-criterion indicators all green. | Optional haptic on good rep completion. |
| **Recording** | User taps record button | Red dot + timer in top-left. Record button turns red (stop icon). All landmarks still visible. | Frames accumulated in `recording.frames` stream. Timer ticks up. |
| **Switching Camera** | User taps camera switch | Brief pause in feed, spinner overlay may flash. | Async camera swap. Returns to Streaming. |
| **Error** | Permission denied / init failure | Error overlay: camera-off icon, title, description, "Open Settings" button. Selector hidden. | User must fix camera permissions externally. Retry button to re-init. |
| **Stopped** | User stops session or app | Returns to Idle state UI. Start overlay visible. | Confirm save recording dialog if frames exist. |

---

## 4. Layout Description

### Zones (top to bottom)

1. **Camera Hero** (0–65% of screen, ~548px at 844px total)
   - Dark background (`#0a0a14`)
   - Exercise selector: positioned absolute top-center, 85% width, dark translucent background with blur
   - Camera feed: `<video>` element fills the zone, `object-fit: cover`
   - Canvas overlay: same dimensions, absolute positioned, draws colored landmarks + connector lines
   - Recording indicator: top-left, 20px inset, red dot + timer, blurred bg pill
   - Form feedback: top-right, 20px inset, pill badge that cycles good/bad/neutral
   - Rep counter: bottom-left, 20px inset. Rep number in large 64px bold white font with text shadow. "REPS" label below in uppercase 13px.
   - State overlays: absolute full-zone, centered content with backdrop blur

2. **Controls Area** (35% remainder)
   - **Form Indicator Bar**: 4 horizontal capsules showing individual form criteria. Each: icon + label, colored green (pass), red (fail), or dimmed (neutral). Gap: 8px.
   - **Exercise Info**: Two-column row. Left: exercise name (18px bold) + "Set X of Y" detail. Right: target reps number + "Target reps" label.
   - **FAB Row**: 5 small FAB buttons, horizontally centered, 12px gap. Active toggles are purple (`#6c5ce7`), inactive are translucent white. Camera switch is neutral. Record button is red when active, outline-red when inactive.

### Responsive

- **Mobile (390px+):** Full layout as described with phone frame.
- **Narrow (<420px):** Phone frame fills screen. State toggles hidden.
- **Dark mode:** Always-on via `dark.always.css` palette import. Camera feed is inherently dark.

---

## 5. Interaction Details

| Interaction | Trigger | Feedback | Notes |
|------------|---------|----------|-------|
| Select exercise | `ion-select` change | Dropdown closes, exercise set in store | Must select before or during streaming |
| Start session | Tap start FAB | Scale animation, spinner replaces play icon | `haptics.impact({ style: 'heavy' })` |
| Toggle landmark set | Tap pose/hands/face FAB | Button toggles active/inactive color, landmarks appear/disappear on canvas | Each has independent toggle |
| Switch camera | Tap camera FAB | Brief pause, feed swaps front/rear | `haptics.impact({ style: 'light' })` |
| Start/stop recording | Tap record FAB | Red dot + timer appear/disappear, button icon swaps | Confirm dialog on stop if frames > 0 |
| View form detail | Tap form feedback pill | Cycles through good → bad → neutral → good | Shows different message each state |
| Dismiss error | Tap "Open Settings" | Opens device camera settings | External navigation |

### Animations

- **Start button press:** `scale(1.0) → scale(0.95)`, 100ms
- **Recording dot:** `pulse` keyframe, 1.2s infinite (opacity + scale)
- **Form feedback transition:** 0.3s ease color/gradient swap
- **State overlay fade:** 200ms opacity ease-in
- **FAB toggle:** 150ms color swap with no scale

---

## 6. Accessibility

- All touch targets ≥ 44px (FABs are 56px default, pills are sized to fit content)
- Form feedback uses color + icon (not color alone): checkmark (good), X (bad), dot (neutral)
- Recording indicator uses dot animation + text timer (not just color)
- Exercise selector has clear placeholder and selected value
- `aria-label` on icon-only FAB buttons

---

## 7. Data Flow

```
User taps start
  → state transitions Idle → Loading
  → cameraService.initialize() [async]
  → holisticService.initialize() [async]
  → both ready → state transitions Loading → Ready → Streaming
  → renderService.startLoop() (requestAnimationFrame)
    → holisticService sends frames
    → renderService draws landmarks to canvas
    → exercise.validate(landmarks) → form status + rep count
  → recording.active() ? push frames to recording.frames[]

User taps stop
  → renderService.stopLoop()
  → cameraService.stop()
  → holisticService.close()
  → state → Stopped
  → if frames.length > 0 → confirm save → saveRecording()
```

---

## 8. Mithril Component Mapping

| Mockup Component | Mithril Component | Props | Notes |
|-----------------|-------------------|-------|-------|
| CameraHero | `PoseViewer` (existing) | — | Enhanced with overlays |
| ExerciseSelector | `ion-select` in PoseViewer | `value, onchange` | Pass exercises array |
| CanvasOverlay | Canvas in PoseViewer | — | Already exists in model |
| RecordingIndicator | New inline component | `recording.active, recording.startTime` | Stream-based timer |
| FormFeedback | New `FormFeedback` | `formStatus: Stream<'good'|'bad'|'neutral'>` | Colors + icon + text |
| RepCounter | New `RepCounter` | `count: Stream<number>` | Large bold number |
| StartOverlay | Existing start FAB | `state === 'Idle' | 'Stopped'` | Enhanced with full-overlay bg |
| LoadingOverlay | Existing spinner logic | `isLoading` stream | Enhanced overlay style |
| ErrorOverlay | New `CameraError` | `error: Stream<string|null>` | Permission denied + settings |
| FormIndicatorBar | New `FormIndicatorBar` | `criteria: FormCriterion[]` | Array of {name, status} |
| FabRow | Existing FAB controls | `features, recording` | Enhanced styling |

---

## 9. Implementation Order

1. Add `FormFeedback` component with 3-state cycling (good/bad/neutral)
2. Add `RepCounter` component reading from exercise validation rep count
3. Add `RecordingIndicator` component with elapsed timer from `recording.startTime`
4. Add `FormIndicatorBar` component for per-criterion visual feedback
5. Style the camera hero overlays: improve z-index stacking, backdrop blur on pills
6. Enhance error overlay with permission-denied-specific messaging
7. Add dark palette import (`dark.always.css`)

---

## 10. Mockup Reference

Open `design/exercise-mockup.html` in a browser to view the interactive prototype. Use the state toggles at the bottom to switch between Streaming / Idle / Loading / Error states. Tap the form feedback pill to cycle through good/bad/neutral indicators. Tap FAB buttons to toggle active/inactive states. Recording indicator animates when visible.
