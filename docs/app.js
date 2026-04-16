// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'spex-v1-progress';

/**
 * @type {{ answers: Record<number, string>, currentIndex: number }}
 * answers: maps question.id → chosen letter (e.g. {7: "C", 12: "A"})
 * currentIndex: 0-based index into questions array
 */
let state = {
  answers:      {},
  currentIndex: 0,
};

// Global questions array, populated after fetch
let questions = [];

// ─────────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate structure before trusting it
      if (parsed && typeof parsed.answers === 'object' && typeof parsed.currentIndex === 'number') {
        state = parsed;
      }
    }
  } catch {
    // Corrupt localStorage — start fresh
    state = { answers: {}, currentIndex: 0 };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetState() {
  if (!confirm('Reset all progress? Your answers and score will be cleared.')) return;
  state = { answers: {}, currentIndex: 0 };
  saveState();
  renderQuestion();
  updateHeader();
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  loadState();

  const res = await fetch('./data/questions.json');
  if (!res.ok) throw new Error(`Failed to load questions.json: ${res.status}`);
  const data = await res.json();
  questions = data.questions;

  // Clamp currentIndex in case of stale state
  if (state.currentIndex >= questions.length) state.currentIndex = 0;

  // Wire up static event listeners
  document.getElementById('prev-btn').addEventListener('click', navigatePrev);
  document.getElementById('next-btn').addEventListener('click', navigateNext);
  document.getElementById('reset-btn').addEventListener('click', resetState);

  renderQuestion();
  updateHeader();
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

function navigatePrev() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    saveState();
    renderQuestion();
    updateHeader();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function navigateNext() {
  if (state.currentIndex < questions.length - 1) {
    state.currentIndex++;
    saveState();
    renderQuestion();
    updateHeader();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Answer Handling
// ─────────────────────────────────────────────────────────────────────────────

function handleAnswer(question, selectedLetter) {
  // Record answer (only first answer counts — cannot change once answered)
  state.answers[question.id] = selectedLetter;
  saveState();
  renderQuestion();   // re-render with feedback
  updateHeader();
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

function renderQuestion() {
  const q = questions[state.currentIndex];
  const chosenLetter = state.answers[q.id] ?? null;  // null = unanswered
  const isAnswered   = chosenLetter !== null;

  const area = document.getElementById('question-area');
  area.innerHTML = buildQuestionHTML(q, chosenLetter, isAnswered);

  // Attach click handlers to choice buttons (only if unanswered)
  if (!isAnswered) {
    area.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(q, btn.dataset.letter));
    });
  }

  // Attach show-all toggle (only if answered)
  if (isAnswered) {
    const showAllBtn = area.querySelector('#show-all-btn');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', toggleShowAll);
    }
  }

  // Update nav button states
  document.getElementById('prev-btn').disabled = state.currentIndex === 0;
  document.getElementById('next-btn').disabled = state.currentIndex === questions.length - 1;
}

function buildQuestionHTML(q, chosenLetter, isAnswered) {
  let html = '';

  // ── Set vignette ──
  if (q.setId) {
    // Find the set vignette — it's stored on the first question of the set
    const vignette = q.setVignette ?? getSetVignette(q.setId);
    if (vignette) {
      const continued = !q.setVignette ? ' <span class="set-continued">(continued)</span>' : '';
      html += `
        <div class="set-header">
          <div class="set-label">${escapeHtml(q.setLabel)}${continued}</div>
          <p class="set-vignette">${escapeHtml(vignette)}</p>
        </div>`;
    }
  }

  // ── Image ──
  if (q.imageFile) {
    html += `
      <figure class="question-image">
        <img src="images/${escapeAttr(q.imageFile)}" alt="${escapeAttr(q.imageAlt)}" loading="lazy">
        <figcaption>${escapeHtml(q.imageAlt)}</figcaption>
      </figure>`;
  }

  // ── Question number + stem ──
  html += `<div class="question-number">Question ${q.id}</div>`;
  // questionText may contain safe HTML tags (<pre>, <sub>, <sup>) — use innerHTML directly
  // Any HTML in questionText was written by us during the Phase 1 manual fix pass, not user input
  html += `<p class="question-stem">${q.questionText}</p>`;

  // ── Choices ──
  html += '<div class="choices">';
  for (const [letter, text] of Object.entries(q.choices)) {
    html += buildChoiceHTML(letter, text, q, chosenLetter, isAnswered);
  }
  html += '</div>';

  // ── Show-all toggle (post-answer) ──
  if (isAnswered) {
    html += `<button id="show-all-btn">Show all explanations ▼</button>`;
  }

  return html;
}

function buildChoiceHTML(letter, text, q, chosenLetter, isAnswered) {
  const isCorrect  = letter === q.correctAnswer;
  const isChosen   = letter === chosenLetter;
  const isInvolved = isCorrect || isChosen;  // shown after answering

  let cssClass = 'choice-btn';
  if (isAnswered) {
    if (isCorrect)                         cssClass += ' correct';
    else if (isChosen)                     cssClass += ' incorrect';
    else                                   cssClass += ' answered-other';
  }

  const explanation = isAnswered && isInvolved
    ? `<div class="explanation">${escapeHtml(q.explanations[letter])}</div>`
    : isAnswered
      ? `<div class="explanation">${escapeHtml(q.explanations[letter])}</div>` // hidden by CSS, revealed by show-all
      : '';

  return `
    <button
      class="${cssClass}"
      data-letter="${letter}"
      ${isAnswered ? 'disabled' : ''}
      aria-label="Choice ${letter}: ${escapeAttr(text)}"
    >
      <span class="choice-letter">(${letter})</span>${escapeHtml(text)}${explanation}
    </button>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Show All Explanations Toggle
// ─────────────────────────────────────────────────────────────────────────────

function toggleShowAll() {
  const area = document.getElementById('question-area');
  const others = area.querySelectorAll('.choice-btn.answered-other');
  const btn = document.getElementById('show-all-btn');

  const isShowing = others[0]?.classList.contains('show-all');

  others.forEach(el => el.classList.toggle('show-all', !isShowing));
  btn.textContent = isShowing ? 'Show all explanations ▼' : 'Hide extra explanations ▲';
}

// ─────────────────────────────────────────────────────────────────────────────
// Header Update (score + progress bar + counter)
// ─────────────────────────────────────────────────────────────────────────────

function updateHeader() {
  const answeredIds = Object.keys(state.answers).map(Number);
  const answered    = answeredIds.length;

  const correct = answeredIds.filter(id => {
    const q = questions.find(q => q.id === id);
    return q && state.answers[id] === q.correctAnswer;
  }).length;

  const pct = answered === 0 ? '—' : `${Math.round(correct / answered * 100)}%`;

  document.getElementById('score-display').textContent =
    `Score: ${correct}/${answered} (${pct})`;

  document.getElementById('progress-fill').style.width =
    `${(answered / questions.length) * 100}%`;

  document.getElementById('question-counter').textContent =
    `Question ${state.currentIndex + 1} of ${questions.length}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Find the set vignette for a given setId by searching the questions array. */
function getSetVignette(setId) {
  const first = questions.find(q => q.setId === setId && q.setVignette);
  return first?.setVignette ?? null;
}

/** Escape plain text for safe insertion into HTML text nodes. */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Escape value for HTML attribute context. */
function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────

init().catch(err => {
  console.error('SPEX app failed to initialize:', err);
  document.getElementById('question-area').innerHTML =
    `<p style="color:red;padding:20px;">Failed to load questions. Make sure you are running this via a local HTTP server, not file://</p>`;
});