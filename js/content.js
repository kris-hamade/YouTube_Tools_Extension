let delay = 10000; // Default delay of 10 seconds
let isEnabled = true; // Default state

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
    console.log("Message received", message);
    if (message.type === 'updateDelay') {
        delay = message.value;
        console.log("Updated delay:", delay);
    }
    if (message.type === 'updateEnabled') {
        isEnabled = message.value;
        console.log("Updated isEnabled:", isEnabled);
    }
});

const likeFunction = () => {
    // Reload settings each time this function runs
    reloadSettings();

    if (!isEnabled) {
        return;
    }

    const buttonXpath = '//*[@id="segmented-like-button"]/ytd-toggle-button-renderer/yt-button-shape/button';
    const buttonResult = document.evaluate(buttonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const likeButton = buttonResult.singleNodeValue;

    if (likeButton && likeButton.getAttribute('aria-pressed') === 'false') {
        likeButton.click();
    }
};

// Call likeFunction based on the delay
setInterval(() => {
    likeFunction();
}, delay);
