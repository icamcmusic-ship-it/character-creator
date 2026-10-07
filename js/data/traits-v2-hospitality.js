/* v2 content: Hospitality & Gifts, Greetings & Farewells, Digital Voice (new sections). IDS 232000-232999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_HOSPITALITY = (function(){
  const out = [];

  // ===== Hospitality & Gifts =====
  V2.block(out, "Hospitality & Gifts", "Hosting", 232000, [
    ["Overfeeds the guest", "Keeps loading the plate after the guest has said stop, treating a second helping as the minimum and a third as manners.", "You've hardly touched that. There's more in the oven, I did extra, I always do extra.", 5, "c", {warm:1, asrt:1}],
    ["Offers the armchair, takes the stool", "Steers every visitor to the one comfortable armchair and settles on the wobbly stool themself.", "No, no, that one's yours. Mine's fine. I like a stool, honestly, it's better for my back.", 2, "c", {warm:1, agr:1}],
    ["The kettle as first question", "Has the kettle filling before the coat is off, so the only open matter is which tea.", "Tea or coffee? Tea. Right. Milk? Sugar? There's four kinds of biscuit, don't tell me you're not hungry.", 3, "c", {warm:1, man:1}],
    ["Apologises for the food before it arrives", "Lists every flaw of the meal in advance, so any praise has to climb over the apology first.", "It's only a stew. The carrots went funny and I'd no time for a pudding, so don't expect anything.", 4, "c", {emo:1, ego:-1}],
    ["Takes 'no thank you' as a verdict", "Hears a refused biscuit as a judgement on the whole household and holds the plate out, steady, until it is settled.", "(plate still extended) You don't like them. It's all right. Say if you don't like them.", 5, "d", {asrt:1, mood:-1}],
    ["Tops up before the glass is empty", "Tilts the bottle at the halfway mark, so no guest ever gets to finish a drink and nobody can count.", "(bottle already moving) Don't look at it. I'm only levelling you up.", 3, "u", {warm:1, act:1}],
    ["Scrubs for an hour, then denies it", "Spends the hour before arrival with bleach and a cloth, then waves off the gleam as the house's natural state.", "Oh, this? It's always like this. (smell of lemon, damp tea towel on the radiator)", 3, "u", {disc:1, hon:-1}],
    ["Hosts from the kitchen doorway", "Serves everything and sits down for none of it, leaning in the frame with a tea towel over one shoulder.", "You carry on, I'll be through in a minute. Go on, don't mind me. (stays standing)", 2, "c", {act:1, warm:1}],
    ["Sends guests home with a parcel", "Presses a foil-wrapped package into each departing hand, with no appeal against it.", "Take the rest of the lasagne. I'll not hear no. It's in the foil already, look.", 4, "c", {warm:1, asrt:1}],
    ["Briefs each newcomer on the house", "Gives first-time visitors a short, solemn talk on the flush, the hot tap, and which cat bites.", "Two things. The flush wants a second push, and don't put your hand near Biscuit. That's it. Welcome.", 2, "d", {form:1, intel:1}],
    ["Serves each guest's usual without a word", "Sets down the oat milk, the blue cup or the unsalted crisps before anyone asks, and never mentions it.", "(puts the cup down, says nothing, turns to the window)", 1, "s", {warm:1, emo:-1}],
    ["Runs dinner as a production", "Sets place cards, announces the order of courses and expects the toast to be heard in silence.", "Tonight we begin with soup. Please. Spoons outward. We'll take the wine at the table, not before.", 4, "u", {form:1, ego:1}],
    ["Won't let anyone lift a dish", "Bars the way to the sink and grows short with the one who persists.", "Sit. Sit! You're a guest. If you stand up again I'll tie you to that chair.", 5, "c", {asrt:1, warm:1}],
    ["Watches the first mouthful", "Freezes with fork halfway to nothing while the guest takes a bite, waiting to be told.", "(fork frozen, eyes on your mouth) Well? ... Well?", 3, "u", {emo:1, ego:-1}],
    ["Lays one place too many", "Sets an extra knife and fork at the table in case someone turns up, and leaves it there all evening.", "Might be someone. There's always someone. (the spare chair stays pulled out)", 1, "s", {warm:1, pos:1}]
  ]);

  V2.block(out, "Hospitality & Gifts", "Being a Guest", 232100, [
    ["Insists on washing up", "Is at the sink with sleeves rolled before the host can object, and cannot be moved by argument or bribery.", "No, you cooked. Give me the tea towel. Give it. I'm not asking.", 5, "c", {warm:1, man:1, act:1}],
    ["Arrives with something nobody needs", "Turns up bearing a fourth jar of chutney, a plant for a flat without light, or a board game missing its dice.", "(holding out a fern) It's a bit leggy. It'll perk up once it's settled in.", 3, "u", {warm:1, pos:1}],
    ["Stays an hour past the polite exit", "Misses each natural ending and sits on while the host's yawns lengthen and the washing-up goes cold.", "Is that the time? Well, one more, since I'm here. You don't mind. It's not like you've work.", 4, "c", {man:-1, vol:1}],
    ["Hovers at the edge of the room", "Waits in the doorway to be told where to sit and will not take a cushion uninvited.", "(by the sofa arm) Where would you like me? ... No, I'm happy here. Honestly.", 2, "c", {agr:1, ego:-1}],
    ["Reviews the house aloud", "Hands out considered verdicts on the home: the light, the proportions, the cornicing.", "The cornicing is a triumph. Seriously, who did the cornicing? That's a four-star ceiling.", 3, "d", {form:1, vol:1}],
    ["Tidies the host's things", "Nudges mugs onto coasters and lines up the remotes, never asked and half unaware of it.", "(squaring a magazine against the table edge) Sorry. Don't mind me. It was crooked.", 2, "d", {disc:1, man:-1}],
    ["Reads the bookshelf out loud", "Heads for the spines, tilts their head sideways, and comments to the room on what is and is not there.", "Oh, you've got the second Rankin. Did you not like the first one?", 2, "u", {cur:1, intel:1}],
    ["Narrates each bite", "Gives the host a running report on the food so there is never a moment of doubt.", "Mm. Mm! What is that, is that mace? That's mace. Who puts mace in a pie?", 4, "c", {vol:1, warm:1}],
    ["Declines three times, then accepts", "Turns down the drink, the biscuit and the seat in a ritual, then takes all three on the third offer.", "Oh no, I couldn't. Oh, no. Really. ... Well, if you're making one anyway.", 3, "c", {man:1, agr:1}],
    ["Takes the first seat and keeps it", "Sits where first shown and stays put for four hours, bladder or no bladder.", "(still on the end of the sofa at midnight, knees together, cup long empty)", 1, "u", {agr:1, act:-1}],
    ["Whispers about shoes at the door", "Asks the shoes question in a hiss, then apologises in advance for the socks.", "(hopping, one shoe off) Are we shoes or no shoes? Only I've a hole, I should say.", 2, "c", {man:1, ego:-1}],
    ["Changes into their own slippers", "Carries a bag with house slippers and swaps at the door as though it were a coat.", "(sitting on the stairs, lacing) It's only me being daft. Cold floors, you see.", 2, "d", {disc:1, ego:1}],
    ["Thanks the host on a schedule", "Sends a text within the hour and a card within the week, each a little more formal than the last.", "Dear Marion, just a short note to say how much we enjoyed Saturday. The leeks were a revelation.", 3, "u", {form:1, man:1, disc:1}],
    ["Quietly fixes the dripping tap", "Spots a loose shelf or a leak and sorts it mid-visit with the host's own tools, mentioning it only afterwards.", "(from under the sink) Don't mind me. Got you a new washer. That's what it was.", 2, "s", {act:1, asrt:1}],
    ["Waits in the car until the minute", "Parks outside, engine off, and watches the clock so as not to arrive early.", "(sits in the dark car until 7:00 precisely, then walks up the path)", 2, "d", {disc:1, man:1}]
  ]);

  V2.block(out, "Hospitality & Gifts", "Giving", 232200, [
    ["Leaves the receipt in the gift bag", "Tucks the receipt under the tissue paper, so the present arrives with its own exit.", "It's in the bag if it's the wrong size. No questions. I won't be hurt. Much.", 2, "c", {man:1, ego:-1}],
    ["Gives a gift that is really a hint", "Buys what they wish the recipient would become: running shoes, a book on listening, a gym pass.", "(wrapped, flat) It's a course. On, well, you'll see. No pressure. Honestly.", 3, "d", {hon:-1, agr:-1}],
    ["Gives practical gifts", "Hands over socks, a torch or a first-aid kit, convinced that love is best measured in usefulness.", "It's a torch. You'll thank me in a power cut. It has a dynamo.", 2, "c", {intel:1, emo:-1}],
    ["Gives lavishly to avoid the sentence", "Buys the enormous thing in order not to say the plain, small thing.", "(sliding keys across the table) It's just a car. Don't make a speech. Eat your eggs.", 5, "d", {emo:-1, warm:1}],
    ["Gift with a speech", "Refuses to let the present be unwrapped until the reasons have been read from a folded page.", "Before you open it, I've written a few notes. Sit down. No, properly. Sit.", 5, "u", {vol:1, emo:1, form:1}],
    ["Gives away something with a history", "Passes on a thing from their own shelves, along with its provenance and its chips.", "That was my gran's. It's chipped on the rim. That's how you know it's real.", 2, "u", {emo:1, warm:1}],
    ["Re-gifts and says so", "Re-gives an unopened present and offers its virgin state as a credential.", "It was given to me. Never opened it. So it's practically new, if you think about it.", 2, "d", {hon:1, man:-1}],
    ["Keeps a drawer of wrapped spares", "Stocks pre-wrapped, neutral presents so nobody is ever caught empty-handed.", "(reaching into the drawer) Here. Unscented, unisex, suitable from nine to ninety.", 2, "u", {disc:1, intel:1}],
    ["Cannot hold a surprise", "Hands the gift over weeks early because waiting is unbearable.", "I can't wait. Just open it now. It's not even your birthday till the fourteenth.", 3, "u", {emo:1, disc:-1, pos:1}],
    ["Slips over cash like contraband", "Folds a note small, presses it into a palm and apologises for it.", "(low voice) It's only a bit of something. Don't open it here. Buy yourself whatever.", 1, "c", {man:1, ego:-1}],
    ["Gives tickets and comes along", "Presents a pair of seats to something they want to see, and the recipient learns they are the plus-one.", "It's for you! Obviously I'll come. Someone's got to drive, haven't they.", 3, "d", {ego:1, hon:-1}],
    ["Halves the price when asked", "Cuts the figure in half, whatever it was, and waves the question off.", "Oh, it was a snip. Practically free. Don't go looking it up.", 2, "c", {hon:-1, man:1}],
    ["Introduces handmade gifts by their defects", "Gives a scarf or a jar or a poem and names its flaws before the recipient can.", "Mind the left sleeve, I lost count at the cuff. And the green's more of a bottle green.", 2, "c", {ego:-1, warm:1}],
    ["Wraps with ceremony, winces at the tear", "Folds the corners, curls the ribbon with scissors, and flinches as it is ripped.", "(hand hovering as the paper goes) Carefully — no, no, it's fine. It's fine. Go on.", 3, "u", {disc:1, form:1}],
    ["Gives the thing mentioned once", "Gives, without remark, the very item the recipient let slip they wanted almost a year ago.", "(shrugs) You said you'd lost yours. It's only a lighter.", 1, "s", {warm:1, emo:-1}]
  ]);

  V2.block(out, "Hospitality & Gifts", "Receiving", 232300, [
    ["Owes one back at once", "Counts every gift as a debt and has the matching present on its way within the week.", "Right, now I owe you. That's — I owe you now. I'll sort it by Friday. Don't tell me not to.", 4, "c", {man:1, ego:-1}],
    ["Opens it later, alone", "Takes the parcel away unopened and sends a verdict by message.", "I'll save it for later. (pressing it to their chest) Honestly. Later. It looks lovely.", 2, "d", {emo:-1, man:1}],
    ["Says 'you shouldn't have' and means it", "Delivers the line flatly, with a wince, because a gift feels like a bill with the number left blank.", "You shouldn't have. I mean it. I'm cross with you, a bit.", 3, "c", {hon:1, emo:-1}],
    ["Keeps the wrapping", "Smooths the paper along its creases, saves the ribbon and keeps the box long after the contents have gone.", "(flattening it on a knee) That's good paper. That's going in the drawer.", 2, "u", {disc:1}],
    ["Thanks three times", "Thanks at the door, again by text, and again in person a week later, each with a new detail.", "Thank you. ... (the Monday) Thank you again. I'm still thinking about the, the thing.", 4, "c", {man:1, warm:1}],
    ["Reacts at running volume", "Describes each stage of delight as it happens, from the weight of the parcel to the contents.", "Oh! It's heavy. It's — oh. Oh, look. It's a, what is it, oh, it's a — oh!", 5, "c", {vol:1, emo:1}],
    ["Finds a place for it before the tea cools", "Puts the gift on show before the giver has finished a cup, and asks where it should go.", "Where d'you think? Shelf? Window? Let's try it by the window and see what the light does.", 2, "u", {warm:1, act:1}],
    ["Turns a present into a bit", "Makes a joke out of the gift as a way of taking it.", "(holding up the socks) Subtle. Are you saying I need them?", 3, "c", {emo:-1, pos:1}],
    ["Goes silent over the card", "Holds the gift without opening it, thumb on the card, unable to look up.", "(thumb on the envelope, eyes down, no words for a long moment)", 3, "d", {emo:1, vol:-1}],
    ["Hunts for the label", "Turns the object over to find where it came from and what it cost.", "Where's this from? Is that the little place on Mill Road? That's a good place.", 2, "d", {cur:1, intel:1}],
    ["Hands it back, kindly and for good", "Returns a present across the table on principle and will not be argued out of it.", "No, honestly. I mean it. You'll want it yourself. Take it home. I'll not hear another word.", 4, "d", {asrt:1, agr:-1}],
    ["Raves about a gift they will never use", "Pours out delight over a present that is plainly the wrong one.", "It's perfect! It's just what — I've always wanted one. A fourth. Brilliant.", 3, "c", {hon:-1, man:1}],
    ["Returns the compliment on the spot", "Meets any praise by passing a matching one back before it can land.", "Thanks. Your coat's lovely, though. Really. Where's it from?", 2, "c", {man:1, ego:-1}],
    ["Shakes the box by their ear", "Guesses the contents aloud, rattling and weighing the parcel with real delight.", "It's a book. No — it clinks. It's a book of clinking things.", 3, "u", {cur:1, pos:1, act:1}],
    ["Returns the dish washed and filled", "Hands back every borrowed tin scrubbed clean and packed with something baked.", "That's your tin back. I put a few things in it. Don't look in it yet.", 2, "d", {warm:1, disc:1}],
    ["Reads the card and forgets the present", "Rereads the handwritten message three times while the wrapped gift sits beside the plate.", "(reading it again, lips moving, the box not yet touched)", 1, "s", {emo:1}]
  ]);

  // ===== Greetings & Farewells =====
  V2.block(out, "Greetings & Farewells", "Arriving & Greeting", 232400, [
    ["Greets everyone by full name", "Gives first name and surname of each person in the room, with a nod, as if reading a register.", "Margaret Okafor. Dennis Pike. Good to see you both.", 3, "d", {form:1, man:1}],
    ["Hugs before hello", "Is already mid-embrace by the moment a greeting would start, and says nothing until the second squeeze.", "(arms wide from the doorway, a full second before any words come out)", 5, "c", {warm:1, emo:1, act:1}],
    ["Announces their own arrival", "Calls out to the house on entering, as though the news were due.", "It's me! I'm here! Nobody panic!", 5, "c", {vol:1, ego:1}],
    ["Greets the dog before the people", "Drops to a knee for the dog and gives the humans a distracted wave over its head.", "Hello, you! Yes, you. Who's a good — oh, hi, Sue.", 4, "c", {warm:1, act:1}],
    ["Formal handshake to relatives", "Holds out a firm hand to a brother, an aunt and three cousins on a family doorstep.", "(hand out to a sister) Good to see you. How was the drive?", 3, "d", {form:1, emo:-1}],
    ["Reads the room from the threshold", "Stops with one foot over the sill and takes a long look round before saying a word.", "(on the mat, scanning left to right) Right. Right. Who's here?", 2, "u", {intel:1, mood:-1}],
    ["Goes in for the kiss and miscounts", "Leans in for a cheek kiss and has to be steered through one or two.", "(mid-air) One? Two? You choose, I'll follow.", 2, "d", {man:1}],
    ["Arrives mid-story", "Walks in already halfway through something that started in the car.", "— so Jan said never, and I said hang on, hello, so Jan said —", 3, "u", {vol:1, pace:1}],
    ["Gives everyone a private nickname", "Greets each person with a pet name that no one else uses.", "Alright, Professor. Morning, Duchess. Trouble.", 3, "u", {warm:1, pos:1}],
    ["Slips in at the back", "Lets the room find them in its own time, loitering by the coats until someone looks up.", "(waits by the coats, hand on the strap of a bag, until a face turns)", 1, "u", {vol:-1, ego:-1}],
    ["Waves from fifty yards", "Starts waving at the end of the road and holds the wave up the whole length of the path.", "(arm up, smile fixed, the whole walk, still waving at the door)", 4, "c", {warm:1, act:1}],
    ["Clasps a hand in both of theirs", "Takes a hand in two and holds on a beat past comfortable.", "(both hands round yours) How are you. No — how ARE you.", 2, "c", {warm:1, emo:1}],
    ["Greets by the clock", "Meets each arrival with the exact minute rather than a welcome.", "Four minutes late. I had you down for ten past.", 2, "d", {disc:1, man:-1}],
    ["Introduces with one starter fact", "Sets each new face before another with the single detail that will start a conversation.", "This is Priya, once kept a goat in a flat. Priya, this is Colm.", 3, "u", {warm:1, vol:1}],
    ["Stands to greet", "Gets up for each arrival, even from deep in the sofa, and stays up until the other has sat.", "(rising, a little stiffly) Please. After you. Please.", 2, "c", {man:1, form:1}],
    ["Says only the name", "Offers the other person's name, long drawn, with a nod and no hello.", "Dennis. (a beat, then softer) Dennis.", 1, "s", {vol:-1, warm:1}]
  ]);

  V2.block(out, "Greetings & Farewells", "Opening Lines", 232500, [
    ["First line is a complaint", "Brings the grievance of the day through the door before the door has closed.", "The car park's a disgrace. Eleven pounds. For a field.", 4, "c", {pos:-1, mood:-1}],
    ["First line is a compliment", "Leads with one precise compliment, so the first thing anyone hears is that they were noticed.", "That's a good jumper. That's the green of a good pond.", 2, "c", {warm:1, pos:1}],
    ["First line is the weather", "Offers the sky as an opening move: wind, direction, prospects for Thursday.", "Wind's gone round to the east. Won't hold.", 2, "c", {mood:1, form:1}],
    ["First line is about food", "Gets to the next meal before the first hello is finished.", "Have we eaten? Is there a plan for eating?", 4, "c", {warm:1, act:1}],
    ["Asks what they missed, with the voices", "Joins any gathering with a demand for the story so far, and with the voices.", "So! What did I miss. And don't summarise, I want it with the voices.", 3, "c", {cur:1, vol:1}],
    ["An in-joke only one person gets", "Aims a callback from a decade ago at a single listener while the rest of the room look on.", "(to Alan, deadpan) Is it still Wednesday in Leeds?", 3, "d", {warm:1, ego:1}],
    ["Begins mid-thought", "Starts speaking from the middle of a thought they have been having alone.", "— which is why it can't be the Tuesday. Hi. Sorry. It can't be Tuesday.", 3, "u", {intel:1, vol:1}],
    ["Claps hands: 'Right!'", "Calls the room to order with a clap and one word, whether or not the room was misbehaving.", "Right! Who's got the keys.", 4, "c", {asrt:1, act:1, pace:1}],
    ["Opens with last night's sleep", "Gives the hours slept as a headline and dares anyone to ask.", "Four hours. Don't ask. The boiler.", 2, "c", {emo:1, mood:-1}],
    ["Opens with an apology", "Leads with sorry for the mess, the lateness, or the existence of the message.", "Sorry. Sorry — before anything. Sorry.", 4, "c", {man:1, ego:-1}],
    ["Asks about one particular detail", "Goes straight to the exact thing they have been wondering about: the hip, the interview, the cat's tooth.", "Did the cat's tooth come out? Tell me it came out.", 2, "d", {cur:1, warm:1}],
    ["Names the mood in the room", "Reads the temperature aloud on entering and does not soften it.", "Oh. Who died. No — somebody's cross.", 3, "u", {hon:1, asrt:1}],
    ["One flat 'Hi' and wait", "Says a single syllable and leaves the other person to do all the work.", "Hi. (that is all)", 1, "u", {vol:-1}],
    ["A call-and-response with a friend", "Starts with an exchange so old that the other person knows their line.", "Who goes there? — (wearily) A friend. — Advance, friend.", 2, "s", {warm:1, pos:1}],
    ["Delivers a neighbourhood bulletin", "Opens with news of a skip, a planning notice or a third-hand death in the village.", "Number forty-two's had a skip delivered. Three weeks it's been there.", 3, "u", {vol:1, cur:1}]
  ]);

  V2.block(out, "Greetings & Farewells", "Leaving & Long Goodbyes", 232600, [
    ["Waves till the car is gone", "Stands on the step and waves until the tail-lights have turned the corner, and a bit after.", "(arm still up; the car is two streets away)", 3, "c", {warm:1, emo:1}],
    ["Says goodbye four times", "Gives a goodbye in the kitchen, the hall, the porch and the drive, each as if it were the last.", "Bye then. ... Bye. ... Right, bye, bye. ... Drive safe.", 5, "c", {vol:1, warm:1}],
    ["Leaves without saying it", "Slips away mid-gathering and is found missing an hour later, glass still half full.", "(coat gone from the hook, the glass left on the sill)", 3, "d", {emo:-1, man:-1}],
    ["'I'll let you go' for ten minutes", "Announces the end, adds one more story, announces it again, and goes round once more.", "Anyway, I'll let you go. — Oh, but one more thing. — Right, I'll let you go.", 4, "c", {vol:1, man:1}],
    ["The real conversation on the doorstep", "Keeps the actual subject for the porch, a hand on the frame and the engine already running.", "(coat on) Actually, while I've got you — Dad's results came back.", 5, "d", {emo:1, hon:1}],
    ["Keeps the coat on for an hour", "Gets the coat on at nine and is still telling stories at ten.", "(one button done) Oh, that reminds me. Hold on.", 4, "c", {vol:1}],
    ["Leaves at the planned minute", "Stands at the agreed time, says 'that's us' and means it.", "Right, that's us. Ten to eight, as I said.", 2, "d", {disc:1, pace:1}],
    ["Does the lap, a word to each", "Circles the room with one personal remark for each person.", "Sandra, mind your knee. Tom, send me the link. Ollie — you're a menace.", 3, "u", {warm:1, man:1}],
    ["Invents a reason to go", "Reaches for an early start, a cat, or an urgent parcel to cover the exit.", "Oh God, the cat. I've left the cat. Sorry. Lovely. Bye.", 2, "c", {hon:-1}],
    ["Stays to stack the chairs", "Is the last one out, and finishes the sentence in the car park.", "(carrying two chairs to the van, still on the story from nine o'clock)", 2, "u", {warm:1, act:1}],
    ["Holds the last hug", "Stretches the final embrace by a few seconds, the pat on the back never quite ending.", "(pat, pat, pat. Still going. Pat.)", 4, "c", {warm:1, emo:1}],
    ["Promises 'we must' with no date", "Promises the next meeting in ever more specific terms that never reach a calendar.", "We must. Properly. Soon. Before the summer. Definitely.", 2, "c", {pos:1, hon:-1}],
    ["Thanks the host from the hall", "Delivers a closing address on the doormat, with a mention of the pudding.", "I'd like to say what a thoroughly civilised evening this has been.", 3, "d", {form:1, vol:1}],
    ["Counts heads at the door", "Tallies the family with a pointing finger, like a coach after a trip.", "Four, five, six. Where's Ollie? OLLIE.", 2, "c", {disc:1, act:1}],
    ["Edges toward the door mid-sentence", "Works toward the exit in inch-long steps while the conversation carries on regardless.", "(shuffles two steps) — which is the thing, you see — (another step) —", 2, "u", {man:1, pace:-1}]
  ]);

  V2.block(out, "Greetings & Farewells", "Closing Calls & Messages", 232700, [
    ["Hangs up mid-sentence", "Ends the call the moment the needed fact arrives, partway through the other person's word.", "Great, that's — (click)", 5, "d", {man:-1, pace:1}],
    ["A flat 'right, then' as the whole exit", "Uses two flat words as a complete farewell, in a tone that closes the subject.", "Right, then.", 2, "c", {emo:-1, form:1}],
    ["Signs off with a task", "Closes the call with one last instruction, so the goodbye doubles as an assignment.", "Bye, bye — and bring the ladder Thursday.", 4, "c", {asrt:1, disc:1}],
    ["Never says goodbye on the phone", "Ends on the last piece of information and falls silent, leaving the other person to say hello?", "So, Saturday. (silence; then the line is dead)", 4, "c", {man:-1}],
    ["Goodnight texts in a fixed formula", "Sends the same three words, in the same order, at a quarter past ten each night.", "Night night. Sleep tight. x", 2, "u", {warm:1, disc:1}],
    ["Tacks a postscript onto a short message", "Adds a P.S. and then a P.P.S. to a three-word text, so the goodbye lands a little late.", "Back Tuesday. PS the bin men moved. PPS ignore the PS if you've done it.", 2, "u", {vol:1, form:1}],
    ["Waits for the other to hang up first", "Neither will cut the line, so each waits for the other with a breath on the phone.", "You go. No, you. Go on, on three. One, two — (neither does)", 2, "d", {warm:1, agr:1}],
    ["Says 'love you, bye' to the bank", "Lets a family sign-off slip out to a plumber, a receptionist or a call centre.", "Right, brilliant, love you, bye — oh. Oh. Sorry. Thank you.", 2, "d", {warm:1, mood:-1}],
    ["Closes on a ladder of thanks", "Ends with a climbing run of thanks that stops only at 'thanks again'.", "Thanks, thanks so much, cheers, thanks again, ta.", 2, "c", {man:1}],
    ["Voicemails that trail into a pocket", "Lets the message dwindle into rustling and a half-sentence with no ending.", "— so anyway, ring me. Or don't. (rustle, a car door, nothing)", 2, "u", {mood:-1, vol:-1}],
    ["Ends the thread on a bare 'k'", "Gives the whole reply as a single letter and calls the thread closed.", "k", 1, "c", {vol:-1, emo:-1}],
    ["Counts the call down with 'okay'", "Strings together half a dozen 'okays' that taper off like a lift going down.", "Okay. Okay. Okay then. Okay, lovely. Okay.", 4, "c", {vol:1, man:1}],
    ["Narrates the hanging up", "Announces the act of ending the call before and while doing it.", "I'm going to go now. I'm hanging up. This is me hanging up.", 3, "d", {hon:1, form:1}],
    ["Texts 'home' from the doorstep", "Sends a single word the minute the key is in the lock, unasked, expecting no reply.", "Home. x", 1, "s", {warm:1, disc:1}],
    ["Sets the end time at the start", "Opens a call with its closing time and holds the line to it.", "I've got ten minutes, then I'm gone. Go.", 3, "d", {disc:1, form:1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_HOSPITALITY);
