#!/usr/bin/env node
/* The content studio: the author-facing side of the bank, so adding content is a
   reviewed operation rather than a careful paste into a 6,000-line literal.

     node tools/studio.js validate                 # schema + duplicate-name + link check
     node tools/studio.js coverage [--section=X]   # the heatmap: which cells are thin
     node tools/studio.js nearest "a phrase"       # what already exists near an idea
     node tools/studio.js review [--pack=id]       # what is unreviewed, and where
     node tools/studio.js preview [--pack=id] [--n=5]   # generate with only these packs
     node tools/studio.js packs                    # the manifests and their id ranges

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
  'forgetRecentTraits','forgetSlotDraws','forgetCategoryUse','packOfId']);
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

const COMMANDS = {validate: cmdValidate, coverage: cmdCoverage, nearest: cmdNearest, review: cmdReview, preview: cmdPreview, packs: cmdPacks};
if (!COMMANDS[cmd]){
  say(`Unknown command "${cmd}". One of: ${Object.keys(COMMANDS).join(", ")}`);
  process.exitCode = 2;
} else COMMANDS[cmd]();
