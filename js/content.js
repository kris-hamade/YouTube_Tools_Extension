import * as Sentry from '@sentry/browser';

Sentry.init({
    dsn: "https://0cd20cd0af1176800c70f078797e7a3c@o322105.ingest.sentry.io/4505964366004224",
    tracesSampleRate: 1.0,
});

let delay = 10000; // Default delay of 10 seconds
let isEnabled = true; // Default state
let isDebugMode = false; // Default debug mode state
let playbackTimer = 0;
let lastUrl = window.location.href;

// Custom debug log function
const debugLog = (...messages) => {
    if (isDebugMode) {
        console.log(...messages);
    }
};

// Function to reload settings including debug mode
const reloadSettings = () => {
    try {
        chrome.storage.sync.get(['delay', 'enabled', 'debugMode'], function (data) {
            if (data.delay) {
                delay = data.delay;
            }
            if (typeof data.enabled !== 'undefined') {
                isEnabled = data.enabled;
            }
            if (typeof data.debugMode !== 'undefined') {
                isDebugMode = data.debugMode;
            }

            debugLog("Settings reloaded: ", { delay, isEnabled, isDebugMode });
        });
    } catch (error) {
        Sentry.captureException(error);
        debugLog("Error in reloadSettings:", error);
    }
};

// Call reloadSettings to load initial settings including debug mode
reloadSettings();

// Update settings when received from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.type === 'updateDelay') {
            delay = message.value;
        }
        if (message.type === 'updateEnabled') {
            isEnabled = message.value;
        }
        if (message.type === 'updateDebugMode') {
            isDebugMode = message.value;
        }
        reloadSettings(); // Reload settings to ensure everything is up-to-date
        debugLog("Received message: ", message);
    } catch (error) {
        Sentry.captureException(error);
        debugLog("Error in onMessage:", error);
    }
});

const likeFunction = () => {
    try {
        if (!isEnabled) {
            debugLog("Feature is not enabled");
            return;
        }

        const adBadge = document.querySelector('.ytp-ad-simple-ad-badge');
        debugLog("Ad Badge presence:", adBadge !== null);

        if (!adBadge) {
            debugLog("No ad badge found, proceeding with like button click");

            let likeButton = document.querySelector('button[title="I like this"]');
            let dislikeButton = document.querySelector('button[title="I dislike this"]');

            debugLog("Initial Like Button (I like this):", likeButton);
            debugLog("Initial Dislike Button (I dislike this):", dislikeButton);

            if (!likeButton) {
                // Additional debug log if the like button is not found initially
                debugLog("Trying to find 'Unlike' button as 'I like this' button is not found");
                likeButton = document.querySelector('button[title="Unlike"]');
                debugLog("Secondary Like Button (Unlike):", likeButton);
            }

            if (!likeButton || !dislikeButton) {
                const errorMessage = `Like or Dislike button not found. Like Button: ${likeButton}, Dislike Button: ${dislikeButton}`;
                debugLog(errorMessage);
                Sentry.captureException(new Error(errorMessage));
                return;
            }

            const isLiked = likeButton.getAttribute('aria-pressed') === 'true';
            debugLog("Is video already liked:", isLiked);

            if (dislikeButton.getAttribute('aria-pressed') === 'false' && !isLiked) {
                debugLog("Clicking like button");
                likeButton.click();
            } else {
                debugLog("Like button is already pressed or not found");
            }
        } else {
            debugLog("Ad badge is present, not clicking like button");
        }
    } catch (error) {
        Sentry.captureException(error);
        debugLog("Error in likeFunction:", error);
    }
};


const checkForUrlChange = () => {
    try {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            debugLog("URL changed from", lastUrl, "to", currentUrl);
            lastUrl = currentUrl;
            playbackTimer = 0;
        }
    } catch (error) {
        Sentry.captureException(error);
        debugLog("Error in checkForUrlChange:", error);
    }
};

window.addEventListener('popstate', () => {
    checkForUrlChange();
    debugLog("popstate event detected");
});

setInterval(() => {
    if (!isEnabled) {
        return;
    }

    checkForUrlChange();

    const videoElement = document.querySelector('video');
    if (videoElement && !videoElement.paused) {
        playbackTimer += 1000;
        if (playbackTimer >= delay) {
            debugLog("Triggering likeFunction after delay:", delay);
            likeFunction();
            playbackTimer = 0;
        }
    }
}, 1000);