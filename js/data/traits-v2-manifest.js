/* The "v2" pack: everything in js/data/traits-v2-*.js. `since: 3` is what hides it from a v1 build (see byFilter in engine.js).
   Turning the pack off under Content packs removes it from every draw, like any other pack. */
TRAIT_PACKS.push({id:"v2", label:"2026 growth (engine v3)", version:"1", ids:[210000, 299999], since:3,
  applicability:{era:"any", realism:"any", tone:"any"},
  blurb:"Larger Motivation pools, new Social Role, Values and Habits categories, new optional sections (persuasion, feedback, decisions, boundaries, hospitality, digital voice and more), and fill for the thinnest poles and cells. Built only by engine v3 seeds."});

/* Slider links for every category the v2 files add (V2.link: axis, pole, section id, {category fragment: S|M|W}).
   Without one a new optional category could only be reached by the type dropdown. Merged into the v2 weight table only. */
(function(){
  const L = V2.link;
  // Social Role in a Group (kind "role")
  L("positivity","pos","role",{"Clown":"M"});            L("confidence","pos","role",{"Rival":"M"});
  L("confidence","neg","role",{"Scapegoat":"M","Newcomer":"M"});
  L("assertiveness","neg","role",{"Scapegoat":"W","Martyr":"W"}); L("assertiveness","pos","role",{"Gatekeeper":"M","Rival":"W"});
  L("agreeableness","neg","role",{"Gatekeeper":"W","Rival":"M"}); L("agreeableness","pos","role",{"Martyr":"M"});
  L("intelligence","pos","role",{"Historian":"M"});      L("curiosity","pos","role",{"Newcomer":"W","Historian":"W"});
  L("discipline","pos","role",{"Lieutenant":"M"});       L("rebelliousness","neg","role",{"Lieutenant":"W"});
  L("emotionalcapacity","pos","role",{"Martyr":"W"});
  // Values & Moral Line (kind "values")
  L("rebelliousness","neg","values",{"Tradition & Rite":"M"}); L("rebelliousness","pos","values",{"Autonomy & Liberty":"M"});
  L("discipline","pos","values",{"Tradition & Rite":"W","Purity & Sanctity":"M"});
  L("agreeableness","neg","values",{"Autonomy & Liberty":"W"}); L("honesty","pos","values",{"Fairness":"M"});
  L("friendliness","pos","values",{"Care & Protection":"M","Hospitality":"M"}); L("emotionalcapacity","pos","values",{"Care & Protection":"W"});
  L("manners","pos","values",{"Hospitality":"W","Purity & Sanctity":"W"});
  // Habits & Vices (kind "vices")
  L("activeness","neg","vices",{"Screens & Notifications":"M"}); L("discipline","neg","vices",{"Screens & Notifications":"W"});
  L("discipline","pos","vices",{"Work & Busyness":"M","Keeping & Collecting":"W"}); L("activeness","pos","vices",{"Work & Busyness":"W"});
  L("curiosity","neg","vices",{"Keeping & Collecting":"W"}); L("friendliness","pos","vices",{"Gossip & Information":"W"});
  L("curiosity","pos","vices",{"Gossip & Information":"M"}); L("honesty","neg","vices",{"Gossip & Information":"W"});
  // Humor
  L("manners","neg","humor",{"Innuendo & Double Meaning":"M"}); L("confidence","pos","humor",{"Innuendo & Double Meaning":"W"});
  // New sections
  L("assertiveness","pos","persuasion",{"Asks & Leverage":"M","Timing & Pressure":"M"}); L("honesty","neg","persuasion",{"Asks & Leverage":"W","Planting & Steering":"M"});
  L("agreeableness","neg","persuasion",{"Timing & Pressure":"W"}); L("intelligence","pos","persuasion",{"Planting & Steering":"M"});
  L("honesty","pos","feedback",{"Giving Criticism":"M"}); L("manners","neg","feedback",{"Giving Criticism":"W"});
  L("confidence","neg","feedback",{"Receiving Criticism":"M","Taking a Compliment":"M"}); L("emotionalcapacity","pos","feedback",{"Receiving Criticism":"W"});
  L("friendliness","pos","feedback",{"Praise & Congratulation":"M"}); L("positivity","pos","feedback",{"Praise & Congratulation":"W"});
  L("agreeableness","pos","decision",{"Slow & Consultative":"M"}); L("discipline","pos","decision",{"Slow & Consultative":"W"});
  L("discipline","neg","decision",{"Fast & Gut":"M"}); L("assertiveness","pos","decision",{"Fast & Gut":"W","Deciding for Others":"M"});
  L("assertiveness","neg","decision",{"Deferred & Avoided":"M"}); L("agreeableness","neg","decision",{"Deciding for Others":"W"});
  L("assertiveness","pos","boundaries",{"Saying No":"M","Defending a No":"M"}); L("assertiveness","neg","boundaries",{"Limits That Leak":"M"});
  L("agreeableness","pos","boundaries",{"Limits That Leak":"W"}); L("friendliness","pos","boundaries",{"Asking & Offering Help":"W"});
  L("confidence","neg","boundaries",{"Asking & Offering Help":"W"});
  L("emotionalcapacity","neg","emotion",{"Hiding Feelings":"M","Substituted Feelings":"M"}); L("emotionalcapacity","pos","emotion",{"Performing Feelings":"M","Grief & Loss Talk":"M"});
  L("positivity","pos","emotion",{"Performing Feelings":"W"}); L("agreeableness","neg","emotion",{"Substituted Feelings":"W"});
  L("friendliness","pos","hospitality",{"Hosting":"M","Giving":"M"}); L("manners","pos","hospitality",{"Being a Guest":"M","Hosting":"W"});
  L("confidence","neg","hospitality",{"Receiving":"M"});
  L("friendliness","pos","greetings",{"Arriving & Greeting":"M","Leaving & Long Goodbyes":"M"}); L("curiosity","pos","greetings",{"Opening Lines":"W"});
  L("discipline","neg","greetings",{"Leaving & Long Goodbyes":"W"}); L("friendliness","neg","greetings",{"Closing Calls & Messages":"M"});
  L("discipline","pos","digital",{"Email & Written Messages":"M"}); L("manners","pos","digital",{"Email & Written Messages":"W"});
  L("friendliness","pos","digital",{"Calls, Voicemail & Video":"W","Texting":"W"}); L("emotionalcapacity","pos","digital",{"Wellness & Therapy-Speak":"M"});
  L("intelligence","pos","digital",{"Wellness & Therapy-Speak":"W"});
  // Conversation Mechanics (kind "conversation")
  L("confidence","pos","conversation",{"Storytelling":"M"}); L("friendliness","pos","conversation",{"Storytelling":"W"});
  L("confidence","neg","conversation",{"Speech Mechanics":"W"}); L("assertiveness","neg","conversation",{"Silence Kinds":"M"});
  L("honesty","neg","conversation",{"Lying Register":"M"}); L("emotionalcapacity","neg","conversation",{"Silence Kinds":"W"});
})();
