# Bug audit round 2 - /home/user/character-creator (READ-ONLY audit)
(Work in progress; appended incrementally. CONFIRMED = reproduced by script; CODE-READ = from reading only.)

## Lead-confirmed (K1-K4)
- K1 (CONFIRMED by lead) js/engine.js WEIGHT_MATRIX (~L2228): 24 duplicate keys (no-dupe-keys); later silently replaces earlier; ~45 intended cross-links never fire (all stress:*->repair, attachment:Anxious->manner Emotional Affectations / vocab Temporal Orientation, humor:Self-Deprecating->manner Emotional Affectations, vices:Compulsion & Ritual->manner Micro-Physical Tics, role:Leader->grammar Turn-Taking, attachment:Secure->role Leader/Connector, humor Warm & Playful). Script: scratchpad/dupkeys.js. Fix: merge duplicate entries; add eslint no-dupe-keys / a test that asserts no dup keys.
- K2 (CONFIRMED by lead) `node_modules` symlink (-> /opt/node22/lib/node_modules) committed in HEAD (7df0dbf); .gitignore `node_modules/` does not match a symlink. Fix: git rm --cached node_modules; ignore `node_modules` (no slash).
- K3 (CONFIRMED by lead) index.html: no CSP meta, Google Fonts from CDN, no manifest/theme-color.
- K4 (lead) app.js:3538-3542 reassigns function declarations (generateCast, generateFoil, generateGapFiller, analyseRelationship, checkEnsembleBalance) -> to be assessed below.

## Notes carried over from interrupted run (CONFIRMED unless CODE)
N1 "They reads it" - pressureChain APPRAISAL_BY_ATTACHMENT engine.js:6374-6403: 300/300 sheets with pressure. (scan1.js+rx.js)
N2 "The the role they play leaks" render.js:1455 (icx roles already start with "the"): 75/1250
N3 "that That they are the reasonable one" engine.js:7602 asReportedBelief + trait names "That ..."; also 6403 raw ${lie.trait}
N4 "Which is the the {thing} business" engine.js:7859 + pools returning "the X"
N5 hyphen slugs raw in pressureTrigger engine.js:6166-6168, 6399, inner-conflict render.js:1455, voice rules "grammar: Restart-on-eye-contact": 1015 hits
N6 "<i>(...)</i>" HTML in example data leaks as literal tags in markdown export; sheetToHTML escapes
N7 escAttr (JS-string escaper) used in plain HTML attrs: app.js:1013,1228 (edge/arc inputs show \'), 4261 slider-set option value (sets with apostrophe can't load/delete), 1392 render.js jump select, 771/774/957/1222/1226/1280/1305/1425/1717, render 213/446/456/457/884/915
N8 retire-for-project has no effect on builds (REPLAY_MODE true) engine.js:1851; tooltip render.js:509 / toast app.js:1401 claim "rarer in new characters"
N9 help text index.html:71 "Avoid recent softly penalises ..." stale
N10 (CODE) copyVoiceLab/voiceLabToMarkdown ignore reroll+meta (app.js:1355, render.js:1531) -> verify
N11 label-nbsp spacer labels (8); group-heading <label> without control (a11y, low)
N12 (CODE) dispatcher _runAction globalThis[name] unrestricted (defense in depth)

## New findings (this run)

### R1 [MEDIUM, CONFIRMED] rerollSlot throws TypeError instead of showing "Nothing left to draw" toast
- js/generate.js:1034 (`return firstUnseated || (cand && !seated.has(cand.trait.id) ? cand : null);`)
- drawFresh's loop `break`s when `!cand.trait` (pool empty -> pickers return {trait:null}); the tail expression then dereferences `cand.trait.id` with `cand` non-null but `cand.trait` null. The graceful path at ~L1103 (`!replacement.trait` -> toast "Nothing left to draw...") is therefore unreachable for exactly the case it was written for.
- Repro (node): scratchpad/bugs/t_reroll.js - generate seed rr1, add a card's category to bannedCategories, rerollSlot(that slot) -> "Cannot read properties of null (reading 'id')". Throws for manner*, vocab*, prof_*, verbosity (pers_/grammar/register ok). Browser: ban a category (Ban chip) then press Toss on a card of that category; also hit by the Playwright monkey (monkey_11.log, i=135, 221: "That didn't finish: Cannot read properties of null (reading 'id')" toast + console error; rerollGroup also fails midway through its forEach, leaving the section partly rerolled with history entries pushed).
- Fix: `return firstUnseated || (cand && cand.trait && !seated.has(cand.trait.id) ? cand : null);`

### K4 assessment [INFO, CODE-READ]
app.js:3529-3543 wrapGeneratorsWithBoundary is a deliberate wrapper (documented in comment). It works because classic deferred scripts make the function declarations global bindings, and dispatcher reads `globalThis[name]` after reassignment; withRng uses try/finally so a thrown build doesn't leak the RNG. Only caveat: guard returns undefined, so any future caller that uses the return value must null-check; the stack is only in console. Not a bug. (rerollSlot/rerollGroup etc. are not covered by the boundary, hence R1 surfaces via the generic _runAction toast.)

### R2 [LOW-MEDIUM] Voice Lab "Copy" / export markdown does not match what is on screen after "reroll lines"
- js/app.js:1355-1358 copyVoiceLab -> js/engine.js:7180 voiceLabToMarkdown(st, mode) calls `voiceLab(st, mode)` with no `reroll` and no `meta`; the panel (render.js renderVoiceLab, copyVoiceLine app.js:~1350) uses `voiceLab(state, voiceLabMode, voiceLabReroll, charMeta)`. render.js:1516-1517 (markdown export "## Voice lab") has the same omission.
- CONFIRMED (n10.js, 40 seeds): reroll=1 text differs from reroll=0 in 40/40 sheets -> after pressing "reroll" the user copies lines that are NOT the ones displayed (and the single-line copy is different from the whole-lab copy). `meta` is forwarded only to innerConflictLeak (meta.contradictionAnswers) so the meta mismatch shows only when contradiction answers are set (CODE-READ).
- Fix: give voiceLabToMarkdown(st, mode, reroll, meta) and pass voiceLabReroll/charMeta from both call sites.

### R3 [HIGH, CONFIRMED] Stored/imported XSS: trait names are interpolated unescaped into #warnBox
- js/render.js:1416 (`checkConflicts`): `${f.text}` (built at js/engine.js:3527 from `"${a.trait}" and "${b.trait}" ...`) and `${f.tierNote}` go into `box.innerHTML` unescaped.
- A character JSON whose slots carry ids not in the live bank ("orphans" - render.js:2108-2146 keeps the embedded trait text as-is) gets arbitrary HTML into the DOM when two such traits conflict. CONFIRMED with Playwright (xss_exec.js): importing a sheet whose trait names are `<img src=x onerror=window.__pwn=...>` executes the handler (window.__pwn = 83 after import); xss3b.js/xss4.js likewise inject 84/134 elements, all under `div#warnBox > ul > li`. Delivery: attacker shares a .json "character sheet"; also reachable from any other path that restores embedded trait copies (saved library/localStorage backups, cast import - same orphans mechanism). With no CSP (K3) there is no second line of defence, and `_runAction` dispatches `globalThis[name]` (N12), so an injected `data-act="eval"` is also a gadget.
- All the other sinks exercised (cards, why-panels, voice lab, cast, relationships, arc, foil, gap-filler, tooltips, toasts, markdown/HTML export) escaped correctly in the same run (xss1-4: only warnBox leaked). Meta name `'><img ...>` and saved-name toasts were escaped (xss1/xss2).
- Fix: `escHTML(f.text)`, `escHTML(f.tierNote)` in render.js:1416 (and escape `a.trait`/`b.trait` at the source, or have the engine return plain text); additionally validate imported trait objects (type-check strings, or drop orphans' text and re-derive from a placeholder), add the CSP in K3, and restrict _runAction to a whitelist of known action names (N12).

### R4 [MEDIUM, CONFIRMED] Import "validates before commit" is incomplete: some malformed files throw AFTER the sheet/settings were replaced
- js/render.js:2096-2186 importCharacterJSON (commit block starts at `snapshotHistory(); state = nextState; ...`), js/render.js validateSheetPayload; restoreSettings (app.js).
- Evidence (pw_import.js -> pw_import_results.json, Playwright): these crafted files show toast "Could not import: ..." but the open sheet HAS been replaced by the file's sheet (status=file): `settings.favouriteTraitIds = 5` ("number 5 is not iterable"), `settings.rerollExclusions = {a:5}` (same), `charMeta.lenses = "court"` ("charMeta.lenses.map is not a function"). After the lenses case the corrupt charMeta is baked into history, so a later Undo/Redo throws the same TypeError (follow.undo = "TypeError: charMeta.lenses.map is not a function"), i.e. undo is stuck on a poisoned snapshot. The in-code comment ("Everything above could throw; nothing below can") is therefore false.
- Also accepted without type checks (no crash seen, cosmetic): `charMeta.name = {a:1}` -> toast "Imported [object Object]" and name field "[object Object]"; `charMeta.name = 42`; `favouriteTraitIds = "abc"` accepted.
- Fix: extend validateSheetPayload to type-check charMeta (strings for name/age/context/archetypeLabel/lenses[] of strings/shape/exploration), settings.favouriteTraitIds (array of numbers), settings.rerollExclusions (object of arrays); wrap the commit block in try/catch that restores `_snapshotNow()` taken beforehand (as applyShareFromHash already does).
- Validated OK (rejected cleanly or harmless): prototype pollution via `__proto__` in rarityCaps (rejected; Object.prototype.polluted undefined), version string, charVariants bad, 4044 slots, bad pressureState slot, orphan traits with missing/typed-wrong desc, arcEvents junk, slider garbage, unknown traitNotes/pinnedTargets keys.

### R5 [MEDIUM, CONFIRMED] A saved-character record with no `state` bricks generation until reload
- js/app.js:327-390 loadSavedCharacter (+ decodeSavedRecord app.js:292-318; validateSheetPayload treats `state` as optional).
- `state = rec.state` assigns `undefined`, charMeta/pressure/etc. are overwritten, and THEN `arcBase = ... JSON.parse(JSON.stringify(state))` throws ("\"undefined\" is not valid JSON"), so the catch toast says "Could not load that character" while the globals are already clobbered. Afterwards `renderSheet()` throws "Cannot convert undefined or null to object" and the next Build throws in generate.js:864 `Object.keys(state)`; the page needs a reload (Undo may recover, not tested).
- Repro (corrupt3.js, Playwright): localStorage `cc_storage:character:NoState` = `{"charMeta":{"name":"q"}}`, call loadSavedCharacter('NoState'), then runGeneration() -> console TypeError at generate.js:864. importCharacterJSON does not have this problem (`staged.state || {}`, render.js:~2131).
- Related (LOW): `{"state":"abc"}` loads as a 3-slot junk sheet and toasts "Loaded"; `{"format":"x","state":5}` / `state:[]` loads as an EMPTY sheet (current character replaced) with a success toast. decodeSavedRecord never checks `format`/type of `state`.
- Fix: in decodeSavedRecord require `rec.state` to be a plain object (throw otherwise) before any global is touched; `state = rec.state || {}`; check format string.
- Corrupt localStorage otherwise handled well: prefs (garbage/array/null/wrong types), project, archetype and character garbage never threw at startup and a build still worked (corrupt.js, corrupt2.js); unparseable saves give a toast "Could not load that character: ..." (but with raw JSON.parse messages).

### R6 [LOW-MEDIUM, CONFIRMED toasts / CODE-READ partial apply] Workspace import: no rollback, raw TypeError messages, some bad fields silently accepted
- js/app.js:2738-2790 importWorkspaceJSON: `snapshotHistory(); restoreSettings(...)` with no try/rollback (contrast applyShareFromHash app.js:4057+, which restores on failure). Playwright (pw_ws.js): `constraints.exclusivePairs=5` -> "Could not import workspace: (c.exclusivePairs || []).map is not a function"; `bannedCategories='abc'` -> "...(c.bannedCategories || []).filter is not a function"; `categoryTiers=7`; `disabledPacks=5` -> "number 5 is not iterable"; `sections:{id:null}` -> "Cannot read properties of null (reading 'on')". `rarityCaps='x'` and `sliders='x'` are accepted silently ("Imported your constraints..."). An orphan history snapshot is pushed on every failed import (hist grows), and restoreSettings may have applied the fields processed before the throwing one (CODE-READ - order dependent).
- Fix: run validateSheetPayload-style checks on p.settings (the same structural validator the character import and share link use) before snapshotHistory; wrap restore in try/catch that restores prevSettings.

### R7 [LOW, CONFIRMED] "Reset to Defaults" leaves some settings untouched
- js/app.js:2259-2312 resetAllToDefaults; button title (index.html:623) says "every slider, toggle, constraint and budget".
- Playwright (reset2.js / pw_reset.js): after Reset the disabled content pack ("life") is still disabled, the slider lock checkbox (`lock_pers_friendliness`) is still checked (its slider is reset to 0), the favourited trait is still favourite, and prefs are re-saved with those values (savedPrefsDisabledPacks ["life"], savedLocked, savedFavs). Cast and saved characters also persist (arguably intended). Lens selection could not be checked reliably.
- Impact: user thinks they are back at factory state but a pack is silently off (so seeds replay differently from a fresh user's: "disabledTraitsDrawn 0" - packs change the pool). Fix: clear packs + locks (setDisabledPacks([]), uncheck input[id^=lock_]) or say what is kept in the toast.

### R8 [LOW, CONFIRMED] Loading a pre-v2 save flips the global engine-version default and persists it
- pw_engv2.js: saving a character without `settings.fields.engineVersion` then loading it sets the Engine select to "1"; every later build is `v1-...` and prefs persist `engineVersion: "1"` (a fresh user gets v2). pw_engv.js: a returning user whose prefs lack engineVersion also silently builds v1 (back-compat), and Reset sets v1 default ("def":"1") for returning users. Replay of the old save needs v1, but the user's *next* new characters should not be pinned to the legacy engine without a visible notice. Fix: restore engineVersion for the replay only, or toast "this save uses engine v1; new characters keep using v2".
- R8 addendum (CONFIRMED, pw_engv.js r3): `#engineVersion` is `<input type="hidden" value="2">` (index.html:110). For type=hidden, setting `.value` rewrites the *attribute*, so `defaultValue` becomes whatever restoreSettings last wrote (render.js:1695 writes '1' for any settings block lacking engineVersion). resetAllToDefaults then reads `el.defaultValue` (app.js:2284) and "resets" to '1': afterReset seed `v1-...`, `defaultValue === "1"`. So once a user has loaded one old save/link, "Reset to Defaults" can never return them to engine v2 until reload. Fix: add `engineVersion: String(DEFAULT_ENGINE_V)` to DEFAULTS.fields (app.js) so Reset does not rely on defaultValue.

## Text-splice and wiring findings from the interrupted run, re-verified this run (counts from texts1.json = 300 sheets, pressure ON, seeds s0..s299 alternating v1/v2; texts2.json = 1250 sheets mixed settings)
Script: verify_n.js

### S1 [MEDIUM, CONFIRMED] "They reads it ..." (N1) - subject/verb disagreement in the Pressure chain "How they read it" stage
- js/engine.js:6374-6379 APPRAISAL_BY_ATTACHMENT values are 3rd-person singular ("reads it as ..."); js/engine.js:6403 builds `They ${a}`. Pronoun is "they", so output is ungrammatical on every sheet that has an attachment trait + pressure chain.
- Frequency: 300/300 sheets (texts1, stress on), 86/1250 (texts2). Example [s0]: `1. **How they read it.** They reads it as a problem to solve, not a verdict on them, because underneath they still ...`; [v2-ba5xf6]: `They reads it as the first sign of being left`.
- Fix: store the verb phrase in plural/base form ("read it as ...", "read it two ways at once and act on whichever arrives first" - note the Disorganized entry has a second verb "acts" that must also change to "act").

### S2 [LOW-MEDIUM, CONFIRMED] "The the role they play leaks meanwhile" / "The the defence leaks" (N2)
- js/render.js:1455 template `The ${icx.loser.role.toLowerCase()} leaks meanwhile.` (end of the inner-conflict line); the role labels ("the role they play", "the defence") already begin with "the".
- Frequency: 121 hits in 116/300 sheets (texts1), 75 hits in 73/1250 (texts2). [v2-ba5xf6]: `under load fear takes over, when it costs enough. The the role they play leaks meanwhile.`; [v1-x9tlqy]: `The the defence leaks meanwhile.`
- Fix: drop the literal "The " or capitalise the role string only.

### S3 [LOW, CONFIRMED] "hold that That they are the reasonable one" (N3)
- js/engine.js:7602 (`that ${asReportedBelief(lie)}`) and js/engine.js:6403 (`still hold that ${lie.trait}` raw) - several Lie trait names begin "That ..." or are quoted ('I have to...'); asReportedBelief does not strip a leading "That ". 7 hits/7 sheets (texts1), 3/1250 (texts2). [s2]: `underneath they still hold that That they are the reasonable one. (from: Generous-interpreter, That they are the reasonable one)`.
- Fix: strip /^that\s+/i in both places (reuse asReportedBelief at 6403).

### S4 [LOW, CONFIRMED] "Which is the the {thing} business all over again" (N4)
- js/engine.js:7859 template `"Which is the {thing} business all over again."` while topic pools can already return "the X" ("the parking tickets", "the shipment"). 10 hits in 7/300 sheets, 7 hits in 5/1250 in texts2. [s6] `Which is the the parking tickets business all over again.`; [v1-nu1psf] `Which is the the shipment business all over again.`
- Fix: template `"Which is {thing} business..."` with article-bearing pool entries, or strip a leading "the " from {thing} for this template only.

### S5 [MEDIUM, CONFIRMED] Raw hyphen-slugs of trait names appear in prose (N5)
- Trait ids/labels stored as slugs ("Ridiculed-for-a-dream", "I-have-to-earn-my-...", "Embarrassed-cheek-touch") are interpolated into sentences and rule lists: pressureTrigger engine.js:6166-6168 and 6399 ("Anything that looks like Ridiculed-for-a-dream, especially when it rhymes with ..."), inner-conflict render.js:1455, voice-rule lines ("grammar: Restart-on-eye-contact", "mannerism: Embarrassed-cheek-tou...").
- Frequency: 1300 hits in 189/300 sheets, 1093 hits in 166/1250. Examples: [s0] `grammar: Trust-anchor phrase — a filler anchors the line; mannerism: Embarrassed-cheek-tou...`; [v2-ba5xf6#html] `especially when it rhymes with Ridiculed-for-a-dream . Underneath it, they are still working from 'I don't deserve ...'`.
- Fix: de-slug (replace "-" with " " and lowercase first letter) at the single point where trait names enter sentence templates, or store natural names.

### S6 [LOW, CONFIRMED] Literal `<i>(...)</i>` tags in markdown/plain exports (N6)
- Example text data contains HTML (`"Mildly inconvenient. <i>(The house had burn...)</i>"`), shown as escaped text `&lt;i&gt;(...)` in sheetToHTML and as literal `<i>` in markdown/prompt exports. Search: texts2.json "[v1-i3in5d#html]". Fix: strip tags from example strings in the plain/markdown exporters, or render <i> via a whitelist in HTML.

### S7 [LOW, CONFIRMED] escAttr (JS-string escaper) used in plain HTML attributes (N7)
- engine.js:8330 escAttr = escHTML(backslash/apostrophe-escaped). Right for inline-JS onclick, wrong for ordinary attributes: names with `'` or `\` show a visible backslash. CONFIRMED in pw_backup.js: `data-conflict` attr value `O\'Brien`. app.js:1013,1228 (edge/arc inputs show \'), app.js:4261 slider-set `<option value>` (a saved slider set whose name contains an apostrophe cannot be loaded or deleted because the value no longer matches), render.js jump-to-section select 1392 (`<option value="${escAttr(t)}">`), plus 771/774/957/1222/1226/1280/1305/1425/1717 in app.js and render.js 213/446/456/457/884/915 (titles/aria-labels). Not exploitable (HTML-escaped as well). Fix: use escHTML for attribute values that are not JS.

### S8 [LOW, CONFIRMED] Retire-for-project has no effect on any build (N8)
- js/engine.js:1850-1852 retirePenalty() returns 1 when REPLAY_MODE is true, and every build runs in replay mode (generate.js:763 comment, 787, 806; app.js:603/684 for casts). Test (t_retire.js): retire 2209 traits that appeared across 60 seeds, then 60 blank-seed builds: 1950/3360 slots drawn are retired traits vs 1957/3360 with nothing retired. Yet the tooltip (render.js:509 "drawn far less often in new characters") and toast (app.js:1401 "rarer in new characters") promise otherwise, and the retired set is persisted with the project.
- Fix: apply the penalty in the exploration candidate scoring (selectDistinctCandidate) rather than inside the per-trait weight, or remove the feature/copy.

### S9 [LOW, CODE-READ/CONFIRMED text] Stale help copy (N9)
- index.html:71 "Avoid recent traits softly penalises anything drawn in your last few characters" - since builds run in replay mode with empty history the penalty only affects candidate choice among the three exploration candidates (generate.js:763-775). Reword.

### S10 [LOW] a11y (N11)
- 8 spacer `<label>&nbsp;</label>` (index.html lines 337,423,487,512,528,852,904,922) and 3 group-heading labels with no control (247, 251, 269); `#fileMenuInput` has aria-hidden + no accessible name (hidden file input - fine). Tabs roles ok (3 tablist/3 tabpanel), no img without alt, no target=_blank without rel, no positive tabindex.

### S11 [LOW, CODE-READ -> confirmed reachable only via injection] Action dispatcher accepts any global function name (N12)
- js/app.js:2362-2365 `_runAction`: `const fn = name && globalThis[name]; if (typeof fn !== 'function') ...; fn.apply(null, _actionArgs(...))`. `data-act="eval"` + `data-args='["..."]'` (or "setTimeout", "Function", "alert") is a ready-made gadget for any HTML injection (see R3), since args come from JSON in the attribute. Fix: whitelist (a Set of registered action names, e.g. built from a literal object) instead of globalThis lookup.

## Previously-fixed items re-verified (partial - only what was exercised; B1-B26/T1-T5 not individually walked)
Verified HOLDING (no regression seen):
- `node tests/run.js`: 307 passed, 0 failed.
- Seed replay determinism, v1 and v2, under randomised sliders/toggles/lenses/constraints: explicit-seed replay mismatch 0/150 and printed-seed mismatch 0/150 (fz_seed.js, node). Share-link round trip in a fresh browser context: 24/24 identical sheets (and pressure sheets) with random sliders, toggles, bans, required traits, disabled pack, locked cards, engine v1/v2 (share_rt.js). 
- Content packs: each of 13 packs and "all but core" switched off: 0 exceptions, 0 empty slots, 0 disabled-pack traits drawn, 0 bad text over 30 seeds each (fz_packs.js).
- Constraint fuzz (fz_cons.js, 150 random bans/requires/pairs/tiers/caps/packs/modes): 0 duplicate trait ids, 0 required-missing, 0 exclusive-pair violations, 0 exceptions. Reported hits were checked and are NOT bugs: "target out of range" = req_* slots have no target (harness false positive); "undefined" text = legitimate word in trait 98321; rarity-cap overruns occur only when the caps sum below the slot count and are reported as `unmet` in getBudgetReport (infeasible by construction). One edge: a required trait whose category is also banned seats (required wins; seed v2-c133) - informational, no warning seen.
- Undo/redo integrity: 400 random ops (reroll, pin, build, lockAll, unlockAll, unpinAll) - undo restored the exact prior signature and redo the exact post-state every time (undo_fuzz.js); the only "no history entry" case is single-card Lock, which the code documents as intentionally not undoable. No duplicate trait ids after rerolls.
- Arc replay (fz_arc.js: 504 events, 1524 changes, 913 accepted): no exceptions. Cast builder (fz_cast.js, 720 texts): no exceptions.
- Prototype pollution via import (`__proto__` in rarityCaps / slot keys): rejected or inert; Object.prototype.polluted stays undefined (t_import.js).
- Handler wiring (static1.js): 0 duplicate ids in index.html (214), all 114 data-act names in HTML and all 69 literal actAttr() names have a defined function, only literal getElementById miss is `savedNone` (created dynamically, app.js:483).
- Corrupt localStorage (prefs/project/archetype/character garbage): app starts and builds normally in all 10 variants (see R5 for the one record shape that does damage).
- XSS: all sinks tested escape except #warnBox (R3). Names/notes/author text/cast names with `<img>`/`'><` payloads, import and saved-character paths: no execution except via R3.
- Monkey runs: 3 x 1500 random UI actions (monkey_11/22/33) and 2 x 700 advanced-mode runs (monkeyadv_101/202): the only page error found is R1 (rerollSlot/rerollGroup); deCollide "Could not find a version that collides less" warnings are expected UX.

NOT verified (labelled, not dropped):
- Save -> Load full-state round trip (save_rt.js timed out in the browser, likely a dialog/await loop in my script; inconclusive). Import-file round trip of a normal sheet was verified indirectly (pw_import.js "status=file" for valid variants).
- Individual B1-B26 / T1-T5 regressions were not each re-run; only the areas above were spot-checked.
- Relationship/foil/pressure/voice-lab builders were exercised by fz_cast/xss4 (no exceptions) but not by hundreds of seeds with text scans beyond texts_cast.json (720 texts; nothing new beyond S1-S5).
- Lens selection reset (R7) and partial application on failed workspace import (R6) are CODE-READ.

## Severity index
HIGH: R3 (XSS via imported trait names, CONFIRMED), K1 (dead WEIGHT_MATRIX links), K2.
MEDIUM: R1 (reroll TypeError), R4 (import commits before failing), R5 (saved record without state bricks Build), S1 ("They reads it", 300/300 pressure sheets), S5 (slugs in prose), K3.
LOW: R2, R6, R7, R8, S2-S4, S6-S11, K4 (not a bug).
