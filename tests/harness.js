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
  'js/engine.js',
  'js/generate.js',
  'js/render.js',
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
