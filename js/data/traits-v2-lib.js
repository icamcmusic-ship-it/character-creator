/* ============================================================================
   Helpers shared by the v2 content files (js/data/traits-v2-*.js).

   Everything in those files is stamped `since: 2` through the "v2" pack manifest (traits-v2-manifest.js): a v1 build cannot
   see it, so every printed v1 seed and old share link still builds exactly what it always did. A blank-seed roll prints a v2
   seed and draws from all of it.

   Row format:  [trait, desc, example, intensity 1-5, rarity key c|u|d|s, pol{axis:+1|-1}, extra?]
   Write traits as BEHAVIOUR (what the speech or manner does), never as labels or diagnoses, and never about names or
   appearance. IDS: each file owns a block of 1000 (see its header); append only.
   ========================================================================== */
/* Slider links for the v2 categories; merged into the v2 weight table only (engine.js), never into the v1 copy. */
const GAP_V2_LINKS = {};
const V2 = (function(){
  const R = {c:"common", u:"uncommon", d:"distinctive", s:"signature"};
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  /* block(out, section, category, baseId, rows) appends rows as traits with ids baseId, baseId+1, … */
  function block(out, section, category, base, rows){
    rows.forEach((r, i) => {
      const [trait, desc, example, intensity, rk, pol, extra] = r;
      out.push(Object.assign({
        id: base + i, section, category, trait, desc, example, intensity,
        rarity: R[rk], pol: Object.assign({}, pol || {}), conceptFamily: "v2-" + slug(trait), reviewStatus: "unreviewed"
      }, extra || {}));
    });
  }
  /* link(axis, "pos"|"neg", sectionId, {category: "S"|"M"|"W"}) lets a slider reach a new optional section's categories. */
  function link(axis, pole, secId, cats){
    const L = GAP_V2_LINKS[axis] = GAP_V2_LINKS[axis] || {};
    const P = L[pole] = L[pole] || {};
    P[secId] = Object.assign(P[secId] || {}, cats);
  }
  return {R, slug, block, link};
})();
