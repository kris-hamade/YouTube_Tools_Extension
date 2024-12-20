let globalConfig = {};
let isDebugMode = process.env.DEBUG_MODE === 'true'; // Debug mode state

// Custom debug log function
const debugLog = (...messages) => {
    if (isDebugMode) {
        console.log(...messages);
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog("Message received in background:", request);
    if (request.action === 'contentScriptReady' && sender.tab) {
        debugLog('Content script is ready in tab:', sender.tab.id);
        // Immediately send the current configuration to the content script
        chrome.tabs.sendMessage(sender.tab.id, { type: 'updateConfig', config: globalConfig });
    }
    // Handle configuration fetch request
    else if (request.action === "getConfig") {
        sendResponse({ config: globalConfig });
    }
    // Forwarding updateDelay and updateEnabled messages to content script
    else if (request.type === 'updateDelay' || request.type === 'updateEnabled') {
        forwardMessageToContentScript(request);
    }
});

function forwardMessageToContentScript(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0 && tabs[0].status === 'complete') {
            chrome.tabs.sendMessage(tabs[0].id, message, response => {
                if (chrome.runtime.lastError) {
                    console.error(`Error sending message to tab ${tabs[0].id}: ${chrome.runtime.lastError.message}`);
                } else {
                    debugLog("Response from content script:", response);
                }
            });
        }
    });
}

async function fetchLocalConfig() {
    const url = chrome.runtime.getURL('../config.json');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch local config');
    const config = await response.json();
    debugLog('Local config fetched successfully:', config);
    return config;
}

async function fetchStoredConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['config'], (result) => {
            if (result.config) {
                debugLog('Stored config found:', result.config);
                resolve(result.config);
            } else {
                debugLog('No stored config found, defaulting to initial local config.');
                resolve({});
            }
        });
    });
}