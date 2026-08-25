# Character Voice Generator

Axis-based, per-trait conflict-aware, intensity & rarity-weighted character voice
generator drawing from a bank of several thousand speech, vocabulary, grammar,
mannerism, psychology and appearance traits. Generate single characters, compare
casts for voice collisions, and model relationship dynamics — all client-side, no
build step required.

## Live site

Deployed via GitHub Pages: `https://<owner>.github.io/character-creator/`
(enable Pages under **Settings → Pages → Source: GitHub Actions** if not already set).

## Local development

This is a static site — no build tooling needed.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Tests

Invariant tests for the trait bank and the generation engine. No framework and no
install step; they load the same script files the browser loads, in the same order,
into one shared scope.

```bash
node tests/run.js
```

They assert the things the UI states out loud and the things that have actually
broken before: no duplicate ids or trait names, no duplicate example lines inside a
category, both poles of every axis populated within 25% of each other, every
polarity axis represented on both sides, the intensity mapping invertible (so the
"active range" printed on each card is true), every weight-matrix fragment matching
a real category, and seeded generation reproducing a character exactly.

## Project structure

- `index.html` — page markup
- `css/style.css` — styles
- `js/data/traits-core.js` — the original hand-authored trait bank, one entry per line
- `js/data/traits-supplement.js` — the intensity-tail supplements (ids 90000+)
- `js/data/traits-situational.js` — the thirteen Situational pools (ids 110000+)
- `js/data/traits-tails.js` — Appearance depth and i1/i5 tail fill (ids 120000+)
- `js/data/traits-depth.js` — Need / Ghost / Defence and listening traits (ids 130000+)
- `js/engine.js` — indexes, tagging passes, the weight matrix, and every pick path
- `js/generate.js` — seeded generation, reroll, pins, undo, scoring
- `js/render.js` — the sheet, exports, imports, toasts
- `js/app.js` — storage, cast, relationships, foil, UI wiring
- `sw.js` — service worker, caches the shell so the bank isn't refetched every visit
- `tests/` — the test harness and suite

The bank used to live on a single 1.4MB line inside `js/app.js`, which made the file
unopenable in several editors and every content change an unreviewable diff. It is
now one trait per line across the data files above; the scripts are plain classic
scripts loaded in order, sharing one global scope, so there is still nothing to build.
