/* The "v2" pack: everything in js/data/traits-v2-*.js. `since: 2` is what hides it from a v1 build (see byFilter in engine.js).
   Turning the pack off under Content packs removes it from every draw, like any other pack. */
TRAIT_PACKS.push({id:"v2", label:"2026 growth (engine v2)", version:"1", ids:[210000, 299999], since:2,
  applicability:{era:"any", realism:"any", tone:"any"},
  blurb:"Larger Motivation pools, new Social Role, Values and Habits categories, new optional sections (persuasion, feedback, decisions, boundaries, hospitality, digital voice and more), and fill for the thinnest poles and cells. Built only by engine v2 seeds."});
