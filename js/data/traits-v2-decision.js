/* v2 content: Decision Style, Boundaries & Refusals, Emotion Display Rules (new sections). IDS 231000-231999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_DECISION = (function(){
  const out = [];
  // V2.block(out, "<Section>", "<Category>", 231000, [ [trait, desc, example, intensity, "c|u|d|s", {pol}], … ]);

  // ---------------------------------------------------------------- Decision Style
  V2.block(out, "Decision Style", "Slow & Consultative", 231000, [
    ["Asks everyone, then does the first idea", "Polls the office, the neighbours and a cousin abroad, then quietly returns to the option they began with.", "(hangs up the sixth call) — Very helpful, all of you. I'll go with the blue one.", 3, "d", {pace:-1, agr:1}],
    ["A pros and cons list, then ignored", "Rules a neat two-column page, studies it with care, and picks whatever is in the shorter column.", "Eleven reasons against, four for. Lovely list. Book it.", 3, "u", {pace:-1, intel:1}],
    ["One more week", "At every deadline asks for a little longer, and means the request sincerely each time.", "Could we say the end of next week? I want to sit with it properly.", 2, "c", {pace:-1, asrt:-1}],
    ["Sleeps on it, announces at breakfast", "Says nothing at night, then delivers the verdict over the toast as if it had come by post.", "(buttering toast, not looking up) — It's the house in Ledbury. Don't ask me why; it's decided.", 3, "d", {pace:-1, mood:1}],
    ["Wants three years of figures first", "Will not give an opinion before the numbers arrive, and treats an email with a spreadsheet as the start of the conversation.", "Before I say anything, could someone send me the figures for the last three years?", 2, "c", {intel:1, disc:1}],
    ["Seeks out the voice that will object", "Goes looking for the one person likely to disagree and hears them out to the end before moving.", "Go on, Marguerite, tell me what's wrong with it. I'll put the kettle on.", 2, "s", {intel:1, cur:1, agr:1}],
    ["Narrows the field out loud", "Cuts options aloud in rounds, like a talent show, and enjoys the suspense more than anyone.", "That's the beige out. The green's out. I'm down to two and I'm not telling you which.", 3, "u", {pace:-1, vol:1}],
    ["Treats each choice as a trial", "Frames every decision as provisional, with a review date entered in the diary beforehand.", "We'll do it for six weeks and revisit. I've put the revisit in the calendar.", 2, "u", {disc:1, intel:1}],
    ["Fourteen tabs open on kettles", "Gives an evening of forum threads and comparison charts to a purchase that costs under fifteen pounds.", "Sorry, I've got fourteen tabs open on kettles. Give me till nine.", 4, "c", {pace:-1, intel:1}],
    ["Returns with an appendix", "Comes back days later with a written case nobody commissioned, complete with a section for risks.", "I've written up where I've landed. There's an appendix, and the appendix has a footnote.", 4, "d", {disc:1, form:1}],
    ["Ninety per cent there", "Reports the choice as nearly made for weeks, because the last stretch is the one that matters.", "I'm ninety per cent there. The last ten per cent is the hard ten per cent.", 1, "c", {pace:-1}],
    ["Asks the same question three ways", "Re-words a question to test whether the answer keeps its shape under pressure.", "So if the roof goes, sorry, when the roof goes, what's the worst case? And the worst-worst?", 3, "u", {intel:1, cur:1}],
    ["Lets the silence do the weighing", "Goes quite still while thinking, hands loosely together, and the room learns to wait.", "(a full half-minute; the tea goes cold) — Mm. No. Not yet.", 1, "s", {pace:-1, mood:1, ego:1}],
    ["Keeps a decision diary", "Notes why each big choice was made, so that a later self cannot rewrite the history.", "Page forty. Look: 'March, chose Lisbon because of the light.' I was sure then.", 2, "s", {disc:1, hon:1, intel:1}],
    ["Scores it out of ten, with a gut column", "Builds a weighted matrix across seven criteria, then adds a final column labelled for instinct.", "Gut gets double weighting. Don't laugh, it's a method.", 3, "d", {intel:1, disc:1}],
  ]);

  V2.block(out, "Decision Style", "Fast & Gut", 231100, [
    ["Decides in the corridor, ratifies in the meeting", "Settles the matter on the walk to the room, then chairs a discussion whose outcome is already fixed.", "Good, you've all had your say. We're going with what I told Priya by the lifts.", 4, "d", {asrt:1, pace:1, man:-1}],
    ["Chooses before the options finish", "Cuts across the waiter or the salesman at the second item and settles on the first.", "(over the waiter's second special) — The first one. Done.", 5, "c", {pace:1, man:-1}],
    ["Announces it as a fact", "Delivers a major choice in the tone of a weather report, with no prior discussion to point to.", "We're moving to Leeds. Anyway, who wants tea?", 5, "d", {asrt:1, ego:1}],
    ["Reverses at speed, no apology", "Flips the plan between lunch and tea and expects everyone to be keeping up.", "Forget what I said at ten. It's the opposite now. Keep up.", 5, "u", {pace:1, ego:1, man:-1}],
    ["Trusts the first flinch", "Reads an instant wince or lift in their own chest at an option and treats it as the verdict.", "My stomach dropped when you said Tuesday. So, not Tuesday.", 2, "u", {pace:1, emo:1}],
    ["Says yes before the salary is read out", "Accepts the offer while the recruiter is still working up to the number.", "Yes. Sorry, carry on, I just wanted you to hear the yes before the number.", 4, "d", {pace:1, pos:1}],
    ["Forty's fine, go", "Takes the nearest convenient figure and treats precision as a form of delay.", "It's about forty. Forty's fine. Go.", 2, "c", {pace:1, disc:-1}],
    ["Takes the first quote and hangs up", "Accepts the opening price before the other side has the chance to improve on it.", "That's fine, that's fine, send the invoice. Right, bye.", 3, "u", {pace:1, disc:-1}],
    ["Bristles at 'Are you sure?'", "Takes a second look at the choice as an insult to the first and answers with heat.", "I'm sure. I was sure when I said it. Why does everybody keep asking?", 3, "c", {ego:1, mood:-1}],
    ["One hand already on the door", "Gives the answer on the way out of the room, coat half on, and expects the details by text.", "(already in the doorway) — Left-hand option. Message me how it goes.", 2, "s", {pace:1, act:1}],
    ["Reasons arrive after the choice", "Chooses first, then builds the case afterwards in neat bullets as if it had come before.", "Obviously the reasons are cost, timing and, give me a second, morale.", 3, "u", {hon:-1, pace:1}],
    ["Flips the coin and reads their own face", "Hands the choice to a coin and takes the answer from the flicker of disappointment as it lands.", "(coin in the air, caught, looked at) — Heads. Alps. Best of three.", 2, "d", {pace:1, emo:1}],
    ["Certain at two in the morning, acting at five past", "A midnight conviction is sent off as a message while the moment still feels true.", "(texting in the dark) — Cancelled the lease. Going back to sleep.", 5, "d", {pace:1, disc:-1, rebel:1}],
    ["Done, used as a gavel", "Treats the word as a closing bang and refuses every later question as already settled.", "Done. Next item. No, we are not reopening done.", 5, "c", {asrt:1, man:-1}],
  ]);

  V2.block(out, "Decision Style", "Deferred & Avoided", 231200, [
    ["Waits for someone else to order", "Holds the menu open and untouched until another person has gone first, then agrees with relief.", "You go first. No, honestly, you. I haven't even looked.", 3, "c", {asrt:-1, agr:1}],
    ["Same as you", "Closes the menu and takes whatever another person asked for.", "Same as you, please.", 1, "c", {asrt:-1, ego:-1}],
    ["Lets the deadline decide", "Lets the clock expire on the form and takes the lapse as the answer.", "It's 4.59. Well. Window's closed, isn't it. That's that.", 4, "d", {disc:-1, asrt:-1}],
    ["Hands the choice over as a question", "Phrases a wish as a polite enquiry so the other person is the one to say it aloud.", "Do you think we might want to cancel the caterer? Just wondering.", 3, "u", {asrt:-1, hon:-1}],
    ["Chooses by not choosing", "Never says no and never says yes, then treats the way things fell as the outcome.", "I never said no. I just never said yes. These things sort themselves out.", 3, "d", {asrt:-1, hon:-1}],
    ["Lists every place they could eat", "Answers 'where shall we go?' with a spread of options, ranked by nothing.", "There's the Thai, or the Thai's neighbour, or the pub, or we could just see.", 2, "c", {asrt:-1, agr:1}],
    ["Asks the waiter to pick", "Passes the menu back to the staff and asks what they would have.", "What do you like? No, what would you have? Right. That.", 3, "u", {asrt:-1, cur:1}],
    ["The last name on the unanswered poll", "Leaves the group vote untouched until it closes and claims not to have seen it.", "Oh, was that a poll? I didn't see it. Whichever got the most, I'm sure.", 2, "d", {asrt:-1, hon:-1}],
    ["Needs a second signature", "Holds a pen over the page until a colleague has signed first.", "Has Dennis signed? Then I will. Right underneath him.", 1, "u", {asrt:-1, disc:1}],
    ["Let's see how we feel on the day", "Meets any question about plans with a promise to leave it open, however booked it is.", "Let's see how we feel on the day. Yes, I know the flights are non-refundable.", 3, "c", {asrt:-1, pace:-1}],
    ["Hangs it on the traffic lights", "Sets a small arbitrary test, such as a bus number or a green light, and obeys the result.", "If the lights are green by the bridge, I'll tell him.", 3, "d", {asrt:-1, disc:-1}],
    ["Needs the absent relative's say", "Pleads that a distant family member must be consulted before anything can be settled.", "I couldn't possibly decide without Dad, and Dad's in Portugal till March.", 3, "u", {asrt:-1, agr:1}],
    ["Relieved when it is taken away", "Breathes out when circumstance closes the door, and feels the choice was never theirs.", "(a long exhale) — Oh, they've shut the shop. Well, that's decided, then.", 2, "s", {asrt:-1, emo:1}],
    ["Thanks the decider like a gift-giver", "Receives another person's choice with gratitude, as though they had been handed a present.", "Oh, that's perfect. Thank you so much for deciding.", 1, "s", {agr:1, asrt:-1}],
    ["Shuts down at four paint samples", "Past three options the mind goes blank and the shop becomes a place to leave.", "(in front of the paint wall) — I'm not doing this. You do it. I'll be in the car.", 5, "c", {asrt:-1, mood:-1}],
  ]);

  V2.block(out, "Decision Style", "Deciding for Others", 231300, [
    ["Orders for the whole table", "Reads the menu once, then announces the dishes, the wine and what everyone else will have.", "We'll have the sharing platter and the red, and Dad will have the fish. Dad likes the fish.", 5, "c", {asrt:1, man:-1}],
    ["Consults, then overrules", "Collects opinions with real interest and then goes the way they had always intended.", "Thanks, all very useful. We're doing it my way.", 4, "d", {asrt:1, hon:-1}],
    ["Chooses the restaurant and calls it democracy", "Counts the absence of objections as a vote and a unanimous one.", "We voted. Well, I suggested and nobody shouted. That's a vote.", 4, "d", {asrt:1, hon:-1}],
    ["Phones round before the vote", "Quietly secures the key relatives by telephone, so the family meeting only confirms it.", "(to the group chat, lightly) — Just so you know, I've asked Aunt Bev and Bev is in, so we're sorted.", 2, "s", {asrt:1, hon:-1}],
    ["Answers for the partner", "Speaks on behalf of the person next to them, in the plural, while that person is mid-mouthful.", "We're not really holiday people. (the partner looks up from the chips)", 3, "c", {asrt:1, man:-1}],
    ["Fills in the form for a grown-up", "Puts another adult down for a session or a lift and assumes the thanks will follow.", "I've put you down for the Friday session. You won't mind. You never do.", 3, "u", {asrt:1, warm:1}],
    ["Books the surprise", "Plans a weekend away in secret, pays for it, and treats refusal as ingratitude.", "It's a surprise weekend! Pack for walking. No, you can't say no, it's paid for.", 5, "d", {asrt:1, warm:1}],
    ["Takes the hard choice off the grieving", "Quietly makes the practical decisions a bereaved person would rather not face, unasked.", "I've told the florist white. You don't need to think about flowers this week.", 2, "d", {warm:1, asrt:1}],
    ["Frames the options so one wins", "Describes the favoured option warmly and the others with a faint sniff.", "We could go to the lovely place by the sea, or sit in a car park for four hours. Thoughts?", 3, "u", {asrt:1, hon:-1, intel:1}],
    ["Takes the pen", "Is already writing the list by the time anyone suggests who should do it.", "(already writing) — Let me do it. It'll be quicker.", 1, "c", {asrt:1, pace:1}],
    ["Says what the group 'really' wants", "Announces the true wishes of everyone present, with confidence and no polling.", "Nobody really wants the long route. They're just being polite.", 3, "u", {asrt:1, hon:-1}],
    ["Hands over the choice with a veto attached", "Lets the other person choose within a range that carries the answer in it.", "You pick the paint. Anything you like. Well, not that.", 3, "u", {asrt:1, man:-1}],
    ["Votes for the absent", "Casts ballots on behalf of whoever is not in the room, as a service to the process.", "Dad's a no, I can tell you now, and Carol would say yes, so that's tied and I'm casting.", 4, "d", {asrt:1, ego:1}],
    ["Counts the hands slowly", "Tallies a show of hands aloud to a total they had in mind, passing over the half-raised ones.", "(counting) — Six, seven, and the rest abstain. Carried. (three hands still half up)", 3, "d", {asrt:1, hon:-1}],
  ]);

  // ---------------------------------------------------------------- Boundaries & Refusals
  V2.block(out, "Boundaries & Refusals", "Saying No", 231400, [
    ["Says no by describing their schedule", "Recites the day's appointments one by one until the request has quietly died in the list.", "Oh, Thursday, Thursday's the dentist, then a thing, then the dog.", 3, "c", {asrt:-1, hon:-1, man:1}],
    ["No, but only in writing", "Will not refuse to anyone's face but sends a courteous, final email near midnight.", "I'll send you an email about that. (the email arrives at 2 a.m., polite and final)", 3, "d", {asrt:-1, form:1, disc:1}],
    ["Never says the word", "Offers praise, regard and an open mind in place of a refusal, and expects the hint to land.", "What a lovely thought. I'll bear it in mind. Yes. Let's see.", 3, "c", {asrt:-1, man:1, hon:-1}],
    ["A smile and an exact timetable", "Meets the request with real warmth and then gives a slot so narrow that it is a refusal.", "(warm smile) — I can do 4.10 to 4.25 on the third of November. Not before.", 4, "d", {warm:1, asrt:1, disc:1}],
    ["The flat one-word no", "Refuses with a single syllable and lets the silence afterwards finish the sentence.", "(looks up once) — No. (back to the work)", 5, "c", {asrt:1, man:-1, vol:-1}],
    ["I'm going to pass", "Declines in a level, friendly tone without apology, excuse or the offer of a reason.", "I'm going to pass on that, but thanks for thinking of me.", 1, "c", {asrt:1, man:1}],
    ["Refuses by being unreachable", "Lets a third call go to voicemail and leaves a reply unread so long that it becomes the answer.", "(phone face-down; it buzzes itself across the table; no hand moves)", 2, "u", {asrt:-1, hon:-1}],
    ["Says no through an absent boss", "Blames a manager, a committee or a policy that would never allow it, however imaginary.", "I'd love to, but my boss would never allow it.", 3, "u", {asrt:-1, hon:-1}],
    ["No, before the question is asked", "Refuses at the first sight of someone approaching with that look.", "If it's about the car, no. No, I haven't heard the question, and no.", 5, "u", {asrt:1, man:-1}],
    ["Replies late enough to be an answer", "Waits until the date has passed before answering, then regrets it warmly.", "Oh, you were asking about June? Sorry, that's gone.", 1, "s", {asrt:-1, disc:-1}],
    ["Turns down the party, offers the coffee", "Refuses the big event and proposes a smaller, safer meeting of their own design.", "Can't do the party, but coffee, just us, Tuesday?", 2, "u", {warm:1, asrt:1, man:1}],
    ["A no with a closing line", "Refuses with theatrical finality and a farewell that shuts the door behind it.", "No. And I'd thank you not to ask again. Good morning.", 5, "c", {asrt:1, man:-1, form:1}],
    ["Laughs, and the laugh is the no", "Gives a short laugh, a shake of the head and a return to the screen.", "(a short laugh, a head shake, back to the screen) — Ha. No.", 2, "d", {asrt:1, man:-1}],
    ["'I'd rather not' and nothing after", "Says it once, quietly, and does not follow it with a reason or an apology.", "I'd rather not.", 1, "s", {asrt:1, vol:-1}],
    ["Not taking anything on at the moment", "Meets every proposal with a standing policy of being full, which has applied for years.", "We're not taking anything on at the moment. (it has been the moment since 2019)", 2, "c", {form:1, hon:-1}],
  ]);

  V2.block(out, "Boundaries & Refusals", "Defending a No", 231500, [
    ["Repeats the same sentence", "Keeps one refusal on a loop, steady as a metronome, and lets the other person tire first.", "I can't do that. I can't do that. I understand, and I can't do that.", 4, "c", {asrt:1, disc:1}],
    ["Apologises and holds", "Wraps a refusal in repeated sorrow that never loosens the grip.", "I'm so sorry. It's still no. I'm so sorry.", 3, "d", {asrt:1, man:1, warm:1}],
    ["Explains too much and loses it", "Piles up reasons until each one gives the asker something to bargain with.", "It's not that I mind, it's that Tuesday, and the car, and Gran, so maybe, if you really...", 3, "c", {asrt:-1, vol:1}],
    ["Turns the no into a policy", "Moves the refusal out of the personal and into a rule that nobody can argue with.", "I don't lend, as a rule. It isn't personal. It's the rule.", 3, "u", {form:1, disc:1, warm:-1}],
    ["Cold silence after a refusal", "Delivers the no, takes up the newspaper, and lets the chill settle for days.", "(says no, picks up the paper; nobody speaks until Friday)", 5, "d", {warm:-1, mood:-1}],
    ["Gives the reason once, then closes the file", "Offers a single explanation and treats every further question as already answered.", "I told you why. It's in the thing I said before.", 1, "u", {asrt:1, disc:1}],
    ["Closing it with 'we've discussed this'", "Points to an earlier talk as proof that the matter is closed, however vague the memory.", "We've discussed this. We discussed this in March. The answer is in the minutes.", 3, "c", {asrt:1, form:1}],
    ["Calls in a witness", "Fetches another person to confirm the refusal, because their own word has not held.", "Ask Gareth. Gareth, tell him I said no last week.", 2, "u", {asrt:-1}],
    ["Louder, not clearer", "Raises the volume instead of the argument and describes this as courtesy.", "I SAID no, and I am saying it LOUDER, as a courtesy.", 5, "c", {asrt:1, man:-1, mood:-1}],
    ["Lets the pause defend it", "Folds their hands and waits, saying nothing more until the asker talks themselves out of it.", "(hands folded; the other person talks themselves out of the ask)", 1, "s", {asrt:1, mood:1}],
    ["One small concession, then a freeze", "Gives a measured yield at the edge of the refusal and declares the matter over.", "Fine, I'll do the half hour. That is the whole offer. There is no second half hour.", 3, "u", {asrt:1}],
    ["Cites the precedent", "Justifies a refusal by pointing to the last person they refused, as if consistency were the argument.", "I said no to the Hendersons. I can't say yes to you.", 2, "d", {disc:1, form:1}],
    ["Shaky voice, steady no", "Visibly rattled by the confrontation and still not moving an inch.", "(voice unsteady) — I'm... no. No, I'm still saying no. Give me a minute.", 2, "d", {asrt:1, emo:1, mood:-1}],
    ["Rewrites the refusal as advice", "Recasts a selfish no as a rescue, performed entirely for the other person's benefit.", "Honestly, I'm doing you a favour. You'd regret it. I'm saving you.", 3, "u", {asrt:1, hon:-1}],
  ]);

  V2.block(out, "Boundaries & Refusals", "Asking & Offering Help", 231600, [
    ["Rehearses the ask until it sounds like a remark", "Practises the request in the lift so that it comes out as an aside while locking the bike.", "Oh, by the way, you wouldn't happen to know anyone with a van, would you?", 3, "d", {asrt:-1, ego:1}],
    ["Asks a stranger instead of a friend", "Takes a favour to someone they will never meet again rather than owe someone they love.", "I'd rather owe the man at the garage than owe you.", 3, "d", {asrt:-1, emo:-1}],
    ["Offers help in a voice that declines it", "Extends an offer so grudgingly that accepting it would be rude.", "Well, I suppose I could help you move, if you've really got no one else.", 4, "c", {warm:-1, man:-1}],
    ["Asks for the tiny version of the favour", "Requests a fragment of what is needed, hoping the larger part will quietly follow.", "Could you give me a lift to the corner? Just the corner. (the corner is the airport)", 2, "d", {asrt:-1, hon:-1}],
    ["Asks in the third person", "Voices the request to no one in particular, as a general observation about the room.", "One does wonder whether somebody might be able to lift the other end.", 3, "d", {asrt:-1, form:1}],
    ["'I've got it' as a wall", "Meets any offer to share a load with a flat refusal, while visibly struggling.", "I've got it. (five bags and a cake, one arm trembling)", 4, "c", {ego:1, emo:-1}],
    ["Repays before the favour is finished", "Settles the debt on the spot so that nothing is left owing.", "Right, that's the lift. I've put twenty in your coat. That's us square.", 3, "u", {ego:1, emo:-1}],
    ["Helps by simply doing it", "Fixes the loose shelf or clears the gutter when the owner is out, then declines thanks.", "(key in the door, tool bag in hand) — Don't thank me. It was wobbling.", 2, "u", {warm:1, asrt:1}],
    ["Shout if you need anything", "Leaves a generous open offer that nobody can use, since it names no task and no hour.", "Shout if you need anything, anything at all, no pressure!", 1, "c", {warm:1, asrt:-1}],
    ["Asks only at the worst hour", "Stays silent through months of trouble and then calls at three in the morning in a level voice.", "(3 a.m., voice level) — I'm at the hospital. Can you collect the dog?", 2, "s", {emo:-1, asrt:-1}],
    ["Frames the ask as doing you a favour", "Presents the request as a treat for the helper, rich in character-building opportunities.", "I thought you'd enjoy helping, actually. People do. Mortar's quite therapeutic.", 3, "u", {asrt:1, hon:-1, ego:1}],
    ["Apologises for the ask in advance", "Surrounds a small request with so much sorry that it takes longer than the task.", "Sorry, sorry, this is awful of me, you're busy, ignore me. Could you possibly pass the salt?", 5, "c", {asrt:-1, man:1, vol:1}],
    ["Counts out the favours", "Keeps an exact tally of lifts, loans and lunches and recites it when the ledger tips.", "That's the third time I've driven you. I'm not counting. It's three.", 3, "u", {warm:-1, disc:1}],
    ["Refuses help, then watches it not come", "Declines the offer twice and looks stung when the offerer sits back down.", "No, no, don't trouble yourself. (watches them sit) Right.", 3, "d", {hon:-1, asrt:-1}],
    ["Help offered with an exit time", "Gives real labour for a stated window and then stops, mid-lift if need be.", "I'll help till half past, and at half past I'm leaving, with or without the sofa.", 2, "u", {disc:1, asrt:1}],
  ]);

  V2.block(out, "Boundaries & Refusals", "Limits That Leak", 231700, [
    ["Cannot refuse anyone who is ill", "Any cough or temperature dissolves the refusal, the schedule and the evening's plans.", "Course I'll do your shift. No, you've got a temperature, go to bed. Go.", 3, "d", {warm:1, agr:1, asrt:-1}],
    ["Gives way on the third request", "Holds out against two asks and folds at the third, as if it were a rule of the house.", "Third time you've asked, and I've only got two nos in me. Hand it over.", 3, "c", {agr:1, asrt:-1}],
    ["Says yes, cancels later", "Agrees in the moment with warmth, then sends a polite retreat from the sofa at 6.40.", "So sorry, migraine, can't make tonight, rain check! (the third migraine this month)", 3, "c", {hon:-1, agr:1, asrt:-1}],
    ["A boundary announced loudly, enforced once", "Proclaims a new rule with force and a date, and keeps it until the first test.", "From now on my phone is OFF after seven! (Friday, 8.45, second ring) Hello, Dave.", 4, "d", {ego:1, disc:-1}],
    ["A rule with a gap for everyone they like", "States a limit in general terms and then lists the people who have somehow always been exempt.", "I don't do favours for people I've only just met. Though you're not really just met, are you?", 2, "u", {disc:-1, agr:1}],
    ["Resents the yes afterwards", "Does the favour with a clatter, and describes the mood as cheerful.", "(stacking chairs very loudly) — No, no, I'm happy to. Happy. Look at me, happy.", 4, "c", {hon:-1, mood:-1}],
    ["Firm with the council, soft with the cousin", "Turns away every stranger and then lends the spare room to a relative for half a year.", "Told the charity lady no. Mum, did you want the spare room for six months? Say six.", 3, "u", {asrt:1, agr:1}],
    ["Gives up the lunch hour a minute at a time", "Starts with a quick look at a colleague's problem and finds the afternoon gone.", "Just one quick look. (it's 2.40; lunch ended at 1.30)", 2, "s", {disc:-1, agr:1}],
    ["It's no trouble, in the middle of trouble", "Insists a favour costs nothing with the kettle boiling over and a toddler on the hip.", "It's no trouble! (the kettle shrieks; the toddler pulls at the phone cord)", 4, "c", {agr:1, hon:-1, mood:-1}],
    ["Buys from whoever is on the doorstep", "Cannot close the door on a pitch and ends up with a product that was never on the list.", "I'll take the, er, the triple glazing. I only came out about the gutter.", 3, "c", {asrt:-1, agr:1}],
    ["Gives way to tears", "A single wet eye and the policy is gone, and the tissue comes out of their own pocket.", "Don't, please don't. Oh, all right, this once. Blow your nose.", 3, "u", {emo:1, asrt:-1, warm:1}],
    ["Can only stay an hour", "Names a firm departure time at the door and is still there at midnight, coat on, talking.", "I can only stay an hour, honestly. (midnight, in a coat, still talking)", 4, "c", {disc:-1, agr:1}],
    ["One exception that became the rule", "Reserves a day for themselves, grants a single exception, and finds a year has gone.", "I said Saturdays were mine. I did the one Saturday. That was a year ago, yes.", 2, "u", {disc:-1, agr:1}],
    ["A small sigh before the yes", "Breathes out once, barely audibly, and then agrees, and no one is meant to notice the cost.", "(a small exhale) — Mm. All right.", 1, "s", {agr:1, emo:-1}],
    ["Apologises to whoever overstepped", "When someone tramples the limit, takes the blame for having one.", "Sorry, you were saying. I shouldn't have gone red. That's me.", 2, "u", {agr:1, ego:-1}],
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_DECISION);
