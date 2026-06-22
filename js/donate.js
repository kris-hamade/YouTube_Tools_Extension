document.addEventListener("DOMContentLoaded", () => {
  const manifest = chrome.runtime.getManifest();
  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason");
  const previousVersion = params.get("from");

  const versionBadge = document.getElementById("versionBadge");
  const updateNote = document.getElementById("updateNote");

  versionBadge.textContent = `Version ${manifest.version}`;

  if (reason === "install") {
    updateNote.textContent = "Thanks for installing YouTube Auto Liker.";
    return;
  }

  if (reason === "update" && previousVersion) {
    updateNote.textContent = `Updated from ${previousVersion} to ${manifest.version}.`;
    return;
  }

  updateNote.textContent = "Thanks for supporting YouTube Auto Liker.";
});
