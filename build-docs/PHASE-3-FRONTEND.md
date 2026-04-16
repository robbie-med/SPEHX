# Phase 3 — Frontend Application

**Output:** `docs/index.html`, `docs/style.css`, `docs/app.js`  
**Prerequisite:** Phase 2 complete. `docs/data/questions.json` has all 86 questions with explanations. `docs/images/` has all 7 PNG files.  
**Stack:** Vanilla HTML5 + CSS3 + ES Modules. Zero runtime dependencies.  
**Test:** `cd docs && python3 -m http.server 8080` → open `http://localhost:8080`

---

## UI Layout Spec

```
┌─────────────────────────────────────────────────────────┐
│  SPEX Practice Test               Score: 42/68 (62%)   │  ← header (sticky)
│  [████████████████░░░░░░░░░░░]  Q 69 of 86            │  ← progress bar
│  [Reset Progress]                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌ Items 67–68 ──────────────────────────────────────┐ │  ← set header (if applicable)
│  │ A 52-year-old woman is brought to the emergency…  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  Question 68                                            │  ← question number
│                                                         │
│  Which of the following is the most appropriate…       │  ← question stem
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ (A)  Admit the patient to the hospital            │ │  ← choice button (unanswered)
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ (B)  Prescribe oral amoxicillin                   │ │
│  └───────────────────────────────────────────────────┘ │
│       ...                                               │
│                                                         │
│  [← Previous]                              [Next →]    │  ← nav (sticky bottom)
└─────────────────────────────────────────────────────────┘

After answering (correct answer = C, user chose B):

│  ┌─ (A)  Admit the patient ─────────────────────────┐ │  ← neutral (not involved)
│  └───────────────────────────────────────────────────┘ │
│  ┌─ (B)  Prescribe oral amoxicillin ─────────────────┐ │  ← RED (wrong choice)
│  │       Amoxicillin covers typical organisms but…   │ │     explanation shown
│  └───────────────────────────────────────────────────┘ │
│  ┌─ (C)  Start IV vancomycin ─────────────────────────┐ │  ← GREEN (correct)
│  │       CORRECT. The constellation of fever,…       │ │     explanation shown
│  └───────────────────────────────────────────────────┘ │
│  ┌─ (D)  Order blood cultures only ──────────────────┐ │  ← neutral
│  └───────────────────────────────────────────────────┘ │
│  ┌─ (E)  Discharge with follow-up ───────────────────┐ │  ← neutral
│  └───────────────────────────────────────────────────┘ │
│  [Show all explanations ▼]                             │  ← toggle
```

---

## Color Design Tokens

```css
:root {
  /* Palette */
  --color-bg:           #f8f9fa;
  --color-surface:      #ffffff;
  --color-border:       #dee2e6;
  --color-text:         #212529;
  --color-text-muted:   #6c757d;

  /* Interactive */
  --color-primary:      #0d6efd;
  --color-primary-hover:#0b5ed7;

  /* Feedback */
  --color-correct-bg:   #d1e7dd;
  --color-correct-border:#198754;
  --color-correct-text: #0f5132;
  --color-incorrect-bg: #f8d7da;
  --color-incorrect-border:#dc3545;
  --color-incorrect-text:#842029;

  /* Set vignette */
  --color-set-bg:       #e7f1ff;
  --color-set-border:   #b6d4fe;

  /* Typography */
  --font-body:          'Georgia', serif;
  --font-ui:            system-ui, -apple-system, sans-serif;
  --font-size-base:     17px;
  --font-size-sm:       14px;
  --line-height:        1.7;

  /* Layout */
  --max-width:          800px;
  --spacing-xs:         4px;
  --spacing-sm:         8px;
  --spacing-md:         16px;
  --spacing-lg:         24px;
  --spacing-xl:         32px;
  --border-radius:      8px;
}
```

---

## `docs/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SPEX Practice Test</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <header id="app-header">
    <div id="header-top">
      <h1>SPEX Practice Test</h1>
      <div id="score-display" aria-live="polite">Score: 0/0</div>
    </div>
    <div id="progress-track">
      <div id="progress-fill"></div>
    </div>
    <div id="header-bottom">
      <span id="question-counter">Question 1 of 86</span>
      <button id="reset-btn" class="btn btn-ghost">Reset Progress</button>
    </div>
  </header>

  <main id="question-area">
    <div id="loading">Loading questions…</div>
  </main>

  <footer id="app-nav">
    <button id="prev-btn" class="btn btn-secondary" disabled>← Previous</button>
    <button id="next-btn" class="btn btn-primary">Next →</button>
  </footer>

  <script type="module" src="app.js"></script>
</body>
</html>
```

---

## `docs/style.css`

```css
/* ── Reset & Base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --color-bg:               #f8f9fa;
  --color-surface:          #ffffff;
  --color-border:           #dee2e6;
  --color-text:             #212529;
  --color-text-muted:       #6c757d;
  --color-primary:          #0d6efd;
  --color-primary-hover:    #0b5ed7;
  --color-correct-bg:       #d1e7dd;
  --color-correct-border:   #198754;
  --color-correct-text:     #0f5132;
  --color-incorrect-bg:     #f8d7da;
  --color-incorrect-border: #dc3545;
  --color-incorrect-text:   #842029;
  --color-set-bg:           #e7f1ff;
  --color-set-border:       #b6d4fe;
  --font-body:              Georgia, 'Times New Roman', serif;
  --font-ui:                system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-base:         17px;
  --font-size-sm:           14px;
  --line-height:            1.75;
  --max-width:              800px;
  --radius:                 8px;
}

html { font-size: var(--font-size-base); }

body {
  font-family: var(--font-body);
  font-size:   var(--font-size-base);
  line-height: var(--line-height);
  color:       var(--color-text);
  background:  var(--color-bg);
  padding-bottom: 80px; /* clearance for sticky footer */
}

/* ── Header ── */
#app-header {
  position:   sticky;
  top:        0;
  z-index:    100;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding:    12px 16px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

#header-top {
  display:         flex;
  justify-content: space-between;
  align-items:     baseline;
  margin-bottom:   8px;
}

#app-header h1 {
  font-family: var(--font-ui);
  font-size:   18px;
  font-weight: 700;
  color:       var(--color-text);
}

#score-display {
  font-family: var(--font-ui);
  font-size:   var(--font-size-sm);
  font-weight: 600;
  color:       var(--color-text);
}

/* Progress bar */
#progress-track {
  height:        6px;
  background:    var(--color-border);
  border-radius: 3px;
  overflow:      hidden;
  margin-bottom: 8px;
}

#progress-fill {
  height:     100%;
  width:      0%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

#header-bottom {
  display:         flex;
  justify-content: space-between;
  align-items:     center;
  padding-bottom:  10px;
}

#question-counter {
  font-family: var(--font-ui);
  font-size:   var(--font-size-sm);
  color:       var(--color-text-muted);
}

/* ── Main Question Area ── */
#question-area {
  max-width: var(--max-width);
  margin:    0 auto;
  padding:   24px 16px;
}

/* Set vignette */
.set-header {
  background:    var(--color-set-bg);
  border:        1px solid var(--color-set-border);
  border-radius: var(--radius);
  padding:       16px 20px;
  margin-bottom: 20px;
}

.set-label {
  font-family:   var(--font-ui);
  font-size:     var(--font-size-sm);
  font-weight:   700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color:         var(--color-primary);
  margin-bottom: 8px;
}

.set-vignette {
  font-style: italic;
  color:      var(--color-text);
}

/* Question image */
.question-image {
  margin:        0 0 20px;
  text-align:    center;
}

.question-image img {
  max-width:     100%;
  max-height:    400px;
  object-fit:    contain;
  border:        1px solid var(--color-border);
  border-radius: var(--radius);
}

.question-image figcaption {
  font-family: var(--font-ui);
  font-size:   var(--font-size-sm);
  color:       var(--color-text-muted);
  margin-top:  6px;
  font-style:  italic;
}

/* Question number + stem */
.question-number {
  font-family: var(--font-ui);
  font-size:   var(--font-size-sm);
  font-weight: 600;
  color:       var(--color-text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.question-stem {
  font-size:     var(--font-size-base);
  line-height:   var(--line-height);
  margin-bottom: 20px;
  color:         var(--color-text);
}

.question-stem pre {
  background:    #f4f4f4;
  border:        1px solid var(--color-border);
  border-radius: 4px;
  padding:       10px 14px;
  margin:        10px 0;
  font-size:     var(--font-size-sm);
  overflow-x:    auto;
  white-space:   pre;
}

/* ── Answer Choices ── */
.choices {
  display:        flex;
  flex-direction: column;
  gap:            10px;
  margin-bottom:  16px;
}

.choice-btn {
  display:       block;
  width:         100%;
  text-align:    left;
  background:    var(--color-surface);
  border:        2px solid var(--color-border);
  border-radius: var(--radius);
  padding:       12px 16px;
  cursor:        pointer;
  font-family:   var(--font-body);
  font-size:     var(--font-size-base);
  line-height:   var(--line-height);
  color:         var(--color-text);
  transition:    border-color 0.15s, background 0.15s;
}

.choice-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  background:   #f0f6ff;
}

.choice-btn:disabled {
  cursor: default;
}

/* Choice label "(A)" */
.choice-letter {
  font-family: var(--font-ui);
  font-weight: 700;
  margin-right: 8px;
  color:       var(--color-text-muted);
}

/* Answered states */
.choice-btn.correct {
  background:    var(--color-correct-bg);
  border-color:  var(--color-correct-border);
  color:         var(--color-correct-text);
}

.choice-btn.correct .choice-letter {
  color: var(--color-correct-border);
}

.choice-btn.incorrect {
  background:    var(--color-incorrect-bg);
  border-color:  var(--color-incorrect-border);
  color:         var(--color-incorrect-text);
}

.choice-btn.incorrect .choice-letter {
  color: var(--color-incorrect-border);
}

/* Explanation text */
.explanation {
  margin-top:  10px;
  padding-top: 10px;
  border-top:  1px solid currentColor;
  opacity:     0.85;
  font-size:   calc(var(--font-size-base) - 1px);
  line-height: 1.6;
}

/* Hidden explanations (for choices not selected and not correct) */
.choice-btn.answered-other .explanation {
  display: none;
}

.choice-btn.answered-other.show-all .explanation {
  display: block;
}

/* Show-all toggle */
#show-all-btn {
  font-family: var(--font-ui);
  font-size:   var(--font-size-sm);
  color:       var(--color-primary);
  background:  none;
  border:      none;
  cursor:      pointer;
  padding:     4px 0;
  text-decoration: underline;
}

#show-all-btn:hover {
  color: var(--color-primary-hover);
}

/* ── Footer Nav ── */
#app-nav {
  position:        fixed;
  bottom:          0;
  left:            0;
  right:           0;
  display:         flex;
  justify-content: space-between;
  padding:         12px 20px;
  background:      var(--color-surface);
  border-top:      1px solid var(--color-border);
  box-shadow:      0 -2px 8px rgba(0,0,0,0.06);
  max-width:       100%;
}

/* ── Buttons ── */
.btn {
  font-family: var(--font-ui);
  font-size:   var(--font-size-sm);
  font-weight: 600;
  padding:     8px 18px;
  border-radius: calc(var(--radius) - 2px);
  border:      2px solid transparent;
  cursor:      pointer;
  transition:  background 0.15s, color 0.15s, border-color 0.15s;
}

.btn:disabled {
  opacity: 0.4;
  cursor:  not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color:      #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background:   var(--color-surface);
  color:        var(--color-text);
  border-color: var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg);
}

.btn-ghost {
  background:  none;
  color:       var(--color-text-muted);
  font-size:   var(--font-size-sm);
  font-weight: 400;
  padding:     4px 8px;
}

.btn-ghost:hover {
  color: var(--color-incorrect-border);
}

/* ── Loading state ── */
#loading {
  text-align:  center;
  color:       var(--color-text-muted);
  padding:     60px 0;
  font-family: var(--font-ui);
}

/* ── Mobile ── */
@media (max-width: 600px) {
  :root { --font-size-base: 16px; }

  #app-header h1 { font-size: 15px; }

  .choice-btn { padding: 10px 12px; }

  #app-nav { padding: 10px 12px; }
}
```

---

## `docs/app.js`

```js
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
```

---

## Security Notes

- `questionText` is inserted with `innerHTML` because it may contain `<pre>`, `<sub>`, `<sup>` tags added during the Phase 1 manual fix pass. This is acceptable because `questions.json` is authored by us, not user-submitted content.
- All other user-visible strings (choice text, explanations, set vignettes) are escaped through `escapeHtml()` before insertion.
- No user input is ever written to the DOM without escaping.
- `localStorage` data is parsed with a try/catch and validated before use.

---

## Interaction Behavior Specification

| Trigger | Behavior |
|---------|----------|
| Click unanswered choice | Records answer in `state.answers`; saves to localStorage; re-renders with feedback; updates score |
| Click answered choice | No-op (button is `disabled`) |
| Click "Show all explanations" | Reveals explanation text on all 5 choices; button text changes to "Hide extra explanations ▲" |
| Click "Hide extra explanations ▲" | Collapses explanations to only correct + chosen; button text reverts |
| Click "Previous" | Decrements `currentIndex`; re-renders; saves; scrolls to top |
| Click "Next" | Increments `currentIndex`; re-renders; saves; scrolls to top |
| Click "Reset Progress" | Shows `confirm()` dialog; if confirmed, clears state; re-renders Q1 |
| Page refresh | `loadState()` restores `answers` and `currentIndex`; renders the last-viewed question |
| Previous disabled when | `currentIndex === 0` |
| Next disabled when | `currentIndex === questions.length - 1` |

---

## Test Checklist

Run `cd docs && python3 -m http.server 8080` and verify:

- [ ] Q1 displays with question text and 5 choices
- [ ] Clicking a wrong answer turns that choice red and correct answer green
- [ ] Explanation appears under the selected (wrong) choice and under the correct choice
- [ ] "Show all explanations" reveals explanations on neutral choices; button toggles correctly
- [ ] Score display updates: if first answer is correct, shows "1/1 (100%)"
- [ ] Progress bar visually advances after each answer
- [ ] Refresh page → returns to same question with answers intact and score restored
- [ ] Q3 (first of set): set vignette header appears above question stem
- [ ] Q4 (second of set): same set vignette appears (sourced from Q3's data); label says "Items 3–4 (continued)"
- [ ] Navigate to Q7 → chest X-ray image appears above question
- [ ] Image has alt text and caption
- [ ] Navigate to Q13 → fundoscopic image appears
- [ ] Reset → confirm dialog appears; confirming returns to Q1 with score 0/0
- [ ] Reset → cancelling leaves state unchanged
- [ ] Previous button disabled on Q1
- [ ] Next button disabled on Q86
- [ ] All 86 questions accessible via Next navigation
- [ ] No console errors throughout
