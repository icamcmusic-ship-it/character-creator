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
a real category, seeded generation reproducing a character exactly, that rarity is
not a function of intensity, that a borrowed generator restores the presentation
locks it borrowed, and that budgets never modify a slot the user locked.

For content authoring there is also a load-time shape check: open the page with
`?dev=1` and every trait is validated for a well-formed id, section, category, name,
description, example, intensity, rarity tier and polarity vector, with any problems
named in the console. It costs a normal load nothing.

## Rarity

Rarity is an **authored** field with four tiers, and it answers a different question
from intensity:

| tier | meaning |
| --- | --- |
| `common` | Ordinary human behaviour. Texture, not identity. |
| `uncommon` | Noticeable. Not everyone does this, but nobody would remark on it. |
| `distinctive` | Specific enough that a reader would remember it about this character. |
| `signature` | Defines the voice. Two of these is a caricature. |

**rarity** is how many people are like this; **intensity** is how loudly it shows.
They used to be the same number wearing two hats — the badge tier was derived as
`rarity === "signature" && intensity >= 4`, which made rarity a pure function of
slider position and left a quiet signature trait impossible to express. The data was
migrated once (declared `common` split by intensity; the 4,742-entry declared
`signature` class split into signature / distinctive / uncommon), then a
hand-reviewed pass populated every tier-and-intensity combination so the two are
genuinely independent. From here rarity is plain data: correct it trait by trait in
the data files, no code change required.

## Budgets

Constraints say *what* can appear; budgets say *how much*. Both are enforced after
the draw, so neither distorts the weighting or the per-card `why?` explanations — a
budget adjusts the result and then tells you it did, in the insight panel and on the
card. Rarity caps limit how many cards of each tier land on one sheet; intensity
budgets cap total loudness per slot group. Slots you locked, pinned or required are
never modified but do spend the budget. A cap that cannot be met is reported as
unmet rather than silently dropped, which doubles as a way to find categories with
no quiet content to redraw into.

## Project structure

- `index.html` — page markup
- `css/style.css` — styles
- `js/data/traits-core.js` — the original hand-authored trait bank, one entry per line
- `js/data/traits-supplement.js` — the intensity-tail supplements (ids 90000+)
- `js/data/traits-situational.js` — the thirteen Situational pools (ids 110000+)
- `js/data/traits-tails.js` — Appearance depth and i1/i5 tail fill (ids 120000+)
- `js/data/traits-depth.js` — Need / Ghost / Defence and listening traits (ids 130000+),
  including the low-intensity depth pass that gave those three pools a quiet tail
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
