document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM loaded");
    const delayElement = document.getElementById('delay');
    const setDelayButton = document.getElementById('setDelay');  // Make sure this ID exists in your HTML
    const toggleEnable = document.getElementById('toggleEnable');
    const toggleYoutubeShorts = document.getElementById('toggleYoutubeShorts');

    // Get the version number from the manifest
    const manifestData = chrome.runtime.getManifest();
    const version = manifestData.version;

    // Display the version number in the popup
    const versionElement = document.getElementById('version');
    versionElement.textContent = 'Version: ' + version;

    chrome.storage.sync.get(['delay', 'enabled', 'likeShorts'], function (data) {
        if (chrome.runtime.lastError) {
            console.log("Runtime error: ", chrome.runtime.lastError);
        } else {
            console.log('Data retrieved from storage:', data);
            if (data.delay) {
                delayElement.value = data.delay / 1000;
            }
            if (typeof data.enabled !== 'undefined') {
                toggleEnable.checked = data.enabled;
            }
            // Set the toggle state for liking YouTube Shorts
            if (typeof data.likeShorts !== 'undefined') {
                toggleYoutubeShorts.checked = data.likeShorts;
            }
        }
    });

    setDelayButton.addEventListener('click', function () {
        console.log("Save button clicked");
        const delayValue = parseInt(delayElement.value, 10) * 1000;
        chrome.storage.sync.set({ 'delay': delayValue }, function () {
            if (chrome.runtime.lastError) {
                console.log("Runtime error: ", chrome.runtime.lastError);
            } else {
                console.log('Delay value saved:', delayValue);
            }
        });
        chrome.runtime.sendMessage({ type: 'updateDelay', value: delayValue });
    });

    toggleEnable.addEventListener('change', function () {
        console.log("Checkbox clicked");
        const isEnabled = toggleEnable.checked;
        chrome.storage.sync.set({ 'enabled': isEnabled }, function () {
            if (chrome.runtime.lastError) {
                console.log("Runtime error: ", chrome.runtime.lastError);
            } else {
                console.log('Enabled state saved:', isEnabled);
            }
        });
        chrome.runtime.sendMessage({ type: 'updateEnabled', value: isEnabled });
    });
});

// Event listener to save the YouTube Shorts toggle state
toggleYoutubeShorts.addEventListener('change', function () {
    console.log("YouTube Shorts toggle clicked");
    const isShortsEnabled = toggleYoutubeShorts.checked;
    chrome.storage.sync.set({ 'likeShorts': isShortsEnabled }, function () {
        if (chrome.runtime.lastError) {
            console.log("Runtime error: ", chrome.runtime.lastError);
        } else {
            console.log('YouTube Shorts enabled state saved:', isShortsEnabled);
        }
    });
    chrome.runtime.sendMessage({ type: 'updateLikeShorts', value: isShortsEnabled });
});
