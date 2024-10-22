import m from "mithril";
import Layout from "@/components/Layout.js";
import Home from "@/pages/Home.js";
import Exercise from "@/pages/Exercise/index.js";
import Progress from "@/pages/Progress.js";

const routes = (mdl) => {
  return {
    "/": {
      render: () => m(Layout, m(Home)),
    },
    "/exercise": {
      render: () => m(Layout, m(Exercise)),
    },
    "/progress": {
      render: () => m(Layout, m(Progress)),
    },
  };
};

export default routes;
