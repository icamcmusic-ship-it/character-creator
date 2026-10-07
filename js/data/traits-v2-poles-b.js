/* v2 content: thin poles B. IDS 241000-241999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_POLES_B = (function(){
  const out = [];

  /* Low positivity at loud intensity. */
  V2.block(out, "Personality Traits", "Positivity — Pessimistic & Cynical", 241000, [
    ["Cancels the picnic in advance", "Hears a forecast of sunshine and starts packing waterproofs and a list of reasons to stay in.", "Sunny, they say. They said sunny for the Hendersons' wedding and look how that went. Bring coats.", 4, "c", {pos:-1}],
    ["Meets good news with a casualty list", "Answers a promotion or a win by naming who else it will cost and what it will break.", "You got the contract. Lovely. That's forty people on a rota with no slack left in it.", 4, "u", {pos:-1}],
    ["Calls hope a payment plan", "Describes optimism as borrowing against a future that will come to collect, with interest.", "Go on, hope. Put it on the card. It all gets repaid and the rate's terrible.", 4, "d", {pos:-1}],
    ["Slams the door on 'what if it works'", "Refuses even to entertain the premise when a suggestion begins with those words.", "It won't. Don't finish the sentence. It won't, and I'm not spending Sunday proving it.", 5, "c", {pos:-1, asrt:1}],
    ["Treats every kindness as an invoice", "Sees an offered favour as a debt being set up and hunts for the line where it will appear.", "Free lift? Nothing's free. Wait till the Christmas card, then see what they want.", 4, "u", {pos:-1, warm:-1}],
    ["Quotes the worst statistic at the toast", "Produces the failure rate or the one-in-three figure at the exact moment glasses are raised.", "Lovely couple. Mind, half of these are over by year ten. Cheers!", 4, "c", {pos:-1}],
    ["Announces a birth in a funeral voice", "Delivers happy news in the lowered, measured tone of someone reading out a roll of the lost.", "(soft, grave) The baby's here. Seven pounds. Early days, of course. A great many things can happen.", 5, "d", {pos:-1}],
    ["Braces harder with each good week", "Counts a run of good luck as interest building up and tightens with every extra day of it.", "Fourth week without a single problem. That's four weeks of it piling up somewhere.", 4, "s", {pos:-1, mood:-1}],
    ["Hears 'it'll be fine' as a threat", "Reacts to reassurance with open alarm, since in their experience the phrase comes just before the disaster.", "Don't say 'fine'. The last time anybody said fine we lost the roof.", 4, "u", {pos:-1, mood:-1}],
    ["Writes the realistic line in the card", "Declines the usual hopeful sentiment in a get-well or leaving card and puts down a blunt one instead.", "Everyone's put 'hope it goes well'. I've put 'Good luck, you'll need it'. It's the honest one.", 2, "u", {pos:-1, hon:1}],
    ["Gives the neighbourhood's obituary on every walk", "Turns a stroll into a tour of what has shut, been sold and gone downhill since they were young.", "That was a bakery. That was a decent pub. Now it's vapes and a phone shop. Five years, it'll be nothing.", 4, "c", {pos:-1}],
    ["Forecasts doom unasked, mid-party", "Volunteers a grim prediction at the very moment a group begins to enjoy itself.", "Everyone's very happy. Shall I say what happens next, or will we let you find out?", 5, "d", {pos:-1, asrt:1}],
    ["Bristles at other people's cheer", "Grows openly irritated by good spirits nearby, as though sunniness were an imposition on them.", "Could you not hum? There's nothing in this to hum about.", 5, "s", {pos:-1, warm:-1}],
    ["Won't count down to midnight", "Skips the New Year countdown on the grounds that the date changes and nothing else does.", "Midnight. Big deal. The boiler's still broken. I'm going to bed.", 4, "u", {pos:-1}],
    ["Swaps 'when' for 'if' every time", "Pointedly corrects 'when we get there' to 'if', and does it again on the next mention.", "'When we get there.' If. If we get there. Have you seen the roads?", 3, "d", {pos:-1}],
    ["Hands out the family-row forecast at the door", "Predicts who will fall out with whom before the starters have been served.", "Gran raises the will by pudding. I've a fiver on Dave walking out before coffee.", 4, "u", {pos:-1}],
    ["Answers 'how's it going' with an inventory", "Replies to a casual greeting with a list of breakages, bills and bad omens.", "How's it going? Car's making a noise, tax code's wrong, dentist wants a word. So. Grand.", 4, "c", {pos:-1}],
    ["Reads the motivational poster aloud, flatly", "Delivers an inspirational slogan in a dead voice and adds the realistic ending.", "'Every day is a new beginning.' Which is the problem. Every day I have to do this again.", 4, "c", {pos:-1}],
    ["Nods slowly at bad news as if signing for it", "Receives a disaster with the grim, settled nod of someone accepting a long-expected delivery.", "(slow nod) There. Right on schedule. Put it with the others.", 4, "s", {pos:-1}],
    ["Won't plant anything that flowers next year", "Declines bulbs, long warranties and advance bookings on the grounds that nobody should bet on next year.", "Bulbs? For next spring? I'll not be that optimistic, thanks.", 4, "d", {pos:-1}],
    ["Scores every plan out of ten, starting at four", "Rates a hopeful scenario with a mean little number and defends the figure when pressed.", "I'd say four out of ten. Five if the weather holds, and it won't.", 3, "d", {pos:-1, intel:1}],
    ["Condoles in advance", "Offers sympathy to the people a bad outcome will hit, well before there is one.", "Sorry in advance about the exam result. I'm sure you'll feel terrible.", 4, "u", {pos:-1}],
    ["Doesn't believe in help until it parks", "Treats a promised rescue as a rumour until it is physically in the room.", "They said an hour. They said that at noon. I'll believe a van when I see one.", 4, "c", {pos:-1}],
    ["Smells the clawback in every discount", "Reads a raise, bonus or half-price offer as a trick that will be taken back later.", "Ten percent off? Off what, after they put it up twenty? Think about it.", 4, "u", {pos:-1, intel:1}],
    ["Predicts failure, then turns up with the drill", "Declares the whole effort doomed and then arrives early and works harder than anyone.", "No point, it'll flop. I've brought the drill, and the spare drill.", 5, "d", {pos:-1, disc:1}],
    ["Calls the optimist's bluff, mid-speech", "Interrupts a cheerful speaker with a plain question about what will go wrong.", "Lovely speech. Which bit of it do you actually expect to happen?", 4, "c", {pos:-1, asrt:1}],
    ["Clocks the chained fire door at the party", "Finds the exits, the blocked stairwell and the distance to the road, and says so aloud.", "Fire door's chained. Look at that. If anything kicked off, we'd all be toast.", 4, "d", {pos:-1}],
    ["Answers 'pretty good, considering'", "Tacks a mournful 'considering' onto every answer, hinting at a long list of reasons it could be worse.", "How's the knee? — Pretty good. Considering.", 2, "c", {pos:-1}],
    ["Reviews the restaurant before the starter", "Pronounces a poor verdict on a meal, trip or film before it begins and collects only the evidence that fits.", "Menu's too long. Always a bad sign. Watch, the soup'll be tepid.", 3, "u", {pos:-1}],
    ["Raises a glass 'to getting through it'", "Proposes a toast to survival where others would toast success.", "(glass up) To getting through it. Whatever it is. Cheers.", 3, "d", {pos:-1}],
    ["Swaps 'good luck' for 'brace yourself'", "Replaces any wish of luck with a warning about what is coming.", "Good luck? No. Brace yourself. That's the better advice.", 3, "u", {pos:-1}],
    ["Tacks on 'in theory'", "Hangs 'in theory' on any promise of something good, with a slight lift of the brows.", "It should arrive Friday. In theory.", 1, "c", {pos:-1}],
  ]);

  /* Casual register at loud intensity: Register & Formality Spectrum. */
  V2.block(out, "Vocabulary Traits", "Register & Formality Spectrum", 241100, [
    ["Pins 'proper' to everything", "Fastens 'proper' on any quality to be stressed, from proper tired to proper lovely to proper dodgy.", "That was a proper good night. Proper mad. Proper sore this morning.", 4, "c", {form:-1}],
    ["Narrates in 'goes' and 'was like'", "Reports a conversation as a string of 'so they go' and 'I'm like', with the sound effects.", "So Dan goes, 'no way', and I'm like, 'way', and Dan goes absolutely mental.", 4, "c", {form:-1, vol:1}],
    ["Hands out 'legend' and 'weapon' as thank-yous", "Meets any favour with a burst of slang praise in place of ordinary thanks.", "Cheers, absolute weapon. Honestly, you're a legend.", 4, "c", {form:-1, warm:1}],
    ["Closes with 'sorted', and only that", "Closes a request, a deal or a crisis with the single word and a look that expects agreement.", "Sorted. Don't stress. It's sorted.", 4, "u", {form:-1, asrt:1}],
    ["One pet word does everything", "Runs a single slang word through a conversation as praise, insult, filler and verdict.", "It's grim, the film's grim, her mum's grim. That chippy? Grim. In a good way.", 5, "d", {form:-1}],
    ["Spends 'cheers' on hello, sorry, thanks and goodbye", "Spends one word on every social job, adjusting only the tone.", "Cheers. (steps on a foot) Cheers. (takes a coat) Cheers. (leaves) Cheers.", 3, "c", {form:-1}],
    ["Market-stall patter in a living room", "Treats every sentence as a pitch to the back of a crowd, complete with a discount and a bonus.", "Tell you what, I'll do you two for a fiver and I'll throw the other one in.", 4, "d", {form:-1, vol:1}],
    ["Chops long words to a stub and a vowel", "Shortens every long word to its first syllable plus an ending, so a whole sentence goes by in stumps.", "Round the rellies for a bevvy, then the servo for snacks.", 4, "u", {form:-1}],
    ["Answers a stiff question with a shrug in words", "Meets a formal, official question with the loosest possible reply, on purpose or from habit.", "Please state your intentions. — Dunno, really. See what's on.", 4, "u", {form:-1, rebel:1}],
    ["Gives the weekend in shorthand", "Recounts a night out as a fast list of fragments for people who weren't there.", "Properly mullered, kebab, lost my keys, some lad's sofa. Mint.", 3, "c", {form:-1}],
    ["Gives work things pub names", "Calls the quarterly review 'the grilling' and the spreadsheet 'the beast' in meetings that expect proper terms.", "Right, the beast's open, and I've got twenty minutes before the grilling.", 3, "u", {form:-1}],
    ["One relaxed voice for toddlers, dogs and directors", "Uses the same teasing, breezy register whoever is listening, whatever the rank.", "Right, who's a good lad? You are. Not you, Gerald, you're on thin ice.", 4, "s", {form:-1, ego:1}],
    ["Offers 'ta' for thanks, nothing longer", "Keeps gratitude to one flicked syllable, however large the favour.", "(handed a coat, a lift home and a loan) Ta.", 1, "c", {form:-1}],
  ]);

  /* Directness: blunt casual register. */
  V2.block(out, "Vocabulary Traits", "Directness & Literalness", 241200, [
    ["Calls it crap where others say 'needs work'", "Uses the plainest rude word for a flawed draft, meal or plan, and moves straight on.", "Is it good? — It's crap. Next.", 4, "c", {form:-1, man:-1, hon:1}],
    ["Asks in bare imperatives", "Requests things with no 'please' and no cushion, among friends and bosses alike.", "Pass the salt. Shut that. Ring him.", 4, "u", {form:-1, man:-1}],
    ["Says 'you what?' to every misunderstanding", "Answers an unclear remark with a clipped 'you what?' rather than a polite request to repeat it.", "You what? Say that again. Slower.", 3, "c", {form:-1}],
    ["Orders by pointing and renaming", "Reads a long menu as a set of rough nicknames rather than the proper dishes.", "Chips, the thick ones, and the gravy stuff. And whatever the pie is.", 2, "d", {form:-1}],
  ]);

  /* Swearing and slang as emotional punctuation. */
  V2.block(out, "Vocabulary Traits", "Affective & Emotional Intensity", 241300, [
    ["Swears at objects with full emotional range", "Runs a whole drama of pleading, threat and triumph, in coarse words, at a stuck jar or a slow lift.", "Come on, you useless lump — don't you dare — oh, you beauty.", 4, "c", {form:-1, emo:1}],
    ["Greets old friends with a cheerful insult", "Spends affection in rude words, delivered with a grin and open arms.", "Alright, you old sod! Where've you been, you beautiful bastard?", 4, "u", {form:-1, warm:1}],
    ["Swears when delighted", "Spends the profanity others keep for anger on joy and awe.", "Oh, you absolute beauty! Bloody hell, that's gorgeous!", 4, "d", {form:-1, emo:1, pos:1}],
    ["Gives the rain a mouthful", "Addresses bad weather directly, in coarse terms, as if it could be shamed.", "Piss off, drizzle. Not today. I've just hung the washing out.", 4, "c", {form:-1, man:-1}],
  ]);

  /* Spoken compression: slangy, clipped, run-together speech. */
  V2.block(out, "Dialogue Grammar Traits", "Spoken Compression", 241400, [
    ["Runs question openers into one sound", "Fuses 'did you', 'have you got' and 'do you want' into a single quick syllable.", "Jeet yet? Avyagotit? Wanna go?", 4, "c", {form:-1, pace:1}],
    ["Swallows the aitches and the middle t's", "Drops word-initial h and the t inside words, so 'what have you got' comes out in three clipped pieces.", "Wha' 'ave yer got in 'ere, then? Bu'er? Wa'er?", 4, "c", {form:-1}],
    ["Gets through a conversation on 'mm', 'nah' and 'eh'", "Strings grunted syllables into whole exchanges, and the other person fills in the rest.", "Coming? — Mm. — Tonight? — Nah. — Tomorrow? — Eh.", 4, "c", {form:-1, vol:-1}],
    ["Lets the last word dissolve", "Trails every sentence into 'or…' or 'if you…' without its final word, leaving the gap for the listener.", "You could always just — or, like, if you wanted — I dunno, so—", 2, "u", {form:-1, asrt:-1}],
    ["Leaves in one clipped syllable", "Ends a conversation with 'right', 'ta' or 'laters' and is already moving.", "Right. Ta. Laters.", 3, "u", {form:-1, pace:1}],
    ["Fuses whole phrases into one noise", "Mashes whole short sentences into a single mumbled word, so only the tune carries the meaning.", "Sno use. Snot fair. Sgonna rain. Swhatever.", 5, "s", {form:-1, pace:1}],
  ]);

  /* Anchors and fillers: casual tags. */
  V2.block(out, "Dialogue Grammar Traits", "Anchors & Fillers", 241500, [
    ["Opens every point with 'to be fair'", "Prefaces each opinion with the same fairness flag, even when none is called for.", "To be fair, Dan's not that bad. To be fair, Dan's not that good either.", 3, "c", {form:-1}],
    ["Ends on 'you know what I mean'", "Tags the close of a thought with a request for confirmation, and repeats it as the thought lengthens.", "It were rough, like, you know what I mean? Rough. You know what I mean?", 4, "c", {form:-1, vol:1}],
    ["Hangs a 'yeah?' on every claim", "Tacks a short question onto each statement, daring the listener to agree.", "That's the plan, yeah? Fair? Sound? Yeah?", 4, "c", {form:-1, asrt:1}],
    ["Promises 'long story short' and tells it long", "Announces the short version, then gives every detail of the long one at full length.", "Long story short — so I'm at the depot, right, and it's raining — anyway, long story short—", 4, "c", {form:-1, vol:1}],
    ["Launches with 'no word of a lie'", "Starts the far-fetched part of a story with an oath of truth, and a second oath on top.", "No word of a lie, Dan was in the bath — I swear down — with a duck.", 4, "d", {form:-1, vol:1}],
    ["Says 'fair enough' to everything", "Uses 'fair enough', 'fair play' or 'fair do's' as a full reply to news, complaints and goodbyes alike.", "Bad news, then. — Fair enough. — They've shut it. — Fair play.", 3, "c", {form:-1, agr:1}],
  ]);

  /* Low mood: tense, brittle, on-edge speech in Guarded & Shallow. */
  V2.block(out, "Personality Traits", "Emotional Capacity — Guarded & Shallow", 241600, [
    ["Bites at 'are you all right?'", "Takes a gentle check-in as an intrusion and snaps before the sentence is finished.", "I said I'm fine. Why does everybody keep asking? Leave it.", 4, "c", {emo:-1, mood:-1}],
    ["Stops sympathy with a raised palm", "Cuts off a kind word mid-sentence with a flat 'don't' and a stiff hand.", "Don't. Whatever's next in that sentence, don't. Not today.", 4, "u", {emo:-1, mood:-1}],
    ["One thin, taut pitch for every subject", "Speaks at a single tight level whatever is said, as though anything louder or softer might crack.", "That's fine. Put it there. No, that's fine. Put it there.", 4, "d", {emo:-1, mood:-1}],
    ["Defends before they are accused", "Rattles off excuses in a rush to head off a criticism nobody has made.", "Before you say anything, the report's late because the system crashed, and I emailed you Tuesday.", 4, "c", {mood:-1, ego:-1}],
    ["Hears silence as an accusation", "Takes a pause in the conversation as a verdict and demands to hear it.", "Why aren't you saying anything? Go on. Say it. Say what you're thinking.", 4, "d", {mood:-1, emo:-1}],
    ["Answers a feelings question with a barb", "Meets a gentle personal question with a sharp joke at the asker's expense.", "Oh, are we doing therapy now? Shall I lie down? You do the voice.", 4, "c", {emo:-1, mood:-1, warm:-1}],
    ["Times the difficult conversation aloud", "Announces the minutes elapsed in a hard talk, as though the clock were the real problem.", "Right, that's ten minutes. I said ten.", 2, "u", {emo:-1, mood:-1}],
    ["Goes brittle-polite instead of angry", "Becomes meticulously courteous and thin-voiced, each 'thank you' clipped off at the edges.", "Thank you. So. Kind. Of you. I'll make a note of it.", 4, "d", {emo:-1, mood:-1}],
    ["Seals a subject with 'end of'", "Closes a topic with 'end of' or 'full stop' in a voice that leaves no gap to push through.", "I'm not discussing it. End of.", 5, "c", {mood:-1, asrt:1}],
    ["Takes offence at the tone, not the words", "Fixes on how something was said and demands an apology for the delivery.", "It's not what you said. It's how you said it. Say it again, nicely.", 4, "u", {mood:-1, agr:-1}],
    ["Asks 'what do you want me to say?'", "Meets any approach to closeness with a weary demand to be handed the script.", "What do you want me to say? Give me the line and I'll say it.", 3, "c", {emo:-1, mood:-1}],
    ["Opens each answer with a long exhale", "Starts every reply with an audible out-breath, as though the question were another weight.", "(sigh) What is it now.", 4, "c", {mood:-1}],
    ["Delivers an ultimatum mid-sentence", "Issues an on-the-spot limit when the talk gets close, then holds to it.", "One more question about my father and I'm out of this car.", 5, "d", {mood:-1, asrt:1}],
    ["Takes the tension out on whoever is nearest", "Snaps at a blameless bystander over something unrelated, then withdraws.", "Can you not breathe so loudly? ...Forget it. Forget I said anything.", 5, "c", {mood:-1, man:-1}],
    ["Proves they are calm, at length", "Spends three increasingly strained sentences demonstrating composure.", "I'm calm. This is calm. I'm speaking calmly. Look at me being calm.", 4, "d", {mood:-1, emo:-1}],
    ["Answers 'managing' in a strangled voice", "Answers a check-in with the word 'managing', squeezed out between tight breaths.", "Managing. (a breath) Yes. Managing.", 3, "u", {mood:-1, emo:-1}],
    ["Posts a warning at the start of a talk", "Opens a conversation by stating what will not be tolerated today.", "Fair warning: I've had a day. Whatever it is, make it short and make it kind.", 4, "u", {mood:-1, asrt:1}],
    ["Goes stiff and formal at the mention of the past", "Switches to clipped, official phrasing the moment an old event comes up.", "That was a long time ago. I really don't see the relevance.", 3, "d", {mood:-1, emo:-1, form:1}],
    ["Hears every question as a trap", "Answers even simple questions warily, checking for the catch before a word comes out.", "Why d'you ask? Who's been saying what? What's this about, exactly?", 4, "c", {mood:-1, emo:-1}],
    ["Squares up the papers before a personal answer", "Taps a stack of papers into a neat edge before answering anything about themselves.", "(taps the pile square) ...Fine. Yes. Why?", 1, "s", {mood:-1}],
  ]);

  /* Low mood: Expressive & Deep. */
  V2.block(out, "Personality Traits", "Emotional Capacity — Expressive & Deep", 241700, [
    ["Voice cracks mid-sentence and pushes through the break", "Lets the voice crack in mid-argument and drives on through the break without stopping.", "I just think — (voice goes) — I just think we deserved better.", 4, "c", {emo:1, mood:-1}],
    ["Rants in a rising spiral", "Lets one complaint feed the next until the original grievance is buried under old ones.", "And another thing — and last year — and your mother's wedding, don't get me started—", 5, "c", {emo:1, mood:-1}],
    ["Catastrophises out loud in real time", "Narrates the worst possible ending as it unfolds, each sentence larger than the last.", "It's over. We're ruined. The meeting's gone wrong and that's it, I'm finished.", 5, "u", {mood:-1, emo:1}],
    ["Pours out raw messages in the small hours", "Writes long, painful messages at night and unsends them by breakfast.", "(thumbs hovering) 'You have no idea what it's like—' (delete) 'Sorry about earlier.'", 3, "d", {emo:1, mood:-1}],
  ]);

  /* Low mood: tense affectations. */
  V2.block(out, "Mannerisms", "Emotional Affectations", 241800, [
    ["Laughs high and short when frightened", "Answers fear with a short, high laugh that doesn't fit the words around it.", "Ha! No. No, of course, it's fine. Ha. They found it? Great.", 4, "d", {mood:-1, emo:1}],
    ["Counts aloud to keep from shouting", "Murmurs numbers under their breath to hold a rising temper, then resumes in a dangerously even voice.", "One. Two. Three. — Right. Say that again, and say it slowly.", 4, "u", {mood:-1, disc:1}],
    ["Fills an awkward gap with a stream of anything", "Rushes to cover a pause with weather, plumbing and last week's film, each topic dropped half-finished.", "So — rained again — I've the boiler man Thursday — did you see that thing on the telly — anyway—", 4, "c", {mood:-1, vol:1}],
    ["Speeds up and climbs in pitch under pressure", "Gets quicker and higher as the stakes go up, until the words crowd one another.", "No, it's — the thing is — I did — I sent it — it should have — it's there!", 4, "c", {mood:-1, pace:1}],
  ]);

  /* Quiet low-agreeableness signatures. */
  V2.block(out, "Personality Traits", "Agreeableness — Contrarian & Argumentative", 241850, [
    ["Lets a 'you're right' wait a beat too long", "Concedes a point only after a pause long enough to be noticed, never in the first breath.", "(a pause) ...Mm. Yes. That's fair.", 1, "s", {agr:-1}],
    ["Hands a suggestion back with its flaw attached", "Repeats a proposal word for word with its one weakness added, and never quite says no.", "Shall we take the coast road? — The coast road. In October. Yes. Possibly.", 2, "s", {agr:-1}],
    ["Needs one more word after goodbye", "Lets a conversation end only after slipping in a final mild remark from the doorway.", "Night, then. — Night. — Mind the step. (door closes) — I did say.", 2, "s", {agr:-1}],
    ["Won't say yes to a Tuesday invitation", "Declines to give an immediate yes to anything, even trivial plans.", "Dinner Friday? — I'll see. — It's a Tuesday now. — I'll see.", 1, "s", {agr:-1}],
    ["Challenges one word of the question first", "Opens an answer by picking at a single word in what was asked.", "Would you like some tea? — 'Like' is strong. I'd accept tea.", 2, "s", {agr:-1}],
  ]);

  /* Quiet cold-and-distant signatures. */
  V2.block(out, "Personality Traits", "Friendliness — Cold & Distant", 241900, [
    ["Ends a call the instant the point is made", "Finishes phone conversations as soon as the facts are settled, without a goodbye.", "(address repeated back, line goes dead mid-'thanks')", 1, "s", {warm:-1}],
    ["Lets go of the handshake first", "Withdraws their hand a fraction before the other person is ready, every time.", "(hand gone at the first pump) Good. That'll do.", 1, "s", {warm:-1}],
    ["Points the way rather than walking you there", "Gives directions to a room instead of accompanying a guest to it.", "Kitchen's on the left. Second door. You'll find it.", 2, "s", {warm:-1}],
    ["Signs cards with an initial", "Closes messages and cards with one letter and a full stop, however warm the occasion.", "(the wedding card reads: 'Congratulations. R.')", 1, "s", {warm:-1}],
    ["Says 'is that everything?' at the door", "Uses a tidy business question where others use a warm goodbye.", "Lovely to see you. — Is that everything? — Yes. — Good. Goodbye, then.", 2, "s", {warm:-1}],
  ]);

  /* Quiet rebellious signatures. */
  V2.block(out, "Personality Traits", "Rebelliousness — Defiant", 241950, [
    ["Says 'noted' to an instruction and nothing more", "Replies to an order with a word that records it without agreeing to it.", "Lanyards at all times. — Noted.", 2, "s", {rebel:1}],
    ["Walks the wrong way down the one-way route", "Strolls against the arrows on the floor as if they were mere suggestions, and looks mildly surprised if noticed.", "(against the arrows, nodding to everyone) Sorry, wasn't looking. (They were.)", 1, "s", {rebel:1}],
    ["Uses the staff door with a confident nod", "Walks through a door marked staff only with the air of someone who belongs, and is not stopped.", "(nods to the guard, side door, gone)", 1, "s", {rebel:1}],
    ["Asks for the rule in writing, pen ready", "Meets an unexplained rule with a polite request to see it on paper.", "Is that policy written down anywhere? I'd like to read it. Properly.", 2, "s", {rebel:1}],
    ["Calls every rule a guideline", "Downgrades regulations to 'guidelines' or 'suggestions' in their own phrasing, mildly.", "Per the guidelines. Which, as guidelines go, are quite loose.", 1, "s", {rebel:1}],
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_POLES_B);
