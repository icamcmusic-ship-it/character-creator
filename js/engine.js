
/* ================= THE RANDOM SOURCE =================
   Every draw in this app goes through rand(), and a seeded build swaps what rand()
   reads rather than reassigning Math.random.

   It used to reassign Math.random — globally, for the duration of a build, restored in
   a finally. That works only because JavaScript is single-threaded and every build is
   strictly synchronous: the moment anything inside a build awaits, yields to a timer,
   or is moved to a worker, an unrelated piece of code calling Math.random gets the
   seeded stream (repeating values, since it is not advanced by anyone else), and
   nothing anywhere reports it. It also made every one of the seven try/finally blocks
   around a build load-bearing: miss one and the whole page's randomness is quietly
   deterministic for the rest of the session.

   A module-level indirection removes the class. Nothing outside this file's own
   swap points can be affected by a seeded build, because nothing outside this app
   calls rand(). */
let _rng = Math.random;
function rand(){ return _rng(); }
/* Swap the source for exactly the duration of fn, restoring the previous one — which
   may itself be a seeded stream, as it is for the pressure sheet's sub-stream. */
function withRng(next, fn){
  const prev = _rng;
  _rng = next;
  try { return fn(); }
  finally { _rng = prev; }
}
// Non-seeded entropy for "pick a seed number" — deliberately NOT rand(), so a seeded
// block asking for a fresh seed does not get one out of its own stream.
function entropySeed(){ return ((Date.now() ^ (Math.random()*0x7fffffff)) >>> 0); }

// ---------- Static category maps ----------
const AXES = {
  verbosityHigh: {section:"Verbosity Traits", category:"High-Volume & Wordy"},
  verbosityLow:  {section:"Verbosity Traits", category:"Minimal & Ultra-Brief"},
  pacing:        {section:"Verbosity Traits", category:"Pacing & Situation-Driven"},
  stylized:      {section:"Verbosity Traits", category:"Stylized & Elaborate"},
  circular:      {section:"Verbosity Traits", category:"Repetitive & Circular"},
};
// ---------- Indexed lookups (built once) ----------
// TRAITS has ~7,000 entries and every pick used to re-scan the whole array with
// .filter(). Build the two maps a lookup actually needs, once, at load.
const TRAITS_BY_ID = new Map();       // id -> trait (undo/import re-linking)
const TRAITS_BY_KEY = new Map();      // "section||category" -> trait[]
const CATS_BY_SECTION = new Map();    // section -> category[] (first-seen order)
const SECTION_OF_CATEGORY = new Map(); // category -> section (categories are unique to one)
/* ================= PACK INDEX =================
   TRAIT_PACKS (declared in traits-core.js, one manifest per data file) says which id
   range each pack owns. Each trait is stamped with its pack at load, and a project can
   disable a pack: byFilter stops drawing from it, but TRAITS_BY_ID keeps every entry so
   a saved character written against that pack still opens with all its cards. */
const PACKS_BY_ID = new Map();
(typeof TRAIT_PACKS !== 'undefined' ? TRAIT_PACKS : []).forEach(p=> PACKS_BY_ID.set(p.id, p));
function packOfId(id){
  for (const p of (typeof TRAIT_PACKS !== 'undefined' ? TRAIT_PACKS : [])){
    if (id >= p.ids[0] && id <= p.ids[1]) return p.id;
  }
  return 'core';
}
let disabledPacks = new Set();
function setPackEnabled(id, on){ if (on) disabledPacks.delete(id); else disabledPacks.add(id); }
function isPackEnabled(id){ return !disabledPacks.has(id); }
function getDisabledPacks(){ return [...disabledPacks]; }
function setDisabledPacks(list){ disabledPacks = new Set(list || []); }

(function indexTraits(){
  TRAITS.forEach(t=>{
    t.pack = packOfId(t.id);
    // The editorial state of an entry. Everything the bank has ever shipped was written
    // and then treated as reviewed by default, which made "core vs secondary" mostly an
    // absence-of-annotation distinction — see the audit's 2.4% figure. Entries are now
    // explicitly `unreviewed` unless a pass has looked at them; the tagging passes below
    // and the hand-reviewed lists promote what they touch.
    if (!t.reviewStatus) t.reviewStatus = 'unreviewed';
    TRAITS_BY_ID.set(t.id, t);
    if (!SECTION_OF_CATEGORY.has(t.category)) SECTION_OF_CATEGORY.set(t.category, t.section);
    const key = t.section + "||" + t.category;
    if (!TRAITS_BY_KEY.has(key)) TRAITS_BY_KEY.set(key, []);
    TRAITS_BY_KEY.get(key).push(t);
    if (!CATS_BY_SECTION.has(t.section)) CATS_BY_SECTION.set(t.section, []);
    const cats = CATS_BY_SECTION.get(t.section);
    if (!cats.includes(t.category)) cats.push(t.category);
  });
})();
/* ================= CONSTRAINT MODE =================
   Hard filters on top of the soft weighting system. Banned categories and banned
   individual traits are enforced at byFilter — the single choke point every pick
   in the app flows through — so nothing can slip past via a specialized pick path.
   Required traits are force-inserted after each build as locked slots. */
/* ================= PHASE 3 — PRESENTATION VARIANTS =================
   Three personality categories conflate opposite presentations of the same pole,
   so one slider position could randomly yield either of two very different people:

     Confidence — Insecure or Egotistical
        "Self-doubting / Approval-seeking"  vs  "Grandiose / Vain / Attention-hungry"
     Emotional Capacity — Guarded & Shallow
        "Guarded" (deep but hidden)         vs  "Shallow" (no depth to hide)
     Intelligence — Instinctive & Unanalytical
        "Street-smart / Gut-driven" (a competence) vs "Simple-minded" (a deficit)

   Rather than split the categories — which would break the bipolar axis model and
   every saved character — each trait is tagged with a variant, and each generated
   character LOCKS one variant per affected category. A sheet then commits to a
   coherent presentation instead of mixing self-loathing with preening.

   Traits that genuinely read either way are left untagged (variant null) and stay
   eligible under both locks — more honest than forcing every trait into a bucket. */
const PRESENTATION_VARIANTS = {
  "Confidence — Insecure or Egotistical": {
    a:{id:"insecure", label:"Insecure / self-doubting",
       re:/insecur|self-doubt|doubt|approval|reassur|apolog|self-deprecat|shrink|timid|anxious|worthless|imposter|fraud|not enough|unworthy|self-critic|hesitat|second-guess|permission|fishing|validation|inadequa|self-conscious|monitor|compar|praise|catastroph|rejection|sabotage|never-satisfied|defensive|checks|deflect/i},
    b:{id:"egotistical", label:"Egotistical / grandiose",
       re:/grandios|vain|arrogan|boast|brag|braggart|superior|attention-hungry|spotlight|preen|self-import|entitl|conceit|showy|peacock|name-drop|smug|self-aggrand|never-wrong|never.admits.fault|egotist|admir|credential-drop|the best there|magnificen/i}
  },
  "Emotional Capacity — Guarded & Shallow": {
    a:{id:"guarded", label:"Guarded (feels it, hides it)",
       re:/guard|withhold|private|conceal|armou?r|wall|reserve|stoic|compartment|deflect|avoid|hidden|closed|seal|protect|redirect|subject|logistics|vault|under wraps|composure|intellectualiz|flinch|shrug|fact when a feeling|never how it felt|humor specifically to end|leaves the room|trained visitors/i},
    b:{id:"shallow", label:"Shallow (little there to hide)",
       re:/shallow|flat|numb|surface|alexithym|absent|empty|no access|no remaining access|nothing there|blank|unfeel|hollow|void|cannot locate|no interior|delayed-reactor|one acceptable emotion/i}
  },
  "Intelligence — Instinctive & Unanalytical": {
    a:{id:"instinctive", label:"Instinctive (a competence)",
       re:/instinct|gut|intuit|street-smart|body-know|feel|sens|read a room|reader|knows without|practical|hands|hunch|first read|picks the|trusts a|trial-and-error|present-moment|present-focused|concrete thinker|trusting-the-expert|overthinking-suspicious|faster than they can explain|not theoretical|direct-action/i},
    b:{id:"unanalytical", label:"Unanalytical (a limitation)",
       re:/simple-minded|unreflect|naive|overwhelm|cannot follow|can't follow|unanalytic|dimwit|dull|one-thing-at-a-time|theory-impatient|simple-explanation|concrete-example|never once explained|never once been able to show/i}
  }
};
(function tagVariants(){
  TRAITS.forEach(t=>{
    const spec = PRESENTATION_VARIANTS[t.category];
    if (!spec) return;
    const txt = (t.trait + " " + t.desc).toLowerCase();
    const mb = spec.b.re.test(txt), ma = spec.a.re.test(txt);
    // null = reads either way, stays eligible under both locks
    t.variant = (mb && !ma) ? "b" : (ma && !mb) ? "a" : null;
  });
})();

/* ================= PHASE 4 — CORE vs SECONDARY TIER =================
   Some traits are dispositions ("Grandiose", "Self-doubting", "Uncompromisingly
   frank") — they can legitimately BE the headline fact about an axis. Others are
   narrow recurring symptoms ("Credential-dropping", "Praise-fishing",
   "Comparison-obsessed") that make poor definitions of an extreme: a character
   maxed on Confidence shouldn't have "drops credentials" as the single defining
   statement about their ego.

   Tagged conservatively by pattern — only unambiguous symptom-shaped names, which
   deliberately excludes adjectival forms like "Adventure-seeking" or "Principled
   truth-teller" that read as dispositions despite similar morphology. This catches
   the clearest cases rather than guessing across the whole bank; broadening it is a
   dedicated data pass, not something a regex should be trusted to finish.

   Effect: secondary traits are progressively down-weighted as the intensity target
   rises, so they still appear in the mild and mid ranges (where a small specific
   behaviour is exactly right) but rarely define a maxed-out axis. */
// Tagging is driven by SECONDARY_TRAIT_NAMES (see tags.js) — an explicit,
// hand-reviewed list. An earlier regex heuristic was removed after review showed
// it consistently mislabelled dispositions ("Principled truth-teller", "Bold
// decision-maker", "Compulsively contrarian") as symptoms purely on morphology.
// The distinction is semantic; a pattern cannot make it.
let TIER_TAG_STATS = null;
(function tagTiers(){
  const secondary = new Set(SECONDARY_TRAIT_NAMES.map(s=>s.toLowerCase()));
  let matched = 0;
  TRAITS.forEach(t=>{
    if (t.section !== "Personality Traits") return;
    if (secondary.has(t.trait.toLowerCase())){ t.tier = "secondary"; matched++; t.reviewStatus = 'reviewed'; }
    else t.tier = "core";   // behaviourally core; editorially still whatever reviewStatus says
  });
  TIER_TAG_STATS = {listed: SECONDARY_TRAIT_NAMES.length, matched};
})();
// Multiplier applied in pickInRange. At low targets secondary traits are fully
// competitive; by target 4+ they're heavily suppressed in favour of dispositions.
function tierWeight(t, target){
  if (t.tier !== "secondary" || target === undefined || target === null) return 1;
  if (target <= 2.5) return 1;
  return clamp(1 - (target - 2.5) / 2.5 * 0.85, 0.15, 1);
}

// Locked variant per category for the CURRENT character. Chosen at generation,
// preserved through rerolls, and exported with the character.
let charVariants = {};

/* The a/b coin used to be exactly 50/50 over pools that are nothing like even. The
   tagging pass leaves roughly 38/11, 37/12 and 43/11 on the three affected categories,
   so half of every character that landed on one of those poles was drawing from a
   17-trait pool instead of 55 — a 3x pool collapse, invisible to the user, on one
   character in two. Weight the coin by how much material each side actually has, with
   a floor so the thinner side never disappears entirely: the sheet still commits to a
   presentation, it just stops committing to the empty cupboard half the time.

   This is a stopgap for a content gap, and it is deliberately shaped like one — the
   right fix is authoring more of the thin side, and when that happens these weights
   move on their own. */
const VARIANT_FLOOR = 0.25;   // the thin side never drops below this share
let VARIANT_ODDS = {};
(function computeVariantOdds(){
  Object.keys(PRESENTATION_VARIANTS).forEach(cat=>{
    let a = 0, b = 0, untagged = 0;
    TRAITS.forEach(t=>{
      if (t.category !== cat) return;
      if (t.variant === 'a') a++; else if (t.variant === 'b') b++; else untagged++;
    });
    // Untagged traits are eligible under BOTH locks, so they count toward each side's
    // realised pool — which is the quantity the coin should actually be weighing.
    const poolA = a + untagged, poolB = b + untagged;
    const raw = (poolA + poolB) ? poolA / (poolA + poolB) : 0.5;
    VARIANT_ODDS[cat] = clamp(raw, VARIANT_FLOOR, 1 - VARIANT_FLOOR);
  });
})();

/* Which presentation locks a set of protected (locked / required / pinned) slots
   ALREADY commits the character to. A kept `Approval-seeking` card is tagged variant
   `a`; rolling Confidence to `b` afterwards left the sheet holding a trait its own
   committed presentation excludes, and every later draw and explanation in that
   category then contradicted the card the user had explicitly kept.
   Returns {category: 'a'|'b'} plus the conflicts it could not honour, because two kept
   traits from opposite variants of one category are the user's to resolve. */
function variantsFromProtected(slots){
  const want = {}, conflicts = [];
  Object.values(slots || {}).forEach(sl=>{
    if (!sl || !sl.trait || !sl.trait.variant) return;
    const protectedSlot = sl.locked || sl.required || (sl.slotId && pinnedTargets[sl.slotId] !== undefined);
    if (!protectedSlot) return;
    const cat = sl.trait.category;
    if (!PRESENTATION_VARIANTS[cat]) return;
    if (want[cat] && want[cat] !== sl.trait.variant){
      conflicts.push({cat, trait: sl.trait.trait, has: sl.trait.variant, committed: want[cat]});
      return;   // first one wins; the conflict is reported rather than silently flipped
    }
    want[cat] = sl.trait.variant;
  });
  return {want, conflicts};
}
let lastVariantConflicts = [];
function getVariantConflicts(){ return lastVariantConflicts; }
/* `required` is a map of category -> variant that this character is already committed
   to (see variantsFromProtected). Those categories are not rolled; the rest are. */
function rollCharacterVariants(required){
  charVariants = {};
  Object.keys(PRESENTATION_VARIANTS).forEach(cat=>{
    if (required && required[cat]){ charVariants[cat] = required[cat]; return; }
    const pA = VARIANT_ODDS[cat] === undefined ? 0.5 : VARIANT_ODDS[cat];
    charVariants[cat] = rand() < pA ? "a" : "b";
  });
}

/* BUG FIX — charVariants was module-global and every generator that rolled it left it
   rolled. generateCast, the foil builder and the gap-filler all called
   rollCharacterVariants() and never restored, so after generating a four-person cast
   the global held cast member #4's locks. Pressing Toss on a Confidence card back on
   the single-character sheet then filtered against a stranger's presentation lock —
   the sheet could end up mixing self-loathing with preening, exactly the failure the
   variant system exists to prevent, and the why? panel would confidently name the
   wrong lock. Export had the same defect: exportCharacterJSON writes charVariants,
   which after a cast generation was not this character's.

   Same shape of leak, and the same fix, as withoutContextBias(): save and restore
   around the borrowing generator rather than clearing, because the single-character
   sheet's locks are live state the why? panel reads back. */
function withCharacterVariants(fn){
  const saved = charVariants;
  try { rollCharacterVariants(); return fn(); }
  finally { charVariants = saved; }
}
// For generators that roll their own variants per item (the cast loop) — restore the
// caller's locks once the whole batch is done.
function withSavedVariants(fn){
  const saved = charVariants;
  try { return fn(); }
  finally { charVariants = saved; }
}
/* ================= SPECULATIVE GENERATION =================
   Every generator that builds a character the user has not accepted — the batch tray,
   the cast, the foil, the gap-filler — runs the SAME full build as the real one, and
   the full build writes to eight pieces of module-global session state. Each of those
   generators hand-restored a different subset, and every time a new one was added it
   re-introduced a variant of the same leak (three times so far, per the notes on
   withCharacterVariants and withoutContextBias above). generateBatch was the most
   recent and the worst: it restored {state, charMeta, pressureState, lastSheetTraits}
   and nothing else, so after a five-candidate batch charVariants held candidate #5's
   presentation locks. Picking candidate #2 then filtered every subsequent reroll
   through a different character's lock, the why? panel named the wrong one, and export
   wrote them. It also pushed five snapshots onto a 15-deep undo stack (evicting the
   user's real history), five entries into the anti-repetition window and lastBySlot,
   five vectors into sessionProfiles, and left lastGenerationSignature pointing at a
   candidate that was thrown away — so the next novelty readout compared against a
   character the user never saw.

   One helper, one list, restored in a finally. A new generator gets isolation by being
   wrapped rather than by remembering which eight globals exist. */
function withSpeculativeGeneration(fn){
  const saved = {
    charVariants,
    history: history.slice(),
    redoStack: redoStack.slice(),
    recentTraitIds: recentTraitIds.slice(),
    recentFamilies: recentFamilies.slice(),
    lastBySlot: Object.assign({}, lastBySlot),
    sessionProfiles: sessionProfiles.slice(),
    lastGenerationSignature: (typeof lastGenerationSignature !== 'undefined') ? lastGenerationSignature : undefined,
    categoryUse: new Map(CATEGORY_USE),
  };
  try { return fn(); }
  finally {
    charVariants = saved.charVariants;
    history = saved.history;
    redoStack = saved.redoStack;
    recentTraitIds = saved.recentTraitIds;
    recentFamilies = saved.recentFamilies;
    lastBySlot = saved.lastBySlot;
    sessionProfiles = saved.sessionProfiles;
    if (saved.lastGenerationSignature !== undefined) lastGenerationSignature = saved.lastGenerationSignature;
    CATEGORY_USE.clear();
    saved.categoryUse.forEach((v,k)=>CATEGORY_USE.set(k,v));
    if (typeof updateUndoButtons === 'function') updateUndoButtons();
  }
}
function variantLabelFor(cat, variants){
  const spec = PRESENTATION_VARIANTS[cat], v = (variants || charVariants)[cat];
  return (spec && v) ? spec[v].label : null;
}

let bannedCategories = new Set();   // category names that never generate
let bannedSections = new Set();     // whole sections that never generate
let bannedTraitIds = new Set();     // individual trait ids that never generate
let requiredTraitIds = [];          // trait ids force-included on every generation
let requiredCategories = [];        // categories guaranteed at least one trait
let exclusivePairs = [];            // [[idA, idB], ...] — never both on one sheet

function byFilter(section, category){
  let pool = TRAITS_BY_KEY.get(section+"||"+category) || [];
  if (bannedSections.has(section)) return [];
  if (bannedCategories.has(category)) return [];
  if (bannedTraitIds.size) pool = pool.filter(t=>!bannedTraitIds.has(t.id));
  if (disabledPacks.size) pool = pool.filter(t=>!disabledPacks.has(t.pack));
  // Variant lock (Phase 3): applied here so EVERY path — generation, reroll, pin
  // adjust, cast, foil — respects the character's committed presentation, with no
  // way for a mixed sheet to slip through a specialized pick path.
  const lock = charVariants[category];
  if (lock) pool = pool.filter(t => !t.variant || t.variant === lock);
  return pool;
}
function catsOf(section){ return CATS_BY_SECTION.get(section) || []; }

/* ================= TRAIT SHAPE ASSERTIONS =================
   TRAITS entries are assumed everywhere to carry {id, section, category, trait, desc,
   example, intensity, rarity, pol}. A malformed entry — a missing example, an intensity
   of 0, a rarity string that is not one of the four tiers — does not fail at the data
   file. It fails much later, at an arbitrary draw, in a stack that says nothing about
   which line of which file is wrong.

   The test suite covers this for CI. It does not cover somebody hand-editing a data
   file locally and reloading, which is exactly when the feedback is worth having. Runs
   only with ?dev=1 in the URL, so it costs a normal load nothing. */
/* ================= TRAIT SCHEMA, INCLUDING THE OPTIONAL STRUCTURED FIELDS =================
   The founding shape is {id, section, category, trait, desc, example, intensity, rarity,
   pol}. The audit's schema evolution adds optional fields in stages; every one of them
   is optional so the existing bank is valid unchanged, and every one is validated here
   so a malformed value fails at load in ?dev=1 and in the test suite, not at a draw.

     conceptFamily     string   — the concept this is a paraphrase-family member of; the
                                  near-duplicate review groups by it
     behaviorFunction  string   — what the behaviour DOES for the person (protect, signal,
                                  soothe, control, connect, avoid, perform, repair …)
     conditions        string[] — contexts in which it is active: public, private,
                                  authority, threat, intimacy, fatigue, work, home
     exceptions        string[] — who or what it does not apply to ("except family")
     frequency         1..5     — how often it shows, independently of intensity
     visibility        1..5     — how noticeable it is to others
     persistence       1..5     — how stable across time
     narrativeSalience 1..5     — how much of the character it explains
     worldTags         string[] — applicability: modern, pre-modern, any, urban, rural …
     supports/conflicts/requires  number[] — trait ids
     examplesBySituation  {context: string}
     reviewStatus      'unreviewed' | 'reviewed' | 'flagged'
     revision          string
   A physical characteristic does not acquire a moral vector by being given these
   fields, and a neutral behaviour can be explicitly unpolarised. */
const TRAIT_CONTEXTS = ['public','private','authority','threat','intimacy','fatigue','work','home','stranger','peer','dependent'];
const TRAIT_WORLD_TAGS = ['any','modern','pre-modern','industrial','futuristic','urban','rural','military','institutional','domestic','online'];
const TRAIT_REVIEW_STATES = ['unreviewed','reviewed','flagged'];
function assertTraitShape(){
  const problems = [];
  const seenIds = new Set();
  const push = (t, msg) => { if (problems.length < 40) problems.push(`#${t && t.id} ${(t && t.trait) || '(no name)'}: ${msg}`); };
  TRAITS.forEach(t=>{
    if (!t || typeof t !== 'object') return problems.push('a non-object entry in TRAITS');
    if (t.id === undefined) return push(t, 'no id');
    if (seenIds.has(t.id)) push(t, 'duplicate id');
    seenIds.add(t.id);
    ['section','category','trait','desc','example'].forEach(k=>{
      if (typeof t[k] !== 'string' || !t[k].trim()) push(t, `${k} is missing or empty`);
    });
    if (!Number.isInteger(t.intensity) || t.intensity < 1 || t.intensity > 5) push(t, `intensity ${t.intensity} is not 1-5`);
    if (!RTIER_SET.has(t.rarity)) push(t, `rarity "${t.rarity}" is not one of ${RTIER_ORDER.join('/')}`);
    if (t.pol && typeof t.pol !== 'object') push(t, 'pol is not an object');
    Object.entries(t.pol || {}).forEach(([ax, v])=>{
      if (!AXIS_LABELS[ax]) push(t, `pol names an unknown axis "${ax}"`);
      if (typeof v !== 'number') push(t, `pol.${ax} is not a number`);
    });
    // ---- optional structured fields ----
    const strList = (k, allowed) => {
      if (t[k] === undefined) return;
      if (!Array.isArray(t[k]) || t[k].some(x=>typeof x !== 'string')) return push(t, `${k} is not a list of strings`);
      if (allowed) t[k].forEach(x=>{ if (!allowed.includes(x)) push(t, `${k} has an unknown value "${x}"`); });
    };
    const scale = k => { if (t[k] !== undefined && (!Number.isInteger(t[k]) || t[k] < 1 || t[k] > 5)) push(t, `${k} ${t[k]} is not 1-5`); };
    const idList = k => { if (t[k] !== undefined && (!Array.isArray(t[k]) || t[k].some(x=>!Number.isInteger(x)))) push(t, `${k} is not a list of trait ids`); };
    ['conceptFamily','behaviorFunction','revision'].forEach(k=>{ if (t[k] !== undefined && typeof t[k] !== 'string') push(t, `${k} is not a string`); });
    strList('conditions', TRAIT_CONTEXTS); strList('exceptions'); strList('worldTags', TRAIT_WORLD_TAGS);
    ['frequency','visibility','persistence','narrativeSalience'].forEach(scale);
    ['supports','conflicts','requires'].forEach(idList);
    if (t.examplesBySituation !== undefined){
      if (!t.examplesBySituation || typeof t.examplesBySituation !== 'object' || Array.isArray(t.examplesBySituation)) push(t, 'examplesBySituation is not an object');
      else Object.entries(t.examplesBySituation).forEach(([c,v])=>{
        if (!TRAIT_CONTEXTS.includes(c)) push(t, `examplesBySituation names an unknown context "${c}"`);
        if (typeof v !== 'string') push(t, `examplesBySituation.${c} is not a string`);
      });
    }
    if (t.reviewStatus !== undefined && !TRAIT_REVIEW_STATES.includes(t.reviewStatus)) push(t, `reviewStatus "${t.reviewStatus}" is not one of ${TRAIT_REVIEW_STATES.join('/')}`);
  });
  // Cross-reference: supports/conflicts/requires must name real ids.
  TRAITS.forEach(t=>{
    ['supports','conflicts','requires'].forEach(k=>{
      (t[k] || []).forEach(id=>{ if (!seenIds.has(id)) push(t, `${k} names a trait id that does not exist (${id})`); });
    });
  });
  return problems;
}
/* ================= CONTENT COVERAGE ASSERTIONS =================
   assertTraitShape catches a malformed entry. It cannot catch the far commoner failure
   in a bank this size, which is content that is well-formed and MISSING — a category
   with nothing near the target the engine will ask for, or a section whose traits carry
   no polarity, which silently switches off polarityFit for that whole section.

   These are the invariants the 2025 balance audit measured by hand, stated so a content
   author sees the gap on the next reload instead of six months later in a distribution
   study. Reported, never thrown: every one of these is a "this section is thin", not a
   "this build is broken", and the app works fine either way. */
const COVERAGE_LIMITS = {
  // A category below this can't fill a draw window without reaching the pool edges.
  minCategorySize: 20,
  /* Every section drawn against slider posture wants most of its traits polarity-tagged;
     below that, polarityFit has nothing to select on and the sliders reach the CATEGORY
     but not the trait within it. Measured: the seven profile sections are at 100%,
     Personality 75%, Verbosity 76% — and then Vocabulary 34%, Dialogue Grammar 33%,
     Mannerisms 21%, Appearance 18%. That is roughly seven of 37 slots on a default
     sheet, plus all of Appearance, where the sliders can only choose a category.
     One target for all of them, deliberately: these numbers report a standing content
     debt, and setting the bar under where the thin sections already sit would report
     nothing, which is the state that let this go unnoticed. */
  minPolarityShare: 0.6,
  // Of the 20 (rarity x intensity) cells a category could populate, how many must be.
  // Mean across the bank is 10.7 and the thinnest categories fill 8: within one of
  // those you cannot ask for "a quiet, defining Loyalty-Bound trait", because the
  // category is a diagonal stripe rather than a grid.
  minRarityIntensityCells: 12,
  // A polarity axis this one-sided leaves a slider pointed the minority way with thin
  // material — the fault the mood pass corrected once, by hand, for one axis.
  /* [0.4, 0.6] is set to catch exactly the five axes measured one-sided — formality
     (72% positive), analytical thinking (69%), physical energy (64%), self-confidence
     (38%) and volume/wordiness (38%) — while leaving the eleven that sit at 47-60%
     alone. polNormalise stops these reading as posture on the radar, but as the notes
     on the rebel/intel axes already say, it cannot fix the DRAW: polarityFit still has
     thin material when those sliders go the minority direction. */
  polarityBalanceBand: [0.4, 0.6],
};
function assertContentCoverage(){
  const problems = [];
  const push = m => { if (problems.length < 250) problems.push(m); };
  /* Section-level findings first, category-level second: the (rarity x intensity) cell
     check alone produces one line per thin category and would otherwise bury the four
     section-wide gaps, which are the ones that change what the engine can do. */
  // --- Polarity coverage, per section ------------------------------------------------
  const bySection = new Map();
  TRAITS.forEach(t=>{
    const e = bySection.get(t.section) || {total:0, tagged:0};
    e.total++;
    if (t.pol && Object.keys(t.pol).length) e.tagged++;
    bySection.set(t.section, e);
  });
  bySection.forEach((e, section)=>{
    const share = e.tagged / e.total;
    if (share < COVERAGE_LIMITS.minPolarityShare)
      push(`${section}: ${(share*100).toFixed(0)}% of ${e.total} traits carry a polarity tag (want ${(COVERAGE_LIMITS.minPolarityShare*100).toFixed(0)}%+) — polarityFit is inert here, so the sliders reach the category but not the trait`);
  });
  // --- Every axis needs BOTH poles, or a slider pointing the minority way has no
  //     material to select on (the fault the mood fix corrected once, by hand) --------
  const poles = {};
  TRAITS.forEach(t=> Object.entries(t.pol || {}).forEach(([ax, v])=>{
    const e = poles[ax] = poles[ax] || {pos:0, neg:0};
    if (v > 0) e.pos++; else if (v < 0) e.neg++;
  }));
  Object.entries(poles).forEach(([ax, e])=>{
    const total = e.pos + e.neg;
    if (!total) return;
    const share = e.pos / total;
    const [lo, hi] = COVERAGE_LIMITS.polarityBalanceBand;
    if (share < lo || share > hi)
      push(`axis "${AXIS_LABELS[ax] || ax}" is ${(share*100).toFixed(0)}% positive (${e.pos} vs ${e.neg}) — a slider pointed the minority way has thin material to select on`);
  });
  // --- Category size, and the (rarity x intensity) cells it actually populates -------
  TRAITS_BY_KEY.forEach((pool, key)=>{
    const [section, category] = key.split('||');
    if (pool.length < COVERAGE_LIMITS.minCategorySize)
      push(`${section} > ${category}: only ${pool.length} traits (want ${COVERAGE_LIMITS.minCategorySize}+)`);
    const cells = new Set();
    pool.forEach(t=> cells.add(t.rarity + '|' + t.intensity));
    if (cells.size < COVERAGE_LIMITS.minRarityIntensityCells)
      push(`${section} > ${category}: fills only ${cells.size} of 20 rarity x intensity cells — within this category you cannot ask for a quiet defining trait`);
  });
  return problems;
}
/* Windows the engine will actually ask for at DEFAULT settings, measured against the
   pools that will have to answer. A window that resolves to a handful of traits is the
   mechanism behind every "everything feels the same" report, and it is invisible in
   the data files. */
function assertDrawWindows(){
  const problems = [];
  const check = (section, category, target, label) => {
    const pool = TRAITS_BY_KEY.get(section+'||'+category) || [];
    if (!pool.length) return;
    const sel = rangeSelect(pool, target);
    const eligible = sel && sel.list ? sel.list.length : 0;
    const share = eligible / pool.length;
    if (share < 0.35)
      problems.push(`${label}: only ${eligible} of ${pool.length} traits are eligible at target ${target.toFixed(2)} (${(share*100).toFixed(0)}% of the pool is unreachable at default settings)`);
  };
  const motivTarget = targetFromMag(55);
  catsOf("Motivation & Wound").forEach(cat=> check("Motivation & Wound", cat, motivTarget, `Motivation > ${cat}`));
  check("Appearance", "Movement & Bearing", targetFromMag(40), "Appearance > Movement & Bearing");
  check("Appearance", "Distinguishing Marks", targetFromMag(15), "Appearance > Distinguishing Marks");
  return problems;
}
if (typeof location !== 'undefined' && /[?&]dev=1\b/.test(location.search || '')){
  setTimeout(()=>{
    const problems = assertContentCoverage();
    if (!problems.length){ console.info('[dev] content coverage OK'); return; }
    /* A standing debt, not a breakage — grouped so the shape of it is legible rather
       than sixty lines of the same complaint. console.group collapses by default in
       every devtools that has it. */
    console.groupCollapsed(`[dev] ${problems.length} content coverage gap(s) — click to expand`);
    problems.forEach(m=>console.warn(m));
    console.groupEnd();
  }, 0);
  setTimeout(()=>{
    const problems = assertDrawWindows();
    if (!problems.length){ console.info('[dev] draw windows OK'); return; }
    console.warn(`[dev] ${problems.length} narrow draw window(s) at default settings:\n` + problems.join('\n'));
  }, 0);
  setTimeout(()=>{
    const problems = assertTraitShape();
    if (!problems.length){ console.info(`[dev] trait shape OK — ${TRAITS.length} entries`); return; }
    console.error(`[dev] ${problems.length} malformed trait entr${problems.length===1?'y':'ies'}:\n` + problems.join('\n'));
    if (typeof toast === 'function') toast(`${problems.length} malformed trait entries — see the console.`, 'warn', 9000);
  }, 0);
  setTimeout(()=>{
    const problems = assertAxisTables();
    if (!problems.length){ console.info('[dev] axis tables OK'); return; }
    console.error(`[dev] ${problems.length} axis-table problem(s):\n` + problems.join('\n'));
    if (typeof toast === 'function') toast(`${problems.length} axis-table problems — see the console.`, 'warn', 9000);
  }, 0);
}


// Coarse polarity for the 7 Profile sections, mirroring DEPTH_TO_PERSONALITY's logic
// but expressed as signed axis contributions so these traits plug into the SAME
// conflict-detection and axisProfile() machinery Personality traits already use.
// Motivation & Wound is intentionally left untagged — its four sub-categories
// (Want/Fear/Wound/Lie) aren't a pos/neg spectrum the way the other six are.
const PROFILE_CATEGORY_POLARITY = {
  /* The rebel and intel entries below were one-directional: Instigator, Outsider,
     Absurd & Chaotic and Risk & Escape all granted rebel:+1 and NOTHING in the whole
     profile taxonomy granted rebel:-1; Skeptic, Pragmatic, Dry & Deadpan and
     Intellectual & Wordplay all granted intel:+1 and nothing granted intel:-1. Measured
     across the bank that produced 290:60 on rebelliousness and 436:93 on analytical
     thinking, which polNormalise correctly stops reading as posture on the radar but
     cannot fix in the draw — polarityFit had almost nothing to select on when either
     slider went negative. Categories that genuinely read as deferring to the group, or
     as acting rather than analysing, now say so. */
  "Fight (attack the threat)": {asrt:1, agr:-1, intel:-1}, "Flight (remove yourself)": {asrt:-1},
  "Freeze (shut down)": {ego:-1, mood:-1}, "Fawn (appease the threat)": {agr:1, asrt:-1, rebel:-1},
  "Leader": {asrt:1, ego:1}, "Peacemaker": {agr:1, warm:1, rebel:-1, mood:1}, "Instigator": {rebel:1, agr:-1},
  "Outsider": {warm:-1, rebel:1}, "Caretaker": {warm:1, emo:1}, "Skeptic": {intel:1, pos:-1},
  "Rigid & Principled": {disc:1, hon:1, rebel:-1}, "Pragmatic & Flexible": {hon:-1, intel:1},
  "Loyalty-Bound": {warm:1, agr:1, rebel:-1, intel:-1}, "Self-Interested": {warm:-1, hon:-1},
  /* mood was the last one-directional code left in this table: Freeze, Disorganized,
     Substance and Avoidance all pushed it down and nothing anywhere pushed it up, which
     is most of why 93% of the bank's mood tags are negative and why generated
     characters trend anxious. These four categories are the ones that genuinely assert
     equanimity rather than a performance of it — the same distinction the MOOD_POSITIVE
     id list is drawn on. */
  "Secure": {ego:1, emo:1, mood:1}, "Anxious": {ego:-1, emo:1}, "Avoidant": {emo:-1, warm:-1}, "Disorganized": {mood:-1, disc:-1},
  "Dry & Deadpan": {intel:1, emo:-1}, "Self-Deprecating": {ego:-1}, "Cruel & Barbed": {warm:-1, agr:-1},
  "Warm & Playful": {warm:1, pos:1, mood:1}, "Absurd & Chaotic": {disc:-1, rebel:1}, "Humorless & Absent": {pos:-1, disc:1},
  "Substance & Consumption": {disc:-1, mood:-1}, "Compulsion & Ritual": {disc:1, ego:-1},
  "Risk & Escape": {disc:-1, rebel:1}, "Restraint & Discipline": {disc:1, rebel:-1, mood:1},
  // Added for the 4 new sub-groups (Connector, Idealistic & Visionary, Intellectual &
  // Wordplay, Avoidance & Procrastination) — without these, traits in those categories
  // carry empty pol and are invisible to conflict detection and the Relationship/Ensemble
  // tools, exactly the gap fixed earlier for the original sections.
  "Connector": {warm:1, act:1}, "Idealistic & Visionary": {hon:1, pos:1},
  "Intellectual & Wordplay": {intel:1}, "Avoidance & Procrastination": {disc:-1, mood:-1},
};
let PROFILE_POLARITY_STATS = null;
(function applyProfilePolarity(){
  /* Same guard bug as applyPersonalityPolePolarity below: this only fired on a trait
     whose pol was COMPLETELY empty, so an entry declaring a single orthogonal axis —
     a Caretaker trait tagged {disc:1}, say — never received the warm/emo its category
     determines. Merge per axis instead, leaving any axis the trait speaks to itself
     alone, which is the rule the guard was reaching for. */
  let tagged = 0, keptExplicit = 0;
  TRAITS.forEach(t=>{
    const tags = PROFILE_CATEGORY_POLARITY[t.category];
    if (!tags) return;
    if (!t.pol) t.pol = {};
    Object.entries(tags).forEach(([code, sign])=>{
      if (t.pol[code]){ keptExplicit++; return; }
      t.pol[code] = sign; tagged++;
    });
  });
  PROFILE_POLARITY_STATS = {tagged, keptExplicit};
})();

// ================= MOTIVATION & WOUND POLARITY TAGGING =================
// Unlike the other six Profile sections, Motivation & Wound has no natural pos/neg
// spectrum PER CATEGORY — Want, Fear, Wound, and Lie aren't opposed to each other,
// so PROFILE_CATEGORY_POLARITY intentionally skips it. But individual TRAITS within
// it clearly do lean psychologically one way or another — "Vengeance" and
// "Redemption" are not the same person — and leaving every one of them at pol:{}
// meant this whole section was invisible to conflict detection, Relationship/
// Ensemble analysis, and the trait-level polarity-affinity weighting above. Tag by
// keyword match against the trait's own text instead of by category. Rules run in
// order and merge (a trait can match several); anything matching nothing stays
// untagged exactly as before, so this is purely additive.
/* Roughly half this section's entries are written hyphenated — "Fear-of-becoming-a-
   burden", "'My-worth-is-conditional'" — and every rule below is written in prose, so a
   rule reading /becoming a burden/ silently never matched the trait it was written for.
   That is most of why 128 entries came back untagged despite 33 rules covering
   apparently all of the ground. Normalise the separators once, here, for both the
   polarity pass and the cross-link pass. */
function motivationText(t){
  return (t.trait + " " + t.desc).toLowerCase().replace(/[-_\u2010-\u2015]+/g, " ");
}
const MOTIVATION_POLARITY_RULES = [
  [/vengeance|suffer a specific consequence|specific person to suffer/i, {agr:-1, rebel:1}],
  [/\bsafety\b|nothing can reach them|structure and control|losing control|losing agency|\bchaos\b/i, {disc:1}],
  [/\bfreedom\b|answerable to nobody|independence|no masters/i, {rebel:1, agr:-1}],
  [/\btruth\b|fair hearing|actually happened|being.believed|honesty/i, {hon:1, intel:1}],
  [/\bpower\b|leverage|control prevents|only safety|real strength means no help/i, {asrt:1, ego:1}],
  [/belonging|reunion|community.standing|quiet.partnership|restored.family|place where they/i, {warm:1, emo:1}],
  [/\bescape\b|isolat|genuinely alone|apart from|nobody stays|empty rooms|silence keeps/i, {warm:-1}],
  [/redemption|amends|clean conscience|balance a debt|debt.clearing|forgive/i, {hon:1, emo:1}],
  [/recognition|\blegacy\b|vindicat|proving.wrong|being.chosen|place in history|acknowledg/i, {ego:1}],
  [/abandon|left behind|replaced|losing the last one/i, {emo:1, ego:-1}],
  [/exposure|\bfraud\b|specific vulnerability|discover.*weakness/i, {emo:-1, ego:-1}],
  [/intimacy|dependence|needing anyone|genuinely known/i, {emo:-1, warm:-1}],
  [/\bfailure\b|falling short|wasted potential|potential will go unused/i, {ego:-1}],
  [/harming others|what they might do/i, {agr:1}],
  [/stagnation|irrelevance|outliving|no longer need/i, {pos:-1}],
  [/becoming.{0,15}them\b|repeat.*history|repeating on them/i, {mood:-1}],
  [/betray|broken promise|exploited|trust.{0,15}wrong|deceived/i, {hon:1, agr:-1}],
  [/conditional love|only.worth|must be useful|worth is conditional|last success/i, {ego:-1, disc:1}],
  [/poverty|financial independence/i, {disc:1}],
  [/squandered|talent.{0,10}prevented/i, {pos:-1}],
  [/overlooked|chosen last|silenced|invisible/i, {warm:-1, ego:-1}],
  [/\bperfect\b|no mistakes|flawlessness/i, {disc:1, ego:-1}],
  [/never freely given|distrust|is naive/i, {warm:-1, hon:-1}],
  [/must not want|wanting.{0,10}selfish|desire itself/i, {disc:1, pos:-1}],
  [/\bowe\b|service|must be useful|justify.{0,15}being alive/i, {agr:1, disc:1}],
  [/hide what.{0,15}feel|silence is strength|showing feeling/i, {emo:-1}],
  [/my fault|deserved what happened|blamed for/i, {ego:-1, emo:1}],
  [/mastery|undeniably excellent|best at/i, {disc:1, ego:1}],
  [/purpose|mean something specific|worthy death/i, {pos:1}],
  [/\bcomfort\b|end to struggle|quiet ending|simple.normalcy/i, {act:-1}],
  [/protection of another|kept safe above|justice for another/i, {warm:1, agr:1}],
  [/all-consuming|swallowed every other priority|eaten the person/i, {disc:1}],
  /* A second pass over the 128 entries the rules above still missed. The originals were
     written against the four founding categories and never revisited when The Need, The
     Ghost and The Defence were added, and several of the commonest Fear/Wound/Lie shapes
     (humiliation, insignificance, powerlessness, survivor guilt, hurt by a protector)
     had no rule at all — so the section's most archetypal entries were exactly the ones
     falling through. Same additive contract: anything still matching nothing stays
     untagged, and a rule never overwrites a tag a trait sets itself. */
  [/humiliat|brought low|named.unworthy|declared unfit|shamed|took the fall|left.holding.the.blame/i, {ego:-1, emo:1}],
  [/insignifican|amounting to nothing|leaving no trace|being ordinary|forgotten|fear.of.silence/i, {ego:-1, pos:-1}],
  [/powerless|unable to act|losing control|spiraling beyond/i, {disc:1, ego:-1}],
  [/failed to save|couldn't stop it|survived what others|alive by accident|survivor/i, {emo:1, ego:-1}],
  [/harmed by a protector|meant to keep them safe|hurt by the person/i, {emo:1, warm:-1, hon:-1}],
  [/exiled|cast out|removed from the place|home destroyed|taken or ruined/i, {warm:-1, pos:-1}],
  [/lost faith|belief system collapsed|left nothing|being wrong|core belief is a mistake/i, {pos:-1, intel:1}],
  [/ruin what I touch|inherently destructive|don't deserve|happiness is for other people/i, {ego:-1, pos:-1}],
  [/unlovable|affection shown to them is a mistake/i, {ego:-1, warm:-1}],
  [/world is rigged|effort is pointless|against the system/i, {pos:-1, rebel:1}],
  [/restoration|put back something|undoing.a.mistake|fix one past error|broke a vow/i, {hon:1, emo:1}],
  [/proving.capability|demonstrate they can|everyone doubts/i, {ego:1, disc:1}],
  [/disappointing.a.mentor|letting down the one person|whose opinion matter/i, {agr:1, ego:-1}],
  [/becoming a burden|needing more care than they can offer/i, {ego:-1, agr:1}],
  [/fear of loss|losing what they've built/i, {disc:1, emo:1}],
  [/repetition|becoming their parent/i, {disc:1, ego:-1}],
  /* The four intensity-scale entries in each category ("A small doubt", "A defining,
     unhealed wound") describe HOW MUCH rather than what, so they carry no direction and
     are correctly left alone by every rule above. */
];
(function applyMotivationPolarity(){
  TRAITS.forEach(t=>{
    if (t.section !== "Motivation & Wound") return;
    if (!t.pol || Object.keys(t.pol).length > 0) return; // never clobber existing tags
    const text = motivationText(t);
    const acc = {};
    MOTIVATION_POLARITY_RULES.forEach(([re, tags])=>{ if (re.test(text)) Object.assign(acc, tags); });
    if (Object.keys(acc).length) Object.assign(t.pol, acc);
  });
})();

/* ================= MOOD AXIS — THE MISSING POSITIVE POLE =================
   BUG FIX. `mood` was the only polarity code in AXIS_LABELS with no positive side at
   all: 200 tagged traits across the whole bank, every one of them negative. Every
   system that reads polarity — the weight matrix, axisProfile, conflict detection,
   the radar chart, the relationship and ensemble analysers — could therefore only
   ever see mood as a deficit. A character could be volatile, bleak, or unstable;
   there was no vocabulary in which one could be *even-tempered*, so the radar always
   rendered mood as a half-empty spoke and checkConflictsFor could never find a mood
   contradiction (a contradiction needs both signs).

   Tagged from an explicit, hand-reviewed id list rather than a pattern, for the same
   reason the Manners and tier passes above are: the distinction is semantic. A regex
   on "steady"/"composure"/"cheerful" pulls in "Shaky-composure mask", "Over-bright
   cheer", "Bright-performative cheer", and "Composure-obsessed" — all of which are
   precisely the opposite claim, a performance of steadiness over an unsteady interior.
   These are the entries that assert genuine equanimity: not "hides the feeling", but
   "the feeling is proportionate and the floor is solid". */
const MOOD_POSITIVE_IDS = [
  1229, 1339, 1342, 1345, 1410, 1777, 1942, 2036, 2112, 2160, 2174, 2421, 2530, 2537,
  2695, 2828, 2918, 3049, 3625, 3713, 3750, 3760, 3763, 3764, 4324, 5974,
  90331, 92110, 98201, 100084, 100102,
];
let MOOD_TAG_STATS = null;
(function applyMoodPositive(){
  /* The stat used to be a bare matched/listed, which reported 30/31 — and a shortfall
     of one is indistinguishable from a typo'd id that silently tags nothing. Count the
     three outcomes separately: `tagged` (this pass set it), `alreadyTagged` (the entry
     carried an explicit mood tag and the pass correctly refused to clobber it), and
     `missing` (an id in the list that matches no trait, which IS a bug). Only `missing`
     should ever be non-zero unexpectedly, and the test asserts exactly that. */
  const want = new Set(MOOD_POSITIVE_IDS);
  const found = new Set();
  let tagged = 0, alreadyTagged = 0;
  TRAITS.forEach(t=>{
    if (!want.has(t.id)) return;
    found.add(t.id);
    if (!t.pol) t.pol = {};
    if (t.pol.mood) { alreadyTagged++; return; }   // never clobber an explicit tag
    t.pol.mood = 1; tagged++;
  });
  const missing = MOOD_POSITIVE_IDS.filter(id=>!found.has(id));
  MOOD_TAG_STATS = {listed: MOOD_POSITIVE_IDS.length, matched: found.size,
                    tagged, alreadyTagged, missing};
})();

const VOCAB_CATS = catsOf("Vocabulary Traits");
const GRAMMAR_CATS = catsOf("Dialogue Grammar Traits");
const MANNER_CATS = catsOf("Mannerisms");

const VOLATILE_MANNER_CATS = ["Emotional Affectations","Physical Vocalizations & Noises","Micro-Physical Tics"];
const CALM_MANNER_CATS = ["Postural & Spatial Dynamics","Gestural & Kinetic Integration","Environmental Interaction Mannerisms"];

let ARCHETYPES = {
  soldier:  {label:"Wounded Soldier", verbosity:-1, register:-1, composure:1, vocabPref:["Conceptual Framework & Loanwords","Precision & Specificity Level"],
             pers:{discipline:70, rebelliousness:-40, emotionalcapacity:-55, assertiveness:45, friendliness:-25}},
  conartist:{label:"Smug Con Artist", verbosity:1, register:1, composure:-1, vocabPref:["Pragmatic Focus & Speech Functions","Directness & Literalness"],
             pers:{honesty:-85, confidence:60, friendliness:55, manners:40, intelligence:50, agreeableness:-30}},
  intern:   {label:"Anxious Intern", verbosity:1, register:0, composure:2, vocabPref:["Register & Formality Spectrum"],
             pers:{confidence:-70, assertiveness:-65, agreeableness:70, manners:55, rebelliousness:-45}},
  scholar:  {label:"Weary Scholar", verbosity:0, register:2, composure:-1, vocabPref:["Morphological & Structural Lexicon","Precision & Specificity Level"],
             pers:{intelligence:85, activeness:-60, positivity:-35, discipline:50, emotionalcapacity:-20, manners:40, curiosity:60}},
  noble:    {label:"Cold Noble", verbosity:-1, register:2, composure:-2, vocabPref:["Register & Formality Spectrum","Semantic Density & Modifiers"],
             pers:{manners:80, friendliness:-70, confidence:65, emotionalcapacity:-60, rebelliousness:-50, assertiveness:50}},
  child:    {label:"Wide-eyed Child", verbosity:1, register:-2, composure:1, vocabPref:["Abstractness & Sensory Modality"],
             pers:{intelligence:-45, positivity:70, emotionalcapacity:60, activeness:75, discipline:-60, honesty:55, manners:-35, curiosity:70}},
  // Widened from the original 6 — the blend math below (archOverrides, the 0.35/0.65
  // lerp in generateCharacter) already supports any number of these with zero engine
  // changes, so a narrow preset list was the cheapest lever available against
  // repeatedly-hit, conventional character types.
  burntIdealist:      {label:"Burnt-Out Idealist", verbosity:0, register:1, composure:-1, vocabPref:["Affective & Emotional Intensity","Temporal Orientation & Tense Usage"],
             pers:{positivity:-55, intelligence:55, discipline:35, emotionalcapacity:40, curiosity:30, activeness:-30, honesty:60}},
  charmingManipulator: {label:"Charming Manipulator", verbosity:1, register:0, composure:1, vocabPref:["Pragmatic Focus & Speech Functions","Affective & Emotional Intensity"],
             pers:{honesty:-70, friendliness:75, confidence:70, manners:50, agreeableness:40, intelligence:45}},
  grievingParent:      {label:"Grieving Parent", verbosity:-1, register:0, composure:-1, vocabPref:["Temporal Orientation & Tense Usage","Abstractness & Sensory Modality"],
             pers:{emotionalcapacity:-35, positivity:-50, discipline:40, friendliness:20, activeness:-45, honesty:50}},
  reluctantSecond:     {label:"Reluctant Second-in-Command", verbosity:-1, register:0, composure:0, vocabPref:["Directness & Literalness","Precision & Specificity Level"],
             pers:{assertiveness:-30, confidence:-25, discipline:65, agreeableness:55, honesty:55, rebelliousness:-40}},
  cheerfulSociopath:   {label:"Cheerful Sociopath", verbosity:1, register:0, composure:2, vocabPref:["Affective & Emotional Intensity","Pragmatic Focus & Speech Functions"],
             pers:{emotionalcapacity:-70, positivity:60, honesty:-40, friendliness:60, confidence:75, agreeableness:-20}},
  furiousCaretaker:    {label:"Quietly Furious Caretaker", verbosity:-1, register:0, composure:-2, vocabPref:["Directness & Literalness","Affective & Emotional Intensity"],
             pers:{agreeableness:-30, discipline:60, emotionalcapacity:-40, assertiveness:-20, friendliness:20, rebelliousness:20}},
  washedUpProdigy:     {label:"Washed-Up Prodigy", verbosity:0, register:1, composure:-1, vocabPref:["Conceptual Framework & Loanwords","Register & Formality Spectrum"],
             pers:{intelligence:70, positivity:-45, confidence:-30, discipline:-35, curiosity:-30, activeness:-40}},
  companyLoyalist:     {label:"Company Loyalist", verbosity:0, register:1, composure:0, vocabPref:["Register & Formality Spectrum","Pragmatic Focus & Speech Functions"],
             pers:{discipline:65, honesty:35, rebelliousness:-70, agreeableness:50, manners:50, confidence:20}},
  blackSheep:          {label:"Black-Sheep Returnee", verbosity:0, register:-1, composure:-1, vocabPref:["Directness & Literalness","Phonetic & Auditory Qualities"],
             pers:{rebelliousness:55, honesty:45, agreeableness:-25, confidence:20, friendliness:-15, discipline:-25}},
  compulsiveFixer:     {label:"Compulsive Fixer", verbosity:1, register:0, composure:1, vocabPref:["Precision & Specificity Level","Pragmatic Focus & Speech Functions"],
             pers:{discipline:70, assertiveness:40, agreeableness:35, emotionalcapacity:-25, activeness:55, curiosity:25}},
  undiscussedSurvivor: {label:"Survivor Who Won't Discuss It", verbosity:-2, register:0, composure:1, vocabPref:["Directness & Literalness","Temporal Orientation & Tense Usage"],
             pers:{emotionalcapacity:-65, discipline:50, honesty:-20, friendliness:-10, assertiveness:15}},
  workaholicAvoiding:  {label:"Workaholic Avoiding a Diagnosis", verbosity:0, register:0, composure:0, vocabPref:["Pragmatic Focus & Speech Functions","Precision & Specificity Level"],
             pers:{discipline:60, activeness:60, emotionalcapacity:-30, positivity:15, honesty:-15, agreeableness:20}},
  formerTrueBeliever:  {label:"Former True Believer", verbosity:0, register:1, composure:0, vocabPref:["Conceptual Framework & Loanwords","Affective & Emotional Intensity"],
             pers:{positivity:-40, intelligence:50, honesty:60, curiosity:40, rebelliousness:30, discipline:20}},
  goldenChild:         {label:"Golden Child", verbosity:1, register:0, composure:1, vocabPref:["Affective & Emotional Intensity","Register & Formality Spectrum"],
             pers:{confidence:70, positivity:55, agreeableness:40, friendliness:55, discipline:30, honesty:20}},
  // ---- Widened again, deliberately away from one register --------------------
  // Counted honestly, nine of the twenty presets above were variations on "damaged
  // person carrying a secret" — Wounded Soldier, Burnt-Out Idealist, Grieving Parent,
  // Washed-Up Prodigy, Black-Sheep Returnee, Survivor Who Won't Discuss It, Workaholic
  // Avoiding a Diagnosis, Former True Believer, Quietly Furious Caretaker. Only two
  // (Cheerful Sociopath, Smug Con Artist) had no self-pity in them at all, and the
  // contented, the genuinely funny, the institutional, the zealous, the alien-logic
  // outsider, and the person defined by competence rather than injury were missing
  // outright. These are those. They cost nothing structurally — the blend maths takes
  // any number of presets — and they widen what the tool can be asked for.
  competentProfessional: {label:"Quietly Excellent Professional", verbosity:-1, register:1, composure:-1, vocabPref:["Precision & Specificity Level","Directness & Literalness"],
             pers:{discipline:70, intelligence:60, confidence:55, emotionalcapacity:-10, agreeableness:25, activeness:35, manners:45}},
  contentedElder:      {label:"Contented Elder", verbosity:0, register:0, composure:-2, vocabPref:["Abstractness & Sensory Modality","Temporal Orientation & Tense Usage"],
             pers:{positivity:55, friendliness:50, emotionalcapacity:40, activeness:-40, curiosity:20, agreeableness:45, discipline:20}},
  genuinelyFunny:      {label:"Genuinely Funny One", verbosity:1, register:-1, composure:0, vocabPref:["Phonetic & Auditory Qualities","Semantic Density & Modifiers"],
             pers:{friendliness:65, positivity:50, intelligence:55, curiosity:45, manners:-20, rebelliousness:30}},
  careerBureaucrat:    {label:"Career Bureaucrat", verbosity:0, register:2, composure:-2, vocabPref:["Register & Formality Spectrum","Conceptual Framework & Loanwords"],
             pers:{discipline:65, manners:60, rebelliousness:-60, emotionalcapacity:-35, honesty:15, assertiveness:-15, curiosity:-25}},
  trueZealot:          {label:"Ecstatic True Believer", verbosity:1, register:1, composure:2, vocabPref:["Affective & Emotional Intensity","Abstractness & Sensory Modality"],
             pers:{positivity:70, emotionalcapacity:65, honesty:55, discipline:40, agreeableness:-20, rebelliousness:35, curiosity:25}},
  alienLogic:          {label:"Alien-Logic Outsider", verbosity:0, register:1, composure:-2, vocabPref:["Morphological & Structural Lexicon","Precision & Specificity Level"],
             pers:{intelligence:60, friendliness:-30, emotionalcapacity:-45, curiosity:70, manners:-25, honesty:70, agreeableness:-30}},
  unbotheredYoung:     {label:"Unbothered Young Person", verbosity:-1, register:-2, composure:-1, vocabPref:["Directness & Literalness","Pragmatic Focus & Speech Functions"],
             pers:{confidence:45, positivity:30, rebelliousness:40, manners:-40, emotionalcapacity:20, activeness:45, curiosity:35}},
  steadyOrganiser:     {label:"Steady Organiser", verbosity:0, register:0, composure:-2, vocabPref:["Pragmatic Focus & Speech Functions","Precision & Specificity Level"],
             pers:{discipline:60, agreeableness:45, friendliness:45, assertiveness:35, activeness:50, positivity:35, emotionalcapacity:15}},

  /* ---- FILLING THE HOLES IN THE AXIS COVERAGE ----------------------------------
     The previous widening pass fixed the THEMES — the note about nine of twenty being
     variations on 'damaged person carrying a secret' is no longer true, and the 28
     presets are genuinely varied. The imbalance that remains is in the numbers:

       discipline    set in 20/28, and POSITIVE in 17 of them. There was effectively no
                     undisciplined archetype outside unbotheredYoung and
                     washedUpProdigy — no 'chaotic but likeable' preset at all.
       intelligence  set in 10/28, and negative exactly ONCE (child, -45). Combined with
                     the 7.8:1 polarity skew on the same axis, 'not very bright' was the
                     least-supported character in the tool at both the archetype and the
                     trait level. Both halves of that are fixed here.
       assertiveness set in only 9/28 — the axis with the strongest grammar link
                     (Turn-Taking Grammar at TIER_STRONG) was the one the archetypes
                     spoke to least, so the preset that should most obviously drive
                     someone's turn-taking barely ever did.

     Six presets, chosen to be people rather than to be corrections: each is a character
     someone would actually want, and between them they close the gaps. Written low on
     intelligence WITHOUT being written stupid — the point of the axis is how someone
     thinks, not how much they are worth. */
  cheerfulMess:        {label:"Cheerful Mess", verbosity:1, register:-1, composure:1, vocabPref:["Pragmatic Focus & Speech Functions","Affective & Emotional Intensity"],
             pers:{discipline:-70, friendliness:60, positivity:55, agreeableness:45, activeness:40, emotionalcapacity:35, manners:-20}},
  plainSpoken:         {label:"Plain-Spoken Practical", verbosity:-1, register:-2, composure:-1, vocabPref:["Directness & Literalness","Precision & Specificity Level"],
             pers:{intelligence:-50, honesty:60, assertiveness:45, curiosity:-30, discipline:40, manners:-25, emotionalcapacity:-20}},
  softSpokenSecond:    {label:"Soft-Spoken Second", verbosity:-1, register:1, composure:0, vocabPref:["Semantic Density & Modifiers","Pragmatic Focus & Speech Functions"],
             pers:{assertiveness:-70, agreeableness:60, manners:50, confidence:-35, friendliness:35, emotionalcapacity:25}},
  bluntForeman:        {label:"Blunt Foreman", verbosity:-1, register:-2, composure:-1, vocabPref:["Directness & Literalness","Morphological & Structural Lexicon"],
             pers:{assertiveness:75, discipline:45, manners:-50, agreeableness:-40, honesty:50, emotionalcapacity:-30, intelligence:-15}},
  dreamyDrifter:       {label:"Dreamy Drifter", verbosity:0, register:1, composure:1, vocabPref:["Abstractness & Sensory Modality","Temporal Orientation & Tense Usage"],
             pers:{discipline:-55, curiosity:65, intelligence:-25, activeness:-35, positivity:35, emotionalcapacity:40, assertiveness:-30}},
  stubbornCraftsman:   {label:"Stubborn Craftsman", verbosity:-2, register:-1, composure:-2, vocabPref:["Precision & Specificity Level","Directness & Literalness"],
             pers:{intelligence:-30, discipline:70, rebelliousness:-35, assertiveness:40, curiosity:-25, manners:-15, emotionalcapacity:-25}},

  /* ---- THE 2026 AUDIT'S INPUT-BALANCE PASS (§4.5) -------------------------------
     Measured over the 34 presets above: discipline set positive in 20 and negative
     in 5; emotional capacity negative in 15 and positive in 9; honesty 13:5,
     curiosity 11:4, positivity 11:5 — all leaning positive when specified. And
     the profile hints: Secure attachment eleven times, Restraint & Discipline six,
     Dry & Deadpan five, against one each for Substance, Compulsion, Risk & Escape,
     Intellectual & Wordplay and Humorless. A user reaching for "random preset"
     inherits that taste.

     Eight presets, chosen as people first. Between them: six lean undisciplined,
     five lean emotionally open, three are dishonest, three are incurious, three are
     pessimists, and their hints go to the under-used categories. */
  openHeartedShambles: {label:"Open-Hearted Shambles", verbosity:1, register:-1, composure:0, vocabPref:["Affective & Emotional Intensity","Abstractness & Sensory Modality"],
             pers:{emotionalcapacity:75, discipline:-60, friendliness:55, honesty:50, agreeableness:35, positivity:20, curiosity:40}},
  weepingBrawler:      {label:"Weeping Brawler", verbosity:0, register:-2, composure:2, vocabPref:["Directness & Literalness","Phonetic & Auditory Qualities"],
             pers:{emotionalcapacity:70, assertiveness:60, discipline:-45, agreeableness:-40, manners:-45, positivity:-20, honesty:30, friendliness:-15}},
  lovableLiar:         {label:"Lovable Liar", verbosity:1, register:-1, composure:-1, vocabPref:["Pragmatic Focus & Speech Functions","Affective & Emotional Intensity"],
             pers:{honesty:-65, friendliness:70, emotionalcapacity:45, discipline:-40, positivity:45, confidence:30, curiosity:-20}},
  incuriousContent:    {label:"Incurious and Content", verbosity:-1, register:-1, composure:-2, vocabPref:["Directness & Literalness","Pragmatic Focus & Speech Functions"],
             pers:{curiosity:-70, positivity:40, discipline:-20, agreeableness:50, friendliness:35, activeness:-30, intelligence:-20}},
  gloomyRomantic:      {label:"Gloomy Romantic", verbosity:0, register:1, composure:-1, vocabPref:["Affective & Emotional Intensity","Temporal Orientation & Tense Usage"],
             pers:{emotionalcapacity:70, positivity:-60, discipline:-35, curiosity:30, friendliness:20, confidence:-25, activeness:-30}},
  scatteredGenius:     {label:"Scattered Genius", verbosity:1, register:0, composure:1, vocabPref:["Conceptual Framework & Loanwords","Morphological & Structural Lexicon"],
             pers:{intelligence:80, discipline:-75, curiosity:75, honesty:-15, manners:-30, activeness:35, agreeableness:-15, friendliness:-20}},
  jadedFixer:          {label:"Jaded Fixer", verbosity:-1, register:0, composure:-1, vocabPref:["Pragmatic Focus & Speech Functions","Precision & Specificity Level"],
             pers:{honesty:-50, positivity:-45, discipline:35, emotionalcapacity:-30, curiosity:-35, intelligence:40, assertiveness:35, friendliness:-30}},
  bigHeartedBoss:      {label:"Big-Hearted Boss", verbosity:1, register:0, composure:0, vocabPref:["Directness & Literalness","Affective & Emotional Intensity"],
             pers:{emotionalcapacity:60, assertiveness:65, friendliness:60, discipline:-25, manners:-20, positivity:40, confidence:55}},
};

/* Optional profile hints, per archetype. See ARCHETYPE PROFILE HINTS in accumulateBoost:
   these NUDGE a section toward a category at one STRONG link's worth of pull, they do
   not set it — the dice, your sliders and the cross-link cascade all still argue back,
   and an explicit type_<section> choice overrides them outright.

   Kept as a separate table rather than inlined into the 34 entries above so the whole
   psychological shape of the preset list can be read, and audited for lean, in one
   place. Every archetype names at most three sections; the rest stay free, because a
   preset that pinned all seven would stop being a starting point.

   Deliberately spread: eleven of these name Secure attachment and nine name Restraint
   or Discipline, against the "damaged person with a secret" pull the preset list was
   already corrected for once on the personality axes but never on the profile. */
const ARCHETYPE_PROFILE_HINTS = {
  soldier:             {attachment:"Avoidant", stress:"Freeze (shut down)", values:"Loyalty-Bound"},
  conartist:           {values:"Self-Interested", humor:"Cruel & Barbed", role:"Instigator"},
  intern:              {attachment:"Anxious", stress:"Fawn (appease the threat)", humor:"Self-Deprecating"},
  scholar:             {role:"Skeptic", humor:"Dry & Deadpan", vices:"Avoidance & Procrastination"},
  noble:               {attachment:"Avoidant", values:"Rigid & Principled", role:"Leader"},
  child:               {attachment:"Secure", humor:"Absurd & Chaotic", role:"Connector"},
  burntIdealist:       {values:"Idealistic & Visionary", vices:"Avoidance & Procrastination", stress:"Freeze (shut down)"},
  charmingManipulator: {attachment:"Avoidant", values:"Self-Interested", role:"Connector"},
  grievingParent:      {attachment:"Anxious", stress:"Freeze (shut down)", humor:"Humorless & Absent"},
  reluctantSecond:     {role:"Caretaker", values:"Loyalty-Bound", attachment:"Secure"},
  cheerfulSociopath:   {attachment:"Avoidant", values:"Self-Interested", humor:"Cruel & Barbed"},
  furiousCaretaker:    {role:"Caretaker", stress:"Fawn (appease the threat)", vices:"Restraint & Discipline"},
  washedUpProdigy:     {vices:"Substance & Consumption", humor:"Self-Deprecating", values:"Pragmatic & Flexible"},
  companyLoyalist:     {values:"Loyalty-Bound", role:"Peacemaker", vices:"Restraint & Discipline"},
  blackSheep:          {role:"Outsider", attachment:"Disorganized", values:"Self-Interested"},
  compulsiveFixer:     {vices:"Compulsion & Ritual", role:"Caretaker", stress:"Fight (attack the threat)"},
  undiscussedSurvivor: {attachment:"Avoidant", stress:"Flight (remove yourself)", humor:"Dry & Deadpan"},
  workaholicAvoiding:  {vices:"Avoidance & Procrastination", attachment:"Avoidant", stress:"Flight (remove yourself)"},
  formerTrueBeliever:  {values:"Idealistic & Visionary", role:"Skeptic", attachment:"Disorganized"},
  goldenChild:         {attachment:"Anxious", role:"Leader", values:"Idealistic & Visionary"},
  competentProfessional:{attachment:"Secure", vices:"Restraint & Discipline", role:"Skeptic"},
  contentedElder:      {attachment:"Secure", humor:"Warm & Playful", values:"Pragmatic & Flexible"},
  genuinelyFunny:      {humor:"Warm & Playful", role:"Connector", attachment:"Secure"},
  careerBureaucrat:    {values:"Rigid & Principled", vices:"Restraint & Discipline", humor:"Dry & Deadpan"},
  trueZealot:          {values:"Idealistic & Visionary", role:"Instigator", stress:"Fight (attack the threat)"},
  alienLogic:          {role:"Outsider", humor:"Intellectual & Wordplay", attachment:"Avoidant"},
  unbotheredYoung:     {attachment:"Secure", humor:"Dry & Deadpan", values:"Pragmatic & Flexible"},
  steadyOrganiser:     {attachment:"Anxious", role:"Leader", vices:"Restraint & Discipline"},
  cheerfulMess:        {attachment:"Disorganized", humor:"Absurd & Chaotic", vices:"Risk & Escape"},
  plainSpoken:         {attachment:"Secure", values:"Pragmatic & Flexible", humor:"Dry & Deadpan"},
  softSpokenSecond:    {role:"Peacemaker", stress:"Fawn (appease the threat)", attachment:"Anxious"},
  bluntForeman:        {role:"Leader", stress:"Fight (attack the threat)", attachment:"Secure"},
  dreamyDrifter:       {role:"Outsider", vices:"Avoidance & Procrastination", attachment:"Secure"},
  stubbornCraftsman:   {values:"Rigid & Principled", vices:"Restraint & Discipline", attachment:"Secure"},
  // The balance pass: hints to the categories the table above barely reached.
  openHeartedShambles: {attachment:"Anxious", vices:"Substance & Consumption", humor:"Warm & Playful"},
  weepingBrawler:      {stress:"Fight (attack the threat)", vices:"Risk & Escape", attachment:"Disorganized"},
  lovableLiar:         {values:"Self-Interested", humor:"Absurd & Chaotic", role:"Connector"},
  incuriousContent:    {humor:"Humorless & Absent", values:"Pragmatic & Flexible", role:"Peacemaker"},
  gloomyRomantic:      {attachment:"Anxious", humor:"Self-Deprecating", vices:"Substance & Consumption"},
  scatteredGenius:     {humor:"Intellectual & Wordplay", vices:"Compulsion & Ritual", role:"Outsider"},
  jadedFixer:          {values:"Pragmatic & Flexible", humor:"Cruel & Barbed", stress:"Flight (remove yourself)"},
  bigHeartedBoss:      {role:"Leader", humor:"Warm & Playful", vices:"Risk & Escape"},
};
Object.entries(ARCHETYPE_PROFILE_HINTS).forEach(([k, profile])=>{
  if (ARCHETYPES[k]) ARCHETYPES[k].profile = profile;
});

/* ================= INTERNAL DIMENSIONS =================
   The audit's model issue (§4.5): several sliders conflate two things. Insecurity and
   grandiosity are not one opposite of confidence; guarded expression and shallow
   feeling are not the same; intuition and low competence are not the same; energy and
   initiative are not the same; friendliness and intimacy are not the same; personal
   discipline and obedience to institutions are not the same. The fix the audit asks
   for is to introduce the separated dimensions INTERNALLY first — derived from what is
   on the sheet — rather than as a dozen new sliders.

   Each dimension is scored from the sheet's traits by category, presentation variant,
   concept family and behaviour function; -1..1, with 0 = no evidence. They are shown
   as a compact readout on the summary card and consumed by the contextual engine,
   which needs "expression" and "depth" separately to decide what a private room
   changes. They are NOT generation inputs; nothing here changes what is drawn. */
const INTERNAL_DIMENSIONS = [
  {id:"selfWorth",     label:"Self-worth",         low:"self-doubting", high:"self-assured"},
  {id:"selfPresent",   label:"Self-presentation",  low:"understated",   high:"grandiose"},
  {id:"emoDepth",      label:"Emotional depth",    low:"shallow",       high:"deep"},
  {id:"emoExpress",    label:"Emotional expression",low:"guarded",      high:"expressive"},
  {id:"analytic",      label:"Analytical preference",low:"intuitive",   high:"analytical"},
  {id:"competence",    label:"Practical competence",low:"unproven",     high:"capable"},
  {id:"activation",    label:"Activation",         low:"slow to start", high:"quick to start"},
  {id:"endurance",     label:"Endurance",          low:"burns out",     high:"keeps going"},
  {id:"warmth",        label:"Social warmth",      low:"cool",          high:"warm"},
  {id:"trust",         label:"Trust",              low:"guarded",       high:"trusting"},
  {id:"selfDiscipline",label:"Personal discipline",low:"loose",         high:"strict"},
  {id:"obedience",     label:"Institutional obedience", low:"defiant",  high:"compliant"},
];
function internalDimensions(st){
  const acc = {}, n = {};
  const add = (id, v) => { acc[id] = (acc[id]||0) + v; n[id] = (n[id]||0) + 1; };
  const cats = new Set(), fams = new Set(), funcs = new Set();
  Object.values(st || {}).forEach(sl=>{
    const t = sl && sl.trait; if (!t) return;
    cats.add(t.category);
    if (t.conceptFamily) fams.add(t.conceptFamily);
    if (t.behaviorFunction) funcs.add(t.behaviorFunction);
    const c = t.category, v = t.variant, p = t.pol || {};
    // self-worth vs self-presentation: the Confidence axis split by presentation variant
    if (c === "Confidence — Self-Assured"){ add("selfWorth", 1); }
    if (c === "Confidence — Insecure or Egotistical"){
      if (v === "a") add("selfWorth", -1); else if (v === "b") add("selfPresent", 1); else { add("selfWorth", -0.5); add("selfPresent", 0.5); }
    }
    if (c === "Confidence — Situational") add("selfPresent", -0.3);
    // depth vs expression: Emotional Capacity split by variant
    if (c === "Emotional Capacity — Expressive & Deep"){ add("emoDepth", 1); add("emoExpress", 1); }
    if (c === "Emotional Capacity — Guarded & Shallow"){
      if (v === "a"){ add("emoDepth", 0.5); add("emoExpress", -1); } else if (v === "b"){ add("emoDepth", -1); add("emoExpress", -0.3); } else { add("emoDepth", -0.3); add("emoExpress", -0.6); }
    }
    // analytical preference vs practical competence
    if (c === "Intelligence — Sharp & Analytical") add("analytic", 1);
    if (c === "Intelligence — Instinctive & Unanalytical"){ add("analytic", -1); if (v === "a") add("competence", 0.5); else if (v === "b") add("competence", -0.5); }
    if (t.section === "Competence & Method") add("competence", 1);
    // activation vs endurance: the Activeness axis, plus discipline for endurance
    if (c === "Activeness — Energetic & Active") add("activation", 1);
    if (c === "Activeness — Sedentary & Low-Energy") add("activation", -1);
    if (c === "Discipline — Self-Controlled") add("endurance", 0.6);
    if (c === "Discipline — Impulsive & Unrestrained") add("endurance", -0.6);
    if (c === "Restraint & Discipline") add("endurance", 0.5);
    if (c === "Risk & Escape" || c === "Avoidance & Procrastination") add("endurance", -0.5);
    // social warmth vs trust: Friendliness vs Attachment
    if (c === "Friendliness — Warm & Approachable") add("warmth", 1);
    if (c === "Friendliness — Cold & Aloof") add("warmth", -1);
    if (c === "Secure") add("trust", 1);
    if (c === "Avoidant" || c === "Disorganized") add("trust", -1);
    if (c === "Anxious") add("trust", -0.4);
    if (t.section === "Positive Origins" && c === "Learned Trust") add("trust", 1);
    // personal discipline vs institutional obedience
    if (c === "Discipline — Self-Controlled") add("selfDiscipline", 1);
    if (c === "Discipline — Impulsive & Unrestrained") add("selfDiscipline", -1);
    if (c === "Rebelliousness — Defiant") add("obedience", -1);
    if (c === "Rebelliousness — Conforming & Compliant") add("obedience", 1);
    if (c === "Under Authority" && t.conceptFamily){
      if (/mutineer|arguer|truth-teller|rep|ask-not-tell/.test(t.conceptFamily)) add("obedience", -0.5);
      if (/pet|chair-loyal|silent|invisible/.test(t.conceptFamily)) add("obedience", 0.5);
    }
    // behaviour functions as weak evidence
    if (t.behaviorFunction === "protect") add("trust", -0.2);
    if (t.behaviorFunction === "connect") add("warmth", 0.2);
    if (t.behaviorFunction === "perform") add("selfPresent", 0.3);
  });
  const out = {};
  INTERNAL_DIMENSIONS.forEach(d=>{
    const k = n[d.id] || 0;
    out[d.id] = k ? clamp(acc[d.id] / Math.max(1, Math.sqrt(k) * 1.2), -1, 1) : 0;
  });
  return out;
}
// The pairs the audit says the sliders conflate, for the readout: where the two halves
// disagree is exactly where a single slider would have lied.
const INTERNAL_DIMENSION_PAIRS = [["selfWorth","selfPresent"],["emoDepth","emoExpress"],["analytic","competence"],
  ["activation","endurance"],["warmth","trust"],["selfDiscipline","obedience"]];

/* ================= ARCHETYPE INTENT =================
   The audit's §4.6: "presets need explicit intent specifications — what must be
   recognizable, what should merely be nudged, and what should remain open." A preset
   used to be a bag of numbers blended 35/65 with the sliders, with every axis treated
   the same; a Smug Con Artist whose honesty came out neutral was still labelled a con
   artist. `must` names the axes without which the preset is not recognisable — they
   are blended at a floor (see effectiveArchetype) whatever the user's blend setting.
   `nudge` is the profile hint set. `open` is stated so it is visibly a decision. Every
   built-in preset has an entry; the test suite refuses one that does not. */
const ARCHETYPE_INTENT = {
  soldier:             {must:["discipline","emotionalcapacity"], nudge:["attachment","stress","values"], open:["humor","vices","role"]},
  conartist:           {must:["honesty","confidence"], nudge:["values","humor","role"], open:["attachment","stress","vices"]},
  intern:              {must:["confidence","assertiveness"], nudge:["attachment","stress","humor"], open:["values","vices","role"]},
  scholar:             {must:["intelligence","activeness"], nudge:["role","humor","vices"], open:["attachment","stress","values"]},
  noble:               {must:["manners","friendliness"], nudge:["attachment","values","role"], open:["humor","stress","vices"]},
  child:               {must:["curiosity","positivity"], nudge:["attachment","humor","role"], open:["values","stress","vices"]},
  burntIdealist:       {must:["positivity","honesty"], nudge:["values","vices","stress"], open:["attachment","humor","role"]},
  charmingManipulator: {must:["honesty","friendliness"], nudge:["attachment","values","role"], open:["humor","stress","vices"]},
  grievingParent:      {must:["positivity","emotionalcapacity"], nudge:["attachment","stress","humor"], open:["values","vices","role"]},
  reluctantSecond:     {must:["assertiveness","discipline"], nudge:["role","values","attachment"], open:["humor","stress","vices"]},
  cheerfulSociopath:   {must:["emotionalcapacity","positivity"], nudge:["attachment","values","humor"], open:["stress","vices","role"]},
  furiousCaretaker:    {must:["agreeableness","discipline"], nudge:["role","stress","vices"], open:["attachment","humor","values"]},
  washedUpProdigy:     {must:["intelligence","confidence"], nudge:["vices","humor","values"], open:["attachment","stress","role"]},
  companyLoyalist:     {must:["rebelliousness","discipline"], nudge:["values","role","vices"], open:["attachment","humor","stress"]},
  blackSheep:          {must:["rebelliousness","honesty"], nudge:["role","attachment","values"], open:["humor","stress","vices"]},
  compulsiveFixer:     {must:["discipline","activeness"], nudge:["vices","role","stress"], open:["attachment","humor","values"]},
  undiscussedSurvivor: {must:["emotionalcapacity"], nudge:["attachment","stress","humor"], open:["values","vices","role"]},
  workaholicAvoiding:  {must:["discipline","activeness"], nudge:["vices","attachment","stress"], open:["humor","values","role"]},
  formerTrueBeliever:  {must:["honesty","positivity"], nudge:["values","role","attachment"], open:["humor","stress","vices"]},
  goldenChild:         {must:["confidence","positivity"], nudge:["attachment","role","values"], open:["humor","stress","vices"]},
  competentProfessional:{must:["discipline","intelligence"], nudge:["attachment","vices","role"], open:["humor","stress","values"]},
  contentedElder:      {must:["positivity","activeness"], nudge:["attachment","humor","values"], open:["stress","vices","role"]},
  genuinelyFunny:      {must:["friendliness","intelligence"], nudge:["humor","role","attachment"], open:["values","stress","vices"]},
  careerBureaucrat:    {must:["rebelliousness","manners"], nudge:["values","vices","humor"], open:["attachment","stress","role"]},
  trueZealot:          {must:["positivity","emotionalcapacity"], nudge:["values","role","stress"], open:["attachment","humor","vices"]},
  alienLogic:          {must:["curiosity","honesty"], nudge:["role","humor","attachment"], open:["values","stress","vices"]},
  unbotheredYoung:     {must:["manners","confidence"], nudge:["attachment","humor","values"], open:["stress","vices","role"]},
  steadyOrganiser:     {must:["discipline","agreeableness"], nudge:["attachment","role","vices"], open:["humor","stress","values"]},
  cheerfulMess:        {must:["discipline","friendliness"], nudge:["attachment","humor","vices"], open:["values","stress","role"]},
  plainSpoken:         {must:["intelligence","honesty"], nudge:["attachment","values","humor"], open:["stress","vices","role"]},
  softSpokenSecond:    {must:["assertiveness","agreeableness"], nudge:["role","stress","attachment"], open:["humor","values","vices"]},
  bluntForeman:        {must:["assertiveness","manners"], nudge:["role","stress","attachment"], open:["humor","values","vices"]},
  dreamyDrifter:       {must:["discipline","curiosity"], nudge:["role","vices","attachment"], open:["humor","stress","values"]},
  stubbornCraftsman:   {must:["discipline","rebelliousness"], nudge:["values","vices","attachment"], open:["humor","stress","role"]},
  openHeartedShambles: {must:["emotionalcapacity","discipline"], nudge:["attachment","vices","humor"], open:["values","stress","role"]},
  weepingBrawler:      {must:["emotionalcapacity","assertiveness"], nudge:["stress","vices","attachment"], open:["humor","values","role"]},
  lovableLiar:         {must:["honesty","friendliness"], nudge:["values","humor","role"], open:["attachment","stress","vices"]},
  incuriousContent:    {must:["curiosity","positivity"], nudge:["humor","values","role"], open:["attachment","stress","vices"]},
  gloomyRomantic:      {must:["emotionalcapacity","positivity"], nudge:["attachment","humor","vices"], open:["values","stress","role"]},
  scatteredGenius:     {must:["intelligence","discipline"], nudge:["humor","vices","role"], open:["attachment","stress","values"]},
  jadedFixer:          {must:["honesty","positivity"], nudge:["values","humor","stress"], open:["attachment","vices","role"]},
  bigHeartedBoss:      {must:["emotionalcapacity","assertiveness"], nudge:["role","humor","vices"], open:["attachment","stress","values"]},
};

/* ================= NAMED VARIATIONS =================
   "Show 2–3 named variations per preset, such as socially smooth / abrasive / quiet,
   rather than allowing a single profile hint to dominate all variations." A variation
   is a delta on the personality numbers and an optional profile-hint override; the
   `must` axes are never in a delta, so every variation is still recognisably its
   preset. `base` is always present and is the unmodified preset. */
const ARCHETYPE_VARIATIONS = {
  soldier:  [{id:"quiet", label:"Quiet", pers:{friendliness:-45, assertiveness:10}, profile:{stress:"Freeze (shut down)"}},
             {id:"bitter", label:"Bitter", pers:{positivity:-50, agreeableness:-40}, profile:{humor:"Cruel & Barbed", stress:"Fight (attack the threat)"}},
             {id:"steady", label:"Steady", pers:{friendliness:20, positivity:15}, profile:{attachment:"Secure", role:"Caretaker"}}],
  conartist:[{id:"smooth", label:"Socially smooth", pers:{manners:60, agreeableness:10}, profile:{humor:"Warm & Playful"}},
             {id:"abrasive", label:"Abrasive", pers:{manners:-40, agreeableness:-55}, profile:{humor:"Cruel & Barbed", role:"Instigator"}},
             {id:"quiet", label:"Quiet operator", pers:{friendliness:-10, assertiveness:-30}, profile:{humor:"Dry & Deadpan", role:"Outsider"}}],
  intern:   [{id:"eager", label:"Eager", pers:{activeness:50, positivity:40}, profile:{role:"Connector"}},
             {id:"frozen", label:"Frozen", pers:{activeness:-30, emotionalcapacity:-30}, profile:{stress:"Freeze (shut down)"}},
             {id:"secretly-sharp", label:"Secretly sharp", pers:{intelligence:60, honesty:30}, profile:{role:"Skeptic"}}],
  scholar:  [{id:"kindly", label:"Kindly", pers:{friendliness:45, positivity:10}, profile:{role:"Caretaker", humor:"Warm & Playful"}},
             {id:"acid", label:"Acid", pers:{friendliness:-45, agreeableness:-40}, profile:{humor:"Cruel & Barbed"}},
             {id:"distracted", label:"Distracted", pers:{discipline:-40, curiosity:80}, profile:{vices:"Compulsion & Ritual"}}],
  noble:    [{id:"dutiful", label:"Dutiful", pers:{discipline:50, honesty:30}, profile:{values:"Loyalty-Bound"}},
             {id:"decadent", label:"Decadent", pers:{discipline:-45, positivity:25}, profile:{vices:"Substance & Consumption", values:"Self-Interested"}},
             {id:"melancholy", label:"Melancholy", pers:{positivity:-50, emotionalcapacity:10}, profile:{humor:"Humorless & Absent"}}],
  child:    [{id:"bold", label:"Bold", pers:{assertiveness:50, confidence:40}, profile:{role:"Instigator"}},
             {id:"shy", label:"Shy", pers:{assertiveness:-50, friendliness:-10}, profile:{attachment:"Anxious", role:"Outsider"}},
             {id:"old-soul", label:"Old soul", pers:{discipline:20, emotionalcapacity:30}, profile:{humor:"Dry & Deadpan"}}],
  burntIdealist:[{id:"quiet", label:"Quiet", pers:{friendliness:-20, assertiveness:-30}, profile:{stress:"Flight (remove yourself)"}},
             {id:"angry", label:"Angry", pers:{agreeableness:-50, assertiveness:40}, profile:{stress:"Fight (attack the threat)", humor:"Cruel & Barbed"}},
             {id:"wry", label:"Wry", pers:{friendliness:25}, profile:{humor:"Dry & Deadpan"}}],
  charmingManipulator:[{id:"warm", label:"Warm", pers:{emotionalcapacity:30}, profile:{humor:"Warm & Playful"}},
             {id:"cold", label:"Cold", pers:{emotionalcapacity:-50, agreeableness:-20}, profile:{humor:"Dry & Deadpan", attachment:"Avoidant"}},
             {id:"needy", label:"Needy", pers:{confidence:-40}, profile:{attachment:"Anxious"}}],
  grievingParent:[{id:"withdrawn", label:"Withdrawn", pers:{friendliness:-40, activeness:-30}, profile:{stress:"Flight (remove yourself)"}},
             {id:"raging", label:"Raging", pers:{agreeableness:-50, assertiveness:40}, profile:{stress:"Fight (attack the threat)"}},
             {id:"busy", label:"Busy", pers:{activeness:50, discipline:40}, profile:{vices:"Compulsion & Ritual"}}],
  reluctantSecond:[{id:"loyal", label:"Loyal", pers:{agreeableness:20}, profile:{values:"Loyalty-Bound"}},
             {id:"resentful", label:"Resentful", pers:{agreeableness:-40, positivity:-30}, profile:{humor:"Dry & Deadpan", attachment:"Avoidant"}},
             {id:"secretly-ready", label:"Secretly ready", pers:{confidence:40, intelligence:30}, profile:{role:"Leader"}}],
  cheerfulSociopath:[{id:"charming", label:"Charming", pers:{manners:50}, profile:{role:"Connector"}},
             {id:"crude", label:"Crude", pers:{manners:-50}, profile:{humor:"Absurd & Chaotic"}},
             {id:"quiet", label:"Quiet", pers:{friendliness:-30, assertiveness:-20}, profile:{role:"Outsider", humor:"Dry & Deadpan"}}],
  furiousCaretaker:[{id:"martyr", label:"Martyr", pers:{emotionalcapacity:20}, profile:{humor:"Self-Deprecating"}},
             {id:"sharp", label:"Sharp", pers:{manners:-30, honesty:40}, profile:{humor:"Cruel & Barbed"}},
             {id:"leaving", label:"Halfway out the door", pers:{rebelliousness:50}, profile:{stress:"Flight (remove yourself)"}}],
  washedUpProdigy:[{id:"bitter", label:"Bitter", pers:{agreeableness:-40}, profile:{humor:"Cruel & Barbed"}},
             {id:"sweet", label:"Sweet", pers:{friendliness:40, agreeableness:30}, profile:{humor:"Warm & Playful", attachment:"Anxious"}},
             {id:"rebuilding", label:"Rebuilding", pers:{discipline:40, positivity:20}, profile:{vices:"Restraint & Discipline"}}],
  companyLoyalist:[{id:"true", label:"True believer", pers:{positivity:40}, profile:{values:"Idealistic & Visionary"}},
             {id:"weary", label:"Weary", pers:{positivity:-40, activeness:-20}, profile:{humor:"Dry & Deadpan"}},
             {id:"enforcer", label:"Enforcer", pers:{assertiveness:50, agreeableness:-30}, profile:{role:"Leader", stress:"Fight (attack the threat)"}}],
  blackSheep:[{id:"charming", label:"Charming", pers:{friendliness:40}, profile:{humor:"Warm & Playful", role:"Connector"}},
             {id:"sullen", label:"Sullen", pers:{friendliness:-40, positivity:-30}, profile:{humor:"Humorless & Absent"}},
             {id:"changed", label:"Genuinely changed", pers:{discipline:40, positivity:30}, profile:{attachment:"Secure"}}],
  compulsiveFixer:[{id:"warm", label:"Warm", pers:{friendliness:40}, profile:{role:"Caretaker"}},
             {id:"bossy", label:"Bossy", pers:{agreeableness:-40, manners:-20}, profile:{role:"Leader"}},
             {id:"anxious", label:"Anxious", pers:{confidence:-40}, profile:{attachment:"Anxious", stress:"Fawn (appease the threat)"}}],
  undiscussedSurvivor:[{id:"gentle", label:"Gentle", pers:{friendliness:30, agreeableness:30}, profile:{role:"Caretaker"}},
             {id:"hard", label:"Hard", pers:{agreeableness:-40, manners:-30}, profile:{stress:"Fight (attack the threat)"}},
             {id:"funny", label:"Funny about it", pers:{positivity:20}, profile:{humor:"Dry & Deadpan"}}],
  workaholicAvoiding:[{id:"cheerful", label:"Cheerful", pers:{positivity:40, friendliness:30}, profile:{humor:"Warm & Playful"}},
             {id:"brittle", label:"Brittle", pers:{agreeableness:-40}, profile:{stress:"Fight (attack the threat)"}},
             {id:"quiet", label:"Quiet", pers:{friendliness:-30}, profile:{attachment:"Avoidant", humor:"Humorless & Absent"}}],
  formerTrueBeliever:[{id:"grieving", label:"Grieving", pers:{emotionalcapacity:40, activeness:-20}, profile:{stress:"Freeze (shut down)"}},
             {id:"crusading", label:"Crusading", pers:{assertiveness:50, agreeableness:-30}, profile:{role:"Instigator", stress:"Fight (attack the threat)"}},
             {id:"wry", label:"Wry", pers:{friendliness:20}, profile:{humor:"Dry & Deadpan"}}],
  goldenChild:[{id:"gracious", label:"Gracious", pers:{agreeableness:30, manners:40}, profile:{role:"Peacemaker"}},
             {id:"brittle", label:"Brittle", pers:{emotionalcapacity:-30}, profile:{attachment:"Anxious", stress:"Fawn (appease the threat)"}},
             {id:"entitled", label:"Entitled", pers:{agreeableness:-40, manners:-20}, profile:{values:"Self-Interested"}}],
  competentProfessional:[{id:"warm", label:"Warm", pers:{friendliness:40}, profile:{role:"Caretaker", humor:"Warm & Playful"}},
             {id:"cool", label:"Cool", pers:{friendliness:-30, emotionalcapacity:-30}, profile:{attachment:"Avoidant"}},
             {id:"restless", label:"Restless", pers:{curiosity:50, rebelliousness:30}, profile:{vices:"Risk & Escape"}}],
  contentedElder:[{id:"talkative", label:"Talkative", pers:{friendliness:20}, profile:{role:"Connector"}},
             {id:"quiet", label:"Quiet", pers:{friendliness:-20}, profile:{humor:"Dry & Deadpan"}},
             {id:"sharp", label:"Still sharp", pers:{intelligence:50, curiosity:40}, profile:{role:"Skeptic"}}],
  genuinelyFunny:[{id:"kind", label:"Kind", pers:{agreeableness:30}, profile:{humor:"Warm & Playful"}},
             {id:"savage", label:"Savage", pers:{agreeableness:-40}, profile:{humor:"Cruel & Barbed"}},
             {id:"surreal", label:"Surreal", pers:{discipline:-40}, profile:{humor:"Absurd & Chaotic"}}],
  careerBureaucrat:[{id:"kindly", label:"Kindly", pers:{friendliness:40, agreeableness:30}, profile:{role:"Caretaker"}},
             {id:"petty", label:"Petty", pers:{agreeableness:-40}, profile:{values:"Self-Interested", humor:"Cruel & Barbed"}},
             {id:"secretly-anarchic", label:"Secretly anarchic", pers:{curiosity:40, discipline:-20}, profile:{humor:"Absurd & Chaotic"}}],
  trueZealot:[{id:"gentle", label:"Gentle", pers:{agreeableness:40, friendliness:40}, profile:{role:"Caretaker"}},
             {id:"fierce", label:"Fierce", pers:{agreeableness:-50, assertiveness:50}, profile:{role:"Leader", stress:"Fight (attack the threat)"}},
             {id:"doubting", label:"Beginning to doubt", pers:{intelligence:30, curiosity:40}, profile:{role:"Skeptic"}}],
  alienLogic:[{id:"gentle", label:"Gentle", pers:{friendliness:20, agreeableness:20}, profile:{humor:"Absurd & Chaotic"}},
             {id:"cold", label:"Cold", pers:{friendliness:-30, emotionalcapacity:-30}, profile:{humor:"Dry & Deadpan"}},
             {id:"delighted", label:"Delighted by everything", pers:{positivity:50, activeness:30}, profile:{humor:"Intellectual & Wordplay"}}],
  unbotheredYoung:[{id:"sweet", label:"Sweet", pers:{friendliness:40, agreeableness:30}, profile:{humor:"Warm & Playful"}},
             {id:"sullen", label:"Sullen", pers:{friendliness:-30, positivity:-30}, profile:{humor:"Humorless & Absent"}},
             {id:"sharp", label:"Sharper than they let on", pers:{intelligence:50}, profile:{role:"Skeptic", humor:"Dry & Deadpan"}}],
  steadyOrganiser:[{id:"warm", label:"Warm", pers:{friendliness:20}, profile:{role:"Caretaker"}},
             {id:"brisk", label:"Brisk", pers:{assertiveness:30, manners:-20}, profile:{role:"Leader"}},
             {id:"quiet", label:"Quiet", pers:{assertiveness:-30}, profile:{role:"Peacemaker"}}],
  cheerfulMess:[{id:"loud", label:"Loud", pers:{assertiveness:40}, profile:{role:"Instigator"}},
             {id:"gentle", label:"Gentle", pers:{assertiveness:-30}, profile:{role:"Peacemaker"}},
             {id:"secretly-sad", label:"Secretly sad", pers:{positivity:-30}, profile:{humor:"Self-Deprecating", attachment:"Anxious"}}],
  plainSpoken:[{id:"kind", label:"Kind", pers:{friendliness:40}, profile:{role:"Caretaker"}},
             {id:"gruff", label:"Gruff", pers:{friendliness:-40}, profile:{humor:"Dry & Deadpan"}},
             {id:"stubborn", label:"Stubborn", pers:{agreeableness:-40, rebelliousness:30}, profile:{values:"Rigid & Principled"}}],
  softSpokenSecond:[{id:"devoted", label:"Devoted", pers:{friendliness:30}, profile:{values:"Loyalty-Bound"}},
             {id:"resentful", label:"Quietly resentful", pers:{positivity:-30, honesty:-20}, profile:{humor:"Dry & Deadpan"}},
             {id:"secretly-capable", label:"Secretly capable", pers:{intelligence:50, discipline:40}, profile:{role:"Skeptic"}}],
  bluntForeman:[{id:"fair", label:"Fair", pers:{honesty:30, agreeableness:10}, profile:{values:"Rigid & Principled"}},
             {id:"bully", label:"Bully", pers:{agreeableness:-60, emotionalcapacity:-30}, profile:{humor:"Cruel & Barbed"}},
             {id:"soft-centred", label:"Soft-centred", pers:{emotionalcapacity:40, friendliness:30}, profile:{role:"Caretaker"}}],
  dreamyDrifter:[{id:"sunny", label:"Sunny", pers:{positivity:40, friendliness:30}, profile:{humor:"Warm & Playful"}},
             {id:"melancholy", label:"Melancholy", pers:{positivity:-40}, profile:{humor:"Self-Deprecating"}},
             {id:"prickly", label:"Prickly", pers:{agreeableness:-40, rebelliousness:40}, profile:{humor:"Cruel & Barbed"}}],
  stubbornCraftsman:[{id:"kindly", label:"Kindly", pers:{friendliness:40}, profile:{role:"Caretaker"}},
             {id:"sour", label:"Sour", pers:{friendliness:-40, positivity:-30}, profile:{humor:"Cruel & Barbed"}},
             {id:"proud", label:"Proud", pers:{confidence:50}, profile:{role:"Leader"}}],
  openHeartedShambles:[{id:"sunny", label:"Sunny", pers:{positivity:40}, profile:{humor:"Warm & Playful"}},
             {id:"tearful", label:"Tearful", pers:{positivity:-30, confidence:-30}, profile:{humor:"Self-Deprecating"}},
             {id:"loud", label:"Loud", pers:{assertiveness:40, manners:-30}, profile:{role:"Instigator"}}],
  weepingBrawler:[{id:"loyal", label:"Loyal", pers:{friendliness:30}, profile:{values:"Loyalty-Bound"}},
             {id:"lost", label:"Lost", pers:{positivity:-40, confidence:-30}, profile:{humor:"Self-Deprecating"}},
             {id:"funny", label:"Funny", pers:{positivity:20, intelligence:20}, profile:{humor:"Absurd & Chaotic"}}],
  lovableLiar:[{id:"harmless", label:"Harmless", pers:{agreeableness:40}, profile:{humor:"Warm & Playful"}},
             {id:"dangerous", label:"Dangerous", pers:{agreeableness:-40, emotionalcapacity:-40}, profile:{humor:"Cruel & Barbed", attachment:"Avoidant"}},
             {id:"sad", label:"Sad underneath", pers:{positivity:-40}, profile:{attachment:"Anxious"}}],
  incuriousContent:[{id:"warm", label:"Warm", pers:{friendliness:40}, profile:{role:"Caretaker"}},
             {id:"gruff", label:"Gruff", pers:{friendliness:-30, manners:-30}, profile:{humor:"Dry & Deadpan"}},
             {id:"pious", label:"Pious", pers:{discipline:40, rebelliousness:-40}, profile:{values:"Rigid & Principled"}}],
  gloomyRomantic:[{id:"tender", label:"Tender", pers:{friendliness:40, agreeableness:30}, profile:{role:"Caretaker"}},
             {id:"theatrical", label:"Theatrical", pers:{assertiveness:30, confidence:20}, profile:{role:"Instigator"}},
             {id:"withdrawn", label:"Withdrawn", pers:{friendliness:-40}, profile:{attachment:"Avoidant"}}],
  scatteredGenius:[{id:"charming", label:"Charming", pers:{friendliness:50}, profile:{role:"Connector"}},
             {id:"prickly", label:"Prickly", pers:{friendliness:-40, agreeableness:-40}, profile:{humor:"Cruel & Barbed"}},
             {id:"anxious", label:"Anxious", pers:{confidence:-40}, profile:{attachment:"Anxious"}}],
  jadedFixer:[{id:"soft", label:"Soft underneath", pers:{emotionalcapacity:30, friendliness:20}, profile:{role:"Caretaker"}},
             {id:"cruel", label:"Cruel", pers:{agreeableness:-50}, profile:{humor:"Cruel & Barbed"}},
             {id:"tired", label:"Tired", pers:{activeness:-40}, profile:{humor:"Dry & Deadpan"}}],
  bigHeartedBoss:[{id:"gruff", label:"Gruff", pers:{manners:-40}, profile:{humor:"Dry & Deadpan"}},
             {id:"sentimental", label:"Sentimental", pers:{positivity:30}, profile:{humor:"Warm & Playful"}},
             {id:"volatile", label:"Volatile", pers:{agreeableness:-40}, profile:{stress:"Fight (attack the threat)"}}],
};
Object.entries(ARCHETYPE_INTENT).forEach(([k, v])=>{ if (ARCHETYPES[k]) ARCHETYPES[k].intent = v; });
Object.entries(ARCHETYPE_VARIATIONS).forEach(([k, v])=>{ if (ARCHETYPES[k]) ARCHETYPES[k].variations = v; });

/* The preset as it will actually be applied: the base numbers with the chosen
   variation's deltas folded in, the profile hints overridden where the variation says
   so, and — carried along — the intent so the blend can honour the `must` axes. Every
   consumer (the build, the preview, the fidelity meter) reads THIS, so a variation
   cannot be visible in one place and absent in another. */
function effectiveArchetype(key, variationId){
  const base = ARCHETYPES[key] || CUSTOM_ARCHETYPES[key];
  if (!base) return null;
  const out = Object.assign({}, base, {pers: Object.assign({}, base.pers || {}), profile: Object.assign({}, base.profile || {})});
  out.variation = null;
  if (variationId && variationId !== 'base' && Array.isArray(base.variations)){
    const v = base.variations.find(x=>x.id === variationId);
    if (v){
      out.variation = v;
      Object.entries(v.pers || {}).forEach(([axis, delta])=>{
        out.pers[axis] = Math.round(clamp((out.pers[axis] || 0) + delta, -100, 100));
      });
      Object.assign(out.profile, v.profile || {});
      out.label = base.label + " — " + v.label;
    }
  }
  return out;
}
/* How much of the preset survives the blend with the user's own sliders. Was a fixed
   0.65 with no control. The `must` axes never drop below MUST_FLOOR, so turning the
   blend down makes a preset a lighter starting point without making it unrecognisable
   — the con artist stays dishonest at 20% blend; their manners are up to you. */
const ARCHETYPE_MUST_FLOOR = 0.85;
function archetypeBlendLevel(){
  const el = document.getElementById('archetypeBlend');
  return el ? clamp(parseFloat(el.value) || 0, 0, 1) : 0.65;
}
function archetypeAxisBlend(arch, axisId){
  const w = archetypeBlendLevel();
  const must = arch && arch.intent && Array.isArray(arch.intent.must) && arch.intent.must.includes(axisId);
  return must ? Math.max(w, ARCHETYPE_MUST_FLOOR) : w;
}

// user-defined archetypes loaded from storage
let CUSTOM_ARCHETYPES = {};

const AXIS_LABELS = {
  vol:"volume/wordiness", pace:"pacing", form:"formality", warm:"emotional warmth",
  hon:"honesty", asrt:"assertiveness", ego:"self-confidence", agr:"agreeableness",
  man:"manners", disc:"discipline", rebel:"rebelliousness", emo:"emotional openness",
  intel:"analytical thinking", pos:"optimism", act:"physical energy", mood:"current mood",
  cur:"curiosity"
};

const STRESS_KEYWORDS = /panic|adrenaline|breathless|explosive|pressure|urgent|stammer|shock|tension|rapid-fire|combat|erratic|feverish|danger/i;

// ---------- Continuous slider helpers ----------
function rawToLevel(raw){ return raw/50; } // -100..100 -> -2..2
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

// Reads a numeric field (by id or element) with an explicit radix and a guaranteed
// fallback. These slot-count/level reads are backed by <select> elements today, so
// parseInt on them is currently safe — but there's no defensive fallback anywhere in
// the numeric read path, so if a field ever becomes free-text (several "advanced"
// fields already are), a blank value would silently produce NaN and propagate through
// slot counts with no visible error.
function intVal(idOrEl, fallback){
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return fallback;
  const n = parseInt(el.value, 10);
  return Number.isNaN(n) ? fallback : n;
}

// REWRITE: the old strengthFromLevel had a hard dead zone below |level| 0.3 (raw ±15),
// so a third of every slider's travel did literally nothing, and everything past it was
// a flat ramp. Now: a tiny dead zone (raw ±3, just enough to make "centred" mean
// centred) and a smoothstep curve, so raw 20 / 30 / 40 all produce measurably
// different pull instead of landing in the same band.
function strengthFromLevel(level){
  const a = clamp((Math.abs(level) - 0.06) / 1.94, 0, 1);
  return a*a*(3 - 2*a); // smoothstep
}

/* ============================================================================
   CONTINUOUS INTENSITY RANGE ENGINE
   ----------------------------------------------------------------------------
   The old system rounded a slider to one of five integer intensity buckets, so
   -35 and -45 usually resolved to the identical pool and drew from the identical
   handful of traits. Two changes fix that:

   1. Every trait gets a CONTINUOUS position on the 1–5 intensity scale. Its
      declared integer intensity is the centre; a deterministic per-trait offset
      (hashed off its id, so it never changes between runs) spreads it inside
      that band. Twelve intensity-3 traits stop being interchangeable and become
      twelve distinct points between roughly 2.55 and 3.45.

   2. Slider magnitude maps to a continuous TARGET on the same scale, and each
      trait is eligible only inside a window around it. -35 targets 2.40 and -45
      targets 2.80 — overlapping windows, different centres, visibly different
      results, and a smooth gradient the whole way along the slider instead of
      five steps.

   Because position <-> slider magnitude is a straight invertible mapping, every
   trait has a real ACTIVE BAND: the span of slider values it can appear at, and
   outside of which it never will. That band is shown on the card.
   ========================================================================== */

const POS_SPREAD = 0.92;  // total width an intensity bucket spreads across
const _posCache = new Map();

// RECALIBRATION (pool scale-up): the original placement used a pure hash offset per
// trait. That's fine for small buckets, but an audit after this round's content pass
// found 1,236 near-collision pairs (positions within 0.01 of each other) across the
// pool, with one category alone (Verbosity > Stylized & Elaborate, 114 traits) having
// 46 of them — over a third of that category's traits functionally indistinguishable
// to the distance-weighted picker despite being different content. That's a birthday-
// paradox consequence of hash randomness once a (category, intensity) bucket holds
// more than a couple dozen traits, which is now common.
//
// Fix: traits sharing a (section, category, intensity) bucket are placed with a
// golden-ratio Weyl sequence instead of raw hash — an equidistribution sequence with
// a proven property (the three-distance theorem) that gaps between any N points take
// at most three distinct values, however large N grows. This eliminates near-
// collisions by construction rather than hoping randomness avoids them, and — because
// it depends only on each trait's fixed rank within its bucket (sorted by id) — stays
// fully deterministic, preserving seeded-generation reproducibility. Singleton
// buckets (nothing to collide with) keep the simpler hash offset.
const GOLDEN_RATIO = 0.6180339887498949;
let _bucketRanksBuilt = false;
const _bucketRank = new Map(); // trait.id -> {rank, size}
function _buildBucketRanks(){
  const buckets = new Map();
  TRAITS.forEach(t=>{
    const k = t.section+"||"+t.category+"||"+t.intensity;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(t);
  });
  buckets.forEach(list=>{
    list.sort((a,b)=>a.id-b.id); // stable, deterministic regardless of load order
    list.forEach((t,i)=> _bucketRank.set(t.id, {rank:i, size:list.length}));
  });
  _bucketRanksBuilt = true;
}
function traitPos(t){
  if (!t) return 3;
  if (_posCache.has(t.id)) return _posCache.get(t.id);
  if (!_bucketRanksBuilt) _buildBucketRanks();
  const info = _bucketRank.get(t.id);
  let offset;
  if (info && info.size > 1){
    const frac = (info.rank * GOLDEN_RATIO) % 1; // low-discrepancy, evenly fills as bucket grows
    offset = (frac - 0.5) * POS_SPREAD;
  } else {
    // xorshift-ish integer hash: fine for a singleton bucket, nothing to collide with
    // BUG FIX: the final `h ^= h >>> 16` yields a SIGNED 32-bit int, so h could be
    // negative and `h % 10000` with it — doubling the intended spread to ±POS_SPREAD
    // and letting a singleton-bucket trait drift a full intensity level away from the
    // one printed on its own card. Force it back to unsigned before the modulo.
    let h = (t.id * 2654435761) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    offset = ((h % 10000) / 10000 - 0.5) * POS_SPREAD;
  }
  const p = clamp(t.intensity + offset, 0.55, 5.45);
  _posCache.set(t.id, p);
  return p;
}

/* PHASE 2 — EASED RESPONSE CURVE
   The old mapping was linear: target = 1 + mag/100*4. That spent the scale far
   too fast. Measured on the old curve: slider 10 already returned intensity-2
   traits, slider 45 returned intensity-3, and by slider 50 you were at target
   3.00 — dead centre of the dial producing solidly loud traits. Half the slider
   was gone before you left "moderately pronounced."

   Now eased with an exponent, so the bottom of the dial is a long quiet runway
   and intensity 4-5 is genuinely reserved for the top quarter:

     slider  |   0     10     25     50     75    100
     old     | 1.00   1.40   2.00   3.00   4.00   5.00
     new     | 1.00   1.12   1.42   2.23   3.42   5.00

   magFromPos is the exact inverse, so the active-range band shown on each card
   stays truthful — it's still the real span that trait can appear at. */
const CURVE_EXP = 1.75;
function targetFromMag(mag){
  const m = clamp(mag, 0, 100) / 100;
  return 1 + 4 * Math.pow(m, CURVE_EXP);
}
function magFromPos(pos){
  const p = clamp((pos - 1) / 4, 0, 1);
  return Math.pow(p, 1 / CURVE_EXP) * 100;
}
function targetFromLevel(level){ return targetFromMag(Math.abs(level) * 50); }

// How tight the eligibility window is. User-controllable: "Slider precision".
// 0 = loose (wide bands, more variety, sliders nudge), 1 = tight (narrow bands,
// sliders dictate). Default sits deliberately toward the tight end.
// PERF FIX: rangeSelect and traitBand both call this, and rangeSelect runs on every
// single trait draw — roughly 30 slots x several redraws x a widening loop, i.e.
// hundreds of getElementById calls per generation, all returning the same number.
// Memoize both the element and the resolved value; invalidateSliderCache() (called
// from onSliderChange and after any programmatic slider write) drops it.
let _rangeFocusEl = null;
let _bandHalfMemo = null;
function invalidateSliderCache(){
  _rangeFocusEl = null; _bandHalfMemo = null;
  // The loudness estimate is measured against the band width, so it goes stale with it.
  if (typeof _loudPCache !== 'undefined') _loudPCache.clear();
}
function bandHalf(){
  if (_bandHalfMemo !== null) return _bandHalfMemo;
  if (!_rangeFocusEl) _rangeFocusEl = document.getElementById('rangeFocus');
  const el = _rangeFocusEl;
  const focus = clamp(floatVal(el, 0.62), 0, 1);
  return (_bandHalfMemo = 1.35 - 1.0 * focus); // 1.35 (loose) .. 0.35 (tight)
}

/* The slider span this trait can appear at, in raw magnitude terms.
   The window is half-width `h` in POSITION units (1..5), and the map from slider
   magnitude to position is targetFromMag — a power curve, not a line. Converting the
   window with `h * 25` therefore only holds near the middle: at position 3.006 with
   h = 0.73 it printed 49–86 where the true inverse gives 52–81, i.e. the card claimed
   reachability at settings that cannot reach it. Invert the actual position bounds.

   This is the NOMINAL band. Adaptive widening, jitter and pool floors can all seat a
   trait outside it, which is why the card's own copy says "usually" rather than
   "only" — see the tooltip in render.js. */
function traitBand(t, half){
  const h = (half === undefined) ? bandHalf() : half;
  const pos = traitPos(t);
  const lo = magFromPos(clamp(pos - h, 1, 5));
  const hi = magFromPos(clamp(pos + h, 1, 5));
  return [Math.max(0, Math.round(lo)), Math.min(100, Math.round(hi))];
}

/* ================= ANTI-REPETITION MEMORY =================
   _buildUsedIds stops one sheet seating the same trait twice. Nothing stopped the
   NEXT sheet — or the next ten — from reaching for the same entries again, which is
   what "everything I generate feels the same" actually looks like from inside a pool
   this large: not literally identical characters, but the same two dozen memorable
   traits recurring because the weighting keeps favouring them.

   Keep a rolling window of the traits recently generated and softly penalise them.
   Soft on purpose: a penalty, never an exclusion, so a trait your sliders point
   straight at can still win — it just has to earn it against fresher material. */
// Widened from 6 to 12, and the toggle now ships ON. Every anti-staleness mechanism in
// the app defaulted to off, which meant the SHIPPING configuration was the maximally
// convergent one and each counterweight was opt-in behind an Advanced panel. This one
// is a soft multiplicative penalty and can never make a trait impossible — a trait the
// sliders point straight at still wins, it just has to earn it against fresher material
// — so there is no reason for it to be off by default.
const RECENT_WINDOW = 12;         // how many past characters are remembered
const RECENT_PENALTY = 0.4;       // multiplier applied to a trait seen in that window
let recentTraitIds = [];          // array of Sets, newest last

/* SLOT-LEVEL REPETITION MEMORY. Distinct from the cross-character recentTraitIds
   above, and unconditional: recentTraitIds is gated on the "avoid recent traits"
   toggle and remembers whole characters, which is the right tool for "stop showing me
   the same person" and the wrong one for "stop showing me the same Register card".
   The pools where the collapse is worst are the ones drawn on every single sheet, so
   the same slot returning the same trait twice running is the most visible symptom
   there is. Halve a trait's weight if this exact slot returned it last time; nothing
   is excluded, so a genuinely small pool still works. */
const SLOT_REPEAT_PENALTY = 0.5;
let lastBySlot = {};              // slotId -> trait id the last COMMITTED character had
let _slotDrawKey = null;          // which slot the current draw is for, if any
function forgetSlotDraws(){ lastBySlot = {}; }
/* Recorded from rememberGeneration — when a character is committed — rather than
   during the draw itself. Writing it per-draw meant every speculative build polluted
   it: cast members, foils, gap-fillers and the pressure variant all overwrote the
   single character's memory, and a build could even perturb its own later slots. */
function rememberSlotDraws(st){
  Object.entries(st || {}).forEach(([id, s2])=>{ if (s2 && s2.trait) lastBySlot[id] = s2.trait.id; });
}
// Names the slot a draw belongs to, so slotRepeatPenalty can ask "did this same slot
// return this same trait for the last character?".
function withSlotMemory(slotId, fn){
  const prior = _slotDrawKey;
  _slotDrawKey = slotId;
  try { return fn(); }
  finally { _slotDrawKey = prior; }
}
function slotRepeatPenalty(t){
  if (!_slotDrawKey || !t) return 1;
  // Gated on the same toggle as the cross-character memory, and for the same reason:
  // both take PREVIOUS characters as an input, so a seed can only replay exactly with
  // them switched off. That exception is already stated on the seed field; this
  // belongs under it rather than becoming a second, undocumented one.
  if (!_avoidRecentActive) return 1;
  return lastBySlot[_slotDrawKey] === t.id ? SLOT_REPEAT_PENALTY : 1;
}

function rememberGeneration(st){
  const ids = new Set();
  Object.values(st || {}).forEach(s=>{ if (s && s.trait) ids.add(s.trait.id); });
  if (!ids.size) return;
  recentTraitIds.push(ids);
  while (recentTraitIds.length > RECENT_WINDOW) recentTraitIds.shift();
  const fams = new Set();
  Object.values(st || {}).forEach(s=>{ if (s && s.trait && s.trait.conceptFamily) fams.add(s.trait.conceptFamily); });
  recentFamilies.push(fams);
  while (recentFamilies.length > RECENT_WINDOW) recentFamilies.shift();
  rememberSlotDraws(st);
}
function forgetRecentTraits(){ recentTraitIds = []; recentFamilies = []; }
/* Which traits keep coming back across the session's recent window. recentTraitIds has
   held this the whole time and nothing ever showed it to anyone. */
function recurringTraits(minCount){
  const window = recentTraitIds.length;
  if (window < 3) return [];
  const counts = new Map();
  recentTraitIds.forEach(set => set.forEach(id => counts.set(id, (counts.get(id)||0) + 1)));
  return [...counts.entries()]
    .filter(([, n]) => n >= (minCount || 3))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, n]) => ({trait: TRAITS_BY_ID.get(id), count: n, window}))
    .filter(r => r.trait);
}
function avoidRecentEnabled(){
  const el = document.getElementById('avoidRecentToggle');
  return el ? !!el.checked : true;   // default-on; see RECENT_WINDOW above
}
let _avoidRecentActive = false;   // resolved once per build, not per draw
/* DECAY, and SEMANTIC repetition. The penalty used to be flat across the window: a
   trait from twelve characters ago was penalised exactly as hard as one from the last
   character, so the window behaved like a twelve-character ban list and then an
   amnesty. It now decays with age, so the last character's traits are what the next
   one actively avoids and the tail of the window only nudges.

   And it used to track IDS only, so "different wording, same narrative function" — a
   paraphrase of the trait you just had — sailed through the novelty check. Entries
   that declare a conceptFamily are remembered by family too, at a softer penalty,
   which is what the audit means by distinguishing exact from semantic repetition. */
const RECENT_DECAY = 0.82;            // per character of age
const RECENT_FAMILY_PENALTY = 0.7;    // same concept family as a recent trait
let recentFamilies = [];              // array of Sets of conceptFamily, newest last
function recentPenalty(t){
  let m = avoidPenalty(t);
  if (!_avoidRecentActive || !recentTraitIds.length) return m;
  const n = recentTraitIds.length;
  for (let i = n - 1; i >= 0; i--){
    const age = n - 1 - i;
    if (recentTraitIds[i].has(t.id)){
      // penalty strength fades toward 1 with age: 1 - (1-P)*decay^age
      m *= 1 - (1 - RECENT_PENALTY) * Math.pow(RECENT_DECAY, age);
      break;
    }
  }
  if (t.conceptFamily && recentFamilies.length){
    for (let i = recentFamilies.length - 1; i >= 0; i--){
      const age = recentFamilies.length - 1 - i;
      if (recentFamilies[i].has(t.conceptFamily)){
        m *= 1 - (1 - RECENT_FAMILY_PENALTY) * Math.pow(RECENT_DECAY, age);
        break;
      }
    }
  }
  return m;
}

/* ================= "SAME WORLD, DIFFERENT PERSON" =================
   An explicit avoid set: the trait ids, concept families and resolved categories of a
   character the next build must NOT resemble. Unlike the recent-history window this is
   a stated choice, so it is not gated on the avoid-recent toggle and it survives replay
   mode (a "different person from X" is reproducible given X). Set by
   generateSameWorld(), cleared after the build. */
let AVOID_SET = null;   // {ids:Set, families:Set, cats:Set}
function setAvoidSet(v){ AVOID_SET = v || null; }
function avoidPenalty(t){
  if (!AVOID_SET || !t) return 1;
  if (AVOID_SET.ids.has(t.id)) return 0.08;
  if (t.conceptFamily && AVOID_SET.families.has(t.conceptFamily)) return 0.35;
  return 1;
}
function avoidCategoryMultiplier(cat){
  return (AVOID_SET && AVOID_SET.cats.has(cat)) ? 0.3 : 1;
}
function avoidSetFrom(st){
  const ids = new Set(), families = new Set(), cats = new Set();
  Object.values(st || {}).forEach(sl=>{
    const t = sl && sl.trait; if (!t) return;
    ids.add(t.id); if (t.conceptFamily) families.add(t.conceptFamily);
  });
  PROFILE_SECTIONS.forEach(ps=>{ const c = slotCat((st||{})['prof_'+ps.id+'_0']); if (c) cats.add(c); });
  return {ids, families, cats};
}

/* ================= THE PROJECT ARCHIVE =================
   The recent window is a session thing and forgets. A project's ACCEPTED characters —
   saved, kept from a batch, added to a cast — are what a new one should be measured
   against for real, and they persist with the project (Feature F). The archive holds
   signatures, not sheets. */
let PROJECT_ARCHIVE = [];   // [{id, name, ids:Set, families:Set, cats:Set, defining:Set, prof}]
function archiveCharacter(st, meta){
  if (!st || !Object.keys(st).length) return;
  const sig = avoidSetFrom(st);
  const all = Object.values(st).filter(x=>x && x.trait);
  const score = t => (RTIER_SCORE[t.rtier || rarityTier(t)] || 0) * 10 + (t.intensity || 0);
  const defining = new Set(all.slice().sort((a,b)=>score(b.trait)-score(a.trait)).slice(0, 5).map(x=>x.trait.id));
  let prof = {};
  try { prof = (typeof axisProfile === 'function') ? axisProfile(st) : {}; } catch(e){}
  PROJECT_ARCHIVE.push({id: (meta && meta.id) || null, name: (meta && meta.name) || '', ids: sig.ids, families: sig.families,
    cats: sig.cats, defining, prof, at: Date.now()});
  while (PROJECT_ARCHIVE.length > 200) PROJECT_ARCHIVE.shift();
}
function forgetArchive(){ PROJECT_ARCHIVE = []; }
function getArchive(){ return PROJECT_ARCHIVE; }
// Serialisable form for a project file; Sets do not survive JSON.
function exportArchive(){ return PROJECT_ARCHIVE.map(a=>({id:a.id, name:a.name, ids:[...a.ids], families:[...a.families], cats:[...a.cats], defining:[...a.defining], prof:a.prof, at:a.at})); }
function importArchive(list){
  PROJECT_ARCHIVE = (list || []).map(a=>({id:a.id||null, name:a.name||'', ids:new Set(a.ids||[]), families:new Set(a.families||[]),
    cats:new Set(a.cats||[]), defining:new Set(a.defining||[]), prof:a.prof||{}, at:a.at||0}));
}

/* ================= THE DIVERSITY OBJECTIVE =================
   "Produce a bounded candidate batch and choose a set that balances user intent, hard
   validity, semantic diversity, and narrative utility ... treat the weights as tunable
   hypotheses, not a universal formula." Scores a candidate sheet's DISTANCE from a set
   of references (the current character, the archive): higher is more distinct. Every
   term is a plain overlap or distance so the weights mean something; they live in one
   table so they can be argued with. */
const DIVERSITY_OBJECTIVE_WEIGHTS = {
  traitOverlap: 1.0,      // share of trait ids in common
  familyOverlap: 0.6,     // share of concept families in common (semantic repetition)
  categoryOverlap: 0.8,   // share of resolved profile categories in common
  definingOverlap: 1.5,   // the reference's five defining traits appearing here at all
  profileDistance: 0.5,   // axis-profile distance (0..~2), as a bonus
};
function _overlapShare(a, b){
  if (!a.size || !b.size) return 0;
  let n = 0; a.forEach(v=>{ if (b.has(v)) n++; });
  return n / Math.min(a.size, b.size);
}
function _profDist(a, b){
  const keys = new Set([...Object.keys(a||{}), ...Object.keys(b||{})]);
  let s = 0, k = 0; keys.forEach(ax=>{ const d = (a[ax]||0) - (b[ax]||0); s += d*d; k++; });
  return k ? Math.sqrt(s / k) : 0;
}
function diversityScore(candidateState, references){
  const sig = avoidSetFrom(candidateState);
  const ids = new Set(); Object.values(candidateState).forEach(x=>{ if (x && x.trait) ids.add(x.trait.id); });
  let prof = {}; try { prof = axisProfile(candidateState); } catch(e){}
  const W = DIVERSITY_OBJECTIVE_WEIGHTS;
  if (!references || !references.length) return {score: 0, terms: {}, worst: null};
  // Distance to the NEAREST reference is what matters: a candidate that is far from
  // most of the archive but a twin of one member is a twin.
  let worst = null;
  references.forEach(ref=>{
    const t = {
      traitOverlap: _overlapShare(ids, ref.ids),
      familyOverlap: _overlapShare(sig.families, ref.families),
      categoryOverlap: _overlapShare(sig.cats, ref.cats),
      definingOverlap: ref.defining ? [...ref.defining].filter(id=>ids.has(id)).length / Math.max(1, ref.defining.size) : 0,
      profileDistance: _profDist(prof, ref.prof || {}),
    };
    const score = -W.traitOverlap*t.traitOverlap - W.familyOverlap*t.familyOverlap - W.categoryOverlap*t.categoryOverlap
                  - W.definingOverlap*t.definingOverlap + W.profileDistance*Math.min(2, t.profileDistance);
    if (!worst || score < worst.score) worst = {score, terms: t, ref};
  });
  return worst;
}
function referenceFromState(st, name){
  const sig = avoidSetFrom(st);
  const ids = new Set(); Object.values(st||{}).forEach(x=>{ if (x && x.trait) ids.add(x.trait.id); });
  const all = Object.values(st||{}).filter(x=>x && x.trait);
  const score = t => (RTIER_SCORE[t.rtier || rarityTier(t)] || 0) * 10 + (t.intensity || 0);
  const defining = new Set(all.slice().sort((a,b)=>score(b.trait)-score(a.trait)).slice(0,5).map(x=>x.trait.id));
  let prof = {}; try { prof = axisProfile(st); } catch(e){}
  return {name: name || '', ids, families: sig.families, cats: sig.cats, defining, prof};
}

// Returns the eligible slice around `target`, widening only if the pool is too
// thin to draw from. `widened` is surfaced in the UI so a sparse category is
// visible as a data gap rather than silently behaving like a loose one.
/* ================= POOL-FLOOR TARGETS =================
   rangeSelect clamps a target into the pool's span and reflects the window at the
   boundary, and both help — but neither can put material where there is none. When the
   requested target sits AT the pool's floor, every candidate is above it and the draw
   concentrates on the two or three lowest-position traits no matter how wide the
   window gets. Measured over 1,000 draws each, before this:

     Register (neutral slot)               83-trait pool ->  15 distinct, top trait 28.4%
     Situational Friendliness @ slider 0   41-trait pool ->  15 distinct, top trait 35.0%
     Movement & Bearing @ default          39-trait pool ->  11 distinct, top trait 33.4%
     Distinguishing Marks @ default        38-trait pool ->   9 distinct, top trait 26.1%

   And over 300 default-settings characters the consequence is visible from orbit:
   "Hushed-deliberate" in 83 of 300, "Sailor's roll on dry land" in 81, "Enters a room
   backwards" in 79. Nothing is more corrosive to a generator than a distinctive image
   turning up every fourth time.

   The cause is targetFromMag(18) = 1.20 (and targetFromMag(15) = 1.09 for Marks)
   against pools whose floors sit at 1.5-1.9. The target is below the pool entirely.
   Lift a neutral target to sit a real distance INSIDE its own pool, so the proximity
   kernel has material on both sides of centre and the window is spending its width on
   traits rather than on empty space. Only the neutral/unemphatic targets get this:
   a target the user actually asked for by moving a slider is left exactly where they
   put it, clamping and all. */
/* Quantile over an unsorted numeric array, linear interpolation between ranks.
   Shared by poolFloorTarget and the density diagnostics. */
function quantile(values, q){
  if (!values || !values.length) return NaN;
  const a = values.slice().sort((x,y)=>x-y);
  if (a.length === 1) return a[0];
  const pos = clamp(q, 0, 1) * (a.length - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (pos - lo);
}

/* BUG FIX (the lift was a no-op). This used to compute max(target, min(pool) + 0.35).
   traitPos clamps to [0.55, 5.45] and the i1/i5 tail-fill content passes put at least
   one intensity-1 trait in essentially every category, so min(pool) is 0.55 almost
   everywhere, the lift produced 0.90, and max(1.20, 0.90) returned the ORIGINAL target
   unchanged. Every pool this function was written for was still being aimed below its
   own material — Register (neutral) was measured at 15 distinct traits out of 83, and
   app_move's most frequent draw was still "Enters a room backwards", the exact trait
   the original fix names as its symptom.

   A single tail trait must not be allowed to define where the pool "starts". Use the
   25th percentile of the pool's positions instead: robust to one or two outliers at
   either end, and it lands the target inside the body of the material rather than on
   its lower edge, which is what gives the proximity kernel traits on BOTH sides of
   centre. `lift` is retained for callers that want to sit deliberately deeper in. */
const POOL_FLOOR_QUANTILE = 0.25;
function poolFloorTarget(pool, target, lift){
  if (!pool || !pool.length) return target;
  const positions = pool.map(traitPos);
  const floor = quantile(positions, POOL_FLOOR_QUANTILE);
  if (!isFinite(floor)) return target;
  return Math.max(target, floor + (lift === undefined ? 0 : lift));
}

// A window should hold a real slice of its pool. 0.35 matches the clamped-case
// requirement that was already shown to work; the cap keeps the big pools sharp.
const POOL_ELIGIBLE_FRAC = 0.35;
const POOL_ELIGIBLE_CAP = 26;
function rangeSelect(pool, target, minCount){
  /* TARGET CLAMPING. The widening loop below reacts to how MANY candidates it found,
     never to WHERE they sit. When the target falls outside the pool's actual span —
     which happens constantly on the 20-trait Motivation pools, whose lowest entry is
     already above the default target — every candidate lies on the same side of it,
     the proximity falloff in pickInRange stops being a two-sided bell and becomes
     monotonic, and the draw degenerates into "always return the lowest trait in the
     pool". Measured before this fix: The Need returned 5 distinct traits in 3,000
     draws, one of them 81% of the time, on a section drawn on every single sheet.
     Pull the target into the span first, so the falloff always has material on both
     sides of it. `clamped` is surfaced so the underlying data gap stays visible in
     the UI rather than being silently smoothed away. */
  let lo = Infinity, hi = -Infinity;
  for (const t of pool){ const p = traitPos(t); if (p < lo) lo = p; if (p > hi) hi = p; }
  const clampedTarget = clamp(target, lo, hi);
  const clamped = Math.abs(clampedTarget - target) > 1e-9;
  /* A clamped target means the pool cannot serve the intensity that was asked for.
     Precision about WHERE inside the pool to draw is therefore false precision — the
     honest answer is "the nearest end of this pool", and the nearest end is a region,
     not a point. So widen the requirement as well as the target: ask for a real slice
     of the pool rather than the bare four candidates the tight band would return.
     Without this, clamping alone still bottoms out on the same handful of traits,
     because the band is narrow independently of where its centre sits. */
  /* WINDOW WIDTH BY POOL DENSITY, not by the precision slider alone.
     bandHalf() returns one width in position units for every pool in the bank. A
     +/-0.73 window is a reasonable slice of a 120-trait Verbosity category and far too
     narrow on a 40-trait Situational one, where the same width holds a dozen traits —
     which is why the fixed-category slots collapsed to 11-19 distinct draws while the
     category-choosing slots (vocab, manner, grammar, role) stayed healthy at 150-215.

     So state the requirement as a COUNT and let the existing widening loop find the
     width that satisfies it. The clamped case already did exactly this; the ordinary
     case is the one that needed it. Capped so a very large pool keeps its precision —
     the point is to stop thin pools starving, not to flatten fat ones. */
  const density = Math.min(POOL_ELIGIBLE_CAP, Math.ceil(pool.length * POOL_ELIGIBLE_FRAC));
  const wantCount = clamped ? Math.max(6, Math.ceil(pool.length * 0.35))
                            : Math.max(minCount || 4, density);
  const need = Math.min(wantCount, pool.length);
  /* BOUNDARY REFLECTION. Clamping fixes a target that sits outside the pool; it does
     nothing for one that sits just inside the edge, which is the far more common case
     and the one that actually bites. The Need's lowest trait is at 2.40 and the default
     target is 2.41: technically inside the span, so nothing clamps, but the window
     [2.06, 2.76] spends half its width on empty space below the pool and the draw is
     left choosing between the five intensity-2 entries that remain.

     Treat the window like a smoothing kernel at a domain boundary: whatever width
     falls off the end of the pool is added back on the other side, so the eligible
     slice keeps its intended WIDTH instead of silently shrinking to whatever happens
     to survive the truncation. Deliberately asymmetric rather than just "widen both
     ways" — that would drag an on-target draw off its target. Here the centre of mass
     moves only as far as the missing material forces it to. */
  let half = bandHalf(), widened = false, list = [], loEdge = 0, hiEdge = 0;
  const window = () => {
    const spill = {below: Math.max(0, (clampedTarget - half) - lo), above: Math.max(0, hi - (clampedTarget + half))};
    // reflect only the width that overhangs the pool, and only into a side that has room
    const overBelow = Math.max(0, lo - (clampedTarget - half));
    const overAbove = Math.max(0, (clampedTarget + half) - hi);
    loEdge = clampedTarget - half - Math.min(overAbove, spill.below);
    hiEdge = clampedTarget + half + Math.min(overBelow, spill.above);
    // Trim to the pool's own span. The reflected width has already been added to the
    // opposite side, so the window keeps its intended size; leaving the overhang in
    // place would only drag the reported centre out past the last real trait, which is
    // the same off-pool centre this whole block exists to prevent.
    loEdge = Math.max(loEdge, lo); hiEdge = Math.min(hiEdge, hi);
    return pool.filter(t => { const p = traitPos(t); return p >= loEdge && p <= hiEdge; });
  };
  for (let i = 0; i < 7; i++){
    list = window();
    if (list.length >= need) break;
    half *= 1.45; widened = true;
  }
  if (!list.length){ list = pool.slice(); half = 5; loEdge = lo; hiEdge = hi; widened = true; }
  /* The proximity falloff in pickInRange measures distance from centre against `half`.
     Once the window is reflected it is no longer centred on clampedTarget, so report
     the window's own midpoint and half-width — otherwise traits in the reflected part
     read as further from centre than they are and the collapse returns by the back
     door. */
  const centre = (loEdge + hiEdge) / 2;
  const effHalf = Math.max((hiEdge - loEdge) / 2, 1e-6);
  return {list, half: effHalf, widened, target: centre, clamped, requested: target};
}

// Distance-weighted draw: traits sitting exactly on the target are far likelier
// than ones at the edge of the window, so movement inside a single intensity
// bucket still shifts the odds. This is what makes -35 and -45 feel different
// even when they share most of their eligible pool.
//
// ALSO folds in trait-level polarity affinity (see CURRENT_AFFINITY_VEC / polarityFit
// further down): a trait whose own pol vector agrees with the character's current
// combined personality+voice posture gets a further boost; one that conflicts gets
// suppressed. This is what makes slider combinations reach individual TRAIT choices
// within a category — not just which category gets picked — across every section
// that has polarity-tagged traits (Personality, Stress, Role, Values, Attachment,
// Humor, Vices, and now Motivation & Wound too).
// `flatten` softens the proximity falloff. The default 2.4 exponent concentrates
// picks tightly on the target, which is right for the side pools (that sharpness is
// what makes -35 and -45 differ). But for the Situational pools every entry is quiet
// by construction, so precision buys nothing and the concentration just made slider 0
// return the same few traits — measured: 6 distinct in 50 rolls even after the pool
// grew. A gentler exponent there trades precision (irrelevant) for variety (the point).
/* The proximity component of the draw weight, factored out so the picker and anything
   that needs to REASON about the picker (expectedLoudCount) share one definition rather
   than keeping two that drift. Rarity, tier, affinity and recency stay in pickInRange:
   they are per-draw context, not a property of the window. */
function proximityWeights(list, centre, half, flatten){
  const exp = flatten ? 0.8 : clamp(0.9 + list.length/40, 0.9, 2.4);
  /* BUG FIX: `flatten` pinned the tail floor at a flat 0.03 while the ordinary path
     scaled it with list size — so on a short list, asking to FLATTEN the draw made the
     tail nearly thirty times thinner than not asking (0.03 against 0.11 for eleven
     candidates), which is the opposite of what the flag means and it was being passed
     on exactly the thin pools that needed it most. The floor is a small-pool
     protection either way; only the exponent is the flatten/precision knob. */
  const floor = 0.03 + 0.9/Math.max(4, list.length);
  return list.map(t => {
    const d = Math.abs(traitPos(t) - centre) / half;      // 0 at centre, 1 at edge
    return floor + Math.pow(1 - Math.min(d, 0.9999), exp); // smooth falloff
  });
}

// Set for the duration of a single draw when divergence's coin comes up — see the
// note in pickCategoryWeighted and the affinity inversion below.
let _divergeThisDraw = false;
function pickInRange(pool, rarityPref, target, minCount, flatten){
  if (!pool || !pool.length) return null;
  const div = divergenceLevel();
  _divergeThisDraw = div > 0 && rand() < div;
  try { return _pickInRangeInner(pool, rarityPref, target, minCount, flatten); }
  finally { _divergeThisDraw = false; }
}
function _pickInRangeInner(pool, rarityPref, target, minCount, flatten){
  if (target === undefined || target === null) return pickWeighted(pool, rarityPref);
  const sel = rangeSelect(pool, target, minCount);
  const {list, half} = sel;
  // Draw against the CLAMPED target (see rangeSelect): weighting against a target the
  // pool cannot reach is what collapsed the thin pools.
  const centre = sel.target;
  const aff = affinityStrength();
  /* ADAPTIVE FALLOFF. The 2.4 exponent and the 0.03 floor were both tuned against the
     50-120-trait bipolar personality pools, where they are right: that sharpness is
     what makes slider -35 and -45 feel different. On a 20-trait pool the same numbers
     are a scalpel used as an axe — 0.03 is about a thirtieth of an on-target trait's
     weight, so everything off-centre is effectively excluded, and with only a handful
     of candidates in the band there is nothing left to vary. Scale both with pool
     size: small pools flatten and lift their tail automatically, large ones keep the
     precision they were tuned for. */
  /* BUG FIX — the single largest repetition driver in the app, and it was hiding
     inside the fix for a different problem.

     rarityNorm equalises the rarity classes by dividing each trait's weight by how
     many of its class are present, so "Balanced" means an even split between classes
     regardless of how a category is composed. That is right — but it was being
     computed over `list`, the narrow post-window slice, and a window is not a
     population. A 15-candidate window holding 14 common traits and one uncommon one
     handed that single trait a full class share: 30% of the draw, on a slot that runs
     on every sheet. Measured, that is exactly why "Hushed-deliberate" turned up in 83
     of 300 default characters out of an 83-trait pool, and "Enters a room backwards"
     in 79 out of a 39-trait one.

     Normalise against the POOL instead. The pool is the population the class balance
     is a statement about, it does not change shape as the window widens, and a
     singleton inside one window is no longer mistaken for a whole class. */
  const norm = rarityNorm(pool);
  const prox = proximityWeights(list, centre, half, flatten);
  const weights = list.map((t, i) => {
    let w = prox[i] * rarityWeight(t, rarityPref, norm) * tierWeight(t, centre);
    if (aff > 0 && CURRENT_AFFINITY_VEC){
      const fit = polarityFit(t, CURRENT_AFFINITY_VEC); // -1..1, 0 if untagged
      // Divergence inverted CATEGORY selection but left the trait-level polarity
      // affinity untouched, so a diverged category still drew its most
      // posture-agreeable member — half the mechanism, doing a quarter of the work.
      // The same coin now flips the trait-level fit too.
      if (fit) w *= clamp(1 + aff*fit*(_divergeThisDraw ? -1 : 1), 0.15, 3);
    }
    w *= recentPenalty(t) * slotRepeatPenalty(t);
    return w;
  });
  const total = weights.reduce((a,b)=>a+b,0);
  let r = rand() * total;
  for (let i=0;i<list.length;i++){ r -= weights[i]; if (r <= 0) return list[i]; }
  return list[list.length-1];
}

// Kept as a thin shim: a few call sites still think in integer buckets, and this
// keeps them honest without reintroducing rounding into the main path.
function computeTargetIntensity(levelAbs){
  return clamp(Math.round(1 + (levelAbs/2)*4), 1, 5);
}

// ================= UNIFIED WEIGHT MATRIX =================
// One data table drives every cross-influence in the app: personality axes -> voice
// categories, personality axes -> profile-section types, AND resolved profile types ->
// voice categories / other profile-section types. Nothing here is an if-statement; it's
// all lookups, so it's the same code path whichever direction the influence runs.
//
// Shape:
//   WEIGHT_MATRIX[personalityAxisId] = { pos:{kind:{categoryFragment:weight}}, neg:{...} }
//   WEIGHT_MATRIX['<sectionId>:<Chosen Category>'] = { kind:{categoryFragment:weight} }
// "kind" is one of: vocab, grammar, manner, or a profile section id (stress, role,
// values, attachment, humor, vices) — the same lookup mechanism resolves both voice
// picks and profile "type" picks.
// Three named confidence tiers instead of a spray of hand-picked decimals (0.3, 0.4,
// 0.5, 0.65, 0.8...) that looked more precisely "measured" than they actually were.
// STRONG = this is close to a defining correlation for the axis. MODERATE = a real,
// secondary pull. WEAK = plausible and worth a nudge, not something to lean on.
const TIER_STRONG = 1.0, TIER_MODERATE = 0.6, TIER_WEAK = 0.3;

const WEIGHT_MATRIX = {
  friendliness: {
    pos:{ manner:{"Social & Boundary Mannerisms":TIER_STRONG}, humor:{"Warm & Playful":TIER_STRONG}, role:{"Peacemaker":TIER_STRONG,"Caretaker":TIER_MODERATE} },
    neg:{ manner:{"Postural & Spatial Dynamics":TIER_MODERATE}, humor:{"Cruel & Barbed":TIER_MODERATE,"Dry & Deadpan":TIER_WEAK}, role:{"Outsider":TIER_STRONG} }
  },
  honesty: {
    pos:{ vocab:{"Directness & Literalness":TIER_STRONG}, values:{"Rigid & Principled":TIER_STRONG} },
    neg:{ vocab:{"Pragmatic Focus & Speech Functions":TIER_STRONG}, values:{"Self-Interested":TIER_STRONG,"Pragmatic & Flexible":TIER_WEAK},
          // Deception lives in the face before it lives in the sentence.
          manner:{"Eye & Facial Expressions":TIER_MODERATE} }
  },
  assertiveness: {
    pos:{ grammar:{"Turn-Taking Grammar":TIER_STRONG}, stress:{"Fight":TIER_STRONG}, role:{"Leader":TIER_STRONG,"Instigator":TIER_WEAK} },
    // role was pos-only, so an unassertive character took no seat in particular.
    neg:{ grammar:{"Anchors & Fillers":TIER_STRONG}, stress:{"Flight":TIER_MODERATE,"Fawn":TIER_MODERATE},
          role:{"Peacemaker":TIER_MODERATE,"Connector":TIER_WEAK} }
  },
  confidence: {
    /* POLE COVERAGE. grammar, humor and stress appeared only on the negative pole, so a
       maximally confident character got no grammar, humor or stress steering from this
       axis at all — the slider was half a control. Confidence at the top is speech that
       does not hedge, a joke that does not chase the room, and a threat met rather than
       waited out; those are the same three kinds, stated for the pole that had none. */
    pos:{ manner:{"Vocal Modulation Mannerisms":TIER_MODERATE}, attachment:{"Secure":TIER_STRONG},
          grammar:{"Spoken Compression":TIER_WEAK}, humor:{"Dry & Deadpan":TIER_MODERATE},
          stress:{"Fight":TIER_MODERATE} },
    neg:{ grammar:{"Anchors & Fillers":TIER_MODERATE}, humor:{"Self-Deprecating":TIER_STRONG}, stress:{"Freeze":TIER_MODERATE}, attachment:{"Anxious":TIER_STRONG} }
  },
  agreeableness: {
    // Same one-sidedness: values fired only when agreeable, grammar/role/humor only when
    // disagreeable. Both poles now steer all four kinds.
    pos:{ stress:{"Fawn":TIER_STRONG}, values:{"Loyalty-Bound":TIER_MODERATE},
          grammar:{"Anchors & Fillers":TIER_WEAK}, role:{"Peacemaker":TIER_MODERATE,"Caretaker":TIER_WEAK},
          humor:{"Warm & Playful":TIER_MODERATE} },
    neg:{ grammar:{"Turn-Taking Grammar":TIER_WEAK}, stress:{"Fight":TIER_WEAK}, role:{"Instigator":TIER_MODERATE},
          humor:{"Cruel & Barbed":TIER_MODERATE}, values:{"Self-Interested":TIER_MODERATE} }
  },
  manners: {
    /* Both poles previously boosted "Register & Formality Spectrum" at the same tier,
       so Manners had exactly zero directional effect on vocabulary — and boostedVocabCats
       already boosts Register unconditionally for |regLevel| >= 1, making the entry
       redundant as well as inert. Crude manners pull toward blunt, audible speech and
       away from the mannerisms that mark social boundaries; polite manners keep the
       register link. */
    pos:{ vocab:{"Register & Formality Spectrum":TIER_STRONG}, manner:{"Social & Boundary Mannerisms":TIER_MODERATE} },
    neg:{ vocab:{"Directness & Literalness":TIER_MODERATE,"Phonetic & Auditory Qualities":TIER_WEAK}, humor:{"Cruel & Barbed":TIER_WEAK} }
  },
  discipline: {
    // grammar and values fired only for the disciplined, stress only for the undisciplined.
    pos:{ grammar:{"Structural Shifts":TIER_MODERATE}, vices:{"Restraint & Discipline":TIER_STRONG}, values:{"Rigid & Principled":TIER_WEAK},
          stress:{"Fight":TIER_WEAK} },
    // "Avoidance & Procrastination" was a cross-link source but the target of nothing,
    // so it could only ever arrive by an unguided roll. Low discipline is its most
    // obvious upstream cause.
    neg:{ vices:{"Compulsion & Ritual":TIER_MODERATE,"Risk & Escape":TIER_MODERATE,"Avoidance & Procrastination":TIER_MODERATE}, stress:{"Freeze":TIER_WEAK},
          grammar:{"Disfluencies & Flow":TIER_MODERATE}, values:{"Pragmatic & Flexible":TIER_WEAK} }
  },
  rebelliousness: {
    pos:{ vocab:{"Register & Formality Spectrum":TIER_MODERATE}, role:{"Instigator":TIER_STRONG}, humor:{"Absurd & Chaotic":TIER_MODERATE},
          values:{"Self-Interested":TIER_WEAK} },
    // The compliant pole had one role and one values link and nothing else — no vocab,
    // no humor, no manner. Compliance is deference in the grammar and the body too.
    neg:{ role:{"Caretaker":TIER_WEAK}, values:{"Loyalty-Bound":TIER_WEAK},
          vocab:{"Pragmatic Focus & Speech Functions":TIER_WEAK}, humor:{"Humorless & Absent":TIER_WEAK},
          manner:{"Social & Boundary Mannerisms":TIER_WEAK} }
  },
  emotionalcapacity: {
    // "Eye & Facial Expressions" is 75 traits and was the target of nothing at all.
    // It belongs on both poles of emotional capacity, because the category holds both
    // "the face shows everything" and "the face shows nothing" — which is exactly the
    // axis, played out above the neck.
    pos:{ vocab:{"Affective & Emotional Intensity":TIER_STRONG}, manner:{"Emotional Affectations":TIER_STRONG,"Eye & Facial Expressions":TIER_MODERATE}, attachment:{"Anxious":TIER_MODERATE,"Disorganized":TIER_WEAK}, humor:{"Warm & Playful":TIER_WEAK} },
    neg:{ vocab:{"Precision & Specificity Level":TIER_WEAK}, manner:{"Eye & Facial Expressions":TIER_WEAK}, attachment:{"Avoidant":TIER_STRONG}, humor:{"Dry & Deadpan":TIER_MODERATE,"Humorless & Absent":TIER_MODERATE} }
  },
  intelligence: {
    // "Semantic Density & Modifiers" (72 traits) was reachable only through the
    // verbLevel >= 1 hardcode inside boostedVocabCats, never through the matrix — so
    // no personality signal could ask for it. Density of qualification is what an
    // analytical mind does to a sentence.
    pos:{ vocab:{"Precision & Specificity Level":TIER_STRONG,"Morphological & Structural Lexicon":TIER_MODERATE,"Semantic Density & Modifiers":TIER_MODERATE}, role:{"Skeptic":TIER_STRONG}, humor:{"Dry & Deadpan":TIER_MODERATE} },
    // role and humor were pos-only. The other end of an analytical mind is one that
    // acts before it argues and laughs at the shape of a thing rather than its wording.
    neg:{ vocab:{"Directness & Literalness":TIER_WEAK,"Semantic Density & Modifiers":TIER_WEAK},
          role:{"Instigator":TIER_WEAK}, humor:{"Absurd & Chaotic":TIER_WEAK} }
  },
  positivity: {
    // Same gap on the Values side: "Idealistic & Visionary" had no inbound link at all.
    pos:{ humor:{"Warm & Playful":TIER_MODERATE}, values:{"Idealistic & Visionary":TIER_MODERATE} },
    // A pessimist lives in a spoiled past or a doomed future, rarely in the present.
    neg:{ humor:{"Humorless & Absent":TIER_MODERATE}, values:{"Pragmatic & Flexible":TIER_WEAK},
          vocab:{"Temporal Orientation & Tense Usage":TIER_MODERATE} }
  },
  activeness: {
    pos:{ manner:{"Postural & Spatial Dynamics":TIER_MODERATE,"Gestural & Kinetic Integration":TIER_MODERATE}, grammar:{"Spoken Compression":TIER_WEAK} },
    // grammar was pos-only: a sedentary character got no speech-rhythm steering.
    neg:{ manner:{"Tactile & Prop Handling":TIER_WEAK}, grammar:{"Anchors & Fillers":TIER_WEAK} }
  },
  curiosity: {
    // "Listening & Attention" was a full 24-trait mannerism category that nothing in
    // the matrix ever pointed at — it could only arrive on an unguided draw. Curiosity
    // is its most obvious upstream cause: wanting to know is what listening looks like.
    pos:{ vocab:{"Abstractness & Sensory Modality":TIER_MODERATE,"Conceptual Framework & Loanwords":TIER_MODERATE}, grammar:{"Anchors & Fillers":TIER_WEAK}, manner:{"Environmental Interaction Mannerisms":TIER_WEAK,"Listening & Attention":TIER_MODERATE} },
    // manner was pos-only. Incuriosity is a posture too — a body that has already
    // decided the room holds nothing for it.
    neg:{ vocab:{"Precision & Specificity Level":TIER_WEAK}, grammar:{"Structural Shifts":TIER_WEAK},
          manner:{"Postural & Spatial Dynamics":TIER_WEAK} }
  },

  // Voice sliders as signals in their own right, on equal footing with personality
  // axes (see VOICE_AXES / axisLevel above). Before this, moving Verbosity, Register,
  // or Composure had zero effect on which Motivation, Stress Response, Social Role,
  // Values, Attachment, Humor, or Vices category got picked — only on vocab/grammar/
  // manner. A torrentially verbose, ornately formal, highly volatile combination now
  // visibly pulls those sections too.
  verbosity: {
    pos:{ grammar:{"Anchors & Fillers":TIER_MODERATE,"Structural Shifts":TIER_WEAK}, manner:{"Physical Vocalizations & Noises":TIER_WEAK},
          role:{"Connector":TIER_MODERATE}, humor:{"Warm & Playful":TIER_WEAK}, stress:{"Fight":TIER_WEAK} },
    neg:{ grammar:{"Spoken Compression":TIER_STRONG}, role:{"Outsider":TIER_WEAK}, stress:{"Freeze":TIER_WEAK},
          humor:{"Dry & Deadpan":TIER_MODERATE}, attachment:{"Avoidant":TIER_WEAK} }
  },
  register: {
    pos:{ values:{"Rigid & Principled":TIER_MODERATE}, humor:{"Intellectual & Wordplay":TIER_MODERATE},
          vices:{"Restraint & Discipline":TIER_WEAK}, manner:{"Sartorial & Grooming Mannerisms":TIER_WEAK}, role:{"Leader":TIER_WEAK} },
    neg:{ values:{"Pragmatic & Flexible":TIER_WEAK}, stress:{"Fight":TIER_WEAK}, role:{"Instigator":TIER_WEAK},
          humor:{"Cruel & Barbed":TIER_WEAK}, vices:{"Risk & Escape":TIER_WEAK} }
  },
  composure: {
    // "Repetition & Echo Patterns" (52 traits) had no inbound link, and "Repetitive &
    // Circular" was reachable only through the one probabilistic circularOdds branch.
    // Both are what speech does when a person is looping rather than progressing,
    // which is precisely the erratic end of composure.
    pos:{ stress:{"Fight":TIER_MODERATE,"Freeze":TIER_WEAK}, attachment:{"Disorganized":TIER_STRONG},
          humor:{"Absurd & Chaotic":TIER_MODERATE}, vices:{"Substance & Consumption":TIER_WEAK,"Risk & Escape":TIER_WEAK},
          manner:{"Emotional Affectations":TIER_WEAK},
          grammar:{"Repetition & Echo Patterns":TIER_MODERATE} },
    neg:{ attachment:{"Secure":TIER_STRONG}, role:{"Peacemaker":TIER_WEAK}, values:{"Rigid & Principled":TIER_WEAK},
          vices:{"Restraint & Discipline":TIER_WEAK}, humor:{"Dry & Deadpan":TIER_WEAK} }
  },

  // Resolved profile-section categories feed forward into voice AND other profile sections.
  "role:Leader": { grammar:{"Turn-Taking Grammar":TIER_MODERATE} },
  "role:Outsider": { vocab:{"Directness & Literalness":TIER_WEAK}, humor:{"Absurd & Chaotic":TIER_WEAK} },
  "role:Caretaker": { manner:{"Social & Boundary Mannerisms":TIER_MODERATE} },
  /* Adding stress->humor links (see below) gave four of the seven humor categories a
     cascade inbound at neutral sliders and left three without one, which starved
     Intellectual & Wordplay to 9% of a seven-way split. The three that were missing get
     one here, from sections that resolve before Humor does: a skeptic's humour is
     precision, an outsider's is the wrong shape on purpose, and an idealist's is warm
     even when nothing else is. Every humor category now has somewhere to arrive from. */
  "role:Skeptic": { vocab:{"Precision & Specificity Level":TIER_MODERATE},
    humor:{"Intellectual & Wordplay":TIER_MODERATE} },
  "role:Instigator": { humor:{"Absurd & Chaotic":TIER_WEAK} },
  "role:Peacemaker": { humor:{"Warm & Playful":TIER_WEAK} },

  /* SINK-ONLY CATEGORIES. Four categories were cross-link TARGETS and never sources:
     attachment:Secure, values:Pragmatic & Flexible, humor:Self-Deprecating and
     humor:Humorless & Absent. Resolving to Secure attachment therefore influenced
     nothing downstream, while resolving to Anxious, Avoidant or Disorganized did — a
     structural thumb on the scale toward damaged characters, on top of the measured
     80/20 insecure split. A category that can be arrived at but never argued from is
     half-wired; these are the missing halves. */
  "attachment:Secure": { role:{"Leader":TIER_WEAK,"Connector":TIER_WEAK},
    grammar:{"Turn-Taking Grammar":TIER_WEAK}, humor:{"Warm & Playful":TIER_WEAK} },
  "values:Pragmatic & Flexible": { vocab:{"Pragmatic Focus & Speech Functions":TIER_WEAK},
    role:{"Connector":TIER_WEAK}, stress:{"Flight":TIER_WEAK} },
  "humor:Self-Deprecating": { manner:{"Emotional Affectations":TIER_WEAK},
    attachment:{"Anxious":TIER_WEAK} },
  "humor:Humorless & Absent": { manner:{"Eye & Facial Expressions":TIER_WEAK},
    vices:{"Restraint & Discipline":TIER_WEAK} },

  "humor:Cruel & Barbed": { vocab:{"Affective & Emotional Intensity":TIER_WEAK} },
  "humor:Warm & Playful": { vocab:{"Affective & Emotional Intensity":TIER_WEAK} },
  "humor:Dry & Deadpan": { vocab:{"Precision & Specificity Level":TIER_WEAK} },
  "humor:Absurd & Chaotic": { grammar:{"Structural Shifts":TIER_WEAK} },

  "vices:Compulsion & Ritual": { manner:{"Micro-Physical Tics":TIER_MODERATE} },
  "vices:Substance & Consumption": { manner:{"Physical Vocalizations & Noises":TIER_MODERATE} },
  "vices:Risk & Escape": { stress:{"Flight":TIER_WEAK} },
  "vices:Restraint & Discipline": { values:{"Rigid & Principled":TIER_WEAK} },

  "values:Rigid & Principled": { vocab:{"Register & Formality Spectrum":TIER_WEAK}, grammar:{"Structural Shifts":TIER_WEAK} },
  "values:Self-Interested": { vocab:{"Pragmatic Focus & Speech Functions":TIER_MODERATE} },
  "attachment:Anxious": { manner:{"Emotional Affectations":TIER_WEAK}, vocab:{"Temporal Orientation & Tense Usage":TIER_WEAK} },
  "attachment:Avoidant": { manner:{"Postural & Spatial Dynamics":TIER_WEAK} },
  "attachment:Disorganized": { grammar:{"Disfluencies & Flow":TIER_MODERATE,"Repetition & Echo Patterns":TIER_WEAK} },

  /* "Temporal Orientation & Tense Usage" (50 traits) was used by three archetypes'
     vocabPref but no axis and no resolved category pointed at it — the matrix was the
     outlier here, since AGE_RULES and CONTEXT_RULES already reference it. Grief, an
     unhealed attachment and a loyalty debt are what make a person speak about the
     present in the wrong tense; Motivation & Wound would be the most natural driver of
     all, but it is a drawAll section and so never resolves to a single category for
     the cross-link table to key on. These three do. */
  "values:Loyalty-Bound": { role:{"Caretaker":TIER_WEAK}, vocab:{"Temporal Orientation & Tense Usage":TIER_WEAK} },

  // BUG FIX: the 4 newer sub-groups (Connector, Idealistic & Visionary, Intellectual
  // & Wordplay, Avoidance & Procrastination) got PROFILE_CATEGORY_POLARITY entries
  // earlier but were never given resolved-category cross-links here — so once a
  // character actually resolved to one of them, that fact fed nothing forward into
  // vocab/grammar/manner or any other profile section, unlike every original category.
  "role:Connector": { vocab:{"Pragmatic Focus & Speech Functions":TIER_WEAK}, humor:{"Warm & Playful":TIER_WEAK} },
  "values:Idealistic & Visionary": { vocab:{"Directness & Literalness":TIER_WEAK}, grammar:{"Structural Shifts":TIER_WEAK}, humor:{"Warm & Playful":TIER_WEAK},
                                     goals:{"The Longer Aim":TIER_WEAK} },
  /* ---- Links INTO the §6 sections, so a competence, an origin or a repair style is
     nudged by the facts already resolved rather than rolled blind. Deliberately light
     (mostly WEAK): the point of these sections is to widen who a character can be,
     and a strong cascade would just re-derive the wound from the other side. */
  "attachment:Secure":        { origins:{"Stable Care":TIER_MODERATE,"Learned Trust":TIER_WEAK}, repair:{"Apology":TIER_WEAK},
                                texture:{"Preferences & Small Pleasures":TIER_WEAK} },
  "attachment:Avoidant":      { repair:{"Avoidance & Humour":TIER_MODERATE,"Restitution & Practical Care":TIER_WEAK},
                                contradiction:{"Exceptions & Detachment":TIER_WEAK} },
  "attachment:Anxious":       { repair:{"Apology":TIER_MODERATE}, origins:{"Repaired Conflict":TIER_WEAK} },
  "attachment:Disorganized":  { repair:{"Changed Boundaries & Failed Repair":TIER_MODERATE} },
  "stress:Fight (attack the threat)":   { repair:{"Changed Boundaries & Failed Repair":TIER_WEAK}, competence:{"Hands & Materials":TIER_WEAK} },
  "stress:Fawn (appease the threat)":   { repair:{"Apology":TIER_MODERATE,"Restitution & Practical Care":TIER_WEAK},
                                          contradiction:{"Protective Hypocrisy":TIER_WEAK} },
  "stress:Flight (remove yourself)":    { repair:{"Avoidance & Humour":TIER_MODERATE} },
  "stress:Freeze (shut down)":          { repair:{"Avoidance & Humour":TIER_WEAK} },
  "role:Leader":       { competence:{"Systems & Logistics":TIER_MODERATE,"People & Rooms":TIER_WEAK}, origins:{"Earned Success":TIER_WEAK} },
  "role:Caretaker":    { competence:{"People & Rooms":TIER_MODERATE}, origins:{"Stable Care":TIER_WEAK}, repair:{"Restitution & Practical Care":TIER_MODERATE} },
  "role:Skeptic":      { competence:{"Craft & Knowledge":TIER_WEAK}, contradiction:{"Aspirational Values":TIER_WEAK} },
  "role:Connector":    { competence:{"People & Rooms":TIER_MODERATE} },
  "role:Outsider":     { competence:{"Craft & Knowledge":TIER_WEAK,"Hands & Materials":TIER_WEAK} },
  "vices:Restraint & Discipline": { competence:{"Systems & Logistics":TIER_MODERATE}, contradiction:{"Aspirational Values":TIER_WEAK} },
  "vices:Compulsion & Ritual":    { texture:{"Routines":TIER_MODERATE} },
  "vices:Avoidance & Procrastination": { repair:{"Avoidance & Humour":TIER_MODERATE}, texture:{"Practised Badly":TIER_WEAK} },
  "humor:Warm & Playful":         { texture:{"Affiliations":TIER_WEAK}, repair:{"Avoidance & Humour":TIER_WEAK} },
  "humor:Absurd & Chaotic":       { texture:{"Practised Badly":TIER_WEAK} },
  "vices:Substance & Consumption": { texture:{"Preferences & Small Pleasures":TIER_WEAK} },
  "vices:Risk & Escape":          { texture:{"Practised Badly":TIER_WEAK}, origins:{"Earned Success":TIER_WEAK} },
  "humor:Self-Deprecating":       { repair:{"Avoidance & Humour":TIER_WEAK}, contradiction:{"Aspirational Values":TIER_WEAK} },
  "values:Loyalty-Bound":         { contradiction:{"Protective Hypocrisy":TIER_MODERATE}, texture:{"Affiliations":TIER_WEAK} },
  "values:Rigid & Principled":    { contradiction:{"Exceptions & Detachment":TIER_WEAK}, repair:{"Changed Boundaries & Failed Repair":TIER_WEAK} },
  "values:Self-Interested":       { goals:{"The Price & The Competing Claim":TIER_WEAK} },
  "humor:Intellectual & Wordplay": { vocab:{"Morphological & Structural Lexicon":TIER_WEAK,"Precision & Specificity Level":TIER_WEAK} },
  "vices:Avoidance & Procrastination": { grammar:{"Disfluencies & Flow":TIER_WEAK}, stress:{"Flight":TIER_WEAK} },

  // BUG FIX: these four keys previously read "stress:Fight" / "stress:Flight" / etc, but
  // WEIGHT_MATRIX lookups by resolved category are an EXACT key match (unlike the
  // personality-axis fragments above, which get substring-matched later). The actual
  // Stress Response categories carry a parenthetical suffix, so all four entries were
  // silently unreachable — never once fired — until this pass.
  // The role/values/attachment entries here are what the Under Pressure sheet resolves
  // against (see buildStressVariant): they answer "which seat do they take, and what
  // do they hold onto, once the stress response is actually running" — which is a far
  // more interesting output than "they talk faster", and the reason the pressure sheet
  // is no longer voice-only.
  /* Attachment was decided almost entirely by stress at neutral sliders, and the four
     stress responses pointed at only three of the four attachment styles: Fight and
     Freeze BOTH fed Disorganized while Secure was the target of no stress link at all.
     That is why Disorganized took 32% of a four-way split and Secure 12%. Fight moved
     onto Secure — meeting a threat head-on is at least as consistent with secure
     attachment as with disorganized, and it leaves one stress response feeding each
     style. */
  /* ...at unequal strength, which is why the split was still 80/20 insecure afterwards.
     Fawn->Anxious and Flight->Avoidant were STRONG, Freeze->Disorganized MODERATE and
     Fight->Secure only WEAK, so at neutral sliders — where these links are the ONLY
     signal in play — Secure was being argued for at a third the force of Anxious. One
     stress response feeding each attachment style is a fair split only if they pull
     equally, so all four are STRONG now. */
  /* The humor targets here are what makes Humor's inclusion in PRESSURE_SHIFT_SECTIONS
     mean anything: the pressure pass resolves each section against the stress response
     alone, so without a stress->humor link the shift had no signal to move on. Each
     stress response points somewhere different, because that is the observation — the
     warm one goes barbed, the one who leaves goes quiet, the one who freezes gets very
     dry, the one who appeases turns it on themselves. */
  "stress:Fight (attack the threat)": { vocab:{"Affective & Emotional Intensity":TIER_WEAK},
    role:{"Instigator":TIER_STRONG,"Leader":TIER_MODERATE}, values:{"Self-Interested":TIER_WEAK},
    attachment:{"Secure":TIER_STRONG}, humor:{"Cruel & Barbed":TIER_MODERATE} },
  "stress:Flight (remove yourself)": { grammar:{"Spoken Compression":TIER_WEAK},
    role:{"Outsider":TIER_STRONG}, values:{"Pragmatic & Flexible":TIER_WEAK},
    attachment:{"Avoidant":TIER_STRONG}, humor:{"Humorless & Absent":TIER_MODERATE} },
  /* Same asymmetry as attachment above, in Social Role. Flight and Freeze BOTH fed
     Outsider while Skeptic and Connector were the target of no stress link at all, so at
     neutral sliders — where stress is the only signal actually firing — Outsider took
     24% of a seven-way split and those two sat near 9%. Freeze moved onto Skeptic (a
     freeze response is watching and doubting rather than acting, which is what the
     Skeptic role describes) and Fawn gained Connector, social glue being the same
     impulse as appeasement pointed outward. Every role now has some stress inbound. */
  "stress:Freeze (shut down)": { grammar:{"Disfluencies & Flow":TIER_MODERATE},
    role:{"Skeptic":TIER_MODERATE}, values:{"Pragmatic & Flexible":TIER_WEAK},
    attachment:{"Disorganized":TIER_STRONG}, humor:{"Dry & Deadpan":TIER_MODERATE} },
  "stress:Fawn (appease the threat)": { vocab:{"Pragmatic Focus & Speech Functions":TIER_WEAK},
    role:{"Peacemaker":TIER_STRONG,"Caretaker":TIER_MODERATE,"Connector":TIER_WEAK}, values:{"Loyalty-Bound":TIER_MODERATE},
    attachment:{"Anxious":TIER_STRONG}, humor:{"Self-Deprecating":TIER_MODERATE} },
};

// Guarded: this is called from pickCategoryWeighted, which runs on every category
// draw, including from code paths that have no DOM at all (tests, and any future
// headless use). An unguarded dereference here took the whole build down.
// `parseFloat(el.value) || 0` read an emptied number field as 0, which for this dial
// means "switch off all category steering" — a silent, invisible mode change from a
// cleared input. Fall back to the default the same way intVal does.
function floatVal(idOrEl, fallback){
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return fallback;
  const n = parseFloat(el.value);
  return Number.isFinite(n) ? n : fallback;
}
/* The string and boolean siblings of intVal/floatVal, plus the three write helpers.
   Reading `document.getElementById('rarityPref').value` straight through is scattered
   across all four files, and about half the sites already guard it — reapplyConstraints-
   AfterMutation guards the exact read that adjustPin, rerollSlot and generateCharacter
   do bare, three lines away. In a browser with the full index.html these never fire,
   which is why they survived; the moment the app is embedded in a trimmed page, or a
   panel is removed, or the file is loaded under test, they throw. togglePersonalityPanel
   did exactly that as soon as js/app.js was brought under test coverage. */
function strVal(idOrEl, fallback){
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  return el && el.value != null ? el.value : fallback;
}
function boolVal(idOrEl, fallback){
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  return el ? !!el.checked : fallback;
}
function setVal(id, v){ const el = document.getElementById(id); if (el) el.value = v; return el; }
function setText(id, v){ const el = document.getElementById(id); if (el) el.textContent = v; return el; }
function setHTML(id, v){ const el = document.getElementById(id); if (el) el.innerHTML = v; return el; }
// The rarity preference is read on nearly every draw path; one name for it.
function rarityPrefVal(){ return strVal('rarityPref', 'balanced'); }

function AFFINITY(){ return floatVal('affinityBoost', 2.5); }

function persLevel(id, overrides){
  const raw = (overrides && overrides[id] !== undefined) ? overrides[id] : (()=>{
    return intVal('pers_'+id, 0);
  })();
  return rawToLevel(raw);
}
function personalitySignals(overrides){
  const out = {};
  PERSONALITY_AXES.forEach(a=> out[a.id] = persLevel(a.id, overrides));
  return out;
}

// Walks every active signal (13 personality axes + any already-resolved profile categories)
// and sums matrix weights into a fragment->strength map for the requested "kind".
// ---------- Pick provenance ("why did I get this?") ----------------------
// Mirrors accumulateBoost, but keeps WHO contributed instead of only the total.
// Used purely for explanation, never for generation, so it can't skew results.
function attributedBoost(kind, profileCats, overrides){
  const contribs = new Map(); // categoryFragment -> [{source, amount}]
  const push = (frag, s, source) => {
    if(!frag || s<=0) return;
    if(!contribs.has(frag)) contribs.set(frag, []);
    contribs.get(frag).push({source, amount:s});
  };
  // SIGNAL_AXES = personality axes + voice axes (verbosity/register/composure) — see
  // VOICE_AXES above. Previously only personality drove this; voice sliders now
  // contribute exactly the same way, through the same matrix.
  SIGNAL_AXES.forEach(a=>{
    const entry = WEIGHT_MATRIX[a.id];
    if (!entry) return;
    const level = axisLevel(a.id, overrides);
    const dirMap = (level >= 0 ? entry.pos : entry.neg) || {};
    const kindMap = dirMap[kind];
    if (!kindMap) return;
    const strength = strengthFromLevel(level);
    if (strength <= 0) return;
    const dirLabel = level >= 0 ? "high" : "low";
    Object.entries(kindMap).forEach(([frag,w]) => push(frag, w*strength, `${dirLabel} ${a.label}`));
  });
  if (profileCats){
    Object.entries(profileCats).forEach(([sectionId,cat])=>{
      if (!cat) return;
      const entry = WEIGHT_MATRIX[sectionId+':'+cat];
      if (!entry) return;
      const kindMap = entry[kind];
      if (!kindMap) return;
      Object.entries(kindMap).forEach(([frag,w]) => push(frag, w, `${cat}`));
    });
  }
  return contribs;
}

// Human-readable rendering of a trait's own pol vector, e.g. "agreeableness +1, emotional openness +1".
function polVectorDesc(pol){
  return Object.entries(pol).map(([k,v])=> `${AXIS_LABELS[k]||k} ${v>0?'+':''}${v}`).join(", ");
}

// Returns a factual sentence about the trait/vector interaction only when this trait
// actually carries polarity and the boost dial is on — never manufactures a claim for
// vocab/grammar/mannerism traits, which are deliberately untagged.
function polFitNote(t){
  const aff = affinityStrength();
  if (aff <= 0 || !t.pol || !Object.keys(t.pol).length) return "";
  const vec = liveAxisVector(null); // fresh read of current sliders, not a stale generation snapshot
  const fit = polarityFit(t, vec);
  if (!fit) return "";
  const pct = Math.round(Math.abs(aff*fit)*100);
  return ` Its own polarity (${polVectorDesc(t.pol)}) currently <b>${fit>0?"agrees with":"runs against"}</b> your slider posture, which ${fit>0?"boosted":"suppressed"} its odds here by roughly ${pct}%.`;
}

// Returns a short human sentence explaining why this slot landed where it did.
/* The comment on rangeSelect has always claimed `widened` is "surfaced in the UI so a
   sparse category is visible as a data gap rather than silently behaving like a loose
   one". It never was — nothing read the flag. Now that rangeSelect also reports when it
   had to CLAMP a target into the pool's span, both facts matter enough to say out loud:
   a clamped target means the pool has no content at the intensity you asked for, and
   the honest response is to show that rather than to quietly serve the nearest thing.

   Recomputed here rather than threaded through every pick site: the slot already knows
   its pool and its target, so this is the same question asked again, not a second
   source of truth. */
function dataGapNote(s){
  if (!s || !s.trait || s.target === undefined || s.target === null) return "";
  const pool = byFilter(s.trait.section, s.trait.category);
  if (pool.length < 2) return "";
  const sel = rangeSelect(pool, s.target, 4);
  if (!sel.clamped && !sel.widened) return "";
  const bits = [];
  if (sel.clamped){
    let lo = Infinity, hi = -Infinity;
    pool.forEach(t=>{ const p = traitPos(t); if(p<lo)lo=p; if(p>hi)hi=p; });
    const edge = s.target < lo ? `floor of ${lo.toFixed(2)}` : `ceiling of ${hi.toFixed(2)}`;
    bits.push(`your target of <b>${s.target.toFixed(2)}</b> is outside this category's ${edge}, so the draw was clamped to the nearest end`);
  }
  if (sel.widened) bits.push(`the eligible band had to be widened to find enough candidates`);
  return `<div class="whyExcl"><b>Data gap.</b> ${bits.join(", and ")}. This category is thin at the intensity you asked for — the pick is the closest available, not an exact match.</div>`;
}

function explainPick(slotId, s){
  const gap = dataGapNote(s);
  return gap + _explainPickInner(slotId, s);
}

function _explainPickInner(slotId, s){
  if (!s || !s.trait) return "";
  const cat = s.trait.category;
  const currentProfileCats = {};
  // slotCat: prof_ slots can hold trait:null, same guard as everywhere else.
  PROFILE_SECTIONS.forEach(ps=>{ const c = slotCat(state["prof_"+ps.id+"_0"]); if (c) currentProfileCats[ps.id] = c; });

  const pinNote = pinnedTargets[slotId] !== undefined
    ? `<div class="whyExcl" style="border-left-color:var(--golden-deep); background:rgba(184,134,11,.08);"><b>Pinned</b> at intensity <b>${pinnedTargets[slotId].toFixed(1)}</b> — this overrides whatever the sliders below would otherwise target. Unpin to let it follow them again.</div>`
    : ``;
  const polNote = polFitNote(s.trait);
  const vLabel = variantLabelFor(s.trait.category);
  const variantNote = vLabel
    ? `<div class="whyExcl" style="border-left-color:var(--dusk-blue); background:rgba(74,107,138,.08);">This category covers two different presentations of the same pole. This character is locked to <b>${vLabel}</b>, so the sheet stays coherent instead of mixing them.</div>`
    : ``;

  // Personality slots map 1:1 to their own slider — no matrix needed.
  const bandNote = (t, target) => {
    const [lo,hi] = traitBand(t);
    return ` It sits at continuous position <b>${traitPos(t).toFixed(2)}</b> on the 1–5 intensity scale${target!==undefined?`, against a target of <b>${target.toFixed(2)}</b>`:``}, so it is only ever drawn while that slider's magnitude is between <b>${lo}</b> and <b>${hi}</b>.`;
  };

  if (slotId.startsWith("pers_")){
    const axisId = slotId.replace("pers_","").replace(/__2$/,"");
    const axis = PERSONALITY_AXES.find(a=>a.id===axisId);
    const el = document.getElementById('pers_'+axisId);
    const raw = intVal(el, 0);
    const side = raw >= 0 ? "positive" : "negative";
    const target = targetFromMag(Math.abs(raw));
    return pinNote + variantNote + `Driven directly by your <b>${axis?axis.label:axisId}</b> slider at <b>${raw}</b>, which selects the ${side} pool ("${cat}") and sets a continuous intensity target of <b>${target.toFixed(2)}</b>.${bandNote(s.trait, target)}${polNote}`;
  }

  // Voice + profile slots come from the weight matrix.
  let kind = null;
  if (slotId.startsWith("vocab")) kind = "vocab";
  else if (slotId === "grammar") kind = "grammar";
  else if (slotId.startsWith("manner")) kind = "manner";
  else if (slotId.startsWith("prof_")) kind = s.sectionId || null;

  if (slotId === "verbosity" || slotId === "register"){
    const sliderId = slotId === "verbosity" ? 'verbositySlider' : 'registerSlider';
    const el = document.getElementById(sliderId);
    const raw = intVal(el, 0);
    return pinNote + `Set by your <b>${slotId === "verbosity" ? "Verbosity" : "Register"}</b> slider at <b>${raw}</b>, which chooses the "${cat}" pool.${bandNote(s.trait, s.target)}${polNote}`;
  }

  if (!kind) return pinNote + `Drawn from "${cat}".${polNote}`;

  const contribs = attributedBoost(kind, currentProfileCats);
  // find which fragments actually match this category
  const matched = [];
  contribs.forEach((list, frag)=>{
    if (cat.toLowerCase().includes(frag.toLowerCase())) matched.push(...list);
  });
  if (!matched.length){
    return pinNote + `No active slider or resolved trait points at "${cat}" — this one came up on an unsteered draw at mid intensity. That's normal: not every slot is driven.${bandNote(s.trait, s.target)}${polNote}`;
  }
  const bySource = new Map();
  matched.forEach(({source,amount})=> bySource.set(source, (bySource.get(source)||0)+amount));
  const ranked = [...bySource.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3)
    .map(([src,amt])=>`${src}`);
  const lead = ranked.length === 1 ? ranked[0] : ranked.slice(0,-1).join(", ") + " and " + ranked[ranked.length-1];
  return pinNote + `"${cat}" was favoured here by <b>${lead}</b>${bySource.size>3?`, plus ${bySource.size-3} weaker signal${bySource.size-3>1?"s":""}`:""}. The combined strength of those signals set the intensity target, and the trait was drawn from inside that window.${bandNote(s.trait, s.target)}${polNote}`;
}

/* How hard an already-resolved profile fact constrains the ones resolved after it.
   1.0 restores the old behaviour (a resolved fact outweighs the baseline 7.25 : 1);
   0 makes sections independent. 0.45 keeps the correlations legible in the output
   while leaving room for a neutral roll to land somewhere the cascade didn't choose. */
const CROSSLINK_STRENGTH = 0.45;

/* ================= MOTIVATION & WOUND — THE CROSS-LINKS IT NEVER HAD ==========
   The section the sheet leads with, that draws on every character, that supplies the
   pressure trigger, participated in the weight matrix in NEITHER direction: not one of
   its seven categories was a WEIGHT_MATRIX target, none had a DEPTH_TO_PERSONALITY
   entry, and it was excluded from WILDCARD_SECTIONS and PRESSURE_SHIFT_SECTIONS. Its
   entire outbound influence was one hardcoded link, wound intensity -> Distinguishing
   Marks target.

   The reason is real but it is an implementation constraint, not a design decision:
   Motivation is drawAll:true, so it never resolves to a single category the cross-link
   table can key on. A wound of "Betrayed by kin" should pull Attachment toward Avoidant
   and Values toward Loyalty-Bound, and there was no mechanism by which it could.

   So key on the drawn TRAIT rather than on the category. The signal is already being
   extracted — MOTIVATION_POLARITY_RULES reads exactly these keywords off the same text
   to derive polarity — it simply had nowhere to go afterwards. Same fragment-map
   contract accumulateBoost already speaks, so everything downstream (bans, tiers,
   coherence scoring, the why-this-category explanations) works unchanged.

   Scaled by CROSSLINK_STRENGTH like every other resolved-fact link, for the reason
   given there: a wound should colour what follows, not decide it. */
const MOTIVATION_CROSSLINKS = [
  [/betray|broken promise|exploited|deceived|trust.{0,15}wrong|blame|took the fall/i,
   {attachment:{"Avoidant":TIER_MODERATE,"Disorganized":TIER_WEAK}, values:{"Loyalty-Bound":TIER_STRONG},
    role:{"Skeptic":TIER_MODERATE}, stress:{"Fight":TIER_WEAK}}],
  [/abandon|left behind|replaced|nobody stays|losing the last one|empty rooms|permanently alone/i,
   {attachment:{"Anxious":TIER_STRONG}, role:{"Connector":TIER_MODERATE}, humor:{"Self-Deprecating":TIER_WEAK}}],
  [/intimacy|dependence|needing anyone|genuinely known|being known/i,
   {attachment:{"Avoidant":TIER_STRONG}, humor:{"Dry & Deadpan":TIER_MODERATE},
    manner:{"Social & Boundary Mannerisms":TIER_WEAK}}],
  [/humiliat|brought low|named.unworthy|declared unfit|shamed|publicly/i,
   {stress:{"Fight":TIER_MODERATE,"Flight":TIER_WEAK}, role:{"Outsider":TIER_MODERATE},
    vocab:{"Register & Formality Spectrum":TIER_WEAK}}],
  [/\bpower\b|leverage|control prevents|only safety|real strength means no help|powerless/i,
   {role:{"Leader":TIER_STRONG}, stress:{"Fight":TIER_MODERATE}, values:{"Self-Interested":TIER_WEAK},
    grammar:{"Turn-Taking Grammar":TIER_MODERATE}}],
  [/\bsafety\b|structure and control|losing control|nothing can reach them|\bchaos\b/i,
   {vices:{"Compulsion & Ritual":TIER_STRONG,"Restraint & Discipline":TIER_MODERATE},
    values:{"Rigid & Principled":TIER_MODERATE}}],
  [/\bfreedom\b|answerable to nobody|independence|no masters|rigged|effort is pointless/i,
   {role:{"Outsider":TIER_MODERATE}, vices:{"Risk & Escape":TIER_STRONG},
    humor:{"Absurd & Chaotic":TIER_WEAK}}],
  [/\btruth\b|fair hearing|actually happened|being.believed|honesty|being wrong/i,
   {values:{"Rigid & Principled":TIER_STRONG}, vocab:{"Directness & Literalness":TIER_MODERATE},
    role:{"Skeptic":TIER_MODERATE}}],
  [/recognition|\blegacy\b|vindicat|proving.wrong|place in history|insignifican|leaving no trace|being ordinary|forgotten/i,
   {role:{"Leader":TIER_MODERATE}, values:{"Idealistic & Visionary":TIER_MODERATE},
    vocab:{"Semantic Density & Modifiers":TIER_WEAK}}],
  [/belonging|reunion|community.standing|restored.family|quiet.partnership|place where they/i,
   {role:{"Connector":TIER_STRONG,"Caretaker":TIER_MODERATE}, attachment:{"Secure":TIER_STRONG},
    humor:{"Warm & Playful":TIER_MODERATE}}],
  [/redemption|amends|clean conscience|balance a debt|forgive|undoing.a.mistake|fix one past error/i,
   {values:{"Rigid & Principled":TIER_MODERATE}, role:{"Caretaker":TIER_MODERATE},
    stress:{"Fawn":TIER_WEAK}, attachment:{"Secure":TIER_MODERATE}}],
  [/conditional love|only.worth|must be useful|worth is conditional|becoming a burden|\bowe\b|service/i,
   {stress:{"Fawn":TIER_STRONG}, role:{"Caretaker":TIER_STRONG}, attachment:{"Anxious":TIER_MODERATE}}],
  [/hide what.{0,15}feel|silence is strength|showing feeling|exposure|\bfraud\b|specific vulnerability/i,
   {humor:{"Dry & Deadpan":TIER_MODERATE}, attachment:{"Avoidant":TIER_MODERATE},
    stress:{"Freeze":TIER_WEAK}, grammar:{"Spoken Compression":TIER_WEAK}}],
  [/\bperfect\b|no mistakes|flawlessness|mastery|undeniably excellent|best at|proving.capability/i,
   {vices:{"Restraint & Discipline":TIER_STRONG}, values:{"Rigid & Principled":TIER_MODERATE},
    vocab:{"Precision & Specificity Level":TIER_MODERATE}}],
  [/failed to save|couldn't stop it|survived what others|alive by accident|harmed by a protector/i,
   {stress:{"Freeze":TIER_MODERATE}, attachment:{"Disorganized":TIER_MODERATE},
    vices:{"Substance & Consumption":TIER_WEAK}, humor:{"Humorless & Absent":TIER_WEAK}}],
  [/\bescape\b|isolat|genuinely alone|apart from|silence keeps|exiled|cast out/i,
   {role:{"Outsider":TIER_STRONG}, stress:{"Flight":TIER_MODERATE},
    vices:{"Avoidance & Procrastination":TIER_WEAK}}],
  [/stagnation|irrelevance|outliving|no longer need|lost faith|belief system collapsed/i,
   {humor:{"Humorless & Absent":TIER_MODERATE}, values:{"Pragmatic & Flexible":TIER_WEAK},
    role:{"Skeptic":TIER_WEAK}}],
  [/becoming.{0,15}them\b|repeat.*history|repeating on them|becoming their parent/i,
   {vices:{"Restraint & Discipline":TIER_MODERATE}, attachment:{"Disorganized":TIER_WEAK},
    stress:{"Freeze":TIER_WEAK}}],
  [/\bcomfort\b|end to struggle|quiet ending|simple.normalcy|mild preference/i,
   {role:{"Peacemaker":TIER_MODERATE}, vices:{"Avoidance & Procrastination":TIER_MODERATE},
    humor:{"Warm & Playful":TIER_WEAK}}],
  [/vengeance|suffer a specific consequence|specific person to suffer/i,
   {humor:{"Cruel & Barbed":TIER_STRONG}, stress:{"Fight":TIER_STRONG}, values:{"Loyalty-Bound":TIER_WEAK}}],
  [/protection of another|kept safe above|justice for another|harming others|what they might do/i,
   {role:{"Caretaker":TIER_STRONG}, values:{"Loyalty-Bound":TIER_MODERATE},
    stress:{"Fight":TIER_WEAK}}],
  /* Second block, written against the entries the first still missed. Between them these
     now reach a bit over half the section; the remainder are the intensity-scale entries
     ("A small old hurt", "A defining, unhealed wound") which say how much rather than
     what, and correctly pull nothing. */
  [/restoration|put back something|taken or broken|home destroyed|place that defined them/i,
   {values:{"Loyalty-Bound":TIER_MODERATE}, role:{"Caretaker":TIER_WEAK},
    vices:{"Compulsion & Ritual":TIER_WEAK}}],
  [/purpose|mean something specific|worthy death|being chosen|selected, not merely tolerated/i,
   {values:{"Idealistic & Visionary":TIER_STRONG}, role:{"Leader":TIER_WEAK}}],
  [/fear of loss|losing what they've built|fear of failure|falling short|public failure|failing where everyone/i,
   {vices:{"Restraint & Discipline":TIER_MODERATE}, stress:{"Freeze":TIER_WEAK},
    attachment:{"Anxious":TIER_WEAK}}],
  [/chronically overlooked|grew up invisible|silenced when it mattered|prevented from speaking/i,
   {role:{"Outsider":TIER_MODERATE}, grammar:{"Turn Taking Grammar":TIER_WEAK},
    humor:{"Dry & Deadpan":TIER_WEAK}}],
  [/poverty|formative deprivation|financial independence|earn rest|paid for with excessive labor/i,
   {vices:{"Restraint & Discipline":TIER_STRONG}, values:{"Pragmatic & Flexible":TIER_MODERATE}}],
  [/talent squandered|was capable and was prevented|wasted potential/i,
   {humor:{"Cruel & Barbed":TIER_WEAK}, role:{"Skeptic":TIER_MODERATE},
    values:{"Idealistic & Visionary":TIER_WEAK}}],
  [/ruin what i touch|inherently destructive|ruin good things by wanting|desire itself/i,
   {attachment:{"Avoidant":TIER_MODERATE}, vices:{"Avoidance & Procrastination":TIER_MODERATE},
    humor:{"Self-Deprecating":TIER_MODERATE}}],
  [/don't deserve good things|happiness is for other people|my fault|caused a harm they didn't/i,
   {humor:{"Self-Deprecating":TIER_STRONG}, stress:{"Fawn":TIER_MODERATE}}],
  [/unlovable|affection shown to them is a mistake|love always has a price|never freely given|only transacted/i,
   {attachment:{"Avoidant":TIER_MODERATE,"Anxious":TIER_MODERATE}, values:{"Self-Interested":TIER_WEAK}}],
  [/must not want|desire itself is dangerous|quiet ending|final chapter to be peaceful/i,
   {vices:{"Restraint & Discipline":TIER_MODERATE}, role:{"Peacemaker":TIER_MODERATE},
    attachment:{"Secure":TIER_MODERATE}}],
  [/disappointing a mentor|letting down the one person|promise broken by them|broke a vow|never forgave themselves/i,
   {values:{"Rigid & Principled":TIER_MODERATE}, stress:{"Fawn":TIER_WEAK},
    attachment:{"Anxious":TIER_WEAK}}],
  [/survived what took someone|took someone they loved instead|childhood cut short|adult responsibility far too young/i,
   {role:{"Caretaker":TIER_STRONG}, stress:{"Freeze":TIER_WEAK}, humor:{"Humorless & Absent":TIER_WEAK}}],
  [/loved someone who couldn't love back|incapable of returning it/i,
   {attachment:{"Anxious":TIER_STRONG}, humor:{"Self-Deprecating":TIER_MODERATE}}],
  [/my anger protects|rage is what keeps loved ones safe|kindness is a weakness|gentleness inevitably gets used/i,
   {stress:{"Fight":TIER_STRONG}, humor:{"Cruel & Barbed":TIER_MODERATE}, values:{"Loyalty-Bound":TIER_MODERATE}}],
  [/nobody actually changes|people are fixed|improvement is an illusion|fundamentally different from others|outside normal human connection/i,
   {role:{"Outsider":TIER_STRONG,"Skeptic":TIER_MODERATE}, humor:{"Humorless & Absent":TIER_WEAK}}],
];

/* Reads the cross-link fragments off whatever Motivation traits a build has seated.
   Returns the same {kind -> Map(fragment -> weight)} shape accumulateBoost builds, so
   the two merge without either knowing about the other. */
function motivationCrosslinkMap(motivationTraits){
  const out = {};
  if (!motivationTraits || !motivationTraits.length) return out;
  const seen = new Set();
  let peak = 0;
  motivationTraits.forEach(t=>{
    if (!t) return;
    const text = motivationText(t);
    /* A life-defining wound should pull harder than a small old hurt. The intensity is
       already on the trait and said nothing to anything outside its own card. */
    const weight = clamp((t.intensity || 3) / 3, 0.4, 1.6);
    MOTIVATION_CROSSLINKS.forEach(([re, kinds], ruleIdx)=>{
      if (!re.test(text)) return;
      /* A rule fires once per build however many of the seven categories match it.
         Without this, a character whose Want, Fear, Wound AND Lie all circle the same
         theme — which is exactly what a coherent character looks like — would apply the
         same link four times over and swamp everything else on the sheet. */
      if (seen.has(ruleIdx)) return;
      seen.add(ruleIdx);
      Object.entries(kinds).forEach(([kind, frags])=>{
        if (!out[kind]) out[kind] = new Map();
        const m = out[kind];
        Object.entries(frags).forEach(([frag, w])=>{
          const v = (m.get(frag) || 0) + w * weight;
          m.set(frag, v);
          if (v > peak) peak = v;
        });
      });
    });
  });
  /* ONE VOTE, NOT EIGHT. Motivation draws a trait from every one of its seven
     categories on every sheet, so several different rules fire on a single build as a
     matter of course — and unscaled that made this section the loudest voice on a
     neutral sheet, which is precisely the bug CROSSLINK_STRENGTH was introduced to fix
     for the resolved-category links (measured here as Leader taking 28% of a seven-way
     Social Role split with every slider centred).

     The section is entitled to a strong pull, not to an unbounded one. Normalise the
     whole map so its single loudest fragment lands at exactly the strength of one
     STRONG cross-link; the relative shape of what the wound is pointing at survives
     intact, and it can no longer outvote the rest of the sheet by sheer arithmetic. */
  if (peak > 0){
    const scale = (TIER_STRONG * CROSSLINK_STRENGTH) / peak;
    Object.values(out).forEach(m => m.forEach((w, frag)=> m.set(frag, w * scale)));
  }
  return out;
}

// Set for the duration of one build, once the Motivation traits are drawn, so every
// later accumulateBoost call in that build can see them. Cleared per build.
let CURRENT_MOTIVATION_LINKS = {};
function setMotivationLinks(map){ CURRENT_MOTIVATION_LINKS = map || {}; }

/* ARCHETYPE PROFILE HINTS. Archetypes set personality axes and the three voice
   postures and nothing else, so an archetype could never say "this character is
   Avoidant" — the seven profile sections were reachable only through whatever the
   personality axes happened to imply. That is a real gap: half of what a preset like
   "Wounded Soldier" or "Grieving Parent" means IS its attachment and stress shape, and
   the 34 presets are the app's cheapest lever on the profile distributions.

   A hint is a nudge, not a setting — deliberately, and consistently with how the rest
   of the archetype blends (0.35/0.65 against your sliders rather than replacing them).
   It enters through the same boost map every other signal uses, at the strength of one
   STRONG link, so the dice and your own settings can still take the character
   somewhere else. An explicit type_<section> choice still wins outright, because that
   short-circuits before any boost is consulted. */
let CURRENT_ARCHETYPE_PROFILE = null;
function setArchetypeProfile(map){ CURRENT_ARCHETYPE_PROFILE = map || null; }
function withArchetypeProfile(map, fn){
  const prev = CURRENT_ARCHETYPE_PROFILE;
  CURRENT_ARCHETYPE_PROFILE = map || null;
  try { return fn(); }
  finally { CURRENT_ARCHETYPE_PROFILE = prev; }
}

function accumulateBoost(kind, profileCats, overrides){
  const m = new Map();
  const add = (frag, s) => { if(!frag || s<=0) return; m.set(frag, (m.get(frag)||0) + s); };
  // See ARCHETYPE PROFILE HINTS above. One entry, at one STRONG link's worth of pull.
  if (CURRENT_ARCHETYPE_PROFILE && CURRENT_ARCHETYPE_PROFILE[kind]){
    add(CURRENT_ARCHETYPE_PROFILE[kind], TIER_STRONG);
  }
  SIGNAL_AXES.forEach(a=>{
    const entry = WEIGHT_MATRIX[a.id];
    if (!entry) return;
    const level = axisLevel(a.id, overrides);
    const dirMap = (level >= 0 ? entry.pos : entry.neg) || {};
    const kindMap = dirMap[kind];
    if (!kindMap) return;
    const strength = strengthFromLevel(level);
    if (strength <= 0) return;
    Object.entries(kindMap).forEach(([frag,w]) => add(frag, w*strength));
  });
  if (profileCats){
    /* CROSS-LINK SCALING. Axis contributions above are multiplied by
       strengthFromLevel(level), so a centred slider contributes nothing — that is what
       makes "neutral" mean neutral. Resolved-category cross-links were added at full
       declared weight instead, and since sections resolve in sequence, at neutral
       sliders this cascade was the ONLY signal in play and therefore decided the whole
       character. Measured over 400 neutral characters: Outsider took 29% of Social Role
       against a uniform 14%, and Disorganized 32% of Attachment against 25%, purely
       because stress:Flight -> role:Outsider and stress:Freeze -> attachment:Disorganized
       fire unconditionally. A STRONG cross-link outweighed the baseline 7.25 : 1.

       These links are real and should still pull; they just should not be the loudest
       voice in a room where nobody has spoken. Scale them so a resolved fact nudges
       what follows rather than dictating it. */
    Object.entries(profileCats).forEach(([sectionId,cat])=>{
      if (!cat) return;
      const entry = WEIGHT_MATRIX[sectionId+':'+cat];
      if (!entry) return;
      const kindMap = entry[kind];
      if (!kindMap) return;
      Object.entries(kindMap).forEach(([frag,w]) => add(frag, w * CROSSLINK_STRENGTH));
    });
  }
  // Motivation & Wound's contribution, keyed on the drawn traits' own keywords rather
  // than on a resolved category it does not have. See MOTIVATION_CROSSLINKS above.
  const motiv = CURRENT_MOTIVATION_LINKS[kind];
  if (motiv) motiv.forEach((w, frag)=> add(frag, w));
  return m;
}
// Converts a fragment->strength map into a real category->weight map via substring match.
function resolveBoostMapForCats(cats, fragMap){
  const m = new Map();
  cats.forEach(c=>{
    let total = 0;
    fragMap.forEach((w, frag)=>{ if (c.toLowerCase().includes(frag.toLowerCase())) total += w; });
    if (total > 0) m.set(c, total);
  });
  return m;
}

function boostedGrammarCats(verbLevel, compLevel, regLevel, profileCats, overrides){
  const m = new Map();
  const add = (c,s) => m.set(c, Math.max(m.get(c)||0, s));
  if (verbLevel >= 1) { add("Anchors & Fillers", strengthFromLevel(verbLevel)); add("Turn-Taking Grammar", strengthFromLevel(verbLevel)); }
  if (verbLevel <= -1) { add("Spoken Compression", strengthFromLevel(verbLevel)); }
  if (compLevel >= 1) { add("Disfluencies & Flow", strengthFromLevel(compLevel)); }
  if (compLevel <= -1) { add("Structural Shifts", strengthFromLevel(compLevel)); add("Turn-Taking Grammar", strengthFromLevel(compLevel)); }
  if (regLevel >= 1) { add("Structural Shifts", strengthFromLevel(regLevel)); }
  const extra = resolveBoostMapForCats(GRAMMAR_CATS, accumulateBoost('grammar', profileCats, overrides));
  extra.forEach((v,k)=> m.set(k, Math.max(m.get(k)||0, v)));
  return m;
}
function boostedVocabCats(verbLevel, regLevel, profileCats, overrides){
  const m = new Map();
  const add = (c,s) => m.set(c, Math.max(m.get(c)||0, s));
  if (verbLevel >= 1) { add("Semantic Density & Modifiers", strengthFromLevel(verbLevel)); add("Pragmatic Focus & Speech Functions", strengthFromLevel(verbLevel)); }
  if (verbLevel <= -1) { add("Precision & Specificity Level", strengthFromLevel(verbLevel)); add("Directness & Literalness", strengthFromLevel(verbLevel)); }
  if (regLevel >= 1) { add("Morphological & Structural Lexicon", strengthFromLevel(regLevel)); add("Phonetic & Auditory Qualities", strengthFromLevel(regLevel)); add("Register & Formality Spectrum", strengthFromLevel(regLevel)); }
  if (regLevel <= -1) { add("Directness & Literalness", strengthFromLevel(regLevel)); add("Register & Formality Spectrum", strengthFromLevel(regLevel)); }
  const extra = resolveBoostMapForCats(VOCAB_CATS, accumulateBoost('vocab', profileCats, overrides));
  extra.forEach((v,k)=> m.set(k, Math.max(m.get(k)||0, v)));
  return m;
}
function boostedMannerCats(compLevel, regLevel, profileCats, overrides){
  const m = new Map();
  const add = (c,s) => m.set(c, Math.max(m.get(c)||0, s));
  if (compLevel >= 1) VOLATILE_MANNER_CATS.forEach(c=>add(c, strengthFromLevel(compLevel)));
  if (compLevel <= -1) CALM_MANNER_CATS.forEach(c=>add(c, strengthFromLevel(compLevel)));
  if (regLevel >= 1) { add("Social & Boundary Mannerisms", strengthFromLevel(regLevel)); add("Vocal Modulation Mannerisms", strengthFromLevel(regLevel)); }
  const extra = resolveBoostMapForCats(MANNER_CATS, accumulateBoost('manner', profileCats, overrides));
  extra.forEach((v,k)=> m.set(k, Math.max(m.get(k)||0, v)));
  return m;
}

// ---------- Weighted random helpers ----------

// Normalizing by each rarity class's size WITHIN THE POOL BEING DRAWN FROM makes
// "Balanced" mean an even split across the classes regardless of how a particular
// category happens to be composed, and makes the two preferences symmetric around that
// (3:1 either way). Per-pool rather than per-bank matters: individual categories differ
// a lot from the global mix, so a single global divisor over- or under-corrects
// depending on which category is being sampled.
/* ================= FOUR AUTHORED RARITY TIERS =================
   This used to be three tiers DERIVED from (rarity, intensity):

     rarityTier(t) = t.rarity !== "signature" ? "common"
                   : t.intensity >= 4 ? "signature" : "distinctive"

   which made rarity a pure function of loudness. Because the personality sliders set
   the intensity target and the target gates eligibility, rarity tier was downstream of
   slider position: measured over 150 characters per cell, pushing the rarity dial from
   one end to the other at neutral sliders moved the signature share only from 0.7% to
   4.6%, against a bank where signature was 16.5% of the entries. The dial's top third
   was inert unless the personality sliders were also pushed hard, and nothing said so.
   The case a writer reaches for most often — "an ordinary person with one startling
   verbal habit" — was not expressible at all, because quiet sliders made the startling
   habit unreachable.

   Rarity is now an AUTHORED field on every trait, and the two questions are finally
   orthogonal:

     rarity    how many people are like this
     intensity how loudly it shows

     common       Ordinary human behaviour. Texture, not identity.
     uncommon     Noticeable. Not everyone does this, but nobody would remark on it.
     distinctive  Specific enough that a reader would remember it about this character.
     signature    Defines the voice. Two of these is a caricature.

   The data files were migrated once (see the migration note in the README): declared
   "common" split by intensity into common/uncommon, and the 4,742-entry declared
   "signature" class — which carried almost no information at 67% of the bank — split
   into signature (i4+), distinctive (i3) and uncommon (i1-2). From here rarity is
   plain data and can be corrected trait by trait without a code change. */
const RTIER_ORDER = ["common","uncommon","distinctive","signature"];
const RTIER_SET = new Set(RTIER_ORDER);
function rarityTier(t){ return RTIER_SET.has(t.rarity) ? t.rarity : "common"; }
(function tagRarityTiers(){ TRAITS.forEach(t=>{ t.rtier = rarityTier(t); }); })();
// Evenly spaced across the four tiers, so the preference dial moves the same distance
// per step and the two middle tiers are genuinely intermediate rather than one of them
// sitting neutrally at zero.
const RTIER_SCORE = {common:-1, uncommon:-0.33, distinctive:0.33, signature:1};

// Rarity preference is continuous now (-1 = only the ordinary, +1 = only the loud and
// specific), matching how every other dial in the app works. The three legacy string
// values are still accepted so saved preferences, exported characters, and the cast
// builder keep working without a migration.
function rarityPrefValue(pref){
  if (typeof pref === 'number') return clamp(pref, -1, 1);
  // The four tier names double as preference values, so "give me uncommon material"
  // is expressible by name as well as by dial position.
  if (RTIER_SCORE[pref] !== undefined) return RTIER_SCORE[pref];
  if (pref === 'balanced' || pref === undefined || pref === null || pref === '') return 0;
  const n = parseFloat(pref);
  return Number.isNaN(n) ? 0 : clamp(n, -1, 1);
}
function rarityNorm(list){
  const counts = {};
  for (const t of list) counts[t.rtier || rarityTier(t)] = (counts[t.rtier || rarityTier(t)]||0) + 1;
  return counts;
}
/* How hard the per-pool class equalisation pulls. 1 = full equalisation (every rarity
   class gets exactly the same total weight); 0 = none (flat per-trait weighting).

   It used to be a hard 1, which is right on a large, evenly-composed pool and
   pathological on a small lopsided one: "The Defence" holds 20 traits split 11
   signature / 7 distinctive / 2 uncommon, and full equalisation hands each of those
   two uncommon traits five and a half times an average signature trait's weight. One
   of them, "Mild, unfailing agreeableness", was landing in 89 of 300 default
   characters against a uniform expectation of 15.

   sqrt damping keeps the correction that matters — a class is no longer drawn in
   proportion to how much of it someone happened to author — without letting a
   two-member class in a twenty-trait pool outweigh an eleven-member one. The thin
   classes are still lifted, just not to the point of dominating. */
const RARITY_NORM_EXP = 0.5;
function rarityWeight(t, pref, norm){
  const tier = t.rtier || rarityTier(t);
  const base = (norm && norm[tier]) ? 1 / Math.pow(norm[tier], RARITY_NORM_EXP) : 1;
  const p = rarityPrefValue(pref);
  if (!p) return base;
  // 3^(pref * tierScore): symmetric either way, with the two middle tiers sitting
  // proportionally between the poles rather than being dragged along with whichever
  // end they were lumped into.
  return base * Math.pow(3, p * (RTIER_SCORE[tier] !== undefined ? RTIER_SCORE[tier] : 0));
}
function pickWeighted(arr, pref){
  if (!arr.length) return null;
  const norm = rarityNorm(arr);
  const weights = arr.map(t => rarityWeight(t, pref, norm));
  const total = weights.reduce((a,b)=>a+b,0);
  let r = rand() * total;
  for (let i=0;i<arr.length;i++){ r -= weights[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length-1];
}
/* ================= DIVERGENCE =================
   The structural tension in this app, stated plainly: WEIGHT_MATRIX makes traits
   reinforce each other, and the coherence score rewards exactly that reinforcement.
   Left alone, the system therefore optimises toward the most typical member of each
   cluster — high warmth pulls Peacemaker pulls Warm & Playful pulls Secure, every
   single time — and then congratulates you for it.

   Divergence is the counterweight, and it is deliberately a dial rather than a score:
   on a share of category draws proportional to the setting, the matrix's pull is
   INVERTED for that one draw, so the strongly-indicated category becomes the
   unlikely one. Coherence stays reported, but it is now something you choose, not
   something you are graded on. */
/* How often each category has been drawn this session. Feeds the neutral-slider arm
   of divergence above, and nothing else — it is a tie-breaker, not a constraint. */
const CATEGORY_USE = new Map();
function noteCategoryUse(cat){ if (cat) CATEGORY_USE.set(cat, (CATEGORY_USE.get(cat) || 0) + 1); }
function forgetCategoryUse(){ CATEGORY_USE.clear(); }

function divergenceLevel(){
  const el = document.getElementById('divergence');
  return el ? clamp(parseFloat(el.value) || 0, 0, 1) : 0;
}
/* REPLAY vs EXPLORE. Divergence's "freshen" branch below consults CATEGORY_USE, the
   session's running tally of which categories have already been drawn — so at neutral
   sliders the same seed produced different characters depending on what you had
   generated earlier in the session, with no control anywhere saying so. ("Avoid recent
   traits" is a different memory and gates a different penalty; switching it off did
   not switch this off.)

   Rather than delete the behaviour — a dial that refuses to land where it has already
   landed is genuinely useful — name it. A build declared as a replay ignores session
   history entirely, which is what "same seed + same settings = the same character"
   has to mean; an ordinary interactive build still explores. */
let REPLAY_MODE = false;
function historyAwareGeneration(){ return !REPLAY_MODE; }
/* A replay runs against an EMPTY history rather than with the history-aware mechanisms
   switched off, and the difference matters: switching them off changes which code path
   runs (divergence's freshen branch stops firing at all, and stops consuming its coin),
   which produces a different character from the same seed. Swapping in empty history
   leaves every branch exactly where it was and simply gives it nothing to remember —
   so a seed replays the character that seed named, from any session. */
function withReplayMode(on, fn){
  const prev = REPLAY_MODE;
  REPLAY_MODE = !!on;
  if (!on) { try { return fn(); } finally { REPLAY_MODE = prev; } }
  const savedRecent = recentTraitIds, savedSlots = lastBySlot, savedFams = recentFamilies;
  const savedUse = new Map(CATEGORY_USE);
  recentTraitIds = [];
  recentFamilies = [];
  lastBySlot = {};
  CATEGORY_USE.clear();
  try { return fn(); }
  finally {
    REPLAY_MODE = prev;
    recentTraitIds = savedRecent;
    recentFamilies = savedFams;
    lastBySlot = savedSlots;
    CATEGORY_USE.clear();
    savedUse.forEach((v,k)=>CATEGORY_USE.set(k,v));
  }
}
/* THE ONE DEFINITION OF A CATEGORY'S WEIGHT.
   predictProfileCategories used to carry its own copy of this arithmetic — a hand-rolled
   `BASELINE + boost * w` that had drifted from the real picker in two ways: it applied
   neither the user's prefer/rarely category tiers nor the age/context multipliers. So
   the live preview could confidently name a category the build would rarely pick, and
   the divergence would only widen as either side was edited. Two implementations of the
   same formula will drift; there is one now, and the preview and the draw share it. */
const CATEGORY_BASELINE = 0.4;
function categoryWeights(cats, boostMap){
  const boost = AFFINITY();
  return cats.map(c => (CATEGORY_BASELINE + boost * ((boostMap && boostMap.get(c)) || 0))
                       * tierMultiplier(c) * contextMultiplier(c) * avoidCategoryMultiplier(c));
}
/* A category whose pool is empty under the active bans (or the character's
   presentation lock) is not a candidate. Category resolution used to consider every
   name in the section and only discover the emptiness at draw time, where the slot
   simply vanished: banning six of seven Social Roles and leaving Leader permitted
   produced NO role at all in 85 of 100 seeded builds, rather than Leader every time.
   Filter first; the caller reports a genuinely empty section. */
function eligibleCategories(cats){
  if (!cats || !cats.length) return cats || [];
  const usable = cats.filter(c=>{
    const section = SECTION_OF_CATEGORY.get(c);
    if (!section) return true;                 // unknown mapping: don't silently drop it
    return byFilter(section, c).length > 0;
  });
  // Everything is banned out. Returning [] would make the caller draw from nothing;
  // returning the original list preserves the old behaviour (an empty, explained slot).
  return usable.length ? usable : [];
}
function pickCategoryWeighted(catsIn, boostMap){
  // categoryTiers: user prefer/rarely multipliers fold in here — the single point
  // where category selection happens — see WEIGHTED CONSTRAINT TIER above.
  const cats = eligibleCategories(catsIn);
  if (!cats.length) return null;

  const boost = AFFINITY();
  // Baseline weight lowered from 1 to 0.4: when a slider actually points somewhere,
  // that category should clearly dominate rather than be one voice among many equals.
  // A fully neutral boostMap (all zeros) still yields uniform weights, so unboosted /
  // truly-random picks are unaffected — this only sharpens picks that already have signal.
  const BASELINE = CATEGORY_BASELINE;
  const div = divergenceLevel();
  /* BUG FIX: divergence only fired when boostMap.size was non-zero — so at neutral
     sliders, which is exactly where the boost map is empty and staleness is worst, the
     dial did nothing whatsoever. A user who moved "Surprise me" to the top because
     every character felt the same got no change at all, because they hadn't also
     pushed a slider.

     At neutral there is no pull to invert, so inverting is not the available move.
     What IS available is refusing to keep landing in the same place: pick uniformly
     among the categories this session has drawn LEAST from. Same dial, same coin, and
     the same meaning — "some of the time, don't go where you'd normally go". */
  const hasSignal = !!(boostMap && boostMap.size);
  const roll = div > 0 && rand() < div;
  const invert = roll && hasSignal;
  const freshen = roll && !hasSignal;   // reads CATEGORY_USE, which a replay empties
  let peak = 0;
  if (invert) boostMap.forEach(v=>{ if (v > peak) peak = v; });
  let leastUsed = null;
  if (freshen){
    let min = Infinity;
    cats.forEach(c=>{ const n = CATEGORY_USE.get(c) || 0; if (n < min) min = n; });
    leastUsed = new Set(cats.filter(c => (CATEGORY_USE.get(c) || 0) === min));
  }
  const weightOf = c => {
    if (freshen) return leastUsed.has(c) ? 1 : 0.05;
    const b = (boostMap && boostMap.get(c)) || 0;
    return BASELINE + boost * (invert ? Math.max(0, peak - b) : b);
  };
  const weights = cats.map(c => weightOf(c) * tierMultiplier(c) * contextMultiplier(c) * avoidCategoryMultiplier(c));
  // (Deliberately not categoryWeights() below: this path also has to express the two
  // divergence branches, which are a per-draw coin and have no meaning in a prediction.)
  const total = weights.reduce((a,b)=>a+b,0);
  let r = rand() * total;
  for (let i=0;i<cats.length;i++){ r -= weights[i]; if (r <= 0){ noteCategoryUse(cats[i]); return cats[i]; } }
  const last = cats[cats.length-1];
  noteCategoryUse(last);
  return last;
}

/* ================= CONTEXT & AGE CONDITIONING =================
   "One-line context" and "Age" were collected, displayed on the sheet, and consumed by
   absolutely nothing — a visible promise the generator never kept, and the reason a
   medieval smuggler could draw "Management-jargon heavy".

   This is deliberately a keyword bias and not a gate: it multiplies category weights,
   so a context can make a whole family of traits likelier or rarer without ever making
   anything impossible (bans are the tool for impossible). Every rule is a plain
   pattern over the text the user typed, and the resolved bias is shown back to them in
   the preview so it never operates invisibly. */
const CONTEXT_RULES = [
  {re:/\b(ex-)?(military|soldier|army|navy|marine|veteran|officer|sergeant|combat|war)\b/i,
   up:["Discipline — Self-Controlled","Rigid & Principled","Fight (attack the threat)","Precision & Specificity Level","Leader"],
   down:["Absurd & Chaotic"], label:"military"},
  {re:/\b(smuggler|thief|criminal|crook|outlaw|bandit|pirate|gangster)\b/i,
   up:["Honesty — Deceptive & Evasive","Self-Interested","Pragmatic Focus & Speech Functions","Risk & Escape","Outsider"],
   down:["Manners — Polished & Courteous"], label:"criminal"},
  {re:/\b(medieval|ancient|victorian|regency|feudal|peasant|knight|monk|antiquity|bronze age|iron age|pre-?industrial)\b/i,
   up:["Register & Formality Spectrum","Abstractness & Sensory Modality"],
   down:["Conceptual Framework & Loanwords","Morphological & Structural Lexicon"], label:"pre-modern setting"},
  {re:/\b(corporate|executive|manager|consultant|office|startup|bureaucrat|civil service|administrat)\w*\b/i,
   up:["Conceptual Framework & Loanwords","Register & Formality Spectrum","Pragmatic Focus & Speech Functions"],
   down:[], label:"institutional"},
  {re:/\b(doctor|nurse|medic|surgeon|therapist|carer|caregiver|teacher|social worker)\b/i,
   // "Fawn" was a stress RESPONSE inferred from an occupation — a nurse is not thereby
   // an appeaser. The occupation shapes vocabulary and role; it does not get to assert
   // a psychology. Same for the manual-trade rule below and crude manners.
   up:["Caretaker","Precision & Specificity Level"], down:[], label:"caring profession"},
  {re:/\b(scholar|academic|scientist|researcher|professor|student|librarian|engineer)\b/i,
   up:["Intelligence — Sharp & Analytical","Skeptic","Precision & Specificity Level","Intellectual & Wordplay"],
   down:[], label:"analytical profession"},
  {re:/\b(priest|nun|cleric|preacher|monk|pastor|zealot|devout|cult)\w*\b/i,
   up:["Idealistic & Visionary","Register & Formality Spectrum","Loyalty-Bound"], down:[], label:"religious"},
  {re:/\b(farmer|labourer|laborer|dock|sailor|miner|builder|mechanic|driver|shop-?floor|trade)\w*\b/i,
   up:["Directness & Literalness","Activeness — Energetic & Active"],
   down:["Stylized & Elaborate"], label:"manual trade"},
  {re:/\b(grief|grieving|bereaved|widow|widower|mourning)\w*\b/i,
   up:["Positivity — Pessimistic & Cynical","Temporal Orientation & Tense Usage","Avoidant"], down:[], label:"grief"},
  {re:/\b(nobleman|noblewoman|nobility|aristocrat|royalty|royal court|courtier|heir|heiress|duke|duchess|baron|baroness|earl|viscount)\w*\b/i,
   up:["Manners — Polished & Courteous","Register & Formality Spectrum","Leader"],
   down:["Manners — Crude & Ill-Mannered"], label:"aristocratic"},
];
// Age is a free-text field on purpose ("mid-30s", "ancient", "about nineteen"), so read
// the first number out of it and fall back to a few written forms.
function parseAgeHint(text){
  if (!text) return null;
  const m = String(text).match(/\d{1,3}/);
  if (m){ const n = parseInt(m[0],10); return (n >= 1 && n <= 120) ? n : null; }
  if (/\b(child|kid|infant|toddler)\b/i.test(text)) return 8;
  if (/\b(teen|adolescen|youth)\w*\b/i.test(text)) return 16;
  if (/\b(elder|elderly|ancient|old)\b/i.test(text)) return 75;
  return null;
}
const AGE_RULES = [
  {max:15, up:["Curiosity — Inquisitive & Exploratory","Absurd & Chaotic","Emotional Capacity — Expressive & Deep"],
   down:["Conceptual Framework & Loanwords","Restraint & Discipline"], label:"child"},
  {min:16, max:24, up:["Activeness — Energetic & Active","Rebelliousness — Defiant"],
   down:["Curiosity — Incurious & Settled"], label:"young adult"},
  {min:60, up:["Curiosity — Incurious & Settled","Temporal Orientation & Tense Usage","Activeness — Sedentary & Low-Energy"],
   down:["Activeness — Energetic & Active"], label:"older"},
];
let CONTEXT_BIAS = new Map();   // category -> multiplier (voice + profile categories)
let CONTEXT_AXIS_NUDGE = {};    // personality axis id -> raw slider delta
let CONTEXT_BIAS_NOTES = [];    // human-readable, surfaced in the preview
const CONTEXT_UP = 2.2, CONTEXT_DOWN = 0.45, CONTEXT_NUDGE = 18;
// A personality pole isn't chosen by weighted category draw — it's chosen by the sign
// of its slider — so a category multiplier would be a no-op there. Express those rules
// as a small slider NUDGE instead: the same intent, through the mechanism that axis
// actually uses, and small enough that an explicit slider position still dominates.
function _axisForCategory(cat){
  if (typeof PERSONALITY_AXES === 'undefined') return null;
  for (const a of PERSONALITY_AXES){
    if (a.pos === cat) return {id:a.id, dir:1};
    if (a.neg === cat) return {id:a.id, dir:-1};
  }
  return null;
}
/* Words that turn the phrase after them into a denial. Deliberately a short, local
   window rather than a parser: the rule is "within the few words immediately before
   the match", which covers "not a soldier", "never a thief", "no longer grieving" and
   "hardly a noble" without pretending to understand the sentence. */
const NEGATION_RE = /\b(not|never|no longer|isn'?t|wasn'?t|aren'?t|hardly|rather than|instead of|anything but|far from|no)\b[^.;,]{0,24}$/i;
function isNegated(text, matchIndex){
  return NEGATION_RE.test(text.slice(Math.max(0, matchIndex - 40), matchIndex));
}
/* Labels the user has switched off for this character. The bias was previously
   unconditional and invisible; this is the "removable suggestion" half. */
const CONTEXT_SUPPRESSED = new Set();
function suppressContextTag(label){ CONTEXT_SUPPRESSED.add(label); }
function unsuppressContextTag(label){ CONTEXT_SUPPRESSED.delete(label); }
function clearContextSuppression(){ CONTEXT_SUPPRESSED.clear(); }
function getSuppressedContextTags(){ return [...CONTEXT_SUPPRESSED]; }
// Matches that were found but NOT applied, with the reason — so "why didn't it read
// this as military?" has an answer on screen.
let CONTEXT_REJECTED = [];
function getRejectedContextTags(){ return CONTEXT_REJECTED.slice(); }

function buildContextBias(contextText, ageText){
  CONTEXT_BIAS = new Map();
  CONTEXT_AXIS_NUDGE = {};
  CONTEXT_BIAS_NOTES = [];
  CONTEXT_REJECTED = [];
  const push = (cat, factor, sign) => {
    const ax = _axisForCategory(cat);
    if (ax) CONTEXT_AXIS_NUDGE[ax.id] = (CONTEXT_AXIS_NUDGE[ax.id]||0) + ax.dir * sign * CONTEXT_NUDGE;
    else CONTEXT_BIAS.set(cat, (CONTEXT_BIAS.get(cat)||1) * factor);
  };
  const apply = (rule) => {
    (rule.up||[]).forEach(c=> push(c, CONTEXT_UP, 1));
    (rule.down||[]).forEach(c=> push(c, CONTEXT_DOWN, -1));
    CONTEXT_BIAS_NOTES.push(rule.label);
  };
  const text = String(contextText || "");
  /* A keyword match is not a claim. "not a soldier" applied the military bias, "court
     reporter" made the character aristocratic, and "not grieving" applied grief —
     these are ordinary descriptions, not malformed input, and the tool was quietly
     steering the whole character off them. Two changes: a negation immediately before
     the match suppresses it, and every surviving match is recorded as a tag the user
     can see and switch off, rather than an invisible multiplier. */
  if (text.trim()) CONTEXT_RULES.forEach(r=>{
    const m = r.re.exec(text);
    if (!m) return;
    if (CONTEXT_SUPPRESSED.has(r.label)) return;
    if (isNegated(text, m.index)) { CONTEXT_REJECTED.push({label: r.label, why: 'negated in the text'}); return; }
    apply(r);
  });
  const age = parseAgeHint(ageText);
  if (age !== null) AGE_RULES.forEach(r=>{
    if ((r.min === undefined || age >= r.min) && (r.max === undefined || age <= r.max)) apply(r);
  });
  CONTEXT_SUPPRESSED.forEach(l=>{
    if (CONTEXT_RULES.some(r=>r.label===l)) CONTEXT_REJECTED.push({label:l, why:'you turned this one off'});
  });
  return {bias: CONTEXT_BIAS, nudge: CONTEXT_AXIS_NUDGE, notes: CONTEXT_BIAS_NOTES,
          rejected: CONTEXT_REJECTED.slice(), age};
}
/* A slot can legitimately hold trait:null — an exhausted pool, a banned-out category,
   or a save file written by an older build. Three separate crashes (axisProfile,
   buildStressVariant, checkEnsembleBalance) have each been fixed in place with their
   own inline guard; this is the same guard, named once, so the next reader of a slot
   reaches for it instead of rediscovering the bug. */
function slotCat(slot){ return slot && slot.trait ? slot.trait.category : null; }

function clearContextBias(){ CONTEXT_BIAS = new Map(); CONTEXT_AXIS_NUDGE = {}; CONTEXT_BIAS_NOTES = []; }
/* BUG FIX. CONTEXT_BIAS is module-level and is read inside pickCategoryWeighted, but it
   was only ever cleared by resetAllToDefaults. So generating one character with the
   context "ex-military smuggler" left military+criminal multipliers (x2.2 / x0.45)
   armed for everything generated afterwards: every member of a cast, every foil, every
   gap-filler silently inherited a bias with nothing on screen saying so. The gap-filler
   was the worst of it — its entire job is to break up clustering, and it was being
   handed the bias that caused the clustering.

   Save/restore rather than a bare clear: the single-character sheet's bias is still
   live state that the "why this trait" panel reads back, so these generators must
   leave it exactly as they found it. */
function withoutContextBias(fn){
  const savedBias = CONTEXT_BIAS, savedNudge = CONTEXT_AXIS_NUDGE, savedNotes = CONTEXT_BIAS_NOTES;
  clearContextBias();
  try { return fn(); }
  finally { CONTEXT_BIAS = savedBias; CONTEXT_AXIS_NUDGE = savedNudge; CONTEXT_BIAS_NOTES = savedNotes; }
}
function contextMultiplier(cat){ return CONTEXT_BIAS.get(cat) || 1; }

// ---------- Real per-trait conflict detection via polarity vectors ----------
// Conflicts used to be flat present/absent: two intensity-1 traits that could
// plausibly coexist in a real person were reported in exactly the same weight and
// phrasing as two intensity-5 traits that genuinely can't. Grade by the combined
// intensity of the opposed pair so the loud contradictions sort to the top and the
// quiet ones read as what they are — a note, not a problem.
//   severity = a.intensity + b.intensity  (2..10)
const CONFLICT_TIERS = [
  {min:9, label:"Jarring",   note:"Both are extreme statements. Read together they don't describe one person; one of them probably has to give."},
  {min:7, label:"Strong",    note:"Pronounced on both sides — playable, but the character needs a reason they switch between them."},
  {min:5, label:"Moderate",  note:"A real pull in two directions. Fine if the context for each is different."},
  {min:0, label:"Mild",      note:"Both are quiet enough that a real person could carry both without anyone noticing."},
];
function conflictTier(severity){ return CONFLICT_TIERS.find(t => severity >= t.min); }
function checkConflictsFor(stateObj){
  const items = Object.values(stateObj).filter(s=>s && s.trait);
  const found = new Map();   // dedupe key -> graded conflict
  for (let i=0;i<items.length;i++){
    for (let j=i+1;j<items.length;j++){
      const a = items[i].trait, b = items[j].trait;
      if (!a.pol || !b.pol) continue;
      for (const axis of Object.keys(AXIS_LABELS)){
        if (a.pol[axis] === 1 && b.pol[axis] === -1 || a.pol[axis] === -1 && b.pol[axis] === 1){
          const severity = (a.intensity||3) + (b.intensity||3);
          const tier = conflictTier(severity);
          const key = `${a.trait}|${b.trait}|${axis}`;
          if (!found.has(key)) found.set(key, {
            key, severity, tier: tier.label, tierNote: tier.note,
            text: `"${a.trait}" and "${b.trait}" pull in opposite directions on ${AXIS_LABELS[axis]}.`,
          });
        }
      }
    }
  }
  return [...found.values()].sort((x,y)=> y.severity - x.severity);
}


/* ================= POLARITY COVERAGE NORMALISATION =================
   Polarity tagging is badly asymmetric across the axes, and always has been. Measured
   over the bank as tagged:

     intel  analytical thinking  379 pos :  60 neg   (6.3 : 1 — the worst)
     rebel  rebelliousness       284 pos :  58 neg
     form   formality            141 pos :  60 neg
     ego    self-confidence      188 pos : 342 neg
     vol    volume/wordiness     134 pos : 262 neg
     mood   current mood          32 pos : 206 neg   (still skewed after the mood pass)

   axisProfile() sums raw pol values, so a character reads positive on intel and rebel
   almost regardless of who they are, and negative on mood almost regardless. That is
   the same distortion the mood-pass comment describes, on five more axes — and it is
   silent: the radar comes out systematically the wrong shape, conflict detection
   needs both signs to find a contradiction, archetypes that set intelligence negative
   score badly for structural reasons, and the foil generator quietly under-opposes on
   the skewed axes because it opposes by sign.

   Balancing intel alone needs roughly 300 new negative-side traits — a content pass,
   not a tagging pass, and not something to hold the honest radar hostage to. Dividing
   by sqrt(tagged coverage) makes a raw sum stop being read as a posture immediately:
   an axis with six times the material on one side stops contributing six times the
   signal for the same character. It is a normalisation, not a correction — when the
   content arrives, the divisors move on their own and the shapes stay right. */
let POL_COUNTS = {};
let POL_NORM = {};
(function countPolarity(){
  TRAITS.forEach(t=>{
    if (!t.pol) return;
    Object.entries(t.pol).forEach(([ax, v])=>{
      if (!v) return;
      if (!POL_COUNTS[ax]) POL_COUNTS[ax] = {pos:0, neg:0};
      if (v > 0) POL_COUNTS[ax].pos++; else POL_COUNTS[ax].neg++;
    });
  });
  Object.entries(POL_COUNTS).forEach(([ax, c])=>{
    POL_NORM[ax] = Math.sqrt(c.pos + c.neg) || 1;
  });
})();
// Normalised axis contribution. Sign is preserved exactly; only the magnitude is put
// on a comparable footing across axes with very different amounts of tagged material.
function polNormalise(ax, raw){
  const d = POL_NORM[ax];
  return d ? raw / d : raw;
}
/* The bank's expected value per tagged draw on an axis, in -1..1. This is the "prior"
   axisProfile subtracts so that a sheet is read relative to what the bank hands out by
   default rather than in absolute tag counts — see the note there. Calibrated from the
   bank once at load; it is a property of the CONTENT, not of any character. */
function polarityPrior(ax){
  const c = POL_COUNTS[ax];
  if (!c || !(c.pos + c.neg)) return 0;
  return (c.pos - c.neg) / (c.pos + c.neg);
}

/* ================= CONTRADICTION AS CONTENT =================
   checkConflictsFor already finds every pair of seated traits that pull opposite ways
   on an axis, and reports them as something to be aware of — a warning, softened by
   the tier grading, but still framed as a problem the sheet has.

   The far more useful move is to let a character OWN one. A person who is truthful and
   evasive is not a broken character sheet; they are a character with a question
   attached, and the question is the interesting part. The detection and the grading
   already exist — this only asks the generative question about the strongest pair, per
   axis, in the character's own terms.

   Deliberately one contradiction, not a list: a sheet that names six of them is back to
   being a warnings panel. The strongest pair is the one worth a scene. */
const CONTRADICTION_QUESTIONS = {
  hon:  "What are they lying about, and to whom?",
  warm: "Who gets the warm one, and what did that person do to earn it?",
  ego:  "Which of the two is the performance, and who is it for?",
  asrt: "What has to be at stake before they take the room?",
  emo:  "Who has seen the open version, and when did they last see it?",
  disc: "What is the one area they refuse to be organised about, and why that one?",
  agr:  "What is the thing they will not go along with, however much easier it would be?",
  man:  "Whose rules do they observe, and whose do they treat as optional?",
  intel:"Which kind of problem makes them go quiet, and which makes them show off?",
  rebel:"What authority do they actually accept, and what did it do to deserve that?",
  pos:  "Which future do they say out loud, and which one do they plan around?",
  act:  "What are they saving the energy for?",
  cur:  "What is the one subject they refuse to be curious about?",
  vol:  "In whose company do they run out of words?",
  form: "Which room makes them formal, and what are they defending in it?",
  pace: "What makes them slow down?",
  mood: "How long has this been the mood, and what were they like before it?",
};
/* The `reb:` key above was dead for the entire life of this table: AXIS_LABELS spells
   rebelliousness `rebel`, so every rebelliousness contradiction — one of the two most
   heavily tagged axes in the bank — fell through to the generic fallback question. A
   one-character typo with no symptom loud enough to notice.

   Nothing checked that these axis-keyed tables agree with the axis vocabulary they are
   keyed on, so nothing could. This does, for every such table at once: an unknown key
   is a typo, and a missing key is a table that has fallen behind a newly added axis.
   Wired into ?dev=1 alongside assertTraitShape and asserted by the test suite. */
function assertAxisTables(){
  const problems = [];
  const tables = [
    ['CONTRADICTION_QUESTIONS', CONTRADICTION_QUESTIONS, true],
    ['AXIS_TO_POLCODE (values)', Object.fromEntries(Object.values(AXIS_TO_POLCODE).map(c=>[c,1])), false],
  ];
  tables.forEach(([name, table, requireTotal])=>{
    Object.keys(table).forEach(k=>{
      if (!AXIS_LABELS[k]) problems.push(`${name}: key "${k}" names no axis in AXIS_LABELS`);
    });
    if (!requireTotal) return;
    Object.keys(AXIS_LABELS).forEach(k=>{
      if (!(k in table)) problems.push(`${name}: no entry for axis "${k}" (${AXIS_LABELS[k]})`);
    });
  });
  return problems;
}

function contradictionFor(stateObj){
  const items = Object.values(stateObj || {}).filter(s=> s && s.trait && s.trait.pol);
  let best = null;
  for (let i = 0; i < items.length; i++){
    for (let j = i + 1; j < items.length; j++){
      const a = items[i].trait, b = items[j].trait;
      for (const axis of Object.keys(AXIS_LABELS)){
        const pa = a.pol[axis], pb = b.pol[axis];
        if (!(pa === 1 && pb === -1 || pa === -1 && pb === 1)) continue;
        const severity = (a.intensity||3) + (b.intensity||3);
        if (!best || severity > best.severity){
          // Whichever side is positive on the axis reads first, so the sentence keeps
          // the same orientation as the axis label.
          const hi = pa === 1 ? a : b, lo = pa === 1 ? b : a;
          best = {severity, axis, axisLabel: AXIS_LABELS[axis], hi, lo,
                  tier: conflictTier(severity).label,
                  question: CONTRADICTION_QUESTIONS[axis] || "When does each of these come out, and what decides it?"};
        }
      }
    }
  }
  // Two quiet traits nudging opposite ways is not a contradiction anyone would notice.
  return best && best.severity >= 6 ? best : null;
}

const PERSONALITY_AXES = [
  {id:"friendliness", label:"Friendliness", pos:"Friendliness — Warm & Approachable", neg:"Friendliness — Cold & Distant", mid:"Friendliness — Situational"},
  {id:"honesty", label:"Honesty", pos:"Honesty — Truthful & Transparent", neg:"Honesty — Deceptive & Evasive", mid:"Honesty — Situational"},
  {id:"assertiveness", label:"Assertiveness", pos:"Assertiveness — Assertive & Direct", neg:"Assertiveness — Passive & Yielding", mid:"Assertiveness — Situational"},
  {id:"confidence", label:"Confidence / Ego", pos:"Confidence — Self-Assured", neg:"Confidence — Insecure or Egotistical", mid:"Confidence — Situational"},
  {id:"agreeableness", label:"Agreeableness", pos:"Agreeableness — Accommodating", neg:"Agreeableness — Contrarian & Argumentative", mid:"Agreeableness — Situational"},
  {id:"manners", label:"Manners", pos:"Manners — Polished & Courteous", neg:"Manners — Crude & Ill-Mannered", mid:"Manners — Situational"},
  {id:"discipline", label:"Discipline", pos:"Discipline — Self-Controlled", neg:"Discipline — Impulsive & Undisciplined", mid:"Discipline — Situational"},
  {id:"rebelliousness", label:"Rebelliousness", pos:"Rebelliousness — Defiant", neg:"Rebelliousness — Compliant & Conformist", mid:"Rebelliousness — Situational"},
  {id:"emotionalcapacity", label:"Emotional Capacity", pos:"Emotional Capacity — Expressive & Deep", neg:"Emotional Capacity — Guarded & Shallow", mid:"Emotional Capacity — Situational"},
  {id:"intelligence", label:"Intelligence", pos:"Intelligence — Sharp & Analytical", neg:"Intelligence — Instinctive & Unanalytical", mid:"Intelligence — Situational"},
  {id:"positivity", label:"Positivity", pos:"Positivity — Optimistic & Upbeat", neg:"Positivity — Pessimistic & Cynical", mid:"Positivity — Situational"},
  {id:"activeness", label:"Activeness / Lifestyle", pos:"Activeness — Energetic & Active", neg:"Activeness — Sedentary & Low-Energy", mid:"Activeness — Situational"},
  {id:"curiosity", label:"Curiosity", pos:"Curiosity — Inquisitive & Exploratory", neg:"Curiosity — Incurious & Settled", mid:"Curiosity — Situational"},
];

// Voice sliders as first-class signals, alongside personality axes. Previously
// verbosity/register/composure only ever pushed vocab/grammar/manner category
// weights via hardcoded rules — they had NO effect on which Motivation, Stress
// Response, Social Role, Values, Attachment, Humor, or Vices category got picked.
// Folding them into the exact same WEIGHT_MATRIX signal system personality axes use
// (see accumulateBoost/attributedBoost below) means a torrentially verbose, ornate,
// volatile combination now visibly pulls those sections too — not just tone.
const VOICE_AXES = [
  {id:"verbosity", label:"Verbosity", sliderId:"verbositySlider"},
  {id:"register",  label:"Register",  sliderId:"registerSlider"},
  {id:"composure", label:"Composure", sliderId:"composureSlider"},
];
const SIGNAL_AXES = PERSONALITY_AXES.concat(VOICE_AXES);

// Reads ANY signal's current level (-2..2) — personality axis or voice axis — from an
// override map if one applies, otherwise straight off its own slider. Generalizes
// persLevel so cast members, foils, and the stress variant can each carry their OWN
// verbosity/register/composure into profile-section resolution instead of every
// character silently inheriting whatever the single-character DOM sliders say.
function axisLevel(axisId, overrides){
  if (overrides && overrides[axisId] !== undefined) return rawToLevel(overrides[axisId]);
  const voice = VOICE_AXES.find(v=>v.id===axisId);
  const el = document.getElementById(voice ? voice.sliderId : 'pers_'+axisId);
  return rawToLevel(intVal(el, 0));
}

// Maps each personality axis onto the short polarity code its traits already use in
// `pol` (see AXIS_LABELS) so slider level and declared trait polarity share one
// namespace. Composure has no direct code of its own; volatility reads onto "mood"
// (the same code Freeze/Disorganized-style traits already carry) since that's the
// closest existing concept — high composure (volatile) pulls mood negative.
const AXIS_TO_POLCODE = {
  friendliness:'warm', honesty:'hon', assertiveness:'asrt', confidence:'ego',
  agreeableness:'agr', manners:'man', discipline:'disc', rebelliousness:'rebel',
  emotionalcapacity:'emo', intelligence:'intel', positivity:'pos', activeness:'act',
  /* BUG FIX. Curiosity was the one personality axis with no polarity code, and the
     omission was invisible because every consumer degrades silently: the pole-tagging
     pass skipped both Curiosity categories (19%/2% tagged against 100% everywhere
     else), liveAxisVector never carried it so the slider could not steer any trait
     choice, checkConflictsFor could never see a curiosity contradiction, and the radar
     chart — which derives its spokes from Object.values(AXIS_TO_POLCODE) — drew twelve
     of thirteen axes. Twelve of the 28 archetypes set curiosity; archetypeFidelity
     dropped all of them on a `if (!code) return`. This is precisely the failure the
     `mood` fix block above describes, one axis short. */
  curiosity:'cur'
};
/* ================= PERSONALITY POLE POLARITY =================
   The trait-level affinity system reads `pol`, and 54% of Personality Traits — the
   largest section in the bank, 2,013 entries — carried an empty vector. That is the
   section where posture SHOULD bite hardest, and it was the section the mechanism
   could least see: within "Honesty — Deceptive & Evasive", an untagged majority was
   drawn essentially at random with respect to how far the user had pushed Honesty.

   Unlike the voice sections (where untagged is a deliberate choice, because a
   mannerism genuinely doesn't imply a psychology), a Personality trait's own category
   states its axis and its pole outright. So the tag is not a guess: it is already in
   the data, just not in a form polarityFit could read. Derive it.

   Situational categories are deliberately excluded — "warm one-to-one, flat in
   groups" is not a claim about the warmth axis, it is a claim about conditionality,
   and tagging it either way would be false. Anything already tagged is untouched. */
/* A large share of the core bank declares its vector with explicit zeros —
   pol:{vol:1,pace:0,form:0,warm:0}. A zero is not a claim, and carrying them made
   both the coverage figures and polarityFit's denominator misleading. Strip them
   once at load so `pol` contains only what a trait actually asserts. */
(function normalisePolarity(){
  TRAITS.forEach(t=>{
    if (!t.pol) { t.pol = {}; return; }
    Object.keys(t.pol).forEach(k=>{ if (!t.pol[k]) delete t.pol[k]; });
  });
})();

/* Some VOICE categories name a pole as plainly as the personality ones do: a trait
   filed under "Minimal & Ultra-Brief" is a claim about volume whatever else it says.
   Those get the same derivation. The list is deliberately short — most voice
   categories (Pacing, Anchors & Fillers, every Mannerism group) genuinely do NOT
   imply a psychology, and the existing design decision to leave those untagged is
   correct, not an oversight. */
const VOICE_CATEGORY_POLE = {
  "High-Volume & Wordy": {vol: 1},
  "Minimal & Ultra-Brief": {vol: -1},
  "Spoken Compression": {vol: -1},
  "Stylized & Elaborate": {form: 1},
  "Directness & Literalness": {hon: 1},
  "Precision & Specificity Level": {intel: 1},
};
let VOICE_POLE_STATS = null;
(function applyVoiceCategoryPolarity(){
  let tagged = 0;
  TRAITS.forEach(t=>{
    const spec = VOICE_CATEGORY_POLE[t.category];
    if (!spec) return;
    if (Object.keys(t.pol).length) return;   // never override an explicit claim
    Object.assign(t.pol, spec);
    tagged++;
  });
  VOICE_POLE_STATS = {tagged};
})();

let PERSONALITY_POLE_STATS = null;
(function applyPersonalityPolePolarity(){
  const byCat = new Map();   // category -> {code, sign}
  PERSONALITY_AXES.forEach(a=>{
    const code = AXIS_TO_POLCODE[a.id];
    if (!code) return;
    byCat.set(a.pos, {code, sign: 1});
    byCat.set(a.neg, {code, sign: -1});
  });
  /* BUG FIX. The guard here was `already says something on ANY axis`, so a trait sitting
     in "Intelligence — Instinctive & Unanalytical" that happened to declare {warm:1} was
     skipped entirely and never received its intel:-1. The category IS the statement
     about its own axis; a tag on a different axis is orthogonal information and says
     nothing about this one.

     That left 519 Personality traits carrying no polarity at all despite a pass whose
     whole job is to derive it from the category, and it fell hardest on exactly the two
     axes measured as most lopsided: intel ran 289 positive to 37 negative and rebel
     266 to 36, because the positive poles happened to carry fewer competing tags. Since
     polarityFit can only select on what is tagged, pushing Intelligence or
     Rebelliousness negative gave materially less trait-level steering than pushing
     either positive — a slider that did less work in one direction than the other.

     Skip only when the trait already declares THIS axis, which is the case the guard
     was actually written for: a hand-authored tag that disagrees with its category
     (a defiant trait in the compliant pool, say) must still win. */
  let tagged = 0, keptExplicit = 0;
  TRAITS.forEach(t=>{
    if (t.section !== "Personality Traits") return;
    const spec = byCat.get(t.category);
    if (!spec) return;                                            // Situational: correctly silent
    if (!t.pol) t.pol = {};
    if (t.pol[spec.code]){ keptExplicit++; return; }              // explicit tag on THIS axis wins
    t.pol[spec.code] = spec.sign;
    tagged++;
  });
  PERSONALITY_POLE_STATS = {tagged, keptExplicit};
})();

function liveAxisVector(overrides){
  const vec = {};
  PERSONALITY_AXES.forEach(a=>{
    const code = AXIS_TO_POLCODE[a.id]; if (!code) return;
    vec[code] = axisLevel(a.id, overrides);
  });
  vec.vol = axisLevel('verbosity', overrides);
  vec.form = axisLevel('register', overrides);
  vec.mood = -axisLevel('composure', overrides);
  return vec;
}

// How strongly individual trait polarity should respond to the live vector, derived
// from the same "Boost strength" dial that already scales category-level boosting —
// one dial, two effects, both meaning "how hard do sliders steer content."
function affinityStrength(){
  return floatVal('affinityBoost', 2.5) * 0.16;   // see AFFINITY() on the fallback
}

// -1..1: how well a trait's own declared polarity agrees with the current combined
// personality+voice posture. 0 for untagged traits (pol:{}), which is most vocab/
// grammar/mannerism content by design — this only activates where a trait actually
// carries a psychological lean.
// BUG FIX: a large share of the core bank declares its vector with explicit zeros —
// pol:{vol:1,pace:0,form:0,warm:0} — and those zeros were counted in the denominator.
// A trait making exactly one claim was therefore scored as if it made four, and its
// fit came out quartered against a trait carrying a single non-zero key. Only
// non-zero entries are claims; skip the rest.
function polarityFit(t, vec){
  if (!t.pol) return 0;
  const keys = Object.keys(t.pol);
  if (!keys.length) return 0;
  let sum = 0, weight = 0;
  keys.forEach(k=>{
    const p = t.pol[k];
    if (!p) return;                       // 0 (or absent) is not a claim
    const v = vec[k]; if (v === undefined) return;
    sum += p * v; weight++;
  });
  return weight ? clamp(sum / (weight*2), -1, 1) : 0;
}

// The vector every pickInRange() call reads. Set explicitly at the top of each
// build/reroll/nudge operation (never left stale across a stale prior generation) —
// see setAffinityVec() call sites in buildCharacterState, rerollSlot, adjustPin, and
// buildStressVariant.
let CURRENT_AFFINITY_VEC = null;
function setAffinityVec(overrides){ CURRENT_AFFINITY_VEC = liveAxisVector(overrides); }

/* PHASE 1 — NEUTRAL BUFFER
   Previously: `const cat = level >= 0 ? axis.pos : axis.neg`. Slider 0 returned a
   definitely-warm trait, slider -1 a definitely-cold one — a hard sign flip with
   no middle, and the quietest available statement was still "mild version of a
   side." There was no way to express "neither, really" or "depends who's asking."

   Now each axis has a third pool — "<Axis> — Situational" — of genuinely balanced
   or conditional traits. Selection crossfades by magnitude rather than switching:

     |slider|  0-14   : always Situational (the true middle)
     |slider| 14-42   : probabilistic blend, Situational -> side, weighted by |mag|
     |slider|  42+    : always the leaning side

   The blend is what removes the discontinuity: at ±5 the two sides of zero draw
   from the same neutral pool, so they're no longer different characters. Inside
   the blend zone the side pool is still reachable, but at low intensity, so a
   slider at 25 gives "mostly neutral, occasionally a faint lean" rather than a
   guaranteed committed trait. */
const NEUTRAL_FULL = 14;   // below this: purely situational
const NEUTRAL_NONE = 42;   // above this: purely the leaning side

// How loud a pole trait may be and still read as a neutral-slider reading. 2.4 keeps
// it to the i1/i2 material plus the quietest of i3 — "mildly one way", never a posture.
const NEUTRAL_POLE_CEILING = 2.4;
function pickPersonalitySlot(axis, level, rarityPref){
  const mag = Math.abs(level) * 50;                 // 0..100
  const sideCat = level >= 0 ? axis.pos : axis.neg;
  const neutralPool = byFilter("Personality Traits", axis.mid);

  // Probability this slot draws from the neutral pool at all.
  let pNeutral;
  if (mag <= NEUTRAL_FULL) pNeutral = 1;
  else if (mag >= NEUTRAL_NONE) pNeutral = 0;
  else {
    const t = (mag - NEUTRAL_FULL) / (NEUTRAL_NONE - NEUTRAL_FULL); // 0..1
    pNeutral = 1 - (t * t * (3 - 2 * t));           // smoothstep, no hard edges
  }

  const useNeutral = neutralPool.length && rand() < pNeutral;
  const target = targetFromLevel(level);

  if (useNeutral){
    // Within the neutral pool, magnitude selects how PRONOUNCED the situational
    // pattern is (a defined conditional streak vs. barely worth mentioning),
    // not how extreme the trait is — everything here stays quiet by construction.
    // Range floor is 1.5, not 1.0: everything in this pool is quiet by
    // construction, so aiming at the very bottom only reached the two or three
    // intensity-1 entries and made slider 0 repeat the same handful of traits —
    // the exact repetition problem the neutral tier exists to solve. Starting at
    // 1.5 puts the bulk of the pool in range at dead centre.
    // Range widened with the v3 situational pass. The old ceiling of 2.8 was correct
    // for a twelve-entry pool that topped out at intensity 3; those pools now hold
    // 40+ and run to 5, where "conditionality so pronounced it IS the defining fact
    // about them" lives. Capping at 2.8 would have left that entire new tail
    // permanently unreachable at exactly the slider positions it was written for.
    // The 1.5 floor was chosen when these pools were twelve entries deep; the v3
    // situational pass took them to 40+, and 1.5 is now exactly where those pools
    // START — so at slider 0 the target sits on the floor and the draw collapses onto
    // the two or three lowest entries (15 distinct out of 41, top trait 35%). Lift it
    // into the pool the same way every other neutral target now is.
    /* THE COLLAPSED-SLOT FIX. Every other healthy slot in the app picks a CATEGORY
       first and then a trait inside it, so its variety is (categories x their spread).
       These thirteen picked from exactly one pool per axis, and there variety is capped
       by how many traits that single category holds near the target — which is why the
       pers_* family returned 11-18 distinct traits over 400 characters while vocab and
       manner returned 210+ from pools of comparable total size. Widening the window and
       lifting the target help, and they cannot change the shape of the problem: a
       40-trait pool is a 40-trait pool.

       So give the slot a real choice. A centred slider does not only mean "situational
       on this axis" — it equally means "mildly one way or the other", and a QUIET trait
       from either pole is an honest reading of a neutral setting. Those are already
       authored; they were simply unreachable from the middle of the slider, where most
       of the traffic is. Pool the Situational category with the quiet end of both poles
       and draw from all three.

       Still flagged neutral:true, because it is still a neutral reading — that is what
       keeps checkEnsembleBalance from counting it as posture, which would be the wrong
       answer for a character whose slider was never moved. */
    const quiet = cat => byFilter("Personality Traits", cat).filter(t => traitPos(t) <= NEUTRAL_POLE_CEILING);
    const widened = neutralPool.concat(quiet(axis.pos), quiet(axis.neg));
    const pool = widened.length > neutralPool.length ? widened : neutralPool;
    const nTarget = poolFloorTarget(pool, 1.5 + clamp(mag / NEUTRAL_NONE, 0, 1) * 2.1);
    // minCount 10 forces the window to widen until there's real choice; variety
    // matters more than precision here, since nothing in this pool is loud.
    return {slotId:"pers_"+axis.id, locked:false, label:axis.label,
            target: nTarget, neutral:true,
            trait: withSlotMemory("pers_"+axis.id, ()=>pickInRange(pool, rarityPref, nTarget, 10, true))};
  }
  return {slotId:"pers_"+axis.id, locked:false, label:axis.label,
          target, trait: withSlotMemory("pers_"+axis.id, ()=>pickInRange(byFilter("Personality Traits", sideCat), rarityPref, target))};
}

function pickPersonalitySlots(rarityPref, overrides){
  const includeToggle = document.getElementById('personalityToggle');
  if (includeToggle && !includeToggle.checked) return {};
  const countEl = document.getElementById('personalityCount');
  const count = intVal(countEl, PERSONALITY_AXES.length);

  let axesToUse = PERSONALITY_AXES;
  if (count < PERSONALITY_AXES.length){
    // random subset, but always prioritize axes the user has actually moved off-center (they clearly care about those)
    const moved = [], unmoved = [];
    PERSONALITY_AXES.forEach(axis=>{
      const raw = (overrides && overrides[axis.id] !== undefined) ? overrides[axis.id] : intVal('pers_'+axis.id, 0);
      (Math.abs(raw) > 10 ? moved : unmoved).push(axis);
    });
    // shuffle each group
    const shuffle = arr => arr.map(a=>[rand(),a]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
    const ordered = shuffle(moved).concat(shuffle(unmoved));
    axesToUse = ordered.slice(0, count);
  }

  // Record the selection so the UI can show WHICH axes made the cut and why the
  // others didn't — previously a trimmed subset just silently vanished from the sheet.
  lastAxesUsed = new Set(axesToUse.map(a=>a.id));
  lastAxisTrimActive = count < PERSONALITY_AXES.length;

  const out = {};
  axesToUse.forEach(axis=>{
    const raw = (overrides && overrides[axis.id] !== undefined) ? overrides[axis.id] : intVal('pers_'+axis.id, 0);
    const level = rawToLevel(raw);
    const primary = pickPersonalitySlot(axis, level, rarityPref);
    if (primary && primary.trait) _markUsed(primary.trait);
    out["pers_"+axis.id] = primary;
    // Buff: an axis the user pushed hard (|raw| >= 60) is clearly load-bearing for
    // this character, so it earns a SECOND, distinct facet at a slightly softer
    // intensity — the trait as it shows in ordinary moments, next to the defining
    // one. Deduped against everything already on the sheet.
    if (Math.abs(raw) >= 60 && primary && primary.trait){
      const softer = clamp(level * 0.7, -2, 2);
      const second = _drawUnique(()=>{
        const s2 = pickPersonalitySlot(axis, softer, rarityPref);
        return s2 && s2.trait ? s2.trait : null;
      });
      if (second && second.id !== primary.trait.id){
        _markUsed(second);
        out["pers_"+axis.id+"__2"] = {slotId:"pers_"+axis.id+"__2", locked:false,
          label:(primary.label || axis.label || axis.id) + " — second facet", target: primary.target, trait: second};
      }
    }
  });
  return out;
}


// ================= PROFILE SECTIONS (type-picker model) =================
// These sections aren't bipolar sliders — you pick a *type*, then a trait within it.
// Each entry can draw multiple traits (e.g. Motivation draws a Want AND a Fear AND a Wound).
const PROFILE_SECTIONS = [
  {id:"motivation", section:"Motivation & Wound", label:"Motivation & Wound", drawAll:true,
   blurb:"Why they act, and the old injury underneath it."},
  {id:"stress", section:"Conflict & Stress Response", label:"Conflict & Stress Response", drawAll:false,
   blurb:"What they do when things go wrong."},
  {id:"role", section:"Social Role in a Group", label:"Social Role in a Group", drawAll:false,
   blurb:"The seat they take in any room."},
  {id:"values", section:"Values & Moral Line", label:"Values & Moral Line", drawAll:false,
   blurb:"What they will and won't do under pressure."},
  {id:"attachment", section:"Attachment & Intimacy Style", label:"Attachment & Intimacy", drawAll:false,
   blurb:"How they behave once someone actually matters."},
  {id:"humor", section:"Humor Style", label:"Humor Style", drawAll:false,
   blurb:"What they find funny, and how it lands."},
  {id:"vices", section:"Habits & Vices", label:"Habits & Vices", drawAll:false,
   blurb:"The standing patterns that fill their days."},
  /* ---- The 2026 audit's §6 sections (js/data/traits-life.js) ----------------
     `defaultOn:false` ships a section switched off: it exists, has a toggle, a type
     selector and a weight, and is drawn the moment the user wants it — but a default
     sheet does not grow by twenty cards. The three that ship ON are the ones that
     answer the audit's central complaint about the default sheet: that it explained
     every character through injury and never through competence, intent, or what
     went right. */
  {id:"competence", section:"Competence & Method", label:"Competence & Method", drawAll:false, defaultOn:true,
   blurb:"What they can actually do, how they think about doing it, and the limit that comes with it."},
  {id:"origins", section:"Positive Origins", label:"Positive Origins", drawAll:false, defaultOn:true,
   blurb:"What went right — the trust learned, the care that held, the thing repaired — that explains behaviour without a wound."},
  {id:"goals", section:"Goals & Stakes", label:"Goals & Stakes", drawAll:true, defaultOn:true,
   blurb:"The immediate objective, the longer aim, and what it costs or competes with."},
  {id:"texture", section:"Ordinary Texture", label:"Ordinary Texture", drawAll:false, defaultOn:false,
   blurb:"Preferences, routines, affiliations, a thing practised badly — texture that does not need a rare slot."},
  {id:"repair", section:"Recovery & Repair", label:"Recovery & Repair", drawAll:false, defaultOn:false,
   blurb:"What they do after a conflict, which the pressure sheet's aftermath reads from."},
  {id:"contradiction", section:"Contradiction Functions", label:"Contradiction Functions", drawAll:false, defaultOn:false,
   blurb:"What the contradiction is for — protective hypocrisy, aspirational values, the exceptions they make."},
  {id:"contextrole", section:"Role by Context", label:"Role by Context", drawAll:true, defaultOn:false,
   blurb:"The seat they take among peers, under authority, and with dependents — not one seat in every room."},
];


/* Is this section drawn? A missing toggle (a trimmed page, the test harness) used to
   read as ON, which was fine when every section shipped on. The §6 sections ship off
   by default, so an absent control has to mean "the shipped default", not "yes". */
function profileSectionEnabled(ps){
  const tog = document.getElementById('sec_'+ps.id);
  if (tog) return !!tog.checked;
  return ps.defaultOn !== false;
}

// Resolves which TYPE each profile section lands on, one section at a time, in the order
// PROFILE_SECTIONS is defined — so a later section (say, Values) can be biased by an
// earlier section's already-decided type (say, Social Role) via the matrix above, not just
// by the personality sliders. This is the "deeper" part: character facts inform each other
// in sequence rather than every trait being an independent roll off the same 13 sliders.
function resolveTypeForSection(ps, chosenSoFar, overrides){
  const cats = catsOf(ps.section);
  const fragMap = accumulateBoost(ps.id, chosenSoFar, overrides);
  const boostMap = resolveBoostMapForCats(cats, fragMap);
  return pickCategoryWeighted(cats, boostMap);
}
// Deterministic sibling of resolveProfileCategories: returns the category each section
// is MOST LIKELY to land on given current settings, without rolling any dice. Used for
// the live preview and for the affinity readout, where a fresh random draw every
// keystroke was actively misleading. Also reports how decisive the lead is.
function predictProfileCategories(withConfidence){
  // The preview has to see the same signals the build will, archetype hints included,
  // or selecting an archetype changes the result without changing the preview.
  const archKey = (document.getElementById('archetypeSelect')||{}).value || '';
  const arch = effectiveArchetype(archKey, (document.getElementById('archetypeVariation')||{}).value);
  return withArchetypeProfile(arch && arch.profile, ()=>{
  const chosen = {}, conf = {};
  PROFILE_SECTIONS.forEach(ps=>{
    if (ps.drawAll) return;
    if (!profileSectionEnabled(ps)) return;
    const sel = document.getElementById('type_'+ps.id);
    if (sel && sel.value){ chosen[ps.id] = sel.value; conf[ps.id] = 1; return; }
    const cats = catsOf(ps.section);
    if (!cats.length) return;
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(ps.id, chosen));
    // categoryWeights is the picker's own formula — see the note on it. This used to be
    // a second copy that ignored category tiers and the context multiplier, so the
    // preview could name a category the build would rarely reach.
    const w = categoryWeights(cats, boostMap);
    const scored = cats.map((c,i)=>({c, w: w[i]})).sort((a,b)=>b.w-a.w);
    const total = scored.reduce((s,x)=>s+x.w, 0) || 1;
    chosen[ps.id] = scored[0].c;
    conf[ps.id] = scored[0].w / total;
  });
  return withConfidence ? {chosen, conf} : chosen;
  });
}

function resolveProfileCategories(rarityPref, overrides, forcedCats){
  const chosen = {};
  PROFILE_SECTIONS.forEach(ps=>{
    if (ps.drawAll) return; // Motivation & Wound always draws every category; nothing to "resolve"
    if (!profileSectionEnabled(ps)) return;
    if (forcedCats && forcedCats[ps.id]) { chosen[ps.id] = forcedCats[ps.id]; return; }
    const sel = document.getElementById('type_'+ps.id);
    const manual = (sel && sel.value) ? sel.value : null;
    chosen[ps.id] = manual || resolveTypeForSection(ps, chosen, overrides);
  });
  return chosen;
}

// Profile sections have no slider of their own, so their intensity target comes from
// the "Profile weight" control: how forcefully the deep traits should read. At the low
// end you get quiet, background versions of a wound or a value; at the high end, the
// life-defining ones. Previously every profile trait was a flat unweighted draw, which
// is why they so often came back at a uniform middling intensity.
// One global dial governed seven sections, so "make the wound life-defining but keep
// the humour light" was not expressible. Each section may now carry its own weight;
// blank (the default) means "follow the global dial", so nothing changes until asked.
function profileTarget(sectionId){
  if (sectionId){
    const el = document.getElementById('pw_' + sectionId);
    if (el && el.value !== "" && el.value !== undefined){
      const n = parseInt(el.value, 10);
      if (!Number.isNaN(n)) return targetFromMag(clamp(n, 0, 100));
    }
  }
  const v = clamp(intVal('profileWeight', 55), 0, 100);
  return targetFromMag(v);
}

/* onlySectionId / skipSectionId let the caller split this into two passes. That exists
   so Motivation & Wound can be drawn BEFORE the sections its keywords are meant to
   influence: it is drawAll, so it needs no resolved category and can go first, and its
   cross-links are then live for everything that follows. See MOTIVATION_CROSSLINKS. */
/* How far apart the drawAll primaries are spread, in intensity points, end to end.
   2.4 covers roughly a whole intensity level either side of the section's target, which
   is what it takes to reach the 40-60% of each Motivation pool that a single shared
   target could never see. Wider than this and the quiet end stops reading as the same
   character's wound. */
const MOTIVATION_TARGET_SPREAD = 2.4;
function pickProfileSlots(rarityPref, resolvedCats, onlySectionId, skipSectionId){
  const out = {};
  const depthEl = document.getElementById('profileDepth');
  const want = intVal(depthEl, 1);
  // Staggered intensity targets so multiple traits in one section read as distinct
  // facets (a defining note, a moderate habit, a background tendency) rather than
  // three rolls of the same die.
  const staggered = (base, i) => clamp(base + [0, (base > 3 ? -0.7 : 0.7), (base > 3 ? -1.4 : 1.4), 0.35][i % 4], 1, 5);
  const seat = (id, label, sectionId, tgt, trait, extra) => {
    if (!trait) return;
    _markUsed(trait);
    out[id] = Object.assign({slotId:id, locked:false, label, sectionId, target:tgt, trait}, extra || {});
  };

  const sections = onlySectionId
    ? PROFILE_SECTIONS.filter(ps=>ps.id === onlySectionId)
    : PROFILE_SECTIONS.filter(ps=>ps.id !== skipSectionId);
  sections.forEach(ps=>{
    if (!profileSectionEnabled(ps)) return;
    const target = profileTarget(ps.id);

    if (ps.drawAll){
      /* Motivation & Wound: one trait from EVERY category (Want + Fear + Wound + Lie).
         At depth 2+ each category also gets a SECOND, quieter trait — a competing
         want, a background fear, a smaller old hurt — at an offset intensity.

         MEASURED STALENESS, and the three mechanical causes. Over 400 characters at
         default settings, every one of the twenty-five most repeated traits came from
         this section or Appearance — nothing from Personality, Vocabulary, Mannerisms
         or Speech appeared at all. The Motivation slots returned 23-38 distinct traits
         in 400 draws against 44-64 for every pers_* slot, with a top trait at 13%.

         Three fixes already existed in this file and had simply never been extended
         here, because they were written when app_move and the personality axes were
         the worst offenders and this section was not yet measured:

          (a) withSlotMemory — the slot-repeat penalty. Applied to five slots; these
              seven, now the worst in the bank, were not among them.
          (b) minCount + flatten — the same widen-and-soften treatment app_move and
              register get. These drew with a bare pickInRange: narrowest window, most
              concentrated falloff.
          (c) A per-category target. All seven primaries drew at the identical
              profileTarget('motivation') = 2.41, so all seven asked for the same slice
              of their pool: 23-40 eligible out of 60-77, meaning 40-60% of the authored
              Motivation content was unreachable at default settings on every single
              sheet. Spreading the seven targets across a band reaches the rest of it,
              and rotating which category gets which offset (rather than fixing it by
              index) stops "the Want is always the loud one" becoming the new tell. */
      const cats = catsOf(ps.section);
      const n = cats.length;
      const rot = n > 1 ? Math.floor(rand() * n) : 0;
      const spreadAll = (base, i) => n > 1
        ? clamp(base + (((i + rot) % n) / (n - 1) - 0.5) * MOTIVATION_TARGET_SPREAD, 1, 5)
        : base;
      cats.forEach((cat,i)=>{
        const pool = byFilter(ps.section, cat);
        const slotId = `prof_${ps.id}_${i}`;
        const tgt = spreadAll(target, i);
        const first = _drawUnique(()=>withSlotMemory(slotId, ()=>pickInRange(pool, rarityPref, tgt, 10, true)));
        seat(slotId, cat, ps.id, tgt, first);
        if (want > 1 && pool.length > 1){
          const t2 = staggered(tgt, 1);
          const secondId = `prof_${ps.id}_${i}b`;
          const second = _drawUnique(()=>withSlotMemory(secondId, ()=>pickInRange(pool, rarityPref, t2, 10, true)));
          if (second && (!first || second.id !== first.id)){
            seat(secondId, cat + " — secondary", ps.id, t2, second);
          }
        }
      });
    } else {
      const cat = resolvedCats ? resolvedCats[ps.id] : null;
      if (!cat) return;
      const pool = byFilter(ps.section, cat);

      // Primary facets within the resolved category: up to min(want, 3), staggered.
      const primaryCount = Math.min(want, 4, Math.max(1, pool.length));
      let placed = 0;
      for (let i = 0; i < primaryCount; i++){
        const tgt = staggered(target, i);
        const t = _drawUnique(()=>pickInRange(pool, rarityPref, tgt));
        if (!t) break;
        // If the pool is genuinely exhausted _drawUnique may hand back a repeat; skip it.
        if (Object.values(out).some(s => s.sectionId === ps.id && s.trait && s.trait.id === t.id)) continue;
        seat(`prof_${ps.id}_${placed}`, cat, ps.id, tgt, t);
        placed++;
      }
      if (!placed) return;

      // Depth 3+: one COUNTERPOINT trait from a different category in the same
      // section — the fallback stress response, the humor that only shows at home,
      // the vice hiding behind the discipline. Drawn at reduced intensity so it
      // reads as an under-note, and weighted through the same category machinery
      // (bans/tiers still apply) rather than a flat random pick.
      if (want >= 3){
        const otherCats = catsOf(ps.section).filter(c => c !== cat);
        if (otherCats.length){
          const altCat = pickCategoryWeighted(otherCats, null);
          const altPool = altCat ? byFilter(ps.section, altCat) : [];
          const altTgt = clamp(target - 1.2, 1, 5);
          const alt = _drawUnique(()=>pickInRange(altPool, rarityPref, altTgt));
          if (alt) seat(`prof_${ps.id}_alt`, "Counterpoint — " + altCat, ps.id, altTgt, alt, {counterpoint:true});

          // Depth 4 (exhaustive): a second, different counterpoint category, even lighter touch.
          if (want >= 4){
            const otherCats2 = otherCats.filter(c => c !== altCat);
            if (otherCats2.length){
              const altCat2 = pickCategoryWeighted(otherCats2, null);
              const altPool2 = altCat2 ? byFilter(ps.section, altCat2) : [];
              const altTgt2 = clamp(target - 1.8, 1, 5);
              const alt2 = _drawUnique(()=>pickInRange(altPool2, rarityPref, altTgt2));
              if (alt2) seat(`prof_${ps.id}_alt2`, "Counterpoint — " + altCat2, ps.id, altTgt2, alt2, {counterpoint:true});
            }
          }
        }
      }
    }
  });
  return out;
}


// ================= EMERGENT ARCHETYPE NAMING =================
// Named combinations. Primary key: "<values>|<role>" (24), secondary "<stress>|<role>" (24).
// Anything unnamed composes an adjective+noun from the same vocabulary, so every
// possible combination yields a name rather than falling back to "Custom random".
const ARCH_NAMES = {
  // --- Values × Social Role (24) ---
  "Rigid & Principled|Leader":"The Iron Standard",
  "Rigid & Principled|Peacemaker":"The Honest Broker",
  "Rigid & Principled|Instigator":"The Righteous Firebrand",
  "Rigid & Principled|Outsider":"The Exiled Conscience",
  "Rigid & Principled|Caretaker":"The Dutiful Warden",
  "Rigid & Principled|Skeptic":"The Incorruptible Auditor",
  "Pragmatic & Flexible|Leader":"The Necessary Hand",
  "Pragmatic & Flexible|Peacemaker":"The Deal-Maker",
  "Pragmatic & Flexible|Instigator":"The Useful Arsonist",
  "Pragmatic & Flexible|Outsider":"The Unaffiliated Operator",
  "Pragmatic & Flexible|Caretaker":"The Practical Guardian",
  "Pragmatic & Flexible|Skeptic":"The Cold Arithmetician",
  "Loyalty-Bound|Leader":"The Sworn Captain",
  "Loyalty-Bound|Peacemaker":"The Keeper of the Peace",
  "Loyalty-Bound|Instigator":"The Devoted Agitator",
  "Loyalty-Bound|Outsider":"The Exile Who Still Serves",
  "Loyalty-Bound|Caretaker":"The Shield-Bearer",
  "Loyalty-Bound|Skeptic":"The Watchful Retainer",
  "Self-Interested|Leader":"The Crowned Opportunist",
  "Self-Interested|Peacemaker":"The Smiling Middleman",
  "Self-Interested|Instigator":"The Profitable Spark",
  "Self-Interested|Outsider":"The Lone Survivor",
  "Self-Interested|Caretaker":"The Investing Patron",
  "Self-Interested|Skeptic":"The Hedged Cynic",
  // --- Stress Response × Social Role (24) ---
  "Fight (attack the threat)|Leader":"The War-Chief",
  "Fight (attack the threat)|Peacemaker":"The Reluctant Bruiser",
  "Fight (attack the threat)|Instigator":"The Brawler",
  "Fight (attack the threat)|Outsider":"The Cornered Wolf",
  "Fight (attack the threat)|Caretaker":"The Fierce Protector",
  "Fight (attack the threat)|Skeptic":"The Adversarial Mind",
  "Flight (remove yourself)|Leader":"The Vanishing Captain",
  "Flight (remove yourself)|Peacemaker":"The Avoidant Diplomat",
  "Flight (remove yourself)|Instigator":"The Hit-and-Run",
  "Flight (remove yourself)|Outsider":"The Drifter",
  "Flight (remove yourself)|Caretaker":"The Overwhelmed Nurse",
  "Flight (remove yourself)|Skeptic":"The Non-Committal Doubter",
  "Freeze (shut down)|Leader":"The Frozen Command",
  "Freeze (shut down)|Peacemaker":"The Silent Mediator",
  "Freeze (shut down)|Instigator":"The Stalled Provocateur",
  "Freeze (shut down)|Outsider":"The Ghost in the Room",
  "Freeze (shut down)|Caretaker":"The Numb Caregiver",
  "Freeze (shut down)|Skeptic":"The Paralyzed Analyst",
  "Fawn (appease the threat)|Leader":"The Hollow Crown",
  "Fawn (appease the threat)|Peacemaker":"The Peace-at-Any-Price",
  "Fawn (appease the threat)|Instigator":"The Apologetic Troublemaker",
  "Fawn (appease the threat)|Outsider":"The Eager Stranger",
  "Fawn (appease the threat)|Caretaker":"The Self-Erasing Servant",
  "Fawn (appease the threat)|Skeptic":"The Doubting Yes-Man",
  // --- Restored to full parity after Connector (role) and Idealistic & Visionary
  // (values) were added — without these 15, any character resolving to either new
  // category fell through to compositional naming instead of an exact match. ---
  "Rigid & Principled|Connector":"The Principled Networker",
  "Pragmatic & Flexible|Connector":"The Opportunistic Bridge",
  "Loyalty-Bound|Connector":"The Faithful Go-Between",
  "Self-Interested|Connector":"The Transactional Connector",
  "Idealistic & Visionary|Leader":"The Visionary Commander",
  "Idealistic & Visionary|Peacemaker":"The Idealistic Healer",
  "Idealistic & Visionary|Instigator":"The Righteous Agitator",
  "Idealistic & Visionary|Outsider":"The Uncompromising Dreamer",
  "Idealistic & Visionary|Caretaker":"The Devoted Reformer",
  "Idealistic & Visionary|Skeptic":"The Principled Doubter",
  "Idealistic & Visionary|Connector":"The Movement-Builder",
  "Fight (attack the threat)|Connector":"The Fierce Networker",
  "Flight (remove yourself)|Connector":"The Scattering Connector",
  "Freeze (shut down)|Connector":"The Overwhelmed Bridge",
  "Fawn (appease the threat)|Connector":"The People-Pleasing Connector",
  // --- Attachment × Social Role (28) --- A third exact-match tier, alongside
  // Values×Role and Stress×Role: without it, two characters sharing Values+Role but
  // with opposite Attachment styles (or opposite Humor) always landed on the exact
  // same generated name, since only the two original crosses were hand-named.
  "Secure|Leader":"The Steady Hand", "Secure|Peacemaker":"The Grounded Mediator",
  "Secure|Instigator":"The Confident Agitator", "Secure|Outsider":"The Contented Wanderer",
  "Secure|Caretaker":"The Reliable Anchor", "Secure|Skeptic":"The Calm Auditor",
  "Secure|Connector":"The Trusted Bridge",
  "Anxious|Leader":"The Anxious Commander", "Anxious|Peacemaker":"The Approval-Seeking Mediator",
  "Anxious|Instigator":"The Attention-Starved Spark", "Anxious|Outsider":"The Watching Wanderer",
  "Anxious|Caretaker":"The Overextended Nurturer", "Anxious|Skeptic":"The Doubt-Ridden Watcher",
  "Anxious|Connector":"The Clinging Networker",
  "Avoidant|Leader":"The Distant Command", "Avoidant|Peacemaker":"The Detached Broker",
  "Avoidant|Instigator":"The Cold-Blooded Spark", "Avoidant|Outsider":"The Self-Sealed Wanderer",
  "Avoidant|Caretaker":"The Dutiful but Distant Guardian", "Avoidant|Skeptic":"The Walled-Off Doubter",
  "Avoidant|Connector":"The Reluctant Bridge",
  "Disorganized|Leader":"The Erratic Command", "Disorganized|Peacemaker":"The Storm-Tossed Mediator",
  "Disorganized|Instigator":"The Chaotic Spark", "Disorganized|Outsider":"The Fractured Wanderer",
  "Disorganized|Caretaker":"The Overwhelmed Guardian", "Disorganized|Skeptic":"The Unmoored Doubter",
  "Disorganized|Connector":"The Tangled Bridge",
};
// Compositional vocabulary — guarantees a name for every unnamed combination.
const ARCH_ADJ = {
  "Rigid & Principled":["Unbending","Iron","Sworn"], "Pragmatic & Flexible":["Expedient","Calculating","Adaptive"],
  "Loyalty-Bound":["Faithful","Bound","Devoted"], "Self-Interested":["Self-Serving","Hungry","Unmoored"],
  "Secure":["Steady","Grounded"], "Anxious":["Restless","Clinging"], "Avoidant":["Distant","Walled"], "Disorganized":["Fractured","Storm-Tossed"],
  "Dry & Deadpan":["Dry","Deadpan","Unimpressed"], "Self-Deprecating":["Self-Mocking","Rueful","Apologetic"],
  "Cruel & Barbed":["Barbed","Cutting","Merciless"], "Warm & Playful":["Warm","Sunlit","Easy"],
  "Absurd & Chaotic":["Unhinged","Riotous","Unpredictable"], "Humorless & Absent":["Mirthless","Grave","Unsmiling"],
  "Substance & Consumption":["Sodden","Steeped","Unsteady"], "Compulsion & Ritual":["Ritual-Bound","Counting","Exacting"],
  "Risk & Escape":["Reckless","Chance-Taking","Unmoored"], "Restraint & Discipline":["Ascetic","Measured","Held"],
  // Stress categories were listed as an adjective source in emergentArchetypeName's
  // adjSrc, but had no ARCH_ADJ entries at all — so stress could never actually
  // contribute an adjective and silently dropped out of every composed name.
  "Fight (attack the threat)":["Cornered","Bristling","Unyielding"],
  "Flight (remove yourself)":["Fleeing","Half-Gone","Untethered"],
  "Freeze (shut down)":["Frozen","Stalled","Silent"],
  "Fawn (appease the threat)":["Yielding","Placating","Bending"],
  "Idealistic & Visionary":["Visionary","Idealist","Hopeful"], "Intellectual & Wordplay":["Clever","Sharp-Tongued","Witty"],
  "Avoidance & Procrastination":["Evasive","Elusive","Delaying"],
};
const ARCH_NOUN = {
  "Leader":["Commander","Captain","Head"], "Peacemaker":["Mediator","Binder","Peacekeeper"],
  "Instigator":["Provocateur","Spark","Agitator"], "Outsider":["Outsider","Stranger","Wanderer"],
  "Caretaker":["Guardian","Keeper","Tender"], "Skeptic":["Skeptic","Doubter","Auditor"],
  "Fight (attack the threat)":["Fighter"], "Flight (remove yourself)":["Runner"],
  "Freeze (shut down)":["Stillness"], "Fawn (appease the threat)":["Appeaser"],
  "Connector":["Connector","Bridge","Networker"],
  /* Only Role and Stress supplied nouns, so every composed name had the same shape and
     the four other profile facts could contribute an adjective at most. Values,
     Attachment, Humor and Vices now supply nouns too. */
  "Rigid & Principled":["Zealot","Absolutist","Oath-Keeper"], "Pragmatic & Flexible":["Operator","Fixer","Broker"],
  "Loyalty-Bound":["Retainer","Hand","Sworn Friend"], "Self-Interested":["Opportunist","Climber","Free Agent"],
  "Idealistic & Visionary":["Believer","Visionary","Dreamer"],
  "Secure":["Anchor","Constant"], "Anxious":["Worrier","Hoverer"],
  "Avoidant":["Recluse","Absentee"], "Disorganized":["Weathervane","Contradiction"],
  "Dry & Deadpan":["Straight Face","Dry Wit"], "Self-Deprecating":["Punchline","Apologist"],
  "Cruel & Barbed":["Blade","Needler"], "Warm & Playful":["Warmth","Delight"],
  "Absurd & Chaotic":["Riot","Loose Cannon"], "Humorless & Absent":["Stone Face","Sober Judge"],
  "Intellectual & Wordplay":["Wordsmith","Punster"],
  "Substance & Consumption":["Drinker","Indulgent"], "Compulsion & Ritual":["Ritualist","Counter"],
  "Risk & Escape":["Gambler","Bolter"], "Restraint & Discipline":["Ascetic","Abstainer"],
  "Avoidance & Procrastination":["Postponer","Deferrer"],
};
// Deterministic when a seed is given (mulberry32 PRNG off a string hash), otherwise
// falls back to rand(). Lets any caller opt into repeatable output — e.g. the
// same character name always composing the same emergent title — without a global mode.
function seededRandom(seed){
  let h = 0;
  for (let i=0;i<seed.length;i++){ h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
  return function(){
    h |= 0; h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pickFrom(arr, seed){
  const roll = seed ? seededRandom(String(seed)) : rand;
  return arr[Math.floor(roll()*arr.length)];
}
function emergentArchetypeName(st){
  const catOf = id => slotCat(st["prof_"+id+"_0"]);
  const values = catOf("values"), role = catOf("role"), stress = catOf("stress");
  const attach = catOf("attachment"), humor = catOf("humor"), vices = catOf("vices");
  /* The name keyed off Values+Role, then Stress+Role, then Attachment+Role. Measured
     over 400 characters: the exact table hit 400 times out of 400, so the compositional
     branch below was unreachable in practice and the name depended on exactly two of
     the seven profile facts. Humor and Vices — the two that carry the most texture —
     could never affect it. 400 characters produced 35 distinct names.

     The hand-written exact names are better writing than anything composition produces,
     so they keep priority; they just no longer take every single roll. The coin is
     seeded on the WHOLE profile, so it stays deterministic per character (the same
     sheet always shows the same name) while two characters who share Values and Role
     but differ in Humor or Vices can now diverge. */
  const seed = [values, role, stress, attach, humor, vices].filter(Boolean).join("|");
  const exactName = (values && role && ARCH_NAMES[values+"|"+role])
                 || (stress && role && ARCH_NAMES[stress+"|"+role])
                 || (attach && role && ARCH_NAMES[attach+"|"+role])
                 || null;

  const adjSrc = [values, attach, humor, vices, stress].filter(c=>c && ARCH_ADJ[c]);
  const nounSrc = [role, stress, values, attach, humor, vices].filter(c=>c && ARCH_NOUN[c]);
  const composed = (()=>{
    if (adjSrc.length && nounSrc.length){
      const adj  = pickFrom(ARCH_ADJ[pickFrom(adjSrc, seed+"a")], seed+"a2");
      const noun = pickFrom(ARCH_NOUN[pickFrom(nounSrc, seed+"n")], seed+"n2");
      // "The Barbed Blade" — an adjective and noun from the same category is a tautology
      if (adj.toLowerCase() === noun.toLowerCase()) return null;
      return "The " + adj + " " + noun;
    }
    if (nounSrc.length) return "The " + pickFrom(ARCH_NOUN[pickFrom(nounSrc, seed+"n")], seed+"n2");
    return null;
  })();

  if (exactName && composed) {
    // 45/55 toward the exact table: it is the better-written half, but not so dominant
    // that composition goes back to being dead code.
    return seededRandom(seed + "pick")() < 0.45
      ? {name: exactName, exact: true}
      : {name: composed, exact: false};
  }
  if (exactName) return {name: exactName, exact: true};
  if (composed) return {name: composed, exact: false};
  return null;
}

// ================= SOFT TENSION FLAGS (non-blocking) =================
// Distinct from hard conflicts: these combinations are coherent but uncommon.
const TENSION_RULES = [
  {a:{sec:"attachment",cat:"Secure"}, b:{sec:"motivation",fragment:"Betrayed by kin|Abandoned young|Broken promise|Physically harmed"},
   note:"Secure attachment alongside a betrayal/abandonment wound is possible — it usually means real repair happened. Worth knowing what did it."},
  {a:{sec:"values",cat:"Rigid & Principled"}, b:{sec:"humor",cat:"Cruel & Barbed"},
   note:"Strict principles with cruel humour: the cruelty is likely aimed only at those they judge to have failed the standard."},
  {a:{sec:"role",cat:"Leader"}, b:{sec:"stress",cat:"Freeze (shut down)"},
   note:"A leader who freezes under pressure is dramatically rich, but the group will notice. Consider when they've been caught out."},
  {a:{sec:"values",cat:"Self-Interested"}, b:{sec:"role",cat:"Caretaker"},
   note:"Self-interest in a caretaking seat — the care is real but transactional. Ask what they're collecting."},
  {a:{sec:"vices",cat:"Restraint & Discipline"}, b:{sec:"stress",cat:"Flight (remove yourself)"},
   note:"Rigorous self-discipline paired with a flight response: the routine is likely the thing they flee into."},
  {a:{sec:"attachment",cat:"Avoidant"}, b:{sec:"role",cat:"Caretaker"},
   note:"Avoidant attachment in a caretaker: they tend to everyone's needs precisely so nobody asks about theirs."},
  {a:{sec:"humor",cat:"Warm & Playful"}, b:{sec:"motivation",fragment:"Fear of intimacy|unlovable|Nobody stays"},
   note:"Warm humour over an intimacy fear — the charm is usually the defence. Very playable."},
  {a:{sec:"values",cat:"Loyalty-Bound"}, b:{sec:"attachment",cat:"Disorganized"},
   note:"Absolute loyalty with disorganized attachment: they will not leave, and will not be at peace staying."},
];
function softTensionsFor(st){
  const out = [];
  const catOf = id => slotCat(st["prof_"+id+"_0"]);
  const motivText = Object.keys(st).filter(k=>k.startsWith("prof_motivation_") && st[k] && st[k].trait)
                    .map(k=>st[k].trait.trait+" "+st[k].trait.desc).join(" | ");
  const match = (spec) => {
    if (spec.sec === "motivation") return spec.fragment ? new RegExp(spec.fragment,"i").test(motivText) : false;
    return catOf(spec.sec) === spec.cat;
  };
  TENSION_RULES.forEach(r=>{ if (match(r.a) && match(r.b)) out.push(r.note); });
  return out;
}

// ================= COHERENCE SCORE =================
// Measures how many of the chosen categories were actually reinforced by the
// weight matrix versus arrived at independently. Not a quality judgement.
/* ================= SECOND-ORDER TENSIONS =================
   The pairwise detector catches "trait A pulls +honesty, trait B pulls -honesty."
   These rules catch PATTERNS: specific three-part configurations of resolved
   categories and axis posture that add up to a recognizable kind of person —
   often the most interesting thing on the sheet, so they get named. Each rule:
   {need: predicates over categories present + axis sums, name, note}. */
function _catsPresent(st){
  const cats = new Set();
  Object.values(st).forEach(s=>{ if (s && s.trait) cats.add(s.trait.category); });
  return cats;
}
const SECOND_ORDER_RULES = [
  {name:"The honest appeaser",
   test:(c,ax)=> c.has("Fawn (appease the threat)") && (ax.hon||0) >= 2,
   note:"Deep truthfulness plus a fawn stress response: they cannot lie and cannot confront, so under pressure they tell the truth apologetically, softening facts they refuse to change. Scenes with them read as confession delivered as customer service."},
  {name:"The armoured caretaker",
   test:(c,ax)=> c.has("Caretaker") && (ax.emo||0) <= -2,
   note:"Devoted caretaking with a sealed interior: all love is expressed logistically — food, repairs, cover — and direct emotional bids make them visibly uncomfortable. The care is real; the words for it are missing."},
  {name:"The principled deceiver",
   test:(c,ax)=> c.has("Rigid & Principled") && (ax.hon||0) <= -2,
   note:"An unbendable private code inside a habitually dishonest exterior. They lie freely about small things and are absolutely immovable on the few things that count — and outsiders can't tell which register they're in."},
  {name:"The lonely connector",
   test:(c,ax)=> c.has("Connector") && (ax.warm||0) <= -1,
   note:"Runs everyone's relationships while staying personally unreachable. The web of introductions and favours is real infrastructure — and it's also the wall."},
  {name:"The volatile perfectionist",
   test:(c,ax)=> (c.has("Compulsion & Ritual") || c.has("Upkeep — Immaculate")) && (ax.mood||0) <= -2,
   note:"Ritual and immaculate order maintained on top of visible emotional volatility: the discipline isn't a personality, it's a container. Watch what happens to the routine on the bad days — that's the barometer everyone learns to read."},
  {name:"The doubting idealist",
   test:(c,ax)=> c.has("Idealistic & Visionary") && (ax.pos||0) <= -1,
   note:"Committed to a vision they no longer fully believe will arrive. They keep building anyway, which reads either as heroism or as inability to stop, depending on the day and the observer."},
  {name:"The frozen leader",
   test:(c,ax)=> c.has("Leader") && c.has("Freeze (shut down)"),
   note:"Carries command in ordinary time and locks up in crisis — the exact moment the role exists for. Either the group has quietly built around this, or the first real emergency will be the story."},
  {name:"The self-erasing instigator",
   test:(c,ax)=> c.has("Instigator") && (ax.ego||0) <= -2,
   note:"Destabilizes every room while holding themselves in contempt. The provocations aren't confidence; they're a way of mattering to a group they don't believe would keep them otherwise."},
  {name:"The secure cynic",
   test:(c,ax)=> c.has("Secure") && (ax.pos||0) <= -2,
   note:"Expects the worst of the world and none of it from their people. Total pessimism about plans, institutions, and weather; total, unshakeable faith in about four specific humans."},
  {name:"The disciplined escapist",
   test:(c,ax)=> c.has("Risk & Escape") && (ax.disc||0) >= 2,
   note:"Meticulous, controlled, reliable — and periodically, deliberately, courts real danger. The recklessness is scheduled. That's the unsettling part."},
];
function secondOrderTensions(st){
  const cats = _catsPresent(st);
  const ax = axisProfile(st);
  return SECOND_ORDER_RULES.filter(r=>{ try{ return r.test(cats, ax); }catch(e){ return false; } })
    .map(r=>({name:r.name, note:r.note}));
}

/* Evaluate a SAVED SHEET as a pure function of itself.
   `coherenceScore(st)` reads like one — it takes the sheet as its only argument — but
   it called accumulateBoost with no configuration, so every axis level came from
   whatever the live sliders happened to say and the motivation cross-links came from
   whatever build ran last. Moving a slider without regenerating took one sheet from
   17% to 92%; a cast export scored six characters using the single-character tab's
   settings. A diagnostic that changes when you touch an unrelated control is not
   measuring the character.

   This derives the evaluation context FROM the sheet: personality levels from its own
   trait polarity, motivation cross-links from its own motivation traits, and no
   archetype hint at all (an archetype is an input to generation, not a property of a
   finished character). Pure in, pure out — the same sheet always scores the same. */
function sheetOverrides(st){
  const o = {};
  const prof = (typeof axisProfile === 'function') ? axisProfile(st) : {};
  PERSONALITY_AXES.forEach(a=>{
    const code = AXIS_TO_POLCODE[a.id];
    const v = code ? (prof[code] || 0) : 0;
    // axisProfile is normalised to roughly -2..2; axisLevel wants raw -100..100.
    o[a.id] = Math.round(clamp(v * 50, -100, 100));
  });
  VOICE_AXES.forEach(a=>{
    const code = AXIS_TO_POLCODE[a.id];
    o[a.id] = code ? Math.round(clamp((prof[code] || 0) * 50, -100, 100)) : 0;
  });
  return o;
}
function withSheetContext(st, fn){
  const priorLinks = CURRENT_MOTIVATION_LINKS;
  const priorArch = CURRENT_ARCHETYPE_PROFILE;
  try {
    const motivTraits = Object.keys(st)
      .filter(k=>k.startsWith('prof_' + MOTIVATION_SECTION_ID + '_'))
      .map(k=>st[k] && st[k].trait).filter(Boolean);
    setMotivationLinks(motivTraits.length ? motivationCrosslinkMap(motivTraits) : null);
    CURRENT_ARCHETYPE_PROFILE = null;
    return fn(sheetOverrides(st));
  } finally {
    CURRENT_MOTIVATION_LINKS = priorLinks;
    CURRENT_ARCHETYPE_PROFILE = priorArch;
  }
}
function coherenceScore(st){
  return withSheetContext(st, ov => _coherenceScoreInner(st, ov));
}
function _coherenceScoreInner(st, OV){
  const chosen = {};
  PROFILE_SECTIONS.forEach(ps=>{ const c = slotCat(st["prof_"+ps.id+"_0"]); if (c) chosen[ps.id] = c; });
  let reinforced = 0, total = 0;
  const kinds = {vocab:VOCAB_CATS, grammar:GRAMMAR_CATS, manner:MANNER_CATS};
  Object.entries(kinds).forEach(([kind, cats])=>{
    const fragMap = accumulateBoost(kind, chosen, OV);
    const boostMap = resolveBoostMapForCats(cats, fragMap);
    const picked = Object.keys(st).filter(k=>{
      if (kind==='vocab') return k.startsWith('vocab');
      if (kind==='grammar') return k==='grammar';
      return k.startsWith('manner');
    }).map(k=>slotCat(st[k])).filter(Boolean);
    picked.forEach(c=>{ total++; if ((boostMap.get(c)||0) > 0) reinforced++; });
  });
  PROFILE_SECTIONS.forEach(ps=>{
    if (ps.drawAll || !chosen[ps.id]) return;
    const fragMap = accumulateBoost(ps.id, {}, OV);
    const boostMap = resolveBoostMapForCats(catsOf(ps.section), fragMap);
    total++; if ((boostMap.get(chosen[ps.id])||0) > 0) reinforced++;
  });
  if (!total) return null;
  const pct = Math.round(100 * reinforced / total);

  // ---- Chance baseline ----------------------------------------------------
  // Raw coherence alone is misleading: depth-first resolves profile categories
  // FIRST, which then boost large swathes of the voice categories, so a bigger
  // share of the pool counts as "reinforced" before any pick is even made. The
  // score therefore rises for structural reasons rather than because the
  // character hangs together better. So we also compute what a purely random
  // character would score given the exact same boost maps, and report the lift
  // over that. Lift is what actually tells you something.
  let baseHits = 0, baseTotal = 0, baseVar = 0;
  Object.entries(kinds).forEach(([kind, cats])=>{
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(kind, chosen, OV));
    const boostedCount = cats.filter(c=>(boostMap.get(c)||0) > 0).length;
    const picksOfKind = Object.keys(st).filter(k=>{
      if (kind==='vocab') return k.startsWith('vocab');
      if (kind==='grammar') return k==='grammar';
      return k.startsWith('manner');
    }).length;
    // expected share of random picks that would land on a boosted category
    const p = cats.length ? boostedCount/cats.length : 0;
    baseHits += picksOfKind * p;
    baseVar  += picksOfKind * p * (1 - p);
    baseTotal += picksOfKind;
  });
  PROFILE_SECTIONS.forEach(ps=>{
    if (ps.drawAll || !chosen[ps.id]) return;
    const cats = catsOf(ps.section);
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(ps.id, {}, OV));
    const boostedCount = cats.filter(c=>(boostMap.get(c)||0) > 0).length;
    const p = cats.length ? boostedCount/cats.length : 0;
    baseHits += p;
    baseVar  += p * (1 - p);
    baseTotal += 1;
  });
  const basePct = baseTotal ? Math.round(100 * baseHits / baseTotal) : 0;
  const lift = pct - basePct;
  // The baseline is a single number derived from a handful of picks, and it was being
  // reported as though it were exact — so a +9 lift on eight picks read as more
  // meaningful than it is. Each pick is an independent Bernoulli trial with a known
  // probability, so the spread is available in closed form (no simulation needed):
  // report the 95% band, and say plainly when the lift sits inside it.
  const baseSd = baseTotal ? Math.sqrt(baseVar) / baseTotal * 100 : 0;
  const baseBand = Math.round(1.96 * baseSd);
  const significant = Math.abs(lift) > baseBand;

  // Label is now driven by LIFT, not raw percentage, so it means the same thing
  // whichever generation mode produced the character.
  let label;
  if (lift >= 25) label = "Tightly coherent — picks reinforce each other well beyond chance.";
  else if (lift >= 10) label = "Moderately coherent — a real pull toward consistency.";
  else if (lift >= -5) label = "About as connected as a random draw — fine for surprise, harder to justify.";
  else label = "Deliberately scattered — picks actively avoid the expected pairings.";
  if (!significant) label = "Within the noise for this many picks — the reinforcement here isn't distinguishable from chance.";
  return {pct, basePct, lift, label, reinforced, total, baseBand, significant};
}

/* ================= CARICATURE GUARD =================
   FREQ_BUDGET already tells you, per trait, how often it should surface. What nothing
   told you is the compound effect: three or four traits each rated "most scenes" is a
   character who is loud in four different directions at once, which is the single most
   common way a generated sheet stops reading as a person. Advisory, like the budget —
   but stated at the level where the problem actually exists. */
/* A flat "three or more loud traits" threshold made this a readout of where the sliders
   were sitting, not a fact about the character: measured over 400 sheets it fired 0/400
   at neutral sliders and 400/400 at extreme ones, mean 16.7 loud traits. At the top of
   the range a loud sheet is what was ASKED for, and warning about it every time trains
   the user to ignore the panel; at the bottom, three loud traits is genuinely unusual
   and got no warning at all.

   Score against what this sheet's own settings should have produced instead. Every slot
   carries the target it was drawn against, and the eligible window around that target is
   recoverable, so the share of that window sitting at intensity 4+ is the per-slot
   probability of a loud draw. Summing those gives the expected loud count for these
   exact settings — the same "compare against a chance baseline" technique coherenceScore
   already uses. Then the warning means "louder than you asked for", which is a fact
   about the character, at any slider position. */
/* PERF: this re-runs rangeSelect for every slot on the sheet, on every render that
   evaluates the caricature guard — a second full pass over the same pools immediately
   after the build has just walked them. The answer for a given (section, category,
   target) is a pure function of the pool and the current band width, so it is cached
   for the lifetime of one evaluation pass and invalidated whenever the slider cache is.
   A default sheet drops from ~38 rangeSelect calls per render to roughly the number of
   distinct pools it actually draws from. */
const _loudPCache = new Map();
function _invalidateLoudCache(){ _loudPCache.clear(); }
function expectedLoudCount(st){
  let expected = 0, variance = 0, measurable = 0;
  Object.values(st || {}).forEach(s=>{
    if (!s || !s.trait || s.target === undefined || s.target === null) return;
    const key = s.trait.section + "||" + s.trait.category + "@" + s.target.toFixed(3);
    const hit = _loudPCache.get(key);
    if (hit !== undefined){
      expected += hit; variance += hit * (1 - hit); measurable++;
      return;
    }
    const pool = byFilter(s.trait.section, s.trait.category);
    if (pool.length < 2) return;
    const sel = rangeSelect(pool, s.target, 4);
    const {list} = sel;
    if (!list.length) return;
    /* Weight by the same proximity kernel the picker uses, not uniformly over the
       window: a uniform estimate counted every trait in a widened band equally and so
       overstated the expected loudness by more than half at the top of the sliders
       (29 against a measured 18.6), which is exactly where the warning most needed to
       be calibrated. */
    const w = proximityWeights(list, sel.target, sel.half, false);
    const total = w.reduce((a,b)=>a+b, 0);
    if (!total) return;
    // position 3.5 is the boundary above which a trait rounds to intensity 4
    let loudW = 0;
    list.forEach((t,i)=>{ if (traitPos(t) >= 3.5) loudW += w[i]; });
    const p = loudW / total;
    _loudPCache.set(key, p);
    expected += p;
    /* Each slot is one Bernoulli draw, so the count's variance is the sum of p(1-p) —
       NOT sqrt(mean). The difference matters at the ends of the sliders: there most
       slots have p near 0 or near 1, so the count is far tighter than a Poisson
       assumption implies, and using sqrt(mean) there sets the bar so high the warning
       could never fire at all. */
    variance += p * (1 - p);
    measurable++;
  });
  return {expected, variance, measurable};
}

function loudnessCheck(st){
  const loud = [];
  Object.values(st || {}).forEach(s=>{
    if (s && s.trait && (s.trait.intensity||0) >= 4) loud.push(s.trait);
  });
  if (loud.length < 3) return null;

  const {expected, variance, measurable} = expectedLoudCount(st);
  /* KNOWN LIMIT. This models the eligibility WINDOW and the proximity kernel, but not
     the rarity, tier, affinity and uniqueness pressure the picker also applies —
     CURRENT_AFFINITY_VEC in particular is live only during a build and cannot be
     recovered afterwards. Measured, the estimate tracks closely at neutral and mid
     sliders (0.70 predicted against 0.74 observed, 0.73 against 0.91), which is where
     the warning has to discriminate, and over-predicts at the top of the range (28.6
     against 18.4), which makes it conservative exactly where a loud sheet is what was
     asked for. Erring quiet at the extremes is the behaviour we want; it is worth
     knowing it is partly an artefact rather than entirely a decision.

     Below a handful of measurable slots the baseline is too noisy to reason from, so
     fall back to the flat threshold rather than inventing a comparison. */
  const haveBaseline = measurable >= 8;
  /* Poisson-ish: the count is a sum of independent per-slot draws, so its spread scales
     with the true standard deviation of the per-slot Bernoulli sum. 1.5 sigma puts the
     warning at roughly the top few percent of sheets for whatever the settings happen to
     be, rather than at a fixed count that only ever reflected slider position. */
  const slack = 1.5 * Math.max(1, Math.sqrt(variance));
  if (haveBaseline && loud.length <= expected + slack) return null;

  const names = loud.slice(0, 5).map(t=>t.trait);
  const baselineNote = haveBaseline
    ? `Your current settings would typically produce about <b>${expected.toFixed(1)}</b>, so this one came out louder than you asked for. `
    : ``;
  return {
    count: loud.length, expected: haveBaseline ? expected : null, names,
    note: `This sheet carries <b>${loud.length}</b> traits at intensity 4 or 5 — ${names.join(", ")}${loud.length>names.length?", and more":""}. `
        + baselineNote
        + `Each of those is meant to be load-bearing on its own, so together they read as loud in ${loud.length} different directions. `
        + `The best characters are usually one loud thing and a lot of texture: consider pinning the one that matters lower on the others, or asking what's quiet about them.`
  };
}

/* ================= DISTINCTIVENESS ACROSS THE SESSION =================
   renderNovelty answers "is this different from the LAST one?", which is the wrong
   question after your fourth character: four sheets can each differ from their
   immediate predecessor while all four orbit the same centre. Compare against the
   centroid of everything generated this session instead, so the outliers are findable. */
let sessionProfiles = [];   // axisProfile vectors, one per generated character
function rememberProfile(prof){ if (prof && Object.keys(prof).length) sessionProfiles.push(prof); }
function forgetSessionProfiles(){ sessionProfiles = []; }
function _profileDistance(a, b){
  const keys = new Set([...Object.keys(a||{}), ...Object.keys(b||{})]);
  let sum = 0;
  keys.forEach(k=>{ const d = (a[k]||0) - (b[k]||0); sum += d*d; });
  return Math.sqrt(sum);
}
function sessionDistinctiveness(prof){
  if (!prof || sessionProfiles.length < 2) return null;
  const centroid = {};
  sessionProfiles.forEach(p=> Object.entries(p).forEach(([k,v])=>{ centroid[k] = (centroid[k]||0) + v/sessionProfiles.length; }));
  const d = _profileDistance(prof, centroid);
  const others = sessionProfiles.map(p=>_profileDistance(p, centroid)).sort((x,y)=>x-y);
  // Where this character sits among everything else generated this session.
  const rank = others.filter(x=> x < d).length;
  const pct = Math.round(100 * rank / Math.max(1, others.length - 1));
  const label = pct >= 80 ? "An outlier for this session — furthest from your own centre of gravity."
    : pct >= 50 ? "Above your session average — recognisably its own thing."
    : pct >= 20 ? "Near the middle of everything you've generated today."
    : "Close to your session centroid — this is the character you keep making.";
  return {distance: Math.round(d*10)/10, pct, count: sessionProfiles.length, label};
}

/* ================= "WHY NOT?" =================
   The why? panel explains a pick. This explains an ABSENCE, which is the question a
   user actually asks when a trait they wanted never turns up — and it is answerable
   from data already computed: the trait's active band against the current slider
   position, plus the hard filters standing in front of it. */
function explainWhyNot(trait){
  if (!trait) return "No trait by that name.";
  const out = [];
  const cat = trait.category;
  if (bannedTraitIds.has(trait.id)) out.push(`It is <b>banned by name</b> in your constraints, so nothing else matters until you remove that.`);
  if (bannedCategories.has(cat)) out.push(`Its whole category, "${cat}", is <b>banned</b> in your constraints.`);
  if (typeof bannedSections !== 'undefined' && bannedSections.has(trait.section)) out.push(`Its whole section, "${trait.section}", is <b>banned</b> in your constraints.`);
  const spec = PRESENTATION_VARIANTS[cat];
  if (rarityCaps[rarityTier(trait)] === 0){
    out.push(`You have capped <b>${rarityTier(trait)}</b> traits at zero for this sheet, and this is one — see Budgets.`);
  }
  if (spec && trait.variant && charVariants[cat] && charVariants[cat] !== trait.variant){
    out.push(`This character is locked to the <b>${spec[charVariants[cat]].label}</b> presentation of "${cat}", and this trait belongs to the other one. Regenerate to reroll the presentation lock.`);
  }
  const tierNote = categoryTiers.get(cat);
  if (tierNote === 'rarely') out.push(`You've set "${cat}" to <b>rarely</b> (×¼), so its whole category is being suppressed.`);
  if (cat === AXES.circular.category && tierNote !== 'prefer'){
    out.push(`"${cat}" is only reached through the high-volume branch of the Verbosity slider, as a minority of those draws. ` +
             `Push <b>Verbosity</b> up, or set this category to <b>prefer</b> in Constraints to make it the likely outcome instead.`);
  }
  // The band: the real, checkable reason most of the time.
  const [lo, hi] = traitBand(trait);
  const axis = PERSONALITY_AXES.find(a=>a.pos===cat || a.neg===cat || a.mid===cat);
  let cur = null, driver = null;
  if (axis){ cur = Math.abs(intVal('pers_'+axis.id, 0)); driver = axis.label; }
  else if (trait.section === "Verbosity Traits"){ cur = Math.abs(intVal('verbositySlider', 0)); driver = "Verbosity"; }
  else if (cat === "Register & Formality Spectrum" || cat === "Stylized & Elaborate"){ cur = Math.abs(intVal('registerSlider', 0)); driver = "Register"; }
  if (cur !== null){
    if (cur < lo) out.push(`Its active range is <b>${lo}–${hi}</b> and your <b>${driver}</b> slider is at magnitude <b>${cur}</b> — below the window. Push that slider further from centre and it becomes eligible.`);
    else if (cur > hi) out.push(`Its active range is <b>${lo}–${hi}</b> and your <b>${driver}</b> slider is at magnitude <b>${cur}</b> — past the window. This trait is too quiet for the intensity you're asking for; ease that slider back toward centre.`);
    else out.push(`It <b>is</b> eligible right now: its active range is ${lo}–${hi} and your <b>${driver}</b> slider sits at ${cur}. It simply hasn't come up — the draw is weighted, never guaranteed. Use "Always include" if you want it every time.`);
  } else {
    if (axis && axis.mid === cat) out.push(`Situational traits only draw while that axis sits inside the neutral band.`);
    out.push(`It sits at continuous intensity position <b>${traitPos(trait).toFixed(2)}</b>, giving it an active range of <b>${lo}–${hi}</b>. Whichever signal drives "${cat}" has to land inside that window before it is eligible at all.`);
  }
  const pool = TRAITS_BY_KEY.get(trait.section+"||"+cat) || [];
  out.push(`For scale: "${cat}" holds ${pool.length} traits, so even when everything lines up this one is competing with ${pool.length-1} others.`);
  return out.map(x=>`<div style="margin:4px 0;">${x}</div>`).join("");
}

// ================= DEPTH-FIRST STAGED GENERATION =================
// Reverses the causal order: resolve the deep facts (wound, attachment, values,
// stress) FIRST, derive personality slider positions FROM them, then build voice.
const DEPTH_TO_PERSONALITY = {
  "Secure":{confidence:45, emotionalcapacity:35}, "Anxious":{confidence:-55, emotionalcapacity:45},
  "Avoidant":{emotionalcapacity:-65, friendliness:-40}, "Disorganized":{discipline:-35, emotionalcapacity:20},
  "Rigid & Principled":{discipline:55, honesty:60, rebelliousness:-20}, "Pragmatic & Flexible":{honesty:-35, intelligence:40},
  "Loyalty-Bound":{friendliness:40, agreeableness:35}, "Self-Interested":{friendliness:-45, honesty:-50},
  "Fight (attack the threat)":{assertiveness:60, agreeableness:-45}, "Flight (remove yourself)":{assertiveness:-40},
  "Freeze (shut down)":{confidence:-50}, "Fawn (appease the threat)":{agreeableness:60, assertiveness:-55},
  "Leader":{assertiveness:50, confidence:45}, "Peacemaker":{agreeableness:50, friendliness:40},
  "Instigator":{rebelliousness:55, agreeableness:-35}, "Outsider":{friendliness:-50, rebelliousness:30},
  "Caretaker":{friendliness:50, emotionalcapacity:40}, "Skeptic":{intelligence:50, positivity:-35, curiosity:35},
  "Dry & Deadpan":{intelligence:35, emotionalcapacity:-30}, "Self-Deprecating":{confidence:-45},
  "Cruel & Barbed":{friendliness:-45, agreeableness:-35}, "Warm & Playful":{friendliness:50, positivity:45},
  "Absurd & Chaotic":{discipline:-45, rebelliousness:35}, "Humorless & Absent":{positivity:-40, discipline:30},
  "Substance & Consumption":{discipline:-50}, "Compulsion & Ritual":{discipline:35, confidence:-30},
  "Risk & Escape":{discipline:-45, rebelliousness:40}, "Restraint & Discipline":{discipline:65},
  "Connector":{friendliness:40, activeness:30}, "Idealistic & Visionary":{honesty:35, positivity:45, curiosity:30},
  "Intellectual & Wordplay":{intelligence:40, curiosity:40}, "Avoidance & Procrastination":{discipline:-45, confidence:-25, curiosity:-20},
};
function deriveDepthCategories(){
  // Resolve profile types with NO personality influence — pure roll / manual choice.
  /* The uniqueness registry is build-scoped and was NOT reset here, so this draw
     rejected whatever the PREVIOUS character had seated — the depth-first foundation
     was a function of the last character generated, and the same seed therefore
     planted different foundations on its second run. buildCharacterState resets it for
     its own draws; this runs before that, so it has to do the same. */
  _buildUsedIds = new Set();
  /* The trait-level affinity vector is live only during a build and was left pointing
     at the PREVIOUS character's posture — so this draw, which is meant to be untouched
     by any slider, was in fact weighted by the last person generated. Depth-first's
     whole premise is "decide who they are before deciding how they speak", and it was
     quietly starting from whoever came before. Zero it, matching ZERO_PERSONALITY. */
  const _priorAffinity = CURRENT_AFFINITY_VEC;
  setAffinityVec(ZERO_PERSONALITY());
  try {
  const chosen = {};
  /* Motivation & Wound resolves first here for the same reason it draws first in
     buildCharacterState: it is drawAll, so it needs nothing resolved, and going first is
     what lets its cross-links reach the six sections that follow. Without this,
     depth-first mode derived nothing from the section the sheet leads with. */
  setMotivationLinks(null);
  const motivDepth = pickProfileSlots('balanced', null, MOTIVATION_SECTION_ID);
  const motivTraits = Object.values(motivDepth).map(s0=>s0 && s0.trait).filter(Boolean);
  setMotivationLinks(motivationCrosslinkMap(motivTraits));
  lastDepthMotivation = motivTraits;
  PROFILE_SECTIONS.forEach(ps=>{
    if (ps.drawAll) return;
    if (!profileSectionEnabled(ps)) return;
    const sel = document.getElementById('type_'+ps.id);
    // A value depth-first itself wrote on a PREVIOUS run is not a user choice. Without
    // this the second run treated the first run's automatic pick as a fixed manual
    // selection, and every later exploration froze a little more of the character in
    // place with nothing on screen saying so.
    if (sel && sel.value && !AUTO_PROFILE_TYPES.has(ps.id)) { chosen[ps.id] = sel.value; return; }
    const cats = catsOf(ps.section);
    // biased only by already-chosen deep facts, never by sliders
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(ps.id, chosen, ZERO_PERSONALITY()));
    chosen[ps.id] = pickCategoryWeighted(cats, boostMap);
  });
  return chosen;
  } finally { CURRENT_AFFINITY_VEC = _priorAffinity; }
}
function ZERO_PERSONALITY(){
  const o={};
  PERSONALITY_AXES.forEach(a=>o[a.id]=0);
  // Depth-first resolution is meant to be untouched by ANY current slider, voice
  // included — without this, verbosity/register/composure would still leak in via
  // axisLevel's live-DOM fallback now that they're wired into the same signal system.
  VOICE_AXES.forEach(a=>o[a.id]=0);
  return o;
}
/* Set by deriveDepthCategories so personalityFromDepth can see the wound it just drew.
   Motivation is drawAll, so a category-keyed DEPTH_TO_PERSONALITY entry would apply
   identically to every character ever generated and say nothing — the signal is in
   WHICH trait was drawn, not which category it came from. */
let lastDepthMotivation = [];
/* Each Motivation category still gets a DEPTH_TO_PERSONALITY entry, because the section
   IS a statement about a person even before you know which trait: someone with a
   foregrounded wound and a named defence is, on average, more guarded and more driven
   than someone without. Kept deliberately small — these apply to every character, so
   they set a floor, and the trait-level derivation below is what actually varies. */
Object.assign(DEPTH_TO_PERSONALITY, {
  "Core Wound (the old injury)":{emotionalcapacity:-15, confidence:-10},
  "The Defence (what they built on top)":{emotionalcapacity:-20, discipline:15},
  "The Need (what would actually help)":{emotionalcapacity:20},
  "The Ghost (who or what it's attached to)":{emotionalcapacity:15, positivity:-10},
  "Core Fear (what they flee)":{confidence:-15},
  "Core Want (conscious goal)":{discipline:15, curiosity:10},
  "The Lie They Believe":{honesty:-10, positivity:-15},
});
function personalityFromDepth(chosen){
  const acc = {}; const counts = {};
  Object.values(chosen).forEach(cat=>{
    const map = DEPTH_TO_PERSONALITY[cat];
    if (!map) return;
    Object.entries(map).forEach(([axis,val])=>{
      acc[axis] = (acc[axis]||0) + val; counts[axis] = (counts[axis]||0)+1;
    });
  });
  /* And the part that varies: the drawn wound's own polarity, read through the same
     AXIS_TO_POLCODE mapping everything else uses, so a wound of "Betrayed by kin" and
     one of "Chronically overlooked" derive different people rather than the same
     average. Scaled well below a resolved category's contribution — a single trait
     should colour the derived personality, not define it. */
  const polToAxis = {};
  Object.entries(AXIS_TO_POLCODE).forEach(([axisId, code])=> polToAxis[code] = axisId);
  lastDepthMotivation.forEach(t=>{
    const weight = clamp((t.intensity || 3) / 3, 0.4, 1.6);
    Object.entries(t.pol || {}).forEach(([code, v])=>{
      const axisId = polToAxis[code];
      if (!axisId || !v) return;
      acc[axisId] = (acc[axisId] || 0) + v * 22 * weight;
      counts[axisId] = (counts[axisId] || 0) + 1;
    });
  });
  const out = {};
  PERSONALITY_AXES.forEach(a=>{
    if (counts[a.id]){
      out[a.id] = Math.round(clamp(acc[a.id]/counts[a.id], -100, 100));
    } else {
      // No profile category implies this axis. Previously this returned 0, which
      // silently WIPED whatever the user had deliberately set on axes the depth
      /* map doesn't cover (Manners, Activeness, Curiosity). Preserve their value
         instead — depth-first should derive what it can and leave the rest alone.

         "Their value" means the USER's value. A value a previous depth-first run
         wrote is not one: reading it back made each run a function of the last one,
         so the same seed derived different sliders the second time and the character
         it built was not the character its own seed named. Same provenance rule as
         AUTO_PROFILE_TYPES. */
      /* An axis the depth map does not cover (Manners, Activeness, Curiosity) sits
         NEUTRAL rather than keeping whatever the slider says.

         Copying the control back looked kinder and was the last source of replay
         drift: which axes the map covers shifts with the motivation draw, so an axis
         derived on one run and copied on the next picked up the earlier run's own
         derived number as though it were a user preference, and the same seed built a
         different person each time it was pressed. It also contradicted the mode's
         premise — depth-first resolves the profile with ZERO_PERSONALITY precisely so
         that no slider leaks in, and then let three of them leak in here.

         These axes are named in the "left alone" notice (lastDepthUntouched), so the
         user is told which ones depth-first could not derive rather than being given a
         number that looks derived and is not. */
      out[a.id] = 0;
      out['__untouched_'+a.id] = true;
    }
  });
  return out;
}
/* Which profile-type dropdowns hold a value the app wrote rather than one the user
   picked. Kept beside the DOM rather than in it because the control itself cannot
   express the difference, and the difference is exactly what depth-first needs to know
   on its next run. Cleared whenever the user touches the control (see app.js). */
const AUTO_PROFILE_TYPES = new Set();
/* (There is no equivalent set for the personality sliders. Depth-first used to read
   them back for the axes it could not derive, which is what made each run a function
   of the last; those axes now sit neutral instead — see personalityFromDepth.) */
function markAutoProfileType(id){ AUTO_PROFILE_TYPES.add(id); }
function clearAutoProfileType(id){ AUTO_PROFILE_TYPES.delete(id); }
function isAutoProfileType(id){ return AUTO_PROFILE_TYPES.has(id); }

function applyDepthFirst(){
  const chosen = deriveDepthCategories();
  const derived = personalityFromDepth(chosen);
  lastDepthUntouched = PERSONALITY_AXES.filter(a=>derived['__untouched_'+a.id]).map(a=>a.label);
  PERSONALITY_AXES.forEach(a=>{
    const el = document.getElementById('pers_'+a.id);
    if (!el) return;
    el.value = derived[a.id];
  });
  // Write the resolved types into the dropdowns so the main build honours them — and
  // record that WE wrote them, so the next depth-first run can tell its own previous
  // guesses apart from the user's deliberate choices.
  Object.entries(chosen).forEach(([id,cat])=>{
    const sel = document.getElementById('type_'+id);
    if (sel && cat && [...sel.options].some(o=>o.value===cat)){
      if (sel.value !== cat || isAutoProfileType(id)) markAutoProfileType(id);
      sel.value = cat;
    }
  });
  onSliderChange();
  suggestVoiceFromPersonality();
  return chosen;
}

// ================= SEED FROM ONE TRAIT =================
let SEEDABLE_TRAITS = [];
function buildSeedPicker(){
  const sel = document.getElementById('seedTraitSelect');
  if (!sel) return;
  SEEDABLE_TRAITS = TRAITS.filter(t => t.section==="Personality Traits" ||
    PROFILE_SECTIONS.some(ps=>ps.section===t.section));
  renderSeedOptions(SEEDABLE_TRAITS);
}
function renderSeedOptions(list){
  const sel = document.getElementById('seedTraitSelect');
  const prevValue = sel.value;
  const bySection = {};
  list.forEach(t=>{ (bySection[t.section] = bySection[t.section]||[]).push(t); });
  sel.innerHTML = `<option value="">— none —</option>`;
  Object.entries(bySection).forEach(([sec, items])=>{
    const g = document.createElement('optgroup'); g.label = sec;
    items.sort((a,b)=>a.trait.localeCompare(b.trait)).forEach(t=>{
      const o = document.createElement('option'); o.value = String(t.id);
      o.textContent = `${t.trait} — ${t.category}`;
      g.appendChild(o);
    });
    sel.appendChild(g);
  });
  if ([...sel.options].some(o=>o.value===prevValue)) sel.value = prevValue;
}
function filterSeedPicker(){
  const q = strVal('seedTraitFilter', '').trim().toLowerCase();
  if (!q){ renderSeedOptions(SEEDABLE_TRAITS); return; }
  const filtered = SEEDABLE_TRAITS.filter(t =>
    t.trait.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  renderSeedOptions(filtered.length ? filtered : SEEDABLE_TRAITS);
}
function generateFromSeed(){
  const sel = document.getElementById('seedTraitSelect');
  const id = sel && sel.value ? parseInt(sel.value) : null;
  if (!id){ toast("Choose a seed trait first.", "warn"); return; }
  const seed = TRAITS.find(t=>t.id===id);
  if (!seed) return;

  // 1. If the seed is a profile-section trait, lock that section's type to its category.
  const ps = PROFILE_SECTIONS.find(p=>p.section===seed.section);
  if (ps){
    const tsel = document.getElementById('type_'+ps.id);
    if (tsel && [...tsel.options].some(o=>o.value===seed.category)) tsel.value = seed.category;
    const tog = document.getElementById('sec_'+ps.id); if (tog) tog.checked = true;
  }
  // 2. If it's a personality trait, push that axis hard toward the seed's pole.
  if (seed.section === "Personality Traits"){
    const axis = PERSONALITY_AXES.find(a=>a.pos===seed.category || a.neg===seed.category || a.mid===seed.category);
    if (axis){
      const el = document.getElementById('pers_'+axis.id);
      // Seeding from a Situational trait means the character is deliberately
      // MIDDLE on that axis — park the slider inside the neutral band rather
      // than shoving it to a pole it doesn't belong to.
      if (el) el.value = (seed.category === axis.mid) ? 0
                       : (seed.category === axis.pos ? 75 : -75);
    }
  }
  // 3. Let the matrix propagate outward from that fixed point.
  const chosenSoFar = {};
  if (ps) chosenSoFar[ps.id] = seed.category;
  const derived = personalityFromDepth(chosenSoFar);
  PERSONALITY_AXES.forEach(a=>{
    const el = document.getElementById('pers_'+a.id);
    if (!el) return;
    if (seed.section === "Personality Traits"){
      const axis = PERSONALITY_AXES.find(x=>x.pos===seed.category || x.neg===seed.category);
      if (axis && axis.id === a.id) return; // don't overwrite the seeded axis
    }
    if (derived[a.id]) el.value = derived[a.id];
  });
  onSliderChange();
  suggestVoiceFromPersonality();
  // Synchronous build: the seed trait has to be forced into the finished state below,
  // so this path cannot use the deferred/skeleton wrapper.
  if (runGeneration() === false) return;

  /* 4. Force the exact seed trait into the slot that SEMANTICALLY holds it, and lock it.
     This used to search only the positive/negative axis categories and to hard-code
     `prof_<section>_0`, so two whole families of seed failed silently:

       - a Situational personality trait (the middle pole of an axis) matched no
         category in the search and was neither seated nor locked — the build simply
         ignored the seed the user had chosen;
       - Motivation & Wound is drawAll, with ONE SLOT PER CATEGORY, so every motivation
         seed was written into `prof_motivation_0` regardless of which facet it belongs
         to. Seeding from a Ghost replaced the Core Want slot and left it labelled
         "Core Want", so the sheet stated a fact about a category the trait is not in.

     Resolve by category, over the slots the build actually produced. */
  const seatSeed = () => {
    // The slot already holding this trait's own category is always the right home.
    const byCategory = Object.keys(state).find(id =>
      state[id] && state[id].trait && state[id].trait.category === seed.category);
    if (byCategory) return byCategory;
    if (ps){
      // Same section, any of its slots — take the first that exists, which for a
      // single-slot section is its only slot.
      const inSection = Object.keys(state).filter(id => id.startsWith("prof_"+ps.id+"_"));
      if (inSection.length) return inSection[0];
    }
    if (seed.section === "Personality Traits"){
      const axis = PERSONALITY_AXES.find(a=>a.pos===seed.category || a.neg===seed.category || a.mid===seed.category);
      if (axis && state["pers_"+axis.id]) return "pers_"+axis.id;
    }
    return null;
  };
  const slotId = seatSeed();
  if (slotId){
    // Never leave the seed on the sheet twice: if the build already drew it elsewhere,
    // that other seat gives it up.
    Object.keys(state).forEach(id=>{
      if (id !== slotId && state[id] && state[id].trait && state[id].trait.id === seed.id) state[id].trait = null;
    });
    state[slotId].trait = seed;
    state[slotId].locked = true;
    state[slotId].seeded = true;
    /* The label named the category the slot USED to hold, which is how a Ghost seed
       ended up on a card still headed "Core Want". Retarget it — but leave a label
       that already names this category alone, rather than printing it twice. */
    const label = state[slotId].label ? String(state[slotId].label) : "";
    if (seed.category && !label.includes(seed.category)){
      state[slotId].label = /—/.test(label)
        ? label.replace(/—.*$/, "— " + seed.category).trim()
        : (label ? label + " — " + seed.category : seed.category);
    }
    // Downstream state has to agree with the seat: re-run the shared finalizer so
    // requirements, exclusivity and budgets solve against the seeded sheet.
    try { state = finalizeSheet(state, {rarityPref: rarityPrefVal(), applyPins:false}); } catch(e){ console.error(e); }
  } else {
    toast(`"${seed.trait}" could not be placed — its section produced no slot in this build. Switch that section on and try again.`, "warn", 7000);
  }
  renderSheet(); checkConflicts();
}

// ================= SINGLE CHARACTER STATE =================
let state = {};
let pressureState = null;
let charMeta = {name:"", age:"", context:"", archetypeLabel:"Custom random"};
let history = [];
// The sliders that actually produced the CURRENTLY-DISPLAYED state. snapshotHistory
// runs at the top of generateCharacter(), which is AFTER the user has already moved
// the sliders to whatever they want for the NEXT generation — so capturing DOM values
// there would save the new sliders under the old undo entry. Track them separately,
// updated only once a generation actually completes.
let lastGeneratedSliders = null;
let charMetaSeed = null;
let diffLog = {}; // slotId -> {from, to}
/* Free-text notes attached to a card. Round-trips in the JSON export and in a saved
   character, and is deliberately keyed on the SLOT rather than the trait: the note is
   about this character's version of the trait ("this is the one the whole first act
   turns on"), not about the trait in the abstract. */
let traitNotes = {};   // slotId -> string
let whyOpen = {};          // slotId -> bool, is the "why?" panel expanded
let rerollExclusions = {}; // slotId -> Set of trait ids already rejected here
let rerollHistory = {};    // slotId -> array of previous slot objects, oldest first
let pinnedTargets = {};    // slotId -> pinned continuous intensity target (1..5), survives regeneration
let lastDepthUntouched = []; // axis labels depth-first left alone, for the notice
let lastAxesUsed = null;      // Set of axis ids included in the last generation
let lastAxisTrimActive = false; // was the "N (random)" personality-count trim in effect

// BUG FIX: snapshots captured only the trait state, so Undo restored old traits while
// leaving the sliders (and the Under Pressure sheet) wherever the last generation had
// moved them — the sheet and the controls disagreed, and the pressure panel showed a
// character that no longer existed. Capture all three.
function captureSliders(){
  const s = {};
  ['verbositySlider','registerSlider','composureSlider'].forEach(id=>{
    const el = document.getElementById(id); if (el) s[id] = el.value;
  });
  PERSONALITY_AXES.forEach(a=>{
    const el = document.getElementById('pers_'+a.id); if (el) s['pers_'+a.id] = el.value;
  });
  return s;
}
function restoreSliders(s){
  if (!s) return;
  Object.entries(s).forEach(([id,v])=>{ const el = document.getElementById(id); if (el) el.value = v; });
}
/* Undo kept fifteen full deep copies, each holding ~37 slots with a complete trait
   object embedded in every one — the whole trait record duplicated per slot per
   snapshot, for traits that are already live in TRAITS and never change. Store the id
   and re-link on the way out instead; the import path already needs exactly this
   relink, for the same reason. Traits that no longer exist in the pool (an older
   session, a trait since removed) keep their embedded copy, so undo cannot lose a slot
   the way a naive id-only store would. */
/* Bumped when the on-disk shape of a save changes in a way a reader must know about.
   Absent = a pre-compression save with full trait objects embedded, which still loads. */
/* Format 3 adds the tombstone (`__fb`) described below. A format-2 save reads back
   identically except that an id deleted from the bank since is still lost — there is
   nothing in the file to recover it from. */
const SAVE_FORMAT = 3;
/* Compressing a slot to `{__id}` assumed the bank is permanent. It is not: delete or
   renumber a trait and every save referencing it expanded to `trait:null`, and because
   the orphan counter only sees surviving trait objects, the loss was silent — the card
   simply vanished from a character the user had saved months earlier. Old full-object
   saves never had this problem, so compression was a regression in durability.
   Carry a compact tombstone (the five fields the card and the validator actually read)
   beside the id. ~120 bytes a slot against ~480 for a full trait copy, so the size win
   that motivated compression is kept while a removed id degrades to an orphan with its
   text intact instead of to nothing. */
const TOMBSTONE_FIELDS = ['id','section','category','trait','desc','example','intensity','rarity'];
function traitTombstone(t){
  const fb = {};
  TOMBSTONE_FIELDS.forEach(f=>{ if (t[f] !== undefined) fb[f] = t[f]; });
  return fb;
}
function compressSlots(st){
  if (!st) return st;
  const out = {};
  Object.entries(st).forEach(([k, slot])=>{
    if (!slot){ out[k] = slot; return; }
    const copy = {...slot};
    if (copy.trait && TRAITS_BY_ID.has(copy.trait.id)) copy.trait = {__id: copy.trait.id, __fb: traitTombstone(copy.trait)};
    else if (copy.trait) copy.trait = JSON.parse(JSON.stringify(copy.trait));
    out[k] = copy;
  });
  return out;
}
function expandSlots(st){
  if (!st) return st;
  const out = {};
  Object.entries(st).forEach(([k, slot])=>{
    if (!slot){ out[k] = slot; return; }
    const copy = {...slot};
    if (copy.trait && copy.trait.__id !== undefined){
      const live = TRAITS_BY_ID.get(copy.trait.__id);
      // No live trait and no tombstone (a format-2 save) is the one case that still
      // cannot be recovered; mark it rather than dropping the slot silently.
      copy.trait = live
        || (copy.trait.__fb ? Object.assign({removed:true}, copy.trait.__fb) : null);
      if (!live && !copy.trait) copy.removedTraitId = slot.trait.__id;
    }
    out[k] = copy;
  });
  return out;
}

/* Redo. The snapshot mechanism already stores everything needed to move in either
   direction; all that was missing was a second stack and the discipline of clearing it
   when a NEW action forks the timeline. Undo depth is 15, so redo matches it. */
let redoStack = [];
/* A snapshot used to hold sheets, meta, pressure and sliders only — so Undo after an
   import left the OLD character's traits sitting under the NEW character's pins,
   notes, presentation variants, constraints and budgets. One function now defines the
   whole undoable transaction, and both stacks and every restore go through it, so a
   field can never be added to the workspace and forgotten by Undo again.
   `captureSettings`/`restoreSettings` live in render.js and read the DOM; under the
   test harness they may be absent, hence the typeof guards. */
function _snapshotNow(){
  return {
    state: compressSlots(state),
    charMeta: {...charMeta},
    pressureState: compressSlots(pressureState),
    sliders: lastGeneratedSliders || captureSliders(),
    pinnedTargets: JSON.parse(JSON.stringify(pinnedTargets || {})),
    charVariants: Object.assign({}, (typeof charVariants !== 'undefined' ? charVariants : {})),
    traitNotes: Object.assign({}, traitNotes || {}),
    settings: (typeof captureSettings === 'function') ? captureSettings() : null,
  };
}
function updateUndoButtons(){
  const u = document.getElementById('undoBtn'); if (u) u.disabled = history.length === 0;
  const r = document.getElementById('redoBtn'); if (r) r.disabled = redoStack.length === 0;
}
function snapshotHistory(){
  // A fresh action invalidates anything that was ahead of us on the timeline.
  redoStack = [];
  history.push(_snapshotNow());
  if (history.length > 15) history.shift();
  updateUndoButtons();
}
// Shared by undo and redo: the restore half is identical, only which stack the current
// position is pushed onto differs.
function _restoreSnapshot(prev){
  state = expandSlots(prev.state); charMeta = prev.charMeta;
  pressureState = expandSlots(prev.pressureState) || null;
  // Restore the workspace BEFORE the sliders: restoreSettings writes slider values too,
  // and the snapshot's own slider block is the authoritative one for this sheet.
  if (prev.settings && typeof restoreSettings === 'function') restoreSettings(prev.settings);
  if (prev.pinnedTargets) pinnedTargets = JSON.parse(JSON.stringify(prev.pinnedTargets));
  if (prev.charVariants && typeof charVariants !== 'undefined') charVariants = Object.assign({}, prev.charVariants);
  if (prev.traitNotes) traitNotes = Object.assign({}, prev.traitNotes);
  restoreSliders(prev.sliders);
  lastGeneratedSliders = prev.sliders; // the restored state now corresponds to these again
  setVal('charName', charMeta.name || "");
  setVal('charAge', charMeta.age || "");
  setVal('charContext', charMeta.context || "");
  setText('archetypeTag', charMeta.archetypeLabel || "");
  document.getElementById('pressureSheet').style.display = pressureState ? "block" : "none";
  diffLog = {}; rerollExclusions = {}; rerollHistory = {}; whyOpen = {}; OPEN_CARD_CONTROLS.clear();
  onSliderChange();
  renderSheet(); checkConflicts();
  updateUndoButtons();
}
function undoLast(){
  if (!history.length) return;
  redoStack.push(_snapshotNow());
  if (redoStack.length > 15) redoStack.shift();
  _restoreSnapshot(history.pop());
}
function redoLast(){
  if (!redoStack.length) return;
  history.push(_snapshotNow());
  if (history.length > 15) history.shift();
  _restoreSnapshot(redoStack.pop());
}

// Builds one of the sheet's fixed-spine slots, per the empty-slot convention above:
// present either way, explicitly marked when the pool had nothing to give.
function mkSlot(slotId, label, target, trait, extra){
  if (!trait) return emptySlot(slotId, label, Object.assign({target}, extra || {}));
  return Object.assign({slotId, locked:false, label, target, trait}, extra || {});
}
function pickVerbositySlot(verbLevel, rarityPref){
  // Crossover narrowed from ±0.3 (raw ±15) to ±0.12 (raw ±6): the old dead band
  // meant nearly a third of the slider produced identical pacing-pool draws.
  const target = targetFromLevel(verbLevel);
  if (verbLevel <= -0.12){
    const pool = byFilter(AXES.verbosityLow.section, AXES.verbosityLow.category);
    return mkSlot("verbosity", "Verbosity (minimal-leaning)", target, pickInRange(pool, rarityPref, target));
  } else if (verbLevel >= 0.12){
    /* "Repetitive & Circular" (48 authored traits) was the one category in the whole
       bank that no normal pick path could reach: AXES named four of this section's
       five categories and nothing else in the app draws from Verbosity Traits, so the
       entries were live data reachable only via the off-by-default wildcard slot.
       Circling back over the same ground IS a way of using too many words, so it
       belongs on the high-volume branch — as a minority of it, because it is a
       narrower and more noticeable habit than plain wordiness. Rises with the slider:
       barely present at +0.12, about a third of high-volume draws at the top. */
    /* DIRECTLY REQUESTABLE. This branch was the ONLY path to Repetitive & Circular, and
       it capped at 34% of high-volume draws — so a user who specifically wanted a
       character who circles could not ask for one, only roll for one, and had to push
       verbosity to the top to get even a third of a chance. Every other category in the
       bank can be steered; this one could only be waited for.

       The prefer/rarely tiers are the app's existing vocabulary for exactly this
       request, so honour them here: 'prefer' makes circling the likely outcome of a
       high-volume draw rather than the minority one, and 'rarely' takes it off the
       table. Left as odds rather than a guarantee because it is still a narrower and
       more noticeable habit than plain wordiness, and a sheet that circles every single
       time is the caricature the whole rarity system exists to avoid. */
    const circularTier = categoryTiers.get(AXES.circular.category);
    const baseOdds = clamp((Math.abs(verbLevel) - 0.12) / 1.88, 0, 1) * 0.34;
    const circularOdds = circularTier === 'rarely' ? 0
                       : circularTier === 'prefer' ? clamp(0.55 + baseOdds, 0, 0.85)
                       : baseOdds;
    const useCircular = circularOdds > 0 && rand() < circularOdds;
    const ax = useCircular ? AXES.circular : AXES.verbosityHigh;
    const pool = byFilter(ax.section, ax.category);
    return mkSlot("verbosity", useCircular ? "Verbosity (circling, high-volume)" : "Verbosity (high-volume-leaning)",
                  target, pickInRange(pool, rarityPref, target));
  } else {
    // Dead centre now means "situational pacing at low intensity" rather than an
    // unfiltered free-for-all — the neutral band respects the range engine too.
    const pool = byFilter(AXES.pacing.section, AXES.pacing.category);
    const t = poolFloorTarget(pool, targetFromMag(18));
    return mkSlot("verbosity", "Verbosity (pacing-driven)", t,
                  withSlotMemory("verbosity", ()=>pickInRange(pool, rarityPref, t, 8, true)));
  }
}
/* What "no deliberate statement about register" can draw from. All three are ways of
   saying nothing in particular about formality, and pooling them takes this slot from
   one 83-trait category to about 235. */
const NEUTRAL_REGISTER_CATS = ["Register & Formality Spectrum", "Directness & Literalness",
                               "Phonetic & Auditory Qualities"];
function pickRegisterSlot(regLevel, rarityPref){
  const target = targetFromLevel(regLevel);
  if (regLevel >= 0.12){
    const pool = byFilter(AXES.stylized.section, AXES.stylized.category);
    return mkSlot("register", "Register (elaborate-leaning)", target, pickInRange(pool, rarityPref, target));
  } else if (regLevel <= -0.12){
    const plainPool = byFilter("Vocabulary Traits","Directness & Literalness")
      .concat(byFilter("Vocabulary Traits","Register & Formality Spectrum").filter(t=>/coarse|colloquial|vernacular|elementary|sermo|plain|casual|slang|shop-floor|locker-room|backroom|unpolished|reflexively casual|under-speak/i.test(t.trait)));
    const pool = plainPool.length ? plainPool : byFilter("Vocabulary Traits","Register & Formality Spectrum");
    return mkSlot("register", "Register (plain-leaning)", target, pickInRange(pool, rarityPref, target));
  } else {
    /* Same collapsed-slot shape as the neutral personality draw: one fixed category,
       so variety was capped by that category's depth near the target rather than by
       anything the user could influence. A centred Register slider does not mean
       "Register & Formality Spectrum specifically" — it means the character has made no
       deliberate statement about how formally they speak, and how PLAINLY they put
       things and how they SOUND are equally good answers to that. Draw from all three,
       weighted by depth so the widest category still leads. */
    const pool = NEUTRAL_REGISTER_CATS
      .flatMap(c => byFilter("Vocabulary Traits", c));
    // 83 traits returning 15, one of them ("Hushed-deliberate") in 28% of all
    // characters, because targetFromMag(18) sits below the pool's floor. See the
    // POOL-FLOOR TARGETS note above.
    const t = poolFloorTarget(pool, targetFromMag(18));
    return mkSlot("register", "Register (neutral)", t,
                  withSlotMemory("register", ()=>pickInRange(pool, rarityPref, t, 10, true)));
  }
}
// Shared by pickVocabSlots/pickGrammarSlot/pickMannerSlots: when a category was actually
// boosted by the matrix (something specific is driving this pick), lean the trait choice
// within that category toward higher intensity too — not just which category gets picked.
// An unboosted category (weight 0, arrived at by plain random weighting) skips this so a
// truly neutral pick doesn't get artificially pushed toward extremes.
function pickFromCategoryIntensityAware(section, category, boostMap, rarityPref){
  const pool = byFilter(section, category);
  const strength = (boostMap && boostMap.get(category)) || 0;
  // No signal pointing here: keep it an unsteered draw, mid-scale, so genuinely
  // random slots don't get shoved toward the extremes by accident.
  if (strength <= 0) return {trait: pickInRange(pool, rarityPref, targetFromMag(45), 8), target: targetFromMag(45), steered:false};
  // Boost strength is roughly 0..2 in practice; map it across the full scale so a
  // strongly-driven category yields a correspondingly strong trait.
  const target = targetFromMag(clamp(strength / 2, 0, 1) * 100);
  return {trait: pickInRange(pool, rarityPref, target), target, steered:true};
}

function pickVocabSlots(archetypePref, verbLevel, regLevel, rarityPref, count, profileCats, overrides){
  const boosted = boostedVocabCats(verbLevel, regLevel, profileCats, overrides);
  const pool = archetypePref && archetypePref.length ? archetypePref : VOCAB_CATS;
  const targetCount = count || 2;
  const chosenCats = []; const usedCats = new Set();
  // BUG FIX: this loop had no attempt cap, so with an unlucky weighted draw it
  // could spin for a long time; and its `else if` branch was unreachable because
  // the loop condition already excluded that case, meaning asking for more vocab
  // slots than there are categories silently returned fewer.
  let attempts = 0;
  while (chosenCats.length < targetCount && attempts < 200){
    attempts++;
    const c = pickCategoryWeighted(pool, boosted);
    // Every category in this pool is banned out: stop rather than spin 200 times.
    if (!c) break;
    if (!usedCats.has(c)) { usedCats.add(c); chosenCats.push(c); }
    else if (usedCats.size >= pool.length) { chosenCats.push(c); }
  }
  return chosenCats.map((c,i)=>{
    const r = pickFromCategoryIntensityAware("Vocabulary Traits", c, boosted, rarityPref);
    return {slotId:"vocab"+i, locked:false, label:"Vocabulary — "+c, target:r.target, steered:r.steered, trait:r.trait};
  });
}
function pickGrammarSlot(verbLevel, compLevel, regLevel, rarityPref, profileCats, overrides){
  const boosted = boostedGrammarCats(verbLevel, compLevel, regLevel, profileCats, overrides);
  const c = pickCategoryWeighted(GRAMMAR_CATS, boosted);
  if (!c) return emptySlot("grammar", "Dialogue Grammar", {});
  const r = pickFromCategoryIntensityAware("Dialogue Grammar Traits", c, boosted, rarityPref);
  return mkSlot("grammar", "Dialogue Grammar — "+c, r.target, r.trait, {steered:r.steered});
}
function pickMannerSlots(count, compLevel, regLevel, rarityPref, forcePool, profileCats, overrides){
  const boosted = boostedMannerCats(compLevel, regLevel, profileCats, overrides);
  // BUG FIX: the stress variant passes VOLATILE_MANNER_CATS.concat(MANNER_CATS),
  // which contains duplicates. Those broke the `usedCats.size >= cats.length`
  // exhaustion check (it could never be true), so requesting more mannerisms than
  // there are distinct categories silently returned fewer. Dedupe up front and
  // let the weighting, not repeated array entries, express the volatile bias.
  const cats = [...new Set(forcePool || MANNER_CATS)];
  if (forcePool) VOLATILE_MANNER_CATS.forEach(c=>{
    if (cats.includes(c)) boosted.set(c, Math.max(boosted.get(c)||0, 1.2));
  });
  const chosenCats = []; const usedCats = new Set();
  let attempts = 0;
  while (chosenCats.length < count && attempts < 200){
    attempts++;
    const c = pickCategoryWeighted(cats, boosted);
    if (!c) break;
    if (!usedCats.has(c)) { usedCats.add(c); chosenCats.push(c); }
    else if (usedCats.size >= cats.length) { chosenCats.push(c); }
  }
  return chosenCats.map((c,i)=>{
    const r = pickFromCategoryIntensityAware("Mannerisms", c, boosted, rarityPref);
    return {slotId:"manner"+i, locked:false, label:"Mannerism — "+c, target:r.target, steered:r.steered, trait:r.trait};
  });
}

/* ================= APPEARANCE CRAFTER =================
   Same engine, new domain. Three dedicated sliders map to pos/neg category pairs
   with continuous intensity, exactly like personality axes:
     Stature:  + Build - Imposing      / - Build - Slight
     Upkeep:   + Upkeep - Immaculate   / - Upkeep - Unkempt
     Presence: + Presence - Striking   / - Presence - Unremarkable
   Movement & Bearing is deliberately NOT its own slider: it draws from the existing
   Activeness personality axis, so a sedentary character moves like one - appearance
   stays causally downstream of who the character is, same as voice. Distinguishing
   Marks draws at the Presence magnitude: the more striking the design intent, the
   stronger the mark. Near-centre sliders (|raw| < 8) skip their slot entirely,
   so an untouched appearance panel adds only Movement + a mild Mark. */
const APPEARANCE_AXES = [
  {id:"stature",  label:"Stature",  pos:"Build \u2014 Imposing",    neg:"Build \u2014 Slight"},
  {id:"upkeep",   label:"Upkeep",   pos:"Upkeep \u2014 Immaculate", neg:"Upkeep \u2014 Unkempt"},
  {id:"presence", label:"Presence", pos:"Presence \u2014 Striking", neg:"Presence \u2014 Unremarkable"},
];
/* Appearance used to be the only section with no causal link back to the psychology
   beyond "Movement derives from Activeness" \u2014 it read as a bolt-on, and a functional
   drinker with a Compulsion-and-Ritual habit looked exactly like anyone else. These
   two rules close that gap without adding another slider:

     Upkeep  \u2014 a CENTRED upkeep slider no longer means "no slot". It means "no
               deliberate statement", which is precisely when the character's own
               habits should decide: a substance or avoidance vice pulls unkempt, a
               ritual or restraint vice pulls immaculate. An off-centre slider still
               wins outright; this only fills the silence.
     Marks   \u2014 the mark target rises with the intensity of the actual wound, so a
               life-defining injury tends to have left something visible.  */
const UPKEEP_FROM_VICE = {
  "Substance & Consumption": -1, "Avoidance & Procrastination": -1, "Risk & Escape": -1,
  "Compulsion & Ritual": 1, "Restraint & Discipline": 1,
};
/* app_move and app_mark are the only two slots in the app that are seated on EVERY
   sheet regardless of any slider, and they draw from the two smallest always-drawn
   pools in the bank (44 and 43). Measured over 400 default characters they returned 19
   and 22 distinct traits with a top trait at 8-13% — the worst two slots in the app,
   and the only place a user sees the same line twice in an afternoon.

   Two of the three causes are mechanical and fixed here. The window was the same 8-wide
   slice of a 44-trait pool every time, and the target was a fixed number at neutral
   sliders, so the same slice was asked for on every build. A wider minimum window plus
   a small per-build jitter of the target between them make most of each pool reachable.

   The third cause is content: two guaranteed cards drawn 400 times cannot be hidden
   behind any amount of weighting, and these two categories want more entries. That is
   a data pass, not a code fix. */
const APPEARANCE_MIN_WINDOW = 16;
function appearanceJitter(target){ return clamp(target + (rand() - 0.5) * 1.4, 1, 5); }
function pickAppearanceSlots(rarityPref, overrides, resolvedCats, sourceState){
  const out = {};
  const derivedUpkeep = resolvedCats ? UPKEEP_FROM_VICE[resolvedCats.vices] : 0;
  APPEARANCE_AXES.forEach((axis,i)=>{
    const el = document.getElementById('app_'+axis.id);
    const raw = intVal(el, 0);
    let cat, target, derived = false;
    if (Math.abs(raw) < 8){
      // centred slider = no deliberate statement
      if (!(axis.id === 'upkeep' && derivedUpkeep)) return;
      cat = derivedUpkeep > 0 ? axis.pos : axis.neg;
      target = targetFromMag(38);   // a real but unemphatic statement
      derived = true;
    } else {
      cat = raw >= 0 ? axis.pos : axis.neg;
      target = targetFromMag(Math.abs(raw));
    }
    const trait = pickInRange(byFilter("Appearance", cat), rarityPref, target);
    /* BUG FIX: none of the five Appearance slots registered their draw in the build's
       uniqueness registry, so an Appearance trait could be seated here AND drawn again
       by the wildcard (which draws across sections, Appearance included) — the same
       line twice on one sheet. Every other multi-draw path marks; these were simply
       missed. */
    if (trait){
      _markUsed(trait);
      out['app_'+i] = {slotId:'app_'+i, locked:false, derived,
        label:"Appearance \u2014 "+axis.label + (derived ? " (from their habits)" : ""), target, trait};
    }
  });
  const actLevel = axisLevel('activeness', overrides);
  // Floor raised from 25 to 40. Movement & Bearing has no material down at the
  // intensity a magnitude of 25 asks for (target 1.35), so a neutral Activeness
  // slider aimed the picker below the pool entirely — 7 distinct traits in 400
  // characters. 40 lands inside the pool's real content.
  const mvPool = byFilter("Appearance","Movement & Bearing");
  const mvTarget = appearanceJitter(poolFloorTarget(mvPool, targetFromMag(Math.max(40, Math.abs(actLevel)*50))));
  const mv = withSlotMemory("app_move", ()=>pickInRange(mvPool, rarityPref, mvTarget, APPEARANCE_MIN_WINDOW, true));
  _markUsed(mv);
  out['app_move'] = mkSlot('app_move', "Appearance \u2014 Movement & Bearing", mvTarget, mv);
  const pEl = document.getElementById('app_presence');
  const pMag = Math.abs(intVal(pEl, 0));
  // Wound intensity, read off whichever Motivation slots this build has already seated.
  let woundMag = 0;
  const st = sourceState || null;
  if (st) Object.keys(st).forEach(k=>{
    if (!k.startsWith('prof_motivation_')) return;
    const t = st[k] && st[k].trait;
    if (t && /Wound/i.test(t.category)) woundMag = Math.max(woundMag, (t.intensity||3) * 18);
  });
  const mkPool = byFilter("Appearance","Distinguishing Marks");
  // targetFromMag(15) = 1.09 against a pool whose floor is well above it — 38 traits
  // were returning 9, and two of them were showing up in a quarter of all characters.
  const mkTarget = appearanceJitter(poolFloorTarget(mkPool, targetFromMag(Math.max(15, pMag, woundMag))));
  const mk = withSlotMemory("app_mark", ()=>pickInRange(mkPool, rarityPref, mkTarget, APPEARANCE_MIN_WINDOW, true));
  _markUsed(mk);
  out['app_mark'] = mkSlot('app_mark', "Appearance \u2014 Distinguishing Marks", mkTarget, mk);
  return out;
}

// Robustness: one registry of trait ids already placed in the CURRENT build, so
// multi-trait sections (profile depth, doubled personality axes) never seat the
// same trait twice on one sheet. Reset per build; consulted by the multi-draw paths.
let _buildUsedIds = new Set();
function _markUsed(t){ if (t) _buildUsedIds.add(t.id); }
// BUG FIX: this used to hand back the duplicate after exhausting its attempts, so in a
// thin category (Appearance sits at 15–24 per category) the same trait could be seated
// twice on one sheet with nothing said about it. Return null instead: every caller
// already handles an empty draw, and traitCardHTML renders "no trait available at
// these settings", which is the truth — a pool gap, visible as a pool gap.
/* ================= THE EMPTY-SLOT CONVENTION =================
   A draw can come back with nothing: the pool was banned out, a constraint emptied it,
   the precision band is too tight, or _drawUnique exhausted a thin category. Three
   different call sites had three different answers to that. pickProfileSlots and
   pickAppearanceSlots guarded with `if (!trait) return;`, so the slot silently vanished
   from the sheet. pickVerbositySlot, pickRegisterSlot and pickGrammarSlot returned the
   slot object with trait:null, which then propagated into every consumer — and the
   consumers that did not guard it (sheetToText, sheetToHTML, coherenceScore,
   softTensionsFor) threw on export.

   One rule, stated once, applied everywhere:

     A slot the sheet ALWAYS has stays on the sheet as an explicit empty slot.
     A slot that only exists because something asked for it is omitted when empty.

   The first case is the fixed spine of the sheet — verbosity, register, grammar,
   movement, marks. Those disappearing is worse than useless: the user has no way to
   tell "this pool is empty at your settings" from "this section doesn't exist", and
   traitCardHTML already renders exactly that message. The second case is the optional
   depth — the fourth motivation facet, a counterpoint, an appearance axis the user left
   centred. Nobody asked for those specifically, and an empty card for each would be
   noise.

   Every empty slot carries `empty:true` so a consumer can tell a deliberate gap from a
   malformed one, and EVERY consumer guards on `.trait` regardless. */
function emptySlot(slotId, label, extra){
  return Object.assign({slotId, locked:false, label, trait:null, empty:true}, extra || {});
}

function _drawUnique(fn, tries){
  for (let i = 0; i < (tries || 24); i++){
    const cand = fn();
    if (!cand) return null;
    if (!_buildUsedIds.has(cand.id)) return cand;
  }
  return null;
}

/* ================= SIGNATURE INJECTION — "the one thing that doesn't fit" =========
   Everything else in this engine pulls toward consistency: the matrix reinforces,
   the affinity vector agrees with itself, coherence rewards the agreement. Real
   people don't work like that. Almost everyone has exactly one trait that doesn't
   follow from the others — the fastidious brawler, the cheerful undertaker — and a
   generated character has none, because every draw was conditioned on every other.

   So: one slot, drawn from the far tail of a category chosen at random, with the
   slider posture and the affinity vector deliberately switched off for that single
   draw. It is labelled as what it is, so nobody mistakes it for a system failure. */
/* The Profile sections were excluded, which meant the one slot in the app whose job is
   to be out of character could never be an out-of-character FACT — only an
   out-of-character verbal habit. "The devoted caretaker whose actual vice is gambling"
   is a far better outlier than "the terse person who sometimes rambles", and it was
   unreachable. Motivation & Wound stays out: those seven categories are the character's
   own explanation of themselves, and an outlier there reads as an error rather than a
   contradiction. */
/* Motivation & Wound was left out, so the one slot in the app whose job is to be out
   of character could never be an out-of-character FACT — only an out-of-character
   habit. "The one thing that doesn't fit" about a person is very often what they want. */
const WILDCARD_SECTIONS = ["Personality Traits","Mannerisms","Vocabulary Traits","Habits & Vices","Humor Style","Verbosity Traits","Dialogue Grammar Traits",
  "Conflict & Stress Response","Social Role in a Group","Values & Moral Line","Attachment & Intimacy Style","Motivation & Wound"];
function wildcardCount(){
  if (!wildcardEnabled()) return 0;
  const el = document.getElementById('wildcardCount');
  return el ? clamp(parseInt(el.value, 10) || 0, 0, 3) : 1;
}
/* Which axis the partial sheet leans on hardest, and which way — read straight off
   the polarity tags already seated. The wildcard uses it to pick something that
   actually cuts against the person being built, rather than a random tail trait that
   is merely labelled as not fitting. */
function strongestLean(partial){
  const sums = {};
  Object.values(partial || {}).forEach(sl=>{
    const t = sl && sl.trait; if (!t || !t.pol) return;
    Object.entries(t.pol).forEach(([ax,v])=>{ if (v && AXIS_LABELS[ax]) sums[ax] = (sums[ax]||0) + v; });
  });
  let best = null;
  Object.entries(sums).forEach(([ax,v])=>{ if (!best || Math.abs(v) > Math.abs(best.v)) best = {ax, v}; });
  return best && Math.abs(best.v) >= 2 ? best : null;
}
const EXCEPTION_SURVIVES = {
  protect: "it survives because it protects something the rest of them would not know how to",
  soothe:  "it survives because it is how they calm down, and nothing else on the sheet does that job",
  connect: "it survives because it is the one door they leave open",
  avoid:   "it survives because it is where they go when the rest of this is too much",
  perform: "it survives because it is a performance, and they know it is",
  control: "it survives because it is the one place they insist on holding the reins",
  provide: "it survives because somebody depends on it",
  repair:  "it survives because it is what they reach for after the damage",
  default: "it survives because a person is not a theorem — this is the exception that proves they are one",
};
function pickWildcardSlot(rarityPref, index, partial){
  /* Picking a uniform SECTION and then a uniform CATEGORY within it weighted the draw
     by how finely a section happens to be subdivided, not by how much content it holds:
     a Mannerism category came up at 1/84 while a Verbosity one came up at 1/35, for no
     reason anyone chose. Flatten to a single uniform draw over all eligible categories. */
  const lean = strongestLean(partial);
  const opposes = t => lean && t.pol && Math.sign(t.pol[lean.ax] || 0) === -Math.sign(lean.v) && !_buildUsedIds.has(t.id);
  let pairs = [];
  WILDCARD_SECTIONS.forEach(s=> catsOf(s).forEach(c=>{ if (byFilter(s, c).length) pairs.push([s, c]); }));
  if (!pairs.length) return null;
  /* When the sheet leans, draw the category uniformly among those that can actually
     answer it — many categories hold nothing on the leaning axis at all, and picking
     one of those first meant the "exception" was usually just a tail draw. */
  if (lean){
    const able = pairs.filter(([s, c]) => byFilter(s, c).some(opposes));
    if (able.length) pairs = able;
  }
  const [section, cat] = pairs[Math.floor(rand()*pairs.length)];
  const pool = byFilter(section, cat);
  /* Far tail, either end — an outlier can be a startlingly quiet thing as easily as a
     loud one. Affinity is suppressed for the draw so posture can't sand it down.

     The tail is now this CATEGORY's own tail rather than a fixed 4.6 / 1.2. Measured
     against the absolute targets: a band around 4.6 holds 8.3 traits in an average
     eligible category against 15.5 around 1.2 — so the end the slot preferred three
     times in four was the half-empty one, and 3% of draws came back with nothing at all
     because some categories have no material out there to find. A quantile always lands
     on real content, whatever the category's own distribution happens to be, and the
     odds are evened up now that both ends are equally reachable.

     (The slot itself was NOT the repetition risk it looked like. Measured over 3,000
     draws it returns 2,911 distinct traits with a top share of 0.03% — because it picks
     a category uniformly from 112 first, which is the same thing that keeps vocab and
     manner healthy. The tail was thin; the slot was not.) */
  const positions = pool.map(traitPos);
  const target = rand() < 0.55 ? quantile(positions, 0.9) : quantile(positions, 0.1);
  const prior = CURRENT_AFFINITY_VEC;
  CURRENT_AFFINITY_VEC = null;
  let trait;
  /* MEANINGFUL EXCEPTION. A tail draw with affinity suppressed was "labelled as not
     fitting without checking actual mismatch": most of the time it neither agreed nor
     disagreed with anything. If the partial sheet leans hard on an axis, prefer a
     candidate that pulls the other way on THAT axis — a real contradiction — and say
     which axis and why it survives. If nothing in the category opposes the lean, the
     old tail draw stands, honestly labelled. */
  let opposing = null;
  if (lean) opposing = pool.filter(opposes);
  try {
    if (opposing && opposing.length) trait = _drawUnique(()=>pickInRange(opposing, rarityPref, target, 3));
    if (!trait) trait = _drawUnique(()=>pickInRange(pool, rarityPref, target, 3));
  }
  finally { CURRENT_AFFINITY_VEC = prior; }
  if (!trait) return null;
  _markUsed(trait);
  const slotId = "wild_" + (index || 0);
  const contradicts = lean && trait.pol && Math.sign(trait.pol[lean.ax] || 0) === -Math.sign(lean.v);
  const why = contradicts
    ? `Cuts against the sheet's strongest lean (${AXIS_LABELS[lean.ax]}, ${lean.v > 0 ? 'high' : 'low'}) — ` + (EXCEPTION_SURVIVES[trait.behaviorFunction] || EXCEPTION_SURVIVES.default) + '.'
    : `A far-tail draw from ${cat}; nothing in that category opposes the sheet's strongest lean, so this is texture rather than a contradiction.`;
  return {slotId, locked:false, wildcard:true, target,
          label: (contradicts ? "The exception — " : "Doesn't fit the rest — ") + cat, trait,
          exceptionAxis: contradicts ? lean.ax : null, exceptionWhy: why};
}
function wildcardEnabled(){
  const el = document.getElementById('wildcardToggle');
  return el ? !!el.checked : false;
}

const MOTIVATION_SECTION_ID = "motivation";
function buildCharacterState(opts){
  _buildUsedIds = new Set();
  setMotivationLinks(null);
  // One resolved read each per build rather than one per draw.
  invalidateSliderCache();
  /* A replay must not depend on what this session generated earlier. Both repetition
     memories take PREVIOUS characters as an input, and the "avoid recent traits"
     toggle ships ON — so the seed field's own promise ("same seed + same settings =
     the same character") was false by default for every user who never opened the
     Advanced panel. A replay (an explicit seed in the box) runs the same code against
     an empty history — see withReplayMode — so the toggle keeps its meaning and the
     penalties simply have nothing to find. */
  _avoidRecentActive = avoidRecentEnabled();
  const {verbLevel, regLevel, compLevel, mannerCount, rarityPref, vocabPref, personalityOverrides, vocabCount, forcedProfileCats} = opts;
  // Fold the ACTUAL verb/reg/comp levels this build is using into the override map,
  // rather than trusting whatever the single-character DOM sliders currently show.
  // Without this, cast members and foils — which each carry their OWN randomized or
  // negated voice levels — would have their profile-section resolution (stress, role,
  // values, attachment, humor, vices) silently driven by the main UI's sliders instead
  // of their own. Also sets the live signal vector every pickInRange() call in this
  // build reads for trait-level polarity affinity (see VOICE_AXES / polarityFit above).
  const fullOverrides = Object.assign({}, personalityOverrides, {
    verbosity: Math.round(clamp(verbLevel,-2,2)*50),
    register:  Math.round(clamp(regLevel,-2,2)*50),
    composure: Math.round(clamp(compLevel,-2,2)*50),
  });
  setAffinityVec(fullOverrides);
  /* Motivation & Wound genuinely goes first now, rather than nominally. It is drawAll,
     so it needs nothing resolved to draw, and drawing it up front is what lets its
     keywords reach resolveProfileCategories — which is where Stress, Role, Values,
     Attachment, Humor and Vices are actually decided. Previously that call ran before
     a single motivation trait existed, which is the mechanical reason the section could
     influence nothing: not that the link table lacked entries, but that by the time it
     had anything to say, every category it might have spoken to was already chosen. */
  setMotivationLinks(null);
  const motivationSlots = pickProfileSlots(rarityPref, null, MOTIVATION_SECTION_ID);
  setMotivationLinks(motivationCrosslinkMap(
    Object.values(motivationSlots).map(s0=>s0 && s0.trait).filter(Boolean)));
  // Decide WHO they are first (motivation-adjacent facts), then let that inform HOW they speak.
  const resolvedCats = resolveProfileCategories(rarityPref, fullOverrides, forcedProfileCats);
  // Group toggles: users generating only one kind of content (just a voice, just a
  // psychology, just an appearance) can switch whole blocks off. Profile sections
  // already have per-section toggles; these cover the rest. Unchecked = skipped
  // entirely, not hidden — the slots simply don't exist on the sheet.
  const on = id => { const el = document.getElementById(id); return !el || el.checked; };
  // BUG FIX: the voice paths never consulted _buildUsedIds, and the Register slot draws
  // from Vocabulary categories — so a sheet could seat the same trait as both "Register"
  // and "Vocabulary". Route every voice pick through the same uniqueness registry the
  // profile and personality paths already use.
  const seatUnique = (fn, tries) => {
    let slot = null;
    for (let i = 0; i < (tries || 12); i++){
      slot = fn();
      if (!slot || !slot.trait) return slot;
      if (!_buildUsedIds.has(slot.trait.id)) break;
    }
    if (slot && slot.trait) _markUsed(slot.trait);
    return slot;
  };
  const slots = [];
  if (on('genSpeech')){
    slots.push(seatUnique(()=>pickVerbositySlot(verbLevel, rarityPref)));
    slots.push(seatUnique(()=>pickRegisterSlot(regLevel, rarityPref)));
    slots.push(seatUnique(()=>pickGrammarSlot(verbLevel, compLevel, regLevel, rarityPref, resolvedCats, fullOverrides)));
  }
  if (on('genVocab')) pickVocabSlots(vocabPref, verbLevel, regLevel, rarityPref, vocabCount, resolvedCats, fullOverrides)
    .forEach((s0, i)=> slots.push(seatUnique(()=>{
      // Redraw within the same resolved category so the slot keeps its meaning.
      if (!s0 || !s0.trait) return s0;
      if (!_buildUsedIds.has(s0.trait.id)) return s0;
      const t = pickInRange(byFilter("Vocabulary Traits", s0.trait.category), rarityPref, s0.target);
      return t ? Object.assign({}, s0, {trait:t}) : s0;
    })));
  if (on('genManner')) pickMannerSlots(mannerCount, compLevel, regLevel, rarityPref, null, resolvedCats, fullOverrides)
    .forEach(s0=> slots.push(seatUnique(()=>{
      if (!s0 || !s0.trait) return s0;
      if (!_buildUsedIds.has(s0.trait.id)) return s0;
      const t = pickInRange(byFilter("Mannerisms", s0.trait.category), rarityPref, s0.target);
      return t ? Object.assign({}, s0, {trait:t}) : s0;
    })));
  const obj = {}; slots.forEach(s => { if (s && s.slotId) obj[s.slotId] = s; });
  if (on('genPersonality')) Object.assign(obj, pickPersonalitySlots(rarityPref, fullOverrides));
  Object.assign(obj, motivationSlots);
  Object.assign(obj, pickProfileSlots(rarityPref, resolvedCats, null, MOTIVATION_SECTION_ID));
  // Appearance draws last on purpose: it now reads the Motivation slots this build
  // just seated (see the wound → distinguishing-marks link) and the resolved vice.
  if (on('genAppearance')) Object.assign(obj, pickAppearanceSlots(rarityPref, fullOverrides, resolvedCats, obj));
  for (let w = 0; w < wildcardCount(); w++){
    const wild = pickWildcardSlot(rarityPref, w, obj);
    if (wild) obj[wild.slotId] = wild;
  }
  return obj;
}

// Sections whose resolved type can legitimately CHANGE under pressure. Vices stay
// excluded because their pressure behaviour is already covered by the mannerism and
// grammar shifts — a vice under stress is a scene, not a different vice.
/* Motivation & Wound was excluded from the pressure pass, which is odd on its face:
   it supplies the pressure trigger. Under load a wound does not change, but which of
   its facets is in the foreground very much does. */
/* Humor was excluded on the same "already covered by the mannerism shifts" reasoning
   as Vices, and that reasoning is much weaker here. How someone's humour changes when
   things go wrong — the warm one going barbed, the funny one going silent, the deadpan
   one becoming the only person still joking — is arguably the most observable thing a
   character does under pressure, and it is not a mannerism. It is the same claim the
   section itself makes ("what they find funny, and how it lands"): what lands changes
   with the room. Included. */
const PRESSURE_SHIFT_SECTIONS = ["role", "values", "attachment", "motivation", "humor"];

/* How much pressure. The sheet used to be binary — calm, or maximum stress — which
   is the least interesting question you can ask about someone under load, and the
   existing machinery already takes a continuous level everywhere. 0-100, where the
   old behaviour is 100 and stays the default. */
function pressureLevel(){
  const el = document.getElementById('pressureLevel');
  return el ? clamp(intVal(el, 100), 0, 100) / 100 : 1;
}

/* The sheet said how they degrade and never what degrades them, with Core Fear sitting
   right there in the build. A trigger turns the pressure sheet from a description into
   a scene: this is the thing that does this to them. */
function pressureTrigger(st){
  const find = re => {
    const id = Object.keys(st || {}).find(k => k.startsWith("prof_motivation_")
      && st[k] && st[k].trait && re.test(st[k].trait.category));
    return id ? st[id].trait : null;
  };
  const fear = find(/Core Fear/i), wound = find(/Core Wound/i), lie = find(/The Lie/i);
  if (!fear && !wound) return null;
  let out = fear
    ? `Anything that looks like <b>${escHTML(fear.trait)}</b>${wound ? ` — especially when it rhymes with <b>${escHTML(wound.trait)}</b>` : ``}.`
    : `Anything that reopens <b>${escHTML(wound.trait)}</b>.`;
  if (lie) out += ` Underneath it, they are still working from <b>${escHTML(lie.trait)}</b>.`;
  return out;
}

/* What they are like once it passes, which is at least as characterful as the break
   itself — and is the part a writer actually has to stage next. Derived from the
   stress response and the attachment style, both already resolved. */
const RECOVERY_BY_STRESS = {
  "Fight (attack the threat)": "Comes down slowly and does not apologise first. Expect the next hour to be businesslike and a little too polite.",
  "Flight (remove yourself)": "Reappears as if nothing happened, and is genuinely puzzled that anyone is still on it.",
  "Freeze (shut down)": "Comes back online in stages, and is exhausted for far longer than the incident lasted.",
  "Fawn (appease the threat)": "Over-corrects afterwards — does something generous and slightly disproportionate, and resents having done it.",
};
const RECOVERY_BY_ATTACHMENT = {
  "Secure": "Will raise it themselves, once, when it's over.",
  "Anxious": "Needs to be told explicitly that it's fine, and will not fully believe the first telling.",
  "Avoidant": "Treats any attempt to discuss it as a second incident.",
  "Disorganized": "May be warm or cold about it afterwards, and which one is not predictable from what happened.",
};
function pressureRecovery(st){
  const catOf = id => { const s2 = (st||{})["prof_"+id+"_0"]; return s2 && s2.trait ? s2.trait.category : null; };
  const bits = [RECOVERY_BY_STRESS[catOf('stress')], RECOVERY_BY_ATTACHMENT[catOf('attachment')]].filter(Boolean);
  return bits.length ? bits.join(" ") : null;
}

// ================= MECHANICS: CHAINS, STRUCTURED CONTRADICTION, DIMENSIONS =================
/* The deep sections were drawn independently and read independently: a Want, a Lie,
   a Wound and a Need on four separate cards with nothing saying how one produced the
   next. The chain below is pure composition of slots already on the sheet, so it is
   deterministic per character and costs nothing to rebuild — but it is the difference
   between a list of psychological nouns and a mechanism a writer can push on. Every
   link names the trait it reads from, so the explanation can be checked against the
   cards rather than taken on trust. */
function _profTrait(st, sectionId, catRe){
  const id = Object.keys(st || {}).find(k => k.startsWith("prof_" + sectionId + "_") && st[k] && st[k].trait
    && (!catRe || catRe.test(st[k].trait.category)));
  return id ? st[id].trait : null;
}
const STRATEGY_BY_STRESS = {
  "Fight (attack the threat)": "meets it head-on before it can land",
  "Flight (remove yourself)": "leaves before it can land",
  "Freeze (shut down)": "goes still and waits for it to pass",
  "Fawn (appease the threat)": "makes themselves useful to it until it stops being a threat",
};
const STRATEGY_BY_VALUES = {
  "Rigid & Principled": "a rule they will not bend",
  "Pragmatic & Flexible": "whatever works this time",
  "Loyalty-Bound": "the people they have decided are theirs",
  "Self-Interested": "their own position first",
  "Idealistic & Visionary": "a picture of how it ought to be",
};
function motivationChain(st){
  const want = _profTrait(st, "motivation", /Core Want/i);
  const fear = _profTrait(st, "motivation", /Core Fear/i);
  const wound = _profTrait(st, "motivation", /Core Wound/i);
  const lie = _profTrait(st, "motivation", /The Lie/i);
  const need = _profTrait(st, "motivation", /The Need/i);
  const ghost = _profTrait(st, "motivation", /The Ghost/i);
  const defence = _profTrait(st, "motivation", /The Defence/i);
  const origin = _profTrait(st, "origins");
  const stress = _profTrait(st, "stress");
  const values = _profTrait(st, "values");
  const aim = _profTrait(st, "goals", /Longer Aim/i);
  const price = _profTrait(st, "goals", /Price/i);
  if (!want && !need && !wound) return null;
  const links = [];
  const add = (key, text, from) => links.push({key, text, from: from.filter(Boolean).map(t => t.trait)});
  if (want) add("want", `The conscious goal is ${want.trait}${want.desc ? ` — ${want.desc}` : ``}`, [want]);
  if (lie && want) add("belief", `They chase it because they believe ${lie.trait}: the want is what that belief makes look like the answer.`, [lie, want]);
  else if (lie) add("belief", `Underneath, they believe ${lie.trait}.`, [lie]);
  if (wound) add("origin", `The belief was learned from ${wound.trait}${ghost ? `, and it is still attached to ${ghost.trait}` : ``}.`, [wound, ghost]);
  if (need) add("need", `What would actually help is ${need.trait}${want ? ` — which the want stands in front of rather than delivering` : ``}.`, [need, want]);
  if (defence) add("strategy", `The strategy built on top is ${defence.trait}: it keeps the wound covered and keeps the need unmet.`, [defence]);
  if (stress || values){
    const s = stress ? STRATEGY_BY_STRESS[stress.category] : null;
    const v = values ? STRATEGY_BY_VALUES[values.category] : null;
    add("method", `When the strategy is tested they ${s || "fall back on habit"}${v ? `, and justify it by ${v}` : ``}.`, [stress, values]);
  }
  if (fear) add("fear", `The thing they organise their life to avoid is ${fear.trait}${wound ? ` — the wound happening again` : ``}.`, [fear]);
  if (origin) add("counterweight", `The one place the belief does not hold: ${origin.trait}. ${origin.desc || ""}`.trim(), [origin]);
  if (aim || price) add("stakes", `${aim ? `Right now it points at ${aim.trait}.` : ``}${price ? ` The cost they are already paying: ${price.trait}.` : ``}`.trim(), [aim, price]);
  return {want, fear, wound, lie, need, ghost, defence, origin, stress, values, links};
}

/* The pressure sheet had a trigger and an aftermath but no middle: nothing said how the
   trigger was READ, what the first move was, how far it has to go before the sheet's
   shifts happen, or what the repair looks like. Each stage names the base trait it is
   grounded in; a stage with nothing to ground it is omitted rather than invented. */
const APPRAISAL_BY_ATTACHMENT = {
  "Secure": "reads it as a problem to solve, not a verdict on them",
  "Anxious": "reads it as the first sign of being left",
  "Avoidant": "reads it as a demand, and demands are the thing to get away from",
  "Disorganized": "reads it two ways at once and acts on whichever arrives first",
};
const THRESHOLD_BY_VALUES = {
  "Rigid & Principled": "when a rule is broken in front of them",
  "Pragmatic & Flexible": "only once the workaround has also failed",
  "Loyalty-Bound": "the moment one of their people is touched",
  "Self-Interested": "when it starts to cost them personally",
  "Idealistic & Visionary": "when the picture of how it should be is mocked",
};
function pressureChain(st, pst){
  const fear = _profTrait(st, "motivation", /Core Fear/i);
  const wound = _profTrait(st, "motivation", /Core Wound/i);
  const lie = _profTrait(st, "motivation", /The Lie/i);
  const attach = _profTrait(st, "attachment");
  const stress = _profTrait(st, "stress");
  const values = _profTrait(st, "values");
  const repair = _profTrait(st, "repair");
  const level = pst && pst.__pressure ? pst.__pressure.level : 1;
  const stages = [];
  const add = (key, title, text, from) => stages.push({key, title, text, from: from.filter(Boolean).map(t => t.trait)});
  if (fear || wound) add("trigger", "Trigger", fear
    ? `Anything that looks like ${fear.trait}${wound ? `, especially when it rhymes with ${wound.trait}` : ``}.`
    : `Anything that reopens ${wound.trait}.`, [fear, wound]);
  if (attach || lie){
    const a = attach ? APPRAISAL_BY_ATTACHMENT[attach.category] : null;
    add("appraisal", "How they read it", `${a ? `They ${a}` : `They read it through the belief`}${lie ? `, because underneath they still hold that ${lie.trait}` : ``}.`, [attach, lie]);
  }
  if (stress){
    const shifted = pst ? Object.values(pst).filter(s => s && s.shifted).map(s => `${s.fromCat} → ${s.toCat}`) : [];
    add("tactic", "First move", `${stress.trait}: ${stress.desc || STRATEGY_BY_STRESS[stress.category] || ""}${shifted.length ? ` Under load the profile shifts: ${shifted.join("; ")}.` : ``}`.trim(), [stress]);
  }
  if (values || level !== undefined){
    const v = values ? THRESHOLD_BY_VALUES[values.category] : null;
    add("threshold", "Where it tips", `${v ? `It tips ${v}` : `It tips when the pressure passes their composure`}${level < 0.99 ? ` — the sheet shows them at ${Math.round(level*100)}%, short of that` : ` — the sheet shows them past it`}.`, [values]);
  }
  const rec = pressureRecovery(st);
  if (rec) add("aftermath", "Afterwards", rec, [stress, attach]);
  if (repair) add("repair", "How they repair it", `${repair.trait}: ${repair.desc || ""}${repair.example ? ` — “${repair.example}”` : ``}`.trim(), [repair]);
  return stages.length ? {level, stages} : null;
}

/* A contradiction was an axis, two trait names and one question. What a scene needs is
   the four things the audit names: when the second face appears, with whom, what
   actually changes, and what it costs. Derived from the traits' own conditions and
   the sheet's context roles where the data exists, and left as a prompt the author
   answers where it does not. Answers live in charMeta.contradictionAnswers so they
   save, export and survive a re-render. */
const CONTEXT_WORDS = {public:"in public", private:"in private", authority:"in front of authority", threat:"under threat",
  intimacy:"with someone close", fatigue:"when tired", work:"at work", home:"at home", stranger:"with strangers", peer:"among peers", dependent:"with someone who depends on them"};
function structuredContradiction(st, meta){
  const base = contradictionFor(st);
  if (!base) return null;
  const fn = _profTrait(st, "contradiction");
  const condsOf = t => (t.conditions || []).map(c => CONTEXT_WORDS[c] || c);
  const hiWhen = condsOf(base.hi), loWhen = condsOf(base.lo);
  const roles = ["Among Peers","Under Authority","With Dependents"].map(c => _profTrait(st, "contextrole", new RegExp("^" + c + "$"))).filter(Boolean);
  const attach = _profTrait(st, "attachment");
  const derived = {
    when: hiWhen.length || loWhen.length
      ? `${base.hi.trait} ${hiWhen.length ? hiWhen.join(" or ") : "by default"}; ${base.lo.trait} ${loWhen.length ? loWhen.join(" or ") : "the rest of the time"}.`
      : null,
    who: roles.length ? `The context roles give the likely split: ${roles.map(r => `${r.category.toLowerCase()} they are ${r.trait}`).join("; ")}.` : (attach ? `${attach.category} attachment decides who gets which face.` : null),
    change: `On ${base.axisLabel.toLowerCase()} they move from ${base.hi.trait} to ${base.lo.trait} — a ${base.tier.toLowerCase()} swing.`,
    cost: fn ? `${fn.trait}: ${fn.desc || ""}`.trim() : null,
    fn,
  };
  const prompts = {
    when: "When does the second face appear?",
    who: "With whom?",
    change: "What actually changes?",
    cost: "What does it cost them?",
  };
  const answers = (meta && meta.contradictionAnswers) || {};
  const fields = Object.keys(prompts).map(k => ({key:k, prompt:prompts[k], derived: derived[k], answer: answers[k] || ""}));
  return Object.assign({}, base, {fields, fn});
}

/* Intensity was doing four jobs. A trait can be constant but invisible (a private
   ritual), rare but unmissable (a scar), or loud and gone in a scene (a flare of
   temper). Where the bank carries the four dimensions they are used as written;
   elsewhere they are inferred from what the section is, so every card can show them
   and the export can carry them — with the inference flagged so nobody mistakes a
   default for an authored judgment. */
const DIM_DEFAULTS_BY_SECTION = {
  "Appearance":            {visibility:5, persistence:5},
  "Mannerisms":            {visibility:4, persistence:4},
  "Habits & Vices":        {visibility:3, persistence:4},
  "Verbosity Traits":      {visibility:4, persistence:4},
  "Vocabulary Traits":     {visibility:4, persistence:4},
  "Dialogue Grammar Traits": {visibility:4, persistence:4},
  "Personality Traits":    {visibility:3, persistence:4},
  "Humor Style":           {visibility:4, persistence:4},
  "Social Role in a Group": {visibility:3, persistence:4},
  "Role by Context":       {visibility:3, persistence:3},
  "Motivation & Wound":    {visibility:1, persistence:5},
  "Positive Origins":      {visibility:1, persistence:5},
  "Goals & Stakes":        {visibility:2, persistence:3},
  "Attachment & Intimacy Style": {visibility:2, persistence:5},
  "Conflict & Stress Response":  {visibility:3, persistence:4},
  "Values & Moral Line":   {visibility:3, persistence:5},
  "Contradiction Functions": {visibility:2, persistence:4},
  "Recovery & Repair":     {visibility:3, persistence:4},
  "Ordinary Texture":      {visibility:3, persistence:3},
  "Competence & Method":   {visibility:3, persistence:5},
};
const DIM_LABELS = {frequency:"how often it shows", visibility:"how easily others see it", persistence:"how long it lasts", narrativeSalience:"how much weight it carries"};
function traitDimensions(t){
  if (!t) return null;
  const def = DIM_DEFAULTS_BY_SECTION[t.section] || {visibility:3, persistence:3};
  const inferred = [];
  const pick = (key, fallback) => {
    const v = t[key];
    if (Number.isInteger(v) && v >= 1 && v <= 5) return v;
    inferred.push(key);
    return fallback;
  };
  const rt = RTIER_ORDER.indexOf(rarityTier(t));
  return {
    frequency: pick("frequency", clamp(t.intensity || 3, 1, 5)),
    visibility: pick("visibility", def.visibility),
    persistence: pick("persistence", def.persistence),
    narrativeSalience: pick("narrativeSalience", clamp(Math.round((rt + 1 + (t.intensity || 3)) / 2), 1, 5)),
    inferred,
  };
}

/* The emergent label is a first draft. Once the author has a better name for what
   the sheet adds up to, it should be theirs — and should outlive the next re-render,
   the save and the export. */
function characterLabel(st, meta){
  if (meta && meta.label) return {name: meta.label, exact: true, authored: true};
  const em = emergentArchetypeName(st);
  return em ? Object.assign({authored:false}, em) : null;
}

// ================= CONTEXTUAL CHARACTER ENGINE (MVP) =================
/* The sheet was one static list: the same 40 cards whether the character is alone,
   in a crowd, in front of their boss or being threatened. Real behaviour is a
   baseline plus per-context activation and suppression. This is the first pass at
   that, kept deterministic and explainable: for a chosen context every seated card is
   classed active, amplified, suppressed or exception, with the rule that decided it
   written out. Rules read, in order of authority: the trait's own `conditions` and
   `exceptions` (authored intent), the trait's section (what kind of thing it is), its
   dimensions (how visible and persistent it is), the character's internal dimensions
   (who they are), and the trait's polarity on the axes the context tests. Nothing
   here draws a trait: the baseline sheet is the truth and a context is a lens on it. */
const CONTEXT_MODES = [
  {id:"baseline",  label:"Baseline",      tags:[],                     blurb:"The sheet as generated — no room, no audience."},
  {id:"public",    label:"In public",     tags:["public","stranger"],  blurb:"Strangers present. Surface shows; the interior goes quiet."},
  {id:"private",   label:"In private",    tags:["private","home","intimacy"], blurb:"Alone or with someone close. The interior shows; the performance drops."},
  {id:"authority", label:"Under authority", tags:["authority","work"], blurb:"Someone with power over them is in the room."},
  {id:"threat",    label:"Under threat",  tags:["threat","fatigue"],   blurb:"Something has gone wrong. The stress response takes the wheel."},
];
const CONTEXT_MODE_IDS = CONTEXT_MODES.map(m => m.id);
function contextMode(id){ return CONTEXT_MODES.find(m => m.id === id) || CONTEXT_MODES[0]; }

/* Per-context rules on section and polarity. Each entry is {test, status, why}; the
   first matching rule after the authored ones wins, so the order is the priority. */
const _SURFACE_SECTIONS = new Set(["Appearance","Mannerisms","Verbosity Traits","Vocabulary Traits","Dialogue Grammar Traits","Humor Style"]);
const _INTERIOR_SECTIONS = new Set(["Motivation & Wound","Positive Origins","Attachment & Intimacy Style","Contradiction Functions"]);
const CONTEXT_LENS_RULES = {
  public: [
    {test:(t,d)=> t.category === "Among Peers", status:"amplified", why:"the peer-room role is on show"},
    {test:(t,d)=> t.category === "With Dependents" || t.category === "Under Authority", status:"suppressed", why:"a role for a different room"},
    {test:(t,d)=> _INTERIOR_SECTIONS.has(t.section), status:"suppressed", why:"interior material — it drives them, but nobody in the room sees it"},
    {test:(t,d)=> d.visibility <= 2, status:"suppressed", why:"low visibility — strangers would not catch it"},
    {test:(t,d,dim)=> dim.selfPresent > 0.3 && t.pol && t.pol.ego === 1, status:"amplified", why:"self-presentation runs high, so the confident face comes forward with an audience"},
    {test:(t,d,dim)=> dim.emoExpress < -0.3 && t.pol && t.pol.emo === 1, status:"suppressed", why:"emotional expression runs guarded — the open version stays home"},
    {test:(t,d)=> _SURFACE_SECTIONS.has(t.section), status:"amplified", why:"surface behaviour is what an audience gets"},
  ],
  private: [
    {test:(t,d)=> t.category === "With Dependents", status:"amplified", why:"the people who depend on them are the private room"},
    {test:(t,d)=> t.category === "Among Peers" || t.category === "Under Authority", status:"suppressed", why:"a role for a different room"},
    {test:(t,d)=> _INTERIOR_SECTIONS.has(t.section), status:"amplified", why:"interior material — this is where it is allowed out"},
    {test:(t,d,dim)=> dim.selfPresent > 0.3 && t.pol && t.pol.ego === 1, status:"suppressed", why:"the grandiose face is a performance, and there is no audience"},
    {test:(t,d,dim)=> dim.emoDepth > 0.3 && t.pol && t.pol.emo === 1, status:"amplified", why:"emotional depth runs high; in private the guard comes down"},
    {test:(t,d)=> t.section === "Ordinary Texture" || t.section === "Habits & Vices", status:"amplified", why:"habits and small pleasures belong to unwatched time"},
    {test:(t,d)=> t.section === "Appearance" && d.visibility >= 5, status:"active", why:"still there; nobody is looking"},
  ],
  authority: [
    {test:(t,d)=> t.category === "Under Authority", status:"amplified", why:"exactly the room this role is for"},
    {test:(t,d)=> t.category === "Among Peers" || t.category === "With Dependents", status:"suppressed", why:"a role for a different room"},
    {test:(t,d,dim)=> dim.obedience > 0.3 && t.pol && t.pol.rebel === 1, status:"suppressed", why:"institutional obedience runs high — the defiance waits until the boss has left"},
    {test:(t,d,dim)=> dim.obedience < -0.3 && t.pol && t.pol.rebel === 1, status:"amplified", why:"institutional obedience runs low — authority is what the defiance is for"},
    {test:(t,d,dim)=> dim.obedience > 0.3 && t.pol && t.pol.asrt === 1, status:"suppressed", why:"assertion is dialled down in front of rank"},
    {test:(t,d)=> t.pol && t.pol.form === 1, status:"amplified", why:"formality rises with rank in the room"},
    {test:(t,d)=> t.pol && t.pol.form === -1, status:"suppressed", why:"the casual register is withheld from rank"},
    {test:(t,d)=> t.section === "Motivation & Wound" && /Core Want|The Lie/.test(t.category), status:"active", why:"still driving, still hidden"},
    {test:(t,d)=> _INTERIOR_SECTIONS.has(t.section), status:"suppressed", why:"interior material stays interior in front of power"},
  ],
  threat: [
    {test:(t,d)=> t.section === "Conflict & Stress Response", status:"amplified", why:"the stress response takes the wheel"},
    {test:(t,d)=> /Core Fear|The Defence|The Lie/.test(t.category), status:"amplified", why:"fear, defence and the lie are what a threat is made of"},
    {test:(t,d)=> t.section === "Recovery & Repair", status:"suppressed", why:"repair comes after, not during"},
    {test:(t,d)=> t.section === "Humor Style" && t.category !== "Dry & Deadpan" && t.category !== "Cruel & Barbed", status:"suppressed", why:"the jokes stop; only the dry and the barbed kinds survive a threat"},
    {test:(t,d)=> t.section === "Humor Style", status:"amplified", why:"the kind of humour that is a weapon comes out under threat"},
    {test:(t,d)=> t.section === "Ordinary Texture" || t.section === "Positive Origins", status:"suppressed", why:"ordinary texture and good history are the first things a threat switches off"},
    {test:(t,d,dim)=> dim.trust < -0.3 && t.pol && t.pol.warm === 1, status:"suppressed", why:"trust runs guarded — warmth is withdrawn when it might be used against them"},
    {test:(t,d)=> t.pol && t.pol.agr === -1, status:"amplified", why:"the hard edge shows"},
    {test:(t,d)=> d.persistence <= 2 && t.pol && t.pol.warm === 1, status:"suppressed", why:"a passing warmth is the first thing to go"},
    {test:(t,d)=> t.section === "Values & Moral Line", status:"active", why:"what they will and will not do is being tested, not changed"},
  ],
};

function _exceptionHits(t, mode){
  const ex = t.exceptions || [];
  if (!ex.length) return null;
  const words = mode.tags.concat(mode.id === "private" ? ["family","partner","friends","close"] : mode.id === "authority" ? ["boss","rank","superiors"] : []);
  const hit = ex.find(e => words.some(w => String(e).toLowerCase().includes(w)));
  return hit || null;
}

function contextualView(st, contextId){
  const mode = contextMode(contextId);
  const dim = internalDimensions(st);
  const slots = [];
  Object.keys(st || {}).forEach(id => {
    const s = st[id]; const t = s && s.trait; if (!t) return;
    const d = traitDimensions(t);
    let status = "active", why = mode.id === "baseline" ? "baseline" : "no rule moves it here", rule = "none";
    if (mode.id !== "baseline"){
      const ex = _exceptionHits(t, mode);
      const conds = t.conditions || [];
      if (ex){ status = "exception"; why = `authored exception: "${ex}"`; rule = "exceptions"; }
      else if (conds.length && conds.some(c => mode.tags.includes(c))){ status = "amplified"; why = `authored for ${conds.join("/")}`; rule = "conditions"; }
      else if (conds.length){ status = "suppressed"; why = `authored for ${conds.join("/")} only`; rule = "conditions"; }
      else {
        const r = (CONTEXT_LENS_RULES[mode.id] || []).find(r => r.test(t, d, dim));
        if (r){ status = r.status; why = r.why; rule = "section/polarity"; }
      }
    }
    slots.push({slotId:id, trait:t, status, why, rule});
  });
  const counts = {active:0, amplified:0, suppressed:0, exception:0};
  slots.forEach(s => counts[s.status]++);
  const headline = mode.id === "baseline" ? mode.blurb
    : `${mode.blurb} ${counts.amplified} come forward, ${counts.suppressed} go quiet${counts.exception ? `, ${counts.exception} authored exception${counts.exception>1?"s":""}` : ``}.`;
  return {context: mode.id, label: mode.label, counts, headline, slots, byId: Object.fromEntries(slots.map(s => [s.slotId, s]))};
}

/* Every context at once, for the comparison export and the test suite. */
function contextualViews(st){
  return CONTEXT_MODE_IDS.map(id => contextualView(st, id));
}

// ================= RELATIONSHIP WORKSPACE (MVP) =================
/* Relationships were a pairwise axis comparison: two profiles, the axes where they
   differ, a verdict. Nothing was stored, nothing was directed, and nothing said what
   either party wanted from the other. The workspace adds directed edges between cast
   members — {from, to, trust, dependence, status, obligation, knows, wants, conceals}
   — with defaults derived from the sheets so an edge starts populated rather than
   blank, and roles that can generate a new member to fill a seat opposite someone.
   Everything here is pure; the cast array and the edge list live in app.js. */
const RELATIONSHIP_ROLES = [
  {id:"rival",      label:"Rival",      blurb:"Wants the same thing, from the other side.", oppose:["assertiveness","honesty"], align:["ambition","intelligence"], status:"equal", trust:2, dependence:2},
  {id:"mentor",     label:"Mentor",     blurb:"Has been where they are going.",            oppose:["activeness","rebelliousness"], align:["intelligence"], profile:{role:"Leader", attachment:"Secure"}, status:"above", trust:4, dependence:2},
  {id:"protege",    label:"Protégé",    blurb:"Is where they used to be.",                  oppose:["confidence"], align:["curiosity"], profile:{role:"Outsider"}, status:"below", trust:3, dependence:4},
  {id:"confidant",  label:"Confidant",  blurb:"Knows the version nobody else sees.",       oppose:[], align:["honesty","friendliness"], profile:{attachment:"Secure", role:"Connector"}, status:"equal", trust:5, dependence:3},
  {id:"dependant",  label:"Dependant",  blurb:"Needs them, and they know it.",             oppose:["assertiveness","discipline"], align:[], profile:{attachment:"Anxious"}, status:"below", trust:3, dependence:5},
  {id:"antagonist", label:"Antagonist", blurb:"Stands in the way on purpose.",             oppose:["friendliness","agreeableness","honesty"], align:["assertiveness"], profile:{values:"Self-Interested"}, status:"equal", trust:1, dependence:1},
  {id:"ally",       label:"Ally",       blurb:"On the same side, for now.",                oppose:["emotion"], align:["ambition","positivity"], profile:{values:"Loyalty-Bound"}, status:"equal", trust:4, dependence:3},
  {id:"ex",         label:"The ex",     blurb:"Knows too much and still cares, or says not.", oppose:["friendliness","discipline"], align:["emotion"], profile:{attachment:"Avoidant"}, status:"equal", trust:2, dependence:2},
];
const RELATIONSHIP_STATUS = ["above","equal","below"];
function relationshipRole(id){ return RELATIONSHIP_ROLES.find(r => r.id === id) || null; }

/* Personality overrides for a member generated INTO a role opposite an anchor: the
   role's opposed axes flip against the anchor, its aligned axes copy the anchor, and
   the rest are a fresh roll — the same recipe as the foil finder, with the role
   choosing the axes instead of the dice. */
function roleOverridesFor(anchorOverrides, roleId, rng){
  const role = relationshipRole(roleId);
  const out = {};
  PERSONALITY_AXES.forEach(a=>{
    const src = anchorOverrides[a.id] || 0;
    if (role && role.oppose.includes(a.id)){
      const mag = Math.max(35, Math.abs(src));
      out[a.id] = src > 0 ? -mag : src < 0 ? mag : (rng() < 0.5 ? -mag : mag);
    } else if (role && role.align.includes(a.id)){
      out[a.id] = Math.abs(src) >= 15 ? src : Math.round((rng()*2-1)*40);
    } else out[a.id] = Math.round((rng()*2-1)*45);
  });
  return out;
}

/* A directed edge's defaults, read off the two sheets. Every number comes with its
   reason so the author can see what to overrule. */
function edgeDefaults(fromState, toState, roleId){
  const role = relationshipRole(roleId);
  const dim = internalDimensions(fromState);
  const pa = axisProfile(fromState), pb = axisProfile(toState);
  const why = [];
  let trust = role ? role.trust : 3;
  if (dim.trust > 0.3){ trust = Math.min(5, trust + 1); why.push("trust runs high in them"); }
  if (dim.trust < -0.3){ trust = Math.max(1, trust - 1); why.push("trust runs guarded in them"); }
  const honB = (pb.hon || 0), honA = (pa.hon || 0);
  if (honB < -0.4 && honA > 0.2){ trust = Math.max(1, trust - 1); why.push("the other deals crooked and they deal straight"); }
  let dependence = role ? role.dependence : 3;
  const attach = _profTrait(fromState, "attachment");
  if (attach && attach.category === "Anxious"){ dependence = Math.min(5, dependence + 1); why.push("anxious attachment leans in"); }
  if (attach && attach.category === "Avoidant"){ dependence = Math.max(1, dependence - 1); why.push("avoidant attachment holds back"); }
  const roleA = _profTrait(fromState, "role");
  if (roleA && roleA.category === "Caretaker"){ dependence = Math.max(1, dependence - 1); why.push("a caretaker is depended on, not dependent"); }
  let status = role ? role.status : "equal";
  if (!role){
    const d = (pa.asrt || 0) - (pb.asrt || 0);
    status = d > 0.6 ? "above" : d < -0.6 ? "below" : "equal";
    if (status !== "equal") why.push(`assertiveness gap of ${d.toFixed(1)}`);
  }
  const want = _profTrait(fromState, "motivation", /Core Want/i);
  const lie = _profTrait(fromState, "motivation", /The Lie/i);
  const defence = _profTrait(fromState, "motivation", /The Defence/i);
  const contraB = contradictionFor(toState);
  const woundB = _profTrait(toState, "motivation", /Core Wound/i);
  const sharp = (pa.intel || 0) > 0.2 || (pa.cur || 0) > 0.2;
  const knows = contraB ? (sharp ? `Has noticed that they are ${contraB.hi.trait} and also ${contraB.lo.trait}.` : `Has not noticed the contradiction the reader can see.`)
              : woundB ? (sharp ? `Suspects ${woundB.trait}.` : `Knows nothing of ${woundB.trait}.`) : "";
  const wants = want ? `${want.trait} — and this person is in the way of it, or the route to it.` : "";
  const conceals = lie ? `That underneath it they believe ${lie.trait}.` : defence ? `${defence.trait}.` : "";
  const obligation = role ? ({mentor:"To make them ready and then let go.", protege:"To become worth the time.", confidant:"To keep what they were told.", dependant:"To be there when it counts.", ally:"To hold the line when it costs.", ex:"None that either will admit to.", rival:"Only to fight fair, and only if watched.", antagonist:"None."})[role.id] || "" : "";
  return {trust, dependence, status, obligation, knows, wants, conceals, why};
}

function makeEdge(fromId, toId, roleId, defaults, extra){
  return Object.assign({id: "e_" + fromId + "_" + toId + "_" + (roleId || "x"), from: fromId, to: toId, role: roleId || null,
    trust: 3, dependence: 3, status: "equal", obligation: "", knows: "", wants: "", conceals: "", notes: ""}, defaults || {}, extra || {});
}
/* Edges that name a member no longer in the cast are dropped, not repaired: a
   dangling edge is a lie about the ensemble. */
function pruneEdges(edges, members){
  const ids = new Set((members || []).map(m => m.id));
  return (edges || []).filter(e => e && ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
}
function validateEdge(e){
  const problems = [];
  if (!e || typeof e !== 'object') return ["edge is not an object"];
  ["from","to"].forEach(k => { if (typeof e[k] !== 'string' || !e[k]) problems.push(`edge.${k} must be a member id`); });
  ["trust","dependence"].forEach(k => { if (!Number.isInteger(e[k]) || e[k] < 1 || e[k] > 5) problems.push(`edge.${k} must be 1..5`); });
  if (!RELATIONSHIP_STATUS.includes(e.status)) problems.push("edge.status must be above/equal/below");
  if (e.role && !relationshipRole(e.role)) problems.push(`edge.role "${e.role}" is not a known role`);
  ["obligation","knows","wants","conceals","notes"].forEach(k => { if (e[k] !== undefined && typeof e[k] !== 'string') problems.push(`edge.${k} must be text`); });
  return problems;
}
function edgesToMarkdown(edges, members){
  const name = id => { const m = (members || []).find(x => x.id === id); return m ? (m.meta && m.meta.name) || id : id; };
  return (edges || []).map(e => {
    const role = relationshipRole(e.role);
    const L = [`- **${name(e.from)} → ${name(e.to)}**${role ? ` (${role.label})` : ``}: trust ${e.trust}/5 · dependence ${e.dependence}/5 · stands ${e.status}`];
    if (e.obligation) L.push(`  - owes: ${e.obligation}`);
    if (e.knows) L.push(`  - knows: ${e.knows}`);
    if (e.wants) L.push(`  - wants: ${e.wants}`);
    if (e.conceals) L.push(`  - conceals: ${e.conceals}`);
    if (e.notes) L.push(`  - notes: ${e.notes}`);
    return L.join("\n");
  }).join("\n");
}

// ================= ARCS AND VERSIONED EVENTS (MVP) =================
/* A character was a single frozen sheet: the tool could say who someone is and had no
   way to say who they became. An arc is an ordered log of events, each carrying the
   belief it challenged, the choice made, the cost paid, and a shape — and each
   proposing a small set of trait changes the author accepts or declines one at a time.
   Nothing is applied behind the author's back, every event stores the before and after
   for the slots it touched, and the whole arc replays from the baseline sheet, so
   undoing an event is exact rather than approximate. */
const ARC_SHAPES = [
  {id:"growth",        label:"Growth",        blurb:"The belief loosened. They move toward the thing they were avoiding.", dir:1},
  {id:"deterioration", label:"Deterioration", blurb:"The belief won. They move further into the defence.", dir:-1},
  {id:"steadfast",     label:"Steadfast",     blurb:"It cost them and they did not move. Nothing on the sheet changes; the cost is the record.", dir:0},
  {id:"cyclical",      label:"Cyclical",      blurb:"They have been here before. This undoes the last change of the opposite kind.", dir:0},
];
const ARC_SHAPE_IDS = ARC_SHAPES.map(s => s.id);
function arcShape(id){ return ARC_SHAPES.find(s => s.id === id) || null; }

function newEventId(seq){ return "ev_" + String(seq).padStart(3, "0"); }
function makeArcEvent(seq, fields){
  return Object.assign({
    id: newEventId(seq), seq, title: "", beliefChallenged: "", choice: "", cost: "",
    shape: "growth", changes: [], at: null,
  }, fields || {});
}
function validateArcEvent(e){
  const problems = [];
  if (!e || typeof e !== 'object') return ["event is not an object"];
  if (typeof e.id !== 'string' || !e.id) problems.push("event.id is missing");
  if (!Number.isInteger(e.seq) || e.seq < 1) problems.push("event.seq must be a positive integer");
  if (!ARC_SHAPE_IDS.includes(e.shape)) problems.push(`event.shape "${e.shape}" is not a known shape`);
  ["title","beliefChallenged","choice","cost"].forEach(k => { if (e[k] !== undefined && typeof e[k] !== 'string') problems.push(`event.${k} must be text`); });
  if (!Array.isArray(e.changes)) problems.push("event.changes must be a list");
  else e.changes.forEach((c, i) => {
    if (!c || typeof c.slotId !== 'string') problems.push(`change ${i} has no slotId`);
    if (c && c.toId !== null && !Number.isInteger(c.toId)) problems.push(`change ${i} has a bad toId`);
    if (c && typeof c.accepted !== 'boolean') problems.push(`change ${i} has no accepted flag`);
  });
  return problems;
}

/* The proposal. Deterministic in the event id, so the same event always proposes the
   same changes and an arc can be rebuilt on another machine. Growth moves the loudest
   negative personality card toward its positive pole and retires the Lie; deterioration
   does the reverse and hardens the Defence; steadfast proposes nothing; cyclical
   reverses the most recent accepted change of the opposite direction. */
function _oppositeCategory(t, dir){
  const ax = PERSONALITY_AXES.find(a => a.pos === t.category || a.neg === t.category || a.mid === t.category);
  if (!ax) return null;
  return dir > 0 ? ax.pos : ax.neg;
}
function proposeArcChanges(st, event, priorEvents){
  const shape = arcShape(event.shape);
  if (!shape) return [];
  const out = [];
  const push = (slotId, trait, why) => {
    const cur = st[slotId] && st[slotId].trait;
    if (!trait || !cur || trait.id === cur.id) return;
    out.push({slotId, fromId: cur.id, toId: trait.id, why, accepted: false});
  };
  if (shape.id === "cyclical"){
    // Walk backwards for an accepted change and put that slot back where it was.
    for (let i = (priorEvents || []).length - 1; i >= 0 && out.length < 2; i--){
      (priorEvents[i].changes || []).forEach(c => {
        if (!c.accepted || out.some(o => o.slotId === c.slotId)) return;
        const back = TRAITS_BY_ID.get(c.fromId);
        if (back && st[c.slotId] && st[c.slotId].trait && st[c.slotId].trait.id !== c.fromId){
          out.push({slotId: c.slotId, fromId: st[c.slotId].trait.id, toId: c.fromId,
                    why: `back to where event ${priorEvents[i].seq} found them — this has happened before`, accepted: false});
        }
      });
    }
    return out;
  }
  if (shape.dir === 0) return out;   // steadfast: the cost is the record
  withRng(mulberry32(hashSeedString(event.id + "|" + event.shape)), ()=>{
    // 1. The loudest personality card pointing the wrong way for this shape.
    const pers = Object.keys(st).filter(k => k.startsWith("pers_") && st[k] && st[k].trait)
      .map(k => ({k, t: st[k].trait}))
      .filter(x => {
        const ax = PERSONALITY_AXES.find(a => a.pos === x.t.category || a.neg === x.t.category || a.mid === x.t.category);
        if (!ax) return false;
        return shape.dir > 0 ? x.t.category !== ax.pos : x.t.category !== ax.neg;
      })
      .sort((a, b) => (b.t.intensity || 3) - (a.t.intensity || 3));
    if (pers.length){
      const chosen = pers[0];
      const cat = _oppositeCategory(chosen.t, shape.dir);
      const pool = cat ? byFilter(SECTION_OF_CATEGORY.get(cat) || chosen.t.section, cat) : [];
      push(chosen.k, pickInRange(pool, "balanced", clamp((chosen.t.intensity || 3) - 0.5, 1, 5), 3),
        `${shape.label.toLowerCase()} on ${chosen.t.category.split("—")[0].trim()}: they move from "${chosen.t.trait}" toward the other pole`);
    }
    // 2. The Lie loosens on growth; the Defence hardens on deterioration.
    const targetCat = shape.dir > 0 ? /The Lie/i : /The Defence/i;
    const slotId = Object.keys(st).find(k => k.startsWith("prof_motivation_") && st[k] && st[k].trait && targetCat.test(st[k].trait.category));
    if (slotId){
      const cur = st[slotId].trait;
      const pool = byFilter(cur.section, cur.category).filter(t => t.id !== cur.id);
      const want = shape.dir > 0 ? clamp((cur.intensity || 3) - 1, 1, 5) : clamp((cur.intensity || 3) + 1, 1, 5);
      push(slotId, pickInRange(pool, "balanced", want, 3),
        shape.dir > 0 ? `the lie they believe loosens its grip` : `the defence they built gets thicker`);
    }
    // 3. Attachment moves one step on a strong event.
    const att = Object.keys(st).find(k => k.startsWith("prof_attachment_") && st[k] && st[k].trait);
    if (att && (event.cost || "").length > 20){
      const ladder = ["Disorganized", "Avoidant", "Anxious", "Secure"];
      const at = ladder.indexOf(st[att].trait.category);
      const next = at >= 0 ? ladder[clamp(at + shape.dir, 0, ladder.length - 1)] : null;
      if (next && next !== st[att].trait.category){
        push(att, pickInRange(byFilter("Attachment & Intimacy Style", next), "balanced", 3, 3),
          `a cost that size moves them from ${st[att].trait.category} toward ${next}`);
      }
    }
  });
  return out;
}

/* Applying an event is applying only its ACCEPTED changes, and never mutating the
   state handed in: an arc is a chain of snapshots, not an edit in place. */
function applyArcEvent(st, event){
  const next = {};
  Object.keys(st || {}).forEach(k => { next[k] = Object.assign({}, st[k]); });
  (event.changes || []).forEach(c => {
    if (!c.accepted) return;
    const t = TRAITS_BY_ID.get(c.toId);
    if (t && next[c.slotId]) next[c.slotId] = Object.assign({}, next[c.slotId], {trait: t, arcEvent: event.id});
  });
  return next;
}
function replayArc(baseState, events){
  return (events || []).slice().sort((a, b) => a.seq - b.seq).reduce((st, e) => applyArcEvent(st, e), baseState || {});
}
/* What the arc adds up to, for the header and the export. */
function arcSummary(events){
  const kept = (events || []).filter(e => (e.changes || []).some(c => c.accepted));
  const counts = {};
  ARC_SHAPE_IDS.forEach(id => { counts[id] = (events || []).filter(e => e.shape === id).length; });
  const dominant = ARC_SHAPE_IDS.slice().sort((a, b) => counts[b] - counts[a])[0];
  const changes = (events || []).reduce((n, e) => n + (e.changes || []).filter(c => c.accepted).length, 0);
  return {events: (events || []).length, eventsWithChanges: kept.length, changes, counts,
    shape: (events || []).length ? dominant : null,
    line: (events || []).length
      ? `${events.length} event${events.length===1?'':'s'}, ${changes} accepted change${changes===1?'':'s'} — mostly ${arcShape(dominant).label.toLowerCase()}.`
      : "No events yet. The sheet is where they start."};
}
function arcToMarkdown(events){
  return (events || []).slice().sort((a,b)=>a.seq-b.seq).map(e => {
    const L = [`### ${e.seq}. ${e.title || "Untitled event"} — _${(arcShape(e.shape)||{}).label || e.shape}_`];
    if (e.beliefChallenged) L.push(`- **Belief challenged:** ${e.beliefChallenged}`);
    if (e.choice) L.push(`- **Choice:** ${e.choice}`);
    if (e.cost) L.push(`- **Cost:** ${e.cost}`);
    (e.changes || []).forEach(c => {
      const from = TRAITS_BY_ID.get(c.fromId), to = TRAITS_BY_ID.get(c.toId);
      L.push(`- ${c.accepted ? "**Changed**" : "Proposed (declined)"}: ${from ? from.trait : c.fromId} → ${to ? to.trait : c.toId} — ${c.why}`);
    });
    return L.join("\n");
  }).join("\n\n");
}

function buildStressVariant(baseVerbLevel, baseRegLevel, mannerCount, rarityPref, sourceState){
  /* Scaled by the pressure dial rather than pinned to the extreme. At 1.0 these are
     exactly the values this function has always used, so the default is unchanged; at
     0.4 you get someone having a difficult afternoon rather than a crisis. */
  const p = pressureLevel();
  const stressCompLevel = 2 * p;
  const push = 1.5 * p;
  const stressVerbLevel = baseVerbLevel >= 0 ? Math.max(baseVerbLevel, push) : Math.min(baseVerbLevel, -push);
  const st = sourceState || state;

  // Under-pressure picks should reflect the EXAGGERATED stress levels, not the calm
  // baseline ones — otherwise a character's pressure sheet would use ordinary-mood
  // trait affinity even though the whole point of this sheet is what changes under load.
  //
  // BUG FIX: this used to call setAffinityVec and never put it back, leaving the
  // module-level vector stuck in a stressed posture after every generation with
  // "Under Pressure" on. It was masked only because the other entry points happen to
  // set the vector themselves first; any new path calling pickInRange without doing so
  // would silently inherit a panicking character's affinity. Save and restore.
  const _priorAffinityVec = CURRENT_AFFINITY_VEC;
  try {
  const stressOverrides = {
    verbosity: Math.round(clamp(stressVerbLevel,-2,2)*50),
    register:  Math.round(clamp(baseRegLevel,-2,2)*50),
    composure: Math.round(clamp(stressCompLevel,-2,2)*50),
  };
  setAffinityVec(stressOverrides);

  let pacingPool = byFilter(AXES.pacing.section, AXES.pacing.category).filter(t => STRESS_KEYWORDS.test(t.trait+" "+t.desc));
  if (!pacingPool.length) pacingPool = byFilter(AXES.pacing.section, AXES.pacing.category);
  const verbositySlot = {slotId:"verbosity", locked:false, label:"Verbosity (under pressure)", trait: pickWeighted(pacingPool, rarityPref)};

  const registerSlot = pickRegisterSlot(baseRegLevel, rarityPref);
  registerSlot.label = "Register (under pressure)";

  // BUG FIX: `if (s)` checked the slot but not its trait, and axisProfile's own comment
  // records that slots can legitimately hold trait:null (exhausted pool, disabled
  // section, loaded save). Dereferencing .trait.category here threw mid-generation.
  const currentProfileCats = {};
  PROFILE_SECTIONS.forEach(ps=>{
    const s = st["prof_"+ps.id+"_0"];
    if (s && s.trait) currentProfileCats[ps.id] = s.trait.category;
  });
  // BUG FIX: both of these were called one argument short, so `overrides` arrived
  // undefined and the signal map fell back to reading the LIVE DOM sliders — the calm
  // baseline — rather than the exaggerated stress levels this function spends its
  // whole body constructing. That quietly defeated most of the point of the sheet.
  const grammarSlot = pickGrammarSlot(stressVerbLevel, stressCompLevel, baseRegLevel, rarityPref, currentProfileCats, stressOverrides);
  const mannerSlots = pickMannerSlots(mannerCount, stressCompLevel, baseRegLevel, rarityPref, VOLATILE_MANNER_CATS.concat(MANNER_CATS), currentProfileCats, stressOverrides);

  const obj = {};
  [verbositySlot, registerSlot, grammarSlot, ...mannerSlots].forEach((s)=>{
    // renumber manner slots to avoid collision with base state keys when rendering separately
    obj[s.slotId.startsWith('manner') ? 'p_'+s.slotId : s.slotId] = s;
  });

  // ---- Beyond voice: where they end up SITTING under pressure ---------------
  // The sheet used to cover Verbosity / Register / Grammar / Mannerisms only — i.e.
  // it could tell you they talk faster, and nothing about the far more characterful
  // question of what happens to their seat in the room, their code, and their grip on
  // the people they love. Resolve those three sections again with the stress response
  // feeding forward through the same matrix, and report the ones that actually move.
  const stressCat = currentProfileCats.stress;
  const pressureCats = Object.assign({}, currentProfileCats);
  if (stressCat) pressureCats.stress = stressCat;
  PRESSURE_SHIFT_SECTIONS.forEach(id=>{
    const ps = PROFILE_SECTIONS.find(p=>p.id===id);
    if (!ps) return;
    const baseCat = currentProfileCats[id];
    if (!baseCat) return;                       // section disabled — nothing to shift
    // Resolve against the stress response only, so the shift is driven by how they
    // break rather than by the calm posture that produced baseCat in the first place.
    const seed = stressCat ? {stress: stressCat} : {};
    const cats = catsOf(ps.section);
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(id, seed, stressOverrides));
    const cat = pickCategoryWeighted(cats, boostMap);
    if (!cat) return;                           // every category here is banned out
    const tgt = clamp(profileTarget(id) + 0.6 * p, 1, 5);   // pressure reads louder than baseline
    const trait = pickInRange(byFilter(ps.section, cat), rarityPref, tgt, 4);
    if (!trait) return;
    obj['p_prof_'+id] = {
      slotId:'p_prof_'+id, locked:false, sectionId:id, target:tgt, trait,
      label: ps.label + (cat === baseCat ? " — holds (" + cat + ")" : " — " + baseCat + " → " + cat),
      shifted: cat !== baseCat, fromCat: baseCat, toCat: cat
    };
  });
  /* Carried on the returned object under a key no slot path can produce, so the sheet
     renderers (which all filter for `.trait`) skip it and the pressure panel can read
     it back. */
  obj.__pressure = {level: p, trigger: pressureTrigger(st), recovery: pressureRecovery(st)};
  return obj;
  } finally {
    CURRENT_AFFINITY_VEC = _priorAffinityVec;
  }
}

// ---------- Constraint mode UI ----------
const escHTML = (v) => String(v==null?"":v)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
// Chip removal is wired through inline onclick, so an interpolated value has to
// survive twice: once as a JS string literal, and then as an HTML attribute. Escape
// for JS FIRST — the browser HTML-decodes the attribute before parsing it as JS, so
// escaping in the other order turns O'Brien into a syntax error.
const escAttr = (v) => escHTML(String(v==null?"":v).replace(/\\/g, "\\\\").replace(/'/g, "\\'"));
/* Builds the declarative-action attributes for a template. JSON first (so a trait id
   stays a number and an apostrophe in a section title stays an apostrophe), then
   attribute escaping — in that order, because the reverse produces an attribute that
   parses as HTML and then fails as JSON, which is exactly the bug an inline handler
   containing "The one thing that doesn't fit" would have had. */
function actAttr(events, action, ...args){
  const json = JSON.stringify(args)
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `data-on="${events}" data-act="${action}" data-args="${json}"`;
}

function refreshConstraintChips(){
  const box = document.getElementById('constraintChips');
  if (!box) return;
  const byId = TRAITS_BY_ID;   // PERF: was rebuilding the whole 7,073-entry map per call
  let h = "";
  /* A ban chip said what was excluded but never how much — "never: Cruel & Barbed" is a
     very different decision at 8 traits than at 54, and the number was one lookup away
     the whole time. */
  const catSize = c => (TRAITS_BY_KEY.get((SECTION_OF_CATEGORY.get(c) || "") + "||" + c) || []).length;
  const secSize = sec => (catsOf(sec) || []).reduce((n,c)=> n + catSize(c), 0);
  const cost = n => n ? ` <span class="chipCost">(${n} trait${n===1?'':'s'})</span>` : ``;
  bannedSections.forEach(sec=> h += `<span class="chip chip-ban">never (section): ${escHTML(sec)}${cost(secSize(sec))} <b ${actAttr('click', 'removeBan', "section", sec)} title="Remove">&times;</b></span>`);
  bannedCategories.forEach(c=> h += `<span class="chip chip-ban">never: ${escHTML(c)}${cost(catSize(c))} <b ${actAttr('click', 'removeBan', "cat", c)} title="Remove">&times;</b></span>`);
  categoryTiers.forEach((tier,c)=> h += `<span class="chip ${tierMultiplier(c)>1?'chip-req':'chip-tier'}">${escHTML(tierLabel(tier))}: ${escHTML(c)} <b ${actAttr('click', 'removeTier', c)} title="Remove">&times;</b></span>`);
  requiredCategories.forEach(c=> h += `<span class="chip chip-req">at least one: ${escHTML(c)} <b ${actAttr('click', 'removeRequiredCategory', c)} title="Remove">&times;</b></span>`);
  bannedTraitIds.forEach(id=>{ const t=byId.get(id); if(t) h += `<span class="chip chip-ban">never: ${escHTML(t.trait)} <b ${actAttr('click', 'removeBan', "trait", "${id}")} title="Remove">&times;</b></span>`; });
  requiredTraitIds.forEach(id=>{ const t=byId.get(id); if(t) h += `<span class="chip chip-req">always: ${escHTML(t.trait)} <b ${actAttr('click', 'removeReq', "${id}")} title="Remove">&times;</b></span>`; });
  exclusivePairs.forEach((pair,i)=>{
    const a = byId.get(pair[0]), b = byId.get(pair[1]);
    if (a && b) h += `<span class="chip chip-tier">never together: ${escHTML(a.trait)} / ${escHTML(b.trait)} <b ${actAttr('click', 'removeExclusivePair', i)} title="Remove">&times;</b></span>`;
  });
  /* Favourites are bookmarks, not rules — listed separately and labelled so the split
     introduced on the card (★ saves, 📌 requires) is legible here too, with a
     one-press promotion for a saved trait you have decided you always want. */
  if (typeof getFavouriteTraitIds === 'function'){
    getFavouriteTraitIds().forEach(id=>{
      const t = byId.get(id);
      if (!t) return;
      h += `<span class="chip chip-fav">saved: ${escHTML(t.trait)}`
         + ` <b ${actAttr('click', 'requireTrait', id)} title="Require this on every character">&#128204;</b>`
         + ` <b ${actAttr('click', 'favouriteTrait', id)} title="Remove from saved">&times;</b></span>`;
    });
  }
  box.innerHTML = h || '<span class="sub" style="margin:0;">No constraints active.</span>';
  renderRuleConflicts();
  refreshActiveRuleStrip();
}

/* Contradictions between hard constraints, said out loud BEFORE a generation rather
   than arbitrated silently during one — see detectConstraintConflicts. */
function renderRuleConflicts(){
  const box = document.getElementById('constraintConflicts');
  if (!box) return;
  let conflicts = [];
  try { conflicts = detectConstraintConflicts(); } catch(e){ return; }
  if (!conflicts.length){ box.style.display = 'none'; box.innerHTML = ''; return; }
  box.style.display = 'block';
  box.innerHTML = `<div class="ruleConflictTitle">These rules contradict each other</div>`
    + conflicts.map(c=>`<div class="ruleConflictItem">${escHTML(c.message)}</div>`).join('');
}

/* THE ACTIVE-RULES STRIP.
   Quick mode hides the Advanced panel, but not its effects: bans, requirements, an
   archetype, budgets, manual profile types and history-aware exploration all keep
   steering the build from behind a closed disclosure. A user in Quick mode could not
   see why their characters had stopped varying. One line, always visible, naming every
   rule currently in force. */
function activeRuleChips(){
  const out = [];
  const n = (k, v) => out.push({k, v});
  if (bannedSections.size) n('banned sections', bannedSections.size);
  if (bannedCategories.size) n('banned categories', bannedCategories.size);
  if (bannedTraitIds.size) n('banned traits', bannedTraitIds.size);
  if (requiredTraitIds.length) n('always include', requiredTraitIds.length);
  if (requiredCategories.length) n('at least one from', requiredCategories.length);
  if (exclusivePairs.length) n('never together', exclusivePairs.length);
  if (categoryTiers.size) n('weighted categories', categoryTiers.size);
  const arch = (document.getElementById('archetypeSelect')||{}).value;
  if (arch) n('archetype', arch);
  if (typeof budgetsActive === 'function' && budgetsActive()){
    const caps = RTIER_ORDER.filter(t=>rarityCaps[t] != null).length
               + BUDGET_GROUPS.filter(g=>intensityCaps[g.id] != null).length;
    n('budgets', caps + ' cap' + (caps===1?'':'s'));
  }
  const manual = (typeof PROFILE_SECTIONS !== 'undefined' ? PROFILE_SECTIONS : []).filter(ps=>{
    const sel = document.getElementById('type_'+ps.id);
    return sel && sel.value && !(typeof isAutoProfileType === 'function' && isAutoProfileType(ps.id));
  }).length;
  if (manual) n('fixed profile types', manual);
  const off = (typeof PROFILE_SECTIONS !== 'undefined' ? PROFILE_SECTIONS : []).filter(ps=>{
    return !profileSectionEnabled(ps);
  }).length;
  if (off) n('sections off', off);
  const seedEl = document.getElementById('seedInput');
  if (seedEl && seedEl.value.trim()) n('replaying seed', seedEl.value.trim());
  else if (divergenceLevel() > 0) n('history-aware exploration', 'on');
  if (typeof getSuppressedContextTags === 'function' && getSuppressedContextTags().length)
    n('context readings off', getSuppressedContextTags().length);
  return out;
}
function refreshActiveRuleStrip(){
  const el = document.getElementById('activeRules');
  if (!el) return;
  const chips = activeRuleChips();
  if (!chips.length){ el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'flex';
  el.innerHTML = `<span class="ruleStripLabel">In force:</span>`
    + chips.map(c=>`<span class="ruleChip">${escHTML(c.k)} <b>${escHTML(String(c.v))}</b></span>`).join('');
}
function addCategoryBan(){
  const sel = document.getElementById('banCategorySelect');
  if (sel && sel.value){ bannedCategories.add(sel.value); sel.value=""; refreshConstraintChips(); }
}
function addSectionBan(){
  const sel = document.getElementById('banSectionSelect');
  if (sel && sel.value){ bannedSections.add(sel.value); sel.value=""; refreshConstraintChips(); }
}
// "At least one from X" is the constraint the tool was missing most: bans and
// always-this-exact-trait are both absolutes, and there was nothing in between for
// "I don't care which cruelty they have, but they have one."
function addRequiredCategory(){
  const sel = document.getElementById('banCategorySelect');
  if (sel && sel.value && !requiredCategories.includes(sel.value)){
    requiredCategories.push(sel.value); sel.value=""; refreshConstraintChips();
  }
}
function removeRequiredCategory(cat){
  requiredCategories = requiredCategories.filter(c=>c!==cat); refreshConstraintChips();
}
// Resolve the trait a constraint field is pointing at. Exact name first, then a
// unique substring, then give up loudly rather than silently taking the first of
// forty partial matches.
function findTraitByName(val){
  const q = (val||"").trim().toLowerCase();
  if (!q) return null;
  const exact = TRAITS.find(x=> x.trait.toLowerCase() === q);
  if (exact) return exact;
  const partial = TRAITS.filter(x=> x.trait.toLowerCase().includes(q));
  // The comment above promised to "give up loudly rather than silently taking the first
  // of forty partial matches", and then took the first of forty. Typing "cold" banned
  // one arbitrary trait and reported success. Return the ambiguity so the caller can
  // say so.
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) return {ambiguous: partial};
  return null;
}
function addTraitConstraint(mode){
  const inp = document.getElementById('constraintTraitSearch');
  const t = findTraitByName(inp && inp.value);
  if (!t){ toast("No trait matches that name.", "warn"); return; }
  if (t.ambiguous){
    const names = t.ambiguous.slice(0, 3).map(x=>'"'+x.trait+'"').join(", ");
    toast(`${t.ambiguous.length} traits match that — ${names}${t.ambiguous.length>3?', …':''}. Type more of the name.`, "warn");
    return;
  }
  if (mode === 'ban'){ bannedTraitIds.add(t.id); }
  else { if (!requiredTraitIds.includes(t.id)) requiredTraitIds.push(t.id); }
  inp.value = ""; refreshConstraintChips();
  toast((mode === 'ban' ? 'Never: ' : 'Always: ') + t.trait);
}
// Mutually exclusive pairs: "they can be a liar or a zealot, not both."
function addExclusivePair(){
  const a = findTraitByName((document.getElementById('exclusiveA')||{}).value);
  const b = findTraitByName((document.getElementById('exclusiveB')||{}).value);
  if (!a || !b){ toast("Name two traits to keep apart.", "warn"); return; }
  const amb = a.ambiguous ? a : (b.ambiguous ? b : null);
  if (amb){ toast(`${amb.ambiguous.length} traits match one of those names. Type more of it.`, "warn"); return; }
  if (a.id === b.id){ toast("Those are the same trait.", "warn"); return; }
  if (!exclusivePairs.some(p=> (p[0]===a.id&&p[1]===b.id) || (p[0]===b.id&&p[1]===a.id))){
    exclusivePairs.push([a.id, b.id]);
  }
  setVal('exclusiveA', "");
  setVal('exclusiveB', "");
  refreshConstraintChips();
}
function removeExclusivePair(i){ exclusivePairs.splice(i,1); refreshConstraintChips(); }
function removeBan(kind, key){
  if (kind==='cat') bannedCategories.delete(key);
  else if (kind==='section') bannedSections.delete(key);
  else bannedTraitIds.delete(parseInt(key));
  refreshConstraintChips();
}
function removeReq(id){ requiredTraitIds = requiredTraitIds.filter(x=>x!==parseInt(id)); refreshConstraintChips(); }
function clearConstraints(){
  bannedCategories.clear(); bannedSections.clear(); bannedTraitIds.clear();
  requiredTraitIds = []; requiredCategories = []; exclusivePairs = [];
  categoryTiers.clear(); refreshConstraintChips();
}
/* The (N traits) cost badge only appeared AFTER you had banned something, so the one
   question you want answered while choosing — "how much am I about to remove?" — was
   the one you could not ask without committing. The size travels with the option, and
   the section headings carry their own totals, so the whole shape of the bank is
   legible from the picker. Counted against the UNFILTERED bank on purpose: this is the
   size of the thing you are about to ban, not what is left of it after other bans. */
function categorySizeOf(section, cat){
  return (TRAITS_BY_KEY.get(section + "||" + cat) || []).length;
}
function populateBanCategorySelect(){
  let h0 = '';
  CATS_BY_SECTION.forEach((cats, section)=>{
    const total = cats.reduce((n, c)=> n + categorySizeOf(section, c), 0);
    h0 += `<optgroup label="${escHTML(section)} — ${total} traits">` + cats.map(c=>{
      const n = categorySizeOf(section, c);
      return `<option value="${escHTML(c)}">${escHTML(c)} · ${n}</option>`;
    }).join("") + `</optgroup>`;
  });
  const ban = document.getElementById('banCategorySelect');
  if (ban) ban.innerHTML = '<option value="">— pick a category —</option>' + h0;
  const secSel = document.getElementById('banSectionSelect');
  if (secSel){
    let h1 = '';
    CATS_BY_SECTION.forEach((cats, section)=>{
      const total = cats.reduce((n, c)=> n + categorySizeOf(section, c), 0);
      h1 += `<option value="${escHTML(section)}">${escHTML(section)} · ${total} traits across ${cats.length} categories</option>`;
    });
    secSel.innerHTML = '<option value="">— pick a whole section to ban —</option>' + h1;
  }
  const tier = document.getElementById('tierCategorySelect');
  if (tier) tier.innerHTML = '<option value="">— pick a category to weight —</option>' + h0;
}
// After a build, force-insert every required trait as a locked slot. Required
// beats banned if the user sets both on the same trait — an explicit "always"
// is the stronger, more deliberate statement.
/* Contradictions between hard constraints, found BEFORE anything is seated. Two
   required traits declared mutually exclusive used to be resolved silently by
   applyExclusivePairs replacing one of them — the sheet then showed a slot still
   labelled "Required" whose trait was not the required one. An impossible pair of
   instructions is not the solver's to arbitrate; it is the user's to resolve, so it is
   reported instead. */
let lastConstraintConflicts = [];
function getConstraintConflicts(){ return lastConstraintConflicts; }
function detectConstraintConflicts(){
  const out = [];
  const req = new Set(requiredTraitIds);
  exclusivePairs.forEach(([a,b])=>{
    if (req.has(a) && req.has(b)){
      const ta = TRAITS_BY_ID.get(a), tb = TRAITS_BY_ID.get(b);
      out.push({kind:'required-vs-exclusive', ids:[a,b],
        message: `You require both "${ta?ta.trait:a}" and "${tb?tb.trait:b}", but marked them never together. Drop one of the two rules.`});
    }
  });
  requiredTraitIds.forEach(id=>{
    const t = TRAITS_BY_ID.get(id);
    if (!t) return;
    if (bannedCategories.has(t.category) || bannedSections.has(t.section)){
      out.push({kind:'required-vs-ban', ids:[id],
        message: `"${t.trait}" is required, but its ${bannedSections.has(t.section) ? 'section' : 'category'} is banned. Required wins, so the ban does nothing for this trait.`});
    }
  });
  requiredCategories.forEach(cat=>{
    const section = SECTION_OF_CATEGORY.get(cat);
    if (section && byFilter(section, cat).length === 0){
      out.push({kind:'required-category-empty', cats:[cat],
        message: `"At least one from ${cat}" cannot be met — nothing in that category is currently drawable.`});
    }
  });
  lastConstraintConflicts = out;
  return out;
}

function applyRequiredTraits(obj){
  // PERF: this rebuilt a 7,073-entry Map on every single generation, and TRAITS_BY_ID
  // has existed the whole time. Same for the linear TRAITS.find below.
  detectConstraintConflicts();
  /* A required trait the build ALREADY drew used to be appended a second time under a
     req_ slot, so the sheet carried it twice and every uniqueness check downstream was
     working against a sheet that had already broken the invariant. Mark the seat that
     exists instead; only genuinely missing requirements cost a new slot. */
  const seatedBy = new Map();
  Object.entries(obj).forEach(([k, sl])=>{ if (sl && sl.trait) seatedBy.set(sl.trait.id, k); });
  requiredTraitIds.forEach((id,i)=>{
    const t = TRAITS_BY_ID.get(id); if (!t) return;
    const already = seatedBy.get(id);
    if (already !== undefined && !already.startsWith('req_')){
      obj[already] = Object.assign({}, obj[already], {locked:true, required:true,
        requiredSatisfiedInPlace:true});
      return;
    }
    if (already !== undefined) return;          // already seated as a req_ slot
    obj['req_'+i] = {slotId:'req_'+i, locked:true, required:true, label:'Required — '+t.category, trait:t};
    seatedBy.set(id, 'req_'+i);
  });
  // "At least one from this category": satisfied silently when the build already
  // landed there, and topped up with a normally-weighted draw when it didn't — so
  // the constraint costs a slot only when it actually had to do something.
  const present = new Set();
  Object.values(obj).forEach(s2=>{ if (s2 && s2.trait) present.add(s2.trait.category); });
  requiredCategories.forEach((cat,i)=>{
    if (present.has(cat)) return;
    const section = SECTION_OF_CATEGORY.get(cat);
    if (!section) return;
    const pool = byFilter(section, cat);
    const pick = pool.length ? pickInRange(pool, 0, profileTarget(), 4) : null;
    if (pick) obj['reqcat_'+i] = {slotId:'reqcat_'+i, locked:true, required:true,
      label:'Required (at least one) — '+cat, trait:pick};
  });
  return obj;
}

/* ================= RARITY CAPS & INTENSITY BUDGETS =================
   Two related controls, and both are deliberately POST-DRAW budget enforcement rather
   than another set of weights. The weighting system is already the thing the "why?"
   panel explains; folding a cap into it would make every explanation conditional on a
   quantity the user cannot see. A budget instead lets the draw happen exactly as it
   would have, then constrains the RESULT — so the reasoning stays legible and the
   adjustment is a separate, nameable act.

   Rarity caps answer "at most this many cards of each kind on one sheet".
   Intensity budgets answer "this group of slots gets at most this much total loudness".

   The case neither the sliders nor the rarity dial could express, and the one most
   writers actually want: an ordinary person with ONE startling thing about them.
   That is signature-cap 1 plus a tight intensity budget everywhere else. */
const rarityCaps  = {common:null, uncommon:null, distinctive:null, signature:null};
const intensityCaps = {};      // budget group id -> max total intensity, or null
let budgetMode    = 'redraw';  // 'redraw' | 'drop' | 'warn'
let lastBudgetReport = null;

/* Which slots count against which budget. Mirrors the sheet's own grouping rather
   than the engine's internals, so the control means what the user can see. */
const BUDGET_GROUPS = [
  {id:'personality', label:'Personality',          match: id => id.startsWith('pers_')},
  {id:'motivation',  label:'Motivation & Wound',   match: id => id.startsWith('prof_motivation_')},
  {id:'profile',     label:'Deep profile',         match: id => id.startsWith('prof_') && !id.startsWith('prof_motivation_')},
  {id:'voice',       label:'Speech & Vocabulary',  match: id => ['verbosity','register','grammar'].includes(id) || id.startsWith('vocab')},
  {id:'manner',      label:'Mannerisms',           match: id => id.startsWith('manner')},
  {id:'appearance',  label:'Appearance',           match: id => id.startsWith('app_')},
  {id:'sheet',       label:'Whole sheet',          match: () => true},
];

/* Mutated in place rather than reassigned, so anything holding a reference to these
   objects — the tests, and any future module that captures them — keeps seeing the
   live values instead of a snapshot from load time. */
function clearBudgets(){
  RTIER_ORDER.forEach(t=>{ rarityCaps[t] = null; });
  Object.keys(intensityCaps).forEach(k=>{ delete intensityCaps[k]; });
  budgetMode = 'redraw';
  lastBudgetReport = null;
}
// Accessors for the two values that genuinely have to be reassigned (a primitive and
// a whole-object result), so callers outside this file never read a stale binding.
function getBudgetMode(){ return budgetMode; }
function setBudgetMode(m){ budgetMode = m; }
function getBudgetReport(){ return lastBudgetReport; }
// Needed by the speculative wrappers: a discarded batch must put back the report that
// describes the sheet the user is actually looking at.
function setBudgetReport(r){ lastBudgetReport = r; }
// Same reason: rollCharacterVariants and the import path both reassign charVariants.
function getCharVariants(){ return charVariants; }
function budgetsActive(){
  return RTIER_ORDER.some(t => rarityCaps[t] != null)
      || BUDGET_GROUPS.some(g => intensityCaps[g.id] != null);
}

/* Shared by every post-draw pass that replaces a trait. Each of them used to pick a
   replacement against one rule and no awareness of the rest of the sheet, which is how
   a fixed-seed budget probe could finish with the SAME trait in two slots. */
function seatedIdSet(obj, exceptId){
  const seen = new Set();
  Object.keys(obj).forEach(k=>{
    if (k === exceptId) return;
    if (obj[k] && obj[k].trait) seen.add(obj[k].trait.id);
  });
  return seen;
}
// Would seating `id` break an exclusive pair against what is already on the sheet?
function excludedByPairs(id, seated){
  return exclusivePairs.some(([a,b]) => (a === id && seated.has(b)) || (b === id && seated.has(a)));
}

/* Runs after applyPinnedTargets and BEFORE applyRequiredTraits, so an explicit
   "always include this trait" can never be evicted by a budget: a constraint the user
   stated by name outranks a quantity they stated in the abstract.

   REWRITTEN for the interaction bugs. The rarity and intensity passes used to run
   independently: a rarity redraw could return a tier a previous cap had already
   emptied, an intensity redraw ignored the rarity caps entirely, and neither pool
   excluded ids already seated elsewhere — so a sheet could come out of budgeting with
   a duplicate trait. Both passes now draw against ONE eligibility predicate covering
   every active hard constraint plus a live seated-id set, and the report is rebuilt
   from the finished sheet at the end rather than accumulated from intermediate counts,
   so an unmet cap is always the truth about what the user is looking at. */
function applyBudgets(obj, rarityPref){
  const report = {rarity:{}, intensity:{}, actions:[], active: budgetsActive()};
  lastBudgetReport = report;
  if (!report.active) return obj;

  /* Locked, required and pinned slots are user intent: never touched, but they DO
     count against the budget. If someone locks four intensity-5 traits and then sets a
     budget of 12, the budget is already spent and everything else goes quiet — which
     is exactly right, and the report says so rather than looking broken. */
  const mutable = id => obj[id] && obj[id].trait && !obj[id].locked
                     && !obj[id].required && pinnedTargets[id] === undefined;
  const withTrait = () => Object.keys(obj).filter(id => obj[id] && obj[id].trait);
  /* The one eligibility predicate. `extra` is the pass-specific requirement (leave the
     capped tier / be quieter than what is there now); everything else is the standing
     set of hard rules that any replacement anywhere has to satisfy. */
  const capOf = tier => rarityCaps[tier];
  const countTier = (tier, exceptId) => withTrait()
    .filter(id => id !== exceptId && rarityTier(obj[id].trait) === tier).length;
  const eligible = (slotId, extra) => {
    const seated = seatedIdSet(obj, slotId);
    const slot = obj[slotId];
    return t => {
      if (seated.has(t.id)) return false;                       // never seat a duplicate
      if (excludedByPairs(t.id, seated)) return false;          // never break an exclusive pair
      if (bannedTraitIds.has(t.id)) return false;
      const tier = rarityTier(t);
      const cap = capOf(tier);
      // Moving INTO a tier is only allowed if that tier has room once this slot leaves
      // whatever tier it is in now. This is the check whose absence let a later pass
      // undo an earlier one.
      if (cap != null && countTier(tier, slotId) >= cap) return false;
      return !extra || extra(t, slot);
    };
  };

  // ---- Rarity caps -------------------------------------------------------
  RTIER_ORDER.forEach(tier=>{
    const cap = rarityCaps[tier];
    if (cap == null) return;
    /* Loudest first. If a cap has to bite, spend what remains of it on the QUIETEST
       examples of that tier and demote the ones that were dominating the sheet — a
       quiet signature trait is the interesting kind, and the shouting one is what the
       cap was set to stop. */
    const held = withTrait()
      .filter(id => rarityTier(obj[id].trait) === tier)
      .sort((a,b)=> obj[b].trait.intensity - obj[a].trait.intensity);
    report.rarity[tier] = {count: held.length, cap};
    let over = held.length - cap;
    if (over <= 0) return;
    for (const id of held){
      if (over <= 0) break;
      if (!mutable(id)) continue;
      const slot = obj[id];
      if (budgetMode === 'warn') break;
      // Redraw within the same category at the same target, excluding the capped tier.
      const pool = byFilter(slot.trait.section, slot.trait.category)
        .filter(eligible(id, t => rarityTier(t) !== tier));
      const repl = pool.length ? pickInRange(pool, rarityPref, slot.target, 3) : null;
      if (repl){
        obj[id] = Object.assign({}, slot, {trait: repl, budgeted: 'rarity',
          budgetWhy: `redrawn out of the ${tier} tier — ${tier} capped at ${cap}`});
        report.actions.push({id, why:`${tier} cap`, from: slot.trait.trait, to: repl.trait});
        over--;
      } else if (budgetMode === 'drop'){
        report.actions.push({id, why:`${tier} cap`, from: slot.trait.trait, to: null});
        delete obj[id];
        over--;
      }
    }
    // Never silently unmet: a cap that could not be satisfied is reported as such.
    if (over > 0) report.rarity[tier].unmet = over;
  });

  // ---- Intensity budgets -------------------------------------------------
  BUDGET_GROUPS.forEach(g=>{
    const cap = intensityCaps[g.id];
    if (cap == null) return;
    const ids = () => withTrait().filter(g.match);
    const total = () => ids().reduce((sum,id)=> sum + (obj[id].trait.intensity || 0), 0);
    report.intensity[g.id] = {label: g.label, total: total(), cap};
    /* The guard counter is load-bearing, not defensive padding. A tight budget against
       a category with no quiet content cannot be satisfied at all, and saying so is the
       honest answer — it doubles as a data-gap finder, surfacing exactly the thin pools
       that have no low tail to redraw into. */
    let guard = 0;
    while (total() > cap && guard++ < 60){
      if (budgetMode === 'warn') break;
      // Always redraw the loudest mutable slot: the one spending the most budget.
      const id = ids().filter(mutable)
        .sort((a,b)=> obj[b].trait.intensity - obj[a].trait.intensity)[0];
      if (!id) break;                                   // everything left is user-locked
      const slot = obj[id];
      const want = Math.max(1, slot.trait.intensity - 1);
      const pool = byFilter(slot.trait.section, slot.trait.category)
        .filter(eligible(id, t => t.intensity < slot.trait.intensity));
      const repl = pool.length ? pickInRange(pool, rarityPref, want, 3) : null;
      if (!repl){
        if (budgetMode === 'drop'){
          report.actions.push({id, why:`${g.label} budget`, from: slot.trait.trait, to: null});
          delete obj[id];
          continue;
        }
        break;   // nothing quieter exists in this category — a real content gap
      }
      obj[id] = Object.assign({}, slot, {trait: repl, target: want, budgeted: 'intensity',
        budgetWhy: `redrawn quieter — ${g.label} intensity budget`});
      report.actions.push({id, why:`${g.label} budget`, from: slot.trait.trait, to: repl.trait});
    }
    report.intensity[g.id].total = total();
  });

  /* FINAL, INDEPENDENT PASS. Everything above is the solver; this is the auditor, and
     it does not trust a single number the solver produced. It reads the finished sheet
     — after every redraw, drop and locked-slot interaction — and rewrites the report
     from it. A cap that a locked or required trait keeps unmet is reported as unmet,
     which is exactly the case the old accumulate-as-you-go report got wrong. */
  auditBudgets(obj, report);
  return obj;
}

/* Reads a committed sheet and states what is actually true of it. Used by applyBudgets
   as its report, and by finalizeSheet as an assertion over every generation path. */
function auditBudgets(obj, report){
  const ids = Object.keys(obj).filter(id => obj[id] && obj[id].trait);
  RTIER_ORDER.forEach(tier=>{
    const cap = rarityCaps[tier];
    if (cap == null) return;
    const count = ids.filter(id => rarityTier(obj[id].trait) === tier).length;
    const row = report.rarity[tier] = report.rarity[tier] || {};
    row.count = count; row.cap = cap;
    if (count > cap) row.unmet = count - cap; else delete row.unmet;
  });
  BUDGET_GROUPS.forEach(g=>{
    const cap = intensityCaps[g.id];
    if (cap == null) return;
    const total = ids.filter(g.match).reduce((sum,id)=> sum + (obj[id].trait.intensity || 0), 0);
    const row = report.intensity[g.id] = report.intensity[g.id] || {label: g.label};
    row.total = total; row.cap = cap;
    if (total > cap) row.unmet = true; else delete row.unmet;
  });
  // Duplicates are never acceptable, budgets or not. Reported rather than thrown: the
  // sheet in front of the user is still usable, and a silent one was the actual bug.
  const seen = new Map(), dupes = [];
  ids.forEach(id=>{
    const tid = obj[id].trait.id;
    if (seen.has(tid)) dupes.push({id, other: seen.get(tid), trait: obj[id].trait.trait});
    else seen.set(tid, id);
  });
  report.duplicates = dupes;
  return report;
}

/* The "of N possible" figures beside each budget control, so a number the user types
   has a scale attached. Read off the CURRENT sheet's slot counts x 5. */
function budgetCapacity(obj){
  const out = {};
  const ids = Object.keys(obj || {}).filter(id => obj[id] && obj[id].trait);
  BUDGET_GROUPS.forEach(g=>{
    const n = ids.filter(g.match).length;
    out[g.id] = {slots: n, max: n * 5,
      typical: ids.filter(g.match).reduce((s,id)=> s + (obj[id].trait.intensity||0), 0)};
  });
  return out;
}

/* §9.6 — the four presets. "One loud thing" is the case the tool could not express at
   all before budgets existed, and it is the one most writers reach for. */
const BUDGET_PRESETS = {
  background: {label:"Background character",
    rarity:{signature:0, distinctive:2}, intensity:{sheet:45}},
  supporting: {label:"Supporting",
    rarity:{signature:1, distinctive:5}, intensity:{sheet:65}},
  protagonist:{label:"Protagonist",
    rarity:{signature:3}, intensity:{sheet:90}},
  oneLoud:    {label:"One loud thing",
    rarity:{signature:1}, intensity:{personality:18, manner:6, voice:8}},
};
function applyBudgetPreset(key){
  const p = BUDGET_PRESETS[key];
  if (!p) return false;
  clearBudgets();
  Object.entries(p.rarity || {}).forEach(([tier,v])=>{ rarityCaps[tier] = v; });
  Object.entries(p.intensity || {}).forEach(([g,v])=>{ intensityCaps[g] = v; });
  return true;
}

/* ================= THE ONE FINALIZER =================
   Single generation, batch candidates, the cast, the foil and the gap-filler all
   produced a raw buildCharacterState and then applied DIFFERENT subsets of the
   post-draw rules in different orders. A cast with a named required trait and every
   rarity cap at zero came out with neither honoured; a reroll or a pin nudge left a
   budget-compliant sheet without the meter noticing; and the single-character path
   merged locked slots back in only AFTER budgets, exclusivity and the whole pressure
   sheet had been derived from a sheet the user was never shown.

   Everything now goes through here, in one stated order:

     1. protected intent is seated first (locked slots carried from the outgoing sheet),
        so every later stage solves against what the user actually kept;
     2. pins redraw within their own category toward the pinned target;
     3. budgets constrain the mutable remainder, counting the protected slots;
     4. named requirements go in last among the seating passes, so a quantity can never
        evict a trait the user asked for by name;
     5. exclusivity resolves whatever the above put next to each other;
     6. an independent audit re-derives the report FROM THE COMMITTED SHEET.

   `opts.carryLocked` is the previous sheet whose locked slots survive this build.
   `opts.applyBudgets === false` opts a path out of budgets explicitly — the point is
   that opting out is now a stated decision rather than an omission. */
function finalizeSheet(obj, opts){
  opts = opts || {};
  const rarityPref = (opts.rarityPref === undefined) ? 0 : opts.rarityPref;
  if (opts.carryLocked){
    Object.keys(opts.carryLocked).forEach(id=>{
      const old = opts.carryLocked[id];
      if (old && old.locked && obj[id] !== undefined) obj[id] = old;
    });
  }
  if (opts.applyPins !== false && typeof applyPinnedTargets === 'function') applyPinnedTargets(obj, rarityPref);
  if (opts.applyBudgets !== false) applyBudgets(obj, rarityPref);
  applyRequiredTraits(obj);
  applyExclusivePairs(obj, rarityPref);
  const report = lastBudgetReport || {rarity:{}, intensity:{}, actions:[], active: budgetsActive()};
  auditBudgets(obj, report);
  lastBudgetReport = report;
  return obj;
}

// Mutually exclusive pairs, enforced after the build rather than inside byFilter: the
// conflict only exists once both are actually seated, and resolving it here means the
// loser's slot gets a genuine replacement draw from its own pool instead of the slot
// silently disappearing. A locked or explicitly required slot always wins the tie.
function applyExclusivePairs(obj, rarityPref){
  if (!exclusivePairs.length) return obj;
  exclusivePairs.forEach(([a, b])=>{
    const slots = Object.keys(obj).filter(k=>{
      const t = obj[k] && obj[k].trait;
      return t && (t.id === a || t.id === b);
    });
    if (slots.length < 2) return;
    const seatedA = slots.find(k=>obj[k].trait.id === a);
    const seatedB = slots.find(k=>obj[k].trait.id === b);
    if (!seatedA || !seatedB) return;
    /* Both sides required is a contradiction, not a tie to break. Replacing one of them
       left a slot still labelled "Required" holding a trait the user never asked for;
       detectConstraintConflicts has already recorded it, so leave the sheet alone and
       let the UI say what is wrong. */
    if (obj[seatedA].required && obj[seatedB].required) return;
    const priority = k => (obj[k].required ? 2 : obj[k].locked ? 1 : 0);
    const loser = priority(seatedA) >= priority(seatedB) ? seatedB : seatedA;
    const slot = obj[loser];
    // The replacement has to respect every other rule too: not the trait it is
    // replacing, not a trait already on the sheet, and not the other half of any
    // exclusive pair that is currently seated.
    const seated = seatedIdSet(obj, loser);
    const pool = byFilter(slot.trait.section, slot.trait.category)
      .filter(t=>t.id !== slot.trait.id && !seated.has(t.id) && !excludedByPairs(t.id, seated));
    const repl = pool.length ? pickInRange(pool, rarityPref, slot.target, 3) : null;
    if (repl) obj[loser] = Object.assign({}, slot, {trait: repl, exclusiveSwap: true});
    else delete obj[loser];
  });
  return obj;
}

