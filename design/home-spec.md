# Home Screen — Component Spec

**App:** Lift-Mate  
**Screen:** `/` (Home)  
**Status:** Design mockup ready → needs implementation

---

## 1. Purpose & User Goals

The Home screen is the app's landing page. Its goals:

- **Orient** the user with a time-based greeting and streak badge
- **Inform** with weekly stats (workouts, time, reps)
- **Quick-start** a workout session in one tap
- **Surface** recent activity for quick re-entry
- **Browse** all saved workouts with tap-to-open detail
- **Create** new workouts via an "Add Workout" flow

---

## 2. Component Tree

```
IonPage
├── IonContent
│   ├── GreetingSection
│   │   ├── GreetingText (time-based + user name)
│   │   ├── StreakBadge (flame icon + streak count)
│   │   └── WeeklyStats (3 stat items: week count, total time, total reps)
│   ├── QuickStartCard
│   │   ├── PlayIcon
│   │   ├── Label ("Start Workout")
│   │   └── SubLabel ("Begin an empty workout session")
│   ├── RecentActivitySection
│   │   ├── SectionHeader ("Recent Activity" + "See all" link)
│   │   └── RecentScroll (horizontal scroll)
│   │       └── RecentCard[] (icon, name, relative date)
│   ├── MyWorkoutsSection
│   │   ├── SectionHeader ("My Workouts" + "+ Add" link)
│   │   └── WorkoutList (vertical list)
│   │       └── WorkoutItem[] (icon, name, exercise count/detail, chevron)
│   ├── EmptyState (conditional)
│   │   ├── Icon (barbell-outline)
│   │   ├── Heading ("No workouts yet")
│   │   ├── Description text
│   │   └── CTA Button ("Create Workout")
│   └── LoadingState (conditional, skeletons)
│       ├── SkeletonGreeting
│       ├── SkeletonQuickStart
│       ├── SkeletonRecentScroll
│       └── SkeletonWorkoutList
├── IonFab (bottom-right)
│   └── IonFabButton (add icon → opens Add Workout modal)
└── AddWorkoutModal (overlay)
    ├── ModalSheet (bottom sheet)
    │   ├── Handle
    │   ├── Title ("New Workout")
    │   ├── InputField (workout name)
    │   ├── IconGrid (10 icon options, single-select)
    │   ├── CreateButton
    │   └── CancelButton
```

---

## 3. State Table

| State | Trigger | Visual | Behavior |
|-------|---------|--------|----------|
| **Loading** | App starts, data fetching | Skeleton placeholders for greeting, quick-start card, recent cards, workout list items. Shimmer animation (1.5s loop). | No interaction possible. Auto-transitions to Normal or Empty. |
| **Normal** | Workouts loaded successfully | Full UI: greeting, quick-start, recent activity, workout list. | All interactions active. |
| **Empty** | No workouts exist | Greeting + stats hidden or minimized. CTA center screen: icon, heading, description, "Create Workout" button. | Only "Create Workout" and "Start Workout" are actionable. |
| **Add Workout** | Tap FAB or "+ Add" | Bottom sheet modal slides up. Backdrop dim + blur. Form with name input and icon grid. | Name required validation (red border + shake on empty submit). Esc/backdrop dismiss. |
| **Error** | Data fetch fails | (Future) Inline error banner below header with retry button. | Retry triggers reload. |

---

## 4. Layout Description

### Zones (top to bottom)

1. **Greeting Section** (120px) — Purple gradient background, full-width. Contains greeting text (top-left), streak badge (top-right), 3 stats in a row at bottom. Left/right padding: 20px.

2. **Quick-Start Card** (~80px) — Dark gradient card with 16px border-radius, 16px horizontal + 8px vertical padding. Play icon (48x48, rounded), title + subtitle text, chevron arrow on right. Shadow: `0 4px 16px rgba(0,0,0,0.12)`.

3. **Recent Activity Section** (~130px) — Section header (title left, "See all" right) + horizontal scroll container. Cards: 140px wide, 14px border-radius, icon (36px) + name + meta. No scrollbar (hidden).

4. **My Workouts Section** (fills remaining) — Section header with "+ Add" action. Vertical list of workout items: 14px border-radius, icon (44px gradient circle) + name + exercise count/detail + chevron right. 10px gap between items.

5. **FAB** — Bottom-right, 16px margin, 56px diameter, purple (`#6c5ce7`) with white add icon.

6. **Add Workout Modal** — Full-screen overlay (rgba black 50% + blur 4px). Bottom sheet: 20px padding, rounded top corners, handle bar. Name input (2px border, 12px radius). Icon grid: 5 columns, square options with selected state (purple border + tint).

### Responsive

- **Mobile (390px+):** Full layout as described. Body wraps phone frame.
- **Narrow (<420px):** Phone frame becomes full-screen, notch hidden, state toggles hidden.
- **Dark mode:** Automatic via `prefers-color-scheme: dark`. Greys replaced with dark-appropriate tints.

---

## 5. Interaction Details

| Interaction | Trigger | Feedback | Notes |
|------------|---------|----------|-------|
| Tap workout item | `onClick` | Scale(0.98) press animation → navigate to `/workout/:id` | `haptics.impact({ style: 'light' })` |
| Tap "Start Workout" | `onClick` | Scale(0.98) press → navigate to `/pose` (empty session) | `haptics.impact({ style: 'medium' })` |
| Tap FAB | `onClick` | No animation (Ionic default) → modal opens | `haptics.impact({ style: 'light' })` |
| Modal open | Programmatic | SlideUp 300ms ease + fadeIn 200ms backdrop | Backdrop dismiss on overlay tap |
| Modal close | Backdrop tap / Cancel / Create | Reverse slideDown 250ms | Reset form state |
| Icon select | Tap icon-option | Deselect all, select tapped. Purple border + tint bg. | Single-select behavior |
| Create submit | Empty name | Red border on input, 1.5s auto-clear | Focus input |
| Create submit | Valid name | Close modal, show toast "Workout created" | Add to list optimistically |

### Animations

- **Skeleton shimmer:** `background-position` keyframe, 1.5s infinite, linear gradient `#e0e0e0 → #f0f0e0`.
- **Modal sheet slide:** `translateY(100%) → translateY(0)`, 300ms ease-out. Reverse on close.
- **Card press:** `scale(1.0) → scale(0.98)`, 150ms.
- **Greeting section:** Subtle floating gradient animation (future enhancement).

---

## 6. Accessibility

- All touch targets ≥ 44×44px
- Color contrast: purple `#6c5ce7` on white (4.5:1+), dark text on light backgrounds
- Icon labels use `aria-label` where text is absent
- Modal traps focus (tab cycling within sheet)
- Skeleton content has `aria-busy="true"` on container
- Empty state text clearly communicates state and action
- Streak badge text + icon (flame) provides redundant encoding

---

## 7. Data Model (Workout)

```typescript
interface Workout {
  id: string;
  name: string;
  icon: string; // Ionicon name
  exercises: Exercise[];
  createdAt: Date;
  lastPerformedAt?: Date;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
}
```

---

## 8. Mithril Component Mapping

| Mockup Component | Mithril Component | Props | Notes |
|-----------------|-------------------|-------|-------|
| GreetingSection | `HomeGreeting` | `user: { name, streak, weeklyStats }` | Time-based greeting computed client-side |
| StreakBadge | `StreakBadge` | `count: number` | Inline component |
| QuickStartCard | `QuickStartCard` | `onStart: () => void` | Navigates to `/pose` |
| RecentScroll | `RecentActivity` | `workouts: Workout[]` | Show last 3-4, `lastPerformedAt DESC` |
| RecentCard | `RecentCard` | `workout: Workout` | Tap navigates to workout detail |
| WorkoutList | `WorkoutList` | `workouts: Workout[]` | Renders list or empty state |
| WorkoutItem | `WorkoutItem` | `workout: Workout, onSelect: () => void` | |
| AddWorkoutModal | `AddWorkoutModal` | `isOpen: Stream<boolean>, onCreate: (data) => void` | Bottom sheet pattern |
| IconGrid | `IconGrid` | `selected: Stream<string>, onSelect: (icon) => void` | |
| LoadingState | Rendered via `HomePage.view()` | `isLoading: Stream<boolean>` | Conditional render |
| EmptyState | Rendered via `WorkoutList` | `workouts.length === 0` | Inline in `WorkoutList` |

---

---

## 9. Tab Bar & Navigation

### Tab Bar (`Tabs.js`)

The app uses Ionic's `ion-tab-bar` with 4 tabs at the bottom of the screen, defined in `src/components/Tabs.js`.

| Tab | Route | Icon | Label |
|-----|-------|------|-------|
| Home | `/` | `home` | Home |
| Exercise | `/pose` | `barbell` | Exercise |
| Exercise Review | `/playback` | `refresh-outline` | Exercise Review |
| Progress | `/progress` | `stats-chart` | Progress |

### Active State Highlighting

- The active tab uses Ionic's default `ion-tab-button` selected styling (bold icon + tinted color).
- Implementation: `ion-tab-button` receives a `selected` class automatically when its associated route matches. In Mithril, add a `class: m.route.get() === '/' ? 'tab-selected' : ''` conditional on each tab button.
- Active icon tint: `var(--ion-color-primary, #6c5ce7)`. Inactive: `var(--ion-color-medium, #8e8e93)`.
- The tab bar is always visible except during full-screen camera or playback overlay modes (where the content area extends to fill the full viewport).

### Side Menu (`SideMenu.js`)

The side menu is defined in `src/components/SideMenu.js` and is accessible via the hamburger menu button (`ion-menu-button`) in the toolbar.

| Menu Item | Route | Icon (future) |
|-----------|-------|---------------|
| Settings | `/settings` | `settings-outline` |
| About | `/about` | `information-circle-outline` |

- Settings and About routes do not yet exist (will be created in a future iteration).
- The side menu uses `ion-menu[side=start]` with `menuId="mainMenu"` and `contentId="mainContent"`.
- Menu items use Mithril `m.route.set()` for navigation.

### Dark Mode Toggle

- Dark mode is always-on via the Ionic dark palette: `@import "https://cdn.jsdelivr.net/npm/@ionic/core/css/palettes/dark.always.css"`.
- A future enhancement will add a user-toggleable dark mode in Settings, using `prefers-color-scheme` media query as default and a manual override stored in localStorage.
- When implemented, the toggle will swap between `dark.always.css` and the default light palette, using a Mithril Stream to track preference.

---

## 11. Implementation Order

1. Create `WorkoutStore` as a Mithril Stream-based store (replace static `list()`)
2. Implement `HomeGreeting`, `StreakBadge`, `QuickStartCard` components
3. Implement `RecentActivity` with horizontal scroll + `RecentCard`
4. Enhance `WorkoutList` with proper styling, empty state, and `WorkoutItem`
5. Implement `AddWorkoutModal` with form validation and icon grid
6. Add loading skeleton state
7. Wire up navigation: quick-start → `/pose`, workout tap → `/workout/:id`
8. Add `haptics.impact()` on primary interactions
9. Add tab active state highlighting in `Tabs.js` using route matching
10. Implement dark mode palette import + optional user toggle in Settings

---

## 12. Mockup Reference

Open `design/home-mockup.html` in a browser to view the interactive prototype. Use the state toggles at the bottom to switch between Normal / Loading / Empty states. The "Add Workout" FAB triggers the bottom sheet modal.
