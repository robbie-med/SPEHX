# Phase 1 — PDF Extraction Script

**Input:** `spex-practice-test.pdf`  
**Output:** `docs/data/questions.json` (no explanations), `docs/images/*.png` (7 files)  
**Script:** `scripts/extract-pdf.js`  
**Runtime:** Node.js (not browser, not Python)  
**Run:** Once, locally. Commit the output. Never run in production.

---

## Dependencies

```json
// scripts/package.json
{
  "name": "spex-scripts",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "extract":      "node extract-pdf.js",
    "extract-only": "node extract-pdf.js --render-only",
    "explain":      "node generate-explanations.js"
  },
  "dependencies": {
    "pdf-parse":    "^1.1.1",
    "pdf2pic":      "^3.1.3",
    "sharp":        "^0.33.4",
    "@anthropic-ai/sdk": "^0.27.0"
  }
}
```

Install: `cd scripts && npm install`

---

## Script Architecture

The script has two modes, controlled by the `--render-only` flag:

- **Default mode** (`node extract-pdf.js`): runs the full pipeline — text extraction, page rendering, image cropping, and JSON output.
- **Render-only mode** (`node extract-pdf.js --render-only`): only renders the 7 image-bearing pages to PNG in a temp folder `scripts/renders/`, then exits. Use this to measure crop coordinates before running the full pipeline.

---

## Complete Script — `scripts/extract-pdf.js`

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import { fromPath } from 'pdf2pic';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const PDF_PATH  = path.join(ROOT, 'spex-practice-test.pdf');
const OUT_JSON  = path.join(ROOT, 'docs', 'data', 'questions.json');
const OUT_IMGS  = path.join(ROOT, 'docs', 'images');
const RENDERS   = path.join(__dirname, 'renders');

const RENDER_ONLY = process.argv.includes('--render-only');

// ─────────────────────────────────────────────────────────────────────────────
// HARDCODED DATA  (from DATA-REFERENCE.md — do not derive programmatically)
// ─────────────────────────────────────────────────────────────────────────────

const ANSWER_KEY = {
   1:'A',  2:'D',  3:'D',  4:'E',  5:'C',  6:'A',  7:'C',  8:'B',  9:'C', 10:'A',
  11:'B', 12:'B', 13:'A', 14:'C', 15:'D', 16:'E', 17:'B', 18:'E', 19:'A', 20:'D',
  21:'A', 22:'E', 23:'D', 24:'B', 25:'D', 26:'A', 27:'D', 28:'D', 29:'B', 30:'A',
  31:'A', 32:'A', 33:'C', 34:'D', 35:'D', 36:'A', 37:'D', 38:'E', 39:'B', 40:'B',
  41:'C', 42:'E', 43:'A',
  44:'A', 45:'D', 46:'E', 47:'A', 48:'E', 49:'E', 50:'B', 51:'C', 52:'B', 53:'A',
  54:'C', 55:'B', 56:'D', 57:'E', 58:'E', 59:'B', 60:'C', 61:'E', 62:'D', 63:'B',
  64:'C', 65:'B', 66:'A', 67:'E', 68:'D', 69:'C', 70:'A', 71:'A', 72:'C', 73:'E',
  74:'B', 75:'D', 76:'A', 77:'E', 78:'A', 79:'C', 80:'D', 81:'D', 82:'B', 83:'D',
  84:'B', 85:'D', 86:'B'
};

const SET_MAP = {
   3: { setId: 'set-03-04', setLabel: 'Items 3–4',   isFirst: true  },
   4: { setId: 'set-03-04', setLabel: 'Items 3–4',   isFirst: false },
   9: { setId: 'set-09-10', setLabel: 'Items 9–10',  isFirst: true  },
  10: { setId: 'set-09-10', setLabel: 'Items 9–10',  isFirst: false },
  19: { setId: 'set-19-20', setLabel: 'Items 19–20', isFirst: true  },
  20: { setId: 'set-19-20', setLabel: 'Items 19–20', isFirst: false },
  23: { setId: 'set-23-24', setLabel: 'Items 23–24', isFirst: true  },
  24: { setId: 'set-23-24', setLabel: 'Items 23–24', isFirst: false },
  33: { setId: 'set-33-34', setLabel: 'Items 33–34', isFirst: true  },
  34: { setId: 'set-33-34', setLabel: 'Items 33–34', isFirst: false },
  47: { setId: 'set-47-48', setLabel: 'Items 47–48', isFirst: true  },
  48: { setId: 'set-47-48', setLabel: 'Items 47–48', isFirst: false },
  53: { setId: 'set-53-54', setLabel: 'Items 53–54', isFirst: true  },
  54: { setId: 'set-53-54', setLabel: 'Items 53–54', isFirst: false },
  57: { setId: 'set-57-58', setLabel: 'Items 57–58', isFirst: true  },
  58: { setId: 'set-57-58', setLabel: 'Items 57–58', isFirst: false },
  67: { setId: 'set-67-68', setLabel: 'Items 67–68', isFirst: true  },
  68: { setId: 'set-67-68', setLabel: 'Items 67–68', isFirst: false },
  84: { setId: 'set-84-85', setLabel: 'Items 84–85', isFirst: true  },
  85: { setId: 'set-84-85', setLabel: 'Items 84–85', isFirst: false },
};

// IMAGE_MAP: question ID → image metadata
// CROP: {left, top, width, height} in pixels at 300 DPI (page = ~2550x3300px)
// Fill in CROP values after running --render-only and measuring in an image viewer.
const IMAGE_MAP = {
   7: { filename: 'q07-chest-xray.png',      pdfPage: 3,  alt: 'Chest X-ray showing bilateral upper lobe infiltrates with cavitation',       crop: { left: 400, top: 300,  width: 1750, height: 1200 } },
  13: { filename: 'q13-fundoscopic.png',      pdfPage: 5,  alt: 'Fundoscopic image showing flame-shaped hemorrhages and hard exudates',        crop: { left: 550, top: 200,  width: 1450, height: 1100 } },
  51: { filename: 'q51-ecg-12lead.png',       pdfPage: 16, alt: '12-lead ECG',                                                                 crop: { left: 100, top: 200,  width: 2350, height: 1000 } },
  61: { filename: 'q61-pedigree.png',         pdfPage: 19, alt: 'Pedigree diagram showing inheritance pattern',                                 crop: { left: 400, top: 200,  width: 1750, height: 900  } },
  71: { filename: 'q71-urinary-sediment.png', pdfPage: 22, alt: 'Urinary sediment microscopy showing calcium oxalate crystals',                crop: { left: 100, top: 200,  width: 1200, height: 1000 } },
  73: { filename: 'q73-ecg-strip.png',        pdfPage: 22, alt: 'Single-lead ECG strip showing complete heart block',                          crop: { left: 100, top: 1400, width: 2350, height: 700  } },
  77: { filename: 'q77-lip-lesion.png',       pdfPage: 24, alt: 'Clinical photograph of a lower lip lesion',                                   crop: { left: 500, top: 200,  width: 1550, height: 1200 } },
};

// Pages that contain images — only these pages are rendered
const IMAGE_PAGES = [...new Set(Object.values(IMAGE_MAP).map(m => m.pdfPage))];
// = [3, 5, 16, 19, 22, 24]

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Render image-bearing pages to PNG
// ─────────────────────────────────────────────────────────────────────────────

async function renderPages() {
  fs.mkdirSync(RENDERS, { recursive: true });

  const converter = fromPath(PDF_PATH, {
    density:    300,
    saveFilename: 'page',
    savePath:   RENDERS,
    format:     'png',
    width:      2550,
    height:     3300,
  });

  console.log(`Rendering pages: ${IMAGE_PAGES.join(', ')}`);
  for (const page of IMAGE_PAGES) {
    const result = await converter(page, { responseType: 'image' });
    console.log(`  Rendered page ${page} → ${result.path}`);
  }
  console.log('Done rendering pages.');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Crop images from rendered pages
// ─────────────────────────────────────────────────────────────────────────────

async function cropImages() {
  fs.mkdirSync(OUT_IMGS, { recursive: true });

  for (const [qId, meta] of Object.entries(IMAGE_MAP)) {
    const { filename, pdfPage, crop } = meta;
    // pdf2pic names output files as page.N.png (1-indexed)
    const renderPath = path.join(RENDERS, `page.${pdfPage}.png`);
    const outPath    = path.join(OUT_IMGS, filename);

    if (!fs.existsSync(renderPath)) {
      console.error(`Missing render for page ${pdfPage}. Run with --render-only first.`);
      process.exit(1);
    }

    await sharp(renderPath)
      .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
      .png()
      .toFile(outPath);

    console.log(`  Q${qId}: cropped → ${filename}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Extract and parse question text
// ─────────────────────────────────────────────────────────────────────────────

// Build a reverse lookup: PDF page number → question IDs with images on that page
// Used to detect when the parser encounters an image placeholder in the text stream

function parseQuestions(rawText) {
  // pdf-parse produces a flat string. We need to split it into 86 question blocks.
  // Strategy:
  //   1. Remove page headers/footers (page numbers, "END OF SET", block headers)
  //   2. Split on question number pattern: lines starting with a number + period
  //   3. For each block, identify:
  //      a. Whether it opens with a set-vignette label ("Items X–Y")
  //      b. The question stem (text before the first choice)
  //      c. Choices A–E

  // Strip known boilerplate
  let text = rawText
    .replace(/Block \d[\s\S]*?Items \d+–\d+;.*?\n/g, '')   // block headers
    .replace(/END OF SET/g, '')
    .replace(/^\s*\d+\s*$/gm, '')                           // standalone page numbers
    .replace(/ALL ITEMS REQUIRE SELECTION OF ONE BEST CHOICE\./g, '')
    .replace(/GENERAL INSTRUCTIONS[\s\S]*?order in which they are presented\./g, '')
    .trim();

  // Split on question number boundaries: lines that start with "N." where N is 1–86
  // Use a lookahead so the delimiter is preserved at the start of each chunk
  const questionBlocks = text.split(/(?=^\d{1,2}\.\s)/m).filter(b => /^\d{1,2}\./.test(b.trim()));

  const questions = [];
  const setVignettes = {}; // setId → vignette text

  for (const block of questionBlocks) {
    const qNum = parseInt(block.match(/^(\d+)\./)[1]);
    if (qNum < 1 || qNum > 86) continue;

    // Detect set vignette: appears as "Items X–Y" label before the question number
    // in the raw text. Since we split on question numbers, set vignettes for
    // Questions 3, 9, etc. appear at the START of the block for the first question.
    // We handle this by checking if the block starts with "Items" before the question number.
    // (In practice the split may group them differently — adjust regex after testing.)
    let setVignette = null;
    const setMeta = SET_MAP[qNum];

    if (setMeta?.isFirst) {
      // Extract vignette: text between "Items X–Y" label and the question number line
      const vignetteMatch = block.match(/Items\s+\d+[–-]\d+\s*([\s\S]*?)(?=\d+\.\s)/);
      if (vignetteMatch) {
        setVignette = vignetteMatch[1].trim();
        setVignettes[setMeta.setId] = setVignette;
      }
    }

    // Extract question stem: text between question number and "(A)"
    const stemMatch = block.match(/^\d+\.\s+([\s\S]*?)(?=\s*\(A\))/m);
    const questionText = stemMatch ? stemMatch[1].trim() : '';

    // Extract choices A–E
    const choices = {};
    const choiceLetters = ['A', 'B', 'C', 'D', 'E'];
    for (let i = 0; i < choiceLetters.length; i++) {
      const letter = choiceLetters[i];
      const nextLetter = choiceLetters[i + 1];
      let pattern;
      if (nextLetter) {
        pattern = new RegExp(`\\(${letter}\\)\\s+([\\s\\S]*?)(?=\\s*\\(${nextLetter}\\))`, 'm');
      } else {
        pattern = new RegExp(`\\(${letter}\\)\\s+([\\s\\S]*)$`, 'm');
      }
      const match = block.match(pattern);
      choices[letter] = match ? match[1].trim() : '';
    }

    // Get image metadata if this question has one
    const imgMeta = IMAGE_MAP[qNum] || null;

    questions.push({
      id:           qNum,
      block:        qNum <= 43 ? 1 : 2,
      setId:        setMeta?.setId ?? null,
      setLabel:     setMeta?.setLabel ?? null,
      setVignette:  setMeta?.isFirst ? setVignette : null,
      questionText,
      imageFile:    imgMeta?.filename ?? null,
      imageAlt:     imgMeta?.alt ?? null,
      choices,
      correctAnswer: ANSWER_KEY[qNum],
      explanations: { A: '', B: '', C: '', D: '', E: '' }, // filled in Phase 2
    });
  }

  // Sort by ID (should already be sorted, but be safe)
  questions.sort((a, b) => a.id - b.id);

  return questions;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Write questions.json
// ─────────────────────────────────────────────────────────────────────────────

function writeJson(questions) {
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

  const output = {
    meta: {
      totalQuestions: questions.length,
      blocks: [
        { id: 1, label: 'Block 1', questionRange: [1, 43] },
        { id: 2, label: 'Block 2', questionRange: [44, 86] },
      ],
    },
    questions,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nWrote ${questions.length} questions to ${OUT_JSON}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Validation
// ─────────────────────────────────────────────────────────────────────────────

function validate(questions) {
  const errors = [];

  if (questions.length !== 86) {
    errors.push(`Expected 86 questions, got ${questions.length}`);
  }

  for (const q of questions) {
    if (!q.questionText || q.questionText.length < 20) {
      errors.push(`Q${q.id}: questionText is suspiciously short: "${q.questionText}"`);
    }
    for (const letter of ['A','B','C','D','E']) {
      if (!q.choices[letter] || q.choices[letter].length < 2) {
        errors.push(`Q${q.id}: choice (${letter}) is empty or too short`);
      }
    }
    if (!['A','B','C','D','E'].includes(q.correctAnswer)) {
      errors.push(`Q${q.id}: invalid correctAnswer: "${q.correctAnswer}"`);
    }
    if (q.imageFile && !Object.values(IMAGE_MAP).some(m => m.filename === q.imageFile)) {
      errors.push(`Q${q.id}: imageFile "${q.imageFile}" not in IMAGE_MAP`);
    }
  }

  // Check all expected image questions have images
  for (const qId of Object.keys(IMAGE_MAP)) {
    const q = questions.find(q => q.id === parseInt(qId));
    if (!q?.imageFile) errors.push(`Q${qId}: expected imageFile but got none`);
  }

  if (errors.length === 0) {
    console.log('Validation passed. All 86 questions look good.');
  } else {
    console.error('\nValidation ERRORS:');
    errors.forEach(e => console.error('  ✗', e));
    console.error('\nFix these in questions.json manually after script runs.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== SPEX PDF Extraction Script ===\n');

  // Always render pages (needed for both modes)
  await renderPages();

  if (RENDER_ONLY) {
    console.log('\n--render-only mode. Page renders saved to scripts/renders/');
    console.log('Open them in an image viewer, measure crop coordinates, update IMAGE_MAP in this script.');
    process.exit(0);
  }

  // Crop images from rendered pages
  console.log('\nCropping images...');
  await cropImages();

  // Parse PDF text
  console.log('\nParsing question text...');
  const pdfBuffer = fs.readFileSync(PDF_PATH);
  const pdfData   = await pdfParse(pdfBuffer);
  const questions = parseQuestions(pdfData.text);

  // Validate
  console.log('\nValidating...');
  validate(questions);

  // Write JSON
  writeJson(questions);

  console.log('\nPhase 1 complete. Next step: run generate-explanations.js');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

---

## Post-Run Manual Fixes

After running `node extract-pdf.js`, open `docs/data/questions.json` and:

### 1. Verify question count
```bash
node -e "const d = JSON.parse(require('fs').readFileSync('docs/data/questions.json','utf8')); console.log(d.questions.length)"
# Should print: 86
```

### 2. Spot-check these questions manually against the PDF:
- Q1 (first question — verify full text)
- Q7 (has image — verify imageFile is set)
- Q3 (set vignette — verify setVignette is populated)
- Q4 (set follow-up — verify setVignette is null, setId matches Q3)
- Q14 (lab table — fix formatting if mangled)
- Q43 (last of Block 1)
- Q44 (first of Block 2)
- Q86 (last question)

### 3. Fix lab table questions
For questions with structured lab data, manually edit `questionText` in the JSON to wrap the table in a `<pre>` tag:

```json
"questionText": "A 38-year-old man returns for follow-up...\n\n<pre>Serum\n  Anti-HAV    Positive\n  Anti-HBs    Negative\n  HBsAg       Positive\n  HBeAg       Positive</pre>\n\nWhich of the following is the most appropriate next step?"
```

### 4. Fix special character encoding
Search the JSON for these patterns and fix:
- `â€"` → `–` (en dash)
- `Ã‚Â°` → `°` (degree sign)
- `Î²` → `β` (beta)
- `â‰¥` → `≥`
- `â‰¤` → `≤`
- S sub/superscripts: manually add HTML tags where needed

---

## Output Specification

`docs/data/questions.json` must conform to this schema:

```json
{
  "meta": {
    "totalQuestions": 86,
    "blocks": [
      { "id": 1, "label": "Block 1", "questionRange": [1, 43] },
      { "id": 2, "label": "Block 2", "questionRange": [44, 86] }
    ]
  },
  "questions": [
    {
      "id": 7,
      "block": 1,
      "setId": null,
      "setLabel": null,
      "setVignette": null,
      "questionText": "A 70-year-old Vietnamese fisherman is brought...",
      "imageFile": "q07-chest-xray.png",
      "imageAlt": "Chest X-ray showing bilateral upper lobe infiltrates with cavitation",
      "choices": {
        "A": "Antibiotic therapy",
        "B": "Antifungal therapy",
        "C": "Antimycobacterial therapy",
        "D": "Referral for bronchoscopy",
        "E": "Referral to a thoracic surgeon for right upper lobectomy"
      },
      "correctAnswer": "C",
      "explanations": {
        "A": "",
        "B": "",
        "C": "",
        "D": "",
        "E": ""
      }
    }
  ]
}
```

**Invariants:**
- `questions.length === 86`
- Every question has `id`, `block`, `correctAnswer`, `questionText`, `choices` with keys A–E
- `imageFile` is `null` for questions without images; a filename string for questions with images
- `setVignette` is a non-empty string only for the first question in a set; `null` for all others
- `explanations` all empty strings (`""`) at end of Phase 1 — Phase 2 fills them
