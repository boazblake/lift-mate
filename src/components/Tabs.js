import m from "mithril";

const Tabs = {
  view: ({ children }) => {
    return m("ion-tabs", [
      m(
        "ion-content",
        {
          id: "mainContent",
          fullscreen: true,
        },
        children
      ),
      m("ion-tab-bar", { slot: "bottom" }, [
        m("ion-tab-button", { onclick: () => m.route.set("/") }, [
          m("ion-icon", { name: "home" }),
          m("ion-label", "Home"),
        ]),
        m("ion-tab-button", { onclick: () => m.route.set("/pose") }, [
          m("ion-icon", { name: "barbell" }),
          m("ion-label", "Exercise"),
        ]),
        m("ion-tab-button", { onclick: () => m.route.set("/playback") }, [
          m("ion-icon", { name: "refresh-outline" }),
          m("ion-label", "Exercise Review"),
        ]),
        m("ion-tab-button", { onclick: () => m.route.set("/progress") }, [
          m("ion-icon", { name: "stats-chart" }),
          m("ion-label", "Progress"),
        ]),
      ]),
    ]);
  },
};

export default Tabs;
