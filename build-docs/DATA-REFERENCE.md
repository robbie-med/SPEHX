# Data Reference — Hardcoded Source of Truth

This document contains all data that was read directly from the PDF and does not need to be derived programmatically. Scripts and the frontend should treat this file as the authoritative reference. When values here conflict with script output, this file wins.

---

## Answer Key (86 Questions)

Extracted from PDF page 29.

```js
// Copy-paste directly into extract-pdf.js as ANSWER_KEY
const ANSWER_KEY = {
  // Block 1 (Q1–43)
   1:'A',  2:'D',  3:'D',  4:'E',  5:'C',
   6:'A',  7:'C',  8:'B',  9:'C', 10:'A',
  11:'B', 12:'B', 13:'A', 14:'C', 15:'D',
  16:'E', 17:'B', 18:'E', 19:'A', 20:'D',
  21:'A', 22:'E', 23:'D', 24:'B', 25:'D',
  26:'A', 27:'D', 28:'D', 29:'B', 30:'A',
  31:'A', 32:'A', 33:'C', 34:'D', 35:'D',
  36:'A', 37:'D', 38:'E', 39:'B', 40:'B',
  41:'C', 42:'E', 43:'A',

  // Block 2 (Q44–86)
  44:'A', 45:'D', 46:'E', 47:'A', 48:'E',
  49:'E', 50:'B', 51:'C', 52:'B', 53:'A',
  54:'C', 55:'B', 56:'D', 57:'E', 58:'E',
  59:'B', 60:'C', 61:'E', 62:'D', 63:'B',
  64:'C', 65:'B', 66:'A', 67:'E', 68:'D',
  69:'C', 70:'A', 71:'A', 72:'C', 73:'E',
  74:'B', 75:'D', 76:'A', 77:'E', 78:'A',
  79:'C', 80:'D', 81:'D', 82:'B', 83:'D',
  84:'B', 85:'D', 86:'B'
};
```

---

## Question Sets (Grouped Vignettes)

These 10 sets share a clinical vignette that appears once and applies to 2+ questions. The vignette text is extracted by the PDF script and stored on the **first question** of each set only. All subsequent questions in the set have `setVignette: null` but share the same `setId`.

```js
// Copy-paste directly into extract-pdf.js as SET_MAP
// Maps question ID → set metadata
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
```

---

## Image Inventory

7 images embedded in the PDF. All must be extracted as PNG files and placed in `docs/images/`.

```js
// Copy-paste directly into extract-pdf.js as IMAGE_MAP
// Maps question ID → image metadata
const IMAGE_MAP = {
   7: {
    filename:    'q07-chest-xray.png',
    pdfPage:     3,
    alt:         'Chest X-ray showing bilateral upper lobe infiltrates with cavitation',
    description: 'The chest X-ray shows bilateral upper lobe opacities with cavitation and volume loss, consistent with reactivation tuberculosis.',
  },
  13: {
    filename:    'q13-fundoscopic.png',
    pdfPage:     5,
    alt:         'Fundoscopic image showing flame-shaped hemorrhages and hard exudates',
    description: 'Fundoscopic examination shows flame-shaped hemorrhages, hard exudates (lipid deposits), and neovascularization at the disc, consistent with proliferative diabetic retinopathy.',
  },
  51: {
    filename:    'q51-ecg-12lead.png',
    pdfPage:     16,
    alt:         '12-lead ECG',
    description: 'The 12-lead ECG shows ST-segment elevation in the anterior leads (V1–V4) with reciprocal ST depression in the inferior leads (II, III, aVF), consistent with an anterior STEMI.',
  },
  61: {
    filename:    'q61-pedigree.png',
    pdfPage:     19,
    alt:         'Pedigree diagram',
    description: 'The pedigree shows an autosomal dominant inheritance pattern: affected individuals in every generation, male-to-male transmission present, approximately 50% of offspring affected.',
  },
  71: {
    filename:    'q71-urinary-sediment.png',
    pdfPage:     22,
    alt:         'Urinary sediment microscopy showing calcium oxalate crystals',
    description: 'Urinary sediment microscopy shows multiple envelope-shaped (calcium oxalate dihydrate) crystals, characteristic of hyperoxaluria or ethylene glycol toxicity.',
  },
  73: {
    filename:    'q73-ecg-strip.png',
    pdfPage:     22,
    alt:         'Single-lead ECG strip showing complete heart block',
    description: 'The rhythm strip shows complete AV dissociation: P waves march through at their own rate (~60 bpm) with no relationship to QRS complexes, which occur at a ventricular escape rate of ~30 bpm — consistent with third-degree (complete) AV block.',
  },
  77: {
    filename:    'q77-lip-lesion.png',
    pdfPage:     24,
    alt:         'Clinical photograph of a lower lip lesion',
    description: 'The photograph shows a large, indurated, ulcerated lesion on the lower lip with irregular borders and surrounding induration, characteristic of squamous cell carcinoma.',
  },
};
```

### Image Crop Coordinates

Page renders via `pdf2pic` at 300 DPI produce images that are approximately **2550 × 3300 pixels** (8.5 × 11 inches × 300 DPI).

These crop boxes must be measured **after** running `pdf2pic` on the PDF and opening the rendered PNGs in an image viewer. Fill in the values below, then hard-code them in `extract-pdf.js`.

| Question | PDF Page | Approximate Image Position | Crop Box (x, y, w, h) |
|----------|----------|---------------------------|----------------------|
| Q7  | 3  | Top-center of page, above Q7 text | `TBD` |
| Q13 | 5  | Center of page, above Q13 text | `TBD` |
| Q51 | 16 | Top portion of page, above Q51 text | `TBD` |
| Q61 | 19 | Upper portion of page, above Q61 text | `TBD` |
| Q71 | 22 | Upper-left quarter of page | `TBD` |
| Q73 | 22 | Lower-left or lower-center of page | `TBD` |
| Q77 | 24 | Upper-center of page | `TBD` |

**How to measure crop boxes:**
1. Run `node scripts/extract-pdf.js --render-only` (a flag the script will support)
2. Open each rendered page PNG in any image viewer that shows pixel coordinates (e.g., GIMP, Preview, Paint)
3. Note the pixel coordinates of the top-left corner of the image region and its width/height
4. Enter those values in the table above and in `extract-pdf.js`

---

## Questions with Lab Value Tables

These questions have structured lab data in the question stem. `pdf-parse` will extract them as mangled whitespace. After Phase 1, manually fix these in `questions.json` by wrapping the lab section in `<pre>` tags.

| Question | Lab Data Type |
|----------|--------------|
| Q14 | Serum hepatitis panel (Anti-HAV, Anti-HBs, HBsAg, HBeAg) |
| Q28 | (verify from full PDF read) |
| Q30 | (verify from full PDF read) |
| Q35 | (verify from full PDF read) |
| Q64 | (verify from full PDF read) |

> **Action:** After running Phase 1, grep `questions.json` for questions with suspiciously short `questionText` or missing data, and compare to the PDF to identify all lab-table questions.

---

## Questions with Special Characters

Known special character issues from `pdf-parse`:

| Question | Issue |
|----------|-------|
| Q2  | `S₂` (second heart sound) — may render as `S2` or `S_2`; normalize to `S<sub>2</sub>` in HTML |
| Q13 | `HbA₁c` — may lose subscript; normalize to `HbA<sub>1c</sub>` |
| Q17 | Beta-blocker — may render with Unicode β or lose it; normalize to `&beta;-blocker` |
| Q32 | S₁S₂ heart sounds | 
| Any | Degree symbol (°C, °F) — usually survives `pdf-parse` but verify |
| Any | Greater-than/less-than in lab values (> 95%, < 0.01) — verify not HTML-escaped |

> **Action:** After Phase 1, do a single manual pass over all 86 `questionText` values comparing to the PDF. Fix any encoding issues directly in `questions.json`.

---

## Block Timing (Informational)

Not stored in the data schema — purely for reference and potential future timer feature.

| Block | Questions | Time |
|-------|-----------|------|
| Block 1 | 1–43 | 57 minutes |
| Block 2 | 44–86 | 57 minutes |
