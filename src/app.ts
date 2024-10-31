import m from "mithril";
import routes from "./routes";
import model from "./model";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

// Initialize PWA elements
import { defineCustomElements } from "@ionic/core/loader";

import { addIcons } from "ionicons";
import { library, playCircle, radio, search } from "ionicons/icons";

/* Core CSS required for Ionic components to work properly */
// import "@ionic/core/css/core.css";
//
// /* Basic CSS for apps built with Ionic */
// import "@ionic/core/css/normalize.css";
// import "@ionic/core/css/structure.css";
// import "@ionic/core/css/typography.css";
//
// /* Optional CSS utils that can be commented out */
// import "@ionic/core/css/padding.css";
// import "@ionic/core/css/float-elements.css";
// import "@ionic/core/css/text-alignment.css";
// import "@ionic/core/css/text-transformation.css";
// import "@ionic/core/css/flex-utils.css";
// import "@ionic/core/css/display.css";
//
/**
 * Ionic Dark Palette
 * -----------------------------------------------------
 * For more information, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

// import '@ionic/core/css/palettes/dark.always.css';
// import '@ionic/core/css/palettes/dark.class.css';
// import "@ionic/core/css/palettes/dark.system.css";

/* Theme variables */
// import "./theme/variables.css";

/**
 * On Ionicons 7.2+ these icons
 * get mapped to a kebab-case key.
 * Alternatively, developers can do:
 * addIcons({ 'library': library, 'play-circle': playCircle, 'radio': radio, 'search': search });
 */
addIcons({ library, playCircle, radio, search });

defineCustomElements();
// Types
type Profile = "phone" | "tablet" | "desktop";

interface Settings {
  width: number;
  profile: Profile;
}

// Model interface
interface Model {
  settings: Settings;
  // Add other model properties here
}

const root = document.body;
let winW = window.innerWidth;

// Set display profiles
const getProfile = (w: number): Profile => {
  if (w < 600) return "phone";
  if (w < 920) return "tablet";
  return "desktop";
};

const checkWidth = (winW: number): number => {
  const w = window.innerWidth;
  if (winW !== w) {
    winW = w;
    const lastProfile = (model as Model).settings.profile;
    (model as Model).settings.width = w;
    (model as Model).settings.profile = getProfile(w);
    if (lastProfile !== (model as Model).settings.profile) m.redraw();
  }
  return requestAnimationFrame(() => checkWidth(winW));
};

(model as Model).settings.profile = getProfile(winW);

checkWidth(winW);

m.route(root, "/", routes(model as Model));
