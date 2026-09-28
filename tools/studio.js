#!/usr/bin/env node
/* The content studio: the author-facing side of the bank, so adding content is a
   reviewed operation rather than a careful paste into a 6,000-line literal.

     node tools/studio.js validate                 # schema + duplicate-name + link check
     node tools/studio.js coverage [--section=X]   # the heatmap: which cells are thin
     node tools/studio.js nearest "a phrase"       # what already exists near an idea
     node tools/studio.js review [--pack=id]       # what is unreviewed, and where
     node tools/studio.js preview [--pack=id] [--n=5]   # generate with only these packs
     node tools/studio.js packs                    # the manifests and their id ranges
     node tools/studio.js suggest-pol [--section=X] [--n=20]  # polarity tags for untagged traits
     node tools/studio.js families [--section=X] [--min=0.4]  # cluster untagged traits into conceptFamily
     node tools/studio.js worldtag                 # worldTags / conditions / exceptions coverage
     node tools/studio.js scaffold "Trait name" --section=X --category=Y [--pack=id]

   Everything reads the live bank through the same loader the test suite uses, so a
   figure printed here is a figure the app would produce. Nothing here writes: the
   bank stays a reviewed file in git, and this is the review. */
const {loadEngine} = require('../tests/harness');

const argv = process.argv.slice(2);
const cmd = (argv[0] || 'validate').replace(/^--/, '');
const flag = (name, dflt) => {
  const hit = argv.find(a => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const rest = argv.slice(1).filter(a => !a.startsWith('--')).join(' ');

const ctx = loadEngine(['TRAITS','CATS_BY_SECTION','TRAIT_PACKS','RTIER_ORDER','rarityTier','assertTraitShape',
  'assertAxisTables','assertCrossLinks','catsOf','byFilter','buildCharacterState','finalizeSheet','withRng',
  'mulberry32','setDisabledPacks','getDisabledPacks','PROFILE_SECTIONS','traitDimensions','slotCat',
  'forgetRecentTraits','forgetSlotDraws','forgetCategoryUse','packOfId','TRAIT_WORLD_TAGS','TRAIT_CONTEXTS',
  'AXIS_LABELS','setEngineSettings']);
const A = ctx.api, T = A.TRAITS;
const sections = [...new Set(T.map(t => t.section))];
const say = (...x) => console.log(...x);
const bar = (n, max, w) => "█".repeat(Math.max(0, Math.round(n / (max || 1) * (w || 24))));

/* Tokenised overlap, not a language model: the point is to catch "you have written this
   trait already, twice, in another section" before it is in the file. conceptFamily is
   an exact signal and is checked first; the token score is the fallback for the
   overwhelming majority of the bank that has no family yet. */
const STOP = new Set("the a an and or of to in on at for with without is are be by their them they it its as that this from into over under not no than then so but if when while every each any all one two very quite really just about".split(" "));
const tokens = s => String(s || "").toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
function similarity(a, b){
  const A2 = new Set(tokens(a)), B2 = new Set(tokens(b));
  if (!A2.size || !B2.size) return 0;
  let shared = 0; A2.forEach(w => { if (B2.has(w)) shared++; });
  return shared / new Set([...A2, ...B2]).size;
}

function cmdValidate(){
  let bad = 0;
  const shape = A.assertTraitShape() || [];
  const axes = (typeof A.assertAxisTables === 'function' ? A.assertAxisTables() : []) || [];
  const links = (typeof A.assertCrossLinks === 'function' ? A.assertCrossLinks() : []) || [];
  const byName = new Map();
  T.forEach(t => { const k = String(t.trait).toLowerCase(); byName.set(k, (byName.get(k) || []).concat(t.id)); });
  const dupes = [...byName.entries()].filter(([, ids]) => ids.length > 1);
  const noPack = T.filter(t => !t.pack);
  [["schema", shape], ["axis tables", axes], ["cross-links", links]].forEach(([label, list]) => {
    say(`${label}: ${list.length ? list.length + " problem(s)" : "clean"}`);
    list.slice(0, 20).forEach(p => { bad++; say("   - " + p); });
  });
  say(`duplicate names: ${dupes.length ? dupes.length : "none"}`);
  dupes.slice(0, 20).forEach(([n, ids]) => { bad++; say(`   - "${n}" on ids ${ids.join(", ")}`); });
  say(`traits outside every pack manifest: ${noPack.length}`);
  noPack.slice(0, 10).forEach(t => { bad++; say(`   - #${t.id} ${t.trait}`); });
  say(bad ? `\n${bad} problem(s). The bank is not shippable until these are zero.` : "\nThe bank validates.");
  process.exitCode = bad ? 1 : 0;
}

function cmdCoverage(){
  const only = flag('section', null);
  const tiers = A.RTIER_ORDER;
  const rows = [];
  sections.filter(s => !only || s.toLowerCase().includes(only.toLowerCase())).forEach(sec => {
    A.catsOf(sec).forEach(cat => {
      const pool = A.byFilter(sec, cat);
      const cells = {};
      tiers.forEach(r => { for (let i = 1; i <= 5; i++) cells[r + i] = 0; });
      pool.forEach(t => { cells[A.rarityTier(t) + (t.intensity || 3)]++; });
      const empty = Object.values(cells).filter(v => !v).length;
      rows.push({sec, cat, n: pool.length, empty, cells});
    });
  });
  rows.sort((a, b) => b.empty - a.empty || a.n - b.n);
  const max = Math.max(...rows.map(r => r.n));
  say(`${rows.length} categories · 20 rarity×intensity cells each · thinnest first\n`);
  rows.slice(0, parseInt(flag('n', '25'), 10)).forEach(r => {
    say(`${String(r.n).padStart(4)} ${bar(r.n, max, 18).padEnd(18)} ${r.empty} empty cells  ${r.sec} → ${r.cat}`);
  });
  const totalEmpty = rows.reduce((n, r) => n + r.empty, 0);
  say(`\n${totalEmpty} empty cells across ${rows.length * 20}; mean ${(T.length / rows.length / 20).toFixed(2)} traits per cell.`);
}

function cmdNearest(){
  const q = rest || flag('q', '');
  if (!q){ say('Give it a phrase: node tools/studio.js nearest "apologises by leaving the room"'); return; }
  const scored = T.map(t => ({t, s: Math.max(similarity(q, t.trait), similarity(q, t.trait + " " + t.desc) * 0.9)}))
    .sort((a, b) => b.s - a.s).slice(0, 12);
  say(`Nearest existing content to: "${q}"\n`);
  scored.forEach(({t, s}) => {
    say(`${(s * 100).toFixed(0).padStart(3)}%  #${t.id} ${t.trait}`);
    say(`      ${t.section} → ${t.category} · ${t.rarity} · i${t.intensity}${t.conceptFamily ? ` · family ${t.conceptFamily}` : ""}`);
  });
  const fams = [...new Set(scored.filter(x => x.s > 0.15 && x.t.conceptFamily).map(x => x.t.conceptFamily))];
  say(fams.length ? `\nConcept families already in this space: ${fams.join(", ")}` : "\nNo concept family covers this space yet.");
  if (scored[0] && scored[0].s > 0.5) say("The top match is close enough that this may be a duplicate.");
}

function cmdReview(){
  const pack = flag('pack', null);
  const pool = pack ? T.filter(t => t.pack === pack) : T;
  const by = {};
  pool.forEach(t => { const k = t.reviewStatus || 'unreviewed'; by[k] = (by[k] || 0) + 1; });
  say(`${pool.length} traits${pack ? ` in pack "${pack}"` : ""}: ` + Object.keys(by).map(k => `${k} ${by[k]}`).join(" · "));
  const worst = {};
  pool.filter(t => (t.reviewStatus || 'unreviewed') !== 'reviewed').forEach(t => {
    const k = t.section + " → " + t.category;
    worst[k] = (worst[k] || 0) + 1;
  });
  say("\nMost unreviewed content by category:");
  Object.entries(worst).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, n]) => say(`  ${String(n).padStart(4)}  ${k}`));
  const flagged = pool.filter(t => t.reviewStatus === 'flagged');
  if (flagged.length){ say("\nFlagged, needing a decision:"); flagged.slice(0, 20).forEach(t => say(`  #${t.id} ${t.trait} (${t.section})`)); }
}

function cmdPreview(){
  const pack = flag('pack', null);
  const n = parseInt(flag('n', '3'), 10);
  if (pack && !A.TRAIT_PACKS.some(p => p.id === pack)){ say(`No pack "${pack}". Known: ${A.TRAIT_PACKS.map(p=>p.id).join(", ")}`); return; }
  if (pack) A.setDisabledPacks(A.TRAIT_PACKS.map(p => p.id).filter(id => id !== pack && id !== 'core'));
  say(pack ? `Generating with core + "${pack}" only.\n` : "Generating with every pack.\n");
  for (let i = 0; i < n; i++){
    let st;
    A.withRng(A.mulberry32(9000 + i), () => {
      A.forgetRecentTraits(); A.forgetSlotDraws(); A.forgetCategoryUse();
      st = A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2,
        rarityPref:0, vocabPref:null, personalityOverrides:{}});
    });
    const from = Object.values(st).filter(s => s && s.trait);
    const mine = pack ? from.filter(s => s.trait.pack === pack).length : from.length;
    say(`--- sheet ${i + 1}: ${from.length} traits${pack ? `, ${mine} from "${pack}"` : ""}`);
    ['prof_role_0','prof_values_0','prof_motivation_0','verbosity','manner_0'].forEach(id => {
      if (st[id] && st[id].trait) say(`    ${st[id].trait.trait} — ${st[id].trait.category}`);
    });
  }
  A.setDisabledPacks([]);
}

function cmdPacks(){
  say("id            traits  ids                     reviewed");
  A.TRAIT_PACKS.forEach(p => {
    const pool = T.filter(t => t.pack === p.id);
    const rev = pool.filter(t => t.reviewStatus === 'reviewed').length;
    say(`${p.id.padEnd(13)} ${String(pool.length).padStart(5)}  ${String(p.ids[0]).padStart(7)}–${String(p.ids[1]).padEnd(7)}   ${pool.length ? Math.round(100 * rev / pool.length) + "%" : "—"}`);
  });
  say(`\n${T.length} traits in ${A.TRAIT_PACKS.length} packs. Disable one in the app under Content packs, or here with --pack=.`);
}

/* suggest-pol: a polarity proposal for a trait with no pol, read off its nearest TAGGED
   neighbours in the same section (token overlap, weighted by similarity). An axis is
   proposed only where the neighbours agree on its sign; the value is their weighted
   mean, rounded to the half-steps the bank uses. A proposal, printed for review — it
   is never written. */
function suggestPolFor(t, tagged){
  const near = tagged.filter(o => o.section === t.section && o.id !== t.id)
    .map(o => ({o, s: similarity(t.trait + " " + t.desc, o.trait + " " + o.desc)}))
    .filter(x => x.s > 0.08).sort((a, b) => b.s - a.s).slice(0, 6);
  if (!near.length) return null;
  const sum = {}, wt = {}, signs = {};
  near.forEach(({o, s}) => Object.entries(o.pol).forEach(([ax, v]) => {
    sum[ax] = (sum[ax] || 0) + v * s; wt[ax] = (wt[ax] || 0) + s;
    (signs[ax] = signs[ax] || new Set()).add(Math.sign(v));
  }));
  const pol = {};
  Object.keys(sum).forEach(ax => {
    if (signs[ax].size !== 1 || wt[ax] < 0.15) return;
    const v = Math.round((sum[ax] / wt[ax]) * 2) / 2;
    if (v) pol[ax] = v;
  });
  return Object.keys(pol).length ? {pol, basis: near.slice(0, 3).map(x => "#" + x.o.id)} : null;
}
function cmdSuggestPol(){
  const only = flag('section', null), n = parseInt(flag('n', '20'), 10);
  const tagged = T.filter(t => t.pol && Object.keys(t.pol).length);
  const untagged = T.filter(t => (!t.pol || !Object.keys(t.pol).length) && (!only || t.section.toLowerCase().includes(only.toLowerCase())));
  say(`${untagged.length} untagged trait(s)${only ? ` in sections matching "${only}"` : ""}; proposals for the first ${n} that have tagged neighbours:\n`);
  let shown = 0;
  for (const t of untagged){
    if (shown >= n) break;
    const sug = suggestPolFor(t, tagged);
    if (!sug) continue;
    shown++;
    say(`#${t.id} ${t.trait}  (${t.section} → ${t.category})`);
    say(`      pol: ${JSON.stringify(sug.pol)}   from ${sug.basis.join(", ")}`);
  }
  if (!shown) say("No proposals: nothing untagged here has a tagged neighbour close enough to argue from.");
}

/* families: single-link clusters of traits with no conceptFamily, within one section,
   joined when their token similarity clears --min. Each cluster is proposed a family
   name from its commonest shared tokens; a cluster that touches a trait already in a
   family is proposed as joining that family instead. */
function clusterFamilies(pool, min){
  const parent = pool.map((_, i) => i);
  const find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
  // Token sets once, and pairs only within a section: the naive all-pairs version
  // re-tokenised both sides of 35 million pairs and took half a minute.
  const sets = pool.map(t => new Set(tokens(t.trait + " " + t.desc)));
  const bySec = {};
  pool.forEach((t, i) => { (bySec[t.section] = bySec[t.section] || []).push(i); });
  Object.values(bySec).forEach(ix => {
    for (let a = 0; a < ix.length; a++) for (let b = a + 1; b < ix.length; b++){
      const A2 = sets[ix[a]], B2 = sets[ix[b]];
      if (!A2.size || !B2.size) continue;
      let shared = 0; A2.forEach(w => { if (B2.has(w)) shared++; });
      if (shared && shared / (A2.size + B2.size - shared) >= min) parent[find(ix[a])] = find(ix[b]);
    }
  });
  const groups = {};
  pool.forEach((t, i) => { (groups[find(i)] = groups[find(i)] || []).push(t); });
  return Object.values(groups).filter(g => g.length > 1).sort((a, b) => b.length - a.length);
}
function familyName(group){
  const count = {};
  group.forEach(t => new Set(tokens(t.trait + " " + t.desc)).forEach(w => { count[w] = (count[w] || 0) + 1; }));
  return Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2).map(x => x[0]).join("-") || "family";
}
function cmdFamilies(){
  const only = flag('section', null), min = parseFloat(flag('min', '0.4'));
  const pool = T.filter(t => !only || t.section.toLowerCase().includes(only.toLowerCase()));
  const groups = clusterFamilies(pool, min);
  say(`${groups.length} cluster(s) at similarity ≥ ${min}${only ? ` in "${only}"` : ""}:\n`);
  groups.slice(0, parseInt(flag('n', '25'), 10)).forEach(g => {
    const fams = [...new Set(g.map(t => t.conceptFamily).filter(Boolean))];
    const untagged = g.filter(t => !t.conceptFamily);
    if (!untagged.length) return;
    const name = fams.length === 1 ? fams[0] : familyName(g);
    say(`${fams.length === 1 ? "join" : fams.length ? "split?" : "new "}  conceptFamily: "${name}"  (${g[0].section}, ${g.length} traits${fams.length > 1 ? `, already spans ${fams.join(" / ")}` : ""})`);
    g.slice(0, 8).forEach(t => say(`      #${t.id} ${t.trait}${t.conceptFamily ? `  [${t.conceptFamily}]` : ""}`));
  });
}

/* worldtag: the optional applicability fields validate but are mostly empty; this is
   how empty, by section, so the ratchet test in tests/run.js has a number to hold. */
function cmdWorldtag(){
  const bySec = {};
  T.forEach(t => {
    const r = bySec[t.section] = bySec[t.section] || {n: 0, world: 0, cond: 0, exc: 0};
    r.n++;
    if ((t.worldTags || []).length) r.world++;
    if ((t.conditions || []).length) r.cond++;
    if ((t.exceptions || []).length) r.exc++;
  });
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : "0.0").padStart(5) + "%";
  say("section".padEnd(34) + "traits  worldTags  conditions  exceptions");
  Object.entries(bySec).sort((a, b) => a[0].localeCompare(b[0])).forEach(([sec, r]) =>
    say(`${sec.slice(0, 33).padEnd(34)}${String(r.n).padStart(6)}  ${pct(r.world, r.n)}     ${pct(r.cond, r.n)}      ${pct(r.exc, r.n)}`));
  const tagUse = {};
  T.forEach(t => (t.worldTags || []).forEach(w => { tagUse[w] = (tagUse[w] || 0) + 1; }));
  say("\nworldTags in use: " + (A.TRAIT_WORLD_TAGS || []).map(w => `${w} ${tagUse[w] || 0}`).join(" · "));
  const tot = Object.values(bySec).reduce((a, r) => ({world: a.world + r.world, cond: a.cond + r.cond, exc: a.exc + r.exc}), {world: 0, cond: 0, exc: 0});
  say(`total: worldTags ${tot.world}, conditions ${tot.cond}, exceptions ${tot.exc} of ${T.length}`);
}

/* scaffold: a trait literal to paste, with the next free id in the pack's range, the
   section and category checked against the bank, a polarity proposal, and the nearest
   existing traits so a duplicate is caught before it is written. Prints; never writes. */
function cmdScaffold(){
  const name = rest.trim();
  const sec = flag('section', null), cat = flag('category', null), packId = flag('pack', 'core');
  if (!name || !sec || !cat){ say('Usage: node tools/studio.js scaffold "Trait name" --section="Mannerisms" --category="..." [--pack=core]'); process.exitCode = 2; return; }
  if (!sections.includes(sec)){ say(`No section "${sec}". Known: ${sections.join(", ")}`); process.exitCode = 2; return; }
  if (!A.catsOf(sec).includes(cat)){ say(`No category "${cat}" in ${sec}. Known: ${A.catsOf(sec).join(" | ")}`); process.exitCode = 2; return; }
  const pack = A.TRAIT_PACKS.find(p => p.id === packId);
  if (!pack){ say(`No pack "${packId}".`); process.exitCode = 2; return; }
  const used = new Set(T.map(t => t.id));
  let id = pack.ids[0];
  const inPack = T.filter(t => t.id >= pack.ids[0] && t.id <= pack.ids[1]).map(t => t.id);
  if (inPack.length) id = Math.max(...inPack) + 1;
  while (used.has(id) && id <= pack.ids[1]) id++;
  if (id > pack.ids[1]){ say(`Pack "${packId}" has no free id left in ${pack.ids[0]}–${pack.ids[1]}.`); process.exitCode = 1; return; }
  const tagged = T.filter(t => t.pol && Object.keys(t.pol).length);
  const sug = suggestPolFor({id: -1, section: sec, trait: name, desc: ""}, tagged);
  const lit = {id, section: sec, category: cat, trait: name, desc: "TODO: what it looks like from outside, one sentence.",
    example: "TODO: a line or a beat that shows it.", intensity: 3, rarity: "uncommon", pol: sug ? sug.pol : {}, reviewStatus: "unreviewed"};
  say("// Paste into the " + packId + " pack's data file:");
  say(JSON.stringify(lit, null, 2).replace(/"([a-zA-Z]+)":/g, "$1:") + ",");
  const near = T.map(t => ({t, s: similarity(name, t.trait)})).sort((a, b) => b.s - a.s).slice(0, 5).filter(x => x.s > 0);
  if (near.length){ say("\n// Nearest existing:"); near.forEach(({t, s}) => say(`//   ${(s * 100).toFixed(0)}%  #${t.id} ${t.trait} (${t.section})`)); }
  if (near[0] && near[0].s > 0.5) say("// The top match is close enough that this may be a duplicate.");
}

const COMMANDS = {validate: cmdValidate, coverage: cmdCoverage, nearest: cmdNearest, review: cmdReview, preview: cmdPreview, packs: cmdPacks,
  'suggest-pol': cmdSuggestPol, families: cmdFamilies, worldtag: cmdWorldtag, scaffold: cmdScaffold};
if (!COMMANDS[cmd]){
  say(`Unknown command "${cmd}". One of: ${Object.keys(COMMANDS).join(", ")}`);
  process.exitCode = 2;
} else COMMANDS[cmd]();
