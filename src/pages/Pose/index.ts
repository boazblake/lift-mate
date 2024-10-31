import m from "mithril";
import PoseViewer from "./PoseViewer";
const Pose = () => {
  return {
    view: () => m("section", m(PoseViewer)),
  };
};

export default Pose;
