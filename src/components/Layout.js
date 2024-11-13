import m from "mithril";
import SideMenu from "./SideMenu.js";
import Tabs from "./Tabs.js";

const Layout = {
  view: (vnode) => {
    return m("ion-page", [
      m("ion-header", { class: "ion-no-border" }, [
        m("ion-toolbar", [
          m("ion-buttons", { slot: "start" }, [
            m("ion-menu-button", { menu: "mainMenu" }),
          ]),
          m("ion-title", vnode.attrs.title || "PoseMate"),
        ]),
      ]),
      m(SideMenu),
      m(Tabs, vnode.children),
    ]);
  },
};

export default Layout;
