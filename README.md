Sources: package + routes + modules + mileage GPS + schedule smart input :contentReference[oaicite:1]{index=1}

---

# 3) `VersedUP/README.md` (Write → polish → compile → share)
```md
# VersedUP — Scripture → Structured Post → Share

VersedUP helps you turn a verse + a quick reflection into a polished, share-ready post.
Designed for **fast daily posting** (TikTok/IG/email/text), with optional AI and OCR.

## What you can do
- Write devotionals with a guided structure (Title / Reflection / Prayer / Questions)
- Pull KJV passages via `bible-api.com` or jump to YouVersion search
- Optional AI polish (OpenAI or Gemini) — keys stored locally
- Optional OCR flow via your own Vercel OCR endpoint (Google Vision recommended)
- Compile output per platform with character limits (TikTok/IG/email/generic)
- One-click share helpers:
  - Copy caption
  - Open TikTok upload
  - Open email draft (mailto)
  - Open SMS draft
  - Share to Facebook / X
- Export a PNG preview (via `html-to-image`)

---

## Tech Stack
- React + Vite + Tailwind
- `html-to-image` for PNG export
- OCR hook support (recommended: Google Vision behind a Vercel endpoint)

---

## Run Locally
```bash
npm install
npm run dev
