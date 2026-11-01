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
lib/ai.js                — the OpenRouter auto-sort agent (folder + tags + summary)
migrations/              — numbered SQL files that build up the database tables, in order
scripts/migrate.js       — runs any migrations your database hasn't had yet
tests/                   — automated checks for the trickier logic (`npm test`)
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
5. Create the database tables:
   ```
   npm run migrate
   ```
   (Safe to run any time — it only does what hasn't been done yet. See
   "Changing the database later" below.)

### Every time you want to work on it

```
npm run dev
```

Then open **http://localhost:3000** in your browser. Changes you make to
the code appear immediately — no need to restart.

### Checking your work

```
npm run lint     # looks for common mistakes in the code
npm test         # runs the automated tests in tests/
npm run build    # makes sure the app still builds, like Vercel will
```

### Changing the database later (migrations)

The tables are defined by the numbered files in `migrations/`
(`001_init.sql`, `002_...`, ...). Your database remembers which ones it has
already run (in a table called `schema_migrations`), so:

- `npm run migrate -- --status` lists what's applied and what's pending,
  without changing anything.
- `npm run migrate` runs only the pending ones. Each file runs all-or-nothing:
  if something in it fails, none of that file's changes are kept.
- To change the schema, **add a new file** with the next number (for example
  `003_add_pinned.sql`). Never edit a file that has already run on your real
  database.
- Vercel does **not** run migrations when it deploys. Run
  `npm run migrate` yourself (with `.env.local` pulled) before deploying code
  that needs the new tables or columns.

If your database was created before migrations existed (with the old
`npm run init-db`), that's fine — `001_init.sql` only creates what's
missing, so running `npm run migrate` on it is safe. (`npm run init-db` still
works too; it now just runs the migrations.)

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
   - `ARCHIVE_PIN` — the PIN you'll type to unlock the app. **Use at least
     6–8 digits** (e.g. `48293716`), not 4. After 5 wrong tries, a visitor is
     locked out for 15 minutes, but a short PIN still has far fewer
     combinations to guess. Letters work too — the app accepts any text.
   - `AUTH_SECRET` — long random text, **at least 24 characters** (in
     Terminal, `openssl rand -base64 32` makes a good one). The app won't
     run if it's missing, too short, or still the example value. This is used to cryptographically sign your login
     session so no one can fake being logged in without knowing your PIN.
     A login lasts 90 days on each device. **Changing `AUTH_SECRET` (or the
     PIN) logs out every device at once** — handy if you lose a phone.
3. Click **Save** for each.

### Step 6.5 — Set up the AI auto-sort agent (optional)

When you save a link or photo without picking a folder yourself, the app
asks an AI model — via **OpenRouter** (openrouter.ai), a single API that
gives you access to many different AI models with one key — to decide
which folder it belongs in (creating a new one if nothing fits), and to
write a short summary and a few tags for it.

1. Go to [openrouter.ai](https://openrouter.ai) and sign up.
2. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and create a new
   key. Add a small amount of credit (a few dollars goes a very long way
   with the cheap model this app uses by default).
3. Back in your Vercel project's **Settings → Environment Variables**, add:
   - `OPENROUTER_API_KEY` — the key you just created.
4. Click **Save**.

This step is optional — if you skip it, "Let AI sort it" just files things
into an "Unsorted" folder instead of failing.

### Step 7 — Create the database tables

Back on your computer (with `.env.local` pulled as in Section 2):

```
npx vercel env pull .env.local
npm run migrate
```

This connects to your real, deployed database and creates the `folders`
and `items` tables. Run it again whenever a new file appears in
`migrations/`.

### Step 8 — Redeploy

Back in Vercel, go to the **Deployments** tab and click **Redeploy** on
the latest deployment (now that the environment variables and database
exist, it will succeed this time).

### You're done

Vercel gives you a URL like `the-archive-yourname.vercel.app` — open it on
your iPhone, Mac, or PC, enter your PIN, and start saving things. Any
future change you push to GitHub (`git push`) redeploys automatically.

### Saving from your phone or browser

Open the **☰** menu → **Save from anywhere…** for one-time setup of:

- a **bookmarklet** for computers (one click saves the page you're on),
- the **share menu on Android** (install the app from Chrome first),
- an **Apple Shortcut** for iPhone/iPad (iPhones don't let web apps appear
  in the share menu, so a Shortcut does the job instead).

All three open `/add?url=…`, which saves the link and lets the AI file it.
If you're logged out, you'll be asked for your PIN and then sent right back.
Links built on that page contain a private key; if you change your PIN,
redo the setup (old links will still work, but ask "Save this?" first).

---

## 4. Accounts you'll need, summarized

| Where | Why | What to click |
|---|---|---|
| [vercel.com](https://vercel.com) | Hosting, database, and photo storage | "Sign Up" → connect GitHub |
| [github.com](https://github.com) | Where your code lives, so Vercel can deploy it | "New repository" |

That's it — no other accounts are needed.
