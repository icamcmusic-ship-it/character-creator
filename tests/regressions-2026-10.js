/* Regression tests for the October 2026 audit (docs/AUDIT-2026-10.md §1). Same shape as
   tests/regressions.js: called from tests/run.js with its check/group/assert, and every
   check names the finding it pins. */
const fs = require('fs');
const path = require('path');
const {ROOT} = require('./harness');
const {fresh} = require('./regressions');

module.exports = function({check, group, assert}){
  group('Audit 2026-10 §1 regressions');

  /* Frozen replay vectors, built by the released engine (commit 2fb22e6, before the engine-3 pack) with tools/replay-check.js:
     one line per seed, a hash of every seated trait id. A v1 or v2 seed and every share link made from one must build exactly
     the same character for ever; this fails the moment a change reaches a build that is not engine 3. */
  const FROZEN = [
      'v1-63z 1b98c523',
      'v1-c7y 65753390',
      'v1-ibx 22460db',
      'v1-ofw daf08c7d',
      'v1-ujv 27f1212',
      'v1-10nu 285c5b01',
      'v1-16rt c2ae64a7',
      'v1-1cvs 509663ac',
      'v1-1izr e079181c',
      'v1-1p3q 37d202fd',
      'v1-1v7p c9656d3',
      'v1-21bo bae9c315',
      'v1-27fn d842552a',
      'v1-2djm ee9778d2',
      'v1-2jnl bbdcef9e',
      'v1-2prk 968338a8',
      'v2-63z d02b29a5',
      'v2-c7y 3d3c8d79',
      'v2-ibx 3ff3fd12',
      'v2-ofw 3c14e7a',
      'v2-ujv 8d9c40f3',
      'v2-10nu c9cc8c19',
      'v2-16rt bd283575',
      'v2-1cvs 96a4a114',
      'v2-1izr 41788e6d',
      'v2-1p3q eddcf2eb',
      'v2-1v7p cf0ee279',
      'v2-21bo 36bf92ed',
      'v2-27fn 9e82219d',
      'v2-2djm 93a1860f',
      'v2-2jnl edb43275',
      'v2-2prk 1cbd7869'
  ];
  check('V3 v1 and v2 seeds still build the characters the released engine built (frozen vectors)', ()=>{
    const out = require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'tools/replay-check.js'), ROOT, '--n=16', '--v2'], {encoding: 'utf8', maxBuffer: 1 << 24});
    const got = out.split('\n').filter(Boolean);
    const want = FROZEN;
    const wantV1 = want.filter(l => l.startsWith('v1-')), wantV2 = want.filter(l => l.startsWith('v2-'));
    const gotV1 = got.filter(l => l.startsWith('v1-')).slice(0, 16), gotV2 = got.filter(l => l.startsWith('v2-')).slice(0, 16);
    const bad = [];
    wantV1.forEach((l, i) => { if (gotV1[i] !== l) bad.push('v1 ' + l + ' -> ' + gotV1[i]); });
    wantV2.forEach((l, i) => { if (gotV2[i] !== l) bad.push('v2 ' + l + ' -> ' + gotV2[i]); });
    assert(!bad.length, bad.length + ' seeds changed, e.g. ' + bad.slice(0, 2).join('; '));
  });

  check('V3 a v1 or v2 build never sees the engine-3 pack; a v3 build does, and the new sections draw only on v3', ()=>{
    const G = fresh(); const d = G.document;
    const newSecs = ['persuasion','feedback','decision','boundaries','emotion','hospitality','greetings','digital'];
    newSecs.forEach(id => { d._set('sec_' + id, {checked: true}); });
    const sinceCount = pre => { let n = 0, newSec = 0;
      for (let i = 1; i <= 25; i++){ G.gen(pre + (i * 7919).toString(36));
        const r = G.evalIn("(()=>{let a=0,b=0;Object.values(state).forEach(s=>{if(s&&s.trait){if(s.trait.since)a++;if(['Persuasion & Influence','Feedback & Praise','Decision Style','Boundaries & Refusals','Emotion Display Rules','Hospitality & Gifts','Greetings & Farewells','Digital Voice'].includes(s.trait.section))b++;}});return [a,b]})()");
        n += r[0]; newSec += r[1]; }
      return {n, newSec}; };
    const v1 = sinceCount('v1-'), v2 = sinceCount('v2-'), v3 = sinceCount('v3-');
    assert(v1.n === 0 && v2.n === 0 && v1.newSec === 0 && v2.newSec === 0, 'older engines saw the pack: ' + JSON.stringify({v1, v2}));
    assert(v3.n >= 40 && v3.newSec >= 20, 'a v3 build drew too little of the pack: ' + JSON.stringify(v3));
    return JSON.stringify(v3);
  });

  check('V3 voice lab: nine more speech acts on v3 only, an audience that moves the line, and a two-voice exchange', ()=>{
    const G = fresh();
    G.gen('v3-vlab1');
    const r = G.evalIn(`(()=>{
      const v3 = voiceLab(state, 'baseline', 0, charMeta).map(l => l.promptId);
      const plain = composeVoiceLine(state, 'refuse', 'baseline', {index: 0, audience: ''}).text;
      const boss = composeVoiceLine(state, 'refuse', 'baseline', {index: 0, audience: 'authority'});
      const kid = composeVoiceLine(state, 'refuse', 'baseline', {index: 0, audience: 'child'});
      const ex = voiceExchange({state, meta:{name:'A'}}, {state, meta:{name:'B'}}, 'request', 'baseline', '');
      setEngineV(1); const old = voiceLab(state, 'baseline', 0, charMeta).map(l => l.promptId); setEngineV(3);
      return {v3, old, differs: plain !== boss.text || plain !== kid.text, bossRule: boss.rules.some(x => /audience/.test(x)), turns: ex.turns.map(t => t.who + ':' + t.act), reply: ex.reply};
    })()`);
    assert(r.v3.length === 16 && r.old.length === 7, 'speech acts: v3 ' + r.v3.length + ', older ' + r.old.length);
    assert(r.bossRule && r.differs, 'the audience did not show up in the line or its rules');
    assert(r.turns.length === 4 && r.turns[0].startsWith('A:') && r.turns[1].startsWith('B:') && r.reply === 'refuse', 'exchange: ' + JSON.stringify(r.turns));
  });

  check('V3 crossed needs: one character\'s Need against another\'s Defence', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const mk = (cat, trait, desc) => ({trait:{id:1, section:'Motivation & Wound', category:cat, trait, desc, example:'', pol:{}, intensity:3}});
      const A = {state:{prof_motivation_0: mk('The Need (what would actually help)', 'To be able to ask for help without a price', 'Needs to lean on someone and be allowed to.')}, meta:{name:'Asha'}};
      const B = {state:{prof_motivation_1: mk('The Defence (what they built on top)', 'Handles it alone, always', 'Never needs anyone and says so.')}, meta:{name:'Ben'}};
      return {ab: crossedNeeds(A, B), none: crossedNeeds(B, {state:{}, meta:{}})};
    })()`);
    assert(r.ab.length === 1 && r.ab[0].theme === 'help' && r.ab[0].from === 'Asha', 'crossed needs: ' + JSON.stringify(r.ab));
    assert(r.none.length === 0, 'a sheet with no cards crossed something');
  });

  check('V3 about half of v3 blank rolls rotate one switched-off section in (the same seed the same one); v1 and v2 never do; the box turns it off', ()=>{
    const off = () => { const G = fresh(); G.evalIn("PROFILE_SECTIONS.filter(p => p.defaultOn === false).map(p => p.id)").forEach(id => G.document._set('sec_' + id, {checked: false})); return G; };
    const offSecs = "(()=>{const names=new Set(PROFILE_SECTIONS.filter(p=>p.defaultOn===false).map(p=>p.section));return Object.values(state).filter(s=>s&&s.trait&&names.has(s.trait.section)).map(s=>s.trait.section)})()";
    const run = (G, pre) => { let n = 0; const seen = new Set(); for (let i = 1; i <= 40; i++){ G.gen(pre + (i * 104729).toString(36)); const secs = G.evalIn(offSecs); if (secs.length){ n++; secs.forEach(x => seen.add(x)); } } return {n, kinds: seen.size}; };
    const G = off();
    const v1 = run(G, 'v1-'), v2 = run(G, 'v2-'), v3 = run(G, 'v3-');
    assert(v1.n === 0 && v2.n === 0, 'older engines rotated a section in: ' + JSON.stringify({v1, v2}));
    assert(v3.n >= 12 && v3.n <= 34 && v3.kinds >= 5, 'v3 rotation off its rate: ' + JSON.stringify(v3));
    G.gen('v3-' + (3 * 104729).toString(36)); const a = G.sig(); G.gen('v3-' + (3 * 104729).toString(36));
    assert(G.sig() === a, 'a v3 seed rotated differently on a replay');
    G.document._set('rotateSection', {checked: false});
    assert(run(G, 'v3-').n === 0, 'the box did not turn rotation off');
    return JSON.stringify(v3);
  });

  check('V3 the near-duplicate older traits are out of v3 pools only; v1 and v2 pools are untouched', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const dupes = [4327, 4021, 4219, 110085, 2917, 3985, 3841, 4093, 92261, 4533, 5105, 2823, 4540, 2990];
      const pools = v => { setEngineV(v); const ids = new Set(); TRAITS.forEach(t => byFilter(t.section, t.category).forEach(x => ids.add(x.id))); return ids; };
      const p1 = pools(1), p2 = pools(2), p3 = pools(3); setEngineV(1);
      return {v1: dupes.filter(id => p1.has(id)).length, v2: dupes.filter(id => p2.has(id)).length, v3: dupes.filter(id => p3.has(id)).length, resolves: dupes.every(id => TRAITS_BY_ID.has(id))};
    })()`);
    assert(r.v1 === 14 && r.v2 === 14 && r.v3 === 0 && r.resolves, JSON.stringify(r));
  });

  check('V3 freshness ratchet: 100 blank-style sheets reach more of the bank, overlap less and lean less on a few traits than v2 does', ()=>{
    const G = fresh();
    G.evalIn("PROFILE_SECTIONS.filter(p => p.defaultOn === false).map(p => p.id)").forEach(id => G.document._set('sec_' + id, {checked: false}));
    const run = (pre, n) => { const cnt = new Map(); let slots = 0; const sheets = [];
      for (let i = 1; i <= n; i++){ G.gen(pre + (i * 104729).toString(36));
        const ids = G.evalIn("Object.values(state).filter(s=>s&&s.trait).map(s=>s.trait.id)"); sheets.push(new Set(ids)); ids.forEach(id => { cnt.set(id, (cnt.get(id) || 0) + 1); slots++; }); }
      let sh = 0, pairs = 0; for (let a = 0; a < n; a += 3) for (let b = a + 1; b < n; b += 3){ let k = 0; sheets[a].forEach(x => { if (sheets[b].has(x)) k++; }); sh += k / Math.min(sheets[a].size, sheets[b].size); pairs++; }
      const vals = [...cnt.values()].sort((x, y) => x - y); let cum = 0, acc = 0; vals.forEach(v => { cum += v; acc += cum; });
      return {distinct: cnt.size, overlap: sh / pairs, gini: 1 - 2 * (acc / (vals.length * slots)) + 1 / vals.length}; };
    const v2 = run('v2-', 100), v3 = run('v3-', 100);
    assert(v3.distinct >= v2.distinct * 1.05, `v3 reached ${v3.distinct} traits against v2's ${v2.distinct}`);
    assert(v3.overlap <= v2.overlap * 1.15, `v3 sheets overlap clearly more (${v3.overlap.toFixed(4)} against ${v2.overlap.toFixed(4)})`);
    assert(v3.gini < v2.gini, `v3 draws are more concentrated (gini ${v3.gini.toFixed(3)} against ${v2.gini.toFixed(3)})`);
    return `distinct ${v2.distinct} → ${v3.distinct}, overlap ${v2.overlap.toFixed(4)} → ${v3.overlap.toFixed(4)}, gini ${v2.gini.toFixed(3)} → ${v3.gini.toFixed(3)}`;
  });

  check('V3 cast seats: nine seats on v3 for a big cast, six as before otherwise, and a custom seat wins', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const mk = s => ({state: withRng(mulberry32(s), ()=> buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}})), meta:{name:'M'+s}});
      const ms = [1,2,3,4,5,6,7,8,9].map(i => mk(900 + i));
      setEngineV(3); const v3 = assignCastRoles(ms).map(x => x.id);
      setEngineV(1); const v1 = assignCastRoles(ms).map(x => x.id);
      setEngineV(3); ms[2].meta.seat = 'the one who keeps the books'; const custom = assignCastRoles(ms)[2]; setEngineV(1);
      return {v3, v1, custom};
    })()`);
    assert(new Set(r.v3).size === 9 && r.v3.filter(x => x === 'ensemble').length === 0, 'v3 seats: ' + r.v3.join(','));
    assert(r.v1.filter(x => x === 'ensemble').length === 3, 'older engines must keep the six seats: ' + r.v1.join(','));
    assert(r.custom.custom === true && r.custom.label === 'the one who keeps the books' && /sheet reads as/.test(r.custom.why), JSON.stringify(r.custom));
  });

  check('V3 two people under the same pressure, the setting-lens scene, and the two new chain shapes', ()=>{
    const G = fresh();
    G.gen('v3-scene1');
    const r = G.evalIn(`(()=>{
      const A = {state, meta:{name:'Asha'}};
      setEngineV(3); G_lens = null;
      const pp = pairUnderPressure(A, {state: withRng(mulberry32(5), ()=> buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}})), meta:{name:'Ben'}});
      const shapes = new Set();
      for (let s = 1; s <= 80; s++){ const st = withRng(mulberry32(3000 + s), ()=> buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}})); const c = motivationChain(st); if (c) shapes.add(c.shape); }
      setEngineV(1);
      const old = new Set();
      for (let s = 1; s <= 80; s++){ const st = withRng(mulberry32(3000 + s), ()=> buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:{}})); const c = motivationChain(st); if (c) old.add(c.shape); }
      return {pp, shapes: [...shapes], old: [...old]};
    })()`.replace('G_lens = null;', ''));
    assert(r.pp && r.pp.lines.length >= 2 && r.pp.lines.some(l => /Asha|Ben/.test(l)), 'pair pressure: ' + JSON.stringify(r.pp));
    assert(r.shapes.includes('fear') && r.shapes.includes('defence'), 'v3 chain shapes: ' + r.shapes.join(','));
    assert(!r.old.includes('fear') && !r.old.includes('defence'), 'older engines gained chain shapes: ' + r.old.join(','));
  });

  check('V3 counter axes: a "loud but insecure" preset reads insecure; older engines ignore the counter', ()=>{
    const G = fresh(); G.document._set('archetypeSelect', {value: 'bluffingLoudmouth', tagName: 'SELECT', options: [{value: ''}, {value: 'bluffingLoudmouth'}]});
    const mean = pre => { let s = 0; const n = 24; for (let i = 1; i <= n; i++){ G.gen(pre + (i * 7919).toString(36)); s += G.evalIn("axisProfile(state).ego || 0"); } return s / n; };
    const v3 = mean('v3-'), v2 = mean('v2-');
    assert(v3 < v2 - 0.15, `confidence under the counter: v3 ${v3.toFixed(2)} against v2 ${v2.toFixed(2)}`);
    assert(v3 < 0.2, 'the loud-but-insecure preset still reads confident: ' + v3.toFixed(2));
  });

  check('V3 a setting lens gives the backstory, the pressure trigger and the recovery sheet a place; older engines and no lens do not', ()=>{
    const G = fresh(); G.document._set('lensSelect', {value: 'court'});
    G.gen('v3-lens77');
    const on = G.evalIn(`(()=>{ const b = backstoryBeats(state, charMeta).find(x => x.key === 'failure').text, p = pressureChain(state, null).stages.find(s => s.key === 'trigger').text, r = recoverySheet(state, null).rows.find(x => x.key === 'where'); return {b, p, r: r && r.text}; })()`);
    assert(/The setting was/.test(on.b) && /In this setting it tends to arrive as/.test(on.p) && /The aftermath is around/.test(on.r || ''), JSON.stringify(on));
    G.gen('v2-lens77');
    const old = G.evalIn(`(()=>{ const b = backstoryBeats(state, charMeta).find(x => x.key === 'failure').text, r = recoverySheet(state, null).rows.find(x => x.key === 'where'); return {b, r: !!r}; })()`);
    assert(!/The setting was/.test(old.b) && !old.r, 'an older engine used the setting scene');
    G.document._set('lensSelect', {value: ''}); G.gen('v3-lens77');
    assert(G.evalIn('settingScene(state)') === null, 'a scene without a lens');
  });

  check('H1 a trait name carrying markup cannot reach #warnBox as HTML, and the dispatcher refuses built-ins', ()=>{
    const G = fresh(); const d = G.document;
    d._set('warnBox', {});
    G.evalIn(`checkConflicts = ${'function checkConflicts(){}'};`);   // fresh() stubs it out; restore the real one below
    const real = fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8').match(/function checkConflicts\(\)\{[\s\S]*?\n\}\n/)[0];
    G.evalIn(real + `
      checkConflictsFor = function(){ return [{tier:'Strong', tierNote:'<b>note</b>', text:'"<img src=x onerror=window.__pwn=1>" and "<script>1</script>" pull apart.'}]; };
      checkConflicts();`);
    const html = d.getElementById('warnBox').innerHTML;
    assert(!/<img|<script|<b>/i.test(html), 'markup from a trait name reached warnBox unescaped: ' + html.slice(0, 160));
    assert(/&lt;img/.test(html), 'the trait name was dropped instead of escaped');
    const ran = G.evalIn(`(()=>{ const el = {getAttribute:n=>n==='data-act'?'eval':'["globalThis.__ran=1"]'};
      _runAction(el, null, ''); return globalThis.__ran === 1 })()`);
    assert(!ran, 'the dispatcher ran eval on request');
  });

  check('H1 index.html sets a Content-Security-Policy with no unsafe-inline script', ()=>{
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const m = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
    assert(m, 'no CSP meta tag');
    const script = (m[1].match(/script-src([^;]*)/) || [])[1] || '';
    assert(script.trim() === "'self'", "script-src is not 'self' only: " + script);
  });

  check('H1b style-src is self only, and no markup or script writes an inline style="" attribute (js/boot.js applies data-st through the CSSOM)', ()=>{
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const m = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
    const style = (m[1].match(/style-src([^;]*)/) || [])[1] || '';
    assert(style.trim() === "'self'", "style-src is not 'self' only: " + style);
    const bad = [];
    ['index.html','js/render.js','js/app.js','js/generate.js','js/engine.js','js/mechanics.js'].forEach(f=>{
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const hit = src.match(/\sstyle="[^"]*"/); if (hit) bad.push(f + ': ' + hit[0].slice(0, 60));
      if (/setAttribute\(\s*['"]style['"]/.test(src)) bad.push(f + ': setAttribute("style")');
    });
    assert(!bad.length, bad.join('; '));
  });

  check('H2 WEIGHT_MATRIX has no duplicated key, so no later literal can silently replace an earlier one', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'js/engine.js'), 'utf8');
    const start = src.indexOf('const WEIGHT_MATRIX = {');
    const body = src.slice(start, src.indexOf('\n};', start));
    const seen = new Map(), dups = [];
    body.split('\n').forEach((line, i)=>{
      const m = line.match(/^  (?:"([^"]+)"|([A-Za-z_]\w*))\s*:/);
      if (!m) return; const k = m[1] || m[2];
      if (seen.has(k)) dups.push(k); seen.set(k, i);
    });
    assert(seen.size > 40, 'the key scan found only ' + seen.size + ' keys; the pattern no longer matches the literal');
    assert(!dups.length, 'duplicate WEIGHT_MATRIX keys: ' + dups.join(', '));
  });

  check('H2 v2 draws from the full matrix; v1 keeps the links its duplicated keys used to drop', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const out = {};
      ENGINE_V = 2; out.v2 = !!(weightEntry('role:Leader') && weightEntry('role:Leader').grammar && weightEntry('role:Leader').grammar['Turn-Taking Grammar']);
      ENGINE_V = 1; out.v1 = !!(weightEntry('role:Leader') && weightEntry('role:Leader').grammar && weightEntry('role:Leader').grammar['Turn-Taking Grammar']);
      out.stressRepair = ENGINE_V = 2, !!(weightEntry('stress:Flight (remove yourself)').repair);
      out.dropped = Object.values(WEIGHT_MATRIX_LEGACY_DROPPED).reduce((n, k)=>n + Object.values(k).reduce((m, c)=>m + c.length, 0), 0);
      ENGINE_V = 1; return out; })()`);
    assert(r.v2 && !r.v1, 'role:Leader -> Turn-Taking Grammar: v2=' + r.v2 + ' v1=' + r.v1);
    assert(r.stressRepair, 'stress -> Repair links are still dead in v2');
    assert(r.dropped === 39, 'expected 39 legacy-dropped links, found ' + r.dropped);
  });

  check('H3 no trait example or description carries HTML markup (the renderer escapes it, so it shows as raw tags)', ()=>{
    const G = fresh();
    const bad = G.evalIn("TRAITS.filter(t=>/<\\/?[a-z][^>]*>/i.test([t.trait,t.desc,t.example].join(' '))).map(t=>t.id+': '+(t.example||t.desc)).slice(0,5)");
    assert(!bad.length, bad.length + '+ traits carry markup, e.g. ' + bad[0]);
  });

  check('M3 tossing a card whose category was banned toasts "nothing left" instead of throwing', ()=>{
    const G = fresh(); G.gen('rr1');
    const slot = G.evalIn("Object.keys(state).find(k=>/^(manner|vocab)/.test(k) && state[k] && state[k].trait && !state[k].locked)");
    assert(slot, 'no manner or vocabulary slot to toss');
    G.evalIn(`bannedCategories.add(state['${slot}'].trait.category)`);
    let threw = null; try { G.evalIn(`rerollSlot('${slot}')`); } catch(e){ threw = e.message; }
    assert(!threw, 'rerollSlot threw: ' + threw);
    assert(G.evalIn('__toasts.length') > 0, 'no toast told the user nothing could be drawn');
  });

  check('M1 the outlier checkbox and count slider reach the sheet shape on v2, and v1 keeps the shape roll', ()=>{
    const G = fresh(); const d = G.document;
    d._set('wildcardToggle', {checked: true}); d._set('wildcardCount', {value: '1'}); d._set('sheetShapeToggle', {checked: true});
    const wilds = (pre, toggle, count)=>{
      d.getElementById('wildcardToggle').checked = toggle; d.getElementById('wildcardCount').value = String(count);
      const out = [];
      for (let i = 1; i <= 40; i++){ G.gen(pre + (i * 104729).toString(36)); out.push(G.evalIn("Object.keys(state).filter(k=>k.startsWith('wild_')).length")); }
      return out;
    };
    const sum = a => a.reduce((x, y)=>x + y, 0);
    assert(sum(wilds('v2-', false, 1)) === 0, 'v2 still drew outliers with the checkbox off');
    assert(wilds('v2-', true, 2).every(n => n === 2), 'v2 count 2 did not fix the number of outliers at 2');
    assert(wilds('v2-', true, 0).every(n => n === 0), 'v2 count 0 still drew an outlier');
    const free = wilds('v2-', true, 1); assert(new Set(free).size > 1, 'count 1 should leave the number to the sheet shape');
    const v1a = wilds('v1-', true, 1), v1b = wilds('v1-', false, 3);
    assert(JSON.stringify(v1a) === JSON.stringify(v1b), 'the wildcard controls changed what a v1 seed draws');
  });

  check('M2 undo and redo put the seed chip back with the sheet', ()=>{
    const G = fresh();
    G.gen('v2-aaa111'); const a = G.evalIn('lastSeedUsed');
    G.evalIn('snapshotHistory()'); G.gen('v2-bbb222'); const b = G.evalIn('lastSeedUsed');
    assert(a !== b, 'the two builds printed the same seed');
    G.evalIn('undoLast()');
    assert(G.evalIn('lastSeedUsed') === a, 'after undo the seed chip still read ' + G.evalIn('lastSeedUsed') + ', not ' + a);
    G.evalIn('redoLast()');
    assert(G.evalIn('lastSeedUsed') === b, 'after redo the seed chip did not return to ' + b);
  });

  check('M4 M6 a settings or charMeta block of the wrong type is refused before anything is replaced', ()=>{
    const G = fresh();
    const bad = {
      'favouriteTraitIds = 5': {settings: {favouriteTraitIds: 5}},
      'favouriteTraitIds = ["x"]': {settings: {favouriteTraitIds: ['x']}},
      'rerollExclusions = {a:5}': {settings: {rerollExclusions: {a: 5}}},
      'sections.x = null': {settings: {sections: {x: null}}},
      'disabledPacks = 5': {settings: {disabledPacks: 5}},
      'constraints.exclusivePairs = 5': {settings: {constraints: {exclusivePairs: 5}}},
      'constraints.bannedCategories = "abc"': {settings: {constraints: {bannedCategories: 'abc'}}},
      'rarityCaps = "x"': {settings: {constraints: {rarityCaps: 'x'}}},
      'charMeta.lenses = "court"': {charMeta: {lenses: 'court'}},
      'charMeta.name = {a:1}': {charMeta: {name: {a: 1}}},
    };
    Object.entries(bad).forEach(([label, patch])=>{
      let threw = false;
      try { G.evalIn(`validateSheetPayload(${JSON.stringify(Object.assign({format: 'character-voice-sheet', state: {}}, patch))})`); } catch(e){ threw = true; }
      assert(threw, 'accepted: ' + label);
    });
    let ok = true; try { G.evalIn(`validateSettingsBlock({favouriteTraitIds:[1,2], rerollExclusions:{a:[1]}, constraints:{rarityCaps:{common:null}}, sections:{a:{on:true}}, disabledPacks:['life']})`); } catch(e){ ok = e.message; }
    assert(ok === true, 'a well-formed settings block was refused: ' + ok);
    const coerced = G.evalIn(`(()=>{ const p = {format:'character-voice-sheet', state:{}, charMeta:{name:'x', age:42}}; validateSheetPayload(p); return p.charMeta.age; })()`);
    assert(coerced === '42', 'a numeric age from an older file should be coerced to text, got ' + JSON.stringify(coerced));
  });

  check('M5 a saved record with no sheet is refused before any global is touched', ()=>{
    const G = fresh();
    ['{}', '{"charMeta":{"name":"q"}}', '{"state":"abc"}', '{"state":5}', '{"state":[]}'].forEach(raw=>{
      let threw = false;
      try { G.evalIn(`decodeSavedRecord(${raw}, 'x')`); } catch(e){ threw = true; }
      assert(threw, 'decodeSavedRecord accepted ' + raw);
    });
  });

  check('M8 a v2 cast does not get its duplicate stress + attachment pairs back from the optimiser; a v1 cast still builds as it did', ()=>{
    const G = fresh(); const d = G.document;
    d._set('castCount', {value: '5'}); d._set('castSeed', {value: ''}); d._set('castSeedReadout', {});
    d._set('castOptimise', {checked: true}); d._set('castAnchor', {checked: false}); d._set('castSpread', {value: '0.55'});
    G.evalIn("refreshRelSelectors = function(){}; renderCast = function(){};");
    const info = console.info; console.info = () => {};
    try {
      const dups = pre => { let n = 0;
        for (let i = 1; i <= 30; i++){ d.getElementById('castSeed').value = pre + (i * 7919).toString(36);
          n += G.evalIn(`(()=>{ generateCast(); const keys = castStates.map(c => slotCat(c.state.prof_attachment_0) + '|' + slotCat(c.state.prof_stress_0));
            let k = 0; for (let a = 0; a < keys.length; a++) for (let b = a + 1; b < keys.length; b++) if (keys[a] === keys[b]) k++;
            castStates = []; relationshipEdges = []; return k; })()`); }
        return n / 30; };
      const v1 = dups('v1-'), v2 = dups('v2-');
      assert(v2 < 0.1, 'v2 casts still average ' + v2.toFixed(3) + ' duplicate stress + attachment pairs');
      assert(v1 > v2 * 3, 'the v1 path no longer behaves as before (' + v1.toFixed(3) + ' against v2 ' + v2.toFixed(3) + ')');
      d.getElementById('castSeed').value = '';
      G.evalIn("generateCast(); castStates = []; relationshipEdges = [];");
      assert(/^v3-/.test(G.evalIn('lastCastSeed')), 'a fresh cast did not print a v3 seed: ' + G.evalIn('lastCastSeed'));
    } finally { console.info = info; }
  });

  check('M9 a retired trait costs the exploration candidate that carries it (and nothing else changes without retiring)', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const build = seed => { document.getElementById('seedInput').value = seed; _runGeneration(); return JSON.parse(JSON.stringify(compressSlots(state))); };
      const A = expandSlots(build('m9-a')), B = expandSlots(build('m9-b'));
      const idsOf = st => Object.values(st).filter(s => s && s.trait).map(s => s.trait.id);
      const cands = () => [{state: A, coherence: 50}, {state: B, coherence: 50}];
      setRetiredTraits([]); const none = selectDistinctCandidate(cands(), []).index;
      setRetiredTraits(idsOf(A)); const retA = selectDistinctCandidate(cands(), []).index;
      setRetiredTraits(idsOf(B)); const retB = selectDistinctCandidate(cands(), []).index;
      setRetiredTraits([]);
      return {none, retA, retB}; })()`);
    assert(r.retA === 1, 'with A retired the build still kept A (index ' + r.retA + ')');
    assert(r.retB === 0, 'with B retired the build still kept B (index ' + r.retB + ')');
    assert(r.none === 0, 'with nothing retired the first candidate should win a tie');
  });

  check('M10 the voice lab markdown is the take on screen, not take zero', ()=>{
    const G = fresh(); G.gen('m10-seed');
    const r = G.evalIn(`(()=>{
      const shown = voiceLab(state, 'baseline', 3, charMeta).map(l => l.text);
      const md = voiceLabToMarkdown(state, 'baseline', 3, charMeta), md0 = voiceLabToMarkdown(state, 'baseline');
      return {inMd: shown.every(t => md.includes(t)), zeroDiffers: md0 !== md}; })()`);
    assert(r.inMd, 'the exported text is not the take the panel shows');
    assert(r.zeroDiffers, 'take 3 and take 0 were identical, so this check proves nothing');
  });

  check('M13 a blank seed box uses the current engine whatever an old save wrote to the hidden field; Reset names the engine', ()=>{
    const G = fresh(); G.document._set('engineVersion', {value: '1'});
    const r = G.evalIn("({blank: engineVersionFor(''), typed: engineVersionFor('a typed phrase'), v2: engineVersionFor('v2-abc'), v1: engineVersionFor('v1-abc'), def: DEFAULTS.fields.engineVersion})");
    assert(r.blank === 3, 'a blank box built with engine ' + r.blank + ' after an old save set the field to 1');
    assert(r.typed === 1 && r.v1 === 1 && r.v2 === 2, 'typed phrases and prefixed seeds must still pick their own engine: ' + JSON.stringify(r));
    assert(r.def === '3', 'DEFAULTS.fields has no engineVersion, so Reset reads the (overwritten) defaultValue');
  });

  check('M12 Reset puts content packs and slider locks back', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    const body = src.slice(src.indexOf('async function resetAllToDefaults'), src.indexOf('function randomRawSlider'));
    assert(/setDisabledPacks\(\[\]\)/.test(body), 'Reset does not re-enable content packs');
    assert(/input\[id\^="lock_"\]/.test(body), 'Reset does not release slider locks');
  });

  check('T1-T6 generated prose has no "They reads", doubled articles, "that That", leaked category glosses or slug names in the pressure and conflict text', ()=>{
    const G = fresh(); G.document._set('stressToggle', {checked: true});
    const bad = {
      'They reads': /\bThey reads\b/, 'doubled article': /\b(the|a|an) \1\b/i, 'that That': /\bthat That\b/,
      'category gloss': /\((?:conscious goal|what they built on top)[^)]*\)/, 'slug after "looks like"': /looks like <?b?>?[A-Za-z']+-[A-Za-z']+-[A-Za-z']+/,
    };
    const found = {};
    for (let i = 1; i <= 80; i++){
      G.gen((i % 2 ? 'v1-' : 'v2-') + (i * 7919).toString(36));
      const text = G.evalIn("sheetToText(state, charMeta, pressureState)").split('\n').filter(l => !/^\s*- \*/.test(l)).join('\n').replace(/\(from: [^)]*\)/g, '');
      Object.entries(bad).forEach(([k, re]) => { const m = re.exec(text); if (m && !found[k]) found[k] = '[' + m[0] + '] ' + text.slice(Math.max(0, m.index - 40), m.index + 50).replace(/\n/g, ' '); });
    }
    assert(!Object.keys(found).length, 'prose defects: ' + JSON.stringify(found));
  });

  check('T8 a voice line never has two ellipses side by side or a doubled article', ()=>{
    const G = fresh(); let n = 0, bad = null;
    for (let i = 1; i <= 60 && !bad; i++){
      G.gen('v2-' + (i * 7919).toString(36));
      const lines = G.evalIn("(()=>{ const out = []; ['baseline','pressure'].forEach(m => voiceLab(state, m, 0, charMeta).forEach(l => out.push(l.text))); return out; })()");
      lines.forEach(l => { n++; if (/(\.\.\.|…)\s*(\.\.\.|…)/.test(l) || /\b(the|a|an) \1\b/i.test(l)) bad = bad || l; });
    }
    assert(n > 300, 'only ' + n + ' voice lines were checked');
    assert(!bad, 'a voice line has doubled punctuation or a doubled article: ' + bad);
  });

  check('L1 an apostrophe or backslash in a name is shown as typed in an attribute, not with an added backslash', ()=>{
    const G = fresh();
    const r = G.evalIn("escAttr(\"O'Brien \\\\ \\\"x\\\" <b>\")");
    assert((r.match(/\\/g) || []).length === 1, 'escAttr changed the number of backslashes: ' + r);
    assert(/O(&#39;|')Brien/.test(r), 'the apostrophe was lost or escaped with a backslash: ' + r);
    assert(!/[<>"]/.test(r), 'escAttr left markup characters: ' + r);
  });

  check('L6 a damaged share link says so; a hash with no link in it is not an error', ()=>{
    const G = fresh();
    const tryHash = h => { try { return {ok: G.evalIn(`readShareFromHash(${JSON.stringify(h)})`)}; } catch(e){ return {err: e.message}; } };
    assert(tryHash('#share=').err, '"#share=" was treated as no link');
    assert(tryHash('#share=!!!notbase64').err, 'a link with characters a link never has was treated as no link');
    assert(tryHash('#something-else').ok === null, 'an unrelated hash was treated as a link');
    assert(tryHash('').ok === null, 'an empty hash was treated as a link');
  });

  check('L3 the two personality switches move together', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert(/id="genPersonality"[^>]*data-act="syncPersonalityToggles"/.test(src), 'the Generate-row switch is not wired to sync');
    assert(/id="personalityToggle"[^>]*data-act="syncPersonalityToggles"/.test(src), 'the Advanced switch is not wired to sync');
    const G = fresh(); G.document._set('genPersonality', {checked: false}); G.document._set('personalityToggle', {checked: true});
    G.evalIn("syncPersonalityToggles('gen')");
    assert(G.document.getElementById('personalityToggle').checked === false, 'turning the Generate-row switch off left the Advanced switch on');
  });

  check('D1 D2 D4 no two traits share a name or an example line, and the intelligence insults are gone', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const norm = s => String(s || '').toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\\s+/g, ' ').trim();
      const dup = key => { const m = new Map(); TRAITS.forEach(t => { const k = norm(t[key]); if (k) (m.get(k) || m.set(k, []).get(k)).push(t.id); }); return [...m.values()].filter(a => a.length > 1).map(a => a.join('/')); };
      const insult = TRAITS.filter(t => /simple-minded|dimwit|unhinged/i.test(t.trait)).map(t => t.id + ' ' + t.trait);
      return {names: dup('trait'), examples: dup('example'), insult}; })()`);
    assert(!r.names.length, 'duplicate trait names: ' + r.names.join(', '));
    assert(!r.examples.length, 'duplicate example lines: ' + r.examples.join(', '));
    assert(!r.insult.length, 'insulting names remain: ' + r.insult.join(', '));
  });

  check('D4 renaming a trait does not move it between presentation variants or tiers (variantPin, tierPin)', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{ const get = id => TRAITS.find(t => t.id === id);
      return {v: [1332, 140377, 140384, 140390, 1316].map(id => get(id).variant), tier: get(1316).tier, pinned: TRAITS.filter(t => t.variantPin || t.tierPin).length}; })()`);
    assert(r.v.every(v => v === 'b'), 'a renamed trait lost its variant: ' + JSON.stringify(r.v));
    assert(r.tier === 'secondary', 'a renamed trait lost its tier: ' + r.tier);
    assert(r.pinned >= 5, 'the pins are not in the data');
  });

  check('D7 trait names and descriptions use British spelling (-ise, -our, -ence), so one sheet does not mix both', ()=>{
    const G = fresh();
    const bad = G.evalIn(`(()=>{ const KEEP = /(size|sizes|sized|sizing|prize|prizes|seize|seizes|seized|seizing)$/i;
      const re = /[A-Za-z]+/g, out = [];
      TRAITS.forEach(t => [t.trait, t.desc].forEach(s => (String(s).match(re) || []).forEach(w => {
        const l = w.toLowerCase();
        if (!KEEP.test(l) && (/(iz)(e|es|ed|ing|er|ers|ation|ations)$/.test(l) || /^(humor|color|behavior|favor|honor|labor|rumor|flavor|neighbor|defense|offense|center|traveler|jewelry|gray)/.test(l)) && !/^(humorous|humorously|humorist|humorists|honorific|honorifics|honorary)$/.test(l)) out.push(t.id + ' ' + w);
      })));
      return out.slice(0, 8); })()`);
    assert(!bad.length, 'American spellings remain: ' + bad.join(', '));
  });
};
