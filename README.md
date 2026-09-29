# Character Voice Generator

Axis-based, per-trait conflict-aware, intensity & rarity-weighted character voice
generator drawing from a bank of several thousand speech, vocabulary, grammar,
mannerism and psychology traits. Generate single characters, compare
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
all — from any session. Every build, seeded or not, runs against an **empty session
history**: nothing from earlier rolls (the Avoid-recent window, the divergence category
tally) reaches the draw, so a seed is a pure function of itself. Kept cards travel with a
share link for the same reason: they are seated before anything is drawn.

Leaving the box blank is **exploration**. History does its work in the *choice* between
candidates rather than inside the draw: the build draws three, and keeps the one least
like your recent characters and the project archive (see best of three, below), which is
what stops a long session converging on one person. The seed printed is the winner's.

Rerolls stay deliberately un-seeded — a reroll is you overriding the dice.

Exploration also runs **best of three**: a blank-seed build draws three candidates on
three sub-seeds and keeps the one least like the project's archived characters (and the
sheet on screen), among those within 12 coherence points of the best. The long-horizon
per-project category tally (derived from the archive) is a term in that choice, not a
weight inside the draw — so every candidate is a pure function of its own seed, and the
seed printed is the *winner's* seed, which replays it exactly. A pasted seed skips the
candidate step entirely. Lenses and the new sheet options are settings, not history:
the same seed under the same lenses and toggles gives the same sheet.

## Keeping output fresh (audit §5)

- **Compositional voice lines.** Each Voice lab line is a clause template for the
  speech act and the sheet's lean, filled from a topic pool of roles, things, places and
  times (never personal names), the active lenses' own topics and noun phrases lifted
  from the sheet's vocabulary examples, then reshaped by the grammar and verbosity cards
  (compression, fillers, false starts, afterthoughts, echoes, cut-ins), hedges, ellipsis,
  tense habits, tag questions and contractions. Every transform names its rule. **10
  lines** under any situation shows ten takes. Measured over 100 characters: 124 → ~640
  distinct lines of 700; the lie prompt 13 → ~94 distinct. Author prompts compose the
  same way through the situation they are "like".
- **Seated contradictions** (Advanced, on by default). One or two axes are chosen before
  the draw; afterwards a trait against the sheet's actual lean on that axis is seated
  with a Contradiction Functions card saying what it is for, and its scene questions
  (what it is for, when, with whom, what changes, the cost) are answered from the sheet.
- **Variable sheet shape** (on by default). A seeded signature budget gives one or two
  defining profile sections a second card, drops one thin section, and sets 0–3
  outliers. 40 seeds give ~6 sheet sizes and ~37 shapes, where every sheet used to be 42
  slots in one shape.
- **Divergence within categories.** When "Surprise me" diverges a draw, the proximity
  kernel is flattened too, not only the category choice.
- **Lenses.** Eight settings (court, frontier, corporate, diaspora, military,
  online-native, clergy, sci-fi) and seven life stages (child, adolescent, early career,
  parent, midlife, late life, dying), combinable. Each bundles category multipliers
  (sharing the context rules' cap), a register nudge, preferred `worldTags` (a soft
  ×1.5 / ×0.6 on the trait draw) and taboo topics kept out of the voice lines. Cards
  read "normal here" or "deviant here" against the active lenses.
- **Backstory beats.** The motivation chain is laid out in time: formative event, what
  they took from it, turning point, most recent failure, where it stands now — each tied
  to a seated card and dated from the age field when there is one.

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

Destructive actions outside the sheet — removing a cast member, deleting a save,
replacing the cast from a file, importing a workspace — show a toast with an **Undo**
button instead of (or as well as) a confirm.

## Files, sharing and keyboard

* **File ▾ → Open file…** reads the `format` stamp every export carries and routes the
  file to the right importer: character, cast, workspace, archetype library or backup.
  The same menu exports each of those, the markdown sheet, and an **LLM prompt** — a
  condensed markdown voice spec with sample lines, for pasting into a system prompt.
* **Copy share link** puts the seed and the settings that shaped the build in the URL
  hash (`#share=…`). Opening the link replays that character once, then clears the hash.
* **Compare** on a saved character lays it beside the current sheet slot by slot; the
  saved list can be searched and sorted.
* **Why does this feel familiar?** lists traits recurring across your recent characters,
  each with a one-click ban.
* Trait cards are focusable: **R** tosses and **L** keeps the focused (or hovered) card.
  **Ctrl/⌘+Enter** generates, **Ctrl/⌘+Z** undoes, **Shift+Ctrl/⌘+Z** / **Ctrl+Y**
  redoes, **?** opens help. None of them fire while you are typing or a dialog is open.
* The service worker is network-first (the cache is the offline fallback), so a deploy
  appears on the next load and never mixes files from two builds; a deploy that lands
  during a session offers a **Reload** toast.

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
cells each category populates, and how much of each Motivation pool is
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
  Mannerisms 21% — against 100% for the seven profile sections and 75%
  for Personality. Across those sections (about seven slots on a default sheet)
  the sliders currently choose the category and the dice
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

## What the sheet knows beyond the cards

The cards are the character at rest. Six layers read across them.

**Context.** The sheet has a lens above it: baseline, in public, in private, under
authority, under threat. Every seated card is classed active, amplified, suppressed or
an exception for the chosen room, and says which rule decided it. A trait's own
`conditions` and `exceptions` outrank everything else; after that come the section, the
trait's visibility and persistence, the character's internal dimensions, and its
polarity on the axes that room tests. Nothing is redrawn — the baseline sheet is the
character, and a context is a way of reading it. The markdown export names the room.

**The chains.** The motivation cards are linked rather than listed: want → belief →
origin → need → strategy → method → fear → counterweight → stakes, each link naming the
card it reads from. The pressure sheet runs trigger → how they read it → first move →
where it tips → afterwards → how they repair it, grounded in the attachment, stress,
values and Recovery & Repair cards rather than asserted.

**The contradiction.** The strongest opposed pair on one axis, with the four things a
scene needs: when the second face appears, with whom, what actually changes, and what it
costs. Derived where the data allows and left as a prompt where it does not; your
answers are saved and exported.

**Dimensions.** Intensity was doing four jobs, so frequency, visibility, persistence and
narrative salience are now separate, shown on each card as `F… V… P… S…` and spelled out
on hover. Where the bank authors them they are used as written; elsewhere they are
inferred from the section and the chip says so.

**Arc.** An ordered event log over the sheet as generated. An event names the belief it
challenged, the choice and the cost, and carries a shape — growth, deterioration,
steadfast, cyclical — from which it proposes a few trait changes, each explained.
Nothing applies until you accept it, one change at a time. Undoing an event replays the
whole arc from the baseline rather than inverting an edit, so the result is exact.

**Voice lab.** Seven situations — refusing, apologising, persuading, concealing,
requesting, asking for help, lying — answered in the character's voice and annotated
with the rules that shaped each line. There is a pressure mode, which strips the
politeness layer and brings the stress response in, and a cast view that puts one
situation to every member and marks the devices more than one of them reaches for.
These are demonstrations of shape, not publishable prose.

**Another take** composes every line again from the same sheet. The line seed covers the
sheet's traits, the prompt's position and a take counter, so a take can be reproduced
and two prompts never share a seed. Under **Add your own situation** you can write your
own prompt ("Turning down the captain") and pick the built-in situation it should be
composed like. Author prompts are saved with the current project; without a project
they last for the session.

**Voice collisions.** The Relationships tab shows a heatmap of every cast pair. Each cell
counts the devices and rules the two members share across all prompts, including your
own. **De-collide** rerolls the member with the highest total, keeping their name and
axis posture. It keeps the new version only if the cast's total goes down, and an Undo
toast brings the old one back.

**Retire for this project** (⏸ on a trait card) is softer than a ban. It cuts the trait's
weight in new characters to 15% but never removes it. The retired list is stored with
the current project and follows it when you switch projects. Replaying a seed ignores
it, so a seed always rebuilds the character it named.

**Arc timeline export** (Arc panel → Export timeline) downloads markdown with one
section per event: the belief tested, the choice, the cost and the changes you
accepted. Each section also shows how the pressure sheet moved after that event. Every
step uses the same pressure sub-stream, so a slot shows as changed only when the sheet
under it changed.

## Casts, relationships and projects

**Relationship workspace.** Cast members can be joined by directed edges carrying trust,
dependence, standing, obligation, and what each one knows, wants and conceals about the
other. The numbers start populated from both sheets — attachment style, the trust
dimension, the assertiveness gap, the other's contradiction and wound — and every field
is yours to overwrite. Eight named roles (rival, mentor, protégé, confidant, dependant,
antagonist, ally, the ex) will also generate a new member built to sit opposite an
anchor, with the edge recorded. Edges travel in the cast JSON and markdown, are
validated on import, and are dropped when a member leaves.

**Cast seats and distinct voices.** A generated cast is optimised jointly: after the
roll, the member who shares the most voice devices with the others is rerolled (a few
attempts per pass, seeded off the cast seed) and kept only if the cast's shared-device
total drops. The seed readout reports the before/after; the "Distinct voices" checkbox
turns it off. Each card carries a seat — Leader, Foil (furthest from the leader), Comic
relief, Heart, Skeptic, Wildcard — read off Role, Humor, Attachment and the axis
profile, with the reason on hover.

**Foils** get a premise built from the source sheet: the foil who lives as if the
source's Lie were false, who was there for the Wound and chose other Values, who wants
the same thing by the same door. The generic premise list is the fallback.

**Relationship web.** "Add both directions" creates A→B and B→A together, asymmetric by
construction: statuses mirror (mentor/protégé), and whichever side leans in harder
(anxious attachment, lower self-assurance, more warmth) is given more dependence and a
different trust. Below the edges, the web draws the whole cast and lists factions
(components of positive edges; shared Values when there are no edges yet), triads judged
by structural balance ("R1 likes both R0 and R2, who cannot stand each other") or as a
broker, shared secrets (two people who "know" something about the same third) and
lopsided pairs.

**Pressure ladder and recovery.** The Under Pressure panel shows three stages —
irritated, cornered, broken — each built from named cards (first tell, stress response,
the line in Values, the Defence, then the Lie, attachment and vice), with the current
pressure dial highlighted, followed by a recovery sheet: first hours, who they go to,
what helps (the Need), what grounds them, what does not help, how they repair it, and
the story they tell afterwards. Both go into the markdown export.

**Arcs read the event.** The belief/choice/cost text is matched against the Lie, Want,
Need, Defence, Fear, Values and Price by shared content words, and the choice's verbs
imply a shape ("lied" reads as deterioration). A choice about the Want loosens or
tightens it; crossing a line in Values moves Values to its opposed category; touching
the Need thins the Defence. Steadfast is no longer inert: Values deepen one step and a
named cost becomes the Price they are paying. Arc templates (fall & recovery,
corruption in three steps, positive change, steadfast, disillusionment) add a whole
sequence written from the sheet, each step proposed against the sheet as the previous
steps would leave it; every change still starts unaccepted.

**Tier, lens, wildcard and label derivation.** Personality traits whose names have the
shape of a learned behaviour ("Receipt-keeper", "Praise-fishing") are tagged secondary
by rule (`tierSource: "derived"`), so `tierWeight` now covers ~520 traits instead of 55.
The context lens reads each card's own text and category for its room (strangers, home,
rank, work, danger, exhaustion) and falls back to axis- and section-level conditions,
cutting "no rule moves it here" from about half of a sheet to about 5%. The wildcard's
"survives because" is composed from the exception and the loudest trait it cuts
against. Emergent archetype labels draw on larger word tables and can borrow a word
from the sheet's own loudest traits. All of this lives in `js/mechanics.js`.

**Project library.** A project groups the characters, casts, edges, arc events, settings
and diversity archive of one book or campaign, beside the flat saves rather than
replacing them. A backup bundle carries every project and every saved character to
another machine. On the way back in it shows a merge preview first: what is new, what is
identical, and — one by one, with which copy is newer — what would be overwritten.
Nothing is written until you choose, per entry, and anything unchosen keeps the local
copy.

## Content packs and the studio

The bank ships as packs with non-overlapping id ranges. Turning one off under **Content
packs** removes its traits from every draw; core is always on, and a toggle that would
empty the draw is refused. The choice travels with exports and saved settings.

`tools/studio.js` is the author-facing side, reading the live bank through the same
loader the tests use and writing nothing:

```bash
node tools/studio.js validate               # schema, axis tables, cross-links, duplicate names
node tools/studio.js coverage --n=25        # the rarity x intensity heatmap, thinnest first
node tools/studio.js nearest "a phrase"     # what already exists near an idea
node tools/studio.js review --pack=life     # what is unreviewed, and where
node tools/studio.js preview --pack=life    # generate with core plus one pack only
node tools/studio.js packs                  # the manifests and their id ranges
node tools/studio.js suggest-pol --section=Humor --n=20   # polarity proposals for untagged traits
node tools/studio.js families --min=0.4     # cluster similar traits into proposed conceptFamily names
node tools/studio.js worldtag               # worldTags / conditions / exceptions coverage by section
node tools/studio.js scaffold "Taps the table twice" --section=Mannerisms --category="Micro-Physical Tics" --pack=cells
```

`suggest-pol` bases each proposal on the trait's nearest tagged neighbours in its
section. It proposes an axis only when those neighbours agree on its sign. `families`
proposes joining an existing family when a cluster already touches one, and flags a
cluster that spans two families. `scaffold` prints a trait literal with the next free
id in the pack, the section and category checked against the bank, a polarity
proposal and the nearest existing traits. None of these commands writes to the bank.

**Engine seams.** The engine can run with no DOM. `setEngineSettings({divergence,
wildcardToggle, wildcardCount, pressureLevel, rangeFocus, ...})` or
`withEngineSettings(obj, fn)` supplies values by control id, and any id the object
leaves out is still read from the page. A build's steering state (avoid set, context
bias, motivation links, archetype profile, affinity vector, replay mode) is one draw
context. `captureDrawContext()` reads it, `withDrawContext(ctx, fn)` applies it and
restores it afterwards, and `buildCharacterState({..., drawContext})` builds inside it.
Speculative builds restore the whole context. Context rules apply in a fixed order: a
tag you switched off, then a negated match, then text rules, then age rules. The
combined per-category multiplier is clamped to 0.2–4×, and a personality nudge to ±36.

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
- `js/data/traits-tails.js` — i1/i5 intensity tail fill (ids 120000+)
- `js/data/traits-depth.js` — Need / Ghost / Defence and listening traits (ids 130000+),
  including the low-intensity depth pass that gave those three pools a quiet tail
- `js/data/traits-balance.js` — polarity and archetype balancing fill (ids 140000+)
- `js/data/traits-cells.js` — rarity x intensity cell fill for the thinnest categories (ids 160000+)
- `js/data/traits-polarity.js` — the axes the bank leaned on hardest, answered (ids 161000+)
- `js/data/traits-life.js` — competence, positive origins, goals, ordinary texture,
  recovery, contradiction functions and role by context (ids 170000+)
- `js/engine.js` — indexes, tagging passes, the weight matrix, and every pick path
- `js/generate.js` — seeded generation, reroll, pins, undo, scoring
- `js/render.js` — the sheet, exports, imports, toasts
- `js/mechanics.js` — cast seats and joint voice optimisation, sheet-built foil premises, relationship web, pressure ladder and recovery, arc reading and templates, derived tiers/lens conditions/wildcard rationale/label words
- `js/app.js` — storage, cast, relationships, foil, UI wiring
- `sw.js` — service worker: network-first with an offline precache of the whole shell
- `tools/studio.js` — the content studio: validate, coverage, nearest, review, preview, packs
- `tests/` — the test harness and suite; `tests/bank-report.js` is the measurement dashboard
- `package.json` — no build step; it exists to pin the browser-test dependency

The bank used to live on a single 1.4MB line inside `js/app.js`, which made the file
unopenable in several editors and every content change an unreviewable diff. It is
now one trait per line across the data files above; the scripts are plain classic
scripts loaded in order, sharing one global scope, so there is still nothing to build.

## Never-allowed features

Permanently out of scope. Do not implement or propose these (see `CLAUDE.md`):

- **Name generator.** Names stay user-entered free text.
- **Appearance generator and Appearance section.** No appearance section, traits, sliders or generation.
