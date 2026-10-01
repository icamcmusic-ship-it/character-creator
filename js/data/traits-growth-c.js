/* ============================================================================
   TRAIT-BANK GROWTH C — 2026 audit §4a: every category up to a floor of about 15.
   Written as behaviours (what the speech or manner DOES), never as labels or
   diagnoses. Rarity and intensity are decoupled on purpose: quiet signatures and
   loud commons are written deliberately. reviewStatus "unreviewed".
   IDS: each category owns a block of 100 starting at 194000; APPEND ONLY.
   ========================================================================== */
const TRAITS_GROWTH_C = (function(){
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

  const BEL = "Beliefs & Worldview", JAR = "Occupational Jargon", MON = "Money & Class";

  block(BEL, "Conspiracy-Adjacent", 194000, [
    ["Wakes you up to what's really going on","Delivers theories with the zeal of a recruiter and takes disagreement as proof.","Everyone's asleep. You think the prices just happen? Wake up!",5,"c",{vol:1,asrt:1,hon:-1,agr:-1}],
    ["Everything is a distraction from something","Treats each news story as cover for a bigger unnamed one.","Why are they telling us about that today? What are they burying?",4,"c",{pos:-1,rebel:1}],
    ["Quietly keeps one file","Mentions a private folder of clippings once, never again, and never argues the point.","<i>(shrugs)</i> I keep a folder. It's fine. Forget I said.",1,"s",{vol:-1,disc:-1,asrt:-1}],
    ["Patterns in numbers","Finds dates and digits that line up and offers them gently as evidence.","Seventeen, again. Third time this week. Just noting it.",2,"d",{vol:-1}],
    ["'They don't want you to know'","Frames ordinary information as suppressed, including things printed on the label.","They don't put that on the front. Funny, that.",3,"c",{rebel:1,hon:-1}],
    ["Cheerful about the coverup","Treats the grand conspiracy as a fun hobby and invites everyone to join in.","Oh, it's all rigged, mate, it's brilliant. Pass the crisps.",3,"u",{mood:1,hon:-1,form:-1}],
    ["Retired from theories","Used to believe a lot, now politely corrects others without any heat.","I went down that hole once. It's mostly bored people with maps.",2,"d",{mood:-1}],
    ["Insists on primary sources","Demands the original document yet reads only the parts that agree.","Don't tell me what it says. Show me the PDF. ...Page nine, there.",3,"u",{intel:1,hon:-1}],
  ]);

  block(BEL, "Secular Rituals", 194100, [
    ["Sunday roast as sacrament","Treats the weekly family meal as non-negotiable and slightly solemn.","Sunday, one o'clock. I don't care who's engaged to whom.",4,"c",{cur:-1}],
    ["Loud annual tradition keeper","Runs the yearly holiday with a fixed script and announces each step.","Right, everyone, it's the lights ceremony! Positions! Same as last year!",5,"c",{vol:1}],
    ["Taps the doorframe leaving","Performs a tiny private gesture on every departure and doesn't explain it.","<i>(touches the frame twice, says nothing)</i> Right. Off we go.",1,"s",{vol:-1,disc:1}],
    ["Lights a candle on the quiet days","Marks small private anniversaries with a candle and no announcement.","<i>(lights one) </i>Just the one tonight. It's fine.",2,"d",{emo:1,vol:-1}],
    ["Seasonal cleaning rite","Treats the spring clear-out or autumn reset as a ceremony with a fixed order.","Windows first, then the cupboards. You can't do the cupboards first.",3,"u",{disc:1,cur:-1}],
    ["Mug and chair stays the same","Insists on the same cup and seat for the daily start and calls it centring.","That's my cup. The day doesn't start without that cup.",3,"c",{disc:1,pos:1,cur:-1}],
    ["Improvises rituals on the spot","Invents a ceremony for any occasion and gets everyone to join.","We need a moment! Everybody hands in. One, two — okay, that counts.",3,"u",{rebel:1,disc:-1}],
    ["Ritualised goodbye to a house or job","Makes departures a staged event with a last walk-through.","One last lap of the rooms. Humour me.",3,"d",{emo:1}],
  ]);

  block(BEL, "Lapsed Faith", 194200, [
    ["Still says the grace under their breath","Mutters the old words before eating and pretends it's a cough.","<i>(murmurs, then clears throat)</i> Right. Dig in.",1,"s",{vol:-1,asrt:-1}],
    ["Knows the hymn words by heart","Surprised to find the verses come up unbidden, and moves on briskly.","Don't look at me. It just comes out. Forty years of Sundays.",2,"d",{emo:1,vol:-1}],
    ["Loud ex-believer","Holds forth about everything that was wrong with the old community.","Don't get me started. Thirty years of guilt and bake sales!",5,"c",{vol:1,rebel:1,asrt:1}],
    ["Argues theology for sport","Enjoys picking apart doctrine with practised ease and no malice.","Ah, but who decides which book counts? Go on, answer that one.",3,"c",{intel:1,agr:-1}],
    ["Misses the community, not the creed","Speaks fondly of the casseroles, the singing and the people.","I don't believe a word. I miss the potluck, though.",3,"u",{emo:1,mood:-1}],
    ["Bargains in a crisis","Falls back on prayer-shaped phrases in emergencies and takes it back after.","Please, please, just let it be nothing. ...Not that I'm asking anyone.",3,"u",{emo:1}],
    ["Treats the holidays as cultural","Keeps every festival and calls it tradition not belief.","It's not religious. It's just what we do. Pass the candles.",2,"d",{disc:1,hon:-1}],
  ]);

  block(BEL, "Superstition", 194300, [
    ["Loud about bad luck","Calls out jinxes the moment anyone speaks tempting fate.","Don't say that! Knock on wood, knock on wood, everyone!",5,"c",{vol:1,asrt:1}],
    ["Lucky object in every pocket","Carries a coin or token and checks it before important moments.","<i>(pats pocket)</i> Got it. Okay. Now we can go in.",3,"c",{disc:1,intel:-1}],
    ["Won't say the name of the thing","Avoids naming a feared outcome and uses a code word instead.","If the, you know, if it doesn't go well. The other thing.",2,"d",{vol:-1,emo:1,asrt:-1}],
    ["Reads small signs","Notices magpies, spilled salt and cracked mirrors and says nothing till asked.","<i>(glances at the salt, steps over it)</i> Mm.",1,"s",{vol:-1,intel:-1}],
    ["Cheerful about it all","Treats every charm as a joke while keeping each one scrupulously.","Totally silly. Anyway, left shoe first, always.",2,"u",{mood:1,hon:-1}],
    ["Orders the day by numbers","Chooses times, seats and floors by lucky or unlucky digits.","Not the thirteenth. Make it the fourteenth, I'll sleep better.",3,"u",{asrt:1,intel:-1}],
  ]);

  block(JAR, "Legal", 194400, [
    ["'Without prejudice'","Prefaces ordinary concessions with a contract-style caveat.","Without prejudice, I'd say the sofa's yours. Don't hold me to it.",3,"c",{form:1,disc:1}],
    ["Loud objection to everything","Declares 'objection' or 'noted for the record' at kitchen-table disputes.","Objection! Leading question! Sit down, you're out of order!",5,"c",{vol:1,asrt:1,mood:1}],
    ["Pleads the Fifth about the biscuits","Uses privilege-style refusals in jest at trivial questions.","On the advice of counsel, I decline to say who ate the last one.",3,"u",{hon:-1,mood:1}],
    ["Reads the fine print out loud","Quietly recites terms before agreeing to anything.","Hold on, clause four. 'Reasonable endeavours.' Define reasonable.",2,"d",{pace:-1}],
    ["'In the matter of'","Names domestic issues like case captions.","In the matter of the dishwasher, I'll be reserving my position.",3,"u",{form:1,mood:1}],
    ["Hedges every statement","Qualifies each claim with 'allegedly', 'to my knowledge' and 'as I understand it'.","He was, allegedly, to my knowledge, at the shop.",3,"c",{asrt:-1,hon:1}],
    ["Takes it in writing","Asks for an email trail even for casual favours.","Lovely. Could you send that over so we've got it in writing?",1,"s",{form:1,man:-1}],
    ["Settles out of court","Offers a compromise before anyone raises a voice.","Look, nobody wants a hearing. What if we both give a bit?",2,"d",{agr:1,man:1}],
  ]);

  block(JAR, "Tech", 194500, [
    ["'Have you tried turning it off and on'","Tells an agitated person to power down for ten minutes and return with a clean slate, in the middle of a row.","Ten minutes, no talking, then we start fresh. Go.",4,"c",{mood:1}],
    ["Everything is a ticket","Logs requests, assigns owners and closes the issue in conversation.","Right, I'll raise it. Whose queue is the washing up in?",4,"c",{form:1,disc:1}],
    ["'Works on my machine'","Disclaims responsibility when something fails for anyone else.","Weird. It was fine when I did it. Must be your end.",3,"u",{ego:1,hon:-1,agr:-1}],
    ["Deprecates old habits","Describes outdated routines as deprecated, kept only for backwards compatibility.","Calling at six? That's legacy. We support it, we don't love it.",2,"d",{mood:1}],
    ["Spins up a quick prototype","Proposes a rough version of everything before planning it.","Ship it ugly, fix it Tuesday. Nobody dies of a beta.",3,"u",{rebel:1,pace:1,disc:-1}],
    ["Scalable, in the abstract","Uses 'scale', 'bandwidth' and 'latency' for ordinary tiredness.","I'm out of bandwidth. Can this go async?",3,"c",{act:-1}],
    ["Speaks in commit messages","Describes the day in terse changelog lines.","fix: mood. chore: laundry. wip: dinner.",1,"s",{vol:-1,pace:1}],
    ["Reads the logs first","Asks for exact error text before any theory is offered.","Don't tell me it broke. What did it actually say?",2,"d",{asrt:1}],
  ]);

  block(JAR, "Academic", 194600, [
    ["'Citation needed'","Challenges casual claims by asking where it is written.","Who says? Source? I'm not hearing a source.",4,"c",{hon:1,asrt:1,warm:-1,agr:-1}],
    ["Defines terms before agreeing","Insists on defining the key word before any discussion starts.","Before we go on, what do we mean by 'fair'?",3,"c",{pace:-1}],
    ["'It's more complicated than that'","Reflexively complicates any simple summary.","Well, yes, but it's more complicated than that. Always is.",4,"c",{asrt:1,agr:-1}],
    ["Spoken footnotes and asides","Pauses to add asides marked as references.","Hmm, as I think Marsh said — actually, a 1998 paper — anyway.",2,"d",{form:1,pace:-1}],
    ["Peer reviews dinner","Critiques casual cooking with the structure of a referee report.","Strong main argument, weak conclusion. Needs salt. Minor revisions.",3,"u",{mood:1,agr:-1,warm:-1}],
    ["Writes the conference talk in conversation","Delivers anecdotes with a 'first, second, finally' structure.","I'll make three points. One, the bus was late.",3,"u",{form:1}],
    ["Hedges toward 'preliminary'","Offers views as early findings subject to revision.","Tentatively, and this is preliminary, I think it's the cat.",1,"s",{asrt:-1,hon:1,vol:-1}],
    ["Treats gossip as a literature review","Surveys what everyone has said about someone before adding a view.","So, the existing literature on Dave is mixed.",2,"d",{mood:1,intel:1,warm:-1}],
  ]);

  block(JAR, "Service", 194700, [
    ["'No problem at all'","Answers every request, including rude ones, with a stock reassurance.","No problem at all! Absolutely no trouble. Of course.",4,"c",{agr:1,asrt:-1}],
    ["Upsells friends","Adds optional extras and offers to every offhand favour.","Want fries with that? Go on, make it a large. Best value.",4,"c",{asrt:1}],
    ["'Let me see what I can do'","Offers help in a way that commits to nothing.","Let me just see what I can do for you. Bear with me.",3,"u",{man:1,agr:1,hon:-1}],
    ["Reads the room's mood by the table","Notices a stranger's mood at a glance and adjusts quietly.","<i>(lowers voice, slows down)</i> Take all the time you need.",1,"s",{vol:-1,emo:1}],
    ["Apologises for the system","Says 'I'm so sorry, that's just how the system works' and means it.","I'm so sorry, it's the system. I'd change it if I could.",3,"u",{agr:1,asrt:-1}],
    ["Announces every handover","Narrates each step of a simple task as if on a till.","Okay, I've got the keys, I'm handing you the keys, there you go.",2,"d",{pace:-1,form:1}],
    ["Customer-first catchphrases","Closes ordinary talk with 'is there anything else I can help with today'.","Right, that's sorted. Anything else I can help you with today?",3,"c",{form:1}],
    ["Holds a smile through bad news","Delivers a refusal with unchanged brightness.","Unfortunately that's not possible! Have a lovely day!",3,"d",{man:1,mood:1,hon:-1}],
  ]);

  block(JAR, "Medical", 194800, [
    ["Scores everything out of ten","Asks for a pain score on trivial discomforts.","Where's the boredom at, on a scale of one to ten?",4,"c",{mood:1}],
    ["Triages the to-do list","Sorts tasks into immediate, urgent and can-wait.","That's a red. That's amber. The email can wait.",3,"u",{disc:1,asrt:1}],
    ["Unflappable bedside voice","Keeps the same flat calm while delivering shocking news.","Right. That's quite a lot of blood. Let's sit down, shall we.",2,"d",{vol:-1,emo:-1,pace:-1,warm:-1}],
    ["Washes in and out of rooms","Sanitises hands at every threshold and mentions it.","<i>(sanitises)</i> Habit. I can't walk through a door without.",1,"s",{disc:1}],
    ["Loud handover","Delivers a full recap in a rapid, practised sweep.","Okay, so: sixty-two, fell, thinks it's nothing, I think it's something.",4,"c",{pace:1,vol:1,asrt:1}],
    ["'Any allergies?' at social events","Asks screening questions out of reflex at parties.","Before you eat that: any allergies? Medications? Lovely.",3,"c",{disc:1,warm:-1}],
    ["Dark humour about the body","Jokes bluntly about illness among peers.","It's not the cough that gets you. It's the paperwork.",3,"u",{mood:-1,hon:1,man:-1,emo:-1}],
  ]);

  block(JAR, "Military", 194900, [
    ["'Roger that' for yes","Acknowledges ordinary requests in radio phrasing.","Roger that. Wilco. Out.",4,"c",{form:1,pace:1}],
    ["Plans in phases","Describes errands as phased operations with a start line.","Phase one, the shop. Phase two, the post office. Rendezvous at fourteen hundred.",4,"c",{disc:1,asrt:1}],
    ["Quotes the twenty-four-hour clock","Gives times only in twenty-four-hour format, however casual.","Dinner's at nineteen thirty. Don't be late.",2,"d",{form:1,disc:1}],
    ["Debrief after everything","Insists on a quick what-went-well-what-didn't after any event.","Right, hot wash. What worked? What didn't?",3,"u",{disc:1}],
    ["Reads exits on entering","Notes the doors and sightlines silently as soon as they sit.","<i>(takes the seat facing the door)</i> This one's fine.",1,"s",{vol:-1}],
    ["'Hurry up and wait' as philosophy","Treats delays as normal and meets them with dry calm.","Always the way. Rush to get here, sit for three hours.",3,"u",{mood:-1,pace:-1}],
    ["Acronyms for the dinner table","Abbreviates chores into letters nobody else knows.","SITREP on the bins? Any FOD in the hall?",3,"c",{form:1}],
  ]);

  block(JAR, "Kitchen & Trade", 195000, [
    ["'Behind!' and 'Hot!'","Calls out warnings in any crowded space.","Behind! Coming through, hot! Mind your back!",5,"c",{vol:1,form:-1}],
    ["'Yes, chef' to anyone","Answers instructions with kitchen-brigade acknowledgement.","Yes, chef. Two minutes. Yes, chef.",4,"c",{agr:1,asrt:-1}],
    ["Mise en place for life","Lays out everything before beginning any task and sets it in order.","Everything in its place first. Then we start. Not before.",3,"u",{disc:1,pace:-1}],
    ["Measures twice, says so","Repeats the measure-twice rule over any small job.","Measure twice, cut once. Every time. Every single time.",3,"c",{disc:1}],
    ["Tastes before speaking","Pauses to sample and adjusts a verdict by a pinch.","<i>(tastes)</i> Needs acid. A bit of acid. There.",1,"s",{vol:-1,pace:-1}],
    ["'Service!' for any finish","Calls an end to tasks as though plating up.","Service! Done. Hands off, it's ready.",3,"u",{asrt:1,vol:1}],
    ["Rates jobs by how long they'll take","Gives times as bench estimates and hates rounding them up.","Forty minutes. Not an hour. Forty. Go on, watch me.",2,"d",{ego:1}],
  ]);

  block(MON, "Money Taboo", 195100, [
    ["Hushed when money enters","Drops volume to a murmur at any mention of cost.","<i>(lowers voice)</i> It was... a fair bit. I'd rather not say.",2,"d",{vol:-1,asrt:-1}],
    ["Loudly says it's none of your business","Shuts down questions about pay with a flat, public refusal.","Nobody asks that! What I earn is my business!",4,"c",{vol:1,asrt:1,man:-1,warm:-1}],
    ["Changes the subject at the bill","Deflects when payment comes up, with a joke or a topic swerve.","Anyway! Who saw the match? Right, anyone want coffee?",3,"c",{man:1,hon:-1,emo:-1}],
    ["Insists money is vulgar","Frames talk of cost as crass regardless of who raises it.","One doesn't discuss it. Not at table, not ever.",3,"u",{form:1,rebel:-1,cur:-1}],
    ["Open with everything","Names salary, rent and debts to anyone, cheerfully.","I make forty-two. Rent's nine hundred. What about you?",3,"u",{hon:1,disc:-1,mood:1,form:-1}],
    ["Pays in secret","Settles a bill privately so no number is ever spoken.","<i>(slips away from the table; returns)</i> Sorted. Don't ask.",1,"s",{man:1,vol:-1}],
    ["Treats a gift price tag as private","Removes any trace of cost from gifts.","I took the price off. It's the thought that counts.",2,"d",{emo:-1}],
  ]);

  block(MON, "Status Signalling", 195200, [
    ["Name-drops the schedule","Mentions a busy calendar to signal importance.","Can't do Tuesday. Or Wednesday. Thursday, maybe, early.",4,"c",{ego:1,asrt:1}],
    ["Understated old-money ease","Plays down wealth with studied vagueness and never names a price.","Oh, that old thing. It came with the house.",2,"s",{vol:-1,ego:-1,hon:-1}],
    ["Loud about the bargain","Announces a good deal or an expensive find to the room.","Guess what that cost! Go on! Half! Absolutely half!",5,"c",{vol:1,ego:1}],
    ["Mentions where they summered","Weaves destinations into small talk as incidental facts.","We were in the Algarve — or was it Crete? — anyway.",3,"u",{ego:1,man:1}],
    ["Name-drops the school","Locates a person by where they were educated.","Oh, he was at my old school. Year above, I think.",3,"u",{ego:1,form:1}],
    ["Quiet about the good fortune","Refers to privileges as 'just lucky' and changes the subject.","Oh, we're very lucky. Truly. Anyway, how are you?",2,"d",{vol:-1,emo:-1}],
  ]);

  block(MON, "Class-Mobility Tells", 195300, [
    ["Scarcity habits kept in affluence","Eats leftovers, hoards carrier bags and rations treats long after money loosened.","I know I can afford it. I still can't throw away the end of the loaf.",3,"c",{mood:-1}],
    ["Corrects own old accent mid-word","Catches and repairs a vowel and moves on a half-beat later.","I was going to say — <i>(pause)</i> — I'll go there.",2,"d",{vol:-1,disc:1,ego:-1}],
    ["Loud about how far they've come","Retells the rise from nothing as a victory lap.","I started with nothing! Nothing! And look at me now!",5,"c",{vol:1,ego:1}],
    ["Reads every menu from the right","Checks the price column first before even looking at the dishes.","<i>(scans right-hand side)</i> The soup's good. I'll have the soup.",2,"s",{vol:-1,disc:1}],
    ["Carries two registers","Switches vocabulary between old friends and new colleagues, and is aware of it.","<i>(to colleague)</i> Wonderful. <i>(to old friend)</i> Mate, wonderful.",3,"u",{man:1}],
    ["Overpays and over-tips","Tips grandly to shake off a past of being the one waiting.","Keep it. No, keep it. I've been on that side.",3,"d",{ego:1}],
  ]);

  block(MON, "Thrift Talk", 195400, [
    ["Budgets in units of heat","Counts cost in hours of heating and kilowatts rather than cash.","That's three hours of the heater. We'll wait till seven.",3,"u",{disc:1,act:-1}],
    ["Spoons of energy, spoons of cash","Uses a spend-and-save vocabulary for effort and money alike.","I've got maybe two coins of energy left today. Spend them wisely.",2,"d",{disc:1,mood:-1,act:-1}],
    ["Loud about the voucher","Announces the discount codes, points and offers in play.","I've got a code! Twenty off! Hold the basket!",5,"c",{vol:1,ego:1}],
    ["Benefits-forms fluency","Speaks easily in assessment, reassessment and entitlement language.","It's the reassessment letter. Form twelve, then the appeal.",3,"u",{form:1}],
    ["Pays on the day, in cash envelopes","Allocates cash to labelled pots and reports each balance.","Food pot's got twelve left. Fun pot's empty.",2,"s",{pace:-1}],
    ["Counts the cost of the cheap thing","Reminds everyone that buy-cheap-buy-twice.","Buy cheap, buy twice. I'm still using my dad's drill.",4,"c",{asrt:1,disc:1,cur:-1}],
  ]);

  return out;
})();

TRAITS.push(...TRAITS_GROWTH_C);
