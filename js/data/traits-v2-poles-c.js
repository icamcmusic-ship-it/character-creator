/* v2 content: pole balance (poles-c). IDS 242000-242999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_POLES_C = (function(){
  const out = [];

  /* ---------- Discipline, negative pole ---------- */
  V2.block(out, "Personality Traits", "Discipline — Impulsive & Undisciplined", 242000, [
    ["Buys the ticket before checking the diary", "Pays for the trip on a whim, then discovers the date collides with something already promised.", "Got us seats for Friday! — Friday's the wedding. — Is it? Whose?", 3, "c", {disc:-1}],
    ["Seven bookmarks in play", "Reads sixty pages of a book, drifts to the next one, and ends up with a pile of half-finished reading around the flat.", "I am reading it. I'm reading all of them. I'm just between pages.", 2, "c", {disc:-1, cur:1}],
    ["'We'll see how we feel'", "Treats any plan with a time attached as slightly rigid and answers every date with a shrug about the mood of the day.", "Saturday? We'll see how we feel Saturday.", 2, "c", {disc:-1}],
    ["Starts the job with whatever is to hand", "Begins a repair with the wrong tool because fetching the right one feels like admitting the job is real.", "(prising the panel off with a butter knife) It's basically a screwdriver.", 4, "c", {disc:-1}],
    ["Bedtime is when the night runs out", "Goes to sleep whenever the evening stops being interesting, which is a different hour each night and often after two.", "(2.40am, blue light on the face) One more episode. Then proper sleep.", 3, "c", {disc:-1, act:1}],
    ["Dinner is whatever is in reach", "Skips meals until ravenous, then eats crackers standing at the open cupboard and calls it dinner.", "Had a meal. Had half a packet of oatcakes. Same thing, nearly.", 4, "c", {disc:-1}],
    ["Tidies by moving the pile", "Clears a surface by shifting everything on it to the next surface, so the mess is relocated rather than reduced.", "(sweeps the table into a box) Done. Clear. Don't open the box.", 1, "s", {disc:-1}],
    ["Brings everything except the one thing that mattered", "Turns up to the picnic, lesson or meeting carrying everything except the item the whole event hinged on.", "I've got the wine, the blanket, the little speaker — corkscrew. Ah.", 3, "u", {disc:-1}],
    ["The diet that lasts until lunch", "Announces a firm new regime at breakfast and has quietly dropped it by mid-afternoon without any ceremony.", "No sugar from today. (unwrapping a flapjack) Today starts tomorrow, I think.", 4, "c", {disc:-1, pos:1}],
    ["Walks out mid-feeling", "Leaves the job, the course or the flat in the heat of a strong feeling and works out the consequences on the way home.", "That's it, I'm done. Keep the lanyard. (at the door) Do I still get paid for the week?", 5, "d", {disc:-1, mood:-1}],
    ["Nineteen alarms, all labelled 'thing'", "Sets a reminder as a gesture of intent, then swipes it away without reading when it goes off.", "(phone buzzes; a thumb dismisses it without a glance) That one's always going off.", 1, "s", {disc:-1}],
    ["Fines as a running cost", "Pays parking tickets, library charges and reminder fees as a normal expense rather than acting on any reminder.", "It's cheaper than remembering. I did the sums. Roughly.", 1, "u", {disc:-1}],
    ["First idea, full speed", "Grabs the first workable plan and starts at once, never comparing it to a second.", "Right! Paint the whole lot green. Why not? Where's the brush?", 5, "c", {disc:-1, pace:1}],
    ["Takes the brown sign", "Abandons the planned route for any turning that looks interesting and brings the passengers along whether they agreed or not.", "Ooh, brown sign. Castle. (indicating left) Five minutes, tops.", 3, "u", {disc:-1, cur:1}],
    ["Names the destination as everyone leaves the house", "Names the evening's destination only as everyone reaches the door, and it is never the one mentioned earlier.", "Coats! We're off to the lake. Not that lake. The other one. Coats!", 4, "c", {disc:-1, pace:1}]
  ]);

  /* ---------- Habits & Vices: avoidance, risk, busyness ---------- */
  V2.block(out, "Habits & Vices", "Avoidance & Procrastination", 242030, [
    ["Answers 'maybe!' to every invitation", "Cannot commit to a date, so replies to everything with a cheerful maybe and lets the day decide.", "Your thing on the fourteenth? Maybe! Definitely maybe! Ask me on the day.", 3, "c", {disc:-1, pos:1}],
    ["Tomorrow-me will handle it", "Puts every awkward task onto an imagined future self who is calmer, tidier and apparently free all week.", "Tomorrow-me is much better at forms. Leave it with tomorrow-me.", 3, "c", {disc:-1}],
    ["Cleans the whole kitchen to avoid one email", "Finds a dozen useful jobs, each of them real, to stand between themselves and the one thing they ought to be doing.", "(scrubbing the grout) I'll do the email. Obviously. Once the grout's right.", 4, "c", {disc:-1}],
    ["Opens the post and stacks it", "Slits the envelope, glances at the first line, and puts the letter on a pile that has its own weather.", "(a stack leaning on the toaster) Oh, that's all fine. It's all in there. Somewhere.", 1, "c", {disc:-1}],
    ["Starts the essay at midnight", "Does nothing for three weeks, then produces something brilliant and ragged in a single night of tea and panic.", "I work best under pressure. (it is half past two) I'm working incredibly well.", 5, "c", {disc:-1}],
    ["Researches instead of starting", "Reads about the thing, buys the book on the thing, and watches a stranger do the thing, without ever doing the thing.", "I've got the kit, the guide and four tutorials. I'm basically ready. Nearly.", 3, "d", {disc:-1, cur:1}],
    ["Lets the phone ring out, then texts", "Cannot face the call but sends a breezy message an hour later as if the ringing never happened.", "Saw you called! Was in the middle of something. Anything urgent? No? Lovely.", 1, "s", {disc:-1}],
    ["Reschedules the rescheduled meeting", "Moves a fixed date twice, apologises warmly each time, and has a new excuse ready for the third.", "Can we shift it again? I'm so sorry. Something's come up. It's a bit of a long story.", 4, "c", {disc:-1}],
    ["Loses the receipt, finds it in June", "Misplaces every document that matters and finds it months later in a coat pocket, a book, or the bread bin.", "(holding a damp slip) That's the warranty. For the washing machine we replaced in March.", 2, "u", {disc:-1}],
    ["Says 'I'll just pop it in the diary' and doesn't", "Promises to note the date, never does, and is startled each time the day arrives.", "I'll just put it in the diary. (no diary is touched) Lovely, yes, all noted.", 2, "c", {disc:-1}],
    ["Treats a deadline as a first offer", "Sees the due date as the opening position in a negotiation and starts the haggling the morning after it passes.", "Due Friday? Right. Could I have it Monday? Tuesday, if you're asking.", 5, "d", {disc:-1, asrt:1}],
    ["Drifts into a new hobby every spring", "Buys the full kit for a fresh interest each year and lets it quietly retire in the hall cupboard.", "(a cupboard of pottery wheel, ukulele and kayak paddle) This year's going to be different.", 2, "u", {disc:-1, cur:1}]
  ]);

  V2.block(out, "Habits & Vices", "Risk & Escape", 242060, [
    ["Says yes before hearing the question", "Agrees to the favour, the bet or the dare on reflex, and asks what it involved only on the way there.", "Yes! Absolutely. — You haven't heard what — Doesn't matter. What is it?", 5, "c", {disc:-1, pace:1}],
    ["Walks the last mile on the empty tank", "Treats the fuel light, the battery warning and the expired ticket as suggestions and relies on luck to see it through.", "(the needle below E) She's got another twenty miles in her. Easily. Ish.", 3, "u", {disc:-1}],
    ["Leaves the front door unlocked", "Lets the house, the bike and the car go unsecured out of sheer inattention rather than trust.", "Was it locked? Never is. Nobody's taken anything yet. Nobody's looked.", 1, "c", {disc:-1}],
    ["Books the flight, then the visa", "Does the exciting part of a journey first and leaves the dull paperwork until it is nearly too late.", "Tickets are done! Passport — where is the passport? Does it expire?", 3, "u", {disc:-1}],
    ["Spends the rent on a brilliant evening", "Puts the money that was earmarked for something dull towards one wonderful night and deals with the shortfall later.", "It was Dave's leaving do. You can't put a price on that. (you can; it was £140)", 5, "c", {disc:-1, pos:1}]
  ]);

  V2.block(out, "Habits & Vices", "Work & Busyness", 242090, [
    ["Fills the day then forgets the main thing", "Spends the hours answering small requests and reaches six o'clock without touching the one task that mattered.", "Brilliant day. Cleared my inbox. (the report is still a blank page)", 3, "c", {disc:-1}],
    ["Takes on three projects to avoid choosing one", "Keeps several enterprises half alive so that none of them ever has to succeed or fail.", "It's a podcast, a bakery and a game. They're all in a very exciting phase.", 3, "u", {disc:-1}],
    ["Switches tools mid-job", "Abandons the system they were using the moment a more appealing app, notebook or colour pen appears.", "New notebook! The old one was holding me back. (the old one is a third full)", 2, "c", {disc:-1}],
    ["Quits the spreadsheet at row nine", "Begins a tidy tracker with real enthusiasm and leaves it with the first few rows filled in.", "(a sheet titled FINAL v1) I'll keep it up. Nine rows. That's a strong start.", 1, "s", {disc:-1}]
  ]);

  /* ---------- Humor ---------- */
  V2.block(out, "Humor Style", "Absurd & Chaotic", 242110, [
    ["Derails the meeting with a bit", "Cannot sit through an agenda without launching a running joke that the room then has to finish.", "Item four: the budget. Or as I'm calling it, Item Four: Return of the Budget.", 5, "c", {disc:-1, vol:1}],
    ["Forgets the punchline and carries on anyway", "Sets off on a joke, loses the ending halfway, and finds the collapse funnier than the joke would have been.", "So the priest says — no, the vicar — no — hang on — anyway, he fell in a pond.", 3, "u", {disc:-1}],
    ["Improvises the toast", "Stands up at the dinner with no notes, no plan and wild confidence, and finds the speech as it comes.", "(glass raised, mid-sentence, no idea) — and that, ladies and gentlemen, is what a cheese is.", 4, "d", {disc:-1, vol:1}],
    ["Announces the prank as they set it up", "Is too excited to keep a trick secret and starts laughing and explaining it before the victim arrives.", "Okay, so when she opens it — it's going to — no, I can't, it's too good.", 1, "s", {disc:-1}],
    ["Changes voices mid-story", "Slides into a new accent for no reason, drifts away from the story, and comes back in a different voice altogether.", "(Yorkshire) So we went to the shop — (pirate) — anyway the shop was closed.", 3, "d", {disc:-1}],
    ["Lets the joke run on past dawn", "Keeps a bit going long after the others have stopped laughing, adding verses with a cheerful disregard for the clock.", "And another thing about the tortoise — no, listen, it gets better.", 5, "c", {disc:-1, vol:1}]
  ]);

  /* ---------- Social role ---------- */
  V2.block(out, "Social Role in a Group", "Instigator", 242140, [
    ["Proposes the idea at ten at night", "Offers the wild plan when everyone is tired and sensible, then watches it gather momentum.", "Right. Who fancies the coast? Now. It's only three hours. Shoes on.", 4, "c", {disc:-1, asrt:1}],
    ["Books nothing and expects it to work", "Rallies the group for an outing, then arrives at the venue to discover it was never reserved.", "It's fine, they'll fit us in. (a queue of forty) They'll fit us in.", 4, "c", {disc:-1}],
    ["Drops the plan when it gets boring", "Spends a week rousing the group around a goal and walks off the day it stops being exciting.", "Honestly, I've moved on from that. Have you not? It's all about the boat now.", 4, "d", {disc:-1, pos:1}],
    ["Vanishes after sparking the argument", "Throws in the line that lights the row, then slips off to the kitchen as it spreads.", "(one barbed remark; a quiet turn towards the biscuits)", 1, "s", {disc:-1}],
    ["Starts the group chat and abandons it", "Creates the thread with a flurry of enthusiasm and then lets it go quiet for the next ten weeks.", "I made a chat! (nine weeks later) Is this thing still going? Hello?", 1, "u", {disc:-1}],
    ["Changes the plan twice in an hour", "Keeps rearranging the group's afternoon, each version more exciting than the last and less workable.", "Cinema. No, bowling. No — wait — what about the beach? Beach!", 4, "c", {disc:-1, pace:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Clown", 242170, [
    ["Wanders off during the serious part", "Slips away from the group at the one moment everyone needs a pair of hands and comes back with an ice cream.", "(returning, licking a cone) What did I miss? Oh, the whole thing. Right.", 3, "u", {disc:-1}],
    ["Treats a rota as a joke", "Reads out the cleaning schedule in a funny voice and then ignores it completely.", "(in an announcer voice) 'Tuesday: bins!' I'll get to the bins when the bins call.", 2, "c", {disc:-1}],
    ["Can't hold a straight face for the photo", "Ruins the formal group picture with a pulled face, a bunny ear or a loud snort.", "(the sixth attempt) Sorry, sorry, I'm ready. (is not ready)", 2, "c", {disc:-1}],
    ["Promises a performance and wings it", "Tells the group they have a routine ready, then stands up and discovers there isn't one.", "I've got something prepared. (long beat) I've got something... that's coming.", 4, "d", {disc:-1}]
  ]);

  /* ---------- Conflict & stress ---------- */
  V2.block(out, "Conflict & Stress Response", "Flight (remove yourself)", 242200, [
    ["Books a trip to dodge the conversation", "Responds to a looming row by suddenly organising something far away and urgent.", "I'd love to talk about it. I'm in Lisbon on Thursday. Back in a bit.", 4, "u", {disc:-1}],
    ["Takes the long way round the office", "Detours past three desks to avoid walking by the one person they owe a reply.", "(takes the stairs, the back corridor, the canteen) Just stretching my legs.", 4, "c", {disc:-1}],
    ["Leaves the party the moment it turns", "Reads the room tipping towards a row and is out of the coat cupboard before the first raised voice.", "(already in the doorway) Lovely evening. Don't wait up. Bye.", 4, "c", {disc:-1, pace:1}],
    ["Sends the sorry text and switches the phone off", "Fires off a quick apology and goes offline before any reply can come back.", "(sent: 'so sorry, will explain!') (the phone goes in a drawer)", 3, "u", {disc:-1}],
    ["Starts something fun to cover the awkward bit", "Suddenly suggests a game, a film or a walk in the middle of someone's serious point.", "Right — this is heavy. Who's up for pizza? I'll ring. What do you all want?", 2, "c", {disc:-1, pos:1}],
    ["Quits the group chat in the middle of the row", "Leaves the thread without a word while the argument is still scrolling, and sends a gif a fortnight later.", "(has left the conversation) (days later) Anyone seen this cat?", 3, "d", {disc:-1}]
  ]);

  V2.block(out, "Conflict & Stress Response", "Fight (attack the threat)", 242230, [
    ["Says the thing, then needs the exit", "Fires off the cutting remark before it has been thought through and starts looking for the door at once.", "You always — no. Forget it. Forget I spoke. Where's my coat?", 5, "c", {disc:-1, asrt:1}],
    ["Fights on three fronts at once", "Brings up the dishes, the holiday and the thing from last spring in a single breath, and answers each rebuttal with a new grievance.", "And while we're at it — the heating — and your sister — and the BIN thing!", 5, "c", {disc:-1, vol:1}],
    ["Slams, then forgets what it was about", "Storms out in full cry and wanders back an hour later, sunny and baffled that anyone is still cross.", "(back in, humming) What's everyone so quiet about? Is there tea?", 5, "d", {disc:-1, mood:-1}]
  ]);

  /* ---------- Attachment ---------- */
  V2.block(out, "Attachment & Intimacy Style", "Disorganized", 242260, [
    ["Sends the long message, then deletes it", "Pours out a page of feeling and wipes it a moment later, then acts as if nothing was started.", "(typing... typing... gone) Nothing! No, nothing. Just thinking out loud.", 2, "u", {disc:-1, emo:1}],
    ["Plans the future on the second date", "Lays out holidays, a shared flat and a cat's name within a fortnight, then drifts off the week after.", "We'll get a place by the sea. Next spring? — (a month later, gone quiet)", 4, "d", {disc:-1, pos:1}],
    ["Forgets the anniversary, then over-gifts", "Misses the important day entirely and makes up for it with a mad, lavish gesture a week later.", "I know, I know. Look — I got us a boat. Well. A share of a boat.", 3, "d", {disc:-1, emo:1}],
    ["Says 'come over' and is not home", "Issues warm, sudden invitations and then fails to be in when the guest arrives.", "(a call from the pub) Oh! Was that tonight? Give me twenty minutes. Forty.", 4, "c", {disc:-1}],
    ["Swears to change, mid-bite", "Promises a total reform of their ways over supper and is breaking the promise by pudding.", "From now on, I'm calling when I say I'll call. (phone buzzes; picks it up)", 2, "c", {disc:-1, emo:1}]
  ]);

  /* ---------- Values & Moral line ---------- */
  V2.block(out, "Values & Moral Line", "Pragmatic & Flexible", 242290, [
    ["Treats a promise as a mood at the time", "Means every pledge when making it and sees no particular obligation once the feeling has faded.", "I did say that. I did. It felt true on the Sunday. Look, it's Wednesday.", 3, "u", {disc:-1, hon:-1}],
    ["Bends the queue rule for a good story", "Skips the line, the form or the guidance when the shortcut seems likelier to be fun than to hurt anyone.", "Everyone's waiting for the lift. The stairs aren't closed, they just have a sign.", 3, "c", {disc:-1, rebel:1}],
    ["Signs first, reads later", "Puts a name to the contract, the petition or the waiver without reading it and trusts it will be fine.", "(pen already moving) Looks standard! Terms are always standard. Where do I sign?", 3, "c", {disc:-1}],
    ["Borrows without writing it down", "Takes the tool, the book or the fiver and has no notion afterwards who lent it or when it should come back.", "Is this yours? I assumed it was mine. It might be mine. It's definitely someone's.", 2, "c", {disc:-1}]
  ]);

  V2.block(out, "Values & Moral Line", "Self-Interested", 242320, [
    ["Takes the good seat while the rest sort it out", "Moves to the best chair, bed or parking space before the group has finished deciding how to share.", "(already in the window seat, shoes off) Oh, were we drawing straws?", 3, "c", {disc:-1, agr:-1}],
    ["Spends the shared fund on the good idea", "Dips into the kitty for something exciting and promises to put it back before anyone checks.", "I'll replace it Friday. The pay-in-advance deal was just too good.", 3, "u", {disc:-1, hon:-1}],
    ["Does today's favourite, owes tomorrow's", "Keeps choosing the pleasant thing now and hands the bill, in every sense, to whoever comes after.", "Future me? He'll cope. Future me has got my whole weekend.", 1, "s", {disc:-1}]
  ]);

  /* ---------- Dialogue grammar ---------- */
  V2.block(out, "Dialogue Grammar Traits", "Disfluencies & Flow", 242350, [
    ["Opens three sentences before finishing one", "Launches into a new clause as another is still half-built and leaves the first dangling in the air.", "So the thing about the — because when we got to the — anyway, the point is it rained.", 5, "c", {disc:-1, pace:1}],
    ["Loses the thread, then enjoys the detour", "Gets interrupted by a thought mid-story and is cheerful about never getting back.", "Where was I? Doesn't matter. This is better. Have you ever seen a heron?", 3, "c", {disc:-1, cur:1}],
    ["Starts the answer and drifts into a new question", "Begins to reply, sees something along the way, and ends up asking the room about it.", "Well, my answer would be — hang on, is that a new sign? When did they put that up?", 3, "u", {disc:-1, cur:1}],
    ["Promises to tell you the end later", "Says 'I'll finish that story another time' without ever planning to finish it.", "Long story. Great ending. I'll tell you at some point. Remind me.", 2, "c", {disc:-1}],
    ["Announces the point and then lacks one", "Says 'my main point is' with great confidence and arrives at a sentence that quietly gives up.", "My main point — and it's an important one — is that, well, there you go.", 3, "u", {disc:-1}],
    ["Trails off into a hand wave", "Ends a half-formed explanation with a vague gesture and a brightly cheerful 'you know'.", "So you take the thing and — (flaps a hand towards the ceiling) — you know.", 1, "s", {disc:-1}]
  ]);

  V2.block(out, "Dialogue Grammar Traits", "Structural Shifts", 242380, [
    ["Switches tense in the middle of a story", "Begins a story in the past, tumbles into the present as it heats up, then gives up on tense altogether.", "So I walked in, and he's just standing there, and I'd already said it, and I go — right.", 2, "c", {disc:-1}],
    ["Reroutes mid-sentence for a better ending", "Spots a funnier way to finish a sentence halfway through and abandons the original mid-clause.", "I think the best thing to do is — actually the funniest thing would be — you know what, never mind.", 3, "u", {disc:-1}],
    ["Starts with 'okay so' and builds from nowhere", "Opens each remark with a casual 'okay so' and then discovers the content only as the words come out.", "Okay so — right — okay so I may have bought a piano.", 2, "c", {disc:-1}],
    ["Reports the plan in the past tense", "Describes a plan as if it already happened, and is surprised later by the gap between the two.", "So we've booked it, and it's all sorted. (nothing has been booked)", 3, "d", {disc:-1, hon:-1}]
  ]);

  V2.block(out, "Dialogue Grammar Traits", "Turn-Taking Grammar", 242400, [
    ["Answers a different question to the one asked", "Hears half of the question and replies to a neighbouring one with total confidence.", "How was the interview? — Oh, the train was fantastic. Quiet carriage, even.", 3, "u", {disc:-1}],
    ["Invites you to continue, then takes over", "Invites the other person to continue and has begun a new story before the invitation is finished.", "Sorry, go on — no, that reminds me, last week I — sorry, you were saying?", 3, "c", {disc:-1, vol:1}]
  ]);

  /* ---------- Vocabulary ---------- */
  V2.block(out, "Vocabulary Traits", "Temporal Orientation & Tense Usage", 242420, [
    ["'Soon-ish'", "Fills the future with elastic words like 'soon-ish', 'at some point' and 'in a bit' that never turn into a date.", "I'll sort it soon-ish. Sort of before the end of the season, probably.", 2, "c", {disc:-1}],
    ["Round numbers for the time", "Gives every arrival time as a vague bracket and treats the minutes as a rough suggestion.", "I'll be there about half-six-ish. Seven. Give or take. Don't wait.", 1, "c", {disc:-1}],
    ["'Any minute now' for an hour", "Uses 'any minute' and 'nearly there' to describe a state that has gone on for a long time.", "Nearly there! Two minutes! (twenty minutes later) Two minutes!", 5, "c", {disc:-1}],
    ["Says 'by the weekend' about everything", "Pins every vague promise to 'the weekend' without saying which one.", "Done by the weekend. A weekend. A weekend this season, I mean.", 3, "u", {disc:-1}],
    ["Yesterday's plan in tomorrow's mouth", "Refers to arrangements that were dropped last week as though they were still the current agreement.", "We're doing Italy this summer. — We cancelled Italy. — Did we? Right. Spain, then.", 3, "d", {disc:-1}]
  ]);

  /* ---------- Mannerisms ---------- */
  V2.block(out, "Mannerisms", "Listening & Attention", 242440, [
    ["Wanders off in the middle of a sentence", "Gets pulled away by a sight, sound or text while the other person is still talking.", "(mid-conversation, drifting towards a window) Hang on. Something's going on out there.", 4, "c", {disc:-1, cur:1}],
    ["Checks the phone under the table", "Glances down at the screen again every few minutes while keeping a fixed smile on the person talking.", "(thumb flicks beneath the tablecloth) Mm-hm. Yes. Go on. Totally with you.", 4, "c", {disc:-1}],
    ["Starts a second conversation next door", "Turns to a neighbour in the middle of a talk and starts a smaller, livelier one beside it.", "(leans sideways, whispers, laughs) Sorry — carry on — what's he saying?", 3, "u", {disc:-1}],
    ["Nods at a rhythm unrelated to the speech", "Nods steadily through a talk with the pace of someone hearing a different tune.", "(nodding, steadily, through the bad news) Mm. Mm. Mm. Lovely.", 1, "s", {disc:-1}],
    ["Asks the same question twice an hour apart", "Absorbs very little of the answer the first time and asks again, innocently, later in the evening.", "And what do you do again? — We covered it — Did we? Remind me, lovely.", 1, "s", {disc:-1}]
  ]);

  V2.block(out, "Mannerisms", "Tactile & Prop Handling", 242470, [
    ["Picks things up and puts them somewhere new", "Handles objects in passing and sets them down in a different place from the one they came from.", "(the scissors go into the fruit bowl) Now they'll be easy to find. Probably.", 2, "c", {disc:-1}],
    ["Leaves cupboard doors open as a trail", "Opens every cupboard in a hunt and leaves the lot hanging in a line behind them.", "(the kitchen, all doors wide) Found it. Don't look at the state of it.", 4, "c", {disc:-1, act:1}],
    ["Leaves the lid off everything", "Opens jars, pens and bottles and moves on, so each small thing dries, spills or goes flat.", "(a pen, uncapped, rolling off the sill) That one writes. It did. It did, once.", 2, "c", {disc:-1}],
    ["Taps three things then forgets the rhythm", "Starts a drumbeat on the table, gives up halfway, and begins a different tune with no pause.", "(tap-tap-tap on the table, then on the cup, then a whistle)", 1, "u", {disc:-1, act:1}]
  ]);

  V2.block(out, "Mannerisms", "Environmental Interaction Mannerisms", 242500, [
    ["Sheds belongings across the house", "Leaves a coat on the stairs, a mug on the sill and a shoe in the hall as a record of the day.", "(trail of items from the door to the sofa) I'm home. I'm sorting it. Look away.", 3, "c", {disc:-1}],
    ["Dumps the shopping, forgets the milk", "Brings home a bag of delightful extras and none of the three things on the list.", "I got olives, a lamp and an octopus. The bread? Ah. I'll pop back.", 3, "u", {disc:-1}],
    ["Sets the table for the meal after next", "Begins a task, drifts into a side job, and ends up preparing for an event that is not today's.", "(laying the good plates for Sunday) It's easier now. We'll be organised.", 1, "s", {disc:-1}]
  ]);

  /* ---------- Warmth, negative pole ---------- */
  V2.block(out, "Personality Traits", "Friendliness — Cold & Distant", 242600, [
    ["Answers a hug with two pats", "Meets an embrace with a quick double tap on the shoulder, the way one might check a parcel for damage.", "(pat, pat) Yes. Good. Lovely. Right, well.", 2, "c", {warm:-1}],
    ["Declines the second cup of tea", "Turns down every lingering offer of a seat, a biscuit or a chat so a visit stays the length it was meant to be.", "No, thank you. I said twenty minutes. It's twenty minutes.", 2, "c", {warm:-1}],
    ["Knows your job, not your children", "Keeps careful track of what a colleague does and nothing about their family, holidays or health.", "Still in logistics? Good. And the — is it a daughter? — yes. Good.", 3, "d", {warm:-1}],
    ["Uses the full formal address for old friends", "Greets people of twenty years' standing with their whole formal title, in a tone that keeps the years in tidy order.", "Mrs Okafor. Good to see you. Do sit, if you like.", 3, "d", {warm:-1, form:1}],
    ["Checks the watch on the family story", "Glances at the time at the exact moment the other person reaches the part that matters to them.", "(a glance at the wrist on 'and then my mother...') Mm. Go on. Briefly.", 3, "c", {warm:-1}],
    ["Rates the evening 'adequate'", "Describes every party in the same measured terms, never saying it was fun even after staying to the end.", "It was a perfectly adequate evening. Thank you for having us.", 1, "c", {warm:-1}],
    ["Talks through four inches of door", "Answers the knock with the chain on and does not extend an invitation inside, whoever is there.", "(through the gap) Yes? — Oh. No. I won't need anything. Good day.", 5, "d", {warm:-1}],
    ["Takes a compliment like a delivery", "Receives praise with a short nod and moves on as if signing for a parcel.", "Noted. Thank you. Next item.", 3, "u", {warm:-1, ego:1}],
    ["Gives their news and never asks for yours", "Replies to 'how are you?' with a fact about themselves and does not return the question.", "Busy. Tired. The bus was late. Is that the file?", 4, "c", {warm:-1}],
    ["One short message, on the day", "Marks a friend's birthday with a brief, correct text at 8am and nothing else all year.", "(8.01am text) Happy birthday. Hope it goes well.", 1, "s", {warm:-1}],
    ["Addresses the group, not the person", "Delivers a personal remark to the room in general, so that nobody in particular has to answer it.", "(to the air) Someone seems to have left the lights on. Thank you in advance.", 4, "u", {warm:-1}]
  ]);

  V2.block(out, "Social Role in a Group", "Outsider", 242620, [
    ["Eats lunch at the desk with the door shut", "Closes the office door at midday so that no one drifts in to chat, and re-opens it at one.", "(the door clicks shut) Lunch. Back at one.", 2, "c", {warm:-1}],
    ["Slips out before the speeches", "Leaves a leaving-do or wedding before the point where everyone gets sentimental.", "(coat on already) Lovely do. I'll catch the early train.", 3, "c", {warm:-1, emo:-1}],
    ["Gives the round of introductions four words", "Says their role and floor when the circle comes round and nothing else about themselves.", "Finance. Third floor. Hello.", 3, "d", {warm:-1}],
    ["Brings a personal cup to the shared kitchen", "Keeps their own mug and washes it the moment it is empty, skipping the communal rota and the chat that goes with it.", "(rinsing it dry, hooking it back) Mine. Saves any bother.", 2, "d", {warm:-1}]
  ]);

  V2.block(out, "Social Role in a Group", "Gatekeeper", 242630, [
    ["Asks who sent you", "Treats every newcomer as a request that needs a reason and a reference before any help is offered.", "Who sent you? And did they say why?", 4, "u", {warm:-1, asrt:1}],
    ["Hands over a form instead of an answer", "Replies to a request for help with paperwork, and judges the person only once it has come back filled in.", "Fill this in. Both sides. Then we'll see.", 3, "c", {warm:-1, form:1}],
    ["Keeps the visit in the hallway", "Greets the guest by the coat stand and never moves on to the sitting room, so the door stays within reach.", "(by the hat stand) That's the parcel. Mind the step.", 3, "d", {warm:-1}]
  ]);

  V2.block(out, "Attachment & Intimacy Style", "Avoidant", 242640, [
    ["Keeps friendship to a quarterly lunch", "Sees friends on fixed dates and never in between, and treats the gap as a feature.", "See you in March. Same place. Half twelve.", 3, "u", {warm:-1}],
    ["Splits the bill to the penny", "Works out each person's exact share, down to the starter one of them skipped, and finds it cleaner than treating anyone.", "You had the starter; I didn't. That's eleven forty.", 1, "u", {warm:-1}],
    ["Offers help only on request", "Offers help in a form that leaves the other person to do all the asking, and goes back to what they were doing.", "Shout if you need anything. (turns the page)", 2, "d", {warm:-1}],
    ["Hears you out for ten fair minutes", "Gives a friend in trouble a measured block of attention, sums it up, and asks whether that covers it.", "Right. I've heard you. Does that cover it? I've a call at three.", 4, "d", {warm:-1, emo:-1}],
    ["Keeps the coat on in your house", "Stays in a coat with the bag on their knee to signal that the visit will be short.", "(coat zipped, bag on knee) Just a quick one. I won't sit properly.", 3, "u", {warm:-1}]
  ]);

  V2.block(out, "Mannerisms", "Social & Boundary Mannerisms", 242660, [
    ["Backs off a half-step from anyone close", "Takes a half-step away whenever another person closes the distance, with a polite nod to cover it.", "(a half-step back, a nod) Plenty of room, thank you.", 2, "c", {warm:-1}],
    ["Holds the keys all evening", "Stays by the door at a gathering with the car keys already in hand as a promise to leave.", "(keys out, jangling gently) Don't mind me. Just checking the time.", 4, "c", {warm:-1}],
    ["Lets the wave go unreturned", "Gives a nod to the neighbour across the road and keeps the hand where it was.", "(a nod to the one across the road; the hand stays in the pocket)", 1, "s", {warm:-1}],
    ["Reads the lift floor numbers", "Rides with a stranger in a studied silence, eyes on the display.", "(floor numbers, floor numbers, floor numbers) — Mm.", 1, "s", {warm:-1}]
  ]);

  V2.block(out, "Vocabulary Traits", "Register & Formality Spectrum", 242690, [
    ["Refers to a friend by role", "Names the person in front of them by function rather than relationship, even in a private talk.", "The tenant has asked for a repair. I'll relay it to the landlord. (the landlord is a sibling)", 3, "u", {warm:-1, form:1}],
    ["Signs off 'Regards' to family", "Closes every message, even those to parents and siblings, with the same neutral word.", "Dear Mum, flights confirmed. Regards.", 1, "s", {warm:-1, form:1}],
    ["Answers 'love you' with 'and you'", "Responds to an open affection with a short, correct echo, and moves on to goodbye.", "Love you, Dad. — Yes. And you. Goodbye.", 3, "u", {warm:-1, emo:-1}]
  ]);

  V2.block(out, "Conflict & Stress Response", "Flight (remove yourself)", 242710, [
    ["Answers a plea with 'noted'", "Responds to a person's raw feelings with a single administrative word and a closed laptop.", "I'm really hurt by this. — Noted.", 3, "c", {warm:-1, emo:-1}],
    ["Books the difficult talk for office hours", "Moves any emotional conversation into a diary slot, with an agenda, a start time and a stop time.", "Can we do this Thursday, ten past two? I've blocked half an hour.", 3, "d", {warm:-1}]
  ]);

  V2.block(out, "Humor Style", "Humorless & Absent", 242730, [
    ["Smiles at a joke after a short delay", "Registers the punchline a beat late and produces a courteous breath through the nose.", "(a pause, then a short exhale) Ah. Yes. Very good.", 2, "u", {warm:-1}],
    ["Stays out of the office banter", "Stands apart from the running jokes at work, with the sense of being at a different event.", "I'm here for the figures, really.", 2, "c", {warm:-1}],
    ["Gives the joke a score", "Hears a funny story out and offers a flat, fair rating, with a note on the delivery.", "Seven out of ten. Good delivery. Slightly long.", 2, "s", {warm:-1}]
  ]);

  V2.block(out, "Dialogue Grammar Traits", "Spoken Compression", 242750, [
    ["Greets with the time, not a hello", "Opens a meeting by stating how late or early everyone is and gets on with it.", "Four minutes late. Come in. Shut the door.", 3, "d", {warm:-1}],
    ["Answers in a numbered list", "Replies to each point in order and in as few words as possible, with no connecting warmth.", "One: yes. Two: no. Three: Thursday.", 1, "s", {warm:-1, intel:1}],
    ["Drops the pronouns", "Strips each message down to verb and object, as in a telegram.", "Got your message. Will reply. Busy week.", 3, "c", {warm:-1}]
  ]);

  V2.block(out, "Values & Moral Line", "Self-Interested", 242770, [
    ["Mentions the favour balance", "Keeps a mental ledger of every favour and states the running total when it is next due.", "That's two I've done you. Not counting the lift.", 3, "u", {warm:-1}],
    ["Opts out of the whip-round", "Declines to give to the leaving collection, the group card and the shared cake as unnecessary.", "Not for me, thanks. I didn't know her well.", 2, "c", {warm:-1}]
  ]);

  /* ---------- Manners, negative pole ---------- */
  V2.block(out, "Personality Traits", "Manners — Crude & Ill-Mannered", 242800, [
    ["Picks teeth at the table", "Works a thumbnail or a matchstick between the molars during the meal and examines the result.", "(a thumbnail in the back teeth) Chicken. Gets in everywhere.", 3, "c", {man:-1}],
    ["Boots on the opposite seat", "Props both feet on the seat opposite on a train or in a waiting room and ignores the looks.", "(boots up on the train seat) Plenty of room. I'm only resting them.", 2, "c", {man:-1}],
    ["Starts the meal with their hands", "Tears the bread, licks a thumb and tastes from the pot before anyone else has sat down.", "(licks a thumb, reaches into the pan) Can't be doing with the fuss.", 2, "u", {man:-1}],
    ["Answers the door with 'What?'", "Greets a caller with a flat question rather than a hello and holds out a hand for whatever they carry.", "What? — It's the post. — Right. Give it here.", 4, "c", {man:-1}],
    ["'No offence' as a warning label", "Says 'no offence' as a prelude to the thing that will offend, in a voice that suggests the matter is closed.", "No offence, but this is the worst plan I've heard all year. Anyway.", 5, "c", {man:-1, hon:1}],
    ["Takes the biggest portion and says so", "Helps themselves to the largest slice and announces why, to a table that has not finished choosing.", "Biggest one's mine. I'm starving. You all dithered.", 5, "c", {man:-1, agr:-1}],
    ["Swears through the grace", "Mutters an oath at the dog, the wine or the steam during a spoken blessing and carries on.", "For what we are about to — bloody hell, the dog — receive.", 5, "d", {man:-1, vol:1}],
    ["Lets the door swing back", "Walks through a door and leaves it to close on whoever is behind, without a glance round.", "(the door swings back; someone with a tray catches it with a hip)", 2, "c", {man:-1}],
    ["Lists the night's symptoms at dinner", "Gives a full run-down of their stomach, back and bowel at the table, unprompted and in detail.", "Worst night. You'll not want the details. Well — it started at three.", 5, "u", {man:-1, vol:1}]
  ]);

  V2.block(out, "Mannerisms", "Social & Boundary Mannerisms", 242830, [
    ["Reads over your shoulder aloud", "Leans in to a friend's screen and reads the messages out loud, commenting as they go.", "(leaning in) Who's that from? Is that your landlord? What's he want?", 3, "c", {man:-1}],
    ["Has a look in the fridge", "Opens a host's fridge on arrival and sniffs, comments and helps themselves without asking.", "(head in the fridge) What've you got? Is this cheese on its way out?", 4, "c", {man:-1}],
    ["Takes the phone out of your hand", "Plucks a screen away from the owner to see a photo, and starts scrolling past it.", "Give us that. Look — you've got it all wrong. (scrolls)", 3, "u", {man:-1}],
    ["Pats a stranger's dog without asking", "Crouches to a passing animal and gets both hands into its coat before looking up at the owner.", "(already crouched, hands in fur) Good lad. Whose is he?", 2, "u", {man:-1}]
  ]);

  V2.block(out, "Dialogue Grammar Traits", "Turn-Taking Grammar", 242860, [
    ["Hurries the story with 'and then?'", "Rushes a storyteller with a drumbeat of 'and then?' and 'so?', pulling the tale towards its ending before it is ready.", "Right, right — and? And then? Come on, the ending.", 5, "c", {man:-1, pace:1}],
    ["Supplies the wrong ending, loudly", "Cuts in on the other person's sentence with a confident, mistaken conclusion and finds the correction faintly annoying.", "...and then she — ran off to join the circus! — No. Moved to Leeds.", 3, "d", {man:-1, vol:1}],
    ["Starts the instant the call connects", "Begins the topic before the other end has said hello, and treats the greeting as a delay.", "(line picks up) — No, listen, about Thursday —", 3, "u", {man:-1, pace:1}],
    ["Replies with a grunt from behind the paper", "Gives a short sound in place of an answer and does not lower the paper.", "(a grunt, from behind the paper)", 2, "c", {man:-1}],
    ["Says 'anyway' over the end of your sentence", "Pivots to their own topic with a clipped 'anyway' before the other person is done speaking.", "Mm, anyway, so —", 5, "c", {man:-1, vol:1}]
  ]);

  V2.block(out, "Vocabulary Traits", "Directness & Literalness", 242890, [
    ["Says 'nah' to everything offered", "Turns down the coffee, the seat and the hello with the same one-syllable word.", "Tea? Nah. Seat? Nah. Come in? ...Nah.", 2, "c", {man:-1}],
    ["Calls hospitality 'a faff'", "Waves off a host's trouble with the word 'faff' and asks for something plainer.", "Don't make a fuss. Tea's a faff. Just a glass of water.", 3, "u", {man:-1}],
    ["Opens with the complaint", "Starts a visit with the thing that is wrong, rather than a greeting.", "Right, first thing, your gate's off its hinge. Morning.", 4, "c", {man:-1}],
    ["Names the awkward subject at the table", "Raises the sore topic in front of everyone and returns to the potatoes without a flicker.", "So Dave's lost the job, then? How's that going? Pass the potatoes.", 5, "d", {man:-1, hon:1}]
  ]);

  V2.block(out, "Vocabulary Traits", "Register & Formality Spectrum", 242910, [
    ["'Mate' as a door closing", "Uses 'mate' repeatedly as a firm, flat full stop to end a topic.", "Mate. Mate. It's fine. Moving on.", 3, "u", {man:-1, form:-1}],
    ["Greets the vicar like a lad from the pub", "Brings the same easy, rough register to the church, the bank and the school gate.", "Alright, Rev? Cracking sermon. Bit long.", 2, "d", {man:-1, form:-1}]
  ]);

  V2.block(out, "Social Role in a Group", "Leader", 242920, [
    ["Gives orders with no please", "Points and names a task for each person in a single breath and expects it done.", "You — that end. You — hold this. Go.", 5, "c", {man:-1, asrt:1}],
    ["Skips the welcome and opens the meeting", "Calls everyone in, does not greet them, and begins with the numbers.", "Sit down. Right. We're behind, we're over budget, and I want answers.", 3, "u", {man:-1, asrt:1}]
  ]);

  V2.block(out, "Conflict & Stress Response", "Fight (attack the threat)", 242930, [
    ["Jabs a finger with each word", "Stabs a finger at the table or the air on each syllable of the point.", "(finger on the table) No. It. Isn't.", 3, "c", {man:-1, asrt:1}],
    ["Says it in front of everyone", "Names the unwelcome truth in the middle of the room, without taking the person aside first.", "Everyone's thinking it, I'm just saying it. This plan's rubbish.", 4, "u", {man:-1, hon:1}]
  ]);

  V2.block(out, "Humor Style", "Teasing as Affection", 242940, [
    ["Takes the mick during the wedding speech", "Uses a toast to roast the couple with fond, rough jokes that go half a degree too far.", "(microphone) I'd like to thank the groom for choosing the buffet. It's the best part.", 3, "u", {man:-1, vol:1}],
    ["Roars at a friend's slip of the tongue", "Hoots loudly at a mispronounced word and repeats it three times for the room.", "You said 'baked' instead of 'booked'! Again! Say it again!", 4, "c", {man:-1, vol:1}],
    ["Tells the embarrassing story at the party", "Sets up the one tale the other person least wants told, and tells it over their protests.", "Tell them about the swan. Go on. He won't, so I will.", 5, "c", {man:-1, vol:1}]
  ]);

  V2.block(out, "Habits & Vices", "Substance & Consumption", 242960, [
    ["Tastes from the pot and puts the spoon back", "Samples a shared dish with the serving spoon, licks it and returns it to the pot.", "(spoon in, mouth, spoon back in) Needs salt.", 3, "c", {man:-1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_POLES_C);
