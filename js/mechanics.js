/* ================= SECTION 6 MECHANICS =================
   The audit rated casts, foils, relationships, pressure, arcs and the context lens as
   "moderate", and tierWeight, the wildcard rationale and the emergent archetype label
   as "shallow". Everything here deepens one of those, and everything is composed from
   the sheet that is already on screen: no new randomness enters a build except through
   an explicitly seeded withRng block, so a seeded replay stays exactly reproducible.

   Loaded after engine/generate/render and before app.js. Functions reach app.js globals
   (axisProfile, OPPOSED_CATEGORIES, CAST_COLORS) only at call time. */

// ---------- shared text helpers ----------
const _MX_STOP = new Set(("a an the and or but of to in on at for with from by as is are was were be been being it its this that these those " +
  "they them their he she his her him i me my we our you your not no so if then than too very just only into out up down over about what who " +
  "whom which when where why how all any some more most one own same other such do does did have has had can could would should will shall may " +
  "might must there here also still ever never thing things someone something anyone people person every even once back again").split(" "));
function _mxStem(w){ return w.replace(/(ingly|edly|ing|ed|ies|es|s|ly|ness|ment|ful)$/, "").slice(0, 7); }
/* Content words, crudely stemmed: enough to see that "she told her sister the truth"
   and a Lie about honesty are talking about the same thing, and no more. */
function mxTokens(text){
  const out = new Set();
  (String(text || "").toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []).forEach(w=>{
    w = w.replace(/'s$/, "");
    if (_MX_STOP.has(w)) return;
    w.split("-").forEach(p => { const s = _mxStem(p); if (s.length >= 3 && !_MX_STOP.has(p)) out.add(s); });
  });
  return out;
}
function mxOverlap(a, b){ const B = b instanceof Set ? b : mxTokens(b); return [...(a instanceof Set ? a : mxTokens(a))].filter(w => B.has(w)); }
// A trait name that is one hyphen-joined run ("Being-liked-means-being-fake") is a
// phrase, and reads as one only once the hyphens are spaces.
function _mxUnrun(s){ return (!/\s/.test(s) && (s.match(/-/g) || []).length >= 2) ? s.replace(/-/g, " ") : s; }
function _mxQ(s){ return `"${_mxUnrun(String(s || "").trim().replace(/^['"\u2018\u201c]+|['"\u2019\u201d]+$/g, ""))}"`; }
function _mxLc(s){ s = _mxUnrun(String(s || "").trim().replace(/[.!]+$/, "")); return s ? s[0].toLowerCase() + s.slice(1) : s; }
function _mxHash(s){ let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0; return h >>> 0; }
function _mxPick(arr, key){ return arr.length ? arr[_mxHash(key) % arr.length] : null; }
function _mxSlot(st, sectionId, catRe){
  return Object.keys(st || {}).find(k => k.startsWith("prof_" + sectionId + "_") && st[k] && st[k].trait
    && (!catRe || catRe.test(st[k].trait.category))) || null;
}
function _mxT(st, sectionId, catRe){ const k = _mxSlot(st, sectionId, catRe); return k ? st[k].trait : null; }

// ================= 1. tierWeight: rule-derived secondary tier =================
/* 55 of ~2,400 personality traits were hand-listed as "secondary" — specific learned
   behaviours rather than dispositions — so tierWeight() did nothing for 98% of the
   bank. The listed ones share a shape: an agentive or gerund compound ("Receipt-keeper",
   "Praise-fishing", "Party-avoider"), where the core traits are single dispositional
   adjectives ("Aloof", "Warm-hearted"). The rule below recovers 43 of the 55 listed
   names from their shape alone, and tags the unlisted rest the same way. Derived tags
   are marked tierSource:"derived" so the studio can tell them from the hand list. */
function isBehaviouralTraitName(name){
  const n = String(name || "").trim();
  const last = n.split(/[\s-]/).pop().toLowerCase();
  if (/-/.test(n) && /(er|ers|ing|or|ist|ee)$/.test(last)) return true;
  if (/^[A-Z][a-z]+ [a-z]+(er|ing)$/.test(n)) return true;
  return /-(obsessed|seeking|avoidant|prone|fishing|dropping|keeping|driven)$/i.test(n);
}
let TIER_DERIVED_STATS = {derived: 0};
function deriveSecondaryTiers(traits){
  let derived = 0;
  (traits || []).forEach(t=>{
    if (!t || t.section !== "Personality Traits" || t.tier === "secondary") return;
    if (isBehaviouralTraitName(t.trait)){ t.tier = "secondary"; t.tierSource = "derived"; derived++; }
  });
  return derived;
}
if (typeof TRAITS !== "undefined"){
  TIER_DERIVED_STATS = {derived: deriveSecondaryTiers(TRAITS)};
  if (typeof TIER_TAG_STATS !== "undefined" && TIER_TAG_STATS) TIER_TAG_STATS.derived = TIER_DERIVED_STATS.derived;
}

// ================= 2. Emergent archetype labels =================
/* (Archetype LABELS only — "The Barbed Broker". Character names stay user-entered.)
   The tables were three words deep, so composition recycled the same handful. Grow
   them, and let the sheet's own loudest traits lend a word: a single-word disposition
   becomes an adjective ("The Frosty Broker"), a behavioural compound becomes a noun
   ("The Guarded Receipt-Keeper"). */
(function growArchetypeVocabulary(){
  if (typeof ARCH_ADJ === "undefined" || typeof ARCH_NOUN === "undefined") return;
  const add = (tbl, extra) => Object.entries(extra).forEach(([k, words])=>{
    tbl[k] = (tbl[k] || []).concat(words.filter(w => !(tbl[k] || []).includes(w)));
  });
  add(ARCH_ADJ, {
    "Rigid & Principled":["Upright","Scrupulous","Unswerving"], "Pragmatic & Flexible":["Practical","Supple","Shrewd"],
    "Loyalty-Bound":["Steadfast","Oathbound","Kin-Minded"], "Self-Interested":["Grasping","Canny","Mercenary"],
    "Idealistic & Visionary":["Starry","Crusading","Far-Sighted"],
    "Secure":["Unhurried","Settled","Easy-Hearted"], "Anxious":["Watchful","Hungry-Hearted","Uneasy"],
    "Avoidant":["Guarded","Aloof","Arm's-Length"], "Disorganized":["Unsettled","Two-Minded","Weathered"],
    "Dry & Deadpan":["Flat-Voiced","Laconic"], "Self-Deprecating":["Sheepish","Wry"], "Cruel & Barbed":["Acid","Needling"],
    "Warm & Playful":["Merry","Teasing"], "Absurd & Chaotic":["Madcap","Giddy"], "Humorless & Absent":["Stern","Solemn"],
    "Intellectual & Wordplay":["Quick","Erudite"],
    "Substance & Consumption":["Thirsty","Smoke-Stained"], "Compulsion & Ritual":["Fastidious","Tidy-Minded"],
    "Risk & Escape":["Restless-Footed","Daring"], "Restraint & Discipline":["Spare","Temperate"],
    "Avoidance & Procrastination":["Tomorrow-Minded","Drifting"],
    "Fight (attack the threat)":["Hot-Blooded","Squared-Up"], "Flight (remove yourself)":["Skittish","Door-Watching"],
    "Freeze (shut down)":["Stone-Still","Quiet-Eyed"], "Fawn (appease the threat)":["Eager-to-Please","Soft-Spoken"],
  });
  add(ARCH_NOUN, {
    "Leader":["Chief","Standard-Bearer","Helmsman"], "Peacemaker":["Go-Between","Diplomat"], "Instigator":["Firebrand","Stirrer"],
    "Outsider":["Loner","Exile"], "Caretaker":["Nurse","Shepherd"], "Skeptic":["Cynic","Questioner"], "Connector":["Matchmaker","Hub"],
    "Rigid & Principled":["Stickler","Judge"], "Pragmatic & Flexible":["Dealer","Realist"], "Loyalty-Bound":["Liegeman","Companion"],
    "Self-Interested":["Hustler","Profiteer"], "Idealistic & Visionary":["Crusader","Idealist"],
    "Secure":["Harbour","Keel"], "Anxious":["Watcher","Petitioner"], "Avoidant":["Hermit","Lone Hand"], "Disorganized":["Riddle","Tempest"],
    "Dry & Deadpan":["Deadpan","Understater"], "Self-Deprecating":["Self-Mocker"], "Cruel & Barbed":["Wasp","Sharpshooter"],
    "Warm & Playful":["Tease","Jester"], "Absurd & Chaotic":["Wildcard","Clown"], "Humorless & Absent":["Stoic","Straight Arrow"],
    "Intellectual & Wordplay":["Wit","Pedant"],
    "Substance & Consumption":["Tippler","Glutton"], "Compulsion & Ritual":["Checker","Collector"], "Risk & Escape":["Daredevil","Drifter"],
    "Restraint & Discipline":["Stoic","Monk"], "Avoidance & Procrastination":["Drifter","Dawdler"],
    "Fight (attack the threat)":["Brawler","Bruiser"], "Flight (remove yourself)":["Escapee","Ghost"],
    "Freeze (shut down)":["Statue","Held Breath"], "Fawn (appease the threat)":["Pleaser","Courtier"],
  });
})();
const _MX_TITLE = s => String(s).split(/([\s-])/).map(p => /^[a-z]/.test(p) ? p[0].toUpperCase() + p.slice(1) : p).join("");
/* Words the sheet's own signature traits can lend to the label. Only the loud or rare
   ones qualify, and only from Personality/Profile slots — a label built from a
   mannerism would describe a habit, not a person. */
function signatureArchetypeWords(st){
  const pool = Object.keys(st || {}).filter(k => k.startsWith("pers_") || k.startsWith("prof_"))
    .map(k => st[k] && st[k].trait).filter(t => t && t.section !== "Motivation & Wound" && t.section !== "Goals & Stakes"
      && ((t.intensity || 3) >= 4 || t.rarity === "signature" || t.rarity === "distinctive"))
    .sort((a, b) => (b.intensity || 3) - (a.intensity || 3) || a.id - b.id);
  const adj = [], noun = [];
  pool.forEach(t=>{
    const n = String(t.trait || "").trim();
    if (!n || n.length > 22 || /[^A-Za-z' -]/.test(n)) return;
    const words = n.split(" ");
    if (words.length === 1 && /-/.test(n) && /(er|or|ist)$/i.test(n)) noun.push(_MX_TITLE(n));
    else if (words.length === 1 && t.section === "Personality Traits" && !/(er|or|ist|ing|ism|ness|tion)$/i.test(n)
      && (!/-/.test(n) || /-(hearted|minded|tongued|eyed|headed|willed|footed|natured|spoken)$/i.test(n))) adj.push(_MX_TITLE(n));
    else if (words.length === 2 && /(er|or|ist)$/i.test(words[1]) && n.length <= 18) noun.push(_MX_TITLE(n));
  });
  return {adj: [...new Set(adj)].slice(0, 3), noun: [...new Set(noun)].slice(0, 3)};
}

// ================= 3. Wildcard: a generated "survives because" =================
/* Nine canned endings keyed on behaviourFunction. The reason an exception survives is
   a relation between TWO traits — the one that cuts against the grain and the loudest
   one it cuts against — so compose it from that pair. Deterministic in the two ids;
   consumes nothing from the generation stream. */
const _WILD_FUNC = {
  protect:"it guards something the rest of the sheet has no way to guard", soothe:"it is how they calm down, and nothing else on the sheet does that job",
  connect:"it is the one door they leave open", avoid:"it is where they go when the rest of this is too much",
  perform:"it is a role, and they know exactly when they are playing it", control:"it is the one thing they get to steer",
  provide:"somebody depends on it", repair:"it is what they reach for after the damage",
};
const _WILD_SECTION = {
  "Habits & Vices":"it pays for itself in relief", "Humor Style":"it lets the pressure out sideways",
  "Values & Moral Line":"it is a line older than the rest of them", "Motivation & Wound":"it is the want underneath the want",
  "Mannerisms":"the body learned it before the personality arrived", "Attachment & Intimacy Style":"one person taught it to them and it stuck",
  "Conflict & Stress Response":"it is what their body does before their opinions catch up", "Social Role in a Group":"one room needed them to be this, once",
};
function wildcardSurvivesBecause(trait, lean, partial){
  if (!trait || !lean) return (typeof EXCEPTION_SURVIVES !== "undefined" ? EXCEPTION_SURVIVES.default : "it survives") + ".";
  const want = Math.sign(lean.v);
  const anchors = Object.values(partial || {}).map(s => s && s.trait)
    .filter(t => t && t.id !== trait.id && t.pol && Math.sign(t.pol[lean.ax] || 0) === want)
    .sort((a, b) => (b.intensity || 3) - (a.intensity || 3) || a.id - b.id);
  const anchor = anchors[0] || null;
  const label = (typeof AXIS_LABELS !== "undefined" && AXIS_LABELS[lean.ax]) || lean.ax;
  const func = _WILD_FUNC[trait.behaviorFunction] || _WILD_SECTION[trait.section] || "nobody has ever made them pay for it";
  if (!anchor) return `it survives because ${func}.`;
  const key = trait.id + "|" + anchor.id;
  const forms = [
    `${_mxQ(trait.trait)} sits against ${_mxQ(anchor.trait)} on ${label}. It survives because ${func} — and ${_mxQ(anchor.trait)} never has to find out.`,
    `All that ${want > 0 ? "" : "lack of "}${label} (${_mxQ(anchor.trait)}) is expensive to keep up; ${_mxQ(trait.trait)} is where they stop paying. It survives because ${func}.`,
    `${_mxQ(anchor.trait)} leaves a gap — ${_mxLc(anchor.desc) || "it cannot do everything"} — and ${_mxQ(trait.trait)} fills it. It survives because ${func}.`,
    `Put ${_mxQ(trait.trait)} next to ${_mxQ(anchor.trait)} and one of them should lose. Neither does, because ${func}.`,
  ];
  return _mxPick(forms, key);
}

// ================= 4. Context lens: derived conditions =================
/* ~68 traits carry authored conditions; everything else fell to section rules and, for
   roughly a third of a sheet, to "no rule moves it here". Many of those cards say
   where they happen in their own description ("in front of strangers", "at work",
   "when exhausted"). Read the room off the text and category, and use it only where
   the lens would otherwise have fallen back — authored data and the section rules
   keep priority. */
const CONTEXT_DERIVE_RULES = [
  {tag:"stranger", re:/\b(strangers?|in public|publicly|crowds?|audiences?|part(y|ies)|gatherings?|on stage|onlookers|new people|acquaintances|social settings?|group settings?|the room)\b/},
  {tag:"private",  re:/\b(alone|in private|privately|at home|behind closed doors|partners?|spouse|family|close friends?|loved ones?|intima\w*|one-on-one|nobody is (looking|watching)|unwatched)\b/},
  {tag:"authority",re:/\b(boss(es)?|superiors?|authority|authorities|rank|elders?|teachers?|officials?|managers?|chain of command|orders|institution\w*|the powerful|power over)\b/},
  {tag:"work",     re:/\b(work|workplace|job|colleagues?|co-?workers?|meetings?|office|shifts?|professional\w*|deadlines?)\b/},
  {tag:"threat",   re:/\b(danger\w*|threat\w*|crisis|crises|emergenc\w*|panic\w*|attack\w*|under pressure|combat|cornered|conflict|confrontation\w*|stress\w*|fights?)\b/},
  {tag:"fatigue",  re:/\b(tired|exhaust\w*|fatigue\w*|late at night|worn out|sleep-deprived|drained)\b/},
];
const _CTX_CATEGORY_TAGS = [
  [/Among Peers|Connector|Leader|Instigator/, "stranger"], [/With Dependents|Caretaker|Intima|Routines|Small Pleasures/, "private"],
  [/Under Authority/, "authority"], [/Fight|Flight|Freeze|Fawn|Core Fear|Defence/, "threat"],
];
const _ctxTagCache = new Map();
function derivedContextTags(t){
  if (!t) return [];
  const key = t.id != null ? t.id : t.trait;
  if (_ctxTagCache.has(key)) return _ctxTagCache.get(key);
  const text = `${t.trait || ""} ${t.desc || ""} ${t.example || ""}`.toLowerCase();
  const tags = new Set(CONTEXT_DERIVE_RULES.filter(r => r.re.test(text)).map(r => r.tag));
  _CTX_CATEGORY_TAGS.forEach(([re, tag]) => { if (re.test(t.category || "")) tags.add(tag); });
  const out = [...tags];
  _ctxTagCache.set(key, out);
  return out;
}
const _CTX_MODE_DERIVED = {public:["stranger"], private:["private"], authority:["authority","work"], threat:["threat","fatigue"]};
const _CTX_OPPOSED = {public:["private"], private:["stranger","work","authority"], authority:["private"], threat:[]};
let DERIVED_CONTEXT_ENABLED = true;
function derivedContextVerdict(t, mode){
  if (!DERIVED_CONTEXT_ENABLED || !t || !mode || mode.id === "baseline") return null;
  const tags = derivedContextTags(t);
  if (!tags.length) return null;
  const words = typeof CONTEXT_WORDS !== "undefined" ? CONTEXT_WORDS : {};
  const hit = tags.find(g => (_CTX_MODE_DERIVED[mode.id] || []).includes(g));
  if (hit) return {status:"amplified", why:`its own description places it ${words[hit] || hit} — this is its room`};
  const away = tags.find(g => (_CTX_OPPOSED[mode.id] || []).includes(g));
  if (away) return {status:"suppressed", why:`its own description places it ${words[away] || away}, which is not this room`};
  if (tags.length) return {status:"active", why:`described for ${tags.map(g => words[g] || g).join(" / ")}; nothing here switches it off`};
  return null;
}
/* Category- and section-level conditions, for cards whose text names no room at all.
   Keyed [mode][axis] -> [verdict at the positive pole, verdict at the negative pole],
   then [mode][section] (a category regex may refine it). A = amplified, S = suppressed,
   T = active. */
const _V = (c, why) => ({status: c === "A" ? "amplified" : c === "S" ? "suppressed" : "active", why});
const CONTEXT_AXIS_CONDITIONS = {
  public: {friendliness:[_V("A","strangers meet the warmth first"), _V("A","strangers meet the chill first")],
    manners:[_V("A","manners are for an audience"), _V("A","the rough edges show most in company")],
    confidence:[_V("A","confidence is performed for a room"), _V("S","the doubt hides behind a public face")],
    assertiveness:[_V("A","they take the floor"), _V("S","they cede the floor in company")],
    honesty:[_V("T","the straight answer is the same in any room"), _V("A","the evasions are for an audience")],
    emotionalcapacity:[_V("S","feeling is kept for later"), _V("A","the guard is up in company")],
    positivity:[_V("A","the bright side is the public side"), _V("S","the gloom is kept for home")]},
  private: {friendliness:[_V("A","the warmth is fullest with their own"), _V("T","the distance holds even at home")],
    manners:[_V("S","the politeness relaxes when nobody is keeping score"), _V("A","nobody to be polite for")],
    confidence:[_V("S","part of the confidence was for the audience"), _V("A","alone, the doubt gets louder")],
    emotionalcapacity:[_V("A","the feeling comes out behind closed doors"), _V("T","guarded even here — which is the tell")],
    discipline:[_V("T","the discipline does not need a witness"), _V("A","unwatched time is where it slips")],
    positivity:[_V("T","the optimism is real, not a show"), _V("A","the gloom comes home with them")]},
  authority: {manners:[_V("A","manners go up in front of rank"), _V("S","the rough edges are filed down for rank")],
    assertiveness:[_V("S","they measure what they say in front of rank"), _V("A","they fold fastest in front of rank")],
    rebelliousness:[_V("A","rank is exactly what the defiance is for"), _V("A","compliance is on show for rank")],
    honesty:[_V("T","they tell rank the truth, too"), _V("A","rank is who they shade the truth for")],
    discipline:[_V("A","discipline is what rank wants to see"), _V("S","the slack is hidden from the boss")],
    confidence:[_V("T","self-assurance holds in front of rank"), _V("A","rank finds the insecurity first")],
    agreeableness:[_V("A","accommodation rises with rank"), _V("A","the argument is sharpest with rank")]},
  threat: {activeness:[_V("A","the energy spikes"), _V("S","they go still")],
    discipline:[_V("A","the discipline is what holds"), _V("S","the discipline is the first thing to go")],
    positivity:[_V("S","optimism is the first casualty"), _V("A","the gloom feels vindicated")],
    intelligence:[_V("A","they think their way through it"), _V("A","instinct takes over completely")],
    curiosity:[_V("S","curiosity switches off under threat"), _V("T","nothing new to ignore")],
    friendliness:[_V("S","warmth is withdrawn when it could be used"), _V("A","the chill hardens")],
    agreeableness:[_V("S","accommodation stops"), _V("A","the argumentative edge comes out")],
    emotionalcapacity:[_V("A","the feeling floods out"), _V("A","the guard goes all the way up")]},
};
const CONTEXT_SECTION_CONDITIONS = {
  public: [["Values & Moral Line",null,_V("T","the line holds in any room")], ["Habits & Vices",null,_V("S","the habit waits until nobody is watching")],
    ["Competence & Method",null,_V("A","competence is the visible part")], ["Goals & Stakes",null,_V("S","the aims are not announced to strangers")],
    ["Personality Traits",null,_V("T","a disposition — it walks into every room with them")]],
  private: [["Vocabulary Traits",null,_V("T","the words come home with them")], ["Goals & Stakes",null,_V("A","private is where the aim gets talked about")],
    ["Mannerisms",null,_V("T","the body's habits run unobserved")], ["Values & Moral Line",null,_V("T","the line holds when nobody checks it")],
    ["Humor Style",null,_V("A","the in-jokes come out")], ["Dialogue Grammar Traits",null,_V("T","sentence shape does not change for the room")],
    ["Verbosity Traits",null,_V("T","they talk the same amount, just more freely")], ["Competence & Method",null,_V("S","the work stays at work")],
    ["Personality Traits",null,_V("T","a disposition — it walks into every room with them")]],
  authority: [["Vocabulary Traits",null,_V("S","the private vocabulary is edited for rank")],
    ["Goals & Stakes",/Immediate/,_V("A","the objective is exactly what they are here to argue for")], ["Goals & Stakes",null,_V("S","they keep their longer aims away from power")],
    ["Mannerisms",null,_V("S","the fidgets are held in")], ["Values & Moral Line",null,_V("T","orders are where the line gets tested")],
    ["Humor Style",null,_V("S","jokes are rationed in front of rank")], ["Habits & Vices",null,_V("S","the habit is hidden from the boss")],
    ["Competence & Method",null,_V("A","competence is what rank is looking at")], ["Dialogue Grammar Traits",null,_V("T","sentence shape holds")],
    ["Personality Traits",null,_V("T","a disposition — it walks into every room with them")]],
  threat: [["Motivation & Wound",/Core Want|The Need/,_V("S","the long want waits until they survive this")], ["Motivation & Wound",null,_V("A","the old injury is close to the surface")], ["Vocabulary Traits",null,_V("S","the vocabulary shrinks to what works")],
    ["Goals & Stakes",/Immediate/,_V("A","the immediate objective is all that is left in view")], ["Goals & Stakes",null,_V("S","the longer aim drops out of view")],
    ["Mannerisms",null,_V("A","the body's habits get louder")], ["Dialogue Grammar Traits",null,_V("A","sentence shape frays first")],
    ["Habits & Vices",null,_V("A","they reach for the vice")], ["Competence & Method",null,_V("A","competence is what gets them through")],
    ["Verbosity Traits",null,_V("A","the talking changes speed")], ["Personality Traits",null,_V("T","a disposition — it walks into every room with them")]],
};
function categoryContextVerdict(t, mode){
  if (!DERIVED_CONTEXT_ENABLED || !t || !mode || mode.id === "baseline") return null;
  if (typeof PERSONALITY_AXES !== "undefined"){
    const ax = PERSONALITY_AXES.find(a => a.pos === t.category || a.neg === t.category);
    const row = ax && CONTEXT_AXIS_CONDITIONS[mode.id] && CONTEXT_AXIS_CONDITIONS[mode.id][ax.id];
    if (row) return row[t.category === ax.pos ? 0 : 1];
  }
  const hit = (CONTEXT_SECTION_CONDITIONS[mode.id] || []).find(([sec, re]) => sec === t.section && (!re || re.test(t.category || "")));
  return hit ? hit[2] : null;
}

// ================= 5. Casts: roles and joint voice optimisation =================
const CAST_ROLES = [
  {id:"leader",   label:"Leader",       blurb:"Sets the direction; the others react to them."},
  {id:"foil",     label:"Foil",         blurb:"Opposes the leader on the axes that matter most."},
  {id:"comic",    label:"Comic relief", blurb:"Lets the pressure out of the room."},
  {id:"heart",    label:"Heart",        blurb:"Holds the group together when it matters."},
  {id:"skeptic",  label:"Skeptic",      blurb:"Asks the question nobody wants asked."},
  {id:"wildcard", label:"Wildcard",     blurb:"Nobody is sure which way they will jump."},
];
function _castRoleScore(st, prof){
  const cat = id => { const t = _mxT(st, id); return t ? t.category : null; };
  const role = cat("role"), humor = cat("humor"), attach = cat("attachment"), vices = cat("vices"), values = cat("values");
  const humorT = _mxT(st, "humor");
  const p = k => prof[k] || 0;
  const s = {leader:[], comic:[], heart:[], skeptic:[], wildcard:[]};
  const add = (r, v, why) => { if (v) s[r].push({v, why}); };
  add("leader", role === "Leader" ? 3 : role === "Instigator" ? 1 : 0, `group role ${role}`);
  add("leader", p("asrt") * 2, "assertive"); add("leader", p("ego"), "self-assured");
  add("comic", ({"Warm & Playful":3, "Absurd & Chaotic":3, "Self-Deprecating":2, "Intellectual & Wordplay":2, "Dry & Deadpan":1, "Humorless & Absent":-3})[humor] || 0, `${humor} humour`);
  add("comic", humorT ? ((humorT.intensity || 3) - 3) * 0.4 : 0, "how hard the humour lands");
  add("heart", ({"Caretaker":3, "Peacemaker":2, "Connector":1})[role] || 0, `group role ${role}`);
  add("heart", attach === "Secure" ? 1 : 0, "secure attachment"); add("heart", p("warm") * 2, "warm");
  add("skeptic", role === "Skeptic" ? 3 : 0, "group role Skeptic"); add("skeptic", -p("agr") * 1.5, "contrarian");
  add("skeptic", p("intel"), "analytical"); add("skeptic", values === "Rigid & Principled" ? 0.5 : 0, "principled");
  add("wildcard", attach === "Disorganized" ? 2 : 0, "disorganised attachment"); add("wildcard", role === "Outsider" ? 2 : 0, "outsider");
  add("wildcard", vices === "Risk & Escape" ? 1 : 0, "risk-taking"); add("wildcard", -p("disc"), "undisciplined");
  const out = {};
  Object.entries(s).forEach(([r, parts]) => {
    out[r] = {score: parts.reduce((a, b) => a + b.v, 0),
      why: parts.filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 2).map(x => x.why)};
  });
  return out;
}
/* Greedy, in role priority order: the best leader, then whoever sits furthest from the
   leader as the foil, then the best remaining candidate for each other seat. Pure and
   order-stable (ties break on cast order). Members beyond six share "Ensemble". */
function assignCastRoles(members){
  const list = (members || []).map((m, i) => {
    const prof = typeof axisProfile === "function" ? axisProfile(m.state || {}) : {};
    return {i, prof, sc: _castRoleScore(m.state || {}, prof)};
  });
  const out = list.map(x => ({index: x.i, id: "ensemble", label: "Ensemble", why: "fills out the room"}));
  if (!list.length) return out;
  const free = new Set(list.map(x => x.i));
  const take = (roleId, scoreOf, why) => {
    let best = null;
    free.forEach(i => { const v = scoreOf(list[i]); if (best === null || v > best.v) best = {i, v}; });
    if (!best) return null;
    free.delete(best.i);
    const r = CAST_ROLES.find(x => x.id === roleId);
    out[best.i] = {index: best.i, id: roleId, label: r.label, why: why(list[best.i]) || r.blurb};
    return best.i;
  };
  const whyOf = r => x => x.sc[r].why.length ? x.sc[r].why.join(", ") : null;
  const leader = take("leader", x => x.sc.leader.score, whyOf("leader"));
  if (list.length >= 2 && leader !== null){
    const L = list[leader].prof;
    const dist = x => Object.keys(Object.assign({}, L, x.prof)).reduce((a, k) => a + Math.abs((L[k] || 0) - (x.prof[k] || 0)), 0);
    take("foil", dist, x => {
      const axes = Object.keys(L).filter(k => Math.sign(L[k] || 0) && Math.sign(L[k]) === -Math.sign(x.prof[k] || 0))
        .map(k => (typeof AXIS_LABELS !== "undefined" && AXIS_LABELS[k]) || k).slice(0, 2);
      return axes.length ? `opposite the leader on ${axes.join(" and ")}` : "furthest from the leader overall";
    });
  }
  ["comic", "heart", "skeptic", "wildcard"].forEach(r => { if (free.size) take(r, x => x.sc[r].score, whyOf(r)); });
  return out;
}
/* JOINT OPTIMISATION. Members were rolled independently and then de-duplicated on
   profile categories only; two members could still share half their voice devices.
   After the roll, reroll the member who collides most with the rest — a few seeded
   attempts per pass — and keep a candidate only if the whole cast's shared-device total
   drops. `rebuild(i)` returns {state, variants} and is called inside a withRng keyed
   on seedKey, so the result is a pure function of the cast seed. */
function optimiseCastVoices(entries, seedKey, rebuild, opts){
  const o = Object.assign({passes: 3, attempts: 4}, opts || {});
  if (!entries || entries.length < 2 || typeof voiceCollisionMatrix !== "function") return {before: 0, after: 0, rerolled: 0};
  /* Motivation collisions (audit §6a): two members who share a Lie, Wound or Want, or the
     same stress and attachment pair, get identical pressure and recovery text. They count
     alongside the shared voice devices. */
  const motiv = arr => {
    const keys = arr.map(c => {
      const st = c.state, k = [];
      ["The Lie", "Core Wound", "Core Want"].forEach(r => { const t = _mxT(st, "motivation", new RegExp(r, "i")); if (t) k.push("m:" + t.id); });
      const a = _mxT(st, "attachment"), x = _mxT(st, "stress"); if (a && x) k.push("p:" + a.category + "|" + x.category);
      return k;
    });
    return keys.map((k, i) => keys.reduce((n, o, j) => n + (j !== i ? k.filter(x => o.includes(x)).length : 0), 0));
  };
  const matrix = arr => { const v = voiceCollisionMatrix(arr, "baseline", 0), mo = motiv(arr);
    const totals = v.totals.map((t, i) => t + mo[i]); let worst = -1;
    totals.forEach((t, i) => { if (t > 0 && (worst < 0 || t > totals[worst])) worst = i; });
    return {totals, worst}; };
  const total = arr => matrix(arr).totals.reduce((a, b) => a + b, 0);
  let cur = entries.slice(), m = matrix(cur);
  const before = m.totals.reduce((a, b) => a + b, 0);
  let now = before, rerolled = 0;
  for (let pass = 0; pass < o.passes && now > 0; pass++){
    const i = m.worst;
    if (i < 0) break;
    let best = null;
    for (let a = 0; a < o.attempts; a++){
      withRng(mulberry32(hashSeedString(seedKey + "|castopt|" + pass + "|" + a)), ()=>{
        const cand = rebuild(i);
        if (!cand || !cand.state) return;
        const trial = cur.map((c, j) => j === i ? Object.assign({}, c, cand) : c);
        const t = total(trial);
        if (t < (best ? best.t : now)) best = {t, trial};
      });
    }
    if (!best) break;
    cur = best.trial; now = best.t; rerolled++;
    m = matrix(cur);
  }
  cur.forEach((c, j) => { entries[j] = c; });
  return {before, after: now, rerolled};
}

// ================= 6. Foils: premises from the other sheet =================
/* Premises were eight fixed sentences plus a few per opposed section. A foil matters
   because of what it does to the SOURCE: it is the person who lives as if the source's
   Lie were false, or who was there for the Wound and chose differently. Build the
   premise from the source's wound/lie/want/fear/need/values and the foil's values. */
function foilPremiseFromSheets(src, foil, rng, names){
  const A = (names && names.a) || "the character", B = (names && names.b) || "the foil";
  const lie = _mxT(src, "motivation", /The Lie/i), wound = _mxT(src, "motivation", /Core Wound/i);
  const want = _mxT(src, "motivation", /Core Want/i), fear = _mxT(src, "motivation", /Core Fear/i);
  const need = _mxT(src, "motivation", /The Need/i);
  const va = _mxT(src, "values"), vb = _mxT(foil, "values"), wantB = _mxT(foil, "motivation", /Core Want/i);
  const SV = typeof STRATEGY_BY_VALUES !== "undefined" ? STRATEGY_BY_VALUES : {};
  const forms = [];
  if (lie && vb) forms.push({text: `${A} believes ${_mxQ(lie.trait)}. ${B} is walking evidence against it — ${_mxLc(vb.desc)} — and has never once paid for it the way ${A} says you must.`, from: [lie, vb]});
  if (wound && vb) forms.push({text: `${B} was there for ${_mxQ(wound.trait)}, or close enough to it, and chose ${SV[vb.category] || _mxLc(vb.trait)} over ${A}. Neither has said so out loud since.`, from: [wound, vb]});
  if (want && wantB && want.id !== wantB.id) forms.push({text: `${A} wants ${_mxQ(want.trait)}; ${B} wants ${_mxQ(wantB.trait)}. Both can be had, but only by the same door, and only one of them fits through it.`, from: [want, wantB]});
  if (va && vb && va.category !== vb.category) forms.push({text: `${A} runs on ${SV[va.category] || va.trait}; ${B} runs on ${SV[vb.category] || vb.trait}. They met on the day those two things asked for the same decision.`, from: [va, vb]});
  if (fear) forms.push({text: `${B} is what ${A}'s fear looks like lived in — ${_mxQ(fear.trait)} — and ${B} seems perfectly fine, which is worse.`, from: [fear]});
  if (need) forms.push({text: `${B} could give ${A} ${_mxQ(need.trait)} without even trying, and is the last person alive ${A} would take it from.`, from: [need]});
  // Frames driven by the rest of the sheet (audit §5a): humour, attachment, competence, origin.
  const hA = _mxT(src, "humor"), hB = _mxT(foil, "humor"), atA = _mxT(src, "attachment"), atB = _mxT(foil, "attachment");
  const roleA = _mxT(src, "role"), roleB = _mxT(foil, "role"), cmpA = _mxT(src, "competence"), cmpB = _mxT(foil, "competence");
  const orgA = _mxT(src, "origins"), orgB = _mxT(foil, "origins");
  if (hA && hB && hA.category !== hB.category) forms.push({text: `${A} is funny in one register (${_mxLc(hA.category)}) and ${B} in another (${_mxLc(hB.category)}). Put them in a room and each of them finds the other's jokes either unforgivable or a relief.`, from: [hA, hB]});
  if (atA && atB && atA.category !== atB.category) forms.push({text: `${A} loves ${_mxLc(atA.category)}; ${B} loves ${_mxLc(atB.category)}. Neither is wrong, and each is the other's standing proof that the other's way costs something.`, from: [atA, atB]});
  if (cmpA && cmpB && cmpA.category !== cmpB.category) forms.push({text: `${B} is good at the thing ${A} is merely competent at — ${_mxQ(cmpB.trait)} — and ${A} has never decided whether to learn from it or resent it.`, from: [cmpA, cmpB]});
  if (roleA && roleB && roleA.category !== roleB.category) forms.push({text: `${A} takes the ${_mxLc(roleA.category)} seat; ${B} takes the ${_mxLc(roleB.category)} one. The group works only while neither has to explain why.`, from: [roleA, roleB]});
  if (orgA && orgB) forms.push({text: `${A} came from ${_mxQ(orgA.trait)}; ${B} from ${_mxQ(orgB.trait)}. They agree on nothing about how things are done, and each privately suspects the other got the easier start.`, from: [orgA, orgB]});
  if (!forms.length) return null;
  const pick = forms[Math.floor((rng || Math.random)() * forms.length)];
  return {text: pick.text, from: pick.from.map(t => t.trait)};
}

// ================= 7. Relationships: asymmetric pairs, triads, factions, secrets =================
const RELATIONSHIP_INVERSE = {mentor:"protege", protege:"mentor", rival:"rival", confidant:"confidant", ally:"ally", ex:"ex", antagonist:"antagonist", dependant:null};
/* Both directions at once, asymmetric by construction: statuses mirror, and whichever
   side leans in harder (anxious attachment, lower self-assurance) is guaranteed to
   depend more and trust differently than the other — a pair of identical numbers is a
   description of nobody. The reasons are appended to each edge's `why`. */
function asymmetricEdgePair(a, b, roleId){
  const inv = roleId ? (RELATIONSHIP_INVERSE[roleId] !== undefined ? RELATIONSHIP_INVERSE[roleId] : roleId) : null;
  const da = edgeDefaults(a.state, b.state, roleId), db = edgeDefaults(b.state, a.state, inv);
  const mirror = {above:"below", below:"above", equal:"equal"};
  if (da.status !== "equal") db.status = mirror[da.status];
  else if (db.status !== "equal") da.status = mirror[db.status];
  const lean = st => {
    const att = _mxT(st, "attachment"), prof = typeof axisProfile === "function" ? axisProfile(st) : {};
    return (att && att.category === "Anxious" ? 1 : att && att.category === "Avoidant" ? -1 : 0) - (prof.ego || 0) + (prof.warm || 0) * 0.5;
  };
  const la = lean(a.state), lb = lean(b.state);
  const [hi, lo, hiName] = la >= lb ? [da, db, "a"] : [db, da, "b"];
  if (hi.dependence <= lo.dependence){
    if (lo.dependence > 1) lo.dependence -= 1; else hi.dependence = Math.min(5, hi.dependence + 1);
    if (hi.dependence <= lo.dependence) hi.dependence = Math.min(5, lo.dependence + 1);
  }
  if (hi.trust === lo.trust){
    if (hi.trust < 5) hi.trust += 1; else lo.trust -= 1;
  }
  hi.why = (hi.why || []).concat("leans in harder than they are leaned on");
  lo.why = (lo.why || []).concat("is needed more than they need");
  if (hi.knows && lo.knows && hi.knows === lo.knows) lo.knows = "";
  return [makeEdge(a.id, b.id, roleId, da), makeEdge(b.id, a.id, inv, db), hiName];
}
function _edgeSign(e){
  if (e.role === "antagonist" || e.role === "rival") return -1;
  return (e.trust || 3) >= 3 ? 1 : -1;
}
function relationshipWeb(members, edges){
  const ms = members || [], idx = new Map(ms.map((m, i) => [m.id, i]));
  const name = i => (ms[i] && ms[i].meta && ms[i].meta.name) || ("#" + (i + 1));
  const pair = new Map();
  (edges || []).forEach(e => {
    const a = idx.get(e.from), b = idx.get(e.to);
    if (a === undefined || b === undefined || a === b) return;
    const k = Math.min(a, b) + "|" + Math.max(a, b);
    const p = pair.get(k) || {a: Math.min(a, b), b: Math.max(a, b), edges: [], sign: 0};
    p.edges.push(e); p.sign += _edgeSign(e);
    pair.set(k, p);
  });
  const pairs = [...pair.values()].map(p => Object.assign(p, {sign: p.sign > 0 ? 1 : p.sign < 0 ? -1 : (p.edges.some(e => _edgeSign(e) < 0) ? -1 : 1),
    trust: p.edges.reduce((s, e) => s + (e.trust || 3), 0) / p.edges.length}));
  const signOf = (i, j) => { const p = pair.get(Math.min(i, j) + "|" + Math.max(i, j)); return p ? p.sign : 0; };
  // Triads — closed ones judged by structural balance, open ones as a broker.
  const triads = [];
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) for (let k = j + 1; k < ms.length; k++){
    const s = [signOf(i, j), signOf(j, k), signOf(i, k)], n = s.filter(Boolean).length;
    if (n === 3){
      const neg = s.filter(x => x < 0).length;
      const kind = neg === 0 ? "solid" : neg === 2 ? "two against one" : neg === 1 ? "unstable" : "all against all";
      const balanced = neg % 2 === 0;
      const line = neg === 0 ? `${name(i)}, ${name(j)} and ${name(k)} hold together — which means an outsider is coming.`
        : neg === 2 ? (() => { const odd = s[0] > 0 ? k : s[1] > 0 ? i : j; const [x, y] = [i, j, k].filter(q => q !== odd); return `${name(x)} and ${name(y)} are allied against ${name(odd)}.`; })()
        : neg === 1 ? (() => { const bad = s[0] < 0 ? [i, j, k] : s[1] < 0 ? [j, k, i] : [i, k, j]; return `${name(bad[2])} likes both ${name(bad[0])} and ${name(bad[1])}, who cannot stand each other. Sooner or later ${name(bad[2])} has to choose.`; })()
        : `${name(i)}, ${name(j)} and ${name(k)}: everyone against everyone. It holds only while a bigger threat does.`;
      triads.push({members: [i, j, k], closed: true, balanced, kind, line});
    } else if (n === 2){
      const centre = !s[2] ? j : !s[0] ? k : i;
      const [x, y] = [i, j, k].filter(q => q !== centre);
      triads.push({members: [i, j, k], closed: false, balanced: null, kind: "broker",
        line: `${name(centre)} is the only line between ${name(x)} and ${name(y)} — whatever passes between those two goes through ${name(centre)}.`});
    }
  }
  // Factions — connected components over positive pairs; with no edges at all, a
  // shared Values category is the best available guess and says so.
  const parent = ms.map((_, i) => i);
  const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
  pairs.filter(p => p.sign > 0).forEach(p => { parent[find(p.a)] = find(p.b); });
  let basis = "trust";
  if (!pairs.length){
    basis = "values";
    const byVal = new Map();
    ms.forEach((m, i) => { const v = _mxT(m.state, "values"); if (!v) return; if (byVal.has(v.category)) parent[find(i)] = find(byVal.get(v.category)); else byVal.set(v.category, i); });
  }
  const groups = new Map();
  ms.forEach((_, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); });
  const factions = [...groups.values()].filter(g => g.length >= 2).map(g => {
    const cats = {}; g.forEach(i => { const v = _mxT(ms[i].state, "values"); if (v) cats[v.category] = (cats[v.category] || 0) + 1; });
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    return {members: g, label: top ? top[0] : "Unaligned", basis};
  });
  // Shared secrets — two or more people who know the same thing about a third.
  const knowsSomething = e => e.knows && !/^(Knows nothing|Has not noticed)/i.test(e.knows);
  const secrets = [];
  ms.forEach((m, x) => {
    const holders = (edges || []).filter(e => e.to === m.id && knowsSomething(e)).map(e => idx.get(e.from)).filter(i => i !== undefined);
    const uniq = [...new Set(holders)];
    if (uniq.length >= 2){
      const w = _mxT(m.state, "motivation", /Core Wound/i) || _mxT(m.state, "motivation", /The Lie/i) || _mxT(m.state, "motivation", /The Ghost/i);
      secrets.push({subject: x, holders: uniq, about: w ? w.trait : "the contradiction on their sheet",
        line: `${uniq.map(name).join(" and ")} both know about ${name(x)}'s ${w ? `${_mxQ(w.trait)}` : "contradiction"} — and neither knows the other knows.`});
    }
  });
  pairs.forEach(p => {
    const ab = p.edges.find(e => idx.get(e.from) === p.a), ba = p.edges.find(e => idx.get(e.from) === p.b);
    if (ab && ba && knowsSomething(ab) && knowsSomething(ba))
      secrets.push({subject: null, holders: [p.a, p.b], about: "each other", line: `${name(p.a)} and ${name(p.b)} each hold something on the other. It keeps both of them polite.`});
  });
  // Asymmetries worth writing: both directions exist and disagree.
  const asymmetries = pairs.map(p => {
    const ab = p.edges.find(e => idx.get(e.from) === p.a), ba = p.edges.find(e => idx.get(e.from) === p.b);
    if (!ab || !ba) return null;
    const dt = ab.trust - ba.trust, dd = ab.dependence - ba.dependence;
    if (Math.abs(dt) < 2 && Math.abs(dd) < 2) return null;
    const bits = [];
    if (Math.abs(dt) >= 2) bits.push(`${name(dt > 0 ? p.a : p.b)} trusts far more than ${name(dt > 0 ? p.b : p.a)} does`);
    if (Math.abs(dd) >= 2) bits.push(`${name(dd > 0 ? p.a : p.b)} needs this more than ${name(dd > 0 ? p.b : p.a)} ever will`);
    return {pair: [p.a, p.b], line: bits.join("; ") + "."};
  }).filter(Boolean);
  return {nodes: ms.map((m, i) => ({i, id: m.id, name: name(i)})), pairs, triads, factions, secrets, asymmetries};
}
function relationshipWebSVG(web, size){
  const n = web.nodes.length, S = size || 320, R = S / 2 - 46, C = S / 2;
  if (n < 2) return "";
  const pos = web.nodes.map((_, i) => ({x: C + R * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / n), y: C + R * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / n)}));
  const colours = typeof CAST_COLORS !== "undefined" ? CAST_COLORS : ["var(--accent)"];
  const lines = web.pairs.map(p => {
    const a = pos[p.a], b = pos[p.b], w = (1 + p.trust * 0.7).toFixed(1);
    const oneWay = p.edges.length < 2;
    return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${p.sign > 0 ? "var(--emerald-deep)" : "var(--bubblegum)"}" stroke-width="${w}"${oneWay ? ` stroke-dasharray="5 4"` : ""} opacity=".85"><title>${escHTML(web.nodes[p.a].name)} — ${escHTML(web.nodes[p.b].name)}: ${p.sign > 0 ? "positive" : "hostile"}, mean trust ${p.trust.toFixed(1)}${oneWay ? " (one direction only)" : ""}</title></line>`;
  }).join("");
  const dots = web.nodes.map((nd, i) => {
    const p = pos[i], lx = p.x + (p.x >= C ? 12 : -12);
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="9" fill="${colours[i % colours.length]}" stroke="var(--panel)" stroke-width="2"></circle>` +
      `<text x="${lx.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="${p.x >= C ? "start" : "end"}" font-size="11" fill="var(--text)">${escHTML(String(nd.name).slice(0, 18))}</text>`;
  }).join("");
  return `<svg class="relWebSvg" viewBox="0 0 ${S} ${S}" role="img" aria-label="Relationship web: ${n} members, ${web.pairs.length} connections">${lines}${dots}</svg>`;
}
function relationshipWebHTML(members, edges){
  const web = relationshipWeb(members, edges);
  if (web.nodes.length < 2) return `<div class="sub">Add two or more cast members to see the web.</div>`;
  const list = (title, items) => items.length ? `<div class="relWebList"><b>${title}</b><ul>${items.map(x => `<li>${escHTML(x)}</li>`).join("")}</ul></div>` : "";
  return `<div class="relWeb">
    <div class="relWebChart">${web.pairs.length ? relationshipWebSVG(web, 320) : `<div class="sub">No edges yet — add some above, or use “Add both directions”. Factions below are guessed from shared Values.</div>`}
      <div class="sub">Green = positive, pink = hostile; thickness = trust; dashed = only one side has an edge.</div></div>
    <div class="relWebLists">
      ${list("Factions", web.factions.map(f => `${f.members.map(i => web.nodes[i].name).join(", ")} — ${f.label}${f.basis === "values" ? " (shared values, no edges yet)" : ""}`))}
      ${list("Triads", web.triads.map(t => t.line + (t.closed ? (t.balanced ? " [stable]" : " [unstable]") : "")))}
      ${list("Shared secrets", web.secrets.map(s => s.line))}
      ${list("Asymmetries", web.asymmetries.map(a => a.line))}
      ${!web.triads.length && !web.secrets.length && !web.asymmetries.length ? `<div class="sub">Triads appear once three members are linked; secrets once two people “know” something about the same third.</div>` : ""}
    </div></div>`.replace(/\n\s+/g, "\n");
}

// ================= 8. Pressure: escalation stages and a recovery sheet =================
const PRESSURE_STAGES = [
  {id:"irritated", label:"Irritated", level:0.35, blurb:"Still in control, and it shows at the edges."},
  {id:"cornered",  label:"Cornered",  level:0.7,  blurb:"The stress response has the wheel; the line they hold is being tested."},
  {id:"broken",    label:"Broken",    level:1,    blurb:"The defence has failed. What is left is the belief underneath."},
];
const _HUMOR_AT = {
  irritated: {"Warm & Playful":"the jokes keep coming, a beat too fast", "Dry & Deadpan":"the deadpan gets flatter and more pointed", "Cruel & Barbed":"the teasing starts to draw blood",
    "Self-Deprecating":"the self-mockery sharpens into something closer to a plea", "Absurd & Chaotic":"the bits get stranger and louder", "Intellectual & Wordplay":"the wordplay turns into point-scoring", "Humorless & Absent":"they go even more literal"},
  broken: {"Warm & Playful":"the humour is gone, which frightens the people who know them", "Dry & Deadpan":"one dry line survives, aimed at themselves", "Cruel & Barbed":"the barbs are the last thing to go, and aimed at whoever is closest",
    "Absurd & Chaotic":"they laugh at the wrong moment and cannot stop", "Self-Deprecating":"the jokes stop being jokes"},
};
const _BROKEN_BY_ATTACH = {"Secure":"they still reach for someone — it is the one thing that does not break", "Anxious":"they cling, and ask the same question until someone answers it the right way",
  "Avoidant":"they disappear — physically if they can, behind a wall if they cannot", "Disorganized":"they reach for someone and push them away in the same breath"};
/* A sheet-stable pick. The pressure ladder and the recovery sheet used to be one sentence
   frame per row, so 200 of 200 sheets opened six lines with the same six prefixes. Each
   row now has several phrasings; which one a sheet gets is a hash of the sheet (never the
   dice), so the same character reads the same every time it is rendered or exported. */
function _mxSheetHash(st){
  let h = 7; Object.keys(st || {}).sort().forEach(k => { const x = st[k]; if (x && x.trait) h = (h * 31 + x.trait.id) >>> 0; });
  return h;
}
function _mxVar(st, salt, frames, vars){
  const f = frames[_mxHash(_mxSheetHash(st) + "|" + salt) % frames.length];
  return f.replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] !== undefined ? vars[k] : m);
}
const _BROKEN_BY_ATTACH_ALT = {"Secure":"whoever is nearest hears about it, plainly, and that is what steadies them",
  "Anxious":"they need to be told, more than once, that nobody is leaving",
  "Avoidant":"the door closes and the answers get shorter until they stop",
  "Disorganized":"they say two opposite things in a row and mean both"};
function pressureEscalation(st, pst, meta){
  const g = (id, re) => _mxT(st, id, re);
  const manners = Object.keys(st || {}).filter(k => k.startsWith("manner") && st[k] && st[k].trait).map(k => st[k].trait);
  const pManners = Object.keys(pst || {}).filter(k => k.startsWith("p_manner") && pst[k] && pst[k].trait).map(k => pst[k].trait);
  const stress = g("stress"), values = g("values"), humor = g("humor"), attach = g("attachment"), vices = g("vices");
  const lie = g("motivation", /The Lie/i), defence = g("motivation", /The Defence/i), fear = g("motivation", /Core Fear/i);
  const TH = typeof THRESHOLD_BY_VALUES !== "undefined" ? THRESHOLD_BY_VALUES : {}, SS = typeof STRATEGY_BY_STRESS !== "undefined" ? STRATEGY_BY_STRESS : {};
  const SST = typeof STRATEGY_BY_STRESS_THEY !== "undefined" ? STRATEGY_BY_STRESS_THEY : {};
  const shifted = Object.values(pst || {}).filter(s => s && s.shifted);
  const sig = (text, from) => ({text, from: (from || []).filter(Boolean).map(t => t.trait)});
  const V = (salt, frames, vars) => _mxVar(st, salt, frames, vars);
  const stages = PRESSURE_STAGES.map(sg => ({id: sg.id, label: sg.label, level: sg.level, blurb: sg.blurb, signs: []}));
  const [irr, cor, brk] = stages;
  const dsc = t => t && t.desc ? ` — ${_mxLc(t.desc)}` : "";
  if (manners[0]) irr.signs.push(sig(V("tell", ["The first tell: {m}{d}.", "It starts small: {m}{d}.", "Early on the body gives it away — {m}{d}.", "You see it start here: {m}{d}."],
    {m: _mxLc(manners[0].trait), d: dsc(manners[0])}), [manners[0]]));
  if (humor && _HUMOR_AT.irritated[humor.category]) irr.signs.push(sig(V("humI", ["Humour under strain: {h}.", "What happens to the humour: {h}.", "Their jokes change: {h}.", "As for the jokes: {h}."],
    {h: _HUMOR_AT.irritated[humor.category]}), [humor]));
  if (fear) irr.signs.push(sig(V("fear", ["What they are already scanning for: {f}.", "Half their attention is already on this: {f}.", "The alarm underneath, quietly: {f}.", "They are watching for {f}, and it shows."],
    {f: _mxLc(fear.trait)}), [fear]));
  if (stress) cor.signs.push(sig(V("stress", ["{t}: {ss}.", "Their stress response is {t} — under this much pressure they {they}.", "Now the stress response drives: they {they}.", "Cornered, they {they} ({t})."],
    {t: stress.trait, ss: SS[stress.category] || _mxLc(stress.desc), they: SST[stress.category] || _mxLc(stress.desc)}), [stress]));
  if (values) cor.signs.push(sig(V("values", ["The line they hold is {q} — and it tips {th}.", "They are holding a line, {q}, and it gives {th}.", "What they will not drop is {q}; it tips {th}.", "{q} is the line, and it tips {th}."],
    {q: _mxQ(values.trait), th: TH[values.category] || "when it finally costs too much"}), [values]));
  if (defence) cor.signs.push(sig(V("defence", ["They reach for the defence: {d}.", "The defence comes up: {d}.", "Their usual armour: {d}.", "Everything gets routed through this: {d}."],
    {d: _mxLc(defence.trait)}), [defence]));
  if (pManners[0]) cor.signs.push(sig(V("body", ["The body joins in: {b}.", "Physically: {b}.", "It reaches their body: {b}.", "Their body gives them away: {b}."],
    {b: _mxLc(pManners[0].trait)}), [pManners[0]]));
  if (lie) brk.signs.push(sig(V("lie", ["The defence fails and the belief speaks for them: {q}.", "What is left when the defence goes is the belief: {q}.", "The belief takes the floor: {q}.", "The mask slips, and what they say is {q}."],
    {q: _mxQ(lie.trait)}), [lie]));
  if (attach && _BROKEN_BY_ATTACH[attach.category]) brk.signs.push(sig(V("attach", ["With people: {x}.", "Toward the people close by: {x}.", "In company: {x}.", "What the people near them see: {y}."],
    {x: _BROKEN_BY_ATTACH[attach.category], y: _BROKEN_BY_ATTACH_ALT[attach.category] || _BROKEN_BY_ATTACH[attach.category]}), [attach]));
  if (vices) brk.signs.push(sig(V("vice", ["What they reach for: {v}.", "The old comfort comes out: {v}.", "The crutch: {v}.", "They fall back on it: {v}."],
    {v: _mxLc(vices.trait)}), [vices]));
  if (humor && _HUMOR_AT.broken[humor.category]) brk.signs.push(sig(V("humB", ["Humour: {h}.", "The humour goes: {h}."], {h: _HUMOR_AT.broken[humor.category]}), [humor]));
  shifted.slice(0, 2).forEach(s => brk.signs.push(sig(`Where they stand moves: ${s.fromCat} → ${s.toCat}.`, [s.trait])));
  /* The inner conflict: what wins day to day, what takes the wheel when cornered, and
     what the losing drive does meanwhile. */
  const ic = typeof innerConflict === "function" ? innerConflict(st, meta) : null;
  if (ic){
    const w = ic.winner, l = ic.loser, q = t => _mxQ(t.trait);
    cor.signs.push(sig(ic.flips
      ? V("icC", ["The inner conflict tips: {wr} {w} takes over {when}.", "Now {wr} {w} drives, {when}; {lr} {l} has been pushing at it all along.", "{when}, {wr} {w} wins — the reverse of how it goes on a good day."],
          {wr: w.role.toLowerCase(), w: q(w.trait), lr: l.role.toLowerCase(), l: q(l.trait), when: ic.when})
      : V("icC", ["The inner conflict holds: {wr} {w} still wins {when}, and it costs them.", "They keep to {wr} {w} {when}, though {lr} {l} is pulling the other way.", "{wr} {w} holds {when}. Something else pays for it."],
          {wr: w.role.toLowerCase(), w: q(w.trait), lr: l.role.toLowerCase(), l: q(l.trait), when: ic.when}), [ic.winner.trait, ic.loser.trait]));
    brk.signs.push(sig(V("icB", ["What leaks: {lr} {l}.", "The losing drive speaks for them: {lr} {l}.", "Under everything, {lr} {l} is what comes out."],
      {lr: l.role.toLowerCase(), l: q(l.trait)}), [ic.loser.trait]));
  }
  /* Not every ladder has three rungs. A freezer can go from strained straight to shut
     down, with no cornered stage between: the stress response IS the break. */
  if (stress && /Freeze/.test(stress.category) && cor.signs.length && brk.signs.length && _mxSheetHash(st) % 2 === 0){
    brk.label = "Shut down";
    brk.blurb = "There is no cornered stage. They go from strained to shut down, and the defence and the belief arrive together.";
    brk.signs = cor.signs.concat(brk.signs); cor.signs = [];
  }
  const level = pst && pst.__pressure ? pst.__pressure.level : 1;
  const live = stages.filter(s => s.signs.length);
  let current = level < 0.5 ? "irritated" : level < 0.85 ? "cornered" : "broken";
  if (live.length && !live.some(s => s.id === current)){
    const order = ["irritated", "cornered", "broken"];
    const later = live.find(s => order.indexOf(s.id) > order.indexOf(current));
    current = (later || live[live.length - 1]).id;
  }
  return {level, current, stages: live};
}
/* The recovery sheet's first two rows depend on the pair, not on either half: a Fight +
   Anxious character and a Fight + Avoidant character recover in different ways, so the
   text is a 4 x 4 table (stress x attachment) rather than two independent lookups. */
const _RECOVER_FIRST = {"Fight (attack the threat)":"They need to move — a walk, a job with their hands. Do not follow them outside.",
  "Flight (remove yourself)":"Gone for a while. They come back on their own clock, and pretend they were never away.",
  "Freeze (shut down)":"Slow to restart. Speak first; they will answer later, sometimes days later.",
  "Fawn (appease the threat)":"They tidy, apologise and check everyone else is all right before they notice their own state."};
const _RECOVER_WHO = {"Secure":"to the person it happened with, to talk it through", "Anxious":"to whoever answers first, and then to the next one",
  "Avoidant":"to nobody — to a task, a drive, a locked door", "Disorganized":"to someone, and then away from them before it helps"};
const _RECOVER_CELL = {
  "Fight (attack the threat)": {
    "Secure": {first:"They need to move — a walk, a job with their hands — and they say where they are going, so no one has to worry.",
      who:"to the person it happened with, once they have walked it off, to talk it through"},
    "Anxious": {first:"They need to move, and they keep checking their phone: the anger goes out through their feet while the fear that they have ruined it comes in.",
      who:"to whoever will tell them they were right, and then, quietly, to whoever will tell them it is all right"},
    "Avoidant": {first:"They go out of reach — a walk, a garage, a run — and do not answer until it has cooled. Do not follow them.",
      who:"to nobody — to a task, a drive, a locked door"},
    "Disorganized": {first:"They storm off and start back three times. They may return angrier or apologising, and not know which until they are through the door.",
      who:"to a friend, to be told they were right, and then straight to the person they fought with, to take it back"}},
  "Flight (remove yourself)": {
    "Secure": {first:"Gone for an hour or two, and they tell you they are going. They come back on their own clock and say so plainly.",
      who:"to someone they trust, by phone if not in person, once they are steady"},
    "Anxious": {first:"Gone, but not far and not for long: they are already composing the message that will smooth it over.",
      who:"to the first person who answers, and then to the next, to check they have not been abandoned"},
    "Avoidant": {first:"Gone for a good while — a day, sometimes more. They come back as if they were never away, and the subject is closed.",
      who:"to nobody; a task, a drive, a locked door do the work a person would"},
    "Disorganized": {first:"Gone, then back, then gone. Nobody, including them, can predict which state arrives.",
      who:"to someone, and then away from them before it helps"}},
  "Freeze (shut down)": {
    "Secure": {first:"Slow to restart, but they say so: “I need a minute.” Speak first; they answer when they can, usually within the day.",
      who:"to one person, in few words — “I froze. Can I sit here?”"},
    "Anxious": {first:"Slow to restart, and afraid the silence is being read as rejection. A short, warm message helps more than a question.",
      who:"to whoever answers first, in a run of messages, and then to the next"},
    "Avoidant": {first:"A shutdown that can last days. They are fine, they say. Speak first, once, lightly, and then leave it.",
      who:"to a screen, a book, a long bath — and to a person only once the person has stopped asking"},
    "Disorganized": {first:"They go still, then flood: a long quiet, then too much at once. Let the first wave go past before answering it.",
      who:"toward someone and then away, twice, before they manage to stay"}},
  "Fawn (appease the threat)": {
    "Secure": {first:"They tidy, apologise and check everyone else is all right — and, in time, remember to say what they needed too.",
      who:"to a friend who needs nothing from them, to be looked after for once"},
    "Anxious": {first:"They apologise repeatedly and keep checking they are forgiven. Reassure once, clearly; more only feeds the loop.",
      who:"to whoever seems most likely to forgive them — and they need it said out loud"},
    "Avoidant": {first:"They smooth it over and vanish into being useful. The apology arrives as a favour, never as a conversation.",
      who:"to their work, and to people who need something done, where nobody asks how they are"},
    "Disorganized": {first:"They over-give, then resent it, then apologise for the resentment. It takes a day to settle into one feeling.",
      who:"to the person they wronged and away from them again, unsure which of them owes the apology"}},
};
/* Relationships feed pressure (audit §6a): when the sheet belongs to a cast member, "who they
   go to" names the person they trust most, and the person who makes it worse is named too. */
function recoveryCastContext(st){
  if (typeof castStates === "undefined" || typeof relationshipEdges === "undefined") return null;
  const me = castStates.find(c => c && c.state === st);
  return me ? {selfId: me.id, members: castStates, edges: relationshipEdges} : null;
}
function _castNames(ctx){
  if (!ctx) return {};
  const name = id => { const m = ctx.members.find(c => c.id === id); return m && m.meta && m.meta.name ? m.meta.name : null; };
  const mine = ctx.edges.filter(e => e.from === ctx.selfId && name(e.to));
  const near = mine.filter(e => e.role !== "antagonist" && e.role !== "rival").sort((a, b) => (b.trust || 0) - (a.trust || 0))[0];
  const bad = mine.filter(e => e.role === "antagonist" || e.role === "rival" || (e.trust || 3) <= 1).sort((a, b) => (a.trust || 3) - (b.trust || 3))[0];
  return {goTo: near && (near.trust || 3) >= 3 ? name(near.to) : null, makesWorse: bad ? name(bad.to) : null};
}
function recoverySheet(st, ctx){
  const g = (id, re) => _mxT(st, id, re);
  const stress = g("stress"), attach = g("attachment"), need = g("motivation", /The Need/i), lie = g("motivation", /The Lie/i);
  const repair = g("repair"), texture = g("texture"), vices = g("vices"), values = g("values"), origin = g("origins");
  const rows = [];
  const V = (salt, frames, vars) => _mxVar(st, salt, frames, vars);
  const d = t => t && t.desc ? ` — ${_mxLc(t.desc)}` : "";
  const row = (key, title, text, from) => { if (text) rows.push({key, title, text, from: (from || []).filter(Boolean).map(t => t.trait)}); };
  const cell = stress && attach && _RECOVER_CELL[stress.category] ? _RECOVER_CELL[stress.category][attach.category] : null;
  const lensDying = typeof activeLensIds === "function" && activeLensIds().includes("dying");
  const firstText = cell ? cell.first : stress ? _RECOVER_FIRST[stress.category] : null;
  row("first", "First hours", firstText && lensDying ? "There is less time to waste on it than there used to be. " + firstText : firstText, [stress, attach]);
  const who = cell ? cell.who : (attach ? _RECOVER_WHO[attach.category] : null);
  const cn = _castNames(ctx);
  row("who", "Who they go to", who ? `They go ${who}.${cn.goTo ? ` In this cast, that is ${cn.goTo}.` : ``}` : null, [attach, stress]);
  row("helps", "What actually helps", need ? V("helps", ["{n}{d}.", "The one thing that works: {n}{d}.", "What actually gets through: {n}{d}."], {n: _mxUnrun(need.trait), d: d(need)}) : null, [need]);
  row("ground", "What grounds them", texture ? V("ground", ["Back to {t}{d}.", "What steadies them: {t}{d}.", "Home base: {t}{d}."], {t: _mxLc(texture.trait), d: d(texture)})
    : origin ? V("groundO", ["The memory of {o}.", "What they lean on: the memory of {o}."], {o: _mxLc(origin.trait)}) : null, [texture || origin]);
  row("hurts", "What does not help", vices ? V("hurts", ["{v} — it feels like recovery and is not.", "{v} — it looks like coping and is not.", "The trap: {v}. It feels like relief and is not."], {v: _mxUnrun(vices.trait)})
    : values && values.category === "Rigid & Principled" ? V("hurtsR", ["Being told it was not their fault; they will argue.", "Being told to let it go; they will dig in."]) : null, [vices || values]);
  if (cn.makesWorse) row("worse", "Who makes it worse", V("worse", ["Being around {n}. Every old thing comes back at once.", "{n} in the room, whatever {n} says.", "{n}. The history makes it worse."], {n: cn.makesWorse}), []);
  row("repair", "How they repair it", repair ? V("repair", ["{r}{d}.", "The repair they make: {r}{d}."], {r: _mxUnrun(repair.trait), d: d(repair)}) : null, [repair]);
  row("scar", "The story they tell afterwards", lie ? V("scar", ["That it proves {q} — unless someone gets to them first.", "The version that sticks: it proves {q}. Someone has to get to them before that hardens.", "They will file it under {q}, unless someone offers a better story first."], {q: _mxQ(lie.trait)}) : null, [lie]);
  const summary = typeof pressureRecovery === "function" ? pressureRecovery(st) : null;
  return rows.length ? {summary, rows} : null;
}
function pressureEscalationHTML(st, pst, meta){
  const esc = pressureEscalation(st, pst, meta), rec = recoverySheet(st, recoveryCastContext(st));
  let h = "";
  if (esc.stages.length){
    h += `<div class="pressureStages" aria-label="Escalation stages">` + esc.stages.map(sg =>
      `<div class="pStage${sg.id === esc.current ? " current" : ""}"><div class="pStageHead"><b>${escHTML(sg.label)}</b>${sg.id === esc.current ? ` <span class="pStageNow">the dial is here</span>` : ""}</div>` +
      `<div class="sub">${escHTML(sg.blurb)}</div><ul>${sg.signs.map(s => `<li>${escHTML(s.text)}</li>`).join("")}</ul></div>`).join("") + `</div>`;
  }
  if (rec){
    h += `<details class="recoverySheet"><summary><b>Recovery sheet</b> — the day after</summary><dl>` +
      rec.rows.map(r => `<dt>${escHTML(r.title)}</dt><dd>${escHTML(r.text)}</dd>`).join("") + `</dl></details>`;
  }
  return h;
}
function pressureEscalationMarkdown(st, pst, meta){
  const esc = pressureEscalation(st, pst, meta), rec = recoverySheet(st, recoveryCastContext(st)), L = [];
  esc.stages.forEach(sg => { L.push(`**${sg.label}**${sg.id === esc.current ? " (current)" : ""}`); sg.signs.forEach(s => L.push(`- ${s.text}`)); });
  if (rec){ L.push("", "**Recovery sheet**"); rec.rows.forEach(r => L.push(`- ${r.title}: ${r.text}`)); }
  return L.join("\n");
}

// ================= 9. Arcs: reading the event, meaningful steadfast, templates =================
const ARC_CUES = {
  growth: /\b(admit\w*|confess\w*|forg[ai]v\w*|apologi[sz]\w*|let (it |them |him |her )?go|ask\w* for help|trust\w*|told the truth|tell\w* the truth|reach\w* out|accept\w*|open\w* up|chose (them|her|him|love)|gave (it )?back|asked)\b/i,
  deterioration: /\b(lie|lied|lies|hid|hide|hides|hiding|betray\w*|ran|flee\w*|fled|abandon\w*|took it|stole|steal\w*|cover\w* (it )?up|blam\w*|revenge|lash\w* out|shut \w+ out|walked away|burn\w*|drank|drink\w*|cheat\w*|kill\w*|sold)\b/i,
  steadfast: /\b(refus\w*|held (the line|firm|out)|kept (their|his|her|my) word|stood (firm|by|still)|would not|wouldn't|did not (break|bend|give)|stayed (true|put)|no matter|wouldn't bend)\b/i,
};
/* Read the event's three text fields against the sheet: which of Lie / Want / Need /
   Defence / Values / Fear it touches, by shared content words, and which shape the
   choice's own verbs imply. Pure and deterministic. */
function parseArcEvent(st, event){
  const e = event || {};
  const targets = [
    ["lie", "motivation", /The Lie/i], ["want", "motivation", /Core Want/i], ["need", "motivation", /The Need/i],
    ["defence", "motivation", /The Defence/i], ["fear", "motivation", /Core Fear/i], ["values", "values", null], ["price", "goals", /Price/i],
  ].map(([key, sec, re]) => { const slotId = _mxSlot(st, sec, re); const t = slotId ? st[slotId].trait : null;
    return t ? {key, slotId, trait: t, words: mxTokens(`${t.trait} ${t.desc || ""} ${key === "values" ? t.category : ""}`)} : null; }).filter(Boolean);
  const fields = {belief: e.beliefChallenged || "", choice: e.choice || "", cost: e.cost || ""};
  const hits = [];
  Object.entries(fields).forEach(([field, text]) => {
    if (!text) return;
    const w = mxTokens(text);
    targets.forEach(tg => { const ov = mxOverlap(w, tg.words); if (ov.length) hits.push({field, target: tg.key, slotId: tg.slotId, trait: tg.trait, words: ov}); });
  });
  const cues = {};
  Object.entries(ARC_CUES).forEach(([shape, re]) => { const m = `${fields.choice} ${fields.cost}`.match(new RegExp(re.source, "gi")); if (m) cues[shape] = m.length; });
  const implied = Object.keys(cues).sort((a, b) => cues[b] - cues[a])[0] || null;
  return {hits, cues, implied, targets: targets.map(t => t.key)};
}
function _mxShift(t, delta){
  if (!t || typeof byFilter !== "function") return null;
  const pool = byFilter(t.section, t.category).filter(x => x.id !== t.id);
  const want = clamp((t.intensity || 3) + delta, 1, 5);
  /* Any trait one step louder or quieter used to do, so a Want of "a quiet partnership"
     could shift to "mild preference" and the arc read "they choose an ordinary week over
     mild preference". Stay with the same idea: the same concept family first, then the
     closest wording, and only then anything at that intensity. */
  const near = pool.filter(x => Math.abs((x.intensity || 3) - want) <= (delta ? 0 : 1));
  const cands = near.length ? near : pool;
  if (!cands.length) return null;
  // Category boilerplate ("Wants…", "Fear of…") is shared by the whole pool, so it
  // says nothing about closeness; the name carries the idea and counts triple.
  const boiler = new Set(["want","wants","fear","need","core","being","thing"].map(w => _mxStem(w)));
  const toks = x => new Set([...mxTokens(x)].filter(w => !boiler.has(w)));
  const nameW = toks(t.trait), descW = toks(`${t.trait} ${t.desc || ""}`);
  const score = x => (t.conceptFamily && x.conceptFamily === t.conceptFamily ? 10 : 0)
    + 3 * mxOverlap(nameW, toks(x.trait)).length
    + mxOverlap(descW, toks(`${x.trait} ${x.desc || ""}`)).length
    + ((x.intensity || 3) === want ? 0.5 : 0);
  const scored = cands.map(x => ({x, s: score(x)}));
  const top = Math.max(...scored.map(o => o.s));
  if (top <= 0.5) return near.length ? near[Math.floor(rand() * near.length)] : pickInRange(pool, "balanced", want, 3);
  const best = scored.filter(o => o.s === top).map(o => o.x);
  return best[Math.floor(rand() * best.length)];
}
/* Changes that come from the TEXT of the event, appended after the shape's own. */
function arcTextChanges(st, event, shape, existing){
  const out = [];
  const taken = new Set((existing || []).map(c => c.slotId));
  const push = (slotId, trait, why) => {
    const cur = st[slotId] && st[slotId].trait;
    if (!slotId || !trait || !cur || trait.id === cur.id || taken.has(slotId)) return;
    taken.add(slotId);
    out.push({slotId, fromId: cur.id, toId: trait.id, why, accepted: false, fromText: true});
  };
  const p = parseArcEvent(st, event);
  const hit = key => p.hits.find(h => h.target === key);
  withRng(mulberry32(hashSeedString(event.id + "|" + event.shape + "|text")), ()=>{
    if (shape.id === "steadfast"){
      /* STEADFAST now does something: the line they held becomes load-bearing (Values
         deepen one step), and a cost that names something real becomes the Price they
         are paying — the best word-match in that category, or one step heavier. */
      const vs = _mxSlot(st, "values");
      if (vs) push(vs, _mxShift(st[vs].trait, +1), `they held the line and paid for it: "${st[vs].trait.trait}" is load-bearing now`);
      const ps = _mxSlot(st, "goals", /Price/i);
      if (ps && (event.cost || "").trim()){
        const cw = mxTokens(event.cost), cur = st[ps].trait;
        const best = byFilter(cur.section, cur.category).filter(t => t.id !== cur.id)
          .map(t => ({t, n: mxOverlap(cw, `${t.trait} ${t.desc || ""}`).length})).filter(x => x.n > 0)
          .sort((a, b) => b.n - a.n || a.t.id - b.t.id)[0];
        push(ps, best ? best.t : _mxShift(cur, +1), best ? `the cost named here ("${_mxLc(event.cost).slice(0, 60)}") becomes the price they are paying` : `the price of staying the same just went up`);
      }
      return;
    }
    const dir = shape.dir || 0;
    if (!dir) return;
    const w = hit("want");
    if (w) push(w.slotId, _mxShift(w.trait, -dir), dir > 0 ? `the event was about ${_mxQ(w.trait.trait)} (${w.words.join(", ")}) — the want loosens` : `the event was about ${_mxQ(w.trait.trait)} (${w.words.join(", ")}) — the want tightens its grip`);
    const v = hit("values");
    if (v){
      const opp = typeof OPPOSED_CATEGORIES !== "undefined" && OPPOSED_CATEGORIES.values ? OPPOSED_CATEGORIES.values[v.trait.category] : null;
      if (dir < 0 && opp) push(v.slotId, pickInRange(byFilter(v.trait.section, opp), "balanced", v.trait.intensity || 3, 3), `they crossed their own line (${_mxQ(v.trait.trait)}) and it moved: ${v.trait.category} → ${opp}`);
      else push(v.slotId, _mxShift(v.trait, dir), dir > 0 ? `the line was tested and they chose it consciously` : `the line wore thinner`);
    }
    const n = hit("need");
    if (n && dir > 0){ const d = _mxSlot(st, "motivation", /The Defence/i); if (d) push(d, _mxShift(st[d].trait, -1), `they touched the need (${_mxQ(n.trait.trait)}) — the defence has less to do`); }
    const l = hit("lie");
    if (l && dir < 0) push(l.slotId, _mxShift(l.trait, +1), `the event confirmed the lie (${_mxQ(l.trait.trait)}) — it grips harder`);
  });
  return out;
}
function arcReadingLine(st, event){
  const p = parseArcEvent(st, event);
  if (!p.hits.length && !p.implied) return "";
  const NAMES = {lie:"the Lie", want:"the Want", need:"the Need", defence:"the Defence", fear:"the Fear", values:"their Values", price:"the Price"};
  const seen = new Set(), bits = [];
  p.hits.forEach(h => { const k = h.field + h.target; if (seen.has(k)) return; seen.add(k); bits.push(`${h.field} touches ${NAMES[h.target]} (“${h.trait.trait}”)`); });
  const imp = p.implied && p.implied !== event.shape ? ` The choice reads like ${p.implied}, not ${event.shape}.` : "";
  return (bits.length ? `Read against the sheet: ${bits.slice(0, 3).join("; ")}.` : "") + imp;
}
const ARC_TEMPLATES = [
  {id:"fall-recovery", label:"Fall & recovery", blurb:"Two steps down, two back up.", steps:[
    {shape:"deterioration", title:"The first compromise", belief:"{lie}", choice:"They take the easy way and tell themselves it is only this once.", cost:"{price}"},
    {shape:"deterioration", title:"Rock bottom", belief:"{lie}", choice:"They double down, hide it, and shut out the person who noticed.", cost:"The people who knew them before, and the version of themselves that would have stopped."},
    {shape:"growth", title:"The turn", belief:"{lie}", choice:"They admit it out loud to someone who could use it against them.", cost:"The cover story, and the {want} it was protecting."},
    {shape:"growth", title:"The long way back", belief:"{lie}", choice:"They accept {need} and let someone see them take it.", cost:"Pride, time, and the right to be the one who was wronged."}]},
  {id:"corruption-3", label:"Corruption in three steps", blurb:"Justified, necessary, who they are now.", steps:[
    {shape:"deterioration", title:"Justified", belief:"{values}", choice:"They bend the line for a good reason, and it works.", cost:"Nothing yet, which is the problem."},
    {shape:"deterioration", title:"Necessary", belief:"{values}", choice:"They cross it again, and this time they hide it.", cost:"Someone who trusted them and does not know yet."},
    {shape:"deterioration", title:"Who they are now", belief:"{values}", choice:"They take {want} and stop pretending it was for anyone else.", cost:"The line itself — they no longer remember where it was."}]},
  {id:"positive-change", label:"Positive change", blurb:"The lie holds, cracks, and costs.", steps:[
    {shape:"growth", title:"The lie holds", belief:"{lie}", choice:"They chase {want} the old way and it half-works.", cost:"A small, clear warning they choose not to read."},
    {shape:"growth", title:"The lie cracks", belief:"{lie}", choice:"They ask for help instead of taking control.", cost:"Their picture of themselves as the one who never needs to."},
    {shape:"growth", title:"The truth costs", belief:"{lie}", choice:"They choose {need} over {want}.", cost:"{want}, for good."}]},
  {id:"flat", label:"Steadfast (flat arc)", blurb:"They do not change; the world around them does, and it costs.", steps:[
    {shape:"steadfast", title:"Tested", belief:"{values}", choice:"They refuse the easy offer.", cost:"{price}"},
    {shape:"steadfast", title:"Tempted", belief:"{values}", choice:"They hold the line when nobody would ever know.", cost:"The one thing they wanted most this year."},
    {shape:"steadfast", title:"Tested at full price", belief:"{values}", choice:"They would not bend, no matter who asked.", cost:"Their place among the people who did."}]},
  {id:"disillusion", label:"Disillusionment", blurb:"They get what they wanted, and it is the wrong thing.", steps:[
    {shape:"growth", title:"Within reach", belief:"{lie}", choice:"They go all in on {want}.", cost:"Everything else they were carrying."},
    {shape:"deterioration", title:"Got it", belief:"{lie}", choice:"They take {want} and find it empty; they hide how empty.", cost:"The reason they had for getting up."},
    {shape:"cyclical", title:"Back where they started", belief:"{lie}", choice:"They fall back into the old pattern because it is at least familiar.", cost:"The year."}]},
];
function _fillArcText(s, st){
  const t = (id, re) => _mxT(st, id, re);
  const lie = t("motivation", /The Lie/i), want = t("motivation", /Core Want/i), need = t("motivation", /The Need/i);
  const values = t("values"), price = t("goals", /Price/i);
  return String(s)
    .replace(/\{lie\}/g, lie ? `${_mxQ(lie.trait)}` : "that they are on their own")
    .replace(/\{want\}/g, want ? _mxLc(want.trait) : "what they wanted")
    .replace(/\{need\}/g, need ? _mxLc(need.trait) : "what would actually help")
    .replace(/\{values\}/g, values ? `${_mxQ(values.trait)}` : "the line they said they would never cross")
    .replace(/\{price\}/g, price ? `${_mxUnrun(price.trait)}.` : "More than they admit.");
}
/* A template becomes ordinary events, each with its proposals computed against the
   sheet as the PREVIOUS steps' proposals would leave it — so the steps read as a
   progression — while every change still starts unaccepted, as the arc panel promises. */
function arcTemplateEvents(st, templateId, priorEvents){
  const tpl = ARC_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return [];
  const prior = (priorEvents || []).slice();
  let sim = st, seq = prior.length;
  const out = [];
  tpl.steps.forEach(step => {
    seq++;
    const ev = makeArcEvent(seq, {title: step.title, shape: step.shape, beliefChallenged: _fillArcText(step.belief, sim),
      choice: _fillArcText(step.choice, sim), cost: _fillArcText(step.cost, sim), template: tpl.id});
    ev.changes = proposeArcChanges(sim, ev, prior.concat(out));
    out.push(ev);
    sim = applyArcEvent(sim, {id: ev.id, changes: ev.changes.map(c => Object.assign({}, c, {accepted: true}))});
  });
  return out;
}

// ================= 10. The inner-conflict engine =================
/* The contradiction panel finds ONE tension, between two behaviours on one axis. That is
   not where two characters with the same categories actually differ. They differ on which
   of their own drives wins, and when. This finds a second tension between the drives —
   what they want and what they need, the line they hold and what they want, the role they
   play and what they fear, the defence and what it covers — and states a rule: which side
   wins day to day, which wins under load, what tips it, and what the losing side does
   meanwhile (it leaks). The pressure ladder and the voice lab both use the rule, so the
   losing drive shows up in the line at the Cornered stage instead of nowhere.

   Pure function of the sheet (a hash of it, never the dice); `meta.conflictFlip` lets the
   author swap which side wins under pressure. */
const INNER_CONFLICT_TYPES = {
  "want-need":    {label: "Want vs Need",     roles: ["Want", "Need"],
    question: "They chase the want; the need is what would actually help. Which one do they act on, and what does the other one look like from outside?"},
  "values-want":  {label: "Values vs Want",   roles: ["The line they hold", "Want"],
    question: "The line and the want cannot both be honoured. When they choose, which goes, and who sees the cost?"},
  "fear-role":    {label: "Role vs Fear",     roles: ["The role they play", "Fear"],
    question: "They play the role in every room. What happens to the role when the fear is in the room too?"},
  "defence-need": {label: "Defence vs Need",  roles: ["The defence", "Need"],
    question: "The defence exists to keep the need from being seen. What is the first moment it fails, and who is there?"},
};
const _IC_TRIGGER = {
  "Fight (attack the threat)": "when someone pushes back",
  "Flight (remove yourself)": "when there is a door and it is open",
  "Freeze (shut down)": "when there is too much at once",
  "Fawn (appease the threat)": "when someone is displeased with them",
};
function _icOpposition(x, y){
  if (!x || !y || !x.pol || !y.pol) return 0;
  let n = 0;
  Object.keys(x.pol).forEach(a => { const p = x.pol[a], q = y.pol[a]; if (p && q && p !== q) n++; });
  return Math.min(n, 2);
}
function innerConflict(st, meta){
  const g = (id, re) => _mxT(st, id, re);
  const want = g("motivation", /Core Want/i), need = g("motivation", /The Need/i), fear = g("motivation", /Core Fear/i);
  const defence = g("motivation", /The Defence/i), values = g("values"), role = g("role");
  const stress = g("stress"), attach = g("attachment");
  const cands = [];
  if (want && need) cands.push({type: "want-need", w: 3, a: want, b: need});
  if (values && want) cands.push({type: "values-want", w: 2 + _icOpposition(values, want), a: values, b: want});
  if (role && fear) cands.push({type: "fear-role", w: 2 + _icOpposition(role, fear), a: role, b: fear});
  if (defence && need) cands.push({type: "defence-need", w: 2, a: defence, b: need});
  if (!cands.length) return null;
  const h = _mxHash(_mxSheetHash(st) + "|ic");
  let r = h % cands.reduce((n, c) => n + c.w, 0), pick = cands[0];
  for (const c of cands){ if (r < c.w){ pick = c; break; } r -= c.w; }
  const T = INNER_CONFLICT_TYPES[pick.type];
  // Which side takes the wheel under load. A side "wins" by driving what they do; the
  // other one loses and leaks into what they say.
  const sc = stress ? stress.category : "", parity = (h >> 3) % 2 === 0 ? "a" : "b";
  let pressure;
  if (pick.type === "want-need" || pick.type === "defence-need")
    pressure = /Freeze|Fawn/.test(sc) ? "b" : /Fight|Flight/.test(sc) ? "a" : parity;
  else if (pick.type === "values-want")
    pressure = /Rigid|Loyalty|Idealistic/.test(pick.a.category) ? "a" : "b";
  else
    pressure = attach ? (attach.category === "Secure" ? "a" : "b") : parity;
  const flipped = !!(meta && meta.conflictFlip);
  if (flipped) pressure = pressure === "a" ? "b" : "a";
  const TH = typeof THRESHOLD_BY_VALUES !== "undefined" ? THRESHOLD_BY_VALUES : {};
  const when = pick.type === "values-want" && TH[pick.a.category] ? TH[pick.a.category]
    : (_IC_TRIGGER[sc] || "when it costs enough");
  const side = k => ({trait: pick[k], role: T.roles[k === "a" ? 0 : 1], key: k});
  const A = side("a"), B = side("b");
  const calmW = A, pressW = pressure === "a" ? A : B, loser = pressure === "a" ? B : A;
  const flips = pressure !== "a";
  const q = t => _mxQ(t.trait);
  const summary = `${A.role} ${q(A.trait)} against ${B.role.toLowerCase()} ${q(B.trait)}. Day to day, ${A.role.toLowerCase()} ${q(A.trait)} wins. `
    + (flips
      ? `Under load ${pressW.role.toLowerCase()} ${q(pressW.trait)} takes over, ${when}; the other one has been leaking all along.`
      : `Under load it holds, ${when} — and ${loser.role.toLowerCase()} ${q(loser.trait)} leaks out around it instead.`);
  return {type: pick.type, label: T.label, question: T.question, a: A, b: B, calm: "a", pressure, flips, flipped,
    winner: pressW, loser, when, summary, from: [pick.a, pick.b]};
}
const _ic = t => (typeof _spoken === "function" ? _spoken(t) : null) || _mxQ(t.trait);
// The same phrase where a noun goes: "to be unnecessary" -> "being unnecessary",
// "to matter to someone" -> "trying to matter to someone" ("done with to be unnecessary" reads as a typo).
const _icNoun = t => { const s = _ic(t); return /^to be /.test(s) ? "being " + s.slice(6) : /^to /.test(s) ? "trying " + s : s; };
const _IC_LEAK = {
  "want-need": {
    b: ["What I actually need is {b}.", "I keep saying {an}. It isn't that. It's {b}.", "Never mind {an}. I need {b}."],
    a: ["And I still want {a}. God, I still want it.", "I said I was done with {an}. I'm not."]},
  "values-want": {
    b: ["I want {b}. That's the whole trouble. I want it and I won't.", "You think I don't want {b}? I do."],
    a: ["I know, I know — {aq}. Not tonight.", "I know what I said about {aq}. Forget I said it."]},
  "fear-role": {
    b: ["I'm not afraid. It's just {b}, that's all.", "Don't make it about {b}. It isn't."],
    a: ["I can't be the {role} right now.", "Someone else be the {role}. Please."]},
  "defence-need": {
    b: ["What I need is — no, forget it. I need {b}.", "I keep saying it's fine. It isn't. I need {b}."],
    a: ["{aq} — that's what I do. I can't do it right now.", "I'm dropping the act. {aq}. It was always the act."]},
};
/* The line the losing side speaks. The shortest frame goes to a character who says
   almost nothing. Returns null when the sheet has no conflict. */
function innerConflictLeak(st, rng, opts){
  opts = opts || {};
  const ic = innerConflict(st, opts.meta);
  if (!ic) return null;
  const frames = _IC_LEAK[ic.type][ic.loser.key];
  const f = opts.short ? frames.slice().sort((x, y) => x.length - y.length)[0] : frames[Math.floor(rng() * frames.length)];
  const roleWord = ic.type === "fear-role" ? String(ic.a.trait.category || "one").toLowerCase().replace(/[^a-z ]/g, "").trim() || "one" : "";
  const text = f.replace("{an}", _icNoun(ic.a.trait)).replace("{a}", _ic(ic.a.trait)).replace("{b}", _ic(ic.b.trait)).replace("{aq}", _mxQ(ic.a.trait.trait)).replace("{role}", roleWord);
  return {text: text.charAt(0).toUpperCase() + text.slice(1),
    rule: `inner conflict: ${ic.label} — ${ic.loser.role.toLowerCase()} “${ic.loser.trait.trait}” leaks out under load`};
}
