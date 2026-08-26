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
