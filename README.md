# Character Voice Generator

Axis-based, per-trait conflict-aware, intensity & rarity-weighted character voice
generator drawing from a bank of thousands of speech, vocabulary, grammar, and
mannerism traits. Generate single characters, compare casts for voice collisions,
and model relationship dynamics — all client-side, no build step required.

## Live site

Deployed via GitHub Pages: `https://<owner>.github.io/character-creator/`
(enable Pages under **Settings → Pages → Source: GitHub Actions** if not already set).

## Local development

This is a static site — no build tooling needed.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Project structure

- `index.html` — page markup
- `css/style.css` — styles
- `js/app.js` — trait bank + application logic
