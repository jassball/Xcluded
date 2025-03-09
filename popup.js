document.addEventListener("DOMContentLoaded", function () {
  const trumpButton = document.getElementById("toggleTrump");
  const elonButton = document.getElementById("toggleElon");

  function initializeFilterStates() {
    chrome.storage.local.get(["filterTrump", "filterElon"], function (result) {
      if (result.filterTrump === undefined) {
        chrome.storage.local.set({ filterTrump: true });
      }
      if (result.filterElon === undefined) {
        chrome.storage.local.set({ filterElon: true });
      }
      updateButtonStates();
    });
  }

  function updateButtonStates() {
    chrome.storage.local.get(["filterTrump", "filterElon"], function (result) {
      console.log("Current filter states:", result);
      trumpButton.textContent = result.filterTrump
        ? "Disable Trump Filter"
        : "Enable Trump Filter";
      elonButton.textContent = result.filterElon
        ? "Disable Elon Filter"
        : "Enable Elon Filter";
    });
  }

  function toggleFilter(keyword) {
    const storageKey = `filter${keyword}`;
    chrome.storage.local.get([storageKey], function (result) {
      let newState = !result[storageKey]; // Toggle state
      console.log(`Toggling ${keyword} filter to`, newState);
      chrome.storage.local.set({ [storageKey]: newState }, function () {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (tabs.length > 0) {
              // Send message to content script to update filtering
              console.log(
                `Sending message to content script to toggle ${keyword} filter`
              );
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleKeyword",
                keyword: keyword.toLowerCase(),
                enabled: newState,
              });
              // Refresh page to reflect changes
              chrome.tabs.reload(tabs[0].id);
            }
          }
        );
        updateButtonStates(); // Update button text
      });
    });
  }

  trumpButton.addEventListener("click", function () {
    toggleFilter("Trump");
  });

  elonButton.addEventListener("click", function () {
    toggleFilter("Elon");
  });

  initializeFilterStates(); // Initialize filter states and set initial button text
});
