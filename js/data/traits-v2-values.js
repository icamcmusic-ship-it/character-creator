/* v2 content: Values & Moral Line: six new categories. IDS 222000-222999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_VALUES = (function(){
  const out = [];
  const S = "Values & Moral Line";

  V2.block(out, S, "Tradition & Rite", 222000, [
    ["We do it this way, and nobody can say why", "Defends an odd family procedure, such as cutting the loaf from the left, with 'we just do' and a look that closes the subject.", "You cut it from the left. Why? Because you do. Pass the knife.", 3, "c", {disc:1, form:1}],
    ["Keeps the anniversary rite to the minute", "Observes the same small ceremony on the same date each year, a candle or a walk to one bench, and treats a missed year as a breach.", "Half past four, the bench, the flask. Same as every year. Come or don't, but I'm going.", 3, "u", {disc:1, emo:1}],
    ["Gives a new gadget a year's probation", "Treats a new machine or recipe as a guest on trial and says it will be judged after the seasons have turned.", "We'll see about the new machine. Ask me again next autumn.", 2, "c", {cur:-1, disc:1}],
    ["Rearranges the mourners into the proper order", "Steers relatives by the elbow into the correct sequence behind the coffin before anyone has asked.", "(a hand on an elbow) — Not there, love. Spouse, then children, then siblings. Just so.", 4, "d", {form:1, asrt:1}],
    ["It isn't done, that's all", "Offers a flat verdict in place of a reason when a custom is broken, and expects the verdict to be enough.", "You don't open presents before the toast. It isn't done.", 4, "c", {form:1, asrt:1}],
    ["Runs the house by the date, not the weather", "Lights the first fire, puts out the winter bedding and opens the windows on fixed days whatever the thermometer says.", "First of October, the heating goes on. I don't care if it's twenty-two degrees out.", 3, "u", {disc:1, rebel:-1}],
    ["Teaches the gesture and withholds the reason", "Passes on a skill by guiding the learner's hands and answering 'why' with 'because that is how it goes'.", "No, like this. (moves the child's hand) Feel that? That's it. Don't ask me why.", 2, "d", {warm:1, disc:1}],
    ["Holds the first fork until the words are said", "Stops a meal before it begins and waits, with a hand raised, for the grace, the toast or the saying that opens it.", "Hold on. Nobody lifts a fork till we've said it.", 3, "c", {form:1, man:1}],
    ["Takes the same seat at every gathering", "Reaches for one particular chair at each family occasion, and meets a stranger sitting in it with a pause rather than a word.", "(stops beside the taken chair, then settles in the next one without comment)", 1, "s", {asrt:-1, disc:1}],
    ["Keeps the long method after a quicker one is proven", "Declines a shortcut that demonstrably works because the slow way is what the job means to them.", "Yes, it's quicker. It's also not how you make it.", 3, "u", {disc:1, cur:-1}],
    ["Wants the vows said in full", "Halts a ceremony, a handover or a promise to demand the whole form of words rather than a 'you know what I mean' version.", "Say the whole thing. Not 'you know'. The whole thing, start to finish.", 5, "d", {form:1, asrt:1}],
    ["Counts the days of mourning aloud", "Marks a death by the traditional intervals and states the number as if reading a gauge, leaving the room untouched until it is reached.", "That's thirty-one days. We leave her room as it is till forty.", 2, "d", {emo:1, disc:1}],
    ["Takes the family office as a duty", "Performs the inherited job at gatherings, the carving, the pouring or the opening speech, and bristles at offers to relieve them.", "I carve. I've always carved. Sit down, it's done properly or it isn't done.", 3, "u", {asrt:1, disc:1}],
    ["Protests the rushed ceremony at full volume", "Objects loudly when a rite is trimmed to fit the schedule, and lists what has been cut and how long it used to take.", "Twenty minutes? We've done this three hundred years and you want twenty minutes?", 5, "c", {vol:1, asrt:1}],
    ["Knows the proper form for the occasion", "Quietly corrects the medium, the timing or the wording of a card, a call or a thank-you without raising their voice.", "For that you write a letter. By hand. Within the week.", 1, "u", {form:1, man:1}],
    ["Narrates a dull task as the last of a long line", "Mentions, while laying a table or winding a clock, who did it before them and how many times it has been done.", "(smoothing the cloth) — My aunt pressed this crease. Her mother before. I just keep it going.", 2, "s", {warm:1, emo:1}]
  ]);

  V2.block(out, S, "Purity & Sanctity", 222100, [
    ["Will not let two things touch", "Keeps one board, cup or cloth for one purpose by a rule nobody else follows, and rewashes it if the line is crossed.", "Not that board. That's the bread board. Meat has its own.", 3, "c", {disc:1}],
    ["Flinches when the sacred is used as a joke", "Stiffens at a holy word, an anthem or the name of the dead turned into a punchline, and lets the silence stand.", "(laughter round the table; they set down the glass and look at the cloth)", 3, "u", {man:1, mood:-1}],
    ["Keeps the front room for best", "Holds a room back for visitors and occasions, and tells sticky-fingered children they may look from the doorway.", "That room's for guests and funerals. You can look from the door.", 3, "u", {form:1, disc:1}],
    ["Leaves the phone outside the place", "Puts the device in the car or the bag at a graveyard gate, a library or a kitchen, and is faintly surprised by those who do not.", "It stays in the car. Some places you go in with empty hands.", 1, "u", {disc:1, form:1}],
    ["Won't decide anything big until washed and cleared", "Refuses to sign, swear or choose on a serious matter until they have cleared the desk and cleaned up.", "Not like this. Let me wash, clear the desk, and then we talk about it.", 3, "d", {disc:1, pace:-1}],
    ["Sets the first piece aside for the absent", "Puts the first slice or first pour on a small plate for the dead or the missing before anyone takes any.", "First slice goes on the little plate. Then we eat.", 2, "d", {warm:1, emo:1}],
    ["Says the thing was ruined by its use", "Declares a cup, a room or a story spoiled by a careless use and cannot be argued back into liking it.", "Not after what that cup was used for. I can wash it a hundred times. I can't look at it.", 4, "d", {asrt:1, pos:-1}],
    ["Bins the gift from the wrong hands", "Gives away or throws out a present from someone they hold in contempt rather than let it onto the shelf.", "It came from him. I'm not having it in the house. Charity shop.", 4, "d", {asrt:1, agr:-1}],
    ["Drops to a murmur at certain gates", "Lowers the voice at a graveyard gate, a surgery door or an empty hall, mid-sentence and without noticing.", "(voice drops at the gate, mid-sentence) — ...the car's just along there.", 1, "s", {vol:-1, man:1}],
    ["Ends the distasteful job by washing their hands", "Finishes an unpleasant conversation or task with a long, deliberate scrub at the sink, as if closing a book.", "(runs the tap, soaps to the wrist) — Right. That's that done.", 2, "s", {disc:1}],
    ["Talks about money and deals as clean or dirty", "Uses the vocabulary of stains for conduct, so that a deal is clean, a favour is dirty and a firm has a mark on it.", "I'll take it from a clean pocket or not at all.", 3, "c", {form:1, hon:1}],
    ["Refuses the dish after a fork has strayed into it", "Declares the shared plate unusable after someone's fork or finger has crossed into it, in front of everyone.", "Who put that back? Right. None of us is eating that now.", 5, "c", {vol:1, asrt:1}],
    ["Steers visitors around the dead person's chair", "Leaves a mug, chair or hook empty for a set time after a death and redirects guests with a short phrase.", "That's his. Not yet. Sit over there, please.", 2, "u", {emo:1, warm:1}],
    ["Shushes the room when the solemn moment starts", "Raises a finger as the toast, anthem or minute's silence begins and glares at a cough.", "Shh! It's the anthem. Not a whisper.", 5, "c", {asrt:1, form:1}],
    ["Keeps the table for eating", "Refuses laptops, papers and quarrels at the dining table because the table has one purpose and they enforce it.", "Not at the table. The table is for faces and food. Take the papers away.", 3, "c", {disc:1, asrt:1}],
    ["Cannot bear a thing used against its purpose", "Takes a book off the cup it is under, lifts a photo frame from the coaster pile and says what each is for.", "Not on the books. You don't put a mug on books.", 2, "d", {disc:1, form:1}]
  ]);

  V2.block(out, S, "Autonomy & Liberty", 222200, [
    ["Hears advice as an attempt at control", "Takes 'have you thought about' as a move in a contest and says so, however kindly it was meant.", "Have I thought about it. Yes. Thank you for checking that I can.", 3, "d", {asrt:1, agr:-1}],
    ["Leaves any group that votes on their choices", "Walks out of a committee, rota or pact the moment their own decision goes to a show of hands.", "You can vote on the budget. You can't vote on me. I'm out.", 4, "d", {rebel:1, asrt:1}],
    ["Bristles at the weekly status update", "Meets status updates, check-ins and 'just keeping you in the loop' with the complaint that the job was fine before anyone asked.", "Is there a reason you're asking how it's going, or are you just counting me?", 5, "c", {rebel:1, agr:-1}],
    ["Drops the plan once someone insists on it", "Abandons something they were about to do the moment a person says 'you should'.", "I was going to. Now I'm not. You said 'should'.", 3, "c", {rebel:1, agr:-1}],
    ["Asks who decided that", "Questions the origin of a rule, schedule or seating plan before agreeing to it, with real curiosity as well as edge.", "Who decided half past? Was anyone asked? Fine, I'm only curious who.", 2, "c", {cur:1, rebel:1}],
    ["Will not sign up for a standing slot", "Turns down rotas, subscriptions and standing arrangements because they want to be free next Thursday.", "Not every Thursday. Ask me each Thursday and I'll probably come.", 2, "u", {rebel:1}],
    ["Brings their own car so they can leave", "Drives separately to the group outing, and gives the real reason only if pressed.", "I'll drive myself. No, honestly, I like being able to go.", 1, "u", {rebel:1, disc:1}],
    ["Defends another person's right to a bad choice", "Tells worried relatives to leave someone alone with a decision they themselves think is a mistake.", "It's a daft idea. It's his daft idea. Leave him alone.", 3, "d", {asrt:1, hon:1}],
    ["Answers when they are ready", "Lets a question sit for days rather than be hurried, then replies on a date of their own choosing.", "(looks at the question, puts it down) — I'll tell you Sunday.", 1, "s", {pace:-1, mood:1}],
    ["Argues with the safety sign", "Reads a 'for your own safety' notice aloud and then does the opposite, on principle and at volume.", "'For your own safety.' Mine. Which I get to decide on. Hold my coat.", 5, "c", {rebel:1, vol:1}],
    ["Hears the surprise party as a decision made about them", "Treats a trip or party arranged without asking as an imposition, however much it cost.", "You booked it? For me? Without asking? Lovely. Cancel it.", 4, "u", {rebel:1, asrt:1}],
    ["Keeps their movements to themselves", "Declines to say where they are going or whom they are meeting, out of a sense that it is theirs and not for any secrecy.", "Out. Back later. I'm not being mysterious, I just don't report.", 2, "s", {rebel:1, asrt:1}],
    ["Resigns at the first tie-in clause", "Leaves a job or club when a bonding clause, a loyalty scheme or 'we're like family' language appears.", "Two-year tie-in? No, thanks. I like leaving by the door I came in.", 3, "u", {rebel:1, ego:1}],
    ["Takes 'we need to talk' as a summons", "Pushes back on being told a conversation is necessary and asks to be asked instead.", "'We need to talk.' Need. Says who? Ask me if I'd like to.", 3, "u", {rebel:1, agr:-1}],
    ["Answers messages in a batch, when they choose", "Declines to be reachable on demand and replies at set times, however many people are waiting.", "I saw it. I answer at six. That's when I answer.", 2, "c", {rebel:1, disc:1}],
    ["Corrects anyone who sums them up in a word", "Bridles at 'the quiet one' or 'the sensible one' and spends the following week doing something to disprove it.", "Sensible? Is that what I am? Give me a minute.", 4, "d", {rebel:1, ego:1}]
  ]);

  V2.block(out, S, "Fairness", 222300, [
    ["Insists the cutter chooses last", "Applies the childhood rule of division to every cake, bill and chore, whoever is present.", "You cut it, you pick last. That's how it works.", 3, "c", {disc:1, hon:1}],
    ["Says aloud that one plate is bigger", "Remarks evenly that a portion, a chore or a break is unequal, as a fact for the table rather than a complaint.", "Mine has four prawns, yours has two. I'm not complaining, just noting it.", 3, "c", {hon:1, asrt:1}],
    ["Keeps score, and reports being behind", "Holds a running tally of favours and cheerfully announces when they are the one in debt.", "I'm down three lifts. I'll drive Thursday. Don't argue, I've checked.", 3, "d", {hon:1, disc:1}],
    ["Itemises the bill to the penny", "Reaches for the calculator at the end of dinner and splits the check by who ate what, adding their own extra glass.", "You had the starter, I didn't. Two ninety. I'll do the app.", 4, "c", {disc:1, intel:1}],
    ["Asks whether they would say that of their brother", "Tests a judgement by swapping the people in it before accepting it.", "If it were your brother who'd done that, would you call it a mistake?", 3, "u", {intel:1, hon:1}],
    ["Wants the director on the same clock", "Points to the rule that was used on the junior and asks what the same rule says for the people at the top.", "If I'm written up for ten minutes late, what happens at the director's eleven-fifteen?", 4, "u", {asrt:1, rebel:1}],
    ["Keeps the turns in rotation", "Tracks whose film, whose route and whose turn to host it was last time, and says so before a choice is made.", "Last time was your film. This one's hers. That's how we do it.", 1, "c", {disc:1}],
    ["States the other side's case first", "Declines to argue against a person until they have laid out that person's view in terms the person would accept.", "Let me say your side first. If I get it wrong, tell me. Then I'll say mine.", 2, "d", {intel:1, man:1}],
    ["Puts the bigger half back", "Slides an extra note into the shared pot or returns the larger piece, murmuring a reason nobody checked.", "(slides a note across the table) — I think I took the bigger half last week.", 1, "s", {hon:1, asrt:-1}],
    ["Refuses a win they think was unfair", "Hands back a point, a prize or a promotion that came from a missed foul or a lucky error, and asks for a replay.", "I won't take it. The referee missed his foot. Replay it.", 5, "d", {hon:1, ego:1}],
    ["Declares an interest before judging", "Announces a connection to the parties before ruling on a dispute, a raffle or a seating plan.", "I should say I'm friends with her. Weigh that or ask someone else.", 2, "u", {hon:1, man:1}],
    ["Shouts that it's not fair", "Raises the cry at full volume the moment a rule appears to have been changed halfway, and demands to see the original.", "That is NOT fair! Nobody said five minutes each!", 5, "c", {vol:1, emo:1}],
    ["Adds the person left off the list", "Notices a missing name on an invitation or a thank-you and insists it be put right before the page goes out.", "There are twelve names and Dev is not one. Dev did the flowers. Add Dev.", 3, "u", {asrt:1, warm:1}],
    ["Won't accept a favour not offered to all", "Turns down a perk or a special deal unless the giver would offer it to anyone.", "If you'd give it to anyone, fine. If it's only me, no thank you.", 2, "d", {hon:1, agr:-1}],
    ["Docks their own pay", "Offers to cover the thing they broke, the minutes they took or the half they ate before anyone checks.", "I took the long lunch. Take it off. Twelve minutes.", 2, "s", {hon:1, disc:1}],
    ["Applies the penalty to friends first", "Imposes the fine or the rule on their own circle before anyone else's, to demonstrate it binds everybody.", "Late is late, and it was the club captain. Captain pays the fine. Everybody pays.", 4, "u", {hon:1, disc:1}]
  ]);

  V2.block(out, S, "Care & Protection", 222400, [
    ["Cannot watch a small cruelty", "Speaks up each time a waiter, child or junior is addressed unkindly, whatever it costs them.", "Excuse me. Say that again to her face, but nicely this time.", 4, "u", {asrt:1, warm:1}],
    ["Stops the joke at the vulnerable one's expense", "Cuts across the table's laughter with a flat remark and a change of subject.", "(flat) That's enough. — Anyone want more tea?", 3, "c", {asrt:1, warm:1}],
    ["Feeds the stray before the quarrel", "Puts food down for the dog, the lodger or the stranger and only then takes up the argument.", "Hold that thought. (puts down a saucer) Right. You were saying.", 3, "d", {warm:1}],
    ["Falls into step with the slow one", "Drops back to whoever is last in the line or the walk and chats easily so it never looks like a favour.", "I'm in no hurry. Tell me about the thing with the bus.", 2, "c", {warm:1, agr:1}],
    ["Moves the dangerous thing before speaking", "Quietly takes the hot pan, the scissors or the ladder out of reach of someone vulnerable and says something light afterwards.", "(slides the pan to the back ring) — Who wants to help me lay the table?", 1, "u", {warm:1}],
    ["Takes the blame so the junior doesn't", "Steps in front of an angry manager or parent and names themself as the one who gave the instruction.", "That was my instruction. If anyone's cross, they can be cross with me.", 4, "u", {warm:1, asrt:1}],
    ["Wants a text when the last friend is home", "Asks each friend to send word on reaching home and stays awake until the last message arrives.", "Text me when you're in. I mean it, even if it's three.", 2, "c", {warm:1, disc:1}],
    ["Steps between a raised voice and its target", "Puts themself in the line of an angry exchange and redirects it at them.", "Talk to me. Not to him. To me.", 5, "d", {asrt:1, warm:1}],
    ["Settles the tab and denies it", "Leaves a note in a coat pocket or pays a stranger's bill, then credits someone else.", "(the bill is already settled) — Must've been the waiter. Lovely service.", 1, "s", {warm:1, ego:-1}],
    ["Answers the nasty remark about someone absent", "Replies in the group chat or at the table to a cruel comment about someone who is not there, even if the room goes quiet.", "That's about a person who isn't here. Delete it.", 3, "c", {asrt:1, hon:1}],
    ["Calls a break the moment the quietest goes quiet", "Notices one person's silence in a long meeting and stops proceedings with a practical reason.", "Let's stop there. Tea, ten minutes. We've gone at it for hours.", 2, "u", {warm:1, man:1}],
    ["Offers help until the helped must refuse three times", "Presses assistance so persistently that the recipient has to say no again and again.", "Let me. No, let me. Sit down, I'll do the lot. Have you eaten?", 5, "c", {warm:1, vol:1}],
    ["Waits until the last person is safe", "Stays at the stop, the party or the site until the last person has a lift, and brushes off being called silly.", "I'll wait with you. It's no trouble. It's the not knowing I can't do.", 4, "d", {warm:1, disc:1}],
    ["Takes the spider out in a glass", "Stops the car for a hedgehog, carries the insect outside, and has views on how a neighbour's dog is kept.", "Hold on, there's a snail on the path. Go round.", 2, "u", {warm:1, act:1}],
    ["Softens the hard fact for the one who is ill", "Reframes a bleak figure for the person it concerns and corrects any visitor who does not.", "Don't tell her it's a month. Tell her the doctors are pleased with the plan.", 3, "d", {warm:1, hon:-1}],
    ["Won't discuss someone's trouble", "Declines gossip about another's illness, debts or divorce and moves it on with a practical question.", "Not ours to talk about. Is it going to rain, does anyone know?", 2, "s", {man:1, warm:1}]
  ]);

  V2.block(out, S, "Hospitality", 222500, [
    ["The kettle before the name", "Treats the offer of tea as the first question to anyone on the doorstep and asks who they are afterwards.", "Come in, come in. Tea? Milk? Sugar? Now, who are you?", 3, "c", {warm:1, man:1}],
    ["Gives the guest the good chair", "Rearranges the room so the visitor sits best and is wounded if they swap.", "No, that one's the comfy one. Take it. I'll have the stool.", 3, "u", {warm:1, man:1}],
    ["Presses the second helping", "Presents more food until the guest has to hold up a hand, and then presents it again.", "You've barely touched it. Have more. Have the rest. I made too much.", 5, "c", {warm:1, vol:1}],
    ["Sends the guest home with a parcel", "Wraps leftovers in foil and will not let anyone leave without a tub.", "Take it. There's a tub in the bag. Bring the tub back whenever.", 3, "c", {warm:1}],
    ["Waves off the late arrival", "Dismisses an apology for lateness and reheats the meal without a flicker of reproach.", "You're here, that's the thing. Sit, it's all still warm.", 2, "u", {warm:1, mood:1}],
    ["Takes the cracked cup for themself", "Serves the guest the best of everything and keeps the end piece and the chipped mug without remark.", "(passing the platter) — That's the nice one. I like the end bits.", 2, "d", {warm:1, ego:-1}],
    ["Lays another place for the stranger at the door", "Sets an extra plate without a word when someone unknown turns up at mealtime.", "Another plate? Already on it. Sit, sit.", 4, "d", {warm:1, asrt:1}],
    ["Apologises for the mess, then insists they stay at ease", "Disclaims the state of the house in the hall and tells the guest to ignore it entirely.", "Sorry about the state of it. Don't mind it. Just move the cat.", 2, "c", {man:1, warm:1}],
    ["Keeps a bed ready", "Holds a spare bed, made up with a folded blanket, for someone who might need it and mentions it only if asked.", "(opening a cupboard) — There's a made bed upstairs. There always is.", 1, "s", {warm:1, disc:1}],
    ["Won't let a guest wash up", "Takes the cloth from a visitor's hands and walks them to a seat, over every protest.", "Put that down. Guests don't wash up. Go and sit. Go on.", 5, "c", {warm:1, asrt:1}],
    ["Sees the visitor past the gate", "Walks callers beyond the front door to the gate or the corner and waves until they are out of sight.", "Mind the step. Mind the road. Go on, I'll wait.", 1, "u", {warm:1, disc:1}],
    ["Knows each regular's cup", "Remembers how every visitor takes their drink and has it poured before they sit.", "Oat milk, no sugar, the blue mug. There you go.", 2, "d", {warm:1, disc:1}],
    ["Greets the arrival as though expected", "Welcomes a newcomer with 'there you are' as if they were awaited, which makes them part of the evening at once.", "There you are! We were starting to think you'd lost the street.", 3, "d", {warm:1, pos:1}],
    ["Insists on paying for the table they invited", "Overrides every attempt to split the bill with a settled refusal to discuss it.", "I asked you. I'm paying. We're not discussing it.", 4, "u", {warm:1, asrt:1}],
    ["Gives the hovering newcomer a job", "Draws a guest from the doorway with a small task, so they are included without being made a fuss of.", "Can you taste this for me? Too salty? Honest opinion.", 3, "u", {warm:1, man:1}],
    ["Leaves the back door on the latch", "Keeps the door unlocked for a neighbour or returning friend, with the kettle filled before bed.", "It's open. It's always open. Just come in and shout.", 2, "s", {warm:1, pos:1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_VALUES);
