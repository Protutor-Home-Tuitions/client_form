// ══════════════════════════════════════════════
// ProTutor - Fee Calculation Engine
// ══════════════════════════════════════════════

// ── Fee Engine ────────────────────────────────────────────────

var CLASSES_PER_MONTH = {1:4,2:8,3:12,4:16,5:22,6:24};
var HRS_MAP = {'1 hour':1,'1.5 hours':1.5,'2 hours':2};
var DAYS_MAP = {'1 day':1,'2 days':2,'3 days':3,'4 days':4,'5 days':5,'6 days':6};

function getClassGroup(std) {
  if (std === 'KG' || std === 'Class 1' || std === 'Class 2' || std === 'Class 3' || std === 'Class 4') return 'kg4';
  if (std === 'Class 5' || std === 'Class 6' || std === 'Class 7' || std === 'Class 8') return 'c58';
  if (std === 'Class 9' || std === 'Class 10') return 'c910';
  if (std === 'Class 11' || std === 'Class 12') return 'c1112';
  return null;
}

function isIGCSE(board) { return board === 'IGCSE' || board === 'IB'; }
function isOnlineIndia(mode, country) { return mode === 'online' && country === 'IN'; }

function getHourlyRate(group, board, mode, country) {
  var intl = isIGCSE(board);
  var onIndia = isOnlineIndia(mode, country);
  var rates = {
    kg4:  { std:{low:350,high:400}, intl:{low:400,high:450} },
    c58:  { std:{low:400,high:450}, intl:{low:450,high:500} },
    c910: { std:{low:600,high:700}, intl:{low:700,high:800} },
    c1112:{ std:{low:700,high:800}, intl:{low:800,high:900} }
  };
  var r = rates[group][intl ? 'intl' : 'std'];
  if (onIndia) return { low: Math.round(r.low * 0.75), high: Math.round(r.high * 0.75) };
  return { low: r.low, high: r.high };
}

function roundTo100(n) { return Math.round(n / 100) * 100; }
function fmtINR(n) { return '₹' + n.toLocaleString('en-IN'); }
function fmtRange(lo, hi) { return fmtINR(lo) + ' – ' + fmtINR(hi); }

// ── Quote toggle ──────────────────────────────────────────────
var quoteChoice = ''; // 'accept' or 'decline'

function pickQuote(choice) {
  quoteChoice = choice;
  if (typeof logEvent === 'function') {
    logEvent(choice === 'accept' ? 'quote_accepted' : 'quote_declined');
  }
  var acceptCard = document.getElementById('qtAccept');
  var declineLink = document.getElementById('qtDecline');
  if (choice === 'accept') {
    acceptCard.classList.add('s');
    declineLink.style.color = '#aab4d4';
    declineLink.style.fontWeight = '500';
  } else {
    acceptCard.classList.remove('s');
    declineLink.style.color = '#1a1aff';
    declineLink.style.fontWeight = '700';
  }
  var wrap = document.getElementById('myQuoteWrap');
  if (choice === 'decline') { wrap.classList.add('show'); }
  else { wrap.classList.remove('show'); document.getElementById('myQuoteField').value = ''; }
}

function doSubmit() {
  if (!quoteChoice) { toast('⚠ Please select Accept or Don\'t Accept Quote'); return; }
  if (quoteChoice === 'decline' && !document.getElementById('myQuoteField').value.trim()) {
    toast('⚠ Please enter your expected quote / budget'); return;
  }
  submitToSheets();
}

function buildPage3() {
  // reset quote state
  quoteChoice = '';
  document.getElementById('qtAccept').classList.remove('s');
  document.getElementById('qtDecline').classList.remove('s');
  document.getElementById('myQuoteWrap').classList.remove('show');
  document.getElementById('myQuoteField').value = '';

  var std      = document.getElementById('standard').value;
  var board    = document.getElementById('board').value;
  var days     = document.getElementById('daysPerWeek').value;
  var hrs      = document.getElementById('hoursPerSession').value;
  var mode     = currentMode;
  var country  = document.getElementById('countrySelect').value;
  var homeCity = document.getElementById('homeCity').value;

  var subjList = Array.from(document.querySelectorAll('#subjPills .sp.s'))
    .map(function(e){ return e.textContent.trim(); });
  var othersOn = document.getElementById('otherspill').classList.contains('s');
  var othersVal = document.getElementById('othersField').value.trim();
  if (othersOn && othersVal) {
    othersVal.split(',').forEach(function(s){ var t=s.trim(); if(t) subjList.push(t); });
  }
  var subjCount = subjList.length;

  // Summary chips
  var chips = document.getElementById('summaryChips');
  chips.innerHTML = '';
  var chipData = [
    std, board,
    subjList.slice(0,3).join(', ') + (subjList.length > 3 ? ' +' + (subjList.length-3) + ' more' : ''),
    days, hrs,
    mode === 'home' ? '🏠 Home · ' + homeCity : (country === 'IN' ? '💻 Online · India' : '💻 Online · International')
  ];
  chipData.forEach(function(c){
    if (!c) return;
    var sp = document.createElement('span');
    sp.className = 's-chip';
    sp.textContent = c;
    chips.appendChild(sp);
  });

  // Mode badge
  var badge = document.getElementById('feeModeBadge');
  var onIndia = isOnlineIndia(mode, country);
  if (mode === 'home') {
    badge.className = 'fee-mode-badge home';
    badge.innerHTML = '🏠 Home Tuition · ' + homeCity;
  } else if (onIndia) {
    badge.className = 'fee-mode-badge online-india';
    badge.innerHTML = '💻 Online · India <span style="font-size:10px;margin-left:4px;">· 25% online discount applied</span>';
  } else {
    badge.className = 'fee-mode-badge online-intl';
    badge.innerHTML = '💻 Online · International';
  }

  var group    = getClassGroup(std);
  var daysNum  = DAYS_MAP[days]  || 0;
  var hrsNum   = HRS_MAP[hrs]    || 0;
  var classes  = CLASSES_PER_MONTH[daysNum] || 0;
  var rate     = getHourlyRate(group, board, mode, country);
  var isHighClass = (group === 'c910' || group === 'c1112');
  var isMonthly   = !isHighClass && daysNum >= 5;
  var hasDiscount = isMonthly && hrsNum >= 1.5;

  var rawLow  = roundTo100(rate.low  * hrsNum * classes * (isHighClass ? subjCount : 1));
  var rawHigh = roundTo100(rate.high * hrsNum * classes * (isHighClass ? subjCount : 1));
  var perSubjLow  = isHighClass && subjCount > 1 ? roundTo100(rawLow  / subjCount) : rawLow;
  var perSubjHigh = isHighClass && subjCount > 1 ? roundTo100(rawHigh / subjCount) : rawHigh;
  var discLow  = hasDiscount ? roundTo100(rawLow  * 0.85) : rawLow;
  var discHigh = hasDiscount ? roundTo100(rawHigh * 0.85) : rawHigh;
  var savMonLow  = hasDiscount ? (rawLow  - discLow)  : 0;
  var savMonHigh = hasDiscount ? (rawHigh - discHigh) : 0;
  var savYrLow   = savMonLow  * 12;
  var savYrHigh  = savMonHigh * 12;

  // Store for sheet submission
  window._hourlyFee       = fmtRange(rate.low, rate.high) + '/hr';
  window._monthlyEstimate = isHighClass
    ? fmtRange(rawLow, rawHigh) + ' total' + (subjCount > 1 ? ' (' + fmtRange(perSubjLow, perSubjHigh) + '/subject)' : '')
    : (hasDiscount ? fmtRange(discLow, discHigh) + ' (after 15% discount)' : fmtRange(rawLow, rawHigh));

  var body = document.getElementById('feeBody');
  var html = '';

  // Hourly rate header (all groups)
  html += '<div class="fee-hourly-row">';
  html += '  <span class="fee-hourly-label">Hourly Rate</span>';
  html += '  <span><span class="fee-hourly-val">' + fmtRange(rate.low, rate.high) + '</span> <span class="fee-hourly-unit">/hr</span></span>';
  html += '</div>';
  html += '<div style="font-size:11px;color:#aab4d4;margin-bottom:4px;">' + classes + ' classes/month · ' + hrs + '/session</div>';

  if (isHighClass) {
    // Class 9–12
    html += '<div class="fee-monthly-wrap">';
    html += '  <span class="fee-monthly-label">Monthly Estimate · ' + subjCount + ' Subject' + (subjCount>1?'s':'') + '</span>';
    html += '  <div class="fee-monthly-val">' + fmtRange(rawLow, rawHigh) + '</div>';
    html += '  <div class="fee-monthly-sub">' + subjList.join(', ') + '</div>';
    html += '</div>';

    // Coaching comparison
    var coachTotal = 3000 * subjCount;
    var proTotal   = 6000 * subjCount;
    html += '<div class="coaching-card" style="margin-top:12px;">';
    html += '  <div class="coaching-title">📊 How we compare to Coaching Centres</div>';
    html += '  <div class="coaching-row"><span class="coaching-lbl">Coaching Centre · ' + subjCount + ' subject' + (subjCount>1?'s':'') + ' · 30-student batch · 2 classes/week</span><span class="coaching-val">' + fmtINR(coachTotal) + '/mo</span></div>';
    html += '  <div class="coaching-row"><span class="coaching-lbl">ProTutor 1-to-1 · ' + subjCount + ' subject' + (subjCount>1?'s':'') + ' · ' + days + '</span><span class="coaching-val" style="color:#1a1aff;">' + fmtRange(rawLow, rawHigh) + '/mo</span></div>';
    html += '  <div class="coaching-highlight">A 1-to-1 equivalent of coaching would cost <b>' + fmtINR(proTotal) + '/month</b>. With ProTutor you get <b>personalised undivided attention</b> at a fraction of that — starting at just <b>' + fmtINR(rawLow) + '/month</b>. 🎯</div>';
    html += '</div>';

  } else if (isMonthly) {
    // KG–8, 5–6 days monthly
    html += '<div class="fee-monthly-wrap">';
    if (hasDiscount) {
      html += '  <span class="fee-monthly-label">Monthly Package Price</span>';
      html += '  <div><span class="fee-monthly-strike">' + fmtRange(rawLow, rawHigh) + '</span></div>';
      html += '  <div class="fee-monthly-val" style="color:#1a1aff;">' + fmtRange(discLow, discHigh) + '</div>';
      html += '  <div class="discount-badge">🎉 15% Plan Discount Applied</div>';
    } else {
      html += '  <span class="fee-monthly-label">Monthly Estimate</span>';
      html += '  <div class="fee-monthly-val">' + fmtRange(rawLow, rawHigh) + '</div>';
      html += '  <div class="fee-monthly-sub">Choose 1.5 hr or 2 hr sessions to unlock 15% off 🎉</div>';
    }
    html += '</div>';
    if (hasDiscount) {
      html += '<div class="savings-row">';
      html += '  <div class="saving-box"><span class="saving-box-lbl">You Save / Month</span><span class="saving-box-val">' + fmtRange(savMonLow, savMonHigh) + '</span></div>';
      html += '  <div class="saving-box"><span class="saving-box-lbl">You Save / Year</span><span class="saving-box-val">' + fmtRange(savYrLow, savYrHigh) + '</span></div>';
      html += '</div>';
    }

  } else {
    // KG–8, 1–4 days hourly
    html += '<div class="fee-monthly-wrap">';
    html += '  <span class="fee-monthly-label">Monthly Estimate</span>';
    html += '  <div class="fee-monthly-val">' + fmtRange(rawLow, rawHigh) + '</div>';
    html += '  <div class="fee-monthly-sub">Upgrade to 5 or 6 days + 1.5/2 hrs to unlock <b>15% monthly discount</b> 🎉</div>';
    html += '</div>';
  }

  body.innerHTML = html;

  // Generate Request ID (once per session) and auto-save to sheet
  if (!window._requestId) {
    window._requestId = Date.now() + '_' + Math.random().toString(36).substr(2,6);
  }
  autoSaveToSheet();
}

