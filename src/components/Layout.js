import m from "mithril";

import SideMenu from "./SideMenu.js";
import Tabs from "./Tabs.js";

const Layout = {
  view: (vnode) => {
    return m(
      "ion-page",
      // Include the SideMenu

      // Header
      m("ion-header", { class: "ion-no-border" }, [
        m("ion-toolbar", [
          // Menu button to trigger SideMenu
          m("ion-buttons", { slot: "start" }, [
            m("ion-menu-button", { menu: "mainMenu" }),
          ]),
          m("ion-title", vnode.attrs.title || "PoseMate"),
        ]),
      ]),

      m(SideMenu),

      // Main Content
      // Bottom Tabs Navigation
      m(Tabs, m("#mainContent", vnode.children))
    );
  },
};

export default Layout;
