let delay = 10000; // Default delay of 10 seconds
let isEnabled = true; // Default state
let playbackTimer = 0;
let lastUrl = window.location.href;

// Establish a long-lived connection with the background script
const port = chrome.runtime.connect();

// Send error message to background script
const sendErrorMessage = (error) => {
    if (port) {
        try {
            port.postMessage({ type: 'error', error: error.toString() });
        } catch (e) {
            console.error("Error sending message to background script:", e);
        }
    } else {
        console.error("Port not available:", error);
    }
};

// Function to reload settings
const reloadSettings = () => {
    chrome.storage.sync.get(['delay', 'enabled'], function (data) {
        if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            return;
        }

        if (data.delay) {
            delay = data.delay;
        }

        if (typeof data.enabled !== 'undefined') {
            isEnabled = data.enabled;
        }
    });
};

// Call reloadSettings to load initial settings
reloadSettings();

// Update settings when received from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateDelay') {
        delay = message.value;
    }
    if (message.type === 'updateEnabled') {
        isEnabled = message.value;
    }
});

const likeFunction = () => {
    try {
        reloadSettings();

        if (!isEnabled) {
            return;
        }

        const adBadge = document.querySelector('.ytp-ad-simple-ad-badge');
        if (!adBadge) {
            const likeButtonXpath = '//*[@id="segmented-like-button"]/ytd-toggle-button-renderer/yt-button-shape/button';
            const likeButtonResult = document.evaluate(likeButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const likeButton = likeButtonResult.singleNodeValue;

            const dislikeButtonXpath = '//*[@id="segmented-dislike-button"]/ytd-toggle-button-renderer/yt-button-shape/button';
            const dislikeButtonResult = document.evaluate(dislikeButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const dislikeButton = dislikeButtonResult.singleNodeValue;

            if (dislikeButton && dislikeButton.getAttribute('aria-pressed') === 'false') {
                if (likeButton && likeButton.getAttribute('aria-pressed') === 'false') {
                    likeButton.click();
                }
            }
        }
    } catch (error) {
        sendErrorMessage(error);
    }
};

const checkForUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        playbackTimer = 0;
    }
};

window.addEventListener('popstate', () => {
    checkForUrlChange();
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
            likeFunction();
            playbackTimer = 0;
        }
    }
}, 1000);