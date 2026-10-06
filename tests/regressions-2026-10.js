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
};
