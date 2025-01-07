// background.js

// Import Sentry for error monitoring
import * as Sentry from "@sentry/browser";

// Initialize Sentry for error tracking
Sentry.init({
  dsn: "https://0cd20cd0af1176800c70f078797e7a3c@o322105.ingest.sentry.io/4505964366004224",
  tracesSampleRate: 1.0,
  sendDefaultPii: false,
  release: "1.0.0",
  beforeSend(event) {
    if (event.request) {
      event.request.url = "Anonymized";
    }
    if (event.user) {
      event.user.ip_address = null;
    }
    if (event.message && event.message.includes("ResizeObserver")) {
      return null;
    }
    return event;
  },
});

// Because the background script cannot directly manipulate the DOM,
// we won't duplicate the 'like' logic here. Instead, we can
// listen for extension events or manage storage, etc.

let isDebugMode = true;
function debugLog(...args) {
  if (isDebugMode) {
    console.log("[Background Script]:", ...args);
  }
}

// Example: onInstalled or onStartup, load config.json and broadcast it to content scripts
chrome.runtime.onInstalled.addListener(() => {
  debugLog("Extension installed. Loading config and notifying content scripts...");
  fetch(chrome.runtime.getURL("dist/config.json"))
    .then((response) => response.json())
    .then((data) => {
      chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            type: "updateConfig",
            config: data.config,
          });
        }
      });
    })
    .catch((err) => {
      debugLog("Error loading config.json in background script:", err.message);
      Sentry.captureException(err); // Log the error to Sentry
    });
});

// Example message listener for settings updates from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateEnabled") {
    // could store or log this setting in the background
    debugLog("Enabled was updated to:", message.value);
  } else if (message.type === "updateDelay") {
    debugLog("Delay was updated to:", message.value);
  }
  // ... handle other message types as needed
});
