#!/usr/bin/env node
/* Lists near-duplicate trait pairs in the bank: TF-IDF cosine over name + description + example, within one section.
     node tools/near-dups.js [--min=0.8] [--old]       --old limits it to traits an engine-1/2 build can draw */
const path = require('path');
const {loadEngine} = require(path.join(__dirname, '..', 'tests', 'harness.js'));
const g = loadEngine();
const min = parseFloat((process.argv.find(a => a.startsWith('--min=')) || '--min=0.8').split('=')[1]);
const old = process.argv.includes('--old');
let T = g.evalIn("TRAITS.map(t=>({id:t.id,section:t.section,category:t.category,trait:t.trait,desc:t.desc,example:t.example,since:t.since||0}))");
if (old) T = T.filter(t => !t.since);
const tok = s => String(s || '').toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
const docs = T.map(t => tok(t.trait + ' ' + t.trait + ' ' + t.desc + ' ' + t.example));
const df = new Map(); docs.forEach(d => new Set(d).forEach(w => df.set(w, (df.get(w) || 0) + 1)));
const N = docs.length;
const vecs = docs.map(d => { const tf = new Map(); d.forEach(w => tf.set(w, (tf.get(w) || 0) + 1)); const v = new Map(); let n2 = 0;
  tf.forEach((c, w) => { const x = (1 + Math.log(c)) * Math.log(N / (df.get(w) || 1)); v.set(w, x); n2 += x * x; }); return {v, n: Math.sqrt(n2) || 1}; });
const bySec = new Map(); T.forEach((t, i) => { if (!bySec.has(t.section)) bySec.set(t.section, []); bySec.get(t.section).push(i); });
const out = [];
bySec.forEach(ix => { for (let a = 0; a < ix.length; a++) for (let b = a + 1; b < ix.length; b++){
  const A = vecs[ix[a]], B = vecs[ix[b]]; let dot = 0; const [s, l] = A.v.size < B.v.size ? [A, B] : [B, A];
  s.v.forEach((x, w) => { const y = l.v.get(w); if (y) dot += x * y; });
  const c = dot / (A.n * B.n); if (c >= min) out.push([c, T[ix[a]], T[ix[b]]]); } });
out.sort((x, y) => y[0] - x[0]);
console.log(out.length + ' pairs at cosine >= ' + min);
out.slice(0, 60).forEach(([c, a, b]) => console.log(c.toFixed(2), `#${a.id} ${a.trait} [${a.category}]  ~  #${b.id} ${b.trait} [${b.category}]`));
