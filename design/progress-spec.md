# Progress Screen — Component Spec

**App:** Lift-Mate
**Screen:** `/progress` (Progress Dashboard)
**Status:** Design mockup ready — current implementation is a stub

---

## 1. Purpose & User Goals

The Progress screen shows the user's fitness data over time. Its goals:

- **Summarize** key stats: total workouts, total reps, current streak
- **Visualize** exercise frequency with a bar chart showing sets per exercise per week
- **Surface** recent activity as a chronological timeline
- **Motivate** with achievements (earned/locked badges)
- **Handle empty state** when user has no workout data
- **Refresh** data via pull-to-refresh gesture

---

## 2. Component Tree

```
IonPage
├── IonContent
│   ├── PageHeader (gradient header: "Your Progress" + subtitle)
│   ├── RefreshHint (pull-down indicator with icon + text)
│   ├── StatsRow (3 stat cards in a horizontal row)
│   │   ├── StatCard (Total Workouts — highlighted with purple tint)
│   │   ├── StatCard (Total Reps)
│   │   └── StatCard (Day Streak)
│   ├── ExerciseFrequencySection
│   │   ├── SectionHeader ("Exercise Frequency" + "This week" action)
│   │   └── ChartCard
│   │       ├── ChartTitle ("Sets completed this week")
│   │       └── BarRow[] (5 rows: label + track + fill)
│   ├── RecentActivitySection
│   │   ├── SectionHeader ("Recent Activity" + "See all" action)
│   │   └── TimelineContainer
│   │       └── TimelineItem[] (dot icon + name + meta with time/reps)
│   ├── AchievementsSection
│   │   ├── SectionHeader ("Achievements" + "2 of 12" count)
│   │   └── AchievementsGrid (4-column grid)
│   │       └── AchievementItem[] (icon circle, name, status)
│   └── EmptyState (conditional)
│       ├── Icon (stats-chart-outline)
│       ├── Heading ("No data yet")
│       ├── Description text
│       └── CTA Button ("Start Workout")
```

---

## 3. State Table

| State | Trigger | Visual | Behavior |
|-------|---------|--------|----------|
| **Normal** | Data loaded | Full dashboard: stats cards, chart, timeline, achievements. | All sections interactive. "See all" shows full activity list. |
| **Empty** | No workout data | Empty state centering: icon, heading, description, CTA button. All sections hidden. | CTA navigates to `/pose`. |
| **Refreshing** | Pull down | (Future) Spinner at top, data reloads. | Pull-to-refresh gesture triggers data fetch. |

---

## 4. Layout Description

### Zones (top to bottom)

1. **Page Header** (~80px): Purple gradient, 24px title "Your Progress", 14px subtitle "Track your gains over time". Decorative circle overlay.

2. **Refresh Hint** (~28px): Centered row with `arrow-down-outline` icon + "Pull down to refresh" text. Medium grey, 12px.

3. **Stats Row** (~90px): 3 equal-width cards in a row with 10px gap. Each has: value (24px, 800 weight), label (11px uppercase), optional icon. First card has a purple highlight border + tint gradient.

4. **Exercise Frequency Section** (~220px):
   - Section header: "Exercise Frequency" (left) + "This week" dropdown (right, purple)
   - Chart card: dark surface, 16px radius, 16px padding. Contains "Sets completed this week" title then 4 bar rows. Each bar: label (13px, 70px width, right-aligned), track (flex fill, 24px height, 12px radius), fill (gradient bar with count label at end).

5. **Recent Activity Section** (variable):
   - Section header: "Recent Activity" + "See all" link
   - Timeline: vertical list with connecting line (2px, 8% opacity). Each item: dot (32px circle with icon) + name (15px bold) + meta (time + reps, 12px). 14px gap, 16px bottom padding per item.

6. **Achievements Section** (bottom, ~200px):
   - Section header: "Achievements" + "2 of 12" progress count
   - Grid: 4 columns, 10px gap. Each item: icon circle (44px, earned = purple gradient, locked = grey + grayscale), name (11px), status (10px). 12px padding, 14px radius.

### Responsive
- **Mobile (390px+):** Full layout with phone frame.
- **Narrow (<420px):** Frame fills screen. State toggles hidden.
- **Dark mode:** Always-on via `dark.always.css`.

---

## 5. Interaction Details

| Interaction | Trigger | Feedback | Notes |
|------------|---------|----------|-------|
| Tap stat card | `onClick` | No navigation — informational | Could link to detail in future |
| Tap "This week" | `onClick` | Dropdown menu (ion-select or popover) with period options | Week/Month/Year/All |
| Tap bar chart | `onClick` | (Future) Could drill into exercise detail | |
| Tap timeline item | `onClick` | Navigate to workout detail from that date | `haptics.impact({ style: 'light' })` |
| Tap "See all" | `onClick` | Navigate to full activity list (/progress/activity) | |
| Tap achievement | `onClick` | (Future) Show achievement detail modal with unlock criteria | |

### Animations
- **Bar chart fill:** Width transition 0.6s ease on render.
- **Timeline line:** Static connector (no animation).
- **Refresh pull:** Standard iOS pull-to-refresh gesture (future).

---

## 6. Accessibility

- Stat values are large (24px, 800 weight) for readability
- Bar chart uses color + label position + count number (not color alone)
- Achievement icons have earned/locked text status, not just visual
- Timeline connecting line is lightweight (2px, 8% opacity) and doesn't interfere with content
- All touch targets ≥ 44px

---

## 7. Data Model

```typescript
interface ProgressStats {
  totalWorkouts: number;
  totalReps: number;
  currentStreak: number;
}

interface ExerciseFrequency {
  exerciseName: string;
  setsCompleted: number;
  color: string; // gradient class name
}

interface ActivityEntry {
  id: string;
  workoutName: string;
  date: Date;
  reps: number;
  icon: string;
  color: string;
}

interface Achievement {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  progress?: { current: number; target: number };
}
```

---

## 8. Mithril Component Mapping

| Mockup Component | Mithril Component | Props | Notes |
|-----------------|-------------------|-------|-------|
| PageHeader | `ProgressHeader` | — | Static gradient |
| StatsRow | `StatsRow` | `stats: ProgressStats` | 3 stat cards |
| StatCard | `StatCard` | `value: string, label: string, highlight?: boolean` | |
| ChartCard | `FrequencyChart` | `data: ExerciseFrequency[]` | CSS bar chart |
| BarRow | `BarRow` | `label: string, count: number, max: number, color: string` | Width = count/max * 100% |
| TimelineContainer | `ActivityTimeline` | `entries: ActivityEntry[]` | |
| TimelineItem | `TimelineItem` | `entry: ActivityEntry, isLast: boolean` | Last item has no connector line |
| AchievementsGrid | `AchievementsGrid` | `achievements: Achievement[]` | 4-col grid |
| AchievementItem | `AchievementItem` | `achievement: Achievement` | |
| EmptyState | Inline in ProgressPage | `hasData: boolean` | Conditional render |

---

## 9. Implementation Order

1. Create `ProgressPage` component with page header and scrollable content area
2. Implement `StatsRow` with 3 stat cards (data from store or mock)
3. Implement `FrequencyChart` with CSS bar chart (no library)
4. Implement `ActivityTimeline` with vertical connector lines
5. Implement `AchievementsGrid` with earned/locked state
6. Add empty state handling
7. Wire up navigation: CTA → `/pose`, "See all" → activity list, timeline tap → workout detail

---

## 10. Mockup Reference

Open `design/progress-mockup.html` in a browser to view the interactive prototype. Use the state toggles at the bottom to switch between Normal and Empty states.
