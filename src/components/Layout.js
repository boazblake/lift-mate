import m from "mithril";

import SideMenu from "./SideMenu.js";
import Tabs from "./Tabs.js";

const Layout = {
  view: (vnode) => {
    return m(
      "ion-page",
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
      // Include the SideMenu
      m(SideMenu),

      // Bottom Tabs Navigation
      m(Tabs, m("#mainContent", vnode.children))
    );
  },
};

export default Layout;
