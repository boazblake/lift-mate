import m from "mithril";
import PoseViewer from "./PoseViewer.ts";
const Exercise = () => {
  return {
    view: () =>
      m(
        "section",
        // { style: { "--background": "transparent" } },
        m(PoseViewer)
      ),
  };
};

export default Exercise;
