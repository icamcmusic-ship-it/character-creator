/* Regression tests for the October 2026 audit (docs/AUDIT-2026-10.md §1). Same shape as
   tests/regressions.js: called from tests/run.js with its check/group/assert, and every
   check names the finding it pins. */
const fs = require('fs');
const path = require('path');
const {ROOT} = require('./harness');
const {fresh} = require('./regressions');

module.exports = function({check, group, assert}){
  group('Audit 2026-10 §1 regressions');

  check('H1 a trait name carrying markup cannot reach #warnBox as HTML, and the dispatcher refuses built-ins', ()=>{
    const G = fresh(); const d = G.document;
    d._set('warnBox', {});
    G.evalIn(`checkConflicts = ${'function checkConflicts(){}'};`);   // fresh() stubs it out; restore the real one below
    const real = fs.readFileSync(path.join(ROOT, 'js/render.js'), 'utf8').match(/function checkConflicts\(\)\{[\s\S]*?\n\}\n/)[0];
    G.evalIn(real + `
      checkConflictsFor = function(){ return [{tier:'Strong', tierNote:'<b>note</b>', text:'"<img src=x onerror=window.__pwn=1>" and "<script>1</script>" pull apart.'}]; };
      checkConflicts();`);
    const html = d.getElementById('warnBox').innerHTML;
    assert(!/<img|<script|<b>/i.test(html), 'markup from a trait name reached warnBox unescaped: ' + html.slice(0, 160));
    assert(/&lt;img/.test(html), 'the trait name was dropped instead of escaped');
    const ran = G.evalIn(`(()=>{ const el = {getAttribute:n=>n==='data-act'?'eval':'["globalThis.__ran=1"]'};
      _runAction(el, null, ''); return globalThis.__ran === 1 })()`);
    assert(!ran, 'the dispatcher ran eval on request');
  });

  check('H1 index.html sets a Content-Security-Policy with no unsafe-inline script', ()=>{
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const m = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
    assert(m, 'no CSP meta tag');
    const script = (m[1].match(/script-src([^;]*)/) || [])[1] || '';
    assert(script.trim() === "'self'", "script-src is not 'self' only: " + script);
  });

  check('H2 WEIGHT_MATRIX has no duplicated key, so no later literal can silently replace an earlier one', ()=>{
    const src = fs.readFileSync(path.join(ROOT, 'js/engine.js'), 'utf8');
    const start = src.indexOf('const WEIGHT_MATRIX = {');
    const body = src.slice(start, src.indexOf('\n};', start));
    const seen = new Map(), dups = [];
    body.split('\n').forEach((line, i)=>{
      const m = line.match(/^  (?:"([^"]+)"|([A-Za-z_]\w*))\s*:/);
      if (!m) return; const k = m[1] || m[2];
      if (seen.has(k)) dups.push(k); seen.set(k, i);
    });
    assert(seen.size > 40, 'the key scan found only ' + seen.size + ' keys; the pattern no longer matches the literal');
    assert(!dups.length, 'duplicate WEIGHT_MATRIX keys: ' + dups.join(', '));
  });

  check('H2 v2 draws from the full matrix; v1 keeps the links its duplicated keys used to drop', ()=>{
    const G = fresh();
    const r = G.evalIn(`(()=>{
      const out = {};
      ENGINE_V = 2; out.v2 = !!(weightEntry('role:Leader') && weightEntry('role:Leader').grammar && weightEntry('role:Leader').grammar['Turn-Taking Grammar']);
      ENGINE_V = 1; out.v1 = !!(weightEntry('role:Leader') && weightEntry('role:Leader').grammar && weightEntry('role:Leader').grammar['Turn-Taking Grammar']);
      out.stressRepair = ENGINE_V = 2, !!(weightEntry('stress:Flight (remove yourself)').repair);
      out.dropped = Object.values(WEIGHT_MATRIX_LEGACY_DROPPED).reduce((n, k)=>n + Object.values(k).reduce((m, c)=>m + c.length, 0), 0);
      ENGINE_V = 1; return out; })()`);
    assert(r.v2 && !r.v1, 'role:Leader -> Turn-Taking Grammar: v2=' + r.v2 + ' v1=' + r.v1);
    assert(r.stressRepair, 'stress -> Repair links are still dead in v2');
    assert(r.dropped === 39, 'expected 39 legacy-dropped links, found ' + r.dropped);
  });

  check('H3 no trait example or description carries HTML markup (the renderer escapes it, so it shows as raw tags)', ()=>{
    const G = fresh();
    const bad = G.evalIn("TRAITS.filter(t=>/<\\/?[a-z][^>]*>/i.test([t.trait,t.desc,t.example].join(' '))).map(t=>t.id+': '+(t.example||t.desc)).slice(0,5)");
    assert(!bad.length, bad.length + '+ traits carry markup, e.g. ' + bad[0]);
  });

  check('M3 tossing a card whose category was banned toasts "nothing left" instead of throwing', ()=>{
    const G = fresh(); G.gen('rr1');
    const slot = G.evalIn("Object.keys(state).find(k=>/^(manner|vocab)/.test(k) && state[k] && state[k].trait && !state[k].locked)");
    assert(slot, 'no manner or vocabulary slot to toss');
    G.evalIn(`bannedCategories.add(state['${slot}'].trait.category)`);
    let threw = null; try { G.evalIn(`rerollSlot('${slot}')`); } catch(e){ threw = e.message; }
    assert(!threw, 'rerollSlot threw: ' + threw);
    assert(G.evalIn('__toasts.length') > 0, 'no toast told the user nothing could be drawn');
  });

  check('M1 the outlier checkbox and count slider reach the sheet shape on v2, and v1 keeps the shape roll', ()=>{
    const G = fresh(); const d = G.document;
    d._set('wildcardToggle', {checked: true}); d._set('wildcardCount', {value: '1'}); d._set('sheetShapeToggle', {checked: true});
    const wilds = (pre, toggle, count)=>{
      d.getElementById('wildcardToggle').checked = toggle; d.getElementById('wildcardCount').value = String(count);
      const out = [];
      for (let i = 1; i <= 40; i++){ G.gen(pre + (i * 104729).toString(36)); out.push(G.evalIn("Object.keys(state).filter(k=>k.startsWith('wild_')).length")); }
      return out;
    };
    const sum = a => a.reduce((x, y)=>x + y, 0);
    assert(sum(wilds('v2-', false, 1)) === 0, 'v2 still drew outliers with the checkbox off');
    assert(wilds('v2-', true, 2).every(n => n === 2), 'v2 count 2 did not fix the number of outliers at 2');
    assert(wilds('v2-', true, 0).every(n => n === 0), 'v2 count 0 still drew an outlier');
    const free = wilds('v2-', true, 1); assert(new Set(free).size > 1, 'count 1 should leave the number to the sheet shape');
    const v1a = wilds('v1-', true, 1), v1b = wilds('v1-', false, 3);
    assert(JSON.stringify(v1a) === JSON.stringify(v1b), 'the wildcard controls changed what a v1 seed draws');
  });
};
