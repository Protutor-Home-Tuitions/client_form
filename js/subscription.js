// ══════════════════════════════════════════════
// ProTutor - Subscription Plans
// ══════════════════════════════════════════════

buildCountrySelect();
hookPage1Changes();


function swPlan(plan, el) {
  document.querySelectorAll('.pt-seg').forEach(function(t){ t.classList.remove('active','seg-blue','seg-amber'); });
  document.querySelectorAll('.sp-panel').forEach(function(p){ p.classList.remove('active'); });
  if (plan === 'advantage') el.classList.add('active','seg-blue');
  else if (plan === 'elite') el.classList.add('active','seg-amber');
  else el.classList.add('active');
  document.getElementById('sp-' + plan).classList.add('active');
}
function toggleFaq(item) {
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(i){ i.classList.remove('open'); });
  if (!wasOpen) item.classList.add('open');
}

// ── Subscription Action Tracking ──
// Subscription tracking (disabled — page not shown currently)
function trackSubscription(action, redirectUrl) {
  if (redirectUrl) window.open(redirectUrl, '_blank');
  showSuccess();
}
