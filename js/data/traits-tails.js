/* ============================================================================
   TAIL & THIN-CATEGORY FILL — v3
   ----------------------------------------------------------------------------
   THE INTENSITY TAILS. The supplements filled the 1/4/5 tails broadly, but the
      largest voice categories still ended up with only two or three entries at
      intensity 5 — Structural Shifts had 93 traits and 2 of them at i5, Register &
      Formality 77 and 2. So a user who pushes a slider to 100 draws from a pool of
      two or three, which is exactly the "every extreme setting returns the same
      handful" complaint the whole continuous-range engine was built to solve. More
      mid-range material would not have touched it; only tail material does.

   ids start at 120000.
   ========================================================================== */
const TRAITS_TAILS = [

/* ---------- Intensity tails: Dialogue Grammar :: Structural Shifts ---------- */
{id:120121,section:"Dialogue Grammar Traits",category:"Structural Shifts",trait:"One clause arrives out of order",desc:"A single inversion per conversation, easily missed and never repeated.",example:"Tired, I was, by then.",intensity:1,rarity:"common",pol:{}},
{id:120122,section:"Dialogue Grammar Traits",category:"Structural Shifts",trait:"Occasionally answers before the question ends",desc:"Now and then the reply overlaps the last few words of the ask.",example:"Do you want me to — Yes.",intensity:1,rarity:"common",pol:{}},
{id:120123,section:"Dialogue Grammar Traits",category:"Structural Shifts",trait:"A single restarted sentence per exchange",desc:"One clean rebuild, once, and everything else runs straight through.",example:"We should — no. Let's go tomorrow.",intensity:1,rarity:"common",pol:{}},
{id:120124,section:"Dialogue Grammar Traits",category:"Structural Shifts",trait:"Speaks entirely in subordinate clauses",desc:"Never produces a main verb; every utterance hangs off a sentence that never comes.",example:"Which is why, given all that, and after everything —",intensity:5,rarity:"signature",pol:{}},
{id:120125,section:"Dialogue Grammar Traits",category:"Structural Shifts",trait:"Every statement inverts before it lands",desc:"Word order is reliably, disorientingly rearranged in all circumstances.",example:"Cold, this room is. Sit, you should.",intensity:5,rarity:"signature",pol:{}},
{id:120126,section:"Dialogue Grammar Traits",category:"Structural Shifts",trait:"Sentences nest four deep and never close",desc:"Opens clause inside clause until the original thought is unrecoverable.",example:"The man who sold it — the one whose brother, the one from the yard —",intensity:5,rarity:"signature",pol:{}},

/* ---------- Intensity tails: Vocabulary :: Register & Formality Spectrum ---------- */
{id:120127,section:"Vocabulary Traits",category:"Register & Formality Spectrum",trait:"One borrowed formal word",desc:"Keeps a single elevated term in otherwise ordinary speech.",example:"It's a nuisance. A genuine impediment, actually.",intensity:1,rarity:"common",pol:{form:1}},
{id:120128,section:"Vocabulary Traits",category:"Register & Formality Spectrum",trait:"Slightly stiffer in the first sentence",desc:"Opens every conversation a notch above where it settles.",example:"Good afternoon. — Right, so, anyway.",intensity:1,rarity:"common",pol:{man:1}},
{id:120129,section:"Vocabulary Traits",category:"Register & Formality Spectrum",trait:"Drops one contraction per paragraph",desc:"Speaks casually except for an occasional, unexplained full form.",example:"I do not think so. Anyway, it's fine.",intensity:1,rarity:"common",pol:{}},
{id:120130,section:"Vocabulary Traits",category:"Register & Formality Spectrum",trait:"Speaks as though being transcribed",desc:"Every sentence built for the record, in all settings, without exception.",example:"For the avoidance of doubt: I declined, and I decline now.",intensity:5,rarity:"signature",pol:{man:1,form:1}},
{id:120131,section:"Vocabulary Traits",category:"Register & Formality Spectrum",trait:"Register so low it excludes half the room",desc:"Speech pitched permanently in a private, coarse vernacular nobody else shares.",example:"(four words in, and only two people are still following)",intensity:5,rarity:"signature",pol:{man:-1}},
{id:120132,section:"Vocabulary Traits",category:"Register & Formality Spectrum",trait:"Formality has entirely replaced warmth",desc:"So thoroughly correct that intimacy has become structurally impossible.",example:"(has addressed his own wife as 'madam' for six years, and means it)",intensity:5,rarity:"signature",pol:{man:1,warm:-1}},

/* ---------- Intensity tails: Verbosity :: Stylized & Elaborate ---------- */
{id:120133,section:"Verbosity Traits",category:"Stylized & Elaborate",trait:"One image per conversation",desc:"Reaches for a single figurative flourish and otherwise speaks plainly.",example:"It went like a dropped plate. Anyway.",intensity:1,rarity:"common",pol:{form:1}},
{id:120134,section:"Verbosity Traits",category:"Stylized & Elaborate",trait:"Slightly formal sentence shapes",desc:"Constructions a shade more shaped than the room, and no more than that.",example:"There is, I think, a simpler way through this.",intensity:1,rarity:"common",pol:{form:1}},
{id:120135,section:"Verbosity Traits",category:"Stylized & Elaborate",trait:"Occasional deliberate word",desc:"Now and then picks a noticeably better word and lets it sit there.",example:"It was a squalid business. — A what? — You heard.",intensity:1,rarity:"common",pol:{form:1}},
{id:120136,section:"Verbosity Traits",category:"Stylized & Elaborate",trait:"Cannot deliver information without ornament",desc:"Every practical fact arrives inside a constructed image, always.",example:"The eight-fifteen is a rumour dressed as a timetable.",intensity:5,rarity:"signature",pol:{form:1}},
{id:120137,section:"Verbosity Traits",category:"Stylized & Elaborate",trait:"Speech has become entirely liturgical",desc:"Cadence, repetition and formal structure applied to everything, including a shopping list.",example:"Bread, and salt, and the small blue tin, and nothing else besides.",intensity:5,rarity:"signature",pol:{form:1}},
{id:120138,section:"Verbosity Traits",category:"Stylized & Elaborate",trait:"Style has outgrown any listener",desc:"Constructions so elaborate that nobody has understood them in years, and they continue.",example:"(four subordinate images before the verb; the room has stopped trying)",intensity:5,rarity:"signature",pol:{form:1}},

/* ---------- Intensity tails: Verbosity :: Pacing & Situation-Driven ---------- */
{id:120139,section:"Verbosity Traits",category:"Pacing & Situation-Driven",trait:"A fraction slower with strangers",desc:"Marginally more measured with anyone new, and back to normal within a day.",example:"(the first meeting is always a half-step behind)",intensity:1,rarity:"common",pol:{}},
{id:120140,section:"Verbosity Traits",category:"Pacing & Situation-Driven",trait:"Quickens slightly when interested",desc:"A small, easily missed acceleration when the subject genuinely engages them.",example:"(you'd have to know them well to hear it)",intensity:1,rarity:"common",pol:{pace:1}},
{id:120141,section:"Verbosity Traits",category:"Pacing & Situation-Driven",trait:"One long pause per conversation",desc:"Takes a single noticeable beat somewhere, reliably, and never more.",example:"(three seconds, once, and then straight on)",intensity:1,rarity:"common",pol:{}},
{id:120142,section:"Verbosity Traits",category:"Pacing & Situation-Driven",trait:"Tempo is entirely dictated by the listener",desc:"Matches whoever they're speaking to so exactly that they have no rhythm of their own.",example:"(unrecognisable across two conversations in the same hour)",intensity:5,rarity:"signature",pol:{}},
{id:120143,section:"Verbosity Traits",category:"Pacing & Situation-Driven",trait:"Pace inverts under any observation",desc:"Fast in private and glacially slow the instant anyone might be assessing them.",example:"(fluent on the phone; four words a minute in the interview)",intensity:5,rarity:"signature",pol:{}},
{id:120144,section:"Verbosity Traits",category:"Pacing & Situation-Driven",trait:"Speed is the only signal they have left",desc:"All emotional information is carried in tempo alone; the words never change.",example:"(the same eight phrases, at wildly different speeds, meaning wildly different things)",intensity:5,rarity:"signature",pol:{}},

/* ---------- Intensity tails: Dialogue Grammar :: Repetition & Echo Patterns ---------- */
{id:120145,section:"Dialogue Grammar Traits",category:"Repetition & Echo Patterns",trait:"Repeats the last word once in a while",desc:"An occasional single echo, more habit than pattern.",example:"Tuesday? Tuesday. Fine.",intensity:1,rarity:"common",pol:{}},
{id:120146,section:"Dialogue Grammar Traits",category:"Repetition & Echo Patterns",trait:"Every sentence is said twice",desc:"Complete, verbatim duplication of each utterance, in all circumstances.",example:"The gate's open. The gate's open.",intensity:5,rarity:"signature",pol:{}},
{id:120147,section:"Dialogue Grammar Traits",category:"Repetition & Echo Patterns",trait:"Echoes the other speaker before answering",desc:"Cannot reply without first repeating what was said to them, entire.",example:"'Where were you last night.' Where was I last night. I was here.",intensity:5,rarity:"signature",pol:{}},
{id:120148,section:"Dialogue Grammar Traits",category:"Repetition & Echo Patterns",trait:"One phrase has colonised everything",desc:"A single construction now appears in essentially every sentence they produce.",example:"In point of fact — in point of fact — no, in point of fact —",intensity:5,rarity:"signature",pol:{}},

/* ---------- Intensity tails: Vocabulary :: Pragmatic Focus & Speech Functions ---------- */
{id:120149,section:"Vocabulary Traits",category:"Pragmatic Focus & Speech Functions",trait:"Adds one qualifier to requests",desc:"A single small softener attached to anything they ask for.",example:"When you get a chance — no rush.",intensity:1,rarity:"common",pol:{}},
{id:120150,section:"Vocabulary Traits",category:"Pragmatic Focus & Speech Functions",trait:"Every sentence is positioning",desc:"No utterance is ever merely informational; all of it is manoeuvre.",example:"(said it in front of witnesses. That was the point of saying it.)",intensity:5,rarity:"signature",pol:{hon:-1}},
{id:120151,section:"Vocabulary Traits",category:"Pragmatic Focus & Speech Functions",trait:"Speech has become entirely contractual",desc:"Talks exclusively in terms, conditions and obligations, including at home.",example:"If I do that, what am I owed, and by when?",intensity:5,rarity:"signature",pol:{warm:-1}},
{id:120152,section:"Vocabulary Traits",category:"Pragmatic Focus & Speech Functions",trait:"Asks for nothing, ever, by construction",desc:"Grammar itself has been rebuilt to make a direct request impossible.",example:"One wonders whether the window might not be closed at some stage.",intensity:5,rarity:"signature",pol:{asrt:-1}},

/* ---------- Intensity tails: Motivation & Wound ---------- */
{id:120153,section:"Motivation & Wound",category:"Core Want (conscious goal)",trait:"One uninterrupted afternoon",desc:"Wants something so small that nobody believes it's the real answer.",example:"An afternoon. Nothing in it. That's the whole ambition.",intensity:1,rarity:"common",pol:{act:-1}},
{id:120154,section:"Motivation & Wound",category:"Core Want (conscious goal)",trait:"The want has consumed every other part of the life",desc:"Nothing remains that isn't in service of the goal; there is no person left outside it.",example:"There's no version of me that isn't doing this. I checked.",intensity:5,rarity:"signature",pol:{disc:1}},
{id:120155,section:"Motivation & Wound",category:"Core Want (conscious goal)",trait:"Wants one specific person to say one specific sentence",desc:"An entire life organised around a single acknowledgement that may never come.",example:"He has to say it. Not mean it. Say it.",intensity:5,rarity:"signature",pol:{ego:1}},
{id:120156,section:"Motivation & Wound",category:"Core Fear (what they flee)",trait:"Mild dread of being the last to know",desc:"A small, manageable unease about being outside the loop.",example:"Was there an email? Was there an email I missed?",intensity:1,rarity:"common",pol:{}},
{id:120157,section:"Motivation & Wound",category:"Core Fear (what they flee)",trait:"Terror of turning into the person who raised them",desc:"Every decision is measured against one specific inherited outcome and made to avoid it.",example:"I heard his voice come out of me. I had to sit down.",intensity:5,rarity:"signature",pol:{mood:-1}},
{id:120158,section:"Motivation & Wound",category:"Core Fear (what they flee)",trait:"Fear of being known has organised the whole life",desc:"Every arrangement — home, work, friendships — is built to prevent real disclosure.",example:"(nobody has all four facts. Nobody will.)",intensity:5,rarity:"signature",pol:{emo:-1,warm:-1}},
{id:120159,section:"Motivation & Wound",category:"Core Wound (the old injury)",trait:"A small early humiliation never quite shaken",desc:"Something minor that shouldn't still matter and demonstrably does.",example:"It was a school corridor. Thirty years ago. I know.",intensity:1,rarity:"common",pol:{ego:-1}},
{id:120160,section:"Motivation & Wound",category:"Core Wound (the old injury)",trait:"Survived something nobody else did",desc:"The defining fact of their life is that they are the one still here, and they know why they aren't grateful.",example:"There were nine of us. There's one.",intensity:5,rarity:"signature",pol:{mood:-1,emo:1}},
{id:120161,section:"Motivation & Wound",category:"Core Wound (the old injury)",trait:"Was believed by nobody when it counted",desc:"Told the truth once, to the people who mattered, and was not believed — and has never recovered it.",example:"I said it. Out loud. To all of them. Nothing happened.",intensity:5,rarity:"signature",pol:{hon:1,warm:-1}},
{id:120162,section:"Motivation & Wound",category:"The Lie They Believe",trait:"Quietly assumes they're slightly behind",desc:"A low-grade conviction that everyone else got a head start.",example:"They've all read something I haven't.",intensity:1,rarity:"common",pol:{ego:-1}},
{id:120163,section:"Motivation & Wound",category:"The Lie They Believe",trait:"'If I stop holding it together, everyone falls'",desc:"Total, unexamined conviction that they are the only load-bearing element in every room.",example:"I can't put it down. You've all seen what happens when I put it down.",intensity:5,rarity:"signature",pol:{disc:1,emo:-1}},
{id:120164,section:"Motivation & Wound",category:"The Lie They Believe",trait:"'Being loved is a bill that comes due'",desc:"Absolute belief that affection is a debt, and that the invoice always arrives.",example:"Nobody gives you that for free. Nobody ever has.",intensity:5,rarity:"signature",pol:{warm:-1,hon:-1}},

/* ---------- Intensity tails: Attachment & Intimacy Style :: Anxious ---------- */
{id:120165,section:"Attachment & Intimacy Style",category:"Anxious",trait:"Checks in once more than necessary",desc:"A single extra message or call, reliably, and no further than that.",example:"Just making sure you got back all right.",intensity:1,rarity:"common",pol:{}},
{id:120166,section:"Attachment & Intimacy Style",category:"Anxious",trait:"Cannot be alone in the house without narrating it",desc:"Any solitude is immediately reported to whoever is absent, at length.",example:"(nine messages between six and nine, describing an empty room)",intensity:5,rarity:"signature",pol:{ego:-1,emo:1}},
{id:120167,section:"Attachment & Intimacy Style",category:"Anxious",trait:"Every closed door is a verdict",desc:"Reads any ordinary withdrawal as the beginning of the end, every time, without exception.",example:"You went upstairs. You went upstairs without saying anything.",intensity:5,rarity:"signature",pol:{ego:-1,emo:1}},

/* ---------- Intensity tails: Mannerisms :: Environmental Interaction ---------- */
{id:120168,section:"Mannerisms",category:"Environmental Interaction Mannerisms",trait:"Straightens one thing on arrival",desc:"Adjusts a single object in any room they enter, once, and then leaves it alone.",example:"(the picture, every time, by about an inch)",intensity:1,rarity:"common",pol:{}},
{id:120169,section:"Mannerisms",category:"Environmental Interaction Mannerisms",trait:"Rearranges any room they spend an hour in",desc:"Cannot leave a space as they found it; furniture moves, permanently.",example:"(the sofa is not where it was this morning)",intensity:5,rarity:"signature",pol:{disc:1}},
{id:120170,section:"Mannerisms",category:"Environmental Interaction Mannerisms",trait:"Dismantles whatever is within reach",desc:"Every object in arm's length ends up in pieces on the table by the end of a conversation.",example:"(the pen is now four separate items and he hasn't noticed)",intensity:5,rarity:"signature",pol:{}},

/* ---------- Intensity tails: Mannerisms :: Tactile & Prop Handling ---------- */
{id:120171,section:"Mannerisms",category:"Tactile & Prop Handling",trait:"Turns one object over once while thinking",desc:"A single, small manipulation at a pause, and nothing else.",example:"(the coin goes over in the fingers, once, and stops)",intensity:1,rarity:"common",pol:{}},
{id:120172,section:"Mannerisms",category:"Tactile & Prop Handling",trait:"Never once speaks with empty hands",desc:"Physically cannot hold a conversation without an object to work; will find one.",example:"(picked up a stranger's lighter to finish the sentence)",intensity:5,rarity:"signature",pol:{}},
{id:120173,section:"Mannerisms",category:"Tactile & Prop Handling",trait:"Handles everything as though appraising it",desc:"Every object they touch is weighed, turned and assessed, including other people's.",example:"(your cup has been evaluated and returned)",intensity:5,rarity:"signature",pol:{}},
];

TRAITS.push(...TRAITS_TAILS);

TRAIT_PACKS.push({id:"tails", label:"Intensity tail fill", version:"1", ids:[120000, 129999],
  applicability:{era:"any", realism:"any", tone:"any"}, blurb:"The i1/i5 tail fill."});
