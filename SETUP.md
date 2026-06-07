# CoupleCash — Setup Guide

Step-by-step from zero. Follow in order.

---

## 1. Prerequisites

You need these installed locally. Skip the ones you already have.

| Tool | Why | Install |
|------|-----|---------|
| **Node.js 20+** | Runtime | https://nodejs.org/ (LTS) or `nvm install --lts` |
| **pnpm 9+** | Package manager | `npm install -g pnpm` |
| **Git** | Version control | https://git-scm.com/ |
| **VS Code** (optional) | Editor | https://code.visualstudio.com/ |

Verify versions:

```bash
node --version    # v20+ (this project uses v24)
pnpm --version    # 9+
git --version
```

You also need **free accounts** on:

- **Supabase** — https://supabase.com (database + auth)
- **GitHub** — https://github.com (repo hosting, needed for Vercel)
- **Vercel** — https://vercel.com (deploy, sign in with GitHub)

---

## 2. Install project dependencies

```bash
cd couplecash
pnpm install
```

This installs everything listed in `package.json`. Takes 30–60 seconds.

> If you see `ERR_PNPM_IGNORED_BUILDS` for `sharp` or `unrs-resolver`, that's
> fine to ignore for now. Run `pnpm approve-builds` later if you hit image
> optimization issues.

---

## 3. Create a Supabase project

1. Go to https://supabase.com and sign up / log in.
2. Click **New project**.
3. Fill in:
   - **Name**: `couplecash` (or anything)
   - **Database password**: generate a strong one, save it in a password manager
   - **Region**: pick the one closest to you (e.g. Singapore for Indonesia)
   - **Plan**: Free
4. Click **Create new project**. Provisioning takes ~2 minutes.

---

## 4. Wire up environment variables

Once your Supabase project is ready:

1. In Supabase dashboard, open **Project Settings → API**.
2. Copy these three values:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **anon public** key (long JWT string)
   - **service_role** key (long JWT string — keep this secret)

3. In the project root:

   ```bash
   cp .env.local.example .env.local
   ```

4. Open `.env.local` and paste in the values from Supabase.

> The `.env.local` file is gitignored. Never commit it.

---

## 5. Set up the database schema

1. Open Supabase dashboard → **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy ALL of it, paste into the
   editor, click **Run**. You should see `Success. No rows returned.`
3. Open a new query. Paste `supabase/seed.sql`, click **Run**.
4. Verify the seed worked:
   - **Authentication → Users** → you should see `abieka@couplecash.app`
     and `semma@couplecash.app`.
   - **Table editor → profiles** → 2 rows (`abieka` admin, `semma` member).
   - **Table editor → saving_goal** → 1 row.
5. If `seed.sql` errors on `auth.users` (column mismatch on a new Supabase
   build), follow the FALLBACK comments at the bottom of `seed.sql`.

### Re-running

Both files are idempotent. You can re-run them after edits — they use
`IF NOT EXISTS` and `ON CONFLICT DO NOTHING`. To wipe and start over, drop the
tables manually or use Supabase's "Reset database" button.

---

## 6. Run the dev server

```bash
pnpm dev
```

Open http://localhost:3000 — you should see the Day 1 placeholder with the
CoupleCash brand palette and Rp 0 cards.

> Uses Turbopack for fast HMR. If you hit a weird build error, try
> `pnpm dev --no-turbopack` to fall back to webpack.

---

## 7. Deploy to Vercel *(Day 29 — not yet)*

Skip until you're ready to share the app outside localhost.

1. Push the repo to GitHub (private repo recommended).
2. On Vercel, click **Add New → Project** and import the repo.
3. Add the three Supabase env vars in **Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain.
5. Deploy. Vercel auto-rebuilds on every push to `main`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `pnpm: command not found` | Run `npm install -g pnpm` first. |
| Port 3000 already in use | `pnpm dev -- -p 3001` or `lsof -ti:3000 \| xargs kill -9` |
| Tailwind classes not applying | Ensure `globals.css` is imported in `app/layout.tsx`. |
| Type errors after `pnpm install` | Restart the TS server in your editor. |
| Supabase "Invalid API key" | Re-check `.env.local` — no trailing spaces, full key copied. |

---

## What's next

Once the dev server is running, log in with `abieka` / `changeme` (admin) or `semma` / `changeme` (member), then change the passwords in **Settings**.
