// ══════════════════════════════════════════════
// ProTutor - Schedule Recommendation Engine
// ══════════════════════════════════════════════

// ── Schedule Recommendation Engine ───────────────────────────
function getSchedRec() {
  // Get class number
  var stdVal = document.getElementById('standard').value; // e.g. "Class 7"
  if (!stdVal) return null;
  var classNum = parseInt(stdVal.replace('Class ', ''), 10);
  if (isNaN(classNum)) return null;

  // Get subject count (selected pills + others if filled)
  var subjCount = document.querySelectorAll('#subjPills .sp.s').length;
  var othersOn  = document.getElementById('otherspill').classList.contains('s');
  var othersVal = document.getElementById('othersField').value.trim();
  if (othersOn && othersVal) subjCount += othersVal.split(',').filter(function(s){ return s.trim(); }).length;
  if (subjCount === 0) return null;

  var rec = {};

  if (classNum <= 8) {
    if (subjCount >= 3) {
      rec.days  = '5 days';
      rec.hours = '1 hour or 1.5 hours';
      rec.main  = '5 days/week · 1 hr or 1.5 hrs/session';
      rec.why   = '1 hr/day covers day-to-day school topics and builds strong concepts. Choose 1.5 hrs if you also want homework help — a complete full-package session.';
    } else if (subjCount === 2) {
      rec.days  = '3–4 days';
      rec.hours = '1.5 hours';
      rec.main  = '3–4 days/week · 1.5 hrs/session';
      rec.why   = 'With 2 subjects, 3–4 sessions a week at 1.5 hrs each gives enough time for concept building and practice without overloading your child.';
    } else {
      // 1 subject
      rec.days  = '2 days';
      rec.hours = '1.5 hours';
      rec.main  = '2 days/week · 1.5 hrs/session';
      rec.why   = 'For a single subject, 2 focused sessions of 1.5 hrs each week is ideal for steady progress without burnout.';
    }
  } else {
    // Class 9–12
    var days = Math.min(subjCount * 2, 6);
    var daysLabel = days + (days === 1 ? ' day' : ' days');
    if (subjCount >= 4) {
      rec.main = '6 days/week · 1.5 hrs/session';
      rec.why  = 'With ' + subjCount + ' subjects at this level, 6 days at 1.5 hrs/session is the maximum we recommend. Our tutors will coordinate a smart rotation across subjects.';
    } else {
      rec.main = daysLabel + '/week · 1.5 hrs/session';
      rec.why  = 'For Class ' + classNum + ' with ' + subjCount + ' subject' + (subjCount > 1 ? 's' : '') + ', we recommend 2 sessions per subject per week at 1.5 hrs each — enough depth for board-level preparation.';
    }
  }
  return rec;
}

function updateSchedRec() {
  var box      = document.getElementById('schedRecBox');
  var subjsEl  = document.getElementById('schedRecSubjects');
  var main     = document.getElementById('schedRecMain');
  var why      = document.getElementById('schedRecWhy');
  var rec      = getSchedRec();
  if (!rec) { box.classList.remove('show'); return; }

  // Build selected subjects list
  var subjList = Array.from(document.querySelectorAll('#subjPills .sp.s'))
    .map(function(e) { return e.textContent.trim(); });
  var othersOn  = document.getElementById('otherspill').classList.contains('s');
  var othersVal = document.getElementById('othersField').value.trim();
  if (othersOn && othersVal) {
    othersVal.split(',').forEach(function(s) {
      var t = s.trim(); if (t) subjList.push(t);
    });
  }
  var stdVal = document.getElementById('standard').value;
  subjsEl.innerHTML = '<b>' + stdVal + '</b> &nbsp;·&nbsp; ' + subjList.join(', ');

  main.textContent = '✦ ' + rec.main;
  why.textContent  = rec.why;
  box.classList.add('show');
}

// Also trigger rec update when subjects or class change on page 1
// (subjects are toggled inline; we hook via MutationObserver after init)
function hookPage1Changes() {
  // Watch subject pill clicks — already handled via onclick toggle, so we
  // patch toggleOthers and pill clicks to also call updateSchedRec
  document.querySelectorAll('#subjPills .sp').forEach(function(pill) {
    pill.addEventListener('click', function() { setTimeout(updateSchedRec, 50); });
  });
  document.getElementById('standard').addEventListener('change', updateSchedRec);
  document.getElementById('othersField').addEventListener('input', updateSchedRec);
}
