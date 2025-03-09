chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBadge") {
    chrome.action.setBadgeText({ text: message.count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#000000" }); // Set background color to black
    chrome.action.setBadgeTextColor({ color: "#FFFFFF" }); // Set text color to white
  }
});
