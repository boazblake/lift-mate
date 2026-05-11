import m from "mithril";
import Stream from "mithril/stream";
import { workouts, isLoading, loadWorkouts, createWorkout, getRecentWorkouts } from "../stores/workoutStore";
import type { Workout } from "../stores/workoutStore";

interface AddWorkoutModalAttrs {
  isOpen: Stream<boolean>;
}

const AddWorkoutModal = () => {
  const name = Stream("");
  const icon = Stream("barbell");
  const nameError = Stream(false);
  const icons = ["barbell", "dumbbell", "footsteps", "body-outline", "git-network-outline", "fitness-outline", "trending-up-outline", "flame", "heart-outline", "star-outline"];

  const reset = () => {
    name("");
    icon("barbell");
    nameError(false);
  };

  const submit = () => {
    if (!name().trim()) {
      nameError(true);
      setTimeout(() => nameError(false), 1500);
      return;
    }
    createWorkout(name().trim(), icon());
    reset();
  };

  return {
    view: ({ attrs }: m.Vnode<AddWorkoutModalAttrs>) => {
      const open = attrs.isOpen();
      return m("div", {
        class: "modal-overlay" + (open ? " modal-overlay-open" : ""),
        onclick: (e: MouseEvent) => {
          if (e.target === e.currentTarget) {
            attrs.isOpen(false);
            reset();
          }
        },
        style: "position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: " + (open ? "block" : "none") + ";",
      }, m("div", {
        style: "position: absolute; bottom: 0; left: 0; right: 0; background: var(--ion-background-color, #fff); border-radius: 20px 20px 0 0; padding: 20px; animation: slideUp 0.3s ease; max-height: 80%; overflow-y: auto;",
        onclick: (e: MouseEvent) => e.stopPropagation(),
      }, [
        m("div", { style: "width: 36px; height: 4px; border-radius: 2px; background: var(--ion-color-medium-shade); margin: 0 auto 16px;" }),
        m("h2", { style: "font-size: 20px; font-weight: 700; margin-bottom: 20px; color: var(--ion-text-color);" }, "New Workout"),
        m("div", { style: "margin-bottom: 16px;" }, [
          m("label", { style: "font-size: 13px; font-weight: 600; color: var(--ion-color-medium); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block;" }, "Workout Name"),
          m("input", {
            type: "text",
            placeholder: "e.g. Push Day",
            value: name(),
            oninput: (e: InputEvent) => { name((e.target as HTMLInputElement).value); nameError(false); },
            style: "width: 100%; padding: 14px 16px; border: 2px solid " + (nameError() ? "#ff6b6b" : "var(--ion-color-light-shade, #e8e8ed)") + "; border-radius: 12px; font-size: 16px; font-family: inherit; outline: none; transition: border-color 0.2s; background: var(--ion-item-background, #fff); color: var(--ion-text-color);",
          }),
          nameError() ? m("p", { style: "color: #ff6b6b; font-size: 12px; margin-top: 4px;" }, "Please enter a workout name") : null,
        ]),
        m("div", { style: "margin-bottom: 16px;" }, [
          m("label", { style: "font-size: 13px; font-weight: 600; color: var(--ion-color-medium); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block;" }, "Icon"),
          m("div", { style: "display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;" },
            icons.map((icn) =>
              m("div", {
                class: icon() === icn ? "selected" : "",
                onclick: () => icon(icn),
                style: "aspect-ratio: 1; border-radius: 12px; background: " + (icon() === icn ? "rgba(108,92,231,0.1)" : "var(--ion-color-light, #f4f4f9)") + "; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid " + (icon() === icn ? "#6c5ce7" : "transparent") + "; transition: all 0.15s;",
              }, m("ion-icon", { name: icn, style: "font-size: 24px; color: " + (icon() === icn ? "#6c5ce7" : "var(--ion-color-medium, #8e8e93)") + ";" }))
            )
          ),
        ]),
        m("ion-button", {
          expand: "block",
          onclick: submit,
          style: "margin-top: 8px; --border-radius: 12px; font-weight: 600; height: 50px; --background: #6c5ce7;",
        }, [
          m("ion-icon", { name: "checkmark-circle-outline", slot: "start" }),
          "Create Workout",
        ]),
        m("ion-button", {
          expand: "block",
          fill: "clear",
          onclick: () => { attrs.isOpen(false); reset(); },
          style: "margin-top: 4px; --color: var(--ion-color-medium);",
        }, "Cancel"),
      ]));
    },
  };
};

const HomeGreeting = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return {
    view: () => m("div", {
      style: "background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #6c5ce7 100%); padding: 20px 20px 12px; color: #fff; position: relative; overflow: hidden;",
    }, [
      m("div", { style: "display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1;" }, [
        m("div", { style: "line-height: 1.3;" }, [
          m("div", { style: "font-size: 14px; opacity: 0.85; font-weight: 500;" }, getGreeting()),
          m("div", { style: "font-size: 26px; font-weight: 700; letter-spacing: -0.3px;" }, "Alex"),
        ]),
        m("div", { style: "background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border-radius: 20px; padding: 6px 14px; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; position: relative; z-index: 1;" }, [
          m("ion-icon", { name: "flame", style: "font-size: 18px; color: #ffd93d;" }),
          m("span", "8-day streak"),
        ]),
      ]),
      m("div", { style: "display: flex; gap: 24px; margin-top: 16px; position: relative; z-index: 1;" }, [
        m("div", { style: "display: flex; flex-direction: column;" }, [
          m("span", { style: "font-size: 20px; font-weight: 700;" }, "4"),
          m("span", { style: "font-size: 12px; opacity: 0.75; font-weight: 500;" }, "This week"),
        ]),
        m("div", { style: "display: flex; flex-direction: column;" }, [
          m("span", { style: "font-size: 20px; font-weight: 700;" }, "8h 15m"),
          m("span", { style: "font-size: 12px; opacity: 0.75; font-weight: 500;" }, "Total time"),
        ]),
        m("div", { style: "display: flex; flex-direction: column;" }, [
          m("span", { style: "font-size: 20px; font-weight: 700;" }, "386"),
          m("span", { style: "font-size: 12px; opacity: 0.75; font-weight: 500;" }, "Total reps"),
        ]),
      ]),
    ]),
  };
};

const QuickStartCard = () => ({
  view: () => m("div", { style: "padding: 16px 20px 8px;" }, m("div", {
    style: "background: linear-gradient(135deg, #2d3436 0%, #636e72 100%); border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.12); transition: transform 0.15s;",
    onclick: () => m.route.set("/pose"),
    onmousedown: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = "scale(0.98)"; },
    onmouseup: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = ""; },
    onmouseleave: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = ""; },
  }, [
    m("div", { style: "display: flex; align-items: center; gap: 14px;" }, [
      m("div", { style: "width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center;" }, m("ion-icon", { name: "play-circle", style: "font-size: 26px; color: #fff;" })),
      m("div", null, [
        m("h3", { style: "font-size: 17px; font-weight: 600; color: #fff; margin: 0 0 2px;" }, "Start Workout"),
        m("p", { style: "font-size: 13px; color: rgba(255,255,255,0.7); margin: 0;" }, "Begin an empty workout session"),
      ]),
    ]),
    m("ion-icon", { name: "chevron-forward", style: "font-size: 22px; color: rgba(255,255,255,0.5);" }),
  ])),
});

const RecentCard = () => ({
  view: ({ attrs }: m.Vnode<{ workout: Workout }>) => {
    const w = attrs.workout;
    const daysAgo = Math.round((Date.now() - (w.lastPerformedAt?.getTime() || 0)) / 86400000);
    const label = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : daysAgo + " days ago";
    return m("div", {
      style: "flex: 0 0 140px; border-radius: 14px; padding: 14px; background: var(--ion-color-light, #f4f4f9); cursor: pointer; transition: transform 0.15s;",
      onclick: () => m.route.set("/workout/" + w.id),
      onmousedown: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = "scale(0.96)"; },
      onmouseup: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = ""; },
      onmouseleave: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = ""; },
    }, [
      m("div", { style: "width: 36px; height: 36px; border-radius: 10px; background: #6c5ce7; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;" }, m("ion-icon", { name: w.icon, style: "font-size: 20px; color: #fff;" })),
      m("div", { style: "font-size: 14px; font-weight: 600; color: var(--ion-text-color); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" }, w.name),
      m("div", { style: "font-size: 12px; color: var(--ion-color-medium, #8e8e93);" }, label),
    ]);
  },
});

const RecentActivity = () => ({
  view: () => {
    const recent = getRecentWorkouts();
    if (recent.length === 0) return null;
    return m("div", null, [
      m("div", { style: "display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 8px;" }, [
        m("span", { style: "font-size: 18px; font-weight: 700; color: var(--ion-text-color);" }, "Recent Activity"),
      ]),
      m("div", { style: "display: flex; gap: 12px; padding: 0 20px 8px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch;" },
        recent.map((w) => m(RecentCard, { workout: w }))
      ),
    ]);
  },
});

const WorkoutItem = () => ({
  view: ({ attrs }: m.Vnode<{ workout: Workout }>) => {
    const w = attrs.workout;
    const detail = w.exercises.length + " exercise" + (w.exercises.length !== 1 ? "s" : "") + " · " + w.exercises.slice(0, 3).map((e) => e.name).join(", ");
    return m("div", {
      style: "display: flex; align-items: center; gap: 14px; padding: 14px 16px; margin-bottom: 10px; background: var(--ion-color-light, #f8f8fc); border-radius: 14px; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;",
      onclick: () => m.route.set("/workout/" + w.id),
      onmousedown: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = "scale(0.98)"; },
      onmouseup: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = ""; },
      onmouseleave: (e: MouseEvent) => { (e.target as HTMLElement).style.transform = ""; },
    }, [
      m("div", { style: "width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); display: flex; align-items: center; justify-content: center; flex-shrink: 0;" }, m("ion-icon", { name: w.icon, style: "font-size: 22px; color: #fff;" })),
      m("div", { style: "flex: 1; min-width: 0;" }, [
        m("div", { style: "font-size: 15px; font-weight: 600; color: var(--ion-text-color); margin-bottom: 2px;" }, w.name),
        m("div", { style: "font-size: 12px; color: var(--ion-color-medium, #8e8e93);" }, detail),
      ]),
      m("ion-icon", { name: "chevron-forward", style: "font-size: 18px; color: var(--ion-color-medium-shade, #b0b0b5);" }),
    ]);
  },
});

const WorkoutList = () => ({
  view: () => {
    const list = workouts();
    if (list.length === 0) {
      return m("div", { style: "display: flex; flex-direction: column; align-items: center; padding: 40px 20px 100px; text-align: center;" }, [
        m("div", { style: "width: 100px; height: 100px; border-radius: 50%; background: var(--ion-color-light, #f4f4f9); display: flex; align-items: center; justify-content: center; margin-bottom: 20px;" }, m("ion-icon", { name: "barbell-outline", style: "font-size: 48px; color: var(--ion-color-medium, #8e8e93);" })),
        m("h2", { style: "font-size: 22px; font-weight: 700; color: var(--ion-text-color); margin: 0 0 6px;" }, "No workouts yet"),
        m("p", { style: "font-size: 15px; color: var(--ion-color-medium, #8e8e93); line-height: 1.5; max-width: 280px; margin: 0 0 24px;" }, "Create your first workout and start tracking your lifts with real-time form analysis."),
      ]);
    }
    return m("div", null, [
      m("div", { style: "display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 8px;" }, [
        m("span", { style: "font-size: 18px; font-weight: 700; color: var(--ion-text-color);" }, "My Workouts"),
        m("span", {
          style: "font-size: 14px; font-weight: 600; color: #6c5ce7; cursor: pointer;",
          onclick: () => modalOpen(true),
        }, "+ Add"),
      ]),
      m("div", { style: "padding: 0 20px 100px;" }, list.map((w) => m(WorkoutItem, { workout: w }))),
    ]);
  },
});

const LoadingState = () => ({
  view: () => m("div", { style: "padding: 0 20px 100px;" }, [
    m("div", { style: "padding: 20px 0 12px;" }, [
      m("div", { style: "height: 14px; width: 120px; border-radius: 6px; margin-bottom: 8px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
      m("div", { style: "height: 24px; width: 200px; border-radius: 6px; margin-bottom: 16px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
      m("div", { style: "height: 14px; width: 160px; border-radius: 6px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
    ]),
    m("div", { style: "padding: 16px 0 8px;" }, m("div", { style: "height: 80px; border-radius: 16px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" })),
    m("div", { style: "padding: 16px 0 8px;" }, [
      m("div", { style: "height: 16px; width: 100px; border-radius: 6px; margin-bottom: 12px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
      m("div", { style: "display: flex; gap: 12px;" }, [
        m("div", { style: "flex: 0 0 140px; height: 90px; border-radius: 14px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
        m("div", { style: "flex: 0 0 140px; height: 90px; border-radius: 14px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
      ]),
    ]),
    m("div", { style: "padding: 16px 0 8px;" }, [
      m("div", { style: "height: 16px; width: 100px; border-radius: 6px; margin-bottom: 12px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
      Array.from({ length: 3 }).map(() =>
        m("div", { style: "display: flex; align-items: center; gap: 14px; padding: 14px 16px; margin-bottom: 10px; background: var(--ion-color-light, #f8f8fc); border-radius: 14px;" }, [
          m("div", { style: "width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
          m("div", { style: "flex: 1;" }, [
            m("div", { style: "height: 12px; border-radius: 6px; margin-bottom: 6px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
            m("div", { style: "height: 12px; width: 60%; border-radius: 6px; background: linear-gradient(90deg, var(--ion-color-light, #e0e0e0) 25%, var(--ion-color-light-shade, #f0f0f0) 50%, var(--ion-color-light, #e0e0e0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;" }),
          ]),
        ])
      ),
    ]),
  ]),
});

const modalOpen = Stream(false);

const HomePage = {
  oninit: () => {
    loadWorkouts();
  },
  view: () => {
    return m("ion-page", [
      m("ion-content", { fullscreen: true, style: "--background: var(--ion-background-color);" }, [
        isLoading()
          ? m(LoadingState)
          : [
              workouts().length > 0 ? m(HomeGreeting) : null,
              workouts().length > 0 ? m(QuickStartCard) : null,
              workouts().length > 0 ? m(RecentActivity) : null,
              m(WorkoutList),
            ],
      ]),
      m("ion-fab", { vertical: "bottom", horizontal: "end", slot: "fixed", style: "margin-bottom: 16px; margin-right: 16px;" }, [
        m("ion-fab-button", {
          onclick: () => modalOpen(true),
          style: "--background: #6c5ce7; --background-activated: #5a4bd1;",
        }, m("ion-icon", { name: "add" })),
      ]),
      m(AddWorkoutModal, { isOpen: modalOpen }),
    ]);
  },
};

export default HomePage;
