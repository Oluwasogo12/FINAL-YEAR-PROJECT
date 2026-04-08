/* =========================================================
   RBAPS — Main JS (utils, nav, toast, sidebar)
   ========================================================= */

/* ── Toast ──────────────────────────────────────────────── */
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>'
        : type === 'error'   ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

/* ── Sidebar toggle ─────────────────────────────────────── */
function initSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.querySelector('.sidebar-overlay');
  const hamburger = document.querySelector('.hamburger');
  if (!sidebar) return;

  function openSidebar()  { sidebar.classList.add('open'); overlay.classList.add('open'); }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); }

  if (hamburger) hamburger.addEventListener('click', openSidebar);
  if (overlay)   overlay.addEventListener('click', closeSidebar);

  // Active nav item
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    if (item.dataset.page === path || (path === '' && item.dataset.page === 'dashboard.html')) {
      item.classList.add('active');
    }
    item.addEventListener('click', () => {
      if (window.innerWidth < 900) closeSidebar();
      window.location.href = item.dataset.page;
    });
  });
}

/* ── Progress Bar Helper ────────────────────────────────── */
function setProgressBar(el, pct) {
  if (!el) return;
  const fill = el.querySelector('.progress-bar-fill');
  if (!fill) return;
  fill.style.width = Math.min(100, Math.max(0, pct)) + '%';
  // Color by value
  fill.classList.remove('red', 'amber', 'gold');
  if (pct < 40)       fill.classList.add('red');
  else if (pct < 60)  fill.classList.add('amber');
  else if (pct < 80)  fill.classList.add('gold');
}

/* ── Mastery colour class ───────────────────────────────── */
function masteryClass(pct) {
  if (pct >= 80) return 'mastered';
  if (pct >= 60) return 'developing';
  if (pct >= 40) return 'below';
  return 'urgent';
}

/* ── Circular progress SVG ──────────────────────────────── */
function buildCircleProgress(pct, size = 80, stroke = 6) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = ((100 - pct) / 100) * circ;
  const cls  = masteryClass(pct);
  const colors = { mastered: '#1E7E4A', developing: '#C8A96E', below: '#D4860A', urgent: '#C0392B' };
  const color = colors[cls];
  return `
    <div class="circle-prog" style="width:${size}px;height:${size}px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"/>
        <circle class="fill" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"
          stroke="${color}"
          stroke-dasharray="${circ}"
          stroke-dashoffset="${dash}"
          style="transition:stroke-dashoffset .8s ease"/>
      </svg>
      <div class="label">${pct}<small>%</small></div>
    </div>`;
}

/* ── Format date ────────────────────────────────────────── */
function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Simple SVG line chart ──────────────────────────────── */
function drawLineChart(canvasEl, labels, data, color = '#2E6B4F') {
  if (!canvasEl) return;
  const W = canvasEl.offsetWidth || 400, H = canvasEl.offsetHeight || 180;
  canvasEl.width  = W * devicePixelRatio;
  canvasEl.height = H * devicePixelRatio;
  const ctx = canvasEl.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const pad = { top: 14, right: 14, bottom: 28, left: 32 };
  const cW  = W - pad.left - pad.right;
  const cH  = H - pad.top  - pad.bottom;
  const max = Math.max(...data, 100);
  const min = 0;

  // Grid lines
  ctx.strokeStyle = '#E5E3DC'; ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad.top + cH - (v / max) * cH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke();
    ctx.fillStyle = '#8A8784'; ctx.font = '10px DM Sans, sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(v + '%', pad.left - 4, y + 4);
  });

  // x labels
  ctx.textAlign = 'center'; ctx.fillStyle = '#8A8784'; ctx.font = '10px DM Sans, sans-serif';
  const step = cW / Math.max(labels.length - 1, 1);
  labels.forEach((lbl, i) => {
    ctx.fillText(lbl, pad.left + i * step, H - 8);
  });

  // Area
  const pts = data.map((v, i) => ({ x: pad.left + i * step, y: pad.top + cH - ((v - min) / (max - min)) * cH }));
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
  grad.addColorStop(0, color + '30'); grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const mid = { x: (pts[i-1].x + pts[i].x)/2, y: (pts[i-1].y + pts[i].y)/2 };
    ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mid.x, mid.y);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  ctx.lineTo(pts[pts.length-1].x, pad.top + cH);
  ctx.lineTo(pts[0].x, pad.top + cH);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const mid = { x: (pts[i-1].x + pts[i].x)/2, y: (pts[i-1].y + pts[i].y)/2 };
    ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mid.x, mid.y);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
  ctx.stroke();

  // Dots
  pts.forEach((p, i) => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  });
}

/* ── Password toggle ────────────────────────────────────── */
function initPasswordToggles() {
  document.querySelectorAll('.input-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = btn.previousElementSibling;
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.innerHTML = inp.type === 'password'
        ? `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });
  });
}

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initPasswordToggles();
});
