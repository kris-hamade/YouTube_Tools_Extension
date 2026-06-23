// content.js

// Global variables for configuration + user settings
let globalConfig = {};
let isEnabled = true;
let isSubscribedOnly = false;
let isWaitForAds = false;
let delay = 10000; // default 10 seconds
let delayMode = "seconds";
let delayPercentage = 50;
let playbackTimer = 0;
let lastUrl = window.location.href;
let isDebugMode = true;

function debugLog(...args) {
  if (isDebugMode) {
    console.log("[Content Script]:", ...args);
  }
}

// 1) Fetch config.json
debugLog("Attempting to fetch config.json...");
fetch(chrome.runtime.getURL("dist/config.json"))
  .then((response) => {
    debugLog("config.json fetched, status =", response.status);
    return response.json();
  })
  .then((data) => {
    debugLog("config.json successfully parsed:", data);
    globalConfig = data.config;
    debugLog("Global config now set to:", globalConfig);
  })
  .catch((err) => {
    debugLog("Error loading config.json:", err);
  });

// 2) Listen for config updates from background script (if needed)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog("Received message from background or elsewhere:", message);
  if (message.type === "updateConfig") {
    globalConfig = message.config;
    debugLog("Configuration updated via message:", globalConfig);
  }
});

/**
 * 3) Load user preferences from chrome.storage.sync
 */
function loadUserSettings() {
  debugLog("Loading user settings from chrome.storage.sync...");
  chrome.storage.sync.get(
    ["enabled", "subscribedOnly", "waitForAds", "delay", "delayMode", "delayPercentage"],
    (data) => {
      if (chrome.runtime.lastError) {
        debugLog("Error reading from chrome.storage.sync:", chrome.runtime.lastError);
        return;
      }

      debugLog("chrome.storage.sync data received:", data);
      isEnabled = data.hasOwnProperty("enabled") ? data.enabled : true;
      isSubscribedOnly = data.hasOwnProperty("subscribedOnly") ? data.subscribedOnly : false;
      isWaitForAds = data.hasOwnProperty("waitForAds") ? data.waitForAds : false;
      delay = data.hasOwnProperty("delay") ? data.delay : 10000;
      delayMode = data.hasOwnProperty("delayMode") ? data.delayMode : "seconds";
      delayPercentage = data.hasOwnProperty("delayPercentage") ? data.delayPercentage : 50;

      debugLog("User settings loaded:", {
        isEnabled,
        isSubscribedOnly,
        isWaitForAds,
        delay,
        delayMode,
        delayPercentage,
      });
    }
  );
}

/**
 * 3a) Listen for changes to user preferences in chrome.storage.sync
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    let timingSettingChanged = false;
    if (changes.enabled) {
      isEnabled = changes.enabled.newValue;
      debugLog("Storage changed: isEnabled =", isEnabled);
    }
    if (changes.subscribedOnly) {
      isSubscribedOnly = changes.subscribedOnly.newValue;
      debugLog("Storage changed: isSubscribedOnly =", isSubscribedOnly);
    }
    if (changes.waitForAds) {
      isWaitForAds = changes.waitForAds.newValue;
      debugLog("Storage changed: isWaitForAds =", isWaitForAds);
    }
    if (changes.delay) {
      delay = changes.delay.newValue;
      timingSettingChanged = true;
      debugLog("Storage changed: delay =", delay);
    }
    if (changes.delayMode) {
      delayMode = changes.delayMode.newValue;
      timingSettingChanged = true;
      debugLog("Storage changed: delayMode =", delayMode);
    }
    if (changes.delayPercentage) {
      delayPercentage = changes.delayPercentage.newValue;
      timingSettingChanged = true;
      debugLog("Storage changed: delayPercentage =", delayPercentage);
    }
    if (timingSettingChanged) {
      playbackTimer = 0;
      debugLog("Timing setting changed, playbackTimer reset.");
    }
  }
});

function getLikeDelayState(videoElement) {
  if (delayMode !== "percentage") {
    debugLog(`PlaybackTimer = ${playbackTimer} / Delay = ${delay}`);
    return {
      currentTime: playbackTimer,
      threshold: delay,
    };
  }

  if (!Number.isFinite(videoElement.duration) || videoElement.duration <= 0) {
    debugLog("Video duration is not ready, skipping percentage delay check.");
    return null;
  }

  const threshold = Math.round(videoElement.duration * 1000 * (delayPercentage / 100));
  const currentTime = Math.round(videoElement.currentTime * 1000);
  debugLog(
    `VideoTime = ${currentTime} / PercentDelay = ${threshold} (${delayPercentage}% of ${videoElement.duration.toFixed(1)}s)`
  );
  return {
    currentTime,
    threshold,
  };
}

/**
 * Helper: Check if an ad is currently playing
 */
function isAdPlaying() {
  debugLog("Checking if an ad is playing...");
  if (!globalConfig.adBadgeSelector) {
    debugLog("No adBadgeSelector in globalConfig, returning false");
    return false;
  }
  const adBadge = document.querySelector(globalConfig.adBadgeSelector);
  const isPlaying = adBadge && adBadge.offsetParent !== null;
  debugLog("Ad badge found?", !!adBadge, "Ad is playing?", isPlaying);
  return isPlaying;
}

/**
 * Helper: Check if the user is subscribed
 */
function isUserSubscribed() {
  debugLog("Checking subscription status...");
  if (!globalConfig.subscribedOnlySelector) {
    debugLog("No subscribedOnlySelector in globalConfig, returning false");
    return false;
  }
  const subscribedElement = document.querySelector(globalConfig.subscribedOnlySelector);
  debugLog("Subscribed element found?", !!subscribedElement);
  return !!subscribedElement;
}

/**
 * Main function that attempts to 'like' the video
 */
function likeFunction() {
  debugLog("Entered likeFunction...");
  if (!isEnabled) {
    debugLog("Extension is disabled, skipping likeFunction");
    return;
  }

  if (!globalConfig) {
    debugLog("globalConfig is not defined yet, skipping likeFunction");
    return;
  }
  
  if (!globalConfig.likeButtonSelector || !globalConfig.dislikeButtonSelector) {
    debugLog("Missing like/dislike selectors in globalConfig, skipping likeFunction.");
    return;
  }

  // Subscribed check
  if (isSubscribedOnly && !isUserSubscribed()) {
    debugLog("User not subscribed, skipping because isSubscribedOnly is ON");
    return;
  }

  // Ad check
  if (isWaitForAds && isAdPlaying()) {
    debugLog("Ad is playing, skipping because isWaitForAds is ON");
    return;
  }

  // Grab buttons
  debugLog("Finding likeButtonViewModel:", globalConfig.likeButtonSelector);
  const likeButtonViewModel = document.querySelector(globalConfig.likeButtonSelector);
  const likeButton = likeButtonViewModel ? likeButtonViewModel.querySelector("button") : null;

  debugLog("Finding dislikeButtonViewModel:", globalConfig.dislikeButtonSelector);
  const dislikeButtonViewModel = document.querySelector(globalConfig.dislikeButtonSelector);
  const dislikeButton = dislikeButtonViewModel ? dislikeButtonViewModel.querySelector("button") : null;

  // Validate buttons
  if (!likeButton || !dislikeButton) {
    debugLog("Cannot find likeButton or dislikeButton in DOM, skipping likeFunction.");
    return;
  }

  const dislikeIsPressed = dislikeButton.getAttribute("aria-pressed");
  const likeIsPressed = likeButton.getAttribute("aria-pressed");

  debugLog("dislikeButton aria-pressed =", dislikeIsPressed);
  debugLog("likeButton aria-pressed =", likeIsPressed);

  // If disliked, skip
  if (dislikeIsPressed === "true") {
    debugLog("Dislike button is pressed => skip liking.");
    return;
  }

  // If not liked => click
  if (likeIsPressed === "false") {
    debugLog("Clicking the like button now!");
    likeButton.click();
  } else {
    debugLog("Video is already liked (or aria-pressed is not 'false').");
  }
}

/**
 * Check for URL change (YouTube’s SPA navigation)
 */
function checkForUrlChange() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    debugLog("URL changed from", lastUrl, "to", currentUrl);
    lastUrl = currentUrl;
    playbackTimer = 0; // Reset
  }
}

// 4) Periodically check conditions
debugLog("Starting setInterval for periodic checks...");
setInterval(() => {
  checkForUrlChange();

  if (!globalConfig || !globalConfig.videoElementSelector) {
    debugLog("globalConfig or videoElementSelector not ready yet, skipping this interval iteration.");
    return;
  }

  const videoElement = document.querySelector(globalConfig.videoElementSelector);
  if (!videoElement) {
    debugLog("No videoElement found, skipping...");
    return;
  }
  if (videoElement.paused) {
    debugLog("videoElement is paused, skipping...");
    return;
  }

  // If the video is playing, increment playbackTimer
  playbackTimer += 1000;
  const likeDelayState = getLikeDelayState(videoElement);

  if (likeDelayState !== null && likeDelayState.currentTime >= likeDelayState.threshold) {
    debugLog("Like delay threshold reached, invoking likeFunction...");
    likeFunction();
    playbackTimer = 0;
  }
}, 1000);

// 5) On load, fetch user settings
debugLog("Calling loadUserSettings() on startup...");
loadUserSettings();

// 6) We also have the original onMessage for 'updateSettings' if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateSettings" && message.settings) {
    debugLog("Received updateSettings message:", message.settings);
    const timingSettingChanged =
      message.settings.hasOwnProperty("delay") ||
      message.settings.hasOwnProperty("delayMode") ||
      message.settings.hasOwnProperty("delayPercentage");

    isEnabled = message.settings.enabled ?? isEnabled;
    isSubscribedOnly = message.settings.subscribedOnly ?? isSubscribedOnly;
    isWaitForAds = message.settings.waitForAds ?? isWaitForAds;
    delay = message.settings.delay ?? delay;
    delayMode = message.settings.delayMode ?? delayMode;
    delayPercentage = message.settings.delayPercentage ?? delayPercentage;

    if (timingSettingChanged) {
      playbackTimer = 0;
      debugLog("Timing settings updated in real-time, playbackTimer reset.");
    }

    debugLog("Settings updated in real-time:", {
      isEnabled,
      isSubscribedOnly,
      isWaitForAds,
      delay,
      delayMode,
      delayPercentage,
    });
  }
});
