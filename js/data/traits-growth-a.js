/* ============================================================================
   TRAIT-BANK GROWTH A — 2026 audit §4a: every category up to a floor of about 15.
   Written as behaviours (what the speech or manner DOES), never as labels or
   diagnoses. Rarity and intensity are decoupled on purpose: quiet signatures and
   loud commons are written deliberately. reviewStatus "unreviewed".
   IDS: each category owns a block of 100 starting at 190000; APPEND ONLY.
   ========================================================================== */
const TRAITS_GROWTH_A = (function(){
  const R = {c:"common", u:"uncommon", d:"distinctive", s:"signature"};
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const out = [];
  /* block(section, category, baseId, rows)
     row: [trait, desc, example, intensity 1-5, rarityKey c|u|d|s, pol{axis:+1|-1}, extra?] */
  function block(section, category, base, rows){
    rows.forEach((r, i) => {
      const [trait, desc, example, intensity, rk, pol, extra] = r;
      out.push(Object.assign({
        id: base + i, section, category, trait, desc, example, intensity,
        rarity: R[rk], pol: Object.assign({}, pol || {}), conceptFamily: "growth-" + slug(trait), reviewStatus: "unreviewed"
      }, extra || {}));
    });
  }

  const HUM = "Humor Style", CON = "Conversation Mechanics";

  block(HUM, "Physical & Slapstick", 190000, [
    ["Stumbles on purpose to break tension","Fakes a trip or a wobble the moment a room gets stiff.","<i>(catches a toe on the rug, flails grandly)</i> Nobody saw that. Nobody say a word.",4,"c",{vol:1,mood:1,form:-1}],
    ["Mimes the whole story","Acts out every character in an anecdote with arms and legs.","So he goes like THIS, <i>(stomps across the room)</i> and she goes like THAT!",5,"c",{vol:1,emo:1,form:-1}],
    ["Tiny prop gag, straight face","Slips one small object into a scene and never acknowledges it.","<i>(sets a teaspoon on the judge's desk, says nothing)</i>",1,"s",{vol:-1,disc:-1,rebel:1}],
    ["Slow-motion reaction","Reacts to small news in exaggerated slow motion.","<i>(turns their head over four full seconds)</i> You. Did. What.",3,"u",{pace:-1}],
    ["Wrestles inanimate objects","Treats a stubborn jar or chair as an opponent, with commentary.","Oh, you want to go? Fine. Let's go, you little lid.",3,"c",{vol:1,mood:1,pos:1,form:-1}],
    ["Silent sidestep","Dodges a ridiculous situation with one precise, wordless move.","<i>(steps one pace left as the bucket tips, eyes forward)</i>",1,"d",{vol:-1,pace:-1}],
    ["Mock-dramatic death","Collapses theatrically at any small setback.","<i>(clutches chest, sinks to the floor)</i> Tell my story. Tell them the toast burned.",4,"u",{vol:1,emo:1,form:-1}],
    ["Copies the posture of whoever they tease","Mirrors someone's stance exaggeratedly until they notice.","<i>(adopts Dev's folded arms and scowl)</i> This is you in meetings, mate.",3,"u",{asrt:1,agr:1}],
    ["Gesture that outruns the sentence","Throws a huge flourish onto an ordinary remark.","<i>(sweeps an arm across the room)</i> The kettle is on.",2,"d",{ego:1}]
  ]);

  block(HUM, "Doesn't Get Jokes", 190100, [
    ["Answers the setup, ignores the punchline","Takes the first half as a real question and replies to it in full.","Why did the chicken cross the road? Probably for food. Is there a farm near the road?",3,"c",{intel:-1}],
    ["Pauses the room to ask who is being mocked","Looks round for a victim before they will laugh.","Wait. Is this about Ines? Because if so, I don't think it's fair.",3,"u",{hon:1}],
    ["Retells the joke wrong, sincerely","Passes on a joke they half understood, with the key part missing.","A guy walks into a bar and orders, um, a drink. And then it's very funny.",2,"u",{disc:-1,pos:1,intel:-1}],
    ["Quiet polite smile, no laugh","Offers a small closed smile where laughter is due, and waits for the topic to change.","<i>(smiles with the corners of the mouth only)</i> Mm. Anyway.",1,"d",{vol:-1,man:1,emo:-1}],
    ["Loudly proud of not getting it","Announces confusion cheerfully and invites everyone to enjoy it.","Nope! Went right over my head! Somebody get a ladder!",4,"c",{vol:1,pos:1,ego:-1,intel:-1,form:-1}],
    ["Treats sarcasm as a sincere compliment","Thanks people for obvious digs and takes them warmly.","Oh, 'real genius move'? Thank you. I did think so.",3,"u",{agr:-1,intel:-1}],
    ["Notes the joke formally, for later","Says that was a joke and that they will think about it.","I recognise that as a joke. I'll consider it tonight and report back.",2,"d",{asrt:1,pace:-1}],
    ["Laughs at the wrong line","Finds the unfunny part hilarious and misses the real one.","<i>(wheezes at 'then he parked the car')</i>",3,"u",{mood:1,emo:1,intel:-1}],
    ["Wants the joke told slower","Asks for a second telling at half speed, with pauses.","Again, slowly. Start at the walking-into-the-bar bit.",2,"u",{pace:-1,asrt:1,intel:-1}]
  ]);

  block(HUM, "Gallows", 190200, [
    ["Cracks wise during the crisis","Makes the first joke in an emergency, to the horror of the bystanders.","Well, that's the roof gone. Great news: I've always wanted a skylight.",5,"c",{vol:1,mood:-1,rebel:1,man:-1}],
    ["Deadpan understatement of disaster","Describes catastrophe in the mildest possible words.","It's gone slightly wrong. The building is, I'd say, mostly on fire.",2,"d",{vol:-1,pace:-1,mood:-1}],
    ["Black humour, cheerful face","Delivers grim lines with a bright smile and a lilt.","We're all doomed! Lovely morning for it, though.",4,"c",{pos:1,mood:-1,vol:1}],
    ["Names the worst case with a grin","Says the awful outcome first, so nobody else has to.","So best case we're ruined. Worst case, we're ruined and cold.",3,"u",{hon:1,pos:-1,asrt:1}],
    ["Coffin-joke at the wake","Tells a gentle joke about the dead to a grieving family, with permission asked.","He'd have hated this sandwich, wouldn't he? Said so for forty years.",2,"s",{vol:-1,emo:1}],
    ["Black comedy as a private habit","Keeps the dark jokes for one trusted listener only.","<i>(leans in, whispers)</i> Don't tell the others, but I've named the tumour Gary.",1,"d",{vol:-1,man:-1,emo:-1}],
    ["Treats danger like a sitcom","Narrates peril as though it were scripted entertainment.","And here comes the bear. Right on schedule. Cue the music.",4,"u",{ego:1,rebel:1}],
    ["Dark joke about someone else's bad luck","Mocks others' misfortune with a laugh and no malice they would admit.","Lost your keys AND your job? Efficient!",3,"u",{agr:1,warm:-1,hon:-1,man:-1}]
  ]);

  block(HUM, "Teasing as Affection", 190300, [
    ["Mock-formal titles for friends","Addresses close friends with absurdly grand ranks.","Good evening, Lord High Marshal of the Dishwasher.",3,"u",{mood:1}],
    ["Loud public ribbing, soft private check","Jeers in a crowd and quietly asks afterwards if they are alright.","<i>(later, aside)</i> I was only larking about. All right?",5,"c",{vol:1,emo:1,form:-1}],
    ["Mocks their accent, adores it","Imitates a friend's way of talking, then asks them to say it again.","'Wotter.' Say 'water' again. Please.",3,"c",{vol:1,agr:1,form:-1}],
    ["Teasing by pointed silence","Greets a friend's folly with one long, slow, level look.","<i>(holds the gaze for five seconds)</i> No. Go on. Explain it.",1,"d",{vol:-1,pace:-1,asrt:1}],
    ["Brings up the old embarrassing story","Retells a friend's worst moment at every gathering.","Do tell them about the swan, Marcus.",4,"c",{vol:1,hon:-1,agr:1,man:-1}],
    ["Quiet insult-compliment pair","Slips a small barb into praise in a whisper.","Not bad for someone who can't parallel park.",2,"u",{vol:-1,man:1}],
    ["Defends the friend to others while mocking","Cannot bear anyone else teasing the person they tease themselves.","Oi. Only I get to say that about him.",3,"d",{agr:1,hon:1}],
    ["Gentle tease only on birthdays","Saves the affectionate jab for one annual occasion.","<i>(raises a cup)</i> Another year, and still no sense. Love you.",1,"s",{warm:1,disc:1}]
  ]);

  block(HUM, "Laughs at Own Jokes", 190400, [
    ["Starts laughing before the punchline","Is giggling halfway through the setup and cannot finish.","So the vicar — <i>(wheezes)</i> — no, wait — the vicar —",4,"c",{vol:1,emo:1,disc:-1,mood:1}],
    ["Slaps the table at own wit","Bangs a hand on the nearest surface after every good line.","<i>(slap)</i> That's a good one! I'm having that one framed!",5,"c",{vol:1,asrt:1}],
    ["Smiles privately, says nothing","Lets a joke go by in their head and smiles to themselves.","<i>(looks at the ceiling, lips twitching)</i>",1,"s",{vol:-1,ego:-1,emo:-1}],
    ["Wipes tears over own story","Cries laughing at their own anecdote while others wait.","<i>(dabs eyes)</i> Oh, I'm sorry. Give me a minute. The goat. The goat!",4,"u",{emo:1,pace:-1,mood:1}],
    ["Thanks the room for laughing","Bows to even a small chuckle as though it were applause.","Thank you! Thank you! I'm here all week!",3,"u",{form:-1,pos:1}],
    ["Grades own joke aloud","Rates the line they just said, generously.","Eight out of ten. Possibly nine.",2,"d",{ego:1,asrt:1,vol:-1}],
    ["Quiet exhale through the nose","One short, soft huff at their own dry remark.","<i>(a small huff through the nose)</i> Hm. Yes. Good.",1,"d",{vol:-1,pace:-1}],
    ["Laughs, then asks if anyone else found it funny","Checks for company after laughing alone.","<i>(laughs)</i> Was that just me? Fine. It was funny.",2,"u",{ego:-1,cur:1}]
  ]);

  block(HUM, "Observational", 190500, [
    ["Pairs two unrelated things in the room","Draws a dry link between two objects nobody had joined.","The fridge hums in the same key as the vicar.",2,"d",{vol:-1}],
    ["Rants about a pet peeve for laughs","Builds a loud comic tirade around one small irritation.","Who decided that cutlery should be a surprise? Who?",5,"c",{vol:1,agr:1,emo:1,form:-1}],
    ["Spots patterns in how people queue","Reads group behaviour and announces its funny rules.","Watch. Nobody takes the end seat. It's a law.",3,"u",{intel:1,cur:1}],
    ["Mild remark, devastating accuracy","Says one small, true thing and lets it land.","That's a lot of confidence for a man holding a map upside down.",2,"s",{vol:-1,hon:1,pace:-1}],
    ["Everyday sayings taken apart","Picks at an ordinary phrase until it sounds absurd.","'Hang in there.' Like a cat on a poster. Where else would I hang?",3,"c",{rebel:1,mood:1}],
    ["Comic voice for ordinary announcements","Reads signs and tannoys aloud in a mock-posh voice.","<i>(pompously)</i> 'Mind the gap.' The GAP, ladies and gentlemen.",4,"c",{vol:1,form:-1}],
    ["Notes the weather and the mood of the street","Gives a wry running weather report on the day's small events.","Drizzle again. The sky is just sulking now.",1,"u",{vol:-1,mood:-1,pos:-1}],
    ["Funny about people's habits, kindly","Teases tics and rituals without malice.","Every Friday, the same sandwich. It's a liturgy.",2,"u",{intel:1}]
  ]);

  block(HUM, "Pun-Groaner", 190600, [
    ["Pun on the menu, every time","Cannot read a menu without wordplay.","I'll have the lettuce alone. Romaine calm.",3,"c",{vol:1,mood:1,pos:1,form:-1}],
    ["Pun whispered under the breath","Mutters one pun just loud enough for one listener.","<i>(murmurs)</i> Well, that's thyme gone.",1,"d",{vol:-1,man:1}],
    ["Triple pun, no pause","Fires three puns in a row and carries on as normal.","Bread, loaf, dough, it's all crumbs. Anyway, the meeting.",4,"u",{vol:1,pace:1}],
    ["Straight-faced pun in a formal setting","Slides wordplay into a solemn speech with a flat voice.","The motion is, forgive me, carried. As was the table.",2,"s",{vol:-1,rebel:1}],
    ["Pun on everyone's name","Turns each new acquaintance's name into a pun at once.","Hello, Barry. Hope you don't mind if I berry you in compliments.",4,"c",{vol:1,asrt:1,form:-1}],
    ["Apologises for the pun, makes another","Says sorry then follows up with something worse.","Sorry. That was a stretch. Like yoga.",3,"u",{ego:-1,pos:1}],
    ["Pun in lieu of a hello","Opens each conversation with a pun instead of a greeting.","Morning! Another day, another dolla... no. Coffee.",3,"u",{mood:1,form:-1}],
    ["Delighted by other people's puns","Grabs onto someone else's pun and extends it with joy.","Oh, that's good. That's very good. Can I borrow that?",2,"u",{emo:1}]
  ]);

  block(HUM, "Callback & Running Bit", 190700, [
    ["Calls back a single word for a week","Drops one odd word into every conversation for days.","Anyway. Marmalade.",3,"u",{rebel:1,mood:1}],
    ["Greets the same object daily","Salutes a lamppost, bin or sign each time they pass.","Morning, Gerald. <i>(nods at the bin)</i>",2,"d",{pos:1,form:-1}],
    ["Bit built across the whole meeting","Plants one phrase in the first minute and returns to it at the end.","<i>(at the close)</i> And, as promised, the pelican.",4,"c",{vol:1,asrt:1}],
    ["Fake feud with an object","Maintains a loud rivalry with the printer or the weather.","The printer and I are not speaking.",4,"c",{vol:1,mood:1,form:-1}],
    ["Quiet callback one year later","Repeats a joke from long ago in a murmur, without comment.","<i>(passing the salt, softly)</i> Like the swan.",1,"s",{vol:-1}],
    ["Gives the bit a catchphrase","Ends the repeated joke with the same signature line each time.","And that, my friends, is how we do it in Doncaster.",3,"c",{vol:1,ego:1}],
    ["Takes requests for the old bits","Gets asked for the favourite running joke and performs it.","Do the voice! The voice! — Fine. <i>(does the voice)</i>",3,"u",{ego:1}],
    ["Drops the bit when someone is sad","Notices a mood and lets the running joke rest.","<i>(gently)</i> No bit today. Tea?",1,"d",{emo:1,vol:-1}]
  ]);

  block(CON, "Scripted Speech", 190800, [
    ["Opening line is always the same","Starts every talk with an identical sentence.","Right then, let's get started.",2,"c",{form:1,disc:1,rebel:-1,cur:-1}],
    ["Reads aloud from notes in casual chat","Glances at a card in the middle of a casual conversation.","<i>(checks card)</i> Ah yes. I was going to ask about your holiday.",3,"u",{pace:-1}],
    ["Customer-service voice off the clock","Uses stock phrases of a past job with friends.","Is there anything else I can help you with today?",3,"c",{man:1}],
    ["Reuses one anecdote everywhere","Tells the same tidy story polished by repetition.","Did I tell you about the time with the ferry? Course I did. Anyway,",3,"c",{ego:1,disc:-1,cur:-1}],
    ["Mouths a prepared goodbye","Murmurs a prepared exit line to themselves before leaving.","<i>(under breath)</i> Lovely to see you, must dash.",1,"d",{vol:-1,asrt:-1}],
    ["Improvises nothing","Declines an unplanned question and offers to return with an answer.","I'll get back to you on that. Email works.",2,"u",{hon:1,asrt:1}],
    ["Toast delivered word for word every year","Gives the same speech at each yearly gathering.","Friends, family, and Uncle Roy. Thank you for coming.",2,"s",{vol:-1,cur:-1,rebel:-1}],
    ["Spontaneous scripts, always sounding rehearsed","Sounds like reading aloud even when winging it.","I would like to say a few words. Firstly. Secondly.",4,"c",{vol:1}]
  ]);

  block(CON, "Sensory Load", 190900, [
    ["Shuts their eyes to answer","Shuts their eyes while replying in a busy room.","<i>(eyes shut)</i> Yes. Give me a second. Yes.",2,"d",{vol:-1,pace:-1}],
    ["Lists what is bothering them, cheerily","Reads out each irritant in a bright voice.","Right, the light buzzes, the fan ticks, and someone's chewing. Lovely!",3,"u",{asrt:1,pos:1,hon:1}],
    ["Raises voice over the noise, then keeps it","Speaks over the din and keeps shouting after the music stops.","I SAID THE MUSIC'S OFF NOW! <i>(lowers it)</i> Sorry.",5,"c",{vol:1,disc:-1}],
    ["Stays near the exit while the room settles","Keeps close to the door and answers briefly until the noise drops.","I'm fine. I'll stay here for a bit.",1,"s",{vol:-1,asrt:-1,emo:-1}],
    ["Asks to turn something down","Politely requests lower sound or brightness every time.","Could we dim that a touch? Thanks, lovely.",2,"c",{asrt:1,man:1}],
    ["Goes out for air mid-sentence","Steps outside abruptly and returns calm.","<i>(already at the door)</i> Back in two minutes.",3,"u",{asrt:1,disc:-1}],
    ["Narrates every smell","Announces each smell in a room with great feeling.","Someone's frying onions. Somebody's wet dog. Oh, fresh bread!",3,"c",{emo:1,vol:1}],
    ["Talks softly so the room stays soft","Lowers their own voice in noisy places so the noise does not climb.","<i>(very quietly)</i> Shall we keep it down together?",1,"d",{vol:-1}]
  ]);

  block(CON, "Masking", 191000, [
    ["Bright voice that goes flat at the door","Chirpy in company, drained the second they are alone.","<i>(cheery)</i> Bye now! <i>(door shuts, voice drops)</i> Right.",3,"c",{mood:1,man:1,emo:-1}],
    ["Smiles through everything","Keeps one polite smile fixed through bad news.","<i>(smiling)</i> Oh, that's absolutely fine. No problem at all.",3,"c",{man:1,pos:1,asrt:-1,emo:-1}],
    ["Rehearses a laugh in the mirror","Practises reactions in private to use later.","<i>(quietly)</i> Ha. Ha-ha. No, softer.",1,"s",{vol:-1,man:1,emo:-1}],
    ["Mirrors the boss's phrases","Adopts whatever words the person in charge uses.","Yes, a real step change. Moving the needle, absolutely.",3,"c",{man:1,asrt:-1,rebel:-1}],
    ["Loud, performed confidence","Plays a big sure persona and doubles it when nervous.","I've GOT this! Absolutely got it! Nothing to worry about!",5,"c",{vol:1,man:1}],
    ["Takes a breath before each reply","Pauses to settle a face before answering.","<i>(small breath)</i> Of course. Happy to.",1,"d",{pace:-1,vol:-1,emo:-1}],
    ["Cracks one joke to cover a wobble","Slips in a quick joke when a feeling threatens to show.","<i>(voice catches)</i> Sorry, onions. In a church. Strange.",2,"u",{emo:1,mood:-1,man:1}],
    ["Agrees first, decides later","Says yes to keep the peace and quietly does otherwise.","Sounds great, count me in. <i>(does not come)</i>",3,"u",{man:1,asrt:-1,disc:-1,hon:-1}]
  ]);

  block(CON, "Literal Uptake", 191100, [
    ["Answers 'can you pass the salt' with yes","Replies to the form of the request, not its aim.","Yes, I can. <i>(does not move)</i>",2,"c",{pace:-1,asrt:1}],
    ["Counts the 'few' you said","Asks how many a vague amount really is.","You said a few minutes. Is that three, or five?",3,"u",{asrt:1}],
    ["Reads the sign as the rule","Obeys written instructions to the letter and cheerfully.","It says wet paint. I'm not touching the paint.",2,"c",{form:1,disc:1,rebel:-1}],
    ["Quietly takes metaphors literally","Pauses at a figure of speech and checks it with a murmur.","<i>(murmurs)</i> Raining cats and dogs. Hm. No cats.",1,"d",{vol:-1}],
    ["Loud literal reply that stops the room","Gives a booming literal answer to a rhetorical question.","DO I LOOK LIKE I'M MADE OF MONEY? Well, no. Not made of it.",5,"c",{vol:1,ego:1,asrt:1}],
    ["Takes invitations as obligations","Treats every 'drop by anytime' as a fixed arrangement.","You said anytime. I've come at nine. It is a Tuesday.",3,"u",{form:1,disc:1}],
    ["Asks what 'it' refers to","Stops to pin down a pronoun that others let drift.","When you say 'it', which of the three do you mean?",2,"s",{pace:-1}],
    ["Literal reading as a joke","Plays dumb on purpose for laughs.","'Take a seat.' Where to? It's a heavy chair.",3,"u",{mood:1,rebel:1}]
  ]);

  block(CON, "Info-Dumping", 191200, [
    ["Fact stampede on a casual question","One light question brings a flood of numbers.","You asked about bridges? Sit down. Twelve of them, built between 1840 and...",5,"c",{vol:1,pace:1}],
    ["Quiet footnote-whisperer","Murmurs a precise fact aside without expecting a reply.","<i>(murmurs)</i> Actually it's the eleventh. Never mind.",1,"d",{vol:-1}],
    ["Reads out the whole label","Recites every detail of a leaflet to the room.","Contains: oats, honey, trace of nuts, produced in a facility that also...",3,"c",{pace:1,form:1}],
    ["Draws a diagram on a napkin","Sketches an explanation unprompted, mid-meal.","<i>(sketching)</i> See, here's the river, here's the town, here's the flaw.",3,"u",{intel:1}],
    ["Dump delivered with flat patience","Explains in a slow even voice and refuses to be hurried.","<i>(calm)</i> I'll start from the beginning. There's quite a lot.",2,"u",{pace:-1,vol:-1,asrt:1}],
    ["Info as a gift for the sad","Offers a lovely fact to someone down.","Here's something good. Octopuses have three hearts.",2,"s",{emo:1,vol:-1}],
    ["Turns a story into a timeline","Replaces the point of a story with dates.","So in 1987, then March of '88, and the following autumn...",3,"c",{vol:1,intel:1}],
    ["Gasps and says 'one more thing' repeatedly","Cannot stop adding extras and flags each one.","One more thing! No, really, last thing! Actually two.",4,"u",{disc:-1,vol:1,mood:1}]
  ]);

  block(CON, "Turn-Timing", 191300, [
    ["Completes other people's sentences for them","Fills in the end of what others are saying, usually right.","You mean the— yes, the ferry. Exactly.",4,"c",{vol:1,pace:1,man:-1}],
    ["Talks right through the pause","Never lets a silence stand; fills every gap.","So. Anyway. Well. Weather! Isn't it? Anyway.",4,"c",{vol:1,pace:1,disc:-1,man:-1}],
    ["Answers a day later","Returns the next day with a considered reply.","About what you asked yesterday: yes.",1,"s",{pace:-1,vol:-1}],
    ["Counts to three before speaking","Leaves a deliberate gap after each remark.","<i>(silent, then)</i> I see. I think... no.",2,"d",{pace:-1,vol:-1}],
    ["Starts again after being cut off","Restarts the sentence from the top each time.","As I was saying— as I was saying— as I was saying,",3,"u",{asrt:1,ego:1}],
    ["Says 'go on' too often","Prompts the speaker so much that it takes over.","Go on. Go on. Yes. Go on.",3,"u",{pace:-1}],
    ["Speaks at the end of the table's silence","Waits for a lull to land one short line, then goes quiet.","<i>(finally)</i> Well, that was lovely.",2,"c",{pace:-1,vol:-1}],
    ["Talks over, then cheerfully apologises","Cuts in and laughs it off every time.","Sorry sorry sorry. Carry on! No, me. No, you!",3,"c",{vol:1,mood:1,man:-1}]
  ]);

  return out;
})();

TRAITS.push(...TRAITS_GROWTH_A);
