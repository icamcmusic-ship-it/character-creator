/* v2 content: Emotion Display Rules (new section) plus fill for thin concepts in existing optional sections (courtship, pining, apology, class mobility, sibling and parent voice, stonewalling, litigator, lapsed faith, political temperament). IDS 234000-234999. See traits-v2-lib.js for the format. */
const TRAITS_V2_GAPS = (function(){
  const out = [];

  /* ======================= Part A: Emotion Display Rules (new section) ======================= */

  V2.block(out, "Emotion Display Rules", "Hiding Feelings", 234000, [
    ["Cries in the parked car", "Waits until the engine is off and the door is shut before letting go, then tidies their composure in the visor mirror before walking back in.", "(in the drive, forehead on the wheel, four minutes; then the visor mirror and one breath) Right. Tea.", 2, "c", {emo:-1, mood:-1}],
    ["Takes news with a level nothing", "Receives good and bad news in the same pleasant, unreadable manner, so the other person leaves unsure whether it landed at all.", "Mm. Thank you for letting me know. (the pen goes back into the pocket, unhurried)", 3, "u", {emo:-1, mood:1}],
    ["The rehearsed 'can't complain'", "Keeps a stock reply, pitched slightly too even, that closes the subject of their wellbeing before it can open.", "Can't complain. Nobody'd listen if I did. Anyway, you — how's the hip?", 2, "c", {emo:-1, hon:-1}],
    ["Apologises for crying", "Says sorry the moment their voice wobbles, as though leaking were a minor rudeness to the room.", "Sorry — sorry — it's the onions. No. There aren't any onions. Sorry.", 3, "c", {man:1, ego:-1}],
    ["Goes brisk and practical", "Meets a blow by getting efficient: lists, phone calls, the car brought round, nothing left for the feeling to stand on.", "Right. I'll ring the school, you find the insurance folder, and somebody turn the oven off.", 3, "c", {disc:1, emo:-1, pace:1}],
    ["Falls apart at a stranger's kindness", "Holds steady through the funeral and the diagnosis, then goes to pieces when a neighbour hands over a casserole.", "(a stranger holds the door; their voice goes) Oh, for — that's all it took. Thank you. Thank you.", 4, "d", {emo:1, mood:-1}],
    ["Laughs where the grief should be", "Answers upsetting news with a short laugh that arrives before they can stop it, then looks at the speaker as if the laugh were someone else's.", "He's what? (a bark of a laugh, hand over mouth) Sorry — no — I don't know why I did that.", 4, "u", {emo:-1, mood:-1}],
    ["Allows a feeling exactly as long as the kettle takes", "Allows themselves a set few minutes of feeling alone in the kitchen, then wipes their eyes and puts it away.", "(a quick wipe at the sink as the kettle clicks) That's me done. Two minutes, that's the rule.", 2, "d", {disc:1, emo:-1}],
    ["Reports an ache where an emotion is", "Describes an upset as a head coming on or a bad back, because a body complaint is allowed in company.", "I've a head coming on. No, nothing's wrong, it's just a head. I think I'll lie down.", 1, "u", {hon:-1, emo:-1}],
    ["Finds an errand when it rises", "Feels the feeling coming a few seconds early and slips out for the bins, the post or the kettle.", "I'll just — the bins. (already at the door) Won't be a minute.", 1, "c", {emo:-1}],
    ["Speaks of their own pain as 'a person' might", "Speaks about their own pain as if it belonged to an acquaintance: what a person might feel, what anyone would.", "A person could find that quite upsetting, I imagine. Anyone would. Hypothetically.", 3, "d", {emo:-1, intel:1}],
    ["Keeps the bright voice until the phone is down", "Keeps a bright, pleasant voice through the bad phone call and lets it drop only once the receiver is down and nobody is looking.", "(bright, on the phone) Of course, no, completely understand. Thank you for ringing. (receiver down; sits very still)", 3, "c", {man:1, emo:-1}],
    ["Spends the feeling on someone else's problem", "Pours the energy of their own trouble into fixing a friend's smaller one.", "Your boiler? Give me the number, I'll ring them now. (their own unopened letter sits on the counter)", 2, "u", {warm:1, emo:-1}],
    ["Tells the whole truth to a stranger", "Unloads on a taxi driver or a person on a train, someone who will never meet anyone they know.", "(to the driver, unprompted) My marriage ended on Tuesday, actually. Sorry. Next left.", 5, "d", {emo:1, hon:1}],
    ["The voice drops half a tone", "When hurt, their voice goes a notch lower and slower, a change only close friends have learned to hear.", "(lighter than before) No, that's fine. It's fine. (the friend hears the half-tone and puts down the fork)", 1, "s", {emo:-1, vol:-1}],
    ["Cleans, bakes and rearranges at full pelt", "Turns distress into frantic housework so that nobody can sit them down and ask.", "Can't sit, can't, I've the oven on and the whole hall still to do — no, no, I'm GOOD, pass me that bucket.", 5, "c", {act:1, pace:1, emo:-1}]
  ]);

  V2.block(out, "Emotion Display Rules", "Performing Feelings", 234100, [
    ["Cheer that clocks off at the door", "Hosts with warmth and volume while guests are present and drops to a flat, tired quiet the moment the door shuts.", "Lovely to see you all! Mind the step! (door shuts; a long exhale) Right. Who's put the bins out?", 3, "u", {pos:1, hon:-1}],
    ["Staged outrage over small things", "Meets minor slights with a gasp, a hand to the chest and a glance round for the audience, finished within the minute.", "Well! I have NEVER — (looks round) — has anyone seen how he's parked?", 5, "c", {vol:1, emo:1}],
    ["Borrowed enthusiasm", "Catches a friend's excitement and echoes it at a higher volume without having a view of their own.", "Oh my GOD, a conservatory! (low, to someone later) What's a conservatory for, again?", 2, "u", {agr:1, hon:-1}],
    ["Sighs until someone asks", "Lets out a long, unsteady sigh at the window every few minutes until somebody gives in and asks what is wrong.", "(a long, shaky breath at the glass) No. No, it's nothing. Don't fuss. I'll be fine, eventually.", 4, "c", {mood:-1, hon:-1}],
    ["Names the feeling aloud to settle it", "Announces what they feel in a flat, formal voice, as if giving it a name makes it sit down.", "I am feeling jealous. There. I've said it. It has a name now, so it can stop.", 3, "d", {emo:1, intel:1}],
    ["Reports moods like a forecast", "Describes their own state in the weather's idiom: overcast, brightening later, possible showers.", "Bit grey this morning, to be honest. Might clear by lunch. Don't plan a picnic.", 1, "d", {emo:1, hon:1}],
    ["Gasps a beat early", "Supplies the expected 'oh no' at the right point in someone's story, slightly ahead of the point, whether or not they feel it.", "...and then he fell off the — (Oh no!) — off the ladder, and — (Oh NO!) — he was fine, actually.", 2, "c", {agr:1, man:1}],
    ["Two laughs, one for power and one for friends", "Produces a fixed three-note laugh for whoever has the power and a different, real snort for everyone else.", "Ha-ha-ha. (to a friend, afterwards, a real snort) Did you hear him? 'Synergy'.", 3, "c", {man:1, hon:-1}],
    ["Cries when the argument turns against them", "Lets the tears arrive as the case weakens and wipes them away the moment it turns back.", "(voice cracks) I just wanted — (point conceded) — right. Where were we?", 4, "u", {emo:1, hon:-1}],
    ["Warns the room they may cry", "Announces the tears before they come, asking everyone to look elsewhere while the jaw works.", "Don't look at me or I'll go. I mean it. Look at the cake. (turns to the wall, jaw working)", 3, "u", {emo:1, man:1}],
    ["Stays sing-song for the children", "Holds a calm, bright tone for the kids in a crisis and goes low and clipped the second they turn away.", "(bright, to the child) Look, it's an adventure! (low, to the spouse) Ring Mum. Now.", 2, "u", {warm:1, emo:-1}],
    ["Picks a mood for the whole room", "When the room is flat, chooses a mood and plays it at full volume until the others join in.", "Come ON, it's SATURDAY. (puts the music on, takes someone's hands)", 5, "u", {pos:1, vol:1, act:1}],
    ["The head-tilt sympathy voice", "Drops into one low, slow tone for bad news, the same every time, with the tilt of the head as its cue.", "(head tilted, soft) Ohh. That sounds really hard. (ten seconds on, normal) Anyway! Who's for biscuits?", 2, "c", {man:1, warm:1, hon:-1}],
    ["Slower and calmer as things get worse", "The higher the stakes, the slower and more exaggerated their calm: long sighs, slow tea, no hurry at all.", "(the spoon goes round for the ninth time) No rush. No rush at all.", 2, "d", {mood:-1, emo:-1}],
    ["Scores every feeling out of ten", "Rates what they feel with a number for the room, as if it were a service they had tried.", "Annoyed? Six. Seven if the lift's still broken. Hungry, nine.", 2, "s", {intel:1, emo:1}]
  ]);

  V2.block(out, "Emotion Display Rules", "Substituted Feelings", 234200, [
    ["Turns sadness into irritation", "Turns sadness into irritation at the nearest object: the printer, the delay, the lid that will not come off.", "Bloody jar! (the lid flies; the sob is gone in a blink) Useless thing!", 5, "c", {agr:-1, emo:-1}],
    ["Turns anger into hurt", "Meets being wronged with a soft, drooping hurt where an objection could be, tearful instead of sharp.", "(small voice) I just thought you'd ask me first. (eyes fill) It doesn't matter, really.", 3, "c", {asrt:-1, emo:1}],
    ["Pride that only shows as a grumble", "Praises their child by complaining about the cost, the noise or the hours of the thing the child excels at.", "Seventeen medals. Where am I meant to put seventeen medals? The mantelpiece is a disgrace.", 2, "d", {warm:1, emo:-1}],
    ["Shows love by nagging", "Shows tenderness by pursuing: wear a coat, text when you're there, you've gone quiet.", "Have you eaten? You haven't eaten. Honestly. Sit. SIT.", 3, "c", {warm:1, agr:-1}],
    ["Jokes about the thing they fear", "Makes the same joke again and again about what scares them, each version a little thinner.", "Biopsy, schmiopsy. Cut me open, you'll find mostly tea. (an hour later, the third version)", 4, "u", {pos:1, emo:-1}],
    ["Hurt that goes off like a flare", "Snaps loudest at whoever's remark went deepest, then looks surprised at the heat.", "Oh, that's rich, coming from you! (door) — (later, in the hall) That wasn't about the dishes.", 5, "c", {agr:-1, vol:1}],
    ["Jealousy in the voice of concern", "Voices worry about a friend's new partner, job or flat when the real feeling is a pang of their own.", "I just think it's all a bit fast. For you. I'd hate to see it go wrong. (swallows)", 2, "u", {hon:-1, warm:1}],
    ["Shame aimed at the witness", "Points embarrassment at whoever saw it, finding the fault in them for having been there.", "Why didn't you SAY? You were standing right there! Right there!", 5, "c", {ego:-1, agr:-1}],
    ["Loneliness as a full diary", "Fills the empty evenings with committees and clubs, then complains about being worn out.", "Tuesday, choir. Wednesday, the allotment board. Thursday — I do get so tired.", 2, "u", {emo:-1, act:1}],
    ["Excitement presented as dread", "Says what they want in the language of worry, in case wanting it out loud would jinx it.", "It's only an interview, I'll probably be sick on them. (the folder is already tabbed in three colours)", 2, "u", {pos:-1, hon:-1}],
    ["Relief as a scolding", "When a late person turns up safe, scolds them for the worry before anything else.", "Where have you BEEN? Two hours! I've rung everyone! (holds on a second too long) Sit. Eat.", 5, "c", {warm:1, vol:1}],
    ["Delight shown as abuse", "Greets a favourite person with teasing that works as affection: late, useless, who let you in.", "Look what the cat dragged in. Sit down, you menace, I've missed you.", 3, "c", {warm:1, man:-1}],
    ["Guilt as a week of chores", "After a lapse, turns relentlessly helpful for days: dishes, lifts, an unasked-for MOT booking.", "I've done the dishes, the bins, and I've booked your MOT. Anything else? Anything at all?", 5, "u", {man:1, ego:-1}],
    ["Sorrow as feeding", "Cooks for the bereaved instead of speaking to them: lasagne, crumble, a soup for the freezer.", "There's a pie in the freezer, and a crumble, and soup. I've not said anything, have I. No. Eat.", 2, "c", {warm:1, emo:-1}],
    ["Giddy at the worst of it", "Laughter climbs with the danger: the more serious the trouble, the more they delight in it.", "(the car has stopped on the viaduct) Oh, this is MARVELLOUS. We'll die on a Tuesday!", 5, "d", {mood:-1, pos:1}],
    ["Missing someone as grumbling about the quiet", "Complains that the house is too quiet and the bins are undone, which is how they say the person is missed.", "It's like a morgue in here. Nobody to shout at about the bins. (a pause) Ring me when you land.", 2, "s", {emo:-1, warm:1}]
  ]);

  V2.block(out, "Emotion Display Rules", "Grief & Loss Talk", 234300, [
    ["The family's own word for dying", "Uses the household's private euphemism for death so the plain word never has to be spoken at the table.", "Auntie Rose put her feet up in March. — She died? — She put her feet up.", 2, "c", {man:1, emo:-1}],
    ["Slides into 'is', then fixes it to 'was'", "Speaks of the person in the present tense and corrects mid-sentence, sometimes twice, hearing the slip as they go.", "Dad is — was — a terrible driver. Was. Is. Was.", 3, "c", {emo:1, mood:-1}],
    ["Funny stories about the deceased at the wake", "Tells the dead person's worst habits as set pieces, gets the room laughing and then has to stop.", "He'd have hated this sandwich. 'Is this the best you could do?' — he said it at his own mother's funeral!", 4, "c", {warm:1, pos:1, emo:1}],
    ["Comes undone months later at a small thing", "Handles the funeral steadily and comes apart at a tin of tobacco in a shop long after everyone else has moved on.", "(holding the tin) It's — no — it's been, what, a year. It's — sorry.", 4, "u", {emo:1, mood:-1}],
    ["Grief as paperwork", "Takes up the death in forms and phone calls: closing accounts and returning library books are how they say it.", "Right: the pension office wants the certificate in triplicate. I've done two.", 3, "c", {disc:1, emo:-1}],
    ["Goes around the name", "Leaves a gap where the name should be and speaks of 'before', 'that year' and 'the old house'.", "When we were — before. In the old house. With — you know.", 2, "d", {emo:-1, mood:-1}],
    ["Talks to the empty chair", "Gives the dead person a seat at the table and a remark, delivered in a lower, easier voice in front of company.", "(to the end seat) You'd say it's overcooked. Well, it is a bit.", 3, "d", {emo:1, hon:1}],
    ["Measures by the Christmases since", "Dates everything by the first Christmas without, the third birthday after.", "That's the fourth Easter. Fourth. She'd have made such a fuss.", 1, "c", {emo:1}],
    ["Consults the dead before choosing", "Weighs a decision by what the dead person would have said and quotes the verdict.", "Mum would've said no to the green. So — no to the green.", 2, "c", {emo:1}],
    ["Condolence plus one real memory", "Says the stock sympathy line, then adds a very particular memory as the actual gift.", "So sorry for your loss. (beat) I'll never forget him lending me his ladder at two in the morning.", 2, "u", {warm:1, man:1}],
    ["Tells the last day in the same sentences", "Repeats the account of the last day in identical words each time, like a liturgy they cannot edit.", "She had her tea, she said she felt a bit tired, and that was that. That was that.", 3, "u", {emo:-1}],
    ["Won't be told it gets easier", "Bristles at 'closure' and answers with the exact number of days.", "Easier. It's been two years, three months. 'Easier' isn't the word.", 4, "u", {asrt:1, hon:1}],
    ["Asks for the name to be said", "Asks friends to speak the dead person's name aloud and is hurt by the tiptoeing.", "Say his name. Please. It won't break anything. It's just a name.", 3, "d", {emo:1, asrt:1}],
    ["Narrates the shed as it is cleared", "Tells the story of each tool as it goes into the box for the charity shop.", "This was the Blackpool one. 1987. He used it twice and said he felt a fraud. (wraps it carefully)", 2, "d", {emo:1, warm:1}],
    ["Rings the old number for the greeting", "Keeps the dead person's number and now and then rings it to hear the voicemail message.", "(phone to ear, listening) 'Can't come to the phone.' ...No. Still can't.", 2, "s", {emo:1, mood:-1}],
    ["Says 'we' about plans, then edits", "Starts a plan in the plural out of habit and quietly changes it to the singular.", "We're going to Cornwall in — I'm going to Cornwall. In June.", 1, "s", {emo:-1, mood:-1}]
  ]);

  /* ======================= Part B: fill in existing optional sections ======================= */

  V2.block(out, "Romance & Desire", "Courtship Speech", 234400, [
    ["Showers with superlatives, then goes quiet", "Pours three weeks of superlatives and surprises over the person, then answers texts a day late as if nothing had been withheld.", "(week one) You're the best thing that's ever happened to me. (week four, reply, at midnight) k. busy.", 5, "d", {emo:1, hon:-1}],
    ["Plans the dog and the holiday over the starter", "Cheerfully books a shared future, with names for the pets, before the main course arrives.", "When we get the dog, I want a proper lead, not that retractable rubbish. Mm, this soup's good — when we do Lisbon —", 4, "u", {pos:1, pace:1}],
    ["Plays hard to get", "Lets messages sit unanswered for exactly an afternoon and then is 'so sorry, mad week' every time.", "Oh, Friday? Let me check. (checks nothing) I might manage half past eight.", 2, "c", {ego:1, hon:-1}],
    ["Lends the book with a page marked", "Courts by loan, handing over a paperback with one passage bookmarked and a 'no rush' that means the opposite.", "Borrow it. Page forty-one is the bit I thought of you at. No rush.", 1, "d", {warm:1, intel:1}],
    ["Mentions the ex early, to see what happens", "Drops a former partner into the second course and watches how the other takes it.", "My ex hated this place, actually. (watches) Anyway. The lamb's good.", 2, "u", {ego:1, hon:-1}],
    ["Texts one line of a poem at midnight", "Sends a single quoted line with no comment and waits.", "(11.52pm) 'Come live with me and be my love.' — Sorry. Wrong chat. Not wrong chat.", 1, "u", {emo:1, intel:1}],
    ["Announces they're bad at this, then asks the perfect question", "Disarms with an admission of dating clumsiness and goes on to ask the one question nobody has asked.", "I'm hopeless at this bit, so — what was the best thing that happened to you this week? Genuinely.", 2, "s", {hon:1, cur:1}]
  ]);

  V2.block(out, "Romance & Desire", "Pining Tells", 234410, [
    ["Turns up where the person will be, by chance", "Appears at the Thursday quiz, the Saturday market, the bus stop, each time astonished to find them there.", "Oh! The quiz night! Do you come here? I never come here. (third week running)", 3, "u", {hon:-1, act:1}],
    ["Takes up their hobby, badly, at length", "Starts rowing or bouldering because the person does, and reports on it with more commitment than pleasure.", "I've started rowing. Six a.m. It's wonderful. I hate it. Are you doing the regatta?", 3, "d", {cur:1, hon:-1}],
    ["Says the name very quietly", "Lowers their voice on the name, as if it might be overheard in an empty room.", "(barely) ...and Jo said — (glances round) — Jo, from accounts. Said so.", 1, "s", {emo:-1, vol:-1}],
    ["Rehearses all week, delivers the bus timetable", "Plans a speech in the shower for days and, when the moment comes, talks about the 47.", "(a week of rehearsal behind it) So! The 47 bus. It's often late.", 2, "c", {emo:-1, ego:-1}],
    ["'Spare' gifts", "Hands over the extra ticket, the second cake, the 'sale' scarf with a story about why they happened to have two.", "Got two. Didn't want to waste it. Cake. Obviously I got two.", 2, "c", {warm:1, hon:-1}],
    ["Raises a toast and tells the room", "With a glass in hand, lets slip in front of the person that they are loved, then tries to widen the category to colleagues.", "(glass raised) To JO, who I LOVE! As a — as a colleague! As a — Jo!", 5, "u", {vol:1, emo:1, ego:-1}],
    ["Plays the recommended album on repeat", "Listens to every track the person once recommended and reports unprompted.", "I've listened to the album. All of it. The seventh track — is that the one you meant?", 1, "d", {cur:1, emo:1}]
  ]);

  V2.block(out, "Recovery & Repair", "Apology", 234420, [
    ["'Sorry you feel that way'", "Offers regret about the other person's reaction rather than the act and files the matter as closed.", "I'm sorry you feel that way. Shall we move on?", 3, "c", {hon:-1, ego:1, agr:-1}],
    ["Waits for the other to blink first", "Holds still and silent after a row, certain that the apology belongs to someone else.", "(a pause of nine seconds) Well. I'm waiting.", 4, "c", {ego:1, agr:-1}],
    ["Biscuits and a two-line card", "Leaves a small, specific gift with a note of two lines and does not mention it when they next meet.", "(the good biscuits, from Wales; the card: 'Sorry about the party.')", 2, "c", {warm:1, man:1}],
    ["Records a voice note in the car park", "Sends a three-minute voice note recorded with the engine running, to say it before nerve is lost.", "(voice note, wind noise) Hi. It's me. I'm in the car park. I wanted to say it before I lost my nerve.", 2, "u", {emo:1, hon:1}],
    ["Sorry with a joke to test the water", "Opens with humour to check whether the other is ready to hear it.", "I'm sorry. Is it too soon? What's the going rate for a sorry these days?", 3, "c", {pos:1, hon:-1}],
    ["Apologises for 'the person who said that'", "Puts distance between themself and the offence by speaking of the speaker in the third person.", "The man who said that about your sister was an idiot. I've had a word with him.", 3, "d", {pos:1, hon:-1}],
    ["Hovers on the doorstep with garage tulips", "Stands outside the door with petrol-station tulips and a prepared speech, and loses the speech when the door opens.", "(the door opens; the speech is gone) I was just — passing. With tulips.", 2, "d", {emo:1, ego:-1}]
  ]);

  V2.block(out, "Money & Class", "Class-Mobility Tells", 234430, [
    ["Over-explains the price of anything", "Goes hot and long-winded when someone better off asks what something cost.", "It was the sale, um. Everything was in the sale. Thirty off. Honest.", 4, "c", {ego:-1, hon:-1}],
    ["Converts prices into shifts", "Turns every price into hours of the old wage, aloud, with a wince.", "Thirty-eight for a starter. That's two shifts. Two shifts, for one scallop.", 3, "d", {hon:1, emo:1}],
    ["Sends money home with a joke", "Wires cash to family with a throwaway line to hide how much it matters.", "Don't say thank you, say 'oh, you shouldn't'. It's only a few hundred. Get the boiler done.", 2, "u", {warm:1, emo:-1}],
    ["Apologises for the size of the house", "Greets guests with an apology for the number of rooms and tells the story of how it 'just came with them'.", "Sorry — it's absurd, I know. It came with all the rooms. Ignore the garden.", 3, "c", {ego:-1, man:1}],
    ["Buys the extravagance they were refused as a child", "Splashes out on one extravagant item and refuses to be embarrassed by it.", "Yes, it's a ridiculous trampoline. I wanted one. Shut up. Who wants a go?", 3, "d", {pos:1, ego:1}],
    ["Has a two-line answer ready for 'what do your parents do'", "Answers the dreaded question in two clean sentences and moves the conversation along.", "Mum was in care work; Dad drove. Next question?", 2, "u", {hon:1, asrt:1}],
    ["'We weren't poor, we were careful'", "Corrects any description of their childhood with a small, proud distinction.", "We weren't poor. We were careful. There's a difference, and it's pride.", 2, "d", {ego:1, hon:1}]
  ]);

  V2.block(out, "Family Talk", "Sibling Rivalry", 234440, [
    ["Briefs the younger one in the eldest's voice", "Gives adult siblings errands as instructions, complete with the route, the time and the phone-call afterwards.", "You'll take the motorway, not the A-road. And ring me from the services. I'll hold dinner.", 3, "c", {asrt:1, agr:-1}],
    ["Scripts what the sibling should tell Mum", "Briefs a brother or sister on the exact version to give before a family visit.", "Tell her it's the knee. Not the knee and the pills. Just the knee.", 2, "u", {man:1, hon:-1}],
    ["Speaks for 'we all'", "Attributes their own view to the whole family, with the sibling expected to nod along.", "We all thought you'd do it in the end. — Did we?", 3, "c", {asrt:1, hon:-1}],
    ["Corrects the sibling's childhood story", "Interrupts a brother or sister's retelling to fix the detail that matters: the place, the bike, who was actually sick on the coach.", "It wasn't the pier, it was Barry Island, and you were sick on the coach, not me.", 3, "c", {asrt:1, hon:1}],
    ["Resents having been the eldest", "Mentions, in a tired, level voice, that someone had to hold things together.", "I held the whole thing together at fifteen. Not that anyone's counting. I'm counting.", 2, "u", {ego:-1, mood:-1}],
    ["Goes calm and instructional when the family panics", "Slips into the voice they used when the others were small and takes charge of the room.", "Everyone sit. Mum, there. Don't touch it. I'll ring. You're fine.", 4, "d", {asrt:1, mood:1}]
  ]);

  V2.block(out, "Family Talk", "Parent-Voice Echo", 234450, [
    ["Counts to three at a colleague", "Starts the count aloud at a grown-up who is dragging their heels.", "I'm going to count to three, Gareth. One. (the printer is fixed by two)", 5, "u", {asrt:1, form:1}],
    ["Runs the checklist on a grown partner", "Recites keys, wallet, phone and 'have you been' as a grown-up leaves the house.", "Keys, wallet, phone, have you been? Right. Off we go.", 2, "c", {warm:1, asrt:1}],
    ["Uses the nursery 'we'", "Addresses an adult in the plural as if to a child: are we going to be kind to the waiter?", "Are we going to be nice to the waiter tonight? Good. Lovely.", 2, "d", {warm:1, man:-1}],
    ["'Use your words' at a sulking adult", "Meets a sigh or silence with the instruction to put it into words.", "Use your words, Pete. Come on. Tell me what the sigh means.", 3, "c", {asrt:1, agr:-1}],
    ["Praises a grown-up like a toddler", "Offers 'good job' and 'well done, you' for adult achievements, in perfect sincerity.", "Ooh, look at you! Proper adult! Good job on the printer!", 2, "u", {warm:1, ego:1}],
    ["Sets time limits on adults", "Rations a grown-up's game, telly or chat in minutes, exactly as for a child.", "Ten more minutes on the game and then bed. — I'm forty. — Ten minutes.", 3, "c", {disc:1, asrt:1}]
  ]);

  V2.block(out, "Conflict Style", "Stonewalling & Withdrawal", 234460, [
    ["Names the price of speaking again", "Withdraws into silence and lets slip what it would take to end it: an apology, the holiday, a changed rota.", "(from the doorway, level) I'll talk when the rota's changed. Not before.", 4, "d", {asrt:1, agr:-1}],
    ["Takes a minute and comes back with milk", "Walks out of an argument with 'I need a minute' and returns an hour later to talk about something else entirely.", "I need a minute. (door) ... (an hour on, from the hall) Do we need milk?", 3, "c", {mood:-1, asrt:-1}],
    ["Gives one word per inch conceded", "Rations replies to the size of the concession: a word for an inch, three for a mile.", "(after the offer of the car) Fine. Good. Go on, then.", 3, "u", {man:-1, ego:1}],
    ["Goes silent just before a decision is due", "Stops replying just before an answer is needed, leaving the other to guess or fold.", "(phone off at the airport; a message at eight: 'Back now. So we're doing Spain?')", 4, "d", {asrt:1, hon:-1}],
    ["Announces the blackout like a notice", "States a day and hour before which the subject will not be discussed.", "I won't be discussing it before Sunday. Sunday, after lunch. Not earlier.", 2, "u", {disc:1, form:1}],
    ["Warm to everyone but one", "Speaks easily to the whole room and passes the one person a spoon without a word.", "(to the room) More tea? (to one person: a spoon, handed over, no eye contact)", 3, "c", {warm:-1, agr:-1}]
  ]);

  V2.block(out, "Conflict Style", "Litigator", 234470, [
    ["Goes formal when furious", "Voice cools and sentences gain subordinate clauses and 'I should like to point out'.", "I should like it noted that I am not shouting. I should like it noted that I never shout.", 3, "d", {form:1, ego:1}],
    ["Moves the goalposts politely", "Accepts the evidence, then softens what it was meant to prove, always with 'of course'.", "Naturally, that's exactly the evidence I asked for. Although by 'recent' I meant, strictly, this week.", 4, "d", {man:1, hon:-1}],
    ["Redefines the term after losing", "Reopens the meaning of a word the argument turned on.", "Well, 'on time' is a spectrum, isn't it?", 2, "c", {hon:-1, intel:1}],
    ["Thanks the evidence, presses ahead", "Thanks the person for the evidence that undoes them and proceeds as if nothing changed.", "Thank you, that's helpful. Anyway, to my main point.", 3, "u", {man:1, hon:-1}],
    ["Drops to a whisper when most certain", "Goes very quiet when completely sure of the ground.", "(very quietly) No. That is not what the minutes say.", 2, "s", {mood:1, asrt:1}],
    ["'May I finish?' as a weapon", "Asks permission to continue in a tone that turns the interruption into an offence.", "May I finish? ... Thank you. That's the third time I've asked.", 3, "c", {man:1, asrt:1}]
  ]);

  V2.block(out, "Beliefs & Worldview", "Lapsed Faith", 234480, [
    ["Murmurs the responses they no longer believe", "Answers the priest's cue in a half-voice, mouth moving before thought.", "(at the wedding, 'The Lord be with you') ...and also with you. (frowns at their own mouth)", 2, "c", {emo:-1, hon:-1}],
    ["Says 'God willing', then corrects it", "Lets the old phrase out and swaps it for something secular half a beat later.", "See you Thursday, God willing — I mean, if the train's on.", 2, "c", {hon:-1}],
    ["Pays for the candle as a donation to the roof", "Drops a coin in the cathedral box for the upkeep and lights a candle with it, for Gran, without calling it that.", "It's for the roof. The roof's lovely. (the flame, once lit, is for Gran)", 2, "u", {emo:1, hon:-1}],
    ["Hands the grace to a guest", "Asks someone else to say the blessing, bowing their head anyway.", "Would you say it? I've gone a bit rusty. Years. (bows head anyway)", 1, "u", {man:1}],
    ["Knows which drawer holds the family Bible", "Can say exactly where the old book is kept and changes the subject.", "It's in the bureau. Top drawer, left. Not that I ever — anyway.", 1, "s", {emo:-1}],
    ["Marks the sermon like a teacher", "Rates the homily in their head, noting the thin points.", "Good illustration. Weak third point. He went on too long about the Prodigal Son.", 3, "d", {intel:1}],
    ["Prays 'to whom it may concern'", "Addresses a prayer to nobody in particular, with a sign-off.", "To whom it may concern: let the scan be clear. Thanks. Yours, etc.", 2, "u", {pos:1, hon:-1}]
  ]);

  V2.block(out, "Beliefs & Worldview", "Political Temperament", 234490, [
    ["Ends the debate with 'I read somewhere'", "Closes the argument by citing a half-remembered source that cannot be checked.", "Well, I read somewhere that it's the other way round. So.", 3, "c", {intel:-1, hon:-1}],
    ["Argues the opposite for sport", "Takes the other side of whatever has just been said, whatever their own view, and enjoys the scramble.", "Right, but if I were the minister? (leans back) Go on, convince me. I'll argue the other side.", 3, "c", {rebel:1, intel:1}],
    ["Settles it with 'common sense'", "Treats the position as too obvious to defend and declares the matter closed.", "It's common sense. You don't spend what you haven't got. End of.", 4, "c", {asrt:1, intel:-1}],
    ["Quotes the headline as the whole case", "Taps the phone and reads the headline as if it were the evidence.", "The headline literally says it. (taps) 'Experts Warn.' There you go.", 2, "c", {intel:-1, asrt:1}],
    ["Loses on facts, switches to tone", "Concedes the figures and moves the complaint to how it was said.", "Fine, the figures are right. It's the way you said it.", 3, "c", {hon:-1, ego:1}],
    ["Nods through both sides", "Agrees with whoever spoke last, in complete sincerity.", "Yes. Yes, quite right. (to the other) No, you've got it exactly.", 2, "c", {agr:1, man:1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_GAPS);
