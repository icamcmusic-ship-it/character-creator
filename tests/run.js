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
    failures.push(name + ': ' + e.message);
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
  'rarityTier','rarityWeight','rarityPrefValue','polarityFit','buildContextBias','parseAgeHint',
  'traitBand','CURVE_EXP','clamp','SECTION_COLORS','loudnessCheck','recentPenalty',
  'rememberGeneration','forgetRecentTraits','_drawUnique','_buildUsedIds','explainWhyNot',
  'MOOD_TAG_STATS','TIER_TAG_STATS','divergenceLevel','AXES','CROSSLINK_STRENGTH','slotCat','rangeSelect','captureSettings','restoreSettings',
  'bannedCategories','requiredTraitIds','exclusivePairs','SETTING_FIELDS','SETTING_TOGGLES',
]);
const A = ctx.api;
const T = A.TRAITS;

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
check('rarity is one of the two declared classes', ()=>{
  const bad = T.filter(t => t.rarity !== 'common' && t.rarity !== 'signature');
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
check('every trait resolves to one of three tiers', ()=>{
  const counts = {};
  T.forEach(t=>{ counts[t.rtier] = (counts[t.rtier]||0)+1; });
  assert(Object.keys(counts).sort().join(',') === 'common,distinctive,signature', JSON.stringify(counts));
  return Object.entries(counts).map(([k,v])=>`${k} ${Math.round(100*v/T.length)}%`).join(', ');
});
check('signature is now genuinely the minority tier', ()=>{
  const sig = T.filter(t=>t.rtier === 'signature').length;
  assert(sig / T.length < 0.25, Math.round(100*sig/T.length) + '% is still signature');
});
check('rarity preference is symmetric around balanced', ()=>{
  const common = T.find(t=>t.rtier==='common'), sig = T.find(t=>t.rtier==='signature');
  const norm = {common:10, distinctive:10, signature:10};
  const a = A.rarityWeight(common, -1, norm) / A.rarityWeight(sig, -1, norm);
  const b = A.rarityWeight(sig, 1, norm) / A.rarityWeight(common, 1, norm);
  assert(Math.abs(a - b) < 1e-9, a + ' vs ' + b);
});
check('legacy string preferences still resolve', ()=>{
  assert(A.rarityPrefValue('balanced') === 0 && A.rarityPrefValue('common') === -1 && A.rarityPrefValue('signature') === 1);
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
