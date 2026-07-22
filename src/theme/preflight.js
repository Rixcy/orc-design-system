(function () {
  "use strict";

  try {
    var script = document.currentScript;
    var configuredKey = script && script.getAttribute("data-storage-key");
    var storageKey = configuredKey || "orcTheme";
    var savedMode = localStorage.getItem(storageKey);

    if (savedMode === "light" || savedMode === "dark") {
      document.documentElement.setAttribute("data-theme", savedMode);
    }
  } catch (_) {
    // Theme selection must never block document parsing.
  }
})();
