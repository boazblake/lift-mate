import m from "mithril";
const SideMenu = {
  view: () => {
    return m(
      "ion-menu",
      { side: "start", menuId: "mainMenu", contentId: "mainContent" },
      [
        m("ion-header", [m("ion-toolbar", [m("ion-title", "Menu")])]),
        m("ion-content", [
          m("ion-list", [
            m(
              "ion-item",
              { onclick: () => m.route.set("/settings") },
              "Settings",
            ),
            m("ion-item", { onclick: () => m.route.set("/about") }, "About"),
          ]),
        ]),
      ],
    );
  },
};

export default SideMenu;
