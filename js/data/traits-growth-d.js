/* ============================================================================
   TRAIT-BANK GROWTH D — 2026 audit §4a: every category up to a floor of about 15.
   Written as behaviours (what the speech or manner DOES), never as labels or
   diagnoses. Rarity and intensity are decoupled on purpose: quiet signatures and
   loud commons are written deliberately. reviewStatus "unreviewed".
   IDS: each category owns a block of 100 starting at 196000; APPEND ONLY.
   ========================================================================== */
const TRAITS_GROWTH_D = (function(){
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

  const FAM = "Family Talk", CF = "Contradiction Functions", ROM = "Romance & Desire";

  block(FAM, "Parent-Voice Echo", 196000, [
    ["Answers the phone in the parent's greeting","Picks up with the exact sing-song or bark a parent always used, then drops it.","Hello-o? <i>(her mother's lilt; she clears her throat)</i> Sorry. Hello.",1,"s",{emo:1},{behaviorFunction:"signal"}],
    ["Hums the parent's tune while working","Hums or mutters the parent's habitual song when concentrating, unaware.","<i>(humming the same two bars his father did over the sink)</i>",1,"d",{emo:1,vol:-1},{behaviorFunction:"soothe"}],
    ["Orders in the parent's idiom","Hands out instructions in the parent's regional turns of phrase, however far from home.","Mind you shut that door properly, I'm not heating the street.",3,"c",{asrt:1,form:-1},{behaviorFunction:"control"}],
    ["Reads out the parent's rules to children","Passes the parent's household rules down verbatim, with the same weary emphasis.","Shoes off, elbows off, and nobody talks over the news.",4,"c",{asrt:1,cur:-1},{behaviorFunction:"control"}],
    ["Mimics the parent as a party piece","Does an affectionate, spot-on impression of a parent to make the room howl.","<i>(deep breath, hands on hips)</i> 'I did not drive forty miles for a salad.'",4,"c",{vol:1,form:-1},{behaviorFunction:"connect"}],
    ["Argues both sides of the parent's quarrel","Replays a parent's old argument aloud, playing both roles.","He'd say, 'It's cold.' She'd say, 'Then wear something.' Forty years of that.",2,"d",{emo:1,intel:1},{behaviorFunction:"signal"}],
    ["Quotes the parent only when afraid","Pulls out the parent's steadying line under stress and nowhere else.","Right. 'One foot, then the other.' <i>(she says it again, softer)</i>",1,"s",{emo:1,mood:-1},{behaviorFunction:"soothe"}],
    ["Speaks to a grown child in the parent register","Talks to an adult son or daughter as though they were still ten, out of habit rather than malice.","Have you eaten? And you're sure that's warm enough? You're thirty-four, I know, I know.",3,"c",{asrt:1,man:1,cur:-1},{behaviorFunction:"connect"}],
  ]);
  block(FAM, "Never Mentions Family", 196100, [
    ["Answers family questions with a very long pause","Goes still before replying, and the delay says more than the answer.","Family? <i>(a long breath)</i> Mm. Yes. I suppose I have one.",1,"s",{emo:-1,vol:-1},{behaviorFunction:"avoid"}],
    ["Refers to relatives only by first name","Calls parents and siblings by first name, as if they were colleagues.","Patricia sent a card. Roger rang. It was fine.",2,"d",{emo:-1,warm:-1},{behaviorFunction:"avoid"}],
    ["Never has anywhere to be at the holidays, loudly","Announces being gloriously free at holidays so no one asks why.","Christmas? I'm booked solid, sunbed and a book, absolutely thrilled!",4,"c",{vol:1,pos:1,hon:-1},{behaviorFunction:"avoid"}],
    ["Joke-sized family summary","Reduces the whole family to a punchline and moves on at speed.","Family? Two parents, one ex-dog, zero regrets. Next question!",4,"c",{vol:1,emo:-1,disc:-1,warm:-1},{behaviorFunction:"avoid"}],
    ["Won't say who the photo is","Handles a framed picture with care but never names the people in it.","<i>(turns the frame face-down, gently)</i> Old friends. Shall we eat?",1,"s",{emo:1,hon:-1},{behaviorFunction:"protect"}],
    ["Bristles at 'where are you from'","Treats a polite origin question as a trespass and answers with a place, never a people.","Birmingham. That's all. What else do you want, the postcode?",3,"u",{agr:1,warm:-1,man:-1},{behaviorFunction:"protect"}],
    ["Talks of a family in the third person plural","Says 'they' of the family, as if reporting on strangers.","They moved. They do that. They didn't tell me where, so.",2,"u",{emo:-1,pos:-1,warm:-1},{behaviorFunction:"avoid"}],
  ]);
  block(FAM, "Sibling Rivalry", 196200, [
    ["Corrects the sibling's version of the story","Interrupts a brother's or sister's anecdote to fix small details, relentlessly.","It was a Tuesday. And it was a Fiat. And you were not even there.",4,"c",{asrt:1,agr:1,vol:1,man:-1},{behaviorFunction:"signal"}],
    ["Sends the sibling a silent, pointed gift","Gives presents that are a quiet answer to an old slight, and never mentions it.","<i>(a second-hand copy of the book he borrowed in 1998)</i> Happy birthday.",1,"s",{man:1,hon:-1,warm:-1},{behaviorFunction:"signal"}],
    ["Mirrors the sibling's choices a year late","Copies a sibling's moves and denies it with a straight face.","Oh, a conservatory? What a coincidence. Ours is bigger, though.",2,"d",{ego:1,hon:-1},{behaviorFunction:"signal"}],
    ["Gets cheerfully competitive over trivia","Turns board games and quizzes with a sibling into a war and relishes it.","Say it again, loser. Say 'Canberra' like it's a real answer. Bam.",5,"c",{vol:1,agr:1,pos:1,man:-1},{behaviorFunction:"signal"}],
    ["Takes the sibling's side against outsiders","Mocks a sibling at home and closes ranks the second anyone else joins in.","Only I get to call him an idiot. Thank you, no, goodnight.",3,"u",{asrt:1,man:-1},{behaviorFunction:"protect"}],
    ["Cannot say the sibling's success aloud","Congratulates by gesture or by changing the subject, never in words.","<i>(nods at the trophy, passes the salt)</i> Gravy.",1,"d",{emo:-1,ego:1,warm:-1},{behaviorFunction:"avoid"}],
    ["Reconciles through chores","Offers practical help in place of an apology after a fight.","I've done your gutters. Don't say anything. I did your gutters.",2,"u",{emo:-1},{behaviorFunction:"repair"}],
  ]);
  block(FAM, "Talks About Family Constantly", 196300, [
    ["Carer's clipped logistics","Reports on a dependent relative in brisk timings and dosages, with no room for feeling.","Tablets at eight, physio at ten, home by two. I need to be back by two.",3,"u",{emo:-1,warm:-1},{behaviorFunction:"protect"}],
    ["Narrates a parent's decline in practical terms","Reduces a parent's illness to a list of tasks because the alternative is saying it.","He can't do stairs now, so the bed's in the lounge. That's sorted.",2,"d",{emo:-1,mood:-1},{behaviorFunction:"protect"}],
    ["Speaks of a distant family with a ritual toast","Raises a small, repeated phrase to a far-off family at every meal.","To the ones who aren't here. <i>(a nod, a sip)</i>",1,"s",{emo:1,form:1},{behaviorFunction:"connect"}],
    ["Brings the whole clan to every opinion","Prefaces every view with a head count of relatives who agree.","Everyone in our house says so. All eleven of us. That's a vote.",4,"c",{vol:1,asrt:1,ego:1,cur:-1},{behaviorFunction:"signal"}],
    ["Gives running updates on the kids' schedules","Cannot answer a plain question without a rundown of who needs collecting and when.","Sorry, I'll just — Jamie's got swimming, Ella's got a thing, who's got the car?",4,"c",{vol:1},{behaviorFunction:"connect"}],
    ["Fusses over an adult child by text","Sends frequent, gentle checks to a grown son or daughter and over-explains them.","Just checking you're alive! No need to reply! Reply if you like!",3,"c",{asrt:-1,man:1},{behaviorFunction:"connect"}],
  ]);

  block(CF, "Strategic Politeness", 196400, [
    ["Smiling passive-aggression","Delivers a complaint as a helpful aside so it cannot be answered.","No, no, it's no trouble that you're late. I started without you. Eleven years of practice.",4,"c",{man:1,agr:1,warm:-1},{behaviorFunction:"control"}],
    ["Argues the record like a litigator","Cites dates, quotes and exact wording from past rows to win the point.","On the third of June you said, and I quote, 'I'll call.' I have the message.",4,"c",{agr:1,warm:-1},{behaviorFunction:"control"}],
    ["Escalates, then apologises beautifully","Blows up at someone and follows with a gracious, flawless apology that resets the account.","I was out of line. I'm so sorry. Anyway, as I was saying, you're wrong.",3,"u",{man:1,emo:1,vol:1},{behaviorFunction:"repair"}],
    ["Routes the complaint through a third person","Tells a bystander what they want a colleague to hear, loudly enough to carry.","<i>(to the intern, at volume)</i> Funny how some people never rinse a mug.",3,"c",{man:1,asrt:-1,hon:-1,warm:-1},{behaviorFunction:"signal"}],
    ["Keeps the peace by agreeing with everyone","Nods along to opposing sides in turn so no one ever has to fight.","You're right. And you're right. Honestly, you're both right. Tea?",3,"c",{agr:-1,hon:-1},{behaviorFunction:"connect"}],
    ["Would not dream of saying no","Refuses by offering a long list of reasons it would be wonderful if things were different.","Oh, I'd love to. I'd absolutely love to. If only. Things being what they are.",3,"c",{hon:-1,asrt:-1},{behaviorFunction:"avoid"}],
    ["Declines by asking a question back","Never refuses; asks a gentle, open question that leaves the request to wither.","Would that really be the best use of your time, do you think?",1,"s",{man:1,vol:-1},{behaviorFunction:"avoid"}],
    ["Offers a third cup to refuse the first","Presses hospitality on a guest as a way of declining the request they came with.","Have you eaten? Stay. Sit. We'll talk another time.",2,"d",{man:1},{behaviorFunction:"avoid"}],
    ["Names a shame so it never lands as guilt","Frames a lapse as what the family or town will think rather than as a personal wrong.","What will people say? That's all I'm asking. What will they say?",3,"u",{man:1,pos:-1,rebel:-1},{behaviorFunction:"control"}],
    ["Owns the guilt, refuses the shame","Admits the act at once and flatly declines to be diminished by it.","I did it. I'm sorry for it. I'm not ashamed. Two different things.",2,"d",{hon:1,ego:1},{behaviorFunction:"repair"}],
    ["Saves face for the other person first","Offers the other party a dignified exit before pressing the point.","I'm sure you had every reason. Shall we say it was a misunderstanding?",2,"u",{man:1},{behaviorFunction:"protect"}],
    ["Blames the weather, the post, the train","Always supplies a neutral cause so no one needs to be blamed or ashamed.","It's the post, isn't it. Always the post. Nobody's fault.",3,"c",{hon:-1,pos:1},{behaviorFunction:"protect"}],
    ["Insists loudly that everything is fine","Cheerfully overrides any hint of conflict by volume alone.","NO problem at all! Absolutely fine! Honestly! Won't hear another word!",5,"c",{vol:1,pos:1,hon:-1},{behaviorFunction:"avoid"}],
    ["Formal until the dispute is over","Switches to full titles and surnames mid-quarrel, and drops them again when peace returns.","Mr. Okafor. I would be grateful if you'd step back. <i>(a week later)</i> Chidi!",2,"s",{form:1,man:1,warm:-1},{behaviorFunction:"control"}],
  ]);
  block(CF, "Concealment", 196500, [
    ["Stonewalls with perfect courtesy","Answers every probe with calm, one-word replies and nothing more.","Mm. Yes. No. Perhaps. Thank you.",2,"c",{emo:-1,vol:-1,asrt:-1,warm:-1},{behaviorFunction:"avoid"}],
    ["Sulks in a spotless kitchen","Shows hurt by tidying obsessively and answering in monosyllables.","I'm fine. <i>(scrubs a clean pan with real conviction)</i>",3,"c",{emo:-1,mood:-1,warm:-1},{behaviorFunction:"signal"}],
    ["Won't let a draft be seen","Withholds nearly finished work until it is flawless, however late, and apologises for the delay.","It isn't ready. It's close. It isn't ready. I'll send it Friday. Maybe.",3,"c",{asrt:-1,ego:-1},{behaviorFunction:"protect"}],
    ["Credits luck for every success","Dismisses wins as accident to avoid being found out as not good enough.","Oh, that was just timing. Anyone would've got it. They'll realise soon.",2,"d",{ego:-1,hon:-1,mood:-1},{behaviorFunction:"protect"}],
    ["Says yes, resents it quietly","Takes on every request with a smile and lets resentment leak out sideways.","Of course! Happy to. <i>(slams a drawer, gently)</i>",3,"c",{asrt:-1,hon:-1},{behaviorFunction:"avoid"}],
    ["Rehearses small talk in advance","Plans light conversation openers so no real feeling or mistake ever shows.","<i>(under her breath)</i> Ask about the dog. Ask about the dog.",1,"d",{asrt:-1},{behaviorFunction:"protect"}],
    ["Pre-apologises for being competent","Opens skilled work with a stream of caveats that prepare the ground for failure.","This is probably wrong, I only had a weekend, it's rough, ignore page two...",3,"c",{asrt:-1,ego:-1,vol:1},{behaviorFunction:"protect"}],
    ["Quietly redoes everything to be sure","Never delegates without checking and re-doing in secret.","Looks great, thanks! <i>(re-formats it at eleven that night)</i>",2,"s",{asrt:-1,mood:-1},{behaviorFunction:"protect"}],
    ["Laughs off the compliment","Meets praise with a deflecting joke and changes the subject quick.","This old thing? Ha! Anyway, who's for another?",3,"c",{ego:-1,vol:1},{behaviorFunction:"avoid"}],
    ["Gives the agreeable answer to be liked","Reads the room and says whatever will please, even about their own tastes.","Oh, I love that film. Have you? Yes. Fantastic. Favourite.",3,"c",{hon:-1,asrt:-1},{behaviorFunction:"connect"}],
    ["Overshares trivia to dodge the real subject","Hides in a stream of harmless facts and personal minutiae.","I had toast. Wholemeal. The knife was blunt. I'm fine, anyway.",2,"u",{vol:1,disc:-1,emo:-1},{behaviorFunction:"avoid"}],
    ["Confident aloud, rehearsing doubts in private","Projects total certainty while keeping a mental tally of every possible failure.","Absolutely, it'll work. <i>(adds one more fallback to the list)</i>",3,"u",{ego:1,mood:-1},{behaviorFunction:"protect"}],
  ]);

  block(ROM, "Pining Tells", 196600, [
    ["Rereads one old message","Keeps returning to a single old note and quotes it from memory.","She wrote 'see you soon'. Soon. That's what it says.",1,"s",{emo:1,disc:-1,pos:-1},{behaviorFunction:"soothe"}],
    ["Leaves a place at the table, unmentioned","Lays one extra setting or saves a seat without a word about why.","<i>(sets out a spare cup, puts it back)</i> Force of habit.",2,"d",{emo:1,asrt:-1},{behaviorFunction:"soothe"}],
    ["Gushes at full volume to anyone","Tells every stranger in earshot how wonderful the beloved is.","Have you MET her? She's amazing! Honestly! The best! I'd die for her!",5,"c",{vol:1,emo:1,disc:-1,pos:1},{behaviorFunction:"connect"}],
  ]);


  return out;
})();

TRAITS.push(...TRAITS_GROWTH_D);

TRAIT_PACKS.push({id:"growth", label:"Trait-bank growth (2026 audit §4a category floor)", version:"1", ids:[190000, 199999],
  applicability:{era:"any", realism:"any", tone:"any"}, blurb:"Thin categories grown toward 15 traits each: humour subtypes, conversation mechanics, body, dialect, beliefs, jargon, money, family."});
