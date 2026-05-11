# Playback Screen — Component Spec

**App:** Lift-Mate
**Screen:** `/playback` (Exercise Review)
**Status:** Design mockup ready → needs full UI rework on existing implementation

---

## 1. Purpose & User Goals

The Playback screen lets users review recorded exercise sessions. Its goals:

- **Browse** all recorded sessions in a scrollable card list with metadata
- **Preview** a recording in full-screen with animated landmark overlays
- **Control** playback: play, pause, stop, skip forward/backward
- **Scrub** through a timeline to jump to any point in the recording
- **Configure** playback speed and landmark visibility
- **Delete** recordings
- **Handle empty state** when no recordings exist

---

## 2. Component Tree

```
IonPage
├── IonContent
│   ├── PageHeader (gradient header with title + subtitle)
│   ├── RecordingList (scrollable vertical list)
│   │   └── RecordingCard[] (tap to open player)
│   │       ├── Thumbnail (80x80 SVG stick-figure placeholder)
│   │       ├── Info (exercise name, date, duration, reps, form %)
│   │       └── Bottom (sets count, Play button)
│   ├── EmptyState (conditional)
│   │   ├── Icon (videocam-outline)
│   │   ├── Heading ("No recordings yet")
│   │   ├── Description text
│   │   └── CTA Button ("Start Exercise")
│   └── PlayerView (full-screen overlay, conditional)
│       ├── CloseButton (top-right)
│       ├── CanvasContainer (dark background + SVG skeleton + landmark dots/lines)
│       ├── TimelineSection
│       │   ├── RangeInput (scrubber, styled)
│       │   └── TimeLabels (start, current, end)
│       └── ControlsRow
│           ├── CloseDown (chevron-down)
│           ├── SkipBack (play-skip-back)
│           ├── PlayPause (play/pause toggle, large)
│           ├── SkipForward (play-skip-forward)
│           └── SettingsBtn (settings-outline)
├── IonFab (bottom-right)
│   └── IonFabButton (trash-outline, red — visible when recordings exist)
├── SettingsModal (bottom sheet overlay)
│   ├── Handle
│   ├── Title ("Playback Settings")
│   ├── SpeedSection (4 speed options: 0.5x, 1x, 1.5x, 2x)
│   ├── LandmarkToggles (pose, hands, face — custom toggles)
│   └── DoneButton
└── PlayerFab (bottom-left, visible during playback)
    └── IonFabButton (trash-outline, red, small)
```

---

## 3. State Table

| State | Trigger | Visual | Behavior |
|-------|---------|--------|----------|
| **Normal** | Recordings loaded | Recording list with cards. Gradient header. Delete FAB visible. | Tap card → Playing. Tap delete → confirm → delete. |
| **Empty** | No recordings exist | Empty state: icon, heading, description, "Start Exercise" CTA. FAB hidden. | CTA navigates to `/pose`. |
| **Playing** | Tap recording card | Full-screen player overlay. Dark bg with landmark skeleton + animated dots. Timeline at 0. Controls visible. | Auto-play starts. Timeline advances. Play/pause/skip/stop controls active. |
| **Paused** | Tap pause during playback | Play icon replaces pause icon. Timeline stops advancing. | Tap play to resume. Skip buttons still work. |
| **Settings Open** | Tap settings icon | Bottom sheet modal slides up. Current speed highlighted. Toggle states reflect current config. | Backdrop dismiss. Speed selection updates immediately. Toggle changes apply on close. |
| **Delete Confirm** | Tap trash FAB | Browser confirm dialog (native → Ionic alert dialog in production). | Confirm: remove recording, transition to Empty if last. Cancel: no-op. |

---

## 4. Layout Description

### Recording List (Normal)
- **Page Header**: Purple gradient, 24px bold title + 14px subtitle, ~80px. Decorative circle overlay.
- **Recording Cards**: 16px border-radius, dark surface (`--ion-color-step-50`). Each card has:
  - Top section: 80x80 thumbnail (SVG stick-figure outline) + info block (name 16px bold, date 13px, meta row with time/reps/form icons). 14px padding, 14px gap.
  - Bottom section: border-top separator, sets count (left), "Play" button with play-circle icon (right, purple).
- **Gap between cards**: 12px.
- **Bottom padding**: 100px (to clear FAB + tab bar).
- **Delete FAB**: bottom-right, 16px margin, red (`#ff4757`) with trash icon.

### Player View (full-screen overlay)
- **Close button**: top-right, 36px circle, dark translucent bg.
- **Canvas container**: flex 1, dark `#0a0a14` bg, SVG skeleton + landmark dots/lines.
- **Timeline**: custom range input, 4px track, 18px purple thumb. Labels below (start/current/end time in mm:ss).
- **Controls row**: dark translucent bg, centered row of 5 icon buttons. Play/pause button is largest (44px), centered. Skip back/forward on either side. Settings gear on right. Chevron-down on left (also closes player).
- **Delete FAB**: bottom-left, visible during playback.

### Settings Modal
- Bottom sheet: 20px padding, handle bar, 20px bold title.
- **Speed Section**: 4 flex-equal buttons (0.5x, 1x, 1.5x, 2x). Selected state: purple border + tint.
- **Landmark Display Section**: 4 toggle rows (Pose, Hands, Face, Loop). Label left, custom toggle (purple when on, grey when off) on right.
- **Done button**: clear/medium color, closes modal.

### Responsive
- **Mobile (390px+):** Full layout as described.
- **Narrow (<420px):** Phone frame fills screen. State toggles hidden.
- **Dark mode:** Always-on via `dark.always.css`.

---

## 5. Interaction Details

| Interaction | Trigger | Feedback | Notes |
|------------|---------|----------|-------|
| Tap recording card | `onClick` | Scale(0.98) press → open player overlay | `haptics.impact({ style: 'light' })` |
| Play/pause | `onClick` | Icon swaps play↔pause. Timeline pauses/resumes. | `haptics.impact({ style: 'light' })` |
| Skip forward/back | `onClick` | Jump 5% of total duration on timeline. | Smooth timeline position update |
| Timeline scrub | Input change `oninput` | Current time label updates. Player jumps to frame. | Debounced for performance |
| Settings open | `onClick` | SlideUp 300ms sheet, backdrop fade 200ms | |
| Settings close | Done / backdrop tap | SlideDown 250ms, backdrop fade | |
| Speed select | Tap speed pill | Deselect all, select tapped. Purple border + bg. | Speed applied immediately |
| Toggle landmark | Toggle switch | Immediate on/off visual. Landmarks show/hide. | Independent per set |
| Delete | Tap trash | Confirm dialog (native). On confirm: remove card. | If last card → show empty state |

### Animations
- **Player open:** No transition (instant overlay for responsiveness).
- **Settings modal:** `translateY(100%) → translateY(0)`, 300ms ease-out.
- **Timeline thumb:** Default browser range input transition.
- **Card press:** `scale(1.0) → scale(0.98)`, 150ms.

---

## 6. Accessibility

- All touch targets ≥ 44px (timeline thumb is 18px × 18px but has no tap target issues on mobile)
- Color + icon redundant encoding for all controls
- Recording cards show both text and icon for duration/reps/form
- Empty state clearly communicates actionable next step
- Settings modal uses clear labels + toggles with visible state

---

## 7. Data Model

```typescript
interface Recording {
  id: string;
  exerciseName: string;
  date: Date;
  duration: number; // seconds
  totalReps: number;
  totalSets: number;
  formScore: number; // 0-100
  frames: PoseFrame[];
}

interface PoseFrame {
  timestamp: number;
  poses: LandmarkData;
  // poseLandmarks, faceLandmarks, etc.
}
```

---

## 8. Mithril Component Mapping

| Mockup Component | Mithril Component | Props | Notes |
|-----------------|-------------------|-------|-------|
| PageHeader | `PlaybackHeader` | — | Static gradient header |
| RecordingList | `RecordingList` | `recordings: Stream<Recording[]>` | Renders cards or empty state |
| RecordingCard | `RecordingCard` | `recording: Recording, onSelect: () => void` | Tap opens player |
| EmptyState | Inline in RecordingList | `recordings.length === 0` | CTA routes to /pose |
| PlayerView | `PlayerView` | `recording: Recording, onClose: () => void` | Full-screen overlay |
| TimelineSection | `TimelineScrubber` | `currentFrame: Stream<number>, totalFrames: number, onScrub: (frame) => void` | Range input + time labels |
| PlaybackControls | `PlaybackControls` | `isPlaying, onPlay, onPause, onSkipBack, onSkipForward` | 5-button row |
| SettingsModal | `PlaybackSettings` | `isOpen: Stream, speed, landmarks, onSpeedChange, onLandmarkToggle` | Bottom sheet |
| SpeedSelector | `SpeedSelector` | `speed, onSelect` | 4-option pill grid |

---

## 9. Implementation Order

1. Implement `RecordingCard` with SVG thumbnail placeholder and metadata display
2. Implement `RecordingList` with empty state handling
3. Implement `PlayerView` full-screen overlay with landmark rendering from frame data
4. Implement `TimelineScrubber` with range input and time labels
5. Implement `PlaybackControls` with play/pause/skip/settings buttons
6. Implement `SettingsModal` with speed selection and landmark toggles
7. Wire up delete flow with confirmation dialog
8. Add `haptics.impact()` on primary interactions

---

## 10. Mockup Reference

Open `design/playback-mockup.html` in a browser to view the interactive prototype. Use the state toggles at the bottom to switch between Normal / Empty / Playing states. In Normal state, tap a card to open the player. In the player, tap play/pause to toggle, use the timeline slider to scrub, and tap the settings gear to open the settings modal.
