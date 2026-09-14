# The Archive

Your personal desktop-style archive of links, photos, and notes — organized
into folders, accessible from any browser, private behind a PIN.

This README is written assuming you're new to coding — terms like
"environment variable" or "CLI" are explained the first time they come up.

---

## 1. What's in this project (a one-line map)

```
app/                     — every page and API route (Next.js "App Router")
  page.js                — the home/"desktop" view (your top-level folders)
  folder/[id]/page.js    — a folder's contents (subfolders + items)
  login/page.js          — the PIN entry screen
  api/                   — server endpoints the browser talks to (create item, search, upload, etc.)
components/              — reusable pieces of UI (folder tiles, item cards, the quick-add "+" button, ...)
lib/db.js                — every database query, in one file
lib/auth.js              — the PIN-gate logic
scripts/init-db.js       — a one-time script that creates the database tables
proxy.js                 — checks you're logged in before every page loads
```

Every file has comments explaining what it does and why — open any of them
and read along.

---

## 2. Local development (running it on your own computer)

**A "CLI" is just a text-based program you type commands into** — on a Mac
that's the Terminal app.

### One-time setup

1. **Install Node.js** if you don't have it: go to
   [nodejs.org](https://nodejs.org), download the "LTS" version, and run the
   installer. This gives you the `node` and `npm` commands.
2. Open Terminal, go to this project folder, and install the project's
   dependencies (the external code libraries it relies on, like Next.js
   itself):
   ```
   cd /Users/shovalfransis/Desktop/projects/Archive
   npm install
   ```
3. Follow **Section 3 (Deploying)** first, at least up through creating your
   Vercel project, Postgres store, and Blob store — local development uses
   the *same* real database and photo storage as production (there's no
   separate local database to set up, which keeps things simple).
4. Once your project is created on Vercel, connect this folder to it and
   pull down its settings:
   ```
   npx vercel link
   npx vercel env pull .env.local
   ```
   `npx vercel` runs the Vercel CLI without installing it globally.
   `vercel link` connects this folder to your Vercel project. `vercel env
   pull .env.local` downloads your **environment variables** — these are
   just named secrets (like your database connection string and your PIN)
   that the app reads at runtime instead of having them hard-coded in the
   source code — into a file called `.env.local`. Next.js automatically
   loads that file, and it's already excluded from git via `.gitignore` so
   your secrets never get committed.
5. Create the database tables (only needs to be done once):
   ```
   npm run init-db
   ```

### Every time you want to work on it

```
npm run dev
```

Then open **http://localhost:3000** in your browser. Changes you make to
the code appear immediately — no need to restart.

---

## 3. Deploying (so you can reach it from your iPhone, Mac, and PC)

Everything below happens on [vercel.com](https://vercel.com) and takes
about 10 minutes the first time.

### Step 1 — Create a free Vercel account

Go to [vercel.com/signup](https://vercel.com/signup) and sign up (signing up
with your GitHub account is easiest, and Vercel is free for personal
projects like this).

### Step 2 — Push this project to GitHub

Vercel deploys from a GitHub repository. If you don't already have one:

1. Create a new repository at [github.com/new](https://github.com/new)
   (call it `the-archive`, keep it **Private**).
2. In Terminal, in this project folder:
   ```
   git add .
   git commit -m "Initial version of The Archive"
   git branch -M main
   git remote add origin <the URL GitHub gave you>
   git push -u origin main
   ```

### Step 3 — Import the project into Vercel

1. In the Vercel dashboard, click **Add New… → Project**.
2. Choose your `the-archive` GitHub repository and click **Import**.
3. Leave the build settings as-is (Vercel detects Next.js automatically)
   and click **Deploy**. This first deploy will fail — that's expected, we
   haven't set up the database or your PIN yet. Continue to the next steps.

### Step 4 — Add a Postgres database

Vercel's storage is now provisioned through its **Marketplace** — a
directory of add-on services (databases, storage, etc.) that plug into
your project. The one we want is **Neon**, a managed Postgres provider
(this is what "Vercel Postgres" itself runs on today). A plain SQLite file
wouldn't survive here — serverless hosting wipes any files the app writes
to disk on every deploy — so a real hosted database like this is what
keeps your data safely between deploys.

1. In your project on Vercel, open the **Storage** tab.
2. Find **Neon** (Serverless Postgres) and click **Install** / **Create**.
3. Follow the prompts — choose the free plan, name the database anything
   you like — then make sure it's **connected to your project** (the
   Storage tab will show it linked, with an option to pick which
   environments it applies to; leave all of them checked).
4. This automatically adds a `DATABASE_URL` environment variable to your
   project — you don't need to type it in anywhere.

### Step 5 — Add Blob storage (for photos)

1. Still in the **Storage** tab, create a **Blob** store (Vercel's own
   file-storage product — separate from the Neon database you just added).
2. Connect it to your project the same way. This adds a
   `BLOB_READ_WRITE_TOKEN` environment variable automatically.

> Vercel's dashboard changes its exact wording/layout now and then — if a
> button doesn't match exactly what's described here, look for "Storage"
> in the project's side navigation and you'll find both of these.

### Step 6 — Set your PIN and secret key

1. Go to your project's **Settings → Environment Variables**.
2. Add:
   - `ARCHIVE_PIN` — the PIN you'll type to unlock the app (e.g. `4829`).
   - `AUTH_SECRET` — any long random text (e.g. mash your keyboard for 30
     characters). This is used to cryptographically sign your login
     session so no one can fake being logged in without knowing your PIN.
3. Click **Save** for each.

### Step 7 — Create the database tables

Back on your computer (with `.env.local` pulled as in Section 2):

```
npx vercel env pull .env.local
npm run init-db
```

This connects to your real, deployed database and creates the `folders`
and `items` tables. You only need to do this once.

### Step 8 — Redeploy

Back in Vercel, go to the **Deployments** tab and click **Redeploy** on
the latest deployment (now that the environment variables and database
exist, it will succeed this time).

### You're done

Vercel gives you a URL like `the-archive-yourname.vercel.app` — open it on
your iPhone, Mac, or PC, enter your PIN, and start saving things. Any
future change you push to GitHub (`git push`) redeploys automatically.

---

## 4. Accounts you'll need, summarized

| Where | Why | What to click |
|---|---|---|
| [vercel.com](https://vercel.com) | Hosting, database, and photo storage | "Sign Up" → connect GitHub |
| [github.com](https://github.com) | Where your code lives, so Vercel can deploy it | "New repository" |

That's it — no other accounts are needed.
