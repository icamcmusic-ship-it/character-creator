

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
(function indexTraits(){
  TRAITS.forEach(t=>{
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
    if (secondary.has(t.trait.toLowerCase())){ t.tier = "secondary"; matched++; }
    else t.tier = "core";
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

function rollCharacterVariants(){
  charVariants = {};
  Object.keys(PRESENTATION_VARIANTS).forEach(cat=>{
    const pA = VARIANT_ODDS[cat] === undefined ? 0.5 : VARIANT_ODDS[cat];
    charVariants[cat] = Math.random() < pA ? "a" : "b";
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
  });
  return problems;
}
if (typeof location !== 'undefined' && /[?&]dev=1\b/.test(location.search || '')){
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
};

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

// The slider span this trait can appear at, in raw magnitude terms.
function traitBand(t, half){
  const h = (half === undefined) ? bandHalf() : half;
  const c = magFromPos(traitPos(t));
  const w = h * 25; // 1 position unit == 25 slider points
  return [Math.max(0, Math.round(c - w)), Math.min(100, Math.round(c + w))];
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
  rememberSlotDraws(st);
}
function forgetRecentTraits(){ recentTraitIds = []; }
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
function recentPenalty(t){
  if (!_avoidRecentActive || !recentTraitIds.length) return 1;
  for (let i = recentTraitIds.length - 1; i >= 0; i--){
    if (recentTraitIds[i].has(t.id)) return RECENT_PENALTY;
  }
  return 1;
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
  _divergeThisDraw = div > 0 && Math.random() < div;
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
  let r = Math.random() * total;
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
    neg:{ grammar:{"Anchors & Fillers":TIER_STRONG}, stress:{"Flight":TIER_MODERATE,"Fawn":TIER_MODERATE} }
  },
  confidence: {
    pos:{ manner:{"Vocal Modulation Mannerisms":TIER_MODERATE}, attachment:{"Secure":TIER_STRONG} },
    neg:{ grammar:{"Anchors & Fillers":TIER_MODERATE}, humor:{"Self-Deprecating":TIER_STRONG}, stress:{"Freeze":TIER_MODERATE}, attachment:{"Anxious":TIER_STRONG} }
  },
  agreeableness: {
    pos:{ stress:{"Fawn":TIER_STRONG}, values:{"Loyalty-Bound":TIER_MODERATE} },
    neg:{ grammar:{"Turn-Taking Grammar":TIER_WEAK}, stress:{"Fight":TIER_WEAK}, role:{"Instigator":TIER_MODERATE}, humor:{"Cruel & Barbed":TIER_MODERATE} }
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
    pos:{ grammar:{"Structural Shifts":TIER_MODERATE}, vices:{"Restraint & Discipline":TIER_STRONG}, values:{"Rigid & Principled":TIER_WEAK} },
    // "Avoidance & Procrastination" was a cross-link source but the target of nothing,
    // so it could only ever arrive by an unguided roll. Low discipline is its most
    // obvious upstream cause.
    neg:{ vices:{"Compulsion & Ritual":TIER_MODERATE,"Risk & Escape":TIER_MODERATE,"Avoidance & Procrastination":TIER_MODERATE}, stress:{"Freeze":TIER_WEAK} }
  },
  rebelliousness: {
    pos:{ vocab:{"Register & Formality Spectrum":TIER_MODERATE}, role:{"Instigator":TIER_STRONG}, humor:{"Absurd & Chaotic":TIER_MODERATE} },
    neg:{ role:{"Caretaker":TIER_WEAK}, values:{"Loyalty-Bound":TIER_WEAK} }
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
    neg:{ vocab:{"Directness & Literalness":TIER_WEAK,"Semantic Density & Modifiers":TIER_WEAK} }
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
    neg:{ manner:{"Tactile & Prop Handling":TIER_WEAK} }
  },
  curiosity: {
    // "Listening & Attention" was a full 24-trait mannerism category that nothing in
    // the matrix ever pointed at — it could only arrive on an unguided draw. Curiosity
    // is its most obvious upstream cause: wanting to know is what listening looks like.
    pos:{ vocab:{"Abstractness & Sensory Modality":TIER_MODERATE,"Conceptual Framework & Loanwords":TIER_MODERATE}, grammar:{"Anchors & Fillers":TIER_WEAK}, manner:{"Environmental Interaction Mannerisms":TIER_WEAK,"Listening & Attention":TIER_MODERATE} },
    neg:{ vocab:{"Precision & Specificity Level":TIER_WEAK}, grammar:{"Structural Shifts":TIER_WEAK} }
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
  "role:Outsider": { vocab:{"Directness & Literalness":TIER_WEAK} },
  "role:Caretaker": { manner:{"Social & Boundary Mannerisms":TIER_MODERATE} },
  "role:Skeptic": { vocab:{"Precision & Specificity Level":TIER_MODERATE} },
  "role:Instigator": { humor:{"Absurd & Chaotic":TIER_WEAK} },
  "role:Peacemaker": { humor:{"Warm & Playful":TIER_WEAK} },

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
  "values:Idealistic & Visionary": { vocab:{"Directness & Literalness":TIER_WEAK}, grammar:{"Structural Shifts":TIER_WEAK} },
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
  "stress:Fight (attack the threat)": { vocab:{"Affective & Emotional Intensity":TIER_WEAK},
    role:{"Instigator":TIER_STRONG,"Leader":TIER_MODERATE}, values:{"Self-Interested":TIER_WEAK},
    attachment:{"Secure":TIER_WEAK} },
  "stress:Flight (remove yourself)": { grammar:{"Spoken Compression":TIER_WEAK},
    role:{"Outsider":TIER_STRONG}, values:{"Pragmatic & Flexible":TIER_WEAK},
    attachment:{"Avoidant":TIER_STRONG} },
  /* Same asymmetry as attachment above, in Social Role. Flight and Freeze BOTH fed
     Outsider while Skeptic and Connector were the target of no stress link at all, so at
     neutral sliders — where stress is the only signal actually firing — Outsider took
     24% of a seven-way split and those two sat near 9%. Freeze moved onto Skeptic (a
     freeze response is watching and doubting rather than acting, which is what the
     Skeptic role describes) and Fawn gained Connector, social glue being the same
     impulse as appeasement pointed outward. Every role now has some stress inbound. */
  "stress:Freeze (shut down)": { grammar:{"Disfluencies & Flow":TIER_MODERATE},
    role:{"Skeptic":TIER_MODERATE}, values:{"Pragmatic & Flexible":TIER_WEAK},
    attachment:{"Disorganized":TIER_MODERATE} },
  "stress:Fawn (appease the threat)": { vocab:{"Pragmatic Focus & Speech Functions":TIER_WEAK},
    role:{"Peacemaker":TIER_STRONG,"Caretaker":TIER_MODERATE,"Connector":TIER_WEAK}, values:{"Loyalty-Bound":TIER_MODERATE},
    attachment:{"Anxious":TIER_STRONG} },
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

function accumulateBoost(kind, profileCats, overrides){
  const m = new Map();
  const add = (frag, s) => { if(!frag || s<=0) return; m.set(frag, (m.get(frag)||0) + s); };
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
  let r = Math.random() * total;
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
function pickCategoryWeighted(cats, boostMap){
  // categoryTiers: user prefer/rarely multipliers fold in here — the single point
  // where category selection happens — see WEIGHTED CONSTRAINT TIER above.

  const boost = AFFINITY();
  // Baseline weight lowered from 1 to 0.4: when a slider actually points somewhere,
  // that category should clearly dominate rather than be one voice among many equals.
  // A fully neutral boostMap (all zeros) still yields uniform weights, so unboosted /
  // truly-random picks are unaffected — this only sharpens picks that already have signal.
  const BASELINE = 0.4;
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
  const roll = div > 0 && Math.random() < div;
  const invert = roll && hasSignal;
  const freshen = roll && !hasSignal;
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
  const weights = cats.map(c => weightOf(c) * tierMultiplier(c) * contextMultiplier(c));
  const total = weights.reduce((a,b)=>a+b,0);
  let r = Math.random() * total;
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
  {re:/\b(smuggler|thief|criminal|crook|con|fence|outlaw|bandit|pirate|gang)\b/i,
   up:["Honesty — Deceptive & Evasive","Self-Interested","Pragmatic Focus & Speech Functions","Risk & Escape","Outsider"],
   down:["Manners — Polished & Courteous"], label:"criminal"},
  {re:/\b(medieval|ancient|victorian|regency|feudal|peasant|knight|monk|antiquity|bronze age|iron age|pre-?industrial)\b/i,
   up:["Register & Formality Spectrum","Abstractness & Sensory Modality"],
   down:["Conceptual Framework & Loanwords","Morphological & Structural Lexicon"], label:"pre-modern setting"},
  {re:/\b(corporate|executive|manager|consultant|office|startup|bureaucrat|civil service|administrat)\w*\b/i,
   up:["Conceptual Framework & Loanwords","Register & Formality Spectrum","Pragmatic Focus & Speech Functions"],
   down:[], label:"institutional"},
  {re:/\b(doctor|nurse|medic|surgeon|therapist|carer|caregiver|teacher|social worker)\b/i,
   up:["Caretaker","Precision & Specificity Level","Fawn (appease the threat)"], down:[], label:"caring profession"},
  {re:/\b(scholar|academic|scientist|researcher|professor|student|librarian|engineer)\b/i,
   up:["Intelligence — Sharp & Analytical","Skeptic","Precision & Specificity Level","Intellectual & Wordplay"],
   down:[], label:"analytical profession"},
  {re:/\b(priest|nun|cleric|preacher|monk|pastor|zealot|devout|cult)\w*\b/i,
   up:["Idealistic & Visionary","Register & Formality Spectrum","Loyalty-Bound"], down:[], label:"religious"},
  {re:/\b(farmer|labourer|laborer|dock|sailor|miner|builder|mechanic|driver|shop-?floor|trade)\w*\b/i,
   up:["Directness & Literalness","Manners — Crude & Ill-Mannered","Activeness — Energetic & Active"],
   down:["Stylized & Elaborate"], label:"manual trade"},
  {re:/\b(grief|grieving|bereaved|widow|mourning|loss)\w*\b/i,
   up:["Positivity — Pessimistic & Cynical","Temporal Orientation & Tense Usage","Avoidant"], down:[], label:"grief"},
  {re:/\b(noble|aristocrat|royal|court|heir|lord|lady|duke|baron)\w*\b/i,
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
function buildContextBias(contextText, ageText){
  CONTEXT_BIAS = new Map();
  CONTEXT_AXIS_NUDGE = {};
  CONTEXT_BIAS_NOTES = [];
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
  if (text.trim()) CONTEXT_RULES.forEach(r=>{ if (r.re.test(text)) apply(r); });
  const age = parseAgeHint(ageText);
  if (age !== null) AGE_RULES.forEach(r=>{
    if ((r.min === undefined || age >= r.min) && (r.max === undefined || age <= r.max)) apply(r);
  });
  return {bias: CONTEXT_BIAS, nudge: CONTEXT_AXIS_NUDGE, notes: CONTEXT_BIAS_NOTES, age};
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

  const useNeutral = neutralPool.length && Math.random() < pNeutral;
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
    const shuffle = arr => arr.map(a=>[Math.random(),a]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
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
];


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
  const chosen = {}, conf = {};
  PROFILE_SECTIONS.forEach(ps=>{
    if (ps.drawAll) return;
    const tog = document.getElementById('sec_'+ps.id);
    if (tog && !tog.checked) return;
    const sel = document.getElementById('type_'+ps.id);
    if (sel && sel.value){ chosen[ps.id] = sel.value; conf[ps.id] = 1; return; }
    const cats = catsOf(ps.section);
    if (!cats.length) return;
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(ps.id, chosen));
    const boost = AFFINITY(), BASELINE = 0.4;
    const scored = cats.map(c=>({c, w: BASELINE + boost * ((boostMap.get(c))||0)}))
                       .sort((a,b)=>b.w-a.w);
    const total = scored.reduce((s,x)=>s+x.w, 0) || 1;
    chosen[ps.id] = scored[0].c;
    conf[ps.id] = scored[0].w / total;
  });
  return withConfidence ? {chosen, conf} : chosen;
}

function resolveProfileCategories(rarityPref, overrides, forcedCats){
  const chosen = {};
  PROFILE_SECTIONS.forEach(ps=>{
    if (ps.drawAll) return; // Motivation & Wound always draws every category; nothing to "resolve"
    const tog = document.getElementById('sec_'+ps.id);
    if (tog && !tog.checked) return;
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
    const tog = document.getElementById('sec_'+ps.id);
    if (tog && !tog.checked) return;
    const target = profileTarget(ps.id);

    if (ps.drawAll){
      // Motivation & Wound: one trait from EVERY category (Want + Fear + Wound + Lie).
      // At depth 2+ each category also gets a SECOND, quieter trait — a competing
      // want, a background fear, a smaller old hurt — at an offset intensity.
      catsOf(ps.section).forEach((cat,i)=>{
        const pool = byFilter(ps.section, cat);
        const first = _drawUnique(()=>pickInRange(pool, rarityPref, target));
        seat(`prof_${ps.id}_${i}`, cat, ps.id, target, first);
        if (want > 1 && pool.length > 1){
          const t2 = staggered(target, 1);
          const second = _drawUnique(()=>pickInRange(pool, rarityPref, t2));
          if (second && (!first || second.id !== first.id)){
            seat(`prof_${ps.id}_${i}b`, cat + " — secondary", ps.id, t2, second);
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
          const altPool = byFilter(ps.section, altCat);
          const altTgt = clamp(target - 1.2, 1, 5);
          const alt = _drawUnique(()=>pickInRange(altPool, rarityPref, altTgt));
          if (alt) seat(`prof_${ps.id}_alt`, "Counterpoint — " + altCat, ps.id, altTgt, alt, {counterpoint:true});

          // Depth 4 (exhaustive): a second, different counterpoint category, even lighter touch.
          if (want >= 4){
            const otherCats2 = otherCats.filter(c => c !== altCat);
            if (otherCats2.length){
              const altCat2 = pickCategoryWeighted(otherCats2, null);
              const altPool2 = byFilter(ps.section, altCat2);
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
// falls back to Math.random(). Lets any caller opt into repeatable output — e.g. the
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
  const rand = seed ? seededRandom(String(seed)) : Math.random;
  return arr[Math.floor(rand()*arr.length)];
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

function coherenceScore(st){
  const chosen = {};
  PROFILE_SECTIONS.forEach(ps=>{ const c = slotCat(st["prof_"+ps.id+"_0"]); if (c) chosen[ps.id] = c; });
  let reinforced = 0, total = 0;
  const kinds = {vocab:VOCAB_CATS, grammar:GRAMMAR_CATS, manner:MANNER_CATS};
  Object.entries(kinds).forEach(([kind, cats])=>{
    const fragMap = accumulateBoost(kind, chosen);
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
    const fragMap = accumulateBoost(ps.id, {});
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
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(kind, chosen));
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
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(ps.id, {}));
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
    const tog = document.getElementById('sec_'+ps.id);
    if (tog && !tog.checked) return;
    const sel = document.getElementById('type_'+ps.id);
    if (sel && sel.value) { chosen[ps.id] = sel.value; return; }
    const cats = catsOf(ps.section);
    // biased only by already-chosen deep facts, never by sliders
    const boostMap = resolveBoostMapForCats(cats, accumulateBoost(ps.id, chosen, ZERO_PERSONALITY()));
    chosen[ps.id] = pickCategoryWeighted(cats, boostMap);
  });
  return chosen;
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
      // map doesn't cover (Manners, Activeness, Curiosity). Preserve their value
      // instead — depth-first should derive what it can and leave the rest alone.
      const el = document.getElementById('pers_'+a.id);
      out[a.id] = intVal(el, 0);
      out['__untouched_'+a.id] = true;
    }
  });
  return out;
}
function applyDepthFirst(){
  const chosen = deriveDepthCategories();
  const derived = personalityFromDepth(chosen);
  lastDepthUntouched = PERSONALITY_AXES.filter(a=>derived['__untouched_'+a.id]).map(a=>a.label);
  PERSONALITY_AXES.forEach(a=>{
    const el = document.getElementById('pers_'+a.id);
    if (el) el.value = derived[a.id];
  });
  // lock the resolved types into the dropdowns so the main build honours them
  Object.entries(chosen).forEach(([id,cat])=>{
    const sel = document.getElementById('type_'+id);
    if (sel && [...sel.options].some(o=>o.value===cat)) sel.value = cat;
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

  // 4. Force the exact seed trait into its slot and lock it.
  if (ps){
    const slotId = "prof_"+ps.id+"_0";
    if (state[slotId]){ state[slotId].trait = seed; state[slotId].locked = true; }
  } else if (seed.section === "Personality Traits"){
    const axis = PERSONALITY_AXES.find(a=>a.pos===seed.category || a.neg===seed.category);
    if (axis && state["pers_"+axis.id]){ state["pers_"+axis.id].trait = seed; state["pers_"+axis.id].locked = true; }
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
const SAVE_FORMAT = 2;
function compressSlots(st){
  if (!st) return st;
  const out = {};
  Object.entries(st).forEach(([k, slot])=>{
    if (!slot){ out[k] = slot; return; }
    const copy = {...slot};
    if (copy.trait && TRAITS_BY_ID.has(copy.trait.id)) copy.trait = {__id: copy.trait.id};
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
    if (copy.trait && copy.trait.__id !== undefined) copy.trait = TRAITS_BY_ID.get(copy.trait.__id) || null;
    out[k] = copy;
  });
  return out;
}

/* Redo. The snapshot mechanism already stores everything needed to move in either
   direction; all that was missing was a second stack and the discipline of clearing it
   when a NEW action forks the timeline. Undo depth is 15, so redo matches it. */
let redoStack = [];
function _snapshotNow(){
  return {
    state: compressSlots(state),
    charMeta: {...charMeta},
    pressureState: compressSlots(pressureState),
    sliders: lastGeneratedSliders || captureSliders()
  };
}
function updateUndoButtons(){
  const u = document.getElementById('undoBtn'); if (u) u.disabled = history.length === 0;
  const r = document.getElementById('redoBtn'); if (r) r.disabled = redoStack.length === 0;
}
function snapshotHistory(){
  // A fresh action invalidates anything that was ahead of us on the timeline.
  redoStack = [];
  history.push({
    state: compressSlots(state),
    charMeta: {...charMeta},
    pressureState: compressSlots(pressureState),
    // Fall back to live DOM only for the very first snapshot ever taken, when there's
    // no prior generation to have recorded sliders for.
    sliders: lastGeneratedSliders || captureSliders()
  });
  if (history.length > 15) history.shift();
  updateUndoButtons();
}
// Shared by undo and redo: the restore half is identical, only which stack the current
// position is pushed onto differs.
function _restoreSnapshot(prev){
  state = expandSlots(prev.state); charMeta = prev.charMeta;
  pressureState = expandSlots(prev.pressureState) || null;
  restoreSliders(prev.sliders);
  lastGeneratedSliders = prev.sliders; // the restored state now corresponds to these again
  setVal('charName', charMeta.name || "");
  setVal('charAge', charMeta.age || "");
  setVal('charContext', charMeta.context || "");
  setText('archetypeTag', charMeta.archetypeLabel || "");
  document.getElementById('pressureSheet').style.display = pressureState ? "block" : "none";
  diffLog = {}; rerollExclusions = {}; rerollHistory = {}; whyOpen = {};
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
    const useCircular = circularOdds > 0 && Math.random() < circularOdds;
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
    if (trait) out['app_'+i] = {slotId:'app_'+i, locked:false, derived,
      label:"Appearance \u2014 "+axis.label + (derived ? " (from their habits)" : ""), target, trait};
  });
  const actLevel = axisLevel('activeness', overrides);
  // Floor raised from 25 to 40. Movement & Bearing has no material down at the
  // intensity a magnitude of 25 asks for (target 1.35), so a neutral Activeness
  // slider aimed the picker below the pool entirely — 7 distinct traits in 400
  // characters. 40 lands inside the pool's real content.
  const mvPool = byFilter("Appearance","Movement & Bearing");
  const mvTarget = poolFloorTarget(mvPool, targetFromMag(Math.max(40, Math.abs(actLevel)*50)));
  const mv = withSlotMemory("app_move", ()=>pickInRange(mvPool, rarityPref, mvTarget, 8, true));
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
  const mkTarget = poolFloorTarget(mkPool, targetFromMag(Math.max(15, pMag, woundMag)));
  const mk = withSlotMemory("app_mark", ()=>pickInRange(mkPool, rarityPref, mkTarget, 8, true));
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
function pickWildcardSlot(rarityPref, index){
  /* Picking a uniform SECTION and then a uniform CATEGORY within it weighted the draw
     by how finely a section happens to be subdivided, not by how much content it holds:
     a Mannerism category came up at 1/84 while a Verbosity one came up at 1/35, for no
     reason anyone chose. Flatten to a single uniform draw over all eligible categories. */
  const pairs = [];
  WILDCARD_SECTIONS.forEach(s=> catsOf(s).forEach(c=>{ if (byFilter(s, c).length) pairs.push([s, c]); }));
  if (!pairs.length) return null;
  const [section, cat] = pairs[Math.floor(Math.random()*pairs.length)];
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
  const target = Math.random() < 0.55 ? quantile(positions, 0.9) : quantile(positions, 0.1);
  const prior = CURRENT_AFFINITY_VEC;
  CURRENT_AFFINITY_VEC = null;
  let trait;
  try { trait = _drawUnique(()=>pickInRange(pool, rarityPref, target, 3)); }
  finally { CURRENT_AFFINITY_VEC = prior; }
  if (!trait) return null;
  _markUsed(trait);
  const slotId = "wild_" + (index || 0);
  return {slotId, locked:false, wildcard:true, target,
          label:"Doesn't fit the rest — " + cat, trait};
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
    const wild = pickWildcardSlot(rarityPref, w);
    if (wild) obj[wild.slotId] = wild;
  }
  return obj;
}

// Sections whose resolved type can legitimately CHANGE under pressure. Motivation &
// Wound is excluded on purpose: a want or a wound doesn't swap out because the day
// went badly — it's the fixed thing the rest is reacting to. Humor and Vices are
// excluded because their pressure behaviour is already covered by the mannerism and
// grammar shifts (a vice under stress is a scene, not a different vice).
/* Motivation & Wound was excluded from the pressure pass, which is odd on its face:
   it supplies the pressure trigger. Under load a wound does not change, but which of
   its facets is in the foreground very much does. */
const PRESSURE_SHIFT_SECTIONS = ["role", "values", "attachment", "motivation"];

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
  bannedSections.forEach(sec=> h += `<span class="chip chip-ban">never (section): ${escHTML(sec)}${cost(secSize(sec))} <b onclick="removeBan('section','${escAttr(sec)}')" title="Remove">&times;</b></span>`);
  bannedCategories.forEach(c=> h += `<span class="chip chip-ban">never: ${escHTML(c)}${cost(catSize(c))} <b onclick="removeBan('cat','${escAttr(c)}')" title="Remove">&times;</b></span>`);
  categoryTiers.forEach((tier,c)=> h += `<span class="chip ${tierMultiplier(c)>1?'chip-req':'chip-tier'}">${escHTML(tierLabel(tier))}: ${escHTML(c)} <b onclick="removeTier('${escAttr(c)}')" title="Remove">&times;</b></span>`);
  requiredCategories.forEach(c=> h += `<span class="chip chip-req">at least one: ${escHTML(c)} <b onclick="removeRequiredCategory('${escAttr(c)}')" title="Remove">&times;</b></span>`);
  bannedTraitIds.forEach(id=>{ const t=byId.get(id); if(t) h += `<span class="chip chip-ban">never: ${escHTML(t.trait)} <b onclick="removeBan('trait','${id}')" title="Remove">&times;</b></span>`; });
  requiredTraitIds.forEach(id=>{ const t=byId.get(id); if(t) h += `<span class="chip chip-req">always: ${escHTML(t.trait)} <b onclick="removeReq('${id}')" title="Remove">&times;</b></span>`; });
  exclusivePairs.forEach((pair,i)=>{
    const a = byId.get(pair[0]), b = byId.get(pair[1]);
    if (a && b) h += `<span class="chip chip-tier">never together: ${escHTML(a.trait)} / ${escHTML(b.trait)} <b onclick="removeExclusivePair(${i})" title="Remove">&times;</b></span>`;
  });
  box.innerHTML = h || '<span class="sub" style="margin:0;">No constraints active.</span>';
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
function applyRequiredTraits(obj){
  // PERF: this rebuilt a 7,073-entry Map on every single generation, and TRAITS_BY_ID
  // has existed the whole time. Same for the linear TRAITS.find below.
  requiredTraitIds.forEach((id,i)=>{
    const t = TRAITS_BY_ID.get(id); if (!t) return;
    obj['req_'+i] = {slotId:'req_'+i, locked:true, required:true, label:'Required — '+t.category, trait:t};
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
// Same reason: rollCharacterVariants and the import path both reassign charVariants.
function getCharVariants(){ return charVariants; }
function budgetsActive(){
  return RTIER_ORDER.some(t => rarityCaps[t] != null)
      || BUDGET_GROUPS.some(g => intensityCaps[g.id] != null);
}

/* Runs after applyPinnedTargets and BEFORE applyRequiredTraits, so an explicit
   "always include this trait" can never be evicted by a budget: a constraint the user
   stated by name outranks a quantity they stated in the abstract. */
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
      const pool = byFilter(slot.trait.section, slot.trait.category).filter(t => rarityTier(t) !== tier);
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
        .filter(t => t.intensity < slot.trait.intensity);
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
    if (report.intensity[g.id].total > cap) report.intensity[g.id].unmet = true;
  });

  return obj;
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
    const priority = k => (obj[k].required ? 2 : obj[k].locked ? 1 : 0);
    const loser = priority(seatedA) >= priority(seatedB) ? seatedB : seatedA;
    const slot = obj[loser];
    const pool = byFilter(slot.trait.section, slot.trait.category).filter(t=>t.id !== slot.trait.id);
    const repl = pool.length ? pickInRange(pool, rarityPref, slot.target, 3) : null;
    if (repl) obj[loser] = Object.assign({}, slot, {trait: repl, exclusiveSwap: true});
    else delete obj[loser];
  });
  return obj;
}

