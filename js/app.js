
// ================= STORAGE =================
// `window.storage` is the key-value API Anthropic exposes inside Claude-artifact
// sandboxes — it is NOT a browser API. This app is also deployed as a plain static
// site (GitHub Pages, via .github/workflows/deploy.yml), where `window.storage` is
// simply undefined. Without this shim, every save/load below silently failed on the
// real deployed site: Save Character always showed "Could not save", the saved list
// stayed empty forever, and preferences never persisted across a reload.
// Feature-detect and fall back to a same-shaped localStorage-backed implementation.
const storage = (function(){
  if (typeof window !== 'undefined' && window.storage &&
      typeof window.storage.get === 'function' && typeof window.storage.set === 'function' &&
      typeof window.storage.list === 'function' && typeof window.storage.delete === 'function'){
    return window.storage;
  }
  const PREFIX = 'cc_storage:';
  // localStorage itself can throw (private browsing in some browsers, storage
  // disabled) — fall back to an in-memory Map so the app still runs, it just
  // won't persist across reloads.
  let backend;
  try {
    const probeKey = '__cc_storage_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    backend = window.localStorage;
  } catch(e){
    const mem = new Map();
    backend = {
      getItem: k => mem.has(k) ? mem.get(k) : null,
      setItem: (k,v) => mem.set(k,v),
      removeItem: k => mem.delete(k),
      get length(){ return mem.size; },
      key: i => [...mem.keys()][i],
    };
  }
  return {
    async get(key){
      const v = backend.getItem(PREFIX + key);
      return v === null ? null : { value: v };
    },
    async set(key, value){ backend.setItem(PREFIX + key, value); },
    async delete(key){ backend.removeItem(PREFIX + key); },
    async list(prefix){
      const keys = [];
      for (let i = 0; i < backend.length; i++){
        const k = backend.key(i);
        if (k && k.startsWith(PREFIX + prefix)) keys.push(k.slice(PREFIX.length));
      }
      return { keys };
    },
  };
})();

async function saveCharacter(btnEl){
  if(!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  const name = charMeta.name || prompt("Name this character voice:");
  if(!name) return;
  const btn = btnEl || null;
  const oldLabel = btn ? btn.textContent : null;
  if (btn){ btn.textContent = "Saving…"; btn.disabled = true; }
  try {
    // Saved characters carry the same full-fidelity settings block the file export
    // does, so loading one restores the setup that produced it rather than dropping
    // the sheet into whatever the controls happen to say now.
    await storage.set('character:'+name, JSON.stringify({
      state, charMeta, pressureState, pinnedTargets, charVariants,
      settings: captureSettings(), savedAt: new Date().toISOString(),
    }));
    await loadSavedList();
    toast('Saved "' + name + '"');
  } catch(e){ console.error(e); toast("Could not save — try again.", "warn"); }
  finally { if (btn){ btn.textContent = oldLabel; btn.disabled = false; } }
}
async function deleteSavedCharacter(name){
  if (!confirm(`Delete the saved character "${name}"? This can't be undone.`)) return;
  try { await storage.delete('character:'+name); await loadSavedList(); toast('Deleted "'+name+'"'); }
  catch(e){ console.error(e); toast("Could not delete — try again.", "warn"); }
}
async function renameSavedCharacter(name){
  const next = prompt('Rename "'+name+'" to:', name);
  if (!next || next === name) return;
  try {
    const r = await storage.get('character:'+name);
    if (!r || !r.value) return;
    const parsed = JSON.parse(r.value);
    if (parsed.charMeta) parsed.charMeta.name = next;
    await storage.set('character:'+next, JSON.stringify(parsed));
    await storage.delete('character:'+name);
    await loadSavedList();
    toast('Renamed to "'+next+'"');
  } catch(e){ console.error(e); toast("Could not rename — try again.", "warn"); }
}
async function loadSavedCharacter(name){
  try {
    const r = await storage.get('character:'+name);
    const parsed = JSON.parse(r.value);
    snapshotHistory();
    state = parsed.state; charMeta = parsed.charMeta || {name, age:"", context:"", archetypeLabel:"Loaded"};
    pressureState = parsed.pressureState || null;
    pinnedTargets = parsed.pinnedTargets || {};
    charVariants = parsed.charVariants || {};
    diffLog = {}; rerollExclusions = {}; rerollHistory = {}; whyOpen = {};
    if (parsed.settings) restoreSettings(parsed.settings);
    document.getElementById('charName').value = charMeta.name || "";
    document.getElementById('charAge').value = charMeta.age || "";
    document.getElementById('charContext').value = charMeta.context || "";
    document.getElementById('archetypeTag').textContent = "Loaded: "+name;
    document.getElementById('pressureSheet').style.display = pressureState ? "block" : "none";
    lastSheetTraits = null;
    onSliderChange(); renderSheet(); checkConflicts();
    toast('Loaded "'+name+'"');
  } catch(e){ console.error(e); toast("Could not load that character.", "warn"); }
}
// The saved list used to be a bare row of names with no preview, no rename, and no
// way to tell two "Corven Ashe" saves apart. Each entry now carries what it actually
// is — archetype, trait count, when it was saved — and its own controls.
async function loadSavedList(){
  const listEl = document.getElementById('savedList');
  if (!listEl) return;
  try {
    const res = await storage.list('character:');
    if(!res || !res.keys || !res.keys.length){ listEl.innerHTML = ""; return; }
    listEl.innerHTML = "";
    const head = document.createElement('div');
    head.className = 'savedHead';
    head.textContent = 'Saved characters';
    listEl.appendChild(head);
    for (const k of res.keys){
      const name = k.replace('character:','');
      let summary = "";
      try {
        const r = await storage.get(k);
        const parsed = JSON.parse(r.value);
        const n = Object.values(parsed.state||{}).filter(x=>x&&x.trait).length;
        const bits = [];
        if (parsed.charMeta && parsed.charMeta.archetypeLabel) bits.push(parsed.charMeta.archetypeLabel);
        bits.push(n + " traits");
        if (parsed.savedAt) bits.push(new Date(parsed.savedAt).toLocaleDateString());
        summary = bits.join(" · ");
      } catch(e){ summary = "saved character"; }
      const row = document.createElement('div');
      row.className = 'savedRow';
      const open = document.createElement('button');
      open.className = 'savedOpen';
      open.innerHTML = '<b></b><span></span>';
      open.querySelector('b').textContent = name;
      open.querySelector('span').textContent = summary;
      open.onclick = ()=> loadSavedCharacter(name);
      const ren = document.createElement('button');
      ren.className = 'savedAct'; ren.textContent = 'rename';
      ren.onclick = ()=> renameSavedCharacter(name);
      const del = document.createElement('button');
      del.className = 'savedAct savedDel'; del.textContent = 'delete';
      del.setAttribute('aria-label', 'Delete ' + name);
      del.onclick = ()=> deleteSavedCharacter(name);
      row.appendChild(open); row.appendChild(ren); row.appendChild(del);
      listEl.appendChild(row);
    }
  } catch(e){ /* none saved yet */ }
}

// ================= CAST COMPARISON =================
let castStates = [];
let lastCastSeed = null;
function randomAxisLevel(){ return (Math.random()*4) - 2; }

function generateCast(){
  const count = intVal('castCount', 3);
  // BUG FIX: the cast read your Generate-group checkboxes and per-section profile
  // toggles (via buildCharacterState) but hardcoded three mannerisms and a balanced
  // rarity, so it inherited some of your settings and silently ignored the rest.
  const rarityPref = document.getElementById('rarityPref') ? document.getElementById('rarityPref').value : 0;
  const mannerCount = intVal('mannerCount', 3);
  const vocabCount = intVal('vocabCount', 2);
  // The cast was the one generator with no reproducibility at all: pure Math.random,
  // so an ensemble you liked could never be recovered or shared. Same seeded-block
  // pattern as the single character, on its own stream.
  const seedInput = document.getElementById('castSeed');
  const seedStr = seedInput ? seedInput.value.trim() : "";
  const seedNum = seedStr ? hashSeedString(seedStr) : ((Date.now() ^ (Math.random()*0x7fffffff)) >>> 0);
  lastCastSeed = seedStr || seedNum.toString(36);
  const _origRandom = Math.random;
  castStates = [];
  // withoutContextBias: the cast is not "six more of the character you just made" —
  // see the note on the helper in engine.js.
  try { withoutContextBias(()=>{
    Math.random = mulberry32(seedNum);
    for (let i=0;i<count;i++){
      const verbLevel = randomAxisLevel();
      const regLevel = randomAxisLevel();
      const compLevel = randomAxisLevel();
      const personalityOverrides = {};
      PERSONALITY_AXES.forEach(axis=>{ personalityOverrides[axis.id] = Math.round(randomAxisLevel()*50); });
      rollCharacterVariants();
      const st = buildCharacterState({verbLevel, regLevel, compLevel, mannerCount, vocabCount,
        rarityPref, vocabPref:null, personalityOverrides});
      castStates.push({state: st, meta: {name:"Character " + (i+1), age:"", context:"", archetypeLabel:"Cast member"}});
    }
  }); } finally { Math.random = _origRandom; }
  const out = document.getElementById('castSeedReadout');
  if (out) out.textContent = "Cast seed: " + lastCastSeed;
  renderCast();
  // BUG FIX: the Relationships dropdowns were only rebuilt by switchTab('rel'), so a
  // cast generated while sitting on that tab left stale (or empty) selectors behind.
  refreshRelSelectors();
}
const CAST_COLORS = ["#4a6b8a","#c2578a","#5a9a6f","#b8860b","#8a6bbf","#c96f4a"];
function renderCast(){
  const grid = document.getElementById('castGrid');
  grid.innerHTML = "";
  // Cast overlay radar: every member's axis profile on one chart, so ensemble
  // gaps (an axis nobody covers) and pile-ups (everyone leaning the same way)
  // are visible at a glance instead of only via the text balance checker.
  const overlay = document.getElementById('castRadar');
  if (overlay){
    const profiles = castStates.map((c,i)=>({label:c.meta.name, color:CAST_COLORS[i%CAST_COLORS.length], prof:axisProfile(c.state)}))
                               .filter(p=>Object.keys(p.prof).length >= 2);
    if (profiles.length >= 2){
      let legend = profiles.map(p=>`<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px;font-size:.75rem;"><i style="width:10px;height:10px;border-radius:2px;background:${escHTML(p.color)};display:inline-block;"></i>${escHTML(p.label)}</span>`).join("");
      overlay.innerHTML = `<div class="tensionTitle" style="color:var(--dusk-blue);margin-bottom:4px;">Cast overlay — axis profiles</div>${radarSVG(profiles, 360)}<div style="margin-top:6px;">${legend}</div><div class="sub" style="margin:6px 0 0;">All members on one chart. Overlapping shapes = characters pulling the same directions; empty axes = ground nobody in this ensemble covers.</div>`;
      overlay.style.display = "block";
    } else overlay.style.display = "none";
  }
  castStates.forEach((c, idx)=>{
    const card = document.createElement('div');
    card.className = "castCard";
    // Cast names are editable (rename below), so this is interpolated user text:
    // escape it rather than waiting for the day someone types a "<".
    let inner = `<h3><span>${escHTML(c.meta.name)}</span><button class="savedAct" onclick="renameCastMember(${idx})">rename</button></h3>`;
    const addAll = (ids)=>{ ids.forEach(id=>{ inner += traitCardHTML(id, c.state[id], false, false, sectionColor(titleForSlotId(id))); }); };
    addAll(Object.keys(c.state).filter(k=>k.startsWith("pers_")));
    addAll(Object.keys(c.state).filter(k=>k.startsWith("prof_")));
    addAll(["verbosity","register","grammar"].filter(id=>c.state[id]));
    addAll(Object.keys(c.state).filter(k=>k.startsWith("vocab")));
    addAll(Object.keys(c.state).filter(k=>k.startsWith("manner")));
    // Appearance was generated (on by default) and exported by sheetToText, but never
    // shown here — so the cast card and the copied markdown disagreed about what the
    // character looked like.
    addAll(Object.keys(c.state).filter(k=>k.startsWith("app_")));
    addAll(Object.keys(c.state).filter(k=>k.startsWith("wild_")));
    card.innerHTML = inner;
    grid.appendChild(card);
  });
}
function renameCastMember(i){
  const c = castStates[i];
  if (!c) return;
  const next = prompt("Name this cast member:", c.meta.name);
  if (!next) return;
  c.meta.name = next;
  renderCast();
  refreshRelSelectors();
}
function castToMarkdown(){
  const head = `# Character Cast\n\n_${castStates.length} characters_\n`;
  return head + castStates.map(c=>sheetToText(c.state, c.meta, null)).join("\n");
}
function copyCast(btnEl){
  copyText(castToMarkdown(), btnEl);
}
function downloadCast(){
  downloadText(castToMarkdown(), "character_cast.md");
}

const TABS = [
  {key:'single', view:'view-single', btn:'tabSingleBtn'},
  {key:'cast',   view:'view-cast',   btn:'tabCastBtn'},
  {key:'rel',    view:'view-rel',    btn:'tabRelBtn'},
];
function switchTab(which){
  TABS.forEach(t=>{
    const view = document.getElementById(t.view), btn = document.getElementById(t.btn);
    const on = t.key === which;
    if (view){ view.classList.toggle('active', on); view.setAttribute('aria-hidden', on ? 'false' : 'true'); }
    if (btn){ btn.classList.toggle('active', on); btn.setAttribute('aria-selected', on ? 'true' : 'false'); btn.tabIndex = on ? 0 : -1; }
  });
  if (which==='rel') refreshRelSelectors();
  document.body.classList.toggle('on-single-tab', which === 'single');
}

// ---------- live slider readouts + affinity preview ----------
// PERF FIX: the affinity preview + deterministic profile prediction walk the full
// weight matrix and category lists; running that on EVERY input event made slider
// drags stutter. Numeric readouts stay instant; the heavy preview coalesces to one
// trailing run ~80ms after the drag pauses.
let _previewTimer = null;
function onSliderChange(){
  invalidateSliderCache();
  updateSliderReadouts();
  if (_previewTimer) clearTimeout(_previewTimer);
  _previewTimer = setTimeout(updateHeavyPreview, 80);
}
function updateSliderReadouts(){
  const vRaw = intVal('verbositySlider', 0);
  const rRaw = intVal('registerSlider', 0);
  const cRaw = intVal('composureSlider', 0);
  document.getElementById('verbosityVal').textContent = vRaw;
  document.getElementById('registerVal').textContent = rRaw;
  document.getElementById('composureVal').textContent = cRaw;
  PERSONALITY_AXES.forEach(axis=>{
    const el = document.getElementById('pers_'+axis.id);
    const out = document.getElementById('persVal_'+axis.id);
    if (el && out){
      const raw = parseInt(el.value, 10) || 0;
      out.textContent = raw + " · " + axisReadout(axis, raw);
      out.classList.toggle('inNeutral', Math.abs(raw) < 14);
    }
    // Show whether this axis actually made it into the last generated sheet. With
    // "N (random)" selected the tool silently drops axes; without this the slider
    // looks active but produces nothing, which reads as a bug.
    const field = el ? el.closest('.persField') : null;
    if (field){
      const trimmed = lastAxisTrimActive && lastAxesUsed && !lastAxesUsed.has(axis.id);
      field.classList.toggle('axisTrimmed', !!trimmed);
      if (trimmed){
        const raw = parseInt(el.value);
        field.title = Math.abs(raw) > 10
          ? `Not used in the last generation. "Personality axes" is set below ${PERSONALITY_AXES.length}, so only some axes are drawn. Axes you've moved off centre are picked first — this one lost a tie-break. Raise the axis count to include it every time.`
          : `Not used in the last generation. "Personality axes" is set below ${PERSONALITY_AXES.length}, and axes left at 0 are the first to be dropped. Move this slider off centre to prioritise it, or raise the axis count.`;
      } else if (lastAxesUsed && lastAxesUsed.has(axis.id)){
        field.title = "Included in the last generated sheet.";
      } else {
        field.title = "";
      }
    }
  });

}
function updateHeavyPreview(){
  const vRaw = intVal('verbositySlider', 0);
  const rRaw = intVal('registerSlider', 0);
  const cRaw = intVal('composureSlider', 0);
  const verbLevel = rawToLevel(vRaw), regLevel = rawToLevel(rRaw), compLevel = rawToLevel(cRaw);
  // BUG FIX: this called resolveProfileCategories(), which performs a *random weighted
  // draw*. It ran on every single input event, so the "Character Profile (auto)" preview
  // reshuffled on every pixel of slider travel and showed a different "likely" answer
  // each time — it looked broken and told you nothing. Use the deterministic
  // highest-weighted category instead: a genuine prediction, stable while you drag.
  let resolvedCats = {};
  try { resolvedCats = predictProfileCategories(); } catch(e){ /* UI not fully built yet */ }
  const gBoost = boostedGrammarCats(verbLevel, compLevel, regLevel, resolvedCats);
  const vBoost = boostedVocabCats(verbLevel, regLevel, resolvedCats);
  const mBoost = boostedMannerCats(compLevel, regLevel, resolvedCats);
  const boostVal = AFFINITY();

  function fmt(map, label){
    if (!map.size) return `<div><b>${label}:</b> no boosted categories at current settings</div>`;
    const parts = [...map.entries()].sort((a,b)=>b[1]-a[1]).map(([c,s])=>`${c} (×${(1+boostVal*s).toFixed(1)})`);
    return `<div><b>${label}:</b> ${parts.join(", ")}</div>`;
  }
  let profLine = "";
  try {
    const {chosen, conf} = predictProfileCategories(true);
    const parts = PROFILE_SECTIONS.filter(ps=>chosen[ps.id]).map(ps=>{
      const pct = Math.round((conf[ps.id]||0)*100);
      return `${ps.label} → most likely <b>${chosen[ps.id]}</b> <span style="opacity:.65">(~${pct}%)</span>`;
    });
    if (parts.length) profLine = `<div style="margin-top:6px; padding-top:6px; border-top:1px dashed var(--border);"><b>Character Profile (predicted):</b><br>${parts.join("<br>")}<div class="sub" style="margin:6px 0 0;">Deterministic prediction, not a draw — generation still rolls against these odds.</div></div>`;
  } catch(e){}
  document.getElementById('affinityPreview').innerHTML =
    fmt(gBoost,"Grammar") + fmt(vBoost,"Vocabulary") + fmt(mBoost,"Mannerisms") + profLine;
  updateRangeReadout();
}

// Live explanation of what the three voice sliders are currently targeting, in the
// same units the trait cards use. Without this the new continuous range engine is
// invisible: you'd feel the difference between 35 and 45 but never see why.
function updateRangeReadout(){
  const box = document.getElementById('rangeReadout');
  if (!box) return;
  const half = bandHalf();
  const rows = [
    ['Verbosity','verbositySlider'], ['Register','registerSlider'], ['Composure','composureSlider']
  ].map(([label,id])=>{
    const raw = Math.abs(intVal(id, 0));
    const t = targetFromMag(raw);
    const lo = Math.max(1, t - half).toFixed(2), hi = Math.min(5, t + half).toFixed(2);
    return `<div><b>${label}:</b> targets intensity <b>${t.toFixed(2)}</b> · accepts ${lo}–${hi}</div>`;
  });
  const pw = document.getElementById('profileWeight');
  if (pw){
    const t = targetFromMag(parseInt(pw.value)||0);
    rows.push(`<div><b>Profile weight:</b> targets intensity <b>${t.toFixed(2)}</b></div>`);
  }
  rows.push(`<div class="sub" style="margin:6px 0 0;">Window half-width ${half.toFixed(2)} — narrower means the sliders dictate more tightly and results vary less.</div>`);
  box.innerHTML = rows.join("");
}

/* Thirteen unlabelled sliders in one flat grid is a wall, and the number alone tells
   you nothing: the response curve is eased and the middle ±14 is a genuine neutral
   band, so 8 and −8 behave identically while 60 and 90 differ a lot. Two fixes here,
   one in CSS (the shaded neutral zone on the track):
     - cluster the axes into four readable groups
     - show the resolved WORD next to the number as you drag  */
const PERSONALITY_GROUPS = [
  {label:"Warmth", blurb:"How they treat people.", axes:["friendliness","agreeableness","manners","emotionalcapacity"]},
  {label:"Control", blurb:"How much they hold themselves, and others, in check.", axes:["discipline","assertiveness","rebelliousness"]},
  {label:"Outlook", blurb:"How they read the world and tell the truth about it.", axes:["honesty","intelligence","positivity","curiosity"]},
  {label:"Energy", blurb:"How much of them there is in the room.", axes:["activeness","confidence"]},
];
// Words for the eased curve, keyed on the same thresholds the engine uses: the
// neutral band (<14), the blend zone (14–42) and committed (42+).
function intensityWord(raw){
  const m = Math.abs(raw);
  if (m < 14) return "situational";
  if (m < 30) return "faintly";
  if (m < 45) return "somewhat";
  if (m < 62) return "clearly";
  if (m < 82) return "markedly";
  return "definitively";
}
function axisPoleWord(axis, raw){
  const side = raw >= 0 ? axis.pos : axis.neg;
  const tail = side.split('—')[1];
  return tail ? tail.trim() : side;
}
function axisReadout(axis, raw){
  if (Math.abs(raw) < 14) return "situational";
  return intensityWord(raw) + " " + axisPoleWord(axis, raw).toLowerCase();
}

function buildPersonalitySliders(){
  const grid = document.getElementById('personalitySlidersGrid');
  grid.innerHTML = "";
  const placed = new Set();
  const groups = PERSONALITY_GROUPS.map(g=>({...g}));
  const leftovers = PERSONALITY_AXES.filter(a=>!groups.some(g=>g.axes.includes(a.id))).map(a=>a.id);
  if (leftovers.length) groups.push({label:"Other", blurb:"", axes:leftovers});
  groups.forEach(g=>{
    const wrap = document.createElement('div');
    wrap.className = "persGroup";
    const head = document.createElement('div');
    head.className = "persGroupHead";
    head.innerHTML = `<span>${escHTML(g.label)}</span>${g.blurb ? `<i>${escHTML(g.blurb)}</i>` : ``}`;
    wrap.appendChild(head);
    const inner = document.createElement('div');
    inner.className = "persGroupGrid";
    g.axes.forEach(id=>{
      const axis = PERSONALITY_AXES.find(a=>a.id===id);
      if (!axis || placed.has(id)) return;
      placed.add(id);
      const div = document.createElement('div');
      div.className = "field persField";
      const lo = axis.neg.split('—')[1] ? axis.neg.split('—')[1].trim() : 'Low';
      const hi = axis.pos.split('—')[1] ? axis.pos.split('—')[1].trim() : 'High';
      div.innerHTML = `
        <label for="pers_${axis.id}">${escHTML(axis.label)}</label>
        <div class="sliderWrap"><span class="neutralBand" aria-hidden="true"></span><span class="blendBand" aria-hidden="true"></span>
        <input type="range" id="pers_${axis.id}" min="-100" max="100" value="0" step="1"
               oninput="onSliderChange()" aria-label="${escHTML(axis.label)}: ${escHTML(lo)} to ${escHTML(hi)}"
               aria-describedby="persVal_${axis.id}"></div>
        <div class="scaleLabels"><span>${escHTML(lo)}</span><span>${escHTML(hi)}</span></div>
        <div class="sliderVal" id="persVal_${axis.id}" title="Below 14 either side of centre, this axis draws from its Situational pool.">0 · situational</div>
      `;
      inner.appendChild(div);
    });
    wrap.appendChild(inner);
    grid.appendChild(wrap);
  });
}
function togglePersonalityPanel(){
  const enabled = document.getElementById('personalityToggle').checked;
  document.getElementById('personalitySlidersGrid').classList.toggle('disabled', !enabled);
}

function toggleExamples(){
  const show = document.getElementById('examplesToggle').checked;
  document.body.classList.toggle('hide-examples', !show);
}

function resetAllToDefaults(){
  // BUG FIX: this cleared persisted preferences and per-slot UI state BEFORE asking
  // for confirmation, so cancelling the dialog still silently wiped your saved
  // settings. Confirm first, mutate second.
  if (!confirm("Reset every slider, toggle, and field back to defaults? Your generated character stays until you generate again.")) return;
  try { storage.delete(PREF_KEY); } catch(e){}
  rerollExclusions = {}; rerollHistory = {}; whyOpen = {}; lastDepthUntouched = []; pinnedTargets = {};
  lastAxesUsed = null; lastAxisTrimActive = false;
  document.getElementById('verbositySlider').value = 0;
  document.getElementById('registerSlider').value = 0;
  document.getElementById('composureSlider').value = 0;
  PERSONALITY_AXES.forEach(a=>{ const el = document.getElementById('pers_'+a.id); if (el) el.value = 0; });
  PROFILE_SECTIONS.forEach(ps=>{
    const tog = document.getElementById('sec_'+ps.id); if (tog) tog.checked = true;
    const sel = document.getElementById('type_'+ps.id); if (sel) sel.value = "";
  });
  document.getElementById('charName').value = "";
  document.getElementById('charAge').value = "";
  document.getElementById('charContext').value = "";
  document.getElementById('archetypeSelect').value = "";
  document.getElementById('mannerCount').value = "3";
  document.getElementById('vocabCount').value = "2";
  document.getElementById('rarityPref').value = "0";
  document.getElementById('personalityCount').value = "13";
  document.getElementById('profileDepth').value = "1";
  document.getElementById('affinityBoost').value = "2.5";
  const rf = document.getElementById('rangeFocus'); if (rf) rf.value = "0.62";
  const pw = document.getElementById('profileWeight'); if (pw) pw.value = "55";
  const dv = document.getElementById('divergence'); if (dv) dv.value = "0";
  ['avoidRecentToggle','wildcardToggle','compactToggle'].forEach(id=>{
    const el = document.getElementById(id); if (el) el.checked = false;
  });
  PROFILE_SECTIONS.forEach(ps=>{ const el = document.getElementById('pw_'+ps.id); if (el) el.value = ""; });
  clearConstraints();
  forgetRecentTraits(); forgetSessionProfiles(); clearContextBias();
  collapsedGroups = {};
  document.getElementById('stressToggle').checked = false;
  document.getElementById('personalityToggle').checked = true;
  document.getElementById('examplesToggle').checked = true;
  const depthFirst = document.getElementById('depthFirstToggle'); if (depthFirst) depthFirst.checked = false;
  const seedFilter = document.getElementById('seedTraitFilter'); if (seedFilter) seedFilter.value = "";
  const seedSel = document.getElementById('seedTraitSelect'); if (seedSel) seedSel.value = "";
  document.body.classList.remove('hide-examples');
  togglePersonalityPanel();
  toggleCompact();
  onSliderChange();
  toast("Everything reset to defaults.");
}

function randomRawSlider(){
  // biased toward the extremes a bit so randomized characters read as distinctive, not muddy-neutral
  const r = Math.random();
  let v;
  if (r < 0.6) { v = (Math.random()*2-1) * 100; }           // 60%: anywhere in range
  else { v = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random()*40); } // 40%: pushed toward an extreme
  return Math.round(clamp(v, -100, 100));
}

function randomizeSliders(scope){
  if (scope === 'voice' || scope === 'all'){
    document.getElementById('verbositySlider').value = randomRawSlider();
    document.getElementById('registerSlider').value = randomRawSlider();
    document.getElementById('composureSlider').value = randomRawSlider();
  }
  if (scope === 'personality' || scope === 'all'){
    PERSONALITY_AXES.forEach(axis=>{
      const el = document.getElementById('pers_'+axis.id);
      if (el) el.value = randomRawSlider();
    });
  }
  onSliderChange();
}


// ================= CUSTOM ARCHETYPES =================
async function saveCustomArchetype(btnEl){
  const name = document.getElementById('customArchName').value.trim();
  if(!name){ toast("Give the archetype a name first.", "warn"); return; }
  const btn = btnEl || null;
  const oldLabel = btn ? btn.textContent : null;
  if (btn){ btn.textContent = "Saving…"; btn.disabled = true; }
  const pers = {};
  PERSONALITY_AXES.forEach(axis=>{
    const el = document.getElementById('pers_'+axis.id);
    if (el) pers[axis.id] = parseInt(el.value);
  });
  const arch = {
    label: name,
    verbosity: rawToLevel(intVal('verbositySlider', 0)),
    register: rawToLevel(intVal('registerSlider', 0)),
    composure: rawToLevel(intVal('composureSlider', 0)),
    vocabPref: null,
    pers,
    // Sliders alone never reproduced the workflow that produced an archetype — the
    // constraints, counts and section toggles that were just as much a part of it
    // were dropped. Stored alongside, and applied only on explicit request (see
    // applyArchetypeSetup), so selecting an archetype stays a light-touch blend.
    setup: captureSettings(),
  };
  try {
    await storage.set('archetype:'+name, JSON.stringify(arch));
    CUSTOM_ARCHETYPES['custom_'+name] = arch;
    await loadCustomArchetypes();
    document.getElementById('customArchName').value = "";
  } catch(e){ console.error(e); toast("Could not save archetype.", "warn"); }
  finally { if (btn){ btn.textContent = oldLabel; btn.disabled = false; } }
}

// Restores the full setup an archetype was saved with — constraints, counts, section
// toggles and all. Deliberately a separate button: selecting an archetype must keep
// meaning "blend this posture with mine", not "replace everything I have set".
function applyArchetypeSetup(){
  const sel = document.getElementById('archetypeSelect');
  const arch = sel ? CUSTOM_ARCHETYPES[sel.value] : null;
  if (!arch){ toast("Select one of your custom archetypes first.", "warn"); return; }
  if (!arch.setup){ toast("That archetype was saved before setups were stored — sliders only.", "warn"); return; }
  restoreSettings(arch.setup);
  if (sel) sel.value = 'custom_' + arch.label;
  onSliderChange();
  toast('Restored the full setup saved with "' + arch.label + '".');
}

async function deleteCustomArchetype(){
  const sel = document.getElementById('archetypeSelect');
  const key = sel.value;
  if (!key.startsWith('custom_')){ toast("Select one of your custom archetypes in the dropdown first.", "warn"); return; }
  const name = key.replace('custom_','');
  if (!confirm(`Delete the archetype "${name}"? This can't be undone.`)) return;
  try {
    await storage.delete('archetype:'+name);
    delete CUSTOM_ARCHETYPES[key];
    await loadCustomArchetypes();
  } catch(e){ console.error(e); toast("Could not delete — try again.", "warn"); }
}

async function loadCustomArchetypes(){
  try {
    const res = await storage.list('archetype:');
    CUSTOM_ARCHETYPES = {};
    if (res && res.keys){
      for (const k of res.keys){
        try {
          const r = await storage.get(k);
          const arch = JSON.parse(r.value);
          CUSTOM_ARCHETYPES['custom_'+arch.label] = arch;
        } catch(e){}
      }
    }
  } catch(e){}
  // rebuild dropdown
  const sel = document.getElementById('archetypeSelect');
  const current = sel.value;
  [...sel.querySelectorAll('option')].forEach(o=>{ if(o.value.startsWith('custom_')) o.remove(); });
  Object.entries(CUSTOM_ARCHETYPES).forEach(([key,arch])=>{
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = arch.label + " (custom)";
    sel.appendChild(opt);
  });
  if ([...sel.options].some(o=>o.value===current)) sel.value = current;
  const list = document.getElementById('customArchList');
  const names = Object.values(CUSTOM_ARCHETYPES).map(a=>a.label);
  list.textContent = names.length ? "Saved archetypes: " + names.join(", ") : "";
}

// ================= RELATIONSHIP GENERATOR =================
function refreshRelSelectors(){
  const a = document.getElementById('relA'), b = document.getElementById('relB');
  const opts = [];
  if (Object.keys(state).length) opts.push({key:"__single__", label:(charMeta.name||"Current character")});
  castStates.forEach((c,i)=> opts.push({key:"cast_"+i, label:c.meta.name}));
  [a,b].forEach((sel,idx)=>{
    const prev = sel.value;
    sel.innerHTML = "";
    opts.forEach(o=>{
      const el = document.createElement('option');
      el.value = o.key; el.textContent = o.label; sel.appendChild(el);
    });
    if ([...sel.options].some(o=>o.value===prev)) sel.value = prev;
    else if (opts.length > 1) sel.value = opts[Math.min(idx, opts.length-1)].key;
  });
}
function getCharByKey(key){
  if (key === "__single__") return {state, meta: charMeta};
  const i = parseInt(key.replace("cast_",""));
  return castStates[i];
}
function axisProfile(st){
  // Aggregate polarity across a character's Personality AND Profile-section traits —
  // previously this only read pers_ slots, so Values/Attachment/Role/etc (arguably the
  // more predictive data for how two characters clash) were invisible to Relationship
  // and Ensemble analysis. Voice traits carry pol too but are deliberately excluded here:
  // this profile is about who the character IS, not how they happen to phrase things.
  const prof = {};
  Object.keys(st).filter(k=>k.startsWith("pers_") || k.startsWith("prof_")).forEach(id=>{
    // BUG FIX: slots can legitimately hold a null trait (exhausted pool, disabled
    // section on a loaded save); dereferencing .trait.pol here crashed the whole
    // Relationship and Ensemble tools for that character.
    const t = st[id] && st[id].trait;
    if (!t || !t.pol) return;
    Object.entries(t.pol).forEach(([ax,v])=>{
      if (!AXIS_LABELS[ax]) return;
      prof[ax] = (prof[ax]||0) + v;
    });
  });
  return prof;
}
// Category-pair interpretive notes for the two-character Relationship view — the same
// "resolved category X meets resolved category Y" pattern TENSION_RULES/SECOND_ORDER_RULES
// already use for single-character tension detection, ported here because axis-sum math
// alone (axisProfile) can't see Values/Role/Attachment/Stress/Humor/Vices identity, which
// is often the more narratively decisive thing two characters clash or align on.
// Order-independent: each rule matches regardless of which character is A and which is B.
const RELATIONSHIP_CATEGORY_RULES = [
  {a:{sec:"role",cat:"Leader"}, b:{sec:"role",cat:"Leader"},
   note:"Two leaders in the same room. Either they split turf cleanly, or every shared decision becomes a quiet contest over who actually has the floor."},
  {a:{sec:"role",cat:"Leader"}, b:{sec:"role",cat:"Outsider"},
   note:"A leader and an outsider. The leader keeps trying to fold them in; the outsider reads every attempt as either an audition or a trap."},
  {a:{sec:"role",cat:"Instigator"}, b:{sec:"role",cat:"Peacemaker"},
   note:"An instigator paired with a peacemaker: one lights the fire, the other keeps putting it out. Neither can fully stop, or the relationship loses its function."},
  {a:{sec:"role",cat:"Caretaker"}, b:{sec:"role",cat:"Caretaker"},
   note:"Two caretakers. Warm, but nobody in the pairing is actually being taken care of — watch for who quietly runs out first."},
  {a:{sec:"role",cat:"Skeptic"}, b:{sec:"values",cat:"Idealistic & Visionary"},
   note:"A skeptic across from a true believer. The skeptic's questions read as sabotage to the idealist; the idealist's certainty reads as naivety to the skeptic."},
  {a:{sec:"values",cat:"Rigid & Principled"}, b:{sec:"values",cat:"Self-Interested"},
   note:"A fixed code across from someone who bends for advantage. Every shared decision becomes a referendum on which of them the situation actually rewards."},
  {a:{sec:"values",cat:"Loyalty-Bound"}, b:{sec:"values",cat:"Self-Interested"},
   note:"One measures every choice by who it's owed to; the other by what it gets them. They can cooperate a long time before either notices they're keeping score differently."},
  {a:{sec:"attachment",cat:"Anxious"}, b:{sec:"attachment",cat:"Avoidant"},
   note:"The classic pursue-withdraw pair: the more one reaches, the more the other retreats — which only confirms the first one's fear and accelerates the reach."},
  {a:{sec:"attachment",cat:"Secure"}, b:{sec:"attachment",cat:"Secure"},
   note:"Two securely attached people. Unusually low-drama by this tool's standards — the tension in this pairing has to come from outside the relationship, not inside it."},
  {a:{sec:"stress",cat:"Fight (attack the threat)"}, b:{sec:"stress",cat:"Fight (attack the threat)"},
   note:"Both come out swinging under pressure. Fine as allies against a shared threat; explosive the moment the threat is each other."},
  {a:{sec:"stress",cat:"Freeze (shut down)"}, b:{sec:"stress",cat:"Fawn (appease the threat)"},
   note:"One shuts down, the other starts placating — and the placating reads to the frozen one as more pressure, which shuts them down further."},
  {a:{sec:"humor",cat:"Cruel & Barbed"}, b:{sec:"humor",cat:"Warm & Playful"},
   note:"One's jokes draw blood, the other's don't. The warm one keeps extending the benefit of the doubt long after it's stopped being funny to them."},
  {a:{sec:"humor",cat:"Dry & Deadpan"}, b:{sec:"humor",cat:"Dry & Deadpan"},
   note:"Two deadpan deliveries. Outsiders often can't tell either of them is joking at all; each other, they read instantly."},
  {a:{sec:"vices",cat:"Restraint & Discipline"}, b:{sec:"vices",cat:"Risk & Escape"},
   note:"One's whole structure is control; the other's is release. They either regulate each other or each quietly resents what the other represents."},
];
function categoryPairNotesFor(stA, stB){
  const catOf = (st,id) => slotCat(st["prof_"+id+"_0"]);
  const notes = [];
  RELATIONSHIP_CATEGORY_RULES.forEach(r=>{
    const forward = catOf(stA, r.a.sec) === r.a.cat && catOf(stB, r.b.sec) === r.b.cat;
    const reverse = catOf(stB, r.a.sec) === r.a.cat && catOf(stA, r.b.sec) === r.b.cat;
    if (forward || reverse) notes.push(r.note);
  });
  return [...new Set(notes)];
}
function analyseRelationship(){
  const ka = document.getElementById('relA').value, kb = document.getElementById('relB').value;
  const A = getCharByKey(ka), B = getCharByKey(kb);
  if (!A || !B){ toast("Generate a character or cast first.", "warn"); return; }
  if (ka === kb){ toast("Pick two different characters.", "warn"); return; }

  const pa = axisProfile(A.state), pb = axisProfile(B.state);
  const clashes = [], alignments = [], notes = [];
  const allAxes = new Set([...Object.keys(pa), ...Object.keys(pb)]);
  allAxes.forEach(ax=>{
    const va = pa[ax]||0, vb = pb[ax]||0;
    if (va === 0 || vb === 0) return;
    const label = AXIS_LABELS[ax];
    if (va > 0 !== vb > 0){
      clashes.push({ax, label, va, vb, mag: Math.abs(va)+Math.abs(vb)});
    } else {
      alignments.push({ax, label, va, vb, mag: Math.abs(va)+Math.abs(vb)});
    }
  });
  clashes.sort((x,y)=>y.mag-x.mag);
  alignments.sort((x,y)=>y.mag-x.mag);

  // Interpretive notes for specific high-signal axis pairings
  const bothHigh = ax => (pa[ax]||0) > 0 && (pb[ax]||0) > 0;
  const bothLow = ax => (pa[ax]||0) < 0 && (pb[ax]||0) < 0;
  if (bothHigh('rebel')) notes.push("Both push against authority — expect either fast alliance or a contest over who leads the rebellion.");
  if (bothHigh('asrt')) notes.push("Two people used to running the room. Every shared decision becomes a negotiation.");
  if (bothLow('asrt')) notes.push("Neither will make the first move. Conversations stall in mutual deference.");
  if ((pa['hon']||0) * (pb['hon']||0) < 0) notes.push("One deals straight, the other doesn't. This is the fault line the relationship eventually breaks along.");
  if (bothLow('warm')) notes.push("Two cold fronts. Mutual respect is possible; intimacy isn't, without something forcing it.");
  if ((pa['warm']||0) > 0 && (pb['warm']||0) < 0) notes.push("One keeps reaching, the other keeps stepping back. Reads as pursuit and retreat.");
  if ((pa['emo']||0) * (pb['emo']||0) < 0) notes.push("One processes out loud, the other shuts down. Each reads the other's coping as a personal rejection.");
  if (bothHigh('ego')) notes.push("Two secure egos — surprisingly stable, provided their goals don't overlap.");
  if ((pa['disc']||0) * (pb['disc']||0) < 0) notes.push("One plans, the other improvises. Productive in a crisis, corrosive over a long campaign.");
  if ((pa['pos']||0) * (pb['pos']||0) < 0) notes.push("Optimist and pessimist. Each thinks the other is being wilfully unhelpful.");
  if ((pa['act']||0) * (pb['act']||0) < 0) notes.push("Mismatched tempo — one is always waiting, the other always being rushed.");
  if (bothHigh('intel')) notes.push("Both sharp. Conversation runs fast and competitive; neither explains themselves.");
  if ((pa['mood']||0) < 0 && (pb['mood']||0) < 0) notes.push("Both currently in a bad place. Whatever happens between them now isn't representative.");
  // Manners ('man') previously had zero interpretive notes here despite being one of
  // the more dramatically obvious clashes available (Ritual-observant vs. Totally
  // uncouth) — every other personality axis had at least one.
  if (bothHigh('man')) notes.push("Both scrupulously mannered. Pleasant on the surface — but a real breach of etiquette between them will land as a genuine violation, not a quirk to shrug off.");
  if (bothLow('man')) notes.push("Neither minds their manners. Blunt and efficient with each other; occasionally, accidentally cruel to anyone who expected softening.");
  if ((pa['man']||0) * (pb['man']||0) < 0) notes.push("One minds their manners, the other doesn't bother. Every interaction becomes a small, usually unspoken referendum on how much decorum the room requires.");

  notes.push(...categoryPairNotesFor(A.state, B.state));

  let heat = clashes.reduce((s,c)=>s+c.mag,0);
  let bond = alignments.reduce((s,c)=>s+c.mag,0);
  let verdict;
  if (heat > bond*1.8) verdict = "Volatile — this pairing generates friction faster than trust.";
  else if (bond > heat*1.8) verdict = "Easy — they slot together with little resistance (possibly too little for drama).";
  else verdict = "Mixed — real common ground with real fault lines. The most dramatically useful kind.";

  const sheet = document.getElementById('relSheet');
  sheet.classList.add('show');
  document.getElementById('relTitle').textContent = (A.meta.name||"A") + "  ×  " + (B.meta.name||"B");
  let h = `<div class="charMeta">${verdict}</div>`;
  if (clashes.length){
    h += `<div class="axisGroup"><div class="axisTitle">Friction points</div>`;
    clashes.slice(0,6).forEach(c=>{
      h += `<div class="traitCard"><div class="traitMain"><div class="traitName">${c.label}</div>
        <div class="traitDesc">${A.meta.name||'A'} leans ${c.va>0?'high':'low'}; ${B.meta.name||'B'} leans ${c.vb>0?'high':'low'}.</div></div></div>`;
    });
    h += `</div>`;
  }
  if (alignments.length){
    h += `<div class="axisGroup"><div class="axisTitle">Common ground</div>`;
    alignments.slice(0,6).forEach(c=>{
      h += `<div class="traitCard"><div class="traitMain"><div class="traitName">${c.label}</div>
        <div class="traitDesc">Both lean ${c.va>0?'high':'low'} here.</div></div></div>`;
    });
    h += `</div>`;
  }
  if (notes.length){
    h += `<div class="axisGroup"><div class="axisTitle">What this looks like in a scene</div>`;
    notes.forEach(n=>{ h += `<div class="traitCard"><div class="traitMain"><div class="traitDesc">${n}</div></div></div>`; });
    h += `</div>`;
  }
  if (!clashes.length && !alignments.length && !notes.length){
    h += `<div class="charMeta">Not enough personality signal to compare — generate both characters with the personality profile enabled.</div>`;
  }
  document.getElementById('relBody').innerHTML = h;
}
function copyRelationship(btnEl){
  const t = document.getElementById('relTitle').textContent + "\n\n" + document.getElementById('relBody').innerText;
  navigator.clipboard.writeText(t).then(()=>{
    if (!btnEl) return;
    const old = btnEl.textContent;
    btnEl.textContent = "Copied!"; setTimeout(()=>btnEl.textContent=old, 1200);
  });
}


// ================= PERSONALITY -> VOICE SUGGESTION =================
// Maps aggregate personality posture onto sensible voice slider positions.
// Deliberately overridable: it sets the sliders, it doesn't lock them.
function suggestVoiceFromPersonality(){
  const P = id => { const el = document.getElementById('pers_'+id); return el ? parseInt(el.value) : 0; };
  const frnd=P('friendliness'), hon=P('honesty'), asrt=P('assertiveness'), conf=P('confidence'),
        agr=P('agreeableness'), man=P('manners'), disc=P('discipline'), reb=P('rebelliousness'),
        emo=P('emotionalcapacity'), intel=P('intelligence'), pos=P('positivity'), act=P('activeness');

  // Verbosity: talkativeness rises with friendliness, assertiveness, energy, emotional openness;
  // falls with guardedness, deception, and passivity.
  let verbosity = 0.30*frnd + 0.25*asrt + 0.20*act + 0.25*emo - 0.20*Math.max(0,-hon) - 0.15*Math.max(0,-conf);
  // Register: formality rises with manners, intelligence, discipline; falls with rebelliousness.
  let register  = 0.45*man + 0.30*intel + 0.15*disc - 0.30*reb;
  // Composure: volatility rises with impulsiveness, emotional openness, bad mood, low confidence, contrarianism.
  let composure = 0.35*Math.max(0,-disc) + 0.30*emo + 0.20*Math.max(0,-conf) + 0.15*Math.max(0,-agr) - 0.20*Math.max(0,disc) - 0.15*Math.max(0,pos);

  const setS = (id,v)=>{ document.getElementById(id).value = Math.round(clamp(v,-100,100)); };
  setS('verbositySlider', verbosity);
  setS('registerSlider', register);
  setS('composureSlider', composure);
  onSliderChange();

  const box = document.getElementById('suggestNote');
  if (box){
    box.style.display = 'block';
    box.textContent = `Suggested from personality — Verbosity ${Math.round(clamp(verbosity,-100,100))}, Register ${Math.round(clamp(register,-100,100))}, Composure ${Math.round(clamp(composure,-100,100))}. Adjust freely; nothing is locked.`;
  }
}

// ================= FOIL FINDER =================
// Builds a character deliberately opposed on 2-3 personality axes and aligned on 1-2.
// Canonical oppositions for the multi-way Profile sections (there's no single numeric
// spectrum for a 4-6 way category the way Personality axes have one, so these are
// hand-picked "most narratively opposed" pairs rather than derived from anything).
const OPPOSED_CATEGORIES = {
  role: {"Leader":"Outsider","Outsider":"Leader","Peacemaker":"Instigator","Instigator":"Peacemaker","Caretaker":"Skeptic","Skeptic":"Caretaker"},
  values: {"Rigid & Principled":"Self-Interested","Self-Interested":"Rigid & Principled","Pragmatic & Flexible":"Loyalty-Bound","Loyalty-Bound":"Pragmatic & Flexible"},
  attachment: {"Secure":"Disorganized","Disorganized":"Secure","Anxious":"Avoidant","Avoidant":"Anxious"},
  stress: {"Fight (attack the threat)":"Flight (remove yourself)","Flight (remove yourself)":"Fight (attack the threat)","Freeze (shut down)":"Fawn (appease the threat)","Fawn (appease the threat)":"Freeze (shut down)"},
  humor: {"Warm & Playful":"Cruel & Barbed","Cruel & Barbed":"Warm & Playful","Dry & Deadpan":"Absurd & Chaotic","Absurd & Chaotic":"Dry & Deadpan"},
  vices: {"Restraint & Discipline":"Risk & Escape","Risk & Escape":"Restraint & Discipline","Avoidance & Procrastination":"Restraint & Discipline"},
};
// New sub-groups get one-way opposition entries (asymmetric is fine — lookup is always
// keyed off the SOURCE character's actual category, never requires the reverse to match).
OPPOSED_CATEGORIES.role["Connector"] = "Outsider";
OPPOSED_CATEGORIES.values["Idealistic & Visionary"] = "Self-Interested";
OPPOSED_CATEGORIES.humor["Intellectual & Wordplay"] = "Humorless & Absent";
/* Lookup is keyed off the SOURCE character's category, so a missing key doesn't fall
   back to anything — it silently drops that whole section from the opposition and the
   foil's rationale simply never mentions it. Humor was missing Self-Deprecating and
   Humorless & Absent (2 of 7); Vices was missing Substance & Consumption and
   Compulsion & Ritual, which between them are where a neutral roll lands 43% of the
   time — so nearly half of all foils had no Vices opposition at all. */
OPPOSED_CATEGORIES.humor["Self-Deprecating"] = "Cruel & Barbed";
OPPOSED_CATEGORIES.humor["Humorless & Absent"] = "Absurd & Chaotic";
OPPOSED_CATEGORIES.vices["Substance & Consumption"] = "Restraint & Discipline";
OPPOSED_CATEGORIES.vices["Compulsion & Ritual"] = "Risk & Escape";
/* A foil built purely out of oppositions is an unrelated stranger who happens to
   disagree. What makes a foil a foil is a shared history — the reason these two are
   in the same room at all — so every foil now arrives with a premise, drawn against
   the actual opposition that was rolled. */
const FOIL_PREMISES = [
  "They were the same person once. One of them changed, and neither agrees about which.",
  "One taught the other. The lesson took, but not the way it was meant to.",
  "They survived the same event and have never once described it the same way.",
  "They wanted the same thing at the same time. Only one of them got it.",
  "Family, or near enough. The obligation is real and neither would choose it now.",
  "They were on opposite sides of something that is technically over.",
  "One of them owes the other, and the debt has outlived everyone who could enforce it.",
  "They worked the same job for years. One got out.",
];
/* The comment above says premises are "drawn against the actual opposition that was
   rolled". They were not — it was a uniform pick from the flat list, so a foil opposed
   on Attachment could arrive with a premise about opposite sides of a war. Key them to
   the section that was actually opposed, falling back to the generic list when the
   roll opposed only personality axes. */
const FOIL_PREMISES_BY_SECTION = {
  values: [
    "They agreed on the goal and then discovered they had never agreed on the price.",
    "One of them drew a line years ago. The other keeps being asked to stand on it.",
  ],
  attachment: [
    "They keep reaching for each other at different times and calling it bad luck.",
    "One needs to be told. The other believes saying it out loud cheapens it.",
  ],
  role: [
    "They have been handed the same room to run, more than once, and it has never gone well twice.",
    "One of them speaks for the group. Nobody agreed to that, least of all the other.",
  ],
  stress: [
    "The same emergency. One moved toward it, one moved away, and both were right once.",
    "They have seen each other at their worst and drawn opposite conclusions about it.",
  ],
  humor: [
    "One of them made a joke at a funeral. The other has never let it go.",
    "They find completely different things unbearable, and neither can fake it.",
  ],
  vices: [
    "One of them got clean. The other took it as a verdict.",
    "They kept each other's worst habits secret for years, for different reasons.",
  ],
};

function generateFoil(){
  if (!Object.keys(state).length){ toast("Generate a character first — the foil is built against them.", "warn"); return; }
  const seedInput = document.getElementById('foilSeed');
  const seedStr = seedInput ? seedInput.value.trim() : "";
  const seedNum = seedStr ? hashSeedString(seedStr) : ((Date.now() ^ (Math.random()*0x7fffffff)) >>> 0);
  const _origRandom = Math.random;
  // Foils were the other unreproducible generator: raw Math.random throughout, so a
  // foil you liked could not be recovered, shared, or regenerated after a tweak.
  Math.random = mulberry32(seedNum);
  try { _generateFoilInner(seedStr || seedNum.toString(36)); }
  finally { Math.random = _origRandom; }
}
function _generateFoilInner(seedLabel){
  const src = {};
  PERSONALITY_AXES.forEach(a=>{ const el=document.getElementById('pers_'+a.id); src[a.id]= el?parseInt(el.value):0; });

  // Prefer opposing axes where the source character actually has a strong position.
  const ranked = PERSONALITY_AXES.map(a=>({axis:a, mag:Math.abs(src[a.id])})).sort((x,y)=>y.mag-x.mag);
  const strong = ranked.filter(r=>r.mag>=25);
  const pool = strong.length>=3 ? strong : ranked;
  const shuffle = arr => arr.map(a=>[Math.random(),a]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);

  const opposeCount = 2 + (Math.random()<0.5?1:0); // 2 or 3
  const opposed = shuffle(pool.slice(0, Math.max(opposeCount+2, 4))).slice(0, opposeCount);
  const opposedIds = new Set(opposed.map(o=>o.axis.id));
  const alignCandidates = shuffle(PERSONALITY_AXES.filter(a=>!opposedIds.has(a.id)));
  const aligned = alignCandidates.slice(0, 1 + (Math.random()<0.5?1:0)); // 1 or 2

  const overrides = {};
  PERSONALITY_AXES.forEach(a=>{
    if (opposedIds.has(a.id)){
      const v = src[a.id];
      overrides[a.id] = Math.round(clamp((Math.abs(v) < 25 ? 55 : Math.abs(v)) * (v >= 0 ? -1 : 1), -100, 100));
    } else if (aligned.some(x=>x.id===a.id)){
      overrides[a.id] = Math.round(clamp(src[a.id] + (Math.random()*20-10), -100, 100));
    } else {
      overrides[a.id] = Math.round((Math.random()*2-1)*70);
    }
  });

  // Same opposition idea, applied to whichever Profile sections the source character
  // actually has a resolved category for. This is usually more narratively decisive
  // than opposed personality sliders alone — two characters with opposite Values or
  // Attachment styles clash in ways that don't show up as a personality-axis mismatch.
  const profSectionsWithSrc = ["values","attachment","role","stress","humor","vices"]
    .filter(id => slotCat(state["prof_"+id+"_0"]) && OPPOSED_CATEGORIES[id]);
  const profOpposeCount = Math.min(profSectionsWithSrc.length, 1 + (Math.random()<0.5?1:0)); // 1 or 2
  const profOpposed = shuffle(profSectionsWithSrc).slice(0, profOpposeCount);
  const forcedProfileCats = {};
  const profOpposedNames = [];
  profOpposed.forEach(id=>{
    const srcCat = slotCat(state["prof_"+id+"_0"]);
    const oppCat = OPPOSED_CATEGORIES[id][srcCat];
    if (oppCat){
      forcedProfileCats[id] = oppCat;
      const ps = PROFILE_SECTIONS.find(p=>p.id===id);
      profOpposedNames.push(`${ps.label} (${srcCat} vs ${oppCat})`);
    }
  });

  const rarityPref = document.getElementById('rarityPref').value;
  const mannerCount = intVal('mannerCount', 3);
  const vocabCount = intVal('vocabCount', 2);
  // Verbosity and register invert by default — a foil that talks and phrases things
  // differently is the whole point. Composure stays aligned by default: it reads less
  // as "who they are" and more as "how bad the current scene is," so two characters
  // sharing a composure level plausibly share a scene without the foil relationship
  // requiring it. The "should also clash under pressure" checkbox opts into inverting
  // it too, for foils that need to fall apart differently as well.
  const composureToggleEl = document.getElementById('foilOpposeComposure');
  const opposeComposure = composureToggleEl ? composureToggleEl.checked : false;
  const composureRaw = rawToLevel(intVal('composureSlider', 0));
  rollCharacterVariants();
  // A foil is defined by contrast, so it must not inherit the source character's
  // context bias — that bias pulls toward the same categories the oppositions above
  // just spent effort pushing away from.
  const foilState = withoutContextBias(()=> buildCharacterState({
    verbLevel: -rawToLevel(intVal('verbositySlider', 0)),
    regLevel:  -rawToLevel(intVal('registerSlider', 0)),
    compLevel: opposeComposure ? -composureRaw : composureRaw,
    mannerCount, rarityPref, vocabPref:null, personalityOverrides: overrides, vocabCount, forcedProfileCats
  }));
  const premisePool = (()=>{
    const keyed = profOpposed.filter(id=>FOIL_PREMISES_BY_SECTION[id] && forcedProfileCats[id]);
    if (!keyed.length) return FOIL_PREMISES;
    const id = keyed[Math.floor(Math.random()*keyed.length)];
    // Keep a slice of the generic list in play so a section opposed twice in a session
    // doesn't return the same two lines.
    return FOIL_PREMISES_BY_SECTION[id].concat(FOIL_PREMISES.slice(0, 2));
  })();
  const premise = premisePool[Math.floor(Math.random()*premisePool.length)];

  // The whole point of a foil is contrast — without the source character also on the
  // Cast tab, the "Opposed on... Shared ground on..." rationale below refers to a
  // character the user can't actually see next to it. Add the current character
  // alongside the foil (guarding against a duplicate name already in the cast).
  const srcName = charMeta.name || "Current character";
  castStates = castStates.filter(c=>c.meta.name !== "Foil" && c.meta.name !== srcName);
  castStates.push({state: {...state}, meta:{name: srcName, age: charMeta.age||"", context: charMeta.context||"", archetypeLabel: charMeta.archetypeLabel||"Source"}});
  castStates.push({state: foilState, meta:{name:"Foil", age:"", context:premise, archetypeLabel:"Foil"}});
  renderCast();
  switchTab('cast');

  const opposedNames = opposed.map(o=>o.axis.label).join(", ");
  const alignedNames = aligned.map(a=>a.label).join(", ");
  const grid = document.getElementById('castGrid');
  const note = document.createElement('div');
  note.className = "castCard";
  note.innerHTML = `<h3><span>Foil rationale</span></h3>
    <div class="traitDesc"><b>Premise:</b> ${escHTML(premise)}</div>
    <div class="traitDesc" style="margin-top:6px;"><b>Opposed on (personality):</b> ${escHTML(opposedNames)}</div>
    ${profOpposedNames.length ? `<div class="traitDesc" style="margin-top:6px;"><b>Opposed on (profile):</b> ${escHTML(profOpposedNames.join(", "))}</div>` : ``}
    <div class="traitDesc" style="margin-top:6px;"><b>Shared ground on:</b> ${escHTML(alignedNames||"—")}</div>
    <div class="traitDesc" style="margin-top:6px;">Opposition on a few axes creates friction; shared ground on one or two keeps them plausibly in the same room — and the premise is what puts them in it. Check the Relationships tab for the full read.</div>
    <div class="sub" style="margin-top:8px;">Foil seed: <b>${escHTML(seedLabel)}</b> — paste it into the foil seed field to rebuild this exact one.</div>`;
  grid.insertBefore(note, grid.firstChild);
  refreshRelSelectors();
}

// ================= ENSEMBLE BALANCE CHECK =================
function checkEnsembleBalance(){
  if (castStates.length < 3){ toast("Generate a cast of at least 3 to check balance.", "warn"); return; }
  const axisVals = {};
  PERSONALITY_AXES.forEach(a=> axisVals[a.id] = []);

  castStates.forEach(c=>{
    PERSONALITY_AXES.forEach(a=>{
      const slot = c.state["pers_"+a.id];
      if (!slot || !slot.trait) return;
      // Situational/mid-category picks (axis.mid) are a deliberate third outcome the
      // generator supports, not a quiet "low" — counting them as -1 falsely inflated
      // apparent clustering toward the negative pole, or diluted real one-sided
      // clustering with mis-tagged neutrals. Exclude them from the posture count.
      if (slot.neutral || slotCat(slot) === a.mid) return;
      // derive a -1/+1 posture from which pole the chosen trait came from
      const isPos = slotCat(slot) === a.pos;
      axisVals[a.id].push(isPos ? 1 : -1);
    });
  });

  const clustered = [], spread = [];
  Object.entries(axisVals).forEach(([id, vals])=>{
    if (vals.length < 3) return;
    const axis = PERSONALITY_AXES.find(a=>a.id===id);
    const sum = vals.reduce((a,b)=>a+b,0);
    const ratio = Math.abs(sum)/vals.length;
    if (ratio >= 0.8) clustered.push({axis, dir: sum>0?'high':'low', ratio});
    else if (ratio <= 0.34) spread.push({axis});
  });
  clustered.sort((a,b)=>b.ratio-a.ratio);

  // Same clustering check for the multi-way Profile sections (Role, Values, Stress, etc.) —
  // a cast can look varied on personality axes and still have everyone land on the same
  // Social Role or Stress Response, which personality clustering alone wouldn't catch.
  const profClustered = [];
  PROFILE_SECTIONS.filter(ps=>!ps.drawAll).forEach(ps=>{
    const picks = castStates.map(c=>{
      return slotCat(c.state["prof_"+ps.id+"_0"]);
    }).filter(Boolean);
    if (picks.length < 3) return;
    const counts = {};
    picks.forEach(p=> counts[p] = (counts[p]||0)+1);
    const [topCat, topCount] = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    const ratio = topCount / picks.length;
    if (ratio >= 0.67) profClustered.push({section: ps.label, cat: topCat, ratio, count: topCount, total: picks.length});
  });
  profClustered.sort((a,b)=>b.ratio-a.ratio);

  let h = "";
  const verdict = clustered.length >= 5
    ? "Heavily clustered — this cast risks sounding like one person in several coats."
    : clustered.length >= 3
      ? "Somewhat clustered — a few axes where everyone agrees. Worth breaking one or two."
      : "Well spread — the cast covers meaningfully different ground.";
  h += `<div class="charMeta">${verdict}</div>`;

  if (profClustered.length){
    h += `<div class="axisGroup"><div class="axisTitle">Everyone plays the same part</div>`;
    // Humor Style and Habits & Vices are inside this same generic PROFILE_SECTIONS
    // walk, but "everyone's funny the same way" (or has the same vice) is a common
    // enough ensemble failure mode that it's worth a callout more specific than the
    // generic "same narrative role" line, which was written with Role/Values in mind.
    const SECTION_CALLOUTS = {
      "Humor Style": "Same personality contrast doesn't help if everyone's funny the same way — flat humour range reads as flat cast, even with sharp axis contrast elsewhere.",
      "Habits & Vices": "A cast that's all the same standing vice (or all clean) tends to blur together outside the main conflict — vices are cheap, high-signal texture to differentiate.",
    };
    profClustered.forEach(c=>{
      const callout = SECTION_CALLOUTS[c.section] || "Same personality contrast doesn't help if everyone's playing the same narrative role.";
      h += `<div class="traitCard"><div class="traitMain">
        <div class="traitName">${c.section}</div>
        <div class="traitDesc">${c.count} of ${c.total} cast members resolved to <b>${c.cat}</b>. ${callout}</div>
      </div></div>`;
    });
    h += `</div>`;
  }
  if (clustered.length){
    h += `<div class="axisGroup"><div class="axisTitle">Everyone lands the same way here</div>`;
    clustered.forEach(c=>{
      h += `<div class="traitCard"><div class="traitMain">
        <div class="traitName">${c.axis.label}</div>
        <div class="traitDesc">All (or nearly all) of the cast sit on the <b>${c.dir}</b> side. Consider flipping one character to create contrast.</div>
      </div></div>`;
    });
    h += `</div>`;
  }
  if (spread.length){
    h += `<div class="axisGroup"><div class="axisTitle">Healthy contrast already</div>`;
    spread.forEach(s=>{
      h += `<div class="traitCard"><div class="traitMain"><div class="traitName">${s.axis.label}</div>
        <div class="traitDesc">The cast is genuinely split on this axis.</div></div></div>`;
    });
    h += `</div>`;
  }

  // Reporting a gap without offering to close it leaves the user to work out which
  // sliders would fill it — which is exactly the arithmetic this tool exists to do.
  if (clustered.length || profClustered.length){
    lastBalanceGaps = {clustered: clustered.map(c=>({id:c.axis.id, dir:c.dir})), profClustered: profClustered.map(c=>({section:c.section, cat:c.cat}))};
    h += `<div class="actionRow" style="margin-top:14px;">
      <button class="btn-primary" onclick="generateGapFiller()">Generate a member who fills these gaps</button>
    </div>`;
  } else lastBalanceGaps = null;

  const box = document.getElementById('balanceResult');
  box.classList.add('show');
  box.innerHTML = h;
}
let lastBalanceGaps = null;
// Builds one more cast member positioned against whatever the balance check just
// found: every clustered axis is flipped to the minority side, and any profile
// section the whole cast shares is forced to a different category.
function generateGapFiller(){
  if (!lastBalanceGaps){ toast("Run the balance check first.", "warn"); return; }
  const overrides = {};
  PERSONALITY_AXES.forEach(a=>{ overrides[a.id] = Math.round((Math.random()*2-1)*45); });
  lastBalanceGaps.clustered.forEach(c=>{
    overrides[c.id] = c.dir === 'high' ? -70 : 70;
  });
  const forcedProfileCats = {};
  lastBalanceGaps.profClustered.forEach(pc=>{
    const ps = PROFILE_SECTIONS.find(p=>p.label === pc.section);
    if (!ps) return;
    const others = catsOf(ps.section).filter(c=>c !== pc.cat);
    if (others.length) forcedProfileCats[ps.id] = others[Math.floor(Math.random()*others.length)];
  });
  const rarityPref = document.getElementById('rarityPref') ? document.getElementById('rarityPref').value : 0;
  rollCharacterVariants();
  // The gap-filler exists to break clustering; inheriting the last character's context
  // bias reinforced exactly what it was called in to counteract.
  const st = withoutContextBias(()=> buildCharacterState({
    verbLevel: (Math.random()*4)-2, regLevel: (Math.random()*4)-2, compLevel: (Math.random()*4)-2,
    mannerCount: intVal('mannerCount', 3), vocabCount: intVal('vocabCount', 2),
    rarityPref, vocabPref:null, personalityOverrides: overrides, forcedProfileCats,
  }));
  castStates.push({state: st, meta:{name:"Character " + (castStates.length+1), age:"", context:"Built to fill the ensemble's gaps", archetypeLabel:"Gap-filler"}});
  renderCast();
  refreshRelSelectors();
  checkEnsembleBalance();
  toast("Added a cast member positioned against the clustering.");
}


// ================= PROFILE SECTION UI =================
function buildProfileSectionUI(){
  const grid = document.getElementById('profileSectionsGrid');
  grid.innerHTML = "";
  PROFILE_SECTIONS.forEach(ps=>{
    const cats = catsOf(ps.section);
    const div = document.createElement('div');
    div.className = "profCard";
    const typeControl = ps.drawAll
      ? `<div class="blurb">Draws one from each: ${escHTML(cats.join(", "))}.</div>`
      : `<select id="type_${ps.id}" aria-label="${escHTML(ps.label)} type">
           <option value="">Auto (from personality)</option>
           ${cats.map(c=>`<option value="${escHTML(c)}">${escHTML(c)}</option>`).join("")}
         </select>`;
    div.innerHTML = `
      <div class="head">
        <input type="checkbox" id="sec_${ps.id}" checked>
        <label for="sec_${ps.id}">${escHTML(ps.label)}</label>
      </div>
      <div class="blurb">${escHTML(ps.blurb)}</div>
      ${typeControl}
      <div class="pwRow">
        <label for="pw_${ps.id}">Weight</label>
        <select id="pw_${ps.id}" aria-label="${escHTML(ps.label)} weight">
          <option value="">follow global</option>
          <option value="20">quiet, background</option>
          <option value="45">present</option>
          <option value="70">pronounced</option>
          <option value="92">life-defining</option>
        </select>
      </div>
    `;
    grid.appendChild(div);
  });
}
function setAllProfileSections(on){
  PROFILE_SECTIONS.forEach(ps=>{ const el=document.getElementById('sec_'+ps.id); if(el) el.checked = on; });
}
function randomizeProfileTypes(){
  PROFILE_SECTIONS.forEach(ps=>{
    const sel = document.getElementById('type_'+ps.id);
    if (!sel) return;
    const opts = [...sel.options].filter(o=>o.value);
    sel.value = Math.random() < 0.25 ? "" : opts[Math.floor(Math.random()*opts.length)].value;
  });
}

/* ERROR BOUNDARY. Single-character generation has had one since a throw mid-build was
   found to leave a half-rendered sheet and a silent console — which reads as the app
   simply not responding. The cast, foil, relationship and balance paths run the same
   engine over the same data (and the balance panel has already been taken down once by
   a null trait) but had no boundary at all. Same treatment: report it where the user is
   looking, name the usual cause, and leave the rest of the app usable.

   Wrapping by reassignment keeps each function's own body free of try/catch noise and
   guarantees no path is missed. */
(function wrapGeneratorsWithBoundary(){
  const guard = (name, fn, hint) => function(){
    try { return fn.apply(this, arguments); }
    catch (err){
      console.error(name, err);
      const msg = err && err.message ? err.message : String(err);
      toast(`${name} failed: ${msg}${hint ? ' — ' + hint : ''}`, "warn", 7000);
      return undefined;
    }
  };
  const constraintHint = "a constraint combination that leaves a section with no eligible traits is the usual cause";
  generateCast          = guard("Cast generation", generateCast, constraintHint);
  generateFoil          = guard("Foil generation", generateFoil, constraintHint);
  generateGapFiller     = guard("Gap-filler", generateGapFiller, constraintHint);
  analyseRelationship   = guard("Relationship analysis", analyseRelationship, "");
  checkEnsembleBalance  = guard("Balance check", checkEnsembleBalance, "");
})();

// ---------- Session preference persistence -------------------------------
// Remembers the knobs (not the character) so returning users don't have to
// re-set counts, rarity and mode on every visit. Deliberately excludes slider
// positions and the generated sheet: those are per-character choices, and
// silently restoring them would make "fresh start" behave unpredictably.
const PREF_KEY = 'prefs:v2';

/* WORKSPACE PERSISTENCE.
   v1 persisted a hand-maintained list of twelve static control ids. Everything else
   was lost on refresh: all three voice sliders, all thirteen personality sliders, every
   sec_/type_/pw_ profile control (those are built by buildProfileSectionUI at runtime,
   so a static id list could never have covered them), the seed, the archetype — and,
   worst of all, the entire constraint set. Bans, requires, exclusive pairs and category
   tiers are the highest-effort state in the app: a user could spend ten minutes banning
   categories and lose all of it by reloading the tab, with exporting a character JSON
   the only way to keep any of it.

   captureSettings/restoreSettings already serialise exactly this — they were written
   for the character-export format, which had the same "the file must actually contain
   the settings" problem. Reuse them rather than maintaining a second, and inevitably
   divergent, list. `charName`/`charAge`/`charContext` and the reroll exclusions are
   stripped: those describe one particular character, not the workspace, and silently
   restoring them would make a fresh session behave unpredictably. */
// seedInput joins these: a persisted seed would make every reload regenerate the same
// character forever, which reads as the generator being broken rather than as a
// remembered preference.
const PREF_VOLATILE_FIELDS = ['charName','charAge','charContext','seedInput'];
let prefsReady = false;

async function savePrefs(){
  if (!prefsReady) return; // don't persist the defaults we just wrote during load
  try {
    const data = captureSettings();
    PREF_VOLATILE_FIELDS.forEach(id=>{ delete data.fields[id]; });
    delete data.rerollExclusions;
    // advancedToggle is a pure presentation switch and so isn't in SETTING_TOGGLES,
    // but it is very much a workspace preference.
    const adv = document.getElementById('advancedToggle');
    if (adv) data.toggles.advancedToggle = !!adv.checked;
    await storage.set(PREF_KEY, JSON.stringify(data));
  } catch(e){ /* storage unavailable — preferences just won't persist */ }
}

async function loadPrefs(){
  try {
    const res = await storage.get(PREF_KEY);
    if (res && res.value){
      const data = JSON.parse(res.value);
      PREF_VOLATILE_FIELDS.forEach(id=>{ if (data.fields) delete data.fields[id]; });
      delete data.rerollExclusions;
      restoreSettings(data);
    }
  } catch(e){ /* no saved prefs, corrupt prefs, or storage unavailable */ }
  prefsReady = true;
  try { onSliderChange(); } catch(e){}
  const ex = document.getElementById('examplesToggle');
  if (ex) { try { toggleExamples(); } catch(e){} }
  try { applyAdvancedMode(); } catch(e){}
  try { toggleCompact(); } catch(e){}
}

/* Wire every control the workspace persists, including the ones buildProfileSectionUI
   and buildPersonalitySliders create at runtime — a static id list is what left those
   without a change listener in the first place. Called after both builders have run.
   Sliders fire `input` as well as `change` so dragging is captured on release either
   way; savePrefs is cheap and idempotent. */
function wirePrefPersistence(){
  const ids = SETTING_FIELDS.concat(SETTING_TOGGLES, ['advancedToggle']);
  (typeof PROFILE_SECTIONS !== 'undefined' ? PROFILE_SECTIONS : []).forEach(ps=>{
    ids.push('sec_'+ps.id, 'type_'+ps.id, 'pw_'+ps.id);
  });
  ['verbositySlider','registerSlider','composureSlider'].forEach(id=>ids.push(id));
  PERSONALITY_AXES.forEach(a=> ids.push('pers_'+a.id));
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', savePrefs);
  });
}

// Constraints live outside the DOM (Sets and arrays in engine.js), so no element
// listener can catch a change to them. refreshConstraintChips is the one function every
// constraint mutation already calls to redraw itself — hook the save on there.
(function persistConstraintsOnChange(){
  if (typeof refreshConstraintChips !== 'function') return;
  const inner = refreshConstraintChips;
  refreshConstraintChips = function(){ const r = inner.apply(this, arguments); savePrefs(); return r; };
})();

/* ================= QUICK / ADVANCED =================
   The single-character tab presented every control it has, all at once, in one
   column: a first-time user scrolled past roughly fifteen of them before reaching
   Generate. Quick mode shows the four that matter on a first pass — name, the three
   voice sliders, archetype — and hides the rest behind one switch, which is a
   presentation change only: everything hidden keeps its value and keeps applying. */
function applyAdvancedMode(){
  const on = document.getElementById('advancedToggle');
  const adv = !!(on && on.checked);
  document.body.classList.toggle('quick-mode', !adv);
  const label = document.getElementById('advancedToggleLabel');
  if (label) label.textContent = adv ? "Advanced" : "Quick";
}

/* ================= TRAIT SEARCH =================
   BUG FIX: the constraint autocomplete was a <datalist> built from TRAITS.slice(0,
   4000) — of a pool that is now 7,073 — so everything from id 90000 up was invisible.
   That is the entire supplement series: precisely the intensity-1/4/5 material added
   to fix "the sliders feel grouped", and users could not ban or require any of it.
   A 7,073-option datalist is also a lot of DOM for a control nobody can scroll.
   This is a debounced search over trait + description, showing the category, capped
   at a readable number of results and drawing from the WHOLE pool. */
let _searchTimer = null;
function searchTraits(inputId, resultsId, onPick){
  const inp = document.getElementById(inputId);
  const box = document.getElementById(resultsId);
  if (!inp || !box) return;
  if (_searchTimer) clearTimeout(_searchTimer);
  _searchTimer = setTimeout(()=>{
    const q = (inp.value||"").trim().toLowerCase();
    if (q.length < 2){ box.innerHTML = ""; box.style.display = 'none'; return; }
    const hits = [];
    for (const t of TRAITS){
      if (t.trait.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)){
        hits.push(t);
        if (hits.length >= 40) break;
      }
    }
    if (!hits.length){
      box.innerHTML = `<div class="searchEmpty">No trait matches "${escHTML(q)}".</div>`;
    } else {
      box.innerHTML = hits.map(t=>
        `<button type="button" class="searchHit" onclick="pickSearchResult('${escAttr(inputId)}','${escAttr(resultsId)}',${t.id})">`
        + `<b>${escHTML(t.trait)}</b><span>${escHTML(t.category)} · intensity ${t.intensity}</span>`
        + `<i>${escHTML(t.desc)}</i></button>`).join("")
        + (hits.length >= 40 ? `<div class="searchEmpty">Showing the first 40 matches — keep typing to narrow.</div>` : ``);
    }
    box.style.display = 'block';
  }, 140);
}
function pickSearchResult(inputId, resultsId, id){
  const t = TRAITS.find(x=>x.id===id);
  const inp = document.getElementById(inputId);
  const box = document.getElementById(resultsId);
  if (t && inp) inp.value = t.trait;
  if (box){ box.innerHTML = ""; box.style.display = 'none'; }
}
// "Why didn't I get X?" — the inverse of the per-card why? panel.
function explainWhyNotFromInput(){
  const inp = document.getElementById('whyNotSearch');
  const out = document.getElementById('whyNotResult');
  if (!inp || !out) return;
  const t = findTraitByName(inp.value);
  if (!t){ out.innerHTML = `<div class="whyExcl">No trait matches that name.</div>`; out.style.display='block'; return; }
  if (t.ambiguous){
    // Ambiguity is useful here rather than an error: show the matches as a shortlist.
    const list = t.ambiguous.slice(0, 8).map(x=>`<li>${escHTML(x.trait)} <span class="sub">— ${escHTML(x.category)}</span></li>`).join("");
    out.innerHTML = `<div class="whyNote"><b>${t.ambiguous.length} traits match that.</b> Type more of a name to pick one:<ul style="margin:6px 0 0 18px;">${list}</ul></div>`;
    out.style.display = 'block'; return;
  }
  out.innerHTML = `<div class="whyNote"><b>${escHTML(t.trait)}</b> — ${escHTML(t.category)}<div style="margin-top:6px;">${explainWhyNot(t)}</div></div>`;
  out.style.display = 'block';
}

/* ================= KEYBOARD =================
   The undo stack, the reroll loop, and Generate were all mouse-only. */
function wireKeyboard(){
  document.addEventListener('keydown', (e)=>{
    const tag = (e.target && e.target.tagName || "").toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
      e.preventDefault(); generateCharacter(); return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey){
      if (typing) return;                 // don't steal undo from a text field
      e.preventDefault(); undoLast(); return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '?'){ const h = document.getElementById('helpPanel'); if (h){ h.open = !h.open; h.scrollIntoView({block:'nearest'}); } return; }
    if (e.key === 'r' || e.key === 'R'){
      // Reroll whatever card the pointer is over — the fastest possible version of
      // the generate/lock/reroll loop the app is built around.
      const card = document.querySelector('.traitCard:hover');
      if (!card) return;
      const btn = card.querySelector('.rerollBtn');
      if (btn) btn.click();
    }
  });
}

// Keeps the sticky action bar honest about what the last generation used.
function updateStickyBar(){
  const el = document.getElementById('stickySeed');
  if (el) el.textContent = lastSeedUsed ? ("seed " + lastSeedUsed) : "no character yet";
}

buildProfileSectionUI();
buildSeedPicker();
buildPersonalitySliders();
loadSavedList();
loadCustomArchetypes();
populateBanCategorySelect();
refreshConstraintChips();
// Live trait count in the tagline — the old hardcoded number went stale every time
// the pool grew.
(function(){ const el = document.getElementById('taglineSub');
  if (el) el.textContent = `Axis-based, per-trait conflict-aware, intensity & rarity-weighted selection from a ${TRAITS.length.toLocaleString()}-trait bank.`; })();
// Footer trait count, driven off the live pool the same way — a hardcoded number here
// previously went stale (and disagreed with the tagline above) every time the pool grew.
(function(){ const el = document.getElementById('footerTraitCount');
  if (el) el.textContent = `Traits drawn from a curated bank of ${TRAITS.length.toLocaleString()} entries across verbosity, vocabulary, grammar, mannerism, personality, and profile categories. ` + el.textContent; })();
onSliderChange();
wirePrefPersistence();
wireKeyboard();
applyAdvancedMode();
loadPrefs();
// Offline/repeat-visit caching. Registration is best-effort: the app is fully
// functional without it, and file:// or an unsupported browser must not throw here.
if (typeof navigator !== 'undefined' && navigator.serviceWorker && location.protocol.startsWith('http')){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
