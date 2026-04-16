# Phase 4 — GitHub Pages Deployment

**Input:** `docs/` folder with all static files complete and tested locally  
**Output:** Live URL at `https://[username].github.io/SPEHX/`  
**Prerequisite:** Phase 3 test checklist passed in full.  
**Estimated time:** 15 minutes.

---

## Prerequisites Checklist

Before touching GitHub, confirm locally:
- [ ] `docs/data/questions.json` — exists, 86 questions, all explanations populated
- [ ] `docs/images/` — contains exactly 7 PNG files
- [ ] `docs/index.html`, `docs/style.css`, `docs/app.js` — all exist
- [ ] `cd docs && python3 -m http.server 8080` — app loads, all features work
- [ ] No console errors at `http://localhost:8080`

---

## Step 1: Create GitHub Repository

```bash
# If you have the GitHub CLI installed:
gh repo create SPEHX --public --description "SPEX physician relicensure exam study app"

# If not, create manually at github.com/new:
# - Name: SPEHX
# - Visibility: Public (required for free GitHub Pages)
# - Do NOT initialize with README (we already have files)
```

---

## Step 2: Initialize Git and Push

```bash
cd /home/user/Projects/SPEHX

git init
git branch -M main

# Stage only the files that belong in the repo
git add docs/
git add scripts/
git add spex-practice-test.pdf
git add CLAUDE.md
git add build-docs/

# Do NOT add:
#   scripts/node_modules/
#   scripts/renders/       (temp page renders — large, not needed in repo)
#   .env or any file with ANTHROPIC_API_KEY

git commit -m "Initial commit: SPEX study webapp"

git remote add origin https://github.com/[USERNAME]/SPEHX.git
git push -u origin main
```

### `.gitignore` to create before staging:

```
# scripts/
scripts/node_modules/
scripts/renders/

# Environment
.env
*.env

# OS
.DS_Store
Thumbs.db
```

---

## Step 3: Enable GitHub Pages

1. Go to `https://github.com/[USERNAME]/SPEHX`
2. Click **Settings** → scroll to **Pages** (left sidebar, under "Code and automation")
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/docs`
4. Click **Save**
5. GitHub will show: *"Your site is being deployed"*
6. Wait ~60 seconds, then visit: `https://[USERNAME].github.io/SPEHX/`

---

## Step 4: Verify Live Site

At `https://[USERNAME].github.io/SPEHX/`, confirm:

- [ ] Page loads (not 404)
- [ ] Q1 displays correctly
- [ ] A choice can be clicked and feedback appears
- [ ] Score updates
- [ ] Navigate to Q7 — image loads (tests relative image path)
- [ ] Refresh — progress persists (localStorage works on Pages)
- [ ] No console errors (open DevTools → Console)

---

## Path Correctness: Local vs GitHub Pages

GitHub Pages serves the app at `/SPEHX/` (not `/`). This is why all paths must be **relative**, not absolute.

| Pattern | Local | GitHub Pages | Correct? |
|---------|-------|--------------|----------|
| `./data/questions.json` | ✓ | ✓ | **Yes** |
| `images/q07-chest-xray.png` | ✓ | ✓ | **Yes** |
| `/data/questions.json` | ✓ | ✗ (resolves to root) | No |
| `https://...` | — | — | Only for external |

The app.js already uses `./data/questions.json` and the image src uses `images/...` (no leading slash). This is correct.

---

## Updating the App After Deployment

If you need to update questions, explanations, or the frontend:

```bash
# Make your edits locally, test with python3 -m http.server 8080, then:
git add docs/
git commit -m "Update: [describe change]"
git push origin main
```

GitHub Pages re-deploys automatically within ~60 seconds of a push to main.

---

## Sharing the App

The public URL is: `https://[USERNAME].github.io/SPEHX/`

- **Mobile:** Works in any mobile browser. Progress is per-device (localStorage is not synced).
- **Privacy:** The questions and answer key are publicly visible in the repository and the deployed JSON. This is expected for a personal study tool.
- **No login required:** The app is fully public and anonymous.

---

## Optional: Custom Domain

If you want `spex.yourdomain.com` instead of the github.io URL:

1. In GitHub Pages settings, add your custom domain
2. Create a `CNAME` file in `docs/` containing your domain: `spex.yourdomain.com`
3. Configure your DNS with a CNAME record pointing to `[USERNAME].github.io`

This is optional and not required for the app to function.
