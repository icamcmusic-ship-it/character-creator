/* ============================================================================
   THE GAP SECTIONS — 2026 audit §6, "Gaps in the trait database"
   ----------------------------------------------------------------------------
   Keyword hit counts over 8,412 traits found whole dimensions of how people talk
   almost absent: romance (3 hits), politics (16), code-switching (19), faith (29),
   generation (40), professional jargon (62). This pack fills them.

   Where each gap went, and why:

     NEW OPTIONAL PROFILE SECTIONS (registered in engine.js PROFILE_SECTIONS, shipped
     defaultOn:false so the default sheet does not grow — each has a toggle, a type
     selector and a weight, and is drawn the moment the user wants it). These are
     facts a writer CHOOSES about a character; a random draw of "medical jargon" onto
     every sheet would be noise, not texture.
       Romance & Desire                 flirting, courtship speech, jealousy, pining
       Dialect & Linguistic Background  region, code-switching, second language,
                                        heritage vocabulary, class register, and the
                                        four generational categories
       Beliefs & Worldview              faith practice, lapsed faith, superstition,
                                        political temperament, conspiracy-adjacent,
                                        secular rituals
       Occupational Jargon              medical, military, legal, kitchen & trade,
                                        tech, academic, service
       Conversation Mechanics           literal uptake, info-dumping, scripted speech,
                                        turn-timing, sensory load, masking — written as
                                        BEHAVIOURS, never as diagnoses; nothing here
                                        names a condition, and every category has
                                        entries any person might show
       Body in Speech                   pain, hearing & sight, medication, breath &
                                        stamina, stammer — how a body shows up in talk
       Money & Class                    thrift, status signalling, money taboo,
                                        class-mobility tells
       Fears & Aversions                concrete phobias, social dreads, bodily
                                        aversions — Core Fear stays the abstract one
       Family Talk                      how much, and how, family enters conversation

     CATEGORIES IN EXISTING SECTIONS
       Humor Style        eight subtypes (observational … doesn't get jokes)
       Mannerisms         polarised gaze / proxemics / touch / posture, added to the
                          EXISTING categories so the Mannerisms draw is not diluted
       Contradiction Functions   grown toward ~100, plus two new categories
                                 (Strategic Politeness, Concealment)

   House rules kept: every entry polarised where it genuinely leans; rarity and
   intensity deliberately decoupled (quiet-signature and loud-common are written on
   purpose); reviewStatus "unreviewed" until a human pass.

   IDS: each category owns a block of 100 (base + index). APPEND ONLY within a block —
   an id is how a saved character refers to its trait, so never reorder or delete a
   row; retire it by flagging instead. Pack range 180000–189999.
   ========================================================================== */
const TRAITS_GAPS = (function(){
  const R = {c:"common", u:"uncommon", d:"distinctive", s:"signature"};
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const out = [];
  /* Where each category's behaviour is live, as TRAIT_CONTEXTS. Authored per category
     rather than per row: it says which rooms the behaviour belongs to, which is what the
     context lens reads, and a row that knows better sets its own `conditions`. */
  const COND = {
    "Flirting Style":["intimacy","public"], "Courtship Speech":["intimacy","private"], "Jealousy Tells":["intimacy","private"], "Pining Tells":["private","peer"],
    "Regional Features":["public","home"], "Code-Switching":["public","home","authority"], "Second-Language Speaker":["public","stranger"],
    "Heritage Vocabulary":["home","private"], "Class Register Shift":["public","authority"], "Dated Slang":["peer"], "Youth Register":["peer"],
    "Era References":["peer","home"], "Tech Vintage":["home"],
    "Faith Practice":["private","public"], "Lapsed Faith":["private"], "Superstition":["threat","private"], "Political Temperament":["public","peer"],
    "Conspiracy-Adjacent":["peer"], "Secular Rituals":["home"],
    "Medical":["work","peer"], "Military":["work","threat"], "Legal":["work","peer"], "Kitchen & Trade":["work","peer"], "Tech":["work","peer"],
    "Academic":["work","peer"], "Service":["work","stranger"],
    "Literal Uptake":["stranger","public"], "Info-Dumping":["peer","private"], "Scripted Speech":["stranger","authority"], "Turn-Timing":["public","peer"],
    "Sensory Load":["public","fatigue"], "Masking":["public","stranger","work"],
    "Pain & Fatigue":["fatigue","public"], "Hearing & Sight":["public"], "Medication & Management":["private"], "Breath & Stamina":["fatigue"],
    "Stammer & Speech Blocks":["public","stranger","authority"],
    "Thrift Talk":["home"], "Status Signalling":["public","stranger"], "Money Taboo":["peer","private"], "Class-Mobility Tells":["public","authority"],
    "Phobias":["threat"], "Social Dreads":["public","stranger"], "Bodily Aversions":["threat","private"],
    "Talks About Family Constantly":["peer","home"], "Never Mentions Family":["peer","stranger"], "Sibling Rivalry":["home"], "Parent-Voice Echo":["home","dependent"],
    "Observational":["public","peer"], "Pun-Groaner":["peer"], "Callback & Running Bit":["peer","private"], "Gallows":["threat","work"],
    "Physical & Slapstick":["public"], "Teasing as Affection":["private","peer"], "Laughs at Own Jokes":["public"], "Doesn't Get Jokes":["public","stranger"],
    "Eye & Facial Expressions":["public"], "Social & Boundary Mannerisms":["peer","stranger"], "Postural & Spatial Dynamics":["public"], "Gestural & Kinetic Integration":["public"],
    "Protective Hypocrisy":["intimacy","dependent"], "Aspirational Values":["private"], "Exceptions & Detachment":["work","intimacy"],
    "Strategic Politeness":["public","authority"], "Concealment":["private","public"],
  };
  /* block(section, category, baseId, rows[, shared])
     row: [trait, desc, example, intensity, rarityKey, pol, extra?] */
  function block(section, category, base, rows, shared){
    rows.forEach((r, i) => {
      const [trait, desc, example, intensity, rk, pol, extra] = r;
      const sh = Object.assign({}, shared || {}); const shPol = sh.pol; delete sh.pol;
      out.push(Object.assign({
        id: base + i, section, category, trait, desc, example, intensity,
        rarity: R[rk], pol: Object.assign({}, shPol || {}, pol || {}), conceptFamily: "gaps-" + slug(trait), reviewStatus: "unreviewed"
      }, COND[category] ? {conditions: COND[category].slice()} : {}, sh, extra || {}));
    });
  }

/* =====================================================================
   ROMANCE & DESIRE
   ===================================================================== */
const ROM = "Romance & Desire";
block(ROM, "Flirting Style", 180000, [
  ["Flirts by arguing","Picks a fight about something trivial with exactly the person they like, and enjoys losing it.","That is objectively the wrong way to eat an orange. No — show me again. Wrong again.",3,"c",{agr:-1}],
  ["Goes formal around the person they like","Politeness hardens into near-ceremony the moment attraction is in play; everyone else gets the casual version.","Good evening. I trust the — the traffic was acceptable.",3,"d",{emo:-1}],
  ["Compliments the choice, never the person","Praises the jacket, the book, the order at the bar — never the face.","That's a very good pick. The wine. You picked well.",2,"u",{emo:-1}],
  ["Remembers the throwaway detail","Weeks later, returns a thing mentioned once in passing, as if it were nothing.","You said you'd never had a proper custard tart. So. (sets one down, leaves)",2,"s",{emo:1}],
  ["Flirts entirely through teasing","Every signal is wrapped in mockery; sincerity would feel like standing naked in a car park.","Oh, you dressed up. For me? Tragic.",3,"c",{emo:-1,agr:-1,form:-1}],
  ["Openly, cheerfully direct","Says the interested thing plainly, once, and then lets it sit without pressing.","I like you. Not an emergency. Just thought you should have the information.",4,"u",{asrt:1,hon:1,emo:1}],
  ["Flirts with everyone equally","Warmth distributed so evenly that nobody can tell who, if anyone, it means.","(the same lingering smile for the barman, the date and the coat-check)",3,"c",{hon:-1}],
  ["Signals by offering practical help","Interest arrives as a fixed shelf, a lift, a spare charger — never as a sentence.","Your tyre's low. I've got a pump in the car. It's no bother. It's — no bother.",1,"d",{emo:-1,act:1}],
  ["Flirts in quotation","Lets a poem, a lyric or a film line do the saying so it can be disowned if it misses.","'Here's looking at' — anyway. Anyway, that's a film. Old film.",3,"d",{emo:-1}],
  ["Escalates the stakes of a bet","Turns small wagers into pretexts: loser buys dinner, loser drives, loser comes to the wedding.","Double or nothing. If I'm right, you're my plus-one. If you're right — also plus-one.",4,"u",{rebel:1,asrt:1}],
  ["Can't flirt, knows it, announces it","Pre-apologises for their own clumsiness in a way that ends up being the charm.","I'm going to attempt a compliment now. Brace. — Your hands. Good hands. Oh no.",4,"s",{ego:-1,hon:1,emo:1}],
  ["Flirts by asking unusually good questions","Interest shows as attention: follow-ups that prove they were listening.","Wait, go back — why did you stop painting? You said 'stopped', not 'gave up'.",2,"u",{cur:1}],
  ["Weaponised eye contact","Holds a gaze a beat past comfortable and lets the silence do the work.","(says nothing. Keeps looking. Smiles only when the other person looks away first.)",5,"s",{asrt:1,ego:1,vol:-1}],
  ["Treats attraction as a negotiation","Lays out terms, schedules, expectations — romantic interest as a contract to be scoped.","Realistically I can do Thursdays. I don't do brunch. Is that a dealbreaker?",4,"d",{emo:-1}],
  ["Flirts only once it can't be refused","Waits until the signal back is unmistakable, then moves fast, as if nothing preceded it.","(three weeks of nothing, then:) Dinner. Tomorrow. I've booked.",2,"d",{ego:-1,asrt:1}],
], {behaviorFunction:"connect"});
block(ROM, "Courtship Speech", 180100, [
  ["Talks about the future in the plural by accident","'We' slips into plans for next summer, and they don't correct it.","We could go to the coast in — I could. You could. Anyway, the coast.",2,"u",{emo:1}],
  ["Over-explains the invitation","Every ask for a date comes with a reasoned case, alternatives and an exit clause.","There's a thing Friday — only if you're free, and it's fine if it's not, it's just there's a — thing.",3,"c",{vol:1,ego:-1}],
  ["Calls it anything but a date","A walk, a coffee, 'a thing'; the word itself is never spoken until the third anniversary.","It's not a date. It's two people eating near each other, deliberately.",2,"c",{emo:-1,hon:-1}],
  ["Old-fashioned courtship script","Asks permission, arrives early, walks on the kerb side, and means all of it.","May I walk you home? I'll take the road side. Habit.",3,"d",{man:1},{worldTags:["any"]}],
  ["Declares love on a timetable","Has decided in advance when the words get said and will not be hurried or delayed.","I'm not saying it before the six-month mark. I'm saying it on the six-month mark.",3,"s",{emo:-1}],
  ["Says it first and fast","Tells people they love them early, loudly and without hedging, and survives the consequences.","I love you. Don't answer that, it's not a question.",5,"u",{emo:1,asrt:1,disc:-1,intel:-1}],
  ["Only affectionate in writing","Letters, notes and texts are tender; face to face, the same person is brisk.","(the note on the pillow runs to two pages. At breakfast:) Pass the milk.",3,"d",{emo:-1,vol:-1}],
  ["Pet names from the pantry","Endearments drawn from food — sprout, dumpling, crumpet — deployed without irony.","Morning, crumpet. Kettle's on.",2,"c",{form:-1}],
  ["Serenades, literally","Sings — badly or well — as a public romantic gesture, and cannot be stopped.","(stands on the chair. The whole restaurant is now involved.)",5,"s",{vol:1,rebel:1,emo:1}],
  ["Courts through the family","Wins over the parents, the siblings and the dog before making a move on the actual person.","Your mum and I have been talking. She thinks I should ask you out.",4,"d",{asrt:-1}],
  ["Speaks of love only in the past tense","Can describe how much they loved someone; cannot say it about now.","I loved her, you know. — And now? — Now we're very settled.",2,"s",{emo:-1,pos:-1}],
  ["Keeps score of gestures","Reciprocity tracked precisely; flowers are answered with flowers of matched value.","He did the thing with the tickets, so I have to do something at least as good.",3,"u",{warm:-1}],
  ["Romantic in grand abstractions","Talks about soulmates, fate and forever with total conviction, week three.","It's like we were written. Like somebody sat down and wrote us.",4,"c",{pos:1,emo:1,intel:-1}],
  ["Proposes practically","Frames commitment as sensible logistics, and the tenderness leaks out of the logistics.","It'd make the tax simpler. And I'd like to wake up next to you until I'm dead. Mainly the tax.",2,"d",{emo:-1,hon:1}],
], {behaviorFunction:"connect"});
block(ROM, "Jealousy Tells", 180200, [
  ["Asks casual questions with perfect recall","'Who was that?' — and later knows the name, the job and the date it was mentioned.","Oh, Daniel? From the Tuesday thing? The one who does triathlons?",3,"d",{hon:-1}],
  ["Over-praises the rival","Becomes unnervingly generous about the threat, loudly, to prove it is no threat.","She's lovely. Genuinely lovely. Really very, very lovely. Is she coming Saturday?",3,"c",{hon:-1}],
  ["Goes quiet and extremely polite","Jealousy shows as courtesy: please and thank you with a crust of ice.","No, that's fine. Thank you for letting me know. Thank you.",2,"u",{man:1,warm:-1,emo:-1}],
  ["Names the jealousy out loud","Owns it plainly, without accusing, as information.","I'm jealous. That's mine to sort out. I just didn't want to be weird about it silently.",3,"s",{hon:1,emo:1,mood:1}],
  ["Checks the phone by proxy","Never touches the phone; asks such specific questions that it amounts to the same thing.","You looked happy reading that. Who's it from? Just nice to see you smile.",4,"d",{hon:-1,asrt:1}],
  ["Competes openly and physically","Turns up the charm, the volume and the gym effort when someone else is around.","(now carrying both bags, both chairs, and the conversation)",4,"c",{ego:1,vol:1,act:1}],
  ["Jealous of the past","Uneasy not about rivals but about exes, old photos and a life lived before them.","Is that where you went with him? No, it's fine. We'll go somewhere else.",3,"u",{mood:-1,ego:-1}],
  ["Jokes the jealousy away before it lands","Makes the envious remark as a bit so nobody, including them, can take it seriously.","Oh, he's taller than me? Better cheekbones? I'll just go and lie in the road.",2,"c",{emo:-1}],
  ["Serene to the point of suspicion","Displays no jealousy at all, ever, so thoroughly that others wonder what it costs.","Go. Have fun. I'm not the type. (he is still awake when you get in)",1,"s",{emo:-1,hon:-1}],
  ["Jealous of friendships, not lovers","Unbothered by romantic rivals, stung by a partner's best friend.","You tell Priya things first. I'm just noticing that you tell Priya things first.",3,"d",{emo:1,ego:-1}],
  ["Recasts jealousy as concern","Frames every possessive impulse as worry for the other person's safety.","I just don't think he's good for you. As a friend. I'm thinking of you.",4,"u",{hon:-1}],
  ["Sulks in logistics","Jealousy expressed as sudden unavailability, lateness and 'forgotten' plans.","Oh, was that tonight? I've double-booked. Terrible of me.",3,"c",{asrt:-1,warm:-1,hon:-1}],
  ["A single cold sentence, then nothing","Says one precise, cutting thing and refuses to discuss it again.","Enjoy him. (and that is the whole conversation, for a week)",5,"d",{warm:-1,vol:-1,asrt:1}],
], {behaviorFunction:"protect"});
block(ROM, "Pining Tells", 180300, [
  ["Brings them up in unrelated conversations","Every topic finds its way back to one person, and the speaker doesn't notice.","Speaking of the weather — Sam hates rain, actually. Not relevant. Sorry.",3,"c",{emo:1,disc:-1}],
  ["Speaks about them in a careful neutral voice","A deliberate flatness that is louder than gushing would be.","Alex? Yes, Alex is fine. Alex is a colleague. Who is fine.",2,"u",{emo:-1,hon:-1}],
  ["Knows their schedule without trying","Can say where the person will be at four on a Wednesday and pretends it is general knowledge.","She'll be at the library till six, then the bakery. Everyone knows that. Probably.",2,"d",{emo:1}],
  ["Writes and does not send","Drafts letters and messages that live forever in a drawer or a notes app.","(forty-one drafts, one title: 'probably nothing')",1,"s",{emo:1,asrt:-1}],
  ["Performs indifference in front of friends","Rolls eyes at the mention of them, loudly and unconvincingly.","Him? Please. (checks the door every time it opens)",3,"c",{hon:-1,ego:1}],
  ["Makes the pining a running joke","Confesses so theatrically that nobody takes it seriously, which was the plan.","Oh, she'll marry me eventually. I've told her. She laughed, which is a yes in some cultures.",4,"u",{emo:-1,vol:1}],
  ["Loyal for years to a hopeless cause","Speaks with quiet, unembarrassed constancy about someone long gone or long married.","I'd still go, if she asked. She won't. But I'd still go.",2,"s",{emo:1,pos:-1}],
  ["Goes bright and useless nearby","Near the person, loses the thread, laughs too much, drops things.","Ha! Yes! The — what was — the report. Ha. I've dropped the report.",4,"c",{ego:-1,disc:-1}],
  ["Asks everyone for advice, takes none","Consults widely, polls friends, and does nothing whatever with the results.","So you'd say something. And Mo says say something. And I'm going to — think about it.",3,"u",{asrt:-1,vol:1}],
  ["Pines in the conditional","Speaks in hypotheticals that are transparently about one person.","If someone — hypothetically — liked someone who didn't notice them, what would that someone do?",3,"d",{hon:-1,emo:1}],
  ["Treats the object like a saint","Talks of the person as flawless, and gets angry if anyone mentions a flaw.","He does not chew loudly. You're thinking of someone else.",4,"d",{intel:-1,emo:1}],
  ["Pining that has curdled into grievance","Unreturned feeling now spoken of as an injustice done to them.","I was there the whole time. The whole time. And she picked him.",4,"s",{pos:-1,warm:-1,ego:-1}],
], {behaviorFunction:"soothe"});

/* =====================================================================
   DIALECT & LINGUISTIC BACKGROUND (incl. generational speech)
   No phonetic spellings of real accents: the tells are choices, switches and
   words-in-their-place, which a writer can localise to any setting.
   ===================================================================== */
const DIA = "Dialect & Linguistic Background";
block(DIA, "Regional Features", 180400, [
  ["Local words, unglossed and unapologetic","Uses the regional word for a thing and waits for the listener to catch up.","Pass us the — you know. The thing. The (local word for a bread roll).",3,"c",{form:-1,agr:-1}],
  ["Accent thickens with drink or anger","The home voice returns with every drink or rise in temper, audibly.","(two pints in, every vowel has gone back up the motorway)",3,"u",{disc:-1,emo:1}],
  ["Has sanded the accent smooth","Speaks a careful, placeless standard that took years to build and slips only under pressure.","(a single dropped consonant when startled, then the polish returns)",2,"d",{hon:-1}],
  ["Defends the local pronunciation","Corrects outsiders who say the place name wrong, every time, patiently.","It's not 'Wor-ces-ter'. It never was. It's never going to be.",3,"c",{asrt:1,agr:-1}],
  ["Weather talk as greeting","Every exchange opens with a regional ritual about the weather, not up for skipping.","Bitter out. Bitter. Mind, it'll turn by Thursday.",1,"c",{man:1},{worldTags:["rural"]}],
  ["Place names as moral categories","Calls things 'very [town]' or 'a bit [city]' as if the listener shares the whole value system.","That's a very Harrogate thing to say, if you don't mind me saying.",3,"d",{intel:-1,agr:-1}],
  ["Idioms from the hills","Uses rural farming idioms fluently in an office, and they land perfectly.","You can't fatten a pig on market day. The deck needed doing last week.",2,"d",{form:-1},{worldTags:["rural"]}],
  ["Plays up the accent as a costume","Lays the regional voice on thick for effect — charm, menace, comedy — and takes it off again.","(broadest vowels for the tourists, flat standard for the bank)",4,"u",{hon:-1}],
  ["City-quick speech","Talks at the pace of a big city, clipped and overlapping, and reads slowness as rudeness.","Yeah-yeah-yeah, got it, where, when, done.",4,"c",{vol:-1,pace:1},{worldTags:["urban"]}],
  ["Unhurried country cadence","Leaves long gaps and never finishes a sentence faster than it needs to be finished.","Well... (considers the field) ...you'd want to wait. On that.",2,"u",{pace:-1},{worldTags:["rural"]}],
  ["Homesick in vocabulary","Talks about the old place in the present tense and names its streets unprompted.","You'd go down by the harbour, up past the chapel — well. You would, if you were there.",3,"s",{emo:1,pos:-1}],
], {behaviorFunction:"signal"});
block(DIA, "Code-Switching", 180500, [
  ["Different voice on the phone to home","The call from family arrives, and the whole register, pitch and pace change mid-room.","(answers in the family language, laughs differently, hangs up and is office-voice again)",2,"c",{warm:1}],
  ["Drops into the grandmother tongue only to swear or bless","The heritage language is kept for the extremes: curses, blessings, and prayers for the dead.","(a blessing in the old language under the breath, then:) Right. Where were we.",3,"s",{emo:1,form:-1}],
  ["Switches register to match whoever's boss","Accent and vocabulary move up or down to mirror authority, instantly and invisibly.","(to the director: 'certainly'. To the porter, thirty seconds later: 'yeah, go on')",3,"c",{agr:1,hon:-1}],
  ["Refuses to switch, on principle","Speaks the same way to the judge and the neighbour, knowing it costs them.","I talk how I talk. He can follow or he can't.",4,"d",{rebel:1,hon:1,asrt:1}],
  ["Switches languages to exclude","Moves into a language the room doesn't share exactly when it wants privacy — or to wound.","(two sentences in another language to her sister; both look at you; both laugh)",4,"u",{warm:-1,hon:-1}],
  ["Switches languages for the emotional word","Uses the other language for the feeling that has no exact equivalent here.","It's not sad. It's — (the other language's word). There isn't a word for it in this one.",2,"d",{emo:1}],
  ["Two humours, two languages","Is funny in one language, earnest in the other, and friends from each half wouldn't recognise them.","(in one tongue, the class clown; in the other, the serious eldest daughter)",3,"s",{warm:1}],
  ["Mid-sentence switching as native mode","Weaves two languages within single sentences with complete fluency, not as performance.","We went to the (market, in the other language) and she was being so extra about the prices.",3,"c",{form:-1,pace:1}],
  ["Slips at exhaustion","Keeps the switch perfectly until tired, then starts counting and cursing in the first language.","(at hour fourteen, counting the stock aloud in the language of childhood)",2,"u",{mood:-1}],
  ["Code-switches visibly and names it","Comments on their own switching, with humour, as a skill.","Hold on, let me put my interview voice on. (clears throat) Good afternoon.",3,"u",{hon:1}],
  ["Switches and resents it","Changes voice for institutions and lets the resentment show in how crisply it's done.","(the most perfect received pronunciation, delivered like a slap)",4,"d",{rebel:1,warm:-1}],
  ["Code-switches online more than in person","Written voice runs on a different register — slang, memes, abbreviations — than the careful spoken one.","(in person: formal. In the chat: 'lmaooo no'.)",2,"c",{form:-1},{worldTags:["online","modern"]}],
], {behaviorFunction:"signal"});
block(DIA, "Second-Language Speaker", 180600, [
  ["Precise textbook grammar","Speaks with a correctness native speakers don't bother with, and it reads as formality.","I would have preferred that you had told me earlier.",2,"c",{disc:1}],
  ["Imports idioms directly","Translates proverbs from the first language literally, and they arrive strange and exact.","Not my circus, not my monkeys — no? Here you don't say this? You should.",3,"c",{cur:1}],
  ["Asks for the word, unembarrassed","Stops mid-sentence to ask what something's called, without apology.","The thing for the — what is it, the metal thing for the door? Hinge. Thank you. The hinge is broken.",2,"u",{hon:1,ego:1}],
  ["Funnier in their first language, and knows it","Mentions, sometimes, that the joke would land better at home.","In my language this is hilarious. Trust me. Everyone at home is laughing.",3,"d",{ego:1}],
  ["Counts under the breath in the first tongue","Maths, lists and phone numbers happen in the language they learned numbers in.","(lips moving; the numbers are in another language; the answer comes out in this one)",1,"c",{}],
  ["Over-fluent in slang","Learned the language from TV or the street and uses slang heavier than a native would.","Mate, it's proper mint, innit, no cap, fair dinkum.",4,"u",{form:-1}],
  ["Goes quiet in fast group talk","Fine one-to-one, disappears when four natives overlap at speed.","(nods, laughs a beat late, says nothing for an hour)",2,"u",{vol:-1,ego:-1,act:-1}],
  ["Corrects natives","Knows the grammar rules better than the people born into them and says so.","It's 'fewer', not 'less'. Countable noun. You learned this at school, surely.",4,"d",{agr:-1,warm:-1}],
  ["Uses the wrong register confidently","Deploys a word from the wrong formality level with total conviction — 'hitherto' at the bus stop.","I have hitherto been waiting some twenty minutes, pal.",3,"s",{ego:1}],
  ["Pretends not to understand, strategically","Retreats into 'I don't understand' when the conversation turns inconvenient.","Sorry? My English — not so good for this. (it was perfect a minute ago)",3,"d",{hon:-1,asrt:-1}],
  ["Tender about the adopted language","Loves specific words in the new language and collects them out loud.","'Higgledy-piggledy'. You people have the best words. Say it again.",2,"s",{pos:1}],
  ["Apologises for accent unprompted","Pre-empts every conversation with a note about their English, which is excellent.","Sorry for my English. (proceeds to deliver an immaculate paragraph)",2,"c",{ego:-1,man:1}],
], {behaviorFunction:"connect"});
block(DIA, "Heritage Vocabulary", 180700, [
  ["Family words for household things","Uses words for the remote, the blanket, the good cups that only their family uses.","Where's the (family word for the remote)? — The what? — You know. The clicker.",1,"c",{warm:1}],
  ["Kitchen in the old language","Recipes, ingredients and cooking verbs stay in the heritage tongue even when nothing else does.","You have to let it (the grandmother's verb) for an hour. There's no English for it.",2,"c",{emo:1},{worldTags:["domestic"]}],
  ["Kinship terms that don't translate","Uses exact words for 'mother's elder sister' and 'father's younger brother's wife' and gets impatient with 'aunt'.","She's not my aunt. She's my (the precise word). It's different. It matters who owes who.",3,"d",{intel:1}],
  ["Endearments from the old country","Calls friends and children by heritage endearments without translating them.","Come here, (an endearment in the other language). You'll catch cold.",2,"c",{emo:1}],
  ["Knows the words, not the language","Has a vocabulary of fifty heritage words and no grammar to hold them, and mourns it quietly.","I know the word for 'eat' and 'naughty' and 'my soul'. That's it. That's what I got.",2,"s",{emo:1,pos:-1}],
  ["Curses in a language nobody around speaks","Swears freely in the heritage tongue precisely because no one can object.","(a long, inventive, untranslated sentence at the printer)",3,"u",{man:-1,disc:-1}],
  ["Guards the heritage words","Refuses to explain or translate them for outsiders: some things are for family.","It doesn't matter what it means. It's not for you. It's not a bad thing. It's just not yours.",4,"d",{warm:-1,agr:-1}],
  ["Teaches the words insistently","Makes friends learn one word a week, whether they asked or not.","Say it. No — from the throat. Again. There. Now you're family.",3,"d",{asrt:1}],
  ["Proverbs at every crisis","Answers trouble with a grandparent's proverb, translated roughly and delivered as final.","My grandmother said: the river doesn't argue with the rock. So. Go around.",3,"c",{pos:1,intel:-1}],
  ["Religious phrases as punctuation","Ordinary heritage phrases of blessing or protection punctuate talk regardless of the speaker's belief.","If God wills, I'll be there by six. — You're an atheist. — Still.",2,"u",{},{conceptFamily:"gaps-heritage-blessing"}],
], {behaviorFunction:"connect"});
block(DIA, "Class Register Shift", 180800, [
  ["Posh when angry","Temper produces crisp consonants and long Latinate words, as if anger were a formal occasion.","I find that frankly unconscionable, and I shall be taking it further.",4,"d",{asrt:1}],
  ["Common when drunk","The school voice slides off after the second drink and the home voice comes back.","(by ten o'clock he is a different postcode entirely)",3,"c",{form:-1,disc:-1}],
  ["Telephone voice","Has a whole separate pronunciation for answering the phone and for talking to officials.","(picks up) Hel-lo, the Harrison residence? — Oh, it's you. What.",2,"c",{hon:-1}],
  ["Anxious about 'correct' words","Double-checks the right word for serviette/napkin, sofa/settee, as if class were an exam.","Is it a — do we say 'lounge'? Sitting room. Sorry. Sitting room.",3,"u",{ego:-1}],
  ["Uses 'common' as an insult","Class contempt in one well-worn word, dropped lightly.","Bit common, isn't it. The fountain.",3,"d",{warm:-1,man:1}],
  ["Performs working-class roots","Lays on the rough edges and origin story in rooms where it gives them authenticity.","I'm just a lad from a council estate, me. (he has three houses)",4,"u",{hon:-1,ego:1}],
  ["Swears to prove they're not posh","Deploys profanity carefully and deliberately, like a passport.","It's a — it's a bloody good — it's a fucking good point, actually. (winces)",3,"d",{man:-1,hon:-1,form:-1}],
  ["Two vocabularies, one for each parent","Talks one way to the mother's side and another to the father's, and the families never meet.","(Sunday lunch with Dad's lot: 'supper'. With Mum's lot: 'tea'.)",2,"s",{agr:1}],
  ["Unshakably the same in every room","The same plain words at the palace and the pub, without effort or apology.","Alright? Nice gaff. — To the Duke, same tone.",2,"s",{hon:1,ego:1}],
  ["Corrects others' class markers","Can't stop noticing 'pardon' and 'toilet' and flags them with a flicker.","(the tiniest wince at 'pardon')",2,"d",{warm:-1,man:1}],
], {behaviorFunction:"signal"});
block(DIA, "Dated Slang", 180900, [
  ["Slang frozen in one decade","Still says the cool words of their twenties, sincerely, and doesn't hear the dust on them.","That's groovy. Genuinely. That's a groovy idea.",3,"c",{pos:1,cur:-1}],
  ["Uses dated slang ironically, then not","Started using old slang as a bit; somewhere along the way the bit became the voice.","Radical. — I'm being ironic. — Radical, though.",2,"u",{warm:1}],
  ["Borrows teen slang badly","Tries the current words from kids or grandkids and gets them fractionally wrong.","This lasagne is absolutely 'no cap', as the young people say. Is that right?",3,"c",{ego:-1}],
  ["Period oaths","Swears in the mild idiom of another era: crikey, blimey, good grief, heavens.","Good heavens. Well, blow me down.",2,"c",{man:1,form:-1},{worldTags:["pre-modern"]}],
  ["Names objects by their old brand","Says 'the Hoover', 'the Walkman', 'the Dictaphone' for things that no longer have those names.","Put it on the tape. — It's a phone. — The tape on the phone.",2,"c",{cur:-1}],
  ["Refuses new words on principle","Will not say the current term for something and makes a small speech about why.","I will not say 'deliverables'. They are things. We are delivering things.",4,"d",{rebel:1,agr:-1,cur:-1}],
  ["Slang from a subculture long gone","Speaks fluent jargon of an old scene — rave, punk, mod — as if the scene were still on.","Top one. Proper top one. Buzzing off that.",3,"s",{rebel:1,emo:1}],
  ["Currency and measurements from before","Thinks in old units — shillings, stones, miles per gallon — and converts reluctantly.","That's what, eight stone? In your new money? I don't know.",2,"u",{cur:-1}],
], {behaviorFunction:"signal"});
block(DIA, "Youth Register", 181000, [
  ["Intensifier inflation","Everything is literally, actually, genuinely the most; the scale topped out long ago.","I'm literally dead. Actually deceased. This is the best sandwich of all time.",3,"c",{vol:1,emo:1}],
  ["Uptalk as courtesy","Makes statements with a rising question tone to soften them, not from doubt.","So I think we should go now? Because the bus is at six?",1,"c",{asrt:-1}],
  ["Irony as default setting","Can't say anything sincere without a protective layer of irony.","I'm so proud of you, unironically. Well — slightly ironically. No, unironically.",3,"c",{emo:-1}],
  ["Online phrases out loud","Speaks internet shorthand aloud, including the punctuation.","That's so real. Big if true. L-O-L.",3,"u",{form:-1},{worldTags:["online","modern"]}],
  ["Earnest where elders expect cool","Unexpectedly direct about feelings, boundaries and mental health, in a way older people find unnerving.","I'm not in the headspace for that tonight, but I really value you asking.",3,"d",{emo:1,hon:1}],
  ["New slang, deployed as test","Uses the latest term partly to see who in the room understands it.","It's giving — no? Nobody? Okay. Old people.",4,"u",{ego:1,warm:-1}],
  ["Very dry, very young","Deadpan so complete that adults can't tell if they're joking.","Oh wow. What a day. I'm thrilled. (face unmoving)",3,"s",{emo:-1}],
], {behaviorFunction:"signal"});
block(DIA, "Era References", 181100, [
  ["Measures prices in what they cost in '87","Every price is translated into the year they first earned a wage, out loud.","Four pounds? For a coffee? That was a week's bus fare in '87.",3,"c",{pos:-1,cur:-1}],
  ["Dates everything by where they were when","History is organised around personal memory of big news days.","I was in the chip shop when they announced it. Chips went cold. That's how I know it was a Tuesday.",2,"u",{emo:1}],
  ["References only pre-internet culture","Cites films, songs and adverts from decades ago as if everyone knows them.","It's like that advert. The gorilla. The drums. No? Nobody?",3,"c",{cur:-1}],
  ["Knows prices now, fondly compares","Keeps a mental price index and recites it with rueful pleasure rather than grievance.","Pint was a pound when I started. Now it's seven. Worth it, mind.",2,"d",{pos:1}],
  ["Anchors to a war, strike or disaster","A single public catastrophe is the reference point for everything after.","Since the flood, nobody round here builds on the low field.",3,"s",{emo:1,pos:-1}],
  ["Nostalgic for what they didn't live through","Speaks fondly and specifically about an era before their birth, second-hand.","Everything was better in the sixties. The music. The coats. I wasn't born, but still.",3,"d",{pos:-1}],
  ["Treats the recent past as ancient","Refers to five years ago as a lost golden age.","Back in the day — this would be, what, 2021?",2,"c",{},{worldTags:["modern"]}],
], {behaviorFunction:"signal"});
block(DIA, "Tech Vintage", 181200, [
  ["Types with one finger, reads aloud","Uses technology with visible effort and narrates each step.","Right. Click the — the little box. No. The other little box.",2,"c",{pace:-1,ego:-1},{worldTags:["modern"]}],
  ["Signs off texts like letters","Ends every message with a full name and 'kind regards'.","Running late. Kind regards, Your Father.",3,"u",{man:1},{worldTags:["modern"]}],
  ["Native to the machine","Talks about devices with the intimacy of someone who grew up inside them.","It's not broken, it's just sulking. Watch. (taps it twice, somewhere specific)",2,"d",{intel:1},{worldTags:["modern","online"]}],
  ["Nostalgic for obsolete formats","Speaks lovingly of cassettes, dial-up tones and pagers.","You don't know the sound of a modem. It sounded like hope. And screaming.",3,"d",{emo:1,cur:1},{worldTags:["modern"]}],
  ["Suspicious of every new device","Treats each new technology as a probable spy.","It's listening. That's what it's for. I put a sock over it.",4,"u",{pos:-1,cur:-1},{worldTags:["modern"]}],
  ["Punctuation read as mood","Reads full stops in texts as anger and frets about it aloud.","She said 'ok.' — full stop. What have I done.",3,"c",{ego:-1,emo:1},{worldTags:["modern","online"]}],
  ["Writes emails like telegrams","No greeting, no sign-off, no lower-case, nothing wasted.","NEED FIGURES BY FRI. THANKS.",4,"d",{vol:-1,warm:-1},{worldTags:["modern","institutional"]}],
], {behaviorFunction:"signal"});

/* =====================================================================
   BELIEFS & WORLDVIEW
   Faith written as practice and speech, not creed; no tradition is the joke.
   Political temperament is the SHAPE of someone's politics (how they hold it),
   never a party, so it travels to any setting.
   ===================================================================== */
const BEL = "Beliefs & Worldview";
block(BEL, "Faith Practice", 181300, [
  ["Prays quietly before eating, in company","A brief private grace, unannounced and unexplained, at every meal including lunch at a desk.","(head dips for three seconds over the sandwich; then:) So, the budget.",1,"c",{emo:1}],
  ["Faith as plain fact in conversation","Mentions God, the saints or scripture as naturally as the weather, without evangelising.","Well, I'll pray on it and ring you Thursday.",2,"c",{hon:1,pos:1}],
  ["Quotes scripture precisely, with reference","Cites chapter and verse from memory and uses it to settle arguments.","Proverbs twelve, verse fifteen. 'The way of a fool is right in his own eyes.' Anyway. Your call.",4,"d",{asrt:1}],
  ["Keeps the fast, quietly","Fasts through a holy period while working, and declines food without making anyone awkward.","No, I'm fine, honestly. After sunset. Eat, eat.",2,"u",{man:1}],
  ["Argues with God out loud","Faith as an ongoing, sometimes furious conversation; addresses the divine in the second person, mid-task.","Right. You and me are going to have words about this later.",4,"s",{emo:1,rebel:1}],
  ["Serves rather than speaks","Faith visible only in what they do — the soup kitchen, the hospital rota — and never discussed.","It's just Tuesdays. Someone has to do the tea.",1,"s",{vol:-1}],
  ["Invites everyone to services","Warm, persistent, unembarrassed invitations to worship, accepting every refusal cheerfully.","There's a lovely choir. No pressure. Door's always open. I'll ask again at Easter.",3,"c",{asrt:1}],
  ["Doubts aloud inside the faith","Believes, attends, and says openly what they're unsure of.","I don't know if I believe the resurrection. I believe in going. That might be enough.",3,"d",{hon:1}],
  ["Uses faith as authority","Frames personal preference as divine instruction.","It's not me saying it. It's in the Book.",4,"u",{hon:-1,asrt:1}],
  ["Blesses people casually","Blessings, protections and 'God keep you' are ordinary sign-offs.","Mind how you go. God bless.",1,"c",{man:1}],
  ["Ritual precision","Cares about exact observance — the right order, the right words, the right days.","Not yet. Not until the third candle. Sit down.",3,"d",{rebel:-1}],
  ["Converted, and talks like a convert","Newer to the faith than anyone in the room and more fervent than all of them.","I didn't find it. It found me. Would you like a leaflet? I've got a leaflet.",4,"u",{emo:1,vol:1,pos:1}],
], {behaviorFunction:"soothe"});
block(BEL, "Lapsed Faith", 181400, [
  ["Still crosses themselves at ambulances","Old gestures of faith survive the belief and fire automatically.","(a quick sign of the cross at the siren; catches herself; shrugs)",1,"c",{emo:1}],
  ["Knows all the hymns, sings none","Stands silent through services at weddings and funerals, lips moving on every word.","(mouths the third verse perfectly; does not sing)",2,"s",{emo:-1}],
  ["Angry at the church, not at God","Distinguishes sharply between the institution that failed them and whatever was underneath.","I didn't leave God. I left the men in the good shoes.",4,"d",{rebel:1,hon:1}],
  ["Jokes about the old faith with insider precision","The sharpest jokes about the religion come from knowing it thoroughly.","Catholic guilt? I've got the deluxe edition. It came with a rosary.",3,"c",{emo:-1}],
  ["Returns in emergencies","Doesn't believe, but prays in hospitals, and admits it later, sheepishly.","I said a Hail Mary in the car park. Don't tell anyone.",3,"u",{hon:1,emo:1}],
  ["Aggressively secular","Treats any faith talk as an invitation to debate, loudly.","Right, but which god, though? Out of the three thousand? Just asking.",4,"c",{agr:-1,warm:-1}],
  ["Grieves the lost faith","Speaks of belief the way people speak of a dead parent.","I miss it. Being held. Knowing there was a floor under things.",3,"s",{emo:1,pos:-1}],
  ["Keeps the calendar, drops the meaning","Still eats fish on Fridays, still lights the candles — for the family, for the rhythm.","It's not religious. It's just what Friday is.",2,"c",{disc:1}],
  ["Won't enter the building","Avoids religious buildings entirely, including for weddings, and gives no reason.","I'll meet you at the reception.",4,"d",{warm:-1,rebel:1}],
], {behaviorFunction:"protect"});
block(BEL, "Superstition", 181500, [
  ["Knocks on wood, apologises for it","Does the charm reflexively, then disowns it immediately.","It'll be fine — (knock knock) — sorry, I don't believe in that. Mostly.",1,"c",{intel:-1,hon:1}],
  ["Salutes magpies","Greets single magpies aloud, every time, with the full formula.","Morning, Mr Magpie. How's your wife.",2,"c",{warm:1}],
  ["Won't say the thing out loud","Refuses to name a hoped-for outcome in case it jinxes it.","Don't. Don't say it. We'll say it when it's — when it's done.",2,"u",{pos:-1,emo:1}],
  ["Lucky object, publicly carried","Has a charm, a coin, a sock, and will not begin without it.","Where's my pen. My pen. I can't sign it with that pen.",3,"c",{ego:-1}],
  ["Reads omens into everything","Takes weather, numbers and coincidences as messages, and says so.","Third red car. That's a no. We're not signing today.",4,"d",{intel:-1,pos:-1}],
  ["Theatre superstitions offstage","Won't whistle indoors, won't name the Scottish play, won't wish good luck — in an accountancy firm.","Don't say good luck. Say break a leg. It's a pitch meeting, but still.",3,"d",{rebel:-1}],
  ["Sceptic who plays safe","Scorns superstition in principle and quietly follows every rule of it.","It's rubbish. (walks round the ladder) Total rubbish.",2,"s",{hon:-1}],
  ["Ritual before every risk","A fixed private sequence — touch the doorframe, check the pocket twice — before anything that matters.","(doorframe, pocket, pocket, breath) Right. Let's go.",3,"u",{mood:-1}],
  ["Grandmother's warnings as fact","Passes on folk rules from older relatives as established science.","Don't go out with wet hair. You'll get a chill in the kidneys.",2,"c",{intel:-1}],
  ["Superstitious about success","Believes good luck must be paid for and grows uneasy after good news.","It's going too well. Something's coming. It always does.",3,"d",{pos:-1,mood:-1}],
], {behaviorFunction:"soothe"});
block(BEL, "Political Temperament", 181600, [
  ["Every topic becomes political","Turns sandwiches, traffic and football into structural critique, sincerely.","You say 'sandwich'. I say supply chain. I say who picked the tomatoes.",4,"c",{rebel:1,vol:1}],
  ["Refuses to talk politics, ever","Changes the subject firmly and pleasantly whenever it turns.","Not at the table. What's everyone reading?",2,"c",{agr:1,man:1,warm:-1,cur:-1}],
  ["Believes in the institutions","Talks of courts, committees and procedures with real faith that process works.","Write to your representative. Properly. It does get read, you know.",2,"u",{rebel:-1,pos:1},{worldTags:["institutional"]}],
  ["Cynical about all sides equally","Treats every party as the same con in a different hat.","They're all the same. Different ties, same hand in your pocket.",3,"c",{pos:-1,hon:1}],
  ["Moved by one issue only","Mostly apolitical, but one cause makes them eloquent and unbudging.","I don't care about the rest. But the hospital closing? No. I'll lie down in the road.",4,"d",{emo:1,asrt:1}],
  ["Politics as sport","Follows it like football — scores, fouls, transfers — with little interest in outcomes.","Did you see the minister's face? Three-nil. Brutal.",3,"u",{emo:-1,act:1}],
  ["Changed sides and says so","Openly discusses having held the opposite view once, and why they moved.","I voted the other way for twenty years. Then my kid got sick. So.",3,"s",{hon:1,cur:1}],
  ["Moderate with great force","Defends the middle ground with a vehemence normally reserved for extremes.","Both of you are WRONG. The answer is SOMEWHERE IN BETWEEN.",4,"s",{asrt:1,agr:-1}],
  ["Talks in slogans","Answers with the approved phrases of their side, word for word.","It's common sense. Hard-working families. That's all I'm saying.",3,"c",{intel:-1,cur:-1}],
  ["Local politics only","Ignores national news entirely; knows every councillor, every planning application.","Never mind Westminster. Have you seen what they want to do to the bus stop?",2,"d",{},{worldTags:["rural"]}],
  ["Quietly radical","Holds views far from the room's, mentions them calmly, and doesn't try to convert.","I don't think we should have prisons. Anyway, more tea?",3,"s",{rebel:1,vol:-1,hon:1}],
  ["Treats disagreement as personal betrayal","Friendships end over a vote, and they say so.","You voted for that. Then I don't know you. I don't.",5,"u",{warm:-1,agr:-1,emo:1}],
], {behaviorFunction:"signal"});
block(BEL, "Conspiracy-Adjacent", 181700, [
  ["'I'm just asking questions'","Floats implausible claims wrapped as open-minded curiosity.","I'm not saying it's true. I'm just saying — why were all the cameras off?",3,"c",{hon:-1,cur:1}],
  ["Follows the money, always","Explains every event as someone's profit, sometimes correctly.","Who benefits? That's the only question. Who benefits.",3,"c",{pos:-1}],
  ["Knows a guy who knows","Every unlikely claim comes sourced to a friend of a friend who worked there.","My cousin's mate was a cleaner at the ministry. He says they know.",3,"u",{hon:-1}],
  ["Half-believes, half-jokes","Talks about theories with a wink that never quite resolves into a joke.","Birds aren't real. (laughs) ...Have you ever seen a baby pigeon, though?",2,"d",{hon:-1}],
  ["Research is a lifestyle","Speaks of 'doing the research' as a moral discipline; has spreadsheets.","I've got it all mapped. Dates, names. Four years of it. Want to see the board?",5,"s",{act:1}],
  ["Distrusts all official sources on reflex","Assumes the announced version is the least likely one.","If they're saying it's the heat, it isn't the heat.",4,"c",{rebel:1,pos:-1}],
  ["Scared underneath the theory","Conspiracy talk is a way to have an enemy rather than face randomness; the fear leaks through.","It can't just be — it can't just happen. Someone has to have done it.",3,"s",{emo:1,mood:-1}],
  ["Debunks everyone else's theories, keeps one","Rigorous sceptic about every conspiracy except their own.","Moon landing? Obviously real. Now, the water company…",3,"d",{hon:-1}],
], {behaviorFunction:"protect"});
block(BEL, "Secular Rituals", 181800, [
  ["Birthday rules, strictly observed","Birthdays have a fixed programme and deviations are taken personally.","Cake first, then presents, then the walk. It's always been cake first.",3,"c",{disc:1}],
  ["Toasts the dead at every meal","Raises a glass to the absent at family gatherings, same words each time.","To those who aren't here. — (everyone, together) To those.",2,"s",{emo:1}],
  ["Treats a sports team as a church","Match days carry vestments, liturgy, and sacred superstitions.","Scarf. Seat. Pie at half-time. You don't change what works.",4,"c",{emo:1}],
  ["New Year's resolution evangelist","Plans, announces and tracks resolutions with evangelical energy.","This year I'm going to read fifty books. It's going on a chart. On the fridge.",3,"u",{pos:1}],
  ["Marks personal anniversaries nobody else knows","Keeps private dates — a sobriety, a diagnosis, an escape — and observes them alone.","(buys one small cake on an ordinary Tuesday; says nothing)",2,"s",{emo:1,vol:-1}],
  ["Morning ritual as philosophy","Speaks of the coffee, the walk and the journal in quasi-spiritual terms.","The first hour is sacred. I don't talk to anyone. Not even myself.",3,"d",{warm:-1}],
  ["Refuses all rituals","Won't do birthdays, anniversaries or ceremonies and explains why, repeatedly.","It's an arbitrary rotation of a planet. I don't need a cake for it.",3,"u",{rebel:1,warm:-1}],
  ["Makes up rituals for the family","Invents traditions and insists they are ancient.","The Sock Exchange. We've always done the Sock Exchange. Since last year.",2,"d",{pos:1}],
], {behaviorFunction:"soothe"});

/* =====================================================================
   OCCUPATIONAL JARGON
   How the job gets into the mouth off-shift. worldTags mark the ones that need
   a particular kind of world.
   ===================================================================== */
const JAR = "Occupational Jargon";
block(JAR, "Medical", 181900, [
  ["Triage as a way of listening","Sorts every problem in a conversation into urgent, soon and never, visibly.","Right. Is anyone bleeding? No? Then it can wait till after dinner.",3,"c",{warm:-1}],
  ["Clinical words for intimate things","Describes their own body and feelings in exact anatomical terms, unfazed.","Bit of lower-left quadrant discomfort. Probably the curry.",3,"c",{emo:-1}],
  ["Gallows ward humour off the ward","Brings the jokes of the night shift home and forgets civilians flinch.","Oh, he'll be fine. Frequent flyer. We know him by his blood type.",4,"u",{emo:-1,warm:1}],
  ["Bedside voice in every argument","Drops into the calm, slowed-down tone for bad news when a friend is upset, which makes it worse.","I can see you're very distressed. Can you tell me where on a scale of one to ten.",3,"d",{emo:-1,warm:1}],
  ["Diagnoses strangers","Can't stop noting gaits, rashes and tremors in passing, sometimes aloud.","That man needs his thyroid looking at. — Who? — Doesn't matter.",2,"d",{cur:1}],
  ["Abbreviations at the dinner table","Uses shorthand from charts in ordinary talk.","He was NBM all day, poor thing. Then SOB on the stairs.",4,"c",{vol:-1},{worldTags:["institutional"]}],
  ["Refuses to talk shop, ever","Deflects every medical question at parties, having been asked about moles once too often.","I'm off duty. Ask a pharmacist. Or the internet, apparently.",2,"u",{warm:-1,asrt:1}],
  ["Handover summary for everything","Recounts the day as a crisp clinical handover.","Me, forty-two, presenting with a bad Tuesday, history of Mondays. Plan: wine.",3,"s",{warm:1}],
  ["Hand-washing narrated","Mentions infection risk casually and constantly.","Don't touch the handrail. Seriously. I've swabbed handrails.",3,"c",{mood:-1}],
], {worldTags:["modern"]});
block(JAR, "Military", 182000, [
  ["Clock in twenty-four hours","Says 'sixteen hundred' for four in the afternoon at a picnic.","We'll RV at the car park, sixteen hundred. Sixteen-fifteen latest.",2,"c",{disc:1},{worldTags:["military"]}],
  ["Briefs the family outing","Plans ordinary trips with objective, route, contingencies.","Objective: the zoo. Secondary: penguins. Fallback: café. Questions?",4,"c",{asrt:1},{worldTags:["military"]}],
  ["Phonetic alphabet in daily life","Spells everything out with alpha-bravo-charlie, even the shopping list.","Milk. Mike-India-Lima-Kilo. For the avoidance of doubt.",3,"u",{form:1},{worldTags:["military"]}],
  ["Won't talk about deployment","Answers questions about service with a single flat phrase and moves on.","It was a job. Next question.",2,"s",{emo:-1,vol:-1,warm:-1},{worldTags:["military"]}],
  ["Rank-aware address","Calls everyone 'sir', 'ma'am', 'boss' by an internal hierarchy nobody else sees.","Yes, boss. — I'm your neighbour. — Yes, boss.",3,"d",{man:1,rebel:-1},{worldTags:["military"]}],
  ["Mission language for feelings","Talks about grief and marriage as operations, objectives and casualties.","We lost ground this week. Regrouping. Holding the line on the kids.",3,"s",{emo:-1},{worldTags:["military"]}],
  ["Swears with rhythmic precision","Profanity deployed in drilled cadences, almost musical.","(a four-bar, perfectly scanned obscenity at the kettle)",4,"u",{man:-1},{worldTags:["military"]}],
  ["Acronym soup, unexplained","Speaks in unit shorthand to civilians who haven't a hope.","The CO wanted the SITREP before the OC's O-group.",4,"c",{warm:-1},{worldTags:["military","institutional"]}],
  ["Can sleep anywhere, announces it","Brags gently of the soldier's gift for sleep in any position.","Twenty minutes on a concrete floor. Best sleep of my life.",1,"c",{ego:1,act:1},{worldTags:["military"]}],
]);
block(JAR, "Legal", 182100, [
  ["Answers only the question asked","Gives precisely what was asked and nothing further, by trained habit.","Did I see him? Yes. — And? — You asked if I saw him.",3,"c",{hon:-1,vol:-1,warm:-1}],
  ["Without prejudice, over dinner","Qualifies domestic statements with legal caveats.","I'm saying this without prejudice, but the dishwasher was loaded by you.",3,"u",{form:1,warm:1}],
  ["Cross-examines friends","Turns casual questions into leading ones, and enjoys the trap.","So you were at the pub. And the pub is how far from here? And you arrived at?",4,"c",{asrt:1,agr:-1,warm:-1}],
  ["Latin for effect","Slips in inter alia, prima facie, per se, and waits.","Prima facie, you ate my yoghurt.",3,"d",{form:1,ego:1}],
  ["Won't put it in writing","Instinctively moves anything sensitive off the page and onto the phone.","Don't email me that. Call me.",2,"d",{hon:-1},{worldTags:["modern","institutional"]}],
  ["Reasonable-person test for everything","Measures behaviour against an imagined 'reasonable person', usually themselves.","Would a reasonable person have left the gate open? No. So.",3,"c",{agr:-1}],
  ["Reads the small print aloud","Insists on reading every contract, form and terms page, and narrates the troubling bits.","'Perpetual, irrevocable licence to your likeness' — for a supermarket app?",3,"u",{cur:1}],
  ["Adversarial by default, friendly underneath","Argues the other side of anything purely as a warm-up, then laughs.","Devil's advocate: the cat was entitled to the chair. — You're not serious. — No. I love you.",3,"s",{agr:-1,warm:1}],
], {worldTags:["institutional"]});
block(JAR, "Kitchen & Trade", 182200, [
  ["'Behind!' in a narrow hallway","Kitchen call-outs survive into domestic life.","Behind! Hot! — It's a cup of tea. — Still hot.",2,"c",{vol:1,act:1}],
  ["'Yes, chef' to anyone giving orders","Replies to any instruction with the brigade acknowledgment.","Could you take the bins out? — Yes, chef.",2,"c",{rebel:-1,warm:1}],
  ["Measures in handfuls and pinches","Refuses precise quantities; everything is 'until it looks right'.","How much flour? — Enough. Until it stops sticking. You'll know.",2,"u",{intel:-1,ego:1}],
  ["Judges the tools first","Walks into any room and assesses the equipment, audibly.","Who's been using this chisel as a screwdriver? Honestly.",3,"c",{agr:-1}],
  ["Trade names for everything","Calls things by trade terms — 'noggin', 'bain-marie', 'mise' — and forgets others don't.","Just pass us the four-by-two. The — the wood. The long wood.",2,"c",{form:-1}],
  ["Estimates everything in jobs","Measures time and money in how many jobs it'd take.","Holiday? That's a boiler and a half. Maybe two boilers.",3,"d",{pos:-1}],
  ["Service-rush tempo off the clock","Speaks in the clipped rush of a Friday service when stressed at home.","Plates! Now! Where's — go, go, go. (it's toast)",4,"u",{mood:-1,pace:1}],
  ["Craft pride in plain words","Explains the right way to do a thing with a quiet authority nobody argues with.","You don't rush plaster. Plaster tells you.",2,"s",{ego:1,vol:-1}],
  ["Customer-talk scorn","Tells stories about clients with the weary contempt of a trade.","He wanted it 'more modern'. It's a skirting board. What do you want, lasers?",3,"c",{warm:-1,vol:1}],
]);
block(JAR, "Tech", 182300, [
  ["Bandwidth for feelings","Describes human capacity in computing terms.","I don't have the bandwidth for your mum this weekend.",2,"c",{emo:-1},{worldTags:["modern","online"]}],
  ["'Have you tried turning it off?' as life advice","Applies IT troubleshooting to relationships and grief.","Have you tried just — restarting? Like, going to bed?",3,"c",{intel:1,warm:1},{worldTags:["modern"]}],
  ["Edge-case thinker","Can't hear a plan without listing its failure modes.","Great. What happens if it rains? And if the venue's double-booked? And if —",4,"u",{pos:-1},{worldTags:["modern"]}],
  ["Ship-it urgency","Pushes for a rough version now over a perfect one later, in all things.","Just send it. We'll patch the wedding speech in version two.",3,"d",{pace:1,disc:-1},{worldTags:["modern"]}],
  ["Talks in tickets","Turns requests into queued items, sometimes literally.","Can you raise that as a — sorry, can you just remind me Monday.",3,"c",{form:1,warm:-1},{worldTags:["modern","institutional"]}],
  ["Startup optimism","Everything is a disruption, an opportunity, a pivot.","It's not a divorce, it's a pivot.",4,"u",{pos:1,hon:-1},{worldTags:["modern","urban"]}],
  ["Explains the internet to the internet","Mansplains technical things to people in the field, confidently wrong.","Well, the cloud is basically a big computer somewhere — (to a data-centre engineer)",4,"d",{ego:1,intel:-1},{worldTags:["modern"]}],
  ["Terse chat-log speech","Spoken sentences shaped like commit messages: lowercase, verb-first.","fixed the gate. added a latch. closes now.",3,"s",{vol:-1,form:-1},{worldTags:["modern","online"]}],
]);
block(JAR, "Academic", 182400, [
  ["'Well, it's complicated'","Opens every answer by undermining the simple version.","Well, it's complicated. There are really three schools of thought on toast.",3,"c",{vol:1}],
  ["Footnotes in speech","Signals digressions and asides as spoken footnotes.","— and, footnote, the French edition is better — anyway.",3,"d",{form:1}],
  ["Hedges every claim","Qualifies everything into safety: arguably, broadly, in some sense.","It's arguably, in a certain sense, broadly speaking, raining.",2,"c",{asrt:-1}],
  ["Seminar voice at parties","Holds forth in lecture cadence and expects questions at the end.","— which brings me to my third point. Any questions? No? Good.",4,"u",{vol:1,ego:1}],
  ["Asks 'what's your source?'","Challenges casual claims for citations, cheerfully.","Eighty percent of what? Where's that from? No, I'd genuinely like to read it.",3,"c",{agr:-1}],
  ["Imposter terms for own work","Describes their expertise in shrinking, apologetic language.","Oh, I just — dabble. In fluid dynamics. It's a very small corner.",2,"s",{ego:-1}],
  ["Department gossip as epic","Recounts faculty feuds with operatic seriousness.","And THEN he blocked her tenure over a footnote. In 1994. They still don't speak.",4,"d",{emo:1,vol:1},{worldTags:["institutional"]}],
  ["Latinate under pressure","The more stressed, the longer and more abstract the words.","I'm experiencing a certain epistemic discomfort about the dinner plans.",3,"u",{form:1,emo:-1}],
], {worldTags:["institutional"]});
block(JAR, "Service", 182500, [
  ["Answers personal questions in customer-service script","Deflects intimacy into the sanctioned phrases of the counter.","I completely understand your frustration, and I'll look into that for you. — I asked if you loved me.",4,"s",{emo:-1,man:1,hon:-1}],
  ["Can't stop saying 'no problem'","Reassures reflexively, to everyone, about everything.","No problem! No problem at all! — You haven't done anything. — No problem!",2,"c",{agr:1,warm:1}],
  ["Reads a room like a section","Clocks who needs a drink, who's unhappy, who's about to leave, and acts before they ask.","(the water glass is refilled before you notice it's empty)",2,"d",{intel:1,warm:1}],
  ["Professional smile voice","A bright, rising tone reserved for strangers that switches off like a light.","Have a wonderful day! (door shuts) God, I hate Wednesdays.",3,"c",{hon:-1,warm:1}],
  ["Tells customer horror stories","Collects terrible-customer anecdotes and performs them at parties.","So she asks for the manager. I AM the manager. So she asks for MY manager.",4,"u",{vol:1,warm:1}],
  ["Never complains as a customer","Having worked the counter, is endlessly patient in shops and tips too much.","Honestly, don't worry about it. You're doing great. Busy night?",1,"c",{agr:1,warm:1}],
  ["Refers to the public as 'guests'","Uses the trade's euphemisms at home without noticing.","We've got guests arriving at seven. — Your parents? — Guests.",2,"d",{form:1}],
  ["Scripted apology, perfectly delivered","Apologises in the exact corporate form they were trained in.","I'm sorry you feel that way, and I appreciate your feedback.",3,"c",{hon:-1,man:1,warm:-1}],
]);

/* =====================================================================
   CONVERSATION MECHANICS
   Behaviours, not diagnoses. Nothing here names a condition, and nothing is
   written as a deficit to be laughed at: each entry says what the person does
   and, where it matters, what it costs or earns them.
   ===================================================================== */
const CON = "Conversation Mechanics";
block(CON, "Literal Uptake", 182600, [
  ["Answers the question as asked","Replies to the literal words, which is sometimes the funniest thing in the room and sometimes the most useful.","Can you pass the salt? — Yes. (does not move) — Will you? — Oh. Yes.",2,"c",{intel:1}],
  ["Asks what a phrase actually means","Stops idioms mid-flight to check what's being claimed.","'Break a leg' — you want me to fall? Or is this the other kind of saying?",3,"u",{hon:1,cur:1}],
  ["Takes promises at face value","Treats 'we should get lunch sometime' as a booked appointment and follows up.","You said we'd get lunch sometime. I've brought my diary.",3,"d",{hon:1,warm:1}],
  ["Says exactly what they mean, no padding","Speaks without the softeners others expect and is surprised when it lands as rude.","Your presentation was too long. The middle section. The rest was good.",3,"c",{hon:1,man:-1}],
  ["Learned the idioms like a second language","Uses figures of speech correctly but visibly deliberately, as if retrieving them from a list.","That's — water under the bridge. Is that right? It feels right.",2,"s",{disc:1}],
  ["Misses sarcasm, catches it later","Accepts a sarcastic remark at face value and then, hours later, understands.","(at midnight, sitting up) Oh. He didn't think it was a great idea.",2,"u",{emo:1}],
  ["Needs hints made explicit","Asks people to say the thing directly and explains why it helps.","If you're annoyed, can you say 'I'm annoyed'? I'm not good at the other way.",3,"d",{hon:1,asrt:1}],
  ["Precise about quantities","Corrects approximations when they matter to them.","It wasn't 'ages'. It was eleven minutes.",3,"c",{agr:-1}],
], {behaviorFunction:"connect"});
block(CON, "Info-Dumping", 182700, [
  ["Deep-dive on one subject, generously","Given an opening on the special topic, delivers a detailed, joyful lecture as a gift.","Oh, trams! Right, so — have you got twenty minutes? The 1901 gauge dispute —",4,"c",{vol:1,cur:1}],
  ["Shares facts as affection","Offers a surprising fact where others might offer a hug, and means the same thing.","(to a crying friend) Did you know octopuses have three hearts? — …Thanks. — I know.",3,"s",{emo:-1,warm:1}],
  ["Checks in mid-monologue, then continues","Has learned to pause and ask 'is this too much?', and takes the answer seriously.","Sorry — am I going on? Tell me honestly. — No, go on. — Okay! So the second war —",3,"d",{man:1,vol:1}],
  ["Monologue as reassurance","Talks steadily about a favourite subject when anxious, and the talking settles them.","(in the waiting room, explaining the whole bus timetable, calmer with every route)",2,"u",{mood:-1,vol:1}],
  ["Can't do small talk, can do big talk","Stalls at 'how are you?' but lights up at any real question.","Fine. — (someone asks about black holes) Oh, well, that's actually —",3,"c",{cur:1}],
  ["Remembers what others love and asks about it","Having been listened to, asks detailed follow-ups on other people's passions.","How's the beekeeping? Did the queen come back? You were worried about her.",2,"d",{cur:1,warm:1}],
  ["Lectures without noticing the room has left","Continues explaining long after everyone else has checked out.","— and then of course the third factor — (the room has emptied; she is talking to the coat rack)",5,"u",{vol:1,warm:-1}],
  ["Special interest as a lens","Explains the rest of life through the one subject they know completely.","It's like railway signalling. You can't have two trains in one block. That's your whole relationship.",4,"d",{cur:-1}],
], {behaviorFunction:"connect"});
block(CON, "Scripted Speech", 182800, [
  ["Rehearses the phone call first","Writes down what they'll say, practises it, and sticks to it once connected.","(reading from a card) Hello, I would like to make an appointment for Thursday. — We're closed Thursday. — (turns the card over)",3,"c",{ego:-1}],
  ["Quotes films to express feelings","Uses a line from a film or show where their own words won't come.","'I'm not crying. You're crying.' — I mean it. That's what I mean.",3,"u",{emo:-1,warm:1}],
  ["Same greeting, word for word, every day","A fixed phrase for hello and goodbye, delivered identically forever.","Good morning, good morning, good morning. (always three)",2,"c",{disc:1}],
  ["Borrowed phrases from admired people","Speaks in lines picked up from a favourite teacher, relative or presenter.","As my nan used to say, 'It'll all come out in the wash.' Also: in this case, literally.",2,"d",{warm:1}],
  ["Freezes when the script breaks","Handles expected exchanges well; an unexpected question stops them cold.","(order ready, card out, then:) 'Would you like to donate to —' (silence)",3,"u",{ego:-1,mood:-1}],
  ["Prepares a topic list before socialising","Brings mental notes of things to say and ticks them off.","Right. Holiday, new job, the dog. (to self, outside the door)",2,"s",{ego:-1}],
  ["Echoes a phrase back to hold it","Repeats a key phrase to themselves to process it before responding.","'Moving to Leeds.' Moving to Leeds. Okay. Okay.",2,"c",{pace:-1}],
], {behaviorFunction:"protect"});
block(CON, "Turn-Timing", 182900, [
  ["Answers after a long pause","Takes a real beat before replying, which people mistake for not having heard.","(four seconds) ...Yes. I'd like that.",2,"c",{pace:-1}],
  ["Jumps in on the half-beat","Starts talking a fraction early, from enthusiasm, and apologises every time.","— yes! Sorry. Sorry. You finish. Then yes.",3,"c",{pace:1,man:-1,disc:-1}],
  ["Waits for a gap that never comes","In fast group talk, holds a point for a gap, loses the moment, says it ten minutes late.","(long after the topic changed) — the thing about the bridge was, it's the same architect.",3,"u",{asrt:-1,vol:-1}],
  ["Asks permission to interrupt","Raises a hand, literally or verbally, before speaking.","Can I just — sorry — may I add something?",2,"u",{man:1,asrt:-1}],
  ["Parallel talking as warmth","Overlaps comfortably with friends and reads silence between turns as coldness.","(two sisters talking over each other, both perfectly understood)",3,"c",{vol:1,warm:1}],
  ["Monosyllables in groups, paragraphs alone","Near-silent in company, voluble one-to-one.","(at the party: 'yeah'. At 2 a.m., on the step: forty minutes on their childhood)",3,"s",{vol:-1,emo:1}],
  ["Takes the floor and keeps it","Holds a turn through pauses and interruptions by raising a hand or volume.","— no, let me finish — I'm finishing — thank you.",4,"c",{asrt:1,vol:1}],
  ["Gives the floor away gracefully","Notices who hasn't spoken and hands the turn to them.","Hang on — Priya, you were going to say something.",2,"s",{warm:1,man:1}],
], {behaviorFunction:"connect"});
block(CON, "Sensory Load", 183000, [
  ["Talks less as the room gets louder","Replies shorten sharply as noise builds, then return outside.","(sentences down to single words by the second band)",2,"c",{vol:-1,mood:-1,act:-1}],
  ["Names the sensory problem plainly","States what's too much without embarrassment.","Can we move? The light's buzzing. I can't hear you over the light.",3,"u",{hon:1,asrt:1}],
  ["Loses words under overload","Vocabulary drops out when stressed or overstimulated; speaks in fragments or not at all.","I — the — no. Give me a minute. (it takes ten)",4,"d",{mood:-1,vol:-1}],
  ["Always knows where the exit is","Picks seats for quiet and exits, and explains nothing.","(chooses the corner, back to the wall, by the fire door)",2,"c",{disc:1}],
  ["Hums or rocks to steady themselves","A small repetitive movement or sound that lets them keep talking.","(a low hum between sentences; the sentences stay calm)",2,"u",{emo:-1}],
  ["Fabric and food particularities","Mentions texture preferences as settled facts.","I can't do the wool. Or anything that's two textures. I'll have the bread.",3,"c",{hon:1}],
  ["Needs a quiet hour after company","Announces the need to recharge alone after socialising and holds to it.","That was lovely. I'm going to lie in a dark room now. Not a sad thing.",3,"s",{warm:-1,hon:1}],
], {behaviorFunction:"protect"});
block(CON, "Masking", 183100, [
  ["Copies other people's small talk","Borrows phrases and gestures from whoever they're with, a beat behind.","(uses the same 'oh, stop it' the host just used, the same laugh)",2,"c",{agr:1,hon:-1}],
  ["Practised eye contact","Holds eye contact deliberately and a little too steadily, counting.","(looks at the bridge of your nose; three seconds; away; three seconds; back)",2,"u",{disc:1}],
  ["Performs ease, collapses afterwards","Brilliant company for an evening, then gone for a day.","What a lovely night! (the next day, no replies, curtains drawn)",4,"d",{act:-1,warm:1}],
  ["Studied people like a subject","Talks about social rules as things they worked out deliberately.","I realised people say 'we should do this again' when they mean 'goodbye'. So I say it too.",3,"s",{hon:1}],
  ["Drops the mask with safe people","Shows a flatter, franker, more relaxed voice to a chosen few.","(to her brother, face finally still:) God, that was a lot of smiling.",3,"u",{hon:1,emo:1}],
  ["Laughs on cue, slightly late","Joins group laughter a fraction after the others, following the room.","(the laugh arrives a heartbeat after everyone else's)",2,"c",{agr:1}],
  ["Refuses to mask anymore","Has decided to stop performing ease, and says so with some defiance.","I'm not going to pretend to love brunch. I'm here. That's the gift.",4,"d",{rebel:1,hon:1,cur:-1}],
], {behaviorFunction:"protect"});

/* =====================================================================
   BODY IN SPEECH
   How a body shows up in talk. Disability and illness written as lived,
   practical, often funny, never pitiable by default.
   ===================================================================== */
const BOD = "Body in Speech";
block(BOD, "Pain & Fatigue", 183200, [
  ["Pauses mid-sentence to wait out a twinge","Stops, waits, and carries on exactly where they left off, as if nothing happened.","The thing about the budget is — (a breath, eyes shut) — is that it doesn't add up.",2,"c",{emo:-1}],
  ["Rates everything out of ten","Has absorbed the pain scale and uses it for sandwiches and films.","Film? Solid six. Bit of a four in the middle.",3,"u",{warm:1}],
  ["Jokes before anyone can pity","Opens with the self-deprecating line so nobody can make the sad face.","Don't worry, I'm only falling apart on the left side. The right's great.",3,"c",{emo:-1,warm:1}],
  ["Counts spoons out loud","Talks openly about rationing energy, with shorthand friends understand.","I've got about two outings in me today. This is one. Choose wisely.",3,"d",{hon:1}],
  ["Never mentions it, ever","Hides chronic pain completely; you only find out from someone else.","(gets up from the chair very slowly; says it's the chair)",2,"s",{hon:-1,emo:-1}],
  ["Weather-predicting joints","Announces rain by the knee and is always right.","Rain by three. — Forecast says sun. — Forecast hasn't got my knee.",2,"c",{pos:-1,ego:1}],
  ["Short-tempered when it flares","Irritability arrives with the pain and they apologise for it afterwards.","I'm sorry I snapped. It's not you. It's my back. It's always my back.",3,"u",{agr:-1,hon:1}],
  ["Talks about the body in the third person","Refers to their body as a difficult colleague.","It's not having a good day. I'm fine. It isn't.",3,"d",{emo:-1}],
  ["Asks for a chair without apology","Requests seating plainly and early, and treats it as unremarkable.","I'll need a chair. Thanks. Carry on.",2,"u",{asrt:1,hon:1}],
  ["Good-day, bad-day vocabulary","Describes every plan in terms of what kind of day it will be.","If it's a good day, I'll come. If it's a bad one, I'll send a cake.",2,"c",{hon:1,warm:1}],
], {behaviorFunction:"protect"});
block(BOD, "Hearing & Sight", 183300, [
  ["Asks for repetition without apology","Says 'again?' plainly and expects it done.","Again? — I said, is that the — — slower. And face me.",2,"c",{asrt:1,hon:1}],
  ["Bluffs through unheard lines","Nods and laughs at what they didn't catch rather than ask a third time.","(laughs, agrees warmly to something that was a question)",2,"u",{hon:-1,agr:1}],
  ["Positions for the good side","Always sits so the better ear or eye faces the speaker; will move chairs to do it.","Swap with me. No, I just like this side of the table.",1,"c",{disc:1}],
  ["Loud without knowing it","Speaks at a volume set by their own hearing and gets shushed in libraries.","(in the cinema:) WHO'S HE? — (fourteen people:) Shh.",3,"c",{vol:1}],
  ["Describes places by sound and touch","Gives directions and descriptions through non-visual detail.","You'll know it: the step's hollow, and there's a fan going on the left.",3,"d",{cur:1}],
  ["Reads lips and says so","Asks people to stop covering their mouths or turning away.","Don't mumble into your cup, I can't see what you're saying.",3,"u",{asrt:1}],
  ["Glasses as a prop","Takes glasses off to think, puts them on to judge, points with them.","(glasses off) Hm. (glasses on) No.",2,"c",{form:1}],
  ["Hears everything, pretends not to","Uses selective deafness strategically, with a small smile.","Pardon? (heard every word; wants to hear it said again, more carefully)",3,"d",{hon:-1,intel:1}],
  ["Reads everything aloud","Reads signs, menus and labels out loud as a habit, from years of it.","'Please do not feed the ducks.' Well, that's us told.",2,"c",{vol:1}],
], {behaviorFunction:"protect"});
block(BOD, "Medication & Management", 183400, [
  ["Structures the day around doses","Schedules conversation around medication, openly.","Can we do half six? I need to eat with the eight o'clock ones.",2,"c",{hon:1}],
  ["Pill-box small talk","Talks medications, dosages and side effects like the weather, with peers.","Oh, they've put you on the blue ones? You'll sleep. Take them early.",2,"u",{warm:1}],
  ["Keeps it strictly private","Never discusses treatment; changes the subject if it comes near.","I'm fine. What are we eating?",2,"c",{emo:-1,hon:-1,warm:-1}],
  ["Expert on their own condition","Knows more than most doctors about the one thing and corrects them politely.","Sorry, that interacts with what I'm on. You'd want the other one.",3,"d",{asrt:1}],
  ["Side effects as running commentary","Narrates the odd effects of their medication with dark amusement.","This one makes everything taste of pennies. Enjoy your cake, I'll enjoy my coins.",3,"s",{emo:-1,warm:1}],
  ["Hates being asked 'how are you?'","Bristles at the health check-in and asks people to stop.","I'm fine. Ask me about anything else. Ask me about football.",4,"u",{agr:-1,emo:-1,warm:-1}],
  ["Talks about therapy like the dentist","Mentions their appointments matter-of-factly, as maintenance.","Can't Thursday, I've got therapy. Then the car's MOT. Busy day for upkeep.",2,"c",{hon:1,emo:1}],
], {behaviorFunction:"protect"});
block(BOD, "Breath & Stamina", 183500, [
  ["Talks in short breaths","Speaks in shorter phrases, pausing to breathe, and doesn't let it slow the argument.","No. (breath) You're wrong. (breath) And here's why.",3,"c",{vol:-1,asrt:1}],
  ["Walks and talks at the same slow pace","Sets the tempo of a walk and a conversation together, unhurried.","Slowly. We're not late. Tell me the rest.",2,"u",{pace:-1}],
  ["Sits down to say anything important","Needs to sit for real conversations, and has made it a ritual.","Hang on. Let me sit. Right. Now tell me.",2,"s",{disc:1,act:-1}],
  ["Performs vigour","Insists on stairs, lifting, carrying — and talks through the strain.","No, I've got it — (gasping) — perfectly fine.",4,"c",{ego:1,hon:-1,act:1}],
  ["Fades mid-evening","Visibly sharp until nine, then words thin and they leave without drama.","Right, that's me. Brain's off. Lovely night.",2,"c",{act:-1,hon:1}],
  ["Athlete's body talk","Talks about their body in terms of splits, reps and recovery.","Can't. Recovery day. My hamstrings have filed a complaint.",3,"u",{act:1}],
], {behaviorFunction:"protect"});
block(BOD, "Stammer & Speech Blocks", 183600, [
  ["Swaps the word that won't come","Steers around a blocked word with a synonym, fast enough that most never notice.","I'll have the — the chicken. — You wanted the beef. — The chicken's fine.",2,"c",{disc:1}],
  ["Waits out the block, won't be rushed","Holds the pause and doesn't accept help finishing the word.","I — (a long block) — I'm going to Sheffield. Don't finish it for me.",3,"d",{asrt:1,ego:1}],
  ["Fluent when singing or angry","The stammer disappears in song, in fury, or in another voice.","(blocks on hello; delivers a flawless tirade when someone kicks a dog)",3,"s",{emo:1}],
  ["Avoids the phone","Arranges life so calls are rare; texts first, explains nothing.","Text me. I'm better at text.",2,"c",{asrt:-1},{worldTags:["modern"]}],
  ["Names the stammer up front","Tells new people at the start, plainly, and the rest goes easier.","I stammer. Takes me a second sometimes. Worth the wait, mostly.",3,"u",{hon:1,warm:1}],
  ["Terse to avoid hard sounds","Speaks in few words to minimise risk, and is read as cold.","Yes. Fine. Tuesday.",2,"u",{vol:-1,warm:-1}],
  ["Speeds up to outrun the block","Rushes the sentence to get it out before the stammer catches it.","(the whole sentence in one breath, very fast) I-want-the-blue-one-please.",3,"c",{pace:1}],
  ["Uses a starter word","Leads into hard words with a practised 'well' or 'so', every time.","So — so, Birmingham. So, that's where I'm from.",2,"u",{disc:1}],
], {behaviorFunction:"protect"});

/* =====================================================================
   MONEY & CLASS
   ===================================================================== */
const MON = "Money & Class";
block(MON, "Thrift Talk", 183700, [
  ["Knows the unit price of everything","Compares pence per hundred grams aloud, in any shop.","This one's cheaper per gram. The big one's a con.",2,"c",{disc:1,intel:1}],
  ["Reuses and reports it","Tells you what the thing was before it was this.","This was a curtain. Then a dress. Now it's a bag. Next it'll be dusters.",3,"u",{pos:1,warm:1}],
  ["Refuses to throw food away, narrates it","Keeps and eats leftovers ostentatiously, with commentary on waste.","That's perfectly good. That's four days, that. Nothing wrong with it.",3,"c",{agr:-1,disc:1}],
  ["Bargain as triumph","Recounts deals and discounts like battle victories.","Guess. Go on, guess. — Twenty? — FOUR. Four pounds. Reduced.",4,"c",{ego:1,vol:1,disc:-1}],
  ["Frugal in private, generous in public","Darns their own socks and picks up everyone's tab.","(the coat is twelve years old; the round is on him)",2,"s",{ego:-1,warm:1}],
  ["Everything has a 'good one' and an 'everyday one'","Keeps best plates, best coat, best voice, for occasions that never come.","Not those glasses. Those are for best. — When's best? — Not today.",2,"d",{pos:-1,disc:1}],
  ["Refuses to spend on themselves","Will buy anything for others; can't justify a pair of shoes.","I don't need it. My old ones are fine. (they are held together with tape)",3,"u",{ego:-1,warm:1}],
  ["Thrift as moral judgement","Reads others' spending as character flaws.","Brand-new car. On what he earns. Says it all.",4,"d",{warm:-1,agr:-1}],
  ["Turns off lights in other people's houses","Follows people round rooms switching things off, including at parties.","(the bathroom light goes out while you're still in the bathroom)",3,"c",{disc:1,man:-1}],
  ["Takes the sachets","Pockets free sugar, ketchup and napkins everywhere, as a matter of principle.","They're included. You've paid for them. It's not stealing, it's collecting.",2,"u",{disc:1,hon:-1}],
  ["Frugal, and quietly proud of it","Speaks of making do without complaint or boast; it is simply how things are done.","We don't buy what we can mend. That's all.",1,"s",{disc:1,pos:1}],
], {behaviorFunction:"protect"});
block(MON, "Status Signalling", 183800, [
  ["Name-drops brands and places lightly","Mentions the labels, the resorts and the schools in passing, as if unaware.","We were in Gstaad — well, you know what Gstaad's like at Easter.",3,"c",{ego:1,hon:-1}],
  ["Performs understatement","Downplays wealth so theatrically that it announces itself.","Oh, it's just a little place. In the country. With a lake. A small lake.",3,"d",{ego:1,hon:-1}],
  ["Quotes prices to impress","Tells you exactly what things cost, always high.","Three hundred for the bottle. You can taste it, though, can't you?",4,"c",{ego:1,vol:1,warm:-1}],
  ["Knows the right fork, and watches you","Notes others' social mistakes silently and visibly.","(an eyebrow at the bread knife; nothing said)",2,"s",{man:1,warm:-1}],
  ["Aspirational vocabulary","Picks up words from a class they're climbing toward and uses them carefully.","It's a very — bijou — sort of place. Very artisanal.",3,"u",{form:1,ego:-1}],
  ["Invisible wealth, invisible effort","Never mentions money at all, which is itself a tell of a certain upbringing.","(a vague wave at 'the house' — which turns out to be a listed estate)",1,"s",{vol:-1,man:1}],
  ["Flaunts the self-made story","Talks constantly about having started with nothing.","I came here with one suitcase. ONE. Now look.",4,"c",{ego:1,pos:1}],
  ["Mentions the school within a minute","Drops where they were educated into any first conversation.","— which reminds me of a master we had at Harrow — anyway.",3,"c",{ego:1,hon:-1}],
  ["Dresses down to signal more","Wears old clothes deliberately to show they don't need to try.","(the jumper has holes; it cost more than your car)",2,"d",{ego:1,rebel:1}],
  ["Corrects pronunciation of wine","Can't let a mispronounced label pass.","It's 'Mer-lo'. Silent T. Anyway, enjoy.",3,"u",{ego:1,agr:-1}],
], {behaviorFunction:"perform"});
block(MON, "Money Taboo", 183900, [
  ["Never says what they earn","Deflects money questions completely, even among close friends.","Enough. It's enough. What are you having?",2,"c",{hon:-1,emo:-1}],
  ["Talks about money freely and uncomfortably","States salary, rent and debts openly and watches people flinch.","I earn thirty-one. My rent's eleven. What about you?",4,"d",{hon:1,rebel:1}],
  ["Hides debt with jokes","Makes light of money troubles so nobody asks the real question.","Me? Loaded. Loaded with debt. Ha! Anyway.",3,"c",{hon:-1,warm:1}],
  ["Euphemisms for being broke","Calls poverty 'a tight month', 'between things', 'being careful'.","Bit tight this month. We're being careful.",2,"c",{hon:-1,man:1}],
  ["Can't accept a gift or a favour","Insists on paying back immediately, precisely.","That's four-twenty I owe you. I'll transfer it. No, I will.",3,"u",{ego:-1,disc:1}],
  ["Silent at the bill","Goes quiet and still whenever the check arrives.","(becomes very interested in a coat hook)",2,"d",{asrt:-1,act:-1}],
  ["Explains inheritance as luck","Uneasily frames family money as happenstance.","It was just — I was very lucky with my grandparents. It's not really mine.",3,"s",{hon:1,ego:-1}],
  ["Splits bills to the penny","Calculates exact shares with a calculator, out loud, at the table.","You had the soup, so you're eleven-forty. I had the bread, but I'll call it even.",3,"c",{disc:1,warm:-1}],
  ["Treats talk of money as vulgar","Winces when prices are mentioned and changes the subject.","Oh, let's not talk about that. How are the children?",2,"u",{man:1,emo:-1}],
], {behaviorFunction:"protect"});
block(MON, "Class-Mobility Tells", 184000, [
  ["Two sets of manners, visibly swapped","Moves between the table manners of childhood and the ones learned later, depending on who's watching.","(elbows on the table with her mum; perfect posture with the in-laws)",2,"c",{agr:1}],
  ["Defends where they came from","Bristles at any sneer about their old neighbourhood.","Say that again. Go on. I grew up two streets from there.",4,"c",{emo:1,asrt:1}],
  ["Uneasy with staff","Over-thanks waiters and cleaners, a little too warmly.","Thank you. No, really, thank you so much. You're so kind.",2,"u",{ego:-1,warm:1}],
  ["Ashamed of the old accent","Deliberately suppresses words from home and flinches when they slip out.","(says 'bath' the old way; blushes; says it again, the new way)",3,"d",{ego:-1,hon:-1}],
  ["First in the family to — and says so","Mentions being first to go to university or own a house, often.","First one in the family with a degree, me. Did I say?",3,"c",{ego:1,pos:1}],
  ["Moved down, talks as if they didn't","Lost money but kept the vocabulary and the expectations.","We'll simply have the man come and look at it. — There isn't a man. — Well, find one.",4,"s",{ego:1,hon:-1}],
  ["Money makes them nervous either way","Gets anxious both when short and when flush; wealth itself feels unsafe.","I've got savings. It feels wrong. Like it'll get taken.",3,"d",{mood:-1,pos:-1}],
  ["Still checks the price first","Wealthy now, and still looks at the right-hand column of every menu.","(eyes go straight to the prices, then, guiltily, to the dishes)",1,"s",{disc:1,ego:-1}],
  ["Ashamed of shame","Knows they should be proud of where they came from and feels bad that they're not.","I shouldn't care what they think of Mum's house. I do. I hate that I do.",3,"d",{hon:1,emo:1}],
  ["Mocks their new class from inside it","Enjoys the comforts and satirises the people who have them, including themselves.","Look at us. Olive oil tasting. My nan would have us sectioned.",3,"u",{warm:1,rebel:1}],
], {behaviorFunction:"signal"});

/* =====================================================================
   FEARS & AVERSIONS — the concrete ones. Core Fear stays abstract.
   ===================================================================== */
const FEA = "Fears & Aversions";
block(FEA, "Phobias", 184100, [
  ["Won't sit with their back to a door","Chooses seats for sightlines to every entrance and swaps chairs if needed.","Swap with me. — Why? — I just like this side.",2,"c",{mood:-1,disc:1}],
  ["Water above the knees","Refuses swimming, boats and deep baths, and plans holidays around it.","I'll mind the bags. On the beach. Well back from the sea.",3,"u",{act:-1}],
  ["Heights, laughed off, sweating","Makes jokes about vertigo while gripping the rail white-knuckled.","Lovely view. Lovely. Don't let go of my arm.",3,"c",{hon:-1,warm:1}],
  ["Terrified of a harmless animal","Genuine fear of something others find sweet — moths, pigeons, geese — and no embarrassment about it.","It's a goose. — I know what it is. Walk the other way.",3,"d",{hon:1}],
  ["Flying, managed by ritual","Flies, but with pre-flight routines, counting and a particular seat.","Aisle. Row eleven. I count the bolts. Don't talk to me till the drinks.",3,"u",{mood:-1,disc:1},{worldTags:["modern"]}],
  ["The dark, still, at forty","Sleeps with a light on and says so without shame.","I just like to see the room. What's wrong with seeing the room?",2,"s",{hon:1,ego:-1}],
  ["Needles, and faints","Faints at injections and warns nurses in advance, cheerfully.","I'll go over. It's fine. Catch me if you can.",3,"c",{hon:1,warm:1}],
  ["Enclosed spaces","Takes stairs over lifts, always, with an excuse ready.","I'll walk. Good for the legs. (eleven floors)",3,"c",{hon:-1,act:1}],
  ["Fear of fire, practical about it","Checks the hob, the plugs, the candles three times before leaving any room.","Hob's off? Candle? Hang on. Hob.",3,"u",{mood:-1,disc:1}],
  ["Dogs, from one bad afternoon","A specific fear with a specific origin, which they will tell you about in detail if you bring a dog.","It was a Tuesday. I was seven. It was an Alsatian. — It's a sausage dog. — They all start somewhere.",3,"c",{hon:1,emo:1}],
  ["Drives miles to avoid a bridge","Plans every route around one kind of structure and never admits why.","We'll go the scenic way. — It's forty minutes longer. — It's scenic.",3,"d",{hon:-1,disc:1}],
  ["Storms send them under the stairs","Thunder unmakes them completely, and they have stopped pretending otherwise.","(first rumble; already in the cupboard with a torch and a book)",4,"u",{hon:1,mood:-1}],
  ["Treats their fear as a fact of nature","Mentions the phobia as flatly as their shoe size, and expects plans to adjust.","I don't do lifts. So we'll be taking the stairs. All of us, yes.",3,"s",{asrt:1,hon:1}],
  ["Braves it loudly for the children","Suppresses a terror in front of dependants with a running commentary of false cheer.","Look at the lovely big spider! Isn't he — lovely. Let's go and look at something else.",3,"d",{warm:1,hon:-1},{conditions:["dependent"]}],
], {behaviorFunction:"protect"});
block(FEA, "Social Dreads", 184200, [
  ["Dreads being the centre of attention","Birthdays, speeches and toasts are ordeals; prefers to be sung at by nobody.","Please don't sing. Please. I'll pay you not to sing.",3,"c",{ego:-1,vol:-1}],
  ["Can't bear being laughed at","Laughs with others easily, goes cold the moment it turns to laughing at.","(the smile drops the moment the joke points her way)",4,"d",{emo:1,warm:-1}],
  ["Fear of arriving late","Arrives absurdly early to everything, then waits nearby.","I've been round the block four times. It's fine. I like the block.",2,"c",{disc:1}],
  ["Dreads phone calls","Lets calls ring out, then texts 'did you ring?'","(watches it ring; texts:) Sorry, missed you! What's up?",2,"c",{asrt:-1},{worldTags:["modern"]}],
  ["Fear of being a burden","Won't ask for help, and apologises for existing in hallways.","Sorry, am I in the way? I'll go. I'll stand over here.",3,"c",{ego:-1,agr:1}],
  ["Dread of being found boring","Keeps talking to fill every silence, afraid of what silence says.","— and anyway that's the thing about owls, which, anyway —",3,"u",{vol:1,ego:-1}],
  ["Terror of seeming stupid","Won't ask questions in public; researches everything later.","Oh, yes, of course. (looks it up in the toilets)",3,"d",{ego:-1,hon:-1}],
  ["Dreads goodbyes","Leaves parties without saying goodbye to anyone, every time.","(gone. Coat gone. A text at midnight: 'had to dash x')",3,"s",{warm:-1,emo:-1}],
  ["Rehearses small talk in the car","Arrives with lines prepared for the dreaded party and delivers them slightly too early.","So! Have you been anywhere nice? (they have just said hello)",2,"c",{disc:1,ego:-1}],
  ["Dreads being asked to introduce themselves","Freezes at 'say a bit about yourself' and says their name like a confession.","I'm — Sam. That's — yes. That's it. That's me.",3,"u",{ego:-1,vol:-1}],
  ["Terrified of disappointing an expert","Can't speak naturally around anyone who knows more than they do about their own subject.","(to the professor, in a small voice) I just — I read a bit. Only a bit.",3,"d",{ego:-1,asrt:-1},{conditions:["authority"]}],
  ["Fears silence in a car","Fills every drive with talk, radio, anything but the quiet of two people side by side.","(radio on before the seatbelt) So! Traffic!",2,"c",{vol:1}],
  ["Dread of making the first call","Will do anything for a friend except ring them first.","I'd love to see them. They know where I am. (eleven months)",3,"s",{asrt:-1,warm:-1}],
], {behaviorFunction:"avoid"});
block(FEA, "Bodily Aversions", 184300, [
  ["Can't stand being touched unexpectedly","Flinches at surprise contact and asks people to announce themselves.","Just — say something first. Before the hand.",3,"c",{warm:-1,hon:1}],
  ["Aversion to hospitals and their smell","Goes pale at disinfectant and waits outside.","I'll be in the car. It's the smell. Tell her I love her.",3,"u",{emo:1,act:-1}],
  ["Can't watch anyone eat with their mouth open","Leaves the table, visibly suffering, rather than say anything.","(pushes plate away; stares fixedly at the salt)",2,"c",{man:1,agr:-1}],
  ["Blood makes them useless","Faints or freezes at blood and warns everyone in advance.","If anyone cuts themselves, I'm not your man. I'll be on the floor.",3,"c",{hon:1}],
  ["Hates the feel of certain textures","Cotton wool, velvet, chalk: named, avoided, discussed.","Don't. Don't touch the cotton wool near me. The squeak.",2,"d",{hon:1}],
  ["Aversion to mirrors","Avoids reflections, doesn't say why.","(fixes hair by feel, in the lift, facing the door)",2,"s",{ego:-1,emo:-1}],
  ["Vomit phobia runs the diary","Cancels plans at a rumour of stomach bugs.","Anyone ill? At all? A sniffle? I'll come next time.",4,"u",{mood:-1,disc:1}],
  ["Can't be in a room with a ticking clock","Takes batteries out of other people's clocks and doesn't explain.","(the kitchen clock is face-down in a drawer again)",3,"d",{disc:1}],
  ["Revulsion at the dentist, joked about","Makes a comic routine out of a genuine horror of dental chairs.","I'd rather have my teeth fall out than — well. That's the choice, isn't it.",2,"c",{warm:1,emo:-1}],
  ["Won't eat anything that looks back","Politely refuses whole fish, shellfish with eyes, anything with a face on the plate.","Lovely. Could you — could someone turn him round?",2,"c",{man:1}],
  ["Can't bear the sound of chewing","Suffers in near silence at meals and needs music on.","(puts the radio on before anyone lifts a fork)",3,"u",{mood:-1}],
  ["Shudders at a limp handshake","Physically recoils from weak grips, and has an opinion about it.","(wipes hand on trouser) Like shaking hands with a flannel.",3,"d",{agr:-1,ego:1}],
], {behaviorFunction:"avoid"});

/* =====================================================================
   FAMILY TALK
   ===================================================================== */
const FAM = "Family Talk";
block(FAM, "Talks About Family Constantly", 184400, [
  ["Every story has a relative in it","Can't tell an anecdote without an aunt, a cousin or a dad appearing.","So my cousin — you know, the dentist one — she says —",3,"c",{vol:1,warm:1}],
  ["Quotes Mum as authority","Settles questions by what Mum says, at forty.","Mum says never buy fish on a Monday. So.",2,"c",{rebel:-1,warm:1}],
  ["Shows photos unprompted","Phone out, grandchildren up, within five minutes of meeting anyone.","Look. Look at him. That's the new one. Look at the fists.",3,"c",{emo:1,warm:1},{worldTags:["modern"]}],
  ["Family group chat narrated live","Reads out the family chat as it happens, with commentary.","Oh God, Dad's discovered the thumbs-up. He's thumbed everything.",3,"u",{warm:1},{worldTags:["modern","online"]}],
  ["Treats friends as honorary family","Folds people into the family structure: 'my brother, well, not really'.","This is my sister. Not my sister-sister. My sister.",2,"d",{emo:1,warm:1}],
  ["Family as brag","Talks up relatives' achievements relentlessly.","My daughter — the one at the hospital — the surgeon — did I say surgeon?",4,"c",{ego:1,vol:1}],
  ["Complains about family endlessly, fiercely loyal","Moans about them for hours and defends them to the death if anyone else agrees.","My brother is a nightmare. — Yeah, he sounds — — Don't you dare.",4,"s",{emo:1,agr:-1}],
  ["Relays messages from absent relatives","Passes on greetings, warnings and opinions from family members nobody present has met.","My aunt says hello. And that you should wear a vest.",2,"c",{warm:1}],
  ["Family history as conversation","Tells long genealogical stories about great-grandparents to people who didn't ask.","— and HIS father had the pub, which is how we got the piano —",3,"u",{vol:1,cur:1}],
  ["Worries about family out loud","Every conversation includes an update on a relative's health, marriage or job.","Anyway, Dad's knee. The doctor says six weeks. I don't believe him.",2,"c",{mood:-1,warm:1}],
], {behaviorFunction:"connect"});
block(FAM, "Never Mentions Family", 184500, [
  ["Deflects every family question","Turns 'where are your parents?' into a question about you.","Oh, around. What about yours? Are you close?",2,"c",{hon:-1,emo:-1,warm:-1}],
  ["One-line family history","Has a single rehearsed sentence about their family and nothing further.","Grew up in the north, one brother, we're not close. Next.",3,"u",{vol:-1,emo:-1,warm:-1}],
  ["Family revealed only by accident","Years in, a friend learns of a sibling from a funeral notice.","(the wedding list has a name nobody has heard of: 'my sister')",2,"s",{hon:-1}],
  ["Talks about family as if they're dead","Uses the past tense for living relatives.","My father was a teacher. — Was? — Is. He's alive. We don't speak.",3,"d",{emo:-1,pos:-1}],
  ["Chosen family only","Speaks warmly of friends as family and never of blood relatives.","My family's the people round this table. That's all I've got. That's plenty.",3,"c",{rebel:1,warm:1}],
  ["Changes the subject physically","At a family question, gets up — to fill a glass, to open a window.","(suddenly needs to check on the oven)",2,"c",{asrt:-1}],
  ["Goes quiet on holidays","Changes register entirely around family occasions and offers no explanation.","Christmas? Oh, quiet one. Probably work. (it is always work)",2,"d",{emo:-1,vol:-1}],
  ["Invents a family when pressed","Supplies a vague, pleasant, fictional family to end the questioning.","Oh, two brothers, both lovely, both in Canada. (there are no brothers)",4,"s",{hon:-1}],
  ["Talks freely about everyone else's","Endlessly interested in other people's families, silent on their own.","How's your mum? And your sister's new baby? And your gran?",2,"c",{warm:1,cur:1}],
], {behaviorFunction:"avoid"});
block(FAM, "Sibling Rivalry", 184600, [
  ["Still competes at sixty","Measures every life event against a sibling's, openly.","His house is bigger. Mine's got better light. Light matters more.",3,"c",{ego:1,agr:-1,warm:-1}],
  ["Knows exactly what hurts","Uses the sibling's old nickname, and it lands like a slap.","Alright, Beanpole. — Don't. — Beanpole.",4,"u",{warm:-1,agr:-1}],
  ["Scorekeeper of parental favour","Remembers every childhood unfairness and cites them.","She got the bike. I got the hand-me-down. 1989. I remember.",3,"c",{emo:1,pos:-1}],
  ["Rivalry as affection","Mock-competes relentlessly, and it's clearly love.","I'm the favourite. — You're adopted. — Mum loved me more for it.",3,"d",{rebel:1,warm:1}],
  ["Reverts to age twelve","In a sibling's presence, adulthood evaporates.","(the CEO, flicking peas at his brother)",4,"c",{disc:-1,warm:1}],
  ["Protective of a younger sibling to a fault","Talks about them with a parent's watchfulness.","Has he eaten? Has anyone checked he's eaten?",2,"s",{asrt:1,warm:1}],
  ["Only-child certainties","Speaks with the untroubled confidence of never having had to share, and knows it.","I don't do sharing. Only child. It's not a flaw, it's a fact.",3,"u",{ego:1,hon:1}],
  ["Middle-child diplomacy","Mediates every argument by reflex, having done it since age four.","Right. You both have a point. Let's all just —",2,"c",{agr:1,warm:1}],
  ["Eldest-child authority","Instructs siblings — and friends, and colleagues — with the assurance of the firstborn.","No, I'll handle it. I always handle it.",3,"c",{asrt:1,disc:1}],
], {behaviorFunction:"signal"});
block(FAM, "Parent-Voice Echo", 184700, [
  ["Hears a parent come out of their mouth","Catches themselves saying the parent's phrases and stops, horrified.","Because I said so — oh no. Oh no. I've become her.",3,"c",{hon:1,warm:1}],
  ["Uses the parent's voice for discipline","The parent's exact tone emerges when correcting others.","(a voice that isn't hers) Don't you use that tone with me.",3,"u",{asrt:1}],
  ["Parent's opinions as their own","States a parent's views without realising, word for word.","Never trust a man with a small dog. — Where's that from? — ...My dad.",2,"d",{intel:-1}],
  ["Deliberately the opposite","Has built their manner as a refusal of the parent's, and says so.","My father shouted. I don't shout. I have never shouted.",3,"s",{emo:1,disc:1}],
  ["Parent's catchphrases, fondly used","Keeps a dead parent's sayings alive on purpose, with love.","As Dad would say: 'That's life in the big city.' (smiles, looks away)",2,"c",{emo:1,warm:1}],
  ["Parent's anxieties, inherited verbatim","Says the parent's worries aloud without noticing.","Have you got a coat? It'll turn. It always turns.",2,"c",{mood:-1,warm:1}],
  ["Parent's sayings with scare quotes","Uses the parent's phrases while visibly distancing themselves from them.","As my mother would say, 'a lady doesn't.' Thank you, Mother.",3,"d",{rebel:1,emo:-1}],
  ["Defends the parent they complain about","Criticises a parent at length and bristles if anyone agrees.","He was hopeless. — Sounds awful. — He did his best. Don't.",3,"u",{emo:1,agr:-1}],
], {behaviorFunction:"signal"});

/* =====================================================================
   HUMOR STYLE — eight new subtypes in the existing section
   ===================================================================== */
const HUM = "Humor Style";
block(HUM, "Observational", 184800, [
  ["Notices the absurd detail nobody mentioned","Points out the small ridiculous thing everyone saw and nobody said.","Is nobody going to talk about the fact the fire exit is a painting of a door?",3,"c",{cur:1,intel:1}],
  ["Narrates strangers","Provides a quiet running commentary on passers-by, affectionate and precise.","He's going to try the door that says 'pull'. He's going to push it. (he pushes) Every time.",3,"u",{cur:1,warm:1}],
  ["The deadpan 'why is it like this'","Questions ordinary conventions with genuine bafflement until they become funny.","Why do we say 'after you' to a lift? The lift doesn't care.",2,"d",{emo:-1,intel:1}],
  ["Funny only about the specific","Never tells jokes; is devastating about the particular room, the particular day.","(of the wedding buffet) Three kinds of coleslaw. Somebody made a decision.",2,"s",{vol:-1,intel:1}],
  ["Observational to the point of rudeness","Can't stop noticing, can't stop saying, even when the subject is in earshot.","His tie matches the carpet. — He's right there. — And the curtains.",4,"c",{man:-1,agr:-1,warm:-1}],
  ["Collects overheard lines","Repeats the strangest overheard sentences as treasures.","A man on the bus today said, 'I'm not being funny, but I've had it with swans.'",3,"d",{cur:1,warm:1}],
  ["Everyday life as stand-up","Recounts a trip to the post office with a comedian's timing.","So the queue — and you know the queue — the queue had a guy with a pram full of parcels.",4,"u",{vol:1,ego:1}],
  ["Finds the funny in their own routine","Wry about their own habits, never anyone else's.","Four alarms. I set four alarms. For the one I actually use.",2,"c",{ego:-1,warm:1}],
]);
block(HUM, "Pun-Groaner", 184900, [
  ["Puns and waits for the groan","Makes the pun and holds eye contact until someone suffers.","I used to be a banker, but I lost interest. (waits) (waits)",3,"c",{rebel:1,warm:1}],
  ["Can't stop once one's landed","One pun releases a chain of them, escalating.","Egg-cellent. Egg-straordinary. Don't egg me on. I'm cracking up.",4,"c",{disc:-1,vol:1}],
  ["Groans at own pun, proudly","Delivers a terrible pun and winces at it before anyone else can.","Whale, whale, whale — oh, no. Oh, that's awful. I'm keeping it.",3,"u",{ego:-1,warm:1}],
  ["Quiet, perfect pun","Slips one exact pun into serious conversation and doesn't smile.","(of the failed bakery) They kneaded the money. (doesn't look up)",2,"s",{emo:-1,intel:1}],
  ["Weaponised pun","Uses wordplay to derail arguments they're losing.","You're being unreasonable. — I'm being un-reason-able. It's able. It's still able.",4,"d",{agr:-1,rebel:1,warm:-1}],
  ["Loves puns in other languages","Makes bilingual puns that only half the room can get.","It's a tragedy in two acts. Or in French, a tragédie in deux — no? No? Only me.",3,"d",{cur:1,intel:1}],
  ["Pun-name everything","Names pets, boats and wi-fi networks with puns.","The cat's called Cat Stevens. The boat's called Nauti Buoy. The router's Bill Wi the Science Fi.",2,"c",{pos:1,warm:1}],
  ["Hates puns, loudly","Physically recoils from wordplay and says so, which everyone exploits.","If you do another pun I will walk into the sea. — Sea you later. — (leaves)",3,"u",{agr:-1,pos:-1,warm:-1}],
]);
block(HUM, "Callback & Running Bit", 185000, [
  ["Callback within the same conversation","Plants a line early and pays it off twenty minutes later.","— and that, as with the swans, was that. (the table erupts)",3,"c",{intel:1}],
  ["Running bit with strangers","Starts a bit with a barista or bus driver and keeps it going every day.","Morning, Captain. — Morning, Admiral. (they have never explained this to anyone)",3,"u",{rebel:1,warm:1}],
  ["Runs the bit past its death","Won't let go of a joke long after everyone's tired of it.","Remember when you said 'crisp'? Crisp. Crisp! — It's been a year. — Crisp.",4,"c",{disc:-1,agr:-1,intel:-1}],
  ["Callbacks as memory of love","Uses shared jokes to prove they remember, and it's how affection shows.","Two sugars, no swans. — You remembered. — Always.",2,"d",{emo:1,warm:1}],
  ["Inside jokes that exclude","Leans on in-group references in mixed company and doesn't explain.","Very Tuesday of you. (two people laugh. Four don't.)",3,"u",{warm:-1,ego:1}],
  ["Keeps a mental file of everyone's best lines","Quotes friends' old jokes back to them, with attribution, as tribute.","As Dev said in 2014: 'It's not a problem, it's a feature with feelings.'",2,"s",{warm:1,disc:1}],
  ["A running bit only one other person gets","Keeps a private joke alive with one person across a crowded room, with a single word.","(across the boardroom, deadpan:) Swans. (she has to leave the room)",3,"d",{warm:1,rebel:1}],
  ["Callbacks nobody remembers but them","Revives jokes from so long ago that the room just stares.","Like the thing with the bin! — What bin? — 2009? The bin? Nobody?",3,"c",{ego:-1,vol:1}],
]);
block(HUM, "Gallows", 185100, [
  ["Jokes hardest at the worst moment","The worse things get, the funnier they become, and the jokes are how they cope.","Well, at least the ship's sinking slowly. Gives us time to finish the wine.",4,"c",{emo:-1,pos:1}],
  ["Dark humour about their own illness","Makes jokes about their own mortality that make visitors unsure whether to laugh.","I'd ask for the long-term parking but let's be optimistic about the short-term.",3,"d",{emo:-1,warm:1}],
  ["Gallows humour as professional armour","The dark jokes of their trade — nursing, policing, soldiering — used to keep going.","Another one for the frequent-flyer club. Stick the kettle on.",3,"c",{emo:-1},{worldTags:["institutional"]}],
  ["Knows when to stop","Can be very dark and very funny, and reads the exact moment it would stop helping.","(one line at the wake gets the widow laughing; then nothing further)",2,"s",{intel:1,warm:1}],
  ["Jokes about the thing nobody else will mention","Names the elephant through comedy.","So. Nobody's going to mention that Dad's new wife is younger than me? Great. Lovely trifle.",4,"u",{rebel:1,hon:1}],
  ["Morbid for fun","Enjoys planning their own funeral out loud, in detail.","I want a jazz band. And a slideshow of me looking disappointed.",3,"d",{pos:1,emo:-1}],
  ["Dark jokes that go too far, knowingly","Pushes the dark joke one step past the line, watching who laughs.","(at the hospice) Right, who wants to split the grapes? He won't be needing them.",5,"u",{warm:-1,rebel:1}],
]);
block(HUM, "Physical & Slapstick", 185200, [
  ["Commits to the pratfall","Falls over, walks into doors, and does it deliberately for a laugh.","(walks into the glass door at full speed, bows to the room)",4,"c",{ego:-1,act:1}],
  ["Face does the joke","Silent, elastic expressions that make every story funnier.","(one eyebrow climbs, slowly, the whole length of the anecdote)",2,"u",{vol:-1,act:1}],
  ["Accidentally slapstick, owns it","Genuinely clumsy, and has turned it into their comic persona.","Right, I've spilled it. Three for three. Someone put a bib on me.",3,"c",{hon:1,intel:-1}],
  ["Dance as punchline","Bursts into a short, terrible dance to punctuate good news.","(eight bars of an alarming jig, then back to typing)",3,"d",{pos:1,act:1}],
  ["Props at the ready","Keeps a rubber chicken, a silly hat or a kazoo in a bag.","(produces a kazoo at the board meeting; plays one note)",5,"s",{rebel:1,act:1}],
  ["Only physical humour, never verbal","Won't tell a joke, but a well-timed shrug brings the house down.","(the smallest shrug in the history of shrugs)",2,"s",{vol:-1}],
]);
block(HUM, "Teasing as Affection", 185300, [
  ["Only teases the people they love","Mockery is reserved for the inner circle; strangers get politeness.","Oh, look who's finally dressed like an adult. — Love you too.",3,"c",{agr:-1,warm:1}],
  ["Teases then checks","Lands a gentle jibe and immediately checks it was okay.","You're a terrible driver. — ...Too far? Sorry. You're a fine driver. You're a bad parker.",2,"u",{man:1,warm:1}],
  ["Nicknames for everyone they like","Gives fond, silly names and uses them for decades.","Alright, Spud. — I'm fifty-two. — Alright, Spud.",2,"c",{warm:1}],
  ["Teasing as the only way to say it","Can't give a compliment straight; it has to come wrapped in an insult.","Your cake's not completely inedible. — Thanks. — It's brilliant. Don't tell anyone I said.",3,"d",{emo:-1,warm:1}],
  ["Ruthless roast, total loyalty","Mercilessly mocks a friend in private and defends them fiercely to outsiders.","He's an idiot. My idiot. You call him that again and we'll step outside.",4,"s",{asrt:1,warm:1}],
  ["Teasing that doesn't read the room","Can't tell when the teasing has stopped being fun.","Oh, come on, it's a joke! You love it! — (she doesn't)",4,"c",{warm:-1,intel:-1}],
  ["Teases up, never down","Mocks the boss, the rich, the confident — never the struggling.","Morning, your Majesty. — I'm your line manager. — Lesser Majesty.",3,"d",{rebel:1,warm:1}],
]);
block(HUM, "Laughs at Own Jokes", 185400, [
  ["One sharp laugh at their own line","A single, delighted bark at their own wit, alone.","(says something mildly clever; a lone 'Ha!'; nobody else)",2,"u",{ego:1}],
  ["Explains why it was funny","When a joke falls flat, walks everyone through it.","No, because — it's a pun — 'lettuce' and 'let us' — no?",3,"c",{ego:-1,vol:1}],
  ["Infectious own-laughter","Laughs at their own joke so helplessly that everyone else joins in without getting it.","(nobody heard the punchline; the whole table is crying)",4,"d",{pos:1,warm:1}],
  ["Silent private chuckle","Quietly amused at a joke they haven't said aloud.","(shoulders shaking at something in their own head) Nothing. Nothing.",2,"s",{vol:-1,emo:1}],
  ["Repeats own joke for more laughs","Says the good line again, slightly louder, to anyone who missed it.","I said, 'That's why they call it a dogged pursuit!' — DOGGED.",3,"c",{ego:1,vol:1}],
  ["Laughs instead of finishing","Gives up on the joke halfway and just laughs, which works better.","So the man says — no — I can't — (gone)",3,"u",{emo:1,pos:1}],
  ["Nervous laugh after every line","A small uncertain laugh after each remark, checking it landed.","It's a bit cold in here, ha. — It's fine. — Ha. Good.",2,"c",{ego:-1,mood:-1}],
]);
block(HUM, "Doesn't Get Jokes", 185500, [
  ["Asks for the joke to be explained","Politely requests an explanation of every joke and listens carefully.","I see. And the rabbit was wearing the hat because —?",3,"c",{hon:1,cur:1}],
  ["Laughs to be safe, a beat late","Joins the laugh without understanding, and the lateness gives it away.","(a courteous 'ha' long after the room moves on)",2,"c",{agr:1,hon:-1,intel:-1}],
  ["Takes jokes as factual claims","Responds to comedy with fact-checking.","A horse didn't walk into a bar. Horses can't fit through most doors.",3,"u",{emo:-1,intel:1}],
  ["Gets it hours later, delighted","Suddenly laughs out loud, alone, much later, at the joke from lunch.","(at four o'clock, from the next room:) OH. The DUCK.",3,"s",{emo:1,warm:1}],
  ["Takes offence at a harmless joke","Reads insult into teasing and is wounded.","Why would you say that? I don't have a big head. — It was a hat joke. — I heard it.",3,"d",{emo:1,ego:-1,intel:-1}],
  ["Serious by preference, not incapacity","Understands the joke perfectly and simply doesn't find it worth laughing at.","Yes. I understand the joke. It's a joke. Shall we continue?",4,"s",{emo:-1,warm:-1}],
]);

/* =====================================================================
   MANNERISMS — polarised gaze, proxemics, touch and posture, added to the
   EXISTING categories (so the Mannerisms draw is not diluted; it just gains
   traits the sliders can actually select between).
   ===================================================================== */
const MAN = "Mannerisms";
block(MAN, "Eye & Facial Expressions", 185600, [
  ["Holds eye contact like a handshake","Steady, warm, unbroken gaze that makes people feel chosen.","(looks at you as if you were the only person who arrived)",3,"c",{asrt:1,warm:1}],
  ["Looks away to be honest","Breaks eye contact exactly when saying the true thing.","(eyes on the floor) I was scared. That's why.",2,"s",{hon:1,emo:1}],
  ["Stare that doesn't blink","A flat, unblinking gaze that makes the other person talk.","(no blink. No expression. Silence stretches. The other person confesses.)",5,"d",{warm:-1,asrt:1}],
  ["Eyes to the exit mid-sentence","Keeps glancing toward the door while talking.","(the eyes flick to the door on every third word)",2,"c",{warm:-1,mood:-1}],
  ["Smiles with the eyes first","The warmth arrives in the eyes a moment before the mouth.","(eyes crinkle; the smile follows, slowly)",1,"u",{pos:1,warm:1}],
  ["Mouth smiles, eyes don't","A polite smile that never reaches the eyes, and some people can tell.","(the smile is perfect; the eyes are counting)",3,"c",{hon:-1,warm:-1}],
  ["Gaze drops at praise","Looks down immediately when complimented.","(eyes down, a small shake of the head) It was nothing.",2,"c",{ego:-1}],
  ["Face gives nothing away","A perfectly neutral expression in every circumstance.","(receives the news of the promotion and the redundancy with the same face)",4,"c",{emo:-1,warm:-1}],
  ["Face narrates every thought","Every passing feeling crosses the face in real time.","(delight, doubt, suspicion, delight again — in two seconds)",4,"u",{emo:1,hon:1}],
  ["Rolls the eyes, openly","A full, theatrical eye-roll at anything tiresome.","(eyes all the way up, a long exhale)",4,"c",{agr:-1,man:-1,warm:-1}],
  ["Winks to include","A small conspiratorial wink that draws someone into the joke.","(a wink across the room; you're in on it now)",2,"d",{rebel:1,warm:1}],
  ["Squints at ideas","Narrows the eyes when thinking something over.","(eyes narrowed) Hm. Say that again.",2,"c",{agr:-1,intel:1}],
  ["Wide-eyed interest","Eyes widen at anything interesting, like a child.","(eyes go huge) No. Tell me everything.",3,"c",{cur:1,warm:1}],
]);
block(MAN, "Social & Boundary Mannerisms", 185700, [
  ["Keeps a table between them","Always positions an object — a desk, a counter — between themselves and others.","(moves round the kitchen island to keep it in the middle)",2,"u",{warm:-1,emo:-1}],
  ["Handshake, never a hug","Offers a firm handshake even to family.","(hand out to her own brother at Christmas)",3,"d",{warm:-1}],
  ["Steps back when someone steps in","Maintains exact personal space by retreating.","(a step back for every step forward, all the way across the room)",2,"c",{warm:-1}],
  ["Hand on the back, steering","Guides people through doors and rooms with a hand at the shoulder blade.","(hand on your back, steering you toward the right table)",3,"u",{asrt:1,warm:1}],
  ["Leans in to share","Drops voice and closes distance for anything confidential.","(leans in, close) Between us —",2,"c",{warm:1,hon:-1}],
  ["Takes up the whole bench","Spreads out in shared space without apology.","(arm along the back of the bench, bag on the seat, legs wide)",4,"c",{ego:1,man:-1,warm:-1}],
  ["Makes themselves small in crowds","Folds in, arms close, taking the minimum room.","(knees together, bag on lap, elbows in)",2,"c",{ego:-1,asrt:-1}],
  ["Fixes others' collars","Straightens people's clothes and hair without asking.","Hold still. (tugs your collar straight) There.",3,"d",{warm:1,disc:1}],
  ["Pats as punctuation","Pats backs, shoulders, knees to close a conversation.","(two pats on the shoulder) Good. Good man.",2,"u",{warm:1,asrt:1}],
  ["Recoils from casual touch, visibly","A small flinch at unexpected contact, not hidden.","(shoulders rise; a half-step back) Sorry — no, it's fine.",3,"d",{warm:-1,emo:1}],
  ["Sits on the floor near people","Prefers to sit low and close — floor, steps, arm of a chair.","(ignores the sofa; sits on the rug, leaning on your knees)",2,"s",{warm:1,form:-1}],
]);
block(MAN, "Postural & Spatial Dynamics", 185800, [
  ["Stands like they own the room","Feet planted wide, chin up, occupying the centre.","(stops in the middle of the room and lets it arrange itself around them)",4,"c",{ego:1,asrt:1}],
  ["Shrinks into the chair","Posture collapses under attention.","(sinks lower with every question)",3,"c",{ego:-1,asrt:-1}],
  ["Ramrod straight at all times","A drilled, upright posture that never softens.","(sits bolt upright on a beanbag)",3,"u",{form:1,disc:1}],
  ["Sprawls","Drapes across furniture, limbs everywhere, entirely comfortable.","(one leg over the arm of the chair, head back, talking to the ceiling)",3,"c",{form:-1,disc:-1}],
  ["Leans forward to listen","Elbows on knees, whole body turned toward the speaker.","(leans in, elbows on knees) Go on.",2,"c",{warm:1,cur:1}],
  ["Turns the whole body to face you","Doesn't just turn the head; rotates fully toward whoever speaks.","(swivels the chair round completely) Yes?",2,"u",{warm:1,asrt:1}],
  ["Stands when others enter","Rises for anyone arriving, reflexively.","(on their feet the moment the door opens)",2,"s",{man:1}],
  ["Never sits down","Stays standing at gatherings, ready to go.","(still standing, coat on, two hours in)",3,"u",{act:1,warm:-1}],
  ["Mirrors the posture of whoever they like","Unconsciously matches the body of the favoured person.","(when he crosses his legs, she crosses hers)",1,"d",{warm:1,agr:1}],
  ["Slouches to seem casual","A deliberate, practised slouch that says 'not bothered'.","(slumped with studied indifference, watching everything)",3,"d",{hon:-1,rebel:1}],
  ["Looms when angry","Rises to full height and leans over the table in conflict.","(stands, leans, palms flat on the desk)",5,"u",{asrt:1,agr:-1,warm:-1}],
  ["Kneels to talk to children","Gets down to eye level with anyone smaller.","(crouched on the pavement, talking to a four-year-old like a colleague)",2,"s",{warm:1,man:1}],
]);
block(MAN, "Gestural & Kinetic Integration", 185900, [
  ["Jabs a finger","Punctuates every point with an index finger toward the listener.","(jab) You. (jab) Did. (jab) This.",4,"c",{asrt:1,agr:-1,warm:-1}],
  ["Hands still while talking","Speaks with hands folded or pocketed, motionless.","(hands clasped behind the back throughout)",2,"c",{emo:-1,disc:1}],
  ["Talks with both hands at full stretch","Gestures wide and constantly; objects nearby are at risk.","(a sweep of the arm, a wine glass lost) — and it was THIS big!",4,"c",{emo:1,vol:1}],
]);

/* =====================================================================
   CONTRADICTION FUNCTIONS — grown toward ~100
   ===================================================================== */
const CF = "Contradiction Functions";
const CFX = {frequency:3, visibility:2, persistence:4, narrativeSalience:5};
block(CF, "Protective Hypocrisy", 186000, [
  ["Lectures on risk, drives too fast","Relentless about everyone else's safety and reckless with their own.","Seatbelt. SEATBELT. (overtaking on a blind bend)",3,"c",{warm:1,disc:-1},{behaviorFunction:"protect"}],
  ["Mocks therapy, sends the kids","Scornful of 'all that talking' for themselves; has the children's counsellor on speed dial.","Therapy's for Americans. — Didn't you book Ellie in for Thursdays? — That's different.",3,"u",{warm:1,emo:-1},{behaviorFunction:"protect"}],
  ["Against violence, except for them","A pacifist in principle who has already decided what they'd do to anyone who touched their family.","I don't believe in hitting. (a pause) I'd make an exception.",4,"d",{warm:1,agr:-1},{behaviorFunction:"protect"}],
  ["Anti-authority, pro-rules at home","Defies every institution, runs the household like a barracks.","Rules are there to be broken. Bed by eight. No exceptions.",3,"c",{rebel:1,disc:1},{behaviorFunction:"control"}],
  ["Condemns lying, lies about the diagnosis","Holds honesty sacred and hides their own illness from everyone.","I can't stand liars. — Dad, the letter from the hospital — — Recycling.",4,"s",{hon:1,warm:1},{behaviorFunction:"protect"}],
  ["Scorns gossip, keeps a file","Refuses to talk about people and knows everything about the one who hurt their friend.","I don't gossip. But I know where he parks.",4,"d",{hon:-1,warm:1},{behaviorFunction:"protect"}],
], CFX);
block(CF, "Aspirational Values", 186100, [
  ["Preaches patience, can't wait for the kettle","Speaks beautifully about calm and fails at it hourly.","Everything in its own time. (opens the oven for the fourth time)",2,"c",{pos:1,disc:-1},{behaviorFunction:"aspire"}],
  ["Believes in forgiveness, keeps a list","Genuinely wants to be a forgiving person and remembers every slight.","I forgive him. I do. It was the fourteenth of March, 2011, and I forgive him.",3,"u",{warm:1,emo:1},{behaviorFunction:"aspire"}],
  ["Minimalist in theory","Talks about owning less while buying the book about owning less, in hardback.","It's about intention. (fourth copy of the decluttering book)",2,"c",{hon:-1,pos:1},{behaviorFunction:"aspire"}],
  ["Values listening, talks through it","Deeply believes in listening and interrupts to say so.","The thing is, people just don't listen — sorry, you were saying — anyway, listening —",3,"c",{vol:1,warm:1},{behaviorFunction:"aspire"}],
  ["Anti-materialist with a good watch","Speaks sincerely against consumerism; the watch was a gift, it has a story.","It's not about things. (checks the heirloom watch) This is different.",2,"s",{hon:-1},{behaviorFunction:"aspire"}],
  ["Wants to be brave, is brave at the wrong things","Trains for courage and finds it only for unimportant risks.","I skydived. I cannot ring my sister. Those are both true.",3,"d",{ego:-1,act:1},{behaviorFunction:"aspire"}],
  ["Believes in rest, never takes it","Evangelises rest days and has not had one in four years.","Rest is productive. Everyone should rest. (emailing at 2 a.m.)",3,"c",{pos:1,disc:1},{behaviorFunction:"aspire"}],
], CFX);
block(CF, "Exceptions & Detachment", 186200, [
  ["Hates children, loves one","Openly dislikes kids in general and is devoted to a single niece.","Children are sticky. (on the floor, braiding her niece's hair) Not you. You're fine.",2,"u",{warm:-1,emo:1},{behaviorFunction:"connect"}],
  ["Misanthrope with a dog","Cannot stand people, speaks to the dog with enormous tenderness.","Humanity's finished. — (to the dog) Who's a good lad? You are.",2,"c",{warm:-1,emo:1},{behaviorFunction:"soothe"}],
  ["Tough on everyone but the new hire","Brutal with staff, patient to the point of softness with the youngest.","Do it again. (to the trainee) No, that's fine, love. Take your time.",3,"d",{agr:-1,warm:1},{behaviorFunction:"protect",conditions:["work"]}],
  ["Unemotional, except at films","Dry-eyed at funerals, sobbing at animated films.","(stone-faced at the grave; destroyed by a cartoon robot)",2,"s",{emo:-1},{behaviorFunction:"soothe"}],
  ["Trusts nobody, trusts strangers","Suspicious of everyone they know; tells their life story to people on trains.","I don't tell my friends anything. — (to a stranger on the 7:14) — so then my wife left.",3,"u",{hon:1,warm:-1,intel:-1},{behaviorFunction:"connect"}],
  ["Detached at work, destroyed at home","Perfectly composed in the professional role, falls apart the moment the door shuts.","(the calm voice on the helpline; the kitchen floor at midnight)",4,"d",{emo:-1,mood:-1},{behaviorFunction:"protect",conditions:["work","home"]}],
  ["Never apologises, except to one person","Refuses apology on principle with a single standing exception.","I don't do sorry. — (to his daughter) I'm sorry. I was wrong.",3,"s",{ego:1,warm:1},{behaviorFunction:"repair"}],
], CFX);
block(CF, "Strategic Politeness", 186300, [
  ["Courteous to the enemy","Most polite precisely to the person they despise, as a form of attack.","Lovely to see you, Gerald. You look very well. Considering.",4,"c",{man:1,warm:-1},{behaviorFunction:"control"}],
  ["Rude to friends, polite to strangers","Saves the good manners for people they don't care about.","Get your own drink. — (to the waiter) Thank you so much, you're very kind.",3,"u",{man:1,warm:1},{behaviorFunction:"connect"}],
  ["'With respect' means without","Opens every disagreement with a courtesy that signals war.","With the greatest respect — and I mean that — you're completely wrong.",3,"c",{man:1,agr:-1},{behaviorFunction:"perform"}],
  ["Thanks you for the criticism, never forgives it","Accepts criticism graciously in public and stores it forever.","Thank you. That's really helpful. (it will be remembered at the next review)",4,"d",{hon:-1,man:1,warm:-1},{behaviorFunction:"control"}],
  ["Polite as a wall","Uses perfect manners to end conversations they don't want.","That's very kind. Thank you. Goodbye now.",3,"c",{man:1,emo:-1,warm:-1},{behaviorFunction:"avoid"}],
  ["Flatters the powerful, sneers after","Charming to the boss's face, cutting in the car park.","What a vision. — (later) What a clown.",4,"u",{hon:-1,man:1,warm:-1},{behaviorFunction:"perform"}],
  ["Says please as a threat","Uses 'please' with a precision that makes it an order.","Please. Sit. Down.",4,"s",{asrt:1,man:1,warm:-1},{behaviorFunction:"control"}],
  ["Honest in private, diplomatic in public","Tells the truth to your face alone and defends you in a group.","That dress is a mistake. — (ten minutes later, to the room) Doesn't she look wonderful?",2,"d",{hon:1,warm:1},{behaviorFunction:"protect"}],
], CFX);
block(CF, "Concealment", 186400, [
  ["Cheerful because the news is bad","The brighter the mood, the worse the thing they aren't saying.","Right! Who wants pancakes! (the letter is in her pocket)",4,"c",{pos:1,hon:-1},{behaviorFunction:"protect"}],
  ["Talks a lot to say nothing","Floods the conversation so the one topic never comes up.","— and the traffic, and the weather, and did I tell you about the neighbour's fence —",3,"c",{vol:1,hon:-1},{behaviorFunction:"avoid"}],
  ["Confident about everything except the one thing","Assured on every subject; changes the subject at the only one that matters.","Absolutely, I'll handle it. — And your dad? — Anyway, the invoices.",3,"u",{ego:1,emo:-1},{behaviorFunction:"avoid"}],
  ["Generosity to hide need","Gives constantly so nobody notices they're struggling.","I've brought you lasagne. And for the kids. And a bit extra. — Are you okay? — I brought lasagne.",3,"d",{warm:1,hon:-1},{behaviorFunction:"protect"}],
  ["Anger as a cover for fear","Loud and furious when frightened, so nobody sees frightened.","It's a DISGRACE, that's what it is! (hands shaking)",4,"c",{asrt:1,emo:-1},{behaviorFunction:"protect"}],
  ["Busy as a hiding place","Fills every hour so there's never time to feel it.","Can't stop. Can't stop. Next week. (it's been a year)",3,"c",{act:1,emo:-1},{behaviorFunction:"avoid"}],
  ["Jokes to hide the truth in plain sight","Says the real thing as a joke so nobody believes it.","Oh, I'm dying inside, ha ha! Anyway, drinks?",3,"u",{warm:1,hon:-1},{behaviorFunction:"avoid"}],
  ["Calm voice, white knuckles","Speaks evenly while the body betrays the effort.","I'm fine. (the glass is cracking in his grip)",2,"s",{emo:-1,disc:1},{behaviorFunction:"protect"}],
], CFX);

  return out;
})();

TRAITS.push(...TRAITS_GAPS);

TRAIT_PACKS.push({id:"gaps", label:"Gap sections (2026 audit §6 trait-bank gaps)", version:"1", ids:[180000, 189999],
  applicability:{era:"any", realism:"any", tone:"any"}, blurb:"Romance, dialect, beliefs, jargon, conversation mechanics, body, money, fears, family, humour subtypes, polarised nonverbal, contradiction functions."});

/* Cross-links INTO the gap sections, merged into WEIGHT_MATRIX by engine.js right after
   it is defined. Every non-drawAll profile category needs at least one inbound link or
   it can only ever arrive by an unguided roll (tests/run.js checks this). Keys are
   PROFILE_SECTIONS ids; tiers are S/M/W = TIER_STRONG/MODERATE/WEAK. Kept deliberately
   light — these sections are opt-in, and the sliders should nudge the TYPE, not pick it. */
const GAP_WEIGHT_LINKS = {
  friendliness:      {pos:{family:{"Talks About Family Constantly":"M"}, humor:{"Teasing as Affection":"M"}, romance:{"Courtship Speech":"W"}},
                      neg:{family:{"Never Mentions Family":"M"}, conversation:{"Sensory Load":"W"}, fears:{"Bodily Aversions":"W"}}},
  honesty:           {pos:{conversation:{"Literal Uptake":"M"}, beliefs:{"Lapsed Faith":"W"}},
                      neg:{contradiction:{"Concealment":"M","Strategic Politeness":"W"}, money:{"Money Taboo":"W"}}},
  assertiveness:     {pos:{beliefs:{"Political Temperament":"M"}, jargon:{"Military":"W"}, romance:{"Flirting Style":"W"}},
                      neg:{conversation:{"Turn-Timing":"M"}, fears:{"Social Dreads":"M"}}},
  confidence:        {pos:{money:{"Status Signalling":"M"}, humor:{"Laughs at Own Jokes":"M"}},
                      neg:{conversation:{"Masking":"M"}, money:{"Class-Mobility Tells":"W"}, body:{"Stammer & Speech Blocks":"W"}, fears:{"Social Dreads":"W"}}},
  agreeableness:     {pos:{jargon:{"Service":"W"}},
                      neg:{family:{"Sibling Rivalry":"M"}, romance:{"Jealousy Tells":"W"}, jargon:{"Legal":"W"}}},
  manners:           {pos:{contradiction:{"Strategic Politeness":"S"}, dialect:{"Class Register Shift":"M"}},
                      neg:{humor:{"Physical & Slapstick":"W"}}},
  discipline:        {pos:{beliefs:{"Faith Practice":"M","Secular Rituals":"M"}, money:{"Thrift Talk":"M"}, conversation:{"Scripted Speech":"W"}},
                      neg:{humor:{"Callback & Running Bit":"W"}, fears:{"Phobias":"W"}}},
  rebelliousness:    {pos:{beliefs:{"Conspiracy-Adjacent":"M","Lapsed Faith":"W"}, dialect:{"Code-Switching":"W","Youth Register":"W"}},
                      neg:{family:{"Parent-Voice Echo":"M"}, beliefs:{"Faith Practice":"W"}}},
  emotionalcapacity: {pos:{romance:{"Pining Tells":"M","Courtship Speech":"M"}, dialect:{"Heritage Vocabulary":"W"}},
                      neg:{humor:{"Gallows":"M"}, contradiction:{"Concealment":"W"}, body:{"Medication & Management":"W"}}},
  intelligence:      {pos:{humor:{"Observational":"M"}, jargon:{"Academic":"M","Medical":"W"}, conversation:{"Info-Dumping":"M"}},
                      neg:{humor:{"Doesn't Get Jokes":"W"}, beliefs:{"Superstition":"M"}, jargon:{"Kitchen & Trade":"W"}}},
  positivity:        {pos:{humor:{"Pun-Groaner":"M"}, romance:{"Flirting Style":"W"}},
                      neg:{beliefs:{"Conspiracy-Adjacent":"W"}, fears:{"Phobias":"M"}, humor:{"Gallows":"W"}}},
  activeness:        {pos:{humor:{"Physical & Slapstick":"S"}, jargon:{"Kitchen & Trade":"W"}},
                      neg:{body:{"Breath & Stamina":"M","Pain & Fatigue":"W","Hearing & Sight":"W"}}},
  curiosity:         {pos:{dialect:{"Second-Language Speaker":"W"}, jargon:{"Tech":"W"}, conversation:{"Info-Dumping":"W"}},
                      neg:{dialect:{"Dated Slang":"M","Era References":"M","Regional Features":"W","Tech Vintage":"W"}}},
};
/* Section-to-section links (WEIGHT_MATRIX['<sectionId>:<Category>'] form): at neutral
   sliders only an earlier section's resolved type steers a later one, so the new humour
   subtypes need a few of these or the old, well-linked types crowd them out. */
const GAP_SECTION_LINKS = {
  "role:Connector":                 {humor:{"Teasing as Affection":"W","Callback & Running Bit":"W"}},
  "role:Instigator":                {humor:{"Physical & Slapstick":"W","Pun-Groaner":"W","Laughs at Own Jokes":"W"}},
  "role:Outsider":                  {humor:{"Observational":"M"}},
  "role:Skeptic":                   {humor:{"Observational":"W","Doesn't Get Jokes":"W"}},
  "role:Leader":                    {humor:{"Laughs at Own Jokes":"W"}},
  "role:Caretaker":                 {humor:{"Teasing as Affection":"W"}},
  "role:Peacemaker":                {humor:{"Pun-Groaner":"W"}},
  "stress:Freeze (shut down)":      {humor:{"Gallows":"W"}},
  "stress:Fight (attack the threat)": {humor:{"Gallows":"W"}},
  "values:Rigid & Principled":      {humor:{"Doesn't Get Jokes":"W"}},
  "attachment:Secure":              {humor:{"Callback & Running Bit":"W"}},
  "attachment:Avoidant":            {humor:{"Gallows":"W"}},
  "attachment:Anxious":             {humor:{"Laughs at Own Jokes":"W"}},
};
