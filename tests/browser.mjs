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
await step('cast tab generates a cast', async ()=>{
  await page.locator('[data-act="switchTab"][data-args*="cast"]:visible').first().click({timeout:8000});
  await page.locator('[data-act="generateCast"]:visible').first().click({timeout:8000});
  await page.waitForSelector('.castCard', {timeout:10000});
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
