# Phase 2 — Explanation Generation Script

**Input:** `docs/data/questions.json` (86 questions, explanations empty)  
**Output:** `docs/data/questions.json` (same file, explanations filled)  
**Script:** `scripts/generate-explanations.js`  
**Runtime:** Node.js + Anthropic SDK  
**Run:** Once, locally. Commit the output. Never run again.  
**Prerequisite:** Phase 1 complete and validated. `ANTHROPIC_API_KEY` env var set.  
**Estimated time:** ~5 minutes for all 86 questions.  
**Estimated cost:** ~$0.20 (60,000 tokens at Sonnet pricing).

---

## Explanation Quality Standard

Each explanation must be:
- **2–4 sentences** — no more
- **High-yield** — state the key clinical reasoning, not just "this is wrong"
- **Teaching-oriented** — explain the distinguishing feature, mechanism, or rule
- **Correct answer:** explicitly state why this is the best choice and what the key diagnostic/therapeutic clue is
- **Wrong answers:** explain what makes the choice tempting AND what distinguishes it from the correct answer. If a wrong answer would be appropriate in a different clinical context, name that context.

---

## Prompt Template

For each question, the script sends this prompt to the Claude API:

```
You are a medical education expert writing high-yield explanations for SPEX physician relicensure exam questions.

Write a brief, clinically focused explanation for each answer choice (A–E). Follow these rules:
- Each explanation is 2–4 sentences maximum
- For the CORRECT answer: state why it is right and what the key clinical reasoning is
- For WRONG answers: briefly explain why it is incorrect — what makes it tempting and what distinguishes it from the correct answer
- Be specific to the clinical details in the vignette
- Use the vocabulary of medical education: "classic presentation of...", "distinguishing feature is...", "this would be appropriate if..."
- Return ONLY a JSON object with keys A, B, C, D, E and string values. No markdown, no preamble.

---
Question ${id}:

${setVignette ? `Clinical scenario:\n${setVignette}\n\n` : ''}${imageDescription ? `Image: ${imageDescription}\n\n` : ''}${questionText}

Choices:
(A) ${choices.A}
(B) ${choices.B}
(C) ${choices.C}
(D) ${choices.D}
(E) ${choices.E}

Correct answer: (${correctAnswer})
---

Return JSON only:
```

---

## Image Descriptions for API Prompts

These questions have embedded images that cannot be sent to the API as files. Instead, a text description of the image is included in the prompt. These descriptions are hardcoded in the script.

```js
const IMAGE_DESCRIPTIONS = {
   7: 'The chest X-ray shows bilateral upper lobe opacities with cavitation and volume loss, consistent with reactivation pulmonary tuberculosis.',
  13: 'Fundoscopic examination of the left eye shows flame-shaped hemorrhages, hard exudates (lipid deposits), dot-blot hemorrhages, and neovascularization near the optic disc, consistent with proliferative diabetic retinopathy.',
  51: 'The 12-lead ECG shows ST-segment elevation in leads V1 through V4, with Q waves forming in V1–V2, and reciprocal ST depression in the inferior leads (II, III, aVF), consistent with an acute anterior ST-elevation myocardial infarction (STEMI).',
  61: 'The pedigree diagram shows an autosomal dominant inheritance pattern: affected individuals appear in every generation, there is apparent male-to-male transmission, and approximately 50% of offspring of affected individuals are affected.',
  71: 'Urinary sediment microscopy shows multiple envelope-shaped (calcium oxalate dihydrate) crystals and one dumbbell-shaped (calcium oxalate monohydrate) crystal, characteristic of hyperoxaluria or ethylene glycol toxicity.',
  73: 'The rhythm strip shows complete AV dissociation: regular P waves march through at approximately 60 bpm with no relationship to QRS complexes, which occur at a slow ventricular escape rate of approximately 30 bpm — consistent with third-degree (complete) AV block.',
  77: 'The photograph shows a large, indurated, fungating ulcerated lesion of the lower lip with raised irregular borders and surrounding induration fixed to the mandible, characteristic of squamous cell carcinoma of the lip.',
};
```

---

## Complete Script — `scripts/generate-explanations.js`

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'docs', 'data', 'questions.json');

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from environment

const IMAGE_DESCRIPTIONS = {
   7: 'The chest X-ray shows bilateral upper lobe opacities with cavitation and volume loss, consistent with reactivation pulmonary tuberculosis.',
  13: 'Fundoscopic examination of the left eye shows flame-shaped hemorrhages, hard exudates (lipid deposits), dot-blot hemorrhages, and neovascularization near the optic disc, consistent with proliferative diabetic retinopathy.',
  51: 'The 12-lead ECG shows ST-segment elevation in leads V1 through V4, with Q waves forming in V1–V2, and reciprocal ST depression in the inferior leads (II, III, aVF), consistent with an acute anterior ST-elevation myocardial infarction (STEMI).',
  61: 'The pedigree diagram shows an autosomal dominant inheritance pattern: affected individuals appear in every generation, there is apparent male-to-male transmission, and approximately 50% of offspring of affected individuals are affected.',
  71: 'Urinary sediment microscopy shows multiple envelope-shaped (calcium oxalate dihydrate) crystals and one dumbbell-shaped (calcium oxalate monohydrate) crystal, characteristic of hyperoxaluria or ethylene glycol toxicity.',
  73: 'The rhythm strip shows complete AV dissociation: regular P waves march through at approximately 60 bpm with no relationship to QRS complexes, which occur at a slow ventricular escape rate of approximately 30 bpm — consistent with third-degree (complete) AV block.',
  77: 'The photograph shows a large, indurated, fungating ulcerated lesion of the lower lip with raised irregular borders and surrounding induration fixed to the mandible, characteristic of squamous cell carcinoma of the lip.',
};

function buildPrompt(q) {
  const imageDesc = IMAGE_DESCRIPTIONS[q.id] || null;

  let prompt = `You are a medical education expert writing high-yield explanations for SPEX physician relicensure exam questions.\n\n`;
  prompt += `Write a brief, clinically focused explanation for each answer choice (A–E). Follow these rules:\n`;
  prompt += `- Each explanation is 2–4 sentences maximum\n`;
  prompt += `- For the CORRECT answer: state why it is right and what the key clinical reasoning is\n`;
  prompt += `- For WRONG answers: explain why it is incorrect — what makes it tempting and what distinguishes it from the correct answer\n`;
  prompt += `- Be specific to the clinical details in this vignette\n`;
  prompt += `- Return ONLY a JSON object with keys A, B, C, D, E and string values. No markdown, no preamble.\n\n`;
  prompt += `---\n`;
  prompt += `Question ${q.id}:\n\n`;

  if (q.setVignette) {
    prompt += `Clinical scenario:\n${q.setVignette}\n\n`;
  }
  if (imageDesc) {
    prompt += `Image: ${imageDesc}\n\n`;
  }

  prompt += `${q.questionText}\n\n`;
  prompt += `Choices:\n`;
  for (const [letter, text] of Object.entries(q.choices)) {
    prompt += `(${letter}) ${text}\n`;
  }
  prompt += `\nCorrect answer: (${q.correctAnswer})\n`;
  prompt += `---\n\nReturn JSON only:`;

  return prompt;
}

async function generateExplanations(q) {
  const prompt = buildPrompt(q);

  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();

  // Strip markdown code fences if Claude wraps the JSON anyway
  const jsonText = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error(`Q${q.id}: JSON parse failed. Raw response:\n${raw}`);
    throw err;
  }

  // Validate that all 5 keys are present
  for (const letter of ['A','B','C','D','E']) {
    if (!parsed[letter] || typeof parsed[letter] !== 'string') {
      throw new Error(`Q${q.id}: missing or invalid explanation for choice (${letter})`);
    }
  }

  return parsed;
}

async function main() {
  console.log('=== SPEX Explanation Generation Script ===\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set.');
    console.error('Run: export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const { questions } = data;

  // Find questions that still need explanations (all empty strings)
  const todo = questions.filter(q =>
    Object.values(q.explanations).every(e => e === '')
  );

  console.log(`Questions needing explanations: ${todo.length} / ${questions.length}`);

  if (todo.length === 0) {
    console.log('All explanations already generated. Nothing to do.');
    process.exit(0);
  }

  let completed = 0;
  let failed = [];

  for (const q of todo) {
    process.stdout.write(`  Q${String(q.id).padStart(2, '0')}: generating... `);

    try {
      const explanations = await generateExplanations(q);

      // Update in-place
      const target = questions.find(x => x.id === q.id);
      target.explanations = explanations;
      completed++;

      process.stdout.write(`done.\n`);

      // Save after every question so we can resume if interrupted
      fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');

    } catch (err) {
      process.stdout.write(`FAILED: ${err.message}\n`);
      failed.push(q.id);
    }

    // Gentle rate-limit pause between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nComplete: ${completed} generated, ${failed.length} failed.`);
  if (failed.length > 0) {
    console.log(`Failed question IDs: ${failed.join(', ')}`);
    console.log('Re-run the script to retry failed questions (they will be detected automatically).');
  } else {
    console.log('\nPhase 2 complete. All 86 questions have explanations.');
    console.log('Next step: build the frontend app (Phase 3).');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

---

## Running the Script

```bash
export ANTHROPIC_API_KEY=sk-ant-...
cd scripts
node generate-explanations.js
```

The script is **resumable**: it checks which questions already have explanations and skips them. If it crashes or is interrupted mid-run, just re-run it — it will pick up where it left off.

---

## Post-Run Validation

### 1. Check all explanations populated
```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('docs/data/questions.json','utf8'));
const missing = d.questions.filter(q => Object.values(q.explanations).some(e => !e));
if (missing.length === 0) console.log('All explanations present.');
else console.log('Missing explanations for:', missing.map(q => q.id));
"
```

### 2. Manually review sample
Open `docs/data/questions.json` and read the explanations for:
- Q1 (first question)
- Q7 (image question — verify image description was used correctly)
- Q3 (set vignette question — verify set context appears in explanation)
- Any question where you know the clinical answer and can verify correctness

### 3. Fix any bad explanations
If the API returned an explanation that is clinically incorrect, edit it directly in `questions.json`. This file is the source of truth — it does not need to be regenerated.

---

## Output Specification

After Phase 2, every question in `questions.json` must have `explanations` as an object with:
- All 5 keys (`A`, `B`, `C`, `D`, `E`) present
- All values non-empty strings of at least 50 characters
- The correct answer's explanation clearly labeled with clinical justification
- No markdown formatting within explanation strings (no `**bold**`, no `#` headers) — plain prose only, HTML entities acceptable
