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
  'RELATIONSHIP_ROLES','RELATIONSHIP_STATUS','relationshipRole','roleOverridesFor','edgeDefaults','makeEdge',
  'pruneEdges','validateEdge','edgesToMarkdown','castBundle','applyCastBundle','castEntry',
  'ARC_SHAPES','ARC_SHAPE_IDS','arcShape','makeArcEvent','validateArcEvent','proposeArcChanges',
  'applyArcEvent','replayArc','arcSummary','arcToMarkdown',
  'VOICE_PROMPTS','VOICE_PROMPT_IDS','VOICE_MODES','voiceRules','composeVoiceLine','voiceLab',
  'voiceComparison','voiceLabToMarkdown',
  'TRAIT_PACKS','setPackEnabled','isPackEnabled','getDisabledPacks','setDisabledPacks','packOfId',
  'makeProject','validateProject','projectSummary','makeBackupBundle','validateBackupBundle',
  'mergePreview','backupPreview','applyMerge','mergeSummaryLine','BACKUP_FORMAT','BACKUP_VERSION',
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
  // Every group must be reachable or the control is a dead end.
  assert(!empty.length, 'groups matching nothing: ' + empty.join(', '));
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
  const drawnByCategory = new Set(['Vocabulary Traits','Mannerisms','Dialogue Grammar Traits']);
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
  ['prof_role_0','register','verbosity','grammar']
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
  ['verbosity','register','grammar','prof_role_0']
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
   entry, and it was excluded from WILDCARD_SECTIONS and PRESSURE_SHIFT_SECTIONS. It had
   no outbound influence at all. */
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
  /* Motivation was added to this list after a 400-character audit found it among the
     most-repeated sections in the app — 23-38 distinct per slot with a top trait at 13%.
     The floors here are set below what the engine now achieves (44-68 over 200 builds),
     so content churn doesn't trip them and a structural regression does. */
  const FLOORS = {register: 40, verbosity: 30, pers_honesty: 20, pers_confidence: 20,
                  pers_curiosity: 20, pers_manners: 20, pers_activeness: 20,
                  prof_motivation_0: 40, prof_motivation_1: 35, prof_motivation_2: 32,
                  prof_motivation_3: 35, prof_motivation_4: 32, prof_motivation_5: 30,
                  prof_motivation_6: 32};
  const TOP_SHARE_LIMIT = {};
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
  // The smallest Mannerisms category stands in for "a thin pool".
  const small = A.CATS_BY_SECTION.get('Mannerisms').map(c => A.byFilter('Mannerisms', c))
    .filter(p => p.length >= 20).sort((a,b)=> a.length - b.length)[0];
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
     sections are mostly untagged — so across Vocabulary, Grammar and Mannerisms
     (roughly seven slots on a default sheet) the sliders can currently only choose the
     category. Those sections are also
     invisible to axisProfile, the radar, conflict detection and the ensemble analysers
     for the same reason. Closing this is a content pass — tagging ~1,950 traits — not a
     code change. */
  const FLOORS = {   // measured share of traits carrying a polarity tag
    'Conflict & Stress Response': 1, 'Social Role in a Group': 1, 'Values & Moral Line': 1,
    'Attachment & Intimacy Style': 1, 'Humor Style': 1, 'Habits & Vices': 1,
    'Motivation & Wound': 0.80, 'Verbosity Traits': 0.74, 'Personality Traits': 0.73,
    'Vocabulary Traits': 0.40, 'Dialogue Grammar Traits': 0.38,   // raised after the §6 keyword pol back-fill
    'Mannerisms': 0.30,
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
  /* 2026 audit §4 trait pass: formality (68 -> 59%) and analytical thinking (67 -> 60%)
     are now inside the general 40-60% band, so they are held to it like every other
     axis rather than to a recorded lopsided band. */
  /* Removing the Appearance section took out its disc- (unkempt) tags, which left
     discipline just over the band at ~60.2% positive. Recorded here so it can only
     improve, rather than widening the general band for every axis. */
  const FLOORS = {
    ego: [0.37, 0.45],
    disc: [0.56, 0.61],
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
  const bare = T.find(t=> !t.frequency && !t.visibility && t.section === 'Mannerisms');
  const d1 = A.traitDimensions(authored), d2 = A.traitDimensions(bare);
  assert(!d1.inferred.length && d1.frequency === authored.frequency, 'authored dimensions should be used as written');
  assert(d2.inferred.length === 4 && d2.visibility === 4, `a Mannerisms trait should infer visibility 4 (${JSON.stringify(d2)})`);
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


group('Relationship workspace: directed edges, roles, round-trip');

check('an edge starts populated from both sheets and says why', ()=>{
  const a = _mechSheet(7401), b = _mechSheet(7402);
  const d = A.edgeDefaults(a, b, 'mentor');
  assert(d.trust >= 1 && d.trust <= 5 && d.dependence >= 1 && d.dependence <= 5, 'trust/dependence out of range');
  assert(A.RELATIONSHIP_STATUS.includes(d.status), `status ${d.status}`);
  assert(typeof d.wants === 'string' && typeof d.conceals === 'string' && typeof d.knows === 'string', 'the text fields are missing');
  const e = A.makeEdge('x','y','mentor', d);
  assert(!A.validateEdge(e).length, 'a default edge should validate: ' + A.validateEdge(e).join('; '));
  const bad = A.validateEdge({from:'x', to:'y', trust:9, dependence:3, status:'sideways', role:'nope'});
  assert(bad.length >= 3, 'a malformed edge should be rejected field by field');
  return `${d.status}, trust ${d.trust}, dep ${d.dependence}${d.why.length ? ' — ' + d.why[0] : ''}`;
});

check('a role pushes the new member against the anchor on its opposed axes', ()=>{
  const anchor = {}; A.PERSONALITY_AXES.forEach(a=>{ anchor[a.id] = 70; });
  const rng = A.mulberry32(99);
  const role = A.relationshipRole('antagonist');
  const out = A.roleOverridesFor(anchor, 'antagonist', rng);
  role.oppose.forEach(ax=> assert(out[ax] <= -35, `${ax} should oppose the anchor, got ${out[ax]}`));
  role.align.forEach(ax=> assert(out[ax] === 70, `${ax} should copy the anchor, got ${out[ax]}`));
  A.PERSONALITY_AXES.forEach(a=> assert(out[a.id] >= -100 && out[a.id] <= 100, `${a.id} out of slider range`));
  return `${role.label}: opposes ${role.oppose.join(', ')}`;
});

check('edges survive a cast round-trip and dangling ones are dropped', ()=>{
  const m1 = A.castEntry(_mechSheet(7403), null, {name:'Ada'});
  const m2 = A.castEntry(_mechSheet(7404), null, {name:'Bo'});
  const edges = [A.makeEdge(m1.id, m2.id, 'rival', A.edgeDefaults(m1.state, m2.state, 'rival')),
                 A.makeEdge(m1.id, 'ghost', 'ally', {})];
  const kept = A.pruneEdges(edges, [m1, m2]);
  assert(kept.length === 1 && kept[0].to === m2.id, 'the edge naming a missing member should be dropped');
  const md = A.edgesToMarkdown(kept, [m1, m2]);
  assert(md.includes('Ada → Bo') && md.includes('Rival') && /trust \d\/5/.test(md), 'the markdown is missing the edge: ' + md);
  const bundle = {format:'character-voice-cast', version:1, members:[{id:m1.id, state:m1.state, meta:m1.meta},{id:m2.id, state:m2.state, meta:m2.meta}], edges: kept};
  const res = A.applyCastBundle(bundle);
  const live = ctx.evalIn('relationshipEdges.length'), names = ctx.evalIn('castStates.map(c=>c.meta.name).join(",")');
  assert(live === 1 && names === 'Ada,Bo', `round-trip gave ${names} with ${live} edge(s)`);
  assert(res.dropped === 0, 'nothing should be dropped on a clean bundle');
  return `1 of 2 edges kept, "${md.split('\n')[0].slice(0, 44)}…"`;
});


group('Arcs: proposed changes, acceptance, replay and undo');

check('an event proposes changes in its own direction, deterministically, and steadfast only hardens Values/Price', ()=>{
  const st = _mechSheet(7501);
  const grow = A.makeArcEvent(1, {title:'She told the truth', shape:'growth', cost:'Lost the job she had been protecting for nine years'});
  const c1 = A.proposeArcChanges(st, grow, []);
  const c2 = A.proposeArcChanges(st, grow, []);
  assert(c1.length, 'growth proposed nothing');
  assert(JSON.stringify(c1) === JSON.stringify(c2), 'the proposal is not deterministic in the event id');
  c1.forEach(c=> assert(c.why && c.accepted === false && c.fromId !== c.toId, 'a change must be explained and start unaccepted'));
  const still = A.proposeArcChanges(st, A.makeArcEvent(2, {shape:'steadfast', title:'He stayed'}), []);
  // Section 6: steadfast is no longer inert — it may deepen Values or move the Price,
  // but it never moves a personality card (they did not change; the line hardened).
  assert(still.every(c => /^prof_(values|goals)_/.test(c.slotId)), 'steadfast moved something other than Values/Price: ' + still.map(c=>c.slotId));
  const down = A.proposeArcChanges(st, A.makeArcEvent(3, {shape:'deterioration', title:'He drank instead'}), []);
  assert(down.length, 'deterioration proposed nothing');
  assert(JSON.stringify(down) !== JSON.stringify(c1), 'growth and deterioration should not propose the same thing');
  return `growth ${c1.length}, deterioration ${down.length}, steadfast ${still.length}`;
});

check('only accepted changes apply, and the source sheet is never mutated', ()=>{
  const st = _mechSheet(7502);
  const ev = A.makeArcEvent(1, {title:'The letter arrived', shape:'growth'});
  ev.changes = A.proposeArcChanges(st, ev, []);
  assert(ev.changes.length >= 1, 'no changes to test with');
  const before = JSON.stringify(st);
  const untouched = A.applyArcEvent(st, ev);
  assert(JSON.stringify(untouched) === before, 'nothing accepted, so nothing should change');
  ev.changes[0].accepted = true;
  const after = A.applyArcEvent(st, ev);
  assert(JSON.stringify(st) === before, 'applyArcEvent mutated the state it was given');
  assert(after[ev.changes[0].slotId].trait.id === ev.changes[0].toId, 'the accepted change did not apply');
  assert(after[ev.changes[0].slotId].arcEvent === ev.id, 'the changed slot should name the event that changed it');
  return `${ev.changes[0].slotId} applied on accept only`;
});

check('replaying the arc without an event reconstructs the character exactly', ()=>{
  const base = _mechSheet(7503);
  const evs = [];
  ['growth','deterioration','growth'].forEach((shape, i)=>{
    const st = A.replayArc(base, evs);
    const ev = A.makeArcEvent(i+1, {title:'Event '+(i+1), shape, cost:'It cost them more than they will admit to anyone'});
    ev.changes = A.proposeArcChanges(st, ev, evs);
    ev.changes.forEach(c=>{ c.accepted = true; });
    evs.push(ev);
  });
  const full = A.replayArc(base, evs);
  const withoutSecond = A.replayArc(base, evs.filter(e=>e.seq !== 2));
  const firstOnly = A.replayArc(base, evs.filter(e=>e.seq === 1));
  assert(JSON.stringify(full) !== JSON.stringify(base), 'three accepted events changed nothing');
  assert(JSON.stringify(withoutSecond) !== JSON.stringify(full), 'undoing an event changed nothing');
  assert(JSON.stringify(A.replayArc(base, evs)) === JSON.stringify(full), 'replay is not deterministic');
  // Dropping every event has to land exactly back on the sheet it started from.
  assert(JSON.stringify(A.replayArc(base, [])) === JSON.stringify(base), 'an empty arc is not the baseline');
  assert(JSON.stringify(firstOnly) !== JSON.stringify(base), 'the first event did nothing');
  const sum = A.arcSummary(evs);
  assert(sum.events === 3 && sum.changes >= 3 && sum.shape === 'growth', `summary reads ${JSON.stringify(sum.counts)}`);
  const md = A.arcToMarkdown(evs);
  assert(/### 1\. Event 1 — _Growth_/.test(md) && /\*\*Changed\*\*/.test(md), 'the arc markdown is wrong: ' + md.slice(0, 120));
  return sum.line;
});

check('a cyclical event puts an earlier accepted change back, and bad events are rejected', ()=>{
  const base = _mechSheet(7504);
  const first = A.makeArcEvent(1, {title:'He swore off it', shape:'growth'});
  first.changes = A.proposeArcChanges(base, first, []);
  assert(first.changes.length, 'nothing to cycle back from');
  first.changes.forEach(c=>{ c.accepted = true; });
  const after = A.applyArcEvent(base, first);
  const cyc = A.makeArcEvent(2, {title:'And then, in March', shape:'cyclical'});
  cyc.changes = A.proposeArcChanges(after, cyc, [first]);
  assert(cyc.changes.length, 'cyclical proposed nothing to revert');
  assert(cyc.changes.every(c=> first.changes.some(f=> f.slotId === c.slotId && f.fromId === c.toId)), 'a cyclical change should restore an earlier from-trait');
  cyc.changes.forEach(c=>{ c.accepted = true; });
  const backAgain = A.applyArcEvent(after, cyc);
  cyc.changes.forEach(c=> assert(backAgain[c.slotId].trait.id === c.toId, 'the revert did not apply'));
  assert(A.validateArcEvent({id:'x', seq:0, shape:'sideways', changes:'no'}).length >= 3, 'a malformed event should be rejected field by field');
  assert(!A.validateArcEvent(first).length, 'a real event should validate');
  return `${cyc.changes.length} change(s) put back`;
});


group('Voice lab: composed lines, named rules, pressure and cast comparison');

check('every prompt composes a line that names the rules that shaped it', ()=>{
  const st = _mechSheet(7601);
  const lines = A.voiceLab(st, 'baseline');
  assert(lines.length === A.VOICE_PROMPT_IDS.length, `${lines.length} lines for ${A.VOICE_PROMPT_IDS.length} prompts`);
  lines.forEach(l=>{
    assert(l.text && l.text.length > 2 && !/undefined/.test(l.text), `${l.promptId}: "${l.text}"`);
    assert(l.rules.length, `${l.promptId} names no rule`);
  });
  const again = A.voiceLab(st, 'baseline');
  assert(JSON.stringify(again) === JSON.stringify(lines), 'the lab is not deterministic for one sheet');
  const other = A.voiceLab(_mechSheet(7602), 'baseline');
  assert(other.some((l,i)=> l.text !== lines[i].text), 'two different characters produced identical lines');
  return lines[0].text.slice(0, 54) + '…';
});

check('the rules a line names are rules the sheet actually carries', ()=>{
  let sharp = null;
  for (let seed = 7610; seed < 7640 && !sharp; seed++){
    const st = _mechSheet(seed);
    const r = A.voiceRules(st);
    if (r.direct || r.yielding) sharp = {st, r};
  }
  assert(sharp, 'no sheet with an assertiveness lean in 30');
  const line = A.composeVoiceLine(sharp.st, 'refuse', 'baseline');
  const expect = sharp.r.direct ? /high assertiveness/ : /low assertiveness/;
  assert(line.rules.some(x=>expect.test(x)), `refusal cites ${line.rules.join('; ')} for a ${sharp.r.direct ? 'direct' : 'yielding'} sheet`);
  assert(A.composeVoiceLine(sharp.st, 'nope', 'baseline') === null, 'an unknown prompt should return null, not a line');
  return `${sharp.r.direct ? 'direct' : 'yielding'}: "${line.text.slice(0, 40)}…"`;
});

check('pressure drops the politeness layer and brings the stress response in', ()=>{
  // The stress section can be toggled off by an earlier test, so seat the card by hand
  // and search only for the opener lean.
  let found = null;
  for (let seed = 7650; seed < 7700 && !found; seed++){
    const st = _mechSheet(seed);
    st.prof_stress_0 = {slotId:'prof_stress_0', trait: T.find(t=>t.section==='Conflict & Stress Response')};
    const r = A.voiceRules(st);
    if (r.formal || r.casual || r.mannered) found = {st, r};
  }
  assert(found, 'no sheet with an opener rule in 50');
  const base = A.composeVoiceLine(found.st, 'refuse', 'baseline');
  const pres = A.composeVoiceLine(found.st, 'refuse', 'pressure');
  assert(pres.text !== base.text, 'pressure changed nothing');
  assert(!pres.rules.some(x=>/register|manners/.test(x)), `pressure kept the politeness rules: ${pres.rules.join('; ')}`);
  assert(pres.rules.some(x=>/stress response/.test(x)), `pressure did not bring the stress response: ${pres.rules.join('; ')}`);
  return `"${base.text.slice(0,30)}…" → "${pres.text.slice(0,30)}…"`;
});

check('the cast comparison marks devices more than one character reaches for', ()=>{
  const members = [7671, 7672, 7673].map((seed, i)=> ({state:_mechSheet(seed), meta:{name:'M'+(i+1)}}));
  const cmp = A.voiceComparison(members, 'apologise', 'baseline');
  assert(cmp.rows.length === 3, `${cmp.rows.length} rows`);
  cmp.rows.forEach(r=> r.shared.forEach(k=> assert(cmp.repeated.includes(k), `${r.name} marks "${k}" as shared but it is not in the repeated list`)));
  const counted = {};
  cmp.rows.forEach(r=> new Set(r.line.rules).forEach(k=>{ counted[k] = (counted[k]||0)+1; }));
  Object.keys(counted).forEach(k=>{
    if (counted[k] > 1) assert(cmp.repeated.includes(k), `"${k}" is used by ${counted[k]} members and was not marked`);
  });
  const twins = A.voiceComparison([members[0], {state:members[0].state, meta:{name:'Twin'}}], 'apologise', 'baseline');
  assert(twins.repeated.length, 'two identical sheets should share every device');
  const md = A.voiceLabToMarkdown(members[0].state, 'baseline');
  assert(/### Refusing/.test(md) && /- Rules: /.test(md), 'the markdown is missing its structure');
  return `${cmp.repeated.length} shared across 3; twins share ${twins.repeated.length}`;
});


group('Content studio: the pack system and the author tools');

check('the studio tool validates the live bank and reports every pack', ()=>{
  const {execFileSync} = require('child_process');
  const run = (...args) => execFileSync('node', [require('path').join(__dirname, '..', 'tools', 'studio.js'), ...args], {encoding:'utf8'});
  const v = run('validate');
  assert(/The bank validates\./.test(v), 'studio validate is not clean:\n' + v.split('\n').slice(0,8).join('\n'));
  const p = run('packs');
  A.TRAIT_PACKS.forEach(pk=> assert(p.includes(pk.id), `packs output is missing "${pk.id}"`));
  const n = run('nearest', 'apologises by leaving the room');
  assert(/Nearest existing content/.test(n) && /#\d+/.test(n), 'nearest found nothing');
  const c = run('coverage', '--n=3');
  assert(/empty cells/.test(c), 'coverage printed no heatmap');
  return `validate clean · ${A.TRAIT_PACKS.length} packs · nearest and coverage answer`;
});

check('disabling a pack removes exactly its traits from every draw, and core cannot go', ()=>{
  const pack = A.TRAIT_PACKS.find(p=>p.id === 'life');
  const before = A.byFilter('Recovery & Repair', 'Apology').length;
  assert(before, 'no Apology pool to test with');
  A.setPackEnabled('life', false);
  const during = A.byFilter('Recovery & Repair', 'Apology').length;
  const anyLife = A.TRAITS.filter(t=>t.pack === 'life' && A.isPackEnabled(t.pack)).length;
  A.setPackEnabled('life', true);
  const after = A.byFilter('Recovery & Repair', 'Apology').length;
  assert(during === 0 && anyLife === 0, `${during} traits survived disabling "${pack.id}"`);
  assert(after === before, `the pool did not come back: ${after} vs ${before}`);
  assert(A.getDisabledPacks().length === 0, 'the disabled set was not restored');
  A.TRAITS.forEach(t=> assert(t.pack, `#${t.id} belongs to no pack`));
  return `${before} Apology traits gone and back; every trait carries a pack`;
});

check('every trait id sits inside its pack manifest range', ()=>{
  const ranges = new Map(A.TRAIT_PACKS.map(p=>[p.id, p.ids]));
  let checked = 0;
  A.TRAITS.forEach(t=>{
    const r = ranges.get(t.pack);
    assert(r, `#${t.id} names pack "${t.pack}", which has no manifest`);
    assert(t.id >= r[0] && t.id <= r[1], `#${t.id} (${t.pack}) is outside ${r[0]}–${r[1]}`);
    checked++;
  });
  // Manifests must not overlap, or packOfId would be ambiguous.
  const sorted = A.TRAIT_PACKS.slice().sort((a,b)=>a.ids[0]-b.ids[0]);
  for (let i=1;i<sorted.length;i++) assert(sorted[i].ids[0] > sorted[i-1].ids[1], `${sorted[i].id} overlaps ${sorted[i-1].id}`);
  return `${checked.toLocaleString()} ids inside ${A.TRAIT_PACKS.length} non-overlapping ranges`;
});


group('Project library and backup bundle: merge preview before anything is written');

check('a project validates, and a malformed one is rejected field by field', ()=>{
  const p = A.makeProject('The Book');
  assert(!A.validateProject(p).length, 'a fresh project should validate: ' + A.validateProject(p).join('; '));
  assert(/0 characters/.test(A.projectSummary(p)), 'summary reads ' + A.projectSummary(p));
  const bad = A.validateProject({id:'', name:'', characters:'no', casts:[], edges:[{from:1}], events:[], archive:[], tags:[7]});
  assert(bad.length >= 4, 'a malformed project should collect several problems, got ' + bad.length);
  const withBadEdge = A.makeProject('X', {edges:[{from:'a', to:'b', trust:9, dependence:3, status:'sideways'}]});
  assert(A.validateProject(withBadEdge).some(x=>/edge 0/.test(x)), 'a bad edge inside a project should be caught');
  return `${bad.length} problems found in a broken project`;
});

check('a bundle round-trips and one from the future is refused', ()=>{
  const p = A.makeProject('Book One');
  const b = A.makeBackupBundle([p], [{name:'Ada', record:{state:{}, savedAt:'2026-01-01T00:00:00Z'}}]);
  assert(!A.validateBackupBundle(b).length, 'a fresh bundle should validate: ' + A.validateBackupBundle(b).join('; '));
  assert(b.format === A.BACKUP_FORMAT && b.version === A.BACKUP_VERSION, 'the bundle is not stamped');
  assert(A.validateBackupBundle({format:'something-else'}).length, 'a foreign file should be refused');
  assert(A.validateBackupBundle(Object.assign({}, b, {version: A.BACKUP_VERSION + 1})).some(x=>/newer/.test(x)), 'a future version should be refused');
  assert(A.validateBackupBundle(Object.assign({}, b, {characters:[{name:'x'}]})).length, 'a character with no record should be refused');
  return 'round-trips; foreign and future files refused';
});

check('the preview separates new, identical and would-overwrite, and names the last group', ()=>{
  const mine = [A.makeProject('Kept'), A.makeProject('Shared')];
  mine[1].updated = '2026-01-01T00:00:00Z';
  const theirs = [Object.assign({}, mine[1], {name:'Shared, edited', updated:'2026-06-01T00:00:00Z'}),
                  JSON.parse(JSON.stringify(mine[0])), A.makeProject('Brand new')];
  const pv = A.mergePreview(mine, theirs);
  assert(pv.same.length === 1, `${pv.same.length} identical`);
  assert(pv.add.length === 1 && pv.add[0].name === 'Brand new', 'the new project was not spotted');
  assert(pv.conflict.length === 1 && pv.conflict[0].newer === 'theirs', `conflict reads ${JSON.stringify(pv.conflict.map(c=>c.newer))}`);
  assert(pv.conflict[0].mine && pv.conflict[0].theirs, 'a conflict must carry both versions to choose between');
  return A.mergeSummaryLine({projects:pv, characters:{add:[],same:[],conflict:[]}});
});

check('nothing is overwritten unless it was chosen, and the choice is per entry', ()=>{
  const mine = [A.makeProject('A'), A.makeProject('B')];
  const theirs = [Object.assign({}, mine[0], {name:'A, theirs'}), Object.assign({}, mine[1], {name:'B, theirs'}), A.makeProject('C')];
  const pv = A.mergePreview(mine, theirs);
  assert(pv.conflict.length === 2, `${pv.conflict.length} conflicts`);
  const kept = A.applyMerge(mine, pv, {});
  assert(kept.length === 3 && kept.find(p=>p.id===mine[0].id).name === 'A', 'an unchosen conflict must keep the local copy');
  assert(kept.some(p=>p.name === 'C'), 'a brand new entry should arrive without being chosen');
  const one = A.applyMerge(mine, pv, {[pv.conflict[0].key]: 'theirs'});
  assert(one.find(p=>p.id===mine[0].id).name === 'A, theirs', 'the chosen conflict did not overwrite');
  assert(one.find(p=>p.id===mine[1].id).name === 'B', 'an unchosen conflict was overwritten anyway');
  assert(JSON.stringify(mine.map(p=>p.name)) === '["A","B"]', 'applyMerge mutated the list it was given');
  return `2 conflicts: one taken, one kept, 1 added`;
});


/* Audit fixes B1–B19 (engine/generate side). These run in their OWN engine instance
   with a stubbed DOM, because they drive full generations, batches and the named modes
   and must not leak state into the checks above. */
group('Audit fixes: seeds, pins, locks, requirements, budgets, modes');
const G = (function(){
  const g = loadEngine();
  const d = g.document;
  ['verbositySlider','registerSlider','composureSlider','mannerCount','vocabCount'].forEach(id=>d._set(id,{value:id.includes('Count')?'3':'0'}));
  g.api.PERSONALITY_AXES.forEach(a=>d._set('pers_'+a.id,{value:'0'}));
  g.api.PROFILE_SECTIONS.forEach(ps=>{
    d._set('sec_'+ps.id,{checked:true});
    d._set('pw_'+ps.id,{value:'',tagName:'SELECT',options:[{value:''}]});
    d._set('type_'+ps.id,{value:'',tagName:'SELECT',options:[{value:''}]});
  });
  d._set('seedInput',{value:''}); d._set('batchTray',{}); d._set('charName',{value:''});
  d._set('sheet',{classList:{contains(){return true},add(){},remove(){}}});
  d._set('pressureSheet',{}); d._set('stressToggle',{checked:false}); d._set('divergence',{value:'0.3'});
  g.evalIn("renderSheet=function(){};checkConflicts=function(){};renderNovelty=function(){};renderBatchTray=function(){};srAnnounce=function(){};renderSlotChange=function(){};var __toasts=[];toast=function(m){__toasts.push(m)};");
  g.gen = seed => { d.getElementById('seedInput').value = seed; return g.evalIn('_runGeneration()'); };
  return g;
})();

check('B1 — v1- seeds with a #suffix or overflow hash whole; canonical v1- still decodes', ()=>{
  const n = s => G.evalIn(`seedNumberFrom(${JSON.stringify(s)})`);
  assert(n('v1-abc') === parseInt('abc', 36), 'canonical v1- seed no longer decodes to its number');
  assert(G.evalIn(`seedNumberFrom(encodeSeed(4000000000))`) === 4000000000, 'encodeSeed round-trip broken');
  const set = new Set(['v1-abc','v1-abc#1','v1-abc#2'].map(n));
  assert(set.size === 3, 'suffixed seeds collide with the base seed');
  assert(n('v1-zzzzzzzzzz') === G.evalIn(`hashSeedString('v1-zzzzzzzzzz')`), 'overflowing v1- body was not hashed');
  G.document.getElementById('seedInput').value = 'v1-k3x9q';
  G.evalIn('generateBatch(4)');
  const sigs = G.evalIn("batchCandidates.map(c=>[...c.signature.traitIds].sort().join(','))");
  G.evalIn('dismissBatch()');
  assert(new Set(sigs).size === sigs.length, 'batch candidates from a v1- seed are identical');
  return `${sigs.length} distinct candidates`;
});

check('B2/B4 — pins never redraw locked slots, and never seat a duplicate', ()=>{
  G.gen('pin1');
  const k = G.evalIn("Object.keys(state).find(k=>k.startsWith('manner'))");
  const id = G.evalIn(`state['${k}'].trait.id`);
  G.evalIn(`state['${k}'].locked=true; pinnedTargets['${k}']=3;`);
  for (let i = 0; i < 8; i++){ G.gen('pin' + (i+2)); assert(G.evalIn(`state['${k}'].trait.id`) === id, 'a locked, pinned slot was redrawn'); }
  G.evalIn("__toasts.length=0");
  G.evalIn(`adjustPin('${k}', 1)`);
  assert(G.evalIn(`state['${k}'].trait.id`) === id, 'adjustPin redrew a locked slot');
  G.evalIn(`Object.keys(state).forEach(k=>{if(state[k])state[k].locked=false}); pinnedTargets={}; Object.keys(state).forEach(k=>{if(state[k]&&state[k].trait)pinnedTargets[k]=5})`);
  let dup = 0;
  for (let i = 0; i < 25; i++){
    G.gen('pq' + i);
    dup += G.evalIn(`(function(){const s=new Set();let n=0;Object.values(state).forEach(x=>{if(x&&x.trait){if(s.has(x.trait.id))n++;s.add(x.trait.id)}});return n})()`);
  }
  G.evalIn('pinnedTargets={}');
  assert(dup === 0, dup + ' duplicates seated by pin redraws');
  return 'lock wins; 0 duplicates in 25 fully pinned builds';
});

check('B5 — two LOCKED traits in a never-together pair are reported, not replaced or deleted', ()=>{
  const out = G.evalIn(`(function(){
    const ts = TRAITS.filter(t=>t.section==='Mannerisms');
    const a = ts[0], b = ts[1];
    const obj = {m0:{slotId:'m0',locked:true,trait:a}, m1:{slotId:'m1',locked:true,trait:b}};
    const saved = exclusivePairs; exclusivePairs = [[a.id,b.id]];
    try { detectConstraintConflicts(); applyExclusivePairs(obj, 0); }
    finally { exclusivePairs = saved; }
    return {ids:[obj.m0 && obj.m0.trait.id, obj.m1 && obj.m1.trait.id], want:[a.id,b.id],
            reported: getConstraintConflicts().some(c=>c.kind==='locked-vs-exclusive')};
  })()`);
  assert(out.ids[0] === out.want[0] && out.ids[1] === out.want[1], 'a locked slot was replaced or deleted');
  assert(out.reported, 'the conflict was not reported');
  return 'sheet untouched, conflict reported';
});

check('B6 — a required-in-place trait is unlocked once the requirement is removed', ()=>{
  G.gen('r1');
  const k = G.evalIn("Object.keys(state).find(k=>k.startsWith('manner'))");
  const id = G.evalIn(`state['${k}'].trait.id`);
  G.evalIn(`requiredTraitIds.push(${id})`); G.gen('r1');
  assert(G.evalIn(`state['${k}'].trait.id`) === id && G.evalIn(`state['${k}'].locked`) === true, 'setup: not seated in place');
  G.evalIn('requiredTraitIds.length=0');
  // Toss works straight away, without a regenerate in between.
  G.evalIn(`rerollSlot('${k}')`);
  assert(G.evalIn(`!!state['${k}'].locked`) === false && G.evalIn(`!!state['${k}'].required`) === false, 'stale required lock survived a Toss');
  // And a fresh build does not carry it as a lock.
  G.evalIn(`requiredTraitIds.push(${id})`); G.gen('r1'); G.evalIn('requiredTraitIds.length=0');
  let same = 0; for (let i = 0; i < 6; i++){ G.gen('r' + (i+3)); if (G.evalIn(`state['${k}'] && state['${k}'].trait.id`) === id) same++; }
  assert(same < 6, 'the formerly required trait stayed locked across builds');
  return `redrawn in ${6-same}/6 builds`;
});

check('B7 — a depth-first batch leaves the sliders alone; choosing applies the pick\'s sliders', ()=>{
  const d = G.document;
  d._set('depthFirstToggle',{checked:true});
  const snap = () => ['verbositySlider','registerSlider','composureSlider'].map(i=>d.getElementById(i).value)
    .concat(G.api.PERSONALITY_AXES.map(a=>d.getElementById('pers_'+a.id).value)).join(',');
  const before = snap();
  d.getElementById('seedInput').value = '';
  G.evalIn('generateBatch(3)');
  try {
    assert(snap() === before, 'the batch left a discarded candidate\'s sliders on screen');
    const want = G.evalIn("JSON.stringify(batchCandidates[1].sliders)");
    G.evalIn('chooseBatch(1)');
    const now = JSON.parse(want);
    assert(Object.keys(now).every(id => String(d.getElementById(id).value) === String(now[id])), 'chooseBatch did not apply the candidate\'s sliders');
  } finally {
    d._set('depthFirstToggle',{checked:false});
    ['verbositySlider','registerSlider','composureSlider'].forEach(id=>d.getElementById(id).value='0');
    G.api.PERSONALITY_AXES.forEach(a=>d.getElementById('pers_'+a.id).value='0');
  }
  return 'sliders restored, pick applied';
});

check('B11/B12 — Same world keeps the name; Variation\'s undo has no phantom locks', ()=>{
  const d = G.document;
  d.getElementById('charName').value = 'Alice'; G.gen('sw');
  d.getElementById('seedInput').value = '';
  G.evalIn('generateSameWorld()');
  assert(d.getElementById('charName').value === 'Alice', 'Same world erased the name field');
  assert(G.evalIn('charMeta.name') === 'Alice', 'Same world lost the name on the sheet');
  G.evalIn("Object.keys(state).forEach(k=>{if(state[k])state[k].locked=false})");
  G.evalIn('generateVariation()');
  G.evalIn('undoLast()');
  const locked = G.evalIn("Object.values(state).filter(s=>s&&s.locked).length");
  d.getElementById('charName').value = '';
  assert(locked === 0, locked + ' phantom locks restored by undo');
  return 'name kept; undo restores 0 locks';
});

check('B13 — the Background preset is achievable on a full sheet', ()=>{
  G.evalIn("applyBudgetPreset('background')");
  let unmet = 0;
  try {
    for (let i = 0; i < 10; i++){
      G.gen('bg' + i);
      const r = G.evalIn('getBudgetReport()');
      if (Object.values(r.intensity).some(x=>x.unmet) || Object.values(r.rarity).some(x=>x.unmet)) unmet++;
    }
  } finally { G.evalIn('clearBudgets()'); }
  assert(unmet === 0, `unmet in ${unmet}/10 builds`);
  return 'met in 10/10 builds';
});

check('B14 — an exclusivity swap respects the rarity caps when it can', ()=>{
  const out = G.evalIn(`(function(){
    clearBudgets(); rarityCaps.signature = 0; rarityCaps.distinctive = 0;
    const cat = [...new Set(TRAITS.filter(t=>t.section==='Mannerisms').map(t=>t.category))]
      .find(c=>{ const p = byFilter('Mannerisms', c); return p.some(t=>rarityTier(t)==='common') && p.length > 3; });
    const pool = byFilter('Mannerisms', cat);
    const a = pool[0], b = pool.find(t=>t.id!==a.id);
    const saved = exclusivePairs; exclusivePairs = [[a.id,b.id]];
    let bad = 0;
    try {
      for (let i = 0; i < 20; i++){
        const obj = {m0:{slotId:'m0',locked:true,trait:a}, m1:{slotId:'m1',trait:b,target:3}};
        applyExclusivePairs(obj, 0);
        if (obj.m1 && ['signature','distinctive'].includes(rarityTier(obj.m1.trait))) bad++;
      }
    } finally { exclusivePairs = saved; clearBudgets(); }
    return bad;
  })()`);
  assert(out === 0, out + ' swaps broke a zero cap');
  return '0/20 swaps broke a cap';
});

check('B15 — Toss on an "at least one from" slot redraws within its category', ()=>{
  G.gen('rc');
  const out = G.evalIn(`(function(){
    const k = Object.keys(state).find(k=>k.startsWith('manner'));
    const c = state[k].trait.category;
    const t = byFilter(state[k].trait.section, c).find(t=>t.id!==state[k].trait.id && !Object.values(state).some(s=>s&&s.trait&&s.trait.id===t.id));
    state['reqcat_0'] = {slotId:'reqcat_0', locked:true, required:true, label:'Required (at least one) — '+c, trait:t};
    const before = t.id;
    rerollSlot('reqcat_0');
    const s = state['reqcat_0'];
    delete state['reqcat_0'];
    return {changed: s.trait.id !== before, same: s.trait.category === c, req: !!s.required};
  })()`);
  assert(out.changed && out.same && out.req, JSON.stringify(out));
  return 'redrawn in category, still required';
});

check('B17 — explainWhyNot escapes category and section names', ()=>{
  const html = G.evalIn(`(function(){
    const t = Object.assign({}, TRAITS[0], {category:'<img src=x onerror=alert(1)>', section:'<b>x</b>'});
    bannedCategories.add(t.category);
    try { return explainWhyNot(t); } finally { bannedCategories.delete(t.category); }
  })()`);
  assert(!/<img/.test(html) && /&lt;img/.test(html), 'category name reached the HTML unescaped');
  return 'escaped';
});

check('B19 — facets of one drawAll section are not reported as conflicts with each other', ()=>{
  const n = G.evalIn(`(function(){
    const ts = TRAITS.filter(t=>t.section==='Role by Context' && t.pol);
    let a, b;
    outer: for (const x of ts) for (const y of ts){ for (const ax in x.pol){ if (y.pol && x.pol[ax]*y.pol[ax] < 0){ a=x; b=y; break outer; } } }
    if (!a) return -1;
    return checkConflictsFor({prof_contextrole_0:{trait:a}, prof_contextrole_1:{trait:b}}).length;
  })()`);
  assert(n === 0 || n === -1, n + ' conflicts reported inside one section');
  return n === -1 ? 'no opposing pair in bank' : '0 reported';
});


/* ================= §3: SIDE FEATURES AND ROBUSTNESS =================
   Draw context, headless settings, the context-rule cap, voice-lab seeds and author
   prompts, the collision heatmap, retire-for-project, the pressure sheet's budgets,
   and the coverage ratchet. Run in the audit engine (G) so nothing leaks upward. */
group('§3: draw context, headless settings, side features');

check('withDrawContext applies a context and puts every global back', ()=>{
  const out = G.evalIn(`(function(){
    const before = JSON.stringify(Object.entries(captureDrawContext()).map(([k,v])=>[k, v instanceof Map ? [...v] : v]));
    let inside = null;
    withDrawContext({avoidSet:{ids:new Set([1]),families:new Set(),cats:new Set()}, contextBias:new Map([['X',3]]), replayMode:true}, ()=>{
      inside = {avoid: !!AVOID_SET, bias: contextMultiplier('X'), replay: !historyAwareGeneration()};
    });
    const after = JSON.stringify(Object.entries(captureDrawContext()).map(([k,v])=>[k, v instanceof Map ? [...v] : v]));
    return {same: before === after, inside};
  })()`);
  assert(out.inside.avoid && out.inside.bias === 3 && out.inside.replay, 'context not applied: ' + JSON.stringify(out.inside));
  assert(out.same, 'a global was left changed after withDrawContext');
  return 'applied inside, restored after';
});

check('a build with a clean draw context is byte-identical to the same seed without one', ()=>{
  const out = G.evalIn(`(function(){
    clearContextBias(); setAvoidSet(null);
    const opts = {verbLevel:0.4, regLevel:-0.3, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}};
    const run = extra => withReplayMode(true, ()=> withRng(mulberry32(4242), ()=>{ rollCharacterVariants(); return JSON.stringify(compressSlots(buildCharacterState(Object.assign({}, opts, extra)))); }));
    const a = run({}), b = run({drawContext: makeDrawContext()}), c = run({});
    const leaked = captureDrawContext().avoidSet !== null;
    return {ab: a === b, ac: a === c, leaked};
  })()`);
  assert(out.ac, 'the seeded build itself is not reproducible');
  assert(out.ab, 'a clean draw context changed a seeded build');
  assert(!out.leaked, 'the draw context leaked out of the build');
  return 'identical';
});

check('a speculative build restores the whole draw context', ()=>{
  const ok = G.evalIn(`(function(){
    const snap = captureDrawContext();
    withSpeculativeGeneration(()=>{ setAvoidSet({ids:new Set([9]),families:new Set(),cats:new Set()}); setMotivationLinks({a:1}); setArchetypeProfile({role:'x'}); });
    const now = captureDrawContext();
    return DRAW_CONTEXT_KEYS.every(k => now[k] === snap[k]);
  })()`);
  assert(ok, 'withSpeculativeGeneration left draw-context globals changed');
  return 'restored';
});

check('headless settings drive the engine dials without a DOM', ()=>{
  const domDiv = G.evalIn('divergenceLevel()');
  const out = G.evalIn(`(function(){
    return withEngineSettings({divergence:0.7, wildcardToggle:true, wildcardCount:2, pressureLevel:40, rangeFocus:0}, ()=>
      ({div: divergenceLevel(), wc: wildcardCount(), p: pressureLevel(), band: bandHalf(), f: floatVal('divergence', 0), s: strVal('rarityPref','balanced')}));
  })()`);
  assert(out.div === 0.7 && out.wc === 2 && out.p === 0.4, JSON.stringify(out));
  assert(Math.abs(out.band - 1.35) < 1e-9, 'rangeFocus from settings not honoured: ' + out.band);
  assert(out.s === 'balanced', 'an id absent from the settings object should fall back to the DOM/default');
  const after = G.evalIn('divergenceLevel()');
  assert(after === domDiv, 'settings leaked past withEngineSettings: ' + after);
  // And a fully DOM-less engine can build from settings alone.
  const bare = loadEngine(['buildCharacterState','setEngineSettings','withRng','mulberry32','divergenceLevel']);
  bare.api.setEngineSettings({divergence:0.25, avoidRecentToggle:false});
  const st = bare.api.withRng(bare.api.mulberry32(5), ()=> bare.api.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2, vocabCount:1, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}}));
  assert(bare.api.divergenceLevel() === 0.25 && Object.values(st).some(x=>x && x.trait), 'headless build failed');
  return 'settings win, DOM is the default';
});

check('stacked context rules are clamped, and precedence holds', ()=>{
  const out = G.evalIn(`(function(){
    const r = buildContextBias('soldier, ex-military veteran of the war, army officer, a sergeant, noble lady, criminal thief smuggler', '70');
    const vals = [...r.bias.values()];
    const nudges = Object.values(r.nudge);
    clearContextSuppression();
    const neg = buildContextBias('not a soldier', '');
    clearContextBias();
    return {min: Math.min(...vals), max: Math.max(...vals), nmax: Math.max(0, ...nudges.map(Math.abs)), n: vals.length, negNotes: neg.notes.length, negRejected: neg.rejected.length,
            cap: [CONTEXT_MULT_MIN, CONTEXT_MULT_MAX, CONTEXT_NUDGE_CAP]};
  })()`);
  assert(out.n > 0, 'no rule matched the test text');
  assert(out.min >= out.cap[0] && out.max <= out.cap[1], `multiplier escaped [${out.cap[0]}, ${out.cap[1]}]: ${out.min}..${out.max}`);
  assert(out.nmax <= out.cap[2], 'nudge escaped its cap: ' + out.nmax);
  assert(out.negNotes === 0 && out.negRejected > 0, 'a negated match applied');
  return `${out.n} categories, ${out.min.toFixed(2)}–${out.max.toFixed(2)}`;
});

check('voice-lab seed includes the prompt index and a reroll counter', ()=>{
  const out = G.evalIn(`(function(){
    let st = null;
    for (let i = 0; i < 40 && !st; i++){ const s = withRng(mulberry32(800+i), ()=> buildCharacterState({verbLevel:1.5, regLevel:1.5, compLevel:0, mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{warm:80, man:80}})); if (voiceLab(s,'baseline').some(l=>l.rules.length)) st = s; }
    const txt = r => voiceLab(st, 'baseline', r).map(l=>l.text).join('|');
    const a0 = txt(0), a0b = txt(0);
    let moved = false; for (let r = 1; r < 12 && !moved; r++) if (txt(r) !== a0) moved = true;
    return {stable: a0 === a0b, moved};
  })()`);
  assert(out.stable, 'the same reroll counter produced different lines');
  assert(out.moved, 'no reroll counter changed any line');
  return 'stable per take; another take differs';
});

check('author voice prompts compose, normalise, and join the comparison', ()=>{
  const out = G.evalIn(`(function(){
    setUserVoicePrompts([{label:'Turning down the captain', setup:'x', like:'refuse'}, {label:''}, {label:'Bad like', like:'nope'}]);
    const ps = getUserVoicePrompts();
    const st = withRng(mulberry32(31), ()=> buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}}));
    const lines = voiceLab(st, 'baseline');
    const cmp = voiceComparison([{state:st, meta:{name:'A'}},{state:st, meta:{name:'B'}}], ps[0].id, 'baseline');
    setUserVoicePrompts([]);
    return {n: ps.length, like: ps[1].like, total: lines.length, user: lines.filter(l=>l.user).length, rows: cmp.rows.length, builtIns: VOICE_PROMPTS.length};
  })()`);
  assert(out.n === 2, 'an empty label should be dropped: ' + out.n);
  assert(out.like === 'request', 'an unknown "like" should fall back to request');
  assert(out.total === out.builtIns + 2 && out.user === 2, JSON.stringify(out));
  assert(out.rows === 2, 'an author prompt did not compose in the cast comparison');
  return `${out.total} lines`;
});

check('the collision heatmap is symmetric and names the worst offender', ()=>{
  const out = G.evalIn(`(function(){
    const mk = s => withRng(mulberry32(s), ()=> buildCharacterState({verbLevel:1.5, regLevel:1.5, compLevel:0, mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{warm:80}}));
    const a = mk(1), b = mk(2);
    const m = voiceCollisionMatrix([{state:a,meta:{name:'A'}},{state:a,meta:{name:'A2'}},{state:b,meta:{name:'B'}}], 'baseline');
    let sym = true; for (let i=0;i<3;i++) for (let j=0;j<3;j++) if (m.matrix[i][j] !== m.matrix[j][i]) sym = false;
    const argmax = m.totals.indexOf(Math.max(...m.totals));
    return {sym, diag: m.matrix.every((r,i)=>r[i]===0), twins: m.matrix[0][1], worst: m.worst, argmax, totals: m.totals};
  })()`);
  assert(out.sym && out.diag, 'matrix not symmetric with a zero diagonal');
  assert(out.twins > 0, 'two identical sheets shared nothing');
  assert(out.worst === out.argmax, 'worst offender is not the largest row total: ' + JSON.stringify(out));
  return `twins share ${out.twins}`;
});

check('de-collide rerolls the worst offender only when it lowers the total', ()=>{
  const out = G.evalIn(`(function(){
    const mk = s => withRng(mulberry32(s), ()=> buildCharacterState({verbLevel:1.5, regLevel:1.5, compLevel:0, mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{warm:80}}));
    const a = mk(11);
    castStates = [castEntry(a, {}, {name:'A'}), castEntry(JSON.parse(JSON.stringify(a)), {}, {name:'B'}), castEntry(mk(12), {}, {name:'C'})];
    castStates[1].state = a;
    const sum = () => voiceCollisionMatrix(castStates, 'baseline').totals.reduce((x,y)=>x+y,0);
    const before = sum();
    const ids = castStates.map(c=>c.id);
    toastUndo = function(){}; renderCast = function(){}; refreshRelSelectors = function(){};
    deCollideCast();
    const after = sum();
    const same = castStates.map(c=>c.id).join() === ids.join();
    castStates = [];
    return {before, after, same};
  })()`);
  assert(out.same, 'de-collide changed cast membership');
  assert(out.after <= out.before, `de-collide made it worse: ${out.before} → ${out.after}`);
  return `${out.before} → ${out.after}`;
});

check('retire-for-project is a soft penalty in exploration and ignored on replay', ()=>{
  const out = G.evalIn(`(function(){
    const t = TRAITS[5];
    setRetiredTraits([t.id]);
    const explore = retirePenalty(t);
    const replay = withReplayMode(true, ()=> retirePenalty(t));
    const other = retirePenalty(TRAITS[6]);
    setRetiredTraits([]);
    return {explore, replay, other};
  })()`);
  assert(out.explore > 0 && out.explore < 1, 'a retired trait should be down-weighted, not banned: ' + out.explore);
  assert(out.replay === 1 && out.other === 1, JSON.stringify(out));
  // A seeded (explicit) build is byte-identical with the sheet's own traits retired.
  G.gen('retire-replay');
  const a = G.evalIn('JSON.stringify(compressSlots(state))');
  const ids = G.evalIn('JSON.stringify(Object.values(state).filter(s=>s&&s.trait).map(s=>s.trait.id))');
  G.evalIn(`setRetiredTraits(${ids})`);
  G.gen('retire-replay');
  const b = G.evalIn('JSON.stringify(compressSlots(state))');
  // ...and exploration does move off them.
  G.document.getElementById('seedInput').value = '';
  let kept = 0, total = 0;
  for (let i = 0; i < 6; i++){ G.evalIn('_runGeneration()'); const r = G.evalIn(`(function(){const s=new Set(${ids});const v=Object.values(state).filter(x=>x&&x.trait);return [v.filter(x=>s.has(x.trait.id)).length, v.length]})()`); kept += r[0]; total += r[1]; }
  G.evalIn('setRetiredTraits([])');
  assert(a === b, 'retiring traits changed a seeded replay');
  assert(kept / total < 0.2, `retired traits still ${(100*kept/total).toFixed(0)}% of exploration sheets`);
  return `replay identical; ${kept}/${total} retired seats in exploration`;
});

check('the pressure sheet respects rarity caps and never-together pairs', ()=>{
  const out = G.evalIn(`(function(){
    clearBudgets(); rarityCaps.signature = 0; rarityCaps.distinctive = 0;
    let breaches = 0, pairBreaches = 0, sheets = 0;
    const savedPairs = exclusivePairs;
    try {
      for (let i = 0; i < 12; i++){
        const base = withRng(mulberry32(300+i), ()=> finalizeSheet(buildCharacterState({verbLevel:1, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}}), {rarityPref:'balanced'}));
        const ps = withRng(mulberry32(900+i), ()=> buildStressVariant(1, 0, 3, 'balanced', base));
        const seated = Object.values(ps).filter(s=>s && s.trait);
        sheets++;
        breaches += seated.filter(s=>['signature','distinctive'].includes(rarityTier(s.trait))).length;
        // Pair the first two seated pressure traits and rebuild on the same stream.
        if (seated.length >= 2){
          exclusivePairs = [[seated[0].trait.id, seated[1].trait.id]];
          const ps2 = withRng(mulberry32(900+i), ()=> buildStressVariant(1, 0, 3, 'balanced', base));
          const ids = new Set(Object.values(ps2).filter(s=>s&&s.trait).map(s=>s.trait.id));
          if (ids.has(exclusivePairs[0][0]) && ids.has(exclusivePairs[0][1])) pairBreaches++;
          exclusivePairs = savedPairs;
        }
      }
    } finally { exclusivePairs = savedPairs; clearBudgets(); }
    return {breaches, pairBreaches, sheets};
  })()`);
  assert(out.pairBreaches === 0, out.pairBreaches + ' pressure sheets seated both halves of a never-together pair');
  assert(out.breaches === 0, out.breaches + ' capped-tier traits on pressure sheets with the cap at zero');
  return `${out.sheets} pressure sheets clean`;
});

check('arc timeline diffs the pressure sheet per event', ()=>{
  G.gen('arc-tl');
  const out = G.evalIn(`(function(){
    arcBase = JSON.parse(JSON.stringify(state)); arcEvents = [];
    const ev = makeArcEvent(1, {title:'The fire', shape:'growth', at:'x'});
    ev.changes = proposeArcChanges(state, ev, []).map(c => Object.assign(c, {accepted:true}));
    arcEvents.push(ev);
    const rows = arcTimeline(), md = arcTimelineMarkdown(), again = arcTimelineMarkdown();
    const same = pressureSheetDiff(pressureState || {}, pressureState || {}).length;
    arcEvents = []; arcBase = null;
    return {n: rows.length, md, stable: md === again, same, hasDiff: Array.isArray(rows[0].pressureDiff)};
  })()`);
  assert(out.n === 1 && out.hasDiff, 'timeline rows missing');
  assert(/## 1\. The fire/.test(out.md) && /Under pressure, after this event/.test(out.md), out.md.slice(0, 200));
  assert(out.stable, 'the timeline export is not deterministic');
  assert(out.same === 0, 'a sheet diffed against itself reported changes');
  return 'deterministic markdown';
});

check('batch candidates each get a distinct seed', ()=>{
  G.document.getElementById('seedInput').value = '';
  G.evalIn('generateBatch(5)');
  const seeds = G.evalIn("batchCandidates.map(c=>c.seed || (c.meta && c.meta.seed) || '')");
  G.evalIn('dismissBatch()');
  assert(seeds.every(Boolean), 'a candidate carries no seed: ' + JSON.stringify(seeds));
  assert(new Set(seeds).size === seeds.length, 'duplicate batch seeds: ' + seeds.join(', '));
  return seeds.length + ' distinct';
});

check('worldTags / conditions / exceptions coverage never falls (ratchet)', ()=>{
  /* These fields validate but almost nothing sets them. The floor is what the bank held
     when the ratchet was added; raise it when you tag more, never lower it. */
  const FLOOR = {worldTags: 170, conditions: 640, exceptions: 0};   // raised by the §6 gap pack + worldTags back-fill
  const T = A.TRAITS;
  const have = k => T.filter(t => Array.isArray(t[k]) && t[k].length).length;
  const now = {worldTags: have('worldTags'), conditions: have('conditions'), exceptions: have('exceptions')};
  Object.keys(FLOOR).forEach(k => assert(now[k] >= FLOOR[k], `${k} coverage fell to ${now[k]} (floor ${FLOOR[k]})`));
  return Object.keys(now).map(k => `${k} ${now[k]}`).join(', ');
});


group('§4 balancing: archetype identity, preset spread, trait-bank shape');

check('§4: no two presets are near-duplicates (cosine over 13 axes + 3 voice postures)', ()=>{
  /* The audit measured four pairs above 0.80 — Plain-Spoken/Blunt Foreman 0.86, Burnt-Out
     Idealist/Former True Believer 0.83, Compulsive Fixer/Workaholic 0.81, Wounded Soldier/
     Survivor 0.80. They were differentiated rather than merged so saved characters that
     name them still load. Voice postures are scaled x50 onto the axis range. */
  const AX = A.PERSONALITY_AXES.map(a=>a.id), K = Object.keys(A.ARCHETYPES);
  const vec = k => { const a = A.ARCHETYPES[k]; return AX.map(x=>a.pers[x]||0).concat([a.verbosity*50, a.register*50, a.composure*50]); };
  const cos = (u,v) => { let d=0,p=0,q=0; u.forEach((x,i)=>{ d+=x*v[i]; p+=x*x; q+=v[i]*v[i]; }); return d/Math.sqrt(p*q); };
  let worst = [0,'',''];
  for (let i=0;i<K.length;i++) for (let j=i+1;j<K.length;j++){ const c = cos(vec(K[i]),vec(K[j])); if (c > worst[0]) worst = [c,K[i],K[j]]; }
  assert(worst[0] <= 0.80, `${worst[1]} / ${worst[2]} at ${worst[0].toFixed(2)}`);
  [['plainSpoken','bluntForeman'],['burntIdealist','formerTrueBeliever'],['compulsiveFixer','workaholicAvoiding'],['soldier','undiscussedSurvivor']]
    .forEach(([a,b])=>{ const c = cos(vec(a),vec(b)); assert(c < 0.70, `${a}/${b} still ${c.toFixed(2)}`); });
  return `${K.length} presets, closest pair ${worst[1]}/${worst[2]} ${worst[0].toFixed(2)}`;
});

check('§4: presets are filled out, discipline is not skewed, and the missing types exist', ()=>{
  const thin = Object.entries(A.ARCHETYPES).filter(([,a])=>Object.keys(a.pers).length < 6).map(([k])=>k);
  assert(!thin.length, 'presets setting fewer than six axes: ' + thin.join(', '));
  let p = 0, n = 0; Object.values(A.ARCHETYPES).forEach(a=>{ const v = a.pers.discipline; if (v > 0) p++; else if (v < 0) n++; });
  assert(p / n <= 1.4, `discipline ${p}:${n}`);
  ['newParent','midlifeReinventor','restlessRetiree','codeSwitcher','preciseLiteralist','incurableFlirt',
   'secularIdeologue','nosyNeighbour','pompousBlowhard','maliciousTrickster'].forEach(k=> assert(A.ARCHETYPES[k], 'missing preset ' + k));
  const unhinted = Object.entries(A.ARCHETYPES).filter(([,a])=>Object.keys(a.profile||{}).length < 4).map(([k])=>k);
  assert(!unhinted.length, 'presets with fewer than four profile hints: ' + unhinted.join(', '));
  const closed = Object.entries(A.ARCHETYPE_INTENT).filter(([,it])=>!it.open.length).map(([k])=>k);
  assert(!closed.length, 'presets that leave no core section open: ' + closed.join(', '));
  return `discipline ${p}:${n}`;
});

check('§4: a preset\'s profile hints usually land (identity survives the dice)', ()=>{
  /* Measured before the hint-strength change: 50% of hinted single-slot sections landed
     on their hint across 40 builds per preset; after it, ~65%. Held at 55% on a seeded
     six-preset sample so the preset-to-sheet link cannot quietly weaken again. */
  let hit = 0, tot = 0;
  ['conartist','soldier','noble','cheerfulMess','pompousBlowhard','codeSwitcher'].forEach((key, ki)=>{
    const arch = A.effectiveArchetype(key, 'base');
    for (let i=0;i<20;i++){
      let st;
      A.withArchetypeProfile(arch.profile, ()=> A.withRng(A.mulberry32(0x5A4 + ki*101 + i), ()=>{
        A.rollCharacterVariants();
        const ov = {}; A.PERSONALITY_AXES.forEach(a=>{ ov[a.id] = arch.pers[a.id] !== undefined ? Math.round(arch.pers[a.id]*0.65) : 0; });
        st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:ov});
      }));
      Object.entries(arch.profile).forEach(([sec, cat])=>{
        const c = A.slotCat(st['prof_'+sec+'_0']); if (!c) return;
        tot++; if (c === cat) hit++;
      });
    }
  });
  A.forgetRecentTraits(); A.forgetSlotDraws();
  assert(tot > 100, 'too few hinted slots measured: ' + tot);
  assert(hit / tot >= 0.55, `hints landed ${(100*hit/tot).toFixed(0)}% of ${tot}`);
  return `${(100*hit/tot).toFixed(0)}% of ${tot} hinted slots`;
});

check('§4: single-slot profile sections reach most of their pool', ()=>{
  /* Values, Stress and Attachment drew every primary at one shared target with the
     narrowest window, so about half of each pool was never seen (45% / 45% / 49% of
     traits drawn in 1,500 builds). The primary now jitters its target and draws with
     minCount + flatten + slot memory, like Motivation. Floors at 600 seeded builds. */
  const seen = {stress:new Set(), values:new Set(), attachment:new Set()};
  // Earlier checks leave section toggles and type pickers dirty; this one is about the
  // unforced draw, so make sure these three are on and unpinned.
  Object.keys(seen).forEach(id=>{
    ctx.document._set('sec_'+id, {checked:true});
    ctx.document._set('type_'+id, {value:'', tagName:'SELECT', options:[{value:''}]});
  });
  A.withRng(A.mulberry32(0xC0FE), ()=>{
    for (let i=0;i<600;i++){
      const o = {}; A.PERSONALITY_AXES.forEach(a=> o[a.id] = Math.round(A.rand() * 200 - 100));
      A.rollCharacterVariants();
      const st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:o});
      Object.keys(seen).forEach(k=>{ const s = st['prof_'+k+'_0']; if (s && s.trait) seen[k].add(s.trait.id); });
    }
  });
  A.forgetRecentTraits(); A.forgetSlotDraws();
  const out = [];
  Object.entries(seen).forEach(([k, set])=>{
    const ps = A.PROFILE_SECTIONS.find(p=>p.id===k);
    const pool = A.TRAITS.filter(t=>t.section === ps.section).length;
    const share = set.size / pool;
    out.push(`${k} ${(100*share).toFixed(0)}%`);
    assert(share >= 0.6, `${k} drew only ${set.size} of ${pool}`);
  });
  return out.join(', ');
});

check('§4: the life sections stay grown and rarity is not a proxy for loudness (ratchet)', ()=>{
  const size = s => A.TRAITS.filter(t=>t.section === s).length;
  const FLOOR = {"Goals & Stakes":330, "Competence & Method":240, "Recovery & Repair":80, "Role by Context":66,
                 "Contradiction Functions":100, "Ordinary Texture":88, "Positive Origins":96};
  Object.entries(FLOOR).forEach(([s, n])=> assert(size(s) >= n, `${s} fell to ${size(s)} (floor ${n})`));
  // Cramér's V between rarity tier and intensity — 0.60 at the audit, 0.55 after this pass.
  const R = ['common','uncommon','distinctive','signature'], m = R.map(()=>[0,0,0,0,0]);
  A.TRAITS.forEach(t=>{ const r = R.indexOf(t.rarity); if (r >= 0) m[r][t.intensity-1]++; });
  const N = A.TRAITS.length, rs = m.map(r=>r.reduce((a,b)=>a+b,0)), cs = [0,1,2,3,4].map(j=>m.reduce((a,r)=>a+r[j],0));
  let chi = 0; m.forEach((r,i)=>r.forEach((o,j)=>{ const e = rs[i]*cs[j]/N; if (e) chi += (o-e)*(o-e)/e; }));
  const V = Math.sqrt(chi / (N * 3));
  assert(V <= 0.555, `Cramér's V rose to ${V.toFixed(3)}`);
  // the suffix duplicates the audit listed were reworded, not deleted (saved ids stay valid)
  const byId = A.TRAITS_BY_ID;
  [3871,3878,3944,4195,5160,5169,5179,5192,102029,3723].forEach(id=>{
    const t = byId.get ? byId.get(id) : byId[id];
    assert(t, 'reworded trait ' + id + ' is missing');
    assert(!/ (vocab|discipliner|conformist|fighter)$|with how much it matters$|^Direct-question asker$/.test(t.trait), `#${id} still reads as a suffix duplicate: ${t.trait}`);
  });
  return `V ${V.toFixed(3)}; goals ${size("Goals & Stakes")}, competence ${size("Competence & Method")}`;
});

/* ================= §5 KEEPING OUTPUT FRESH =================
   Compositional voice lines, seated contradictions, variable sheet shape, best-of-three
   exploration, lenses and backstory beats. A fresh engine instance so no state from the
   sections above leaks in (and none leaks out). */
group('§5 keeping output fresh: voice composer, contradictions, shape, anti-staleness, lenses, beats');
const F5 = loadEngine();
const f5 = code => F5.evalIn('(function(){' + code + '})()');
const F5_BUILD = `const mk = (seed, i) => withRng(mulberry32(seed), ()=> buildCharacterState({verbLevel:((i||0)%5-2)*0.8, regLevel:(((i||0)*3)%5-2)*0.8, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}}));`;

check('§5 voice: 100 characters x 7 prompts give mostly distinct lines, with no fixed entity and no unfilled slot', ()=>{
  const out = f5(F5_BUILD + `
    const all = new Set(), per = {}; let bad = [];
    for (let i = 0; i < 100; i++){ const st = mk(5000 + i, i);
      voiceLab(st, 'baseline').forEach(l => { all.add(l.text); (per[l.promptId] = per[l.promptId] || new Set()).add(l.text);
        if (/Marcus|\\{|\\}|undefined|null/.test(l.text)) bad.push(l.text); }); }
    return {all: all.size, lie: per.lie.size, minPer: Math.min(...Object.values(per).map(s=>s.size)), bad: bad.slice(0,3)};`);
  assert(!out.bad.length, 'bad lines: ' + out.bad.join(' | '));
  // Before the composer: 124 distinct of 700, and 13 distinct lies in 100 characters.
  assert(out.all >= 550, `only ${out.all}/700 distinct lines`);
  assert(out.minPer >= 70, `a prompt collapsed to ${out.minPer} distinct lines in 100 characters`);
  return `${out.all}/700 distinct (was 124); lie ${out.lie}/100 (was 13)`;
});

check('§5 voice: the 10-lines view is stable per sheet and mostly distinct takes', ()=>{
  const out = f5(F5_BUILD + `
    let tot = 0, stable = true;
    for (let i = 0; i < 20; i++){ const st = mk(6100 + i, i);
      const a = voiceLines(st, 'refuse', 'baseline', 10).map(l=>l.text), b = voiceLines(st, 'refuse', 'baseline', 10).map(l=>l.text);
      if (a.join('|') !== b.join('|') || a.length !== 10) stable = false; tot += new Set(a).size; }
    return {stable, avg: tot / 20};`);
  assert(out.stable, 'ten lines differ between two calls on one sheet');
  assert(out.avg >= 6, `only ${out.avg} distinct of 10 on average`);
  return `${out.avg.toFixed(1)} distinct of 10`;
});

check('§5 voice: transforms name their rule, and a lens keeps its taboo topics out of the lines', ()=>{
  const out = f5(F5_BUILD + `
    let grammarRule = 0, tabooHits = 0, n = 0;
    for (let i = 0; i < 40; i++){ const st = mk(6200 + i, i);
      voiceLab(st, 'baseline').forEach(l => { if (l.rules.some(r => /^grammar: /.test(r))) grammarRule++; }); }
    withEngineSettings({lensSelect:'child,corporate'}, ()=>{
      for (let i = 0; i < 40; i++){ const st = mk(6300 + i, i);
        VOICE_PROMPTS.forEach(p => voiceLines(st, p.id, 'baseline', 3).forEach(l => { n++; if (/money|salary|layoffs/i.test(l.text)) tabooHits++; })); }
    });
    return {grammarRule, tabooHits, n};`);
  assert(out.grammarRule > 50, 'grammar transforms almost never fire: ' + out.grammarRule);
  assert(out.tabooHits === 0, `${out.tabooHits} of ${out.n} lines used a taboo topic`);
  return `${out.grammarRule} grammar-shaped lines; 0 taboo hits in ${out.n}`;
});

check('§5 contradictions: seated on purpose, against the sheet, with every scene question answered', ()=>{
  const out = f5(F5_BUILD + `
    let seated = 0, opposing = 0, answered = 0, total = 0, fn = 0;
    withEngineSettings({seatContradictions:true}, ()=>{
      for (let i = 0; i < 30; i++){ const st = mk(6400 + i, i);
        const sc = seatedContradictions(st);
        if (sc.length) seated++;
        sc.forEach(c => { total++; if (c.fnTrait) fn++;
          if (c.exception.pol[c.axis] === -st[c.slotId].contradiction.face) opposing++;
          if (c.answers.every(a => a.answer && a.answer.length > 8)) answered++; });
        if (checkConflictsFor(st).some(x => sc.some(c => x.text.includes(c.exception.trait)))) return 'conflict'; }
    });
    const a = withEngineSettings({seatContradictions:true}, ()=> JSON.stringify(Object.keys(mk(6400, 0)).map(k=>k)));
    const b = withEngineSettings({seatContradictions:true}, ()=> JSON.stringify(Object.keys(mk(6400, 0)).map(k=>k)));
    return {seated, opposing, answered, total, fn, det: a === b};`);
  assert(typeof out === 'object', 'a seated contradiction was reported as a conflict');
  assert(out.seated >= 27, `only ${out.seated}/30 sheets seated one`);
  assert(out.opposing === out.total && out.answered === out.total, JSON.stringify(out));
  assert(out.fn >= out.total * 0.8, 'the function card is usually missing: ' + out.fn + '/' + out.total);
  assert(out.det, 'seating is not deterministic for a seed');
  return `${out.total} contradictions over ${out.seated} sheets, all answered`;
});

check('§5 settings off: none of the new plans touch the seeded stream', ()=>{
  const out = f5(F5_BUILD + `
    const sig = st => Object.keys(st).sort().map(k => k + ':' + (st[k].trait ? st[k].trait.id : '-')).join(',');
    const a = sig(mk(6500, 3));
    const b = withEngineSettings({seatContradictions:false, sheetShapeToggle:false, lensSelect:''}, ()=> sig(mk(6500, 3)));
    return a === b;`);
  assert(out, 'switching the §5 settings off changed the sheet');
});

check('§5 shape: the signature budget varies the sheet (doubled, dropped, 0-3 outliers) and replays', ()=>{
  const out = f5(F5_BUILD + `
    const sizes = new Set(), shapes = new Set(); let okDouble = true, okDrop = true, wild = new Set(), det = true;
    withEngineSettings({sheetShapeToggle:true, wildcardToggle:true}, ()=>{
      for (let i = 0; i < 40; i++){ const st = mk(6600 + i, i); const sh = LAST_SHAPE;
        sizes.add(Object.keys(st).length); shapes.add(JSON.stringify([[...sh.double].sort(), sh.drop, sh.wild]));
        sh.double.forEach(id => { if (Object.keys(st).filter(k => k.startsWith('prof_' + id + '_')).length < 2 && byFilter(PROFILE_SECTIONS.find(p=>p.id===id).section, st['prof_' + id + '_0'] ? st['prof_' + id + '_0'].trait.category : '').length > 1) okDouble = false; });
        if (sh.drop && Object.keys(st).some(k => k.startsWith('prof_' + sh.drop + '_'))) okDrop = false;
        wild.add(Object.keys(st).filter(k => k.startsWith('wild_')).length);
        const again = mk(6600 + i, i); if (Object.keys(again).join() !== Object.keys(st).join()) det = false; }
    });
    return {sizes: sizes.size, shapes: shapes.size, okDouble, okDrop, wild: [...wild].sort(), det};`);
  assert(out.okDouble && out.okDrop && out.det, JSON.stringify(out));
  assert(out.sizes >= 5 && out.shapes >= 15, `sheet shape barely varies: ${JSON.stringify(out)}`);
  assert(out.wild.length >= 3 && Math.max(...out.wild) <= 3, 'outlier count does not span 0-3: ' + out.wild);
  return `${out.sizes} sheet sizes, ${out.shapes} shapes in 40 (was 1 and 1)`;
});

check('§5 anti-staleness: best of three picks the most distinct above the coherence floor', ()=>{
  const out = f5(F5_BUILD + `
    forgetArchive();
    for (let i = 0; i < 6; i++) archiveCharacter(mk(6700 + i, i), {name:'A' + i});
    const refs = explorationReferences(null);
    const cands = [0,1,2].map(k => ({num: candidateSeed(99, k), state: mk(candidateSeed(99, k), k)}));
    const pick = selectDistinctCandidate(cands, refs);
    const ds = cands.map(c => diversityScore(c.state, refs).score);
    const eligible = pick.scores.filter(s => s.coherence >= pick.floor).map(s => s.diversity);
    // A twin of an archived character must lose to anything else.
    const twin = {num: 1, state: mk(6700, 0)};
    const p2 = selectDistinctCandidate([twin, cands[1]].map(c => Object.assign({}, c, {coherence: 50})), refs);
    const seeds = new Set([0,1,2].map(k => candidateSeed(12345, k)));
    return {best: Math.max(...eligible), chosen: pick.diversity, twinLost: p2.index === 1, c0: candidateSeed(12345, 0) === 12345, seeds: seeds.size};`);
  assert(Math.abs(out.best - out.chosen) < 1e-3, 'did not keep the most distinct eligible candidate');
  assert(out.twinLost, 'a twin of an archived character was kept');
  assert(out.c0 && out.seeds === 3, 'candidate seeds: the first must be the seed itself, all three distinct');
  return 'most distinct kept; twins lose';
});

check('§5 anti-staleness: the project tally steers exploration and replay ignores it', ()=>{
  const out = f5(F5_BUILD + `
    forgetArchive();
    const cats = catsOf('Values & Moral Line');
    for (let i = 0; i < 8; i++) archiveCharacter({x:{trait:{id:900000+i, category:cats[0], section:'Values & Moral Line', pol:{}, intensity:3, rarity:'common'}}, prof_values_0:{sectionId:'values', trait:byFilter('Values & Moral Line', cats[0])[i]}}, {name:'r'});
    const explore = archiveCategoryMultiplier(cats[0], cats), other = archiveCategoryMultiplier(cats[1], cats);
    const replay = withReplayMode(true, ()=> archiveCategoryMultiplier(cats[0], cats));
    const rut = {prof_values_0:{trait:byFilter('Values & Moral Line', cats[0])[0]}}, fresh = {prof_values_0:{trait:byFilter('Values & Moral Line', cats[1])[0]}};
    const pick = selectDistinctCandidate([{state:rut, coherence:50}, {state:fresh, coherence:50}], []);
    const sig = st => Object.keys(st).sort().map(k => k + ':' + (st[k].trait ? st[k].trait.id : '-')).join(',');
    const r1 = withReplayMode(true, ()=> sig(mk(6800, 2)));
    forgetArchive();
    const r2 = withReplayMode(true, ()=> sig(mk(6800, 2)));
    return {explore, other, replay, same: r1 === r2, freshWins: pick.index === 1};`);
  assert(out.explore < 1 && out.other > 1, 'the tally does not push the over-used category down: ' + JSON.stringify(out));
  assert(out.replay === 1, 'replay mode read the archive tally');
  assert(out.same, 'a replay changed with the project archive');
  assert(out.freshWins, 'candidate selection ignored the long-horizon tally');
  return `over-used x${out.explore.toFixed(2)}, neglected x${out.other.toFixed(2)}, replay x1`;
});

check('§5 anti-staleness: divergence now acts within a category too', ()=>{
  const out = f5(`
    const pool = byFilter('Vocabulary Traits', 'Register & Formality Spectrum');
    const count = div => withEngineSettings({divergence: div}, ()=> { const s = new Set(); withRng(mulberry32(7), ()=>{ for (let i = 0; i < 400; i++) s.add(pickInRange(pool, 'balanced', 2.2).id); }); return s.size; });
    return {off: count(0), on: count(1)};`);
  assert(out.on > out.off, `divergence did not widen the draw inside a category: ${out.off} -> ${out.on}`);
  return `${out.off} -> ${out.on} distinct in 400 draws`;
});

check('§5 lenses: first-class, combinable, capped, wired into worldTags and the normal/deviant reading', ()=>{
  const out = f5(`
    const known = c => SECTION_OF_CATEGORY.has(c) || !!_axisForCategory(c);
    let all = 0, ok = 0; LENSES.forEach(l => (l.up||[]).concat(l.down||[]).forEach(c => { all++; if (known(c)) ok++; }));
    const kinds = new Set(LENSES.map(l => l.kind));
    const r = withEngineSettings({lensSelect:'court,latelife,bogus'}, ()=> buildContextBias('', ''));
    // Personality poles arrive as slider nudges; every other category as a multiplier.
    const polished = contextMultiplier('Stylized & Elaborate') * (Object.values(r.nudge).some(v => v > 0) ? 1 : 0), crude = contextMultiplier('Directness & Literalness');
    const max = Math.max(...[...CONTEXT_BIAS.values()]);
    clearContextBias();
    const tagged = {worldTags:['futuristic']}, any = {worldTags:['any']};
    const wt = withEngineSettings({lensSelect:'scifi'}, ()=> [worldTagMultiplier(tagged), worldTagMultiplier(any)]);
    const wt2 = withEngineSettings({lensSelect:'court'}, ()=> worldTagMultiplier(tagged));
    const crudeT = TRAITS.find(t => t.category === 'Manners — Crude & Ill-Mannered'), polT = TRAITS.find(t => t.category === 'Manners — Polished & Courteous');
    const rd = withEngineSettings({lensSelect:'court'}, ()=> [lensReading(crudeT), lensReading(polT)]);
    return {share: ok / all, settings: LENSES.filter(l=>l.kind==='setting').length, life: LENSES.filter(l=>l.kind==='life').length,
      lenses: r.lenses, reg: r.lensRegister, polished, crude, max, wt, wt2, rd: rd.map(x => x && x.status), none: lensReading(polT)};`);
  assert(out.settings === 8 && out.life === 7, 'expected 8 settings and 7 life stages');
  assert(out.share >= 0.9, 'lens categories that do not exist: ' + out.share);
  assert(out.lenses.join() === 'court,latelife', 'unknown lens ids should drop, order canonical: ' + out.lenses);
  assert(out.reg > 0, 'court + late life should nudge register formal');
  assert(out.polished > 1 && out.crude < 1 && out.max <= 4, JSON.stringify(out));
  assert(out.wt[0] > 1 && out.wt[1] === 1 && out.wt2 < 1, 'worldTag multiplier: ' + out.wt + ' / ' + out.wt2);
  assert(out.rd[0] === 'deviant' && out.rd[1] === 'normal' && out.none === null, 'reading: ' + out.rd);
  return `${out.settings} settings + ${out.life} life stages; register +${out.reg}`;
});

check('§5 backstory beats: 3-5 dated beats, each tied to a seated card', ()=>{
  const out = f5(F5_BUILD + `
    let n = 0, okLen = 0, grounded = 0, dated = 0, total = 0;
    for (let i = 0; i < 30; i++){ const st = mk(6900 + i, i); const b = backstoryBeats(st, {age: '40'}); if (!b) continue; n++;
      if (b.length >= 3 && b.length <= 5) okLen++;
      b.forEach(x => { total++; if (x.from.length) grounded++; if (/around \\d+|within the last year|now/.test(x.when)) dated++; }); }
    const st = mk(6900, 0);
    return {n, okLen, grounded, dated, total, det: JSON.stringify(backstoryBeats(st, {})) === JSON.stringify(backstoryBeats(st, {}))};`);
  assert(out.n >= 28 && out.okLen === out.n, JSON.stringify(out));
  assert(out.grounded === out.total && out.dated === out.total, JSON.stringify(out));
  assert(out.det, 'beats are not deterministic');
  return `${out.total} beats over ${out.n} sheets`;
});

// ======================================================================
group('Section 6 mechanics: tiers, casts, foils, relationship web, pressure, arcs, lens, wildcard, labels');
const S6 = (code) => G.evalIn(code);
const _s6Sheet = `(s => withRng(mulberry32(s), ()=> buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}})))`;

check('§6 tierWeight: secondary tier is rule-derived well beyond the hand list', ()=>{
  const r = S6(`(function(){
    const p = TRAITS.filter(t=>t.section==='Personality Traits');
    const sec = p.filter(t=>t.tier==='secondary'), der = sec.filter(t=>t.tierSource==='derived');
    const listedHit = SECONDARY_TRAIT_NAMES.filter(isBehaviouralTraitName).length;
    return {sec: sec.length, der: der.length, total: p.length, listed: SECONDARY_TRAIT_NAMES.length, listedHit,
      adjCore: ['Aloof','Frosty','Gregarious'].every(n => !isBehaviouralTraitName(n)), w: tierWeight(der[0], 4.5)};
  })()`);
  assert(r.der >= 300, 'derived only ' + r.der);
  assert(r.listedHit / r.listed >= 0.7, `the rule recovers only ${r.listedHit}/${r.listed} hand-listed names`);
  assert(r.adjCore, 'a dispositional adjective was classed as behavioural');
  assert(r.w < 0.5, 'a derived secondary trait is not suppressed at a loud target');
  return `${r.sec}/${r.total} secondary (${r.der} derived); rule recovers ${r.listedHit}/${r.listed}`;
});

check('§6 emergent labels: grown tables, signature words, still deterministic per sheet', ()=>{
  const r = S6(`(function(){
    const mk = ${_s6Sheet};
    const names = new Set(); let sig = 0;
    for (let s = 1; s <= 200; s++){ const st = mk(6000 + s); const n = emergentArchetypeName(st);
      if (n.name !== emergentArchetypeName(st).name) return {bad: s};
      names.add(n.name); const w = signatureArchetypeWords(st); if (w.adj.concat(w.noun).some(x => n.name.includes(x))) sig++; }
    return {distinct: names.size, sig, adjMin: Math.min(...Object.values(ARCH_ADJ).map(a=>a.length))};
  })()`);
  assert(!r.bad, 'the same sheet named differently at seed ' + r.bad);
  assert(r.adjMin >= 4, 'some ARCH_ADJ entry still has fewer than 4 words');
  assert(r.distinct >= 110, 'only ' + r.distinct + ' distinct labels in 200');
  assert(r.sig > 0, 'no label ever borrowed a word from the sheet');
  return `${r.distinct} distinct in 200, ${r.sig} borrow a signature word`;
});

check('§6 wildcard: "survives because" is composed from the opposed trait pair', ()=>{
  const r = S6(`(function(){
    const T = TRAITS.filter(t=>t.pol && t.pol.warm);
    const hot = T.filter(t=>t.pol.warm===1).slice(0,3), cold = T.find(t=>t.pol.warm===-1);
    const partial = {}; hot.forEach((t,i)=> partial['x'+i] = {trait:t});
    const lean = strongestLean(partial);
    const why = wildcardSurvivesBecause(cold, lean, partial);
    return {why, again: wildcardSurvivesBecause(cold, lean, partial), cold: cold.trait, hot: hot.map(t=>t.trait)};
  })()`);
  assert(r.why === r.again, 'not deterministic');
  assert(r.why.includes(r.cold.replace(/^['"]|['"]$/g,'')), 'the exception is not named: ' + r.why);
  assert(r.hot.some(h => r.why.includes(h.replace(/^['"]|['"]$/g,''))), 'the trait it cuts against is not named: ' + r.why);
  return r.why.slice(0, 90) + '…';
});

check('§6 context lens: derived conditions cut the "no rule" fallback without overriding rules', ()=>{
  const r = S6(`(function(){
    const mk = ${_s6Sheet}; let tot = 0, none = 0, derived = 0, noneOff = 0;
    for (let s = 1; s <= 25; s++){ const st = mk(6100 + s);
      ['public','private','authority','threat'].forEach(m => {
        contextualView(st, m).slots.forEach(x => { tot++; if (x.rule === 'none') none++; if (x.rule === 'derived') derived++; });
        DERIVED_CONTEXT_ENABLED = false; contextualView(st, m).slots.forEach(x => { if (x.rule === 'none') noneOff++; }); DERIVED_CONTEXT_ENABLED = true;
      }); }
    const tags = derivedContextTags({id:-1, trait:'Stage-fright', desc:'Freezes in front of strangers and audiences.', category:'x'});
    return {tot, none, derived, noneOff, tags};
  })()`);
  assert(r.tags.includes('stranger'), 'text tags missed "strangers": ' + r.tags);
  assert(r.none / r.tot < 0.1, `still ${(100*r.none/r.tot).toFixed(0)}% fallback`);
  assert(r.noneOff - r.none === r.derived, 'derived verdicts replaced something other than the fallback');
  return `fallback ${r.noneOff} → ${r.none} of ${r.tot}`;
});

check('§6 casts: seats are unique, leader and foil always filled, and joint optimisation is seeded and never worse', ()=>{
  const r = S6(`(function(){
    const mk = ${_s6Sheet};
    const ms = [1,2,3,4,5].map(i => ({id:'m'+i, state: mk(6200+i), meta:{name:'M'+i}}));
    const roles = assignCastRoles(ms);
    const run = () => { const drafts = [0,1,2].map(i => ({state: mk(6300+i)})); drafts[1] = {state: drafts[0].state};
      const res = optimiseCastVoices(drafts, 'mech6', () => ({state: withRng(mulberry32(Math.floor(rand()*1e9)), ()=> mk(Math.floor(rand()*1e6)))}));
      return {res, sig: JSON.stringify(drafts.map(d => Object.keys(d.state).map(k => d.state[k] && d.state[k].trait ? d.state[k].trait.id : 0)))}; };
    const a = run(), b = run();
    return {roles: roles.map(x=>x.id), a: a.res, same: a.sig === b.sig};
  })()`);
  assert(new Set(r.roles.filter(x=>x!=='ensemble')).size === r.roles.filter(x=>x!=='ensemble').length, 'a seat was given twice');
  assert(r.roles.includes('leader') && r.roles.includes('foil'), 'no leader/foil: ' + r.roles);
  assert(r.a.after <= r.a.before, `optimisation made it worse ${r.a.before} → ${r.a.after}`);
  assert(r.a.after < r.a.before, 'twins in the draft were not separated');
  assert(r.same, 'optimisation is not reproducible from the seed');
  return `${r.roles.join(', ')}; shared devices ${r.a.before} → ${r.a.after}`;
});

check('§6 generateCast runs the joint optimisation and never ends with more shared devices', ()=>{
  /* Reproducibility of a whole cast from its seed is asserted separately below. */
  G.document._set('castSeed', {value:'s6cast'}); G.document._set('castCount', {value:'4'});
  const r = S6(`(function(){ refreshRelSelectors = function(){}; generateCast(); const o = lastCastOptimisation, n = castStates.length;
    castStates = []; relationshipEdges = []; return {o, n}; })()`);
  G.document._set('castSeed', {value:''});
  assert(r.n === 4, 'cast size ' + r.n);
  assert(r.o && r.o.after <= r.o.before, 'optimisation missing or worse: ' + JSON.stringify(r.o));
  return `shared devices ${r.o.before} → ${r.o.after}`;
});

check('§6 two consecutive casts from the same cast seed are the same cast', ()=>{
  /* A cast build read the session's history (recent traits, slot memory, category use,
     which every generation and every accepted member feeds), so the same cast seed
     rebuilt a different cast once anything had been generated in between. Casts now
     build in replay mode, against empty history. */
  G.document._set('castSeed', {value:'replay-me'}); G.document._set('castCount', {value:'4'});
  const r = S6(`(function(){ refreshRelSelectors = function(){};
    const sig = () => castStates.map(c => Object.keys(c.state).sort().map(k => k + ':' + (c.state[k] && c.state[k].trait ? c.state[k].trait.id : '-')).join(',')).join(' | ');
    generateCast(); const a = sig(), seedA = lastCastSeed;
    generateCast(); const b0 = sig();
    // Ordinary single-character generations in between move the session history
    // (recent traits, slot memory, category use) that a history-aware build reads.
    _runGeneration(); _runGeneration();
    generateCast(); const b = b0 === a ? sig() : 'consecutive casts differed', seedB = lastCastSeed;
    castStates = []; relationshipEdges = []; return {a, b, seedA, seedB}; })()`);
  G.document._set('castSeed', {value:''});
  assert(r.seedA === r.seedB, 'seed label changed between runs');
  assert(r.a.length > 0 && r.a === r.b, 'the same cast seed built two different casts');
  return 'seed ' + r.seedA + ' replays';
});

check('saves written with the removed Appearance section load with those slots dropped', ()=>{
  const st = buildOnce(777);
  const base = Object.keys(st).filter(k => st[k] && st[k].trait).length;
  const oldTrait = {id:94000, section:'Appearance', category:'Build — Imposing', trait:'Takes up slightly more doorway than expected',
    desc:'Just noticeably broad.', example:'(a half-step)', intensity:2, rarity:'common'};
  const legacy = A.compressSlots(st);
  legacy.app_0 = {slotId:'app_0', label:'Appearance — Stature', target:2, trait:{__id:94000, __fb:oldTrait}};
  legacy.app_move = {slotId:'app_move', label:'Appearance — Movement & Bearing', target:2, trait:null, empty:true};
  legacy.wild_0 = {slotId:'wild_0', label:'Wildcard', target:3, trait:{__id:95001, __fb:Object.assign({}, oldTrait, {id:95001})}};
  const r = S6(`(function(){
    const rec = decodeSavedRecord(${JSON.stringify({state: legacy, charMeta:{name:'Old'},
      pinnedTargets:{app_0:2}, traitNotes:{app_mark:'scar'}, charVariants:{app_0:'a'}})}, 'Old');
    const cast = applyCastBundle({format:'character-voice-cast', members:[{id:'x', state: ${JSON.stringify(Object.assign({}, st, {app_mark:{slotId:'app_mark', label:'x', trait:oldTrait}}))}, meta:{name:'Old'}}], edges:[]});
    const members = castStates.map(c => Object.keys(c.state)); castStates = []; relationshipEdges = [];
    restoreSettings({fields:{app_stature:'50'}, toggles:{genAppearance:true},
      constraints:{bannedSections:['Appearance','Humor Style'], requiredCategories:['Movement & Bearing'], intensityCaps:{appearance:3, sheet:40}}});
    const after = {banned:[...bannedSections], req:requiredCategories.slice(), caps:Object.assign({}, intensityCaps)};
    restoreSettings({constraints:{}});
    return {keys:Object.keys(rec.state), pins:Object.keys(rec.pinnedTargets||{}), notes:Object.keys(rec.traitNotes||{}),
      vars:Object.keys(rec.charVariants||{}), orphans:rec.__orphans, lost:rec.__lost, members, after,
      text: sheetToText(rec.state, {name:'Old'}, {})};
  })()`);
  assert(!r.keys.some(k => k.startsWith('app_')), 'an app_ slot survived decode: ' + r.keys.join(','));
  assert(!r.keys.includes('wild_0'), 'an Appearance trait seated by a wildcard survived decode');
  assert(r.keys.length >= base, 'real slots were lost along with the appearance ones');
  assert(!r.pins.length && !r.notes.length && !r.vars.length, 'per-slot data keyed by an app_ slot survived');
  assert(!r.orphans && !r.lost, 'dropped slots were reported as orphans/lost');
  assert(r.members.length === 1 && !r.members[0].some(k => k.startsWith('app_')), 'cast import kept an app_ slot');
  assert(!r.after.banned.includes('Appearance') && r.after.banned.includes('Humor Style'), 'retired section ban not dropped');
  assert(!r.after.req.length && r.after.caps.appearance === undefined && r.after.caps.sheet === 40, 'retired constraints not dropped: ' + JSON.stringify(r.after));
  assert(!/Appearance|How they look/.test(r.text), 'export still mentions the removed section');
  // Undo snapshots and project saves go through expandSlots directly.
  const ex = A.expandSlots(legacy);
  assert(!Object.keys(ex).some(k => k.startsWith('app_')) && !ex.wild_0, 'expandSlots kept a retired slot');
  return r.keys.length + ' slots kept, 3 retired dropped';
});

check('§6 foils: the premise is built from the source sheet\'s wound/lie/want/fear/need/values', ()=>{
  const r = S6(`(function(){
    const mk = ${_s6Sheet}; let built = 0, cited = 0;
    for (let s = 1; s <= 20; s++){ const a = mk(6400+s), b = mk(6500+s);
      const p = foilPremiseFromSheets(a, b, mulberry32(s), {a:'Ann', b:'Bo'}); if (!p) continue; built++;
      const src = Object.values(a).map(x => x && x.trait && x.trait.trait).filter(Boolean);
      if (p.from.some(f => src.includes(f)) || p.from.length) cited++; }
    return {built, cited};
  })()`);
  assert(r.built >= 18, 'only ' + r.built + '/20 sheets produced a sheet-built premise');
  assert(r.cited === r.built, 'a premise did not cite what it was built from');
  return `${r.built}/20 built from the sheets`;
});

check('§6 relationships: asymmetric pairs, triads by balance, factions and shared secrets', ()=>{
  const r = S6(`(function(){
    const mk = ${_s6Sheet};
    const ms = [0,1,2,3].map(i => ({id:'r'+i, state: mk(6600+i), meta:{name:'R'+i}}));
    const [ab, ba] = asymmetricEdgePair(ms[0], ms[1], 'mentor');
    const E = (f, t, trust, extra) => makeEdge(ms[f].id, ms[t].id, null, Object.assign({trust, dependence:3, status:'equal'}, extra || {}));
    // 0+1 friends, 1+2 friends, 0-2 enemies: an unstable triad with 1 in the middle.
    const edges = [E(0,1,5), E(1,2,4), E(0,2,1), E(3,2,3,{knows:'Suspects the old injury.'}), E(0,2,1,{id:'x', knows:'Has noticed the contradiction.'})];
    const web = relationshipWeb(ms, edges);
    const html = relationshipWebHTML(ms, edges);
    return {ab:[ab.status, ab.trust, ab.dependence, ab.role], ba:[ba.status, ba.trust, ba.dependence, ba.role],
      triads: web.triads.map(t => t.kind), secrets: web.secrets.length, factions: web.factions.map(f => f.members.length), svg: /<svg/.test(html)};
  })()`);
  assert(r.ab[0] === 'above' && r.ba[0] === 'below' && r.ba[3] === 'protege', 'mentor pair statuses/roles not mirrored: ' + JSON.stringify(r));
  assert(r.ab[1] !== r.ba[1] && r.ab[2] !== r.ba[2], 'the pair is not asymmetric: ' + JSON.stringify(r));
  assert(r.triads.includes('unstable'), 'friend-of-both triad not flagged unstable: ' + r.triads);
  assert(r.secrets >= 1, 'two people knowing about the same third is not a shared secret');
  assert(r.svg, 'the web view did not draw');
  return `triads ${r.triads.join('/')}; ${r.secrets} secret(s); factions ${r.factions}`;
});

check('§6 pressure: irritated → cornered → broken stages and a recovery sheet, each grounded in cards', ()=>{
  const r = S6(`(function(){
    const st = (${_s6Sheet})(6701);
    const esc = pressureEscalation(st, {__pressure:{level:0.4}}), rec = recoverySheet(st);
    return {ids: esc.stages.map(s=>s.id), current: esc.current, grounded: esc.stages.every(s => s.signs.every(x => x.from.length)),
      rows: rec ? rec.rows.length : 0, recGrounded: rec ? rec.rows.every(x => x.from.length) : false, md: pressureEscalationMarkdown(st, null)};
  })()`);
  assert(r.ids.join() === 'irritated,cornered,broken', 'stages out of order or missing: ' + r.ids);
  assert(r.current === 'irritated', 'a 40% dial should sit at irritated, got ' + r.current);
  assert(r.grounded && r.recGrounded, 'a stage sign or recovery row names no card');
  assert(r.rows >= 4 && /Recovery sheet/.test(r.md), 'recovery sheet too thin: ' + r.rows);
  return `${r.ids.length} stages, ${r.rows} recovery rows`;
});

check('§6 arcs: event text is read against the sheet, steadfast hardens, templates chain', ()=>{
  const r = S6(`(function(){
    const st = (${_s6Sheet})(6801);
    const want = _mxT(st, 'motivation', /Core Want/i);
    const ev = makeArcEvent(1, {shape:'deterioration', title:'x', choice:'lied to get ' + want.trait + ' ' + want.desc});
    const p = parseArcEvent(st, ev);
    const ch = proposeArcChanges(st, ev, []);
    const stead = proposeArcChanges(st, makeArcEvent(2, {shape:'steadfast', title:'y', cost:'Money they cannot quite afford to risk'}), []);
    const tpl = arcTemplateEvents(st, 'corruption-3', []), tpl2 = arcTemplateEvents(st, 'corruption-3', []);
    const fall = arcTemplateEvents(st, 'fall-recovery', []);
    return {hitWant: p.hits.some(h => h.target === 'want'), implied: p.implied, textChange: ch.some(c => c.fromText && /want/.test(c.why)),
      stead: stead.map(c=>c.slotId), tplShapes: tpl.map(e=>e.shape), same: JSON.stringify(tpl) === JSON.stringify(tpl2),
      fallShapes: fall.map(e=>e.shape), valid: tpl.concat(fall).every(e => !validateArcEvent(e).length), unaccepted: tpl.every(e => e.changes.every(c => !c.accepted))};
  })()`);
  assert(r.hitWant && r.textChange, 'a choice naming the Want did not move the Want');
  assert(r.implied === 'deterioration', '"lied" should imply deterioration, got ' + r.implied);
  assert(r.stead.some(s => /^prof_values_/.test(s)), 'steadfast did not deepen Values: ' + r.stead);
  assert(r.tplShapes.join() === 'deterioration,deterioration,deterioration', 'corruption template shapes: ' + r.tplShapes);
  assert(r.fallShapes.join() === 'deterioration,deterioration,growth,growth', 'fall & recovery shapes: ' + r.fallShapes);
  assert(r.same && r.valid && r.unaccepted, 'templates must be deterministic, valid and start unaccepted');
  return `steadfast → ${r.stead.join(', ')}`;
});

check('§6 trait-bank gap sections stay grown, opt-in, and conceptFamily coverage never falls (ratchet)', ()=>{
  /* js/data/traits-gaps.js. The gap sections ship off (a writer chooses them); the grown
     Contradiction Functions pool ships on. Floors are what the pack held when added. */
  const T = A.TRAITS, size = s => T.filter(t => t.section === s).length;
  const FLOOR = {"Romance & Desire":50, "Dialect & Linguistic Background":80, "Beliefs & Worldview":55, "Occupational Jargon":55,
                 "Conversation Mechanics":40, "Body in Speech":38, "Money & Class":38, "Fears & Aversions":36, "Family Talk":34};
  Object.entries(FLOOR).forEach(([s, n]) => assert(size(s) >= n, `${s} fell to ${size(s)} (floor ${n})`));
  const byId = Object.fromEntries(A.PROFILE_SECTIONS.map(ps => [ps.section, ps]));
  Object.keys(FLOOR).forEach(s => { assert(byId[s], `${s} is not a profile section`); assert(byId[s].defaultOn === false, `${s} should ship off`); });
  assert(byId["Contradiction Functions"].defaultOn === true, 'Contradiction Functions should ship on');
  const gaps = T.filter(t => t.pack === 'gaps' || (t.id >= 180000 && t.id <= 189999));
  assert(gaps.every(t => t.reviewStatus), 'gap traits carry a reviewStatus');
  const fam = T.filter(t => t.conceptFamily).length;
  // Floor lowered from 2300 when the Appearance section (and its ~60 family-tagged
  // traits) was removed from the bank; it ratchets from the new baseline.
  assert(fam >= 2240, `conceptFamily coverage fell to ${fam} (floor 2240)`);
  return `${gaps.length} gap traits, conceptFamily ${fam}/${T.length}`;
});

console.log('\n' + (failed ? '\x1b[31m' : '\x1b[32m') + passed + ' passed, ' + failed + ' failed\x1b[0m');
if (failed){
  console.log('\nFailures:');
  failures.forEach(f=>console.log('  - ' + f));
}
process.exit(failed ? 1 : 0);
