/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-2b0b8943'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "assets/index-B7xHggwe.css",
    "revision": null
  }, {
    "url": "assets/index-DCfYFPLn.js",
    "revision": null
  }, {
    "url": "assets/index-legacy-D3zMdcXz.js",
    "revision": null
  }, {
    "url": "assets/polyfills-legacy-DVIay-M9.js",
    "revision": null
  }, {
    "url": "assets/vision_bundle-legacy-AmhwYl8X.js",
    "revision": null
  }, {
    "url": "assets/vision_bundle-vu33K5Lq.js",
    "revision": null
  }, {
    "url": "assets/web-B-I9JA7D.js",
    "revision": null
  }, {
    "url": "assets/web-BN2M96Wb.js",
    "revision": null
  }, {
    "url": "assets/web-CdHq_Gms.js",
    "revision": null
  }, {
    "url": "assets/web-legacy-2IHs8F01.js",
    "revision": null
  }, {
    "url": "assets/web-legacy-DkVbtHo_.js",
    "revision": null
  }, {
    "url": "assets/web-legacy-UWv03kFH.js",
    "revision": null
  }, {
    "url": "icon.svg",
    "revision": "dd3ae58ae750898b1e93b139e3a57a64"
  }, {
    "url": "index.html",
    "revision": "3a9190ddaa100d5c4430a68c6dd5b50e"
  }, {
    "url": "registerSW.js",
    "revision": "e7a3185972f33088024dcb880f1cd298"
  }, {
    "url": "icon.svg",
    "revision": "dd3ae58ae750898b1e93b139e3a57a64"
  }, {
    "url": "manifest.webmanifest",
    "revision": "360ce81fd7d895651931ca1e640de637"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(({
    request
  }) => request.destination === "document", new workbox.NetworkFirst(), 'GET');
  workbox.registerRoute(({
    request
  }) => request.destination === "script" || request.destination === "style", new workbox.StaleWhileRevalidate(), 'GET');

}));
