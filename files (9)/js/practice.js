/* =========================================================
   RBAPS — Practice Session JS
   ========================================================= */

/* ────────────────────────────────────────────────────────
   DEMO DATA  (Replace with PHP/MySQL fetch calls later)
   ──────────────────────────────────────────────────────── */
const DEMO_QUESTIONS = [
  {
    id: 1, topic: 'Quadratic Equations',
    text: 'Find the roots of the equation 2x² − 5x + 3 = 0.',
    options: ['x = 1 or x = 1.5', 'x = −1 or x = 3', 'x = 2 or x = −1.5', 'x = 0 or x = 2.5'],
    answer: 0, explanation: 'Using the quadratic formula or factorisation: 2x² − 5x + 3 = (2x − 3)(x − 1) = 0, giving x = 3/2 and x = 1.'
  },
  {
    id: 2, topic: 'Algebra — Indices',
    text: 'Simplify: 8^(2/3)',
    options: ['2', '4', '6', '8'],
    answer: 1, explanation: '8^(2/3) = (8^(1/3))² = 2² = 4.'
  },
  {
    id: 3, topic: 'Statistics',
    text: 'The mean of five numbers is 12. If four of the numbers are 10, 14, 8, and 16, find the fifth number.',
    options: ['10', '12', '13', '11'],
    answer: 1, explanation: 'Sum = 5 × 12 = 60. Known sum = 10+14+8+16 = 48. Fifth = 60 − 48 = 12.'
  },
  {
    id: 4, topic: 'Trigonometry',
    text: 'If sin θ = 3/5 and θ is acute, find cos θ.',
    options: ['4/5', '3/4', '5/3', '5/4'],
    answer: 0, explanation: 'Using Pythagoras: cos θ = √(1 − sin²θ) = √(1 − 9/25) = √(16/25) = 4/5.'
  },
  {
    id: 5, topic: 'Number Systems',
    text: 'Convert 0.375 to a fraction in its lowest terms.',
    options: ['3/8', '3/9', '5/8', '3/16'],
    answer: 0, explanation: '0.375 = 375/1000. Divide by GCD 125: 3/8.'
  },
  {
    id: 6, topic: 'Sequence & Series',
    text: 'The 5th term of an arithmetic progression is 20 and the 2nd term is 8. Find the common difference.',
    options: ['4', '3', '5', '6'],
    answer: 0, explanation: 'a + 4d = 20 and a + d = 8. Subtracting: 3d = 12 ⟹ d = 4.'
  },
  {
    id: 7, topic: 'Geometry — Circle',
    text: 'A chord is 8 cm long and is 3 cm from the centre of a circle. What is the radius?',
    options: ['5 cm', '4 cm', '6 cm', '7 cm'],
    answer: 0, explanation: 'The perpendicular from centre bisects the chord, so the right triangle has legs 4 cm and 3 cm. r = √(4² + 3²) = √25 = 5 cm.'
  },
  {
    id: 8, topic: 'Logarithms',
    text: 'Evaluate: log₂ 64',
    options: ['8', '6', '5', '7'],
    answer: 1, explanation: '2⁶ = 64, so log₂ 64 = 6.'
  },
  {
    id: 9, topic: 'Probability',
    text: 'A bag contains 3 red and 5 blue balls. One ball is picked at random. What is the probability that it is red?',
    options: ['3/8', '5/8', '3/5', '1/3'],
    answer: 0, explanation: 'P(red) = 3 / (3 + 5) = 3/8.'
  },
  {
    id: 10, topic: 'Sets',
    text: 'If n(A) = 15, n(B) = 10, and n(A ∩ B) = 5, find n(A ∪ B).',
    options: ['20', '25', '30', '10'],
    answer: 0, explanation: 'n(A ∪ B) = n(A) + n(B) − n(A ∩ B) = 15 + 10 − 5 = 20.'
  },
];

/* ────────────────────────────────────────────────────────
   STATE
   ──────────────────────────────────────────────────────── */
const state = {
  questions: [],
  current:   0,
  answers:   [],    // null | index
  submitted: [],    // bool
  startTime: null,
  timerID:   null,
  phase:     'setup',  // 'setup' | 'session' | 'results'
  selectedSubject: null,
  selectedYear:    null,
};

/* ────────────────────────────────────────────────────────
   SETUP PHASE
   ──────────────────────────────────────────────────────── */
function initSetup() {
  // Subject buttons
  document.querySelectorAll('.subject-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subject-select-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedSubject = btn.dataset.subject;
    });
  });

  // Year buttons
  document.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedYear = btn.dataset.year;
    });
  });

  // Start button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (!state.selectedSubject) { showToast('Please select a subject first', 'error'); return; }
      if (!state.selectedYear)    { showToast('Please select a year', 'error'); return; }
      beginSession();
    });
  }
}

/* ────────────────────────────────────────────────────────
   SESSION PHASE
   ──────────────────────────────────────────────────────── */
function beginSession() {
  // In real implementation, fetch questions from PHP API:
  // fetch(`api/questions.php?subject=${state.selectedSubject}&year=${state.selectedYear}`)
  //   .then(r => r.json()).then(data => { state.questions = data; renderSession(); });

  // Demo: use local questions
  state.questions = [...DEMO_QUESTIONS];
  state.answers   = new Array(state.questions.length).fill(null);
  state.submitted = new Array(state.questions.length).fill(false);
  state.current   = 0;
  state.phase     = 'session';
  state.startTime = Date.now();

  document.getElementById('setup-section').classList.add('hidden');
  document.getElementById('session-section').classList.remove('hidden');

  updateTopbar();
  renderQuestion();
  renderQDots();
  startTimer();
}

/* ── Timer ──────────────────────────────────────────────── */
function startTimer() {
  const el = document.getElementById('timer-display');
  state.timerID = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    if (el) el.textContent = `${m}:${s}`;
  }, 1000);
}

/* ── Top Bar ────────────────────────────────────────────── */
function updateTopbar() {
  const subEl = document.getElementById('tb-subject');
  const yrEl  = document.getElementById('tb-year');
  const totEl = document.getElementById('tb-total');
  if (subEl) subEl.textContent = state.selectedSubject;
  if (yrEl)  yrEl.textContent  = state.selectedYear;
  if (totEl) totEl.textContent = state.questions.length;
}

/* ── Question Render ────────────────────────────────────── */
function renderQuestion() {
  const q    = state.questions[state.current];
  const i    = state.current;
  const done = state.submitted[i];

  // Header
  document.getElementById('q-num-badge').textContent = `Q ${i + 1}`;
  document.getElementById('q-topic-tag').textContent = q.topic;

  // Text
  document.getElementById('question-text').textContent = q.text;

  // Options
  const optList = document.getElementById('options-list');
  const labels  = ['A', 'B', 'C', 'D'];
  optList.innerHTML = q.options.map((opt, oi) => {
    let cls = 'option-item';
    if (done) {
      cls += ' disabled';
      if (oi === q.answer)              cls += ' correct';
      else if (oi === state.answers[i]) cls += ' wrong';
    } else if (oi === state.answers[i]) cls += ' selected';
    return `
      <div class="${cls}" data-index="${oi}">
        <div class="option-label">${labels[oi]}</div>
        <div class="option-text">${opt}</div>
      </div>`;
  }).join('');

  // Bind option clicks
  if (!done) {
    optList.querySelectorAll('.option-item').forEach(el => {
      el.addEventListener('click', () => selectOption(parseInt(el.dataset.index)));
    });
  }

  // Feedback
  const fb = document.getElementById('feedback-panel');
  if (done) {
    const correct = state.answers[i] === q.answer;
    fb.className = `feedback-panel ${correct ? 'correct' : 'wrong'}`;
    fb.innerHTML = `
      <div class="feedback-icon">${correct ? '✅' : '❌'}</div>
      <div class="feedback-content">
        <div class="feedback-verdict">${correct ? 'Correct!' : 'Incorrect'}</div>
        <div class="feedback-explain">${q.explanation}</div>
        ${!correct ? `<div class="feedback-correct-ans">Correct answer: <strong>${labels[q.answer]}. ${q.options[q.answer]}</strong></div>` : ''}
      </div>`;
    fb.classList.remove('hidden');
  } else {
    fb.classList.add('hidden');
  }

  // Submit / Next button
  const submitBtn = document.getElementById('submit-btn');
  const nextBtn   = document.getElementById('next-btn');
  const prevBtn   = document.getElementById('prev-btn');
  if (done) {
    submitBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    nextBtn.textContent = i === state.questions.length - 1 ? 'Finish Session' : 'Next Question →';
  } else {
    submitBtn.classList.remove('hidden');
    nextBtn.classList.add('hidden');
  }
  prevBtn.disabled = i === 0;

  // Progress strip
  const progPct  = ((i + 1) / state.questions.length) * 100;
  const stripFill = document.querySelector('.strip-bar .progress-bar-fill');
  const stripCnt  = document.getElementById('strip-count');
  if (stripFill) stripFill.style.width = progPct + '%';
  if (stripCnt)  stripCnt.textContent = `${i + 1} / ${state.questions.length}`;

  renderQDots();
}

function selectOption(idx) {
  state.answers[state.current] = idx;
  renderQuestion();
}

/* ── Submit ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submit-btn');
  const nextBtn   = document.getElementById('next-btn');
  const prevBtn   = document.getElementById('prev-btn');

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (state.answers[state.current] === null) { showToast('Please select an answer', 'error'); return; }
      state.submitted[state.current] = true;
      renderQuestion();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.current === state.questions.length - 1) {
        endSession();
      } else {
        state.current++;
        renderQuestion();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.current > 0) { state.current--; renderQuestion(); }
    });
  }

  initSetup();
});

/* ── Q Dots ─────────────────────────────────────────────── */
function renderQDots() {
  const grid = document.getElementById('q-dot-grid');
  if (!grid) return;
  grid.innerHTML = state.questions.map((q, i) => {
    let cls = 'q-dot';
    if (i === state.current) cls += ' current';
    else if (state.submitted[i]) {
      cls += state.answers[i] === q.answer ? ' answered' : ' wrong';
    }
    return `<div class="${cls}" data-qi="${i}">${i + 1}</div>`;
  }).join('');
  grid.querySelectorAll('.q-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      state.current = parseInt(dot.dataset.qi);
      renderQuestion();
    });
  });
}

/* ── End Session ────────────────────────────────────────── */
function endSession() {
  clearInterval(state.timerID);
  state.phase = 'results';

  const total   = state.questions.length;
  const correct = state.questions.reduce((acc, q, i) => acc + (state.submitted[i] && state.answers[i] === q.answer ? 1 : 0), 0);
  const skipped = state.questions.reduce((acc, _, i) => acc + (!state.submitted[i] ? 1 : 0), 0);
  const wrong   = total - correct - skipped;
  const pct     = Math.round((correct / total) * 100);
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const mm = Math.floor(elapsed/60), ss = elapsed % 60;

  document.getElementById('session-section').classList.add('hidden');
  const results = document.getElementById('results-section');
  results.classList.remove('hidden');

  // Score
  document.getElementById('r-score').textContent = pct + '%';
  document.getElementById('r-correct').textContent = correct;
  document.getElementById('r-wrong').textContent   = wrong;
  document.getElementById('r-skipped').textContent = skipped;
  document.getElementById('r-time').textContent    = `${mm}m ${ss}s`;
  document.getElementById('r-heading').textContent = pct >= 80 ? 'Excellent Work! 🎉' : pct >= 60 ? 'Good Progress! 👍' : 'Keep Practising! 💪';
  document.getElementById('r-msg').textContent     = pct >= 80 ? 'You have mastered this section.' : pct >= 60 ? 'You are developing well. Review the missed questions.' : 'Focus on the weak areas and try again.';

  // Retry button
  document.getElementById('retry-btn').addEventListener('click', () => {
    results.classList.add('hidden');
    document.getElementById('setup-section').classList.remove('hidden');
    state.phase = 'setup';
  });
}
