let delay = 10000; // Default delay of 10 seconds
let isEnabled = true; // Default state

// Establish a long-lived connection with the background script
const port = chrome.runtime.connect();

// Send error message to background script
const sendErrorMessage = (error) => {
    port.postMessage({ type: 'error', error: error.toString() });
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

        if (!isEnabled) {
            return;
        }

        // Check if there are ads on the page
        const adBadge = document.querySelector('.ytp-ad-simple-ad-badge');

        if (!adBadge) {
            // No ads are playing, proceed with your logic
            const likeButtonXpath = '//*[@id="segmented-like-button"]/ytd-toggle-button-renderer/yt-button-shape/button';
            const likeButtonResult = document.evaluate(likeButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const likeButton = likeButtonResult.singleNodeValue;

            const dislikeButtonXpath = '//*[@id="segmented-dislike-button"]/ytd-toggle-button-renderer/yt-button-shape/button';
            const dislikeButtonResult = document.evaluate(dislikeButtonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const dislikeButton = dislikeButtonResult.singleNodeValue;

            // Check if the dislike button has not been clicked
            if (dislikeButton && dislikeButton.getAttribute('aria-pressed') === 'false') {
                // Check if the like button has not been clicked
                if (likeButton && likeButton.getAttribute('aria-pressed') === 'false') {
                    likeButton.click();
                }
            }
        }
    } catch (error) {
        sendErrorMessage(error);
    }
};

// Call likeFunction based on the delay
setInterval(() => {
    likeFunction();
}, delay);
