// ══════════════════════════════════════════════
// ProTutor - Google Sheet Integration
// ══════════════════════════════════════════════

// ── Sheet Helper ──────────────────────────────────────────────
var SHEET_URL = 'https://script.google.com/macros/s/AKfycbyHbE7WcOucmBBKxjuE4OO_5I0U6gMLoyzi1_3MfcnQQFN8iSYv5JwzhXq9Q7o1z4rX/exec';

function postToSheet(payload, callback) {
  var iframeName = 'pf_' + Date.now();
  var ifr = document.createElement('iframe');
  ifr.name = iframeName;
  ifr.style.display = 'none';
  document.body.appendChild(ifr);

  var frm = document.createElement('form');
  frm.method = 'POST';
  frm.action = SHEET_URL;
  frm.target = iframeName;

  var inp = document.createElement('input');
  inp.type = 'hidden';
  inp.name = 'payload';
  inp.value = JSON.stringify(payload);
  frm.appendChild(inp);

  document.body.appendChild(frm);
  frm.submit();

  setTimeout(function() {
    try { document.body.removeChild(frm); } catch(e) {}
    try { document.body.removeChild(ifr); } catch(e) {}
    if (callback) callback();
  }, 3000);
}

// ── Auto-save (fires silently when Page 3 loads) ─────────────
function autoSaveToSheet() {
  var subjects = Array.from(document.querySelectorAll('#subjPills .sp.s'))
    .map(function(e) { return e.textContent.trim(); }).join(', ');
  var othersVal = document.getElementById('othersField').value.trim();
  if (othersVal) subjects += (subjects ? ', ' : '') + othersVal;

  var countrySelect = document.getElementById('countrySelect');
  var selectedOption = countrySelect.options[countrySelect.selectedIndex];

  var data = {
    '_action':            'initial_save',
    'Submitted Date':     new Date().toLocaleDateString('en-IN', {timeZone:'Asia/Kolkata', day:'2-digit', month:'2-digit', year:'2-digit'}),
    'Submitted Time':     new Date().toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', hour12:false}),
    'Parent Name':        document.getElementById('parentName').value,
    'Mobile':             document.getElementById('phone').value,
    'Student Name':       document.getElementById('studentName').value,
    'Class':              document.getElementById('standard').value,
    'Board':              document.getElementById('board').value,
    'Subjects':           subjects,
    'Class Mode':         currentMode === 'online' ? 'Online' : 'Home Tuition',
    'Country':            currentMode === 'online' ? (selectedOption ? selectedOption.getAttribute('data-name') || selectedOption.text : '') : 'India',
    'Country Code':       (function() { var code = currentMode === 'online' ? (selectedOption ? selectedOption.getAttribute('data-dial') || '' : '') : '+91'; return code.replace(/^\+/, ''); })(),
    'City':               currentMode === 'online' ? document.getElementById('onlineCity').value : (currentMode === 'home' ? document.getElementById('homeCity').value : ''),
    'Locality':           currentMode === 'home' ? document.getElementById('homeArea').value : '',
    'Latitude':           locLat,
    'Longitude':          locLng,
    'Location Address':   locAddr,
    'Maps Link':          locLink,
    'Days per Week':      document.getElementById('daysPerWeek').value,
    'Hours per Session':  document.getElementById('hoursPerSession').value,
    'Tutor Gender Pref':  genderPrefVal,
    'Additional Info':    document.getElementById('addlInfo').value,
    'Quote Accepted':     'Pending',
    'Hourly Fee':         window._hourlyFee || '',
    'Monthly Estimate':   window._monthlyEstimate || '',
    'My Quote':           '',
    'Request ID':         window._requestId,
    'Subscription Action': '',
  };

  postToSheet(data, null);

  // Also send to the CRM database (fire-and-forget; Sheets stays the net).
  if (typeof saveLeadToCRM === 'function') saveLeadToCRM();
}

// ── Submit (updates existing row with quote decision) ─────────
function submitToSheets() {
  if (submitted) return;
  submitted = true;

  document.getElementById('submitOverlay').classList.add('show');

  var data = {
    '_action':            'quote_update',
    'Request ID':         window._requestId,
    'Quote Accepted':     quoteChoice === 'accept' ? 'Yes' : 'No',
    'Hourly Fee':         window._hourlyFee || '',
    'Monthly Estimate':   window._monthlyEstimate || '',
    'My Quote':           quoteChoice === 'decline' ? document.getElementById('myQuoteField').value : '',
  };

  postToSheet(data, function() {
    showPlansPage();
  });

  // Also update the quote decision in the CRM database (fire-and-forget).
  if (typeof updateQuoteInCRM === 'function') updateQuoteInCRM();
}

function showPlansPage() {
  document.getElementById('submitOverlay').classList.remove('show');
  // Subscription page disabled for now
  showSuccess();
}

var successShown = false;
function showSuccess() {
  if (successShown) return;
  successShown = true;
  document.getElementById('submitOverlay').classList.remove('show');
  document.getElementById('successScreen').classList.add('show');
}
