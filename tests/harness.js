/* Minimal DOM stub + module loader so the engine can be exercised in Node.
   The app is a plain static site with no build step, so there is nothing to
   import: the scripts are concatenated into one vm context exactly the way the
   browser concatenates them into one global scope. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function makeEl(id, props){
  const el = Object.assign({
    id, value: '', checked: true, textContent: '', innerHTML: '', style: {},
    tagName: 'INPUT', options: [], classList: {add(){}, remove(){}, toggle(){}, contains(){return false;}},
    appendChild(){}, removeChild(){}, addEventListener(){}, removeEventListener(){},
    querySelectorAll(){ return []; }, querySelector(){ return null; },
    closest(){ return null; }, setAttribute(){}, removeAttribute(){}, getAttribute(){ return null; },
    focus(){}, blur(){}, click(){}, remove(){}, showModal(){}, close(){}, scrollIntoView(){},
    insertAdjacentHTML(){}, dataset: {}, children: [], returnValue: '',
  }, props || {});
  el.style.setProperty = () => {};
  return el;
}

function makeDocument(){
  const els = new Map();
  return {
    _els: els,
    _set(id, props){ const el = makeEl(id, props); els.set(id, el); return el; },
    getElementById(id){ return els.has(id) ? els.get(id) : null; },
    createElement(tag){ return makeEl(null, {tagName: String(tag).toUpperCase()}); },
    body: makeEl('body', {classList:{add(){},remove(){},toggle(){},contains(){return false;}}}),
    documentElement: makeEl('html'),
    addEventListener(){}, removeEventListener(){},
    // js/app.js reaches for elements by selector during load (the tab strip, the range
    // inputs). Return an element rather than null so the module-level wiring runs to
    // completion instead of throwing partway and leaving half its functions undefined.
    querySelector(){ return makeEl(null); },
    querySelectorAll(){ return []; },
  };
}

// Files that must load cleanly with no DOM at all — everything at their top level
// is data or function declarations.
const ENGINE_FILES = [
  'js/data/traits-core.js',
  'js/data/traits-supplement.js',
  'js/data/traits-situational.js',
  'js/data/traits-tails.js',
  'js/data/traits-depth.js',
  'js/data/traits-balance.js',
  'js/data/traits-tails2.js',
  'js/data/traits-cells.js',
  'js/data/traits-polarity.js',
  'js/data/traits-life.js',
  'js/data/traits-gaps.js',
  'js/data/traits-growth-a.js',
  'js/data/traits-growth-b.js',
  'js/data/traits-growth-c.js',
  'js/data/traits-growth-d.js',
  'js/data/traits-growth-e.js',
  'js/data/traits-conflict.js',
  'js/data/traits-v2-lib.js',
  'js/data/traits-v2-want.js',
  'js/data/traits-v2-fear.js',
  'js/data/traits-v2-wound.js',
  'js/data/traits-v2-lie.js',
  'js/data/traits-v2-need.js',
  'js/data/traits-v2-ghost.js',
  'js/data/traits-v2-defence.js',
  'js/data/traits-v2-role-a.js',
  'js/data/traits-v2-role-b.js',
  'js/data/traits-v2-values.js',
  'js/data/traits-v2-habits.js',
  'js/data/traits-v2-persuasion.js',
  'js/data/traits-v2-decision.js',
  'js/data/traits-v2-hospitality.js',
  'js/data/traits-v2-speech.js',
  'js/data/traits-v2-gaps.js',
  'js/data/traits-v2-poles-a.js',
  'js/data/traits-v2-poles-b.js',
  'js/data/traits-v2-poles-c.js',
  'js/data/traits-v2-poles-d.js',
  'js/data/traits-v2-poles-e.js',
  'js/data/traits-v2-poles-f.js',
  'js/data/traits-v2-cells-a.js',
  'js/data/traits-v2-cells-b.js',
  'js/data/traits-v2-manifest.js',
  'js/data/presets-v2.js',
  'js/data/prose-pools-v2.js',
  'js/data/voice-acts-v2.js',
  'js/data/pol-overlay-v2-a.js',
  'js/data/pol-overlay-v2-b.js',
  'js/data/pol-overlay-v2-c.js',
  'js/data/pol-overlay-v2-d.js',
  'js/data/pol-overlay-v2-e.js',
  'js/data/pol-overlay-v2-f.js',
  'js/data/pol-overlay-v2-g.js',
  'js/data/pol-overlay-v2-h.js',
  'js/engine.js',
  'js/generate.js',
  'js/render.js',
  'js/mechanics.js',
  /* js/app.js was omitted from this list, so roughly two thousand lines — storage,
     save/load, cast generation, relationship analysis, the foil finder, ensemble
     balance, preferences, tab switching and the keyboard map — had no invariant
     coverage at all. axisProfile lives there, and secondOrderTensions in engine.js
     depends on it, so the untested file was underneath a tested one. */
  'js/app.js',
];

// vm.runInContext gives each script its own lexical scope, so `const` bindings
// would NOT be shared between files the way they are between browser <script>
// tags. Concatenate first, run once — same semantics as the real page.
function loadEngine(exportNames){
  const document = makeDocument();
  const sandbox = {
    console, document, setTimeout, clearTimeout, Math, JSON, Date,
    navigator: {}, URL: {createObjectURL(){return '';}, revokeObjectURL(){}},
    requestAnimationFrame(fn){ return setTimeout(fn, 0); }, cancelAnimationFrame: clearTimeout,
    matchMedia: () => ({matches:false, addEventListener(){}, removeEventListener(){}, addListener(){}}),
    indexedDB: undefined,
    Blob: function(){}, FileReader: function(){}, alert(){}, confirm(){return true;},
    localStorage: null,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  const code = ENGINE_FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n');
  const names = exportNames || DEFAULT_EXPORTS;
  const epilogue = '\n;globalThis.__api = {' + names.map(n=>`${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(', ') + '};\n';
  vm.runInContext(code + epilogue, ctx, {filename: 'bundle.js'});
  ctx.api = ctx.__api;
  /* `let`/`const` at the top level of the bundle are lexical bindings in the vm's own
     scope, not properties of globalThis, so a test cannot reach module state such as
     castStates or charMeta by assigning to ctx. Evaluate in the same scope instead —
     the same seam the browser console gives you on the real page. */
  ctx.evalIn = (code) => vm.runInContext(code, ctx, {filename: 'test-eval.js'});
  return ctx;
}

const DEFAULT_EXPORTS = [
  'TRAITS','TRAITS_BY_KEY','CATS_BY_SECTION','AXIS_LABELS','AXIS_TO_POLCODE','PERSONALITY_AXES',
  'PROFILE_SECTIONS','WEIGHT_MATRIX','traitPos','magFromPos','targetFromMag','targetFromLevel',
  'buildCharacterState','pickInRange','byFilter','catsOf','mulberry32','hashSeedString',
  'rollCharacterVariants','coherenceScore','checkConflictsFor','PRESENTATION_VARIANTS',
  'RTIER_ORDER','RTIER_SCORE','rarityTier','withCharacterVariants','withSavedVariants',
  'charVariants','VARIANT_ODDS','POL_COUNTS','polNormalise','poolFloorTarget','rangeSelect',
  'rarityNorm','proximityWeights','profileTarget','applyBudgets','budgetCapacity',
  'BUDGET_GROUPS','BUDGET_PRESETS','applyBudgetPreset','clearBudgets','rarityCaps',
  'intensityCaps','getBudgetMode','setBudgetMode','getBudgetReport','getCharVariants',
  'SECTION_OF_CATEGORY','forgetSlotDraws',
];

module.exports = {loadEngine, makeDocument, ROOT, ENGINE_FILES};
