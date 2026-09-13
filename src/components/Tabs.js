import m from "mithril";

const tabs = [
  { route: "/", icon: "home", label: "Home" },
  { route: "/pose", icon: "barbell", label: "Exercise" },
  { route: "/playback", icon: "refresh-outline", label: "Review" },
  { route: "/progress", icon: "stats-chart", label: "Progress" },
];

const Tabs = {
  view: ({ children }) => {
    const activeRoute = m.route.get();
    return m("ion-tabs", [
      m(
        "ion-content",
        {
          id: "mainContent",
          fullscreen: true,
        },
        children
      ),
      m("ion-tab-bar", { slot: "bottom" },
        tabs.map((tab) =>
          m("ion-tab-button", {
            class: activeRoute === tab.route ? "tab-selected" : "",
            onclick: () => m.route.set(tab.route),
          }, [
            m("ion-icon", { name: tab.icon }),
            m("ion-label", tab.label),
          ])
        )
      ),
    ]);
  },
};

export default Tabs;
