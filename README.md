# 🌿 Gratitude Journal

**Write 3 things you're grateful for every day. Minimal, private, zero distraction.**

[Try it now →](https://davidma1973simu.github.io/gratitude-app/)

## Screenshots

<p align="center">
  <img src="screenshots/screenshot-login-zh.png" width="280" alt="Login (Chinese)" />
  <img src="screenshots/screenshot-login-en.png" width="280" alt="Login (English)" />
</p>
<p align="center">🔐 Email + password login · Bilingual toggle on login page</p>

<p align="center">
  <img src="screenshots/screenshot-filled-zh.png" width="280" alt="Writing entries (Chinese)" />
  <img src="screenshots/screenshot-main-en.png" width="280" alt="Main view (English)" />
</p>
<p align="center">✍️ Write 3 gratitudes · Auto-save drafts · Edit anytime before submit</p>

<p align="center">
  <img src="screenshots/screenshot-history-zh.png" width="280" alt="History view" />
</p>
<p align="center">📖 Browse and search all past entries ("Past Light")</p>

## What is this?

A minimalist gratitude journal that does exactly one thing well: lets you record three things you're grateful for each day. No ads, no social pressure, no gamification, no AI — just you and your light.

### Features

- **3 entries a day** — Write three gratitudes. Submit when at least one is filled.
- **Auto-save drafts** — Partial entries are saved as you type. Come back anytime.
- **Cross-device sync** — Log in once, your entries follow you across devices.
- **History ("Past Light")** — Browse and search all past entries.
- **Bilingual** — Toggle between Chinese and English on the login page.
- **PWA** — Install on your phone's home screen. Opens like a native app.
- **Offline-capable** — Works without internet. Syncs when you're back online.
- **Midnight reminder** — Gentle nudge one hour before midnight if you haven't written yet.

### Design philosophy

- **Minimal**: No unnecessary UI. White space is intentional.
- **Private**: Your data is yours. No analytics, no tracking, no ads.
- **Apple-style**: System fonts, clean borders, gentle animations.
- **Zero external dependencies**: No CDN, no frameworks, no third-party JS. One HTML file, everything included.

## Tech

- Single-file PWA: `index.html` contains all HTML, CSS, and JS
- Supabase (free tier) for auth + cloud storage via REST API (native fetch, no SDK)
- Service Worker for offline capability
- LocalStorage as primary cache, Supabase as cloud sync
- Row Level Security on database — each user can only access their own entries

## Versions

| Version | URL | Description |
|---------|-----|-------------|
| **v1** (stable) | `/gratitude-app/` | Core: daily entries, history, sync, i18n |
| **v2** (beta) | `/gratitude-app/v2/` | Adds: echo (past gratitude in submit modal), watermark light, emotional touch |

Both versions share the same Supabase backend — user data is identical.

## Getting started

1. Open the link above on your phone or computer
2. Enter your email + set a password (auto-registers on first use)
3. Write three things you're grateful for
4. Install as PWA: on Android, tap the install banner; on iOS Safari, tap Share → Add to Home Screen

## Self-hosting

```bash
git clone https://github.com/davidma1973simu/gratitude-app.git
# Serve the files with any static host (GitHub Pages, Netlify, etc.)
# To enable cloud sync, create a Supabase project and update SB_URL + SB_KEY in index.html
```

Supabase setup:
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-schema.sql` (see below)
3. In Authentication → Providers → Email, disable "Confirm email"
4. Update `SB_URL` and `SB_KEY` in `index.html`

```sql
CREATE TABLE entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  content1 TEXT, content2 TEXT, content3 TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own entries" ON entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own entries" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own entries" ON entries FOR UPDATE USING (auth.uid() = user_id);
```

## License

MIT — use it, modify it, share it. Just don't add ads.

---

*留住这束光 — Keep this light.*
