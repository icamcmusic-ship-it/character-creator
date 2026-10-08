/* v2 content: Social Role: Clown, Scapegoat, Gatekeeper, Historian. IDS 220000-220999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_ROLE_A = (function(){
  const out = [];

  V2.block(out, "Social Role in a Group", "Clown", 220000, [
    ["Ready with a bit when the silence stretches", "Hears a silence run past a few seconds and fills it with a prepared routine, whatever the occasion.", "(the pause at the graveside goes on) — Well. Nobody tell the caterers.", 3, "d", {vol:1, pos:1}],
    ["Funny so nobody asks how they are", "Answers a personal question with a stock routine about being a delicate flower and moves on before anyone can follow up.", "How am I? A delicate flower, thank you. Anyway, who's driving?", 3, "u", {emo:-1, hon:-1}],
    ["A decoy for the shy one", "Pulls the room's attention onto a stunt just as someone timid is about to be put on the spot.", "(the teacher says 'and you?' — a whole tray of cutlery hits the floor) — Sorry! Carry on, nothing to see.", 3, "d", {warm:1, agr:1}],
    ["Roasting their own failure before the agenda", "Opens a tense meeting with a joke at the expense of their own missed target so the real discussion can start.", "Before anyone says it: yes, I sank the Henderson account. I'm told the sinking was very elegant.", 3, "u", {ego:-1, mood:1}],
    ["Stunts nobody requested", "Escalates a quiet moment with a physical gag, such as working an oven glove like a puppet through the whole toast.", "(slides across the kitchen tiles, arms out) — Ta-da! Dinner is served, in a manner of speaking.", 5, "c", {act:1, vol:1}],
    ["An impression of whoever just left", "Waits for the door to close and then performs a pitch-perfect impression of the person who walked out.", "(nasal, clipped) 'Per my last email.' (own voice) You're welcome.", 4, "u", {rebel:1, man:-1}],
    ["One dry line, saved for the worst moment", "Says almost nothing all evening and then lands a single deadpan remark at the point the room most needs it.", "(a long quiet; flat) — On the plus side, the cake survived.", 2, "s", {vol:-1, mood:1}],
    ["A punchline swallowed at a real tear", "Feels the joke arrive, looks at the person who is actually crying, and sits on it.", "(opens their mouth, shuts it again, and passes the tissues)", 1, "s", {emo:1, man:1}],
    ["Not taken seriously when it matters", "Tries to say something sincere and finds the room waiting for the punchline, so has to ask twice to be heard.", "No, listen. I'm not doing a voice. (somebody snorts) Right. Never mind.", 3, "d", {emo:1, mood:-1}],
    ["Switched off once the audience has gone", "Drops the whole act on the drive home and answers questions in single syllables.", "(staring at the road) Mm. Yes. Good night, wasn't it.", 2, "d", {vol:-1, mood:-1}],
    ["Commentating on the disaster live", "Narrates the room's mishaps in the voice of a sports pundit while they are still happening.", "And the soufflé goes down, ladies and gentlemen. It's not looking good for the soufflé.", 4, "c", {vol:1, pace:1, pos:1}],
    ["Reviving an old in-joke when the energy dips", "Reaches quietly for an in-joke from years ago when the room flags, and it still more or less works.", "Is this a 'kettle gate' situation? It feels a bit kettle gate.", 1, "c", {warm:1, pos:1}],
    ["Helpless with laughter before the punchline", "Collapses into giggles before reaching the end of the joke and takes the audience down with them.", "So the vicar says — (wheezing) — no, wait, wait — the vicar says —", 5, "c", {vol:1, emo:1}],
    ["An apology wrapped in gags", "Delivers a real apology inside so many jokes that it can be neither accepted nor refused.", "I'm sorry I missed your birthday. I'm sorry about most things, really. Cake's on me. Metaphorically.", 3, "u", {emo:-1, pos:1}],
    ["Nicknaming each recurring problem", "Gives a repeating group headache a name, which makes it easier to bear and harder to fix.", "Ah, the Monday Meltdown, right on schedule. Somebody put the kettle on.", 2, "u", {pos:1, vol:1}],
    ["A catchphrase at the door", "Finishes an exit with a bow or a signature line, however long people are waiting for them to go.", "(hand on the doorframe) Ladies, gentlemen and the dog, I'm here all week. Try the veal.", 4, "c", {vol:1, ego:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Scapegoat", 220100, [
    ["Blamed first, defended last", "Is named as the cause of a group failure before the facts are in, and takes it with a shrug.", "Who left the gate open? — (already lifting a hand) Fine. Probably me.", 3, "u", {ego:-1, agr:1}],
    ["A hand up for every mishap", "Claims each accident so quickly that the group has stopped checking who actually did it.", "(hand already up) That'll be me. Whatever it is.", 4, "c", {agr:1, ego:-1}],
    ["The designated difficult one", "Hears relatives call them 'the problem' in the present tense and has started to answer to it with a theatrical sigh.", "Oh, I'm the difficult one. Ask anyone, they'll give you the whole list.", 5, "d", {rebel:1, mood:-1}],
    ["Apologising before anyone has spoken", "Starts saying sorry the moment someone draws breath, whether or not the remark is going to be about them.", "Sorry — sorry, was that me? I'll move. I'll — sorry.", 5, "c", {man:1, ego:-1}],
    ["Seeing the glance arrive first", "Notices the room's eyes sliding towards them a half-second before the sentence starts, and begins to shrink.", "(the pause; the glances) Yes. I know. Go on.", 2, "s", {mood:-1, emo:-1}],
    ["Asked what they have done with it", "Is questioned about keys, remotes and the last biscuit as if the loss were obviously theirs.", "I haven't touched it. It's behind you. No, I'll look. I'll look.", 3, "u", {mood:-1, agr:1}],
    ["In every account of how it went wrong", "Features in the family's telling of each disaster, even the ones that happened when they were nine.", "Ask Dad about the caravan. I was nine. I was holding the map, apparently that's the same as steering.", 3, "d", {hon:1, mood:-1}],
    ["A defence rehearsed and never delivered", "Builds a careful reply in the shower and then says nothing at the table when the accusation comes.", "(the speech collapses before it starts) It's fine. Pass the salt.", 2, "d", {vol:-1, asrt:-1}],
    ["Living down to the reputation", "Makes the very trouble they are already blamed for once guests are watching, as if to get it over with.", "(sets the glass down on the edge, looks at the aunt, lets it fall) There. Now it's true.", 4, "u", {rebel:1, mood:-1}],
    ["Letting the wrong charge stand", "Keeps quiet when the facts would clear them, because naming the real culprit feels worse than carrying it.", "I'd rather not say who. Put it down to me, it's easier.", 2, "u", {agr:1, hon:-1}],
    ["Quoted as the reason for a decision they opposed", "Is cited as the cause of a group choice they argued against in writing, twice.", "I said no. Twice. It's in the email. — Yes, but you were in the room.", 3, "c", {hon:1, mood:-1}],
    ["Called in for a quick word", "Is the one summoned afterwards to explain a wobble the whole team caused.", "(the manager's door opens) Got a minute? — For what, specifically? No, never mind. Coming.", 2, "c", {mood:-1, disc:1}],
    ["Drowning the accusation in context", "Answers a single raised eyebrow with five minutes of timeline, explanation and sorries.", "I did leave at four, but only because the supplier rang, and I did say, or I thought I said, and I'm so sorry, I should have —", 5, "c", {vol:1, pace:1, ego:-1}],
    ["The seat nearest the door at family meals", "Takes the chair by the kitchen door and keeps busy passing dishes, ready to slip out when the old arguments start.", "(takes the chair by the door, plate balanced) I'm fine here. Easier for passing things.", 2, "d", {asrt:-1, mood:-1}],
    ["A private ledger of vindications", "Silently tallies the times they were blamed and later proved right, and does not read the tally out.", "(sees that the leak was the neighbour's pipe all along; nods once; tells no one)", 1, "s", {hon:1, mood:1}],
    ["Forgiven last, and quietly", "Is welcomed back into the group's chatter days after everyone else, with nobody mentioning the gap.", "Oh, you're talking to me again. (smiles) Three days. New record.", 1, "u", {mood:-1}]
  ]);

  V2.block(out, "Social Role in a Group", "Gatekeeper", 220200, [
    ["Keeper of the guest list", "Holds the list for the party or club night and turns away anyone not on it, whoever invited them.", "You're not on my list. I don't care who said you could come, I have the list.", 3, "u", {asrt:1, warm:-1}],
    ["Vetting a newcomer with one question", "Asks something small and ordinary and decides the stranger's standing on the answer.", "Lovely to meet you. Now, who sent you our way? (waits) Mm. And before that?", 3, "d", {intel:1, warm:-1}],
    ["House rules handed over in the doorway", "Gives a new arrival the list of rules before the greeting, down to which mug is whose.", "(holding out a laminated sheet before the coat is off) Lovely to meet you. Page one: nothing before eleven.", 3, "c", {form:1, disc:1}],
    ["Answering the questions put to someone else", "Steps in front of a friend or relative and replies to every question addressed to them.", "(to the visitor at the door) Resting at the moment. I'll tell them you called.", 4, "c", {vol:1, asrt:1}],
    ["Sole holder of the password", "Keeps the shared password, key or booking account to themselves and grants access by mood and favour.", "I can add you to the account. Not today. Ask me when the rota has settled.", 3, "u", {disc:1, warm:-1}],
    ["Letting the visitor wait", "Finishes typing in front of an arrival and looks up only once the pause has made its point.", "(types on for five long seconds, then looks up) Yes? Oh, you're early. How unusual.", 5, "u", {ego:1, man:-1}],
    ["Screening what reaches the person in their care", "Opens the post and takes the calls first, passing on only what they judge the person can bear.", "There was a call. Nothing you need tonight. I've dealt with it.", 3, "d", {hon:-1, warm:1}],
    ["Months of washing-up before a real role", "Lets a new member do nothing but the tea urn for a season before offering anything with a say in it.", "We'll see how you get on with the urn. Give it till Easter and we'll talk.", 2, "u", {disc:1, warm:-1}],
    ["A bag on the free seat", "Rests a coat on the empty chair and leaves it there while the stranger decides whether to ask.", "Oh, is this one yours? Sorry, it's sort of saved.", 1, "s", {asrt:-1, warm:-1}],
    ["Hiding behind the rules to say no", "Cites the policy, the system or the committee so that the refusal never seems to be theirs.", "I'd love to. Sadly the system won't let me. Believe me, I've asked.", 4, "c", {form:1, hon:-1}],
    ["Waving favourites past the queue", "Opens the way for the approved with a nod while everyone else is asked for a reason.", "Oh, you're fine, go straight in. (to the next in line) And you are?", 3, "d", {warm:-1, man:-1}],
    ["An old refusal held for years", "Has not changed an answer since the spring of 2019 and will tell any appeal so, with the date.", "I said no in March 2019, and I still mean it. Next.", 5, "d", {asrt:1, disc:1}],
    ["Guarding a subject, not a door", "Closes a topic with 'we don't go into that here' and steers newcomers away before they ask.", "Oh, we don't go into that. Have you seen the garden?", 4, "u", {form:1, hon:-1}],
    ["A password for the front door", "Makes callers answer a house question through the letterbox before the chain comes off.", "(through the letterbox) What's the word? ... Close. Come back when you've got it.", 3, "d", {form:1, man:-1}],
    ["The door opened a hand's width", "Opens the door only part-way while deciding who is on the step.", "(the door opens a hand's width) Yes? ... Oh. Right. One moment.", 1, "c", {warm:-1, mood:-1}],
    ["Asking what it's regarding, even of old friends", "Puts the same question to every caller, including those they have known for decades, out of habit.", "And what's it regarding? (a pause) No, I know it's you. I ask everyone.", 2, "s", {form:1, disc:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Historian", 220300, [
    ["Walking an argument back through the day", "Takes two arguing cousins through the afternoon hour by hour until they find the point where their memories split.", "Right. You arrived at two. Who made the tea? And then? Then that's where it went wrong.", 3, "u", {intel:1, asrt:1}],
    ["Briefing the newcomers on the lore", "Tells new members the founding stories and which subjects to leave alone.", "Right. Sit. First thing: the coffee machine was a gift, and we don't mention the gift.", 3, "d", {vol:1, warm:1}],
    ["Stopping the anecdote to fix the year", "Halts a story halfway to correct the date, the weather or the running order, then waves it on.", "It was a Thursday. The wedding was the Saturday. Go on.", 5, "c", {asrt:1, man:-1}],
    ["Quoting your own words back, with the year", "Recalls a remark from years ago, word for word, at the moment it most contradicts what is being said now.", "In 2017, at your sister's, you said — and I wrote it down — 'I would never move north.'", 5, "d", {asrt:1, intel:1}],
    ["Keeper of the box of old agendas", "Holds a box of agendas, receipts and old rotas, and offers to look anything up unprompted.", "Hang on, I have the rota for that summer. Third drawer. Give me a minute.", 2, "u", {disc:1, intel:1}],
    ["The founding story, told the same way each time", "Delivers the group's origin tale in the same order with the same pauses, and gets cross if it is trimmed.", "So: raining, van won't start, piano on the pavement, and that is how we got the piano.", 2, "c", {disc:1, pos:1}],
    ["Knowing whose chair it is", "Knows which seat, mug and corner of the sofa has belonged to whom for years, and steers visitors off them.", "Not that one, that's been Gran's since '94. Take the blue one.", 2, "d", {form:1, cur:-1}],
    ["Explaining where the in-joke came from", "Gives the origin of a catchphrase, at length, to anyone who laughs at the wrong moment.", "It's 'the Norwich option' because of 2011, and the car park, and the —", 5, "c", {vol:1, warm:1}],
    ["Labelling the back of every photograph", "Turns each print over to pencil in the names, the place and the year before it goes into the box.", "Who's this? Nobody will know in forty years. Date, name, place. Hand me that pencil.", 3, "d", {disc:1, intel:1}],
    ["The missing name, murmured", "Murmurs the forgotten name, year or place to whoever is stuck, without breaking the conversation.", "(quietly) Ferndale. It was Ferndale.", 1, "c", {warm:1, man:1}],
    ["Keeper of the reason for the old rift", "Remembers what caused an old family falling-out and keeps it to themselves, even when asked.", "It was a long time ago. I'd rather not go into it. Pass me the tea.", 2, "s", {hon:-1, mood:1}],
    ["Dating time by events", "Counts the years by group landmarks rather than numbers, so the calendar becomes 'before the flood' and 'after the move'.", "That was before the flood, but after the Christmas the dog ate the ham. So 'ninety-eight, near enough.", 2, "d", {cur:1, pos:1}],
    ["Pained when a detail goes missing", "Winces when the group forgets a small fact or ritual, and tries to bring it back.", "Nobody's doing the toast to absent friends? We always — (stops) — we used to do the toast.", 3, "u", {emo:1, mood:-1}],
    ["Remembering the anniversary", "Sends a short message on the day to mark a death, a move or a first meeting that others have let pass.", "(a text) Twenty years today since the van. Thought of you.", 1, "s", {warm:1, emo:1}],
    ["Recording the elders while they can", "Asks the oldest person present to retell a story and records it on a phone before it is lost.", "Gran, say that again, the bit about the ferry. I'm recording. Humour me.", 3, "u", {cur:1, warm:1}],
    ["Writing the evening up that night", "Records the day's events, who said what and what was decided, in a notebook before bed.", "Give me ten minutes. I want to get it down while it's fresh.", 3, "u", {disc:1, intel:1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_ROLE_A);
