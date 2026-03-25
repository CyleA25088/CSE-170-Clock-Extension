// content/content.js
// FocusGuard — Main content script orchestrating activity monitoring, inactivity detection, and site enforcement.
//
// Dependencies: activity-tracker.js, inactivity-monitor.js, website-monitor.js, ui-manager.js
//
// Reads from chrome.storage.sync:
//   isSessionActive {boolean}  — whether a focus session is currently running
//   allowedSites    {string[]} — hostnames the user is allowed to visit (e.g. ["google.com", "docs.google.com"])

let isSessionActive = false;
let activityTracker = null;
let inactivityMonitor = null;
let websiteMonitor = null;
let uiManager = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

function initializeModules() {
  websiteMonitor = new WebsiteMonitor();
  uiManager = new UIManager();

  inactivityMonitor = new InactivityMonitor(
    () => onInactivityTriggered(),
    () => onInactivityReset()
  );

  activityTracker = new ActivityTracker(
    () => onUserActivity()
  );
}

// ---------------------------------------------------------------------------
// Inactivity and Activity Handlers
// ---------------------------------------------------------------------------

function onInactivityTriggered() {
  // Show inactivity warning banner after 10 minutes of no activity
  uiManager.showInactivityBanner(() => onDismissInactivityBanner());
}

function onDismissInactivityBanner() {
  uiManager.removeInactivityBanner();
  inactivityMonitor.reset();
}

function onInactivityReset() {
  uiManager.removeInactivityBanner();
}

function onUserActivity() {
  // User moved mouse, typed, scrolled, etc.
  // Reset the inactivity timer
  if (inactivityMonitor) {
    inactivityMonitor.reset();
  }
}

// ---------------------------------------------------------------------------
// Site Monitoring
// ---------------------------------------------------------------------------

function startMonitoring(allowedSites) {
  // Check if current site is allowed
  if (!websiteMonitor.isSiteAllowed(allowedSites)) {
    uiManager.showBlockedSiteWarning();
  }

  // Start tracking activity and inactivity
  activityTracker.start();
  inactivityMonitor.start();
}

function stopMonitoring() {
  if (activityTracker) activityTracker.stop();
  if (inactivityMonitor) inactivityMonitor.stop();
  if (uiManager) uiManager.hideAll();
}

// ---------------------------------------------------------------------------
// Storage Listeners
// ---------------------------------------------------------------------------

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;

  // Session toggled
  if (changes.isSessionActive !== undefined) {
    const wasActive = isSessionActive;
    isSessionActive = !!changes.isSessionActive.newValue;

    if (isSessionActive && !wasActive) {
      chrome.storage.sync.get(['allowedSites'], (data) => {
        startMonitoring(data.allowedSites || []);
      });
    } else if (!isSessionActive && wasActive) {
      stopMonitoring();
    }
  }

  // Allowed-sites list updated while a session is running
  if (changes.allowedSites !== undefined && isSessionActive) {
    const updatedList = changes.allowedSites.newValue || [];
    if (!websiteMonitor.isSiteAllowed(updatedList)) {
      uiManager.showBlockedSiteWarning();
    } else {
      uiManager.removeBlockedOverlay();
    }
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function initSession() {
  initializeModules();

  chrome.storage.sync.get(['isSessionActive', 'allowedSites'], (data) => {
    isSessionActive = !!data.isSessionActive;
    if (!isSessionActive) return;
    startMonitoring(data.allowedSites || []);
  });
}

// Start on page load
initSession();
