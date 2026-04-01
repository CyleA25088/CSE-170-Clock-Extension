// --- Notification Display System ---

// Track recent notifications to avoid excessive repetition
const notificationHistory = {};
const DEDUP_TIMEOUT = 5000; // Don't show same notification type within 5 seconds

/**
 * Display an on-screen notification with a message and auto-dismiss
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Type of notification: 'success', 'warning', 'error', 'info'
 * @param {number} duration - Duration to show in milliseconds (0 = no auto-dismiss)
 * @param {string} dedupKey - Key for deduplication to avoid spam
 */
function createNotification(title, message, type = 'info', duration = 3000, dedupKey = null) {
  console.log(`[createNotification] Skipping DOM notification (using chrome.notifications): "${title}"`);
  // Disabled - now using chrome.notifications from background script
  return;
}

// --- Pomodoro Timer Listeners ---

/**
 * Listen for Pomodoro timer phase changes (work/break completion)
 */
function initializeTimerListeners() {
  console.log('[Timer Listener] Starting timer listener setup');
  let lastPhase = null;
  let lastNotificationPhase = null; // Track last phase we notified about
  let checkCount = 0;

  const timerCheckInterval = setInterval(() => {
    checkCount++;
    chrome.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
      if (!state) {
        console.log('[Timer Listener] No state returned');
        return;
      }

      // Log state every 30 checks (30 seconds) to avoid spam
      if (checkCount % 30 === 0) {
        console.log(`[Timer Listener] Check #${checkCount}: Phase=${state.phase}, TimeRemaining=${state.timeRemaining}, LastPhase=${lastPhase}`);
      }

      // Detect phase change - only if phase changed AND we haven't already notified for this phase
      if (lastPhase && lastPhase !== state.phase && lastNotificationPhase !== state.phase) {
        console.log('[Timer Listener] PHASE CHANGE DETECTED!', lastPhase, '->', state.phase);
        
        // Timer just completed and switched phases
        if (state.phase === 'BREAK') {
          console.log('[Timer Listener] Creating BREAK notification');
          createNotification(
            'Great work!',
            'Break time. Recharge and come back refreshed.',
            'success',
            4000,
            'break_phase'
          );
          lastNotificationPhase = 'BREAK';
        } else if (state.phase === 'WORK') {
          console.log('[Timer Listener] Creating WORK notification');
          createNotification(
            'Break over.',
            'Ready to focus? You can do this.',
            'warning',
            4000,
            'work_phase'
          );
          lastNotificationPhase = 'WORK';
        }
      }

      lastPhase = state.phase;
    });
  }, 1000);
}

// --- Site Monitoring (Blacklist/Whitelist) ---

/**
 * Check if a URL is on the blacklist
 * @param {string} url - URL to check
 * @param {Array<string>} blacklist - Array of blocked URLs/domains
 * @returns {boolean} True if URL is blacklisted
 */
function isBlacklisted(url, blacklist) {
  try {
    const domain = new URL(url).hostname;
    return blacklist.some(item => domain.includes(item) || url.includes(item));
  } catch {
    return false;
  }
}

/**
 * Check if a URL is on the whitelist
 * @param {string} url - URL to check
 * @param {Array<string>} whitelist - Array of allowed URLs/domains
 * @returns {boolean} True if URL is whitelisted
 */
function isWhitelisted(url, whitelist) {
  if (!whitelist || whitelist.length === 0) return true; // If no whitelist, allow all
  try {
    const domain = new URL(url).hostname;
    return whitelist.some(item => domain.includes(item) || url.includes(item));
  } catch {
    return false;
  }
}

/**
 * Initialize site monitoring for blacklist/whitelist violations
 */
function initializeSiteMonitoring() {
  console.log('[Site Monitoring] Disabled - now handled by content script');
  // Site monitoring moved to content script for chrome.notifications
}

// --- Mouse Inactivity Tracking ---

/**
 * Initialize mouse inactivity detection (3 minutes)
 */
function initializeInactivityTracking() {
  console.log('[Inactivity Tracker] Initializing (popup)');

  const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds
  let inactivityTimer = null;
  let lastInactivityNotificationTime = 0;

  function resetInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(() => {
      const now = Date.now();
      console.log('[Inactivity Tracker] Inactivity timeout triggered (popup)');
      if (now - lastInactivityNotificationTime > 10 * 60 * 1000) {
        lastInactivityNotificationTime = now;
        console.log('[Inactivity Tracker] Sending inactivity notification to background (popup)');
        chrome.runtime.sendMessage({ action: 'SHOW_INACTIVITY_NOTIFICATION' });
      }
    }, INACTIVITY_TIMEOUT);
  }

  document.addEventListener('mousemove', resetInactivityTimer);
  document.addEventListener('keypress', resetInactivityTimer);
  document.addEventListener('click', resetInactivityTimer);
  document.addEventListener('scroll', resetInactivityTimer);
  document.addEventListener('touchstart', resetInactivityTimer);

  console.log('[Inactivity Tracker] Event listeners registered (popup)');
  resetInactivityTimer();
}

// --- Initialize All Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  console.log('[notifications.js] DOMContentLoaded fired');
  initializeTimerListeners();
  initializeSiteMonitoring();
  initializeInactivityTracking();
  console.log('[notifications.js] All listeners initialized');
});

// Fallback: also initialize if already loaded
if (document.readyState === 'loading') {
  console.log('[notifications.js] Document still loading, waiting for DOMContentLoaded');
} else {
  console.log('[notifications.js] Document already loaded, initializing now');
  initializeTimerListeners();
  initializeSiteMonitoring();
  initializeInactivityTracking();
}
