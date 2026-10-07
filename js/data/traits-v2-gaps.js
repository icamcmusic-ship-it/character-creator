/* v2 content: speech-mechanics gaps placed in existing categories (upspeak, vocal fry, institutional "we", malapropism, talks to self, and similar). IDS 234000-234999. See traits-v2-lib.js for the format. */
const TRAITS_V2_GAPS = (function(){
  const out = [];
  // V2.block(out, "<Section>", "<Category>", 234000, [ [trait, desc, example, intensity, "c|u|d|s", {pol}], … ]);
  return out;
})();
TRAITS.push(...TRAITS_V2_GAPS);
