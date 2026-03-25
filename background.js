// background.js
// FocusGuard Background Service Worker
// Handles extension lifecycle, messaging, and storage synchronization

chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings on first install
  chrome.storage.sync.get(['allowedSites', 'isSessionActive'], (data) => {
    if (!data.allowedSites) {
      chrome.storage.sync.set({ allowedSites: [] });
    }
    if (data.isSessionActive === undefined) {
      chrome.storage.sync.set({ isSessionActive: false });
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SHOW_NOTIFICATION') {
    // Reserved for future use - notifications are currently shown as page banners
    sendResponse({ success: true });
  }
});
