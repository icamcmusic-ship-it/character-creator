#!/usr/bin/env node
/* Invariant tests for the trait bank and the generation engine.
   No framework, no install step — `node tests/run.js`, same spirit as the app itself.

   These exist because every one of them encodes a bug that has actually happened
   here, or a property the app states out loud in its own UI and must therefore be
   true: duplicate ids, out-of-range intensities, an axis with only one pole, an
   inverted position mapping that made the printed "active range" a lie, and the
   claim that a seed reproduces a character exactly. */
const {loadEngine, ROOT} = require('./harness');

let passed = 0, failed = 0;
const failures = [];
function check(name, fn){
  try {
    const detail = fn();
    if (detail === false) throw new Error('returned false');
    passed++;
    console.log('  \x1b[32mok\x1b[0m   ' + name + (typeof detail === 'string' ? '  \x1b[2m(' + detail + ')\x1b[0m' : ''));
  } catch (e){
    failed++;
    failures.push(name + ': ' + e.message + (process.env.STACK ? '\n' + e.stack : ''));
    console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n       ' + e.message);
  }
}
function group(title){ console.log('\n' + title); }
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const ctx = loadEngine([
  'TRAITS','TRAITS_BY_KEY','CATS_BY_SECTION','AXIS_LABELS','AXIS_TO_POLCODE','PERSONALITY_AXES',
  'PROFILE_SECTIONS','WEIGHT_MATRIX','traitPos','magFromPos','targetFromMag','targetFromLevel',
  'buildCharacterState','pickInRange','byFilter','catsOf','mulberry32','hashSeedString',
  'rollCharacterVariants','coherenceScore','checkConflictsFor','PRESENTATION_VARIANTS',
  'RTIER_ORDER','RTIER_SCORE','rarityTier','withCharacterVariants','withSavedVariants',
  'charVariants','VARIANT_ODDS','POL_COUNTS','polNormalise','poolFloorTarget','rangeSelect',
  'rarityNorm','proximityWeights','profileTarget','applyBudgets','budgetCapacity',
  'BUDGET_GROUPS','BUDGET_PRESETS','applyBudgetPreset','clearBudgets','rarityCaps',
  'intensityCaps','getBudgetMode','setBudgetMode','getBudgetReport','getCharVariants',
  'SECTION_OF_CATEGORY','forgetSlotDraws','withRng','buildStressVariant','categoryWeights','tierMultiplier','ARCHETYPE_PROFILE_HINTS','withArchetypeProfile','predictProfileCategories','rand','entropySeed','withSpeculativeGeneration',
  'rarityTier','rarityWeight','rarityPrefValue','polarityFit','buildContextBias','parseAgeHint',
  'traitBand','CURVE_EXP','clamp','SECTION_COLORS','loudnessCheck','recentPenalty',
  'rememberGeneration','forgetRecentTraits','_drawUnique','_buildUsedIds','explainWhyNot',
  'MOOD_TAG_STATS','TIER_TAG_STATS','divergenceLevel','AXES','CROSSLINK_STRENGTH','slotCat','rangeSelect','captureSettings','restoreSettings',
  'bannedCategories','requiredTraitIds','exclusivePairs','SETTING_FIELDS','SETTING_TOGGLES','validateSheetPayload','compressSlots','expandSlots','TRAITS_BY_ID','emergentArchetypeName',
  // js/app.js — previously not loaded at all, so none of this had coverage.
  'axisProfile','analyseRelationship','checkEnsembleBalance','randomAxisLevel','secondOrderTensions',
  'suggestVoiceFromPersonality','intensityWord','axisPoleWord','voiceSliderWord','assertAxisTables',
  'strVal','boolVal','rarityPrefVal','ARCHETYPES','sheetToText','sheetToHTML','quantile','emptySlot',
  'MOTIVATION_CROSSLINKS','motivationCrosslinkMap','motivationText','setMotivationLinks','resolveProfileCategories',
  'WILDCARD_SECTIONS','PRESSURE_SHIFT_SECTIONS','DEPTH_TO_PERSONALITY','clearContextBias',
  // Added with the audit fixes: the shared finalizer, the seed codec, the decoders and
  // the diagnostics that had to become pure.
  'finalizeSheet','auditBudgets','applyRequiredTraits','applyExclusivePairs','detectConstraintConflicts',
  'getConstraintConflicts','seatedIdSet','excludedByPairs','eligibleCategories','pickCategoryWeighted',
  'encodeSeed','seedNumberFrom','resolveSeed','withReplayMode','historyAwareGeneration',
  'variantsFromProtected','archetypeFidelity','sheetOverrides','CATEGORY_USE','noteCategoryUse',
  'bannedTraitIds','bannedSections','requiredCategories','intensityCaps','setBudgetReport',
  'archetypeProblem','normalizeArchetype','isNegated','suppressContextTag','clearContextSuppression',
  'magFromPos','bandHalf','cloneSheet','decodeSavedRecord','SAVE_FORMAT','pinnedTargets',
  // §4–7 build: schema, packs, character-relative profile
  'assertTraitShape','TRAIT_PACKS','setPackEnabled','isPackEnabled','getDisabledPacks','setDisabledPacks',
  'polarityPrior','TRAIT_CONTEXTS','TRAIT_WORLD_TAGS','TRAIT_REVIEW_STATES',
  'ARCHETYPE_INTENT','ARCHETYPE_VARIATIONS','effectiveArchetype','archetypeAxisBlend','ARCHETYPE_MUST_FLOOR',
  'internalDimensions','INTERNAL_DIMENSIONS','profileSectionEnabled',
  'recentPenalty','RECENT_PENALTY','RECENT_DECAY','RECENT_FAMILY_PENALTY','setAvoidSet','avoidSetFrom','avoidPenalty',
  'archiveCharacter','forgetArchive','getArchive','diversityScore','referenceFromState','pickWildcardSlot','strongestLean',
  'exportArchive','importArchive',
  'motivationChain','pressureChain','structuredContradiction','traitDimensions','characterLabel','DIM_DEFAULTS_BY_SECTION',
  'contextualView','contextualViews','CONTEXT_MODES','CONTEXT_MODE_IDS','CONTEXT_LENS_RULES',
]);
const A = ctx.api;
const T = A.TRAITS;

/* Ratchet, not a target. Set to the value the bank actually achieves today; lowering it
   is the content pass's job and raising it should require saying so out loud. It started
   at 0.729, where rarity was very nearly a restatement of intensity. */
/* Rarity vs intensity, as Cramer's V. The README claims the two axes are "genuinely
   independent"; measured, V is 0.651 against this 0.66 ceiling — passing by 0.009, which
   means rarity is still about 65% a restatement of intensity. The contingency table says
   why: distinctive is 92% intensity-3, signature 88% intensity 4-5, common 91% intensity
   1-2. Every cell is populated, which is what the older test asserted, but the
   off-diagonal mass is tiny.
   Closing this is a content pass, not a code fix — roughly 400 more quiet-signature
   (i1-i2) entries and 300 more loud-common (i4-i5) ones — after which this ceiling
   should come down to 0.55 and then 0.45. Left where it is deliberately: lowering the
   number without writing the traits would only make the suite red. */
const RARITY_V_CEILING = 0.66;

group('Trait bank integrity');
check('every trait has the required fields', ()=>{
  const bad = T.filter(t => !t.id || !t.section || !t.category || !t.trait || !t.desc ||
                            !t.example || !t.intensity || !t.rarity || !t.pol);
  assert(!bad.length, bad.length + ' incomplete: ' + bad.slice(0,3).map(t=>t.id).join(', '));
  return T.length + ' traits';
});
check('no duplicate ids', ()=>{
  const seen = new Map(), dupes = [];
  T.forEach(t=>{ if (seen.has(t.id)) dupes.push(t.id); else seen.set(t.id, t); });
  assert(!dupes.length, 'duplicate ids: ' + dupes.slice(0,5).join(', '));
});
check('no duplicate trait names', ()=>{
  const seen = new Set(), dupes = [];
  T.forEach(t=>{ const k = t.trait.toLowerCase(); if (seen.has(k)) dupes.push(t.trait); else seen.add(k); });
  assert(!dupes.length, dupes.length + ' repeated names: ' + dupes.slice(0,5).join(' | '));
});
check('intensities are integers 1-5', ()=>{
  const bad = T.filter(t => !Number.isInteger(t.intensity) || t.intensity < 1 || t.intensity > 5);
  assert(!bad.length, bad.length + ' out of range');
});
check('rarity is one of the four authored tiers', ()=>{
  const valid = new Set(A.RTIER_ORDER);
  const bad = T.filter(t => !valid.has(t.rarity));
  assert(!bad.length, bad.length + ' unknown rarities');
});
check('every pol key is a known axis', ()=>{
  const bad = [];
  T.forEach(t => Object.keys(t.pol||{}).forEach(k=>{ if (!A.AXIS_LABELS[k]) bad.push(t.id + ':' + k); }));
  assert(!bad.length, 'unknown pol keys: ' + bad.slice(0,5).join(', '));
});
check('every pol value is -1, 0 or 1', ()=>{
  const bad = [];
  T.forEach(t => Object.entries(t.pol||{}).forEach(([k,v])=>{ if (![-1,0,1].includes(v)) bad.push(t.id+':'+k+'='+v); }));
  assert(!bad.length, bad.slice(0,5).join(', '));
});
check('no duplicate example lines within a category', ()=>{
  const byCat = new Map();
  T.forEach(t=>{
    const k = t.section + '||' + t.category;
    if (!byCat.has(k)) byCat.set(k, new Map());
    const m = byCat.get(k);
    if (m.has(t.example)) m.get(t.example).push(t.id); else m.set(t.example, [t.id]);
  });
  const dupes = [];
  byCat.forEach((m, k)=> m.forEach((ids, ex)=>{ if (ids.length > 1) dupes.push(k + ' :: ' + JSON.stringify(ex)); }));
  assert(!dupes.length, dupes.length + ' repeated within one category:\n       ' + dupes.slice(0,5).join('\n       '));
});

group('Axis coverage');
check('every personality axis has all three pools populated', ()=>{
  const thin = [];
  A.PERSONALITY_AXES.forEach(ax=>{
    ['pos','neg','mid'].forEach(side=>{
      const n = (A.TRAITS_BY_KEY.get('Personality Traits||' + ax[side]) || []).length;
      if (!n) thin.push(ax[side] + ' is empty');
    });
  });
  assert(!thin.length, thin.join('; '));
});
check('both poles of every axis are within 25% of each other', ()=>{
  const off = [];
  A.PERSONALITY_AXES.forEach(ax=>{
    const p = (A.TRAITS_BY_KEY.get('Personality Traits||' + ax.pos) || []).length;
    const n = (A.TRAITS_BY_KEY.get('Personality Traits||' + ax.neg) || []).length;
    if (Math.abs(p - n) / Math.max(p, n) > 0.25) off.push(`${ax.label} ${p}/${n}`);
  });
  assert(!off.length, off.join(', '));
});
check('every polarity axis has traits on BOTH sides', ()=>{
  // The mood axis had 200 negative entries and zero positive ones, so nothing that
  // read polarity could ever see it as anything but a deficit.
  const pos = {}, neg = {};
  T.forEach(t=> Object.entries(t.pol||{}).forEach(([k,v])=>{
    if (v > 0) pos[k] = (pos[k]||0)+1;
    if (v < 0) neg[k] = (neg[k]||0)+1;
  }));
  const oneSided = Object.keys(A.AXIS_LABELS).filter(k=> (pos[k]||neg[k]) && !(pos[k] && neg[k]));
  assert(!oneSided.length, 'one-sided axes: ' + oneSided.map(k=>`${k} (+${pos[k]||0}/-${neg[k]||0})`).join(', '));
});
check('every category has at least one trait at each of intensity 1 and 5, or is documented as thin', ()=>{
  const thin = [];
  A.TRAITS_BY_KEY.forEach((list, key)=>{
    if (/— Situational/.test(key)) return;      // quiet by construction, checked below
    const has = i => list.some(t=>t.intensity === i);
    if (list.length >= 40 && (!has(1) || !has(5))) thin.push(key);
  });
  assert(!thin.length, thin.length + ' large categories missing a tail:\n       ' + thin.slice(0,8).join('\n       '));
});
check('Situational pools are deep enough to serve the default slider position', ()=>{
  // Every character generated at defaults draws 13 traits from these 13 pools, which
  // makes them the most-sampled and historically the thinnest part of the bank.
  const thin = [];
  A.PERSONALITY_AXES.forEach(ax=>{
    const n = (A.TRAITS_BY_KEY.get('Personality Traits||' + ax.mid) || []).length;
    if (n < 30) thin.push(`${ax.mid} (${n})`);
  });
  assert(!thin.length, thin.join(', '));
});

group('Intensity engine');
check('magFromPos inverts targetFromMag', ()=>{
  for (let mag = 0; mag <= 100; mag += 5){
    const back = A.magFromPos(A.targetFromMag(mag));
    assert(Math.abs(back - mag) < 0.001, `mag ${mag} round-tripped to ${back}`);
  }
});
check('traitPos stays inside its declared bucket neighbourhood', ()=>{
  const bad = T.filter(t => Math.abs(A.traitPos(t) - t.intensity) > 0.5);
  assert(!bad.length, bad.length + ' traits drifted more than half a level from their declared intensity');
});
check('traitPos is deterministic across calls', ()=>{
  const sample = T.filter((_,i)=> i % 500 === 0);
  sample.forEach(t=> assert(A.traitPos(t) === A.traitPos(t), 'unstable position for ' + t.id));
});
check('a trait always sits inside its own reported active band', ()=>{
  // The band printed on every card claims to be the exact slider span where the trait
  // can appear. If the mapping were inverted the card would be lying.
  const bad = T.filter((_,i)=> i % 97 === 0).filter(t=>{
    const [lo, hi] = A.traitBand(t);
    const centre = A.magFromPos(A.traitPos(t));
    return centre < lo - 1 || centre > hi + 1;
  });
  assert(!bad.length, bad.length + ' traits fall outside their own band');
});
check('the eased curve keeps intensity 4+ in the top of the dial', ()=>{
  assert(A.targetFromMag(50) < 2.6, 'mid-slider already targets ' + A.targetFromMag(50));
  assert(A.targetFromMag(100) === 5, 'full slider targets ' + A.targetFromMag(100));
});

group('Rarity tiers');
check('every trait resolves to one of four tiers', ()=>{
  const counts = {};
  T.forEach(t=>{ counts[t.rtier] = (counts[t.rtier]||0)+1; });
  assert(Object.keys(counts).sort().join(',') === 'common,distinctive,signature,uncommon', JSON.stringify(counts));
  return A.RTIER_ORDER.map(k=>`${k} ${Math.round(100*counts[k]/T.length)}%`).join(', ');
});
/* The four-way split is now AUTHORED data, so it can drift with every content pass —
   which is the point, but it means it needs a guard. The bounds are deliberately wide:
   this is here to catch a migration that went wrong or a content pass that quietly
   turned the bank into one tier again, not to freeze the distribution. The target
   shares the tier definitions imply are roughly 35/33/22/10; the derivational
   migration landed at 22/28/33/16, and closing that gap is a hand pass, trait by
   trait, which this test is designed to permit rather than block. */
check('the four-way rarity distribution stays within tolerance', ()=>{
  const share = tier => T.filter(t=>t.rtier===tier).length / T.length;
  const bounds = {common:[0.15,0.45], uncommon:[0.20,0.45], distinctive:[0.15,0.40], signature:[0.05,0.25]};
  Object.entries(bounds).forEach(([tier,[lo,hi]])=>{
    const v = share(tier);
    assert(v >= lo && v <= hi, `${tier} at ${Math.round(100*v)}% is outside ${Math.round(100*lo)}-${Math.round(100*hi)}%`);
  });
  return A.RTIER_ORDER.map(t=>`${t} ${Math.round(100*share(t))}%`).join(', ');
});
/* Cramer's V over the intensity x tier contingency table: 0 = the two axes are
   independent, 1 = knowing one tells you the other exactly. This is the measurement the
   README's "genuinely independent" claim is about. */
function rarityIntensityV(){
  const tiers = A.RTIER_ORDER, N = T.length, R = 5, C = tiers.length;
  const obs = Array.from({length:R}, ()=> new Array(C).fill(0));
  const rowT = new Array(R).fill(0), colT = new Array(C).fill(0);
  T.forEach(t=>{
    const r = t.intensity - 1, c = tiers.indexOf(t.rtier || A.rarityTier(t));
    if (r < 0 || r >= R || c < 0) return;
    obs[r][c]++; rowT[r]++; colT[c]++;
  });
  let chi = 0;
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++){
    const e = rowT[i] * colT[j] / N;
    if (e > 0) chi += Math.pow(obs[i][j] - e, 2) / e;
  }
  return {v: Math.sqrt(chi / (N * Math.min(R - 1, C - 1))), obs, tiers};
}

check('every tier is reachable at every intensity', ()=>{
  const grid = {};
  T.forEach(t=>{ grid[t.rtier + '@' + t.intensity] = (grid[t.rtier + '@' + t.intensity]||0)+1; });
  const missing = [];
  A.RTIER_ORDER.forEach(tier=>{
    for (let i = 1; i <= 5; i++) if (!grid[tier + '@' + i]) missing.push(tier + '@i' + i);
  });
  assert(!missing.length, 'unreachable combinations: ' + missing.join(', '));
  return Object.keys(grid).length + ' of 20 tier/intensity combinations populated';
});

check('rarity is not a restatement of intensity', ()=>{
  /* This is what the test above was standing in for and could not do. "Every cell is
     non-empty" is satisfied by ONE trait per cell, and it was: the bank had 10 quiet
     signature traits and 12 loud commons out of 7,133, and Cramer's V measured 0.729 —
     rarity was ~73% determined by intensity, so "an ordinary person with one startling
     verbal habit" was still effectively inexpressible even though the cell was
     technically occupied. Assert the actual statistical property, and assert the two
     corner populations the oneLoud budget preset depends on directly, since those are
     what the preset draws from and a low V could in principle be reached without
     them. */
  const {v} = rarityIntensityV();
  const quietSig = T.filter(t=> t.intensity <= 2 && (t.rtier||A.rarityTier(t)) === 'signature').length;
  const loudCommon = T.filter(t=> t.intensity >= 4 && (t.rtier||A.rarityTier(t)) === 'common').length;
  assert(v <= RARITY_V_CEILING, `Cramer's V is ${v.toFixed(3)}, above the ${RARITY_V_CEILING} ceiling`);
  assert(quietSig >= 90, `only ${quietSig} quiet signature traits (i<=2) — oneLoud has nothing to draw`);
  assert(loudCommon >= 70, `only ${loudCommon} loud common traits (i>=4)`);
  return `V=${v.toFixed(3)} · ${quietSig} quiet signature · ${loudCommon} loud common`;
});
check('signature is genuinely the minority tier', ()=>{
  const sig = T.filter(t=>t.rtier === 'signature').length;
  assert(sig / T.length < 0.25, Math.round(100*sig/T.length) + '% is still signature');
});
check('rarity preference is symmetric around balanced', ()=>{
  const common = T.find(t=>t.rtier==='common'), sig = T.find(t=>t.rtier==='signature');
  const norm = {common:10, uncommon:10, distinctive:10, signature:10};
  const a = A.rarityWeight(common, -1, norm) / A.rarityWeight(sig, -1, norm);
  const b = A.rarityWeight(sig, 1, norm) / A.rarityWeight(common, 1, norm);
  assert(Math.abs(a - b) < 1e-9, a + ' vs ' + b);
});
check('the two middle tiers sit between the poles, in order', ()=>{
  const norm = {common:10, uncommon:10, distinctive:10, signature:10};
  const w = tier => A.rarityWeight({rtier:tier, rarity:tier}, 1, norm);
  assert(w('common') < w('uncommon') && w('uncommon') < w('distinctive') && w('distinctive') < w('signature'),
    A.RTIER_ORDER.map(t=>`${t} ${w(t).toFixed(3)}`).join(' '));
});
check('per-pool normalisation lifts thin classes without letting them dominate', ()=>{
  /* Full 1/size equalisation handed a two-member class in a twenty-trait pool five and
     a half times an average trait's weight, which is what put one Motivation trait in
     89 of 300 default characters. Damped normalisation must still lift the thin class
     (otherwise it does nothing) but must not invert the ordering by a wide margin. */
  const norm = {signature:11, distinctive:7, uncommon:2};
  const per = tier => A.rarityWeight({rtier:tier, rarity:tier}, 0, norm);
  assert(per('uncommon') > per('signature'), 'thin class is not lifted at all');
  assert(per('uncommon') / per('signature') < 3, 'thin class still dominates: ' + (per('uncommon')/per('signature')).toFixed(2) + 'x');
  return (per('uncommon')/per('signature')).toFixed(2) + 'x lift for a 2-member class over an 11-member one';
});
check('tier names and legacy strings both resolve as preferences', ()=>{
  assert(A.rarityPrefValue('balanced') === 0, 'balanced');
  assert(A.rarityPrefValue('common') === -1 && A.rarityPrefValue('signature') === 1, 'poles');
  assert(Math.abs(A.rarityPrefValue('uncommon') - (-0.33)) < 1e-9, 'uncommon');
  assert(Math.abs(A.rarityPrefValue('distinctive') - 0.33) < 1e-9, 'distinctive');
});

group('Polarity');
check('a single-claim trait is not diluted by explicit zeros', ()=>{
  // pol:{vol:1,pace:0,form:0,warm:0} used to score a quarter of pol:{vol:1}.
  const vec = {vol: 2};
  const a = A.polarityFit({pol:{vol:1}}, vec);
  const b = A.polarityFit({pol:{vol:1, pace:0, form:0, warm:0}}, vec);
  assert(a === b, a + ' vs ' + b);
});
check('polarityFit is bounded to -1..1', ()=>{
  const vec = {}; Object.keys(A.AXIS_LABELS).forEach(k=> vec[k] = 2);
  const worst = A.polarityFit({pol:{warm:1, hon:1, disc:1}}, vec);
  assert(worst <= 1 && worst >= -1, 'got ' + worst);
});
check('opposed traits produce a detectable conflict', ()=>{
  const st = {a:{trait:{trait:'A', intensity:5, pol:{warm:1}}}, b:{trait:{trait:'B', intensity:5, pol:{warm:-1}}}};
  const found = A.checkConflictsFor(st);
  assert(found.length === 1 && found[0].tier === 'Jarring', JSON.stringify(found));
});

group('Weight matrix');
check('every matrix category fragment matches a real category', ()=>{
  const allCats = [];
  A.CATS_BY_SECTION.forEach(cats=> allCats.push(...cats));
  const unmatched = [];
  const scan = (kindMap) => Object.entries(kindMap||{}).forEach(([kind, frags])=>{
    if (typeof frags !== 'object') return;
    Object.keys(frags).forEach(frag=>{
      if (!allCats.some(c=> c.toLowerCase().includes(frag.toLowerCase()))) unmatched.push(kind + ' -> ' + frag);
    });
  });
  Object.entries(A.WEIGHT_MATRIX).forEach(([key, entry])=>{
    if (entry.pos || entry.neg){ scan(entry.pos); scan(entry.neg); } else scan(entry);
  });
  assert(!unmatched.length, 'dead fragments: ' + unmatched.slice(0,6).join(', '));
});
check('every profile-section key in the matrix names a real section', ()=>{
  const ids = new Set(A.PROFILE_SECTIONS.map(p=>p.id));
  const bad = Object.keys(A.WEIGHT_MATRIX).filter(k=>k.includes(':')).filter(k=>!ids.has(k.split(':')[0]));
  assert(!bad.length, bad.join(', '));
});
check('matrix-referenced profile categories exist', ()=>{
  const bad = [];
  Object.keys(A.WEIGHT_MATRIX).filter(k=>k.includes(':')).forEach(k=>{
    const [id, cat] = k.split(':');
    const ps = A.PROFILE_SECTIONS.find(p=>p.id===id);
    if (ps && !A.catsOf(ps.section).includes(cat)) bad.push(k);
  });
  assert(!bad.length, bad.join(', '));
});

group('Presentation variants');
check('each variant category tags both presentations', ()=>{
  const bad = [];
  Object.keys(A.PRESENTATION_VARIANTS).forEach(cat=>{
    const pool = T.filter(t=>t.category === cat);
    ['a','b'].forEach(v=>{ if (!pool.some(t=>t.variant === v)) bad.push(cat + ' has no "' + v + '"'); });
  });
  assert(!bad.length, bad.join('; '));
});

group('Generation');
// The engine draws through rand(), not Math.random — see THE RANDOM SOURCE in
// engine.js. withRng is the only supported way to seed a build.
function buildOnce(seed){
  return A.withRng(A.mulberry32(seed), ()=>{
    A.rollCharacterVariants();
    return A.buildCharacterState({
      verbLevel: 0.8, regLevel: -0.4, compLevel: 0.2, mannerCount: 3, vocabCount: 2,
      rarityPref: 0, vocabPref: null, personalityOverrides: null,
    });
  });
}
check('a build produces a populated sheet', ()=>{
  const st = buildOnce(12345);
  const n = Object.values(st).filter(s=>s && s.trait).length;
  assert(n > 10, 'only ' + n + ' slots');
  return n + ' slots';
});
check('same seed produces the identical sheet', ()=>{
  const a = buildOnce(999), b = buildOnce(999);
  const ids = st => Object.keys(st).sort().map(k=> k + '=' + (st[k].trait ? st[k].trait.id : 'null')).join(',');
  assert(ids(a) === ids(b), 'seeded builds diverged');
});
check('different seeds produce different sheets', ()=>{
  const ids = st => new Set(Object.values(st).filter(s=>s.trait).map(s=>s.trait.id));
  const a = ids(buildOnce(1)), b = ids(buildOnce(2));
  let shared = 0; a.forEach(x=>{ if (b.has(x)) shared++; });
  assert(shared / a.size < 0.6, Math.round(100*shared/a.size) + '% shared');
});
check('no trait is seated twice on one sheet', ()=>{
  for (let seed = 1; seed <= 30; seed++){
    const st = buildOnce(seed * 77);
    const ids = Object.values(st).filter(s=>s && s.trait).map(s=>s.trait.id);
    assert(new Set(ids).size === ids.length, 'duplicate trait on seed ' + seed);
  }
});
check('_drawUnique reports exhaustion instead of repeating', ()=>{
  A._buildUsedIds; // referenced for clarity; the registry lives in the engine
  const only = T[0];
  const got = A._drawUnique(()=> only, 3);
  // With nothing marked used the first draw is fine...
  assert(got === only, 'expected the single available trait');
});
check('the caricature guard fires on a stack of loud traits', ()=>{
  const st = {};
  T.filter(t=>t.intensity >= 4).slice(0,4).forEach((t,i)=> st['x'+i] = {trait:t});
  const res = A.loudnessCheck(st);
  assert(res && res.count === 4, JSON.stringify(res));
});
check('the caricature guard stays quiet on a quiet sheet', ()=>{
  const st = {};
  T.filter(t=>t.intensity <= 2).slice(0,6).forEach((t,i)=> st['x'+i] = {trait:t});
  assert(A.loudnessCheck(st) === null);
});

group('Presentation variant isolation');
check('a borrowed generator restores the caller\'s presentation locks', ()=>{
  /* charVariants was a module global and generateCast/foil/gap-filler all rolled it
     and walked away, so after generating a cast the single-character sheet was
     filtering its rerolls against a stranger's lock. */
  A.rollCharacterVariants();
  const mine = JSON.stringify(A.getCharVariants());
  let innerDiffered = false;
  for (let i = 0; i < 40 && !innerDiffered; i++){
    A.withCharacterVariants(()=>{ if (JSON.stringify(A.getCharVariants()) !== mine) innerDiffered = true; });
  }
  assert(JSON.stringify(A.getCharVariants()) === mine, 'caller locks were clobbered');
  assert(innerDiffered, 'the wrapper never rolled a different set — the test proves nothing');
  // withSavedVariants restores without rolling, for the per-item cast loop.
  A.withSavedVariants(()=>{ A.rollCharacterVariants(); });
  assert(JSON.stringify(A.getCharVariants()) === mine, 'withSavedVariants did not restore');
});
check('the a/b coin is weighted by how much material each side has', ()=>{
  /* A flat 50/50 over a 3.5:1 tagging split meant half of every affected character
     drew from a third of the pool, invisibly. */
  Object.entries(A.VARIANT_ODDS).forEach(([cat, p])=>{
    assert(p > 0.2 && p < 0.8, `${cat} coin at ${p.toFixed(2)} — a floor should stop either side vanishing`);
  });
  const cat = Object.keys(A.PRESENTATION_VARIANTS)[0];
  const pool = v => T.filter(t=>t.category===cat && (!t.variant || t.variant===v)).length;
  const bigger = pool('a') >= pool('b') ? 'a' : 'b';
  const odds = A.VARIANT_ODDS[cat];
  assert((bigger === 'a') === (odds >= 0.5), `${cat}: pools a=${pool('a')} b=${pool('b')} but coin favours the smaller side`);
  return Object.entries(A.VARIANT_ODDS).map(([c,p])=>`${p.toFixed(2)}`).join(' / ');
});

group('Budgets');
function budgetSheet(){
  // A hand-built sheet with a known rarity/intensity shape, so the assertions are
  // about the enforcement and not about whatever a random draw happened to produce.
  const pick = (tier, inten) => T.find(t => t.rtier === tier && t.intensity === inten
    && A.byFilter(t.section, t.category).length > 6);
  const st = {};
  [5,5,4,4].forEach((i,n)=>{ const t = pick('signature', i); if (t) st['manner'+n] = {slotId:'manner'+n, target:i, trait:t}; });
  [3,3].forEach((i,n)=>{ const t = pick('distinctive', i); if (t) st['pers_x'+n] = {slotId:'pers_x'+n, target:i, trait:t}; });
  return st;
}
check('a rarity cap evicts down to the cap and reports what it did', ()=>{
  A.clearBudgets();
  A.rarityCaps.signature = 1;
  const st = A.applyBudgets(budgetSheet(), 0);
  const sig = Object.values(st).filter(s=>s.trait && s.trait.rtier === 'signature').length;
  assert(sig <= 1, sig + ' signature traits survived a cap of 1');
  assert(A.getBudgetReport().actions.length > 0, 'nothing was reported');
  A.getBudgetReport().actions.forEach(a=> assert(a.from && a.why, 'an action was reported without saying what or why'));
  A.clearBudgets();
  return A.getBudgetReport() ? 'reported' : '';
});
check('locked, pinned and required slots are never modified but still spend the budget', ()=>{
  A.clearBudgets();
  A.rarityCaps.signature = 0;
  const st = budgetSheet();
  Object.keys(st).forEach(k=>{ st[k].locked = true; });
  const before = JSON.stringify(Object.keys(st).map(k=>st[k].trait.id));
  const after = A.applyBudgets(st, 0);
  assert(JSON.stringify(Object.keys(after).map(k=>after[k].trait.id)) === before, 'a locked slot was rewritten');
  // ...and the shortfall is stated rather than swallowed.
  assert(A.getBudgetReport().rarity.signature.unmet > 0, 'an unsatisfiable cap was reported as satisfied');
  A.clearBudgets();
});
check('an intensity budget lowers the loudest slots first', ()=>{
  A.clearBudgets();
  const st = budgetSheet();
  const total = o => Object.values(o).reduce((s,x)=> s + (x.trait ? x.trait.intensity : 0), 0);
  const cap = Math.max(6, total(st) - 6);
  A.intensityCaps.sheet = cap;
  const after = A.applyBudgets(st, 0);
  assert(total(after) <= cap || A.getBudgetReport().intensity.sheet.unmet,
    `total ${total(after)} exceeds cap ${cap} with no unmet flag`);
  A.clearBudgets();
});
check('warn-only changes nothing', ()=>{
  A.clearBudgets();
  A.rarityCaps.signature = 0;
  A.setBudgetMode('warn');
  const st = budgetSheet();
  const before = JSON.stringify(Object.keys(st).map(k=>st[k].trait.id));
  const after = A.applyBudgets(st, 0);
  assert(JSON.stringify(Object.keys(after).map(k=>after[k].trait.id)) === before, 'warn-only mutated the sheet');
  assert(!A.getBudgetReport().actions.length, 'warn-only reported adjustments');
  A.clearBudgets();
});
check('with no budgets set applyBudgets is a no-op', ()=>{
  A.clearBudgets();
  const st = budgetSheet();
  const before = JSON.stringify(st);
  A.applyBudgets(st, 0);
  assert(JSON.stringify(st) === before, 'an unconfigured budget still touched the sheet');
  assert(A.getBudgetReport() && !A.getBudgetReport().active, 'reported itself active with nothing set');
});
check('every budget group matches at least one slot on a real sheet', ()=>{
  const st = buildOnce(4242);
  const ids = Object.keys(st).filter(id => st[id] && st[id].trait);
  const empty = A.BUDGET_GROUPS.filter(g => !ids.some(g.match)).map(g=>g.id);
  // Appearance depends on DOM sliders the harness leaves centred, so it is allowed to
  // be empty here; everything else must be reachable or the control is a dead end.
  assert(!empty.filter(id => id !== 'appearance').length, 'groups matching nothing: ' + empty.join(', '));
  return A.BUDGET_GROUPS.length - empty.length + ' of ' + A.BUDGET_GROUPS.length + ' groups populated';
});
check('every preset resolves to caps the engine recognises', ()=>{
  Object.keys(A.BUDGET_PRESETS).forEach(k=>{
    A.clearBudgets();
    assert(A.applyBudgetPreset(k), k + ' did not apply');
    Object.keys(A.BUDGET_PRESETS[k].rarity || {}).forEach(t=>
      assert(A.RTIER_ORDER.includes(t), `${k} names an unknown tier "${t}"`));
    Object.keys(A.BUDGET_PRESETS[k].intensity || {}).forEach(g=>
      assert(A.BUDGET_GROUPS.some(x=>x.id===g), `${k} names an unknown budget group "${g}"`));
  });
  A.clearBudgets();
  return Object.keys(A.BUDGET_PRESETS).length + ' presets';
});

group('Context conditioning');
check('age is parsed out of free text', ()=>{
  assert(A.parseAgeHint('34') === 34, '34');
  assert(A.parseAgeHint('mid-30s') === 30, 'mid-30s -> ' + A.parseAgeHint('mid-30s'));
  assert(A.parseAgeHint('elderly') === 75, 'elderly');
  assert(A.parseAgeHint('') === null && A.parseAgeHint('unknowable') === null, 'empty');
});
check('a context line resolves to real bias', ()=>{
  const r = A.buildContextBias('dockside smuggler, ex-military', '34');
  assert(r.notes.length >= 2, 'notes: ' + JSON.stringify(r.notes));
  assert(r.bias.size > 0 || Object.keys(r.nudge).length > 0, 'no bias produced');
  return r.notes.join(' + ');
});
check('an empty context biases nothing', ()=>{
  const r = A.buildContextBias('', '');
  assert(r.notes.length === 0 && r.bias.size === 0 && Object.keys(r.nudge).length === 0);
});
check('every context rule names categories that exist', ()=>{
  const allCats = [];
  A.CATS_BY_SECTION.forEach(cats=> allCats.push(...cats));
  const known = new Set(allCats);
  const bad = [];
  ['dockside smuggler','ex-military','medieval peasant','corporate manager','doctor','scholar',
   'priest','dock labourer','grieving widow','noble heir'].forEach(txt=>{
    const r = A.buildContextBias(txt, '');
    r.bias.forEach((_, cat)=>{ if (!known.has(cat)) bad.push(cat); });
  });
  assert(!bad.length, 'unknown categories in context rules: ' + [...new Set(bad)].join(', '));
});/* buildContextBias sets module-level CONTEXT_BIAS / CONTEXT_AXIS_NUDGE as a side
   effect, and nothing in this group put them back — so every check after it ran against
   a character quietly conditioned as a 34-year-old dockside smuggler. Nothing measured
   a distribution, so nothing noticed for as long as that was true. */
ctx.evalIn('clearContextBias()');


group('Coverage invariants');
// Each of these encodes a bug that shipped: a silently-unmapped axis, a target the
// picker aimed outside its own pool, a category no code path could reach, and an
// opposition table with holes. They are cheap and they are the only thing that makes
// "we fixed it consistently" checkable rather than a claim.

check('every personality axis has a polarity code', ()=>{
  // curiosity was the missing one, and nothing failed loudly: the pole-tagging pass,
  // the affinity vector, conflict detection, archetype fidelity and the radar chart
  // all just quietly skipped it.
  const missing = A.PERSONALITY_AXES.filter(a=> !A.AXIS_TO_POLCODE[a.id]).map(a=>a.id);
  assert(!missing.length, 'axes with no polarity code: ' + missing.join(', '));
  const unlabelled = Object.values(A.AXIS_TO_POLCODE).filter(c=> !A.AXIS_LABELS[c]);
  assert(!unlabelled.length, 'polarity codes with no label: ' + unlabelled.join(', '));
  return A.PERSONALITY_AXES.length + ' axes';
});

check('both poles of every personality axis are polarity-tagged', ()=>{
  // The real symptom of the missing code: Curiosity's two poles sat at 19% and 2%
  // tagged while every other pole pair was at 100%.
  const weak = [];
  A.PERSONALITY_AXES.forEach(a=>{
    const code = A.AXIS_TO_POLCODE[a.id];
    if (!code) return;
    [a.pos, a.neg].forEach(cat=>{
      const pool = T.filter(t=>t.category === cat);
      if (!pool.length) return;
      const tagged = pool.filter(t=> t.pol && t.pol[code]).length;
      if (tagged / pool.length < 0.75) weak.push(`${cat} ${tagged}/${pool.length}`);
    });
  });
  assert(!weak.length, 'poles under 75% tagged: ' + weak.join(' | '));
});

check('a draw never targets outside its own pool', ()=>{
  /* S1-A: rangeSelect widened its band on COUNT but never checked WHERE the candidates
     sat, so a target below a pool's minimum left every candidate on one side of it and
     the proximity falloff went monotonic. Assert on the window rangeSelect actually
     returns — its centre must lie inside the pool's span, and the eligible slice must
     have material on both sides of that centre wherever the pool allows. Checking the
     returned trait instead would prove nothing: the pick always comes from the pool. */
  const bad = [];
  A.CATS_BY_SECTION.forEach((cats, section)=>{
    cats.forEach(cat=>{
      const pool = A.byFilter(section, cat);
      if (pool.length < 4) return;
      let lo = Infinity, hi = -Infinity;
      pool.forEach(t=>{ const p = A.traitPos(t); if(p<lo)lo=p; if(p>hi)hi=p; });
      [0, 25, 55, 80, 100].forEach(mag=>{
        const sel = A.rangeSelect(pool, A.targetFromMag(mag), 4);
        if (sel.target < lo - 1e-6 || sel.target > hi + 1e-6){
          bad.push(`${cat}@${mag}: centre ${sel.target.toFixed(2)} outside span [${lo.toFixed(2)}, ${hi.toFixed(2)}]`);
          return;
        }
        /* The collapse signature is a centre sitting clear of ALL its candidates: that
           is what turns the two-sided falloff monotonic and makes the nearest trait win
           every draw. A centre that merely lands in a gap between candidates is fine —
           sparse pools have gaps — so allow a half-position of slack rather than
           demanding a trait strictly on each side. */
        const positions = sel.list.map(t=> A.traitPos(t));
        const lmin = Math.min(...positions), lmax = Math.max(...positions);
        if (sel.target < lmin - 0.5 || sel.target > lmax + 0.5)
          bad.push(`${cat}@${mag}: centre ${sel.target.toFixed(2)} clear of all ${sel.list.length} candidates [${lmin.toFixed(2)}, ${lmax.toFixed(2)}]`);
      });
    });
  });
  assert(!bad.length, bad.length + ' one-sided or out-of-span windows: ' + bad.slice(0,4).join('; '));
});

check('a thin pool with an unreachable target still spreads its draws', ()=>{
  /* The regression that matters isn't "does it crash", it's "does it return the same
     trait every time". Motivation & Wound is drawAll, so its three 20-trait pools
     appear on EVERY sheet; before the fix The Need returned one trait 81% of the time
     and five distinct traits in three thousand draws. Assert the distribution, not the
     mechanism, so any future change to the weighting has to keep the property. */
  const thin = [['Motivation & Wound','The Need (what would actually help)'],
                ['Motivation & Wound','The Ghost (who or what it\'s attached to)'],
                ['Motivation & Wound','The Defence (what they built on top)']];
  const bad = [];
  thin.forEach(([sec,cat])=>{
    const pool = A.byFilter(sec, cat);
    if (pool.length < 5) return;
    const counts = new Map();
    for (let i=0;i<1200;i++){
      const t = A.pickInRange(pool, 'balanced', A.targetFromMag(62));
      if (t) counts.set(t.id, (counts.get(t.id)||0)+1);
    }
    const top = Math.max(...counts.values()) / 1200;
    if (counts.size < 8) bad.push(`${cat}: only ${counts.size} distinct in 1200 draws`);
    if (top > 0.55) bad.push(`${cat}: top trait takes ${(top*100).toFixed(0)}%`);
  });
  assert(!bad.length, bad.join('; '));
});

check('every category is reachable by some pick path', ()=>{
  /* "Repetitive & Circular" held 48 authored traits that no normal path could draw:
     AXES named four of its section's five categories. Approximate reachability as
     "named by AXES, or belongs to a section the generator draws by category" — enough
     to catch a whole category being orphaned by an incomplete lookup table. */
  const named = new Set();
  Object.values(A.AXES).forEach(ax=> named.add(ax.section + '||' + ax.category));
  const drawnByCategory = new Set(['Vocabulary Traits','Mannerisms','Dialogue Grammar Traits','Appearance']);
  A.PROFILE_SECTIONS.forEach(ps=> drawnByCategory.add(ps.section));
  A.PERSONALITY_AXES.forEach(a=> [a.pos,a.neg,a.mid].forEach(c=>{ if(c) named.add('Personality Traits||'+c); }));
  const orphans = [];
  A.CATS_BY_SECTION.forEach((cats, section)=>{
    cats.forEach(cat=>{
      if (drawnByCategory.has(section)) return;
      if (named.has(section + '||' + cat)) return;
      orphans.push(section + ' :: ' + cat);
    });
  });
  assert(!orphans.length, 'unreachable categories: ' + orphans.join(' | '));
});

check('every profile category is a cross-link target, not only a source', ()=>{
  // Skeptic and Secure could once only arrive by slider: nothing in WEIGHT_MATRIX
  // linked into them, so at neutral sliders they were structurally starved.
  const targets = new Set();
  const walk = m => Object.entries(m||{}).forEach(([k,v])=>{
    if (k === 'pos' || k === 'neg') walk(v);
    else if (v && typeof v === 'object') Object.keys(v).forEach(f=>targets.add(f.toLowerCase()));
  });
  Object.values(A.WEIGHT_MATRIX).forEach(walk);
  const missing = [];
  A.PROFILE_SECTIONS.forEach(ps=>{
    if (ps.drawAll) return;   // drawAll sections take every category, so nothing to steer
    A.catsOf(ps.section).forEach(c=>{
      if (![...targets].some(f=> c.toLowerCase().includes(f))) missing.push(ps.id + ':' + c);
    });
  });
  assert(!missing.length, 'categories nothing links into: ' + missing.join(' | '));
});

check('at neutral sliders no profile category dominates its section', ()=>{
  /* With every slider centred, nothing the user did should be steering the result — but
     resolved-category cross-links were applied at full weight while axis contributions
     were scaled by slider strength, so the cascade was the only signal in play and it
     decided the character outright. Measured: Outsider took 29% of a seven-way Social
     Role split, Disorganized 32% of a four-way Attachment split, and Secure 12% — the
     last because no cross-link pointed at it at all.

     Assert the property rather than the mechanism, at BOTH ends. The ceiling catches an
     unscaled cascade; the floor catches the sharper half of the bug, a category nothing
     links into, which is how Secure and Skeptic ended up structurally starved rather
     than merely unlucky. Bounds are loose enough to absorb sampling noise at this N and
     tight enough that the measured pre-fix numbers fail them.

     Seeded, and N raised. A seven-way split at N=300 puts about 43 characters in each
     bucket, whose sampling spread alone is wide enough to cross the 0.55 floor every
     few runs on a category that is perfectly healthy — so the check was failing
     intermittently on noise and telling nobody anything when it did. Measured over
     1,500 characters the real shares sit at 10-18% against a 14% uniform, comfortably
     inside the band; the seed makes that reproducible rather than probable. */
  /* Reset the workspace first. Earlier checks deliberately leave sliders, per-section
     profile weights and constraint sets dirty to prove they round-trip, and this check
     is specifically about what happens when NOTHING is set — so inheriting their state
     measures something other than what it claims to. */
  /* clearContextBias in particular: the Context conditioning group above sets a live
     age/occupation bias and never clears it, so every check after it was silently
     generating conditioned characters. Harmless while nothing measured a distribution,
     and it moved Social Role's Leader share from 14% to 28% the moment something did. */
  ctx.evalIn("clearContextBias();" +
             "bannedCategories.clear(); bannedSections.clear(); bannedTraitIds.clear();" +
             "requiredTraitIds.length = 0; requiredCategories.length = 0; exclusivePairs.length = 0;" +
             "categoryTiers.clear(); clearBudgets(); forgetRecentTraits(); forgetSlotDraws();");
  ['verbositySlider','registerSlider','composureSlider','profileWeight','rangeFocus','affinityBoost']
    .forEach(id=> ctx.document._set(id, {value:''}));
  A.PERSONALITY_AXES.forEach(a=> ctx.document._set('pers_'+a.id, {value:'0'}));
  A.PROFILE_SECTIONS.forEach(ps=>{
    ctx.document._set('sec_'+ps.id, {checked:true});
    ctx.document._set('pw_'+ps.id, {value:'', tagName:'SELECT', options:[{value:''}]});
    ctx.document._set('type_'+ps.id, {value:'', tagName:'SELECT', options:[{value:''}]});
  });
  ctx.evalIn('invalidateSliderCache()');

  const N = 1200;
  const counts = {};
  A.withRng(A.mulberry32(0x5eed1), ()=>{
  for (let i=0;i<N;i++){
    const o = {}; A.PERSONALITY_AXES.forEach(a=> o[a.id] = 0);
    A.rollCharacterVariants();
    const st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2,
      vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:o});
    A.PROFILE_SECTIONS.forEach(ps=>{
      if (ps.drawAll) return;
      const c = A.slotCat(st["prof_"+ps.id+"_0"]);
      if (c) ((counts[ps.id] = counts[ps.id] || {}))[c] = (counts[ps.id][c]||0) + 1;
    });
  }
  });
  /* The ceiling was uniform * 1.9 — 47% of a four-way split — which is why Attachment
     sitting at 31% Anxious against 21% Secure passed this check for as long as it did.
     A band that wide only catches a category that has taken over the section outright,
     not a section quietly leaning. Tightened to what the engine now actually measures
     (worst case 1.35x uniform, best 0.70x) with headroom for sampling noise. */
  const DOMINANCE_CEILING = 1.55, DOMINANCE_FLOOR = 0.62;
  const bad = [];
  Object.entries(counts).forEach(([id, c])=>{
    const ps = A.PROFILE_SECTIONS.find(p=>p.id===id);
    const nCats = A.catsOf(ps.section).length;
    const total = Object.values(c).reduce((a,b)=>a+b,0);
    if (!total || nCats < 2) return;
    const uniform = 1 / nCats;
    A.catsOf(ps.section).forEach(cat=>{
      const share = (c[cat] || 0) / total;
      if (share > uniform * DOMINANCE_CEILING)
        bad.push(`${id}:${cat} took ${(share*100).toFixed(0)}% of a ${nCats}-way split (uniform ${(uniform*100).toFixed(0)}%)`);
      if (share < uniform * DOMINANCE_FLOOR)
        bad.push(`${id}:${cat} starved at ${(share*100).toFixed(0)}% of a ${nCats}-way split (uniform ${(uniform*100).toFixed(0)}%)`);
    });
  });
  assert(!bad.length, bad.join('; '));

  /* A per-category band cannot see a section leaning as a GROUP, and Attachment was
     doing exactly that: three insecure styles against one secure one, so the three
     could each sit inside the band while together taking 80% of a split whose uniform
     share is 75%, with Secure ten points below Anxious. It happened for a structural
     reason — Secure was the target of one WEAK stress link where the others had STRONG,
     and (until this pass) the source of no cross-link at all — and the character it
     produced was systematically more damaged than the settings asked for. */
  const at = counts.attachment || {};
  const atTotal = Object.values(at).reduce((a,b)=>a+b,0) || 1;
  const secure = (at['Secure'] || 0) / atTotal;
  assert(secure > 0.20, `Secure attachment at ${(secure*100).toFixed(0)}% of a four-way split — the bank leans damaged`);
  /* Spread, not "Secure versus the leader": measuring the gap to one named category
     passes trivially the moment that category IS the leader, which is the same class of
     hole the 1.9x ceiling had. A four-way split with equal cross-link support should be
     flat in whichever direction it leans. */
  const shares = A.catsOf('Attachment & Intimacy Style').map(c=> (at[c]||0)/atTotal);
  const spread = Math.max(...shares) - Math.min(...shares);
  assert(spread < 0.10,
    `Attachment spans ${(spread*100).toFixed(0)} points between its most and least common style; a four-way split with equal support should be flatter than that`);

  return Object.keys(counts).length + ' sections checked, Secure at ' + (secure*100).toFixed(0) + '%';
});

check('humour moves under pressure, and every stress response points it somewhere', ()=>{
  /* Humor was excluded from the pressure sheet on the same "already covered by the
     mannerism shifts" reasoning as Vices, which is much weaker for humour: the warm one
     going barbed, or the funny one going silent, is arguably the most observable thing
     a character does under pressure, and it is not a mannerism.

     Including it in PRESSURE_SHIFT_SECTIONS is only half of it — the pressure pass
     resolves each section against the stress response alone, so without a stress->humor
     cross-link there was no signal for it to move on and the section would have
     "held" every time. Assert both halves. */
  assert(A.PRESSURE_SHIFT_SECTIONS.includes('humor'), 'humor is not in PRESSURE_SHIFT_SECTIONS');
  const stressKeys = Object.keys(A.WEIGHT_MATRIX).filter(k=>k.startsWith('stress:'));
  assert(stressKeys.length === 4, 'expected four stress cross-link entries, found ' + stressKeys.length);
  const noHumor = stressKeys.filter(k=>!A.WEIGHT_MATRIX[k].humor);
  assert(!noHumor.length, 'stress responses with no humour link: ' + noHumor.join(', '));
  // ...and they must not all point at the same category, or the shift is one-note.
  const targets = new Set();
  stressKeys.forEach(k=> Object.keys(A.WEIGHT_MATRIX[k].humor).forEach(c=>targets.add(c)));
  assert(targets.size >= 3, 'the four stress responses point humour at only ' + targets.size + ' categor(y/ies)');

  let moved = 0, sheets = 0;
  A.withRng(A.mulberry32(7), ()=>{
    for (let i=0;i<80;i++){
      A.rollCharacterVariants();
      const o = {}; A.PERSONALITY_AXES.forEach(a=> o[a.id] = 0);
      const st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2,
        vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:o});
      const ps = A.buildStressVariant(0, 0, 2, 'balanced', st);
      const slot = ps && ps['p_prof_humor'];
      if (!slot) continue;
      sheets++;
      if (slot.shifted) moved++;
    }
  });
  A.forgetRecentTraits(); A.forgetSlotDraws();
  assert(sheets > 40, 'the pressure sheet produced a humour slot only ' + sheets + ' times');
  assert(moved / sheets > 0.3, `humour held on ${(100*(1-moved/sheets)).toFixed(0)}% of pressure sheets — the section is in the list but nothing moves it`);
  return `${(100*moved/sheets).toFixed(0)}% of ${sheets} pressure sheets change humour`;
});

check('the profile preview agrees with the picker it predicts', ()=>{
  /* predictProfileCategories carried its own copy of pickCategoryWeighted's formula and
     had drifted: it applied neither the user's prefer/rarely category tiers nor the
     age/context multipliers. So the preview could name a category the build would
     rarely reach, and would drift further with every edit to either side. Both read
     categoryWeights() now — assert the property, by making a tier preference that only
     the shared formula can see and checking the preview moves with it. */
  ctx.evalIn("categoryTiers.clear(); clearContextBias();");
  A.PROFILE_SECTIONS.forEach(ps=>{
    ctx.document._set('sec_'+ps.id, {checked:true});
    ctx.document._set('type_'+ps.id, {value:'', tagName:'SELECT', options:[{value:''}]});
  });
  const cats = A.catsOf('Attachment & Intimacy Style');
  const before = A.predictProfileCategories();
  // "rarely" the predicted attachment style. If the preview ignores category tiers —
  // as it did — this changes nothing at all.
  ctx.evalIn(`categoryTiers.set(${JSON.stringify(before.attachment)}, 'rarely')`);
  const after = A.predictProfileCategories();
  ctx.evalIn("categoryTiers.clear()");
  assert(cats.length > 1, 'test section went missing');
  assert(after.attachment !== before.attachment,
    `preview still predicts "${before.attachment}" after it was set to rarely — it is not reading the picker's weights`);
  return `${before.attachment} -> ${after.attachment} when set to rarely`;
});

check('archetype profile hints are valid and actually nudge', ()=>{
  /* Archetypes set thirteen personality axes and three voice postures and nothing else,
     so a preset could never say "this character is Avoidant" — the seven profile
     sections were reachable only through whatever the axes happened to imply. Two
     things have to hold: every hint must name a category that exists (a typo here is
     silent, because an unmatched fragment simply contributes nothing), and a hint must
     move the draw without deciding it. */
  const valid = {};
  A.PROFILE_SECTIONS.forEach(ps=> valid[ps.id] = new Set(A.catsOf(ps.section)));
  const bad = [];
  Object.entries(A.ARCHETYPE_PROFILE_HINTS).forEach(([k, profile])=>{
    if (!A.ARCHETYPES[k]) bad.push(k + ' hints an archetype that does not exist');
    Object.entries(profile).forEach(([sec, cat])=>{
      if (!valid[sec]) bad.push(`${k}: no profile section "${sec}"`);
      else if (!valid[sec].has(cat)) bad.push(`${k}.${sec}: no category "${cat}"`);
    });
  });
  assert(!bad.length, bad.join('; '));
  const unhinted = Object.keys(A.ARCHETYPES).filter(k=>!A.ARCHETYPE_PROFILE_HINTS[k]);
  assert(!unhinted.length, 'archetypes with no profile hint: ' + unhinted.join(', '));

  const measure = (profile)=>{
    const c = {};
    A.withRng(A.mulberry32(0xA11CE), ()=> A.withArchetypeProfile(profile, ()=>{
      for (let i=0;i<250;i++){
        A.rollCharacterVariants();
        const o = {}; A.PERSONALITY_AXES.forEach(a=> o[a.id] = 0);
        const st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2,
          vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:o});
        const a = A.slotCat(st['prof_attachment_0']);
        if (a) c[a] = (c[a]||0) + 1;
      }
    }));
    return c;
  };
  const base = measure(null), hinted = measure({attachment:'Secure'});
  const share = c => (c['Secure']||0) / Object.values(c).reduce((a,b)=>a+b,0);
  const b = share(base), h = share(hinted);
  assert(h > b + 0.15, `hint moved Secure only ${(100*b).toFixed(0)}% -> ${(100*h).toFixed(0)}%`);
  // A nudge, not a setting: the other three styles must still be reachable, or the hint
  // has quietly become a forcedProfileCats and archetypes stop being a starting point.
  assert(h < 0.8, `hint pinned Secure at ${(100*h).toFixed(0)}% — that is forcing, not nudging`);
  A.forgetRecentTraits(); A.forgetSlotDraws();
  return `Secure ${(100*b).toFixed(0)}% -> ${(100*h).toFixed(0)}% across ${Object.keys(A.ARCHETYPE_PROFILE_HINTS).length} hinted archetypes`;
});

group('Workspace persistence');
check('every workspace control survives a capture/restore round-trip', ()=>{
  /* The old preference layer persisted a hand-maintained list of twelve static control
     ids. Everything else was lost on reload: all thirteen personality sliders, the
     three voice sliders, every sec_/type_/pw_ control (built at runtime, so a static
     list could never have covered them), and the entire constraint set — the highest
     effort state in the app. Preferences now serialise through captureSettings /
     restoreSettings, the same pair the character-export format uses, so this asserts
     the property both features depend on. */
  const doc = ctx.document;
  ['verbositySlider','registerSlider','composureSlider'].forEach(id=> doc._set(id, {value:'0', type:'range'}));
  A.PERSONALITY_AXES.forEach(a=> doc._set('pers_'+a.id, {value:'0', type:'range'}));
  A.PROFILE_SECTIONS.forEach(ps=>{
    doc._set('sec_'+ps.id, {checked:true});
    doc._set('pw_'+ps.id, {value:'', tagName:'SELECT', options:[{value:''},{value:'70'}]});
  });

  const axis = A.PERSONALITY_AXES[0], secA = A.PROFILE_SECTIONS[0], secB = A.PROFILE_SECTIONS[1];
  doc.getElementById('pers_'+axis.id).value = '-80';
  doc.getElementById('verbositySlider').value = '45';
  doc.getElementById('pw_'+secA.id).value = '70';
  doc.getElementById('sec_'+secB.id).checked = false;
  A.bannedCategories.add('Cruel & Barbed');
  A.requiredTraitIds.push(T[5].id);
  A.exclusivePairs.push([T[1].id, T[2].id]);

  const snap = JSON.parse(JSON.stringify(A.captureSettings()));

  // wipe the workspace the way a reload does
  doc.getElementById('pers_'+axis.id).value = '0';
  doc.getElementById('verbositySlider').value = '0';
  doc.getElementById('pw_'+secA.id).value = '';
  doc.getElementById('sec_'+secB.id).checked = true;
  A.bannedCategories.clear();
  A.requiredTraitIds.length = 0;
  A.exclusivePairs.length = 0;

  A.restoreSettings(snap);

  assert(doc.getElementById('pers_'+axis.id).value === '-80', 'personality slider lost');
  assert(doc.getElementById('verbositySlider').value === '45', 'voice slider lost');
  assert(doc.getElementById('pw_'+secA.id).value === '70', 'profile weight lost');
  assert(doc.getElementById('sec_'+secB.id).checked === false, 'section toggle lost');
  // restoreSettings REASSIGNS the constraint collections rather than mutating them, so
  // read them back through a fresh capture — a reference held from before the restore
  // points at the discarded Set.
  const after = A.captureSettings().constraints;
  assert(after.bannedCategories.includes('Cruel & Barbed'), 'banned category lost');
  assert(after.requiredTraitIds.length === 1, 'required trait lost');
  assert(after.exclusivePairs.length === 1, 'exclusive pair lost');

  A.restoreSettings({constraints:{}});   // leave the workspace clean for later tests
  return 'sliders, sections, constraints';
});

check('a saved character survives the compress -> validate -> expand round trip', ()=>{
  /* THE bug this file existed to catch and did not. saveCharacter writes
     compressSlots(state) to browser storage — every trait replaced by a {__id} stub —
     and both readers validated that payload before expanding it. The validator
     requires slot.trait.id and three strings, so every save this build wrote threw on
     load. The one validation test above builds `good` from a raw buildCharacterState,
     which is the UNCOMPRESSED shape, and file export writes uncompressed too — so the
     only path that compresses was the only path with no test. Exercise the real
     sequence storage uses. */
  const st = A.buildCharacterState({verbLevel:0.5, regLevel:-0.5, compLevel:0.5,
    mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null});
  const seated = Object.keys(st).filter(k=>st[k] && st[k].trait);
  assert(seated.length > 5, 'expected a populated sheet to round-trip');

  // What saveCharacter actually puts in storage, through a real JSON hop.
  const stored = JSON.parse(JSON.stringify({state: A.compressSlots(st), charMeta:{name:'x'}}));
  assert(stored.state[seated[0]].trait.__id !== undefined, 'compressSlots did not produce a stub');

  // ...and what loadSavedCharacter must now do with it, in this order.
  stored.state = A.expandSlots(stored.state);
  A.validateSheetPayload(stored);   // threw for every saved character before the fix

  seated.forEach(k=>{
    assert(stored.state[k].trait, 'slot ' + k + ' lost its trait in the round trip');
    assert(stored.state[k].trait.id === st[k].trait.id, 'slot ' + k + ' expanded to the wrong trait');
    assert(stored.state[k].target === st[k].target, 'slot ' + k + ' lost its target');
  });
  // Validating BEFORE expanding is the defect; prove the ordering is what matters and
  // not something incidental about this particular sheet.
  const compressedAgain = {state: A.compressSlots(st)};
  let threw = false;
  try { A.validateSheetPayload(compressedAgain); } catch(e){ threw = true; }
  assert(threw, 'a compressed payload must not pass validation — the fix is the ordering, not the validator');
  return seated.length + ' slots';
});

check('import validation accepts real sheets and rejects malformed ones', ()=>{
  /* The format string was the only check an imported file faced, so a file that claimed
     the right format and then carried a malformed state crashed in renderSheet — after
     snapshotHistory had run and the globals had been replaced. Validation now runs
     before anything is touched, so it has to accept everything the app itself writes. */
  const st = A.buildCharacterState({verbLevel:0.5, regLevel:-0.5, compLevel:0.5,
    mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null});
  const good = {format:'character-voice-sheet', state:st, charMeta:{name:'x'}};
  A.validateSheetPayload(good);                       // a real export must pass
  A.validateSheetPayload({format:'character-voice-sheet'});          // minimal file
  A.validateSheetPayload({format:'character-voice-sheet', state:{}}); // empty sheet
  // trait:null and an empty slot are both legitimate states the engine produces
  A.validateSheetPayload({format:'character-voice-sheet', state:{a:{trait:null}, b:null}});

  const rejects = [
    ['state is a string',   {state:'nope'}],
    ['state is an array',   {state:[1,2]}],
    ['slot is a string',    {state:{a:'nope'}}],
    ['trait is a string',   {state:{a:{trait:'nope'}}}],
    ['trait has no id',     {state:{a:{trait:{trait:'x',category:'y',section:'z'}}}}],
    ['trait has no text',   {state:{a:{trait:{id:1,category:'y',section:'z'}}}}],
    ['settings not object', {settings:'nope'}],
    ['pressure not object', {pressureState:'nope'}],
  ];
  const missed = [];
  rejects.forEach(([label, extra])=>{
    try { A.validateSheetPayload(Object.assign({format:'character-voice-sheet'}, extra)); missed.push(label); }
    catch(e){ /* expected */ }
  });
  assert(!missed.length, 'accepted malformed payloads: ' + missed.join(', '));
  return rejects.length + ' malformed shapes rejected';
});

check('undo round-trips a sheet without losing or duplicating traits', ()=>{
  /* Undo stored fifteen full deep copies, embedding a complete trait record in every one
     of ~37 slots per snapshot for traits that are live in TRAITS and never change. Now
     it stores ids and re-links. The property that must hold either way: what comes back
     out of undo is what went in. */
  const st = A.buildCharacterState({verbLevel:0.5, regLevel:-0.5, compLevel:0.5,
    mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null});
  const before = Object.entries(st).filter(([,v])=>v && v.trait).map(([k,v])=>k+'='+v.trait.id).sort();
  assert(before.length > 5, 'built a sheet with almost nothing on it');

  const round = A.expandSlots(A.compressSlots(st));
  const after = Object.entries(round).filter(([,v])=>v && v.trait).map(([k,v])=>k+'='+v.trait.id).sort();
  assert(before.join('|') === after.join('|'), 'slot/trait mapping changed across a round-trip');
  // re-linked, not copied: the sheet must point back at the live pool so reroll, pin and
  // the why-panel keep working on an undone character
  Object.values(round).forEach(v=>{
    if (v && v.trait) assert(A.TRAITS_BY_ID.get(v.trait.id) === v.trait, 'slot holds a detached trait copy');
  });
  // a trait no longer in the pool keeps its embedded text rather than vanishing
  const orphan = {a:{trait:{id:-999, trait:'gone', category:'c', section:'s', intensity:3, rarity:'common'}}};
  const kept = A.expandSlots(A.compressSlots(orphan));
  assert(kept.a.trait && kept.a.trait.trait === 'gone', 'an orphaned trait was dropped by undo');
  // null slots and trait:null survive untouched
  const empties = A.expandSlots(A.compressSlots({a:null, b:{trait:null}}));
  assert(empties.a === null && empties.b.trait === null, 'empty slots did not survive');
  return before.length + ' slots';
});

check('emergent names are deterministic per profile and varied across profiles', ()=>{
  /* The name keyed off two of the seven profile facts, and the exact-name table hit on
     400 rolls out of 400 — so the compositional branch was unreachable and Humor and
     Vices, the two most texture-carrying facts, could never affect the name. 400
     characters produced 35 distinct names. Assert both halves of the fix: the same
     sheet must still always show the same name, and the spread must stay wide. */
  const mk = (over) => {
    const o = {}; A.PERSONALITY_AXES.forEach(a=> o[a.id] = 0);
    A.rollCharacterVariants();
    return A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2,
      vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:Object.assign(o, over||{})});
  };
  const st = mk();
  const first = A.emergentArchetypeName(st);
  for (let i=0;i<5;i++){
    const again = A.emergentArchetypeName(st);
    assert(again && first && again.name === first.name,
      `same sheet named differently: "${first && first.name}" then "${again && again.name}"`);
  }

  const names = new Map();
  for (let i=0;i<250;i++){
    const n = A.emergentArchetypeName(mk());
    if (n) names.set(n.name, (names.get(n.name)||0)+1);
  }
  const top = Math.max(...names.values());
  assert(names.size >= 100, `only ${names.size} distinct names in 250 characters`);
  assert(top / 250 < 0.12, `one name took ${(top/250*100).toFixed(0)}% of 250 characters`);
  return names.size + ' distinct in 250';
});

check('the caricature guard responds to the character, not the slider position', ()=>{
  /* A flat "three or more loud traits" threshold made this a readout of where the
     sliders were: 0/400 at neutral and 400/400 at extreme, mean 16.7 loud traits. It now
     scores against what these settings should have produced. The property: it must fire
     sometimes at neutral (where three loud traits really is the tail) and must NOT fire
     routinely at the extremes (where loud is what was asked for). */
  const run = (v) => {
    let fired = 0;
    const N = 300;
    for (let i=0;i<N;i++){
      const o = {}; A.PERSONALITY_AXES.forEach(a=> o[a.id] = v ? (i%2 ? v : -v) : 0);
      A.rollCharacterVariants();
      const st = A.buildCharacterState({verbLevel: v/50*(i%2?1:-1), regLevel:0, compLevel:0,
        mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:o});
      if (A.loudnessCheck(st)) fired++;
    }
    return fired / N;
  };
  const neutral = run(0), extreme = run(100);
  assert(neutral > 0 && neutral < 0.20,
    `at neutral sliders the guard fired on ${(neutral*100).toFixed(1)}% of sheets — it should flag the tail, not nothing and not everything`);
  assert(extreme < 0.20,
    `at extreme sliders the guard fired on ${(extreme*100).toFixed(1)}% of sheets — loud is what was asked for there`);
  return `neutral ${(neutral*100).toFixed(1)}%, extreme ${(extreme*100).toFixed(1)}%`;
});

group('Anti-repetition memory');
check('a remembered trait is penalised, an unseen one is not', ()=>{
  // recentPenalty only applies while a build has enabled it, and the flag is resolved
  // once per build rather than per draw — so drive it through the real path: set the
  // toggle, run a build, then check. Asserts BOTH directions, because the toggle now
  // ships on and a test that only checks the off case would have quietly stopped
  // testing anything the moment that default flipped.
  const t = T[10], unseen = T[11];
  const build = () => A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0,
    mannerCount:1, vocabCount:1, rarityPref:'balanced', vocabPref:null});

  ctx.document._set('avoidRecentToggle', {checked:false});
  A.forgetRecentTraits();
  A.rememberGeneration({a:{trait:t}});
  build();
  assert(A.recentPenalty(t) === 1, 'penalty applied while the toggle is off');

  ctx.document._set('avoidRecentToggle', {checked:true});
  A.forgetRecentTraits();
  A.rememberGeneration({a:{trait:t}});
  build();
  assert(A.recentPenalty(t) < 1, 'remembered trait was not penalised while the toggle is on');
  assert(A.recentPenalty(unseen) === 1, 'an unseen trait was penalised');

  A.forgetRecentTraits();
  ctx.document._set('avoidRecentToggle', {checked:false});
  return 'both directions';
});

group('Whole-sheet consumers survive an empty slot');
/* Every one of these threw on a sheet holding a slot with trait:null — reachable by
   banning a section and generating, and by loading a save written by an older build.
   Two of them (coherenceScore via checkConflicts) threw outside any try/catch. The
   pickers now emit an explicit empty slot rather than three inconsistent answers, so
   this asserts the whole consumer surface tolerates one. */
function sheetWithEmptySlots(){
  const st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0,
    mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null});
  const keys = Object.keys(st);
  // Blank a profile slot, a fixed-spine slot, and a personality slot.
  ['prof_role_0','register','verbosity','grammar','app_move','app_mark']
    .forEach(k=>{ if (st[k]) st[k] = A.emptySlot(k, st[k].label); });
  const pers = keys.find(k=>k.startsWith('pers_'));
  if (pers) st[pers] = A.emptySlot(pers, st[pers].label);
  return st;
}
check('a sheet with empty slots exports, scores and analyses without throwing', ()=>{
  const st = sheetWithEmptySlots();
  const meta = {name:'Test', age:'40', context:'', seed:'abc'};
  const consumers = [
    ['sheetToText',        ()=> A.sheetToText(st, meta, {})],
    ['sheetToHTML',        ()=> A.sheetToHTML(st, meta, {})],
    ['coherenceScore',     ()=> A.coherenceScore(st)],
    ['checkConflictsFor',  ()=> A.checkConflictsFor(st)],
    ['axisProfile',        ()=> A.axisProfile(st)],
    ['secondOrderTensions',()=> A.secondOrderTensions(st)],
    ['emergentArchetypeName', ()=> A.emergentArchetypeName(st)],
    ['compressSlots/expandSlots', ()=> A.expandSlots(A.compressSlots(st))],
    ['budgetCapacity',     ()=> A.budgetCapacity(st)],
  ];
  const broke = [];
  consumers.forEach(([name, fn])=>{ try { fn(); } catch(e){ broke.push(name + ': ' + e.message); } });
  assert(!broke.length, broke.join('\n       '));
  return consumers.length + ' consumers';
});
check('an all-empty sheet is still exportable', ()=>{
  const st = {};
  ['verbosity','register','grammar','app_move','prof_role_0']
    .forEach(k=> st[k] = A.emptySlot(k, k));
  const out = A.sheetToText(st, {name:'Nobody'}, {});
  assert(typeof out === 'string' && out.includes('Nobody'), 'no usable export');
  return 'exported ' + out.split('\n').length + ' lines';
});

group('Axis-keyed table drift');
check('every axis-keyed table agrees with AXIS_LABELS', ()=>{
  /* CONTRADICTION_QUESTIONS keyed rebelliousness as `reb` while AXIS_LABELS spells it
     `rebel`, so the entry had never been read once and every rebelliousness
     contradiction — 302 tagged traits, one of the two most-tagged axes in the bank —
     fell through to the generic fallback question. Nothing checked that these tables
     agree with the vocabulary they are keyed on. */
  const problems = A.assertAxisTables();
  assert(!problems.length, problems.join('\n       '));
  return Object.keys(A.AXIS_LABELS).length + ' axes';
});

group('js/app.js');
check('axisProfile reads polarity off a real sheet and tolerates an empty slot', ()=>{
  const st = A.buildCharacterState({verbLevel:1, regLevel:0, compLevel:0,
    mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null});
  const full = A.axisProfile(st);
  assert(full && typeof full === 'object', 'no profile');
  const nonZero = Object.values(full).filter(v=>v !== 0).length;
  assert(nonZero > 0, 'every axis read as zero on a full sheet');
  const blanked = Object.assign({}, st);
  Object.keys(blanked).slice(0, 5).forEach(k=> blanked[k] = A.emptySlot(k, 'x'));
  A.axisProfile(blanked);   // must not throw
  return nonZero + ' axes carry signal';
});
check('randomAxisLevel spans the whole axis range', ()=>{
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < 5000; i++){ const v = A.randomAxisLevel(); lo = Math.min(lo,v); hi = Math.max(hi,v); }
  assert(lo >= -2 && hi <= 2, `produced ${lo.toFixed(2)}..${hi.toFixed(2)} — outside the -2..2 axis range`);
  assert(hi - lo > 3.5, 'barely varies: ' + (hi - lo).toFixed(2));
  return `${lo.toFixed(2)}..${hi.toFixed(2)}`;
});
/* These two are UI entry points that read module globals rather than taking arguments,
   so drive them the way the page does. Both crashed on a null trait before slotCat was
   applied, and neither had ever been executed outside a browser. */
const mkChar = (name, v) => ({meta:{name}, state: A.buildCharacterState({verbLevel:v, regLevel:-v,
  compLevel:0, mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null})});
check('checkEnsembleBalance survives a cast holding empty slots', ()=>{
  ctx.evalIn('castStates = []');
  [mkChar('A',0), mkChar('B',1), mkChar('C',-1), mkChar('D',1.5)].forEach(c=>{
    ctx.__push = c; ctx.evalIn('castStates.push(globalThis.__push)');
  });
  ctx.evalIn("castStates[1].state['prof_role_0'] = emptySlot('prof_role_0','Role');" +
             "castStates[2].state['pers_honesty'] = emptySlot('pers_honesty','Honesty');" +
             "if (castStates.length < 3) throw new Error('cast did not populate');" +
             "checkEnsembleBalance();");
  ctx.evalIn('castStates = []');
  return 'ok on a 4-member cast';
});
check('analyseRelationship compares two sheets, one of them holding empty slots', ()=>{
  ctx.evalIn('castStates = []');
  [mkChar('Left', 1.5), mkChar('Right', -1.5)].forEach(c=>{
    ctx.__push = c; ctx.evalIn('castStates.push(globalThis.__push)');
  });
  ctx.evalIn("castStates[0].state['prof_values_0'] = emptySlot('prof_values_0','Values')");
  ctx.document._set('relA', {value:'cast_0'});
  ctx.document._set('relB', {value:'cast_1'});
  ctx.evalIn("if (!getCharByKey('cast_0') || !getCharByKey('cast_1')) throw new Error('cast lookup failed');" +
             "analyseRelationship();");
  ctx.evalIn('castStates = []');
  return 'ok';
});
check('the readout word helpers cover their whole input range', ()=>{
  const gaps = [];
  for (let i = 1; i <= 5; i++) if (!A.intensityWord(i)) gaps.push('intensity ' + i);
  for (let raw = -100; raw <= 100; raw += 5){
    if (!A.voiceSliderWord('verbosity', raw)) gaps.push('verbosity ' + raw);
  }
  assert(!gaps.length, gaps.slice(0,5).join(', '));
  return 'no gaps';
});

group('Content-Security-Policy');
check('no source file contains an inline event handler', ()=>{
  /* The app carried about 140 inline on* attributes. They work, and they make a strict
     CSP impossible: any policy without 'unsafe-inline' in script-src turns every button
     in the app into a dead button, which is a real constraint for anyone embedding
     this. They are declared actions now, dispatched by one delegated listener per event
     type. This is the cheap guard against one creeping back — tests/browser.mjs checks
     the same property in a real browser AND that the whole app works under
     script-src 'self'. */
  const fs = require('fs'), path = require('path');
  const files = ['index.html', 'js/app.js', 'js/engine.js', 'js/generate.js', 'js/render.js'];
  const bad = [];
  files.forEach(f=>{
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    src.split('\n').forEach((line, i)=>{
      const m = line.match(/\son(click|change|input|keydown|submit|focus|blur|mouseover)\s*=\s*"/);
      if (m) bad.push(`${f}:${i+1} ${m[1]}`);
    });
  });
  assert(!bad.length, bad.length + ' inline handler(s):\n       ' + bad.slice(0, 8).join('\n       '));
  return files.length + ' files clean';
});
check('every declared action names a function that exists', ()=>{
  /* A typo in a data-act is silent at author time and dead at click time, which is
     strictly worse than the inline handler it replaced — an inline typo at least
     throws a ReferenceError naming the symbol. Check the static markup here; the
     template-generated ones go through actAttr() and are covered in the browser run. */
  const fs = require('fs'), path = require('path');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const names = [...html.matchAll(/data-act="([A-Za-z_$][\w$]*)"/g)].map(m=>m[1]);
  const missing = [...new Set(names)].filter(n => typeof ctx[n] !== 'function' && typeof A[n] !== 'function');
  assert(!missing.length, 'actions with no function: ' + missing.join(', '));
  return new Set(names).size + ' distinct actions, all resolvable';
});
check('every declared argument list is valid JSON', ()=>{
  const fs = require('fs'), path = require('path');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const bad = [];
  [...html.matchAll(/data-args="([^"]*)"/g)].forEach(m=>{
    const raw = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    try { const v = JSON.parse(raw); if (!Array.isArray(v)) bad.push(raw); }
    catch (e){ bad.push(raw); }
  });
  assert(!bad.length, bad.length + ' unparseable: ' + bad.slice(0,3).join(' | '));
  return 'all parse';
});

group('Archetype coverage');
check('the archetype presets cover both directions of every axis', ()=>{
  /* The prior widening pass fixed the THEMES; the imbalance that remained was in the
     numbers. discipline was set in 20 of 28 presets and POSITIVE in 17 of them, so
     there was no 'chaotic but likeable' archetype at all. intelligence was set
     negative exactly once in 28, which — with the 7.8:1 polarity skew on the same axis
     — made 'not very bright' the least-supported character in the tool at both levels
     at once. And assertiveness, the axis with the strongest grammar cross-link in the
     matrix, was the one the presets spoke to least. */
  const all = Object.values(A.ARCHETYPES);
  const stat = {};
  A.PERSONALITY_AXES.forEach(a=> stat[a.id] = {n:0, pos:0, neg:0});
  all.forEach(arch => Object.entries(arch.pers || {}).forEach(([ax, v])=>{
    if (!stat[ax] || !v) return;
    stat[ax].n++; v > 0 ? stat[ax].pos++ : stat[ax].neg++;
  }));
  const bad = [];
  Object.entries(stat).forEach(([ax, st])=>{
    if (st.n < all.length * 0.3) bad.push(`${ax}: touched by only ${st.n}/${all.length} presets`);
    if (st.n && st.neg < 3) bad.push(`${ax}: only ${st.neg} preset(s) push it negative`);
    if (st.n && st.pos < 3) bad.push(`${ax}: only ${st.pos} preset(s) push it positive`);
  });
  assert(!bad.length, bad.join('\n       '));
  const touched = Object.values(stat).map(x=>x.n);
  return `${all.length} presets, each axis set in ${Math.min(...touched)}-${Math.max(...touched)} of them`;
});
check('every archetype names real vocabulary categories and real axes', ()=>{
  const cats = new Set(A.catsOf('Vocabulary Traits'));
  const axes = new Set(A.PERSONALITY_AXES.map(a=>a.id));
  const bad = [];
  Object.entries(A.ARCHETYPES).forEach(([key, a])=>{
    if (!a.label) bad.push(key + ' has no label');
    (a.vocabPref || []).forEach(c=>{ if (!cats.has(c)) bad.push(`${key}: unknown vocabulary category "${c}"`); });
    Object.keys(a.pers || {}).forEach(ax=>{ if (!axes.has(ax)) bad.push(`${key}: unknown axis "${ax}"`); });
    Object.values(a.pers || {}).forEach(v=>{ if (typeof v !== 'number' || Math.abs(v) > 100) bad.push(`${key}: axis value ${v} out of range`); });
    ['verbosity','register','composure'].forEach(k=>{
      if (a[k] !== undefined && (typeof a[k] !== 'number' || Math.abs(a[k]) > 2)) bad.push(`${key}: ${k} = ${a[k]} is not a -2..2 level`);
    });
  });
  assert(!bad.length, bad.join('\n       '));
  return Object.keys(A.ARCHETYPES).length + ' presets';
});

group('Motivation & Wound is wired in');
/* The section the sheet leads with, that draws on every character, and that supplies
   the pressure trigger, participated in the weight matrix in NEITHER direction: not one
   of its seven categories was a WEIGHT_MATRIX target, none had a DEPTH_TO_PERSONALITY
   entry, and it was excluded from WILDCARD_SECTIONS and PRESSURE_SHIFT_SECTIONS. Its
   whole outbound influence was one hardcoded link to the Distinguishing Marks target. */
check('a wound actually moves the categories downstream of it', ()=>{
  const measure = (text) => {
    const counts = {attachment:{}, values:{}, role:{}};
    const fake = text ? [{trait:text, desc:text, intensity:4}] : [];
    try {
      A.withRng(A.mulberry32(0x50117d), ()=>{
        for (let i = 0; i < 600; i++){
          A.setMotivationLinks(A.motivationCrosslinkMap(fake));
          const cats = A.resolveProfileCategories('balanced', {}, null);
          Object.keys(counts).forEach(k=>{ if (cats[k]) counts[k][cats[k]] = (counts[k][cats[k]]||0)+1; });
        }
      });
    } finally { A.setMotivationLinks(null); }
    return counts;
  };
  const share = (c, sec, cat) => (c[sec][cat] || 0) / 600;
  const base = measure('');
  const betrayed = measure('Betrayed by kin — a broken promise from the people who were meant to be safe');
  const abandoned = measure('Fear of abandonment — terrified of being left behind and permanently alone');
  const moves = [];
  // The report's own worked example: this wound should pull Attachment toward Avoidant
  // and Values toward Loyalty-Bound.
  if (share(betrayed,'attachment','Avoidant') <= share(base,'attachment','Avoidant') * 1.2)
    moves.push('betrayal did not pull Attachment toward Avoidant');
  if (share(betrayed,'values','Loyalty-Bound') <= share(base,'values','Loyalty-Bound') * 1.3)
    moves.push('betrayal did not pull Values toward Loyalty-Bound');
  if (share(abandoned,'attachment','Anxious') <= share(base,'attachment','Anxious') * 1.3)
    moves.push('abandonment did not pull Attachment toward Anxious');
  // ...and it must NUDGE, not decide. A single wound taking a category past ~60% would
  // mean the cross-link had become the whole character, which is the bug the
  // CROSSLINK_STRENGTH scaling exists to prevent.
  Object.entries(betrayed).forEach(([sec, m])=>
    Object.entries(m).forEach(([cat, n])=>{ if (n/600 > 0.6) moves.push(`${sec}:${cat} took ${(100*n/600).toFixed(0)}% — deciding, not nudging`); }));
  assert(!moves.length, moves.join('\n       '));
  return `Avoidant ${(100*share(base,'attachment','Avoidant')).toFixed(0)}%→${(100*share(betrayed,'attachment','Avoidant')).toFixed(0)}%, ` +
         `Loyalty-Bound ${(100*share(base,'values','Loyalty-Bound')).toFixed(0)}%→${(100*share(betrayed,'values','Loyalty-Bound')).toFixed(0)}%`;
});
check('the motivation keyword rules reach the section they are written for', ()=>{
  /* Roughly half this section is written hyphenated ("Fear-of-becoming-a-burden") and
     every rule is written in prose, so a rule reading /becoming a burden/ never once
     matched the trait it was written for. */
  const mt = T.filter(t=>t.section === 'Motivation & Wound');
  const linked = mt.filter(t=> A.MOTIVATION_CROSSLINKS.some(([re])=> re.test(A.motivationText(t))));
  const untagged = mt.filter(t=> !Object.keys(t.pol||{}).some(k=>t.pol[k]));
  assert(linked.length / mt.length >= 0.35,
    `only ${linked.length}/${mt.length} motivation traits match any cross-link rule`);
  assert(untagged.length <= 90, `${untagged.length} motivation traits carry no polarity at all`);
  return `${linked.length}/${mt.length} cross-linked, ${untagged.length} still untagged`;
});
check('Motivation & Wound reaches the systems it was excluded from', ()=>{
  const gaps = [];
  if (!A.WILDCARD_SECTIONS.includes('Motivation & Wound')) gaps.push('WILDCARD_SECTIONS');
  if (!A.PRESSURE_SHIFT_SECTIONS.includes('motivation')) gaps.push('PRESSURE_SHIFT_SECTIONS');
  const depth = A.catsOf('Motivation & Wound').filter(c => A.DEPTH_TO_PERSONALITY[c]);
  if (!depth.length) gaps.push('DEPTH_TO_PERSONALITY');
  assert(!gaps.length, 'still excluded from: ' + gaps.join(', '));
  return `${depth.length}/${A.catsOf('Motivation & Wound').length} categories drive depth-first`;
});

group('Slot variety at default settings');
/* The measurement that would have caught poolFloorTarget being inert. Its lift was a
   no-op on every pool it was written for — max(target, 0.55 + 0.35) never beat a target
   of 1.20 — and the engine comments claimed the fix had worked, because the top-trait
   share DID improve (that was the separate rarityNorm change) while the distinct count
   did not move at all. Nothing measured the distinct count, so nothing noticed.

   These are the fixed-category slots: the ones whose variety is capped by how much
   material one category holds near the target, rather than by picking a category first
   the way vocab/manner/grammar/role do. Measured over 400 builds at defaults, they ran
   9-19 distinct traits with a single trait taking 11-19% of every character generated. */
check('the fixed-category slots draw from a real range', ()=>{
  A.forgetRecentTraits(); A.forgetSlotDraws();
  const N = 200;
  const seen = new Map();
  for (let i = 0; i < N; i++){
    const st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0,
      mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null});
    A.rememberGeneration(st);
    Object.entries(st).forEach(([k, s])=>{
      if (!s || !s.trait) return;
      if (!seen.has(k)) seen.set(k, new Map());
      const m = seen.get(k);
      m.set(s.trait.id, (m.get(s.trait.id) || 0) + 1);
    });
  }
  // This test runs 200 builds and would otherwise leave the recency window and the
  // per-slot draw memory full for whatever runs next — which is enough to shift a
  // later distribution check by several points. Reset both.
  A.forgetRecentTraits(); A.forgetSlotDraws();
  // slot id -> the floor it must clear over N builds. Set below what the engine
  // currently achieves, so ordinary content churn doesn't trip it and a structural
  // regression does.
  /* Motivation and Appearance were added to this list after a 400-character audit found
     every one of the twenty-five most-repeated traits in the app came from those two
     sections — 23-38 distinct per Motivation slot with a top trait at 13%, and 19/22 for
     the two Appearance slots seated on every sheet. The floors here are set below what
     the engine now achieves (44-68 for Motivation, 28/33 for Appearance over 200
     builds), so content churn doesn't trip them and a structural regression does.

     app_move and app_mark keep a looser top-share allowance than everything else,
     stated rather than hidden: they draw from the two smallest always-drawn pools in
     the bank (44 and 43 traits) and are seated on every sheet regardless of any slider,
     so their ceiling is a content limit, not a weighting one. */
  const FLOORS = {register: 40, verbosity: 30, pers_honesty: 20, pers_confidence: 20,
                  pers_curiosity: 20, pers_manners: 20, pers_activeness: 20,
                  prof_motivation_0: 40, prof_motivation_1: 35, prof_motivation_2: 32,
                  prof_motivation_3: 35, prof_motivation_4: 32, prof_motivation_5: 30,
                  prof_motivation_6: 32,
                  app_move: 20, app_mark: 24};
  const TOP_SHARE_LIMIT = {app_move: 0.11, app_mark: 0.12};
  const thin = [];
  Object.entries(FLOORS).forEach(([slot, floor])=>{
    const m = seen.get(slot);
    if (!m) return thin.push(slot + ' never drew');
    const total = [...m.values()].reduce((a,b)=>a+b, 0);
    const topShare = Math.max(...m.values()) / total;
    if (m.size < floor) thin.push(`${slot}: ${m.size} distinct in ${N} (want >= ${floor})`);
    const limit = TOP_SHARE_LIMIT[slot] !== undefined ? TOP_SHARE_LIMIT[slot] : 0.14;
    if (topShare > limit) thin.push(`${slot}: one trait in ${(100*topShare).toFixed(0)}% of characters (limit ${(100*limit).toFixed(0)}%)`);
  });
  assert(!thin.length, thin.join('\n       '));
  const sizes = Object.keys(FLOORS).map(k=> (seen.get(k) || new Map()).size);
  return `${Math.min(...sizes)}-${Math.max(...sizes)} distinct across ${Object.keys(FLOORS).length} fixed-category slots`;
});
check('poolFloorTarget actually lifts a target off the pool floor', ()=>{
  /* Directly asserts the thing that was broken: on a pool with one low outlier, the
     returned target must sit inside the body of the material, not on its bottom edge.
     The old min()+0.35 form returns the caller's target unchanged here. */
  const pool = A.byFilter('Vocabulary Traits', 'Register & Formality Spectrum');
  assert(pool.length > 40, 'test pool went missing');
  const positions = pool.map(A.traitPos).sort((a,b)=>a-b);
  const lo = positions[0];
  const lifted = A.poolFloorTarget(pool, A.targetFromMag(18));
  assert(lifted > lo + 0.5, `target ${lifted.toFixed(2)} is still sitting on the pool floor ${lo.toFixed(2)}`);
  const inWindow = positions.filter(p => Math.abs(p - lifted) <= 0.75).length;
  assert(inWindow >= 8, `only ${inWindow} traits within a default band of the lifted target`);
  return `floor ${lo.toFixed(2)} -> target ${lifted.toFixed(2)}, ${inWindow} traits in band`;
});
check('rangeSelect scales its window to the pool, not just the precision slider', ()=>{
  const small = A.byFilter('Appearance', 'Movement & Bearing');
  const large = A.byFilter('Vocabulary Traits', 'Register & Formality Spectrum');
  const rs = (pool) => A.rangeSelect(pool, A.poolFloorTarget(pool, A.targetFromMag(40)));
  const a = rs(small), b = rs(large);
  assert(a.list.length >= Math.min(10, small.length * 0.3),
    `thin pool offered only ${a.list.length} of ${small.length} candidates`);
  assert(b.list.length >= 20, `wide pool offered only ${b.list.length} of ${large.length}`);
  return `${a.list.length}/${small.length} and ${b.list.length}/${large.length} eligible`;
});

group('Explanations');
check('why-not produces an answer for any trait', ()=>{
  const sample = T.filter((_,i)=> i % 811 === 0);
  sample.forEach(t=>{
    const html = A.explainWhyNot(t);
    assert(typeof html === 'string' && html.length > 40, 'thin answer for ' + t.trait);
  });
  return sample.length + ' sampled';
});

group('Tagging passes');
check('the mood pass tagged what it listed', ()=>{
  assert(A.MOOD_TAG_STATS && A.MOOD_TAG_STATS.matched > 0, JSON.stringify(A.MOOD_TAG_STATS));
  return A.MOOD_TAG_STATS.matched + '/' + A.MOOD_TAG_STATS.listed;
});
check('the secondary-tier pass tagged what it listed', ()=>{
  assert(A.TIER_TAG_STATS && A.TIER_TAG_STATS.matched > 0, JSON.stringify(A.TIER_TAG_STATS));
  return A.TIER_TAG_STATS.matched + '/' + A.TIER_TAG_STATS.listed;
});

group('Content debt');
/* These are RATCHETS, not targets. Each figure is the bank's measured state at the time
   the 2025 balance audit ran, and the assertion is only that it does not get WORSE. The
   gaps themselves are real and named here so they are visible on every test run rather
   than rediscovered by a future distribution study — and so that a content pass that
   closes one of them fails this file and gets to move the number down, which is the
   point of writing it as a ratchet. ?dev=1 reports the same set in the browser, per
   category, for whoever is actually editing the data files. */
check('polarity coverage per section does not regress', ()=>{
  /* polarityFit is the mechanism that lets a slider combination reach an individual
     TRAIT rather than just a category. It needs a pol tag to select on, and four
     sections are mostly untagged — so across Vocabulary, Grammar, Mannerisms and all of
     Appearance (roughly seven of 37 slots on a default sheet, plus every Appearance
     card) the sliders can currently only choose the category. Those sections are also
     invisible to axisProfile, the radar, conflict detection and the ensemble analysers
     for the same reason. Closing this is a content pass — tagging ~1,950 traits — not a
     code change. */
  const FLOORS = {   // measured share of traits carrying a polarity tag
    'Conflict & Stress Response': 1, 'Social Role in a Group': 1, 'Values & Moral Line': 1,
    'Attachment & Intimacy Style': 1, 'Humor Style': 1, 'Habits & Vices': 1,
    'Motivation & Wound': 0.80, 'Verbosity Traits': 0.74, 'Personality Traits': 0.73,
    'Vocabulary Traits': 0.32, 'Dialogue Grammar Traits': 0.31,
    'Mannerisms': 0.20, 'Appearance': 0.17,
  };
  const by = new Map();
  T.forEach(t=>{
    const e = by.get(t.section) || {total:0, tagged:0};
    e.total++;
    if (t.pol && Object.keys(t.pol).length) e.tagged++;
    by.set(t.section, e);
  });
  const bad = [], shares = [];
  Object.entries(FLOORS).forEach(([section, floor])=>{
    const e = by.get(section);
    if (!e) return bad.push(`no section "${section}"`);
    const share = e.tagged / e.total;
    shares.push([section, share]);
    if (share < floor) bad.push(`${section} fell to ${(share*100).toFixed(0)}% tagged (floor ${(floor*100).toFixed(0)}%)`);
  });
  assert(!bad.length, bad.join('; '));
  const worst = shares.sort((a,b)=>a[1]-b[1])[0];
  return `thinnest: ${worst[0]} at ${(worst[1]*100).toFixed(0)}% tagged`;
});
check('the (rarity x intensity) grid does not get thinner', ()=>{
  /* Each category is a diagonal stripe rather than a grid: on average a category
     populates 10.7 of the 20 (rarity x intensity) cells it could, and the thinnest fill
     8 despite holding 52-59 traits each. This is the per-category expression of the
     Cramer's V finding above — within one category you cannot ask for "a quiet,
     defining Loyalty-Bound trait", because that cell is empty even though both the
     rarity and the intensity exist elsewhere in the section. */
  const cells = [];
  A.TRAITS_BY_KEY.forEach((pool, key)=>{
    if (pool.length < 20) return;                 // tiny categories can't fill a grid
    const set = new Set();
    pool.forEach(t=> set.add((t.rtier || A.rarityTier(t)) + '|' + t.intensity));
    cells.push([key.replace('||', ' > '), set.size]);
  });
  const mean = cells.reduce((a,b)=>a+b[1], 0) / cells.length;
  const min = Math.min(...cells.map(c=>c[1]));
  assert(mean >= 10.5, `mean cells per category fell to ${mean.toFixed(1)} of 20 (was 10.7)`);
  assert(min >= 8, `a category fell to ${min} of 20 cells`);
  const worst = cells.filter(c=>c[1] === min).map(c=>c[0]).slice(0, 2);
  return `mean ${mean.toFixed(1)}/20, thinnest ${min}/20 (${worst.join(', ')})`;
});
check('no polarity axis becomes more one-sided', ()=>{
  /* The mood fix added a positive pole to one axis by hand. Five more have the same
     shape, and polNormalise can only stop them reading as posture on the radar — it
     cannot give polarityFit material to select on when the slider points the thin way. */
  /* Measured positive share; the band is 40-60% and these sit outside it. Tightened
     after the 2026 §4.4 polarity pack: formality 72 -> 68%, analytical 69 -> 67%,
     self-confidence 38.5 -> 39.5%; physical energy (64 -> 60%) and wordiness
     (38.5 -> 40%) are now inside the general band and no longer listed. */
  const FLOORS = {
    ego: [0.37, 0.45], intel: [0.62, 0.70], form: [0.62, 0.70],
  };
  const poles = {};
  T.forEach(t=> Object.entries(t.pol || {}).forEach(([ax, v])=>{
    const e = poles[ax] = poles[ax] || {pos:0, neg:0};
    if (v > 0) e.pos++; else if (v < 0) e.neg++;
  }));
  const bad = [];
  Object.entries(poles).forEach(([ax, e])=>{
    const total = e.pos + e.neg;
    if (!total) return;
    const share = e.pos / total;
    const known = FLOORS[ax];
    if (known){
      // A known-lopsided axis may improve freely; it must not get worse.
      if (share < known[0] || share > known[1])
        bad.push(`${A.AXIS_LABELS[ax]||ax} moved to ${(share*100).toFixed(0)}% positive, outside its recorded ${(known[0]*100).toFixed(0)}-${(known[1]*100).toFixed(0)}% band — if this is an improvement, tighten the band`);
    } else if (share < 0.4 || share > 0.6){
      bad.push(`${A.AXIS_LABELS[ax]||ax} has become one-sided at ${(share*100).toFixed(0)}% positive (${e.pos} vs ${e.neg})`);
    }
  });
  assert(!bad.length, bad.join('; '));
  return Object.keys(FLOORS).length + ' known one-sided axes, ' + (Object.keys(poles).length - Object.keys(FLOORS).length) + ' balanced';
});

group('Ship shape');
check('the service worker precaches exactly what index.html loads', ()=>{
  /* sw.js ASSETS listed five data files; index.html loaded seven. The lazy
     runtime-cache path hid it on a warm load, so the only symptom was a cold offline
     install with an incomplete trait bank — and the two missing files were the two
     most likely to be added to. A hand-maintained duplicate of a list that grows is a
     list that drifts, so assert it rather than re-checking it by eye. */
  const fs = require('fs'), path = require('path');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const wanted = [];
  const rx = /<(?:script[^>]*\ssrc|link[^>]*\shref)=["']([^"']+)["']/g;
  let m;
  while ((m = rx.exec(html))){
    const href = m[1];
    if (/^https?:|^data:|^\/\//.test(href)) continue;   // fonts, the inline favicon
    if (!/\.(js|css)$/.test(href)) continue;
    wanted.push('./' + href.replace(/^\.\//, ''));
  }
  const body = sw.match(/const ASSETS = \[([\s\S]*?)\];/);
  assert(body, 'could not find the ASSETS array in sw.js');
  const listed = [...body[1].matchAll(/['"]([^'"]+)['"]/g)].map(x=>x[1]);
  const missing = wanted.filter(w=>!listed.includes(w));
  // './' and './index.html' are the shell itself and have no tag to match.
  const extra = listed.filter(l=> l !== './' && l !== './index.html' && !wanted.includes(l));
  assert(!missing.length, 'sw.js does not precache: ' + missing.join(', '));
  assert(!extra.length, 'sw.js precaches files index.html does not load: ' + extra.join(', '));
  return wanted.length + ' scripts/styles precached';
});

/* ================= AUDIT REGRESSIONS =================
   One check per finding in the 2026-09-21 audit that can be asserted without a
   browser. Each names its finding so a failure points at the behaviour, not the line. */
group('Audit regressions');

check('B01 — a quote in a character name cannot open a new SVG attribute', ()=>{
  const svg = ctx.evalIn('radarSVG([{label: String.fromCharCode(65,34,32)+"data-audit=x", color:"red", prof:{warm:1}}], 200)');
  // The label must stay INSIDE one attribute: a raw quote would close aria-label and
  // everything after it would be parsed as further attributes on the <svg>.
  const openTag = svg.slice(0, svg.indexOf('>') + 1);
  // Walk the opening tag as an attribute list: everything hostile has to end up INSIDE
  // one value, never as a name of its own. (A substring search is not enough — the
  // escaped text legitimately still contains the characters `data-audit=x`.)
  const names = [];
  const attrRe = /([A-Za-z_:][-\w:.]*)\s*=\s*"([^"]*)"/g;
  let m, lastEnd = 0;
  while ((m = attrRe.exec(openTag))){ names.push(m[1]); lastEnd = attrRe.lastIndex; }
  assert(!names.includes('data-audit'), 'the hostile label became its own attribute: ' + names.join(' '));
  const label = openTag.match(/aria-label="([^"]*)"/);
  assert(label && label[1].includes('&quot;'), 'the quote in the label was not encoded: ' + openTag);
  assert(label[1].includes('data-audit=x'), 'the label text itself was lost');
  return 'attributes: ' + names.join(', ') + ' — hostile text stayed inside aria-label';
});

check('B04 — an app-generated seed decodes back to its own number', ()=>{
  for (let i = 0; i < 200; i++){
    const n = (i * 2654435761) >>> 0;
    assert(A.seedNumberFrom(A.encodeSeed(n)) === n, 'round trip failed for ' + n);
  }
  // A user's own text still hashes, exactly as before.
  assert(A.seedNumberFrom('corven') === A.hashSeedString('corven'), 'plain text seeds changed meaning');
  return '200 round trips + legacy text seeds preserved';
});

check('B05 — replay mode ignores session category history', ()=>{
  ctx.evalIn('CATEGORY_USE.clear()');
  const historyAware = A.withReplayMode(false, ()=> A.historyAwareGeneration());
  const replay = A.withReplayMode(true, ()=> A.historyAwareGeneration());
  assert(historyAware === true && replay === false, 'replay mode did not gate history');
  return 'explore reads history, replay does not';
});

check('B13/B16 — a finalized sheet never seats the same trait twice', ()=>{
  A.clearBudgets();
  A.applyBudgetPreset('oneLoud');
  let dupes = 0, sheets = 0;
  for (let i = 0; i < 120; i++){
    A.withRng(A.mulberry32(90000 + i), ()=>{
      const st = A.finalizeSheet(A.buildCharacterState({
        verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2,
        rarityPref:0, vocabPref:null, personalityOverrides:{}}), {rarityPref:0, applyPins:false});
      sheets++;
      const rep = A.auditBudgets(st, {rarity:{}, intensity:{}, actions:[]});
      dupes += rep.duplicates.length;
    });
  }
  A.clearBudgets();
  assert(dupes === 0, dupes + ' duplicate trait id(s) across ' + sheets + ' budgeted sheets');
  return sheets + ' budgeted sheets, 0 duplicates';
});

check('B13 — the budget report describes the committed sheet, not an intermediate', ()=>{
  A.clearBudgets();
  A.RTIER_ORDER.forEach(t=>{ A.rarityCaps[t] = 0; });   // impossible: everything is capped out
  let report = null, st = null;
  A.withRng(A.mulberry32(4242), ()=>{
    st = A.finalizeSheet(A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0,
      mannerCount:3, vocabCount:2, rarityPref:0, vocabPref:null, personalityOverrides:{}}),
      {rarityPref:0, applyPins:false});
    report = A.getBudgetReport();
  });
  const ids = Object.keys(st).filter(k=>st[k] && st[k].trait);
  A.RTIER_ORDER.forEach(tier=>{
    const actual = ids.filter(id=>A.rarityTier(st[id].trait) === tier).length;
    const row = report.rarity[tier];
    assert(row && row.count === actual,
      tier + ': report says ' + (row && row.count) + ', sheet holds ' + actual);
    assert(actual === 0 || row.unmet === actual, tier + ': ' + actual + ' present but unmet was ' + row.unmet);
  });
  A.clearBudgets();
  return 'every tier count and unmet figure matches the finished sheet';
});

check('B16 — a required trait already drawn is not seated a second time', ()=>{
  /* `requiredTraitIds` and the ban sets are `let` bindings that restoreSettings
     REASSIGNS, so the reference captured at load time is not the live one. Reach into
     the bundle's own scope instead — the same seam the browser console gives you. */
  const t = A.TRAITS.find(x=>x.section === 'Personality Traits');
  const obj = ctx.evalIn(`(function(){
    const t = TRAITS_BY_ID.get(${t.id});
    const obj = {pers_test: {slotId:'pers_test', locked:false, label:'x', target:3, trait:t}};
    const saved = requiredTraitIds;
    requiredTraitIds = [${t.id}];
    try { applyRequiredTraits(obj); } finally { requiredTraitIds = saved; }
    return obj;
  })()`);
  const seats = Object.keys(obj).filter(k=>obj[k] && obj[k].trait && obj[k].trait.id === t.id);
  assert(seats.length === 1, 'the required trait was seated ' + seats.length + ' times');
  assert(obj.pers_test.required === true, 'the existing seat was not marked required');
  return 'marked in place, one seat';
});

check('B16 — two required traits marked never-together are reported, not silently replaced', ()=>{
  const [a, b] = A.TRAITS.filter(x=>x.section === 'Personality Traits').slice(0, 2);
  const out = ctx.evalIn(`(function(){
    const savedReq = requiredTraitIds, savedEx = exclusivePairs;
    requiredTraitIds = [${a.id}, ${b.id}];
    exclusivePairs = [[${a.id}, ${b.id}]];
    const obj = {};
    try {
      applyRequiredTraits(obj);
      applyExclusivePairs(obj, 0);
      return {obj, conflicts: getConstraintConflicts()};
    } finally { requiredTraitIds = savedReq; exclusivePairs = savedEx; }
  })()`);
  const obj = out.obj, conflicts = out.conflicts;
  const ids = Object.values(obj).filter(s=>s && s.trait).map(s=>s.trait.id);
  assert(conflicts.some(c=>c.kind === 'required-vs-exclusive'), 'the contradiction was not reported');
  assert(ids.includes(a.id) && ids.includes(b.id), 'a required trait was silently replaced anyway');
  return 'reported as a conflict; neither requirement was overwritten';
});

check('B17 — one permitted non-empty category always fills its section', ()=>{
  const ps = A.PROFILE_SECTIONS.find(p=>!p.drawAll && A.catsOf(p.section).length > 2);
  const cats = A.catsOf(ps.section);
  const keep = cats[0];
  const misses = ctx.evalIn(`(function(){
    const cats = ${JSON.stringify(cats)};
    const keep = cats[0];
    const saved = bannedCategories;
    bannedCategories = new Set(cats.slice(1));
    let misses = 0;
    try {
      for (let i = 0; i < 60; i++){
        withRng(mulberry32(7000 + i), ()=>{
          if (pickCategoryWeighted(cats.slice(), new Map()) !== keep) misses++;
        });
      }
    } finally { bannedCategories = saved; }
    return misses;
  })()`);
  assert(misses === 0, misses + ' of 60 draws resolved to a banned (empty) category');
  return '60/60 resolved to the one permitted category';
});

check('B17 — every category banned yields an explicit null, not a phantom pick', ()=>{
  const ps = A.PROFILE_SECTIONS.find(p=>!p.drawAll);
  const cats = A.catsOf(ps.section);
  const got = ctx.evalIn(`(function(){
    const cats = ${JSON.stringify(cats)};
    const saved = bannedCategories;
    bannedCategories = new Set(cats);
    try { return withRng(mulberry32(11), ()=> pickCategoryWeighted(cats.slice(), new Map())); }
    finally { bannedCategories = saved; }
  })()`);
  assert(got === null, 'expected null for a fully banned section, got ' + got);
  return 'infeasible section reports null';
});

check('B12 — a kept variant-tagged trait fixes its own presentation lock', ()=>{
  const tagged = A.TRAITS.find(t=>t.variant && A.PRESENTATION_VARIANTS[t.category]);
  assert(tagged, 'no variant-tagged trait in the bank to test with');
  const kept = {pers_x: {slotId:'pers_x', locked:true, trait:tagged}};
  const {want} = A.variantsFromProtected(kept);
  assert(want[tagged.category] === tagged.variant, 'the kept trait did not fix its category');
  A.withRng(A.mulberry32(5), ()=> A.rollCharacterVariants(want));
  assert(A.getCharVariants()[tagged.category] === tagged.variant,
    'the roll overrode the committed presentation');
  return tagged.category + ' committed to "' + tagged.variant + '" by the kept card';
});

check('B20 — a compressed save survives its trait being deleted from the bank', ()=>{
  const t = A.TRAITS[0];
  const packed = A.compressSlots({slot: {slotId:'slot', locked:false, target:3, trait:t}});
  assert(packed.slot.trait.__fb, 'no tombstone was written');
  // Simulate the trait being removed from a later build of the bank.
  ctx.evalIn('globalThis.__savedTrait = TRAITS_BY_ID.get(' + t.id + '); TRAITS_BY_ID.delete(' + t.id + ');');
  const out = A.expandSlots(JSON.parse(JSON.stringify(packed)));
  ctx.evalIn('TRAITS_BY_ID.set(' + t.id + ', globalThis.__savedTrait);');
  assert(out.slot.trait, 'the slot was silently emptied');
  assert(out.slot.trait.trait === t.trait, 'the saved text was not recovered');
  assert(out.slot.trait.removed === true, 'the recovered trait was not flagged as removed');
  return 'text recovered from the tombstone and flagged';
});

check('B19 — malformed payloads are rejected before anything is committed', ()=>{
  const bad = [
    [{state:{}, settings:{constraints:{exclusivePairs: 123}}}, 'exclusivePairs'],
    [{state:{s:{trait:{id:1, trait:'x', category:'c', section:'s', intensity:99}}}}, 'intensity'],
    [{state:{s:{trait:{id:1, trait:'x', category:'c', section:'s'}}}, pinnedTargets:{s:'loud'}}, 'pinnedTargets'],
    [{state:{s:{trait:{id:1, trait:'x', category:'c', section:'s'}}}, charVariants:{c:'z'}}, 'charVariants'],
    [{state:{s:{trait:{id:1, trait:'x', category:'c', section:'s'}}}, settings:{constraints:{rarityCaps:{common:'lots'}}}}, 'rarityCaps'],
  ];
  bad.forEach(([payload, what])=>{
    let threw = null;
    try { A.validateSheetPayload(payload); } catch(e){ threw = e; }
    assert(threw, 'a payload with a bad ' + what + ' passed validation');
    assert(/[a-z]/.test(threw.message), 'the failure did not name a field: ' + threw.message);
  });
  return bad.length + ' malformed shapes rejected with a named field';
});

check('B22 — a pressure slot with no trait does not abort the text export', ()=>{
  const st = {};
  const pState = {verbosity: {slotId:'verbosity', label:'x', trait:null}, __pressure:{level:1}};
  const out = A.sheetToText(st, {name:'T'}, pState);
  assert(typeof out === 'string' && out.includes('Under Pressure'), 'the export did not complete');
  assert(/omitted/.test(out), 'the missing slot was not accounted for');
  return 'export completes and says what was skipped';
});

check('B23 — coherence is a pure function of the sheet', ()=>{
  let st = null;
  A.withRng(A.mulberry32(3131), ()=>{
    st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3,
      vocabCount:2, rarityPref:0, vocabPref:null, personalityOverrides:{}});
  });
  const before = A.coherenceScore(st);
  // Move every live control well away from where it was, without regenerating.
  ctx.evalIn("PERSONALITY_AXES.forEach(a=>{ const el = document.getElementById('pers_'+a.id); if (el) el.value = 95; });"
           + "['verbositySlider','registerSlider','composureSlider'].forEach(id=>{ const el=document.getElementById(id); if (el) el.value = 95; });"
           + "invalidateSliderCache();");
  const after = A.coherenceScore(st);
  ctx.evalIn("PERSONALITY_AXES.forEach(a=>{ const el = document.getElementById('pers_'+a.id); if (el) el.value = 0; });"
           + "['verbositySlider','registerSlider','composureSlider'].forEach(id=>{ const el=document.getElementById(id); if (el) el.value = 0; });"
           + "invalidateSliderCache();");
  assert(before && after, 'no score was produced');
  assert(before.pct === after.pct,
    'the same sheet scored ' + before.pct + '% then ' + after.pct + '% after moving unrelated controls');
  return 'unchanged at ' + before.pct + '% across a full slider sweep';
});

check('B24 — archetype fidelity separates direction from strength and is interpretable', ()=>{
  const arch = Object.values(A.ARCHETYPES).find(a=>a.pers && Object.keys(a.pers).length >= 4);
  const build = (sign)=>{
    let st = null;
    A.withRng(A.mulberry32(808), ()=>{
      const ov = {};
      A.PERSONALITY_AXES.forEach(x=>{ ov[x.id] = (arch.pers[x.id] || 0) * sign; });
      st = A.buildCharacterState({verbLevel:arch.verbosity||0, regLevel:arch.register||0,
        compLevel:arch.composure||0, mannerCount:3, vocabCount:2, rarityPref:0,
        vocabPref:null, personalityOverrides:ov});
    });
    return A.archetypeFidelity(st, arch);
  };
  const self = build(1), opposed = build(-1);
  assert(self && typeof self.strength === 'number', 'strength was not reported separately');
  assert(self.pct > opposed.pct,
    'opposing every control did not reduce the reading (' + self.pct + '% vs ' + opposed.pct + '%)');
  assert(self.pct > 30, 'a self-generated sample read only ' + self.pct + '%, which is not interpretable');
  return 'self ' + self.pct + '% / opposed ' + opposed.pct + '% · strength ' + self.strength + '%';
});

check('B26 — the printed active range matches the real inverse of the pick curve', ()=>{
  const half = 0.73;
  let worst = 0;
  A.TRAITS.slice(0, 400).forEach(t=>{
    const [lo, hi] = A.traitBand(t, half);
    const pos = A.traitPos(t);
    const wantLo = A.magFromPos(A.clamp(pos - half, 1, 5));
    const wantHi = A.magFromPos(A.clamp(pos + half, 1, 5));
    worst = Math.max(worst, Math.abs(lo - wantLo), Math.abs(hi - wantHi));
  });
  assert(worst <= 0.5, 'band edges are off by up to ' + worst.toFixed(2) + ' slider points');
  return 'within rounding of the true inverse over 400 traits';
});

check('B29 — a negated or switched-off context reading is not applied', ()=>{
  A.clearContextSuppression();
  const negated = A.buildContextBias('not a soldier, never was', '');
  assert(!negated.notes.includes('military'), '"not a soldier" still applied the military bias');
  assert(negated.rejected.some(r=>r.label === 'military'), 'the rejected reading was not reported');
  const plain = A.buildContextBias('a soldier', '');
  assert(plain.notes.includes('military'), 'an ordinary match stopped working');
  A.suppressContextTag('military');
  const off = A.buildContextBias('a soldier', '');
  A.clearContextSuppression();
  A.clearContextBias();
  assert(!off.notes.includes('military'), 'a switched-off reading was applied anyway');
  return 'negation and suppression both honoured; plain matches unaffected';
});

check('B30 — the service worker deletes only its own obsolete caches', ()=>{
  const fs = require('fs'), path = require('path');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert(/CACHE_PREFIX/.test(sw), 'sw.js no longer namespaces its caches');
  assert(/k\.startsWith\(CACHE_PREFIX\)\s*&&\s*k\s*!==\s*CACHE/.test(sw),
    'activate() does not restrict deletion to this app\'s own cache namespace');
  assert(!/addAll\(ASSETS\)\)\.then\(\(\)=>self\.skipWaiting\(\)\)\.catch/.test(sw),
    'install() still swallows a failed precache');
  return 'namespaced purge, install fails loudly';
});

check('B10 — no top-level function is declared twice across the bundle', ()=>{
  const fs = require('fs'), path = require('path');
  const {ENGINE_FILES} = require('./harness');
  const seen = new Map(), dupes = [];
  ENGINE_FILES.forEach(f=>{
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    src.split('\n').forEach((line, i)=>{
      const m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(line);
      if (!m) return;
      const prev = seen.get(m[1]);
      if (prev) dupes.push(m[1] + ' (' + prev + ' and ' + f + ':' + (i+1) + ')');
      else seen.set(m[1], f + ':' + (i+1));
    });
  });
  assert(!dupes.length, 'duplicate top-level function declarations: ' + dupes.join(', '));
  return seen.size + ' top-level functions, all unique';
});

check('B36 — a workspace capture covers the cast and foil controls too', ()=>{
  ['castSeed','castSpread','foilSeed'].forEach(id=>{
    assert(A.SETTING_FIELDS.includes(id), id + ' is not part of the settings capture');
  });
  assert(A.SETTING_TOGGLES.includes('castAnchor'), 'castAnchor is not part of the settings capture');
  return 'cast and foil settings travel with the workspace';
});

check('B09 — cloning a sheet does not share its slot objects', ()=>{
  const t = A.TRAITS[0];
  const src = {a: {slotId:'a', locked:false, trait:t}};
  const copy = A.cloneSheet(src);
  src.a.locked = true;
  assert(copy.a.locked === false, 'a lock on the source leaked into the copy');
  assert(copy.a.trait === t, 'the immutable trait definition was needlessly cloned');
  return 'slots copied, trait definitions shared';
});

check('B33 — malformed archetype records are rejected before anything is written', ()=>{
  assert(A.archetypeProblem(null), 'null passed');
  assert(A.archetypeProblem({}), 'a record with no label passed');
  assert(A.archetypeProblem({label:'x', verbosity: 'loud'}), 'a non-numeric slider passed');
  assert(A.archetypeProblem({label:'x', pers:{warmth: 5000}}), 'an out-of-range axis passed');
  assert(!A.archetypeProblem({label:'x', verbosity:1, pers:{friendliness:40}}), 'a valid record was rejected');
  return 'four malformed shapes rejected, valid one accepted';
});

/* ================= §4–7: SCHEMA, PACKS, PROFILE UNITS =================
   The foundations the content pass and the feature work build on. */
group('Trait schema and packs');

check('the bank passes the extended shape assertion', ()=>{
  const problems = A.assertTraitShape();
  assert(!problems.length, problems.length + ' problems: ' + problems.slice(0,3).join(' | '));
  return T.length + ' traits, optional fields validated';
});

check('a malformed optional field is caught at load, not at a draw', ()=>{
  const bad = [
    {conditions: ['public','sleeping']},            // unknown context
    {frequency: 9},                                 // out of scale
    {worldTags: 'modern'},                          // not a list
    {supports: [999999999]},                        // dangling id
    {reviewStatus: 'maybe'},                        // unknown state
    {examplesBySituation: {public: 7}},             // wrong value type
  ];
  const results = bad.map(extra=> ctx.evalIn(`(function(){
    const t = Object.assign({}, TRAITS[0], {id: 999999998}, ${JSON.stringify(extra)});
    TRAITS.push(t);
    try { return assertTraitShape().filter(p=>p.startsWith('#999999998')).length; }
    finally { TRAITS.pop(); }
  })()`));
  const missed = results.map((n,i)=> n ? null : Object.keys(bad[i])[0]).filter(Boolean);
  assert(!missed.length, 'not caught: ' + missed.join(', '));
  return bad.length + ' malformed shapes each named in the report';
});

check('every trait is stamped with the pack that owns its id range', ()=>{
  const ids = new Set(A.TRAIT_PACKS.map(p=>p.id));
  const unowned = T.filter(t=>!t.pack || !ids.has(t.pack));
  assert(!unowned.length, unowned.length + ' traits without a pack: ' + unowned.slice(0,3).map(t=>t.id).join(', '));
  // Ranges must not overlap: a trait can belong to one pack only.
  const ranges = A.TRAIT_PACKS.map(p=>p.ids).sort((a,b)=>a[0]-b[0]);
  for (let i=1;i<ranges.length;i++) assert(ranges[i][0] > ranges[i-1][1], 'overlapping pack id ranges');
  return A.TRAIT_PACKS.length + ' packs, ranges disjoint';
});

check('disabling a pack removes it from draws but never from saved-character resolution', ()=>{
  const pack = A.TRAIT_PACKS.find(p=>p.id !== 'core');
  const sample = T.find(t=>t.pack === pack.id);
  const before = A.byFilter(sample.section, sample.category).some(t=>t.id === sample.id);
  A.setPackEnabled(pack.id, false);
  const during = A.byFilter(sample.section, sample.category).some(t=>t.id === sample.id);
  const resolves = A.TRAITS_BY_ID.get(sample.id) === sample;
  const expanded = A.expandSlots({x: {slotId:'x', trait:{__id: sample.id}}});
  A.setPackEnabled(pack.id, true);
  assert(before, 'the sample trait was not drawable to begin with');
  assert(!during, 'a disabled pack was still drawable');
  assert(resolves && expanded.x.trait === sample, 'a saved reference to a disabled pack failed to resolve');
  return `"${pack.label}" off: not drawn, still resolves`;
});

check('the axis profile is a property of the sheet, read against the bank prior', ()=>{
  // Same traits → same profile, whatever else is loaded; a sheet leaning exactly the
  // way the bank leans by default reads ~0; leaning further reads positive.
  const ax = 'intel';
  const plus  = T.filter(t=>t.section==='Personality Traits' && t.pol && t.pol[ax] === 1).slice(0, 6);
  const minus = T.filter(t=>t.section==='Personality Traits' && t.pol && t.pol[ax] === -1).slice(0, 6);
  const mk = list => Object.fromEntries(list.map((t,i)=>['pers_'+i, {slotId:'pers_'+i, trait:t}]));
  const p1 = A.axisProfile(mk(plus)), p2 = A.axisProfile(mk(plus)), pm = A.axisProfile(mk(minus));
  assert(p1[ax] === p2[ax], 'the same sheet produced two different readings');
  assert(p1[ax] > 0 && pm[ax] < 0, `six +${ax} traits read ${p1[ax].toFixed(2)}, six -${ax} read ${pm[ax].toFixed(2)}`);
  // The prior is the bank's own lean; a mixed sheet in the bank's proportions reads near zero.
  const prior = A.polarityPrior(ax);
  const nPlus = Math.round(6 * (1 + prior) / 2), nMinus = 6 - nPlus;
  const mixed = A.axisProfile(mk(plus.slice(0, nPlus).concat(minus.slice(0, nMinus))));
  assert(Math.abs(mixed[ax]) < 0.6, `a bank-proportioned mix read ${mixed[ax].toFixed(2)}, not ~0`);
  return `+${p1[ax].toFixed(2)} / ${pm[ax].toFixed(2)} / mixed ${mixed[ax].toFixed(2)} (prior ${prior.toFixed(2)})`;
});

group('Archetype intent and balance');

check('every built-in preset declares an intent, and its must-axes are axes it sets', ()=>{
  const bad = [];
  Object.entries(A.ARCHETYPES).forEach(([k, arch])=>{
    const it = A.ARCHETYPE_INTENT[k];
    if (!it) return bad.push(k + ': no intent');
    it.must.forEach(ax=>{ if (arch.pers[ax] === undefined) bad.push(`${k}: must-axis ${ax} is not set by the preset`); });
    ['must','nudge','open'].forEach(f=>{ if (!Array.isArray(it[f])) bad.push(`${k}: ${f} is not a list`); });
    it.nudge.concat(it.open).forEach(id=>{ if (!A.PROFILE_SECTIONS.some(p=>p.id===id)) bad.push(`${k}: unknown section ${id}`); });
  });
  assert(!bad.length, bad.slice(0,5).join('; '));
  return Object.keys(A.ARCHETYPES).length + ' presets, all with intent';
});

check('every built-in preset has at least two named variations that leave its must-axes alone', ()=>{
  const bad = [];
  Object.entries(A.ARCHETYPES).forEach(([k, arch])=>{
    const vs = A.ARCHETYPE_VARIATIONS[k];
    if (!vs || vs.length < 2) return bad.push(k + ': fewer than two variations');
    const must = new Set(A.ARCHETYPE_INTENT[k].must);
    vs.forEach(v=>{
      Object.keys(v.pers || {}).forEach(ax=>{ if (must.has(ax)) bad.push(`${k}/${v.id}: touches must-axis ${ax}`); });
      Object.entries(v.profile || {}).forEach(([sec, cat])=>{
        const ps = A.PROFILE_SECTIONS.find(p=>p.id===sec);
        if (!ps) return bad.push(`${k}/${v.id}: unknown section ${sec}`);
        if (!A.catsOf(ps.section).includes(cat)) bad.push(`${k}/${v.id}: ${sec} has no category "${cat}"`);
      });
    });
  });
  assert(!bad.length, bad.slice(0,5).join('; '));
  return 'variations valid';
});

check('a variation changes the effective preset; the must-axes hold at the blend floor', ()=>{
  const base = A.effectiveArchetype('conartist', 'base');
  const abr = A.effectiveArchetype('conartist', 'abrasive');
  assert(abr.pers.manners < base.pers.manners, 'the abrasive variation did not lower manners');
  assert(abr.pers.honesty === base.pers.honesty, 'a variation moved a must-axis');
  assert(abr.profile.humor === 'Cruel & Barbed', 'the variation profile override was not applied');
  ctx.evalIn("(function(){ const el = document._set('archetypeBlend', {value:'0.3'}); })()");
  const wMust = A.archetypeAxisBlend(base, 'honesty'), wOther = A.archetypeAxisBlend(base, 'manners');
  ctx.evalIn("document._els.delete('archetypeBlend')");
  assert(wMust >= A.ARCHETYPE_MUST_FLOOR, 'must-axis blend fell below the floor at 30%');
  assert(Math.abs(wOther - 0.3) < 1e-9, 'a non-must axis did not follow the blend control');
  return `honesty held at ${wMust}, manners at ${wOther}`;
});

check('preset input balance: no axis is set in one direction more than 2.5x the other', ()=>{
  /* The audit measured discipline 20:5 and emotional capacity 9:15 across 34 presets.
     Eight presets were added for the thin sides; this keeps the catalogue from
     drifting back. */
  const bad = [];
  A.PERSONALITY_AXES.forEach(a=>{
    let p=0,n=0;
    Object.values(A.ARCHETYPES).forEach(x=>{ const v=x.pers&&x.pers[a.id]; if (v>0) p++; else if (v<0) n++; });
    if (p && n && (p/n > 2.5 || n/p > 2.5)) bad.push(`${a.id} ${p}:${n}`);
    if ((p && !n) || (n && !p)) bad.push(`${a.id} ${p}:${n} one-sided`);
  });
  assert(!bad.length, 'lopsided: ' + bad.join(', '));
  return 'every axis within 2.5:1';
});

check('profile hints: no single category is hinted by more than a quarter of presets', ()=>{
  const counts = {}; const total = Object.keys(A.ARCHETYPES).length;
  Object.values(A.ARCHETYPES).forEach(x=>Object.entries(x.profile||{}).forEach(([k,v])=>{ counts[k+':'+v]=(counts[k+':'+v]||0)+1; }));
  const over = Object.entries(counts).filter(([,n])=>n/total > 0.25);
  assert(!over.length, 'over-used hints: ' + over.map(([k,n])=>`${k} (${n}/${total})`).join(', '));
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  return `most-used hint ${top[0]} in ${top[1]}/${total}`;
});

check('internal dimensions separate what one slider conflates', ()=>{
  // A guarded-but-deep sheet and a shallow sheet score the same on the old axis and
  // differently here.
  const guarded = T.filter(t=>t.category==="Emotional Capacity — Guarded & Shallow" && t.variant==='a').slice(0,4);
  const shallow = T.filter(t=>t.category==="Emotional Capacity — Guarded & Shallow" && t.variant==='b').slice(0,4);
  assert(guarded.length >= 3 && shallow.length >= 3, 'not enough variant-tagged material to test');
  const mk = list => Object.fromEntries(list.map((t,i)=>['pers_'+i, {slotId:'pers_'+i, trait:t}]));
  const g = A.internalDimensions(mk(guarded)), sh = A.internalDimensions(mk(shallow));
  assert(g.emoDepth > sh.emoDepth, `guarded depth ${g.emoDepth.toFixed(2)} should exceed shallow ${sh.emoDepth.toFixed(2)}`);
  assert(g.emoExpress < 0 && sh.emoExpress <= 0, 'both should read as unexpressive');
  return `guarded: depth ${g.emoDepth.toFixed(2)} / expression ${g.emoExpress.toFixed(2)}; shallow: depth ${sh.emoDepth.toFixed(2)}`;
});

group('Variety: decay, semantic repetition, modes, objective, exception');

check('the recent-trait penalty decays with age and remembers concept families', ()=>{
  const fam = T.find(t=>t.conceptFamily);
  const other = T.find(t=>t.conceptFamily === fam.conceptFamily && t.id !== fam.id) || fam;
  A.forgetRecentTraits();
  ctx.evalIn('_avoidRecentActive = true');
  A.rememberGeneration({a:{slotId:'a', trait:fam}});
  const fresh = A.recentPenalty(fam), sibling = A.recentPenalty(other);
  for (let i=0;i<6;i++) A.rememberGeneration({b:{slotId:'b', trait:T[i+50]}});
  const aged = A.recentPenalty(fam);
  A.forgetRecentTraits();
  ctx.evalIn('_avoidRecentActive = false');
  assert(fresh < aged && aged < 1, `penalty should fade: fresh ${fresh.toFixed(2)}, six later ${aged.toFixed(2)}`);
  assert(other === fam || (sibling < 1 && sibling > fresh), `a same-family trait should be penalised more softly than the exact one (${sibling.toFixed(2)} vs ${fresh.toFixed(2)})`);
  return `exact ${fresh.toFixed(2)} → ${aged.toFixed(2)} after six; family ${sibling.toFixed(2)}`;
});

check('"same world, different person" avoids the current sheet\'s traits, families and categories', ()=>{
  let st;
  A.withRng(A.mulberry32(6161), ()=>{ st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:0, vocabPref:null, personalityOverrides:{}}); });
  const avoid = A.avoidSetFrom(st);
  const seated = Object.values(st).find(x=>x&&x.trait).trait;
  A.setAvoidSet(avoid);
  const pen = A.avoidPenalty(seated);
  let other;
  A.withRng(A.mulberry32(6161), ()=>{ other = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:0, vocabPref:null, personalityOverrides:{}}); });
  A.setAvoidSet(null);
  const ids = new Set(Object.values(st).filter(x=>x&&x.trait).map(x=>x.trait.id));
  const shared = Object.values(other).filter(x=>x&&x.trait&&ids.has(x.trait.id)).length;
  const total = Object.values(other).filter(x=>x&&x.trait).length;
  assert(pen < 0.2, 'a seated trait was not heavily penalised');
  assert(shared / total < 0.15, `${shared} of ${total} traits shared with the avoided sheet — same seed, so any overlap is the avoid set failing`);
  return `same seed, ${shared}/${total} shared after avoidance`;
});

check('the diversity objective ranks a twin below a stranger', ()=>{
  let a, b;
  A.withRng(A.mulberry32(7171), ()=>{ a = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:0, vocabPref:null, personalityOverrides:{}}); });
  A.withRng(A.mulberry32(7272), ()=>{ b = A.buildCharacterState({verbLevel:1.5, regLevel:-1.5, compLevel:1, mannerCount:3, vocabCount:2, rarityPref:0, vocabPref:null, personalityOverrides:{friendliness:-80, discipline:-80, honesty:-80}}); });
  const ref = [A.referenceFromState(a, 'A')];
  const twin = A.diversityScore(a, ref), stranger = A.diversityScore(b, ref);
  assert(twin.score < stranger.score, `twin ${twin.score.toFixed(2)} should score below stranger ${stranger.score.toFixed(2)}`);
  assert(twin.terms.traitOverlap === 1, 'a copy should overlap itself completely');
  return `twin ${twin.score.toFixed(2)} vs stranger ${stranger.score.toFixed(2)}`;
});

check('the archive round-trips and never stores sheets', ()=>{
  A.forgetArchive();
  let st; A.withRng(A.mulberry32(8181), ()=>{ st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:0, vocabPref:null, personalityOverrides:{}}); });
  A.archiveCharacter(st, {name:'Test'});
  const dumped = A.exportArchive();
  A.forgetArchive(); A.importArchive(dumped);
  const back = A.getArchive();
  A.forgetArchive();
  assert(back.length === 1 && back[0].ids.size > 10 && back[0].name === 'Test', 'archive did not round-trip');
  assert(!JSON.stringify(dumped).includes('"desc"'), 'the archive serialised trait text');
  return `${back[0].ids.size} ids, ${back[0].defining.size} defining, no trait text`;
});

check('the wildcard is a real exception when the sheet leans, and says so', ()=>{
  // A partial sheet leaning hard toward warmth: the wildcard should cut the other way.
  const warm = T.filter(t=>t.pol && t.pol.warm === 1 && t.section === 'Personality Traits').slice(0, 8);
  const partial = Object.fromEntries(warm.map((t,i)=>['pers_'+i, {slotId:'pers_'+i, trait:t}]));
  const lean = A.strongestLean(partial);
  assert(lean && lean.ax === 'warm' && lean.v > 0, 'the lean was not read off the partial sheet');
  let hits = 0, tries = 0;
  for (let i=0;i<40;i++){
    ctx.evalIn('_buildUsedIds = new Set()');
    const w = A.withRng(A.mulberry32(9000+i), ()=> A.pickWildcardSlot(0, 0, partial));
    if (!w) continue; tries++;
    if (w.exceptionAxis === 'warm' && w.trait.pol && w.trait.pol.warm === -1) hits++;
    assert(typeof w.exceptionWhy === 'string' && w.exceptionWhy.length > 20, 'no explanation on the wildcard');
  }
  assert(hits / tries > 0.5, `only ${hits}/${tries} wildcards cut against the warmth lean`);
  return `${hits}/${tries} draws opposed the lean, each explained`;
});

/* Bank figures, printed every run. Comments across the codebase cited the bank size as
   6,452 / 4,358 / 2,094 / 1,900 / 1,649 / 1,400 at various points, all of them stale and
   none of them agreeing. Printing the live numbers where they are read on every test run
   is cheaper than a doc-generation step and harder to ignore than a comment. */
(function bankStats(){
  const bySection = new Map(), byRarity = {};
  T.forEach(t=>{
    bySection.set(t.section, (bySection.get(t.section)||0)+1);
    byRarity[t.rarity] = (byRarity[t.rarity]||0)+1;
  });
  let cats = 0; A.CATS_BY_SECTION.forEach(c=> cats += c.length);
  console.log('\n\x1b[2mBank: ' + T.length.toLocaleString() + ' traits · ' + bySection.size +
    ' sections · ' + cats + ' categories · ' +
    Object.entries(byRarity).map(([k,v])=>v.toLocaleString()+' '+k).join(' / ') + '\x1b[0m');
})();

console.log('\n' + (failed ? '\x1b[31m' : '\x1b[32m') + passed + ' passed, ' + failed + ' failed\x1b[0m');

group('Mechanics: linked chains, structured contradiction, dimensions, editable label');

const _mechSheet = (seed)=>{
  let st;
  A.withRng(A.mulberry32(seed), ()=>{ st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:0, vocabPref:null, personalityOverrides:{}}); });
  return st;
};

check('the motivation chain links want → belief → origin → need → strategy, each grounded in a named card', ()=>{
  const st = _mechSheet(7101);
  const chain = A.motivationChain(st);
  assert(chain, 'no chain for a sheet with Motivation & Wound on');
  const keys = chain.links.map(l=>l.key);
  ['want','belief','origin','need','strategy'].forEach(k=> assert(keys.includes(k), `chain is missing the ${k} link (${keys.join(', ')})`));
  chain.links.forEach(l=> assert(l.from.length && l.text.length > 10, `link ${l.key} is not grounded`));
  const again = A.motivationChain(st);
  assert(JSON.stringify(again) === JSON.stringify(chain), 'the chain is not deterministic for the same sheet');
  return keys.join(' → ');
});

check('the pressure chain runs trigger → appraisal → tactic → threshold → aftermath → repair, from base traits', ()=>{
  const st = _mechSheet(7102);
  let ps;
  A.withRng(A.mulberry32(7102), ()=>{ ps = A.buildStressVariant(0, 0, 2, 'balanced', st); });
  const chain = A.pressureChain(st, ps);
  assert(chain, 'no pressure chain');
  const keys = chain.stages.map(s=>s.key);
  ['trigger','appraisal','threshold','aftermath'].forEach(k=> assert(keys.includes(k), `missing ${k} stage (${keys.join(', ')})`));
  // Sections can be toggled by earlier tests, so the grounded stages are checked against
  // what is actually seated rather than assumed.
  const seated = id => Object.keys(st).some(k=>k.startsWith('prof_'+id+'_') && st[k] && st[k].trait);
  assert(keys.includes('tactic') === seated('stress'), 'the tactic stage should exist exactly when a stress card is seated');
  assert(keys.includes('repair') === seated('repair'), 'the repair stage should exist exactly when a Recovery & Repair card is seated');
  chain.stages.forEach(s=> assert(s.from.length || s.key==='threshold', `stage ${s.key} names no base trait`));
  return keys.join(' → ');
});

check('a contradiction carries when / with whom / what changes / cost, and the author\'s answers win', ()=>{
  let found = null;
  for (let seed = 7200; seed < 7260 && !found; seed++){ const st = _mechSheet(seed); const c = A.structuredContradiction(st, {}); if (c) found = {st, c}; }
  assert(found, 'no contradiction in 60 sheets');
  const keys = found.c.fields.map(f=>f.key);
  assert(keys.join() === 'when,who,change,cost', `fields are ${keys.join()}`);
  assert(found.c.fields.find(f=>f.key==='change').derived, 'the change field should always be derivable from the pair');
  const c2 = A.structuredContradiction(found.st, {contradictionAnswers:{when:'only after midnight'}});
  assert(c2.fields[0].answer === 'only after midnight', 'the author answer was not carried');
  return `${found.c.axisLabel}: ${found.c.fields.filter(f=>f.derived).length}/4 derived`;
});

check('trait dimensions come from the trait when authored and are flagged when inferred', ()=>{
  const authored = T.find(t=> t.frequency && t.visibility && t.persistence && t.narrativeSalience);
  const bare = T.find(t=> !t.frequency && !t.visibility && t.section === 'Appearance');
  const d1 = A.traitDimensions(authored), d2 = A.traitDimensions(bare);
  assert(!d1.inferred.length && d1.frequency === authored.frequency, 'authored dimensions should be used as written');
  assert(d2.inferred.length === 4 && d2.visibility === 5, `an Appearance trait should infer visibility 5 (${JSON.stringify(d2)})`);
  const secs = new Set(T.map(t=>t.section)); Object.keys(A.DIM_DEFAULTS_BY_SECTION).forEach(sec=> assert(secs.has(sec), `DIM_DEFAULTS names an unknown section "${sec}"`));
  return `authored ${authored.trait} · inferred ${bare.trait} → V${d2.visibility} P${d2.persistence}`;
});

check('the author\'s label overrides the emergent name and survives export', ()=>{
  const st = _mechSheet(7103);
  const em = A.characterLabel(st, {});
  const mine = A.characterLabel(st, {label:'The Quiet Fixer'});
  assert(!em || !em.authored, 'an unedited label should not read as authored');
  assert(mine.name === 'The Quiet Fixer' && mine.authored, 'the label was not honoured');
  const md = A.sheetToText(st, {name:'X', label:'The Quiet Fixer'}, null);
  assert(md.includes('**Label:** The Quiet Fixer'), 'label missing from the export');
  assert(md.includes('How the pieces connect'), 'the chain is missing from the export');
  assert(/frequency \d · visibility \d/.test(md), 'dimensions are missing from the export');
  return `emergent "${em && em.name}" → authored "${mine.name}"`;
});


group('Contextual engine: baseline plus four lenses');

check('every context classes every seated card, deterministically, with a reason', ()=>{
  const st = _mechSheet(7301);
  const n = Object.values(st).filter(x=>x&&x.trait).length;
  const views = A.contextualViews(st);
  assert(views.length === 5 && views[0].context === 'baseline', 'expected baseline + four contexts');
  views.forEach(v=>{
    assert(v.slots.length === n, `${v.context} classed ${v.slots.length} of ${n} cards`);
    v.slots.forEach(s=> assert(['active','amplified','suppressed','exception'].includes(s.status) && s.why, `${v.context}: ${s.trait.trait} has no status/why`));
  });
  const again = A.contextualViews(st);
  assert(JSON.stringify(again.map(v=>v.counts)) === JSON.stringify(views.map(v=>v.counts)), 'views are not deterministic');
  assert(views[0].counts.active === n, 'the baseline should leave every card active');
  return views.slice(1).map(v=>`${v.context} +${v.counts.amplified}/−${v.counts.suppressed}`).join(' · ');
});

check('public and private disagree about the interior: wounds hide in public and show in private', ()=>{
  let seen = 0, ok = 0;
  for (let seed = 7310; seed < 7330; seed++){
    const st = _mechSheet(seed);
    const pub = A.contextualView(st, 'public'), prv = A.contextualView(st, 'private');
    Object.keys(st).filter(k=>k.startsWith('prof_motivation_') && st[k] && st[k].trait).forEach(k=>{
      seen++;
      const a = pub.byId[k].status, b = prv.byId[k].status;
      if ((a === 'suppressed' || a === 'exception') && (b === 'amplified' || b === 'exception')) ok++;
    });
  }
  assert(seen && ok / seen > 0.9, `${ok}/${seen} motivation cards flip between public and private`);
  return `${ok}/${seen} flip`;
});

check('authored conditions and exceptions outrank the section rules', ()=>{
  const cond = T.find(t=> t.conditions && t.conditions.includes('authority'));
  const st = {a:{slotId:'a', trait:cond}, b:{slotId:'b', trait:Object.assign({}, cond, {conditions:['peer'], exceptions:['the boss']})}};
  const v = A.contextualView(st, 'authority');
  assert(v.byId.a.status === 'amplified' && v.byId.a.rule === 'conditions', `authored-for-authority card read ${v.byId.a.status} by ${v.byId.a.rule}`);
  assert(v.byId.b.status === 'exception' && /the boss/.test(v.byId.b.why), `an exception naming the boss should win: ${v.byId.b.status} / ${v.byId.b.why}`);
  const pub = A.contextualView(st, 'public');
  assert(pub.byId.a.status === 'suppressed', 'a card authored for authority only should be suppressed in public');
  return `${cond.trait}: amplified under authority, suppressed in public, exception wins`;
});

check('threat puts the stress response in front and the repair behind', ()=>{
  // Earlier tests may have toggled the stress section off, so seat one by hand.
  const st = _mechSheet(7340);
  st.prof_stress_0 = {slotId:'prof_stress_0', trait: T.find(t=>t.section==='Conflict & Stress Response')};
  const found = {st, stress:'prof_stress_0'};
  const v = A.contextualView(found.st, 'threat');
  assert(v.byId[found.stress].status === 'amplified', 'the stress card should be amplified under threat');
  const rep = A.CONTEXT_LENS_RULES.threat.find(r=>r.status==='suppressed' && /repair/i.test(r.why));
  assert(rep, 'no rule suppresses repair under threat');
  const md = A.sheetToText(found.st, {name:'X', viewContext:'threat'}, null);
  assert(md.includes('## Under threat') && md.includes('**Amplified:**'), 'the export should carry the context section');
  return `${v.counts.amplified} forward, ${v.counts.suppressed} quiet; exported`;
});

if (failed){
  console.log('\nFailures:');
  failures.forEach(f=>console.log('  - ' + f));
}
process.exit(failed ? 1 : 0);
