(function () {
  "use strict";

  // Keyword settings for filtering
  const keywordSettings = {
    trump: true, // Default ON
    elon: true, // Default ON
  };

  const removableSelectors = "article, section, .news-item, .card, .post";
  let removalCount = 0;

  function loadFilterSettings(callback) {
    chrome.storage.local.get(["filterTrump", "filterElon"], function (result) {
      keywordSettings.trump = result.filterTrump !== false; // Default ON
      keywordSettings.elon = result.filterElon !== false; // Default ON
      console.log("Loaded filter settings:", keywordSettings);
      if (callback) callback();
    });
  }

  function getRemovableContainer(element) {
    if (!element) return null;
    if (element.nodeType === Node.TEXT_NODE) element = element.parentElement;
    let container = element.closest(removableSelectors);
    if (container) return container;

    let current = element;
    while (current && current.parentElement) {
      if (current.parentElement.matches("body")) break;
      if (current.matches(removableSelectors)) return current;
      current = current.parentElement;
    }
    return null;
  }

  function scanAndRemove(node) {
    if (!keywordSettings.trump && !keywordSettings.elon) return;

    const containersToRemove = new Set();

    function checkTextNode(textNode) {
      if (!textNode.nodeValue) return;
      const lowerText = textNode.nodeValue.toLowerCase();
      for (let keyword in keywordSettings) {
        if (keywordSettings[keyword] && lowerText.includes(keyword)) {
          let container = getRemovableContainer(textNode);
          if (container) containersToRemove.add(container);
          break;
        }
      }
    }

    function checkElementAttributes(element) {
      if (!element.attributes) return;
      for (let attr of element.attributes) {
        const value = attr.value.toLowerCase();
        for (let keyword in keywordSettings) {
          if (keywordSettings[keyword] && value.includes(keyword)) {
            let container = getRemovableContainer(element);
            if (container) containersToRemove.add(container);
            return;
          }
        }
      }
    }

    function traverse(root) {
      if (!keywordSettings.trump && !keywordSettings.elon) return;
      if (root.nodeType === Node.TEXT_NODE) checkTextNode(root);
      else if (root.nodeType === Node.ELEMENT_NODE) {
        checkElementAttributes(root);
        for (let child of root.childNodes) traverse(child);
      }
    }

    traverse(node);

    containersToRemove.forEach((container) => {
      let hasImage = container.querySelector("img");
      let hasLink = container.querySelector("a");
      if (hasImage || hasLink) {
        console.log("Removing:", container);
        container.remove();
        removalCount++;
        chrome.runtime.sendMessage({
          action: "updateBadge",
          count: removalCount,
        });
      }
    });
  }

  // **Initial Scan After Loading Settings**
  loadFilterSettings(() => {
    scanAndRemove(document.body);
  });

  const observer = new MutationObserver((mutations) => {
    if (!keywordSettings.trump && !keywordSettings.elon) return;
    for (let mutation of mutations) {
      for (let addedNode of mutation.addedNodes) {
        scanAndRemove(addedNode);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // **Listen for Messages from Popup**
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggleKeyword") {
      console.log("Received message to toggle keyword:", message);
      keywordSettings[message.keyword] = message.enabled;
      chrome.storage.local.set(
        { [`filter${capitalize(message.keyword)}`]: message.enabled },
        () => {
          console.log(
            `Updated storage for ${message.keyword} filter to`,
            message.enabled
          );
        }
      );

      if (!keywordSettings.trump && !keywordSettings.elon) {
        console.log("🔴 All filters disabled");
      } else {
        console.log(
          `🟢 ${message.keyword} filter is now ${
            message.enabled ? "ON" : "OFF"
          }`
        );
      }
    }
  });

  // **Helper: Capitalize First Letter**
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
})();
