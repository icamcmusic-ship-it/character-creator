/* v2 content: thin poles A. IDS 240000-240999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_POLES_A = (function(){
  const out = [];

  // ---- 1. Low energy at loud intensity (act -1) ----
  V2.block(out, "Personality Traits", "Activeness — Sedentary & Low-Energy", 240000, [
    ["Ignoring the doorbell from the sofa", "A doorbell, a ringing phone and a boiling kettle all get the same shrug, and each is left to run its course.", "Somebody'll get it. (nobody does, for a while)", 5, "c", {act:-1}],
    ["Shouting answers across the house", "Bellows directions from the sofa to someone in the next room rather than cross the floor to say them.", "(from the settee) KITCHEN! Third drawer down! Look properly!", 5, "c", {act:-1, vol:1}],
    ["Waiting for the lift to save one flight", "Stands through two full lift cycles rather than climb a single flight, and counts the wait as time well spent.", "(four minutes in, jabbing the button) It's one floor. I am not walking up one floor.", 3, "c", {act:-1}],
    ["Helping by pointing", "Volunteers to shift a wardrobe, then supplies directions, encouragement and one held door.", "Left a bit. No, your left. I've got the door. That's the heavy bit, right there.", 2, "u", {act:-1}],
    ["Circling the car park for a closer space", "Drives laps of the car park hunting for a space by the entrance while a free one waits forty yards away.", "Someone's bound to be leaving. (fourth lap) Any minute now.", 4, "c", {act:-1}],
    ["Resting a week after one outing", "Counts a single trip out as the week's whole allowance of effort, and announces it before the coat is off.", "That's me done till Thursday. Don't ring. Don't knock. I'm not in.", 4, "c", {act:-1}],
    ["Sleeping through two alarms and a knock", "Sleeps through the alarm and then the second alarm, and answers the knock at the door with a speech about how early it is.", "(from under the duvet) It is not morning. Morning has not been agreed. Tell them ten more minutes.", 5, "c", {act:-1}],
    ["Hiring out the lifting", "Offers money for any task involving carrying or walking: a taxi for the corner, a man with a van for one box.", "How much is the van? Whatever it is, I'll pay it. Just keep me away from stairs.", 3, "d", {act:-1}],
    ["Sighing before any task", "Prefaces each request for effort with a long exhale, as though the sentence itself needed lifting.", "(long exhale) Right. (exhale) Fine. Where is it. (exhale) Which one.", 4, "c", {act:-1, mood:-1}],
    ["Fetching things with a toe", "Hooks a cushion, a remote or a bag across the floor with one foot rather than stand to collect it.", "(toe stretching for the remote, an inch short) Nearly. Nearly... got it.", 2, "u", {act:-1}],
    ["Saying 'in a minute' until dusk", "Answers every reminder between midday and teatime with the same two words, the gaps between them growing longer.", "In a minute. (an hour passes) In a minute, I said. (the light changes) In a minute.", 4, "c", {act:-1, disc:-1}],
    ["Falling asleep mid-sentence", "Drifts off with a sentence half-built and picks it up, word for word, on waking.", "...and that's why the Tuesday bus is — (a long snore) — is better. (wakes) Better.", 5, "d", {act:-1}],
    ["Planning the weekend around one cushion", "Arranges the days so that no two things need a change of location, and turns down any proposal that does.", "Saturday: this sofa. Sunday: this sofa. Don't mention Monday, Monday's a long way off.", 3, "d", {act:-1}],
    ["Climbing one flight like an expedition", "Narrates a short staircase as though it were a mountain pass, complete with rests and last words.", "(on step three, gripping the banister) Tell them I went bravely. Tell them it was the stairs.", 3, "u", {act:-1}],
    ["Stopping on the bottom stair 'for a second'", "Sits down mid-errand 'for one second', and the errand is quietly forgotten.", "Just popping up to — (sits on the bottom step) — give me one second. One.", 3, "c", {act:-1}],
    ["Watching the spectacle on the news instead", "Declines parades, sunsets and firework displays in favour of the footage afterwards, which has the better angle.", "I'll see it on the news. Better angle, no wind, and nobody's elbow.", 2, "s", {act:-1}],
    ["Treating rest as an investment", "Delivers a calm little speech on conserving energy as a life plan, usually from a horizontal position.", "You spend energy and it's gone. I'm saving mine. By eighty I'll be extremely rich.", 3, "d", {act:-1, ego:1}],
    ["Judging charades from the sofa", "Leaves a party game the moment it asks anyone to stand, then rules on the rest from the cushions.", "On our feet? Count me out. I'll be the panel. Somebody give me a clipboard.", 3, "c", {act:-1}],
    ["A gym membership in the future tense", "Pays monthly for a gym they have never entered and describes the first visit as imminent.", "Starting Monday. Properly this time. (it is Monday; the sofa has not been vacated)", 3, "c", {act:-1, disc:-1}],
    ["Dragging the armchair to the conversation", "Scrapes an armchair across the room, inch by inch, rather than stand and walk to the people talking.", "(scraping, six inches at a time) Don't mind me. Carry on. I'm nearly there.", 3, "u", {act:-1}],
    ["Holding the meeting where they are", "Suggests that anyone who needs a decision can come to the room they are already sitting in.", "Can we just do it here? Whoever needs me can come to me. I'm very easy to find.", 2, "u", {act:-1}],
    ["Calling ahead from far behind", "Falls a long way back on a group walk and shouts for the others to wave when something worth seeing turns up.", "(far back) You go on! Wave when you've found it! I'll be — I'll be here!", 3, "u", {act:-1}],
    ["Choosing holidays by sunlounger", "Picks a destination by the number of loungers and whether one has a table within reach.", "Does the resort have loungers? How many? Is there one with a table? Book that one.", 2, "c", {act:-1}],
    ["Proud of having no plans", "Greets a question about the day's plans with quiet pride in having none.", "Up to? Nothing. Beautifully, completely nothing. Please don't ruin it.", 1, "c", {act:-1}],
    ["Counting the bins as exercise", "Logs one trip to the wheelie bin as the day's steps and says so whenever health comes up.", "I did the bins. That's my steps. That's all of my steps.", 1, "u", {act:-1}],
    ["Standing still on the moving walkway", "Stays put on a moving walkway and sees no reason to add any steps of their own.", "(gliding past, arms folded) Why would I? It's moving.", 1, "c", {act:-1}],
    ["Settling wherever the charger reaches", "Lets the length of the charger cable decide where the day is spent.", "The cable reaches the sofa. The sofa isn't moving. So that's settled.", 1, "s", {act:-1}],
    ["Sitting down to take a call", "Reaches for a seat the moment the phone is answered, even for a ten-second conversation.", "Hold on, let me sit — right. Go on. Who's this?", 1, "c", {act:-1}]
  ]);

  // ---- 2a. Slow pacing at loud intensity (pace -1): Pacing & Situation-Driven ----
  V2.block(out, "Verbosity Traits", "Pacing & Situation-Driven", 240100, [
    ["Pausing five seconds before any answer", "Leaves a gap of several full seconds before each reply, including to a simple question about their own name.", "What's your name? — (a very long moment) — ...Dennis.", 5, "c", {pace:-1}],
    ["Answering the question before last", "Takes so long to respond that the reply lands on a question two turns back.", "(to the new question) ...and no, I don't think the roof was the problem.", 4, "u", {pace:-1}],
    ["Opening a hole mid-clause", "Lets a wide silence open halfway through a sentence and carries on without apology.", "I went to the — (nine seconds) — shop.", 5, "d", {pace:-1}],
    ["Stretching the vowels while thinking", "Draws out each word while the answer forms, so that 'well' alone fills a breath and a half.", "Weeeell... I'd saaay... mmm... maybe. Perhaps.", 4, "c", {pace:-1}],
    ["Telling it in numbered stages", "Narrates events strictly in sequence, each one marked 'first', 'then' or 'after that' and followed by a pause.", "First, I went out. (pause) Then, I saw it. (pause) After that, it was closed.", 3, "c", {pace:-1}],
    ["Outlasted by the kettle", "Tells an anecdote so slowly that background events, like a boiling kettle, overtake it.", "So I get to the door — (the kettle clicks off) — and I think, well.", 3, "u", {pace:-1}],
    ["Auditioning words aloud", "Tries two or three candidate words in slow succession before settling on one.", "It was 'cross'. (pause) Or 'vexed'. (pause) ...'Vexed'. Yes.", 2, "d", {pace:-1}],
    ["Slowing down the harder they are pushed", "Meets every urge to hurry by dropping the pace another notch.", "Hurry up! — (a slow turn of the head) ...I'm hurrying.", 5, "d", {pace:-1, mood:1}],
    ["Having sentences finished for them", "Lets others supply the missing end of a slow sentence, then mildly corrects the guess.", "I was going to say — 'Tuesday'? — ...No. 'Wednesday'. But thank you.", 2, "u", {pace:-1}],
    ["Drip-feeding the punchline", "Tells a joke so deliberately that the laugh has died of old age before the end.", "So a man... walks into... (sip of tea)... a shop...", 4, "c", {pace:-1}],
    ["Holding back the last word", "Leaves the final word of a sentence hanging for a beat before letting it fall.", "It's the one on the left, by the... (beat) ...bakery.", 1, "s", {pace:-1}],
    ["A hum that outlasts the question", "Begins a reply with a hum that runs on well past the end of what was asked.", "Hmmmmmmm. ...Possibly.", 2, "c", {pace:-1}],
    ["Ordering one slow item at a time", "Builds an order at the counter piece by piece, with a pause and a look at the board between each, while a queue forms.", "Can I have a... (reads the board, slowly) ...a coffee. (pause) ...Large. (pause) ...Hm. Medium.", 4, "c", {pace:-1}],
    ["Repeating the question word by word", "Says the question back slowly, one word at a time, before attempting an answer.", "How. Much. Is. The. Rent. ...Hm. Eight hundred.", 2, "u", {pace:-1}],
    ["A sip before each reply", "Lifts a cup before answering, sets it down, turns it a quarter, and only then speaks.", "(sip; sets the cup down; turns it a quarter) ...No.", 2, "c", {pace:-1}],
    ["Not talking until ten", "Takes the first half of the morning to reach anything like conversational speed.", "(mug in both hands) ...Mm. Ask me ...again... in an hour.", 3, "c", {pace:-1, act:-1}],
    ["Dictating a number digit by digit", "Reads out a phone number with a pause between every digit, so the listener's pen waits.", "Oh. Seven. ...Seven. ...Nine. (the listener sighs) ...Four.", 3, "u", {pace:-1}],
    ["Saying goodbye in instalments", "Stretches a farewell across ten minutes at the door with a series of slow, separate endings.", "Right then. ...Well. ...Mind how you go. ...Yes. ...Well, then.", 4, "c", {pace:-1, warm:1}],
    ["Half a second behind", "Lets a barely perceptible gap sit before each answer, so replies seem to come from slightly further away.", "(the smallest gap) ...Yes. That's fine.", 1, "s", {pace:-1}]
  ]);

  // ---- 2b. Slow pacing at loud intensity (pace -1): Minimal & Ultra-Brief ----
  V2.block(out, "Verbosity Traits", "Minimal & Ultra-Brief", 240200, [
    ["Spending words like pound coins", "Hands over each word as though it were costing real money, with a long pause before the next.", "(a pause, then one word) Bus. (another pause) Late.", 4, "d", {pace:-1, vol:-1}],
    ["One word a minute under questioning", "Answers a barrage of questions with single words separated by sixty seconds of silence.", "(a minute) ...No. (a minute) ...Never.", 5, "s", {pace:-1, vol:-1}],
    ["Opening the mouth, then thinking better of it", "Opens the mouth to speak, closes it, reconsiders, and finally spends only the cheapest possible reply.", "(opens mouth; closes it) ...No.", 3, "u", {pace:-1, vol:-1}],
    ["Answering a speech with one hum", "Offers a single low hum in answer to a long speech, and nothing more for hours.", "(a low hum, which is the whole of the reply)", 1, "c", {pace:-1, vol:-1}],
    ["Declining to be rushed into a yes", "Answers a request for a quick decision with a deferral so slow it seems almost kind.", "Ask me in the morning. (a long moment) ...Possibly.", 3, "d", {pace:-1, asrt:1}]
  ]);

  // ---- 3. Low curiosity at loud intensity (cur -1) ----
  V2.block(out, "Personality Traits", "Curiosity — Incurious & Settled", 240300, [
    ["Closing the subject and passing the salt", "Ends a topic by stating a view, declaring the matter finished, and turning attention to the dish in hand.", "Right, well, that's that, then. Pass the salt.", 4, "c", {cur:-1, asrt:1}],
    ["Living beside a landmark, unquestioning", "Has passed a famous monument daily for two decades without asking what it commemorates.", "That big stone thing? It's always been there. Parking's a nightmare, though.", 2, "s", {cur:-1}],
    ["Resting every refusal on 'I know what I like'", "Answers each invitation to try something new with the same short sentence, delivered as though it settled the matter.", "I know what I like. That's the whole case.", 4, "c", {cur:-1, agr:-1}],
    ["Handing the menu back unread", "Gives back a new menu without opening it and asks for the order they've had for years.", "Just the usual. — We're a different restaurant. — The usual, please.", 3, "u", {cur:-1}],
    ["Returning to the weather", "Lets a long story about someone's travels run its course and then announces the sky.", "...Anyway. Looks like rain.", 2, "c", {cur:-1, warm:-1}],
    ["Using one button of forty", "Bins the instruction booklet unread and runs a whole machine through its single known function.", "It's got one button I use. The other forty can look after themselves.", 3, "c", {cur:-1}],
    ["Refusing a food on novelty alone", "Declines an unfamiliar dish without tasting, with no objection other than that it is unfamiliar.", "I've not had it before, so no thank you. Don't take it personally.", 3, "c", {cur:-1}],
    ["The same three questions, in order", "Puts an identical short list of questions to every visitor, and the answers never change what comes next.", "Keeping well? Busy? Good. Right.", 2, "u", {cur:-1}],
    ["Taking a bombshell in stride", "Receives life-changing news with a nod and an immediate question about dinner.", "I've got a new job. In Lisbon. — Right. Are we having the chicken?", 5, "u", {cur:-1, warm:-1}],
    ["Leaving the tour after the first room", "Walks out of a guided visit once the first room has been seen and heads for the café.", "Right. Seen it. Is there a café?", 4, "c", {cur:-1}],
    ["Sticking to the paper form", "Has ignored the company's new software for a decade and keeps filling in the paper version.", "The old way works. I've done it the old way since 1998. I'll do it the old way.", 3, "c", {cur:-1}],
    ["Proud of never having heard of it", "Treats a gap in knowledge as evidence of a well-run life.", "Never heard of it. Never needed to. I'm doing very well, thank you.", 3, "d", {cur:-1, ego:1}],
    ["Forming a view from the headline", "Settles on a firm opinion from the top line of a story and declines to read further.", "'Council cuts bins.' Disgraceful. — Read the rest— — Don't need to.", 2, "c", {cur:-1, intel:-1}],
    ["Closing with 'each to their own'", "Answers any account of an unfamiliar interest with a tolerant phrase that shuts the matter.", "Each to their own. (picks up the paper)", 3, "c", {cur:-1, agr:1}],
    ["Switching off at the first unfamiliar word", "Stops listening at the first term they don't know and waits for the explanation to end.", "Right, so the mitochondria— — (they reach for the remote)", 3, "c", {cur:-1}],
    ["Judging a town on a visit decades ago", "Holds a firm opinion on a place last visited thirty years ago and sees no case for a second look.", "It's all gone downhill there. — When were you last? — Ninety-four. It was going then.", 3, "d", {cur:-1}],
    ["Waving off every 'why'", "Meets any 'why' with a stock phrase and no wish to find out.", "Why's it called that? — Neither here nor there.", 2, "c", {cur:-1}],
    ["Treating new learning as a threat", "Regards the idea of daily learning as a mild menace, and says so with a smile.", "You learn something new every day, they say. I'd like to skip today.", 3, "d", {cur:-1}],
    ["Claiming 'we tried that'", "Meets any suggestion with a claim that it was tried years ago, and gives no detail of when or how it failed.", "We tried that. — When? — Before. It didn't take.", 3, "c", {cur:-1}],
    ["Dismissing hobbies as a faff", "Waves away a friend's pastime in one word before any detail is offered.", "Fell-running? Sounds like a lot of faff.", 3, "u", {cur:-1, warm:-1}],
    ["Asking only when, never where", "Declines to hear the destination of a trip and asks only for the time of departure.", "Don't tell me where. Just say when we're leaving. I'll be in the car.", 3, "d", {cur:-1}],
    ["Using the encyclopaedia as a doorstop", "Keeps a full set of reference books and uses one volume to prop a door open.", "Twenty-four volumes, and one's a lovely doorstop.", 2, "d", {cur:-1}],
    ["Cutting off a child's chain of 'why?'", "Answers a run of 'why' questions with the first flat reply and an instruction about dinner.", "Why is the sky — — Because it is. Eat your peas.", 4, "c", {cur:-1, warm:-1}],
    ["Saying 'fascinating' and checking the time", "Nods through an explanation with a polite word and a glance toward the exit.", "Fascinating. Is that the time? I really mustn't keep you.", 2, "u", {cur:-1, man:1}]
  ]);

  // ---- 4. Quiet-voiced but high-talk (vol +1 with mood or asrt -1) ----
  V2.block(out, "Verbosity Traits", "High-Volume & Wordy", 240400, [
    ["Murmuring a monologue to the carpet", "Delivers an unbroken account at barely audible volume, with the gaze fixed on the floor.", "(very softly, eyes down) ...and then my sister said, and I said, and she said, and then the —", 5, "d", {vol:1, asrt:-1}],
    ["Apologising in a stream", "Wraps every point in soft, repeated apologies that add up to far more talk than the point itself.", "Sorry, sorry, it's only that — and sorry, one more thing — I did think — sorry —", 4, "c", {vol:1, asrt:-1}],
    ["Whispering commentary through the film", "Explains the plot to the person nearby in an unbroken whisper, scene by scene.", "(whisper) That's the brother. Not that one. The other one. He did it.", 4, "c", {vol:1, asrt:-1}],
    ["A soft voice with no gap in it", "Talks in a soft, unbroken thread that loops through every subject on the street.", "(a soft unbroken thread) ...and the car, and the council, and Maureen, and the business with the gutter...", 5, "s", {vol:1, asrt:-1}],
    ["Confiding at length in a hush", "Drops to a conspiratorial murmur and talks on, with ever more background to a secret.", "(barely audible) Between us — and I shouldn't — but you won't tell — it started with the budget...", 3, "u", {vol:1, mood:-1}],
    ["A worried murmur filling the silence", "Fills pauses with a thin, anxious murmur that rehearses every small risk of the day.", "(under their breath) Should be fine. Should be fine. Probably. Did I lock it? I locked it. Did I —", 3, "c", {vol:1, mood:-1}],
    ["Restarting every thought, still quietly", "Begins a thought, loses nerve, and restarts it three times in the same soft voice.", "I only meant — no, but — what I mean is — oh, it doesn't matter — except that —", 3, "d", {vol:1, asrt:-1}],
    ["Muttering the argument at the sink", "Rehearses an old quarrel under the breath, adding fresh grievances with every plate.", "(muttering) And she says that to me. To me. After the year I've had. And the cheek of it —", 4, "d", {vol:1, mood:-1}],
    ["Offering to say much more, softly", "Holds out an almost endless supply of further detail in a gentle voice, always on the edge of stopping.", "(soft) Oh, I could say so much more, if you'd like. Only if you'd like.", 1, "c", {vol:1, asrt:-1}],
    ["A lullaby murmur", "Talks on in a low, sing-song hum, as though settling someone for the night.", "(a gentle hum of words) ...and the little blue cup, and the little blue spoon, and off we go...", 1, "s", {vol:1, warm:1}],
    ["Whispering corrections mid-talk", "Interrupts their own account with soft, barely audible corrections, then goes on.", "The Tuesday. No — (barely audible) Wednesday — Wednesday, sorry, it was the Wednesday —", 1, "s", {vol:1, mood:-1}],
    ["Leaving a voicemail in a tiny voice", "Fills a machine's whole recording time in a small, apologetic tone, and is cut off mid-clause.", "Hello, it's only me, sorry, I know you're busy, it's about the — (beep)", 3, "c", {vol:1, asrt:-1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_POLES_A);
