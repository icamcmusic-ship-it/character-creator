#!/usr/bin/env node
/* Validates js/data/pol-overlay-v2-*.js: every id is an older (non-v2) trait that has no tag of its own, every axis exists, values are +1/-1,
   at most three axes per trait. Prints coverage by section.  node tools/check-overlay.js [key] */
const path = require('path');
const {loadEngine} = require(path.join(__dirname, '..', 'tests', 'harness.js'));
const g = loadEngine();
const T = g.evalIn('TRAITS'), AX = g.evalIn('AXIS_LABELS'), O = g.evalIn('POL_OVERLAY_V2');
const byId = new Map(T.map(t => [t.id, t]));
let errors = 0; const E = m => { errors++; if (errors < 40) console.log('  ERROR ' + m); };
const keyArg = process.argv[2];
let n = 0; const cover = {};
Object.entries(O).forEach(([id, p]) => {
  const t = byId.get(+id); n++;
  if (!t) return E('#' + id + ' is not a trait');
  if (t.since) E('#' + id + ' is a v2 trait (tag it in its own row)');
  const keys = Object.keys(p);
  if (!keys.length || keys.length > 3) E('#' + id + ' has ' + keys.length + ' axes');
  keys.forEach(k => { if (!AX[k]) E('#' + id + ' unknown axis ' + k); if (p[k] !== 1 && p[k] !== -1) E('#' + id + ' value ' + p[k] + ' for ' + k); });
  const own = t.polV1 || t.pol || {};
  if (Object.keys(own).some(k => own[k])) E('#' + id + ' already has its own tags (' + JSON.stringify(own) + ')');
});
T.filter(t => !t.since).forEach(t => {
  const s = cover[t.section] = cover[t.section] || {n: 0, tagged: 0};
  s.n++; if (Object.keys(t.polV1 || t.pol || {}).some(k => (t.polV1 || t.pol)[k]) || O[t.id]) s.tagged++;
});
console.log(n + ' overlay entries');
Object.entries(cover).forEach(([s, c]) => console.log('  ' + s + ': ' + c.tagged + '/' + c.n + ' (' + Math.round(100 * c.tagged / c.n) + '%)'));
console.log(errors ? errors + ' errors' : 'OK'); process.exit(errors ? 1 : 0);
