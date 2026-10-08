/* v2 content: Persuasion & Influence and Feedback & Praise (new sections). IDS 230000-230999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_PERSUASION = (function(){
  const out = [];

  V2.block(out, "Persuasion & Influence", "Asks & Leverage", 230000, [
    ["Small ask first, big one later", "Opens with a favour so slight it would be rude to refuse, then lets the real request ride in behind it.", "Could you hold my coffee a second? (ten minutes later, same warm voice) While you're being so helpful: the Hendry account?", 2, "c", {asrt:1, hon:-1}],
    ["Guilt delivered with a smile", "Lets a refusal feel like a small betrayal by cheerfully listing what they gave up to be here.", "No, no, you go to your thing. I'll do the stalls on my own, I did the last four on my own, it's honestly fine. Go, go!", 3, "c", {hon:-1, man:1}],
    ["Flattery, then the ask", "Spends a paragraph on the other person's talents and ends on the sentence the compliments were built to carry.", "You're the only person here who can read a spreadsheet without flinching. Speaking of which, the Q3 one...", 3, "c", {warm:1, hon:-1}],
    ["Cites the rule, not the person", "Frames a request as what the policy demands, so the other person ends up arguing with a document.", "I'd love to say yes, I really would, but clause four is very clear about the car park.", 2, "c", {form:1, hon:-1}],
    ["Offers a swap in the same breath", "Attaches a small payment in kind to the request before the other person has time to hesitate.", "You do my Thursday, I'll do your bins for a month. Quick, shake on it, I've got a train.", 4, "u", {pace:1, asrt:1}],
    ["Calls in the favour, with the date", "Remembers precisely when they once helped and quotes the day back when it is time to be repaid.", "Ninth of March, your flat move. I carried the wardrobe up three floors. I'm asking you to drive forty minutes.", 4, "s", {asrt:1, agr:-1}],
    ["Quotes your own principle back", "Digs up a generous remark the other person once made and holds the present request up against it.", "You told me at the wedding that family comes first. Well. Here's the family, and here's Saturday.", 3, "u", {intel:1, asrt:1}],
    ["One quiet ask, never repeated", "Makes a request once, at low volume, and then trusts the other person's conscience to do the rest.", "(setting down the cup) It would mean a lot. That's all I wanted to say. (picks up the paper)", 1, "s", {mood:1, warm:1}],
    ["Names what a no will cost", "States in a pleasant tone exactly what refusal will set in motion, like someone reading the shipping forecast.", "If you can't cover Saturday, I'll have to close the kitchen at nine. Just so you know the shape of it.", 4, "d", {asrt:1, agr:-1}],
    ["Asks for the moon, settles for the garden", "Opens with a ridiculous demand so the real request can arrive looking like a concession.", "I'd need you for the whole month. (watching the face) Okay, okay, fair. Weekends, then? Look how reasonable I'm being!", 5, "c", {asrt:1, hon:-1}],
    ["Arrives with the pen already uncapped", "Turns up with the form open at the right page and the signature line flagged, so agreement is one flick away.", "(sliding it across, cap already off) Just there, and there. Initials at the bottom.", 1, "d", {disc:1, asrt:1}],
    ["Asks in front of witnesses", "Puts the request where an audience will make refusal awkward.", "(bright voice, to the whole lunch table) Priya's going to run the quiz this year, aren't you, Priya?", 4, "u", {asrt:1, man:-1}],
    ["Sighs until you volunteer", "Dwells on their problem aloud, at length and without asking for anything, until the other person offers the fix.", "I just don't know how the sofa's going up those stairs. (long look at the stairs) Three flights. Honestly.", 2, "d", {asrt:-1, hon:-1}],
    ["'It'll only take two minutes'", "Pegs every request at two minutes, five tops, and is never within an hour of being right.", "Two minutes, honestly, I'd do it myself. (it is a day and a half)", 2, "c", {hon:-1, pos:1}],
    ["Thank you, sent before the answer", "Closes the request with gratitude so the yes is treated as given, and is walking away before the reply can be considered.", "Can you cover Thursday? Thanks so much, you're a star! (turning the corner before the reply)", 5, "c", {asrt:1, man:1}],
  ]);

  V2.block(out, "Persuasion & Influence", "Timing & Pressure", 230100, [
    ["A deadline that appears from nowhere", "Produces a closing date at the very moment hesitation starts, and the date is never written down.", "Oh, the price goes up on Friday. (it does not; nobody checks)", 4, "c", {hon:-1, asrt:1}],
    ["'Everyone else is already in'", "Names absent third parties who have supposedly agreed, so holding out feels like being left behind.", "Marcus is in, the Okafors are in, honestly it's down to you and the one spare chair.", 3, "c", {hon:-1, agr:-1}],
    ["Waits until you're worn out", "Saves the proposal for the end of a long day, the last mile of the drive or the hour after a heavy meal.", "(11.40pm, softly) Before you go up. Shall we just settle the holiday thing?", 2, "d", {hon:-1, agr:-1}],
    ["The closing silence", "Finishes the pitch and then says nothing, letting a long quiet do the pushing.", "(hands folded, eyes on the other person, the wall clock suddenly audible)", 2, "s", {asrt:1, mood:1}],
    ["Won't name the price first", "Keeps turning the question back until the other side has to say a figure out loud.", "I'd rather hear what you think it's worth. No, you go. Really, I insist.", 2, "u", {intel:1, asrt:1}],
    ["Talks faster as you hesitate", "Gains speed and volume at every sign of doubt until agreeing is the quickest way out.", "It's not expensive and it's not complicated and you'd have it by Tuesday so shall I just --", 5, "c", {pace:1, vol:1, agr:-1}],
    ["The identical request, next week", "Repeats the same words at calm intervals until the request has the status of old news.", "Hello again. Still keen on the loft room, if you've thought it over?", 2, "u", {disc:1, asrt:1}],
    ["Pushes at the height of your good mood", "Times the ask for the minute after good news, when generosity is high and caution is low.", "(after the toast, a hand on a shoulder) Since we're all in such a good mood: the extension?", 2, "u", {pos:1, hon:-1}],
    ["Brings it at four fifty-five", "Turns up with the paperwork at the last possible minute, so the only options left are theirs.", "Sorry, sorry, last-minute, I need this signed by five. Sign here? Lovely.", 2, "c", {disc:-1, asrt:1}],
    ["Mentions the other interested party", "Lets slip that someone else has been asking about the same thing, with a name and a day for credibility.", "No, take your time. A couple from Harrogate came on Tuesday and said they'd ring back, that's all.", 3, "u", {hon:-1, asrt:1}],
    ["Slows right down at the figure", "Drops speed and volume at the crucial moment so the room has to lean in and wait.", "(half as fast as before) Seven. Hundred. And. Fifty.", 1, "s", {mood:1, asrt:1}],
    ["One more small condition, at the end", "Waits until every other point is agreed, then adds a last tiny term that nobody would now dare reject.", "Lovely, that's all settled. Oh, and the cat comes too. Just a little thing.", 4, "d", {hon:-1, man:-1}],
    ["Chooses the room and the hour", "Quietly fixes the venue, the time and the seating so the meeting happens on their terms.", "Let's do it at mine, nine sharp. I'll have the papers laid out.", 1, "d", {disc:1, asrt:1}],
    ["Treats sleeping on it as a no", "Allows a night to think but lets it be known what a night's thought usually means.", "(checking the time, kindly) Sleep on it if you like. I just know what sleeping on it usually turns into.", 2, "c", {asrt:1, agr:-1}],
    ["A decoy deadline, generously relaxed", "Names an early date, then magnanimously extends it to the one they wanted all along.", "I'd really need it by Monday. (days later) Oh, I'm not unreasonable. Friday, then, for you.", 2, "d", {hon:-1, intel:1}],
  ]);

  V2.block(out, "Persuasion & Influence", "Planting & Steering", 230200, [
    ["Makes it your idea", "Drops a few leading facts and steps back, so the other person arrives at the plan and takes credit for it.", "(a week later, glowing) I love that you thought of Lisbon. I'd never have come up with it.", 4, "d", {hon:-1, intel:1}],
    ["A question with only one door", "Frames the choice so both options lead the same way, 'which day' and never 'whether'.", "Shall we tell Mum at the weekend, or is it kinder after her birthday?", 2, "c", {asrt:1, hon:-1}],
    ["Asks for advice they already know how to use", "Requests an opinion on a problem laid out so carefully that only one answer comes back.", "What would you do if your sister wanted the house, hypothetically, and you'd paid for the new roof?", 2, "u", {intel:1, hon:-1}],
    ["Offers no objection and waits for it to fail", "Raises no objection, offers a mild 'sure, try it' and waits for the idea to fail on its own terms.", "No, go on, do it your way. I'll just keep the old files, in case.", 2, "d", {hon:-1, agr:-1}],
    ["The helpful 'just thinking aloud'", "Floats a plan as a passing thought, so that nobody can be said to have argued against it.", "Just thinking aloud, but wouldn't it be silly if the whole floor moved to Mondays? Ignore me.", 2, "c", {hon:-1, asrt:-1}],
    ["Plants a remark and walks off", "Mentions something once, in passing, and leaves before it can be argued with, returning later only to water it.", "(already halfway out) The Whitlock place has a spare room, by the way.", 1, "d", {intel:1, mood:1}],
    ["Restates your view, a few degrees off", "Paraphrases what the other person said so it leans toward their own plan, then gets a nod for the new version.", "So what I'm hearing is that you'd be perfectly fine with the quieter option?", 2, "u", {intel:1, hon:-1}],
    ["Briefs a friend before the meeting", "Sets up a neutral third party with a leading question so the proposal arrives from someone else's mouth.", "(glancing down the table) Ravi, what did you make of the old venue? ...See? Ravi agrees.", 4, "d", {intel:1, hon:-1}],
    ["Agrees loudly, then rewrites the terms", "Says 'absolutely' and restates the agreement in a version nobody voted on.", "Absolutely, we're all agreed. So, five of us on the new rota, starting with me not doing nights.", 5, "u", {hon:-1, asrt:1}],
    ["Lays out the losers' list", "Describes every alternative in loving detail and leaves their own favourite oddly unexamined.", "Option one has the stairs. Option two has the damp. And then there's Harbour Road, which, well.", 3, "c", {intel:1, hon:-1}],
    ["A cautionary tale about a cousin", "Illustrates the preferred decision with a story of someone who chose the other way and paid for it.", "My cousin did exactly that with the loft. Eleven thousand pounds and a wet floor.", 2, "c", {asrt:-1, intel:1}],
    ["Volunteers to write it up", "Offers to take the minutes, the summary and the follow-up email, which then record what they wanted.", "I'll type it up, leave it with me. (the email reads: 'as agreed, Dolores takes the budget')", 2, "u", {disc:1, hon:-1}],
    ["Agrees the worry is fair, then reroutes it", "Validates a concern entirely and walks it toward the conclusion that happens to suit them.", "No, you're right to worry. And worry like that is exactly why you want the one with the warranty.", 2, "d", {warm:1, hon:-1}],
    ["Asks the last question, idly", "Saves for the end the single tidy query whose answer settles the matter, put as if it had just occurred to them.", "(stirring their tea) Just so I've got it: nobody's got a problem with Tuesday, then?", 1, "s", {intel:1, mood:1}],
    ["Stage-manages the room", "Arranges the seating, the order of speakers and who sees the draft first, so the vote is decided before it begins.", "(placing name cards) Oh, Lena next to the window. She likes the light. And Gareth speaks last, if we can.", 5, "s", {intel:1, asrt:1, hon:-1}],
    ["Retells the meeting their way", "Recounts yesterday's discussion to a third person with the key decision nudged in their favour.", "(over dinner) And Alan, who was so keen on it, said, well. You know Alan.", 4, "u", {hon:-1, ego:1}],
  ]);

  V2.block(out, "Feedback & Praise", "Giving Criticism", 230300, [
    ["The sandwich nobody can taste", "Wraps one real criticism in so much praise at either end that the listener leaves delighted and unchanged.", "Love the energy, love the colours, the whole second half needs redoing, but honestly, love the font.", 2, "c", {warm:1, hon:-1}],
    ["Corrects in public, praises in private", "Pounces on the error in front of the whole team and is gracious about the same work over a quiet coffee.", "(at the meeting) That's the third time the figure's wrong. (later, at the kettle) Honestly, your layouts are the best we've got.", 4, "d", {man:-1, ego:1}],
    ["'Interesting' means no", "Uses 'interesting' as the full text of a rejection and assumes it was heard.", "That's an interesting choice. Okay. Thank you for bringing it in.", 2, "c", {hon:-1, man:1}],
    ["Brutal honesty as a hobby", "Volunteers the harshest true thing available and enjoys the effect on the room.", "You asked. The ending's rubbish, the middle's worse. Anyone want the rest of the wine?", 5, "c", {hon:1, man:-1, agr:-1}],
    ["The note delivered as a question", "Phrases every correction as puzzled curiosity, so the writer must discover the problem alone.", "Did you want the second paragraph to come before the first? Or did it just sort of land there?", 3, "c", {man:1, asrt:-1}],
    ["Counts the mistakes aloud", "Tallies the errors as they find them, giving a running score and a final total.", "That's one. Two, see the comma? Three. Seven in all, nothing major.", 4, "u", {intel:1, warm:-1}],
    ["Saves the note for the car park", "Sits on a critical thought through the whole event and delivers it as the door is closing.", "(hand on the car door) Oh, one thing about the speech. Anyway. Drive safe.", 2, "u", {asrt:-1, emo:-1}],
    ["Quietly redoes it and hands it back", "Takes the work, repairs the weak parts without a word, and returns it with a smile and a vague 'tiny tweaks'.", "(returning the report) Tiny tweaks, nothing to worry about. Mostly commas.", 2, "d", {disc:1, hon:-1}],
    ["Gives feedback as a feeling", "Offers notes only as sensations, never as faults: 'I got a bit lost', 'it dragged for me'.", "I just felt, I don't know, a bit adrift around the middle? That's only me, though.", 1, "u", {emo:1, asrt:-1}],
    ["Reads the offending line aloud", "Opens the draft to the page, puts a finger on the sentence and reads it out in full before saying what is wrong.", "Page nine, third line: 'it was, in a sense, a kind of rain.' What kind of rain?", 3, "u", {intel:1, hon:1}],
    ["Keeps the note until invited", "Holds a clear view of what's wrong and keeps it to themselves until invited, politely, more than once.", "(to the pause) If you want my thoughts, I have a few. No? Then it's lovely.", 1, "s", {asrt:-1, mood:1}],
    ["Rejects your idea by admiring another", "Never says no to the proposal, only wistfully praises somebody else's.", "I did love Ines's version. The simple one. Still, yours is also an option.", 2, "d", {hon:-1, agr:-1}],
    ["A fix attached to every fault", "Brings three solutions, usually numbered, to every problem named.", "Headline's too long. Try 'Rain Delays Fair'. Or 'Fair Rained Off'. Or I'll just rewrite it, shall I?", 4, "c", {intel:1, asrt:1}],
    ["Makes the correction a joke", "Packages each correction as a gag, so that objecting would mean losing one's sense of humour.", "Ah, the first act! A bold choice, like a soup with no bowl.", 4, "u", {asrt:1, warm:-1}],
    ["Apologises through the whole correction", "Wraps each comment in 'sorry, sorry, tiny thing' until the apology takes longer than the fix.", "I'm so sorry, this is awful of me, it's only a comma, I feel terrible, honestly, I'm so sorry.", 5, "c", {man:1, asrt:-1}],
  ]);

  V2.block(out, "Feedback & Praise", "Receiving Criticism", 230400, [
    ["Asks for honesty, punishes it", "Begs for the real opinion and then turns brittle and clipped the second it arrives.", "Tell me straight, I can take it. (hears it) Well. Great. Thanks for that. Really helpful.", 4, "d", {hon:-1, mood:-1}],
    ["Hears a note as a verdict on worth", "Treats a comment about paragraph four as a ruling on whether they should ever have been allowed to write.", "So it's bad. All of it. I should stop, shouldn't I?", 5, "c", {emo:1, ego:-1}],
    ["Thanks you, then rewrites everything", "Accepts a small note with gratitude and overhauls the entire piece overnight.", "That's so helpful, thank you! (next morning) I've started again from scratch.", 4, "u", {ego:-1, agr:1}],
    ["Fights the note, then quietly makes every change", "Argues the opening note hard, then two days on quietly makes every change, including the first.", "No, the opening works. (two days later) By the way, I've moved the opening.", 2, "c", {asrt:1, agr:-1}],
    ["Defends by listing the effort", "Answers feedback with the number of hours, drafts and late nights that went in.", "I did eleven drafts. At the kitchen table, at midnight. Eleven.", 4, "c", {ego:-1, emo:1}],
    ["Takes notes, shows nothing", "Writes down each comment with an even nod and gives no reaction at all.", "(pen moving, expression unchanged) Mm. Mm-hm. Noted.", 2, "u", {mood:1, emo:-1}],
    ["Agrees before the sentence ends", "Says 'yes, totally, you're right' somewhere in the middle of the criticism.", "Yes — yes — totally, you're right, I know, no, absolutely —", 4, "c", {agr:1, hon:-1}],
    ["Wants it in writing", "Asks for the criticism by email so it can be read alone, several times, before any answer.", "Could you send me that? Just the notes. I'd like to read them properly.", 1, "s", {intel:1, mood:1}],
    ["Beats you to the insult", "Describes their own work in harsher terms than any critic would, leaving nothing to be said.", "Oh, it's dreadful, I know. I could've written it with my feet.", 2, "c", {ego:-1, pos:1}],
    ["Counts who else disagrees", "Answers a note by asking who else thought so, as if it needs a minimum number of people to be real.", "Who else thought the ending was weak? Just you? Right, just you, then.", 3, "u", {ego:1, agr:-1}],
    ["Cheerful on the day, cool all week", "Receives feedback with a bright 'totally fair' and then keeps their distance from the critic for days.", "No, totally fair! (for the next five days, replies to everything with 'ok')", 2, "d", {mood:-1, emo:-1}],
    ["Explains the intention behind it", "Meets each note with the intention behind it, as though the intention were the work.", "Right, but what I was going for there was a kind of stillness.", 3, "c", {ego:1, intel:1}],
    ["Asks for the worst bit first", "Leans in at the prospect of criticism, notebook out, and wants the harshest note before anything kind.", "Go on, hit me. What's the worst bit? Start with that.", 5, "d", {ego:1, cur:1, hon:1}],
    ["Cites the one exception", "Meets a general rule with the single case where it fails, as if one counterexample were an acquittal.", "Well, Hemingway hardly used a semicolon, and he did all right.", 3, "u", {intel:1, agr:-1}],
    ["Sleeps on it, then answers well", "Says little in the room and returns next morning with a calm, specific, generous reply.", "(next morning, by message) You were right about page three. Here's what I changed, and why.", 1, "d", {mood:1, emo:1}],
  ]);

  V2.block(out, "Feedback & Praise", "Praise & Congratulation", 230500, [
    ["Praises the effort, never the work", "Says 'you must have worked so hard' about everything and never mentions the thing itself.", "Look at all the hours in this! Honestly, I can see how hard you tried.", 2, "c", {hon:-1, man:1}],
    ["Congratulations with the score attached", "Offers warm congratulations and slips in their own result in the same breath.", "Brilliant, well done! I got a distinction last year, so I know the feeling.", 3, "u", {ego:1, hon:-1}],
    ["Over-praises to be liked", "Hands out 'amazing' and 'genius' so freely that nobody can tell which thing was actually meant.", "That's AMAZING. That's the best email I've ever read. I'm framing it.", 5, "c", {warm:1, hon:-1, vol:1}],
    ["Praise that is really a request", "Compliments the behaviour they want repeated, so that being thanked amounts to being told what to do.", "I do love that you're always the one who stays to lock up.", 2, "u", {hon:-1, man:1}],
    ["Silence as the highest compliment", "Praises by saying nothing and asking for more, and expects everyone to understand the quiet.", "(reads it through twice, closes the folder) Send me the next one.", 2, "s", {emo:-1, mood:1}],
    ["Holds your work up to the room", "Stops a whole gathering to narrate the merits of someone's work at length.", "Everyone, stop. Look at this spreadsheet. LOOK at it. Do you see the colour coding?", 5, "c", {vol:1, warm:1, emo:1}],
    ["Picks out one exact detail", "Singles out a particular choice, a key change in the third verse or a hinge on the gate, and means every word.", "The bit where the bass drops out for two bars. That bit. I had to put my cup down.", 2, "d", {intel:1, warm:1, hon:1}],
    ["'Not bad' is the top mark", "Reserves 'not bad' for excellent work and is baffled when it sounds like a shrug.", "Not bad. (pause) Not bad at all.", 2, "d", {emo:-1, mood:1}],
    ["Leaves it on a sticky note", "Delivers praise in short written notes left where it will be found, never aloud.", "(a note on the monitor: 'Tuesday's call. Well handled. R.')", 1, "d", {emo:-1, warm:1}],
    ["Backhanded congratulations", "Congratulates in a way that quietly lowers the achievement, 'surprised, in a good way'.", "Well done! Honestly, I never thought you'd pull it off.", 4, "c", {warm:-1, man:-1}],
    ["Praise that arrives a week late", "Notices good work long after anyone is listening and mentions it, apologetic, at an odd moment.", "I never said. That thing you did with the Hartley file. Last Tuesday. It was good.", 1, "u", {disc:-1, warm:1}],
    ["Tears up at someone else's news", "Gets visibly moved by another person's win, wet-eyed and insisting it is nothing.", "(sniffing, waving a hand) It's the hay fever. I'm just so proud of you.", 4, "d", {emo:1, warm:1}],
    ["Claims a share of the win", "Congratulates and credits their own earlier tip in the same sentence.", "I told you the green one would work! See? You should listen to me more often.", 4, "c", {ego:1, warm:-1}],
    ["Turns every small win into a toast", "Seizes any good news as an excuse for glasses, a short speech and a round of applause.", "Right! Glasses up. Dev passed his driving test, on the fourth go, and I'm told the fourth is the best one!", 4, "u", {vol:1, warm:1, act:1}],
    ["Praises you to someone senior, in earshot", "Mentions another person's good work to the one who matters, in passing, with that person standing close enough to hear.", "(to the director, over coffee) Priya's the reason the Leeds launch didn't fall over. Anyway, the rota.", 2, "d", {warm:1, asrt:1}],
  ]);

  V2.block(out, "Feedback & Praise", "Taking a Compliment", 230600, [
    ["Deflects with a joke", "Answers 'that was great' with a gag at their own expense before the sentence has finished landing.", "Great talk! -- Yes, I was as shocked as anyone.", 3, "c", {ego:-1, pos:1}],
    ["Returns it at once", "Fires a compliment straight back, matched in size, so that nothing is left outstanding.", "Thank you. No, YOU were wonderful, honestly the best thing in the whole evening.", 3, "c", {man:1, agr:1}],
    ["Lists the flaws", "Meets praise with the three places where it went wrong.", "Thanks, but did you hear the second chorus? I was flat for most of it.", 4, "c", {ego:-1, hon:1}],
    ["Goes quiet and pleased", "Stops talking and lets a small private warmth do all the answering.", "(a long breath out) Oh. Well. Thank you.", 1, "s", {emo:1, mood:1}],
    ["Suspects a favour is coming", "Hears a compliment and starts hunting for the favour attached.", "That's very kind. What do you need?", 2, "u", {pos:-1, mood:-1}],
    ["Says thank you and stops", "Accepts praise with two plain words and a pause, with no disclaimer and no return.", "Thank you. (beat; nothing more)", 1, "u", {ego:1, mood:1}],
    ["Looks round for the real recipient", "Looks around for the person the praise must really be addressed to.", "(turning to check behind them) Me? Are you saying me?", 4, "d", {ego:-1, emo:1}],
    ["Credits luck", "Puts a success down to timing, the weather or other people.", "Oh, the oven's just good. Anyone would have got that.", 2, "c", {ego:-1}],
    ["Wants to hear it again", "Takes a compliment so happily that they ask for a second helping.", "Did you say 'best in the building'? Say that bit again, slowly.", 4, "d", {ego:1, pos:1, warm:1}],
    ["Repeats it round the room", "Passes the praise on as news within the hour.", "Guess what Hannah said about the report. No, listen, she used the word 'immaculate'.", 4, "u", {vol:1, emo:1}],
    ["Asks which bit was good", "Answers a general compliment by asking for the specific part that worked, so it can be repeated.", "Thank you. Which bit, though? The opening, or the figures? Only I'd like to know what to keep.", 3, "u", {cur:1, intel:1}],
    ["Keeps a folded note of the good ones", "Carries the best praise they have received, written down, and admits to rereading it.", "(on a bad day, unfolding a sheet) Dee said 'unflappable' about me in April. I keep it here.", 2, "s", {ego:-1, emo:1}],
    ["Turns it into 'we'", "Redirects personal praise to the group at once.", "That's lovely, but it was all of us. The whole team, honestly.", 2, "c", {agr:1, warm:1}],
    ["Thanks you far too much", "Is so effusive that the person giving the compliment ends up reassuring them.", "Oh my GOSH, thank you, you have no idea, I'm going to remember that all week!", 5, "c", {emo:1, vol:1}],
    ["Changes the subject smoothly", "Receives the words smoothly, then asks about something else entirely.", "Kind of you. Right, did the plumber ever come?", 2, "c", {man:1, mood:1}],
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_PERSUASION);
