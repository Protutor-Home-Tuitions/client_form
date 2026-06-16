// ══════════════════════════════════════════════
// ProTutor - Form Validation
// ══════════════════════════════════════════════

// ── Gender preference ─────────────────────────────────────────
function pickGP(el, val) {
  document.getElementById('gpRow').querySelectorAll('.gp').forEach(function(g) {
    g.classList.remove('s');
  });
  el.classList.add('s');
  genderPrefVal = val;
}

// ── Validation ────────────────────────────────────────────────
function validate(n) {
  if (n === 1) {
    if (!document.getElementById('parentName').value.trim())     { toast('⚠ Enter parent name'); return false; }
    if (!document.getElementById('phone').value.trim())         { toast('⚠ Enter mobile number'); return false; }
    if (!document.getElementById('studentName').value.trim())    { toast('⚠ Enter student name'); return false; }
    if (!document.getElementById('standard').value)              { toast('⚠ Select student class'); return false; }
    if (!document.getElementById('board').value)                 { toast('⚠ Select board'); return false; }
    var othersActive = document.getElementById('otherspill').classList.contains('s');
    var othersText   = document.getElementById('othersField').value.trim();
    var subjSelected = document.querySelectorAll('#subjPills .sp.s').length;
    if (!subjSelected && !(othersActive && othersText)) { toast('⚠ Select at least one subject'); return false; }
    return true;
  }
  if (n === 2) {
    if (!currentMode)                                              { toast('⚠ Select a class mode'); return false; }
    if (currentMode === 'online') {
      if (!document.getElementById('countrySelect').value)       { toast('⚠ Select your country'); return false; }
    }
    if (currentMode === 'home') {
      if (!document.getElementById('homeCity').value)            { toast('⚠ Select your city'); return false; }
      if (!document.getElementById('homeArea').value.trim())     { toast('⚠ Enter your area name'); return false; }
    }
    if (!document.getElementById('daysPerWeek').value)           { toast('⚠ Select days per week'); return false; }
    if (!document.getElementById('hoursPerSession').value)       { toast('⚠ Select hours per session'); return false; }
    if (!genderPrefVal)                                          { toast('⚠ Select tutor gender preference'); return false; }
    return true;
  }
  return true;
}

function doSave(n) {
  if (!validate(n)) return;
  animSave(function() {
    if (n < TOTAL) {
      toast('✓ Saved — moving to next step', 1400);
      setTimeout(function() { goTo(n + 1); }, 220);
    } else {
      submitToSheets();
    }
  });
}
