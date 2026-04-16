import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import pdfParse from 'pdf-parse';
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
   7: { filename: 'q07-chest-xray.png',      pdfPage: 3,  alt: 'Chest X-ray showing bilateral upper lobe infiltrates with cavitation',       crop: { left:  50, top:  50, width: 2450, height: 1750 } },
  13: { filename: 'q13-fundoscopic.png',      pdfPage: 5,  alt: 'Fundoscopic image showing flame-shaped hemorrhages and hard exudates',        crop: { left:  50, top:  50, width: 2450, height: 1600 } },
  51: { filename: 'q51-ecg-12lead.png',       pdfPage: 16, alt: '12-lead ECG',                                                                 crop: { left:  50, top:  50, width: 2450, height: 1500 } },
  61: { filename: 'q61-pedigree.png',         pdfPage: 19, alt: 'Pedigree diagram showing inheritance pattern',                                 crop: { left:  50, top:  50, width: 2450, height: 1700 } },
  71: { filename: 'q71-urinary-sediment.png', pdfPage: 22, alt: 'Urinary sediment microscopy showing calcium oxalate crystals',                crop: { left:  50, top:  50, width: 2450, height: 1300 } },
  73: { filename: 'q73-ecg-strip.png',        pdfPage: 23, alt: 'Single-lead ECG strip showing inferior wall myocardial infarction changes',   crop: { left:  50, top:  50, width: 2450, height: 650  } },
  77: { filename: 'q77-lip-lesion.png',       pdfPage: 24, alt: 'Clinical photograph of a lower lip lesion',                                   crop: { left: 100, top:  50, width: 2350, height: 1400 } },
};

// Pages that contain images — only these pages are rendered
const IMAGE_PAGES = [...new Set(Object.values(IMAGE_MAP).map(m => m.pdfPage))];
// = [3, 5, 16, 19, 22, 24]

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Render image-bearing pages to PNG
// ─────────────────────────────────────────────────────────────────────────────

async function renderPages() {
  fs.mkdirSync(RENDERS, { recursive: true });

  console.log(`Rendering pages: ${IMAGE_PAGES.join(', ')}`);
  for (const page of IMAGE_PAGES) {
    // pdftoppm names output as prefix-NN.png (zero-padded based on page count)
    const prefix = path.join(RENDERS, `tmp_page`);
    execSync(`pdftoppm -r 300 -f ${page} -l ${page} -png "${PDF_PATH}" "${prefix}"`);
    // Find the file pdftoppm created (naming is prefix-NN.png with varying padding)
    const files = fs.readdirSync(RENDERS).filter(f => f.startsWith('tmp_page-') && f.endsWith('.png'));
    if (files.length === 0) throw new Error(`pdftoppm produced no output for page ${page}`);
    // Rename to expected format page.N.png
    const tmpFile = path.join(RENDERS, files[0]);
    const outFile = path.join(RENDERS, `page.${page}.png`);
    fs.renameSync(tmpFile, outFile);
    console.log(`  Rendered page ${page} → ${outFile}`);
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
  // pdf-parse produces a flat string. Split into 86 question blocks.
  // Key insight: set vignettes ("Items X–Y\n<text>") appear at the END of the
  // PREVIOUS question's block (not at the start of the first question's block).
  // We do a pre-pass to extract vignettes before parsing question content.

  // Strip answer sheet and boilerplate
  let text = rawText;
  const answerSheetIdx = text.search(/Answer sheet for SPEX|NOTE: THIS IS THE END OF BLOCK 2/);
  if (answerSheetIdx !== -1) text = text.substring(0, answerSheetIdx);

  text = text
    .replace(/Block \d[\s\S]*?Items \d+–\d+;.*?\n/g, '')
    .replace(/END OF SET/g, '')
    .replace(/^\s*\d+\s*$/gm, '')
    .replace(/ALL ITEMS REQUIRE SELECTION OF ONE BEST CHOICE\./g, '')
    .replace(/GENERAL INSTRUCTIONS[\s\S]*?order in which they are presented\./g, '')
    .trim();

  // Split on question number boundaries (1-86)
  const questionBlocks = text.split(/(?=^\d{1,2}\.\s)/m).filter(b => /^\d{1,2}\./.test(b.trim()));

  // Pre-pass: extract "Items X–Y" vignettes from block tails.
  // After choice (E), a block may contain "Items X–Y\n<vignette>" belonging to the next set.
  const pendingVignettes = {}; // firstQuestionNum → vignette text
  for (const block of questionBlocks) {
    // Look for "Items X–Y" followed by vignette text anywhere in the block
    const itemsMatch = block.match(/Items\s+(\d+)[–-]\d+\s*\n([\s\S]+)$/);
    if (itemsMatch) {
      const firstQNum = parseInt(itemsMatch[1]);
      pendingVignettes[firstQNum] = itemsMatch[2].trim();
    }
  }

  const questions = [];

  for (const block of questionBlocks) {
    const qNum = parseInt(block.match(/^(\d+)\./)[1]);
    if (qNum < 1 || qNum > 86) continue;

    const setMeta = SET_MAP[qNum];

    // Vignette for first question of each set is found in the PREVIOUS block's tail
    const setVignette = (setMeta?.isFirst && pendingVignettes[qNum])
      ? pendingVignettes[qNum]
      : null;

    // Extract question stem: text between question number and first "(A)"
    const stemMatch = block.match(/^\d+\.\s+([\s\S]*?)(?=\s*\(A\))/m);
    const questionText = stemMatch ? stemMatch[1].trim() : '';

    // Extract choices A–E. For choice E, stop before "Items X–Y" (next set vignette)
    const choices = {};
    const choiceLetters = ['A', 'B', 'C', 'D', 'E'];
    for (let i = 0; i < choiceLetters.length; i++) {
      const letter = choiceLetters[i];
      const nextLetter = choiceLetters[i + 1];
      let pattern;
      if (nextLetter) {
        pattern = new RegExp(`\\(${letter}\\)\\s+([\\s\\S]*?)(?=\\s*\\(${nextLetter}\\))`, 'm');
      } else {
        // Choice E: stop at "Items X–Y" or end of block
        pattern = new RegExp(`\\(${letter}\\)\\s+([\\s\\S]*?)(?=\\s*Items\\s+\\d+[–-]\\d+|$)`, 'm');
      }
      const match = block.match(pattern);
      choices[letter] = match ? match[1].trim() : '';
    }

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
      explanations: { A: '', B: '', C: '', D: '', E: '' },
    });
  }

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
      if (!q.choices[letter] || q.choices[letter].length < 1) {
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
