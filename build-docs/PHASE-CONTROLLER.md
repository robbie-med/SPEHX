# Phase Controller — SPEX Webapp Build

**Status tracking document. Update this file as each task completes.**

---

## Current Status

```
Phase 1: PDF Extraction         [ ] NOT STARTED
Phase 2: Explanation Generation [ ] BLOCKED (needs Phase 1)
Phase 3: Frontend App           [ ] BLOCKED (needs Phase 2)
Phase 4: Deployment             [ ] BLOCKED (needs Phase 3)
```

---

## Phase 1 — PDF Extraction

**Gate:** Phase 2 cannot start until all Phase 1 tasks are marked complete.

### Setup
- [ ] `cd scripts && npm install` — install pdf-parse, pdf2pic, sharp, @anthropic-ai/sdk
- [ ] Confirm `scripts/node_modules/` exists and no install errors

### Render-Only Pass (crop coordinate measurement)
- [ ] `node extract-pdf.js --render-only` — renders 6 pages to `scripts/renders/`
- [ ] Open `scripts/renders/page.3.png` — locate chest X-ray, record crop coords
- [ ] Open `scripts/renders/page.5.png` — locate fundoscopic image, record crop coords
- [ ] Open `scripts/renders/page.16.png` — locate 12-lead ECG, record crop coords
- [ ] Open `scripts/renders/page.19.png` — locate pedigree diagram, record crop coords
- [ ] Open `scripts/renders/page.22.png` — locate urinary sediment (upper) and ECG strip (lower), record coords for both
- [ ] Open `scripts/renders/page.24.png` — locate lip lesion photo, record crop coords
- [ ] Update `IMAGE_MAP` crop values in `extract-pdf.js` with measured coordinates

### Full Extraction Run
- [ ] `node extract-pdf.js` — runs full pipeline
- [ ] No fatal errors in console output
- [ ] `docs/data/questions.json` created
- [ ] `docs/images/` contains exactly 7 PNG files:
  - [ ] `q07-chest-xray.png`
  - [ ] `q13-fundoscopic.png`
  - [ ] `q51-ecg-12lead.png`
  - [ ] `q61-pedigree.png`
  - [ ] `q71-urinary-sediment.png`
  - [ ] `q73-ecg-strip.png`
  - [ ] `q77-lip-lesion.png`

### Validation
- [ ] `questions.json` has exactly 86 questions
  - Run: `node -e "const d=JSON.parse(require('fs').readFileSync('docs/data/questions.json','utf8'));console.log(d.questions.length)"`
  - Expected: `86`
- [ ] Spot-check Q1 — full question text present
- [ ] Spot-check Q7 — `imageFile: "q07-chest-xray.png"` present
- [ ] Spot-check Q3 — `setVignette` is a non-empty string, `setId: "set-03-04"`
- [ ] Spot-check Q4 — `setVignette: null`, `setId: "set-03-04"`
- [ ] Spot-check Q43 — last of Block 1, `block: 1`
- [ ] Spot-check Q44 — first of Block 2, `block: 2`
- [ ] Spot-check Q86 — `correctAnswer: "B"`

### Manual Fixes
- [ ] Identify all lab-table questions — compare JSON vs PDF for mangled formatting
- [ ] Fix lab table questions using `<pre>` tags in `questionText`
- [ ] Fix special character encoding (en dashes, degree symbols, Greek letters, subscripts)
- [ ] All explanations are `""` (empty strings) — confirm Phase 2 is needed

**Phase 1 Complete:** [ ]  
**Date completed:** ___________

---

## Phase 2 — Explanation Generation

**Gate:** Phase 3 cannot start until all Phase 2 tasks are marked complete.

### Setup
- [ ] `ANTHROPIC_API_KEY` environment variable set: `export ANTHROPIC_API_KEY=sk-ant-...`
- [ ] Confirm key works: `node -e "import('@anthropic-ai/sdk').then(m=>console.log('SDK OK'))"`

### Generation Run
- [ ] `node generate-explanations.js`
- [ ] Script runs to completion without fatal errors
- [ ] Console shows `86 generated, 0 failed`
- [ ] If any failures: re-run script (it resumes automatically)

### Validation
- [ ] No empty explanations remain:
  - Run: `node -e "const d=JSON.parse(require('fs').readFileSync('docs/data/questions.json','utf8'));const m=d.questions.filter(q=>Object.values(q.explanations).some(e=>!e));console.log(m.length===0?'All OK':m.map(q=>q.id))"`
  - Expected: `All OK`
- [ ] Manual quality review — read explanations for:
  - [ ] Q1 — general medicine question, verify clinical accuracy
  - [ ] Q7 — image question (TB), verify image description was used
  - [ ] Q3 — set vignette question (elder patient), verify set context reflected
  - [ ] Q13 — image question (diabetic retinopathy), verify image desc used
  - [ ] Any question you know clinically — verify correct answer explanation is correct
- [ ] Fix any clinically incorrect explanations directly in `questions.json`

**Phase 2 Complete:** [ ]  
**Date completed:** ___________

---

## Phase 3 — Frontend App

**Gate:** Phase 4 cannot start until all Phase 3 tasks are marked complete.

### File Creation
- [ ] `docs/index.html` created (from PHASE-3-FRONTEND.md)
- [ ] `docs/style.css` created (from PHASE-3-FRONTEND.md)
- [ ] `docs/app.js` created (from PHASE-3-FRONTEND.md)

### Local Dev Server
- [ ] `cd docs && python3 -m http.server 8080` — server starts without error
- [ ] `http://localhost:8080` opens in browser — no blank page, no 404

### Core Functionality Tests
- [ ] Q1 displays with question number, stem, and 5 choice buttons
- [ ] Clicking correct answer: chosen button turns green, explanation appears
- [ ] Clicking wrong answer: chosen button turns red, correct button turns green, both explanations appear
- [ ] Other 3 choices remain neutral (no color)
- [ ] Score display updates: `Score: 1/1 (100%)` after correct first answer
- [ ] Progress bar visually advances after answering
- [ ] Refresh page → same question shown, score retained, answered questions still marked

### Navigation Tests
- [ ] "Previous" button is disabled on Q1
- [ ] Click "Next" → Q2 displays
- [ ] Click "Previous" → Q1 displays with prior answer state intact
- [ ] Navigate to Q86 → "Next" button is disabled
- [ ] Navigate across all 86 questions using "Next" (can skim — just verify no errors)

### Set Vignette Tests
- [ ] Navigate to Q3: set header "Items 3–4" and vignette text appear above question stem
- [ ] Navigate to Q4: same set header and vignette appear, label shows "Items 3–4 (continued)"
- [ ] Navigate back to Q4 from Q5: vignette still appears (tests backward navigation)
- [ ] Navigate to Q9 and Q10: set "Items 9–10" vignette appears on both

### Image Tests
- [ ] Navigate to Q7: chest X-ray image appears above question
- [ ] Image has visible alt text / caption below it
- [ ] Navigate to Q13: fundoscopic image appears
- [ ] Navigate to Q51: 12-lead ECG image appears
- [ ] Navigate to Q61: pedigree image appears
- [ ] Navigate to Q71: urinary sediment image appears
- [ ] Navigate to Q73: ECG strip image appears
- [ ] Navigate to Q77: lip lesion image appears
- [ ] All images load (no broken image icons)

### Show-All Toggle Test
- [ ] Answer Q2 (wrong answer)
- [ ] Only 2 explanations visible (chosen + correct)
- [ ] Click "Show all explanations ▼" → all 5 explanations visible
- [ ] Button text changes to "Hide extra explanations ▲"
- [ ] Click again → returns to 2 explanations visible

### Reset Test
- [ ] Answer several questions
- [ ] Click "Reset Progress"
- [ ] Confirm dialog appears
- [ ] Click Cancel → state unchanged
- [ ] Click "Reset Progress" again → click OK
- [ ] Returns to Q1, score shows "0/0 (—)", all choices un-highlighted
- [ ] Refresh page → still at Q1 with clean state

### Console Error Check
- [ ] Open DevTools → Console
- [ ] Navigate through Q1–Q10 answering questions
- [ ] Zero JavaScript errors in console

**Phase 3 Complete:** [ ]  
**Date completed:** ___________

---

## Phase 4 — GitHub Pages Deployment

### Pre-Deploy
- [ ] `.gitignore` created (excludes `node_modules`, `renders`, `.env`)
- [ ] `git init && git branch -M main` in project root
- [ ] GitHub repo created (public)
- [ ] All files staged and committed (see PHASE-4-DEPLOY.md for file list)
- [ ] `git push -u origin main` — push succeeds

### Pages Configuration
- [ ] GitHub Pages enabled: Settings → Pages → Source: main branch, /docs folder
- [ ] "Your site is ready to be published" / "Your site is live" message appears

### Live Site Verification (wait ~60 seconds after push)
- [ ] `https://[USERNAME].github.io/SPEHX/` loads — not 404
- [ ] Q1 renders correctly
- [ ] Answer a question — feedback appears
- [ ] Score updates
- [ ] Navigate to Q7 — chest X-ray image loads
- [ ] Refresh at Q7 — returns to Q7 with answer state intact
- [ ] Open DevTools → Console — zero errors

**Phase 4 Complete:** [ ]  
**Date completed:** ___________

---

## Final Sign-Off

- [ ] All 4 phases complete
- [ ] Live URL confirmed working: `https://[USERNAME].github.io/SPEHX/`
- [ ] CLAUDE.md updated with final project description and local run instructions

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-16 | Vanilla JS, no framework | Solo study tool; simplicity >> DX overhead |
| 2026-04-16 | `/docs` folder on `main` branch for Pages | No Actions workflow needed |
| 2026-04-16 | Hardcode answer key in script | Answer key read directly from PDF p.29 |
| 2026-04-16 | `pdf2pic` + `sharp` for image extraction | More reliable than PDF internal object stream parsing |
| 2026-04-16 | Claude API for explanations | One-time generation, committed to JSON, ~$0.20 |
| 2026-04-16 | `localStorage` for progress | No backend; appropriate for single-user tool |
| 2026-04-16 | `questionText` inserted via innerHTML | Contains authored `<pre>/<sub>/<sup>` tags — not user input |

---

## Issues / Blockers Log

| Date | Issue | Resolution | Status |
|------|-------|------------|--------|
| — | — | — | — |
