// Import Sentry for error monitoring
import * as Sentry from '@sentry/browser';

// Initialize Sentry for error tracking
Sentry.init({
    dsn: "https://0cd20cd0af1176800c70f078797e7a3c@o322105.ingest.sentry.io/4505964366004224",
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    beforeSend(event, hint) {
        if (event.request) {
            event.request.url = "Anonymized";
        }
        return event;
    }
});

// Define global variables
let globalConfig = {};
let delay = 10000; // Default delay of 10 seconds
let isEnabled = true; // Feature enable state
let isDebugMode = false; // Debug mode state
let playbackTimer = 0; // Timer for playback delay
let lastUrl = window.location.href; // Store the last URL for comparison

// Custom debug log function
const debugLog = (...messages) => {
    if (isDebugMode) {
        console.log(...messages);
    }
};

function requestConfig() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getConfig" }, response => {
            if (response && response.config) {
                globalConfig = response.config; // Assuming response directly contains the config
                resolve(response.config); // Resolve with the received config
            } else {
                reject(new Error('Failed to fetch configuration from background script.'));
            }
        });
    });
}

// Function to reload extension settings
const reloadSettings = () => {
    chrome.storage.sync.get(['delay', 'enabled', 'debugMode'], function (data) {
        if (data.delay) delay = data.delay;
        if (typeof data.enabled !== 'undefined') isEnabled = data.enabled;
        if (typeof data.debugMode !== 'undefined') isDebugMode = data.debugMode;
        debugLog("Settings reloaded:", { delay, isEnabled, isDebugMode });
    });
};

// Listen for messages from the popup or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateDelay') delay = message.value;
    if (message.type === 'updateEnabled') isEnabled = message.value;
    if (message.type === 'updateDebugMode') isDebugMode = message.value;
    debugLog("Received message:", message);
    reloadSettings();
});

// Main functionality to like a video
const likeFunction = () => {
    try {
        if (!isEnabled) {
            debugLog("Feature is not enabled");
            return;
        }
        const adBadge = document.querySelector('.ytp-ad-simple-ad-badge');
        if (!adBadge) {
            // Using the element names to find the like and dislike buttons
            const likeButtonViewModel = document.querySelector(globalConfig.likeButtonSelector);
            const likeButton = likeButtonViewModel ? likeButtonViewModel.querySelector('button') : null;

            const dislikeButtonViewModel = document.querySelector(globalConfig.dislikeButtonSelector);
            const dislikeButton = dislikeButtonViewModel ? dislikeButtonViewModel.querySelector('button') : null;

            debugLog("Like button:", likeButton, "Dislike button:", dislikeButton);
            debugLog("Global config:", globalConfig);

            if (!likeButton || !dislikeButton) {
                const errorMessage = `Like or Dislike button not found. Like Button: ${likeButton}, Dislike Button: ${dislikeButton}`;
                debugLog(errorMessage);
                Sentry.captureException(new Error(errorMessage));
                return;
            }

            if (dislikeButton.getAttribute('aria-pressed') === 'false') {
                if (likeButton.getAttribute('aria-pressed') === 'false') {
                    debugLog("Clicking like button");
                    likeButton.click();
                } else {
                    debugLog("Like button is already pressed or not found");
                }
            } else {
                debugLog("Dislike button is pressed or not found");
            }
        } else {
            debugLog("Ad badge is present, not clicking like button");
        }
    } catch (error) {
        Sentry.captureException(error);
        debugLog("Error in likeFunction:", error);
    }
};

// Check for URL changes to handle SPA navigation
const checkForUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        debugLog("URL changed from", lastUrl, "to", currentUrl);
        lastUrl = currentUrl;
        playbackTimer = 0; // Reset playback timer on URL change
        // Additional functionality to be added here if needed
    }
};

// Listen to popstate event to detect URL changes in SPA
window.addEventListener('popstate', () => {
    checkForUrlChange();
    debugLog("popstate event detected");
});

// Set an interval to periodically check if conditions to like the video are met
setInterval(() => {
    if (!isEnabled) {
        return; // Do not proceed if the feature is disabled
    }

    checkForUrlChange();

    const videoElement = document.querySelector('video');
    if (videoElement && !videoElement.paused) {
        playbackTimer += 1000; // Increment playback timer by 1 second
        if (playbackTimer >= delay) {
            debugLog("Playback timer reached delay threshold:", delay);
            likeFunction(); // Trigger the like function
            playbackTimer = 0; // Reset the playback timer
        }
    }
}, 1000); // Check every 1 second

// Use the adjusted requestConfig function
requestConfig().then(config => {
    debugLog("Configuration fetched and applied at startup:", config);
    // Any additional startup functionality can be called here
}).catch(error => {
    Sentry.captureException(error);
    debugLog("Failed to fetch configuration at startup:", error);
});

debugLog("Extension script loaded and initialized.");