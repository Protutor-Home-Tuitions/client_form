// ══════════════════════════════════════════════
// ProTutor - CRM Database Integration
// ══════════════════════════════════════════════
//
// Sends form submissions to the ProTutor CRM (Supabase) IN ADDITION to
// Google Sheets. Google Sheets remains the safety net.
//
// Design: "fire-and-forget". We never block the parent on this call. If
// the CRM API is slow or down, the parent still sees success because the
// Google Sheet save is what drives the UI. Failures here are logged to the
// browser console only.
//
// The form sends data TWICE per session using the same Request ID:
//   1. initial_save  — when the quote page (page 3) loads
//   2. quote_update  — when the parent accepts/declines and submits
// ══════════════════════════════════════════════

// CRM API endpoint. Update this to your live CRM domain.
var CRM_API_URL = 'https://leads.protutor.co.in/api/public/form-submit';

// ── Referral channel capture ───────────────────────────────────────
// Reads ?r=<code> from the URL the FIRST time the form is opened, then
// stores it in sessionStorage so navigating between form steps (or any
// later code in the session) keeps the same channel. The backend
// translates the code to a human-readable source (Call / WhatsApp / ...).
// Unknown codes are still sent — the backend whitelist decides validity.
(function captureReferral() {
  try {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get('r');
    if (fromUrl) {
      sessionStorage.setItem('protutor_ref', fromUrl);
    }
  } catch (e) {
    // sessionStorage / URLSearchParams should always work in modern
    // browsers; if they don't, we just save the lead without a channel.
  }
})();

function getReferralCode() {
  try { return sessionStorage.getItem('protutor_ref') || ''; }
  catch (e) { return ''; }
}

// Low-level sender. Fire-and-forget: errors are caught and logged, never
// surfaced to the parent. keepalive lets the request finish even if the
// page is navigating to the success screen.
function postToCRM(payload) {
  try {
    fetch(CRM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
    .then(function (r) {
      if (!r.ok) console.warn('[CRM] save returned status', r.status);
    })
    .catch(function (err) {
      console.warn('[CRM] save failed (lead is still safe in Sheets):', err);
    });
  } catch (err) {
    console.warn('[CRM] save threw (lead is still safe in Sheets):', err);
  }
}

// ── initial_save: full lead, sent when page 3 loads ─────────────────
function saveLeadToCRM() {
  // Subjects (same logic as the sheet save).
  var subjects = Array.from(document.querySelectorAll('#subjPills .sp.s'))
    .map(function (e) { return e.textContent.trim(); }).join(', ');
  var othersVal = document.getElementById('othersField').value.trim();
  if (othersVal) subjects += (subjects ? ', ' : '') + othersVal;

  // Combine class + board into one field, e.g. "Class 7 CBSE".
  var classVal = document.getElementById('standard').value;
  var boardVal = document.getElementById('board').value;
  var standardCombined = [classVal, boardVal].filter(Boolean).join(' ');

  // Country / dial code (online vs home).
  var countrySelect = document.getElementById('countrySelect');
  var selectedOption = countrySelect.options[countrySelect.selectedIndex];
  var countryName = currentMode === 'online'
    ? (selectedOption ? (selectedOption.getAttribute('data-name') || '') : '')
    : 'India';
  var dialCode = currentMode === 'online'
    ? (selectedOption ? (selectedOption.getAttribute('data-dial') || '') : '')
    : '+91';

  var payload = {
    action:            'initial_save',
    request_id:        window._requestId,
    parent_name:       document.getElementById('parentName').value,
    mobile:            document.getElementById('phone').value,
    country_code:      dialCode,
    student_name:      document.getElementById('studentName').value,
    standard:          standardCombined,
    subjects:          subjects,
    // currentMode is 'online' or 'home'; the API normalizes to the DB enum.
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

  postToCRM(payload);
}

// ── quote_update: quote decision, sent on final submit ──────────────
function updateQuoteInCRM() {
  var payload = {
    action:           'quote_update',
    request_id:       window._requestId,
    quote_accepted:   quoteChoice === 'accept' ? 'Yes' : 'No',
    hourly_fee:       window._hourlyFee || '',
    monthly_estimate: window._monthlyEstimate || '',
    expected_quote:   quoteChoice === 'decline'
                        ? document.getElementById('myQuoteField').value : '',
  };
  postToCRM(payload);
}
