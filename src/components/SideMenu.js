import m from "mithril";
import { canNavigateTo } from "../utils/navigationGuards";
import { exercises } from "../pages/Pose/exercises";
import { loadSelectedPoseExercise, saveSelectedPoseExercise } from "../stores/poseSelectionStore";
import ExerciseAutocomplete from "./ExerciseAutocomplete";

const items = [
  { route: "/", icon: "home-outline", label: "Home" },
  { route: "/pose", icon: "barbell-outline", label: "Exercise" },
  { route: "/playback", icon: "play-back-outline", label: "Review" },
  { route: "/progress", icon: "stats-chart-outline", label: "Progress" },
];

const quickLinks = [
  { route: "/settings", icon: "settings-outline", label: "Settings" },
  { route: "/progress", icon: "body-outline", label: "Body Stats" },
  { route: "/about", icon: "person-circle-outline", label: "Profile" },
];

const allExerciseNames = exercises.map((ex) => ex.meta.name).sort((a, b) => a.localeCompare(b));

const usageKey = "liftmate:exerciseUsage";
const loadUsage = () => {
  try {
    return JSON.parse(localStorage.getItem(usageKey) || "{}") || {};
  } catch {
    return {};
  }
};
const saveUsage = (usage) => localStorage.setItem(usageKey, JSON.stringify(usage));

const sortByUsageThenAlpha = (names) => {
  const usage = loadUsage();
  return [...names].sort((a, b) => {
    const ac = usage[a] || 0;
    const bc = usage[b] || 0;
    if (ac !== bc) return bc - ac;
    return a.localeCompare(b);
  });
};

const chooseExercise = async (name) => {
  if (!name) return;
  saveSelectedPoseExercise(name);
  const usage = loadUsage();
  usage[name] = (usage[name] || 0) + 1;
  saveUsage(usage);
  await navigate("/pose");
};

const navigate = async (route) => {
  if (await canNavigateTo(route)) {
    m.route.set(route);
  }
  const menu = document.querySelector("ion-menu");
  if (menu && typeof menu.close === "function") {
    await menu.close();
  }
};

const SideMenu = {
  view: () => {
    const activeRoute = m.route.get();
    const isActive = (route) =>
      route === "/"
        ? activeRoute === "/"
        : activeRoute === route || activeRoute.startsWith(route + "/");

    return m(
      "ion-menu",
      { side: "start", menuId: "mainMenu", contentId: "appShellContent" },
      [
        m("ion-header", [m("ion-toolbar", [m("ion-title", "Menu")])]),
        m("ion-content", [
          m(
            "ion-list.menu-list",
            items.map((item) =>
              m(
                "ion-item",
                {
                  key: item.route,
                  button: true,
                  detail: false,
                  class: `menu-item ${isActive(item.route) ? "menu-item-active" : ""}`,
                  onclick: () => navigate(item.route),
                },
                [m("ion-icon", { class: "menu-item-icon", name: item.icon, slot: "start" }), m("ion-label", { class: "menu-item-label" }, item.label)]
              )
            )
          ),
          activeRoute.startsWith("/pose")
            ? m("div", { style: "padding: 8px 12px 12px;" }, [
                m("ion-note", { style: "display:block; margin-bottom: 8px;" }, "Pick exercise (starts session on camera page)"),
                m(ExerciseAutocomplete, {
                  options: sortByUsageThenAlpha(allExerciseNames),
                  value: loadSelectedPoseExercise() || "",
                  placeholder: "Filter exercises",
                  maxResults: 12,
                  onSelect: (name) => {
                    void chooseExercise(name);
                  },
                }),
              ])
            : null,
          m("ion-list", { inset: true }, [
            m("ion-list-header", "Quick Links"),
            ...quickLinks.map((item) =>
              m(
                "ion-item",
                {
                  key: `quick-${item.route}`,
                  button: true,
                  detail: false,
                  onclick: () => navigate(item.route),
                },
                [m("ion-icon", { name: item.icon, slot: "start" }), m("ion-label", item.label)]
              )
            ),
          ]),
        ]),
      ],
    );
  },
};

export default SideMenu;
