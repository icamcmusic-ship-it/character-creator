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
  /* A failed import, an exhausted pool and a successful save all presented identically
     and all auto-dismissed after about three seconds — so the one class of message the
     user actually needed to read was the one most likely to vanish before they looked
     up. Warnings now stay until dismissed. The call sites that already passed a longer
     ms for the important ones were only ever approximating this. */
  const persist = (kind === 'warn');
  if (persist) el.dataset.persist = "1";
  else setTimeout(()=>{ el.classList.add('toastOut'); setTimeout(()=>el.remove(), 300); }, ms || 3200);
  // Only evict auto-dismissing toasts on overflow: dropping an undismissed failure to
  // make room for a success notice would reintroduce exactly the problem above.
  while (host.children.length > 4){
    const evictable = [...host.children].find(c=> !c.dataset.persist);
    if (!evictable) break;
    evictable.remove();
  }
}

// Same toast, with markup — for the answers that are a short paragraph rather than a
// sentence (the why-not explanations), where plain text loses the structure.
function toastHTML(html, ms){
  const host = document.getElementById('toastHost');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast toast-ok toastWide';
  el.setAttribute('role', 'status');
  el.innerHTML = html;
  const close = document.createElement('button');
  close.className = 'toastClose'; close.textContent = '\u00d7';
  close.setAttribute('aria-label', 'Dismiss');
  close.onclick = ()=> el.remove();
  el.appendChild(close);
  host.appendChild(el);
  setTimeout(()=>{ el.classList.add('toastOut'); setTimeout(()=>el.remove(), 300); }, ms || 9000);
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
// The §6 sections. Kept to the same four-colour rotation as the sections above them.
SECTION_COLORS["Competence & Method"] = "var(--emerald-deep)";
SECTION_COLORS["Positive Origins"] = "var(--golden-deep)";
SECTION_COLORS["Goals & Stakes"] = "var(--bubblegum)";
SECTION_COLORS["Ordinary Texture"] = "var(--dusk-blue)";
SECTION_COLORS["Recovery & Repair"] = "var(--emerald-deep)";
SECTION_COLORS["Contradiction Functions"] = "var(--golden-deep)";
SECTION_COLORS["Role by Context"] = "var(--dusk-blue)";
SECTION_COLORS["Appearance"] = "var(--accent-violet)";
SECTION_COLORS["Required (constraints)"] = "var(--accent-amber)";
SECTION_COLORS["The one thing that doesn't fit"] = "var(--accent-rust)";
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

const RTIER_LABEL = {common:"common", uncommon:"uncommon", distinctive:"distinctive", signature:"signature"};
/* A NON-COLOUR CUE FOR THE TIER, the way SECTION_GLYPHS already provides one for
   sections. The rarity badge carried its tier in a colour and a word, and the word is
   easy to skim past on a forty-card sheet — so at a glance the tier system was
   colour-only, which is exactly the failure the section glyphs exist to avoid. A rising
   run of marks reads as an ordered scale without any colour at all, and degrades to
   plain text in print and in a high-contrast theme. */
const RTIER_GLYPH = {common:"·", uncommon:"∶", distinctive:"⁘", signature:"✦"};

/* HOW MUCH IS LEFT IN THIS SLOT. rerollExclusions grows silently on every toss, and the
   only feedback the user ever got was the moment there was nothing left to draw — at
   which point the honest answer ("you have rejected most of this category at these
   settings") arrives far too late to act on. Show the headroom while it still means
   something, and only once it is worth saying: a full pool is not information.

   Counts what a reroll could ACTUALLY return — the category, minus what is banned,
   minus what you have already tossed here, minus what is seated elsewhere on the sheet
   — rather than the raw category size, which is the number that made this invisible. */
/* Two counts, because there are two different true answers and reporting one as the
   other was the bug: `total` is the whole category minus bans, which is what a WIDER
   precision setting could reach, and `left` is what a reroll can return RIGHT NOW —
   inside the slot's own intensity window, minus what is tossed and what is seated. The
   headroom badge used to print the wide number against the words "at these settings",
   so it could promise 40 alternatives where the picker could reach four. */
function slotHeadroom(id, t){
  if (!t || typeof byFilter !== 'function') return null;
  const full = byFilter(t.section, t.category);
  if (!full.length) return null;
  const tossed = rerollExclusions[id] || new Set();
  const seated = (typeof seatedTraitIds === 'function') ? seatedTraitIds(id) : new Set();
  const usable = full.filter(x => !tossed.has(x.id) && !seated.has(x.id) && x.id !== t.id);
  // The eligibility window the picker actually draws through at this slot's target.
  let eligible = usable.length;
  try {
    const slot = state[id];
    const target = (slot && typeof slot.target === 'number') ? slot.target : traitPos(t);
    const half = bandHalf();
    eligible = usable.filter(x => Math.abs(traitPos(x) - target) <= half).length;
  } catch(e){ /* fall back to the wide count rather than reporting nothing */ }
  return {left: eligible, wider: usable.length, total: full.length, tossed: tossed.size};
}
function slotDepthHTML(id, t){
  const h = slotHeadroom(id, t);
  if (!h || !h.tossed) return '';
  const frac = h.left / h.total;
  if (frac > 0.5) return '';                       // plenty left; saying so is noise
  const cls = h.left === 0 ? 'depthOut' : frac <= 0.2 ? 'depthLow' : 'depthMid';
  const widerNote = h.wider > h.left ? ` ${h.wider - h.left} more become reachable if you loosen the precision slider.` : ``;
  const msg = h.left === 0
    ? `Nothing left inside this slot's intensity window — you have tossed ${h.tossed} of ${h.total} in ${t.category}.${widerNote || ' Undo a toss, widen the precision slider, or ease a constraint.'}`
    : `${h.left} of ${h.total} in ${t.category} are reachable at this slot's current intensity window; you have tossed ${h.tossed}.${widerNote}`;
  return `<span class="slotDepth ${cls}" title="${escAttr(msg)}">${h.left === 0 ? 'pool empty' : h.left + ' left'}</span>`;
}
/* "8 kept, 29 will reroll" — the single most decision-relevant fact about a sheet you
   have been curating for ten minutes. Lifted out of renderSheet so a one-card lock
   toggle can update it without rebuilding the sheet to do so. */
function refreshHandStrip(){
  const el = document.getElementById('handKept');
  if (!el) return;
  const all = Object.values(state).filter(s=> s && s.trait);
  const kept = all.filter(s=> s.locked).length;
  if (!all.length){ el.hidden = true; return; }
  el.hidden = false;
  el.textContent = kept
    ? `${kept} kept · ${all.length - kept} will reroll`
    : `${all.length} cards · none kept`;
  el.title = kept
    ? `Pressing Generate redraws ${all.length - kept} of ${all.length} cards; the ${kept} you kept stay exactly as they are.`
    : `Pressing Generate redraws all ${all.length} cards. Use Keep on a card to hold it.`;
}

/* ================= CARD STATE, FOCUS, AND SURGICAL UPDATES =================
   renderSheet() emptied #sheetBody and rebuilt all ~37 cards for any change at all —
   a lock toggle (a CSS class flip), a pin nudge, a single slot's reroll. Three things
   went with it every time: the button the user had just pressed was destroyed, so
   keyboard focus fell back to <body> and a Toss-repeatedly workflow was impossible
   without a mouse; every open ⋯ control strip closed; and on a phone the whole sheet
   visibly reflowed.

   Two mechanisms fix all three. OPEN_CARD_CONTROLS moves the strip's open/closed state
   out of the DOM so a rebuild cannot lose it. refreshCard() replaces exactly the one
   card that changed and puts focus back on the equivalent control, so nothing else on
   the page moves at all. */
const OPEN_CARD_CONTROLS = new Set();   // slot ids whose ⋯ strip is open

/* Where the caret is, in terms a rebuilt DOM can be matched against: which card, and
   which control within it. Falls back to the card itself when the pressed button is
   gone (Toss on a slot whose new trait is required-by-name renders a <span>, not a
   button). */
function captureCardFocus(){
  const el = (typeof document !== 'undefined') ? document.activeElement : null;
  if (!el || !el.closest) return null;
  const card = el.closest('.traitCard');
  if (!card || !card.dataset || !card.dataset.slot) return null;
  const btns = Array.from(card.querySelectorAll('button'));
  const idx = btns.indexOf(el);
  return {slot: card.dataset.slot, cls: el.className || '', idx};
}
function restoreCardFocus(mark){
  if (!mark || typeof document === 'undefined') return;
  const card = document.querySelector('.traitCard[data-slot="' + (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(mark.slot) : mark.slot) + '"]');
  if (!card || !card.querySelectorAll) return;
  const btns = Array.from(card.querySelectorAll('button'));
  if (!btns.length) return;
  // Match on class first — "the Toss button" survives the card's contents changing —
  // and fall back to position, then to the card's first control.
  const byClass = mark.cls ? btns.find(b => b.className === mark.cls) : null;
  const target = byClass || btns[mark.idx] || btns[0];
  if (target && target.focus) target.focus();
}
/* Run a re-render and put the caret back where it was. Used by every full-sheet
   rebuild that is a response to pressing something ON a card. */
function withPreservedFocus(fn){
  const mark = captureCardFocus();
  const out = fn();
  restoreCardFocus(mark);
  return out;
}
/* Replace ONE card in place. The whole reason renderSheet was being called for a
   single-slot change; now it is only called when the set of slots itself changes. */
function refreshCard(slotId){
  if (typeof document === 'undefined') return false;
  const host = document.querySelector('.traitCard[data-slot="' + (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(slotId) : slotId) + '"]');
  if (!host || !state[slotId] || !state[slotId].trait) return false;
  const mark = captureCardFocus();
  const holder = document.createElement('div');
  holder.innerHTML = traitCardHTML(slotId, state[slotId], true, true, null, titleForSlotId(slotId));
  const next = holder.firstElementChild;
  if (!next || !host.replaceWith) return false;
  host.replaceWith(next);
  refreshGroupHead(titleForSlotId(slotId));
  refreshHandStrip();
  restoreCardFocus(mark);
  return true;
}
/* Has the sheet's SLOT SET changed since the last full render? A reroll can trigger
   reapplyConstraintsAfterMutation, which may seat or drop a required slot — and then
   replacing one card would leave the sheet showing a slot list that no longer matches
   state. Cheap to check, and it keeps refreshCard honest. */
function sheetSlotSetChanged(){
  if (typeof SHEET_GROUPS === 'undefined' || !SHEET_GROUPS) return true;
  const rendered = new Set();
  SHEET_GROUPS.forEach(g=>g.ids.forEach(id=>rendered.add(id)));
  const live = Object.keys(state);
  return live.length !== rendered.size || live.some(k=>!rendered.has(k));
}
/* Does the sheet's CONTENT still match what is on screen, slot for slot? The slot-set
   check above catches a slot appearing or disappearing, but an exclusive-pair swap
   replaces the TRAIT in a slot that already existed — same keys, different sheet — so
   a reroll of card A could silently change card B and only A would be repainted.
   Keeping the last-rendered trait id per slot is cheap and catches exactly that. */
let LAST_RENDERED_TRAITS = null;
function noteRenderedTraits(){
  LAST_RENDERED_TRAITS = {};
  Object.keys(state).forEach(k=>{
    LAST_RENDERED_TRAITS[k] = state[k] && state[k].trait ? state[k].trait.id : null;
  });
}
// Every slot whose trait differs from what was last painted.
function slotsChangedSinceRender(){
  if (!LAST_RENDERED_TRAITS) return null;          // nothing painted yet
  const out = [];
  Object.keys(state).forEach(k=>{
    const now = state[k] && state[k].trait ? state[k].trait.id : null;
    if (LAST_RENDERED_TRAITS[k] !== now) out.push(k);
  });
  return out;
}

/* The entry point every per-card action uses. A mutation is not "one card": a reroll
   can trigger an exclusive-pair replacement elsewhere, a required top-up, or a budget
   redraw, and the summaries, fingerprint and pressure sheet all read the whole sheet.
   Repaint every slot that actually moved and refresh the derived views, rather than
   assuming the caller named the only thing that changed. */
function renderSlotChange(slotId){
  const alsoChanged = slotsChangedSinceRender();
  if (sheetSlotSetChanged() || alsoChanged === null){
    withPreservedFocus(()=>{ renderSheet(); });
    return;
  }
  const ids = new Set(alsoChanged);
  ids.add(slotId);
  let allPainted = true;
  ids.forEach(id=>{ if (!refreshCard(id)) allPainted = false; });
  if (!allPainted){ withPreservedFocus(()=>{ renderSheet(); }); return; }
  noteRenderedTraits();
  refreshDerivedViews(ids.size > 1 ? [...ids] : null);
}

/* Everything downstream of the cards: the summary/diagnostics panel, the novelty
   fingerprint, the budget meter, and the pressure sheet — none of which the
   single-card path used to touch, so a curated sheet could carry a summary describing
   the character it had been half an hour earlier. The pressure sheet is DERIVED from
   the base and cannot be recomputed without re-running the build, so it is marked
   outdated rather than silently left wrong. */
function refreshDerivedViews(alsoChanged){
  try { refreshSummaryCard(); } catch(e){ console.error(e); }
  try { if (typeof refreshBudgetChips === 'function') refreshBudgetChips(); } catch(e){}
  try { if (typeof refreshHandStrip === 'function') refreshHandStrip(); } catch(e){}
  markPressureOutdated();
  if (alsoChanged && alsoChanged.length > 1 && typeof srAnnounce === 'function'){
    srAnnounce(`${alsoChanged.length} cards changed — a rule affected more than the one you pressed.`);
  }
}
/* Repaint the summary/diagnostics card in place. It carries the coherence score, the
   tensions, the archetype meter, the voice fingerprint and the radar — all of which are
   whole-sheet reads that a single-card repaint used to leave describing the sheet as it
   was before the mutation. */
function refreshSummaryCard(){
  if (typeof document === 'undefined') return;
  const host = document.getElementById('summaryCard');
  if (!host || !host.replaceWith) return;
  const holder = document.createElement('div');
  holder.innerHTML = summaryCardHTML();
  const next = holder.firstElementChild;
  if (next) host.replaceWith(next);
}

/* The pressure sheet is built from the base sheet at generation time. Once a card has
   been rerolled, pinned or swapped, it describes a character that no longer exists. */
function markPressureOutdated(){
  const host = document.getElementById('pressureSheet');
  if (!host || !pressureState) return;
  if (host.classList) host.classList.add('outdated');
  const note = document.getElementById('pressureOutdated');
  if (note){
    note.style.display = 'block';
    note.textContent = "The base sheet has changed since this pressure variant was built, so it describes an earlier version of this character. Generate again to rebuild it.";
  }
}

/* A card change can move two numbers outside the card: its section's "N · M kept"
   count and the "Your hand" strip. Both were only ever written by renderSheet. */
function refreshGroupHead(title){
  const wrap = document.getElementById(sectionAnchorId(title));
  if (!wrap || !wrap.querySelector) return;
  const g = (typeof SHEET_GROUPS !== 'undefined' ? SHEET_GROUPS : []).find(x=>x.title === title);
  if (!g) return;
  const validIds = g.ids.filter(id=>state[id]);
  const kept = validIds.filter(id => state[id] && state[id].locked).length;
  const count = wrap.querySelector('.axisCount');
  if (count) count.textContent = `${validIds.length}${kept ? ` · ${kept} kept` : ``}`;
  const lockBtn = wrap.querySelector('.axisActions .axisAction:nth-child(2)');
  if (lockBtn){
    const more = kept < validIds.length;
    lockBtn.textContent = more ? 'keep section' : 'release section';
    lockBtn.title = more ? 'Keep every card in this section through rerolls and regeneration' : 'Release every card in this section';
  }
}

function traitCardHTML(id, s, includeControls, showDiff, accent, tagLabel){
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
  // Flash slots that a full regeneration actually moved. renderChangeList already knew
  // WHICH slots changed but only reported it in a collapsed list; the highlight was
  // wired for per-slot rerolls and never applied on a full regenerate, so after pressing
  // Generate the user had forty cards and no idea which were new. Purely a CSS
  // animation keyed off the class, so it plays once per render and needs no timer.
  const changedClass = (showDiff && changedSlots.has(id)) ? ' justChanged' : '';
  // The section name rides on the card as a tag, so a card still says what it is once
  // it is out of its group (compact view, cast cards, a screenshot of one card).
  const tag = tagLabel ? `<span class="traitTag">${escHTML(tagLabel)}</span>` : ``;
  /* The ⋯ control strip was a pure DOM class, so every renderSheet closed every open
     strip, and the aria-expanded below was hard-coded "false" — announcing a collapsed
     strip even when it had just been visually reopened. Card state lives in JS now and
     is rendered from there, so it survives a rebuild and the ARIA state is true.
     data-slot is what makes a single card replaceable without rebuilding all 37. */
  const openNow = includeControls && OPEN_CARD_CONTROLS.has(id);
  return `
    <div class="traitCard${s.wildcard ? ' wildcardCard' : ''}${changedClass}${tag ? ' tagged' : ''}${openNow ? ' controlsOpen' : ''}"${style} data-slot="${escAttr(id)}">
      ${tag}
      <div class="traitMain">
        <div class="traitName">${escHTML(t.trait)}
          <span class="rarityBadge rarity-${tier}" title="${escHTML(RARITY_TIER_HINT[tier]||'')}"><span class="rarityGlyph" aria-hidden="true">${RTIER_GLYPH[tier]||"·"}</span>${escHTML(RTIER_LABEL[tier]||tier)}</span>
          <span class="intensityDots" title="Intensity ${t.intensity}/5 (continuous position ${traitPos(t).toFixed(2)})"><span aria-hidden="true">${intensityDots(t.intensity)}</span><span class="srOnly">intensity ${t.intensity} of 5</span></span>
          ${s.wildcard ? `<span class="wildBadge" title="Deliberately drawn against the grain — see 'the one thing that doesn't fit'">outlier</span>` : ``}
          ${s.derived ? `<span class="wildBadge" style="background:var(--emerald-deep);border-color:var(--emerald-deep);" title="Derived from this character's psychology rather than a slider">derived</span>` : ``}
          ${s.budgeted ? `<span class="wildBadge budgetBadge" title="${escHTML(s.budgetWhy || 'Adjusted to fit a budget you set')}">budgeted</span>` : ``}
        </div>
        <div class="traitCat">${escHTML(t.category)}</div>
        <div class="traitDesc">${escHTML(t.desc)}</div>
        ${includeControls ? bandHTML(t, s) : ``}
        ${t.example ? `<div class="exampleLine">&ldquo;${escHTML(t.example)}&rdquo;</div>` : ``}
        ${includeControls ? freqBudgetHTML(t) : ``}
        ${s.exceptionWhy ? `<div class="traitNote exceptionNote"><b>Why it's here.</b> ${escHTML(s.exceptionWhy)}</div>` : ``}
        ${includeControls && traitNotes[id] ? `<div class="traitNote"><b>Note.</b> ${escHTML(traitNotes[id])} <button ${actAttr('click', 'clearTraitNote', id)}>remove</button></div>` : ``}
        ${diff ? `<div class="diffNote">↺ was: "${escHTML(diff.from)}" <button ${actAttr('click', 'dismissDiff', id)}>dismiss</button></div>` : ``}
        ${includeControls && whyOpen[id] ? `<div class="whyNote">${explainPick(id, s)}${(rerollExclusions[id]&&rerollExclusions[id].size)?`<div class="whyExcl">Excluded from rerolls here: ${rerollExclusions[id].size} trait${rerollExclusions[id].size>1?"s":""} you've already passed on. <button ${actAttr('click', 'clearExclusions', id)}>reset</button></div>`:``}</div>` : ``}
      </div>
      ${includeControls ? `
      <button class="slotToggle" ${actAttr('click', 'toggleCardControls', "$el")}
              aria-expanded="${openNow ? 'true' : 'false'}" aria-label="${openNow ? 'Hide' : 'Show'} the controls for this card" title="${openNow ? 'Hide' : 'Show'} the controls for this card">&ctdot;</button>
      <div class="slotBtns">
        ${s.required && id.startsWith("req_")
          /* "Always include this exact trait" is the user's own instruction — there is
             nothing for a reroll to draw, so the control says what would actually
             change it rather than rendering a button that cannot work. */
          ? `<span class="slotNote" title="This trait is here because you required it by name. Remove the constraint to change it.">required by name</span>`
          : `<button class="rerollBtn" ${actAttr('click', 'rerollSlot', id)} title="Draw a different trait for this slot. Traits you have already rejected here are excluded — unless the pool runs out, in which case one can come back rather than the button doing nothing, and the card says how little is left."><span aria-hidden="true">✕</span> Toss</button>`}
        <button class="lockBtn ${lockedClass}" ${actAttr('click', 'toggleLock', id)} title="Keep this trait through rerolls and regeneration" aria-pressed="${s.locked?'true':'false'}"><span aria-hidden="true">📌</span> ${s.locked ? "Kept" : "Keep"}</button>
        <div class="pinRow">
          <button class="pinBtn ${pinnedTargets[id]!==undefined ? "pinned" : ""}" ${actAttr('click', 'togglePin', id)} title="Pin this slot's intensity target (not the exact trait) so future generations/rerolls stay near this level even as sliders move elsewhere" aria-pressed="${pinnedTargets[id]!==undefined?'true':'false'}">${pinnedTargets[id]!==undefined ? "pinned "+pinnedTargets[id].toFixed(1) : "pin"}</button>
          ${pinnedTargets[id]!==undefined ? `<button class="pinAdj" ${actAttr('click', 'adjustPin', id, -0.2)} title="Nudge pinned intensity down" aria-label="Nudge pinned intensity down">−</button><button class="pinAdj" ${actAttr('click', 'adjustPin', id, 0.2)} title="Nudge pinned intensity up" aria-label="Nudge pinned intensity up">+</button>` : ``}
        </div>
        ${history ? `<button class="rerollBtn" ${actAttr('click', 'rerollBack', id)} title="Step back to the trait this slot held before the last toss">↺ back</button>` : ``}
        ${slotDepthHTML(id, t)}
        <button class="whyBtn" ${actAttr('click', 'toggleWhy', id)} title="Why did I get this trait?" aria-expanded="${whyOpen[id]?'true':'false'}">why?</button>
        <!-- Favouriting and banning previously meant leaving the sheet, opening
             Constraints, and finding the trait by name in a search box — for a trait
             that is right there on the card in front of you.

             The star used to BE the "always include" constraint, which is far stronger
             than what a star means anywhere else: a user bookmarking six traits they
             liked silently pinned all six onto every character they generated
             afterwards. The two are now separate actions with separate wording — the
             star saves it to a list, the pin-to-every-character button states a rule. -->
        <button class="markBtn ${isFavouriteTrait(t.id) ? 'on' : ''}" ${actAttr('click', 'favouriteTrait', t.id)}
                aria-pressed="${isFavouriteTrait(t.id) ? 'true' : 'false'}"
                title="${isFavouriteTrait(t.id) ? 'Remove from your saved traits' : 'Save this trait to your list (does not change generation)'}"><span aria-hidden="true">★</span><span class="srOnly">${isFavouriteTrait(t.id) ? 'remove from saved traits' : 'save this trait'}</span></button>
        <button class="markBtn ${requiredTraitIds.includes(t.id) ? 'on' : ''}" ${actAttr('click', 'requireTrait', t.id)}
                aria-pressed="${requiredTraitIds.includes(t.id) ? 'true' : 'false'}"
                title="${requiredTraitIds.includes(t.id) ? 'Stop requiring this trait on every character' : 'Require this trait on EVERY character from now on — a generation rule, not a bookmark'}"><span aria-hidden="true">📌</span><span class="srOnly">${requiredTraitIds.includes(t.id) ? 'stop requiring this on every character' : 'require this on every character'}</span></button>
        <button class="markBtn ${bannedTraitIds.has(t.id) ? 'on' : ''}" ${actAttr('click', 'banTrait', t.id)}
                aria-pressed="${bannedTraitIds.has(t.id) ? 'true' : 'false'}"
                title="${bannedTraitIds.has(t.id) ? 'Allow this trait again' : 'Never draw this trait again'}"><span aria-hidden="true">🚫</span><span class="srOnly">never draw this again</span></button>
        <button class="whyBtn" ${actAttr('click', 'editTraitNote', id)} title="${traitNotes[id] ? 'Edit your note on this card' : 'Attach a note to this card'}">${traitNotes[id] ? 'note ✎' : '+ note'}</button>
      </div>` : ``}
    </div>`;
}
const RARITY_TIER_HINT = {
  common:      "Ordinary human behaviour — texture, not identity.",
  uncommon:    "Noticeable, but not remarkable. Good for building a specific person out of small parts.",
  distinctive: "A reader would remember this about the character.",
  signature:   "Defines the voice. Two of these is a caricature.",
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

/* ================= SHEET DENSITY =================
   A default build produces ~38 populated slots and at profileDepth 4 with everything on
   it passes forty, in engine order, all expanded. The summary card gave that a front
   door but not a shape.

   Collapsing the deep sections by default would fix the reading order and change how
   the sheet behaves for everyone already using it, which is why it was never done. A
   density preference resolves that: STANDARD is exactly the current behaviour and stays
   the default, so nothing changes for anyone who doesn't ask for it, and the other two
   settings are available to anyone who does.

   Applied on the first render after a generate only — once you have started opening and
   closing sections by hand, that is your arrangement and the setting stops overriding it. */
const DENSITY_DEEP_GROUPS = ["Motivation & Wound","Conflict & Stress Response","Social Role in a Group",
  "Values & Moral Line","Attachment & Intimacy","Humor Style","Habits & Vices","Appearance","Vocabulary","Mannerisms"];
function sheetDensity(){
  const el = document.getElementById('sheetDensity');
  return el ? el.value : 'standard';
}
let _densityPending = false;
function markDensityPending(){ _densityPending = true; }
function applySheetDensity(titles){
  if (!_densityPending) return;
  _densityPending = false;
  const mode = sheetDensity();
  if (mode === 'standard') return;                    // the historical behaviour, untouched
  titles.forEach(t=>{
    if (mode === 'everything') collapsedGroups[t] = false;
    else collapsedGroups[t] = DENSITY_DEEP_GROUPS.includes(t);   // 'summary'
  });
}
function onDensityChange(){
  markDensityPending();
  if (Object.keys(state).length) renderSheet();
  if (typeof savePrefs === 'function') savePrefs();
}

/* Section-level actions. Until now the only granularities were one card and the whole
   sheet, which is a strange gap on a forty-card document organised into sections. */
function rerollGroup(title){
  const ids = groupSlotIds(title).filter(id => state[id] && state[id].trait && !state[id].locked
    && !(state[id].required && id.startsWith('req_')));
  if (!ids.length){ toast("Nothing in this section can be rerolled — it's all kept, or required by name.", "warn"); return; }
  ids.forEach(id => rerollSlot(id));
  toast(`Rerolled ${ids.length} card${ids.length===1?'':'s'} in ${title}.`);
}
function lockGroup(title, locked){
  const ids = groupSlotIds(title).filter(id => state[id] && state[id].trait);
  ids.forEach(id => { state[id].locked = locked; });
  renderSheet();
}
// One definition of "which slots belong to this section", shared by renderSheet and the
// section actions, so a section button can never operate on a different set of cards
// than the section it sits on.
function groupSlotIds(title){
  const g = (SHEET_GROUPS || []).find(x => x.title === title);
  return g ? g.ids.filter(id => state[id]) : [];
}
let SHEET_GROUPS = [];
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

/* ================= SUMMARY CARD =================
   A default build produces 37 populated slots, and at profileDepth 4 it passes forty.
   Collapse and compact both exist but default to expanded, so the first thing a new
   character presented was five screens of cards with no entry point — the user had to
   read all of it to learn anything about who this person is.

   Everything here is already computed and already on the page somewhere: the emergent
   name is in the archetype tag, the fingerprint and coherence are down in the insight
   panel, the loud traits are the caricature guard's input. What was missing was a place
   that answers "who is this" in five lines before the detail starts. This is a reading
   order change, not new analysis.

   Deliberately NOT collapsing every group by default alongside this: that would change
   how the sheet behaves for people who already use it, and the summary on its own
   supplies the entry point that was actually missing. */
function summaryCardHTML(){
  const slots = Object.values(state).filter(s=> s && s.trait);
  if (!slots.length) return "";

  const emergent = (typeof emergentArchetypeName === 'function') ? emergentArchetypeName(state) : null;
  // "Unnamed Character" is the generator's placeholder, not a name the user chose — an
  // emergent title says far more, so it takes the headline when there is no real name.
  const named = charMeta.name && charMeta.name !== "Unnamed Character" ? charMeta.name : null;
  const title = named || (emergent && emergent.name) || "This character";
  const sub = (emergent && named) ? emergent.name : "";

  // The loudest traits are the sheet's own headline: highest intensity first, and among
  // equals prefer the deeper sections over a mannerism, since "what they want" carries
  // further than "taps the table".
  const weightOfSection = sec =>
    sec === "Motivation & Wound" ? 3 :
    (sec === "Personality Traits" || sec === "Values & Moral Line" || sec === "Conflict & Stress Response") ? 2 : 1;
  const loudest = slots.slice()
    .sort((a,b)=> (b.trait.intensity - a.trait.intensity)
               || (weightOfSection(b.trait.section) - weightOfSection(a.trait.section)))
    .slice(0, 3);

  let h = `<div class="summaryCard" id="summaryCard">
    <div class="summaryHead">
      <div class="summaryName">${escHTML(title)}</div>
      ${sub ? `<div class="summarySub">${escHTML(sub)}</div>` : ``}
    </div>`;

  const brief = characterBriefHTML();
  if (brief) h += brief;

  if (loudest.length){
    h += `<ul class="summaryTraits">` + loudest.map(s=>
      `<li><b>${escHTML(s.trait.trait)}</b> <span class="summaryCat">${escHTML(s.trait.category)}</span></li>`
    ).join("") + `</ul>`;
  }

  const fp = (typeof voiceFingerprint === 'function') ? voiceFingerprint(state, charMeta) : "";
  if (fp) h += `<div class="summaryVoice">${escHTML(fp)}</div>`;

  const co = (typeof coherenceScore === 'function') ? coherenceScore(state) : null;
  const bits = [];
  if (co) bits.push(`Coherence <b>${co.pct}%</b>${co.significant ? ` (${co.lift>=0?'+':''}${co.lift} vs chance)` : ` (within noise)`}`);
  bits.push(`<b>${slots.length}</b> traits below`);
  h += `<div class="summaryMeta">${bits.join(" · ")}</div>`;

  const why = whyThisCharacterHTML();
  if (why) h += why;

  return h + `</div>`;
}

/* ================= THE CHARACTER BRIEF =================
   The summary card was three loud traits and a coherence figure — an entry point, but
   still a list. Everything needed to say who this person actually IS has been resolved
   during the build and is sitting in `state`: the Want, the Fear, the Wound, the
   resolved Role and Values, and one signature voice trait. Assembling those into three
   plain sentences is pure composition of data that already exists, and it turns the
   top of the sheet from "here are some traits" into a brief a writer can act on.

   Written to degrade gracefully: every clause is optional, and a sheet with the deep
   sections switched off simply produces a shorter brief rather than an awkward one. */
function characterBriefHTML(){
  const catTrait = (prefix, catRe) => {
    const id = Object.keys(state).find(k => k.startsWith(prefix) && state[k] && state[k].trait
      && catRe.test(state[k].trait.category));
    return id ? state[id].trait : null;
  };
  const want  = catTrait("prof_motivation_", /Core Want/i);
  const fear  = catTrait("prof_motivation_", /Core Fear/i);
  const wound = catTrait("prof_motivation_", /Core Wound/i);
  const role  = slotCat(state["prof_role_0"]);
  const values= slotCat(state["prof_values_0"]);

  // One voice trait, preferring the rarest: the point of this line is what they sound
  // like, and the rarest voice trait is the one that actually distinguishes them.
  const voiceIds = Object.keys(state).filter(k =>
    ['verbosity','register','grammar'].includes(k) || k.startsWith('vocab'));
  const rank = t => RTIER_ORDER.indexOf(t.rarity);
  const voice = voiceIds.map(k=>state[k]).filter(s=>s && s.trait).map(s=>s.trait)
    .sort((a,b)=> rank(b) - rank(a) || b.intensity - a.intensity)[0];

  /* Trait names are authored as titles ("Loyalty-Bound", "Fear-of-wasted-potential"),
     so lower-casing them to fit a sentence produces "loyalty-Bound" and worse. Every
     clause below is shaped so the name can be dropped in exactly as written. */
  const sentences = [];
  if (want) sentences.push(`Wants <b>${escHTML(want.trait)}</b>.`);
  if (fear) sentences.push(`Afraid of <b>${escHTML(fear.trait)}</b>${wound ? `, and carrying <b>${escHTML(wound.trait)}</b>` : ``}.`);
  else if (wound) sentences.push(`Carrying <b>${escHTML(wound.trait)}</b>.`);

  const room = [];
  if (role) room.push(`takes the <b>${escHTML(role)}</b>'s seat`);
  if (values) room.push(`measures things by <b>${escHTML(values)}</b>`);
  if (room.length){
    sentences.push(`In a room, ${room.join(" and ")}.`);
  }
  if (voice) sentences.push(`Sounds like: <b>${escHTML(voice.trait)}</b>${voice.example ? ` &mdash; &ldquo;${escHTML(voice.example)}&rdquo;` : ``}`);
  // Two clauses is the point where this reads as a brief rather than a fragment.
  if (sentences.length < 2) return "";
  return `<p class="summaryBrief">${sentences.join(" ")}</p>`;
}

/* The per-slot "why?" panel is the best thing in the UI and it is per-slot and
   collapsed: it can tell you why ONE trait arrived but never why this character did.
   The signals are already resolved during a build — the pushed sliders, the archetype,
   the resolved profile categories, the context bias — so this is a matter of naming
   the loudest three rather than computing anything new. */
function whyThisCharacterHTML(){
  const drivers = [];

  const pushed = PERSONALITY_AXES
    .map(a=>{ const el = document.getElementById('pers_'+a.id); return {a, raw: el ? (parseInt(el.value,10)||0) : 0}; })
    .filter(x=> Math.abs(x.raw) >= 25)
    .sort((x,y)=> Math.abs(y.raw) - Math.abs(x.raw))
    .slice(0, 3);
  pushed.forEach(x=> drivers.push(`<b>${escHTML(x.a.label)}</b> at ${x.raw}`));

  if (charMeta.archetypeLabel && charMeta.archetypeLabel !== "Imported" && !drivers.length)
    drivers.push(`the <b>${escHTML(charMeta.archetypeLabel)}</b> archetype`);

  if (charMeta.contextNotes && charMeta.contextNotes.length)
    drivers.push(`context read as <b>${escHTML(charMeta.contextNotes.join(", "))}</b>`);

  // drawAll sections (Motivation & Wound) take one trait from EVERY category, so naming
  // the first of them as what the section "resolved to" states a choice that was never
  // made. Only the sections that actually pick a category belong here.
  const chosen = PROFILE_SECTIONS.filter(ps=> !ps.drawAll).map(ps=>{
    const c = slotCat(state["prof_"+ps.id+"_0"]);
    return c ? `${ps.label}: ${c}` : null;
  }).filter(Boolean);
  const profBits = chosen.slice(0, 3);

  if (!drivers.length && !profBits.length) return "";
  let h = `<details class="summaryWhy"><summary>Why this character?</summary><div>`;
  if (drivers.length) h += `<div>Strongest signals: ${drivers.join("; ")}.</div>`;
  if (profBits.length) h += `<div style="margin-top:5px;">Resolved to ${escHTML(profBits.join(" · "))}${chosen.length>profBits.length?", and more below":""}. Each of those then biased the ones after it.</div>`;
  h += `<div class="sub" style="margin-top:6px;">Every individual card has its own <b>why?</b> button with the full reasoning for that one trait.</div>`;
  return h + `</div></details>`;
}

/* Why a section came out empty, in the user's own terms. Returns null for the ordinary
   case of a section that was never going to produce anything (no constraints set on an
   optional group), so the sheet does not fill up with notes about nothing. */
const GROUP_TOGGLE_IDS = {
  "Personality": "genPersonality", "Speech Pattern": "genSpeech",
  "Vocabulary": "genVocab", "Mannerisms": "genManner", "Appearance": "genAppearance",
};
/* Which trait sections feed each sheet group. Lets a question asked from a section
   header ("why didn't I get X here?") be answered against the pools that section
   actually draws from, which is what makes a partial trait name usable — several
   traits share a fragment across the bank and usually exactly one does inside the
   section you were looking at. Built from PROFILE_SECTIONS so it cannot go stale. */
const SECTIONS_FOR_GROUP = (function(){
  const m = {
    "Personality": ["Personality Traits"],
    "Appearance": ["Appearance"],
    "Speech Pattern": ["Verbosity Traits", "Vocabulary Traits", "Dialogue Grammar Traits"],
    "Vocabulary": ["Vocabulary Traits"],
    "Mannerisms": ["Mannerisms"],
  };
  (typeof PROFILE_SECTIONS !== 'undefined' ? PROFILE_SECTIONS : []).forEach(ps=>{ m[ps.label] = [ps.section]; });
  return m;
})();
function emptyGroupReason(title){
  const toggleId = GROUP_TOGGLE_IDS[title];
  if (toggleId){
    const el = document.getElementById(toggleId);
    if (el && !el.checked) return "Switched off in the generation options — nothing was drawn for this section.";
  }
  const ps = PROFILE_SECTIONS.find(p=>p.label === title);
  if (ps){
    if (!profileSectionEnabled(ps)) return "Switched off in the Character Profile panel.";
    if (bannedSections.has(ps.section)) return `The whole "${ps.section}" section is banned in your constraints, so nothing here can ever be drawn.`;
    const cats = catsOf(ps.section);
    if (cats.length && cats.every(c => bannedCategories.has(c)))
      return "Every category in this section is banned in your constraints.";
    if (cats.length && cats.every(c => !byFilter(ps.section, c).length))
      return "Nothing in this section is drawable at your current constraints — the banned traits cover it entirely.";
    return "Nothing was drawable here at these settings. Ease a constraint or widen the slider precision.";
  }
  if (title === "The one thing that doesn't fit" && !wildcardEnabled()) return null;
  if (title === "Required (constraints)") return null;
  return null;
}

/* The context parser's readings, as chips you can switch off. They used to be a
   comma-separated string in the meta line with no way to disagree with them, so a
   "court reporter" read as aristocratic (or a "not a soldier" read as military) bent
   every category weight in the build with nothing to press. */
function renderContextTags(){
  const host = document.getElementById('contextTags');
  if (!host) return;
  const applied = (charMeta.contextNotes || []);
  const rejected = (charMeta.contextRejected || []);
  if (!applied.length && !rejected.length){ host.style.display = 'none'; host.innerHTML = ''; return; }
  host.style.display = 'block';
  let h = '';
  if (applied.length){
    h += `<span class="ctxLabel">Context read as</span>` + applied.map(l=>
      `<button type="button" class="ctxTag ctxOn" ${actAttr('click','dropContextTag', l)} title="This reading is steering the build. Switch it off and generate again to build without it.">${escHTML(l)} <span aria-hidden="true">&times;</span><span class="srOnly"> — remove this context reading</span></button>`).join('');
  }
  if (rejected.length){
    h += `<span class="ctxLabel">Not applied</span>` + rejected.map(r=>
      `<button type="button" class="ctxTag ctxOff" ${actAttr('click','restoreContextTag', r.label)} title="${escAttr(r.why)}. Press to put it back, then generate again.">${escHTML(r.label)} <span aria-hidden="true">+</span></button>`).join('');
  }
  host.innerHTML = h;
}
function dropContextTag(label){
  suppressContextTag(label);
  toast(`"${label}" will not steer the next generation. Generate again to rebuild without it.`);
  charMeta.contextNotes = (charMeta.contextNotes||[]).filter(l=>l!==label);
  charMeta.contextRejected = (charMeta.contextRejected||[]).concat([{label, why:'you turned this one off'}]);
  renderContextTags();
}
function restoreContextTag(label){
  unsuppressContextTag(label);
  toast(`"${label}" is back in play. Generate again to rebuild with it.`);
  charMeta.contextRejected = (charMeta.contextRejected||[]).filter(r=>r.label!==label);
  renderContextTags();
}

function renderSheet(){
  const sheet = document.getElementById('sheet');
  sheet.classList.add('show');
  const empty = document.getElementById('emptyState');
  if (empty) empty.style.display = 'none';
  setText('sheetTitle', charMeta.name || "Character Voice");
  const metaBits = [];
  if (charMeta.age) metaBits.push("Age " + charMeta.age);
  if (charMeta.context) metaBits.push(charMeta.context);
  setText('charMetaLine', metaBits.join(" · "));
  renderContextTags();

  const body = document.getElementById('sheetBody');
  body.innerHTML = "";
  body.innerHTML = summaryCardHTML();
  // Baseline for the per-slot change detection in renderSlotChange.
  noteRenderedTraits();
  /* Not filtered on ids.length any more: a profile section that produced nothing is
     exactly the case emptyGroupReason exists to explain, and filtering it out here
     removed it from the sheet before that could happen. */
  const profGroups = PROFILE_SECTIONS.map(ps=>({
    title: ps.label,
    ids: Object.keys(state).filter(k=>k.startsWith("prof_"+ps.id+"_"))
  }));
  /* ORDER. The three headline sliders on the controls — Verbosity, Register, Composure —
     drive Speech Pattern, Vocabulary and Mannerisms, and those three groups used to sit
     at the very BOTTOM of the sheet, below Personality and all seven profile sections:
     roughly thirty cards (fifty at profile depth 2) between moving a slider and seeing
     what it did. Motivation & Wound alone contributes seven of those, or fourteen at
     depth 2. The voice groups move up directly under Personality, so what the loudest
     controls in the app change is visible without scrolling past the psychology. The
     profile sections keep their own relative order and simply follow. */
  const groups = [
    {title:"Required (constraints)", ids:Object.keys(state).filter(k=>k.startsWith("req_")||k.startsWith("reqcat_"))},
    {title:"Personality", ids:Object.keys(state).filter(k=>k.startsWith("pers_"))},
    {title:"Speech Pattern", ids:["verbosity","register","grammar"]},
    {title:"Vocabulary", ids:Object.keys(state).filter(k=>k.startsWith("vocab"))},
    {title:"Mannerisms", ids:Object.keys(state).filter(k=>k.startsWith("manner"))},
    ...profGroups,
    {title:"Appearance", ids:Object.keys(state).filter(k=>k.startsWith("app_"))},
    {title:"The one thing that doesn't fit", ids:Object.keys(state).filter(k=>k.startsWith("wild_"))},
  ];
  SHEET_GROUP_TITLES = groups.map(g=>g.title);
  SHEET_GROUPS = groups;
  applySheetDensity(SHEET_GROUP_TITLES);
  groups.forEach(g=>{
    const validIds = g.ids.filter(id=>state[id]);
    /* A section that produced nothing simply vanished, so "off because I turned it off",
       "off because I banned it" and "empty because nothing was drawable at these
       settings" were indistinguishable — and the last of those is a real result the
       user needs to see, not an absence. */
    if(!validIds.length){
      const why = emptyGroupReason(g.title);
      if (why){
        const note = document.createElement('div');
        note.className = "axisGroup emptyGroup";
        note.id = sectionAnchorId(g.title);
        note.innerHTML = `<div class="axisTitle static"><span class="axisGlyph" aria-hidden="true">${sectionGlyph(g.title)}</span>${escHTML(g.title)}<span class="axisCount">empty</span></div>`
          + `<div class="emptyGroupNote">${escHTML(why)}</div>`;
        body.appendChild(note);
      }
      return;
    }
    const div = document.createElement('div');
    const collapsed = !!collapsedGroups[g.title];
    div.className = "axisGroup" + (collapsed ? " collapsed" : "");
    div.id = sectionAnchorId(g.title);
    div.style.setProperty('--section-accent', sectionColor(g.title));
    // PERF FIX: innerHTML += inside a loop re-parses the accumulated HTML on every
    // iteration (quadratic), which was the main source of visible lag on large
    // sheets. Build the string once, assign once.
    // The shape marker beside each title is a non-colour cue: the palette alone made
    // the section system unreadable for anyone who can't separate those hues.
    const keptHere = validIds.filter(id => state[id] && state[id].locked).length;
    let inner = `<div class="axisHead">`
      + `<button class="axisTitle" ${actAttr('click', 'toggleGroup', g.title)} aria-expanded="${collapsed?'false':'true'}" title="Collapse or expand this section">`
      + `<span class="axisGlyph" aria-hidden="true">${sectionGlyph(g.title)}</span>${escHTML(g.title)}`
      + `<span class="axisCount">${validIds.length}${keptHere ? ` · ${keptHere} kept` : ``}</span><span class="axisChev">${collapsed?'▸':'▾'}</span></button>`
      + `<span class="axisActions">`
      + `<button class="axisAction" ${actAttr('click', 'rerollGroup', g.title)} title="Draw a different trait for every unkept card in this section">reroll section</button>`
      + `<button class="axisAction" ${actAttr('click', 'lockGroup', g.title, keptHere < validIds.length)} title="${keptHere < validIds.length ? 'Keep every card in this section through rerolls and regeneration' : 'Release every card in this section'}">${keptHere < validIds.length ? 'keep section' : 'release section'}</button>`
      /* explainWhyNot is one of the best things in the app and it lived behind a
         free-text search box inside an Advanced panel two tabs away — so "why didn't I
         get X?" was only askable by someone who already knew the feature existed and
         could spell the trait. The question is always asked while looking at a section,
         so it belongs on the section. */
      + `<button class="axisAction" ${actAttr('click', 'askWhyNotHere', g.title)} title="Ask why a particular trait didn't come up in this section">why not…?</button>`
      + `</span></div>`;
    if (!collapsed) validIds.forEach(id=>{ inner += traitCardHTML(id, state[id], true, true, null, g.title); });
    div.innerHTML = inner;
    body.appendChild(div);
  });

  /* Announce the result. renderSheet replaces #sheetBody wholesale and nothing moves
     focus, so to a screen reader a generate is indistinguishable from nothing happening.
     A short summary in a live region says what arrived without re-reading forty cards. */
  (function announceSheet(){
    const live = document.getElementById('srAnnounce');
    if (!live) return;
    const filled = Object.values(state).filter(s=> s && s.trait).length;
    const name = charMeta.name || "Character";
    live.textContent = `${name} generated — ${filled} traits across ${groups.filter(g=>g.ids.length).length} sections.`;
  })();

  // Coherence score + soft tension notes
  refreshHandStrip();

  const co = coherenceScore(state);
  const tensions = softTensionsFor(state);
  // The "Your hand" strip carries the coherence figure as a small meter, so the
  // headline number is visible without opening the insight panel.
  (function(){
    const m = document.getElementById('handMeter');
    if (!m) return;
    if (!co){ m.hidden = true; return; }
    m.hidden = false;
    m.querySelector('i').style.width = co.pct + '%';
    m.querySelector('b').textContent = co.pct + '%';
    m.title = `Coherence ${co.pct}% — ${co.label}`;
  })();
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
      </div><div class="coherenceNote">${coherenceAsking(co)} (${co.reinforced} of ${co.total} picks reinforced. A random character with these same settings would score about ${co.basePct}%, and with only ${co.total} picks that baseline itself carries a &plusmn;${co.baseBand}-point 95% band — so a lift smaller than that isn't a real difference.)</div>`;
    }
    h += budgetReportHTML();
    /* Caricature guard — the compound effect the per-trait frequency budget can't see.
       Redundant once an intensity budget is set: the budget answers the same question
       ("is this sheet louder than you asked for?") with a number the user chose, and
       the report above already says what it did about it. */
    const loud = intensityBudgetSet() ? null : loudnessCheck(state);
    if (loud){
      h += `<div class="tensionBlock" style="border-left-color:var(--bubblegum);"><div class="tensionTitle" style="color:var(--bubblegum);">Loud in ${loud.count} directions</div><div style="margin:6px 0;">${loud.note}</div></div>`;
    }
    if (tensions.length){
      h += `<div class="tensionBlock"><div class="tensionTitle">Uncommon combinations — not errors</div><ul>` +
           tensions.map(t=>`<li>${t}</li>`).join("") + `</ul></div>`;
    }
    /* Framed as a prompt, not a defect — see the CONTRADICTION AS CONTENT note in
       engine.js. Sits above the tension list, because it is the one a writer can
       actually use tonight. */
    const contra = contradictionFor(state);
    if (contra){
      h += `<div class="tensionBlock" style="border-left-color:var(--golden-deep); margin-top:10px;">
        <div class="tensionTitle" style="color:var(--golden-deep);">The contradiction &mdash; ${escHTML(contra.axisLabel)}</div>
        <div style="margin:6px 0;">They are <b>${escHTML(contra.hi.trait)}</b> and also <b>${escHTML(contra.lo.trait)}</b>.</div>
        <div style="margin:6px 0; font-style:italic;">${escHTML(contra.question)}</div>
        <div class="sub" style="margin:6px 0 0;">Not an error to fix. A ${escHTML(contra.tier.toLowerCase())} opposition on one axis is where a character stops being a list of traits — answer the question and the rest of the sheet reorganises around it.</div>
      </div>`;
    }
    const patterns = secondOrderTensions(state);
    if (patterns.length){
      h += `<div class="tensionBlock" style="border-left-color:var(--dusk-blue);"><div class="tensionTitle" style="color:var(--dusk-blue);">Emergent patterns</div>` +
           patterns.map(p=>`<div style="margin:6px 0;"><b>${escHTML(p.name)}.</b> ${p.note}</div>`).join("") + `</div>`;
    }
    // Archetype fidelity meter — only meaningful when an archetype seeded the build.
    if (charMeta.archFidelity !== null && charMeta.archFidelity !== undefined){
      // archetypeFidelity returns {pct, total, silent, expressed} now; older saved and
      // imported characters carry the bare number this used to be.
      const af = (typeof charMeta.archFidelity === 'number')
        ? {pct: charMeta.archFidelity, total: null, silent: 0, expressed: null, strength: null}
        : charMeta.archFidelity;
      const f = af.pct;
      const col = f>=70?"var(--emerald)":f>=45?"var(--golden)":"var(--bubblegum)";
      // The silence is reported next to the number rather than folded into it — see the
      // note in archetypeFidelity. "38% of 9 axes, 4 of them unexpressed" is a reading a
      // user can act on; "38%" on its own was not.
      const coverage = (af.total && af.silent)
        ? ` <span style="opacity:.7;font-weight:400;">(${af.expressed} of ${af.total} axes expressed)</span>` : ``;
      // Direction and strength are two different readings and are shown as two (see
      // FIDELITY_REF_MAG): one is a clean proportion, the other is relative to how
      // loudly this trait bank expresses an axis at all.
      const strengthRow = (af.strength === null || af.strength === undefined) ? `` :
        `<div class="coherenceRow" style="margin-top:6px;">
          <div class="coherenceLabel">…and how loudly <b>${af.strength}%</b> <span style="opacity:.7;font-weight:400;">(of a fully-expressed axis)</span></div>
          <div class="coherenceBar"><span style="width:${af.strength}%; background:var(--dusk-blue);"></span></div>
        </div>`;
      h += `<div class="coherenceRow" style="margin-top:10px;">
        <div class="coherenceLabel">Archetype direction <b>${f}%</b>${coverage}</div>
        <div class="coherenceBar"><span style="width:${f}%; background:${col};"></span></div>
      </div>${strengthRow}<div class="coherenceNote">Of the axes this archetype takes a position on and the sheet actually expresses, ${f}% lean the way the archetype asked. The second bar is how strongly they lean, measured against the strongest expression this trait bank produces — not against the archetype's own numbers, which are in different units. Drift is legitimate: this is a compass reading, not a grade.${(af.total && af.silent) ? ` The sheet says nothing either way on ${af.silent} of the ${af.total} axes this archetype takes a position on; those are excluded rather than scored as disagreement. They are usually silent because their section is switched off, or because the traits drawn there carry no polarity on that axis.` : ``}</div>`;
    }
    /* Internal dimensions — the pairs a single slider conflates, read separately from
       the sheet. Only the pairs with evidence on BOTH halves are shown, and a pair is
       flagged when its halves disagree, which is exactly where the slider would have
       lied about this person. */
    try {
      const dims = internalDimensions(state);
      const word = (d, v) => Math.abs(v) < 0.2 ? 'middling' : (v > 0 ? d.high : d.low);
      const rows = INTERNAL_DIMENSION_PAIRS.map(([a,b])=>{
        const da = INTERNAL_DIMENSIONS.find(d=>d.id===a), db = INTERNAL_DIMENSIONS.find(d=>d.id===b);
        const va = dims[a], vb = dims[b];
        if (!va && !vb) return null;
        const split = (va > 0.2 && vb < -0.2) || (va < -0.2 && vb > 0.2);
        return `<div class="dimRow${split ? ' dimSplit' : ''}"><span>${escHTML(da.label)}: <b>${escHTML(word(da, va))}</b></span><span>${escHTML(db.label)}: <b>${escHTML(word(db, vb))}</b></span>${split ? '<span class="dimFlag" title="These two usually travel together on one slider; here they part company.">split</span>' : ''}</div>`;
      }).filter(Boolean);
      if (rows.length){
        h += `<div class="tensionBlock" style="border-left-color:var(--accent-violet); margin-top:10px;"><div class="tensionTitle" style="color:var(--accent-violet);">Two things the sliders treat as one</div>${rows.join('')}<div class="sub" style="margin:6px 0 0;">Read from the sheet, not from the controls: self-worth against self-presentation, depth against expression, and so on. A <b>split</b> is where one slider would have lied about this person.</div></div>`;
      }
    } catch(e){}
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
        h += `<div style="margin-top:12px;"><div class="tensionTitle" style="color:var(--dusk-blue); margin-bottom:4px;">Axis profile</div>${radarSVG([{label:charMeta.name, color:"var(--cast-1)", prof}])}
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
    /* The anti-repetition system works and has always been invisible: it is a silent
       weight applied to traits you can't see being penalised. Naming the traits that
       keep coming back makes the mechanism legible — and is the fastest route to the
       ban button for anyone who is tired of one of them. */
    (function(){
      const rep = recurringTraits(3);
      if (!rep.length) return;
      h += `<div class="tensionBlock" style="border-left-color:var(--muted); margin-top:10px;">
        <div class="tensionTitle" style="color:var(--muted);">Recurring this session</div>
        <ul>` + rep.map(r=>
          `<li><b>${escHTML(r.trait.trait)}</b> — ${r.count} of your last ${r.window} characters `
          + `<button class="markBtn" ${actAttr('click', 'banTrait', r.trait.id)} title="Never draw this trait again">🚫 never again</button></li>`
        ).join("") + `</ul>
        <div class="sub" style="margin:6px 0 0;">These are already being penalised on every draw${avoidRecentEnabled() ? `` : ` — except that <b>Avoid recent traits</b> is currently off, so they are not`}. Banning one is the harder version of the same instruction.</div>
      </div>`;
    })();
    if (lastDepthUntouched.length){
      h += `<div class="depthNote"><b>Depth-first note:</b> no resolved profile category implies ${lastDepthUntouched.join(", ")}, so ${lastDepthUntouched.length>1?"those sliders were":"that slider was"} left exactly as you set ${lastDepthUntouched.length>1?"them":"it"} rather than being reset to centre.</div>`;
    }
    insight.innerHTML = h;
    insight.style.display = h ? "block" : "none";
  }

  renderChangeList();
  refreshBudgetMeters();
  refreshJumpToSection();

  if (pressureState){
    const pbody = document.getElementById('pressureBody');
    pbody.innerHTML = "";
    /* The sheet described a degradation with no cause, no fingerprint and no aftermath —
       three things it already had the data for. They go first, because "what does this
       to them" is the question a writer is actually holding. */
    const pm = pressureState.__pressure || {};
    let head = "";
    if (pm.level !== undefined && pm.level < 0.99){
      head += `<div class="shiftNote holds">Shown at <b>${Math.round(pm.level*100)}%</b> pressure — a bad afternoon rather than the worst day.</div>`;
    }
    if (pm.trigger) head += `<div class="pressureBlock"><b>What sets it off.</b> ${pm.trigger}</div>`;
    const pfp = voiceFingerprint(pressureState, charMeta);
    if (pfp) head += `<div class="pressureBlock"><b>How they sound once it starts.</b> <i>${escHTML(pfp)}</i></div>`;
    if (pm.recovery) head += `<div class="pressureBlock"><b>Afterwards.</b> ${escHTML(pm.recovery)}</div>`;
    pbody.innerHTML = head;
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
  "Competence & Method":"▲", "Positive Origins":"●", "Goals & Stakes":"◆", "Ordinary Texture":"◼",
  "Recovery & Repair":"▲", "Contradiction Functions":"●", "Role by Context":"◼",
};
function sectionGlyph(title){ return SECTION_GLYPHS[title] || "◆"; }

/* §2.13 — the novelty readout gives a percentage; this says WHICH slots moved. The
   data was already being tracked for per-slot rerolls (diffLog); it just never
   survived a full regeneration. */
let lastSheetTraits = null;   // slotId -> trait name, as of the previous generation
let changedSlots = new Set();  // slotIds a full regeneration moved, for the flash highlight
function markChangedSlots(){
  changedSlots = new Set();
  if (!lastSheetTraits) return;
  const now = snapshotSheetTraits(state);
  Object.keys(now).forEach(k=>{ if (lastSheetTraits[k] !== now[k]) changedSlots.add(k); });
}
function snapshotSheetTraits(st){
  const m = {};
  Object.entries(st || {}).forEach(([k,v])=>{ if (v && v.trait) m[k] = v.trait.trait; });
  return m;
}
/* A version the user has deliberately kept to compare against, as opposed to
   lastSheetTraits, which is just "whatever the previous roll happened to be". The diff
   machinery below already did all the work — snapshotSheetTraits produced the map and
   renderChangeList rendered the comparison — and there was no way to point it at
   anything except the immediately preceding generation. So "I liked the one three rolls
   ago, what did I lose?" was unanswerable, which is the question the diff is for. */
let pinnedSnapshot = null;      // {traits, label, at}
function pinCurrentVersion(){
  if (!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  pinnedSnapshot = {
    traits: snapshotSheetTraits(state),
    label: (charMeta && charMeta.name) || (typeof emergentArchetypeName === 'function'
              && (emergentArchetypeName(state)||{}).name) || "pinned version",
    at: Date.now(),
  };
  renderChangeList();
  toast(`Pinned "${pinnedSnapshot.label}". Every generation from now on shows what changed against it.`);
}
function clearPinnedVersion(){ pinnedSnapshot = null; renderChangeList(); toast("Stopped comparing against the pinned version."); }

// Compares the sheet against one baseline map. Shared by both modes so they cannot
// drift, and so "what changed" means the same thing whichever you are looking at.
function diffAgainst(baseline){
  const now = snapshotSheetTraits(state);
  const changed = [], added = [], gone = [];
  Object.keys(now).forEach(k=>{
    if (!(k in baseline)) added.push(now[k]);
    else if (baseline[k] !== now[k]) changed.push({from:baseline[k], to:now[k], slot:k});
  });
  Object.keys(baseline).forEach(k=>{ if (!(k in now)) gone.push(baseline[k]); });
  return {changed, added, gone};
}
function diffBodyHTML(d){
  let h = '<div class="changeBody">';
  d.changed.slice(0, 40).forEach(c=>{
    h += `<div><span class="changeSlot">${escHTML(titleForSlotId(c.slot))}</span> ${escHTML(c.from)} &rarr; <b>${escHTML(c.to)}</b></div>`;
  });
  if (d.changed.length > 40) h += `<div class="sub" style="margin-top:4px;">…and ${d.changed.length - 40} more.</div>`;
  if (d.added.length) h += `<div style="margin-top:6px;"><b>New:</b> ${d.added.slice(0,20).map(escHTML).join(", ")}</div>`;
  if (d.gone.length) h += `<div style="margin-top:6px;"><b>Dropped:</b> ${d.gone.slice(0,20).map(escHTML).join(", ")}</div>`;
  return h + '</div>';
}
function renderChangeList(){
  const box = document.getElementById('changeList');
  if (!box) return;
  const hasSheet = Object.keys(state).length > 0;
  if (!hasSheet || (!lastSheetTraits && !pinnedSnapshot)){ box.style.display = 'none'; return; }

  let h = '';
  if (lastSheetTraits){
    const d = diffAgainst(lastSheetTraits);
    if (d.changed.length || d.added.length || d.gone.length){
      h += `<details><summary>What changed from your last generation (${d.changed.length} replaced, ${d.added.length} new, ${d.gone.length} dropped)</summary>${diffBodyHTML(d)}</details>`;
    }
  }
  if (pinnedSnapshot){
    const d = diffAgainst(pinnedSnapshot.traits);
    const same = !d.changed.length && !d.added.length && !d.gone.length;
    h += `<details${same ? '' : ' open'}><summary>Against the pinned "${escHTML(pinnedSnapshot.label)}" — ` +
         (same ? 'identical so far' : `${d.changed.length} replaced, ${d.added.length} new, ${d.gone.length} dropped`) +
         `</summary>${same ? '<div class="changeBody sub">Nothing has moved since you pinned it.</div>' : diffBodyHTML(d)}` +
         `<div style="margin-top:8px;"><button class="btn-secondary" ${actAttr('click', 'clearPinnedVersion')}>Stop comparing</button></div></details>`;
  } else if (hasSheet){
    h += `<div style="margin-top:6px;"><button class="btn-secondary" ${actAttr('click', 'pinCurrentVersion')} title="Keep this version as a fixed point and show what changes against it from now on">📌 Pin this version to compare against</button></div>`;
  }

  const recurring = (typeof recurringTraits === 'function') ? recurringTraits(3) : [];
  if (recurring.length){
    /* recentTraitIds has held this the whole time and nothing ever showed it to
       anyone — the engine comment says so out loud. It is the direct answer to
       "why does everything I generate feel the same", and it names the specific
       traits rather than leaving it as an impression. */
    h += `<details><summary>Traits you keep getting (${recurring.length} across your last ${recurring[0].window} characters)</summary><div class="changeBody">` +
      recurring.map(r=>
        `<div><b>${escHTML(r.trait.trait)}</b> <span class="sub">— ${r.count} of the last ${r.window}, ${escHTML(r.trait.category)}</span> ` +
        `<button class="markBtn" ${actAttr('click', 'banTrait', r.trait.id)} title="Never draw this trait again">🚫 never again</button></div>`).join('') +
      `<div class="sub" style="margin-top:6px;">These are the pools your settings keep landing in. Banning one, or moving the slider that feeds it, is usually faster than rerolling.</div></div></details>`;
  }

  if (!h){ box.style.display = 'none'; return; }
  box.innerHTML = h;
  box.style.display = 'block';
}

/* Jump-to-section. renderSheet already knows the group titles and stamps each group
   element; this just gives them ids and a way to reach them, because on a phone the
   sheet is a very long scroll and the only navigation was collapse-all. */
function sectionAnchorId(title){ return 'sec-anchor-' + String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
function refreshJumpToSection(){
  const sel = document.getElementById('jumpToSection');
  if (!sel) return;
  const titles = (typeof SHEET_GROUPS !== 'undefined' ? SHEET_GROUPS : [])
    .filter(g => document.getElementById(sectionAnchorId(g.title)))
    .map(g => g.title);
  if (!titles.length){ sel.style.display = 'none'; return; }
  sel.style.display = '';
  sel.innerHTML = '<option value="">Jump to…</option>' +
    titles.map(t=>`<option value="${escAttr(t)}">${escHTML(t)}</option>`).join('');
}
function jumpToSection(title){
  if (!title) return;
  const el = document.getElementById(sectionAnchorId(title));
  if (!el) return;
  // A collapsed section is not a useful jump target — open it on the way.
  if (collapsedGroups[title]){ collapsedGroups[title] = false; renderSheet(); }
  const target = document.getElementById(sectionAnchorId(title));
  if (!target) return;
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
  const heading = target.querySelector('.axisTitle');
  if (heading) heading.focus({preventScroll:true});
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
  const showEx = boolVal('examplesToggle', true);
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
    // A slot can legitimately hold trait:null (pool exhausted by constraints, or an
    // older save file). Guard the TRAIT, not just the slot — fmt() dereferences it.
    const valid = ids.filter(id=>st[id] && st[id].trait);
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
    /* The trigger is authored as HTML for the panel; the text export needs it plain,
       entities included — stripping tags alone leaves "&#39;" on the page. */
    const pm = pState.__pressure || {};
    const plainify = v => String(v || "").replace(/<[^>]+>/g, "")
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    if (pm.level !== undefined && pm.level < 0.99) L.push(`_Shown at ${Math.round(pm.level*100)}% pressure._`, "");
    if (pm.trigger) L.push(`**What sets it off.** ${plainify(pm.trigger)}`, "");
    if (pm.recovery) L.push(`**Afterwards.** ${pm.recovery}`, "");
    /* The base sheet's `block` helper filters slots whose TRAIT is null; the pressure
       section checked only that the slot existed, so one blanked or banned-out pressure
       slot threw `Cannot read properties of null (reading 'trait')` and aborted the
       whole export. Same contract everywhere: a slot with no trait is skipped, and the
       section says so rather than failing. */
    const hasTrait = id => pState[id] && pState[id].trait;
    let pressureSkipped = 0;
    const countSkipped = ids => { pressureSkipped += ids.filter(id=>pState[id] && !pState[id].trait).length; };
    const voiceIds = ["verbosity","register","grammar"];
    countSkipped(voiceIds);
    voiceIds.filter(hasTrait).forEach(id=> L.push(fmt(pState[id])));
    const mannerIds = Object.keys(pState).filter(k=>k.startsWith("p_manner"));
    countSkipped(mannerIds);
    mannerIds.filter(hasTrait).forEach(id=> L.push(fmt(pState[id])));
    const shiftIds = Object.keys(pState).filter(k=>k.startsWith("p_prof_"));
    countSkipped(shiftIds);
    const shifts = shiftIds.filter(hasTrait);
    if (shifts.length){
      L.push("", "### Where they stand under pressure", "");
      shifts.forEach(id=>{
        const s2 = pState[id];
        L.push(s2.shifted ? `- **${s2.fromCat} → ${s2.toCat}**` : `- **Holds: ${s2.fromCat}**`);
        L.push(fmt(s2));
      });
    }
    if (pressureSkipped) L.push("", `_${pressureSkipped} pressure slot${pressureSkipped===1?'':'s'} had no trait to draw (a constraint emptied its pool) and ${pressureSkipped===1?'is':'are'} omitted._`);
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
  'app_stature','app_upkeep','app_presence','archetypeSelect','archetypeVariation','archetypeBlend','seedInput','sheetDensity','wildcardCount','pressureLevel',
  /* The cast and foil controls were the one part of the workspace that no capture
     covered, so "export my setup" and Undo both silently dropped them and a cast was
     unreproducible from a settings file even though it now has a seed. A workspace is
     everything that decides what the next generation produces. */
  'charName','charAge','charContext','castCount','castSeed','castSpread','foilSeed'];
const SETTING_TOGGLES = ['personalityToggle','depthFirstToggle','examplesToggle','stressToggle',
  'genPersonality','genSpeech','genVocab','genManner','genAppearance',
  'avoidRecentToggle','wildcardToggle','foilOpposeComposure','compactToggle','castAnchor'];

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
      // Budgets are non-DOM state like the constraint sets, so they take the same
      // route and inherit workspace persistence, character export and archetype
      // setups for free.
      rarityCaps: Object.assign({}, rarityCaps),
      intensityCaps: Object.assign({}, intensityCaps),
      budgetMode: getBudgetMode(),
      // Whether budgets hold after a reroll or a pin nudge, or only at generation
      // time — see reapplyConstraintsAfterMutation (B14).
      mutationBudgetMode: (typeof getMutationBudgetMode === 'function') ? getMutationBudgetMode() : 'enforce',
    },
    // Bookmarks. Deliberately NOT part of `constraints`: a favourite does not steer
    // generation, which is the whole point of splitting it from "always include".
    favouriteTraitIds: (typeof getFavouriteTraitIds === 'function') ? getFavouriteTraitIds() : [],
    // Content packs switched off for this workspace. Part of the settings because a
    // character generated with a pack off should replay with it off.
    disabledPacks: (typeof getDisabledPacks === 'function') ? getDisabledPacks() : [],
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
  // The variation list depends on which preset is selected; rebuild it before the
  // saved variation value is applied below, or the value has no option to land on.
  if (typeof onArchetypeChange === 'function'){
    onArchetypeChange(false);
    const vsel = document.getElementById('archetypeVariation');
    const want = s.fields && s.fields.archetypeVariation;
    if (vsel && want && [...vsel.options].some(o=>o.value===want)) vsel.value = want;
    const bl = document.getElementById('archetypeBlendVal'), be = document.getElementById('archetypeBlend');
    if (bl && be) bl.textContent = Math.round(parseFloat(be.value)*100) + '%';
  }
  Object.entries(s.toggles||{}).forEach(([id,v])=>{ const el=document.getElementById(id); if (el) el.checked = !!v; });
  Object.entries(s.sections||{}).forEach(([id,cfg])=>{
    const tog = document.getElementById('sec_'+id); if (tog) tog.checked = !!cfg.on;
    const sel = document.getElementById('type_'+id);
    // A restored setting is the saved character's own explicit choice, not a leftover
    // depth-first guess — see AUTO_PROFILE_TYPES.
    if (typeof clearAutoProfileType === 'function') clearAutoProfileType(id);
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
  clearBudgets();
  Object.assign(rarityCaps, c.rarityCaps || {});
  Object.assign(intensityCaps, c.intensityCaps || {});
  setBudgetMode(c.budgetMode || 'redraw');
  if (typeof setMutationBudgetMode === 'function') setMutationBudgetMode(c.mutationBudgetMode || 'enforce');
  const mbm = document.getElementById('mutationBudgetMode');
  if (mbm) mbm.value = c.mutationBudgetMode || 'enforce';
  if (typeof setFavouriteTraitIds === 'function') setFavouriteTraitIds(s.favouriteTraitIds || []);
  if (typeof setDisabledPacks === 'function') setDisabledPacks(s.disabledPacks || []);
  if (typeof refreshPackUI === 'function') refreshPackUI();
  if (typeof refreshBudgetUI === 'function') refreshBudgetUI();
  rerollExclusions = {};
  Object.entries(s.rerollExclusions || {}).forEach(([k,v])=>{ rerollExclusions[k] = new Set(v); });
  refreshConstraintChips();
  if (typeof refreshBudgetChips === 'function') refreshBudgetChips();
  if (typeof togglePersonalityPanel === 'function') togglePersonalityPanel();
  if (typeof toggleExamples === 'function') toggleExamples();
  invalidateSliderCache();
}

/* ================= BUDGETS UI =================
   Built from BUDGET_GROUPS / RTIER_ORDER rather than hand-written markup, so adding a
   tier or a group needs no HTML change and the panel can never disagree with what the
   engine actually enforces. */
function buildBudgetUI(){
  const rg = document.getElementById('rarityCapGrid');
  if (rg){
    rg.innerHTML = RTIER_ORDER.map(tier=>`
      <div class="budgetRow">
        <label for="cap_${tier}" class="budgetLabel"><span class="rarityBadge rarity-${tier}"><span class="rarityGlyph" aria-hidden="true">${RTIER_GLYPH[tier]||"·"}</span>${escHTML(RTIER_LABEL[tier])}</span></label>
        <input type="number" id="cap_${tier}" min="0" max="60" step="1" placeholder="no cap"
               aria-label="Maximum ${escHTML(RTIER_LABEL[tier])} cards on one sheet"
               ${actAttr('input', 'onRarityCapChange', "${tier}")}>
      </div>`).join("");
  }
  const ig = document.getElementById('intensityCapGrid');
  if (ig){
    ig.innerHTML = BUDGET_GROUPS.map(g=>`
      <div class="budgetRow${g.id==='sheet' ? ' budgetRowTotal' : ''}">
        <label for="icap_${g.id}" class="budgetLabel">${escHTML(g.label)}</label>
        <input type="number" id="icap_${g.id}" min="0" max="400" step="1" placeholder="off"
               aria-label="Maximum total intensity for ${escHTML(g.label)}"
               ${actAttr('input', 'onIntensityCapChange', "${g.id}")}>
        <span class="budgetMeter" id="imeter_${g.id}"><i></i><b></b></span>
      </div>`).join("");
  }
  const pr = document.getElementById('budgetPresetRow');
  if (pr){
    pr.innerHTML = Object.entries(BUDGET_PRESETS).map(([k,p])=>
      `<button class="btn-secondary" ${actAttr('click', 'useBudgetPreset', "${k}")}>${escHTML(p.label)}</button>`).join("");
  }
  refreshBudgetUI();
}
// Push engine state back into the controls (used after import, load, preset, reset).
function refreshBudgetUI(){
  RTIER_ORDER.forEach(t=>{
    const el = document.getElementById('cap_'+t);
    if (el) el.value = rarityCaps[t] == null ? "" : rarityCaps[t];
  });
  BUDGET_GROUPS.forEach(g=>{
    const el = document.getElementById('icap_'+g.id);
    if (el) el.value = intensityCaps[g.id] == null ? "" : intensityCaps[g.id];
  });
  const m = document.getElementById('budgetMode');
  if (m) m.value = getBudgetMode();
  refreshBudgetChips();
  refreshBudgetMeters();
}
// Live "N of M possible" readouts, so a typed number has a scale attached.
function refreshBudgetMeters(){
  const cap = (typeof budgetCapacity === 'function') ? budgetCapacity(state) : {};
  BUDGET_GROUPS.forEach(g=>{
    const el = document.getElementById('imeter_'+g.id);
    if (!el) return;
    const c = cap[g.id];
    if (!c || !c.slots){ el.hidden = true; return; }
    el.hidden = false;
    const set = intensityCaps[g.id];
    const shown = set == null ? c.typical : set;
    el.querySelector('i').style.width = Math.min(100, c.max ? (100*shown/c.max) : 0) + '%';
    el.querySelector('b').textContent = `${c.typical} of ${c.max}`;
    el.title = `${c.slots} slot${c.slots===1?'':'s'} on this sheet, currently totalling ${c.typical} intensity out of a possible ${c.max}.`;
  });
}
const _capNum = el => {
  const v = (el.value || "").trim();
  if (v === "") return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : Math.max(0, n);
};
function onRarityCapChange(tier){
  const el = document.getElementById('cap_'+tier);
  if (el) rarityCaps[tier] = _capNum(el);
  refreshBudgetChips(); savePrefs();
}
function onIntensityCapChange(id){
  const el = document.getElementById('icap_'+id);
  if (el){
    const n = _capNum(el);
    if (n == null) delete intensityCaps[id]; else intensityCaps[id] = n;
  }
  refreshBudgetChips(); refreshBudgetMeters(); savePrefs();
}
function onMutationBudgetModeChange(){
  const el = document.getElementById('mutationBudgetMode');
  const mode = el ? el.value : 'enforce';
  setMutationBudgetMode(mode);
  toast(mode === 'enforce'
    ? "Budgets will hold after a reroll or a pin nudge."
    : "Budgets now apply at generation only — the meter will show when an edit takes the sheet over.");
  if (typeof refreshBudgetChips === 'function') refreshBudgetChips();
}
function onBudgetModeChange(){
  const m = document.getElementById('budgetMode');
  if (m) setBudgetMode(m.value);
  refreshBudgetChips(); savePrefs();
}
function useBudgetPreset(key){
  if (!applyBudgetPreset(key)) return;
  refreshBudgetUI(); savePrefs();
  toast(`Budget preset: ${BUDGET_PRESETS[key].label}. Generate to apply it.`);
}
function clearBudgetsUI(){
  clearBudgets();
  refreshBudgetUI(); savePrefs();
  toast("Budgets cleared.");
}
function refreshBudgetChips(){
  const box = document.getElementById('budgetChips');
  if (!box) return;
  let h = "";
  RTIER_ORDER.forEach(t=>{
    if (rarityCaps[t] == null) return;
    h += `<span class="chip chip-tier">max ${rarityCaps[t]} ${escHTML(RTIER_LABEL[t])} <b ${actAttr('click', 'clearOneBudget', "rarity", "${t}")} title="Remove">&times;</b></span>`;
  });
  BUDGET_GROUPS.forEach(g=>{
    if (intensityCaps[g.id] == null) return;
    h += `<span class="chip chip-tier">${escHTML(g.label)} intensity &le; ${intensityCaps[g.id]} <b ${actAttr('click', 'clearOneBudget', "intensity", "${g.id}")} title="Remove">&times;</b></span>`;
  });
  if (h && getBudgetMode() !== 'redraw') h += `<span class="chip chip-ban">over budget: ${getBudgetMode() === 'drop' ? 'drop the loudest' : 'warn only'}</span>`;
  box.innerHTML = h || '<span class="sub" style="margin:0;">No budgets set — every draw stands as dealt.</span>';
}
function clearOneBudget(kind, key){
  if (kind === 'rarity') rarityCaps[key] = null; else delete intensityCaps[key];
  refreshBudgetUI(); savePrefs();
}

/* The app's whole character is that it explains itself, so a budget that silently
   swapped traits would be the first mechanism that doesn't. Every substitution is
   listed, and every unmet cap is stated as unmet rather than quietly dropped. */
/* The DIVERGENCE comment states the structural problem plainly: the matrix makes traits
   reinforce each other, the coherence score rewards exactly that reinforcement, and the
   system therefore optimises toward the modal member of each cluster and then
   congratulates you for it. Reporting the lift over a chance baseline was a real
   mitigation, but the LABEL still reads as a grade — "Tightly coherent" against
   "Deliberately scattered" — and users optimise against grades.

   Same number, reframed as a position on a dial the user set. Divergence is literally
   "how often to draw against the grain", so it already IS the asked-for figure; saying
   what was asked for next to what arrived turns a score into a readout. */
function coherenceAsking(co){
  const div = (typeof divergenceLevel === 'function') ? divergenceLevel() : 0;
  // Divergence 0 means "never diverge", so the implied ask is maximum coherence.
  const asked = Math.round(100 * (1 - div));
  const gap = Math.abs(co.pct - asked);
  // co.label already says "within the noise" in this branch, so don't say it twice.
  if (!co.significant) return `You asked for about ${asked}% coherence (Surprise me at ${div.toFixed(2)}) and this sheet came out at ${co.pct}% &mdash; but with this many picks that gap is inside the noise either way, so it isn't a real difference.`;
  if (gap <= 12) return `You asked for about ${asked}% coherence (Surprise me at ${div.toFixed(2)}); this sheet came out at ${co.pct}% — close to where you set it.`;
  return `You asked for about ${asked}% coherence (Surprise me at ${div.toFixed(2)}); this sheet came out at ${co.pct}%. ${co.pct > asked ? 'Tighter than you asked — raise Surprise me if you want more friction.' : 'Looser than you asked — lower Surprise me, or raise Boost strength, to pull it together.'}`;
}

function intensityBudgetSet(){
  return typeof BUDGET_GROUPS !== 'undefined' && BUDGET_GROUPS.some(g => intensityCaps[g.id] != null);
}
function budgetReportHTML(){
  const r = getBudgetReport();
  if (!r || !r.active) return "";
  const bits = [];
  Object.entries(r.rarity).forEach(([tier, info])=>{
    if (info.unmet) bits.push(`<div><b>${escHTML(RTIER_LABEL[tier]||tier)}</b> is capped at ${info.cap} but ${info.unmet} more ${info.unmet===1?'is':'are'} still on the sheet — the slots holding them are locked, pinned or required, or their categories have nothing else to offer.</div>`);
    else bits.push(`<div>${escHTML(RTIER_LABEL[tier]||tier)}: <b>${info.count > info.cap ? info.cap : info.count}</b> of ${info.cap} allowed.</div>`);
  });
  Object.entries(r.intensity).forEach(([, info])=>{
    bits.push(`<div>${escHTML(info.label)}: <b>${info.total}</b> of ${info.cap} intensity${info.unmet ? ` — <b>over budget</b>, and nothing quieter was available to redraw into. That is a gap in the trait bank for those categories, not a setting you can fix.` : ``}.</div>`);
  });
  if (r.actions.length){
    bits.push(`<div style="margin-top:6px;"><b>${r.actions.length} adjustment${r.actions.length===1?'':'s'}:</b></div><ul style="margin:4px 0 0 16px;">` +
      r.actions.map(a=> `<li>${escHTML(a.from)} &rarr; ${a.to ? escHTML(a.to) : '<i>removed</i>'} <span class="sub" style="display:inline;margin:0;">(${escHTML(a.why)})</span></li>`).join("") + `</ul>`);
  }
  if (!bits.length) return "";
  return `<div class="tensionBlock" style="border-left-color:var(--golden); margin-top:10px;"><div class="tensionTitle" style="color:var(--golden-deep);">Budget adjustments</div>${bits.join("")}</div>`;
}

/* Print scoping. window.print() is synchronous in every engine that matters, but the
   afterprint fallback covers the ones where it isn't, so the class can never be left
   stuck on the body. */
/* The ONE print dispatcher. `mode` is 'summary' (or legacy `true`) for the one-page
   card, anything else for the full sheet; the cast and relationship tabs print
   themselves through their own print stylesheets and pass nothing. */
function printSheet(mode){
  const summaryOnly = (mode === true || mode === 'summary');
  if (!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  const cls = 'print-summary-only';
  const off = ()=> document.body.classList.remove(cls);
  /* Always set the class to match THIS call. Leaving it to a deferred cleanup meant a
     full Print issued immediately after a Print Summary still printed as a summary,
     because the timeout had not run yet. */
  document.body.classList.toggle(cls, summaryOnly);
  window.addEventListener('afterprint', off, {once:true});   // belt and braces
  try { window.print(); } finally { off(); }
}

function exportCharacterJSON(){
  if (!Object.keys(state).length){ toast("Generate a character first.", "warn"); return; }
  const payload = {
    format: "character-voice-sheet", version: CHAR_FORMAT_VERSION,
    exported: new Date().toISOString(),
    charMeta, state, pressureState, pinnedTargets, charVariants, traitNotes,
    sliders: captureSliders(),
    settings: captureSettings(),
  };
  const name = (charMeta.name || "character").replace(/[^a-z0-9_-]+/gi,'_');
  downloadText(JSON.stringify(payload, null, 2), name + ".character.json");
  toast("Exported " + name + ".character.json");
}
/* Structural validation for an imported sheet. Deliberately permissive about what it
   does not know — unknown keys and missing optional blocks are fine, since files written
   by older and newer builds both have to import — and strict only about the shapes the
   render path will actually dereference. */
/* Validation used to stop at the top-level block types and a few trait strings, so a
   file could pass here and then blow up AFTER the globals had been replaced: an
   `exclusivePairs: 123` threw inside restoreSettings, and an orphan trait carrying
   `intensity: 99` threw `Invalid count value: -94` in the middle of rendering its card.
   Either way the user lost the character they had open to a bad file.

   This now checks every field the app will dereference, including the nested
   constraint shapes and the numeric ranges, and NORMALIZES as it goes — the caller
   commits the returned object, not the raw parse. Unknown keys are still tolerated:
   files written by older and newer builds both have to import. */
const MAX_IMPORT_SLOTS = 4000;      // a real sheet is ~40; this is a sanity bound
const MAX_IMPORT_NOTE = 20000;
function validateSheetPayload(p){
  const isPlainObject = v => v && typeof v === 'object' && !Array.isArray(v);
  const isFiniteNum = v => typeof v === 'number' && Number.isFinite(v);
  if (!isPlainObject(p)) throw new Error("File does not contain a character object.");
  if (p.state !== undefined && !isPlainObject(p.state)) throw new Error("The `state` block is not an object.");
  if (p.pressureState != null && !isPlainObject(p.pressureState)) throw new Error("The `pressureState` block is not an object.");
  if (p.charMeta != null && !isPlainObject(p.charMeta)) throw new Error("The `charMeta` block is not an object.");
  if (p.settings != null && !isPlainObject(p.settings)) throw new Error("The `settings` block is not an object.");
  if (p.pinnedTargets != null && !isPlainObject(p.pinnedTargets)) throw new Error("The `pinnedTargets` block is not an object.");
  if (p.charVariants != null && !isPlainObject(p.charVariants)) throw new Error("The `charVariants` block is not an object.");
  if (p.traitNotes != null && !isPlainObject(p.traitNotes)) throw new Error("The `traitNotes` block is not an object.");

  const checkSlots = (st, label) => {
    if (!isPlainObject(st)) return;
    const n = Object.keys(st).length;
    if (n > MAX_IMPORT_SLOTS) throw new Error(`the \`${label}\` block has ${n} slots, which is not a character sheet.`);
    Object.entries(st).forEach(([slotId, slot])=>{
      if (slot === null) return;                       // a legitimately empty slot
      if (!isPlainObject(slot)) throw new Error(`${label} slot "${slotId}" is not an object.`);
      if (slot.target != null && !isFiniteNum(slot.target)) throw new Error(`${label} slot "${slotId}" has a non-numeric target.`);
      if (slot.trait == null) return;                  // trait:null is legitimate too
      if (!isPlainObject(slot.trait)) throw new Error(`${label} slot "${slotId}" has a malformed trait.`);
      if (slot.trait.id === undefined) throw new Error(`${label} slot "${slotId}" has a trait with no id.`);
      // relink() replaces matched traits wholesale, but an orphan keeps its embedded
      // copy and is rendered from it — so an orphan must carry the fields the card reads.
      ['trait','category','section'].forEach(k=>{
        if (typeof slot.trait[k] !== 'string') throw new Error(`${label} slot "${slotId}" has a trait with no ${k}.`);
      });
      /* The card renders intensity as a dot count and as a FREQ_BUDGET lookup, both of
         which assume 1..5. An orphan carrying 99 reached `"x".repeat(5 - 99)`. */
      const t = slot.trait;
      if (t.intensity !== undefined){
        if (!isFiniteNum(t.intensity) || t.intensity < 1 || t.intensity > 5)
          throw new Error(`${label} slot "${slotId}" has an out-of-range intensity (${t.intensity}); it must be 1-5.`);
        t.intensity = Math.round(t.intensity);
      } else t.intensity = 3;
      if (typeof t.rarity !== 'string' || (typeof RTIER_ORDER !== 'undefined' && !RTIER_ORDER.includes(t.rarity)))
        t.rarity = 'common';
      if (t.pol !== undefined && !isPlainObject(t.pol)) throw new Error(`${label} slot "${slotId}" has a malformed polarity block.`);
      if (isPlainObject(t.pol)){
        Object.entries(t.pol).forEach(([ax,v])=>{
          if (!isFiniteNum(v)) throw new Error(`${label} slot "${slotId}" has a non-numeric polarity on "${ax}".`);
        });
      }
      if (t.variant !== undefined && t.variant !== 'a' && t.variant !== 'b') delete t.variant;
    });
  };
  checkSlots(p.state, "state");
  checkSlots(p.pressureState, "pressureState");

  // Pins drive pickInRange targets; a string or an Infinity here is a crash later.
  if (isPlainObject(p.pinnedTargets)){
    Object.entries(p.pinnedTargets).forEach(([k,v])=>{
      if (!isFiniteNum(v)) throw new Error(`pinnedTargets["${k}"] is not a number.`);
      p.pinnedTargets[k] = Math.min(5, Math.max(1, v));
    });
  }
  if (isPlainObject(p.charVariants)){
    Object.entries(p.charVariants).forEach(([k,v])=>{
      if (v !== 'a' && v !== 'b') throw new Error(`charVariants["${k}"] must be "a" or "b".`);
    });
  }
  if (isPlainObject(p.traitNotes)){
    Object.entries(p.traitNotes).forEach(([k,v])=>{
      if (typeof v !== 'string') throw new Error(`traitNotes["${k}"] is not text.`);
      if (v.length > MAX_IMPORT_NOTE) p.traitNotes[k] = v.slice(0, MAX_IMPORT_NOTE);
    });
  }
  // The constraint block is handed straight to restoreSettings, which spreads it into
  // Sets and Maps. `exclusivePairs: 123` used to pass here and throw in there, after
  // the sheet had already been replaced.
  const c = p.settings && p.settings.constraints;
  if (c !== undefined && c !== null){
    if (!isPlainObject(c)) throw new Error("The `settings.constraints` block is not an object.");
    ['bannedCategories','bannedSections','bannedTraitIds','requiredTraitIds','requiredCategories'].forEach(k=>{
      if (c[k] !== undefined && !Array.isArray(c[k])) throw new Error(`settings.constraints.${k} is not a list.`);
    });
    if (c.exclusivePairs !== undefined){
      if (!Array.isArray(c.exclusivePairs)) throw new Error("settings.constraints.exclusivePairs is not a list.");
      c.exclusivePairs.forEach((pair,i)=>{
        if (!Array.isArray(pair) || pair.length !== 2)
          throw new Error(`settings.constraints.exclusivePairs[${i}] is not a pair of trait ids.`);
      });
    }
    if (c.categoryTiers !== undefined && !Array.isArray(c.categoryTiers))
      throw new Error("settings.constraints.categoryTiers is not a list.");
    ['rarityCaps','intensityCaps'].forEach(k=>{
      if (c[k] === undefined) return;
      if (!isPlainObject(c[k])) throw new Error(`settings.constraints.${k} is not an object.`);
      Object.entries(c[k]).forEach(([g,v])=>{
        if (v === null) return;
        if (!isFiniteNum(v) || v < 0) throw new Error(`settings.constraints.${k}.${g} is not a cap.`);
      });
    });
  }
  if (p.settings && p.settings.sliders !== undefined && !isPlainObject(p.settings.sliders))
    throw new Error("The `settings.sliders` block is not an object.");
  if (p.settings && p.settings.disabledPacks !== undefined &&
      (!Array.isArray(p.settings.disabledPacks) || p.settings.disabledPacks.some(x=>typeof x !== 'string')))
    throw new Error("The `settings.disabledPacks` block is not a list of pack ids.");
  return p;
}

function importCharacterJSON(fileInput){
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const p = JSON.parse(reader.result);
      if (p.format !== "character-voice-sheet") throw new Error("Not a character sheet file.");
      /* Every exporter stamps a version and no importer read one, so a file from a
         future build was parsed on the assumption it had this build's shape. Say so
         instead. Older versions are explicitly migratable (version 1 has no `settings`
         block, handled below); a newer one is not, because we cannot know what changed. */
      const fileVersion = (p.version === undefined) ? 1 : p.version;
      if (typeof fileVersion !== 'number' || !Number.isFinite(fileVersion))
        throw new Error("that file's version stamp is not a number.");
      if (fileVersion > CHAR_FORMAT_VERSION)
        throw new Error(`that file was written by a newer version of this app (format ${fileVersion}; this build reads up to ${CHAR_FORMAT_VERSION}). Open it in the newer build, or export it again from there.`);
      /* The format string was the only check, so a file that said the right thing and
         then carried a malformed `state` — a string, an array, slots with no trait
         object — got all the way to renderSheet and threw there, AFTER snapshotHistory
         had run and the globals had been overwritten. The user lost their character to
         a bad file and got a crash instead of a message. Validate the shape first, while
         nothing has been touched yet. */
      /* Validate and normalize into a STAGED object, then commit in one go. The
         sequence used to be validate-lightly, snapshot, assign globals, restore
         settings, render — with two of those steps able to throw after the user's
         open character had already been replaced. Everything that can fail now
         happens before `state` is touched. */
      const staged = validateSheetPayload(p);
      // Re-link every imported trait to the live TRAITS pool by id, so imported
      // characters keep working with reroll/pin/why (which need live trait objects)
      // and quietly survive trait-text updates between app versions. Unmatched ids
      // (removed traits) keep their embedded copy, flagged so the user knows.
      const byId = TRAITS_BY_ID;   // PERF: was rebuilding the 7,073-entry map per import
      let orphans = 0;
      const relink = (st)=>{ if(!st) return st;
        Object.values(st).forEach(s=>{
          if (s && s.trait){ const live = byId.get(s.trait.id); if (live) s.trait = live; else orphans++; }
        }); return st; };
      // Resolve ids against the live bank while still staged.
      const nextState = relink(staged.state || {});
      const nextPressure = relink(staged.pressureState || null);
      // Everything above could throw; nothing below can. Commit.
      snapshotHistory();
      state = nextState;
      pressureState = nextPressure;
      charMeta = staged.charMeta || {name:"Imported", age:"", context:"", archetypeLabel:"Imported"};
      pinnedTargets = staged.pinnedTargets || {};
      charVariants = staged.charVariants || {};
      traitNotes = staged.traitNotes || {};
      diffLog = {}; rerollExclusions = {}; rerollHistory = {}; whyOpen = {}; OPEN_CARD_CONTROLS.clear();
      if (staged.settings) restoreSettings(staged.settings);
      else if (staged.sliders) restoreSliders(staged.sliders);   // version 1 files
      lastGeneratedSliders = (staged.settings && staged.settings.sliders) || staged.sliders || null;
      setVal('charName', charMeta.name || "");
      setVal('charAge', charMeta.age || "");
      setVal('charContext', charMeta.context || "");
      setText('archetypeTag', charMeta.archetypeLabel || "Imported");
      document.getElementById('pressureSheet').style.display = pressureState ? "block" : "none";
      onSliderChange(); renderSheet(); checkConflicts();
      if (!staged.settings) toast("Imported. This file predates full-settings export, so constraints and counts were left as they are.", "warn", 6000);
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
/* What makes an archetype record unusable. Everything an archetype contributes to a
   build is a number on a known scale; a string, a NaN or an out-of-range value here
   reaches the slider blend in _runGeneration and poisons the character silently. */
function archetypeProblem(a){
  if (!a || typeof a !== 'object' || Array.isArray(a)) return "it is not an object";
  if (typeof a.label !== 'string' || !a.label.trim()) return "it has no label";
  if (a.label.length > 120) return `the label of "${a.label.slice(0,30)}…" is too long`;
  const num = v => typeof v === 'number' && Number.isFinite(v);
  for (const k of ['verbosity','register','composure']){
    if (a[k] !== undefined && (!num(a[k]) || a[k] < -2 || a[k] > 2)) return `"${a.label}" has an out-of-range ${k}`;
  }
  if (a.pers !== undefined){
    if (!a.pers || typeof a.pers !== 'object' || Array.isArray(a.pers)) return `"${a.label}" has a malformed personality block`;
    for (const [axis, v] of Object.entries(a.pers)){
      if (!num(v) || v < -100 || v > 100) return `"${a.label}" has an out-of-range value on ${axis}`;
    }
  }
  if (a.profile !== undefined && (!a.profile || typeof a.profile !== 'object' || Array.isArray(a.profile)))
    return `"${a.label}" has a malformed profile block`;
  return null;
}
function normalizeArchetype(a){
  const out = {label: a.label.trim()};
  ['verbosity','register','composure'].forEach(k=>{ out[k] = typeof a[k] === 'number' ? a[k] : 0; });
  if (a.pers) out.pers = Object.assign({}, a.pers);
  if (a.profile) out.profile = Object.assign({}, a.profile);
  if (typeof a.vocabPref === 'string') out.vocabPref = a.vocabPref;
  if (typeof a.blurb === 'string') out.blurb = a.blurb;
  if (a.settings && typeof a.settings === 'object' && !Array.isArray(a.settings)) out.settings = a.settings;
  return out;
}
function importArchetypes(fileInput){
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const p = JSON.parse(reader.result);
      if (p.format !== "character-voice-archetypes") throw new Error("Not an archetype library file.");
      const ARCH_FORMAT_VERSION = 1;
      const av = (p.version === undefined) ? 1 : p.version;
      if (typeof av !== 'number' || av > ARCH_FORMAT_VERSION)
        throw new Error(`that archetype file is format ${av}; this build reads up to ${ARCH_FORMAT_VERSION}.`);
      /* Was: write every record straight to `archetype:<label>`, validating nothing
         beyond a truthy label. A preset you had tuned could be destroyed by a file you
         opened to look at, a malformed numeric field propagated into generation, and a
         failure halfway through left a half-imported library with no way back.
         Validate everything first, show what will change, then write. */
      const incoming = Object.values(p.archetypes || {});
      const ok = [], rejected = [];
      incoming.forEach((arch, i)=>{
        const why = archetypeProblem(arch);
        if (why) rejected.push({label: (arch && arch.label) || ('record ' + (i+1)), why});
        else ok.push(normalizeArchetype(arch));
      });
      if (!ok.length) throw new Error(rejected.length
        ? `none of the ${rejected.length} record(s) in that file are usable — ${rejected[0].why}`
        : "that file contains no archetypes.");
      const replacing = ok.filter(a=> CUSTOM_ARCHETYPES[a.label] !== undefined || ARCHETYPES[a.label] !== undefined);
      const adding = ok.length - replacing.length;
      const lines = [`${adding} new preset${adding===1?'':'s'}.`];
      if (replacing.length) lines.push(`${replacing.length} will REPLACE existing preset${replacing.length===1?'':'s'}: ${replacing.map(a=>a.label).join(', ')}.`);
      if (rejected.length) lines.push(`${rejected.length} malformed record${rejected.length===1?'':'s'} will be skipped.`);
      if (!await askForConfirm("Import archetypes?\n\n" + lines.join("\n"), "Import")) { fileInput.value = ""; return; }
      // Keep rollback data for the presets about to be overwritten.
      const rollback = [];
      for (const a of replacing){
        try { const cur = await storage.get('archetype:'+a.label); if (cur && cur.value) rollback.push({label:a.label, value:cur.value}); } catch(e){}
      }
      let n = 0;
      try {
        for (const arch of ok){ await storage.set('archetype:'+arch.label, JSON.stringify(arch)); n++; }
      } catch(e){
        for (const r of rollback){ try { await storage.set('archetype:'+r.label, r.value); } catch(e2){} }
        throw new Error("the import failed partway and the presets it had already replaced were put back: " + e.message);
      }
      await loadCustomArchetypes();
      toast("Imported " + n + " archetype" + (n===1?"":"s")
        + (rejected.length ? ` — ${rejected.length} malformed record(s) skipped.` : ""),
        rejected.length ? "warn" : undefined, rejected.length ? 7000 : undefined);
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
      if (!s || !s.trait) return;   // exhausted pool / older save — skip, don't crash the export
      h += `<p style="margin:6px 0;"><b>${esc(s.trait.trait)}</b> <span style="color:#888;font-size:.85em;">(${esc(s.trait.category)} · intensity ${s.trait.intensity}/5 · ${esc(s.trait.rarity)})</span><br>${esc(s.trait.desc)}<br><i style="color:#555;">"${esc(s.trait.example)}"</i></p>`;
    });
  });
  if (pState){
    h += `<h2 style="font-family:Georgia,serif;font-size:1.05em;border-bottom:1px solid #ccc;padding-bottom:2px;margin:16px 0 6px;">Under Pressure</h2>`;
    // The trigger and the aftermath are the two most useful lines on this sheet, and
    // the styled-clipboard export was dropping both.
    const pm = pState.__pressure || {};
    if (pm.level !== undefined && pm.level < 0.99) h += `<p style="margin:6px 0;color:#555;"><i>Shown at ${Math.round(pm.level*100)}% pressure.</i></p>`;
    if (pm.trigger) h += `<p style="margin:6px 0;"><b>What sets it off.</b> ${pm.trigger}</p>`;
    if (pm.recovery) h += `<p style="margin:6px 0;"><b>Afterwards.</b> ${esc(pm.recovery)}</p>`;
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
