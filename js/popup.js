let isDebugMode = process.env.DEBUG_MODE === 'true'; // Debug mode state

const debugLog = (...messages) => {
    if (isDebugMode) {
        console.log(...messages);
    }
};

document.addEventListener('DOMContentLoaded', function () {
    debugLog("DOM loaded");
    const delayElement = document.getElementById('delay');
    const toggleEnable = document.getElementById('toggleEnable');

    // Fetch and display the version number from the manifest
    const manifest = chrome.runtime.getManifest();
    const version = manifest.version; // Here we fetch the version
    const versionElement = document.getElementById('version');
    versionElement.textContent = 'Version: ' + version; // Display the version

    // Function to update and save delay setting
    function updateDelay(value) {
        const delayValue = parseInt(value, 10) * 1000; // Convert to milliseconds
        chrome.storage.sync.set({ 'delay': delayValue }, function () {
            if (chrome.runtime.lastError) {
                debugLog("Error saving delay:", chrome.runtime.lastError);
            } else {
                chrome.runtime.sendMessage({ type: 'updateDelay', value: delayValue });
                debugLog('Delay updated and saved:', delayValue);
            }
        });
    }

    // Load initial settings from storage
    chrome.storage.sync.get(['delay', 'enabled'], function (data) {
        if (data.delay) {
            delayElement.value = data.delay / 1000; // Convert to seconds for display
        }
        toggleEnable.checked = data.hasOwnProperty('enabled') ? data.enabled : true;
    });

    // Listen for changes to the delay input
    delayElement.addEventListener('input', function () {
        updateDelay(this.value);
    });

    // Listen for changes to the enable toggle
    toggleEnable.addEventListener('change', function () {
        const isEnabled = this.checked;
        chrome.storage.sync.set({ 'enabled': isEnabled }, function () {
            if (chrome.runtime.lastError) {
                debugLog("Error saving enabled state:", chrome.runtime.lastError);
            } else {
                chrome.runtime.sendMessage({ type: 'updateEnabled', value: isEnabled });
                debugLog('Enabled state updated and saved:', isEnabled);
            }
        });
    });
});
