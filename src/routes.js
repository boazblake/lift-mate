import m from "mithril";
import Layout from "@/components/Layout.js";
import Home from "@/pages/Home.js";
import Pose from "@/pages/Pose/index.ts";
import Progress from "@/pages/Progress.js";

const routes = (mdl) => {
  return {
    "/": {
      render: () => m(Layout, m(Home)),
    },
    "/pose": {
      render: () => m(Layout, m(Pose)),
    },
    "/progress": {
      render: () => m(Layout, m(Progress)),
    },
  };
};

export default routes;
