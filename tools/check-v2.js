#!/usr/bin/env node
/* Checks the traits one v2 content file adds, before they go anywhere near a build.
 *
 *   node tools/check-v2.js <file-key> [--min-cat=15]          e.g.  node tools/check-v2.js want
 *   node tools/check-v2.js --range=210000-210999
 *
 * Errors (exit code 1): malformed rows, a name or example already in the bank, an unknown polarity axis, markup, a name over
 * 64 characters or with hyphen-glued words, a near-copy of an existing trait (TF-IDF cosine >= 0.72), appearance or
 * diagnostic wording, or a category under --min-cat.
 * Warnings: a first-two-words opener or description opener that more than a sixth of the file shares, fewer than three
 * intensities or rarities represented, a near-neighbour at cosine 0.55-0.72.  Nothing here replaces reading the traits. */
const path = require('path');
const root = path.join(__dirname, '..');
const {loadEngine} = require(path.join(root, 'tests', 'harness.js'));
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const minCat = +(opt('min-cat') || 15);
let lo, hi;
if (opt('range')){ [lo, hi] = opt('range').split('-').map(Number); }
else {
  const key = args.find(a => !a.startsWith('--'));
  const fs = require('fs');
  const src = key ? fs.readFileSync(path.join(root, 'js/data/traits-v2-' + key + '.js'), 'utf8') : '';
  const m = /IDS (\d+)-(\d+)/.exec(src);
  if (!m){ console.error('usage: node tools/check-v2.js <file-key> | --range=a-b'); process.exit(2); }
  lo = +m[1]; hi = +m[2];
}
const g = loadEngine();
const all = g.evalIn("TRAITS.map(t=>({id:t.id,section:t.section,category:t.category,trait:t.trait,desc:t.desc,example:t.example,intensity:t.intensity,rarity:t.rarity,pol:t.pol,since:t.since||0}))");
const mine = all.filter(t => t.id >= lo && t.id <= hi), rest = all.filter(t => t.id < lo || t.id > hi);
const AXES = new Set(['vol','pace','form','warm','hon','asrt','ego','agr','man','disc','rebel','emo','intel','pos','act','mood','cur']);
const RARITY = new Set(['common','uncommon','distinctive','signature']);
const errors = [], warns = [];
const E = (t, m) => errors.push(`#${t.id} "${t.trait}": ${m}`), W = m => warns.push(m);
if (!mine.length){ console.error(`no traits with ids ${lo}-${hi} yet`); process.exit(1); }
const norm = s => String(s || '').toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const names = new Map(), exs = new Map();
rest.forEach(t => { names.set(norm(t.trait), t.id); exs.set(norm(t.example), t.id); });
const seenN = new Map(), seenE = new Map();
const FORBID = [
  [/\b(hair|haircut|hairstyle|beard|makeup|clothes|clothing|outfit|dress(ed)?|wears|wearing|tattoo|scar(s|red)?|freckles|wrinkles|tall|short in stature|build|physique|attractive|beautiful|handsome|ugly|skin|eyes? (are|is)|jewel(l)?ery)\b/i, 'appearance wording (the tool is voice and personality only)'],
  [/\b(name generator|random name|baby name)\b/i, 'name generation'],
  [/\b(autis(tic|m)|adhd|ocd|bipolar|schizo\w*|psychopath\w*|sociopath\w*|narcissist\w*|borderline|anorexi\w*|bulimi\w*|depressed|depressive|dissociat\w*|traumatis\w*|gaslight\w*|retard\w*|idiot|moron|dimwit\w*|simple-minded|crazy|insane|psycho)\b/i, 'diagnostic or stigmatising label (write the behaviour instead)'],
  [/\b(he|she|his|her|him|hers|himself|herself)\b/i, 'gendered pronoun in a description (use they/their or no pronoun)'],
];
mine.forEach(t => {
  for (const k of ['trait','desc','example','section','category']) if (typeof t[k] !== 'string' || !t[k].trim()) E(t, `missing ${k}`);
  if (!(t.intensity >= 1 && t.intensity <= 5 && Number.isInteger(t.intensity))) E(t, 'intensity must be an integer 1-5');
  if (!RARITY.has(t.rarity)) E(t, 'bad rarity ' + t.rarity);
  if (t.pol && typeof t.pol === 'object') Object.entries(t.pol).forEach(([a, v]) => { if (!AXES.has(a)) E(t, 'unknown polarity axis ' + a); else if (![-1, 0, 1].includes(v)) E(t, 'polarity must be -1, 0 or 1 on ' + a); });
  else E(t, 'pol must be an object');
  if (/<[^>]+>/.test([t.trait, t.desc, t.example].join(' '))) E(t, 'contains markup');
  if (t.trait.length > 64) E(t, `name is ${t.trait.length} characters (max 64)`);
  if ((t.trait.match(/-/g) || []).length >= 2 && !/\s/.test(t.trait)) E(t, 'hyphen-glued name: write it as words');
  if (/\b(a|an|the|of|to|and|with|by|for|in|on|at)$/i.test(t.trait.trim())) E(t, 'name ends on a dangling article or preposition');
  if (/[A-Z]/.test(t.trait.slice(1).replace(/\b(I|I'm|I've|I'd|I'll)\b/g, '').replace(/[“"'‘’”]\s*[A-Z]/g, '').replace(/[.?!:—-]\s*[A-Z]/g, ''))) {/* mid-name capitals are only a warning */ W(`#${t.id} "${t.trait}": capital letters inside the name`);}
  if (t.desc.length < 24) E(t, 'description under 24 characters'); if (t.desc.length > 220) W(`#${t.id} description is ${t.desc.length} characters`);
  const nn = norm(t.trait), ne = norm(t.example);
  if (names.has(nn)) E(t, `name already in the bank (#${names.get(nn)})`);
  if (seenN.has(nn)) E(t, `name repeated in this file (#${seenN.get(nn)})`); seenN.set(nn, t.id);
  if (exs.has(ne)) E(t, `example already in the bank (#${exs.get(ne)})`);
  if (seenE.has(ne)) E(t, `example repeated in this file (#${seenE.get(ne)})`); seenE.set(ne, t.id);
  const text = [t.trait, t.desc].join(' ');
  FORBID.forEach(([re, why]) => { const m = re.exec(text); if (m) E(t, `${why}: "${m[0]}"`); });
  if (/\b(they|their|them)\b/i.test(t.example) === false && /\b(he|she)\b/i.test(t.example)) W(`#${t.id} example uses a gendered pronoun`);
});
// categories
const cats = new Map(); mine.forEach(t => { const k = t.section + ' > ' + t.category; cats.set(k, (cats.get(k) || 0) + 1); });
cats.forEach((n, k) => { const existing = all.filter(t => (t.section + ' > ' + t.category) === k && (t.id < lo || t.id > hi)).length; if (n + existing < minCat) errors.push(`${k}: ${n} here + ${existing} elsewhere = ${n + existing}, under the floor of ${minCat}`); });
// spread
const hist = (f) => { const h = {}; mine.forEach(t => { const k = f(t); h[k] = (h[k] || 0) + 1; }); return h; };
const ih = hist(t => t.intensity), rh = hist(t => t.rarity);
if (Object.keys(ih).length < 3) W('only ' + Object.keys(ih).length + ' intensities used: ' + JSON.stringify(ih));
if (Object.keys(rh).length < 3) W('only ' + Object.keys(rh).length + ' rarities used: ' + JSON.stringify(rh));
const opener = (s, n) => norm(s).split(' ').slice(0, n).join(' ');
for (const [label, f, n] of [['name opener', t => opener(t.trait, 2), 2], ['description opener', t => opener(t.desc, 2), 2]]){
  const h = hist(f); Object.entries(h).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([k, v]) => { if (v > Math.max(4, mine.length / 6)) W(`${label} "${k}" starts ${v} of ${mine.length} traits`); });
}
// near copies (TF-IDF over name + description + example)
const tok = s => norm(s).split(' ').filter(w => w.length > 2);
const docs = all.map(t => tok([t.trait, t.desc, t.example].join(' ')));
const df = new Map(); docs.forEach(d => new Set(d).forEach(w => df.set(w, (df.get(w) || 0) + 1)));
const N = docs.length, idf = w => Math.log(N / (1 + (df.get(w) || 0)));
const vec = d => { const v = new Map(); d.forEach(w => v.set(w, (v.get(w) || 0) + 1)); let n = 0; v.forEach((c, w) => { const x = c * idf(w); v.set(w, x); n += x * x; }); return {v, n: Math.sqrt(n) || 1}; };
const vecs = all.map((t, i) => vec(docs[i])); const idx = new Map(all.map((t, i) => [t.id, i]));
const inv = new Map(); rest.forEach(t => { const i = idx.get(t.id); new Set(docs[i]).forEach(w => { if ((df.get(w) || 0) < 80){ (inv.get(w) || inv.set(w, []).get(w)).push(i); } }); });
mine.forEach(t => {
  const i = idx.get(t.id), cand = new Set(); new Set(docs[i]).forEach(w => (inv.get(w) || []).forEach(j => cand.add(j)));
  let best = 0, bj = -1; cand.forEach(j => { let dot = 0; vecs[i].v.forEach((x, w) => { const y = vecs[j].v.get(w); if (y) dot += x * y; }); const c = dot / (vecs[i].n * vecs[j].n); if (c > best){ best = c; bj = j; } });
  if (best >= 0.72) E(t, `near-copy of #${all[bj].id} "${all[bj].trait}" (cosine ${best.toFixed(2)})`);
  else if (best >= 0.55) W(`#${t.id} "${t.trait}" is close to #${all[bj].id} "${all[bj].trait}" (cosine ${best.toFixed(2)})`);
});
console.log(`${mine.length} traits in ${lo}-${hi}; categories: ` + [...cats.entries()].map(([k, n]) => `${k.split(' > ')[1]} ${n}`).join(', '));
console.log('intensity', JSON.stringify(ih), 'rarity', JSON.stringify(rh));
warns.slice(0, 40).forEach(w => console.log('  warn  ' + w)); if (warns.length > 40) console.log(`  … ${warns.length - 40} more warnings`);
errors.slice(0, 60).forEach(e => console.log('  ERROR ' + e)); if (errors.length > 60) console.log(`  … ${errors.length - 60} more errors`);
console.log(errors.length ? `${errors.length} error(s)` : 'OK');
process.exit(errors.length ? 1 : 0);
