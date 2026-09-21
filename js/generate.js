/* ================= SEEDED / REPRODUCIBLE GENERATION =================
   A seed string makes the entire generation deterministic: same seed + same
   settings = same character, shareable as text. Implemented by swapping
   rand() at a seeded PRNG for exactly the duration of the build —
   every pick path already routes through rand(), so nothing is missed.
   Rerolls are intentionally NOT seeded: a reroll is you overriding the dice. */
function hashSeedString(s){
  let h = 2166136261 >>> 0;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let lastSeedUsed = null;

/* ================= SEED CODEC =================
   An empty seed field took a NUMERIC entropy seed and displayed `seedNum.toString(36)`.
   Pasting that string back in hashed the STRING — a completely different number — so
   the one seed a user is most likely to copy (the one the app generated for them) was
   the one that could not replay. The cast and foil labels had the same shape.

   One format, one parser, both directions:
     v1-<base36>   an app-generated seed; decodes straight back to its number
     anything else a user's own text, hashed as before (old shares still work) */
const SEED_PREFIX = 'v1-';
function encodeSeed(num){ return SEED_PREFIX + (num >>> 0).toString(36); }
function seedNumberFrom(str){
  const t = String(str == null ? '' : str).trim();
  if (!t) return null;
  if (t.startsWith(SEED_PREFIX)){
    const n = parseInt(t.slice(SEED_PREFIX.length), 36);
    if (!Number.isNaN(n)) return n >>> 0;
  }
  return hashSeedString(t);
}
/* Resolve the seed for one build: returns {num, label} where label is exactly what the
   user can paste back to reproduce `num`. */
function resolveSeed(rawInput){
  const raw = String(rawInput == null ? '' : rawInput).trim();
  if (raw) return {num: seedNumberFrom(raw), label: raw, explicit: true};
  const num = entropySeed();
  return {num, label: encodeSeed(num), explicit: false};
}

/* ================= WEIGHTED CONSTRAINT TIER =================
   Between hard ban and neutral: per-category "prefer" (x3) and "rarely" (x0.25)
   multipliers. Applied inside pickCategoryWeighted — the one place category
   selection happens — so tiers shape WHICH categories resolve without ever
   making anything impossible the way a ban does. */
let categoryTiers = new Map(); // category -> 'prefer' | 'rarely'
// Two fixed multipliers ("prefer x3" / "rarely x1/4") were the only weights available,
// which is a strange amount of precision to withhold in an app built out of continuous
// dials. A tier may now be any multiplier; the two words are kept as aliases so saved
// setups and the existing buttons keep working.
function tierMultiplier(cat){
  const t = categoryTiers.get(cat);
  if (t === undefined) return 1;
  if (t === 'prefer') return 3;
  if (t === 'rarely') return 0.25;
  const n = parseFloat(t);
  return Number.isNaN(n) ? 1 : clamp(n, 0.05, 20);
}
function tierLabel(t){
  if (t === 'prefer') return 'prefer x3';
  if (t === 'rarely') return 'rarely x1/4';
  const n = parseFloat(t);
  return Number.isNaN(n) ? String(t) : (n >= 1 ? 'x' + n : 'x' + n);
}
function addCategoryTier(tier){
  const sel = document.getElementById('tierCategorySelect');
  if (!sel || !sel.value) return;
  let value = tier;
  if (tier === 'custom'){
    const inp = document.getElementById('tierCustomValue');
    const n = inp ? parseFloat(inp.value) : NaN;
    if (Number.isNaN(n)){ toast("Enter a multiplier first (e.g. 1.5, or 0.5 to halve).", "warn"); return; }
    value = String(clamp(n, 0.05, 20));
  }
  categoryTiers.set(sel.value, value); sel.value=""; refreshConstraintChips();
}
function removeTier(cat){ categoryTiers.delete(cat); refreshConstraintChips(); }

/* ================= RADAR CHART =================
   The 12-axis polarity profile (axisProfile) rendered as SVG. Values are summed
   trait polarity per axis; normalization is against the strongest axis in the
   set being drawn, so shape (which axes dominate) is the signal, not absolute
   magnitude. profiles: [{label, color, prof}] — one polygon each, so the same
   function draws a single character or a full cast overlay. */
function radarSVG(profiles, size){
  size = size || 300;
  // Only the personality codes belong on this chart — AXIS_LABELS also contains
  // voice-polarity codes (volume, formality, pace, mood) used elsewhere, and mixing
  // them in made the radar read as 16 unrelated spokes. Now thirteen spokes, not
  // twelve: curiosity gained its polarity code and so appears here automatically.
  const axes = Object.values(AXIS_TO_POLCODE);
  const cx = size/2, cy = size/2, R = size/2 - 46;
  let maxV = 1;
  profiles.forEach(p=> axes.forEach(ax=> maxV = Math.max(maxV, Math.abs(p.prof[ax]||0))));
  const pt = (i, v) => {
    const ang = (Math.PI*2*i/axes.length) - Math.PI/2;
    const r = R * (0.5 + 0.5 * clamp(v/maxV, -1, 1)); // centre ring = 0, outer = +max, inner = -max
    return [cx + r*Math.cos(ang), cy + r*Math.sin(ang)];
  };
  /* `label` was accepted on every profile and never rendered anywhere — a dead
     parameter that read as if the chart named its own polygons when it does not (the
     cast view builds a separate legend for that). Rather than delete it and lose the
     one thing it is genuinely good for, spend it on the accessible name: the SVG had
     none at all, so a screen reader met this chart as an unlabelled graphic. */
  /* Text-node escaping is NOT attribute escaping. This used to escape only & < >
     and then drop the result into a double-quoted aria-label, so a character named
     `A" data-audit="x` closed the attribute and added its own. Every interpolation
     below now goes through escHTML, which also encodes quotes. */
  const esc = t => escHTML(t);
  const named = profiles.filter(p=>p.label);
  const title = named.length > 1
    ? `Axis profile overlay — ${named.map(p=>esc(p.label)).join(', ')}`
    : `Axis profile${named.length ? ' — ' + esc(named[0].label) : ''}`;
  let s = `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${title}" style="max-width:${size}px;width:100%;">`;
  s += `<title>${title}</title>`;
  // rings: -max, 0 (emphasised), +max
  [0.25, 0.5, 0.75, 1].forEach(f=>{
    const ring = axes.map((_,i)=>{ const ang=(Math.PI*2*i/axes.length)-Math.PI/2; return `${cx+R*f*Math.cos(ang)},${cy+R*f*Math.sin(ang)}`; }).join(" ");
    s += `<polygon points="${ring}" fill="none" stroke="var(--border)" stroke-width="${f===0.5?1.6:0.7}" ${f===0.5?'stroke-dasharray="3 3"':''}/>`;
  });
  axes.forEach((ax,i)=>{
    const ang = (Math.PI*2*i/axes.length) - Math.PI/2;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx+R*Math.cos(ang)}" y2="${cy+R*Math.sin(ang)}" stroke="var(--border)" stroke-width="0.6"/>`;
    const lx = cx + (R+24)*Math.cos(ang), ly = cy + (R+24)*Math.sin(ang);
    s += `<text x="${lx}" y="${ly}" font-size="8.5" text-anchor="middle" dominant-baseline="middle" fill="var(--muted)">${esc(AXIS_LABELS[ax])}</text>`;
  });
  profiles.forEach(p=>{
    const pts = axes.map((ax,i)=> pt(i, p.prof[ax]||0).join(",")).join(" ");
    s += `<polygon points="${pts}" fill="${esc(p.color)}" fill-opacity="0.13" stroke="${esc(p.color)}" stroke-width="2">` +
         (p.label ? `<title>${esc(p.label)}</title>` : '') + `</polygon>`;
  });
  s += `</svg>`;
  return s;
}

/* ================= VOICE FINGERPRINT =================
   One assembled sample paragraph, built from the character's own trait example
   lines so you HEAR the voice immediately. Deterministic per character (seeded
   from the trait ids), so it doesn't reshuffle on every re-render. */
function voiceFingerprint(st, meta){
  const grab = (prefixes) => Object.keys(st)
    .filter(id => prefixes.some(p=>id.startsWith(p)) && st[id] && st[id].trait && st[id].trait.example)
    .map(id => st[id].trait);
  const voice = grab(["verbosity","grammar","vocab"]);
  const manner = grab(["manner"]);
  const pers = grab(["pers_"]);
  if (!voice.length && !manner.length) return "";
  let seed = 7;
  Object.values(st).forEach(s=>{ if (s && s.trait) seed = (seed*31 + s.trait.id) >>> 0; });
  const rng = mulberry32(seed);
  const take = (arr, n) => {
    const pool = arr.slice(); const out = [];
    while (pool.length && out.length < n) out.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);
    return out;
  };
  const bits = [];
  take(voice, 2).forEach(t=> bits.push(t.example));
  take(manner, 1).forEach(t=> bits.push(t.example));
  take(pers, 1).forEach(t=> bits.push(t.example));
  return bits.join("  ");
}

/* ================= DISTANCE FROM THE PREVIOUS GENERATION =================
   The engine already had everything needed to answer "is this actually a different
   character than the last one I made?" — but the signal existed only implicitly, so
   a user could only sense staleness vaguely after many generations rather than see
   it in the moment. This makes it explicit and immediate.

   Two measures, because they answer different questions:
     - trait overlap  : how much of the literal sheet is the same entry again
     - profile overlap: how many resolved categories (Role, Values, Stress, …) repeat
   A character can score low on the first and high on the second — different words,
   same person underneath — which is exactly the failure mode worth surfacing. */
let lastGenerationSignature = null;
function generationSignature(st){
  const traitIds = new Set();
  const cats = new Set();
  Object.values(st).forEach(s=>{
    if (!s || !s.trait) return;
    traitIds.add(s.trait.id);
  });
  PROFILE_SECTIONS.forEach(ps=>{
    const s = st["prof_"+ps.id+"_0"];
    if (s && s.trait) cats.add(ps.id + "=" + s.trait.category);
  });
  return {traitIds, cats};
}
function overlapPct(a, b){
  if (!a.size || !b.size) return null;
  let shared = 0;
  a.forEach(v=>{ if (b.has(v)) shared++; });
  return Math.round(shared / new Set([...a, ...b]).size * 100);
}
const NOVELTY_TIERS = [
  {min:60, label:"Very similar",     note:"Most of this sheet repeats your last character. Try moving a slider group you haven't touched, or switching archetype."},
  {min:35, label:"Somewhat similar", note:"A recognizable overlap with your last character — fine for a variant, thin for a separate cast member."},
  {min:15, label:"Mostly distinct",  note:"Shares a little ground with your last character; reads as its own person."},
  {min:0,  label:"Distinct",         note:"Almost nothing in common with your last character."},
];
function renderNovelty(prevSig, curSig){
  const box = document.getElementById('noveltyReadout');
  if (!box) return;
  if (!prevSig){ box.style.display = 'none'; return; }
  const traitPct = overlapPct(prevSig.traitIds, curSig.traitIds);
  const catPct = overlapPct(prevSig.cats, curSig.cats);
  if (traitPct === null){ box.style.display = 'none'; return; }
  // Rank on the stronger of the two signals: repeating every resolved category is
  // just as much "the same character again" as repeating the literal traits.
  const tier = NOVELTY_TIERS.find(t => Math.max(traitPct, catPct === null ? 0 : catPct) >= t.min);
  box.style.display = 'block';
  box.className = 'noveltyBox novelty-' + tier.label.split(' ')[0].toLowerCase();
  box.innerHTML =
    `<b>${tier.label} to your last generation</b> — ${traitPct}% of traits shared` +
    (catPct === null ? "" : `, ${catPct}% of resolved profile categories shared`) +
    `. <span class="noveltyNote">${tier.note}</span>`;
}

/* ================= DISTANCE FROM ARCHETYPE =================
   How far the generated sheet actually drifted from its archetype seed. For each
   axis the archetype takes a position on, compare its intended direction+strength
   against the sheet's realised trait-polarity sum. 100% = every archetype axis
   realised in the intended direction at proportional strength; drift comes from
   your slider blend, the dice, and rerolls — all legitimate, which is why this is
   a meter and not a warning. */
/* Reference realised magnitude for a FULLY expressed archetype axis, measured from
   the generator itself: 20 samples per built-in preset, generated at that preset's own
   settings, give |axisProfile| values distributed roughly 0.20 (p10) to 2.30 (p99)
   with a median near 1.02, in axisProfile's character-relative units (see the note
   on it in app.js — the divisor is the sheet's own tag count, and the bank prior is
   subtracted). The 90th percentile, 1.85, is the point at which an axis is as loudly
   expressed as this bank realistically expresses one. Re-measure this whenever
   axisProfile's units change; `node tests/bank-report.js` does not do it for you.

   It has to be an empirical constant because axisProfile is already normalised against
   the bank's own polarity coverage — its units mean nothing in the archetype's -100..100
   units, which is precisely the mistake the old meter made: it divided the normalised
   magnitude by 2 and reported it as "proportional realization of the archetype",
   discarding the target magnitude entirely after taking its sign. Across 50 samples of
   each of 34 presets that read 1.6-4.0% — a meter that could not reach its own top even
   when generating the archetype it was measuring.

   Direction and strength are now reported separately, because they answer different
   questions and only one of them is well-conditioned. Direction ("did the sheet lean
   the way the preset asked?") is a clean proportion. Strength is relative to the
   reference above and is labelled as such. */
const FIDELITY_REF_MAG = 1.85;
function archetypeFidelity(st, arch){
  if (!arch || !arch.pers) return null;
  const prof = axisProfile(st);
  let total = 0, matched = 0, silent = 0, strengthSum = 0;
  Object.entries(arch.pers).forEach(([axisId, target])=>{
    const code = AXIS_TO_POLCODE[axisId];
    if (!code || Math.abs(target) < 10) return;
    const want = Math.sign(target);
    const got = prof[code] || 0;
    total++;
    if (got === 0){ silent++; return; }   // see below
    if (Math.sign(got) === want){
      matched++;
      // How fully this axis came out, relative to how fully the bank expresses one,
      // scaled by how hard the preset asked for it.
      const asked = Math.min(1, Math.abs(target) / 100);
      strengthSum += Math.min(1, Math.abs(got) / (FIDELITY_REF_MAG * Math.max(0.4, asked)));
    }
  });
  if (!total) return null;
  const expressed = total - silent;
  const score = matched;   // direction agreement is the headline; see below
  /* THE METER'S FLOOR WAS A LIE. A silent axis — one the sheet expresses nothing on —
     used to score 0.35, "partial credit". Nine axes of silence therefore read as 35%
     fidelity, so a sheet that ignored the archetype completely still showed a third of
     the bar filled and the number could never mean what it said. Silence is not partial
     agreement; it is the absence of evidence, and it now scores nothing.

     But "0%" alone is also the wrong reading, because a sheet can be silent on an axis
     for reasons that have nothing to do with the archetype (that section switched off,
     a thin pool, traits with no polarity tag on that axis). So the silent count travels
     with the number and the meter says which it is, instead of splitting the difference
     inside a single figure and telling the user neither. */
  /* Scored over the EXPRESSED axes, not all of them: an axis the sheet says nothing
     about is absence of evidence, and folding it into the denominator made a preset
     whose sections were switched off look like a preset the generator had ignored. The
     silent count travels alongside so the meter can say which it is. */
  return {
    pct: expressed ? Math.round(100 * score / expressed) : 0,
    strength: matched ? Math.round(100 * strengthSum / matched) : 0,
    matched, total, silent, expressed,
  };
}

/* Generation is synchronous over a 7,073-trait bank with per-trait position maths, and
   on a slow phone that is a visible freeze with nothing on screen to explain it. Paint
   a skeleton first, then do the work on the next frame. The real build stays available
   as a plain synchronous call (runGeneration) for the paths that need to act on the
   result immediately — seed-from-trait, tests. */
/* Deferring the build by two animation frames leaves a window in which a second press
   (or a held Enter on the shortcut) queues a second build behind the first — two full
   generations, two undo snapshots, and the second one's result silently replacing a
   sheet the user saw for one frame. One in-flight guard; the extra presses are dropped
   rather than queued, because "generate twice" is never what the second press meant. */
let _generationInFlight = false;
function generateCharacter(){
  if (_generationInFlight) return;
  const sheetEl = document.getElementById('sheet');
  if (!sheetEl || typeof requestAnimationFrame !== 'function'){ runGeneration(); return; }
  _generationInFlight = true;
  showSkeleton();
  requestAnimationFrame(()=> requestAnimationFrame(()=>{
    try { runGeneration(); } finally { _generationInFlight = false; }
  }));
}

/* ================= BATCH GENERATION =================
   "Give me five and let me pick one" is how people actually use a generator, and there
   was no way to ask for it: every roll overwrote the last, so choosing between two
   candidates meant generating, deciding, and either keeping it or losing it forever.
   The engine is more than fast enough — 400 full builds run in a couple of seconds —
   so the only thing missing was somewhere to put them.

   Each candidate is a complete, real generation, so picking one is exactly equivalent
   to having rolled it directly: same seed handling, same locks, same pressure sheet.
   The candidates that are not picked cost nothing and are discarded. */
let batchCandidates = [];
function generateBatch(n){
  const count = clamp(parseInt(n, 10) || 5, 2, 8);
  const host = document.getElementById('batchTray');
  if (!host) return;
  batchCandidates = [];
  /* Discarding a batch left the workspace changed: withSpeculativeGeneration restored
     its eight globals and generateBatch restored four more, but NOBODY restored
     lastGeneratedSliders, the seed globals or the on-screen seed readout — so after
     generating and discarding two candidates the sheet was the original one while its
     recorded provenance belonged to a character the user never kept. Capture the whole
     authoritative set in one place instead of a hand-maintained subset. */
  const before = {state, charMeta, pressureState, lastSheetTraits,
                  lastGeneratedSliders, lastSeedUsed, charMetaSeed,
                  seedReadout: (document.getElementById('lastSeedReadout')||{}).textContent,
                  budgetReport: getBudgetReport()};
  /* withSpeculativeGeneration: a batch runs `count` complete builds that the user has
     not accepted, and a complete build writes to the presentation locks, the undo and
     redo stacks, the anti-repetition window, lastBySlot, sessionProfiles, the novelty
     signature and the category-use counter. This restored four of those and leaked the
     rest — see the helper in engine.js. */
  try { withSpeculativeGeneration(()=>{
    for (let i = 0; i < count; i++){
      // Each candidate needs its OWN seed, or a fixed seed in the box would produce
      // the same character five times, which is a confusing way to present a choice.
      const seedEl = document.getElementById('seedInput');
      const userSeed = seedEl ? seedEl.value : "";
      if (seedEl && userSeed) seedEl.value = userSeed + "#" + (i + 1);
      try {
        if (!_runGeneration()) continue;
        /* The candidate's presentation locks are part of the candidate. They used to be
           left in the module global and clobbered by the next candidate; now they are
           captured here and reinstated by chooseBatch, so picking #2 gets #2's locks. */
        batchCandidates.push({state, meta: Object.assign({}, charMeta), pressure: pressureState,
                              variants: Object.assign({}, charVariants),
                              // A candidate owns its provenance, so picking #2 commits
                              // #2's sliders and #2's budget report — not #5's.
                              sliders: lastGeneratedSliders,
                              budgetReport: getBudgetReport(),
                              signature: generationSignature(state)});
      } finally { if (seedEl) seedEl.value = userSeed; }
    }
  }); } finally {
    // Put the sheet back to whatever it was before the batch. Nothing is committed
    // until the user picks one.
    state = before.state; charMeta = before.charMeta;
    pressureState = before.pressureState; lastSheetTraits = before.lastSheetTraits;
    lastGeneratedSliders = before.lastGeneratedSliders;
    lastSeedUsed = before.lastSeedUsed; charMetaSeed = before.charMetaSeed;
    const seedOut = document.getElementById('lastSeedReadout');
    if (seedOut && before.seedReadout !== undefined) seedOut.textContent = before.seedReadout;
    if (before.budgetReport && typeof setBudgetReport === 'function') setBudgetReport(before.budgetReport);
    if (typeof updateStickyBar === 'function') updateStickyBar();
  }
  renderBatchTray();
  renderSheet();
  if (batchCandidates.length) srAnnounce(`${batchCandidates.length} candidates ready. Pick one to keep it.`);
}
function renderBatchTray(){
  const host = document.getElementById('batchTray');
  if (!host) return;
  if (!batchCandidates.length){ host.style.display = 'none'; host.innerHTML = ''; return; }
  /* The preview was the three LOUDEST traits, and loudest is not most identifying:
     five candidates built from the same settings tend to share their loud traits (that
     is what the settings asked for), so the tray showed five near-identical strips and
     the choice came down to guessing. What discriminates between candidates is what
     each one IS — its emergent archetype, which composes from values/role/stress/
     attachment/humor/vices — plus the single most defining trait on the sheet, which is
     the rarest one, not the loudest. */
  const signature = (st) => {
    const all = Object.values(st).filter(x=> x && x.trait);
    if (!all.length) return [];
    const score = t => (RTIER_SCORE[t.rtier || rarityTier(t)] || 0) * 10 + (t.intensity || 0);
    const best = all.slice().sort((a,b)=> score(b.trait) - score(a.trait))[0];
    // ...and one profile fact, so two candidates that happen to share a signature trait
    // are still told apart by what the sheet says about them.
    const facts = ['values','role','stress','attachment']
      .map(id => slotCat(st['prof_'+id+'_0'])).filter(Boolean);
    return [best.trait.trait].concat(facts.length ? [facts[0]] : []);
  };
  host.innerHTML = `<div class="batchHead"><b>Pick one of ${batchCandidates.length}</b>` +
    `<button class="btn-secondary" ${actAttr('click', 'dismissBatch')}>Discard all</button></div>` +
    `<div class="batchGrid">` + batchCandidates.map((c, i)=>{
      const em = (typeof emergentArchetypeName === 'function') ? emergentArchetypeName(c.state) : null;
      /* The emergent archetype name is the most discriminating single string available
         and it was only used when the user had not typed a name — so naming your
         character (the common case) replaced five distinct titles with five identical
         ones. The typed name still leads; the archetype rides alongside it. */
      const named = c.meta && c.meta.name && c.meta.name !== "Unnamed Character";
      const title = named ? c.meta.name : ((em && em.name) || ("Candidate " + (i + 1)));
      const sub = named && em && em.name ? `<span class="batchArch">${escHTML(em.name)}</span>` : ``;
      return `<button type="button" class="batchCard" ${actAttr('click', 'chooseBatch', i)} title="Keep this one">` +
        `<b>${escHTML(title)}</b>${sub}` +
        `<span class="sub">${signature(c.state).map(escHTML).join(" · ")}</span></button>`;
    }).join('') + `</div>`;
  host.style.display = 'block';
}
function chooseBatch(i){
  const pick = batchCandidates[i];
  if (!pick) return;
  snapshotHistory();
  lastSheetTraits = Object.keys(state).length ? snapshotSheetTraits(state) : null;
  state = pick.state; charMeta = pick.meta; pressureState = pick.pressure;
  /* Committing a candidate is where the session memory a build normally writes actually
     belongs — on the one character the user kept, not on all five. The batch itself is
     isolated (see withSpeculativeGeneration); this is the deliberate commit. */
  if (pick.variants) charVariants = pick.variants;
  if (pick.sliders) lastGeneratedSliders = pick.sliders;
  if (pick.budgetReport && typeof setBudgetReport === 'function') setBudgetReport(pick.budgetReport);
  /* The seed readout was left showing the LAST candidate's seed, so "Seed: …" next to a
     kept character named a different one — and pasting it back reproduced the candidate
     you discarded. Each candidate carries its own seed in its meta; put that on screen. */
  if (pick.meta && pick.meta.seed){
    lastSeedUsed = charMetaSeed = pick.meta.seed;
    setText('lastSeedReadout', "Seed: " + pick.meta.seed);
    if (typeof updateStickyBar === 'function') updateStickyBar();
  }
  renderNovelty(lastGenerationSignature, pick.signature);
  lastGenerationSignature = pick.signature;
  rememberGeneration(state);
  try { rememberProfile(axisProfile(state)); } catch(e){}
  markChangedSlots();
  dismissBatch();
  const pEl = document.getElementById('pressureSheet');
  if (pEl) pEl.style.display = pressureState ? "block" : "none";
  renderSheet(); checkConflicts();
  toast(`Kept "${charMeta.name && charMeta.name !== "Unnamed Character" ? charMeta.name : "that one"}". The rest are gone.`);
}
function dismissBatch(){ batchCandidates = []; renderBatchTray(); }

function runGeneration(){
  try {
    return _runGeneration();
  } catch (err){
    // ERROR BOUNDARY: a single throw anywhere in the build used to leave a half-rendered
    // sheet and a silent console, which reads as the app simply not responding.
    console.error(err);
    renderGenerationFailure(err);
    return false;
  }
}

function _runGeneration(){
  snapshotHistory();
  diffLog = {};
  changedSlots = new Set();   // recomputed once the new state is in place
  // Per-slot UI state belongs to the previous character, not this one.
  rerollExclusions = {};
  rerollHistory = {};
  whyOpen = {};
  OPEN_CARD_CONTROLS.clear();   // a new character means new cards; nothing is open on it
  lastDepthUntouched = [];
  /* Depth-first mode used to run HERE, outside the seeded block — so it drew its
     foundational motivation traits off the unseeded stream, and the seeded build that
     followed drew motivation all over again. Replaying a fixed seed therefore produced
     different derived sliders and a different character. It is now planned inside the
     seeded transaction below; this only records that it was asked for. */
  const depthFirstEl = document.getElementById('depthFirstToggle');
  const wantDepthFirst = !!(depthFirstEl && depthFirstEl.checked);

  const archKey = strVal('archetypeSelect', '');
  // The preset with its chosen variation folded in — see effectiveArchetype.
  const arch = effectiveArchetype(archKey, strVal('archetypeVariation', ''));
  // BUG FIX: this used to WRITE the blended value back into the slider elements.
  // Because the blend reads the slider it just wrote, pressing Generate repeatedly
  // with an archetype selected pulled the sliders further toward the archetype each
  // time until the user's own settings were gone — and there was no way to get them
  // back. Compute the blend as a per-generation override instead and leave the
  // controls exactly where the user put them.
  let archOverrides = null;
  if (arch && arch.pers){
    archOverrides = {};
    PERSONALITY_AXES.forEach(a=>{
      const el = document.getElementById('pers_'+a.id);
      const current = intVal(el, 0);
      /* Blend weight is the user's (archetypeBlend), except on the preset's `must`
         axes, which are held at a floor so the preset stays recognisable at any
         setting — see ARCHETYPE_INTENT. */
      const w = archetypeAxisBlend(arch, a.id);
      archOverrides[a.id] = (arch.pers[a.id] !== undefined)
        ? Math.round(clamp(current*(1-w) + arch.pers[a.id]*w, -100, 100))
        : current;
    });
  }
  let verbLevel = rawToLevel(intVal('verbositySlider', 0));
  let regLevel = rawToLevel(intVal('registerSlider', 0));
  let compLevel = rawToLevel(intVal('composureSlider', 0));
  if (arch){
    // Built-in archetypes store small hand-tuned deltas (-1/0/1/2) meant to nudge the
    // current slider. Custom archetypes instead capture the exact slider level at save
    // time, so adding it on top of an already-nonzero slider double-counted. Blend both
    // the same way personality already does, rather than treating one as additive.
    // The two archetype families used to blend differently — built-ins added their
    // delta on top of the slider, custom ones lerped — so the SAME posture saved as a
    // custom archetype behaved unlike a built-in with the same numbers. Both are now a
    // position on the same -2..2 scale, blended the same way, and the built-in tables
    // read as absolute postures (which is how they were written).
    const wv = archetypeBlendLevel();
    verbLevel = clamp(verbLevel*(1-wv) + arch.verbosity*wv, -2, 2);
    regLevel  = clamp(regLevel*(1-wv)  + arch.register*wv,  -2, 2);
    compLevel = clamp(compLevel*(1-wv) + arch.composure*wv, -2, 2);
  }
  const mannerCount = intVal('mannerCount', 3);
  const vocabCount = intVal('vocabCount', 2);
  const rarityPref = rarityPrefVal();

  // Age and the one-line context stop being decoration here: they resolve to category
  // weights and small slider nudges before anything is drawn (see buildContextBias).
  const ctxInfo = buildContextBias(
    (document.getElementById('charContext')||{}).value,
    (document.getElementById('charAge')||{}).value);
  if (Object.keys(CONTEXT_AXIS_NUDGE).length){
    archOverrides = archOverrides || (()=>{
      const o = {};
      PERSONALITY_AXES.forEach(a=>{ o[a.id] = intVal('pers_'+a.id, 0); });
      return o;
    })();
    Object.entries(CONTEXT_AXIS_NUDGE).forEach(([axis, delta])=>{
      if (archOverrides[axis] === undefined) archOverrides[axis] = intVal('pers_'+axis, 0);
      archOverrides[axis] = Math.round(clamp(archOverrides[axis] + delta, -100, 100));
    });
  }

  // Seeded build: point rand() at the seeded stream for exactly the build's duration
  // (withRng, engine.js) rather than reassigning Math.random globally.
  const seedInput = document.getElementById('seedInput');
  const seed = resolveSeed(seedInput ? seedInput.value : "");
  const seedNum = seed.num;
  lastSeedUsed = seed.label;
  const wantStress = !!(document.getElementById('stressToggle')||{}).checked;
  // An explicit seed means "give me this character again", so it suppresses the
  // session-history branch of divergence (see REPLAY_MODE in engine.js). An
  // unseeded roll is exploration and keeps it.
  const replay = seed.explicit;
  let newState0, newState, newPressure = null;
  // The archetype's profile hints are live for the whole build and nothing else — see
  // ARCHETYPE PROFILE HINTS in engine.js. Cast, foil and gap-filler deliberately do not
  // inherit them; they are not this archetype's character.
  withReplayMode(replay, ()=>
  withArchetypeProfile(arch && arch.profile, ()=> withRng(mulberry32(seedNum), ()=>{
    /* The character's presentation is committed BEFORE anything is drawn — including
       before the depth-first foundation draw, which goes through byFilter and is
       therefore filtered by the presentation lock. Rolling it afterwards meant
       depth-first drew its motivation traits through the PREVIOUS character's locks,
       which is one more way the same seed produced two different people.

       The slots the user is keeping have a say in the roll: a kept variant-tagged
       trait fixes its own category's lock rather than being contradicted by a coin. */
    const protectedVariants = variantsFromProtected(state);
    lastVariantConflicts = protectedVariants.conflicts;
    rollCharacterVariants(protectedVariants.want); // inside the seeded block, so seeds reproduce variants too
    // Depth-first draws motivation and derives the sliders from it. Inside the seeded
    // stream, and after the presentation commitment, so the same seed plans the same
    // foundations. (_avoidRecentActive is resolved per build by buildCharacterState;
    // the depth-first draw runs before that, so it needs it set here too.)
    if (wantDepthFirst){
      _avoidRecentActive = avoidRecentEnabled();
      const plan = applyDepthFirst();
      if (plan){
        verbLevel = rawToLevel(intVal('verbositySlider', 0));
        regLevel  = rawToLevel(intVal('registerSlider', 0));
        compLevel = rawToLevel(intVal('composureSlider', 0));
        if (archOverrides){
          PERSONALITY_AXES.forEach(a=>{ archOverrides[a.id] = intVal('pers_'+a.id, 0); });
        }
      }
    }
    newState0 = buildCharacterState({verbLevel, regLevel, compLevel, mannerCount, rarityPref,
      vocabPref: arch?arch.vocabPref:null, vocabCount, personalityOverrides: archOverrides});
    /* One finalizer, one order — see finalizeSheet in engine.js. The locked slots the
       user kept are seated HERE, before budgets, exclusivity and the pressure sheet,
       rather than being merged back in afterwards over the top of everything those
       stages had already decided. */
    newState = finalizeSheet(newState0, {rarityPref, carryLocked: state});
    // BUG FIX: the pressure sheet used to be built AFTER the RNG was restored, so
    // "same seed + same settings = the exact same character" — which the UI states
    // outright — was false for every character generated with Under Pressure on. It
    // builds inside the seeded region now, on its OWN sub-stream, so toggling the
    // pressure sheet doesn't perturb the base character's draws either.
    if (wantStress){
      withRng(mulberry32((seedNum ^ 0x9e3779b9) >>> 0), ()=>{
        // Derived from the COMMITTED base sheet (post-finalization), not from the raw
        // draw — so the pressure variant describes the character on screen.
        newPressure = buildStressVariant(verbLevel, regLevel, mannerCount, rarityPref, newState);
      });
    }
  })));
  charMetaSeed = lastSeedUsed;
  const seedOut = document.getElementById('lastSeedReadout');
  if (seedOut) seedOut.textContent = "Seed: " + lastSeedUsed;
  if (typeof updateStickyBar === 'function') updateStickyBar();
  // (The locked-slot merge that used to live here now runs inside finalizeSheet,
  //  before budgets, exclusivity and the pressure build — see B11.)
  // Slot-level diff against the outgoing sheet (see renderChangeList): "42% novel"
  // tells you how much moved, never what.
  lastSheetTraits = Object.keys(state).length ? snapshotSheetTraits(state) : null;
  state = newState;
  // Which slots this generation actually moved — drives the per-card flash. Set here
  // rather than inside renderSheet so only a full regeneration highlights, and a later
  // reroll or a re-render of the same sheet doesn't re-flash everything.
  markChangedSlots();
  // Record which slider positions produced this state, so a future undo (which
  // restores the state that came BEFORE the next generation) can also restore
  // the sliders that actually match it.
  lastGeneratedSliders = captureSliders();

  charMeta = {
    name: strVal('charName', '') || "Unnamed Character",
    age: strVal('charAge', ''),
    context: strVal('charContext', ''),
    archetypeLabel: archKey ? (arch && arch.label) || document.getElementById('archetypeSelect').selectedOptions[0].textContent : "Custom random",
    archetypeKey: archKey || null,
    archetypeVariation: (arch && arch.variation) ? arch.variation.id : null,
    archetypeBlend: archKey ? archetypeBlendLevel() : null,
    seed: charMetaSeed
  };
  charMeta.archFidelity = arch ? archetypeFidelity(state, arch) : null;
  const emergent = emergentArchetypeName(state);
  if (emergent && !archKey) charMeta.archetypeLabel = emergent.name + (emergent.exact ? "" : " *");
  setText('archetypeTag', charMeta.archetypeLabel);

  pressureState = newPressure;
  const pSheet = document.getElementById('pressureSheet');
  pSheet.style.display = pressureState ? "block" : "none";
  // A freshly generated pressure variant is by definition current again.
  if (pSheet.classList) pSheet.classList.remove('outdated');
  const pStale = document.getElementById('pressureOutdated');
  if (pStale){ pStale.style.display = 'none'; pStale.textContent = ''; }

  // Compare against the PREVIOUS generation before overwriting the stored signature,
  // so the readout answers "how different is this from the last one I made".
  const curSignature = generationSignature(state);
  renderNovelty(lastGenerationSignature, curSignature);
  lastGenerationSignature = curSignature;
  // Session memory: what to avoid next time, and what "average" looks like so far.
  rememberGeneration(state);
  try { rememberProfile(axisProfile(state)); } catch(e){}
  charMeta.contextNotes = ctxInfo && ctxInfo.notes.length ? ctxInfo.notes.slice() : null;
  // What the context parser found but did NOT apply, and why — so a reading it got
  // wrong (or one the user switched off) is visible rather than merely absent.
  charMeta.contextRejected = ctxInfo && ctxInfo.rejected && ctxInfo.rejected.length ? ctxInfo.rejected.slice() : null;

  // A fresh generation is where the density preference applies; from then on the
  // sections are however the user has arranged them.
  if (typeof markDensityPending === 'function') markDensityPending();
  const sheetEl = document.getElementById('sheet');
  const wasHidden = !sheetEl.classList.contains('show');
  renderSheet(); checkConflicts();
  // QoL: on the FIRST generation the result appears far below the controls and it
  // wasn't obvious anything happened. Scroll it into view once; on regenerations
  // the user has usually positioned themselves and we leave scroll alone.
  if (wasHidden && typeof sheetEl.scrollIntoView === 'function') sheetEl.scrollIntoView({behavior:'smooth', block:'start'});
  return true;
}

/* Every trait id currently seated on the sheet, excluding one slot. _buildUsedIds is
   reset per build and consulted only by _drawUnique/seatUnique, so it says nothing at
   all about the sheet an hour into a rerolling session — which is how tossing a
   Vocabulary card could hand back the trait already sitting in Register (both draw
   from Vocabulary Traits), or the same Personality trait already seated in that axis's
   second facet. Deriving the set live at mutation time is both correct and cheap; the
   build-scoped global can't be made to answer this question. */
function seatedTraitIds(exceptSlotId){
  const seen = new Set();
  Object.keys(state).forEach(id=>{
    if (id === exceptSlotId) return;
    const s2 = state[id];
    if (s2 && s2.trait) seen.add(s2.trait.id);
  });
  return seen;
}

/* Constraints that used to run only at build time. A reroll could seat trait B while
   trait A was already on the sheet and the pair was declared mutually exclusive — the
   chip still read "never together" while both cards sat there — and tossing the only
   card in a required category left the constraint quietly unsatisfied. Re-running both
   after a mutation costs one pass over the sheet and keeps the chips honest. */
/* Budgets used to be generation-only by omission rather than by decision: a reroll or
   a pin nudge could walk a budget-compliant sheet straight out of its caps while the
   meter carried on describing the sheet from two mutations ago. Route the mutation
   through the same finalizer the build uses, so the meter is always about THIS sheet.

   The mode switch is the honest part: users who want budgets to hold only at
   generation time can say so, and then the meter reports the breach instead of
   quietly correcting it. Locked, required and pinned slots are untouched either way. */
let enforceBudgetsOnMutation = true;
function getMutationBudgetMode(){ return enforceBudgetsOnMutation ? 'enforce' : 'report'; }
function setMutationBudgetMode(m){ enforceBudgetsOnMutation = (m !== 'report'); }
function reapplyConstraintsAfterMutation(){
  const rarityPref = rarityPrefVal();
  try {
    state = finalizeSheet(state, {rarityPref, applyPins:false,
                                  applyBudgets: enforceBudgetsOnMutation});
    // In report mode finalizeSheet skips the solver, so the meter still has to be told
    // what the sheet now costs.
    if (!enforceBudgetsOnMutation && typeof auditBudgets === 'function'){
      auditBudgets(state, getBudgetReport() || {rarity:{}, intensity:{}, actions:[], active: budgetsActive()});
    }
    if (typeof refreshBudgetChips === 'function') refreshBudgetChips();
  } catch(e){ console.error(e); }
}

function rerollSlot(slotId){
  const old = state[slotId];
  // BUG FIX: snapshotHistory() ran before the lock check and before validating the
  // slot, so rerolling a locked (or missing) slot pushed a junk no-op entry onto
  // the undo stack. Validate first, snapshot only once we know we'll change something.
  if (!old || !old.trait || old.locked) return;
  /* BUG FIX: a required slot rendered a Toss button that could not work — req_* is
     the user's own "always include this exact trait", so there is nothing to draw.
     Say so instead of failing silently. */
  if (old.required && slotId.startsWith("req_")){
    toast("This trait is here because you required it by name — remove the constraint to change it.", "warn");
    return;
  }
  const rarityPref = rarityPrefVal();
  // Reroll always operates on the single main-character UI, so the live DOM sliders
  // ARE the correct source for trait-level polarity affinity here (no per-call
  // overrides needed, unlike cast/foil generation).
  setAffinityVec(null);
  // Everything already on the sheet, so a reroll can't hand back a trait seated
  // somewhere else. Computed before the draw, excluding this slot's own trait
  // (which the exclusion set below handles, with a different meaning).
  const seated = seatedTraitIds(slotId);

  // Remember what we're rejecting so repeated rerolls stop cycling back to it.
  // BUG FIX: exclusions were keyed on the trait NAME, but several trait names are
  // reused across sections ("Deflect-with-humour", "Slightly reserved"), so passing
  // on one silently blacklisted unrelated traits elsewhere. Key on id.
  if (!rerollExclusions[slotId]) rerollExclusions[slotId] = new Set();
  const excluded = rerollExclusions[slotId];
  // Re-draw up to a bounded number of times rather than filtering the pool, because
  // the pick functions own their own weighting/intensity logic and we don't want to
  // duplicate it here. If a category is nearly exhausted we give up and allow a
  // repeat rather than looping forever or returning nothing.
  const drawFresh = (fn) => {
    let cand = null, firstUnseated = null;
    for (let i = 0; i < 32; i++){
      cand = fn();
      if (!cand || !cand.trait) break;
      const rejected = excluded.has(cand.trait.id) || cand.trait.id === old.trait.id;
      const duplicate = seated.has(cand.trait.id);
      if (!rejected && !duplicate) return cand;
      // A near-exhausted pool may have nothing that satisfies both. Preferring a
      // previously-rejected trait over a duplicate is the right order: a repeat you
      // passed on is a disappointment, a trait seated twice on one sheet is a bug.
      if (!duplicate && !firstUnseated) firstUnseated = cand;
    }
    return firstUnseated || (cand && !seated.has(cand.trait.id) ? cand : null);
  };
  const rawOf = id => intVal(id, 0);

  let replacement;
  if (pinnedTargets[slotId] !== undefined){
    // Pinned slots reroll around their own pinned target, ignoring whatever the
    // driving slider currently says — same section/category as before, different
    // trait, same intensity neighbourhood.
    const tgt = pinnedTargets[slotId];
    const pool = byFilter(old.trait.section, old.trait.category);
    replacement = drawFresh(()=>({slotId, locked:false, label: old.label, sectionId: old.sectionId,
      target:tgt, pinned:true, trait: pickInRange(pool, rarityPref, tgt, 3)}));
  } else if (slotId === "verbosity"){
    replacement = drawFresh(()=>pickVerbositySlot(rawToLevel(rawOf('verbositySlider')), rarityPref));
  } else if (slotId === "register"){
    replacement = drawFresh(()=>pickRegisterSlot(rawToLevel(rawOf('registerSlider')), rarityPref));
  } else if (slotId === "grammar"){
    const currentProfileCats = {};
    PROFILE_SECTIONS.forEach(ps=>{ const s = state["prof_"+ps.id+"_0"]; if (s && s.trait) currentProfileCats[ps.id] = s.trait.category; });
    // BUG FIX: pickGrammarSlot's signature is (verb, comp, reg, rarityPref,
    // profileCats, overrides) and this called it one argument short, so `overrides`
    // arrived undefined and accumulateBoost silently fell back to live DOM reads.
    // That happens to be correct for the main character — a reroll always operates on
    // it — but it is the exact shape of bug the buildStressVariant comment records as
    // having "quietly defeated most of the point of the sheet". Pass the resolved
    // overrides explicitly so it is true by construction rather than by coincidence.
    const liveOverrides = {};
    PERSONALITY_AXES.forEach(a=>{ liveOverrides[a.id] = rawOf('pers_'+a.id); });
    liveOverrides.__verbLevel = rawToLevel(rawOf('verbositySlider'));
    liveOverrides.__regLevel  = rawToLevel(rawOf('registerSlider'));
    liveOverrides.__compLevel = rawToLevel(rawOf('composureSlider'));
    replacement = drawFresh(()=>pickGrammarSlot(
      rawToLevel(rawOf('verbositySlider')),
      rawToLevel(rawOf('composureSlider')),
      rawToLevel(rawOf('registerSlider')), rarityPref, currentProfileCats, liveOverrides));
  } else if (slotId.startsWith("vocab")){
    // Rerolls now honour the slot's own intensity target, so a reroll stays inside
    // the band the sliders asked for instead of dropping back to a flat random draw.
    const cat = old.trait.category, tgt = old.target;
    replacement = drawFresh(()=>({slotId, locked:false, label: old.label, target:tgt, steered:old.steered,
      trait: pickInRange(byFilter("Vocabulary Traits", cat), rarityPref, tgt)}));
  } else if (slotId.startsWith("manner")){
    const cat = old.trait.category, tgt = old.target;
    replacement = drawFresh(()=>({slotId, locked:false, label: old.label, target:tgt, steered:old.steered,
      trait: pickInRange(byFilter("Mannerisms", cat), rarityPref, tgt)}));
  } else if (slotId.startsWith("prof_")){
    const cat = old.trait.category;
    const pool = byFilter(old.trait.section, cat);
    const tgt = profileTarget(old.sectionId);
    replacement = drawFresh(()=>({slotId, locked:false, label: old.label, sectionId: old.sectionId, target:tgt,
      trait: pickInRange(pool, rarityPref, tgt)}));
  } else if (slotId.startsWith("pers_")){
    const axisId = slotId.replace("pers_","").replace(/__2$/,"");
    const axis = PERSONALITY_AXES.find(a=>a.id===axisId);
    if (axis) replacement = drawFresh(()=>pickPersonalitySlot(axis, rawToLevel(rawOf('pers_'+axisId)), rarityPref));
  } else if (slotId.startsWith("app_")){
    /* BUG FIX: renderSheet gives every card the full control strip, but rerollSlot
       only ever branched on the voice, profile and personality families — so Toss on
       an Appearance card (a section that is ON by default) fell through to the bail-out
       below and did nothing at all, with no feedback. Everything the draw needs is
       already on the slot: same section and category, same intensity target. */
    const cat = old.trait.category, tgt = old.target;
    replacement = drawFresh(()=>({slotId, locked:false, label: old.label, derived: old.derived,
      target: tgt, trait: pickInRange(byFilter("Appearance", cat), rarityPref, tgt, 3)}));
  } else if (slotId.startsWith("wild_")){
    // The outlier's whole premise is "a category chosen at random" — so rerolling it
    // draws a new category too, rather than another sample of the same one.
    replacement = drawFresh(()=>pickWildcardSlot(rarityPref));
  } else if (slotId.startsWith("reqcat_")){
    // "At least one from this category" mandates the category, not the trait — so a
    // reroll stays inside the category and redraws within it.
    const cat = old.trait.category;
    const pool = byFilter(old.trait.section, cat);
    replacement = drawFresh(()=>({slotId, locked:true, required:true, label: old.label,
      target: old.target, trait: pool.length ? pickInRange(pool, rarityPref, profileTarget(), 4) : null}));
  }
  /* BUG FIX: an unrecognised slotId (or an exhausted pool) left `replacement`
     undefined, and this assigned it straight into state — blanking the slot and
     throwing on the next render. Bail out instead and leave the slot intact — and say
     something, because a button that silently does nothing reads as a broken button. */
  if (!replacement || !replacement.trait){
    toast("Nothing left to draw for this slot — everything in its pool is already on the sheet or has been passed on.", "warn");
    return;
  }
  /* Snapshot AFTER the draw succeeds. This used to snapshot first and history.pop() on
     failure, which is only correct while nothing else can push in between — true when
     it was written, fragile now. Computing the replacement first removes the ordering
     assumption entirely. */
  snapshotHistory();
  // Per-slot history, so a reroll is reversible without unwinding the whole sheet:
  // rerollExclusions remembers what you rejected, but there was no way back to it if
  // the third draw turned out worse than the first.
  if (!rerollHistory[slotId]) rerollHistory[slotId] = [];
  rerollHistory[slotId].push(old);
  if (rerollHistory[slotId].length > 12) rerollHistory[slotId].shift();
  // Remember what we're rejecting so repeated rerolls stop cycling back to it.
  excluded.add(old.trait.id);
  if (old.trait.id !== replacement.trait.id){
    diffLog[slotId] = {from: old.trait.trait, to: replacement.trait.trait};
  }
  /* BUG FIX: pickPersonalitySlot returns slotId "pers_<axis>" with no __2 suffix, so
     rerolling a second facet wrote an object whose own slotId disagreed with the key it
     was stored under, and silently dropped the "— second facet" label. Rendering keys
     off the map key so the buttons kept working, but anything reading slot.slotId was
     wrong. Restore the slot's own identity after the draw. */
  replacement.slotId = slotId;
  if (old.label && /second facet/.test(old.label)) replacement.label = old.label;
  state[slotId] = replacement;
  reapplyConstraintsAfterMutation();
  /* Was renderSheet(): the sheet was torn down and rebuilt to change ONE card, which
     destroyed the Toss button the user had just pressed (dropping focus to <body>) and
     closed every open control strip. renderSlotChange replaces the card and puts the
     caret back on the same control, so Toss-until-you-like-it works from the keyboard
     and nothing else on the page moves. */
  renderSlotChange(slotId); checkConflicts();
}

// Step back through the traits this slot has held. The trait you step back TO is
// removed from the reroll exclusions, otherwise the next reroll would immediately
// reject the thing you just asked for.
function rerollBack(slotId){
  const hist = rerollHistory[slotId];
  if (!hist || !hist.length){ toast("Nothing to step back to in this slot.", "warn"); return; }
  const prev = hist.pop();
  if (!prev || !prev.trait) return;
  // The trait you tossed here may have been drawn into a different slot since. Stepping
  // back to it would seat it twice on one sheet, so refuse rather than duplicate.
  if (seatedTraitIds(slotId).has(prev.trait.id)){
    toast(`"${prev.trait.trait}" has since been drawn into another slot — stepping back would put it on the sheet twice.`, "warn");
    return;
  }
  snapshotHistory();
  if (rerollExclusions[slotId]) rerollExclusions[slotId].delete(prev.trait.id);
  const cur = state[slotId];
  if (cur && cur.trait) diffLog[slotId] = {from: cur.trait.trait, to: prev.trait.trait};
  state[slotId] = prev;
  reapplyConstraintsAfterMutation();
  renderSlotChange(slotId); checkConflicts();
}

function toggleWhy(slotId){ whyOpen[slotId] = !whyOpen[slotId]; renderSlotChange(slotId); }

/* THE UNDO MODEL, stated once. A snapshot is the whole workspace (see _snapshotNow in
   engine.js), and everything that changes what the user would lose is undoable: a
   generation, a reroll, a step-back, a load or import, a note, a pin, a lock sweep.
   What is NOT undoable is deliberate: switching a single card's lock (its own button
   toggles it straight back) and opening a why? panel. */
async function editTraitNote(slotId){
  const s = state[slotId];
  if (!s || !s.trait) return;
  const note = await askForName(`Note on "${s.trait.trait}":`, traitNotes[slotId] || "");
  if (note === null) return;
  if (note === (traitNotes[slotId] || "")) return;   // nothing changed; no snapshot
  snapshotHistory();
  traitNotes[slotId] = note;
  renderSlotChange(slotId);
}
function clearTraitNote(slotId){
  if (traitNotes[slotId] === undefined) return;
  snapshotHistory();
  delete traitNotes[slotId];
  renderSlotChange(slotId);
}

/* TWO DIFFERENT THINGS, which the star used to conflate.

   A FAVOURITE is a bookmark: "I liked this, keep it where I can find it." It changes
   nothing about generation. The star did the other thing — it pushed the trait into
   requiredTraitIds, so bookmarking six traits you liked quietly put all six on every
   character you generated from then on, with the only clue being a chip in a panel you
   were not looking at. Nobody expects a star to do that.

   A REQUIREMENT is a rule: "put this on every character." It keeps its own button and
   says what it is.

   Favourites persist alongside preferences and are listed in the Constraints panel, so
   promoting one to a requirement is still a single press — just a deliberate one. */
let favouriteTraitIds = new Set();
function isFavouriteTrait(id){ return favouriteTraitIds.has(id); }
function getFavouriteTraitIds(){ return [...favouriteTraitIds]; }
function setFavouriteTraitIds(ids){ favouriteTraitIds = new Set(ids || []); }
function favouriteTrait(id){
  const t = TRAITS_BY_ID.get(id);
  if (!t) return;
  if (favouriteTraitIds.has(id)){
    favouriteTraitIds.delete(id);
    toast(`"${t.trait}" removed from your saved traits.`);
  } else {
    favouriteTraitIds.add(id);
    toast(`"${t.trait}" saved. This does not change what gets generated — use the pin button for that.`);
  }
  refreshConstraintChips(); withPreservedFocus(()=>{ renderSheet(); });
  if (typeof savePrefs === 'function') savePrefs();
}
// The generation rule, stated as one.
function requireTrait(id){
  const t = TRAITS_BY_ID.get(id);
  if (!t) return;
  if (requiredTraitIds.includes(id)){
    requiredTraitIds = requiredTraitIds.filter(x=>x!==id);
    toast(`"${t.trait}" is no longer required on every character.`);
  } else {
    requiredTraitIds.push(id);
    bannedTraitIds.delete(id);     // required beats banned, as everywhere else
    toast(`"${t.trait}" will now be included on every character you generate.`);
  }
  // Every card showing this trait's state can change, so this one stays a full render
  // — but it no longer throws the caret away doing it.
  refreshConstraintChips(); withPreservedFocus(()=>{ renderSheet(); });
  if (typeof savePrefs === 'function') savePrefs();
}
function banTrait(id){
  const t = TRAITS_BY_ID.get(id);
  if (!t) return;
  if (bannedTraitIds.has(id)){
    bannedTraitIds.delete(id);
    toast(`"${t.trait}" can be drawn again.`);
  } else {
    bannedTraitIds.add(id);
    requiredTraitIds = requiredTraitIds.filter(x=>x!==id);
    toast(`"${t.trait}" will never be drawn again.`);
  }
  refreshConstraintChips(); withPreservedFocus(()=>{ renderSheet(); });
  if (typeof savePrefs === 'function') savePrefs();
}
function clearExclusions(slotId){
  delete rerollExclusions[slotId];
  renderSlotChange(slotId);
}
function dismissDiff(slotId){ delete diffLog[slotId]; renderSlotChange(slotId); }

// A lock is a CSS class and one aria-pressed. It used to rebuild all 37 cards.
function toggleLock(slotId){
  if (state[slotId]) { state[slotId].locked = !state[slotId].locked; renderSlotChange(slotId); }
}
// Bulk lock changes ARE undoable (a single card's lock is not — see the note above).
function lockAll(){
  snapshotHistory();
  Object.values(state).forEach(s=>{ if (s && s.trait) s.locked = true; });
  withPreservedFocus(()=>{ renderSheet(); });
}
function unlockAll(){
  snapshotHistory();
  Object.values(state).forEach(s=>{ if (s) s.locked = false; });
  withPreservedFocus(()=>{ renderSheet(); });
}

/* ================= PIN INTENSITY =================
   Distinct from lock. Lock freezes the exact trait. Pin freezes the *target*
   this slot draws toward — regeneration and reroll keep landing near that
   intensity level even as sliders elsewhere move around, but the actual trait
   is still free to vary. Lets you say "this mannerism stays roughly this
   intense" while everything else about the character keeps shifting. */
function togglePin(slotId){
  const s = state[slotId];
  if (!s || !s.trait) return;
  snapshotHistory();
  if (pinnedTargets[slotId] !== undefined){
    delete pinnedTargets[slotId];
  } else {
    pinnedTargets[slotId] = clamp((typeof s.target === 'number') ? s.target : traitPos(s.trait), 1, 5);
  }
  renderSlotChange(slotId);
}
function adjustPin(slotId, delta){
  if (pinnedTargets[slotId] === undefined) return;
  // A nudge redraws the card, so it is a content change and belongs on the stack.
  snapshotHistory();
  pinnedTargets[slotId] = clamp(pinnedTargets[slotId] + delta, 1, 5);
  setAffinityVec(null); // live DOM sliders — this always operates on the main character
  // Re-draw immediately so the pin control feels responsive rather than only
  // taking effect on the next full generate/reroll.
  const s = state[slotId];
  if (s && s.trait){
    /* BUG FIX: this drew with a bare pickInRange, consulting neither the slot's own
       rejection memory nor the rest of the sheet — so a single nudge could hand back a
       trait you had explicitly tossed thirty seconds earlier, or one already seated
       elsewhere. Filter the pool up front rather than redrawing blind. */
    const seated = seatedTraitIds(slotId);
    const excluded = rerollExclusions[slotId] || new Set();
    const full = byFilter(s.trait.section, s.trait.category);
    const clean = full.filter(t => !seated.has(t.id) && !excluded.has(t.id));
    // A nudge must always be able to move, so fall back through the constraints in
    // order of how much they matter: never seat a duplicate, but a rejected trait is
    // better than a pin control that does nothing.
    const pool = clean.length ? clean : full.filter(t => !seated.has(t.id));
    const rarityPref = rarityPrefVal();
    const picked = pool.length ? pickInRange(pool, rarityPref, pinnedTargets[slotId], 3) : null;
    if (picked && picked.id !== s.trait.id){ diffLog[slotId] = {from:s.trait.trait, to:picked.trait}; }
    if (picked){ state[slotId] = {...s, target: pinnedTargets[slotId], pinned:true, trait: picked}; }
    else { state[slotId].target = pinnedTargets[slotId]; state[slotId].pinned = true; }
    reapplyConstraintsAfterMutation();
  }
  renderSlotChange(slotId);
}
function unpinAll(){
  if (!Object.keys(pinnedTargets).length) return;
  snapshotHistory();
  pinnedTargets = {};
  withPreservedFocus(()=>{ renderSheet(); });
}

// Applied after a fresh buildCharacterState (before lock-merge, so lock still wins):
// for every slot with a pin, redraw within the SAME section/category the fresh build
// picked, but targeting the pinned intensity rather than whatever the sliders would
// have produced. Also drops pins whose slot no longer exists (section disabled, etc.)
// so they don't linger invisibly.
function applyPinnedTargets(obj, rarityPref){
  Object.keys(pinnedTargets).forEach(slotId=>{
    const cur = obj[slotId];
    if (!cur || !cur.trait){ delete pinnedTargets[slotId]; return; }
    const pool = byFilter(cur.trait.section, cur.trait.category);
    const tgt = pinnedTargets[slotId];
    const picked = pickInRange(pool, rarityPref, tgt, 3);
    obj[slotId] = {...cur, target: tgt, pinned: true, trait: picked || cur.trait};
  });
  return obj;
}

