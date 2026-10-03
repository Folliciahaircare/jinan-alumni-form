# JNU HK Alumni Association — Membership Application Form

Static, bilingual (繁體中文 / English) 4-step membership form. No build step, no dependencies.

- `index.html` — the form
- `css/style.css`, `js/form.js` — styling and logic
- `js/config.js` — **the only file you normally edit** (endpoint, fee, contact, payment details, logo path)
- `assets/logo.svg` — placeholder; replace with the real logo (or change `LOGO` in config.js)

Preview locally: `python3 -m http.server 8765 --bind 127.0.0.1` → http://127.0.0.1:8765/

Embed on the live site: upload the folder (e.g. to `/join/`) or link to it from the "Join" page.
Backend setup and decisions: see `~/Claude/jinan/README.md`.
