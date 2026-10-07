/* v2 content: Values & Moral Line: six new categories. IDS 222000-222999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_VALUES = (function(){
  const out = [];
  const S = "Values & Moral Line";

  V2.block(out, S, "Tradition & Rite", 222000, [
    ["Defending an odd custom with 'we just do'", "Defends an odd family procedure, such as cutting the loaf from the left, with 'we just do' and a look that closes the subject.", "You cut it from the left. Why? Because you do. Pass the knife.", 3, "c", {disc:1, form:1}],
    ["Keeping the anniversary rite to the minute", "Observes the same small ceremony on the same date each year, a candle or a walk to one bench, and treats a missed year as a breach.", "Half past four, the bench, the flask. Same as every year. Come or don't, but I'm going.", 3, "u", {disc:1, emo:1}],
    ["A year's probation for the new gadget", "Treats a new machine or recipe as a guest on trial and says it will be judged after the seasons have turned.", "We'll see about the new machine. Ask me again next autumn.", 2, "c", {cur:-1, disc:1}],
    ["Arranging the mourners in the proper order", "Steers relatives by the elbow into the correct sequence behind the coffin before anyone has asked.", "(a hand on an elbow) — Not there, love. Spouse, then children, then siblings. Just so.", 4, "d", {form:1, asrt:1}],
    ["A flat verdict in place of a reason", "Offers a flat verdict in place of a reason when a custom is broken, and expects the verdict to be enough.", "You don't open presents before the toast. It isn't done.", 4, "c", {form:1, asrt:1}],
    ["Running the house by the date, not the weather", "Lights the first fire, puts out the winter bedding and opens the windows on fixed days whatever the thermometer says.", "First of October, the heating goes on. I don't care if it's twenty-two degrees out.", 3, "u", {disc:1, rebel:-1}],
    ["Teaching the gesture and withholding the reason", "Passes on a skill by guiding the learner's hands and answering 'why' with 'because that is how it goes'.", "No, like this. (moves the child's hand) Feel that? That's it. Don't ask me why.", 2, "d", {warm:1, disc:1}],
    ["Holding the first fork until the words are said", "Stops a meal before it begins and waits, with a hand raised, for the grace, the toast or the saying that opens it.", "Hold on. Nobody lifts a fork till we've said it.", 3, "c", {form:1, man:1}],
    ["The same seat at every gathering", "Reaches for one particular chair at each family occasion, and meets a stranger sitting in it with a pause rather than a word.", "(stops beside the taken chair, then settles in the next one without comment)", 1, "s", {asrt:-1, disc:1}],
    ["The long method, kept after a quicker one is proven", "Declines a shortcut that demonstrably works because the slow way is what the job means to them.", "Yes, it's quicker. It's also not how you make it.", 3, "u", {disc:1, cur:-1}],
    ["Wanting the vows said in full", "Halts a ceremony, a handover or a promise to demand the whole form of words rather than a 'you know what I mean' version.", "Say the whole thing. Not 'you know'. The whole thing, start to finish.", 5, "d", {form:1, asrt:1}],
    ["Keeping the days of mourning", "Observes the traditional intervals after a death and says the day count aloud each morning, leaving the room untouched until the last is reached.", "That's thirty-one days. We leave her room as it is till forty.", 2, "d", {emo:1, disc:1}],
    ["The family office taken as a duty", "Performs the inherited job at gatherings, the carving, the pouring or the opening speech, and bristles at offers to relieve them.", "I carve. I've always carved. Sit down, it's done properly or it isn't done.", 3, "u", {asrt:1, disc:1}],
    ["Protesting the rushed ceremony at full volume", "Objects loudly when a rite is trimmed to fit the schedule, and lists what has been cut and how long it used to take.", "Twenty minutes? We've done this three hundred years and you want twenty minutes?", 5, "c", {vol:1, asrt:1}],
    ["Knowing the proper form for the occasion", "Quietly corrects the medium, the timing or the wording of a card, a call or a thank-you without raising their voice.", "For that you write a letter. By hand. Within the week.", 1, "u", {form:1, man:1}],
    ["Naming those who did the task before", "Mentions, while laying a table or winding a clock, who did it before them and how many times it has been done.", "(smoothing the cloth) — My aunt pressed this crease. Her mother before. I just keep it going.", 2, "s", {warm:1, emo:1}]
  ]);

  V2.block(out, S, "Purity & Sanctity", 222100, [
    ["Separate boards, separate cups", "Keeps one board, cup or cloth for one purpose by a rule of their own, and rewashes it if the line is crossed.", "Not that board. That's the bread board. Meat has its own.", 3, "c", {disc:1}],
    ["A flinch when the sacred is made a joke", "Stiffens at a holy word, an anthem or the name of the dead turned into a punchline, and lets the silence stand.", "(laughter round the table; they set down the glass and look at the cloth)", 3, "u", {man:1, mood:-1}],
    ["Scrubbing the house before the festival", "Cleans from top to bottom on the eve of a feast day and answers the doorbell with a duster still in hand.", "Don't sit there, I've only just done it. Tomorrow's the day. It all has to be clean before the first candle.", 3, "u", {disc:1, act:1}],
    ["Phone left at the door of certain places", "Puts the device in the car or the bag at a graveyard gate or the door of a place of worship, and is faintly surprised by those who do not.", "It stays in the car. Some places you go in with empty hands.", 1, "u", {disc:1, form:1}],
    ["Washing and clearing before a serious decision", "Refuses to sign, swear or choose on a serious matter until they have cleared the desk and cleaned up.", "Not like this. Let me wash, clear the desk, and then we talk about it.", 3, "d", {disc:1, pace:-1}],
    ["The first piece set aside for the absent", "Puts the first slice or first pour on a small plate for the dead or the missing before anyone takes any.", "First slice goes on the little plate. Then we eat.", 2, "d", {warm:1, emo:1}],
    ["Writing off an object spoiled by its use", "Declares a cup, a room or a story spoiled by a careless use and cannot be argued back into liking it.", "Not after what that cup was used for. I can wash it a hundred times. I can't look at it.", 4, "d", {asrt:1, pos:-1}],
    ["A guarded half-hour of quiet", "Keeps a set stretch of the evening for silence or prayer and stops anyone who tries to speak into it.", "(hand raised at the kitchen door) Not till half six. Ten minutes. Then you can have me.", 3, "u", {disc:1, asrt:1}],
    ["A murmur at certain gates", "Lowers the voice at a graveyard gate, a surgery door or an empty hall, mid-sentence and without noticing.", "(voice drops at the gate, mid-sentence) — ...the car's just along there.", 1, "s", {vol:-1, man:1}],
    ["Washing the hands to close an unpleasant job", "Finishes a difficult conversation or task with a long, deliberate scrub at the sink, as if closing a book.", "(runs the tap, soaps to the wrist) — Right. That's that done.", 2, "s", {disc:1}],
    ["Money and deals described as clean or dirty", "Uses the vocabulary of stains for conduct, so that a deal is clean, a favour is dirty and a firm has a mark on it.", "I'll take it from a clean pocket or not at all.", 3, "c", {form:1, hon:1}],
    ["Fasting quietly on the eve of a holy day", "Declines food at a shared table before a fast day with a gentle word, and stays to keep the company.", "Not for me tonight, thank you. Tomorrow's a fast day. I'll sit with you, though.", 2, "u", {disc:1, man:1}],
    ["An heirloom held, not owned", "Refuses an offer for a family candlestick or Bible on the grounds that it is kept for the next in line, not theirs to sell.", "Forty pounds? It isn't mine to sell. I'm only keeping it for the next one.", 3, "d", {disc:1, hon:1}],
    ["A hush for the solemn moment", "Raises a finger as the toast, anthem or minute's silence begins and glares at a cough.", "Shh! It's the anthem. Not a whisper.", 5, "c", {asrt:1, form:1}],
    ["The table kept for eating", "Refuses laptops, papers and quarrels at the dining table because the table has one purpose and they enforce it.", "Not at the table. The table is for faces and food. Take the papers away.", 3, "c", {disc:1, asrt:1}],
    ["Bread that cannot be thrown away", "Picks up a fallen crust and wraps it for the birds rather than put it in the bin.", "(picks up the crust, wraps it in a napkin) You don't bin bread. The birds will have it.", 2, "d", {disc:1, warm:1}]
  ]);

  V2.block(out, S, "Autonomy & Liberty", 222200, [
    ["Hearing advice as an attempt at control", "Takes 'have you thought about' as a move in a contest and says so, however kindly it was meant.", "Have I thought about it. Yes. Thank you for checking that I can.", 3, "d", {asrt:1, agr:-1}],
    ["Leaving any group that votes on their choices", "Walks out of a committee, rota or pact the moment their own decision goes to a show of hands.", "You can vote on the budget. You can't vote on me. I'm out.", 4, "d", {rebel:1, asrt:1}],
    ["Bristling at the weekly status update", "Meets status updates, check-ins and 'just keeping you in the loop' with the complaint that the job was fine before anyone asked.", "Is there a reason you're asking how it's going, or are you just counting me?", 5, "c", {rebel:1, agr:-1}],
    ["Dropping the plan once someone insists on it", "Abandons something they were about to do the moment a person says 'you should'.", "I was going to. Now I'm not. You said 'should'.", 3, "c", {rebel:1, agr:-1}],
    ["Asking who decided that", "Questions the origin of a rule, schedule or seating plan before agreeing to it, with real curiosity as well as edge.", "Who decided half past? Was anyone asked? Fine, I'm only curious who.", 2, "c", {cur:1, rebel:1}],
    ["No standing slot, ever", "Turns down rotas, subscriptions and standing arrangements because they want to be free next Thursday.", "Not every Thursday. Ask me each Thursday and I'll probably come.", 2, "u", {rebel:1}],
    ["Their own car, so they can leave", "Drives separately to the group outing, and gives the real reason only if pressed.", "I'll drive myself. No, honestly, I like being able to go.", 1, "u", {rebel:1, disc:1}],
    ["Defending another's right to a bad choice", "Tells worried relatives to leave someone alone with a decision they themselves think is a mistake.", "It's a daft idea. It's his daft idea. Leave him alone.", 3, "d", {asrt:1, hon:1}],
    ["Answering when they are ready", "Lets a question sit for days rather than be hurried, then replies on a date of their own choosing.", "(looks at the question, puts it down) — I'll tell you Sunday.", 1, "s", {pace:-1, mood:1}],
    ["Arguing with the safety sign", "Reads a 'for your own safety' notice aloud and then does the opposite, on principle and at volume.", "'For your own safety.' Mine. Which I get to decide on. Hold my tea.", 5, "c", {rebel:1, vol:1}],
    ["The surprise party heard as a decision made about them", "Treats a trip or party arranged without asking as an imposition, however much it cost.", "You booked it? For me? Without asking? Lovely. Cancel it.", 4, "u", {rebel:1, asrt:1}],
    ["Keeping their movements to themselves", "Declines to say where they are going or whom they are meeting, out of a sense that it is theirs and not for any secrecy.", "Out. Back later. I'm not being mysterious, I just don't report.", 2, "s", {rebel:1, asrt:1}],
    ["Resigning at the first tie-in clause", "Leaves a job or club when a bonding clause, a loyalty scheme or 'we're like family' language appears.", "Two-year tie-in? No, thanks. I like leaving by the door I came in.", 3, "u", {rebel:1, ego:1}],
    ["Fixing it themself rather than asking", "Watches a video and takes the tap apart rather than ring the landlord or ask a neighbour.", "I'll watch a video. I can do a tap. I'm not ringing him.", 3, "c", {asrt:1, intel:1}],
    ["Paying their own way to owe nothing", "Insists on covering their own coffee or lift so that no one can later say they were owed.", "I'll get mine. I'd rather not owe anyone a coffee.", 2, "c", {ego:1, disc:1}],
    ["Correcting anyone who sums them up in a word", "Bridles at 'the quiet one' or 'the sensible one' and spends the following week doing something to disprove it.", "Sensible? Is that what I am? Give me a minute.", 4, "d", {rebel:1, ego:1}]
  ]);

  V2.block(out, S, "Fairness", 222300, [
    ["The cutter chooses last", "Applies the childhood rule of division to every cake, bill and chore, whoever is present.", "You cut it, you pick last. That's how it works.", 3, "c", {disc:1, hon:1}],
    ["Saying aloud that one plate is bigger", "Remarks evenly that a portion, a chore or a break is unequal, as a fact for the table rather than a complaint.", "Mine has four prawns, yours has two. I'm not complaining, just noting it.", 3, "c", {hon:1, asrt:1}],
    ["Keeping score, and reporting being behind", "Holds a running tally of favours and cheerfully announces when they are the one in debt.", "I'm down three lifts. I'll drive Thursday. Don't argue, I've checked.", 3, "d", {hon:1, disc:1}],
    ["Itemising the bill to the penny", "Reaches for the calculator at the end of dinner and splits the bill by who ate what, adding their own extra glass.", "You had the starter, I didn't. Two ninety. I'll do the app.", 4, "c", {disc:1, intel:1}],
    ["Swapping the people to test a judgement", "Tests a verdict by putting someone else in the same position before accepting it.", "If it were your brother who'd done that, would you call it a mistake?", 3, "u", {intel:1, hon:1}],
    ["The director on the same clock", "Points to the rule that was used on the junior and asks what the same rule says for the people at the top.", "If I'm written up for ten minutes late, what happens at the director's eleven-fifteen?", 4, "u", {asrt:1, rebel:1}],
    ["Settling a tie with straws", "Produces matchsticks or straws to decide who washes up, and takes their turn at drawing like everyone else.", "(holds out a fist of straws) Short one cooks. No, you draw first. I'll go last.", 2, "u", {disc:1, hon:1}],
    ["Stating the other side's case first", "Declines to argue against a person until they have laid out that person's view in terms the person would accept.", "Let me say your side first. If I get it wrong, tell me. Then I'll say mine.", 2, "d", {intel:1, man:1}],
    ["The bigger half put back", "Slides an extra note into the shared pot or returns the larger piece, murmuring a reason nobody checked.", "(slides a note across the table) — I think I took the bigger half last week.", 1, "s", {hon:1, asrt:-1}],
    ["Refusing a win they think was unfair", "Hands back a point, a prize or a promotion that came from a missed foul or a lucky error, and asks for a replay.", "I won't take it. The referee missed his foot. Replay it.", 5, "d", {hon:1, ego:1}],
    ["Declaring an interest before judging", "Announces a connection to the parties before ruling on a dispute, a raffle or a seating plan.", "I should say I'm friends with her. Weigh that or ask someone else.", 2, "u", {hon:1, man:1}],
    ["Crying foul at full volume", "Raises the cry at full volume the moment a rule appears to have been changed halfway, and demands to see the original.", "That is NOT fair! Nobody said five minutes each!", 5, "c", {vol:1, emo:1}],
    ["Adding the person left off the list", "Notices a missing name on an invitation or a thank-you and insists it be put right before the page goes out.", "There are twelve names and Dev is not one. Dev did the flowers. Add Dev.", 3, "u", {asrt:1, warm:1}],
    ["No favour that is not offered to all", "Turns down a perk or a special deal unless the giver would offer it to anyone.", "If you'd give it to anyone, fine. If it's only me, no thank you.", 2, "d", {hon:1, agr:-1}],
    ["Agreeing the rules before the game starts", "Stops everyone before the first move to ask what happens on a draw, and has it written on the back of the box.", "Before we start: what happens on a draw? Let's write it down.", 2, "c", {disc:1, intel:1, asrt:1}],
    ["The penalty applied to friends first", "Imposes the fine or the rule on their own circle before anyone else's, to demonstrate it binds everybody.", "Late is late, and it was the club captain. Captain pays the fine. Everybody pays.", 4, "u", {hon:1, disc:1}]
  ]);

  V2.block(out, S, "Care & Protection", 222400, [
    ["Unable to watch a small cruelty", "Speaks up when a waiter, child or junior is spoken to unkindly in earshot, whatever it costs them.", "Excuse me. Say that again, but nicely this time.", 4, "u", {asrt:1, warm:1}],
    ["Stopping the joke at the vulnerable one's expense", "Cuts across the table's laughter with a flat remark and a change of subject.", "(flat) That's enough. — Anyone want more tea?", 3, "c", {asrt:1, warm:1}],
    ["Feeding the stray before the quarrel", "Puts food down for the dog, the lodger or the stranger and only then takes up the argument.", "Hold that thought. (puts down a saucer) Right. You were saying.", 3, "d", {warm:1}],
    ["Falling into step with the slow one", "Drops back to whoever is last in the line or the walk and chats easily so it never looks like a favour.", "I'm in no hurry. Tell me about the thing with the bus.", 2, "c", {warm:1, agr:1}],
    ["The dangerous thing moved before speaking", "Quietly takes the hot pan, the scissors or the ladder out of reach of someone vulnerable and says something light afterwards.", "(slides the pan to the back ring) — Who wants to help me lay the table?", 1, "u", {warm:1}],
    ["Covering a tired colleague's shift", "Takes the late shift from someone running on empty and refuses to discuss it.", "Go home. I'm here anyway. Not a word to the boss.", 3, "c", {warm:1, disc:1}],
    ["A text when the last friend is home", "Asks each friend to send word on reaching home and stays awake until the last message arrives.", "Text me when you're in. I mean it, even if it's three.", 2, "c", {warm:1, disc:1}],
    ["Stepping between a raised voice and its target", "Puts themself in the line of an angry exchange and redirects it at them.", "Talk to me. Not to him. To me.", 5, "d", {asrt:1, warm:1}],
    ["Settling the tab and denying it", "Leaves a note in a coat pocket or pays a stranger's bill, then credits someone else.", "(the bill is already settled) — Must've been the waiter. Lovely service.", 1, "s", {warm:1, ego:-1}],
    ["Staying beside the upset person without fixing", "Sits alongside someone in distress with a hot drink and asks no questions, however long it takes.", "(pulls up a chair, sets a tea down, says nothing at all)", 2, "u", {warm:1, emo:1}],
    ["A break called when the quietest goes quiet", "Notices one person's silence in a long meeting and stops proceedings with a practical reason.", "Let's stop there. Tea, ten minutes. We've gone at it for hours.", 2, "u", {warm:1, man:1}],
    ["Offering help until the helped must refuse three times", "Presses assistance so persistently that the recipient has to say no again and again.", "Let me. No, let me. Sit down, I'll do the lot. Have you eaten?", 5, "c", {warm:1, vol:1}],
    ["Walking the stranger there instead of pointing", "Takes a lost stranger all the way to the door they are looking for rather than giving directions.", "It's easier if I just show you. I'm going that way. I'm not, but I am now.", 3, "c", {warm:1, act:1}],
    ["Rescuing the small creature", "Stops the car for a hedgehog, carries a spider out in a glass and tells the room off for stepping on the snail.", "Hold on, there's a snail on the path. Go round.", 2, "u", {warm:1}],
    ["Softening the hard figure for the person who is ill", "Reframes a bleak figure for the person it concerns and corrects any visitor who does not.", "Don't tell her it's a month. Tell her the doctors are pleased with the plan.", 3, "d", {warm:1, hon:-1}],
    ["Declining to discuss someone's trouble", "Turns down gossip about another's illness, debts or divorce and moves it on with a practical question.", "Not ours to talk about. Is it going to rain, does anyone know?", 2, "s", {man:1, warm:1}]
  ]);

  V2.block(out, S, "Hospitality", 222500, [
    ["The kettle before the name", "Treats the offer of tea as the first question to anyone on the doorstep and asks who they are afterwards.", "Come in, come in. Tea? Milk? Sugar? Now, who are you?", 3, "c", {warm:1, man:1}],
    ["The good chair for the guest", "Rearranges the room so the visitor sits best and is wounded if they swap.", "No, that one's the comfy one. Take it. I'll have the stool.", 3, "u", {warm:1, man:1}],
    ["The second helping pressed", "Presents more food until the guest has to hold up a hand, and then presents it again.", "You've barely touched it. Have more. Have the rest. I made too much.", 5, "c", {warm:1, vol:1}],
    ["A parcel to take home", "Wraps leftovers in foil and will not let anyone leave without a tub.", "Take it. There's a tub in the bag. Bring the tub back whenever.", 3, "c", {warm:1}],
    ["The late arrival waved off", "Dismisses an apology for lateness and reheats the meal without a flicker of reproach.", "You're here, that's the thing. Sit, it's all still warm.", 2, "u", {warm:1, mood:1}],
    ["Asking beforehand what the guest cannot eat", "Rings ahead to ask about allergies and food customs, and would rather shop twice than get it wrong.", "Before you come: anything you can't eat? Nothing at all? Tell me now, I'd rather shop twice.", 2, "u", {warm:1, disc:1, man:1}],
    ["Another place laid for the stranger at the door", "Sets an extra plate without a word when someone unknown turns up at mealtime.", "Another plate? Already on it. Sit, sit.", 4, "d", {warm:1, asrt:1}],
    ["Apologising for the mess, then insisting they stay at ease", "Disclaims the state of the house in the hall and tells the guest to ignore it entirely.", "Sorry about the state of it. Don't mind it. Just move the cat.", 2, "c", {man:1, warm:1}],
    ["A bed kept ready", "Holds a spare bed, made up with a folded blanket, for someone who might need it and mentions it only if asked.", "(opening a cupboard) — There's a made bed upstairs. There always is.", 1, "s", {warm:1, disc:1}],
    ["No washing up for guests", "Takes the cloth from a visitor's hands and walks them to a seat, over every protest.", "Put that down. Guests don't wash up. Go and sit. Go on.", 5, "c", {warm:1, asrt:1}],
    ["Seeing the visitor past the gate", "Walks callers beyond the front door to the gate or the corner and waves until they are out of sight.", "Mind the step. Mind the road. Go on, I'll wait.", 1, "u", {warm:1, disc:1}],
    ["Each regular's cup remembered", "Remembers how every visitor takes their drink and has it poured before they sit.", "Oat milk, no sugar, the blue mug. There you go.", 2, "d", {warm:1, disc:1}],
    ["Greeting the arrival as though expected", "Welcomes a newcomer with 'there you are' as if they were awaited, which makes them part of the evening at once.", "There you are! We were starting to think you'd lost the street.", 3, "d", {warm:1, pos:1}],
    ["Insisting on paying for the table they invited", "Overrides every attempt to split the bill with a settled refusal to discuss it.", "I asked you. I'm paying. We're not discussing it.", 4, "u", {warm:1, asrt:1}],
    ["A job for the hovering newcomer", "Draws a guest from the doorway with a small task, so they are included without being made a fuss of.", "Can you taste this for me? Too salty? Honest opinion.", 3, "u", {warm:1, man:1}],
    ["The back door left on the latch", "Keeps the door unlocked for a neighbour or returning friend, with the kettle filled before bed.", "It's open. It's always open. Just come in and shout.", 2, "s", {warm:1, pos:1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_VALUES);
