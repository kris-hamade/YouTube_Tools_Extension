// content.js

let globalConfig = {};
let delay = 10000;
let isEnabled = true;
let isDebugMode = false;
let playbackTimer = 0;
let lastUrl = window.location.href;

function debugLog(...args) {
  if (isDebugMode) {
    console.log(...args);
  }
}

// Listen for config updates from the background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateConfig") {
    globalConfig = message.config;
    debugLog("Configuration updated:", globalConfig);
  }
});

// Grab the config from background on startup
function requestConfig() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getConfig" }, (response) => {
      if (response && response.config) {
        globalConfig = response.config;
        resolve(response.config);
      } else {
        resolve({});
      }
    });
  });
}

// Main function that clicks the like button
function likeFunction() {
  if (!isEnabled || !globalConfig.likeButtonSelector) {
    debugLog("Feature not enabled or config not loaded.");
    return;
  }

  const adBadge = document.querySelector(globalConfig.adBadgeSelector);
  if (adBadge && adBadge.offsetParent !== null) {
    // offsetParent === null often means "hidden" or "display:none"
    // If it's visible, skip the like. If it's hidden, keep going.
    debugLog("Ad is visibly playing, skipping like");
    return;
  }

  const likeButtonViewModel = document.querySelector(globalConfig.likeButtonSelector);
  const likeButton = likeButtonViewModel ? likeButtonViewModel.querySelector("button") : null;

  const dislikeButtonViewModel = document.querySelector(globalConfig.dislikeButtonSelector);
  const dislikeButton = dislikeButtonViewModel ? dislikeButtonViewModel.querySelector("button") : null;

  if (!likeButton || !dislikeButton) {
    debugLog("Like/Dislike button not found");
    return;
  }

  // Only click like if user hasn't disliked the video yet
  if (dislikeButton.getAttribute("aria-pressed") === "false") {
    if (likeButton.getAttribute("aria-pressed") === "false") {
      debugLog("Clicking the like button");
      likeButton.click();
    } else {
      debugLog("Like button is already pressed");
    }
  } else {
    debugLog("Dislike button is pressed or not found");
  }
}

// Check URL changes (SPA navigation)
function checkForUrlChange() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    debugLog("URL changed from", lastUrl, "to", currentUrl);
    lastUrl = currentUrl;
    playbackTimer = 0; // reset
  }
}

// Periodically run checks
setInterval(() => {
  checkForUrlChange();

  // Grab video element
  const videoElement = document.querySelector(globalConfig.videoElementSelector);

  // If the video is paused, refresh config (optional)
  if (videoElement && videoElement.paused) {
    requestConfig();
  }

  // If the video is playing, increment a counter until we reach the delay
  if (videoElement && !videoElement.paused) {
    playbackTimer += 1000;
    if (playbackTimer >= delay) {
      likeFunction();
      playbackTimer = 0;
    }
  }
}, 1000);

// On load, fetch config
requestConfig().then((config) => {
  debugLog("Got config:", config);
});
