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

There is also an end-to-end run in a real browser for the things a DOM stub cannot
answer — that the declarative event dispatch actually dispatches, that no inline
handler has crept back in, that the dark palette resolves, and that the whole app works
under a Content-Security-Policy with no `'unsafe-inline'`:

```bash
npm install                 # node_modules is gitignored; the browser is pinned in package.json
python3 -m http.server 8111 &
node tests/browser.mjs http://localhost:8111          # behaviour
CSP=1 node tests/browser.mjs http://localhost:8111    # ...and under script-src 'self'
```

The browser suite also carries the replay matrix: every combination of divergence,
depth-first, wildcard and pressure is generated with a blank seed, and the seed the app
prints is pasted back and expected to reproduce both sheets exactly.

## What a seed promises

A seed the app prints replays the character it names — base sheet, pressure sheet and
all — from any session. Pasting a seed puts the build in **replay mode**, which runs
against an empty session history, so the history-aware mechanisms (Avoid recent traits,
and the side of Surprise me that refuses to land where it has already landed) have
nothing to remember.

Leaving the box blank is **exploration**: that build *does* take the session's recent
characters into account, which is what stops a long session converging on one person.
The two modes are the same generator over the same seeded stream; only the history
differs.

Rerolls stay deliberately un-seeded — a reroll is you overriding the dice.

## Generation order

Single characters, batch candidates, casts, foils and the gap-filler all run the same
pipeline and finish through the same function (`finalizeSheet`, `js/engine.js`), in one
stated order:

1. protected intent is seated first — the locked cards carried over from the outgoing
   sheet, so everything after solves against what you kept;
2. pins redraw within their own category toward the pinned intensity;
3. budgets constrain the mutable remainder, counting the protected slots against the
   caps rather than ignoring them;
4. named requirements go in last among the seating passes, so a quantity can never
   evict a trait you asked for by name;
5. exclusivity resolves whatever the passes above put next to each other;
6. an independent audit re-derives the budget report **from the committed sheet**, so
   an unmet cap is always the truth about what is on screen, and a duplicate trait id
   is reported rather than shipped.

Contradictory hard rules (requiring two traits you also marked never-together, or
requiring a trait whose category is banned) are reported before a generation rather
than arbitrated silently inside one.

## What the diagnostics mean

- **Coherence** is a pure function of the sheet. It derives its evaluation context from
  the character's own traits, so moving an unrelated control — or generating somebody
  else — cannot change an existing sheet's score.
- **Archetype fidelity** is reported as two numbers, because they answer different
  questions: *direction* is the share of the archetype's axes that the sheet actually
  leans the way the archetype asked, over the axes the sheet expresses at all;
  *strength* is how loudly it leans, measured against the strongest expression this
  trait bank produces. Self-generated samples of the built-in presets read around 85%
  direction; the same presets with every control opposed read around 15%.
- **The profile preview** is a simplified conditional preview, not the generator's own
  probabilities: it takes the most likely category at each step and conditions the next
  on it, and it models neither the divergence mixture nor the archetype slider blend.
  The panel says so.
- **Pool headroom** on a card counts what is reachable *inside that slot's current
  intensity window*, and separately tells you how many more a looser precision setting
  would reach.
- **The pressure sheet** is derived from the base sheet at generation time. Edit a card
  afterwards and it says it is out of date instead of quietly describing an earlier
  version of the character.

## Undo, and what it covers

A snapshot is the whole workspace: sheets, metadata, pressure state, sliders, pins,
notes, presentation variants, constraints and budgets. Generations, rerolls,
step-backs, loads, imports, note edits, pin changes and bulk lock sweeps are all
undoable. A single card's lock is deliberately not — its own button toggles it straight
back.

## Saving

Saves are compressed by trait id and carry a compact tombstone alongside each id, so a
trait later removed from the bank degrades to an orphan with its text intact rather
than vanishing from a character you saved months ago.

If the browser will not store data (private mode, blocked site data), the app says so
before you save and labels the save as session-only — it does not report an ordinary
success and lose your work on reload.

They assert the things the UI states out loud and the things that have actually
broken before: no duplicate ids or trait names, no duplicate example lines inside a
category, both poles of every axis populated within 25% of each other, every
polarity axis represented on both sides, the intensity mapping invertible (so the
"active range" printed on each card is true), every weight-matrix fragment matching
a real category, seeded generation reproducing a character exactly, that rarity is
not a function of intensity, that a borrowed generator restores the presentation
locks it borrowed, and that budgets never modify a slot the user locked.

They also assert the properties whose absence let real bugs live for a long time:
that no whole-sheet consumer throws on a slot holding `trait: null`; that every
axis-keyed table agrees with `AXIS_LABELS` in both directions (a one-character typo
made every rebelliousness contradiction unreachable, silently, for the entire life of
that table); that rarity's dependence on intensity, measured as Cramér's V, stays
below a ratchet rather than merely occupying every cell; that the fixed-category slots
still return a real range of traits at default settings; that Motivation & Wound
actually moves the categories downstream of it and does not decide them; and that the
archetype presets push every axis in both directions.

More recent additions, each of which is a bug that shipped:

* A saved character survives the **compress → validate → expand** round trip. Saves are
  stored by trait id, and both readers validated the compressed payload *before*
  expanding it — so every character this app saved threw on load, while file
  export/import (which writes uncompressed state) worked fine and the one validation
  test, built from a raw `buildCharacterState`, could not see it.
* The service worker's precache list matches the scripts and stylesheets `index.html`
  actually loads. It was two data files short.
* The live profile preview and the picker it predicts agree, by making a category
  preference that only the shared weight formula can see and asserting the preview
  moves. They had drifted: the preview applied neither category tiers nor context bias.
* Archetype profile hints name categories that exist, and nudge the draw without
  deciding it.
* Humour actually changes on the pressure sheet, and each of the four stress responses
  points it somewhere different.
* No profile category dominates *or* starves its section — with a band tight enough to
  see it, and a separate check for a section leaning as a group, which a per-category
  band cannot.

### Authoring content

There is a load-time check for anyone editing the trait data: open the page with
**`?dev=1`** and every trait is validated for a well-formed id, section, category, name,
description, example, intensity, rarity tier and polarity vector, and every axis-keyed
table is checked against `AXIS_LABELS` in both directions, with any problems named in
the console.

Shape is the easy half. The commoner failure in a bank this size is content that is
well-formed and *missing*, so the same flag also reports coverage: polarity tagging per
section, per-axis pole balance, category size, how many of its 20 (rarity × intensity)
cells each category populates, and how much of each Motivation and Appearance pool is
actually reachable at default settings. Those are grouped and warned, never thrown —
they say "this section is thin", not "this build is broken". It costs a normal load
nothing. The app links to it from its own footer.

The trait bank lives in `js/data/`. Each file is a flat array pushed onto `TRAITS`, so
adding content means adding a file, appending its `TRAITS.push(...)`, and listing it in
`index.html` and in `ENGINE_FILES` in `tests/harness.js`. Ids are allocated in blocks
per file (see the header comment in each) so two files can never collide.

When adding traits, the two axes should be independent — and are not yet. Measured,
rarity's dependence on intensity is Cramér's V = 0.651 against a 0.66 test ceiling, so
rarity is still about two thirds a restatement of intensity: `distinctive` is 92%
intensity-3, `signature` is 88% intensity 4–5, `common` is 91% intensity 1–2. Every cell
is occupied, which is what the test asserts, but the off-diagonal mass is small. A
`signature` trait at intensity 1 is a rare, quiet habit and is exactly the kind of entry
the bank is short of: roughly 400 more quiet-signature (i1–i2) and 300 more loud-common
(i4–i5) entries would let the ceiling come down to 0.55 and then 0.45.
`node tests/run.js` prints the live bank composition on every run and will fail if
rarity starts collapsing further back onto intensity.

### The content debt, measured

Three gaps in the data are tracked as ratchets in `tests/run.js` — the suite fails if
any of them gets worse, and closing one means moving its number down. `?dev=1` reports
the same set in the browser, per category, for whoever is editing the files.

* **Polarity coverage.** `polarityFit` is what lets a slider *combination* reach an
  individual trait rather than only a category. It needs a `pol` tag to select on, and
  four sections mostly do not have one: Vocabulary 34% tagged, Dialogue Grammar 33%,
  Mannerisms 21%, Appearance 18% — against 100% for the seven profile sections and 75%
  for Personality. Across those sections (about seven of 37 slots on a default sheet,
  plus every Appearance card) the sliders currently choose the category and the dice
  choose the trait. Those traits are also invisible to `axisProfile`, the radar,
  conflict detection and the Relationship/Ensemble analysers, for the same reason.
* **The (rarity × intensity) grid, per category.** On average a category populates 10.7
  of the 20 cells it could; the thinnest fill 8 while holding 52–59 traits. This is the
  per-category form of the Cramér's V figure above: within one category you cannot ask
  for "a quiet, defining Loyalty-Bound trait", because that cell is empty even though
  both the rarity and the intensity exist elsewhere in the section.
* **One-sided axes.** Five polarity axes lean hard: formality 72% positive, analytical
  thinking 69%, physical energy 64%, self-confidence 38%, volume/wordiness 38%.
  `polNormalise` stops these reading as posture on the radar, but it cannot fix the
  draw — `polarityFit` still has thin material when those sliders point the minority way.

`tierWeight`'s core/secondary distinction is in the same category: it is driven by a
hand-reviewed list of 55 names out of 2,257 Personality entries, so at 2.4% coverage the
mechanism is real but barely exercised. Broadening it is a data pass; the distinction is
semantic and a regex was tried and removed for consistently mislabelling dispositions
as symptoms.

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
hand-reviewed pass populated every tier-and-intensity combination. That made the two
*expressible* independently; it has not yet made them independent (see the measurement
under "Authoring content" above). From here rarity is plain data: correct it trait by
trait in the data files, no code change required.

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
- `package.json` — no build step; it exists to pin the browser-test dependency

The bank used to live on a single 1.4MB line inside `js/app.js`, which made the file
unopenable in several editors and every content change an unreviewable diff. It is
now one trait per line across the data files above; the scripts are plain classic
scripts loaded in order, sharing one global scope, so there is still nothing to build.
