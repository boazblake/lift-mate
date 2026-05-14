import m from "mithril";
import {
  workouts,
  isLoading,
  error,
  loadWorkouts,
  getRecentWorkouts,
} from "../stores/workoutStore";
import type { Workout } from "../stores/workoutStore";
import { loadSessionSummaries, sessionSummaries } from "../stores/sessionStore";
import { loadSelectedPoseExercise } from "../stores/poseSelectionStore";
import { resolveTrackableExercise } from "../domain/exerciseCatalog";
import { getExRxExercise } from "../domain/exrx";

let lastSelectedExercise = "Squat";

const resolvePoseExerciseFromWorkout = (workout: Workout): string | null => {
  for (const item of workout.exercises) {
    const resolved = resolveTrackableExercise(item.name);
    if (resolved) return resolved.canonicalName;
  }
  return null;
};

const goToPose = (exerciseName?: string | null, autoStart = false) => {
  m.route.set("/pose", {
    exercise: exerciseName || undefined,
    autostart: autoStart ? "1" : undefined,
  });
};

const daysSince = (date?: Date) => {
  if (!date) return "Not started";
  const days = Math.round((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

const HomePage: m.Component = {
  oninit: () => {
    loadWorkouts();
    loadSessionSummaries();
    const persisted = loadSelectedPoseExercise();
    if (persisted) lastSelectedExercise = persisted;
  },

  view: () => {
    const list = workouts();
    const recent = getRecentWorkouts();
    const resume = recent[0];
    const recentSessions = sessionSummaries().slice(0, 3);

    return m("section.home-launch", [
      m("section.home-hero", [
        m("p.home-eyebrow", "Lift-Mate"),
        m("h2.home-title", "Recent sessions and fast restart"),
        m("p.home-subtitle", "Exercise selection now happens on camera screen with instant start once chosen."),
      ]),

      m("section.home-actions", [
        m(
          "ion-button",
          {
            expand: "block",
            class: "home-start-btn",
            onclick: () => goToPose(lastSelectedExercise || undefined),
          },
          "Go to Exercise Camera"
        ),
        m(
          "ion-button",
          {
            expand: "block",
            fill: "outline",
            onclick: () => m.route.set("/progress"),
          },
          "View Progress"
        ),
        resume
          ? m(
              "ion-button",
              {
                expand: "block",
                fill: "outline",
                onclick: () => goToPose(resolvePoseExerciseFromWorkout(resume), true),
              },
              `Resume: ${resume.name}`
            )
          : null,
        lastSelectedExercise
          ? m("ion-note", { style: "display:block; color: var(--ion-color-medium);" }, `Last selected exercise: ${lastSelectedExercise}`)
          : null,
      ]),

      isLoading()
        ? m("ion-card", [
            m("ion-card-content", "Loading workouts."),
          ])
        : null,

      error()
        ? m("ion-card", { color: "danger" }, [
            m("ion-card-content", [
              m("p", { style: "margin: 0 0 8px;" }, "Could not load local data."),
              m("ion-button", { size: "small", fill: "outline", onclick: loadWorkouts }, "Try again"),
            ]),
          ])
        : null,

      !isLoading() && !error() && list.length === 0
        ? m("ion-card", [
            m("ion-card-content", [
              m("h3", { style: "margin: 0 0 8px;" }, "No workouts yet."),
              m("p", { style: "margin: 0 0 12px; color: var(--ion-color-medium);" }, "Start your first workout to begin tracking."),
              m("ion-button", { size: "small", onclick: () => goToPose(undefined) }, "Open Exercise Camera"),
            ]),
          ])
        : null,

      !isLoading() && !error() && list.length > 0
        ? m("section", [
            m("h3", { style: "margin: 0 0 10px; font-size: 16px;" }, "Recent"),
            m(
              "ion-list",
              { inset: true },
              recent.length === 0
                ? m("ion-item", m("ion-label", [m("h3", "No recent sessions"), m("p", "Complete one session to enable Resume.")]))
                : recent.map((w) =>
                  m(
                    "ion-item",
                    {
                      button: true,
                      detail: true,
                      onclick: () => goToPose(resolvePoseExerciseFromWorkout(w), true),
                    },
                    [
                      m("ion-icon", { slot: "start", name: w.icon }),
                      m("ion-label", [
                        m("h3", w.name),
                        m("p", daysSince(w.lastPerformedAt)),
                        (() => {
                          const exerciseName = resolvePoseExerciseFromWorkout(w) || "Unknown";
                          const exrx = getExRxExercise(exerciseName);
                          return m("p", { style: "color: var(--ion-color-medium);" }, exrx?.classification?.mechanics || "No mechanics tagged");
                        })(),
                      ]),
                    ]
                  )
                )
            ),

            recentSessions.length > 0
              ? m("section", { style: "margin-top: 14px;" }, [
                  m("h3", { style: "margin: 0 0 10px; font-size: 16px;" }, "Recent Sessions"),
                  m(
                    "ion-list",
                    { inset: true },
                    recentSessions.map((session) =>
                      m(
                        "ion-item",
                        {
                          button: true,
                          detail: true,
                          onclick: () => m.route.set("/playback"),
                        },
                        [
                          m("ion-icon", { slot: "start", name: "play-back-outline" }),
                          m("ion-label", [
                            m("h3", session.exercise),
                            m("p", `${session.reps} reps - ${session.durationSec}s - score ${session.score}`),
                            m("p", { style: "color: var(--ion-color-medium);" }, `status ${session.status} - frames ${session.frameCount}`),
                          ]),
                        ]
                      )
                    )
                  ),
                ])
              : null,
          ])
        : null,
    ]);
  },
};

export default HomePage;
