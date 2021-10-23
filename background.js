let currentActiveTab;

chrome.tabs.onActivated.addListener((activeInfo) => {
  currentActiveTab = activeInfo;
});
