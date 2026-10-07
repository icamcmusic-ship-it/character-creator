/* v2 content: pole balance (poles-d). IDS 243000-243999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_POLES_D = (function(){
  const out = [];
  const I = {intel:-1}, A = {asrt:-1}, M = {act:-1};

  /* ---------- intel -1 ---------- */
  V2.block(out, "Personality Traits", "Intelligence — Instinctive & Unanalytical", 243000, [
    ["Explains by telling you what happened to their cousin", "Meets a request for reasons with a story about a relative, a bad winter and a leaking roof, and leaves the moral to the listener.", "You want to know why not? My cousin Pauline did her own loft in '09, and I'll say no more than that.", 3, "c", I],
    ["Goes by the salesman's manner, not the figures", "Hears the quote, ignores the total, and decides on how settled the seller seems when the price is said.", "Eight thousand, he said, and he didn't even blink. Done. Where do I sign?", 3, "c", I],
    ["Picks up the feeling in the room before the facts", "Knows something has gone wrong from a change in how the cups are put down, and acts on it before anyone has said a word.", "(setting the tray down slowly) Somebody's had bad news. Don't ask me how, I could hear it in the spoons.", 1, "s", I],
    ["Wants the headline and no working", "Cuts in on anyone who starts a sentence with 'the background is', and asks only whether it is good news or bad.", "Stop, before the background. Good news or bad news? I'll take the rest in my own time.", 3, "c", I],
    ["Measures with a good glug", "Cooks, mixes and pours by eye and by sound, and is honestly baffled when asked for the quantity.", "How much oil? Till it sounds right. A good glug. I can't put it any plainer than that.", 1, "u", I],
    ["Dates events by the weather and the garden", "Places every event by the weather, the football or the state of the garden, and is rarely wrong by more than a month.", "It was the summer the shed flooded. So, what, two thousand and eight?", 1, "s", I],
    ["Asks what the chart is saying in words", "Looks at a graph with polite attention, then asks someone to say in one sentence whether it's going well.", "(tilting their head at the slide) Lovely colours. So is that a good line or a worrying line?", 1, "c", I],
    ["Settled by the first minute", "Forms a firm view of a stranger on the doorstep and treats everything afterwards as decoration.", "I knew at the gate. Didn't like how he shut it. Nothing since has changed my mind.", 5, "c", I],
    ["Proverbs where the proof should be", "Closes a disagreement with a saying from a grandmother and considers the matter evidenced.", "Never trust a man who doesn't like dogs. There. That's all the proof I've ever needed.", 3, "d", I],
    ["A bad feeling, announced loudly", "Turns a hunch into an instant order to leave, change plans or ring someone, with no reasons offered and none wanted.", "I've got a feeling and we're going. Now. Coats. I'll explain nothing, move!", 5, "c", I],
    ["Rounds everything to about right", "Takes a sum, a distance or a deadline, calls it about right, and moves on without checking it twice.", "That'll be about right. Near enough. Nobody's ever died of near enough.", 4, "c", I],
    ["Believes the person over the paperwork", "Takes someone's word at the door against a printed form, a receipt and a page of terms and conditions.", "It says here you can't. But Gary told me I could, and Gary stands behind a handshake. So I'm going in.", 3, "u", I],
    ["Stops listening at the second 'however'", "Drops out of a balanced argument at the first turn and answers the opening half as if it were the whole thing.", "Hang on. You said it was fine, then there was a however. So which is it? Fine or not?", 5, "c", I],
    ["Chooses by the name they like", "Picks between two items with identical specifications by whichever name or colour feels friendly.", "They're the same machine. So the blue one. It looks like it wants to be mine.", 2, "c", I]
  ]);

  V2.block(out, "Personality Traits", "Intelligence — Situational", 243025, [
    ["Trusts instinct only about people", "Reasons carefully about the boiler and the budget, then picks friends, lodgers and dentists entirely by feeling.", "Spreadsheet for the car, sure. The lodger? He just seemed a kind man on the step.", 1, "u", I],
    ["Goes vague when the figures arrive", "Quick and warm on any topic until money or statistics come up, then answers in generalities and slides the paper to someone else.", "(sliding the statement across) You're better with the numbers. Tell me if it's bad.", 4, "c", I],
    ["Feels their way through a form", "Fills in each box by guessing what it wants rather than reading the notes, and corrects it only when it comes back.", "It said 'previous address' so I put where I'd like to be. It's come back. Fair enough.", 3, "d", I],
    ["Says 'trust me' when pressed for reasons", "In a tight moment, drops the explanation entirely and asks for faith instead.", "No time to go through it. Trust me. Have I ever steered you wrong on a day like this?", 4, "c", I],
    ["Tiredness turns them intuitive", "Reasons fine in the morning, and by evening is deciding on whatever feels right and regretting the odd one at breakfast.", "(seven o'clock) Just book it. It feels right. (next morning) Why did we book Skegness?", 1, "u", I],
    ["Reads the other party, not the contract", "Judges an agreement by how the people across the table behave in the meeting and signs on that, not on the clauses.", "Page forty I haven't read. But she poured my tea before hers. I'm happy.", 3, "d", I]
  ]);

  V2.block(out, "Humor Style", "Warm & Playful", 243050, [
    ["Acts out the person instead of explaining the joke", "Gets the laugh by doing the voice and the walk of whoever it happened to, and never reaches a punchline as such.", "(chin down, slow voice) And the vicar goes, 'Well.' Just 'well'. Oh, you had to be there.", 5, "c", I],
    ["Humour that is just a memory told warmly", "Tells a funny story with no set-up or turn, simply the details in order, and the room laughs at the details.", "(softly) Gran put the trifle on the roof of the car. And then she drove off. That's all of it.", 2, "s", I],
    ["Misses the pun and loves the anecdote", "Looks politely blank at wordplay but is helpless at a plain story about a dog and a vicar's hat.", "Sorry, what was the clever bit? ...Oh, but the dog! And the hat! (wheezing)", 2, "u", I],
    ["Funny voices in place of punchlines", "Reaches for an accent or a squeak whenever a joke needs finishing, and takes that as the finish.", "(in a squeaky voice) And the little man says, 'Not today, thank you.' (waits, delighted)", 5, "c", I],
    ["Tells the one about the time everything went wrong", "Offers a disaster as the joke itself, with the cold bath, the dropped cake and the whole street watching.", "Right, the cake. Cold, she was, sat in the bath, the cake went (arms wide) no, I'll start again.", 3, "d", I]
  ]);

  V2.block(out, "Habits & Vices", "Avoidance & Procrastination", 243075, [
    ["Presses the buttons before the manual", "Treats a new machine as something to be talked into working by trying everything, with the booklet kept for emergencies.", "I'll just press this and see. Oh. Is that supposed to be smoking?", 5, "c", I],
    ["Judges the envelope and leaves it on the shelf", "Decides from the window and the font whether a letter is bad news, and parks the bad-looking ones unopened.", "Brown envelope, window. No, that one's got a feeling to it. Shelf.", 3, "u", I],
    ["Reads only the last page and takes it on trust", "Turns to the conclusion of a report or a book and accepts the author's word on everything before it.", "(flipping to the back) Right, it's fine. I'll take their word for the rest.", 1, "s", I],
    ["Makes it up from the picture on the box", "Opens the flat-pack, studies the diagram for four seconds, and carries on by sense, usually ending with a spare piece.", "There's a bag of screws left. They'll have been spares. I'm sure they were spares.", 3, "c", I],
    ["Avoids the spreadsheet by describing it", "Gives an oral summary of the household finances from memory instead of opening the file, and reassures everyone it's roughly fine.", "It's all in my head and we're roughly even. Don't make me open the thing.", 3, "d", I],
    ["Waits for someone to be passing", "Leaves a mug or a bag on the floor until somebody else is going that way and can carry it too.", "(nodding at the mug on the carpet) I'll leave it there. Somebody'll be going through.", 2, "c", M],
    ["Rings the shop instead of walking round", "Phones to ask if an item is in stock, counts that as most of the job, and leaves the walk for tomorrow, then next week.", "I rang to check they've got it. They have. So that's most of it done, really.", 3, "u", M],
    ["Makes do rather than go back upstairs", "Prefers an awkward substitute within reach to a short trip for the proper one, and defends the substitute.", "A butter knife'll do for the screw. Don't look at me like that. It's doing it.", 3, "d", M],
    ["Has it delivered to the door", "Pays a fee to have one tin of paint brought up the path and counts the fee as the price of staying in.", "It's four pounds to bring it to the door. Four pounds for not putting my shoes on. Bargain.", 4, "c", M]
  ]);

  V2.block(out, "Social Role in a Group", "Skeptic", 243100, [
    ["Distrusts anything with a graph in it", "Takes the arrival of a chart as a sign someone is selling, and says so pleasantly to the room.", "A graph. Lovely. Whenever someone brings a graph, there's a bill coming.", 4, "u", I],
    ["Smells the pitch before it starts", "Goes still and polite a few seconds into a sales talk, without being able to say what gave it away.", "(smiling, arms folded) Nothing wrong with it. It just smells like a pitch, that's all.", 3, "u", I],
    ["Needs to meet the person behind the claim", "Won't weigh a study or an article until they know who wrote it, where they live and whether they would lend a ladder.", "Never mind the paper. Who is she? Where's she from? Would she lend you a ladder?", 2, "s", I],
    ["Asks what Nan would have said", "Tests a new idea against a remembered kitchen-table verdict and lets that decide.", "Would your nan have stood for it? No? Then I doubt it's as new as they say.", 3, "d", I]
  ]);

  V2.block(out, "Social Role in a Group", "Leader", 243125, [
    ["Decides in the car park", "Settles the plan on the walk back to the car and tells the team afterwards, having felt it out rather than worked it up.", "(keys out) I've had a think on the way over. We go with the Leeds lot. Don't ask me for slides.", 3, "c", I],
    ["Rallies with a story, not a plan", "Gives the team a tale about the first shop and the bad winter and calls that the strategy.", "Let me tell you about the first winter. Hands in the water, no heating. That's the plan, really.", 3, "d", I],
    ["Calls the mood of the room a decision", "Ends a long meeting by announcing what they sensed everyone wanted, with no vote and no tally.", "I've heard enough, and I can feel where we all are. We'll go ahead. Lovely, thanks all.", 2, "u", I]
  ]);

  V2.block(out, "Conflict & Stress Response", "Freeze (shut down)", 243150, [
    ["Fog comes down when the numbers start", "Goes still and nods through a stream of figures and clauses, takes in none of it, and says to send it over.", "(nodding steadily, eyes on the table) Mm. Yes. Send it over and I'll have a look.", 3, "c", I],
    ["Answers the tone when the words stop making sense", "In a bewildering row, drops the content and replies only to how loud and how angry the other voice is.", "I don't know what the clause is. I know you're upset. I'm sorry you're upset.", 2, "u", I],
    ["Sits down where they are", "Lowers onto the nearest step or kerb when a row turns heavy, as though standing were the part that failed.", "(on the bottom stair, hands between knees) Give me a minute. Just here. I'm not going anywhere.", 3, "d", M],
    ["Asks for the one-sentence version", "Under pressure, says 'what's the short version' to a long accusation and waits for a single plain line.", "Just give me one sentence, please. One. Then I can answer it.", 4, "u", I]
  ]);

  V2.block(out, "Attachment & Intimacy Style", "Secure", 243175, [
    ["Knows they're loved from the kettle", "Reads affection in small household acts, such as a made tea or a lamp left on in the hall, and never needs it said.", "You didn't have to say it. You put the lamp on in the hall. I know what that means.", 1, "s", I],
    ["Remembers a marriage by its meals", "Counts the years of a relationship in dinners and kitchens, and cannot give dates but can give the soup.", "Thirty years? I couldn't tell you the date. The first soup, though: leek, no salt, I wept.", 1, "s", I],
    ["Says 'I just know' about the future", "Meets worries about whether it will last with a calm certainty that rests on nothing they could list.", "Will we be all right? I just know. Don't ask me for a reason. We will.", 3, "c", I],
    ["Keeps no ledger and couldn't if they tried", "Has no idea who did the last three washing-ups and finds the question faintly funny.", "Who did more? I haven't the faintest. It evens out. It always has. Tea?", 1, "d", I],
    ["Reads a mood through a wall", "Can tell from the sound of keys on the hook what sort of day their partner has had, and puts the right thing on.", "(from the kitchen, not looking up) Keys went down hard. Sit. I'll do the pasta. Talk or don't.", 3, "u", I]
  ]);

  V2.block(out, "Values & Moral Line", "Pragmatic & Flexible", 243200, [
    ["Asks what a decent neighbour would do", "Settles a moral question by picturing the person next door and what they would do, with no principle invoked.", "I don't know the rule. I know what Mrs Okafor next door would do, and I'll do that.", 3, "d", I],
    ["Does as the family has always done", "Treats an inherited custom as the answer to a modern problem and is puzzled to be asked for a reason.", "We've always settled it over a pie. Why would we do it differently now?", 2, "c", I],
    ["Feels the right thing in the stomach", "Judges a deal as clean or dirty by a physical unease at the table, and walks away from sound offers that give it.", "It's legal, he says. Fine. My stomach says no. I'm going home.", 3, "u", I],
    ["Tests a choice against their own wake", "Weighs a decision by imagining it being mentioned at their funeral tea, in a plain church hall.", "Would they say it over the sandwiches at my funeral? No? Then I'd best not.", 3, "d", I],
    ["Goes along to keep things pleasant", "Treats the group's choice as the right one and will not hold a different line aloud, even when it nags.", "It's what everyone's decided. No sense making a thing of it. It nags a bit, but no.", 2, "c", A],
    ["Leaves the judging to someone better placed", "Passes any question of right and wrong to the vicar, the union man or an aunt, and abides by the verdict.", "Ask Aunty Jo. She'll know what's right. I'll do whatever she says. She always says.", 2, "u", A]
  ]);

  V2.block(out, "Vocabulary Traits", "Abstractness & Sensory Modality", 243225, [
    ["Gives directions by landmark and smell", "Sends people past the chip shop and the cut grass and the bus that smells of crisps, never by street names or compass points.", "Past the chippy, then you'll smell the bakery. Left at the dog that barks. You can't miss it.", 2, "c", I],
    ["Describes people as the weather", "Sums up an acquaintance as a wet Tuesday or a bright morning and considers the character covered.", "Marcus? Oh, he's a wet Tuesday. Lovely man. Wet Tuesday.", 5, "c", I],
    ["Swaps every abstraction for an object", "Hears 'a bottleneck' or 'a trend', asks what it looks like, and talks about a funnel or a hill from then on.", "A bottleneck. So, a funnel? Right. So we've got a funnel and we're pouring too fast.", 3, "u", I],
    ["Names an idea after whoever said it", "Calls a concept 'Dave's thing' or 'Mum's rule' for good, and cannot be moved on to the textbook name.", "We're doing Dave's thing, where you leave it overnight. Don't call it anything else.", 2, "s", I],
    ["Measures in mugs and bath-fulls", "Gives sizes, amounts and distances in kitchen and household units, and is cheerful about it.", "It's three mugs of flour, a bath-full of water, and a walk of about two cups of tea.", 5, "c", I],
    ["Judges everything by smell or taste", "Uses 'smells off', 'tastes wrong' or 'leaves a flavour' as complete verdicts on plans and people.", "Don't like the smell of this one. Leaves a taste. Pass.", 4, "c", I],
    ["Gives a mood a room of its own", "Talks about moods as places: a cold room, a long corridor, a window left open.", "Not sad, exactly. More a long corridor with the lights off. You just walk it.", 3, "d", I],
    ["Says what folk do for what folk believe", "Leaves out principles and describes only what people do on a Saturday, as if that were the whole argument.", "Folk round here don't believe in anything, love. They just put the bins out on Sunday.", 2, "u", I]
  ]);

  V2.block(out, "Vocabulary Traits", "Precision & Specificity Level", 243250, [
    ["'Loads' for any number above ten", "Reports a count of forty or four hundred in the same word and sees no problem in that.", "There were loads of them. Loads. Maybe forty, maybe four hundred. Loads.", 5, "c", I],
    ["'About' in front of every figure", "Cannot give a time, a price or an age without a softener, and the softener is the whole answer.", "It's about six, give or take. Cost about forty. She's about eighty, I'd say.", 1, "c", I],
    ["Tells the time by meals", "Names the hour by what is on the table or in the pan: about tea, just after elevenses.", "Come round about tea. Not tea-tea. Pre-tea. When the kettle's thinking about it.", 3, "u", I],
    ["Dates the past by what closed", "Places events by which shop or pit shut down, never by calendar year.", "That was before the Woolies shut. Or just after. One of those.", 1, "u", I],
    ["Says 'you know the one'", "Drops the name of a place or an object and trusts the listener to supply it from shared feeling.", "Take the road with the, you know the one. With the thing. Past it.", 3, "c", I],
    ["Calls a percentage 'most of it'", "Reports progress as most of it, quite a bit or a fair chunk, and bristles gently at a request for a figure.", "How far along? Most of it. A fair chunk. Don't make me give you a number.", 3, "c", I],
    ["Counts in handfuls and fair fews", "Gives amounts as a handful, a fair few or a good bit, and is sure that is a measure.", "A handful of eggs, a fair few of the big ones, and a good bit of milk. That's the lot.", 1, "c", I]
  ]);

  V2.block(out, "Dialogue Grammar Traits", "Structural Shifts", 243275, [
    ["Starts with the ending, then tells the tale", "Announces the conclusion first and then travels back to it through a long story about someone's uncle.", "We're not going. Let me tell you why. Back in '98, my uncle Ray took us to Rhyl, and", 3, "u", I],
    ["'Anyway' instead of 'therefore'", "Reaches the end of an argument by the word 'anyway' rather than by 'because' or 'so', and counts it as concluded.", "And that's him gone, and the shed's still there, so, anyway. That's that.", 2, "c", I],
    ["Argues by 'imagine if it were you'", "Replaces a general point with a hypothetical in which the listener is the one it happens to.", "Imagine it's your nan in that bed. Imagine it. Now tell me about your policy.", 4, "c", I],
    ["Ends on the moral of the tale", "Finishes any account with 'and that's why you never' and treats the line as the proof.", "And that's why you never lend a man your ladder. There you are.", 4, "c", I],
    ["Lets 'it's just how it is' fill the reason", "Begins a reason and swaps the middle of it for a shrug of grammar.", "I do it that way because, well. It's how it's done. It's just how it is.", 2, "c", I],
    ["Tells the past in the present, beat by beat", "Slips into the present tense for an old event, acting out every beat, and does not return for the facts.", "So I walk in, right, and she's just standing there, and I say, 'Well?' and she says nothing.", 3, "d", I],
    ["Builds a case from 'and then'", "Strings an explanation together with 'and then' and no cause between the links, and finds it complete.", "And then the post came, and then the dog went mad, and then we knew, didn't we.", 2, "c", I]
  ]);

  V2.block(out, "Dialogue Grammar Traits", "Anchors & Fillers", 243300, [
    ["'I just feel like' before every claim", "Opens each statement with a feeling rather than a premise, and treats the feeling as the footing.", "I just feel like Thursday's wrong. I just feel like it. Can we say Friday?", 3, "c", I],
    ["'You just know, don't you?' as the proof", "Closes an argument by appealing to the listener's own instinct as if it were a shared exhibit.", "He's trouble. You just know, don't you? You can't tell me you don't.", 5, "c", I],
    ["'Funny thing is' before a story", "Introduces every explanation with a runway phrase and then takes the long way round to the point.", "Funny thing is, my brother had that exact same boiler. Funny thing is, he never", 2, "u", I],
    ["'Gut feeling' as a full stop", "Ends a statement by naming it a gut feeling, and considers further questions impolite.", "It's a gut feeling. Gut feeling. End of.", 5, "c", I],
    ["'No rush at all' on the end of a request", "Tags a favour with reassurance that there is no hurry, in the hope it will be done quickly anyway.", "Could you look at it? No rush at all. Whenever. Next week's fine. No rush.", 3, "c", A],
    ["'Only if you want' on every invitation", "Attaches an exit to every invitation so that the other person need never feel pushed.", "We're having a few round Saturday. Only if you want to. Honestly. No pressure.", 2, "c", A],
    ["Opens with 'I don't suppose you could'", "Starts requests with a supposition of refusal and gives the listener every chance to take it.", "I don't suppose you'd be going past the post office? Only if you were.", 3, "u", A],
    ["'If you're sure' after their own offer", "Makes an offer of help and then hands it straight back with a question about whether the other person is sure.", "I could drive you. If you're sure. Only if you're really sure.", 2, "c", A]
  ]);

  /* ---------- asrt -1 ---------- */
  V2.block(out, "Personality Traits", "Assertiveness — Passive & Yielding", 243325, [
    ["Hints at the thermostat, never touches it", "Raises a cold room as a general remark and waits for someone else to act on it.", "Bit nippy in here, isn't it? Funny how it gets nippy. (does not move)", 4, "c", A],
    ["Waves people through for a full minute", "Holds a door or a gap until the other person goes first, and then holds it again for the next.", "No, after you. No, really, after you. I'm only standing here.", 5, "c", A],
    ["Eats what arrives", "Takes the wrong dish from the waiter with a smile, finishes it, and says it was lovely.", "It's lovely, thank you. (it is the fish; they ordered the soup) Really lovely.", 4, "c", A],
    ["Accepts the word put in their mouth", "Agrees warmly when someone finishes their sentence wrongly, and carries on as though that was the point.", "Yes, that's it, exactly. (it was not what they meant) Exactly.", 3, "u", A],
    ["Puts a request in the passive voice", "Raises a want as something that might happen, with no one doing it, in the hope the right person will hear.", "It might be nice if the bins were taken out at some point. By someone. Eventually.", 3, "d", A],
    ["Holds the fork until the host lifts theirs", "Waits with the cutlery in hand and the food cooling until the person in charge begins.", "(fork hovering, eyes on the host) Please, please start. I'm happy to wait.", 1, "s", A],
    ["Drafts the firm email and sends the soft one", "Writes the sentence they mean, and then sends a different, breezier one that asks for nothing.", "I wrote it properly. Then I sent 'just checking in!' Both are in my drafts.", 3, "u", A],
    ["Buries the one they want at the end of two", "Lays out two options in an order that leaves their real choice trailing last, in a smaller voice.", "We could do the cinema. Or, I did notice the gallery's on. No, either. Either's good.", 1, "s", A],
    ["Ends every message with 'no need to reply'", "Closes even an urgent text by releasing the reader from answering it.", "Could you sign it by Friday? No need to reply to this. Honestly. Just if you've time.", 2, "c", A],
    ["Lets the queue-jumper in, then tells it at home", "Says nothing as someone steps ahead in the line, and gives the full account over supper.", "(to the empty kitchen, later) He just stepped right in. Right in. I said, 'Go ahead.'", 3, "u", A]
  ]);

  V2.block(out, "Personality Traits", "Assertiveness — Situational", 243350, [
    ["Firm for others, pliant for themselves", "Argues hard with the council on a neighbour's behalf and cannot send back a cold coffee of their own.", "(to the council, steely) That is not acceptable. (to the waiter, small) No, it's lovely, thank you.", 3, "d", A],
    ["Speaks up after the meeting, in the corridor", "Holds back through the agenda and then catches the chair's sleeve outside to say what they meant to say inside.", "(catching a sleeve) Could I mention something? I didn't like to, in there.", 3, "c", A],
    ["Takes the lead only on the third invitation", "Needs to be pressed more than once to accept a role, and then does it well, having needed the asking to count.", "Oh, I couldn't. No. Well. If everyone really. Well, all right, then.", 1, "s", A],
    ["Thanks the call centre for the delay", "Rings to complain about a failed delivery and ends by thanking the person on the line for their patience.", "It's not a problem at all, honestly. Thanks ever so much. Bye, bye, thank you.", 5, "c", A],
    ["Takes the side of whoever spoke last", "Agrees with each speaker in turn and holds the final view for as long as nobody else is speaking.", "You're right. (the next person speaks) You're right. (silence) I think we're all agreed.", 3, "d", A],
    ["Asks leave to use what is theirs", "Seeks permission before sitting in their own chair, using their own mug or speaking in their own meeting.", "Is it all right if I sit? I know it's my desk. Is it all right, though?", 5, "d", A]
  ]);

  V2.block(out, "Social Role in a Group", "Peacemaker", 243375, [
    ["Takes the draughty seat so nobody argues", "Settles a squabble over the good seats by claiming the worst one before the discussion starts.", "I'll have the one by the door. No, honestly, I like a draught. Sit, sit.", 1, "c", A],
    ["Steps out so two people can stop", "Leaves the room quietly when a row begins so neither side has an audience, and returns with biscuits.", "(backing out) I'll just see about the kettle. (returns eight minutes later, tray first)", 3, "u", A],
    ["Passes the decision round like a plate", "Has each person state a preference before offering their own, then adopts the majority view without comment.", "Pizza? Curry? Thai? Right. That's three for curry. Curry's mine as well, then.", 1, "c", A],
    ["Lets each side think it won", "Tells each camp in turn that it is quite right, and keeps their own view back until the row has blown over.", "(to the first) You're quite right. (to the second, later) You're quite right too.", 3, "d", A],
    ["Asks the quiet one before the loud one", "Rescues a stalled meeting by turning to whoever hasn't spoken, so that no strong voice has to give way.", "Dev, you've said nothing. What do you reckon? No, Maureen, in a moment, let Dev.", 1, "s", A]
  ]);

  V2.block(out, "Conflict & Stress Response", "Fawn (appease the threat)", 243400, [
    ["Smiles through a telling-off", "Keeps nodding and smiling as the criticism lands, and thanks the speaker for being so clear.", "(still smiling, nodding) Absolutely. Fair point. Yes. Thank you for telling me.", 3, "d", A],
    ["Apologises again for apologising", "Follows an apology with an apology for the way it was said, and then one for the fuss.", "Sorry about earlier. And sorry about saying sorry so much. Sorry.", 2, "c", A],
    ["Gives up the seat before it is wanted", "Rises and offers their place the moment someone looks tense, and insists they were about to go anyway.", "(already up) Take it, take it. I was just going. Honestly, I was just going.", 3, "u", A],
    ["Brings food to the confrontation", "Meets a rising argument with a plate of something warm and a request that everyone sits down.", "I made a cake. Nothing to do with anything. Just a cake. Please, sit.", 3, "d", A],
    ["Holds the furious person's view by lunchtime", "Takes on the angry party's opinion of the matter within the hour and defends it to others.", "No, he's right, you know. If you think about it, I'd have done the same to me.", 3, "d", A]
  ]);

  V2.block(out, "Attachment & Intimacy Style", "Anxious", 243425, [
    ["Asks 'are you busy?' instead of asking to talk", "Opens an important conversation by checking whether now is a bad time, until it clearly is.", "Are you busy? You sound busy. It's nothing. I'll ring another time. Are you busy?", 3, "c", A],
    ["Offers to go, hoping to be stopped", "Stands and prepares to leave as the way of asking whether they are wanted, and waits.", "I can go home. I'll go. If you want me to go. (rises, slowly, by degrees)", 5, "d", A],
    ["Asks for a hug as if it were a favour", "Wraps a plain wish for affection in so many exits that it sounds like an apology.", "Only wondered about a cuddle. Only if you're not, it's nothing. Forget it.", 2, "c", A],
    ["Sends a joke to test the door", "Texts something silly first, and judges from the reply speed whether to mention the real thing.", "(text) Look at this dog! (then, an hour later) Everything all right with you?", 3, "u", A]
  ]);

  V2.block(out, "Dialogue Grammar Traits", "Turn-Taking Grammar", 243450, [
    ["Drops the sentence when anyone inhales", "Drops a sentence the instant another person seems about to speak, and does not pick it up again.", "And what I wanted to say was that the (someone inhales) oh, go on, you.", 5, "c", A],
    ["Says 'sorry, you first' to an open floor", "Holds back when the table goes quiet, and offers the gap to everyone else in turn.", "Sorry, you go. No, you. I was only going to say a small thing.", 3, "c", A],
    ["Frames a contribution as a question to the chair", "Puts a view as a query about whether it would be helpful to say it, so it can be waved away.", "Would it be useful, perhaps, if I mentioned the invoices? Only if it would.", 3, "u", A],
    ["Hands the floor back after every point", "Ends each remark with an invitation for someone else to take over, so they never hold it for long.", "That's all from me, really, unless anyone wants. No. Over to you, then.", 3, "c", A],
    ["Withdraws a point when a speaker starts", "Lets a talker begin and then says their own thing was nothing, and that the other's was better.", "Go on. Yours was better, honestly. Mine was nothing. Please.", 3, "d", A],
    ["Speaks only after a three-second gap", "Counts out a silence before offering anything and drops the comment if someone else begins in time.", "(counts three, then) May I? If there's a, yes. Well. Perhaps not.", 1, "s", A]
  ]);

  V2.block(out, "Humor Style", "Self-Deprecating", 243475, [
    ["Makes the request a joke so it can be refused as one", "Asks for a favour in a laughing tone, so a no can be taken as part of the act.", "(laughing) I don't suppose anyone's giving a lift? Ha. I'm joking. Unless.", 3, "d", A],
    ["Laughs along at the joke on them", "Joins the table in laughing at their own expense and invites the teller to go again.", "(laughing) No, it's fair! Everybody says it! Go on, say it again.", 3, "c", A]
  ]);

  /* ---------- act -1 ---------- */
  V2.block(out, "Personality Traits", "Activeness — Sedentary & Low-Energy", 243500, [
    ["Circles the car park for the space by the door", "Passes three free bays on the far side for a fourth lap of the front row, and counts the saved steps.", "(third lap) There's one by the trolleys. No, I'll wait for the one by the door.", 3, "c", M],
    ["Takes the lift for one floor", "Presses the button for a single storey and looks pleasantly settled on the way up.", "It's only one floor, yes. (presses button) It's one floor in a lift. Pleasant.", 5, "c", M],
    ["Looks for the chairs before saying hello", "Scans a new room for seating on arrival, and greets people only once a place is secured.", "(eyes sweeping the room) Lovely to see you all. Where's everyone sitting?", 3, "u", M],
    ["Shouts through the house", "Calls an instruction down a corridor and up a stairwell rather than walking the twenty feet.", "(from the sofa) Can you hear me? Bring the charger! The long one!", 5, "c", M],
    ["Asks 'is it far?' before agreeing to anywhere", "Wants the distance before the destination, and takes any answer in minutes as a lie.", "Is it far? Define far. Is it far in minutes, or far in hills?", 4, "c", M],
    ["Leaves forty minutes early to go slowly", "Sets out well before time so that the walk can be done in stages, with a sit between.", "Leaving now. It's only twelve minutes, but I like to take it in stages.", 1, "c", M],
    ["Picks the pub nearest the station", "Proposes the venue with the shortest walk from the train, and pretends it was about the beer.", "The Anchor. It's by the platform. Lovely beer. Nothing to do with the platform.", 2, "c", M],
    ["Lets a dropped thing lie", "Treats a fallen pen or coat as part of the room's arrangement until someone happens to pass.", "(a pen rolls away) Right. That's the pen now. That pen lives there.", 3, "u", M],
    ["Brings the whole load in a single go", "Stacks nine bags and a box on two arms and a fingertip to avoid a second journey.", "Nine bags, two arms, a fingertip on the door. One trip. It's always one trip.", 5, "c", M],
    ["Narrates getting to their feet", "Announces each stage of standing up, with pauses, like someone preparing a small expedition.", "Right. (pause) Right then. (pause) Up we get. Mind your feet.", 5, "c", M],
    ["Sits out the group walk with the coffee", "Waves the others off to the waterfall and offers to mind the coats and the flask.", "You go and see the waterfall. I'll hold the coats. I'm very good at holding coats.", 3, "c", M],
    ["Takes the flat route, however long", "Chooses a path twice as far to avoid one hill, and is quite happy with the sum.", "It's twice as far but it's flat. I'd take twice as far all day.", 3, "u", M],
    ["Greets the stairs with commentary", "Meets every flight with a spoken complaint, as if the building had misled them.", "Stairs. Of course. Nobody said there'd be stairs. Who puts a door up here?", 5, "c", M],
    ["Volunteers for the jobs that sit down", "Offers for the raffle table, the minutes and the tea urn, provided there is a stool.", "I'll do the raffle table. And the minutes. And the tea urn, if there's a stool.", 3, "u", M]
  ]);

  V2.block(out, "Personality Traits", "Activeness — Situational", 243525, [
    ["Walks for hours only when a friend is talking", "Declines any solo exercise yet covers miles beside someone with a good story.", "On my own? No. But I'll walk to Dorset if you tell me about your sister.", 2, "u", M],
    ["Active at work, motionless at home", "Spends a shift on their feet and arrives home as if the sofa were the only furniture.", "(on the sofa, after a twelve-hour shift) I've done my steps. All of them. For the year.", 3, "c", M],
    ["Lively on holiday, flat the week after", "Matches every walk and swim on a break, then needs a week of sitting to pay for it.", "Eleven miles on Tuesday. It's the following Tuesday and I'm still sitting in it.", 2, "u", M],
    ["Calls the day when it rains", "Treats a wet morning as a ruling on the whole day and settles for tea and a blanket.", "It's raining. That's the day, then. Kettle on, and let's call it.", 2, "c", M],
    ["Moves only for something worth the trouble", "Asks for a ranking of any invitation against the sofa before getting up.", "Is it worth getting up for? Seriously, rank it. Against the sofa.", 3, "d", M],
    ["Pays for the class and sits in the car", "Buys the kit and books the session, then spends the hour in the car park with the engine running.", "I'm here. I've paid. I'll just sit in the car a bit.", 3, "d", M]
  ]);

  V2.block(out, "Mannerisms", "Postural & Spatial Dynamics", 243550, [
    ["Tips the chair back and stays", "Settles on two chair legs mid-meeting and listens from there, content to let the room come to them.", "(rocking on two legs, content) Keep going. I can hear from here.", 2, "c", M],
    ["Sits by the thing they will need", "Picks the seat nearest the plug and the biscuits, and calls it the whole plan.", "I'll sit here by the plug and the biscuits. That's the entire decision.", 1, "c", M],
    ["Greets from the chair", "Raises a hand as visitors come in and lets them cross the room to reach them.", "(hand up, not rising) Come in, come in. Mind the dog. Come over here.", 4, "c", M],
    ["Takes the corner of the sofa and holds it", "Claims one end of the sofa and orders the evening around never leaving it.", "That's my corner. Pass me things. I'll be staying in the corner.", 4, "c", M],
    ["Rests on the half-landing", "Stops at the turn of the stairs for a moment that is described as admiring the window.", "(on the half-landing) Lovely window. Look at that. Lovely.", 1, "s", M],
    ["Sits on any ledge, step or radiator in reach", "Perches on the nearest surface mid-conversation, regardless of its fitness for sitting.", "(already on the windowsill) Go on. I'm perfectly comfortable. Don't mind me.", 4, "c", M]
  ]);

  V2.block(out, "Mannerisms", "Environmental Interaction Mannerisms", 243575, [
    ["Keeps everything within arm's reach", "Arranges tea, remote, charger and book in a ring about the seat and defends the ring.", "Don't move the book. The book is where my hand goes.", 3, "d", M],
    ["Drags the footstool over with a toe", "Steers a stool or a bag across the floor with a foot rather than get up to fetch it.", "(a foot, a stool, no change of posture) Come to Papa.", 3, "u", M],
    ["Fetches with the long handle", "Uses an umbrella, a mop or a coat hanger as the legs of the operation.", "(hooking the cushion with an umbrella) You don't have to get up for it. It's all in the wrist.", 3, "d", M],
    ["Leaves the door ajar for the next time", "Props a door open to spare a return trip that has not yet been planned.", "Leave it open. I'll only be getting up again.", 1, "s", M],
    ["Runs the extension lead to the sofa", "Trails a long cable across the room so the lamp, the phone and the heater can all stay where they are.", "(plug trailing from the sofa to the far wall) It's a system. Don't tread on the system.", 2, "c", M]
  ]);

  V2.block(out, "Social Role in a Group", "Caretaker", 243600, [
    ["Cares from a chair beside you", "Offers a presence rather than errands, pulling up a seat and saying nothing is needed.", "Shove up. I'm not going anywhere. I'll just sit with you.", 3, "c", M],
    ["Holds the baby, the bags and the line", "Takes the seated jobs in an emergency, such as the baby, the phone and the dog's lead.", "Give me the baby. Give me the dog. You go and find the car. I'll be right here.", 3, "u", M]
  ]);

  V2.block(out, "Humor Style", "Dry & Deadpan", 243625, [
    ["Delivers the line without turning round", "Speaks to the room from the armchair, eyes on the page, and lets the delay do the work.", "(not looking up) It's wonderful that you're all so lively. I'll cheer from here.", 3, "d", M],
    ["Talks about the stairs as a person", "Keeps a running feud with the staircase and reports on it as a rival.", "The stairs and I are not speaking. They started it, early this morning.", 3, "c", M],
    ["Reports their step count with solemnity", "States a tiny daily total as though awaiting a medal, and asks that it be noted.", "Two hundred steps today. I'm told that's a record. I've asked for it to be recognised.", 2, "u", M]
  ]);

  V2.block(out, "Mannerisms", "Gestural & Kinetic Integration", 243650, [
    ["Waves a hand rather than get up", "Answers a call from the next room with a lifted palm and a murmured reply, and stays put.", "(a hand floats up from the armchair) Yes, yes, I'm coming. In a bit. I'm coming.", 2, "c", M],
    ["Directs with a tilt of the chin", "Directs people to the thing they want with a tilt of the head and a small sound.", "(chin toward the shelf) That one. No, the other one. Yes. Lovely.", 2, "u", M],
    ["Gestures only from the wrist", "Keeps the arms still on the rests and does all of their emphasis from the wrist and fingers.", "(forearm flat on the chair, two fingers circling) So it goes round, and round.", 1, "s", M]
  ]);

  /* ---------- intel -1, extra ---------- */
  V2.block(out, "Vocabulary Traits", "Directness & Literalness", 243675, [
    ["Answers 'why' with 'because it did'", "Treats a request for causes as a request for the event itself, and repeats what happened.", "Why did it break? Because it broke. It went, and then it was broken.", 3, "c", I],
    ["Says what happened and leaves out what it means", "Lists the actions in order, a hat taken off and a chair drawn out, and expects the listener to find the point.", "He came in, he sat down, he took his hat off. That's it. You work it out.", 2, "u", I],
    ["Won't be drawn on 'in theory'", "Declines any hypothetical framed as a principle and returns to what is on the table.", "In theory? I don't do theory, love. In my kitchen, it's flour and eggs.", 3, "c", I]
  ]);

  V2.block(out, "Social Role in a Group", "Connector", 243700, [
    ["Introduces people through their relations", "Gives each guest a place in a family tree and a street, and trusts the pair to take it from there.", "This is Tom. He's Brenda's nephew, from the bakery lot. Tom, this is Priya from next door.", 3, "c", I],
    ["Matches people by a feeling, not a list", "Pairs strangers on an unexplained sense that they will get on, and is usually right.", "You two should meet. I can't tell you why. It's just a feeling.", 2, "u", I]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_POLES_D);
