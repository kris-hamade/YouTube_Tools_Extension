const debugLog = (...messages) => {
  console.log(...messages);
};

document.addEventListener("DOMContentLoaded", function () {
  debugLog("DOM loaded");
  const delayElement = document.getElementById("delay");
  const delayPercentageElement = document.getElementById("delayPercentage");
  const delayModeRadios = document.querySelectorAll('input[name="delayMode"]');
  const secondsDelayField = document.getElementById("secondsDelayField");
  const percentageDelayField = document.getElementById("percentageDelayField");
  const toggleEnable = document.getElementById("toggleEnable");
  const toggleSubscribedOnly = document.getElementById("toggleSubscribedOnly");
  const toggleWaitForAds = document.getElementById("toggleWaitForAds");

  // Fetch and display the version number from the manifest
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version; // Here we fetch the version
  const versionElement = document.getElementById("version");
  versionElement.textContent = "Version: " + version; // Display the version

  function getSelectedDelayMode() {
    const selectedRadio = document.querySelector('input[name="delayMode"]:checked');
    return selectedRadio ? selectedRadio.value : "seconds";
  }

  function getDelayValue(value) {
    return Math.max(1, parseInt(value, 10) || 10) * 1000;
  }

  function getDelayPercentageValue(value) {
    return Math.max(1, Math.min(100, parseInt(value, 10) || 50));
  }

  function sendSettingsUpdate(overrides = {}) {
    chrome.runtime.sendMessage({
      type: "updateSettings",
      settings: {
        enabled: toggleEnable.checked,
        subscribedOnly: toggleSubscribedOnly.checked,
        waitForAds: toggleWaitForAds.checked,
        delay: getDelayValue(delayElement.value),
        delayMode: getSelectedDelayMode(),
        delayPercentage: getDelayPercentageValue(delayPercentageElement.value),
        ...overrides,
      },
    });
  }

  // Function to update and save delay setting
  function updateDelay(value) {
    const delayValue = getDelayValue(value); // Convert to milliseconds
    chrome.storage.sync.set({ delay: delayValue }, function () {
      if (chrome.runtime.lastError) {
        debugLog("Error saving delay:", chrome.runtime.lastError);
      } else {
        chrome.runtime.sendMessage({ type: "updateDelay", value: delayValue });
        sendSettingsUpdate({ delay: delayValue });
        debugLog("Delay updated and saved:", delayValue);
      }
    });
  }

  function updateDelayMode(value) {
    chrome.storage.sync.set({ delayMode: value }, function () {
      if (chrome.runtime.lastError) {
        debugLog("Error saving delay mode:", chrome.runtime.lastError);
      } else {
        updateDelayModeUi(value);
        sendSettingsUpdate({ delayMode: value });
        debugLog("Delay mode updated and saved:", value);
      }
    });
  }

  function updateDelayModeUi(value) {
    secondsDelayField.style.display = value === "percentage" ? "none" : "block";
    percentageDelayField.style.display = value === "percentage" ? "block" : "none";
  }

  function updateDelayPercentage(value) {
    const percentageValue = getDelayPercentageValue(value);
    chrome.storage.sync.set({ delayPercentage: percentageValue }, function () {
      if (chrome.runtime.lastError) {
        debugLog("Error saving delay percentage:", chrome.runtime.lastError);
      } else {
        delayPercentageElement.value = percentageValue;
        sendSettingsUpdate({ delayPercentage: percentageValue });
        debugLog("Delay percentage updated and saved:", percentageValue);
      }
    });
  }

  // Load initial settings from storage
  chrome.storage.sync.get(["delay", "delayMode", "delayPercentage", "enabled", "subscribedOnly", "waitForAds"], function (data) {
    if (data.delay) {
      delayElement.value = data.delay / 1000; // Convert to seconds for display
    }
    const delayMode = data.hasOwnProperty("delayMode") ? data.delayMode : "seconds";
    delayPercentageElement.value = data.hasOwnProperty("delayPercentage") ? data.delayPercentage : 50;
    delayModeRadios.forEach((radio) => {
      radio.checked = radio.value === delayMode;
    });
    updateDelayModeUi(delayMode);
    toggleEnable.checked = data.hasOwnProperty("enabled") ? data.enabled : true;
    toggleSubscribedOnly.checked = data.hasOwnProperty('subscribedOnly') ? data.subscribedOnly : false;
    toggleWaitForAds.checked = data.hasOwnProperty("waitForAds") ? data.waitForAds : true;

    debugLog("Initial settings loaded:", data);
  });

  // Listen for changes to the delay input
  delayElement.addEventListener("input", function () {
    updateDelay(this.value);
  });

  delayPercentageElement.addEventListener("input", function () {
    updateDelayPercentage(this.value);
  });

  delayModeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.checked) {
        updateDelayMode(this.value);
      }
    });
  });

  // Listen for changes to the subscribed only toggle
  toggleSubscribedOnly.addEventListener("change", function (e) {
    const newSubscribedOnlyState = e.target.checked;
    chrome.storage.sync.set({ subscribedOnly: newSubscribedOnlyState }, () => {
      if (chrome.runtime.lastError) {
        debugLog("Error saving subscribedOnly state:", chrome.runtime.lastError);
      } else {
        sendSettingsUpdate({ subscribedOnly: newSubscribedOnlyState });
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
        sendSettingsUpdate({ waitForAds: newWaitForAdsState });
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
        sendSettingsUpdate({ enabled: isEnabled });
        debugLog("Enabled state updated and saved:", isEnabled);
      }
    });
  });
});
