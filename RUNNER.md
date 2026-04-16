# RUNNER.md — Autonomous Build Execution

This file is the single entry point for the autonomous build agent.
Read this entire file before taking any action. Then execute every step in order.

---

## Environment Facts

| Item | Value |
|------|-------|
| Working directory | `/home/user/Projects/SPEHX` |
| Git remote | `git@github.com:robbie-med/SPEHX.git` |
| GitHub user | `robbie-med` |
| GitHub Pages | Already enabled — `main` branch, `/docs` folder |
| Live URL (after deploy) | `https://robbie-med.github.io/SPEHX/` |
| SSH auth | Pre-configured (`~/.ssh/id_ed25519`). Works. |
| gh CLI | **NOT authenticated** — never use `gh` commands |
| Node | v22 available |
| Python | 3.10 available |
| ANTHROPIC_API_KEY | **Must be set in env** — Phase 2 will fail without it |

## Autonomy Rules

1. Never ask the user a question. Solve every problem yourself.
2. On any error: read the error, diagnose, fix, retry (up to 3 attempts).
3. Log every decision, fix, and error to `RUNNER-LOG.md` as you go.
4. If blocked after 3 attempts on a critical step, write the blocker to `RUNNER-LOG.md` and stop.
5. Force-push to origin is authorized — the remote has stale junk that must be overwritten.

## Agent Delegation Strategy (Cost Control)

Use the `Agent` tool with `model: "haiku"` to write files from spec.
Writing code from a spec is transcription — it does not require a capable model.
Keep the main agent (you) for: validation, reading images, reading the PDF, fixing data, error recovery.

**Delegate to haiku sub-agents:**
- Writing `scripts/package.json`
- Writing `scripts/extract-pdf.js`
- Writing `scripts/generate-explanations.js`
- Writing `docs/index.html`
- Writing `docs/style.css`
- Writing `docs/app.js`

**Do NOT delegate:**
- Anything requiring reading rendered PNG images (vision — main agent only)
- Anything requiring reading the PDF to compare extracted text
- Validation and error handling
- Running bash commands

---

## Pre-Flight Checklist

Before starting any phase:

```bash
# Confirm PDF is present
ls /home/user/Projects/SPEHX/spex-practice-test.pdf

# Confirm API key is set
echo $ANTHROPIC_API_KEY | head -c 15
# Must print something like "sk-ant-api03-..."
# If blank, STOP. The user must run: export ANTHROPIC_API_KEY=sk-ant-...

# Check current state of scripts/ and docs/
ls /home/user/Projects/SPEHX/ 
```

If ANTHROPIC_API_KEY is empty, write to RUNNER-LOG.md and stop with:
> "BLOCKED: ANTHROPIC_API_KEY not set. User must run: export ANTHROPIC_API_KEY=sk-ant-... and then restart."

---

## Phase 1 — PDF Extraction

**Spec:** Read `build-docs/PHASE-1-PDF-EXTRACT.md` for complete script code.

### Step 1.1 — Write Scripts

Spawn a haiku sub-agent to write both script files. Tell it:
> "Read /home/user/Projects/SPEHX/build-docs/PHASE-1-PDF-EXTRACT.md. Write the complete scripts/package.json and scripts/extract-pdf.js files exactly as specified. The scripts/ directory is at /home/user/Projects/SPEHX/scripts/. Create it if it doesn't exist. Write the files verbatim from the spec — do not modify any code. When done, confirm both files exist."

Verify after sub-agent returns:
```bash
cat /home/user/Projects/SPEHX/scripts/package.json
# Should show: pdf-parse, pdf2pic, sharp, @anthropic-ai/sdk dependencies
head -5 /home/user/Projects/SPEHX/scripts/extract-pdf.js
# Should show: import statements
```

### Step 1.2 — npm install

```bash
cd /home/user/Projects/SPEHX/scripts && npm install
```

Expected: no fatal errors. `node_modules/` appears. Sharp may download a binary — that's fine.

If npm install fails:
- Check for network errors (retry)
- Check Node version compatibility (Node 22 should be fine)
- Check package.json syntax

### Step 1.3 — Render-Only Pass

```bash
cd /home/user/Projects/SPEHX/scripts && node extract-pdf.js --render-only
```

Expected output: "Rendering pages: 3, 5, 16, 19, 22, 24" then "Done rendering pages."
Expected files: `scripts/renders/page.3.png`, `page.5.png`, `page.16.png`, `page.19.png`, `page.22.png`, `page.24.png`

```bash
ls /home/user/Projects/SPEHX/scripts/renders/
```

### Step 1.4 — Verify Crop Coordinates

Read each rendered PNG image. For each, confirm the medical image is visible and the hardcoded crop box in `IMAGE_MAP` would capture it correctly.

**Read these files visually:**
- `scripts/renders/page.3.png` — find the chest X-ray; it should be in the upper portion
- `scripts/renders/page.5.png` — find the fundoscopic image
- `scripts/renders/page.16.png` — find the 12-lead ECG
- `scripts/renders/page.19.png` — find the pedigree diagram
- `scripts/renders/page.22.png` — find TWO images: urinary sediment (upper-left) and ECG strip (lower)
- `scripts/renders/page.24.png` — find the lip lesion photo

**Current IMAGE_MAP crop values** (in `extract-pdf.js`):
```
Q7  page 3:  left:400, top:300,  w:1750, h:1200  (upper center)
Q13 page 5:  left:550, top:200,  w:1450, h:1100  (center)
Q51 page 16: left:100, top:200,  w:2350, h:1000  (full-width ECG)
Q61 page 19: left:400, top:200,  w:1750, h:900   (upper)
Q71 page 22: left:100, top:200,  w:1200, h:1000  (upper-left)
Q73 page 22: left:100, top:1400, w:2350, h:700   (lower strip)
Q77 page 24: left:500, top:200,  w:1550, h:1200  (upper center)
```

Pages are ~2550×3300 pixels at 300 DPI.

If a crop box looks wrong (e.g., blank area, wrong position), edit `extract-pdf.js` to fix the crop coordinates. Be conservative — it's better to crop slightly too large than to cut off the image.

### Step 1.5 — Full Extraction

```bash
mkdir -p /home/user/Projects/SPEHX/docs/data
mkdir -p /home/user/Projects/SPEHX/docs/images
cd /home/user/Projects/SPEHX/scripts && node extract-pdf.js
```

Expected:
- "Wrote 86 questions to ..."
- "Validation passed. All 86 questions look good."
- 7 PNG files in `docs/images/`

### Step 1.6 — Validate Output

```bash
# Count questions
node -e "const d=JSON.parse(require('fs').readFileSync('/home/user/Projects/SPEHX/docs/data/questions.json','utf8'));console.log('Questions:',d.questions.length)"
# Expected: 86

# Count images
ls /home/user/Projects/SPEHX/docs/images/*.png | wc -l
# Expected: 7

# Spot-check Q7 has imageFile
node -e "const d=JSON.parse(require('fs').readFileSync('/home/user/Projects/SPEHX/docs/data/questions.json','utf8'));const q=d.questions.find(q=>q.id===7);console.log('Q7 imageFile:',q.imageFile,'correctAnswer:',q.correctAnswer)"
# Expected: imageFile: q07-chest-xray.png, correctAnswer: C

# Spot-check Q3 set vignette
node -e "const d=JSON.parse(require('fs').readFileSync('/home/user/Projects/SPEHX/docs/data/questions.json','utf8'));const q=d.questions.find(q=>q.id===3);console.log('Q3 setId:',q.setId,'hasVignette:',!!q.setVignette,'vignette preview:',q.setVignette?.substring(0,80))"

# Spot-check Q86 correctAnswer
node -e "const d=JSON.parse(require('fs').readFileSync('/home/user/Projects/SPEHX/docs/data/questions.json','utf8'));const q=d.questions.find(q=>q.id===86);console.log('Q86 correctAnswer:',q.correctAnswer)"
# Expected: B
```

### Step 1.7 — Read Images to Verify Crops Worked

Read each of the 7 output PNGs in `docs/images/`. Confirm each shows a medical image (not blank, not a text page, not a random area). If any look wrong:
1. Re-open the render for that page
2. Estimate better crop coordinates
3. Update `extract-pdf.js`
4. Re-run `node extract-pdf.js` (it will overwrite)
5. Re-verify

### Step 1.8 — Fix Question Text

Read `spex-practice-test.pdf` (Claude Code can read PDFs) and compare against `questions.json` for:
- Q1: verify full question text extracted correctly
- Q14: lab panel table (Anti-HAV, Anti-HBs, HBsAg, HBeAg) — likely mangled by pdf-parse
- Q28, Q30, Q35, Q64: other likely lab-table questions — check and fix if mangled
- Any question with `questionText` under 50 chars is suspicious

For lab table questions, edit `questions.json` directly. Wrap the lab data in `<pre>` tags:
```json
"questionText": "A 38-year-old man...\n\n<pre>Serum\n  Anti-HAV    Positive\n  HBsAg       Positive\n  HBeAg       Positive</pre>\n\nWhich of the following..."
```

Also scan all `questionText` values for encoding artifacts:
- `â€"` → `–` (en dash)
- `Ã‚Â°` or `Â°` → `°` (degree sign)  
- `Î²` → `β`
- `â‰¥` → `≥`
- `â‰¤` → `≤`
- Heart sounds: ensure S₁ S₂ render correctly (use `S<sub>1</sub>` if subscripts are lost)

Edit `docs/data/questions.json` directly to fix all issues found.

**Phase 1 done when:** 86 questions, 7 images, all text matches PDF, no encoding artifacts.

---

## Phase 2 — Explanation Generation

**Spec:** Read `build-docs/PHASE-2-EXPLANATIONS.md` for complete script code.

### Step 2.1 — Write Script

Spawn a haiku sub-agent:
> "Read /home/user/Projects/SPEHX/build-docs/PHASE-2-EXPLANATIONS.md. Write the complete scripts/generate-explanations.js file exactly as specified (path: /home/user/Projects/SPEHX/scripts/generate-explanations.js). Transcribe verbatim. Confirm file written."

### Step 2.2 — Generate Explanations

```bash
cd /home/user/Projects/SPEHX/scripts && node generate-explanations.js
```

The script prints progress for each question. Runtime ~5 minutes. It saves after each question — safe to interrupt and re-run.

If the script hits failures (network, API errors): re-run. It resumes automatically from where it left off.

### Step 2.3 — Validate

```bash
node -e "
const d=JSON.parse(require('fs').readFileSync('/home/user/Projects/SPEHX/docs/data/questions.json','utf8'));
const missing=d.questions.filter(q=>Object.values(q.explanations).some(e=>!e));
console.log(missing.length===0?'All 86 explanations present':'MISSING:',missing.map(q=>q.id));
"
```

Expected: `All 86 explanations present`

If any are missing: re-run generate-explanations.js. It will only generate the missing ones.

**Phase 2 done when:** All 86 questions have non-empty explanations for all 5 choices.

---

## Phase 3 — Frontend App

**Spec:** Read `build-docs/PHASE-3-FRONTEND.md` for all three files' complete code.

### Step 3.1 — Write Frontend Files

Spawn a haiku sub-agent:
> "Read /home/user/Projects/SPEHX/build-docs/PHASE-3-FRONTEND.md. Write these three files exactly as specified (verbatim, no modifications):
> - /home/user/Projects/SPEHX/docs/index.html
> - /home/user/Projects/SPEHX/docs/style.css
> - /home/user/Projects/SPEHX/docs/app.js
> Confirm all three files written."

After sub-agent returns, spot-check:
```bash
grep -c "SPEX" /home/user/Projects/SPEHX/docs/index.html  # should be > 0
grep -c "choice-btn" /home/user/Projects/SPEHX/docs/style.css  # should be > 0
grep -c "handleAnswer" /home/user/Projects/SPEHX/docs/app.js  # should be > 0
```

### Step 3.2 — Local Server Test

```bash
cd /home/user/Projects/SPEHX/docs && python3 -m http.server 8080 &
sleep 2

# Verify server responds
curl -s http://localhost:8080/ | grep -c "SPEX Practice Test"
# Expected: 1 or more

# Verify questions.json is served
curl -s http://localhost:8080/data/questions.json | python3 -c "import sys,json;d=json.load(sys.stdin);print('Questions:',len(d['questions']))"
# Expected: Questions: 86

# Verify an image is served
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/images/q07-chest-xray.png
# Expected: 200

# Kill server
pkill -f "python3 -m http.server 8080"
```

If any curl check fails:
- 404 on questions.json: check `docs/data/questions.json` exists
- 404 on image: check `docs/images/q07-chest-xray.png` exists
- HTML doesn't contain "SPEX Practice Test": check index.html content

**Phase 3 done when:** All 3 curl checks pass.

---

## Phase 4 — Git Setup and Deploy

**Spec:** Read `build-docs/PHASE-4-DEPLOY.md` for reference.

### Step 4.1 — Create .gitignore

Write `/home/user/Projects/SPEHX/.gitignore`:
```
scripts/node_modules/
scripts/renders/
.env
*.env
.DS_Store
Thumbs.db
```

### Step 4.2 — Initialize Git

```bash
cd /home/user/Projects/SPEHX
git init
git branch -M main
git remote add origin git@github.com:robbie-med/SPEHX.git
```

If remote already exists: `git remote set-url origin git@github.com:robbie-med/SPEHX.git`

### Step 4.3 — Stage and Commit

```bash
cd /home/user/Projects/SPEHX
git add docs/
git add scripts/package.json scripts/package-lock.json scripts/extract-pdf.js scripts/generate-explanations.js
git add build-docs/
git add spex-practice-test.pdf
git add CLAUDE.md
git add .gitignore
git add RUNNER.md
git add RUNNER-LOG.md

# Verify what we're committing
git status

git commit -m "Build: SPEX study webapp — 86 questions, 7 images, complete frontend"
```

Do NOT add:
- `scripts/node_modules/` (excluded by .gitignore)
- `scripts/renders/` (excluded by .gitignore)
- Any `.env` file

### Step 4.4 — Force Push

```bash
cd /home/user/Projects/SPEHX
git push -u origin main --force
```

This overwrites the contaminated remote. Expected output: "Branch 'main' set up to track remote branch 'main' from 'origin'."

If push fails with SSH error:
- Verify SSH: `ssh -T git@github.com`
- If SSH fails, check `~/.ssh/id_ed25519` exists

### Step 4.5 — Verify Deployment

GitHub Pages takes ~60 seconds to deploy after a push.

```bash
sleep 70
curl -s https://robbie-med.github.io/SPEHX/ | grep -c "SPEX Practice Test"
# Expected: 1 or more (confirms the page is live)

curl -s https://robbie-med.github.io/SPEHX/data/questions.json | python3 -c "import sys,json;d=json.load(sys.stdin);print('Live questions:',len(d['questions']))"
# Expected: Live questions: 86

curl -s -o /dev/null -w "%{http_code}" https://robbie-med.github.io/SPEHX/images/q07-chest-xray.png
# Expected: 200
```

If the site returns 404: GitHub Pages may need another minute. Retry after 60 more seconds.

**Phase 4 done when:** All 3 curl checks pass against the live GitHub Pages URL.

---

## Completion

Write a final summary to `RUNNER-LOG.md`:
```markdown
## Build Complete

- Phase 1 (PDF Extraction): [DONE / issues encountered: ...]
- Phase 2 (Explanations): [DONE / issues encountered: ...]
- Phase 3 (Frontend): [DONE / issues encountered: ...]
- Phase 4 (Deploy): [DONE / issues encountered: ...]

Live URL: https://robbie-med.github.io/SPEHX/
Questions: 86
Images: 7
Explanations: 430 (86 × 5 choices)
```

Then stop.
