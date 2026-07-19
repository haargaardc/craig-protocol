import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./index.css";

// Keep the installed app up to date automatically. registerType is "autoUpdate",
// so a newly-deployed version activates and reloads on its own — but iOS only
// re-checks the service worker when told to. Poll every 60s while the app is
// open (and whenever it returns to the foreground) so updates land without the
// user having to force-quit.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, reg) {
    if (!reg) return;
    setInterval(() => reg.update().catch(() => {}), 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update().catch(() => {});
    });
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
