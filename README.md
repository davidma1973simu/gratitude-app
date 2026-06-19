# 🌿 Gratitude Journal

**Write 3 things you're grateful for every day. Minimal, private, zero distraction.**

[Try V1 (stable) →](https://davidma1973simu.github.io/gratitude-app/) &nbsp;·&nbsp; [Try V2 (beta) →](https://davidma1973simu.github.io/gratitude-app/v2/)

---

## Why this exists

Most gratitude apps try to motivate you with streaks, badges, and reminders that feel like homework. This one doesn't.

Gratitude isn't a task. It's a frequency.

Every time you pause to notice something good — a warm coffee, a friend's message, sunlight on a wall — you're tuning yourself to a different frequency. Over time, this practice clears mental fog, steadies your mood, and yes, shifts what shows up in your life. Not magic. Just where attention goes, energy flows.

**No guilt. No catch-up. Today is always a new day.**

---

## Screenshots

<p align="center">
  <img src="screenshots/screenshot-login-zh.png" width="260" alt="Login (Chinese)" />
  <img src="screenshots/screenshot-login-en.png" width="260" alt="Login (English)" />
</p>
<p align="center">🔐 Email + password · Toggle 中文 / EN on login</p>

<p align="center">
  <img src="screenshots/screenshot-filled-zh.png" width="260" alt="Writing (Chinese)" />
  <img src="screenshots/screenshot-main-en.png" width="260" alt="Main (English)" />
</p>
<p align="center">✍️ Write 3 gratitudes · Auto-save drafts · Edit before submit</p>

<p align="center">
  <img src="screenshots/screenshot-history-zh.png" width="260" alt="History" />
</p>
<p align="center">📖 Browse past entries · Search by keyword</p>

---

## Features

### V1 (Stable)
- **3 entries a day** — One is enough. No pressure to fill all three.
- **Auto-save drafts** — Partial entries saved as you type. Come back anytime.
- **Cross-device sync** — Log in once, your entries follow you.
- **History ("Past Light")** — Browse and search all past entries.
- **Bilingual** — Toggle Chinese / English on the login page.
- **PWA** — Install on home screen. Opens like a native app.
- **Midnight reminder** — Gentle nudge at 11 PM (`🌙 The day is almost over. Anything you're grateful for?`)
- **Welcome back greeting** — If you've been away 2+ days: `欢迎回来，光一直在等你 ✦`

### V2 (Beta)
V2 keeps everything from V1, and adds emotional layers:

- **✨ Echo** — After submitting, a past gratitude fades in. A quiet reminder: *you've felt this before.*
- **💧 Watermark light** — On the home page, yesterday's (or a random past) gratitude appears as a faint watermark. Subtle. Poetic.
- **🌌 Reunion** — Click the watermark → full-screen immersive view. Past gratitude entries float in, one by one. A reunion with your past self.
- **📸 Keep this light** — Generate a beautiful image card of your gratitude. Share it. Let others feel the light too.

---

## Design philosophy

| Principle | What it means |
|-----------|----------------|
| **No guilt** | Missed a day? No problem. Today is a new day. No streaks, no badges, no "you're on a 3-day streak!" |
| **Minimal** | No unnecessary UI. White space is intentional. System fonts, clean borders, gentle animations. |
| **Private** | Your data is yours. No analytics, no tracking, no ads. |
| **Zero external dependencies** | No CDN, no frameworks, no third-party JS. One HTML file, everything included. Works in China. |
| **Energy-first** | This isn't "positive thinking." It's a daily ritual to clear your field and return to calm. |

---

## Tech stack

- **Single-file PWA**: `index.html` contains all HTML, CSS, and JS (~1,600 lines for V1, ~2,200 for V2)
- **Supabase** (free tier) for auth + cloud storage via REST API (native `fetch`, no SDK — critical for China where CDNs are blocked)
- **Service Worker** for offline capability + cache versioning
- **LocalStorage** as primary cache, Supabase as cloud sync
- **Row Level Security** — each user can only access their own entries

---

## Versions

| Version | URL | Status |
|---------|-----|--------|
| **v1** | `/gratitude-app/` | ✅ Stable — core features |
| **v2** | `/gratitude-app/v2/` | 🧪 Beta — emotional layers |

Both share the same Supabase backend — your data is identical in both.

---

## Getting started

1. Open the link above on your phone or computer
2. Enter your email + set a password (auto-registers on first use)
3. Write something you're grateful for — one sentence is enough
4. Install as PWA: on Android, tap the install banner; on iOS Safari, tap Share → Add to Home Screen

---

## Self-hosting

```bash
git clone https://github.com/davidma1973simu/gratitude-app.git
# Serve the files with any static host (GitHub Pages, Netlify, etc.)
# To enable cloud sync, create a Supabase project and update SB_URL + SB_KEY in index.html
```

**Supabase setup:**
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL below
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

---

## For Product Hunt

> **Gratitude Journal** — A minimalist daily gratitude app that helps you tune your frequency, not track a streak.
>
> Most gratitude apps gamify the practice — streaks, badges, "don't break the chain." This one does the opposite. No guilt, no catch-up. Just three things, one sentence each, whenever you remember.
>
> **The worldview:** Gratitude isn't positive thinking. It's a daily ritual to clear your mental field, steady your mood, and return to calm. Over time, this shifts what shows up in your life. Not magic. Just: where attention goes, energy flows.
>
> **V2 adds:** emotional echoes of past entries, watermark light on the home page, and a shareable "Keep this light" image card.
>
> Free. Private. No ads. No signup friction. Works offline. PWA — install on any device.

---

## License

MIT — use it, modify it, share it. Just don't add ads.

---

*留住这束光 — Keep this light.*
