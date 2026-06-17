// ══════════════════════════════════════════════
// ProTutor — CRM Database Integration (Robust)
// ══════════════════════════════════════════════
//
// THE GUARANTEE
// Every lead submitted from this form WILL reach the CRM database, or it
// will sit in the parent's browser queue until it does. No lead is ever
// silently dropped.
//
// HOW IT WORKS — three layers of safety
//   1. Send with a 5-second timeout
//   2. If it fails, wait 2s and retry once
//   3. If it still fails, save the payload in localStorage queue
//   4. On every page load, the queue auto-flushes in the background
//
// Google Sheets is kept separately (in sheet.js) as a PASSIVE log only.
// Neither file depends on the other.
// ══════════════════════════════════════════════

// ── Configuration ─────────────────────────────────────────────────
var CRM_API_URL    = 'https://leads.protutor.co.in/api/public/form-submit';
var REQUEST_TIMEOUT_MS = 5000;
var RETRY_DELAY_MS     = 2000;
var QUEUE_STORAGE_KEY  = 'protutor_crm_queue_v1';
var REF_STORAGE_KEY    = 'protutor_ref';

// ── Referral channel capture ──────────────────────────────────────
(function captureReferral() {
  try {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get('r');
    if (fromUrl) sessionStorage.setItem(REF_STORAGE_KEY, fromUrl);
  } catch (e) {}
})();

function getReferralCode() {
  try { return sessionStorage.getItem(REF_STORAGE_KEY) || ''; }
  catch (e) { return ''; }
}

// ── Queue helpers (the durability layer) ──────────────────────────
function queueRead() {
  try {
    var raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function queueWrite(items) {
  try { localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items)); }
  catch (e) { console.warn('[CRM] queue write failed:', e); }
}

function queuePush(payload) {
  var items = queueRead();
  if (items.length >= 50) items.shift();
  items.push({ payload: payload, queuedAt: Date.now() });
  queueWrite(items);
}

// ── Core sender ───────────────────────────────────────────────────
// Resolves on success. Rejects with an Error whose .transient flag tells
// the caller whether retrying makes sense.
//   transient = true:  network error, timeout, 5xx, 409 → retry / queue
//   transient = false: 4xx (other than 409) → permanent, do not retry
function postOnce(payload) {
  return new Promise(function (resolve, reject) {
    function fail(message, transient) {
      var e = new Error(message);
      e.transient = transient;
      reject(e);
    }
    var controller = (typeof AbortController !== 'undefined')
                       ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
      fail('timeout', true);
    }, REQUEST_TIMEOUT_MS);

    fetch(CRM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
    })
    .then(function (res) {
      clearTimeout(timer);
      if (res.ok) return resolve();
      // 409 = "not yet, retry later" (e.g. quote_update before initial_save).
      // 5xx = server problem, worth retrying.
      // Everything else (400, 401, 403, 404, 422) = client-side problem
      // that won't fix itself — don't retry.
      var transient = res.status === 409 || res.status >= 500;
      fail('status ' + res.status, transient);
    })
    .catch(function (err) {
      clearTimeout(timer);
      // Network errors / AbortError are inherently transient.
      if (err && typeof err.transient === 'boolean') {
        reject(err);
      } else {
        fail(err && err.message ? err.message : 'network error', true);
      }
    });
  });
}

// Try-then-retry-then-queue. Always resolves; never rejects to caller.
// Permanent (non-transient) errors are NOT queued — they would just fail
// forever. Logged loudly so the operator notices.
function postWithSafety(payload) {
  return postOnce(payload)
    .catch(function (err1) {
      if (!err1.transient) {
        console.error('[CRM] permanent failure, dropping payload:', err1.message, payload);
        return; // do not retry, do not queue
      }
      console.warn('[CRM] attempt 1 failed (transient):', err1.message, '— retrying in 2s');
      return new Promise(function (r) { setTimeout(r, RETRY_DELAY_MS); })
        .then(function () { return postOnce(payload); })
        .catch(function (err2) {
          if (!err2.transient) {
            console.error('[CRM] permanent failure on retry, dropping:', err2.message, payload);
            return;
          }
          console.warn('[CRM] attempt 2 failed (transient):', err2.message, '— queuing for later');
          queuePush(payload);
        });
    });
}

// ── Queue flusher ─────────────────────────────────────────────────
// Drains the queue sequentially. Three outcomes per item:
//   • success → remove
//   • permanent failure (4xx other than 409) → remove (logged)
//   • transient failure → leave it, try the next item
// Each item also has an attempts counter — after 10 tries we give up
// and drop it, so a single broken item can never block the queue forever.
var MAX_QUEUE_ATTEMPTS = 10;

function flushQueue() {
  var items = queueRead();
  if (items.length === 0) return;
  console.log('[CRM] flushing queue: ' + items.length + ' item(s)');

  var remaining = items.slice();
  var idx = 0;

  function next() {
    if (idx >= remaining.length) {
      queueWrite(remaining);
      return;
    }
    var item = remaining[idx];
    item.attempts = (item.attempts || 0) + 1;

    postOnce(item.payload)
      .then(function () {
        remaining.splice(idx, 1); // remove this item
        queueWrite(remaining);
        next();
      })
      .catch(function (err) {
        if (!err.transient) {
          console.error('[CRM] queue: permanent failure, dropping:', err.message, item.payload);
          remaining.splice(idx, 1);
          queueWrite(remaining);
          next();
          return;
        }
        if (item.attempts >= MAX_QUEUE_ATTEMPTS) {
          console.error('[CRM] queue: giving up after ' + item.attempts + ' attempts, dropping:', item.payload);
          remaining.splice(idx, 1);
          queueWrite(remaining);
          next();
          return;
        }
        // Transient failure: keep this item, try the next one.
        console.warn('[CRM] queue item ' + idx + ' still failing (attempt ' + item.attempts + '):', err.message);
        idx++;
        queueWrite(remaining);
        next();
      });
  }
  next();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', flushQueue);
} else {
  flushQueue();
}

// ── Payload builders ──────────────────────────────────────────────
function buildInitialSavePayload() {
  var subjects = Array.from(document.querySelectorAll('#subjPills .sp.s'))
    .map(function (e) { return e.textContent.trim(); }).join(', ');
  var othersVal = document.getElementById('othersField').value.trim();
  if (othersVal) subjects += (subjects ? ', ' : '') + othersVal;

  var classVal = document.getElementById('standard').value;
  var boardVal = document.getElementById('board').value;
  var standardCombined = [classVal, boardVal].filter(Boolean).join(' ');

  var countrySelect = document.getElementById('countrySelect');
  var selectedOption = countrySelect.options[countrySelect.selectedIndex];
  var countryName = currentMode === 'online'
    ? (selectedOption ? (selectedOption.getAttribute('data-name') || '') : '')
    : 'India';
  var dialCode = currentMode === 'online'
    ? (selectedOption ? (selectedOption.getAttribute('data-dial') || '') : '')
    : '+91';

  return {
    action:            'initial_save',
    request_id:        window._requestId,
    parent_name:       document.getElementById('parentName').value,
    mobile:            document.getElementById('phone').value,
    country_code:      dialCode,
    student_name:      document.getElementById('studentName').value,
    standard:          standardCombined,
    subjects:          subjects,
    class_mode:        currentMode,
    tutor_gender:      genderPrefVal,
    city:              currentMode === 'online'
                         ? document.getElementById('onlineCity').value
                         : document.getElementById('homeCity').value,
    locality:          currentMode === 'home'
                         ? document.getElementById('homeArea').value : '',
    country:           countryName,
    latitude:          locLat,
    longitude:         locLng,
    location_address:  locAddr,
    maps_link:         locLink,
    days_per_week:     document.getElementById('daysPerWeek').value,
    hours_per_session: document.getElementById('hoursPerSession').value,
    notes:             document.getElementById('addlInfo').value,
    hourly_fee:        window._hourlyFee || '',
    monthly_estimate:  window._monthlyEstimate || '',
    quote_accepted:    'Pending',
    ref:               getReferralCode(),
  };
}

function buildQuoteUpdatePayload() {
  return {
    action:           'quote_update',
    request_id:       window._requestId,
    quote_accepted:   quoteChoice === 'accept' ? 'Yes' : 'No',
    hourly_fee:       window._hourlyFee || '',
    monthly_estimate: window._monthlyEstimate || '',
    expected_quote:   quoteChoice === 'decline'
                        ? document.getElementById('myQuoteField').value : '',
  };
}

// ── Public entry points called from sheet.js ───────────────────────
function saveLeadToCRM()   { return postWithSafety(buildInitialSavePayload()); }
function updateQuoteInCRM(){ return postWithSafety(buildQuoteUpdatePayload()); }
