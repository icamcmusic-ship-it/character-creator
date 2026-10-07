/* v2 content: empty rarity x intensity cells B. IDS 251000-251999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_CELLS_B = (function(){
  const out = [];

  // ---- Conflict & Stress Response ----
  V2.block(out, "Conflict & Stress Response", "Fight (attack the threat)", 251000, [
    ["Concedes three points, then nothing", "Gives ground on small points one after another in a level voice, and the fourth concession never comes, which is how those close know the fight has started.", "Yes. Fair. Yes, that one was mine. (a pause) No.", 1, "s", {asrt:1, mood:1}],
    ["Washes the same cup again", "Takes refuge in a slow, exact chore while the anger builds, and addresses every remark to the chore.", "(rinsing the cup for the third time) Right. That's clean now. That's properly clean.", 3, "d", {mood:1, disc:1}],
    ["Answers every complaint with a bigger one", "Meets the first grievance before it has finished by unrolling a longer list of their own, loudly.", "Me? Me? Oh, you want a list? How long have you got?", 4, "c", {asrt:1, agr:-1, vol:1}],
    ["Digs up the caravan holiday", "Drags an old grievance into an unrelated row at full volume, with the year and the weather.", "And while we're at it — Skegness, 2014! The rain! The ice cream! Don't tell me that's not relevant!", 4, "c", {asrt:1, agr:-1, mood:-1}],
  ]);
  V2.block(out, "Conflict & Stress Response", "Flight (remove yourself)", 251020, [
    ["Tidies towards the door", "Starts putting things away as the row heats up, drifting door-ward by way of the washing-up.", "I'll just put these in the kitchen, shall I. And the bin needs doing. Back in a bit.", 2, "s", {asrt:-1, mood:-1}],
    ["Announces the walk", "Declares an exit at full volume, complete with a destination and an instruction not to wait up.", "That's it. I'm going for a walk. I don't know how long. Don't wait up!", 4, "c", {vol:1, agr:-1, mood:-1}],
  ]);
  V2.block(out, "Conflict & Stress Response", "Freeze (shut down)", 251030, [
    ["Courteous half-second delay", "Answers a sharp question a beat too late and perfectly politely, as if a recording is being played back.", "(a beat too long) Thank you for telling me.", 1, "s", {emo:-1, mood:-1}],
    ["Silence that fills the kitchen", "Goes completely quiet under attack and stays quiet while the room fills with the sound of the fridge.", "(says nothing. The fridge hums. Still nothing.)", 5, "c", {vol:-1, asrt:-1, emo:-1}],
  ]);
  V2.block(out, "Conflict & Stress Response", "Fawn (appease the threat)", 251040, [
    ["Laughs ahead of the criticism", "Lets out a small laugh just before the criticism arrives, to take the sting out in advance.", "(small laugh) Ha — go on, I know what you're going to say.", 2, "s", {agr:1, ego:-1}],
    ["Apology cascade", "Piles one apology on another, adding a new fault each time, until the other person ends up consoling them.", "I'm so sorry, honestly, I'm sorry, that was thoughtless, and the last time too, I'm sorry, sorry.", 5, "c", {agr:1, man:1, ego:-1}],
  ]);

  // ---- Attachment & Intimacy Style ----
  V2.block(out, "Attachment & Intimacy Style", "Secure", 251060, [
    ["Lets the quiet after 'love you' stand", "Takes a declaration without rushing to answer it, matching it with a nod and getting on with the tea.", "(a slow nod. Kettle on. Two mugs.)", 1, "s", {emo:1, mood:1}],
    ["Repairs in passing", "Apologises sideways while doing something else, so the amends are easy to accept without ceremony.", "(passing the salt) Sorry about Thursday, by the way. I was short with you.", 3, "d", {warm:1, hon:1}],
    ["Open-armed homecoming", "Greets a partner's return with unguarded delight and keeps no tally of how late it is.", "There you are! Come here — tell me everything. Coat off first.", 4, "c", {warm:1, emo:1}],
    ["Raises the hurt that same evening", "States a sting plainly and at full steam on the day, because it matters more than the mood.", "That stung earlier, and I'd rather say it tonight than carry it round all week.", 4, "c", {hon:1, asrt:1}],
  ]);
  V2.block(out, "Attachment & Intimacy Style", "Anxious", 251080, [
    ["Phone face-down, then face-up", "Turns the phone over as if that settles the waiting, then turns it back to check.", "(phone down, face-down. Two minutes. Picked up again.) Just checking the time.", 1, "s", {mood:-1, emo:1}],
    ["Three ways of asking 'are we okay'", "Circles the same reassurance question in different wording within ten minutes.", "Are you cross? You sound cross. Are we okay? Be honest.", 4, "c", {emo:1, mood:-1, ego:-1}],
  ]);
  V2.block(out, "Attachment & Intimacy Style", "Avoidant", 251100, [
    ["'We' only after the other says it", "Uses the plural for shared plans only once the other person has said it first, and a little late.", "(after a pause) ...Yes. We. I suppose we are.", 2, "s", {emo:-1, warm:-1}],
    ["Weekend off, with footnotes", "Announces a need for space with a flourish and a list of reasons nobody asked for.", "I'm taking the weekend. Phone off. It's not about you — it's me — don't read into it.", 4, "u", {emo:-1, vol:1, asrt:1}],
  ]);

  // ---- Personality Traits ----
  V2.block(out, "Personality Traits", "Agreeableness — Contrarian & Argumentative", 251120, [
    ["Agrees with the first half", "Concedes the opening clause of a claim and takes issue with the rest, so nobody notices the agreement never arrives.", "Quite right about the budget. And the plan is wrong.", 2, "s", {agr:-1, intel:1}],
    ["'Funny, though'", "Opens objections with a mild remark of surprise that makes dissent sound like a coincidence.", "Funny, though — I'd have said it was the other way round.", 1, "s", {agr:-1, man:1}],
  ]);
  V2.block(out, "Personality Traits", "Agreeableness — Accommodating", 251140, [
    ["'No trouble' before the request", "Spots a favour about to be asked and answers it before the question forms.", "(before anyone asks) No trouble. I'll take the late one.", 1, "s", {agr:1, asrt:-1}],
    ["Volunteers for everything", "Puts a hand up for every task on offer, then adds a few more nobody listed.", "Me! I'll do it. I'll do all of it, honestly, I love it.", 5, "c", {agr:1, vol:1, act:1}],
    ["Insists you have the better seat", "Performs an elaborate pressing of the window seat, the bigger slice, the better bed on whoever is near.", "No, you take the window. I insist. No — I absolutely insist.", 3, "u", {agr:1, man:1, warm:1}],
  ]);
  V2.block(out, "Personality Traits", "Assertiveness — Assertive & Direct", 251160, [
    ["Opens with the time they have", "States how long they can stay before the meeting starts, so the agenda bends around it.", "I have until four. Let's start with the one that matters.", 2, "s", {asrt:1, disc:1}],
    ["Requests without cushions", "Strips the 'just' and 'sorry to bother you' out of requests with no change in tone.", "I need the report by Friday.", 1, "s", {asrt:1, ego:1}],
    ["Takes the room by the collar", "Calls a meeting to order at full voice and sets out how it will go.", "Right, everyone, eyes up. Here's how this goes.", 5, "c", {asrt:1, vol:1}],
  ]);
  V2.block(out, "Personality Traits", "Positivity — Optimistic & Upbeat", 251180, [
    ["Tells it as a future anecdote", "Describes a current mess as something that will make a good story by next winter.", "This'll be a great story by Christmas. Give it a month.", 2, "s", {pos:1, mood:1}],
    ["One good thing at the tail of a complaint", "Ends a long complaint with a small good detail, offered without comment.", "...anyway, the bread was lovely.", 1, "s", {pos:1}],
    ["Morning, morning, MORNING!", "Delivers a greeting to the whole street at a volume that assumes everyone is delighted to hear it.", "Morning, morning, MORNING! Isn't it gorgeous out!", 5, "c", {pos:1, vol:1, act:1}],
    ["Cheers from the touchline", "Narrates other people's efforts with loud encouragement they did not ask for.", "Go on, you've got this! Nearly there! Look at you go!", 4, "c", {pos:1, warm:1, vol:1}],
  ]);
  V2.block(out, "Personality Traits", "Rebelliousness — Defiant", 251200, [
    ["Leaves one box blank", "Completes every form correctly but skips one question, on principle.", "Occupation, address, date. And 'Reason for visit' — I'll pass on that one.", 1, "s", {rebel:1, asrt:1}],
    ["'We'll see how Tuesday goes'", "Answers an order with a pleasant promise to review it later, which is not agreement.", "Of course. We'll see how Tuesday goes.", 2, "s", {rebel:1, man:1}],
    ["Demands the author of the rule", "Wants to know who made the rule and why, at length, from the front of the queue.", "Who decided that? Name them. I'd like a word.", 4, "c", {rebel:1, asrt:1, vol:1}],
  ]);
  V2.block(out, "Personality Traits", "Activeness — Energetic & Active", 251220, [
    ["Talks faster on the move", "Lets the sentence pick up speed along with the walking pace.", "(pace quickens, and so does the sentence) so if we go left here and then — keep up — straight on...", 1, "s", {act:1, pace:1}],
    ["'Shall we walk it?'", "Suggests moving the conversation outdoors after a spell in a chair.", "Shall we walk it? I think better on my feet.", 2, "s", {act:1, cur:1}],
    ["Saturday in four stages", "Plans the weekend as a relay of activities with an early start announced in advance.", "Saturday: swim, market, hill, pub. Sunday we start early.", 5, "c", {act:1, pace:1, vol:1}],
  ]);
  V2.block(out, "Personality Traits", "Honesty — Truthful & Transparent", 251240, [
    ["Corrects the credit", "Gently moves a compliment to whoever deserved it, even when it costs a little warmth.", "Thanks, but the soup was Dilys's recipe. I only stirred.", 2, "s", {hon:1, ego:-1}],
    ["Won't pretend at volume", "Delivers an unwelcome verdict clearly enough that the next table hears.", "That plan won't work, and I'd be lying if I said otherwise!", 4, "c", {hon:1, vol:1, asrt:1}],
    ["Owns the slip to the room", "Announces their own small error to the whole office the moment it is spotted.", "Everyone — wrong file sent. My fault. Entirely my fault.", 3, "d", {hon:1, emo:1}],
  ]);
  V2.block(out, "Personality Traits", "Discipline — Self-Controlled", 251260, [
    ["Sets the cup down first", "Puts down whatever is in their hands before hearing bad news.", "(sets the cup in its saucer) Go on.", 1, "s", {disc:1, mood:1}],
    ["Reads the timetable aloud", "Narrates the day's schedule with a warning about the minutes that are not to be disturbed.", "Six thirty up, seven run, eight breakfast. Do not speak to me at quarter to.", 4, "c", {disc:1, vol:1, form:1}],
  ]);
  V2.block(out, "Personality Traits", "Discipline — Impulsive & Undisciplined", 251280, [
    ["Swaps the usual at the last second", "Opens an order with the usual and swerves to something else mid-word.", "The usual — no, wait, the fish.", 2, "s", {disc:-1, cur:1}],
  ]);
  V2.block(out, "Personality Traits", "Confidence — Self-Assured", 251300, [
    ["Carries on past the punchline", "Delivers a joke and keeps talking without glancing round to see if it landed.", "(end of the joke) ...and that's why I never go back. Anyway, the second item.", 1, "s", {ego:1, asrt:1}],
    ["Orders for the table", "Settles the choice for everyone at the restaurant, with a flat promise they will thank them.", "We're having the lamb. Trust me. Four lamb.", 3, "u", {ego:1, asrt:1, vol:1}],
  ]);
  V2.block(out, "Personality Traits", "Confidence — Insecure or Egotistical", 251320, [
    ["'Was that all right?' after praise", "Asks for a verdict on a thing everyone has just praised.", "...Was that really alright? You can tell me.", 2, "s", {ego:-1, emo:1}],
  ]);
  V2.block(out, "Personality Traits", "Intelligence — Sharp & Analytical", 251340, [
    ["Restates the question first", "Rewrites the question into cleaner terms before answering it.", "So you're asking if it's cheaper, not if it's better. Cheaper, then.", 1, "s", {intel:1, form:1}],
  ]);
  V2.block(out, "Personality Traits", "Emotional Capacity — Expressive & Deep", 251360, [
    ["Voice drops on a loved name", "Lowers the voice half a tone on the name of someone loved or lost, then carries on as before.", "(very quietly) ...Mum used to say that. (normal voice) Anyway.", 1, "s", {emo:1, mood:1}],
    ["Weeps at the advert, out loud", "Narrates their own tears at a shop-window display in a voice that carries.", "Oh, now look at that — the little dog — I'm in bits — I'm in actual bits!", 5, "c", {emo:1, vol:1}],
  ]);
  V2.block(out, "Personality Traits", "Friendliness — Warm & Approachable", 251380, [
    ["Remembers the passer-by's detail", "Holds onto the small news of near-strangers and returns to it months later.", "Did the allotment survive the flood? You were worried at the harvest supper.", 2, "s", {warm:1, cur:1}],
    ["Greets the whole lift", "Says hello, asks how it's going, and offers a view on the weather to everyone in the lift.", "Morning all! Cold one! Everyone had breakfast? Good, good.", 3, "u", {warm:1, vol:1}],
  ]);
  V2.block(out, "Personality Traits", "Friendliness — Cold & Distant", 251400, [
    ["Greeting returned, nothing added", "Hands back the greeting word for word and stops there.", "Morning.", 1, "s", {warm:-1, vol:-1}],
  ]);
  V2.block(out, "Personality Traits", "Manners — Polished & Courteous", 251420, [
    ["'We' for the host's lapse", "Takes a share of the blame for the host's mistake before the host can wince.", "We do seem to have run out of ice — how careless of us.", 2, "s", {man:1, form:1}],
    ["Thanks in triplicate", "Thanks the person, then the thing, then the effort, with a closing flourish.", "Thank you. Thank you so much. Honestly, thank you — it was above and beyond.", 3, "u", {man:1, warm:1, form:1}],
  ]);

  // ---- Values & Moral Line ----
  V2.block(out, "Values & Moral Line", "Rigid & Principled", 251440, [
    ["Walks back with the change", "Returns excess change after leaving the till, a few steps out of the door.", "(coming back in) You gave me a pound too much.", 2, "s", {hon:1, disc:1}],
    ["Waits for the green, alone", "Stands at an empty crossing and waits for the signal, remarking on it to nobody.", "(to the empty road) Wait for the green.", 1, "s", {disc:1, rebel:-1}],
    ["Quotes the clause by number", "Cites the rule by section and paragraph, loudly, to anyone bending it.", "Section four, paragraph two. Read it yourself!", 4, "c", {asrt:1, form:1, vol:1}],
    ["Polices the queue", "Calls out a queue-jumper at the top of their voice, on everyone's behalf.", "Excuse me! The queue starts back there.", 3, "c", {asrt:1, man:-1, vol:1}],
  ]);
  V2.block(out, "Values & Moral Line", "Pragmatic & Flexible", 251460, [
    ["Prices the principle", "Asks what doing it properly would cost before deciding whether it is worth doing.", "What would it cost to do it right, though? Roughly?", 3, "d", {intel:1, hon:-1}],
    ["'It's only business!'", "Waves away a dubious deal at full volume with the claim that everyone does it.", "Oh come on, it's just business! Everybody does it!", 4, "c", {vol:1, agr:-1, hon:-1}],
  ]);
  V2.block(out, "Values & Moral Line", "Loyalty-Bound", 251480, [
    ["'Our' about a friend's mess", "Refers to a friend's venture as ours without having been asked in.", "Our little disaster of a shop. We'll sort it.", 1, "s", {warm:1}],
    ["Defends before the facts", "Rushes to defend an absent friend before learning what was said.", "Whatever they've done, they had a reason. Who's saying this?", 3, "u", {warm:1, asrt:1, vol:1}],
  ]);
  V2.block(out, "Values & Moral Line", "Idealistic & Visionary", 251500, [
    ["Files the failed idea under 'not yet'", "Keeps the clippings of a rejected proposal in a folder labelled for later.", "Not dead. Just early.", 2, "s", {pos:1, disc:1}],
    ["Rallies the dinner table", "Turns a dull meal into a call to fix the street, the school, the lot.", "What if we just — fixed it? Properly? All of us?", 5, "c", {pos:1, vol:1, emo:1}],
  ]);
  V2.block(out, "Values & Moral Line", "Self-Interested", 251520, [
    ["Mentions the favour, lightly", "Tucks a reminder of what they did for someone into an easy-sounding aside.", "(lightly) That's one I'll remember.", 2, "s", {warm:-1, man:1}],
    ["Haggles at every till", "Bargains out loud over prices with no embarrassment and an audience.", "Forty? For that? Twenty-five and I'll carry it myself.", 5, "c", {asrt:1, vol:1, man:-1}],
  ]);

  // ---- Vocabulary Traits ----
  V2.block(out, "Vocabulary Traits", "Affective & Emotional Intensity", 251540, [
    ["'I like it' as the top mark", "Rations strong words so that a plain 'like' lands as very high praise.", "I like it. (a pause) I like it a lot.", 2, "s", {emo:-1, hon:1}],
    ["'Devastated' for a sold-out biscuit", "Reaches for the heaviest word in the language for the smallest letdown.", "I'm devastated, actually. They've sold out of the oat ones.", 5, "c", {emo:1, vol:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Morphological & Structural Lexicon", 251560, [
    ["Adds 'ish' to the exact time", "Hangs 'ish' on a precise time or amount, then supplies the exact figure anyway.", "Tuesday-ish. Quarter past three-ish. Okay, three seventeen.", 2, "s", {intel:1, mood:1}],
    ["Diminutive for everything", "Shrinks every noun with 'little' or 'wee', including the large and serious ones.", "Shall we have a quick little cuppa and a wee biscuit?", 4, "c", {warm:1, vol:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Phonetic & Auditory Qualities", 251580, [
    ["Sigh before the bad news", "Breathes in on an 'ah' before delivering anything unwelcome.", "Ahh... right. It's not the news you wanted.", 2, "s", {mood:-1, hon:1}],
    ["Sing-song hello", "Pushes the vowels of a greeting up and over like a hill.", "HEL-lo-o! How ARE you?", 4, "c", {warm:1, vol:1, pos:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Pragmatic Focus & Speech Functions", 251600, [
    ["Deadline first, request second", "Leads a request with the date it is wanted by and the favour afterwards.", "By Friday, if possible — could you look at this?", 2, "s", {disc:1, man:1}],
    ["Announces the honesty", "Prefaces a statement with a declaration about how sincere it is going to be.", "Now I'm going to be completely honest with you, and I mean this.", 4, "c", {hon:1, vol:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Precision & Specificity Level", 251620, [
    ["'Roughly' and then the exact figure", "Opens with a hedge and finishes with a number to the unit.", "Roughly four hundred. Four hundred and twelve.", 1, "s", {intel:1, hon:1}],
    ["Exact numbers for rough things", "Offers minute-level precision for events no one timed.", "It was forty-seven minutes. Forty-eight, tops.", 4, "c", {intel:1, disc:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Semantic Density & Modifiers", 251640, [
    ["The one-word verdict", "Answers a long question with a single carefully chosen word.", "Eventful.", 1, "s", {vol:-1, intel:1}],
    ["Adjective pile-up", "Stacks three or four near-synonymous adjectives before the noun arrives.", "It was a big, beautiful, gorgeous, enormous cake.", 3, "c", {vol:1, pos:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Directness & Literalness", 251660, [
    ["Answers, then asks the real one", "Gives the literal answer and follows it with the question that was actually meant.", "Yes, I've eaten. Have you?", 1, "s", {warm:1, hon:1}],
    ["Flat verdicts on everything", "Hands down judgements in three words or fewer, at a decent volume.", "Don't like it. Too fussy. Next.", 4, "c", {asrt:1, hon:1, vol:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Conceptual Framework & Loanwords", 251680, [
    ["Private family word in public", "Uses a household word for an everyday thing, in front of people who cannot know it.", "Mind the glumph — the wet step by the door.", 3, "d", {warm:1}],
    ["Buzzwords at full speed", "Strings office jargon together at a trot without stopping for the verb.", "Let's circle back and leverage the learnings offline, going forward!", 4, "c", {form:1, vol:1, pace:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Register & Formality Spectrum", 251700, [
    ["One formal sentence when moved", "Steps into stiff formality for a single line when feeling something large.", "I am, I should say, very grateful.", 2, "s", {form:1, emo:1}],
    ["Swearing as punctuation", "Peppers every clause with a mild oath that adds no information.", "It's a bloody good plan, is what it is. A bloody good plan.", 4, "c", {man:-1, vol:1, form:-1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Temporal Orientation & Tense Usage", 251720, [
    ["Counts from a Christmas", "Dates events by the last few Christmases rather than by the calendar.", "That was... two Christmases ago. Maybe three.", 1, "s", {warm:1}],
    ["Tells it in the present tense", "Narrates a past event in a breathless present, and the volume rises as it goes.", "So I walk in, right, and they're just sat there, and I say—", 4, "c", {vol:1, pace:1}],
  ]);

  // ---- Dialogue Grammar Traits ----
  V2.block(out, "Dialogue Grammar Traits", "Anchors & Fillers", 251740, [
    ["'Anyway' to leave a feeling", "Uses 'anyway' as a door out of a moment that has become too tender.", "...and I miss them. Anyway.", 1, "s", {emo:-1}],
    ["'Like, y'know, like'", "Fills every gap with 'like' and 'y'know' until the sentence is mostly anchor.", "It was, like, y'know, like, mental, you know?", 4, "c", {vol:1, pace:1}],
  ]);
  V2.block(out, "Dialogue Grammar Traits", "Disfluencies & Flow", 251760, [
    ["Restarts on the same three words", "Begins the sentence again from the same first three words after each stall.", "I think we— I think we should— I think we should wait.", 2, "s", {ego:-1, mood:-1}],
    ["Trails off mid-thought", "Lets the sentence dissolve into an ellipsis loud enough for a hint.", "It's just that if you were to... well... you know...", 3, "c", {asrt:-1, mood:-1}],
  ]);
  V2.block(out, "Dialogue Grammar Traits", "Spoken Compression", 251780, [
    ["Verbs without subjects", "Reports a day as a list of bare verbs.", "Arrived. Ate. Slept.", 2, "s", {vol:-1, pace:1}],
    ["Telegram speech", "Issues directions as stripped nouns and numbers at speed.", "Station. Ten. Bring coat.", 5, "c", {pace:1, asrt:1}],
  ]);
  V2.block(out, "Dialogue Grammar Traits", "Structural Shifts", 251800, [
    ["Question swerves into order", "Starts a polite question and turns it into an instruction mid-clause.", "Would you mind — sit down.", 2, "s", {asrt:1, man:-1}],
    ["Chain of rhetorical questions", "Delivers an accusation as a chain of questions with no gap for answers.", "And what did I say? What did I SAY? Did I not say?", 4, "c", {asrt:1, vol:1}],
  ]);
  V2.block(out, "Dialogue Grammar Traits", "Turn-Taking Grammar", 251820, [
    ["Two seconds before replying to praise", "Leaves a gap before replying to a compliment, as though checking it for traps.", "(two seconds) ...Thank you.", 1, "s", {ego:-1, mood:-1}],
    ["Hurry-along noises", "Drives the other speaker towards the end of their sentence with impatient murmurs while getting ready to take the floor.", "Mm-hm, mm-hm, get to the end, go on, go on—", 4, "c", {vol:1, pace:1, man:-1}],
  ]);
  V2.block(out, "Dialogue Grammar Traits", "Repetition & Echo Patterns", 251840, [
    ["Soft echo of the last word", "Repeats the other person's final word under the breath, once, as they finish.", "Thursday. (softly) Thursday.", 1, "s", {emo:1, mood:-1}],
    ["Three times for emphasis", "Repeats the key word three times, each louder than the last.", "Never. Never. NEVER.", 5, "c", {vol:1, asrt:1}],
  ]);
  return out;
})();
TRAITS.push(...TRAITS_V2_CELLS_B);
