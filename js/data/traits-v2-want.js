/* v2 content: Core Want. IDS 210000-210999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_WANT = (function(){
  const out = [];
  const S = "Motivation & Wound", C = "Core Want (conscious goal)";

  // Credit, being seen, status, being chosen
  V2.block(out, S, C, 210000, [
    ["To be credited where it happened", "Waits through a whole meeting for the one sentence that names their part, and wants it spoken aloud rather than sent round afterwards.", "Say it here. Not in the follow-up email, here, while they're all listening.", 3, "d", {ego:1, asrt:1}],
    ["Their idea, remembered as theirs", "Interrupts the retelling to supply the date and the author, and hears any other attribution as theft.", "That was in my March memo. For the minutes, that was March.", 4, "c", {ego:1, asrt:1}],
    ["The title on the door", "Corrects forms, introductions and envelopes that leave out the rank they worked for, and does it with a smile that stays put.", "It's Dr, actually. I did the work. It's on the door.", 4, "c", {ego:1, form:1}],
    ["A seat where it gets decided", "Angles for a place in the room one level up, turning up to the pre-meeting with the figures nobody asked for.", "Who's in on Thursday? Right. I'll just pop in with the numbers.", 3, "u", {asrt:1, ego:1}],
    ["To be head-hunted, not hired", "Refuses to apply for anything and waits for the call to come to them, treating every unsolicited message as a verdict.", "I don't apply. I wait for the phone. It has rung before.", 3, "d", {ego:1, asrt:-1}],
    ["An invitation to stay a little longer", "Lingers at the door at the end of an evening with the car keys in hand, hoping to be asked on to the next place without having to say so.", "(keys in hand, not moving) Well. That was lovely. I suppose I should... (looks at the door, then at them)", 2, "d", {emo:1}],
    ["To be the famous one", "Rehearses acceptance speeches in the bath, rates every room by how many people in it know who they are, and says outright that it is a when, not an if.", "I'll be famous, you know. The only question is for what.", 5, "c", {ego:1, vol:1, asrt:1}],
    ["To be someone's name in the box", "Volunteers to be the emergency contact on other people's forms, offering it as a favour so that nobody has to ask.", "Put me down. Next of kin. I don't mind. I'd just like to be in the box.", 2, "s", {emo:1, warm:1}],

    // Undoing, repairing, restoring
    ["The old van running again", "Spends weekends under the bonnet of a dead person's vehicle, refusing every offer to buy something newer.", "She drove it across Wales. It's got one more trip in it. It just doesn't know yet.", 3, "u", {disc:1, warm:1}],
    ["Taking back the thing said in the car park", "Replays one sentence from a quarrel years ago and drafts the way it should have gone, to deliver if the chance ever comes.", "I've got the whole conversation redone. I only need her to be standing there.", 3, "d", {emo:1, hon:1}],
    ["A casserole dish, thirty years overdue", "Has kept a neighbour's casserole dish since 1994 and is quietly composing what to say on the day it is finally handed back.", "It's still got her initials on the bottom. I'm taking it round. I've got a little speech.", 2, "s", {hon:1}],

    // Escape
    ["A bus out of town, memorised", "Knows the departure time of the six-ten by heart and speaks of the day they will take it as settled.", "Six-ten. Platform two. Not today. But I know it.", 3, "c", {rebel:1}],
    ["Somewhere the story hasn't reached", "Pictures one small town where nobody has heard what happened, and browses its rental listings late at night.", "Somewhere they've never heard it. Where it's just... a thing that happened to somebody.", 3, "d", {mood:-1}],
    ["To stop being the sensible one", "Waits for the day when someone else can be the adult, ordering the pudding and the bad idea in one go.", "Let somebody else be the grown-up. I'm having the pudding and a terrible plan.", 3, "u", {rebel:1, disc:-1}],
    ["The family chat on mute", "Mutes the family thread when leaving a visit, then reads all forty messages in secret in the next room.", "(phone buzzing the thirty-eighth time) Muted. I've muted it. ...What did Dad say?", 2, "c", {warm:-1, emo:-1}],
    ["Out of this town tonight", "Has the bag in the boot and the tank full, and reads every delay as proof that staying one more night means staying for good.", "Bag's in the boot. If I'm here tomorrow, I'm here for life.", 5, "c", {act:1, rebel:1}],

    // Belonging
    ["A usual, started before they reach the till", "Goes to the same café most mornings, hoping the order will be under way before they reach the counter.", "She'd started it before I got to the till. Did you see that? Before I got there.", 2, "s", {warm:1, emo:1}],
    ["The in-joke that includes them", "Hovers at the edge of a friendship, laughing a beat late and wanting the next one to be about them.", "(laughs a beat late) Ha. Right. Who said it first?", 3, "d", {emo:1, ego:-1}],
    ["A badge, a mug, a membership number", "Joins things (the quiz team, the choir, the allotment society) and begins saying 'we' within a week.", "Member two-twelve. We do the quiz on Thursdays. We're second in the league.", 3, "c", {warm:1, ego:-1}],

    // Control over one domain
    ["The kitchen, run their way", "Hands the rest of the house over gladly but guards the one room, relabelling jars and re-sorting whatever others have put away.", "You do what you like with the rest of it. The kitchen is mine. Labelled, alphabetised, mine.", 3, "c", {asrt:1, disc:1}],
    ["A no that stays no", "Rehearses a refusal in the mirror, hoping one day it will be accepted the first time it is said.", "I said no. (pause) I said no. Why are we still talking about it?", 3, "u", {asrt:1}],
    ["Knowing how it works underneath", "Takes things apart until each layer makes sense and will not use a tool they cannot explain from the bottom up.", "I'm not using the app. Show me what's under the app.", 3, "u", {intel:1, cur:1}],

    // Comfort & rest
    ["A whole afternoon horizontal", "Negotiates in advance for a stretch of lying down and sets a boundary round it as firm as any meeting.", "I'm lying down at two and I'm not getting up till it's dark. Don't tell me what's on.", 2, "c", {act:-1, mood:1}],
    ["A window seat, if it's free", "Hopes for one small comfort on the journey and arrives early on the off-chance.", "Window, if it's free. If not, no worries. (a small private wince)", 1, "c", {mood:1}],
    ["One proper cup of tea", "Chases the perfect brew across the day, adjusting the milk by a spoonful each time and noting the result.", "Nearly. Nearly there. A touch less milk tomorrow.", 1, "c", {disc:1}],
    ["A night's sleep, the full eight", "Plans the evening backwards from a bedtime and quietly resents anything that crosses it.", "Eight hours. It's not a lot to ask. It's the only thing I ask.", 1, "c", {disc:1, mood:-1}],

    // Settling a score, vindication, being proved right
    ["A snub repaid with flowers", "Remembers a specific snub for years and answers it with a pleasant gift sent at precisely the right moment.", "She left me off the list in 2014. I've been very patient. I sent flowers. I'm not a monster.", 4, "d", {agr:-1, man:1}],
    ["Page fourteen, if anyone looks", "Keeps the dated report that was overruled, and waits for the collapse in order to cite it.", "Page fourteen. I flagged this on page fourteen.", 4, "d", {ego:1, intel:1}],
    ["The three words: you were right", "Holds out for the exact three words from the exact person, and counts anything else as a dodge.", "I'll wait. I've got all night. 'You were right, Dad.' Go on.", 4, "c", {ego:1, asrt:1}],
    ["To win, here, today", "Turns any card game, argument or parking space into a decider and can see only the scoreboard.", "I'll beat you at this. And the next thing. Pick a game, any game.", 5, "c", {asrt:1, act:1}],

    // Abandoned dreams
    ["The cello back out of its wardrobe", "Tunes an instrument given up at twenty-two but stops short of playing, as if the real thing would end the dream.", "It's in the wardrobe. I tune it sometimes. Only the tuning, mind.", 2, "s", {emo:1}],
    ["Two modules short of the degree", "Keeps the reading list and the module codes and answers 'I'm still doing it, sort of' when asked.", "Two modules. Everyone says it's too late. The library's open till ten.", 3, "u", {disc:1, cur:1}],
    ["The novel in the bottom drawer", "Reads page forty for the hundredth time, changes one comma, and puts it away.", "(rereads the first page, changes a comma, shuts it) Still good. That's the annoying part.", 2, "s", {cur:1, ego:-1}],
    ["The job abroad turned down at thirty", "Quizzes anyone who emigrated about how it went, with a flight to the city they once refused half-booked in another tab.", "Did you ever think about Lisbon? Because I've looked at flights. Not that I'm going.", 3, "d", {rebel:1, pos:1}],
    ["One more night on the stage", "Hangs around the amateur dramatics, unable to resist a cue, and would take any part going.", "I'd be perfectly happy with the small part. I'd be happy with the donkey.", 3, "d", {emo:1, vol:1}],
    ["Eleven of forty flying hours", "Keeps a half-filled logbook in the glovebox and mentions the licence as something not yet abandoned.", "Eleven hours logged, twenty-nine to go. The book's in the glovebox. It's only paused.", 2, "s", {cur:1}],

    // Pride
    ["Never to be pitied", "Meets sympathy with a joke or a better-sounding version of the truth, and is gone before it can land.", "Oh, it's the best thing that could have happened. New flat, new start. Brilliant.", 4, "d", {ego:1, emo:-1}],
    ["Walking home rather than asking", "Weighs every option by whether it can be done without anyone seeing them need a favour.", "I'll walk. Honestly, lovely night for it, and it's only nine miles.", 4, "c", {ego:1, agr:-1}],

    // Envy of an ordinary life
    ["The bin argument next door", "Slows by a neighbour's lit window and would give a great deal for a row about the bins.", "Look at them arguing about bins. I'd give a kidney to argue about bins.", 3, "d", {emo:1, mood:-1}],
    ["Other people's fridge doors", "Looks at the school photos, takeaway menus and magnets in other people's kitchens as if reading about a country they might visit.", "Look at all that. Schedules. Photos. A magnet from Skegness. Just sitting there.", 3, "u", {emo:1, mood:-1}],
    ["The ease of the person beside them", "Watches someone for whom things are simple and feels a small, cheerful, ungenerous heat.", "Look at him. Doesn't even know it's hard. Doesn't even know.", 3, "u", {warm:-1, mood:-1}],

    // Freedom from obligation
    ["The promise made at the bedside", "Rereads the exact wording of a deathbed vow, looking for an end date nobody thought to include.", "I said I'd look after the shop. I never said for how long.", 3, "u", {rebel:1, disc:-1}],
    ["The resignation, signed, in a bag", "Carries a finished letter of resignation for weeks, and would hand it over as soon as there was a person to give it to.", "It's in my bag. It's signed. I just need a human to hand it to.", 3, "d", {rebel:1, mood:-1}],

    // Being needed, being missed
    ["To be the answer at three a.m.", "Keeps the phone loud and is quietly glad when an emergency lands on them.", "(already up when the phone goes) Yes. Tell me where you are.", 3, "u", {warm:1, act:1}],
    ["To be missed when away", "Takes a day off just to see whether the office notices, then asks around until someone says so.", "Did anyone ask where I was? Anyone at all?", 3, "d", {emo:1, ego:-1}],

    // To be left alone
    ["To be left entirely alone", "Takes the late shift, the far desk and the empty lane, and meets invitations with a pleasant mention of being busy.", "Lovely idea. I've got a thing. A thing that night. Another time.", 3, "c", {warm:-1, vol:-1}],
    ["Fewer questions about how they are", "Answers with a bright 'and you?' so quickly that the follow-up has no room to land.", "Oh, you know. Ticking along. What about your lot? Still in the new place?", 2, "c", {vol:-1, mood:-1}],

    // Truth, once
    ["To say it once, to the right face", "Rehearses one confession in the car and in the shower, trimming it a little each day and never yet delivering it.", "I've got it down to four sentences. It used to be forty.", 4, "d", {hon:1, emo:1}],
    ["The sealed file, requested", "Has written to a records office three times for a case file that may mention them, and logs each reminder in a notebook.", "I filed the request in April. I'm on the third reminder. They'll tire first.", 3, "d", {intel:1, hon:1}],
    ["The real reason, from the person who left", "Waits for the one honest answer and will sit as long as it takes, saying that there is no hurry.", "You don't have to tell me now. But you'll tell me.", 4, "d", {emo:1}],

    // Legacy
    ["A building with their name on the lintel", "Imagines gold leaf over a door and a future in which people say whose it was long after.", "Over the door. Gold leaf. They'll say 'Marsh's' for a hundred years.", 4, "d", {ego:1}],
    ["The recipe, in exact quantities", "Writes down a family dish to the gram and corrects any relation who alters it.", "Two fingers of salt, not a pinch. Write it down. It won't make sense in my head forever.", 2, "u", {warm:1, disc:1}],
    ["A bench with a plaque", "Reads the inscriptions on park benches and is quietly pricing one for themselves.", "Seven hundred pounds, apparently. I've drafted three versions of what it'd say.", 2, "s", {ego:1}],
    ["A walnut tree for the next owner", "Plants slow things on land that will not be theirs, and likes it best when the payback is long.", "Walnut. Thirty years to a crop. Good. I'd rather plant something slow.", 1, "s", {pos:1, mood:1}],

    // Debt repaid
    ["Standing the round for everyone who stood them one", "Pays for the whole table out of an old debt they have not let anyone forget.", "Put your wallet away. Seven years of rounds I owe this table.", 4, "c", {warm:1, hon:1}],

    // Reconciliation
    ["A call that ends in laughing", "Holds a sibling's number on the screen and begins the call twice a week without pressing it.", "(thumb over the green button) Not yet. If she picks up I'll have nothing ready.", 3, "d", {emo:1, warm:1}],
    ["Peace before the tenth anniversary", "Counts down to the date a feud turns a decade and drafts messages against it.", "It's ten years in March. I'm not letting it be ten years.", 3, "u", {emo:1, agr:1}],
    ["To be forgiven before sunset", "Stands at a closed door and says they will stay until it opens.", "I'll stand here. I'll stand here till you open it.", 5, "d", {emo:1, ego:-1}],

    // Mastery
    ["One thing done perfectly", "Redoes the same piece, joint or soufflé until it is flawless and does not count a near miss as practice.", "No. That was a nine. I don't do nines.", 4, "c", {disc:1, ego:1}],
    ["Beating last year's self", "Competes only against their own earlier times and keeps the log to prove it.", "Fourteen forty-one. Last year fourteen fifty-three. That's the only race that counts.", 2, "u", {disc:1}],

    // Adventure
    ["Somewhere the map runs out", "Reads expedition accounts in bed and buys kit well before any trip is planned.", "I've got the boots. Boots are the hardest bit. The rest is just going.", 3, "u", {act:1, cur:1}],
    ["One summer with no return ticket", "Imagines a stretch of life with no plan after thirty years of the sensible one.", "One summer. No return ticket. I've been responsible for thirty years.", 3, "c", {rebel:1, act:1}],
    ["A better story at the end", "Says yes to any offer by arguing it'll make a great story, and is delighted when it goes wrong.", "Yes! Why not? Worst case it's an even better story.", 4, "c", {act:1, pos:1, rebel:1}],

    // Justice for others
    ["A seat behind the family", "Attends every hearing of a case that has nothing to do with them, so the gallery is not empty.", "Nobody was in the gallery for her. So I'm in the gallery.", 4, "d", {warm:1, hon:1}],
    ["The verdict reversed, eventually", "Files appeal after appeal on a case others have closed and says the filing is the point.", "Eleven years of appeals. Twelve. I'll write till they read it.", 5, "u", {disc:1, hon:1}],

    // Safety for a dependant
    ["Every decision for one child's stability", "Plans every move around one child's routine and refuses anything that might uproot it.", "We're not moving. Not for a promotion, not for the sea view. She's got her friends.", 4, "c", {warm:1, disc:1}],
    ["Handrails first, then the argument", "Arranges a parent's later years in advance, with rails, forms and pension dates.", "Handrails in the bathroom first. Then we have the argument about the stairs.", 3, "c", {warm:1, disc:1}],
    ["Keeping the child out of that house", "Treats one particular return as the line that will not be crossed, and says so to anyone who will listen.", "Over my dead body is he going back. Write that down.", 5, "d", {warm:1, asrt:1}],

    // Protecting a secret
    ["To keep the one year buried", "Steers every conversation away from one specific year and keeps a smooth alternative ready.", "Oh, that was before my time here. Tell me about your trip, though.", 3, "d", {hon:-1, mood:-1}],
    ["The box nobody opens", "Carries a sealed box from flat to flat, never opened and never destroyed, and takes the heavy end if anyone helps.", "It's just paperwork. Old paperwork. Don't, it's heavy, I'll take it.", 3, "s", {hon:-1, mood:-1}],
    ["The illness kept off the street", "Hides a family illness from the neighbours, smoothing over every cancelled plan with a cheerful excuse.", "Oh, he's just tired. He's always tired. Come on, have a biscuit.", 4, "d", {hon:-1, warm:1}],

    // Finishing
    ["The last volume of the set", "Searches second-hand stalls with a creased list for the single missing item and will not buy any other.", "I need volume nine. Only nine. I've got eight and ten.", 2, "u", {disc:1, cur:1}],
    ["Finished before the date", "Races a fixed deadline to complete one object and declines everything else until then.", "Eleven weeks. The quilt's done in eleven weeks or it's never done.", 4, "d", {disc:1, act:1}],
    ["Finish it before it finishes them", "Treats the doctor's estimate as a deadline and answers it with a lengthening list.", "They said a year. I've a book to write. I'll take two.", 5, "s", {disc:1, pos:1}],

    // Small, quiet wants
    ["To be asked about the book", "Hopes someone will ask what they are reading and carries it spine-out to help the chance along.", "(holding the book spine-out, just slightly) Oh, this? Yes. It's rather good, actually.", 1, "s", {emo:1}],
    ["A bit less noise", "Says out loud that a little quiet would do, and keeps the door shut by habit.", "Could we just... turn it down a notch? Not off. A notch.", 1, "u", {mood:1}],
    ["The crossword finished by teatime", "Gives a modest daily goal more quiet attention than anything else and shuts the paper with a small nod.", "Seventeen across. That's the last. Tea.", 1, "c", {disc:1, mood:1}],
    ["A word back about the allotment", "Has waited three weeks to hear about a plot on the council allotments and refreshes the page only on Fridays.", "Still nothing from the council. No rush. It'd just be nice to know.", 1, "c", {mood:1, disc:1}],
    ["To see the sea again", "Mentions the coast idly, as something they must get round to, and would go if anyone offered.", "Haven't seen the sea in years. Must get down. Some time.", 1, "u", {mood:1}],
    ["To bring a missing person home", "Posts the flyers, phones the hospitals and refuses to treat any silence as an answer.", "Fourth week. I've got the flyers. I've got the tape. Put one up with me.", 5, "d", {emo:1, act:1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_WANT);
