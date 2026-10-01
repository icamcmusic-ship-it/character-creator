/* ============================================================================
   TRAIT-BANK GROWTH B — 2026 audit §4a: every category up to a floor of about 15.
   Written as behaviours (what the speech or manner DOES), never as labels or
   diagnoses. Rarity and intensity are decoupled on purpose: quiet signatures and
   loud commons are written deliberately. reviewStatus "unreviewed".
   IDS: each category owns a block of 100 starting at 192000; APPEND ONLY.
   ========================================================================== */
const TRAITS_GROWTH_B = (function(){
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

  const BOD = "Body in Speech", DIA = "Dialect & Linguistic Background";

  block(BOD, "Breath & Stamina", 192000, [
    ["Takes the stairs slowly and keeps talking","Climbs at a measured pace and carries on the conversation in shorter sentences until the top.","Keep going, I'm listening. <i>(a step, a word, a step)</i> I'll finish at the landing.",2,"c",{pace:-1,act:-1}],
    ["Plans the long sentence around the breath","Shapes every sentence to end where a breath naturally falls, so speech has a deliberate cadence.","I'll tell you the whole story. <i>(pause)</i> It begins in March. <i>(pause)</i> Sit down.",1,"s",{pace:-1}],
    ["Hands the talking over to recover","Asks a question to buy a few quiet breaths and lets the other person carry the next stretch.","And what did you make of it? Go on, I want the whole thing.",1,"d",{man:1,pace:-1}],
    ["Booming, tireless, still going at midnight","Talks at full volume with energy that never visibly dips, and expects the room to match it.","Another round! Another story! I could do this till the sun comes up!",5,"c",{vol:1,mood:1}],
    ["Runs out of air on the punchline","Builds toward the joke at speed and delivers the end of it in a gasp, which makes it funnier.","So he turns round and says, he says, <i>(gasping)</i> 'that's not my goat'.",3,"u",{pace:1,mood:1}],
    ["Insists on walking meetings, talking all the way","Keeps moving and talking, treats sitting still as wasted time, and drags others along.","Walk with me! Best ideas happen on the move. Keep up!",4,"c",{asrt:1,vol:1}],
    ["Saves the voice for the important bit","Speaks in a low murmur through the day and spends the full voice only when it counts.","<i>(murmuring through the briefing, then, clear as a bell:)</i> No. That one I'll argue.",2,"d",{vol:-1}],
    ["Sighs a sentence before starting it","Opens with a long out-breath that doubles as a warning that something heavy is coming.","<i>(a long breath out)</i> Right. Let me explain what happened.",2,"u",{emo:1,pace:-1}],
    ["Counts the flights before agreeing","Quietly asks how far, how many steps, how long standing, and decides on the answer.","How far is it from the car? And is there a bench halfway?",1,"d",{disc:1,hon:1,act:-1}],
  ]);

  block(BOD, "Medication & Management", 192100, [
    ["Sets a phone alarm in the middle of a sentence","Lets the reminder go off, silences it with one thumb, and picks the sentence up exactly where it was.","<i>(chime)</i> One sec. <i>(tap)</i> As I was saying, the budget doesn't balance.",2,"c",{disc:1}],
    ["Answers 'how are you' with the routine, not the feeling","Replies with the logistics of the day instead of a mood, flatly and factually.","Steady. Same as Tuesday. Slept eight, ate on time, no surprises.",1,"d",{disc:1,emo:-1,warm:-1}],
    ["Loudly cheerful about the whole regimen","Narrates the routine with a bright, public, cheerful bluntness that makes others relax.","Pill time! Don't mind me. Gold star for the Thursday one, folks!",4,"c",{vol:1,mood:1}],
    ["Tests the new routine out loud","Reports on how a change is going in a detached, curious way, like a field notes entry.","Day six of the new schedule. Mornings are clearer. Afternoons, TBC.",2,"u",{intel:1,emo:-1}],
    ["Won't discuss it, changes the subject kindly","Closes the topic with a smile and a question about the other person, every time.","Oh, that's dull. Tell me about your week instead.",2,"d",{man:1,disc:1,hon:-1}],
    ["Advises strangers, uninvited","Hears someone's passing complaint and presses on them a whole system of timing and routines.","Take it with food. Same time every day. Trust me, I've done the homework.",4,"c",{asrt:1,vol:1,man:-1}],
    ["Forgets, laughs, doesn't fuss","Misses a dose, shrugs it off with a joke and carries on without any ceremony.","Ah, I'll catch up tonight. The world won't end. Pass the salt.",3,"u",{disc:-1,mood:1,rebel:1}],
    ["Keeps a private note, never shares","Writes everything down in a tiny notebook, and gives it only to those who ask the right way.","<i>(a small notebook, closed quickly)</i> It's just lists. Nothing to see.",1,"s",{disc:1,man:1}],
    ["Gets prickly when someone checks up","Bristles at 'have you taken it?' even from someone who means well.","I'm a grown adult. I know what day it is. Thank you.",4,"c",{agr:1,asrt:1,warm:-1,man:-1}],
    ["Thanks the person who noticed, once, plainly","Offers a short, dignified thank-you to the person who quietly helped, and never repeats it.","<i>(low)</i> That was kind. Thank you. Let's leave it there.",1,"s",{form:1}],
  ]);

  block(BOD, "Stammer & Speech Blocks", 192200, [
    ["Lets the silence stand and holds the gaze","Doesn't fill the gap or look away during a pause, and trusts the listener to wait.","<i>(a long pause, steady eyes)</i> ...Tomorrow. I'll do it tomorrow.",1,"s",{pace:-1,vol:-1}],
    ["Writes it down instead","Takes a pen or a phone to give the hard word, quickly and without drama.","<i>(types, turns the screen)</i> Table for two, near the window.",1,"d",{disc:1}],
    ["Loud and fast to beat the block","Barrels through sentences at speed and volume, treats the pause as the enemy.","Right-so-here's-the-thing-let-me-just-say-it-all-at-once!",4,"c",{vol:1,pace:1,asrt:1}],
    ["Jokes about it first","Gets in a gentle self-aware line before anyone can wonder, and makes the room easy.","Bear with me. The words are in the queue. It's a long queue.",3,"c",{mood:1,ego:1}],
    ["Chooses the grander word to dodge the plainer one","Reaches for a long word that flows over the short one that sticks, and sounds grand by accident.","I'd characterise it as, ah, a considerable inconvenience.",2,"u",{form:1}],
    ["Reads the room before opening","Stays quiet until a safe-feeling moment arrives, then speaks once, completely.","<i>(waits through three topics)</i> Can I add something? It's short.",1,"d",{vol:-1,asrt:-1}],
    ["Hums the opening beat","Starts a sentence with a soft hum or a tap of the foot that carries them into the first word.","Mm-mm-<i>(tap)</i> morning, everyone.",2,"u",{ego:-1}],
    ["Finishes other people's sentences by accident","Gets so tuned to the rhythm of talk that they fill the blank for the speaker.","...and then the train was— cancelled, yes!",3,"u",{pace:1,disc:-1}],
  ]);

  block(BOD, "Hearing & Sight", 192300, [
    ["Turns the good ear to the speaker, mid-sentence","Reorients with a small tilt of the head without breaking the conversation.","<i>(tilts, smiles)</i> Go on, I've got you now.",1,"c",{disc:1}],
    ["Asks the whole room to speak up, brightly","Calls out cheerfully for everyone to speak clearly and one at a time, and takes charge of the chat.","One at a time, my darlings! I'm not a switchboard!",4,"c",{vol:1,asrt:1}],
    ["Reads the face to hear the sentence","Watches the speaker's eyes and mouth closely, so everything gets a double attention that others find flattering.","<i>(leaning in, steady attention)</i> Say that again? I want to get every word.",1,"d",{vol:-1}],
    ["Asks for the menu to be read out, warmly","Turns reading tasks into a social moment with an easy 'you read, I'll choose'.","You read, I'll choose. What's the fish today?",2,"u",{asrt:1}],
    ["Answers a different question, then laughs","Mishears and replies to something else entirely, then finds it funnier than anyone.","Lunch? No, I said the <i>launch</i>. Well, now I'm hungry!",3,"c",{mood:1,vol:1}],
    ["Goes by sound and rhythm of footsteps","Greets people by step or voice before they speak, with a small private satisfaction.","That's you, Margit. You walk like you're late.",2,"s",{intel:-1}],
    ["Won't ask twice, goes quiet","Misses it, decides not to bother anyone, and drifts out of the conversation.","<i>(nods, smiles, stops joining in)</i>",2,"u",{asrt:-1,vol:-1,ego:-1}],
  ]);

  block(BOD, "Pain & Fatigue", 192400, [
    ["Starts every plan with the energy budget","Sizes up what the day can hold before saying yes, and names the limit in advance.","I've got two good hours in me. Pick the best two.",2,"u",{disc:1,hon:1,act:-1}],
    ["Gallantly hosts through the haze","Stays the warm centre of the party in spite of the day, and pays for it quietly later.","Sit, sit! More tea! <i>(a hand on the back of the chair)</i>",3,"c",{mood:1,ego:-1}],
    ["Says 'I'm fine' with a long vowel","Draws the word out with a particular flat note that those who know them hear immediately.","I'm fiiine. Honestly. Carry on.",2,"c",{man:1,hon:-1}],
    ["Swears about it with great invention","Meets the bad day with loud, creative, cheerful cursing, and the room laughs with them.","Today's pain is a right bastard, but I've named it Gerald.",4,"c",{vol:1,mood:1,disc:-1,man:-1,form:-1}],
    ["Goes very quiet and precise when it peaks","Cuts speech down to the plainest necessary words, calm and exact, and expects the same back.","Water. Dark room. Thirty minutes.",1,"s",{vol:-1,warm:-1}],
    ["Plans the exit, tells nobody","Decides quietly how and when to leave, and makes a graceful, unremarkable departure.","<i>(a glance at the door, a coat over the arm)</i> Lovely evening. I'll say goodnight.",1,"d",{disc:1,man:1,hon:-1}],
  ]);

  block(DIA, "Youth Register", 192500, [
    ["Says 'literally' about everything","Uses 'literally' as general emphasis, regardless of how literal anything is.","I literally died. She literally ate a whole cake. It's literally fine.",4,"c",{vol:1,pace:1,form:-1}],
    ["Ends statements with a rising 'right?'","Seeks confirmation after every claim in a way that sounds friendly rather than unsure.","So we get there at six, right? And then we, like, head in, right?",3,"c",{asrt:-1}],
    ["Typed laughter spoken aloud","Says 'haha' and 'lol' in actual speech as a flat punctuation mark.","That's so funny. Haha. No, really.",2,"u",{form:-1,mood:1}],
    ["Quiet, precise, old for their age","Speaks slowly and carefully with a formal sentence structure, in a room full of fast slang.","I would prefer not to. But thank you for asking.",1,"s",{pace:-1,vol:-1}],
    ["Nicknames everyone within a day","Hands out short affectionate names to new acquaintances before learning their surnames.","Okay, Benny-boy, you're on snacks. Jo-Jo, you've got the music.",4,"c",{vol:1,form:-1}],
    ["Describes feelings in screen-and-score terms","Rates moods and days in numbers or memes, matter-of-factly.","Today's a four out of ten. Maybe a five if lunch happens.",2,"c",{emo:-1,mood:-1}],
    ["Soft-pedals every opinion with 'kinda'","Wraps every view in 'kinda' and 'sorta' so it can't be argued with.","It's kinda not great? Like, sorta mid, maybe?",2,"c",{asrt:-1,form:-1}],
    ["Doesn't use slang, and says it's a choice","Speaks plain, complete sentences on purpose, and treats it as a tiny rebellion.","I say 'very good' and I mean it. You can keep your 'vibes'.",2,"d",{rebel:1,hon:1,cur:-1}],
  ]);

  block(DIA, "Era References", 192600, [
    ["Hums the theme tunes of programmes nobody remembers","Breaks into old jingles and signature tunes as punctuation, then explains none of it.","<i>(humming the theme, quietly delighted)</i> You had to be there.",2,"d",{mood:1,cur:-1}],
    ["Everything was better, said with a grin","Declares the old days superior in a loud, theatrical, self-aware way that invites teasing.","In my day the summers were longer and the biscuits were bigger!",4,"c",{vol:1,mood:1,ego:1,cur:-1}],
    ["Quotes the old-time ads","Delivers decades-old slogans word-perfect when the situation fits.","Well, you know what they say: it does exactly what it says on the tin.",3,"c",{mood:1,form:-1}],
    ["Measures distance in old landmarks","Gives directions in terms of buildings that have long gone.","Turn left where the old cinema was. You'll feel it in the road.",2,"u",{pace:-1,hon:1,cur:-1}],
    ["Gentle about the past, never preachy","Remembers a time with a soft word and a small smile, and never compares.","That was the summer of the long heat. Lovely it was.",1,"s",{emo:1,vol:-1}],
    ["Asks the young what's happening now, and means it","Keeps up with the present by asking real questions about it, and listens.","Explain the new thing to me. Slowly. I want to understand it.",2,"d",{cur:1}],
    ["Dates people by their year of leaving school","Places everyone by cohort, and judges a person's taste accordingly.","Class of '94? Then you'll know the song.",3,"u",{asrt:1,warm:-1}],
    ["Insists on the old name for the street","Refuses the modern name of a road, a shop or a station, and corrects others.","It's not the Lighthouse Quarter. It's the fish market. Always was.",3,"c",{rebel:1,asrt:1,agr:1,cur:-1}],
  ]);

  block(DIA, "Tech Vintage", 192700, [
    ["Shouts at the screen like a person","Addresses every device out loud as a stubborn colleague, loudly and with feeling.","Come on, you useless thing! I pressed it! I pressed it twice!",4,"c",{vol:1,agr:1,mood:-1,man:-1,form:-1}],
    ["Prints it out to read it properly","Needs paper in hand before they can take a document seriously.","Send it, then I'll print it, then I'll read it. Properly.",2,"c",{disc:1,cur:-1}],
    ["Says 'the internet' for everything","Uses one catch-all word for apps, websites, and the cloud, and means all of them.","It's on the internet somewhere. My niece can find it.",2,"c",{cur:-1}],
    ["Quietly and expertly retro","Uses a decades-old setup with full mastery, and wins without comment.","<i>(a few keystrokes, no mouse)</i> There. Done. Faster than yours.",1,"s",{vol:-1}],
    ["Delighted by every new gadget","Greets each update with loud, unfiltered excitement, and tells everyone.","Look at this! It talks back! It knows my name!",5,"c",{vol:1,mood:1}],
    ["Ends calls with 'over and out' or similar","Keeps the ritual endings of older communication in modern calls.","Right then. Over and out. Mind how you go.",2,"u",{mood:1}],
    ["Leaves voicemails like speeches","Delivers long, well-structured messages to a machine, with greeting, content and sign-off.","Good afternoon, this is Aldous. The reason for my call is threefold. First...",3,"u",{form:1,pace:-1}],
    ["Reads out the instructions before touching anything","Starts at the manual's first page and refuses to skip.","Step one. Remove the cover. Everyone wait. Step two...",2,"d",{disc:1,cur:-1}],
  ]);

  block(DIA, "Dated Slang", 192800, [
    ["Lets the old word slip out and laughs at it","Says something unfashionable and cheerfully owns it before anyone can tease.","That was ace. Yes, I said ace. I'm bringing it back.",3,"c",{mood:1,ego:-1}],
    ["Greets everyone with an old-fashioned flourish","Opens with a phrase from another era, boldly, and enjoys the room's reaction.","Hello, hello, hello! What's the good word?",4,"c",{vol:1,mood:1}],
    ["Uses an old word with perfect, unironic calm","Drops a period word in an ordinary sentence with no wink at all.","That's a swell idea. Shall we?",1,"s",{vol:-1}],
    ["Calls money and food by old nicknames","Uses the earlier slang for cash, snacks and drinks, as if it were current.","Got any dosh? I'll stand you a cuppa.",2,"c",{form:-1}],
    ["Spoofs the slang, then forgets it's a spoof","Starts as a joke and ends up using the phrases for real.","<i>(mock-posh)</i> Spiffing. Utterly spiffing. No, truly — it is.",2,"u",{mood:1}],
    ["Rating words from forty years back","Grades everything with scales and words that nobody recognises, and expects them to be understood.","That's a solid six on the bonzer scale.",3,"d",{ego:1,cur:-1}],
    ["Exclaims in rhyming old sayings","Answers surprises with set rhymes passed down in the family.","Well, butter my biscuit and call me Sunday!",3,"u",{vol:1,mood:1,form:-1}],
  ]);

  block(DIA, "Heritage Vocabulary", 192900, [
    ["Heritage language kept for tenderness only","Speaks the family language only for love, grief and comfort, and English for everything else.","<i>(softly, in the old language, a hand on a shoulder)</i> It's all right. It's all right now.",2,"s",{emo:1,vol:-1}],
    ["Corrects a parent's English, gently and often","Quietly fixes a parent's phrasing in public, loving and slightly mortified in the same breath.","Mum, it's 'appointment', not 'a point mint'. Yes. Good. Perfect.",3,"c",{asrt:1}],
    ["Says 'back home' as a full sentence","Uses 'back home' as a complete argument, a place that holds every standard.","Back home, we'd never. Back home, you'd be ashamed.",3,"c",{asrt:1,pos:1,cur:-1,warm:-1}],
    ["Back-home weather and food, in loving detail","Describes the old home's seasons and dishes in rich vivid terms, to nobody in particular.","In the monsoon months the whole street smelled of this fruit. You can't buy it here.",2,"u",{emo:1,pace:-1}],
    ["Translates for the family, and editorialises","Interprets for relatives, softening and sharpening lines as seems best.","She says it's lovely. <i>(She said it was too expensive.)</i>",3,"d",{man:1,hon:-1}],
    ["Mourns the accent they lost, quietly","Mentions in passing that their old way of speaking has faded, then moves on.","I used to roll that sound. Now it won't come.",1,"d",{emo:1,vol:-1}],
  ]);

  block(DIA, "Class Register Shift", 193000, [
    ["Straightens up for anyone in authority","Moves to complete sentences, polite vocabulary and formal address, the moment an official arrives.","Good morning, officer. Of course. I'd be happy to help.",3,"c",{agr:-1,man:1,asrt:-1}],
    ["Climbs the register one rung per promotion","Picks up the new language of each rank deliberately, and drops the last one entirely.","We should circle back and align on deliverables.",3,"u",{man:1}],
    ["Mocks the old self when with new friends","Imitates the old neighbourhood voice as a joke, and half hopes no-one from there hears.","<i>(thick, comic accent)</i> 'Ey up! That's how we talked, you know.",3,"u",{hon:-1,mood:1}],
    ["Slips back into the old voice, to loud cheers","Returns to the home voice in an instant at any family event and rejoices in it.","<i>(arms wide, big voice)</i> Right then, who's put the kettle on?!",4,"c",{vol:1,mood:1,form:-1}],
    ["Never once lets the polish slip","Maintains the careful register even at the worst moments, so the effort shows in what's left out.","I find that rather disappointing, if you don't mind my saying.",1,"s",{vol:-1,warm:-1,emo:-1}],
    ["Reads the room's rank in two words","Adjusts register after listening to the first sentences, and never gets it wrong.","<i>(a nod, a half-step, a subtle shift in vocabulary)</i>",2,"d",{man:1}],
  ]);

  block(DIA, "Regional Features", 193100, [
    ["Home vowels return when tired or angry","The smoothed-over accent slides back, unannounced, at the end of a long day or in a flash of temper.","<i>(at midnight, the long familiar vowels back)</i> I said no. I'm done.",2,"s",{mood:-1,emo:1}],
    ["Broadcasts the local dialect proudly","Leans into the home speech more, not less, in front of outsiders, and enjoys the puzzlement.","Ye'll not get that where you're from, will ye? Say it again!",5,"c",{vol:1,ego:1,rebel:1}],
    ["Local terms of address for strangers","Greets everyone with the regional word for friend, pal or love, quite freely.","Morning, my lover! What can I get you?",3,"c",{form:-1}],
    ["Only the rhythm survives","Has lost the words but keeps the home tune of the sentence, noticeable to those who share it.","<i>(plain words, a lilt from somewhere else)</i> That'd be lovely, so it would.",1,"d",{emo:1,vol:-1}],
    ["Regional counting and time words","Tells the hour or the quantity in local fashion and doesn't translate unless asked.","Half four-ish. Or thereabouts. Give or take a bit.",2,"u",{form:-1,pace:-1}],
  ]);

  block(DIA, "Code-Switching", 193200, [
    ["Upward-mobility voice at work, home voice at supper","Keeps two sets of manners and vocabularies, and moves between them without a pause.","<i>(polished at nine, a different laugh at seven)</i>",3,"c",{man:1}],
    ["Gets loud and jokey in the shared language","Becomes visibly bigger, louder and funnier whenever another speaker of the home language appears.","<i>(a whoop, a hand slap, a flood of the old language)</i> Cousin! Look at you!",4,"c",{vol:1,mood:1,form:-1}],
    ["Switches to authority register, drily and with relish","Shifts into the stiff language of officials to settle an argument, and clearly enjoys the effect.","I'd refer you to section four, paragraph two. It's quite clear.",3,"u",{asrt:1,agr:1,warm:-1}],
    ["Barely perceptible switch, perfect and quiet","Moves between registers so smoothly that only a close listener catches it.","<i>(a half tone lower, one word different, no pause)</i>",1,"s",{vol:-1,man:1}],
  ]);

  return out;
})();

TRAITS.push(...TRAITS_GROWTH_B);
