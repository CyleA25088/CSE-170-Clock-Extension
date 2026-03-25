// content/inactivity-monitor.js
// Manages inactivity detection and triggers alerts after 10 minutes of no activity

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

class InactivityMonitor {
  constructor(onInactivityCallback, onResetCallback) {
    this.onInactivityCallback = onInactivityCallback;
    this.onResetCallback = onResetCallback;
    this.inactivityTimer = null;
  }

  start() {
    this.reset();
  }

  reset() {
    this.clearTimer();
    this.inactivityTimer = setTimeout(() => {
      this.onInactivityCallback();
    }, INACTIVITY_TIMEOUT_MS);

    if (this.onResetCallback) {
      this.onResetCallback();
    }
  }

  clearTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  stop() {
    this.clearTimer();
  }
}
