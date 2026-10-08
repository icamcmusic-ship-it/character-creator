# Trait-bank audit, 2026-10-05 (read-only; repo HEAD bc9be10)

Scope: 9,868 traits, 29 sections, 202 categories in `js/data/*.js`, loaded through `tests/harness.js` `loadEngine()`. All scripts and raw outputs sit next to this file in `scratchpad/bank/`. Script names are given per section. CLAUDE.md scope rules respected: nothing below proposes a name generator or any appearance content.

Note on the count: the brief says ~9,700; the live bank is **9,868** (`a1_inventory.js`, `bank-report.txt`).

---
## 1. Inventory (`a1_inventory.js`, `a1b_shape.js`, `a9_tables.js`, `tables.md`, `a1_out.txt`)

- 29 sections, 202 categories. Category size min 14, max 127, median 54, mean 48.9, max/min ratio 9.1.
- Categories under 15: **7** (all Conflict Style, 14 each). Under 20: **63**. Under 25: **80**. Under 30: 83.
- Size histogram: 0-14: 7, 15-24: 73, 25-39: 3, 40-59: 46, 60-79: 38, 80-99: 19, 100-149: 16. The bank is bimodal: 80 categories of 14-24 (the later "section packs") against 119 of 40+ (the original core). Nothing sits between 25 and 39 except 3 categories.
- Largest categories: Verbosity > High-Volume & Wordy 127; Verbosity > Pacing & Situation-Driven 125; Verbosity > Stylized & Elaborate 123; Verbosity > Minimal & Ultra-Brief 122; Goals > Immediate Objective 120; Goals > Price & Competing Claim 115; Vocabulary > Register & Formality 115; Grammar > Anchors & Fillers 113.
- Smallest: seven Conflict Style categories (14 each: Stonewalling & Withdrawal, Passive-Aggressive, Litigator, Peacekeeper & Smoother, Escalate then Apologise, Sulker & Silent Treatment, Triangulator); then 15-each in Romance (Flirting Style, Pining Tells), Dialect (Dated Slang, Youth Register, Era References, Tech Vintage), Conversation Mechanics (Scripted Speech, Sensory Load, Masking), Body in Speech > Breath & Stamina, Humor (Gallows, Physical & Slapstick, Teasing as Affection, Laughs at Own Jokes, Doesn't Get Jokes).
- Humor Style is the only section with a huge spread: 15 categories, min 15, max 66, median 16. Twelve of its categories hold 15-16 traits each next to a 66-trait main one.

### Section share of bank vs share of the default sheet
Default sheet = 40 slots (45 with the "shape" layer on; mean 44.95). 1,000 default sheets drew 4,566 distinct traits (46.3% of the bank; 5,859 = 59.4% with shipped dials neutral, `a6b_out.txt`).

| Section | Traits | % bank | Default | Slots/sheet | % sheet | Sheet%/bank% |
|---|---:|---:|---|---:|---:|---:|
| Verbosity | 548 | 5.6 | on | 1.03 | 2.3 | 0.41 |
| Vocabulary | 949 | 9.6 | on | 3.16 | 7.0 | 0.73 |
| Dialogue Grammar | 592 | 6.0 | on | 1.09 | 2.4 | 0.40 |
| Mannerisms | 997 | 10.1 | on | 3.24 | 7.2 | 0.71 |
| Personality | 2398 | 24.3 | on | 13.80 | 30.7 | 1.26 |
| Motivation & Wound | 468 | 4.7 | on | 7.28 | 16.2 | **3.42** |
| Conflict & Stress | 214 | 2.2 | on | 1.19 | 2.6 | 1.22 |
| Social Role | 389 | 3.9 | on | 1.36 | 3.0 | 0.77 |
| Values & Moral Line | 324 | 3.3 | on | 1.32 | 2.9 | 0.89 |
| Attachment | 231 | 2.3 | on | 1.24 | 2.8 | 1.18 |
| Humor | 537 | 5.4 | on | 1.58 | 3.5 | 0.65 |
| Habits & Vices | 290 | 2.9 | on | 1.32 | 2.9 | 1.00 |
| Competence & Method | 256 | 2.6 | on | 1.14 | 2.5 | 0.98 |
| Positive Origins | 96 | 1.0 | on | 0.86 | 1.9 | 1.97 |
| Goals & Stakes | 347 | 3.5 | on | 3.00 | 6.7 | 1.90 |
| Contradiction Functions | 128 | 1.3 | on | 2.33 | 5.2 | **3.99** |
| Ordinary Texture | 88 | 0.9 | OFF | 0 | 0 | 0 |
| Recovery & Repair | 80 | 0.8 | OFF | 0 | 0 | 0 |
| Role by Context | 66 | 0.7 | OFF | 0 | 0 | 0 |
| Romance & Desire | 67 | 0.7 | OFF | 0 | 0 | 0 |
| Dialect & Linguistic Background | 142 | 1.4 | OFF | 0 | 0 | 0 |
| Beliefs & Worldview | 98 | 1.0 | OFF | 0 | 0 | 0 |
| Occupational Jargon | 112 | 1.1 | OFF | 0 | 0 | 0 |
| Conversation Mechanics | 93 | 0.9 | OFF | 0 | 0 | 0 |
| Body in Speech | 80 | 0.8 | OFF | 0 | 0 | 0 |
| Money & Class | 65 | 0.7 | OFF | 0 | 0 | 0 |
| Fears & Aversions | 51 | 0.5 | OFF | 0 | 0 | 0 |
| Family Talk | 64 | 0.6 | OFF | 0 | 0 | 0 |
| Conflict Style | 98 | 1.0 | OFF | 0 | 0 | 0 |

Findings:
- **13 of 29 sections (1,104 traits, 11.2% of the bank, 70 of 202 categories) are off by default** and are never drawn by any default sheet (0 of 89,928 default draws landed in them, wildcard slots included; `a6b_out.txt`).
- Over-represented: Contradiction Functions (4.0x), Motivation & Wound (3.4x: 7.3 slots from 468 traits), Positive Origins (2x), Goals (1.9x). Under-represented among on-sections: Dialogue Grammar and Verbosity (0.4x each: one slot each from 592 / 548 traits), Humor (0.65x), Mannerisms and Vocabulary (0.7x).
- Bank-per-slot is the real reach limiter: Verbosity has 548 traits for ~1 slot, Grammar 592 for 1, Humor 537 for 1.6.

---
## 2. Rarity x intensity (`a1_inventory.js`, `a2b_cells.js`, `bank-report.txt`)

Whole-bank grid (rows = rarity, columns = intensity 1..5):

| | i1 | i2 | i3 | i4 | i5 | total |
|---|---:|---:|---:|---:|---:|---:|
| common | 624 | 1200 | 381 | 312 | 66 | 2583 |
| uncommon | 189 | 1241 | 949 | 190 | 38 | 2607 |
| distinctive | 96 | 302 | 2532 | 133 | 18 | 3081 |
| signature | 111 | 221 | 93 | 716 | 456 | 1597 |

- **Cramér's V = 0.4891** overall (the milestone targets in the repo are 0.60 then 0.55, so this is already below both: it has improved). Per-section V runs from 0.12 (Ordinary Texture) to 0.82 (Conflict Style); the original core sections are still the most confounded: Social Role 0.75, Habits 0.72, Conflict & Stress 0.70, Attachment 0.65, Values 0.64, Verbosity 0.64, Motivation 0.63, Vocabulary 0.62, Grammar 0.61, Personality 0.60. The growth-pack sections are low (Competence 0.16, Goals 0.15, Ordinary 0.12, Recovery 0.23, Role by Context 0.22). Conflict Style at 0.82 is the worst of all and is an off-by-default pack of 98 traits.
- **No fully empty global cell.** Smallest global cells: signature x i1 = 111 is fine, but `uncommon x i5` = **38** and `distinctive x i5` = **18** and `common x i5` = 66 are very thin; `distinctive x i4` = 133.
- Target cells named by the repo report: quiet signature (i1-2) 332, quiet distinctive (i1-2) 398, loud common (i4-5) 378, uncommon i5 38.
- **Empty cells per section (of 20)**: Conflict Style 9 [c1 c2 u1 d4 d5 s2 s3 s4 s5]; Ordinary Texture 9; Social Role 8 [c3 c5 u5 d1 d4 d5 s1 s3]; Role by Context 8; Conflict & Stress 7 [c3 c5 u1 d1 d5 s1 s3]; Habits & Vices 7 [c3 c5 d1 d4 d5 s1 s3]; Money & Class 7; Verbosity 6 [c5 d1 d4 d5 s1 s3]; Body in Speech 6; Fears 6; Family 6; Positive Origins 5 [c1 c5 u5 d5 s5]; Dialect 5; Occupational 5; Conversation Mechanics 5; Dialogue Grammar 3; Motivation 4; Recovery 4; Values 2; Attachment 2; Contradiction 2; Romance 2; Beliefs 2; Vocabulary 1 [s3]; Personality 1 [d5]; Humor 1 [d5]; Competence 1 [c5]; Mannerisms 0; Goals 0.
- Structural reading: `distinctive` is concentrated at i3 (2,532 of 3,081 = 82%) and `signature` at i4/i5 (1,172 of 1,597 = 73%). Two orthogonal dials (rarity = "how unusual", intensity = "how loud") are effectively one dial in the core sections. Quiet-signature (signature i1-2) is only 332 bank-wide, and signature x i1 is empty in Verbosity, Social Role, Conflict & Stress and Habits (also signature x i3 in all four), so a rare but understated tell cannot be drawn at the quietest level there.
- Thinnest categories by occupied cells (mean 11.36/20): Conflict Style > Passive-Aggressive 5, Peacekeeper & Smoother 6, Triangulator 6, Escalate then Apologise 7, Sulker 7, Family > Talks About Family Constantly 7.

---
## 3. Polarity and sliders (`a3_polarity.js`, `a8_sliders.js`, `a8b_extreme_depth.js`; `a3_out.txt`, `a8_out.txt`, `a8b_out.txt`, `sliders.json`, `extreme_depth.json`)

### 3a. Coverage per section (tagged / tagged+inferred)
- Whole bank: **7,407 of 9,868 tagged (75.1%)**, 7,959 (80.7%) with inferred polarity. 2,461 untagged (24.9%); **1,909 have neither tag nor inferred polarity**, so they cannot clash via polarity or the clash rule.
- 100% tagged in 19 sections. Lagging: **Mannerisms 308/997 (30.9%; 43.8% with inference)**, Dialogue Grammar 229/592 (38.7%; 49.3%), Vocabulary 389/949 (41.0%; 48.5%), Personality 1,791/2,398 (74.7%; 84.4%), Verbosity 419/548 (76.5%; 84.9%), Motivation 384/468 (82.1%), Ordinary 75/88 (85.2%), Competence 244/256 (95.3%). The three voice-texture sections (Vocabulary, Grammar, Mannerisms) hold 1,612 of the 2,461 untagged traits (65.5%: Mannerisms 689, Vocabulary 560, Grammar 363).
- Tags per tagged trait: 1 tag 3,874; 2 tags 2,784; 3 tags 577; 4 tags 166; 5 tags 6. **172 traits are tagged on 4+ axes** (diffuse; each has a weaker pull on any one slider).
- Mismatch audit: Personality "Confidence (low pole)" has 25 traits tagged opposite to their category pole (ego sign). Every other slider pole category: 0 mismatches, 0 untagged on own axis.

### 3b. Per-axis pole balance and depth (all 16 tagged axes + curiosity)
`+share` is share of directional tags that are positive. Minority-pole numbers show how deep the thin side is, split by intensity.

| axis | +tags | -tags | +share | thin pole | thin pole at i>=4 | thin pole at i<=2 |
|---|---:|---:|---:|---|---:|---:|
| vol (verbosity) | 322 | 423 | 43.2% | + | 175 | 48 |
| pace | 87 | 97 | 47.3% | + | 37 | 15 |
| form (formality) | 210 | 162 | 56.5% | - | 44 | 36 |
| warm | 738 | 560 | 56.9% | - | 160 | 162 |
| hon | 476 | 393 | 54.8% | - | 91 | 120 |
| asrt | 385 | 300 | 56.2% | - | 48 | 135 |
| ego | 419 | 523 | 44.5% | + | 89 | 155 |
| agr | 399 | 380 | 51.2% | - | 140 | 85 |
| man | 233 | 161 | 59.1% | - | 57 | 49 |
| disc | 677 | 461 | 59.5% | - | 125 | 167 |
| rebel | 383 | 371 | 50.8% | - | 79 | 144 |
| emo | 581 | 448 | 56.5% | - | 86 | 182 |
| intel | 541 | 374 | 59.1% | - | 77 | 150 |
| pos | 322 | 237 | 57.6% | - | 49 | 85 |
| act (energy) | 179 | 126 | 58.7% | - | **19** | 69 |
| mood | 304 | 334 | 47.6% | + | 50 | 147 |
| cur | 144 | 117 | 55.2% | - | 31 | 51 |

- Every axis is within or very near the 40-60% band; balance is acceptable. Edges: man 59.1%, disc 59.5%, intel 59.1%, act 58.7%, vol 43.2%, ego 44.5%.
- **Thinnest axes overall (total tags)**: pace 184, cur 261, act 305, man 394, form 372, pos 559. Only 184 pace tags drive the whole pacing dial; curiosity 261; energy 305. By contrast warm 1,298, disc 1,138, emo 1,029.
- **Thin poles at the loud end**: act "-" (low energy) has only **19** traits at i>=4 (+ pole 48); pos "-" 49 at i>=4; asrt "-" 48 at i>=4 (vs 135 at i<=2, so low assertiveness is overwhelmingly quiet); pace "-" has just **4 at i=4 and 0 at i=5**; man "-" 57; form "-" 44; cur "-" 31.
- **Quiet minority poles**: vol "+" (talkative) at i1-2 has only 48 (talkative-but-subtle is rare: the pole is 175 loud of 322); pace "+" 15 at i<=2.
- Rarity per pole: pole imbalance by rarity is largest on **vol** ("+": 161 common, 34 signature; "-": 58 common, 92 signature: being talkative is "common", being quiet is "rare"), **pos** ("+" 126 common / 47 signature; "-" 46 / 44), **form** ("-" 62 common / 12 signature), **cur** ("-" 58 common / 17 signature; "+" 47/27), **act** (+ 64 common/27 signature). `ego -` is heavily signature (117) vs `ego +` (55).
- Section supply per pole shows single-section dependency: vol "+" is 120/322 Verbosity; pace "+" 29/87 Verbosity; form "+" **118/210 Verbosity** (Stylized & Elaborate: 115 of 123 traits are form+); vol "-" 120 Verbosity + 99 Dialogue; mood "-" 115 from Habits; asrt "-" 106 from Conflict Response; disc "-" 172 from Habits; intel "+" 130 from Humor. Personality supplies only 36/745 vol, 15/184 pace, 23/372 form, 21/638 mood tags, so the voice dials have no personality-section contribution at all.
- Voice slider categories: High-Volume & Wordy 127 (117 vol+), Minimal & Ultra-Brief 122 (117 vol-), Stylized & Elaborate 123 (115 form+), Pacing & Situation-Driven 125 (25 pace+, 13 pace-, **only 38 of 125 carry pacing polarity**), Repetitive & Circular 51 (3 tagged at all).
- There is **no formal-register-low category** counterpart to Stylized & Elaborate: form- (casual/blunt) must be sourced from Vocabulary 54, Dialect 24, Dialogue 20, Humor 15.

### 3c. Slider responsiveness (`a8_sliders.js`; 15 sliders, lean = mean tag-polarity of drawn traits per sheet)
| slider | tagged traits per sheet at 0 | lean at -100 / 0 / +100 | span | d | own-slot hit% (-100/+100) | own neutral% |
|---|---:|---|---:|---:|---|---|
| friendliness | 6.58 | -0.19 / 0.24 / 0.45 | 0.63 | 2.48 | 100/100 | 0/0 |
| honesty | 4.58 | -0.36 / 0.16 / 0.47 | 0.83 | 3.10 | 100/100 | 0/0 |
| assertiveness | 2.93 | -0.48 / 0.00 / 0.54 | 1.02 | 3.25 | 100/100 | 0/0 |
| confidence | 6.40 | -0.40 / -0.16 / 0.22 | 0.62 | 2.37 | **76**/100 | 0/0 |
| agreeableness | 4.08 | -0.39 / 0.15 / 0.53 | 0.92 | 3.14 | 100/100 | 0/0 |
| manners | 1.72 | -0.55 / 0.22 / 0.68 | 1.23 | 3.50 | 100/100 | 0/0 |
| discipline | 5.58 | -0.13 / 0.28 / 0.53 | 0.66 | 2.48 | 100/100 | 0/0 |
| rebelliousness | 3.21 | -0.47 / -0.17 / 0.39 | 0.86 | 2.66 | 100/100 | 0/0 |
| emotional capacity | 5.59 | -0.34 / 0.16 / 0.46 | 0.79 | 2.85 | 100/100 | 0/0 |
| intelligence | 3.69 | -0.37 / -0.03 / 0.45 | 0.82 | 2.58 | 100/100 | 0/0 |
| positivity | 2.92 | -0.44 / 0.24 / 0.57 | 1.01 | 3.13 | 100/100 | 0/0 |
| activeness | 1.50 | -0.61 / 0.02 / 0.69 | 1.30 | 3.74 | 100/100 | 0/0 |
| curiosity | 1.37 | -0.63 / 0.14 / 0.75 | 1.38 | 3.92 | 100/100 | 0/0 |
| **verbosity** | 1.15 | -0.72 / -0.20 / 0.44 | 1.16 | 2.21 | 96 / **64** | 4 / **37** |
| **register** | 0.54 | -0.43 / -0.06 / 0.77 | 1.20 | 2.24 | **35** / 100 | **66** / 1 |
| composure (mood) | 2.86 | -0.31 / 0.05 / 0.34 | 0.65 | 1.17 | n/a | n/a |

- All 13 personality sliders respond strongly (d 2.4-3.9). Flat ones: **composure (d 1.17, span 0.65, lowest)**, **verbosity (d 2.21)**, **register (d 2.24)**; **confidence** (lean at -100 still -0.40 but own-slot hit only 76%: its neg pole category has 25 mis-signed traits), friendliness (span 0.63), discipline (span 0.66; lean at -100 only -0.13, i.e. "low discipline" sheets are on average still slightly neutral).
- Sliders with few tagged traits per sheet (so each draw matters, high variance): curiosity 1.37, activeness 1.50, manners 1.72, register 0.54, verbosity 1.15. Register at 0.54 tagged traits per sheet is the thinnest dial.
- **Register slider at -100 (casual/blunt) fills its own slot with a register-bearing trait only 35% of the time; 66% neutral.** Verbosity +100 gives 37% neutral own-slot and a 64% hit.
- Depth at the extremes (`extreme_depth.json`; 400 builds per pole): distinct own-slot traits drawn and effective n (1/sum p^2). Shallowest: **positivity -100 only 21 distinct (eff. 15.3, top-5 share 51%, top trait "Joyless")**; agreeableness -100 22 (eff 17.4); manners +100 24 (18.1); rebelliousness +100 24 (18.4); honesty -100 26 (18.5); emotional capacity +100 26 (18.0); register +100 32 (17.7, top-5 50%); friendliness +100 29; confidence -100 28 (17.6). Deepest: intelligence -100 58 (42.2), verbosity +100 52 (40.1), confidence +100 44 (33.1). A user pinning a slider at an extreme sees the same top-5 traits in 36-51% of builds across the board; top-1 shares reach 11.5-15.3%.
- Concentration: assertiveness +100 top-1 trait ("Correction-unafraid") 15.3%; register +100 ("Sermon-cadenced") 13.8%; manners -100 13.0%; emotional capacity -100 13.0%.

---
## 4. Duplicates and near-duplicates (`a4_dups.js`, `a4b_tfidf.js`; `a4_out.txt`, `a4b_out.txt`, `dups.json`, `tfidf_pairs.json`)

Overall: the bank is clean at the exact level and leaks at the fuzzy level. The engine's own `nearDuplicateIndex` (within-category, its own threshold) reports **0 traits / 0 pairs**, so the repo's guard does not see anything the checks below find.

- Exact duplicate names (normalised): **2 groups / 4 traits**: "Devil's advocate" (#1254 Agreeableness Contrarian & #1701 Instigator) and "Public accountability seeker" (#1964 Restraint & Discipline & #2872 Rigid & Principled).
- Exact duplicate descriptions: 0. Exact duplicate name+desc+example: 0. Examples identical to own desc or name: 0.
- **Exact duplicate example lines: 8 groups / 16 traits**: "mm" (#90 Stolid / #810 Frugal-tongued); "fine" (#813 Threadbare-reply / #1040 Word-rationer); "Gone, all of it, just gone" (#465 / #466); "Could eat a horse, there's no horse, there's soup" (#1858 / #2957 Literalist-response vs Literal-response comic); "Hands again, third time this hour" (#1880 / #4746); "Go go go go" (#1970 / #4962); "By Friday, by Friday, right" (#90092 Echoes the last three words / #130061 Repeats the last three words back); "Sorry, yes, go on" (#90256 / #92211).
- **Fuzzy name pairs (Jaccard >= 0.75): 55 pairs**; 23 within one category, 8 same section other category, 24 cross-section; 26 are exactly 1.00. Worst, same behaviour listed twice with reworded names:
  - Four-way "answers only the question asked": #161043 (Turn-Taking Grammar), #182100 (Occupational Jargon > Legal), #182600 (Conversation Mechanics > Literal Uptake); also #101003, #110355 hit the same cluster at 0.75.
  - #1515 "Noun-verbing" / #5160 "Verbs any noun" (same category); #1885 "Gambler" / #4906 "All-in gambler"; #1577 "Recognition" / #4152 "Recognition-from-one"; #1583 "Safety" / #170583 "Their own safety"; #2743/#4241 fear of repeating history; #1616/#2751 broken promise; #130015/#130110 "To be looked after for (one) week"; #130202/#150107 "A song they (will) leave (the) room for"; #1788/#2920 hypervigilant to tone; #96221/#140393 "never once able to show their work"; #130065/#140405 "takes notes in (every) conversation"; #91924/#140433 "leans in (only) for bad news"; #3512/#140060 tongue-click thinking.
  - By pack pair: core+core 21, balance+supplement 7, gaps+supplement 4, gaps+polarity 2, core+life 2. So the growth packs (supplement/balance/gaps/life/polarity) did re-add ~16 things that already existed.
- Fuzzy description pairs (Jaccard >= 0.6): **34** (25 within one category; 31 core+core). Examples at 1.00: #2549/#3782 "Treats any minor social slight as total, permanent condemnation"; #3779/#3819 "Frames disagreement as evidence of the other's lesser understanding" (three-way with #2569). These are the old Personality "-er" names (ids 2500-3900) paired with their 3700-4900 rewrites: the "near-duplicate rewrites" of the previous audit created a second copy rather than replacing the first for these.
- Fuzzy name+desc (>= 0.55): 33 pairs (24 within category). Fuzzy examples (>= 0.7): 53 pairs, 41 within category, 51 core+core.
- **TF-IDF cosine >= 0.5 pairs: 256** (>= 0.6: 74; >= 0.7: 19; >= 0.8: 1); 171 within the same category, 45 cross-category same section, 40 cross-section. By pack pair: core+core 204, core+supplement 10, gaps+growth 7, balance+core 6, core+gaps 5. The 0.5-0.7 band is genuine same-concept/different-wording: "Finger-count list" (#664) vs "Finger-count silent" (#3523); "Threshold-tapper" (#1956) vs "Doorframe-tapper" (#3451); "Mock-affectionate" (#1835) vs "Mock-affection cruelty" (#2972); "Mouth-twitch beat" (#650) vs "Amused-corner-twitch" (#3479); "Self-doubting" (#1234) vs "Occasionally self-doubting" (#2037) (the second is a deliberate softer variant, 0.65).
- Single-link clusters of three at name+desc >= 0.5: 1 (the "Superiority-implying" trio above); none span two sections.
- Repeated example phrases across traits: 93 sentences (>= 5 words) used in 2+ traits; the most reused: "I'm not going anywhere" x7, "That's the whole of it" x5, "That's rather the point" x5, "I don't need it" x4; 6-word prefixes shared by 3+ traits: "it's fine it's fine" x4, "I'd rather not get into" x3, "what's in it for me" x3.
- Estimated actionable duplicates: ~60 traits (the 26 exact-1.00 name pairs + 8 example-line groups + ~25 desc >=0.8 pairs, deduped) are strict candidates to merge or re-differentiate; ~170 more are borderline same-category similar pairs.

---
## 5. Text form and quality (`a5_form.js`, `a5b_templates.js`, `a5c_sensitive.js`, `a5d_typos.js`, `a5e_sample.js`, `a5f_splice.js`, `a5g_leak.js`, `a5h_splice_live.js`, `a5i_markup.js`; `a5*_out.txt`, `forms.json`, `a5e_sample.txt` = 233 traits read in full)

### 5a. Name length and form: two incompatible naming conventions
| pack | n | name chars median (p10-p90) | name words median (p10-p90) |
|---|---:|---|---|
| core (ids 1-5xxx) | 4,621 | 20 (13-28) | 2 (1-2) |
| supplement | 1,684 | 41 (25-56) | 7 (4-10) |
| situational | 364 | 38 | 6 |
| life | 999 | 32 | 6 |
| growth | 408 | 32 | 6 |
| gaps | 588 | 29 | 5 |
| balance | 597 | 28 | 5 |
| conflict | 98 | 30 | 6 |
| all | 9,868 | 26 (15-43) | 3 (1-7) |

- Names > 40 chars: 1,375; > 50 chars: 417; > 60 chars: 80; max 82 chars. Names of 7+ words: 1,799. Names with sentence punctuation (comma, colon, quote, apostrophe, dash): 1,175 (1,152 contain a comma; 94 contain quotation marks).
- Hyphen-glued labels: 4,118 names (41.7%) contain a hyphen; 720 contain 2+; 1,610 are a single hyphenated compound ("Determined-chin-set", "Preemptive-abandonment griever").
- Form classes (heuristic, `forms.json`): 3rd-person verb clause 2,989 (30.3%); other multiword phrase 2,757 (27.9%); multiword agent-noun 1,560 (15.8%); hyphen compound (other/agent/participle/-ing) 1,580 (16.0%); determiner noun phrase 387; single word 227 (2.3%); quote/I-statement 94; infinitive 56.
- **Core is label-style, newer packs are sentence-style.** Core: 31% agent-noun phrases + 31% hyphen compounds + 28% multiword phrases, 1% clauses. Supplement: 70% 3rd-person clauses; balance 69%; growth 67%; polarity 63%; gaps 54%; conflict 83%. Competence 79% clause names; Recovery 88%; Body in Speech 83%; Romance 81%; Goals 98% noun phrases; Positive Origins 88% noun phrases.
- Per-section label-like names (hyphen compound / agent noun / single word): Verbosity 74%, Grammar 64%, Conflict & Stress 57%, Social Role 55%, Vocabulary 52%. A single sheet therefore mixes "Cascade-speech" with "Buries the point in preamble" in the same list.
- Hyphen-modifier + agent-noun pattern ("Quiet-sacrifice accommodator"): **465 names**; ending words: "speaker" 165, "user" 66, "giver" 46, "skeptic" 29, "leader" 27, "loyalist" 25, "asker" 20, "connector" 20. Overall 180 end in "speaker", 83 in "user"; 1,751 of the 4,621 core names end in -er/-or.
- "Echo-the-category" names: **836** names end in a word that repeats their own category label (788 core), e.g. "Mock-affection cruelty" (Cruel & Barbed), "Cold-hands freezer" (Freeze), "Secure / Mildly secure" (Secure), "Consensus-forging leader" (Leader); **10 end in the literal word "vice"** ("Cold-turkey discipliner vice", "Habit-stacking discipliner vice", "Rule-of-thirds discipliner vice").
- Names ending in a dangling article/preposition: 70 (e.g. #1914 "Half-in", #4153 "Skill-passing-on", but also long clause names ending "...with", "...by").
- 60 names contain you/your and 63 contain I/my (the latter mainly quote-style names such as #1627 "'Showing feeling gets you hurt'", #91411 "Answers 'how are you' with logistics").

### 5b. Splice-ability: names are used inside generated sentences and many do not fit
- Render splices the trait name into frames such as "They are **X** and also **Y**" (`js/render.js` line 1105, seated contradictions) and `asNounPhrase`/`traitPhrase` frames in the Motivation, Competence and Goals sections ("being someone who ...", "the time they ...", "trying to ...").
- **Live check, 500 default sheets (`a5h_splice_live.js`)**: 731 seated contradiction lines; **57% (420/731) have at least one clause-form or label-form name that breaks the frame**; 219/705 face names and 280/731 exception names are 3rd-person verb/modal clauses. Examples as rendered: "They are Told-you-so keeper and also Infectious own-laughter"; "They are Fear of being wrong and also Can't explain it, can do it"; "They are To hear the whole of it, unsoftened and also Bails loudly the moment it stops paying"; "They are Runs a household of eight on a whiteboard and also Cannot recall the last time they said no"; "They are Fear-of-outliving-purpose and also Asks who benefits"; "They are (none) and also Interrupts to check their phone" (a face-less fallback is used for 26 of 731 lines).
- `asNounPhrase` prefixes ("being someone who ...", "trying to ...", "the time they ...") already repair 282 Motivation/Competence names (`a5f_out.txt`), but 4 spliced-section names with lists or commas still render raw ("Sews, mends, alters — never from a pattern" #170004; "Knots, loads, lashings" #170012; "Queues, forms, offices — a natural" #170038; "Agrees, then does it their way" #130312). Sampled transforms read cleanly except fear-of-the-wound and "the time they told the wound was theirs to manage" (grammatical but odd).
- Net: about a third of the bank cannot be spliced as a noun phrase without a frame fixer; a splice-friendly short **tag** field (for the "They are X and also Y" frame) is the cheapest fix.

### 5c. Template/phrase repetition, old vs new packs (`a5b_out.txt`)
Concentration of the top-20 three-word description openers (share of pack): core 2.5%, supplement 3.5%, balance 4.0%, gaps 4.1%, life 5.4%, growth 5.4%, situational 5.8%, cells 16.4%, conflict 22.4%, depth 24.3%. Top-20 two-word name openers: core 1.0%, balance 9.9%, gaps 9.4%, supplement 12.2%, growth 13.2%, life 16.7%, conflict 25.5%, depth 34.0%. So newer packs are far more templated at the front of the name; the core's variety comes mostly from its hyphen-compound vocabulary.
- Top 3-word NAME openers (bank-wide): "Has never once" **26** (all growth-era; e.g. "Has never once let ...", "Has never once broken ..."), "Changes the subject" 9, "Fear of being" 8, "Fear of the" 8, "Waits for the" 7, "Waits to be" 5, "Talks about the" 5, "The one who" 5, "The respect of" 5, "Expects the worst" 4, "Has no remaining" 4, "Has run out" 4. Name first words: "Has" 150, "A" 146, "The" 119, "Keeps" 87, "Says" 78, "Get" 66, "Answers" 60, "Reads" 59, "Asks" 58, "Cannot" 54.
- Top 3-word NAME endings: "the room" **29**, "out loud" 20, "their own" 17, "on purpose" 15, "every time" 13, "under pressure" 11, "discipliner vice" 10, "for them" 10, "bad news" 9, "at home" 9.
- Top DESC openers: "Wants to be ..." **29** (22 in growth-era: "wants to be indispensable/understood/right"), "Chooses words that ..." 13, "Chooses vocabulary that ..." 13, "Speaks with the ..." 10, "Selects vocabulary that ..." 8, "Actively works to" 8, "Total structural inability to" 5, "Never states a falsehood/..." 6, "Terrified of being" 6. First words of descriptions: "Uses" 260, "Wants" 137, "Speaks" 123, "Maintains" 107, "Frames" 101, "Cannot" 97, "Treats" 95, "Takes" 94, "Chooses" 91, "Every" 88, "Delivers" 87, "Says" 86. 6,373 of 9,868 descriptions (65%) open with a 3rd-person present verb. Supplement pack alone opens 52 with "Maintains", 34 with "Total ...", 27 with "Consistently".
- Example openers (4-word): "I was going to" 9, "I don't know what" 9, "Lovely to see you" 6, "I'm not going to" 6, "I don't want to" 5, "I wanted to say" 5, "As I was saying" 5, "Thank you so much" 5, "It's fine, it's fine" 4. Example endings: "say that again" 6, "there it is" 5, "I was saying" 5, "sorry, go on" 4.
- Intensity and rarity are over-described: **910 descriptions use absolutes (always/never/completely/constantly/entirely) and 347 of those sit at intensity 1-2** (e.g. #794 "Soft-spoken murmur" i2, "Keeps volume permanently low"; #808 i2 "ever more words"); 54 traits have mildness markers (small, slight, occasional, minor) at intensity 4-5; 51 have totalising words at intensity 1. These blur what the intensity dial means.
- Stage-direction format is inconsistent: 2,420 examples use "(...)" stage directions; **598 examples in five packs use literal `<i>(...)</i>` HTML (balance 169, gaps 207, growth 124, tails2 59, conflict 39)**. `escHTML` in `js/engine.js` line 8323 escapes `<` and `>` and render.js lines 463/777 interpolate the example through it, so these 598 examples would display the tags as literal text on the sheet. Highest-value single quality fix in this section (`a5i_markup.js`).
- Length: description median 8 words in core vs 11-16 in newer packs; example median 8 (core) vs 9-12. Only 1 description under 4 words (#1747 "Weighs harm arithmetically."), 150 under 6; 2 over 25. Examples of 1-2 words: 88 (mostly deliberate: "Mm.", "Later.").
- Examples with zero content-word overlap with their own name+desc: 6,773 (informational; dialogue examples normally share none).
- Hand-read sample (`a5e_sample.txt`, 233 traits proportional by pack): core Personality/Verbosity/Vocabulary entries are short labels with generic one-line descriptions; the newer packs are noticeably more specific and concrete (the "life", "conflict", "gaps" samples are the strongest writing), but also more templated at the opening. The sample showed no hard slurs.

### 5d. Sensitive or stigmatising wording (`a5c_sensitive.js`; no hard slurs found: 0)
Worst, by name or tone (quoted):
1. **"Simple-minded"** #1332 and two variants **"Simple-minded about money" #140377, "Simple-minded about consequences" #140384**, and **"Dimwitted about jokes at their expense" #140390** (Intelligence — Instinctive & Unanalytical): intelligence insults used as trait names. Also #1856-class "-blind" humour names ("Joke-blind" #1857, "Mildly humor-blind" #2129, "Symbol-blind speaker" #2256, "Task-focus blind to comedy" #3001) use disability language as metaphor.
2. **"Genuinely-unhinged absurd" #4681** (Humor > Absurd & Chaotic).
3. Clinical or pop-diagnostic terms used as labels: "Gaslighting tendency" #1209, "Alexithymic-leaning" #1316, "Dissociative drift" #1659, "Dissociating-in-closeness" #1812, "Dissociates-during-intimacy" #2947, "Fantasy-dissociation" #2784, "Dissociative-drift freezer" #4292, "Trauma-isolated outsider" #4384, "Trauma-echoing disorganized" #4589, "Turns their own trauma into a bit, eventually" #91503; casual misuse of "manic" ("Manic-giggle burst" #610, "Manic on holiday, inert at home" #160123). 29 trait names contain a diagnosis/clinical word; 55 traits overall.
4. Speech differences as quirks beside the dedicated Stammer category: "Stammering" #143 ("Characterized by involuntary pauses"), "Mid-sentence stutterer" #458, "Stammer-recovery" #467, "Stutter-start" #468, "Adrenal-stutter" #817, "Echo-stutter" #926, "Double-take stutter" #1109, "False-calm stutter" #2332: 8+ core names treat stuttering as a comic or stress disfluency; the later respectful category "Body in Speech > Stammer & Speech Blocks" (e.g. #183604 "Names the stammer up front") is the better model.
5. Substance and class tone: "Functional drinker" #1865; "Common when drunk" #180801 (class-coded: "the school voice slides off... by ten o'clock he is a different postcode entirely"), "Posh when angry" #180800, "Performs working-class roots" #180805, "Swears to prove they're not posh" #180806: class stereotypes, borderline but deliberate in context.
6. Past-tense, clinical-definition descriptions (157 descriptions start with a participle, e.g. #143 "Characterized by involuntary pauses and word repetitions", #88 "Marked by extreme simplicity and brevity of speech", #83 "Disinclined to speak or express feelings voluntarily", #1229 "Unbothered by criticism that isn't constructive") read like dictionary glosses, not behaviour.
- Other counts: 4 examples with strong profanity ("fuck/shit/bastard/bloody" family; #180806 is the unmasked one); 21 descriptions use gendered he/she pronouns (against 1,767 using they/their); 43 descriptions use 1st/2nd person outside quotes.
- Word-hit noise (not defects): "mental" 24 ("mental ledger"), "crack/snap/thick" etc. are idiom; "stupid" appears 11 times inside example dialogue (self-berating or blunt speech: acceptable in quotes).
- Identity words in names: "mother/father/grandmother/teenager" appear in 31 goal/competence names; "foreign" 3; "straight" 9 (mostly "straight-faced"); no race, religion or gender terms in names. Nationality/religion/culture words in name+desc+example: 17 traits (Dialect and Beliefs sections; reviewed, descriptive not derogatory).

### 5e. Typos and consistency (`a5d_typos.js`)
- Common-misspelling list: 0. Doubled words ("the the", "is is"): 35 hits (many are deliberate stutters/echoes in examples: #23, #131, #136, #401, #565). Double space 1 (#140240), space before punctuation 1 (#150078), missing space after comma/period 4 (#279, #284, #170274, #170412). a/an errors: 2 + 10 candidates (#140225, #200211; "an [consonant]" #90119, #97135, #101013, #130104, #130106). Non-ASCII other than dashes/quotes: 4 (#246, #140022, #140653, #150192). Lowercase starts: 0. Unbalanced quotes: 0. Straight apostrophes only: 5,718 (consistent).
- **Dialect mix is unmanaged**: British -ise/-isation words 718 vs American -ize 217; humour/colour/favour 164 vs humor/color/favor 161; grey 12 vs gray 0; mum 23 vs mom 0. Within one name: "Mildly humor-blind" (US) beside "Humour-style" labels (UK). Newer packs are almost fully British (balance 44:1, gaps 53:1, life 103:11, conflict 18:0); core is split 241:163. Pick one spelling convention (the newer packs already chose British) or accept it as a style decision, but a few US-spelt core names remain visible.
- The 880-word "single-occurrence near-word" scan in `a5c_out.txt` is dominated by proper nouns and hyphen-compounds; no actionable typos beyond the list above.
- Incomplete placeholders: none. 97 "placeholder-like" short examples are deliberate onomatopoeia ("Hgn.", "Mn-kay.").

---
## 6. Metadata and reach (`a6_reach.js`, `a6b_report.js`, `a6c_kitchen.js`, `a6d_conflicts.js`, `a6e_union2.js`, `a6f_meta.js`, `a6g_never.js`; `a6b_out.txt`, `a6e_out.txt`, `studio-misc.txt`, `studio-coverage.txt`, `never_drawn.json`, `never_union2.json`)

### 6a. Review status and metadata
- **reviewStatus: 9,259 unreviewed (93.8%), 609 reviewed (6.2%)**. Reviewed by pack: core 54/4,621 (1.2%), supplement 1/1,684, cells 128/128, polarity 56/56, life 370/999 (37%), every other pack 0%. `situational`, `tails`, `depth`, `balance`, `tails2`, `gaps`, `growth`, `conflict` are 100% unreviewed (2,380 traits).
- Previous audit (docs/AUDIT-2026-09.md) recorded 8,753 of 9,362 unreviewed; the bank gained 506 traits and 506 more unreviewed ones, i.e. the review backlog grew rather than shrank.
- Fields present: id, section, category, trait, desc, example, intensity, rarity, pol, pack, rtier, reviewStatus on all 9,868; `tier` 2,398 (Personality only); `tierSource` 467; `variant` 269 (220 a/b-locked); `conceptFamily` 2,748 (27.8%); `behaviorFunction` 1,527 (15.5%); `conditions` 655 (6.6%); `worldTags` 175 (1.8%); `frequency`/`visibility`/`persistence`/`narrativeSalience` 112 each (1.1%). There is **no `tags` field and no `contexts` field**: tag coverage in the generic sense is 0%; the closest equivalents are worldTags 1.8% and conditions 6.6%.
- worldTags in use: modern 87, institutional 44, domestic 15, rural 14, military 14, online 11, urban 2, pre-modern 1, any 1, **industrial 0, futuristic 0** (11 values declared). Per section: Occupational Jargon 37.5%, Dialect 11.3%, Competence 9.8%, Goals 6.3%; **0%** for Social Role, Values, Verbosity, Conflict Style, Money & Class, Conversation Mechanics, and under 1% for Personality (1.0%), Mannerisms (0.7%), Vocabulary (0.7%), Humor (0.9%). Setting-aware filtering therefore touches only 175 traits; a historical/fantasy/sci-fi setting cannot suppress modern-world references in the other 9,693.
- `conditions` (655) cover mainly the off-by-default sections (Romance 80.6%, Fears 76.5%, Money 61.5%, Beliefs 60.2%, Dialect 59.2%) and **0% of the 16 default-on voice/personality sections** except Humor (10.6%), Mannerisms (3.9%) and Contradiction (38.3%). Exceptions: 0 of 9,868.
- `studio validate`: schema clean, axis tables clean, cross-links clean, duplicate-names none, traits outside every pack manifest 0.

### 6b. Reach (`a6b_out.txt`, `a6e_out.txt`; regimes: D default sheets, D62 shipped dials with neutral sliders, S random sliders default sections, X random all sections, E pinned slider extremes, P archetype presets, K 12,000 kitchen-sink builds with every dial random)
| regime | distinct traits drawn | % of bank |
|---|---:|---:|
| D default sheets (3,000 sheets) | 5,859 | 59.4% |
| D62 shipped dials, neutral sliders | 6,136 | 62.2% |
| S random sliders, default sections | 7,846 | 79.5% |
| P archetype presets | 8,133 | 82.4% |
| E pinned slider extremes, all sections | 8,764 | 88.8% |
| X random sliders, all sections | 8,907 | 90.3% |
| K kitchen sink (12,000 builds, all dials) | 9,433 | 95.6% |
| **union of all regimes** | **9,505** | **96.3%** |
| never drawn anywhere (363) | | 3.7% |

- **Never drawn in any regime including kitchen-sink: 363 traits (3.7%)**. By section: Mannerisms 115 (11.5% of the section), Vocabulary 107 (11.3%), Dialogue Grammar 90 (15.2%), Personality 27 (1.1%), Verbosity 24 (4.4%); every other section 0. By pack: core 262, supplement 59, tails 13, cells 11, situational 7, tails2 6, balance 3, depth 1, polarity 1; life/gaps/growth/conflict 0. By intensity: i3 142, i4 121, i5 90, i1 10, i2 0. **325 of the 363 (90%) have no polarity tags**: the slider-driven draw never selects them and the random category draw rarely does. Categories with most never-drawn: Grammar > Structural Shifts 31/110, Grammar > Disfluencies & Flow 29/100, Verbosity > Pacing & Situation-Driven 24/125, Vocabulary > Abstractness & Sensory Modality 22/108, Mannerisms > Eye & Facial Expressions 17/94, Vocabulary > Semantic Density 16/77, Affective Intensity 15/92, Morphological Lexicon 15/84, Micro-Physical Tics 14/89, Vocal Modulation 14/86, Physical Vocalizations 14/80.
- Examples never drawn: #104 "Burrowing" (Verbosity), #447 "Cluttered-speech", #595 "Tag-team-grammar", #783 "Enunciated-snap", #1516 "Repetition-intensifier", #2271 "Clattering-consonant user", #3449 "Defensive-arm-cross-snap", #90059 "Everything is negotiation", #100124 "Asks the ordinary number of questions", #160123 "Manic on holiday, inert at home".
- **At shipped defaults only 59.4% of the bank is ever drawn.** 1,104 traits (11.2%) in 13 off-by-default sections can only be reached by enabling the section; Verbosity reaches just **16% (90/548)** at defaults (95% when sliders are random): the verbosity/register dials are pinned to a few hundred of its traits by the shipped neutral settings. Grammar 47%, Mannerisms 54%, Vocabulary 56%, Personality 64% (neutral dials), Goals 90%.
- Usage skew: Gini over the whole bank 0.715 at defaults (0.704 at D62; 0.556 for X; 0.561 for K); top 1% of traits take 8.5% of draws at defaults. Most drawn at D62: Contradiction Functions traits ("Obeys the uniform, defies the person" 6.3%, "Optimist about strangers, pessimist about kin" 6.2%, "Disciplined until observed" 5.9%, "Cries at films, dry at funerals" 5.4%, "Lies only about the trivial" 4.9%) because the Contradiction section has only 128 traits for 2.3 slots.
- Never-drawn at defaults by category pack: core 492/4,621 (11%), tails 16/53 (30%), cells 18/128 (14%), life 49/999 (5%), supplement 96/1,684 (6%).
- Never-drawn by rarity x intensity: signature i4-i5 205 (of 1,172, 17%), distinctive i3 318, uncommon i3 59. At intensity 5, 26% (150/578) of traits are never drawn at defaults vs 0% at i2 and 4% at i1.
- 70 categories are never drawn at defaults: exactly the 13 off-by-default sections. No category has zero draws across all regimes.

### 6c. Polarity-based conflict and clash coverage (`a6d_conflicts.js`)
- 2,367 traits (24.0%) can take part in **no** polarity conflict check (no effective polarity, or exempt as contextual/situational/contradiction), 831 are explicitly conflict-exempt sections; only 4 clash rules (TRAIT_CLASH_PAIRS) matching 180 traits. Distribution of the 2,367: Personality 637, Mannerisms 560, Vocabulary 489, Grammar 300, Contradiction Functions 128 (exempt by design), Verbosity 83, Motivation 79, Role by Context 66.
- Engine `nearDuplicateIndex` finds 0 traits; the checks in section 4 find 256 TF-IDF pairs: thresholds need loosening.

### Category cross-link (brief; the bug agent owns this)
`engine.js` `WEIGHT_MATRIX` has 24 duplicate keys that silently overwrite earlier entries and kill about 45 cross-links between categories (all stress -> Repair links; attachment -> Emotional Affectations / Temporal Orientation; vices Compulsion -> Micro-Physical Tics; role:Leader -> Turn-Taking Grammar). Effect on the bank: the affected Mannerisms, Vocabulary and Grammar categories (which already have the lowest reach) lose their profile-driven pull, which partly explains their 40-56% reach and the 363 never-drawn traits. Not re-investigated here.

---
## 7. Concept gaps (`a7_concepts.js`, `a7b_candidates.js`, `a7c_nearest.js`, `a7d_near2.js`, `a10_gaps.js`, `a10b_newsec.js`; `a7_out.txt`, `a7b_out.txt`, `a7d_out.txt`, `concepts.json`, `candidates*.json`, `cands2*.json`, `gaps_table.md`)

Method: 270 behavioural concepts (regexes over name + description + example, 9,868 traits) were probed across speech habits, regulation, attachment, moral reasoning, humour, stress communication, social roles, lying, apology, help-seeking, endings, silence, storytelling, argument, flirting, grief, authority, money, time, risk, trust, status, relationships and modern life. 175 candidate traits were drafted for the weakest concepts; each was checked against its two nearest existing traits (TF-IDF cosine; `a7c`/`a7d`) and 31 of them dropped as too close or too weak, leaving **144 candidate traits** in the table at the end of this section (cosine to the nearest existing trait: min 0.15, median 0.27, max 0.41). Nothing below is a name generator, an Appearance section or appearance content; two drafts that touched clothing/hair wording were rewritten to remove it. Caveat: regex hits over-count (incidental words match), so the zero and near-zero cells are the reliable evidence; a "found" concept may still be thin or only present as an unrelated phrase.

### 7a. Evidence: concepts with zero or near-zero coverage (matches in whole bank: name+desc+example / name+desc / name only)
Zero matches anywhere: royal/institutional "we" (0/0/0); "that's what she said"/innuendo (0/0/0); love-bombing/intense early closeness (0/0/0); moral licensing, does good to excuse bad (0/0/0); self-aggrandising mock-arrogant humour (0/0/0); white lies as social lubricant (0/0/0); demands rather than asks (0/0/0); silence out of shame (0/0/0); story starts at the wrong end/spoils the ending (0/0/0); retells others' stories as own (0/0/0); stories always turn back to themselves (0/0/0); playing hard to get (0/0/0); grief humour about the deceased (0/0/0); gambles with others' money or feelings (0/0/0); parenting voice/bossy older sibling (0/0/0); therapy-averse "I don't do feelings talk" (0/0/0).
Name-only <= 1 (concept does not appear even in a trait name): **74 of 270 probes**. One or two total hits: mispronounces/malapropisms (2/2/0); talks fast when nervous/slows when angry (1/1/1); self-soothing rituals (1/1/0); anger as cover for hurt (2/2/2); difficulty receiving care or compliments (2/2/2); chosen/found family talk (2/2/1); utilitarian reasoning (1/1/1); loyalty over justice (2/1/0); double standards (2/1/0); schadenfreude (2/2/2); nervous humour to deflect compliments (1/1/0); goes formal when furious (1/1/1); literal/precise under stress (2/2/0); gatekeeper (2/2/0); scapegoat (2/2/1); class clown (2/0/0); non-apology "sorry you feel that way" (1/0/0); apology by action or gift (2/2/2); refuses to apologise (2/2/2); apology by letter (1/1/1); tests people before trusting (1/0/0); speaks last, waits for the powerful (1/1/1); advice unasked/fixes instead of listens (1/1/0); euphemisms for death (1/0/0); grief as anger (2/0/0); flirts with everyone equally (1/1/1); flirts by favours (1/1/0); pathological lying about trivia (1/1/1); money shame (2/2/1); pet names/endearments for everyone (19/9/6, thin); upspeak (4/4/1); vocal fry (9/4/2); talks to self (12/12/5); third-person self reference (8/7/6).
Thin on name+desc only (<= 2): time-out/needs space to cool down (7/1/0); reassurance-seeking (4/2/0); ghosting/slow fade (3/2/0); parentification (4/2/2); sign language / deaf-community communication (7/2/1); revenge/settling scores (9/1/1); lying tells (3/2/0); abrupt hang-up (7/2/1); flustered around attraction (3/2/2); delayed grief (5/1/1); charity/tithing (4/2/2); chronically late (5/1/1); humble-bragging (6/2/0); couple-shorthand speech (6/2/1).
Over-supplied by contrast: "fear of being ordinary" 536 full-text hits (79 in name), social-media phrasing 453, "anyway"/closing phrase 262, debt/owing tally 246, "pretends not to be angry" 81 (only 4 name+desc), hedges/qualifiers 180, legal precision 115, numbness after loss 108, deactivating attachment 105, religious doubt 114, big-picture vs detail 104. Those regexes include incidental words, but they show where adding more traits yields little new.

### 7b. Structural gaps: prioritised missing categories and sections
Priority 1 (a speaking-voice behaviour with no home at all; highest value for a voice and personality tool):
1. **Emotion display rules** (new section or Conversation Mechanics category): only 2 traits in the bank describe hiding or performing feelings; masking is 15 traits and off by default. Cry in private, performed cheer, poker face, "fine" as a display, show-anger-not-fear. Evidence 2 name+desc hits (broad regex).
2. **Asking and offering help** (Role by Context / Conversation Mechanics): probes: demands rather than asks 0; minimises the ask 10/4/0; refuses help "I've got it" 12/3/0; hint-dropping 12/11/4. 5 drafted traits, 1 more under Apology.
3. **Feedback and praise**: giving/receiving criticism, compliments, congratulations. Existing mentions are mostly Personality tone traits (48 of 126 broad hits); no category. 6 drafted.
4. **Persuasion and influence** (guilt, social proof, deal timing, flattery-then-ask): 68 broad hits, 15 in Mannerisms, no category; 6 drafted.
5. **Decision style** (cannot choose until someone else orders; deadline decider; consults then ignores): broad 341 hits are mostly the word "decide"; decision paralysis probe 3/3/0, intuitive/gut 9/9/3. 4 drafted.
6. **Boundaries and refusals** (how a no is said and defended): 3 drafted; "boundary-setting language" probe has 60 hits but is Personality tone; refusal language is not a category.
7. **Greetings and farewells** and **Hospitality and gifts** (conversation openers/closers, hosting, receiving): "long goodbyes" 34/19/9, closers heavy on one phrase ("anyway" 262 broad), but no greeting-style category; 2 and 3 drafted.
8. **Storytelling mechanics** (Conversation Mechanics): story begins at the wrong end 0, retells others' stories as own 0, always about themselves 0, tells the same story repeatedly 5/5/1; only 15 traits across Masking/Scripted Speech/etc. 1 drafted; more needed.
9. **Grief and loss talk** (Recovery or Beliefs): euphemisms for death 1, grief humour 0, grief as anger 2, delayed grief 5/1/1; present-tense for the dead 3/3/2. Not yet drafted in the table; ~15 traits recommended.
10. **Silence kinds** (shame silence 0, punitive 6/4/3, companionable 5/5/1, strategic 8/5/3) and **lying register** (white lies 0, compulsive trivial lying 1, lying tells 3/2/0, gaslighting 3/3/2): fold into Conflict Style / Honesty; not yet drafted.
Priority 2 (fill thin existing sections with new categories):
11. **Social Role in a Group**: add Clown, Scapegoat, Gatekeeper, Historian, Newcomer, Martyr, Lieutenant, Rival (all 2-8 hits; 21 traits drafted); current section has only Leader, Connector, Instigator, Outsider, Peacemaker, Skeptic, Caretaker.
12. **Values and Moral Line** (5 categories only: Loyalty-Bound, Rigid & Principled, Pragmatic & Flexible, Idealistic & Visionary, Self-Interested): add Tradition and Rite, Purity and Sanctity, Autonomy and Liberty, Fairness, Care and Protection, Hospitality (17 drafted). Evidence: fairness 44 broad hits / 7 in names; care and protection 37; loyalty over justice 2; double standards 2; moral licensing 0.
13. **Motivation and Wound**: add The Abandoned Dream, Pride, Envy, The Family Casting (the role the family gave them), The Secret, The Debt (12 drafted; "abandoned dream, envy, pride" 16 broad hits; revenge/settling scores 9/1/1).
14. **Habits and Vices**: add Screens and Notifications (probe 5/3/2), Work and Busyness (7/6/3), Keeping and Collecting, Gossip and Information (12 drafted).
15. **Vocabulary**: add Therapy-speak and Wellness Register (5 drafted; 77 broad hits dominated by the word "boundaries"); **Digital Voice** (text/email/voicemail style: 14/11/7 for texts, 12/12/8 video-call; 2 drafted).
16. **Conflict & Stress**: a Ritual-under-stress category (tidies, goes literal, goes formal, time-out); each probe 0-2 hits.
Priority 3 (not new categories: top up thin cells and thin poles):
17. Thin poles from section 3: low-energy at loud intensity (19 traits at i4-5 on `act-`), low pacing at i4-5 (4 at i4, 0 at i5), casual register at loud intensity, low curiosity at loud intensity (31), pos- at i4-5 (49): add ~30 traits each.
18. Quiet signature (s x i1-2 only 332 bank-wide; empty in Verbosity, Social Role, Habits, Conflict) and loud common (c x i4-5 378) cells: ~150 traits across the empty cells listed in section 2 (Social Role 8 empty, Conflict & Stress 7, Habits 7, Verbosity 6).
19. Speech-mechanics gaps (voice/dialogue grammar, where the bank is mostly untagged): upspeak (4/4/1), vocal fry (9/4/2), institutional "we" (0), malapropism (2), innuendo (0), talks to self (12), speaks in lists (10/6/0), whispering when serious (8/4/0), accent shift under emotion (4/3/3).
20. Pragmatic repair of the voice dial: Verbosity > Repetitive & Circular (51) has 3 tagged traits; Pacing & Situation-Driven (125) carries 38 pacing tags.

### 7c. 144 concrete candidate traits
Columns: where it would go, trait name, one-line behaviour, nearest existing trait with cosine (low value = clearly new). All names and descriptions are behavioural, written in the later packs' sentence form so they splice; none involves names, appearance, clothing or looks.

| # | Where | Trait name | Behaviour (one line) | Nearest existing trait (TF-IDF cosine) |
|---:|---|---|---|---|
| 1 | Social Role > Clown (new category) | Breaks the tension on cue | Hears a silence lengthen and fills it with a prepared bit, whatever the occasion. | #183105 Laughs on cue, slightly late (0.22) |
| 2 | Social Role > Clown (new category) | Funny so nobody asks how they are | Answers every personal question with a routine and moves on before anyone can follow up. | #190407 Laughs, then asks if anyone else found it funny (0.38) |
| 3 | Social Role > Clown (new category) | Plays the fool to shield the quiet one | Takes the room's attention with a stunt when someone else is about to be put on the spot. | #1948 Busy-as-shield (0.26) |
| 4 | Social Role > Clown (new category) | Gets the laugh at their own expense in meetings | Opens a tense meeting with a joke about their own failure so the agenda can start. | #130056 Making themselves the joke first (0.33) |
| 5 | Social Role > Scapegoat (new category) | Is blamed first and defended last | Is named as the cause of any group failure before facts come in, and accepts it with a shrug. | #200411 Blames the shouting on the day (0.31) |
| 6 | Social Role > Scapegoat (new category) | Accepts the blame as a job | Volunteers a 'my fault' at the first raised voice so the real argument never starts. | #2750 Left-holding-the-blame (0.28) |
| 7 | Social Role > Scapegoat (new category) | The designated difficult one | Is described by relatives as 'the problem' in the present tense, and has started to play it. | #170861 The group's designated driver, forever (0.27) |
| 8 | Social Role > Historian (new category) | Settles disputes with the date | Ends an argument about the past with the year, the place and who said what at the table. | #93008 Follows the rule while loudly disputing it (0.27) |
| 9 | Social Role > Historian (new category) | Briefs new members on the lore | Tells newcomers the group's founding stories and who is not to be mentioned. | #1707 Rejected member (0.24) |
| 10 | Social Role > Gatekeeper (new category) | Decides who is let through | Answers 'is she free?' with a polite no and a list of reasons nobody else has seen. | #101092 Decides before the options are finished (0.23) |
| 11 | Social Role > Gatekeeper (new category) | Vets a newcomer with one question | Asks something small and decides the stranger's standing on the answer. | #1706 Newcomer (0.35) |
| 12 | Social Role > Newcomer (new category) | Says 'sorry, I'm new' as an opener | Uses the new-person apology to pre-empt every mistake and to ask for the unwritten rules. | #418 Hedge-opener (0.18) |
| 13 | Social Role > Newcomer (new category) | Learns the names from the org chart first | Studies the hierarchy before anyone speaks to them, then addresses everyone correctly and coldly. | #97100 Learns names before anyone asks (0.21) |
| 14 | Social Role > Martyr (new category) | Counts out loud what they have given up | Lists the cost of a favour at the exact moment someone thanks them. | #140202 Keeps count out loud (0.4) |
| 15 | Social Role > Martyr (new category) | Takes the worst seat so it will be noticed | Chooses the draught, the middle seat, the last portion, and waits for someone to say so. | #150132 Says the worst of it first (0.35) |
| 16 | Social Role > Martyr (new category) | Says 'don't worry about me' as an accusation | Refuses offered help in a tone that makes the offer the offence. | #915 Reassurance-tag (0.35) |
| 17 | Social Role > Lieutenant (new category) | Translates the boss to the room | Restates a vague instruction as a task list within a minute of the boss leaving. | #170875 Out-works the boss, visibly (0.32) |
| 18 | Social Role > Rival (new category) | Matches every win with a smaller one in the same breath | Responds to good news with their own similar news, one notch quieter. | #1560 Breath-holding (0.23) |
| 19 | Social Role > Rival (new category) | Congratulates with the score attached | Says 'well done' and then states what the winner needed to get there compared with them. | #99074 Congratulates people in a tone that undercuts it (0.26) |
| 20 | Values > Tradition & Rite (new category) | Does it the way it has always been done, and cannot say why | Defends an odd family procedure ('you cut it from the left') with 'we just do'. | #194702 'Let me see what I can do' (0.24) |
| 21 | Values > Tradition & Rite (new category) | Keeps the anniversary rite exactly | Observes the same small ceremony on the same date and treats a missed year as a breach. | #140350 Empty on the anniversary (0.35) |
| 22 | Values > Tradition & Rite (new category) | Distrusts anything new for a year | Treats a new tool or recipe as a guest on probation and says so. | #140572 Distrusts their own first answer (0.26) |
| 23 | Values > Tradition & Rite (new category) | Knows the order of the funeral and corrects it | Quietly rearranges the mourners into the proper sequence before the hearse. | #4740 Sequence-obsessive compulsive (0.2) |
| 24 | Values > Purity & Sanctity (new category) | Will not let two things touch | Keeps the cup, the board or the cloth apart by a rule nobody else follows. | #2097 Slightly apart (0.25) |
| 25 | Values > Purity & Sanctity (new category) | Winces at casual use of the sacred word | Visibly flinches when a holy word, a name or an anthem is used as a joke. | #4442 Sacred-object principled (0.24) |
| 26 | Values > Purity & Sanctity (new category) | Divides tasks into clean and unclean | Assigns the dishes and the bins by a private moral grammar of clean and dirty. | #170405 Get the inheritance divided before Christmas (0.21) |
| 27 | Values > Purity & Sanctity (new category) | Will not take a phone into the place | Leaves devices outside a graveyard, a kitchen or a library on principle. | #3867 Loud-phone-user (0.23) |
| 28 | Values > Autonomy & Liberty (new category) | Treats advice as an attempt at control | Hears 'have you thought about' as a move in a contest and says so. | #182301 'Have you tried turning it off?' as life advice (0.33) |
| 29 | Values > Autonomy & Liberty (new category) | Leaves any group that votes on their choices | Walks out of committees, rotas and pacts the moment their own decision is put to a show of hands. | #170768 Coordinates the neighbourhood rota (0.26) |
| 30 | Values > Care & Protection (new category) | Cannot watch a small cruelty | Says something every time a waiter, child or junior is spoken to unkindly, at any cost. | #150105 A small unpunished cruelty of their own (0.27) |
| 31 | Values > Care & Protection (new category) | Stops the joke at the vulnerable person's expense | Cuts across the table's laughter with a flat 'that's enough' and a change of subject. | #170847 Makes a joke at their own expense, then another (0.29) |
| 32 | Values > Care & Protection (new category) | Feeds the stray before the argument | Puts food down for the dog, the lodger or the stranger and then takes up the quarrel. | #2154 Rarely strays from what's expected (0.33) |
| 33 | Values > Hospitality (new category) | Makes the stranger a drink before asking a name | Treats the kettle as the first question to anyone on the doorstep. | #140271 Asks strangers personal questions (0.27) |
| 34 | Values > Hospitality (new category) | Gives the guest the good chair | Rearranges the room so the visitor sits best and is offended if they swap. | #3833 Guest-comfort prioritizer (0.29) |
| 35 | Values > Fairness (new category) | Insists the cutter chooses last | Applies a childhood rule of division to every bill, cake and chore. | #1930 Comparison-cutter (0.34) |
| 36 | Values > Fairness (new category) | Names the unequal share at the table | Says aloud that one plate is bigger, one chore longer, in a calm voice. | #110083 Insists on their own terms, never their own share (0.26) |
| 37 | Habits > Screens & Notifications (new category) | Phone face-up beside the plate | Keeps the screen visible at meals and glances at it mid-sentence without losing the thread. | #776 Phone-face-down tap (0.27) |
| 38 | Habits > Screens & Notifications (new category) | Photographs the meal before anyone eats | Holds the table's forks until the angle is right. | #150013 Steady until photographed (0.29) |
| 39 | Habits > Screens & Notifications (new category) | Reports the headline from the bath | Opens a conversation with something read an hour ago in bed. | #499 Headline-syntax (0.38) |
| 40 | Habits > Screens & Notifications (new category) | Says 'one sec' to a person and a screen | Gives the same two words to the person in front of them and to the buzzing in their pocket. | #191207 Gasps and says 'one more thing' repeatedly (0.28) |
| 41 | Habits > Work & Busyness (new category) | Answers email on holiday and calls it relaxing | Describes the laptop at the pool as the thing that makes the break possible. | #5122 Tide-pool vocabulary (0.23) |
| 42 | Habits > Work & Busyness (new category) | Describes rest as catching up | Uses weekends as the working week's overflow tank and reports on it on Monday. | #3154 Overflowing-cup words (0.24) |
| 43 | Habits > Work & Busyness (new category) | Apologises for leaving on time | Says 'sorry, I have to go' at five with a visible flinch and a reason. | #191307 Talks over, then cheerfully apologises (0.24) |
| 44 | Habits > Work & Busyness (new category) | Gets restless on Sundays | Finds a small job by ten and complains that nothing is open. | #90203 Slightly restless (0.41) |
| 45 | Habits > Gossip & Information (new category) | Releases the news in instalments | Holds back the best part of a story to control who asks for it. | #170432 Get the court fine paid in instalments (0.29) |
| 46 | Habits > Gossip & Information (new category) | Prefaces with 'I shouldn't say' | Announces the secret's weight before telling it, to the next person in line. | #1407 Apology-prefacing (0.26) |
| 47 | Habits > Gossip & Information (new category) | Reports what a third party really meant | Translates other people's remarks into their hidden intentions without being asked. | #200609 Reports back what the third party 'felt' (0.32) |
| 48 | Habits > Keeping & Collecting (new category) | Keeps every charger and carrier bag | Has a drawer for things that might be needed and a rule that nothing leaves it. | #1919 Worry-carrier (0.33) |
| 49 | Habits > Keeping & Collecting (new category) | Cannot throw away a gift | Keeps unwanted presents in the loft because the giver might ask. | #183702 Refuses to throw food away, narrates it (0.31) |
| 50 | Habits > Keeping & Collecting (new category) | Labels the loft boxes by decade | Maintains a catalogue of the past, in marker pen, and consults it at funerals. | #99050 Checks what's in the box before reading the label (0.31) |
| 51 | Motivation > The Secret (new category) | A diagnosis kept from the family | Manages every visit so the thing never comes up, and carries the lie with some pride. | #110109 Certain of the diagnosis, unsure of the treatment (0.21) |
| 52 | Motivation > The Abandoned Dream (new category) | The audition they did not go to | Describes the day in the third person and has never said why they stayed at home. | #130118 To stop auditioning for a role they already have (0.38) |
| 53 | Motivation > The Abandoned Dream (new category) | The instrument sold for rent | Corrects other people's musical errors in a flat voice and never touches a keyboard. | #170051 Plays one instrument properly (0.23) |
| 54 | Motivation > The Abandoned Dream (new category) | The manuscript in the drawer | Mentions the novel as 'something I did once' and changes the subject at the first question. | #170515 Get the novel finished before their eyesight goes (0.27) |
| 55 | Motivation > The Abandoned Dream (new category) | A scholarship declined for a sibling | Talks about the sibling's career as an investment and watches the return. | #4255 Betrayed-by-a-sibling (0.24) |
| 56 | Motivation > The Debt (new category) | A loan from an uncle never repaid | Avoids one branch of the family at weddings and over-tips everywhere else. | #130317 Treats affection as a transaction to settle (0.18) |
| 57 | Motivation > The Family Casting (new category) | Cast as the clever one and never allowed to be silly | Hears 'you're the sensible one' as a sentence and obeys it at weddings. | #1613 Exiled or cast out (0.3) |
| 58 | Motivation > The Family Casting (new category) | The one who stayed | Describes the town as a decision they make every morning. | #140632 Stays for the same reason they arrived (0.28) |
| 59 | Motivation > The Family Casting (new category) | The difficult one, by assignment | Is introduced at family events as a warning and lives up to the introduction. | #2570 Introduction-formal (0.23) |
| 60 | Motivation > Envy (new category) | Envies a friend's ordinary Tuesday | Is quietly wrecked by a photo of someone else's unremarkable kitchen. | #2848 Envied-outsider (0.38) |
| 61 | Motivation > Envy (new category) | Keeps a private ranking of the old classmates | Knows everyone's job and house from 1998 and ranks the list at reunions. | #1413 Unimpressed by rank (0.23) |
| 62 | Motivation > Pride (new category) | Proud of a skill nobody asked about | Practises something unrequested to a high standard and mentions it twice a year. | #4729 Recovery-proud substance user (0.26) |
| 63 | Motivation > Pride (new category) | Proud of never needing help | Treats going without as evidence of character and listens for the word 'thank you' as a defeat. | #4729 Recovery-proud substance user (0.24) |
| 64 | Conflict & Stress > Ritual under stress (new category) | Counts the steps to the door | Keeps a private tally while waiting for news and loses it if spoken to. | #1875 Counting-compulsive (0.34) |
| 65 | Attachment > Friendship & Family (new category) | Lets friendships lapse and is hurt when no one calls | Never initiates and keeps a mental list of who has not rung. | #90171 Courtesy without a single lapse (0.28) |
| 66 | Attachment > Friendship & Family (new category) | Keeps a friendship alive by forwarding links | Communicates affection only as articles and memes with no comment attached. | #3605 Chain-link counter (0.21) |
| 67 | Attachment > Friendship & Family (new category) | Treats a child's independence as a loss | Responds to a first sleepover with a packed bag, a rule list and a long goodbye. | #1802 Independence-guarding (0.41) |
| 68 | Attachment > Friendship & Family (new category) | Shows love by packing the bag | Expresses affection as logistics: the snack, the spare jumper, the charged phone. | #91215 Keeps a bag packed (0.41) |
| 69 | Persuasion & Influence (new section) | Asks for the small thing first | Gets a tiny yes before making the real ask, and mentions the first yes in the second. | #140083 Asks the second question (0.32) |
| 70 | Persuasion & Influence (new section) | Makes it the listener's idea | Plants a suggestion in three separate remarks until the other person proposes it. | #92214 Offers a suggestion, mildly (0.22) |
| 71 | Persuasion & Influence (new section) | Appeals to the rule instead of the person | Says 'it's policy' to a request they could have granted themselves. | #170143 Clear the name (0.24) |
| 72 | Persuasion & Influence (new section) | Guilt-trips with a smile | Delivers the reminder of what they did last time in a warm and cheerful voice. | #1547 Delayed-smile (0.27) |
| 73 | Persuasion & Influence (new section) | Cites everyone else | Says 'everyone is doing it' or 'nobody is doing it' with a straight face and no names. | #91036 'Nobody really means it' (0.29) |
| 74 | Persuasion & Influence (new section) | Offers a deal in the doorway | Waits until the other person has a coat on and then makes the real proposal. | #4747 Doorway-ritual compulsive (0.3) |
| 75 | Feedback & Praise (new section) | Gives criticism as a sandwich nobody can taste | Wraps the one problem in so much praise that the listener thinks it is a compliment. | #3755 Criticism-absorbing confident (0.27) |
| 76 | Feedback & Praise (new section) | Praises the effort, never the work | Says 'you tried so hard' about everything and the listener learns to dread it. | #170090 Praised for effort, not results (0.4) |
| 77 | Feedback & Praise (new section) | Says 'interesting' for 'no' | Uses the word as a closed door and notices who does not read it. | #160014 Flat 'no' as a complete comic form (0.27) |
| 78 | Feedback & Praise (new section) | Asks for brutal honesty and punishes it | Requests the real opinion and goes cold for a week when it arrives. | #130053 Aggressive honesty about everything else (0.38) |
| 79 | Feedback & Praise (new section) | Corrects publicly and praises in private | Fixes the error at the table and sends the kind note afterwards. | #100050 Correct in public, casual in private (0.32) |
| 80 | Feedback & Praise (new section) | Hears every note as a verdict on their worth | Replies to a minor edit with an essay on why it was meant. | #3070 Verdict-only speaker (0.28) |
| 81 | Decision Style (new section) | Asks everyone, then does the first idea | Collects opinions for a week and enacts the one they had at the start. | #1215 Opinion-forward (0.2) |
| 82 | Decision Style (new section) | Writes the pros and cons and ignores the page | Makes the list with care and decides by a feeling they refuse to name. | #186003 Anti-authority, pro-rules at home (0.26) |
| 83 | Decision Style (new section) | Cannot choose until somebody else orders | Looks at the menu until the first person gives theirs and says 'same'. | #150064 A room nobody else has a key to (0.28) |
| 84 | Decision Style (new section) | Decides in the corridor and announces it in the meeting | Settles the outcome in a private conversation and uses the meeting to ratify it. | #110132 Agrees with the room, disagrees in the corridor (0.33) |
| 85 | Hospitality & Gifts (new section) | Overfeeds the guest | Puts a second plate down before the first is empty and takes a refusal as a criticism. | #3833 Guest-comfort prioritizer (0.21) |
| 86 | Hospitality & Gifts (new section) | Leaves the receipt in the gift bag | Gives presents with the proof of purchase tucked in and a speech about returns. | #2498 Receipt-keeper (0.26) |
| 87 | Hospitality & Gifts (new section) | Insists on washing up as a guest | Fights for the sink at someone else's house and loses graciously. | #160104 Tidy for guests, not for self (0.26) |
| 88 | Greetings & Farewells (new section) | Greets everyone by full name | Says first and last name to friends at the door, as if reading a register. | #2470 First-to-wave (0.29) |
| 89 | Greetings & Farewells (new section) | Waves till the car is gone | Stays on the step with a hand up until the road is empty, regardless of weather. | #1010 Compliment-deflector (0.31) |
| 90 | Digital Voice (new section) | Sends articles instead of opinions | Forwards links with no comment and considers the case made. | #140148 Drops articles under pressure (0.31) |
| 91 | Digital Voice (new section) | Puts a smiley on bad news | Ends a message about a death or a dismissal with an emoji and means it kindly. | #110165 Formality increases with bad news (0.19) |
| 92 | Boundaries & Refusals (new section) | Says no by describing their schedule | Declines with a precise timetable of other commitments and no word of refusal. | #150035 Openness on a strict schedule (0.28) |
| 93 | Boundaries & Refusals (new section) | Cannot refuse anyone who is ill | Gives way instantly to a request wrapped in a symptom. | #196407 Offers a third cup to refuse the first (0.28) |
| 94 | Boundaries & Refusals (new section) | Says no only in writing | Replies politely to the call and refuses by email an hour later. | #194406 Takes it in writing (0.4) |
| 95 | Emotion Display Rules (new section) | Allowed to be angry, not sad | Meets grief with irritation and apologises for the tone, never for the feeling. | #170965 Was allowed to be angry (0.37) |
| 96 | Emotion Display Rules (new section) | Allowed to be sad, not angry | Weeps at the injustice and is unable to raise a voice at the person who did it. | #170965 Was allowed to be angry (0.36) |
| 97 | Emotion Display Rules (new section) | Shows pride only as a complaint | Reports a child's success as an inconvenience: 'she's insufferable now, got first'. | #3430 Pride-swallowing gulp (0.23) |
| 98 | Emotion Display Rules (new section) | Expresses love as irritation | Fusses, scolds and complains about the weather in the direction of whom they love. | #3548 Sharp-tsk irritation (0.29) |
| 99 | Emotion Display Rules (new section) | Expresses fear as jokes about the thing | Makes the same gag about the scan, the flight, the interview until the day arrives. | #110232 Expresses everything except anger (0.23) |
| 100 | Vocabulary > Pragmatic Focus | Says 'we' for their own opinion | Uses the royal or institutional we so a view cannot be argued with personally. | #1215 Opinion-forward (0.24) |
| 101 | Vocabulary > Morphological | Mixes two idioms with total confidence | Delivers 'a different kettle of cats' and carries on when corrected. | #182604 Learned the idioms like a second language (0.24) |
| 102 | Humor > Observational | Hears the innuendo in everything | Finds the second meaning in an ordinary sentence and delivers it flat, waiting for the room. | #140404 Only hears the first sentence (0.21) |
| 103 | Humor > Callback & Running Bit | Announces 'that was a joke' | Labels each joke aloud after the silence that follows. | #90363 Commits well past the joke's life (0.29) |
| 104 | Mannerisms > Emotional Affectations | Cries at kindness, not at loss | Stays dry through the bad news and comes apart when someone offers a chair. | #3646 Kindness-first responder (0.29) |
| 105 | Personality > Emotional Capacity — Guarded | Apologises for crying | Says sorry the moment their eyes fill and turns the conversation to the tissue. | #191307 Talks over, then cheerfully apologises (0.31) |
| 106 | Attachment > Disorganized | Love-bombs, then goes cold | Floods the first weeks with attention and then stops, unable to explain it. | #130111 To hear the story told back without the flinch (0.26) |
| 107 | Attachment > Avoidant | Treats the second date as a decision | Cancels at the moment a pattern would begin and calls the cancellation honesty. | #140629 Asks nothing on a first date (0.26) |
| 108 | Family Talk > Parent-Voice Echo | Talks in the eldest sibling's voice | Organises the adults round the table as if they were the younger ones. | #98271 Waits for the eldest to sit first, reflexively (0.27) |
| 109 | Romance > Courtship Speech | Says 'when we' on the first date | Speaks of the shared future in the second sentence and half notices. | #140629 Asks nothing on a first date (0.25) |
| 110 | Values > Pragmatic & Flexible | Does one good thing to excuse the next small harm | Cites a past donation or kindness as credit before doing something petty. | #2442 Excuse-me-first mover (0.26) |
| 111 | Values > Self-Interested | Redefines which cases count | Keeps the principle intact by quietly narrowing what it covers. | #5034 Definitional humorist (0.2) |
| 112 | Habits > Avoidance & Procrastination | Takes the long way round to avoid someone | Re-routes a walk, an aisle or a commute to avoid one person and a conversation. | #130204 A road they take the long way round (0.28) |
| 113 | Habits > Avoidance & Procrastination | Plans tomorrow's dinner during today's first course | Describes the next event while the current one is still on the table. | #4082 Chore-anticipating active (0.21) |
| 114 | Beliefs > Political Temperament | Ends the debate with 'I read somewhere' | Closes a dinner argument by citing an unnamed source and cannot find it. | #2563 Debate-escalator (0.25) |
| 115 | Personality > Curiosity — Situational | Learns people through their objects | Asks about the mug, the scar and the tie, and has the person's biography in ten minutes. | #97100 Learns names before anyone asks (0.23) |
| 116 | Motivation > Core Want | To be the one who found it first | Needs to spot the band, the shortcut or the fault before anyone else can name it. | #190407 Laughs, then asks if anyone else found it funny (0.33) |
| 117 | Habits > Compulsion & Ritual | Keeps the chore ledger | Knows who did which task in the house since January and can produce it. | #4082 Chore-anticipating active (0.34) |
| 118 | Habits > Risk & Escape | Texts the ex on the same night every month | Opens the old thread at the same hour, writes something, and deletes it. | #183603 Avoids the phone (0.27) |
| 119 | Personality > Honesty — Deceptive | Calls the dinner lovely | Hands out small, bright untruths to smooth every social moment and forgets them at once. | #140232 Says exactly what they think of your haircut (0.3) |
| 120 | Personality > Honesty — Deceptive | Adds one detail too many | Pads an invented story with an extra street or time and gives themselves away. | #97003 Has told the origin story so many times it's lost all detail (0.29) |
| 121 | Personality > Honesty — Deceptive | Lies about trivia | Invents their breakfast, route or age for no reason and cannot say why afterwards. | #3058 Trivia-inserter (0.24) |
| 122 | Personality > Honesty — Situational | Remembers it differently, sincerely | Revises a past version of events with complete conviction and no sign they have changed it. | #170842 Pretends to have forgotten (0.25) |
| 123 | Conflict Style > Stonewalling | Silence as a bargaining chip | Says nothing until a concession is offered, then thaws on cue. | #181101 Dates everything by where they were when (0.28) |
| 124 | Conversation Mechanics > Masking | Goes silent from embarrassment | Falls quiet after a small public mistake and does not speak until the topic changes. | #140505 Repeats themselves without embarrassment (0.32) |
| 125 | Conversation Mechanics > Storytelling (new category) | Borrows other people's stories as their own | Tells a friend's misfortune in the first person after a gap of about a year. | #190607 Delighted by other people's puns (0.27) |
| 126 | Conversation Mechanics > Storytelling (new category) | Every story returns to them | Turns any news into a parallel that happened to them, at greater length. | #140182 Restates the question (0.25) |
| 127 | Dialogue Grammar > Structural Shifts | Moves the goalposts, politely | Concedes the point and changes what the argument was about in the same breath. | #110130 Concedes to tiredness, not to argument (0.18) |
| 128 | Role by Context > Under Authority | Kisses up and kicks down | Is syrup upstairs and sandpaper downstairs and unaware of the difference. | #1662 Decision-deferrer (0.18) |
| 129 | Conversation Mechanics > Sensory Load | Takes calls in the stairwell | Leaves any loud room to answer a ringing phone and returns over-polite. | #140515 Never rehearses a phone call (0.27) |
| 130 | Conversation Mechanics > Turn-Timing | Opens every call with 'can you hear me?' | Spends the first minute of any remote call on sound, camera and a mute button. | #191100 Answers 'can you pass the salt' with yes (0.29) |
| 131 | Beliefs > Lapsed Faith | Murmurs the liturgy at a wedding they do not believe in | Knows the responses from childhood and mouths them without deciding to. | #3619 Confidential-lean-in murmur (0.24) |
| 132 | Money & Class > Class-Mobility Tells | Washes the freezer bags in the big kitchen | Keeps scarcity habits of a smaller house in a much larger one. | #91215 Keeps a bag packed (0.25) |
| 133 | Romance > Pining Tells | Shows up where the person will be by accident | Appears at the library, the market or the platform at the other's known time. | #192207 Finishes other people's sentences by accident (0.23) |
| 134 | Recovery > Apology | Says 'sorry you feel that way' | Offers the words in a form that moves the fault and is wounded when it fails. | #2179 Leans toward the riskier option (0.15) |
| 135 | Role by Context > Asking & Offering Help (new category) | Rehearses the ask until it sounds like a remark | Scripts a request so it arrives as an offhand comment that can be ignored without a refusal. | #190807 Spontaneous scripts, always sounding rehearsed (0.41) |
| 136 | Role by Context > Asking & Offering Help (new category) | Asks a stranger instead of a friend | Takes the real problem to someone with no stake in knowing them, and thanks them too much. | #186301 Rude to friends, polite to strangers (0.34) |
| 137 | Role by Context > Asking & Offering Help (new category) | Offers help in a voice that declines it | Says 'let me know if you need anything' in a tone that closes the subject. | #194702 'Let me see what I can do' (0.33) |
| 138 | Role by Context > Asking & Offering Help (new category) | Asks for the tiny version of the favour | Requests a lift to the corner when they need the airport and hopes it grows. | #110002 Friendly until asked a favour (0.25) |
| 139 | Role by Context > Asking & Offering Help (new category) | Asks in the third person | Says 'someone would need to move this' while looking at one person. | #200506 Speaks only in third person (0.27) |
| 140 | Vocabulary > Therapy-speak & Wellness Register (new category) | Names your feeling for you | Opens with 'it sounds like you're feeling' and is unmoved when the guess is wrong. | #96224 Names the feeling under the feeling (0.28) |
| 141 | Vocabulary > Therapy-speak & Wellness Register (new category) | Ends the argument by holding space | Announces they are 'holding space' and falls silent, which the other person hears as a verdict. | #1905 Silent authority (0.24) |
| 142 | Vocabulary > Therapy-speak & Wellness Register (new category) | Says 'triggered' about small things | Applies a trauma word to a loud chair and means it only half literally. | #140606 Takes things literally when tired (0.18) |
| 143 | Vocabulary > Therapy-speak & Wellness Register (new category) | Prefaces vulnerability with 'my therapist says' | Delivers a personal admission as a quotation from someone paid to hear it. | #1407 Apology-prefacing (0.19) |
| 144 | Vocabulary > Therapy-speak & Wellness Register (new category) | Cannot say 'therapy' without a joke | Reaches for a gag every time the word, or the idea, comes near. | #1821 Literal-minded gag (0.19) |

---
## 8. Top-10 recommendations (ordered by value per unit of effort)

1. **Fix the 598 literal `<i>(...)</i>` examples** (balance 169, gaps 207, growth 124, tails2 59, conflict 39). `escHTML` escapes them, so sheets show raw tags. Either strip the markup in the data (convert to "(...)" like the other 2,420 stage directions) or render a whitelisted `<i>`. One regex, 6% of the bank. (`a5i_markup.js`)
2. **Decide the default status of the 13 off-by-default sections (1,104 traits, 11.2%)**, which no default sheet can ever draw. Cheapest options: give each a share of the wildcard slot, add 1-2 optional "texture" slots that pull one trait from a rotating off-by-default section, or surface them as a one-click "More depth" preset. Today D reach is 59.4% of the bank; enabling all raises the union to 96.3%.
3. **Give every trait a splice-safe short form** (a `tag` or `phrase` field, 4-6 words, noun-phrase style) and use it in "They are X and also Y" frames. 57% of live seated-contradiction lines contain a clause or hyphen-label name that breaks the frame; 1,175 names carry sentence punctuation, 1,375 are over 40 characters.
4. **Resolve the two naming conventions.** Core is 2-word hyphen labels ("Cascade-speech", 465 "X-Y speaker/user/giver" names); the newer packs are sentence-form. Pick one for display, rename or alias the 836 category-echo names ("... discipliner vice" x10, "... freezer", "... leader") and the 4,118 hyphen-glued names, in order of frequency on sheets (Personality first: 2,398 traits, 30.7% of the sheet).
5. **Untagged voice-texture traits need polarity** (Mannerisms 69% untagged, Grammar 61%, Vocabulary 59%; 1,612 of the 2,461 untagged traits, and 325 of the 363 never-drawn). Tag them (with the existing inference tool as a first pass; inferred coverage is only 43.8-49.3% for these three) so the sliders can reach them; target >= 75% tagged in each. Only 38 of the 125 "Pacing & Situation-Driven" traits carry a pacing tag; add them to the rest.
6. **Grow the thin poles and dials**: low-energy loud (19 traits at i4-5), slow pacing loud (4 at i4, 0 at i5), casual register at loud intensity, curiosity- loud (31), pos- loud (49), vol+ quiet (48 at i1-2); and fix the register dial (own slot untagged 66% at -100) and composure (d 1.17). Add ~30 traits per thin pole.
7. **Re-differentiate or merge ~60 duplicates** (26 exact-1.00 name pairs, 8 shared example lines, "answers only the question asked" x4; the old-versus-rewrite pairs #2549/#3782, #3779/#3819/#2569 and others) and lower the threshold of the engine's `nearDuplicateIndex`, which currently finds 0 while Jaccard/TF-IDF finds 256 pairs at cosine >= 0.5. Add the 8 shared-example fixes immediately.
8. **Add the missing categories** from section 7b in this order: Emotion display rules, Asking and offering help, Feedback and praise, Persuasion and influence, Decision style, Boundaries and refusals, Greetings and farewells, Storytelling mechanics, Grief and loss talk, then new categories in Social Role (Clown, Scapegoat, Gatekeeper, Martyr, Rival...), Values (Tradition, Purity, Autonomy, Fairness, Care) and Motivation (Abandoned Dream, Pride, Envy, Family Casting). The 144 drafts in 7c are ready to review; 31 weaker drafts were already dropped.
9. **Flatten the rarity x intensity coupling** (V 0.489; milestone targets 0.60 and 0.55 are already met, the next target should be about 0.40): populate quiet-signature (332 bank-wide; signature x i1 empty in Verbosity, Social Role, Habits, Conflict & Stress), loud-common (378) and uncommon-i5 (38; distinctive-i5 18). The empty-cell list is in section 2; Conflict Style (V 0.82, 9 empty cells) and Ordinary Texture (V 0.12 but 9 empty cells) first.
10. **Metadata and review debt**: 93.8% of traits are unreviewed and the backlog grew by 506 since the last audit; review at least the 2,380 traits in packs with 0% reviewed (situational, tails, depth, balance, tails2, gaps, growth, conflict), starting with the sensitive-wording list in 5d (rename "Simple-minded" x3 and "Dimwitted about jokes at their expense" to behavioural forms, "Genuinely-unhinged absurd", the eight stutter names, "Functional drinker", the clinical labels) and the 910 absolute-sounding descriptions at low intensity. Add worldTags beyond the current 175 (1.8%; industrial and futuristic have 0) so a setting can exclude modern-world references; and restore the 24 duplicate WEIGHT_MATRIX keys (bug owner) so the category cross-links reach Mannerisms, Vocabulary and Grammar.

### Also noteworthy (not in the top 10)
- Spelling: UK -ise 718 vs US -ize 217; colour/color nearly 1:1 in the core (decide a locale convention).
- Over-concentrated sheet slots: Contradiction Functions (128 traits, 2.33 slots/sheet) puts the same few traits on 5-6% of sheets each ("Obeys the uniform, defies the person" 6.3%); Motivation (468 traits for 7 slots, 16% of the sheet) is the most over-weighted section while Verbosity and Grammar (548/592 traits for 1 slot each) are the least, giving 16% / 47% reach at defaults.
- Category-size spread: 80 categories at 14-24 traits vs a 127-trait maximum; the 14-trait Conflict Style categories fill only 5-8 of the 20 rarity x intensity cells.
- The 3,874 single-tag traits and 172 traits tagged on 4+ axes mean polarity is a mix of precise and diffuse pulls; consider a weight on the tag.

---
## Appendix: scripts and raw outputs (all under `scratchpad/bank/`)
| Area | Script | Output |
|---|---|---|
| Loader | `lib.js` (wraps `tests/harness.js loadEngine()`) | |
| 1 Inventory | `a1_inventory.js`, `a1b_shape.js`, `a9_tables.js` | `a1_out.txt`, `a1b_out.txt`, `tables.md`, `studio-coverage.txt` |
| 2 Grid / V | `a1_inventory.js`, `a2b_cells.js` | `a1_out.txt`, `bank-report.txt` |
| 3 Polarity / sliders | `a3_polarity.js`, `a8_sliders.js`, `a8b_extreme_depth.js` | `a3_out.txt`, `a8_out.txt`, `a8b_out.txt`, `sliders.json`, `extreme_depth.json`, `pol_axrows.json` |
| 4 Duplicates | `a4_dups.js`, `a4b_tfidf.js` | `a4_out.txt`, `a4b_out.txt`, `dups.json`, `tfidf_pairs.json` |
| 5 Text form | `a5_form.js`, `a5b_templates.js`, `a5c_sensitive.js`, `a5d_typos.js`, `a5e_sample.js`, `a5f_splice.js`, `a5g_leak.js`, `a5h_splice_live.js`, `a5i_markup.js` | `a5_out.txt`, `a5b_out.txt`, `a5c_out.txt`, `a5d_out.txt`, `a5e_sample.txt`, `a5f_out.txt`, `a5g_out.txt`, `a5h_out.txt`, `forms.json` |
| 6 Reach / metadata | `a6_reach.js`, `a6b_report.js`, `a6c_kitchen.js`, `a6d_conflicts.js`, `a6e_union2.js`, `a6f_meta.js`, `a6g_never.js` | `a6b_out.txt`, `a6e_out.txt`, `reach.json`, `reach2.json`, `never_drawn.json`, `never_union2.json`, `studio-misc.txt` |
| 7 Concept gaps | `a7_concepts.js`, `a7b_candidates.js`, `a7c_nearest.js`, `a7d_near2.js`, `a10_gaps.js`, `a10b_newsec.js` | `a7_out.txt`, `a7b_out.txt`, `a7c_out.txt`, `a7d_out.txt`, `concepts.json`, `candidates*.json`, `cands2*.json`, `gaps_table.md`, `a10b_out.txt` |
| Tables | `gen_blocks.js` | `blocks.json` |
Not completed: `a6_run.txt` (the interrupted 32k-build reach run) is superseded by `a6b_out.txt` and `a6e_out.txt`, which together cover 32,912 builds across seven regimes.
