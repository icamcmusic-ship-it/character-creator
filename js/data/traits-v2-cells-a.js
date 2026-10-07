/* v2 content: empty rarity x intensity cells A (quiet signatures and loud commons in existing categories). IDS 250000-250999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_CELLS_A = (function(){
  const out = [];

  V2.block(out, "Humor Style", "Humorless & Absent", 250000, [
    ["Takes notes on what made people laugh", "Jots a line in a pocket notebook after other people's jokes land, then reads nothing back to anyone.", "(pencil moving) — Sorry, go on. I just want to get the Tuesday one down before I lose it.", 2, "s", {intel:1, emo:-1}],
    ["Asks about the joke a day later", "Turns up the next morning with a calm question about one line from yesterday, still turning it over.", "That thing you said about the heron and the tax office. Was the heron the point, or the tax office?", 1, "s", {cur:1, emo:-1}],
    ["Stone-faced through the party game", "Sits out charades and forfeits with a level look, which makes the circle louder and their corner quieter.", "(arms folded, eyes on the clock) — I'll hold the timer. Somebody has to hold the timer.", 4, "c", {warm:-1, pos:-1}],
    ["Fact-checks the punchline out loud", "Stops a joke halfway to correct a detail in it, then waits for the teller to resume, unamused.", "Pelicans don't actually carry anything in the beak, though, it's a throat pouch. Carry on.", 4, "c", {intel:1, man:-1}],
    ["Asks to get back to the point", "Meets every aside with the same flat request to return to the agenda, a notch louder each time.", "Right. Right. Can we get back to the point. The point, please. Back to it. Now.", 5, "c", {asrt:1, disc:1}]
  ]);

  V2.block(out, "Humor Style", "Intellectual & Wordplay", 250020, [
    ["Tries the pun on the kettle first", "Murmurs a pun to an empty kitchen before it ever reaches an audience, and often leaves it there.", "(to the kettle, very quietly) — Stirring performance.", 1, "s", {intel:1, vol:-1}],
    ["Footnotes their own joke in a murmur", "Adds a half-whispered second meaning to a line only after the room has moved on.", "(under their breath, to the tea) — ...and 'bank', if you think about it.", 2, "s", {intel:1, vol:-1}],
    ["Puns in the margin of the shopping list", "Writes small wordplay beside ordinary items, where only the next person to read the list will find it.", "(beside 'eggs', in pencil) — Hen-ceforth.", 1, "s", {intel:1, cur:1}],
    ["Explains the pun to the whole table", "Walks round a pun's two meanings with a finger on the tablecloth long after the laugh has died.", "So 'mussel' is the shellfish and 'muscle' is the — no, stay with me — they sound the same.", 4, "c", {vol:1, intel:1}],
    ["Calls the crossword answer across the room", "Shouts clue and solution to anyone within earshot, wrong guesses included.", "Seven letters, 'sheepish'! BASHFUL! No — ASHAMED! Hang on, that's eight.", 4, "c", {vol:1, cur:1}]
  ]);

  V2.block(out, "Humor Style", "Warm & Playful", 250040, [
    ["Signs the fridge note with a new silly rank", "Ends written notes with a different made-up title each time, for whoever finds them first.", "(on the fridge, in felt tip) — Back by six. Captain Toast, Acting.", 2, "s", {warm:1, pos:1}],
    ["Keeps one ridiculous voice for one person", "Uses a private silly voice only for a single person, and only when nobody else is listening.", "(very low, to the dog) — Good evening, Sir Biscuit.", 1, "s", {warm:1, emo:1}],
    ["Throws a parade for a parked car", "Treats a mundane success as a standing ovation, calling others over to witness it.", "You've parked! Everybody, they've parked it! Look at that — straight between the lines!", 5, "c", {warm:1, pos:1, vol:1}],
    ["Narrates the washing-up as a cooking show", "Gives a running commentary on the chores in a presenter's voice, with a stern guest critic in the sink.", "And here we have the saucepan, a little stubborn, a little proud — let's see what the sponge makes of that.", 4, "c", {warm:1, act:1}]
  ]);

  V2.block(out, "Humor Style", "Self-Deprecating", 250060, [
    ["Scores their own slips under their breath", "Murmurs 'minus one' after a small mistake, as if keeping score in a game nobody else knows they are playing.", "(after dropping the spoon, under breath) — Minus one.", 1, "s", {ego:-1, mood:1}],
    ["Names themselves first on the suspect list", "Adds their own name to the list of people who might have caused a small problem, before anyone has looked.", "Who finished the milk? (beat) Start with me. Probably me.", 2, "s", {ego:-1, hon:1}],
    ["Rings the bell on their own blunder", "Announces each of their mistakes to the room before anyone has noticed it.", "Everybody — I've done it again. I put the salt in the tea. Come and look.", 5, "c", {ego:-1, vol:1, emo:1}],
    ["Meets a compliment on a dish with a list of faults", "Answers praise for a meal with a detailed inventory of everything that went wrong in the kitchen.", "Don't say nice. The potatoes are cement and the gravy has an opinion. Eat the peas.", 4, "c", {ego:-1, vol:1}]
  ]);

  V2.block(out, "Humor Style", "Doesn't Get Jokes", 250080, [
    ["Holds the half-smile a second too long", "Watches the teller's mouth for a cue and then offers a smile that arrives late and outstays the moment.", "(half-smile, held) — Right. Yes. Ha.", 1, "s", {agr:1, intel:-1}],
    ["Corrects the exaggeration with the real figure", "Answers a casual overstatement with the actual number, at volume, and means it kindly.", "A million? It was forty-three people. I counted. Forty-three!", 4, "c", {hon:1, vol:1}]
  ]);

  V2.block(out, "Humor Style", "Teasing as Affection", 250100, [
    ["Echoes a friend's own reassurance back to them", "Repeats someone's favourite reassurance back to them in their own cadence, only when they are low.", "(softly, copying the lilt) — 'It'll be fine, it'll be fine.' Come here, you.", 1, "s", {warm:1, emo:1}]
  ]);

  V2.block(out, "Humor Style", "Cruel & Barbed", 250120, [
    ["Saves the sharpest line for the one they respect", "Reserves their best barb for the single person in the room they privately rate, and delivers it pleasantly.", "(pleasantly) — Oh, you managed it. I'd have bet on Thursday. Still, good for you.", 3, "d", {asrt:1, warm:-1}]
  ]);

  V2.block(out, "Humor Style", "Absurd & Chaotic", 250140, [
    ["Answers a plain question with a hypothetical about geese", "Meets a practical query with an invented scenario involving geese and treats it as an answer.", "Has the post come? — Depends. If geese ran the post, it'd have been here at six.", 3, "u", {intel:1, rebel:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Caretaker", 250160, [
    ["Slides the tissue box an inch closer", "Moves the box towards whoever is close to tears, with one finger, and carries on stirring.", "(slides the box across, says nothing, goes on with the soup)", 1, "s", {warm:1, vol:-1}],
    ["Nudges the thermostat before the coldest guest arrives", "Raises the heating a degree for the person who always feels the draught, then denies it was for them.", "(adjusting the dial) — Oh, I only touched it for the pipes.", 2, "s", {warm:1, disc:1}],
    ["Sends a one-word check after the long drive", "Texts the person who drove home alone, just to hear they arrived.", "(a text, 11.42pm) — Home x", 1, "s", {warm:1, man:1}],
    ["Presses a second helping on everyone", "Refills every plate by reflex and treats a refusal as a negotiating position.", "You've hardly touched it! Go on — there's loads, there's far too much, I made enough for the street.", 5, "c", {warm:1, asrt:1, vol:1}],
    ["Runs the coat, scarf and keys inspection at the door", "Checks that each person has a coat, a scarf and a charged phone before anyone is allowed to leave.", "Hat. Hat! It's two degrees. And have you got your keys — show me the keys.", 4, "c", {warm:1, disc:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Peacemaker", 250180, [
    ["Shifts the vase so two rivals lose their sightline", "Moves a plate, a lamp or a vase so that two people in dispute can no longer look straight at each other.", "(sliding the vase to the middle of the table) — That's better. It was blocking the light.", 1, "s", {agr:1, mood:1}],
    ["Gives a small kind huff of laughter at the peak", "Lets out a short, gentle laugh exactly as a quarrel is about to boil, which sometimes lets the air out.", "(a soft breath out) — Oh, listen to the pair of you.", 2, "s", {warm:1, mood:1}],
    ["Hums something slow when voices rise", "Starts humming a slow tune from the next room as soon as the shouting begins.", "(from the kitchen, humming a hymn tune, getting slightly louder)", 1, "s", {agr:1, vol:-1}],
    ["Wedges into the argument with open palms", "Steps physically between two people, palms out, repeating the same calming word until one of them sits.", "Okay okay okay okay. Nobody's said anything that can't be unsaid. Breathe. Everyone breathe.", 5, "c", {agr:1, vol:1, act:1}],
    ["Splits the difference before anyone has finished", "Jumps in with a tidy compromise before either side has made its case.", "So Tuesday for you, Thursday for you, and we all eat before seven. Done. Lovely. Shake.", 4, "c", {agr:1, pace:1}],
    ["Drafts the apology both sides can send", "Writes one joint message that lets each party keep their dignity, and hands it round for approval.", "I've written it. You say 'sorry for the tone', they say 'sorry for the timing'. Nobody says 'sorry for being right'.", 3, "d", {agr:1, intel:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Instigator", 250200, [
    ["Leaves the loaded question in the group chat", "Posts a harmless-seeming question and then goes quiet to watch the replies come in.", "(in the chat) Genuine question — who actually likes the new rota? Just asking.", 1, "s", {rebel:1, vol:-1}],
    ["Repeats a remark to a third person with a different stress", "Passes on something half-heard with one word leaned on a little harder than the original.", "(mildly) — Funny. She said 'fine' last week as well, but she put a lot on the 'fine'.", 2, "s", {rebel:1, man:-1}],
    ["Raises the forbidden subject while passing the salt", "Drops the one subject nobody mentions into the quietest moment of a meal, in a passing tone.", "(passing the salt) — Did anyone ever hear how the will turned out?", 2, "s", {rebel:1, asrt:1}],
    ["Shouts 'go on, then!' at a standoff", "Cheers a stand-off along like a spectator at a boxing match.", "Go on then! Say it! You've been wanting to say it for years — say it!", 5, "c", {rebel:1, vol:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Leader", 250220, [
    ["Takes the seat in the draught", "Picks the chair with the cold air or the glare behind it so nobody else has to.", "(sitting down) — No, no, I like this one. Sun's in my eyes. Good for me.", 1, "s", {warm:1, ego:1}],
    ["Picks up the heavy end without a word", "Goes silent and starts carrying boxes when the pressure peaks, a signal the group learns to read.", "(takes the other end of the table, nods once, says nothing)", 2, "s", {disc:1, vol:-1}],
    ["Claps twice and says 'right, listen up'", "Opens every gathering with a double clap and a raised voice, to the groans of regulars.", "(two claps) Right! Listen up! Eyes on me, phones away — this won't take long, and I mean it.", 5, "c", {asrt:1, vol:1}],
    ["Draws the plan on whatever is nearest", "Sketches the plan on a beermat, a hand or a dusty windscreen and expects it to be photographed.", "(on a beermat, marker out) — Here's us, here's the gate, here's the van. Photograph it. Somebody photograph it.", 3, "d", {asrt:1, intel:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Outsider", 250240, [
    ["Orders what the group orders, a minute later", "Watches the others choose before making their own order, and then names the same thing.", "(to the waiter, glancing across the table) — Same as him. Yes, thanks.", 1, "s", {agr:1, ego:-1}],
    ["Says 'you lot', then corrects it to 'we'", "Slips into 'you lot' about the group and swaps to 'we' a moment later, quietly, as though hoping nobody heard.", "You lot always — we always do the quiz on Thursdays, yes.", 2, "s", {ego:-1, mood:-1}],
    ["Arrives late, hovers at the fringe, leaves early", "Stands at the edge of every conversation and departs with an invented reason.", "Oh, is that the time. Dog. Got the dog. Brilliant night, honestly, thanks.", 4, "c", {vol:-1, mood:-1}],
    ["Explains the group's own customs back to them", "Describes the group's traditions to its members as though reporting on a foreign country.", "And this is where, I notice, everyone takes their shoes off. Fascinating. Why the left side first, though?", 5, "c", {cur:1, emo:-1}]
  ]);

  V2.block(out, "Social Role in a Group", "Connector", 250260, [
    ["Keeps the napkin with the plumber's name", "Writes down a throwaway remark on a napkin and weeks later sends the exact answer it called for.", "(a text) Found the napkin. You said your sister needed a plumber. This is Reggie's number.", 1, "s", {warm:1, disc:1}],
    ["Introduces everyone to everyone at the door", "Greets each arrival with a shout of 'you must meet' and a hand on the shoulder, whether or not anyone is ready.", "Oh, you've got to meet Hana! Hana, this is — what do you do again? Doesn't matter. Chat!", 5, "c", {vol:1, warm:1}],
    ["Starts the group chat before the plans exist", "Creates the group message for an event that has no date, no place and no guest list yet.", "Added you all. Don't mute it. I'll need dates by Friday and everyone's allergies.", 4, "c", {pace:1, asrt:1}],
    ["Seats people beside the one person they need", "Rearranges place cards so each guest ends up next to the person most useful to them.", "(shifting cards) — You, here, next to Priya. She's hiring. Don't say I said.", 3, "u", {intel:1, warm:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Skeptic", 250280, [
    ["Asks 'where was that, sorry?' with a small smile", "Asks for the source in a friendly murmur and then lets the silence do the questioning.", "(mild, pouring tea) — Oh really? Where was that, sorry?", 1, "s", {intel:1, man:1}],
    ["Demands the name of 'they'", "Meets any casual 'they say' with a full-voice challenge to produce evidence.", "Oh, 'they say'? Who's they? Name one. Name one 'they' and we'll go from there!", 4, "c", {intel:1, asrt:1, vol:1}],
    ["Repeats the claim back with one detail altered", "Restates what was said with a single fact slightly wrong, to see whether the speaker notices.", "So it opened in nineteen-oh-four. — Nineteen-ten. — Ah. Good, you were listening.", 3, "u", {intel:1, cur:1}]
  ]);

  V2.block(out, "Habits & Vices", "Risk & Escape", 250300, [
    ["Holds the car keys through the whole party", "Keeps the keys in their palm, thumb on the fob, from the first drink to the last goodbye.", "(keys turning in the palm) — No, honestly, I'll stay. Just another half hour.", 1, "s", {rebel:1, mood:-1}],
    ["Reads tonight's cheapest flights, then closes the tab", "Scrolls through departures leaving in a few hours with no plan to book them.", "(to nobody, scrolling) — Lisbon, six a.m. Hundred and nine.", 2, "s", {cur:1, mood:-1}],
    ["Puts a coin on which lift arrives first", "Places a private small bet on an ordinary event and says nothing about it.", "(a coin goes into the palm) — Third floor. Fifty pence.", 1, "s", {rebel:1, vol:-1}],
    ["Says 'go on, live a little'", "Pushes friends towards the risky option with the same cheerful phrase, ignoring the maths.", "Go on, live a little! You'll regret the one you didn't ride. Book it. Book it now.", 4, "c", {rebel:1, pos:1, vol:1}],
    ["Takes the closed-road shortcut with running commentary", "Ignores the barrier and talks cheerfully through every foot of the detour.", "It says closed. It always says closed. Hold on to something — we are fine, we are absolutely fine, nearly there.", 4, "c", {rebel:1, act:1}]
  ]);

  V2.block(out, "Habits & Vices", "Substance & Consumption", 250320, [
    ["Turns an unlit cigarette through the whole chat", "Holds an unlit cigarette between two fingers for an entire conversation and never raises it.", "(an unlit cigarette turning, never raised) — Not for me. Just nice to have.", 1, "s", {mood:-1, vol:-1}],
    ["Makes a fresh cup before the last is gone", "Starts another coffee while the first is barely touched and cold.", "(kettle on again) — Mine's gone cold. I'll make another. Do you want one?", 1, "s", {disc:-1}],
    ["Shuts their eyes for the first sip of the day", "Closes their eyes and breathes out for the first mouthful, a pause the household learns to wait for.", "(eyes closed, a long breath out) — There. Now. Go on then.", 2, "s", {mood:1, vol:-1}],
    ["Orders for the table before anyone has finished", "Calls the next round, and chips, before the first glass has been put down.", "Same again! Same again for everyone, and a pile of chips — put it on mine.", 5, "c", {vol:1, rebel:1}],
    ["Cannot speak before the coffee, and says so repeatedly", "Declares a ban on conversation until a cup has been delivered, and enforces it loudly.", "Do not speak to me. Do not look at me. Coffee, then words. Coffee. Then. Words.", 4, "c", {mood:-1, asrt:1}]
  ]);

  V2.block(out, "Habits & Vices", "Compulsion & Ritual", 250340, [
    ["Taps the lid twice before opening a parcel", "Gives a box two light taps with a fingertip before the knife goes in.", "(two light taps, then the knife) — Right.", 1, "s", {disc:1, vol:-1}],
    ["Reads the last line first", "Flicks to the back of a book to check how it ends before starting at page one.", "(thumb flicking to the back) — Okay. Good. They're alive. Now we can begin.", 2, "s", {mood:-1, cur:1}],
    ["Raps wood after every hopeful sentence", "Knocks their knuckles on the nearest wooden surface, loud enough to be heard next door, after each optimistic remark.", "Should be fine by Friday — (knock, knock, knock) — touch wood, touch wood, don't say it!", 5, "c", {vol:1, mood:-1}],
    ["Folds the receipt into a square before pocketing", "Makes three precise folds and a tuck of every receipt, and won't leave the till until it is done.", "(fold, fold, fold, tuck) — Done. Okay. Now we can go.", 3, "u", {disc:1, mood:-1}]
  ]);

  V2.block(out, "Habits & Vices", "Restraint & Discipline", 250360, [
    ["Leaves one square of chocolate in the wrapper", "Folds the foil back over the last square on purpose, as tomorrow's.", "(folding the foil back over) — That's tomorrow's.", 1, "s", {disc:1, vol:-1}],
    ["Announces the new regime to the room", "Tells everyone in earshot, at volume, the rules they have set themselves this month.", "Right. No sugar, no phone after nine, up at six. Day one. Hold me to it. Everybody hold me to it.", 5, "c", {disc:1, vol:1, pos:1}],
    ["Declines a biscuit with a speech", "Turns down an offered treat with a full account of the regime behind the refusal.", "No, no, thank you — I'm off sugar till March, it's a whole thing, there's a spreadsheet — no. No. Don't wave it.", 4, "c", {disc:1, vol:1}]
  ]);

  V2.block(out, "Habits & Vices", "Avoidance & Procrastination", 250380, [
    ["Slides the unopened envelope under the fruit bowl", "Reads the first line of a bill or letter and tucks it out of sight with the fruit.", "(slips the envelope under the bowl) — Later. It's the sort of thing for later.", 2, "s", {disc:-1, mood:-1}],
    ["Stages a ceremony for the fresh start due next week", "Makes a ritual of the new beginning that always starts next week, with new pens and a clean diary.", "Monday! Clean slate, diary out, new pens. I'm telling you — Monday. That's when it starts.", 4, "c", {pos:1, disc:-1, vol:1}]
  ]);

  V2.block(out, "Verbosity Traits", "Stylized & Elaborate", 250400, [
    ["One grand adjective per story", "Allows a single resplendent word into an otherwise plain account, once, then moves on.", "We ate at a tiny, plain, utterly resplendent café.", 1, "s", {form:1, vol:-1}],
    ["Turns a toast into a full speech", "Stretches a toast over three tangents and a digression on cheese.", "Friends, Romans, fellow guests of the lower table — a word, if I may, about cheese.", 4, "c", {vol:1, form:1}],
    ["Opens a request with 'I put it to you'", "Phrases the smallest request as a formal proposition before the assembled company.", "I put it to you, gentlemen, that the biscuits are finished — and that someone in this room knows how.", 3, "d", {form:1, ego:1}]
  ]);

  V2.block(out, "Verbosity Traits", "High-Volume & Wordy", 250420, [
    ["Talks only as long as the kettle takes", "Talks at length for exactly as long as the kettle needs and falls quiet at the click.", "...and that's the whole business with the van, anyway — (click) — tea.", 2, "s", {vol:1, pace:-1}],
    ["Long paragraphs on the phone, short bursts in person", "Is brisk face to face but speaks in long unbroken paragraphs once a phone is at their ear.", "(on the phone, three minutes in) ...and then, of course, there's the other thing, which is...", 2, "s", {vol:1}]
  ]);

  V2.block(out, "Verbosity Traits", "Repetitive & Circular", 250440, [
    ["Says the last three words again, softer", "Repeats the closing words of a statement a notch quieter, as if checking them.", "It'll be fine by morning — fine by morning.", 1, "s", {mood:-1, vol:-1}],
    ["Repeats the instruction, louder each time", "Gives the same order three times, with the volume climbing on each pass.", "Shoes off. Shoes off. SHOES. OFF.", 4, "c", {asrt:1, vol:1}]
  ]);

  V2.block(out, "Verbosity Traits", "Minimal & Ultra-Brief", 250460, [
    ["Answers with the last word of the question", "Hands back the final word of a question, softly, and means yes.", "(a nod) — Dinner.", 1, "s", {vol:-1, agr:1}],
    ["Grunts yes, grunts louder for no", "Gives the table a verdict in grunts, with extra volume for the negative.", "(a grunt) — (a louder, falling grunt) — (a short grunt, lower)", 4, "c", {vol:-1, asrt:1}],
    ["Replies to a long message with 'noted'", "Sends a single word back to a message of several paragraphs.", "(text) Noted.", 3, "u", {vol:-1, form:1}]
  ]);

  V2.block(out, "Verbosity Traits", "Pacing & Situation-Driven", 250480, [
    ["Leaves a one-second gap before the word that matters", "Pauses just before the key word of a sentence and then says it plainer than the rest.", "I'm — (one beat) — glad you came.", 2, "s", {emo:1, pace:-1}],
    ["Rattles at double speed when late", "Speeds into a running monologue on arrival, narrating every red light and bus change.", "Sorry-sorry-sorry, bus, then the other bus, the other bus was a different bus — I'm here, I'm here, where do I sit?", 4, "c", {pace:1, vol:1}]
  ]);

  V2.block(out, "Mannerisms", "Environmental Interaction Mannerisms", 250500, [
    ["Nudges a picture frame level in passing", "Adjusts a crooked frame with a single fingertip while walking by, without comment.", "(a fingertip nudge at the frame on the way past; nothing said)", 1, "s", {disc:1, vol:-1}],
    ["Opens every window on arrival", "Walks into a room, declares it stuffy and opens each window before sitting down.", "Stuffy! It's like a sock in here. (window one, window two) Better. Who shut these?", 4, "c", {act:1, asrt:1}],
    ["Plumps the cushions on someone else's sofa", "Rearranges the cushions in a host's living room mid-conversation and expects no objection.", "(plumping the third cushion, the second, the first) — You don't mind. It's better like this.", 3, "d", {asrt:1, man:-1}]
  ]);

  V2.block(out, "Mannerisms", "Tactile & Prop Handling", 250520, [
    ["Weighs the mug in their palm before each sip", "Lifts a cup a small distance up and down before drinking, as though checking the tea is still there.", "(a small up-and-down with the mug, then the sip)", 1, "s", {cur:1, vol:-1}],
    ["Clicks the pen through the whole meeting", "Keeps a ballpoint clicking in a steady beat through every pause, apologising and continuing.", "(click-click, click-click) — Sorry. Go on. Keep going, I'm listening.", 4, "c", {act:1, mood:-1}]
  ]);

  V2.block(out, "Mannerisms", "Vocal Modulation Mannerisms", 250540, [
    ["Lowers the last word of a kindness", "Delivers the final word of a kind sentence a little lower, almost to themselves.", "You did well today — (lower) properly well.", 2, "s", {warm:1, vol:-1}],
    ["Goes up an octave for babies and pets", "Rises into a sing-song a full octave higher for infants and animals.", "(sing-song) Who's a good boy? Who's a good boy? Who is?", 4, "c", {warm:1, vol:1}]
  ]);

  V2.block(out, "Mannerisms", "Emotional Affectations", 250560, [
    ["Says a falling 'oh' when something hurts", "Lets out a small 'oh' on a falling note at a hurtful remark and says nothing else.", "(small, falling) — Oh.", 1, "s", {emo:1, vol:-1}],
    ["Thanks someone by looking at their own hands", "Offers real thanks to the floor or their hands rather than the face of the person thanked.", "(to their hands) — That was kind. Genuinely.", 2, "s", {emo:1, ego:-1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_CELLS_A);
