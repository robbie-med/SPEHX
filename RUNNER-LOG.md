# RUNNER-LOG.md — Build Execution Log

**Started:** 2026-04-16

## Pre-Flight
- PDF present: ✓
- ANTHROPIC_API_KEY set: ✓ (sk-ant-api03-...)
- Directories created: scripts/, docs/data/, docs/images/

## Phase 1 — PDF Extraction

### Step 1.1 — Writing scripts
- Spawned haiku sub-agent to write scripts/package.json and scripts/extract-pdf.js ✓

### Step 1.2 — npm install ✓

### Step 1.3 — Render-only pass
- ERROR: pdf2pic uses GraphicsMagick; ImageMagick's PDF policy blocked it
- FIX 1: Switched to pdf2pic's setGMClass('imagemagick') — still blocked by ImageMagick security policy
- FIX 2: Replaced renderPages() to use pdftoppm directly (already installed) ✓
- Q73's ECG strip is on page 23, not page 22 as originally specified — updated IMAGE_MAP ✓

### Steps 1.4–1.6 — Extraction and validation ✓
- 86 questions extracted, 7 images cropped
- Parser fix: PDF contains answer sheet (1. ____, 2. ____…) that caused 191 blocks — stripped it
- Parser fix: Set vignettes appear in PREVIOUS block's tail (not current block start) — rewrote vignette extraction
- All crop coordinates updated after visual inspection of rendered pages

### Step 1.7 — Image verification ✓
All 7 images confirmed correct: chest X-ray, fundoscopic, 12-lead ECG, pedigree+KEY, urinary sediment, ECG strip, lip lesion

### Step 1.8 — Text fixes ✓
- Q14: Wrapped lab table in <pre> tags, cleaned whitespace
- Q28: Fixed WBC unit (mm³ superscript lost by pdf-parse)
- Q30: Fixed electrolyte notation (Na⁺, K⁺, Cl⁻, HCO₃⁻ subscripts/superscripts)
- Q35: Fixed full lab table with arterial blood gas (Po₂, Pco₂, HCO₃⁻)
- Q64: Fixed ABG values (Po₂, Pco₂ subscripts, WBC mm³)
- Q66: Fixed WBC unit (mm³)

**Phase 1 COMPLETE: 86 questions, 7 images, text verified**

## Phase 2 — Explanation Generation

### Step 2.1 — Script written ✓

### Step 2.2 — Explanation generation
- BLOCKER: ANTHROPIC_API_KEY is set but invalid (49 chars, valid keys are ~108 chars) → 401 auth errors
- WORKAROUND: Generating explanations directly via 4 parallel Sonnet agents (Q1-22, Q23-43, Q44-65, Q66-86)
- DISCOVERY: Full API key found in file "API KEY" in project root (truncated key was in env var)
- 4 parallel Sonnet agents generated all 86 explanations in batches of ~21 questions each
- All 86 explanations merged into questions.json ✓

**Phase 2 COMPLETE: 430 explanations (86 × 5 choices)**

## Phase 3 — Frontend App

### Step 3.1 — Frontend files written by haiku agent ✓
- index.html, style.css, app.js written verbatim from spec

### Step 3.2 — Local server test ✓
- curl checks: "SPEX Practice Test" found ✓, 86 questions served ✓, q07 image 200 ✓

**Phase 3 COMPLETE**

## Phase 4 — Git Setup and Deploy

### Step 4.1 — .gitignore created ✓ (includes "API KEY" to prevent secret exposure)
### Step 4.2 — Git initialized ✓
### Step 4.3 — Files staged and committed ✓ (27 files)
### Step 4.4 — Force-push to origin ✓
### Step 4.5 — Polling for GitHub Pages live...
