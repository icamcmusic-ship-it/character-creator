/* v2 content: Social Role: Clown, Scapegoat, Gatekeeper, Historian. IDS 220000-220999. Rows go in the blocks below; see traits-v2-lib.js for the format. */
const TRAITS_V2_ROLE_A = (function(){
  const out = [];

  V2.block(out, "Social Role in a Group", "Clown", 220000, [
    ["Breaks the tension on cue", "Hears a silence stretch past a few seconds and fills it with a prepared bit, whatever the occasion.", "(the pause at the graveside goes on) — Well. Nobody tell the caterers.", 3, "d", {vol:1, pos:1}],
    ["Funny so nobody asks how they are", "Answers a personal question with a routine and moves on before anyone can follow up.", "How am I? A delicate flower, thank you. Anyway, who's driving?", 3, "u", {emo:-1, hon:-1}],
    ["Plays the fool to shield the quiet one", "Pulls the room's attention onto a stunt just as someone shy is about to be put on the spot.", "(the teacher says 'and you?' — a whole tray of cutlery hits the floor) — Sorry! Carry on, nothing to see.", 3, "d", {warm:1, agr:1}],
    ["Roasts their own failure before the agenda", "Opens a tense meeting with a joke at the expense of their own missed target so the real discussion can start.", "Before anyone says it: yes, I sank the Henderson account. I'm told the sinking was very elegant.", 3, "u", {ego:-1, mood:1}],
    ["Stunts nobody requested", "Escalates a quiet moment with a physical gag, such as working an oven glove like a puppet through the whole toast.", "(slides across the kitchen tiles in socks, arms out) — Ta-da! Dinner is served, in a manner of speaking.", 5, "c", {act:1, vol:1}],
    ["Does the voice of whoever just left", "Waits for the door to close and then performs a pitch-perfect impression of the person who walked out.", "(nasal, clipped) 'Per my last email.' (own voice) You're welcome.", 4, "u", {rebel:1, man:-1}],
    ["One dry line, saved for the worst moment", "Says almost nothing all evening and then lands a single deadpan remark at the point the room most needs it.", "(a long quiet; flat) — On the plus side, the cake survived.", 2, "s", {vol:-1, mood:1}],
    ["Holds the joke back when the grief is real", "Feels the punchline arrive, looks at the person who is actually crying, and sits on it.", "(opens their mouth, shuts it again, and passes the tissues)", 1, "s", {emo:1, man:1}],
    ["Not allowed to be serious", "Is met with polite grins when finally saying something heartfelt, because the room is waiting for the bit.", "No, listen. I'm not doing a voice. (somebody snorts) Right. Never mind.", 3, "d", {emo:1, mood:-1}],
    ["Goes flat once the audience leaves", "Drops the whole act on the drive home and answers questions in single syllables.", "(staring at the road) Mm. Yes. Good night, wasn't it.", 2, "d", {vol:-1, mood:-1}],
    ["Live commentary on the disaster", "Narrates the room's mishaps in the voice of a sports pundit while they are still happening.", "And the soufflé goes down, ladies and gentlemen. It's not looking good for the soufflé.", 4, "c", {vol:1, pace:1, pos:1}],
    ["Brings back the old bit when the room flags", "Reaches quietly for an in-joke from years ago whenever the energy dips, and it still more or less works.", "Is this a 'kettle gate' situation? It feels a bit kettle gate.", 1, "c", {warm:1, pos:1}],
    ["Laughs first and hardest", "Collapses into giggles before reaching their own punchline and takes the audience down with them.", "So the vicar says — (wheezing) — no, wait, wait — the vicar says —", 5, "c", {vol:1, emo:1}],
    ["Jokes through the apology", "Delivers a real apology wrapped in so many gags that it can be neither accepted nor refused.", "I'm sorry I missed your birthday. I'm sorry about most things, really. Cake's on me. Metaphorically.", 3, "u", {emo:-1, pos:1}],
    ["Christens every recurring problem", "Gives each repeating group headache a nickname, which makes it easier to bear and harder to fix.", "Ah, the Monday Meltdown, right on schedule. Somebody put the kettle on.", 2, "u", {pos:1, vol:1}],
    ["Cannot leave without a closing line", "Finishes every exit with a bow, a catchphrase or a bit at the door, however long people are waiting.", "(hand on the doorframe) Ladies, gentlemen and the dog, I'm here all week. Try the veal.", 4, "c", {vol:1, ego:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Scapegoat", 220100, [
    ["Blamed first, defended last", "Is named as the cause of a group failure before the facts are in, and takes it with a shrug.", "Who left the gate open? — (already lifting a hand) Fine. Probably me.", 3, "u", {ego:-1, agr:1}],
    ["Raises a hand for every mishap", "Claims each accident so reflexively that the group no longer checks who actually did it.", "(hand already up) That'll be me. Whatever it is.", 4, "c", {agr:1, ego:-1}],
    ["The designated difficult one", "Is described by relatives as 'the problem' in the present tense, and has started to answer to it.", "Oh, I'm the difficult one. Ask anyone, they'll give you the whole list.", 4, "d", {rebel:1, mood:-1}],
    ["Says sorry before the accusation lands", "Starts apologising the moment someone draws breath, whether or not it is going to be about them.", "Sorry — sorry, was that me? I'll move. I'll — sorry.", 5, "c", {man:1, ego:-1}],
    ["Feels the glance arrive first", "Notices the room's eyes sliding towards them a half-second before the sentence starts, and begins to shrink.", "(the pause; the glances) Yes. I know. Go on.", 2, "s", {mood:-1, emo:-1}],
    ["Handed every missing thing as a charge", "Is asked 'what have you done with it?' about keys, remotes and the last biscuit.", "I haven't touched it. It's behind you. No, I'll look. I'll look.", 3, "u", {mood:-1, agr:1}],
    ["Cited in every account of how it went wrong", "Features in the family's telling of each disaster, even the ones that happened when they were nine.", "Ask Dad about the caravan. I was nine. I was holding the map, apparently that's the same as steering.", 3, "d", {hon:1, mood:-1}],
    ["Rehearses a defence nobody hears", "Builds a careful reply in the shower and then says nothing at the table when the accusation comes.", "(the speech collapses before it starts) It's fine. Pass the salt.", 2, "d", {vol:-1, asrt:-1}],
    ["Lives down to the reputation", "Makes the very trouble they are already blamed for once guests are watching, as if to get it over with.", "(sets the glass down on the edge, looks at the aunt, lets it fall) There. Now it's true.", 4, "u", {rebel:1, mood:-1}],
    ["Lets the wrong charge stand", "Keeps quiet when the facts would clear them, because naming the real culprit feels worse than carrying it.", "I'd rather not say who. Put it down to me, it's easier.", 2, "u", {agr:1, hon:-1}],
    ["Named as the reason for a decision they opposed", "Is quoted as the cause of a group choice they argued against in writing, twice.", "I said no. Twice. It's in the email. — Yes, but you were in the room.", 3, "c", {asrt:-1, hon:1}],
    ["Called in for a quick word", "Is the one summoned afterwards to explain a wobble the whole team caused.", "(the manager's door opens) Got a minute? — For what, specifically? No, never mind. Coming.", 2, "c", {mood:-1, disc:1}],
    ["Floods the accusation with apology and context", "Answers a single raised eyebrow with five minutes of timeline, explanation and sorries.", "I did leave at four, but only because the supplier rang, and I did say, or I thought I said, and I'm so sorry, I should have —", 5, "c", {vol:1, pace:1, ego:-1}],
    ["Agrees to the full charge sheet", "Accepts every accusation put to them and adds a few of their own that nobody had thought of.", "Yes. And the thing with the boiler. And I forgot the dentist. And, now I think of it, the wedding. Anything else?", 5, "d", {emo:1, ego:-1}],
    ["Keeps a private ledger of vindications", "Silently tallies the times they were blamed and later proved right, and does not read the tally out.", "(sees that the leak was the neighbour's pipe all along; nods once; tells no one)", 1, "s", {hon:1, mood:1}],
    ["Forgiven last, and quietly", "Is welcomed back into the group's chatter days after everyone else, with nobody mentioning the gap.", "Oh, you're talking to me again. (smiles) Three days. New record.", 1, "u", {mood:-1, warm:-1}]
  ]);

  V2.block(out, "Social Role in a Group", "Gatekeeper", 220200, [
    ["Decides who is let through", "Answers 'is that person free?' with a polite no and a list of reasons nobody else has seen.", "Not free this week, I'm afraid. Or the next. Can I take a message?", 3, "u", {asrt:1, warm:-1}],
    ["Vets a newcomer with one question", "Asks something small and ordinary and decides the stranger's standing on the answer.", "Lovely to meet you. Now, who sent you our way? (waits) Mm. And before that?", 3, "d", {intel:1, warm:-1}],
    ["Refuses politely on someone else's behalf", "Says 'I'm afraid that won't be possible' for a person who has not yet been asked.", "Very booked, I'm afraid. I wouldn't want to promise anything on their behalf.", 3, "c", {man:1, asrt:1}],
    ["Answers the questions put to someone else", "Steps in front of a friend or relative and replies to every question addressed to them.", "(to the visitor at the door) Resting at the moment. I'll tell them you called.", 4, "c", {vol:1, asrt:1}],
    ["Holds the only login", "Keeps the shared password, key or booking account to themselves and grants access by mood and favour.", "I can add you to the account. Not today. Ask me when the rota has settled.", 3, "u", {disc:1, warm:-1}],
    ["Lets the visitor wait", "Finishes typing in front of an arrival and looks up only once the pause has made its point.", "(types on for five long seconds, then looks up) Yes? Oh, you're early. How unusual.", 4, "u", {ego:1, man:-1}],
    ["Screens what reaches the person in their care", "Opens the post and takes the calls first, passing on only what they judge the person can bear.", "There was a call. Nothing you need tonight. I've dealt with it.", 3, "d", {hon:-1, warm:1}],
    ["Wants an introduction first", "Gives a stranger no seat until a known face has vouched for them.", "Lovely. And which of ours brought you? No one? Then let's see how the summer goes.", 2, "u", {form:1, cur:-1}],
    ["Puts a bag on the free seat", "Rests a coat on the empty chair and leaves it there while the stranger decides whether to ask.", "Oh, is this one yours? Sorry, it's sort of saved.", 1, "s", {asrt:-1, warm:-1}],
    ["Hides behind the rules to say no", "Cites the policy, the system or the committee so that the refusal never seems to be theirs.", "I'd love to. Sadly the system won't let me. Believe me, I've asked.", 4, "c", {form:1, hon:-1}],
    ["Waves favourites past the queue", "Opens the way for the approved with a nod while everyone else is asked for a reason.", "Oh, you're fine, go straight in. (to the next in line) And you are?", 3, "d", {warm:-1, man:-1}],
    ["Holds an old refusal for years", "Has not changed an answer since the spring of 2019 and will tell any appeal so, with the date.", "I said no in March 2019, and I still mean it. Next.", 5, "d", {asrt:1, disc:1}],
    ["Guards a subject, not a door", "Closes a topic with 'we don't go into that here' and steers newcomers away before they ask.", "Oh, we don't go into that. Have you seen the garden?", 4, "u", {form:1, hon:-1}],
    ["Opens every room to the approved", "Gives a vetted newcomer the full tour, the stories and the good biscuits, while anyone else sees the hallway.", "Right, you, come through, I'll show you everything. (to the rest) The loo's on the left.", 5, "u", {vol:1, warm:1}],
    ["Opens the door a hand's width", "Opens the door only part-way while deciding who is on the step.", "(the door opens a hand's width) Yes? ... Oh. Right. One moment.", 1, "c", {cur:-1, mood:-1}],
    ["Asks what it's regarding, even of old friends", "Puts the same question to every caller, including those they have known for decades, out of habit.", "And what's it regarding? (a pause) No, I know it's you. I ask everyone.", 2, "s", {form:1, disc:1}]
  ]);

  V2.block(out, "Social Role in a Group", "Historian", 220300, [
    ["Settles disputes with the date", "Ends an argument about the past with the year, the place and who was sitting where.", "It wasn't Christmas. It was the second of January, 1998, and you were in the green chair.", 3, "u", {intel:1, hon:1, asrt:1}],
    ["Briefs the newcomers on the lore", "Tells new members the founding stories and which subjects to leave alone.", "Right. Sit. First thing: the coffee machine was a gift, and we don't mention the gift.", 3, "d", {vol:1, warm:1}],
    ["Interrupts the anecdote to fix the year", "Stops a story halfway to correct the date, the weather or the running order, then waves it on.", "It was a Thursday. The wedding was the Saturday. Go on.", 4, "c", {asrt:1, man:-1}],
    ["Quotes your own words back, with the year", "Recalls a remark from years ago, word for word, at the moment it most contradicts what is being said now.", "In 2017, at your sister's, you said — and I wrote it down — 'I would never move north.'", 4, "d", {asrt:1, intel:1}],
    ["A minute book, unrequested", "Holds a box of agendas, receipts and old rotas, and offers to look it up.", "Hang on, I have the rota for that summer. Third drawer. Give me a minute.", 2, "u", {disc:1, intel:1}],
    ["Tells the founding story the same way each time", "Delivers the group's origin tale in the same order with the same pauses, and gets cross if it is trimmed.", "So: raining, van won't start, piano on the pavement, and that is how we got the piano.", 2, "c", {disc:1, pos:1}],
    ["Knows whose chair it is", "Knows which seat, mug and corner of the sofa has belonged to whom for years, and steers visitors off them.", "Not that one, that's been Gran's since '94. Take the blue one.", 2, "d", {form:1, cur:-1}],
    ["Explains where the in-joke came from", "Gives the origin of a catchphrase, at length, to anyone who laughs at the wrong moment.", "It's 'the Norwich option' because of 2011, and the car park, and the —", 3, "c", {vol:1, warm:1}],
    ["Produces the timestamp", "Scrolls to the dated photo or message to close a disagreement the way a lawyer closes a case.", "(phone out, thumb scrolling) Eleventh of June, 19.42. 'I'll bring the wine.' Your words.", 5, "d", {asrt:1, intel:1}],
    ["Supplies the missing name under their breath", "Murmurs the forgotten name, year or place to whoever is stuck, without breaking the conversation.", "(quietly) Ferndale. It was Ferndale.", 1, "c", {warm:1, man:1}],
    ["The only one who knows why they stopped speaking", "Remembers what caused an old family rift and keeps it to themselves, even when asked.", "It was a long time ago. I'd rather not go into it. Pass me the tea.", 2, "s", {hon:-1, mood:1}],
    ["Dates time by events", "Counts the years by group landmarks rather than numbers, so the calendar becomes 'before the flood' and 'after the move'.", "That was before the flood, but after the Christmas the dog ate the ham. So, 'ninety-eight, near enough.", 2, "d", {cur:1, pos:1}],
    ["Pained when a detail goes missing", "Winces when the group forgets a small fact or ritual, and tries to bring it back.", "Nobody's doing the toast to absent friends? We always — (stops) — we used to do the toast.", 3, "u", {emo:1, mood:-1}],
    ["Lets the legend stand", "Knows the true, less flattering version of a founding story and keeps it to themselves.", "(someone retells the heroic version; they nod and pour the tea)", 1, "s", {hon:-1, mood:1}],
    ["Corrects the speech from the floor", "Calls out the best man, the chair or the host in front of the whole room when a date or place is wrong.", "Sorry — sorry — it was Brighton, not Blackpool. Carry on, it's lovely.", 5, "c", {vol:1, man:-1}],
    ["Writes the evening up that night", "Records the day's events, who said what and what was decided, in a notebook before bed.", "Give me ten minutes. I want to get it down while it's fresh.", 3, "u", {disc:1, intel:1}]
  ]);

  return out;
})();
TRAITS.push(...TRAITS_V2_ROLE_A);
