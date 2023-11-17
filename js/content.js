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
    try {
        console.log("Message received", message);
        if (message.type === 'updateDelay') {
            delay = message.value;
            console.log("Updated delay:", delay);
        }
        if (message.type === 'updateEnabled') {
            isEnabled = message.value;
            console.log("Updated isEnabled:", isEnabled);
        }
    } catch (error) {
        sendErrorMessage(error);
    }
});

const likeFunction = () => {
    try {
        // Reload settings each time this function runs
        reloadSettings();

        console.log("likeFunction triggered. isEnabled:", isEnabled);

        if (!isEnabled) {
            console.log("Extension is disabled. Exiting function.");
            return;
        }

        // Check if there are ads on the page
        const adBadge = document.querySelector('.ytp-ad-simple-ad-badge');
        console.log("Ad badge found:", adBadge !== null);

        if (!adBadge) {
            // No ads are playing, proceed with logic
            const likeButtonXpath = '//*[@id="segmented-like-button"]/ytd-toggle-button-renderer/yt-button-shape/button';
            const likeButtonResult = document.evaluate(likeButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const likeButton = likeButtonResult.singleNodeValue;

            const dislikeButtonXpath = '//*[@id="segmented-dislike-button"]/ytd-toggle-button-renderer/yt-button-shape/button';
            const dislikeButtonResult = document.evaluate(dislikeButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const dislikeButton = dislikeButtonResult.singleNodeValue;

            if (dislikeButton && dislikeButton.getAttribute('aria-pressed') === 'false') {
                if (likeButton && likeButton.getAttribute('aria-pressed') === 'false') {
                    console.log("Liking the video now.");
                    likeButton.click();
                } else {
                    console.log("Like button is already pressed or not found.");
                }
            } else {
                console.log("Dislike button is pressed or not found.");
            }
        } else {
            console.log("Ads are playing, skipping like function.");
        }
    } catch (error) {
        console.error("Error in likeFunction:", error);
        sendErrorMessage(error);
    }
};

const checkForUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        playbackTimer = 0; // Reset the timer
        console.log("URL changed, potentially a new video: ", currentUrl);
    }
};

window.addEventListener('popstate', () => {
    checkForUrlChange();
});

setInterval(() => {
    if (!isEnabled) {
        console.log("Extension is disabled. Skipping check.");
        return;
    }

    checkForUrlChange();

    const videoElement = document.querySelector('video');
    if (videoElement && !videoElement.paused) {
        playbackTimer += 1000; // Increment timer every second
        if (playbackTimer >= delay) {
            likeFunction();
            playbackTimer = 0;
        }
    }
}, 1000); // Check every second
