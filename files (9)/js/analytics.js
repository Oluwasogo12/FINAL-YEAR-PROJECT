/* =========================================================
   RBAPS — Analytics JS (demo data + rendering)
   ========================================================= */

/* ── Demo Data ──────────────────────────────────────────── */
const ANALYTICS_DATA = {
  subjects: {
    Mathematics: {
      icon: '📐', overall: 68,
      topics: [
        { name: 'Quadratic Equations', score: 45 },
        { name: 'Logarithms',          score: 72 },
        { name: 'Trigonometry',        score: 61 },
        { name: 'Sequences & Series',  score: 35 },
        { name: 'Statistics',          score: 80 },
        { name: 'Probability',         score: 55 },
        { name: 'Sets & Venn Diagrams',score: 78 },
        { name: 'Indices',             score: 82 },
      ],
      trend: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], data: [40,52,58,60,65,68] }
    },
    'English Language': {
      icon: '📝', overall: 74,
      topics: [
        { name: 'Comprehension',       score: 80 },
        { name: 'Summary Writing',     score: 68 },
        { name: 'Lexis & Structure',   score: 72 },
        { name: 'Oral English',        score: 58 },
        { name: 'Essay Writing',       score: 76 },
        { name: 'Antonyms/Synonyms',   score: 85 },
      ],
      trend: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], data: [55,60,64,70,72,74] }
    },
    Biology: {
      icon: '🧬', overall: 55,
      topics: [
        { name: 'Cell Biology',        score: 62 },
        { name: 'Genetics',            score: 38 },
        { name: 'Ecology',             score: 70 },
        { name: 'Human Physiology',    score: 50 },
        { name: 'Plant Biology',       score: 54 },
        { name: 'Evolution',           score: 42 },
      ],
      trend: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], data: [30,36,44,48,52,55] }
    },
    Chemistry: {
      icon: '⚗️', overall: 62,
      topics: [
        { name: 'Organic Chemistry',   score: 50 },
        { name: 'Acids & Bases',       score: 75 },
        { name: 'Periodic Table',      score: 68 },
        { name: 'Electrochemistry',    score: 42 },
        { name: 'Chemical Bonding',    score: 64 },
        { name: 'Moles & Stoich.',     score: 55 },
      ],
      trend: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], data: [35,45,52,57,60,62] }
    },
    Physics: {
      icon: '⚡', overall: 58,
      topics: [
        { name: 'Mechanics',           score: 65 },
        { name: 'Electricity',         score: 48 },
        { name: 'Waves & Optics',      score: 55 },
        { name: 'Thermodynamics',      score: 42 },
        { name: 'Nuclear Physics',     score: 38 },
        { name: 'Magnetic Fields',     score: 60 },
      ],
      trend: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], data: [28,34,42,50,54,58] }
    },
  },
  sessions: [
    { date: '2025-06-12', subject: 'Mathematics',     year: '2023', score: 72, mastery_change: '+5%' },
    { date: '2025-06-10', subject: 'Biology',         year: '2022', score: 55, mastery_change: '+3%' },
    { date: '2025-06-08', subject: 'Chemistry',       year: '2024', score: 60, mastery_change: '+4%' },
    { date: '2025-06-06', subject: 'Physics',         year: '2023', score: 48, mastery_change: '+2%' },
    { date: '2025-06-04', subject: 'English Language',year: '2022', score: 78, mastery_change: '+6%' },
  ]
};

let activeSubject = 'Mathematics';

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderMasteryOverview();
  renderSubjectAnalytics(activeSubject);
  renderSessionHistory();
  renderWeakAreas();

  // Chip filter (subject selector on chips)
  document.querySelectorAll('.chip[data-subject]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-subject]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeSubject = chip.dataset.subject;
      renderSubjectAnalytics(activeSubject);
    });
  });
});

/* ── Mastery Overview ───────────────────────────────────── */
function renderMasteryOverview() {
  const grid = document.getElementById('mastery-overview-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(ANALYTICS_DATA.subjects).map(([name, d]) => {
    const cls = masteryClass(d.overall);
    return `
      <div class="mastery-mini-card ${name === activeSubject ? 'selected' : ''}" data-subject="${name}"
           onclick="selectSubjectCard('${name}')">
        <div class="m-icon">${d.icon}</div>
        ${buildCircleProgress(d.overall, 64, 5)}
        <div class="m-subject">${name}</div>
      </div>`;
  }).join('');
}

function selectSubjectCard(name) {
  activeSubject = name;
  document.querySelectorAll('.mastery-mini-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.mastery-mini-card[data-subject="${name}"]`).classList.add('selected');
  document.querySelectorAll('.chip[data-subject]').forEach(c => {
    c.classList.toggle('active', c.dataset.subject === name);
  });
  renderSubjectAnalytics(name);
}

/* ── Topic Bars ─────────────────────────────────────────── */
function renderSubjectAnalytics(subject) {
  const d = ANALYTICS_DATA.subjects[subject];
  if (!d) return;

  // Topic bars
  const chartWrap = document.getElementById('topic-chart');
  if (chartWrap) {
    chartWrap.innerHTML = d.topics.map(t => {
      const cls = masteryClass(t.score);
      return `
        <div class="topic-bar-row fade-up">
          <div class="topic-bar-name" title="${t.name}">${t.name}</div>
          <div class="topic-bar-track">
            <div class="topic-bar-fill ${cls}" style="width:${t.score}%"></div>
          </div>
          <div class="topic-bar-pct ${cls}">${t.score}%</div>
        </div>`;
    }).join('');
  }

  // Trend chart
  const canvas = document.getElementById('trend-canvas');
  if (canvas) {
    setTimeout(() => drawLineChart(canvas, d.trend.labels, d.trend.data), 50);
  }

  // Subject heading
  const heading = document.getElementById('subject-heading');
  if (heading) heading.textContent = `${d.icon} ${subject} — Topic Mastery`;
}

/* ── Session History ────────────────────────────────────── */
function renderSessionHistory() {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;
  const colors = { Mathematics: 'accent', 'English Language': 'green', Biology: 'gold', Chemistry: 'amber', Physics: 'red' };
  tbody.innerHTML = ANALYTICS_DATA.sessions.map(s => `
    <tr>
      <td>${fmtDate(s.date)}</td>
      <td><span class="badge badge-${colors[s.subject] || 'accent'}">${s.subject}</span></td>
      <td>${s.year}</td>
      <td><strong>${s.score}%</strong></td>
      <td><span class="badge badge-green">${s.mastery_change}</span></td>
    </tr>`).join('');
}

/* ── Weak Areas ─────────────────────────────────────────── */
function renderWeakAreas() {
  const list = document.getElementById('weak-areas-list');
  if (!list) return;

  // Gather all topics sorted by score ascending
  const all = [];
  Object.entries(ANALYTICS_DATA.subjects).forEach(([sub, d]) => {
    d.topics.forEach(t => all.push({ ...t, subject: sub }));
  });
  all.sort((a, b) => a.score - b.score);
  const top5 = all.slice(0, 5);

  list.innerHTML = top5.map((t, i) => `
    <div class="focus-area-item">
      <div class="fa-rank">${i + 1}</div>
      <div class="fa-info">
        <div class="fa-name">${t.name}</div>
        <div class="fa-sub">${t.subject}</div>
      </div>
      <div class="fa-score">${t.score}%</div>
    </div>`).join('');
}
