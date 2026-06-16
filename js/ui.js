// ══════════════════════════════════════════════
// ProTutor - UI Functions
// ══════════════════════════════════════════════

function buildCountrySelect() {
  var sel = document.getElementById('countrySelect');
  countries.forEach(function(grp) {
    var og = document.createElement('optgroup');
    og.label = grp.g;
    grp.list.forEach(function(c) {
      var o = document.createElement('option');
      o.value = c.c;
      o.dataset.dial = c.d;
      o.dataset.flag = c.f;
      o.dataset.name = c.n;
      o.textContent = c.f + '  ' + c.n + '  (' + c.d + ')';
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
}

function updateCode() {
  var sel = document.getElementById('countrySelect');
  var opt = sel.options[sel.selectedIndex];
  var badge = document.getElementById('codeBadge');
  if (opt && opt.value) {
    document.getElementById('codeFlag').textContent = opt.dataset.flag;
    document.getElementById('codeText').textContent = opt.dataset.name + ' · ' + opt.dataset.dial;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ── Progress ──────────────────────────────────────────────────
function updateProgress(n) {
  document.getElementById('stepPill').textContent = STEPS[n];
  for (var i = 1; i <= 4; i++) {
    var seg  = document.getElementById('ps' + i);
    var name = document.getElementById('sn' + i);
    if (i < n)       { seg.className = 'prog-seg done';   name.className = 'step-name done'; }
    else if (i === n){ seg.className = 'prog-seg active'; name.className = 'step-name active'; }
    else             { seg.className = 'prog-seg';         name.className = 'step-name'; }
  }
}

// ── Navigation ────────────────────────────────────────────────
function goTo(n) {
  document.getElementById('pg' + cur).classList.remove('active');
  hist.push(cur); cur = n;
  document.getElementById('pg' + n).classList.add('active');
  updateProgress(n);
  if (n === 3) buildPage3();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goBack() {
  if (!hist.length) return;
  document.getElementById('pg' + cur).classList.remove('active');
  cur = hist.pop();
  document.getElementById('pg' + cur).classList.add('active');
  updateProgress(cur);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Save bar ──────────────────────────────────────────────────
function animSave(cb) {
  var bar = document.getElementById('savingBar');
  bar.style.transition = 'none'; bar.style.width = '0%';
  setTimeout(function () {
    bar.style.transition = 'width .55s ease'; bar.style.width = '100%';
    setTimeout(function () { bar.style.transition = 'none'; bar.style.width = '0%'; cb(); }, 620);
  }, 30);
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, ms) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, ms || 2400);
}

// ── Others subject toggle ─────────────────────────────────────
function toggleOthers() {
  var pill  = document.getElementById('otherspill');
  var input = document.getElementById('othersInput');
  var field = document.getElementById('othersField');
  pill.classList.toggle('s');
  if (pill.classList.contains('s')) {
    input.classList.add('show');
    field.focus();
  } else {
    input.classList.remove('show');
    field.value = '';
  }
  setTimeout(updateSchedRec, 50);
}

// ── Class mode ────────────────────────────────────────────────
function setMode(m) {
  currentMode = m;
  var on = document.getElementById('modeOnline');
  var ho = document.getElementById('modeHome');
  var ow = document.getElementById('onlineWrap');
  var hw = document.getElementById('homeWrap');
  if (m === 'online') {
    on.classList.add('s'); ho.classList.remove('s');
    ow.style.display = 'block'; hw.style.display = 'none';
  } else {
    ho.classList.add('s'); on.classList.remove('s');
    hw.style.display = 'block'; ow.style.display = 'none';
  }
  updatePg2Btn();
}

function updatePg2Btn() {
  var btn = document.getElementById('pg2ContBtn');
  btn.className = 'bcont';
  btn.textContent = 'Continue →';
}
