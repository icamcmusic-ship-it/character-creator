#!/usr/bin/env node
/* Replay check: builds a fixed list of v1 seeds (and a few v2 ones) with the engine found under <root> and prints one line
   per seed (a hash of every seated trait id). Run it against an old checkout and against this one and diff the output:
   a v1 seed or old share link must build the same character forever.

     git worktree add /tmp/base <old-ref>
     node tools/replay-check.js /tmp/base > /tmp/old.txt
     node tools/replay-check.js . > /tmp/new.txt && diff /tmp/old.txt /tmp/new.txt && echo "v1 seeds unchanged"

   Options: --n=<count> (default 60), --varied (own sliders and presets per seed), --all-on (switch every section on, as the test harness does), --v2 (also print v2 seeds;
   those are expected to differ between versions of the bank). */
const path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const opt = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const N = parseInt(opt('n') || '60', 10);
const varied = process.argv.includes('--varied');
const allOn = process.argv.includes('--all-on'), withV2 = process.argv.includes('--v2');
const {loadEngine} = require(path.join(root, 'tests', 'harness.js'));
const g = loadEngine();
const d = g.document;
['verbositySlider','registerSlider','composureSlider','mannerCount','vocabCount'].forEach(id => d._set(id, {value: id.includes('Count') ? '3' : '0'}));
g.api.PERSONALITY_AXES.forEach(a => d._set('pers_' + a.id, {value: '0'}));
const OFF = new Set(['texture','repair','contextrole','romance','dialect','beliefs','jargon','conversation','body','money','fears','family','conflictstyle',
  'persuasion','feedback','decision','boundaries','emotion','hospitality','greetings','digital']);
g.api.PROFILE_SECTIONS.forEach(ps => {
  d._set('sec_' + ps.id, {checked: allOn ? true : !OFF.has(ps.id)});
  d._set('pw_' + ps.id, {value: '', tagName: 'SELECT', options: [{value: ''}]});
  d._set('type_' + ps.id, {value: '', tagName: 'SELECT', options: [{value: ''}]});
});
d._set('seedInput', {value: ''}); d._set('engineVersion', {value: '1'}); d._set('batchTray', {}); d._set('charName', {value: ''});
d._set('sheet', {classList: {contains(){ return true; }, add(){}, remove(){}}});
d._set('pressureSheet', {}); d._set('stressToggle', {checked: false}); d._set('divergence', {value: '0.3'});
g.evalIn("renderSheet=function(){};checkConflicts=function(){};renderNovelty=function(){};renderBatchTray=function(){};"
  + "srAnnounce=function(){};renderSlotChange=function(){};renderArc=function(){};var __toasts=[];toast=function(m){__toasts.push(m)};");
const sig = () => g.evalIn("Object.keys(state).sort().map(k=>k+':'+(state[k]&&state[k].trait?state[k].trait.id:'-')).join(',')");
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16); };
const archKeys = Object.keys(g.api.ARCHETYPES || {});
d._set('archetypeSelect', {value: '', tagName: 'SELECT', options: [{value: ''}]});
// --varied: every seed gets its own slider positions and (one in three) a preset, so the check covers the paths a default sheet skips.
const vary = i => {
  const r = k => ((Math.imul(i * 2654435761 >>> 0, 40503) + k * 7919) >>> 0) % 161 - 80;
  g.api.PERSONALITY_AXES.forEach((a, k) => { d.getElementById('pers_' + a.id).value = String(varied ? r(k) : 0); });
  ['verbositySlider','registerSlider','composureSlider'].forEach((id, k) => { d.getElementById(id).value = String(varied ? r(30 + k) : 0); });
  d.getElementById('archetypeSelect').value = varied && i % 3 === 0 && archKeys.length ? archKeys[(i * 7) % archKeys.length] : '';
};
const run = pre => { for (let i = 1; i <= N; i++){ vary(i); const seed = pre + (i * 7919).toString(36); d.getElementById('seedInput').value = seed; g.evalIn('_runGeneration()'); console.log(seed + ' ' + hash(sig())); } };
run('v1-');
if (withV2) run('v2-');
