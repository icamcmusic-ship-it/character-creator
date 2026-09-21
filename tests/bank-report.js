#!/usr/bin/env node
/* The bank and the generator, measured — the diversity acceptance dashboard the 2026
   audit asked for, printed rather than remembered.

     node tests/bank-report.js              # the bank: coverage, cells, polarity, presets
     node tests/bank-report.js --diversity  # ...plus a 600-build slot-concentration sample
     node tests/bank-report.js --json       # machine-readable, for a diff between versions

   Every figure here has been cited in a comment somewhere and gone stale. Printing them
   from the live bank on demand is cheaper than a doc-generation step and harder to
   argue with than a comment. The ratchets in tests/run.js assert that the important
   ones do not regress; this is where you read them. */
const {loadEngine} = require('./harness');
const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has('--json');
const DIVERSITY = args.has('--diversity');
const SAMPLE = parseInt((process.argv.find(a=>a.startsWith('--n=')) || '--n=600').slice(4), 10);

const ctx = loadEngine(['TRAITS','CATS_BY_SECTION','RTIER_ORDER','rarityTier','ARCHETYPES','PERSONALITY_AXES',
  'PRESENTATION_VARIANTS','AXIS_TO_POLCODE','AXIS_LABELS','TRAIT_PACKS','PROFILE_SECTIONS','buildCharacterState',
  'mulberry32','withRng','finalizeSheet','forgetRecentTraits','forgetSlotDraws','forgetCategoryUse','slotCat',
  'polarityPrior','TRAIT_CONTEXTS']);
const A = ctx.api, T = A.TRAITS;
const out = {version: null, bank: {}, sections: [], grid: {}, cells: {}, thin: [], target: {}, polarity: [],
             archetypes: {}, hints: [], review: {}, packs: [], schema: {}, diversity: null};
try { out.version = require('child_process').execSync('git rev-parse --short HEAD', {cwd: __dirname}).toString().trim(); } catch(e){}

const pct = (a,b) => b ? (100*a/b).toFixed(1) + '%' : '—';
const say = (...x) => { if (!JSON_OUT) console.log(...x); };
const head = t => say('\n\x1b[1m' + t + '\x1b[0m');

// ---------------- bank & sections ----------------
out.bank = {traits: T.length, sections: A.CATS_BY_SECTION.size,
  categories: [...A.CATS_BY_SECTION.values()].reduce((n,c)=>n+c.length,0)};
head(`Bank — ${T.length.toLocaleString()} traits · ${out.bank.sections} sections · ${out.bank.categories} categories · ${out.version || 'unstamped'}`);

head('Section inventory (nonzero polarity = at least one nonzero effective component)');
const sec = new Map();
T.forEach(t=>{
  const r = sec.get(t.section) || {section:t.section, traits:0, polarised:0};
  r.traits++;
  if (t.pol && Object.values(t.pol).some(v=>v)) r.polarised++;
  sec.set(t.section, r);
});
say('  traits  polarised  share    section');
sec.forEach(r=>{ out.sections.push(r); say(`  ${String(r.traits).padStart(6)}  ${String(r.polarised).padStart(9)}  ${pct(r.polarised,r.traits).padStart(6)}   ${r.section}`); });
const untagged = out.sections.reduce((n,r)=>n+r.traits-r.polarised,0);
say(`  ${untagged} traits (${pct(untagged,T.length)}) carry no directional polarity. Not a defect for appearance or a deliberately neutral situational entry; it does mean the sliders reach the category but not the trait there.`);

// ---------------- rarity x intensity ----------------
head('Rarity x intensity');
const grid = {}; A.RTIER_ORDER.forEach(r=>grid[r]=[0,0,0,0,0,0]);
T.forEach(t=>{ grid[A.rarityTier(t)][t.intensity]++; });
say('  tier          i1     i2     i3     i4     i5   total');
A.RTIER_ORDER.forEach(r=>{
  const row = grid[r].slice(1); out.grid[r] = row;
  say(`  ${r.padEnd(12)}${row.map(n=>String(n).padStart(7)).join('')}${String(row.reduce((a,b)=>a+b,0)).padStart(8)}`);
});
(function cramers(){
  const rows=A.RTIER_ORDER, cols=[1,2,3,4,5], N=T.length;
  const rs={}, cs={}; rows.forEach(r=>rs[r]=cols.reduce((s,c)=>s+grid[r][c],0)); cols.forEach(c=>cs[c]=rows.reduce((s,r)=>s+grid[r][c],0));
  let chi=0; rows.forEach(r=>cols.forEach(c=>{ const e=rs[r]*cs[c]/N; if (e>0) chi+=Math.pow(grid[r][c]-e,2)/e; }));
  out.grid.cramersV = +Math.sqrt(chi/(N*Math.min(rows.length-1,cols.length-1))).toFixed(4);
  say(`  Cramér's V ${out.grid.cramersV} — a strong association, not "V% explained". The audit's staged milestones are 0.60 then 0.55.`);
})();
out.target = {
  quietSignature: grid.signature[1]+grid.signature[2], quietDistinctive: grid.distinctive[1]+grid.distinctive[2],
  loudCommon: grid.common[4]+grid.common[5], uncommonI5: grid.uncommon[5],
};
say(`  target cells — quiet signature ${out.target.quietSignature} · quiet distinctive ${out.target.quietDistinctive} · loud common ${out.target.loudCommon} · uncommon i5 ${out.target.uncommonI5}`);

// ---------------- per-category cells ----------------
const byCat = new Map();
T.forEach(t=>{ const k=t.section+'||'+t.category; if(!byCat.has(k)) byCat.set(k,[]); byCat.get(k).push(t); });
const cells = [];
byCat.forEach((list,k)=>{ const s=new Set(); list.forEach(t=>s.add(A.rarityTier(t)+':'+t.intensity)); cells.push({key:k, traits:list.length, cells:s.size}); });
cells.sort((a,b)=>a.cells-b.cells || a.traits-b.traits);
out.cells = {mean: +(cells.reduce((s,c)=>s+c.cells,0)/cells.length).toFixed(2), min: cells[0].cells};
out.thin = cells.slice(0, 16);
head(`Thinnest categories by occupied (rarity x intensity) cells — mean ${out.cells.mean}/20`);
say('  cells  traits  category');
out.thin.forEach(c=> say(`  ${String(c.cells).padStart(5)}  ${String(c.traits).padStart(6)}  ${c.key.replace('||',' > ')}`));

head('Appearance (the fixed slots that draw from the smallest local pools)');
(A.CATS_BY_SECTION.get('Appearance')||[]).forEach(c=>{
  const list = byCat.get('Appearance||'+c)||[]; const s=new Set(); list.forEach(t=>s.add(A.rarityTier(t)+':'+t.intensity));
  say(`  ${String(list.length).padStart(4)} traits  ${String(s.size).padStart(2)}/20  ${c}`);
});

// ---------------- polarity balance ----------------
head('Polarity balance per axis (share of directional tags that are positive)');
const pos={}, neg={};
T.forEach(t=>Object.entries(t.pol||{}).forEach(([k,v])=>{ if(v>0) pos[k]=(pos[k]||0)+1; else if(v<0) neg[k]=(neg[k]||0)+1; }));
say('  axis    +tags  -tags  +share  prior   label');
Object.keys({...pos,...neg}).sort().forEach(k=>{
  const p=pos[k]||0,n=neg[k]||0, row={axis:k, pos:p, neg:n, share:+(p/(p+n)).toFixed(3), prior:+A.polarityPrior(k).toFixed(3)};
  out.polarity.push(row);
  const flag = row.share < 0.4 || row.share > 0.6 ? ' ◄' : '';
  say(`  ${k.padEnd(7)}${String(p).padStart(6)}${String(n).padStart(7)}  ${pct(p,p+n).padStart(6)}  ${String(row.prior).padStart(6)}  ${A.AXIS_LABELS[k]||''}${flag}`);
});
say('  ◄ outside the 40–60% band. axisProfile subtracts the prior, so a lean here no longer reads as posture; it still means the sliders have less to choose from on the thin side.');

// ---------------- archetypes ----------------
const arche = Object.values(A.ARCHETYPES);
head(`Archetype input balance — ${arche.length} presets`);
say('  axis               +    -   unset');
A.PERSONALITY_AXES.forEach(a=>{
  let p=0,n=0,u=0;
  arche.forEach(x=>{ const v=x.pers&&x.pers[a.id]; if(v===undefined||v===0) u++; else if(v>0) p++; else n++; });
  out.archetypes[a.id] = {pos:p, neg:n, unset:u};
  const flag = (p && n && (p/n >= 2.5 || n/p >= 2.5)) ? ' ◄' : '';
  say(`  ${a.id.padEnd(18)}${String(p).padStart(3)}${String(n).padStart(5)}${String(u).padStart(8)}${flag}`);
});
const hints = {};
arche.forEach(x=>Object.entries(x.profile||{}).forEach(([k,v])=>{ const key=k+':'+v; hints[key]=(hints[key]||0)+1; }));
out.hints = Object.entries(hints).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({hint:k, presets:v}));
say('  profile hints, most to least used:');
out.hints.forEach(h=> say(`    ${String(h.presets).padStart(3)}  ${h.hint}`));
const withIntent = arche.filter(x=>x.intent).length, withVariations = arche.filter(x=>x.variations && x.variations.length).length;
say(`  ${withIntent} presets carry an intent spec, ${withVariations} carry named variations.`);
out.archetypes.__intent = withIntent; out.archetypes.__variations = withVariations;

// ---------------- editorial state & schema uptake ----------------
head('Editorial state and schema uptake');
const rs = {}; T.forEach(t=>{ rs[t.reviewStatus||'unreviewed'] = (rs[t.reviewStatus||'unreviewed']||0)+1; });
out.review = rs;
say('  reviewStatus: ' + Object.entries(rs).map(([k,v])=>`${k} ${v}`).join(' · '));
['conceptFamily','behaviorFunction','conditions','exceptions','frequency','visibility','persistence','narrativeSalience','worldTags','supports','conflicts','requires','examplesBySituation'].forEach(f=>{
  const n = T.filter(t=>t[f] !== undefined).length; out.schema[f] = n;
  if (n) say(`  ${f.padEnd(20)} ${String(n).padStart(5)} traits`);
});
const families = new Map(); T.forEach(t=>{ if (t.conceptFamily) families.set(t.conceptFamily, (families.get(t.conceptFamily)||0)+1); });
if (families.size) say(`  ${families.size} concept families declared; largest: ` + [...families.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k} (${v})`).join(', '));

head('Packs');
(A.TRAIT_PACKS||[]).forEach(p=>{
  const n = T.filter(t=>t.pack===p.id).length; out.packs.push({id:p.id, label:p.label, version:p.version, traits:n, applicability:p.applicability});
  say(`  ${p.id.padEnd(14)} v${String(p.version).padEnd(3)} ${String(n).padStart(5)} traits  ${p.label}${p.applicability && p.applicability.era !== 'any' ? '  [era: '+p.applicability.era+']' : ''}`);
});

// ---------------- diversity sample ----------------
if (DIVERSITY){
  head(`Slot concentration — ${SAMPLE} builds at shipped defaults, fresh session, no constraints`);
  ctx.evalIn("PERSONALITY_AXES.forEach(a=>{ const el=document.getElementById('pers_'+a.id); if (el) el.value=0; });");
  const slotCounts = new Map(), catCounts = new Map();
  const seen = new Set(); let dupes = 0, slotsTotal = 0;
  const profJoint = new Map();
  for (let i=0;i<SAMPLE;i++){
    let st;
    A.withRng(A.mulberry32(700000+i), ()=>{
      st = A.finalizeSheet(A.buildCharacterState({verbLevel:0, regLevel:0, compLevel:0, mannerCount:3, vocabCount:2,
        rarityPref:0, vocabPref:null, personalityOverrides:{}}), {rarityPref:0, applyPins:false});
    });
    const ids = new Set();
    Object.entries(st).forEach(([slot,s])=>{
      if (!s || !s.trait) return;
      slotsTotal++;
      if (ids.has(s.trait.id)) dupes++; ids.add(s.trait.id); seen.add(s.trait.id);
      if (!slotCounts.has(slot)) slotCounts.set(slot, new Map());
      const m = slotCounts.get(slot); m.set(s.trait.trait, (m.get(s.trait.trait)||0)+1);
    });
    A.PROFILE_SECTIONS.filter(ps=>!ps.drawAll).forEach(ps=>{
      const c = A.slotCat(st['prof_'+ps.id+'_0']); if (!c) return;
      if (!catCounts.has(ps.id)) catCounts.set(ps.id, new Map());
      const m = catCounts.get(ps.id); m.set(c, (m.get(c)||0)+1);
    });
    const joint = ['role','values'].map(id=>A.slotCat(st['prof_'+id+'_0'])||'—').join(' / ');
    profJoint.set(joint, (profJoint.get(joint)||0)+1);
  }
  const effective = m => { let H=0; const n=[...m.values()].reduce((a,b)=>a+b,0); m.forEach(v=>{ const p=v/n; H-=p*Math.log(p); }); return Math.exp(H); };
  const rows = [];
  slotCounts.forEach((m,slot)=>{
    const sorted = [...m.entries()].sort((a,b)=>b[1]-a[1]); const n=[...m.values()].reduce((a,b)=>a+b,0);
    rows.push({slot, distinct:m.size, effective:+effective(m).toFixed(1), top1:+(sorted[0][1]/n).toFixed(3),
      top5:+(sorted.slice(0,5).reduce((s,x)=>s+x[1],0)/n).toFixed(3), most: sorted[0][0]});
  });
  rows.sort((a,b)=>b.top1-a.top1);
  say(`  distinct trait ids seen ${seen.size} · mean slots ${(slotsTotal/SAMPLE).toFixed(2)} · sheets with a duplicate id ${dupes}`);
  say('  top-1   top-5  distinct  eff.  slot                   most frequent');
  rows.slice(0, 14).forEach(r=> say(`  ${pct(r.top1,1).padStart(6)} ${pct(r.top5,1).padStart(7)}  ${String(r.distinct).padStart(8)}  ${String(r.effective).padStart(5)}  ${r.slot.padEnd(22)} ${r.most}`));
  say('  profile marginals:');
  catCounts.forEach((m,id)=>{
    const n=[...m.values()].reduce((a,b)=>a+b,0);
    say(`    ${id.padEnd(11)} ` + [...m.entries()].sort((a,b)=>b[1]-a[1]).map(([c,v])=>`${c.split(' ')[0]} ${pct(v,n)}`).join(' · '));
  });
  const jn = [...profJoint.values()].reduce((a,b)=>a+b,0);
  say('  role x values joint, top 5: ' + [...profJoint.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k} ${pct(v,jn)}`).join(' · '));
  out.diversity = {sample: SAMPLE, distinctIds: seen.size, meanSlots: +(slotsTotal/SAMPLE).toFixed(2), duplicateSheets: dupes, slots: rows,
    marginals: Object.fromEntries([...catCounts.entries()].map(([id,m])=>[id, Object.fromEntries(m)]))};
}

if (JSON_OUT) console.log(JSON.stringify(out, null, 1));
