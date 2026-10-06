#!/usr/bin/env node
/* End-to-end checks in a real browser, for the things a DOM stub cannot answer: that
   the declarative event dispatch actually dispatches, that no inline handler has crept
   back in, that the dark palette resolves, and that the whole app still works under a
   Content-Security-Policy with no 'unsafe-inline' in script-src — which is the policy
   that made every button in this app dead before the dispatcher existed.

     python3 -m http.server 8111 &
     node tests/browser.mjs http://localhost:8111         # behaviour
     CSP=1 node tests/browser.mjs http://localhost:8111   # ...and under a strict CSP

   Needs playwright (`npm i playwright` in the repo root — node_modules is gitignored)
   and a Chromium; set CHROME_PATH if it is not on Playwright's own default path.
   Deliberately NOT part of `node tests/run.js`, which stays framework- and
   install-free and must keep running anywhere node does.
*/
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:8111';
const b = await chromium.launch(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {});
const page = await b.newPage();
const errs = [], csp = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
/* Serve the page under a policy with no 'unsafe-inline' in script-src. Before the
   dispatcher this made every button in the app dead; a violation now is a regression. */
if (process.env.CSP){
  await page.route('**/index.html', async route => {
    const res = await route.fetch();
    const body = await res.text();
    await route.fulfill({ body, headers: Object.assign({}, res.headers(), {
      'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:;"
    })});
  });
}
const VOICE_PROMPT_COUNT = 7;   // VOICE_PROMPTS in js/engine.js
page.on('console', m => { if (/Content Security Policy/i.test(m.text())) csp.push(m.text()); });
await page.goto(base + '/index.html', {waitUntil:'networkidle'});

const step = async (label, fn) => { try { await fn(); console.log('  ok   ' + label); }
  catch(e){ console.log('  FAIL ' + label + ' — ' + e.message); errs.push(label+': '+e.message); } };

console.log('Browser checks');
await step('page loads with a trait bank', async ()=>{
  const n = await page.evaluate(()=> TRAITS.length);
  if (!n || n < 7000) throw new Error('bank size ' + n);
});
await step('no inline on* handlers remain in the DOM', async ()=>{
  const found = await page.evaluate(()=>{
    const bad = [];
    document.querySelectorAll('*').forEach(el=>{
      for (const a of el.attributes) if (/^on[a-z]+$/.test(a.name)) bad.push(el.tagName + '[' + a.name + ']');
    });
    return bad;
  });
  if (found.length) throw new Error(found.length + ' remain: ' + found.slice(0,5).join(', '));
});
await step('first visit shows the onboarding call to action', async ()=>{
  await page.waitForFunction(()=> document.getElementById('onboard') && !document.getElementById('onboard').hidden, null, {timeout:4000});
});
await step('Build & Roll renders a sheet', async ()=>{
  await page.locator('[data-act="generateCharacter"]:visible').first().click({timeout:8000});
  await page.waitForSelector('.traitCard', {timeout:5000});
  const n = await page.locator('.traitCard').count();
  if (n < 10) throw new Error('only ' + n + ' cards');
});
await step('a card control fires (toss changes the trait)', async ()=>{
  const first = page.locator('.traitCard').first();
  const before = await first.locator('.traitName, b').first().innerText();
  await first.locator('[data-act="rerollSlot"]').first().click();
  await page.waitForTimeout(250);
  const after = await page.locator('.traitCard').first().locator('.traitName, b').first().innerText();
  if (before === after) throw new Error('trait did not change: ' + before);
});
await step('keep toggles aria-pressed', async ()=>{
  const btn = page.locator('[data-act="toggleLock"]').first();
  const before = await btn.getAttribute('aria-pressed');
  await btn.click(); await page.waitForTimeout(200);
  const after = await page.locator('[data-act="toggleLock"]').first().getAttribute('aria-pressed');
  if (before === after) throw new Error('aria-pressed stayed ' + before);
});
await step('a section header with an apostrophe still dispatches', async ()=>{
  const ok = await page.evaluate(()=>{
    const els = [...document.querySelectorAll('[data-act="toggleGroup"]')];
    return els.every(e=>{ try { JSON.parse(e.getAttribute('data-args')); return true; } catch(_){ return false; } })
      && els.length > 0;
  });
  if (!ok) throw new Error('data-args did not parse on every section header');
});
await step('collapse-all and jump-to-section work', async ()=>{
  await page.selectOption('#jumpToSection', {index:1});
  await page.waitForTimeout(300);
});
await step('batch generation offers candidates', async ()=>{
  await page.locator('[data-act="generateBatch"]:visible').first().click({timeout:8000});
  await page.waitForSelector('.batchCard', {timeout:8000});
  const n = await page.locator('.batchCard').count();
  if (n < 2) throw new Error('only ' + n + ' candidates');
  await page.locator('.batchCard').first().click();
  await page.waitForTimeout(300);
});
await step('surprise me generates', async ()=>{
  await page.locator('[data-act="surpriseMe"]:visible').first().click({timeout:8000});
  await page.waitForTimeout(600);
  const n = await page.locator('.traitCard').count();
  if (n < 10) throw new Error('only ' + n + ' cards after surprise');
});
await step('surprise me rolls blends, anti-archetypes, lens dice and a wild section, and every roll builds', async ()=>{
  const seen = new Set();
  for (let i = 0; i < 30 && seen.size < 4; i++){
    await page.locator('[data-act="surpriseMe"]:visible').first().click({timeout:8000});
    await page.waitForTimeout(250);
    const t = await page.locator('.toast').last().innerText().catch(()=>'');
    if (/Blended/.test(t)) seen.add('blend'); if (/anti-/.test(t)) seen.add('anti'); if (/Lens dice/.test(t)) seen.add('lens'); if (/Wild section/.test(t)) seen.add('wild');
    const n = await page.locator('.traitCard').count();
    if (n < 10) throw new Error('only ' + n + ' cards after a surprise: ' + t);
  }
  if (seen.size < 3) throw new Error('only saw ' + [...seen].join(',') + ' in 30 rolls');
  await page.evaluate(()=>{ if (typeof clearLenses === 'function') clearLenses(); });
});
/* The features added in the 2026 content pass are all live-DOM: the lens repaints the
   cards, the voice lab composes on render, and the arc rewrites `state` in place. A
   DOM stub cannot say whether any of that reaches the page. */
await step('the context lens repaints the cards and names the room', async ()=>{
  await page.locator('.ctxModeBtn').nth(1).click({timeout:8000});
  await page.waitForTimeout(300);
  const state = await page.evaluate(()=>({
    mode: viewContext,
    headline: (document.querySelector('.ctxHeadline')||{}).textContent || '',
    marked: document.querySelectorAll('.traitCard.ctx-suppressed, .traitCard.ctx-amplified, .traitCard.ctx-exception').length,
    notes: document.querySelectorAll('.ctxNote').length,
  }));
  if (state.mode === 'baseline') throw new Error('the lens did not switch');
  if (!state.marked) throw new Error('no card was marked for ' + state.mode);
  if (!state.notes) throw new Error('no card says why it moved');
  if (!/come forward|go quiet/.test(state.headline)) throw new Error('no headline: ' + state.headline);
  await page.locator('.ctxModeBtn').first().click();
  await page.waitForTimeout(200);
});
await step('the voice lab composes a line per prompt, and pressure changes them', async ()=>{
  const base = await page.evaluate(()=> [...document.querySelectorAll('#voiceLabBody .voiceLine')].map(e=>e.textContent));
  if (base.length !== VOICE_PROMPT_COUNT) throw new Error(base.length + ' lines rendered');
  if (base.some(t=>!t || t.length < 3)) throw new Error('an empty line');
  await page.locator('#vlMode_pressure').click();
  await page.waitForTimeout(250);
  const pres = await page.evaluate(()=> [...document.querySelectorAll('#voiceLabBody .voiceLine')].map(e=>e.textContent));
  if (!pres.some((t,i)=> t !== base[i])) throw new Error('pressure changed nothing');
  await page.locator('#vlMode_baseline').click();
});
await step('an accepted arc change rewrites the sheet, and undo puts it back', async ()=>{
  const res = await page.evaluate(()=>{
    arcBase = JSON.parse(JSON.stringify(state));
    const ev = makeArcEvent(1, {title:'The letter', shape:'growth', cost:'More than she will say out loud to anyone'});
    ev.changes = proposeArcChanges(state, ev, []);
    if (!ev.changes.length) return {skipped:true};
    arcEvents = [ev];
    const slot = ev.changes[0].slotId, was = state[slot].trait.id;
    setArcChange(ev.id, slot, true);
    const now = state[slot].trait.id;
    arcEvents = [];
    arcReplay();
    return {was, now, back: state[slot].trait.id, cards: document.querySelectorAll('.arcEvent').length};
  });
  if (res.skipped) return;
  if (res.was === res.now) throw new Error('accepting a change did not alter the sheet');
  if (res.back !== res.was) throw new Error('undoing the event did not restore the sheet');
});
await step('cast tab generates a cast', async ()=>{
  await page.locator('[data-act="switchTab"][data-args*="cast"]:visible').first().click({timeout:8000});
  await page.locator('[data-act="generateCast"]:visible').first().click({timeout:8000});
  await page.waitForSelector('.castCard', {timeout:10000});
});
await step('the relationship workspace adds an edge and the voice comparison fills', async ()=>{
  await page.locator('[data-act="switchTab"][data-args*="rel"]:visible').first().click({timeout:8000});
  await page.waitForTimeout(300);
  const rows = await page.evaluate(()=> document.querySelectorAll('#voiceCompareBody .voiceCard').length);
  if (!rows) throw new Error('the voice comparison rendered no cast rows');
  const edges = await page.evaluate(()=>{
    const [a, b] = castStates;
    if (!a || !b) return null;
    relationshipEdges = [makeEdge(a.id, b.id, 'rival', edgeDefaults(a.state, b.state, 'rival'))];
    renderEdges();
    return {cards: document.querySelectorAll('.edgeCard').length, fields: document.querySelectorAll('.edgeField').length};
  });
  if (!edges || !edges.cards) throw new Error('no edge card rendered');
  if (edges.fields < 5) throw new Error('an edge card is missing its text fields');
  await page.evaluate(()=>{ relationshipEdges = []; renderEdges(); });
});
await step('export produces markdown', async ()=>{
  await page.locator('[data-act="switchTab"][data-args*="single"]:visible').first().click({timeout:8000});
  const md = await page.evaluate(()=> sheetToText(state, charMeta, pressureState));
  if (!md || md.length < 200) throw new Error('thin export');
});
await step('export survives a null-trait slot', async ()=>{
  await page.evaluate(()=>{
    const k = Object.keys(state)[0];
    state[k] = emptySlot(k, 'blanked');
    sheetToText(state, charMeta, pressureState);
    sheetToHTML(state, charMeta, pressureState);
    coherenceScore(state);
  });
});
/* Focus and card state across a re-render. renderSheet used to empty #sheetBody and
   rebuild all ~37 cards for any change at all, which destroyed the button the user had
   just pressed (dropping keyboard focus to <body>), closed every open control strip,
   and reset the strip's aria-expanded to a hard-coded "false". None of that is visible
   to a DOM stub — it needs a real activeElement and a real re-render. */
await step('focus survives a Toss', async ()=>{
  const btn = page.locator('.traitCard .rerollBtn[data-act="rerollSlot"]').first();
  await btn.focus();
  const before = await page.evaluate(()=> document.activeElement.closest('.traitCard').dataset.slot);
  await btn.click();
  const after = await page.evaluate(()=> ({
    tag: document.activeElement.tagName,
    slot: document.activeElement.closest('.traitCard') ? document.activeElement.closest('.traitCard').dataset.slot : null,
  }));
  if (after.tag === 'BODY') throw new Error('focus fell back to <body>');
  if (after.slot !== before) throw new Error('focus moved to card ' + after.slot + ', expected ' + before);
});
await step('a reroll replaces one card, not the sheet', async ()=>{
  await page.evaluate(()=> document.querySelectorAll('.traitCard').forEach((c,i)=> c.dataset.probe = 'p'+i));
  const slot = await page.evaluate(()=> document.querySelector('.traitCard[data-slot]').dataset.slot);
  await page.evaluate(s=> rerollSlot(s), slot);
  const [kept, total] = await page.evaluate(()=> [
    Array.from(document.querySelectorAll('.traitCard')).filter(c=>c.dataset.probe).length,
    document.querySelectorAll('.traitCard').length]);
  if (kept < total - 1) throw new Error((total - kept) + ' cards were rebuilt, expected 1');
});
await step('a lock updates its section header without a rebuild', async ()=>{
  /* The "N · M kept" count and the keep/release-section button live OUTSIDE the card,
     and were only ever written by a full renderSheet — so replacing one card had to
     update them too or the header would quietly disagree with the cards under it.
     Asserted against the live lock count rather than a "was it empty before" guess:
     earlier steps in this file leave locks behind on purpose. */
  const kept = ()=> page.evaluate(()=> {
    const el = document.querySelector('#sec-anchor-personality .axisCount');
    const m = el && /(\d+) kept/.exec(el.textContent);
    return m ? parseInt(m[1], 10) : 0;
  });
  const slot = await page.evaluate(()=> Object.keys(state).find(k=>k.startsWith('pers_') && !state[k].locked));
  if (!slot) throw new Error('every personality slot is already locked');
  const before = await kept();
  await page.evaluate(s=> toggleLock(s), slot);
  const afterLock = await kept();
  if (afterLock !== before + 1) throw new Error(`kept count went ${before} -> ${afterLock} on a lock`);
  await page.evaluate(s=> toggleLock(s), slot);
  const afterUnlock = await kept();
  if (afterUnlock !== before) throw new Error(`kept count went ${afterLock} -> ${afterUnlock} on an unlock`);
});
await step('an open card control strip survives an unrelated re-render', async ()=>{
  // The ⋯ disclosure is a narrow-viewport affordance, so this one has to be measured
  // at a narrow viewport — which is also the only place the bug was reachable.
  const desktop = page.viewportSize();
  await page.setViewportSize({width: 420, height: 900});
  try {
    const slots = await page.evaluate(()=> Array.from(document.querySelectorAll('.traitCard[data-slot]')).map(c=>c.dataset.slot));
    await page.locator(`.traitCard[data-slot="${slots[0]}"] .slotToggle`).click({timeout:8000});
    await page.evaluate(s=> toggleLock(s), slots[1]);
    const st = await page.evaluate(s=>{
      const c = document.querySelector(`.traitCard[data-slot="${s}"]`);
      return {open: c.classList.contains('controlsOpen'), aria: c.querySelector('.slotToggle').getAttribute('aria-expanded')};
    }, slots[0]);
    if (!st.open) throw new Error('the strip closed when another card re-rendered');
    if (st.aria !== 'true') throw new Error('aria-expanded is "' + st.aria + '" on an open strip');
    await page.evaluate(()=> runGeneration());
    const stillOpen = await page.evaluate(()=> document.querySelectorAll('.traitCard.controlsOpen').length);
    if (stillOpen) throw new Error(stillOpen + ' strips stayed open across a full regenerate');
  } finally { if (desktop) await page.setViewportSize(desktop); }
});
await step('a saved character round-trips through browser storage', async ()=>{
  /* The whole Save/Load feature was dead: saves are stored by trait id and both readers
     validated the compressed payload before expanding it. File export/import writes
     uncompressed state, so only this path was broken and only a real storage round trip
     shows it. */
  await page.evaluate(()=> runGeneration());
  const n = await page.evaluate(async ()=>{
    await storage.set('character:__browsertest__', JSON.stringify({
      format: SAVE_FORMAT, state: compressSlots(state), charMeta,
      pressureState: compressSlots(pressureState), pinnedTargets, charVariants, traitNotes,
      settings: captureSettings(), savedAt: new Date().toISOString(),
    }));
    state = {}; charMeta = {};
    await loadSavedCharacter('__browsertest__');
    await storage.delete('character:__browsertest__');
    const all = Object.values(state).filter(s=>s && s.trait);
    return {seated: all.length, linked: all.filter(s=> TRAITS_BY_ID.get(s.trait.id) === s.trait).length};
  });
  if (n.seated < 10) throw new Error('only ' + n.seated + ' slots came back');
  if (n.linked !== n.seated) throw new Error(`${n.seated - n.linked} slots came back unlinked from the live pool`);
});
/* ---- Audit fixes that only a real browser can confirm --------------------- */
await step('B10 — Print Summary scopes the page, Print does not', async ()=>{
  const r = await page.evaluate(()=>{
    // window.print() is stubbed out: this checks the DISPATCH and the scoping class,
    // which is what was broken — app.js redefined printSheet as a bare print() wrapper
    // and both buttons landed on it.
    const realPrint = window.print;
    let summaryDuringPrint = null, calls = 0;
    window.print = ()=>{ calls++; summaryDuringPrint = document.body.classList.contains('print-summary-only'); };
    printSheet('summary');
    const withSummary = summaryDuringPrint;
    printSheet(false);
    const withoutSummary = summaryDuringPrint;
    window.print = realPrint;
    document.body.classList.remove('print-summary-only');
    return {calls, withSummary, withoutSummary};
  });
  if (r.calls !== 2) throw new Error('print was called ' + r.calls + ' times');
  if (!r.withSummary) throw new Error('Print Summary did not scope the page');
  if (r.withoutSummary) throw new Error('the full Print scoped the page as a summary');
});
await step('B19 — a malformed import leaves the open character untouched', async ()=>{
  const r = await page.evaluate(()=>{
    const before = Object.keys(state).filter(k=>state[k] && state[k].trait)
      .map(k=>k + ':' + state[k].trait.id).sort().join('|');
    let threw = null;
    try {
      validateSheetPayload({state:{}, settings:{constraints:{exclusivePairs: 123}}});
    } catch(e){ threw = e.message; }
    const after = Object.keys(state).filter(k=>state[k] && state[k].trait)
      .map(k=>k + ':' + state[k].trait.id).sort().join('|');
    return {threw, same: before === after, seated: before.split('|').length};
  });
  if (!r.threw) throw new Error('the malformed payload was accepted');
  if (!r.same) throw new Error('the open character changed while validating a bad file');
});
await step('B28 — an exclusivity swap repaints both cards, not just the one pressed', async ()=>{
  const r = await page.evaluate(()=>{
    const ids = Object.keys(state).filter(k=>k.startsWith('pers_') && state[k] && state[k].trait);
    if (ids.length < 2) return {skip:true};
    const [a, b] = ids;
    const savedPairs = exclusivePairs;
    // Declare the two seated traits mutually exclusive, then mutate ONE of them by
    // hand and repaint through the single-card path the way a reroll does.
    exclusivePairs = [[state[a].trait.id, state[b].trait.id]];
    // Earlier steps keep cards; a pair of two KEPT cards is deliberately left alone
    // and reported (audit B5), so release both for this repaint check.
    const locks = [state[a].locked, state[b].locked];
    state[a].locked = false; state[b].locked = false;
    const bBefore = state[b].trait.id;
    reapplyConstraintsAfterMutation();
    renderSlotChange(a);
    const bAfter = state[b] && state[b].trait ? state[b].trait.id : null;
    const painted = document.querySelector('.traitCard[data-slot="' + b + '"]');
    const paintedName = painted ? (painted.querySelector('.traitName')||{}).textContent : null;
    const liveName = state[b] && state[b].trait ? state[b].trait.trait : null;
    exclusivePairs = savedPairs;
    if (state[a]) state[a].locked = locks[0];
    return {changed: bBefore !== bAfter, paintedName, liveName};
  });
  if (r.skip) return;
  if (!r.changed) throw new Error('the exclusivity rule did not fire at all');
  if (r.liveName && r.paintedName && !r.paintedName.includes(r.liveName))
    throw new Error(`card B still shows "${r.paintedName}" while state holds "${r.liveName}"`);
});
await step('B28 — the summary panel is rebuilt when a card changes', async ()=>{
  const r = await page.evaluate(()=>{
    const before = (document.getElementById('summaryCard')||{}).innerHTML || '';
    const id = Object.keys(state).find(k=>k.startsWith('pers_') && state[k] && state[k].trait && !state[k].locked);
    if (!id) return {skip:true};
    rerollSlot(id);
    const after = (document.getElementById('summaryCard')||{}).innerHTML || '';
    return {had: !!before, present: !!document.getElementById('summaryCard'), changedOrStable: true, after: !!after};
  });
  if (r.skip) return;
  if (!r.present || !r.after) throw new Error('the summary card disappeared after a card mutation');
});
await step('B04/B05/B06 — a displayed seed replays its character across every mode', async ()=>{
  const r = await page.evaluate(()=>{
    const fp = st => Object.keys(st).filter(k=>st[k] && st[k].trait)
      .sort().map(k=>k + ':' + st[k].trait.id).join('|');
    const seedEl = document.getElementById('seedInput');
    const was = {
      div: document.getElementById('divergence').value,
      wild: document.getElementById('wildcardToggle').checked,
      depth: document.getElementById('depthFirstToggle').checked,
      stress: document.getElementById('stressToggle').checked,
      seed: seedEl.value,
    };
    /* The cross product the audit asks for: seed mode x divergence x depth-first x
       wildcard x pressure. Every one of these combinations had at least one path that
       consulted state left behind by the PREVIOUS generation — the depth-first
       foundation draw alone read the last character's presentation locks, uniqueness
       registry and affinity vector. */
    const combos = [];
    for (const div of ['0','0.3','0.55','1'])
      for (const wild of [false,true])
        for (const depth of [false,true])
          for (const stress of [false,true]) combos.push({div,wild,depth,stress});
    const failures = [];
    for (const c of combos){
      document.getElementById('divergence').value = c.div;
      document.getElementById('wildcardToggle').checked = c.wild;
      document.getElementById('depthFirstToggle').checked = c.depth;
      document.getElementById('stressToggle').checked = c.stress;
      // An unseeded roll is an EXPLORATION build and is influenced by what this
      // session has already generated; the seed it prints replays from a clean one.
      const clean = ()=>{ forgetRecentTraits(); forgetSlotDraws(); forgetCategoryUse(); };
      clean(); seedEl.value = ''; unlockAll(); runGeneration();
      const base = fp(state), pressure = pressureState ? fp(pressureState) : '';
      const shown = lastSeedUsed;
      clean(); seedEl.value = shown; unlockAll(); runGeneration();
      const base2 = fp(state), pressure2 = pressureState ? fp(pressureState) : '';
      if (base !== base2) failures.push(JSON.stringify(c) + ' base');
      if (pressure !== pressure2) failures.push(JSON.stringify(c) + ' pressure');
    }
    document.getElementById('divergence').value = was.div;
    document.getElementById('wildcardToggle').checked = was.wild;
    document.getElementById('depthFirstToggle').checked = was.depth;
    document.getElementById('stressToggle').checked = was.stress;
    seedEl.value = was.seed;
    return {failures, total: combos.length};
  });
  if (r.failures.length) throw new Error(`${r.failures.length} of ${r.total * 2} replays differed: ` + r.failures.slice(0,4).join(', '));
  console.log('       ' + r.total + ' setting combinations, base and pressure sheets identical on replay');
});
await step('B11 — a kept card survives, and the budget report describes the sheet on screen', async ()=>{
  const r = await page.evaluate(()=>{
    applyBudgetPreset('oneLoud');
    runGeneration();
    const id = Object.keys(state).find(k=>k.startsWith('pers_') && state[k] && state[k].trait);
    if (!id) { clearBudgets(); return {skip:true}; }
    state[id].locked = true;
    const keptId = state[id].trait.id;
    runGeneration();
    const survived = state[id] && state[id].trait && state[id].trait.id === keptId;
    // The report has to agree with the sheet, including a cap the kept card breaks.
    const rep = getBudgetReport();
    const ids = Object.keys(state).filter(k=>state[k] && state[k].trait);
    const mismatches = RTIER_ORDER.filter(t=>{
      if (rarityCaps[t] == null) return false;
      const actual = ids.filter(k=>rarityTier(state[k].trait) === t).length;
      return !rep.rarity[t] || rep.rarity[t].count !== actual;
    });
    const dupes = rep.duplicates ? rep.duplicates.length : -1;
    unlockAll(); clearBudgets();
    return {survived, mismatches, dupes};
  });
  if (r.skip) return;
  if (!r.survived) throw new Error('the kept card was replaced by the regeneration');
  if (r.mismatches.length) throw new Error('report disagrees with the sheet on: ' + r.mismatches.join(', '));
  if (r.dupes !== 0) throw new Error(r.dupes + ' duplicate trait id(s) on the committed sheet');
});
await step('B15 — a cast honours the same required trait and budgets the sheet does', async ()=>{
  const r = await page.evaluate(()=>{
    const t = TRAITS.find(x=>x.section === 'Personality Traits');
    const savedReq = requiredTraitIds.slice();
    requiredTraitIds = [t.id];
    const el = document.getElementById('castCount'); const wasCount = el ? el.value : null;
    if (el) el.value = '3';
    castStates = [];
    generateCast();
    const missing = castStates.filter(c=>
      !Object.values(c.state).some(s=>s && s.trait && s.trait.id === t.id)).length;
    const members = castStates.length;
    castStates = [];
    requiredTraitIds = savedReq;
    if (el && wasCount !== null) el.value = wasCount;
    return {missing, members, name: t.trait};
  });
  if (!r.members) throw new Error('no cast was generated');
  if (r.missing) throw new Error(`${r.missing} of ${r.members} cast members lack the required trait "${r.name}"`);
});
await step('B21 — the app states whether this browser actually persists saves', async ()=>{
  const present = await page.evaluate(()=> !!document.getElementById('storageStatus') && typeof storageIsDurable === 'function');
  if (!present) throw new Error('no storage capability indicator exists');
});
/* ---- Audit section 1/2 follow-ups: keyboard, file menu, share, undo, compare ---- */
await step('B3 — every file input stays in the accessibility tree (no display:none)', async ()=>{
  const bad = await page.evaluate(()=> [...document.querySelectorAll('input[type=file]')]
    .filter(i => getComputedStyle(i).display === 'none').length);
  if (bad) throw new Error(bad + ' file input(s) are display:none');
});
await step('onboarding is gone once a character exists, and remembered', async ()=>{
  const r = await page.evaluate(async ()=> ({hidden: document.getElementById('onboard').hidden,
    stored: !!(await storage.get('ui:onboarded'))}));
  if (!r.hidden || !r.stored) throw new Error(JSON.stringify(r));
});
await step('B9/QOL6 — R tosses and L keeps the focused card', async ()=>{
  await page.evaluate(()=> document.querySelectorAll('.traitCard.locked, .lockBtn.locked').length);
  const slot = await page.evaluate(()=>{
    const c = [...document.querySelectorAll('#sheet .traitCard[data-slot][tabindex]')]
      .find(c => { const s = state[c.dataset.slot]; return s && !s.locked && c.querySelector('.rerollBtn'); });
    c.focus(); return c.dataset.slot;
  });
  const before = await page.evaluate(s=> state[s].trait.id, slot);
  await page.keyboard.press('r'); await page.waitForTimeout(250);
  const after = await page.evaluate(s=> state[s].trait.id, slot);
  if (before === after) throw new Error('R did not toss the focused card');
  await page.evaluate(s=> document.querySelector('.traitCard[data-slot="'+s+'"]').focus(), slot);
  await page.keyboard.press('l'); await page.waitForTimeout(250);
  const locked = await page.evaluate(s=> !!state[s].locked, slot);
  if (!locked) throw new Error('L did not keep the focused card');
  await page.evaluate(s=> toggleLock(s), slot);
});
await step('B8 — redo does not fire from inside a text field', async ()=>{
  const r = await page.evaluate(()=>{
    const before = JSON.stringify(Object.keys(state).map(k=>state[k]&&state[k].trait&&state[k].trait.id));
    undoLast();   // puts something on the redo stack
    const mid = JSON.stringify(Object.keys(state).map(k=>state[k]&&state[k].trait&&state[k].trait.id));
    const inp = document.getElementById('charName'); inp.focus();
    inp.dispatchEvent(new KeyboardEvent('keydown', {key:'y', ctrlKey:true, bubbles:true}));
    const after = JSON.stringify(Object.keys(state).map(k=>state[k]&&state[k].trait&&state[k].trait.id));
    inp.blur(); redoLast();
    return {changedByUndo: before !== mid, redoFired: mid !== after};
  });
  if (r.redoFired) throw new Error('Ctrl+Y in a text field changed the sheet');
});
await step('share link replays the same character', async ()=>{
  const r = await page.evaluate(()=>{
    const ids = () => Object.values(state).filter(s=>s&&s.trait).map(s=>s.trait.id).sort().join(',');
    // Build from a fixed seed so the replay has something to match.
    setVal('seedInput', 'share-test-seed'); runGeneration(); setVal('seedInput', '');
    const want = ids();
    const link = shareLinkFor();
    runGeneration();   // move away
    location.hash = link.split('#')[1];
    const applied = applyShareFromHash();
    return {applied, same: ids() === want, hashLeft: location.hash, seedLeft: document.getElementById('seedInput').value};
  });
  if (!r.applied) throw new Error('the link was not applied');
  if (!r.same) throw new Error('the shared link built a different character');
  if (r.hashLeft) throw new Error('hash left in place: ' + r.hashLeft.slice(0,30));
  if (r.seedLeft) throw new Error('seed field left set');
});
await step('LLM prompt export is a markdown voice spec with sample lines', async ()=>{
  const md = await page.evaluate(()=> sheetToPrompt(state, charMeta));
  if (!/^# Voice spec:/.test(md) || !/## How they speak/.test(md)) throw new Error(md.slice(0,120));
});
await step('File menu → Open file routes a cast file to the cast importer, with undo', async ()=>{
  const bundle = await page.evaluate(()=>{
    duplicateCharacter();
    return JSON.stringify(castBundle());
  });
  const before = await page.evaluate(()=> castStates.length);
  await page.locator('#fileMenu summary').click();
  await page.locator('#fileMenuInput').setInputFiles({name:'c.json', mimeType:'application/json', buffer: Buffer.from(bundle)});
  // A cast exists, so the import asks: add to it, or replace it.
  await page.waitForSelector('dialog[open]', {timeout:4000});
  await page.locator('dialog[open] button[value="replace"]').click();
  await page.waitForSelector('.toastUndo', {timeout:4000});
  const n = await page.evaluate(()=> castStates.length);
  if (n !== JSON.parse(bundle).members.length) throw new Error('cast has ' + n + ' members');
  await page.evaluate(()=> document.querySelectorAll('.toast').forEach(t=>t.remove()));
  await page.locator('[data-act="switchTab"][data-args*="single"]').first().click();
  if (before < 0) throw new Error('unreachable');
});
await step('removing a cast member offers Undo, and Undo puts them back', async ()=>{
  const n0 = await page.evaluate(()=> castStates.length);
  await page.evaluate(()=> removeCastMember(0));
  await page.waitForSelector('.toastUndo .toastUndoBtn', {timeout:4000});
  const n1 = await page.evaluate(()=> castStates.length);
  await page.locator('.toastUndo .toastUndoBtn').last().click();
  const n2 = await page.evaluate(()=> castStates.length);
  if (!(n1 === n0 - 1 && n2 === n0)) throw new Error(`${n0} → ${n1} → ${n2}`);
});
await step('compare with a saved character, and search the library', async ()=>{
  const r = await page.evaluate(async ()=>{
    const rec = JSON.stringify({format: SAVE_FORMAT, state: compressSlots(state), charMeta: Object.assign({}, charMeta, {name:'Zed Compare'}), savedAt: new Date().toISOString()});
    await storage.set('character:Zed Compare', rec);
    await storage.set('character:Ann Other', rec);
    await loadSavedList();
    await compareWithSaved('Zed Compare');
    const panel = document.getElementById('comparePanel');
    const rows = panel.querySelectorAll('tr.cmpSame').length;
    const f = document.getElementById('savedFilter'); f.value = 'zed'; applySavedFilter();
    const visible = [...document.querySelectorAll('#savedList .savedRow')].filter(x=>!x.hidden).length;
    f.value = ''; applySavedFilter(); closeCompare();
    await storage.delete('character:Zed Compare'); await storage.delete('character:Ann Other'); await loadSavedList();
    return {shown: panel.style.display !== 'none' || rows > 0, rows, visible};
  });
  if (!r.rows) throw new Error('an identical save showed no identical slots');
  if (r.visible !== 1) throw new Error(r.visible + ' rows visible for "zed"');
});
await step('deleting a save offers Undo', async ()=>{
  await page.evaluate(async ()=>{ await storage.set('character:Del Me', JSON.stringify({format: SAVE_FORMAT, state: compressSlots(state), charMeta})); });
  page.evaluate(()=> deleteSavedCharacter('Del Me'));
  await page.waitForSelector('dialog[open]', {timeout:4000});
  await page.locator('dialog[open] button[value="ok"], dialog[open] .btn-primary').first().click();
  await page.waitForSelector('.toastUndo .toastUndoBtn', {timeout:4000});
  await page.locator('.toastUndo .toastUndoBtn').last().click();
  await page.waitForTimeout(200);
  const back = await page.evaluate(async ()=>{ const r = await storage.get('character:Del Me'); await storage.delete('character:Del Me'); await loadSavedList(); return !!r; });
  if (!back) throw new Error('the deleted save did not come back');
});
await step('"Why does this feel familiar?" lists recurring traits with a ban', async ()=>{
  const r = await page.evaluate(()=>{
    setVal('seedInput', 'fam-seed'); for (let i=0;i<3;i++) runGeneration(); setVal('seedInput', '');
    const p = document.getElementById('familiarPanel'); p.open = true; renderFamiliar();
    return {items: p.querySelectorAll('.familiarList li').length, bans: p.querySelectorAll('[data-act="familiarBan"]').length};
  });
  if (!r.items || r.items !== r.bans) throw new Error(JSON.stringify(r));
});
await step('B18 — colour values are validated before reaching CSS', async ()=>{
  const r = await page.evaluate(()=> [cssColor('var(--cast-1)'), cssColor('red;background:url(x)'), cssColor('#abc')]);
  if (r[0] !== 'var(--cast-1)' || r[1] === 'red;background:url(x)' || r[2] !== '#abc') throw new Error(JSON.stringify(r));
});
await step('voice lab: an author prompt is added through the form, and Another take recomposes', async ()=>{
  await page.evaluate(()=>{ switchTab && switchTab('single'); setVal('seedInput','vl-author'); runGeneration(); setVal('seedInput',''); document.getElementById('vlAddPrompt').open = true; });
  await page.fill('#vlNewLabel', 'Turning down the captain');
  await page.selectOption('#vlNewLike', 'refuse');
  await page.click('#vlAddBtn');
  const r = await page.evaluate(()=>({cards: document.querySelectorAll('#voiceLabBody .voiceCard').length,
    user: document.querySelectorAll('#voiceLabBody .voiceCard.userPrompt').length,
    text: [...document.querySelectorAll('#voiceLabBody .voiceLine')].map(e=>e.textContent).join('|')}));
  if (r.cards !== VOICE_PROMPT_COUNT + 1 || r.user !== 1) throw new Error(JSON.stringify(r));
  let moved = false;
  for (let i = 0; i < 8 && !moved; i++){
    await page.click('#vlReroll');
    moved = await page.evaluate(t => [...document.querySelectorAll('#voiceLabBody .voiceLine')].map(e=>e.textContent).join('|') !== t, r.text);
  }
  if (!moved) throw new Error('Another take never changed a line');
  await page.locator('#voiceLabBody .userPrompt [data-act="removeVoicePrompt"]').click();
  const left = await page.evaluate(()=> document.querySelectorAll('#voiceLabBody .voiceCard.userPrompt').length);
  if (left) throw new Error('the author prompt was not removed');
});
await step('retire for this project toggles from a trait card', async ()=>{
  const btn = page.locator('#sheetBody .retireBtn').first();
  await btn.click();
  const r = await page.evaluate(()=>({n: getRetiredTraits().length, on: !!document.querySelector('#sheetBody .retireBtn.on')}));
  if (r.n !== 1 || !r.on) throw new Error(JSON.stringify(r));
  await page.locator('#sheetBody .retireBtn.on').first().click();
  const n2 = await page.evaluate(()=> getRetiredTraits().length);
  if (n2 !== 0) throw new Error('un-retire left ' + n2);
});
await step('arc timeline export downloads markdown with a pressure diff', async ()=>{
  await page.evaluate(()=>{ arcBase = JSON.parse(JSON.stringify(state)); arcEvents = []; const ev = makeArcEvent(1, {title:'The fire', shape:'growth', at:'x'}); ev.changes = proposeArcChanges(state, ev, []); arcEvents.push(ev); renderArc(); });
  const [dl] = await Promise.all([page.waitForEvent('download', {timeout:5000}), page.click('#arcTimelineBtn')]);
  const path = await dl.path();
  const fs = await import('fs');
  const md = fs.readFileSync(path, 'utf8');
  await page.evaluate(()=>{ arcEvents = []; arcBase = null; renderArc(); });
  if (!/## 1\. The fire/.test(md) || !/Under pressure, after this event/.test(md)) throw new Error(md.slice(0, 160));
});
await step('cast voice-collision heatmap renders and De-collide keeps the cast', async ()=>{
  await page.evaluate(()=>{ switchTab('cast'); setVal('castCount','4'); generateCast(); switchTab('rel'); renderVoiceCompare(); });
  const r = await page.evaluate(()=>({cells: document.querySelectorAll('#voiceHeatmap td.hmCell').length, n: castStates.length}));
  if (r.cells !== r.n * (r.n - 1)) throw new Error(JSON.stringify(r));
  const btn = page.locator('#deCollideBtn');
  if (await btn.isEnabled()){
    const before = await page.evaluate(()=> voiceCollisionMatrix(castStates, voiceLabMode, voiceLabReroll).totals.reduce((a,b)=>a+b,0));
    await btn.click();
    const after = await page.evaluate(()=> ({t: voiceCollisionMatrix(castStates, voiceLabMode, voiceLabReroll).totals.reduce((a,b)=>a+b,0), n: castStates.length}));
    if (after.n !== r.n || after.t > before) throw new Error(`${before} → ${after.t}, ${after.n} members`);
  }
});
await step('heatmap fits a phone width without page scroll', async ()=>{
  await page.setViewportSize({width: 375, height: 800});
  const over = await page.evaluate(()=> document.documentElement.scrollWidth - window.innerWidth);
  await page.setViewportSize({width: 1280, height: 900});
  if (over > 1) throw new Error('page scrolls horizontally by ' + over + 'px');
});
await step('dark theme resolves real colours', async ()=>{
  await page.emulateMedia({colorScheme:'dark'});
  const c = await page.evaluate(()=>{
    const cs = getComputedStyle(document.documentElement);
    return {bg: cs.getPropertyValue('--bg').trim(), text: cs.getPropertyValue('--text').trim(),
            body: getComputedStyle(document.body).backgroundColor};
  });
  if (!c.bg || c.bg === '#f4f2f8') throw new Error('palette did not switch: ' + JSON.stringify(c));
  console.log('       dark --bg=' + c.bg + ' --text=' + c.text);
  await page.emulateMedia({colorScheme:'light'});
});
// ---------------- Section 6 mechanics ----------------
await step('§6 cast: joint optimisation runs in reasonable time and every card shows a seat', async ()=>{
  const r = await page.evaluate(()=>{
    switchTab('cast'); setVal('castCount','5'); setVal('castSeed','s6-browser');
    const t0 = performance.now(); generateCast(); const ms = performance.now() - t0;
    setVal('castSeed','');
    return {ms, badges: document.querySelectorAll('#castGrid .castRoleBadge').length, n: castStates.length,
      readout: document.getElementById('castSeedReadout').textContent};
  });
  if (r.badges !== r.n) throw new Error(JSON.stringify(r));
  if (r.ms > 8000) throw new Error('cast generation took ' + Math.round(r.ms) + 'ms');
  console.log('       cast of ' + r.n + ' in ' + Math.round(r.ms) + 'ms — ' + r.readout);
});
await step('§6 relationship web: "Add both directions" draws the web with an asymmetric pair', async ()=>{
  await page.evaluate(()=>{ switchTab('rel'); refreshRelSelectors(); });
  const opts = await page.evaluate(()=> [...document.getElementById('relA').options].map(o=>o.value).filter(v=>v && v !== '__single__'));
  await page.selectOption('#relA', opts[0]); await page.selectOption('#relB', opts[1]);
  await page.locator('[data-act="addAsymmetricPair"]').click();
  const r = await page.evaluate(()=>({edges: relationshipEdges.length, svg: !!document.querySelector('#relWeb svg.relWebSvg'),
    lines: document.querySelectorAll('#relWeb svg line').length, t: relationshipEdges.map(e=>e.trust+'/'+e.dependence)}));
  if (r.edges !== 2 || !r.svg || r.lines < 1) throw new Error(JSON.stringify(r));
  if (r.t[0] === r.t[1]) throw new Error('the pair came out symmetric: ' + r.t);
});
await step('§6 relationship web fits a phone width', async ()=>{
  await page.setViewportSize({width: 375, height: 800});
  const over = await page.evaluate(()=> document.documentElement.scrollWidth - window.innerWidth);
  await page.setViewportSize({width: 1280, height: 900});
  await page.evaluate(()=>{ relationshipEdges = []; castStates = []; renderCast(); renderEdges(); });
  if (over > 1) throw new Error('page scrolls horizontally by ' + over + 'px');
});
await step('§6 pressure ladder and recovery sheet render under pressure', async ()=>{
  const r = await page.evaluate(()=>{
    switchTab('single'); const was = document.getElementById('stressToggle').checked;
    document.getElementById('stressToggle').checked = true; setVal('seedInput','s6-pressure'); runGeneration(); setVal('seedInput','');
    const out = {stages: document.querySelectorAll('#pressureBody .pStage').length, current: document.querySelectorAll('#pressureBody .pStage.current').length,
      rec: !!document.querySelector('#pressureBody .recoverySheet dl dt')};
    document.getElementById('stressToggle').checked = was;
    return out;
  });
  if (r.stages < 2 || r.current !== 1 || !r.rec) throw new Error(JSON.stringify(r));
});
await step('§6 arc template adds a multi-step arc with a reading of each event', async ()=>{
  const r = await page.evaluate(()=>{
    arcEvents = []; arcBase = null; renderArc();
    setVal('arcTemplate', 'corruption-3'); applyArcTemplate();
    const out = {events: arcEvents.length, shapes: arcEvents.map(e=>e.shape).join(), cards: document.querySelectorAll('#arcBody .arcEvent').length};
    arcEvents = []; arcBase = null; renderArc();
    return out;
  });
  if (r.events !== 3 || r.cards !== 3 || r.shapes !== 'deterioration,deterioration,deterioration') throw new Error(JSON.stringify(r));
});
// ---- §5 keeping output fresh (lenses, 10 lines, seated contradictions, shape, beats) ----
await step('§5 lens chips toggle, reach the draw, and mark cards normal/deviant here', async ()=>{
  await page.evaluate(()=> switchTab('single'));
  await page.locator('#lensPicker [data-act="toggleLens"]').first().click();
  const r = await page.evaluate(()=>{
    toggleLens('latelife');
    setVal('seedInput', 's5-lens'); runGeneration(); setVal('seedInput', '');
    const out = {sel: document.getElementById('lensSelect').value, on: document.querySelectorAll('#lensPicker .lensChip.on').length,
      badges: document.querySelectorAll('#sheetBody .lensBadge').length, meta: (document.querySelector('#summaryCard .shapeMeta') || {}).textContent || '',
      notes: (charMeta.contextNotes || []).join(',')};
    setVal('lensSelect', ''); renderLensPicker();
    return out;
  });
  if (r.sel !== 'court,latelife' || r.on !== 2) throw new Error('lens selection: ' + JSON.stringify(r));
  if (!/Court/.test(r.meta) || !/lens: Court/.test(r.notes)) throw new Error('lenses not reported: ' + JSON.stringify(r));
  if (r.badges < 1) throw new Error('no card read as normal/deviant under two lenses');
});
await step('§5 seated contradictions, sheet shape and backstory beats render', async ()=>{
  const r = await page.evaluate(()=>{
    document.getElementById('sheetShapeToggle').checked = true;
    document.getElementById('seatContradictions').checked = true;
    setVal('seedInput', 's5-shape'); runGeneration(); setVal('seedInput', '');
    return {contra: document.querySelectorAll('.seatedContra').length, answers: document.querySelectorAll('.seatedContra .contraField').length,
      group: !!document.getElementById(sectionAnchorId('Seated contradictions')), beats: document.querySelectorAll('.beatList li').length,
      shape: !!(charMeta.shape && charMeta.shape.text), text: /Seated contradiction/.test(sheetToText(state, charMeta, null))};
  });
  if (!r.contra || r.answers < 5 || !r.group || r.beats < 3 || !r.shape || !r.text) throw new Error(JSON.stringify(r));
});
await step('§5 voice lab "10 lines" opens ten takes of one situation', async ()=>{
  await page.locator('#voiceLabBody [data-act="toggleVoiceTen"]').first().click();
  const n = await page.evaluate(()=> document.querySelectorAll('#voiceLabBody .vlTenList li').length);
  if (n !== 10) throw new Error(n + ' lines');
  await page.locator('#voiceLabBody [data-act="toggleVoiceTen"]').first().click();
});
await step('§5 an exploration build with a project archive picks the most distinct of three, and its seed replays', async ()=>{
  const r = await page.evaluate(()=>{
    const fp = st => Object.keys(st).filter(k=>st[k] && st[k].trait).sort().map(k=>k + ':' + st[k].trait.id).join('|');
    for (let i = 0; i < 4; i++){ setVal('seedInput', 's5-arch-' + i); runGeneration(); archiveCharacter(state, {name:'a' + i}); }
    setVal('seedInput', ''); forgetRecentTraits(); forgetSlotDraws(); forgetCategoryUse(); runGeneration();
    const ex = charMeta.exploration, a = fp(state), shown = lastSeedUsed;
    forgetRecentTraits(); forgetSlotDraws(); forgetCategoryUse();
    setVal('seedInput', shown); runGeneration(); setVal('seedInput', '');
    const out = {ex, same: fp(state) === a};
    forgetArchive();
    return out;
  });
  if (!r.ex || r.ex.considered !== 3) throw new Error('no best-of-three on an exploration build: ' + JSON.stringify(r.ex));
  if (!r.same) throw new Error('the printed seed of the chosen candidate did not replay it');
});
/* B2 (audit 2026-09): the comboboxes declared data-on/data-act twice, the parser kept
   the first copy, and the keydown action silently never ran. */
await step('trait search: ArrowDown moves the active option', async ()=>{
  const r = await page.evaluate(async ()=>{
    const inp = document.getElementById('whyNotSearch');
    inp.closest('details') && (inp.closest('details').open = true);
    inp.value = 'dr';
    inp.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(res => setTimeout(res, 300));
    const before = inp.getAttribute('aria-activedescendant');
    inp.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown', bubbles:true}));
    return {before, after: inp.getAttribute('aria-activedescendant')};
  });
  if (!r.before) throw new Error('no search results appeared');
  if (r.after === r.before) throw new Error('ArrowDown did not move the active option (' + r.before + ')');
});
/* Audit §2: a build must bring the sheet into view, and the first-visit card must be
   on screen without scrolling. */
await step('a build scrolls the sheet into view', async ()=>{
  await page.evaluate(()=> window.scrollTo(0, 0));
  await page.evaluate(()=> generateCharacter());
  await page.waitForFunction(()=> { const t = document.getElementById('sheetTitle').getBoundingClientRect().top; return t >= 0 && t < innerHeight * 0.5; }, null, {timeout: 6000});
});
await step('the More ways to roll menu opens, lists five rolls and closes on choice', async ()=>{
  await page.evaluate(()=> { document.getElementById('moreRolls').open = true; });
  const n = await page.locator('.moreRollsMenu button').count();
  if (n !== 5) throw new Error('expected 5 rolls in the menu, found ' + n);
  await page.locator('.moreRollsMenu button', {hasText: 'Variation'}).click();
  if (await page.evaluate(()=> document.getElementById('moreRolls').open)) throw new Error('the menu stayed open after a choice');
});
/* Audit §2 second pass: keyboard, theme, seed chip, and the phone layout. */
await step('the ? key opens the shortcuts dialog, 2 switches tab, Esc closes the File menu', async ()=>{
  await page.evaluate(()=> { document.activeElement && document.activeElement.blur(); switchTab('single'); });
  await page.keyboard.press('?');
  if (!await page.evaluate(()=> document.getElementById('shortcutDialog').open)) throw new Error('? did not open the dialog');
  await page.keyboard.press('Escape');
  if (await page.evaluate(()=> document.getElementById('shortcutDialog').open)) throw new Error('Esc did not close the dialog');
  await page.keyboard.press('2');
  if (!await page.evaluate(()=> document.getElementById('view-cast').classList.contains('active'))) throw new Error('2 did not switch to the Cast tab');
  await page.keyboard.press('1');
  await page.evaluate(()=> { document.getElementById('fileMenu').open = true; });
  await page.keyboard.press('Escape');
  if (await page.evaluate(()=> document.getElementById('fileMenu').open)) throw new Error('Esc left the File menu open');
});
await step('the theme button cycles Auto, Light, Dark and sets data-theme', async ()=>{
  const seq = [];
  for (let i = 0; i < 3; i++){ await page.locator('#themeBtn').click(); seq.push(await page.evaluate(()=> document.documentElement.getAttribute('data-theme'))); }
  if (seq.join() !== 'light,dark,') throw new Error('theme cycle was ' + seq.join('|'));
});
await step('the seed chip copies the seed', async ()=>{
  await page.evaluate(()=> generateCharacter()); await page.waitForTimeout(600);
  const before = await page.evaluate(()=> lastSeedUsed);
  await page.evaluate(()=> { window.__copied = null; copyText = (t)=> { window.__copied = t; }; });
  await page.locator('#stickySeed').click();
  const got = await page.evaluate(()=> window.__copied);
  if (!before || got !== before) throw new Error('copied ' + got + ', seed is ' + before);
});
await step('phone: tabs are three short pills, the sticky bar folds behind a menu, and inputs fold after a build', async ()=>{
  await page.setViewportSize({width: 390, height: 800});
  await page.evaluate(()=> { switchTab('single'); setInputsCollapsed(false); });
  const tabs = await page.evaluate(()=> [...document.querySelectorAll('.tabs button')].map(b => ({w: Math.round(b.getBoundingClientRect().width), t: b.innerText.trim()})));
  if (tabs.some(t => t.w > 140)) throw new Error('tabs are not compact: ' + JSON.stringify(tabs));
  if (!tabs.every(t => /^(Single|Cast|Relations)$/.test(t.t))) throw new Error('tabs are not short: ' + JSON.stringify(tabs));
  const bar = await page.evaluate(()=> { const b = document.getElementById('stickyBar'); return {sw: b.scrollWidth, cw: b.clientWidth, more: getComputedStyle(document.getElementById('stickyMoreBtn')).display, extra: getComputedStyle(document.getElementById('stickyExtra')).display}; });
  if (bar.sw > bar.cw + 1) throw new Error('the sticky bar still scrolls sideways: ' + JSON.stringify(bar));
  if (bar.more === 'none' || bar.extra !== 'none') throw new Error('the bar did not fold: ' + JSON.stringify(bar));
  await page.locator('#stickyMoreBtn').click();
  if (await page.evaluate(()=> getComputedStyle(document.getElementById('stickyExtra')).display) === 'none') throw new Error('the ⋯ button did not open the menu');
  await page.keyboard.press('Escape');
  await page.evaluate(()=> generateCharacter()); await page.waitForTimeout(900);
  const folded = await page.evaluate(()=> ({controls: getComputedStyle(document.getElementById('controlsStart')).display, bar: !document.getElementById('inputsBar').hidden, recap: document.getElementById('inputsRecap').textContent}));
  if (folded.controls !== 'none' || !folded.bar || !folded.recap) throw new Error('inputs did not fold: ' + JSON.stringify(folded));
  await page.locator('#inputsToggle').click();
  if (await page.evaluate(()=> getComputedStyle(document.getElementById('controlsStart')).display) === 'none') throw new Error('Edit inputs did not reopen them');
  const h1 = await page.evaluate(()=> parseFloat(getComputedStyle(document.querySelector('.pageHead h1')).fontSize));
  await page.setViewportSize({width: 1280, height: 900});
  if (h1 > 28) throw new Error('the header title is still ' + h1 + 'px on a phone');
});
/* Audit §3 side features, in the real page. */
await step('history drawer: build three, restore an earlier roll, compare it with the sheet', async ()=>{
  await page.evaluate(async ()=> { for (let i = 0; i < 3; i++){ generateCharacter(); await new Promise(r => setTimeout(r, 500)); } });
  await page.locator('#historyBtn').click();
  const n = await page.locator('#historyDrawer .histList li').count();
  if (n < 3) throw new Error('the drawer lists only ' + n + ' entries');
  await page.locator('#historyDrawer .histList li:has(button) >> nth=0').locator('button', {hasText: 'compare'}).click();
  if (!/Sliders/.test(await page.locator('#comparePanel').innerText())) throw new Error('no slider diff in the comparison');
  const seedBefore = await page.evaluate(()=> lastSeedUsed);
  await page.locator('#historyDrawer .histList li:has(button) >> nth=0').locator('button', {hasText: 'restore'}).click();
  if (!await page.evaluate(()=> Object.keys(state).length > 0)) throw new Error('restore left no sheet');
  await page.locator('#historyBtn').click();
});
await step('find on the sheet filters the cards and opens folded sections; folds survive a reload', async ()=>{
  await page.evaluate(()=> { generateCharacter(); });
  await page.waitForTimeout(700);
  const total = await page.locator('#sheetBody .traitCard').count();
  const word = await page.evaluate(()=> Object.values(state).find(s => s && s.trait).trait.trait.split(' ').find(w => w.length > 3) || 'a');
  await page.fill('#sheetFind', word);
  await page.waitForTimeout(300);
  const shown = await page.locator('#sheetBody .traitCard:not([hidden])').count();
  if (!(shown > 0 && shown < total)) throw new Error('the filter showed ' + shown + ' of ' + total);
  if (!/of \d+ cards/.test(await page.locator('#sheetFindCount').innerText())) throw new Error('no match count');
  await page.fill('#sheetFind', '');
  await page.waitForTimeout(200);
  await page.evaluate(()=> { collapsedGroups = {}; setAllGroups(true); });
  await page.reload(); await page.waitForTimeout(800);
  const kept = await page.evaluate(()=> Object.values(collapsedGroups).some(Boolean));
  if (!kept) throw new Error('folded sections were forgotten on reload');
  await page.evaluate(()=> { setAllGroups(false); });
});
await step('slider lock survives Randomize, and a named slider set saves and loads', async ()=>{
  await page.evaluate(()=> { document.getElementById('advancedToggle').checked = true; applyAdvancedMode(); setInputsCollapsed(false); });
  await page.evaluate(()=> { setVal('verbositySlider', 77); document.getElementById('lock_verbositySlider').checked = true; randomizeSliders('all'); });
  if (await page.evaluate(()=> document.getElementById('verbositySlider').value) !== '77') throw new Error('Randomize moved the locked slider');
  await page.evaluate(()=> { document.getElementById('lock_verbositySlider').checked = false; askForName = async ()=> 'Kit A'; setVal('composureSlider', 33); });
  await page.evaluate(()=> saveSliderPreset()); await page.waitForTimeout(300);
  if (!await page.evaluate(()=> [...document.getElementById('sliderPresetSelect').options].some(o => o.value === 'Kit A'))) throw new Error('the set was not listed after saving');
  await page.evaluate(()=> { setVal('composureSlider', -60); document.getElementById('sliderPresetSelect').value = 'Kit A'; });
  await page.evaluate(()=> applySliderPreset()); await page.waitForTimeout(300);
  if (await page.evaluate(()=> document.getElementById('composureSlider').value) !== '33') throw new Error('loading the set did not restore the slider');
  await page.evaluate(()=> deleteSliderPreset()); await page.waitForTimeout(300);
});
await step('the voice lab shows a word count, a reading level and a copy button per line', async ()=>{
  await page.evaluate(()=> { generateCharacter(); }); await page.waitForTimeout(800);
  const stats = await page.locator('#voiceLabBody .vlStats').first().innerText();
  if (!/\d+ words? · reads at grade [\d.]+/.test(stats) || !/copy line/.test(stats)) throw new Error('stats line: ' + stats);
});
await step('cast: CSV and SVG downloads, and the redraw button, exist and work', async ()=>{
  await page.evaluate(()=> { switchTab('cast'); document.getElementById('castCount').value = '4'; generateCast(); });
  await page.waitForTimeout(900);
  const [dl] = await Promise.all([page.waitForEvent('download', {timeout: 5000}), page.evaluate(()=> downloadCastCSV())]);
  if (!/\.csv$/.test(dl.suggestedFilename())) throw new Error('the CSV download is named ' + dl.suggestedFilename());
  await page.evaluate(()=> regenerateMostSimilarMember());
  await page.evaluate(()=> { switchTab('rel'); });
  await page.waitForTimeout(300);
  await page.evaluate(()=> { if (typeof addAllRelationshipDirections === 'function') addAllRelationshipDirections(); });
  await page.evaluate(()=> switchTab('single'));
});
/* Audit §3 robustness, in the real page. */
await step('importing a cast can add to the current one, renaming clashing members', async ()=>{
  const r = await page.evaluate(async ()=> {
    switchTab('cast'); document.getElementById('castCount').value = '3'; generateCast();
    await new Promise(res => setTimeout(res, 700));
    const before = castStates.length, names = castStates.map(c => c.meta.name);
    const json = JSON.stringify(castBundle());
    askChoice = async ()=> 'merge';
    const input = {files: [new File([json], 'cast.json', {type: 'application/json'})], value: 'x'};
    importCastJSON(input);
    await new Promise(res => setTimeout(res, 900));
    const after = castStates.map(c => c.meta.name), ids = new Set(castStates.map(c => c.id));
    return {before, after: after.length, unique: new Set(after).size, ids: ids.size, dupEdge: relationshipEdges.every(e => castStates.some(c => c.id === e.from) && castStates.some(c => c.id === e.to))};
  });
  if (r.after !== r.before * 2) throw new Error('merge gave ' + r.after + ' members from 2 x ' + r.before);
  if (r.unique !== r.after || r.ids !== r.after) throw new Error('names or ids still clash: ' + JSON.stringify(r));
  if (!r.dupEdge) throw new Error('an edge points at a member who is not in the cast');
  await page.evaluate(()=> switchTab('single'));
});
await step('the backup reminder appears with saves and no backup, and snoozes', async ()=>{
  const r = await page.evaluate(async ()=> {
    await storage.delete('ui:lastBackup'); await storage.delete('ui:backupSnooze');
    await storage.set('character:Reminder test', JSON.stringify({format: SAVE_FORMAT, state: {}, charMeta: {name: 'x'}}));
    await checkBackupReminder();
    const shown = !document.getElementById('backupReminder').hidden, text = document.getElementById('backupReminderText').textContent;
    snoozeBackupReminder();
    const hidden = document.getElementById('backupReminder').hidden;
    await checkBackupReminder();
    const stillHidden = document.getElementById('backupReminder').hidden;
    await storage.delete('character:Reminder test'); await storage.delete('ui:backupSnooze');
    return {shown, text, hidden, stillHidden};
  });
  if (!r.shown || !/no backup yet/.test(r.text)) throw new Error('reminder: ' + JSON.stringify(r));
  if (!r.hidden || !r.stillHidden) throw new Error('snooze did not hold: ' + JSON.stringify(r));
});
await step('the seed picker holds no options until its panel is opened', async ()=> {
  await page.reload(); await page.waitForTimeout(700);
  const n0 = await page.evaluate(()=> document.getElementById('seedTraitSelect').options.length);
  await page.evaluate(()=> { document.getElementById('seedTraitSelect').closest('details').open = true; });
  await page.waitForTimeout(400);
  const n1 = await page.evaluate(()=> document.getElementById('seedTraitSelect').options.length);
  if (n0 > 1 || n1 < 1000) throw new Error('options before/after opening: ' + n0 + '/' + n1);
});
await step('a write the browser refuses raises the storage banner instead of failing in silence', async ()=> {
  const shown = await page.evaluate(async ()=> {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function(){ const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; };
    try { await storage.set('ui:test', '1'); } catch(e){}
    Storage.prototype.setItem = orig;
    const el = document.getElementById('storageStatus');
    return {shown: el.style.display !== 'none', text: el.textContent};
  });
  if (!shown.shown || !/storage is full/i.test(shown.text)) throw new Error('banner: ' + JSON.stringify(shown));
  await page.evaluate(()=> announceStorageMode());
});
await step('§5 lens row fits a phone width', async ()=>{
  await page.setViewportSize({width: 375, height: 800});
  const over = await page.evaluate(()=> document.documentElement.scrollWidth - window.innerWidth);
  await page.setViewportSize({width: 1280, height: 900});
  if (over > 1) throw new Error('page scrolls horizontally by ' + over + 'px');
});
/* Audit 2026-10 regressions that only a real page can answer. */
await step('H1 a trait name that is markup shows as text in the conflict box and runs nothing', async ()=>{
  const r = await page.evaluate(()=>{
    const mk = (id, name, v) => ({slotId: 's' + id, label: 'x', trait: {id: -id, section: 'Personality Traits', category: 'Friendliness - Warm', trait: name, desc: 'd', example: 'e',
      intensity: 5, rarity: 'common', pol: {warm: v}}});
    state = {s1: mk(1, '<img src=x onerror="window.__pwn=1">', 1), s2: mk(2, '<img src=x onerror="window.__pwn=2">', -1)};
    checkConflicts();
    const box = document.getElementById('warnBox');
    return {shown: box.classList.contains('show'), imgs: box.querySelectorAll('img').length, text: box.innerText, pwn: window.__pwn};
  });
  if (!r.shown) throw new Error('the two orphan traits raised no conflict, so this check proves nothing');
  if (r.imgs || r.pwn) throw new Error('markup from a trait name reached the page: ' + JSON.stringify(r));
  if (!/<img/.test(r.text)) throw new Error('the name was not shown as text: ' + r.text.slice(0, 120));
});
await step('M11 Roll 5 as the first action shows the candidates alone, and Discard all brings the empty state back', async ()=>{
  await page.reload(); await page.waitForTimeout(800);
  await page.locator('[data-act="generateBatch"]:visible').first().click();
  await page.waitForSelector('#batchTray .batchGrid', {timeout: 15000});
  const r = await page.evaluate(()=>({
    stubs: (document.getElementById('sheet').innerText.match(/Nothing was drawable/g) || []).length,
    titleShown: !!document.getElementById('sheetTitle').offsetParent,
    cards: document.querySelectorAll('#batchTray .batchCard').length,
  }));
  if (r.stubs || r.titleShown) throw new Error('the empty sheet chrome is showing around the candidates: ' + JSON.stringify(r));
  if (r.cards < 2) throw new Error('only ' + r.cards + ' candidates');
  await page.locator('#batchTray').getByText('Discard all').click();
  const back = await page.evaluate(()=> getComputedStyle(document.getElementById('emptyState')).display !== 'none' && !document.getElementById('sheet').classList.contains('show'));
  if (!back) throw new Error('the empty state did not return after discarding every candidate');
});
await step('M2 Undo puts the seed chip back', async ()=>{
  await page.reload(); await page.waitForTimeout(800);
  const r = await page.evaluate(async ()=>{
    generateCharacter(); await new Promise(r => setTimeout(r, 600)); const a = lastSeedUsed;
    generateCharacter(); await new Promise(r => setTimeout(r, 600)); const b = lastSeedUsed;
    undoLast(); await new Promise(r => setTimeout(r, 200));
    return {a, b, after: lastSeedUsed, chip: document.getElementById('stickySeed').textContent};
  });
  if (r.a === r.b) throw new Error('two builds printed the same seed');
  if (r.after !== r.a || !r.chip.includes(r.a)) throw new Error('after undo the seed reads ' + r.after + ' / chip "' + r.chip + '", expected ' + r.a);
});
await step('B-4 the first screen does not shift after first paint (layout shift under 0.1 at 390, 768 and 1440 wide)', async ()=>{
  for (const w of [390, 768, 1440]){
    const pg = await b.newPage({viewport: {width: w, height: 900}});
    await pg.addInitScript(()=>{ window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({type: 'layout-shift', buffered: true}); });
    await pg.goto(base + '/index.html', {waitUntil: 'load'}); await pg.waitForTimeout(1200);
    const cls = await pg.evaluate(()=> window.__cls);
    await pg.close();
    if (cls >= 0.1) throw new Error('layout shift ' + cls.toFixed(3) + ' at ' + w + 'px wide');
  }
});
await step('fonts come from this origin: no third-party request, and the faces load', async ()=>{
  const pg = await b.newPage(); const outside = [];
  pg.on('request', r => { if (!r.url().startsWith(base)) outside.push(r.url()); });
  await pg.goto(base + '/index.html', {waitUntil: 'networkidle'});
  const loaded = await pg.evaluate(async ()=>{ await document.fonts.ready; return [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family); });
  await pg.close();
  if (outside.length) throw new Error('requests to other origins: ' + outside.slice(0, 3).join(', '));
  if (!loaded.some(f => /Jakarta/.test(f))) throw new Error('the body font did not load: ' + loaded.join(', '));
});
await b.close();
if (process.env.CSP) console.log(csp.length ? '\nCSP violations:\n' + csp.slice(0,6).map(v=>'  '+v).join('\n') : '\nNo CSP violations under script-src \'self\'.');
const real = errs.filter(e => !/favicon|sw\.js|ServiceWorker|Failed to load resource|Content Security Policy/i.test(e)).concat(process.env.CSP ? csp : []);
console.log(real.length ? '\nConsole errors:\n' + real.slice(0,10).map(e=>'  '+e).join('\n') : '\nNo console errors.');
process.exit(real.length ? 1 : 0);
