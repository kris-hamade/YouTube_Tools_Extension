const debugLog = (...messages) => {
  console.log(...messages);
};

document.addEventListener("DOMContentLoaded", function () {
  debugLog("DOM loaded");
  const delayElement = document.getElementById("delay");
  const toggleEnable = document.getElementById("toggleEnable");
  const toggleSubscribedOnly = document.getElementById("toggleSubscribedOnly");
  const toggleWaitForAds = document.getElementById("toggleWaitForAds");

  // Fetch and display the version number from the manifest
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version; // Here we fetch the version
  const versionElement = document.getElementById("version");
  versionElement.textContent = "Version: " + version; // Display the version

  // Function to update and save delay setting
  function updateDelay(value) {
    const delayValue = parseInt(value, 10) * 1000; // Convert to milliseconds
    chrome.storage.sync.set({ delay: delayValue }, function () {
      if (chrome.runtime.lastError) {
        debugLog("Error saving delay:", chrome.runtime.lastError);
      } else {
        chrome.runtime.sendMessage({ type: "updateDelay", value: delayValue });
        debugLog("Delay updated and saved:", delayValue);
      }
    });
  }

  // Load initial settings from storage
  chrome.storage.sync.get(["delay", "enabled", "subscribedOnly", "waitForAds"], function (data) {
    if (data.delay) {
      delayElement.value = data.delay / 1000; // Convert to seconds for display
    }
    toggleEnable.checked = data.hasOwnProperty("enabled") ? data.enabled : true;
    toggleSubscribedOnly.checked = data.hasOwnProperty('subscribedOnly') ? data.subscribedOnly : false;
    toggleWaitForAds.checked = data.hasOwnProperty("waitForAds") ? data.waitForAds : true;

    debugLog("Initial settings loaded:", data);
  });

  // Listen for changes to the delay input
  delayElement.addEventListener("input", function () {
    updateDelay(this.value);
  });

  // Listen for changes to the subscribed only toggle
  toggleSubscribedOnly.addEventListener("change", function (e) {
    const newSubscribedOnlyState = e.target.checked;
    chrome.storage.sync.set({ subscribedOnly: newSubscribedOnlyState }, () => {
      if (chrome.runtime.lastError) {
        debugLog("Error saving subscribedOnly state:", chrome.runtime.lastError);
      } else {
        debugLog("SubscribedOnly state updated and saved:", newSubscribedOnlyState);
      }
    });
  });

  // Listen for changes to the wait for ads toggle
  toggleWaitForAds.addEventListener("change", function (e) {
    const newWaitForAdsState = e.target.checked;
    chrome.storage.sync.set({ waitForAds: newWaitForAdsState }, () => {
      if (chrome.runtime.lastError) {
        debugLog("Error saving waitForAds state:", chrome.runtime.lastError);
      } else {
        debugLog("WaitForAds state updated and saved:", newWaitForAdsState);
      }
    });
  });

  // Listen for changes to the enable toggle
  toggleEnable.addEventListener("change", function () {
    const isEnabled = this.checked;
    chrome.storage.sync.set({ enabled: isEnabled }, function () {
      if (chrome.runtime.lastError) {
        debugLog("Error saving enabled state:", chrome.runtime.lastError);
      } else {
        chrome.runtime.sendMessage({ type: "updateEnabled", value: isEnabled });
        debugLog("Enabled state updated and saved:", isEnabled);
      }
    });
  });
});
