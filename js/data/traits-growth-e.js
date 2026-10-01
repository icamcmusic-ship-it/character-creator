/* ============================================================================
   TRAIT-BANK GROWTH E — 2026 audit §4a: the last categories under the floor of 15.
   Written as behaviours (what the speech or manner DOES), never as labels or
   diagnoses. reviewStatus "unreviewed". IDS: blocks of 100 starting at 198000; APPEND ONLY.
   ========================================================================== */
const TRAITS_GROWTH_E = (function(){
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

  const DIA = "Dialect & Linguistic Background", BEL = "Beliefs & Worldview", FEA = "Fears & Aversions", ROM = "Romance & Desire";

  block(DIA, "Second-Language Speaker", 198000, [
    ["Translates the joke before telling it","Explains the wordplay in the first language, then delivers a flatter version in the second.","In my language this is very funny, because the word is also a fish. Anyway.",2,"d",{form:1,intel:-1},{behaviorFunction:"connect"}],
    ["Answers in the wrong tense and carries on","Lets a tense slip by and keeps going rather than stop to repair it.","Yesterday I go to the market and she tell me no. Fine, I tell her yes.",3,"c",{form:-1,asrt:1},{behaviorFunction:"connect"}],
    ["Reads the menu aloud, silently, first","Mouths the whole order under the breath before saying it to the waiter.","<i>(lips moving)</i> One soup, no cream. One soup, no cream. Hello, one soup, no cream.",1,"d",{vol:-1,asrt:-1},{behaviorFunction:"avoid"}],
    ["Nods along and understands half","Agrees with a steady nod through fast talk, then checks details later in writing.","Yes, yes, of course. <i>(nods, then types a quick note to look it up)</i>",2,"c",{asrt:-1,disc:-1},{behaviorFunction:"avoid"}],
    ["Swears fluently, only in the new language","Uses the adopted language's strongest words with perfect timing and no sense of weight.","Oh, that is bloody brilliant, that is. <i>(beams, unaware of the room)</i>",4,"c",{vol:1,form:-1},{behaviorFunction:"signal"}],
    ["Misses the idiom, keeps the meaning","Takes figures of speech literally and answers calmly, to the delight of everyone.","Raining cats and dogs? I looked outside. It was only water.",3,"c",{cur:1},{behaviorFunction:"connect"}],
  ]);
  block(BEL, "Faith Practice", 198100, [
    ["Keeps a private prayer routine nobody sees","Quietly slips away at the same time each day and returns unremarked.","Back in ten. <i>(a small, ordinary smile)</i>",1,"d",{vol:-1,disc:-1},{behaviorFunction:"soothe"}],
    ["Says grace aloud and expects the table to wait","Stops the meal for a long blessing and watches faces for impatience.","Hands, everyone. <i>(waits, eyebrows raised)</i> Lord, for this food...",4,"c",{asrt:1,vol:1},{behaviorFunction:"control"}],
    ["Wears the calendar in conversation","Marks time by feast days and fasts, and plans every meeting around them.","Not the ninth, that's the Vigil. The twelfth, and I'll bring bread.",2,"u",{form:1},{behaviorFunction:"signal"}],
    ["Turns every setback into providence","Reads each disappointment as arranged, whether or not the listener asked.","Well, the flight was cancelled. It's obviously meant. Something's waiting.",4,"c",{asrt:1,cur:-1},{behaviorFunction:"soothe"}],
    ["Practises quietly, never explains","Keeps the observance but gives only the shortest answer when asked.","It's just what we do. <i>(shrugs, changes the subject)</i>",1,"s",{vol:-1,disc:-1,warm:-1},{behaviorFunction:"avoid"}],
  ]);
  block(BEL, "Political Temperament", 198200, [
    ["Reads the whole paper and says nothing","Absorbs every argument and offers no side, to the irritation of dinner guests.","Mm. I read it. <i>(folds the paper, passes the salt)</i>",1,"d",{vol:-1,asrt:-1,disc:-1},{behaviorFunction:"avoid"}],
    ["Votes, then claims it was a duty","Treats the ballot as a chore, with no enthusiasm and no complaint.","Went down on the way home. Took four minutes. Done.",1,"s",{emo:-1,warm:-1},{behaviorFunction:"signal"}],
    ["Shouts at the radio","Argues at full volume with a broadcast, then carries on with the day.","Oh, SIT DOWN! <i>(stirs the pot; calm again)</i>",4,"c",{vol:1,asrt:1},{behaviorFunction:"release"}],
    ["Knows the numbers, not the people","Argues policy in figures and has not met a single person it affects.","It's four percent, and the trend is flat. Look it up.",3,"u",{warm:-1,intel:1},{behaviorFunction:"control"}],
    ["Blames whoever isn't in the room","Settles every disagreement by naming a distant culprit everyone can agree to dislike.","It's those people at the top, always has been.",4,"c",{cur:-1,intel:-1},{behaviorFunction:"connect"}],
  ]);
  block(FEA, "Bodily Aversions", 198300, [
    ["Wipes the handle before touching it","Cleans a shared surface with a sleeve or tissue before using it, without comment.","<i>(quick wipe)</i> Sorry, habit. Right, go ahead.",2,"c",{disc:-1,warm:-1},{behaviorFunction:"avoid"}],
    ["Looks at the ceiling during injections of any kind","Fixes on a point away and narrates something dull until it is over.","Tell me when it's done. I'm counting the tiles. Forty-one.",2,"u",{asrt:-1},{behaviorFunction:"avoid"}],
    ["Gags audibly at a bad smell and says so","Reacts loudly and openly to odours, announcing it to the room.","Oh, that is VILE! Who opened that? Windows, now!",5,"c",{vol:1,disc:-1},{behaviorFunction:"release"}],
    ["Cannot say the word, spells it","Avoids a particular bodily term and spells it or uses a nursery word.","She had the... the t-h-r-o-w-up. Yes.",1,"s",{form:1,vol:-1},{behaviorFunction:"avoid"}],
    ["Leaves the room without explanation","Steps out quietly when a certain sound or sight begins and comes back as if nothing happened.","<i>(stands, mild smile)</i> Just refilling my water.",2,"d",{vol:-1,hon:-1},{behaviorFunction:"avoid"}],
  ]);
  block(ROM, "Jealousy Tells", 198400, [
    ["Hears every name twice","Goes still at a mention and asks for the name again, lightly, to file it.","Sorry, who? Dan. Dan from where? <i>(smiles, remembers)</i>",2,"d",{disc:-1,vol:-1},{behaviorFunction:"signal"}],
    ["Overshares the partner's schedule","Narrates the partner's whereabouts to others as a way of marking territory.","She's got yoga till seven, then we're at her mum's, so, yes, busy.",3,"c",{man:-1,form:-1},{behaviorFunction:"control"}],
    ["Stays out of it, aloud, for a long time","Says it does not matter, repeatedly, while it plainly does.","No, honestly. I'm fine. Totally fine. It's fine.",4,"c",{hon:-1,emo:-1,warm:-1},{behaviorFunction:"avoid"}],
    ["Talks around an old betrayal","After a partner's infidelity, speaks about trust in general terms and never names what happened.","Some things you just don't build on twice. <i>(a steady look at the table)</i>",3,"d",{vol:-1,disc:-1,emo:1},{behaviorFunction:"avoid"}],
    ["Refuses to ask, only to notice","Keeps a private tally and never raises a question, waiting for the other to volunteer.","I didn't ask. <i>(small shrug)</i> I'd just like to be told.",2,"s",{asrt:-1,disc:-1},{behaviorFunction:"signal"}],
  ]);
  block(FEA, "Social Dreads", 198500, [
    ["Dreads the baby-shower invitation","Accepts with brightness and sends a gift but finds a reason to leave early.","Wouldn't miss it! <i>(later)</i> I've got an early start, so, you know.",2,"d",{emo:1,disc:-1,vol:-1},{behaviorFunction:"avoid"}],
    ["Answers 'Any children?' with a neat full stop","Gives a short, closed reply and a question back, so the subject ends.","Not for us. Anyway, how are yours?",2,"s",{vol:-1,disc:-1},{behaviorFunction:"avoid"}],
    ["Dreads the unplanned reunion","Rehearses a short, pleasant life summary before attending, then speaks it fast.","I'm good, busy, work's busy, you look well! And you?",4,"c",{vol:1,disc:-1,hon:-1},{behaviorFunction:"avoid"}],
    ["Says 'We lost the second one' and no more","Mentions a pregnancy loss in a single plain clause and visibly stops further questions.","We lost the second. <i>(a breath)</i> Is that the kettle?",2,"d",{vol:-1,pace:-1,emo:1},{behaviorFunction:"avoid"}],
    ["Changes the subject at the due-date question","Deflects a pregnancy question with a joke or a task, never with a no.","Ha, not that I know of. Who wants tea?",3,"c",{asrt:-1,disc:-1},{behaviorFunction:"avoid"}],
  ]);
  block(ROM, "Courtship Speech", 198600, [
    ["Asks about the future in hypotheticals","Floats a plan as a what-if so no one has to commit to it.","If we were to, say, go away for a weekend, would you want somewhere with a view?",2,"u",{asrt:-1},{behaviorFunction:"signal"}],
    ["Says 'my person' and nothing more","Refers to a partner with a deliberately private label and never gives details.","My person's coming. You'll see, there's no need to say more.",2,"d",{disc:-1,vol:-1},{behaviorFunction:"avoid"}],
    ["Avoids pronouns entirely","Talks about plans and evenings with a partner without a single he, she or them.","Went out last night. Lovely time. Back late. Home now.",1,"s",{disc:-1,hon:-1},{behaviorFunction:"avoid"}],
    ["Calls the friends 'my family'","Speaks of chosen family with plain, unembarrassed warmth and the same weight as blood relatives.","My family's coming Saturday, the lot of them. Bring a dish.",3,"c",{warm:1},{behaviorFunction:"connect"}],
    ["Tells you everything about their love, loudly","Narrates the relationship in public, in full detail, and invites the room to agree.","He is, I swear, the best thing that ever happened to me!",5,"c",{vol:1,disc:-1},{behaviorFunction:"connect"}],
  ]);
  block(FEA, "Phobias", 198700, [
    ["Checks the exits and says it is for fun","Counts doors and routes on entering and calls it a game.","Two doors, one window. Right, I'll sit here. Just a game.",2,"c",{disc:-1},{behaviorFunction:"signal"}],
    ["Has a fixed excuse for the thing","Offers the same smooth reason every time to avoid the feared place.","Oh, can't make the lake, allergies. Always allergies.",1,"d",{hon:-1,disc:-1},{behaviorFunction:"avoid"}],
  ]);

  return out;
})();

TRAITS.push(...TRAITS_GROWTH_E);
