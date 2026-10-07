
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
    // The host's own API; assume it persists unless it says otherwise.
    if (window.storage.durable === undefined) try { window.storage.durable = true; } catch(e){}
    return window.storage;
  }
  const PREFIX = 'cc_storage:';
  // localStorage itself can throw (private browsing in some browsers, storage
  // disabled) — fall back to an in-memory Map so the app still runs, it just
  // won't persist across reloads.
  let backend;
  /* A failed probe fell back to an in-memory Map and said nothing, so `saveCharacter`
     reported an ordinary success and the user closed the tab believing their work was
     on disk. Record the capability so the UI can say "this session only" BEFORE a save
     rather than never. */
  let durable = true;
  try {
    const probeKey = '__cc_storage_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    backend = window.localStorage;
  } catch(e){
    durable = false;
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
    durable,
    async get(key){
      const v = backend.getItem(PREFIX + key);
      return v === null ? null : { value: v };
    },
    // A failed write (full quota, blocked storage) used to surface only where a caller happened
    // to catch it — preferences and filings failed in silence. Every failure raises the banner.
    async set(key, value){
      try { backend.setItem(PREFIX + key, value); }
      catch(e){ if (typeof noteStorageFailure === 'function') noteStorageFailure(e); throw e; }
    },
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

/* prompt() is unstyleable, sits outside the page's own focus and keyboard handling, and
   is blocked outright in some embedding contexts — where the three call sites below
   silently did nothing. One small <dialog> replaces all of them: same shape as prompt
   (a Promise resolving to the string or null), but it looks like the rest of the app,
   the field is focused and pre-selected, Escape cancels, and Enter submits. */
/* localStorage signals a full quota through several different names depending on the
   browser, and one of them (code 22) has no name at all in older engines. */
function isQuotaError(e){
  if (!e) return false;
  return e.name === 'QuotaExceededError'
      || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || e.code === 22 || e.code === 1014;
}

function askForName(message, initial){
  return new Promise(resolve=>{
    const dlg = document.createElement('dialog');
    dlg.className = 'nameDialog';
    dlg.innerHTML = `
      <form method="dialog">
        <label for="nameDialogInput">${escHTML(message)}</label>
        <input type="text" id="nameDialogInput" autocomplete="off">
        <div class="nameDialogBtns">
          <button value="cancel" type="submit">Cancel</button>
          <button value="ok" type="submit" class="primary">OK</button>
        </div>
      </form>`;
    // Focus is restored to whatever opened the dialog. Without this, closing it drops
    // the keyboard caret at the top of the document and the user has to tab back to
    // where they were.
    const opener = document.activeElement;
    const restore = ()=>{ if (opener && opener.focus && document.contains(opener)) opener.focus(); };
    document.body.appendChild(dlg);
    const input = dlg.querySelector('#nameDialogInput');
    input.value = initial || "";
    let settled = false;
    const done = (v)=>{ if (settled) return; settled = true; dlg.remove(); restore(); resolve(v); };
    dlg.addEventListener('close', ()=>{
      // returnValue is "" for Escape as well as for a cancel press
      done(dlg.returnValue === 'ok' ? (input.value.trim() || null) : null);
    });
    // showModal is the whole point (focus trap + Escape); if it is unavailable for any
    // reason, fall back rather than leaving the caller waiting on a promise forever.
    if (typeof dlg.showModal === 'function'){
      dlg.showModal();
      input.focus(); input.select();
    } else {
      const v = (typeof prompt === 'function') ? prompt(message, initial || "") : null;
      done(v && v.trim() ? v.trim() : null);
    }
  });
}

/* Does a save already exist under this name? Used by save and rename alike, because
   both wrote straight through and destroyed whatever was already there. */
async function savedCharacterExists(name){
  try { const r = await storage.get('character:'+name); return !!(r && r.value); }
  catch(e){ return false; }
}
/* Is this browser going to keep what we write? Everything that reports a save, lists
   saves, or offers persistence asks here rather than assuming. */
function storageIsDurable(){ return storage.durable !== false; }
let _storageFailures = 0;
function noteStorageFailure(e){
  _storageFailures++;
  const el = document.getElementById('storageStatus');
  if (el){
    el.style.display = 'block'; el.className = 'storageStatus warn';
    el.textContent = (typeof isQuotaError === 'function' && isQuotaError(e))
      ? "This browser's storage is full, so the last change was NOT kept. Delete a saved character, or export a backup (File ▾ → Export full backup) and clear some space."
      : "This browser refused to store the last change, so it was NOT kept. Export a backup (File ▾ → Export full backup) to keep your work.";
  }
  if (typeof markSaved === 'function') markSaved(false);
}
function announceStorageMode(){
  const el = document.getElementById('storageStatus');
  if (!el) return;
  if (storageIsDurable()){ el.style.display = 'none'; el.textContent = ''; return; }
  el.style.display = 'block';
  el.className = 'storageStatus warn';
  el.textContent = "This browser is not allowing local storage (private mode, or site data is blocked). Saves will last only until you close this tab — export to a file to keep anything.";
}

/* The emergent label is the generator's first guess; the author's edit replaces it in
   the summary, the save and the export. An empty answer clears the override. */
async function editCharacterLabel(){
  if (!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  const current = (typeof characterLabel === 'function' && characterLabel(state, charMeta)) || {};
  const next = await askForName("Label this character:", charMeta.label || current.name || "");
  if (next === null) return;
  charMeta.label = next;
  renderSheet();
}
function clearCharacterLabel(){ delete charMeta.label; renderSheet(); }
// Swap which side of the inner conflict wins under load. The choice lives in charMeta, so
// it saves, exports and undoes with the sheet, and the pressure ladder and voice lab follow it.
function flipInnerConflict(){
  if (!Object.keys(state).length) return;
  snapshotHistory();
  charMeta.conflictFlip = !charMeta.conflictFlip;
  renderSheet();
  toast(charMeta.conflictFlip ? "The other side now wins under load — see the pressure ladder and the voice lab." : "Back to the default: the inner conflict resolves the way the sheet implies.");
}
async function answerContradiction(key, clear){
  const contra = (typeof structuredContradiction === 'function') ? structuredContradiction(state, charMeta) : null;
  const field = contra && contra.fields.find(f => f.key === key);
  if (!field) return;
  charMeta.contradictionAnswers = Object.assign({}, charMeta.contradictionAnswers || {});
  if (clear){ delete charMeta.contradictionAnswers[key]; renderSheet(); return; }
  const next = await askForName(field.prompt, field.answer || "");
  if (next === null) return;
  charMeta.contradictionAnswers[key] = next;
  renderSheet();
}
async function saveCharacter(btnEl){
  if(!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  if (!storageIsDurable()){
    if (!await askForConfirm("This browser is not allowing local storage, so this save will be lost when the tab closes. Save it to this session anyway? (Export to a file to keep it.)", "Save anyway")) return;
  }
  /* BUG FIX: this was `charMeta.name || await askForName(...)`, and _runGeneration sets
     charMeta.name to "Unnamed Character" when the name box is empty — so charMeta.name
     is never falsy after a generation and the prompt never fired. Every unnamed save
     went to the key `character:Unnamed Character` and silently destroyed the previous
     one. Always ask, pre-filled with the name we have, and never overwrite an existing
     save without saying so. */
  const suggested = (charMeta.name && charMeta.name !== "Unnamed Character") ? charMeta.name : "";
  const name = await askForName("Name this character voice:", suggested);
  if(!name) return;
  if (await savedCharacterExists(name)){
    if (!await askForConfirm(`"${name}" is already saved. Replace it? The saved version will be gone.`, "Replace")) return;
  }
  charMeta.name = name;
  setVal('charName', name);
  const btn = btnEl || null;
  const oldLabel = btn ? btn.textContent : null;
  if (btn){ btn.textContent = "Saving…"; btn.disabled = true; }
  try {
    /* Saved characters carry the same full-fidelity settings block the file export
       does, so loading one restores the setup that produced it rather than dropping
       the sheet into whatever the controls happen to say now.

       Stored by trait ID rather than by embedded trait object. A sheet is ~37 slots
       and every one of them was carrying a full copy of its trait — name, description,
       example, polarity — which is roughly 17.8 KB per save against 3.7 KB for the
       id-only form, so a 5 MB localStorage quota held about 290 characters instead of
       about 1,400. compressSlots/expandSlots already did exactly this for the undo
       stack; there was no reason storage was not using them. loadSavedCharacter relinks
       every trait by id anyway, so the embedded copies were being thrown away on the
       way back in — they were pure cost. SAVE_FORMAT lets an older save (embedded
       traits, no marker) still load unchanged: expandSlots passes a trait through
       untouched unless it carries the __id marker. */
    await storage.set('character:'+name, JSON.stringify({
      format: SAVE_FORMAT,
      state: compressSlots(state), charMeta,
      pressureState: compressSlots(pressureState),
      pinnedTargets, charVariants, traitNotes,
      /* The arc is the character's history, so a save without it loses the difference
         between who they are and who they started as. The base sheet is compressed the
         same way the live one is; the events are ids and text already. */
      arcBase: arcBase ? compressSlots(arcBase) : null, arcEvents,
      settings: captureSettings(), savedAt: new Date().toISOString(),
    }));
    markWorkSaved();
    await loadSavedList();
    // A saved character is an accepted one: the diversity objective measures the next
    // batch against it, and "same world" avoids it.
    if (typeof archiveCharacter === 'function') archiveCharacter(state, {name});
    toast(storageIsDurable()
      ? 'Saved "' + name + '"'
      : 'Saved "' + name + '" to this session only — this browser is not storing data, so export it to a file to keep it.',
      storageIsDurable() ? undefined : "warn", storageIsDurable() ? undefined : 8000);
  } catch(e){
    console.error(e);
    /* A saved character is a full state dump with every trait object embedded — 80-150KB
       each — so localStorage runs out at roughly thirty saves. "Could not save — try
       again" was actively misleading there: trying again cannot possibly work, and the
       user has no idea why. Name the real cause and the real remedy. */
    if (isQuotaError(e)) toast("Out of browser storage — this browser is full. Delete a saved character (or export a few to files) and try again.", "warn", 8000);
    else toast("Could not save — try again.", "warn");
  }
  finally { if (btn){ btn.textContent = oldLabel; btn.disabled = false; } }
}
async function deleteSavedCharacter(name){
  if (!await askForConfirm(`Delete the saved character "${name}"?`, "Delete")) return;
  try {
    const r = await storage.get('character:'+name);
    const kept = r && r.value;
    await storage.delete('character:'+name); await loadSavedList();
    if (kept) toastUndo('Deleted "'+name+'"', async ()=>{
      if (await savedCharacterExists(name) && !await askForConfirm(`Something new is saved as "${name}" now. Replace it with the deleted one?`, "Replace")) return;
      await storage.set('character:'+name, kept); await loadSavedList(); toast('Restored "'+name+'"');
    }, 12000);
    else toast('Deleted "'+name+'"');
  }
  catch(e){ console.error(e); toast("Could not delete — try again.", "warn"); }
}
async function renameSavedCharacter(name){
  const next = await askForName('Rename "'+name+'" to:', name);
  if (!next || next === name) return;
  // Same clobber as saveCharacter had: storage.set to the new key overwrote whatever
  // was already under it, and then deleted the source, so renaming onto an existing
  // name destroyed a save with no warning and no way back.
  if (await savedCharacterExists(next)){
    if (!await askForConfirm(`"${next}" is already saved. Replace it? The saved version will be gone.`, "Replace")) return;
  }
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
/* ================= ONE DECODER FOR EVERY SAVED RECORD =================
   Every consumer of a saved character re-implemented expand -> validate -> relink, and
   each one got a different subset. `loadSavedCharacter` expanded both sheets;
   `addSavedToCast` expanded only `state`, so validation of a save made with Under
   Pressure on threw `pressureState slot "verbosity" has a trait with no id` and the
   cast gained nothing — with the load path's own test passing the whole time, because
   it exercised the other copy of the sequence.

   One function, used by all of them. It returns a decoded record and never touches a
   global, so a caller can decide whether to commit after seeing whether it worked. */
function decodeSavedRecord(parsed, label){
  if (!parsed || typeof parsed !== 'object') throw new Error("that save is not a character record.");
  const rec = Object.assign({}, parsed);
  /* A record with no `state` (or one that is not an object — expandSlots would turn the string
     "abc" into a three-slot junk sheet) is refused before anything else. */
  if (!rec.state || typeof rec.state !== 'object' || Array.isArray(rec.state))
    throw new Error("that save has no character sheet in it.");
  rec.state = expandSlots(rec.state);
  rec.pressureState = expandSlots(rec.pressureState);
  /* A record with no `state` (or one that is not an object) used to get as far as the loader
     assigning `state = undefined` and then throwing, with the globals already overwritten. */
  if (!rec.state || typeof rec.state !== 'object' || Array.isArray(rec.state))
    throw new Error("that save has no character sheet in it.");
  // Validate the EXPANDED shape, which is what the render path will dereference —
  // validating the compressed {__id} form fails on every save this build has written.
  validateSheetPayload(rec);
  let orphans = 0, lost = 0;
  const relink = st => {
    if (!st) return st;
    Object.values(st).forEach(sl=>{
      if (!sl) return;
      if (sl.removedTraitId !== undefined && !sl.trait){ lost++; return; }
      if (!sl.trait) return;
      const live = TRAITS_BY_ID.get(sl.trait.id);
      if (live) sl.trait = live; else orphans++;
    });
    return st;
  };
  rec.state = relink(rec.state);
  rec.pressureState = relink(rec.pressureState);
  rec.__orphans = orphans;
  rec.__lost = lost;
  rec.__label = label;
  return rec;
}
// The two messages every consumer of decodeSavedRecord owes the user.
function reportDecodeLosses(rec){
  if (rec.__orphans) toast(rec.__orphans + " trait(s) in this save no longer exist in the pool; their saved text was kept as-is.", "warn", 6000);
  if (rec.__lost) toast(rec.__lost + " trait(s) were written by an older build and have since been removed from the pool — those cards could not be recovered.", "warn", 8000);
}

async function loadSavedCharacter(name){
  try {
    const r = await storage.get('character:'+name);
    // storage.get resolves to null for a key that is not there — a stale list, a save
    // deleted in another tab — and dereferencing it threw a raw TypeError that reached
    // the user as "Cannot read properties of null (reading 'value')".
    if (!r || !r.value) throw new Error(`there is no saved character called "${name}" any more.`);
    const parsed = JSON.parse(r.value);
    /* BUG FIX: validateSheetPayload() exists because a malformed payload once got past
       the format check, ran snapshotHistory(), overwrote the globals and THEN threw in
       renderSheet — losing the user's character to a bad file. This path performed the
       identical sequence with no validation at all, and storage can hold a payload
       written by an older build, or one that was only partially written. Validate while
       nothing has been touched yet. */
    /* ORDER MATTERS, and getting it wrong broke Save/Load outright. A compressed save
       stores every trait as a {__id: 102} stub — no id, no trait/category/section
       strings — and validateSheetPayload is (correctly) strict about exactly those
       fields, because they are what the render path dereferences. Validating the
       payload as it comes off disk therefore threw on EVERY character this build had
       ever saved: `state slot "verbosity" has a trait with no id`. Expand first, so the
       validator sees the same shape the file-import path shows it — which is why file
       export/import never had this bug and the one validation test never caught it. */
    const rec = decodeSavedRecord(parsed, name);
    /* Also missing here: relink(). Without it a loaded character keeps the stale trait
       objects embedded at save time, so why?/reroll/pin operate on detached copies —
       the identity comparisons they rely on are against objects that are no longer in
       TRAITS. Re-link by id, exactly as importCharacterJSON does. */
    snapshotHistory();
    /* Already expanded above; relink now reconnects anything expandSlots left alone —
       an older save carrying full embedded trait copies rather than {__id} stubs. Both
       shapes arrive here the same way, so a save written by any build still loads. */
    state = rec.state; charMeta = rec.charMeta || {name, age:"", context:"", archetypeLabel:"Loaded"};
    if (typeof viewContext !== 'undefined') viewContext = allContextModes().some(m => m.id === charMeta.viewContext) ? charMeta.viewContext : 'baseline';
    if (typeof resetArc === 'function'){
      arcEvents = (Array.isArray(rec.arcEvents) ? rec.arcEvents : []).filter(e=>!validateArcEvent(e).length);
      arcBase = rec.arcBase ? expandSlots(rec.arcBase) : JSON.parse(JSON.stringify(state));
      // What the arc alone produces; anything the saved sheet has beyond it was an edit.
      arcOverrides = {}; arcLastReplay = JSON.parse(JSON.stringify(replayArc(arcBase, arcEvents)));
      if (arcEvents.length) arcReplay(); else renderArc(); }
    pressureState = rec.pressureState || null;
    pinnedTargets = rec.pinnedTargets || {};
    charVariants = rec.charVariants || {};
    traitNotes = rec.traitNotes || {};
    diffLog = {}; rerollExclusions = {}; rerollHistory = {}; whyOpen = {}; OPEN_CARD_CONTROLS.clear();
    if (rec.settings) restoreSettings(rec.settings);
    noteLoadedEngine(rec.seed || (rec.meta && rec.meta.seed), rec.settings);
    /* The file-import path sets this and the load path did not, so a later Undo could
       pair the loaded sheet with the sliders of whatever was generated before it. The
       loaded character's own settings block is the right answer; live controls are the
       fallback for a save written before settings were captured. */
    lastGeneratedSliders = (rec.settings && rec.settings.sliders) || rec.sliders || captureSliders();
    setVal('charName', charMeta.name || "");
    setVal('charAge', charMeta.age || "");
    setVal('charContext', charMeta.context || "");
    setText('archetypeTag', "Loaded: "+name);
    document.getElementById('pressureSheet').style.display = pressureState ? "block" : "none";
    lastSheetTraits = null;
    onSliderChange(); renderSheet(); checkConflicts();
    markWorkSaved();
    toast('Loaded "'+name+'"');
    reportDecodeLosses(rec);
  } catch(e){ console.error(e); toast("Could not load that character: " + e.message, "warn", 6000); }
}
// The saved list used to be a bare row of names with no preview, no rename, and no
// way to tell two "Corven Ashe" saves apart. Each entry now carries what it actually
// is — archetype, trait count, when it was saved — and its own controls.
async function loadSavedList(){
  const listEl = document.getElementById('savedList');
  if (!listEl) return;
  try {
    const res = await storage.list('character:');
    const tools = document.getElementById('savedTools');
    if(!res || !res.keys || !res.keys.length){ listEl.innerHTML = ""; if (tools) tools.hidden = true; return; }
    if (tools) tools.hidden = res.keys.length < 2;
    listEl.innerHTML = "";
    const head = document.createElement('div');
    head.className = 'savedHead';
    head.textContent = 'Saved characters';
    listEl.appendChild(head);
    /* PERF: this awaited one storage.get per saved character strictly in sequence, so
       thirty saves meant thirty round trips one after another. They are independent
       reads; fetch them together. */
    const rows = await Promise.all(res.keys.map(async k=>{
      try {
        const r = await storage.get(k);
        const parsed = JSON.parse(r.value);
        return {k, parsed, bytes: (r.value || "").length};
      } catch(e){ return {k, parsed: null, bytes: 0, err: e}; }
    }));
    let bytesUsed = 0;
    rows.forEach(x=>{ bytesUsed += x.bytes; });
    // Library sort: newest first by default, which is the save you are most likely after.
    const sortBy = (document.getElementById('savedSort')||{}).value || 'recent';
    const nameOf = x => x.k.replace('character:','');
    const when = x => Date.parse(x.parsed && x.parsed.savedAt || 0) || 0;
    rows.sort(sortBy === 'name' ? (a,b)=> nameOf(a).localeCompare(nameOf(b), undefined, {sensitivity:'base'})
      : sortBy === 'oldest' ? (a,b)=> when(a) - when(b)
      : sortBy === 'size' ? (a,b)=> b.bytes - a.bytes
      : (a,b)=> when(b) - when(a));
    for (const {k, parsed, bytes} of rows){
      const name = k.replace('character:','');
      let summary = "";
      if (parsed){
        const n = Object.values(parsed.state||{}).filter(x=>x&&x.trait).length;
        const bits = [];
        if (parsed.charMeta && parsed.charMeta.archetypeLabel) bits.push(parsed.charMeta.archetypeLabel);
        bits.push(n + " traits");
        if (parsed.savedAt) bits.push(new Date(parsed.savedAt).toLocaleDateString());
        bits.push(Math.max(1, Math.round(bytes/1024)) + " KB");
        summary = bits.join(" · ");
      } else {
        // Was indistinguishable from a normal entry. A save that will not parse is a
        // save that will not load, and the user should be told that here, not on click.
        summary = "unreadable — this save is damaged and will not load";
      }
      const row = document.createElement('div');
      row.className = 'savedRow';
      row.setAttribute('data-search', (name + ' ' + summary).toLowerCase());
      const open = document.createElement('button');
      open.className = 'savedOpen';
      open.innerHTML = '<b></b><span></span>';
      open.querySelector('b').textContent = name;
      open.querySelector('span').textContent = summary;
      open.onclick = ()=> loadSavedCharacter(name);
      const ren = document.createElement('button');
      ren.className = 'savedAct'; ren.textContent = 'rename';
      ren.onclick = ()=> renameSavedCharacter(name);
      /* The Relationships tab compares whatever is on the Cast tab, so comparing two of
         your OWN saved characters was impossible: loading the second one replaced the
         first. Adding a save to the cast (rather than loading it over the sheet) is the
         missing half — load two and the Relationships tab works on them. */
      const cmp = document.createElement('button');
      cmp.className = 'savedAct'; cmp.textContent = 'to cast';
      cmp.title = 'Add this saved character to the Cast tab, so it can be compared with others without replacing the sheet you are working on';
      cmp.setAttribute('aria-label', 'Add ' + name + ' to the cast');
      cmp.onclick = ()=> addSavedToCast(name);
      const del = document.createElement('button');
      del.className = 'savedAct savedDel'; del.textContent = 'delete';
      del.setAttribute('aria-label', 'Delete ' + name);
      del.onclick = ()=> deleteSavedCharacter(name);
      const vs = document.createElement('button');
      vs.className = 'savedAct'; vs.textContent = 'compare';
      vs.title = 'Lay this save beside the sheet on screen, slot by slot, without loading it';
      vs.setAttribute('aria-label', 'Compare ' + name + ' with the current sheet');
      vs.onclick = ()=> compareWithSaved(name);
      row.appendChild(open); row.appendChild(vs); row.appendChild(cmp); row.appendChild(ren); row.appendChild(del);
      listEl.appendChild(row);
    }
    /* The code already knows what a save costs (~3.7 KB compressed) and the user never
       saw it — the first sign of a full quota was Save failing. Say what is in use. */
    const foot = document.createElement('div');
    foot.className = 'savedFoot sub';
    const kb = bytesUsed / 1024;
    foot.textContent = `${rows.length} saved · ${kb < 1024 ? kb.toFixed(0) + " KB" : (kb/1024).toFixed(1) + " MB"} used`;
    foot.title = "Browsers typically allow about 5 MB of local storage in total, shared with your preferences. Export characters to files to keep them beyond that.";
    listEl.appendChild(foot);
    const none = document.createElement('div');
    none.id = 'savedNone'; none.className = 'sub'; none.hidden = true;
    none.textContent = 'No saved character matches that search.';
    listEl.insertBefore(none, foot);
    applySavedFilter();
  } catch(e){
    /* This swallowed EVERY error under "none saved yet", so a genuine storage fault —
       a disabled or full backend, a rejected read — looked exactly like a new user with
       no saves. An empty list is the `!res.keys.length` case above and returns early;
       reaching here means something actually went wrong. */
    console.error(e);
    listEl.innerHTML = "";
    const err = document.createElement('div');
    err.className = 'savedHead';
    err.textContent = "Saved characters could not be read from this browser's storage.";
    err.title = String(e && e.message || e);
    listEl.appendChild(err);
  }
}

async function addSavedToCast(name){
  try {
    const r = await storage.get('character:'+name);
    if (!r || !r.value) throw new Error(`there is no saved character called "${name}" any more.`);
    const parsed = JSON.parse(r.value);
    /* Broken twice over before this: it validated the compressed payload (which always
       threw, see loadSavedCharacter) and it never called expandSlots at all, so even
       past the validator every cast member would have been a sheet of {__id} stubs.
       Same order as the load path — expand, validate, relink. */
    // Same decoder as the load path — see decodeSavedRecord. This used to expand only
    // `state`, which is why a save carrying a pressure variant could never join a cast.
    const rec = decodeSavedRecord(parsed, name);
    const st = rec.state || {};
    if (castStates.some(c=>c.meta.name === name)){
      toast(`"${name}" is already on the Cast tab.`, "warn");
      switchTab('cast');
      return;
    }
    castStates.push(castEntry(st, rec.charVariants || null,
      (rec.charMeta && Object.assign({}, rec.charMeta, {name})) || {name, age:"", context:"", archetypeLabel:"Saved"},
      // A cast member keeps its own pressure sheet, so it is still the same character
      // once it is over there.
      {pressureState: rec.pressureState || null, traitNotes: rec.traitNotes || {}}));
    reportDecodeLosses(rec);
    renderCast();
    refreshRelSelectors();
    switchTab('cast');
    toast(`Added "${name}" to the cast — the Relationships tab can compare it now.`);
  } catch(e){ console.error(e); toast("Could not add that character: " + e.message, "warn", 6000); }
}

// ================= CAST COMPARISON =================
/* Names are not identity. Foil generation removed every cast member CALLED "Foil" or
   matching the source character's display name before appending its own pair, so a
   renamed member, an imported unrelated character, or a second character the user had
   deliberately named "Foil" was deleted by an operation that had nothing to do with
   it. Every cast entry now carries an opaque id, and generated members carry the
   relationship that produced them, so replacement targets the thing it created. */
let _castIdSeq = 0;
function newCharacterId(){
  _castIdSeq++;
  return 'ch_' + Date.now().toString(36) + '_' + _castIdSeq.toString(36);
}
function castEntry(state, variants, meta, extra){
  const entry = Object.assign({id: newCharacterId(), state, variants, meta}, extra || {});
  // Joining the cast is acceptance, for the diversity objective's purposes.
  if (typeof archiveCharacter === 'function') archiveCharacter(state, {id: entry.id, name: meta && meta.name});
  return entry;
}
let castStates = [];
let lastCastSeed = null;
let lastCastOptimisation = null;   // {before, after, rerolled} from optimiseCastVoices
function randomAxisLevel(){ return (rand()*4) - 2; }

/* One cast member, drawn from the current settings. generateCast uses it for the whole
   cast; "regenerate the most similar member" uses it for one. Draws from whatever rng is
   live, so the caller decides how it is seeded. */
function makeCastRoller(){
  const rarityPref = rarityPrefVal();
  const mannerCount = intVal('mannerCount', 3);
  const vocabCount = intVal('vocabCount', 2);
  const anchored = boolVal('castAnchor', false) && Object.keys(state).length > 0;
  const spread = clamp(floatVal('castSpread', 0.55), 0.15, 1);
  const baseVerb = rawToLevel(intVal('verbositySlider', 0));
  const baseReg  = rawToLevel(intVal('registerSlider', 0));
  const baseComp = rawToLevel(intVal('composureSlider', 0));
  const around = (base, s) => clamp(base + (rand()*2 - 1) * 2 * s, -2, 2);
  return () => {
    const verbLevel = anchored ? around(baseVerb, spread) : randomAxisLevel();
    const regLevel  = anchored ? around(baseReg,  spread) : randomAxisLevel();
    const compLevel = anchored ? around(baseComp, spread) : randomAxisLevel();
    const personalityOverrides = {};
    PERSONALITY_AXES.forEach(axis=>{
      personalityOverrides[axis.id] = anchored
        ? Math.round(clamp(intVal('pers_'+axis.id, 0) + (rand()*2 - 1) * 100 * spread, -100, 100))
        : Math.round(randomAxisLevel()*50);
    });
    rollCharacterVariants();
    /* Cast members used to call buildCharacterState and stop there — no required
       traits, no budgets, no exclusivity — so a cast generated with a named
       required trait and every rarity cap at zero honoured none of them, while the
       chips on screen said otherwise. Same finalizer as everything else; pins are
       the single-character sheet's and deliberately do not travel. */
    const cand = finalizeSheet(buildCharacterState({verbLevel, regLevel, compLevel, mannerCount, vocabCount,
      rarityPref, vocabPref:null, personalityOverrides}), {rarityPref, applyPins:false});
    return {state: cand, variants: Object.assign({}, charVariants)};
  };
}
/* "Regenerate the most similar member": the one who collides with the rest on the most
   voice devices (the same score the joint optimisation minimises) is redrawn until the
   cast's total drops. Undo brings the old member back. */
function regenerateMostSimilarMember(){
  if (castStates.length < 2){ toast("A cast needs at least two members to compare.", "warn"); return; }
  const m = voiceCollisionMatrix(castStates, "baseline", 0);
  const i = m.worst;
  if (!(i >= 0) || !castStates[i]){ toast("No member stands out as the most similar.", "warn"); return; }
  const before = m.totals.reduce((a, b) => a + b, 0);
  const restore = _castSnapshot();
  const old = castStates[i];
  let best = null;
  const baseKey = String(lastCastSeed || "cast") + "|regen|" + (old.meta.name || i) + "|" + (_regenCount++);
  withReplayMode(true, ()=> withoutContextBias(()=> withSpeculativeGeneration(()=> {
    for (let a = 0; a < 6; a++){
      withRng(mulberry32(hashSeedString(baseKey + "|" + a)), ()=>{
        const cand = makeCastRoller()();
        const trial = castStates.map((c, j) => j === i ? Object.assign({}, c, cand) : c);
        const t = voiceCollisionMatrix(trial, "baseline", 0).totals.reduce((x, y) => x + y, 0);
        if (!best || t < best.t) best = {t, cand};
      });
    }
  })));
  if (!best){ toast("Could not draw a replacement.", "warn"); return; }
  castStates[i] = Object.assign({}, old, best.cand, {meta: old.meta});
  renderCast(); refreshRelSelectors();
  toastUndo(`Redrew "${old.meta.name}", the member most like the others: shared voice devices ${before} → ${best.t}.`, ()=>{ restore(); toast(`"${old.meta.name}" is back.`); }, 10000);
}
let _regenCount = 0;
function generateCast(){
  try { return _generateCastInner(); } finally { syncEngineToSheet(); }
}
function _generateCastInner(){
  const count = intVal('castCount', 3);
  // BUG FIX: the cast read your Generate-group checkboxes and per-section profile
  // toggles (via buildCharacterState) but hardcoded three mannerisms and a balanced
  // rarity, so it inherited some of your settings and silently ignored the rest.
  const rarityPref = rarityPrefVal();
  const mannerCount = intVal('mannerCount', 3);
  const vocabCount = intVal('vocabCount', 2);
  // The cast was the one generator with no reproducibility at all: unseeded draws,
  // so an ensemble you liked could never be recovered or shared. Same seeded-block
  // pattern as the single character, on its own stream.
  const seedInput = document.getElementById('castSeed');
  // One seed codec for every generator — see resolveSeed in generate.js. The cast
  // label used to be `seedNum.toString(36)`, which could not be pasted back.
  const castSeed = resolveSeed(seedInput ? seedInput.value : "");
  const seedNum = castSeed.num;
  /* A cast always builds with engine 1, so its printed seed was always "v1-". The optimiser used
     to undo the anti-similarity pass (below); fixing that changes which cast a seed builds, so a
     fresh cast now prints a "v2-" seed and only a v2 seed gets the fix. Pasted v1 seeds and typed
     phrases rebuild exactly the casts they always did. */
  if (!castSeed.explicit) castSeed.label = 'v' + DEFAULT_ENGINE_V + '-' + (castSeed.num >>> 0).toString(36);
  const castV2 = /^v[23]-[0-9a-z]+$/.test(castSeed.label);
  // A v1 or v2 cast keeps drawing from the engine-1 pools it always did; a v3 cast draws from the whole bank.
  setEngineV(/^v3-[0-9a-z]+$/.test(castSeed.label) ? 3 : 1);
  // The cast and its edges are replaced wholesale — keep a way back (Undo toast below).
  const hadCast = castStates.length > 0 || relationshipEdges.length > 0;
  const restoreCast = hadCast ? _castSnapshot() : null;
  lastCastSeed = castSeed.label;
  castStates = [];
  relationshipEdges = [];
  // withoutContextBias: the cast is not "six more of the character you just made" —
  // see the note on the helper in engine.js.
  // withSavedVariants: each cast member rolls its own presentation locks, and the
  // single-character sheet's locks are restored once the whole batch is done — see
  // the note on withCharacterVariants in engine.js.
  /* AROUND THIS CHARACTER. The cast ignored your sliders completely — randomAxisLevel()
     uniform over the whole range, per axis, per member — so there was no way to ask for
     "a cast around the person I just built", which is the commonest reason to want one.
     Anchored mode keeps your settings as the centre of gravity and scatters each member
     around them by a controllable spread; unanchored keeps the old behaviour, because a
     cast of six strangers is also a real thing to want. */
  const anchored = boolVal('castAnchor', false) && Object.keys(state).length > 0;
  const spread = clamp(floatVal('castSpread', 0.55), 0.15, 1);
  const baseVerb = rawToLevel(intVal('verbositySlider', 0));
  const baseReg  = rawToLevel(intVal('registerSlider', 0));
  const baseComp = rawToLevel(intVal('composureSlider', 0));
  const around = (base, s) => clamp(base + (rand()*2 - 1) * 2 * s, -2, 2);

  /* ANTI-SIMILARITY. Each member was an independent roll with nothing stopping two of
     six landing on the same Role AND Values AND Attachment — which is the one thing an
     ensemble must not do, and the thing a person notices immediately. Track what has
     already been taken and re-roll a member that collides too heavily with one already
     placed. Bounded attempts: with six members and seven roles a perfect spread is not
     always reachable, and a slightly repetitive cast beats an infinite loop. */
  const placed = [];
  const KEY_SECTIONS = ['role', 'values', 'attachment', 'stress'];
  const overlapWith = (st) => {
    let worst = 0;
    placed.forEach(prev=>{
      const n = KEY_SECTIONS.filter(id=> slotCat(st['prof_'+id+'_0']) &&
        slotCat(st['prof_'+id+'_0']) === slotCat(prev['prof_'+id+'_0'])).length;
      if (n > worst) worst = n;
    });
    return worst;
  };

  let rerolled = 0;
  /* REPLAY. Two consecutive casts from the same seed used to differ: every member that
     joins the cast is archived (castEntry -> archiveCharacter), and the archive, recent
     traits and slot memory all weight the next build — so the first cast fed the second.
     A cast is always built as a replay (see withReplayMode in engine.js): it runs against
     empty session history, so the seed in the readout rebuilds exactly this cast, from
     any session, whether it was typed in or rolled. */
  withReplayMode(true, ()=> withoutContextBias(()=> withSpeculativeGeneration(()=> withRng(mulberry32(seedNum), ()=>{
    const rollOne = makeCastRoller();
    const drafts = [];
    for (let i=0;i<count;i++){
      let d = null;
      // Accept immediately at <=1 shared key section; try a few times to beat 2+.
      for (let attempt = 0; attempt < 6; attempt++){
        d = rollOne();
        if (overlapWith(d.state) <= 1) break;
        rerolled++;
      }
      placed.push(d.state);
      drafts.push(d);
    }
    /* JOINT OPTIMISATION (Section 6): members were independent rolls; now the member
       sharing the most voice devices with the rest is rerolled until the cast's total
       stops dropping. Seeded off the cast seed, so a replay rebuilds the same cast. */
    if (boolVal('castOptimise', true) && typeof optimiseCastVoices === 'function'){
      /* The optimiser rebuilds the worst member with a bare roll, which skipped the overlap check
         above and put back duplicate role, values, attachment and stress combinations (duplicate
         stress + attachment pairs per cast went from 0.017 to 0.333). From v2 a rebuilt member
         has to clear the same bar against the rest of the cast. */
      const rebuild = !castV2 ? () => rollOne() : (idx, cur) => {
        const others = (cur || drafts).filter((_, j) => j !== idx).map(c => c.state);
        let d = null;
        for (let attempt = 0; attempt < 6; attempt++){
          d = rollOne();
          const worst = others.reduce((w, st) => Math.max(w, KEY_SECTIONS.filter(id => slotCat(d.state['prof_'+id+'_0']) &&
            slotCat(d.state['prof_'+id+'_0']) === slotCat(st['prof_'+id+'_0'])).length), 0);
          if (worst <= 1) break;
        }
        return d;
      };
      lastCastOptimisation = optimiseCastVoices(drafts, String(lastCastSeed), rebuild);
    } else lastCastOptimisation = null;
    drafts.forEach((d, i)=>{
      // Carried on the cast entry rather than left in the global, so a cast member's
      // own locks travel with it (relationship analysis, cast export) instead of
      // whichever member happened to be generated last.
      castStates.push(castEntry(d.state, d.variants,
        {name:"Character " + (i+1), age:"", context:"",
         archetypeLabel: anchored ? "Cast member (around your character)" : "Cast member"}));
    });
  }))));
  if (rerolled) console.info(`[cast] re-rolled ${rerolled} time(s) to keep members distinct`);
  const out = document.getElementById('castSeedReadout');
  if (out) out.textContent = "Cast seed: " + lastCastSeed + (lastCastOptimisation && lastCastOptimisation.rerolled
    ? ` · voices optimised jointly: shared devices ${lastCastOptimisation.before} → ${lastCastOptimisation.after}` : ``);
  renderCast();
  // BUG FIX: the Relationships dropdowns were only rebuilt by switchTab('rel'), so a
  // cast generated while sitting on that tab left stale (or empty) selectors behind.
  refreshRelSelectors();
  if (restoreCast) toastUndo("New cast generated — the previous cast and its relationships were replaced.",
    ()=>{ restoreCast(); toast("The previous cast is back."); });
}
/* Theme-aware: these are drawn into inline SVG fill/stroke attributes, which resolve
   CSS custom properties just as a stylesheet would, so the cast overlay follows the
   palette instead of being the one element that ignores it. */
const CAST_COLORS = ["var(--cast-1)","var(--cast-2)","var(--cast-3)","var(--cast-4)","var(--cast-5)","var(--cast-6)"];
function onCastAnchorChange(){
  const row = document.getElementById('castSpreadRow');
  if (row) row.style.display = boolVal('castAnchor', false) ? 'block' : 'none';
  updateCastSpreadReadout();
}
function updateCastSpreadReadout(){
  const v = floatVal('castSpread', 0.55);
  setText('castSpreadReadout',
    v < 0.3 ? "Close variations on the same person — siblings, a unit, a household"
    : v < 0.6 ? "Related, but their own people"
    : v < 0.85 ? "Same world, quite different people"
    : "Barely anchored — near enough to a free roll");
}
function renderCast(){
  const grid = document.getElementById('castGrid');
  if (!grid) return;   // container absent (embedded build, or a trimmed page)
  grid.innerHTML = "";
  // Cast overlay radar: every member's axis profile on one chart, so ensemble
  // gaps (an axis nobody covers) and pile-ups (everyone leaning the same way)
  // are visible at a glance instead of only via the text balance checker.
  const overlay = document.getElementById('castRadar');
  if (overlay){
    const profiles = castStates.map((c,i)=>({label:c.meta.name, color:CAST_COLORS[i%CAST_COLORS.length], prof:axisProfile(c.state)}))
                               .filter(p=>Object.keys(p.prof).length >= 2);
    if (profiles.length >= 2){
      let legend = profiles.map(p=>`<span data-st="display:inline-flex;align-items:center;gap:5px;margin-right:12px;font-size:.75rem;"><i data-st="width:10px;height:10px;border-radius:2px;background:${cssColor(p.color)};display:inline-block;"></i>${escHTML(p.label)}</span>`).join("");
      overlay.innerHTML = `<div class="tensionTitle" data-st="color:var(--dusk-blue);margin-bottom:4px;">Cast overlay — axis profiles</div>${radarSVG(profiles, 360)}<div data-st="margin-top:6px;">${legend}</div><div class="sub" data-st="margin:6px 0 0;">All members on one chart. Overlapping shapes = characters pulling the same directions; empty axes = ground nobody in this ensemble covers.</div>`;
      overlay.style.display = "block";
    } else overlay.style.display = "none";
  }
  // Section 6: ensemble seats (leader, foil, comic relief…) read off the sheets.
  const castRoles = (typeof assignCastRoles === 'function' && castStates.length >= 2) ? assignCastRoles(castStates) : [];
  castStates.forEach((c, idx)=>{
    const card = document.createElement('div');
    card.className = "castCard";
    const seat = castRoles[idx];
    // Cast names are editable (rename below), so this is interpolated user text:
    // escape it rather than waiting for the day someone types a "<".
    /* A cast was add-only: nothing anywhere removed a member, so a mis-generated or
       no-longer-wanted character stayed in the ensemble (and in the balance check, the
       overlay radar and both Relationship selectors) until the whole cast was
       regenerated from scratch. */
    let inner = `<h3><span>${escHTML(c.meta.name)}</span>` +
      (seat ? `<span class="castRoleBadge castRole-${escAttr(seat.id)}" title="${escAttr(seat.why)}">${escHTML(seat.label)}</span>` : ``) +
      `<button class="savedAct" ${actAttr('click', 'renameCastMember', idx)}>rename</button>` +
      `<button class="savedAct savedDel" ${actAttr('click', 'removeCastMember', idx)} ` +
      `aria-label="Remove ${escAttr(c.meta.name)} from the cast" title="Remove this character from the cast">remove</button></h3>`;
    const addAll = (ids)=>{ ids.forEach(id=>{ inner += traitCardHTML(id, c.state[id], false, false, sectionColor(titleForSlotId(id))); }); };
    addAll(Object.keys(c.state).filter(k=>k.startsWith("pers_")));
    addAll(Object.keys(c.state).filter(k=>k.startsWith("prof_")));
    addAll(["verbosity","register","grammar"].filter(id=>c.state[id]));
    addAll(Object.keys(c.state).filter(k=>k.startsWith("vocab")));
    addAll(Object.keys(c.state).filter(k=>k.startsWith("manner")));
    addAll(Object.keys(c.state).filter(k=>k.startsWith("wild_")));
    card.innerHTML = inner;
    grid.appendChild(card);
  });
  if (typeof renderVoiceHeatmap === 'function') renderVoiceHeatmap();
  if (typeof renderRelWeb === 'function') renderRelWeb();
}
async function renameCastMember(i){
  const c = castStates[i];
  if (!c) return;
  const next = await askForName("Name this cast member:", c.meta.name);
  if (!next || next === c.meta.name) return;
  /* Names are the cast's identity everywhere it is read from the outside — the
     Relationship dropdowns, addSavedToCast's "already on the Cast tab" check, the
     markdown and JSON exports — and duplicates were allowed, producing two
     indistinguishable options and a dedupe check that refused the wrong character. */
  if (castStates.some((o,j)=> j !== i && o.meta.name === next)){
    toast(`Another cast member is already called "${next}".`, "warn");
    return;
  }
  c.meta.name = next;
  renderCast();
  refreshRelSelectors();
  // The edge cards print member names too; they kept the old one until the next edit.
  if (typeof renderEdges === 'function') renderEdges();
}
async function removeCastMember(i){
  const c = castStates[i];
  if (!c) return;
  // An Undo toast rather than a confirm: removal is cheap to reverse, and a confirm on
  // every removal trains people to click through the ones that matter.
  const name = c.meta.name;
  const restore = _castSnapshot();
  castStates.splice(i, 1);
  // An edge naming a member who has left is a lie about the ensemble — see pruneEdges.
  const before = relationshipEdges.length;
  relationshipEdges = pruneEdges(relationshipEdges, castStates);
  renderCast();
  refreshRelSelectors();
  if (before !== relationshipEdges.length) toast(`${before - relationshipEdges.length} relationship edge(s) went with them.`, "warn", 5000);
  toastUndo(`Removed "${name}" from the cast.`, ()=>{ restore(); toast(`"${name}" is back in the cast.`); });
}
/* Cast + edges as they are now, and a function that puts them back. Members are held by
   reference — nothing mutates a removed member — so this is cheap. */
function _castSnapshot(){
  const members = castStates.slice(), edges = relationshipEdges.slice(), seed = lastCastSeed;
  return ()=>{
    castStates = members; relationshipEdges = edges; lastCastSeed = seed;
    renderCast(); refreshRelSelectors(); if (typeof renderEdges === 'function') renderEdges();
  };
}
function castToMarkdown(){
  const head = `# Character Cast\n\n_${castStates.length} characters_\n`;
  const edges = relationshipEdges.length ? `\n## Relationships\n\n${edgesToMarkdown(relationshipEdges, castStates)}\n` : "";
  return head + edges + castStates.map(c=>sheetToText(c.state, c.meta, null)).join("\n");
}
function copyCast(btnEl){
  copyText(castToMarkdown(), btnEl);
}
/* The cast as a spreadsheet: one row per card per member (long format), so it sorts and
   pivots. A BOM makes Excel read the em dashes as UTF-8. */
function _csvCell(v){ const s = String(v == null ? "" : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function castToCSV(){
  const head = ["Member", "Age", "Context", "Archetype", "Slot", "Section", "Category", "Trait", "Intensity", "Rarity", "Kept"];
  const rows = [head];
  castStates.forEach(c => {
    Object.keys(c.state || {}).forEach(k => {
      const s = c.state[k]; if (!s || !s.trait) return;
      rows.push([c.meta.name, c.meta.age || "", c.meta.context || "", c.meta.archetypeLabel || "", s.label || k, s.trait.section, s.trait.category, s.trait.trait, s.trait.intensity, s.trait.rarity, s.locked ? "yes" : ""]);
    });
  });
  return "\ufeff" + rows.map(r => r.map(_csvCell).join(",")).join("\r\n") + "\r\n";
}
// The relationship web, as a standalone .svg: theme variables are resolved to real colours so it
// looks the same outside the page.
function downloadRelationshipSvg(){
  const svg = document.querySelector('#relWeb svg');
  if (!svg){ toast("Draw the web first: link at least two members on the Relationships tab.", "warn"); return; }
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const vb = (clone.getAttribute('viewBox') || "").split(/[ ,]+/).map(Number);
  if (vb.length === 4 && !clone.getAttribute('width')){ clone.setAttribute('width', vb[2]); clone.setAttribute('height', vb[3]); }
  const cs = getComputedStyle(document.documentElement);
  let out = new XMLSerializer().serializeToString(clone).replace(/var\((--[a-z0-9-]+)\)/gi, (m, n) => cs.getPropertyValue(n).trim() || m);
  const bg = cs.getPropertyValue('--panel').trim() || '#ffffff';
  out = out.replace(/(<svg[^>]*>)/, `$1<rect width="100%" height="100%" fill="${bg}"/>`);
  downloadText('<?xml version="1.0" encoding="UTF-8"?>\n' + out, "relationship_web.svg", "image/svg+xml");
}
function downloadCastCSV(){
  if (!castStates.length){ toast("Build a cast first.", "warn"); return; }
  downloadText(castToCSV(), "character_cast.csv", "text/csv");
}
function downloadCast(){
  downloadText(castToMarkdown(), "character_cast.md");
}

/* An ensemble could only leave the app as markdown — readable, and not re-importable.
   A cast you liked could never be recovered or shared as a working cast, only as prose
   about one. Same round-tripping promise the single-character export already makes. */
const CAST_FORMAT_VERSION = 1;
function exportCastJSON(){
  if (!castStates.length){ toast("Generate a cast first.", "warn"); return; }
  downloadText(JSON.stringify(castBundle(), null, 2), "character_cast.json");
  toast(`Exported ${castStates.length} cast member${castStates.length===1?'':'s'}.`);
}
function importCastJSON(fileInput){
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    try {
      const p = JSON.parse(reader.result);
      if (!p || p.format !== "character-voice-cast") throw new Error("Not a cast file.");
      checkFileVersion(p, CAST_FORMAT_VERSION, "cast");
      let mergeMode = false;
      if (castStates.length){
        const inCount = Array.isArray(p.members) ? p.members.length : 0;
        const choice = await askChoice(`The Cast tab already has ${castStates.length} character${castStates.length === 1 ? '' : 's'}. What should the ${inCount} in this file do?`,
          [{value: 'merge', label: 'Add to the cast'}, {value: 'replace', label: 'Replace the cast'}]);
        if (!choice){ fileInput.value = ""; return; }
        mergeMode = choice === 'merge';
      }
      // (B16: replacing the ensemble used to happen with no confirm and no way back; the choice above and the Undo toast below are that fix.)
      const restore = _castSnapshot();
      const hadCast = castStates.length > 0;
      // Same structural validation and id re-linking the single-character import does —
      // a malformed member must not get as far as renderCast and throw there.
      let orphans, dropped;
      if (mergeMode){
        // Import into the live globals, then fold the incoming members and edges into what was there.
        const curMembers = castStates.slice(), curEdges = relationshipEdges.slice();
        ({orphans, dropped} = applyCastBundle(p));
        const incoming = castStates, inEdges = relationshipEdges, ids = new Set(curMembers.map(c => c.id)), names = new Set(curMembers.map(c => c.meta && c.meta.name));
        const remap = {}; let renamed = 0;
        incoming.forEach(c => {
          if (ids.has(c.id)){ const nid = newCharacterId(); remap[c.id] = nid; c.id = nid; }
          ids.add(c.id);
          let n = c.meta && c.meta.name, k = 2;
          while (names.has(n)){ n = `${c.meta.name} (${k++})`; }
          if (n !== (c.meta && c.meta.name)){ c.meta = Object.assign({}, c.meta, {name: n}); renamed++; }
          names.add(n);
        });
        const rm = id => remap[id] || id;
        castStates = curMembers.concat(incoming);
        relationshipEdges = pruneEdges(curEdges.concat(inEdges.map(e => Object.assign({}, e, {from: rm(e.from), to: rm(e.to)}))), castStates);
        if (renamed) toast(`${renamed} member name${renamed === 1 ? ' was' : 's were'} already in use and got a number.`, "ok", 6000);
      } else ({orphans, dropped} = applyCastBundle(p));
      renderCast();
      refreshRelSelectors();
      renderEdges();
      switchTab('cast');
      const msg = `${mergeMode ? 'Added to the cast: it now has' : 'Imported'} ${castStates.length} cast member${castStates.length===1?'':'s'}${relationshipEdges.length ? ` and ${relationshipEdges.length} edge${relationshipEdges.length===1?'':'s'}` : ``}.`;
      if (hadCast) toastUndo(msg, ()=>{ restore(); toast("The previous cast is back."); }, 12000);
      else toast(msg);
      if (orphans) toast(orphans + " trait(s) in this file no longer exist in the pool; their saved text was kept as-is.", "warn", 6000);
      if (dropped) toast(dropped + " edge(s) named members not in this file and were dropped.", "warn", 6000);
    } catch(e){ toast("Could not import cast: " + e.message, "warn", 6000); }
    fileInput.value = "";
  };
  reader.readAsText(file);
}

// ================= RELATIONSHIP WORKSPACE =================
/* Directed edges between cast members. Lives beside castStates, travels in the cast
   file, and is pruned whenever a member leaves. See RELATIONSHIP_ROLES in engine.js. */
let relationshipEdges = [];
function castMemberById(id){ return castStates.find(c => c.id === id) || null; }
function _relPartyId(key){
  if (key === "__single__") return null;
  const c = getCharByKey(key);
  return c ? c.id : null;
}
function refreshRoleSelect(){
  const sel = document.getElementById('relRole');
  if (!sel || sel.options.length) return;
  sel.innerHTML = `<option value="">No named role</option>` +
    RELATIONSHIP_ROLES.map(r => `<option value="${escHTML(r.id)}" title="${escAttr(r.blurb)}">${escHTML(r.label)}</option>`).join("");
}
function addRelationshipEdge(){
  const ka = strVal('relA', ''), kb = strVal('relB', '');
  const from = _relPartyId(ka), to = _relPartyId(kb);
  if (!from || !to){ toast("Edges join cast members. Add the current character to the cast first (Cast tab → Add current).", "warn", 5000); return; }
  if (from === to){ toast("Pick two different characters.", "warn"); return; }
  const roleId = strVal('relRole', '') || null;
  const A = castMemberById(from), B = castMemberById(to);
  const d = edgeDefaults(A.state, B.state, roleId);
  const edge = makeEdge(from, to, roleId, d);
  if (relationshipEdges.some(e => e.id === edge.id)){ toast("That edge already exists — edit it below.", "warn"); return; }
  relationshipEdges.push(edge);
  renderEdges();
  toast(`Added ${A.meta.name} → ${B.meta.name}${d.why.length ? ` (${d.why.join("; ")})` : ``}.`, "ok", 5000);
}
/* Both directions at once, asymmetric by construction — see asymmetricEdgePair. */
function addAsymmetricPair(){
  const from = _relPartyId(strVal('relA', '')), to = _relPartyId(strVal('relB', ''));
  if (!from || !to){ toast("Edges join cast members. Add the current character to the cast first (Cast tab → Add current).", "warn", 5000); return; }
  if (from === to){ toast("Pick two different characters.", "warn"); return; }
  const A = castMemberById(from), B = castMemberById(to);
  const [ab, ba, leaner] = asymmetricEdgePair(A, B, strVal('relRole', '') || null);
  const added = [ab, ba].filter(e => !relationshipEdges.some(x => x.id === e.id));
  if (!added.length){ toast("Both edges already exist — edit them below.", "warn"); return; }
  relationshipEdges.push(...added);
  renderEdges();
  toast(`Added ${A.meta.name} ⇄ ${B.meta.name}: ${(leaner === "a" ? A : B).meta.name} leans in harder.`, "ok", 5000);
}
function renderRelWeb(){
  const host = document.getElementById('relWeb');
  if (!host || typeof relationshipWebHTML !== 'function') return;
  host.innerHTML = relationshipWebHTML(castStates, relationshipEdges);
}
function removeRelationshipEdge(id){
  relationshipEdges = relationshipEdges.filter(e => e.id !== id);
  renderEdges();
}
function editRelationshipEdge(id, field, el){
  const e = relationshipEdges.find(x => x.id === id);
  if (!e || !el) return;
  if (field === 'trust' || field === 'dependence') e[field] = clamp(parseInt(el.value, 10) || 3, 1, 5);
  else if (field === 'status') e.status = RELATIONSHIP_STATUS.includes(el.value) ? el.value : 'equal';
  else e[field] = String(el.value || "").slice(0, 600);
  // No re-render: the field being typed into is the field being stored.
  const stamp = document.getElementById('edgeStamp');
  if (stamp) stamp.textContent = `${relationshipEdges.length} edge${relationshipEdges.length===1?'':'s'} · saved with the cast`;
}
function renderEdges(){
  const host = document.getElementById('relEdges');
  if (!host) return;
  refreshRoleSelect();
  relationshipEdges = pruneEdges(relationshipEdges, castStates);
  const stamp = document.getElementById('edgeStamp');
  if (stamp) stamp.textContent = relationshipEdges.length ? `${relationshipEdges.length} edge${relationshipEdges.length===1?'':'s'} · saved with the cast` : "No edges yet.";
  const name = id => { const m = castMemberById(id); return m ? m.meta.name : id; };
  const text = (e, k, ph) => `<label class="edgeField"><span>${k}</span><input type="text" value="${escAttr(e[k] || "")}" placeholder="${escAttr(ph)}" ${actAttr('change', 'editRelationshipEdge', e.id, k, "$el")}></label>`;
  host.innerHTML = relationshipEdges.map(e => {
    const role = relationshipRole(e.role);
    return `<div class="edgeCard" data-edge="${escAttr(e.id)}">
      <div class="edgeHead"><b>${escHTML(name(e.from))}</b> → <b>${escHTML(name(e.to))}</b>${role ? ` <span class="edgeRole">${escHTML(role.label)}</span>` : ``}
        <button class="savedAct savedDel" ${actAttr('click', 'removeRelationshipEdge', e.id)} aria-label="Remove this edge">remove</button></div>
      <div class="edgeNums">
        <label>trust <input type="range" min="1" max="5" step="1" value="${e.trust}" ${actAttr('input', 'editRelationshipEdge', e.id, 'trust', "$el")} aria-label="trust"></label>
        <label>dependence <input type="range" min="1" max="5" step="1" value="${e.dependence}" ${actAttr('input', 'editRelationshipEdge', e.id, 'dependence', "$el")} aria-label="dependence"></label>
        <label>stands <select ${actAttr('change', 'editRelationshipEdge', e.id, 'status', "$el")} aria-label="status">${RELATIONSHIP_STATUS.map(s => `<option value="${s}"${s===e.status?' selected':''}>${s}</option>`).join("")}</select></label>
      </div>
      ${text(e, 'obligation', 'What they owe the other')}
      ${text(e, 'knows', 'What they know about the other')}
      ${text(e, 'wants', 'What they want from the other')}
      ${text(e, 'conceals', 'What they hide from the other')}
      ${text(e, 'notes', 'Anything else')}
    </div>`;
  }).join("");
  renderRelWeb();
}
/* Generate a cast member INTO a role opposite the character in selector A. */
function generateForRole(){
  const ka = strVal('relA', '');
  const anchor = getCharByKey(ka);
  if (!anchor){ toast("Pick a character in the A slot first.", "warn"); return; }
  const roleId = strVal('relRole', '');
  const role = relationshipRole(roleId);
  if (!role){ toast("Pick a role for the new member.", "warn"); return; }
  const anchorId = anchor.id || null;
  const seed = resolveSeed("");
  const src = {};
  /* A slot carries an unsigned target (1..5) and the resolved category carries the
     sign, so the slider value is recovered from the pair rather than from `target`
     alone — which would have read every axis as leaning high. */
  PERSONALITY_AXES.forEach(a=>{
    const s2 = anchor.state["pers_"+a.id];
    const cat = s2 && s2.trait ? s2.trait.category : null;
    const mag = Math.round(clamp((s2 && s2.target) || 0, 0, 5) * 20);
    src[a.id] = cat === a.pos ? mag : cat === a.neg ? -mag : 0;
  });
  let variants = null, st;
  withRng(mulberry32(seed.num), ()=>{
    const overrides = roleOverridesFor(src, roleId, rand);
    const forcedProfileCats = Object.assign({}, role.profile || {});
    st = withoutContextBias(()=> withSpeculativeGeneration(()=> withCharacterVariants(()=> {
      const built = finalizeSheet(buildCharacterState({
        verbLevel: (rand()*4)-2, regLevel: (rand()*4)-2, compLevel: (rand()*4)-2,
        mannerCount: intVal('mannerCount', 3), vocabCount: intVal('vocabCount', 2),
        rarityPref: rarityPrefVal(), vocabPref:null, personalityOverrides: overrides, forcedProfileCats,
      }), {rarityPref: rarityPrefVal(), applyPins:false});
      variants = Object.assign({}, charVariants);
      return built;
    })));
  });
  const entry = castEntry(st, variants, {name: `${role.label} of ${anchor.meta.name || "the character"}`, age:"", context:`Generated as the ${role.label.toLowerCase()} of ${anchor.meta.name || "the character"}`, archetypeLabel:"Cast member (" + role.label + ")", seed: seed.label});
  castStates.push(entry);
  if (anchorId){
    const d = edgeDefaults(entry.state, anchor.state, roleId);
    relationshipEdges.push(makeEdge(entry.id, anchorId, roleId, d));
  }
  renderCast();
  refreshRelSelectors();
  renderEdges();
  toast(`Added ${entry.meta.name}${anchorId ? " with an edge back to " + anchor.meta.name : " (add the anchor to the cast to record the edge)"}.`, "ok", 5000);
}
/* The cast file, as an object: exportCastJSON writes it, importCastJSON reads it, and
   the test suite round-trips it without a browser. */
function castBundle(){
  return {
    format: "character-voice-cast", version: CAST_FORMAT_VERSION,
    exported: new Date().toISOString(),
    seed: lastCastSeed || null,
    members: castStates.map(c=>({id: c.id, state: c.state, meta: c.meta, variants: c.variants || null})),
    edges: pruneEdges(relationshipEdges, castStates),
  };
}
function applyCastBundle(p){
  if (p.format !== "character-voice-cast") throw new Error("Not a cast file.");
  if (!Array.isArray(p.members)) throw new Error("The `members` block is not a list.");
  let orphans = 0;
  const relink = st => { if (!st) return st;
    Object.values(st).forEach(s2=>{
      if (s2 && s2.trait){ const live = TRAITS_BY_ID.get(s2.trait.id); if (live) s2.trait = live; else orphans++; }
    }); return st; };
  const next = p.members.map((m, i)=>{
    validateSheetPayload({state: m.state, charMeta: m.meta});
    return {id: (typeof m.id === 'string' && m.id) ? m.id : newCharacterId(),
            state: relink(m.state || {}), variants: m.variants || null,
            meta: m.meta || {name: "Character " + (i+1), age:"", context:"", archetypeLabel:"Imported"}};
  });
  const edges = Array.isArray(p.edges) ? p.edges : [];
  const bad = edges.map(validateEdge).filter(x => x.length);
  if (bad.length) throw new Error("Bad edge: " + bad[0][0]);
  castStates = next;
  relationshipEdges = pruneEdges(edges.map(e => makeEdge(e.from, e.to, e.role, e)), next);
  lastCastSeed = p.seed || lastCastSeed;
  return {orphans, dropped: edges.length - relationshipEdges.length};
}

// ================= ARC PANEL =================
/* `arcBase` is the sheet as generated; `state` is always the replayed result, so the
   cards on screen are the character as of the last accepted change. Declining a change
   or removing an event replays from the base rather than trying to invert an edit. */
let arcBase = null;
let arcEvents = [];
/* Sheet edits made while an arc is open — a reroll, a pin, a lock — are not arc events,
   and replaying from `arcBase` used to throw them away the moment a change was accepted
   or declined. The replay now remembers what it produced last (`arcLastReplay`); any
   slot that differs from it on the next replay is the author's edit and is laid back
   over the replayed sheet (`arcOverrides`). Deciding an arc change on a slot hands that
   slot back to the arc. */
let arcOverrides = {};
let arcLastReplay = null;
function _arcCaptureEdits(){
  const ref = arcLastReplay || arcBase;
  if (!ref) return;
  Object.keys(state || {}).forEach(k => {
    if (JSON.stringify(state[k]) !== JSON.stringify(ref[k])) arcOverrides[k] = JSON.parse(JSON.stringify(state[k]));
  });
}
function arcReplay(releaseSlot){
  if (!arcBase) return;
  _arcCaptureEdits();
  if (releaseSlot) delete arcOverrides[releaseSlot];
  const replayed = replayArc(arcBase, arcEvents);
  arcLastReplay = JSON.parse(JSON.stringify(replayed));
  Object.entries(arcOverrides).forEach(([k, v]) => { if (replayed[k]) replayed[k] = JSON.parse(JSON.stringify(v)); });
  state = replayed;
  charMeta.arc = arcSummary(arcEvents);
  renderSheet();
  renderArc();
}
function resetArc(keepBase){
  arcEvents = [];
  arcOverrides = {};
  arcLastReplay = null;
  arcBase = keepBase ? arcBase : (Object.keys(state).length ? JSON.parse(JSON.stringify(state)) : null);
  if (charMeta) delete charMeta.arc;
}
async function addArcEvent(){
  if (!Object.keys(state).length){ toast("Generate a character first — an arc happens to someone.", "warn"); return; }
  if (!arcBase) arcBase = JSON.parse(JSON.stringify(state));
  const title = await askForName("What happened?", "");
  if (title === null) return;
  const shape = strVal('arcShape', 'growth');
  const ev = makeArcEvent(arcEvents.length + 1, {title, shape, at: new Date().toISOString()});
  ev.changes = proposeArcChanges(state, ev, arcEvents);
  arcEvents.push(ev);
  renderArc();
  toast(ev.changes.length
    ? `Event added with ${ev.changes.length} proposed change${ev.changes.length===1?'':'s'} — accept the ones you want.`
    : `Event added. ${shape === 'steadfast' ? "Steadfast: fill in the cost — it becomes the Price, and their Values deepen." : "Nothing on this sheet moved for it."}`, "ok", 6000);
}
/* Section 6: a multi-step template becomes ordinary events with proposals. */
function applyArcTemplate(){
  if (!Object.keys(state).length){ toast("Generate a character first — an arc happens to someone.", "warn"); return; }
  const id = strVal('arcTemplate', '');
  if (!id){ toast("Pick a template first.", "warn"); return; }
  if (!arcBase) arcBase = JSON.parse(JSON.stringify(state));
  const evs = arcTemplateEvents(state, id, arcEvents);
  evs.forEach(ev => { ev.at = new Date().toISOString(); arcEvents.push(ev); });
  renderArc();
  toast(`${evs.length} events added from “${(ARC_TEMPLATES.find(t => t.id === id) || {}).label}”. Accept the changes you want, step by step.`, "ok", 6000);
}
function editArcEvent(id, field, el){
  const e = arcEvents.find(x => x.id === id);
  if (!e || !el) return;
  if (field === 'shape' || field === 'beliefChallenged' || field === 'choice' || field === 'cost'){
    // Section 6: the belief/choice/cost text is read against the sheet, so editing it
    // is a new proposal too (arcTextChanges in mechanics.js).
    if (field === 'shape') e.shape = ARC_SHAPE_IDS.includes(el.value) ? el.value : 'growth';
    else e[field] = String(el.value || "").slice(0, 600);
    // A new shape is a different proposal, and only unaccepted changes are re-proposed:
    // a change the author has already taken is theirs, not the shape's.
    const kept = (e.changes || []).filter(c => c.accepted);
    e.changes = kept.concat(proposeArcChanges(replayArc(arcBase, arcEvents.filter(x => x.seq < e.seq)), e, arcEvents.filter(x => x.seq < e.seq))
      .filter(c => !kept.some(k => k.slotId === c.slotId)));
    arcReplay();
    return;
  }
  e[field] = String(el.value || "").slice(0, 600);
  const s = document.getElementById('arcStamp');
  if (s) s.textContent = arcSummary(arcEvents).line;
}
function setArcChange(eventId, slotId, accepted){
  const e = arcEvents.find(x => x.id === eventId);
  const c = e && (e.changes || []).find(x => x.slotId === slotId);
  if (!c) return;
  c.accepted = !!accepted;
  arcReplay(slotId);
}
async function removeArcEvent(id){
  const e = arcEvents.find(x => x.id === id);
  if (!e) return;
  if (!await askForConfirm(`Undo "${e.title || 'event ' + e.seq}"? The arc replays from the original sheet without it.`, "Undo")) return;
  arcEvents = arcEvents.filter(x => x.id !== id);
  arcEvents.forEach((x, i) => { x.seq = i + 1; });
  arcReplay();
  toast("Event undone; the arc was replayed without it.");
}
function renderArc(){
  const host = document.getElementById('arcBody');
  if (!host) return;
  const panel = document.getElementById('arcPanel');
  if (panel) panel.style.display = Object.keys(state).length ? "block" : "none";
  const stamp = document.getElementById('arcStamp');
  if (stamp) stamp.textContent = arcSummary(arcEvents).line;
  const tsel = document.getElementById('arcTemplate');
  if (tsel && tsel.options.length <= 1 && typeof ARC_TEMPLATES !== 'undefined'){
    tsel.innerHTML = `<option value="">Arc template…</option>` + ARC_TEMPLATES.map(t => `<option value="${escHTML(t.id)}" title="${escAttr(t.blurb)}">${escHTML(t.label)} (${t.steps.length})</option>`).join("");
  }
  const sel = document.getElementById('arcShape');
  if (sel && !sel.options.length){
    sel.innerHTML = ARC_SHAPES.map(s => `<option value="${escHTML(s.id)}" title="${escAttr(s.blurb)}">${escHTML(s.label)}</option>`).join("");
  }
  const field = (e, k, label, ph) => `<label class="edgeField"><span>${label}</span><input type="text" value="${escAttr(e[k] || "")}" placeholder="${escAttr(ph)}" ${actAttr('change', 'editArcEvent', e.id, k, "$el")}></label>`;
  host.innerHTML = arcEvents.slice().sort((a,b)=>a.seq-b.seq).map(e => {
    const changes = (e.changes || []).map(c => {
      const from = TRAITS_BY_ID.get(c.fromId), to = TRAITS_BY_ID.get(c.toId);
      return `<div class="arcChange${c.accepted ? ' accepted' : ''}">
        <div><b>${escHTML(from ? from.trait : String(c.fromId))}</b> → <b>${escHTML(to ? to.trait : String(c.toId))}</b></div>
        <div class="sub">${escHTML(c.why)}</div>
        <div class="actionRow">
          <button class="btn-secondary" ${actAttr('click', 'setArcChange', e.id, c.slotId, true)} aria-pressed="${c.accepted}">${c.accepted ? 'accepted' : 'accept'}</button>
          <button class="btn-secondary" ${actAttr('click', 'setArcChange', e.id, c.slotId, false)} aria-pressed="${!c.accepted}">${c.accepted ? 'undo' : 'declined'}</button>
        </div>
      </div>`;
    }).join("");
    return `<div class="arcEvent">
      <div class="arcHead"><span class="arcSeq">${e.seq}</span> <b>${escHTML(e.title || "Untitled event")}</b>
        <select ${actAttr('change', 'editArcEvent', e.id, 'shape', "$el")} aria-label="Arc shape">${ARC_SHAPES.map(s=>`<option value="${s.id}"${s.id===e.shape?' selected':''}>${escHTML(s.label)}</option>`).join("")}</select>
        <button class="savedAct savedDel" ${actAttr('click', 'removeArcEvent', e.id)} aria-label="Undo this event">undo</button></div>
      ${field(e, 'beliefChallenged', 'belief', 'Which belief this tested')}
      ${field(e, 'choice', 'choice', 'What they chose to do')}
      ${field(e, 'cost', 'cost', 'What it cost them')}
      ${(() => { const r = typeof arcReadingLine === 'function' ? arcReadingLine(replayArc(arcBase, arcEvents.filter(x => x.seq < e.seq)), e) : ""; return r ? `<div class="sub arcReading">${escHTML(r)}</div>` : ``; })()}
      ${changes || `<div class="sub">${e.shape === 'steadfast' ? "Steadfast — name the cost: it becomes the Price they pay, and the line they held deepens." : "No changes proposed."}</div>`}
    </div>`;
  }).join("") || `<div class="sub">No events yet.</div>`;
}

// ================= VOICE LAB PANEL =================
/* Seven prompts, composed from the sheet's own voice rules — see composeVoiceLine.
   The cast view gets the same prompt across every member so a shared device is
   visible as a shared device rather than as a coincidence. */
let voiceLabMode = 'baseline';
let voiceLabReroll = 0;   // "another take" — joins the line seed, see composeVoiceLine
function setVoiceLabMode(mode){
  voiceLabMode = VOICE_MODES.includes(mode) ? mode : 'baseline';
  renderVoiceLab();
  renderVoiceCompare();
}
function renderVoiceLab(){
  const host = document.getElementById('voiceLabBody');
  if (!host) return;
  renderVoicePromptForm();
  const aud = document.getElementById('voiceAudience');
  if (aud && !aud.options.length){ aud.innerHTML = VOICE_AUDIENCES.map(x => `<option value="${escHTML(x.id)}">${escHTML(x.label)}</option>`).join(""); }
  const panel = document.getElementById('voiceLabPanel');
  const has = Object.keys(state).length > 0;
  if (panel) panel.style.display = has ? "block" : "none";
  if (!has){ host.innerHTML = ""; return; }
  ['baseline','pressure'].forEach(m=>{
    const btn = document.getElementById('vlMode_' + m);
    if (btn){ btn.classList.toggle('active', voiceLabMode === m); btn.setAttribute('aria-pressed', voiceLabMode === m); }
  });
  host.innerHTML = voiceLab(state, voiceLabMode, voiceLabReroll, charMeta).map(l => `
    <div class="voiceCard${l.user ? ' userPrompt' : ''}">
      <div class="voiceHead"><b>${escHTML(l.prompt)}</b> <span class="sub">${escHTML(l.setup)}</span>${l.user
        ? ` <button class="savedAct savedDel" ${actAttr('click', 'removeVoicePrompt', l.promptId)} aria-label="Remove the prompt ${escAttr(l.prompt)}">remove</button>` : ``}</div>
      <blockquote class="voiceLine">${escHTML(l.text)}</blockquote>
      <div class="sub vlStats">${(rs => `${rs.words} word${rs.words === 1 ? '' : 's'} · reads at grade ${rs.grade}`)(readingStats(l.text))}
        <button type="button" class="savedAct" ${actAttr('click', 'copyVoiceLine', l.promptId, '$el')}>copy line</button></div>
      <div class="sub">Shaped by: ${escHTML(l.rules.join("; ") || "nothing on this sheet")}${l.device ? ` · habitual device: <b>${escHTML(l.device.label)}</b>` : ``}</div>
      <button class="btn-secondary vlTen" ${actAttr('click', 'toggleVoiceTen', l.promptId)} aria-expanded="${voiceTenOpen === l.promptId ? 'true' : 'false'}">${voiceTenOpen === l.promptId ? 'Hide the 10 lines' : '10 lines'}</button>
      ${voiceTenOpen === l.promptId ? `<ol class="vlTenList">${voiceLines(state, l.promptId, voiceLabMode, 10, voiceLabReroll, charMeta).map(x => `<li>${escHTML(x.text)}</li>`).join("")}</ol>` : ``}
    </div>`).join("");
  renderVoiceAids();
}
/* Hot buttons and lexicon, under the lab's lines. */
function renderVoiceAids(){
  const host = document.getElementById('voiceAids');
  if (!host) return;
  if (!Object.keys(state).length || typeof hotButtons !== 'function'){ host.innerHTML = ""; return; }
  const hb = hotButtons(state), lex = lexiconFor(state);
  const list = items => items.length ? `<ul class="vlAidList">${items.map(x => `<li>${escHTML(x.topic)} <span class="sub">${escHTML(x.from)}</span></li>`).join("")}</ul>` : `<div class="sub">Nothing on the sheet says.</div>`;
  const words = items => items.length ? `<ul class="vlAidList">${items.map(x => `<li>“${escHTML(x)}”</li>`).join("")}</ul>` : `<div class="sub">Nothing distinctive yet.</div>`;
  host.innerHTML = `<div class="vlAids">
    <div class="vlAid"><h3>Lights them up</h3>${list(hb.lights)}</div>
    <div class="vlAid"><h3>Shuts them down</h3>${list(hb.shuts)}</div>
    <div class="vlAid"><h3>Words they lean on</h3>${words(lex.overused)}</div>
    <div class="vlAid"><h3>Words they would not say</h3>${words(lex.never)}</div></div>`;
}
function runVoiceFit(){
  const host = document.getElementById('voiceFitResult');
  if (!host) return;
  if (!Object.keys(state).length){ host.innerHTML = `<div class="sub">Generate a character first.</div>`; return; }
  const res = voiceFitCheck(state, strVal('voiceFitText', ''));
  host.innerHTML = `<div class="charMeta">${escHTML(res.summary)}</div>` + res.checks.map(c => `<div class="vlFit vlFit-${escAttr(c.verdict)}"><b>${escHTML(c.label)}</b> <span class="vlFitTag">${escHTML(c.verdict)}</span> <span class="sub">${escHTML(c.note)}</span></div>`).join("");
}
/* The "10 lines" view (audit §5): ten composed takes of one situation, so the range of
   a voice is visible rather than one sample of it. One prompt open at a time. */
let voiceTenOpen = null;
function toggleVoiceTen(promptId){
  voiceTenOpen = voiceTenOpen === promptId ? null : promptId;
  renderVoiceLab();
}

/* ---- Lenses (audit §5): setting / culture / life stage, combinable ----
   The chips write a comma list into #lensSelect, which is what the engine reads
   (activeLensIds) and what captureSettings saves. */
function renderLensPicker(){
  const host = document.getElementById('lensPicker');
  if (!host || typeof LENSES === 'undefined') return;
  const on = new Set(activeLensIds());
  const chip = l => `<button type="button" class="lensChip${on.has(l.id) ? ' on' : ''}" aria-pressed="${on.has(l.id)}" ${actAttr('click', 'toggleLens', l.id)}
      title="${escAttr((l.up || []).slice(0, 3).join(', ') + (l.taboo && l.taboo.length ? ' · taboo: ' + l.taboo.join(', ') : ''))}">${escHTML(l.label)}</button>`;
  host.innerHTML = `<span class="lensGroup"><span class="lensKind">Setting</span>${LENSES.filter(l => l.kind === 'setting').map(chip).join('')}</span>`
    + `<span class="lensGroup"><span class="lensKind">Life stage</span>${LENSES.filter(l => l.kind === 'life').map(chip).join('')}</span>`
    + (on.size ? `<button type="button" class="lensClear" ${actAttr('click', 'clearLenses')} title="Turn every lens off">Clear</button>` : ``)
    + (on.size ? `<span class="sub lensTaboo">Off-limits in their lines: ${escHTML(lensTaboos().join(', ') || 'nothing')}</span>` : ``);
}
function clearLenses(){
  const el = document.getElementById('lensSelect');
  if (!el) return;
  el.value = '';
  renderLensPicker();
  if (typeof onSliderChange === 'function') onSliderChange();
}
function toggleLens(id){
  const el = document.getElementById('lensSelect');
  if (!el || !lensById(id)) return;
  const cur = new Set(activeLensIds());
  if (cur.has(id)) cur.delete(id); else cur.add(id);
  el.value = LENS_IDS.filter(x => cur.has(x)).join(',');
  renderLensPicker();
  if (typeof onSliderChange === 'function') onSliderChange();
}
function renderVoiceCompare(){
  const host = document.getElementById('voiceCompareBody');
  if (!host) return;
  const sel = document.getElementById('voiceComparePrompt');
  const prompts = allVoicePrompts();
  if (sel && sel.options.length !== prompts.length){
    const keep = sel.value;
    sel.innerHTML = prompts.map(p => `<option value="${escHTML(p.id)}">${escHTML(p.label)}</option>`).join("");
    if (prompts.some(p => p.id === keep)) sel.value = keep;
  }
  renderVoiceHeatmap();
  if (!castStates.length){ host.innerHTML = `<div class="sub">Generate a cast to compare voices.</div>`; return; }
  const cmp = voiceComparison(castStates, strVal('voiceComparePrompt', 'refuse'), voiceLabMode, voiceLabReroll);
  host.innerHTML = `<div class="sub" data-st="margin-bottom:8px;">${escHTML(cmp.note)}</div>` + cmp.rows.map(r => `
    <div class="voiceCard">
      <div class="voiceHead"><b>${escHTML(r.name)}</b></div>
      <blockquote class="voiceLine">${escHTML(r.line.text)}</blockquote>
      <div class="sub">${r.line.rules.map(rule => r.shared.includes(rule)
        ? `<span class="sharedDevice" title="More than one character in this cast reaches for this">${escHTML(rule)}</span>`
        : escHTML(rule)).join("; ") || "nothing"}</div>
    </div>`).join("");
}
// One line, without the stage direction's brackets stripped: what the character would say, as composed.
function copyVoiceLine(promptId, btnEl){
  const l = voiceLab(state, voiceLabMode, voiceLabReroll, charMeta).find(x => x.promptId === promptId);
  if (!l){ toast("That line is no longer on the page.", "warn"); return; }
  copyText(l.text, btnEl);
}
function copyVoiceLab(btnEl){
  if (!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  copyText(`# Voice lab — ${charMeta.name || "Unnamed Character"} (${voiceLabMode})\n\n` + voiceLabToMarkdown(state, voiceLabMode, voiceLabReroll, charMeta), btnEl);
}
function rerollVoiceLab(){
  voiceLabReroll++;
  renderVoiceLab();
  renderVoiceCompare();
  if (typeof srAnnounce === 'function') srAnnounce(`Voice lab, take ${voiceLabReroll + 1}.`);
}

/* ---- Author prompts, saved with the project ---- */
function _projectFieldSave(field, value){
  const p = currentProject();
  if (!p) return false;
  p[field] = value;
  saveProject(p).catch(e => console.error('[project] save failed', e));
  return true;
}
function addVoicePrompt(){
  const label = strVal('vlNewLabel', '').trim();
  if (!label){ toast("Name the situation first — e.g. \"Turning down the captain\".", "warn"); return; }
  const next = setUserVoicePrompts(getUserVoicePrompts().concat([{label, setup: strVal('vlNewSetup', ''), like: strVal('vlNewLike', 'request')}]));
  setVal('vlNewLabel', ''); setVal('vlNewSetup', '');
  const kept = _projectFieldSave('voicePrompts', next.map(p => ({id:p.id, label:p.label, setup:p.setup, like:p.like})));
  renderVoiceLab(); renderVoiceCompare();
  toast(kept ? `Added "${label}" to this project's voice lab.` : `Added "${label}" for this session — create a project to keep it.`, "ok", 5000);
}
function removeVoicePrompt(id){
  const next = setUserVoicePrompts(getUserVoicePrompts().filter(p => p.id !== id));
  _projectFieldSave('voicePrompts', next.map(p => ({id:p.id, label:p.label, setup:p.setup, like:p.like})));
  renderVoiceLab(); renderVoiceCompare();
}
function renderVoicePromptForm(){
  const sel = document.getElementById('vlNewLike');
  if (sel && !sel.options.length) sel.innerHTML = VOICE_PROMPTS.map(p => `<option value="${escHTML(p.id)}">like ${escHTML(p.label.toLowerCase())}</option>`).join("");
}

/* ---- Retire for this project ---- */
function retireTrait(id){
  const t = TRAITS_BY_ID.get(id);
  if (!t) return;
  const now = new Set(getRetiredTraits());
  const on = !now.has(id);
  if (on) now.add(id); else now.delete(id);
  setRetiredTraits([...now]);
  const kept = _projectFieldSave('retired', [...now]);
  toast(on ? `"${t.trait}" is retired${kept ? ' for this project' : ' for this session (no project open)'} — new builds favour the candidate that uses fewest retired traits; never banned.`
           : `"${t.trait}" is back at full weight.`, "ok", 5000);
  if (typeof withPreservedFocus === 'function') withPreservedFocus(()=>{ renderSheet(); }); else renderSheet();
}
/* Project-scoped preferences follow the current project: switching projects swaps the
   retired set and the author prompts, and no project means none of either. */
function applyProjectPreferences(){
  const p = currentProject();
  setRetiredTraits(p && Array.isArray(p.retired) ? p.retired : []);
  setUserVoicePrompts(p && Array.isArray(p.voicePrompts) ? p.voicePrompts : []);
  if (typeof renderVoiceLab === 'function') renderVoiceLab();
}

/* ---- Cast voice-collision heatmap and de-collide ---- */
function renderVoiceHeatmap(){
  const host = document.getElementById('voiceHeatmap');
  if (!host) return;
  if (castStates.length < 2){ host.innerHTML = ""; return; }
  const m = voiceCollisionMatrix(castStates, voiceLabMode, voiceLabReroll);
  const cell = (i, j) => {
    if (i === j) return `<td class="hmSelf" aria-label="same character">—</td>`;
    const v = m.matrix[i][j], heat = m.max ? v / m.max : 0;
    const tip = m.shared[i][j].slice(0, 6).join("; ") || "nothing shared";
    return `<td class="hmCell" data-st="--heat:${heat.toFixed(2)}" title="${escAttr(tip)}">${v}</td>`;
  };
  host.innerHTML = `<div class="tensionTitle" data-st="margin:0 0 6px;">Voice collisions across every prompt</div>
    <div class="hmWrap"><table class="heatmap"><thead><tr><th></th>${m.names.map(n => `<th scope="col">${escHTML(n)}</th>`).join("")}</tr></thead>
    <tbody>${m.names.map((n, i) => `<tr><th scope="row">${escHTML(n)}</th>${m.names.map((_, j) => cell(i, j)).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="actionRow" data-st="margin-top:8px;">
      <button class="btn-secondary" id="deCollideBtn" ${actAttr('click', 'deCollideCast')} ${m.worst < 0 ? 'disabled' : ''}>De-collide${m.worst >= 0 ? ` (reroll ${escHTML(m.names[m.worst])})` : ''}</button>
      <span class="sub">${m.worst >= 0 ? `${escHTML(m.names[m.worst])} shares the most devices (${m.totals[m.worst]}).` : 'No two members share a device.'}</span>
    </div>`;
}
/* Reroll the member with the largest collision total, keeping their name and axis
   posture, and keep the reroll only if it lowers the cast's total — a few seeded
   attempts, never a worse ensemble than before. */
function deCollideCast(){
  if (castStates.length < 2){ toast("Generate a cast of two or more first.", "warn"); return; }
  const before = voiceCollisionMatrix(castStates, voiceLabMode, voiceLabReroll);
  const i = before.worst;
  if (i < 0){ toast("Nobody in this cast shares a device — nothing to de-collide."); return; }
  const sum = mm => mm.totals.reduce((a, b) => a + b, 0);
  const target = castStates[i];
  const prof = axisProfile(target.state);
  const rarityPref = rarityPrefVal();
  let best = null, bestSum = sum(before);
  withoutContextBias(()=> withSpeculativeGeneration(()=>{
    for (let attempt = 0; attempt < 6; attempt++){
      withRng(mulberry32(hashSeedString(target.id + '|decollide|' + attempt + '|' + voiceLabReroll)), ()=>{
        const personalityOverrides = {};
        PERSONALITY_AXES.forEach(a => { personalityOverrides[a.id] = Math.round(clamp((prof[a.id] || 0) * 50, -100, 100)); });
        rollCharacterVariants();
        const cand = finalizeSheet(buildCharacterState({verbLevel: randomAxisLevel(), regLevel: randomAxisLevel(), compLevel: randomAxisLevel(),
          mannerCount: intVal('mannerCount', 3), vocabCount: intVal('vocabCount', 2), rarityPref, vocabPref: null, personalityOverrides}),
          {rarityPref, applyPins: false});
        const trial = castStates.map((c, j) => j === i ? Object.assign({}, c, {state: cand}) : c);
        const s2 = sum(voiceCollisionMatrix(trial, voiceLabMode, voiceLabReroll));
        if (s2 < bestSum){ bestSum = s2; best = {state: cand, variants: Object.assign({}, charVariants)}; }
      });
    }
  }));
  if (!best){ toast(`Could not find a version of ${target.meta.name} that collides less — try another take.`, "warn", 5000); return; }
  const restore = _castSnapshot();
  castStates[i] = Object.assign({}, target, {state: best.state, variants: best.variants});
  relationshipEdges = pruneEdges(relationshipEdges, castStates);
  renderCast(); renderVoiceCompare(); refreshRelSelectors();
  toastUndo(`Rerolled ${target.meta.name}: shared devices ${sum(before)} → ${bestSum}.`, ()=>{ restore(); renderCast(); renderVoiceCompare(); });
}

/* ---- Arc timeline export with a pressure-sheet diff per event ---- */
function _pressureSig(ps){
  const out = {};
  Object.keys(ps || {}).forEach(k => { const x = ps[k]; if (x && x.trait) out[k] = {id: x.trait.id, name: x.trait.trait, label: x.label || k}; });
  return out;
}
function pressureSheetDiff(a, b){
  const A = _pressureSig(a), B = _pressureSig(b), rows = [];
  new Set(Object.keys(A).concat(Object.keys(B))).forEach(k => {
    const x = A[k], y = B[k];
    if (x && y && x.id === y.id) return;
    rows.push({slotId: k, from: x ? x.name : null, to: y ? y.name : null, label: (y || x).label});
  });
  return rows;
}
function arcTimeline(){
  if (!arcBase || !arcEvents.length) return [];
  const verb = rawToLevel(intVal('verbositySlider', 0)), reg = rawToLevel(intVal('registerSlider', 0));
  const manners = intVal('mannerCount', 3), rp = rarityPrefVal();
  const events = arcEvents.slice().sort((a, b) => a.seq - b.seq);
  const pressureFor = (st, key) => {
    let ps = null;
    withSpeculativeGeneration(()=> withRng(mulberry32(hashSeedString('arc-pressure|' + key)), ()=>{
      ps = buildStressVariant(verb, reg, manners, rp, st);
    }));
    return ps;
  };
  // Every step uses the SAME sub-stream key, so a slot moves in the diff because the
  // sheet under it moved, not because the dice were rolled again.
  let prev = pressureFor(arcBase, 'base');
  return events.map(e => {
    const st = replayArc(arcBase, events.filter(x => x.seq <= e.seq));
    const ps = pressureFor(st, 'base');
    const row = {seq: e.seq, title: e.title || 'Untitled event', shape: e.shape, belief: e.beliefChallenged || '', choice: e.choice || '', cost: e.cost || '',
      changes: (e.changes || []).filter(c => c.accepted).map(c => ({from: (TRAITS_BY_ID.get(c.fromId) || {}).trait || String(c.fromId), to: (TRAITS_BY_ID.get(c.toId) || {}).trait || String(c.toId)})),
      pressureDiff: pressureSheetDiff(prev, ps)};
    prev = ps;
    return row;
  });
}
function arcTimelineMarkdown(){
  const rows = arcTimeline();
  const L = [`# Arc timeline — ${charMeta.name || "Unnamed Character"}`, "", `_${arcSummary(arcEvents).line}_`, ""];
  rows.forEach(r => {
    L.push(`## ${r.seq}. ${r.title} (${r.shape})`, "");
    if (r.belief) L.push(`- Belief tested: ${r.belief}`);
    if (r.choice) L.push(`- Choice: ${r.choice}`);
    if (r.cost) L.push(`- Cost: ${r.cost}`);
    L.push(r.changes.length ? "- Sheet changes: " + r.changes.map(c => `${c.from} → ${c.to}`).join("; ") : "- Sheet changes: none accepted");
    L.push("", "Under pressure, after this event:");
    L.push(r.pressureDiff.length ? r.pressureDiff.map(d => `- ${d.label}: ${d.from || '(none)'} → ${d.to || '(none)'}`).join("\n") : "- no change to how they break", "");
  });
  return L.join("\n");
}
function exportArcTimeline(){
  if (!arcEvents.length){ toast("Add an arc event first.", "warn"); return; }
  const safe = String(charMeta.name || "character").replace(/[^a-z0-9_-]+/gi, "_").slice(0, 40);
  downloadText(arcTimelineMarkdown(), `${safe}_arc_timeline.md`);
}

// ================= CONTENT PACKS =================
/* The manifests have been in the engine since the schema pass; this is the control.
   Core can never be turned off — it is the bank, not a pack — and a pack that would
   empty the draw entirely is refused rather than silently producing blank slots. */
function refreshPackUI(){
  const grid = document.getElementById('packGrid');
  if (!grid || typeof TRAIT_PACKS === 'undefined') return;
  const off = new Set(getDisabledPacks());
  grid.innerHTML = TRAIT_PACKS.map(p=>{
    const n = TRAITS.filter(t=>t.pack === p.id).length;
    const core = p.id === 'core';
    return `<label class="packRow"><input type="checkbox" ${off.has(p.id) ? '' : 'checked'} ${core ? 'disabled' : ''}
      ${actAttr('change', 'onPackToggle', p.id, "$el")}> <b>${escHTML(p.id)}</b>
      <span class="sub">${n.toLocaleString()} traits${core ? ' · always on' : ''}</span></label>`;
  }).join("");
}
function onPackToggle(id, el){
  if (id === 'core'){ if (el) el.checked = true; return; }
  setPackEnabled(id, !!(el && el.checked));
  const left = TRAITS.filter(t=>isPackEnabled(t.pack)).length;
  if (!left){ setPackEnabled(id, true); if (el) el.checked = true; toast("That would leave nothing to draw from.", "warn"); return; }
  toast(`${el && el.checked ? "Enabled" : "Disabled"} pack "${id}" — ${left.toLocaleString()} traits in play. Generate again to see it.`, "ok", 5000);
  refreshPackUI();
}
function setAllPacks(on){
  TRAIT_PACKS.forEach(p=>{ if (p.id !== 'core') setPackEnabled(p.id, on); });
  refreshPackUI();
  toast(on ? "All packs enabled." : "Core pack only. Generate again to see it.");
}

// ================= PROJECT LIBRARY =================
/* Projects live under `project:<id>` beside the `character:<name>` saves. The current
   project is the one new saves, casts, edges and arc events are filed under; the loose
   saves stay exactly where they were, so nothing here breaks an existing library. */
let projects = [];
let currentProjectId = null;
const PROJECT_KEY = id => 'project:' + id;
function currentProject(){ return projects.find(p => p.id === currentProjectId) || null; }
async function loadProjects(){
  try {
    const res = await storage.list('project:');
    const keys = (res && res.keys) || [];
    const rows = await Promise.all(keys.map(async k => {
      try { return JSON.parse((await storage.get(k)).value); } catch(e){ return null; }
    }));
    projects = rows.filter(p => p && !validateProject(p).length);
    if (!projects.some(p => p.id === currentProjectId)) currentProjectId = projects.length ? projects[0].id : null;
  } catch(e){ projects = []; }
  applyProjectPreferences();
  renderProjects();
}
async function saveProject(p){
  p.updated = new Date().toISOString();
  await storage.set(PROJECT_KEY(p.id), JSON.stringify(p));
}
async function newProject(){
  const name = await askForName("Name this project:", "");
  if (!name) return;
  const p = makeProject(name);
  // A new project starts clean of the old one's retired traits, but keeps any author
  // prompts written before a project existed — that is usually why it was just created.
  p.voicePrompts = getUserVoicePrompts().map(x => ({id:x.id, label:x.label, setup:x.setup, like:x.like}));
  projects.push(p); currentProjectId = p.id;
  applyProjectPreferences();
  await saveProject(p);
  renderProjects();
  toast(`Project "${name}" created. Saves, casts and arcs now file under it.`, "ok", 5000);
}
async function switchProject(id){
  currentProjectId = id || null;
  applyProjectPreferences();
  renderProjects();
  const p = currentProject();
  if (p) toast(`Working in "${p.name}" — ${projectSummary(p)}.`, "ok", 5000);
}
async function renameProject(id){
  const p = projects.find(x => x.id === id);
  if (!p) return;
  const name = await askForName("Rename this project:", p.name);
  if (!name) return;
  p.name = name; await saveProject(p); renderProjects();
}
async function deleteProject(id){
  const p = projects.find(x => x.id === id);
  if (!p) return;
  const wasCurrent = currentProjectId === id;
  await storage.delete(PROJECT_KEY(id));
  projects = projects.filter(x => x.id !== id);
  if (wasCurrent) currentProjectId = projects.length ? projects[0].id : null;
  applyProjectPreferences();
  renderProjects();
  // Undo, not a confirm: the whole record is kept until the toast goes, so nothing is lost.
  toastUndo(`Deleted the project "${p.name}" (${projectSummary(p)}).`, async ()=>{
    await saveProject(p);
    if (!projects.some(x => x.id === id)) projects.push(p);
    if (wasCurrent) currentProjectId = id;
    applyProjectPreferences();
    renderProjects();
    toast(`"${p.name}" is back.`);
  }, 12000);
}
/* File the work in front of you into the current project: the sheet, the cast, the
   edges, the arc, the settings that produced them and the diversity archive. */
async function fileIntoProject(){
  const p = currentProject();
  if (!p){ toast("Create a project first.", "warn"); return; }
  if (!Object.keys(state).length){ toast("Generate or load a character first.", "warn"); return; }
  const name = charMeta.name && charMeta.name !== "Unnamed Character" ? charMeta.name : "Character " + (p.characters.length + 1);
  // Copies, not references: later edits to the open sheet must not rewrite what was filed.
  const _copy = v => JSON.parse(JSON.stringify(v));
  const record = {name, state: compressSlots(state), charMeta: _copy(charMeta),
    arcBase: arcBase ? compressSlots(arcBase) : null, arcEvents: _copy(arcEvents),
    savedAt: new Date().toISOString()};
  const at = p.characters.findIndex(c => c.name === name);
  if (at >= 0){
    if (!await askForConfirm(`"${name}" is already in this project. Replace it with what is on screen?`, "Replace")) return;
    p.characters[at] = record;
  } else p.characters.push(record);
  if (castStates.length) p.casts = [{name: "Cast", members: castStates.map(c => ({id: c.id, name: c.meta.name, state: compressSlots(c.state), meta: _copy(c.meta)}))}];
  p.edges = _copy(pruneEdges(relationshipEdges, castStates));
  p.events = _copy(arcEvents);
  p.settings = captureSettings();
  if (typeof exportArchive === 'function') p.archive = exportArchive();
  await saveProject(p);
  renderProjects();
  markWorkSaved();
  toast(`Filed "${name}" into "${p.name}" — ${projectSummary(p)}.`, "ok", 6000);
}
function renderProjects(){
  refreshProjectChip();
  const host = document.getElementById('projectList');
  if (!host) return;
  host.innerHTML = projects.length ? projects.map(p => `
    <div class="projectRow${p.id === currentProjectId ? ' current' : ''}">
      <button class="savedOpen" ${actAttr('click', 'switchProject', p.id)} title="Work in this project">
        <b>${escHTML(p.name)}</b><span>${escHTML(projectSummary(p))}${p.id === currentProjectId ? ' · current' : ''}</span></button>
      <button class="savedAct" ${actAttr('click', 'renameProject', p.id)}>rename</button>
      <button class="savedAct savedDel" ${actAttr('click', 'deleteProject', p.id)}>delete</button>
    </div>`).join("") : `<div class="sub">No projects yet. A project groups the characters, cast, relationships and arcs of one book or campaign, and is what a backup bundle carries.</div>`;
}

/* ---- Backup bundles ---- */
async function _looseCharacters(){
  const res = await storage.list('character:');
  const keys = (res && res.keys) || [];
  return (await Promise.all(keys.map(async k => {
    try { return {name: k.replace('character:', ''), record: JSON.parse((await storage.get(k)).value)}; }
    catch(e){ return null; }
  }))).filter(Boolean);
}
async function exportBackupBundle(){
  const loose = await _looseCharacters();
  const bundle = makeBackupBundle(projects, loose, {archive: (typeof exportArchive === 'function') ? exportArchive() : []});
  downloadText(JSON.stringify(bundle, null, 2), "character_backup.json");
  markBackedUp(); markWorkSaved();
  toast(`Backed up ${projects.length} project${projects.length===1?'':'s'} and ${loose.length} saved character${loose.length===1?'':'s'}.`, "ok", 6000);
}
let _pendingBackup = null;
function importBackupBundle(fileInput){
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    try {
      const bundle = JSON.parse(reader.result);
      const problems = validateBackupBundle(bundle);
      if (problems.length) throw new Error(problems[0]);
      const loose = await _looseCharacters();
      const preview = backupPreview(bundle, projects, loose);
      _pendingBackup = {bundle, preview};
      renderBackupPreview();
    } catch(e){ toast("Could not read that backup: " + e.message, "warn", 7000); }
    fileInput.value = "";
  };
  reader.readAsText(file);
}
function renderBackupPreview(){
  const host = document.getElementById('backupPreview');
  if (!host) return;
  if (!_pendingBackup){ host.innerHTML = ""; host.style.display = "none"; return; }
  const {preview} = _pendingBackup;
  const conflicts = preview.projects.conflict.concat(preview.characters.conflict);
  host.style.display = "block";
  host.innerHTML = `<div class="tensionTitle">Before anything is written</div>
    <div class="sub" data-st="margin:4px 0 8px;">${escHTML(mergeSummaryLine(preview))}</div>` +
    (conflicts.length ? `<div class="sub" data-st="margin-bottom:6px;">These already exist here and differ. Ticked means take the version in the file; unticked keeps what is on this machine.</div>` +
      conflicts.map(c => `<label class="packRow"><input type="checkbox" data-conflict="${escAttr(c.key)}"> <b>${escHTML(c.name)}</b> <span class="sub">the file's copy is ${escHTML(c.newer)}</span></label>`).join("")
      : `<div class="sub">Nothing here would be overwritten.</div>`) +
    `<div class="actionRow" data-st="margin-top:8px;">
      <button class="btn-primary" ${actAttr('click', 'applyBackupImport')}>Import</button>
      <button class="btn-secondary" ${actAttr('click', 'cancelBackupImport')}>Cancel</button>
    </div>`;
}
function cancelBackupImport(){ _pendingBackup = null; renderBackupPreview(); toast("Import cancelled; nothing was written."); }
async function applyBackupImport(){
  if (!_pendingBackup) return;
  const {preview} = _pendingBackup;
  const choices = {};
  document.querySelectorAll('#backupPreview [data-conflict]').forEach(el => {
    if (el.checked) choices[el.getAttribute('data-conflict')] = "theirs";
  });
  const loose = await _looseCharacters();
  const nextProjects = applyMerge(projects, preview.projects, choices);
  const nextChars = applyMerge(loose, preview.characters, choices);
  for (const p of nextProjects) await saveProject(p);
  for (const c of nextChars) await storage.set('character:' + c.name, JSON.stringify(c.record));
  if (Array.isArray(_pendingBackup.bundle.archive) && typeof importArchive === 'function') importArchive(_pendingBackup.bundle.archive);
  _pendingBackup = null;
  await loadProjects();
  await loadSavedList();
  renderBackupPreview();
  toast(`Imported. ${nextProjects.length} project(s) and ${nextChars.length} saved character(s) are now here.`, "ok", 6000);
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

/* The tab strip carries role="tablist" and manages tabindex, which is a PROMISE of
   Left/Right arrow navigation — and there was no key handler, so the promise was
   broken: a keyboard user reading the ARIA got behaviour that didn't exist. Home/End
   as well, since the pattern specifies them and they cost one line each. */
(function wireTabKeys(){
  const strip = document.querySelector('.tabs[role="tablist"]');
  if (!strip) return;
  strip.addEventListener('keydown', e=>{
    const keys = ['ArrowLeft','ArrowRight','Home','End'];
    if (!keys.includes(e.key)) return;
    const idx = TABS.findIndex(t=>{
      const b = document.getElementById(t.btn);
      return b && b.getAttribute('aria-selected') === 'true';
    });
    if (idx < 0) return;
    let next;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    e.preventDefault();
    switchTab(TABS[next].key);
    const btn = document.getElementById(TABS[next].btn);
    if (btn && btn.focus) btn.focus();
  });
})();

// ---------- live slider readouts + affinity preview ----------
// PERF FIX: the affinity preview + deterministic profile prediction walk the full
// weight matrix and category lists; running that on EVERY input event made slider
// drags stutter. Numeric readouts stay instant; the heavy preview coalesces to one
// trailing run ~80ms after the drag pauses.
let _previewTimer = null;
function onSliderChange(){
  // The active-rules strip reads the archetype, the seed field, the section toggles
  // and the profile-type selects, all of which change through this path.
  if (typeof refreshActiveRuleStrip === 'function') { try { refreshActiveRuleStrip(); } catch(e){} }
  invalidateSliderCache();
  updateSliderReadouts();
  if (_previewTimer) clearTimeout(_previewTimer);
  _previewTimer = setTimeout(updateHeavyPreview, 80);
}
/* Every range input has a visible <label for>, but a screen reader announces the VALUE
   as the bare number — "minus thirty-five" — which is exactly the part of these controls
   that means nothing on its own. The resolved word is already computed for the sighted
   readout; aria-valuetext puts the same word in the accessibility tree. */
const VOICE_SLIDER_WORDS = {
  verbositySlider: ["almost silent","terse","fairly terse","balanced","fairly voluble","voluble","torrential"],
  registerSlider:  ["very blunt","blunt","fairly plain","neutral","fairly formal","elaborate","highly ornate"],
  composureSlider: ["very steady","steady","fairly steady","mixed","somewhat volatile","volatile","highly erratic"],
};
function voiceSliderWord(id, raw){
  const words = VOICE_SLIDER_WORDS[id];
  if (!words) return String(raw);
  // -100..100 across seven bands, with the middle band covering the real neutral zone
  const idx = clamp(Math.round((raw + 100) / 200 * (words.length - 1)), 0, words.length - 1);
  return words[idx];
}
/* Range inputs in the mockups are drawn as a filled bar up to the thumb. CSS alone
   can't read a range's value, so each input carries its own --fill percentage and the
   track gradient is built from it. Called on every readout update and on input. */
function paintRangeFill(el){
  if (!el || el.type !== 'range') return;
  const min = parseFloat(el.min); const max = parseFloat(el.max);
  const span = (max - min) || 1;
  const pct = ((parseFloat(el.value) - min) / span) * 100;
  el.style.setProperty('--fill', Math.max(0, Math.min(100, pct)) + '%');
}
function paintRangeFills(root){
  (root || document).querySelectorAll('input[type=range]').forEach(paintRangeFill);
}
document.addEventListener('input', e => { if (e.target && e.target.type === 'range') paintRangeFill(e.target); }, true);

function setValueText(id, text){
  const el = document.getElementById(id);
  if (el && el.setAttribute) el.setAttribute('aria-valuetext', text);
}

function updateSliderReadouts(){
  const vRaw = intVal('verbositySlider', 0);
  const rRaw = intVal('registerSlider', 0);
  const cRaw = intVal('composureSlider', 0);
  // The dial reads as a word, the way the mockups show it — the raw number stays in
  // the tooltip and in aria-valuetext, where it is still exact but no longer the
  // loudest thing on the control.
  [['verbosityVal','verbositySlider',vRaw],['registerVal','registerSlider',rRaw],['composureVal','composureSlider',cRaw]]
    .forEach(([outId, sliderId, raw])=>{
      const out = document.getElementById(outId);
      if (!out) return;
      out.textContent = voiceSliderWord(sliderId, raw);
      out.title = String(raw);
    });
  paintRangeFills();
  [['verbositySlider',vRaw],['registerSlider',rRaw],['composureSlider',cRaw]].forEach(([id,raw])=>{
    setValueText(id, `${raw} — ${voiceSliderWord(id, raw)}`);
  });
  const dv = document.getElementById('divergence');
  if (dv){
    const v = parseFloat(dv.value) || 0;
    const word = v < 0.08 ? "never" : v < 0.3 ? "occasionally" : v < 0.6 ? "often" : "very often";
    setValueText('divergence', word);
    setText('divergenceVal', word);
  }
  /* The two anti-staleness defaults were invisible: divergence sits at 0.15 and "avoid
     recent traits" is on, both change every draw, and the second lives inside Tinker
     Mode where most users never look. State what is actually in force. */
  (function(){
    const note = document.getElementById('defaultsNote');
    if (!note) return;
    const bits = [];
    const d = parseFloat((document.getElementById('divergence')||{}).value);
    if (!Number.isNaN(d) && d > 0) bits.push(`about ${Math.round(d*100)}% of picks go against the grain`);
    const ar = document.getElementById('avoidRecentToggle');
    if (ar && ar.checked) bits.push("traits from your last few characters are penalised");
    note.textContent = bits.length ? "In force: " + bits.join("; ") + "." : "";
    note.title = "Both are adjustable — the first on the Surprise me dial above, the second under Tinker Mode.";
  })();
  const rf = document.getElementById('rangeFocus');
  if (rf){
    const v = parseFloat(rf.value);
    const word = v >= 0.75 ? "strictly" : v >= 0.45 ? "fairly strictly" : "loosely";
    setValueText('rangeFocus', "sliders decide " + word);
    setText('rangeFocusVal', word);
  }
  /* The three counts and Boost strength were the only controls in the app that weren't
     sliders-with-a-resolved-word — two <select>s and a bare number box in a page made
     entirely of dials. Same readout treatment as everything else now. */
  (function(){
    const el = document.getElementById('pressureLevel'), out = document.getElementById('pressureLevelVal');
    if (!el) return;
    const v = intVal(el, 100);
    const word = v <= 5 ? "barely rattled" : v < 35 ? "a bad hour" : v < 70 ? "a bad day" : v < 95 ? "a very bad day" : "the worst day";
    if (out) out.textContent = word;
    setValueText('pressureLevel', `${v} — ${word}`);
  })();
  (function(){
    const boost = document.getElementById('affinityBoost');
    const out = document.getElementById('affinityBoostVal');
    if (!boost) return;
    const v = parseFloat(boost.value);
    const word = v <= 0.01 ? "pure random" : v < 1.5 ? "sliders barely bite"
      : v < 4 ? "balanced" : v < 7 ? "sliders lead" : "sliders dictate";
    if (out) { out.textContent = word; out.title = String(v); }
    setValueText('affinityBoost', `${v} — ${word}`);
  })();
  [['mannerCount','mannerCountVal',n=>`${n} mannerism${n===1?'':'s'}`],
   ['vocabCount','vocabCountVal',n=>`${n} vocabulary trait${n===1?'':'s'}`]].forEach(([id,outId,fmt])=>{
    const el = document.getElementById(id), out = document.getElementById(outId);
    if (!el) return;
    const n = parseInt(el.value, 10) || 0;
    if (out) out.textContent = fmt(n);
    setValueText(id, fmt(n));
  });
  (function(){
    // The personality count silently drops axes, which the markup used to apologise for
    // in a tooltip. A live "N of 13 axes" readout says it on the control itself.
    const el = document.getElementById('personalityCount'), out = document.getElementById('personalityCountVal');
    if (!el) return;
    const n = parseInt(el.value, 10) || PERSONALITY_AXES.length;
    const total = PERSONALITY_AXES.length;
    const txt = n >= total ? `all ${total} axes` : `${n} of ${total} axes (the rest chosen at random each build)`;
    if (out) out.textContent = txt;
    setValueText('personalityCount', txt);
  })();
  PERSONALITY_AXES.forEach(axis=>{
    const el = document.getElementById('pers_'+axis.id);
    const out = document.getElementById('persVal_'+axis.id);
    if (el && out){
      const raw = parseInt(el.value, 10) || 0;
      out.textContent = raw + " · " + axisReadout(axis, raw);
      setValueText('pers_'+axis.id, `${raw} — ${axisReadout(axis, raw)}`);
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
        const raw = intVal(el, 0);
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
      return `${ps.label} → most likely <b>${chosen[ps.id]}</b> <span data-st="opacity:.65">(~${pct}%)</span>`;
    });
    if (parts.length) profLine = `<div data-st="margin-top:6px; padding-top:6px; border-top:1px dashed var(--border);"><b>Character Profile (predicted):</b><br>${parts.join("<br>")}<div class="sub" data-st="margin:6px 0 0;">A simplified conditional preview, not the generator's own probabilities: it takes the most likely category at each step and conditions the next on it, and it does not model the divergence dial's mixture or the archetype slider blend. Treat it as "where the settings point", not "how often this comes out".</div></div>`;
  } catch(e){}
  setHTML('affinityPreview',
    fmt(gBoost,"Grammar") + fmt(vBoost,"Vocabulary") + fmt(mBoost,"Mannerisms") + profLine);
  updateRangeReadout();
}

// Live explanation of what the three voice sliders are currently targeting, in the
// same units the trait cards use. Without this the new continuous range engine is
// invisible: you'd feel the difference between 35 and 45 but never see why.
/* The readout stated the numeric band and nothing else: "targets intensity 2.41,
   accepts 2.06–2.76" is precise and tells a novelist nothing about what will come out.
   All three of the missing pieces were already computed elsewhere — which pool the
   slider selects, and FREQ_BUDGET's plain-English frequency for an intensity. Join
   them, so the readout answers "what will this slider actually do". */
function budgetPhraseFor(target){
  const b = FREQ_BUDGET[clamp(Math.round(target), 1, 5)] || FREQ_BUDGET[3];
  return b.label;
}
// Which pool each voice slider resolves to at its current position. Mirrors the
// branch conditions in pickVerbositySlot / pickRegisterSlot rather than guessing.
function voicePoolNameFor(id, level){
  if (id === 'verbositySlider') return level <= -0.12 ? "Minimal & Ultra-Brief"
    : level >= 0.12 ? "High-Volume & Wordy (sometimes Repetitive & Circular)" : "Pacing & Situation-Driven";
  if (id === 'registerSlider') return level >= 0.12 ? "Stylized & Elaborate"
    : level <= -0.12 ? "Register & Formality Spectrum (informal end)" : "Register & Formality Spectrum";
  return null;   // composure drives grammar/mannerism weighting rather than one pool
}
function updateRangeReadout(){
  const box = document.getElementById('rangeReadout');
  if (!box) return;
  const half = bandHalf();
  const rows = [
    ['Verbosity','verbositySlider'], ['Register','registerSlider'], ['Composure','composureSlider']
  ].map(([label,id])=>{
    const rawSigned = intVal(id, 0);
    const raw = Math.abs(rawSigned);
    const t = targetFromMag(raw);
    const lo = Math.max(1, t - half).toFixed(2), hi = Math.min(5, t + half).toFixed(2);
    const pool = voicePoolNameFor(id, rawToLevel(rawSigned));
    const poolBit = pool ? ` draws from <b>${escHTML(pool)}</b>,` : ``;
    return `<div><b>${label}</b> at ${rawSigned}:${poolBit} targeting intensity <b>${t.toFixed(2)}</b> `
         + `— roughly "${escHTML(budgetPhraseFor(t))}" <span class="sub">(accepts ${lo}–${hi})</span></div>`;
  });
  const pw = document.getElementById('profileWeight');
  if (pw){
    const t = targetFromMag(parseInt(pw.value)||0);
    rows.push(`<div><b>Profile weight</b> at ${pw.value}: targeting intensity <b>${t.toFixed(2)}</b> `
            + `— roughly "${escHTML(budgetPhraseFor(t))}" across Motivation, Values, Role and the rest.</div>`);
  }
  rows.push(`<div class="sub" data-st="margin:6px 0 0;">Window half-width ${half.toFixed(2)} — narrower means the sliders dictate more tightly and results vary less.</div>`);
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
  if (!grid) return;   // container absent (embedded build, or a trimmed page)
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
        <div class="sliderLabelRow"><label for="pers_${axis.id}">${escHTML(axis.label)}</label>${sliderLockHTML('pers_' + axis.id, axis.label)}</div>
        <div class="sliderWrap"><span class="neutralBand" aria-hidden="true"></span><span class="blendBand" aria-hidden="true"></span>
        <input type="range" id="pers_${axis.id}" min="-100" max="100" value="0" step="1"
               ${actAttr('input', 'onSliderChange')} aria-label="${escHTML(axis.label)}: ${escHTML(lo)} to ${escHTML(hi)}"
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
/* "Personality" in the Generate row and "Include personality profile" in Advanced were two switches
   for the same thing (turning either off gave the same sheet). They are kept, because saved settings
   name both, but they now move together. */
function syncPersonalityToggles(source){
  const g = document.getElementById('genPersonality'), p = document.getElementById('personalityToggle');
  if (g && p){ if (source === 'gen') p.checked = g.checked; else g.checked = p.checked; }
  togglePersonalityPanel();
}
function togglePersonalityPanel(){
  const enabled = boolVal('personalityToggle', true);
  const grid = document.getElementById('personalitySlidersGrid');
  if (grid) grid.classList.toggle('disabled', !enabled);
}

function toggleExamples(){
  const show = boolVal('examplesToggle', true);
  document.body.classList.toggle('hide-examples', !show);
}

/* ================= STARTING POINTS =================
   First load showed every control and no character: a lot of dials and no reason to
   touch any of them. These are not a fourth kind of preset — each one just writes
   personality and voice sliders and then generates, exactly as if the user had moved
   them by hand, so what happens next is fully explorable rather than opaque. Kept to
   three, and deliberately not "hero / villain / mentor": the useful first move is a
   character with a tension in it. */
const STARTING_POINTS = {
  liar: {
    label: "A liar",
    voice: {verbositySlider: 30, registerSlider: 20, composureSlider: -10},
    pers: {honesty: -75, confidence: 40, friendliness: 45, emotionalcapacity: -35, intelligence: 35},
  },
  kindtired: {
    label: "Someone kind who is tired",
    voice: {verbositySlider: -35, registerSlider: -10, composureSlider: -25},
    pers: {friendliness: 65, agreeableness: 60, activeness: -60, positivity: -35, emotionalcapacity: 30, discipline: -20},
  },
  menace: {
    label: "A cheerful menace",
    voice: {verbositySlider: 55, registerSlider: -25, composureSlider: 45},
    pers: {positivity: 70, rebelliousness: 75, manners: -55, agreeableness: -40, activeness: 60, discipline: -50},
  },
};
function applyStartingPoint(key){
  const sp = STARTING_POINTS[key];
  if (!sp) return;
  // Every axis is written, not just the ones the preset names — otherwise a starting
  // point silently inherits whatever the previous one left behind on the axes it is
  // silent about, and the same button produces different characters.
  PERSONALITY_AXES.forEach(a=>{
    const el = document.getElementById('pers_'+a.id);
    if (el) el.value = sp.pers[a.id] !== undefined ? sp.pers[a.id] : 0;
  });
  Object.entries(sp.voice).forEach(([id,v])=>{ const el = document.getElementById(id); if (el) el.value = v; });
  const nameEl = document.getElementById('charName');
  if (nameEl && !nameEl.value) nameEl.placeholder = sp.label;
  invalidateSliderCache();
  onSliderChange();
  savePrefs();
  runGeneration();
  toast(`Started from "${sp.label}" — the sliders are set, so change anything and generate again.`);
}

/* ================= ONE SOURCE OF TRUTH FOR DEFAULTS =================
   BUG FIX: index.html and resetAllToDefaults disagreed about what "default" meant, on
   the three settings where it mattered most:

     control              index.html   resetAllToDefaults
     divergence           0.15         0
     avoidRecentToggle    checked      unchecked
     profileWeight        62           55

   The README, the help panel and a long comment block in engine.js all argue that
   shipping with the anti-staleness controls switched off was a mistake and that they
   now default ON — and then "Reset to Defaults" handed the user the maximally
   convergent configuration the codebase explicitly abandoned. A user chasing sameness
   who pressed Reset made it worse.

   Both the reset and the page's own initial state now read from this table, and a test
   asserts the markup agrees with it, so the two cannot drift apart again. */
const DEFAULTS = {
  fields: {
    verbositySlider: "0", registerSlider: "0", composureSlider: "0",
    mannerCount: "3", vocabCount: "2", personalityCount: "13", profileDepth: "1",
    rarityPref: "0", affinityBoost: "2.5", rangeFocus: "0.62",
    sheetDensity: "standard", wildcardCount: "1", pressureLevel: "100",
    profileWeight: "62", divergence: "0.15", castCount: "3",
    charName: "", charAge: "", charContext: "", archetypeSelect: "", seedInput: "",
    // Named here because #engineVersion is type=hidden: setting .value rewrites defaultValue, so
    // once one old save had been loaded, "defaultValue" was "1" and Reset restored engine 1.
    engineVersion: String(DEFAULT_ENGINE_V),
  },
  toggles: {
    // The anti-staleness pair ships ON. This is the whole point of the table.
    avoidRecentToggle: true, wildcardToggle: true,
    personalityToggle: true, examplesToggle: true,
    genPersonality: true, genSpeech: true, genVocab: true, genManner: true,
    compactToggle: false, stressToggle: false, depthFirstToggle: false,
    foilOpposeComposure: false,
  },
};

/* confirm() is unstyleable and blocked outright in some embedding contexts — where it
   returns false, so a delete silently no-ops and reads as a broken button. Same shape
   as askForName(): a real <dialog>, a promise, Escape cancels. */
function askForConfirm(message, confirmLabel){
  return new Promise(resolve=>{
    const dlg = document.createElement('dialog');
    dlg.className = 'nameDialog';
    dlg.innerHTML = `
      <form method="dialog">
        <label>${escHTML(message)}</label>
        <div class="nameDialogBtns">
          <button value="cancel" type="submit">Cancel</button>
          <button value="ok" type="submit" class="primary">${escHTML(confirmLabel || "OK")}</button>
        </div>
      </form>`;
    const opener = document.activeElement;
    const restore = ()=>{ if (opener && opener.focus && document.contains(opener)) opener.focus(); };
    document.body.appendChild(dlg);
    let settled = false;
    const done = v => { if (settled) return; settled = true; dlg.remove(); restore(); resolve(v); };
    dlg.addEventListener('close', ()=> done(dlg.returnValue === 'ok'));
    if (typeof dlg.showModal === 'function'){
      dlg.showModal();
      const ok = dlg.querySelector('.primary');
      if (ok) ok.focus();
    } else {
      done(typeof confirm === 'function' ? confirm(message) : false);
    }
  });
}

/* A dialog with more than two answers (Replace / Add / Cancel). Resolves to the chosen value,
   or null for Cancel and Escape. */
function askChoice(message, choices){
  return new Promise(resolve=>{
    const dlg = document.createElement('dialog');
    dlg.className = 'nameDialog';
    dlg.innerHTML = `<form method="dialog"><label>${escHTML(message)}</label><div class="nameDialogBtns">`
      + `<button value="__cancel" type="submit">Cancel</button>`
      + choices.map((c, i) => `<button value="${escAttr(c.value)}" type="submit"${i === 0 ? ' class="primary"' : ''}>${escHTML(c.label)}</button>`).join("")
      + `</div></form>`;
    const opener = document.activeElement;
    document.body.appendChild(dlg);
    let settled = false;
    const done = v => { if (settled) return; settled = true; dlg.remove(); if (opener && opener.focus && document.contains(opener)) opener.focus(); resolve(v); };
    dlg.addEventListener('close', ()=> done(dlg.returnValue && dlg.returnValue !== '__cancel' ? dlg.returnValue : null));
    if (typeof dlg.showModal === 'function'){ dlg.showModal(); const p = dlg.querySelector('.primary'); if (p) p.focus(); }
    else done(choices[0].value);
  });
}
/* Every exporter stamps a version. A file from a newer build is refused with a sentence, not
   parsed on the assumption it has this build's shape. */
function checkFileVersion(p, supported, what){
  const v = (p && p.version === undefined) ? 1 : (p && p.version);
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`that ${what} file's version stamp is not a number.`);
  if (v > supported) throw new Error(`that ${what} file was written by a newer version of this app (file version ${v}; this one reads up to ${supported}). Update the app, or re-export the file from the version that reads it.`);
  return v;
}
async function resetAllToDefaults(){
  // BUG FIX: this cleared persisted preferences and per-slot UI state BEFORE asking
  // for confirmation, so cancelling the dialog still silently wiped your saved
  // settings. Confirm first, mutate second.
  // No confirm dialog: the whole workspace is snapshotted first and the toast at the end undoes it.
  snapshotHistory();
  /* Hold every intermediate save until the end: clearConstraints() used to persist the
     half-reset workspace (old budgets still set) partway through, and that is what came
     back on the next reload. One save, after every step, of the finished defaults. */
  const wasReady = prefsReady;
  prefsReady = false;
  try { storage.delete(PREF_KEY); } catch(e){}
  rerollExclusions = {}; rerollHistory = {}; whyOpen = {}; lastDepthUntouched = []; pinnedTargets = {};
  lastAxesUsed = null; lastAxisTrimActive = false;
  Object.entries(DEFAULTS.fields).forEach(([id, v])=>{ const el = document.getElementById(id); if (el) el.value = v; });
  Object.entries(DEFAULTS.toggles).forEach(([id, v])=>{ const el = document.getElementById(id); if (el) el.checked = v; });
  /* Anything in the workspace the table above does not name goes back to what the page
     shipped with — its HTML default — so a new setting can never be missed by Reset. */
  SETTING_FIELDS.concat(['castOptimise']).filter(id => !(id in DEFAULTS.fields)).forEach(id=>{
    const el = document.getElementById(id); if (!el) return;
    if (el.type === 'checkbox'){ el.checked = !!el.defaultChecked; return; }
    if (el.tagName === 'SELECT'){
      const opt = Array.from(el.options || []).find(o => o.defaultSelected) || (el.options || [])[0];
      el.value = opt ? opt.value : ""; return;
    }
    el.value = el.defaultValue !== undefined ? el.defaultValue : "";
  });
  SETTING_TOGGLES.filter(id => !(id in DEFAULTS.toggles)).forEach(id=>{
    const el = document.getElementById(id); if (el) el.checked = !!el.defaultChecked;
  });
  if (typeof renderLensPicker === 'function') renderLensPicker();
  PERSONALITY_AXES.forEach(a=>{ const el = document.getElementById('pers_'+a.id); if (el) el.value = 0; });
  PROFILE_SECTIONS.forEach(ps=>{
    // A section's shipped default, not "on": the §6 sections that ship off stay off.
    const tog = document.getElementById('sec_'+ps.id); if (tog) tog.checked = ps.defaultOn !== false;
    const sel = document.getElementById('type_'+ps.id); if (sel) sel.value = "";
    clearAutoProfileType(ps.id);
  });
  PROFILE_SECTIONS.forEach(ps=>{ const el = document.getElementById('pw_'+ps.id); if (el) el.value = ""; });
  clearConstraints();
  clearBudgets(); refreshBudgetUI();
  // Content packs and slider locks are part of "everything": a pack left off silently changes what
  // a seed builds, and a ticked lock made Randomize skip a slider that Reset had just centred.
  if (typeof setDisabledPacks === 'function'){ setDisabledPacks([]); if (typeof refreshPackUI === 'function') refreshPackUI(); }
  document.querySelectorAll('input[id^="lock_"]').forEach(e => { e.checked = false; });
  forgetRecentTraits(); forgetSessionProfiles(); clearContextBias();
  forgetSlotDraws(); forgetCategoryUse();
  collapsedGroups = {};
  const seedFilter = document.getElementById('seedTraitFilter'); if (seedFilter) seedFilter.value = "";
  const seedSel = document.getElementById('seedTraitSelect'); if (seedSel) seedSel.value = "";
  document.body.classList.remove('hide-examples');
  togglePersonalityPanel();
  toggleCompact();
  onSliderChange();
  prefsReady = wasReady;
  savePrefs();
  toastUndo("Everything reset to defaults (content packs back on, slider locks released). Your character, saved traits and cast stay.", ()=>{ undoLast(); savePrefs(); }, 10000);
}

function randomRawSlider(){
  // biased toward the extremes a bit so randomized characters read as distinctive, not muddy-neutral
  const r = rand();
  let v;
  if (r < 0.6) { v = (rand()*2-1) * 100; }           // 60%: anywhere in range
  else { v = (rand() < 0.5 ? -1 : 1) * (60 + rand()*40); } // 40%: pushed toward an extreme
  return Math.round(clamp(v, -100, 100));
}

/* "Surprise me entirely." randomizeSliders(scope) has existed the whole time and was
   only ever surfaced as two separate half-measures behind the Advanced panel — voice OR
   personality, never the whole thing, and never the archetype or the divergence that
   actually decide what kind of person comes out. The empty state offered three specific
   starting points and no way to say "I don't know, show me something".

   Deliberately also rolls the archetype and pushes divergence up: randomising thirteen
   sliders around the centre produces a very average person by the central limit theorem,
   which is the opposite of a surprise. */
/* ================= DECLARATIVE EVENT DISPATCH =================
   The app carried about 140 inline on* attributes. They work, and they make a strict
   Content-Security-Policy impossible: any policy without 'unsafe-inline' in script-src
   turns every button in the app into a dead button. That is a real constraint for
   anyone embedding this, and it is the kind of thing that cannot be retrofitted a
   handler at a time later.

   One delegated listener per event type, reading a declared action and a JSON argument
   list off the element. The arguments keep their types (a trait id stays a number)
   because they travel as JSON rather than as attribute strings, and two tokens stand in
   for the things an inline handler had lexical access to and a delegated one does not:

     "$el"    -> the element the action is declared on   (was `this`)
     "$event" -> the event object                        (was `event`)

   Handlers that were multi-statement inline bodies are named functions now, which is
   where they should have been anyway. */
const ACTION_EVENTS = ['click', 'change', 'input', 'keydown'];
function _actionArgs(el, ev, suffix){
  let raw = el.getAttribute('data-args' + (suffix || ''));
  if (!raw) return [];
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e){ console.error('[action] bad data-args on', el, raw); return []; }
  if (!Array.isArray(parsed)) parsed = [parsed];
  return parsed.map(a => a === "$el" ? el : a === "$event" ? ev : a);
}
function _runAction(el, ev, suffix){
  const name = el.getAttribute('data-act' + (suffix || ''));
  const fn = name && globalThis[name];
  if (typeof fn !== 'function'){ console.error('[action] no such action:', name); return; }
  /* data-act is looked up on the global object, so markup that got into the page by any
     route could otherwise name eval, setTimeout, Function or alert and pass its own
     arguments. Every real action is a function this app defines; a browser built-in
     reports "[native code]". Refuse those. */
  if (/\[native code\]/.test(Function.prototype.toString.call(fn))){ console.error('[action] refused built-in:', name); return; }
  /* Roughly a third of the actions dispatched here are `async`, and a synchronous
     try/catch cannot contain a rejected promise: a save, an import or a cast build
     that threw after its first `await` produced an unhandled rejection in the console
     and nothing at all on screen. Catch the returned promise too. */
  try {
    const out = fn.apply(null, _actionArgs(el, ev, suffix));
    if (out && typeof out.catch === 'function'){
      out.catch(err=>{
        console.error('[action] ' + name + ' rejected', err);
        if (typeof toast === 'function') toast("That didn't finish: " + (err && err.message || err), "warn", 6000);
      });
    }
  }
  catch (err){
    console.error('[action] ' + name + ' threw', err);
    if (typeof toast === 'function') toast("That didn't finish: " + (err && err.message || err), "warn", 6000);
  }
}
ACTION_EVENTS.forEach(type=>{
  document.addEventListener(type, (ev)=>{
    /* An element can carry one action per event: `data-act-keydown` / `data-args-keydown`
       sit beside the plain `data-act`. Writing `data-act` twice on one tag does not do
       this — the parser keeps the first copy and silently drops the second. */
    const perType = ev.target && ev.target.closest && ev.target.closest('[data-act-' + type + ']');
    if (perType){ _runAction(perType, ev, '-' + type); return; }
    const target = ev.target && ev.target.closest && ev.target.closest('[data-act]');
    if (!target) return;
    // An element declares which events it wants; without this, a text input carrying a
    // keydown action would also fire on every click inside it.
    const wants = (target.getAttribute('data-on') || 'click').split(/\s+/);
    if (!wants.includes(type)) return;
    if (type === 'click' && target.tagName === 'BUTTON' && target.type !== 'submit') ev.preventDefault();
    _runAction(target, ev);
  });
});

// ---- The handlers that used to be multi-statement inline bodies ----
function openHelpPanel(){
  if (typeof closeShortcuts === 'function') closeShortcuts();
  const p = document.getElementById('helpPanel');
  if (!p) return;
  p.open = true;
  p.scrollIntoView({block:'nearest'});
}
function jumpToSectionFromSelect(el){
  if (!el) return;
  const v = el.value;
  el.value = '';
  jumpToSection(v);
}
function toggleCardControls(el){
  const card = el && el.closest('.traitCard');
  if (!card) return;
  // The open/closed state is JS state (OPEN_CARD_CONTROLS, render.js), not a DOM class
  // the next render throws away — see the note there. The class and the ARIA attribute
  // are both written from it so a rebuilt card comes back open, and announced open.
  const slot = card.dataset && card.dataset.slot;
  const open = !card.classList.contains('controlsOpen');
  card.classList.toggle('controlsOpen', open);
  if (slot){ if (open) OPEN_CARD_CONTROLS.add(slot); else OPEN_CARD_CONTROLS.delete(slot); }
  el.setAttribute('aria-expanded', String(open));
  el.setAttribute('aria-label', (open ? 'Hide' : 'Show') + ' the controls for this card');
  el.title = (open ? 'Hide' : 'Show') + ' the controls for this card';
}
/* `printSheet` was DEFINED TWICE — render.js has the real one with summary scoping,
   and this file redefined it below it in load order as a bare print() wrapper, so both
   Print and Print Summary dispatched to the same unscoped implementation and the
   summary mode had never once run. Removed; render.js owns printing. tests/run.js now
   fails the build on a duplicate top-level function declaration so the next one is
   caught at the source rather than by reading two files side by side. */

/* Surprise me, in four shapes (2026 audit §5c): a preset pulled off its defaults, a blend of
   two presets with a slider split, an anti-archetype (a preset's axes inverted, its
   motivation hints kept: "a Mentor who hoards knowledge"), or sliders from nothing. Each
   roll may also throw lens dice (one or two lenses, clashing ones allowed) and switch on
   one section that is off by default. */
const _SURPRISE_AXES = ['verbositySlider', 'registerSlider', 'composureSlider'];
function _presetRaw(arch, axisId){ return clamp(Math.round((arch.pers && arch.pers[axisId]) || 0), -100, 100); }
function _setPresetSliders(mix){
  // mix: list of {arch, w, invert}; weights sum to 1.
  PERSONALITY_AXES.forEach(axis=>{
    const el = document.getElementById('pers_'+axis.id);
    if (!el || isSliderLocked('pers_'+axis.id)) return;
    el.value = String(clamp(Math.round(mix.reduce((t, m) => t + _presetRaw(m.arch, axis.id) * m.w * (m.invert ? -1 : 1), 0)), -100, 100));
  });
  [['verbositySlider', 'verbosity'], ['registerSlider', 'register'], ['composureSlider', 'composure']].forEach(([id, key])=>{
    if (isSliderLocked(id)) return;
    setVal(id, clamp(Math.round(mix.reduce((t, m) => t + (m.arch[key] || 0) * 50 * m.w * (m.invert ? -1 : 1), 0)), -100, 100));
  });
}
function surpriseMe(){
  const keys = Object.keys(ARCHETYPES);
  const pickKey = (not) => { let k; do { k = keys[Math.floor(rand() * keys.length)]; } while (k === not && keys.length > 1); return k; };
  const sel = document.getElementById('archetypeSelect');
  const roll = rand();
  const mode = roll < 0.3 ? "preset" : roll < 0.5 ? "blend" : roll < 0.68 ? "anti" : "free";
  let said = "";
  const a = pickKey();
  if (mode === "preset"){
    if (sel) sel.value = a;
    onArchetypeChange(false);
    PERSONALITY_AXES.forEach(axis=>{
      const el = document.getElementById('pers_'+axis.id);
      if (!el || isSliderLocked('pers_'+axis.id)) return;
      el.value = String(clamp(intVal(el, 0) + Math.round((rand()*2-1) * 45), -100, 100));
    });
    said = `Surprised you from "${ARCHETYPES[a].label}", pulled well off its defaults.`;
  } else if (mode === "blend"){
    const b = pickKey(a), t = 0.35 + Math.round(rand() * 6) * 0.05;
    if (sel) sel.value = "";
    onArchetypeChange(false);
    _setPresetSliders([{arch: ARCHETYPES[a], w: 1 - t}, {arch: ARCHETYPES[b], w: t}]);
    said = `Blended "${ARCHETYPES[a].label}" (${Math.round((1 - t) * 100)}%) with "${ARCHETYPES[b].label}" (${Math.round(t * 100)}%).`;
  } else if (mode === "anti"){
    if (sel) sel.value = "";
    onArchetypeChange(false);
    _setPresetSliders([{arch: ARCHETYPES[a], w: 1, invert: true}]);
    said = `An anti-"${ARCHETYPES[a].label}": the axes inverted, the inner life kept.`;
  } else {
    if (sel) sel.value = "";
    onArchetypeChange(false);
    randomizeSliders('all');
    /* A free roll sets every slider to a random magnitude (mean about 63), which measured at
       14.6 strong or jarring conflicts per sheet against 8.2 for a default build. Pull the
       unlocked ones in so the sheet is surprising rather than self-cancelling. */
    ['verbositySlider', 'registerSlider', 'composureSlider'].concat(PERSONALITY_AXES.map(ax => 'pers_' + ax.id)).forEach(id=>{
      const el = document.getElementById(id);
      if (el && !isSliderLocked(id)) el.value = String(Math.round(intVal(el, 0) * 0.65));
    });
    said = "Every slider rolled, sections rolled, and the wildcard turned on.";
  }
  randomizeProfileTypes();
  /* The dice above force a random category into most sections, which overwrote the preset's
     own hints (hint realisation fell from 56% to 19%). A preset roll is "this archetype,
     pulled off its sliders", so the sections it hints go back to automatic and the hint
     steers them again. */
  if (mode === "preset" && typeof ARCHETYPE_PROFILE_HINTS !== 'undefined' && ARCHETYPE_PROFILE_HINTS[a]){
    Object.keys(ARCHETYPE_PROFILE_HINTS[a]).forEach(id=>{
      const tsel = document.getElementById('type_'+id);
      if (tsel){ tsel.value = ""; if (typeof clearAutoProfileType === 'function') clearAutoProfileType(id); }
    });
  }
  // The anti-archetype keeps what drives the preset: its motivation-side hints stay.
  if (mode === "anti" && typeof ARCHETYPE_PROFILE_HINTS !== 'undefined' && ARCHETYPE_PROFILE_HINTS[a]){
    ['values', 'beliefs', 'goals', 'origins', 'motivation', 'contradiction'].forEach(id=>{
      const cat = ARCHETYPE_PROFILE_HINTS[a][id], tsel = document.getElementById('type_'+id);
      if (cat && tsel && [...tsel.options].some(o => o.value === cat)){ tsel.value = cat; if (typeof clearAutoProfileType === 'function') clearAutoProfileType(id); }
    });
  }
  // divergence is a 0..1 range in steps of 0.05, not a 0..100 slider.
  const div = document.getElementById('divergence');
  // A preset roll keeps divergence low: at 0.6 and above the preset's hints stop landing.
  if (div) div.value = (mode === "preset" ? 0.15 + Math.round(rand() * 3) * 0.05 : 0.35 + Math.round(rand() * 8) * 0.05).toFixed(2);
  const wild = document.getElementById('wildcardToggle');
  if (wild) wild.checked = true;
  // Lens dice: none, one, or two — a clashing pair is allowed on purpose.
  const lensEl = document.getElementById('lensSelect');
  if (lensEl && typeof LENSES !== 'undefined'){
    const n = rand() < 0.55 ? 0 : rand() < 0.6 ? 1 : 2, picked = [];
    while (picked.length < n){ const l = LENSES[Math.floor(rand() * LENSES.length)]; if (!picked.includes(l)) picked.push(l); }
    lensEl.value = LENS_IDS.filter(id => picked.some(l => l.id === id)).join(',');
    renderLensPicker();
    if (picked.length) said += ` Lens dice: ${picked.map(l => l.label).join(" + ")}.`;
  }
  // A rotating wild section: one section that is off by default, on for this roll.
  const offBy = PROFILE_SECTIONS.filter(ps => ps.defaultOn === false);
  offBy.forEach(ps => { const tog = document.getElementById('sec_'+ps.id); if (tog) tog.checked = false; });
  if (offBy.length && rand() < 0.4){
    const ps = offBy[Math.floor(rand() * offBy.length)], tog = document.getElementById('sec_'+ps.id);
    if (tog){ tog.checked = true; said += ` Wild section: ${ps.label}.`; }
  }
  setVal('charName', "");
  invalidateSliderCache();
  onSliderChange();
  runGeneration();
  showPhoneResultSheet('surprise');
  toast(said + " Everything is still yours to change.");
}

function randomizeSliders(scope){
  // A slider with its lock ticked stays where it is: pin the axes you know, roll the rest.
  if (scope === 'voice' || scope === 'all'){
    ['verbositySlider', 'registerSlider', 'composureSlider'].forEach(id => { if (!isSliderLocked(id)) setVal(id, randomRawSlider()); });
  }
  if (scope === 'personality' || scope === 'all'){
    PERSONALITY_AXES.forEach(axis=>{
      const el = document.getElementById('pers_'+axis.id);
      if (el && !isSliderLocked('pers_'+axis.id)) el.value = randomRawSlider();
    });
  }
  onSliderChange();
}
function isSliderLocked(id){ const el = document.getElementById('lock_' + id); return !!(el && el.checked); }
function lockedSliderIds(){ return [...document.querySelectorAll('input[id^="lock_"]')].filter(e => e.checked).map(e => e.id.slice(5)); }
function sliderLockHTML(id, name){
  return `<label class="sliderLock" title="Lock: Randomize and Surprise me leave this slider where it is"><input type="checkbox" id="lock_${id}" ${actAttr('change', 'onSliderLockChange')} aria-label="Lock ${escAttr(name)}"><span aria-hidden="true">🔒</span></label>`;
}
function onSliderLockChange(){ if (typeof savePrefs === 'function') savePrefs(); }


// ================= CUSTOM ARCHETYPES =================
async function saveCustomArchetype(btnEl){
  const name = strVal('customArchName', '').trim();
  if(!name){ toast("Give the archetype a name first.", "warn"); return; }
  const btn = btnEl || null;
  const oldLabel = btn ? btn.textContent : null;
  if (btn){ btn.textContent = "Saving…"; btn.disabled = true; }
  const pers = {};
  PERSONALITY_AXES.forEach(axis=>{
    const el = document.getElementById('pers_'+axis.id);
    if (el) pers[axis.id] = intVal(el, 0);
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
    setVal('customArchName', "");
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
  // An Undo toast, not a confirm: the saved record is held until the toast goes.
  let raw = null;
  try { const r = await storage.get('archetype:'+name); raw = r && r.value; } catch(e){}
  try {
    await storage.delete('archetype:'+name);
    delete CUSTOM_ARCHETYPES[key];
    await loadCustomArchetypes();
    toastUndo(`Deleted the archetype "${name}".`, async ()=>{
      if (raw) await storage.set('archetype:'+name, raw);
      await loadCustomArchetypes();
      const s2 = document.getElementById('archetypeSelect'); if (s2 && CUSTOM_ARCHETYPES[key]) s2.value = key;
      onArchetypeChange(true);
      toast(`"${name}" is back.`);
    }, 12000);
  } catch(e){ console.error(e); toast("Could not delete — try again.", "warn"); }
}

/* Built-in presets used to be a hand-maintained <option> list in index.html; a preset
   added to ARCHETYPES did not exist in the UI until someone remembered. Fill the list
   from the table, and fill the variation list for whichever preset is chosen. */
function populateArchetypeSelect(){
  const sel = document.getElementById('archetypeSelect');
  if (!sel) return;
  const current = sel.value;
  [...sel.querySelectorAll('option')].forEach(o=>{ if (o.value && !o.value.startsWith('custom_')) o.remove(); });
  Object.entries(ARCHETYPES).forEach(([key, arch])=>{
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = arch.label;
    // Insert before any custom entries so the two groups stay together.
    const firstCustom = [...sel.options].find(o=>o.value.startsWith('custom_'));
    if (firstCustom) sel.insertBefore(opt, firstCustom); else sel.appendChild(opt);
  });
  if ([...sel.options].some(o=>o.value===current)) sel.value = current;
  onArchetypeChange(false);
}
function onArchetypeChange(andSlider){
  const key = strVal('archetypeSelect', '');
  const arch = ARCHETYPES[key] || CUSTOM_ARCHETYPES[key];
  const box = document.getElementById('archetypeTuning');
  const vsel = document.getElementById('archetypeVariation');
  if (box) box.style.display = arch ? 'block' : 'none';
  if (vsel){
    const prev = vsel.value;
    vsel.innerHTML = '<option value="base">As written</option>';
    (arch && arch.variations || []).forEach(v=>{
      const o = document.createElement('option'); o.value = v.id; o.textContent = v.label; vsel.appendChild(o);
    });
    if ([...vsel.options].some(o=>o.value===prev)) vsel.value = prev;
  }
  const note = document.getElementById('archetypeIntentNote');
  if (note){
    if (arch && arch.intent){
      const ax = id => { const a = PERSONALITY_AXES.find(x=>x.id===id); return a ? a.label : id; };
      const secs = ids => ids.map(id=>{ const ps = PROFILE_SECTIONS.find(p=>p.id===id); return ps ? ps.label : id; });
      note.innerHTML = `<b>Must hold:</b> ${escHTML(arch.intent.must.map(ax).join(', '))} · <b>nudged:</b> ${escHTML(secs(arch.intent.nudge).join(', '))} · <b>left open:</b> ${escHTML(secs(arch.intent.open).join(', '))}`;
    } else note.textContent = arch ? "A custom preset: blended evenly, nothing pinned." : "";
  }
  if (andSlider !== false) onSliderChange();
}
function onArchetypeBlendInput(){
  const v = floatVal('archetypeBlend', 0.65);
  setText('archetypeBlendVal', Math.round(v*100) + '%');
  onSliderChange();
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
  if (!sel) return;   // no dropdown on this page — the archetypes are still loaded
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
  if (list) list.textContent = names.length ? "Saved archetypes: " + names.join(", ") : "";
}

/* ================= WORKSPACE EXPORT =================
   Everything that was NOT a character and NOT a cast — the constraint sets, the
   budgets, the category tiers, the section toggles and weights, and the custom
   archetypes — lived only in this browser's storage. It is the highest-effort state in
   the app (a constraint set is built one banned trait at a time over an afternoon) and
   there was no way to move it to another machine, share it with a co-writer, or keep a
   copy before experimenting. Characters and casts both round-trip as files; this is the
   third thing worth round-tripping, and it is the one that took the longest to build.

   Custom archetypes travel WITH their saved setups, so importing a workspace brings a
   collaborator's presets over whole rather than as sliders. */
const WORKSPACE_FORMAT_VERSION = 1;
function exportWorkspaceJSON(){
  downloadText(JSON.stringify({
    format: "character-voice-workspace", version: WORKSPACE_FORMAT_VERSION,
    exported: new Date().toISOString(),
    // captureSettings already carries fields, toggles, sections, sliders, constraints
    // and budgets — the same block a character export and an archetype setup use, so
    // there is one definition of "the workspace" rather than a third list to maintain.
    settings: captureSettings(),
    archetypes: Object.values(CUSTOM_ARCHETYPES),
  }, null, 2), "character_workspace.json");
  const n = Object.keys(CUSTOM_ARCHETYPES).length;
  toast(`Exported your workspace${n ? ` and ${n} custom archetype${n===1?'':'s'}` : ''}.`);
}
/* Merging a workspace: the union of the constraint lists, the incoming caps only where you have
   none, and everything else (sliders, toggles, fields, sections) left as it is. */
function mergeWorkspaceSettings(cur, inc){
  const out = JSON.parse(JSON.stringify(cur));
  const c = out.constraints = out.constraints || {}, i = (inc && inc.constraints) || {};
  ['bannedCategories', 'bannedSections', 'bannedTraitIds', 'requiredTraitIds', 'requiredCategories'].forEach(k => {
    c[k] = [...new Set([...(c[k] || []), ...(Array.isArray(i[k]) ? i[k] : [])])];
  });
  const key = p => JSON.stringify(p);
  const pairs = new Map((c.exclusivePairs || []).map(p => [key(p), p]));
  (Array.isArray(i.exclusivePairs) ? i.exclusivePairs : []).forEach(p => pairs.set(key(p), p));
  c.exclusivePairs = [...pairs.values()];
  const tiers = new Map(c.categoryTiers || []);
  (Array.isArray(i.categoryTiers) ? i.categoryTiers : []).forEach(([k, v]) => { if (!tiers.has(k)) tiers.set(k, v); });
  c.categoryTiers = [...tiers.entries()];
  ['rarityCaps', 'intensityCaps'].forEach(k => {
    c[k] = Object.assign({}, i[k] || {}, Object.fromEntries(Object.entries(c[k] || {}).filter(([, v]) => v !== null && v !== undefined)));
  });
  out.disabledPacks = [...new Set([...(out.disabledPacks || []), ...((inc && inc.disabledPacks) || [])])];
  return out;
}
async function importWorkspaceJSON(fileInput){
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const text = await file.text().catch(()=>null);
  fileInput.value = "";
  if (text === null){ toast("Could not read that file.", "warn"); return; }
  try {
    const p = JSON.parse(text);
    if (p.format !== "character-voice-workspace") throw new Error("Not a workspace file.");
    checkFileVersion(p, WORKSPACE_FORMAT_VERSION, "workspace");
    if (p.settings != null && (typeof p.settings !== 'object' || Array.isArray(p.settings)))
      throw new Error("The `settings` block is not an object.");
    if (p.archetypes != null && !Array.isArray(p.archetypes))
      throw new Error("The `archetypes` block is not a list.");
    const archetypes = (p.archetypes || []).filter(a=> a && typeof a === 'object' && typeof a.label === 'string' && a.label.trim());
    /* Replacing a workspace is destructive in a way importing a character is not — it
       overwrites constraint sets that took real work — so it is confirmed, and the
       count is named so the confirmation says what will actually happen. */
    const bits = [];
    if (p.settings) bits.push("your constraints, budgets, tiers and section settings");
    if (archetypes.length) bits.push(`${archetypes.length} custom archetype${archetypes.length===1?'':'s'}`);
    if (!bits.length) throw new Error("That workspace file is empty.");
    const choice = await askChoice(`This file holds ${bits.join(" and ")}. Replace yours with it, or merge it into what you have?`,
      [{value: 'merge', label: 'Merge into mine'}, {value: 'replace', label: 'Replace mine'}]);
    if (!choice) return;
    const merge = choice === 'merge';
    /* B16: the undo snapshot carries captureSettings(), so Undo (button, Ctrl+Z, or the
       toast) restores the constraints and settings this import replaced. */
    const prevSettings = captureSettings();
    if (p.settings){
      validateSettingsBlock(p.settings);   // before anything is touched
      const prevHistoryLength = history.length;
      snapshotHistory();
      try { restoreSettings(merge ? mergeWorkspaceSettings(prevSettings, p.settings) : p.settings); }
      catch(e){
        // Put the workspace back and drop the history entry this attempt pushed.
        if (history.length > prevHistoryLength) history.pop();
        try { restoreSettings(prevSettings); refreshConstraintChips(); } catch(e2){ console.error(e2); }
        throw e;
      }
    }
    let saved = 0, skippedSame = [];
    for (const arch of archetypes){
      // Merging keeps an archetype you already have under that name rather than overwriting it.
      if (merge && CUSTOM_ARCHETYPES['custom_' + arch.label]){ skippedSame.push(arch.label); continue; }
      try { await storage.set('archetype:'+arch.label, JSON.stringify(arch)); saved++; }
      catch(e){ console.error(e); }
    }
    await loadCustomArchetypes();
    refreshConstraintChips();
    onSliderChange();
    if (typeof savePrefs === 'function') savePrefs();
    const msg = `${merge ? 'Merged' : 'Imported'} ${bits.join(" and ")}${skippedSame.length ? ` (kept your own version of: ${skippedSame.join(', ')})` : ''}${saved + skippedSame.length < archetypes.length ? ` (${archetypes.length - saved - skippedSame.length} archetype(s) would not fit in storage)` : ''}.`;
    if (p.settings) toastUndo(msg, ()=>{
      restoreSettings(prevSettings); refreshConstraintChips(); onSliderChange();
      if (typeof savePrefs === 'function') savePrefs();
      toast("Your previous settings are back. (Imported archetypes were kept.)");
    }, 12000);
    else toast(msg);
  } catch(e){ console.error(e); toast("Could not import workspace: " + e.message, "warn", 6000); }
}

// ================= RELATIONSHIP GENERATOR =================
/* The Relationships tab was a page of empty dropdowns until a cast existed. Say what it
   needs and offer the way there. */
function refreshRelEmpty(){
  const box = document.getElementById('relEmpty');
  if (!box) return;
  // The sheet on screen counts: the pair pickers offer it beside the cast members.
  const n = castStates.length + (Object.keys(state).length ? 1 : 0);
  box.hidden = n >= 2;
  const c = document.getElementById('relEmptyCount');
  if (c) c.textContent = n === 0 ? "There is no character or cast yet." : "There is one character so far — build a cast, or add this sheet to it.";
}
function refreshRelSelectors(){
  refreshRelEmpty();
  if (typeof renderEdges === 'function') renderEdges();
  if (typeof renderVoiceCompare === 'function') renderVoiceCompare();
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
/* The loop this tool is built around is generate -> tweak -> regenerate, and there was
   no way to fork: the only way to keep a version you liked was to save it to storage and
   load it back, losing whatever you were in the middle of. Duplicating into the Cast tab
   keeps both side by side, which is also where you can then compare them. */
/* A copy has to be a copy. `{...state}` is one level deep, so the copy's slot OBJECTS
   were the originals: locking a card on the source flipped the lock on the duplicate,
   and any in-place edit (pin, note, lock, target) leaked between the two. Reroll
   replaces whole slot objects, which is why this only showed up on in-place mutations
   and never in the tests. Clone the slot records; trait definitions are immutable and
   are deliberately still shared. */
function cloneSheet(st){
  const out = {};
  Object.keys(st || {}).forEach(k=>{ out[k] = st[k] ? Object.assign({}, st[k]) : st[k]; });
  return out;
}
function duplicateCharacter(){
  if (!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  const base = charMeta.name || "Character";
  let name = base + " (copy)";
  for (let n = 2; castStates.some(c=>c.meta.name === name); n++) name = `${base} (copy ${n})`;
  castStates.push(castEntry(
    cloneSheet(state),
    Object.assign({}, getCharVariants()),
    {name, age: charMeta.age || "", context: charMeta.context || "",
     archetypeLabel: charMeta.archetypeLabel || "Duplicate"}));
  renderCast();
  refreshRelSelectors();
  toast(`Copied to the Cast tab as "${name}" — this sheet is untouched, so tweak away.`);
}

function axisProfile(st){
  // Aggregate polarity across a character's Personality AND Profile-section traits —
  // previously this only read pers_ slots, so Values/Attachment/Role/etc (arguably the
  // more predictive data for how two characters clash) were invisible to Relationship
  // and Ensemble analysis. Voice traits carry pol too but are deliberately excluded here:
  // this profile is about who the character IS, not how they happen to phrase things.
  const prof = {}, raw = {}, counts = {};
  Object.keys(st).filter(k=>k.startsWith("pers_") || k.startsWith("prof_")).forEach(id=>{
    // BUG FIX: slots can legitimately hold a null trait (exhausted pool, disabled
    // section on a loaded save); dereferencing .trait.pol here crashed the whole
    // Relationship and Ensemble tools for that character.
    const t = st[id] && st[id].trait;
    if (!t || !t.pol) return;
    Object.entries(t.pol).forEach(([ax,v])=>{
      if (!AXIS_LABELS[ax] || !v) return;
      raw[ax] = (raw[ax]||0) + v;
      counts[ax] = (counts[ax]||0) + 1;
    });
  });
  /* CHARACTER-RELATIVE, WITH A BANK PRIOR. This used to divide the raw sum by the
     square root of the whole bank's tag count for the axis (polNormalise). Two things
     were wrong with that. It did not remove the sign imbalance at all — the same
     divisor scales both poles, so an axis tagged 7:1 positive still read positive for
     nearly everyone. And it made a SAVED character's numbers depend on the size of the
     bank: adding content moved every existing sheet's radar, fidelity and relationship
     read without the sheet changing.

     Each axis is now scored against the sheet's own tagged evidence. `prior` is the
     bank's expected value per tagged draw ((pos - neg) / (pos + neg)), so a character
     is measured by how far their traits lean RELATIVE to what the bank hands out by
     default — an axis everyone would read positive on reads neutral unless this person
     actually leans further than that. The divisor is the sheet's own count, so the
     number no longer moves when the bank grows. Units: roughly a z-like score, with
     ±2 meaning "every tagged trait on the sheet leans this way". */
  Object.entries(raw).forEach(([ax, v])=>{
    const n = counts[ax] || 1;
    const prior = polarityPrior(ax);
    prof[ax] = (v - n * prior) / Math.sqrt(n);
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
  const ka = strVal('relA', ''), kb = strVal('relB', '');
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
  /* These rules are symmetric in meaning, so they have to be symmetric in code. The
     warmth rule tested A-warm-and-B-cold ONLY, so swapping which character sat in the
     A selector made the finding vanish — for a pattern whose own text ("one reaches,
     the other retreats") says nothing about which one is which. `opposed` covers both
     orientations; a genuinely directional fact would be stated with the names in it. */
  const opposed = (ax) => (pa[ax]||0) * (pb[ax]||0) < 0;
  /* Also: this was phrased as a prediction of the relationship's ending, from two
     polarity sums and no shared history, goals or stakes at all. Inferred dynamics are
     scene possibilities, and the copy now says so. */
  if (opposed('hon')) notes.push("One deals straight, the other doesn't. That gap is the obvious fault line to put weight on — a scene where one of them needs the other to lie, or not to.");
  if (bothLow('warm')) notes.push("Two cold fronts. Mutual respect is possible; intimacy isn't, without something forcing it.");
  if (opposed('warm')) notes.push("One keeps reaching, the other keeps stepping back. Can be played as pursuit and retreat.");
  if (opposed('emo')) notes.push("One processes out loud, the other shuts down. Each reads the other's coping as a personal rejection.");
  if (bothHigh('ego')) notes.push("Two secure egos — surprisingly stable, provided their goals don't overlap.");
  if (opposed('disc')) notes.push("One plans, the other improvises. Productive in a crisis, corrosive over a long campaign.");
  if (opposed('pos')) notes.push("Optimist and pessimist. Each thinks the other is being wilfully unhelpful.");
  if (opposed('act')) notes.push("Mismatched tempo — one is always waiting, the other always being rushed.");
  if (bothHigh('intel')) notes.push("Both sharp. Conversation runs fast and competitive; neither explains themselves.");
  if ((pa['mood']||0) < 0 && (pb['mood']||0) < 0) notes.push("Both currently in a bad place. Whatever happens between them now isn't representative.");
  // Manners ('man') previously had zero interpretive notes here despite being one of
  // the more dramatically obvious clashes available (Ritual-observant vs. Totally
  // uncouth) — every other personality axis had at least one.
  if (bothHigh('man')) notes.push("Both scrupulously mannered. Pleasant on the surface — but a real breach of etiquette between them will land as a genuine violation, not a quirk to shrug off.");
  if (bothLow('man')) notes.push("Neither minds their manners. Blunt and efficient with each other; occasionally, accidentally cruel to anyone who expected softening.");
  if (opposed('man')) notes.push("One minds their manners, the other doesn't bother. Every interaction becomes a small, usually unspoken referendum on how much decorum the room requires.");

  notes.push(...categoryPairNotesFor(A.state, B.state));

  let heat = clashes.reduce((s,c)=>s+c.mag,0);
  let bond = alignments.reduce((s,c)=>s+c.mag,0);
  let verdict;
  if (heat > bond*1.8) verdict = "Volatile — this pairing generates friction faster than trust.";
  else if (bond > heat*1.8) verdict = "Easy — they slot together with little resistance (possibly too little for drama).";
  else verdict = "Mixed — real common ground with real fault lines. The most dramatically useful kind.";

  const sheet = document.getElementById('relSheet');
  if (!sheet) return;   // container absent (embedded build, or a trimmed page)
  sheet.classList.add('show');
  setText('relTitle', (A.meta.name||"A") + "  ×  " + (B.meta.name||"B"));
  let h = `<div class="charMeta">${verdict}</div>`;
  if (clashes.length){
    h += `<div class="axisGroup"><div class="axisTitle">Friction points</div>`;
    clashes.slice(0,6).forEach(c=>{
      /* BUG FIX: character names are user input (the #charName field, the cast rename
         dialog) and were interpolated raw here — the one path in the file that skipped
         escHTML, which renderCast applies to the very same field. A shared
         .character.json or a pasted cast makes that a real injection vector. */
      h += `<div class="traitCard"><div class="traitMain"><div class="traitName">${escHTML(c.label)}</div>
        <div class="traitDesc">${escHTML(A.meta.name||'A')} leans ${c.va>0?'high':'low'}; ${escHTML(B.meta.name||'B')} leans ${c.vb>0?'high':'low'}.</div></div></div>`;
    });
    h += `</div>`;
  }
  if (alignments.length){
    h += `<div class="axisGroup"><div class="axisTitle">Common ground</div>`;
    alignments.slice(0,6).forEach(c=>{
      h += `<div class="traitCard"><div class="traitMain"><div class="traitName">${escHTML(c.label)}</div>
        <div class="traitDesc">Both lean ${c.va>0?'high':'low'} here.</div></div></div>`;
    });
    h += `</div>`;
  }
  if (notes.length){
    h += `<div class="axisGroup"><div class="axisTitle">What this looks like in a scene</div>`;
    // Escaped even though every note is currently an authored literal: the moment one
    // rule interpolates a category or trait name, this becomes the same hole again.
    notes.forEach(n=>{ h += `<div class="traitCard"><div class="traitMain"><div class="traitDesc">${escHTML(n)}</div></div></div>`; });
    h += `</div>`;
  }
  const crossed = typeof crossedNeeds === 'function' ? crossedNeeds(A, B) : [];
  if (crossed.length){
    h += `<div class="axisGroup"><div class="axisTitle">Crossed needs</div>`;
    crossed.forEach(c => { h += `<div class="traitCard"><div class="traitMain"><div class="traitDesc">${escHTML(c.text)}</div>
      <div class="sub">${escHTML(c.from)}'s need: ${escHTML(c.need)} · in the way: ${escHTML(c.blocker)}</div></div></div>`; });
    h += `</div>`;
  }
  if (typeof voiceExchange === 'function'){
    const sel = document.getElementById('relExchangePrompt');
    const prompts = allVoicePrompts();
    if (sel && sel.options.length !== prompts.length){
      const keep = sel.value; sel.innerHTML = prompts.map(p => `<option value="${escHTML(p.id)}">${escHTML(p.label)}</option>`).join("");
      if (prompts.some(p => p.id === keep)) sel.value = keep;
    }
    const ex = voiceExchange(A, B, strVal('relExchangePrompt', 'request'), voiceLabMode, strVal('voiceAudience', ''));
    if (ex && ex.turns.length){
      h += `<div class="axisGroup"><div class="axisTitle">Hear them talk</div>` + ex.turns.map(t => `<div class="traitCard"><div class="traitMain"><div class="traitName">${escHTML(t.who)} <span class="sub">${escHTML(t.act)}</span></div>
        <blockquote class="voiceLine">${escHTML(t.text)}</blockquote></div></div>`).join("") + `</div>`;
    }
  }
  if (!clashes.length && !alignments.length && !notes.length){
    h += `<div class="charMeta">Not enough personality signal to compare — generate both characters with the personality profile enabled.</div>`;
  }
  setHTML('relBody', h);
}
function copyRelationship(btnEl){
  const titleEl = document.getElementById('relTitle'), bodyEl = document.getElementById('relBody');
  const t = (titleEl ? titleEl.textContent : "") + "\n\n" + (bodyEl ? bodyEl.innerText : "");
  /* BUG FIX: this used navigator.clipboard directly, bypassing copyText() — which was
     hardened for non-secure contexts (file://, plain http) precisely because
     navigator.clipboard is undefined there. On file:// this threw an unhandled
     rejection and the button appeared to do nothing. copyText owns the fallback and
     the "copy blocked here" warning, and handles the button label too. */
  copyText(t, btnEl);
}


// ================= PERSONALITY -> VOICE SUGGESTION =================
// Maps aggregate personality posture onto sensible voice slider positions.
// Deliberately overridable: it sets the sliders, it doesn't lock them.
function suggestVoiceFromPersonality(){
  const P = id => intVal('pers_'+id, 0);
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
  // Same codec as the single character and the cast — see resolveSeed in generate.js.
  const foilSeed = resolveSeed(seedInput ? seedInput.value : "");
  // Foils were the other unreproducible generator: unseeded draws throughout, so a
  // foil you liked could not be recovered, shared, or regenerated after a tweak.
  withRng(mulberry32(foilSeed.num), ()=> _generateFoilInner(foilSeed.label));
}
function _generateFoilInner(seedLabel){
  const src = {};
  PERSONALITY_AXES.forEach(a=>{ src[a.id] = intVal('pers_'+a.id, 0); });

  // Prefer opposing axes where the source character actually has a strong position.
  const ranked = PERSONALITY_AXES.map(a=>({axis:a, mag:Math.abs(src[a.id])})).sort((x,y)=>y.mag-x.mag);
  const strong = ranked.filter(r=>r.mag>=25);
  const pool = strong.length>=3 ? strong : ranked;
  const shuffle = arr => arr.map(a=>[rand(),a]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);

  const opposeCount = 2 + (rand()<0.5?1:0); // 2 or 3
  const opposed = shuffle(pool.slice(0, Math.max(opposeCount+2, 4))).slice(0, opposeCount);
  const opposedIds = new Set(opposed.map(o=>o.axis.id));
  const alignCandidates = shuffle(PERSONALITY_AXES.filter(a=>!opposedIds.has(a.id)));
  const aligned = alignCandidates.slice(0, 1 + (rand()<0.5?1:0)); // 1 or 2

  const overrides = {};
  PERSONALITY_AXES.forEach(a=>{
    if (opposedIds.has(a.id)){
      const v = src[a.id];
      overrides[a.id] = Math.round(clamp((Math.abs(v) < 25 ? 55 : Math.abs(v)) * (v >= 0 ? -1 : 1), -100, 100));
    } else if (aligned.some(x=>x.id===a.id)){
      overrides[a.id] = Math.round(clamp(src[a.id] + (rand()*20-10), -100, 100));
    } else {
      overrides[a.id] = Math.round((rand()*2-1)*70);
    }
  });

  // Same opposition idea, applied to whichever Profile sections the source character
  // actually has a resolved category for. This is usually more narratively decisive
  // than opposed personality sliders alone — two characters with opposite Values or
  // Attachment styles clash in ways that don't show up as a personality-axis mismatch.
  const profSectionsWithSrc = ["values","attachment","role","stress","humor","vices"]
    .filter(id => slotCat(state["prof_"+id+"_0"]) && OPPOSED_CATEGORIES[id]);
  const profOpposeCount = Math.min(profSectionsWithSrc.length, 1 + (rand()<0.5?1:0)); // 1 or 2
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

  const rarityPref = rarityPrefVal();
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
  // withCharacterVariants: the foil gets its own presentation locks, and the source
  // character's are put back afterwards rather than being left clobbered.
  let foilVariants = null;
  // A foil is defined by contrast, so it must not inherit the source character's
  // context bias — that bias pulls toward the same categories the oppositions above
  // just spent effort pushing away from.
  const foilState = withoutContextBias(()=> withSpeculativeGeneration(()=> withCharacterVariants(()=> {
    // Through the shared finalizer, like every other generation path — see B15.
    const built = finalizeSheet(buildCharacterState({
    verbLevel: -rawToLevel(intVal('verbositySlider', 0)),
    regLevel:  -rawToLevel(intVal('registerSlider', 0)),
    compLevel: opposeComposure ? -composureRaw : composureRaw,
    mannerCount, rarityPref, vocabPref:null, personalityOverrides: overrides, vocabCount, forcedProfileCats
    }), {rarityPref, applyPins:false});
    foilVariants = Object.assign({}, charVariants);
    return built;
  })));
  const premisePool = (()=>{
    const keyed = profOpposed.filter(id=>FOIL_PREMISES_BY_SECTION[id] && forcedProfileCats[id]);
    if (!keyed.length) return FOIL_PREMISES;
    const id = keyed[Math.floor(rand()*keyed.length)];
    // Keep a slice of the generic list in play so a section opposed twice in a session
    // doesn't return the same two lines.
    return FOIL_PREMISES_BY_SECTION[id].concat(FOIL_PREMISES.slice(0, 2));
  })();
  const genericPremise = premisePool[Math.floor(rand()*premisePool.length)];
  /* Section 6: build the premise from the SOURCE sheet's wound, lie, want, fear, need
     and values against the foil's own — drawn after the generic pick so the stream
     (and every seeded foil) stays reproducible. The generic list is the fallback. */
  const sheetPremise = typeof foilPremiseFromSheets === 'function'
    ? foilPremiseFromSheets(state, foilState, rand, {a: charMeta.name || "The character", b: "the foil"}) : null;
  const premise = sheetPremise ? sheetPremise.text : genericPremise;

  // The whole point of a foil is contrast — without the source character also on the
  // Cast tab, the "Opposed on... Shared ground on..." rationale below refers to a
  // character the user can't actually see next to it. Add the current character
  // alongside the foil (guarding against a duplicate name already in the cast).
  const srcName = charMeta.name || "Current character";
  /* Was: remove every member whose DISPLAY NAME is "Foil" or matches the source
     character. That deleted a renamed member, an imported stranger, or a character the
     user had deliberately called Foil. Remove only the pair a previous run of THIS
     command created, identified by the marks it left. */
  castStates = castStates.filter(c=> !c.generatedBy || c.generatedBy !== 'foil');
  const sourceCopy = castEntry(cloneSheet(state), Object.assign({}, charVariants),
    {name: srcName, age: charMeta.age||"", context: charMeta.context||"", archetypeLabel: charMeta.archetypeLabel||"Source"},
    {generatedBy: 'foil', foilRole: 'source'});
  castStates.push(sourceCopy);
  castStates.push(castEntry(foilState, foilVariants,
    {name:"Foil", age:"", context:premise, archetypeLabel:"Foil"},
    {generatedBy: 'foil', foilRole: 'foil', foilOf: sourceCopy.id}));
  renderCast();
  switchTab('cast');

  const opposedNames = opposed.map(o=>o.axis.label).join(", ");
  const alignedNames = aligned.map(a=>a.label).join(", ");
  const grid = document.getElementById('castGrid');
  const note = document.createElement('div');
  note.className = "castCard";
  note.innerHTML = `<h3><span>Foil rationale</span></h3>
    <div class="traitDesc"><b>Premise:</b> ${escHTML(premise)}</div>
    ${sheetPremise ? `<div class="sub" data-st="margin-top:4px;">Built from: ${escHTML(sheetPremise.from.join(" · "))}</div>` : ``}
    <div class="traitDesc" data-st="margin-top:6px;"><b>Opposed on (personality):</b> ${escHTML(opposedNames)}</div>
    ${profOpposedNames.length ? `<div class="traitDesc" data-st="margin-top:6px;"><b>Opposed on (profile):</b> ${escHTML(profOpposedNames.join(", "))}</div>` : ``}
    <div class="traitDesc" data-st="margin-top:6px;"><b>Shared ground on:</b> ${escHTML(alignedNames||"—")}</div>
    <div class="traitDesc" data-st="margin-top:6px;">Opposition on a few axes creates friction; shared ground on one or two keeps them plausibly in the same room — and the premise is what puts them in it. Check the Relationships tab for the full read.</div>
    <div class="sub" data-st="margin-top:8px;">Foil seed: <b>${escHTML(seedLabel)}</b> — paste it into the foil seed field to rebuild this exact one.</div>`;
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
  /* The headline used to read only the personality-axis clusters, so a cast where
     every member had the same Social Role, values, humour and vice could still be
     announced "well spread" while the profile clustering it had already computed sat
     two paragraphs below. Both dimensions now feed the verdict, and a cast with too
     few usable axes says so rather than defaulting to praise. */
  const measured = Object.values(axisVals).filter(v=>v.length >= 3).length;
  const pressure = clustered.length + profClustered.length;
  const verdict = measured === 0 && !profClustered.length
    ? "Not enough comparable traits across this cast to judge spread — generate fuller sheets, or add members."
    : pressure >= 5
      ? "Heavily clustered — this cast risks sounding like one person in several coats."
      : pressure >= 3
        ? "Somewhat clustered — a few dimensions where everyone agrees. Worth breaking one or two."
        : profClustered.length
          ? "Mixed — personality is reasonably spread, but the cast shares a narrative dimension below."
          : measured < 4
            ? `Spread looks fine on the ${measured} axis${measured===1?'':'es'} with enough data, but that is a thin sample.`
            : "Well spread — the cast covers meaningfully different ground.";
  h += `<div class="charMeta">${escHTML(verdict)}</div>`;

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
        <div class="traitName">${escHTML(c.section)}</div>
        <div class="traitDesc">${c.count} of ${c.total} cast members resolved to <b>${escHTML(c.cat)}</b>. ${escHTML(callout)}</div>
      </div></div>`;
    });
    h += `</div>`;
  }
  if (clustered.length){
    h += `<div class="axisGroup"><div class="axisTitle">Everyone lands the same way here</div>`;
    clustered.forEach(c=>{
      h += `<div class="traitCard"><div class="traitMain">
        <div class="traitName">${escHTML(c.axis.label)}</div>
        <div class="traitDesc">All (or nearly all) of the cast sit on the <b>${escHTML(c.dir)}</b> side. Consider flipping one character to create contrast.</div>
      </div></div>`;
    });
    h += `</div>`;
  }
  if (spread.length){
    h += `<div class="axisGroup"><div class="axisTitle">Healthy contrast already</div>`;
    spread.forEach(s=>{
      h += `<div class="traitCard"><div class="traitMain"><div class="traitName">${escHTML(s.axis.label)}</div>
        <div class="traitDesc">The cast is genuinely split on this axis.</div></div></div>`;
    });
    h += `</div>`;
  }

  // Reporting a gap without offering to close it leaves the user to work out which
  // sliders would fill it — which is exactly the arithmetic this tool exists to do.
  if (clustered.length || profClustered.length){
    lastBalanceGaps = {clustered: clustered.map(c=>({id:c.axis.id, dir:c.dir})), profClustered: profClustered.map(c=>({section:c.section, cat:c.cat}))};
    h += `<div class="actionRow" data-st="margin-top:14px;">
      <button class="btn-primary" ${actAttr('click', 'generateGapFiller')}>Generate a member who fills these gaps</button>
    </div>`;
  } else lastBalanceGaps = null;

  const box = document.getElementById('balanceResult');
  if (!box) return;   // container absent (embedded build, or a trimmed page)
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
  PERSONALITY_AXES.forEach(a=>{ overrides[a.id] = Math.round((rand()*2-1)*45); });
  lastBalanceGaps.clustered.forEach(c=>{
    overrides[c.id] = c.dir === 'high' ? -70 : 70;
  });
  const forcedProfileCats = {};
  lastBalanceGaps.profClustered.forEach(pc=>{
    const ps = PROFILE_SECTIONS.find(p=>p.label === pc.section);
    if (!ps) return;
    const others = allCatsOf(ps.section).filter(c=>c !== pc.cat);
    if (others.length) forcedProfileCats[ps.id] = others[Math.floor(rand()*others.length)];
  });
  const rarityPref = rarityPrefVal();
  // The gap-filler exists to break clustering; inheriting the last character's context
  // bias reinforced exactly what it was called in to counteract. Its presentation
  // locks are its own and are restored afterwards for the same reason.
  let gapVariants = null;
  const st = withoutContextBias(()=> withSpeculativeGeneration(()=> withCharacterVariants(()=> {
    // Shared finalizer — see B15. Without it the gap-filler ignored required traits,
    // budgets and exclusivity that every chip on screen said were active.
    const built = finalizeSheet(buildCharacterState({
      verbLevel: (rand()*4)-2, regLevel: (rand()*4)-2, compLevel: (rand()*4)-2,
      mannerCount: intVal('mannerCount', 3), vocabCount: intVal('vocabCount', 2),
      rarityPref, vocabPref:null, personalityOverrides: overrides, forcedProfileCats,
    }), {rarityPref, applyPins:false});
    gapVariants = Object.assign({}, charVariants);
    return built;
  })));
  castStates.push(castEntry(st, gapVariants, {name:"Character " + (castStates.length+1), age:"", context:"Built to fill the ensemble's gaps", archetypeLabel:"Gap-filler"}));
  renderCast();
  refreshRelSelectors();
  checkEnsembleBalance();
  toast("Added a cast member positioned against the clustering.");
}


// ================= PROFILE SECTION UI =================
function buildProfileSectionUI(){
  const grid = document.getElementById('profileSectionsGrid');
  if (!grid) return;   // container absent (embedded build, or a trimmed page)
  grid.innerHTML = "";
  PROFILE_SECTIONS.forEach(ps=>{
    const cats = allCatsOf(ps.section);   // the picker shows everything the bank holds, not just what a v1 build can reach
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
        <input type="checkbox" id="sec_${ps.id}" ${ps.defaultOn === false ? '' : 'checked'}>
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
    // A change made HERE is a user choice, so it clears the "we wrote this" mark that
    // depth-first leaves behind (see AUTO_PROFILE_TYPES in engine.js).
    const typeSel = div.querySelector('#type_' + ps.id);
    if (typeSel) typeSel.addEventListener('change', ()=> clearAutoProfileType(ps.id));
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
    sel.value = rand() < 0.25 ? "" : opts[Math.floor(rand()*opts.length)].value;
    // Randomize IS a deliberate user act: these are choices, not depth-first guesses.
    clearAutoProfileType(ps.id);
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
    markSaved();
  } catch(e){ /* storage unavailable — preferences just won't persist */ markSaved(false); }
}
/* The header's save state: what the app has kept for you, and when. Settings autosave; a
   character is kept only when you save it or file it, and the line says which. */
function markSaved(ok){
  const el = document.getElementById('saveState');
  if (!el) return;
  if (ok === false || !storageIsDurable()){ el.textContent = "Not saved: storage is off"; el.classList.add('warn'); return; }
  el.classList.remove('warn');
  const t = new Date();
  el.textContent = "Settings saved " + t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}
function refreshProjectChip(){
  const n = document.getElementById('projectChipName');
  if (!n) return;
  const p = currentProject();
  n.textContent = p ? p.name : 'none';
}

async function loadPrefs(){
  let raw = null;
  try {
    const res = await storage.get(PREF_KEY);
    raw = res && res.value;
    if (raw){
      const data = JSON.parse(raw);
      if (typeof validateSettingsBlock === 'function') validateSettingsBlock(data);   // before anything is applied
      PREF_VOLATILE_FIELDS.forEach(id=>{ if (data.fields) delete data.fields[id]; });
      delete data.rerollExclusions;
      restoreSettings(data);
    }
  } catch(e){
    /* No saved prefs and unavailable storage are ordinary. A saved blob that exists but cannot be
       read is not: the settings were silently dropped. Say so, and keep the unreadable copy under
       its own key so it can be recovered by hand. */
    if (raw){
      try { storage.set(PREF_KEY + ':corrupt', raw); } catch(e2){}
      try { toast("Your saved settings could not be read, so the defaults are in use. The unreadable copy was kept in browser storage.", "warn", 9000); } catch(e2){}
    }
  }
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
/* "Review" on the in-force strip: show the Advanced controls if Quick mode hides them,
   open every panel whose heading carries a count, and scroll to the first. */
function reviewActiveRules(){
  const adv = document.getElementById('advancedToggle');
  if (adv && !adv.checked){ adv.checked = true; applyAdvancedMode(); if (typeof savePrefs === 'function') savePrefs(); }
  if (typeof setInputsCollapsed === 'function') setInputsCollapsed(false);   // a phone may have folded the inputs
  let first = null;
  document.querySelectorAll('[data-badge]:not([hidden])').forEach(b=>{
    const d = b.closest('details'); if (!d) return;
    d.open = true; if (!first) first = d;
  });
  const target = first || document.getElementById('controlsStart');
  if (target && target.scrollIntoView) target.scrollIntoView({block:'start', behavior: _prefersReducedMotion() ? 'auto' : 'smooth'});
}
document.addEventListener('click', (e)=>{
  // Choosing something from the "More ways to roll" menu closes it.
  const item = e.target && e.target.closest && e.target.closest('.moreRollsMenu button');
  if (item){ const d = item.closest('details'); if (d) d.open = false; }
});
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
// One debounce timer per search box: a shared one let typing in one box cancel
// another's pending results.
const _searchTimers = {};
function searchTraits(inputId, resultsId){
  const inp = document.getElementById(inputId);
  const box = document.getElementById(resultsId);
  if (!inp || !box) return;
  if (_searchTimers[inputId]) clearTimeout(_searchTimers[inputId]);
  _searchTimers[inputId] = setTimeout(()=>{
    const q = (inp.value||"").trim().toLowerCase();
    // closeSearchResults also resets aria-expanded and aria-activedescendant, which
    // would otherwise keep pointing at options that no longer exist.
    if (q.length < 2){ closeSearchResults(inputId, resultsId); return; }
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
      box.innerHTML = hits.map((t, i)=>
        `<button type="button" class="searchHit" role="option" id="${escAttr(resultsId)}_opt${i}" aria-selected="false" tabindex="-1"`
        + ` ${actAttr('click', 'pickSearchResult', inputId, resultsId, t.id)}>`
        + `<b>${escHTML(t.trait)}</b><span>${escHTML(t.category)} · intensity ${t.intensity}</span>`
        + `<i>${escHTML(t.desc)}</i></button>`).join("")
        + (hits.length >= 40 ? `<div class="searchEmpty">Showing the first 40 matches — keep typing to narrow.</div>` : ``);
    }
    box.style.display = 'block';
    /* This is the most-used advanced control in the app and it had no keyboard path at
       all: no arrows, no Enter, no Escape, and no announcement that anything had
       appeared. A sighted mouse user got an autocomplete; everyone else got a dead
       text field. */
    box.setAttribute('role', 'listbox');
    inp.setAttribute('role', 'combobox');
    inp.setAttribute('aria-expanded', 'true');
    inp.setAttribute('aria-controls', resultsId);
    inp.setAttribute('aria-autocomplete', 'list');
    setSearchActive(inputId, resultsId, hits.length ? 0 : -1);
    srAnnounce(hits.length
      ? `${hits.length}${hits.length >= 40 ? ' or more' : ''} trait${hits.length===1?'':'s'} match. Use the arrow keys to review them.`
      : `No trait matches ${q}.`);
  }, 140);
}

/* Which result is currently active. Kept as aria-activedescendant on the input rather
   than by moving focus, so the user can keep typing to narrow while reviewing. */
const _searchActive = {};
function setSearchActive(inputId, resultsId, idx){
  const inp = document.getElementById(inputId), box = document.getElementById(resultsId);
  if (!inp || !box) return;
  const opts = [...box.querySelectorAll('.searchHit')];
  if (!opts.length){ inp.removeAttribute('aria-activedescendant'); _searchActive[inputId] = -1; return; }
  const i = Math.max(0, Math.min(idx, opts.length - 1));
  opts.forEach((o, n)=>{
    o.setAttribute('aria-selected', n === i ? 'true' : 'false');
    o.classList.toggle('searchHitActive', n === i);
  });
  inp.setAttribute('aria-activedescendant', opts[i].id);
  _searchActive[inputId] = i;
  if (opts[i].scrollIntoView) opts[i].scrollIntoView({block:'nearest'});
}
function closeSearchResults(inputId, resultsId){
  const inp = document.getElementById(inputId), box = document.getElementById(resultsId);
  if (box){ box.innerHTML = ""; box.style.display = 'none'; }
  if (inp){ inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); }
  _searchActive[inputId] = -1;
}
function searchKeydown(e, inputId, resultsId){
  const box = document.getElementById(resultsId);
  if (!box || box.style.display === 'none') return;
  const opts = [...box.querySelectorAll('.searchHit')];
  const cur = _searchActive[inputId] === undefined ? -1 : _searchActive[inputId];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    if (!opts.length) return;
    e.preventDefault();
    setSearchActive(inputId, resultsId, e.key === 'ArrowDown' ? cur + 1 : cur - 1);
  } else if (e.key === 'Home' || e.key === 'End'){
    if (!opts.length) return;
    e.preventDefault();
    setSearchActive(inputId, resultsId, e.key === 'Home' ? 0 : opts.length - 1);
  } else if (e.key === 'Enter'){
    if (cur < 0 || !opts[cur]) return;
    e.preventDefault();
    opts[cur].click();
  } else if (e.key === 'Escape'){
    e.preventDefault();
    closeSearchResults(inputId, resultsId);
    srAnnounce("Suggestions closed.");
  }
}
function pickSearchResult(inputId, resultsId, id){
  const t = TRAITS_BY_ID.get(id);
  const inp = document.getElementById(inputId);
  if (t && inp) inp.value = t.trait;
  closeSearchResults(inputId, resultsId);
  // Focus goes back to the field the selection came from, so the next keystroke lands
  // somewhere predictable whether the pick was made by mouse or by Enter.
  if (inp && inp.focus) inp.focus();
  if (t) srAnnounce(`${t.trait} selected.`);
}

// One shared live region for every short status message — the sheet announcement in
// render.js writes to the same node. Nothing else in the app had a way to say anything
// to a screen reader outside of a full re-render.
function srAnnounce(message){
  const live = document.getElementById('srAnnounce');
  if (live) live.textContent = message;
}
// "Why didn't I get X?" — the inverse of the per-card why? panel.
/* Asks the why-not question from wherever you are, rather than requiring a trip to the
   Constraints panel. Pre-filters the shortlist to the section you asked from, which is
   also what makes a partial name usable: "hushed" matches several traits across the
   bank and usually exactly one inside the section you were looking at. */
async function askWhyNotHere(groupTitle){
  const name = await askForName(`Which trait were you expecting in "${groupTitle}"?`, "");
  if (!name) return;
  const sections = SECTIONS_FOR_GROUP[groupTitle] || null;
  const matches = TRAITS.filter(t=>{
    if (sections && !sections.some(sec => t.section === sec)) return false;
    return t.trait.toLowerCase().includes(name.trim().toLowerCase());
  });
  const pool = matches.length ? matches
    : TRAITS.filter(t => t.trait.toLowerCase().includes(name.trim().toLowerCase()));
  if (!pool.length){ toast(`No trait matching "${name}".`, "warn", 5000); return; }
  if (pool.length > 1 && pool.length <= 8){
    toast(`${pool.length} traits match "${name}" — showing the closest.`, "warn", 4000);
  }
  // Shortest name containing the query is almost always the one meant.
  const t = pool.slice().sort((a,b)=> a.trait.length - b.trait.length)[0];
  const out = document.getElementById('whyNotResult');
  const inp = document.getElementById('whyNotSearch');
  if (inp) inp.value = t.trait;
  if (out){
    out.innerHTML = `<div class="whyNote"><b>${escHTML(t.trait)}</b> — ${escHTML(t.category)}<div data-st="margin-top:6px;">${explainWhyNot(t)}</div></div>`;
    out.style.display = 'block';
  }
  // Show it where it was asked, not two tabs away.
  toastHTML(`<b>${escHTML(t.trait)}</b> — ${escHTML(t.category)}<div data-st="margin-top:5px;">${explainWhyNot(t)}</div>`, 14000);
}

function explainWhyNotFromInput(){
  const inp = document.getElementById('whyNotSearch');
  const out = document.getElementById('whyNotResult');
  if (!inp || !out) return;
  const t = findTraitByName(inp.value);
  if (!t){ out.innerHTML = `<div class="whyExcl">No trait matches that name.</div>`; out.style.display='block'; return; }
  if (t.ambiguous){
    // Ambiguity is useful here rather than an error: show the matches as a shortlist.
    const list = t.ambiguous.slice(0, 8).map(x=>`<li>${escHTML(x.trait)} <span class="sub">— ${escHTML(x.category)}</span></li>`).join("");
    out.innerHTML = `<div class="whyNote"><b>${t.ambiguous.length} traits match that.</b> Type more of a name to pick one:<ul data-st="margin:6px 0 0 18px;">${list}</ul></div>`;
    out.style.display = 'block'; return;
  }
  out.innerHTML = `<div class="whyNote"><b>${escHTML(t.trait)}</b> — ${escHTML(t.category)}<div data-st="margin-top:6px;">${explainWhyNot(t)}</div></div>`;
  out.style.display = 'block';
}

/* ================= KEYBOARD =================
   The undo stack, the reroll loop, and Generate were all mouse-only. */
function wireKeyboard(){
  document.addEventListener('keydown', (e)=>{
    const t = e.target || {};
    const tag = (t.tagName || "").toLowerCase();
    /* B20: contenteditable and <summary> are text/controls too — a bare R there
       belongs to the element, not to the reroll shortcut. */
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || !!t.isContentEditable;
    // B8: an open modal dialog owns the keyboard; nothing here may reach the sheet.
    const inDialog = !!(t.closest && t.closest('dialog[open]')) || !!document.querySelector('dialog[open]');
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'Enter'){
      if (inDialog || tag === 'textarea') return;
      e.preventDefault(); generateCharacter(); return;
    }
    // Ctrl/Cmd+S keeps the character instead of asking the browser to save the page.
    if (mod && (e.key === 's' || e.key === 'S') && !e.shiftKey){
      if (inDialog) return;
      e.preventDefault(); if (Object.keys(state).length) saveCharacter(null); else toast("Nothing to save yet — build a character first.", "warn"); return;
    }
    // Esc closes the menus that open over the page.
    if (e.key === 'Escape'){
      let closed = false;
      const fm = document.getElementById('fileMenu'); if (fm && fm.open){ fm.open = false; closed = true; }
      const mr = document.getElementById('moreRolls'); if (mr && mr.open){ mr.open = false; closed = true; }
      const sx = document.getElementById('stickyExtra'); if (sx && sx.classList.contains('open')){ toggleStickyMore(); closed = true; }
      if (closed) return;
    }
    // Shift+Ctrl/Cmd+Z and Ctrl/Cmd+Y are the two conventions; support both.
    if (mod && ((e.key === 'z' || e.key === 'Z') && e.shiftKey || e.key === 'y' || e.key === 'Y')){
      if (typing || inDialog) return;     // B8: text fields keep their own redo
      e.preventDefault(); redoLast(); return;
    }
    if (mod && (e.key === 'z' || e.key === 'Z') && !e.shiftKey){
      if (typing || inDialog) return;     // don't steal undo from a text field
      e.preventDefault(); undoLast(); return;
    }
    if (typing || inDialog || mod || e.altKey) return;
    if (e.key === '?'){ openShortcuts(); return; }
    // 1 / 2 / 3 switch tab; / goes to the trait search. Neither does anything on a focused control.
    if (e.key === '1' || e.key === '2' || e.key === '3'){ switchTab(['single', 'cast', 'rel'][+e.key - 1]); return; }
    if (e.key === '/'){
      e.preventDefault();
      const adv = document.getElementById('advancedToggle');
      if (adv && !adv.checked){ adv.checked = true; applyAdvancedMode(); }
      if (typeof setInputsCollapsed === 'function') setInputsCollapsed(false);
      const inp = document.getElementById('constraintTraitSearch');
      if (inp){ const d = inp.closest('details'); if (d) d.open = true; inp.focus(); inp.scrollIntoView({block:'center'}); }
      return;
    }
    if (tag === 'summary' || tag === 'button' || tag === 'a') {
      // A focused control inside a card still counts as "this card"; anywhere else a
      // letter key belongs to the control (and Space/Enter are its activation keys).
      if (!(t.closest && t.closest('.traitCard[data-slot]'))) return;
    }
    const k = e.key.toLowerCase();
    if (k !== 'r' && k !== 'l' && k !== 'p') return;
    // B9: the focused card first (keyboard and touch), the hovered one as a fallback.
    const card = (t.closest && t.closest('.traitCard[data-slot]')) ||
                 document.querySelector('#sheet .traitCard[data-slot]:focus-within') ||
                 document.querySelector('.traitCard[data-slot]:hover');
    if (!card) return;
    const slot = card.getAttribute('data-slot');
    const btn = card.querySelector(k === 'r' ? '.rerollBtn:not(.backBtn)' : k === 'l' ? '.lockBtn' : '.pinBtn');
    if (!btn) return;
    e.preventDefault();
    btn.click();
    // The card is replaced by the re-render; put focus back on its successor and say
    // what happened, since a screen-reader user cannot see the card change.
    requestAnimationFrame(()=>{
      const sel = '.traitCard[data-slot="' + (window.CSS && CSS.escape ? CSS.escape(slot) : slot) + '"]';
      const next = document.querySelector(sel);
      if (next && document.activeElement !== next && !next.contains(document.activeElement)) next.focus({preventScroll:true});
      const sl = state[slot];
      if (sl && sl.trait) srAnnounce(k === 'r' ? `Tossed. Now: ${sl.trait.trait}.` : k === 'p' ? `${sl.trait.trait} intensity ${pinnedTargets[slot] !== undefined ? 'pinned' : 'unpinned'}.` : `${sl.trait.trait} ${sl.locked ? 'kept' : 'released'}.`);
    });
  });
}

/* ================= FILE MENU =================
   Five separate Import buttons, each a <label> around a display:none file input (which
   the keyboard could not reach — B3), each accepting exactly one of the app's JSON
   shapes and rejecting the others with "Not a … file". One "Open file…" reads the
   `format` stamp every exporter already writes and hands the file to the importer that
   owns it, so the validators and staged commits are the existing ones. */
const FILE_IMPORTERS = {
  "character-voice-sheet":      {label: "character",         fn: ()=> importCharacterJSON},
  "character-voice-workspace":  {label: "workspace",         fn: ()=> importWorkspaceJSON},
  "character-voice-archetypes": {label: "archetype library", fn: ()=> importArchetypes},
  "character-voice-cast":       {label: "cast",              fn: ()=> importCastJSON},
  "character-voice-backup":     {label: "backup bundle",     fn: ()=> importBackupBundle},
};
function detectFileKind(p){
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  if (typeof p.format === 'string' && FILE_IMPORTERS[p.format]) return p.format;
  // Shape fallbacks for files that lost their stamp (hand-edited, older tools).
  if (Array.isArray(p.members)) return "character-voice-cast";
  if (p.state && typeof p.state === 'object') return "character-voice-sheet";
  if (Array.isArray(p.projects)) return "character-voice-backup";
  return null;
}
function openFilePicker(){
  const inp = document.getElementById('fileMenuInput');
  closeFileMenu();
  if (inp) inp.click();
}
function closeFileMenu(){
  const m = document.getElementById('fileMenu');
  if (m) m.open = false;
}
async function importAnyFile(fileInput){
  const file = fileInput && fileInput.files && fileInput.files[0];
  if (!file) return;
  const text = await file.text().catch(()=>null);
  fileInput.value = "";
  if (text === null){ toast("Could not read that file.", "warn"); return; }
  let p;
  try { p = JSON.parse(text); } catch(e){ toast("That file is not JSON, so it is not one of this app's exports.", "warn", 6000); return; }
  const kind = detectFileKind(p);
  if (!kind){ toast("That JSON file is not a character, cast, workspace, archetype library or backup from this app.", "warn", 7000); return; }
  // Re-stamp a shape-detected file so the owning importer's format check passes.
  if (p.format !== kind){ p = Object.assign({}, p, {format: kind}); }
  const blob = new File([JSON.stringify(p)], file.name, {type: 'application/json'});
  // The existing importers take a file input; give them one that holds this file.
  const shim = {files: [blob], value: ""};
  toast(`Opening ${file.name} as a ${FILE_IMPORTERS[kind].label}…`);
  return FILE_IMPORTERS[kind].fn()(shim);
}
// Close the File menu on a pick, on a click elsewhere, and on Escape.
document.addEventListener('click', (e)=>{
  const m = document.getElementById('fileMenu');
  if (!m || !m.open) return;
  if (!m.contains(e.target) || (e.target.closest && e.target.closest('.fileMenuList button'))) m.open = false;
});
document.addEventListener('keydown', (e)=>{
  const m = document.getElementById('fileMenu');
  if (e.key === 'Escape' && m && m.open){ m.open = false; const s = m.querySelector('summary'); if (s) s.focus(); }
});

/* ================= SHARE LINK =================
   The seed plus the settings that shape a build, in the URL hash. Opening the link
   replays the character without a file changing hands. Hash, not query: it never
   reaches a server log, and the service worker's cache key is unaffected. */
function _b64urlEncode(str){
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function _b64urlDecode(s){
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}
function shareLinkFor(){
  if (!lastSeedUsed) return null;
  const settings = captureSettings();
  delete settings.rerollExclusions;
  // Saved traits only shape a draw when the boost is on; then the link must carry them to replay.
  if (!favouriteBoostEnabled()) delete settings.favouriteTraitIds;
  // Name/age/context travel so the replay lands in the same world; the seed field
  // itself is carried separately.
  if (settings.fields) delete settings.fields.seedInput;
  /* Kept cards are seated before anything is drawn (finalizeSheet, carryLocked), so a
     sheet built around them is only replayable with them. They travel with the link. */
  const locked = {};
  Object.entries(state || {}).forEach(([k, s2]) => { if (s2 && s2.locked && s2.trait) locked[k] = s2; });
  const payload = {v: 1, seed: lastSeedUsed, settings};
  if (Object.keys(locked).length) payload.locked = compressSlots(locked);
  const url = location.href.split('#')[0];
  return url + '#share=' + _b64urlEncode(JSON.stringify(payload));
}
function copyShareLink(btnEl){
  closeFileMenu();
  const link = shareLinkFor();
  if (!link){ toast("Generate a character first — the link carries its seed.", "warn"); return; }
  copyText(link, btnEl);
  toast("Share link copied. Opening it replays this character with these settings.");
}
const SHARE_LINK_VERSION = 1;
const SEED_CODEC_VERSION = parseInt(String(SEED_PREFIX).replace(/\D/g, ''), 10) || 1;
function readShareFromHash(hash){
  const m = /(?:^#|&)share=([A-Za-z0-9_-]+)/.exec(hash || "");
  // "#share=" with nothing usable after it (or characters a link never contains) is a damaged
  // link, not no link: say so instead of showing the ordinary first-run page.
  if (!m){ if (/(?:^#|&)share=/.test(hash || "")) throw new Error("the link is incomplete or damaged."); return null; }
  const p = JSON.parse(_b64urlDecode(m[1]));
  if (!p || typeof p !== 'object' || typeof p.seed !== 'string' || !p.seed.trim()) throw new Error("the link has no seed.");
  /* Links carry a version and the seed carries the codec's: a link from another build of the app
     cannot replay faithfully, and used to produce a different character under the same words. */
  if (p.v !== undefined && p.v !== SHARE_LINK_VERSION)
    throw new Error(`it was made by ${p.v > SHARE_LINK_VERSION ? 'a newer' : 'an older'} version of this app (link version ${p.v}; this one reads version ${SHARE_LINK_VERSION}), so it cannot bring back the same character. Ask for a fresh link from the current version.`);
  const sv = /^v(\d+)-/.exec(p.seed);
  if (sv && !SUPPORTED_SEED_VERSIONS.includes(+sv[1]))
    throw new Error(`its seed is in format v${sv[1]}, but this version of the app reads v${SUPPORTED_SEED_VERSIONS.join(' and v')}, so the seed would build a different person.`);
  if (p.settings != null && (typeof p.settings !== 'object' || Array.isArray(p.settings))) throw new Error("the link's settings are malformed.");
  // The same structural check an imported file gets, BEFORE anything is applied — a
  // malformed constraint block used to clear the recipient's own bans and then throw.
  if (p.settings && typeof validateSheetPayload === 'function') validateSheetPayload({settings: p.settings});
  if (p.locked != null){
    if (typeof p.locked !== 'object' || Array.isArray(p.locked)) throw new Error("the link's kept cards are malformed.");
    const exp = expandSlots(p.locked) || {};
    Object.values(exp).forEach(s2 => {
      if (!s2 || !s2.trait || !TRAITS_BY_ID.get(s2.trait.id)) throw new Error("the link keeps a card this bank does not have.");
      s2.trait = TRAITS_BY_ID.get(s2.trait.id);
    });
    p.locked = exp;
  }
  return p;
}
function applyShareFromHash(){
  if (typeof location === 'undefined' || !location.hash) return false;   // node harness, or no link
  let p;
  try { p = readShareFromHash(location.hash); }
  catch(e){ toast("That share link could not be read: " + e.message, "warn", 7000); return false; }
  if (!p) return false;
  /* The link's settings replace the recipient's own (the replay needs them), so the
     workspace is snapshotted first: Undo gives the recipient their settings back, and a
     failure part-way restores them rather than leaving half of each. */
  const before = captureSettings();
  const snap = _snapshotNow();
  try {
    if (p.settings) restoreSettings(p.settings);
    applyAdvancedMode();
    setVal('seedInput', p.seed);
    noteLoadedEngine(p.seed, p.settings);
    onSliderChange();
    // Seat the link's kept cards exactly as the sender had them.
    state = p.locked ? p.locked : {};
    runGeneration();
    // The build pushed a snapshot of the half-applied workspace; undo should land on
    // the recipient's own sheet and settings instead.
    if (history.length) history[history.length - 1] = snap;
  } catch(e){
    state = expandSlots(snap.state) || {};
    try { restoreSettings(before); } catch(e2){}
    toast("That share link could not be opened: " + (e && e.message || e), "warn", 7000);
    return false;
  } finally {
    // The seed replayed once; left in the field, every later roll would be the same one.
    setVal('seedInput', '');
    // window.history: the bare name is the undo stack (engine.js).
    try { window.history.replaceState(null, '', location.href.split('#')[0]); } catch(e){}
  }
  toast(`Opened a shared character (seed ${p.seed}). It came with its own settings — Undo puts yours back.`, "ok", 7000);
  markOnboarded();
  return true;
}

/* ================= COMPARE WITH SAVED =================
   Comparison only existed inside a cast, so "is this new one just the one I saved last
   week?" meant adding both to the cast. This lays a save beside the current sheet,
   slot by slot, without touching either. */
async function compareWithSaved(name){
  if (!Object.keys(state).length){ toast("Generate a character first, then compare it with a save.", "warn"); return; }
  const host = document.getElementById('comparePanel');
  if (!host) return;
  try {
    const r = await storage.get('character:'+name);
    if (!r || !r.value) throw new Error(`there is no saved character called "${name}" any more.`);
    const rec = decodeSavedRecord(JSON.parse(r.value), name);
    host.innerHTML = compareSheetsHTML(state, charMeta.name || "This sheet", rec.state || {}, name);
    host.style.display = 'block';
    host.scrollIntoView({block:'nearest'});
    const h = host.querySelector('h3'); if (h) h.focus({preventScroll:true});
  } catch(e){ console.error(e); toast("Could not compare: " + e.message, "warn", 6000); }
}
function closeCompare(){
  const host = document.getElementById('comparePanel');
  if (host){ host.style.display = 'none'; host.innerHTML = ''; }
}
function compareSheetsHTML(a, aName, b, bName){
  const idsOf = st => new Set(Object.values(st).filter(s=>s && s.trait).map(s=>s.trait.id));
  const A = idsOf(a), B = idsOf(b);
  const shared = [...A].filter(id => B.has(id)).length;
  const union = new Set([...A, ...B]).size || 1;
  const slots = [...new Set(Object.keys(a).concat(Object.keys(b)))].filter(k => (a[k] && a[k].trait) || (b[k] && b[k].trait));
  let same = 0;
  const rows = slots.map(k=>{
    const x = a[k] && a[k].trait, y = b[k] && b[k].trait;
    const eq = x && y && x.id === y.id;
    if (eq) same++;
    const label = (a[k] && a[k].label) || (b[k] && b[k].label) || k;
    const cell = (t, has) => t ? `<span class="${has ? 'cmpShared' : ''}">${escHTML(t.trait)}</span>` : `<span class="sub">—</span>`;
    return `<tr class="${eq ? 'cmpSame' : 'cmpDiff'}"><th scope="row">${escHTML(label)}</th><td>${cell(x, x && B.has(x.id))}</td><td>${cell(y, y && A.has(y.id))}</td></tr>`;
  }).join("");
  return `<div class="compareHead"><h3 tabindex="-1">${escHTML(aName)} vs ${escHTML(bName)}</h3>` +
    `<button class="savedAct" ${actAttr('click', 'closeCompare')}>close</button></div>` +
    `<div class="sub">${shared} trait${shared===1?'':'s'} in common (${Math.round(100*shared/union)}% overlap) · ${same} of ${slots.length} slots identical. ` +
    `<span class="cmpShared">Underlined</span> traits appear on both sheets, in any slot.</div>` +
    `<div class="compareScroll"><table class="compareTable"><thead><tr><th scope="col">Slot</th><th scope="col">${escHTML(aName)}</th><th scope="col">${escHTML(bName)}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ================= SAVED LIBRARY SEARCH & SORT ================= */
function applySavedFilter(){
  const q = ((document.getElementById('savedFilter')||{}).value || "").trim().toLowerCase();
  const rows = document.querySelectorAll('#savedList .savedRow');
  let shown = 0;
  rows.forEach(r=>{
    const hit = !q || (r.getAttribute('data-search') || "").includes(q);
    r.hidden = !hit; if (hit) shown++;
  });
  const none = document.getElementById('savedNone');
  if (none) none.hidden = !(q && rows.length && !shown);
}
function onSavedSortChange(){ loadSavedList(); if (typeof savePrefs === 'function') savePrefs(); }

/* ================= WHY DOES THIS FEEL FAMILIAR? =================
   recurringTraits (engine.js) has always known which traits keep coming back across
   the recent window; nothing showed it. Each row offers the existing ban constraint. */
function renderFamiliar(){
  const host = document.getElementById('familiarBody');
  if (!host) return;
  const rows = (typeof recurringTraits === 'function') ? recurringTraits(2) : [];
  if (!rows.length){
    host.innerHTML = `<div class="sub">Nothing is repeating yet. This fills in after a few characters, once the same trait has turned up in more than one of them.</div>`;
    return;
  }
  host.innerHTML = `<ul class="familiarList">` + rows.map(r=>{
    const banned = bannedTraitIds.has(r.trait.id);
    return `<li><div><b>${escHTML(r.trait.trait)}</b> <span class="sub">— ${escHTML(r.trait.category)}</span>` +
      `<div class="sub">in ${r.count} of your last ${r.window} characters</div></div>` +
      `<button class="savedAct${banned ? '' : ' savedDel'}" ${actAttr('click', 'familiarBan', r.trait.id)}>${banned ? 'allow again' : 'ban'}</button></li>`;
  }).join("") + `</ul><div class="sub">"Avoid recent" already down-weights these; a ban removes one for good (undo it from Constraints or here).</div>`;
}
function familiarBan(id){ banTrait(id); renderFamiliar(); }
function onFamiliarToggle(el){ if (el && el.open) renderFamiliar(); }

/* Inputs fold on a phone. A 34,000px page is mostly the controls; after a build the person
   wants the sheet, so the inputs collapse to a one-line recap with a way back. */
function _narrowScreen(){ return typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches; }
function inputsRecapText(){
  const arch = document.getElementById('archetypeSelect');
  const label = arch && arch.value && arch.selectedOptions[0] ? arch.selectedOptions[0].textContent : 'No archetype';
  const rules = typeof activeRuleChips === 'function' ? activeRuleChips().length : 0;
  const lenses = typeof activeLensIds === 'function' ? activeLensIds().length : 0;
  return [label, lenses ? lenses + ' lens' + (lenses === 1 ? '' : 'es') : null, rules ? rules + ' rule' + (rules === 1 ? '' : 's') + ' in force' : null].filter(Boolean).join(' · ');
}
function setInputsCollapsed(on){
  const view = document.getElementById('view-single'), bar = document.getElementById('inputsBar'), btn = document.getElementById('inputsToggle');
  if (!view || !bar) return;
  view.classList.toggle('inputsCollapsed', !!on);
  bar.hidden = !Object.keys(state).length;
  const rc = document.getElementById('inputsRecap'); if (rc) rc.textContent = inputsRecapText();
  if (btn){ btn.setAttribute('aria-expanded', String(!on)); btn.textContent = on ? 'Edit inputs ▾' : 'Hide inputs ▴'; }
}
function collapseInputsAfterBuild(){ if (_narrowScreen()) setInputsCollapsed(true); }
function toggleInputs(){
  const view = document.getElementById('view-single');
  const collapsed = !!(view && view.classList.contains('inputsCollapsed'));
  setInputsCollapsed(!collapsed);
  if (collapsed){ const c = document.getElementById('controlsStart'); if (c && c.scrollIntoView) c.scrollIntoView({block:'start'}); }
}
/* The shortcuts were a folded paragraph in the help panel. A real dialog, opened by ?. */
function openShortcuts(){
  const d = document.getElementById('shortcutDialog');
  if (!d) return;
  if (d.open){ d.close(); return; }
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
}
function closeShortcuts(){ const d = document.getElementById('shortcutDialog'); if (d && d.open) d.close(); }
/* Theme: the CSS already answers `data-theme` and the system setting; nothing let you choose.
   Auto follows the system, Light and Dark override it, and the choice is remembered. */
const THEME_KEY = 'ui:theme', THEME_MODES = ['auto', 'light', 'dark'];
let themeMode = 'auto';
function applyTheme(mode){
  themeMode = THEME_MODES.includes(mode) ? mode : 'auto';
  const root = document.documentElement;
  if (themeMode === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', themeMode);
  const label = document.getElementById('themeLabel'), btn = document.getElementById('themeBtn');
  const name = {auto:'Auto', light:'Light', dark:'Dark'}[themeMode];
  if (label) label.textContent = name;
  if (btn){
    btn.setAttribute('aria-label', 'Colour theme: ' + name.toLowerCase());
    btn.title = 'Colour theme: ' + name.toLowerCase() + (themeMode === 'auto' ? ' (follows your system)' : '') + '. Click to change.';
  }
}
function cycleTheme(){
  applyTheme(THEME_MODES[(THEME_MODES.indexOf(themeMode) + 1) % THEME_MODES.length]);
  try { storage.set(THEME_KEY, themeMode); } catch(e){}
}
async function loadTheme(){
  try { const r = await storage.get(THEME_KEY); if (r && r.value) applyTheme(r.value); else applyTheme('auto'); } catch(e){ applyTheme('auto'); }
}
// The seed chip in the sticky bar copies the seed; the seed promises the character (README).
function copySeed(){
  if (!lastSeedUsed){ toast("No character yet — build one and its seed appears here.", "warn"); return; }
  copyText(lastSeedUsed, null);
  toast("Seed " + lastSeedUsed + " copied. Paste it into the seed box to get this character back.");
}
// The ⋯ button folds the secondary sticky-bar actions away on a phone.
function toggleStickyMore(){
  const btn = document.getElementById('stickyMoreBtn'), box = document.getElementById('stickyExtra');
  if (!btn || !box) return;
  const open = !box.classList.contains('open');
  box.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', String(open));
}
document.addEventListener('click', (e)=>{
  const box = document.getElementById('stickyExtra');
  if (!box || !box.classList.contains('open')) return;
  const inside = e.target.closest && e.target.closest('#stickyExtra');
  const isBtn = e.target.closest && e.target.closest('#stickyMoreBtn');
  if (isBtn) return;
  if (!inside || e.target.closest('#stickyExtra button')) toggleStickyMore();
});
/* ================= NAMED SLIDER SETS =================
   Sixteen sliders, saved under a name. Lighter than the custom archetype builder, which
   also stores constraints, counts and section toggles. */
const SLIDERSET_PREFIX = 'sliderset:';
async function loadSliderPresets(){
  const sel = document.getElementById('sliderPresetSelect');
  if (!sel) return;
  const keep = sel.value;
  let names = [];
  try { const r = await storage.list(SLIDERSET_PREFIX); names = ((r && r.keys) || []).map(k => k.slice(SLIDERSET_PREFIX.length)).sort((a, b) => a.localeCompare(b)); } catch(e){}
  sel.innerHTML = `<option value="">Slider sets…</option>` + names.map(n => `<option value="${escAttr(n)}">${escHTML(n)}</option>`).join("");
  if (names.includes(keep)) sel.value = keep;
}
async function saveSliderPreset(){
  const name = await askForName("Name this slider set:", "");
  if (!name || !name.trim()) return;
  const n = name.trim().slice(0, 60);
  try {
    await storage.set(SLIDERSET_PREFIX + n, JSON.stringify({format: "character-voice-sliders", sliders: captureSliders(), savedAt: new Date().toISOString()}));
    await loadSliderPresets();
    const sel = document.getElementById('sliderPresetSelect'); if (sel) sel.value = n;
    toast(`Saved the sliders as "${n}".`);
  } catch(e){ toast("Could not save the slider set.", "warn"); }
}
async function applySliderPreset(){
  const sel = document.getElementById('sliderPresetSelect');
  if (!sel || !sel.value){ toast("Pick a slider set first.", "warn"); return; }
  let rec = null;
  try { const r = await storage.get(SLIDERSET_PREFIX + sel.value); rec = r && JSON.parse(r.value); } catch(e){}
  if (!rec || !rec.sliders){ toast("That slider set could not be read.", "warn"); return; }
  const before = captureSliders(), name = sel.value;
  // Locked sliders keep their value: the lock means "leave this one alone".
  const next = {}; Object.entries(rec.sliders).forEach(([id, v]) => { if (!isSliderLocked(id)) next[id] = v; });
  restoreSliders(next); invalidateSliderCache(); onSliderChange();
  toastUndo(`Loaded "${name}".`, ()=>{ restoreSliders(before); invalidateSliderCache(); onSliderChange(); });
}
async function deleteSliderPreset(){
  const sel = document.getElementById('sliderPresetSelect');
  if (!sel || !sel.value){ toast("Pick a slider set first.", "warn"); return; }
  const name = sel.value; let raw = null;
  try { const r = await storage.get(SLIDERSET_PREFIX + name); raw = r && r.value; } catch(e){}
  try { await storage.delete(SLIDERSET_PREFIX + name); } catch(e){ toast("Could not delete it.", "warn"); return; }
  await loadSliderPresets();
  toastUndo(`Deleted the slider set "${name}".`, async ()=>{ if (raw) await storage.set(SLIDERSET_PREFIX + name, raw); await loadSliderPresets(); }, 10000);
}
/* Reduce motion: the system setting was honoured; a switch in the page lets you choose it
   here too. Remembered between visits (ui:reduceMotion). */
function applyReduceMotion(on){
  document.body.classList.toggle('reduce-motion', !!on);
  const el = document.getElementById('reduceMotionToggle'); if (el) el.checked = !!on;
}
function toggleReduceMotion(){
  const el = document.getElementById('reduceMotionToggle');
  applyReduceMotion(!!(el && el.checked));
  try { storage.set('ui:reduceMotion', el && el.checked ? '1' : ''); } catch(e){}
}
async function loadReduceMotion(){
  try { const r = await storage.get('ui:reduceMotion'); if (r && r.value) applyReduceMotion(true); } catch(e){}
}
// The boost is part of the workspace: changing it re-saves, and the pool of saved traits is unchanged.
function onFavouriteBoostChange(){ if (typeof onSliderChange === 'function') onSliderChange(); if (typeof savePrefs === 'function') savePrefs(); }
// Plain-language hints that work on tap: a title= tooltip never shows on a phone.
function toggleTip(btn){
  const t = btn && btn.nextElementSibling;
  if (!t || !t.classList.contains('tipText')) return;
  const open = t.hidden;
  t.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
}
/* ================= BACKUP REMINDER AND UNSAVED-WORK GUARD =================
   Work lives in this browser's storage, which a cleared cache or a new machine loses. After
   two weeks without a backup the page says so once, with a button. Closing the tab with
   kept cards, pins, an arc or a cast that were never saved or exported asks first. */
const BACKUP_KEY = 'ui:lastBackup', BACKUP_SNOOZE_KEY = 'ui:backupSnooze', BACKUP_DAYS = 14;
async function markBackedUp(){ try { await storage.set(BACKUP_KEY, String(Date.now())); } catch(e){} hideBackupReminder(); }
function hideBackupReminder(){ const b = document.getElementById('backupReminder'); if (b) b.hidden = true; }
async function checkBackupReminder(){
  const box = document.getElementById('backupReminder');
  if (!box) return;
  let saved = 0, last = 0, snooze = 0;
  try { const r = await storage.list('character:'); saved = ((r && r.keys) || []).length; } catch(e){}
  saved += (typeof projects !== 'undefined') ? projects.length : 0;
  try { const r = await storage.get(BACKUP_KEY); last = r ? +r.value || 0 : 0; } catch(e){}
  try { const r = await storage.get(BACKUP_SNOOZE_KEY); snooze = r ? +r.value || 0 : 0; } catch(e){}
  const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
  const due = saved > 0 && (days === null || days >= BACKUP_DAYS) && Date.now() > snooze;
  box.hidden = !due;
  const t = document.getElementById('backupReminderText');
  if (due && t) t.textContent = days === null
    ? `You have ${saved} saved item${saved === 1 ? '' : 's'} in this browser and no backup yet.`
    : `Your last backup was ${days} days ago.`;
}
function snoozeBackupReminder(){
  try { storage.set(BACKUP_SNOOZE_KEY, String(Date.now() + 7 * 86400000)); } catch(e){}
  hideBackupReminder();
}
async function backupNow(){ await exportBackupBundle(); }
// What would be lost: anything the writer invested effort in that has not been filed anywhere.
function workSignature(){
  const cards = Object.keys(state || {}).sort().map(k => { const s = state[k]; return s && s.trait ? [k, s.trait.id, !!s.locked] : null; });
  return JSON.stringify([cards, pinnedTargets, traitNotes, charMeta && [charMeta.name, charMeta.label, charMeta.contradictionAnswers], (typeof arcEvents !== 'undefined') ? arcEvents.length : 0, castStates.map(c => c.id + ':' + (c.meta && c.meta.name))]);
}
let _savedWorkSignature = null;
function markWorkSaved(){ _savedWorkSignature = workSignature(); }
function hasUnsavedInvestment(){
  const kept = Object.values(state || {}).some(s => s && s.locked);
  const invested = kept || Object.keys(pinnedTargets || {}).length || Object.keys(traitNotes || {}).length
    || (typeof arcEvents !== 'undefined' && arcEvents.length) || castStates.length || (charMeta && (charMeta.label || charMeta.contradictionAnswers));
  return !!invested && workSignature() !== _savedWorkSignature;
}
if (typeof window !== 'undefined' && window.addEventListener){
  window.addEventListener('beforeunload', (e)=>{
    if (!hasUnsavedInvestment()) return;
    e.preventDefault(); e.returnValue = "";   // the browser shows its own wording
  });
}

/* ================= HISTORY DRAWER AND ROLL COMPARISON =================
   The undo stack already holds the last rolls, but the only way into it was Undo, one step
   at a time, blind. The drawer lists them, restores any one (through the same Undo and Redo
   the buttons use, so a restore is itself undoable) and compares one with what is on screen. */
function _ago(ts){
  if (!ts) return "";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  return s < 45 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : Math.round(s / 3600) + " h ago";
}
function historyEntries(){
  return history.map((snap, i) => ({
    i, at: snap.at, name: (snap.charMeta && snap.charMeta.name) || "Unnamed Character",
    arch: (snap.charMeta && snap.charMeta.archetypeLabel) || "", seed: (snap.charMeta && snap.charMeta.seed) || "",
    cards: Object.keys(snap.state || {}).length,
  })).reverse();
}
function renderHistoryDrawer(){
  const host = document.getElementById('historyDrawer');
  if (!host || host.hidden) return;
  const cur = Object.keys(state).length
    ? `<li class="histNow"><b>${escHTML(charMeta.name || "Unnamed Character")}</b> <span class="sub">on screen now${charMeta.seed ? " · seed " + escHTML(charMeta.seed) : ""} · ${Object.keys(state).length} cards</span></li>` : "";
  const rows = historyEntries().map(e => `<li><span><b>${escHTML(e.name)}</b> <span class="sub">${escHTML(e.arch)}${e.seed ? " · seed " + escHTML(e.seed) : ""} · ${e.cards} cards · ${escHTML(_ago(e.at))}</span></span>
      <span class="histBtns"><button type="button" class="savedAct" ${actAttr('click', 'restoreHistoryAt', e.i)}>restore</button>
      <button type="button" class="savedAct" ${actAttr('click', 'compareWithHistory', e.i)}>compare</button></span></li>`).join("");
  host.innerHTML = `<div class="histHead"><b>Recent rolls</b> <span class="sub">newest first · the last ${HISTORY_MAX} are kept</span>
    <button type="button" class="savedAct" ${actAttr('click', 'toggleHistoryDrawer')}>close</button></div>
    <ul class="histList">${cur}${rows || `<li class="sub">Nothing earlier yet — build a few and they collect here.</li>`}</ul>`;
}
function toggleHistoryDrawer(){
  const host = document.getElementById('historyDrawer'), btn = document.getElementById('historyBtn');
  if (!host) return;
  host.hidden = !host.hidden;
  if (btn) btn.setAttribute('aria-expanded', String(!host.hidden));
  renderHistoryDrawer();
}
function restoreHistoryAt(i){
  if (!(i >= 0 && i < history.length)) return;
  const steps = history.length - i;
  for (let k = 0; k < steps; k++) undoLast(true);
  renderHistoryDrawer();
  toastUndo("Restored an earlier roll.", ()=>{ for (let k = 0; k < steps; k++) redoLast(true); renderHistoryDrawer(); });
}
const _SLIDER_NAMES = {verbositySlider: "Verbosity", registerSlider: "Register", composureSlider: "Composure"};
function sliderDiffHTML(before, after){
  const name = id => _SLIDER_NAMES[id] || ((PERSONALITY_AXES.find(a => 'pers_' + a.id === id) || {}).label) || id;
  const ids = [...new Set(Object.keys(before || {}).concat(Object.keys(after || {})))];
  const rows = ids.filter(id => String((before || {})[id]) !== String((after || {})[id]))
    .map(id => `<li><b>${escHTML(name(id))}</b> ${escHTML(String((before || {})[id] ?? "—"))} → ${escHTML(String((after || {})[id] ?? "—"))}</li>`);
  return `<div class="sub" data-st="margin:10px 0 4px;"><b>Sliders</b> ${rows.length ? `— ${rows.length} moved` : "— unchanged"}</div>` + (rows.length ? `<ul class="sliderDiff">${rows.join("")}</ul>` : "");
}
// Two rolls side by side: the earlier one from the drawer against the sheet on screen.
function compareWithHistory(i){
  const snap = history[i];
  if (!snap || !Object.keys(state).length) return;
  const host = document.getElementById('comparePanel');
  if (!host) return;
  const past = expandSlots(snap.state) || {};
  const pastName = (snap.charMeta && snap.charMeta.name || "Earlier roll") + (snap.charMeta && snap.charMeta.seed ? " (" + snap.charMeta.seed + ")" : "");
  const nowName = (charMeta.name || "On screen") + (charMeta.seed ? " (" + charMeta.seed + ")" : "");
  host.innerHTML = compareSheetsHTML(past, pastName, state, nowName) + sliderDiffHTML(snap.sliders, lastGeneratedSliders || captureSliders());
  host.style.display = 'block';
  const h = host.querySelector('h3'); if (h){ h.scrollIntoView({block: 'nearest'}); h.focus({preventScroll: true}); }
}

/* ================= SHEET NAV AND FIRST-CARD HINT =================
   Everything under the sheet — Pressure, Voice lab, Arc, "Why does this feel familiar?",
   the Project library — was reachable only by scrolling past ~37 cards. The nav goes to
   each, opening a folded panel on the way. The hint explains keep / pin / toss once. */
function jumpToPanel(id){
  const el = document.getElementById(id);
  if (!el || el.style.display === 'none'){
    // A pointer to where to go, not a warning that waits to be dismissed: it used to sit on screen over the
    // next click's result, which had worked.
    toast(id === 'pressureSheet' ? "The pressure sheet is off. Switch on “Under pressure” and build to see it." : "Build a character first, then this part appears.", "ok", 4200);
    return;
  }
  if (el.tagName === 'DETAILS') el.open = true;
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
  if (el.tabIndex < 0 || el.hasAttribute('tabindex')) { try { el.focus({preventScroll:true}); } catch(e){} }
}
// Nav buttons that need something absent (the pressure sheet, before it is switched on) are dimmed.
function refreshSheetNav(){
  document.querySelectorAll('#sheetNav [data-needs]').forEach(b=>{
    const t = document.getElementById(b.getAttribute('data-needs'));
    const on = !!t && t.style.display !== 'none';
    b.classList.toggle('dim', !on); b.setAttribute('aria-disabled', String(!on));
  });
}
const COACH_KEY = 'ui:coach';
let _coachSeen = null;
async function refreshCoachMark(){
  const box = document.getElementById('coachMark');
  if (!box) return;
  if (_coachSeen === null){
    try { const r = await storage.get(COACH_KEY); _coachSeen = !!(r && r.value); } catch(e){ _coachSeen = false; }
  }
  box.hidden = _coachSeen || !Object.keys(state).length;
}
function dismissCoachMark(){
  _coachSeen = true;
  const box = document.getElementById('coachMark'); if (box) box.hidden = true;
  try { storage.set(COACH_KEY, '1'); } catch(e){}
}

/* ================= ONBOARDING =================
   A first visit showed every dial and three preset buttons. One clear first move, and
   the choice of how much interface to see, remembered so it is asked once. */
const ONBOARD_KEY = 'ui:onboarded';
async function initOnboarding(){
  const box = document.getElementById('onboard');
  if (!box) return;
  let seen = false;
  try { const r = await storage.get(ONBOARD_KEY); seen = !!(r && r.value); } catch(e){}
  box.hidden = seen || Object.keys(state).length > 0;
}
function markOnboarded(){
  const box = document.getElementById('onboard');
  if (box) box.hidden = true;
  try { storage.set(ONBOARD_KEY, '1'); } catch(e){}
}
function onboardChoose(mode){
  const adv = document.getElementById('advancedToggle');
  if (adv) adv.checked = (mode === 'advanced');
  applyAdvancedMode();
  if (typeof savePrefs === 'function') savePrefs();
  markOnboarded();
  if (mode === 'quick') generateCharacter();
  else { const c = document.getElementById('controlsStart'); if (c && c.scrollIntoView) c.scrollIntoView({block:'start'}); toast("Every control is showing. Flip Tinker Mode off any time for the short version."); }
}

/* ================= UPDATE AVAILABLE (B10) =================
   A deploy during an open session used to be invisible until some later load. When a
   new worker activates over an existing one, offer the reload instead of swapping code
   under a running page. */
function watchForUpdates(reg){
  if (!reg || !navigator.serviceWorker) return;
  const hadController = !!navigator.serviceWorker.controller;
  reg.addEventListener('updatefound', ()=>{
    const w = reg.installing;
    if (!w || !hadController) return;   // first install: nothing is out of date
    w.addEventListener('statechange', ()=>{
      if (w.state === 'activated') toastUndo("A new version of this app is available.", ()=> location.reload(), 10 * 60 * 1000, "Reload");
    });
  });
  document.addEventListener('visibilitychange', ()=>{
    if (document.visibilityState === 'visible') reg.update().catch(()=>{});
  });
}

// Keeps the sticky action bar honest about what the last generation used.
/* Kept counter: how many cards are kept, with a one-tap release for all of them (undoable). */
function updateKeptCounter(){
  const btn = document.getElementById('keptBtn');
  if (!btn) return;
  const n = Object.values(state || {}).filter(s => s && s.trait && s.locked).length;
  btn.style.display = n ? '' : 'none';
  btn.textContent = `Kept: ${n} · Unkeep all`;
}
/* Mini header: name, label and seed, shown when the sheet's own title has scrolled away. */
let _miniObserver = null;
function updateMiniHeader(){
  const box = document.getElementById('miniHeader');
  if (!box) return;
  const has = Object.keys(state || {}).length > 0;
  const lab = typeof characterLabel === 'function' ? characterLabel(state, charMeta) : null;
  setText('miniName', (charMeta && charMeta.name) || 'Character');
  setText('miniLabel', lab ? ' · ' + lab.name : '');
  setText('miniSeed', lastSeedUsed ? 'seed ' + lastSeedUsed : '');
  if (!has){ box.hidden = true; return; }
  const title = document.getElementById('sheetTitle');
  if (title && typeof IntersectionObserver === 'function' && !_miniObserver){
    _miniObserver = new IntersectionObserver(entries => { const e = entries[entries.length - 1]; box.hidden = !!(e && e.isIntersecting) || !Object.keys(state || {}).length; }, {threshold: 0});
    _miniObserver.observe(title);
  }
}
/* Phone result sheet: on a narrow screen Roll 5 and Surprise me show their result in a sheet, not by re-rendering a very long page. */
function isPhoneWidth(){ try { return window.matchMedia('(max-width: 640px)').matches; } catch (e){ return false; } }
function openResultSheet(title, html){
  const dlg = document.getElementById('resultSheet');
  if (!dlg || typeof dlg.showModal !== 'function') return false;
  setText('resultSheetTitle', title); setHTML('resultSheetBody', html);
  if (!dlg.open) dlg.showModal();
  return true;
}
function closeResultSheet(){ const d = document.getElementById('resultSheet'); if (d && d.open) d.close(); }
function showPhoneResultSheet(kind){
  if (!isPhoneWidth()) return;
  if (kind === 'batch'){
    const tray = document.getElementById('batchTray');
    if (tray && tray.innerHTML.trim()) openResultSheet('Five to choose from', tray.innerHTML);
  } else if (typeof summaryCardHTML === 'function' && Object.keys(state || {}).length){
    openResultSheet('Who you got', summaryCardHTML());
  }
}
(function(){ const d = document.getElementById('resultSheet'); if (d) d.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('[data-act]') && !/closeResultSheet/.test(e.target.closest('[data-act]').getAttribute('data-act'))) setTimeout(closeResultSheet, 0); }); })();
/* Say which engine an old save or link was built with. A v1 or v2 seed replays exactly as it always did; new rolls use the current engine. */
function noteLoadedEngine(seed, settings){
  const m = /^v(\d+)-/.exec(String(seed || ''));
  const v = m ? +m[1] : parseInt(settings && settings.fields && settings.fields.engineVersion, 10) || 1;
  sheetEngineVersion = SUPPORTED_SEED_VERSIONS.includes(v) ? v : 1; syncEngineToSheet();
  if (v < DEFAULT_ENGINE_V && typeof toast === 'function')
    toast(`This one was built with engine ${v}, so it replays exactly as it was. New characters use engine ${DEFAULT_ENGINE_V}.`, "ok", 6000);
}
function copyLine(text, btnEl){ copyText(String(text == null ? '' : text), btnEl); }
function updateStickyBar(){
  updateKeptCounter(); updateMiniHeader();
  const el = document.getElementById('stickySeed');
  if (el) el.textContent = lastSeedUsed ? ("seed " + lastSeedUsed) : "no character yet";
  if (lastSeedUsed){
    const box = document.getElementById('onboard');
    if (box && !box.hidden) markOnboarded();
    const fam = document.getElementById('familiarPanel');
    if (fam && fam.open) renderFamiliar();
  }
}

buildProfileSectionUI();
refreshPackUI();
loadProjects();
populateArchetypeSelect();
buildSeedPicker();
buildPersonalitySliders();
loadSavedList();
// Say whether this browser will actually keep anything BEFORE the first save (B21).
announceStorageMode();
// Prefs restore the archetype selection, which may be a custom_* option — so they wait
// for the custom presets to exist, or the saved choice is silently dropped on reload.
const _customArchetypesReady = loadCustomArchetypes();
populateBanCategorySelect();
refreshConstraintChips();
renderLensPicker();
buildBudgetUI();
// Live trait count in the tagline — the old hardcoded number went stale every time
// the pool grew.
(function(){ const el = document.getElementById('taglineSub');
  if (el) el.textContent = `Build a character, compare a cast, and see how any two would get along. One card at a time, from a ${TRAITS.length.toLocaleString()}-trait bank.`; })();
// Footer trait count, driven off the live pool the same way — a hardcoded number here
// previously went stale (and disagreed with the tagline above) every time the pool grew.
(function(){ const el = document.getElementById('footerTraitCount');
  if (el) el.textContent = `Traits drawn from a curated bank of ${TRAITS.length.toLocaleString()} entries across verbosity, vocabulary, grammar, mannerism, personality, and profile categories. ` + el.textContent; })();
onSliderChange();
wirePrefPersistence();
wireKeyboard();
applyAdvancedMode();
(function(){ const f = document.getElementById('familiarPanel');
  if (f) f.addEventListener('toggle', ()=> onFamiliarToggle(f)); })();
loadTheme(); loadSliderPresets(); loadCollapsedGroups(); loadReduceMotion();
_customArchetypesReady.catch(()=>{}).then(()=>loadPrefs()).then(()=>{ applyShareFromHash(); initOnboarding(); checkBackupReminder(); });
// Offline/repeat-visit caching. Registration is best-effort: the app is fully
// functional without it, and file:// or an unsupported browser must not throw here.
if (typeof navigator !== 'undefined' && navigator.serviceWorker && location.protocol.startsWith('http')){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then(watchForUpdates).catch(()=>{});
  });
}
