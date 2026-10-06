/* ============================================================================
   CONFLICT STYLE — 2026 audit §6b: how a person fights, in the speech they use.
   Written as behaviours (what the speech or manner DOES), never as labels or
   diagnoses. reviewStatus "unreviewed". IDS: blocks of 100 starting at 200000; APPEND ONLY.
   ========================================================================== */
const TRAITS_CONFLICT = (function(){
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
        rarity: R[rk], pol: Object.assign({}, pol || {}), conceptFamily: "conflict-" + slug(trait), reviewStatus: "unreviewed"
      }, extra || {}));
    });
  }

  const SEC = "Conflict Style";
  block(SEC, "Stonewalling & Withdrawal", 200000, [
    ["Answers in single words once it heats up","Clips every reply to one word the moment the argument turns personal.","Yes. No. Fine. Maybe.",4,"c",{warm:-1,asrt:-1,vol:-1}],
    ["Announces 'I'm done talking'","Declares the conversation over and treats the declaration as final.","I'm done talking. We're done talking.",5,"c",{warm:-1,agr:-1,asrt:1}],
    ["Leaves the room mid-sentence","Gets up and walks out while the other person is still speaking.","(picks up keys, mid-your-sentence) I'm going out.",5,"c",{warm:-1,agr:-1,emo:-1}],
    ["Goes quiet and studies the table","Stops answering and fixes attention on an object instead of the person.","(turning the salt cellar a quarter-turn, saying nothing)",3,"c",{vol:-1,emo:-1,asrt:-1}],
    ["Says 'I can't do this right now'","Names the shutdown out loud as a limit and exits on it.","I can't do this right now. I really can't.",3,"c",{asrt:-1,emo:-1}],
    ["Retreats behind the closed door","Shuts a door, quietly, and the conversation with it.","(the click of the bedroom door, gentle as a full stop)",3,"c",{vol:-1,warm:-1,man:-1}],
    ["Turns to the task at hand","Picks up work, a phone or a chore and keeps at it as the only reply.","(wiping the same counter for the fourth time) Mm.",3,"u",{warm:-1,emo:-1}],
    ["Goes flat-voiced and level","Drains all tone from the voice so nothing can be pinned on it.","Understood. Noted. Anything else.",2,"u",{emo:-1,vol:-1,warm:-1}],
    ["Says 'we'll talk tomorrow' and doesn't","Defers the talk to a vague later that never arrives.","We'll talk about it tomorrow. (tomorrow: a new topic, a smile, nothing)",2,"u",{asrt:-1,man:-1}],
    ["Pauses for a long breath, then nothing","Takes an audible breath as if to speak, then lets it out unused.","(a breath in, a breath out, a shrug)",1,"s",{emo:-1,vol:-1,asrt:-1}],
    ["Gives the same phrase to every accusation","Answers whatever is said with one bland repeated line.","If you say so. (and, ten minutes later, to a different charge) If you say so.",2,"d",{warm:-1,emo:-1}],
    ["Takes the dog out and stays out","Uses an errand with an end time to exit, then extends it.","(lead in hand) He needs a walk. (forty minutes; the dog's exhausted)",3,"u",{warm:-1,asrt:-1}],
    ["Listens without a flicker, then nods once","Takes the whole complaint in motionless and offers a single nod and no content.","(a single slow nod; the eyes never change)",1,"d",{emo:-1,vol:-1,pace:-1}],
    ["Replies by text from the next room","Moves the argument to messages so no face has to answer.","(from the bedroom, a text:) Can we not do this.",2,"d",{asrt:-1,warm:-1}]
  ]);

  block(SEC, "Passive-Aggressive", 200100, [
    ["Says 'fine.' with a full stop","Delivers 'fine' so flat and final that it means the opposite.","Fine. (and then nothing, for an hour)",4,"c",{agr:-1,asrt:-1,warm:-1}],
    ["'No, it's fine, really'","Insists there's no problem in a tone that lists the problems.","No, it's fine, really. Don't worry about me. I'll manage.",5,"c",{agr:-1,hon:-1,man:1}],
    ["Helpful-sounding digs","Offers help that points out the other's failing.","Would it help if I wrote it down for you this time?",4,"c",{agr:-1,warm:-1,man:1}],
    ["Compliments with a sting","Praises, then attaches a small barb to the end of it.","That's a lovely idea. I'm surprised you thought of it.",4,"c",{agr:-1,warm:-1,man:1}],
    ["Sweet barbs in a bright voice","Says the cutting thing in a cheerful, singing tone.","Oh, you're here! We'd given up on you, ages ago.",4,"c",{agr:-1,warm:-1,pos:1}],
    ["'I'm not upset' while upsetting","Denies being upset while slamming things gently down.","I'm not upset. (sets the cup down a bit too precisely) Why would I be?",5,"c",{hon:-1,agr:-1,emo:-1}],
    ["Doing it 'just as you asked'","Complies with the letter of the request so its flaws show.","I did exactly what you said. Every single step. Exactly.",3,"u",{agr:-1,man:1,hon:-1}],
    ["Thanks with a trailing 'finally'","Slips a sharp small word into gratitude.","Thank you so much for the reply. Honestly, it's nice to hear anything.",3,"u",{agr:-1,warm:-1}],
    ["Says 'if that's what you want'","Concedes in a tone that makes the concession a debt.","If that's what you want. Of course. It's your decision.",3,"u",{asrt:-1,man:1}],
    ["Replies 'noted' to everything","Treats a request as a filed complaint against the asker.","Noted. (a smile you could hang a coat on)",2,"d",{warm:-1,agr:-1,emo:-1}],
    ["Sighs as the whole answer","Lets a small, perfectly timed sigh carry the grievance.","(a sigh, light as a page turning) No, no. Go ahead.",1,"s",{vol:-1,agr:-1,asrt:-1}],
    ["Leaves the last word 'bless you'","Ends with a warm-sounding phrase used as a closing blow.","Well. Bless you for trying.",2,"d",{warm:-1,agr:-1,man:1}],
    ["Forgets the one thing they promised","Lets a small task lapse right after a disagreement, with wide eyes.","Oh! Was that today? I'm so sorry. It slipped my mind completely.",3,"u",{hon:-1,man:1,agr:-1}],
    ["Agrees too brightly to be believed","Says 'sure, great idea' with an enthusiasm that is plainly a verdict.","Oh, wonderful. Brilliant. Love it. Can't wait.",2,"d",{hon:-1,agr:-1,pos:1}]
  ]);

  block(SEC, "Litigator", 200200, [
    ["Opens with 'for the record'","Starts each rebuttal by placing the point on an imaginary record.","For the record, I said Thursday. Not Friday. Thursday.",4,"c",{ego:1,asrt:1,disc:1}],
    ["Cites the date of every offence","Pins each grievance to a precise date and time.","The fourteenth of March, at about quarter to nine. You said it in the kitchen.",4,"c",{ego:1,pace:-1}],
    ["Quotes the message back word for word","Reads out an earlier text verbatim to win the point.","Here, it's right here: 'I'll be there by seven.' Seven. Your words.",5,"c",{hon:1,agr:-1,asrt:1}],
    ["Demands the burden of proof","Refuses a claim until the other person produces evidence.","You said it, so you show me. Where's the proof?",4,"c",{agr:-1,ego:1}],
    ["Says 'that's not what I said'","Corrects every paraphrase of their own words with surgical firmness.","That is not what I said. What I said was 'maybe', and 'maybe' isn't 'yes'.",5,"c",{agr:-1,asrt:1}],
    ["Numbers the points aloud","Breaks the case into numbered counts and delivers them in order.","One, you were late. Two, you didn't call. Three, you blamed the bus.",3,"u",{pace:-1,ego:1}],
    ["Keeps the screenshots","Mentions that the exchange is saved somewhere, calmly, as an aside.","Don't worry, I kept it. I keep everything.",2,"d",{ego:1,hon:1,warm:-1}],
    ["Asks for a precise definition","Stalls the quarrel with a question about what a word meant.","Define 'soon'. When you said 'soon', how many days?",3,"u",{agr:-1,pace:-1}],
    ["Reads back what the other agreed","Recites the other's earlier concession as a settled fact.","You agreed on the phone, in July. You said, 'sounds fine'.",3,"u",{agr:-1,man:1}],
    ["Concedes a point to make the next one stick","Gives up a small count aloud in order to bank a bigger one.","Granted, I was five minutes late. Now: the other forty minutes of the evening.",3,"d",{man:1,intel:1}],
    ["Murmurs 'noted for the record'","Quietly states that something has been taken down, unprompted.","(softly, to no one) Noted.",1,"s",{vol:-1,ego:1}],
    ["Cross-examines with yes-or-no","Demands a one-word answer to a loaded question and won't take more.","Yes or no. Did you or did you not take the car?",4,"u",{agr:-1,asrt:1,warm:-1}],
    ["Remembers the other person's exact wording from years back","Brings out a sentence the other said long ago, perfectly preserved, unrelated to now.","In 2019 you told me, and I quote, 'it's only a cup'.",2,"d",{ego:1,warm:-1}],
    ["Refuses to raise their voice","Stays level and exact, so the lack of heat does the damage.","I'm not shouting. I'm simply establishing the sequence of events.",2,"u",{vol:-1,emo:-1,asrt:1}]
  ]);

  block(SEC, "Peacekeeper & Smoother", 200300, [
    ["'Let's all calm down'","Calls for calm to everyone, whether or not they were heated.","Okay, okay. Let's all just calm down. Deep breath, everyone.",5,"c",{agr:1,asrt:-1,vol:-1}],
    ["Changes the subject brightly","Swings the talk to food, weather or plans as soon as voices rise.","Anyway! Has anyone tried that new place on the corner?",4,"c",{agr:1,man:-1,asrt:-1}],
    ["Splits the difference","Proposes meeting halfway before anyone has finished their case.","How about you each give a bit? Half and half. Fair?",4,"c",{agr:1,asrt:-1}],
    ["Takes the blame to end it","Says it was their fault, whether or not it was, so everyone can stop.","It's my fault, honestly. I should've said. Sorry, can we leave it?",5,"c",{agr:1,hon:-1,asrt:-1,ego:-1}],
    ["'I'm sure they didn't mean it'","Explains the opponent away on their behalf.","I'm sure she didn't mean it like that. She's just tired.",4,"c",{agr:1,warm:1,asrt:-1}],
    ["Jokes the tension out","Lets a small, self-deprecating joke carry the room away from the fight.","Well, I'm clearly the idiot here. Biscuit, anyone?",3,"u",{agr:1,ego:-1,mood:1}],
    ["Offers tea before anything is settled","Makes a drink or fetches a plate to stand in for the conversation.","(already filling the kettle) Right, who's having a cup?",3,"u",{asrt:-1,agr:1,man:-1}],
    ["Shuttles between the two sides","Moves from one to the other, murmuring each side's case in softer words.","(to him, low:) She's hurt, that's all. (to her, low:) He doesn't mean it.",3,"u",{agr:1,man:-1}],
    ["Says 'you're both right'","Declares both positions valid and leaves the decision undone.","You're both right, honestly. You are. It's just a misunderstanding.",3,"c",{asrt:-1,agr:1}],
    ["Lowers their own voice as others rise","Goes softer and slower as the room gets louder.","(quietly, almost a murmur) Shall we sit down?",2,"d",{vol:-1,pace:-1,agr:1}],
    ["Touches an elbow, says nothing","Rests a hand on an arm and lets the contact do the calming.","(a hand on his sleeve, a small shake of the head)",1,"s",{agr:1,vol:-1,warm:1,emo:-1}],
    ["Gives away the point to keep the dinner","Concedes something they cared about because the evening matters more.","Fine, we'll do it your way. It's not worth the evening.",2,"d",{ego:-1,agr:1,asrt:-1}],
    ["Reminds everyone of the good times","Offers a shared happy memory as an antidote to the row.","Remember when we got lost on that coast road? We laughed for hours.",3,"u",{pos:1,agr:1,mood:1}],
    ["Apologises on behalf of the room","Says sorry for a quarrel they had no part in.","I'm so sorry about all this. They're not usually like this.",2,"d",{agr:1,asrt:-1,ego:-1}]
  ]);

  block(SEC, "Escalate then Apologise", 200400, [
    ["Explodes within a minute","Goes from calm to raised voice in a single exchange.","That is the LAST time you say that to me! The last time!",5,"c",{vol:1,pace:1,emo:1,agr:-1}],
    ["Slams the door, then comes back","Storms out hard, then returns minutes later, sheepish.","(door bangs; ten minutes later, the door, softly) Can I come in?",5,"c",{vol:1,emo:1,asrt:1}],
    ["Apologises as big as the outburst","Delivers an apology on the same scale as the row.","I am so, so sorry. I was awful. You didn't deserve a single word of it.",5,"c",{emo:1,ego:-1}],
    ["Brings a gift the next morning","Appears with flowers, pastries or a small present as the opening line.","(a bag of warm pastries held out) Before you say anything.",4,"c",{warm:1,emo:1,man:1}],
    ["Says 'I don't know what came over me'","Treats the outburst as something that happened to them.","I don't know what came over me. That wasn't me at all.",4,"c",{emo:1,hon:-1,ego:-1}],
    ["Over-corrects with tenderness","Turns suddenly doting, with too much attention and too many questions.","Are you warm enough? Have you eaten? Let me make you something.",4,"c",{warm:1,emo:1,man:1}],
    ["Apologises in the middle of the shouting","Breaks off the tirade to say sorry, then resumes it.","And another thing — sorry, sorry — and ANOTHER thing!",3,"u",{vol:1,pace:1,emo:1}],
    ["Writes a long apology message","Sends a late-night essay of regret and promises.","(a message with four paragraphs, an ending of 'I love you' and no full stops)",3,"u",{emo:1,pace:1}],
    ["Cooks a whole meal as sorry","Spends the next day making an elaborate dinner as a wordless apology.","(three pans on the stove, a sheepish glance) It's your favourite. Obviously.",3,"u",{warm:1,emo:1}],
    ["Apologises and asks if they're forgiven, repeatedly","Needs to hear the forgiveness said aloud, more than once.","So we're okay? We're okay? You're sure? Say it again.",3,"d",{emo:1,ego:-1}],
    ["Quiet, flat 'sorry' after the storm","Offers a small, almost inaudible apology that undersells the shouting.","(a mumble into the cup) Sorry about earlier.",1,"s",{vol:-1,emo:-1,ego:-1}],
    ["Blames the shouting on the day","Names a cause outside the argument and begs to be let off.","Work's been murder. I took it out on you. That's on me.",2,"d",{hon:-1,ego:-1}],
    ["Leaves a note on the pillow","Leaves a handwritten apology where it will be found first.","(a folded note: 'I'm an idiot. Coffee's on.')",2,"d",{emo:1,asrt:-1}],
    ["Re-erupts when the apology isn't accepted","Flares again if forgiveness doesn't come at once.","I SAID I was sorry! What more do you want from me?",5,"u",{vol:1,emo:1,agr:-1}]
  ]);

  block(SEC, "Sulker & Silent Treatment", 200500, [
    ["Answers only what's asked","Gives bare factual replies and volunteers nothing.","Yes. At six. It's in the oven.",4,"c",{warm:-1,asrt:-1,man:1}],
    ["Says 'nothing' when asked what's wrong","Denies anything is wrong in a tone that insists otherwise.","Nothing. I'm fine. Nothing's wrong.",5,"c",{hon:-1,warm:-1,emo:-1}],
    ["Makes cups for themselves only","Leaves the other out of small shared courtesies, visibly.","(makes one coffee, drinks it at the counter)",4,"c",{warm:-1,man:1,agr:-1}],
    ["Sighs loudly and walks about","Fills the space with noise that has no words in it.","(a great sigh from the hallway, then another, nearer)",4,"c",{warm:-1,vol:1,man:1}],
    ["Won't be drawn on it","Meets every question with a lowered gaze and a shrug.","Don't ask me. Ask yourself.",4,"c",{warm:-1,asrt:-1,emo:-1}],
    ["Talks to the dog instead","Directs all the warmth at a pet in earshot.","(to the dog, sweetly) At least somebody in this house is pleasant.",3,"u",{warm:-1,man:1,agr:-1}],
    ["Speaks only in third person","Addresses the other through a passing remark about 'some people'.","Some people never think about anyone else, do they?",3,"u",{warm:-1,man:1,asrt:-1}],
    ["Leaves the light on to be asked","Sets up a small visible hardship so a question will follow.","(takes the long way round, wincing at the stairs)",2,"u",{asrt:-1,man:1}],
    ["Stops the usual good-night","Withholds the small daily rituals, noticeably.","(turns over without the usual goodnight; the pause is the sentence)",2,"d",{warm:-1,vol:-1,emo:-1}],
    ["Replies with 'whatever you like'","Gives up every choice, to make the other carry the blame.","Whatever you like. I don't mind. I never mind.",3,"c",{asrt:-1,man:1,warm:-1}],
    ["Eats in the other room","Moves a plate elsewhere without comment.","(takes the plate through to the study, closing the door by an inch)",2,"d",{warm:-1,vol:-1}],
    ["Smile that doesn't reach the sentence","Greets guests cheerfully and drops it the moment they leave.","(bright 'lovely to see you!', then, door shut, a face like a closed shop)",1,"s",{warm:-1,hon:-1,emo:-1}],
    ["Mentions the grievance only by omission","Skips the shared joke or detail, so the absence is the message.","(everyone laughs at the old story; he studies his phone)",1,"s",{warm:-1,asrt:-1,vol:-1}],
    ["Keeps it up for days","Holds the cool silence well past the point anyone remembers its cause.","(day three: 'pass the salt', and nothing else)",3,"u",{warm:-1,pace:-1,emo:-1}]
  ]);

  block(SEC, "Triangulator", 200600, [
    ["'Everyone thinks so'","Claims a consensus the other person has never heard.","Everyone thinks so, you know. It's not just me.",5,"c",{hon:-1,man:1,agr:-1}],
    ["'I'm only telling you because'","Prefaces gossip with a motive of concern.","I'm only telling you because I care. She said you're hard to work with.",5,"c",{hon:-1,man:1,warm:-1}],
    ["Argues through a go-between","Sends complaints with a mutual friend rather than saying them directly.","Could you mention to him that the noise is a bit much? You know, from me.",4,"c",{asrt:-1,man:1}],
    ["Rings round for support","Calls others to collect backing before the confrontation.","Mum agrees with me. So does Jo. I've asked.",4,"c",{man:1,agr:-1,ego:1}],
    ["'Even your mother said'","Brings in a respected third party as a witness against the other.","Even your own sister said you went too far.",4,"c",{man:1,agr:-1,warm:-1}],
    ["Repeats what was said behind a back","Reports what someone said, with the sting kept in.","I don't want to repeat it, but she called you 'exhausting'.",4,"c",{man:1,warm:-1,agr:-1}],
    ["Copies the group in","Adds extra recipients to a message so the argument has witnesses.","(a reply-all with six names) Just so we're all on the same page.",3,"u",{man:1,asrt:-1}],
    ["Whispers the grievance to the nearest ally","Delivers the complaint to someone beside them, loud enough to be overheard.","(to the person next to him, a little too clearly) Typical.",3,"u",{man:1,asrt:-1,agr:-1}],
    ["'I don't want to take sides, but'","Takes a side, after a small ceremony of declining to.","I don't want to take sides, but she's clearly in the wrong.",3,"c",{hon:-1,man:1}],
    ["Reports back what the third party 'felt'","Relays another's feelings to apply pressure, unasked.","He was really upset, you know. He didn't say, but I could tell.",3,"u",{man:1,hon:-1,emo:1}],
    ["Asks 'did she say anything about me?'","Fishes for what a third person has said while pretending not to.","(lightly) Did she mention me? No reason. Just wondering.",2,"d",{man:1,asrt:-1,ego:1}],
    ["Raises it through a child or pet","Voices the complaint to a child or animal in earshot of the target.","(to the baby, brightly) Daddy forgot again, didn't he?",2,"d",{man:1,asrt:-1,agr:-1}],
    ["Lets a 'friend' voice their view","Tells the story as a friend's problem to test the other's reaction.","A friend of mine has a husband who does this. What should she do?",1,"s",{man:1,hon:-1,asrt:-1}],
    ["Leaves a pointed remark with the mutual friend","Drops one precise line with a mutual friend, knowing it will travel.","(lightly, to the neighbour) I'd never say it myself, of course.",1,"s",{man:1,hon:-1,asrt:-1,vol:-1}]
  ]);

  return out;
})();

TRAITS.push(...TRAITS_CONFLICT);

TRAIT_PACKS.push({id:"conflict", label:"Conflict style (2026 audit §6b)", version:"1", ids:[200000, 209999],
  applicability:{era:"any", realism:"any", tone:"any"}, blurb:"How a person fights: stonewalling, passive-aggression, arguing the record, smoothing, escalate-then-apologise, sulking, triangulating."});

/* Inbound links so the sliders can reach the new section (every optional category needs one). */
(function(){
  const add = (ax, pole, secId, cats) => { const L = GAP_WEIGHT_LINKS[ax] = GAP_WEIGHT_LINKS[ax] || {}; const P = L[pole] = L[pole] || {}; P[secId] = Object.assign(P[secId] || {}, cats); };
  add("assertiveness", "pos", "conflictstyle", {"Litigator":"M","Escalate then Apologise":"W"});
  add("assertiveness", "neg", "conflictstyle", {"Stonewalling & Withdrawal":"M","Sulker & Silent Treatment":"W"});
  add("agreeableness", "pos", "conflictstyle", {"Peacekeeper & Smoother":"M"});
  add("agreeableness", "neg", "conflictstyle", {"Passive-Aggressive":"M","Triangulator":"W"});
  add("emotionalcapacity", "neg", "conflictstyle", {"Stonewalling & Withdrawal":"W","Sulker & Silent Treatment":"M"});
  add("emotionalcapacity", "pos", "conflictstyle", {"Escalate then Apologise":"M"});
  add("honesty", "neg", "conflictstyle", {"Triangulator":"M","Passive-Aggressive":"W"});
  add("honesty", "pos", "conflictstyle", {"Litigator":"W"});
})();
