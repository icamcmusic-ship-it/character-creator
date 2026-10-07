/* v2 content: thin poles A. IDS 240000-240999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_POLES_A = (function(){
  const out = [];

  // ---- 1. Low energy at loud intensity (act -1) ----
  V2.block(out, "Personality Traits", "Activeness — Sedentary & Low-Energy", 240000, [
    ["Not getting up for that", "Meets a doorbell, a ringing phone and a boiling kettle with the same shrug, and lets all three run their course.", "Somebody'll get it. (nobody does, for a while)", 5, "c", {act:-1}],
    ["Shouting down the corridor", "Delivers answers at full volume from the sofa rather than cross the floor to someone in the next room.", "(from the settee) KITCHEN! Third drawer down! Look properly!", 4, "c", {act:-1, vol:1}],
    ["Waiting for the lift to save one flight", "Stands through two full lift cycles rather than climb a single flight, and counts the wait as time well spent.", "It's coming. It's only been four minutes. It's one floor, there's no sense in arguing with it.", 4, "c", {act:-1}],
    ["Contributes by pointing", "Offers to help shift a wardrobe and then supplies directions, encouragement and one held door.", "Left a bit. No, your left. I've got the door. That's the heavy bit, right there.", 4, "u", {act:-1}],
    ["Circling for a closer space", "Drives three laps of the car park for a spot by the entrance rather than walk forty yards from a free one.", "Someone's bound to be leaving. (fourth lap) Any minute now.", 4, "c", {act:-1}],
    ["One outing, one week off", "Treats a single trip out as the week's whole allowance of effort, and says so before the coat is off.", "That's me done till Thursday. Don't ring. Don't knock. I'm not in.", 4, "c", {act:-1}],
    ["Dismisses the morning", "Sleeps through the alarm and the second alarm, then meets the knock at the door with a speech about how early it is.", "(from under the duvet) It's not even — what time? No. No, it's fine. Ten more. Tell them ten more.", 5, "c", {act:-1, disc:-1}],
    ["Pays to avoid the stairs", "Offers money at any task involving lifting or walking: a taxi for the corner, a man with a van for one box.", "How much is the van? Whatever it is, I'll pay it. Just keep me away from stairs.", 4, "d", {act:-1}],
    ["A sigh before every verb", "Prefaces each request for effort with a long exhale, as though the sentence itself needed lifting.", "(long exhale) Right. (exhale) Fine. Where is it. (exhale) Which one.", 4, "c", {act:-1, mood:-1}],
    ["Sends the phone to voicemail from six feet away", "Watches a buzzing phone on the far arm of the sofa and decides the caller can try again later.", "It'll ring off. If it matters, they'll try again. (it rings off)", 4, "c", {act:-1}],
    ["Orders in a single lemon", "Pays a delivery fee and waits an hour for one item from the shop at the end of the road.", "It's nine pounds, with the fee, for one lemon. That's cheaper than the walk, if you think about it.", 4, "c", {act:-1}],
    ["'In a minute' until dusk", "Gives the same two words to every reminder between midday and teatime, with the minutes stretching each time.", "In a minute. (an hour passes) In a minute, I said. (the light changes) In a minute.", 5, "c", {act:-1, disc:-1}],
    ["Dozing off inside the sentence", "Slips into sleep with the sentence half-built and resumes it, word for word, when woken.", "...and that's why the Tuesday bus is — (a long snore) — is better. (wakes) Better.", 5, "d", {act:-1}],
    ["Plans the weekend around one cushion", "Arranges days so that no two things need a change of location, and rejects any proposal that does.", "Saturday: this sofa. Sunday: this sofa. Don't mention Monday, Monday's a long way off.", 4, "d", {act:-1}],
    ["Climbs one flight like an expedition", "Narrates a short staircase as if it were a mountain pass, with rests and last words.", "(on step three, gripping the banister) Tell them I went bravely. Tell them it was the stairs.", 4, "c", {act:-1, mood:-1}],
    ["Runs the household from one spot", "Keeps meals, post, work and phone chargers within reach of a single seat, and will not be moved to a table.", "The bed's a perfectly good desk. And a dining table. And — it's an office. Don't look at me like that.", 4, "d", {act:-1}],
    ["Sits for just a second on the bottom stair", "Stops on the way to an errand 'for one second', and the errand is quietly forgotten.", "Just popping up to — (sits on the bottom step) — give me one second. One.", 4, "c", {act:-1}],
    ["Skips the fireworks for the replay", "Declines every parade, sunset and display in favour of the footage afterwards, which is better anyway.", "I'll see it on the news. Better angle, no wind, and nobody's elbow.", 5, "s", {act:-1}],
    ["Treats rest as an investment", "Delivers a calm little speech on conserving energy as a life plan, usually from a horizontal position.", "You spend energy and it's gone. I'm saving mine. By eighty I'll be extremely rich.", 3, "d", {act:-1, ego:1}],
    ["Drops out of charades to heckle", "Leaves a party game the moment it asks anyone to stand, and judges the rest from the settee.", "On our feet? Count me out. I'll be the panel. Somebody give me a clipboard.", 4, "c", {act:-1}],
    ["Gym membership, future tense", "Keeps a fee going to a gym they have never entered and describes attendance as imminent.", "Starting Monday. Properly this time. (it is Monday; the sofa has not been vacated)", 3, "c", {act:-1, disc:-1}],
    ["Drags the chair to the conversation", "Scrapes an armchair across the room, inch by inch, rather than stand and walk to the people talking.", "(scraping, six inches at a time) Don't mind me. Carry on. I'm nearly there.", 3, "u", {act:-1}],
    ["Wants the meeting held where they are", "Suggests that anyone who needs a decision can come to the room they are already sitting in.", "Can we just do it here? Whoever needs me can come to me. I'm very easy to find.", 3, "u", {act:-1}],
    ["Lags behind and calls ahead", "Falls a long way back on any group stroll and shouts for the others to wave when something worth seeing turns up.", "(far back) You go on! Wave when you've found it! I'll be — I'll be here!", 3, "u", {act:-1}],
    ["Picks holidays by sunlounger count", "Chooses a destination by the number of loungers and whether one has a table within reach.", "Does the resort have loungers? How many? Is there one with a table? Book that one.", 3, "c", {act:-1}],
    ["Up to nothing, beautifully", "Greets a question about the day's plans with a quiet pride in having none.", "Up to? Nothing. Beautifully, completely nothing. Please don't ruin it.", 2, "c", {act:-1}],
    ["Bin day counted as exercise", "Logs one trip to the wheelie bin as the day's steps and says so when anyone asks about their health.", "I did the bins. That's my steps. That's all of my steps.", 2, "u", {act:-1}],
    ["Stands on the moving walkway", "Stays put on a moving walkway and sees no reason to add any steps of their own.", "(gliding past, arms folded) Why would I? It's moving.", 2, "c", {act:-1}],
    ["Rearranges the room around the socket", "Lets the charger cable decide where the day is spent, and moves nothing but the lamp.", "The cable reaches the sofa. The sofa isn't moving. So that's settled.", 1, "s", {act:-1}],
    ["Sits down to take a call", "Reaches for a seat the moment the phone is answered, even for a ten-second conversation.", "Hold on, let me sit — right. Go on. Who's this?", 1, "c", {act:-1}]
  ]);

  // ---- 2a. Slow pacing at loud intensity (pace -1): Pacing & Situation-Driven ----
  V2.block(out, "Verbosity Traits", "Pacing & Situation-Driven", 240100, [
    ["Counts to five before answering anything", "Leaves a gap of several full seconds before each reply, including to a simple question about their own name.", "What's your name? — (a very long moment) — ...Dennis.", 5, "c", {pace:-1}],
    ["A sentence that ends minutes after the topic did", "Delivers the end of a thought minutes after the conversation has gone elsewhere, as though it had never left.", "(four minutes after the topic changed) ...which is why I'd have said Thursday.", 5, "s", {pace:-1}],
    ["Answering the question before last", "Takes so long to respond that the reply lands on a question two turns back.", "(to the new question) ...and no, I don't think the roof was the problem.", 4, "u", {pace:-1}],
    ["A hole in the middle of every clause", "Opens a wide silence halfway through a sentence and carries on without apology.", "I went to the — (nine seconds) — shop.", 4, "d", {pace:-1}],
    ["Vowels stretched while thinking", "Draws out each word while the answer forms, so that 'well' alone fills a breath and a half.", "Weeeell... I'd saaay... mmm... maybe. Perhaps.", 4, "c", {pace:-1}],
    ["One clause, one breath, one pause", "Speaks in single short clauses, each followed by an audible breath in before the next.", "I went out. (breath) I saw it. (breath) It was closed.", 4, "c", {pace:-1}],
    ["Lets the kettle click off mid-story", "Tells an anecdote so slowly that background events, like a boiling kettle, overtake it.", "So I get to the door — (the kettle clicks off) — and I think, well.", 4, "u", {pace:-1}],
    ["Auditioning words aloud", "Tries two or three candidate words in slow succession before settling on one.", "It was 'cross'. (pause) Or 'vexed'. (pause) ...'Vexed'. Yes.", 4, "d", {pace:-1}],
    ["Making the other end check the line", "Pauses on the phone for so long that the caller says hello twice.", "(after a long silence) ...Hello? — Yes, I'm here. I was thinking.", 4, "c", {pace:-1}],
    ["Slower the harder they're pushed", "Responds to every urge to hurry by dropping the pace another notch.", "Hurry up! — (a slow turn of the head) ...I'm hurrying.", 5, "d", {pace:-1, mood:1}],
    ["Having their sentences finished, then corrected", "Lets others supply the missing end of a slow sentence, and mildly corrects the guess.", "I was going to say — 'Tuesday'? — ...No. 'Wednesday'. But thank you.", 4, "c", {pace:-1}],
    ["Reading out a message at dictation speed", "Voices a text or letter one word at a time, with a pause after each name.", "(reading aloud) Dear. Mr. Hollis. ...Hollis. Yes. Hollis.", 4, "u", {pace:-1}],
    ["Drip-feeding the punchline", "Tells a joke so deliberately that the laugh has died of old age before the end.", "So a man... walks into... (sip of tea)... a shop...", 4, "c", {pace:-1}],
    ["Holding back the last word", "Leaves the final word of a sentence hanging for a beat before letting it fall.", "It's the one on the left, by the... (beat) ...bakery.", 1, "s", {pace:-1}],
    ["A long 'hmm' that outlasts the question", "Opens every reply with a hum that runs on well past the end of what was asked.", "Hmmmmmmm. ...Possibly.", 2, "c", {pace:-1}],
    ["Ordering one slow item at a time", "Builds an order at the counter piece by piece, with a pause and a look at the board between each, while a queue forms.", "Can I have a... (reads the board, slowly) ...a coffee. (pause) ...Large. (pause) ...Hm. Medium.", 4, "c", {pace:-1}],
    ["Not hurried by the clock", "Glances at the watch someone is tapping and carries on at exactly the same pace.", "We're late. — (unbothered) ...The party'll still be there.", 5, "c", {pace:-1, mood:1}],
    ["Repeating the question word by word", "Says the question back slowly, one word at a time, before attempting to answer it.", "How. Much. Is. The. Rent. ...Hm. Eight hundred.", 4, "u", {pace:-1}],
    ["A sip before each reply", "Lifts a cup before every answer, sets it down, turns it a quarter, and only then speaks.", "(sip; sets the cup down; turns it a quarter) ...No.", 2, "c", {pace:-1}],
    ["Not talking until ten", "Takes the first half of the morning to reach anything like conversational speed.", "(mug in both hands) ...Mm. Ask me ...again... in an hour.", 4, "c", {pace:-1, act:-1}],
    ["Dictating a phone number digit by digit", "Reads out a number with a pause between every digit, so the listener's pen waits.", "Oh. Seven. ...Seven. ...Nine. (the listener sighs) ...Four.", 4, "u", {pace:-1}],
    ["Saying goodbye in instalments", "Stretches a farewell across ten minutes at the door with a series of slow, separate endings.", "Right then. ...Well. ...Mind how you go. ...Yes. ...Well, then.", 4, "c", {pace:-1, warm:1}],
    ["Half a second behind", "Lets a barely perceptible gap sit before each answer, so every reply seems to come from slightly further away.", "(the smallest gap) ...Yes. That's fine.", 1, "c", {pace:-1}],
    ["Reading the menu aloud, at length", "Voices every dish slowly, as though the choosing were happening in the speech itself.", "Soup of the day. ...Which is. ...Mushroom. ...Hm. Mushroom.", 2, "c", {pace:-1}]
  ]);

  // ---- 2b. Slow pacing at loud intensity (pace -1): Minimal & Ultra-Brief ----
  V2.block(out, "Verbosity Traits", "Minimal & Ultra-Brief", 240200, [
    ["Spending words like pound coins", "Hands over each word as though it were costing real money, with a long pause before the next.", "(a pause, then one word) Bus. (another pause) Late.", 4, "d", {pace:-1, vol:-1}],
    ["One word a minute under questioning", "Answers a barrage of questions with single words separated by sixty seconds of silence.", "(a minute) ...No. (a minute) ...Never.", 5, "s", {pace:-1, vol:-1}],
    ["A reply that outlives the question", "Delivers a short answer long after the question was asked, to someone already doing something else.", "(the asker is halfway through a sandwich) ...Yes.", 4, "d", {pace:-1, vol:-1}],
    ["Pricing the sentence before starting", "Opens the mouth, closes it, reconsiders, and then spends only the cheapest possible reply.", "(opens mouth; closes it) ...No.", 3, "u", {pace:-1, vol:-1}],
    ["'Mm', then silence until supper", "Offers a single hum in answer to a long speech and nothing more for hours.", "(a low hum, which is the whole of the reply)", 1, "c", {pace:-1, vol:-1}],
    ["Not being rushed into a yes", "Answers a request for a quick decision with a deferral so slow it seems almost kind.", "Ask me in the morning. (a long moment) ...Possibly.", 3, "d", {pace:-1, asrt:1}]
  ]);

  // ---- 3. Low curiosity at loud intensity (cur -1) ----
  V2.block(out, "Personality Traits", "Curiosity — Incurious & Settled", 240300, [
    ["Closing the subject with a flat line", "Ends a topic by stating a view and declaring the matter finished, with a change of dish.", "Right, well, that's that, then. Pass the salt.", 5, "c", {cur:-1, asrt:1}],
    ["Living beside a landmark, unquestioning", "Has passed a famous monument daily for two decades without asking what it commemorates.", "That big stone thing? It's always been there. Parking's a nightmare, though.", 5, "s", {cur:-1}],
    ["'I know what I like' as a whole argument", "Rests every refusal of anything unfamiliar on the same sentence and the same tone.", "I know what I like, and this is it. Same again, please.", 5, "c", {cur:-1, agr:-1}],
    ["Handing the menu back unread", "Gives back a new menu without opening it and asks for the order they've had for years.", "Just the usual. — We're a different restaurant. — The usual, please.", 4, "u", {cur:-1}],
    ["Returning to the weather", "Lets a long story about someone's travels run its course and then announces the sky.", "...Anyway. Looks like rain.", 4, "c", {cur:-1, warm:-1}],
    ["Using one button of forty", "Bins the instruction booklet unread and operates a whole machine through its single known function.", "It's got one button I use. The other forty can look after themselves.", 4, "c", {cur:-1}],
    ["Refusing a food on novelty alone", "Declines an unfamiliar dish without tasting, with no objection other than that it is unfamiliar.", "I've not had it before, so no thank you. Don't take it personally.", 4, "c", {cur:-1}],
    ["The same three questions, in order", "Asks every visitor the identical short list, and the answers never change what comes next.", "Keeping well? Busy? Good. Right.", 3, "u", {cur:-1}],
    ["Taking a bombshell in stride", "Receives life-changing news with a nod and an immediate question about dinner.", "I've got a new job. In Lisbon. — Right. Are we having the chicken?", 4, "c", {cur:-1, warm:-1}],
    ["Leaving the tour after the first room", "Walks out of a guided visit once the first room has been seen and heads for the café.", "Right. Seen it. Is there a café?", 4, "c", {cur:-1}],
    ["Sticking to the old form", "Has ignored a company's new software for a decade and keeps filling in the paper version.", "The old way works. I've done it the old way since 1998. I'll do it the old way.", 4, "c", {cur:-1, rebel:1}],
    ["'Never heard of it', said with pride", "Treats a gap in knowledge as evidence of a well-run life.", "Never heard of it. Never needed to. I'm doing very well, thank you.", 4, "d", {cur:-1, ego:1}],
    ["Taking a view from the headline", "Forms and states a firm opinion from the top line of a story and declines to read further.", "'Council cuts bins.' Disgraceful. — Read the rest— — Don't need to.", 3, "c", {cur:-1, intel:-1}],
    ["Eyeing the paper while a child draws", "Replies to an excited description of a drawing without asking one question about it.", "Lovely. (back to the paper) ...Very nice.", 4, "u", {cur:-1, warm:-1}],
    ["Each to their own, and that's the end", "Answers any account of an unfamiliar interest with a tolerant phrase that closes the matter.", "Each to their own. (picks up the paper)", 4, "c", {cur:-1, agr:1}],
    ["Losing the thread at the first unfamiliar word", "Stops listening at the first term they don't know and waits for the explanation to end.", "Right, so the mitochondria— — (they reach for the remote)", 4, "c", {cur:-1}],
    ["Judging the next town by 1994", "Holds a firm opinion on a place last visited thirty years ago and sees no case for a second look.", "It's all gone downhill there. — When were you last? — Ninety-four. It was going then.", 3, "d", {cur:-1}],
    ["Neither here nor there", "Waves off any 'why' with a stock phrase and no wish to find out.", "Why's it called that? — Neither here nor there.", 2, "c", {cur:-1}],
    ["Learning something new as a threat", "Treats the idea of daily learning as a mild menace and says so with a smile.", "You learn something new every day, they say. I'd like to skip today.", 4, "d", {cur:-1}],
    ["'We tried that'", "Meets every suggestion with an account of a past trial, never produced and never examined.", "We tried that. — When? — Before. It didn't take.", 4, "c", {cur:-1, rebel:-1}],
    ["Faff, said of other people's hobbies", "Dismisses a friend's pastime in one word before any detail is offered.", "Fell-running? Sounds like a lot of faff.", 4, "u", {cur:-1, warm:-1}],
    ["Don't tell me where, just when", "Declines the destination of a trip and asks only for the time of departure.", "Don't tell me where. Just say when we're leaving. I'll be in the car.", 3, "d", {cur:-1}],
    ["The encyclopaedia holds the door", "Keeps a full set of reference books and uses one volume to prop a door open.", "Twenty-four volumes, and one's a lovely doorstop.", 2, "d", {cur:-1}],
    ["Cutting off the child's 'why?'", "Answers a chain of 'why' questions with the first flat reply and an instruction about dinner.", "Why is the sky — — Because it is. Eat your peas.", 4, "c", {cur:-1, warm:-1}],
    ["Fascinating, is that the time?", "Nods through an explanation with a polite word and a glance toward the exit.", "Fascinating. Is that the time? I really mustn't keep you.", 2, "u", {cur:-1, man:1}],
    ["Reading only the first page of the menu", "Orders from the first page and never turns it.", "(reads the first page, orders from the first page) That'll do.", 1, "c", {cur:-1}],
    ["No point going into it", "Shuts a question with a phrase that suggests a reason without offering one.", "No point going into it.", 2, "c", {cur:-1}],
    ["Not checking the new shop", "Has walked past a corner shop for two years without learning what it sells.", "What's that place on the corner? — Don't know. Been there two years.", 1, "s", {cur:-1}]
  ]);

  // ---- 4. Quiet-voiced but high-talk (vol +1 with mood or asrt -1) ----
  V2.block(out, "Verbosity Traits", "High-Volume & Wordy", 240400, [
    ["Murmuring a whole monologue to the carpet", "Delivers an unbroken account at barely audible volume, with the gaze fixed on the floor.", "(very softly, eyes down) ...and then my sister said, and I said, and she said, and then the —", 4, "d", {vol:1, asrt:-1}],
    ["Apologising in a stream, under the breath", "Wraps every point in soft, repeated apologies that add up to far more talk than the point.", "Sorry, sorry, it's only that — and sorry, one more thing — I did think — sorry —", 3, "c", {vol:1, asrt:-1}],
    ["Whispering a running commentary through the film", "Explains the plot to the person nearby in an unbroken whisper, scene by scene.", "(whisper) That's the brother. Not that one. The other one. He did it.", 3, "c", {vol:1, asrt:-1}],
    ["Library-volume, no breaths", "Talks in a soft, unbroken thread that loops through every subject on the street.", "(a soft unbroken thread) ...and the car, and the council, and Maureen, and the business with the gutter...", 5, "s", {vol:1, asrt:-1}],
    ["Soft-spoken and relentless", "Keeps the voice low and kind, and fills every gap in the conversation anyway, one small addition at a time.", "(low, even, kind) ...and one more small thing, if you don't mind, and then another...", 5, "u", {vol:1, asrt:-1}],
    ["Confiding at length in a hush", "Drops to a conspiratorial murmur and talks on, with ever more background to a secret.", "(barely audible) Between us — and I shouldn't — but you won't tell — it started with the budget...", 3, "u", {vol:1, mood:-1}],
    ["A worried murmur filling the silence", "Fills pauses with a thin, anxious murmur that rehearses every small risk of the day.", "(under their breath) Should be fine. Should be fine. Probably. Did I lock it? I locked it. Did I —", 4, "c", {vol:1, mood:-1}],
    ["Trailing off, then restarting, still quiet", "Begins a thought, loses nerve, and restarts it three times in the same soft voice.", "I only meant — no, but — what I mean is — oh, it doesn't matter — except that —", 3, "d", {vol:1, asrt:-1}],
    ["Hushed explaining at the back of the room", "Briefs the person next to them in a low voice, continuing well after the meeting has started.", "(quietly, to the person beside them) Right, so the agenda says — and that's Dave, and he's the one who —", 1, "u", {vol:1, asrt:-1}],
    ["Muttering the whole argument at the sink", "Rehearses an old quarrel under the breath, adding fresh grievances with every plate.", "(muttering) And she says that to me. To me. After the year I've had. And the cheek of it —", 4, "d", {vol:1, mood:-1}],
    ["Saying a great deal, softly", "Offers an almost endless supply of further detail in a gentle voice, always on the edge of stopping.", "(soft) Oh, I could say so much more, if you'd like. Only if you'd like.", 2, "c", {vol:1, asrt:-1}],
    ["A lullaby murmur", "Talks on in a low, sing-song hum, as though settling someone for the night.", "(a gentle hum of words) ...and the little blue cup, and the little blue spoon, and off we go...", 1, "s", {vol:1, asrt:-1}],
    ["Whispering through the funeral", "Passes on the dead man's whole history in a hushed rush to anyone within reach.", "(whispering) He was so good to us, and you remember the allotment, and the shed, oh the shed —", 3, "u", {vol:1, mood:-1}],
    ["Correcting themselves in a whisper, mid-talk", "Interrupts their own account with soft, barely audible corrections, then goes on.", "The Tuesday. No — (barely audible) Wednesday — Wednesday, sorry, it was the Wednesday —", 2, "s", {vol:1, mood:-1}],
    ["Leaving a voicemail in a tiny voice", "Fills a machine's whole recording time in a small, apologetic tone, and is cut off mid-clause.", "Hello, it's only me, sorry, I know you're busy, it's about the — (beep)", 4, "c", {vol:1, asrt:-1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_POLES_A);
