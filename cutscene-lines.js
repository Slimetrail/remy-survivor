// Between-town cutscene lines. ONE entry per transition; id = the town you are driving INTO.
// Lines written by Jeremy (exact wording). While it is still a placeholder
// Optional who:'Radio' changes the speaker label (default Remy).
// (anything wrapped in [ ] or empty), the game shows "..." in the bubble and says nothing.
// A real line is shown in the bubble and spoken aloud (unless the game is muted).
window.CUT_LINES=[
 {id:'crestview',   caption:'CRESTVIEW',   line:"Finally! Some food. Oh no, Almond Joy!"}, // Niceville -> Crestview: gas station at dusk
 {id:'tallahassee', caption:'TALLAHASSEE', line:"Wow, not much changed!"}, // Crestview -> Tallahassee: road sign, burning city
 {id:'valdosta',    caption:'VALDOSTA',    line:"Lets play floor is lava"}, // Tallahassee -> Valdosta: helping a survivor over a car roof
 {id:'waycross',    caption:'WAYCROSS',    line:"Hi boy, you look like Gravy!"}, // Valdosta -> Waycross: stray dog on the road
 {id:'savannah',    caption:'SAVANNAH',    line:"This place was dead Before the Apocalypse."}, // Waycross -> Savannah: night bridge, helicopter
 {id:'charleston',  caption:'CHARLESTON',  who:'Radio', line:"Remy!? If you hear this, we love you son!"}, // Savannah -> Charleston: roadside shop radio
 {id:'kingstree',   caption:'KINGSTREE',   line:"Haha! Whats up slim."}, // Charleston -> Kingstree: old cap on a fence post
 {id:'florence',    caption:'FLORENCE',    line:"Looks like someone put up a fight."}, // Kingstree -> Florence: military roadblock
 {id:'pamplico',    caption:'PAMPLICO',    line:"Hang in there, Mom and Dad. I'm almost home!"}  // Florence -> Pamplico: hometown sign, lit window
];
