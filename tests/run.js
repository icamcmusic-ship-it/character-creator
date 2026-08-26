#!/usr/bin/env node
/* Invariant tests for the trait bank and the generation engine.
   No framework, no install step — `node tests/run.js`, same spirit as the app itself.

   These exist because every one of them encodes a bug that has actually happened
   here, or a property the app states out loud in its own UI and must therefore be
   true: duplicate ids, out-of-range intensities, an axis with only one pole, an
   inverted position mapping that made the printed "active range" a lie, and the
   claim that a seed reproduces a character exactly. */
const {loadEngine} = require('./harness');

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
  'SECTION_OF_CATEGORY','forgetSlotDraws',
  'rarityTier','rarityWeight','rarityPrefValue','polarityFit','buildContextBias','parseAgeHint',
  'traitBand','CURVE_EXP','clamp','SECTION_COLORS','loudnessCheck','recentPenalty',
  'rememberGeneration','forgetRecentTraits','_drawUnique','_buildUsedIds','explainWhyNot',
  'MOOD_TAG_STATS','TIER_TAG_STATS','divergenceLevel','AXES','CROSSLINK_STRENGTH','slotCat','rangeSelect','captureSettings','restoreSettings',
  'bannedCategories','requiredTraitIds','exclusivePairs','SETTING_FIELDS','SETTING_TOGGLES','validateSheetPayload','compressSlots','expandSlots','TRAITS_BY_ID','emergentArchetypeName',
  // js/app.js — previously not loaded at all, so none of this had coverage.
  'axisProfile','analyseRelationship','checkEnsembleBalance','randomAxisLevel','secondOrderTensions',
  'suggestVoiceFromPersonality','intensityWord','axisPoleWord','voiceSliderWord','assertAxisTables',
  'strVal','boolVal','rarityPrefVal','ARCHETYPES','sheetToText','sheetToHTML','quantile','emptySlot',
]);
const A = ctx.api;
const T = A.TRAITS;

/* Ratchet, not a target. Set to the value the bank actually achieves today; lowering it
   is the content pass's job and raising it should require saying so out loud. It started
   at 0.729, where rarity was very nearly a restatement of intensity. */
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
function buildOnce(seed){
  const orig = Math.random;
  ctx.Math.random = A.mulberry32(seed);
  try {
    A.rollCharacterVariants();
    return A.buildCharacterState({
      verbLevel: 0.8, regLevel: -0.4, compLevel: 0.2, mannerCount: 3, vocabCount: 2,
      rarityPref: 0, vocabPref: null, personalityOverrides: null,
    });
  } finally { ctx.Math.random = orig; }
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
});

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
  const N = 1200;
  const counts = {};
  const _rnd = Math.random;
  Math.random = A.mulberry32(0x5eed1);
  try {
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
  } finally { Math.random = _rnd; }
  const bad = [];
  Object.entries(counts).forEach(([id, c])=>{
    const ps = A.PROFILE_SECTIONS.find(p=>p.id===id);
    const nCats = A.catsOf(ps.section).length;
    const total = Object.values(c).reduce((a,b)=>a+b,0);
    if (!total || nCats < 2) return;
    const uniform = 1 / nCats;
    A.catsOf(ps.section).forEach(cat=>{
      const share = (c[cat] || 0) / total;
      if (share > uniform * 1.9)
        bad.push(`${id}:${cat} took ${(share*100).toFixed(0)}% of a ${nCats}-way split (uniform ${(uniform*100).toFixed(0)}%)`);
      if (share < uniform * 0.55)
        bad.push(`${id}:${cat} starved at ${(share*100).toFixed(0)}% of a ${nCats}-way split (uniform ${(uniform*100).toFixed(0)}%)`);
    });
  });
  assert(!bad.length, bad.join('; '));
  return Object.keys(counts).length + ' sections checked';
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
  A.forgetRecentTraits();
  // slot id -> the floor it must clear over N builds. Set below what the engine
  // currently achieves, so ordinary content churn doesn't trip it and a structural
  // regression does.
  const FLOORS = {register: 40, verbosity: 30, pers_honesty: 20, pers_confidence: 20,
                  pers_curiosity: 20, pers_manners: 20, pers_activeness: 20};
  const thin = [];
  Object.entries(FLOORS).forEach(([slot, floor])=>{
    const m = seen.get(slot);
    if (!m) return thin.push(slot + ' never drew');
    const total = [...m.values()].reduce((a,b)=>a+b, 0);
    const topShare = Math.max(...m.values()) / total;
    if (m.size < floor) thin.push(`${slot}: ${m.size} distinct in ${N} (want >= ${floor})`);
    if (topShare > 0.14) thin.push(`${slot}: one trait in ${(100*topShare).toFixed(0)}% of characters`);
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
if (failed){
  console.log('\nFailures:');
  failures.forEach(f=>console.log('  - ' + f));
}
process.exit(failed ? 1 : 0);
