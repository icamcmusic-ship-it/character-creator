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
};
