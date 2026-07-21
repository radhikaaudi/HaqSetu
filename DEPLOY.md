# 🚀 Deploying HaqSetu (single service on Render)

The backend now serves the built React app from the same origin, so the whole thing
deploys as **one web service**. Free, ~10 minutes.

---

## Model configuration
Set with **environment variables on the host** — no code change. HaqSetu runs on **OpenAI GPT-5.6**:
set `OPENAI_API_KEY` (your key) and `OPENAI_MODEL=gpt-5.6-terra`. The OpenAI account **must have a
billing balance**, or every request returns a clear quota error. Add ~$5 at platform.openai.com and
set a spending cap so a public link can never overspend.

---

## Step 1 — Push the code to GitHub

Your `.env` is gitignored, so your keys will NOT be pushed. From the project root:

```bash
git add -A
git commit -m "Deploy-ready: single service, real cited rules, security hardening"
```

Create an empty repo on github.com (e.g. `haqsetu`), then:

```bash
git remote add origin https://github.com/<your-username>/haqsetu.git
git branch -M main
git push -u origin main
```

(If you have the GitHub CLI: `gh repo create haqsetu --public --source=. --push`.)

---

## Step 2 — Create the Render web service

1. Go to **https://render.com** → sign up (free) → **New +** → **Web Service**.
2. **Connect your GitHub** and pick the `haqsetu` repo.
3. Fill in:
   - **Runtime:** Node
   - **Build Command:**
     ```
     npm install && npm --prefix web install --include=dev && npm run web:build
     ```
   - **Start Command:**
     ```
     npm run start
     ```
   - **Instance Type:** Free
4. **Add environment variables** (Advanced → Add Environment Variable):

   | Key | Value |
   |---|---|
   | `OPENAI_API_KEY` | *your key* |
   | `OPENAI_MODEL` | `gpt-5.6-terra` |

   > Do **not** set `PORT` — Render provides it automatically and the server reads it.

5. Click **Create Web Service** and wait for the build + deploy (a few minutes).
6. You'll get a URL like **`https://haqsetu.onrender.com`**. Open it — that's your live app.

---

## Step 3 — Test the live link
Open the URL, switch to **English**, click **Try Sunita's example → Show my rights**.
You should get the full dossier with the filled PDF.

---

## Important caveats (know these before you demo the link)
- **Cold starts:** the free tier spins down after ~15 min idle; the first request then takes
  ~50 seconds. **Open the URL once a minute before demoing**, or warn judges it's waking up.
- **OpenAI quota:** keep a billing balance and a spending cap on the account. If it hits 0, requests
  return a clear "credit balance is 0" message (not a crash), so it's obvious it's billing, not code.
- **Redeploys:** every `git push` to `main` auto-redeploys.
- Keep the recorded demo video as your primary — the live link is a bonus, not the main proof.

---

## If the build fails
- `vite: not found` → make sure the build command has `--include=dev` on the web install (above).
- `tsx: not found` → confirm `tsx` is under `dependencies` in the root `package.json` (it is now).
- App loads but API 500s → check the env vars are set correctly and the key has quota.
