let globalConfig = {};
let isDebugMode = false; // Debug mode state

// Custom debug log function
const debugLog = (...messages) => {
    if (isDebugMode) {
        console.log(...messages);
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getConfig") {
        // Assuming fetchAndUpdateConfig successfully updates globalConfig
        sendResponse({ config: globalConfig });
        return true; // Indicate that you wish to send a response asynchronously (important)
    }
});

// Fetch and update configuration considering chrome.storage.local
async function fetchAndUpdateConfig() {
    const remoteConfigUrl = 'https://gitlab.com/krishamade/youtubevideoliker/raw/main/config.json';
    let storedConfig = await fetchStoredConfig(); // Fetch config from chrome.storage.local

    try {
        const response = await fetch(remoteConfigUrl);
        if (!response.ok) throw new Error('Failed to fetch remote config');
        const fetchedConfig = await response.json();

        if (fetchedConfig.version > storedConfig.version) {
            debugLog('Remote config is newer, updating stored config');
            storedConfig = fetchedConfig.config; // Update storedConfig with the newer remote config
            chrome.storage.local.set({ config: storedConfig }); // Update chrome.storage.local with the new config
        } else {
            debugLog('Stored config is up-to-date or newer than remote');
        }
    } catch (error) {
        console.error('Fetching remote config failed, using stored fallback:', error);
    }

    // Ensure globalConfig is always updated with the latest valid config
    globalConfig = storedConfig;
    debugLog('Current config:', globalConfig);
}

// Fetch configuration from chrome.storage.local
async function fetchStoredConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get({ config: {} }, (result) => {
            debugLog('Stored config:', result.config);
            resolve(result.config);
        });
    });
}

// Initial setup: Fetch and update configuration on startup
fetchAndUpdateConfig();
// Set an interval to periodically check for updates
setInterval(fetchAndUpdateConfig, 60000); // For example, every hour
