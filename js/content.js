// Import Sentry for error monitoring
import * as Sentry from '@sentry/browser';

// Initialize Sentry for error tracking
Sentry.init({
    dsn: "https://0cd20cd0af1176800c70f078797e7a3c@o322105.ingest.sentry.io/4505964366004224",
    tracesSampleRate: 1.0,
    sendDefaultPii: false, // Ensure default PII is not sent
    release: process.env.VERSION,
    beforeSend(event) {
        // Anonymize request URL
        if (event.request) {
            event.request.url = "Anonymized";
        }
        // Completely remove IP address from user info
        if (event.user) {
            event.user.ip_address = null; // Or set to an empty string ""
        }
        
        // Ignore ResizeObserver events
        if (event.message && event.message.includes('ResizeObserver')) {
            return null; // Exclude this event
        }

        return event;
    }
});

// Define global variables
let globalConfig = {};
let delay = 10000; // Default delay of 10 seconds
let isEnabled = true; // Feature enable state
let isDebugMode = process.env.DEBUG_MODE === true; // Debug mode state
let playbackTimer = 0; // Timer for playback delay
let lastUrl = window.location.href; // Store the last URL for comparison

// Custom debug log function
const debugLog = (...messages) => {
    if (isDebugMode) {
        console.log(...messages);
    }
};

function requestConfig(retries = 5, interval = 2000) {
    return new Promise((resolve, reject) => {
        function attemptFetchConfig(attempt) {
            chrome.runtime.sendMessage({ action: "getConfig" }, response => {
                if (response && response.config) {
                    debugLog("Configuration fetched:", response.config);
                    globalConfig = response.config;
                    resolve(response.config);
                } else if (attempt < retries) {
                    debugLog(`Retrying fetch config: attempt ${attempt + 1}`);
                    setTimeout(() => attemptFetchConfig(attempt + 1), interval);
                } else {
                    let errorMsg = 'Failed to fetch configuration from background script after multiple attempts.';
                    debugLog(errorMsg, response);
                    reject(new Error(errorMsg));
                }
            });
        }
        attemptFetchConfig(0);
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
    debugLog("Received message:", message);
    switch (message.type) {
        case 'updateDelay':
        case 'updateEnabled':
        case 'updateDebugMode':
        case 'updateConfig':
            applyMessage(message);
            break;
        default:
            debugLog("Unhandled message type:", message.type);
    }
});

function applyMessage(message) {
    switch (message.type) {
        case 'updateDelay':
            delay = message.value;
            break;
        case 'updateEnabled':
            isEnabled = message.value;
            break;
        case 'updateDebugMode':
            isDebugMode = message.value;
            break;
        case 'updateConfig':
            if (message.config) {
                globalConfig = message.config;
            }
            break;
    }
    debugLog(`${message.type} applied:`, message.value || message.config);
    reloadSettings(); // Ensure the latest settings are applied
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateConfig' && message.config) {
        globalConfig = message.config;
        debugLog('Configuration updated from background script:', globalConfig);
    }
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

    if (videoElement && videoElement.paused) {
        requestConfig()
    }

    if (videoElement && !videoElement.paused) {
        playbackTimer += 1000; // Increment playback timer by 1 second
        if (playbackTimer >= delay) {
            debugLog("Playback timer reached delay threshold:", delay);
            likeFunction(); // Trigger the like function
            playbackTimer = 0; // Reset the playback timer
        }
    }
}, 1000); // Check every 1 second

requestConfig().then(config => {
    debugLog("Configuration fetched and applied at startup:", config);
    reloadSettings(); // Ensure settings are reloaded with fetched config
}).catch(error => {
    Sentry.captureException(error);
    debugLog("Failed to fetch configuration at startup:", error);
});

requestConfig()

debugLog("Extension script loaded and initialized.");