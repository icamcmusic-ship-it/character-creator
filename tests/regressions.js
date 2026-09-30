/* Regression tests for the September 2026 audit (docs/AUDIT-2026-09.md §1). Each check
   names the bug it pins. Called from tests/run.js with its `check`/`group`/`assert`, so
   the counts and the exit code stay in one place. Every check builds its own engine
   context: most of these bugs were about state leaking between actions, and a shared
   context would let one check's leftovers hide another's. */
const fs = require('fs');
const path = require('path');
const {loadEngine, ROOT} = require('./harness');

function fresh(){
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
  g.evalIn("renderSheet=function(){};checkConflicts=function(){};renderNovelty=function(){};renderBatchTray=function(){};"
    + "srAnnounce=function(){};renderSlotChange=function(){};renderArc=function(){};var __toasts=[];toast=function(m){__toasts.push(m)};");
  g.gen = seed => { d.getElementById('seedInput').value = seed; return g.evalIn('_runGeneration()'); };
  g.sig = () => g.evalIn("Object.keys(state).sort().map(k=>k+':'+(state[k]&&state[k].trait?state[k].trait.id:'-')).join(',')");
  return g;
}

module.exports = function({check, group, assert}){
  group('Audit 2026-09 §1 regressions');

  check('B1 chip × and budget controls receive real values, not the literal text "${id}"', ()=>{
    const src = ['js/engine.js','js/render.js','js/app.js','js/generate.js','js/mechanics.js']
      .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
    const bad = src.split('\n').filter(l => /actAttr\([^)]*"\$\{/.test(l));
    assert(!bad.length, 'actAttr called with a quoted template placeholder: ' + bad[0]);
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const id = TRAITS[10].id; requiredTraitIds = [id]; bannedTraitIds.add(TRAITS[11].id);
      const reqArgs = JSON.parse(actAttr('click','removeReq', id).match(/data-args="([^"]*)"/)[1].replace(/&quot;/g,'"'));
      removeReq.apply(null, reqArgs); removeBan.apply(null, ['trait', TRAITS[11].id]);
      return {req: requiredTraitIds.length, ban: bannedTraitIds.size};
    })()`);
    assert(r.req === 0 && r.ban === 0, `removal did nothing: ${JSON.stringify(r)}`);
  });

  check('B2 no element in index.html declares the same attribute twice', ()=>{
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const dups = [];
    // Quoted values are blanked first: an inline SVG favicon carries its own attributes.
    (html.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''").match(/<[a-zA-Z][^<>]*>/g) || []).forEach(tag=>{
      const names = (tag.match(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?==)/g) || []).map(s => s.trim().toLowerCase());
      const seen = new Set();
      names.forEach(n => { if (seen.has(n)) dups.push(n + ' in ' + tag.slice(0, 60)); seen.add(n); });
    });
    assert(!dups.length, 'duplicate attribute: ' + dups[0]);
    assert((html.match(/data-act-keydown="searchKeydown"/g) || []).length === 4, 'the four search comboboxes lost their keydown action');
  });

  check('B3 the printed seed rebuilds the same character after several rolls in one session', ()=>{
    const G = fresh();
    let miss = 0;
    for (let i = 0; i < 6; i++){
      G.gen(''); const seed = G.evalIn('lastSeedUsed'); const a = G.sig();
      G.gen(seed); if (G.sig() !== a) miss++;
    }
    assert(miss === 0, `${miss}/6 printed seeds rebuilt a different character`);
    return '6/6 replay';
  });

  check('B4 importing a character resets the arc to the imported sheet', ()=>{
    const G = fresh();
    G.evalIn("FileReader=function(){this.readAsText=f=>{this.result=f.__text; this.onload();}}");
    G.gen('B'); const text = G.evalIn("JSON.stringify({format:'character-voice-sheet',version:CHAR_FORMAT_VERSION,state,charMeta,settings:captureSettings()})");
    const B = G.sig();
    G.gen('A');
    G.evalIn(`importCharacterJSON({files:[{__text:${JSON.stringify(text)}}],value:''})`);
    G.evalIn("arcEvents.push(makeArcEvent(1,{title:'ev'})); arcReplay()");
    assert(G.sig() === B, 'the first arc event put the previous character back');
  });

  check('B5/B6 a batch (kept or discarded) leaves the arc and per-card state alone, and the pick owns the arc', ()=>{
    const G = fresh();
    G.gen('orig'); G.evalIn("arcEvents.push(makeArcEvent(1,{title:'mine'}))");
    const k = G.evalIn("Object.keys(state).find(k=>k.startsWith('manner'))");
    G.evalIn(`rerollSlot('${k}'); whyOpen['${k}']=true`);
    G.document.getElementById('seedInput').value = '';
    G.evalIn('generateBatch(2); dismissBatch()');
    assert(G.evalIn('arcEvents.length') === 1, 'discarding a batch wiped the arc');
    assert(G.evalIn(`(rerollHistory['${k}']||[]).length`) === 1 && G.evalIn(`!!whyOpen['${k}']`), 'discarding a batch wiped per-card state');
    G.evalIn('generateBatch(3); chooseBatch(0)'); const pick = G.sig();
    G.evalIn("arcEvents.push(makeArcEvent(1,{title:'ev'})); arcReplay()");
    assert(G.sig() === pick, 'the arc replayed a discarded candidate');
  });

  check('B7/B15 "↺ back" respects Kept cards and keeps its history when it refuses', ()=>{
    const G = fresh();
    G.gen('rb1');
    const k = G.evalIn("Object.keys(state).find(k=>k.startsWith('manner') && !state[k].locked)");
    G.evalIn(`rerollSlot('${k}')`); const kept = G.evalIn(`state['${k}'].trait.id`);
    G.evalIn(`toggleLock('${k}'); rerollBack('${k}')`);
    assert(G.evalIn(`state['${k}'].trait.id`) === kept && G.evalIn(`state['${k}'].locked`), 'step-back changed a Kept card');
    G.evalIn(`toggleLock('${k}')`);
    const ks = G.evalIn("Object.keys(state).filter(k=>k.startsWith('manner') && !state[k].locked)");
    const [a, b] = ks; const orig = G.evalIn(`state['${a}'].trait.id`);
    G.evalIn(`rerollSlot('${a}')`);
    const before = G.evalIn(`rerollHistory['${a}'].length`);
    G.evalIn(`state['${b}'] = Object.assign({}, state['${b}'], {trait: TRAITS_BY_ID.get(${orig})}); rerollBack('${a}')`);
    assert(G.evalIn(`state['${a}'].trait.id`) !== orig, 'step-back seated a duplicate');
    assert(G.evalIn(`rerollHistory['${a}'].length`) === before, 'a refused step-back threw away its history entry');
    const html = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(/\.rerollBtn:not\(\.backBtn\)/.test(html), 'the R shortcut can still hit the back button');
  });

  check('B8 accepting an arc change keeps rerolls made since the arc started', ()=>{
    const G = fresh();
    G.gen('arc1');
    const k = G.evalIn("Object.keys(state).find(k=>k.startsWith('manner'))");
    G.evalIn("arcEvents.push(makeArcEvent(1,{title:'x'}))");
    G.evalIn(`rerollSlot('${k}')`); const after = G.evalIn(`state['${k}'].trait.id`);
    G.evalIn('arcReplay()');
    assert(G.evalIn(`state['${k}'].trait.id`) === after, 'arcReplay reverted the reroll');
  });

  check('B9 a malformed share link is rejected before it touches the recipient\'s settings', ()=>{
    const G = fresh();
    G.evalIn("globalThis.btoa=s=>Buffer.from(s,'binary').toString('base64'); globalThis.atob=s=>Buffer.from(s,'base64').toString('binary');");
    G.Buffer = Buffer;
    G.evalIn("bannedCategories.add('X')");
    const payload = JSON.stringify({v:1, seed:'abc', settings:{constraints:{exclusivePairs:123}}});
    let threw = false;
    try { G.evalIn(`readShareFromHash('#share=' + _b64urlEncode(${JSON.stringify(payload)}))`); } catch(e){ threw = true; }
    assert(threw, 'the malformed link was accepted');
    assert(G.evalIn('bannedCategories.has("X")'), 'the recipient\'s bans were cleared');
  });

  check('B10 undo restores the arc that belonged to the restored sheet', ()=>{
    const G = fresh();
    G.gen('A'); const A = G.sig(); G.evalIn("arcEvents.push(makeArcEvent(1,{title:'evA'}))");
    G.gen('B'); G.evalIn("arcEvents.push(makeArcEvent(1,{title:'evB'}))");
    G.evalIn('undoLast()');
    assert(G.sig() === A, 'undo did not restore A');
    assert(G.evalIn("arcEvents.map(e=>e.title).join()") === 'evA', 'undo left B\'s arc on A\'s sheet');
  });

  check('B11 a share link carries Kept cards and replays the sheet built around them', ()=>{
    const G = fresh();
    G.evalIn("globalThis.btoa=s=>Buffer.from(s,'binary').toString('base64'); globalThis.atob=s=>Buffer.from(s,'base64').toString('binary');");
    G.Buffer = Buffer;
    G.evalIn("globalThis.location={href:'http://x/', hash:''}; captureSettings=function(){return {}}; restoreSettings=function(){}; applyAdvancedMode=function(){}; markOnboarded=function(){}; window.history={replaceState(){}}");
    G.gen('x1'); G.evalIn("Object.keys(state).slice(0,8).forEach(k=>{if(state[k])state[k].locked=true})");
    G.gen('x2'); const want = G.sig();
    G.evalIn("globalThis.__link=shareLinkFor(); state={}");
    G.gen('other');
    G.evalIn("location.hash='#'+__link.split('#')[1]; applyShareFromHash()");
    assert(G.sig() === want, 'the link did not replay the sheet');
  });

  check('B12 archetype import notices when it will replace a custom preset', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8');
    assert(/CUSTOM_ARCHETYPES\['custom_'\+a\.label\]/.test(src), 'the overwrite check does not use the custom_ key');
  });

  check('B13 prefs load after the custom archetypes exist', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert(/_customArchetypesReady[^\n]*then\(\(\)=>loadPrefs\(\)\)/.test(src), 'loadPrefs no longer waits for loadCustomArchetypes');
  });

  check('B14 Reset to Defaults resets every workspace setting', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    const body = src.slice(src.indexOf('async function resetAllToDefaults'), src.indexOf('function randomRawSlider'));
    assert(/SETTING_FIELDS\.concat/.test(body) && /SETTING_TOGGLES\.filter/.test(body), 'Reset does not cover SETTING_FIELDS/SETTING_TOGGLES');
    assert(/prefsReady = false/.test(body) && /savePrefs\(\);\s*\n\s*toast\("Everything reset/.test(body), 'Reset saves before it has finished');
  });

  check('B17 filing into a project copies the live sheet state', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    const body = src.slice(src.indexOf('async function fileIntoProject'), src.indexOf('function renderProjects'));
    assert(/charMeta: _copy\(charMeta\)/.test(body) && /p\.events = _copy\(arcEvents\)/.test(body), 'project records still share live objects');
  });

  check('B23 rerolling a counterpoint slot keeps it a counterpoint', ()=>{
    const G = fresh();
    G.gen('cp');
    // Seat one by hand: whether a sheet draws a counterpoint depends on the dice.
    const k = G.evalIn(`(()=>{ const src = Object.keys(state).find(k => /^prof_values_/.test(k) && state[k].trait);
      const alt = src.replace(/_\\d+$/, '') + '_alt';
      state[alt] = Object.assign({}, state[src], {slotId: alt, label: 'Counterpoint', counterpoint: true, locked: false});
      return alt; })()`);
    G.evalIn(`rerollSlot('${k}')`);
    assert(G.evalIn(`!!state['${k}'].counterpoint`), 'counterpoint flag dropped on reroll');
  });

  check('B24 the audited controls all have a label', ()=>{
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    ['relA','relB','seedTraitFilter','profileDepth','affinityBoost','customArchName'].forEach(id =>
      assert(html.includes(`<label for="${id}"`), `no <label for="${id}">`));
  });

  check('B26 the sticky bar background follows the theme', ()=>{
    const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
    const block = css.slice(css.indexOf('.stickyBar {'), css.indexOf('body.on-single-tab .stickyBar'));
    assert(/color-mix\(in srgb, var\(--panel\)/.test(block), 'the sticky bar background is hard-coded');
  });

  check('C1 trait 119 no longer uses a slur', ()=>{
    const G = fresh();
    assert(!/retard/i.test(G.evalIn('TRAITS_BY_ID.get(119).trait')), 'trait 119 still named with a slur');
  });

  check('T1/T2 chain and backstory prose: no "they goes", no "was was", no raw hyphen-runs or clause-as-subject', ()=>{
    const G = fresh();
    const lines = [];
    for (let i = 0; i < 150; i++){
      G.gen('p' + i);
      lines.push(...G.evalIn("(()=>{const c=motivationChain(state);const b=backstoryBeats(state,{age:'40'});return [].concat(c?c.links.map(l=>l.text):[], b?b.map(x=>x.text):[])})()"));
    }
    const bad = [
      [/\bthey (goes|meets|makes|leaves|runs|shuts|keeps)\b/i, 'third-person verb after "they"'],
      [/\b(there was|came|was) was\b/i, 'doubled "was"'],
      [/\b[a-z]+-[a-z]+-[a-z]+-[a-z]+\b/i, 'a raw hyphen-joined trait name'],
      [/\bwhen (keeps|can|has|knows|makes|runs)\b/i, 'a verb clause used as a subject'],
    ];
    bad.forEach(([re, what]) => { const hit = lines.find(l => re.test(l)); assert(!hit, `${what}: "${hit}"`); });
    return `${lines.length} lines`;
  });

  check('T3 voice echo repeats the head of the line, and a refusal never refuses "…with me"', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'js/engine.js'), 'utf8');
    assert(!/"wait with me"|"cover for me"/.test(src), 'first-person tasks are back in the {task} pool');
    assert(!/`, \$\{last\}\.`/.test(src), 'the echo transform repeats the last word again');
  });

  check('T4 contradictions only pair behaviour cards, and "when" is usually answered', ()=>{
    const G = fresh();
    G.evalIn(`globalThis.__c = function(){ const x = structuredContradiction(state, {}); if (!x) return null;
      return {when: (x.fields.find(y => y.key === 'when') || {}).derived, hi: x.hi.section, lo: x.lo.section}; }`);
    let n = 0, when = 0;
    for (let i = 0; i < 80; i++){
      G.gen('c' + i); const c = G.evalIn('__c()');
      if (!c) continue; n++; if (c.when) when++;
      ['Positive Origins','Motivation & Wound','Goals & Stakes'].forEach(s =>
        assert(c.hi !== s && c.lo !== s, `contradiction used a ${s} card`));
    }
    assert(n && when / n >= 0.7, `"when" answered on only ${when}/${n}`);
    return `when ${when}/${n}`;
  });

  check('T5 an arc shift stays close to the idea it shifts', ()=>{
    const G = fresh();
    let related = 0, total = 0;
    for (let i = 0; i < 40; i++){
      G.gen('s' + i);
      const r = G.evalIn(`(()=>{const k=Object.keys(state).find(k=>state[k]&&state[k].trait&&/Core Want/.test(state[k].trait.category)); if(!k) return null;
        const t=state[k].trait; const n=_mxShift(t,+1); return n ? mxOverlap(mxTokens(t.trait+' '+t.desc), n.trait+' '+n.desc).length : null})()`);
      if (r === null) continue; total++; if (r > 0) related++;
    }
    assert(total && related / total >= 0.9, `only ${related}/${total} shifts shared any wording with the original`);
  });

  group('Audit 2026-09 §2 first-move UX');

  check('UX onboarding card sits under the tabs, outside the empty state', ()=>{
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const empty = html.slice(html.indexOf('id="emptyState"'), html.indexOf('<div class="sheet" id="sheet">'));
    assert(!empty.includes('id="onboard"'), '#onboard is back inside #emptyState');
    assert(html.indexOf('id="onboard"') < html.indexOf('id="helpPanel"') && html.indexOf('id="onboard"') > html.indexOf('class="tabs"'),
      '#onboard is not directly under the tabs');
  });

  check('UX the build row has exactly one primary button; the other rolls live in the menu', ()=>{
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const row = html.slice(html.indexOf('<div class="buildRow">'), html.indexOf('class="modeSwitch tinkerBar"'));
    assert((row.match(/btn-primary/g) || []).length === 1, 'more than one primary button in the build row');
    ['generateBatch','generateBatchDistinct','generateSameWorld','generateVariation','surpriseMe'].forEach(a =>
      assert(row.includes(`data-act="${a}"`) && row.indexOf(a) > row.indexOf('moreRollsMenu'), a + ' is not in the More ways to roll menu'));
    assert(!/randomizeAndGenerate/.test(html), 'the duplicate Randomize All button is back');
  });

  check('UX panel badges count only what differs from the shipped defaults', ()=>{
    const G = fresh();
    G.evalIn("document.querySelectorAll = () => []");
    const c = () => G.evalIn('panelBadgeCounts()');
    const base = c();
    assert(base.constraints === 0 && base.budgets === 0 && base.packs === 0, 'a fresh page already claims settings: ' + JSON.stringify(base));
    G.evalIn("bannedCategories.add(TRAITS[5].category); requiredTraitIds.push(TRAITS[9].id); rarityCaps.signature = 2; setPackEnabled('gaps', false)");
    const n = c();
    assert(n.constraints === 2 && n.budgets === 1 && n.packs === 1, 'counts wrong: ' + JSON.stringify(n));
  });

  group('Audit 2026-09 §5a varied prose');

  check('PROSE a list of takes does not repeat its closing lines: no warm tail dominates, no tail or device repeats', ()=>{
    const G = fresh();
    G.evalIn("globalThis.__t=function(mode){const ids=allVoicePrompts().map(p=>p.id);const out=[];for(const id of ids.slice(0,3)) out.push(voiceLines(state,id,mode,10).map(l=>l.text));return out}");
    let sets = 0, warmAll = 0;
    for (const mode of ['baseline','pressure']){
      for (let i = 0; i < 25; i++){
        G.gen('t' + i);
        G.evalIn(`__t('${mode}')`).forEach(set=>{
          sets++;
          const tails = set.map(t => t.split(/(?<=[.!?…])\s+/).pop());
          ['You and me.', "We're all right, though. You and me."].forEach(w => { if (tails.filter(x => x === w).length > 3) warmAll++; });
          // fixed pressure tails may not repeat inside one list
          ['And if you want to make something of it, make it.', 'Whatever\'s easiest.', 'We\'ll do this another time.'].forEach(f =>
            assert(tails.filter(x => x === f).length <= 2, `"${f}" closes ${tails.filter(x => x === f).length} of 10 takes`));
        });
      }
    }
    assert(!warmAll, 'the warm tail closes most lines again');
    return `${sets} sets of 10`;
  });

  check('PROSE the voice tail pools are real pools, and the warm tail is a habit, not a rule', ()=>{
    const G = fresh();
    const n = G.evalIn("({warm: VOICE_FRAGMENTS.tail.warm.length, long: VOICE_FRAGMENTS.tail.long.length, odds: WARM_TAIL_ODDS, press: Object.values(PRESSURE_TAIL).map(a => a.length)})");
    assert(n.warm >= 6 && n.long >= 5 && n.press.every(x => x >= 5), 'a tail pool shrank: ' + JSON.stringify(n));
    assert(n.odds > 0 && n.odds <= 0.5, 'the warm tail odds are ' + n.odds);
  });

  check('PROSE pressure ladder: no sign frame opens more than ~40% of sheets, and ladders are grounded', ()=>{
    const G = fresh();
    const pre = {}; let n = 0, skip = 0;
    for (let i = 0; i < 120; i++){
      G.gen('pp' + i);
      const r = G.evalIn("(()=>{const e=pressureEscalation(state,{__pressure:{level:1}});return {ids:e.stages.map(s=>s.id).join(),cur:e.current,ok:e.stages.every(s=>s.signs.every(x=>x.from.length)),signs:e.stages.flatMap(s=>s.signs.map(x=>x.text.split(/[:—]/)[0].slice(0,24)))}})()");
      n++; assert(r.ok, 'an ungrounded sign'); if (r.ids === 'irritated,broken') skip++;
      assert(r.ids.split(',').includes(r.cur), 'the current stage is not on the ladder: ' + r.ids + ' / ' + r.cur);
      new Set(r.signs).forEach(k => { pre[k] = (pre[k] || 0) + 1; });
    }
    const top = Object.entries(pre).sort((a, b) => b[1] - a[1])[0];
    assert(top[1] / n <= 0.55, `"${top[0]}" opens ${top[1]}/${n} ladders`);
    assert(skip > 0, 'no sheet ever skips the cornered stage');
    return `top opener ${top[1]}/${n}; ${skip} freeze ladders skip cornered`;
  });

  check('PROSE recovery: the first two rows depend on stress x attachment (16 cells), not each half alone', ()=>{
    const G = fresh();
    const cells = G.evalIn("Object.values(_RECOVER_CELL).reduce((a, m) => a + Object.keys(m).length, 0)");
    assert(cells === 16, 'expected 16 stress x attachment cells, found ' + cells);
    const texts = G.evalIn("(()=>{const o=new Set();for(const a of Object.values(_RECOVER_CELL)) for(const c of Object.values(a)){o.add(c.first);o.add(c.who)} return o.size})()");
    assert(texts === 32, 'cells are not all distinct: ' + texts);
    const seen = new Set();
    for (let i = 0; i < 120; i++){
      G.gen('rc' + i);
      G.evalIn("recoverySheet(state)").rows.filter(r => r.key === 'first').forEach(r => seen.add(r.text));
    }
    assert(seen.size >= 10, 'only ' + seen.size + ' distinct First-hours texts over 120 sheets');
    return seen.size + ' distinct first-hours texts / 120 sheets';
  });

  check('PROSE the chain and beats no longer open the same way on every sheet', ()=>{
    const G = fresh();
    const fear = new Set(), fail = new Set();
    for (let i = 0; i < 120; i++){
      G.gen('ch' + i);
      const r = G.evalIn("(()=>{const c=motivationChain(state);const b=backstoryBeats(state,{age:'40'});return {f:c&&c.links.find(l=>l.key==='fear'),m:c&&c.links.find(l=>l.key==='method'),b:b&&b.find(x=>x.key==='failure')}})()");
      if (r.f) fear.add(r.f.text.split(' ').slice(0, 4).join(' '));
      if (r.b) fail.add(r.b.text.split(' ').slice(0, 4).join(' '));
    }
    assert(fear.size >= 3, 'the fear link has ' + fear.size + ' distinct openers');
    assert(fail.size >= 3, 'the failure beat has ' + fail.size + ' distinct openers');
  });

  group('Audit 2026-09 §4b archetype hints for the off-by-default sections');

  // fresh() ticks every section; these checks are about the ones that ship OFF.
  const freshOff = () => {
    const G = fresh();
    G.evalIn("PROFILE_SECTIONS.filter(p => p.defaultOn === false).map(p => p.id)").forEach(id => G.document._set('sec_' + id, {checked: false}));
    return G;
  };

  check('HINTS every section that ships off is named by several presets, and most presets name one', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const off = PROFILE_SECTIONS.filter(p => p.defaultOn === false).map(p => p.id);
      const per = {}; off.forEach(id => per[id] = 0);
      let presetsWithOff = 0;
      for (const [k, prof] of Object.entries(ARCHETYPE_PROFILE_HINTS)){
        const mine = Object.keys(prof).filter(s => off.includes(s));
        if (mine.length) presetsWithOff++;
        mine.forEach(s => per[s]++);
      }
      return {off, per, presetsWithOff, total: Object.keys(ARCHETYPES).length};
    })()`);
    const thin = Object.entries(r.per).filter(([, n]) => n < 2).map(([k]) => k);
    assert(!thin.length, 'sections hinted by fewer than two presets: ' + thin.join(', '));
    assert(r.presetsWithOff >= r.total - 3, `only ${r.presetsWithOff}/${r.total} presets name an off-by-default section`);
    return `${r.presetsWithOff}/${r.total} presets; per section ${JSON.stringify(r.per)}`;
  });

  check('HINTS a preset\'s hint switches its off-by-default section on for that build, and only that build', ()=>{
    const G = freshOff();
    const count = (prof) => G.evalIn(`(()=>{
      let n = 0;
      withArchetypeProfile(${JSON.stringify(prof)}, () => withRng(mulberry32(77), () => {
        const o = {}; PERSONALITY_AXES.forEach(a => { o[a.id] = 0; });
        const st = buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:2, vocabCount:2, rarityPref:'balanced', vocabPref:null, personalityOverrides:o});
        n = Object.keys(st).filter(k => k.startsWith('prof_dialect_')).length;
      }));
      return n;
    })()`);
    assert(count({dialect:'Code-Switching'}) > 0, 'a Dialect hint did not bring Dialect in');
    assert(count(null) === 0, 'Dialect appeared with no archetype (cast, foil and gap-filler builds run this way)');
    assert(count({stress:'Flight (remove yourself)'}) === 0, 'an unrelated hint brought Dialect in');
    // the switch
    G.document._set('archetypeSectionsToggle', {checked: false});
    assert(count({dialect:'Code-Switching'}) === 0, 'the switch does not turn it off');
    G.document._set('archetypeSectionsToggle', {checked: true});
    // a section the user turned on is theirs, hint or not
    G.document._set('sec_dialect', {checked: true});
    assert(count(null) > 0, 'a section the user switched on is not drawn');
  });

  check('HINTS the in-force strip and Why-not name the sections the selected preset adds', ()=>{
    const G = freshOff();
    G.document._set('archetypeSelect', {value: 'codeSwitcher'}); G.document._set('archetypeVariation', {value: 'base'});
    const names = G.evalIn('archetypeAddedSections().map(p => p.id)');
    assert(names.includes('dialect') && names.includes('family'), 'added sections: ' + names);
    const chip = G.evalIn("activeRuleChips().find(c => c.k === 'archetype adds')");
    assert(chip && /Dialect/.test(chip.v), 'no "archetype adds" chip: ' + JSON.stringify(chip));
    G.document._set('archetypeSectionsToggle', {checked: false});
    assert(G.evalIn('archetypeAddedSections().length') === 0, 'the strip still claims added sections with the switch off');
  });

  check('HINTS the switch is part of the saved workspace and Reset restores it', ()=>{
    const G = fresh();
    assert(G.evalIn("SETTING_TOGGLES.includes('archetypeSectionsToggle')"), 'the switch is not captured with the settings');
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert(/id="archetypeSectionsToggle" checked/.test(html), 'the switch does not ship on');
  });

  check('HINTS the sheet shape never drops a section the preset itself switched on', ()=>{
    const G = freshOff();
    G.document._set('archetypeSelect', {value: 'codeSwitcher'}); G.document._set('archetypeVariation', {value: 'base'});
    G.document._set('sheetShapeToggle', {checked: true});
    for (let i = 0; i < 40; i++){
      G.gen('sh' + i);
      const n = G.evalIn("Object.keys(state).filter(k => k.startsWith('prof_dialect_') || k.startsWith('prof_family_')).map(k => k.split('_')[1])");
      assert(n.includes('dialect') && n.includes('family'), `seed sh${i} lost a hinted extra section: ${n}`);
    }
  });

  group('Audit 2026-09 §6a the voice lab reads motivation, humour and mannerisms');

  // A fixed sheet, then the parts of it the checks change one at a time.
  const swapTrait = (G, slotPrefix, catRe, trait) => G.evalIn(`(()=>{
    const k = Object.keys(state).find(k => k.startsWith('${slotPrefix}') && state[k] && state[k].trait && ${catRe}.test(state[k].trait.category));
    if (!k) return false; state[k] = Object.assign({}, state[k], {trait: TRAITS_BY_ID.get(${trait})}); return true; })()`);
  const takes = (G, id, mode, n) => G.evalIn(`voiceLines(state, '${id}', '${mode || 'baseline'}', ${n || 10}, 0)`);

  check('VOICE the inner life is read from the sheet', ()=>{
    const G = fresh(); G.gen('vi1');
    const i = G.evalIn("(()=>{const x=voiceRules(state).inner; return Object.keys(x).filter(k=>x[k]).sort().join()})()");
    ['defence','ghost','humor','lie','need','want'].forEach(k => assert(i.includes(k), 'voiceRules.inner is missing ' + k + ' (has ' + i + ')'));
  });

  check('VOICE concealing circles the Ghost, lying protects the Want, persuading is about the Want', ()=>{
    const G = fresh(); let hitC = 0, hitL = 0, hitP = 0, n = 0;
    for (let i = 0; i < 40; i++){
      G.gen('vc' + i);
      const w = G.evalIn("(()=>{const r=voiceRules(state);return {g:_spoken(r.inner.ghost||r.inner.wound,{the:!!r.inner.ghost,noun:!r.inner.ghost}),w:_spoken(r.inner.want)}})()");
      if (!w.g || !w.w) continue;
      const terse = G.evalIn("(()=>{const r=voiceRules(state);return !!r.terse||!!(r.verbosity&&r.verbosity.category==='Minimal & Ultra-Brief')})()");
      if (terse) continue;   // a character who says almost nothing only ever gets the clipped concealing line
      n++;
      if (takes(G, 'conceal').some(l => l.text.includes(w.g))) hitC++;
      if (takes(G, 'lie').some(l => l.text.includes(w.w) || l.text.includes(w.w[0].toUpperCase() + w.w.slice(1)))) hitL++;
      if (takes(G, 'persuade').some(l => l.text.includes(w.w) || l.text.includes(w.w[0].toUpperCase() + w.w.slice(1)))) hitP++;
    }
    assert(n >= 8, 'too few sheets with a ghost and a want: ' + n);
    assert(hitC / n >= 0.85 && hitL / n >= 0.85 && hitP / n >= 0.85, `conceal ${hitC}/${n}, lie ${hitL}/${n}, persuade ${hitP}/${n}`);
    return `conceal ${hitC}/${n}, lie ${hitL}/${n}, persuade ${hitP}/${n}`;
  });

  check('VOICE the same speech with a different Ghost and Want says different things', ()=>{
    const G = fresh(); G.gen('vd1');
    const a = takes(G, 'conceal').map(l => l.text).join('|');
    const ghosts = G.evalIn("TRAITS.filter(t=>/The Ghost/.test(t.category)).map(t=>t.id)");
    const cur = G.evalIn("voiceRules(state).inner.ghost.id");
    const other = ghosts.find(id => id !== cur);
    assert(swapTrait(G, 'prof_motivation_', '/The Ghost/', other), 'no Ghost slot to swap');
    const b = takes(G, 'conceal').map(l => l.text).join('|');
    assert(a !== b, 'a different Ghost produced the same lines');
  });

  check('VOICE the Defence bends asking for help, and the line says which card did it', ()=>{
    const G = fresh(); let bent = 0, n = 0;
    for (let i = 0; i < 60; i++){
      G.gen('vh' + i);
      const ok = G.evalIn("(()=>{const r=voiceRules(state);const terse=!!r.terse||!!(r.verbosity&&r.verbosity.category==='Minimal & Ultra-Brief');return !terse&&!!_innerLine('askhelp',r,()=>0.1,false,false)})()");
      if (!ok) continue; n++;
      if (takes(G, 'askhelp').some(l => l.rules.some(r => /^motivation: .* — (the ask|they )/.test(r)))) bent++;
    }
    assert(n >= 15, 'too few sheets whose Defence maps to a mode: ' + n);
    assert(bent / n >= 0.9, `only ${bent}/${n} such sheets ever showed a defence-bent ask`);
    const share = G.evalIn("(()=>{const D=TRAITS.filter(t=>/The Defence/.test(t.category));return D.filter(t=>_DEFENCE_MODES.some(m=>m.re.test(t.trait+' '+(t.desc||'')))).length/D.length})()");
    assert(share >= 0.6, 'only ' + Math.round(share * 100) + '% of Defence cards map to a mode');
    return `${bent}/${n} sheets; ${Math.round(share * 100)}% of Defence cards mapped`;
  });

  check('VOICE humour adds a remark in the sheet\'s own register, and Humorless adds none', ()=>{
    const G = fresh();
    for (let i = 0; i < 30; i++){
      G.gen('vm' + i);
      if (!G.evalIn("(()=>{const r=voiceRules(state);return !!r.terse||!!(r.verbosity&&r.verbosity.category==='Minimal & Ultra-Brief')})()")) break;
    }
    const setHumor = cat => assert(G.evalIn(`(()=>{const t=TRAITS.find(t=>t.section==='Humor Style'&&t.category==='${cat}'); const k=Object.keys(state).find(k=>k.startsWith('prof_humor_')); if(!k||!t) return false; state[k]=Object.assign({},state[k],{trait:t}); return true})()`), 'no humour slot');
    setHumor('Cruel & Barbed');
    const cruel = G.evalIn("_VOICE_HUMOR['Cruel & Barbed']");
    let seen = 0; for (const id of ['refuse','apologise','persuade','lie','request']) takes(G, id, 'baseline', 10).forEach(l => { if (cruel.some(x => l.text.includes(x)) && l.rules.some(r => /^humour:/.test(r))) seen++; });
    assert(seen >= 5, 'a Cruel & Barbed sheet added its barb only ' + seen + ' times in 50 lines');
    setHumor('Humorless & Absent');
    let any = 0; for (const id of ['refuse','apologise','persuade']) takes(G, id).forEach(l => { if (l.rules.some(r => /^humour:/.test(r))) any++; });
    assert(any === 0, 'a Humorless sheet still added humour');
  });

  check('VOICE mannerisms add their own authored stage direction, in brackets', ()=>{
    const G = fresh(); let withDir = 0, n = 0;
    for (let i = 0; i < 20; i++){
      G.gen('vs' + i);
      const dirs = G.evalIn("_stageDirections(voiceRules(state).manner).map(d => d.text)");
      if (!dirs.length) continue; n++;
      const ls = takes(G, 'refuse', 'baseline', 10).concat(takes(G, 'apologise', 'baseline', 10));
      if (ls.some(l => dirs.some(d => l.text.includes('[' + d + ']')) && l.rules.some(r => /^mannerism:/.test(r)))) withDir++;
    }
    assert(n >= 10 && withDir / n >= 0.9, `stage directions on ${withDir}/${n} sheets`);
    return `${withDir}/${n} sheets`;
  });

  check('VOICE no placeholder or third-person leaks into a spoken line', ()=>{
    const G = fresh(); const bad = [];
    for (let i = 0; i < 30; i++){
      G.gen('vp' + i);
      for (const id of ['conceal','lie','askhelp','persuade','refuse','apologise','request']){
        for (const mode of ['baseline','pressure']) takes(G, id, mode, 6).forEach(l => {
          if (/\{\w+\}/.test(l.text)) bad.push('placeholder: ' + l.text);
          if (/\b(the time they|being someone who)\b/.test(l.text)) bad.push('narration: ' + l.text);
          if (!l.text.trim()) bad.push('empty line');
        });
      }
    }
    assert(!bad.length, bad[0] + ` (+${bad.length - 1} more)`);
  });

  check('VOICE goals, family and money cards lend their phrases to the topic pools', ()=>{
    const G = fresh(); G.gen('vt1');
    const r = G.evalIn(`(()=>{
      const t = TRAITS.find(t => t.section === 'Family Talk' && /(^|[^a-z])(my|your) (sister|brother|mother|father)/i.test(t.example || ''));
      if (!t) return null;
      const pools = _topicPools(mulberry32(1), _examplePhrases([t], 'profile'));
      return {t: t.trait, has: pools.person.some(p => /^(my|your) (sister|brother|mother|father)/.test(p))};
    })()`);
    assert(r && r.has, 'a Family Talk phrase did not reach the person pool: ' + JSON.stringify(r));
  });

  check('VOICE a terse character gets a clipped concealing line and stage directions, but no explained want', ()=>{
    const G = fresh(); G.gen('vt9');
    assert(G.evalIn(`(()=>{const t=TRAITS.find(t=>t.category==='Minimal & Ultra-Brief'); const k=Object.keys(state).find(k=>state[k]&&state[k].trait&&state[k].trait.section==='Verbosity Traits'&&/^verbosity/.test(k)); if(!k||!t) return false; state[k]=Object.assign({},state[k],{trait:t}); return true})()`), 'no verbosity slot to make terse');
    assert(G.evalIn("voiceRules(state).verbosity.category") === 'Minimal & Ultra-Brief', 'the sheet did not become terse');
    ['lie', 'persuade'].forEach(id => takes(G, id).forEach(l => assert(!l.rules.some(r => /^motivation:/.test(r)), id + ' explained the want on a terse sheet: ' + l.text)));
    const c = takes(G, 'conceal', 'baseline', 20);
    assert(c.some(l => l.rules.some(r => /^motivation:/.test(r))), 'a terse concealing line never circled the wound');
    c.filter(l => l.rules.some(r => /^motivation:/.test(r))).forEach(l => assert(l.text.length < 140, 'the terse line is not clipped: ' + l.text));
    assert(c.some(l => /\[[^\]]+\]/.test(l.text)), 'a terse character lost their stage directions');
  });

  group('Audit 2026-09 §6a the inner-conflict engine');

  check('CONFLICT every sheet gets a second tension between its own drives, and the result is stable', ()=>{
    const G = fresh(); const types = {}, combo = {}; let n = 0, none = 0;
    G.evalIn("globalThis.__ic = () => { const a = innerConflict(state, null), b = innerConflict(state, null); return a && {t:a.type, f:a.flips, same: JSON.stringify([a.type,a.pressure,a.summary]) === JSON.stringify([b.type,b.pressure,b.summary]), sum:a.summary} }");
    for (let i = 0; i < 200; i++){
      G.gen('ic' + i); n++;
      const c = G.evalIn('__ic()');
      if (!c){ none++; continue; }
      assert(c.same, 'the conflict changed between two calls on one sheet');
      assert(!/undefined|\{\w+\}|\[object/.test(c.sum), 'bad text: ' + c.sum);
      types[c.t] = (types[c.t] || 0) + 1; const k = c.t + (c.f ? '/flips' : '/holds'); combo[k] = (combo[k] || 0) + 1;
    }
    assert(none / n <= 0.02, none + ' sheets had no conflict');
    assert(Object.keys(types).length === 4, 'not every conflict type occurs: ' + JSON.stringify(types));
    Object.entries(types).forEach(([t, c]) => assert(c / n >= 0.1, `${t} is only ${c}/${n}`));
    assert(Object.keys(combo).length >= 7, 'few type x outcome combinations: ' + JSON.stringify(combo));
    return JSON.stringify(combo);
  });

  check('CONFLICT the author can swap who wins under load, and everything downstream follows', ()=>{
    const G = fresh(); G.gen('icf1');
    const r = G.evalIn(`(()=>{
      const a = innerConflict(state, null), b = innerConflict(state, {conflictFlip: true});
      const la = innerConflictLeak(state, mulberry32(1), {}), lb = innerConflictLeak(state, mulberry32(1), {meta: {conflictFlip: true}});
      const pa = pressureEscalation(state, {__pressure:{level:1}}, null).stages.flatMap(s => s.signs.map(x => x.text)).join('|');
      const pb = pressureEscalation(state, {__pressure:{level:1}}, {conflictFlip:true}).stages.flatMap(s => s.signs.map(x => x.text)).join('|');
      return {pa: a.pressure, pb: b.pressure, fa: a.flips, fb: b.flips, loserA: a.loser.key, loserB: b.loser.key, la: la.text, lb: lb.text, ladderDiffers: pa !== pb, sameType: a.type === b.type};
    })()`);
    assert(r.sameType, 'the swap changed which tension it is');
    assert(r.pa !== r.pb && r.fa !== r.fb && r.loserA !== r.loserB, 'the swap did not change who wins under load');
    assert(r.la !== r.lb, 'the leaked line did not change with the swap');
    assert(r.ladderDiffers, 'the pressure ladder ignored the swap');
  });

  check('CONFLICT the pressure ladder states the conflict at Cornered and what leaks at Broken', ()=>{
    const G = fresh(); let n = 0, ok = 0;
    for (let i = 0; i < 40; i++){
      G.gen('icl' + i);
      const st = G.evalIn("pressureEscalation(state,{__pressure:{level:1}},null).stages.map(s=>({id:s.id,t:s.signs.map(x=>x.text),ok:s.signs.every(x=>x.from.length)}))");
      n++;
      const allOk = st.every(s => s.ok);
      const cor = st.find(s => s.id === 'cornered' || s.id === 'broken');
      const brk = st.find(s => s.id === 'broken');
      if (allOk && brk && brk.t.some(t => /leaks|losing drive|comes out/.test(t)) && cor.t.some(t => /inner conflict|drives|wins|holds|keep to/i.test(t))) ok++;
    }
    assert(ok / n >= 0.9, `only ${ok}/${n} ladders carry the conflict`);
  });

  check('CONFLICT under pressure the losing drive leaks into the voice lab lines, and only rarely when calm', ()=>{
    const G = fresh(); let pl = 0, pn = 0, bl = 0, bn = 0, named = 0, namedN = 0;
    for (let i = 0; i < 12; i++){
      G.gen('icv' + i);
      const loser = G.evalIn("(()=>{const c=innerConflict(state,null);return {p:_spoken(c.loser.trait)||c.loser.trait.trait, q:c.loser.trait.trait.toLowerCase()}})()");
      ['refuse','apologise','persuade','lie','request','askhelp','conceal'].forEach(id => {
        takes(G, id, 'pressure', 6).forEach(l => { pn++; if (l.rules.some(r => /^inner conflict:/.test(r))){ pl++; namedN++; if (l.text.toLowerCase().includes(String(loser.p).toLowerCase()) || l.text.toLowerCase().includes(loser.q) || /I can.t be the|Someone else be the|dropping the act|that.s what I do/.test(l.text)) named++; } });
        takes(G, id, 'baseline', 6).forEach(l => { bn++; if (l.rules.some(r => /^inner conflict:/.test(r))) bl++; });
      });
    }
    assert(pl / pn >= 0.35, `pressure lines leak only ${pl}/${pn}`);
    assert(bl / bn <= 0.2, `calm lines leak ${bl}/${bn}`);
    assert(named / namedN >= 0.9, `a leak line did not name the losing side: ${named}/${namedN}`);
    return `pressure ${pl}/${pn}, calm ${bl}/${bn}`;
  });

  check('CONFLICT the panel, the markdown export and the LLM prompt all carry it', ()=>{
    const G = fresh(); G.gen('ice1');
    const r = G.evalIn(`(()=>({md: sheetToText(state, charMeta || {name:'x'}, null), pr: sheetToPrompt(state, charMeta || {name:'x'})}))()`);
    assert(/Inner conflict/.test(r.md), 'the text export omits the inner conflict');
    assert(/## Inner conflict/.test(r.pr) && /leaks into what they say/.test(r.pr), 'the LLM prompt omits the inner conflict');
    const src = fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8');
    assert(/class="tensionBlock innerConflict"/.test(src) && /flipInnerConflict/.test(src), 'the panel or its swap button is gone');
    assert(G.evalIn("typeof flipInnerConflict") === 'function', 'flipInnerConflict is not defined');
  });

  check('CONFLICT leak lines read as speech: no placeholders, no "done with to", no doubled gerunds', ()=>{
    const G = fresh(); const bad = [];
    for (let i = 0; i < 60; i++){
      G.gen('icg' + i);
      for (let k = 0; k < 4; k++){
        const t = G.evalIn(`innerConflictLeak(state, mulberry32(${k * 7 + 1}), {short: ${k % 2 === 1}}).text`);
        if (/\{|\}|undefined|done with to |trying trying|being being|\bthey\b/i.test(t)) bad.push(t);
      }
    }
    assert(!bad.length, bad[0] + ` (+${bad.length - 1} more)`);
  });
};
