// ══════════════════════════════════════════════
// ProTutor — Form Event Tracker
// ══════════════════════════════════════════════
//
// Tracks the funnel: page views, page completions, save attempts,
// errors, and abandonment. Sends events to the CRM events endpoint.
//
// Best-effort only — event failures NEVER block the form flow.
// Uses sendBeacon on tab close so abandonment events survive
// even if the user just closes the browser.
// ══════════════════════════════════════════════

(function () {
  var TRACKER_URL = 'https://leads.protutor.co.in/api/public/form-submit';

  // ── Session ID (one per page load) ─────────────────────────────────
  var sessionId;
  try {
    sessionId = sessionStorage.getItem('protutor_session_id');
    if (!sessionId) {
      sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 8);
      sessionStorage.setItem('protutor_session_id', sessionId);
    }
  } catch (e) {
    sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 8);
  }
  window._sessionId = sessionId;

  // ── Idle timer (5 minutes of no activity = abandonment) ─────────────
  var IDLE_MS = 5 * 60 * 1000;
  var idleTimer = null;
  var abandonedFired = false;

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (!abandonedFired) {
        abandonedFired = true;
        logEvent('form_abandoned', { reason: 'idle_5min', page: window._currentPage || 1 });
      }
    }, IDLE_MS);
  }
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(function (e) {
    document.addEventListener(e, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();

  // ── Tab close → fire abandonment with sendBeacon ────────────────────
  // sendBeacon is special: it guarantees delivery even as the tab closes.
  window.addEventListener('beforeunload', function () {
    if (abandonedFired) return;
    // Only fire if user didn't complete (no save_succeeded yet)
    if (window._submissionComplete) return;
    var payload = JSON.stringify({
      action:      'log_event',
      session_id:  sessionId,
      event_type:  'form_abandoned',
      request_id:  window._requestId || null,
      page_number: window._currentPage || 1,
      details:     { reason: 'tab_closed' },
    });
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(TRACKER_URL, blob);
      }
    } catch (e) {}
  });

  // ── Core sender — best effort, never throws ────────────────────────
  window.logEvent = function (eventType, details) {
    try {
      var payload = {
        action:      'log_event',
        session_id:  sessionId,
        event_type:  eventType,
        request_id:  window._requestId || null,
        page_number: window._currentPage || null,
        details:     details || null,
      };
      fetch(TRACKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true, // survives page navigation
      }).catch(function () { /* silent */ });
    } catch (e) { /* silent */ }
  };

  // ── Fire form_opened immediately ────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      logEvent('form_opened', { user_agent: navigator.userAgent });
    });
  } else {
    logEvent('form_opened', { user_agent: navigator.userAgent });
  }
})();
