import m from "mithril";
import routes from "./routes";
import model from "./model";
import type { Model, Settings, DisplayType } from "./types";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import "setimmediate";

// Initialize PWA elements
import { defineCustomElements } from "@ionic/core/loader";

/* Core CSS required for Ionic components to work properly */
import "@ionic/core/css/core.css";
//
// /* Basic CSS for apps built with Ionic */
import "@ionic/core/css/normalize.css";
import "@ionic/core/css/structure.css";
import "@ionic/core/css/typography.css";
//
// /* Optional CSS utils that can be commented out */
import "@ionic/core/css/padding.css";
import "@ionic/core/css/float-elements.css";
import "@ionic/core/css/text-alignment.css";
import "@ionic/core/css/text-transformation.css";
import "@ionic/core/css/flex-utils.css";
import "@ionic/core/css/display.css";
//
/**
 * Ionic Dark Palette
 * -----------------------------------------------------
 * For more information, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */
//
// import "@ionic/core/css/palettes/dark.always.css";
// import "@ionic/core/css/palettes/dark.class.css";
// import "@ionic/core/css/palettes/dark.system.css";

/* Theme variables */
// import "./theme/variables.css";

defineCustomElements();

const root = document.body;
let winW = window.innerWidth;

const getDisplayType = (w: number): DisplayType => {
  if (w < 600) return "phone";
  if (w < 920) return "tablet";
  return "desktop";
};

const checkWidth = (winW: number): number => {
  const w = window.innerWidth;
  if (winW !== w) {
    winW = w;
    const lastDisplayType = (model as Model).settings.displayType;
    (model as Model).settings.width = w;
    (model as Model).settings.displayType = getDisplayType(w);
    if (lastDisplayType !== (model as Model).settings.displayType) m.redraw();
  }
  return requestAnimationFrame(() => checkWidth(winW));
};

(model as Model).settings.displayType = getDisplayType(winW);

checkWidth(winW);

m.route(root, "/", routes(model as Model));
