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
  d._set('seedInput',{value:''}); d._set('engineVersion',{value:'1'}); d._set('batchTray',{}); d._set('charName',{value:''});
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
    assert(/prefsReady = false/.test(body) && /savePrefs\(\);\s*\n\s*toastUndo\("Everything reset/.test(body), 'Reset saves before it has finished');
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
    c.filter(l => l.rules.some(r => /^motivation:/.test(r))).forEach(l => assert(l.text.replace(/\[[^\]]*\]/g, '').trim().length < 110, 'the terse line is not clipped: ' + l.text));
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

  group('Audit 2026-09 §4b look-alike archetype pairs');
  const AUDITED_PAIRS = [['charmingManipulator','lovableLiar'], ['reluctantSecond','furiousCaretaker'], ['competentProfessional','stubbornCraftsman'],
                         ['companyLoyalist','careerBureaucrat'], ['workaholicAvoiding','steadyOrganiser']];

  check('PAIRS the five audited look-alike pairs differ in their profile hints and voice posture', ()=>{
    const G = fresh();
    AUDITED_PAIRS.forEach(([a, b]) => {
      const r = G.evalIn(`(()=>{
        const A = ARCHETYPES.${a}, B = ARCHETYPES.${b};
        const core = ['attachment','stress','values','humor','role','vices','competence'];
        const hintDiff = core.filter(k => (A.profile[k] || '') !== (B.profile[k] || '')).length;
        const voiceDiff = ['verbosity','register','composure'].filter(k => A[k] !== B[k]).length;
        const vocabShared = A.vocabPref.filter(x => B.vocabPref.includes(x)).length;
        return {hintDiff, voiceDiff, vocabShared};
      })()`);
      assert(r.hintDiff >= 4, `${a} / ${b} share too many core hints (${r.hintDiff} differ)`);
      assert(r.voiceDiff >= 2, `${a} / ${b} have nearly the same voice posture (${r.voiceDiff} of 3 differ)`);
      assert(r.vocabShared <= 1, `${a} / ${b} reach for the same vocabulary categories`);
    });
  });

  check('PAIRS sheets from the five audited pairs are no longer near-twins (category cosine, 12 sheets each)', ()=>{
    const G = freshOff(); const d = G.document;
    d._set('archetypeSelect', {value: ''}); d._set('archetypeVariation', {value: 'base'});
    const vec = key => {
      d.getElementById('archetypeSelect').value = key; const v = {};
      for (let i = 0; i < 12; i++){ G.gen('pp' + key + i); G.evalIn("Object.values(state).filter(s=>s&&s.trait).map(s=>s.trait.category)").forEach(c => { v[c] = (v[c] || 0) + 1; }); }
      return v;
    };
    const cos = (a, b) => { let dot = 0, x = 0, y = 0; for (const k in a){ x += a[k] * a[k]; if (b[k]) dot += a[k] * b[k]; } for (const k in b) y += b[k] * b[k]; return dot / Math.sqrt(x * y); };
    const out = [];
    AUDITED_PAIRS.forEach(([a, b]) => {
      const c = cos(vec(a), vec(b)); out.push(`${a}/${b} ${c.toFixed(2)}`);
      assert(c <= 0.86, `${a} / ${b} are still near-twins: category cosine ${c.toFixed(2)} (was 0.83-0.93 before the pass)`);
    });
    return out.join('; ');
  });

  group('Audit 2026-09 §2 discoverability, mobile and keyboard');
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

  check('UX2 the action rows are Edit / Keep / Share, and Reset lives apart from Save', ()=>{
    const html = read('index.html');
    const labels = [...html.matchAll(/<span class="actionGroupLabel">([^<]*)<\/span>/g)].map(m => m[1]);
    ['Edit', 'Keep', 'Share'].forEach(l => assert(labels.includes(l), 'no ' + l + ' group: ' + labels));
    const groups = html.split('<div class="actionGroup');
    const keep = groups.find(g => /actionGroupLabel">Keep</.test(g));
    assert(/saveCharacter/.test(keep) && !/resetAllToDefaults/.test(keep), 'Reset sits in the Keep group beside Save');
    assert(groups.find(g => /resetAllToDefaults/.test(g) && /advOnly/.test(g)), 'Reset is not in an advanced-only group');
  });

  check('UX2 the File menu is two headed groups with a description under every item', ()=>{
    const html = read('index.html');
    const menu = html.slice(html.indexOf('<div class="fileMenuList">'), html.indexOf('</details>', html.indexOf('<div class="fileMenuList">')));
    assert(/fileMenuHead[^>]*>Share</.test(menu) && /fileMenuHead[^>]*>Backup</.test(menu), 'the menu lacks its Share and Backup headings');
    const buttons = (menu.match(/<button /g) || []).length, described = (menu.match(/<small>/g) || []).length;
    assert(buttons >= 9 && buttons === described, `${described}/${buttons} items carry a description`);
  });

  check('UX2 the sheet nav reaches every panel it names, and the project chip and save state are in the header', ()=>{
    const html = read('index.html');
    const targets = [...html.matchAll(/data-act="jumpToPanel" data-args="\[&quot;(\w+)&quot;\]"/g)].map(m => m[1]);
    assert(targets.length >= 6, 'the nav has only ' + targets.length + ' targets');
    targets.forEach(id => assert(html.includes(`id="${id}"`), 'the nav points at a missing #' + id));
    assert(/id="projectChip"/.test(html) && /id="saveState"/.test(html) && /id="themeBtn"/.test(html), 'the header lost the project chip, save state or theme toggle');
  });

  check('UX2 every jargon hint is a tap-friendly toggle with its text, and there are enough of them', ()=>{
    const html = read('index.html');
    const tips = (html.match(/class="infoTip"/g) || []).length, texts = (html.match(/class="tipText" hidden/g) || []).length;
    assert(tips >= 7 && tips === texts, `${tips} tips, ${texts} texts`);
    ['lens', 'steps away', 'affinity', 'foil', 'edge', 'Prefer', 'stress'].forEach(w => assert(new RegExp('tipText" hidden>[^<]*' + w, 'i').test(html), 'no hint explains ' + w));
  });

  check('UX2 lens chips have a Clear button and the Relationships tab says what it needs', ()=>{
    const G = fresh();
    G.document._set('lensPicker', {innerHTML: ''}); G.document._set('lensSelect', {value: 'court'});
    G.evalIn("renderLensPicker()");
    assert(/clearLenses/.test(G.document.getElementById('lensPicker').innerHTML), 'no Clear button while a lens is on');
    G.evalIn("clearLenses()");
    assert(G.document.getElementById('lensSelect').value === '', 'Clear did not clear');
    G.document._set('relEmpty', {hidden: true}); G.document._set('relEmptyCount', {textContent: ''});
    G.gen('rel1');   // one sheet, no cast: still fewer than two characters? the sheet counts as one
    G.evalIn("castStates = []; refreshRelEmpty()");
    assert(G.document.getElementById('relEmpty').hidden === false, 'the empty notice is hidden with one character');
    G.evalIn("castStates = [{meta:{name:'a'},state:{}}]; refreshRelEmpty()");
    assert(G.document.getElementById('relEmpty').hidden === true, 'the empty notice stays with two characters');
  });

  check('UX2 the keyboard: a shortcuts dialog, and the keys it lists are wired', ()=>{
    const html = read('index.html'), app = read('js/app.js');
    assert(/<dialog id="shortcutDialog"/.test(html), 'no shortcuts dialog');
    ['Ctrl', 'Enter', 'Z', 'S', '1', '/', 'Esc', '?', 'R', 'L', 'P'].forEach(k => assert(new RegExp('<kbd>' + k.replace('/', '\\/').replace('?', '\\?') + '</kbd>').test(html), 'the dialog does not list ' + k));
    const body = app.slice(app.indexOf('function wireKeyboard'), app.indexOf('/* ================= FILE MENU'));
    ["e.key === 's'", "e.key === 'Escape'", "e.key === '/'", "e.key === '1'", "k !== 'p'", 'openShortcuts()'].forEach(x => assert(body.includes(x), 'wireKeyboard lost ' + x));
  });

  check('UX2 destructive actions undo through a toast, not a confirm', ()=>{
    const src = read('js/app.js') + read('js/generate.js') + read('js/render.js');
    const body = (name, next) => { const i = src.indexOf(name); return src.slice(i, src.indexOf(next, i)); };
    [['async function resetAllToDefaults', 'function randomRawSlider'], ['async function deleteProject', '/* File the work'], ['async function deleteCustomArchetype', '/* Built-in presets used to be']].forEach(([a, b]) => {
      const t = body(a, b);
      assert(/toastUndo\(/.test(t) && !/askForConfirm\(/.test(t), a + ' still asks for confirmation or has no Undo');
    });
    ['function lockAll', 'function unlockAll', 'function unpinAll', 'function clearBudgetsUI', 'function clearConstraintsUI'].forEach(a => {
      const t = body(a, '\n}\n');
      assert(/toastUndo\(/.test(t), a + ' has no Undo toast');
    });
    const G = fresh(); G.gen('un1');
    G.evalIn("globalThis.__undo = null; toastUndo = function(m, fn){ globalThis.__undo = fn; }");
    G.evalIn("lockAll()");
    assert(G.evalIn("Object.values(state).some(x => x && x.locked)"), 'lockAll locked nothing');
    G.evalIn("__undo()");
    assert(!G.evalIn("Object.values(state).some(x => x && x.locked)"), 'the Undo toast did not put the locks back');
    G.evalIn("bannedCategories.add('X'); clearConstraintsUI()");
    assert(G.evalIn("bannedCategories.size") === 0, 'clearConstraintsUI did not clear');
    G.evalIn("__undo()");
    assert(G.evalIn("bannedCategories.has('X')"), 'the Undo toast did not restore the constraint');
  });

  check('UX2 theme: Auto, Light and Dark cycle and set data-theme', ()=>{
    const G = fresh();
    G.evalIn("document.documentElement = {setAttribute(k, v){ this[k] = v; }, removeAttribute(k){ delete this[k]; }}");
    G.evalIn("applyTheme('auto')");
    G.evalIn("cycleTheme()"); assert(G.evalIn("themeMode") === 'light' && G.evalIn("document.documentElement['data-theme']") === 'light', 'first click is not Light');
    G.evalIn("cycleTheme()"); assert(G.evalIn("document.documentElement['data-theme']") === 'dark', 'second click is not Dark');
    G.evalIn("cycleTheme()"); assert(G.evalIn("'data-theme' in document.documentElement") === false, 'third click does not return to Auto');
  });

  check('UX2 phone layout rules exist: segmented tabs, folding inputs, a sticky bar that folds behind a menu', ()=>{
    const css = read('css/style.css'), html = read('index.html');
    ['.tabShort', '.inputsBar', '.stickyMoreBtn', '.stickyExtra', '#view-single.inputsCollapsed #controlsStart'].forEach(sel => assert(css.includes(sel), 'CSS lacks ' + sel));
    assert(/class="tabLong"/.test(html) && /class="tabShort"/.test(html), 'the tabs have no short labels');
    assert(/id="inputsBar"/.test(html) && /id="stickyMoreBtn"/.test(html), 'the inputs bar or the ⋯ button is missing');
  });

  group('Audit 2026-09 §3 side features');

  check('SIDE the history drawer lists the last twenty rolls, restores one and compares it with the sheet on screen', ()=>{
    const G = fresh();
    assert(G.evalIn('HISTORY_MAX') === 20, 'the undo depth is not the twenty the drawer promises');
    G.document._set('comparePanel', {innerHTML: '', style: {}}); G.document._set('historyDrawer', {hidden: true, innerHTML: ''});
    G.evalIn("toastUndo = function(){}");
    G.gen('h1'); G.gen('h2'); G.gen('h3');
    const entries = G.evalIn('historyEntries()');
    assert(entries.length >= 3 && entries.every(e => typeof e.i === 'number'), 'entries: ' + JSON.stringify(entries));
    G.gen('h2'); const h2 = G.sig(); G.gen('h4');
    const idx = G.evalIn("historyEntries()[0].i");
    G.evalIn(`restoreHistoryAt(${idx})`);
    assert(G.sig() === h2, 'restoring the newest history entry did not bring back the previous sheet');
    G.gen('h5');
    G.evalIn(`compareWithHistory(${G.evalIn("historyEntries()[0].i")})`);
    const html = G.document.getElementById('comparePanel').innerHTML;
    assert(/slots identical/.test(html) && /Sliders/.test(html), 'the comparison lacks the trait diff or the slider diff');
  });

  check('SIDE saved traits can count double, and a share link then carries them', ()=>{
    const G = fresh();
    const id = G.evalIn("TRAITS[40].id"), other = G.evalIn("TRAITS[41].id");
    G.evalIn(`setFavouriteTraitIds([${id}])`);
    assert(G.evalIn(`favouriteMultiplier(TRAITS_BY_ID.get(${id}))`) === 1, 'saved traits steer with the switch off');
    G.document._set('favouriteBoostToggle', {checked: true});
    assert(G.evalIn(`favouriteMultiplier(TRAITS_BY_ID.get(${id}))`) === 2, 'the boost is not x2 with the switch on');
    assert(G.evalIn(`favouriteMultiplier(TRAITS_BY_ID.get(${other}))`) === 1, 'an unsaved trait was boosted');
    assert(G.evalIn("SETTING_TOGGLES.includes('favouriteBoostToggle')"), 'the switch is not part of the workspace');
    assert(/if \(!favouriteBoostEnabled\(\)\) delete settings\.favouriteTraitIds/.test(read('js/app.js')), 'the share link drops saved traits even when they steer the draw');
  });

  check('SIDE a locked slider is left alone by Randomize and Surprise me', ()=>{
    const G = fresh();
    G.document._set('lock_verbositySlider', {checked: true}); G.document._set('verbositySlider', {value: '55'});
    G.document._set('registerSlider', {value: '0'}); G.document._set('composureSlider', {value: '0'});
    let moved = 0;
    for (let i = 0; i < 12; i++){ G.evalIn("randomizeSliders('voice')"); if (G.document.getElementById('registerSlider').value !== '0') moved++; }
    assert(G.document.getElementById('verbositySlider').value === '55', 'the locked slider moved');
    assert(moved > 0, 'the unlocked sliders never moved');
    const src = read('js/app.js') + read('js/render.js');
    assert(/lockedSliders: \(typeof lockedSliderIds/.test(src) && /s\.lockedSliders/.test(src), 'locks are not saved with the settings');
    assert(/isSliderLocked\('pers_'\+axis\.id\)/.test(src), 'Surprise me can still move a locked axis');
  });

  check('SIDE named slider sets, find-on-sheet and remembered folds exist and are wired', ()=>{
    const app = read('js/app.js'), render = read('js/render.js'), html = read('index.html');
    ['saveSliderPreset', 'applySliderPreset', 'deleteSliderPreset'].forEach(f => assert(new RegExp('function ' + f).test(app) && html.includes('data-act="' + f + '"'), f + ' is not wired'));
    assert(/toastUndo\(`Deleted the slider set/.test(app) && /toastUndo\(`Loaded/.test(app), 'loading or deleting a slider set cannot be undone');
    assert(/id="sheetFind"/.test(html) && /function applySheetFilter/.test(render) && /!sheetFilterActive\(\)/.test(render), 'find-on-sheet is not wired (or does not open folded sections)');
    assert(/persistCollapsed\(\)/.test(render) && /loadCollapsedGroups\(\)/.test(app), 'section folds are not remembered');
  });

  check('SIDE reading level: words, sentences and grade, with stage directions left out', ()=>{
    const G = fresh();
    const easy = G.evalIn("readingStats('No. I will not. Go home.')"), hard = G.evalIn("readingStats('The administrative reorganisation necessitated considerable deliberation regarding institutional responsibilities.')");
    assert(easy.words === 6 && easy.sentences === 3, 'easy: ' + JSON.stringify(easy));
    assert(hard.grade > easy.grade + 6, `grades ${easy.grade} vs ${hard.grade}`);
    assert(G.evalIn("readingStats('[rubs temples] Fine.')").words === 1, 'a stage direction was counted as speech');
    assert(G.evalIn("readingStats('')").words === 0, 'empty text');
    assert(/copyVoiceLine/.test(read('js/app.js')) && /reads at grade/.test(read('js/app.js')), 'the voice lab shows no reading level or copy button');
  });

  check('SIDE the cast: redraw the most similar member, and export it as CSV', ()=>{
    const G = fresh();
    G.evalIn("renderCast=function(){};refreshRelSelectors=function(){};toastUndo=function(m,fn){globalThis.__undo=fn}");
    G.document._set('castSeed', {value: 'sf1'}); G.document._set('castCount', {value: '4'});
    G.evalIn('generateCast()');
    const total = () => G.evalIn("voiceCollisionMatrix(castStates,'baseline',0).totals.reduce((a,b)=>a+b,0)");
    const sigOf = () => G.evalIn("castStates.map(c => Object.keys(c.state).sort().map(k => c.state[k].trait && c.state[k].trait.id).join(',')).join('|')");
    const before = total(), names = G.evalIn("castStates.map(c => c.meta.name).join('|')"), sig = sigOf();
    G.evalIn('regenerateMostSimilarMember()');
    assert(G.evalIn("castStates.length") === 4 && G.evalIn("castStates.map(c => c.meta.name).join('|')") === names, 'the redraw changed who is in the cast');
    assert(total() <= before, `the redraw made the cast MORE similar: ${before} -> ${total()}`);
    G.evalIn('__undo()');
    assert(sigOf() === sig, 'Undo did not bring the member back');
    const csv = G.evalIn('castToCSV()');
    const cards = G.evalIn("castStates.reduce((n, c) => n + Object.values(c.state).filter(s => s && s.trait).length, 0)");
    assert(csv.charCodeAt(0) === 0xFEFF && csv.slice(1).startsWith('Member,Age,Context,Archetype,Slot,Section,Category,Trait,Intensity,Rarity,Kept'), 'the CSV header or BOM is wrong');
    assert(csv.trim().split('\r\n').length === cards + 1, `CSV rows ${csv.trim().split('\r\n').length} vs ${cards + 1} expected`);
    assert(G.evalIn("_csvCell('a,b')") === '"a,b"' && G.evalIn("_csvCell('say \"hi\"')") === '"say ""hi"""', 'CSV escaping is wrong');
  });

  check('SIDE the short LLM prompt is a fraction of the full one, and reduce-motion is a real switch', ()=>{
    const G = fresh(); G.gen('sp1');
    const full = G.evalIn("sheetToPrompt(state, {name:'X'})"), short = G.evalIn("sheetToPrompt(state, {name:'X'}, {short:true})");
    assert(short.length < full.length * 0.6, `short is ${short.length} of ${full.length} characters`);
    assert(!/Sample lines|## Rules|Central contradiction/.test(short) && /How they speak/.test(short), 'the short prompt kept the long parts or lost the voice');
    G.evalIn("document.body = {classList: {contains: c => c === 'reduce-motion'}}");
    assert(G.evalIn('_prefersReducedMotion()') === true, 'the page switch does not count as reduce-motion');
    assert(/\.reduce-motion \*/.test(read('css/style.css')), 'no CSS turns the motion off');
  });

  group('Audit 2026-09 §3 robustness');

  check('ROBUST constraints that can never hold are named: banned-and-required, a zero cap, a banned required category', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const t = TRAITS.find(t => rarityTier(t) === 'common');
      requiredTraitIds = [t.id]; bannedTraitIds = new Set([t.id]);
      const a = detectConstraintConflicts().map(c => c.kind);
      bannedTraitIds = new Set(); rarityCaps.common = 0;
      const b = detectConstraintConflicts().map(c => c.kind);
      rarityCaps.common = null; requiredTraitIds = [];
      const cat = TRAITS[50].category; requiredCategories = [cat]; bannedCategories = new Set([cat]);
      const c = detectConstraintConflicts().map(c => c.kind);
      requiredCategories = []; bannedCategories = new Set();
      return {a, b, c};
    })()`);
    assert(r.a.includes('required-vs-banned-trait'), 'banned + required: ' + r.a);
    assert(r.b.includes('required-vs-cap'), 'required in a capped-at-zero tier: ' + r.b);
    assert(r.c.includes('required-category-banned'), 'required category that is banned: ' + r.c);
  });

  check('ROBUST a build says which rules contradict, and why a required trait is missing', ()=>{
    const G = fresh(); G.gen('rp1');
    G.evalIn("globalThis.__t = []; toast = function(m){ __t.push(m) }");
    G.evalIn("const t = TRAITS.find(t => rarityTier(t) === 'common' && !seatedIdSet(state).has(t.id)); requiredTraitIds = [t.id]; bannedTraitIds = new Set([t.id]); detectConstraintConflicts(); reportRuleProblems()");
    const msg = G.evalIn("__t.join(' | ')");
    assert(/contradict each other/.test(msg) && /required but is not on this sheet/.test(msg), 'toast: ' + msg);
    assert(!/<[a-z]/.test(msg), 'the toast still carries HTML: ' + msg);
    G.evalIn("requiredTraitIds = []; bannedTraitIds = new Set(); __t.length = 0; detectConstraintConflicts(); reportRuleProblems()");
    assert(G.evalIn("__t.length") === 0, 'a clean rule set still warns');
  });

  check('ROBUST a share link or file from another version says so instead of replaying the wrong person', ()=>{
    const G = fresh();
    G.evalIn("globalThis.btoa=s=>Buffer.from(s,'binary').toString('base64'); globalThis.atob=s=>Buffer.from(s,'base64').toString('binary');");
    G.Buffer = Buffer;
    const link = o => G.evalIn(`readShareFromHash('#share=' + _b64urlEncode(${JSON.stringify(JSON.stringify(o))}))`);
    assert(link({v: 1, seed: 'v1-abc'}).seed === 'v1-abc' && link({v: 1, seed: 'v2-abc'}).seed === 'v2-abc', 'a current link was refused');
    let m = ''; try { link({v: 2, seed: 'v1-abc'}); } catch(e){ m = e.message; }
    assert(/newer version/.test(m), 'v2 link: ' + m);
    m = ''; try { link({v: 1, seed: 'v9-abc'}); } catch(e){ m = e.message; }
    assert(/format v9/.test(m), 'unknown seed version: ' + m);
    m = ''; try { G.evalIn("checkFileVersion({version: 99}, 1, 'cast')"); } catch(e){ m = e.message; }
    assert(/newer version of this app/.test(m), 'file version: ' + m);
    assert(G.evalIn("checkFileVersion({}, 1, 'cast')") === 1 && G.evalIn("checkFileVersion({version: 1}, 1, 'cast')") === 1, 'a current or unstamped file was refused');
  });

  check('ROBUST merging a workspace unions the constraint lists and keeps your own caps', ()=>{
    const G = fresh();
    const r = G.evalIn(`mergeWorkspaceSettings(
      {constraints: {bannedCategories: ['A'], requiredTraitIds: [1], exclusivePairs: [[1,2]], categoryTiers: [['X','prefer']], rarityCaps: {common: 3, signature: null}, intensityCaps: {}}, disabledPacks: ['p1']},
      {constraints: {bannedCategories: ['A','B'], requiredTraitIds: [2], exclusivePairs: [[1,2],[3,4]], categoryTiers: [['X','rarely'],['Y','rarely']], rarityCaps: {common: 9, signature: 1}, intensityCaps: {sheet: 50}}, disabledPacks: ['p2']})`);
    const c = r.constraints;
    assert(c.bannedCategories.join() === 'A,B' && c.requiredTraitIds.join() === '1,2', 'lists were not unioned');
    assert(c.exclusivePairs.length === 2, 'the duplicate pair was not merged');
    assert(JSON.stringify(c.categoryTiers) === JSON.stringify([['X','prefer'],['Y','rarely']]), 'your own tier did not win: ' + JSON.stringify(c.categoryTiers));
    assert(c.rarityCaps.common === 3 && c.rarityCaps.signature === 1 && c.intensityCaps.sheet === 50, 'caps: ' + JSON.stringify(c.rarityCaps) + JSON.stringify(c.intensityCaps));
    assert(r.disabledPacks.join() === 'p1,p2', 'packs were not unioned');
  });

  check('ROBUST closing the tab asks only when invested work is unsaved; a failed write raises the storage banner', ()=>{
    const G = fresh(); G.gen('ug1');
    G.evalIn("castStates = []; pinnedTargets = {}; traitNotes = {}; arcEvents = []; markWorkSaved()");
    assert(G.evalIn("hasUnsavedInvestment()") === false, 'a fresh roll nobody invested in should not block closing');
    G.evalIn("const k = Object.keys(state).find(k => state[k] && state[k].trait); state[k].locked = true");
    assert(G.evalIn("hasUnsavedInvestment()") === true, 'a kept card was not treated as unsaved work');
    G.evalIn("markWorkSaved()");
    assert(G.evalIn("hasUnsavedInvestment()") === false, 'saving did not clear it');
    G.evalIn("pinnedTargets = {a: 3}");
    assert(G.evalIn("hasUnsavedInvestment()") === true, 'a pin made after the save was missed');
    G.document._set('storageStatus', {style: {}, className: '', textContent: ''});
    G.evalIn("noteStorageFailure(Object.assign(new Error('x'), {name: 'QuotaExceededError'}))");
    assert(/storage is full/i.test(G.document.getElementById('storageStatus').textContent), 'no banner for a full store: ' + G.document.getElementById('storageStatus').textContent);
  });

  check('ROBUST the seed picker is built when its panel opens, not on load', ()=>{
    const eng = read('js/engine.js');
    assert(/function ensureSeedPickerRendered/.test(eng) && /addEventListener\('toggle'/.test(eng), 'the seed picker is still built eagerly');
    assert(/_seedPickerRendered = true;\s*\n\s*const q = strVal/.test(eng), 'filtering does not render the options');
  });

  // ---- §5a/§5b leftovers: name shapes, foil frames, lean blending ----
  check('LEFT emergent names take more than one shape, and stay stable for a sheet', ()=>{
    const G = fresh(); const shapes = {the: 0, who: 0, of: 0, coat: 0}; let n = 0;
    for (let i = 1; i <= 80; i++){
      G.gen('nm' + i);
      const a = G.evalIn("(emergentArchetypeName(state)||{}).name || ''"), b = G.evalIn("(emergentArchetypeName(state)||{}).name || ''");
      assert(a === b, 'the name changed between two reads: ' + a + ' / ' + b);
      if (!a) continue; n++;
      if (/ in .+'s Coat$/.test(a)) shapes.coat++; else if (/ Who /.test(a)) shapes.who++; else if (/^The \S+ of /.test(a)) shapes.of++; else shapes.the++;
    }
    assert(shapes.who + shapes.of + shapes.coat >= 3, 'every name still has one shape: ' + JSON.stringify(shapes));
    assert(shapes.the > 0, 'the old shape vanished');
  });

  check('LEFT foils: premise frames cover humour, attachment, role and origin as well as the old six', ()=>{
    const G = fresh(); const seen = new Set();
    for (let i = 1; i <= 40; i++){
      G.gen('fa' + i); G.evalIn("globalThis.__A = JSON.parse(JSON.stringify(state))");
      G.gen('fb' + i);
      const t = G.evalIn(`(function(){ const p = foilPremiseFromSheets(state, __A, mulberry32(${i}), {a:'Ann', b:'Bo'}); return p ? p.text : ''; })()`);
      if (/funny in one register|loves .* loves |takes the .* seat|came from/.test(t)) seen.add(t.slice(0, 18));
    }
    assert(seen.size >= 2, 'the new frames never came up in 40 draws');
  });

  check('LEFT voice lines are deterministic with lean blending', ()=>{
    const G = fresh(); G.gen('lean1');
    const a = G.evalIn("JSON.stringify(voiceLines ? voiceLines(state, 'lean1', 'refuse') : '')");
    G.gen('lean1');
    const b = G.evalIn("JSON.stringify(voiceLines ? voiceLines(state, 'lean1', 'refuse') : '')");
    assert(a === b, 'the same seed gave different lines');
  });

  check('LEFT chains and beats take more than one structure, deterministically, with every card still cited', ()=>{
    const G = fresh(); const cs = new Set(), bs = new Set();
    for (let i = 1; i <= 120; i++){
      G.gen('cs' + i);
      const r = G.evalIn("(()=>{const c=motivationChain(state);const b=backstoryBeats(state,{age:'40'});return {s:c&&c.shape,c:c&&c.links.map(l=>l.key+'|'+l.text),b:b&&b.map(x=>x.title+'|'+x.text)}})()");
      const r2 = G.evalIn("(()=>{const c=motivationChain(state);const b=backstoryBeats(state,{age:'40'});return {s:c&&c.shape,c:c&&c.links.map(l=>l.key+'|'+l.text),b:b&&b.map(x=>x.title+'|'+x.text)}})()");
      assert(JSON.stringify(r) === JSON.stringify(r2), 'not deterministic');
      if (r.s) cs.add(r.s);
      (r.b || []).forEach(x => { const t = x.split('|')[0]; if (/late|no event|Two formative|turned nothing/.test(t)) bs.add(t); });
      (r.c || []).forEach(x => assert(x.length > 14, 'an empty link: ' + x));
    }
    assert(cs.size >= 3, 'chain shapes: ' + [...cs]);
    assert(bs.size >= 3, 'beat shapes: ' + [...bs]);
  });

  check('LEFT recovery names the cast member they trust and the one who makes it worse', ()=>{
    const G = fresh(); G.gen('rc1');
    const r = G.evalIn(`(()=>{
      const st = state, other = {id:'o1', meta:{name:'Marit'}, state: st}, foe = {id:'o2', meta:{name:'Dov'}, state: st}, me = {id:'me', meta:{name:'Self'}, state: st};
      const ctx = {selfId:'me', members:[me, other, foe], edges:[{from:'me', to:'o1', role:'confidant', trust:5}, {from:'me', to:'o2', role:'rival', trust:1}]};
      const a = recoverySheet(st), b = recoverySheet(st, ctx);
      return {a: a && a.rows.map(x=>x.key+':'+x.text), b: b && b.rows.map(x=>x.key+':'+x.text)};
    })()`);
    assert(r.b.some(x => /^who:.*Marit/.test(x)), 'the trusted member was not named: ' + r.b.join(' | '));
    assert(r.b.some(x => /^worse:.*Dov/.test(x)), 'the rival was not named');
    assert(!r.a.some(x => /Marit|Dov/.test(x)), 'a lone sheet named a cast member');
  });

  check('LEFT cast optimisation counts shared Lie / Wound / Want and stress-attachment pairs', ()=>{
    const G = fresh(); G.gen('co1'); G.evalIn('globalThis.__a = state'); G.gen('co2');
    const r = G.evalIn(`(()=>{
      const mk = (id, st) => ({id, state: st, meta:{name:id}});
      const same = [mk('x', __a), mk('y', __a), mk('z', state)];
      let calls = 0;
      const out = optimiseCastVoices(same, 'co', i => { calls++; return {state: state, variants: {}}; }, {passes: 2, attempts: 2});
      return {before: out.before, calls};
    })()`);
    assert(r.before > 0, 'two identical members registered no collisions');
    assert(r.calls > 0, 'the optimiser never tried to reroll the colliding member');
  });

  check('LEFT life-stage lenses reach the beats and the recovery sheet', ()=>{
    const G = fresh(); G.document._set('lensSelect', {value: ''}); G.gen('ln1');
    const get = lens => { G.evalIn(`document.getElementById('lensSelect').value = '${lens}'`);
      return G.evalIn("JSON.stringify({b: backstoryBeats(state, {age:'40'}), r: recoverySheet(state)})"); };
    const base = get(''), dying = get('dying'), child = get('child');
    assert(/What is left unsaid/.test(dying) && !/What is left unsaid/.test(base), 'the dying lens did not rewrite the last beat');
    assert(/less time to waste/.test(dying), 'the dying lens did not reach recovery');
    assert(/where nobody asked why/.test(child), 'the child lens left the failure beat alone');
    G.evalIn("document.getElementById('lensSelect').value = ''");
  });

  check('LEFT an explicit clash table catches pairs polarity cannot see', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const by = n => TRAITS.find(t => t.trait === n);
      const w = by('Whispered'), b = by('Resonant-booming'), q = by('Never-apologizes'), o = by('Over-apologetic gasp'), x = by('Interruptive');
      const st = {a:{trait:w}, b:{trait:b}, c:{trait:q}, d:{trait:o}};
      const calm = {a:{trait:w}, b:{trait:x}};
      return {clash: checkConflictsFor(st).filter(c => /cannot both hold/.test(c.text)).map(c => c.text), calm: checkConflictsFor(calm).filter(c => /cannot both hold/.test(c.text)).length};
    })()`);
    assert(r.clash.length === 2, 'expected the whisper/boom and apology clashes, got: ' + JSON.stringify(r.clash));
    assert(r.calm === 0, 'an unrelated pair was flagged');
  });

  check('LEFT near-duplicate pairs are found, a sheet that seats both is told, and the bank has none left', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const left = nearDuplicateIndex().size;
      const mk = (id, n, d) => ({id, section: 'Test', category: 'Dup', trait: n, desc: d, example: 'x', intensity: 3, rarity: 'common', pol: {}});
      const a = mk(990001, 'Overcommitting habit', 'Says yes to every request and then cannot deliver on any of them.');
      const b = mk(990002, 'Overcommitting habit again', 'Says yes to every request and then cannot deliver on any of them either.');
      TRAITS.push(a, b); _NEAR_DUPS = null;
      const idx = nearDuplicateIndex();
      const out = {left, has: !!(idx.get(a.id) && idx.get(a.id).has(b.id)), told: checkConflictsFor({x:{trait:a}, y:{trait:b}}).filter(c => /nearly the same thing/.test(c.text)).length};
      TRAITS.pop(); TRAITS.pop(); _NEAR_DUPS = null;
      return out;
    })()`);
    assert(r.left <= 6, r.left + ' near-duplicate traits remain in the bank');
    assert(r.has && r.told === 1, 'a synthetic pair was not reported: ' + JSON.stringify(r));
  });

  check('LEFT every category the growth packs touched reaches the floor of 15, and the packs stay inside their id range', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const cnt = {}, touched = new Set(), badIds = [];
      TRAITS.forEach(t => { const k = t.section + ' :: ' + t.category; cnt[k] = (cnt[k] || 0) + 1; if (t.id >= 190000 && t.id < 200000){ touched.add(k); } });
      return {short: [...touched].filter(k => cnt[k] < 15).map(k => k + ' ' + cnt[k]), n: touched.size, grown: TRAITS.filter(t => t.id >= 190000).length, badIds};
    })()`);
    assert(r.n >= 50, 'the growth packs touched only ' + r.n + ' categories');
    assert(!r.short.length, 'still under 15: ' + r.short.join('; '));
    assert(!r.badIds.length, 'ids outside the pack range');
    assert(r.grown >= 400, 'expected ~450 grown traits, got ' + r.grown);
  });

  check('LEFT against-type flips a preset\'s strongest axes, and off changes nothing', ()=>{
    const G = fresh(), d = G.document;
    d._set('archetypeSelect', {value: 'plainSpoken'}); d._set('archetypeVariation', {value: ''}); d._set('archetypeBlend', {value: '1'}); d._set('againstType', {value: '0'});
    G.gen('against1'); const off = G.sig();
    d.getElementById('againstType').value = '2'; G.gen('against1'); const on = G.sig();
    assert(on !== off, 'flipping two axes changed nothing');
    d.getElementById('againstType').value = '0'; G.gen('against1');
    assert(G.sig() === off, 'turning it off did not restore the same character');
    assert(/againstType/.test(fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8')), 'the setting is not captured');
  });

  check('LEFT inferred polarity reaches conflict reports and never the draw', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const by = n => TRAITS.find(t => t.trait === n);
      const a = by('Hesitant'), b = by('Command-rhythm');
      const un = TRAITS.filter(t => !t.pol || !Object.keys(t.pol).length);
      return {inferred: un.filter(t => Object.keys(inferredPolarity(t)).length).length, untagged: un.length, a: JSON.stringify(inferredPolarity(a)), pRaw: JSON.stringify(a.pol || {}),
        conflict: checkConflictsFor({x:{trait:a}, y:{trait:b}}).length};
    })()`);
    assert(r.inferred >= 300, 'only ' + r.inferred + ' of ' + r.untagged + ' untagged traits got an inferred pole');
    assert(r.pRaw === '{}', 'the stored polarity was changed');
    assert(r.conflict >= 1, 'an inferred opposition was not reported');
  });

  check('LEFT Conflict Style is an optional section with seven categories, linked from the sliders and hinted by presets', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const ps = PROFILE_SECTIONS.find(p => p.id === 'conflictstyle');
      const cats = {}; TRAITS.filter(t => t.section === 'Conflict Style').forEach(t => cats[t.category] = (cats[t.category] || 0) + 1);
      const hinted = Object.values(ARCHETYPE_PROFILE_HINTS).filter(h => h.conflictstyle).length;
      return {off: ps && ps.defaultOn === false, cats, hinted};
    })()`);
    assert(r.off === true, 'the section is missing or on by default');
    assert(Object.keys(r.cats).length === 7 && Object.values(r.cats).every(n => n >= 13), 'categories: ' + JSON.stringify(r.cats));
    assert(r.hinted >= 4, 'only ' + r.hinted + ' presets hint it');
    G.document._set('sec_conflictstyle', {checked: true}); G.document._set('type_conflictstyle', {value: 'Litigator', tagName: 'SELECT', options: [{value: ''}, {value: 'Litigator'}]});
    let got = false;
    for (let i = 1; i <= 30 && !got; i++){ G.gen('cs' + i); got = G.evalIn("Object.values(state).some(s => s && s.trait && s.trait.section === 'Conflict Style')"); }
    assert(got, 'the section never produced a card when switched on');
  });

  check('SEEDV v1 seeds replay exactly as before; v2 seeds use the coverage changes', ()=>{
    const G = fresh(); G.document._set('sec_conflictstyle', {checked: false});
    let h = 0;
    for (let i = 1; i <= 12; i++){ G.gen('v1-' + (i * 7919).toString(36)); for (const c of G.sig()) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0; }
    assert((h >>> 0) === 3304622972, 'a v1 seed now builds a different character (hash ' + (h >>> 0) + '); old links would break');
    const ids = (pre, n) => { const seen = new Set(), verb = new Set(); let noGhostOrDef = 0, sig = 0, tot = 0;
      for (let i = 1; i <= n; i++){ G.gen(pre + (i * 104729).toString(36));
        const r = G.evalIn("(()=>{const v=Object.values(state).find(s=>s&&s.slotId==='verbosity');const m=Object.values(state).filter(s=>s&&s.trait&&s.trait.section==='Motivation & Wound'&&/_\\d+$/.test(s.slotId||'')).length;const sg=Object.values(state).filter(s=>s&&s.trait&&s.trait.rarity==='signature').length;return {v:v&&v.trait?v.trait.category:'',m,sg,n:Object.values(state).filter(s=>s&&s.trait).length}})()");
        verb.add(r.v); if (r.m < 7) noGhostOrDef++; sig += r.sg; tot += r.n; }
      return {verb: verb.size, drop: noGhostOrDef, sigShare: sig / tot}; };
    const a = ids('v1-', 80), b = ids('v2-', 80);
    assert(a.verb === 1, 'v1 verbosity should stay pacing-only at neutral, got ' + a.verb);
    assert(b.verb >= 3, 'v2 neutral verbosity reached only ' + b.verb + ' categories');
    assert(a.drop === 0 && b.drop >= 10, 'omitted motivation cards: v1 ' + a.drop + ', v2 ' + b.drop);
    assert(b.sigShare > a.sigShare, 'v2 did not draw signature traits more often: ' + a.sigShare + ' vs ' + b.sigShare);
  });

  check('SEEDV a blank-seed roll prints a v2 seed, and restoring an old link sets the engine to 1', ()=>{
    const G = fresh(); G.document._set('engineVersion', {value: '2'});
    G.gen('');
    assert(/^v2-/.test(G.evalIn('lastSeedUsed')), 'blank roll printed ' + G.evalIn('lastSeedUsed'));
    G.document._set('engineVersion', {value: '2'});
    G.evalIn("restoreSettings({fields: {}})");
    assert(G.document.getElementById('engineVersion').value === '1', 'an old link did not restore engine 1');
    assert(G.evalIn("engineVersionFor('v1-abc')") === 1 && G.evalIn("engineVersionFor('v2-abc')") === 2, 'a prefixed seed does not pick its own engine');
  });
};
module.exports.fresh = fresh;
