/* v2 content: pole balance (poles-f). IDS 245000-246999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_POLES_F = (function(){
  const out = [];

  // Set 1: analytical behaviours (partner of "Instinctive & Unanalytical")
  V2.block(out, "Personality Traits", "Intelligence — Sharp & Analytical", 245000, [
    ["Keeps a decision log", "Writes down why they chose something and what they expected, then rereads the entry months later to see whether the reasoning held.", "(opening a battered notebook) Ninth of March. Chose the cheaper supplier, expected delivery inside a week. Took five. So the reasoning was wrong. Noted.", 3, "d", {intel:1, disc:1}],
    ["Asks how many out of how many", "Wants the denominator before reacting to a vivid number, and says so plainly.", "Four complaints this week. Out of four hundred orders, or out of twenty? That changes what I think.", 2, "c", {intel:1}],
    ["Weighs both sides aloud", "Talks through the case for and the case against in turn, putting a cost on each, so the room can hear the scales move.", "On one hand it's cheaper. On the other we lose the warranty. Call it forty quid against two years of cover. Cover wins. Narrowly.", 3, "c", {intel:1, vol:1}],
    ["Turns a boast into a bet", "Takes a vague claim and rewrites it with a date and a figure so that it could actually turn out wrong.", "'Better' by when? Say it cuts the queue to under ten minutes by June and I'll back you.", 3, "d", {intel:1, asrt:1}],
    ["Puts a number on a hunch", "Gives a confidence figure where others would say 'probably', and will say when it moves.", "Sixty-five per cent it rains. Not seventy. I'd bet a coffee at sixty-five.", 2, "u", {intel:1, hon:1}],
    ["Offers a second story that fits", "Before accepting the neat explanation, supplies another that matches the same facts and asks what would separate them.", "Or the shop was simply shut for stocktaking. That fits too. What would tell the two apart?", 3, "u", {intel:1}],
    ["Asks which way the arrow points", "When two things rise together, wonders aloud which is pushing the other, or whether something third is pushing both.", "People who carry umbrellas get wet more often. Did the umbrella do it, or the rain?", 3, "c", {intel:1}],
    ["Lays the events out in order before blame", "Sets the timeline on paper, with times, before anyone is allowed to say whose fault it was.", "Quarter past nine, the alarm. Nine-forty, the call. Ten, the van. Now tell me where it went wrong.", 3, "u", {intel:1, mood:1}],
    ["Asks who was asked", "Wants to know who the survey spoke to, and how they were chosen, before the result counts for anything.", "Who did they ask? Subscribers? Then of course eighty per cent like it.", 2, "c", {intel:1}],
    ["Does the sum out loud", "Speaks the arithmetic as it goes so that anyone can catch a slip.", "Forty at six is two-forty. Add the delivery, two sixty-five. Anyone getting something different?", 2, "u", {intel:1, hon:1}],
    ["Says what each theory predicts", "Spells out what would be seen if each explanation were true, so the group can go and look.", "If it's the pump, the noise stops when we cut the power. If it's the pipe, it won't. Cut the power.", 4, "d", {intel:1}],
    ["Separates what they saw from what they assume", "Labels the part of a story they witnessed and the part they filled in.", "I saw the door open. I'm assuming somebody opened it. Those are two different sentences.", 3, "d", {intel:1, hon:1}],
    ["Asks who gains if it's believed", "Looks at who profits from a claim being accepted before weighing the claim itself.", "Who paid for the study? Not saying it's wrong. Saying I'd like the funding line before I quote it.", 3, "u", {intel:1}],
    ["Runs a pre-mortem", "Asks the group to imagine the plan has already failed and work backwards to the likeliest reason.", "It's a year on and this launch flopped. Quick: why? Write it down before we say a word.", 3, "d", {intel:1, pos:-1}],
    ["Swaps 'never' for a rate", "Quietly replaces an absolute with a figure, without making a point of it.", "Never? More like one in four thousand. Which, in a city, is still a few people every year.", 1, "s", {intel:1}],
    ["Holds the verdict until the figures arrive", "Declines to rule on a question while the numbers are missing, and names the day they will have them.", "Ask me Thursday. I don't have the second quarter yet and I'd only be guessing.", 2, "c", {intel:1, disc:1}],
    ["Multiplies the odds along the chain", "Takes a plan with several steps and works out the combined chance of all of them going right.", "Five things have to go right, ninety per cent each. That's under sixty per cent. Still want to book the tent?", 3, "d", {intel:1}],
    ["Checks a result by a second route", "Reaches the same answer a different way before trusting the first.", "Calculator says four thousand. My rough guess said three. Let me go round again.", 2, "u", {intel:1, disc:1}],
    ["Defines the word before the argument", "Stops a debate to ask what each side means by the key term, and will not go on until that is settled.", "Before we go any further, when you say fair, do you mean equal shares or shares by effort?", 4, "c", {intel:1, asrt:1}],
    ["Names the fact that moved them", "When they change their mind, points to the specific piece of evidence that did it.", "That's what changed my mind. The second table, not the argument. Page nine.", 3, "u", {intel:1, hon:1}],
    ["Pushes the claim to the extreme", "Tests a general statement on a very large or very small case to see where it gives way.", "If it's true for ten people, is it true for ten million? Because I think it breaks around ten thousand.", 3, "d", {intel:1}],
    ["Stops mid-sentence when it stops adding up", "Halts, without embarrassment, when they hear their own argument fail, and goes back a step.", "So the shop would be — (a pause) — no. That doesn't follow. Give me a second.", 1, "u", {intel:1, pace:-1}],
    ["Pulls up the source mid-dispute", "Settles a disagreement by opening the original figures on the nearest screen, and turns it round for everyone to read.", "(thumb already moving) Hang on. Two point one, not twenty-one. Decimal place. Read it yourself.", 4, "c", {intel:1, asrt:1}],
    ["Answers a casual question with a numbered breakdown", "Meets a simple 'what do you think?' with a structured list of factors, each given its own number.", "Right, three things. One, cost. Two, who has to carry it up the stairs. Three, whether anyone will actually use it. Starting with one.", 5, "c", {intel:1, vol:1}],
    ["Plays both sides in two voices", "Argues the case and the counter-case at full length and with different delivery, until someone else picks one.", "(stands left) The case for. (steps right) The case against, which is better. (back left) Which I'd answer by —", 5, "s", {intel:1, vol:1}],
    ["Dates every claim in the notebook", "Writes the day beside a figure or a belief so they can tell later how old it is.", "(pencilling '7 Oct' beside the number) True in October. Might not be now.", 1, "s", {intel:1, disc:1}],
    ["Concedes the argument they dislike", "Says out loud that the better case is the one that goes against their preference.", "I don't like it, and it's right. Both of those. I'll live with that.", 2, "s", {intel:1, hon:1}],
    ["Asks over what period", "Wants the time scale pinned down before agreeing that something is good or bad.", "Better over a week, a year or ten? Because it's clearly worse for the first month.", 1, "u", {intel:1}],
    ["Stops the meeting to ask what it decides", "Interrupts a long discussion to ask which decision it is meant to produce, and by when.", "Sorry, can I stop us? What are we deciding today? If nothing, I'd like the hour back.", 4, "d", {intel:1, asrt:1}],
    ["Scores dinner on a weighted grid", "Settles even small group choices with criteria, weights and a shared sheet, offered cheerfully.", "Taste weighs two, distance one. Thai wins by three points. Any objections to the weights?", 5, "u", {intel:1, vol:1}],
    ["Asks 'compared to what?'", "Drops a small question into any statement about something being large or good, and moves on.", "Expensive compared to what? (mildly) Genuinely asking.", 1, "c", {intel:1}],
    ["Writes the whole chain on the wall before the vote", "Covers a wall or a window with the full line of reasoning and refuses to call a vote until everyone has read it.", "(marker squeaking) Premise, premise, so this, so this. Nobody votes until they've read the whole wall.", 5, "d", {intel:1, asrt:1}],
  ]);

  // Set 2: incurious (cur -1), in other categories
  V2.block(out, "Habits & Vices", "Compulsion & Ritual", 245100, [
    ["Takes the same route every time", "Keeps to one road, whatever the traffic or the navigation says, and lets the delay stand as proof.", "(sat-nav says left) No. Ring road. Always the ring road.", 3, "c", {cur:-1, disc:1}],
    ["Rewatches the series instead of starting another", "Reaches for a programme they know by heart each evening, partly because nothing in it can surprise them.", "(thumb over 'Continue watching') Series three again. I know what happens. That's the point.", 2, "u", {cur:-1}],
  ]);
  V2.block(out, "Habits & Vices", "Avoidance & Procrastination", 245150, [
    ["Leaves the settings unopened", "Uses a phone or a machine exactly as it arrived, and has never looked at the menu behind the first screen.", "(the home screen unchanged since the shop) It does the phone thing. That's the phone thing.", 1, "s", {cur:-1}],
  ]);
  V2.block(out, "Social Role in a Group", "Historian", 245200, [
    ["Tried it in 'ninety-eight", "Meets a new proposal by naming the year it was already attempted, and what became of it.", "Tried that in the spring of 'ninety-eight. Same slides. Same promises. Let's save everybody the afternoon.", 4, "c", {cur:-1, asrt:1}],
    ["Treats the past as a finished map", "Answers a 'what if' by describing what always happens, in order, and does not wonder about anything outside it.", "It'll go how it always goes. Rain at the fete, Barry on the raffle, tea urn broken by three. Next.", 2, "s", {cur:-1}],
  ]);
  V2.block(out, "Conversation Mechanics", "Turn-Timing", 245300, [
    ["Closes the subject with one flat word", "Ends a topic with a short verdict word and moves to the next thing before anyone adds to it.", "Fine. Done. (a beat) Anyway, parking.", 3, "c", {cur:-1}],
    ["Answers and gives nothing back", "Replies to a question with exactly the answer asked for, then waits, without a question of their own.", "Good, thanks. (a pause that is not an invitation)", 2, "u", {cur:-1, warm:-1}],
    ["Talks over the 'did you know'", "Cuts off any opening fact with a flat 'know that' and holds out a hand for the next subject.", "Did you know the bridge was — Know that. Yes. Next.", 5, "c", {cur:-1, asrt:1}],
  ]);
  V2.block(out, "Dialogue Grammar Traits", "Spoken Compression", 245400, [
    ["Answers 'why' with 'that's how'", "Treats a request for a reason as already answered by the existence of the habit.", "Why that way? — Because that's how. — Yes, but why — That's how it's done.", 3, "d", {cur:-1}],
    ["Supplies the ending before the teller does", "Completes a story as soon as its shape is clear, and delivers the ending in a sentence.", "And then he was — Went home. They all do. Go on.", 4, "d", {cur:-1, vol:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Pragmatic Focus & Speech Functions", 245500, [
    ["'I'll take your word for it'", "Accepts a claim in a few words instead of asking to see how it works.", "(not looking up from the crossword) Yes, if you say so.", 1, "s", {cur:-1}],
    ["Calls the unfamiliar 'that sort of thing'", "Files a new thing under a vague umbrella phrase instead of learning what it is called.", "Is it a kale thing? A leafy thing. That sort of thing.", 2, "d", {cur:-1}],
    ["Demands plain English", "Answers a technical word with a demand for plain speech, before the explanation can start.", "Amortisation. Right. Is that a real word? No, don't tell me. Plain English or nothing.", 5, "c", {cur:-1, asrt:1}],
  ]);
  V2.block(out, "Humor Style", "Humorless & Absent", 245600, [
    ["Laughs at the familiar bit only", "Stays flat through a new sketch, then lights up the moment a line they know comes round.", "(stone-faced through the new sketch, then beaming) Oh, it's the one with the ladder.", 2, "d", {cur:-1}],
    ["Lets the punchline go past", "Smiles at the shape of a joke without asking what it meant or why it was funny.", "(smiling politely at nothing in particular) Ha. Yes.", 1, "s", {cur:-1}],
  ]);
  V2.block(out, "Mannerisms", "Listening & Attention", 245700, [
    ["Gaze drifts to the window at a new subject", "Lets their eyes go to the same spot outside the moment the talk turns to something unfamiliar.", "(eyes drift to the window at the word 'actually')", 2, "c", {cur:-1}],
    ["Nods through the new thing and goes back", "Listens to the end of someone's news with courteous nods, then takes up exactly where they left off.", "(nodding politely to the end) Lovely. Anyway, as I was saying about the gutters.", 3, "d", {cur:-1}],
    ["Palm up like stopping traffic", "Raises a flat hand when someone starts explaining how something works.", "(palm flat, like stopping traffic) Stop. I don't need to know how it works.", 5, "c", {cur:-1, asrt:1}],
  ]);
  V2.block(out, "Decision Style", "Fast & Gut", 245800, [
    ["Orders the usual over the waiter's list", "Gives the old order over the top of anyone offering alternatives.", "The usual. — There's a new — The usual.", 4, "c", {cur:-1, pace:1}],
    ["Sets aside the unfamiliar option", "Chooses from the two or three items they already know and treats the rest as not on offer.", "(ignoring the third column of the menu) Two of those I know. I'll pick one of those.", 3, "d", {cur:-1}],
  ]);
  V2.block(out, "Hospitality & Gifts", "Being a Guest", 245900, [
    ["Orders the same dish wherever they are", "Asks for one plain thing at every restaurant, regardless of what the menu is proud of.", "Have you got a plain omelette? Then that. Doesn't matter where.", 3, "c", {cur:-1}],
    ["Stays in the first room they're shown", "Sits down where the host first points and does not ask about the rest of the house.", "(settling into the hall chair) This is fine, thank you. I don't need the garden.", 2, "u", {cur:-1}],
    ["Won't taste the dish they can't name", "Asks what something is, and when the answer is unfamiliar, moves to the bread.", "What is it? ... Right. No, I'm sure it's lovely. I'll have the bread.", 4, "c", {cur:-1, agr:-1}],
  ]);
  V2.block(out, "Greetings & Farewells", "Opening Lines", 245950, [
    ["Three questions, same order", "Greets arrivals with a fixed set of questions and carries on to the kettle without waiting for more.", "Journey all right? Parking all right? Kettle's on.", 3, "u", {cur:-1}],
    ["Reports that nothing is new", "Answers 'what's new?' with the same flat report, every time, and does not return the question.", "What's new? Nothing's new. Same as last time.", 2, "c", {cur:-1}],
  ]);
  V2.block(out, "Values & Moral Line", "Pragmatic & Flexible", 245970, [
    ["Picks whoever worked last time", "Chooses the supplier, plan or person that did not fail before, without comparing it to anything else.", "We used Hallam's last time and nobody died. Hallam's.", 3, "u", {cur:-1, disc:1}],
  ]);
  V2.block(out, "Habits & Vices", "Compulsion & Ritual", 246000, [
    ["Trusts the lucky pen", "Signs important things only with one pen and treats the choice as information about how the day will go.", "Not that one. That one's had a bad week. Pass me the blue.", 2, "u", {intel:-1, disc:1}],
    ["Reads the room before the facts", "Decides what a document means from the mood of the person who handed it over.", "She didn't look at me when she gave me it. Doesn't matter what's on page two.", 3, "d", {intel:-1, emo:1}],
    ["Won't wait for the second opinion", "Takes the first answer that feels right and gets visibly restless when asked what else was considered.", "I've decided. What else is there to consider?", 3, "c", {intel:-1, pace:1}],
  ]);
  V2.block(out, "Humor Style", "Warm & Playful", 246010, [
    ["Explains the joke with a story", "Cannot get to the point of a joke without the three scenes that led up to it, and the point arrives as a feeling.", "So you had to be there, right, because Denise had just come in with the, no, the other bag...", 3, "c", {intel:-1, vol:1}],
    ["Laughs first, works out why later", "Starts laughing at the tone of a line and asks, still laughing, what exactly was funny.", "(laughing already) Wait, what did you say? No, keep going, it was good.", 2, "u", {intel:-1, warm:1}],
  ]);
  V2.block(out, "Vocabulary Traits", "Precision & Specificity Level", 246020, [
    ["Says 'sort of like' for every comparison", "Reaches for a feel-alike instead of naming the thing, and lets the listener do the matching.", "It's sort of like a Tuesday, but louder. You know the kind.", 2, "c", {intel:-1}],
    ["Measures in 'a bit' and 'a fair few'", "Gives quantities as impressions and bristles gently when asked for a number.", "A fair few. Enough. A bit more than last time, anyway.", 3, "c", {intel:-1, disc:-1}],
    ["Describes a route by landmarks that have gone", "Gives directions by the pub that closed and the tree that came down.", "Turn at where the Bell was. You'll feel it when you're there.", 2, "d", {intel:-1}],
  ]);
  V2.block(out, "Dialogue Grammar Traits", "Structural Shifts", 246030, [
    ["Answers a how with a who", "Responds to a process question by naming the person who did it last, as though that settled the method.", "How's it done? Ask Ravi. Ravi does it. He'll just do it.", 3, "d", {intel:-1, hon:1}],
    ["Argues by example, never by rule", "Counters a general claim with one remembered case and treats the case as the end of the matter.", "My uncle smoked till ninety. So.", 3, "c", {intel:-1, asrt:1}],
  ]);
  V2.block(out, "Mannerisms", "Listening & Attention", 246040, [
    ["Looks away to feel the answer", "Breaks eye contact before replying to a hard question and answers from a hunch, not a calculation.", "(eyes to the window, a long breath) No. It's not right. I can't tell you why.", 2, "u", {intel:-1, mood:-1}],
    ["Waves away the figures", "Pushes a spreadsheet back across the table unread and asks how the people are doing.", "(pushing the sheet an inch away) Never mind the columns. Tell me how Ade is.", 3, "d", {intel:-1, warm:1}],
  ]);
  V2.block(out, "Social Role in a Group", "Connector", 246050, [
    ["Matches people by instinct", "Introduces two strangers on a feeling, with no reason given, and is usually right and mildly annoyed to be asked why.", "You two need to meet. Don't ask me why. Just trust me on it.", 3, "d", {intel:-1, warm:1}],
    ["Reports the mood, not the minutes", "Gives the team a feeling for a meeting instead of what was decided.", "It went fine, I think. Warm enough. Mara was a bit tight in the shoulders.", 2, "u", {intel:-1, emo:1}],
  ]);
  return out;
})();
TRAITS.push(...TRAITS_V2_POLES_F);
