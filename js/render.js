/* ================= TOASTS =================
   alert() was used for import failures, orphaned traits, and "generate a character
   first". It blocks the page, cannot be styled, cannot show two things at once, and
   on mobile it reads like a browser error rather than a message from the app. */
let _toastTimer = null;
function toast(message, kind, ms){
  const host = document.getElementById('toastHost');
  if (!host){ console.log(message); return; }
  const el = document.createElement('div');
  el.className = 'toast toast-' + (kind || 'ok');
  el.setAttribute('role', kind === 'warn' ? 'alert' : 'status');
  el.textContent = message;
  const close = document.createElement('button');
  close.className = 'toastClose'; close.textContent = '\u00d7';
  close.setAttribute('aria-label', 'Dismiss');
  close.onclick = ()=> el.remove();
  el.appendChild(close);
  host.appendChild(el);
  setTimeout(()=>{ el.classList.add('toastOut'); setTimeout(()=>el.remove(), 300); }, ms || 3200);
  while (host.children.length > 4) host.removeChild(host.firstChild);
}

// A skeleton, shown for the frame between pressing Generate and the build finishing.
function showSkeleton(){
  const empty = document.getElementById('emptyState');
  if (empty) empty.style.display = 'none';
  const sheet = document.getElementById('sheet');
  const body = document.getElementById('sheetBody');
  if (!sheet || !body) return;
  sheet.classList.add('show');
  const bar = n => `<div class="skelLine" style="width:${n}%"></div>`;
  let h = '';
  for (let g = 0; g < 3; g++){
    h += `<div class="axisGroup skelGroup">${bar(28)}` +
         `<div class="skelCard">${bar(45)}${bar(85)}${bar(60)}</div>`.repeat(2) + `</div>`;
  }
  body.innerHTML = h;
  const insight = document.getElementById('insightPanel');
  if (insight) insight.style.display = 'none';
}

function renderGenerationFailure(err){
  const body = document.getElementById('sheetBody');
  const sheet = document.getElementById('sheet');
  if (sheet) sheet.classList.add('show');
  if (body) body.innerHTML =
    `<div class="failCard"><b>That generation didn't complete.</b>
     <div>${escHTML(err && err.message ? err.message : String(err))}</div>
     <div class="sub" style="margin-top:8px;">Your previous character is still in the undo history. If this repeats, try
     <b>Reset to Defaults</b> — a constraint combination that leaves a section with no eligible traits is the usual cause.</div></div>`;
  toast("Generation failed — see the sheet for details.", "warn", 6000);
}

function intensityDots(n){ return "●".repeat(n) + "○".repeat(5-n); }

// Color-coded wayfinding: every group heading gets a fixed accent so the same kind of
// trait always reads the same color, wherever it appears in the app.
const SECTION_COLORS = {
  "Personality": "var(--bubblegum)",
  "Speech Pattern": "var(--dusk-blue)",
  "Speech Under Pressure": "var(--dusk-blue)",
  "Vocabulary": "var(--emerald-deep)",
  "Mannerisms": "var(--golden-deep)",
  "Mannerisms Under Pressure": "var(--golden-deep)",
  "Motivation & Wound": "var(--bubblegum)",
  "Conflict & Stress Response": "var(--dusk-blue)",
  "Social Role in a Group": "var(--emerald-deep)",
  "Values & Moral Line": "var(--golden-deep)",
  "Attachment & Intimacy": "var(--bubblegum)",
  "Humor Style": "var(--dusk-blue)",
  "Habits & Vices": "var(--emerald-deep)",
};
SECTION_COLORS["Appearance"] = "#8a6bbf";
SECTION_COLORS["Required (constraints)"] = "#b8860b";
SECTION_COLORS["The one thing that doesn't fit"] = "#c96f4a";
SECTION_COLORS["Where They Stand Under Pressure"] = "var(--bubblegum)";
function sectionColor(title){ return SECTION_COLORS[title] || "var(--dusk-blue)"; }

// Trait frequency budget: how often an assigned trait should actually surface in prose.
const FREQ_BUDGET = {
  1: {label:"once or twice, whole book", hint:"A flicker. If it shows up more than twice it stops reading as subtle."},
  2: {label:"once a chapter",            hint:"Occasional colour. Enough to notice, not enough to characterise."},
  3: {label:"a few times a chapter",     hint:"Recognisable. A reader could describe this trait after a chapter or two."},
  4: {label:"most scenes",               hint:"Load-bearing. This is one of the two or three things that define the voice."},
  5: {label:"nearly every page",         hint:"Dominant. Overuse is the risk here — it can tip into caricature fast."}
};
function freqBudgetHTML(t){
  const b = FREQ_BUDGET[t.intensity] || FREQ_BUDGET[3];
  return `<div class="freqBudget"><b>Use:</b> ${b.label} <span class="freqHint">— ${b.hint}</span></div>`;
}

// The active band: the span of slider magnitudes at which this exact trait is
// eligible. This is the "range value" made visible — outside this window the trait
// cannot be drawn at all, so you can read straight off the card why a setting of 40
// gave you this and a setting of 70 never will.
function bandHTML(t, slot){
  const [lo, hi] = traitBand(t);
  const pos = traitPos(t).toFixed(2);
  const tgt = (slot && typeof slot.target === 'number') ? slot.target : null;
  const onTarget = tgt !== null ? Math.abs(traitPos(t) - tgt) : null;
  const fitTxt = onTarget === null ? "" :
    (onTarget < 0.18 ? " · dead-centre of the current target"
     : onTarget < 0.45 ? " · close to the current target"
     : " · toward the edge of the window");
  return `<div class="bandRow" title="This trait can only be drawn while the driving slider's magnitude sits in this range.">
    <span class="bandLabel">active range</span>
    <span class="bandTrack"><i style="left:${lo}%; width:${Math.max(2,hi-lo)}%;"></i>${tgt!==null?`<b style="left:${magFromPos(tgt)}%;"></b>`:``}</span>
    <span class="bandNums">${lo}–${hi}</span>
    <span class="bandPos">pos ${pos}${fitTxt}</span>
  </div>`;
}

const RTIER_LABEL = {common:"common", distinctive:"distinctive", signature:"signature"};

function traitCardHTML(id, s, includeControls, showDiff, accent){
  // BUG FIX: several code paths could produce a slot with a null trait (an empty
  // pool after filtering, a failed reroll), and this function dereferenced it
  // immediately — throwing and blanking the whole sheet. Fail soft on one card.
  if (!s || !s.trait){
    return `<div class="traitCard"><div class="traitMain"><div class="traitDesc" style="opacity:.6">No trait available for this slot at the current settings — widen the slider precision, ease a constraint, or enable more categories.</div></div></div>`;
  }
  const t = s.trait;
  const tier = t.rtier || (typeof rarityTier === 'function' ? rarityTier(t) : t.rarity);
  const lockedClass = s.locked ? "locked" : "";
  const diff = showDiff ? diffLog[id] : null;
  const style = accent ? ` style="--section-accent:${escHTML(accent)}"` : ``;
  const history = includeControls && rerollHistory[id] && rerollHistory[id].length;
  return `
    <div class="traitCard${s.wildcard ? ' wildcardCard' : ''}"${style}>
      <div class="traitMain">
        <div class="traitName">${escHTML(t.trait)}
          <span class="rarityBadge rarity-${tier}" title="${escHTML(RARITY_TIER_HINT[tier]||'')}">${escHTML(RTIER_LABEL[tier]||tier)}</span>
          <span class="intensityDots" title="Intensity ${t.intensity}/5 (continuous position ${traitPos(t).toFixed(2)})"><span aria-hidden="true">${intensityDots(t.intensity)}</span><span class="srOnly">intensity ${t.intensity} of 5</span></span>
          ${s.wildcard ? `<span class="wildBadge" title="Deliberately drawn against the grain — see 'the one thing that doesn't fit'">outlier</span>` : ``}
          ${s.derived ? `<span class="wildBadge" style="background:var(--emerald-deep);border-color:var(--emerald-deep);" title="Derived from this character's psychology rather than a slider">derived</span>` : ``}
        </div>
        <div class="traitCat">${escHTML(t.category)}</div>
        <div class="traitDesc">${escHTML(t.desc)}</div>
        ${includeControls ? bandHTML(t, s) : ``}
        ${t.example ? `<div class="exampleLine">&ldquo;${escHTML(t.example)}&rdquo;</div>` : ``}
        ${includeControls ? freqBudgetHTML(t) : ``}
        ${diff ? `<div class="diffNote">↺ was: "${escHTML(diff.from)}" <button onclick="dismissDiff('${escAttr(id)}')">dismiss</button></div>` : ``}
        ${includeControls && whyOpen[id] ? `<div class="whyNote">${explainPick(id, s)}${(rerollExclusions[id]&&rerollExclusions[id].size)?`<div class="whyExcl">Excluded from rerolls here: ${rerollExclusions[id].size} trait${rerollExclusions[id].size>1?"s":""} you've already passed on. <button onclick="clearExclusions('${escAttr(id)}')">reset</button></div>`:``}</div>` : ``}
      </div>
      ${includeControls ? `
      <div class="slotBtns">
        <button class="lockBtn ${lockedClass}" onclick="toggleLock('${escAttr(id)}')" title="Keep this trait through rerolls and regeneration" aria-pressed="${s.locked?'true':'false'}">${s.locked ? "locked" : "lock"}</button>
        <div class="pinRow">
          <button class="pinBtn ${pinnedTargets[id]!==undefined ? "pinned" : ""}" onclick="togglePin('${escAttr(id)}')" title="Pin this slot's intensity target (not the exact trait) so future generations/rerolls stay near this level even as sliders move elsewhere" aria-pressed="${pinnedTargets[id]!==undefined?'true':'false'}">${pinnedTargets[id]!==undefined ? "pinned "+pinnedTargets[id].toFixed(1) : "pin"}</button>
          ${pinnedTargets[id]!==undefined ? `<button class="pinAdj" onclick="adjustPin('${escAttr(id)}',-0.2)" title="Nudge pinned intensity down" aria-label="Nudge pinned intensity down">−</button><button class="pinAdj" onclick="adjustPin('${escAttr(id)}',0.2)" title="Nudge pinned intensity up" aria-label="Nudge pinned intensity up">+</button>` : ``}
        </div>
        <button class="rerollBtn" onclick="rerollSlot('${escAttr(id)}')" title="Draw a different trait for this slot (never repeats one you've already rejected here)">reroll</button>
        ${history ? `<button class="rerollBtn" onclick="rerollBack('${escAttr(id)}')" title="Step back to the trait this slot held before the last reroll">↺ back</button>` : ``}
        <button class="whyBtn" onclick="toggleWhy('${escAttr(id)}')" title="Why did I get this trait?" aria-expanded="${whyOpen[id]?'true':'false'}">why?</button>
      </div>` : ``}
    </div>`;
}
const RARITY_TIER_HINT = {
  common: "Ordinary human behaviour — texture, not identity.",
  distinctive: "Specific enough to notice, not loud enough to define the voice on its own.",
  signature: "Distinctive AND loud: this is one of the two or three things that define the voice.",
};
function titleForSlotId(id){
  if (id.startsWith("app_")) return "Appearance";
  if (id.startsWith("req_") || id.startsWith("reqcat_")) return "Required (constraints)";
  if (id.startsWith("wild_")) return "The one thing that doesn't fit";
  if (id.startsWith("pers_")) return "Personality";
  if (id.startsWith("prof_")){
    const secId = id.split("_")[1];
    const ps = PROFILE_SECTIONS.find(p=>p.id===secId);
    return ps ? ps.label : "Personality";
  }
  if (id==="verbosity"||id==="register"||id==="grammar") return "Speech Pattern";
  if (id.startsWith("vocab")) return "Vocabulary";
  if (id.startsWith("manner")) return "Mannerisms";
  return "Speech Pattern";
}

/* Which sheet sections the user has collapsed, and whether the compact view is on.
   With profileDepth 4 and every section enabled a sheet runs past forty cards, and
   there was no way to fold any of it away. */
let collapsedGroups = {};
function toggleGroup(title){ collapsedGroups[title] = !collapsedGroups[title]; renderSheet(); }
function setAllGroups(collapsed){
  document.querySelectorAll('#sheetBody .axisGroup').forEach(()=>{});
  SHEET_GROUP_TITLES.forEach(t=>{ collapsedGroups[t] = collapsed; });
  renderSheet();
}
let SHEET_GROUP_TITLES = [];
function toggleCompact(){
  const on = document.getElementById('compactToggle');
  document.body.classList.toggle('compact-sheet', !!(on && on.checked));
}

function renderSheet(){
  const sheet = document.getElementById('sheet');
  sheet.classList.add('show');
  const empty = document.getElementById('emptyState');
  if (empty) empty.style.display = 'none';
  document.getElementById('sheetTitle').textContent = charMeta.name || "Character Voice";
  const metaBits = [];
  if (charMeta.age) metaBits.push("Age " + charMeta.age);
  if (charMeta.context) metaBits.push(charMeta.context);
  if (charMeta.contextNotes && charMeta.contextNotes.length) metaBits.push("context bias: " + charMeta.contextNotes.join(", "));
  document.getElementById('charMetaLine').textContent = metaBits.join(" · ");

  const body = document.getElementById('sheetBody');
  body.innerHTML = "";
  const profGroups = PROFILE_SECTIONS.map(ps=>({
    title: ps.label,
    ids: Object.keys(state).filter(k=>k.startsWith("prof_"+ps.id+"_"))
  })).filter(g=>g.ids.length);
  const groups = [
    {title:"Required (constraints)", ids:Object.keys(state).filter(k=>k.startsWith("req_")||k.startsWith("reqcat_"))},
    {title:"Personality", ids:Object.keys(state).filter(k=>k.startsWith("pers_"))},
    ...profGroups,
    {title:"Appearance", ids:Object.keys(state).filter(k=>k.startsWith("app_"))},
    {title:"Speech Pattern", ids:["verbosity","register","grammar"]},
    {title:"Vocabulary", ids:Object.keys(state).filter(k=>k.startsWith("vocab"))},
    {title:"Mannerisms", ids:Object.keys(state).filter(k=>k.startsWith("manner"))},
    {title:"The one thing that doesn't fit", ids:Object.keys(state).filter(k=>k.startsWith("wild_"))},
  ];
  SHEET_GROUP_TITLES = groups.map(g=>g.title);
  groups.forEach(g=>{
    const validIds = g.ids.filter(id=>state[id]);
    if(!validIds.length) return;
    const div = document.createElement('div');
    const collapsed = !!collapsedGroups[g.title];
    div.className = "axisGroup" + (collapsed ? " collapsed" : "");
    div.style.setProperty('--section-accent', sectionColor(g.title));
    // PERF FIX: innerHTML += inside a loop re-parses the accumulated HTML on every
    // iteration (quadratic), which was the main source of visible lag on large
    // sheets. Build the string once, assign once.
    // The shape marker beside each title is a non-colour cue: the palette alone made
    // the section system unreadable for anyone who can't separate those hues.
    let inner = `<button class="axisTitle" onclick="toggleGroup('${escAttr(g.title)}')" aria-expanded="${collapsed?'false':'true'}" title="Collapse or expand this section">`
      + `<span class="axisGlyph" aria-hidden="true">${sectionGlyph(g.title)}</span>${escHTML(g.title)}`
      + `<span class="axisCount">${validIds.length}</span><span class="axisChev">${collapsed?'▸':'▾'}</span></button>`;
    if (!collapsed) validIds.forEach(id=>{ inner += traitCardHTML(id, state[id], true, true); });
    div.innerHTML = inner;
    body.appendChild(div);
  });

  // Coherence score + soft tension notes
  const co = coherenceScore(state);
  const tensions = softTensionsFor(state);
  const insight = document.getElementById('insightPanel');
  if (insight){
    let h = "";
    if (co){
      const barColor = !co.significant ? "var(--muted)" : co.lift>=25?"var(--emerald)":co.lift>=10?"var(--golden)":"var(--bubblegum)";
      const liftTxt = (co.lift>=0?"+":"") + co.lift;
      h += `<div class="coherenceRow">
        <div class="coherenceLabel">Coherence <b>${co.pct}%</b> <span style="opacity:.7;font-weight:400;">(${liftTxt} vs chance, &plusmn;${co.baseBand})</span></div>
        <div class="coherenceBar">
          <span style="width:${co.pct}%; background:${barColor};"></span>
          <i class="coherenceBaseline" style="left:${co.basePct}%;" title="Chance baseline for these settings: ${co.basePct}%"></i>
        </div>
      </div><div class="coherenceNote">${co.label} (${co.reinforced} of ${co.total} picks reinforced. A random character with these same settings would score about ${co.basePct}%, and with only ${co.total} picks that baseline itself carries a &plusmn;${co.baseBand}-point 95% band — so a lift smaller than that isn't a real difference.)</div>`;
    }
    // Caricature guard — the compound effect the per-trait frequency budget can't see.
    const loud = loudnessCheck(state);
    if (loud){
      h += `<div class="tensionBlock" style="border-left-color:var(--bubblegum);"><div class="tensionTitle" style="color:var(--bubblegum);">Loud in ${loud.count} directions</div><div style="margin:6px 0;">${loud.note}</div></div>`;
    }
    if (tensions.length){
      h += `<div class="tensionBlock"><div class="tensionTitle">Uncommon combinations — not errors</div><ul>` +
           tensions.map(t=>`<li>${t}</li>`).join("") + `</ul></div>`;
    }
    const patterns = secondOrderTensions(state);
    if (patterns.length){
      h += `<div class="tensionBlock" style="border-left-color:var(--dusk-blue);"><div class="tensionTitle" style="color:var(--dusk-blue);">Emergent patterns</div>` +
           patterns.map(p=>`<div style="margin:6px 0;"><b>${escHTML(p.name)}.</b> ${p.note}</div>`).join("") + `</div>`;
    }
    // Archetype fidelity meter — only meaningful when an archetype seeded the build.
    if (charMeta.archFidelity !== null && charMeta.archFidelity !== undefined){
      const f = charMeta.archFidelity;
      const col = f>=70?"var(--emerald)":f>=45?"var(--golden)":"var(--bubblegum)";
      h += `<div class="coherenceRow" style="margin-top:10px;">
        <div class="coherenceLabel">Archetype fidelity <b>${f}%</b></div>
        <div class="coherenceBar"><span style="width:${f}%; background:${col};"></span></div>
      </div><div class="coherenceNote">How much of the archetype's intended shape survived your slider blend, the dice, and any rerolls. Drift is legitimate — this is a compass reading, not a grade.</div>`;
    }
    // Voice fingerprint — assembled from the character's own example lines.
    const fp = voiceFingerprint(state, charMeta);
    if (fp){
      h += `<div class="tensionBlock" style="border-left-color:var(--emerald); margin-top:10px;"><div class="tensionTitle" style="color:var(--emerald);">Voice fingerprint</div><div style="font-style:italic; line-height:1.7;">${escHTML(fp)}</div><div class="sub" style="margin:6px 0 0;">Sample lines drawn from this character's own traits — how they'd actually sound on the page. Stable for this exact character; changes when the traits do.</div></div>`;
    }
    // Radar — 12-axis realised polarity shape.
    let prof = null;
    try {
      prof = axisProfile(state);
      if (Object.keys(prof).length >= 3){
        h += `<div style="margin-top:12px;"><div class="tensionTitle" style="color:var(--dusk-blue); margin-bottom:4px;">Axis profile</div>${radarSVG([{label:charMeta.name, color:"#4a6b8a", prof}])}
        <div class="sub" style="margin:2px 0 0;">Summed trait polarity per axis. The dashed middle ring is zero; outside it the sheet leans positive on that axis, inside negative. Shape is the signal — which axes dominate — not absolute size.</div></div>`;
      }
    } catch(e){}
    // Distinctiveness against everything generated this session.
    try {
      const dist = prof ? sessionDistinctiveness(prof) : null;
      if (dist){
        h += `<div class="coherenceRow" style="margin-top:10px;">
          <div class="coherenceLabel">Distinctiveness <b>${dist.pct}%</b></div>
          <div class="coherenceBar"><span style="width:${dist.pct}%; background:var(--dusk-blue-mid);"></span></div>
        </div><div class="coherenceNote">${escHTML(dist.label)} Measured against the centroid of all ${dist.count} characters generated this session — a different question from the novelty note above, which only compares you to the last one.</div>`;
      }
    } catch(e){}
    if (lastDepthUntouched.length){
      h += `<div class="depthNote"><b>Depth-first note:</b> no resolved profile category implies ${lastDepthUntouched.join(", ")}, so ${lastDepthUntouched.length>1?"those sliders were":"that slider was"} left exactly as you set ${lastDepthUntouched.length>1?"them":"it"} rather than being reset to centre.</div>`;
    }
    insight.innerHTML = h;
    insight.style.display = h ? "block" : "none";
  }

  renderChangeList();

  if (pressureState){
    const pbody = document.getElementById('pressureBody');
    pbody.innerHTML = "";
    const pgroups = [
      {title:"Speech Under Pressure", ids:["verbosity","register","grammar"]},
      {title:"Mannerisms Under Pressure", ids:Object.keys(pressureState).filter(k=>k.startsWith("p_manner"))},
      {title:"Where They Stand Under Pressure", ids:Object.keys(pressureState).filter(k=>k.startsWith("p_prof_"))},
    ];
    pgroups.forEach(g=>{
      const validIds = g.ids.filter(id=>pressureState[id]);
      if(!validIds.length) return;
      const div = document.createElement('div');
      div.className = "axisGroup";
      div.style.setProperty('--section-accent', sectionColor(g.title));
      let inner = `<div class="axisTitle static"><span class="axisGlyph" aria-hidden="true">${sectionGlyph(g.title)}</span>${escHTML(g.title)}</div>`;
      validIds.forEach(id=>{
        const slot = pressureState[id];
        if (slot && slot.shifted){
          inner += `<div class="shiftNote">Under pressure this shifts: <b>${escHTML(slot.fromCat)}</b> &rarr; <b>${escHTML(slot.toCat)}</b>.</div>`;
        } else if (slot && slot.fromCat){
          inner += `<div class="shiftNote holds">Holds under pressure: still <b>${escHTML(slot.fromCat)}</b>.</div>`;
        }
        inner += traitCardHTML(id, slot, false, false);
      });
      div.innerHTML = inner;
      pbody.appendChild(div);
    });
  }
}

// Non-colour redundancy for the section accent system.
const SECTION_GLYPHS = {
  "Personality":"◆", "Speech Pattern":"◼", "Speech Under Pressure":"◼", "Vocabulary":"▲",
  "Mannerisms":"●", "Mannerisms Under Pressure":"●", "Motivation & Wound":"◆",
  "Conflict & Stress Response":"◼", "Social Role in a Group":"▲", "Values & Moral Line":"●",
  "Attachment & Intimacy":"◆", "Humor Style":"◼", "Habits & Vices":"▲", "Appearance":"✦",
  "Required (constraints)":"✚", "The one thing that doesn't fit":"✳",
  "Where They Stand Under Pressure":"▲",
};
function sectionGlyph(title){ return SECTION_GLYPHS[title] || "◆"; }

/* §2.13 — the novelty readout gives a percentage; this says WHICH slots moved. The
   data was already being tracked for per-slot rerolls (diffLog); it just never
   survived a full regeneration. */
let lastSheetTraits = null;   // slotId -> trait name, as of the previous generation
function snapshotSheetTraits(st){
  const m = {};
  Object.entries(st || {}).forEach(([k,v])=>{ if (v && v.trait) m[k] = v.trait.trait; });
  return m;
}
function renderChangeList(){
  const box = document.getElementById('changeList');
  if (!box) return;
  if (!lastSheetTraits){ box.style.display = 'none'; return; }
  const now = snapshotSheetTraits(state);
  const changed = [], added = [], gone = [];
  Object.keys(now).forEach(k=>{
    if (!(k in lastSheetTraits)) added.push(now[k]);
    else if (lastSheetTraits[k] !== now[k]) changed.push({from:lastSheetTraits[k], to:now[k], slot:k});
  });
  Object.keys(lastSheetTraits).forEach(k=>{ if (!(k in now)) gone.push(lastSheetTraits[k]); });
  if (!changed.length && !added.length && !gone.length){ box.style.display='none'; return; }
  let h = `<details><summary>What changed from your last generation (${changed.length} replaced, ${added.length} new, ${gone.length} dropped)</summary><div class="changeBody">`;
  changed.slice(0, 40).forEach(c=>{
    h += `<div><span class="changeSlot">${escHTML(titleForSlotId(c.slot))}</span> ${escHTML(c.from)} &rarr; <b>${escHTML(c.to)}</b></div>`;
  });
  if (added.length) h += `<div style="margin-top:6px;"><b>New:</b> ${added.slice(0,20).map(escHTML).join(", ")}</div>`;
  if (gone.length) h += `<div style="margin-top:6px;"><b>Dropped:</b> ${gone.slice(0,20).map(escHTML).join(", ")}</div>`;
  h += `</div></details>`;
  box.innerHTML = h;
  box.style.display = 'block';
}

function checkConflicts(){
  const combinedState = {...state};
  const found = checkConflictsFor(combinedState);
  const box = document.getElementById('warnBox');
  if(found.length){
    box.classList.add('show');
    const worst = found[0].tier;
    box.innerHTML = `⚠ Trait tension detected <span class="conflictCount">(${found.length}, most severe: ${worst})</span><ul>` +
      found.map(f=>`<li><span class="conflictTier conflictTier-${f.tier.toLowerCase()}">${f.tier}</span> ${f.text} <span class="conflictNote">${f.tierNote}</span></li>`).join("") +
      "</ul>";
  } else { box.classList.remove('show'); }
}

function sheetToText(st, meta, pState){
  const showEx = document.getElementById('examplesToggle') ? document.getElementById('examplesToggle').checked : true;
  const L = [];

  // ---- Title & meta ----
  L.push(`# ${meta.name || "Unnamed Character"}`);
  const bits = [];
  if (meta.age) bits.push(`**Age:** ${meta.age}`);
  if (meta.context) bits.push(`**Context:** ${meta.context}`);
  if (meta.archetypeLabel) bits.push(`**Archetype:** ${meta.archetypeLabel}`);
  if (bits.length) L.push("", bits.join("  \n"));
  try {
    const co = coherenceScore(st);
    if (co) L.push("", `_Coherence: ${co.pct}% (${co.lift>=0?"+":""}${co.lift} vs a ${co.basePct}% chance baseline) — ${co.label}_`);
    const tn = softTensionsFor(st);
    if (tn.length) L.push("", "**Uncommon combinations:**", ...tn.map(t=>`- ${t}`));
    if (meta.seed) L.push("", `_Seed: ${meta.seed}_`);
    const fp = voiceFingerprint(st, meta);
    if (fp) L.push("", "**Voice fingerprint:** " + fp);
  } catch(e){}

  const fmt = (slot) => {
    const t = slot.trait;
    const out = [`- **${t.trait}** — ${t.desc}`];
    out.push(`  - *${t.category}* · intensity ${t.intensity}/5 · ${t.rarity} · use: ${(FREQ_BUDGET[t.intensity]||FREQ_BUDGET[3]).label}`);
    if (showEx && t.example) out.push(`  - > ${t.example}`);
    return out.join("\n");
  };
  const block = (title, ids) => {
    const valid = ids.filter(id=>st[id]);
    if (!valid.length) return;
    L.push("", `## ${title}`, "");
    valid.forEach(id=> L.push(fmt(st[id])));
  };

  // ---- Required constraints ----
  block("Required (constraints)", Object.keys(st).filter(k=>k.startsWith("req_")||k.startsWith("reqcat_")));
  block("The one thing that doesn't fit", Object.keys(st).filter(k=>k.startsWith("wild_")));

  // ---- Personality ----
  block("Personality", Object.keys(st).filter(k=>k.startsWith("pers_")));

  // ---- Profile sections (each its own heading) ----
  if (typeof PROFILE_SECTIONS !== 'undefined'){
    PROFILE_SECTIONS.forEach(ps=>{
      block(ps.label, Object.keys(st).filter(k=>k.startsWith("prof_"+ps.id+"_")));
    });
  }

  // ---- Appearance ----
  block("Appearance", Object.keys(st).filter(k=>k.startsWith("app_")));

  // ---- Voice ----
  block("Speech Pattern", ["verbosity","register","grammar"]);
  block("Vocabulary", Object.keys(st).filter(k=>k.startsWith("vocab")));
  block("Mannerisms", Object.keys(st).filter(k=>k.startsWith("manner")));

  // ---- Under pressure ----
  if (pState){
    L.push("", "## Under Pressure", "");
    ["verbosity","register","grammar"].forEach(id=>{ if(pState[id]) L.push(fmt(pState[id])); });
    Object.keys(pState).filter(k=>k.startsWith("p_manner")).forEach(id=> L.push(fmt(pState[id])));
    const shifts = Object.keys(pState).filter(k=>k.startsWith("p_prof_"));
    if (shifts.length){
      L.push("", "### Where they stand under pressure", "");
      shifts.forEach(id=>{
        const s2 = pState[id];
        L.push(s2.shifted ? `- **${s2.fromCat} → ${s2.toCat}**` : `- **Holds: ${s2.fromCat}**`);
        L.push(fmt(s2));
      });
    }
  }

  L.push("", "---", "");
  return L.join("\n");
}

function copyText(text, btn){
  const done = ()=>{ if (btn){ const old = btn.textContent; btn.textContent = "Copied!"; setTimeout(()=>btn.textContent=old, 1200); } };
  // BUG FIX: navigator.clipboard is undefined in non-secure contexts (plain http,
  // file://) — this threw instead of copying. Guard it, and fall back to the
  // textarea/execCommand path so the button works everywhere.
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>legacyCopy(text, done));
  } else {
    legacyCopy(text, done);
  }
}
function legacyCopy(text, done){
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) done(); else toast("Copy failed — your browser may block clipboard access here.", "warn");
  } catch(e){ toast("Copy failed — your browser may block clipboard access here.", "warn"); }
}
function downloadText(text, filename){
  const blob = new Blob([text], {type:"text/markdown;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
// ---------- Full-fidelity JSON export / import ----------
// The markdown export is for reading; this is for ROUND-TRIPPING. Everything needed
// to restore the exact character — trait state, meta, pressure sheet, pins — in one
// file, importable later or on another machine. This is the first building block of
// the "complete character sheet creator" direction: a portable character format.
/* BUG FIX — the export was not the round-trip it advertised. The tooltip promised
   "re-importable exactly as-is" and the help text said it "round-trips everything
   ... exactly", but the payload carried only traits, meta, pins, variants and the
   three voice sliders. Everything that actually SHAPES a generation — constraints,
   category tiers, the archetype, the counts, the group toggles, the per-section
   profile settings, boost/precision/profile weight, the rejected-trait memory — was
   dropped. Re-import and press Generate and you got a materially different character
   from the one in the file, which quietly undermines every other claim on the page.

   captureSettings/restoreSettings below are the whole of that state, in one place, so
   the promise is now true. Files written by the old format still import (version 1
   simply has no `settings` block). */
const CHAR_FORMAT_VERSION = 2;

// Every control that changes what a generation produces.
const SETTING_FIELDS = ['mannerCount','vocabCount','personalityCount','profileDepth',
  'rarityPref','affinityBoost','rangeFocus','profileWeight','divergence',
  'app_stature','app_upkeep','app_presence','archetypeSelect','seedInput',
  'charName','charAge','charContext','castCount'];
const SETTING_TOGGLES = ['personalityToggle','depthFirstToggle','examplesToggle','stressToggle',
  'genPersonality','genSpeech','genVocab','genManner','genAppearance',
  'avoidRecentToggle','wildcardToggle','foilOpposeComposure','compactToggle'];

function captureSettings(){
  const fields = {}, toggles = {}, sections = {};
  SETTING_FIELDS.forEach(id=>{ const el=document.getElementById(id); if (el) fields[id]=el.value; });
  SETTING_TOGGLES.forEach(id=>{ const el=document.getElementById(id); if (el) toggles[id]=!!el.checked; });
  (typeof PROFILE_SECTIONS !== 'undefined' ? PROFILE_SECTIONS : []).forEach(ps=>{
    const tog = document.getElementById('sec_'+ps.id);
    const sel = document.getElementById('type_'+ps.id);
    const wgt = document.getElementById('pw_'+ps.id);
    sections[ps.id] = {on: tog ? !!tog.checked : true, type: sel ? sel.value : "", weight: wgt ? wgt.value : ""};
  });
  const excl = {};
  Object.entries(rerollExclusions).forEach(([k,v])=>{ excl[k] = [...v]; });
  return {
    fields, toggles, sections,
    sliders: captureSliders(),
    constraints: {
      bannedCategories: [...bannedCategories],
      bannedSections: [...bannedSections],
      bannedTraitIds: [...bannedTraitIds],
      requiredTraitIds: [...requiredTraitIds],
      requiredCategories: [...requiredCategories],
      exclusivePairs: exclusivePairs.map(p=>p.slice()),
      categoryTiers: [...categoryTiers.entries()],
    },
    rerollExclusions: excl,
  };
}

function restoreSettings(s){
  if (!s) return;
  Object.entries(s.fields||{}).forEach(([id,v])=>{
    const el = document.getElementById(id); if (!el) return;
    if (el.tagName === 'SELECT'){ if ([...el.options].some(o=>o.value===v)) el.value = v; }
    else el.value = v;
  });
  Object.entries(s.toggles||{}).forEach(([id,v])=>{ const el=document.getElementById(id); if (el) el.checked = !!v; });
  Object.entries(s.sections||{}).forEach(([id,cfg])=>{
    const tog = document.getElementById('sec_'+id); if (tog) tog.checked = !!cfg.on;
    const sel = document.getElementById('type_'+id);
    if (sel && [...sel.options].some(o=>o.value===cfg.type)) sel.value = cfg.type;
    const wgt = document.getElementById('pw_'+id); if (wgt) wgt.value = cfg.weight || "";
  });
  if (s.sliders) restoreSliders(s.sliders);
  const c = s.constraints || {};
  bannedCategories = new Set(c.bannedCategories || []);
  bannedSections   = new Set(c.bannedSections || []);
  bannedTraitIds   = new Set(c.bannedTraitIds || []);
  requiredTraitIds = (c.requiredTraitIds || []).slice();
  requiredCategories = (c.requiredCategories || []).slice();
  exclusivePairs   = (c.exclusivePairs || []).map(p=>p.slice());
  categoryTiers    = new Map(c.categoryTiers || []);
  rerollExclusions = {};
  Object.entries(s.rerollExclusions || {}).forEach(([k,v])=>{ rerollExclusions[k] = new Set(v); });
  refreshConstraintChips();
  if (typeof togglePersonalityPanel === 'function') togglePersonalityPanel();
  if (typeof toggleExamples === 'function') toggleExamples();
  invalidateSliderCache();
}

function exportCharacterJSON(){
  if (!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  const payload = {
    format: "character-voice-sheet", version: CHAR_FORMAT_VERSION,
    exported: new Date().toISOString(),
    charMeta, state, pressureState, pinnedTargets, charVariants,
    sliders: captureSliders(),
    settings: captureSettings(),
  };
  const name = (charMeta.name || "character").replace(/[^a-z0-9_-]+/gi,'_');
  downloadText(JSON.stringify(payload, null, 2), name + ".character.json");
  toast("Exported " + name + ".character.json");
}
function importCharacterJSON(fileInput){
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const p = JSON.parse(reader.result);
      if (p.format !== "character-voice-sheet") throw new Error("Not a character sheet file.");
      // Re-link every imported trait to the live TRAITS pool by id, so imported
      // characters keep working with reroll/pin/why (which need live trait objects)
      // and quietly survive trait-text updates between app versions. Unmatched ids
      // (removed traits) keep their embedded copy, flagged so the user knows.
      const byId = new Map(TRAITS.map(t=>[t.id,t]));
      let orphans = 0;
      const relink = (st)=>{ if(!st) return st;
        Object.values(st).forEach(s=>{
          if (s && s.trait){ const live = byId.get(s.trait.id); if (live) s.trait = live; else orphans++; }
        }); return st; };
      snapshotHistory();
      state = relink(p.state || {});
      pressureState = relink(p.pressureState || null);
      charMeta = p.charMeta || {name:"Imported", age:"", context:"", archetypeLabel:"Imported"};
      pinnedTargets = p.pinnedTargets || {};
      charVariants = p.charVariants || {};
      diffLog = {}; rerollExclusions = {}; rerollHistory = {}; whyOpen = {};
      if (p.settings) restoreSettings(p.settings);
      else if (p.sliders) restoreSliders(p.sliders);   // version 1 files
      lastGeneratedSliders = (p.settings && p.settings.sliders) || p.sliders || null;
      document.getElementById('charName').value = charMeta.name || "";
      document.getElementById('charAge').value = charMeta.age || "";
      document.getElementById('charContext').value = charMeta.context || "";
      document.getElementById('archetypeTag').textContent = charMeta.archetypeLabel || "Imported";
      document.getElementById('pressureSheet').style.display = pressureState ? "block" : "none";
      onSliderChange(); renderSheet(); checkConflicts();
      if (!p.settings) toast("Imported. This file predates full-settings export, so constraints and counts were left as they are.", "warn", 6000);
      else toast("Imported " + (charMeta.name || "character") + " — settings restored too.");
      if (orphans) toast(orphans + " trait(s) in this file no longer exist in the pool; their saved text was kept as-is.", "warn", 6000);
    } catch(e){ toast("Could not import: " + e.message, "warn", 6000); }
    fileInput.value = ""; // allow re-importing the same file
  };
  reader.readAsText(file);
}

/* Custom archetypes lived in browser storage only, so a posture you had tuned could
   not be shared, backed up, or moved to another machine — and they captured sliders
   alone, which is why re-selecting one never reproduced the workflow that made it. */
function exportArchetypes(){
  const names = Object.keys(CUSTOM_ARCHETYPES);
  if (!names.length){ toast("No custom archetypes saved yet.", "warn"); return; }
  downloadText(JSON.stringify({
    format: "character-voice-archetypes", version: 1,
    exported: new Date().toISOString(),
    archetypes: CUSTOM_ARCHETYPES,
  }, null, 2), "archetypes.json");
  toast("Exported " + names.length + " archetype" + (names.length>1?"s":""));
}
function importArchetypes(fileInput){
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const p = JSON.parse(reader.result);
      if (p.format !== "character-voice-archetypes") throw new Error("Not an archetype library file.");
      let n = 0;
      for (const arch of Object.values(p.archetypes || {})){
        if (!arch || !arch.label) continue;
        await storage.set('archetype:'+arch.label, JSON.stringify(arch));
        n++;
      }
      await loadCustomArchetypes();
      toast("Imported " + n + " archetype" + (n===1?"":"s"));
    } catch(e){ toast("Could not import archetypes: " + e.message, "warn", 6000); }
    fileInput.value = "";
  };
  reader.readAsText(file);
}

// Builds styled HTML for clipboard — pastes as formatted text into Docs/Word/email
// instead of raw markdown syntax. Structure mirrors sheetToText exactly.
function sheetToHTML(st, meta, pState){
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  let h = `<h1 style="font-family:Georgia,serif;margin:0 0 4px;">${esc(meta.name||"Character Voice")}</h1>`;
  const bits = []; if (meta.age) bits.push("Age "+esc(meta.age)); if (meta.context) bits.push(esc(meta.context));
  if (meta.archetypeLabel) bits.push(esc(meta.archetypeLabel));
  if (bits.length) h += `<p style="color:#666;margin:0 0 14px;">${bits.join(" · ")}</p>`;
  const groupOf = (obj) => {
    const groups = new Map();
    Object.keys(obj).forEach(id=>{
      const s = obj[id]; if (!s || !s.trait) return;
      const title = titleForSlotId(id);
      if (!groups.has(title)) groups.set(title, []);
      groups.get(title).push(s);
    });
    return groups;
  };
  groupOf(st).forEach((slots, title)=>{
    h += `<h2 style="font-family:Georgia,serif;font-size:1.05em;border-bottom:1px solid #ccc;padding-bottom:2px;margin:16px 0 6px;">${esc(title)}</h2>`;
    slots.forEach(s=>{
      h += `<p style="margin:6px 0;"><b>${esc(s.trait.trait)}</b> <span style="color:#888;font-size:.85em;">(${esc(s.trait.category)} · intensity ${s.trait.intensity}/5 · ${esc(s.trait.rarity)})</span><br>${esc(s.trait.desc)}<br><i style="color:#555;">"${esc(s.trait.example)}"</i></p>`;
    });
  });
  if (pState){
    h += `<h2 style="font-family:Georgia,serif;font-size:1.05em;border-bottom:1px solid #ccc;padding-bottom:2px;margin:16px 0 6px;">Under Pressure</h2>`;
    Object.values(pState).forEach(s=>{
      if (!s || !s.trait) return;
      h += `<p style="margin:6px 0;"><b>${esc(s.trait.trait)}</b><br>${esc(s.trait.desc)}<br><i style="color:#555;">"${esc(s.trait.example)}"</i></p>`;
    });
  }
  return h;
}
function copySheet(btnEl){
  const htmlBody = sheetToHTML(state, charMeta, pressureState);
  const plain = sheetToText(state, charMeta, pressureState);
  // Rich-text clipboard: paste lands formatted in Docs/Word/email. Falls back to
  // plain text where ClipboardItem isn't available (older browsers, non-secure
  // contexts), so the button never silently fails.
  const done = ()=>{ if (btnEl){ const o=btnEl.textContent; btnEl.textContent="Copied!"; setTimeout(()=>btnEl.textContent=o,1200);} };
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write){
    const item = new ClipboardItem({
      'text/html': new Blob([htmlBody], {type:'text/html'}),
      'text/plain': new Blob([plain], {type:'text/plain'})
    });
    navigator.clipboard.write([item]).then(done).catch(()=> copyText(plain, btnEl));
  } else {
    copyText(plain, btnEl);
  }
}
function downloadSheet(){
  const fn = (charMeta.name || "character").replace(/[^a-z0-9]+/gi,"_").replace(/^_|_$/g,"") + ".md";
  downloadText(sheetToText(state, charMeta, pressureState), fn);
}
