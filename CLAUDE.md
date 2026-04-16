# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A static study webapp for the SPEX (Special Purpose Examination) physician relicensure exam. Users answer 86 multiple-choice clinical vignette questions with immediate feedback, high-yield explanations, and progress tracking. Hosted on GitHub Pages (`/docs` folder) and locally via `python3 -m http.server 8080`.

## Commands

```bash
# Run locally
cd docs && python3 -m http.server 8080     # → http://localhost:8080

# Phase 1: Extract questions and images from PDF (run once)
cd scripts && npm install
node extract-pdf.js --render-only          # render pages to scripts/renders/ for crop measurement
node extract-pdf.js                        # full pipeline → docs/data/questions.json + docs/images/

# Phase 2: Generate explanations via Claude API (run once)
export ANTHROPIC_API_KEY=sk-ant-...
node generate-explanations.js              # fills explanations in questions.json; resumable

# Validate questions.json
node -e "const d=JSON.parse(require('fs').readFileSync('docs/data/questions.json','utf8'));console.log(d.questions.length)"
```

## Architecture

**Data flow:** PDF → `scripts/extract-pdf.js` → `docs/data/questions.json` + `docs/images/*.png` → `scripts/generate-explanations.js` (Claude API) → final `questions.json` → `docs/app.js` (static frontend).

**Frontend** (`docs/`): Three files — `index.html` (shell), `style.css`, `app.js` (ES module). No build step, no npm in deployed app. `app.js` fetches `./data/questions.json` on load. All asset paths are relative so the app works identically on localhost and GitHub Pages.

**State** is a single object `{ answers: {}, currentIndex: 0 }` persisted to `localStorage` under key `spex-v1-progress`. `answers` maps question `id` (number) → chosen letter. Never mutated except by `handleAnswer()` and `resetState()`.

**questions.json schema** — each question has: `id`, `block`, `setId`, `setLabel`, `setVignette` (non-null only on first question of a set), `questionText` (may contain `<pre>/<sub>/<sup>` HTML), `imageFile` (null or filename), `choices` {A–E}, `correctAnswer`, `explanations` {A–E}.

**Set vignettes:** 10 groups of 2 questions share a clinical scenario. `setVignette` is stored on the first question only. `app.js::getSetVignette()` scans the questions array to find it when navigating to subsequent questions in a set.

**Image questions:** Q7, Q13, Q51, Q61, Q71, Q73, Q77. PNGs in `docs/images/`. Cropped from full-page renders (pdf2pic at 300 DPI). Crop coordinates are hardcoded in `IMAGE_MAP` in `extract-pdf.js`.

**Explanation generation:** `generate-explanations.js` calls `claude-sonnet-4-6` once per question. Image questions get a text description (see `IMAGE_DESCRIPTIONS` in the script) instead of the actual image. Script is resumable — skips questions that already have explanations.

## Key Files

| File | Purpose |
|------|---------|
| `build-docs/PHASE-CONTROLLER.md` | Build progress tracker — check here for current status |
| `build-docs/DATA-REFERENCE.md` | Hardcoded answer key, set map, image inventory |
| `build-docs/PHASE-1-PDF-EXTRACT.md` | Full `extract-pdf.js` spec with complete script |
| `build-docs/PHASE-2-EXPLANATIONS.md` | Full `generate-explanations.js` spec with complete script |
| `build-docs/PHASE-3-FRONTEND.md` | Full `index.html`, `style.css`, `app.js` spec |
| `build-docs/PHASE-4-DEPLOY.md` | GitHub Pages deployment steps |
| `docs/data/questions.json` | Source of truth for all question data at runtime |

## GitHub Pages

Configured to serve from `main` branch, `/docs` folder. No GitHub Actions needed. Push to `main` → auto-deploys in ~60 seconds. All paths in the app are relative (no leading `/`) — required for Pages to work correctly since the app is served under `/SPEHX/`.
