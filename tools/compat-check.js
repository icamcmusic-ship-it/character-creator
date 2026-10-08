#!/usr/bin/env node
/* Does a content edit change what an old seed builds?
 *
 *   node tools/compat-check.js <git-ref>
 *
 * Loads the trait bank at <git-ref> (in a temporary worktree) and the bank in the working tree, and lists every trait
 * whose draw-relevant fields differ: section, category, intensity, rarity, polarity, presentation variant, tier,
 * concept family, behaviour function, world tags. Names, descriptions and examples are not compared: those are text.
 * A rename can still move a trait, because the variant and tier tags are derived from the wording (see variantPin and
 * tierPin in js/engine.js); a non-empty report means an old seed may now draw something different.
 * Traits added since <git-ref> are listed separately and are not a difference. Exit code 1 when anything differs. */
const {execFileSync} = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');
const ref = process.argv[2];
if (!ref){ console.error('usage: node tools/compat-check.js <git-ref>'); process.exit(2); }
const root = path.join(__dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'compat-'));
const FIELDS = "({id:t.id,section:t.section,category:t.category,intensity:t.intensity,rarity:t.rarity,rtier:t.rtier,pol:JSON.stringify(t.pol),variant:t.variant||null,tier:t.tier||null,conceptFamily:t.conceptFamily||null,behaviorFunction:t.behaviorFunction||null,worldTags:JSON.stringify(t.worldTags||null),pack:t.pack||null})";
const dump = r => require(path.join(r, 'tests', 'harness.js')).loadEngine().evalIn(`TRAITS.map(t=>${FIELDS})`);
try {
  execFileSync('git', ['worktree', 'add', '--detach', dir, ref], {cwd: root, stdio: 'ignore'});
  const before = dump(dir), now = dump(root);
  const byId = new Map(now.map(t => [t.id, t]));
  let diffs = 0, removed = 0;
  before.forEach(t => {
    const u = byId.get(t.id);
    if (!u){ removed++; console.log('removed', t.id); return; }
    Object.keys(t).forEach(k => { if (t[k] !== u[k]){ diffs++; console.log(`${t.id} ${k}: ${t[k]} -> ${u[k]}`); } });
  });
  const added = now.length - (before.length - removed);
  console.log(`${before.length} traits at ${ref}, ${now.length} now (${added} added, ${removed} removed); ${diffs} field differences.`);
  process.exitCode = diffs || removed ? 1 : 0;
} finally {
  try { execFileSync('git', ['worktree', 'remove', '--force', dir], {cwd: root, stdio: 'ignore'}); } catch(e){}
}
