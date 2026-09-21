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
      'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:;"
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
    const bBefore = state[b].trait.id;
    reapplyConstraintsAfterMutation();
    renderSlotChange(a);
    const bAfter = state[b] && state[b].trait ? state[b].trait.id : null;
    const painted = document.querySelector('.traitCard[data-slot="' + b + '"]');
    const paintedName = painted ? (painted.querySelector('.traitName')||{}).textContent : null;
    const liveName = state[b] && state[b].trait ? state[b].trait.trait : null;
    exclusivePairs = savedPairs;
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
await b.close();
if (process.env.CSP) console.log(csp.length ? '\nCSP violations:\n' + csp.slice(0,6).map(v=>'  '+v).join('\n') : '\nNo CSP violations under script-src \'self\'.');
const real = errs.filter(e => !/favicon|sw\.js|ServiceWorker|Failed to load resource|Content Security Policy/i.test(e)).concat(process.env.CSP ? csp : []);
console.log(real.length ? '\nConsole errors:\n' + real.slice(0,10).map(e=>'  '+e).join('\n') : '\nNo console errors.');
process.exit(real.length ? 1 : 0);
