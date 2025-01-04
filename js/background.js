// background.js
let globalConfig = {};
let isDebugMode = false; // set at runtime if needed

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle config fetch
    if (request.action === "getConfig") {
        sendResponse({ config: globalConfig });
        return true; // Keep message channel open if needed
    }
});

// Send updated config to all YouTube tabs
function sendConfigToAllContentScripts() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.url && tab.url.includes("youtube.com")) {
                chrome.tabs.sendMessage(
                    tab.id,
                    { type: 'updateConfig', config: globalConfig },
                    () => { /* handle any errors here */ }
                );
            }
        });
    });
}

// Fetch local config (from config.json in your extension)
async function fetchLocalConfig() {
    const url = chrome.runtime.getURL('config.json');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch local config');
    return await response.json();
}

// On extension startup
(async function init() {
    try {
        const localConfig = await fetchLocalConfig();
        globalConfig = localConfig.config || {};
        await chrome.storage.local.set({ config: globalConfig });
        sendConfigToAllContentScripts();
    } catch (err) {
        console.error('Error loading local config:', err);
    }
})();
